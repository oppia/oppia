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

from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_auth_details_repair_jobs
from core.jobs.transforms import firebase_transforms_test
from core.jobs.types import firebase_domain, job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)

# The firebase_auth_ids that the repair deterministically generates for 'uid_a'
# and 'uid_b', respectively.
FB_A = firebase_transforms_test.FB_A
FB_B = firebase_transforms_test.FB_B

ORPHAN_PROBLEM = job_run_result.JobRunResult.as_stderr(
    'PROBLEMS: user_id=\'uid_o\' is missing its UserSettingsModel, but it '
    'still has a UserAuthDetailsModel and UserIdByFirebaseAuthIdModels '
    '(firebase_auth_ids=[\'fb_o\'])'
)


class RepairMissingUserAuthDetailsJobTestBase(job_test_utils.JobTestBase):
    """Shared setup helpers for the missing UserAuthDetailsModel repair jobs."""

    def put_user_auth_details_model(
        self,
        user_id: str,
        firebase_auth_id: str | None,
        deleted: bool = False,
    ) -> None:
        """Writes a UserAuthDetailsModel.

        Args:
            user_id: str. The Oppia user ID of the model.
            firebase_auth_id: str | None. The Firebase UID for the user.
            deleted: bool. Whether the model is soft-deleted.
        """
        self.put_multi(
            [
                self.create_model(
                    auth_models.UserAuthDetailsModel,
                    id=user_id,
                    firebase_auth_id=firebase_auth_id,
                    deleted=deleted,
                )
            ]
        )

    def put_user_settings_model(
        self, user_id: str, deleted: bool = False
    ) -> None:
        """Writes a UserSettingsModel.

        Args:
            user_id: str. The Oppia user ID of the model.
            deleted: bool. Whether the model is soft-deleted.
        """
        self.put_multi(
            [
                self.create_model(
                    user_models.UserSettingsModel,
                    id=user_id,
                    email=f'{user_id}@example.com',
                    deleted=deleted,
                )
            ]
        )

    def put_user_id_by_firebase_auth_id_model(
        self, firebase_auth_id: str, user_id: str, deleted: bool = False
    ) -> None:
        """Writes a UserIdByFirebaseAuthIdModel.

        Args:
            firebase_auth_id: str. The Firebase UID keying the model.
            user_id: str. The Oppia user ID that the model maps to.
            deleted: bool. Whether the model is soft-deleted.
        """
        self.put_multi(
            [
                self.create_model(
                    auth_models.UserIdByFirebaseAuthIdModel,
                    id=firebase_auth_id,
                    user_id=user_id,
                    deleted=deleted,
                )
            ]
        )

    def put_healthy_user(self, user_id: str, firebase_auth_id: str) -> None:
        """Writes every model of a user that does not need to be repaired.

        Args:
            user_id: str. The Oppia user ID of the user.
            firebase_auth_id: str. The Firebase UID for the user.
        """
        self.put_user_auth_details_model(user_id, firebase_auth_id)
        self.put_user_settings_model(user_id)
        self.put_user_id_by_firebase_auth_id_model(firebase_auth_id, user_id)

    def put_orphaned_user(self) -> None:
        """Writes the auth models of 'uid_o', which has no UserSettingsModel."""
        self.put_user_auth_details_model('uid_o', 'fb_o')
        self.put_user_id_by_firebase_auth_id_model('fb_o', 'uid_o')

    def assert_user_is_repaired(
        self, user_id: str, firebase_auth_id: str
    ) -> None:
        """Asserts that the given user was repaired with the given ID.

        Args:
            user_id: str. The Oppia user ID of the user.
            firebase_auth_id: str. The Firebase UID the user should have.
        """
        user_auth_details_model = auth_models.UserAuthDetailsModel.get_by_id(
            user_id
        )
        self.assertIsNotNone(user_auth_details_model)
        self.assertEqual(
            user_auth_details_model.firebase_auth_id, firebase_auth_id
        )
        self.assertIsNone(user_auth_details_model.parent_user_id)
        self.assertFalse(user_auth_details_model.deleted)

        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get_by_id(
            firebase_auth_id
        )
        self.assertIsNotNone(reverse_model)
        self.assertEqual(reverse_model.user_id, user_id)
        self.assertFalse(reverse_model.deleted)

        # The repair exists so that the sync job can rebuild the user's
        # Firebase record, so that is verified as well.
        self.assertEqual(
            firebase_domain.FirebaseRecord.from_oppia_models(
                user_auth_details_model,
                user_models.UserSettingsModel.get_by_id(user_id),
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
        """Asserts that no UserIdByFirebaseAuthIdModel uses the given ID.

        Args:
            firebase_auth_id: str. The Firebase UID to check.
        """
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id(firebase_auth_id)
        )


class RepairMissingUserAuthDetailsJobTests(
    RepairMissingUserAuthDetailsJobTestBase
):
    JOB_CLASS = user_auth_details_repair_jobs.RepairMissingUserAuthDetailsJob

    def test_empty_storage_produces_no_output(self) -> None:
        self.assert_job_output_is_empty()

    def test_healthy_user_is_left_unchanged(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('OK: 1')]
        )
        self.assertEqual(
            auth_models.UserAuthDetailsModel.get_by_id(
                'uid_h'
            ).firebase_auth_id,
            'fb_h',
        )

    def test_missing_user_auth_details_model_is_created(self) -> None:
        self.put_user_settings_model('uid_a')

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('PUT SUCCESS: 2')]
        )
        self.assert_user_is_repaired('uid_a', FB_A)

    def test_empty_firebase_auth_id_is_filled_in(self) -> None:
        self.put_user_auth_details_model('uid_a', None)
        self.put_user_settings_model('uid_a')

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('PUT SUCCESS: 2')]
        )
        self.assert_user_is_repaired('uid_a', FB_A)

    def test_orphaned_user_is_reported_not_deleted(self) -> None:
        self.put_orphaned_user()

        self.assert_job_output_is([ORPHAN_PROBLEM])
        self.assertIsNotNone(
            auth_models.UserAuthDetailsModel.get_by_id('uid_o')
        )
        self.assertIsNotNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id('fb_o')
        )

    def test_deleted_user_auth_details_model_is_not_replaced(self) -> None:
        self.put_user_auth_details_model('uid_a', None, deleted=True)
        self.put_user_settings_model('uid_a')

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'PROBLEMS: user_id=\'uid_a\' is missing its '
                    'firebase_auth_id, but its UserAuthDetailsModel is '
                    'marked deleted'
                )
            ]
        )
        user_auth_details_model = auth_models.UserAuthDetailsModel.get_by_id(
            'uid_a'
        )
        self.assertIsNone(user_auth_details_model.firebase_auth_id)
        self.assertTrue(user_auth_details_model.deleted)
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_deleted_user_settings_model_is_not_repaired(self) -> None:
        self.put_user_settings_model('uid_a', deleted=True)

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'PROBLEMS: user_id=\'uid_a\' is missing its '
                    'UserAuthDetailsModel, but its UserSettingsModel is '
                    'marked deleted'
                )
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_deleted_reverse_model_blocks_repair(self) -> None:
        self.put_user_settings_model('uid_a')
        self.put_user_id_by_firebase_auth_id_model(
            'fb_old', 'uid_a', deleted=True
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'PROBLEMS: user_id=\'uid_a\' is missing its '
                    'UserAuthDetailsModel, but UserIdByFirebaseAuthIdModels '
                    'already map to it (firebase_auth_ids=[\'fb_old\'])'
                )
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_mixed_run_applies_every_repair(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')
        self.put_user_settings_model('uid_a')
        self.put_user_auth_details_model('uid_b', '')
        self.put_user_settings_model('uid_b')
        self.put_orphaned_user()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout('OK: 1'),
                job_run_result.JobRunResult.as_stdout('PUT SUCCESS: 4'),
                ORPHAN_PROBLEM,
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

    def test_healthy_user_is_reported(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('OK: 1')]
        )

    def test_missing_user_auth_details_model_is_reported_not_created(
        self,
    ) -> None:
        self.put_user_settings_model('uid_a')

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD PUT SUCCESS: 2')]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_empty_firebase_auth_id_is_reported_not_filled_in(self) -> None:
        self.put_user_auth_details_model('uid_a', None)
        self.put_user_settings_model('uid_a')

        self.assert_job_output_is(
            [job_run_result.JobRunResult.as_stdout('WOULD PUT SUCCESS: 2')]
        )
        self.assertIsNone(
            auth_models.UserAuthDetailsModel.get_by_id('uid_a').firebase_auth_id
        )
        self.assert_firebase_auth_id_is_unassigned(FB_A)

    def test_orphaned_user_is_reported(self) -> None:
        self.put_orphaned_user()

        self.assert_job_output_is([ORPHAN_PROBLEM])

    def test_mixed_run_reports_counts_without_mutating(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')
        self.put_user_settings_model('uid_a')
        self.put_user_auth_details_model('uid_b', '')
        self.put_user_settings_model('uid_b')
        self.put_orphaned_user()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout('OK: 1'),
                job_run_result.JobRunResult.as_stdout('WOULD PUT SUCCESS: 4'),
                ORPHAN_PROBLEM,
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        self.assertEqual(
            auth_models.UserAuthDetailsModel.get_by_id(
                'uid_b'
            ).firebase_auth_id,
            '',
        )
        self.assert_firebase_auth_id_is_unassigned(FB_A)
        self.assert_firebase_auth_id_is_unassigned(FB_B)
