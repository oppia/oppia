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
    """Test the TopicModel class."""

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Test the _trusted_commit() method."""

        # Topic is created but not committed/saved.
        topic = topic_models.TopicModel(
            id='topic_id',
            name='topic_name',
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            next_subtopic_id=1,
            language_code='en'
        )
        # We check that topic has not been saved before calling commit().
        self.assertIsNone(topic_models.TopicModel.get_by_name('topic_name'))
        # We call commit() expecting that _trusted_commit works fine
        # and saves topic to datastore.
        topic.commit(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='Created new topic',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        # Now we check that topic is not None and that actually
        # now topic exists, that means that commit() worked fine.
        self.assertIsNotNone(topic_models.TopicModel.get_by_name('topic_name'))

    def test_get_by_name(self):
        topic = topic_domain.Topic.create_default_topic(
            topic_id='topic_id',
            name='topic_test'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)
        self.assertEqual(
            topic_models.TopicModel.get_by_name(topic.name).name,
            topic.name
        )
        self.assertEqual(
            topic_models.TopicModel.get_by_name(topic.name).id,
            topic.id
        )


class TopicCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the TopicCommitLogEntryModel class."""

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and set the instance id equal to the result of calling that method.
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
        topic_commit_log_entry_test_instance_id = 'topic-%s-%s' % (
            'entity_id',
            topic_commit_log_entry.version
        )
        self.assertEqual(
            topic_commit_log_entry.id,
            topic_commit_log_entry_test_instance_id
        )


class SubtopicPageModelUnitTest(test_utils.GenericTestBase):
    """Test the SubtopicPageModelUnitTest class."""

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Test the _trusted_commit() method."""

        # SubtopicPage is created but not committed/saved.
        subtopic_page = topic_models.SubtopicPageModel(
            id='subtopic_page_id',
            topic_id='topic_id',
            html_data='',
            language_code='en'
        )
        # We check that subtopic page has not been saved before calling commit().
        self.assertIsNone(
            topic_models.SubtopicPageModel.get(
                entity_id='subtopic_page_id',
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
                entity_id='subtopic_page_id',
                strict=False
            )
        )


class SubtopicPageCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the SubtopicPageCommitLogEntryModel class."""

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and set the instance id equal to the result of calling that method.
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
        subtopic_page_commit_log_entry_test_instance_id = (
            'subtopicpage-%s-%s' % (
                'entity_id',
                subtopic_page_commit_log_entry.version
            )
        )
        self.assertEqual(
            subtopic_page_commit_log_entry.id,
            subtopic_page_commit_log_entry_test_instance_id
        )
