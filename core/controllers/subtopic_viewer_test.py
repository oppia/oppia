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

from __future__ import annotations

from core import feconf
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import user_services
from core.tests import test_utils


class BaseSubtopicViewerControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.topic_id = 'topic_id'
        self.subtopic_id_1 = 1
        self.subtopic_id_2 = 2
        self.subtopic_page_1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_1, self.topic_id))
        self.subtopic_page_2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_2, self.topic_id))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id_1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_2, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id_2,
                'title': 'Sample',
                'url_fragment': 'dummy-fragment'
            })]
        )
        subtopic_page_private_topic = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_1, 'topic_id_2'))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, subtopic_page_private_topic, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': self.subtopic_id_1,
                'title': 'Sample',
                'url_fragment': 'dummy-fragment-one'
            })]
        )
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag')
        subtopic.skill_ids = ['skill_id_1']
        subtopic.url_fragment = 'sub-url-frag-one'
        subtopic2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'url-frag-two')
        subtopic2.skill_ids = ['skill_id_2']
        subtopic2.url_fragment = 'sub-url-frag-two'

        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='name', url_fragment='name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic, subtopic2], next_subtopic_id=3)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_topic(
            'topic_id_2', self.admin_id, name='Private_Name',
            abbreviated_name='pvttopic', url_fragment='pvttopic',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)
        self.recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 0.34234
                    }
                }
            }
        }
        self.written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content': {}
            }
        }
        self.subtopic_page_1.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': '<p>hello world</p>',
                'content_id': 'content'
            }))
        self.subtopic_page_1.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(
                self.recorded_voiceovers_dict))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_1, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': self.subtopic_id_1,
                'property_name': 'page_contents_html',
                'new_value': '<p>hello world</p>',
                'old_value': ''
            })]
        )
        self.subtopic_page_2.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': '<p>hello world 2</p>',
                'content_id': 'content'
            }))
        self.subtopic_page_2.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(
                self.recorded_voiceovers_dict))
        subtopic_page_services.save_subtopic_page(
            self.admin_id, self.subtopic_page_2, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': self.subtopic_id_2,
                'property_name': 'page_contents_html',
                'new_value': '<p>hello world 2</p>',
                'old_value': ''
            })]
        )


class SubtopicViewerPageTests(BaseSubtopicViewerControllerTests):

    def test_any_user_can_access_subtopic_viewer_page(self) -> None:
        self.get_html_response(
            '/learn/staging/%s/revision/%s' % ('name', 'sub-url-frag-one'))

    def test_accessibility_of_subtopic_viewer_page_of_unpublished_topic(
        self
    ) -> None:
        self.get_html_response(
            '/learn/staging/%s/revision/%s'
            % ('pvttopic', 'sub-url-frag-one'),
            expected_status_int=302)
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        self.get_html_response(
            '/learn/staging/%s/revision/%s'
            % ('pvttopic', 'sub-url-frag-one'))
        self.logout()


class SubtopicPageDataHandlerTests(BaseSubtopicViewerControllerTests):
    def test_get_for_first_subtopic_in_topic(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/%s' % (
                feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-one'))
        expected_page_contents_dict = {
            'recorded_voiceovers': self.recorded_voiceovers_dict,
            'subtitled_html': {
                'content_id': 'content',
                'html': '<p>hello world</p>'
            },
            'written_translations': self.written_translations_dict
        }
        expected_next_subtopic_dict = {
            'thumbnail_bg_color': None,
            'skill_ids': ['skill_id_2'],
            'id': 2,
            'thumbnail_filename': None,
            'thumbnail_size_in_bytes': None,
            'title': 'Subtopic Title 2',
            'url_fragment': 'sub-url-frag-two'
        }

        expected_dict = {
            'topic_id': 'topic_id',
            'page_contents': expected_page_contents_dict,
            'subtopic_title': 'Subtopic Title',
            'next_subtopic_dict': expected_next_subtopic_dict,
            'prev_subtopic_dict': None
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_for_last_subtopic_in_topic(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/%s' % (
                feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-two'))
        expected_page_contents_dict = {
            'recorded_voiceovers': self.recorded_voiceovers_dict,
            'subtitled_html': {
                'content_id': 'content',
                'html': '<p>hello world 2</p>'
            },
            'written_translations': self.written_translations_dict
        }
        expected_prev_subtopic_dict = {
            'thumbnail_bg_color': None,
            'skill_ids': ['skill_id_1'],
            'id': 1,
            'thumbnail_filename': None,
            'thumbnail_size_in_bytes': None,
            'title': 'Subtopic Title',
            'url_fragment': 'sub-url-frag-one'
        }

        expected_dict = {
            'topic_id': 'topic_id',
            'page_contents': expected_page_contents_dict,
            'subtopic_title': 'Subtopic Title 2',
            'next_subtopic_dict': None,
            'prev_subtopic_dict': expected_prev_subtopic_dict
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_cannot_get_with_unpublished_topic(self) -> None:
        topic_services.unpublish_topic(self.topic_id, self.admin_id)
        response = self.get_json(
            '%s/staging/%s/%s' % (
                feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-one'
            ),
            expected_status_int=404
        )
        self.assertIn('Could not find the page', response['error'])

    def test_cannot_get_with_invalid_topic_name(self) -> None:
        response = self.get_json(
            '%s/staging/%s/%s' % (
                feconf.SUBTOPIC_DATA_HANDLER, 'Invalid Name',
                'sub-url-frag-one'
            ),
            expected_status_int=400
        )
        self.assertIn(
            '\nSchema validation for \'topic_url_fragment\' failed',
            response['error']
        )

    def test_cannot_get_with_invalid_subtopic_id(self) -> None:
        response = self.get_json(
            '%s/staging/%s/%s' % (
                feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-zero'
            ),
            expected_status_int=404
        )
        self.assertIn('Could not find the page', response['error'])

    def test_cannot_get_with_deleted_subtopic_page(self) -> None:
        subtopic_page_services.delete_subtopic_page(
            self.admin_id, self.topic_id, 1)
        response = self.get_json(
            '%s/staging/%s/%s' % (
                feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-one'
            ),
            expected_status_int=404
        )
        self.assertIn('Could not find the page', response['error'])
