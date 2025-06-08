# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for the pages for study guides, and related models."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import state_domain
from core.domain import translation_domain

from typing import Final, List, Literal, Optional, TypedDict, Union

STUDY_GUIDE_PROPERTY_SECTIONS_HEADING: Final = 'sections_heading'
STUDY_GUIDE_PROPERTY_SECTIONS_CONTENT: Final = 'sections_content'

CMD_CREATE_NEW: Final = 'create_new'
# This takes additional 'heading_plaintext' and 'content_html' parameters.
CMD_ADD_NEW_SECTION: Final = 'add_new_section'
# This takes additional 'heading_content_id' and 'content_content_id'
# parameters.
CMD_DELETE_SECTION: Final = 'delete_section'
# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_STUDY_GUIDE_PROPERTY: Final = 'update_study_guide_property'
CMD_MIGRATE_STUDY_GUIDE_SECTIONS_SCHEMA_TO_LATEST_VERSION: Final = (
    'migrate_study_guide_sections_schema_to_latest_version')


class StudyGuideChange(change_domain.BaseChange):
    """Domain object for changes made to study_guide object.

    The allowed commands, together with the attributes:
        - 'create_new' (with topic_id, subtopic_id).
        - 'add_new_section' (
            with heading_plaintext, content_html, subtopic_id).
        - 'delete_section' (
            with heading_content_id, content_content_id,
            subtopic_id).
        - 'update_study_guide_property' (
            with property_name, new_value, old_value, subtopic_id).
    """

    # The allowed list of study guide properties which can be used in
    # update_study_guide_property command.
    STUDY_GUIDE_PROPERTIES: List[str] = [
        STUDY_GUIDE_PROPERTY_SECTIONS_HEADING,
        STUDY_GUIDE_PROPERTY_SECTIONS_CONTENT
    ]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['topic_id', 'subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_NEW_SECTION,
        'required_attribute_names': [
            'heading_plaintext', 'content_html', 'subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_SECTION,
        'required_attribute_names': [
            'heading_content_id', 'content_content_id',
            'subtopic_id'
        ],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_STUDY_GUIDE_PROPERTY,
        'required_attribute_names': [
            'property_name', 'new_value', 'old_value', 'subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': STUDY_GUIDE_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_STUDY_GUIDE_SECTIONS_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


AllowedUpdateStudyGuidePropertyCmdTypes = Union[
    state_domain.SubtitledUnicodeDict,
    state_domain.SubtitledHtmlDict,
]


class CreateNewStudyGuideCmd(StudyGuideChange):
    """Class representing the StudyGuideChange's
    CMD_CREATE_NEW command.
    """

    topic_id: str
    subtopic_id: int


class AddNewSectionCmd(StudyGuideChange):
    """Class representing the StudyGuideChange's
    CMD_ADD_NEW_SECTION command.
    """

    heading_plaintext: str
    content_html: str


class DeleteSectionCmd(StudyGuideChange):
    """Class representing the StudyGuideChange's
    CMD_DELETE_SECTION command.
    """

    heading_content_id: str
    content_content_id: str


class UpdateStudyGuidePropertyCmd(StudyGuideChange):
    """Class representing the StudyGuideChange's
    CMD_UPDATE_STUDY_GUIDE_PROPERTY command.
    """

    subtopic_id: int
    property_name: str
    new_value: AllowedUpdateStudyGuidePropertyCmdTypes
    old_value: AllowedUpdateStudyGuidePropertyCmdTypes


class UpdateStudyGuidePropertySectionsHeadingCmd(StudyGuideChange):
    """Class representing the StudyGuideChange's
    CMD_UPDATE_STUDY_GUIDE_PROPERTY command with
    STUDY_GUIDE_PROPERTY_SECTIONS_HEADING as
    allowed value.
    """

    subtopic_id: int
    property_name: Literal['sections_heading']
    new_value: state_domain.SubtitledUnicodeDict
    old_value: state_domain.SubtitledUnicodeDict


class UpdateStudyGuidePropertySectionsContentCmd(StudyGuideChange):
    """Class representing the StudyGuideChange's
    CMD_UPDATE_STUDY_GUIDE_PROPERTY command with
    STUDY_GUIDE_PROPERTY_SECTIONS_CONTENT as
    allowed value.
    """

    subtopic_id: int
    property_name: Literal['sections_content']
    new_value: state_domain.SubtitledHtmlDict
    old_value: state_domain.SubtitledHtmlDict


class StudyGuideSectionDict(TypedDict):
    """Dictionary representing the StudyGuideSectionDict object."""

    heading: state_domain.SubtitledUnicodeDict
    content: state_domain.SubtitledHtmlDict


class VersionedStudyGuideSectionsDict(TypedDict):
    """Dictionary representing the versioned StudyGuideSectionsDict object."""

    schema_version: int
    sections: List[StudyGuideSectionDict]


class StudyGuideSection:
    """Domain object for the section of a study guide."""

    def __init__(
        self,
        heading: state_domain.SubtitledUnicode,
        content: state_domain.SubtitledHtml,
    ) -> None:
        """Constructs a StudyGuideSection domain object.

        Args:
            heading: SubtitledUnicode. The heading of the section being
                displayed on the page.
            content: SubtitledHtml. The content of the section being displayed
                on the page.
        """
        self.heading = heading
        self.content = content

    def validate(self) -> None:
        """Validates the StudyGuideSectionObject, verifying that all
        fields are of the correct type.
        """
        self.heading.validate()
        self.content.validate()

    @classmethod
    def create_study_guide_section(
        cls,
        heading_content_id: str,
        heading_plaintext: str,
        content_content_id: str,
        content_html: str
    ) -> StudyGuideSection:
        """Creates a default study guide section object.

        Returns:
            StudyGuideSection. A default object.
        """
        return cls(
            state_domain.SubtitledUnicode(
                heading_content_id,
                heading_plaintext),
            state_domain.SubtitledHtml(
                content_content_id,
                content_html))

    def to_dict(self) -> StudyGuideSectionDict:
        """Returns a dict representing this StudyGuideSection domain object.

        Returns:
            dict. A dict, mapping all fields of StudyGuideSection instance.
        """
        return {
            'heading': self.heading.to_dict(),
            'content': self.content.to_dict(),
        }

    @classmethod
    def from_dict(
        cls, section_dict: StudyGuideSectionDict
    ) -> StudyGuideSection:
        """Creates a study guide section object from a dictionary.

        Args:
            section_dict: dict. The dict representation of
                StudyGuideSection object.

        Returns:
            StudyGuideSection. The corresponding object.
        """
        heading = state_domain.SubtitledUnicode.from_dict(
            section_dict['heading'])
        content = state_domain.SubtitledHtml.from_dict(
            section_dict['content']
        )
        heading.validate()
        content.validate()
        return cls(
            heading,
            content)


class StudyGuideDict(TypedDict):
    """Dictionary representing the StudyGuide object."""

    id: str
    topic_id: str
    sections: List[StudyGuideSectionDict]
    sections_schema_version: int
    next_content_id_index: int
    language_code: str
    version: int


class StudyGuidePageContentsDict(TypedDict):
    """Dictionary representing the Android Study Guide
    PageContents object.
    """

    subtitled_html: state_domain.SubtitledHtmlDict


class StudyGuideAndroidDict(TypedDict):
    """Dictionary representing the Android StudyGuide object."""

    id: str
    topic_id: str
    page_contents: StudyGuidePageContentsDict
    page_contents_schema_version: int
    language_code: str
    version: int


class StudyGuide:
    """Domain object for a Study Guide."""

    def __init__(
        self,
        study_guide_id: str,
        topic_id: str,
        sections: List[StudyGuideSection],
        sections_schema_version: int,
        next_content_id_index: int,
        language_code: str,
        version: int
    ) -> None:
        """Constructs a StudyGuide domain object.

        Args:
            study_guide_id: str. The unique ID of the study guide.
            topic_id: str. The ID of the topic that the subtopic containing
                this study guide is a part of.
            sections: StudyGuideSection. List of sections consisting of heading
                and content pairs of the to be shown to the user.
            sections_schema_version: int. The schema version for the sections
                object.
            next_content_id_index: int. The content id for the next created
                section.
            language_code: str. The ISO 639-1 code for the language this
                study guide is written in.
            version: int. The current version of the study guide.
        """
        self.id = study_guide_id
        self.next_content_id_index = next_content_id_index
        self.topic_id = topic_id
        self.sections = sections
        self.sections_schema_version = sections_schema_version
        self.language_code = language_code
        self.version = version

    def to_dict(self) -> StudyGuideDict:
        """Returns a dict representing this StudyGuide domain object.

        Returns:
            dict. A dict, mapping all fields of StudyGuide instance.
        """
        sections_dicts = []
        for section in self.sections:
            sections_dicts.append(section.to_dict())
        return {
            'id': self.id,
            'next_content_id_index': self.next_content_id_index,
            'topic_id': self.topic_id,
            'sections': sections_dicts,
            'sections_schema_version': self.sections_schema_version,
            'language_code': self.language_code,
            'version': self.version
        }

    def to_subtopic_page_dict_for_android(self) -> StudyGuideAndroidDict:
        """Returns a dict formatted for Android compatibility.

        Returns:
            dict. A dictionary containing the study guide data formatted
            for Android with a single 'subtitled_html' field.
        """
        concatenated_html_parts = []

        for section in self.sections:
            section_dict = section.to_dict()
            heading_html = (
                '<p><strong>' +
                f'{section_dict["heading"]["unicode_str"]}' +
                '</strong></p>'
            )
            concatenated_html_parts.append(heading_html)
            concatenated_html_parts.append(section_dict['content']['html'])

        concatenated_html = '\n\n'.join(concatenated_html_parts)

        return {
            'id': self.id,
            'topic_id': self.topic_id,
            'page_contents': {
                'subtitled_html': {
                    'content_id': 'content',
                    'html': concatenated_html
                }
            },
            'page_contents_schema_version': self.sections_schema_version,
            'language_code': self.language_code,
            'version': self.version
        }

    @classmethod
    def get_study_guide_id(cls, topic_id: str, subtopic_id: int) -> str:
        """Returns the study_guide_id from the topic_id and subtopic_id.

        Args:
            topic_id: str. The id of the topic that the study guide
                is a part of.
            subtopic_id: int. The id of the subtopic which contains
                the study guide.

        Returns:
            str. The study_guide_id calculated from the given values.
        """
        return '%s-%s' % (topic_id, subtopic_id)

    @classmethod
    def create_study_guide(
        cls,
        subtopic_id: int,
        topic_id: str,
        heading_plaintext: str,
        content_html: str
    ) -> StudyGuide:
        """Creates a StudyGuide object with default values.

        Args:
            subtopic_id: int. ID of the subtopic which contains
                the study guide.
            topic_id: str. The Id of the topic to which this study guide
                is linked with.
            heading_plaintext: str. The heading of the first section.
            content_html: str. The content of the first section.

        Returns:
            StudyGuide. A study guide object with given id, topic_id and
            sections field.
        """
        content_id_generator = translation_domain.ContentIdGenerator()
        study_guide_id = cls.get_study_guide_id(
            topic_id,
            subtopic_id
        )
        sections = []
        section = StudyGuideSection.create_study_guide_section(
                content_id_generator.generate(
                    translation_domain.ContentType.SECTION,
                    'heading'),
                    heading_plaintext,
                content_id_generator.generate(
                    translation_domain.ContentType.SECTION,
                    'content'),
                    content_html)
        sections.append(section)
        return cls(
            study_guide_id, topic_id,
            sections,
            feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION,
            content_id_generator.next_content_id_index,
            constants.DEFAULT_LANGUAGE_CODE, 1)

    def get_subtopic_id_from_study_guide_id(self) -> int:
        """Returns the subtopic_id from the study_guide_id
            of the object.

        Returns:
            int. The subtopic_id of the object.
        """
        return int(self.id[len(self.topic_id) + 1:])

    def update_section_heading(
        self,
        new_section_heading: str,
        old_section_heading_content_id: str
    ) -> None:
        """The new value for the heading data field.

        Args:
            new_section_heading: str. The new heading for a
                section of the study guide.
            old_section_heading_content_id: str. The content id of the
                old heading for a section of the study guide to be
                updated.

        Raises:
            Exception. The provided old_section_heading_content_id
                does not exist.
        """
        for section in self.sections:
            if old_section_heading_content_id == section.heading.content_id:
                section.heading.unicode_str = new_section_heading
                return

        raise Exception(
            'Invalid heading content_id: %s; '
            'it is not in the list of sections for '
            'this study guide' % (old_section_heading_content_id)
        )

    def update_section_content(
        self,
        new_section_content: str,
        old_section_content_content_id: str
    ) -> None:
        """The new value for the content data field.

        Args:
            new_section_content: str. The new content
                for a section of the study guide.
            old_section_content_content_id: str. The content id
                of the old content for a section of the study
                guide to be updated.

        Raises:
            Exception. The provided old_section_content_content_id
                does not exist.
        """
        for section in self.sections:
            if old_section_content_content_id == section.content.content_id:
                section.content.html = new_section_content
                return

        raise Exception(
            'Invalid content content_id: %s; '
            'it is not in the list of sections for '
            'this study guide' % (old_section_content_content_id)
        )

    def add_section(
            self,
            heading_plaintext: str,
            content_html: str
    ) -> None:
        """Adds a section to the study guide.

        Args:
            heading_plaintext: str. The heading of the new section.
            content_html: str. The content of the new section.
        """
        content_id_generator = translation_domain.ContentIdGenerator(
            self.next_content_id_index)
        new_section = StudyGuideSection.create_study_guide_section(
            content_id_generator.generate(
                translation_domain.ContentType.SECTION,
                'heading'
            ),
            heading_plaintext,
            content_id_generator.generate(
                translation_domain.ContentType.SECTION,
                'content'
            ),
            content_html
        )
        self.sections.append(new_section)

    def delete_section(
        self,
        heading_content_id: str,
        content_content_id: str
    ) -> None:
        """Deletes a section from the study guide.

        Args:
            heading_content_id: str. The content id of the heading of the
                section to be deleted.
            content_content_id: str. The content id of the content of the
                section to be deleted.

        Raises:
            Exception. The provided heading_content_id or
                content_content_id does not exist.
        """
        for i, section in enumerate(self.sections):
            if (section.heading.content_id == heading_content_id and
                section.content.content_id == content_content_id):
                del self.sections[i]
                return

        raise Exception(
            'Invalid section content_ids: heading=%s, content=%s; '
            'no matching section found in this study guide' % (
                heading_content_id, content_content_id)
        )

    def validate(self) -> None:
        """Validates various properties of the StudyGuide object.

        Raises:
            ValidationError. One or more attributes of the study guide are
                invalid.
        """
        if not isinstance(self.topic_id, str):
            raise utils.ValidationError(
                'Expected topic_id to be a string, received %s' %
                self.topic_id)
        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version number to be an int, received %s' %
                self.version)
        for section in self.sections:
            section.validate()

        if not isinstance(self.sections_schema_version, int):
            raise utils.ValidationError(
                'Expected sections schema version to be an integer, '
                'received %s' % self.sections_schema_version)
        if (
                self.sections_schema_version !=
                feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected sections schema version to be %s, received %s'
                % (
                    feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION,
                    self.sections_schema_version)
            )

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not any(
                self.language_code == lc['code']
                for lc in constants.SUPPORTED_CONTENT_LANGUAGES
        ):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)


class StudyGuideSummaryDict(TypedDict):
    """Dictionary representation of StudyGuideSummary domain object."""

    subtopic_id: int
    subtopic_title: str
    parent_topic_id: str
    parent_topic_name: str
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    subtopic_mastery: Optional[float]
    parent_topic_url_fragment: Optional[str]
    classroom_url_fragment: Optional[str]


class StudyGuideSummary:
    """Domain object for Study Guide Summary."""

    def __init__(
        self,
        subtopic_id: int,
        subtopic_title: str,
        parent_topic_id: str,
        parent_topic_name: str,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        subtopic_mastery: Optional[float],
        parent_topic_url_fragment: Optional[str],
        classroom_url_fragment: Optional[str]
    ):
        """Initialize a StudyGuideSummary object.

        Args:
            subtopic_id: str. The id of the study guide.
            subtopic_title: str. The title of the study guide.
            parent_topic_id: str. The id of the parent topic.
            parent_topic_name: str. The name of the parent topic.
            thumbnail_filename: str. The filename of the thumbnail image.
            thumbnail_bg_color: str. The background color of the thumbnail
                image.
            subtopic_mastery: float. The mastery score of a user in the
                study guide.
            parent_topic_url_fragment: str. The url fragment of the parent
                topic.
            classroom_url_fragment: str. The url fragment of the classroom
                to which the parent topic belongs.
        """
        self.subtopic_id = subtopic_id
        self.subtopic_title = subtopic_title
        self.parent_topic_id = parent_topic_id
        self.parent_topic_name = parent_topic_name
        self.thumbnail_filename = thumbnail_filename
        self.thumbnail_bg_color = thumbnail_bg_color
        self.subtopic_mastery = subtopic_mastery
        self.parent_topic_url_fragment = parent_topic_url_fragment
        self.classroom_url_fragment = classroom_url_fragment

    def to_dict(self) -> StudyGuideSummaryDict:
        """Returns a dict representing this StudyGuideSummary domain object.

        Returns:
            dict. A dict, mapping all fields of StudyGuideSummary instance.
        """
        return {
            'subtopic_id': self.subtopic_id,
            'subtopic_title': self.subtopic_title,
            'parent_topic_id': self.parent_topic_id,
            'parent_topic_name': self.parent_topic_name,
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'subtopic_mastery': self.subtopic_mastery,
            'parent_topic_url_fragment': self.parent_topic_url_fragment,
            'classroom_url_fragment': self.classroom_url_fragment
        }
