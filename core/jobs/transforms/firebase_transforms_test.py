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

"""Unit tests for jobs.transforms.firebase_transforms."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.transforms import firebase_transforms
from core.jobs.types import firebase_domain
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, base_models, user_models

auth_models, base_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.BASE_MODEL, models.Names.USER]
)

TAG_OK = firebase_transforms.DiffFirebaseRecords.TAG_OK
TAG_ADD = firebase_transforms.DiffFirebaseRecords.TAG_ADD
TAG_DEL = firebase_transforms.DiffFirebaseRecords.TAG_DEL
TAG_OPPIA = firebase_transforms.DiffFirebaseRecords.TAG_OPPIA_USER_COLLISION
TAG_FIREBASE = (
    firebase_transforms.DiffFirebaseRecords.TAG_FIREBASE_ACCOUNT_COLLISION
)

TAG_REPAIR_OK = firebase_transforms.RepairUserAuthDetailsModels.TAG_OK
TAG_PUT = firebase_transforms.RepairUserAuthDetailsModels.TAG_PUT
TAG_PROBLEMS = firebase_transforms.RepairUserAuthDetailsModels.TAG_PROBLEMS

# The Firebase auth IDs generated for user IDs 'uid_a', 'uid_b' and 'uid_c',
# respectively. They are pinned because changing them would make reruns of the
# repair job assign different IDs than earlier runs did.
FB_A = 'sqTIGueuegJe59TSS4G8eWnTiSIc'
FB_B = 'gCwxWz2BUfDbQ9W7u9wRTTwiSWkc'
FB_C = 'dTHofouzkG0AaAKYyLGmpbWri48c'


class DiffFirebaseRecordsTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for DiffFirebaseRecords."""

    TAG_TEST_CASES = (
        ('TAG_OK', 'OK'),
        ('TAG_ADD', 'ADD'),
        ('TAG_DEL', 'DEL'),
        ('TAG_OPPIA_USER_COLLISION', 'OPPIA_USER_COLLISION'),
        ('TAG_FIREBASE_ACCOUNT_COLLISION', 'FIREBASE_ACCOUNT_COLLISION'),
    )

    def test_tag_names(self) -> None:
        for tag_name, expected_value in self.TAG_TEST_CASES:
            with self.subTest(f'{tag_name} == {expected_value!r}'):
                self.assertEqual(
                    getattr(firebase_transforms.DiffFirebaseRecords, tag_name),
                    expected_value,
                )

    def test_diff_with_no_records_produces_no_output(self) -> None:
        self.assert_pcoll_empty(self.run_diff([], []))

    def test_diff_with_identical_records_reports_ok_count(self) -> None:
        records = [
            firebase_domain.FirebaseRecord(
                auth_id='a', email='a@a.com', disabled=False
            ),
            firebase_domain.FirebaseRecord(
                auth_id='b', email='b@b.com', disabled=False
            ),
        ]

        self.assert_pcoll_equal(
            self.run_diff(records, records),
            [
                (firebase_transforms.DiffFirebaseRecords.TAG_OK, 1),
                (firebase_transforms.DiffFirebaseRecords.TAG_OK, 1),
            ],
        )

    def test_diff_with_extra_actual_record_reports_add(self) -> None:
        self.assert_pcoll_equal(
            self.run_diff(
                [
                    firebase_domain.FirebaseRecord(
                        auth_id='a', email='a@a.com', disabled=False
                    )
                ],
                [],
            ),
            [(firebase_transforms.DiffFirebaseRecords.TAG_ADD, 'a')],
        )

    def test_diff_with_missing_actual_record_reports_del(self) -> None:
        self.assert_pcoll_equal(
            self.run_diff(
                [],
                [
                    firebase_domain.FirebaseRecord(
                        auth_id='b', email='b@b.com', disabled=False
                    )
                ],
            ),
            [(firebase_transforms.DiffFirebaseRecords.TAG_DEL, 'b')],
        )

    def test_diff_with_changed_record_reports_add_and_del(self) -> None:
        self.assert_pcoll_equal(
            self.run_diff(
                [
                    firebase_domain.FirebaseRecord(
                        auth_id='a', email='a@a.com', disabled=True
                    )
                ],
                [
                    firebase_domain.FirebaseRecord(
                        auth_id='a', email='a@a.com', disabled=False
                    )
                ],
            ),
            [
                (firebase_transforms.DiffFirebaseRecords.TAG_ADD, 'a'),
                (firebase_transforms.DiffFirebaseRecords.TAG_DEL, 'a'),
            ],
        )

    def test_diff_with_duplicate_oppia_records_reports_oppia_collision(
        self,
    ) -> None:
        email = 'dup@dup.com'
        dup_a = firebase_domain.FirebaseRecord(
            auth_id='a1', email=email, disabled=False
        )
        dup_b = firebase_domain.FirebaseRecord(
            auth_id='a2', email=email, disabled=False
        )

        self.assert_pcoll_equal(
            self.run_diff(
                [dup_a, dup_b],
                [],
                keyed_user_ids_by_auth_id={'a1': ['uid_a1'], 'a2': ['uid_a2']},
            ),
            [
                (
                    TAG_OPPIA,
                    'Oppia users (user_ids=[\'uid_a1\', \'uid_a2\']) are '
                    'sharing the same email',
                ),
                (firebase_transforms.DiffFirebaseRecords.TAG_ADD, 'a1'),
                (firebase_transforms.DiffFirebaseRecords.TAG_ADD, 'a2'),
            ],
        )

    def test_diff_with_duplicate_firebase_records_reports_firebase_collision(
        self,
    ) -> None:
        email = 'dup@dup.com'
        dup_a = firebase_domain.FirebaseRecord(
            auth_id='a1', email=email, disabled=False
        )
        dup_b = firebase_domain.FirebaseRecord(
            auth_id='a2', email=email, disabled=False
        )

        self.assert_pcoll_equal(
            self.run_diff([], [dup_a, dup_b]),
            [
                (
                    TAG_FIREBASE,
                    'Firebase accounts (auth_ids=[\'a1\', \'a2\']) are sharing '
                    'the same email',
                ),
                (firebase_transforms.DiffFirebaseRecords.TAG_DEL, 'a1'),
                (firebase_transforms.DiffFirebaseRecords.TAG_DEL, 'a2'),
            ],
        )

    def test_diff_with_shared_auth_id_reports_oppia_collision(self) -> None:
        self.assert_pcoll_equal(
            self.run_diff(
                [],
                [],
                keyed_user_ids_by_auth_id={
                    'a1': ['uid_x', 'uid_y'],
                    'a2': ['uid_z'],
                },
            ),
            [
                (
                    TAG_OPPIA,
                    'Oppia users (user_ids=[\'uid_x\', \'uid_y\']) are sharing '
                    'the same Firebase account (auth_id=\'a1\')',
                ),
            ],
        )

    def run_diff(
        self,
        expected: list[firebase_domain.FirebaseRecord],
        actual: list[firebase_domain.FirebaseRecord],
        keyed_user_ids_by_auth_id: dict[str, list[str]] | None = None,
    ) -> beam.PCollection[tuple[str, str | int]]:
        """Runs the diff and flattens the tagged outputs into one PCollection.

        Each emitted element is a (tag, payload) pair, where the payload is the
        OK count for TAG_OK, the record's auth_id for TAG_ADD / TAG_DEL, and the
        collision message for TAG_OPPIA_USER_COLLISION /
        TAG_FIREBASE_ACCOUNT_COLLISION.

        Args:
            expected: list(FirebaseRecord). The "expected" (Oppia) records.
            actual: list(FirebaseRecord). The "actual" (Firebase) records.
            keyed_user_ids_by_auth_id: dict(str, list(str)). Maps each
                firebase_auth_id to the Oppia user ID(s) that claim it, used to
                build the side input. Defaults to an empty mapping when None.

        Returns:
            PCollection. The flattened (tag, payload) pairs.
        """
        keyed_user_ids_by_auth_id = keyed_user_ids_by_auth_id or {}
        auth_pairs = self.pipeline | 'CreatePairs' >> beam.Create(
            [
                (auth_id, user_id)
                for auth_id, user_ids in keyed_user_ids_by_auth_id.items()
                for user_id in user_ids
            ]
        )
        diffs = (
            self.pipeline | 'CreateExpected' >> beam.Create(expected),
            self.pipeline | 'CreateActual' >> beam.Create(actual),
        ) | 'Compute diffs' >> firebase_transforms.DiffFirebaseRecords(
            auth_pairs=auth_pairs
        )

        return (
            diffs[TAG_OK] | beam.Map(lambda num: (TAG_OK, num)),
            diffs[TAG_ADD] | beam.Map(lambda rec: (TAG_ADD, rec.auth_id)),
            diffs[TAG_DEL] | beam.Map(lambda rec: (TAG_DEL, rec.auth_id)),
            diffs[TAG_OPPIA] | beam.Map(lambda err: (TAG_OPPIA, err)),
            diffs[TAG_FIREBASE] | beam.Map(lambda err: (TAG_FIREBASE, err)),
        ) | beam.Flatten()


# The problems that RepairUserAuthDetailsModels can find with a user.
MISSING_AUTH = 'is missing its UserAuthDetailsModel'
MISSING_ID = 'is missing its firebase_auth_id'
MISSING_REVERSE = 'is missing its UserIdByFirebaseAuthIdModel'
MISSING_SETTINGS = 'is missing its UserSettingsModel'

# The reasons why RepairUserAuthDetailsModels can refuse to repair a user.
AUTH_DELETED = 'its UserAuthDetailsModel is marked deleted'
SETTINGS_DELETED = 'its UserSettingsModel is marked deleted'

RepairOutput = tuple[str | int | bool | None, ...]


def ok() -> RepairOutput:
    """Returns the output of a user that doesn't need to be repaired."""
    return (TAG_REPAIR_OK, 1)


def put_auth(user_id: str, firebase_auth_id: str) -> RepairOutput:
    """Returns the output of a UserAuthDetailsModel that needs to be put."""
    return (TAG_PUT, 'UserAuthDetailsModel', user_id, firebase_auth_id, True)


def put_reverse(firebase_auth_id: str, user_id: str) -> RepairOutput:
    """Returns the output of a UserIdByFirebaseAuthIdModel that needs to be
    put.
    """
    return (
        TAG_PUT,
        'UserIdByFirebaseAuthIdModel',
        firebase_auth_id,
        user_id,
        True,
    )


def problem(user_id: str, issue: str, reason: str) -> RepairOutput:
    """Returns the output of a user that can't be repaired."""
    return (TAG_PROBLEMS, f'{user_id=!r} {issue}, but {reason}')


def mapped_by(*firebase_auth_ids: str) -> str:
    """Returns the reason for a user with existing reverse models."""
    return (
        'UserIdByFirebaseAuthIdModels already map to it '
        f'(firebase_auth_ids={list(firebase_auth_ids)!r})'
    )


def shared_with(*user_ids: str) -> str:
    """Returns the reason for a user whose email other users share."""
    return f'other Oppia users share its email (user_ids={list(user_ids)!r})'


def orphaned_by(*firebase_auth_ids: str) -> str:
    """Returns the reason for a user that only has auth models left."""
    return (
        'it still has a UserAuthDetailsModel and UserIdByFirebaseAuthIdModels '
        f'(firebase_auth_ids={list(firebase_auth_ids)!r})'
    )


class RepairUserAuthDetailsModelsTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for RepairUserAuthDetailsModels."""

    TAG_TEST_CASES = (
        ('TAG_OK', 'OK'),
        ('TAG_PUT', 'PUT'),
        ('TAG_PROBLEMS', 'PROBLEMS'),
    )

    def test_tag_names(self) -> None:
        for tag_name, expected_value in self.TAG_TEST_CASES:
            with self.subTest(f'{tag_name} == {expected_value!r}'):
                self.assertEqual(
                    getattr(
                        firebase_transforms.RepairUserAuthDetailsModels,
                        tag_name,
                    ),
                    expected_value,
                )

    def test_repair_with_no_models_produces_no_output(self) -> None:
        self.assert_pcoll_empty(self.run_repair())

    def test_repair_with_healthy_user_reports_ok(self) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', 'fb_a'),
                self.settings_model('uid_a'),
                self.reverse_model('fb_a', 'uid_a'),
            ],
            [ok()],
        )

    def test_repair_with_repaired_user_reports_ok(self) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', FB_A),
                self.settings_model('uid_a'),
                self.reverse_model(FB_A, 'uid_a'),
            ],
            [ok()],
        )

    def test_repair_with_profile_user_reports_ok(self) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', parent_user_id='uid_p'),
                self.settings_model('uid_a'),
            ],
            [ok()],
        )

    def test_repair_with_only_reverse_models_reports_each(self) -> None:
        reason = 'it still has a UserIdByFirebaseAuthIdModel'
        self.assert_repairs(
            [
                self.reverse_model('fb_a', 'uid_a'),
                self.reverse_model('fb_b', 'uid_a', deleted=True),
            ],
            [
                problem(
                    'uid_a',
                    'is missing its UserAuthDetailsModel and UserSettingsModel',
                    f'{reason} (firebase_auth_id=\'fb_a\')',
                ),
                problem(
                    'uid_a',
                    'is missing its UserAuthDetailsModel and UserSettingsModel',
                    f'{reason} (firebase_auth_id=\'fb_b\')',
                ),
            ],
        )

    def test_repair_with_missing_auth_model_creates_both_auth_models(
        self,
    ) -> None:
        self.assert_repairs(
            [self.settings_model('uid_a')],
            [put_auth('uid_a', FB_A), put_reverse(FB_A, 'uid_a')],
        )

    def test_repair_with_missing_auth_model_of_deleted_user_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [self.settings_model('uid_a', deleted=True)],
            [problem('uid_a', MISSING_AUTH, SETTINGS_DELETED)],
        )

    def test_repair_with_missing_auth_model_and_reverse_model_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [self.settings_model('uid_a'), self.reverse_model('fb_a', 'uid_a')],
            [problem('uid_a', MISSING_AUTH, mapped_by('fb_a'))],
        )

    def test_repair_with_only_generated_reverse_model_creates_auth_model(
        self,
    ) -> None:
        # NOTE: This is what an interrupted repair job leaves behind.
        self.assert_repairs(
            [self.settings_model('uid_a'), self.reverse_model(FB_A, 'uid_a')],
            [put_auth('uid_a', FB_A)],
        )

    def test_repair_with_generated_id_but_no_reverse_model_creates_it(
        self,
    ) -> None:
        # NOTE: This is what an interrupted repair job leaves behind.
        self.assert_repairs(
            [self.auth_model('uid_a', FB_A), self.settings_model('uid_a')],
            [put_reverse(FB_A, 'uid_a')],
        )

    def test_repair_with_deleted_generated_reverse_model_skips(self) -> None:
        self.assert_repairs(
            [
                self.settings_model('uid_a'),
                self.reverse_model(FB_A, 'uid_a', deleted=True),
            ],
            [problem('uid_a', MISSING_AUTH, mapped_by(FB_A))],
        )

    def test_repair_with_generated_id_and_other_reverse_model_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', FB_A),
                self.settings_model('uid_a'),
                self.reverse_model('fb_a', 'uid_a'),
            ],
            [problem('uid_a', MISSING_REVERSE, mapped_by('fb_a'))],
        )

    def test_repair_with_none_firebase_auth_id_fills_it_in(self) -> None:
        self.assert_repairs(
            [self.auth_model('uid_a', None), self.settings_model('uid_a')],
            [put_auth('uid_a', FB_A), put_reverse(FB_A, 'uid_a')],
        )

    def test_repair_with_empty_firebase_auth_id_fills_it_in(self) -> None:
        self.assert_repairs(
            [self.auth_model('uid_a', ''), self.settings_model('uid_a')],
            [put_auth('uid_a', FB_A), put_reverse(FB_A, 'uid_a')],
        )

    def test_repair_with_empty_firebase_auth_id_keeps_other_fields(
        self,
    ) -> None:
        repairs = self.run_repair_transform(
            self.auth_model('uid_a', gae_id='gae_a'),
            self.settings_model('uid_a'),
        )

        self.assert_pcoll_equal(
            repairs[TAG_PUT]
            | 'Keep only UserAuthDetailsModels'
            >> beam.Filter(
                lambda m: isinstance(m, auth_models.UserAuthDetailsModel)
            )
            | 'Get gae_ids' >> beam.Map(lambda m: m.gae_id),
            ['gae_a'],
        )

    def test_repair_with_empty_firebase_auth_id_of_deleted_user_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', deleted=True),
                self.settings_model('uid_a'),
            ],
            [problem('uid_a', MISSING_ID, AUTH_DELETED)],
        )

    def test_repair_with_empty_firebase_auth_id_of_deleted_settings_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a'),
                self.settings_model('uid_a', deleted=True),
            ],
            [problem('uid_a', MISSING_ID, SETTINGS_DELETED)],
        )

    def test_repair_with_empty_firebase_auth_id_of_deleted_models_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', deleted=True),
                self.settings_model('uid_a', deleted=True),
            ],
            [problem('uid_a', MISSING_ID, AUTH_DELETED)],
        )

    def test_repair_with_empty_firebase_auth_id_and_reverse_model_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a'),
                self.settings_model('uid_a'),
                self.reverse_model('fb_b', 'uid_a'),
                self.reverse_model('fb_a', 'uid_a'),
            ],
            [problem('uid_a', MISSING_ID, mapped_by('fb_a', 'fb_b'))],
        )

    def test_repair_with_missing_settings_model_reports_auth_models(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', 'fb_a'),
                self.reverse_model('fb_b', 'uid_a', deleted=True),
                self.reverse_model('fb_a', 'uid_a'),
            ],
            [problem('uid_a', MISSING_SETTINGS, orphaned_by('fb_a', 'fb_b'))],
        )

    def test_repair_with_missing_settings_model_of_deleted_user_reports_it(
        self,
    ) -> None:
        self.assert_repairs(
            [self.auth_model('uid_a', deleted=True)],
            [problem('uid_a', MISSING_SETTINGS, orphaned_by())],
        )

    def test_repair_with_missing_auth_model_and_shared_email_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', 'fb_a'),
                self.settings_model('uid_a', email='x@x.com'),
                self.settings_model('uid_b', email='x@x.com'),
                self.reverse_model('fb_a', 'uid_a'),
            ],
            [ok(), problem('uid_b', MISSING_AUTH, shared_with('uid_a'))],
        )

    def test_repair_with_empty_firebase_auth_id_and_shared_email_skips(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a'),
                self.settings_model('uid_a', email='x@x.com'),
                self.settings_model('uid_b', email='x@x.com'),
                self.settings_model('uid_c', email='x@x.com'),
            ],
            [
                problem('uid_a', MISSING_ID, shared_with('uid_b', 'uid_c')),
                problem('uid_b', MISSING_AUTH, shared_with('uid_a', 'uid_c')),
                problem('uid_c', MISSING_AUTH, shared_with('uid_a', 'uid_b')),
            ],
        )

    def test_repair_with_email_shared_by_profile_user_repairs_it(
        self,
    ) -> None:
        # Profile users share their parent's email, but they never get a
        # Firebase account, so they can't collide with the repaired user.
        self.assert_repairs(
            [
                self.auth_model('uid_p', parent_user_id='uid_a'),
                self.settings_model('uid_a', email='x@x.com'),
                self.settings_model('uid_p', email='x@x.com'),
            ],
            [ok(), put_auth('uid_a', FB_A), put_reverse(FB_A, 'uid_a')],
        )

    def test_repair_with_email_shared_by_deleted_user_repairs_it(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_b', 'fb_b', deleted=True),
                self.settings_model('uid_a', email='x@x.com'),
                self.settings_model('uid_b', email='x@x.com', deleted=True),
                self.reverse_model('fb_b', 'uid_b', deleted=True),
            ],
            [ok(), put_auth('uid_a', FB_A), put_reverse(FB_A, 'uid_a')],
        )

    def test_repair_with_healthy_users_sharing_email_reports_ok(
        self,
    ) -> None:
        # Existing collisions are reported by FirebaseServerSyncJob, so users
        # that don't need repairs are left alone.
        self.assert_repairs(
            [
                self.auth_model('uid_a', 'fb_a'),
                self.auth_model('uid_b', 'fb_b'),
                self.settings_model('uid_a', email='x@x.com'),
                self.settings_model('uid_b', email='x@x.com'),
                self.reverse_model('fb_a', 'uid_a'),
                self.reverse_model('fb_b', 'uid_b'),
            ],
            [ok(), ok()],
        )

    def test_repair_with_multiple_users_repairs_each_independently(
        self,
    ) -> None:
        self.assert_repairs(
            [
                self.auth_model('uid_a', 'fb_a'),
                self.auth_model('uid_b'),
                self.auth_model('uid_d', 'fb_d'),
                self.settings_model('uid_a'),
                self.settings_model('uid_b'),
                self.settings_model('uid_c'),
                self.settings_model('uid_e', deleted=True),
                self.reverse_model('fb_a', 'uid_a'),
                self.reverse_model('fb_d', 'uid_d'),
            ],
            [
                ok(),
                put_auth('uid_b', FB_B),
                put_reverse(FB_B, 'uid_b'),
                put_auth('uid_c', FB_C),
                put_reverse(FB_C, 'uid_c'),
                problem('uid_d', MISSING_SETTINGS, orphaned_by('fb_d')),
                problem('uid_e', MISSING_AUTH, SETTINGS_DELETED),
            ],
        )

    def auth_model(
        self,
        user_id: str,
        firebase_auth_id: str | None = None,
        parent_user_id: str | None = None,
        gae_id: str | None = None,
        deleted: bool = False,
    ) -> auth_models.UserAuthDetailsModel:
        """Returns a new UserAuthDetailsModel with the given properties."""
        return self.create_model(
            auth_models.UserAuthDetailsModel,
            id=user_id,
            firebase_auth_id=firebase_auth_id,
            parent_user_id=parent_user_id,
            gae_id=gae_id,
            deleted=deleted,
        )

    def settings_model(
        self, user_id: str, email: str | None = None, deleted: bool = False
    ) -> user_models.UserSettingsModel:
        """Returns a new UserSettingsModel with the given properties."""
        return self.create_model(
            user_models.UserSettingsModel,
            id=user_id,
            email=f'{user_id}@example.com' if email is None else email,
            deleted=deleted,
        )

    def reverse_model(
        self, firebase_auth_id: str, user_id: str, deleted: bool = False
    ) -> auth_models.UserIdByFirebaseAuthIdModel:
        """Returns a new UserIdByFirebaseAuthIdModel with the given IDs."""
        return self.create_model(
            auth_models.UserIdByFirebaseAuthIdModel,
            id=firebase_auth_id,
            user_id=user_id,
            deleted=deleted,
        )

    def assert_repairs(
        self,
        input_models: list[base_models.BaseModel],
        expected_outputs: list[RepairOutput],
    ) -> None:
        """Asserts that repairing the given models has the expected outputs.

        Args:
            input_models: list(BaseModel). The models to repair.
            expected_outputs: list(tuple). The outputs built with ok(),
                put_auth(), put_reverse() and problem().
        """
        self.assert_pcoll_equal(
            self.run_repair(*input_models), expected_outputs
        )

    def run_repair(
        self, *input_models: base_models.BaseModel
    ) -> beam.PCollection[RepairOutput]:
        """Runs the repair and flattens the tagged outputs into one PCollection.

        Each emitted element is a tuple starting with its tag. TAG_OK is paired
        with its count and TAG_PROBLEMS with its message. TAG_PUT is followed by
        the model's class name, its id, the ID it maps to (the firebase_auth_id
        of a UserAuthDetailsModel or the user_id of a
        UserIdByFirebaseAuthIdModel), and whether its timestamps were updated.

        Args:
            *input_models: BaseModel. The models to repair.

        Returns:
            PCollection. The flattened, summarized tagged outputs.
        """
        # NOTE: The year-ago timestamp is bound to a local variable so that
        # the lambdas below don't need to pickle the test case itself.
        year_ago = self.YEAR_AGO

        def summarize(
            model: (
                auth_models.UserAuthDetailsModel
                | auth_models.UserIdByFirebaseAuthIdModel
            ),
        ) -> RepairOutput:
            """Summarizes the given model into comparable values."""
            mapped_id = (
                model.firebase_auth_id
                if isinstance(model, auth_models.UserAuthDetailsModel)
                else model.user_id
            )
            return (
                TAG_PUT,
                type(model).__name__,
                model.id,
                mapped_id,
                model.last_updated != year_ago,
            )

        repairs = self.run_repair_transform(*input_models)

        return (
            repairs[TAG_REPAIR_OK]
            | 'Summarize OK' >> beam.Map(lambda num: (TAG_REPAIR_OK, num)),
            repairs[TAG_PUT] | 'Summarize PUT' >> beam.Map(summarize),
            repairs[TAG_PROBLEMS]
            | 'Summarize PROBLEMS' >> beam.Map(lambda msg: (TAG_PROBLEMS, msg)),
        ) | 'Flatten summaries' >> beam.Flatten()

    def run_repair_transform(
        self, *input_models: base_models.BaseModel
    ) -> dict[str, beam.PCollection]:
        """Runs the repair on the given models and returns its raw outputs.

        Args:
            *input_models: BaseModel. The models to repair. They are split by
                type into the transform's three inputs.

        Returns:
            dict(str, PCollection). A mapping from each tag to its PCollection.
        """
        model_types = (
            auth_models.UserAuthDetailsModel,
            user_models.UserSettingsModel,
            auth_models.UserIdByFirebaseAuthIdModel,
        )
        repairs: dict[str, beam.PCollection] = (
            tuple(
                self.pipeline
                | f'Create {model_type.__name__}s'
                >> beam.Create(
                    [m for m in input_models if isinstance(m, model_type)]
                )
                for model_type in model_types
            )
            | 'Repair models'
            >> firebase_transforms.RepairUserAuthDetailsModels()
        )
        return repairs
