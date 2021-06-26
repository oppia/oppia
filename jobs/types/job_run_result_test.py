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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import pickle

from core.tests import test_utils
from jobs.types import job_run_result


class JobRunResultTests(test_utils.TestBase):

    def test_usage(self):
        run_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        self.assertEqual(run_result.stdout, 'abc')
        self.assertEqual(run_result.stderr, '123')

    def test_as_stdout(self):
        run_result = job_run_result.JobRunResult.as_stdout(123)
        self.assertEqual(run_result.stdout, '123')
        self.assertEqual(run_result.stderr, '')

    def test_as_stderr(self):
        run_result = job_run_result.JobRunResult.as_stderr(123)
        self.assertEqual(run_result.stderr, '123')
        self.assertEqual(run_result.stdout, '')

    def test_as_stdout_using_repr(self):
        run_result = job_run_result.JobRunResult.as_stdout('abc', use_repr=True)
        self.assertEqual(run_result.stdout, 'u\'abc\'')
        self.assertEqual(run_result.stderr, '')

    def test_as_stderr_using_repr(self):
        run_result = job_run_result.JobRunResult.as_stderr('abc', use_repr=True)
        self.assertEqual(run_result.stderr, 'u\'abc\'')
        self.assertEqual(run_result.stdout, '')

    def test_empty_result_raises_value_error(self):
        with self.assertRaisesRegexp(ValueError, 'must not be empty'):
            job_run_result.JobRunResult()

    def test_enormous_result_raises_value_error(self):
        with self.assertRaisesRegexp(ValueError, r'must not exceed \d+ bytes'):
            job_run_result.JobRunResult(stdout='a' * 1000001)

    def test_accumulate(self):
        (single_job_run_result,) = job_run_result.JobRunResult.accumulate([
            job_run_result.JobRunResult(stdout='abc', stderr=''),
            job_run_result.JobRunResult(stdout='', stderr='123'),
            job_run_result.JobRunResult(stdout='def', stderr='456'),
        ])

        self.assertItemsEqual(
            single_job_run_result.stdout.split('\n'), ['abc', 'def'])
        self.assertItemsEqual(
            single_job_run_result.stderr.split('\n'), ['123', '456'])

    def test_accumulate_with_enormous_outputs(self):
        accumulated_results = job_run_result.JobRunResult.accumulate([
            job_run_result.JobRunResult(
                stdout='a' * 500000, stderr='b' * 500000),
            job_run_result.JobRunResult(
                stdout='a' * 400000, stderr='b' * 400000),
            job_run_result.JobRunResult(
                stdout='a' * 300000, stderr='b' * 300000),
            job_run_result.JobRunResult(
                stdout='a' * 200000, stderr='b' * 200000),
            job_run_result.JobRunResult(
                stdout='a' * 100000, stderr='b' * 100000),
        ])

        # 100000 and 200000 are small enough ot fit as one, but the others will
        # each need their own result.
        self.assertEqual(len(accumulated_results), 4)

    def test_accumulate_with_empty_list(self):
        self.assertEqual(job_run_result.JobRunResult.accumulate([]), [])

    def test_len_in_bytes(self):
        result = job_run_result.JobRunResult(stdout='123', stderr='123')
        self.assertEqual(result.len_in_bytes(), 6)

    def test_len_in_bytes_of_unicode(self):
        result = job_run_result.JobRunResult(stdout='😀', stderr='😀')
        self.assertEqual(result.len_in_bytes(), 8)

    def test_equality(self):
        a_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        b_result = job_run_result.JobRunResult(stdout='def', stderr='456')

        self.assertEqual(a_result, a_result)
        self.assertEqual(b_result, b_result)
        self.assertNotEqual(a_result, b_result)

    def test_hash(self):
        a_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        b_result = job_run_result.JobRunResult(stdout='def', stderr='456')

        self.assertIn(a_result, {a_result})
        self.assertNotIn(b_result, {a_result})

    def test_pickle(self):
        run_result = job_run_result.JobRunResult(stdout='abc', stderr='123')
        pickle_result = pickle.loads(pickle.dumps(run_result))

        self.assertEqual(run_result, pickle_result)

    def test_repr(self):
        run_result = job_run_result.JobRunResult(stdout='abc', stderr='123')

        self.assertEqual(
            repr(run_result), 'JobRunResult(stdout="abc", stderr="123")')
