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

from __future__ import annotations

import contextlib
import datetime
from unittest import mock

from core import feconf
from core.domain import beam_job_services
from core.jobs import base_jobs
from core.jobs import job_options
from core.jobs import jobs_manager
from core.jobs.types import job_run_result
from core.storage.beam_job import gae_models as beam_job_models
from core.tests import test_utils

import apache_beam as beam
from apache_beam import runners
from google.cloud import dataflow


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

        run_model = beam_job_models.BeamJobRunModel.get(run.id)
        self.assertEqual(run, run_model)

        self.assertEqual(
            beam_job_services.get_beam_job_run_result(run.id).to_dict(),
            {'stdout': 'o', 'stderr': 'e'})

    def test_failing_sync_job(self) -> None:
        run = jobs_manager.run_job(FailingJob, True, namespace=self.namespace)

        self.assertEqual(run.latest_job_state, 'FAILED')

        run_model = beam_job_models.BeamJobRunModel.get(run.id)
        self.assertEqual(run, run_model)

        self.assertIn(
            'uh-oh',
            beam_job_services.get_beam_job_run_result(run.id).stderr)

    def test_async_job(self) -> None:
        mock_run_result = mock.Mock()
        mock_run_result.has_job = True
        mock_run_result.job_id.return_value = '123'
        mock_run_result.state = 'PENDING'

        pipeline = beam.Pipeline(
            runner=runners.DirectRunner(),
            options=job_options.JobOptions(namespace=self.namespace))

        with self.swap_to_always_return(pipeline, 'run', value=mock_run_result):
            run = jobs_manager.run_job(WorkingJob, False, pipeline=pipeline)

        self.assertEqual(run.dataflow_job_id, '123')
        self.assertEqual(run.latest_job_state, 'PENDING')

    def test_async_job_that_does_not_start(self) -> None:
        mock_run_result = mock.Mock()
        mock_run_result.has_job = False
        mock_run_result.job_id.return_value = None
        mock_run_result.state = 'UNKNOWN'

        pipeline = beam.Pipeline(
            runner=runners.DirectRunner(),
            options=job_options.JobOptions(namespace=self.namespace))

        with self.swap_to_always_return(pipeline, 'run', value=mock_run_result):
            run = jobs_manager.run_job(WorkingJob, False, pipeline=pipeline)

        self.assertIsNone(run.dataflow_job_id)
        self.assertEqual(run.latest_job_state, 'FAILED')
        result = beam_job_services.get_beam_job_run_result(run.id)
        self.assertIn('Failed to deploy WorkingJob', result.stderr)


class RefreshStateOfBeamJobRunModelTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.run_model = beam_job_services.create_beam_job_run_model(
            'WorkingJob', dataflow_job_id='123')

        self.dataflow_job = dataflow.Job(
            id='123',
            project_id=feconf.OPPIA_PROJECT_ID,
            location=feconf.GOOGLE_APP_ENGINE_REGION,
            current_state=dataflow.JobState.JOB_STATE_PENDING,
            current_state_time=datetime.datetime.utcnow())

        self.dataflow_client_mock = mock.Mock()
        self.dataflow_client_mock.get_job.return_value = self.dataflow_job

        self.exit_stack = contextlib.ExitStack()
        self.exit_stack.enter_context(self.swap_to_always_return(
            dataflow, 'JobsV1Beta3Client', value=self.dataflow_client_mock))

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def test_sync_job(self) -> None:
        self.run_model.dataflow_job_id = None

        jobs_manager.refresh_state_of_beam_job_run_model(self.run_model)

        self.assertEqual(self.run_model.latest_job_state, 'UNKNOWN')

    def test_job_with_outdated_status(self) -> None:
        self.run_model.latest_job_state = 'PENDING'
        self.dataflow_job.current_state = dataflow.JobState.JOB_STATE_RUNNING

        jobs_manager.refresh_state_of_beam_job_run_model(self.run_model)

        self.assertEqual(self.run_model.latest_job_state, 'RUNNING')

    def test_job_with_failed_status(self) -> None:
        self.run_model.latest_job_state = 'RUNNING'
        self.dataflow_job.current_state = dataflow.JobState.JOB_STATE_FAILED

        jobs_manager.refresh_state_of_beam_job_run_model(self.run_model)

        self.assertEqual(self.run_model.latest_job_state, 'FAILED')
        result = beam_job_services.get_beam_job_run_result(self.run_model.id)
        self.assertIn(self.dataflow_job.id, result.stderr)

    def test_job_with_cancelling_status_but_job_is_cancelled(self) -> None:
        self.run_model.latest_job_state = 'CANCELLING'
        self.dataflow_job.current_state = dataflow.JobState.JOB_STATE_CANCELLED

        jobs_manager.refresh_state_of_beam_job_run_model(self.run_model)

        self.assertEqual(self.run_model.latest_job_state, 'CANCELLED')

    def test_job_with_cancelling_status_but_job_is_running(self) -> None:
        self.run_model.latest_job_state = 'CANCELLING'
        self.dataflow_job.current_state = dataflow.JobState.JOB_STATE_RUNNING

        jobs_manager.refresh_state_of_beam_job_run_model(self.run_model)

        self.assertEqual(self.run_model.latest_job_state, 'CANCELLING')

    def test_failed_api_call_logs_the_exception(self) -> None:
        self.run_model.latest_job_state = 'PENDING'
        self.dataflow_client_mock.get_job.side_effect = Exception('uh-oh')

        with self.capture_logging() as logs:
            jobs_manager.refresh_state_of_beam_job_run_model(self.run_model)

        self.assertGreater(len(logs), 0)
        self.assertIn('uh-oh', logs[0])
        self.assertEqual(self.run_model.latest_job_state, 'UNKNOWN')


class CancelJobTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.run_model = beam_job_services.create_beam_job_run_model(
            'WorkingJob', dataflow_job_id='123')

        self.dataflow_job = dataflow.Job(
            id='123',
            project_id=feconf.OPPIA_PROJECT_ID,
            location=feconf.GOOGLE_APP_ENGINE_REGION,
            current_state=dataflow.JobState.JOB_STATE_CANCELLING,
            current_state_time=datetime.datetime.utcnow())

        self.dataflow_client_mock = mock.Mock()
        self.dataflow_client_mock.update_job.return_value = self.dataflow_job

        self.exit_stack = contextlib.ExitStack()
        self.exit_stack.enter_context(self.swap_to_always_return(
            dataflow, 'JobsV1Beta3Client', value=self.dataflow_client_mock))

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def test_sync_job(self) -> None:
        self.run_model.dataflow_job_id = None

        with self.assertRaisesRegex(ValueError, 'must not be None'):
            jobs_manager.cancel_job(self.run_model)

    def test_job_with_cancelling_status(self) -> None:
        self.run_model.latest_job_state = 'RUNNING'

        jobs_manager.cancel_job(self.run_model)

        self.assertEqual(self.run_model.latest_job_state, 'CANCELLING')

    def test_failed_api_call_logs_the_exception(self) -> None:
        self.dataflow_client_mock.update_job.side_effect = Exception('uh-oh')

        with self.capture_logging() as logs:
            jobs_manager.cancel_job(self.run_model)

        self.assertGreater(len(logs), 0)
        self.assertIn('uh-oh', logs[0])
