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

from collections import abc

from core.jobs import job_test_utils
from core.jobs.batch_jobs import user_auth_details_repair_jobs
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, Generic, List, Tuple, TypeVar

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)

# The IDs generated for 'uid_a' and 'uid_b'. They must never change, or reruns
# of the job would give users different IDs.
FB_A = 'sqTIGueuegJe59TSS4G8eWnTiSIc'
FB_B = 'gCwxWz2BUfDbQ9W7u9wRTTwiSWkc'


T = TypeVar('T')


class OnlyIterable(Generic[T]):
    """Wraps a list so that only iterating over it works."""

    def __init__(self, items: List[T]) -> None:
        self._items = items

    def __iter__(self) -> abc.Iterator[T]:
        return iter(self._items)


# Here we use MyPy ignore because beam does not provide API types.
class IterableCoGroupByKey(beam.CoGroupByKey):  # type: ignore[misc]
    """A CoGroupByKey that groups values into iterables instead of lists.

    NOTE: Beam only promises iterables, but the direct runner gives lists. Code
    that treats the values as lists would pass the tests without this.
    """

    def expand(
        self, pcolls: Dict[str, beam.PCollection[Tuple[str, T]]]
    ) -> beam.PCollection[Tuple[str, Dict[str, OnlyIterable[T]]]]:
        """Groups the values of each key by tag, like CoGroupByKey.

        Args:
            pcolls: dict(str, PCollection). The keyed values of each tag.

        Returns:
            PCollection. Each key with its values grouped by tag.
        """
        return super().expand(pcolls) | 'Hide lists' >> beam.MapTuple(
            lambda key, values_by_tag: (
                key,
                {
                    tag: OnlyIterable(list(values))
                    for tag, values in values_by_tag.items()
                },
            )
        )


def stdout(message: str) -> job_run_result.JobRunResult:
    """Returns a job result with the given stdout."""
    return job_run_result.JobRunResult.as_stdout(message)


def stderr(message: str) -> job_run_result.JobRunResult:
    """Returns a job result with the given stderr."""
    return job_run_result.JobRunResult.as_stderr(message)


class RepairJobTestBase(job_test_utils.JobTestBase):
    """Shared helpers for the repair job tests."""

    def run_job(self) -> beam.PCollection[job_run_result.JobRunResult]:
        with self.swap(beam, 'CoGroupByKey', IterableCoGroupByKey):
            return super().run_job()

    def put_auth_model(
        self,
        user_id: str,
        firebase_auth_id: str | None = None,
        parent_user_id: str | None = None,
        deleted: bool = False,
    ) -> None:
        """Writes a UserAuthDetailsModel."""
        self.put_model(
            auth_models.UserAuthDetailsModel,
            id=user_id,
            firebase_auth_id=firebase_auth_id,
            parent_user_id=parent_user_id,
            deleted=deleted,
        )

    def put_settings_model(
        self,
        user_id: str,
        email: str | None = None,
        deleted: bool = False,
    ) -> None:
        """Writes a UserSettingsModel."""
        self.put_model(
            user_models.UserSettingsModel,
            id=user_id,
            email=f'{user_id}@example.com' if email is None else email,
            deleted=deleted,
        )

    def put_reverse_model(
        self, auth_id: str, user_id: str, deleted: bool = False
    ) -> None:
        """Writes a UserIdByFirebaseAuthIdModel."""
        self.put_model(
            auth_models.UserIdByFirebaseAuthIdModel,
            id=auth_id,
            user_id=user_id,
            deleted=deleted,
        )

    def put_healthy_user(
        self, user_id: str, auth_id: str, email: str | None = None
    ) -> None:
        """Writes every model of a user that does not need to be repaired."""
        self.put_auth_model(user_id, auth_id)
        self.put_settings_model(user_id, email=email)
        self.put_reverse_model(auth_id, user_id)

    def assert_repaired(self, user_id: str, auth_id: str) -> None:
        """Asserts that the user has live auth models that use the given ID."""
        auth_model = auth_models.UserAuthDetailsModel.get(user_id)
        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get(auth_id)
        self.assertEqual(auth_model.firebase_auth_id, auth_id)
        self.assertEqual(reverse_model.user_id, user_id)


class RepairMissingUserAuthDetailsJobTests(RepairJobTestBase):
    JOB_CLASS = user_auth_details_repair_jobs.RepairMissingUserAuthDetailsJob

    def test_empty_storage_reports_zero_ok_users(self) -> None:
        self.assert_job_output_is([stdout('OK 0')])

    def test_healthy_user_is_ok(self) -> None:
        self.put_healthy_user('uid_a', 'fb_a')

        self.assert_job_output_is([stdout('OK 1')])

    def test_previously_repaired_user_is_ok(self) -> None:
        self.put_healthy_user('uid_a', FB_A)

        self.assert_job_output_is([stdout('OK 1')])

    def test_stray_reverse_model_of_linked_user_is_deleted(self) -> None:
        self.put_healthy_user('uid_a', FB_A)
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('DEL SUCCESS: 1')])
        self.assert_repaired('uid_a', FB_A)
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id('fb_x')
        )

    def test_missing_auth_model_is_created(self) -> None:
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 2')])
        self.assert_repaired('uid_a', FB_A)

    def test_missing_firebase_auth_id_is_filled_in(self) -> None:
        self.put_auth_model('uid_a')
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 2')])
        self.assert_repaired('uid_a', FB_A)

    def test_missing_auth_model_with_reverse_model_is_created(self) -> None:
        self.put_settings_model('uid_a')
        self.put_reverse_model(FB_A, 'uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        self.assert_repaired('uid_a', FB_A)

    def test_missing_firebase_auth_id_with_reverse_model_is_filled_in(
        self,
    ) -> None:
        self.put_auth_model('uid_a')
        self.put_settings_model('uid_a')
        self.put_reverse_model(FB_A, 'uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        self.assert_repaired('uid_a', FB_A)

    def test_missing_reverse_model_is_created(self) -> None:
        self.put_auth_model('uid_a', FB_A)
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        self.assert_repaired('uid_a', FB_A)

    def test_missing_settings_model_is_reported(self) -> None:
        self.put_auth_model('uid_a', 'fb_a')
        self.put_reverse_model('fb_a', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_a) is missing an email'),
            ]
        )

    def test_user_with_only_reverse_model_is_reported(self) -> None:
        self.put_reverse_model('fb_a', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_a) is missing an email'),
            ]
        )

    def test_email_shared_with_full_user_is_reported(self) -> None:
        # NOTE: Firebase ignores case, so these emails are the same.
        self.put_healthy_user('uid_h', 'fb_h', email='x@x.com')
        self.put_settings_model('uid_a', email='X@x.com')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_h) is sharing an email'),
                stderr('ERR: UserSettingsModel(id=uid_a) is sharing an email'),
            ]
        )

    def test_repairable_users_sharing_email_are_reported(self) -> None:
        self.put_settings_model('uid_a', email='x@x.com')
        self.put_settings_model('uid_b', email='x@x.com')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_a) is sharing an email'),
                stderr('ERR: UserSettingsModel(id=uid_b) is sharing an email'),
            ]
        )

    def test_email_shared_with_profile_is_repaired(self) -> None:
        # NOTE: Profiles share their parent's email but have no Firebase
        # account, so they can't collide.
        self.put_settings_model('uid_a', email='x@x.com')
        self.put_auth_model('uid_p', parent_user_id='uid_a')
        self.put_settings_model('uid_p', email='x@x.com')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 2')])
        self.assert_repaired('uid_a', FB_A)

    def test_email_shared_with_deleted_user_is_repaired(self) -> None:
        # NOTE: Deleted models are ignored, so they can't collide.
        self.put_settings_model('uid_a', email='x@x.com')
        self.put_settings_model('uid_d', email='x@x.com', deleted=True)

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 2')])
        self.assert_repaired('uid_a', FB_A)

    def test_healthy_users_sharing_email_are_reported(self) -> None:
        # NOTE: Shared emails block FirebaseServerSyncJob, so they're reported
        # even when the users need no fix.
        self.put_healthy_user('uid_a', 'fb_a', email='x@x.com')
        self.put_healthy_user('uid_b', 'fb_b', email='x@x.com')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_a) is sharing an email'),
                stderr('ERR: UserSettingsModel(id=uid_b) is sharing an email'),
            ]
        )

    def test_mixed_run_repairs_each_user_independently(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')
        self.put_settings_model('uid_a')
        self.put_auth_model('uid_b', '')
        self.put_settings_model('uid_b')
        self.put_reverse_model('fb_o', 'uid_o')

        self.assert_job_output_is(
            [
                stdout('OK 1'),
                stdout('PUT SUCCESS: 4'),
                stderr('ERR: UserSettingsModel(id=uid_o) is missing an email'),
            ]
        )
        self.assert_repaired('uid_a', FB_A)
        self.assert_repaired('uid_b', FB_B)

    def test_job_builds_its_pipeline(self) -> None:
        self.run_job()

    def test_stray_reverse_model_is_deleted(self) -> None:
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stdout('PUT SUCCESS: 2'),
                stdout('DEL SUCCESS: 1'),
            ]
        )
        self.assert_repaired('uid_a', FB_A)
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id('fb_x')
        )

    def test_missing_reverse_model_of_firebase_issued_id_is_created(
        self,
    ) -> None:
        # NOTE: UserIdByFirebaseAuthIdModels are keyed by the user's Firebase
        # auth ID, which is how auth_services finds the user when they log in.
        self.put_auth_model('uid_a', 'fb_a')
        self.put_settings_model('uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        self.assert_repaired('uid_a', 'fb_a')


class AuditMissingUserAuthDetailsJobTests(RepairJobTestBase):
    JOB_CLASS = user_auth_details_repair_jobs.AuditMissingUserAuthDetailsJob

    def test_empty_storage_reports_zero_ok_users(self) -> None:
        self.assert_job_output_is([stdout('OK 0')])

    def test_repairs_are_reported_without_putting_models(self) -> None:
        self.put_healthy_user('uid_h', 'fb_h')
        self.put_settings_model('uid_a')
        self.put_auth_model('uid_b', '')
        self.put_settings_model('uid_b')
        self.put_reverse_model('fb_o', 'uid_o')

        self.assert_job_output_is(
            [
                stdout('OK 1'),
                stdout('WOULD PUT SUCCESS: 4'),
                stderr('ERR: UserSettingsModel(id=uid_o) is missing an email'),
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        auth_model = auth_models.UserAuthDetailsModel.get('uid_b')
        self.assertEqual(auth_model.firebase_auth_id, '')
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNone(reverse_model_class.get_by_id(FB_A))
        self.assertIsNone(reverse_model_class.get_by_id(FB_B))

    def test_missing_reverse_model_is_reported_without_putting_it(self) -> None:
        self.put_auth_model('uid_a', FB_A)
        self.put_settings_model('uid_a')

        self.assert_job_output_is(
            [stdout('OK 0'), stdout('WOULD PUT SUCCESS: 1')]
        )
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNone(reverse_model_class.get_by_id(FB_A))

    def test_users_with_same_uppercase_email_are_reported(self) -> None:
        # NOTE: Both users have exactly the same email, so the case of the
        # letters must not matter to whether they are reported.
        self.put_settings_model('uid_a', email='X@x.com')
        self.put_settings_model('uid_b', email='X@x.com')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_a) is sharing an email'),
                stderr('ERR: UserSettingsModel(id=uid_b) is sharing an email'),
            ]
        )

    def test_stray_reverse_model_is_reported_without_deleting_it(
        self,
    ) -> None:
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stdout('WOULD PUT SUCCESS: 2'),
                stdout('WOULD DEL SUCCESS: 1'),
            ]
        )
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNotNone(reverse_model_class.get_by_id('fb_x'))
