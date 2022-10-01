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

"""Unit tests for jobs.io.job_io."""

from __future__ import annotations

from core.domain import beam_job_services
from core.jobs import job_test_utils
from core.jobs.io import job_io
from core.jobs.types import job_run_result

import apache_beam as beam


class PutResultsTests(job_test_utils.PipelinedTestBase):

    JOB_ID = '123'

    def test_single_output(self) -> None:
        messages = [
            job_run_result.JobRunResult(
                stdout='Hello, World!', stderr='Uh-oh, World!'),
        ]

        self.assert_pcoll_empty(
            self.pipeline
            | beam.Create(messages)
            | job_io.PutResults(self.JOB_ID)
        )

        result = beam_job_services.get_beam_job_run_result(self.JOB_ID)
        self.assertEqual(result.stdout, 'Hello, World!')
        self.assertEqual(result.stderr, 'Uh-oh, World!')

    def test_sharded_output(self) -> None:
        messages = [
            job_run_result.JobRunResult(stdout='abc', stderr='123'),
            job_run_result.JobRunResult(stdout='def', stderr='456'),
            job_run_result.JobRunResult(stdout='ghi', stderr='789'),
        ]

        with self.swap(job_run_result, 'MAX_OUTPUT_CHARACTERS', 8):
            self.assert_pcoll_empty(
                self.pipeline
                | beam.Create(messages)
                | job_io.PutResults(self.JOB_ID)
            )

        result = beam_job_services.get_beam_job_run_result(self.JOB_ID)
        self.assertItemsEqual(result.stdout.split('\n'), ['abc', 'def', 'ghi'])
        self.assertItemsEqual(result.stderr.split('\n'), ['123', '456', '789'])
