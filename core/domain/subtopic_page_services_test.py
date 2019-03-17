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

(base_models, topic_models, ) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.topic])


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
        subtopic_page_1 = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, self.subtopic_id)
        self.assertEqual(
            subtopic_page_1.to_dict(), self.subtopic_page.to_dict())
        # When the subtopic page with the given subtopic id and topic id
        # doesn't exist.
        subtopic_page_2 = subtopic_page_services.get_subtopic_page_by_id(
            'topic_id', 1, strict=False)
        self.assertEqual(subtopic_page_2, None)

    def test_get_subtopic_pages_with_ids(self):
        subtopic_ids = [self.subtopic_id]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(
            subtopic_pages[0].to_dict(), self.subtopic_page.to_dict())
        subtopic_ids = [2]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(subtopic_pages, [None])
        subtopic_ids = [self.subtopic_id, 2]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        expected_subtopic_pages = [self.subtopic_page.to_dict(), None]
        self.assertEqual([subtopic_pages[0].to_dict(), subtopic_pages[1]],
                         expected_subtopic_pages)
        subtopic_ids = []
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(subtopic_pages, [])
        subtopic_ids = [2, 2]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(subtopic_pages, [None, None])


    def test_get_subtopic_page_contents_by_id(self):
        self.subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1)
        content_ids_to_audio_translations_dict = {
            'content': {
                'en': {
                    'filename': 'test.mp3',
                    'file_size_bytes': 100,
                    'needs_update': False
                }
            }
        }
        expected_page_contents_dict = {
            'content_ids_to_audio_translations':
                content_ids_to_audio_translations_dict,
            'subtitled_html': {
                'content_id': 'content', 'html': 'hello world'
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }
        self.subtopic_page.update_page_contents_html({
            'html': 'hello world',
            'content_id': 'content'
        })
        self.subtopic_page.update_page_contents_audio(
            content_ids_to_audio_translations_dict)
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': 1,
                'property_name': 'page_contents_html',
                'new_value': 'a',
                'old_value': 'b'
            })])
        subtopic_page_contents = (
            subtopic_page_services.get_subtopic_page_contents_by_id(
                self.TOPIC_ID, 1))
        self.assertEqual(
            subtopic_page_contents.to_dict(), expected_page_contents_dict)
        subtopic_page_contents = (
            subtopic_page_services.get_subtopic_page_contents_by_id(
                self.TOPIC_ID, 2, strict=False))
        self.assertEqual(subtopic_page_contents, None)

    def test_save_subtopic_page(self):
        subtopic_page_1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, 'topic_id_1'))
        subtopic_page_services.save_subtopic_page(
            self.user_id, subtopic_page_1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })])
        with self.assertRaisesRegexp(
            Exception, 'Unexpected error: received an invalid change list *'):
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page_1, 'Added subtopic', [])
        subtopic_page_id_1 = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                'topic_id_1', 1))
        subtopic_page_model_1 = topic_models.SubtopicPageModel.get(
            subtopic_page_id_1)
        subtopic_page_1.version = 2
        subtopic_page_model_1.version = 3
        with self.assertRaisesRegexp(Exception, 'Trying to update version *'):
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page_1, 'Added subtopic',
                [topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                    'subtopic_id': 1,
                    'title': 'Sample'
                })])
        subtopic_page_1.version = 3
        subtopic_page_model_1.version = 2
        with self.assertRaisesRegexp(
            Exception, 'Unexpected error: trying to update version *'):
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page_1, 'Added subtopic',
                [topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                    'subtopic_id': 1,
                    'title': 'Sample'
                })])

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

    def test_delete_subtopic_page(self):
        subtopic_page_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                self.TOPIC_ID, 1))
        subtopic_page_services.delete_subtopic_page(
            self.user_id, self.TOPIC_ID, 1)
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            topic_models.SubtopicPageModel.get(subtopic_page_id)
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            subtopic_page_services.delete_subtopic_page(
                self.user_id, self.TOPIC_ID, 1)
