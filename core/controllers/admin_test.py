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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

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
from core.domain import question_fetchers
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import skill_services
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import utils

(exp_models, job_models, opportunity_models, audit_models) = (
    models.Registry.import_models(
        [models.NAMES.exploration, models.NAMES.job, models.NAMES.opportunity,
         models.NAMES.audit]))

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
        new_config_value = False

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

    def test_cannot_load_new_structures_data_in_production_mode(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_structures_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_non_admins_cannot_load_new_structures_data(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        assert_raises_regexp = self.assertRaisesRegexp(
            Exception, 'User does not have enough rights to generate data.')
        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_structures_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_cannot_generate_dummy_skill_data_in_production_mode(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Cannot generate dummy skills in production.')
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_skill_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_non_admins_cannot_generate_dummy_skill_data(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        assert_raises_regexp = self.assertRaisesRegexp(
            Exception, 'User does not have enough rights to generate data.')
        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_skill_data'
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

    def test_load_new_structures_data(self):
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_new_structures_data'
            }, csrf_token=csrf_token)
        topic_summaries = topic_services.get_all_topic_summaries()
        self.assertEqual(len(topic_summaries), 2)
        for summary in topic_summaries:
            if summary.name == 'Dummy Topic 1':
                topic_id = summary.id
        story_id = (
            topic_fetchers.get_topic_by_id(
                topic_id).canonical_story_references[0].story_id)
        self.assertIsNotNone(
            story_fetchers.get_story_by_id(story_id, strict=False))
        skill_summaries = skill_services.get_all_skill_summaries()
        self.assertEqual(len(skill_summaries), 3)
        questions, _, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                10, [
                    skill_summaries[0].id, skill_summaries[1].id,
                    skill_summaries[2].id], '')
        )
        self.assertEqual(len(questions), 3)
        self.logout()

    def test_generate_dummy_skill_and_questions_data(self):
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_new_skill_data'
            }, csrf_token=csrf_token)
        skill_summaries = skill_services.get_all_skill_summaries()
        self.assertEqual(len(skill_summaries), 1)
        questions, _, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                20, [skill_summaries[0].id], '')
        )
        self.assertEqual(len(questions), 15)
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

    def test_regenerate_topic_related_opportunities_action(self):
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        topic_id = 'topic'
        story_id = 'story'
        self.save_new_valid_exploration(
            '0', owner_id, title='title',
            end_state_name='End State')
        self.publish_exploration(owner_id, '0')

        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic', 'abbrev', 'description')
        topic_services.save_new_topic(owner_id, topic)

        story = story_domain.Story.create_default_story(
            story_id, title='A story',
            corresponding_topic_id=topic_id)
        story_services.save_new_story(owner_id, story)
        topic_services.add_canonical_story(
            owner_id, topic_id, story_id)
        story_services.update_story(
            owner_id, story_id, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': '0'
            })], 'Changes.')

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 1)

        old_creation_time = all_opportunity_models[0].created_on

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        result = self.post_json(
            '/adminhandler', {
                'action': 'regenerate_topic_related_opportunities',
                'topic_id': 'topic'
            }, csrf_token=csrf_token)

        self.assertEqual(
            result, {
                'opportunities_count': 1
            })

        all_opportunity_models = list(
            opportunity_models.ExplorationOpportunitySummaryModel.get_all())

        self.assertEqual(len(all_opportunity_models), 1)

        new_creation_time = all_opportunity_models[0].created_on

        self.assertLess(old_creation_time, new_creation_time)

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
            params={'filter_criterion': 'username', 'username': 'user1'})
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
            params={
                'filter_criterion': 'role',
                'role': feconf.ROLE_ID_MODERATOR
            })
        self.assertEqual(response_dict, {'user1': feconf.ROLE_ID_MODERATOR})
        self.logout()

    def test_invalid_username_in_filter_criterion_and_update_role(self):
        username = 'myinvaliduser'

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        # Trying to view role of non-existent user.
        self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username},
            expected_status_int=400)

        # Trying to update role of non-existent user.
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_cannot_view_role_with_invalid_view_filter_criterion(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'invalid', 'username': 'user1'},
            expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid filter criterion to view roles.')

    def test_changing_user_role_from_topic_manager_to_moderator(self):
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        self.set_topic_managers([username])

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
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
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(response_dict, {username: feconf.ROLE_ID_MODERATOR})

        self.logout()

    def test_changing_user_role_from_exploration_editor_to_topic_manager(self):
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, user_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

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
            params={'filter_criterion': 'username', 'username': username})
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


class SendDummyMailTest(test_utils.GenericTestBase):
    """"Tests for sending test mails to admin."""

    def setUp(self):
        super(SendDummyMailTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

    def test_send_dummy_mail(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            generated_response = self.post_json(
                '/senddummymailtoadminhandler', payload={},
                csrf_token=csrf_token, expected_status_int=200)
            self.assertEqual(generated_response, {})

        with self.swap(feconf, 'CAN_SEND_EMAILS', False):
            generated_response = self.post_json(
                '/senddummymailtoadminhandler', payload={},
                csrf_token=csrf_token, expected_status_int=400)
            self.assertEqual(
                generated_response['error'], 'This app cannot send emails.')


class UpdateUsernameHandlerTest(test_utils.GenericTestBase):
    """Tests for updating usernames."""
    OLD_USERNAME = 'oldUsername'
    NEW_USERNAME = 'newUsername'

    def setUp(self):
        super(UpdateUsernameHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.OLD_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

    def test_update_username_with_none_new_username(self):
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': self.OLD_USERNAME,
                'new_username': None},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Invalid request: A new username must be '
            'specified.')

    def test_update_username_with_none_old_username(self):
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': None,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Invalid request: The old username must be '
            'specified.')

    def test_update_username_with_non_string_new_username(self):
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': self.OLD_USERNAME,
                'new_username': 123},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Expected new username to be a unicode '
            'string, received 123')

    def test_update_username_with_non_string_old_username(self):
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': 123,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Expected old username to be a unicode '
            'string, received 123')

    def test_update_username_with_long_new_username(self):
        long_username = 'a' * (constants.MAX_USERNAME_LENGTH + 1)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': self.OLD_USERNAME,
                'new_username': long_username},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Expected new username to be less than %s '
            'characters, received %s' % (
                constants.MAX_USERNAME_LENGTH,
                long_username))

    def test_update_username_with_nonexistent_old_username(self):
        non_existent_username = 'invalid'
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': non_existent_username,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(response['error'], 'Invalid username: invalid')

    def test_update_username_with_new_username_already_taken(self):
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': self.OLD_USERNAME,
                'new_username': self.OLD_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(response['error'], 'Username already taken.')

    def test_update_username(self):
        user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateusernamehandler',
            payload={
                'old_username': self.OLD_USERNAME,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token)
        self.assertEqual(user_services.get_username(user_id), self.NEW_USERNAME)

    def test_update_username_creates_audit_model(self):
        user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        creation_time_in_millisecs = utils.get_current_time_in_millisecs()
        mock_get_current_time_in_millisecs = lambda: creation_time_in_millisecs
        # Since the UsernameChangeAuditModel's ID is formed from the user ID and
        # a millisecond timestamp we need to make sure that
        # get_current_time_in_millisecs returns the same value as we have saved
        # into current_time_in_millisecs. If we don't force the same value via
        # swap flakes can occur, since as the time flows the saved milliseconds
        # can differ from the milliseconds saved into the
        # UsernameChangeAuditModel's ID.
        with self.swap(
            utils, 'get_current_time_in_millisecs',
            mock_get_current_time_in_millisecs):
            self.put_json(
                '/updateusernamehandler',
                payload={
                    'old_username': self.OLD_USERNAME,
                    'new_username': self.NEW_USERNAME},
                csrf_token=csrf_token)

        self.assertTrue(
            audit_models.UsernameChangeAuditModel.has_reference_to_user_id(
                user_id))

        model_id = '%s.%d' % (user_id, creation_time_in_millisecs)
        username_change_audit_model = (
            audit_models.UsernameChangeAuditModel.get(model_id))

        self.assertEqual(username_change_audit_model.committer_id, user_id)
        self.assertEqual(
            username_change_audit_model.old_username, self.OLD_USERNAME)
        self.assertEqual(
            username_change_audit_model.new_username, self.NEW_USERNAME)


class AddCommunityReviewerHandlerTest(test_utils.GenericTestBase):
    """Tests related to add reviewers for contributor's
    suggestion/application.
    """
    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        super(AddCommunityReviewerHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)

    def test_add_reviewer_with_invalid_username_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'invalid',
                'review_category': 'translation',
                'language_code': 'en'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_add_translation_reviewer(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'translator',
                'review_category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_add_translation_reviewer_in_invalid_language_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'translator',
                'review_category': 'translation',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_assigning_same_language_for_translation_review_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'translator',
                'review_category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'translator',
                'review_category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User translator already has rights to review translation in '
            'language code hi')

    def test_add_voiceover_reviewer(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'voiceartist',
                'review_category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_voiceover_applications(
            self.voiceover_reviewer_id, language_code='hi'))

    def test_add_voiceover_reviewer_in_invalid_language(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'voiceartist',
                'review_category': 'voiceover',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

    def test_assigning_same_language_for_voiceover_review_raise_error(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'voiceartist',
                'review_category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'voiceartist',
                'review_category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User voiceartist already has rights to review voiceover in '
            'language code hi')

    def test_add_question_reviewer(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'question',
                'review_category': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_reviewer_raise_error(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'question',
                'review_category': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'question',
                'review_category': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to review question.')

    def test_add_reviewer_for_invalid_review_category_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcommunityreviewerhandler', {
                'username': 'question',
                'review_category': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid review_category: invalid')


class RemoveCommunityReviewerHandlerTest(test_utils.GenericTestBase):
    """Tests related to remove reviewers from community dashboard page."""
    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        super(RemoveCommunityReviewerHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)

    def test_add_reviewer_without_username_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'removal_type': 'all'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(response['error'], 'Missing username param')

    def test_add_reviewer_with_invalid_username_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'invalid',
                'removal_type': 'all'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_remove_translation_reviewer(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'review_category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_translation_reviewer_in_invalid_language_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'review_category': 'translation',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_remove_unassigned_translation_reviewer_raise_error(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'review_category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'translator does not have rights to review translation in language '
            'hi.')

    def test_remove_voiceover_reviewer(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))
        user_services.allow_user_to_review_voiceover_in_language(
            self.voiceover_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'review_category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_voiceover_applications(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_voiceover_reviewer_in_invalid_language_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'review_category': 'voiceover',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_remove_unassigned_voiceover_reviewer_raise_error(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'review_category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'voiceartist does not have rights to review voiceover in language '
            'hi.')

    def test_remove_question_reviewer(self):
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'question',
                'removal_type': 'specific',
                'review_category': 'question'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_reviewer_raise_error(self):
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'question',
                'removal_type': 'specific',
                'review_category': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to review question.')

    def test_remove_reviewer_for_invalid_review_category_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'question',
                'removal_type': 'specific',
                'review_category': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid review_category: invalid')

    def test_remove_reviewer_for_invalid_removal_type_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'question',
                'removal_type': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid removal_type: invalid')

    def test_remove_reviewer_from_all_reviewable_items(self):
        user_services.allow_user_to_review_question(
            self.translation_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.translation_reviewer_id))

        user_services.allow_user_to_review_voiceover_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))

        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecommunityreviewerhandler', {
                'username': 'translator',
                'removal_type': 'all'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_question_suggestions(
            self.translation_reviewer_id))
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))


class CommunityReviewersListHandlerTest(test_utils.GenericTestBase):
    """Tests CommunityReviewersListHandler."""
    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        super(CommunityReviewersListHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.TRANSLATION_REVIEWER_EMAIL, 'translator')
        self.signup(self.VOICEOVER_REVIEWER_EMAIL, 'voiceartist')
        self.signup(self.QUESTION_REVIEWER_EMAIL, 'question')

        self.translation_reviewer_id = self.get_user_id_from_email(
            self.TRANSLATION_REVIEWER_EMAIL)
        self.voiceover_reviewer_id = self.get_user_id_from_email(
            self.VOICEOVER_REVIEWER_EMAIL)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)

    def test_check_community_reviewer_by_translation_reviewer_role(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.voiceover_reviewer_id, 'hi')
        response = self.get_json(
            '/getcommunityreviewershandler', params={
                'review_category': 'translation',
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('translator' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_community_reviewer_by_voiceover_reviewer_role(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_review_voiceover_in_language(
            self.translation_reviewer_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.voiceover_reviewer_id, 'hi')
        response = self.get_json(
            '/getcommunityreviewershandler', params={
                'review_category': 'voiceover',
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('translator' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_community_reviewer_by_question_reviewer_role(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        user_services.allow_user_to_review_question(self.voiceover_reviewer_id)
        response = self.get_json(
            '/getcommunityreviewershandler', params={
                'review_category': 'question'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('question' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_community_reviewer_with_invalid_language_code_raise_error(
            self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/getcommunityreviewershandler', params={
                'review_category': 'voiceover',
                'language_code': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid language_code: invalid')
        self.logout()

    def test_check_community_reviewer_with_invalid_review_category_raise_error(
            self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/getcommunityreviewershandler', params={
                'review_category': 'invalid',
                'language_code': 'hi'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid review_category: invalid')
        self.logout()


class CommunityReviewerRightsDataHandlerTest(test_utils.GenericTestBase):
    """Tests CommunityReviewerRightsDataHandler."""
    REVIEWER_EMAIL = 'reviewer@example.com'

    def setUp(self):
        super(CommunityReviewerRightsDataHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')

        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

    def test_check_community_reviewer_rights(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/communityreviewerrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response['can_review_translation_for_language_codes'], [])
        self.assertEqual(
            response['can_review_voiceover_for_language_codes'], [])
        self.assertEqual(response['can_review_questions'], False)

        user_services.allow_user_to_review_question(self.reviewer_id)
        user_services.allow_user_to_review_voiceover_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')

        response = self.get_json(
            '/communityreviewerrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response['can_review_translation_for_language_codes'], ['hi'])
        self.assertEqual(
            response['can_review_voiceover_for_language_codes'], ['hi'])
        self.assertEqual(response['can_review_questions'], True)

    def test_check_community_reviewer_rights_invalid_username(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/communityreviewerrightsdatahandler', params={
                'username': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid username: invalid')
        self.logout()

    def test_check_community_reviewer_rights_without_username(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/communityreviewerrightsdatahandler', params={},
            expected_status_int=400)

        self.assertEqual(response['error'], 'Missing username param')
        self.logout()
