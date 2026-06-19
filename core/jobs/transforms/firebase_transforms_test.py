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

import unittest
from unittest import mock

from core.jobs import job_test_utils
from core.jobs.transforms import firebase_transforms
from core.jobs.types import firebase_domain, job_run_result
from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin.auth as firebase_auth
from typing import Callable

TAG_OK = firebase_transforms.DiffFirebaseRecords.TAG_OK
TAG_ADD = firebase_transforms.DiffFirebaseRecords.TAG_ADD
TAG_DEL = firebase_transforms.DiffFirebaseRecords.TAG_DEL
TAG_OPPIA = firebase_transforms.DiffFirebaseRecords.TAG_OPPIA_USER_COLLISION
TAG_FIREBASE = (
    firebase_transforms.DiffFirebaseRecords.TAG_FIREBASE_ACCOUNT_COLLISION
)


class DiffFirebaseRecordsTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for DiffFirebaseRecords."""

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


class FirebaseBatchOperationTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for FirebaseBatchOperation using a "fake" subclass."""

    def setUp(self) -> None:
        super().setUp()
        patcher = mock.patch.object(
            firebase_auth_services, 'establish_firebase_connection'
        )
        self.establish_firebase_connection_mock = patcher.start()
        self.addCleanup(patcher.stop)

    def test_expand_with_no_inputs_produces_no_output(self) -> None:
        self.assert_pcoll_empty(self.run_batch_operation([]))
        self.establish_firebase_connection_mock.assert_not_called()

    def test_expand_with_successful_inputs_reports_ok_count(self) -> None:
        self.assert_pcoll_equal(
            self.run_batch_operation(['a', 'b', 'c']),
            [job_run_result.JobRunResult(stdout='OK: 3')],
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_expand_with_batch_value_error_reports_error(self) -> None:
        def raise_value_error(_: list[str]) -> TestBatchResult:
            raise ValueError('bad input')

        self.assert_pcoll_equal(
            self.run_batch_operation(['a'], raise_value_error),
            [
                job_run_result.JobRunResult(
                    stderr='ERROR: at slice=[0:1]: bad input'
                ),
            ],
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_expand_with_batch_firebase_error_reports_error(self) -> None:
        def raise_firebase_error(_: list[str]) -> TestBatchResult:
            raise firebase_auth.UserNotFoundError('missing')

        self.assert_pcoll_equal(
            self.run_batch_operation(['a', 'b'], raise_firebase_error),
            [
                job_run_result.JobRunResult(
                    stderr='ERROR: at slice=[0:2]: missing'
                ),
            ],
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_expand_with_individual_failures_reports_each_error(self) -> None:
        errors = [
            mock.Mock(index=0, reason='fail-a'),
            mock.Mock(index=2, reason='fail-c'),
        ]

        self.assert_pcoll_equal(
            self.run_batch_operation(
                ['a', 'b', 'c'],
                lambda _: mock.Mock(failure_count=2, errors=errors),
            ),
            [
                job_run_result.JobRunResult(stdout='OK: 1'),
                job_run_result.JobRunResult(
                    stderr='ERROR: at index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='ERROR: at index=[2]: fail-c'
                ),
            ],
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_expand_with_mixed_success_and_individual_failures_reports_both(
        self,
    ) -> None:
        errors = [mock.Mock(index=1, reason='fail-b')]

        self.assert_pcoll_equal(
            self.run_batch_operation(
                ['a', 'b'],
                lambda _: mock.Mock(failure_count=1, errors=errors),
            ),
            [
                job_run_result.JobRunResult(stdout='OK: 1'),
                job_run_result.JobRunResult(
                    stderr='ERROR: at index=[1]: fail-b'
                ),
            ],
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_expand_with_all_inputs_failed_produces_no_ok_count(
        self,
    ) -> None:
        errors = [
            mock.Mock(index=0, reason='fail-a'),
            mock.Mock(index=1, reason='fail-b'),
        ]

        self.assert_pcoll_equal(
            self.run_batch_operation(
                ['a', 'b'],
                lambda _: mock.Mock(failure_count=2, errors=errors),
            ),
            [
                job_run_result.JobRunResult(
                    stderr='ERROR: at index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='ERROR: at index=[1]: fail-b'
                ),
            ],
        )
        self.establish_firebase_connection_mock.assert_called_once()

    def test_expand_with_inputs_exceeding_batch_limit_processes_each_batch(
        self,
    ) -> None:
        call_count = 0

        def per_batch_handler(_: list[str]) -> TestBatchResult:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return mock.Mock(failure_count=0, errors=[])
            else:
                raise ValueError('uh-oh')

        with self.swap(
            firebase_transforms.FirebaseBatchOperation, 'BATCH_LIMIT', 2
        ):
            self.assert_pcoll_equal(
                self.run_batch_operation(['a', 'b', 'c'], per_batch_handler),
                [
                    job_run_result.JobRunResult(stdout='OK: 2'),
                    job_run_result.JobRunResult(
                        stderr='ERROR: at slice=[2:3]: uh-oh'
                    ),
                ],
            )
        self.establish_firebase_connection_mock.assert_called_once()

    def run_batch_operation(
        self,
        prefixes: list[str],
        op: Callable[[list[str]], TestBatchResult] = (
            lambda _: mock.Mock(failure_count=0, errors=[])
        ),
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Test-only helper for producing the output type used in production."""

        records = [
            firebase_domain.FirebaseRecord(
                auth_id=prefix, email=f'{prefix}@test.com', disabled=False
            )
            for prefix in prefixes
        ]
        return self.pipeline | beam.Create(records) | TestBatchOperation(op)


class FirebaseBatchOperationInheritanceTests(unittest.TestCase):
    """Tests for FirebaseBatchOperation that don't require a pipeline."""

    def test_incomplete_subclass_raises_type_error_on_instantiation(
        self,
    ) -> None:
        class IncompleteBatchOperation(
            firebase_transforms.FirebaseBatchOperation[str, TestBatchResult]
        ):
            """Dummy subclass for testing incomplete inheritance."""

            pass

        with self.assertRaises(TypeError):
            IncompleteBatchOperation()  # pylint: disable=abstract-class-instantiated

    def test_base_abstract_methods_raise_not_implemented_error(self) -> None:
        class DelegatesToSuper(
            firebase_transforms.FirebaseBatchOperation[str, TestBatchResult]
        ):
            """Concrete subclass that calls the super method."""

            def get_batch_input(
                self, record: firebase_domain.FirebaseRecord
            ) -> str:
                return super().get_batch_input(record)

            def run_batch_operation(self, batch: list[str]) -> TestBatchResult:
                return super().run_batch_operation(batch)

        operation = DelegatesToSuper()

        with self.assertRaisesRegex(NotImplementedError, 'get_batch_input'):
            operation.get_batch_input(
                firebase_domain.FirebaseRecord(
                    auth_id='a', email='a@a.com', disabled=False
                )
            )
        with self.assertRaisesRegex(NotImplementedError, 'run_batch_operation'):
            operation.run_batch_operation(['a'])


TestBatchResult = (
    firebase_auth.DeleteUsersResult | firebase_auth.UserImportResult
)


class TestBatchOperation(
    firebase_transforms.FirebaseBatchOperation[str, TestBatchResult]
):
    """Concrete subclass that delegates run_batch_operation to a callable."""

    def __init__(
        self,
        op: Callable[[list[str]], TestBatchResult],
        label: str | None = None,
    ) -> None:
        super().__init__(label=label)
        self.op = op

    def get_batch_input(self, record: firebase_domain.FirebaseRecord) -> str:
        return record.auth_id

    def run_batch_operation(self, batch: list[str]) -> TestBatchResult:
        return self.op(batch)
