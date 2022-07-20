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

from __future__ import annotations

from core import feconf
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class MockTopicObject(topic_domain.Topic):
    """Mocks Topic domain object."""

    @classmethod
    def _convert_story_reference_v1_dict_to_v2_dict(cls, story_reference):
        """Converts v1 story reference dict to v2."""
        return story_reference


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
        self.TOPIC_ID = topic_fetchers.get_new_topic_id()
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'title': 'Title',
            'subtopic_id': 1,
            'url_fragment': 'sample-fragment'
        })]
        self.save_new_topic(
            self.TOPIC_ID, self.user_id, name='Name',
            abbreviated_name='name', url_fragment='name-one',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_story(self.story_id_1, self.user_id, self.TOPIC_ID)
        self.save_new_story(
            self.story_id_3,
            self.user_id,
            self.TOPIC_ID,
            title='Title 3',
            description='Description 3')
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist, 'Added a subtopic')

        self.topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_topic_managers(
            [user_services.get_username(self.user_id_a)], self.TOPIC_ID)
        self.user_a = user_services.get_user_actions_info(self.user_id_a)
        self.user_b = user_services.get_user_actions_info(self.user_id_b)
        self.user_admin = user_services.get_user_actions_info(
            self.user_id_admin)

    def test_get_topic_from_model(self):
        topic_model = topic_models.TopicModel.get(self.TOPIC_ID)
        topic = topic_fetchers.get_topic_from_model(topic_model)
        self.assertEqual(topic.to_dict(), self.topic.to_dict())

    def test_get_topic_by_name(self):
        topic = topic_fetchers.get_topic_by_name('Name')
        self.assertEqual(topic.name, 'Name')

    def test_get_topic_rights_is_none(self):
        fake_topic_id = topic_fetchers.get_new_topic_id()
        fake_topic = topic_fetchers.get_topic_rights(
            fake_topic_id, strict=False)
        self.assertIsNone(fake_topic)

    def test_get_topic_by_url_fragment(self):
        topic = topic_fetchers.get_topic_by_url_fragment('name-one')
        self.assertEqual(topic.url_fragment, 'name-one')

    def test_get_all_topic_rights(self):
        topic_rights = topic_fetchers.get_all_topic_rights()
        topic_id_list = [self.TOPIC_ID]
        for topic_key in topic_rights:
            self.assertIn(topic_key, topic_id_list)

    def test_get_canonical_story_dicts(self):
        self.save_new_story(self.story_id_2, self.user_id, self.TOPIC_ID)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id_1, self.user_id_admin)
        topic_services.publish_story(
            self.TOPIC_ID, self.story_id_2, self.user_id_admin)
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)

        canonical_dict_list = (
            topic_fetchers.get_canonical_story_dicts(self.user_id_admin, topic)
        )

        self.assertEqual(len(canonical_dict_list), 2)

        story_dict_1 = {
            'id': 'story_1',
            'title': 'Title',
            'description': 'Description',
            'node_titles': [],
            'thumbnail_bg_color': None,
            'thumbnail_filename': None,
            'url_fragment': 'title',
            'topic_url_fragment': 'name-one',
            'classroom_url_fragment': 'staging',
            'story_is_published': True,
            'completed_node_titles': [], 'all_node_dicts': []}

        story_dict_2 = {
            'id': 'story_2',
            'title': 'Title',
            'description': 'Description',
            'node_titles': [],
            'thumbnail_bg_color': None,
            'thumbnail_filename': None,
            'url_fragment': 'title',
            'topic_url_fragment': 'name-one',
            'classroom_url_fragment': 'staging',
            'story_is_published': True,
            'completed_node_titles': [], 'all_node_dicts': []}

        story_dict_list = [story_dict_1, story_dict_2]
        for canonical_story_dict in canonical_dict_list:
            self.assertIn(canonical_story_dict, story_dict_list)

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
            url_fragment='name-two',
            canonical_name='canonical_name',
            description='description',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=0,
            story_reference_schema_version=0,
            page_title_fragment_for_web='fragm'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d subtopic schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

        topic_services.create_new_topic_rights('topic_id_2', self.user_id_a)
        model = topic_models.TopicModel(
            id='topic_id_2',
            name='name 2',
            description='description 2',
            abbreviated_name='abbrev',
            url_fragment='name-three',
            canonical_name='canonical_name_2',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=0,
            page_title_fragment_for_web='fragm'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d story reference schemas at '
            'present.' % feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION):
            topic_fetchers.get_topic_from_model(model)

    def test_topic_model_migration_to_higher_version(self):
        topic_services.create_new_topic_rights('topic_id', self.user_id_a)
        commit_cmd = topic_domain.TopicChange({
            'cmd': topic_domain.CMD_CREATE_NEW,
            'name': 'name'
        })
        subtopic_v1_dict = {
            'id': 1,
            'title': 'subtopic_title',
            'skill_ids': []
        }
        model = topic_models.TopicModel(
            id='topic_id',
            name='name 2',
            description='description 2',
            abbreviated_name='abbrev',
            url_fragment='name-three',
            canonical_name='canonical_name_2',
            next_subtopic_id=1,
            language_code='en',
            subtopics=[subtopic_v1_dict],
            subtopic_schema_version=1,
            story_reference_schema_version=1,
            page_title_fragment_for_web='fragment'
        )
        commit_cmd_dicts = [commit_cmd.to_dict()]
        model.commit(
            self.user_id_a, 'topic model created', commit_cmd_dicts)
        swap_topic_object = self.swap(topic_domain, 'Topic', MockTopicObject)
        current_story_refrence_schema_version_swap = self.swap(
            feconf, 'CURRENT_STORY_REFERENCE_SCHEMA_VERSION', 2)
        with swap_topic_object, current_story_refrence_schema_version_swap:
            topic = topic_fetchers.get_topic_from_model(model)
            self.assertEqual(topic.story_reference_schema_version, 2)

    def test_get_topic_by_id(self):
        expected_topic = self.topic.to_dict()
        topic = topic_fetchers.get_topic_by_id(self.TOPIC_ID)
        self.assertEqual(topic.to_dict(), expected_topic)
        fake_topic_id = topic_fetchers.get_new_topic_id()
        fake_topic = topic_fetchers.get_topic_by_id(
            fake_topic_id, strict=False)
        self.assertIsNone(fake_topic)

    def test_get_topic_by_version(self):
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.user_id, name='topic name',
            abbreviated_name='topic-name', url_fragment='topic-name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=1)

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

    def test_get_all_topic_rights_of_user(self):
        topic_rights = topic_fetchers.get_topic_rights_with_user(self.user_id_a)

        self.assertEqual(len(topic_rights), 1)
        self.assertEqual(topic_rights[0].id, self.TOPIC_ID)
        self.assertEqual(topic_rights[0].manager_ids, [self.user_id_a])

    def test_commit_log_entry(self):
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.get_commit(self.TOPIC_ID, 1)
        )
        self.assertEqual(topic_commit_log_entry.commit_type, 'create')
        self.assertEqual(topic_commit_log_entry.topic_id, self.TOPIC_ID)
        self.assertEqual(topic_commit_log_entry.user_id, self.user_id)

    def test_get_all_summaries(self):
        topic_summaries = topic_fetchers.get_all_topic_summaries()

        self.assertEqual(len(topic_summaries), 1)
        self.assertEqual(topic_summaries[0].name, 'Name')
        self.assertEqual(topic_summaries[0].canonical_story_count, 0)
        self.assertEqual(topic_summaries[0].additional_story_count, 0)
        self.assertEqual(topic_summaries[0].total_skill_count, 2)
        self.assertEqual(topic_summaries[0].uncategorized_skill_count, 2)
        self.assertEqual(topic_summaries[0].subtopic_count, 1)

    def test_get_multi_summaries(self):
        topic_summaries = topic_fetchers.get_multi_topic_summaries([
            self.TOPIC_ID, 'invalid_id'])

        self.assertEqual(len(topic_summaries), 2)
        self.assertEqual(topic_summaries[0].name, 'Name')
        self.assertEqual(topic_summaries[0].description, 'Description')
        self.assertEqual(topic_summaries[0].canonical_story_count, 0)
        self.assertEqual(topic_summaries[0].additional_story_count, 0)
        self.assertEqual(topic_summaries[0].total_skill_count, 2)
        self.assertEqual(topic_summaries[0].uncategorized_skill_count, 2)
        self.assertEqual(topic_summaries[0].subtopic_count, 1)
        self.assertIsNone(topic_summaries[1])

    def test_get_published_summaries(self):
        # Unpublished topics should not be returned.
        topic_summaries = topic_fetchers.get_published_topic_summaries()
        self.assertEqual(len(topic_summaries), 0)

        # Publish the topic.
        changelist = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': self.subtopic_id,
            'skill_id': self.skill_id_1
        }), topic_domain.TopicChange({
            'cmd': topic_domain.CMD_UPDATE_TOPIC_PROPERTY,
            'property_name': (
                topic_domain.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST),
            'old_value': [],
            'new_value': [self.skill_id_1]
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, changelist,
            'Updated subtopic skill ids.')
        topic_services.publish_topic(self.TOPIC_ID, self.user_id_admin)

        topic_summaries = topic_fetchers.get_published_topic_summaries()

        self.assertEqual(len(topic_summaries), 1)
        self.assertEqual(topic_summaries[0].name, 'Name')
        self.assertEqual(topic_summaries[0].canonical_story_count, 0)
        self.assertEqual(topic_summaries[0].additional_story_count, 0)
        self.assertEqual(topic_summaries[0].total_skill_count, 2)
        self.assertEqual(topic_summaries[0].uncategorized_skill_count, 1)
        self.assertEqual(topic_summaries[0].subtopic_count, 1)

    def test_get_all_skill_ids_assigned_to_some_topic(self):
        change_list = [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
            'old_subtopic_id': None,
            'new_subtopic_id': 1,
            'skill_id': self.skill_id_1
        })]
        topic_services.update_topic_and_subtopic_pages(
            self.user_id_admin, self.TOPIC_ID, change_list,
            'Moved skill to subtopic.')
        topic_id = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id, self.user_id, name='Name 2', description='Description',
            abbreviated_name='random', url_fragment='name-three',
            canonical_story_ids=[], additional_story_ids=[],
            uncategorized_skill_ids=[self.skill_id_1, 'skill_3'],
            subtopics=[], next_subtopic_id=1)
        self.assertEqual(
            topic_fetchers.get_all_skill_ids_assigned_to_some_topic(),
            {self.skill_id_1, self.skill_id_2, 'skill_3'})

    def test_get_topic_summary_from_model(self):
        topic_summary_model = topic_models.TopicSummaryModel.get(self.TOPIC_ID)
        topic_summary = topic_fetchers.get_topic_summary_from_model(
            topic_summary_model)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.description, 'Description')
        self.assertEqual(topic_summary.canonical_story_count, 0)
        self.assertEqual(topic_summary.additional_story_count, 0)
        self.assertEqual(topic_summary.uncategorized_skill_count, 2)
        self.assertEqual(topic_summary.total_skill_count, 2)
        self.assertEqual(topic_summary.subtopic_count, 1)
        self.assertEqual(topic_summary.thumbnail_filename, 'topic.svg')
        self.assertEqual(topic_summary.thumbnail_bg_color, '#C6DCDA')

    def test_get_topic_summary_by_id(self):
        topic_summary = topic_fetchers.get_topic_summary_by_id(self.TOPIC_ID)

        self.assertEqual(topic_summary.id, self.TOPIC_ID)
        self.assertEqual(topic_summary.name, 'Name')
        self.assertEqual(topic_summary.description, 'Description')
        self.assertEqual(topic_summary.canonical_story_count, 0)
        self.assertEqual(topic_summary.additional_story_count, 0)
        self.assertEqual(topic_summary.uncategorized_skill_count, 2)
        self.assertEqual(topic_summary.subtopic_count, 1)
        self.assertEqual(topic_summary.thumbnail_filename, 'topic.svg')
        self.assertEqual(topic_summary.thumbnail_bg_color, '#C6DCDA')

        fake_topic_id = topic_fetchers.get_new_topic_id()
        fake_topic = topic_fetchers.get_topic_summary_by_id(
            fake_topic_id, strict=False)
        self.assertIsNone(fake_topic)

    def test_get_new_topic_id(self):
        new_topic_id = topic_fetchers.get_new_topic_id()

        self.assertEqual(len(new_topic_id), 12)
        self.assertEqual(topic_models.TopicModel.get_by_id(new_topic_id), None)

    def test_get_multi_rights(self):
        topic_rights = topic_fetchers.get_multi_topic_rights([
            self.TOPIC_ID, 'invalid_id'])

        self.assertEqual(len(topic_rights), 2)
        self.assertEqual(topic_rights[0].id, self.TOPIC_ID)
        self.assertEqual(topic_rights[0].manager_ids, [self.user_id_a])
        self.assertFalse(topic_rights[0].topic_is_published)
        self.assertIsNone(topic_rights[1])
