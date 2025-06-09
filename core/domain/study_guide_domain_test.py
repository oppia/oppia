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

"""Tests for study guide domain objects."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import state_domain
from core.domain import study_guide_domain
from core.tests import test_utils


class StudyGuideSectionDomainUnitTests(test_utils.GenericTestBase):
    """Tests for StudyGuideSection domain objects."""

    def setUp(self) -> None:
        super().setUp()
        self.heading = state_domain.SubtitledUnicode(
            'section_heading_0', 'Test Heading')
        self.content = state_domain.SubtitledHtml(
            'section_content_1', '<p>Test content</p>')
        self.study_guide_section = study_guide_domain.StudyGuideSection(
            self.heading, self.content)

    def test_validate_valid_section(self) -> None:
        """Test validation of a valid study guide section."""
        # Should not raise any exception.
        self.study_guide_section.validate()

    def test_create_study_guide_section(self) -> None:
        """Test creation of a study guide section."""
        section = (
            study_guide_domain
            .StudyGuideSection
            .create_study_guide_section(
                'section_heading_2',
                'Sample Heading',
                'section_content_3',
                '<p>Sample content</p>'
            )
        )

        self.assertEqual(section.heading.content_id, 'section_heading_2')
        self.assertEqual(section.heading.unicode_str, 'Sample Heading')
        self.assertEqual(section.content.content_id, 'section_content_3')
        self.assertEqual(section.content.html, '<p>Sample content</p>')

    def test_to_dict(self) -> None:
        """Test conversion of study guide section to dictionary."""
        expected_dict = {
            'heading': self.heading.to_dict(),
            'content': self.content.to_dict()
        }
        self.assertEqual(self.study_guide_section.to_dict(), expected_dict)

    def test_from_dict(self) -> None:
        """Test creation of study guide section from dictionary."""
        section_dict: study_guide_domain.StudyGuideSectionDict = {
            'heading': {
                'content_id': 'section_heading_2',
                'unicode_str': 'Test Heading'
            },
            'content': {
                'content_id': 'section_content_3',
                'html': '<p>Test content</p>'
            }
        }

        section = study_guide_domain.StudyGuideSection.from_dict(section_dict)
        self.assertEqual(section.heading.content_id, 'section_heading_2')
        self.assertEqual(section.heading.unicode_str, 'Test Heading')
        self.assertEqual(section.content.content_id, 'section_content_3')
        self.assertEqual(section.content.html, '<p>Test content</p>')


class StudyGuideDomainUnitTests(test_utils.GenericTestBase):
    """Tests for StudyGuide domain objects."""

    topic_id: str = 'topic_id'
    subtopic_id: int = 1

    def setUp(self) -> None:
        super().setUp()
        self.study_guide = study_guide_domain.StudyGuide.create_study_guide(
            self.subtopic_id,
            self.topic_id,
            'Test Heading',
            '<p>Test content</p>'
        )

    def test_create_study_guide(self) -> None:
        """Test creation of a default study guide."""
        study_guide = study_guide_domain.StudyGuide.create_study_guide(
            2, 'topic_123', 'Sample Heading', '<p>Sample content</p>')

        self.assertEqual(study_guide.id, 'topic_123-2')
        self.assertEqual(study_guide.topic_id, 'topic_123')
        self.assertEqual(len(study_guide.sections), 1)
        self.assertEqual(
            study_guide.sections[0].heading.unicode_str,
            'Sample Heading'
        )
        self.assertEqual(
            study_guide.sections[0].content.html,
            '<p>Sample content</p>'
        )
        self.assertEqual(
            study_guide.language_code,
            constants.DEFAULT_LANGUAGE_CODE
        )
        self.assertEqual(study_guide.version, 1)

    def test_get_study_guide_id(self) -> None:
        """Test generation of study guide ID."""
        page_id = study_guide_domain.StudyGuide.get_study_guide_id(
            'abc',
            5
        )
        self.assertEqual(page_id, 'abc-5')

    def test_get_subtopic_id_from_study_guide_id(self) -> None:
        """Test extraction of subtopic ID from study guide ID."""
        subtopic_id = (
            self.study_guide
            .get_subtopic_id_from_study_guide_id()
        )
        self.assertEqual(subtopic_id, self.subtopic_id)

    def test_to_dict(self) -> None:
        """Test conversion of study guide to dictionary."""
        study_guide_dict = self.study_guide.to_dict()

        expected_keys = {
            'id', 'next_content_id_index', 'topic_id', 'sections',
            'sections_schema_version', 'language_code', 'version'
        }
        self.assertEqual(set(study_guide_dict.keys()), expected_keys)
        self.assertEqual(
            study_guide_dict['id'],
            f'{self.topic_id}-{self.subtopic_id}'
        )
        self.assertEqual(study_guide_dict['topic_id'], self.topic_id)

    def test_to_subtopic_page_dict_for_android(self) -> None:
        """Test conversion to Android-compatible format."""
        # Add another section to test concatenation.
        self.study_guide.add_section('Second Heading', '<p>Second content</p>')

        android_dict = self.study_guide.to_subtopic_page_dict_for_android()

        expected_keys = {
            'id', 'topic_id', 'page_contents', 'page_contents_schema_version',
            'language_code', 'version'
        }
        self.assertEqual(set(android_dict.keys()), expected_keys)

        # Check that HTML is concatenated properly.
        page_contents = android_dict['page_contents']
        self.assertIn('subtitled_html', page_contents)

        html_content = page_contents['subtitled_html']['html']
        self.assertIn('<p><strong>Test Heading</strong></p>', html_content)
        self.assertIn('<p>Test content</p>', html_content)
        self.assertIn('<p><strong>Second Heading</strong></p>', html_content)
        self.assertIn('<p>Second content</p>', html_content)

    def test_add_section(self) -> None:
        """Test adding a new section to the study guide."""
        initial_count = len(self.study_guide.sections)
        self.study_guide.add_section('New Heading', '<p>New content</p>')

        self.assertEqual(len(self.study_guide.sections), initial_count + 1)
        new_section = self.study_guide.sections[-1]
        self.assertEqual(new_section.heading.unicode_str, 'New Heading')
        self.assertEqual(new_section.content.html, '<p>New content</p>')

    def test_delete_section(self) -> None:
        """Test deleting a section from the study guide."""
        # Add a second section first.
        self.study_guide.add_section('Second Heading', '<p>Second content</p>')

        # Get the content IDs of the first section.
        old_section = self.study_guide.sections[1]
        heading_content_id = old_section.heading.content_id
        content_content_id = old_section.content.content_id

        initial_count = len(self.study_guide.sections)
        self.study_guide.delete_section(heading_content_id, content_content_id)

        self.assertEqual(len(self.study_guide.sections), initial_count - 1)
        # The remaining section should be the second one.
        self.assertEqual(
            self.study_guide.sections[0].heading.unicode_str,
            'Test Heading'
        )

    def test_delete_section_with_invalid_content_ids(self) -> None:
        """Test deleting a section with invalid content IDs raises exception."""
        with self.assertRaisesRegex(
            Exception,
            (
                'Invalid section content_ids: heading=invalid_heading, '
                'content=invalid_content'
            )
        ):
            self.study_guide.delete_section(
                'invalid_heading',
                'invalid_content'
            )

    def test_update_section_heading(self) -> None:
        """Test updating a section heading."""
        self.study_guide.add_section('Second Heading', '<p>Second content</p>')
        old_section = self.study_guide.sections[1]
        old_content_id = old_section.heading.content_id
        new_heading = 'Updated Heading'

        self.study_guide.update_section_heading(new_heading, old_content_id)

        updated_section = self.study_guide.sections[1]
        self.assertEqual(
            updated_section.heading.unicode_str,
            'Updated Heading'
        )

    def test_update_section_heading_with_invalid_content_id(self) -> None:
        """Test updating section heading with invalid
            content ID raises exception.
        """
        new_heading = 'Updated Heading'

        with self.assertRaisesRegex(
            Exception,
            'Invalid heading content_id: invalid_id'):
            self.study_guide.update_section_heading(new_heading, 'invalid_id')

    def test_update_section_content(self) -> None:
        """Test updating a section's content."""
        # Add a second section to have multiple sections to test with.
        self.study_guide.add_section('Second Heading', '<p>Second content</p>')

        old_section = self.study_guide.sections[1]
        old_content_id = old_section.content.content_id

        new_content = '<p>Updated content</p>'

        self.study_guide.update_section_content(new_content, old_content_id)

        updated_section = self.study_guide.sections[1]
        self.assertEqual(
            updated_section.content.html,
            '<p>Updated content</p>'
        )

    def test_update_section_content_with_invalid_content_id(self) -> None:
        """Test updating section content with invalid content ID
        raises exception.
        """
        new_content = '<p>Updated content</p>'

        with self.assertRaisesRegex(
            Exception,
            'Invalid content content_id: invalid_id'):
            self.study_guide.update_section_content(new_content, 'invalid_id')

    def _assert_study_guide_validation_error(
        self, expected_error_substring: str
    ) -> None:
        """Checks that the study guide validation raises expected error."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.study_guide.validate()

    def test_topic_id_validation(self) -> None:
        """Test validation of topic_id field."""
        # Here we use MyPy ignore because we are assigning an integer
        # value where string is expected, and this is done to replace
        # the stored instance with an integer in order to trigger the
        # validation error during update.
        self.study_guide.topic_id = 1  # type: ignore[assignment]
        self._assert_study_guide_validation_error(
            'Expected topic_id to be a string'
        )

    def test_version_validation(self) -> None:
        """Test validation of version field."""
        # Here we use MyPy ignore because we are assigning a string
        # value where an integer is expected, and this is done to
        # replace the stored instance with a string in order to
        # trigger the validation error during update.
        self.study_guide.version = 'invalid_version'  # type: ignore[assignment]
        self._assert_study_guide_validation_error(
            'Expected version number to be an int'
        )

    def test_sections_schema_version_type_validation(self) -> None:
        """Test validation of sections schema version type."""
        # Here we use MyPy ignore because we are assigning a string
        # value where an integer is expected, and this is done to
        # replace the stored instance with a string in order to
        # trigger the validation error during update.
        self.study_guide.sections_schema_version = 'invalid_version'  # type: ignore[assignment]
        self._assert_study_guide_validation_error(
            'Expected sections schema version to be an integer'
        )

    def test_sections_schema_version_value_validation(self) -> None:
        """Test validation of sections schema version value."""
        self.study_guide.sections_schema_version = 0
        self._assert_study_guide_validation_error(
            'Expected sections schema version to be %s'
            % feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
        )

    def test_language_code_validation(self) -> None:
        """Test validation of language_code field."""
        # Here we use MyPy ignore because we are assigning an integer
        # value where string is expected, and this is done to replace
        # the stored instance with an integer in order to trigger the
        # validation error during update.
        self.study_guide.language_code = 0  # type: ignore[assignment]
        self._assert_study_guide_validation_error(
            'Expected language code to be a string'
        )

        self.study_guide.language_code = 'xz'
        self._assert_study_guide_validation_error('Invalid language code')


class StudyGuideChangeDomainUnitTests(test_utils.GenericTestBase):
    """Tests for StudyGuideChange domain objects."""

    def test_study_guide_change_object_with_missing_cmd(self) -> None:
        """Test StudyGuideChange with missing cmd raises validation error."""
        with self.assertRaisesRegex(
            utils.ValidationError, 'Missing cmd key in change dict'):
            study_guide_domain.StudyGuideChange({'invalid': 'data'})

    def test_study_guide_change_object_with_invalid_cmd(self) -> None:
        """Test StudyGuideChange with invalid cmd raises validation error."""
        with self.assertRaisesRegex(
            utils.ValidationError, 'Command invalid is not allowed'):
            study_guide_domain.StudyGuideChange({'cmd': 'invalid'})

    def test_study_guide_change_object_with_missing_attributes(self) -> None:
        """Test StudyGuideChange with missing required attributes."""
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The following required attributes are missing'):
            study_guide_domain.StudyGuideChange({
                'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                'property_name': 'sections_heading',
            })

    def test_study_guide_change_object_with_extra_attributes(self) -> None:
        """Test StudyGuideChange with extra attributes."""
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The following extra attributes are present: invalid'):
            study_guide_domain.StudyGuideChange({
                'cmd': study_guide_domain.CMD_CREATE_NEW,
                'topic_id': 'topic_id',
                'subtopic_id': 1,
                'invalid': 'invalid'
            })

    def test_study_guide_change_object_with_invalid_property(self) -> None:
        """Test StudyGuideChange with invalid property name."""
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Value for property_name in cmd update_study_guide_property: '
            'invalid is not allowed'):
            study_guide_domain.StudyGuideChange({
                'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
                'subtopic_id': 1,
                'property_name': 'invalid',
                'old_value': {
                    'content_id': 'section_heading_0',
                    'unicode_str': 'old'
                },
                'new_value': {
                    'content_id': 'section_heading_2',
                    'unicode_str': 'new'
                },
            })

    def test_create_new_study_guide_change(self) -> None:
        """Test creation of CreateNewStudyGuideCmd."""
        change_object = study_guide_domain.StudyGuideChange({
            'cmd': 'create_new',
            'topic_id': 'topic_id',
            'subtopic_id': 1
        })

        self.assertEqual(change_object.cmd, study_guide_domain.CMD_CREATE_NEW)
        self.assertEqual(change_object.topic_id, 'topic_id')
        self.assertEqual(change_object.subtopic_id, 1)

    def test_add_new_section_change(self) -> None:
        """Test creation of AddNewSectionCmd."""
        change_object = study_guide_domain.StudyGuideChange({
            'cmd': study_guide_domain.CMD_ADD_NEW_SECTION,
            'heading_plaintext': 'New Heading',
            'content_html': '<p>New content</p>',
            'subtopic_id': 1
        })

        self.assertEqual(
            change_object.cmd,
            study_guide_domain.CMD_ADD_NEW_SECTION
        )
        self.assertEqual(change_object.heading_plaintext, 'New Heading')
        self.assertEqual(change_object.content_html, '<p>New content</p>')
        self.assertEqual(change_object.subtopic_id, 1)

    def test_delete_section_change(self) -> None:
        """Test creation of DeleteSectionCmd."""
        change_object = study_guide_domain.StudyGuideChange({
            'cmd': 'delete_section',
            'heading_content_id': 'section_heading_0',
            'content_content_id': 'section_content_1',
            'subtopic_id': 1
        })

        self.assertEqual(
            change_object.cmd,
            study_guide_domain.CMD_DELETE_SECTION
        )
        self.assertEqual(change_object.heading_content_id, 'section_heading_0')
        self.assertEqual(change_object.content_content_id, 'section_content_1')
        self.assertEqual(change_object.subtopic_id, 1)

    def test_update_study_guide_property_sections_heading_change(self) -> None:
        """Test creation of UpdateStudyGuidePropertySectionsHeadingCmd."""

        change_object = study_guide_domain.StudyGuideChange({
            'cmd': 'update_study_guide_property',
            'subtopic_id': 1,
            'property_name': 'sections_heading',
            'old_value': {
                'content_id': 'section_heading_0',
                'unicode_str': 'Old Heading'
            },
            'new_value': {
                'content_id': 'section_heading_2',
                'unicode_str': 'New Heading'
            }
        })

        self.assertEqual(
            change_object.cmd,
            study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY
        )
        self.assertEqual(change_object.subtopic_id, 1)
        self.assertEqual(change_object.property_name, 'sections_heading')
        self.assertEqual(change_object.old_value, {
            'content_id': 'section_heading_0',
            'unicode_str': 'Old Heading'
        })
        self.assertEqual(change_object.new_value, {
            'content_id': 'section_heading_2',
            'unicode_str': 'New Heading'
        })

    def test_update_study_guide_property_sections_content_change(self) -> None:
        """Test creation of UpdateStudyGuidePropertySectionsContentCmd."""

        change_object = study_guide_domain.StudyGuideChange({
            'cmd': 'update_study_guide_property',
            'subtopic_id': 1,
            'property_name': 'sections_content',
            'old_value': {
                'content_id': 'section_content_1',
                'html': '<p>Old content</p>'
            },
            'new_value': {
                'content_id': 'section_content_3',
                'html': '<p>New content</p>'
            }
        })

        self.assertEqual(
            change_object.cmd,
            study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY
        )
        self.assertEqual(change_object.subtopic_id, 1)
        self.assertEqual(change_object.property_name, 'sections_content')
        self.assertEqual(change_object.old_value, {
            'content_id': 'section_content_1',
            'html': '<p>Old content</p>'
        })
        self.assertEqual(change_object.new_value, {
            'content_id': 'section_content_3',
            'html': '<p>New content</p>'
        })

    def test_migrate_study_guide_sections_schema_change(self) -> None:
        """Test creation of migration command."""
        change_object = study_guide_domain.StudyGuideChange({
            'cmd': 'migrate_study_guide_sections_schema_to_latest_version',
            'from_version': 1,
            'to_version': 2
        })

        self.assertEqual(
            change_object.cmd,
            (
                study_guide_domain
                .CMD_MIGRATE_STUDY_GUIDE_SECTIONS_SCHEMA_TO_LATEST_VERSION
            )
        )
        self.assertEqual(change_object.from_version, 1)
        self.assertEqual(change_object.to_version, 2)

    def test_to_dict(self) -> None:
        """Test StudyGuideChange to_dict method."""
        change_object = study_guide_domain.StudyGuideChange({
            'cmd': 'create_new',
            'topic_id': 'topic_id',
            'subtopic_id': 1
        })
        self.assertEqual(change_object.to_dict(), {
            'cmd': 'create_new',
            'topic_id': 'topic_id',
            'subtopic_id': 1
        })


class StudyGuideSummaryDomainUnitTests(test_utils.GenericTestBase):
    """Tests for StudyGuideSummary domain objects."""

    SUBTOPIC_ID = 1
    SUBTOPIC_TITLE = 'subtopic_title'
    PARENT_TOPIC_ID = 'topic_id'
    PARENT_TOPIC_NAME = 'topic_title'
    SUBTOPIC_MASTERY = 0.75

    def setUp(self) -> None:
        super().setUp()
        self.study_guide_summary = study_guide_domain.StudyGuideSummary(
            self.SUBTOPIC_ID, self.SUBTOPIC_TITLE, self.PARENT_TOPIC_ID,
            self.PARENT_TOPIC_NAME, 'thumbnail_filename', 'blue',
            self.SUBTOPIC_MASTERY, 'topic-url', 'classroom-url'
        )

    def test_to_dict(self) -> None:
        """Test StudyGuideSummary to_dict method."""
        study_guide_summary_dict = self.study_guide_summary.to_dict()

        expected_dict = {
            'subtopic_id': self.SUBTOPIC_ID,
            'subtopic_title': self.SUBTOPIC_TITLE,
            'parent_topic_id': self.PARENT_TOPIC_ID,
            'parent_topic_name': self.PARENT_TOPIC_NAME,
            'thumbnail_filename': 'thumbnail_filename',
            'thumbnail_bg_color': 'blue',
            'subtopic_mastery': self.SUBTOPIC_MASTERY,
            'parent_topic_url_fragment': 'topic-url',
            'classroom_url_fragment': 'classroom-url'
        }

        self.assertEqual(study_guide_summary_dict, expected_dict)

    def test_to_dict_with_none_values(self) -> None:
        """Test StudyGuideSummary to_dict with None values."""
        study_guide_summary = study_guide_domain.StudyGuideSummary(
            self.SUBTOPIC_ID, self.SUBTOPIC_TITLE, self.PARENT_TOPIC_ID,
            self.PARENT_TOPIC_NAME, None, None, None, None, None
        )

        study_guide_summary_dict = study_guide_summary.to_dict()

        expected_dict = {
            'subtopic_id': self.SUBTOPIC_ID,
            'subtopic_title': self.SUBTOPIC_TITLE,
            'parent_topic_id': self.PARENT_TOPIC_ID,
            'parent_topic_name': self.PARENT_TOPIC_NAME,
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'subtopic_mastery': None,
            'parent_topic_url_fragment': None,
            'classroom_url_fragment': None
        }

        self.assertEqual(study_guide_summary_dict, expected_dict)
