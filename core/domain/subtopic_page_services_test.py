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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import html_domain
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

import feconf

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
        recorded_voiceovers = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 7.213
                    }
                }
            }
        }
        expected_page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': '<p>hello world</p>'
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }
        self.subtopic_page.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': '<p>hello world</p>',
                'content_id': 'content'
            }))
        self.subtopic_page.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(recorded_voiceovers))
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
        with self.assertRaisesRegexp(
            base_models.BaseModel.EntityNotFoundError,
            r'Entity for class SubtopicPageModel with id %s not found' % (
                subtopic_page_id)):
            topic_models.SubtopicPageModel.get(subtopic_page_id)
        with self.assertRaisesRegexp(
            base_models.BaseModel.EntityNotFoundError,
            r'Entity for class SubtopicPageModel with id %s not found' % (
                subtopic_page_id)):
            subtopic_page_services.delete_subtopic_page(
                self.user_id, self.TOPIC_ID, 1)

    def test_migrate_page_contents_to_latest_schema(self):
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION', 2)
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        written_translations_dict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'html': html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'html': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        written_translations_dict_math = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'html': expected_html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'html': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'html': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'html': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        recorded_voiceovers = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 7.213
                    }
                }
            }
        }
        page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict
        }
        expected_page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': expected_html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict_math
        }

        subtopic_page_id = topic_models.SubtopicPageModel.get_new_id('')
        subtopic_page_model = topic_models.SubtopicPageModel(
            id=subtopic_page_id,
            topic_id=self.TOPIC_ID,
            page_contents=page_contents_dict,
            page_contents_schema_version=1,
            language_code='en'
        )
        self.assertEqual(subtopic_page_model.page_contents_schema_version, 1)

        with current_schema_version_swap:
            subtopic_page = subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)

        self.assertEqual(subtopic_page.page_contents_schema_version, 2)
        self.assertEqual(
            subtopic_page.page_contents.to_dict(), expected_page_contents_dict)

    def test_cannot_migrate_page_contents_to_latest_schema_with_invalid_version(
            self):
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION', 2)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v2 page schemas at present.')

        subtopic_page_model = topic_models.SubtopicPageModel.get(
            self.subtopic_page_id)
        subtopic_page_model.page_contents_schema_version = 0
        subtopic_page_model.commit(self.user_id, '', [])

        with current_schema_version_swap, (
            assert_raises_regexp_context_manager):
            subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)

    def test_get_batch_of_subtopic_pages_for_latex_svg_generation(self):
        valid_html_content1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;\\\\frac{x}{y}&amp;quot'
            ';, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"'
            '></oppia-noninteractive-math>'
        )
        valid_html_content2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )

        page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content',
                'html': valid_html_content1
            },
            'recorded_voiceovers': {},
            'written_translations': {
                'translations_mapping': {
                    'content': {
                        'en': {
                            'html': valid_html_content2,
                            'needs_update': True
                        },
                        'hi': {
                            'html': 'Hey!',
                            'needs_update': False
                        }
                    }
                }
            }
        }
        self.subtopic_page.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict(
                {
                    'content_id': 'content',
                    'html': valid_html_content1
                }))
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': 1,
                'property_name': 'page_contents_html',
                'new_value': {
                    'content_id': 'content',
                    'html': valid_html_content1
                },
                'old_value': {
                    'content_id': 'content',
                    'html': ''
                }
            })])

        topic_id2 = topic_services.get_new_topic_id()
        subtopic_page2 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                2, topic_id2))
        subtopic_page_services.save_subtopic_page(
            self.user_id, subtopic_page2, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 2,
                'title': 'Sample2'
            })]
        )
        subtopic_page_id2 = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id2, 2))
        subtopic_page2.update_page_contents_written_translations(
            page_contents_dict['written_translations'])
        subtopic_page_services.save_subtopic_page(
            self.user_id, subtopic_page2, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': 2,
                'property_name': 'page_written_translations',
                'new_value': page_contents_dict['written_translations'],
                'old_value': {}
            })])


        topic_id3 = topic_services.get_new_topic_id()
        subtopic_page3 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                3, topic_id2))
        subtopic_page_services.save_subtopic_page(
            self.user_id, subtopic_page3, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 3,
                'title': 'Sample2'
            })]
        )
        expected_output = {
            subtopic_page2.id: [b'+,+,+,+'],
            self.subtopic_page.id: [b'\\frac{x}{y}']
        }
        self.assertEqual(
            subtopic_page_services.
            get_batch_of_subtopic_pages_for_latex_svg_generation(),
            expected_output)

    def test_update_subtopics_with_math_svgs(self):
        valid_html_content1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;\\\\frac{x}{y}&amp;quot'
            ';, &amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"'
            '></oppia-noninteractive-math>'
        )
        valid_html_content2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )

        page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content',
                'html': valid_html_content1
            },
            'recorded_voiceovers': {},
            'written_translations': {
                'translations_mapping': {
                    'content': {
                        'en': {
                            'html': valid_html_content2,
                            'needs_update': True
                        },
                        'hi': {
                            'html': 'Hey!',
                            'needs_update': False
                        }
                    }
                }
            }
        }
        self.subtopic_page.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict(
                {
                    'content_id': 'content',
                    'html': valid_html_content1
                }))
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': 1,
                'property_name': 'page_contents_html',
                'new_value': state_domain.SubtitledHtml.from_dict(
                    {
                        'content_id': 'content',
                        'html': valid_html_content1
                    }),
                'old_value': None
            })])

        self.subtopic_page.update_page_contents_written_translations(
            page_contents_dict['written_translations'])
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': 1,
                'property_name': 'page_written_translations',
                'new_value': state_domain.WrittenTranslations.from_dict(
                    page_contents_dict['written_translations']),
                'old_value': None
            })])
        svg_file_1 = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.4'
            '29ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="vert'
            'ical-align: -0.241ex;"><g stroke="currentColor" fill="currentColo'
            'r" stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke'
            '-width="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404'
            ' 406 402Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q37'
            '8 26 414 59T463 140Q466 150 469 151T485 153H489Q504 153 504 145284'
            ' 52 289Z"/></g></svg>'
        )

        svg_file_2 = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="3.33ex" height="1.5'
            '25ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="vert'
            'ical-align: -0.241ex;"><g stroke="currentColor" fill="currentColo'
            'r" stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke'
            '-width="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404'
            ' 406 402Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q37'
            '8 26 414 59T463 140Q466 150 469 151T485 153H489Q504 153 504 145284'
            ' 52 289Z"/></g></svg>'
        )

        image_data1 = html_domain.LatexStringSvgImageData(
            '\\frac{x}{y}', svg_file_1,
            html_domain.LatexStringSvgImageDimensions('1d429', '1d33', '0d241'))
        image_data2 = html_domain.LatexStringSvgImageData(
            '+,+,+,+', svg_file_2,
            html_domain.LatexStringSvgImageDimensions('1d525', '3d33', '0d241'))
        raw_latex_to_image_data_dict = {
            '+,+,+,+': image_data2,
            '\\frac{x}{y}': image_data1
        }
        subtopic_page_services.update_subtopics_with_math_svgs(
            self.subtopic_page.id, raw_latex_to_image_data_dict)
