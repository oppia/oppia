# coding: utf-8
#
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

"""Tests for Topic model."""

from constants import constants
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicModelUnitTests(test_utils.GenericTestBase):
    """Tests the TopicModel class."""
    TOPIC_NAME = 'tOpic_NaMe'
    TOPIC_CANONICAL_NAME = 'topic_name'
    TOPIC_ID = 'topic_id'

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Tests the _trusted_commit() method."""

        # Topic is created but not committed/saved.
        topic = topic_models.TopicModel(
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            canonical_name=self.TOPIC_CANONICAL_NAME,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            next_subtopic_id=1,
            language_code='en'
        )
        # We check that topic has not been saved before calling commit().
        self.assertIsNone(topic_models.TopicModel.get_by_name(self.TOPIC_NAME))
        # We call commit() expecting that _trusted_commit works fine
        # and saves topic to datastore.
        topic.commit(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='Created new topic',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        # Now we check that topic is not None and that actually
        # now topic exists, that means that commit() worked fine.
        self.assertIsNotNone(
            topic_models.TopicModel.get_by_name(self.TOPIC_NAME)
        )

    def test_get_by_name(self):
        topic = topic_domain.Topic.create_default_topic(
            topic_id=self.TOPIC_ID,
            name=self.TOPIC_NAME
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.TOPIC_NAME).name,
            self.TOPIC_NAME
        )
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.TOPIC_NAME).id,
            self.TOPIC_ID
        )


class TopicCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Tests the TopicCommitLogEntryModel class."""

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and sets the instance id equal to the result of calling that method.
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.create(
                entity_id='entity_id',
                version=1,
                committer_id='committer_id',
                committer_username='committer_username',
                commit_type='create',
                commit_message='Created new TopicCommitLogEntry',
                commit_cmds=[{'cmd': 'create_new'}],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=True
            )
        )
        self.assertEqual(
            topic_commit_log_entry.id,
            'topic-entity_id-1'
        )


class SubtopicPageModelUnitTest(test_utils.GenericTestBase):
    """Tests the SubtopicPageModelUnitTest class."""
    SUBTOPIC_PAGE_ID = 'subtopic_page_id'

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Tests the _trusted_commit() method."""

        # SubtopicPage is created but not committed/saved.
        subtopic_page = topic_models.SubtopicPageModel(
            id=self.SUBTOPIC_PAGE_ID,
            topic_id='topic_id',
            html_data='',
            language_code='en'
        )
        # We check that subtopic page has not been saved before calling
        # commit().
        self.assertIsNone(
            topic_models.SubtopicPageModel.get(
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
            topic_models.SubtopicPageModel.get(
                entity_id=self.SUBTOPIC_PAGE_ID,
                strict=False
            )
        )


class SubtopicPageCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Tests the SubtopicPageCommitLogEntryModel class."""

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and sets the instance id equal to the result of calling that method.
        subtopic_page_commit_log_entry = (
            topic_models.SubtopicPageCommitLogEntryModel.create(
                entity_id='entity_id',
                version=1,
                committer_id='committer_id',
                committer_username='committer_username',
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
