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
# limitations under the License.]

"""Domain objects for topics, and related models."""

from __future__ import annotations

import copy
import datetime
import functools
import json
import re

from core import android_validation_constants
from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain
from core.domain import subtopic_page_domain

from typing import Dict, List, Literal, Optional, TypedDict

# The fs_services module is required in one of the migration
# functions in Topic class. This import should be removed
# once the schema migration functions are moved outside the
# domain file.
from core.domain import fs_services # pylint: disable=invalid-import-from # isort:skip

CMD_CREATE_NEW = feconf.CMD_CREATE_NEW
CMD_CHANGE_ROLE = feconf.CMD_CHANGE_ROLE
CMD_REMOVE_MANAGER_ROLE = feconf.CMD_REMOVE_MANAGER_ROLE
CMD_PUBLISH_TOPIC = feconf.CMD_PUBLISH_TOPIC
CMD_UNPUBLISH_TOPIC = feconf.CMD_UNPUBLISH_TOPIC

ROLE_MANAGER = feconf.ROLE_MANAGER
ROLE_NONE = feconf.ROLE_NONE

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
TOPIC_PROPERTY_NAME = 'name'
TOPIC_PROPERTY_ABBREVIATED_NAME = 'abbreviated_name'
TOPIC_PROPERTY_THUMBNAIL_FILENAME = 'thumbnail_filename'
TOPIC_PROPERTY_THUMBNAIL_BG_COLOR = 'thumbnail_bg_color'
TOPIC_PROPERTY_DESCRIPTION = 'description'
TOPIC_PROPERTY_CANONICAL_STORY_REFERENCES = 'canonical_story_references'
TOPIC_PROPERTY_ADDITIONAL_STORY_REFERENCES = 'additional_story_references'
TOPIC_PROPERTY_LANGUAGE_CODE = 'language_code'
TOPIC_PROPERTY_URL_FRAGMENT = 'url_fragment'
TOPIC_PROPERTY_META_TAG_CONTENT = 'meta_tag_content'
TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED = 'practice_tab_is_displayed'
TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB = 'page_title_fragment_for_web'
TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST = 'skill_ids_for_diagnostic_test'

SUBTOPIC_PROPERTY_TITLE = 'title'
SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME = 'thumbnail_filename'
SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR = 'thumbnail_bg_color'
SUBTOPIC_PROPERTY_URL_FRAGMENT = 'url_fragment'

CMD_ADD_SUBTOPIC = 'add_subtopic'
CMD_DELETE_SUBTOPIC = 'delete_subtopic'
CMD_ADD_CANONICAL_STORY = 'add_canonical_story'
CMD_DELETE_CANONICAL_STORY = 'delete_canonical_story'
CMD_REARRANGE_CANONICAL_STORY = 'rearrange_canonical_story'
CMD_ADD_ADDITIONAL_STORY = 'add_additional_story'
CMD_DELETE_ADDITIONAL_STORY = 'delete_additional_story'
CMD_PUBLISH_STORY = 'publish_story'
CMD_UNPUBLISH_STORY = 'unpublish_story'
CMD_ADD_UNCATEGORIZED_SKILL_ID = 'add_uncategorized_skill_id'
CMD_REMOVE_UNCATEGORIZED_SKILL_ID = 'remove_uncategorized_skill_id'
CMD_MOVE_SKILL_ID_TO_SUBTOPIC = 'move_skill_id_to_subtopic'
CMD_REARRANGE_SKILL_IN_SUBTOPIC = 'rearrange_skill_in_subtopic'
CMD_REARRANGE_SUBTOPIC = 'rearrange_subtopic'
CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC = 'remove_skill_id_from_subtopic'
# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_TOPIC_PROPERTY = 'update_topic_property'
CMD_UPDATE_SUBTOPIC_PROPERTY = 'update_subtopic_property'

CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION = (
    'migrate_subtopic_schema_to_latest_version')
CMD_MIGRATE_STORY_REFERENCE_SCHEMA_TO_LATEST_VERSION = (
    'migrate_story_reference_schema_to_latest_version')


class TopicChange(change_domain.BaseChange):
    """Domain object for changes made to topic object.

    The allowed commands, together with the attributes:
        - 'add_subtopic' (with title, subtopic_id)
        - 'delete_subtopic' (with subtopic_id)
        - 'add_uncategorized_skill_id' (with
        new_uncategorized_skill_id)
        - 'remove_uncategorized_skill_id' (with uncategorized_skill_id)
        - 'move_skill_id_to_subtopic' (with old_subtopic_id,
        new_subtopic_id and skill_id)
        - 'remove_skill_id_from_subtopic' (with subtopic_id and
        skill_id)
        - 'update_topic_property' (with property_name, new_value
        and old_value)
        - 'update_subtopic_property' (with subtopic_id, property_name,
        new_value and old_value)
        - 'migrate_subtopic_schema_to_latest_version' (with
        from_version and to_version)
        - 'migrate_story_reference_schema_to_latest_version' (with
        from_version and to_version)
        - 'create_new' (with name)
    """

    # The allowed list of topic properties which can be used in
    # update_topic_property command.
    TOPIC_PROPERTIES: List[str] = [
        TOPIC_PROPERTY_NAME, TOPIC_PROPERTY_ABBREVIATED_NAME,
        TOPIC_PROPERTY_DESCRIPTION,
        TOPIC_PROPERTY_CANONICAL_STORY_REFERENCES,
        TOPIC_PROPERTY_ADDITIONAL_STORY_REFERENCES,
        TOPIC_PROPERTY_LANGUAGE_CODE,
        TOPIC_PROPERTY_THUMBNAIL_FILENAME,
        TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
        TOPIC_PROPERTY_URL_FRAGMENT,
        TOPIC_PROPERTY_META_TAG_CONTENT,
        TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED,
        TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB,
        TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST,
    ]

    # The allowed list of subtopic properties which can be used in
    # update_subtopic_property command.
    SUBTOPIC_PROPERTIES: List[str] = [
        SUBTOPIC_PROPERTY_TITLE,
        SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME,
        SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
        SUBTOPIC_PROPERTY_URL_FRAGMENT
    ]

    # The allowed list of subtopic page properties which can be used in
    # update_subtopic_page_property command.
    SUBTOPIC_PAGE_PROPERTIES: List[str] = (
        subtopic_page_domain.SubtopicPageChange.SUBTOPIC_PAGE_PROPERTIES)

    ALLOWED_COMMANDS = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_SUBTOPIC,
        'required_attribute_names': ['title', 'subtopic_id', 'url_fragment'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_SUBTOPIC,
        'required_attribute_names': ['subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_CANONICAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_CANONICAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_REARRANGE_CANONICAL_STORY,
        'required_attribute_names': ['from_index', 'to_index'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_ADDITIONAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_ADDITIONAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_PUBLISH_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UNPUBLISH_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_UNCATEGORIZED_SKILL_ID,
        'required_attribute_names': ['new_uncategorized_skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_REMOVE_UNCATEGORIZED_SKILL_ID,
        'required_attribute_names': ['uncategorized_skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
        'required_attribute_names': [
            'old_subtopic_id', 'new_subtopic_id', 'skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_REARRANGE_SKILL_IN_SUBTOPIC,
        'required_attribute_names': ['subtopic_id', 'from_index', 'to_index'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_REARRANGE_SUBTOPIC,
        'required_attribute_names': ['from_index', 'to_index'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
        'required_attribute_names': ['subtopic_id', 'skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_SUBTOPIC_PROPERTY,
        'required_attribute_names': [
            'subtopic_id', 'property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SUBTOPIC_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
        'required_attribute_names': [
            'property_name', 'new_value', 'old_value', 'subtopic_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': SUBTOPIC_PAGE_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_TOPIC_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': TOPIC_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_STORY_REFERENCE_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class CreateNewTopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_CREATE_NEW command.
    """

    name: str


class AddSubtopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_ADD_SUBTOPIC command.
    """

    title: str
    subtopic_id: int
    url_fragment: str


class DeleteSubtopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_DELETE_SUBTOPIC command.
    """

    subtopic_id: int


class AddCanonicalStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_ADD_CANONICAL_STORY command.
    """

    story_id: str


class DeleteCanonicalStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_DELETE_CANONICAL_STORY command.
    """

    story_id: str


class RearrangeCanonicalStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_REARRANGE_CANONICAL_STORY command.
    """

    from_index: int
    to_index: int


class AddAdditionalStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_ADD_ADDITIONAL_STORY command.
    """

    story_id: str


class DeleteAdditionalStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_DELETE_ADDITIONAL_STORY command.
    """

    story_id: str


class PublishStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_PUBLISH_STORY command.
    """

    story_id: str


class UnpublishStoryCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UNPUBLISH_STORY command.
    """

    story_id: str


class AddUncategorizedSkillIdCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_ADD_UNCATEGORIZED_SKILL_ID command.
    """

    new_uncategorized_skill_id: str


class RemoveUncategorizedSkillIdCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_REMOVE_UNCATEGORIZED_SKILL_ID command.
    """

    uncategorized_skill_id: str


class MoveSkillIdToSubtopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_MOVE_SKILL_ID_TO_SUBTOPIC command.
    """

    old_subtopic_id: int
    new_subtopic_id: int
    skill_id: str


class RearrangeSkillInSubtopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_REARRANGE_SKILL_IN_SUBTOPIC command.
    """

    subtopic_id: int
    from_index: int
    to_index: int


class RearrangeSubtopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_REARRANGE_SUBTOPIC command.
    """

    from_index: int
    to_index: int


class RemoveSkillIdFromSubtopicCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC command.
    """

    subtopic_id: int
    skill_id: str


class UpdateSubtopicPropertyCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_SUBTOPIC_PROPERTY command.
    """

    subtopic_id: int
    property_name: str
    new_value: str
    old_value: str


class UpdateTopicPropertyNameCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_NAME as allowed value.
    """

    property_name: Literal['name']
    new_value: str
    old_value: str


class UpdateTopicPropertyAbbreviatedNameCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_ABBREVIATED_NAME as allowed value.
    """

    property_name: Literal['abbreviated_name']
    new_value: str
    old_value: str


class UpdateTopicPropertyDescriptionCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_DESCRIPTION as allowed value.
    """

    property_name: Literal['description']
    new_value: str
    old_value: str


class UpdateTopicPropertyCanonicalStoryReferencesCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_CANONICAL_STORY_REFERENCES
    as allowed value.
    """

    property_name: Literal['canonical_story_references']
    new_value: List[StoryReference]
    old_value: List[StoryReference]


class UpdateTopicPropertyAdditionalStoryReferencesCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_ADDITIONAL_STORY_REFERENCES
    as allowed value.
    """

    property_name: Literal['additional_story_references']
    new_value: List[StoryReference]
    old_value: List[StoryReference]


class UpdateTopicPropertyLanguageCodeCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_LANGUAGE_CODE as allowed value.
    """

    property_name: Literal['language_code']
    new_value: str
    old_value: str


class UpdateTopicPropertyThumbnailFilenameCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_THUMBNAIL_FILENAME as
    allowed value.
    """

    property_name: Literal['thumbnail_filename']
    new_value: str
    old_value: str


class UpdateTopicPropertyThumbnailBGColorCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_THUMBNAIL_BG_COLOR as
    allowed value.
    """

    property_name: Literal['thumbnail_bg_color']
    new_value: str
    old_value: str


class UpdateTopicPropertyUrlFragmentCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_URL_FRAGMENT as allowed value.
    """

    property_name: Literal['url_fragment']
    new_value: str
    old_value: str


class UpdateTopicPropertyMetaTagContentCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_META_TAG_CONTENT as allowed value.
    """

    property_name: Literal['meta_tag_content']
    new_value: str
    old_value: str


class UpdateTopicPropertyPracticeTabIsDisplayedCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED
    as allowed value.
    """

    property_name: Literal['practice_tab_is_displayed']
    new_value: bool
    old_value: bool


class UpdateTopicPropertyTitleFragmentForWebCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB
    as allowed value.
    """

    property_name: Literal['page_title_fragment_for_web']
    new_value: str
    old_value: str


class UpdateTopicPropertySkillIdsForDiagnosticTestCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_UPDATE_TOPIC_PROPERTY command with
    TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST
    as allowed value.
    """

    property_name: Literal['skill_ids_for_diagnostic_test']
    new_value: List[str]
    old_value: List[str]


class MigrateSubtopicSchemaToLatestVersionCmd(TopicChange):
    """Class representing the TopicChange's
    CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: int
    to_version: int


class TopicRightsChange(change_domain.BaseChange):
    """Domain object for changes made to a topic rights object.

    The allowed commands, together with the attributes:
        - 'change_role' (with assignee_id, new_role and old_role)
        - 'create_new'
        - 'publish_story'
        - 'unpublish_story'.
    """

    ALLOWED_COMMANDS = feconf.TOPIC_RIGHTS_CHANGE_ALLOWED_COMMANDS


class CreateNewTopicRightsCmd(TopicRightsChange):
    """Class representing the TopicRightsChange's
    CMD_CREATE_NEW command.
    """

    pass


class ChangeRoleTopicRightsCmd(TopicRightsChange):
    """Class representing the TopicRightsChange's
    CMD_CHANGE_ROLE command.
    """

    assignee_id: str
    new_value: str
    old_value: str


class RemoveManagerRoleCmd(TopicRightsChange):
    """Class representing the TopicRightsChange's
    CMD_REMOVE_MANAGER_ROLE command.
    """

    removed_user_id: str


class PublishTopicCmd(TopicRightsChange):
    """Class representing the TopicRightsChange's
    CMD_PUBLISH_TOPIC command.
    """

    pass


class UnpublishTopicCmd(TopicRightsChange):
    """Class representing the TopicRightsChange's
    CMD_UNPUBLISH_TOPIC command.
    """

    pass


class DeleteCommitTopicRightsCmd(TopicRightsChange):
    """Class representing the TopicRightsChange's
    CMD_DELETE_COMMIT command.
    """

    pass


class StoryReferenceDict(TypedDict):
    """Dictionary that represents StoryReference."""

    story_id: str
    story_is_published: bool


class StoryReference:
    """Domain object for a Story reference."""

    def __init__(
        self, story_id: str, story_is_published: bool
    ) -> None:
        """Constructs a StoryReference domain object.

        Args:
            story_id: str. The ID of the story.
            story_is_published: bool. Whether the story is published or not.
        """
        self.story_id = story_id
        self.story_is_published = story_is_published

    def to_dict(self) -> StoryReferenceDict:
        """Returns a dict representing this StoryReference domain object.

        Returns:
            dict. A dict, mapping all fields of StoryReference instance.
        """
        return {
            'story_id': self.story_id,
            'story_is_published': self.story_is_published
        }

    @classmethod
    def from_dict(
        cls, story_reference_dict: StoryReferenceDict
    ) -> StoryReference:
        """Returns a StoryReference domain object from a dict.

        Args:
            story_reference_dict: dict. The dict representation of
                StoryReference object.

        Returns:
            StoryReference. The corresponding StoryReference domain object.
        """
        story_reference = cls(
            story_reference_dict['story_id'],
            story_reference_dict['story_is_published'])
        return story_reference

    @classmethod
    def create_default_story_reference(cls, story_id: str) -> StoryReference:
        """Creates a StoryReference object with default values.

        Args:
            story_id: str. ID of the new story.

        Returns:
            StoryReference. A story reference object with given story_id and
            'not published' status.
        """
        return cls(story_id, False)

    def validate(self) -> None:
        """Validates various properties of the StoryReference object.

        Raises:
            ValidationError. One or more attributes of the StoryReference are
                invalid.
        """
        if not bool(re.match(constants.ENTITY_ID_REGEX, self.story_id)):
            raise utils.ValidationError(
                'Invalid story ID: %s' % self.story_id)


class SubtopicDict(TypedDict):
    """Dictionary representation of Subtopic."""

    id: int
    title: str
    skill_ids: List[str]
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    thumbnail_size_in_bytes: Optional[int]
    url_fragment: str


class Subtopic:
    """Domain object for a Subtopic."""

    def __init__(
        self,
        subtopic_id: int,
        title: str,
        skill_ids: List[str],
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_size_in_bytes: Optional[int],
        url_fragment: str
    ) -> None:
        """Constructs a Subtopic domain object.

        Args:
            subtopic_id: int. The number of the subtopic.
            title: str. The title of the subtopic.
            skill_ids: list(str). The list of skill ids that are part of this
                subtopic.
            thumbnail_filename: str|None. The thumbnail filename for the
                subtopic.
            thumbnail_bg_color: str|None. The thumbnail background color for
                the subtopic.
            thumbnail_size_in_bytes: int|None. The thumbnail size of the topic
                in bytes.
            url_fragment: str. The url fragment for the subtopic.
        """
        self.id = subtopic_id
        self.title = title
        self.skill_ids = skill_ids
        self.thumbnail_filename = thumbnail_filename
        self.thumbnail_bg_color = thumbnail_bg_color
        self.thumbnail_size_in_bytes = thumbnail_size_in_bytes
        self.url_fragment = url_fragment

    def to_dict(self) -> SubtopicDict:
        """Returns a dict representing this Subtopic domain object.

        Returns:
            dict. A dict, mapping all fields of Subtopic instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'skill_ids': self.skill_ids,
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'thumbnail_size_in_bytes': self.thumbnail_size_in_bytes,
            'url_fragment': self.url_fragment
        }

    @classmethod
    def from_dict(cls, subtopic_dict: SubtopicDict) -> Subtopic:
        """Returns a Subtopic domain object from a dict.

        Args:
            subtopic_dict: dict. The dict representation of Subtopic object.

        Returns:
            Subtopic. The corresponding Subtopic domain object.
        """
        subtopic = cls(
            subtopic_dict['id'], subtopic_dict['title'],
            subtopic_dict['skill_ids'], subtopic_dict['thumbnail_filename'],
            subtopic_dict['thumbnail_bg_color'],
            subtopic_dict['thumbnail_size_in_bytes'],
            subtopic_dict['url_fragment'])
        return subtopic

    @classmethod
    def create_default_subtopic(
        cls,
        subtopic_id: int,
        title: str,
        url_frag: str
    ) -> Subtopic:
        """Creates a Subtopic object with default values.

        Args:
            subtopic_id: int. ID of the new subtopic.
            title: str. The title for the new subtopic.
            url_frag: str. The url fragment for the new subtopic.

        Returns:
            Subtopic. A subtopic object with given id, title and empty skill ids
            list.
        """
        return cls(subtopic_id, title, [], None, None, None, url_frag)

    @classmethod
    def require_valid_thumbnail_filename(cls, thumbnail_filename: str) -> None:
        """Checks whether the thumbnail filename of the subtopic is a valid
            one.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
        """
        utils.require_valid_thumbnail_filename(thumbnail_filename)

    @classmethod
    def require_valid_thumbnail_bg_color(cls, thumbnail_bg_color: str) -> bool:
        """Checks whether the thumbnail background color of the subtopic is a
            valid one.

        Args:
            thumbnail_bg_color: str. The thumbnail background color to
                validate.

        Returns:
            bool. Whether the thumbnail background color is valid or not.
        """
        return thumbnail_bg_color in constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'subtopic']

    def validate(self) -> None:
        """Validates various properties of the Subtopic object.

        Raises:
            ValidationError. One or more attributes of the subtopic are
                invalid.
        """
        if self.thumbnail_filename is not None:
            self.require_valid_thumbnail_filename(self.thumbnail_filename)
        if self.thumbnail_bg_color is not None and not (
                self.require_valid_thumbnail_bg_color(self.thumbnail_bg_color)):
            raise utils.ValidationError(
                'Subtopic thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Subtopic thumbnail image is not provided.')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Subtopic thumbnail background color is not specified.')
        if self.thumbnail_filename is not None and (
                self.thumbnail_size_in_bytes == 0):
            raise utils.ValidationError(
                'Subtopic thumbnail size in bytes cannot be zero.')

        title_limit = android_validation_constants.MAX_CHARS_IN_SUBTOPIC_TITLE
        if len(self.title) > title_limit:
            raise utils.ValidationError(
                'Expected subtopic title to be less than %d characters, '
                'received %s' % (title_limit, self.title))

        url_fragment_limit = (
            android_validation_constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT)
        regex = android_validation_constants.SUBTOPIC_URL_FRAGMENT_REGEXP
        if len(self.url_fragment) > url_fragment_limit:
            raise utils.ValidationError(
                'Expected subtopic url fragment to be less '
                'than or equal to %d characters, received %s'
                % (url_fragment_limit, self.url_fragment))

        if len(self.url_fragment) > 0:
            if not bool(re.match(regex, self.url_fragment)):
                raise utils.ValidationError(
                    'Invalid url fragment: %s' % self.url_fragment)
        else:
            raise utils.ValidationError(
                'Expected subtopic url fragment to be non '
                'empty')

        if len(self.skill_ids) > len(set(self.skill_ids)):
            raise utils.ValidationError(
                'Expected all skill ids to be distinct.')


class TopicDict(TypedDict, total=False):
    """Dictionary that represents Topic."""

    id: str
    name: str
    abbreviated_name: str
    url_fragment: str
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    thumbnail_size_in_bytes: Optional[int]
    description: str
    canonical_story_references: List[StoryReferenceDict]
    additional_story_references: List[StoryReferenceDict]
    uncategorized_skill_ids: List[str]
    subtopics: List[SubtopicDict]
    subtopic_schema_version: int
    next_subtopic_id: int
    language_code: str
    version: int
    story_reference_schema_version: int
    meta_tag_content: str
    practice_tab_is_displayed: bool
    page_title_fragment_for_web: str
    skill_ids_for_diagnostic_test: List[str]
    created_on: str
    last_updated: str


class VersionedSubtopicsDict(TypedDict):
    """Dictionary that represents versioned subtopics."""

    schema_version: int
    subtopics: List[SubtopicDict]


class VersionedStoryReferencesDict(TypedDict):
    """Dictionary that represents versioned story references."""

    schema_version: int
    story_references: List[StoryReferenceDict]


class Topic:
    """Domain object for an Oppia Topic."""

    def __init__(
        self,
        topic_id: str,
        name: str,
        abbreviated_name: str,
        url_fragment: str,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_size_in_bytes: Optional[int],
        description: str,
        canonical_story_references: List[StoryReference],
        additional_story_references: List[StoryReference],
        uncategorized_skill_ids: List[str],
        subtopics: List[Subtopic],
        subtopic_schema_version: int,
        next_subtopic_id: int,
        language_code: str,
        version: int,
        story_reference_schema_version: int,
        meta_tag_content: str,
        practice_tab_is_displayed: bool,
        page_title_fragment_for_web: str,
        skill_ids_for_diagnostic_test: List[str],
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a Topic domain object.

        Args:
            topic_id: str. The unique ID of the topic.
            name: str. The name of the topic.
            abbreviated_name: str. The abbreviated topic name.
            url_fragment: str. The url fragment of the topic.
            thumbnail_filename: str|None. The thumbnail filename of the topic.
            thumbnail_bg_color: str|None. The thumbnail background color of the
                topic.
            thumbnail_size_in_bytes: int|None. The thumbnail size of the topic
                in bytes.
            description: str. The description of the topic.
            canonical_story_references: list(StoryReference). A set of story
                reference objects representing the canonical stories that are
                part of this topic.
            additional_story_references: list(StoryReference). A set of story
                reference object representing the additional stories that are
                part of this topic.
            uncategorized_skill_ids: list(str). This consists of the list of
                uncategorized skill ids that are not part of any subtopic.
            subtopics: list(Subtopic). The list of subtopics that are part of
                the topic.
            subtopic_schema_version: int. The current schema version of the
                subtopic dict.
            next_subtopic_id: int. The id for the next subtopic in the topic.
            language_code: str. The ISO 639-1 code for the language this
                topic is written in.
            version: int. The version of the topic.
            story_reference_schema_version: int. The schema version of the
                story reference object.
            meta_tag_content: str. The meta tag content in the topic viewer
                page.
            practice_tab_is_displayed: bool. Whether the practice tab is shown.
            page_title_fragment_for_web: str. The page title fragment in the
                topic viewer page.
            skill_ids_for_diagnostic_test: list(str). The list of skill_id that
                will be used from a topic in the diagnostic test.
            created_on: datetime.datetime. Date and time when the topic is
                created.
            last_updated: datetime.datetime. Date and time when the
                topic was last updated.
        """
        self.id = topic_id
        self.name = name
        self.abbreviated_name = abbreviated_name
        self.url_fragment = url_fragment
        self.thumbnail_filename = thumbnail_filename
        self.thumbnail_bg_color = thumbnail_bg_color
        self.thumbnail_size_in_bytes = thumbnail_size_in_bytes
        self.canonical_name = name.lower()
        self.description = description
        self.canonical_story_references = canonical_story_references
        self.additional_story_references = additional_story_references
        self.uncategorized_skill_ids = uncategorized_skill_ids
        self.subtopics = subtopics
        self.subtopic_schema_version = subtopic_schema_version
        self.next_subtopic_id = next_subtopic_id
        self.language_code = language_code
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version
        self.story_reference_schema_version = story_reference_schema_version
        self.meta_tag_content = meta_tag_content
        self.practice_tab_is_displayed = practice_tab_is_displayed
        self.page_title_fragment_for_web = page_title_fragment_for_web
        self.skill_ids_for_diagnostic_test = skill_ids_for_diagnostic_test

    def to_dict(self) -> TopicDict:
        """Returns a dict representing this Topic domain object.

        Returns:
            dict. A dict, mapping all fields of Topic instance.
        """
        return {
            'id': self.id,
            'name': self.name,
            'abbreviated_name': self.abbreviated_name,
            'url_fragment': self.url_fragment,
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'thumbnail_size_in_bytes': self.thumbnail_size_in_bytes,
            'description': self.description,
            'canonical_story_references': [
                reference.to_dict()
                for reference in self.canonical_story_references
            ],
            'additional_story_references': [
                reference.to_dict()
                for reference in self.additional_story_references
            ],
            'uncategorized_skill_ids': self.uncategorized_skill_ids,
            'subtopics': [
                subtopic.to_dict() for subtopic in self.subtopics
            ],
            'subtopic_schema_version': self.subtopic_schema_version,
            'next_subtopic_id': self.next_subtopic_id,
            'language_code': self.language_code,
            'version': self.version,
            'story_reference_schema_version': (
                self.story_reference_schema_version),
            'meta_tag_content': self.meta_tag_content,
            'practice_tab_is_displayed': self.practice_tab_is_displayed,
            'page_title_fragment_for_web': self.page_title_fragment_for_web,
            'skill_ids_for_diagnostic_test': self.skill_ids_for_diagnostic_test
        }

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded str encoding all of the information composing
            the object.
        """
        topic_dict = self.to_dict()
        # The only reason we add the version parameter separately is that our
        # yaml encoding/decoding of this object does not handle the version
        # parameter.
        # NOTE: If this changes in the future (i.e the version parameter is
        # added as part of the yaml representation of this object), all YAML
        # files must add a version parameter to their files with the correct
        # version of this object. The line below must then be moved to
        # to_dict().
        topic_dict['version'] = self.version

        if self.created_on:
            topic_dict['created_on'] = utils.convert_naive_datetime_to_string(
                self.created_on)

        if self.last_updated:
            topic_dict['last_updated'] = utils.convert_naive_datetime_to_string(
                self.last_updated)

        return json.dumps(topic_dict)

    @classmethod
    def from_dict(
        cls,
        topic_dict: TopicDict,
        topic_version: int = 0,
        topic_created_on: Optional[datetime.datetime] = None,
        topic_last_updated: Optional[datetime.datetime] = None
    ) -> Topic:
        """Returns a Topic domain object from a dictionary.

        Args:
            topic_dict: dict. The dictionary representation of topic
                object.
            topic_version: int. The version of the topic.
            topic_created_on: datetime.datetime. Date and time when the
                topic is created.
            topic_last_updated: datetime.datetime. Date and time when the
                topic was last updated.

        Returns:
            Topic. The corresponding Topic domain object.
        """
        topic = cls(
            topic_dict['id'], topic_dict['name'],
            topic_dict['abbreviated_name'],
            topic_dict['url_fragment'],
            topic_dict['thumbnail_filename'],
            topic_dict['thumbnail_bg_color'],
            topic_dict['thumbnail_size_in_bytes'], topic_dict['description'],
            [
                StoryReference.from_dict(reference_dict)
                for reference_dict in topic_dict['canonical_story_references']
            ],
            [
                StoryReference.from_dict(reference_dict)
                for reference_dict in topic_dict['additional_story_references']
            ],
            topic_dict['uncategorized_skill_ids'],
            [
                Subtopic.from_dict(subtopic_dict)
                for subtopic_dict in topic_dict['subtopics']
            ],
            topic_dict['subtopic_schema_version'],
            topic_dict['next_subtopic_id'],
            topic_dict['language_code'], topic_version,
            topic_dict['story_reference_schema_version'],
            topic_dict['meta_tag_content'],
            topic_dict['practice_tab_is_displayed'],
            topic_dict['page_title_fragment_for_web'],
            topic_dict['skill_ids_for_diagnostic_test'],
            topic_created_on,
            topic_last_updated)

        return topic

    @classmethod
    def deserialize(cls, json_string: str) -> Topic:
        """Returns a Topic domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a Topic.
                Only call on strings that were created using serialize().

        Returns:
            Topic. The corresponding Topic domain object.
        """
        topic_dict = json.loads(json_string)

        created_on = (
            utils.convert_string_to_naive_datetime_object(
                topic_dict['created_on'])
            if 'created_on' in topic_dict else None)
        last_updated = (
            utils.convert_string_to_naive_datetime_object(
                topic_dict['last_updated'])
            if 'last_updated' in topic_dict else None)
        topic = cls.from_dict(
            topic_dict,
            topic_version=topic_dict['version'],
            topic_created_on=created_on,
            topic_last_updated=last_updated)
        return topic

    @classmethod
    def require_valid_topic_id(cls, topic_id: Optional[str]) -> None:
        """Checks whether the topic id is a valid one.

        Args:
            topic_id: str. The topic id to validate.
        """
        if topic_id is not None and len(topic_id) != 12:
            raise utils.ValidationError('Topic id %s is invalid' % topic_id)

    @classmethod
    def require_valid_name(cls, name: str) -> None:
        """Checks whether the name of the topic is a valid one.

        Args:
            name: str. The name to validate.
        """
        if name == '':
            raise utils.ValidationError('Name field should not be empty')

        name_limit = android_validation_constants.MAX_CHARS_IN_TOPIC_NAME
        if len(name) > name_limit:
            raise utils.ValidationError(
                'Topic name should be at most %d characters, received %s.'
                % (name_limit, name))

    @classmethod
    def require_valid_url_fragment(cls, url_fragment: str) -> None:
        """Checks whether the url fragment of the topic is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.
        """
        utils.require_valid_url_fragment(
            url_fragment, 'Topic URL Fragment',
            constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT)

    @classmethod
    def require_valid_thumbnail_filename(cls, thumbnail_filename: str) -> None:
        """Checks whether the thumbnail filename of the topic is a valid
            one.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
        """
        utils.require_valid_thumbnail_filename(thumbnail_filename)

    @classmethod
    def require_valid_thumbnail_bg_color(cls, thumbnail_bg_color: str) -> bool:
        """Checks whether the thumbnail background color of the topic is a
            valid one.

        Args:
            thumbnail_bg_color: str. The thumbnail background color to
                validate.

        Returns:
            bool. Whether the thumbnail background color is valid or not.
        """
        return thumbnail_bg_color in constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'topic']

    def get_all_skill_ids(self) -> List[str]:
        """Returns all the ids of all the skills present in the topic.

        Returns:
            list(str). The list of all the skill ids present in the topic.
        """
        skill_ids = copy.deepcopy(self.uncategorized_skill_ids)

        for subtopic in self.subtopics:
            skill_ids.extend(copy.deepcopy(subtopic.skill_ids))
        return skill_ids

    def publish_story(self, story_id: str) -> None:
        """Marks story with the given id as published.

        Raises:
            Exception. Story with given id doesn't exist in the topic.
        """
        for story_reference in self.canonical_story_references:
            if story_reference.story_id == story_id:
                story_reference.story_is_published = True
                return

        for story_reference in self.additional_story_references:
            if story_reference.story_id == story_id:
                story_reference.story_is_published = True
                return
        raise Exception('Story with given id doesn\'t exist in the topic')

    def unpublish_story(self, story_id: str) -> None:
        """Marks story with the given id as unpublished.

        Raises:
            Exception. Story with given id doesn't exist in the topic.
        """
        for story_reference in self.canonical_story_references:
            if story_reference.story_id == story_id:
                story_reference.story_is_published = False
                return

        for story_reference in self.additional_story_references:
            if story_reference.story_id == story_id:
                story_reference.story_is_published = False
                return
        raise Exception('Story with given id doesn\'t exist in the topic')

    def get_canonical_story_ids(
        self,
        include_only_published: bool = False
    ) -> List[str]:
        """Returns a list of canonical story ids that are part of the topic.

        Args:
            include_only_published: bool. Only return IDs of stories that are
                published.

        Returns:
            list(str). The list of canonical story ids.
        """
        story_ids = [
            elem.story_id for elem in self.canonical_story_references
            if (elem.story_is_published or not include_only_published)
        ]
        return story_ids

    def get_all_story_references(self) -> List[StoryReference]:
        """Returns all the story references in the topic - both canonical and
        additional.

        Returns:
            list(StoryReference). The list of StoryReference objects in topic.
        """
        return (
            self.canonical_story_references + self.additional_story_references)

    def get_additional_story_ids(
        self, include_only_published: bool = False
    ) -> List[str]:
        """Returns a list of additional story ids that are part of the topic.

        Args:
            include_only_published: bool. Only return IDs of stories that are
                published.

        Returns:
            list(str). The list of additional story ids.
        """
        story_ids = [
            elem.story_id for elem in self.additional_story_references
            if (elem.story_is_published or not include_only_published)
        ]
        return story_ids

    def get_all_uncategorized_skill_ids(self) -> List[str]:
        """Returns ids of all the uncategorized skills present in the topic.

        Returns:
            list(str). The list of all the uncategorized skill ids present
            in the topic.
        """
        return self.uncategorized_skill_ids

    def delete_canonical_story(self, story_id: str) -> None:
        """Removes a story from the canonical_story_references list.

        Args:
            story_id: str. The story id to remove from the list.

        Raises:
            Exception. The story_id is not present in the canonical stories
                list of the topic.
        """
        deleted = False
        for index, reference in enumerate(self.canonical_story_references):
            if reference.story_id == story_id:
                del self.canonical_story_references[index]
                deleted = True
                break
        if not deleted:
            raise Exception(
                'The story_id %s is not present in the canonical '
                'story references list of the topic.' % story_id)

    def rearrange_canonical_story(self, from_index: int, to_index: int) -> None:
        """Rearranges or moves a canonical story to another position.

        Args:
            from_index: int. The index of canonical story to move.
            to_index: int. The index at which to insert the moved canonical
                story.

        Raises:
            Exception. Invalid input.
        """
        if from_index == to_index:
            raise Exception(
                'Expected from_index and to_index values to be different.')

        if (from_index >= len(self.canonical_story_references) or
                from_index < 0):
            raise Exception('Expected from_index value to be with-in bounds.')

        if (to_index >= len(self.canonical_story_references) or
                to_index < 0):
            raise Exception('Expected to_index value to be with-in bounds.')

        canonical_story_reference_to_move = copy.deepcopy(
            self.canonical_story_references[from_index])
        del self.canonical_story_references[from_index]
        self.canonical_story_references.insert(
            to_index, canonical_story_reference_to_move)

    def add_canonical_story(self, story_id: str) -> None:
        """Adds a story to the canonical_story_references list.

        Args:
            story_id: str. The story id to add to the list.

        Raises:
            Exception. The story ID is already present in the canonical
                story references list of the topic.
        """
        canonical_story_ids = self.get_canonical_story_ids()
        if story_id in canonical_story_ids:
            raise Exception(
                'The story_id %s is already present in the canonical '
                'story references list of the topic.' % story_id)
        self.canonical_story_references.append(
            StoryReference.create_default_story_reference(story_id)
        )

    def add_additional_story(self, story_id: str) -> None:
        """Adds a story to the additional_story_references list.

        Args:
            story_id: str. The story id to add to the list.

        Raises:
            Exception. The story ID is already present in the additional
                story references list of the topic.
        """
        additional_story_ids = self.get_additional_story_ids()
        if story_id in additional_story_ids:
            raise Exception(
                'The story_id %s is already present in the additional '
                'story references list of the topic.' % story_id)
        self.additional_story_references.append(
            StoryReference.create_default_story_reference(story_id)
        )

    def delete_additional_story(self, story_id: str) -> None:
        """Removes a story from the additional_story_references list.

        Args:
            story_id: str. The story id to remove from the list.

        Raises:
            Exception. The story ID is not present in the additional stories
                list of the topic.
        """
        deleted = False
        for index, reference in enumerate(self.additional_story_references):
            if reference.story_id == story_id:
                del self.additional_story_references[index]
                deleted = True
                break
        if not deleted:
            raise Exception(
                'The story_id %s is not present in the additional '
                'story references list of the topic.' % story_id)

    def validate(self, strict: bool = False) -> None:
        """Validates all properties of this topic and its constituents.

        Args:
            strict: bool. Enable strict checks on the topic when the topic is
                published or is going to be published.

        Raises:
            ValidationError. One or more attributes of the Topic are not
                valid.
        """
        self.require_valid_name(self.name)
        self.require_valid_url_fragment(self.url_fragment)
        if self.thumbnail_filename is not None:
            self.require_valid_thumbnail_filename(self.thumbnail_filename)
        utils.require_valid_meta_tag_content(self.meta_tag_content)
        utils.require_valid_page_title_fragment_for_web(
            self.page_title_fragment_for_web)
        if self.thumbnail_bg_color is not None and not (
                self.require_valid_thumbnail_bg_color(self.thumbnail_bg_color)):
            raise utils.ValidationError(
                'Topic thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Topic thumbnail image is not provided.')
        if self.canonical_story_references:
            for reference in self.canonical_story_references:
                if not isinstance(reference.story_is_published, bool):
                    raise utils.ValidationError(
                        'story_is_published value should be boolean type')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Topic thumbnail background color is not specified.')
        if strict:
            if not isinstance(self.thumbnail_filename, str):
                raise utils.ValidationError(
                    'Expected thumbnail filename to be a string, received %s.'
                    % self.thumbnail_filename)

        description_limit = (
            android_validation_constants.MAX_CHARS_IN_TOPIC_DESCRIPTION)
        if len(self.description) > description_limit:
            raise utils.ValidationError(
                'Topic description should be at most %d characters, '
                'received %s.' % (description_limit, self.description))

        if (self.subtopic_schema_version !=
                feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected subtopic schema version to be %s, received %s'
                % (
                    feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
                    self.subtopic_schema_version))

        for subtopic in self.subtopics:
            subtopic.validate()
            if subtopic.id >= self.next_subtopic_id:
                raise utils.ValidationError(
                    'The id for subtopic %s is greater than or equal to '
                    'next_subtopic_id %s'
                    % (subtopic.id, self.next_subtopic_id))
            if strict:
                if not subtopic.skill_ids:
                    raise utils.ValidationError(
                        'Subtopic with title %s does not have any skills '
                        'linked.' % subtopic.title)

        all_skill_ids = self.get_all_skill_ids()
        skill_ids_for_diagnostic_that_are_not_in_topic = (
            set(self.skill_ids_for_diagnostic_test) -
            set(all_skill_ids))
        if len(skill_ids_for_diagnostic_that_are_not_in_topic) > 0:
            raise utils.ValidationError(
                'The skill_ids %s are selected for the diagnostic test but they'
                ' are not associated with the topic.' %
                skill_ids_for_diagnostic_that_are_not_in_topic)

        if strict:
            if len(self.subtopics) == 0:
                raise utils.ValidationError(
                    'Topic should have at least 1 subtopic.')

        if not self.are_subtopic_url_fragments_unique():
            raise utils.ValidationError(
                'Subtopic url fragments are not unique across '
                'subtopics in the topic')

        if (
            strict and
            len(self.skill_ids_for_diagnostic_test) == 0
        ):
            raise utils.ValidationError(
                'The skill_ids_for_diagnostic_test field should not be empty.')

        if len(self.skill_ids_for_diagnostic_test) > 3:
            raise utils.ValidationError(
                'The skill_ids_for_diagnostic_test field should contain at '
                'most 3 skill_ids.')

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        canonical_story_ids = self.get_canonical_story_ids()
        if len(canonical_story_ids) > len(set(canonical_story_ids)):
            raise utils.ValidationError(
                'Expected all canonical story ids to be distinct.')

        additional_story_ids = self.get_additional_story_ids()
        if len(additional_story_ids) > len(set(additional_story_ids)):
            raise utils.ValidationError(
                'Expected all additional story ids to be distinct.')

        for story_id in additional_story_ids:
            if story_id in canonical_story_ids:
                raise utils.ValidationError(
                    'Expected additional story ids list and canonical story '
                    'ids list to be mutually exclusive. The story_id %s is '
                    'present in both lists' % story_id)

        all_story_references = self.get_all_story_references()
        for reference in all_story_references:
            reference.validate()

    @classmethod
    def create_default_topic(
        cls, topic_id: str, name: str, url_fragment: str, description: str,
        page_title_frag: str
    ) -> Topic:
        """Returns a topic domain object with default values. This is for
        the frontend where a default blank topic would be shown to the user
        when the topic is created for the first time.

        Args:
            topic_id: str. The unique id of the topic.
            name: str. The initial name for the topic.
            url_fragment: str. The url fragment for the topic.
            description: str. The description for the topic.
            page_title_frag: str. The page title fragment for web.

        Returns:
            Topic. The Topic domain object with the default values.
        """
        return cls(
            topic_id, name, name, url_fragment, None, None, None,
            description, [], [], [], [],
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, 1,
            constants.DEFAULT_LANGUAGE_CODE, 0,
            feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION, '',
            False, page_title_frag, [])

    @classmethod
    def _convert_subtopic_v3_dict_to_v4_dict(
        cls, topic_id: str, subtopic_dict: SubtopicDict
    ) -> SubtopicDict:
        """Converts old Subtopic schema to the modern v4 schema. v4 schema
        introduces the thumbnail_size_in_bytes field.

        Args:
            topic_id: str. The id of the topic to which the subtopic is linked
                to.
            subtopic_dict: dict. A dict used to initialize a Subtopic domain
                object.

        Returns:
            dict. The converted subtopic_dict.
        """
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, topic_id)
        filepath = '%s/%s' % (
            constants.ASSET_TYPE_THUMBNAIL, subtopic_dict['thumbnail_filename'])
        subtopic_dict['thumbnail_size_in_bytes'] = (
            len(fs.get(filepath)) if fs.isfile(filepath) else None)

        return subtopic_dict

    @classmethod
    def _convert_subtopic_v2_dict_to_v3_dict(
        cls, subtopic_dict: SubtopicDict
    ) -> SubtopicDict:
        """Converts old Subtopic schema to the modern v3 schema. v3 schema
        introduces the url_fragment field.

        Args:
            subtopic_dict: dict. A dict used to initialize a Subtopic domain
                object.

        Returns:
            dict. The converted subtopic_dict.
        """
        subtopic_title = re.sub('[^a-z]+', '', subtopic_dict['title'])
        subtopic_dict['url_fragment'] = (
            subtopic_title[:constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT])
        return subtopic_dict

    @classmethod
    def _convert_subtopic_v1_dict_to_v2_dict(
        cls, subtopic_dict: SubtopicDict
    ) -> SubtopicDict:
        """Converts old Subtopic schema to the modern v2 schema. v2 schema
        introduces the thumbnail_filename and thumbnail_bg_color field.

        Args:
            subtopic_dict: dict. A dict used to initialize a Subtopic domain
                object.

        Returns:
            dict. The converted subtopic_dict.
        """
        subtopic_dict['thumbnail_filename'] = None
        subtopic_dict['thumbnail_bg_color'] = None
        return subtopic_dict

    @classmethod
    def update_subtopics_from_model(
        cls,
        versioned_subtopics: VersionedSubtopicsDict,
        current_version: int,
        topic_id: str
    ) -> None:
        """Converts the subtopics blob contained in the given
        versioned_subtopics dict from current_version to
        current_version + 1. Note that the versioned_subtopics being
        passed in is modified in-place.

        Args:
            versioned_subtopics: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    subtopics dict.
                - subtopics: list(dict). The list of dicts comprising the
                    subtopics of the topic.
            current_version: int. The current schema version of subtopics.
            topic_id: str. The topic_id of the topic to which the subtopics
                are linked to.
        """
        versioned_subtopics['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_subtopic_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))

        if current_version == 3:
            conversion_fn = functools.partial(conversion_fn, topic_id)

        updated_subtopics = []
        for subtopic in versioned_subtopics['subtopics']:
            updated_subtopics.append(conversion_fn(subtopic))

        versioned_subtopics['subtopics'] = updated_subtopics

    @classmethod
    def update_story_references_from_model(
        cls,
        versioned_story_references: VersionedStoryReferencesDict,
        current_version: int
    ) -> None:
        """Converts the story_references blob contained in the given
        versioned_story_references dict from current_version to
        current_version + 1. Note that the versioned_story_references being
        passed in is modified in-place.

        Args:
            versioned_story_references: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    story_references dict.
                - story_references: list(dict). The list of dicts comprising the
                    story_references of the topic.
            current_version: int. The current schema version of
                story_references.
        """
        versioned_story_references['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_story_reference_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))

        updated_story_references = []
        for reference in versioned_story_references['story_references']:
            updated_story_references.append(conversion_fn(reference))

        versioned_story_references['story_references'] = (
            updated_story_references)

    def update_name(self, new_name: str) -> None:
        """Updates the name of a topic object.

        Args:
            new_name: str. The updated name for the topic.

        Raises:
            ValidationError. Name should be a string.
        """
        if not isinstance(new_name, str):
            raise utils.ValidationError('Name should be a string.')
        self.name = new_name
        self.canonical_name = new_name.lower()

    def update_abbreviated_name(self, new_abbreviated_name: str) -> None:
        """Updates the abbreviated_name of a topic object.

        Args:
            new_abbreviated_name: str. The updated abbreviated_name
                for the topic.
        """
        self.abbreviated_name = new_abbreviated_name

    def update_url_fragment(self, new_url_fragment: str) -> None:
        """Updates the url_fragment of a topic object.

        Args:
            new_url_fragment: str. The updated url_fragment for the topic.
        """
        self.url_fragment = new_url_fragment

    def update_thumbnail_filename_and_size(
        self, new_thumbnail_filename: str, new_thumbnail_size: int
    ) -> None:
        """Updates the thumbnail filename and file size of a topic object.

        Args:
            new_thumbnail_filename: str|None. The updated thumbnail filename
                for the topic.
            new_thumbnail_size: int. The updated thumbnail file size.
        """
        self.thumbnail_filename = new_thumbnail_filename
        self.thumbnail_size_in_bytes = new_thumbnail_size

    def update_thumbnail_bg_color(
        self, new_thumbnail_bg_color: Optional[str]
    ) -> None:
        """Updates the thumbnail background color of a topic object.

        Args:
            new_thumbnail_bg_color: str|None. The updated thumbnail background
                color for the topic.
        """
        self.thumbnail_bg_color = new_thumbnail_bg_color

    def update_description(self, new_description: str) -> None:
        """Updates the description of a topic object.

        Args:
            new_description: str. The updated description for the topic.
        """
        self.description = new_description

    def update_language_code(self, new_language_code: str) -> None:
        """Updates the language code of a topic object.

        Args:
            new_language_code: str. The updated language code for the topic.
        """
        self.language_code = new_language_code

    def update_meta_tag_content(self, new_meta_tag_content: str) -> None:
        """Updates the meta tag content of a topic object.

        Args:
            new_meta_tag_content: str. The updated meta tag content for the
                topic.
        """
        self.meta_tag_content = new_meta_tag_content

    def update_page_title_fragment_for_web(
        self, new_page_title_fragment_for_web: str
    ) -> None:
        """Updates the page title fragment of a topic object.

        Args:
            new_page_title_fragment_for_web: str. The updated page title
                fragment for the topic.
        """
        self.page_title_fragment_for_web = new_page_title_fragment_for_web

    def update_practice_tab_is_displayed(
        self, new_practice_tab_is_displayed: bool
    ) -> None:
        """Updates the language code of a topic object.

        Args:
            new_practice_tab_is_displayed: bool. The updated practice tab is
                displayed property for the topic.
        """
        self.practice_tab_is_displayed = new_practice_tab_is_displayed

    def update_skill_ids_for_diagnostic_test(
        self, skill_ids_for_diagnostic_test: List[str]
    ) -> None:
        """Updates the skill_ids_for_diagnostic_test field for the topic
        instance.

        Args:
            skill_ids_for_diagnostic_test: list(str). A list of skill_ids that
                will be used to update skill_ids_for_diagnostic_test field for
                the topic.
        """
        self.skill_ids_for_diagnostic_test = skill_ids_for_diagnostic_test

    def add_uncategorized_skill_id(
        self, new_uncategorized_skill_id: str
    ) -> None:
        """Updates the skill id list of a topic object.

        Args:
            new_uncategorized_skill_id: str. The new skill id to add to
                uncategorized_skill_ids list.

        Raises:
            Exception. The given skill id is already present in a subtopic.
        """
        for subtopic in self.subtopics:
            if new_uncategorized_skill_id in subtopic.skill_ids:
                raise Exception(
                    'The skill id %s already exists in subtopic with id %s.'
                    % (new_uncategorized_skill_id, subtopic.id))

        if new_uncategorized_skill_id in self.uncategorized_skill_ids:
            raise Exception(
                'The skill id %s is already an uncategorized skill.'
                % new_uncategorized_skill_id)

        self.uncategorized_skill_ids.append(new_uncategorized_skill_id)

    def remove_uncategorized_skill_id(
        self, uncategorized_skill_id: str
    ) -> None:
        """Updates the skill id list of a topic object.

        Args:
            uncategorized_skill_id: str. The skill id to be removed from the
                uncategorized_skill_ids list.

        Raises:
            Exception. The given skill id is not present in the
                uncategorized_skill_ids list.
        """
        if uncategorized_skill_id not in self.uncategorized_skill_ids:
            raise Exception(
                'The skill id %s is not present in the topic.'
                % uncategorized_skill_id)

        if uncategorized_skill_id in self.skill_ids_for_diagnostic_test:
            self.skill_ids_for_diagnostic_test.remove(uncategorized_skill_id)
        self.uncategorized_skill_ids.remove(uncategorized_skill_id)

    def get_all_subtopics(self) -> List[SubtopicDict]:
        """Returns all subtopics in the topic.

        Returns:
            list(dict). The list of all subtopics present
            in topic.
        """
        subtopics = []
        for _, subtopic in enumerate(self.subtopics):
            subtopics.append(subtopic.to_dict())
        return subtopics

    def get_subtopic_index(self, subtopic_id: int) -> int:
        """Gets the index of the subtopic with the given id in the subtopics
        list.

        Args:
            subtopic_id: int. The id of the subtopic for which the index is to
                be found.

        Returns:
            int. Returns the index of the subtopic if it exists or else
            None.

        Raises:
            Exception. The subtopic does not exist.
        """
        for ind, subtopic in enumerate(self.subtopics):
            if subtopic.id == subtopic_id:
                return ind
        raise Exception(
            'The subtopic with id %s does not exist.' % subtopic_id)

    def add_subtopic(
        self,
        new_subtopic_id: int,
        title: str,
        url_frag: str
    ) -> None:
        """Adds a subtopic with the given id and title.

        Args:
            new_subtopic_id: int. The id of the new subtopic.
            title: str. The title for the new subtopic.
            url_frag: str. The url fragment of the new subtopic.

        Raises:
            Exception. The new subtopic ID is not equal to the expected next
                subtopic ID.
        """
        if self.next_subtopic_id != new_subtopic_id:
            raise Exception(
                'The given new subtopic id %s is not equal to the expected '
                'next subtopic id: %s'
                % (new_subtopic_id, self.next_subtopic_id))
        self.next_subtopic_id = self.next_subtopic_id + 1
        self.subtopics.append(
            Subtopic.create_default_subtopic(new_subtopic_id, title, url_frag))

    def delete_subtopic(self, subtopic_id: int) -> None:
        """Deletes the subtopic with the given id and adds all its skills to
        uncategorized skill ids section.

        Args:
            subtopic_id: int. The id of the subtopic to remove.

        Raises:
            Exception. A subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        for skill_id in self.subtopics[subtopic_index].skill_ids:
            self.uncategorized_skill_ids.append(skill_id)
        del self.subtopics[subtopic_index]

    def update_subtopic_title(self, subtopic_id: int, new_title: str) -> None:
        """Updates the title of the new subtopic.

        Args:
            subtopic_id: int. The id of the subtopic to edit.
            new_title: str. The new title for the subtopic.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        self.subtopics[subtopic_index].title = new_title

    def update_subtopic_thumbnail_filename_and_size(
        self,
        subtopic_id: int,
        new_thumbnail_filename: str,
        new_thumbnail_size: int
    ) -> None:
        """Updates the thumbnail filename and file size property
         of the new subtopic.

        Args:
            subtopic_id: int. The id of the subtopic to edit.
            new_thumbnail_filename: str. The new thumbnail filename for the
                subtopic.
            new_thumbnail_size: int. The updated thumbnail file size.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        self.subtopics[subtopic_index].thumbnail_filename = (
            new_thumbnail_filename)
        self.subtopics[subtopic_index].thumbnail_size_in_bytes = (
            new_thumbnail_size)

    def update_subtopic_url_fragment(
        self, subtopic_id: int, new_url_fragment: str
    ) -> None:
        """Updates the url fragment of the subtopic.

        Args:
            subtopic_id: int. The id of the subtopic to edit.
            new_url_fragment: str. The new url fragment of the subtopic.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        utils.require_valid_url_fragment(
            new_url_fragment, 'Subtopic Url Fragment',
            constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT)
        self.subtopics[subtopic_index].url_fragment = new_url_fragment

    def update_subtopic_thumbnail_bg_color(
        self, subtopic_id: int, new_thumbnail_bg_color: str
    ) -> None:
        """Updates the thumbnail background color property of the new subtopic.

        Args:
            subtopic_id: int. The id of the subtopic to edit.
            new_thumbnail_bg_color: str. The new thumbnail background color for
                the subtopic.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        self.subtopics[subtopic_index].thumbnail_bg_color = (
            new_thumbnail_bg_color)

    def rearrange_skill_in_subtopic(
        self, subtopic_id: int, from_index: int, to_index: int
    ) -> None:
        """Rearranges the skills in the subtopic with the given id.

        Args:
            subtopic_id: int. The id of subtopic.
            from_index: int. The index of skill to move.
            to_index: int. The index at which to insert the moved skill.

        Raises:
            Exception. Invalid input.
        """
        if from_index == to_index:
            raise Exception(
                'Expected from_index and to_index values to be different.')

        subtopic_index = self.get_subtopic_index(subtopic_id)

        if (from_index >= len(self.subtopics[subtopic_index].skill_ids) or
                from_index < 0):
            raise Exception('Expected from_index value to be with-in bounds.')

        if (to_index >= len(self.subtopics[subtopic_index].skill_ids) or
                to_index < 0):
            raise Exception('Expected to_index value to be with-in bounds.')

        skill_to_move = copy.deepcopy(
            self.subtopics[subtopic_index].skill_ids[from_index])
        del self.subtopics[subtopic_index].skill_ids[from_index]
        self.subtopics[subtopic_index].skill_ids.insert(
            to_index, skill_to_move)

    def rearrange_subtopic(self, from_index: int, to_index: int) -> None:
        """Rearranges the subtopic in the topic.

        Args:
            from_index: int. The index of subtopic to move.
            to_index: int. The index at which to insert the moved subtopic.

        Raises:
            Exception. Invalid input.
        """
        if from_index == to_index:
            raise Exception(
                'Expected from_index and to_index values to be different.')

        if from_index >= len(self.subtopics) or from_index < 0:
            raise Exception('Expected from_index value to be with-in bounds.')

        if to_index >= len(self.subtopics) or to_index < 0:
            raise Exception('Expected to_index value to be with-in bounds.')

        skill_to_move = copy.deepcopy(
            self.subtopics[from_index])
        del self.subtopics[from_index]
        self.subtopics.insert(to_index, skill_to_move)

    def move_skill_id_to_subtopic(
        self,
        old_subtopic_id: Optional[int],
        new_subtopic_id: int,
        skill_id: str
    ) -> None:
        """Moves the skill_id to a new subtopic or to uncategorized skill ids.

        Args:
            old_subtopic_id: int or None. The id of the subtopic in which the
                skill is present currently (before moving) or None if it is
                uncategorized.
            new_subtopic_id: int. The id of the new subtopic to which the skill
                is to be moved.
            skill_id: str. The skill id which is to be moved.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
            Exception. The skill id is not present in the old subtopic
                (or uncategorized skill id list) already before moving.
            Exception. The skill id is already present in the new subtopic.
        """
        if old_subtopic_id is not None:
            old_subtopic_index = self.get_subtopic_index(old_subtopic_id)
            if skill_id not in self.subtopics[old_subtopic_index].skill_ids:
                raise Exception(
                    'Skill id %s is not present in the given old subtopic'
                    % skill_id)
        else:
            if skill_id not in self.uncategorized_skill_ids:
                raise Exception(
                    'Skill id %s is not an uncategorized skill id.' % skill_id)

        new_subtopic_index = self.get_subtopic_index(new_subtopic_id)
        if skill_id in self.subtopics[new_subtopic_index].skill_ids:
            raise Exception(
                'Skill id %s is already present in the target subtopic'
                % skill_id)

        if old_subtopic_id is None:
            self.uncategorized_skill_ids.remove(skill_id)
        else:
            self.subtopics[old_subtopic_index].skill_ids.remove(skill_id)

        self.subtopics[new_subtopic_index].skill_ids.append(skill_id)

    def remove_skill_id_from_subtopic(
        self, subtopic_id: int, skill_id: str
    ) -> None:
        """Removes the skill_id from a subtopic and adds it to
        uncategorized skill ids.

        Args:
            subtopic_id: int. The subtopic from which the skill is
                to be removed.
            skill_id: str. The skill id which is to be removed.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
            Exception. The skill id should be present in the old subtopic
                already before moving.
        """

        subtopic_index = self.get_subtopic_index(subtopic_id)
        if skill_id not in self.subtopics[subtopic_index].skill_ids:
            raise Exception(
                'Skill id %s is not present in the old subtopic'
                % skill_id)

        self.subtopics[subtopic_index].skill_ids.remove(skill_id)
        self.uncategorized_skill_ids.append(skill_id)

    def are_subtopic_url_fragments_unique(self) -> bool:
        """Checks if all the subtopic url fragments are unique across the
        topic.

        Returns:
            bool. Whether the subtopic url fragments are unique in the topic.
        """
        url_fragments_list = [
            subtopic.url_fragment for subtopic in self.subtopics]
        url_fragments_set = set(url_fragments_list)
        return len(url_fragments_list) == len(url_fragments_set)


class TopicSummaryDict(TypedDict):
    """Dictionary that represents TopicSummary."""

    id: str
    name: str
    url_fragment: str
    language_code: str
    description: str
    version: int
    canonical_story_count: int
    additional_story_count: int
    uncategorized_skill_count: int
    subtopic_count: int
    total_skill_count: int
    total_published_node_count: int
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    published_story_exploration_mapping: Dict[str, List[str]]
    topic_model_created_on: float
    topic_model_last_updated: float


class FrontendTopicSummaryDict(TopicSummaryDict):
    """Dictionary that represents TopicSummary domain object for frontend."""

    is_published: bool
    can_edit_topic: bool
    classroom: Optional[str]
    total_upcoming_chapters_count: int
    total_overdue_chapters_count: int
    total_chapter_counts_for_each_story: List[int]
    published_chapter_counts_for_each_story: List[int]


class TopicSummary:
    """Domain object for Topic Summary."""

    def __init__(
        self,
        topic_id: str,
        name: str,
        canonical_name: str,
        language_code: str,
        description: str,
        version: int,
        canonical_story_count: int,
        additional_story_count: int,
        uncategorized_skill_count: int,
        subtopic_count: int,
        total_skill_count: int,
        total_published_node_count: int,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        url_fragment: str,
        published_story_exploration_mapping: Dict[str, List[str]],
        topic_model_created_on: datetime.datetime,
        topic_model_last_updated: datetime.datetime
    ) -> None:
        """Constructs a TopicSummary domain object.

        Args:
            topic_id: str. The unique id of the topic.
            name: str. The name of the topic.
            canonical_name: str. The canonical name (lowercase) of the topic.
            language_code: str. The language code of the topic.
            description: str. The description of the topic.
            version: int. The version of the topic.
            canonical_story_count: int. The number of canonical stories present
                in the topic.
            additional_story_count: int. The number of additional stories
                present in the topic.
            uncategorized_skill_count: int. The number of uncategorized skills
                in the topic.
            subtopic_count: int. The number of subtopics in the topic.
            total_skill_count: int. The total number of skills in the topic
                (including those that are uncategorized).
            total_published_node_count: int. The total number of chapters
                that are published and associated with the stories of the topic.
            thumbnail_filename: str|None. The filename for the topic thumbnail,
                or None if no filename is provided.
            thumbnail_bg_color: str|None. The background color for the
                thumbnail, or None if no background color provided for
                the thumbnail.
            url_fragment: str. The url fragment of the topic.
            published_story_exploration_mapping: dict(str, list(str)). The
                mappings' keys are the ids of published stories owned by the
                topic and each key maps to a list of the story's linked
                exploration ids.
            topic_model_created_on: datetime.datetime. Date and time when
                the topic model is created.
            topic_model_last_updated: datetime.datetime. Date and time
                when the topic model was last updated.
        """
        self.id = topic_id
        self.name = name
        self.description = description
        self.canonical_name = canonical_name
        self.language_code = language_code
        self.version = version
        self.canonical_story_count = canonical_story_count
        self.additional_story_count = additional_story_count
        self.uncategorized_skill_count = uncategorized_skill_count
        self.subtopic_count = subtopic_count
        self.total_skill_count = total_skill_count
        self.total_published_node_count = total_published_node_count
        self.thumbnail_filename = thumbnail_filename
        self.thumbnail_bg_color = thumbnail_bg_color
        self.topic_model_created_on = topic_model_created_on
        self.topic_model_last_updated = topic_model_last_updated
        self.url_fragment = url_fragment
        self.published_story_exploration_mapping = (
            published_story_exploration_mapping)

    @classmethod
    def require_valid_url_fragment(cls, url_fragment: str) -> None:
        """Checks whether the url fragment of the topic is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.
        """
        utils.require_valid_url_fragment(
            url_fragment, 'Topic URL Fragment',
            constants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT)

    def validate(self) -> None:
        """Validates all properties of this topic summary.

        Raises:
            ValidationError. One or more attributes of the Topic summary
                are not valid.
        """
        self.require_valid_url_fragment(self.url_fragment)
        if self.name == '':
            raise utils.ValidationError('Name field should not be empty')

        if self.thumbnail_filename is not None:
            utils.require_valid_thumbnail_filename(self.thumbnail_filename)
        if (
                self.thumbnail_bg_color is not None and not (
                    Topic.require_valid_thumbnail_bg_color(
                        self.thumbnail_bg_color))):
            raise utils.ValidationError(
                'Topic thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Topic thumbnail image is not provided.')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Topic thumbnail background color is not specified.')

        if self.canonical_name == '':
            raise utils.ValidationError(
                'Canonical name field should not be empty')

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if self.canonical_story_count < 0:
            raise utils.ValidationError(
                'Expected canonical_story_count to be non-negative, '
                'received \'%s\'' % self.canonical_story_count)

        if self.additional_story_count < 0:
            raise utils.ValidationError(
                'Expected additional_story_count to be non-negative, '
                'received \'%s\'' % self.additional_story_count)

        if self.uncategorized_skill_count < 0:
            raise utils.ValidationError(
                'Expected uncategorized_skill_count to be non-negative, '
                'received \'%s\'' % self.uncategorized_skill_count)

        if self.total_skill_count < 0:
            raise utils.ValidationError(
                'Expected total_skill_count to be non-negative, '
                'received \'%s\'' % self.total_skill_count)

        if self.total_skill_count < self.uncategorized_skill_count:
            raise utils.ValidationError(
                'Expected total_skill_count to be greater than or equal to '
                'uncategorized_skill_count %s, received \'%s\'' % (
                    self.uncategorized_skill_count, self.total_skill_count))

        if self.total_published_node_count < 0:
            raise utils.ValidationError(
                'Expected total_published_node_count to be non-negative, '
                'received \'%s\'' % self.total_published_node_count)

        if self.subtopic_count < 0:
            raise utils.ValidationError(
                'Expected subtopic_count to be non-negative, '
                'received \'%s\'' % self.subtopic_count)

    def to_dict(self) -> TopicSummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this TopicSummary object.
        """
        return {
            'id': self.id,
            'name': self.name,
            'url_fragment': self.url_fragment,
            'language_code': self.language_code,
            'description': self.description,
            'version': self.version,
            'canonical_story_count': self.canonical_story_count,
            'additional_story_count': self.additional_story_count,
            'uncategorized_skill_count': self.uncategorized_skill_count,
            'subtopic_count': self.subtopic_count,
            'total_skill_count': self.total_skill_count,
            'total_published_node_count': self.total_published_node_count,
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'published_story_exploration_mapping': (
                self.published_story_exploration_mapping),
            'topic_model_created_on': utils.get_time_in_millisecs(
                self.topic_model_created_on),
            'topic_model_last_updated': utils.get_time_in_millisecs(
                self.topic_model_last_updated)
        }


class TopicRights:
    """Domain object for topic rights."""

    def __init__(
        self,
        topic_id: str,
        manager_ids: List[str],
        topic_is_published: bool
    ) -> None:
        """Constructs a TopicRights domain object.

        Args:
            topic_id: str. The id of the topic.
            manager_ids: list(str). The id of the users who have been assigned
                as managers for the topic.
            topic_is_published: bool. Whether the topic is viewable by a
                learner.
        """
        self.id = topic_id
        self.manager_ids = manager_ids
        self.topic_is_published = topic_is_published

    def is_manager(self, user_id: str) -> bool:
        """Checks whether given user is a manager of the topic.

        Args:
            user_id: str. Id of the user.

        Returns:
            bool. Whether user is a topic manager of this topic.
        """
        return bool(user_id in self.manager_ids)


class TopicChapterCounts:
    """Domain object for chapter counts in a topic."""

    def __init__(
        self,
        total_upcoming_chapters_count: int,
        total_overdue_chapters_count: int,
        total_chapter_counts_for_each_story: List[int],
        published_chapter_counts_for_each_story: List[int]
    ) -> None:
        """Constructs a TopicChapterCounts domain object.

        Args:
            total_upcoming_chapters_count: int. Total number of upcoming
                chapters in all the stories of the topic.
            total_overdue_chapters_count: int. Total number of behind-schedule
                chapters in all the stories of the topic.
            total_chapter_counts_for_each_story: list(int). List of total
                chapters in each story of the topic.
            published_chapter_counts_for_each_story: list(int). List of
                number of published chapters in each story of the topic.
        """
        self.total_upcoming_chapters_count = total_upcoming_chapters_count
        self.total_overdue_chapters_count = total_overdue_chapters_count
        self.total_chapter_counts_for_each_story = (
            total_chapter_counts_for_each_story)
        self.published_chapter_counts_for_each_story = (
            published_chapter_counts_for_each_story)
