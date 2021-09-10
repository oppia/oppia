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

from __future__ import absolute_import
from __future__ import unicode_literals

import itertools

from core.domain import beam_job_services
from core.storage.beam_job import gae_models as beam_job_models
from core.tests import test_utils
from jobs import jobs_manager
from jobs import registry as jobs_registry
import python_utils


class BeamJobServicesTests(test_utils.TestBase):

    def test_gets_jobs_from_registry(self):
        beam_jobs = beam_job_services.get_beam_jobs()
        self.assertItemsEqual(
            [j.name for j in beam_jobs], jobs_registry.get_all_job_names())


class BeamJobRunServicesTests(test_utils.GenericTestBase):

    def setUp(self):
        super(BeamJobRunServicesTests, self).setUp()
        self._id_iter = (python_utils.UNICODE(i) for i in itertools.count())

    def create_beam_job_run_model(
            self, dataflow_job_id='abc',
            job_id=None, job_name='FooJob',
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

        Returns:
            BeamJobRunModel. The new model.
        """
        if job_id is None:
            job_id = python_utils.NEXT(self._id_iter)
        return beam_job_models.BeamJobRunModel(
            id=job_id, dataflow_job_id=dataflow_job_id, job_name=job_name,
            latest_job_state=job_state)

    def assert_domains_equal_models(self, beam_job_runs, beam_job_run_models):
        """Asserts that the domain objects have the same values as the models.

        Args:
            beam_job_runs: list(BeamJobRun). The domain objects.
            beam_job_run_models: list(BeamJobRunModel). The models.

        Raises:
            AssertionError. At least one domain object and model pair has at
                least one difference.
        """
        self.assertEqual(len(beam_job_runs), len(beam_job_run_models))
        runs = sorted(beam_job_runs, key=lambda j: j.job_id)
        models = sorted(beam_job_run_models, key=lambda m: m.id)
        for i, (r, m) in enumerate(python_utils.ZIP(runs, models)):
            with self.subTest('i=%d' % i):
                self.assertEqual(r.job_id, m.id)
                self.assertEqual(r.job_name, m.job_name)
                self.assertEqual(r.job_state, m.latest_job_state)
                self.assertEqual(r.job_started_on, m.created_on)
                self.assertEqual(r.job_updated_on, m.last_updated)
                self.assertEqual(
                    r.job_is_synchronous, m.dataflow_job_id is None)

    def test_run_beam_job(self):
        run_model = beam_job_services.create_beam_job_run_model('WorkingJob')
        get_job_class_by_name_swap = self.swap_to_always_return(
            jobs_registry, 'get_job_class_by_name')
        run_job_swap = self.swap_to_always_return(
            jobs_manager, 'run_job', value=run_model)

        with get_job_class_by_name_swap, run_job_swap:
            run = beam_job_services.run_beam_job('WorkingJob')

        self.assertEqual(
            beam_job_services.get_beam_job_run_from_model(run_model).to_dict(),
            run.to_dict())

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
            beam_job_services.get_beam_job_runs(refresh=False),
            beam_job_run_models)

    def test_get_beam_job_runs_with_refresh(self):
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

        with self.swap_to_always_return(
            jobs_manager, 'refresh_state_of_beam_job_run_model'):
            self.assert_domains_equal_models(
                beam_job_services.get_beam_job_runs(refresh=True),
                beam_job_run_models)

    def test_create_beam_job_run_model(self):
        model = beam_job_services.create_beam_job_run_model(
            'FooJob', dataflow_job_id='123')
        model.put()

        all_runs = beam_job_services.get_beam_job_runs(refresh=False)
        self.assertEqual(len(all_runs), 1)
        run = all_runs[0]
        self.assertEqual(run.job_name, 'FooJob')
        self.assertFalse(run.job_is_synchronous)

    def test_create_beam_job_run_result_model(self):
        model = beam_job_services.create_beam_job_run_result_model(
            '123', 'abc', '123')
        model.put()

        result = beam_job_services.get_beam_job_run_result('123')
        self.assertEqual(result.stdout, 'abc')
        self.assertEqual(result.stderr, '123')


class GetBeamJobRunResultTests(test_utils.GenericTestBase):

    def test_get_beam_run_result(self):
        beam_job_models.BeamJobRunResultModel(
            job_id='123', stdout='abc', stderr='def').put()

        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertEqual(beam_job_run_result.stdout, 'abc')
        self.assertEqual(beam_job_run_result.stderr, 'def')

    def test_get_beam_run_result_with_no_results(self):
        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertEqual(beam_job_run_result.stdout, '')
        self.assertEqual(beam_job_run_result.stderr, '')

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
