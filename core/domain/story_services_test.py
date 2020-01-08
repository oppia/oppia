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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

import feconf

(story_models, user_models) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.user])


class StoryServicesUnitTests(test_utils.GenericTestBase):
    """Test the story services module."""

    STORY_ID = None
    NODE_ID_1 = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2 = 'node_2'
    USER_ID = 'user'
    story = None

    def setUp(self):
        super(StoryServicesUnitTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, 'Topic', 'abbrev', None,
            'A new topic', [], [], [], [], 0)
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

    def test_compute_summary(self):
        story_summary = story_services.compute_summary_of_story(self.story)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.description, 'Description')
        self.assertEqual(story_summary.node_count, 1)

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
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Updated Title and Description.')
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.title, 'New Title')
        self.assertEqual(story.description, 'New Description')
        self.assertEqual(story.version, 3)

        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.title, 'New Title')
        self.assertEqual(story_summary.node_count, 1)

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
            self.USER_ID, self.STORY_ID, changelist, 'Added story node.')
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(
            story.story_contents.nodes[1].destination_node_ids,
            [self.NODE_ID_1])
        self.assertEqual(
            story.story_contents.nodes[1].outline_is_finalized, True)
        self.assertEqual(story.story_contents.nodes[1].title, 'Title 2')
        self.assertEqual(story.story_contents.initial_node_id, self.NODE_ID_2)
        self.assertEqual(story.story_contents.next_node_id, 'node_3')
        self.assertEqual(story.version, 3)

        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.node_count, 2)

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
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Removed a story node.')
        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
        story = story_fetchers.get_story_by_id(self.STORY_ID)
        self.assertEqual(story_summary.node_count, 1)
        self.assertEqual(
            story.story_contents.nodes[0].title, 'Modified title 2')
        self.assertEqual(story.story_contents.nodes[0].destination_node_ids, [])
        self.assertEqual(
            story.story_contents.nodes[0].outline_is_finalized, False)

    def test_update_story_with_invalid_corresponding_topic_id_value(self):
        topic_id = topic_services.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_story(
            story_id, self.USER_ID, 'Title', 'Description', 'Notes', topic_id)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]

        with self.assertRaisesRegexp(
            Exception, ('Expected story to only belong to a valid topic, but '
                        'found an topic with ID: %s' % topic_id)):
            story_services.update_story(
                self.USER_ID, story_id, changelist, 'Added node.')

    def test_update_story_which_not_corresponding_topic_id(self):
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.USER_ID, 'A New Topic', 'abbrev', None,
            'A new topic description.', [], [], [], [], 0)
        story_id = story_services.get_new_story_id()
        self.save_new_story(
            story_id, self.USER_ID, 'Title', 'Description', 'Notes', topic_id)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_1,
                'title': 'Title 1'
            })
        ]

        with self.assertRaisesRegexp(
            Exception, ('Expected story to belong to the topic %s, but it is '
                        'neither a part of the canonical stories or the '
                        'additional stories of the topic.' % topic_id)):
            story_services.update_story(
                self.USER_ID, story_id, changelist, 'Added node.')

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

        with self.assertRaisesRegexp(
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
        self.assertEqual(story_summaries[0].node_count, 1)
        self.assertEqual(story_summaries[0].version, 2)

    def test_cannot_update_story_with_non_story_change_changelist(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story outline.')

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

    def test_cannot_update_story_acquired_skill_ids_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS),
            'node_id': 'invalid_node',
            'old_value': [],
            'new_value': ['skill_id']
        })]

        with self.assertRaisesRegexp(
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

    def test_cannot_update_story_with_no_change_list(self):
        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: received an invalid change list when trying to '
            'save story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, [], 'Commit message')

    def test_cannot_update_story_with_invalid_exploration_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': (
                story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
            'node_id': self.NODE_ID_1,
            'old_value': None,
            'new_value': 'invalid_exp_id'
        })]

        with self.assertRaisesRegexp(
            Exception, 'Expected story to only reference valid explorations'):
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

        with self.assertRaisesRegexp(
            Exception,
            'Unexpected error: trying to update version 1 of story '
            'from version 2. Please reload the page and try again.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

        story_model = story_models.StoryModel.get(self.STORY_ID)
        story_model.version = 10
        story_model.commit(self.user_id_a, 'Changed version', [])

        with self.assertRaisesRegexp(
            Exception,
            'Trying to update version 11 of story from version 2, '
            'which is too old. Please reload the page and try again.'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Updated story node.')

    def test_get_story_by_version(self):
        topic_id = topic_services.get_new_topic_id()
        story_id = story_services.get_new_story_id()
        self.save_new_topic(
            topic_id, self.USER_ID, 'A different topic', 'abbrev', None,
            'A new topic', [], [], [], [], 0)
        self.save_new_story(
            story_id, self.USER_ID, 'new title', 'Description', 'Notes',
            topic_id)
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

        with self.assertRaisesRegexp(
            Exception,
            'The node with id new_initial_node_id is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list,
                'Updated story initial_node_id.')

    def test_cannot_update_node_exploration_id_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID,
            'node_id': 'invalid_node',
            'old_value': '',
            'new_value': 'exp_id'
        })]

        with self.assertRaisesRegexp(
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

        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
            'property_name': story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID,
            'node_id': self.NODE_ID_1,
            'old_value': '',
            'new_value': 'exp_id'
        })]

        with self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
            Exception,
            'The node with id invalid_node is not part of this story'):
            story_services.update_story(
                self.USER_ID, self.STORY_ID, change_list, 'Update node title.')

    def test_cannot_delete_node_with_invalid_node_id(self):
        change_list = [story_domain.StoryChange({
            'cmd': story_domain.CMD_DELETE_STORY_NODE,
            'node_id': 'invalid_node'
        })]

        with self.assertRaisesRegexp(
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

        with self.assertRaisesRegexp(
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


class StoryProgressUnitTests(StoryServicesUnitTests):
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
        super(StoryProgressUnitTests, self).setUp()

        self.STORY_1_ID = 'story_id'
        self.STORY_ID_1 = 'story_id_1'
        self.NODE_ID_3 = 'node_3'
        self.NODE_ID_4 = 'node_4'

        self.owner_id = 'owner'
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.save_new_topic(
            self.TOPIC_ID, self.USER_ID, 'New Topic', 'abbrev', None,
            'A new topic', [], [], [], [], 0)
        story = story_domain.Story.create_default_story(
            self.STORY_1_ID, 'Title', self.TOPIC_ID)
        story.description = ('Description')
        self.node_1 = {
            'id': self.NODE_ID_1,
            'title': 'Title 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_2 = {
            'id': self.NODE_ID_2,
            'title': 'Title 2',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_3 = {
            'id': self.NODE_ID_3,
            'title': 'Title 3',
            'destination_node_ids': ['node_4'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_4 = {
            'id': self.NODE_ID_4,
            'title': 'Title 4',
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

    def test_get_pending_nodes_in_story(self):
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)

        # The starting index is 1 because the first story node is completed,
        # and the pending nodes will start from the second node.
        for index, pending_node in enumerate(
                story_fetchers.get_pending_nodes_in_story(
                    self.owner_id, self.STORY_1_ID), start=1):
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
        self.story = self.save_new_story(
            self.STORY_ID_1, self.USER_ID, 'Title', 'Description', 'Notes',
            self.TOPIC_ID
        )
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


# TODO(aks681): Remove this mock class and the StoryContentsMigrationTests
# class once the actual functions for story_contents migrations are
# implemented.
class MockStoryObject(story_domain.Story):
    """Mocks Story domain object."""

    @classmethod
    def _convert_story_contents_v1_dict_to_v2_dict(cls, story_contents):
        """Converts v1 story_contents dict to v2."""
        return story_contents


class StoryContentsMigrationTests(test_utils.GenericTestBase):

    def test_migrate_story_contents_to_latest_schema(self):
        story_id = story_services.get_new_story_id()
        topic_id = topic_services.get_new_topic_id()
        user_id = 'user_id'
        self.save_new_topic(
            topic_id, user_id, 'Topic', 'abbrev', None,
            'A new topic', [], [], [], [], 0)
        self.save_new_story(
            story_id, user_id, 'Title', 'Description', 'Notes',
            topic_id)

        story_model = story_models.StoryModel.get(story_id)
        self.assertEqual(story_model.story_contents_schema_version, 1)

        swap_story_object = self.swap(story_domain, 'Story', MockStoryObject)
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_CONTENTS_SCHEMA_VERSION', 2)

        with swap_story_object, current_schema_version_swap:
            story = story_fetchers.get_story_from_model(story_model)

        self.assertEqual(story.story_contents_schema_version, 2)
