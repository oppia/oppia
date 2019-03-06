# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for subtopic viewer page"""

from constants import constants
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseSubtopicViewerControllerTests(test_utils.GenericTestBase):

    user_id = 'user_id'

    def setUp(self):
        super(BaseSubtopicViewerControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.topic_id = 'topic_id'
        self.subtopic_id = 1
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.topic_id))
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id,
                'title': 'Sample'
            })]
        )
        self.content_ids_to_audio_translations_dict = {
            'content': {
                'en': {
                    'filename': 'test.mp3',
                    'file_size_bytes': 100,
                    'needs_update': False
                }
            }
        }
        self.written_translations_dict = {
            'translations_mapping': {
                'content': {}
            }
        }
        self.expected_page_contents_dict = {
            'content_ids_to_audio_translations':
                self.content_ids_to_audio_translations_dict,
            'subtitled_html': {
                'content_id': 'content', 'html': 'hello world'
            }
        }
        self.subtopic_page.update_page_contents_html({
            'html': 'hello world',
            'content_id': 'content'
        })
        self.subtopic_page.update_page_contents_audio(
            self.content_ids_to_audio_translations_dict)
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': self.subtopic_id,
                'property_name': 'page_contents_html',
                'new_value': 'a',
                'old_value': 'b'
            })]
        )


class SubtopicPageDataHandlerTests(BaseSubtopicViewerControllerTests):
    def test_get(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'topic_id', 1))
            expected_page_contents_dict = {
                'content_ids_to_audio_translations':
                    self.content_ids_to_audio_translations_dict,
                'subtitled_html': {
                    'content_id': 'content',
                    'html': 'hello world'
                },
                'written_translations': self.written_translations_dict
            }
            expected_dict = {
                'topic_id': self.topic_id,
                'subtopic_id': 1,
                'page_contents': expected_page_contents_dict
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'topic_id', 1),
                expected_status_int=404)
