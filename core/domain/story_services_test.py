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

from constants import constants
from core.domain import story_domain
from core.domain import story_services
from core.tests import test_utils
import feconf


class StoryServicesUnitTests(test_utils.GenericTestBase):
    """Test the story services module."""

    STORY_ID = None
    USER_ID = 'user'

    def setUp(self):
        super(StoryServicesUnitTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes')

    def test_get_story_by_id(self):
        expected_story = story_domain.Story(
            self.STORY_ID, 'Title', 'Description', 'Notes', [],
            feconf.CURRENT_STORY_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 1
        ).to_dict()
        story = story_services.get_story_by_id(self.STORY_ID)
        self.assertEqual(story.to_dict(), expected_story)

    def test_get_story_summary_by_id(self):
        story_summary = story_services.get_story_summary_by_id(self.STORY_ID)
        self.assertEqual(story_summary.id, self.STORY_ID)
        self.assertEqual(story_summary.title, 'Title')
        self.assertEqual(story_summary.node_count, 0)
