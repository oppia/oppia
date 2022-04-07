# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for jobs.types.job_run_result."""

from __future__ import annotations

import pickle

from core.jobs.types import job_run_result
from core.tests import test_utils


class JobRunResultTests(test_utils.TestBase):

    def test_usage(self) -> None:
        run_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        self.assertEqual(run_result.stdout, 'abc')
        self.assertEqual(run_result.stderr, '123')

    def test_as_stdout(self) -> None:
        run_result = job_run_result.JobRunResult.as_stdout(123)
        self.assertEqual(run_result.stdout, '123')
        self.assertEqual(run_result.stderr, '')

    def test_as_stderr(self) -> None:
        run_result = job_run_result.JobRunResult.as_stderr(123)
        self.assertEqual(run_result.stderr, '123')
        self.assertEqual(run_result.stdout, '')

    def test_as_stdout_using_repr(self) -> None:
        run_result = job_run_result.JobRunResult.as_stdout('abc', use_repr=True)
        self.assertEqual(run_result.stdout, '\'abc\'')
        self.assertEqual(run_result.stderr, '')

    def test_as_stderr_using_repr(self) -> None:
        run_result = job_run_result.JobRunResult.as_stderr('abc', use_repr=True)
        self.assertEqual(run_result.stderr, '\'abc\'')
        self.assertEqual(run_result.stdout, '')

    def test_empty_result_raises_value_error(self) -> None:
        with self.assertRaisesRegex(ValueError, 'must not be empty'):  # type: ignore[no-untyped-call]
            job_run_result.JobRunResult()

    def test_enormous_result_raises_value_error(self) -> None:
        with self.assertRaisesRegex(ValueError, r'must not exceed \d+ bytes'):  # type: ignore[no-untyped-call]
            job_run_result.JobRunResult(stdout='a' * 1501)

    def test_accumulate(self) -> None:
        single_job_run_result = job_run_result.JobRunResult.accumulate([
            job_run_result.JobRunResult(stdout='abc', stderr=''),
            job_run_result.JobRunResult(stdout='', stderr='123'),
            job_run_result.JobRunResult(stdout='def', stderr='456'),
        ])[0]

        self.assertItemsEqual(  # type: ignore[no-untyped-call]
            single_job_run_result.stdout.split('\n'), ['abc', 'def'])
        self.assertItemsEqual(  # type: ignore[no-untyped-call]
            single_job_run_result.stderr.split('\n'), ['123', '456'])

    def test_accumulate_with_enormous_outputs(self) -> None:
        accumulated_results = job_run_result.JobRunResult.accumulate([
            job_run_result.JobRunResult(
                stdout='a' * 750, stderr='b' * 750),
            job_run_result.JobRunResult(
                stdout='a' * 500, stderr='b' * 500),
            job_run_result.JobRunResult(
                stdout='a' * 250, stderr='b' * 250),
            job_run_result.JobRunResult(
                stdout='a' * 100, stderr='b' * 100),
            job_run_result.JobRunResult(
                stdout='a' * 50, stderr='b' * 50),
        ])

        # 100000 and 200000 are small enough ot fit as one, but the others will
        # each need their own result.
        self.assertEqual(len(accumulated_results), 3)

    def test_accumulate_with_empty_list(self) -> None:
        self.assertEqual(job_run_result.JobRunResult.accumulate([]), [])

    def test_len_in_bytes(self) -> None:
        result = job_run_result.JobRunResult(stdout='123', stderr='123')
        self.assertEqual(result.len_in_bytes(), 6)

    def test_len_in_bytes_of_unicode(self) -> None:
        result = job_run_result.JobRunResult(stdout='😀', stderr='😀')
        self.assertEqual(result.len_in_bytes(), 8)

    def test_equality(self) -> None:
        a_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        b_result = job_run_result.JobRunResult(stdout='def', stderr='456')

        self.assertEqual(a_result, a_result)
        self.assertEqual(b_result, b_result)
        self.assertNotEqual(a_result, b_result)

    def test_hash(self) -> None:
        a_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        b_result = job_run_result.JobRunResult(stdout='def', stderr='456')

        self.assertIn(a_result, {a_result})
        self.assertNotIn(b_result, {a_result})

    def test_pickle(self) -> None:
        run_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        pickle_result = pickle.loads(pickle.dumps(run_result))

        self.assertEqual(run_result, pickle_result)

    def test_repr(self) -> None:
        run_result = job_run_result.JobRunResult(stdout='abc', stderr='123')

        self.assertEqual(
            repr(run_result), 'JobRunResult(stdout="abc", stderr="123")')
