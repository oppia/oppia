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

"""Services for managing user authentication."""

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


class BeamJobRunServicesTests(test_utils.AppEngineTestBase):

    # Sample string date taken from the official documentation in the ISO
    # standard RFC-3339 datetime format:
    # https://cloud.google.com/dataflow/docs/guides/using-command-line-intf#jobs_commands
    NANO_RESOLUTION_RFC_3339_STR = '2015-02-09T19:56:39.510000000Z'

    def setUp(self):
        super(BeamJobRunServicesTests, self).setUp()
        self._id_iter = (python_utils.UNICODE(i) for i in itertools.count())

    def swap_check_output_with_gcloud_response(
            self,
            # These values are taken from the official gcloud documentation:
            # https://cloud.google.com/dataflow/docs/guides/using-command-line-intf#jobs_commands
            current_state='JOB_STATE_RUNNING',
            current_state_time=NANO_RESOLUTION_RFC_3339_STR):
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
            context manager. A context manager in which
            subprocess.check_output() always returns a sample gcloud response.
        """
        value = json.dumps({
            'currentState': current_state,
            'currentStateTime': current_state_time,
        })
        return (
            self.swap_to_always_return(subprocess, 'check_output', value=value))

    def create_beam_job_run_model(
            self, job_id=None, job_name='FooJob', job_arguments=None,
            job_state='RUNNING'):
        """Returns a new BeamJobRunModel with simple default values.

        Args:
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
        if job_arguments is None:
            job_arguments = []
        if job_id is None:
            job_id = python_utils.NEXT(self._id_iter)
        return beam_job_models.BeamJobRunModel(
            id=job_id, job_name=job_name, job_arguments=job_arguments,
            latest_job_state=job_state)

    def assert_domain_equals_model(self, beam_job_run, beam_job_run_model):
        """Asserts that the domain object has the same values as the model.

        Args:
            beam_job_run: BeamJobRun. The domain object.
            beam_job_run_model: BeamJobRunModel. The model.

        Raises:
            AssertionError. The domain object and model have at least one
                difference.
        """
        self.assertEqual(beam_job_run.job_id, beam_job_run_model.id)
        self.assertEqual(beam_job_run.job_name, beam_job_run_model.job_name)
        self.assertEqual(
            beam_job_run.job_state, beam_job_run_model.latest_job_state)
        self.assertEqual(
            beam_job_run.job_arguments, beam_job_run_model.job_arguments)
        self.assertEqual(
            beam_job_run.job_started_on, beam_job_run_model.created_on)
        self.assertEqual(
            beam_job_run.job_updated_on, beam_job_run_model.last_updated)

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
            self.assert_domain_equals_model(domain_obj, model_obj)

    def test_get_beam_job_runs(self):
        beam_job_run_models = [
            self.create_beam_job_run_model(job_state='DONE'),
            self.create_beam_job_run_model(job_state='RUNNING'),
            self.create_beam_job_run_model(job_state='FAILED'),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(beam_job_run_models)

        self.assert_domains_equal_models(
            beam_job_services.get_beam_job_runs(), beam_job_run_models)

    def test_get_beam_job_runs_with_force_update(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(job_state='DONE'),
            self.create_beam_job_run_model(job_state='RUNNING'),
            self.create_beam_job_run_model(job_state='FAILED'),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        gcloud_output_mock = self.swap_check_output_with_gcloud_response(
            current_state='JOB_STATE_DONE',
            current_state_time=self.NANO_RESOLUTION_RFC_3339_STR)

        with gcloud_output_mock:
            beam_job_runs = beam_job_services.get_beam_job_runs(
                force_update=True)

        # Only the second model (job_state='RUNNING') should have been updated.
        updated_beam_job_run_models = initial_beam_job_run_models[:]
        updated_beam_job_run_models[1].latest_job_state = 'DONE'
        updated_beam_job_run_models[1].last_updated = (
            datetime.datetime(2015, 2, 9, 19, 56, 39, 510000))

        self.assert_domains_equal_models(
            beam_job_runs, updated_beam_job_run_models)

    def test_get_beam_job_runs_with_force_update_when_command_fails(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(job_state='DONE'),
            self.create_beam_job_run_model(job_state='RUNNING'),
            self.create_beam_job_run_model(job_state='FAILED'),
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
                lambda: beam_job_services.get_beam_job_runs(force_update=True))

        self.assertEqual(
            initial_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))
        self.assertIn('Failed to update the state of job', logs[-1])

    def test_update_beam_job_run_model_states(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(job_state='DONE'),
            self.create_beam_job_run_model(job_state='RUNNING'),
            self.create_beam_job_run_model(job_state='FAILED'),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            initial_beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(initial_beam_job_run_models)

        gcloud_output_mock = self.swap_check_output_with_gcloud_response(
            current_state='JOB_STATE_DONE',
            current_state_time=self.NANO_RESOLUTION_RFC_3339_STR)

        with gcloud_output_mock:
            beam_job_services.update_beam_job_run_model_states()

        # Only the second model (job_state='RUNNING') should have been updated.
        updated_beam_job_run_models = initial_beam_job_run_models[:]
        updated_beam_job_run_models[1].latest_job_state = 'DONE'
        updated_beam_job_run_models[1].last_updated = (
            datetime.datetime(2015, 2, 9, 19, 56, 39, 510000))

        self.assertEqual(
            updated_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))

    def test_update_beam_job_run_model_states_when_command_fails(self):
        initial_beam_job_run_models = [
            self.create_beam_job_run_model(job_state='DONE'),
            self.create_beam_job_run_model(job_state='RUNNING'),
            self.create_beam_job_run_model(job_state='FAILED'),
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
                beam_job_services.update_beam_job_run_model_states)

        self.assertEqual(
            initial_beam_job_run_models,
            beam_job_models.BeamJobRunModel.get_multi(
                [m.id for m in initial_beam_job_run_models]))
        self.assertIn('Failed to update the state of job', logs[-1])


class GetBeamJobRunResultTests(test_utils.AppEngineTestBase):

    def test_get_beam_run_result(self):
        beam_job_models.BeamJobRunResultModel(
            id='123', stdout='abc', stderr='def').put()

        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertEqual(beam_job_run_result.stdout, 'abc')
        self.assertEqual(beam_job_run_result.stderr, 'def')

    def test_get_beam_run_result_for_missing_job_result(self):
        self.assertIsNone(beam_job_services.get_beam_job_run_result('123'))
