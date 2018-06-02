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

from core.domain import story_domain
from core.domain import story_services
from core.platform import models
from core.tests import test_utils

(story_models,) = models.Registry.import_models([models.NAMES.story])


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
        self.story = self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes'
        )

    def test_compute_summary(self):
        story_summary = story_services.compute_summary_of_story(self.story)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.node_count, 1)

    def test_get_new_story_id(self):
        new_story_id = story_services.get_new_story_id()

        self.assertEqual(len(new_story_id), 12)
        self.assertEqual(story_models.StoryModel.get_by_id(new_story_id), None)

    def test_get_story_from_model(self):
        story_model = story_models.StoryModel.get(self.STORY_ID)
        story = story_services.get_story_from_model(story_model)

        self.assertEqual(story.to_dict(), self.story.to_dict())

    def test_get_story_summary_from_model(self):
        story_summary_model = story_models.StorySummaryModel.get(self.STORY_ID)
        story_summary = story_services.get_story_summary_from_model(
            story_summary_model)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.node_count, 1)

    def test_get_story_by_id(self):
        expected_story = self.story.to_dict()
        story = story_services.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.to_dict(), expected_story)

    def test_commit_log_entry(self):
        story_commit_log_entry = (
            story_models.StoryCommitLogEntryModel.get_commit(self.STORY_ID, 1)
        )
        self.assertEqual(story_commit_log_entry.commit_type, 'create')
        self.assertEqual(story_commit_log_entry.story_id, self.STORY_ID)
        self.assertEqual(story_commit_log_entry.user_id, self.USER_ID)

    def test_get_story_summary_by_id(self):
        story_summary = story_services.get_story_summary_by_id(self.STORY_ID)

        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.node_count, 1)

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
        story = story_services.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.title, 'New Title')
        self.assertEqual(story.description, 'New Description')
        self.assertEqual(story.version, 2)

        story_summary = story_services.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.title, 'New Title')
        self.assertEqual(story_summary.node_count, 1)

    def test_update_story_node_properties(self):
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': self.NODE_ID_2
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
                'cmd': story_domain.CMD_UPDATE_STORY_CONTENTS_PROPERTY,
                'property_name': (
                    story_domain.INITIAL_NODE_ID),
                'old_value': self.NODE_ID_1,
                'new_value': self.NODE_ID_2
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist, 'Added story node.')
        story = story_services.get_story_by_id(self.STORY_ID)
        self.assertEqual(
            story.story_contents.nodes[1].destination_node_ids,
            [self.NODE_ID_1])
        self.assertEqual(story.story_contents.initial_node_id, self.NODE_ID_2)
        self.assertEqual(story.story_contents.next_node_id, 'node_3')
        self.assertEqual(story.version, 2)

        story_summary = story_services.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.node_count, 2)

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_DELETE_STORY_NODE,
                'node_id': self.NODE_ID_1
            })
        ]
        story_services.update_story(
            self.USER_ID, self.STORY_ID, changelist,
            'Removed a story node.')
        story_summary = story_services.get_story_summary_by_id(self.STORY_ID)
        story = story_services.get_story_by_id(self.STORY_ID)
        self.assertEqual(story_summary.node_count, 1)
        self.assertEqual(story.story_contents.nodes[0].destination_node_ids, [])

    def test_delete_story(self):
        story_services.delete_story(self.USER_ID, self.STORY_ID)
        self.assertEqual(story_services.get_story_by_id(
            self.STORY_ID, False), None)
        self.assertEqual(
            story_services.get_story_summary_by_id(self.STORY_ID, False), None)
