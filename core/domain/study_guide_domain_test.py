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

"""Unit tests for study guide domain objects."""

from typing import Dict, List

from core.domain import study_guide_domain
from core.domain import state_domain
from core.domain import translation_domain
from core.tests import test_utils
from core import utils
from core import feconf
from core.constants import constants


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
        # Should not raise any exception
        self.study_guide_section.validate()

    def test_create_study_guide_section(self) -> None:
        """Test creation of a study guide section."""
        section = study_guide_domain.StudyGuideSection.create_study_guide_section(
            'section_heading_2', 'Sample Heading', 'section_content_3', '<p>Sample content</p>')
        
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
    study_guide_id: int = 1

    def setUp(self) -> None:
        super().setUp()
        self.study_guide = study_guide_domain.StudyGuide.create_study_guide(
            self.study_guide_id, self.topic_id, 'Test Heading', '<p>Test content</p>')

    def test_create_study_guide(self) -> None:
        """Test creation of a default study guide."""
        study_guide = study_guide_domain.StudyGuide.create_study_guide(
            2, 'topic_123', 'Sample Heading', '<p>Sample content</p>')
        
        self.assertEqual(study_guide.id, 'topic_123-2')
        self.assertEqual(study_guide.topic_id, 'topic_123')
        self.assertEqual(len(study_guide.sections), 1)
        self.assertEqual(study_guide.sections[0].heading.unicode_str, 'Sample Heading')
        self.assertEqual(study_guide.sections[0].content.html, '<p>Sample content</p>')
        self.assertEqual(study_guide.language_code, constants.DEFAULT_LANGUAGE_CODE)
        self.assertEqual(study_guide.version, 1)

    def test_get_study_guide_page_id(self) -> None:
        """Test generation of study guide page ID."""
        page_id = study_guide_domain.StudyGuide.get_study_guide_page_id('abc', 5)
        self.assertEqual(page_id, 'abc-5')

    def test_get_study_guide_id_from_study_guide_page_id(self) -> None:
        """Test extraction of study guide ID from page ID."""
        study_guide_id = self.study_guide.get_study_guide_id_from_study_guide_page_id()
        self.assertEqual(study_guide_id, self.study_guide_id)

    def test_to_dict(self) -> None:
        """Test conversion of study guide to dictionary."""
        study_guide_dict = self.study_guide.to_dict()
        
        expected_keys = {
            'id', 'next_content_id_index', 'topic_id', 'sections',
            'sections_schema_version', 'language_code', 'version'
        }
        self.assertEqual(set(study_guide_dict.keys()), expected_keys)
        self.assertEqual(study_guide_dict['id'], f'{self.topic_id}-{self.study_guide_id}')
        self.assertEqual(study_guide_dict['topic_id'], self.topic_id)

    def test_to_subtopic_page_dict_for_android(self) -> None:
        """Test conversion to Android-compatible format."""
        # Add another section to test concatenation
        self.study_guide.add_section('Second Heading', '<p>Second content</p>')
        
        android_dict = self.study_guide.to_subtopic_page_dict_for_android()
        
        expected_keys = {
            'id', 'topic_id', 'page_contents', 'page_contents_schema_version',
            'language_code', 'version'
        }
        self.assertEqual(set(android_dict.keys()), expected_keys)
        
        # Check that HTML is concatenated properly
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
        # Add a second section first
        self.study_guide.add_section('Second Heading', '<p>Second content</p>')
        
        # Get the content IDs of the first section
        first_section = self.study_guide.sections[0]
        heading_content_id = first_section.heading.content_id
        content_content_id = first_section.content.content_id
        
        initial_count = len(self.study_guide.sections)
        self.study_guide.delete_section(heading_content_id, content_content_id)
        
        self.assertEqual(len(self.study_guide.sections), initial_count - 1)
        # The remaining section should be the second one
        self.assertEqual(self.study_guide.sections[0].heading.unicode_str, 'Second Heading')

    def test_delete_section_with_invalid_content_ids(self) -> None:
        """Test deleting a section with invalid content IDs raises exception."""
        with self.assertRaisesRegex(
            Exception,
            'Invalid section content_ids: heading=invalid_heading, content=invalid_content'):
            self.study_guide.delete_section('invalid_heading', 'invalid_content')

    def test_update_section_heading(self) -> None:
        """Test updating a section heading."""
        first_section = self.study_guide.sections[0]
        old_content_id = first_section.heading.content_id
        new_heading = state_domain.SubtitledUnicode('new_content_id', 'Updated Heading')
        
        self.study_guide.update_section_heading(new_heading, old_content_id)
        
        updated_section = self.study_guide.sections[0]
        self.assertEqual(updated_section.heading.content_id, 'new_content_id')
        self.assertEqual(updated_section.heading.unicode_str, 'Updated Heading')

    def test_update_section_heading_with_invalid_content_id(self) -> None:
        """Test updating section heading with invalid content ID raises exception."""
        new_heading = state_domain.SubtitledUnicode('new_content_id', 'Updated Heading')
        
        with self.assertRaisesRegex(
            Exception,
            'Invalid heading content_id: invalid_id'):
            self.study_guide.update_section_heading(new_heading, 'invalid_id')

    def _assert_study_guide_validation_error(
        self, expected_error_substring: str
    ) -> None:
        """Checks that the study guide validation raises expected error."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.study_guide.validate()

    def test_topic_id_validation(self) -> None:
        """Test validation of topic_id field."""
        self.study_guide.topic_id = 1  # type: ignore[assignment]
        self._assert_study_guide_validation_error(
            'Expected topic_id to be a string'
        )

    def test_version_validation(self) -> None:
        """Test validation of version field."""
        self.study_guide.version = 'invalid_version'  # type: ignore[assignment]
        self._assert_study_guide_validation_error(
            'Expected version number to be an int'
        )

    def test_sections_schema_version_type_validation(self) -> None:
        """Test validation of sections schema version type."""
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
                'study_guide_id': 1,
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
                'study_guide_id': 1,
                'property_name': 'invalid',
                'old_value': {'content_id': 'old', 'unicode_str': 'old'},
                'new_value': {'content_id': 'new', 'unicode_str': 'new'},
            })

    def test_create_new_study_guide_change(self) -> None:
        """Test creation of CreateNewStudyGuideCmd."""
        change_dict = {
            'cmd': study_guide_domain.CMD_CREATE_NEW,
            'topic_id': 'topic_id',
            'study_guide_id': 1
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        
        self.assertEqual(change_object.cmd, study_guide_domain.CMD_CREATE_NEW)
        self.assertEqual(change_object.topic_id, 'topic_id')
        self.assertEqual(change_object.study_guide_id, 1)

    def test_add_new_section_change(self) -> None:
        """Test creation of AddNewSectionCmd."""
        change_dict = {
            'cmd': study_guide_domain.CMD_ADD_NEW_SECTION,
            'heading_plaintext': 'New Heading',
            'content_html': '<p>New content</p>',
            'study_guide_id': 1
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        
        self.assertEqual(change_object.cmd, study_guide_domain.CMD_ADD_NEW_SECTION)
        self.assertEqual(change_object.heading_plaintext, 'New Heading')
        self.assertEqual(change_object.content_html, '<p>New content</p>')
        self.assertEqual(change_object.study_guide_id, 1)

    def test_delete_section_change(self) -> None:
        """Test creation of DeleteSectionCmd."""
        change_dict = {
            'cmd': study_guide_domain.CMD_DELETE_SECTION,
            'heading_content_id': 'heading_id',
            'content_content_id': 'content_id',
            'study_guide_id': 1
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        
        self.assertEqual(change_object.cmd, study_guide_domain.CMD_DELETE_SECTION)
        self.assertEqual(change_object.heading_content_id, 'heading_id')
        self.assertEqual(change_object.content_content_id, 'content_id')
        self.assertEqual(change_object.study_guide_id, 1)

    def test_update_study_guide_property_sections_heading_change(self) -> None:
        """Test creation of UpdateStudyGuidePropertySectionsHeadingCmd."""
        old_value = {'content_id': 'old_id', 'unicode_str': 'Old Heading'}
        new_value = {'content_id': 'new_id', 'unicode_str': 'New Heading'}
        
        change_dict = {
            'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
            'study_guide_id': 1,
            'property_name': study_guide_domain.STUDY_GUIDE_PROPERTY_SECTIONS_HEADING,
            'old_value': old_value,
            'new_value': new_value
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        
        self.assertEqual(change_object.cmd, study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY)
        self.assertEqual(change_object.study_guide_id, 1)
        self.assertEqual(change_object.property_name, 'sections_heading')
        self.assertEqual(change_object.old_value, old_value)
        self.assertEqual(change_object.new_value, new_value)

    def test_update_study_guide_property_sections_content_change(self) -> None:
        """Test creation of UpdateStudyGuidePropertySectionsContentCmd."""
        old_value = {'content_id': 'old_id', 'html': '<p>Old content</p>'}
        new_value = {'content_id': 'new_id', 'html': '<p>New content</p>'}
        
        change_dict = {
            'cmd': study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
            'study_guide_id': 1,
            'property_name': study_guide_domain.STUDY_GUIDE_PROPERTY_SECTIONS_CONTENT,
            'old_value': old_value,
            'new_value': new_value
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        
        self.assertEqual(change_object.cmd, study_guide_domain.CMD_UPDATE_STUDY_GUIDE_PROPERTY)
        self.assertEqual(change_object.study_guide_id, 1)
        self.assertEqual(change_object.property_name, 'sections_content')
        self.assertEqual(change_object.old_value, old_value)
        self.assertEqual(change_object.new_value, new_value)

    def test_migrate_study_guide_sections_schema_change(self) -> None:
        """Test creation of migration command."""
        change_dict = {
            'cmd': study_guide_domain.CMD_MIGRATE_STUDY_GUIDE_SECTIONS_SCHEMA_TO_LATEST_VERSION,
            'from_version': 1,
            'to_version': 2
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        
        self.assertEqual(
            change_object.cmd,
            study_guide_domain.CMD_MIGRATE_STUDY_GUIDE_SECTIONS_SCHEMA_TO_LATEST_VERSION
        )
        self.assertEqual(change_object.from_version, 1)
        self.assertEqual(change_object.to_version, 2)

    def test_to_dict(self) -> None:
        """Test StudyGuideChange to_dict method."""
        change_dict = {
            'cmd': study_guide_domain.CMD_CREATE_NEW,
            'topic_id': 'topic_id',
            'study_guide_id': 1
        }
        change_object = study_guide_domain.StudyGuideChange(change_dict)
        self.assertEqual(change_object.to_dict(), change_dict)


class StudyGuideSummaryDomainUnitTests(test_utils.GenericTestBase):
    """Tests for StudyGuideSummary domain objects."""

    STUDY_GUIDE_ID = 1
    STUDY_GUIDE_TITLE = 'study_guide_title'
    PARENT_TOPIC_ID = 'topic_id'
    PARENT_TOPIC_NAME = 'topic_title'
    STUDY_GUIDE_MASTERY = 0.75

    def setUp(self) -> None:
        super().setUp()
        self.study_guide_summary = study_guide_domain.StudyGuideSummary(
            self.STUDY_GUIDE_ID, self.STUDY_GUIDE_TITLE, self.PARENT_TOPIC_ID,
            self.PARENT_TOPIC_NAME, 'thumbnail_filename', 'blue',
            self.STUDY_GUIDE_MASTERY, 'topic-url', 'classroom-url'
        )

    def test_to_dict(self) -> None:
        """Test StudyGuideSummary to_dict method."""
        study_guide_summary_dict = self.study_guide_summary.to_dict()
        
        expected_dict = {
            'study_guide_id': self.STUDY_GUIDE_ID,
            'study_guide_title': self.STUDY_GUIDE_TITLE,
            'parent_topic_id': self.PARENT_TOPIC_ID,
            'parent_topic_name': self.PARENT_TOPIC_NAME,
            'thumbnail_filename': 'thumbnail_filename',
            'thumbnail_bg_color': 'blue',
            'study_guide_mastery': self.STUDY_GUIDE_MASTERY,
            'parent_topic_url_fragment': 'topic-url',
            'classroom_url_fragment': 'classroom-url'
        }
        
        self.assertEqual(study_guide_summary_dict, expected_dict)

    def test_to_dict_with_none_values(self) -> None:
        """Test StudyGuideSummary to_dict with None values."""
        study_guide_summary = study_guide_domain.StudyGuideSummary(
            self.STUDY_GUIDE_ID, self.STUDY_GUIDE_TITLE, self.PARENT_TOPIC_ID,
            self.PARENT_TOPIC_NAME, None, None, None, None, None
        )
        
        study_guide_summary_dict = study_guide_summary.to_dict()
        
        expected_dict = {
            'study_guide_id': self.STUDY_GUIDE_ID,
            'study_guide_title': self.STUDY_GUIDE_TITLE,
            'parent_topic_id': self.PARENT_TOPIC_ID,
            'parent_topic_name': self.PARENT_TOPIC_NAME,
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
            'study_guide_mastery': None,
            'parent_topic_url_fragment': None,
            'classroom_url_fragment': None
        }
        
        self.assertEqual(study_guide_summary_dict, expected_dict)


class StudyGuideUpdateSectionsFromModelTests(test_utils.GenericTestBase):
    """Tests for the update_sections_from_model method."""

    def test_update_sections_from_model(self) -> None:
        """Test updating sections from model with version conversion."""
        versioned_sections: study_guide_domain.VersionedStudyGuideSectionsDict = {
            'schema_version': 1,
            'sections': [
                {
                    'heading': {
                        'content_id': 'heading_1',
                        'unicode_str': 'Test Heading'
                    },
                    'content': {
                        'content_id': 'content_1',
                        'html': '<p>Test content</p>'
                    }
                }
            ]
        }
        
        # Mock the conversion function that would be called
        def mock_conversion_fn(section_dict):
            # Simulate a conversion that adds a new field
            converted_section = section_dict.copy()
            converted_section['new_field'] = 'added_in_v2'
            return converted_section
        
        # Mock the conversion method on the StudyGuide class
        original_method = getattr(study_guide_domain.StudyGuide, 
                                '_convert_section_v1_dict_to_v2_dict', None)
        study_guide_domain.StudyGuide._convert_section_v1_dict_to_v2_dict = staticmethod(mock_conversion_fn)
        
        try:
            initial_version = 1
            study_guide_domain.StudyGuide.update_sections_from_model(
                versioned_sections, initial_version)
            
            # Check that schema version was incremented
            self.assertEqual(versioned_sections['schema_version'], 2)
            
            # Check that conversion function was applied to each section
            self.assertEqual(len(versioned_sections['sections']), 1)
            self.assertIn('new_field', versioned_sections['sections'][0])
            self.assertEqual(versioned_sections['sections'][0]['new_field'], 'added_in_v2')
            
        finally:
            # Restore original method if it existed
            if original_method:
                study_guide_domain.StudyGuide._convert_section_v1_dict_to_v2_dict = original_method
            else:
                # Remove the mock method
                delattr(study_guide_domain.StudyGuide, '_convert_section_v1_dict_to_v2_dict')

    def test_update_sections_from_model_with_multiple_sections(self) -> None:
        """Test updating multiple sections from model."""
        versioned_sections: study_guide_domain.VersionedStudyGuideSectionsDict = {
            'schema_version': 2,
            'sections': [
                {
                    'heading': {
                        'content_id': 'heading_1',
                        'unicode_str': 'First Heading'
                    },
                    'content': {
                        'content_id': 'content_1',
                        'html': '<p>First content</p>'
                    }
                },
                {
                    'heading': {
                        'content_id': 'heading_2',
                        'unicode_str': 'Second Heading'
                    },
                    'content': {
                        'content_id': 'content_2',
                        'html': '<p>Second content</p>'
                    }
                }
            ]
        }
        
        # Mock conversion function
        def mock_conversion_fn(section_dict):
            converted_section = section_dict.copy()
            converted_section['converted'] = True
            return converted_section
        
        study_guide_domain.StudyGuide._convert_section_v2_dict_to_v3_dict = staticmethod(mock_conversion_fn)
        
        try:
            initial_version = 2
            study_guide_domain.StudyGuide.update_sections_from_model(
                versioned_sections, initial_version)
            
            # Check schema version increment
            self.assertEqual(versioned_sections['schema_version'], 3)
            
            # Check all sections were converted
            self.assertEqual(len(versioned_sections['sections']), 2)
            for section in versioned_sections['sections']:
                self.assertTrue(section['converted'])
                
        finally:
            delattr(study_guide_domain.StudyGuide, '_convert_section_v2_dict_to_v3_dict')


class StudyGuideConvertHtmlFieldsTests(test_utils.GenericTestBase):
    """Tests for the convert_html_fields_in_study_guide_sections method."""

    def test_convert_html_fields_in_study_guide_sections(self) -> None:
        """Test HTML conversion in study guide sections."""
        study_guide_sections = [
            {
                'heading': {
                    'content_id': 'heading_1',
                    'unicode_str': 'First Heading'
                },
                'content': {
                    'content_id': 'content_1',
                    'html': '<p>Original content</p>'
                }
            },
            {
                'heading': {
                    'content_id': 'heading_2',
                    'unicode_str': 'Second Heading'
                },
                'content': {
                    'content_id': 'content_2',
                    'html': '<div>Another content</div>'
                }
            }
        ]
        
        # Define a conversion function that wraps content in <strong> tags
        def html_conversion_fn(html_string: str) -> str:
            return f'<modified>{html_string}</modified>'
        
        converted_sections = study_guide_domain.StudyGuide.convert_html_fields_in_study_guide_sections(
            original_sections, html_conversion_fn)
        
        # Check that original sections were not modified
        self.assertEqual(original_sections[0]['content']['html'], original_html)
        
        # Check that converted sections have modified HTML
        self.assertEqual(
            converted_sections[0]['content']['html'],
            '<modified><p>Test content</p></modified>'
        )

    def test_convert_html_fields_with_empty_sections_list(self) -> None:
        """Test HTML conversion with empty sections list."""
        empty_sections = []
        
        def dummy_conversion_fn(html_string: str) -> str:
            return html_string.upper()
        
        converted_sections = study_guide_domain.StudyGuide.convert_html_fields_in_study_guide_sections(
            empty_sections, dummy_conversion_fn)
        
        self.assertEqual(len(converted_sections), 0)
        self.assertEqual(converted_sections, [])

    def test_convert_html_fields_with_complex_html(self) -> None:
        """Test HTML conversion with complex HTML content."""
        sections_with_complex_html = [
            {
                'heading': {
                    'content_id': 'heading_1',
                    'unicode_str': 'Complex HTML Section'
                },
                'content': {
                    'content_id': 'content_1',
                    'html': '<div><p>Paragraph <strong>bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul></div>'
                }
            }
        ]
        
        def strip_tags_conversion(html_string: str) -> str:
            # Simple function to demonstrate conversion - adds a wrapper div
            return f'<div class="converted">{html_string}</div>'
        
        converted_sections = study_guide_domain.StudyGuide.convert_html_fields_in_study_guide_sections(
            sections_with_complex_html, strip_tags_conversion)
        
        expected_html = '<div class="converted"><div><p>Paragraph <strong>bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul></div></div>'
        self.assertEqual(converted_sections[0]['content']['html'], expected_html)
