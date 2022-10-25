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

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import story_models

(base_models, story_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.STORY
])


class StorySnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            story_models.StorySnapshotContentModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class StoryModelTest(test_utils.GenericTestBase):
    """Tests for Oppia story models."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            story_models.StoryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_export_policy(self) -> None:
        expexted_export_policy_dict = {
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_size_in_bytes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'notes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_contents': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_contents_schema_version': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'corresponding_topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'meta_tag_content': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            story_models.StoryModel.get_export_policy(),
            expexted_export_policy_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            story_models.StoryModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_story_model(self) -> None:
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
            language_code='language_code',
            url_fragment='title')
        story_instance.commit(committer_id, commit_message, commit_cmds)
        story_by_id = story_models.StoryModel.get_by_id('id')

        self.assertEqual(story_by_id.description, 'description')
        self.assertEqual(story_by_id.id, 'id')
        self.assertEqual(story_by_id.notes, 'notes')
        self.assertEqual(story_by_id.language_code, 'language_code')
        self.assertEqual(story_by_id.title, 'title')
        self.assertEqual(story_by_id.url_fragment, 'title')

    def test_get_by_url_fragment(self) -> None:
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
            language_code='language_code',
            url_fragment='unique-url')
        story_instance.commit(committer_id, commit_message, commit_cmds)
        story_by_id = story_models.StoryModel.get_by_url_fragment('unique-url')

        # Ruling out the possibility of None for mypy type checking.
        assert story_by_id is not None
        self.assertEqual(story_by_id.description, 'description')
        self.assertEqual(story_by_id.id, 'id')
        self.assertEqual(story_by_id.notes, 'notes')
        self.assertEqual(story_by_id.language_code, 'language_code')
        self.assertEqual(story_by_id.title, 'title')
        self.assertEqual(story_by_id.url_fragment, 'unique-url')


class StoryCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the StoryCommitLogEntryModel class."""

    def test_get_export_policy(self) -> None:
        expexted_export_policy_dict = {
            'story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_cmds': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_message': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_community_owned': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'post_commit_is_private': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'post_commit_status': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            story_models.StoryCommitLogEntryModel.get_export_policy(),
            expexted_export_policy_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            story_models.StoryCommitLogEntryModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_has_reference_to_user_id(self) -> None:
        commit = story_models.StoryCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.story_id = 'b'
        commit.update_timestamps()
        commit.put()
        self.assertTrue(
            story_models.StoryCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            story_models.StoryCommitLogEntryModel
            .has_reference_to_user_id('x_id'))


class StorySummaryModelTest(test_utils.GenericTestBase):
    """Tests for Oppia story summary models."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            story_models.StorySummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_export_policy(self) -> None:
        expexted_export_policy_dict = {
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_model_last_updated': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'story_model_created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'node_titles': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            story_models.StorySummaryModel.get_export_policy(),
            expexted_export_policy_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            story_models.StorySummaryModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_story_summary_model(self) -> None:
        """Method to test the StorySummaryModel."""

        story_summary_model = story_models.StorySummaryModel(
            id='id',
            title='title',
            description='description',
            story_model_last_updated=datetime.datetime.utcnow(),
            story_model_created_on=datetime.datetime.utcnow(),
            language_code='language_code',
            node_titles=['Chapter 1'],
            thumbnail_filename='image.svg',
            thumbnail_bg_color='#F8BF74',
            version=1,
            url_fragment='story-summary-frag')
        story_summary_model.update_timestamps()
        story_summary_model.put()
        story_summary_by_id = story_models.StorySummaryModel.get_by_id('id')

        self.assertEqual(story_summary_by_id.description, 'description')
        self.assertEqual(story_summary_by_id.title, 'title')
        self.assertEqual(story_summary_by_id.language_code, 'language_code')
        self.assertEqual(story_summary_by_id.node_titles, ['Chapter 1'])
        self.assertEqual(story_summary_by_id.thumbnail_bg_color, '#F8BF74')
        self.assertEqual(story_summary_by_id.thumbnail_filename, 'image.svg')
        self.assertEqual(story_summary_by_id.version, 1)
        self.assertEqual(
            story_summary_by_id.url_fragment, 'story-summary-frag')
