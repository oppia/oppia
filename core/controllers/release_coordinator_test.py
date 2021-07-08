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

"""Tests for the release coordinator page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core import jobs_registry
from core.domain import taskqueue_services
from core.platform import models
from core.tests import test_utils
import feconf

(exp_models, job_models,) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.job])


class SampleMapReduceJobManager(jobs.BaseMapReduceOneOffJobManager):
    """Test job that counts the total number of explorations."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, sum([int(value) for value in values]))


class ReleaseCoordinatorPageTest(test_utils.GenericTestBase):
    """Test for release coordinator pages."""

    def setUp(self):
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super(ReleaseCoordinatorPageTest, self).setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.set_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_guest_user_cannot_access_the_page(self):
        self.get_html_response(
            '/release-coordinator', expected_status_int=302)

    def test_exploration_editor_cannot_access_the_page(self):
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(
            '/release-coordinator', expected_status_int=401)

    def test_release_coordinator_can_acces_the_page(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_html_response('/release-coordinator')
        response.mustcontain(
            '<oppia-release-coordinator-page></oppia-release-coordinator-page>')
        self.logout()


class JobsHandlerTest(test_utils.GenericTestBase):
    """Test for the JobsHandler."""

    def setUp(self):
        super(JobsHandlerTest, self).setUp()
        self.signup(feconf.ADMIN_EMAIL_ADDRESS, 'testsuper')
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_only_release_coordinator_allowed_to_use_jobs_handler(self):
        # Guest user.
        self.get_json('/jobshandler', expected_status_int=401)

        # Login as a non-admin.
        self.login(self.EDITOR_EMAIL)
        self.get_json('/jobshandler', expected_status_int=401)
        self.logout()

        # Login as an admin.
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.get_json('/jobshandler', expected_status_int=401)
        self.logout()

        # Login as a release coordinator.
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        response = self.get_json('/jobshandler')
        self.assertItemsEqual(list(response), [
            'human_readable_current_time',
            'one_off_job_status_summaries', 'audit_job_status_summaries',
            'recent_job_data', 'unfinished_job_data'])
        self.logout()

    def test_start_new_one_off_job(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS', [SampleMapReduceJobManager]):

            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/jobshandler', {
                    'action': 'start_new_job',
                    'job_type': 'SampleMapReduceJobManager'
                }, csrf_token=csrf_token)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.logout()

    def test_cancel_one_off_job(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)

        self.run_but_do_not_flush_pending_mapreduce_tasks()
        status = SampleMapReduceJobManager.get_status_code(job_id)

        self.assertEqual(status, job_models.STATUS_CODE_STARTED)

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS', [SampleMapReduceJobManager]):

            self.get_json('/jobshandler')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/jobshandler', {
                    'action': 'cancel_job',
                    'job_id': job_id,
                    'job_type': 'SampleMapReduceJobManager'
                }, csrf_token=csrf_token)

        status = SampleMapReduceJobManager.get_status_code(job_id)

        self.assertEqual(status, job_models.STATUS_CODE_CANCELED)

        self.logout()

    def test_handler_with_invalid_action_raise_400(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        self.get_json('/jobshandler')
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/jobshandler', {
                'action': 'invalid_action'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid action: invalid_action')

        self.logout()


class JobOutputHandlerTest(test_utils.GenericTestBase):
    """Tests JobOutputHandlerTest."""

    def setUp(self):
        super(JobOutputHandlerTest, self).setUp()
        self.signup(feconf.ADMIN_EMAIL_ADDRESS, 'testsuper')
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_job_output_handler(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        self.save_new_valid_exploration('exp_id', self.admin_id)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        response = self.get_json('/joboutputhandler', params={'job_id': job_id})
        self.assertIsNone(response['output'])

        self.process_and_flush_pending_mapreduce_tasks()

        response = self.get_json('/joboutputhandler', params={'job_id': job_id})
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(response['output'], ['[u\'sum\', 1]'])

        self.logout()


class MemoryCacheHandlerTest(test_utils.GenericTestBase):
    """Tests MemoryCacheHandler."""

    def setUp(self):
        super(MemoryCacheHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.set_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_get_memory_cache_data(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(
            response['total_allocation'], 0)
        self.assertEqual(
            response['peak_allocation'], 0)
        self.assertEqual(response['total_keys_stored'], 1)

    def test_flush_memory_cache(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 1)

        self.delete_json('/memorycachehandler')

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 0)
