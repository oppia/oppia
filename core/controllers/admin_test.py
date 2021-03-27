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
from core.domain import opportunity_services
from core.domain import platform_feature_services
from core.domain import platform_parameter_registry
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
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(
    audit_models, exp_models, job_models,
    opportunity_models, user_models
) = models.Registry.import_models([
    models.NAMES.audit, models.NAMES.exploration, models.NAMES.job,
    models.NAMES.opportunity, models.NAMES.user
])

BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'
BOTH_MODERATOR_AND_ADMIN_USERNAME = 'moderatorandadm1n'


class SampleMapReduceJobManager(jobs.BaseMapReduceOneOffJobManager):
    """Test job that counts the total number of explorations."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Entity Classes to Map Over."""
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        """Maps The Item.
        
        Args:
            item: item to be Mapped.
        """
        yield ('sum', 1)

    @staticmethod
    def reduce(key, values):
        """ Reduce Method

        Args:
            key: index of value.
            values: values that to be reduced.
        """
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
        """Test that Reload Exploration in Production Mode."""
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
        """ Test that Load New Strcutures Data in Production Mode. """
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
        """ Non Admin Test that Load New Strcutures Data in Production Mode. """
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
        """Test that Generate Dummy Skill Data in Production Mode."""
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
        """Non Admins Test that Generate Dummy Skill Data in Production Mode."""
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
        """Test that Reload Collection in Production Mode."""
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
        """ Test that Reload Collection. """
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.info().
            
            Args:
                args: str. Takes Arguments for the mock logging function.
            """
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
        """ Test that Load New Data Structures Data. """
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_new_structures_data'
            }, csrf_token=csrf_token)
        topic_summaries = topic_fetchers.get_all_topic_summaries()
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
        # Testing that there are 3 hindi translation opportunities
        # available on the Contributor Dashboard. Hindi was picked arbitrarily,
        # any language code other than english (what the dummy explorations
        # were written in) can be tested here.
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', None))
        self.assertEqual(len(translation_opportunities), 3)
        self.logout()

    def test_generate_dummy_skill_and_questions_data(self):
        """ Test that Generate Dummy Skill and Questions Data. """
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

    def test_regenerate_topic_related_opportunities_action(self):
        """ Test that Regenerate Topic related opportunities Action. """
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topic_id = 'topic'
        story_id = 'story'
        self.save_new_valid_exploration(
            '0', owner_id, title='title', end_state_name='End State',
            correctness_feedback_enabled=True)
        self.publish_exploration(owner_id, '0')

        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(owner_id, topic)
        topic_services.publish_topic(topic_id, self.admin_id)

        story = story_domain.Story.create_default_story(
            story_id, 'A story', 'Description', topic_id, 'story')
        story_services.save_new_story(owner_id, story)
        topic_services.add_canonical_story(
            owner_id, topic_id, story_id)
        topic_services.publish_story(topic_id, story_id, self.admin_id)
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

    def test_regenerate_missing_exploration_stats_action(self):
        """ Test that Generate Missing Exploration Stats Action. """
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.set_admins([self.ADMIN_USERNAME])

        self.save_new_default_exploration('ID', 'owner_id')

        self.assertEqual(
            exp_services.regenerate_missing_stats_for_exploration('ID'), (
                [], [], 1, 1))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        result = self.post_json(
            '/adminhandler', {
                'action': 'regenerate_missing_exploration_stats',
                'exp_id': 'ID'
            }, csrf_token=csrf_token)

        self.assertEqual(
            result, {
                'missing_exp_stats': [],
                'missing_state_stats': [],
                'num_valid_exp_stats': 1,
                'num_valid_state_stats': 1
            })

    def test_admin_topics_csv_download_handler(self):
        """ Test that Admin Topics of CSV Download Handler. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_custom_response(
            '/admintopicscsvdownloadhandler', 'text/csv')

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
        """ Test that Admin Topics of Job Output Handler. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        self.save_new_valid_exploration('exp_id', self.admin_id)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        response = self.get_json('/adminjoboutput', params={'job_id': job_id})
        self.assertIsNone(response['output'])

        self.process_and_flush_pending_mapreduce_tasks()

        response = self.get_json('/adminjoboutput', params={'job_id': job_id})
        self.assertEqual(
            SampleMapReduceJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        self.assertEqual(response['output'], ['[u\'sum\', 1]'])

        self.logout()

    def test_revert_config_property(self):
        """ Test that Revert Config Property. """
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
        """ Test that Start New One off Job. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
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
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.logout()

    def test_cancel_one_off_job(self):
        """ Test that Cancel one Job. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        job_id = SampleMapReduceJobManager.create_new()
        SampleMapReduceJobManager.enqueue(job_id)

        self.run_but_do_not_flush_pending_mapreduce_tasks()
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
        """ Test that Start Computation. """
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
        """ Test that Stop Computation With Running Jobs. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        jobs_test.StartExplorationEventCounter.start_computation()
        self.run_but_do_not_flush_pending_mapreduce_tasks()
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
        """ Test that Stop Computation with Finished Jobs. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        jobs_test.StartExplorationEventCounter.start_computation()

        self.process_and_flush_pending_mapreduce_tasks()
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
        """ Test that Stop Computation with Stopped Jobs. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id')
        exp_services.save_new_exploration('owner_id', exploration)

        self.assertEqual(
            jobs_test.StartExplorationEventCounter.get_count('exp_id'), 0)

        jobs_test.StartExplorationEventCounter.start_computation()
        self.run_but_do_not_flush_pending_mapreduce_tasks()
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
        """ Test That Upload Topic Similarities. """
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

    def test_get_handler_includes_all_feature_flags(self):
        """Handles GET requests.
        Test that handle all include feature flags."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        feature = platform_parameter_registry.Registry.create_feature_flag(
            'test_feature_1', 'feature for test.', 'dev')

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST', [feature.name])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            response_dict = self.get_json('/adminhandler')
            self.assertEqual(
                response_dict['feature_flags'], [feature.to_dict()])

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_post_with_flag_changes_updates_feature_flags(self):
        """Handles POST requests.
        Test that handle all flag changes updates."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            'test_feature_1', 'feature for test.', 'dev')
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST', [feature.name])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                }, csrf_token=csrf_token)

            rule_dicts = [
                rule.to_dict() for rule
                in platform_parameter_registry.Registry.get_platform_parameter(
                    feature.name).rules
            ]
            self.assertEqual(rule_dicts, new_rule_dicts)

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_post_flag_changes_correctly_updates_flags_returned_by_getter(self):
        """Handles POST requests. 
        Test that handle all flag changes and updates flages we get by getter."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            'test_feature_1', 'feature for test.', 'dev')
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST', [feature.name])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            response_dict = self.get_json('/adminhandler')
            self.assertEqual(
                response_dict['feature_flags'], [feature.to_dict()])

            self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                }, csrf_token=csrf_token)

            response_dict = self.get_json('/adminhandler')
            rules = response_dict['feature_flags'][0]['rules']
            self.assertEqual(rules, new_rule_dicts)

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_update_flag_rules_with_invalid_rules_returns_400(self):
        """ Test that update flag rules with Invalid Rules, Returns 400. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            'test_feature_1', 'feature for test.', 'dev')
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'prod']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST', [feature.name])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        with feature_list_ctx, feature_set_ctx:
            response = self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                },
                csrf_token=csrf_token,
                expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Feature in dev stage cannot be enabled in test or production '
                'environments.')

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()

    def test_update_flag_rules_with_unknown_feature_name_returns_400(self):
        """ Test that update flag rules with Unknown Feature Name, Returns 400. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST', [])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET', set([]))
        with feature_list_ctx, feature_set_ctx:
            response = self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': 'test_feature_1',
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                },
                csrf_token=csrf_token,
                expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Unknown feature flag: test_feature_1.')

        self.logout()

    def test_update_flag_rules_with_feature_name_of_non_string_type_returns_400(
            self):
        """ Test that update flag rules with Feature Name of a Non-String Data Type, Return 400. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_feature_flag_rules',
                'feature_name': 123,
                'new_rules': [],
                'commit_message': 'test update feature',
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'feature_name should be string, received \'123\'.')

        self.logout()

    def test_update_flag_rules_with_message_of_non_string_type_returns_400(
            self):
        """ Test that update flag rules with Message of Non-String Data Type, Return 400. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_feature_flag_rules',
                'feature_name': 'feature_name',
                'new_rules': [],
                'commit_message': 123,
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'commit_message should be string, received \'123\'.')

        self.logout()

    def test_update_flag_rules_with_rules_of_non_list_type_returns_400(self):
        """ Test that update flag rules with Non-List Data Type, Return 400. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_feature_flag_rules',
                'feature_name': 'feature_name',
                'new_rules': {},
                'commit_message': 'test update feature',
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'new_rules should be a list of dicts, received \'{}\'.')

        self.logout()

    def test_update_flag_rules_with_rules_of_non_list_of_dict_type_returns_400(
            self):
        """ Test that update flag rules with Non-List of Dictionary Data Type, Return 400. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_feature_flag_rules',
                'feature_name': 'feature_name',
                'new_rules': [1, 2],
                'commit_message': 'test update feature',
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'new_rules should be a list of dicts, received \'[1, 2]\'.')

        self.logout()

    def test_update_flag_rules_with_unexpected_exception_returns_500(self):
        """ Test that update flag rules with Unexpected Exceptions, Return 500. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            'test_feature_1', 'feature for test.', 'dev')
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'server_mode',
                        'conditions': [['=', 'dev']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST', [feature.name])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        # Replace the stored instance with None in order to trigger unexpected
        # exception during update.
        platform_parameter_registry.Registry.parameter_registry[
            feature.name] = None
        with feature_list_ctx, feature_set_ctx:
            response = self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': feature.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update feature',
                },
                csrf_token=csrf_token,
                expected_status_int=500
            )
            self.assertEqual(
                response['error'],
                '\'NoneType\' object has no attribute \'serialize\'')

        platform_parameter_registry.Registry.parameter_registry.pop(
            feature.name)
        self.logout()


class GenerateDummyExplorationsTest(test_utils.GenericTestBase):
    """Test the conditions for generation of dummy explorations."""

    def setUp(self):
        super(GenerateDummyExplorationsTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

    def test_generate_count_greater_than_publish_count(self):
        """ Test that Generate Count that Greater than Publish Count. """
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
        """ Test that Generate Count that Equal to Publish Count. """
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
        """ Test that Generate Count that Less than Publish Count. """
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
        """ Test that Raises an Error with Non-Integer, Dummy Explorations to Generate. """
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
        """ Test that Raises an Error with Non-Integer, Dummy Explorations to Publish. """
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
        """ Test that Generate Dummy Explorations in Production Mode. """
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
        """View tests and Update roles of the User."""
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
        """Test Invalid Username in filter criterion and update role of the user."""
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
        """ Test that View Role with Invalid View Filter criteria. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'invalid', 'username': 'user1'},
            expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid filter criterion to view roles.')

    def test_changing_user_role_from_topic_manager_to_moderator(self):
        """ Test that Chnage User Rolefrom Topic Manager to Moderator. """
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
        """ Test that Chnage Role with from Exploration Editor to Topic Manager. """
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, user_id, name='Name',
            abbreviated_name='abbrev', url_fragment='url-fragment',
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

    def test_handler_when_exp_version_is_not_int_throws_exception(self):
        """ Test that Handles when Exploration Version is Non-Integer, Throws Exceptions. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        # Test that it returns all answers when 'num_answers' is 0.
        payload = {
            'exp_id': self.EXP_ID,
            'exp_version': 'a',
            'state_name': self.exploration.init_state_name,
            'num_answers': 0
        }

        response = self.get_json(
            '/explorationdataextractionhandler',
            params=payload,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'], 'Version a cannot be converted to int.')

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
        """ Test that Raises Error when Exploration ID is Invalid. """
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
        """ Test that Raises Error when Exploration Version is Invalid. """
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
            'Welcome', [], [], 2)[0]
        self.assertEqual(result_explorations, ['0'])
        collection_services.load_demo('0')
        result_collections = search_services.search_collections(
            'Welcome', [], [], 2)[0]
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
            'Welcome', [], [], 2)[0]
        self.assertEqual(result_explorations, [])
        result_collections = search_services.search_collections(
            'Welcome', [], [], 2)[0]
        self.assertEqual(result_collections, [])


class SendDummyMailTest(test_utils.GenericTestBase):
    """"Tests for sending test mails to admin."""

    def setUp(self):
        """Setup the the Sender for Dummy Mail Tests."""
        super(SendDummyMailTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

    def test_send_dummy_mail(self):
        """Test & Send Dummy Mail."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            generated_response = self.post_json(
                '/senddummymailtoadminhandler', {},
                csrf_token=csrf_token, expected_status_int=200)
            self.assertEqual(generated_response, {})

        with self.swap(feconf, 'CAN_SEND_EMAILS', False):
            generated_response = self.post_json(
                '/senddummymailtoadminhandler', {},
                csrf_token=csrf_token, expected_status_int=400)
            self.assertEqual(
                generated_response['error'], 'This app cannot send emails.')


class UpdateUsernameHandlerTest(test_utils.GenericTestBase):
    """Tests for updating usernames."""

    OLD_USERNAME = 'oldUsername'
    NEW_USERNAME = 'newUsername'

    def setUp(self):
        """Setup the utility for updating Username Handle Test."""
        super(UpdateUsernameHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.OLD_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

    def test_update_username_with_none_new_username(self):
        """Test the update of username with new username."""
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': None},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Invalid request: A new username must be '
            'specified.')

    def test_update_username_with_none_old_username(self):
        """Test the update of username with old username."""
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': None,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Invalid request: The old username must be '
            'specified.')

    def test_update_username_with_non_string_new_username(self):
        """Test the update of username with non-string new username."""
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': 123},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Expected new username to be a unicode '
            'string, received 123')

    def test_update_username_with_non_string_old_username(self):
        """Test the update of username with non-string old username."""
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': 123,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Expected old username to be a unicode '
            'string, received 123')

    def test_update_username_with_long_new_username(self):
        """Test the update of username with long new username."""
        long_username = 'a' * (constants.MAX_USERNAME_LENGTH + 1)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
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
        """Test the update of username with Non-Existant old username."""
        non_existent_username = 'invalid'
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': non_existent_username,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(response['error'], 'Invalid username: invalid')

    def test_update_username_with_new_username_already_taken(self):
        """Test the update of username with new username, that is already taken."""
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': self.OLD_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(response['error'], 'Username already taken.')

    def test_update_username(self):
        """Test Updation of Username."""
        user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token)
        self.assertEqual(user_services.get_username(user_id), self.NEW_USERNAME)

    def test_update_username_creates_audit_model(self):
        """Test Update Username Creates Audit Model."""
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
                {
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


class AddContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to add reviewers for contributor's
    suggestion/application.
    """

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        """Setup of Adding Contribution Rights Handlers."""
        super(AddContributionRightsHandlerTest, self).setUp()
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
        """ Test that Add Reviewer with Invalid Username, raises error. """
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'invalid',
                'category': 'translation',
                'language_code': 'en'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_add_translation_reviewer(self):
        """Test Add Translation Reviewer."""
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_add_translation_reviewer_in_invalid_language_raise_error(self):
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_assigning_same_language_for_translation_review_raise_error(self):
        """Test Assigning Same Language for Translation review raise error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'translator',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User translator already has rights to review translation in '
            'language code hi')

    def test_add_voiceover_reviewer(self):
        """Test Add Voiceover Reviewer."""
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_voiceover_applications(
            self.voiceover_reviewer_id, language_code='hi'))

    def test_add_voiceover_reviewer_in_invalid_language(self):
        """Test Add VoiceOver Reviewer in Inavlid Language."""
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

    def test_assigning_same_language_for_voiceover_review_raise_error(self):
        """Test Assigning Same Language for voiceover review, raises error."""
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voiceover_reviewer_id, language_code='hi'))

        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'voiceartist',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User voiceartist already has rights to review voiceover in '
            'language code hi')

    def test_add_question_reviewer(self):
        """Test Add Question Reviewer."""
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_reviewer_raise_error(self):
        """Test Assigning Same user as question reviewer, raises error."""
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to review question.')

    def test_add_question_submitter(self):
        """Test add Question Submitter."""
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'submit_question'
            }, csrf_token=csrf_token)

        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_assigning_same_user_as_question_submitter_raise_error(self):
        """Test Assigning Same User as Question Submitter, raises error."""
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'submit_question'
            }, csrf_token=csrf_token)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'submit_question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'User question already has rights to submit question.')

    def test_add_reviewer_for_invalid_category_raise_error(self):
        """Test Add Reviewer for Invalid Category, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            '/addcontributionrightshandler', {
                'username': 'question',
                'category': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid category: invalid')


class RemoveContributionRightsHandlerTest(test_utils.GenericTestBase):
    """Tests related to remove reviewers from contributor dashboard page."""

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        """Test Setup Remove Contribution Rights Handler."""
        super(RemoveContributionRightsHandlerTest, self).setUp()
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
        """Test Add Reviewer without username, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'removal_type': 'all'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(response['error'], 'Missing username param')

    def test_add_reviewer_with_invalid_username_raise_error(self):
        """Test add reviewer with invalid username, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'invalid',
                'removal_type': 'all'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid username: invalid')

    def test_remove_translation_reviewer(self):
        """Test Remove translation reviewer."""
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
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_translation_suggestions(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_translation_reviewer_in_invalid_language_raise_error(self):
        """Test Remove translation reviewer in invalid langauge, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'category': 'translation',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_remove_unassigned_translation_reviewer_raise_error(self):
        """Test Remove unassigned translation reviewer, raises error."""
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'translator',
                'removal_type': 'specific',
                'category': 'translation',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'translator does not have rights to review translation in language '
            'hi.')

    def test_remove_voiceover_reviewer(self):
        """Test Remove voiceover reviewer."""
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
            '/removecontributionrightshandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_voiceover_applications(
            self.translation_reviewer_id, language_code='hi'))

    def test_remove_voiceover_reviewer_in_invalid_language_raise_error(self):
        """Test Remove voiceover reviewer in invalid language, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'category': 'voiceover',
                'language_code': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid language_code: invalid')

    def test_remove_unassigned_voiceover_reviewer_raise_error(self):
        """Test Remove unassigned voiceover reviewer, raises error."""
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translation_reviewer_id, language_code='hi'))
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'voiceartist',
                'removal_type': 'specific',
                'category': 'voiceover',
                'language_code': 'hi'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'voiceartist does not have rights to review voiceover in language '
            'hi.')

    def test_remove_question_reviewer(self):
        """Test remove question reviewer."""
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'question'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_reviewer_raise_error(self):
        """Test removing unassigned question reviewer, raises error."""
        self.assertFalse(user_services.can_review_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to review question.')

    def test_remove_question_submitter(self):
        """Test Remove question submitter."""
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        self.assertTrue(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'submit_question'
            }, csrf_token=csrf_token)

        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

    def test_removing_unassigned_question_submitter_raise_error(self):
        """Test Removing unassigned question submitter raise error."""
        self.assertFalse(user_services.can_submit_question_suggestions(
            self.question_reviewer_id))

        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'submit_question'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'],
            'question does not have rights to submit question.')

    def test_remove_reviewer_for_invalid_category_raise_error(self):
        """Test to Remove reviewer for invalid category, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'specific',
                'category': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid category: invalid')

    def test_remove_reviewer_for_invalid_removal_type_raise_error(self):
        """Test Remove reviewer for invalid removal type, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/removecontributionrightshandler', {
                'username': 'question',
                'removal_type': 'invalid'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Invalid removal_type: invalid')

    def test_remove_reviewer_from_all_reviewable_items(self):
        """Test Remove Reviewer from all reviewable items."""
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
            '/removecontributionrightshandler', {
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


class ContributorUsersListHandlerTest(test_utils.GenericTestBase):
    """Tests ContributorUsersListHandler."""

    TRANSLATION_REVIEWER_EMAIL = 'translationreviewer@example.com'
    VOICEOVER_REVIEWER_EMAIL = 'voiceoverreviewer@example.com'
    QUESTION_REVIEWER_EMAIL = 'questionreviewer@example.com'

    def setUp(self):
        """Setting Up for Contributor users list handler test."""
        super(ContributorUsersListHandlerTest, self).setUp()
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

    def test_check_contribution_reviewer_by_translation_reviewer_role(self):
        """Test Check contribution reviewer by translation reviewer role."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_review_translation_in_language(
            self.translation_reviewer_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.voiceover_reviewer_id, 'hi')
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'translation',
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('translator' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contribution_reviewer_by_voiceover_reviewer_role(self):
        """Test Check contribution reviewer by voiceover reviewer role."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_review_voiceover_in_language(
            self.translation_reviewer_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.voiceover_reviewer_id, 'hi')
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'voiceover',
                'language_code': 'hi'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('translator' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contribution_reviewer_by_question_reviewer_role(self):
        """Test Check contribution reviewer by question reviewer role."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        user_services.allow_user_to_review_question(self.voiceover_reviewer_id)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'question'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('question' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contributor_user_by_question_submitter_role(self):
        """Test Check contributor user by question submitter role."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        user_services.allow_user_to_submit_question(self.question_reviewer_id)
        user_services.allow_user_to_submit_question(self.voiceover_reviewer_id)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'submit_question'
            })

        self.assertEqual(len(response['usernames']), 2)
        self.assertTrue('question' in response['usernames'])
        self.assertTrue('voiceartist' in response['usernames'])

    def test_check_contribution_reviewer_with_invalid_language_code_raise_error(
            self):
        """Test check contribution reviewer with invalid language code, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'voiceover',
                'language_code': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid language_code: invalid')
        self.logout()

    def test_check_contribution_reviewer_with_invalid_category_raise_error(
            self):
        """Test Check contribution reviewer with invalid category, raises error."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/getcontributorusershandler', params={
                'category': 'invalid',
                'language_code': 'hi'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid category: invalid')
        self.logout()


class ContributionRightsDataHandlerTest(test_utils.GenericTestBase):
    """Tests ContributionRightsDataHandler."""

    REVIEWER_EMAIL = 'reviewer@example.com'

    def setUp(self):
        """Test Setup for contribution rights data handler test."""
        super(ContributionRightsDataHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')

        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

    def test_check_contribution_reviewer_rights(self):
        """Test Check contribution reviewer rights."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response['can_review_translation_for_language_codes'], [])
        self.assertEqual(
            response['can_review_voiceover_for_language_codes'], [])
        self.assertEqual(response['can_review_questions'], False)
        self.assertEqual(response['can_submit_questions'], False)

        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.reviewer_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_id)
        user_services.allow_user_to_submit_question(self.reviewer_id)

        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'reviewer'
            })
        self.assertEqual(
            response['can_review_translation_for_language_codes'], ['hi'])
        self.assertEqual(
            response['can_review_voiceover_for_language_codes'], ['hi'])
        self.assertEqual(response['can_review_questions'], True)
        self.assertEqual(response['can_submit_questions'], True)

    def test_check_contribution_reviewer_rights_invalid_username(self):
        """Test Check contribution reviewer rights invalid username."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/contributionrightsdatahandler', params={
                'username': 'invalid'
            }, expected_status_int=400)

        self.assertEqual(response['error'], 'Invalid username: invalid')
        self.logout()

    def test_check_contribution_reviewer_rights_without_username(self):
        """Test check contribution reviewer rights without username."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/contributionrightsdatahandler', params={},
            expected_status_int=400)

        self.assertEqual(response['error'], 'Missing username param')
        self.logout()


class MemoryCacheAdminHandlerTest(test_utils.GenericTestBase):
    """Tests MemoryCacheAdminHandler."""

    def setUp(self):
        """Test Setup Memory Cache Admin Handler."""
        super(MemoryCacheAdminHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

    def test_get_memory_cache_data(self):
        """Test get memory cache data."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            '/memorycacheadminhandler')
        self.assertEqual(
            response['total_allocation'], 0)
        self.assertEqual(
            response['peak_allocation'], 0)
        self.assertEqual(response['total_keys_stored'], 1)

    def test_flush_memory_cache(self):
        """Test Flush Memory Cache."""
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        response = self.get_json(
            '/memorycacheadminhandler')
        self.assertEqual(response['total_keys_stored'], 1)

        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/memorycacheadminhandler', {}, csrf_token=csrf_token)

        response = self.get_json(
            '/memorycacheadminhandler')
        self.assertEqual(response['total_keys_stored'], 0)


class NumberOfDeletionRequestsHandlerTest(test_utils.GenericTestBase):
    """Tests NumberOfDeletionRequestsHandler."""

    def setUp(self):
        """Test Setup Number of Deletion Requests Handler Test."""
        super(NumberOfDeletionRequestsHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

    def test_get_with_no_deletion_request_returns_zero(self):
        """Test get with no deletion request, returns zero."""
        response = self.get_json('/numberofdeletionrequestshandler')
        self.assertEqual(response['number_of_pending_deletion_models'], 0)

    def test_get_with_two_deletion_request_returns_two(self):
        """Test get with two deletion request, return two."""
        user_models.PendingDeletionRequestModel(
            id='id1', email='id1@email.com', role='role'
        ).put()
        user_models.PendingDeletionRequestModel(
            id='id2', email='id2@email.com', role='role'
        ).put()

        response = self.get_json('/numberofdeletionrequestshandler')
        self.assertEqual(response['number_of_pending_deletion_models'], 2)


class VerifyUserModelsDeletedHandlerTest(test_utils.GenericTestBase):
    """Tests VerifyUserModelsDeletedHandler."""

    def setUp(self):
        """test setup for verify user models deleted handler."""
        super(VerifyUserModelsDeletedHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.admin_user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_get_without_user_id_raises_error(self):
        """test get witrhout user id, raises error."""
        self.get_json(
            '/verifyusermodelsdeletedhandler', expected_status_int=400)

    def test_get_with_nonexistent_user_id_returns_true(self):
        """test get with nonexistent user id, returns true."""
        response = self.get_json(
            '/verifyusermodelsdeletedhandler', params={'user_id': 'aaa'})
        self.assertFalse(response['related_models_exist'])

    def test_get_with_existing_user_id_returns_true(self):
        """test get with existing user id, returns true."""
        response = self.get_json(
            '/verifyusermodelsdeletedhandler',
            params={'user_id': self.admin_user_id}
        )
        self.assertTrue(response['related_models_exist'])


class DeleteUserHandlerTest(test_utils.GenericTestBase):
    """Tests DeleteUserHandler."""

    def setUp(self):
        """test setup for delete user handler test."""
        super(DeleteUserHandlerTest, self).setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        self.admin_user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_delete_without_user_id_raises_error(self):
        """test delete without user id, raises error."""
        self.delete_json(
            '/deleteuserhandler',
            params={'username': 'someusername'},
            expected_status_int=400)

    def test_delete_without_username_raises_error(self):
        """test delete without username, raises error."""
        self.delete_json(
            '/deleteuserhandler',
            params={'user_id': 'aa'},
            expected_status_int=400)

    def test_delete_with_wrong_username_raises_error(self):
        """test delete with wrong username, raises error."""
        self.delete_json(
            '/deleteuserhandler',
            params={
                'username': 'someusername',
                'user_id': 'aa'
            },
            expected_status_int=400)

    def test_delete_with_differing_user_id_and_username_raises_error(self):
        """test delete with differing user id and username, raises error."""
        self.delete_json(
            '/deleteuserhandler',
            params={
                'username': self.NEW_USER_USERNAME,
                'user_id': self.admin_user_id
            },
            expected_status_int=400)

    def test_delete_with_correct_user_id_andusername_returns_true(self):
        """test delete with correct user id and username, returns true."""
        response = self.delete_json(
            '/deleteuserhandler',
            params={
                'username': self.NEW_USER_USERNAME,
                'user_id': self.new_user_id
            })
        self.assertTrue(response['success'])
        self.assertIsNotNone(
            wipeout_service.get_pending_deletion_request(self.new_user_id))
