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

"""Tests the methods defined in story fetchers."""

from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(story_models, user_models) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.user])


class StoryFetchersUnitTests(test_utils.GenericTestBase):
    """Test the story fetchers module."""

    STORY_ID = None
    NODE_ID_1 = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2 = 'node_2'
    USER_ID = 'user'
    story = None

    def setUp(self):
        super(StoryFetchersUnitTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, 'Topic', 'A new topic', [], [], [], [],
            0)
        self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes',
            self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, self.STORY_ID)
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Added node.')
        self.story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([user_services.get_username(self.user_id_a)])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)

    def test_get_story_from_model(self):
        story_model = story_models.StoryModel.get(self.STORY_ID)
        story = story_fetchers.get_story_from_model(story_model)

        self.assertEqual(story.to_dict(), self.story.to_dict())

    def test_get_story_summary_from_model(self):
        story_summary_model = story_models.StorySummaryModel.get(self.STORY_ID)
        story_summary = story_fetchers.get_story_summary_from_model(
            story_summary_model)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_count, 1)

    def test_get_story_by_id(self):
        expected_story = self.story.to_dict()
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.to_dict(), expected_story)

    def test_get_story_summary_by_id(self):
        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_count, 1)

    def test_get_node_index_by_story_id_and_node_id(self):
        # Tests correct node index should be returned when story and node exist.
        node_index = story_fetchers.get_node_index_by_story_id_and_node_id(
            self.STORY_ID, self.NODE_ID_1)
        self.assertEqual(node_index, 0)

        # Tests error should be raised if story or node doesn't exist.
        with self.assertRaisesRegexp(
            Exception,
            'Story node with id node_5 does not exist in this story.'):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                self.STORY_ID, 'node_5')

        with self.assertRaisesRegexp(
            Exception, 'Story with id story_id_2 does not exist.'):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                'story_id_2', self.NODE_ID_1)
