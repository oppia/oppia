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


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class CreateTaggedOutputs(beam.PTransform):  # type: ignore[misc]
    """Test helper PTransform that builds a DoOutputsTuple from tagged data."""

    def __init__(
        self, tags: tuple[str, ...], *vals: tuple[str, str | int]
    ) -> None:
        super().__init__()
        self.tags = tags
        self.vals = vals

    def expand(self, pbegin: pvalue.PBegin) -> pvalue.DoOutputsTuple:
        into_tagged_outputs = lambda args: [pvalue.TaggedOutput(*args)]
        return (
            pbegin
            | beam.Create(self.vals)
            | beam.ParDo(into_tagged_outputs).with_outputs(*self.tags)
        )


class FromTaggedOutputsTests(job_test_utils.PipelinedTestBase):

    def test_init_with_pass_tag_in_fail_tags_raises(self) -> None:
        with self.assertRaisesRegex(ValueError, 'must not be one of'):
            job_result_transforms.FromTaggedOutputs('OK', 'OK')

    def test_results_with_nothing_produces_nothing(self) -> None:
        results = (
            self.pipeline
            | CreateTaggedOutputs(('OK', 'ERR'))
            | job_result_transforms.FromTaggedOutputs('OK', 'ERR')
        )
        self.assert_pcoll_empty(results)

    def test_results_with_only_pass_yields_only_stdout(self) -> None:
        results = (
            self.pipeline
            | CreateTaggedOutputs(('OK', 'ERR'), ('OK', 3), ('OK', 5))
            | job_result_transforms.FromTaggedOutputs('OK')
        )
        self.assert_pcoll_equal(
            results,
            [job_run_result.JobRunResult(stdout='OK: 8')],
        )

    def test_results_with_only_fail_yields_only_stderrs(self) -> None:
        results = (
            self.pipeline
            | CreateTaggedOutputs(
                ('OK', 'ERR'), ('ERR', 'oh no!'), ('ERR', 'uh-oh')
            )
            | job_result_transforms.FromTaggedOutputs('OK', 'ERR')
        )
        self.assert_pcoll_equal(
            results,
            [
                job_run_result.JobRunResult(stderr='ERR: oh no!'),
                job_run_result.JobRunResult(stderr='ERR: uh-oh'),
            ],
        )

    def test_results_with_pass_and_fail_yields_stdout_and_stderr(self) -> None:
        results = (
            self.pipeline
            | CreateTaggedOutputs(
                ('OK', 'ERR'), ('OK', 3), ('ERR', 'uh-oh'), ('OK', 5)
            )
            | job_result_transforms.FromTaggedOutputs('OK', 'ERR')
        )
        self.assert_pcoll_equal(
            results,
            [
                job_run_result.JobRunResult(stdout='OK: 8'),
                job_run_result.JobRunResult(stderr='ERR: uh-oh'),
            ],
        )

    def test_results_with_prefix(self) -> None:
        results = (
            self.pipeline
            | CreateTaggedOutputs(('OK', 'ERR'), ('OK', 2), ('ERR', 'uh-oh'))
            | job_result_transforms.FromTaggedOutputs(
                'OK', 'ERR', prefix='MyJob'
            )
        )
        self.assert_pcoll_equal(
            results,
            [
                job_run_result.JobRunResult(stdout='MyJob OK: 2'),
                job_run_result.JobRunResult(stderr='MyJob ERR: uh-oh'),
            ],
        )

    def test_results_with_prefix_preserves_whitespace_in_prefix(self) -> None:
        results = (
            self.pipeline
            | CreateTaggedOutputs(('OK', 'ERR'), ('OK', 2), ('ERR', 'uh-oh'))
            | job_result_transforms.FromTaggedOutputs(
                'OK', 'ERR', prefix='   MyJob:  '
            )
        )
        self.assert_pcoll_equal(
            results,
            [
                job_run_result.JobRunResult(stdout='   MyJob:  OK: 2'),
                job_run_result.JobRunResult(stderr='   MyJob:  ERR: uh-oh'),
            ],
        )


class ResultsToJobRunResultsTests(job_test_utils.PipelinedTestBase):

    def test_ok_results_without_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([result.Ok('ok'), result.Ok('ok')])
            | job_result_transforms.ResultsToJobRunResults()
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('SUCCESS: 2')],
        )

    def test_ok_results_with_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([result.Ok('ok'), result.Ok('ok')])
            | job_result_transforms.ResultsToJobRunResults('PREFIX')
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('PREFIX SUCCESS: 2')],
        )

    def test_err_results_without_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(
                [result.Err('err 1'), result.Err('err 2'), result.Err('err 2')]
            )
            | job_result_transforms.ResultsToJobRunResults()
        )

        self.assert_pcoll_equal(
            transform_result,
            [
                job_run_result.JobRunResult.as_stderr('ERROR: "err 1": 1'),
                job_run_result.JobRunResult.as_stderr('ERROR: "err 2": 2'),
            ],
        )

    def test_err_results_with_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(
                [result.Err('err 1'), result.Err('err 2'), result.Err('err 2')]
            )
            | job_result_transforms.ResultsToJobRunResults('PRE')
        )

        self.assert_pcoll_equal(
            transform_result,
            [
                job_run_result.JobRunResult.as_stderr('PRE ERROR: "err 1": 1'),
                job_run_result.JobRunResult.as_stderr('PRE ERROR: "err 2": 2'),
            ],
        )


class CountObjectsToJobRunResultTests(job_test_utils.PipelinedTestBase):

    def test_three_objects_without_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(['item', 'item', 'item'])
            | job_result_transforms.CountObjectsToJobRunResult()
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('SUCCESS: 3')],
        )

    def test_three_objects_with_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(['item', 'item', 'item'])
            | job_result_transforms.CountObjectsToJobRunResult('PREFIX')
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('PREFIX SUCCESS: 3')],
        )

    def test_zero_objects_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([])
            | job_result_transforms.CountObjectsToJobRunResult()
        )

        self.assert_pcoll_empty(transform_result)
