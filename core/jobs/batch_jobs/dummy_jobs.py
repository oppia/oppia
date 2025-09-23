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

"""Dummy jobs for testing purposes."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.types import job_run_result

import apache_beam as beam


class DummyPassJob(base_jobs.JobBase):
    """Dummy job that performs no action and results in a pass status."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection with a single success result.

        Returns:
            PCollection. A PCollection containing a single JobRunResult with
            stdout indicating success.
        """
        return (
            self.pipeline
            | 'Create success result' >> beam.Create([
                job_run_result.JobRunResult.as_stdout(
                    'SUCCESS: Dummy job completed successfully'
                )
            ])
        )


class DummyFailJob(base_jobs.JobBase):
    """Dummy job that does nothing and outputs a fail status."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection with a single failure result.

        Returns:
            PCollection. A PCollection containing a single JobRunResult with
            stderr indicating failure.
        """
        return (
            self.pipeline
            | 'Create failure result' >> beam.Create([
                job_run_result.JobRunResult.as_stderr(
                    'ERROR: Dummy job failed as expected'
                )
            ])
        )
