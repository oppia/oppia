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

from __future__ import annotations

from core import feconf
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(story_models, user_models) = models.Registry.import_models(
    [models.Names.STORY, models.Names.USER])


class StoryFetchersUnitTests(test_utils.GenericTestBase):
    """Test the story fetchers module."""

    STORY_ID = None
    NODE_ID_1 = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2 = story_domain.NODE_ID_PREFIX + '2'
    USER_ID = 'user'
    story = None

    def setUp(self):
        super(StoryFetchersUnitTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, name='Topic',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        self.save_new_story(
            self.STORY_ID, self.USER_ID, self.TOPIC_ID, url_fragment='story-one'
        )
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
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_topic_managers(
            [user_services.get_username(self.user_id_a)], self.TOPIC_ID)
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin)

    def test_get_story_from_model(self):
        schema_version = feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION - 1
        story_model = story_models.StoryModel.get(self.STORY_ID)
        story_model.story_contents_schema_version = schema_version
        story = story_fetchers.get_story_from_model(story_model)
        self.assertEqual(story.to_dict(), self.story.to_dict())

    def test_get_story_summary_from_model(self):
        story_summary_model = story_models.StorySummaryModel.get(self.STORY_ID)
        story_summary = story_fetchers.get_story_summary_from_model(
            story_summary_model)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(story_summary.thumbnail_bg_color, None)
        self.assertEqual(story_summary.thumbnail_filename, None)

    def test_get_story_summaries_by_id(self):
        story_summaries = story_fetchers.get_story_summaries_by_ids(
            [self.STORY_ID, 'someID'])

        self.assertEqual(len(story_summaries), 1)
        self.assertEqual(story_summaries[0].id, self.STORY_ID)
        self.assertEqual(story_summaries[0].title, 'Title')
        self.assertEqual(story_summaries[0].description, 'Description')
        self.assertEqual(story_summaries[0].language_code, 'en')
        self.assertEqual(story_summaries[0].node_titles, ['Title 1'])
        self.assertEqual(story_summaries[0].thumbnail_filename, None)
        self.assertEqual(story_summaries[0].thumbnail_bg_color, None)
        self.assertEqual(story_summaries[0].version, 2)

    def test_get_latest_completed_node_ids(self):
        self.assertEqual(story_fetchers.get_latest_completed_node_ids(
            self.USER_ID, self.STORY_ID), [])
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.STORY_ID, self.NODE_ID_1)
        self.assertEqual(
            story_fetchers.get_latest_completed_node_ids(
                self.USER_ID, self.STORY_ID),
            [self.NODE_ID_1])

    def test_migrate_story_contents(self):
        story_id = self.STORY_ID
        story_model = story_models.StoryModel.get(story_id)
        versioned_story_contents = {
        'schema_version': story_model.story_contents_schema_version,
        'story_contents': story_model.story_contents
        }
        # Disable protected function for test.
        story_fetchers._migrate_story_contents_to_latest_schema( # pylint: disable=protected-access
            versioned_story_contents, story_id)
        versioned_story_contents[
            'schema_version'
        ] = feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION - 1
        story_fetchers._migrate_story_contents_to_latest_schema( # pylint: disable=protected-access
                versioned_story_contents, story_id
        )
        versioned_story_contents['schema_version'] = 6
        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d story schemas at '
            'present.' % feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION
            ):
            story_fetchers._migrate_story_contents_to_latest_schema( # pylint: disable=protected-access
                versioned_story_contents, story_id
            )

    def test_get_story_by_url_fragment(self):
        story = story_fetchers.get_story_by_url_fragment(
            url_fragment='story-one')
        self.assertEqual(story.id, self.STORY_ID)
        self.assertEqual(story.url_fragment, 'story-one')
        story = story_fetchers.get_story_by_url_fragment(
            url_fragment='fake-story')
        self.assertEqual(story, None)

    def test_get_story_by_id_with_valid_ids_returns_correct_dict(self):
        expected_story = self.story.to_dict()
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.to_dict(), expected_story)

    def test_get_stories_by_ids(self):
        expected_story = self.story.to_dict()
        stories = story_fetchers.get_stories_by_ids([self.STORY_ID])
        self.assertEqual(len(stories), 1)
        self.assertEqual(stories[0].to_dict(), expected_story)

    def test_get_stories_by_ids_for_non_existing_story_returns_none(self):
        non_exiting_story_id = 'invalid_id'
        expected_story = self.story.to_dict()
        stories = story_fetchers.get_stories_by_ids(
            [self.STORY_ID, non_exiting_story_id])
        self.assertEqual(len(stories), 2)
        self.assertEqual(stories[0].to_dict(), expected_story)
        self.assertEqual(stories[1], None)

    def test_get_story_summary_by_id(self):
        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(story_summary.thumbnail_bg_color, None)
        self.assertEqual(story_summary.thumbnail_filename, None)
        with self.swap_to_always_return(
            story_models.StorySummaryModel,
            'get'
            ):
            story_summary = story_fetchers.get_story_summary_by_id('fakeID')
            self.assertEqual(story_summary, None)

    def test_get_completed_node_id(self):
        self.assertEqual(
            story_fetchers.get_completed_node_ids('randomID', 'someID'),
            []
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.STORY_ID, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.STORY_ID, self.NODE_ID_2)
        self.assertEqual(
            story_fetchers.get_completed_node_ids(self.USER_ID, self.STORY_ID),
            [self.NODE_ID_1, self.NODE_ID_2]
        )

    def test_get_pending_and_all_nodes_in_story(self):
        result = story_fetchers.get_pending_and_all_nodes_in_story(
            self.USER_ID, self.STORY_ID
        )
        pending_nodes = result['pending_nodes']
        self.assertEqual(len(pending_nodes), 1)
        self.assertEqual(pending_nodes[0].description, '')
        self.assertEqual(pending_nodes[0].title, 'Title 1')
        self.assertEqual(pending_nodes[0].id, self.NODE_ID_1)
        self.assertEqual(pending_nodes[0].exploration_id, None)

    def test_get_completed_nodes_in_story(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.STORY_ID, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.STORY_ID, self.NODE_ID_2)
        for ind, completed_node in enumerate(
                story_fetchers.get_completed_nodes_in_story(
                    self.USER_ID, self.STORY_ID)):
            self.assertEqual(
                completed_node.to_dict(),
                story.story_contents.nodes[ind].to_dict()
            )

    def test_get_node_index_by_story_id_and_node_id(self):
        # Tests correct node index should be returned when story and node exist.
        node_index = story_fetchers.get_node_index_by_story_id_and_node_id(
            self.STORY_ID, self.NODE_ID_1)
        self.assertEqual(node_index, 0)

        # Tests error should be raised if story or node doesn't exist.
        with self.assertRaisesRegex(
            Exception,
            'Story node with id node_5 does not exist in this story.'):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                self.STORY_ID, 'node_5')

        with self.assertRaisesRegex(
            Exception, 'Story with id story_id_2 does not exist.'):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                'story_id_2', self.NODE_ID_1)
