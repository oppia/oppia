# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the admin page."""

import logging

from constants import constants
from core import jobs
from core import jobs_registry
from core import jobs_test
from core.domain import collection_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf


(exp_models, job_models,) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.job])

BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'
BOTH_MODERATOR_AND_ADMIN_USERNAME = 'moderatorandadm1n'


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


class AdminIntegrationTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def setUp(self):
        """Complete the signup process for self.ADMIN_EMAIL."""
        super(AdminIntegrationTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_admin_page_rights(self):
        """Test access rights to the admin page."""

        self.get_html_response('/admin', expected_status_int=302)

        # Login as a non-admin.
        self.login(self.EDITOR_EMAIL)
        self.get_html_response('/admin', expected_status_int=401)
        self.logout()

        # Login as an admin.
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.get_html_response('/admin')
        self.logout()

    def test_change_configuration_property(self):
        """Test that configuration properties can be changed."""

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        new_config_value = True

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': False,
        }, response_config_properties[
            config_domain.IS_IMPROVEMENTS_TAB_ENABLED.name])

        payload = {
            'action': 'save_config_properties',
            'new_config_property_values': {
                config_domain.IS_IMPROVEMENTS_TAB_ENABLED.name: (
                    new_config_value),
            }
        }
        self.post_json('/adminhandler', payload, csrf_token=csrf_token)

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']
        self.assertDictContainsSubset({
            'value': new_config_value,
        }, response_config_properties[
            config_domain.IS_IMPROVEMENTS_TAB_ENABLED.name])

        self.logout()

    def test_cannot_reload_exploration_in_production_mode(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot reload an exploration in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_exploration',
                    'exploration_id': '2'
                }, csrf_token=csrf_token)

        self.logout()

    def test_cannot_reload_collection_in_production_mode(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot reload a collection in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_collection',
                    'collection_id': '2'
                }, csrf_token=csrf_token)

        self.logout()

    def test_reload_collection(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        collection_services.load_demo('0')
        collection_rights = rights_manager.get_collection_rights('0')

        self.assertFalse(collection_rights.community_owned)

        with self.swap(logging, 'info', _mock_logging_function):
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_collection',
                    'collection_id': '0'
                }, csrf_token=csrf_token)

        collection_rights = rights_manager.get_collection_rights('0')

        self.assertTrue(collection_rights.community_owned)
        self.assertEqual(
            observed_log_messages,
            [
                '[ADMIN] %s reloaded collection 0' % self.admin_id,
                'Collection with id 0 was loaded.'
            ]
        )

        self.logout()

    def test_flush_migration_bot_contributions_action(self):
        created_exploration_ids = ['exp_1', 'exp_2']
        edited_exploration_ids = ['exp_3', 'exp_4']
        user_services.create_user_contributions(
            feconf.MIGRATION_BOT_USER_ID, created_exploration_ids,
            edited_exploration_ids)

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertEqual(
            migration_bot_contributions_model.created_exploration_ids,
            created_exploration_ids)
        self.assertEqual(
            migration_bot_contributions_model.edited_exploration_ids,
            edited_exploration_ids)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '/adminhandler', {
                'action': 'flush_migration_bot_contribution_data'
            }, csrf_token=csrf_token)

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertEqual(
            migration_bot_contributions_model.created_exploration_ids, [])
        self.assertEqual(
            migration_bot_contributions_model.edited_exploration_ids, [])

    def test_admin_topics_csv_download_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_custom_response(
            '/admintopicscsvdownloadhandler', expected_content_type='text/csv')

        self.assertEqual(
            response.headers['Content-Disposition'],
            'attachment; filename=topic_similarities.csv')

        self.assertIn(
            'Architecture,Art,Biology,Business,Chemistry,Computing,Economics,'
            'Education,Engineering,Environment,Geography,Government,Hobbies,'
            'Languages,Law,Life Skills,Mathematics,Medicine,Music,Philosophy,'
            'Physics,Programming,Psychology,Puzzles,Reading,Religion,Sport,'
            'Statistics,Welcome',
            response.body)

        self.logout()

    def test_admin_job_output_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        self.save_new_valid_exploration('exp_id', self.admin_id)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        response = self.get_json('/adminjoboutput', params={'job_id': job_id})
        self.assertIsNone(response['output'])

        self.process_and_flush_pending_tasks()

        response = self.get_json('/adminjoboutput', params={'job_id': job_id})
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(response['output'], ['[u\'sum\', 1]'])

        self.logout()

    def test_revert_config_property(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        config_services.set_property(self.admin_id, 'promo_bar_enabled', True)
        self.assertTrue(config_domain.PROMO_BAR_ENABLED.value)

        with self.swap(logging, 'info', _mock_logging_function):
            self.post_json(
                '/adminhandler', {
                    'action': 'revert_config_property',
                    'config_property_id': 'promo_bar_enabled'
                }, csrf_token=csrf_token)

        self.assertFalse(config_domain.PROMO_BAR_ENABLED.value)
        self.assertEqual(
            observed_log_messages,
            ['[ADMIN] %s reverted config property: promo_bar_enabled'
             % self.admin_id])

        self.logout()

    def test_start_new_one_off_job(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS', [SampleMapReduceJobManager]):

            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/adminhandler', {
                    'action': 'start_new_job',
                    'job_type': 'SampleMapReduceJobManager'
                }, csrf_token=csrf_token)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.logout()

    def test_cancel_one_off_job(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)

        self.run_but_do_not_flush_pending_tasks()
        status = SampleMapReduceJobManager.get_status_code(job_id)

        self.assertEqual(status, job_models.STATUS_CODE_STARTED)

        with self.swap(
            jobs_registry, 'ONE_OFF_JOB_MANAGERS', [SampleMapReduceJobManager]):

            self.get_json('/adminhandler')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/adminhandler', {
                    'action': 'cancel_job',
                    'job_id': job_id,
                    'job_type': 'SampleMapReduceJobManager'
                }, csrf_token=csrf_token)

        status = SampleMapReduceJobManager.get_status_code(job_id)

        self.assertEqual(status, job_models.STATUS_CODE_CANCELED)

        self.logout()

    def test_start_computation(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        status = jobs_test.StartExplorationEventCounter.get_status_code()

        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)

        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            [jobs_test.StartExplorationEventCounter]):

            self.get_json('/adminhandler')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/adminhandler', {
                    'action': 'start_computation',
                    'computation_type': 'StartExplorationEventCounter'
                }, csrf_token=csrf_token)

        status = jobs_test.StartExplorationEventCounter.get_status_code()
        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

        self.logout()

    def test_stop_computation_with_running_jobs(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        jobs_test.StartExplorationEventCounter.start_computation()
        self.run_but_do_not_flush_pending_tasks()
        status = jobs_test.StartExplorationEventCounter.get_status_code()

        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            [jobs_test.StartExplorationEventCounter]):

            self.get_json('/adminhandler')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/adminhandler', {
                    'action': 'stop_computation',
                    'computation_type': 'StartExplorationEventCounter'
                }, csrf_token=csrf_token)

        status = jobs_test.StartExplorationEventCounter.get_status_code()
        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)

        self.logout()

    def test_stop_computation_with_finished_jobs(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        jobs_test.StartExplorationEventCounter.start_computation()

        self.process_and_flush_pending_tasks()
        status = jobs_test.StartExplorationEventCounter.get_status_code()

        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            [jobs_test.StartExplorationEventCounter]):

            self.get_json('/adminhandler')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/adminhandler', {
                    'action': 'stop_computation',
                    'computation_type': 'StartExplorationEventCounter'
                }, csrf_token=csrf_token)

        status = jobs_test.StartExplorationEventCounter.get_status_code()
        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)

        self.logout()

    def test_stop_computation_with_stopped_jobs(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        jobs_test.StartExplorationEventCounter.start_computation()
        self.run_but_do_not_flush_pending_tasks()
        status = jobs_test.StartExplorationEventCounter.get_status_code()

        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)

        jobs_test.StartExplorationEventCounter.stop_computation(self.admin_id)
        status = jobs_test.StartExplorationEventCounter.get_status_code()

        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)

        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            [jobs_test.StartExplorationEventCounter]):

            self.get_json('/adminhandler')
            csrf_token = self.get_new_csrf_token()

            self.post_json(
                '/adminhandler', {
                    'action': 'stop_computation',
                    'computation_type': 'StartExplorationEventCounter'
                }, csrf_token=csrf_token)

        status = jobs_test.StartExplorationEventCounter.get_status_code()
        self.assertEqual(
            status, job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)

        self.logout()

    def test_upload_topic_similarities(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        self.assertEqual(recommendations_services.get_topic_similarity(
            'Art', 'Biology'), 0.1)
        self.assertEqual(recommendations_services.get_topic_similarity(
            'Art', 'Art'), feconf.SAME_TOPIC_SIMILARITY)
        self.assertEqual(recommendations_services.get_topic_similarity(
            'Topic 1', 'Topic 2'), feconf.DEFAULT_TOPIC_SIMILARITY)
        self.assertEqual(recommendations_services.get_topic_similarity(
            'Topic', 'Topic'), feconf.SAME_TOPIC_SIMILARITY)

        topic_similarities_data = (
            'Art,Biology,Chemistry\n'
            '1.0,0.2,0.1\n'
            '0.2,1.0,0.8\n'
            '0.1,0.8,1.0'
        )

        self.post_json(
            '/adminhandler', {
                'action': 'upload_topic_similarities',
                'data': topic_similarities_data
            }, csrf_token=csrf_token)

        self.assertEqual(recommendations_services.get_topic_similarity(
            'Art', 'Biology'), 0.2)

        self.logout()


class GenerateDummyExplorationsTest(test_utils.GenericTestBase):
    """Test the conditions for generation of dummy explorations."""

    def setUp(self):
        super(GenerateDummyExplorationsTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

    def test_generate_count_greater_than_publish_count(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_explorations',
                'num_dummy_exps_to_generate': 10,
                'num_dummy_exps_to_publish': 3
            }, csrf_token=csrf_token)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(len(generated_exps), 10)
        self.assertEqual(len(published_exps), 3)

    def test_generate_count_equal_to_publish_count(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_explorations',
                'num_dummy_exps_to_generate': 2,
                'num_dummy_exps_to_publish': 2
            }, csrf_token=csrf_token)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(len(generated_exps), 2)
        self.assertEqual(len(published_exps), 2)

    def test_generate_count_less_than_publish_count(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        generated_exps_response = self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_explorations',
                'num_dummy_exps_to_generate': 2,
                'num_dummy_exps_to_publish': 5
            },
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(generated_exps_response['status_code'], 400)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(len(generated_exps), 0)
        self.assertEqual(len(published_exps), 0)

    def test_handler_raises_error_with_non_int_num_dummy_exps_to_generate(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        with self.assertRaisesRegexp(
            Exception, 'invalid_type is not a number'):
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_explorations',
                    'num_dummy_exps_to_publish': 1,
                    'num_dummy_exps_to_generate': 'invalid_type'
                }, csrf_token=csrf_token)

        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_handler_raises_error_with_non_int_num_dummy_exps_to_publish(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        with self.assertRaisesRegexp(
            Exception, 'invalid_type is not a number'):
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_explorations',
                    'num_dummy_exps_to_publish': 'invalid_type',
                    'num_dummy_exps_to_generate': 1
                }, csrf_token=csrf_token)

        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_cannot_generate_dummy_explorations_in_prod_mode(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot generate dummy explorations in production.')

        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_explorations',
                    'num_dummy_exps_to_generate': 10,
                    'num_dummy_exps_to_publish': 3
                }, csrf_token=csrf_token)

        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()


class AdminRoleHandlerTest(test_utils.GenericTestBase):
    """Checks the user role handling on the admin page."""

    def setUp(self):
        """Complete the signup process for self.ADMIN_EMAIL."""
        super(AdminRoleHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])

    def test_view_and_update_role(self):
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        # Check normal user has expected role. Viewing by username.
        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'username', 'username': 'user1'})
        self.assertEqual(
            response_dict, {'user1': feconf.ROLE_ID_EXPLORATION_EDITOR})

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token,
            expected_status_int=200)
        self.assertEqual(response_dict, {})

        # Viewing by role.
        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'role', 'role': feconf.ROLE_ID_MODERATOR})
        self.assertEqual(response_dict, {'user1': feconf.ROLE_ID_MODERATOR})
        self.logout()

    def test_invalid_username_in_view_and_update_role(self):
        username = 'myinvaliduser'

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        # Trying to view role of non-existent user.
        self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'username', 'username': username},
            expected_status_int=400)

        # Trying to update role of non-existent user.
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_cannot_view_role_with_invalid_view_method(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'invalid_method', 'username': 'user1'},
            expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid method to view roles.')

    def test_changing_user_role_from_topic_manager_to_moderator(self):
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        self.set_topic_managers([username])

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'username', 'username': username})
        self.assertEqual(
            response_dict, {username: feconf.ROLE_ID_TOPIC_MANAGER})

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'username', 'username': username})

        self.assertEqual(response_dict, {username: feconf.ROLE_ID_MODERATOR})

        self.logout()

    def test_changing_user_role_from_exploration_editor_to_topic_manager(self):
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, user_id, 'Name', 'Description', [], [], [], [], 1)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'username', 'username': username})

        self.assertEqual(
            response_dict, {username: feconf.ROLE_ID_EXPLORATION_EDITOR})

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_TOPIC_MANAGER, 'username': username,
             'topic_id': topic_id}, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'method': 'username', 'username': username})
        self.assertEqual(
            response_dict, {username: feconf.ROLE_ID_TOPIC_MANAGER})

        self.logout()


class DataExtractionQueryHandlerTests(test_utils.GenericTestBase):
    """Tests for data extraction handler."""

    EXP_ID = 'exp'

    def setUp(self):
        """Complete the signup process for self.ADMIN_EMAIL."""
        super(DataExtractionQueryHandlerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, end_state_name='End')

        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'second answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

    def test_data_extraction_handler(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        # Test that it returns all answers when 'num_answers' is 0.
        payload = {
            'exp_id': self.EXP_ID,
            'exp_version': self.exploration.version,
            'state_name': self.exploration.init_state_name,
            'num_answers': 0
        }

        response = self.get_json(
            '/explorationdataextractionhandler', params=payload)
        extracted_answers = response['data']
        self.assertEqual(len(extracted_answers), 2)
        self.assertEqual(extracted_answers[0]['answer'], 'first answer')
        self.assertEqual(extracted_answers[1]['answer'], 'second answer')

        # Make sure that it returns only 'num_answers' number of answers.
        payload = {
            'exp_id': self.EXP_ID,
            'exp_version': self.exploration.version,
            'state_name': self.exploration.init_state_name,
            'num_answers': 1
        }

        response = self.get_json(
            '/explorationdataextractionhandler', params=payload)
        extracted_answers = response['data']
        self.assertEqual(len(extracted_answers), 1)
        self.assertEqual(extracted_answers[0]['answer'], 'first answer')

    def test_that_handler_raises_exception(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        payload = {
            'exp_id': self.EXP_ID,
            'exp_version': self.exploration.version,
            'state_name': 'state name',
            'num_answers': 0
        }

        response = self.get_json(
            '/explorationdataextractionhandler', params=payload,
            expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Exploration \'exp\' does not have \'state name\' state.')

    def test_handler_raises_error_with_invalid_exploration_id(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        payload = {
            'exp_id': 'invalid_exp_id',
            'state_name': 'state name',
            'exp_version': 1,
            'num_answers': 0
        }

        response = self.get_json(
            '/explorationdataextractionhandler', params=payload,
            expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Entity for exploration with id invalid_exp_id and version 1 not '
            'found.')

    def test_handler_raises_error_with_invalid_exploration_version(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        payload = {
            'exp_id': self.EXP_ID,
            'state_name': 'state name',
            'exp_version': 10,
            'num_answers': 0
        }

        response = self.get_json(
            '/explorationdataextractionhandler', params=payload,
            expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Entity for exploration with id %s and version 10 not found.'
            % self.EXP_ID)


class ClearSearchIndexTest(test_utils.GenericTestBase):
    """Tests that search index gets cleared."""

    def test_clear_search_index(self):
        exp_services.load_demo('0')
        result_explorations = search_services.search_explorations(
            'Welcome', 2)[0]
        self.assertEqual(result_explorations, ['0'])
        collection_services.load_demo('0')
        result_collections = search_services.search_collections('Welcome', 2)[0]
        self.assertEqual(result_collections, ['0'])
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        generated_exps_response = self.post_json(
            '/adminhandler', {
                'action': 'clear_search_index'
            },
            csrf_token=csrf_token)
        self.assertEqual(generated_exps_response, {})
        result_explorations = search_services.search_explorations(
            'Welcome', 2)[0]
        self.assertEqual(result_explorations, [])
        result_collections = search_services.search_collections('Welcome', 2)[0]
        self.assertEqual(result_collections, [])
