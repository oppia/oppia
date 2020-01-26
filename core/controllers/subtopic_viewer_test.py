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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseSubtopicViewerControllerTests(test_utils.GenericTestBase):

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
            self.admin_id, self.subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id,
                'title': 'Sample'
            })]
        )
        subtopic_page_2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, 'topic_id_2'))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, subtopic_page_2, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id,
                'title': 'Sample'
            })]
        )
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title')
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='abbrev', thumbnail_filename=None,
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_topic(
            'topic_id_2', self.admin_id, name='Private_Name',
            abbreviated_name='abbrev', thumbnail_filename=None,
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)
        self.recorded_voiceovers_dict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False
                    }
                }
            }
        }
        self.written_translations_dict = {
            'translations_mapping': {
                'content': {}
            }
        }
        self.subtopic_page.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': '<p>hello world</p>',
                'content_id': 'content'
            }))
        self.subtopic_page.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(
                self.recorded_voiceovers_dict))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': self.subtopic_id,
                'property_name': 'page_contents_html',
                'new_value': 'a',
                'old_value': 'b'
            })]
        )


class SubtopicViewerPageTests(BaseSubtopicViewerControllerTests):

    def test_any_user_can_access_subtopic_viewer_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s/%s' % (feconf.SUBTOPIC_VIEWER_URL_PREFIX, 'Name', '1'))


    def test_accessibility_of_subtopic_viewer_page_of_unpublished_topic(
            self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_VIEWER_URL_PREFIX, 'Private_Name', '1'),
                expected_status_int=404)
            self.login(self.ADMIN_EMAIL)
            self.get_html_response(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_VIEWER_URL_PREFIX, 'Private_Name', '1'))
            self.logout()


    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '%s/%s/%s' % (feconf.SUBTOPIC_VIEWER_URL_PREFIX, 'Name', '1'),
                expected_status_int=404)


class SubtopicPageDataHandlerTests(BaseSubtopicViewerControllerTests):
    def test_get(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'Name', 1))
            expected_page_contents_dict = {
                'recorded_voiceovers': self.recorded_voiceovers_dict,
                'subtitled_html': {
                    'content_id': 'content',
                    'html': '<p>hello world</p>'
                },
                'written_translations': self.written_translations_dict
            }
            expected_dict = {
                'page_contents': expected_page_contents_dict,
                'subtopic_title': 'Subtopic Title'
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_cannot_get_with_unpublished_topic(self):
        topic_services.unpublish_topic(self.topic_id, self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'Name', 1),
                expected_status_int=404)

    def test_cannot_get_with_invalid_topic_name(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'Invalid Name', 1),
                expected_status_int=404)

    def test_cannot_get_with_invalid_subtopic_id(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'Name', 5),
                expected_status_int=404)

    def test_cannot_get_with_deleted_subtopic_page(self):
        subtopic_page_services.delete_subtopic_page(
            self.admin_id, self.topic_id, 1)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'Name', 1),
                expected_status_int=404)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s/%s' % (
                    feconf.SUBTOPIC_DATA_HANDLER, 'Name', 1),
                expected_status_int=404)
