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

from core import feature_flag_list
from core import feconf
from core import utils
from core.constants import constants
from core.domain import blog_services
from core.domain import caching_services
from core.domain import classroom_config_services
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
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
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.domain import voiceover_services
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
    from mypy_imports import voiceover_models

(
    audit_models, blog_models, exp_models, opportunity_models,
    user_models, voiceover_models
) = models.Registry.import_models([
    models.Names.AUDIT, models.Names.BLOG, models.Names.EXPLORATION,
    models.Names.OPPORTUNITY, models.Names.USER,
    models.Names.VOICEOVER
])

BOTH_MODERATOR_AND_ADMIN_EMAIL = 'moderator.and.admin@example.com'
BOTH_MODERATOR_AND_ADMIN_USERNAME = 'moderatorandadm1n'


class ParamName(enum.Enum):
    """Enum for parameter names."""

    TEST_PARAMETER_1 = 'test_param_1'


class AdminIntegrationTest(test_utils.GenericTestBase):
    """Server integration tests for operations on the admin page."""

    def setUp(self) -> None:
        """Complete the signup process for self.CURRICULUM_ADMIN_EMAIL."""
        super().setUp()

        self.original_parameter_registry = (
            platform_parameter_registry.Registry.parameter_registry.copy())
        platform_parameter_registry.Registry.parameter_registry.clear()
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            ['test_param_1'])

        self.signup(feconf.ADMIN_EMAIL_ADDRESS, 'testsuper')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.prod_mode_swap = self.swap(constants, 'DEV_MODE', False)

    def tearDown(self) -> None:
        super().tearDown()
        platform_parameter_registry.Registry.parameter_registry = (
            self.original_parameter_registry)

    def test_admin_get(self) -> None:
        """Test `/admin` returns a 200 response."""
        self.get_html_response('/admin', expected_status_int=200)

    def _create_dummy_param(
        self) -> platform_parameter_domain.PlatformParameter:
        """Creates dummy platform parameter."""
        # Here we use MyPy ignore because we use dummy platform parameter
        # names for our tests and create_platform_parameter only accepts
        # platform parameter name of type platform_parameter_list.ParamName.
        return platform_parameter_registry.Registry.create_platform_parameter(
            ParamName.TEST_PARAMETER_1, # type: ignore[arg-type]
            'Param for test.',
            platform_parameter_domain.DataTypes.BOOL)

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

    def test_without_blog_post_title_generate_dummy_blog_post_is_not_performed(
        self
    ) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'blog_post_title\' must be provided when the action '
            'is generate_dummy_blog_post.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_blog_post',
                    'blog_post_title': None
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

    def test_without_skill_id_dummy_question_suggestions_action_is_not_performed( # pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'skill_id\' must be provided when the '
            'action is _generate_dummy_question_suggestions.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_question_suggestions',
                    'skill_id': None,
                    'num_dummy_question_suggestions_generate': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_num_dummy_question_suggestions_generate_action_is_not_performed( # pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'num_dummy_question_suggestions_generate\' must be provided'
            ' when the action is _generate_dummy_question_suggestions.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_question_suggestions',
                    'skill_id': 'N8daS2n2aoQr',
                    'num_dummy_question_suggestions_generate': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_dummy_story_generation_fail_without_topic_id(# pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'topic_id\' must be provided when the '
            'action is generate_dummy_stories.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_stories',
                    'topic_id': None,
                    'num_dummy_stories_to_generate': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_dummy_story_generation_fail_without_num_dummy_stories_to_generate( # pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'num_dummy_stories_to_generate\' must be provided'
            ' when the action is generate_dummy_stories.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_stories',
                    'topic_id': 'topic', 
                    'num_dummy_stories_to_generate': None
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

    def test_dummy_chapter_generation_fail_without_story_id(# pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'story_id\' must be provided when the '
            'action is generate_dummy_chapters.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_chapters',
                    'story_id': None,
                    'num_dummy_chapters_to_generate': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_dummy_chapter_generation_fail_without_num_dummy_chapters_to_generate( # pylint: disable=line-too-long
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'num_dummy_chapters_to_generate\' must be provided'
            ' when the action is generate_dummy_chapters.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_chapters',
                    'story_id': 'story_id', 
                    'num_dummy_chapters_to_generate': None
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

    def test_without_param_name_action_update_platform_param_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'platform_param_name\' must be provided when the action is '
            'update_platform_parameter_rules.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_platform_parameter_rules',
                    'platform_param_name': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_new_rules_action_update_param_is_not_performed(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'new_rules\' must be provided when the action is '
            'update_platform_parameter_rules.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_platform_parameter_rules',
                    'platform_param_name': 'new_feature',
                    'new_rules': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_without_commit_message_action_update_param_is_not_performed(
        self
    ) -> None:
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'platform_type',
                        'conditions': [['=', 'Web']]
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
            'update_platform_parameter_rules.'
        )
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'update_platform_parameter_rules',
                    'platform_param_name': 'new_feature',
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
        self.assertEqual(len(topic_summaries), 1)
        story_id = topic_fetchers.get_topic_by_id(
            topic_summaries[0].id).canonical_story_references[0].story_id
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
        self.assertEqual(len(questions), 5)
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
        self.assertEqual(len(classrooms), 1)
        self.logout()

    @test_utils.enable_feature_flags([
        feature_flag_list.FeatureNames
        .SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW
    ])
    def test_regenerate_topic_related_opportunities_action(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        topic_id = 'topic'
        story_id = 'story'
        self.save_new_valid_exploration(
            '0', owner_id, title='title', end_state_name='End State')
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
            '0', owner_id, title='title', end_state_name='End State')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content_0',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content_0',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 1')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content_0',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content_0',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 2')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content_0',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content_0',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
            })], 'Update 3')
        exp_services.update_exploration(
            owner_id, '0', [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content_0',
                'html': 'content 1'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content_0',
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

    def test_get_handler_includes_all_platform_params(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        param = self._create_dummy_param()

        with self.swap(
            platform_parameter_list,
            'ALL_PLATFORM_PARAMS_LIST',
            [ParamName.TEST_PARAMETER_1]
        ):
            response_dict = self.get_json('/adminhandler')
        self.assertEqual(
            response_dict['platform_params_dicts'], [param.to_dict()])

        platform_parameter_registry.Registry.parameter_registry.pop(
            param.name)
        self.logout()

    def test_get_handler_includes_all_stories(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'topicurl',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )
        num_stories = 4
        created_story_ids = []
        for i in range(num_stories):
            url_fragement = ['url-a', 'url-b', 'url-c', 'url-d']
            story = story_domain.Story.create_default_story(
                'story_id_%s' % i,
                'Title %s' % i,
                'Description %s' % i,
                'topic', url_fragement[i]
            )
            story_services.save_new_story(
                self.get_user_id_from_email(
                    self.CURRICULUM_ADMIN_EMAIL
                ), story
            )
            created_story_ids.append('story_id_%s' % i)
            topic_services.add_canonical_story(
                self.get_user_id_from_email(
                    self.CURRICULUM_ADMIN_EMAIL
                ), 'topic', 'story_id_%s' % i
            )
        response = self.get_json('/adminhandler')
        story_list = response['story_list']
        returned_story_ids = [story['id'] for story in story_list]
        self.assertEqual(set(returned_story_ids), set(created_story_ids))
        self.logout()

    def test_post_with_rules_changes_updates_platform_params(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        param = self._create_dummy_param()
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'platform_type',
                        'conditions': [['=', 'Web']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        with self.swap(
            platform_parameter_list,
            'ALL_PLATFORM_PARAMS_LIST',
            [ParamName.TEST_PARAMETER_1]
        ):
            self.post_json(
                '/adminhandler', {
                    'action': 'update_platform_parameter_rules',
                    'platform_param_name': param.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update param',
                    'default_value': {'value': False}
                }, csrf_token=csrf_token)

        rule_dicts = [
            rule.to_dict() for rule
            in platform_parameter_registry.Registry.get_platform_parameter(
                param.name).rules
        ]
        self.assertEqual(rule_dicts, new_rule_dicts)

        platform_parameter_registry.Registry.parameter_registry.pop(
            param.name)
        self.logout()

    def test_post_rules_changes_correctly_updates_params_returned_by_getter(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        platform_parameter_registry.Registry.parameter_registry.clear()
        param = self._create_dummy_param()
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'platform_type',
                        'conditions': [['=', 'Web']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        with self.swap(
            platform_parameter_list,
            'ALL_PLATFORM_PARAMS_LIST',
            [ParamName.TEST_PARAMETER_1]
        ):
            response_dict = self.get_json('/adminhandler')
            self.assertEqual(
                response_dict['platform_params_dicts'], [param.to_dict()])

            self.post_json(
                '/adminhandler', {
                    'action': 'update_platform_parameter_rules',
                    'platform_param_name': param.name,
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update param',
                    'default_value': {'value': False}
                }, csrf_token=csrf_token)

            response_dict = self.get_json('/adminhandler')
            rules = response_dict['platform_params_dicts'][0]['rules']
            self.assertEqual(rules, new_rule_dicts)

        platform_parameter_registry.Registry.parameter_registry.pop(
            param.name)
        self.logout()

    def test_update_parameter_rules_with_unknown_param_name_raises_error(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'platform_type',
                        'conditions': [['=', 'Web']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        with self.swap(
            platform_parameter_list,
            'ALL_PLATFORM_PARAMS_LIST',
            [ParamName.TEST_PARAMETER_1]
        ):
            response = self.post_json(
                '/adminhandler', {
                    'action': 'update_platform_parameter_rules',
                    'platform_param_name': 'unknown_param',
                    'new_rules': new_rule_dicts,
                    'commit_message': 'test update param',
                    'default_value': {'value': False}
                },
                csrf_token=csrf_token,
                expected_status_int=500
            )
        self.assertEqual(
            response['error'],
            'Platform parameter not found: unknown_param.')

        self.logout()

    def test_update_parameter_rules_with_unknown_data_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        platform_parameter_registry.Registry.parameter_registry.clear()
        param = self._create_dummy_param()
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'platform_type',
                        'conditions': [['=', 'Web']]
                    }
                ],
                'value_when_matched': 'unknown'
            }
        ]

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_platform_parameter_rules',
                'platform_param_name': param.name,
                'new_rules': new_rule_dicts,
                'commit_message': 'test update param',
                'default_value': {'value': False}
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'Expected bool, received \'unknown\' in value_when_matched.')

        self.logout()

    def test_update_param_rules_with_param_name_of_non_string_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_platform_parameter_rules',
                'platform_param_name': 123,
                'new_rules': [],
                'commit_message': 'test update param',
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        error_msg = (
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
            'Schema validation for \'platform_param_name\' failed: Expected '
            'string, received 123')
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_param_rules_with_message_of_non_string_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_platform_parameter_rules',
                'platform_param_name': 'param_name',
                'new_rules': [],
                'commit_message': 123,
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        error_msg = (
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
            'Schema validation for \'commit_message\' failed: Expected '
            'string, received 123')
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_param_rules_with_rules_of_non_list_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'update_platform_parameter_rules',
                'platform_param_name': 'param_name',
                'new_rules': {},
                'commit_message': 'test update param',
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        error_msg = (
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
            'Schema validation for \'new_rules\' failed: Expected list, '
            'received {}')
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_param_rules_with_rules_of_non_list_of_dict_type_returns_400(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        error_msg = (
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
            'Schema validation for \'new_rules\' failed: \'int\' '
            'object is not subscriptable')
        response = self.post_json(
            '/adminhandler', {
                'action': 'update_platform_parameter_rules',
                'platform_param_name': 'param_name',
                'new_rules': [1, 2],
                'commit_message': 'test update param',
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(response['error'], error_msg)

        self.logout()

    def test_update_param_rules_with_unexpected_exception_returns_500(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        param = self._create_dummy_param()
        new_rule_dicts = [
            {
                'filters': [
                    {
                        'type': 'platform_type',
                        'conditions': [['=', 'Web']]
                    }
                ],
                'value_when_matched': True
            }
        ]

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        platform_parameter_registry.Registry.parameter_registry[
            param.name] = None  # type: ignore[assignment]
        response = self.post_json(
            '/adminhandler', {
                'action': 'update_platform_parameter_rules',
                'platform_param_name': param.name,
                'new_rules': new_rule_dicts,
                'commit_message': 'test update param',
                'default_value': {'value': False}
            },
            csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response['error'],
            '\'NoneType\' object has no attribute \'serialize\'')

        platform_parameter_registry.Registry.parameter_registry.pop(
            param.name)
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

        error_msg = (
            'At \'http://localhost/adminsuperadminhandler\' '
            'these errors are happening:\n'
            'Missing key in handler args: username.'
        )
        self.assertEqual(response['error'], error_msg)

    def test_grant_super_admin_privileges_fails_with_invalid_username(
        self
    ) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        self.put_json(
            '/adminsuperadminhandler', {'username': 'fakeusername'},
            csrf_token=self.get_new_csrf_token(), expected_status_int=404)

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

        error_msg = (
            'At \'http://localhost/adminsuperadminhandler\' '
            'these errors are happening:\n'
            'Missing key in handler args: username.'
        )
        self.assertEqual(response['error'], error_msg)

    def test_revoke_super_admin_privileges_fails_with_invalid_username(
        self
    ) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        self.delete_json(
            '/adminsuperadminhandler',
            params={'username': 'fakeusername'}, expected_status_int=404)

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
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
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
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
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


class GenerateDummyQuestionSuggestionsTest(test_utils.GenericTestBase):
    """Test the conditions for generation of dummy question suggestions."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.QUESTION_REVIEWER_EMAIL, self.QUESTION_REVIEWER_USERNAME)
        self.signup(
            self.QUESTION_ADMIN_EMAIL,
            self.QUESTION_ADMIN_USERNAME,
            is_super_admin=True)
        self.question_reviewer_id = self.get_user_id_from_email(
            self.QUESTION_REVIEWER_EMAIL)
        self.add_user_role(
            self.QUESTION_ADMIN_USERNAME,
            feconf.ROLE_ID_QUESTION_ADMIN)

    def test_generate_dummy_question_suggestions_(self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/contributionrightshandler/submit_question', {
                'username': 'questionExpert'
            }, csrf_token=csrf_token)

        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_question_suggestions',
                'skill_id': 'N8daS2n2aoQr',
                'num_dummy_question_suggestions_generate': 12
            }, csrf_token=csrf_token)

        generated_question_suggestions = suggestion_services.get_submitted_suggestions( # pylint: disable=line-too-long
            self.get_user_id_from_email(
                self.QUESTION_ADMIN_EMAIL),
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertEqual(len(generated_question_suggestions), 12)
        self.logout()

    def test_cannot_generate_dummy_question_suggestions_in_prod_mode_(# pylint: disable=line-too-long
            self) -> None:
        self.login(self.QUESTION_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot generate dummy question suggestion in production.')

        self.post_json(
            '/contributionrightshandler/submit_question', {
                'username': 'questionExpert'
            }, csrf_token=csrf_token)

        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_question_suggestions',
                    'skill_id': 'N8daS2n2aoQr',
                    'num_dummy_question_suggestions_generate': 12
                }, csrf_token=csrf_token)

        generated_question_suggestions = suggestion_services.get_submitted_suggestions( # pylint: disable=line-too-long
            self.get_user_id_from_email(
                self.QUESTION_ADMIN_EMAIL),
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertNotEqual(len(generated_question_suggestions), 12)
        self.logout()

    def test_raises_error_if_not_question_admin_or_question_submitter_(# pylint: disable=line-too-long
            self) -> None:
        self.login(
            self.QUESTION_REVIEWER_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp = self.assertRaisesRegex(
            Exception, 'User \'question\' must be a question submitter or question admin'
                    ' in order to generate question suggestions.')

        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_question_suggestions',
                    'skill_id': 'N8daS2n2aoQr',
                    'num_dummy_question_suggestions_generate': 12
                }, csrf_token=csrf_token)

        generated_question_suggestions = suggestion_services.get_submitted_suggestions( # pylint: disable=line-too-long
            self.get_user_id_from_email(
                self.QUESTION_ADMIN_EMAIL),
                feconf.SUGGESTION_TYPE_ADD_QUESTION)
        self.assertNotEqual(len(generated_question_suggestions), 12)
        self.logout()


class GenerateDummyStoriesTest(test_utils.GenericTestBase):
    """Test the conditions for generation of dummy stories."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL,
            self.CURRICULUM_ADMIN_USERNAME,
            is_super_admin=True)
        self.add_user_role(
            self.CURRICULUM_ADMIN_USERNAME,
            feconf.ROLE_ID_CURRICULUM_ADMIN)

    def test_generate_dummy_stories(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'url',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )

        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_stories',
                'topic_id': 'topic',
                'num_dummy_stories_to_generate': 5
            }, csrf_token=csrf_token)

        generated_stories_count = len(topic.get_all_story_references())
        self.assertNotEqual(generated_stories_count, 5)
        self.logout()

    def test_cannot_generate_dummy_stories_in_prod_mode(# pylint: disable=line-too-long
            self
        ) -> None:
        self.login(
            self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regex = self.assertRaisesRegex(
            Exception, 'Cannot generate dummy stories in production.')

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'url',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )

        with assert_raises_regex, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_stories',
                    'topic_id': 'topic', 
                    'num_dummy_stories_to_generate': 5
                }, csrf_token=csrf_token)

        generated_stories_count = len(topic.get_all_story_references())
        self.assertNotEqual(generated_stories_count, 5)
        self.logout()

    def test_raises_error_if_not_curriculum_admin(# pylint: disable=line-too-long
            self
        ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)
        self.login(user_email, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regex = self.assertRaisesRegex(
            Exception, 'User \'user1\' must be a curriculum admin'
            ' in order to generate stories.')

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'url',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )

        with assert_raises_regex:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_stories',
                    'topic_id': 'topic', 
                    'num_dummy_stories_to_generate': 5
                }, csrf_token=csrf_token)

        generated_stories_count = len(topic.get_all_story_references())
        self.assertNotEqual(generated_stories_count, 5)
        self.logout()


class GenerateDummyChaptersTest(test_utils.GenericTestBase):
    """Test the conditions for generation of dummy chapters."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL,
            self.CURRICULUM_ADMIN_USERNAME,
            is_super_admin=True)
        self.add_user_role(
            self.CURRICULUM_ADMIN_USERNAME,
            feconf.ROLE_ID_CURRICULUM_ADMIN)

    def test_generate_dummy_chapters(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'topicurl',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )

        story = story_domain.Story.create_default_story(
            'story_id', 'story_title', 'description',
            'topic', 'storyurl'
        )
        story_services.save_new_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), story
        )

        topic_services.add_canonical_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), 'topic', 'story_id'
        )

        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_chapters',
                'story_id': 'story_id',
                'num_dummy_chapters_to_generate': 7
            }, csrf_token=csrf_token)

        generated_chapters_count = len(story.story_contents.nodes)
        self.assertNotEqual(generated_chapters_count, 7)
        self.logout()

    def test_cannot_generate_dummy_chapters_in_prod_mode(# pylint: disable=line-too-long
            self
        ) -> None:
        self.login(
            self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regex = self.assertRaisesRegex(
            Exception, 'Cannot generate dummy chapters in production.')

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'topicurl',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )

        story = story_domain.Story.create_default_story(
            'story_id', 'story_title', 'description',
            'topic', 'storyurl'
        )
        story_services.save_new_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), story
        )

        topic_services.add_canonical_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), 'topic', 'story_id'
        )

        with assert_raises_regex, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_chapters',
                    'story_id': 'story', 
                    'num_dummy_chapters_to_generate': 7
                }, csrf_token=csrf_token)

        generated_chapters_count = len(story.story_contents.nodes)
        self.assertNotEqual(generated_chapters_count, 7)
        self.logout()

    def test_generate_dummy_chapters_when_story_contents_is_not_none(# pylint: disable=line-too-long
        self
    ) -> None:
        self.login(
            self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'topicurl',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )
        story = story_domain.Story.create_default_story(
            'story_id', 'story_title', 'description',
            'topic', 'storyurl'
        )
        story.story_contents.next_node_id = 'node_4'

        def reload_exploration(
                user_id: str, exploration_id: str
        ) -> None:
            if constants.DEV_MODE:
                logging.info(
                    '[ADMIN] %s reloaded exploration %s' %
                    (user_id, exploration_id))
                exp_services.load_demo(exploration_id)
                rights_manager.release_ownership_of_exploration(
                    user_services.get_system_user(), exploration_id)
            else:
                raise Exception('Cannot reload an exploration in production.')

        reload_exploration(self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL), '6'
        )
        story.add_node('node_4', 'dummy chapter 4')
        story.update_node_exploration_id('node_4', '6')
        story_services.save_new_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
                ), story
        )
        topic_services.add_canonical_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
                ), 'topic', 'story_id'
        )
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_chapters',
                'story_id': 'story_id',
                'num_dummy_chapters_to_generate': 2
            }, csrf_token=csrf_token)

        updated_story = story_fetchers.get_story_by_id('story_id')
        chapter_titles = [
            node.title for node in updated_story.story_contents.nodes
        ]
        self.assertIn('dummy chapter 4', chapter_titles)
        self.assertIn('dummy chapter 5', chapter_titles)
        self.assertIn('dummy chapter 6', chapter_titles)
        self.assertNotEqual(len(story.story_contents.nodes), 3)
        self.logout()

    def test_raises_error_if_not_curriculum_admin(# pylint: disable=line-too-long
            self
        ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'
        self.signup(user_email, username)
        self.login(user_email, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regex = self.assertRaisesRegex(
            Exception, 'User \'user1\' must be a curriculum admin'
            ' in order to generate chapters.')

        topic = topic_domain.Topic.create_default_topic(
            'topic', 'topic_name', 'topicurl',
            'description', 'fragm'
        )
        topic_services.save_new_topic(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), topic
        )

        story = story_domain.Story.create_default_story(
            'story_id', 'story_title', 'description',
            'topic', 'storyurl'
        )
        story_services.save_new_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), story
        )

        topic_services.add_canonical_story(
            self.get_user_id_from_email(
                self.CURRICULUM_ADMIN_EMAIL
            ), 'topic', 'story_id'
        )

        with assert_raises_regex:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_chapters',
                    'story_id': 'story',
                    'num_dummy_chapters_to_generate': 7
                }, csrf_token=csrf_token)

        generated_chapters_count = len(story.story_contents.nodes)
        self.assertNotEqual(generated_chapters_count, 7)
        self.logout()


class GenerateDummyTranslationOpportunitiesTest(test_utils.GenericTestBase):
    """Checks the conditions for generation of dummy translation
    opportunities."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.prod_mode_swap = self.swap(constants, 'DEV_MODE', False)

    def test_admins_can_generate_dummy_translation_opportunities(self) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_translation_opportunities',
                'num_dummy_translation_opportunities_to_generate': 10
            }, csrf_token=csrf_token)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(10)
        self.assertEqual(len(generated_exps), 10)
        self.assertEqual(len(published_exps), 10)
        self.logout()

    def test_admins_can_generate_dummy_translation_opportunities_multiple_times(self) -> None: # pylint: disable=line-too-long
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        for i in range(1, 4):
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_translation_opportunities',
                    'num_dummy_translation_opportunities_to_generate': 5
                }, csrf_token=csrf_token)
            generated_exps = exp_services.get_all_exploration_summaries()
            published_exps = (
                exp_services.get_recently_published_exp_summaries(15))
            self.assertEqual(len(generated_exps), 5 * i)
            self.assertEqual(len(published_exps), 5 * i)
        self.logout()

    def test_handler_raises_error_with_non_int_num_dummy_translation_opportunities_to_generate(self) -> None: # pylint: disable=line-too-long
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_translation_opportunities',
                'num_dummy_translation_opportunities_to_generate':
                    'invalid_type'
            }, csrf_token=csrf_token, expected_status_int=400)

        error_msg = (
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
            'Schema validation for '
            '\'num_dummy_translation_opportunities_to_generate\' '
            'failed: Could not convert str to int: invalid_type')
        self.assertEqual(response['error'], error_msg)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_without_num_dummy_exps_generate_dummy_translation_opportunites_action_is_not_performed(self) -> None: # pylint: disable=line-too-long
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'num_dummy_translation_opportunities_to_generate\' must be '
            'provided when the action is generate_dummy_translation_'
            'opportunities.'
        )
        with assert_raises_regexp_context_manager:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_translation_opportunities',
                    'num_dummy_translation_opportunities_to_generate': None
                }, csrf_token=csrf_token)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_cannot_generate_dummy_translation_opportunities_in_production_mode(
        self) -> None:
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot load new structures data in production.')
        with assert_raises_regexp_context_manager, self.prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_translation_opportunities',
                    'num_dummy_translation_opportunities_to_generate': 5
                }, csrf_token=csrf_token)
        generated_exps = exp_services.get_all_exploration_summaries()
        published_exps = exp_services.get_recently_published_exp_summaries(5)
        self.assertEqual(generated_exps, {})
        self.assertEqual(published_exps, {})

        self.logout()

    def test_non_admins_cannot_generate_dummy_translation_opportunities(
        self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        assert_raises_regexp = self.assertRaisesRegex(
            Exception, 'User does not have enough rights to generate data.')
        with assert_raises_regexp:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_translation_opportunities',
                    'num_dummy_translation_opportunities_to_generate': 1
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
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
            expected_status_int=404)

        # Trying to update role of non-existent user.
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            {'role': feconf.ROLE_ID_MODERATOR, 'username': username},
            csrf_token=csrf_token,
            expected_status_int=404)

    def test_removing_role_with_invalid_username(self) -> None:
        username = 'invaliduser'

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        self.delete_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'role': feconf.ROLE_ID_TOPIC_MANAGER, 'username': username},
            expected_status_int=404)

    def test_cannot_view_role_with_invalid_view_filter_criterion(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        response = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'invalid', 'username': 'user1'},
            expected_status_int=400)
        error_msg = (
            'At \'http://localhost/adminrolehandler?'
            'filter_criterion=invalid&username=user1\' '
            'these errors are happening:\n'
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
                'managed_topic_ids': [topic_id],
                'coordinated_language_ids': []
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
            'managed_topic_ids': [],
            'coordinated_language_ids': []
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [topic_id],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })


class RegenerateTopicSummariesHandlerTest(test_utils.GenericTestBase):
    """Tests for RegenerateTopicSummariesHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL)

    def test_regenerate_topic_summaries(self) -> None:
        topic_id_1 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.admin_id, name='Topic 1',
            abbreviated_name='T1', url_fragment='url-frag-one',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_2, self.admin_id, name='Topic 2',
            abbreviated_name='T2', url_fragment='url-frag-two',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        # Order of function calls in expected_args should not
        # matter for this test.
        with self.swap_with_checks(
                topic_services, 'generate_topic_summary',
                topic_services.generate_topic_summary,
                expected_args=[(topic_id_1,), (topic_id_2,)]):
            self.put_json(
                feconf.REGENERATE_TOPIC_SUMMARIES_URL, {},
                csrf_token=csrf_token, expected_status_int=200)


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
        self.put_json(
            '/topicmanagerrolehandler', {
                'action': 'assign',
                'username': username,
                'topic_id': topic_id
            }, csrf_token=csrf_token, expected_status_int=404)

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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [topic_id],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [topic_id],
                'coordinated_language_ids': []
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


class TranslationCoordinatorRoleHandlerTest(test_utils.GenericTestBase):
    """Tests for TranslationCoordinatorRoleHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.admin_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL)

    def test_handler_with_invalid_username(self) -> None:
        username = 'invaliduser'

        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'assign',
                'username': username,
                'language_id': 'en'
            }, csrf_token=csrf_token, expected_status_int=404)

    def test_adding_translation_coordinator_role_to_language(self) -> None:
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'assign',
                'username': username,
                'language_id': 'en'
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER,
                    feconf.ROLE_ID_TRANSLATION_COORDINATOR],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': ['en']
            })
        self.logout()

    def test_assigning_two_languages_to_translation_coordinator(self) -> None:
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'assign',
                'username': username,
                'language_id': 'en'
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER,
                    feconf.ROLE_ID_TRANSLATION_COORDINATOR],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': ['en']
            })

        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'assign',
                'username': username,
                'language_id': 'hi'
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER,
                    feconf.ROLE_ID_TRANSLATION_COORDINATOR],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': ['en', 'hi']
            })
        self.logout()

    def test_deassigning_language_from_coordinator(self) -> None:
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'assign',
                'username': username,
                'language_id': 'en'
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER,
                    feconf.ROLE_ID_TRANSLATION_COORDINATOR],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': ['en']
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'deassign',
                'username': username,
                'language_id': 'en'
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        self.delete_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={
                'role': feconf.ROLE_ID_TRANSLATION_COORDINATOR,
                'username': username},
            expected_status_int=200)

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })
        self.logout()

    def test_removing_translation_coordinator_role(self) -> None:
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            '/translationcoordinatorrolehandler', {
                'action': 'assign',
                'username': username,
                'language_id': 'en'
            }, csrf_token=csrf_token)

        self.assertEqual(response_dict, {})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER,
                    feconf.ROLE_ID_TRANSLATION_COORDINATOR],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': ['en']
            })

        self.delete_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={
                'username': username,
                'role': feconf.ROLE_ID_TRANSLATION_COORDINATOR})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})
        self.assertEqual(
            response_dict, {
                'roles': [
                    feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [topic_id],
                'coordinated_language_ids': []
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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

    def test_ban_user_with_invalid_username(self) -> None:
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/bannedusershandler', {
                'username': 'invalidUsername'
            }, csrf_token=csrf_token, expected_status_int=404)

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
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

        self.delete_json('/bannedusershandler', params={'username': username})

        response_dict = self.get_json(
            feconf.ADMIN_ROLE_HANDLER_URL,
            params={'filter_criterion': 'username', 'username': username})

        self.assertEqual(
            response_dict, {
                'roles': [feconf.ROLE_ID_FULL_USER],
                'banned': False,
                'managed_topic_ids': [],
                'coordinated_language_ids': []
            })

    def test_unban_user_with_invalid_username(self) -> None:
        self.login(self.SUPER_ADMIN_EMAIL, is_super_admin=True)
        self.delete_json(
            '/bannedusershandler',
            params={'username': 'invalidUsername'},
            expected_status_int=404)


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
            'At \'http://localhost/explorationdataextractionhandler?'
            'exp_id=exp&exp_version=a&state_name=Introduction&num_answers=0\' '
            'these errors are happening:\n'
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

        self.get_json(
            '/explorationdataextractionhandler', params=payload,
            expected_status_int=404)

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

        self.get_json(
            '/explorationdataextractionhandler', params=payload,
            expected_status_int=404)


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

    @test_utils.set_platform_parameters(
        [(platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True)]
    )
    def test_can_send_dummy_mail(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        generated_response = self.post_json(
            '/senddummymailtoadminhandler', {},
            csrf_token=csrf_token, expected_status_int=200)
        self.assertEqual(generated_response, {})

    def test_cannot_send_dummy_mail(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
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
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
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
        error_msg = (
            'At \'http://localhost/updateusernamehandler\' '
            'these errors are happening:\n'
            'Missing key in handler args: new_username.'
        )
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
        error_msg = (
            'At \'http://localhost/updateusernamehandler\' '
            'these errors are happening:\n'
            'Missing key in handler args: old_username.'
        )
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
            response['error'],
            'At \'http://localhost/updateusernamehandler\' '
            'these errors are happening:\n'
            'Schema validation for \'new_username\' failed:'
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
            'At \'http://localhost/updateusernamehandler\' '
            'these errors are happening:\n'
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
            'At \'http://localhost/updateusernamehandler\' '
            'these errors are happening:\n'
            'Schema validation for \'new_username\' failed: Validation failed'
            ': has_length_at_most ({\'max_value\': %s}) for object %s'
            % (constants.MAX_USERNAME_LENGTH, long_username))
        self.assertEqual(response['error'], error_msg)

    def test_update_username_with_nonexistent_old_username(self) -> None:
        non_existent_username = 'invalid'
        csrf_token = self.get_new_csrf_token()

        self.put_json(
            '/updateusernamehandler',
            {
                'old_username': non_existent_username,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token,
            expected_status_int=404)

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
        old_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, self.OLD_USERNAME)
        image_with_old_username = old_fs.get('profile_picture.png')

        self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.OLD_USERNAME,
                'new_username': self.NEW_USERNAME},
            csrf_token=csrf_token)
        self.assertEqual(user_services.get_username(user_id), self.NEW_USERNAME)

        new_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, self.NEW_USERNAME)
        image_with_new_username = new_fs.get('profile_picture.png')

        self.assertEqual(image_with_old_username, image_with_new_username)

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

    def test_profile_picture_is_missing_raises_error(self) -> None:
        csrf_token = self.get_new_csrf_token()
        old_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, self.EDITOR_USERNAME)
        image_png = old_fs.get('profile_picture.png')
        old_fs.delete('profile_picture.png')
        self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.EDITOR_USERNAME,
                'new_username': self.NEW_USERNAME},
                csrf_token=csrf_token,
                expected_status_int=404)

        old_fs.commit(
            'profile_picture.png', image_png, mimetype='image/png')

        old_fs.delete('profile_picture.webp')
        self.put_json(
            '/updateusernamehandler',
            {
                'old_username': self.EDITOR_USERNAME,
                'new_username': self.NEW_USERNAME},
                csrf_token=csrf_token,
                expected_status_int=404)


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
            expected_status_int=404)

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

        self.put_json(
            '/updateblogpostdatahandler',
            {
                'blog_post_id': self.blog_post.id,
                'author_username': 'someusername',
                'published_on': '05/09/2000'
            },
            csrf_token=csrf_token,
            expected_status_int=404)

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
            expected_status_int=401)

        error_msg = 'User does not have enough rights to be blog post author.'
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
            'time data \'05/09/20000, 00:00:00:00\' does not match'
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


class GenerateDummyBlogPostTest(test_utils.GenericTestBase):
    """Tests the generation of dummy blog post data."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

    def test_cannot_generate_dummy_blog_post_in_prod_mode(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Cannot load new blog post in production mode.')

        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.post_json(
                '/adminhandler', {
                    'action': 'generate_dummy_blog_post',
                    'blog_post_title': 'Education',
                }, csrf_token=csrf_token)

        blog_post_count = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(blog_post_count, 0)
        self.logout()

    def test_generate_dummy_blog_post(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_blog_post',
                'blog_post_title': 'Education',
            }, csrf_token=csrf_token)
        blog_post_count = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(blog_post_count, 1)

        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_blog_post',
                'blog_post_title': 'Blog with different font formatting',
            }, csrf_token=csrf_token)
        blog_post_count = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(blog_post_count, 2)

        self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_blog_post',
                'blog_post_title': 'Leading The Arabic Translations Team',
            }, csrf_token=csrf_token)
        blog_post_count = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(blog_post_count, 3)
        self.logout()

    def test_handler_raises_error_with_invalid_blog_post_title(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()
        invalid_blog_post_title = 'blog_title'
        response = self.post_json(
            '/adminhandler', {
                'action': 'generate_dummy_blog_post',
                'blog_post_title': invalid_blog_post_title,
            }, csrf_token=csrf_token, expected_status_int=400)

        error_msg = (
            'At \'http://localhost/adminhandler\' these errors are happening:\n'
            'Schema validation for \'blog_post_title\' failed: Received %s '
            'which is not in the allowed range of choices: [\'Leading The '
            'Arabic Translations Team\', \'Education\', \'Blog with different'
            ' font formatting\']' % invalid_blog_post_title)
        self.assertEqual(response['error'], error_msg)
        blog_post_count = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(blog_post_count, 0)
        self.logout()


class IntereactionByExplorationIdHandlerTests(test_utils.GenericTestBase):
    """Tests for interaction by exploration handler."""

    EXP_ID_1 = 'exp1'

    def setUp(self) -> None:
        """Complete the signup process for self.ADMIN_EMAIL."""
        super().setUp()
        self.signup(feconf.ADMIN_EMAIL_ADDRESS, 'testsuper')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration1 = self.save_new_valid_exploration(
            self.EXP_ID_1, self.editor_id, end_state_name='End')

    def test_interactions_by_exploration_id_handler(self) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        payload = {
            'exp_id': self.EXP_ID_1
        }

        response = self.get_json(
            '/interactions', params=payload)
        interaction_ids = response['interaction_ids']
        self.assertEqual(
            sorted(interaction_ids), ['EndExploration', 'TextInput'])

    def test_handler_with_invalid_exploration_id_raise_error(self) -> None:
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)

        payload = {
            'exp_id': 'invalid'
        }

        self.get_json(
            '/interactions', params=payload,
            expected_status_int=404)

    def test_handler_with_without_exploration_id_in_payload_raise_error(self) -> None: # pylint: disable=line-too-long
        self.login(feconf.ADMIN_EMAIL_ADDRESS, is_super_admin=True)
        response = self.get_json(
            '/interactions', params={},
            expected_status_int=400)
        self.assertEqual(
            response['error'],
            'At \'http://localhost/interactions\' these errors are happening:\n'
            'Missing key in handler args: exp_id.'
        )


class AutomaticVoiceoverAdminControlHandlerTests(test_utils.GenericTestBase):
    """Tests for admin config for automatic voiceovers."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, 'testsuper')
        self.voiceover_autogeneration_policy_model = (
            voiceover_models.VoiceoverAutogenerationPolicyModel(
                id=voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID)
        )
        self.voiceover_autogeneration_policy_model.language_codes_mapping = {}
        (
            self.voiceover_autogeneration_policy_model.
            autogenerated_voiceovers_are_enabled
        ) = True
        self.voiceover_autogeneration_policy_model.update_timestamps()
        self.voiceover_autogeneration_policy_model.put()

    def test_handler_should_be_able_to_return_azure_config(self) -> None:
        response = self.get_json(
            '/automatic_voiceover_admin_control_handler',
            expected_status_int=200)
        self.assertTrue(
            response['autogenerated_voiceovers_are_enabled'])

    def test_admin_should_be_able_to_update_config(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        voiceover_services.update_admin_config_for_voiceover_autogeneration(
            False)
        self.assertFalse(
            voiceover_services.
            is_voiceover_autogeneration_using_cloud_service_enabled()
        )

        self.post_json(
            '/automatic_voiceover_admin_control_handler', {
                'autogenerated_voiceovers_are_enabled': True
            }, csrf_token=csrf_token)

        self.assertTrue(
            voiceover_services.
            is_voiceover_autogeneration_using_cloud_service_enabled()
        )
        self.logout()

    def test_non_admin_should_not_be_able_to_update_config(self) -> None:
        csrf_token = self.get_new_csrf_token()

        voiceover_services.update_admin_config_for_voiceover_autogeneration(
            False)
        self.assertFalse(
            voiceover_services.
            is_voiceover_autogeneration_using_cloud_service_enabled()
        )

        self.post_json(
            '/automatic_voiceover_admin_control_handler', {
                'autogenerated_voiceovers_are_enabled': 'true'
            }, csrf_token=csrf_token, expected_status_int=400)

        self.assertFalse(
            voiceover_services.
            is_voiceover_autogeneration_using_cloud_service_enabled()
        )
