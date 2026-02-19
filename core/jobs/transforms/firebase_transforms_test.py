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
from core.jobs.types import job_run_result

import apache_beam as beam
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
    """Concrete subclass that delegates handle_input_batch to a callable."""

    def __init__(
        self,
        batch_handler: Callable[[list[str]], FakeBatchResult],
        label: str | None = None,
    ) -> None:
        super().__init__('fake_operation', label=label)
        self._batch_handler = batch_handler

    def handle_input_batch(self, batch: list[str]) -> FakeBatchResult:
        return self._batch_handler(batch)


class FirebaseBatchOperationTests(unittest.TestCase):
    """Tests for FirebaseBatchOperation that don't require a pipeline."""

    def test_init_with_operation_name_sets_attribute(self) -> None:
        class StubOp(
            firebase_transforms.FirebaseBatchOperation[str, FakeBatchResult]
        ):
            """Dummy subclass for testing."""

            pass

        op = StubOp('my_op')
        self.assertEqual(op.operation_name, 'my_op')

    def test_handle_input_batch_without_subclass_override_raises_not_implemented(
        self,
    ) -> None:
        class StubOp(
            firebase_transforms.FirebaseBatchOperation[str, FakeBatchResult]
        ):
            """Dummy subclass for testing."""

            pass

        op = StubOp('my_op')
        with self.assertRaisesRegex(
            NotImplementedError, 'Subclasses must override'
        ):
            op.handle_input_batch([])


class FirebaseBatchOperationPipelineTests(job_test_utils.PipelinedTestBase):
    """Pipeline tests for FirebaseBatchOperation using a "fake" subclass."""

    def test_expand_with_no_inputs_produces_no_output(self) -> None:
        inputs = self.pipeline | beam.Create([])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=lambda batch: FakeBatchResult()
        )
        self.assert_pcoll_empty(output)

    def test_expand_with_successful_inputs_reports_ok_count(self) -> None:
        inputs = self.pipeline | beam.Create(['a', 'b', 'c'])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=lambda batch: FakeBatchResult()
        )
        self.assert_pcoll_equal(
            output,
            [job_run_result.JobRunResult(stdout='fake_operation success: 3')],
        )

    def test_expand_with_batch_value_error_reports_error(self) -> None:
        def raise_value_error(batch: list[str]) -> FakeBatchResult:
            raise ValueError('bad input')

        inputs = self.pipeline | beam.Create(['a'])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=raise_value_error
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(
                    stderr='fake_operation error at slice=[0:1]: bad input'
                ),
            ],
        )

    def test_expand_with_batch_firebase_error_reports_error(self) -> None:
        def raise_firebase_error(batch: list[str]) -> FakeBatchResult:
            raise firebase_auth.UserNotFoundError('missing')

        inputs = self.pipeline | beam.Create(['a', 'b'])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=raise_firebase_error
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(
                    stderr='fake_operation error at slice=[0:2]: missing'
                ),
            ],
        )

    def test_expand_with_individual_failures_reports_each_error(self) -> None:
        inputs = self.pipeline | beam.Create(['a', 'b', 'c'])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=lambda batch: FakeBatchResult(
                errors=[
                    FakeBatchError(0, 'fail-a'),
                    FakeBatchError(2, 'fail-c'),
                ],
            )
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(stdout='fake_operation success: 1'),
                job_run_result.JobRunResult(
                    stderr='fake_operation error at index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='fake_operation error at index=[2]: fail-c'
                ),
            ],
        )

    def test_expand_with_mixed_success_and_individual_failures_reports_both(
        self,
    ) -> None:
        inputs = self.pipeline | beam.Create(['a', 'b'])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=lambda batch: FakeBatchResult(
                errors=[FakeBatchError(1, 'fail-b')],
            )
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(stdout='fake_operation success: 1'),
                job_run_result.JobRunResult(
                    stderr='fake_operation error at index=[1]: fail-b'
                ),
            ],
        )

    def test_expand_with_all_inputs_failed_produces_no_ok_count(self) -> None:
        inputs = self.pipeline | beam.Create(['a', 'b'])
        output = inputs | FakeFirebaseBatchOperation(
            batch_handler=lambda batch: FakeBatchResult(
                errors=[
                    FakeBatchError(0, 'fail-a'),
                    FakeBatchError(1, 'fail-b'),
                ],
            )
        )
        self.assert_pcoll_equal(
            output,
            [
                job_run_result.JobRunResult(
                    stderr='fake_operation error at index=[0]: fail-a'
                ),
                job_run_result.JobRunResult(
                    stderr='fake_operation error at index=[1]: fail-b'
                ),
            ],
        )

    def test_expand_with_inputs_exceeding_batch_limit_processes_each_batch(
        self,
    ) -> None:
        call_count = 0

        def per_batch_handler(unused_batch: list[str]) -> FakeBatchResult:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return FakeBatchResult()
            else:
                raise ValueError('batch-2-error')

        inputs = self.pipeline | beam.Create(['a', 'b', 'c'])
        with self.swap(firebase_transforms, 'FIREBASE_BATCH_LIMIT', 2):
            output = inputs | FakeFirebaseBatchOperation(
                batch_handler=per_batch_handler
            )
            self.assert_pcoll_equal(
                output,
                [
                    job_run_result.JobRunResult(
                        stdout='fake_operation success: 2'
                    ),
                    job_run_result.JobRunResult(
                        stderr=(
                            'fake_operation error at '
                            'slice=[2:3]: batch-2-error'
                        )
                    ),
                ],
            )
