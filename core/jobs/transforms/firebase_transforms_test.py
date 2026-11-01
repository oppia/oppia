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
from core.tests import test_utils

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
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

# The deterministic Firebase auth IDs generated for user IDs 'uid_a', 'uid_b'
# and 'uid_c', respectively.
FB_A = 'YlVAOpV9YVJstppf7XQTihtFzKUR'
FB_B = 'VWrAZshtYNpMu1Fm29JsT40cNBdh'
FB_C = 'yQpsxVH7PO7R2ilLmvEjNh50dZye'

# The helper is private to its module, but its determinism is load-bearing for
# the repair's idempotence, so it is tested directly.
generate_firebase_auth_id = (
    firebase_transforms._generate_firebase_auth_id  # pylint: disable=protected-access
)


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


class ZipUserSettingsAndUserAuthDetailsModelsTests(
    job_test_utils.PipelinedTestBase
):
    """Pipeline tests for ZipUserSettingsAndUserAuthDetailsModels."""

    def test_zip_with_no_models_produces_no_output(self) -> None:
        self.assert_pcoll_empty(self.run_zip([], []))

    def test_zip_with_both_models_groups_them_by_user_id(self) -> None:
        self.assert_pcoll_equal(
            self.run_zip(
                [
                    self.create_model(
                        auth_models.UserAuthDetailsModel,
                        id='uid_a',
                        firebase_auth_id='fb_a',
                    )
                ],
                [
                    self.create_model(
                        user_models.UserSettingsModel,
                        id='uid_a',
                        email='a@a.com',
                    )
                ],
            ),
            [('uid_a', ['fb_a'], ['a@a.com'])],
        )

    def test_zip_with_only_auth_details_model_groups_it_alone(self) -> None:
        self.assert_pcoll_equal(
            self.run_zip(
                [
                    self.create_model(
                        auth_models.UserAuthDetailsModel,
                        id='uid_a',
                        firebase_auth_id='fb_a',
                    )
                ],
                [],
            ),
            [('uid_a', ['fb_a'], [])],
        )

    def test_zip_with_only_settings_model_groups_it_alone(self) -> None:
        self.assert_pcoll_equal(
            self.run_zip(
                [],
                [
                    self.create_model(
                        user_models.UserSettingsModel,
                        id='uid_a',
                        email='a@a.com',
                    )
                ],
            ),
            [('uid_a', [], ['a@a.com'])],
        )

    def test_zip_with_multiple_users_groups_each_by_user_id(self) -> None:
        self.assert_pcoll_equal(
            self.run_zip(
                [
                    self.create_model(
                        auth_models.UserAuthDetailsModel,
                        id='uid_a',
                        firebase_auth_id='fb_a',
                    ),
                    self.create_model(
                        auth_models.UserAuthDetailsModel,
                        id='uid_b',
                        firebase_auth_id='fb_b',
                    ),
                ],
                [
                    self.create_model(
                        user_models.UserSettingsModel,
                        id='uid_a',
                        email='a@a.com',
                    ),
                    self.create_model(
                        user_models.UserSettingsModel,
                        id='uid_c',
                        email='c@c.com',
                    ),
                ],
            ),
            [
                ('uid_a', ['fb_a'], ['a@a.com']),
                ('uid_b', ['fb_b'], []),
                ('uid_c', [], ['c@c.com']),
            ],
        )

    def run_zip(
        self,
        user_auth_details_models: list[auth_models.UserAuthDetailsModel],
        user_settings_models: list[user_models.UserSettingsModel],
    ) -> beam.PCollection[tuple[str, list[str], list[str]]]:
        """Runs the zip and summarizes each group into comparable values.

        Each emitted element is a (user_id, firebase_auth_ids, emails) triple,
        where firebase_auth_ids comes from the grouped UserAuthDetailsModels
        and emails comes from the grouped UserSettingsModels.

        Args:
            user_auth_details_models: list(UserAuthDetailsModel). The auth
                details models to zip.
            user_settings_models: list(UserSettingsModel). The settings models
                to zip.

        Returns:
            PCollection. The summarized (user_id, firebase_auth_ids, emails)
            triples.
        """
        return (
            (
                self.pipeline
                | 'Create UserAuthDetailsModels'
                >> beam.Create(user_auth_details_models),
                self.pipeline
                | 'Create UserSettingsModels'
                >> beam.Create(user_settings_models),
            )
            | 'Zip models'
            >> firebase_transforms.ZipUserSettingsAndUserAuthDetailsModels()
            | 'Summarize grouped models'
            >> beam.MapTuple(
                lambda user_id, grouped: (
                    user_id,
                    [m.firebase_auth_id for m in grouped[0]],
                    [m.email for m in grouped[1]],
                )
            )
        )


class GenerateFirebaseAuthIdTests(test_utils.TestBase):
    """Unit tests for _generate_firebase_auth_id."""

    def test_generates_same_id_for_same_user_id(self) -> None:
        self.assertEqual(
            generate_firebase_auth_id('uid_a'),
            generate_firebase_auth_id('uid_a'),
        )

    def test_generates_28_alphanumeric_characters(self) -> None:
        firebase_auth_id = generate_firebase_auth_id('uid_a')

        self.assertEqual(len(firebase_auth_id), 28)
        self.assertTrue(firebase_auth_id.isalnum())
        self.assertTrue(firebase_auth_id.isascii())

    def test_generates_different_ids_for_different_user_ids(self) -> None:
        self.assertNotEqual(
            generate_firebase_auth_id('uid_a'),
            generate_firebase_auth_id('uid_b'),
        )

    def test_generates_pinned_id(self) -> None:
        # Changing the generated ID would make reruns of the repair job assign
        # a different ID than earlier runs did, so the value is pinned here.
        self.assertEqual(
            generate_firebase_auth_id('uid_a'),
            FB_A,
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
        self.assert_pcoll_empty(self.run_repair([], [], []))

    def test_repair_with_healthy_user_reports_ok(self) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', firebase_auth_id='fb_a')],
                [self.create_settings_model('uid_a')],
                [self.create_reverse_model('fb_a', 'uid_a')],
            ),
            [(TAG_REPAIR_OK, 1)],
        )

    def test_repair_with_profile_user_reports_ok(self) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', parent_user_id='uid_p')],
                [self.create_settings_model('uid_a')],
                [],
            ),
            [(TAG_REPAIR_OK, 1)],
        )

    def test_repair_with_only_reverse_models_reports_each(self) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [],
                [],
                [
                    self.create_reverse_model('fb_a', 'uid_a'),
                    self.create_reverse_model('fb_b', 'uid_a', deleted=True),
                ],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its UserAuthDetailsModel '
                    'and UserSettingsModel, but it still has a '
                    'UserIdByFirebaseAuthIdModel (firebase_auth_id=\'fb_a\')',
                ),
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its UserAuthDetailsModel '
                    'and UserSettingsModel, but it still has a '
                    'UserIdByFirebaseAuthIdModel (firebase_auth_id=\'fb_b\')',
                ),
            ],
        )

    def test_repair_with_missing_auth_model_creates_both_auth_models(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair([], [self.create_settings_model('uid_a')], []),
            [
                (TAG_PUT, 'UserAuthDetailsModel', 'uid_a', FB_A, True),
                (TAG_PUT, 'UserIdByFirebaseAuthIdModel', FB_A, 'uid_a', True),
            ],
        )

    def test_repair_with_missing_auth_model_of_deleted_user_skips(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [], [self.create_settings_model('uid_a', deleted=True)], []
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its UserAuthDetailsModel, '
                    'but its UserSettingsModel is marked deleted',
                ),
            ],
        )

    def test_repair_with_missing_auth_model_and_reverse_model_skips(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [],
                [self.create_settings_model('uid_a')],
                [self.create_reverse_model('fb_a', 'uid_a')],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its UserAuthDetailsModel, '
                    'but UserIdByFirebaseAuthIdModels already map to it '
                    '(firebase_auth_ids=[\'fb_a\'])',
                ),
            ],
        )

    def test_repair_with_none_firebase_auth_id_fills_it_in(self) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', firebase_auth_id=None)],
                [self.create_settings_model('uid_a')],
                [],
            ),
            [
                (TAG_PUT, 'UserAuthDetailsModel', 'uid_a', FB_A, True),
                (TAG_PUT, 'UserIdByFirebaseAuthIdModel', FB_A, 'uid_a', True),
            ],
        )

    def test_repair_with_empty_firebase_auth_id_fills_it_in(self) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', firebase_auth_id='')],
                [self.create_settings_model('uid_a')],
                [],
            ),
            [
                (TAG_PUT, 'UserAuthDetailsModel', 'uid_a', FB_A, True),
                (TAG_PUT, 'UserIdByFirebaseAuthIdModel', FB_A, 'uid_a', True),
            ],
        )

    def test_repair_with_empty_firebase_auth_id_keeps_other_fields(
        self,
    ) -> None:
        repairs = self.run_repair_transform(
            [self.create_auth_model('uid_a', gae_id='gae_a')],
            [self.create_settings_model('uid_a')],
            [],
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
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', deleted=True)],
                [self.create_settings_model('uid_a')],
                [],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its firebase_auth_id, but '
                    'its UserAuthDetailsModel is marked deleted',
                ),
            ],
        )

    def test_repair_with_empty_firebase_auth_id_of_deleted_settings_skips(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a')],
                [self.create_settings_model('uid_a', deleted=True)],
                [],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its firebase_auth_id, but '
                    'its UserSettingsModel is marked deleted',
                ),
            ],
        )

    def test_repair_with_empty_firebase_auth_id_of_deleted_models_skips(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', deleted=True)],
                [self.create_settings_model('uid_a', deleted=True)],
                [],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its firebase_auth_id, but '
                    'its UserAuthDetailsModel is marked deleted',
                ),
            ],
        )

    def test_repair_with_empty_firebase_auth_id_and_reverse_model_skips(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a')],
                [self.create_settings_model('uid_a')],
                [
                    self.create_reverse_model('fb_b', 'uid_a'),
                    self.create_reverse_model('fb_a', 'uid_a'),
                ],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its firebase_auth_id, but '
                    'UserIdByFirebaseAuthIdModels already map to it '
                    '(firebase_auth_ids=[\'fb_a\', \'fb_b\'])',
                ),
            ],
        )

    def test_repair_with_missing_settings_model_reports_auth_models(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', firebase_auth_id='fb_a')],
                [],
                [
                    self.create_reverse_model('fb_b', 'uid_a', deleted=True),
                    self.create_reverse_model('fb_a', 'uid_a'),
                ],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its UserSettingsModel, but '
                    'it still has a UserAuthDetailsModel and '
                    'UserIdByFirebaseAuthIdModels '
                    '(firebase_auth_ids=[\'fb_a\', \'fb_b\'])',
                ),
            ],
        )

    def test_repair_with_missing_settings_model_of_deleted_user_reports_it(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [self.create_auth_model('uid_a', deleted=True)],
                [],
                [],
            ),
            [
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_a\' is missing its UserSettingsModel, but '
                    'it still has a UserAuthDetailsModel and '
                    'UserIdByFirebaseAuthIdModels (firebase_auth_ids=[])',
                ),
            ],
        )

    def test_repair_with_multiple_users_repairs_each_independently(
        self,
    ) -> None:
        self.assert_pcoll_equal(
            self.run_repair(
                [
                    self.create_auth_model('uid_a', firebase_auth_id='fb_a'),
                    self.create_auth_model('uid_b'),
                    self.create_auth_model('uid_d', firebase_auth_id='fb_d'),
                ],
                [
                    self.create_settings_model('uid_a'),
                    self.create_settings_model('uid_b'),
                    self.create_settings_model('uid_c'),
                    self.create_settings_model('uid_e', deleted=True),
                ],
                [
                    self.create_reverse_model('fb_a', 'uid_a'),
                    self.create_reverse_model('fb_d', 'uid_d'),
                ],
            ),
            [
                (TAG_REPAIR_OK, 1),
                (TAG_PUT, 'UserAuthDetailsModel', 'uid_b', FB_B, True),
                (TAG_PUT, 'UserIdByFirebaseAuthIdModel', FB_B, 'uid_b', True),
                (TAG_PUT, 'UserAuthDetailsModel', 'uid_c', FB_C, True),
                (TAG_PUT, 'UserIdByFirebaseAuthIdModel', FB_C, 'uid_c', True),
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_d\' is missing its UserSettingsModel, but '
                    'it still has a UserAuthDetailsModel and '
                    'UserIdByFirebaseAuthIdModels '
                    '(firebase_auth_ids=[\'fb_d\'])',
                ),
                (
                    TAG_PROBLEMS,
                    'user_id=\'uid_e\' is missing its UserAuthDetailsModel, '
                    'but its UserSettingsModel is marked deleted',
                ),
            ],
        )

    def create_auth_model(
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

    def create_settings_model(
        self, user_id: str, deleted: bool = False
    ) -> user_models.UserSettingsModel:
        """Returns a new UserSettingsModel with the given properties."""
        return self.create_model(
            user_models.UserSettingsModel,
            id=user_id,
            email=f'{user_id}@example.com',
            deleted=deleted,
        )

    def create_reverse_model(
        self, firebase_auth_id: str, user_id: str, deleted: bool = False
    ) -> auth_models.UserIdByFirebaseAuthIdModel:
        """Returns a new UserIdByFirebaseAuthIdModel with the given IDs."""
        return self.create_model(
            auth_models.UserIdByFirebaseAuthIdModel,
            id=firebase_auth_id,
            user_id=user_id,
            deleted=deleted,
        )

    def run_repair(
        self,
        user_auth_details_models: list[auth_models.UserAuthDetailsModel],
        user_settings_models: list[user_models.UserSettingsModel],
        user_id_by_firebase_auth_id_models: list[
            auth_models.UserIdByFirebaseAuthIdModel
        ],
    ) -> beam.PCollection[tuple[str | int | bool | None, ...]]:
        """Runs the repair and flattens the tagged outputs into one PCollection.

        Each emitted element is a tuple starting with its tag. TAG_OK is paired
        with its count and TAG_PROBLEMS with its message. TAG_PUT is followed by
        the model's class name, its id, the ID it maps to (the firebase_auth_id
        of a UserAuthDetailsModel or the user_id of a
        UserIdByFirebaseAuthIdModel), and whether its timestamps were updated.

        Args:
            user_auth_details_models: list(UserAuthDetailsModel). The auth
                details models to repair.
            user_settings_models: list(UserSettingsModel). The settings models
                to repair against.
            user_id_by_firebase_auth_id_models: list(UserIdByFirebaseAuthIdModel).
                The reverse mapping models to repair against.

        Returns:
            PCollection. The flattened, summarized tagged outputs.
        """
        # NOTE: The year-ago timestamp is bound to a local variable so that
        # the lambdas below don't need to pickle the test case itself.
        year_ago = self.YEAR_AGO

        def summarize(
            tag: str,
            model: (
                auth_models.UserAuthDetailsModel
                | auth_models.UserIdByFirebaseAuthIdModel
            ),
        ) -> tuple[str, str, str, str | None, bool]:
            """Summarizes the given model into comparable values."""
            mapped_id = (
                model.firebase_auth_id
                if isinstance(model, auth_models.UserAuthDetailsModel)
                else model.user_id
            )
            return (
                tag,
                type(model).__name__,
                model.id,
                mapped_id,
                model.last_updated != year_ago,
            )

        repairs = self.run_repair_transform(
            user_auth_details_models,
            user_settings_models,
            user_id_by_firebase_auth_id_models,
        )

        return (
            repairs[TAG_REPAIR_OK]
            | 'Summarize OK' >> beam.Map(lambda num: (TAG_REPAIR_OK, num)),
            repairs[TAG_PUT]
            | 'Summarize PUT' >> beam.Map(lambda m: summarize(TAG_PUT, m)),
            repairs[TAG_PROBLEMS]
            | 'Summarize PROBLEMS' >> beam.Map(lambda msg: (TAG_PROBLEMS, msg)),
        ) | 'Flatten summaries' >> beam.Flatten()

    def run_repair_transform(
        self,
        user_auth_details_models: list[auth_models.UserAuthDetailsModel],
        user_settings_models: list[user_models.UserSettingsModel],
        user_id_by_firebase_auth_id_models: list[
            auth_models.UserIdByFirebaseAuthIdModel
        ],
    ) -> dict[str, beam.PCollection]:
        """Runs the repair on the given models and returns its raw outputs.

        Args:
            user_auth_details_models: list(UserAuthDetailsModel). The auth
                details models to repair.
            user_settings_models: list(UserSettingsModel). The settings models
                to repair against.
            user_id_by_firebase_auth_id_models: list(UserIdByFirebaseAuthIdModel).
                The reverse mapping models to repair against.

        Returns:
            dict(str, PCollection). A mapping from each tag to its PCollection.
        """
        reverse_models = (
            self.pipeline
            | 'Create UserIdByFirebaseAuthIdModels'
            >> beam.Create(user_id_by_firebase_auth_id_models)
        )
        repairs: dict[str, beam.PCollection] = (
            (
                self.pipeline
                | 'Create UserAuthDetailsModels'
                >> beam.Create(user_auth_details_models),
                self.pipeline
                | 'Create UserSettingsModels'
                >> beam.Create(user_settings_models),
            )
            | 'Zip models'
            >> firebase_transforms.ZipUserSettingsAndUserAuthDetailsModels()
            | 'Repair models'
            >> firebase_transforms.RepairUserAuthDetailsModels(
                user_id_by_firebase_auth_id_models=reverse_models
            )
        )
        return repairs
