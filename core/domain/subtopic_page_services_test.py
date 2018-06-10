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

"""Tests for subtopic page domain objects."""

from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class SubtopicPageServicesUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""
    user_id = 'user_id'
    story_id_1 = 'story_1'
    story_id_2 = 'story_2'
    story_id_3 = 'story_3'
    subtopic_id = 1
    skill_id_1 = 'skill_1'
    skill_id_2 = 'skill_2'

    def setUp(self):
        super(SubtopicPageServicesUnitTests, self).setUp()
        self.TOPIC_ID = topic_services.get_new_topic_id()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.TOPIC_ID))
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        self.subtopic_page_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                self.TOPIC_ID, 1))

    def test_get_subtopic_page_from_model(self):
        subtopic_page_model = topic_models.SubtopicPageModel.get(
            self.subtopic_page_id)
        subtopic_page = subtopic_page_services.get_subtopic_page_from_model(
            subtopic_page_model)
        self.assertEqual(subtopic_page.to_dict(), self.subtopic_page.to_dict())

    def test_get_subtopic_page_by_id(self):
        subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, self.subtopic_id)
        self.assertEqual(subtopic_page.to_dict(), self.subtopic_page.to_dict())

    def test_get_all_subtopic_pages_in_topic(self):
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                4, self.TOPIC_ID))
        subtopic_page_services.save_subtopic_page(
            self.user_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 4,
                'title': 'Sample'
            })]
        )
        subtopic_pages = subtopic_page_services.get_all_subtopic_pages_in_topic(
            self.TOPIC_ID)
        self.assertEqual(len(subtopic_pages), 2)
        self.assertEqual(subtopic_pages[0].id, self.TOPIC_ID + '-1')
        self.assertEqual(subtopic_pages[1].id, self.TOPIC_ID + '-4')

    def test_commit_log_entry(self):
        subtopic_page_commit_log_entry = (
            topic_models.SubtopicPageCommitLogEntryModel.get_commit(
                self.subtopic_page_id, 1)
        )
        self.assertEqual(subtopic_page_commit_log_entry.commit_type, 'create')
        self.assertEqual(
            subtopic_page_commit_log_entry.subtopic_page_id,
            self.subtopic_page_id)
        self.assertEqual(subtopic_page_commit_log_entry.user_id, self.user_id)
