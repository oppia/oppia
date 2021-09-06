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

from unittest import mock

from core.domain import beam_job_services
from core.platform import models
from core.tests import test_utils
from jobs import base_jobs
from jobs import job_options
from jobs import jobs_manager
from jobs.types import job_run_result

import apache_beam as beam
from apache_beam import runners

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])


class WorkingJob(base_jobs.JobBase):
    """Simple job that outputs string literals."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | beam.Create([job_run_result.JobRunResult(stdout='o', stderr='e')])
        )


class FailingJob(base_jobs.JobBase):
    """Simple job that always raises an exception."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        raise Exception('uh-oh')


class RunJobTests(test_utils.GenericTestBase):

    def test_working_sync_job(self) -> None:
        run = jobs_manager.run_job(WorkingJob, True, namespace=self.namespace)

        self.assertEqual(run.latest_job_state, 'DONE')

        run_model = beam_job_models.BeamJobRunModel.get(run.id) # type: ignore[attr-defined]
        self.assertEqual(run, run_model)

        self.assertEqual(
            beam_job_services.get_beam_job_run_result(run.id).to_dict(),
            {'stdout': 'o', 'stderr': 'e'})

    def test_failing_sync_job(self) -> None:
        run = jobs_manager.run_job(FailingJob, True, namespace=self.namespace)

        self.assertEqual(run.latest_job_state, 'FAILED')

        run_model = beam_job_models.BeamJobRunModel.get(run.id) # type: ignore[attr-defined]
        self.assertEqual(run, run_model)

        self.assertIn(
            'uh-oh',
            beam_job_services.get_beam_job_run_result(run.id).stderr)

    def test_async_job(self) -> None:
        mock_run_result = mock.Mock()
        mock_run_result.job_id.return_value = '123'
        mock_run_result.state = 'PENDING'

        pipeline = beam.Pipeline(
            runner=runners.DirectRunner(),
            options=job_options.JobOptions(namespace=self.namespace))

        with self.swap_to_always_return(pipeline, 'run', value=mock_run_result):
            run = jobs_manager.run_job(WorkingJob, False, pipeline=pipeline)

        self.assertEqual(run.dataflow_job_id, '123')
        self.assertEqual(run.latest_job_state, 'PENDING')
