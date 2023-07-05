# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.jobs.transforms.results_transforms."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.transforms import results_transforms

import apache_beam as beam
import result


class DrainResultsOnErrorTests(job_test_utils.PipelinedTestBase):

    def test_error_results_returns_empty_collection(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(
                [result.Ok(('id_1', None)),
                result.Ok(('id_2', None)),
                result.Err(('id_3', None))]
            )
            | results_transforms.DrainResultsOnError()
        )

        self.assert_pcoll_empty(transform_result)

    def test_ok_results_returns_unchanged_collection(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create(
                [result.Ok(('id_1', None)),
                result.Ok(('id_2', None)),
                result.Ok(('id_3', None))]
            )
            | results_transforms.DrainResultsOnError()
        )

        self.assert_pcoll_equal(
            transform_result,
            [result.Ok(('id_1', None)),
            result.Ok(('id_2', None)),
            result.Ok(('id_3', None))]
        )

    def test_zero_objects_correctly_outputs(self) -> None:
        transform_result = (
            self.pipeline
            | beam.Create([])
            | results_transforms.DrainResultsOnError()
        )

        self.assert_pcoll_empty(transform_result)
