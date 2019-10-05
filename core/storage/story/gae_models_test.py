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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
from core.tests import test_utils
import feconf

(base_models, story_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.story])


class StoryModelTest(test_utils.GenericTestBase):
    """Tests for Oppia story models."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            story_models.StoryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_story_model(self):
        """Method to test the StoryModel."""

        committer_id = 'test_committer_id'
        commit_message = 'test_commit_message'
        commit_cmds = [{'cmd': 'test_command'}]

        story_instance = story_models.StoryModel(
            id='id',
            title='title',
            description='description',
            notes='notes',
            story_contents_schema_version=(
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            corresponding_topic_id='topic_id',
            language_code='language_code')
        story_instance.commit(committer_id, commit_message, commit_cmds)
        story_by_id = story_models.StoryModel.get_by_id('id')

        self.assertEqual(story_by_id.description, 'description')
        self.assertEqual(story_by_id.id, 'id')
        self.assertEqual(story_by_id.notes, 'notes')
        self.assertEqual(story_by_id.language_code, 'language_code')
        self.assertEqual(story_by_id.title, 'title')


class StorySummaryModelTest(test_utils.GenericTestBase):
    """Tests for Oppia story summary models."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            story_models.StorySummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_story_summary_model(self):
        """Method to test the StorySummaryModel."""

        story_summary_model = story_models.StorySummaryModel(
            id='id',
            title='title',
            description='description',
            story_model_last_updated=datetime.datetime.utcnow(),
            story_model_created_on=datetime.datetime.utcnow(),
            language_code='language_code',
            node_count=2,
            version=1)
        story_summary_model.put()
        story_summary_by_id = story_models.StorySummaryModel.get_by_id('id')

        self.assertEqual(story_summary_by_id.description, 'description')
        self.assertEqual(story_summary_by_id.title, 'title')
        self.assertEqual(story_summary_by_id.language_code, 'language_code')
        self.assertEqual(story_summary_by_id.node_count, 2)
        self.assertEqual(story_summary_by_id.version, 1)
