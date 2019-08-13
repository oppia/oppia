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

"""Tests for the community dashboard controllers."""

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.tests import test_utils
import feconf


class CommunityDashboardPageTest(test_utils.GenericTestBase):
    """Test for showing community dashboard pages."""

    def test_page_with_disabled_community_dashboard_leads_to_404(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', False):
            self.get_html_response(
                feconf.COMMUNITY_DASHBOARD_URL, expected_status_int=404)

    def test_page_with_enabled_community_dashboard_loads_correctly(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True):
            response = self.get_html_response(feconf.COMMUNITY_DASHBOARD_URL)
            response.mustcontain(
                '<community-dashboard-page></community-dashboard-page>')


class ContributionOpportunitiesHandlerTest(test_utils.GenericTestBase):
    """Unit test for the ContributionOpportunitiesHandler."""

    def setUp(self):
        super(ContributionOpportunitiesHandlerTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in xrange(2)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        topic = topic_domain.Topic.create_default_topic(
            topic_id='0', name='topic')
        topic_services.save_new_topic(self.owner_id, topic)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            title='title %d' % i,
            corresponding_topic_id='0'
        ) for i in xrange(2)]

        for index, story in enumerate(stories):
            story.language_code = 'en'
            story_services.save_new_story(self.owner_id, story)
            topic_services.add_canonical_story(
                self.owner_id, topic.id, story.id)
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

    def test_get_translation_opportunity_data(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True):
            response = self.get_json(
                '%s/translation' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi'})

            self.assertEqual(
                response['opportunities'], [
                    self.expected_opportunity_dict_1,
                    self.expected_opportunity_dict_2])

            self.assertFalse(response['more'])
            self.assertTrue(isinstance(response['next_cursor'], basestring))

    def test_get_voiceover_opportunity_data(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True):
            response = self.get_json(
                '%s/voiceover' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en'})

            self.assertEqual(len(response['opportunities']), 2)
            self.assertEqual(
                response['opportunities'], [
                    self.expected_opportunity_dict_1,
                    self.expected_opportunity_dict_2])

            self.assertFalse(response['more'])
            self.assertTrue(isinstance(response['next_cursor'], basestring))

    def test_get_translation_opportunity_data_pagination(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/translation' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi'})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'], [self.expected_opportunity_dict_1])
            self.assertTrue(response['more'])
            self.assertTrue(isinstance(response['next_cursor'], basestring))

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/translation' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'hi', 'cursor': next_cursor})

            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_opportunity_dict_2])
            self.assertFalse(next_response['more'])
            self.assertTrue(
                isinstance(next_response['next_cursor'], basestring))

    def test_get_voiceover_opportunity_data_pagination(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            response = self.get_json(
                '%s/voiceover' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en'})
            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                response['opportunities'], [self.expected_opportunity_dict_1])
            self.assertTrue(response['more'])
            self.assertTrue(isinstance(response['next_cursor'], basestring))

            next_cursor = response['next_cursor']
            next_response = self.get_json(
                '%s/voiceover' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'en', 'cursor': next_cursor})

            self.assertEqual(len(response['opportunities']), 1)
            self.assertEqual(
                next_response['opportunities'],
                [self.expected_opportunity_dict_2])
            self.assertFalse(next_response['more'])
            self.assertTrue(isinstance(
                next_response['next_cursor'], basestring))

    def test_get_translation_opportunity_with_invlaid_language_code(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/translation' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'invalid_lang_code'},
                expected_status_int=400)

    def test_get_translation_opportunity_without_language_code(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/translation' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                expected_status_int=400)

    def test_get_voiceover_opportunity_with_invlaid_language_code(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/voiceover' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                params={'language_code': 'invalid_lang_code'},
                expected_status_int=400)

    def test_get_voiceover_opportunity_without_language_code(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/voiceover' % feconf.COMMUNITY_OPPORTUNITIES_DATA_URL,
                expected_status_int=400)

    def test_get_opportunity_for_invalid_opportunity_type(self):
        with self.swap(feconf, 'COMMUNITY_DASHBOARD_ENABLED', True), self.swap(
            feconf, 'OPPORTUNITIES_PAGE_SIZE', 1):
            self.get_json(
                '%s/invalid_opportunity_type' % (
                    feconf.COMMUNITY_OPPORTUNITIES_DATA_URL),
                expected_status_int=404)
