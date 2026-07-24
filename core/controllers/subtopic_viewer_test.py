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

from core import feature_flag_list, feconf
from core.domain import (
    state_domain,
    study_guide_domain,
    study_guide_services,
    subtopic_page_domain,
    topic_domain,
    topic_services,
    translation_domain,
    user_services,
)
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
                self.subtopic_id_1, self.topic_id
            )
        )
        self.subtopic_page_2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id_2, self.topic_id
            )
        )
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag'
        )
        subtopic.skill_ids = ['skill_id_1']
        subtopic.url_fragment = 'sub-url-frag-one'
        subtopic2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'url-frag-two'
        )
        subtopic2.skill_ids = ['skill_id_2']
        subtopic2.url_fragment = 'sub-url-frag-two'

        self.save_new_topic(
            self.topic_id,
            self.admin_id,
            name='Name',
            abbreviated_name='name',
            url_fragment='name',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic, subtopic2],
            next_subtopic_id=3,
        )
        self.save_new_study_guide(
            self.subtopic_id_1, self.admin_id, self.topic_id
        )
        self.save_new_study_guide(
            self.subtopic_id_2, self.admin_id, self.topic_id
        )
        topic_services.publish_topic(self.topic_id, self.admin_id)
        self.save_new_topic(
            'topic_id_2',
            self.admin_id,
            name='Private_Name',
            abbreviated_name='pvttopic',
            url_fragment='pvttopic',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic],
            next_subtopic_id=2,
        )
        self.save_new_study_guide(
            self.subtopic_id_1, self.admin_id, 'topic_id_2'
        )
        self.recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 0.34234,
                    }
                }
            }
        }
        self.written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {'translations_mapping': {'content': {}}}
        self.subtopic_page_1.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict(
                {'html': '<p>hello world</p>', 'content_id': 'content'}
            )
        )
        self.subtopic_page_1.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(
                self.recorded_voiceovers_dict
            )
        )
        self.subtopic_page_2.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict(
                {'html': '<p>hello world 2</p>', 'content_id': 'content'}
            )
        )
        self.subtopic_page_2.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(
                self.recorded_voiceovers_dict
            )
        )

        self.topic_id_2 = 'topic_id_2'
        self.subtopic_id_3 = 1
        self.subtopic_id_4 = 2
        self.study_guide_1 = study_guide_domain.StudyGuide.create_study_guide(
            self.subtopic_id_3, self.topic_id_2, 'heading', 'content'
        )
        self.study_guide_2 = study_guide_domain.StudyGuide.create_study_guide(
            self.subtopic_id_4, self.topic_id_2, 'heading 2', 'content 2'
        )
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag-one'
        )
        subtopic.skill_ids = ['skill_id_one']
        subtopic.url_fragment = 'sub-url-frag-onee'
        subtopic2 = topic_domain.Subtopic.create_default_subtopic(
            2, 'Subtopic Title 2', 'url-frag-twoo'
        )
        subtopic2.skill_ids = ['skill_id_two']
        subtopic2.url_fragment = 'sub-url-frag-twoo'

        self.save_new_topic(
            self.topic_id_2,
            self.admin_id,
            name='Name new',
            abbreviated_name='name',
            url_fragment='nameone',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic, subtopic2],
            next_subtopic_id=3,
        )
        topic_services.publish_topic(self.topic_id_2, self.admin_id)
        self.save_new_topic(
            'topic_id_3',
            self.admin_id,
            name='Private_Name new',
            abbreviated_name='pvttopic',
            url_fragment='pvttopicone',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[subtopic],
            next_subtopic_id=2,
        )
        self.save_new_study_guide(
            self.subtopic_id_3, self.admin_id, 'topic_id_3'
        )
        self.study_guide_1 = study_guide_services.get_study_guide_by_id(
            self.topic_id_2, self.subtopic_id_3
        )
        self.study_guide_1.update_sections(
            [
                study_guide_domain.StudyGuideSection.create_study_guide_section(
                    'section_heading_0',
                    'hello',
                    'section_content_1',
                    'How are ya?',
                )
            ]
        )
        study_guide_services.save_study_guide(
            self.admin_id,
            self.study_guide_1,
            'Updated sections',
            [
                study_guide_domain.StudyGuideChange(
                    {
                        'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                        'subtopic_id': self.subtopic_id_3,
                        'property_name': 'sections',
                        'new_value': [
                            {
                                'heading': {
                                    'content_id': 'section_heading_0',
                                    'unicode_str': 'hello',
                                },
                                'content': {
                                    'content_id': 'section_content_1',
                                    'html': 'How are ya?',
                                },
                            }
                        ],
                        'old_value': [
                            {
                                'heading': {
                                    'content_id': 'section_heading_0',
                                    'unicode_str': 'hello',
                                },
                                'content': {
                                    'content_id': 'section_content_1',
                                    'html': 'How are ya?',
                                },
                            }
                        ],
                    }
                )
            ],
        )
        self.study_guide_2.update_sections(
            [
                study_guide_domain.StudyGuideSection.create_study_guide_section(
                    'section_heading_0',
                    'hello 2',
                    'section_content_1',
                    'How are ya? 2',
                )
            ]
        )
        study_guide_services.save_study_guide(
            self.admin_id,
            self.study_guide_2,
            'Updated sections',
            [
                study_guide_domain.StudyGuideChange(
                    {
                        'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                        'subtopic_id': self.subtopic_id_4,
                        'property_name': 'sections',
                        'new_value': [
                            {
                                'heading': {
                                    'content_id': 'section_heading_0',
                                    'unicode_str': 'hello 2',
                                },
                                'content': {
                                    'content_id': 'section_content_1',
                                    'html': 'How are ya? 2',
                                },
                            }
                        ],
                        'old_value': [
                            {
                                'heading': {
                                    'content_id': 'section_heading_0',
                                    'unicode_str': 'hello 2',
                                },
                                'content': {
                                    'content_id': 'section_content_1',
                                    'html': 'How are ya? 2',
                                },
                            }
                        ],
                    }
                )
            ],
        )


class SubtopicPageDataHandlerTests(BaseSubtopicViewerControllerTests):
    def test_get_for_only_subtopic_in_topic(self) -> None:
        topic_id = 'single_subtopic_topic_id'
        subtopic_id = 1
        self.save_new_study_guide(
            subtopic_id, self.admin_id, topic_id
        )

        only_subtopic = topic_domain.Subtopic.create_default_subtopic(
            subtopic_id, 'Only Subtopic', 'only-subtopic-fragment'
        )
        only_subtopic.skill_ids = ['skill_id_only']

        self.save_new_topic(
            topic_id,
            self.admin_id,
            name='Single Subtopic Topic',
            abbreviated_name='single-subtopic-topic',
            url_fragment='single-subtopic',
            description='Description',
            canonical_story_ids=[],
            additional_story_ids=[],
            uncategorized_skill_ids=[],
            subtopics=[only_subtopic],
            next_subtopic_id=2,
        )
        topic_services.publish_topic(topic_id, self.admin_id)

        json_response = self.get_json(
            '%s/staging/%s/%s'
            % (
                feconf.SUBTOPIC_DATA_HANDLER,
                'single-subtopic',
                'only-subtopic-fragment',
            )
        )

        self.assertEqual(json_response['next_subtopic_dict'], None)
        self.assertEqual(json_response['prev_subtopic_dict'], None)

    def test_get_for_first_subtopic_in_topic(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-one')
        )
        expected_next_subtopic_dict = {
            'thumbnail_bg_color': None,
            'skill_ids': ['skill_id_2'],
            'id': 2,
            'thumbnail_filename': None,
            'thumbnail_size_in_bytes': None,
            'title': 'Subtopic Title 2',
            'url_fragment': 'sub-url-frag-two',
        }

        expected_dict = {
            'topic_id': 'topic_id',
            'page_contents': {},
            'subtopic_title': 'Subtopic Title',
            'current_subtopic_id': 1,
            'next_subtopic_dict': expected_next_subtopic_dict,
            'prev_subtopic_dict': None,
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.SHOW_RESTRUCTURED_STUDY_GUIDES]
    )
    def test_get_for_first_subtopic_with_study_guides_in_topic(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'nameone', 'sub-url-frag-onee')
        )
        expected_sections_dicts_list = [
            {
                'heading': {
                    'content_id': 'section_heading_0',
                    'unicode_str': 'hello',
                },
                'content': {
                    'content_id': 'section_content_1',
                    'html': 'How are ya?',
                },
            }
        ]
        expected_next_subtopic_dict = {
            'thumbnail_bg_color': None,
            'skill_ids': ['skill_id_two'],
            'id': 2,
            'thumbnail_filename': None,
            'thumbnail_size_in_bytes': None,
            'title': 'Subtopic Title 2',
            'url_fragment': 'sub-url-frag-twoo',
        }

        expected_dict = {
            'topic_id': 'topic_id_2',
            'sections': expected_sections_dicts_list,
            'subtopic_title': 'Subtopic Title',
            'current_subtopic_id': 1,
            'next_subtopic_dict': expected_next_subtopic_dict,
            'prev_subtopic_dict': None,
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.SHOW_RESTRUCTURED_STUDY_GUIDES]
    )
    def test_get_for_last_subtopic_with_study_guides_in_topic(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'nameone', 'sub-url-frag-twoo')
        )

        expected_prev_subtopic_dict = {
            'thumbnail_bg_color': None,
            'skill_ids': ['skill_id_one'],
            'id': 1,
            'thumbnail_filename': None,
            'thumbnail_size_in_bytes': None,
            'title': 'Subtopic Title',
            'url_fragment': 'sub-url-frag-onee',
        }

        expected_dict = {
            'topic_id': 'topic_id_2',
            'sections': [
                {
                    'heading': {
                        'content_id': 'section_heading_0',
                        'unicode_str': 'hello 2',
                    },
                    'content': {
                        'content_id': 'section_content_1',
                        'html': 'How are ya? 2',
                    },
                }
            ],
            'subtopic_title': 'Subtopic Title 2',
            'current_subtopic_id': 2,
            'next_subtopic_dict': None,
            'prev_subtopic_dict': expected_prev_subtopic_dict,
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_for_last_subtopic_in_topic(self) -> None:
        json_response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-two')
        )
        expected_prev_subtopic_dict = {
            'thumbnail_bg_color': None,
            'skill_ids': ['skill_id_1'],
            'id': 1,
            'thumbnail_filename': None,
            'thumbnail_size_in_bytes': None,
            'title': 'Subtopic Title',
            'url_fragment': 'sub-url-frag-one',
        }

        expected_dict = {
            'topic_id': 'topic_id',
            'page_contents': {},
            'subtopic_title': 'Subtopic Title 2',
            'current_subtopic_id': 2,
            'next_subtopic_dict': None,
            'prev_subtopic_dict': expected_prev_subtopic_dict,
        }
        self.assertDictContainsSubset(expected_dict, json_response)

    def test_cannot_get_with_unpublished_topic(self) -> None:
        topic_services.unpublish_topic(self.topic_id, self.admin_id)
        response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-one'),
            expected_status_int=404,
        )
        self.assertIn('Could not find the resource', response['error'])

    def test_cannot_get_with_invalid_topic_name(self) -> None:
        response = self.get_json(
            '%s/staging/%s/%s'
            % (
                feconf.SUBTOPIC_DATA_HANDLER,
                'Invalid Name',
                'sub-url-frag-one',
            ),
            expected_status_int=400,
        )
        self.assertIn(
            '\nSchema validation for \'topic_url_fragment\' failed',
            response['error'],
        )

    def test_cannot_get_with_invalid_subtopic_id(self) -> None:
        response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-zero'),
            expected_status_int=404,
        )
        self.assertIn('Could not find the resource', response['error'])

    def test_cannot_get_with_deleted_subtopic_page(self) -> None:
        study_guide_services.delete_study_guide(
            self.admin_id, self.topic_id, 1
        )
        response = self.get_json(
            '%s/staging/%s/%s'
            % (feconf.SUBTOPIC_DATA_HANDLER, 'name', 'sub-url-frag-one'),
            expected_status_int=404,
        )
        self.assertIn('Could not find the resource', response['error'])
