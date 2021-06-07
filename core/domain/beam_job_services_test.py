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

"""Unit tests for core.domain.beam_job_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import itertools
import json
import subprocess

from core.domain import beam_job_services
from core.platform import models
from core.tests import test_utils
from jobs import registry as jobs_registry
import python_utils

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])


class BeamJobServicesTests(test_utils.TestBase):

    def test_gets_jobs_from_registry(self):
        beam_jobs = beam_job_services.get_beam_jobs()
        self.assertItemsEqual(
            [j.name for j in beam_jobs], jobs_registry.get_all_job_names())


class BeamJobRunServicesTests(test_utils.GenericTestBase):

    # Sample timestamp taken from the official documentation:
    # https://cloud.google.com/dataflow/docs/guides/using-command-line-intf#jobs_commands
    NANO_RESOLUTION_ISO_8601_STR = '2014-10-02T15:01:23.045123456Z'

    def setUp(self):
        super(BeamJobRunServicesTests, self).setUp()
        self._id_iter = (python_utils.UNICODE(i) for i in itertools.count())

    def swap_check_output_with_gcloud_response(
            self,
            current_state='JOB_STATE_RUNNING',
            current_state_time=NANO_RESOLUTION_ISO_8601_STR):
        """Returns a context manager in which subprocess.check_output is swapped
        with an implementation that always returns output similar to a real call
        to: `gcloud --format=json dataflow jobs describe`.

        Args:
            current_state: str. The current state of the job. Jobs are created
                in the JOB_STATE_STOPPED state unless otherwise specified. A job
                in the JOB_STATE_RUNNING state may asynchronously enter a
                terminal state. After a job has reached a terminal state, no
                further state updates may be made. This field may be mutated by
                the Cloud Dataflow service; callers cannot mutate it.
            current_state_time: str. The timestamp associated with the current
                state. A timestamp in RFC3339 UTC "Zulu" format, with nanosecond
                resolution and up to nine fractional digits. Examples:
                "2014-10-02T15:01:23Z" and "2014-10-02T15:01:23.045123456Z".

        Returns:
            Context manager. A context manager in which
            subprocess.check_output() always returns a mock gcloud response.
        """
        value = json.dumps({
            'currentState': current_state,
            'currentStateTime': current_state_time,
        })
        return (
            self.swap_to_always_return(subprocess, 'check_output', value=value))

    def create_beam_job_run_model(
            self, dataflow_job_id='abc',
            job_id=None, job_name='FooJob', job_arguments=None,
            job_state=beam_job_models.BeamJobState.RUNNING.value):
        """Returns a new BeamJobRunModel with convenient default values.

        Args:
            dataflow_job_id: str|None. The ID of the dataflow job corresponding
                to the BeamJobRun. When this value is None, that signals that
                the job has been run synchronously (like a function call), and
                cannot be polled for updates.
            job_id: str|None. The ID of the job. If None, a value is generated.
            job_name: str. The name of the job class that implements the
                job's logic.
            job_state: str. The state of the job at the time the model was last
                updated.
            job_arguments: list(str)|None. The arguments provided to the job
                run. If None, an empty list will be used instead.

        Returns:
            BeamJobRunModel. The new model.
        """
        if job_id is None:
            job_id = python_utils.NEXT(self._id_iter)
        if job_arguments is None:
            job_arguments = []
        return beam_job_models.BeamJobRunModel(
            id=job_id, dataflow_job_id=dataflow_job_id, job_name=job_name,
            job_arguments=job_arguments, latest_job_state=job_state)

    def assert_domains_equal_models(self, beam_job_runs, beam_job_run_models):
        """Asserts that the domain objects have the same values as the models.

        Args:
            beam_job_runs: list(BeamJobRun). The domain objects.
            beam_job_run_models: list(BeamJobRunModel). The models.

        Raises:
            AssertionError. At least one domain object and model pair has at
                least one difference.
        """
        domain_objs = sorted(beam_job_runs, key=lambda j: j.job_id)
        model_objs = sorted(beam_job_run_models, key=lambda m: m.id)
        for domain_obj, model_obj in python_utils.ZIP(domain_objs, model_objs):
            self.assertEqual(domain_obj.job_id, model_obj.id)
            self.assertEqual(domain_obj.job_name, model_obj.job_name)
            self.assertEqual(domain_obj.job_state, model_obj.latest_job_state)
            self.assertEqual(domain_obj.job_arguments, model_obj.job_arguments)
            self.assertEqual(domain_obj.job_started_on, model_obj.created_on)
            self.assertEqual(domain_obj.job_updated_on, model_obj.last_updated)
            self.assertEqual(
                domain_obj.job_is_synchronous,
                model_obj.dataflow_job_id is None)

    def test_get_beam_job_runs(self):
        beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(beam_job_run_models)

        self.assert_domains_equal_models(
            beam_job_services.get_beam_job_runs(), beam_job_run_models)

    def test_get_beam_job_runs_with_refresh(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        gcloud_output_mock = self.swap_check_output_with_gcloud_response(
            current_state='JOB_STATE_DONE',
            current_state_time=self.NANO_RESOLUTION_ISO_8601_STR)

        with gcloud_output_mock:
            beam_job_runs = beam_job_services.get_beam_job_runs(refresh=True)

        # Only the second model (job_state=RUNNING) should have been updated,
        # the other two (DONE and CANCELLED) are in terminal states and don't
        # need to be checked.
        updated_beam_job_run_models = initial_beam_job_run_models[:]
        updated_beam_job_run_models[1].latest_job_state = (
            beam_job_models.BeamJobState.DONE.value)
        updated_beam_job_run_models[1].last_updated = (
            datetime.datetime(2014, 10, 2, 15, 1, 23, 45123))

        self.assert_domains_equal_models(
            beam_job_runs, updated_beam_job_run_models)

    def test_get_beam_job_runs_with_refresh_of_synchronous_job(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                # Synchronous jobs do not create Dataflow Jobs, so the value of
                # the dataflow_job_id is None.
                dataflow_job_id=None,
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]
        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        utcnow = datetime.datetime.utcnow()
        with self.mock_datetime_utcnow(utcnow):
            beam_job_runs = beam_job_services.get_beam_job_runs(refresh=True)

        # Only the second model (job_state=RUNNING) should have been updated,
        # the other two (DONE and CANCELLED) are in terminal states and don't
        # need to be checked.
        updated_beam_job_run_models = initial_beam_job_run_models[:]
        updated_beam_job_run_models[1].latest_job_state = (
            beam_job_models.BeamJobState.UNKNOWN.value)
        updated_beam_job_run_models[1].last_updated = utcnow
        self.assert_domains_equal_models(
            beam_job_runs, updated_beam_job_run_models)

    def test_get_beam_job_runs_with_refresh_when_command_fails(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        gcloud_failure_mock = self.swap_to_always_raise(
            subprocess, 'check_output',
            error=subprocess.CalledProcessError(1, 'gcloud', 'Uh-oh!'))

        with gcloud_failure_mock, self.capture_logging() as logs:
            self.assertRaisesRegexp(
                subprocess.CalledProcessError, 'returned non-zero exit status',
                lambda: beam_job_services.get_beam_job_runs(refresh=True))

        self.assertEqual(
            initial_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))
        self.assertIn('Failed to update the state of job', logs[-1])

    def test_refresh_state_of_all_beam_job_run_models(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]
        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        gcloud_output_mock = self.swap_check_output_with_gcloud_response(
            current_state='JOB_STATE_DONE',
            current_state_time=self.NANO_RESOLUTION_ISO_8601_STR)

        with gcloud_output_mock:
            beam_job_services.refresh_state_of_all_beam_job_run_models()

        # Only the second model (job_state=RUNNING) should have been updated,
        # the other two (DONE and CANCELLED) are in terminal states and don't
        # need to be checked.
        updated_beam_job_run_models = initial_beam_job_run_models[:]
        updated_beam_job_run_models[1].latest_job_state = (
            beam_job_models.BeamJobState.DONE.value)
        updated_beam_job_run_models[1].last_updated = (
            datetime.datetime(2014, 10, 2, 15, 1, 23, 45123))

        self.assertEqual(
            updated_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))

    def test_refresh_state_of_all_beam_job_run_models_of_synchronous_job(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                # Synchronous jobs do not create Dataflow Jobs, so the value of
                # the dataflow_job_id is None.
                dataflow_job_id=None,
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]
        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        utcnow = datetime.datetime.utcnow()
        with self.mock_datetime_utcnow(utcnow):
            beam_job_services.refresh_state_of_all_beam_job_run_models()

        # Only the second model (job_state=RUNNING) should have been updated,
        # the other two (DONE and CANCELLED) are in terminal states and don't
        # need to be checked.
        updated_beam_job_run_models = initial_beam_job_run_models[:]
        updated_beam_job_run_models[1].latest_job_state = (
            beam_job_models.BeamJobState.UNKNOWN.value)
        updated_beam_job_run_models[1].last_updated = utcnow
        self.assertEqual(
            updated_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))

    def test_refresh_state_of_all_beam_job_run_models_when_command_fails(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        gcloud_failure_mock = self.swap_to_always_raise(
            subprocess, 'check_output',
            error=subprocess.CalledProcessError(1, 'gcloud', 'Uh-oh!'))

        with gcloud_failure_mock, self.capture_logging() as logs:
            self.assertRaisesRegexp(
                subprocess.CalledProcessError, 'returned non-zero exit status',
                beam_job_services.refresh_state_of_all_beam_job_run_models)

        self.assertEqual(
            initial_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))
        self.assertIn('Failed to update the state of job', logs[-1])


class GetBeamJobRunResultTests(test_utils.GenericTestBase):

    def test_get_beam_run_result(self):
        beam_job_models.BeamJobRunResultModel(
            job_id='123', stdout='abc', stderr='def').put()

        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertEqual(beam_job_run_result.stdout, 'abc')
        self.assertEqual(beam_job_run_result.stderr, 'def')

    def test_get_beam_run_result_with_no_results(self):
        self.assertIsNone(beam_job_services.get_beam_job_run_result('123'))

    def test_get_beam_run_result_with_result_batches(self):
        beam_job_models.BeamJobRunResultModel(job_id='123', stdout='abc').put()
        beam_job_models.BeamJobRunResultModel(job_id='123', stderr='123').put()
        beam_job_models.BeamJobRunResultModel(
            job_id='123', stdout='def', stderr='456').put()

        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertItemsEqual(
            beam_job_run_result.stdout.split('\n'), ['abc', 'def'])
        self.assertItemsEqual(
            beam_job_run_result.stderr.split('\n'), ['123', '456'])
