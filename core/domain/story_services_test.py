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
    NODE_ID = 'node_id_1'
    USER_ID = 'user'
    story = None

    def setUp(self):
        super(StoryServicesUnitTests, self).setUp()
        story_node = story_domain.StoryNode.create_default_story_node(
            self.NODE_ID)
        story_contents = story_domain.StoryContents([story_node])
        self.STORY_ID = story_services.get_new_story_id()
        self.story = self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes',
            story_contents
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
