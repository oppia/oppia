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

    def __init__(self, errors: Sequence[FakeBatchError] | None = None) -> None:
        super().__init__(mock.Mock(errors=errors or []), 0)


class FakeFirebaseBatchOperation(
    firebase_transforms.FirebaseBatchOperation[str, FakeBatchResult]
):
    """Concrete subclass that delegates handle_batched_items to a callable."""

    def __init__(
        self, batch_handler: Callable[[list[str]], FakeBatchResult]
    ) -> None:
        super().__init__()
        self._batch_handler = batch_handler

    def setup(self) -> None:
        """Skips Firebase initialization in tests."""
        pass

    def handle_batched_items(self, batch: list[str]) -> FakeBatchResult:
        return self._batch_handler(batch)


class FirebaseBatchOperationTests(unittest.TestCase):
    """Tests for FirebaseBatchOperation that don't require a pipeline."""

    def test_handle_input_batch_without_subclass_override_raises_not_implemented(
        self,
    ) -> None:
        class StubOp(
            firebase_transforms.FirebaseBatchOperation[str, FakeBatchResult]
        ):
            """Dummy subclass for testing."""

            pass

        op = StubOp()
        with self.assertRaisesRegex(
            NotImplementedError, 'Subclasses must override this function'
        ):
            op.handle_batched_items([])


class DeleteRecordsPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for DeleteRecords."""

    def test_with_uids_reports_success_count(self) -> None:
        do_fn = firebase_transforms.DeleteRecords()
        output = (
            self.pipeline
            | beam.Create(['uid1', 'uid2'])
            | beam.combiners.ToList()
            | beam.ParDo(do_fn).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
            | job_result_transforms.FromTaggedOutputs(
                do_fn.PASS_TAG,
                do_fn.FAIL_TAG,
                prefix='delete',
            )
        )
        with (
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            self.swap_to_always_return(
                firebase_auth, 'delete_users', FakeBatchResult()
            ),
        ):
            self.assert_pcoll_equal(
                output,
                [job_run_result.JobRunResult(stdout='delete SUCCESS: 2')],
            )


class CreateRecordsPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for CreateRecords."""

    def test_with_records_reports_success_count(self) -> None:
        do_fn = firebase_transforms.CreateRecords()
        records = [
            firebase_auth.ImportUserRecord(uid='uid1'),
            firebase_auth.ImportUserRecord(uid='uid2'),
        ]
        create_results = (
            self.pipeline
            | beam.Create(records)
            | beam.combiners.ToList()
            | beam.ParDo(do_fn).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
            | job_result_transforms.FromTaggedOutputs(
                do_fn.PASS_TAG,
                do_fn.FAIL_TAG,
                prefix='create',
            )
        )
        with (
            self.swap(constants, 'EMULATOR_MODE', False),
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            mock.patch.object(
                firebase_auth,
                'import_users',
                return_value=FakeBatchResult(),
            ) as import_users_mock,
            mock.patch.object(
                firebase_auth, 'create_user'
            ) as create_users_mock,
        ):
            self.assert_pcoll_equal(
                create_results,
                [job_run_result.JobRunResult(stdout='create SUCCESS: 2')],
            )

        import_users_mock.assert_called()
        create_users_mock.assert_not_called()

    def test_with_emulator_calls_create_user_instead(self) -> None:
        do_fn = firebase_transforms.CreateRecords()
        records = [
            firebase_auth.ImportUserRecord(uid='a', email='a@a.com'),
            firebase_auth.ImportUserRecord(uid='b'),
        ]
        create_results = (
            self.pipeline
            | beam.Create(records)
            | beam.combiners.ToList()
            | beam.ParDo(do_fn).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
            | job_result_transforms.FromTaggedOutputs(
                do_fn.PASS_TAG,
                do_fn.FAIL_TAG,
                prefix='CREATED',
            )
        )

        with (
            self.swap(constants, 'EMULATOR_MODE', True),
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            mock.patch.object(
                firebase_auth,
                'import_users',
                return_value=FakeBatchResult(),
            ) as import_users_mock,
            mock.patch.object(
                firebase_auth, 'create_user'
            ) as create_users_mock,
        ):
            self.assert_pcoll_equal(
                create_results,
                [job_run_result.JobRunResult(stdout='CREATED SUCCESS: 2')],
            )

        import_users_mock.assert_not_called()
        create_users_mock.assert_called()

    def test_with_network_error_reports_create_user_error(self) -> None:
        do_fn = firebase_transforms.CreateRecords()
        records = [
            firebase_auth.ImportUserRecord(uid='a', email='a@a.com'),
            firebase_auth.ImportUserRecord(uid='b'),
        ]
        create_results = (
            self.pipeline
            | beam.Create(records)
            | beam.combiners.ToList()
            | beam.ParDo(do_fn).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
            | job_result_transforms.FromTaggedOutputs(
                do_fn.PASS_TAG,
                do_fn.FAIL_TAG,
                prefix='CREATED',
            )
        )

        with (
            self.swap(constants, 'EMULATOR_MODE', True),
            self.swap_to_always_return(firebase_admin, 'initialize_app'),
            self.swap_to_always_raise(
                firebase_auth, 'create_user', ValueError('network error')
            ),
        ):
            self.assert_pcoll_equal(
                create_results,
                [
                    job_run_result.JobRunResult(
                        stderr='CREATED FAILURE: with index=[0]: network error'
                    ),
                    job_run_result.JobRunResult(
                        stderr='CREATED FAILURE: with index=[1]: network error'
                    ),
                ],
            )


class FirebaseBatchOperationPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for FirebaseBatchOperation using a "fake" subclass."""

    def _run_fake_operation(
        self,
        inputs: list[str],
        batch_handler: Callable[[list[str]], FakeBatchResult],
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Test-only helper for producing the output type used in production."""
        do_fn = FakeFirebaseBatchOperation(batch_handler)
        return (
            self.pipeline
            | beam.Create(inputs)
            | beam.combiners.ToList()
            | beam.ParDo(do_fn).with_outputs(do_fn.PASS_TAG, do_fn.FAIL_TAG)
            | job_result_transforms.FromTaggedOutputs(
                do_fn.PASS_TAG,
                do_fn.FAIL_TAG,
                prefix='fake_operation',
            )
        )

    def test_expand_with_no_inputs_produces_no_output(self) -> None:
        output = self._run_fake_operation([], lambda _: FakeBatchResult())
        self.assert_pcoll_empty(output)

    def test_expand_with_successful_inputs_reports_ok_count(self) -> None:
        output = self._run_fake_operation(
            ['a', 'b', 'c'], lambda _: FakeBatchResult()
        )
        self.assert_pcoll_equal(
            output,
            [job_run_result.JobRunResult(stdout='fake_operation SUCCESS: 3')],
        )

    def test_expand_with_batch_value_error_reports_error(self) -> None:
        def raise_value_error(_: list[str]) -> FakeBatchResult:
            raise ValueError('bad input')

        output = self._run_fake_operation(['a'], raise_value_error)
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with slice=[0:1]: bad input'
                ),
            ],
        )

    def test_expand_with_batch_firebase_error_reports_error(self) -> None:
        def raise_firebase_error(_: list[str]) -> FakeBatchResult:
            raise firebase_auth.UserNotFoundError('missing')

        output = self._run_fake_operation(['a', 'b'], raise_firebase_error)
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with slice=[0:2]: missing'
                ),
            ],
        )

    def test_expand_with_individual_failures_reports_each_error(self) -> None:
        output = self._run_fake_operation(
            ['a', 'b', 'c'],
            lambda _: FakeBatchResult(
                errors=[
                    FakeBatchError(0, 'fail-a'),
                    FakeBatchError(2, 'fail-c'),
                ],
            ),
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(stdout='fake_operation SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with index=[2]: fail-c'
                ),
            ],
        )

    def test_expand_with_mixed_success_and_individual_failures_reports_both(
        self,
    ) -> None:
        output = self._run_fake_operation(
            ['a', 'b'],
            lambda _: FakeBatchResult(errors=[FakeBatchError(1, 'fail-b')]),
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(stdout='fake_operation SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with index=[1]: fail-b'
                ),
            ],
        )

    def test_expand_with_all_inputs_failed_produces_no_ok_count(
        self,
    ) -> None:
        output = self._run_fake_operation(
            ['a', 'b'],
            lambda _: FakeBatchResult(
                errors=[
                    FakeBatchError(0, 'fail-a'),
                    FakeBatchError(1, 'fail-b'),
                ],
            ),
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='fake_operation FAILURE: with index=[1]: fail-b'
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
            output = self._run_fake_operation(
                ['a', 'b', 'c'], per_batch_handler
            )
            self.assert_pcoll_equal(
                output,
                [
                    job_run_result.JobRunResult(
                        stdout='fake_operation SUCCESS: 2'
                    ),
                    job_run_result.JobRunResult(
                        stderr='fake_operation FAILURE: with slice=[2:3]: uh-oh'
                    ),
                ],
            )
