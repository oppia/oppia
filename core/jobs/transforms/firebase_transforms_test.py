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

import apache_beam as beam

TAG_OK = firebase_transforms.DiffFirebaseRecords.TAG_OK
TAG_ADD = firebase_transforms.DiffFirebaseRecords.TAG_ADD
TAG_DEL = firebase_transforms.DiffFirebaseRecords.TAG_DEL
TAG_OPPIA = firebase_transforms.DiffFirebaseRecords.TAG_OPPIA_USER_COLLISION
TAG_FIREBASE = (
    firebase_transforms.DiffFirebaseRecords.TAG_FIREBASE_ACCOUNT_COLLISION
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
