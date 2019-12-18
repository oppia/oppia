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

"""Tests for topic domain objects."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicFetchersUnitTests(test_utils.GenericTestBase):
    """Tests for topic fetchers."""
    user_id = 'user_id'
    story_id_1 = 'story_1'
    story_id_2 = 'story_2'
    story_id_3 = 'story_3'
    subtopic_id = 1
    skill_id_1 = 'skill_1'
    skill_id_2 = 'skill_2'

    def setUp(self):
        super(TopicFetchersUnitTests, self).setUp()
        self.TOPIC_ID = topic_services.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1
        })]
        self.save_new_topic(
            self.TOPIC_ID, self.user_id, 'Name', 'abbrev',
            'img.png', 'Description',
            [self.story_id_1, self.story_id_2], [self.story_id_3],
            [self.skill_id_1, self.skill_id_2], [], 1
        )
        self.save_new_story(
            self.story_id_1, self.user_id, 'Title', 'Description', 'Notes',
            self.TOPIC_ID)
        self.save_new_story(
            self.story_id_3, self.user_id, 'Title 3', 'Description 3', 'Notes',
            self.TOPIC_ID)
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist, 'Added a subtopic')

        self.topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.set_admins([self.ADMIN_USERNAME])
        self.set_topic_managers([user_services.get_username(self.user_id_a)])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_b = user_services.UserActionsInfo(self.user_id_b)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)

    def test_get_topic_from_model(self):
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic = topic_fetchers.get_topic_from_model(topic_model)
        self.assertEqual(topic.to_dict(), self.topic.to_dict())

    def test_get_all_topics(self):
        topics = topic_fetchers.get_all_topics()
        self.assertEqual(len(topics), 1)
        self.assertEqual(topics[0].id, self.topic.id)

    def test_cannot_get_topic_from_model_with_invalid_schema_version(self):
        topic_services.create_new_topic_rights('topic_id', self.user_id_a)
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        subtopic_dict = {
            'id': 1,
            'title': 'subtopic_title',
            'skill_ids': []
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name',
            abbreviated_name='abbrev',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d subtopic schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

        topic_services.create_new_topic_rights('topic_id_2', self.user_id_a)
        model = topic_models.TopicModel(
            id='topic_id_2',
            name='name 2',
            abbreviated_name='abbrev',
            canonical_name='canonical_name_2',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=0
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d story reference schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

    def test_get_topic_by_id(self):
        expected_topic = self.topic.to_dict()
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.to_dict(), expected_topic)

    def test_get_topic_by_version(self):
        topic_id = topic_services.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.user_id, 'topic name',
            'abbrev', 'img.png', 'Description', [], [], [], [], 1)

        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': topic_domain.TOPIC_PROPERTY_LANGUAGE_CODE,
            'old_value': 'en',
            'new_value': 'bn'
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id, topic_id, changelist, 'Change language code')

        topic_v0 = topic_fetchers.get_topic_by_id(topic_id, version=0)
        topic_v1 = topic_fetchers.get_topic_by_id(topic_id, version=1)

        self.assertEqual(topic_v1.language_code, 'en')
        self.assertEqual(topic_v0.language_code, 'bn')

    def test_get_topics_by_id(self):
        expected_topic = self.topic.to_dict()
        topics = topic_fetchers.get_topics_by_ids([self.TOPIC_ID])
        self.assertEqual(topics[0].to_dict(), expected_topic)
        self.assertEqual(len(topics), 1)

        topics = topic_fetchers.get_topics_by_ids([self.TOPIC_ID, 'topic'])
        self.assertEqual(topics[0].to_dict(), expected_topic)
        self.assertIsNone(topics[1])
        self.assertEqual(len(topics), 2)

    def test_get_all_topics_with_skills(self):
        expected_topic = self.topic.to_dict()
        topics = topic_fetchers.get_all_topics_with_skills()
        self.assertEqual(topics[0].to_dict(), expected_topic)
        self.assertEqual(len(topics), 1)

    def test_commit_log_entry(self):
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 1)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'create')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id)
