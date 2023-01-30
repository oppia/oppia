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

"""Domain objects for the pages for subtopics, and related models."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import state_domain

from typing import Callable, Final, List, Literal, Optional, TypedDict, Union

from core.domain import html_validation_service  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML: Final = 'page_contents_html'
SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO: Final = 'page_contents_audio'
SUBTOPIC_PAGE_PROPERTY_PAGE_WRITTEN_TRANSLATIONS: Final = (
    'page_written_translations'
)

CMD_CREATE_NEW: Final = 'create_new'
# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY: Final = 'update_subtopic_page_property'


class SubtopicPageChange(change_domain.BaseChange):
    """Domain object for changes made to subtopic_page object.

    The allowed commands, together with the attributes:
        - 'create_new' (with topic_id, subtopic_id)
        - 'update_subtopic_page_property' (
            with property_name, new_value, old_value, subtopic_id).
    """

    # The allowed list of subtopic page properties which can be used in
    # update_subtopic_page_property command.
    SUBTOPIC_PAGE_PROPERTIES: List[str] = [
        SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML,
        SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO,
        SUBTOPIC_PAGE_PROPERTY_PAGE_WRITTEN_TRANSLATIONS
    ]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['topic_id', 'subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
        'required_attribute_names': [
            'property_name', 'new_value', 'old_value', 'subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SUBTOPIC_PAGE_PROPERTIES},
        'deprecated_values': {}
    }]


AllowedUpdateSubtopicPagePropertyCmdTypes = Union[
    state_domain.SubtitledHtmlDict,
    state_domain.RecordedVoiceoversDict,
    state_domain.WrittenTranslationsDict
]


class CreateNewSubtopicPageCmd(SubtopicPageChange):
    """Class representing the SubtopicPageChange's
    CMD_CREATE_NEW command.
    """

    topic_id: str
    subtopic_id: int


class UpdateSubtopicPagePropertyCmd(SubtopicPageChange):
    """Class representing the SubtopicPageChange's
    CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY command.
    """

    subtopic_id: int
    property_name: str
    new_value: AllowedUpdateSubtopicPagePropertyCmdTypes
    old_value: AllowedUpdateSubtopicPagePropertyCmdTypes


class UpdateSubtopicPagePropertyPageContentsHtmlCmd(SubtopicPageChange):
    """Class representing the SubtopicPageChange's
    CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY command with
    SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML as
    allowed value.
    """

    subtopic_id: int
    property_name: Literal['page_contents_html']
    new_value: state_domain.SubtitledHtmlDict
    old_value: state_domain.SubtitledHtmlDict


class UpdateSubtopicPagePropertyPageContentsAudioCmd(SubtopicPageChange):
    """Class representing the SubtopicPageChange's
    CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY command with
    SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO as
    allowed value.
    """

    subtopic_id: int
    property_name: Literal['page_contents_audio']
    new_value: state_domain.RecordedVoiceoversDict
    old_value: state_domain.RecordedVoiceoversDict


class UpdateSubtopicPagePropertyPageWrittenTranslationsCmd(SubtopicPageChange):
    """Class representing the SubtopicPageChange's
    CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY command with
    SUBTOPIC_PAGE_PROPERTY_PAGE_WRITTEN_TRANSLATIONS
    as allowed value.
    """

    subtopic_id: int
    property_name: Literal['page_written_translations']
    new_value: state_domain.WrittenTranslationsDict
    old_value: state_domain.WrittenTranslationsDict


class SubtopicPageContentsDict(TypedDict):
    """Dictionary representing the SubtopicPageContents object."""

    subtitled_html: state_domain.SubtitledHtmlDict
    recorded_voiceovers: state_domain.RecordedVoiceoversDict
    written_translations: state_domain.WrittenTranslationsDict


class VersionedSubtopicPageContentsDict(TypedDict):
    """Dictionary representing the versioned SubtopicPageContents object."""

    schema_version: int
    page_contents: SubtopicPageContentsDict


class SubtopicPageContents:
    """Domain object for the contents on a subtopic page."""

    def __init__(
        self,
        subtitled_html: state_domain.SubtitledHtml,
        recorded_voiceovers: state_domain.RecordedVoiceovers,
        written_translations: state_domain.WrittenTranslations
    ) -> None:
        """Constructs a SubtopicPageContents domain object.

        Args:
            subtitled_html: SubtitledHtml. The html data being displayed on
                the page.
            recorded_voiceovers: RecordedVoiceovers. The recorded voiceovers for
                the subtopic page content and their translations in different
                languages.
            written_translations: WrittenTranslations. The text translations of
                the subtopic page content.
        """
        self.subtitled_html = subtitled_html
        self.recorded_voiceovers = recorded_voiceovers
        self.written_translations = written_translations

    def validate(self) -> None:
        """Validates the SubtopicPageContentsObject, verifying that all
        fields are of the correct type.
        """
        self.subtitled_html.validate()
        content_ids = [self.subtitled_html.content_id]
        self.recorded_voiceovers.validate(content_ids)
        self.written_translations.validate(content_ids)

    @classmethod
    def create_default_subtopic_page_contents(cls) -> SubtopicPageContents:
        """Creates a default subtopic page contents object.

        Returns:
            SubtopicPageContents. A default object.
        """
        content_id = feconf.DEFAULT_SUBTOPIC_PAGE_CONTENT_ID
        return cls(
            state_domain.SubtitledHtml.create_default_subtitled_html(
                content_id),
            state_domain.RecordedVoiceovers.from_dict(
                {'voiceovers_mapping': {content_id: {}}}),
            state_domain.WrittenTranslations.from_dict(
                {'translations_mapping': {content_id: {}}}))

    def to_dict(self) -> SubtopicPageContentsDict:
        """Returns a dict representing this SubtopicPageContents domain object.

        Returns:
            dict. A dict, mapping all fields of SubtopicPageContents instance.
        """
        return {
            'subtitled_html': self.subtitled_html.to_dict(),
            'recorded_voiceovers': self.recorded_voiceovers.to_dict(),
            'written_translations': self.written_translations.to_dict()
        }

    @classmethod
    def from_dict(
        cls, page_contents_dict: SubtopicPageContentsDict
    ) -> SubtopicPageContents:
        """Creates a subtopic page contents object from a dictionary.

        Args:
            page_contents_dict: dict. The dict representation of
                SubtopicPageContents object.

        Returns:
            SubtopicPageContents. The corresponding object.
        """
        page_contents = state_domain.SubtitledHtml.from_dict(
            page_contents_dict['subtitled_html'])
        page_contents.validate()
        return cls(
            page_contents,
            state_domain.RecordedVoiceovers.from_dict(page_contents_dict[
                'recorded_voiceovers']),
            state_domain.WrittenTranslations.from_dict(page_contents_dict[
                'written_translations']))


class SubtopicPageDict(TypedDict):
    """Dictionary representing the SubtopicPage object."""

    id: str
    topic_id: str
    page_contents: SubtopicPageContentsDict
    page_contents_schema_version: int
    language_code: str
    version: int


class SubtopicPage:
    """Domain object for a Subtopic page."""

    def __init__(
        self,
        subtopic_page_id: str,
        topic_id: str,
        page_contents: SubtopicPageContents,
        page_contents_schema_version: int,
        language_code: str,
        version: int
    ) -> None:
        """Constructs a SubtopicPage domain object.

        Args:
            subtopic_page_id: str. The unique ID of the subtopic page.
            topic_id: str. The ID of the topic that this subtopic is a part of.
            page_contents: SubtopicPageContents. The html and audio
                translations to be surfaced to the learner.
            page_contents_schema_version: int. The schema version for the page
                contents object.
            language_code: str. The ISO 639-1 code for the language this
                subtopic page is written in.
            version: int. The current version of the subtopic.
        """
        self.id = subtopic_page_id
        self.topic_id = topic_id
        self.page_contents = page_contents
        self.page_contents_schema_version = page_contents_schema_version
        self.language_code = language_code
        self.version = version

    def to_dict(self) -> SubtopicPageDict:
        """Returns a dict representing this SubtopicPage domain object.

        Returns:
            dict. A dict, mapping all fields of SubtopicPage instance.
        """
        return {
            'id': self.id,
            'topic_id': self.topic_id,
            'page_contents': self.page_contents.to_dict(),
            'page_contents_schema_version': self.page_contents_schema_version,
            'language_code': self.language_code,
            'version': self.version
        }

    @classmethod
    def get_subtopic_page_id(cls, topic_id: str, subtopic_id: int) -> str:
        """Returns the subtopic page id from the topic_id and subtopic_id.

        Args:
            topic_id: str. The id of the topic that the subtopic is a part of.
            subtopic_id: int. The id of the subtopic.

        Returns:
            str. The subtopic_page_id calculated from the given values.
        """
        return '%s-%s' % (topic_id, subtopic_id)

    @classmethod
    def create_default_subtopic_page(
        cls, subtopic_id: int, topic_id: str
    ) -> SubtopicPage:
        """Creates a SubtopicPage object with default values.

        Args:
            subtopic_id: int. ID of the subtopic.
            topic_id: str. The Id of the topic to which this page is linked
                with.

        Returns:
            SubtopicPage. A subtopic object with given id, topic_id and default
            page contents field.
        """
        subtopic_page_id = cls.get_subtopic_page_id(topic_id, subtopic_id)
        return cls(
            subtopic_page_id, topic_id,
            SubtopicPageContents.create_default_subtopic_page_contents(),
            feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0)

    @classmethod
    def convert_html_fields_in_subtopic_page_contents(
        cls,
        subtopic_page_contents_dict: SubtopicPageContentsDict,
        conversion_fn: Callable[[str], str]
    ) -> SubtopicPageContentsDict:
        """Applies a conversion function on all the html strings in subtopic
        page contents to migrate them to a desired state.

        Args:
            subtopic_page_contents_dict: dict. The dict representation of
                subtopic page contents.
            conversion_fn: function. The conversion function to be applied on
                the subtopic_page_contents_dict.

        Returns:
            dict. The converted subtopic_page_contents_dict.
        """
        subtopic_page_contents_dict['written_translations'] = (
            state_domain.WrittenTranslations.
            convert_html_in_written_translations(
                subtopic_page_contents_dict['written_translations'],
                conversion_fn))
        subtopic_page_contents_dict['subtitled_html']['html'] = (
            conversion_fn(
                subtopic_page_contents_dict['subtitled_html']['html']))
        return subtopic_page_contents_dict

    @classmethod
    def _convert_page_contents_v1_dict_to_v2_dict(
        cls, page_contents_dict: SubtopicPageContentsDict
    ) -> SubtopicPageContentsDict:
        """Converts v1 SubtopicPage Contents schema to the v2 schema.
        v2 schema introduces the new schema for Math components.

        Args:
            page_contents_dict: dict. A dict used to initialize a SubtopicPage
                domain object.

        Returns:
            dict. The converted page_contents_dict.
        """
        return cls.convert_html_fields_in_subtopic_page_contents(
            page_contents_dict,
            html_validation_service.add_math_content_to_math_rte_components)

    @classmethod
    def _convert_page_contents_v2_dict_to_v3_dict(
        cls, page_contents_dict: SubtopicPageContentsDict
    ) -> SubtopicPageContentsDict:
        """Converts v2 SubtopicPage Contents schema to the v3 schema.
        v3 schema deprecates oppia-noninteractive-svgdiagram tag and converts
        existing occurences of it to oppia-noninteractive-image tag.

        Args:
            page_contents_dict: dict. A dict used to initialize a SubtopicPage
                domain object.

        Returns:
            dict. The converted page_contents_dict.
        """
        return cls.convert_html_fields_in_subtopic_page_contents(
            page_contents_dict,
            html_validation_service.convert_svg_diagram_tags_to_image_tags)

    @classmethod
    def _convert_page_contents_v3_dict_to_v4_dict(
        cls, page_contents_dict: SubtopicPageContentsDict
    ) -> SubtopicPageContentsDict:
        """Converts v3 SubtopicPage Contents schema to the v4 schema.
        v4 schema fixes HTML encoding issues.

        Args:
            page_contents_dict: dict. A dict used to initialize a SubtopicPage
                domain object.

        Returns:
            dict. The converted page_contents_dict.
        """
        return cls.convert_html_fields_in_subtopic_page_contents(
            page_contents_dict,
            html_validation_service.fix_incorrectly_encoded_chars)

    @classmethod
    def update_page_contents_from_model(
        cls,
        versioned_page_contents: VersionedSubtopicPageContentsDict,
        current_version: int
    ) -> None:
        """Converts the page_contents blob contained in the given
        versioned_page_contents dict from current_version to
        current_version + 1. Note that the versioned_page_contents being
        passed in is modified in-place.

        Args:
            versioned_page_contents: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    page_contents dict.
                - page_contents: dict. The dict comprising the subtopic page
                    contents.
            current_version: int. The current schema version of page_contents.
        """
        versioned_page_contents['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_page_contents_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))
        versioned_page_contents['page_contents'] = conversion_fn(
            versioned_page_contents['page_contents'])

    def get_subtopic_id_from_subtopic_page_id(self) -> int:
        """Returns the id from the subtopic page id of the object.

        Returns:
            int. The subtopic_id of the object.
        """
        return int(self.id[len(self.topic_id) + 1:])

    def update_page_contents_html(
        self, new_page_contents_html: state_domain.SubtitledHtml
    ) -> None:
        """The new value for the html data field.

        Args:
            new_page_contents_html: SubtitledHtml. The new html for the subtopic
                page.
        """
        self.page_contents.subtitled_html = new_page_contents_html

    def update_page_contents_audio(
        self, new_page_contents_audio: state_domain.RecordedVoiceovers
    ) -> None:
        """The new value for the recorded_voiceovers data field.

        Args:
            new_page_contents_audio: RecordedVoiceovers. The new audio for
                the subtopic page.
        """
        self.page_contents.recorded_voiceovers = new_page_contents_audio

    def update_page_contents_written_translations(
        self,
        new_page_written_translations_dict: state_domain.WrittenTranslationsDict
    ) -> None:
        """The new value for the written_translations data field.

        Args:
            new_page_written_translations_dict: dict. The new translation for
                the subtopic page.
        """
        self.page_contents.written_translations = (
            state_domain.WrittenTranslations.from_dict(
                new_page_written_translations_dict))

    def validate(self) -> None:
        """Validates various properties of the SubtopicPage object.

        Raises:
            ValidationError. One or more attributes of the subtopic page are
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
        self.page_contents.validate()

        if not isinstance(self.page_contents_schema_version, int):
            raise utils.ValidationError(
                'Expected page contents schema version to be an integer, '
                'received %s' % self.page_contents_schema_version)
        if (
                self.page_contents_schema_version !=
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected page contents schema version to be %s, received %s'
                % (
                    feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION,
                    self.page_contents_schema_version)
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


class SubtopicPageSummaryDict(TypedDict):
    """Dictionary representation of SubtopicPageSummary domain object."""

    subtopic_id: int
    subtopic_title: str
    parent_topic_id: str
    parent_topic_name: str
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    subtopic_mastery: Optional[float]
    parent_topic_url_fragment: Optional[str]
    classroom_url_fragment: Optional[str]


class SubtopicPageSummary:
    """Domain object for Subtopic Page Summary."""

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
        """Initialize a SubtopicPageSummary object.

        Args:
            subtopic_id: str. The id of the subtopic.
            subtopic_title: str. The title of the subtopic.
            parent_topic_id: str. The id of the parent topic.
            parent_topic_name: str. The name of the parent topic.
            thumbnail_filename: str. The filename of the thumbnail image.
            thumbnail_bg_color: str. The background color of the thumbnail
                image.
            subtopic_mastery: float. The mastery score of a user in the
                subtopic.
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

    def to_dict(self) -> SubtopicPageSummaryDict:
        """Returns a dict representing this SubtopicPageSummary domain object.

        Returns:
            dict. A dict, mapping all fields of SubtopicPageSummary instance.
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
