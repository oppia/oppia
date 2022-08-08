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

"""Tests the methods defined in story services."""

from __future__ import annotations

import logging
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import param_domain
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(story_models, user_models) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.user])


class StoryServicesUnitTests(test_utils.GenericTestBase):
    """Test the story services module."""

    STORY_ID = None
    EXP_ID = 'exp_id'
    NODE_ID_1 = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2 = 'node_2'
    USER_ID = 'user'
    story = None

    def setUp(self):
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        self.STORY_ID = story_services.get_new_story_id()
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        self.topic = self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, name='Topic',
            abbreviated_name='topic-one', url_fragment='topic-one',
            description='A new topic',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=['skill_4'], subtopics=[],
            next_subtopic_id=0)
        self.save_new_story(self.STORY_ID, self.USER_ID, self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, self.STORY_ID)
        self.save_new_valid_exploration(
            self.EXP_ID, self.user_id_admin, end_state_name='End',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_admin, self.EXP_ID)
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': self.EXP_ID
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Added node.')
        self.story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_topic_managers(
            [user_services.get_username(self.user_id_a)], self.TOPIC_ID)
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin)

    def test_compute_summary(self):
        story_summary = story_services.compute_summary_of_story(self.story)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(story_summary.thumbnail_bg_color, None)
        self.assertEqual(story_summary.thumbnail_filename, None)

    def test_get_new_story_id(self):
        new_story_id = story_services.get_new_story_id()

        self.assertEqual(len(new_story_id), 12)
        self.assertEqual(story_models.StoryModel.get_by_id(new_story_id), None)

    def test_commit_log_entry(self):
        story_commit_log_entry = (
            story_models.StoryCommitLogEntryModel.get_commit(self.STORY_ID, 1)
        )
        self.assertEqual(story_commit_log_entry.commit_type, 'create')
        self.assertEqual(story_commit_log_entry.story_id, self.STORY_ID)
        self.assertEqual(story_commit_log_entry.user_id, self.USER_ID)

    def test_update_story_properties(self):
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': story_domain.STORY_PROPERTY_TITLE,
                'old_value': 'Title',
                'new_value': 'New Title'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': story_domain.STORY_PROPERTY_DESCRIPTION,
                'old_value': 'Description',
                'new_value': 'New Description'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': story_domain.STORY_PROPERTY_THUMBNAIL_FILENAME,
                'old_value': None,
                'new_value': 'image.svg'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': (
                    story_domain.STORY_PROPERTY_THUMBNAIL_BG_COLOR),
                'old_value': None,
                'new_value': constants.ALLOWED_THUMBNAIL_BG_COLORS['story'][0]
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': (
                    story_domain.STORY_PROPERTY_META_TAG_CONTENT),
                'old_value': None,
                'new_value': 'new story meta tag content'
            })
        ]

        # Save a dummy image on filesystem, to be used as thumbnail.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, self.STORY_ID)
        fs.commit(
            '%s/image.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Updated Title and Description.')
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.title, 'New Title')
        self.assertEqual(story.description, 'New Description')
        self.assertEqual(story.thumbnail_filename, 'image.svg')
        self.assertEqual(story.thumbnail_size_in_bytes, len(raw_image))
        self.assertEqual(
            story.thumbnail_bg_color,
            constants.ALLOWED_THUMBNAIL_BG_COLORS['story'][0])
        self.assertEqual(story.version, 3)
        self.assertEqual(story.meta_tag_content, 'new story meta tag content')

        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.title, 'New Title')
        self.assertEqual(story_summary.node_titles, ['Title 1'])
        self.assertEqual(
            story_summary.thumbnail_bg_color,
            constants.ALLOWED_THUMBNAIL_BG_COLORS['story'][0])
        self.assertEqual(story_summary.thumbnail_filename, 'image.svg')

    def test_update_published_story(self):
        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
                'property_name': story_domain.STORY_PROPERTY_TITLE,
                'old_value': 'Title',
                'new_value': 'New Title'
            })
        ]
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin
            )
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list,
            'Changed title')
        updated_story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(updated_story.title, 'New Title')

    def test_update_story_node_properties(self):
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2,
                'title': 'Title 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESCRIPTION),
                'node_id': self.NODE_ID_2,
                'old_value': '',
                'new_value': 'Description 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
                'node_id': self.NODE_ID_2,
                'old_value': [],
                'new_value': [self.NODE_ID_1]
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
                'node_id': self.NODE_ID_2,
                'old_value': False,
                'new_value': True
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
                'property_name': (
                    story_domain.INITIAL_NODE_ID),
                'old_value': self.NODE_ID_1,
                'new_value': self.NODE_ID_2
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'node_id': self.NODE_ID_2,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_THUMBNAIL_FILENAME),
                'old_value': None,
                'new_value': 'image.svg'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'node_id': self.NODE_ID_2,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR),
                'old_value': None,
                'new_value': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                    'chapter'][0]
            })
        ]

        # Save a dummy image on filesystem, to be used as thumbnail.
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, self.STORY_ID)
        fs.commit(
            '%s/image.svg' % (constants.ASSET_TYPE_THUMBNAIL), raw_image,
            mimetype='image/svg+xml')

        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist, 'Added story node.')
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(
            story.story_contents.nodes[1].thumbnail_filename, 'image.svg')
        self.assertEqual(
            story.story_contents.nodes[1].thumbnail_size_in_bytes,
            len(raw_image))
        self.assertEqual(
            story.story_contents.nodes[1].thumbnail_bg_color,
            constants.ALLOWED_THUMBNAIL_BG_COLORS['chapter'][0])
        self.assertEqual(
            story.story_contents.nodes[1].destination_node_ids,
            [self.NODE_ID_1])
        self.assertEqual(
            story.story_contents.nodes[1].outline_is_finalized, True)
        self.assertEqual(story.story_contents.nodes[1].title, 'Title 2')
        self.assertEqual(
            story.story_contents.nodes[1].description, 'Description 2')
        self.assertEqual(story.story_contents.initial_node_id, self.NODE_ID_2)
        self.assertEqual(story.story_contents.next_node_id, 'node_3')
        self.assertEqual(story.version, 3)

        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.node_titles, ['Title 1', 'Title 2'])

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_DELETE_STORY_NODE,
                'node_id': self.NODE_ID_1
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
                'node_id': self.NODE_ID_2,
                'old_value': True,
                'new_value': False
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_TITLE),
                'node_id': self.NODE_ID_2,
                'old_value': 'Title 2',
                'new_value': 'Modified title 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESCRIPTION),
                'node_id': self.NODE_ID_2,
                'old_value': 'Description 2',
                'new_value': 'Modified description 2'
            }),
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Removed a story node.')
        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story_summary.node_titles, ['Modified title 2'])
        self.assertEqual(
            story.story_contents.nodes[0].title, 'Modified title 2')
        self.assertEqual(
            story.story_contents.nodes[0].description, 'Modified description 2')
        self.assertEqual(story.story_contents.nodes[0].destination_node_ids, [])
        self.assertEqual(
            story.story_contents.nodes[0].outline_is_finalized, False)

    def test_prerequisite_skills_validation(self):
        self.story.story_contents.next_node_id = 'node_4'
        node_1 = {
            'id': 'node_1',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 1',
            'description': 'Description 1',
            'destination_node_ids': ['node_2', 'node_3'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 2',
            'description': 'Description 2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 3',
            'description': 'Description 3',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': ['skill_4'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.initial_node_id = 'node_1'
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]

        expected_error_string = (
            'The skills with ids skill_4 were specified as prerequisites for '
            'Chapter Title 3, but were not taught in any chapter before it')
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_string):
            story_services.validate_prerequisite_skills_in_story_contents(
                self.topic.get_all_skill_ids(), self.story.story_contents)

    def test_story_with_loop(self):
        self.story.story_contents.next_node_id = 'node_4'
        node_1 = {
            'id': 'node_1',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 1',
            'description': 'Description 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 2',
            'description': 'Description 2',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 3',
            'description': 'Description 3',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        expected_error_string = 'Loops are not allowed in stories.'
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_string):
            story_services.validate_prerequisite_skills_in_story_contents(
                self.topic.get_all_skill_ids(), self.story.story_contents)

    def test_does_story_exist_with_url_fragment(self):
        story_id_1 = story_services.get_new_story_id()
        story_id_2 = story_services.get_new_story_id()
        self.save_new_story(
            story_id_1, self.USER_ID, self.TOPIC_ID, url_fragment='story-one')
        self.save_new_story(
            story_id_2, self.USER_ID, self.TOPIC_ID, url_fragment='story-two')
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id_1)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story_id_2)
        self.assertTrue(
            story_services.does_story_exist_with_url_fragment('story-one'))
        self.assertTrue(
            story_services.does_story_exist_with_url_fragment('story-two'))
        self.assertFalse(
            story_services.does_story_exist_with_url_fragment('story-three'))

    def test_update_story_with_invalid_corresponding_topic_id_value(self):
        topic_id = topic_fetchers.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_story(story_id, self.USER_ID, topic_id)
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]

        with self.assertRaisesRegex(
            Exception, (
                'Expected story to only belong to a valid topic, but '
                'found no topic with ID: %s' % topic_id)):
            story_services.update_story(
                self.USER_ID, story_id, changelist, 'Added node.')

    def test_update_story_which_not_corresponding_topic_id(self):
        topic_id = topic_fetchers.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='A New Topic',
            abbreviated_name='new-topic', url_fragment='new-topic',
            description='A new topic description.',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[], next_subtopic_id=0)
        self.save_new_story(story_id, self.USER_ID, topic_id)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]

        with self.assertRaisesRegex(
            Exception, (
                'Expected story to belong to the topic %s, but it is '
                'neither a part of the canonical stories or the '
                'additional stories of the topic.' % topic_id)):
            story_services.update_story(
                self.USER_ID, story_id, changelist, 'Added node.')

    def test_update_story_schema(self):
        topic_id = topic_fetchers.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='A New Topic',
            abbreviated_name='new-topic', url_fragment='new-topic',
            description='A new topic description.',
            canonical_story_ids=[story_id], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[], next_subtopic_id=0)
        self.save_new_story(story_id, self.USER_ID, topic_id)

        orig_story_dict = story_fetchers.get_story_by_id(story_id).to_dict()

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
                'from_version': 1,
                'to_version': 2,
            })
        ]
        story_services.update_story(
            self.USER_ID, story_id, changelist, 'Update schema.')

        new_story_dict = story_fetchers.get_story_by_id(story_id).to_dict()

        # Check version is updated.
        self.assertEqual(new_story_dict['version'], 2)

        # Delete version and check that the two dicts are the same.
        del orig_story_dict['version']
        del new_story_dict['version']
        self.assertEqual(orig_story_dict, new_story_dict)

    def test_delete_story(self):
        story_services.delete_story(self.USER_ID, self.STORY_ID)
        self.assertEqual(story_fetchers.get_story_by_id(
            self.STORY_ID, strict=False), None)
        self.assertEqual(
            story_fetchers.get_story_summary_by_id(
                self.STORY_ID, strict=False), None)

    def test_cannot_get_story_from_model_with_invalid_schema_version(self):
        story_model = story_models.StoryModel.get(self.STORY_ID)
        story_model.story_contents_schema_version = 0
        story_model.commit(self.USER_ID, 'change schema version', [])

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d story schemas at '
            'present.' % feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
            story_fetchers.get_story_from_model(story_model)

    def test_get_story_summaries_by_ids(self):
        story_summaries = story_fetchers.get_story_summaries_by_ids(
            [self.STORY_ID])

        self.assertEqual(len(story_summaries), 1)
        self.assertEqual(story_summaries[0].id, self.STORY_ID)
        self.assertEqual(story_summaries[0].title, 'Title')
        self.assertEqual(story_summaries[0].description, 'Description')
        self.assertEqual(story_summaries[0].language_code, 'en')
        self.assertEqual(story_summaries[0].node_titles, ['Title 1'])
        self.assertEqual(story_summaries[0].thumbnail_filename, None)
        self.assertEqual(story_summaries[0].thumbnail_bg_color, None)
        self.assertEqual(story_summaries[0].version, 2)

    def test_cannot_update_story_with_non_story_change_changelist(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'Expected change to be of type StoryChange')

        with logging_swap, assert_raises_regexp_context_manager:
            story_services.update_story(
                self.USER_ID, self.STORY_ID, [{}], 'Updated story node.')

        self.assertEqual(
            observed_log_messages,
            [
                'Exception Expected change to be of type StoryChange %s [{}]'
                % self.STORY_ID
            ]
        )

    def test_update_story_node_outline(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.story_contents.nodes[0].outline, '')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_OUTLINE),
            'node_id': 'node_1',
            'old_value': '',
            'new_value': 'new_outline'
        })]

        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story outline.')

        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertEqual(story.story_contents.nodes[0].outline, 'new_outline')

    def test_cannot_update_story_node_outline_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_OUTLINE),
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'new_outline'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story outline.')

    def test_cannot_update_story_with_no_commit_message(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_DESCRIPTION),
            'node_id': self.NODE_ID_1,
            'old_value': '',
            'new_value': 'New description.'
        })]

        with self.assertRaisesRegex(
            Exception,
            'Expected a commit message but received none.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, None)

    def test_update_story_acquired_skill_ids(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.story_contents.nodes[0].acquired_skill_ids, [])

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS),
            'node_id': 'node_1',
            'old_value': [],
            'new_value': ['skill_id']
        })]

        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list,
            'Updated story acquired_skill_ids.')

        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertEqual(
            story.story_contents.nodes[0].acquired_skill_ids, ['skill_id'])

    def test_exploration_context_model_is_modified_correctly(self):
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2,
                'title': 'Title 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
                'node_id': self.NODE_ID_1,
                'old_value': [],
                'new_value': [self.NODE_ID_2]
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Added node.')
        self.save_new_valid_exploration(
            '0', self.user_id_admin, title='Title 1',
            category='Mathematics', language_code='en',
            correctness_feedback_enabled=True)
        self.save_new_valid_exploration(
            '1', self.user_id_admin, title='Title 2',
            category='Mathematics', language_code='en',
            correctness_feedback_enabled=True)
        self.save_new_valid_exploration(
            '2', self.user_id_admin, title='Title 3',
            category='Mathematics', language_code='en',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_admin, '0')
        self.publish_exploration(self.user_id_admin, '1')
        self.publish_exploration(self.user_id_admin, '2')

        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('0'))
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('1'))

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': '0'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_2,
            'old_value': None,
            'new_value': '1'
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('0'), self.STORY_ID)
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('1'), self.STORY_ID)

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_2,
            'old_value': '1',
            'new_value': '2'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_2,
            'old_value': '2',
            'new_value': '1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': '0',
            'new_value': '2'
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('0'))
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('1'), self.STORY_ID)
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('2'), self.STORY_ID)

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': '2',
            'new_value': '0'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_2,
            'old_value': '1',
            'new_value': '2'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': self.NODE_ID_2
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_3',
            'title': 'Title 2'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
            'node_id': self.NODE_ID_1,
            'old_value': [],
            'new_value': ['node_3']
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_3',
            'old_value': None,
            'new_value': '1'
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('0'), self.STORY_ID)
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('1'), self.STORY_ID)
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('2'))

        story_services.delete_story(self.USER_ID, self.STORY_ID)
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('0'))
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('1'))
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('2'))

        self.save_new_story('story_id_2', self.USER_ID, self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, 'story_id_2')

        # Creates node 1 -> node 2 -> node 3, links exp IDs 0, 1 and 2 with them
        # respectively. Then, deletes 2, 3, adds node 4 (node 1 -> node 4),
        # deletes it and adds node 5 (node 1 -> node 5).
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_1',
            'title': 'Title 1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_2',
            'title': 'Title 2'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_3',
            'title': 'Title 3'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
            'node_id': self.NODE_ID_1,
            'old_value': [],
            'new_value': ['node_2']
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
            'node_id': self.NODE_ID_2,
            'old_value': [],
            'new_value': ['node_3']
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': '0'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_2,
            'old_value': None,
            'new_value': '1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_3',
            'old_value': None,
            'new_value': '2'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': self.NODE_ID_2
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': 'node_3'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_4',
            'title': 'Title 4'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_4',
            'old_value': None,
            'new_value': '2'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': 'node_4'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': 'node_5',
            'title': 'Title 5'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
            'node_id': 'node_1',
            'old_value': ['node_2'],
            'new_value': ['node_5']
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': 'node_5',
            'old_value': None,
            'new_value': '1'
        })]
        story_services.update_story(
            self.USER_ID, 'story_id_2', change_list, 'Updated story node.')

        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('0'), 'story_id_2')
        self.assertEqual(
            exp_services.get_story_id_linked_to_exploration('1'), 'story_id_2')
        self.assertIsNone(
            exp_services.get_story_id_linked_to_exploration('2'))

    def test_exploration_story_link_collision(self):
        self.save_new_story('story_id_2', self.USER_ID, self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, 'story_id_2')
        self.save_new_valid_exploration(
            '0', self.user_id_admin, title='Title 1',
            category='Mathematics', language_code='en',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_admin, '0')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': '0'
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_ADD_STORY_NODE,
            'node_id': self.NODE_ID_1,
            'title': 'Title 1'
        }), story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': '0'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The exploration with ID 0 is already linked to story '
            'with ID %s' % self.STORY_ID):
            story_services.update_story(
                self.USER_ID, 'story_id_2', change_list,
                'Added chapter.')

    def test_cannot_update_story_acquired_skill_ids_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS),
            'node_id': 'invalid_node',
            'old_value': [],
            'new_value': ['skill_id']
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story acquired_skill_ids.')

    def test_update_story_notes(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.notes, 'Notes')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'property_name': story_domain.STORY_PROPERTY_NOTES,
            'old_value': 'Notes',
            'new_value': 'New notes'
        })]

        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story notes.')

        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertEqual(story.notes, 'New notes')

    def test_update_story_language_code(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.language_code, 'en')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'property_name': story_domain.STORY_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]

        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list,
            'Updated story language_code.')

        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertEqual(story.language_code, 'bn')

    def test_update_story_url_fragment(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.url_fragment, 'title')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'property_name': story_domain.STORY_PROPERTY_URL_FRAGMENT,
            'old_value': 'title',
            'new_value': 'updated-title'
        })]

        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list,
            'Updated story url_fragment.')

        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertEqual(story.url_fragment, 'updated-title')

    def test_cannot_update_story_if_url_fragment_already_exists(self):
        topic_id = topic_fetchers.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_story(
            story_id, self.USER_ID, topic_id,
            title='original', url_fragment='original')
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'property_name': story_domain.STORY_PROPERTY_URL_FRAGMENT,
            'old_value': 'title',
            'new_value': 'original'
        })]
        exception_message = 'Story Url Fragment is not unique across the site.'
        with self.assertRaisesRegex(Exception, exception_message):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story url_fragment.')

    def test_cannot_update_story_with_no_change_list(self):
        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, [], 'Commit message')

    def test_cannot_update_story_with_invalid_exploration_id(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': 'invalid_exp_id'
        })]

        with self.assertRaisesRegex(
            Exception, 'Expected story to only reference valid explorations'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_validate_exploration_throws_an_exception(self):
        observed_log_messages = []

        def _mock_logging_function(msg):
            """Mocks logging.exception()."""
            observed_log_messages.append(msg)

        def _mock_validate_function(_exploration, _strict):
            """Mocks logging.exception()."""
            raise Exception('Error in exploration')

        logging_swap = self.swap(logging, 'exception', _mock_logging_function)
        validate_fn_swap = self.swap(
            exp_services, 'validate_exploration_for_story',
            _mock_validate_function)
        with logging_swap, validate_fn_swap:
            self.save_new_valid_exploration(
                'exp_id_1', self.user_id_a, title='title',
                category='Algebra', correctness_feedback_enabled=True)
            self.publish_exploration(self.user_id_a, 'exp_id_1')

            with self.assertRaisesRegex(
                Exception, 'Error in exploration'):
                story_services.validate_explorations_for_story(
                    ['exp_id_1'], False)
                self.assertItemsEqual(
                    observed_log_messages, [
                        'Exploration validation failed for exploration with '
                        'ID: exp_id_1. Error: Error in exploration'])

    def test_validate_exploration_returning_error_messages(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            correctness_feedback_enabled=True)
        validation_error_messages = (
            story_services.validate_explorations_for_story(
                ['invalid_exp', 'exp_id_1'], False))
        message_1 = (
            'Expected story to only reference valid explorations, but found '
            'a reference to an invalid exploration with ID: invalid_exp')
        message_2 = (
            'Exploration with ID exp_id_1 is not public. Please publish '
            'explorations before adding them to a story.'
        )
        self.assertEqual(validation_error_messages, [message_1, message_2])

    def test_cannot_update_story_with_private_exploration_id(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            correctness_feedback_enabled=True)
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': 'exp_id_1'
        })]

        with self.assertRaisesRegex(
            Exception, 'Exploration with ID exp_id_1 is not public'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_blank_exp_id(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': self.EXP_ID,
            'new_value': None
        })]

        with self.assertRaisesRegex(
            Exception, 'Story node with id node_1 does not contain an '
            'exploration id.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_different_categories(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        self.save_new_valid_exploration(
            'exp_id_2', self.user_id_a, title='title', category='Reading',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_2')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2,
                'title': 'Title 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
                'node_id': 'node_1',
                'old_value': [],
                'new_value': ['node_2']
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_2,
                'old_value': None,
                'new_value': 'exp_id_2'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(
                ['exp_id_2', 'exp_id_1'], False))

        self.assertEqual(
            validation_error_messages, [
                'All explorations in a story should be of the same category. '
                'The explorations with ID exp_id_2 and exp_id_1 have different '
                'categories.'])
        with self.assertRaisesRegex(
            Exception, 'All explorations in a story should be of the '
            'same category'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_invalid_categories(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Category 1',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(
                ['exp_id_1'], False))

        self.assertEqual(
            validation_error_messages, [
                'All explorations in a story should be of a default category. '
                'The exploration with ID exp_id_1 has an invalid '
                'category Category 1.', 'Expected all explorations in a story '
                'to be of a default category. Invalid exploration: exp_id_1'])
        with self.assertRaisesRegex(
            Exception, 'All explorations in a story should be of a '
                'default category. The exploration with ID exp_id_1 '
                'has an invalid category Category 1.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_other_languages(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            language_code='es', correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(['exp_id_1'], False))
        self.assertEqual(
            validation_error_messages, [
                'Invalid language es found for exploration with ID exp_id_1.'
                ' This language is not supported for explorations in a story'
                ' on the mobile app.'])
        with self.assertRaisesRegex(
            Exception, 'Invalid language es found for exploration with '
            'ID exp_id_1. This language is not supported for explorations '
            'in a story on the mobile app.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_without_correctness_feedback(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            language_code='en')
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(['exp_id_1'], False))
        self.assertEqual(
            validation_error_messages, [
                'Expected all explorations in a story to '
                'have correctness feedback enabled. Invalid '
                'exploration: exp_id_1'])
        with self.assertRaisesRegex(
            Exception, 'Expected all explorations in a story to '
            'have correctness feedback enabled. Invalid exploration: exp_id_1'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_invalid_interactions(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            interaction_id='GraphInput', correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(['exp_id_1'], False))
        self.assertEqual(
            validation_error_messages, [
                'Invalid interaction GraphInput in exploration with ID: '
                'exp_id_1. This interaction is not supported for explorations '
                'in a story on the mobile app.'])
        with self.assertRaisesRegex(
            Exception, 'Invalid interaction GraphInput in exploration with '
            'ID: exp_id_1. This interaction is not supported for explorations '
            'in a story on the mobile app.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_recommended_exps(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            interaction_id='TextInput', end_state_name='End',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        exp_services.update_exploration(
            self.user_id_a, 'exp_id_1', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': (
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                'state_name': 'End',
                'new_value': {
                    'recommendedExplorationIds': {
                        'value': ['1', '2']
                    }
                }
            })], 'Updated State Content')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(['exp_id_1'], False))
        self.assertEqual(
            validation_error_messages, [
                'Explorations in a story are not expected to contain '
                'exploration recommendations. Exploration with ID: exp_id_1 '
                'contains exploration recommendations in its EndExploration '
                'interaction.'])
        with self.assertRaisesRegex(
            Exception, 'Explorations in a story are not expected to contain '
            'exploration recommendations. Exploration with ID: exp_id_1 '
            'contains exploration recommendations in its EndExploration '
            'interaction.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_invalid_rte_content(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            end_state_name='End', correctness_feedback_enabled=True)
        self.publish_exploration(self.user_id_a, 'exp_id_1')
        exp_services.update_exploration(
            self.user_id_a, 'exp_id_1', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content',
                    'html': (
                        '<oppia-noninteractive-collapsible content-with-value='
                        '"&amp;quot;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;'
                        '&amp;quot;" heading-with-value="&amp;quot;'
                        'SubCollapsible&amp;quot;">'
                        '</oppia-noninteractive-collapsible>')
                }
            })],
            'Updated State Content.')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(['exp_id_1'], False))
        self.assertEqual(
            validation_error_messages, [
                'RTE content in state Introduction of exploration with '
                'ID exp_id_1 is not supported on mobile for explorations '
                'in a story.'])
        with self.assertRaisesRegex(
            Exception, 'RTE content in state Introduction of exploration with '
            'ID exp_id_1 is not supported on mobile for explorations '
            'in a story.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_exps_with_parameter_values(self):
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.user_id_admin)
        self.save_new_valid_exploration(
            'exp_id_1', self.user_id_a, title='title', category='Algebra',
            correctness_feedback_enabled=True)
        exp_services.update_exploration(
            self.user_id_a, 'exp_id_1', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_specs',
                'new_value': {
                    'theParameter':
                        param_domain.ParamSpec('UnicodeString').to_dict()
                }
            })],
            '')
        self.publish_exploration(self.user_id_a, 'exp_id_1')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': None,
                'new_value': 'exp_id_1'
            })
        ]

        validation_error_messages = (
            story_services.validate_explorations_for_story(['exp_id_1'], False))
        self.assertEqual(
            validation_error_messages, [
                'Expected no exploration in a story to have parameter '
                'values in it. Invalid exploration: exp_id_1'])
        with self.assertRaisesRegex(
            Exception, 'Expected no exploration in a story to have parameter '
            'values in it. Invalid exploration: exp_id_1'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

        self.save_new_valid_exploration(
            'exp_id_2', self.user_id_a, title='title 2', category='Algebra',
            interaction_id='GraphInput', correctness_feedback_enabled=True)
        exp_services.update_exploration(
            self.user_id_a, 'exp_id_2', [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'param_specs',
                'new_value': {
                    'param1':
                        param_domain.ParamSpec('UnicodeString').to_dict()
                }
            }), exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_PARAM_CHANGES,
                'state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_value': [
                    param_domain.ParamChange('param1', 'Copier', {}).to_dict()]
            })],
            '')
        self.publish_exploration(self.user_id_a, 'exp_id_2')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_1,
                'old_value': 'exp_id_1',
                'new_value': 'exp_id_2'
            })
        ]

        with self.assertRaisesRegex(
            Exception, 'Expected no exploration in a story to have parameter '
            'values in it. Invalid exploration: exp_id_2'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_cannot_update_story_with_mismatch_of_story_versions(self):
        self.save_new_default_exploration(
            'exp_id', self.user_id_a, title='title')
        self.publish_exploration(self.user_id_a, 'exp_id')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': 'exp_id'
        })]

        story_model = story_models.StoryModel.get(self.STORY_ID)
        story_model.version = 0
        story_model.commit(self.user_id_a, 'Changed version', [])

        with self.assertRaisesRegex(
            Exception,
            'Unexpected error: trying to update version 1 of story '
            'from version 2. Please reload the page and try again.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

        story_model = story_models.StoryModel.get(self.STORY_ID)
        story_model.version = 10
        story_model.commit(self.user_id_a, 'Changed version', [])

        with self.assertRaisesRegex(
            Exception,
            'Trying to update version 11 of story from version 2, '
            'which is too old. Please reload the page and try again.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_get_story_by_version(self):
        topic_id = topic_fetchers.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_topic(
            topic_id, self.USER_ID, name='A different topic',
            abbreviated_name='different-topic', url_fragment='different-topic',
            description='A new topic',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[],
            next_subtopic_id=0)
        self.save_new_story(
            story_id, self.USER_ID, topic_id, title='new title')
        topic_services.add_canonical_story(self.USER_ID, topic_id, story_id)

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_PROPERTY,
            'property_name': story_domain.STORY_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]

        story_services.update_story(
            self.USER_ID, story_id, change_list,
            'Updated story language_code.')

        story_v1 = story_fetchers.get_story_by_id(story_id, version=1)
        story_v2 = story_fetchers.get_story_by_id(story_id, version=2)

        self.assertEqual(story_v1.language_code, 'en')
        self.assertEqual(story_v2.language_code, 'bn')

    def test_cannot_update_initial_node_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
            'property_name': story_domain.INITIAL_NODE_ID,
            'old_value': '',
            'new_value': 'new_initial_node_id'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id new_initial_node_id is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story initial_node_id.')

    def test_rearrange_node_in_story(self):
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2,
                'title': 'Title 2'
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist, 'Added story node.')
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.story_contents.nodes[0].id, self.NODE_ID_1)
        self.assertEqual(story.story_contents.nodes[1].id, self.NODE_ID_2)

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
            'property_name': story_domain.NODE,
            'old_value': 1,
            'new_value': 0
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Added story node.')
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.story_contents.nodes[0].id, self.NODE_ID_2)
        self.assertEqual(story.story_contents.nodes[1].id, self.NODE_ID_1)

    def test_cannot_update_node_exploration_id_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID,
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'exp_id'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story node_exploration_id.')

    def test_cannot_update_node_exploration_id_with_existing_exploration_id(
            self):
        self.save_new_default_exploration(
            'exp_id', self.user_id_a, title='title')
        self.publish_exploration(self.user_id_a, 'exp_id')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': 'exp_id'
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

        change_list = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2,
                'title': 'Title 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
                'node_id': self.NODE_ID_1,
                'old_value': [],
                'new_value': [self.NODE_ID_2]
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'node_id': self.NODE_ID_2,
                'old_value': None,
                'new_value': 'exp_id'
            })
        ]

        with self.assertRaisesRegex(
            Exception,
            'A node with exploration id exp_id already exists.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story node_exploration_id.')

    def test_cannot_update_destination_node_ids_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
            'node_id': 'invalid_node',
            'old_value': [],
            'new_value': []
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story new_destination_node_ids.')

    def test_cannot_update_new_prerequisite_skill_ids_with_invalid_node_id(
            self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS),
            'node_id': 'invalid_node',
            'old_value': [],
            'new_value': []
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story new_prerequisite_skill_ids.')

    def test_cannot_mark_node_outline_as_unfinalized_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': ''
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Mark node outline as unfinalized.')

    def test_cannot_mark_node_outline_as_finalized_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'new_value'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Mark node outline as finalized.')

    def test_cannot_update_node_title_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': story_domain.STORY_NODE_PROPERTY_TITLE,
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'new_title'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Update node title.')

    def test_cannot_update_node_description_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': story_domain.STORY_NODE_PROPERTY_DESCRIPTION,
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'new_description'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Update node description.')

    def test_cannot_update_node_thumbnail_filename_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_THUMBNAIL_FILENAME),
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'new_image.svg'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Update node thumbnail filename.')

    def test_cannot_update_node_thumbnail_bg_color_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR),
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': '#F8BF74'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Update node thumbnail bg color.')

    def test_cannot_delete_node_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': 'invalid_node'
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Delete node.')

    def test_cannot_delete_starting_node_of_story(self):
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2,
                'title': 'Title 2'
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS),
                'node_id': self.NODE_ID_2,
                'old_value': [],
                'new_value': [self.NODE_ID_1]
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
                'node_id': self.NODE_ID_2,
                'old_value': False,
                'new_value': True
            }),
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
                'property_name': (
                    story_domain.INITIAL_NODE_ID),
                'old_value': self.NODE_ID_1,
                'new_value': self.NODE_ID_2
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist, 'Added node.')

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': self.NODE_ID_2
        })]

        with self.assertRaisesRegex(
            Exception,
            'The node with id %s is the starting node for the story, '
            'change the starting node before deleting it.' % self.NODE_ID_2):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Delete node.')

    def test_delete_initial_node(self):
        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertEqual(
            story.story_contents.initial_node_id, self.NODE_ID_1)

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': self.NODE_ID_1
        })]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, change_list, 'Delete node.')

        story = story_fetchers.get_story_by_id(self.STORY_ID)

        self.assertIsNone(story.story_contents.initial_node_id)


class StoryProgressUnitTests(test_utils.GenericTestBase):
    """Tests functions which deal with any progress a user has made within a
    story, including query and recording methods related to nodes
    which are completed in the context of the story.
    """

    def _get_progress_model(self, user_id, STORY_ID):
        """Returns the StoryProgressModel corresponding to the story id and user
        id.
        """
        return user_models.StoryProgressModel.get(
            user_id, STORY_ID, strict=False)

    def _record_completion(self, user_id, STORY_ID, node_id):
        """Records the completion of a node in the context of a story."""
        story_services.record_completed_node_in_story_context(
            user_id, STORY_ID, node_id)

    def setUp(self):
        super().setUp()

        self.STORY_1_ID = 'story_id'
        self.STORY_ID_1 = 'story_id_1'
        self.NODE_ID_1 = 'node_1'
        self.NODE_ID_2 = 'node_2'
        self.NODE_ID_3 = 'node_3'
        self.NODE_ID_4 = 'node_4'
        self.USER_ID = 'user'

        self.owner_id = 'owner'
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, name='New Topic',
            abbreviated_name='topic-two', url_fragment='topic-two',
            description='A new topic',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[],
            next_subtopic_id=0)
        story = story_domain.Story.create_default_story(
            self.STORY_1_ID, 'Title', 'Description', self.TOPIC_ID, 'title')

        self.node_1 = {
            'id': self.NODE_ID_1,
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 1',
            'description': 'Description 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_2 = {
            'id': self.NODE_ID_2,
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 2',
            'description': 'Description 2',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_3 = {
            'id': self.NODE_ID_3,
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 3',
            'description': 'Description 3',
            'destination_node_ids': ['node_4'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_4 = {
            'id': self.NODE_ID_4,
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'title': 'Title 4',
            'description': 'Description 4',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1),
            story_domain.StoryNode.from_dict(self.node_2),
            story_domain.StoryNode.from_dict(self.node_3),
            story_domain.StoryNode.from_dict(self.node_4)
        ]
        self.nodes = story.story_contents.nodes
        story.story_contents.initial_node_id = 'node_1'
        story.story_contents.next_node_id = 'node_5'
        story_services.save_new_story(self.USER_ID, story)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, story.id)

    def test_get_completed_node_ids(self):
        # There should be no exception if the user or story do not exist;
        # it should also return an empty list in both of these situations.
        self.assertEqual(story_fetchers.get_completed_node_ids(
            'Fake', self.STORY_1_ID), [])
        self.assertEqual(story_fetchers.get_completed_node_ids(
            self.owner_id, 'Fake'), [])

        # If no model exists, there should be no completed node IDs.
        self.assertIsNone(
            self._get_progress_model(self.owner_id, self.STORY_1_ID))
        self.assertEqual(story_fetchers.get_completed_node_ids(
            self.owner_id, self.STORY_1_ID), [])

        # If the first node is completed, it should be reported.
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
        self.assertEqual(story_fetchers.get_completed_node_ids(
            self.owner_id, self.STORY_1_ID), [self.NODE_ID_1])

        # If all nodes are completed, all of them should be reported.
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_2)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_3)
        self.assertEqual(
            story_fetchers.get_completed_node_ids(
                self.owner_id, self.STORY_1_ID),
            [self.NODE_ID_1, self.NODE_ID_2, self.NODE_ID_3])

    def test_get_latest_completed_node_ids(self):
        self.assertIsNone(
            self._get_progress_model(self.owner_id, self.STORY_1_ID))
        self.assertEqual(story_fetchers.get_latest_completed_node_ids(
            self.owner_id, self.STORY_1_ID), [])

        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
        self.assertEqual(
            story_fetchers.get_latest_completed_node_ids(
                self.owner_id, self.STORY_1_ID),
            [self.NODE_ID_1])
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_2)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_3)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_4)
        self.assertEqual(
            story_fetchers.get_latest_completed_node_ids(
                self.owner_id, self.STORY_1_ID),
            [self.NODE_ID_2, self.NODE_ID_3, self.NODE_ID_4])

    def test_get_latest_completed_node_ids_different_completion_order(self):
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_4)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_3)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_2)

        self.assertEqual(
            story_fetchers.get_latest_completed_node_ids(
                self.owner_id, self.STORY_1_ID),
            [self.NODE_ID_2, self.NODE_ID_3, self.NODE_ID_4])

    def test_get_latest_completed_node_ids_multiple_completions(self):
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_2)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_2)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_3)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_4)

        self.assertEqual(
            story_fetchers.get_latest_completed_node_ids(
                self.owner_id, self.STORY_1_ID),
            [self.NODE_ID_2, self.NODE_ID_3, self.NODE_ID_4])

    def test_get_completed_nodes_in_story(self):
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_2)

        for ind, completed_node in enumerate(
                story_fetchers.get_completed_nodes_in_story(
                    self.owner_id, self.STORY_1_ID)):
            self.assertEqual(
                completed_node.to_dict(), self.nodes[ind].to_dict())

    def test_get_pending_and_all_nodes_in_story(self):
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)

        # The starting index is 1 because the first story node is completed,
        # and the pending nodes will start from the second node.
        for index, pending_node in enumerate(
                story_fetchers.get_pending_and_all_nodes_in_story(
                    self.owner_id, self.STORY_1_ID)['pending_nodes'], start=1):
            self.assertEqual(
                pending_node.to_dict(), self.nodes[index].to_dict())

    def test_record_completed_node_in_story_context(self):
        # Ensure that node completed within the context of a story are
        # recorded correctly. This test actually validates both
        # test_get_completed_node_ids and
        # test_get_next_node_id_to_be_completed_by_user.

        # By default, no completion model should exist for a given user and
        # story.
        completion_model = self._get_progress_model(
            self.owner_id, self.STORY_1_ID)
        self.assertIsNone(completion_model)

        # If the user 'completes an node', the model should record it.
        story_services.record_completed_node_in_story_context(
            self.owner_id, self.STORY_1_ID, self.NODE_ID_1)

        completion_model = self._get_progress_model(
            self.owner_id, self.STORY_1_ID)
        self.assertIsNotNone(completion_model)
        self.assertEqual(
            completion_model.completed_node_ids, [
                self.NODE_ID_1])

        # If the same node is completed again within the context of this
        # story, it should not be duplicated.
        story_services.record_completed_node_in_story_context(
            self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
        completion_model = self._get_progress_model(
            self.owner_id, self.STORY_1_ID)
        self.assertEqual(
            completion_model.completed_node_ids, [
                self.NODE_ID_1])

        # If the same node and another are completed within the context
        # of a different story, it shouldn't affect this one.
        self.save_new_story(self.STORY_ID_1, self.USER_ID, self.TOPIC_ID)
        topic_services.add_canonical_story(
            self.USER_ID, self.TOPIC_ID, self.STORY_ID_1)
        story_services.record_completed_node_in_story_context(
            self.owner_id, self.STORY_ID_1, self.NODE_ID_1)
        story_services.record_completed_node_in_story_context(
            self.owner_id, self.STORY_ID_1, self.NODE_ID_2)
        completion_model = self._get_progress_model(
            self.owner_id, self.STORY_1_ID)
        self.assertEqual(
            completion_model.completed_node_ids, [
                self.NODE_ID_1])

        # If two more nodes are completed, they are recorded.
        story_services.record_completed_node_in_story_context(
            self.owner_id, self.STORY_1_ID, self.NODE_ID_2)
        story_services.record_completed_node_in_story_context(
            self.owner_id, self.STORY_1_ID, self.NODE_ID_3)
        completion_model = self._get_progress_model(
            self.owner_id, self.STORY_1_ID)
        self.assertEqual(
            completion_model.completed_node_ids, [
                self.NODE_ID_1, self.NODE_ID_2, self.NODE_ID_3])


class StoryContentsMigrationTests(test_utils.GenericTestBase):

    def test_migrate_story_contents_to_latest_schema(self):
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        user_id = 'user_id'
        self.save_new_topic(
            topic_id, user_id, name='Topic',
            abbreviated_name='topic-three', url_fragment='topic-three',
            description='A new topic',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[], subtopics=[], next_subtopic_id=0)
        story_model = story_models.StoryModel(
            id=story_id,
            description='Description',
            title='Title',
            language_code='1',
            story_contents_schema_version=1,
            notes='Notes',
            corresponding_topic_id=topic_id,
            story_contents=self.VERSION_1_STORY_CONTENTS_DICT
        )

        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_CONTENTS_SCHEMA_VERSION', 5)

        with current_schema_version_swap:
            story = story_fetchers.get_story_from_model(story_model)

        self.assertEqual(story.story_contents_schema_version, 5)
        self.assertEqual(
            story.story_contents.to_dict(), self.VERSION_5_STORY_CONTENTS_DICT)
