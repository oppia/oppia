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

"""Unit tests for jobs.jobs_manager."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.domain import beam_job_services
from core.platform import models
from core.tests import test_utils
from jobs import base_jobs
from jobs import jobs_manager
from jobs.types import job_run_result

import apache_beam as beam

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])


class WorkingJob(base_jobs.JobBase):
    """Simple job that outputs string literals."""

    def run(self):
        # type: () -> beam.PCollection[job_run_result.JobRunResult]
        return (
            self.pipeline
            | beam.Create([job_run_result.JobRunResult(stdout='o', stderr='e')])
        )


class FailingJob(base_jobs.JobBase):
    """Simple job that always raises an exception."""

    def run(self):
        # type: () -> beam.PCollection[job_run_result.JobRunResult]
        raise Exception('uh-oh')


class RunJobSyncTests(test_utils.GenericTestBase):

    def test_working_job(self):
        # type: () -> None
        run = jobs_manager.run_job_sync(
            'WorkingJob', [], namespace=self.namespace)

        self.assertEqual(run.job_state, 'DONE')

        run_model = beam_job_models.BeamJobRunModel.get(run.job_id) # type: ignore[attr-defined]
        self.assertEqual(
            run.to_dict(),
            beam_job_services.get_beam_job_run_from_model(run_model).to_dict())

        self.assertEqual(
            beam_job_services.get_beam_job_run_result(run.job_id).to_dict(),
            {'stdout': 'o', 'stderr': 'e'})

    def test_failing_job(self):
        # type: () -> None
        run = jobs_manager.run_job_sync(
            'FailingJob', [], namespace=self.namespace)

        self.assertEqual(run.job_state, 'FAILED')

        run_model = beam_job_models.BeamJobRunModel.get(run.job_id) # type: ignore[attr-defined]
        self.assertEqual(
            run.to_dict(),
            beam_job_services.get_beam_job_run_from_model(run_model).to_dict())

        self.assertIn(
            'uh-oh',
            beam_job_services.get_beam_job_run_result(run.job_id).stderr)
