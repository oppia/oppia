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

from __future__ import annotations

import datetime
import enum
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.domain import blog_services
from core.domain import classroom_config_services
from core.domain import collection_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import platform_feature_services
from core.domain import platform_parameter_domain
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
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.platform.auth import firebase_auth_services
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import audit_models
    from mypy_imports import blog_models
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import user_models

(
    audit_models, blog_models, exp_models, opportunity_models,
    user_models
) = models.Registry.import_models([
    models.Names.AUDIT, models.Names.BLOG, models.Names.EXPLORATION,
    models.Names.OPPORTUNITY, models.Names.USER
])

BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'
BOTH_MODERATOR_AND_ADMIN_USERNAME = 'moderatorandadm1n'


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    TEST_FEATURE_1 = 'test_feature_1'


FeatureStages = platform_parameter_domain.FeatureStages


class AdminIntegrationTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def setUp(self) -> None:
        """Complete the signup process for self.CURRICULUM_ADMIN_EMAIL."""
        super().setUp()
        self.signup(feconf.ADMIN_EMAIL_ADDRESS, 'testsuper')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.prod_mode_swap = self.swap(constants, 'DEV_MODE', False)

    def test_admin_page_rights(self) -> None:
        """Test access rights to the admin page."""

        self.get_html_response('/admin', expected_status_int=302)

        # Login as a non-admin.
        self.login(self.EDITOR_EMAIL)
        self.get_html_response('/admin', expected_status_int=401)
        self.logout()

        # Login as an admin.
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.get_html_response('/admin')
        self.logout()

    def test_promo_bar_configuration_not_present_to_admin(self) -> None:
        """Test that promo bar configuration is not presentd in admin page."""
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json('/adminhandler')
        response_config_properties = response_dict['config_properties']

        self.assertIn(
            'featured_translation_languages', response_config_properties)

        self.assertNotIn('promo_bar_enabled', response_config_properties)
        self.assertNotIn('promo_bar_message', response_config_properties)

    def test_change_configuration_property(self) -> None:
        """Test that configuration properties can be changed."""

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_cannot_reload_exploration_in_production_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot reload an exploration in production.')
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_exploration',
                    'exploration_id': '3'
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_exp_id_reload_exp_action_is_not_performed(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'exploration_id\' must be provided when the action '
            'is reload_exploration.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_exploration',
                    'exploration_id': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_collection_id_reload_collection_action_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'collection_id\' must be provided when the action '
            'is reload_collection.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_collection',
                    'collection_id': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_num_dummy_exps_generate_dummy_exp_action_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'num_dummy_exps_to_generate\' must be provided when the '
            'action is generate_dummy_explorations.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_explorations',
                    'num_dummy_exps_to_generate': None,
                    'num_dummy_exps_to_publish': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_num_dummy_exps_to_publish_action_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'num_dummy_exps_to_publish\' must be provided when the '
            'action is generate_dummy_explorations.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_explorations',
                    'num_dummy_exps_to_generate': 5,
                    'num_dummy_exps_to_publish': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_new_config_property_values_action_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'new_config_property_values\' must be provided when the '
            'action is save_config_properties.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'save_config_properties',
                    'new_config_property_values': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_config_property_id_action_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'config_property_id\' must be provided when the action '
            'is revert_config_property.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'revert_config_property',
                    'config_property_id': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_data_action_upload_topic_similarities_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'data\' must be provided when the action is '
            'upload_topic_similarities.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'upload_topic_similarities',
                    'data': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_topic_id_action_regenerate_topic_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'topic_id\' must be provided when the action is '
            'regenerate_topic_related_opportunities.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'regenerate_topic_related_opportunities',
                    'topic_id': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_exp_id_action_rollback_exploration_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'exp_id\' must be provided when the action is '
            'rollback_exploration_to_safe_state.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'rollback_exploration_to_safe_state',
                    'exp_id': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_feature_name_action_update_feature_flag_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'feature_name\' must be provided when the action is '
            'update_feature_flag_rules.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_new_rules_action_update_feature_flag_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'new_rules\' must be provided when the action is '
            'update_feature_flag_rules.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': 'new_feature',
                    'new_rules': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_commit_message_action_update_feature_flag_is_not_performed(
        self
    ) -> None:
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

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'commit_message\' must be provided when the action is '
            'update_feature_flag_rules.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_feature_flag_rules',
                    'feature_name': 'new_feature',
                    'new_rules': new_rule_dicts,
                    'commit_message': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_cannot_load_new_structures_data_in_production_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_structures_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_non_admins_cannot_load_new_structures_data(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        assert_raises_regexp = self.assertRaisesRegex(
            Exception, 'User does not have enough rights to generate data.')
        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_structures_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_cannot_generate_dummy_skill_data_in_production_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot generate dummy skills in production.')
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_skill_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_cannot_generate_classroom_data_in_production_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot generate dummy classroom in production.')
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_classroom'
                }, csrf_token=csrf_token)
        self.logout()

    def test_non_admins_cannot_generate_dummy_skill_data(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        assert_raises_regexp = self.assertRaisesRegex(
            Exception, 'User does not have enough rights to generate data.')
        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_new_skill_data'
                }, csrf_token=csrf_token)
        self.logout()

    def test_non_admins_cannot_generate_dummy_classroom_data(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        assert_raises_regexp = self.assertRaisesRegex(
            Exception, 'User does not have enough rights to generate data.')
        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_classroom'
                }, csrf_token=csrf_token)
        self.logout()

    def test_cannot_reload_collection_in_production_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot reload a collection in production.')
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'reload_collection',
                    'collection_id': '2'
                }, csrf_token=csrf_token)

        self.logout()

    def test_reload_collection(self) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_load_new_structures_data(self) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
        questions, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                10, [
                    skill_summaries[0].id, skill_summaries[1].id,
                    skill_summaries[2].id], 0)
        )
        self.assertEqual(len(questions), 3)
        # Testing that there are 3 hindi translation opportunities
        # available on the Contributor Dashboard. Hindi was picked arbitrarily,
        # any language code other than english (what the dummy explorations
        # were written in) can be tested here.
        translation_opportunities, _, _ = (
            opportunity_services.get_translation_opportunities('hi', '', None))
        self.assertEqual(len(translation_opportunities), 3)
        self.logout()

    def test_generate_dummy_skill_and_questions_data(self) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_new_skill_data'
            }, csrf_token=csrf_token)
        skill_summaries = skill_services.get_all_skill_summaries()
        self.assertEqual(len(skill_summaries), 1)
        questions, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                20, [skill_summaries[0].id], 0)
        )
        self.assertEqual(len(questions), 15)
        self.logout()

    def test_generate_dummy_classroom_data(self) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_classroom'
            }, csrf_token=csrf_token)
        classrooms = classroom_config_services.get_all_classrooms()
        self.assertEqual(len(classrooms), 2)
        self.logout()

    def test_regenerate_topic_related_opportunities_action(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        topic_id = 'topic'
        story_id = 'story'
        self.save_new_valid_exploration(
            '0', owner_id, title='title', end_state_name='End State',
            correctness_feedback_enabled=True)
        self.publish_exploration(owner_id, '0')

        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
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

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_rollback_exploration_to_safe_state_action(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.save_new_valid_exploration(
            '0', owner_id, title='title', end_state_name='End State',
            correctness_feedback_enabled=True)
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 4')

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        result = self.post_json(
            '/adminhandler', {
                'action': 'rollback_exploration_to_safe_state',
                'exp_id': '0'
            }, csrf_token=csrf_token)

        self.assertEqual(
            result, {
                'version': 5
            })

        snapshot_content_model = (
            exp_models.ExplorationSnapshotContentModel.get(
                '0-5', strict=True))
        snapshot_content_model.delete()
        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                '0-4', strict=True))
        snapshot_metadata_model.delete()

        result = self.post_json(
            '/adminhandler', {
                'action': 'rollback_exploration_to_safe_state',
                'exp_id': '0'
            }, csrf_token=csrf_token)

        self.assertEqual(
            result, {
                'version': 3
            })

    def test_admin_topics_csv_download_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        response = self.get_custom_response(
            '/admintopicscsvdownloadhandler', 'text/csv')

        self.assertEqual(
            response.headers['Content-Disposition'],
            'attachment; filename=topic_similarities.csv')

        self.assertIn(
            b'Architecture,Art,Biology,Business,Chemistry,Computing,Economics,'
            b'Education,Engineering,Environment,Geography,Government,Hobbies,'
            b'Languages,Law,Life Skills,Mathematics,Medicine,Music,Philosophy,'
            b'Physics,Programming,Psychology,Puzzles,Reading,Religion,Sport,'
            b'Statistics,Welcome',
            response.body)

        self.logout()

    def test_revert_config_property(self) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_upload_topic_similarities(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_get_handler_includes_all_feature_flags(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)

        feature_list_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_LIST',
            [ParamNames.TEST_FEATURE_1])
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

    def test_post_with_flag_changes_updates_feature_flags(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)
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
            platform_feature_services, 'ALL_FEATURES_LIST',
            [ParamNames.TEST_FEATURE_1])
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

    def test_post_flag_changes_correctly_updates_flags_returned_by_getter(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)
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
            platform_feature_services, 'ALL_FEATURES_LIST',
            [ParamNames.TEST_FEATURE_1])
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

    def test_update_flag_rules_with_invalid_rules_returns_400(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)
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
            platform_feature_services, 'ALL_FEATURES_LIST',
            [ParamNames.TEST_FEATURE_1])
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

    def test_update_flag_rules_with_unknown_feature_name_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
        error_msg = (
            'Schema validation for \'feature_name\' failed: Expected '
            'string, received 123')
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_flag_rules_with_message_of_non_string_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
        error_msg = (
            'Schema validation for \'commit_message\' failed: Expected '
            'string, received 123')
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_flag_rules_with_rules_of_non_list_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
        error_msg = (
            'Schema validation for \'new_rules\' failed: Expected list, '
            'received {}')
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_flag_rules_with_rules_of_non_list_of_dict_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        error_msg = (
            'Schema validation for \'new_rules\' failed: \'int\' '
            'object is not subscriptable')
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
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_flag_rules_with_unexpected_exception_returns_500(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        feature = platform_parameter_registry.Registry.create_feature_flag(
            ParamNames.TEST_FEATURE_1, 'feature for test.', FeatureStages.DEV)
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
            platform_feature_services, 'ALL_FEATURES_LIST',
            [ParamNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            platform_feature_services, 'ALL_FEATURES_NAMES_SET',
            set([feature.name]))
        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        platform_parameter_registry.Registry.parameter_registry[
            feature.name] = None  # type: ignore[assignment]
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

    def test_grant_super_admin_privileges(self) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        grant_super_admin_privileges_stub = self.swap_with_call_counter(
            firebase_auth_services, 'grant_super_admin_privileges')

        with grant_super_admin_privileges_stub as call_counter:
            response = self.put_json(
                '/adminsuperadminhandler',
                {'username': self.CURRICULUM_ADMIN_USERNAME},
                csrf_token=self.get_new_csrf_token(),
                expected_status_int=200)

        self.assertEqual(call_counter.times_called, 1)
        self.assertNotIn('error', response)

    def test_grant_super_admin_privileges_requires_system_default_admin(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        grant_super_admin_privileges_stub = self.swap_with_call_counter(
            firebase_auth_services, 'grant_super_admin_privileges')

        with grant_super_admin_privileges_stub as call_counter:
            response = self.put_json(
                '/adminsuperadminhandler',
                {'username': self.CURRICULUM_ADMIN_USERNAME},
                csrf_token=self.get_new_csrf_token(),
                expected_status_int=401)

        self.assertEqual(call_counter.times_called, 0)
        self.assertEqual(
            response['error'],
            'Only the default system admin can manage super admins')

    def test_grant_super_admin_privileges_fails_without_username(self) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        response = self.put_json(
            '/adminsuperadminhandler', {}, csrf_token=self.get_new_csrf_token(),
            expected_status_int=400)

        error_msg = 'Missing key in handler args: username.'
        self.assertEqual(response['error'], error_msg)

    def test_grant_super_admin_privileges_fails_with_invalid_username(
        self
    ) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        response = self.put_json(
            '/adminsuperadminhandler', {'username': 'fakeusername'},
            csrf_token=self.get_new_csrf_token(), expected_status_int=400)

        self.assertEqual(response['error'], 'No such user exists')

    def test_revoke_super_admin_privileges(self) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        revoke_super_admin_privileges_stub = self.swap_with_call_counter(
            firebase_auth_services, 'revoke_super_admin_privileges')

        with revoke_super_admin_privileges_stub as call_counter:
            response = self.delete_json(
                '/adminsuperadminhandler',
                params={'username': self.CURRICULUM_ADMIN_USERNAME},
                expected_status_int=200)

        self.assertEqual(call_counter.times_called, 1)
        self.assertNotIn('error', response)

    def test_revoke_super_admin_privileges_requires_system_default_admin(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        revoke_super_admin_privileges_stub = self.swap_with_call_counter(
            firebase_auth_services, 'revoke_super_admin_privileges')

        with revoke_super_admin_privileges_stub as call_counter:
            response = self.delete_json(
                '/adminsuperadminhandler',
                params={'username': self.CURRICULUM_ADMIN_USERNAME},
                expected_status_int=401)

        self.assertEqual(call_counter.times_called, 0)
        self.assertEqual(
            response['error'],
            'Only the default system admin can manage super admins')

    def test_revoke_super_admin_privileges_fails_without_username(self) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        response = self.delete_json(
            '/adminsuperadminhandler', params={}, expected_status_int=400)

        error_msg = 'Missing key in handler args: username.'
        self.assertEqual(response['error'], error_msg)

    def test_revoke_super_admin_privileges_fails_with_invalid_username(
        self
    ) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        response = self.delete_json(
            '/adminsuperadminhandler',
            params={'username': 'fakeusername'}, expected_status_int=400)

        self.assertEqual(response['error'], 'No such user exists')

    def test_revoke_super_admin_privileges_fails_for_default_admin(
        self
    ) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        response = self.delete_json(
            '/adminsuperadminhandler', params={'username': 'testsuper'},
            expected_status_int=400)

        self.assertEqual(
            response['error'],
            'Cannot revoke privileges from the default super admin account')


class GenerateDummyExplorationsTest(test_utils.GenericTestBase):
    """Test the conditions for generation of dummy explorations."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

    def test_generate_count_greater_than_publish_count(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_generate_count_equal_to_publish_count(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_generate_count_less_than_publish_count(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_handler_raises_error_with_non_int_num_dummy_exps_to_generate(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_explorations',
                'num_dummy_exps_to_publish': 1,
                'num_dummy_exps_to_generate': 'invalid_type'
            }, csrf_token=csrf_token, expected_status_int=400)

        error_msg = (
            'Schema validation for \'num_dummy_exps_to_generate\' failed: '
            'Could not convert str to int: invalid_type')
        self.assertEqual(response['error'], error_msg)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_handler_raises_error_with_non_int_num_dummy_exps_to_publish(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_explorations',
                'num_dummy_exps_to_publish': 'invalid_type',
                'num_dummy_exps_to_generate': 1
            }, csrf_token=csrf_token, expected_status_int=400)

        error_msg = (
            'Schema validation for \'num_dummy_exps_to_publish\' failed: '
            'Could not convert str to int: invalid_type')
        self.assertEqual(response['error'], error_msg)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_cannot_generate_dummy_explorations_in_prod_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
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

    def setUp(self) -> None:
        """Complete the signup process for self.CURRICULUM_ADMIN_EMAIL."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

    def test_view_and_update_role(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        # Check normal user has expected roles. Viewing by username.
        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': 'user1'})
        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': []
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
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
        self.assertEqual(response_dict, {
            'usernames': ['user1']
        })
        self.logout()

    def test_if_filter_criterion_is_username_and_username_is_not_provided(
        self
    ) -> None:

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        with self.assertRaisesRegex(
            Exception,
            'The username must be provided when the filter criterion '
            'is \'username\'.'
        ):
            self.get_json(
                feconf.ADMIN_ROLE_HANDLER_URL,
                params={'filter_criterion': 'username'}
            )

    def test_if_filter_criterion_is_role_and_role_is_not_provided(
        self
    ) -> None:

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        with self.assertRaisesRegex(
            Exception,
            'The role must be provided when the filter criterion is \'role\'.'
        ):
            self.get_json(
                feconf.ADMIN_ROLE_HANDLER_URL,
                params={'filter_criterion': 'role'}
            )

    def test_invalid_username_in_filter_criterion_and_update_role(self) -> None:
        username = 'myinvaliduser'

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        # Trying to view role of non-existent user.
        self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username},
            expected_status_int=400)

        # Trying to update role of non-existent user.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_removing_role_with_invalid_username(self) -> None:
        username = 'invaliduser'

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response = self.delete_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'role': feconf.ROLE_ID_TOPIC_MANAGER, 'username': username},
            expected_status_int=400)

        self.assertEqual(
            response['error'], 'User with given username does not exist.')

    def test_cannot_view_role_with_invalid_view_filter_criterion(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'invalid', 'username': 'user1'},
            expected_status_int=400)
        error_msg = (
            'Schema validation for \'filter_criterion\' failed: Received '
            'invalid which is not in the allowed range of choices: '
            '[\'role\', \'username\']')
        self.assertEqual(response['error'], error_msg)

    def test_replacing_user_role_from_topic_manager_to_moderator(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)

        topic_id = topic_fetchers.get_new_topic_id()
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)
        self.set_topic_managers([username], topic_id)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_TOPIC_MANAGER],
                'banned': False,
                'managed_topic_ids': [topic_id]
            })

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'deassign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token)

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(response_dict, {
            'roles': [feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_MODERATOR],
            'banned': False,
            'managed_topic_ids': []
        })

        self.logout()

    def test_removing_moderator_role_from_user_roles(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_MODERATOR],
                'banned': False,
                'managed_topic_ids': []
            })

        self.delete_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            expected_status_int=200)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': []
            })
        self.logout()

    def test_general_role_handler_does_not_support_assigning_topic_manager(
        self
    ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            feconf.ADMIN_ROLE_HANDLER_URL, {
                'role': feconf.ROLE_ID_TOPIC_MANAGER,
                'username': username
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'Unsupported role for this handler.')

    def test_general_role_handler_supports_unassigning_topic_manager(
        self
    ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', url_fragment='url-fragment',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_TOPIC_MANAGER],
                'banned': False,
                'managed_topic_ids': [topic_id]
            })

        self.delete_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'username': username, 'role': feconf.ROLE_ID_TOPIC_MANAGER})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': []
            })


class TopicManagerRoleHandlerTest(test_utils.GenericTestBase):
    """Tests for TopicManagerRoleHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL)

    def test_handler_with_invalid_username(self) -> None:
        username = 'invaliduser'
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', url_fragment='url-fragment',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response = self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response['error'], 'User with given username does not exist.')

    def test_adding_topic_manager_role_to_user(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)

        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', url_fragment='url-fragment',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': []
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_TOPIC_MANAGER],
                'banned': False,
                'managed_topic_ids': [topic_id]
            })
        self.logout()

    def test_adding_new_topic_manager_to_a_topic(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)

        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', url_fragment='url-fragment',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_TOPIC_MANAGER],
                'banned': False,
                'managed_topic_ids': [topic_id]
            })

        new_topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            new_topic_id, self.admin_id, name='New topic',
            abbreviated_name='new-abbrev', url_fragment='new-url-fragment',
            description='New description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': new_topic_id
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertFalse(response_dict['banned'])
        self.assertItemsEqual(
            response_dict['roles'],
            [feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_TOPIC_MANAGER])
        self.assertItemsEqual(
            response_dict['managed_topic_ids'], [new_topic_id, topic_id])

        self.logout()


class BannedUsersHandlerTest(test_utils.GenericTestBase):
    """Tests for BannedUsersHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL)

    def test_mark_a_user_ban(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': []
            })

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/bannedusershandler', {
                'username': username
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [],
                'banned': True,
                'managed_topic_ids': []
            })

    def test_banning_topic_manager_should_remove_user_from_topics(
        self
    ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)

        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', url_fragment='url-fragment',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER, feconf.ROLE_ID_TOPIC_MANAGER],
                'banned': False,
                'managed_topic_ids': [topic_id]
            })

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/bannedusershandler', {
                'username': username
            }, csrf_token=csrf_token)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [],
                'banned': True,
                'managed_topic_ids': []
            })

    def test_ban_user_with_invalid_username(self) -> None:
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/bannedusershandler', {
                'username': 'invalidUsername'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertEqual(
            response_dict['error'], 'User with given username does not exist.')

    def test_unmark_a_banned_user(self) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/bannedusershandler', {
                'username': username
            }, csrf_token=csrf_token)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [],
                'banned': True,
                'managed_topic_ids': []
            })

        self.delete_json('/bannedusershandler', params={'username': username})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': []
            })

    def test_unban_user_with_invalid_username(self) -> None:
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        response_dict = self.delete_json(
            '/bannedusershandler',
            params={'username': 'invalidUsername'},
            expected_status_int=400)

        self.assertEqual(
            response_dict['error'], 'User with given username does not exist.')


class DataExtractionQueryHandlerTests(test_utils.GenericTestBase):
    """Tests for data extraction handler."""

    EXP_ID = 'exp'

    def setUp(self) -> None:
        """Complete the signup process for self.CURRICULUM_ADMIN_EMAIL."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
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

    def test_data_extraction_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

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

    def test_raises_error_if_no_state_answer_exists_while_data_extraction(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        payload = {
            'exp_id': self.EXP_ID,
            'exp_version': self.exploration.version,
            'state_name': self.exploration.init_state_name,
            'num_answers': 0
        }

        swap_state_answers = self.swap_to_always_return(
            stats_services, 'get_state_answers', None
        )
        with swap_state_answers:
            response = self.get_json(
                '/explorationdataextractionhandler',
                params=payload,
                expected_status_int=500
            )
        self.assertEqual(
            response['error'],
            'No state answer exists for the given exp_id: exp, '
            'exp_version: 1 and state_name: Introduction'
        )

    def test_handler_when_exp_version_is_not_int_throws_exception(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        # Test that it returns all answers when 'num_answers' is 0.
        payload = {
            'exp_id': self.EXP_ID,
            'exp_version': 'a',
            'state_name': self.exploration.init_state_name,
            'num_answers': 0
        }

        error_msg = (
            'Schema validation for \'exp_version\' failed: '
            'Could not convert str to int: a')
        response = self.get_json(
            '/explorationdataextractionhandler',
            params=payload,
            expected_status_int=400)
        self.assertEqual(response['error'], error_msg)

    def test_that_handler_raises_exception(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_handler_raises_error_with_invalid_exploration_id(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_handler_raises_error_with_invalid_exploration_version(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def test_clear_search_index(self) -> None:
        exp_services.load_demo('0')
        result_explorations = search_services.search_explorations(
            'Welcome', [], [], 2)[0]
        self.assertEqual(result_explorations, ['0'])
        collection_services.load_demo('0')
        result_collections = search_services.search_collections(
            'Welcome', [], [], 2)[0]
        self.assertEqual(result_collections, ['0'])
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        user_id_a = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL
        )
        blog_post = blog_services.create_new_blog_post(user_id_a)
        change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Welcome to Oppia',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog Authors',
            'tags': ['Math', 'Science']
        }
        blog_services.update_blog_post(blog_post.id, change_dict)
        blog_services.publish_blog_post(blog_post.id)

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
        result_blog_posts = (
            search_services.search_blog_post_summaries('Welcome', [], 2)[0]
        )
        self.assertEqual(result_blog_posts, [])


class SendDummyMailTest(test_utils.GenericTestBase):
    """"Tests for sending test mails to admin."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

    def test_send_dummy_mail(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.OLD_USERNAME)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

    def test_update_username_with_none_new_username(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': None},
            csrf_token=csrf_token,
            expected_status_int=400)
        error_msg = 'Missing key in handler args: new_username.'
        self.assertEqual(response['error'], error_msg)

    def test_update_username_with_none_old_username(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': None,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        error_msg = 'Missing key in handler args: old_username.'
        self.assertEqual(response['error'], error_msg)

    def test_update_username_with_non_string_new_username(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': 123},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            response['error'], 'Schema validation for \'new_username\' failed:'
            ' Expected string, received 123')

    def test_update_username_with_non_string_old_username(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': 123,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        error_msg = (
            'Schema validation for \'old_username\' failed: Expected'
            ' string, received 123')
        self.assertEqual(response['error'], error_msg)

    def test_update_username_with_long_new_username(self) -> None:
        long_username = 'a' * (constants.MAX_USERNAME_LENGTH + 1)
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': long_username},
            csrf_token=csrf_token,
            expected_status_int=400)
        error_msg = (
            'Schema validation for \'new_username\' failed: Validation failed'
            ': has_length_at_most ({\'max_value\': %s}) for object %s'
            % (constants.MAX_USERNAME_LENGTH, long_username))
        self.assertEqual(response['error'], error_msg)

    def test_update_username_with_nonexistent_old_username(self) -> None:
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

    def test_update_username_with_new_username_already_taken(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': self.OLD_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(response['error'], 'Username already taken.')

    def test_update_username(self) -> None:
        user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token)
        self.assertEqual(user_services.get_username(user_id), self.NEW_USERNAME)

    def test_update_username_creates_audit_model(self) -> None:
        user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
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


class NumberOfDeletionRequestsHandlerTest(test_utils.GenericTestBase):
    """Tests NumberOfDeletionRequestsHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

    def test_get_with_no_deletion_request_returns_zero(self) -> None:
        response = self.get_json('/numberofdeletionrequestshandler')
        self.assertEqual(response['number_of_pending_deletion_models'], 0)

    def test_get_with_two_deletion_request_returns_two(self) -> None:
        user_models.PendingDeletionRequestModel(
            id='id1', email='id1@email.com').put()
        user_models.PendingDeletionRequestModel(
            id='id2', email='id2@email.com').put()

        response = self.get_json('/numberofdeletionrequestshandler')
        self.assertEqual(response['number_of_pending_deletion_models'], 2)


class VerifyUserModelsDeletedHandlerTest(test_utils.GenericTestBase):
    """Tests VerifyUserModelsDeletedHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.admin_user_id = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))

    def test_get_without_user_id_raises_error(self) -> None:
        self.get_json(
            '/verifyusermodelsdeletedhandler', expected_status_int=400)

    def test_get_with_nonexistent_user_id_returns_true(self) -> None:
        response = self.get_json(
            '/verifyusermodelsdeletedhandler', params={'user_id': 'aaa'})
        self.assertFalse(response['related_models_exist'])

    def test_get_with_existing_user_id_returns_true(self) -> None:
        response = self.get_json(
            '/verifyusermodelsdeletedhandler',
            params={'user_id': self.admin_user_id}
        )
        self.assertTrue(response['related_models_exist'])


class DeleteUserHandlerTest(test_utils.GenericTestBase):
    """Tests DeleteUserHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, self.CURRICULUM_ADMIN_USERNAME)
        self.login(feconf.SYSTEM_EMAIL_ADDRESS, is_super_admin=True)
        self.admin_user_id = self.get_user_id_from_email(
            feconf.SYSTEM_EMAIL_ADDRESS)

    def test_delete_without_user_id_raises_error(self) -> None:
        self.delete_json(
            '/deleteuserhandler',
            params={'username': 'someusername'},
            expected_status_int=400)

    def test_delete_without_username_raises_error(self) -> None:
        self.delete_json(
            '/deleteuserhandler',
            params={'user_id': 'aa'},
            expected_status_int=400)

    def test_delete_with_wrong_username_raises_error(self) -> None:
        self.delete_json(
            '/deleteuserhandler',
            params={
                'username': 'someusername',
                'user_id': 'aa'
            },
            expected_status_int=400)

    def test_delete_with_differing_user_id_and_username_raises_error(
        self
    ) -> None:
        self.delete_json(
            '/deleteuserhandler',
            params={
                'username': self.NEW_USER_USERNAME,
                'user_id': self.admin_user_id
            },
            expected_status_int=400)

    def test_delete_with_correct_user_id_andusername_returns_true(
        self
    ) -> None:
        response = self.delete_json(
            '/deleteuserhandler',
            params={
                'username': self.NEW_USER_USERNAME,
                'user_id': self.new_user_id
            })
        self.assertTrue(response['success'])
        self.assertIsNotNone(
            wipeout_service.get_pending_deletion_request(self.new_user_id))


class UpdateBlogPostHandlerTest(test_utils.GenericTestBase):
    """Tests UpdateBlogPostHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(feconf.SYSTEM_EMAIL_ADDRESS, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_user_id = self.get_user_id_from_email(
            feconf.SYSTEM_EMAIL_ADDRESS)
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))

        self.blog_post = blog_services.create_new_blog_post(self.blog_admin_id)
        model = (
            blog_models.BlogPostModel.get_by_id(self.blog_post.id))
        model.title = 'sample title'
        model.tags = ['news']
        model.thumbnail_filename = 'image.png'
        model.content = 'hello bloggers'
        model.url_fragment = 'sample'
        model.published_on = datetime.datetime.utcnow()
        model.update_timestamps()
        model.put()

        self.login(feconf.SYSTEM_EMAIL_ADDRESS, is_super_admin=True)

    def test_update_blog_post_without_blog_post_id_raises_error(self) -> None:
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateblogpostdatahandler',
            {
                'author_username': 'someusername',
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_update_blog_post_without_author_username_raises_error(
        self
    ) -> None:
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': 'sampleid',
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_update_blog_post_without_published_on_raises_error(self) -> None:
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': 'sampleid',
                'author_username': 'someusername'
            },
            csrf_token=csrf_token,
            expected_status_int=400)

    def test_update_blog_post_with_wrong_username_raises_error(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': self.blog_post.id,
                'author_username': 'someusername',
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token,
            expected_status_int=400)

        error_msg = ('Invalid username: someusername')
        self.assertEqual(response['error'], error_msg)

    def test_update_blog_post_with_wrong_blog_post_id_raises_error(
        self
    ) -> None:
        csrf_token = self.get_new_csrf_token()
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(feconf.SYSTEM_EMAIL_ADDRESS, is_super_admin=True)

        self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': 'sampleid1234',
                'author_username': self.BLOG_EDITOR_USERNAME,
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token,
            expected_status_int=404)

    def test_update_blog_post_with_user_without_enough_rights(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': self.blog_post.id,
                'author_username': self.NEW_USER_USERNAME,
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token,
            expected_status_int=400)

        error_msg = ('User does not have enough rights to be blog post author.')
        self.assertEqual(response['error'], error_msg)

    def test_update_blog_post_with_invalid_date_format(self) -> None:
        csrf_token = self.get_new_csrf_token()
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(feconf.SYSTEM_EMAIL_ADDRESS, is_super_admin=True)

        response = self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': self.blog_post.id,
                'author_username': self.BLOG_EDITOR_USERNAME,
                'published_on': '05/09/20000'
            },
            csrf_token=csrf_token,
            expected_status_int=500)

        error_msg = (
            'time data \'05/09/20000, 00:00:00:00\' does not match' +
            ' format \'%m/%d/%Y, %H:%M:%S:%f\'')
        self.assertEqual(response['error'], error_msg)

    def test_update_blog_post_with_correct_params(self) -> None:
        csrf_token = self.get_new_csrf_token()
        self.signup(self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(feconf.SYSTEM_EMAIL_ADDRESS, is_super_admin=True)

        self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': self.blog_post.id,
                'author_username': self.BLOG_EDITOR_USERNAME,
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token)
