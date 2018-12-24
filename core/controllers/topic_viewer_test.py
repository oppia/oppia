# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for the topic viewer page."""

from constants import constants
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseTopicViewerControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseTopicViewerControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.topic_id = 'topic'
        self.story_id = 'story'
        self.topic_id_1 = 'topic1'

        self.story = story_domain.Story.create_default_story(
            self.story_id, 'story_title')
        self.story.description = 'story_description'
        story_services.save_new_story(self.admin_id, self.story)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id, 'public_topic_name')
        self.topic.canonical_story_ids.append(self.story_id)
        topic_services.save_new_topic(self.admin_id, self.topic)

        self.topic = topic_domain.Topic.create_default_topic(
            self.topic_id_1, 'private_topic_name')
        topic_services.save_new_topic(self.admin_id, self.topic)

        topic_services.publish_topic(self.topic_id, self.admin_id)


class TopicViewerPageTests(BaseTopicViewerControllerTests):

    def test_any_user_can_access_topic_viewer_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_VIEWER_URL_PREFIX, 'public_topic_name'))

            self.assertEqual(response.status_int, 200)

    def test_no_user_can_access_unpublished_topic_viewer_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.TOPIC_VIEWER_URL_PREFIX, 'private_topic_name'),
                expect_errors=True)

            self.assertEqual(response.status_int, 404)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_VIEWER_URL_PREFIX, 'public_topic_name'),
                expect_errors=True)
            self.assertEqual(response.status_int, 404)


class TopicPageDataHandlerTests(BaseTopicViewerControllerTests):

    def test_get(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'public_topic_name'))
            expected_dict = {
                'topic_name': 'public_topic_name',
                'canonical_story_dicts': [{
                    'id': self.story.id,
                    'title': self.story.title,
                    'description': self.story.description
                }],
                'additional_story_dicts': []
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            response = self.testapp.get(
                '%s/%s' % (feconf.TOPIC_DATA_HANDLER, 'public_topic_name'),
                expect_errors=True)
            self.assertEqual(response.status_int, 404)
