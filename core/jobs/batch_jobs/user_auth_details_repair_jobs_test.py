# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for jobs.batch_jobs.user_auth_details_repair_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_auth_details_repair_jobs
from core.jobs.types import firebase_domain, job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)

# The firebase_auth_ids generated for 'uid_a' and 'uid_b', respectively. They
# are pinned because changing them would make reruns of the repair job assign
# different IDs than earlier runs did.
FB_A = 'sqTIGueuegJe59TSS4G8eWnTiSIc'
FB_B = 'gCwxWz2BUfDbQ9W7u9wRTTwiSWkc'


def stdout(message: str) -> job_run_result.JobRunResult:
    """Returns a job result with the given stdout."""
    return job_run_result.JobRunResult.as_stdout(message)


def stderr(message: str) -> job_run_result.JobRunResult:
    """Returns a job result with the given stderr."""
    return job_run_result.JobRunResult.as_stderr(message)


class RepairMissingUserAuthDetailsJobTestBase(job_test_utils.JobTestBase):
    """Shared setup helpers for the missing UserAuthDetailsModel repair jobs."""

    def put_auth_model(
        self,
        user_id: str,
        firebase_auth_id: str | None = None,
        parent_user_id: str | None = None,
        gae_id: str | None = None,
        deleted: bool = False,
    ) -> None:
        """Writes a UserAuthDetailsModel."""
        self.put_model(
            auth_models.UserAuthDetailsModel,
            id=user_id,
            firebase_auth_id=firebase_auth_id,
            parent_user_id=parent_user_id,
            gae_id=gae_id,
            deleted=deleted,
        )

    def put_settings_model(
        self,
        user_id: str,
        email: str | None = None,
        roles: tuple[str, ...] = (),
        deleted: bool = False,
    ) -> None:
        """Writes a UserSettingsModel."""
        self.put_model(
            user_models.UserSettingsModel,
            id=user_id,
            email=f'{user_id}@example.com' if email is None else email,
            roles=list(roles),
            deleted=deleted,
        )

    def put_reverse_model(
        self, firebase_auth_id: str, user_id: str, deleted: bool = False
    ) -> None:
        """Writes a UserIdByFirebaseAuthIdModel."""
        self.put_model(
            auth_models.UserIdByFirebaseAuthIdModel,
            id=firebase_auth_id,
            user_id=user_id,
            deleted=deleted,
        )

    def put_healthy_user(
        self, user_id: str, firebase_auth_id: str, email: str | None = None
    ) -> None:
        """Writes every model of a user that does not need to be repaired."""
        self.put_auth_model(user_id, firebase_auth_id)
        self.put_settings_model(user_id, email=email)
        self.put_reverse_model(firebase_auth_id, user_id)

    def get_auth_model(
        self, user_id: str
    ) -> auth_models.UserAuthDetailsModel | None:
        """Returns the UserAuthDetailsModel of the given user, if any."""
        return auth_models.UserAuthDetailsModel.get_by_id(user_id)

    def assert_user_is_repaired(
        self, user_id: str, firebase_auth_id: str
    ) -> None:
        """Asserts that the given user was repaired with the given ID, and that
        FirebaseServerSyncJob can now rebuild its Firebase record.

        Args:
            user_id: str. The Oppia user ID of the user.
            firebase_auth_id: str. The Firebase UID the user should have.
        """
        auth_model = self.get_auth_model(user_id)
        assert auth_model is not None
        self.assertEqual(auth_model.firebase_auth_id, firebase_auth_id)
        self.assertFalse(auth_model.deleted)

        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get_by_id(
            firebase_auth_id
        )
        self.assertIsNotNone(reverse_model)
        self.assertEqual(reverse_model.user_id, user_id)
        self.assertFalse(reverse_model.deleted)

        self.assertEqual(
            firebase_domain.FirebaseRecord.from_oppia_models(
                auth_model, user_models.UserSettingsModel.get_by_id(user_id)
            ),
            firebase_domain.FirebaseRecord(
                auth_id=firebase_auth_id,
                email=f'{user_id}@example.com',
                disabled=False,
            ),
        )

    def assert_firebase_auth_id_is_unassigned(
        self, firebase_auth_id: str
    ) -> None:
        """Asserts that no UserIdByFirebaseAuthIdModel uses the given ID."""
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id(firebase_auth_id)
        )


class RepairMissingUserAuthDetailsJobTests(
    RepairMissingUserAuthDetailsJobTestBase
):
    JOB_CLASS = user_auth_details_repair_jobs.RepairMissingUserAuthDetailsJob

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_healthy_user_is_ok(self) -> None:
        self.put_healthy_user('uid_a', 'fb_a')

        self.assert_job_output_is([stdout('OK SUCCESS: 1')])

    def test_previously_repaired_user_is_ok(self) -> None:
        self.put_healthy_user('uid_a', FB_A)

        self.assert_job_output_is([stdout('OK SUCCESS: 1')])

    def test_profile_user_is_ok(self) -> None:
        self.put_auth_model('uid_p', parent_user_id='uid_a')
        self.put_settings_model('uid_p')

        self.assert_job_output_is([stdout('OK SUCCESS: 1')])

    def test_profile_user_missing_auth_model_is_ok(self) -> None:
        # NOTE: Profile users have no Firebase account, so they don't need a
        # UserAuthDetailsModel for FirebaseServerSyncJob to sync them.
        self.put_settings_model('uid_p', roles=(feconf.ROLE_ID_MOBILE_LEARNER,))

        self.assert_job_output_is([stdout('OK SUCCESS: 1')])
        self.assertIsNone(self.get_auth_model('uid_p'))

    def test_missing_auth_model_is_created(self) -> None:
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('PUT SUCCESS: 2')])
        self.assert_user_is_repaired('uid_a', FB_A)

    def test_missing_firebase_auth_id_is_filled_in(self) -> None:
        self.put_auth_model('uid_a', gae_id='gae_a')
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('PUT SUCCESS: 2')])
        self.assert_user_is_repaired('uid_a', FB_A)
        auth_model = self.get_auth_model('uid_a')
        assert auth_model is not None
        self.assertEqual(auth_model.gae_id, 'gae_a')

    def test_interrupted_repair_missing_auth_model_is_finished(self) -> None:
        self.put_settings_model('uid_a')
        self.put_reverse_model(FB_A, 'uid_a')

        self.assert_job_output_is([stdout('PUT SUCCESS: 1')])
        self.assert_user_is_repaired('uid_a', FB_A)

    def test_interrupted_repair_missing_reverse_model_is_finished(
        self,
    ) -> None:
        self.put_auth_model('uid_a', FB_A)
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('PUT SUCCESS: 1')])
        self.assert_user_is_repaired('uid_a', FB_A)

    def test_user_missing_settings_model_is_reported_not_deleted(
        self,
    ) -> None:
        self.put_auth_model('uid_a', 'fb_a')
        self.put_reverse_model('fb_a', 'uid_a')

        self.assert_job_output_is(
            [stderr('uid_a is missing its UserSettingsModel')]
        )
        self.assertIsNotNone(self.get_auth_model('uid_a'))

    def test_user_with_only_reverse_model_is_reported(self) -> None:
        self.put_reverse_model('fb_a', 'uid_a')

        self.assert_job_output_is(
            [stderr('uid_a is missing its UserSettingsModel')]
        )

    def test_deleted_auth_model_is_reported_not_repaired(self) -> None:
        self.put_auth_model('uid_a', deleted=True)
        self.put_settings_model('uid_a')

        self.assert_job_output_is(
            [stderr('uid_a has a deleted UserAuthDetailsModel')]
        )
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_deleted_settings_model_is_reported_not_repaired(self) -> None:
        self.put_settings_model('uid_a', deleted=True)

        self.assert_job_output_is(
            [stderr('uid_a has a deleted UserSettingsModel')]
        )
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_other_reverse_model_is_reported_not_repaired(self) -> None:
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_a', 'uid_a')

        self.assert_job_output_is(
            [stderr('uid_a has unexpected UserIdByFirebaseAuthIdModels')]
        )
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_deleted_reverse_model_is_reported_not_repaired(self) -> None:
        self.put_settings_model('uid_a')
        self.put_reverse_model(FB_A, 'uid_a', deleted=True)

        self.assert_job_output_is(
            [stderr('uid_a has unexpected UserIdByFirebaseAuthIdModels')]
        )

    def test_email_shared_with_full_user_is_reported_not_repaired(
        self,
    ) -> None:
        # NOTE: The emails differ by case because Firebase stores emails in
        # lowercase, so they still collide in FirebaseServerSyncJob.
        self.put_healthy_user('uid_h', 'fb_h', email='x@x.com')
        self.put_settings_model('uid_a', email='X@x.com')

        self.assert_job_output_is(
            [
                stdout('OK SUCCESS: 1'),
                stderr('uid_a shares its email with another user'),
            ]
        )
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_email_shared_with_profile_user_is_repaired(self) -> None:
        # NOTE: Profile users share their parent's email, but they never get
        # a Firebase account, so they can't collide with the repaired user.
        self.put_settings_model('uid_a', email='x@x.com')
        self.put_settings_model(
            'uid_p', email='x@x.com', roles=(feconf.ROLE_ID_MOBILE_LEARNER,)
        )

        self.assert_job_output_is(
            [stdout('OK SUCCESS: 1'), stdout('PUT SUCCESS: 2')]
        )

    def test_email_shared_with_deleted_user_is_repaired(self) -> None:
        self.put_settings_model('uid_a', email='x@x.com')
        self.put_settings_model('uid_d', email='x@x.com', deleted=True)

        self.assert_job_output_is(
            [
                stdout('PUT SUCCESS: 2'),
                stderr('uid_d has a deleted UserSettingsModel'),
            ]
        )

    def test_healthy_users_sharing_email_are_ok(self) -> None:
        # NOTE: Existing collisions are reported by FirebaseServerSyncJob, so
        # users that don't need repairs are left alone.
        self.put_healthy_user('uid_a', 'fb_a', email='x@x.com')
        self.put_healthy_user('uid_b', 'fb_b', email='x@x.com')

        self.assert_job_output_is([stdout('OK SUCCESS: 2')])

    def test_mixed_run_repairs_each_user_independently(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')
        self.put_settings_model('uid_a')
        self.put_auth_model('uid_b', '')
        self.put_settings_model('uid_b')
        self.put_reverse_model('fb_o', 'uid_o')

        self.assert_job_output_is(
            [
                stdout('OK SUCCESS: 1'),
                stdout('PUT SUCCESS: 4'),
                stderr('uid_o is missing its UserSettingsModel'),
            ]
        )
        self.assert_user_is_repaired('uid_a', FB_A)
        self.assert_user_is_repaired('uid_b', FB_B)


class AuditMissingUserAuthDetailsJobTests(
    RepairMissingUserAuthDetailsJobTestBase
):
    JOB_CLASS = user_auth_details_repair_jobs.AuditMissingUserAuthDetailsJob

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_repairs_are_reported_without_putting_models(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')
        self.put_settings_model('uid_a')
        self.put_auth_model('uid_b', '')
        self.put_settings_model('uid_b')
        self.put_reverse_model('fb_o', 'uid_o')

        self.assert_job_output_is(
            [
                stdout('OK SUCCESS: 1'),
                stdout('WOULD PUT SUCCESS: 4'),
                stderr('uid_o is missing its UserSettingsModel'),
            ]
        )
        self.assertIsNone(self.get_auth_model('uid_a'))
        auth_model = self.get_auth_model('uid_b')
        assert auth_model is not None
        self.assertEqual(auth_model.firebase_auth_id, '')
        self.assert_firebase_auth_id_is_unassigned(FB_A)
        self.assert_firebase_auth_id_is_unassigned(FB_B)
