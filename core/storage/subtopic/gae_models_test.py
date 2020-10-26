# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for subtopic models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import topic_domain
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, subtopic_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.subtopic])


class SubtopicPageModelUnitTest(test_utils.GenericTestBase):
    """Tests the SubtopicPageModel class."""

    SUBTOPIC_PAGE_ID = 'subtopic_page_id'

    def test_get_deletion_policy(self):
        self.assertEqual(
            subtopic_models.SubtopicPageModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            subtopic_models.SubtopicPageModel.has_reference_to_user_id(
                'any_id'))

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Tests the _trusted_commit() method."""

        # SubtopicPage is created but not committed/saved.
        subtopic_page = subtopic_models.SubtopicPageModel(
            id=self.SUBTOPIC_PAGE_ID,
            topic_id='topic_id',
            page_contents={},
            page_contents_schema_version=(
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            language_code='en'
        )
        # We check that subtopic page has not been saved before calling
        # commit().
        self.assertIsNone(
            subtopic_models.SubtopicPageModel.get(
                entity_id=self.SUBTOPIC_PAGE_ID,
                strict=False
            )
        )
        # We call commit() expecting that _trusted_commit works fine
        # and saves subtopic page to datastore.
        subtopic_page.commit(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='Created new topic',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        # Now we check that subtopic page is not None and that actually
        # now subtopic page exists, that means that commit() worked fine.
        self.assertIsNotNone(
            subtopic_models.SubtopicPageModel.get(
                entity_id=self.SUBTOPIC_PAGE_ID,
                strict=False
            )
        )


class SubtopicPageCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Tests the SubtopicPageCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            subtopic_models.SubtopicPageCommitLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = subtopic_models.SubtopicPageCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.subtopic_page_id = 'b'
        commit.update_timestamps()
        commit.put()
        self.assertTrue(
            subtopic_models.SubtopicPageCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            subtopic_models.SubtopicPageCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and sets the instance id equal to the result of calling that method.
        subtopic_page_commit_log_entry = (
            subtopic_models.SubtopicPageCommitLogEntryModel.create(
                entity_id='entity_id',
                version=1,
                committer_id='committer_id',
                commit_type='create',
                commit_message='Created new SubtopicPageCommitLogEntry',
                commit_cmds=[{'cmd': 'create_new'}],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=True
            )
        )
        self.assertEqual(
            subtopic_page_commit_log_entry.id,
            'subtopicpage-entity_id-1'
        )
