# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Provides an Apache Beam API for operating on NDB models."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result

import apache_beam as beam
import result
from apache_beam import pvalue


class FromTaggedOutputsTests(job_test_utils.PipelinedTestBase):
    def test_init_with_pass_tag_in_fail_tags_raises(self) -> None:
        with self.assertRaisesRegex(ValueError, 'must not be one of'):
            job_result_transforms.FromTaggedOutputs('OK', 'OK')

    def test_init_with_main_as_fail_tag_raises(self) -> None:
        with self.assertRaisesRegex(ValueError, 'must not be one of'):
            job_result_transforms.FromTaggedOutputs('', 'main')

    def test_results_with_nothing_produces_nothing(self) -> None:
        self.assert_pcoll_empty(self.run_from_tagged_outputs(('OK', 'ERR')))

    def test_results_with_only_pass_yields_only_stdout(self) -> None:
        self.assert_pcoll_equal(
            self.run_from_tagged_outputs(('OK', 'ERR'), ('OK', 3), ('OK', 5)),
            [job_run_result.JobRunResult(stdout='OK: 8')],
        )

    def test_results_with_only_fail_yields_only_stderrs(self) -> None:
        self.assert_pcoll_equal(
            self.run_from_tagged_outputs(
                ('OK', 'ERR'), ('ERR', 'oh no!'), ('ERR', 'uh-oh')
            ),
            [
                job_run_result.JobRunResult(stderr='ERR: oh no!'),
                job_run_result.JobRunResult(stderr='ERR: uh-oh'),
            ],
        )

    def test_results_with_pass_and_fail_yields_stdout_and_stderr(self) -> None:
        self.assert_pcoll_equal(
            self.run_from_tagged_outputs(
                ('OK', 'ERR'), ('OK', 3), ('ERR', 'uh-oh'), ('OK', 5)
            ),
            [
                job_run_result.JobRunResult(stdout='OK: 8'),
                job_run_result.JobRunResult(stderr='ERR: uh-oh'),
            ],
        )

    def test_results_with_prefix(self) -> None:
        self.assert_pcoll_equal(
            self.run_from_tagged_outputs(
                ('OK', 'ERR'), ('OK', 2), ('ERR', 'uh-oh'), prefix='MyJob'
            ),
            [
                job_run_result.JobRunResult(stdout='MyJob OK: 2'),
                job_run_result.JobRunResult(stderr='MyJob ERR: uh-oh'),
            ],
        )

    def test_results_with_prefix_preserves_whitespace_in_prefix(self) -> None:
        self.assert_pcoll_equal(
            self.run_from_tagged_outputs(
                ('OK', 'ERR'), ('OK', 2), ('ERR', 'uh-oh'), prefix='   MyJob:  '
            ),
            [
                job_run_result.JobRunResult(stdout='   MyJob:  OK: 2'),
                job_run_result.JobRunResult(stderr='   MyJob:  ERR: uh-oh'),
            ],
        )

    def run_from_tagged_outputs(
        self,
        tags: tuple[str, ...],
        *args_list: tuple[str, str | int],
        prefix: str = '',
    ) -> pvalue.DoOutputsTuple:
        """Runs a pipeline to run FromTaggedOutputs with the given test data."""

        return (
            self.pipeline
            | beam.Create(args_list)
            | beam.ParDo(
                lambda args: [pvalue.TaggedOutput(*args)]
            ).with_outputs(*tags)
            | job_result_transforms.FromTaggedOutputs(*tags, prefix=prefix)
        )


class ResultsToJobRunResultsTests(job_test_utils.PipelinedTestBase):
    def test_ok_results_without_prefix_correctly_outputs(self) -> None:
        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create([result.Ok('ok'), result.Ok('ok')])
                | job_result_transforms.ResultsToJobRunResults()
            ),
            [job_run_result.JobRunResult.as_stdout('SUCCESS: 2')],
        )

    def test_ok_results_with_prefix_correctly_outputs(self) -> None:
        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create([result.Ok('ok'), result.Ok('ok')])
                | job_result_transforms.ResultsToJobRunResults('PREFIX')
            ),
            [job_run_result.JobRunResult.as_stdout('PREFIX SUCCESS: 2')],
        )

    def test_err_results_without_prefix_correctly_outputs(self) -> None:
        errors = [result.Err('err 1'), result.Err('err 2'), result.Err('err 2')]
        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create(errors)
                | job_result_transforms.ResultsToJobRunResults()
            ),
            [
                job_run_result.JobRunResult.as_stderr('ERROR: "err 1": 1'),
                job_run_result.JobRunResult.as_stderr('ERROR: "err 2": 2'),
            ],
        )

    def test_err_results_with_prefix_correctly_outputs(self) -> None:
        errors = [result.Err('err 1'), result.Err('err 2'), result.Err('err 2')]
        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create(errors)
                | job_result_transforms.ResultsToJobRunResults('PRE')
            ),
            [
                job_run_result.JobRunResult.as_stderr('PRE ERROR: "err 1": 1'),
                job_run_result.JobRunResult.as_stderr('PRE ERROR: "err 2": 2'),
            ],
        )


class CountObjectsToJobRunResultTests(job_test_utils.PipelinedTestBase):
    def test_three_objects_without_prefix_correctly_outputs(self) -> None:
        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create(['item', 'item', 'item'])
                | job_result_transforms.CountObjectsToJobRunResult()
            ),
            [job_run_result.JobRunResult.as_stdout('SUCCESS: 3')],
        )

    def test_three_objects_with_prefix_correctly_outputs(self) -> None:
        self.assert_pcoll_equal(
            (
                self.pipeline
                | beam.Create(['item', 'item', 'item'])
                | job_result_transforms.CountObjectsToJobRunResult('PREFIX')
            ),
            [job_run_result.JobRunResult.as_stdout('PREFIX SUCCESS: 3')],
        )

    def test_zero_objects_correctly_outputs(self) -> None:
        self.assert_pcoll_empty(
            (
                self.pipeline
                | beam.Create([])
                | job_result_transforms.CountObjectsToJobRunResult()
            )
        )
