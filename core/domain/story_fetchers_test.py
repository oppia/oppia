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

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import story_models

(story_models,) = models.Registry.import_models([models.Names.STORY])


class StoryFetchersUnitTests(test_utils.GenericTestBase):
    """Test the story fetchers module."""

    NODE_ID_1: Final = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2: Final = story_domain.NODE_ID_PREFIX + '2'
    USER_ID: Final = 'user'

    def setUp(self) -> None:
        super().setUp()
        self.story_id = story_services.get_new_story_id()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, name='Topic',
            description='A new topic', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        self.save_new_story(
            self.story_id, self.USER_ID, self.TOPIC_ID, url_fragment='story-one'
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, self.story_id)
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, changelist,
            'Added node.')
        self.story = story_fetchers.get_story_by_id(self.story_id)
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

    def test_get_story_from_model(self) -> None:
        schema_version = feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION - 1
        story_model = story_models.StoryModel.get(self.story_id)
        story_model.story_contents_schema_version = schema_version
        story = story_fetchers.get_story_from_model(story_model)
        self.assertEqual(story.to_dict(), self.story.to_dict())

    def test_get_story_summary_from_model(self) -> None:
        story_summary_model = story_models.StorySummaryModel.get(self.story_id)
        story_summary = story_fetchers.get_story_summary_from_model(
            story_summary_model)

        self.assertEqual(story_summary.id, self.story_id)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(story_summary.thumbnail_bg_color, None)
        self.assertEqual(story_summary.thumbnail_filename, None)

    def test_get_story_summaries_by_id(self) -> None:
        story_summaries = story_fetchers.get_story_summaries_by_ids(
            [self.story_id, 'someID'])

        self.assertEqual(len(story_summaries), 1)
        self.assertEqual(story_summaries[0].id, self.story_id)
        self.assertEqual(story_summaries[0].title, 'Title')
        self.assertEqual(story_summaries[0].description, 'Description')
        self.assertEqual(story_summaries[0].language_code, 'en')
        self.assertEqual(story_summaries[0].node_titles, ['Title 1'])
        self.assertEqual(story_summaries[0].thumbnail_filename, None)
        self.assertEqual(story_summaries[0].thumbnail_bg_color, None)
        self.assertEqual(story_summaries[0].version, 2)

    def test_get_latest_completed_node_ids(self) -> None:
        self.assertEqual(story_fetchers.get_latest_completed_node_ids(
            self.USER_ID, self.story_id), [])
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1)
        self.assertEqual(
            story_fetchers.get_latest_completed_node_ids(
                self.USER_ID, self.story_id),
            [self.NODE_ID_1])

    def test_migrate_story_contents(self) -> None:
        story_id = self.story_id
        story_model = story_models.StoryModel.get(story_id)
        versioned_story_contents: story_domain.VersionedStoryContentsDict = {
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

    def test_get_story_by_url_fragment(self) -> None:
        story = story_fetchers.get_story_by_url_fragment(
            url_fragment='story-one')
        # Ruling out the possibility of None for mypy type checking.
        assert story is not None
        self.assertEqual(story.id, self.story_id)
        self.assertEqual(story.url_fragment, 'story-one')
        story = story_fetchers.get_story_by_url_fragment(
            url_fragment='fake-story')
        self.assertEqual(story, None)

    def test_get_story_by_id_with_valid_ids_returns_correct_dict(self) -> None:
        expected_story = self.story.to_dict()
        story = story_fetchers.get_story_by_id(self.story_id)
        self.assertEqual(story.to_dict(), expected_story)

    def test_get_stories_by_ids(self) -> None:
        expected_story = self.story.to_dict()
        stories = story_fetchers.get_stories_by_ids([self.story_id])
        # Ruling out the possibility of None for mypy type checking.
        assert stories[0] is not None
        self.assertEqual(len(stories), 1)
        self.assertEqual(stories[0].to_dict(), expected_story)

    def test_raises_error_if_stories_fetched_with_invalid_id_and_strict(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No story model exists for the story_id: invalid_id'
        ):
            story_fetchers.get_stories_by_ids(['invalid_id'], strict=True)

    def test_get_stories_by_ids_for_non_existing_story_returns_none(
        self
    ) -> None:
        non_exiting_story_id = 'invalid_id'
        expected_story = self.story.to_dict()
        stories = story_fetchers.get_stories_by_ids(
            [self.story_id, non_exiting_story_id])
        # Ruling out the possibility of None for mypy type checking.
        assert stories[0] is not None
        self.assertEqual(len(stories), 2)
        self.assertEqual(stories[0].to_dict(), expected_story)
        self.assertEqual(stories[1], None)

    def test_get_multi_users_progress_in_stories(self) -> None:
        all_users_stories_progress = (
            story_fetchers.get_multi_users_progress_in_stories(
                [self.USER_ID], [self.story_id, 'invalid_story_id']
            )
        )
        all_stories = story_fetchers.get_stories_by_ids(
            [self.story_id, 'invalid_story_id'])

        # Should return None for invalid story ID.
        self.assertIsNone(all_stories[1])

        user_stories_progress = all_users_stories_progress[self.USER_ID]

        self.assertEqual(len(user_stories_progress), 1)
        assert all_stories[0] is not None
        self.assertEqual(user_stories_progress[0]['id'], self.story_id)
        self.assertEqual(user_stories_progress[0]['completed_node_titles'], [])
        self.assertEqual(
            len(user_stories_progress[0]['all_node_dicts']),
            len(all_stories[0].story_contents.nodes)
        )
        self.assertEqual(user_stories_progress[0]['topic_name'], 'Topic')

        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1)

        all_users_stories_progress = (
            story_fetchers.get_multi_users_progress_in_stories(
                [self.USER_ID], [self.story_id, 'invalid_story_id']
            )
        )
        user_stories_progress = all_users_stories_progress[self.USER_ID]

        self.assertEqual(len(user_stories_progress), 1)
        # Ruling out the possibility of None for mypy type checking.
        assert user_stories_progress[0] is not None
        self.assertEqual(user_stories_progress[0]['id'], self.story_id)
        self.assertEqual(
            user_stories_progress[0]['completed_node_titles'], ['Title 1'])
        self.assertEqual(user_stories_progress[0]['topic_name'], 'Topic')

    def test_get_story_summary_by_id(self) -> None:
        story_summary = story_fetchers.get_story_summary_by_id(self.story_id)
        self.assertEqual(story_summary.id, self.story_id)
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

    def test_get_completed_node_id(self) -> None:
        self.assertEqual(
            story_fetchers.get_completed_node_ids('randomID', 'someID'),
            []
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_2)
        self.assertEqual(
            story_fetchers.get_completed_node_ids(self.USER_ID, self.story_id),
            [self.NODE_ID_1, self.NODE_ID_2]
        )

    def test_get_pending_and_all_nodes_in_story(self) -> None:
        result = story_fetchers.get_pending_and_all_nodes_in_story(
            self.USER_ID, self.story_id
        )
        pending_nodes = result['pending_nodes']
        self.assertEqual(len(pending_nodes), 1)
        self.assertEqual(pending_nodes[0].description, '')
        self.assertEqual(pending_nodes[0].title, 'Title 1')
        self.assertEqual(pending_nodes[0].id, self.NODE_ID_1)
        self.assertEqual(pending_nodes[0].exploration_id, None)

    def test_get_completed_nodes_in_story(self) -> None:
        story = story_fetchers.get_story_by_id(self.story_id)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_2)
        for ind, completed_node in enumerate(
                story_fetchers.get_completed_nodes_in_story(
                    self.USER_ID, self.story_id)):
            self.assertEqual(
                completed_node.to_dict(),
                story.story_contents.nodes[ind].to_dict()
            )

    def test_get_node_index_by_story_id_and_node_id(self) -> None:
        # Tests correct node index should be returned when story and node exist.
        node_index = story_fetchers.get_node_index_by_story_id_and_node_id(
            self.story_id, self.NODE_ID_1)
        self.assertEqual(node_index, 0)

        # Tests error should be raised if story or node doesn't exist.
        with self.assertRaisesRegex(
            Exception,
            'The node with id node_5 is not part of this story.'):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                self.story_id, 'node_5')

        with self.assertRaisesRegex(
            Exception, 'Story with id story_id_2 does not exist.'):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                'story_id_2', self.NODE_ID_1)

    def test_get_learner_group_syllabus_story_summaries(self) -> None:
        story_summaries = (
            story_fetchers.get_learner_group_syllabus_story_summaries(
                [self.story_id]))

        self.assertEqual(len(story_summaries), 1)
        self.assertEqual(story_summaries[0]['id'], self.story_id)
        self.assertEqual(story_summaries[0]['title'], 'Title')
        self.assertEqual(story_summaries[0]['description'], 'Description')
        self.assertEqual(story_summaries[0]['node_titles'], ['Title 1'])
        self.assertEqual(story_summaries[0]['thumbnail_bg_color'], None)
        self.assertEqual(story_summaries[0]['thumbnail_filename'], None)
        self.assertEqual(story_summaries[0]['topic_name'], 'Topic')

    def test_get_user_progress_in_story_chapters(self) -> None:
        exp_id_1 = 'expid1'
        self.save_new_valid_exploration(exp_id_1, self.USER_ID)

        learner_id = 'learner1'
        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': story_domain.NODE_ID_PREFIX + '1',
                'old_value': None,
                'new_value': exp_id_1
            })
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, change_list,
            'Added node.')

        user_services.update_learner_checkpoint_progress(
            learner_id, exp_id_1, 'Introduction', 1)

        user_progress = story_fetchers.get_user_progress_in_story_chapters(
            learner_id, [self.story_id])

        self.assertEqual(len(user_progress), 1)
        self.assertEqual(user_progress[0]['exploration_id'], exp_id_1)
        self.assertEqual(user_progress[0]['visited_checkpoints_count'], 1)
        self.assertEqual(user_progress[0]['total_checkpoints_count'], 1)
