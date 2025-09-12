# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for dummy jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import dummy_jobs
from core.jobs.types import job_run_result

from typing import Type


class DummyPassJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[dummy_jobs.DummyPassJob] = dummy_jobs.DummyPassJob

    def test_dummy_pass_job_outputs_success(self) -> None:
        """Test that DummyPassJob outputs a success result."""
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                'SUCCESS: Dummy job completed successfully')
        ])


class DummyFailJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[dummy_jobs.DummyFailJob] = dummy_jobs.DummyFailJob

    def test_dummy_fail_job_outputs_failure(self) -> None:
        """Test that DummyFailJob outputs a failure result."""
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                'ERROR: Dummy job failed as expected')
        ])
