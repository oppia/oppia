# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for the contributor dashboard controllers."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(suggestion_models,) = models.Registry.import_models([models.Names.SUGGESTION])


class ContributorDashboardPageTest(test_utils.GenericTestBase):
    """Test for showing contributor dashboard pages."""

    def test_page_with_disabled_contributor_dashboard_leads_to_404(self):
        config_services.set_property(
            'admin', 'contributor_dashboard_is_enabled', False)
        self.get_html_response(
            feconf.CONTRIBUTOR_DASHBOARD_URL, expected_status_int=404)

    def test_page_with_enabled_contributor_dashboard_loads_correctly(self):
        config_services.set_property(
            'admin', 'contributor_dashboard_is_enabled', True)
        response = self.get_html_response(feconf.CONTRIBUTOR_DASHBOARD_URL)
        response.mustcontain(
            '<contributor-dashboard-page></contributor-dashboard-page>')


class ContributionOpportunitiesHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ContributionOpportunitiesHandler."""

    def setUp(self):
        super(ContributionOpportunitiesHandlerTest, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category='category%d' % i,
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in range(2)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        self.topic_id = '0'
        topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'topic', 'abbrev', 'description')
        self.skill_id_0 = 'skill_id_0'
        self.skill_id_1 = 'skill_id_1'
        self._publish_valid_topic(topic, [self.skill_id_0, self.skill_id_1])

        # Add skill opportunity topic to a classroom.
        config_services.set_property(
            self.admin_id, 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math-one',
                'topic_ids': [self.topic_id],
                'course_details': '',
                'topic_list_intro': ''
            }])

        self.expected_skill_opportunity_dict_0 = {
            'id': self.skill_id_0,
            'skill_description': 'skill_description',
            'question_count': 0,
            'topic_name': 'topic'
        }
        self.expected_skill_opportunity_dict_1 = {
            'id': self.skill_id_1,
            'skill_description': 'skill_description',
            'question_count': 0,
            'topic_name': 'topic'
        }

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in range(2)]

        for index, story in enumerate(stories):
            story.language_code = 'en'
            story_services.save_new_story(self.owner_id, story)
            topic_services.add_canonical_story(
                self.owner_id, topic.id, story.id)
            topic_services.publish_story(
                topic.id, story.id, self.admin_id)
            story_services.update_story(
                self.owner_id, story.id, [story_domain.StoryChange({
                    'cmd': 'add_story_node',
                    'node_id': 'node_1',
                    'title': 'Node1',
                }), story_domain.StoryChange({
                    'cmd': 'update_story_node_property',
                    'property_name': 'exploration_id',
                    'node_id': 'node_1',
                    'old_value': None,
                    'new_value': explorations[index].id
                })], 'Changes.')

        # The content_count is 4 for the expected dicts below since a valid
        # exploration with EndExploration is created above, so the content in
        # the last state is also included in the count. This content includes:
        # 2 content, 1 TextInput interaction customization argument
        # (placeholder), and 1 outcome.
        self.expected_opportunity_dict_1 = {
            'id': '0',
            'topic_name': 'topic',
            'story_title': 'title 0',
            'chapter_title': 'Node1',
            'content_count': 2,
            'translation_counts': {},
            'translation_in_review_counts': {}
        }

        self.expected_opportunity_dict_2 = {
            'id': '1',
            'topic_name': 'topic',
            'story_title': 'title 1',
            'chapter_title': 'Node1',
            'content_count': 2,
            'translation_counts': {},
            'translation_in_review_counts': {}
        }
        config_services.set_property(
            'admin', 'contributor_dashboard_is_enabled', True)

    def test_handler_with_disabled_dashboard_flag_raise_404(self):
        config_services.set_property(
            'admin', 'contributor_dashboard_is_enabled', True)

        self.get_json(
            '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={}, expected_status_int=200)

        config_services.set_property(
            'admin', 'contributor_dashboard_is_enabled', False)

        self.get_json(
            '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={}, expected_status_int=404)

    def test_get_skill_opportunity_data(self):
        response = self.get_json(
            '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={})
        self.assertEqual(
            response['opportunities'], [
                self.expected_skill_opportunity_dict_0,
                self.expected_skill_opportunity_dict_1])
        self.assertFalse(response['more'])
        self.assertIsInstance(response['next_cursor'], str)

    def test_get_skill_opportunity_data_does_not_return_non_classroom_topics(
            self):
        config_services.revert_property(
            self.admin_id, 'classroom_pages_data')

        response = self.get_json(
            '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={})

        self.assertEqual(
            response['opportunities'], [])
        self.assertFalse(response['more'])
        self.assertIsInstance(response['next_cursor'], str)

    def test_get_skill_opportunity_data_does_not_throw_for_deleted_topics(self):
        topic_services.delete_topic(self.admin_id, self.topic_id)

        response = self.get_json(
            '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={})

        self.assertEqual(
            response['opportunities'], [])
        self.assertFalse(response['more'])
        self.assertIsInstance(response['next_cursor'], str)

    def test_get_translation_opportunity_data(self):
        response = self.get_json(
            '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={'language_code': 'hi'})

        self.assertEqual(
            response['opportunities'], [
                self.expected_opportunity_dict_1,
                self.expected_opportunity_dict_2])
        self.assertFalse(response['more'])
        self.assertIsInstance(response['next_cursor'], str)

    def test_get_voiceover_opportunity_data(self):
        response = self.get_json(
            '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
            params={'language_code': 'en'})

        self.assertEqual(len(response['opportunities']), 2)
        self.assertEqual(
            response['opportunities'], [
                self.expected_opportunity_dict_1,
                self.expected_opportunity_dict_2])
        self.assertFalse(response['more'])
        self.assertIsInstance(response['next_cursor'], str)

    def test_get_skill_opportunity_data_pagination(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'],
                [self.expected_skill_opportunity_dict_0])
            self.assertTrue(response['more'])
            self.assertIsInstance(response['next_cursor'], str)

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'cursor': next_cursor})

            self.assertEqual(len(next_response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_skill_opportunity_dict_1])
            self.assertFalse(next_response['more'])
            self.assertIsInstance(next_response['next_cursor'], str)

    def test_get_skill_opportunity_data_pagination_multiple_fetches(self):
        # Unassign topic 0 from the classroom.
        config_services.revert_property(
            self.admin_id, 'classroom_pages_data')

        # Create a new topic.
        topic_id = '1'
        topic_name = 'topic1'
        topic = topic_domain.Topic.create_default_topic(
            topic_id, topic_name, 'url-fragment', 'description')
        skill_id_2 = 'skill_id_2'
        skill_id_3 = 'skill_id_3'
        skill_id_4 = 'skill_id_4'
        skill_id_5 = 'skill_id_5'
        self._publish_valid_topic(
            topic, [skill_id_2, skill_id_3, skill_id_4, skill_id_5])

        # Add new topic to a classroom.
        config_services.set_property(
            self.admin_id, 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math-one',
                'topic_ids': [topic_id],
                'course_details': '',
                'topic_list_intro': ''
            }])

        # Opportunities with IDs skill_id_0, skill_id_1, skill_id_2 will be
        # fetched first. Since skill_id_0, skill_id_1 are not linked to a
        # classroom, another fetch will be made to retrieve skill_id_3,
        # skill_id_4, skill_id_5 to fulfill the page size.
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 3):
            response = self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={})
            self.assertEqual(len(response['opportunities']), 4)
            self.assertEqual(
                response['opportunities'],
                [
                    {
                        'id': skill_id_2,
                        'skill_description': 'skill_description',
                        'question_count': 0,
                        'topic_name': topic_name
                    },
                    {
                        'id': skill_id_3,
                        'skill_description': 'skill_description',
                        'question_count': 0,
                        'topic_name': topic_name
                    },
                    {
                        'id': skill_id_4,
                        'skill_description': 'skill_description',
                        'question_count': 0,
                        'topic_name': topic_name
                    },
                    {
                        'id': skill_id_5,
                        'skill_description': 'skill_description',
                        'question_count': 0,
                        'topic_name': topic_name
                    }
                ])
            self.assertFalse(response['more'])
            self.assertIsInstance(response['next_cursor'], str)

    def test_get_translation_opportunity_data_pagination(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi'})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'], [self.expected_opportunity_dict_1])
            self.assertTrue(response['more'])
            self.assertIsInstance(response['next_cursor'], str)

            next_response = self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={
                    'language_code': 'hi',
                    'cursor': response['next_cursor']
                }
            )
            self.assertEqual(len(next_response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_opportunity_dict_2])
            self.assertFalse(next_response['more'])
            self.assertIsInstance(next_response['next_cursor'], str)

    def test_get_voiceover_opportunity_data_pagination(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en'})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'], [self.expected_opportunity_dict_1])
            self.assertTrue(response['more'])
            self.assertIsInstance(response['next_cursor'], str)

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en', 'cursor': next_cursor})

            self.assertEqual(len(next_response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_opportunity_dict_2])
            self.assertFalse(next_response['more'])
            self.assertIsInstance(next_response['next_cursor'], str)

    def test_get_translation_opportunity_with_invalid_language_code(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'invalid_lang_code'},
                expected_status_int=400)

    def test_get_translation_opportunity_without_language_code(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                expected_status_int=400)

    def test_get_voiceover_opportunity_with_invalid_language_code(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'invalid_lang_code'},
                expected_status_int=400)

    def test_get_voiceover_opportunity_without_language_code(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                expected_status_int=400)

    def test_get_opportunity_for_invalid_opportunity_type(self):
        with self.swap(constants, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/invalid_opportunity_type' % (
                    feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL),
                expected_status_int=404)

    def _publish_valid_topic(self, topic, uncategorized_skill_ids):
        """Saves and publishes a valid topic with linked skills and subtopic.

        Args:
            topic: Topic. The topic to be saved and published.
            uncategorized_skill_ids: list(str). List of uncategorized skills IDs
                to add to the supplied topic.
        """
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        subtopic_id = 1
        subtopic_skill_id = 'subtopic_skill_id' + topic.id
        topic.subtopics = [
            topic_domain.Subtopic(
                subtopic_id, 'Title', [subtopic_skill_id], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic')]
        topic.next_subtopic_id = 2
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                subtopic_id, topic.id))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(topic.id, self.admin_id)

        for skill_id in uncategorized_skill_ids:
            self.save_new_skill(
                skill_id, self.admin_id, description='skill_description')
            topic_services.add_uncategorized_skill(
                self.admin_id, topic.id, skill_id)


class TranslatableTextHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ContributionOpportunitiesHandler."""

    def setUp(self):
        super(TranslatableTextHandlerTest, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category='category%d' % i,
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in range(2)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(topic.id, self.admin_id)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in range(2)]

        for index, story in enumerate(stories):
            story.language_code = 'en'
            story_services.save_new_story(self.owner_id, story)
            topic_services.add_canonical_story(
                self.owner_id, topic.id, story.id)
            topic_services.publish_story(topic.id, story.id, self.admin_id)
            story_services.update_story(
                self.owner_id, story.id, [story_domain.StoryChange({
                    'cmd': 'add_story_node',
                    'node_id': 'node_1',
                    'title': 'Node1',
                }), story_domain.StoryChange({
                    'cmd': 'update_story_node_property',
                    'property_name': 'exploration_id',
                    'node_id': 'node_1',
                    'old_value': None,
                    'new_value': explorations[index].id
                })], 'Changes.')

    def test_handler_with_invalid_language_code_raise_exception(self):
        self.get_json('/gettranslatabletexthandler', params={
            'language_code': 'hi',
            'exp_id': '0'
        }, expected_status_int=200)

        self.get_json('/gettranslatabletexthandler', params={
            'language_code': 'invalid_lang_code',
            'exp_id': '0'
        }, expected_status_int=400)

    def test_handler_with_exp_id_not_for_contribution_raise_exception(self):
        self.get_json('/gettranslatabletexthandler', params={
            'language_code': 'hi',
            'exp_id': '0'
        }, expected_status_int=200)

        new_exp = exp_domain.Exploration.create_default_exploration(
            'not_for_contribution')
        exp_services.save_new_exploration(self.owner_id, new_exp)

        self.get_json('/gettranslatabletexthandler', params={
            'language_code': 'hi',
            'exp_id': 'not_for_contribution'
        }, expected_status_int=400)

    def test_handler_returns_correct_data(self):
        exp_services.update_exploration(
            self.owner_id, '0', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content',
                    'html': '<p>A content to translate.</p>'
                }
            })], 'Changes content.')

        output = self.get_json('/gettranslatabletexthandler', params={
            'language_code': 'hi',
            'exp_id': '0'
        })

        expected_output = {
            'version': 2,
            'state_names_to_content_id_mapping': {
                'Introduction': {
                    'content': {
                        'content': (
                            '<p>A content to translate.</p>'),
                        'data_format': 'html',
                        'content_type': 'content',
                        'interaction_id': None,
                        'rule_type': None
                    }
                },
                'End State': {
                    'content': {
                        'content': '',
                        'data_format': 'html',
                        'content_type': 'content',
                        'interaction_id': None,
                        'rule_type': None
                    }
                }
            }
        }

        self.assertEqual(output, expected_output)

    def test_handler_does_not_return_in_review_content(self):
        change_dict = {
            'cmd': 'add_written_translation',
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '',
            'translation_html': '<p>Translation for content.</p>',
            'data_format': 'html'
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            '0', 1, self.owner_id, change_dict, 'description')

        output = self.get_json('/gettranslatabletexthandler', params={
            'language_code': 'hi',
            'exp_id': '0'
        })

        expected_output = {
            'version': 1,
            'state_names_to_content_id_mapping': {
                'End State': {
                    'content': {
                        'content': '',
                        'data_format': 'html',
                        'content_type': 'content',
                        'interaction_id': None,
                        'rule_type': None
                    }
                }
            }
        }
        self.assertEqual(output, expected_output)


class MachineTranslationStateTextsHandlerTests(test_utils.GenericTestBase):
    """Tests for MachineTranslationStateTextsHandler"""

    def setUp(self):
        super(MachineTranslationStateTextsHandlerTests, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.exp_id = exp_fetchers.get_new_exploration_id()
        exp = self.save_new_valid_exploration(
            self.exp_id,
            self.owner_id,
            title='title',
            category='category',
            end_state_name='End State'
        )

        self.publish_exploration(self.owner_id, exp.id)

    def test_handler_with_invalid_language_code_raises_exception(self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'End State',
                'content_ids': '["content"]',
                'target_language_code': 'invalid_language_code'
            }, expected_status_int=400)

        error_msg = (
            'Schema validation for \'target_language_code\' failed: '
            'Validation failed: is_supported_audio_language_code ({}) for '
            'object invalid_language_code')
        self.assertEqual(
            output['error'], error_msg)

    def test_handler_with_no_target_language_code_raises_exception(self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'End State',
                'content_ids': '["content"]',
            }, expected_status_int=400)

        error_msg = 'Missing key in handler args: target_language_code.'
        self.assertEqual(
            output['error'], error_msg)

    def test_handler_with_invalid_exploration_id_returns_not_found(self):
        self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': 'invalid_exploration_id',
                'state_name': 'End State',
                'content_ids': '["content"]',
                'target_language_code': 'es'
            }, expected_status_int=404)

    def test_handler_with_no_exploration_id_raises_exception(self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'state_name': 'End State',
                'content_ids': '["content"]',
                'target_language_code': 'es'
            }, expected_status_int=400)

        error_msg = 'Missing key in handler args: exp_id.'
        self.assertEqual(
            output['error'], error_msg)

    def test_handler_with_invalid_state_name_returns_not_found(self):
        self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'invalid_state_name',
                'content_ids': '["content"]',
                'target_language_code': 'es'
            }, expected_status_int=404)

    def test_handler_with_no_state_name_raises_exception(self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'content_ids': '["content"]',
                'target_language_code': 'es'
            }, expected_status_int=400)

        error_msg = 'Missing key in handler args: state_name.'
        self.assertEqual(
            output['error'], error_msg)

    def test_handler_with_invalid_content_ids_returns_none(self):
        exp_services.update_exploration(
            self.owner_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'End State',
                'new_value': {
                    'content_id': 'content',
                    'html': 'Please continue.'
                }
            })], 'Changes content.')

        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'End State',
                'content_ids': '["invalid_content_id", "content"]',
                'target_language_code': 'es'
            }, expected_status_int=200
        )

        expected_output = {
            'translated_texts': {
                'content': 'Por favor continua.',
                'invalid_content_id': None
            }
        }
        self.assertEqual(output, expected_output)

    def test_handler_with_invalid_content_ids_format_raises_exception(
            self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'End State',
                'content_ids': 'invalid_format',
                'target_language_code': 'es'
            }, expected_status_int=400)
        self.assertEqual(
            output['error'],
            'Improperly formatted content_ids: invalid_format')

    def test_handler_with_empty_content_ids_returns_empty_response_dict(self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'End State',
                'content_ids': '[]',
                'target_language_code': 'es'
            }, expected_status_int=200
        )
        expected_output = {
            'translated_texts': {}
        }
        self.assertEqual(output, expected_output)

    def test_handler_with_missing_content_ids_parameter_raises_exception(self):
        output = self.get_json(
            '/machine_translated_state_texts_handler', params={
                'exp_id': self.exp_id,
                'state_name': 'End State',
                'target_language_code': 'en'
            }, expected_status_int=400
        )

        error_msg = 'Missing key in handler args: content_ids.'
        self.assertEqual(
            output['error'], error_msg)

    def test_handler_with_valid_input_returns_translation(self):
        exp_services.update_exploration(
            self.owner_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content',
                    'html': 'Please continue.'
                }
            })], 'Changes content.')

        output = self.get_json(
            '/machine_translated_state_texts_handler',
            params={
                'exp_id': self.exp_id,
                'state_name': 'Introduction',
                'content_ids': '["content"]',
                'target_language_code': 'es'
            },
            expected_status_int=200
        )

        expected_output = {
            'translated_texts': {'content': 'Por favor continua.'}
        }
        self.assertEqual(output, expected_output)


class UserContributionRightsDataHandlerTest(test_utils.GenericTestBase):
    """Test for the UserContributionRightsDataHandler."""

    def test_guest_user_check_contribution_rights(self):
        response = self.get_json('/usercontributionrightsdatahandler')

        self.assertEqual(
            response, {
                'can_review_translation_for_language_codes': [],
                'can_review_voiceover_for_language_codes': [],
                'can_review_questions': False,
                'can_suggest_questions': False
            })

    def test_user_check_contribution_rights(self):
        user_email = 'user@example.com'
        self.signup(user_email, 'user')
        user_id = self.get_user_id_from_email(user_email)
        self.login(user_email)

        response = self.get_json('/usercontributionrightsdatahandler')
        self.assertEqual(
            response, {
                'can_review_translation_for_language_codes': [],
                'can_review_voiceover_for_language_codes': [],
                'can_review_questions': False,
                'can_suggest_questions': False
            })

        user_services.allow_user_to_review_question(user_id)

        response = self.get_json('/usercontributionrightsdatahandler')
        self.assertEqual(
            response, {
                'can_review_translation_for_language_codes': [],
                'can_review_voiceover_for_language_codes': [],
                'can_review_questions': True,
                'can_suggest_questions': False
            })

    def test_can_suggest_questions_flag_in_response(self):
        user_email = 'user@example.com'
        self.signup(user_email, 'user')
        user_id = self.get_user_id_from_email(user_email)
        self.login(user_email)

        response = self.get_json('/usercontributionrightsdatahandler')
        self.assertEqual(
            response, {
                'can_review_translation_for_language_codes': [],
                'can_review_voiceover_for_language_codes': [],
                'can_review_questions': False,
                'can_suggest_questions': False
            })

        user_services.allow_user_to_submit_question(user_id)

        response = self.get_json('/usercontributionrightsdatahandler')
        self.assertEqual(
            response, {
                'can_review_translation_for_language_codes': [],
                'can_review_voiceover_for_language_codes': [],
                'can_review_questions': False,
                'can_suggest_questions': True
            })


class FeaturedTranslationLanguagesHandlerTest(test_utils.GenericTestBase):
    """Test for the FeaturedTranslationLanguagesHandler."""

    def test_get_featured_translation_languages(self):
        response = self.get_json('/retrivefeaturedtranslationlanguages')
        self.assertEqual(
            response,
            {'featured_translation_languages': []}
        )

        new_value = [
            {'language_code': 'en', 'explanation': 'Partnership with ABC'}
        ]
        config_services.set_property(
            'admin',
            'featured_translation_languages',
            new_value
        )

        response = self.get_json('/retrivefeaturedtranslationlanguages')
        self.assertEqual(
            response,
            {'featured_translation_languages': new_value}
        )


class AllTopicNamesHandlerTest(test_utils.GenericTestBase):
    """Test for the AllTopicNamesHandler."""

    def setUp(self):
        super(AllTopicNamesHandlerTest, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_get_all_topic_names(self):
        response = self.get_json('/getalltopicnames')
        self.assertEqual(
            response,
            {'topic_names': []}
        )

        topic_id = '0'
        topic = topic_domain.Topic.create_default_topic(
            topic_id, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_3'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-three')]
        topic.next_subtopic_id = 2
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(topic_id, self.admin_id)

        response = self.get_json('/getalltopicnames')
        self.assertEqual(
            response,
            {'topic_names': ['topic']}
        )
