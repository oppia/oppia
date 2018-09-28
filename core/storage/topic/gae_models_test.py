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
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicModelUnitTests(test_utils.GenericTestBase):
    """Test the TopicModel class."""

    def test__trusted_commit(self):
        # Compares topic model class variable (version)
        # assigned in _trusted_commit method.
        self.topic = topic_domain.Topic.create_default_topic(
            topic_id='topic_id',
            name='topic_test'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, self.topic)
        self.assertEqual(self.topic.version, 1)

    def test_get_by_name(self):
        self.topic = topic_domain.Topic.create_default_topic(
            topic_id='topic_id',
            name='topic_test'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, self.topic)
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.topic.name).name,
            self.topic.name
        )
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.topic.name).id,
            self.topic.id
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

    def setUp(self):
        super(SubtopicPageModelUnitTest, self).setUp()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                subtopic_id='subtopic_id',
                topic_id='topic_id'
            )
        )
        subtopic_page_services.save_subtopic_page(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            subtopic_page=self.subtopic_page,
            commit_message='Created new subtopic page',
            change_list=[subtopic_page_domain.SubtopicPageChange(
                {'cmd': subtopic_page_domain.CMD_CREATE_NEW,
                 'topic_id': self.subtopic_page.topic_id})]
        )

    def test__trusted_commit(self):
        # Compares subtopic page model class variable (version)
        # assigned in _trusted_commit method.
        self.assertEqual(self.subtopic_page.version, 1)


class SubtopicPageCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Test the SubtopicPageCommitLogEntryModel class."""

    def setUp(self):
        super(SubtopicPageCommitLogEntryModelUnitTest, self).setUp()
        # Calling create() method calls _get_instance (a protected method)
        # and set the instance id equal to the result of calling that method.
        self.subtopic_page_commit_log_entry = (
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
        self.subtopic_page_commit_log_entry_test_instance_id = (
            'subtopicpage-%s-%s' % (
                'entity_id',
                self.subtopic_page_commit_log_entry.version
            )
        )

    def test__get_instance_id(self):
        self.assertEqual(
            self.subtopic_page_commit_log_entry.id,
            self.subtopic_page_commit_log_entry_test_instance_id
        )
