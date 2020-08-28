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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf
import python_utils


class ContributorDashboardPageTest(test_utils.GenericTestBase):
    """Test for showing contributor dashboard pages."""

    def test_page_with_disabled_contributor_dashboard_leads_to_404(self):
        with self.swap(feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', False):
            self.get_html_response(
                feconf.CONTRIBUTOR_DASHBOARD_URL, expected_status_int=404)

    def test_page_with_enabled_contributor_dashboard_loads_correctly(self):
        with self.swap(feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True):
            response = self.get_html_response(feconf.CONTRIBUTOR_DASHBOARD_URL)
            response.mustcontain(
                '<contributor-dashboard-page></contributor-dashboard-page>')


class ContributionOpportunitiesHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ContributionOpportunitiesHandler."""

    def setUp(self):
        super(ContributionOpportunitiesHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category='category%d' % i,
            end_state_name='End State'
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic('0', self.admin_id)

        self.skill_id_0 = 'skill_id_0'
        self.skill_id_1 = 'skill_id_1'
        self.skill_ids = [self.skill_id_0, self.skill_id_1]
        for skill_id in self.skill_ids:
            self.save_new_skill(
                skill_id, self.admin_id, description='skill_description')
            topic_services.add_uncategorized_skill(
                self.admin_id, '0', skill_id)

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
        ) for i in python_utils.RANGE(2)]

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
            'translation_counts': {}
        }

        self.expected_opportunity_dict_2 = {
            'id': '1',
            'topic_name': 'topic',
            'story_title': 'title 1',
            'chapter_title': 'Node1',
            'content_count': 2,
            'translation_counts': {}
        }

    def test_handler_with_disabled_dashboard_flag(self):
        with self.swap(feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', False):
            self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={}, expected_status_int=404)

    def test_get_skill_opportunity_data(self):
        with self.swap(feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True):
            response = self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={})

            self.assertEqual(
                response['opportunities'], [
                    self.expected_skill_opportunity_dict_0,
                    self.expected_skill_opportunity_dict_1])

            self.assertFalse(response['more'])
            self.assertTrue(
                isinstance(response['next_cursor'], python_utils.BASESTRING))

    def test_get_translation_opportunity_data(self):
        with self.swap(feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True):
            response = self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi'})

            self.assertEqual(
                response['opportunities'], [
                    self.expected_opportunity_dict_1,
                    self.expected_opportunity_dict_2])

            self.assertFalse(response['more'])
            self.assertTrue(
                isinstance(response['next_cursor'], python_utils.BASESTRING))

    def test_get_voiceover_opportunity_data(self):
        with self.swap(feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True):
            response = self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en'})

            self.assertEqual(len(response['opportunities']), 2)
            self.assertEqual(
                response['opportunities'], [
                    self.expected_opportunity_dict_1,
                    self.expected_opportunity_dict_2])

            self.assertFalse(response['more'])
            self.assertTrue(
                isinstance(response['next_cursor'], python_utils.BASESTRING))

    def test_get_skill_opportunity_data_pagination(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'],
                [self.expected_skill_opportunity_dict_0])
            self.assertTrue(response['more'])
            self.assertTrue(
                isinstance(response['next_cursor'], python_utils.BASESTRING))

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/skill' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'cursor': next_cursor})

            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_skill_opportunity_dict_1])
            self.assertFalse(next_response['more'])
            self.assertTrue(
                isinstance(
                    next_response['next_cursor'], python_utils.BASESTRING))

    def test_get_translation_opportunity_data_pagination(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi'})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'], [self.expected_opportunity_dict_1])
            self.assertTrue(response['more'])
            self.assertTrue(
                isinstance(response['next_cursor'], python_utils.BASESTRING))

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi', 'cursor': next_cursor})

            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_opportunity_dict_2])
            self.assertFalse(next_response['more'])
            self.assertTrue(
                isinstance(
                    next_response['next_cursor'], python_utils.BASESTRING))

    def test_get_voiceover_opportunity_data_pagination(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en'})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'], [self.expected_opportunity_dict_1])
            self.assertTrue(response['more'])
            self.assertTrue(
                isinstance(response['next_cursor'], python_utils.BASESTRING))

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en', 'cursor': next_cursor})

            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_opportunity_dict_2])
            self.assertFalse(next_response['more'])
            self.assertTrue(isinstance(
                next_response['next_cursor'], python_utils.BASESTRING))

    def test_get_translation_opportunity_with_invalid_language_code(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'invalid_lang_code'},
                expected_status_int=400)

    def test_get_translation_opportunity_without_language_code(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/translation' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                expected_status_int=400)

    def test_get_voiceover_opportunity_with_invalid_language_code(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'invalid_lang_code'},
                expected_status_int=400)

    def test_get_voiceover_opportunity_without_language_code(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/voiceover' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
                expected_status_int=400)

    def test_get_opportunity_for_invalid_opportunity_type(self):
        with self.swap(
            feconf, 'CONTRIBUTOR_DASHBOARD_ENABLED', True), self.swap(
                feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/invalid_opportunity_type' % (
                    feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL),
                expected_status_int=404)


class TranslatableTextHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ContributionOpportunitiesHandler."""

    def setUp(self):
        super(TranslatableTextHandlerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            category='category%d' % i,
            end_state_name='End State'
        ) for i in python_utils.RANGE(2)]

        for exp in explorations:
            self.publish_exploration(self.owner_id, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(topic.id, self.admin_id)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d' % i,
            'description %d' % i,
            '0',
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(2)]

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
                    'content': '<p>A content to translate.</p>'
                },
                'End State': {
                    'content': ''
                }
            }
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
                'can_review_questions': False
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
                'can_review_questions': False
            })

        user_services.allow_user_to_review_question(user_id)

        response = self.get_json('/usercontributionrightsdatahandler')
        self.assertEqual(
            response, {
                'can_review_translation_for_language_codes': [],
                'can_review_voiceover_for_language_codes': [],
                'can_review_questions': True
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
