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

from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.transforms import firebase_transforms, job_result_transforms
from core.jobs.types import job_run_result

import apache_beam as beam
import firebase_admin
import firebase_admin.auth as firebase_auth
from typing import Callable, Sequence


class FakeBatchError(firebase_auth.ErrorInfo):
    """Test stub for ErrorInfo."""

    def __init__(self, index: int, reason: str) -> None:
        super().__init__({'index': index, 'message': reason})


class FakeBatchResult(
    firebase_auth.DeleteUsersResult,
    firebase_auth.UserImportResult,
):
    """Test stubs for DeleteUsersResult & UserImportResult."""

    def __init__(self, errors: Sequence[FakeBatchError] = ()) -> None:
        super().__init__(mock.Mock(errors=list(errors)), 0)


class FakeBatchOperation(
    firebase_transforms.FirebaseBatchOperation[str, FakeBatchResult]
):
    """Concrete subclass that delegates handle_batched_items to a callable."""

    def __init__(self, op: Callable[[list[str]], FakeBatchResult]) -> None:
        super().__init__()
        self.op = op

    def setup(self) -> None:
        pass

    def handle_batched_items(self, batch: list[str]) -> FakeBatchResult:
        return self.op(batch)


class DeleteRecordsPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for DeleteRecords."""

    def test_with_uids_reports_success_count(self) -> None:
        with (
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            self.swap_to_always_return(
                firebase_auth, 'delete_users', FakeBatchResult()
            ),
        ):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create([['uid1', 'uid2']])
                    | beam.ParDo(
                        do_fn := firebase_transforms.DeleteRecords()
                    ).with_outputs(
                        do_fn.PASS_TAG,
                        do_fn.FAIL_TAG,
                    )
                    | job_result_transforms.FromTaggedOutputs(
                        do_fn.PASS_TAG,
                        do_fn.FAIL_TAG,
                    )
                ),
                [job_run_result.JobRunResult(stdout='SUCCESS: 2')],
            )


class CreateRecordsPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for CreateRecords."""

    def test_with_records_reports_success_count(self) -> None:
        records = [
            firebase_auth.ImportUserRecord(uid='uid1'),
            firebase_auth.ImportUserRecord(uid='uid2'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', False),
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            mock.patch.object(
                firebase_auth, 'import_users', return_value=FakeBatchResult()
            ) as import_users,
            mock.patch.object(firebase_auth, 'create_user') as create_users,
        ):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create([records])
                    | beam.ParDo(
                        do_fn := firebase_transforms.CreateRecords()
                    ).with_outputs(
                        do_fn.PASS_TAG,
                        do_fn.FAIL_TAG,
                    )
                    | job_result_transforms.FromTaggedOutputs(
                        do_fn.PASS_TAG,
                        do_fn.FAIL_TAG,
                    )
                ),
                [job_run_result.JobRunResult(stdout='SUCCESS: 2')],
            )

        import_users.assert_called()
        create_users.assert_not_called()

    def test_with_emulator_calls_create_user_instead(self) -> None:
        records = [
            firebase_auth.ImportUserRecord(uid='a', email='a@a.com'),
            firebase_auth.ImportUserRecord(uid='b'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', True),
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            mock.patch.object(
                firebase_auth, 'import_users', return_value=FakeBatchResult()
            ) as import_users,
            mock.patch.object(firebase_auth, 'create_user') as create_users,
        ):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create([records])
                    | beam.ParDo(
                        do_fn := firebase_transforms.CreateRecords()
                    ).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
                    | job_result_transforms.FromTaggedOutputs(
                        do_fn.PASS_TAG,
                        do_fn.FAIL_TAG,
                        prefix='CREATED',
                    )
                ),
                [job_run_result.JobRunResult(stdout='CREATED SUCCESS: 2')],
            )

        import_users.assert_not_called()
        create_users.assert_called()

    def test_with_network_error_reports_create_user_error(self) -> None:
        records = [
            firebase_auth.ImportUserRecord(uid='a', email='a@a.com'),
            firebase_auth.ImportUserRecord(uid='b'),
        ]

        with (
            self.swap(constants, 'EMULATOR_MODE', True),
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            self.swap_to_always_raise(
                firebase_auth, 'create_user', ValueError('network error')
            ),
        ):
            self.assert_pcoll_equal(
                (
                    self.pipeline
                    | beam.Create([records])
                    | beam.ParDo(
                        do_fn := firebase_transforms.CreateRecords()
                    ).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
                    | job_result_transforms.FromTaggedOutputs(
                        do_fn.PASS_TAG,
                        do_fn.FAIL_TAG,
                        prefix='CREATED',
                    )
                ),
                [
                    job_run_result.JobRunResult(
                        stderr='CREATED FAILURE: at index=[0]: network error'
                    ),
                    job_run_result.JobRunResult(
                        stderr='CREATED FAILURE: at index=[1]: network error'
                    ),
                ],
            )


class FirebaseBatchOperationPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for FirebaseBatchOperation using a "fake" subclass."""

    def test_expand_with_no_inputs_produces_no_output(self) -> None:
        self.assert_pcoll_empty(self._run_batch_operation([]))

    def test_expand_with_successful_inputs_reports_ok_count(self) -> None:
        self.assert_pcoll_equal(
            self._run_batch_operation(['a', 'b', 'c']),
            [job_run_result.JobRunResult(stdout='TEST OPERATION SUCCESS: 3')],
        )

    def test_expand_with_batch_value_error_reports_error(self) -> None:
        def raise_value_error(_: list[str]) -> FakeBatchResult:
            raise ValueError('bad input')

        self.assert_pcoll_equal(
            self._run_batch_operation(['a'], raise_value_error),
            [
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at slice=[0:1]: bad input'
                ),
            ],
        )

    def test_expand_with_batch_firebase_error_reports_error(self) -> None:
        def raise_firebase_error(_: list[str]) -> FakeBatchResult:
            raise firebase_auth.UserNotFoundError('missing')

        self.assert_pcoll_equal(
            self._run_batch_operation(['a', 'b'], raise_firebase_error),
            [
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at slice=[0:2]: missing'
                ),
            ],
        )

    def test_expand_with_individual_failures_reports_each_error(self) -> None:
        errors = [FakeBatchError(0, 'fail-a'), FakeBatchError(2, 'fail-c')]

        self.assert_pcoll_equal(
            self._run_batch_operation(
                ['a', 'b', 'c'],
                lambda _: FakeBatchResult(errors=errors),
            ),
            [
                job_run_result.JobRunResult(stdout='TEST OPERATION SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at index=[2]: fail-c'
                ),
            ],
        )

    def test_expand_with_mixed_success_and_individual_failures_reports_both(
        self,
    ) -> None:
        errors = [FakeBatchError(1, 'fail-b')]

        self.assert_pcoll_equal(
            self._run_batch_operation(
                ['a', 'b'],
                lambda _: FakeBatchResult(errors=errors),
            ),
            [
                job_run_result.JobRunResult(stdout='TEST OPERATION SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at index=[1]: fail-b'
                ),
            ],
        )

    def test_expand_with_all_inputs_failed_produces_no_ok_count(
        self,
    ) -> None:
        errors = [FakeBatchError(0, 'fail-a'), FakeBatchError(1, 'fail-b')]

        self.assert_pcoll_equal(
            self._run_batch_operation(
                ['a', 'b'],
                lambda _: FakeBatchResult(errors=errors),
            ),
            [
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='TEST OPERATION FAILURE: at index=[1]: fail-b'
                ),
            ],
        )

    def test_expand_with_inputs_exceeding_batch_limit_processes_each_batch(
        self,
    ) -> None:
        call_count = 0

        def per_batch_handler(_: list[str]) -> FakeBatchResult:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return FakeBatchResult()
            else:
                raise ValueError('uh-oh')

        with self.swap(
            firebase_transforms.FirebaseBatchOperation, 'BATCH_LIMIT', 2
        ):
            self.assert_pcoll_equal(
                self._run_batch_operation(['a', 'b', 'c'], per_batch_handler),
                [
                    job_run_result.JobRunResult(
                        stdout='TEST OPERATION SUCCESS: 2'
                    ),
                    job_run_result.JobRunResult(
                        stderr='TEST OPERATION FAILURE: at slice=[2:3]: uh-oh'
                    ),
                ],
            )

    def _run_batch_operation(
        self,
        inputs: list[str],
        op: Callable[[list[str]], FakeBatchResult] | None = None,
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Test-only helper for producing the output type used in production."""

        do_fn = FakeBatchOperation(op or (lambda _: FakeBatchResult()))
        return (
            self.pipeline
            | beam.Create([inputs])
            | beam.ParDo(do_fn).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
            | job_result_transforms.FromTaggedOutputs(
                do_fn.PASS_TAG,
                do_fn.FAIL_TAG,
                prefix='TEST OPERATION',
            )
        )


class FirebaseBatchOperationTests(unittest.TestCase):
    """Tests for FirebaseBatchOperation that don't require a pipeline."""

    def test_handle_input_batch_without_subclass_override_raises_not_implemented(
        self,
    ) -> None:
        class IncompleteBatchOperation(
            firebase_transforms.FirebaseBatchOperation[str, FakeBatchResult]
        ):
            """Dummy subclass for testing."""

            pass

        op = IncompleteBatchOperation()
        with self.assertRaisesRegex(
            NotImplementedError, 'Subclasses must override this function'
        ):
            op.handle_batched_items([])
