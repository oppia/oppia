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

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.tests import test_utils


class SubtopicPageDomainUnitTests(test_utils.GenericTestBase):
    """Tests for subtopic page domain objects."""

    topic_id: str = 'topic_id'
    subtopic_id: int = 1

    def setUp(self) -> None:
        super().setUp()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.topic_id))

    def test_to_dict(self) -> None:
        expected_subtopic_page_dict = {
            'id': 'topic_id-1',
            'topic_id': 'topic_id',
            'page_contents': {
                'subtitled_html': {
                    'html': '',
                    'content_id': 'content'
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content': {}
                    }
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                }
            },
            'page_contents_schema_version': (
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(
            self.subtopic_page.to_dict(), expected_subtopic_page_dict)

    def test_create_default_subtopic_page(self) -> None:
        """Tests the create_default_topic() function."""
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.topic_id))

        expected_subtopic_page_dict = {
            'id': 'topic_id-1',
            'topic_id': 'topic_id',
            'page_contents': {
                'subtitled_html': {
                    'html': '',
                    'content_id': 'content'
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content': {}
                    }
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                }
            },
            'page_contents_schema_version': (
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(subtopic_page.to_dict(), expected_subtopic_page_dict)

    def test_get_subtopic_page_id(self) -> None:
        self.assertEqual(
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id('abc', 1),
            'abc-1')

    def test_get_subtopic_id_from_subtopic_page_id(self) -> None:
        self.assertEqual(
            self.subtopic_page.get_subtopic_id_from_subtopic_page_id(), 1)

    def _assert_subtopic_validation_error(
        self, expected_error_substring: str
    ) -> None:
        """Checks that the topic passes strict validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.subtopic_page.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_subtopic_topic_id_validation(self) -> None:
        self.subtopic_page.topic_id = 1  # type: ignore[assignment]
        self._assert_subtopic_validation_error(
            'Expected topic_id to be a string'
        )

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_language_code_validation(self) -> None:
        self.subtopic_page.language_code = 0  # type: ignore[assignment]
        self._assert_subtopic_validation_error(
            'Expected language code to be a string'
        )

        self.subtopic_page.language_code = 'xz'
        self._assert_subtopic_validation_error('Invalid language code')

    def test_update_audio(self) -> None:
        recorded_voiceovers_dict: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 1.5
                    }
                }
            }
        }
        expected_subtopic_page_dict: subtopic_page_domain.SubtopicPageDict = {
            'id': 'topic_id-1',
            'topic_id': 'topic_id',
            'page_contents': {
                'subtitled_html': {
                    'html': '',
                    'content_id': 'content'
                },
                'recorded_voiceovers': recorded_voiceovers_dict,
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                }
            },
            'page_contents_schema_version': (
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.subtopic_page.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(
                recorded_voiceovers_dict))
        self.assertEqual(
            self.subtopic_page.to_dict(), expected_subtopic_page_dict)

    def test_update_html(self) -> None:
        expected_subtopic_page_dict = {
            'id': 'topic_id-1',
            'topic_id': 'topic_id',
            'page_contents': {
                'subtitled_html': {
                    'html': '<p>hello world</p>',
                    'content_id': 'content'
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content': {}
                    }
                },
                'written_translations': {
                    'translations_mapping': {
                        'content': {}
                    }
                }
            },
            'page_contents_schema_version': (
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.subtopic_page.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': '<p>hello world</p>',
                'content_id': 'content'
            }))
        self.assertEqual(
            self.subtopic_page.to_dict(), expected_subtopic_page_dict)

    def test_update_written_translations(self) -> None:
        written_translations_dict: state_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': 'Translation in hindi.',
                        'needs_update': False
                    }
                }
            }
        }
        expected_subtopic_page_dict: subtopic_page_domain.SubtopicPageDict = {
            'id': 'topic_id-1',
            'topic_id': 'topic_id',
            'page_contents': {
                'subtitled_html': {
                    'html': '',
                    'content_id': 'content'
                },
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content': {}
                    }
                },
                'written_translations': written_translations_dict
            },
            'page_contents_schema_version': (
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }

        self.subtopic_page.update_page_contents_written_translations(
            written_translations_dict)
        self.assertEqual(
            self.subtopic_page.to_dict(), expected_subtopic_page_dict)

    def test_create_subtopic_page_change(self) -> None:
        subtopic_page_change_object = subtopic_page_domain.SubtopicPageChange({
            'cmd': subtopic_page_domain.CMD_CREATE_NEW,
            'topic_id': self.topic_id,
            'subtopic_id': 'subtopic_id'
        })

        self.assertEqual(
            subtopic_page_change_object.to_dict(), {
                'cmd': subtopic_page_domain.CMD_CREATE_NEW,
                'topic_id': self.topic_id,
                'subtopic_id': 'subtopic_id'
            })

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_version_number(self) -> None:
        self.subtopic_page.version = 'invalid_version'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected version number to be an int'):
            self.subtopic_page.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_page_contents_schema_version_type(self) -> None:
        self.subtopic_page.page_contents_schema_version = 'invalid_version'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception,
            'Expected page contents schema version to be an integer'):
            self.subtopic_page.validate()

    def test_validate_page_contents_schema_version(self) -> None:
        self.subtopic_page.page_contents_schema_version = 0
        with self.assertRaisesRegex(
            Exception,
            'Expected page contents schema version to be %s'
            % feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
            self.subtopic_page.validate()


class SubtopicPageContentsDomainUnitTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()
        self.subtopic_page_contents = (
            subtopic_page_domain.SubtopicPageContents
            .create_default_subtopic_page_contents())

    def test_create_default_subtopic_page(self) -> None:
        subtopic_page_contents = (
            subtopic_page_domain.SubtopicPageContents
            .create_default_subtopic_page_contents())
        expected_subtopic_page_contents_dict = {
            'subtitled_html': {
                'html': '',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }
        self.assertEqual(
            subtopic_page_contents.to_dict(),
            expected_subtopic_page_contents_dict)

    def test_to_and_from_dict(self) -> None:
        subtopic_page_contents_dict: (
            subtopic_page_domain.SubtopicPageContentsDict
        ) = {
            'subtitled_html': {
                'html': '<p>test</p>',
                'content_id': 'content'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'filename': 'test.mp3',
                            'file_size_bytes': 100,
                            'needs_update': False,
                            'duration_secs': 0.34343
                        }
                    }
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {
                        'en': {
                            'data_format': 'html',
                            'translation': 'Translation.',
                            'needs_update': False
                        }
                    }
                }
            }
        }
        subtopic_page_contents = (
            subtopic_page_domain.SubtopicPageContents.from_dict(
                subtopic_page_contents_dict))
        self.assertEqual(
            subtopic_page_contents.to_dict(), subtopic_page_contents_dict)


class SubtopicPageChangeTests(test_utils.GenericTestBase):

    def test_subtopic_page_change_object_with_missing_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            subtopic_page_domain.SubtopicPageChange({'invalid': 'data'})

    def test_subtopic_page_change_object_with_invalid_cmd(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            subtopic_page_domain.SubtopicPageChange({'cmd': 'invalid'})

    def test_subtopic_page_change_object_with_missing_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value, old_value')):
            subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': '<p>page_contents_html</p>',
            })

    def test_subtopic_page_change_object_with_extra_attribute_in_cmd(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            subtopic_page_domain.SubtopicPageChange({
                'cmd': 'create_new',
                'topic_id': 'topic_id',
                'subtopic_id': 'subtopic_id',
                'invalid': 'invalid'
            })

    def test_subtopic_page_change_object_with_invalid_subtopic_page_property(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, (
                'Value for property_name in cmd update_subtopic_page_property: '
                'invalid is not allowed')):
            subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'subtopic_id': 'subtopic_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_subtopic_page_change_object_with_update_subtopic_page_property(
        self
    ) -> None:
        subtopic_page_change_object = subtopic_page_domain.SubtopicPageChange({
            'cmd': 'update_subtopic_page_property',
            'subtopic_id': 'subtopic_id',
            'property_name': 'page_contents_html',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(
            subtopic_page_change_object.cmd, 'update_subtopic_page_property')
        self.assertEqual(subtopic_page_change_object.subtopic_id, 'subtopic_id')
        self.assertEqual(
            subtopic_page_change_object.property_name, 'page_contents_html')
        self.assertEqual(subtopic_page_change_object.new_value, 'new_value')
        self.assertEqual(subtopic_page_change_object.old_value, 'old_value')

    def test_subtopic_page_change_object_with_create_new(self) -> None:
        subtopic_page_change_object = (
            subtopic_page_domain.SubtopicPageChange({
                'cmd': 'create_new',
                'topic_id': 'topic_id',
                'subtopic_id': 'subtopic_id'
            }))

        self.assertEqual(subtopic_page_change_object.cmd, 'create_new')
        self.assertEqual(subtopic_page_change_object.topic_id, 'topic_id')
        self.assertEqual(subtopic_page_change_object.subtopic_id, 'subtopic_id')

    def test_to_dict(self) -> None:
        subtopic_page_change_dict = {
            'cmd': 'create_new',
            'topic_id': 'topic_id',
            'subtopic_id': 'subtopic_id'
        }
        subtopic_page_change_object = subtopic_page_domain.SubtopicPageChange(
            subtopic_page_change_dict)
        self.assertEqual(
            subtopic_page_change_object.to_dict(), subtopic_page_change_dict)


class SubtopicPageSummaryTests(test_utils.GenericTestBase):

    SUBTOPIC_ID = 1
    SUBTOPIC_TITLE = 'subtopic_title'
    TOPIC_ID = 'topic_id'
    TOPIC_TITLE = 'topic_title'
    SUBTOPIC_MASTERY = 0.5

    def setUp(self) -> None:
        super().setUp()

        self.subtopic_page_summary = subtopic_page_domain.SubtopicPageSummary(
            self.SUBTOPIC_ID, self.SUBTOPIC_TITLE, self.TOPIC_ID,
            self.TOPIC_TITLE, 'thumbnail_filename', 'red',
            self.SUBTOPIC_MASTERY, 'topic-url', 'classroom-url'
        )

    def test_to_dict(self) -> None:
        subtopic_page_summary_dict = self.subtopic_page_summary.to_dict()

        self.assertEqual(
            subtopic_page_summary_dict['subtopic_id'], self.SUBTOPIC_ID
        )
        self.assertEqual(
            subtopic_page_summary_dict['subtopic_title'], self.SUBTOPIC_TITLE
        )
        self.assertEqual(
            subtopic_page_summary_dict['parent_topic_id'], self.TOPIC_ID
        )
        self.assertEqual(
            subtopic_page_summary_dict['parent_topic_name'], self.TOPIC_TITLE
        )
        self.assertEqual(
            subtopic_page_summary_dict['subtopic_mastery'],
            self.SUBTOPIC_MASTERY
        )
