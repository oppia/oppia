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


class OnceIterable(Generic[T]):
    """Wraps a list so that it can be iterated over exactly once.

    NOTE: A second iteration raises instead of yielding nothing, so that code
    which reads the values twice fails loudly instead of seeing no values.
    """

    def __init__(self, items: List[T]) -> None:
        self._items: abc.Iterator[T] | None = iter(items)

    def __iter__(self) -> abc.Iterator[T]:
        if self._items is None:
            raise RuntimeError('OnceIterable can only be iterated over once')
        items, self._items = self._items, None
        return items


# Here we use MyPy ignore because beam does not provide API types.
class IterableCoGroupByKey(beam.CoGroupByKey):  # type: ignore[misc]
    """A CoGroupByKey that groups values into iterables instead of lists.

    NOTE: Beam only promises iterables, but the direct runner gives lists. Code
    that treats the values as lists would pass the tests without this.
    """

    def expand(
        self, pcolls: Dict[str, beam.PCollection[Tuple[str, T]]]
    ) -> beam.PCollection[Tuple[str, Dict[str, OnceIterable[T]]]]:
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
                    tag: OnceIterable(list(values))
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

        auth_models.UserAuthDetailsModel(
            id=user_id,
            firebase_auth_id=firebase_auth_id,
            parent_user_id=parent_user_id,
            deleted=deleted,
        ).put()

    def put_settings_model(
        self,
        user_id: str,
        email: str | None = None,
        deleted: bool = False,
    ) -> None:
        """Writes a UserSettingsModel."""

        user_models.UserSettingsModel(
            id=user_id,
            email=f'{user_id}@example.com' if email is None else email,
            deleted=deleted,
        ).put()

    def put_reverse_model(
        self, auth_id: str, user_id: str, deleted: bool = False
    ) -> None:
        """Writes a UserIdByFirebaseAuthIdModel."""

        auth_models.UserIdByFirebaseAuthIdModel(
            id=auth_id,
            user_id=user_id,
            deleted=deleted,
        ).put()

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

    def test_stray_reverse_model_is_replaced_by_missing_one(self) -> None:
        self.put_auth_model('uid_a', FB_A)
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stdout('PUT SUCCESS: 1'),
                stdout('DEL SUCCESS: 1'),
            ]
        )
        self.assert_repaired('uid_a', FB_A)
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id('fb_x')
        )

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

    def test_email_shared_with_deleted_user_is_reported(self) -> None:
        # NOTE: FirebaseServerSyncJob syncs deleted users as disabled accounts,
        # so their emails still collide.
        self.put_settings_model('uid_a', email='x@x.com')
        self.put_settings_model('uid_d', email='x@x.com', deleted=True)

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr('ERR: UserSettingsModel(id=uid_a) is sharing an email'),
                stderr('ERR: UserSettingsModel(id=uid_d) is sharing an email'),
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))

    def test_users_claiming_same_auth_id_are_reported(self) -> None:
        # NOTE: Both users claim fb_x, so repairing uid_b would take
        # UserIdByFirebaseAuthIdModel(id=fb_x) away from uid_a.
        self.put_healthy_user('uid_a', 'fb_x')
        self.put_auth_model('uid_b', 'fb_x')
        self.put_settings_model('uid_b')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_b) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get('fb_x')
        self.assertEqual(reverse_model.user_id, 'uid_a')

    def test_auth_id_claimed_by_deleted_auth_model_is_reported(self) -> None:
        # NOTE: The deleted model still claims the ID, so it isn't safe to give
        # it to another user.
        self.put_auth_model('uid_d', 'fb_x', deleted=True)
        self.put_settings_model('uid_d', deleted=True)
        self.put_auth_model('uid_a', 'fb_x')
        self.put_settings_model('uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_d) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNone(reverse_model_class.get_by_id('fb_x'))

    def test_user_with_deleted_auth_model_is_reported_unchanged(self) -> None:
        # NOTE: FirebaseServerSyncJob can't tell whether a user whose models
        # disagree is deleted, so they're left for manual reconciliation.
        self.put_auth_model('uid_a', 'fb_a', deleted=True)
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: UserAuthDetailsModel(id=uid_a) and '
                    'UserSettingsModel(id=uid_a) disagree on whether the user '
                    'is deleted'
                ),
            ]
        )
        auth_model = auth_models.UserAuthDetailsModel.get_by_id('uid_a')
        self.assertTrue(auth_model.deleted)
        self.assertEqual(auth_model.firebase_auth_id, 'fb_a')
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNone(reverse_model_class.get_by_id('fb_a'))
        self.assertIsNone(reverse_model_class.get_by_id(FB_A))
        self.assertIsNotNone(reverse_model_class.get_by_id('fb_x'))

    def test_deleted_profile_is_skipped(self) -> None:
        self.put_auth_model('uid_p', parent_user_id='uid_a', deleted=True)
        self.put_settings_model('uid_p')

        self.assert_job_output_is([stdout('OK 0')])
        auth_model = auth_models.UserAuthDetailsModel.get_by_id('uid_p')
        self.assertTrue(auth_model.deleted)
        self.assertEqual(auth_model.parent_user_id, 'uid_a')

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

    def test_lone_reverse_model_of_user_without_auth_model_is_adopted(
        self,
    ) -> None:
        # NOTE: The Firebase account fb_x still signs in as uid_a, so it becomes
        # uid_a's firebase_auth_id instead of a generated ID.
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        self.assert_repaired('uid_a', 'fb_x')
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNone(reverse_model_class.get_by_id(FB_A))

    def test_lone_reverse_model_of_user_with_empty_auth_id_is_adopted(
        self,
    ) -> None:
        self.put_auth_model('uid_a', '')
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        self.assert_repaired('uid_a', 'fb_x')

    def test_reverse_models_of_user_without_auth_id_are_reported(
        self,
    ) -> None:
        # NOTE: Either Firebase account may be the real one, so the job can't
        # choose between them.
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_x', 'uid_a')
        self.put_reverse_model('fb_y', 'uid_a')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: UserAuthDetailsModel(id=uid_a) has no '
                    'firebase_auth_id, but UserIdByFirebaseAuthIdModel(id=fb_x, '
                    'fb_y) point to it'
                ),
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertEqual(reverse_model_class.get('fb_x').user_id, 'uid_a')
        self.assertEqual(reverse_model_class.get('fb_y').user_id, 'uid_a')

    def test_deleted_user_is_ok(self) -> None:
        self.put_auth_model('uid_d', 'fb_d', deleted=True)
        self.put_settings_model('uid_d', deleted=True)
        self.put_reverse_model('fb_d', 'uid_d', deleted=True)

        self.assert_job_output_is([stdout('OK 1')])

    def test_deleted_user_gets_deleted_reverse_model(self) -> None:
        # NOTE: Models created for a deleted user are tombstones too, so that
        # FirebaseServerSyncJob keeps the Firebase account disabled.
        self.put_auth_model('uid_d', 'fb_d', deleted=True)
        self.put_settings_model('uid_d', deleted=True)

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 1')])
        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get_by_id(
            'fb_d'
        )
        self.assertEqual(reverse_model.user_id, 'uid_d')
        self.assertTrue(reverse_model.deleted)

    def test_deleted_user_without_auth_model_gets_deleted_models(
        self,
    ) -> None:
        self.put_settings_model('uid_a', deleted=True)

        self.assert_job_output_is([stdout('OK 0'), stdout('PUT SUCCESS: 2')])
        auth_model = auth_models.UserAuthDetailsModel.get_by_id('uid_a')
        self.assertEqual(auth_model.firebase_auth_id, FB_A)
        self.assertTrue(auth_model.deleted)
        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get_by_id(FB_A)
        self.assertEqual(reverse_model.user_id, 'uid_a')
        self.assertTrue(reverse_model.deleted)

    def test_deleted_reverse_model_of_live_user_is_reported(self) -> None:
        # NOTE: The user's own models disagree on whether they are deleted, so
        # the job can't tell which one to trust.
        self.put_auth_model('uid_a', 'fb_a')
        self.put_settings_model('uid_a')
        self.put_reverse_model('fb_a', 'uid_a', deleted=True)

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: UserIdByFirebaseAuthIdModel(id=fb_a) and '
                    'UserSettingsModel(id=uid_a) disagree on whether the user '
                    'is deleted'
                ),
            ]
        )
        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get_by_id(
            'fb_a'
        )
        self.assertTrue(reverse_model.deleted)

    def test_deleted_stray_reverse_model_is_deleted(self) -> None:
        self.put_healthy_user('uid_a', 'fb_a')
        self.put_reverse_model('fb_x', 'uid_a', deleted=True)

        self.assert_job_output_is([stdout('OK 0'), stdout('DEL SUCCESS: 1')])
        self.assert_repaired('uid_a', 'fb_a')
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get_by_id('fb_x')
        )

    def test_deleted_reverse_model_of_another_users_auth_id_is_reported(
        self,
    ) -> None:
        # NOTE: Deleted models still claim their ID, so repairing uid_b must not
        # overwrite UserIdByFirebaseAuthIdModel(id=fb_b).
        self.put_healthy_user('uid_a', 'fb_a')
        self.put_reverse_model('fb_b', 'uid_a', deleted=True)
        self.put_auth_model('uid_b', 'fb_b')
        self.put_settings_model('uid_b')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_b) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        reverse_model = auth_models.UserIdByFirebaseAuthIdModel.get_by_id(
            'fb_b'
        )
        self.assertEqual(reverse_model.user_id, 'uid_a')
        self.assertTrue(reverse_model.deleted)

    def test_reverse_model_of_another_users_auth_id_is_reported(self) -> None:
        # NOTE: The Firebase account fb_b signs in as uid_a, so pointing
        # UserIdByFirebaseAuthIdModel(id=fb_b) to uid_b would sign that account
        # in as uid_b instead.
        self.put_healthy_user('uid_a', 'fb_a')
        self.put_reverse_model('fb_b', 'uid_a')
        self.put_auth_model('uid_b', 'fb_b')
        self.put_settings_model('uid_b')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_b) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertEqual(reverse_model_class.get('fb_b').user_id, 'uid_a')

    def test_reverse_model_of_another_users_generated_id_is_reported(
        self,
    ) -> None:
        # NOTE: The job would give uid_a the generated ID FB_A, but the
        # Firebase account FB_A signs in as uid_b. Repairing uid_a would point
        # UserIdByFirebaseAuthIdModel(id=FB_A) to uid_a instead.
        self.put_settings_model('uid_a')
        self.put_settings_model('uid_b')
        self.put_reverse_model(FB_A, 'uid_b')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_b) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertEqual(reverse_model_class.get(FB_A).user_id, 'uid_b')

    def test_auth_id_matching_another_users_generated_id_is_reported(
        self,
    ) -> None:
        # NOTE: The job would give uid_a the generated ID FB_A, but uid_b
        # already uses it. Repairing uid_a would point
        # UserIdByFirebaseAuthIdModel(id=FB_A) to uid_a instead.
        self.put_settings_model('uid_a')
        self.put_healthy_user('uid_b', FB_A)

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_b) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertEqual(reverse_model_class.get(FB_A).user_id, 'uid_b')

    def test_stray_reverse_model_of_another_users_generated_id_is_kept(
        self,
    ) -> None:
        # NOTE: UserIdByFirebaseAuthIdModel(id=FB_A) is stray for uid_b, and
        # FB_A is the ID the job would give uid_a. Deleting it for uid_b and
        # putting it for uid_a would sign the Firebase account FB_A in as uid_a.
        self.put_settings_model('uid_a')
        self.put_healthy_user('uid_b', 'fb_b')
        self.put_reverse_model(FB_A, 'uid_b')

        self.assert_job_output_is(
            [
                stdout('OK 0'),
                stderr(
                    'ERR: User(id=uid_a) claims the same Firebase auth ID as '
                    'another user'
                ),
                stderr(
                    'ERR: User(id=uid_b) claims the same Firebase auth ID as '
                    'another user'
                ),
            ]
        )
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id('uid_a'))
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertEqual(reverse_model_class.get(FB_A).user_id, 'uid_b')
        self.assertEqual(reverse_model_class.get('fb_b').user_id, 'uid_b')

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
        self.put_healthy_user('uid_a', 'fb_a')
        self.put_reverse_model('fb_x', 'uid_a')

        self.assert_job_output_is(
            [stdout('OK 0'), stdout('WOULD DEL SUCCESS: 1')]
        )
        reverse_model_class = auth_models.UserIdByFirebaseAuthIdModel
        self.assertIsNotNone(reverse_model_class.get_by_id('fb_x'))
