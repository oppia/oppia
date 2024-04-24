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

"""Tests for the beam jobs controllers."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import beam_job_domain
from core.domain import beam_job_services
from core.jobs import base_jobs
from core.jobs import jobs_manager
from core.tests import test_utils

import apache_beam as beam


class FooJob(base_jobs.JobBase):
    """Simple test-only class."""

    def run(self) -> beam.PCollection:
        """Does nothing."""
        return self.pipeline | beam.Create([])


class BeamHandlerTestBase(test_utils.GenericTestBase):
    """Common setUp() and tearDown() for Apache Beam job handler tests."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)
        self.login(self.RELEASE_COORDINATOR_EMAIL, is_super_admin=True)

    def tearDown(self) -> None:
        self.logout()
        super().tearDown()


class BeamJobHandlerTests(BeamHandlerTestBase):

    def test_get_returns_registered_jobs(self) -> None:
        job = beam_job_domain.BeamJob(FooJob)
        get_beam_jobs_swap = self.swap_to_always_return(
            beam_job_services, 'get_beam_jobs', value=[job])

        with get_beam_jobs_swap:
            response = self.get_json('/beam_job')

        self.assertEqual(response, {
            'jobs': [{'name': 'FooJob'}],
        })


class BeamJobRunHandlerTests(BeamHandlerTestBase):

    def test_get_returns_all_runs(self) -> None:
        beam_job_services.create_beam_job_run_model('FooJob').put()
        beam_job_services.create_beam_job_run_model('FooJob').put()
        beam_job_services.create_beam_job_run_model('FooJob').put()

        response = self.get_json('/beam_job_run')

        self.assertIn('runs', response)
        runs = response['runs']
        self.assertEqual(len(runs), 3)
        self.assertCountEqual([run['job_name'] for run in runs], ['FooJob'] * 3)

    def test_put_starts_new_job(self) -> None:
        model = beam_job_services.create_beam_job_run_model('FooJob')

        with self.swap_to_always_return(jobs_manager, 'run_job', value=model):
            response = self.put_json(
                '/beam_job_run', {'job_name': 'FooJob'},
                csrf_token=self.get_new_csrf_token())

        self.assertEqual(
            response,
            beam_job_services.get_beam_job_run_from_model(model).to_dict())

    def test_delete_cancels_job(self) -> None:
        model = beam_job_services.create_beam_job_run_model('FooJob')
        model.put()
        run = beam_job_domain.BeamJobRun(
            model.id, 'FooJob', 'CANCELLING',
            datetime.datetime.utcnow(), datetime.datetime.utcnow(), False)

        swap_cancel_beam_job = self.swap_to_always_return(
            beam_job_services, 'cancel_beam_job', value=run)
        with swap_cancel_beam_job:
            response = self.delete_json('/beam_job_run', {'job_id': model.id})

        self.assertEqual(response, run.to_dict())


class BeamJobRunResultHandlerTests(BeamHandlerTestBase):

    def test_get_returns_job_output(self) -> None:
        run_model = beam_job_services.create_beam_job_run_model('WorkingJob')
        run_model.put()
        result_model = beam_job_services.create_beam_job_run_result_model(
            run_model.id, 'o', '')
        result_model.put()

        response = (
            self.get_json('/beam_job_run_result?job_id=%s' % run_model.id))

        self.assertEqual(response, {'stdout': 'o', 'stderr': ''})

    def test_get_raises_when_job_id_missing(self) -> None:
        response = (
            self.get_json('/beam_job_run_result', expected_status_int=400))

        self.assertEqual(
            response['error'], 'Missing key in handler args: job_id.')
