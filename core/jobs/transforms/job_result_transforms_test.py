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


class ResultsToJobRunResultsTests(job_test_utils.PipelinedTestBase):

    def test_ok_results_without_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([result.Ok('ok'), result.Ok('ok')])
            | job_result_transforms.ResultsToJobRunResults()
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('SUCCESS: 2')]
        )

    def test_ok_results_with_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([result.Ok('ok'), result.Ok('ok')])
            | job_result_transforms.ResultsToJobRunResults('PREFIX')
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('PREFIX SUCCESS: 2')]
        )

    def test_err_results_without_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([
                    result.Err('err 1'),
                    result.Err('err 2'),
                    result.Err('err 2')
                ])
            | job_result_transforms.ResultsToJobRunResults()
        )

        self.assert_pcoll_equal(
            transform_result,
            [
                job_run_result.JobRunResult.as_stderr('ERROR: "err 1": 1'),
                job_run_result.JobRunResult.as_stderr('ERROR: "err 2": 2')
            ]
        )

    def test_err_results_with_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([
                    result.Err('err 1'),
                    result.Err('err 2'),
                    result.Err('err 2')
                ])
            | job_result_transforms.ResultsToJobRunResults('PRE')
        )

        self.assert_pcoll_equal(
            transform_result,
            [
                job_run_result.JobRunResult.as_stderr('PRE ERROR: "err 1": 1'),
                job_run_result.JobRunResult.as_stderr('PRE ERROR: "err 2": 2')
            ]
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
            [job_run_result.JobRunResult.as_stdout('SUCCESS: 3')]
        )

    def test_three_objects_with_prefix_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(['item', 'item', 'item'])
            | job_result_transforms.CountObjectsToJobRunResult('PREFIX')
        )

        self.assert_pcoll_equal(
            transform_result,
            [job_run_result.JobRunResult.as_stdout('PREFIX SUCCESS: 3')]
        )

    def test_zero_objects_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([])
            | job_result_transforms.CountObjectsToJobRunResult()
        )

        self.assert_pcoll_empty(transform_result)
