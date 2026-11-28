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
from core.constants import constants
from core.domain import (
    story_domain,
    story_fetchers,
    story_services,
    topic_fetchers,
    topic_services,
    user_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import story_models, user_models

(story_models, user_models) = models.Registry.import_models(
    [models.Names.STORY, models.Names.USER]
)


class StoryFetchersUnitTests(test_utils.GenericTestBase):
    """Test the story fetchers module."""

    NODE_ID_1: Final = '%s1' % story_domain.NODE_ID_PREFIX
    NODE_ID_2: Final = '%s2' % story_domain.NODE_ID_PREFIX
    EXP_ID_1: Final = 'exp_1'
    EXP_ID_2: Final = 'exp_2'
    USER_ID: Final = 'user'

    def setUp(self) -> None:
        super().setUp()
        self.story_id = story_services.get_new_story_id()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID,
            self.USER_ID,
            name='Topic',
            description='A new topic',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[],
            next_subtopic_id=0,
        )
        self.save_new_story(
            self.story_id, self.USER_ID, self.TOPIC_ID, url_fragment='story-one'
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, self.story_id
        )
        changelist = [
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_ADD_STORY_NODE,
                    'node_id': self.NODE_ID_1,
                    'title': 'Title 1',
                }
            ),
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                    'property_name': (
                        story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                    ),
                    'node_id': self.NODE_ID_1,
                    'old_value': None,
                    'new_value': self.EXP_ID_1,
                }
            ),
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, changelist, 'Added node.'
        )
        self.story = story_fetchers.get_story_by_id(self.story_id)
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL
        )

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_topic_managers(
            [user_services.get_username(self.user_id_a)], self.TOPIC_ID
        )
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin
        )

    def test_get_story_from_model(self) -> None:
        schema_version = feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION - 1
        story_model = story_models.StoryModel.get(self.story_id)
        story_model.story_contents_schema_version = schema_version
        story = story_fetchers.get_story_from_model(story_model)
        node_ids = [node.id for node in self.story.story_contents.nodes]
        self.story.story_contents.arcs = [
            story_domain.Arc('arc_default', 'All Chapters', '', node_ids)
        ]
        self.assertEqual(story.to_dict(), self.story.to_dict())

    def test_get_story_summary_from_model(self) -> None:
        story_summary_model = story_models.StorySummaryModel.get(self.story_id)
        story_summary = story_fetchers.get_story_summary_from_model(
            story_summary_model
        )

        self.assertEqual(story_summary.id, self.story_id)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(story_summary.thumbnail_bg_color, None)
        self.assertEqual(story_summary.thumbnail_filename, None)

    def test_get_story_summaries_by_id(self) -> None:
        story_summaries = story_fetchers.get_story_summaries_by_ids(
            [self.story_id, 'someID']
        )

        self.assertEqual(len(story_summaries), 1)
        self.assertEqual(story_summaries[0].id, self.story_id)
        self.assertEqual(story_summaries[0].title, 'Title')
        self.assertEqual(story_summaries[0].description, 'Description')
        self.assertEqual(story_summaries[0].language_code, 'en')
        self.assertEqual(story_summaries[0].node_titles, ['Title 1'])
        self.assertEqual(story_summaries[0].thumbnail_filename, None)
        self.assertEqual(story_summaries[0].thumbnail_bg_color, None)
        self.assertEqual(story_summaries[0].version, 2)

    def test_migrate_story_contents(self) -> None:
        changelist = [
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_ADD_STORY_NODE,
                    'node_id': self.NODE_ID_2,
                    'title': 'Title 2',
                }
            ),
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                    'property_name': (
                        story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                    ),
                    'node_id': self.NODE_ID_2,
                    'old_value': None,
                    'new_value': self.EXP_ID_2,
                }
            ),
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, changelist, 'Added node.'
        )
        story_id = self.story_id
        story_model = story_models.StoryModel.get(story_id)
        versioned_story_contents: story_domain.VersionedStoryContentsDict = {
            'schema_version': story_model.story_contents_schema_version,
            'story_contents': story_model.story_contents,
        }
        # Disable protected function for test.
        story_fetchers._migrate_story_contents_to_latest_schema(  # pylint: disable=protected-access
            versioned_story_contents, story_id
        )
        versioned_story_contents['schema_version'] = (
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION - 1
        )
        story_fetchers._migrate_story_contents_to_latest_schema(  # pylint: disable=protected-access
            versioned_story_contents, story_id
        )
        versioned_story_contents['schema_version'] = (
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d story schemas at '
            'present.' % feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        ):
            story_fetchers._migrate_story_contents_to_latest_schema(  # pylint: disable=protected-access
                versioned_story_contents, story_id
            )

    def test_get_story_by_url_fragment(self) -> None:
        story = story_fetchers.get_story_by_url_fragment(
            url_fragment='story-one'
        )
        # Ruling out the possibility of None for mypy type checking.
        assert story is not None
        self.assertEqual(story.id, self.story_id)
        self.assertEqual(story.url_fragment, 'story-one')
        story = story_fetchers.get_story_by_url_fragment(
            url_fragment='fake-story'
        )
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
        self,
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'No story model exists for the story_id: invalid_id'
        ):
            story_fetchers.get_stories_by_ids(['invalid_id'], strict=True)

    def test_get_stories_by_ids_for_non_existing_story_returns_none(
        self,
    ) -> None:
        non_exiting_story_id = 'invalid_id'
        expected_story = self.story.to_dict()
        stories = story_fetchers.get_stories_by_ids(
            [self.story_id, non_exiting_story_id]
        )
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
            [self.story_id, 'invalid_story_id']
        )

        # Should return None for invalid story ID.
        self.assertIsNone(all_stories[1])

        user_stories_progress = all_users_stories_progress[self.USER_ID]

        self.assertEqual(len(user_stories_progress), 1)
        assert all_stories[0] is not None
        self.assertEqual(user_stories_progress[0]['id'], self.story_id)
        self.assertEqual(user_stories_progress[0]['completed_node_titles'], [])
        self.assertEqual(
            len(user_stories_progress[0]['all_node_dicts']),
            len(all_stories[0].story_contents.nodes),
        )
        self.assertEqual(user_stories_progress[0]['topic_name'], 'Topic')

        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1
        )

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
            user_stories_progress[0]['completed_node_titles'], ['Title 1']
        )
        self.assertEqual(user_stories_progress[0]['topic_name'], 'Topic')

    def test_get_story_summary_by_id(self) -> None:
        story_summary = story_fetchers.get_story_summary_by_id(self.story_id)
        self.assertEqual(story_summary.id, self.story_id)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(story_summary.thumbnail_bg_color, None)
        self.assertEqual(story_summary.thumbnail_filename, None)
        with self.swap_to_always_return(story_models.StorySummaryModel, 'get'):
            story_summary = story_fetchers.get_story_summary_by_id('fakeID')
            self.assertEqual(story_summary, None)

    def test_get_completed_node_id(self) -> None:
        self.assertEqual(
            story_fetchers.get_completed_node_ids('randomID', 'someID'), []
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_2
        )
        self.assertEqual(
            story_fetchers.get_completed_node_ids(self.USER_ID, self.story_id),
            [self.NODE_ID_1, self.NODE_ID_2],
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
        self.assertEqual(pending_nodes[0].exploration_id, self.EXP_ID_1)

    def test_get_completed_nodes_in_story(self) -> None:
        story = story_fetchers.get_story_by_id(self.story_id)
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_2
        )
        for ind, completed_node in enumerate(
            story_fetchers.get_completed_nodes_in_story(
                self.USER_ID, self.story_id
            )
        ):
            self.assertEqual(
                completed_node.to_dict(),
                story.story_contents.nodes[ind].to_dict(),
            )

    def test_get_node_index_by_story_id_and_node_id(self) -> None:
        # Tests correct node index should be returned when story and node exist.
        node_index = story_fetchers.get_node_index_by_story_id_and_node_id(
            self.story_id, self.NODE_ID_1
        )
        self.assertEqual(node_index, 0)

        # Tests error should be raised if story or node doesn't exist.
        with self.assertRaisesRegex(
            Exception, 'The node with id node_5 is not part of this story.'
        ):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                self.story_id, 'node_5'
            )

        with self.assertRaisesRegex(
            Exception, 'Story with id story_id_2 does not exist.'
        ):
            story_fetchers.get_node_index_by_story_id_and_node_id(
                'story_id_2', self.NODE_ID_1
            )

    def test_get_learner_group_syllabus_story_summaries(self) -> None:
        story_summaries = (
            story_fetchers.get_learner_group_syllabus_story_summaries(
                [self.story_id]
            )
        )

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
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                    'property_name': (
                        story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                    ),
                    'node_id': '%s1' % story_domain.NODE_ID_PREFIX,
                    'old_value': None,
                    'new_value': exp_id_1,
                }
            )
        ]
        story_services.update_story(
            self.USER_ID, self.story_id, change_list, 'Added node.'
        )

        user_services.update_learner_checkpoint_progress(
            learner_id, exp_id_1, 'Introduction', 1
        )

        user_progress = story_fetchers.get_user_progress_in_story_chapters(
            learner_id, [self.story_id]
        )

        self.assertEqual(len(user_progress), 1)
        self.assertEqual(user_progress[0]['exploration_id'], exp_id_1)
        self.assertEqual(user_progress[0]['visited_checkpoints_count'], 1)
        self.assertEqual(user_progress[0]['total_checkpoints_count'], 1)

    def test_get_multiple_stories_by_ids_and_version(self) -> None:
        """Test fetching multiple stories with specific versions."""

        story_1_id = story_services.get_new_story_id()
        self.save_new_story(
            story_1_id,
            self.USER_ID,
            self.TOPIC_ID,
            title='Original Story 1',
            description='Original Description 1',
        )

        story_2_id = story_services.get_new_story_id()
        self.save_new_story(
            story_2_id,
            self.USER_ID,
            self.TOPIC_ID,
            title='Original Story 2',
            description='Original Description 2',
        )

        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_1_id
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_2_id
        )

        story_services.update_story(
            self.USER_ID,
            story_1_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                        'property_name': 'title',
                        'old_value': 'Original Story 1',
                        'new_value': 'Updated Story 1',
                    }
                )
            ],
            'Update story 1 title',
        )

        results = story_fetchers.get_multiple_stories_by_ids_and_version(
            [
                (story_1_id, 1),
                (story_1_id, 2),
                (story_2_id, 1),
                (story_1_id, None),
                ('nonexistent', 1),
            ]
        )

        self.assertEqual(len(results), 5)

        self.assertIsNotNone(results[0])
        assert results[0] is not None
        self.assertEqual(results[0].id, story_1_id)
        self.assertEqual(results[0].title, 'Original Story 1')
        self.assertEqual(results[0].version, 1)

        self.assertIsNotNone(results[1])
        assert results[1] is not None
        self.assertEqual(results[1].id, story_1_id)
        self.assertEqual(results[1].title, 'Updated Story 1')
        self.assertEqual(results[1].version, 2)

        self.assertIsNotNone(results[2])
        assert results[2] is not None
        self.assertEqual(results[2].id, story_2_id)
        self.assertEqual(results[2].title, 'Original Story 2')
        self.assertEqual(results[2].version, 1)

        self.assertIsNotNone(results[3])
        assert results[3] is not None
        self.assertEqual(results[3].id, story_1_id)
        self.assertEqual(results[3].title, 'Updated Story 1')
        self.assertEqual(results[3].version, 2)

        self.assertIsNone(results[4])

    def test_get_multiple_stories_by_ids_and_version_with_invalid_version(
        self,
    ) -> None:
        """Test fetching stories with invalid version numbers."""
        story_id = story_services.get_new_story_id()
        self.save_new_story(story_id, self.USER_ID, self.TOPIC_ID)

        results = story_fetchers.get_multiple_stories_by_ids_and_version(
            [(story_id, 999)]
        )
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0])

    def test_get_multiple_stories_by_ids_and_version_deleted(self) -> None:
        """Test fetching deleted stories returns None."""
        story_id = story_services.get_new_story_id()
        self.save_new_story(story_id, self.USER_ID, self.TOPIC_ID)
        story_services.delete_story(self.USER_ID, story_id)

        results = story_fetchers.get_multiple_stories_by_ids_and_version(
            [(story_id, 1)]
        )
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0])

    def test_get_multiple_stories_by_ids_and_version_empty_list(self) -> None:
        """Test fetching with empty list of IDs."""
        results = story_fetchers.get_multiple_stories_by_ids_and_version([])
        self.assertEqual(results, [])

    def test_get_multiple_stories_by_ids_and_version_schema_versions(
        self,
    ) -> None:
        """Test fetching stories maintains correct schema versions."""
        story_id = story_services.get_new_story_id()
        self.save_new_story(story_id, self.USER_ID, self.TOPIC_ID)

        results = story_fetchers.get_multiple_stories_by_ids_and_version(
            [(story_id, 1)]
        )
        self.assertEqual(len(results), 1)
        self.assertIsNotNone(results[0])
        assert results[0] is not None
        self.assertEqual(
            results[0].story_contents_schema_version,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
        )

    def test_get_multiple_stories_by_ids_and_version_nodes(self) -> None:
        """Test fetching stories with nodes returns correct data."""
        story_id = story_services.get_new_story_id()
        self.save_new_story(story_id, self.USER_ID, self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id
        )
        changelist = [
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_ADD_STORY_NODE,
                    'node_id': self.NODE_ID_1,
                    'title': 'Node 1',
                }
            ),
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_ADD_STORY_NODE,
                    'node_id': self.NODE_ID_2,
                    'title': 'Node 2',
                }
            ),
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                    'property_name': story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID,
                    'node_id': self.NODE_ID_1,
                    'old_value': None,
                    'new_value': 'exp_id_1',
                }
            ),
            story_domain.StoryChange(
                {
                    'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                    'property_name': story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID,
                    'node_id': self.NODE_ID_2,
                    'old_value': None,
                    'new_value': 'exp_id_2',
                }
            ),
        ]
        story_services.update_story(
            self.USER_ID,
            story_id,
            changelist,
            'Added nodes with exploration IDs.',
        )

        results = story_fetchers.get_multiple_stories_by_ids_and_version(
            [(story_id, 2)]
        )
        self.assertEqual(len(results), 1)
        self.assertIsNotNone(results[0])
        assert results[0] is not None

        nodes = results[0].story_contents.nodes
        self.assertEqual(len(nodes), 2)
        self.assertEqual(nodes[0].id, self.NODE_ID_1)
        self.assertEqual(nodes[0].title, 'Node 1')
        self.assertEqual(nodes[1].id, self.NODE_ID_2)
        self.assertEqual(nodes[1].title, 'Node 2')

    def test_get_all_nodes_for_topic_with_published_stories(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_1)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id, self.user_id_admin
        )
        all_nodes = story_fetchers.get_all_nodes_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )
        self.assertEqual(len(all_nodes), 1)
        self.assertEqual(all_nodes[0].id, self.NODE_ID_1)

    def test_get_all_nodes_for_topic_excludes_unpublished_stories(
        self,
    ) -> None:
        all_nodes = story_fetchers.get_all_nodes_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )
        self.assertEqual(len(all_nodes), 0)

    def test_get_all_nodes_for_topic_with_multiple_stories(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_1)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_2)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id, self.user_id_admin
        )
        story_id_2 = story_services.get_new_story_id()
        self.save_new_story(
            story_id_2,
            self.USER_ID,
            self.TOPIC_ID,
            url_fragment='story-two',
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id_2
        )
        story_services.update_story(
            self.USER_ID,
            story_id_2,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': self.NODE_ID_1,
                        'title': 'Title 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': self.NODE_ID_1,
                        'old_value': None,
                        'new_value': self.EXP_ID_2,
                    }
                ),
            ],
            'Added node.',
        )
        topic_services.publish_story(
            self.TOPIC_ID, story_id_2, self.user_id_admin
        )
        all_nodes = story_fetchers.get_all_nodes_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )
        self.assertEqual(len(all_nodes), 1)

    def test_get_all_arcs_with_stories_for_topic(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_1)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id, self.user_id_admin
        )
        story_services.update_story(
            self.USER_ID,
            self.story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': [self.NODE_ID_1],
                    }
                ),
            ],
            'Added arc.',
        )
        arcs_with_stories = story_fetchers.get_all_arcs_with_stories_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )
        self.assertEqual(len(arcs_with_stories), 1)
        story, arc = arcs_with_stories[0]
        self.assertEqual(story.id, self.story_id)
        self.assertEqual(arc.id, 'arc_1')
        self.assertEqual(arc.title, 'Arc 1')
        self.assertEqual(arc.node_ids, [self.NODE_ID_1])

    def test_get_all_arcs_with_stories_returns_correct_story(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_1)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_2)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id, self.user_id_admin
        )
        story_services.update_story(
            self.USER_ID,
            self.story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': [self.NODE_ID_1],
                    }
                ),
            ],
            'Added arc.',
        )

        story_id_2 = story_services.get_new_story_id()
        self.save_new_story(
            story_id_2,
            self.USER_ID,
            self.TOPIC_ID,
            url_fragment='story-two',
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id_2
        )
        story_services.update_story(
            self.USER_ID,
            story_id_2,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': self.NODE_ID_1,
                        'title': 'Title 1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': self.NODE_ID_1,
                        'old_value': None,
                        'new_value': self.EXP_ID_2,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'Same arc id in second story',
                        'node_ids': [self.NODE_ID_1],
                    }
                ),
            ],
            'Added node and arc.',
        )
        topic_services.publish_story(
            self.TOPIC_ID, story_id_2, self.user_id_admin
        )

        arcs_with_stories = story_fetchers.get_all_arcs_with_stories_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )
        self.assertEqual(len(arcs_with_stories), 1)
        first_story, first_arc = arcs_with_stories[0]
        self.assertEqual(first_story.id, self.story_id)
        self.assertEqual(first_arc.id, 'arc_1')

    def test_get_all_arcs_with_stories_excludes_unpublished(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_1)
        story_services.update_story(
            self.USER_ID,
            self.story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'First arc',
                        'node_ids': [self.NODE_ID_1],
                    }
                ),
            ],
            'Added arc.',
        )
        arcs_with_stories = story_fetchers.get_all_arcs_with_stories_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )
        self.assertEqual(len(arcs_with_stories), 0)

    def _add_node_to_story(
        self, story_id: str, node_id: str, title: str, exp_id: str
    ) -> None:
        """Adds a node linked to the given exploration to the given story.

        Args:
            story_id: str. The id of the story to add the node to.
            node_id: str. The id of the new node.
            title: str. The title of the new node.
            exp_id: str. The id of the exploration to link to the node.
        """
        story_services.update_story(
            self.USER_ID,
            story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_ADD_STORY_NODE,
                        'node_id': node_id,
                        'title': title,
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID
                        ),
                        'node_id': node_id,
                        'old_value': None,
                        'new_value': exp_id,
                    }
                ),
            ],
            'Added node.',
        )

    def _publish_two_stories_and_delete_first(self) -> str:
        """Publishes the story from setUp and a second canonical story with
        an arc, then deletes the model of the first story so that its id
        still appears in the topic but no longer resolves to a story.

        Returns:
            str. The id of the second story.
        """
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_1)
        self.save_new_valid_exploration(self.EXP_ID_2, self.user_id_admin)
        self.publish_exploration(self.user_id_admin, self.EXP_ID_2)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id, self.user_id_admin
        )

        story_id_2 = story_services.get_new_story_id()
        self.save_new_story(
            story_id_2, self.USER_ID, self.TOPIC_ID, url_fragment='story-two'
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id_2
        )
        self._add_node_to_story(
            story_id_2, self.NODE_ID_1, 'Story 2 node', self.EXP_ID_2
        )
        story_services.update_story(
            self.USER_ID,
            story_id_2,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_CREATE_ARC,
                        'arc_id': 'arc_1',
                        'title': 'Arc 1',
                        'description': 'Arc in second story',
                        'node_ids': [self.NODE_ID_1],
                    }
                ),
            ],
            'Added arc.',
        )
        topic_services.publish_story(
            self.TOPIC_ID, story_id_2, self.user_id_admin
        )

        story_models.StoryModel.get(self.story_id).delete(
            self.USER_ID, 'Delete first story.'
        )
        return story_id_2

    def test_get_completed_nodes_in_story_skips_uncompleted_nodes(
        self,
    ) -> None:
        self._add_node_to_story(
            self.story_id, self.NODE_ID_2, 'Title 2', self.EXP_ID_2
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_2
        )

        completed_nodes = story_fetchers.get_completed_nodes_in_story(
            self.USER_ID, self.story_id
        )

        self.assertEqual(
            [node.id for node in completed_nodes], [self.NODE_ID_2]
        )

    def test_get_pending_and_all_nodes_excludes_completed_and_draft_nodes(
        self,
    ) -> None:
        self._add_node_to_story(
            self.story_id, self.NODE_ID_2, 'Title 2', self.EXP_ID_2
        )
        story_services.update_story(
            self.USER_ID,
            self.story_id,
            [
                story_domain.StoryChange(
                    {
                        'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                        'property_name': (
                            story_domain.STORY_NODE_PROPERTY_STATUS
                        ),
                        'node_id': self.NODE_ID_1,
                        'old_value': None,
                        'new_value': constants.STORY_NODE_STATUS_PUBLISHED,
                    }
                ),
            ],
            'Published node 1.',
        )
        story_services.record_completed_node_in_story_context(
            self.USER_ID, self.story_id, self.NODE_ID_1
        )

        result = story_fetchers.get_pending_and_all_nodes_in_story(
            self.USER_ID, self.story_id
        )

        # Node 1 is completed, so only node 2 is pending.
        self.assertEqual(
            [node.id for node in result['pending_nodes']], [self.NODE_ID_2]
        )
        # Node 2 is still a draft, so only node 1 is listed in all_nodes.
        self.assertEqual(
            [node.id for node in result['all_nodes']], [self.NODE_ID_1]
        )

    def test_get_user_progress_in_story_chapters_with_no_progress_model(
        self,
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.USER_ID)

        user_progress = story_fetchers.get_user_progress_in_story_chapters(
            'learner_without_progress', [self.story_id]
        )

        self.assertEqual(
            user_progress,
            [
                {
                    'exploration_id': self.EXP_ID_1,
                    'visited_checkpoints_count': 0,
                    'total_checkpoints_count': 1,
                    'is_chapter_complete': False,
                }
            ],
        )

    def test_get_user_progress_in_story_chapters_with_no_checkpoint_reached(
        self,
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_1, self.USER_ID)
        learner_id = 'learner_without_checkpoint'
        user_models.ExplorationUserDataModel.create(
            learner_id, self.EXP_ID_1
        ).put()

        user_progress = story_fetchers.get_user_progress_in_story_chapters(
            learner_id, [self.story_id]
        )

        self.assertEqual(len(user_progress), 1)
        self.assertEqual(user_progress[0]['visited_checkpoints_count'], 0)

    def test_get_user_progress_in_story_chapters_across_multiple_stories(
        self,
    ) -> None:
        exp_id_3 = 'exp_3'
        for exp_id in [self.EXP_ID_1, self.EXP_ID_2, exp_id_3]:
            self.save_new_valid_exploration(exp_id, self.USER_ID)

        story_id_2 = story_services.get_new_story_id()
        self.save_new_story(
            story_id_2, self.USER_ID, self.TOPIC_ID, url_fragment='story-two'
        )
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id_2
        )
        self._add_node_to_story(
            story_id_2, self.NODE_ID_1, 'Story 2 node 1', self.EXP_ID_2
        )
        self._add_node_to_story(
            story_id_2, self.NODE_ID_2, 'Story 2 node 2', exp_id_3
        )
        learner_id = 'learner'
        story_services.record_completed_node_in_story_context(
            learner_id, story_id_2, self.NODE_ID_1
        )
        story_services.record_completed_node_in_story_context(
            learner_id, story_id_2, self.NODE_ID_2
        )

        user_progress = story_fetchers.get_user_progress_in_story_chapters(
            learner_id, [self.story_id, story_id_2]
        )

        # NODE_ID_1 is in both stories but completed only in the second, so
        # exp_1 must stay incomplete while exp_2 is complete. Finding
        # exp_id_3 means searching past the first story and the first node
        # of the second story.
        self.assertEqual(
            [
                (progress['exploration_id'], progress['is_chapter_complete'])
                for progress in user_progress
            ],
            [
                (self.EXP_ID_1, False),
                (self.EXP_ID_2, True),
                (exp_id_3, True),
            ],
        )

    def test_get_all_nodes_for_topic_skips_deleted_story(self) -> None:
        self._publish_two_stories_and_delete_first()

        all_nodes = story_fetchers.get_all_nodes_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )

        self.assertEqual(len(all_nodes), 1)
        self.assertEqual(all_nodes[0].title, 'Story 2 node')

    def test_get_all_arcs_with_stories_for_topic_skips_deleted_story(
        self,
    ) -> None:
        story_id_2 = self._publish_two_stories_and_delete_first()

        arcs_with_stories = story_fetchers.get_all_arcs_with_stories_for_topic(
            topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        )

        self.assertEqual(len(arcs_with_stories), 1)
        story, arc = arcs_with_stories[0]
        self.assertEqual(story.id, story_id_2)
        self.assertEqual(arc.id, 'arc_1')
