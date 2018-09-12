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

"""Tests for Oppia story models."""
import datetime

from core.platform import models
from core.tests import test_utils

(story_models, base_models, ) = models.Registry.import_models(
    [models.NAMES.story, models.NAMES.base_model])


class StoryModelTest(test_utils.GenericTestBase):
    """Tests for Oppia story models."""

    def test_story_model(self):
        committer_id = "test_committer_id"
        commit_message = "test_commit_message"
        commit_cmds = [{'cmd': 'test_command'}]

        resp = story_models.StoryModel(
            id='id', title='title',
            description='description',
            notes='notes',
            language_code='language_code')
        resp.commit(committer_id, commit_message, commit_cmds)
        resp = resp.key.get()
        self.assertEqual(resp.description, "description")
        self.assertEqual(resp.title, 'title')


class StorySummaryModelTest(test_utils.GenericTestBase):
    """Tests for Oppia story summary models."""

    def test_story_summary_model(self):

        resp = story_models.StorySummaryModel(
            id='id',
            title='title',
            description='description',
            story_model_last_updated=datetime.datetime.utcnow(),
            story_model_created_on=datetime.datetime.utcnow(),
            language_code='language_code',
            node_count=2,
            version=1)
        resp.put()
        resp = resp.key.get()
        self.assertEqual(resp.description, "description")
        self.assertEqual(resp.title, 'title')
