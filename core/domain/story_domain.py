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

"""Domain objects relating to stories."""

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

from typing import Final, List, Literal, Optional, TypedDict, overload

from core.domain import fs_services  # pylint: disable=invalid-import-from # isort:skip
from core.domain import html_cleaner  # pylint: disable=invalid-import-from # isort:skip
from core.domain import html_validation_service  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
STORY_PROPERTY_TITLE: Final = 'title'
STORY_PROPERTY_THUMBNAIL_BG_COLOR: Final = 'thumbnail_bg_color'
STORY_PROPERTY_THUMBNAIL_FILENAME: Final = 'thumbnail_filename'
STORY_PROPERTY_DESCRIPTION: Final = 'description'
STORY_PROPERTY_NOTES: Final = 'notes'
STORY_PROPERTY_LANGUAGE_CODE: Final = 'language_code'
STORY_PROPERTY_URL_FRAGMENT: Final = 'url_fragment'
STORY_PROPERTY_META_TAG_CONTENT: Final = 'meta_tag_content'

STORY_NODE_PROPERTY_DESTINATION_NODE_IDS: Final = 'destination_node_ids'
STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS: Final = 'acquired_skill_ids'
STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS: Final = 'prerequisite_skill_ids'
STORY_NODE_PROPERTY_OUTLINE: Final = 'outline'
STORY_NODE_PROPERTY_TITLE: Final = 'title'
STORY_NODE_PROPERTY_DESCRIPTION: Final = 'description'
STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR: Final = 'thumbnail_bg_color'
STORY_NODE_PROPERTY_THUMBNAIL_FILENAME: Final = 'thumbnail_filename'
STORY_NODE_PROPERTY_EXPLORATION_ID: Final = 'exploration_id'
STORY_NODE_PROPERTY_STATUS: Final = 'status'
STORY_NODE_PROPERTY_PLANNED_PUBLICATION_DATE: Final = (
    'planned_publication_date_msecs')
STORY_NODE_PROPERTY_LAST_MODIFIED: Final = 'last_modified_msecs'
STORY_NODE_PROPERTY_FIRST_PUBLICATION_DATE: Final = (
    'first_publication_date_msecs')
STORY_NODE_PROPERTY_UNPUBLISHING_REASON: Final = 'unpublishing_reason'


INITIAL_NODE_ID: Final = 'initial_node_id'
NODE: Final = 'node'

CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION: Final = 'migrate_schema_to_latest_version'

# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_STORY_PROPERTY: Final = 'update_story_property'
CMD_UPDATE_STORY_NODE_PROPERTY: Final = 'update_story_node_property'
CMD_UPDATE_STORY_CONTENTS_PROPERTY: Final = 'update_story_contents_property'

# These take node_id as parameter.
CMD_ADD_STORY_NODE: Final = 'add_story_node'
CMD_DELETE_STORY_NODE: Final = 'delete_story_node'
CMD_UPDATE_STORY_NODE_OUTLINE_STATUS: Final = 'update_story_node_outline_status'

# This takes additional 'title' parameters.
CMD_CREATE_NEW: Final = 'create_new'

CMD_CHANGE_ROLE: Final = 'change_role'

ROLE_MANAGER: Final = 'manager'
ROLE_NONE: Final = 'none'
# The prefix for all node ids of a story.
NODE_ID_PREFIX: Final = 'node_'


class StoryChange(change_domain.BaseChange):
    """Domain object for changes made to story object.

    The allowed commands, together with the attributes:
        - 'add_story_node' (with node_id, title)
        - 'delete_story_node' (with node_id)
        - 'update_story_node_outline_status' (with node_id, old_value
        and new_value)
        - 'update_story_property' (with property_name, new_value
        and old_value)
        - 'update_story_node_property' (with property_name, new_value
        and old_value)
        - 'update_story_contents_property' (with property_name,
        new_value and old_value)
        - 'migrate_schema_to_latest_version' (with from_version and
        to_version)
        - 'create_new' (with title)
    """

    # The allowed list of story properties which can be used in
    # update_story_property command.
    STORY_PROPERTIES: List[str] = [
        STORY_PROPERTY_TITLE,
        STORY_PROPERTY_THUMBNAIL_BG_COLOR,
        STORY_PROPERTY_THUMBNAIL_FILENAME,
        STORY_PROPERTY_DESCRIPTION,
        STORY_PROPERTY_NOTES,
        STORY_PROPERTY_LANGUAGE_CODE,
        STORY_PROPERTY_URL_FRAGMENT,
        STORY_PROPERTY_META_TAG_CONTENT
    ]

    # The allowed list of story node properties which can be used in
    # update_story_node_property command.
    STORY_NODE_PROPERTIES: List[str] = [
        STORY_NODE_PROPERTY_DESTINATION_NODE_IDS,
        STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS,
        STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS,
        STORY_NODE_PROPERTY_OUTLINE,
        STORY_NODE_PROPERTY_EXPLORATION_ID,
        STORY_NODE_PROPERTY_TITLE,
        STORY_NODE_PROPERTY_DESCRIPTION,
        STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR,
        STORY_NODE_PROPERTY_THUMBNAIL_FILENAME,
        STORY_NODE_PROPERTY_STATUS,
        STORY_NODE_PROPERTY_PLANNED_PUBLICATION_DATE,
        STORY_NODE_PROPERTY_LAST_MODIFIED,
        STORY_NODE_PROPERTY_FIRST_PUBLICATION_DATE,
        STORY_NODE_PROPERTY_UNPUBLISHING_REASON
    ]

    # The allowed list of story content properties which can be used in
    # update_story_contents_property command.
    STORY_CONTENTS_PROPERTIES: List[str] = [INITIAL_NODE_ID, NODE]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_UPDATE_STORY_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': STORY_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_STORY_NODE_PROPERTY,
        'required_attribute_names': [
            'node_id', 'property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': STORY_NODE_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_STORY_CONTENTS_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': STORY_CONTENTS_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_STORY_NODE,
        'required_attribute_names': ['node_id', 'title'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_STORY_NODE,
        'required_attribute_names': ['node_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
        'required_attribute_names': ['node_id', 'old_value', 'new_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['title'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class CreateNewStoryCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_CREATE_NEW command.
    """

    title: str


class MigrateSchemaToLatestVersionCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: str
    to_version: str


class UpdateStoryNodeOutlineStatusCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_OUTLINE_STATUS command.
    """

    node_id: str
    old_value: bool
    new_value: bool


class DeleteStoryNodeCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_DELETE_STORY_NODE command.
    """

    node_id: str


class AddStoryNodeCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_ADD_STORY_NODE command.
    """

    node_id: str
    title: str


class UpdateStoryContentsPropertyInitialNodeIdCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_CONTENTS_PROPERTY command with
    INITIAL_NODE_ID as allowed value.
    """

    property_name: Literal['initial_node_id']
    new_value: str
    old_value: str


class UpdateStoryContentsPropertyNodeCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_CONTENTS_PROPERTY command with
    NODE as allowed value.
    """

    property_name: Literal['node']
    new_value: int
    old_value: int


class UpdateStoryNodePropertyDestinationNodeIdsCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_DESTINATION_NODE_IDS as
    allowed value.
    """

    node_id: str
    property_name: Literal['destination_node_ids']
    new_value: List[str]
    old_value: List[str]


class UpdateStoryNodePropertyAcquiredSkillIdsCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS as
    allowed value.
    """

    node_id: str
    property_name: Literal['acquired_skill_ids']
    new_value: List[str]
    old_value: List[str]


class UpdateStoryNodePropertyPrerequisiteSkillIdsCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS as
    allowed value.
    """

    node_id: str
    property_name: Literal['prerequisite_skill_ids']
    new_value: List[str]
    old_value: List[str]


class UpdateStoryNodePropertyOutlineCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_OUTLINE as allowed value.
    """

    node_id: str
    property_name: Literal['outline']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyExplorationIdCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_EXPLORATION_ID as allowed
    value.
    """

    node_id: str
    property_name: Literal['exploration_id']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyTitleCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_TITLE as allowed value.
    """

    node_id: str
    property_name: Literal['title']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyDescriptionCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_DESCRIPTION as allowed value.
    """

    node_id: str
    property_name: Literal['description']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyThumbnailBGColorCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR as
    allowed value.
    """

    node_id: str
    property_name: Literal['thumbnail_bg_color']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyThumbnailFilenameCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_THUMBNAIL_FILENAME as
    allowed value.
    """

    node_id: str
    property_name: Literal['thumbnail_filename']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyStatusCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_STATUS as
    allowed value.
    """

    node_id: str
    property_name: Literal['status']
    new_value: str
    old_value: str


class UpdateStoryNodePropertyLastModifiedCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_LAST_MODIFIED as
    allowed value.
    """

    node_id: str
    property_name: Literal['last_modified_msecs']
    new_value: float
    old_value: float


class UpdateStoryNodePropertyPlannedPublicationDateCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_PLANNED_PUBLICATION_DATE as
    allowed value.
    """

    node_id: str
    property_name: Literal['planned_publication_date_msecs']
    new_value: float
    old_value: float


class UpdateStoryNodePropertyFirstPublicationDateCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_FIRST_PUBLICATION_DATE as
    allowed value.
    """

    node_id: str
    property_name: Literal['first_publication_date_msecs']
    new_value: float
    old_value: float


class UpdateStoryNodePropertyUnpublishingReasonCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_NODE_PROPERTY command with
    STORY_NODE_PROPERTY_UNPUBLISHING_REASON as
    allowed value.
    """

    node_id: str
    property_name: Literal['unpublishing_reason']
    new_value: str
    old_value: str


class UpdateStoryPropertyCmd(StoryChange):
    """Class representing the StoryChange's
    CMD_UPDATE_STORY_PROPERTY command.
    """

    property_name: str
    new_value: str
    old_value: str


class StoryNodeDict(TypedDict):
    """Dictionary representing the StoryNode object."""

    id: str
    title: str
    description: str
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    thumbnail_size_in_bytes: Optional[int]
    destination_node_ids: List[str]
    acquired_skill_ids: List[str]
    prerequisite_skill_ids: List[str]
    outline: str
    outline_is_finalized: bool
    exploration_id: Optional[str]
    status: Optional[str]
    planned_publication_date_msecs: Optional[float]
    last_modified_msecs: Optional[float]
    first_publication_date_msecs: Optional[float]
    unpublishing_reason: Optional[str]


class StoryNode:
    """Domain object describing a node in the exploration graph of a
    story.
    """

    def __init__(
        self,
        node_id: str,
        title: str,
        description: str,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_size_in_bytes: Optional[int],
        destination_node_ids: List[str],
        acquired_skill_ids: List[str],
        prerequisite_skill_ids: List[str],
        outline: str,
        outline_is_finalized: bool,
        exploration_id: Optional[str],
        status: Optional[str],
        planned_publication_date: Optional[datetime.datetime],
        last_modified: Optional[datetime.datetime],
        first_publication_date: Optional[datetime.datetime],
        unpublishing_reason: Optional[str]
    ) -> None:
        """Initializes a StoryNode domain object.

        Args:
            node_id: str. The unique id for each node.
            title: str. The title of the story node.
            description: str. The description for the story node.
            thumbnail_filename: str|None. The thumbnail filename of the story
                node.
            thumbnail_bg_color: str|None. The thumbnail background color of
                the story node.
            thumbnail_size_in_bytes: int|None. The size of thumbnail in bytes.
            destination_node_ids: list(str). The list of destination node ids
                that this node points to in the story graph.
            acquired_skill_ids: list(str). The list of skill ids acquired by
                the user on completion of the node.
            prerequisite_skill_ids: list(str). The list of skill ids required
                before starting a node.
            outline: str. Free-form annotations that a lesson implementer
                can use to construct the exploration. It describes the basic
                theme or template of the story and is to be provided in html
                form.
            outline_is_finalized: bool. Whether the outline for the story
                node is finalized or not.
            exploration_id: str or None. The valid exploration id that fits the
                story node. It can be None initially, when the story creator
                has just created a story with the basic storyline (by providing
                outlines) without linking an exploration to any node.
            status: str. It is the publication status of the node.
            planned_publication_date: datetime.datetime | None. It is the
                expected publication date for a node.
            last_modified: datetime.datetime | None. The date time when a node
                was last modified.
            first_publication_date: datetime.datetime | None. The date when
                the node was first published.
            unpublishing_reason: str or None. The reason for unpublishing this
                node. It is None when the node is published.
        """
        self.id = node_id
        self.title = title
        self.description = description
        self.thumbnail_filename = thumbnail_filename
        self.thumbnail_bg_color = thumbnail_bg_color
        self.thumbnail_size_in_bytes = thumbnail_size_in_bytes
        self.destination_node_ids = destination_node_ids
        self.acquired_skill_ids = acquired_skill_ids
        self.prerequisite_skill_ids = prerequisite_skill_ids
        self.outline = html_cleaner.clean(outline)
        self.outline_is_finalized = outline_is_finalized
        self.exploration_id = exploration_id
        self.status = status
        self.planned_publication_date = planned_publication_date
        self.last_modified = last_modified
        self.first_publication_date = first_publication_date
        self.unpublishing_reason = unpublishing_reason

    @classmethod
    def get_number_from_node_id(cls, node_id: str) -> int:
        """Decodes the node_id to get the number at the end of the id.

        Args:
            node_id: str. The id of the node.

        Returns:
            int. The number at the end of the id.
        """
        return int(node_id.replace(NODE_ID_PREFIX, ''))

    @classmethod
    def get_incremented_node_id(cls, node_id: str) -> str:
        """Increments the next node id of the story.

        Args:
            node_id: str. The node id to be incremented.

        Returns:
            str. The new next node id.
        """
        current_number = StoryNode.get_number_from_node_id(node_id)
        incremented_node_id = NODE_ID_PREFIX + str(current_number + 1)
        return incremented_node_id

    @classmethod
    def require_valid_node_id(cls, node_id: str) -> None:
        """Validates the node id for a StoryNode object.

        Args:
            node_id: str. The node id to be validated.
        """
        if not isinstance(node_id, str):
            raise utils.ValidationError(
                'Expected node ID to be a string, received %s' %
                node_id)
        pattern = re.compile('%s[0-9]+' % NODE_ID_PREFIX)
        if not pattern.match(node_id):
            raise utils.ValidationError(
                'Invalid node_id: %s' % node_id)

    @classmethod
    def require_valid_thumbnail_filename(cls, thumbnail_filename: str) -> None:
        """Checks whether the thumbnail filename of the node is a valid
            one.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
        """
        utils.require_valid_thumbnail_filename(thumbnail_filename)

    @classmethod
    def require_valid_thumbnail_bg_color(cls, thumbnail_bg_color: str) -> bool:
        """Checks whether the thumbnail background color of the story node is a
            valid one.

        Args:
            thumbnail_bg_color: str. The thumbnail background color to
                validate.

        Returns:
            bool. Whether the thumbnail background color is valid or not.
        """
        return thumbnail_bg_color in constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'chapter']

    @classmethod
    def require_valid_status(cls, status: str) -> bool:
        """Checks whether the status of the story node is valid.

        Args:
            status: str. The status to validate.

        Returns:
            bool. Whether the status is valid or not.
        """
        return status in constants.ALLOWED_STORY_NODE_STATUS

    @classmethod
    def require_valid_unpublishing_reason(
        cls, unpublishing_reason: str) -> bool:
        """Checks whether the unpublishing reason of the story node is valid.

        Args:
            unpublishing_reason: str. The unpublishing reason to validate.

        Returns:
            bool. Whether the unpublishing reason is valid or not.
        """
        return unpublishing_reason in (
            constants.ALLOWED_STORY_NODE_UNPUBLISHING_REASONS)

    def to_dict(self) -> StoryNodeDict:
        """Returns a dict representing this StoryNode domain object.

        Returns:
            dict. A dict, mapping all fields of StoryNode instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'thumbnail_size_in_bytes': self.thumbnail_size_in_bytes,
            'destination_node_ids': self.destination_node_ids,
            'acquired_skill_ids': self.acquired_skill_ids,
            'prerequisite_skill_ids': self.prerequisite_skill_ids,
            'outline': self.outline,
            'outline_is_finalized': self.outline_is_finalized,
            'exploration_id': self.exploration_id,
            'status': self.status,
            'planned_publication_date_msecs': utils.get_time_in_millisecs(
                self.planned_publication_date) if self.planned_publication_date
                else None,
            'last_modified_msecs': utils.get_time_in_millisecs(
                self.last_modified) if self.last_modified else None,
            'first_publication_date_msecs': utils.get_time_in_millisecs(
                self.first_publication_date) if self.first_publication_date
                else None,
            'unpublishing_reason': self.unpublishing_reason
        }

    @classmethod
    def from_dict(cls, node_dict: StoryNodeDict) -> StoryNode:
        """Return a StoryNode domain object from a dict.

        Args:
            node_dict: dict. The dict representation of StoryNode object.

        Returns:
            StoryNode. The corresponding StoryNode domain object.
        """
        planned_publication_date_msecs = (
            node_dict['planned_publication_date_msecs'] if
            'planned_publication_date_msecs' in node_dict and
            node_dict['planned_publication_date_msecs'] else None)
        last_modified_msecs = (
                node_dict['last_modified_msecs'] if
                'last_modified_msecs' in node_dict and
                node_dict['last_modified_msecs'] else None)
        first_publication_date_msecs = (
                node_dict['first_publication_date_msecs'] if
                'first_publication_date_msecs' in node_dict and
                node_dict['first_publication_date_msecs'] else None)
        node = cls(
            node_dict['id'],
            node_dict['title'],
            node_dict['description'],
            node_dict['thumbnail_filename'],
            node_dict['thumbnail_bg_color'],
            node_dict['thumbnail_size_in_bytes'],
            node_dict['destination_node_ids'],
            node_dict['acquired_skill_ids'],
            node_dict['prerequisite_skill_ids'],
            node_dict['outline'],
            node_dict['outline_is_finalized'],
            node_dict['exploration_id'],
            node_dict['status'] if 'status' in node_dict else None,
            utils.convert_millisecs_time_to_datetime_object(
                planned_publication_date_msecs) if
                planned_publication_date_msecs else None,
            utils.convert_millisecs_time_to_datetime_object(
                last_modified_msecs) if
                last_modified_msecs else None,
            utils.convert_millisecs_time_to_datetime_object(
                first_publication_date_msecs) if
                first_publication_date_msecs else None,
            node_dict['unpublishing_reason'] if
            'unpublishing_reason' in node_dict else None
        )
        return node

    @classmethod
    def create_default_story_node(cls, node_id: str, title: str) -> StoryNode:
        """Returns a StoryNode domain object with default values.

        Args:
            node_id: str. The id of the node.
            title: str. The title of the node.

        Returns:
            StoryNode. The StoryNode domain object with default
            value.
        """
        return cls(
            node_id, title, '', None, None, None,
            [], [], [], '', False, None, 'Draft', None,
            None, None, None)

    def validate(self) -> None:
        """Validates various properties of the story node.

        Raises:
            ValidationError. One or more attributes of the story node are
                invalid.
        """
        if self.exploration_id:
            if not isinstance(self.exploration_id, str):
                raise utils.ValidationError(
                    'Expected exploration ID to be a string, received %s' %
                    self.exploration_id)
        if self.thumbnail_filename is not None:
            self.require_valid_thumbnail_filename(self.thumbnail_filename)
        if self.thumbnail_bg_color is not None and not (
                self.require_valid_thumbnail_bg_color(self.thumbnail_bg_color)):
            raise utils.ValidationError(
                'Chapter thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Chapter thumbnail image is not provided.')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Chapter thumbnail background color is not specified.')
        if self.thumbnail_filename is not None and (
                self.thumbnail_size_in_bytes == 0):
            raise utils.ValidationError(
                'Story node thumbnail size in bytes cannot be zero.')
        if self.exploration_id == '':
            raise utils.ValidationError(
                'Expected exploration ID to not be an empty string, '
                'received %s' % self.exploration_id)

        if not isinstance(self.outline, str):
            raise utils.ValidationError(
                'Expected outline to be a string, received %s' %
                self.outline)

        if not isinstance(self.title, str):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' %
                self.title)

        if not isinstance(self.description, str):
            raise utils.ValidationError(
                'Expected description to be a string, received %s' %
                self.description)

        description_length_limit = (
            android_validation_constants.MAX_CHARS_IN_CHAPTER_DESCRIPTION)
        if len(self.description) > description_length_limit:
            raise utils.ValidationError(
                'Chapter description should be less than %d chars, received %s'
                % (description_length_limit, self.description))

        title_limit = (
            android_validation_constants.MAX_CHARS_IN_EXPLORATION_TITLE)
        if len(self.title) > title_limit:
            raise utils.ValidationError(
                'Chapter title should be less than %d chars, received %s'
                % (title_limit, self.title))

        if not isinstance(self.outline_is_finalized, bool):
            raise utils.ValidationError(
                'Expected outline_is_finalized to be a boolean, received %s' %
                self.outline_is_finalized)

        self.require_valid_node_id(self.id)

        if not isinstance(self.prerequisite_skill_ids, list):
            raise utils.ValidationError(
                'Expected prerequisite skill ids to be a list, received %s' %
                self.prerequisite_skill_ids)
        for skill_id in self.prerequisite_skill_ids:
            if not isinstance(skill_id, str):
                raise utils.ValidationError(
                    'Expected each prerequisite skill id to be a string, '
                    'received %s' % skill_id)
        if (
                len(self.prerequisite_skill_ids) >
                len(set(self.prerequisite_skill_ids))):
            raise utils.ValidationError(
                'Expected all prerequisite skills to be distinct.')

        if not isinstance(self.acquired_skill_ids, list):
            raise utils.ValidationError(
                'Expected acquired skill ids to be a list, received %s' %
                self.acquired_skill_ids)
        for skill_id in self.acquired_skill_ids:
            if not isinstance(skill_id, str):
                raise utils.ValidationError(
                    'Expected each acquired skill id to be a string, '
                    'received %s' % skill_id)
        if (
                len(self.acquired_skill_ids) >
                len(set(self.acquired_skill_ids))):
            raise utils.ValidationError(
                'Expected all acquired skills to be distinct.')

        for skill_id in self.prerequisite_skill_ids:
            if skill_id in self.acquired_skill_ids:
                raise utils.ValidationError(
                    'Expected prerequisite skill ids and acquired skill ids '
                    'to be mutually exclusive. The skill_id %s intersects '
                    % skill_id)

        if not isinstance(self.destination_node_ids, list):
            raise utils.ValidationError(
                'Expected destination node ids to be a list, received %s' %
                self.destination_node_ids)

        for node_id in self.destination_node_ids:
            self.require_valid_node_id(node_id)
            if node_id == self.id:
                raise utils.ValidationError(
                    'The story node with ID %s points to itself.' % node_id)

        if self.status:
            if not isinstance(self.status, str):
                raise utils.ValidationError(
                    'Expected status to be a string, received %s' %
                    self.status)
            if not self.require_valid_status(self.status):
                raise utils.ValidationError(
                    'Chapter status cannot be %s ' % self.status)

        if self.planned_publication_date and (
            not isinstance(self.planned_publication_date, datetime.datetime)):
            raise utils.ValidationError(
                'Expected planned publication date to be a datetime, '
                'received %s' % self.planned_publication_date)

        if self.last_modified and (
            not isinstance(self.last_modified, datetime.datetime)):
            raise utils.ValidationError(
                'Expected last modified to be a datetime, '
                'received %s' % self.last_modified)

        if self.first_publication_date and (
            not isinstance(self.first_publication_date, datetime.datetime)):
            raise utils.ValidationError(
                'Expected first publication date to be a datetime, '
                'received %s' % self.first_publication_date)

        if self.unpublishing_reason:
            if not isinstance(self.unpublishing_reason, str):
                raise utils.ValidationError(
                    'Expected unpublishing reason to be string, received %s' %
                    self.unpublishing_reason)
            if not self.require_valid_unpublishing_reason(
                self.unpublishing_reason):
                raise utils.ValidationError(
                    'Chapter unpublishing reason cannot be %s ' %
                    self.unpublishing_reason)

    def is_node_upcoming(self) -> bool:
        """Return whether the StoryNode domain object is expected to be
        published within the next CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS
        days.

        Returns:
            bool. True if the chapter is upcoming else false.
        """
        current_time_msecs = utils.get_current_time_in_millisecs()
        planned_publication_date_msecs = (
            utils.get_time_in_millisecs(self.planned_publication_date) if
            self.planned_publication_date else None)
        if (
            self.status != constants.STORY_NODE_STATUS_PUBLISHED and
            planned_publication_date_msecs is not None and
            current_time_msecs < planned_publication_date_msecs <
            current_time_msecs + (
                constants.
                    CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS) *
                    24 * 3600 * 1000):
            return True
        return False

    def is_node_behind_schedule(self) -> bool:
        """Return whether StoryNode domain object is behind-schedule
        from the planned publication date.

        Returns:
            bool. True if the chapter is behind-schedule else false.
        """
        current_time_msecs = utils.get_current_time_in_millisecs()
        planned_publication_date_msecs = (
            utils.get_time_in_millisecs(self.planned_publication_date) if
            self.planned_publication_date else None)
        if (
            self.status != constants.STORY_NODE_STATUS_PUBLISHED and
            planned_publication_date_msecs is not None and
            current_time_msecs > planned_publication_date_msecs):
            return True
        return False


class StoryContentsDict(TypedDict):
    """Dictionary representing the StoryContents object."""

    nodes: List[StoryNodeDict]
    initial_node_id: Optional[str]
    next_node_id: str


class StoryContents:
    """Domain object representing the story_contents dict."""

    def __init__(
        self,
        story_nodes: List[StoryNode],
        initial_node_id: Optional[str],
        next_node_id: str
    ) -> None:
        """Constructs a StoryContents domain object.

        Args:
            story_nodes: list(StoryNode). The list of story nodes that are part
                of this story.
            initial_node_id: Optional[str]. The id of the starting node of the
                story and None if there is only one node(or the starting node).
            next_node_id: str. The id for the next node to be added to the
                story.
        """
        self.initial_node_id = initial_node_id
        self.nodes = story_nodes
        self.next_node_id = next_node_id

    def validate(self) -> None:
        """Validates various properties of the story contents object.

        Raises:
            ValidationError. One or more attributes of the story contents are
                invalid.
        """
        if not isinstance(self.nodes, list):
            raise utils.ValidationError(
                'Expected nodes field to be a list, received %s' % self.nodes)

        if len(self.nodes) > 0:
            # Ruling out the possibility of None for mypy type checking.
            assert self.initial_node_id is not None
            StoryNode.require_valid_node_id(self.initial_node_id)
        StoryNode.require_valid_node_id(self.next_node_id)

        initial_node_is_present = False
        node_id_list = []
        node_title_list = []

        for node in self.nodes:
            if not isinstance(node, StoryNode):
                raise utils.ValidationError(
                    'Expected each node to be a StoryNode object, received %s' %
                    node)
            node.validate()
            for destination_node_id in node.destination_node_ids:
                if next((
                        node for node in self.nodes
                        if node.id == destination_node_id), None) is None:
                    raise utils.ValidationError(
                        'Expected all destination nodes to exist')
            if node.id == self.initial_node_id:
                initial_node_is_present = True
            # Checks whether the number in the id of any node is greater than
            # the value of next_node_id.
            if (StoryNode.get_number_from_node_id(node.id) >=
                    StoryNode.get_number_from_node_id(self.next_node_id)):
                raise utils.ValidationError(
                    'The node with id %s is out of bounds.' % node.id)
            node_id_list.append(node.id)
            node_title_list.append(node.title)

        if len(self.nodes) > 0:
            if not initial_node_is_present:
                raise utils.ValidationError('Expected starting node to exist.')

            if len(node_id_list) > len(set(node_id_list)):
                raise utils.ValidationError(
                    'Expected all node ids to be distinct.')

            if len(node_title_list) > len(set(node_title_list)):
                raise utils.ValidationError(
                    'Expected all chapter titles to be distinct.')

    @overload
    def get_node_index(
        self, node_id: str,
    ) -> int: ...

    @overload
    def get_node_index(
        self, node_id: str, *, strict: Literal[True]
    ) -> int: ...

    @overload
    def get_node_index(
        self, node_id: str, *, strict: Literal[False]
    ) -> Optional[int]: ...

    @overload
    def get_node_index(
        self, node_id: str, *, strict: bool = ...
    ) -> Optional[int]: ...

    def get_node_index(
        self,
        node_id: str,
        strict: bool = True
    ) -> Optional[int]:
        """Returns the index of the story node with the given node
        id, or None if the node id is not in the story contents dict.

        Args:
            node_id: str. The id of the node.
            strict: bool. Whether to fail noisily if no node with the given
                node_id exists. Default is True.

        Returns:
            int or None. The index of the corresponding node, or None if there
            is no such node and strict == False.

        Raises:
            ValueError. If the node id is not in the story contents dict.
        """
        index: Optional[int] = None
        for ind, node in enumerate(self.nodes):
            if node.id == node_id:
                index = ind
        if strict and index is None:
            raise ValueError(
                'The node with id %s is not part of this story.' % node_id)
        return index

    def get_ordered_nodes(self) -> List[StoryNode]:
        """Returns a list of nodes ordered by how they would appear sequentially
        to a learner.

        NOTE: Currently, this function assumes only a linear arrangement of
        nodes.

        Returns:
            list(StoryNode). The ordered list of nodes.
        """
        if len(self.nodes) == 0:
            return []
        # Ruling out the possibility of None for mypy type checking.
        assert self.initial_node_id is not None
        initial_index = self.get_node_index(self.initial_node_id)
        current_node = self.nodes[initial_index]
        ordered_nodes_list = [current_node]
        while current_node.destination_node_ids:
            next_node_id = current_node.destination_node_ids[0]
            next_index = self.get_node_index(next_node_id)
            current_node = self.nodes[next_index]
            ordered_nodes_list.append(current_node)
        return ordered_nodes_list

    def get_all_linked_exp_ids(self) -> List[str]:
        """Returns a list of exploration id linked to each of the nodes of
        story content.

        Returns:
            list(str). A list of exploration ids.
        """
        exp_ids = []
        for node in self.nodes:
            if node.exploration_id is not None:
                exp_ids.append(node.exploration_id)
        return exp_ids

    def get_node_with_corresponding_exp_id(self, exp_id: str) -> StoryNode:
        """Returns the node object which corresponds to a given exploration ids.

        Returns:
            StoryNode. The StoryNode object of the corresponding exploration id
            if exist.

        Raises:
            Exception. Unable to find the exploration in any node.
        """
        for node in self.nodes:
            if node.exploration_id == exp_id:
                return node

        raise Exception('Unable to find the exploration id in any node: %s' % (
            exp_id))

    def to_dict(self) -> StoryContentsDict:
        """Returns a dict representing this StoryContents domain object.

        Returns:
            dict. A dict, mapping all fields of StoryContents instance.
        """
        return {
            'nodes': [
                node.to_dict() for node in self.nodes
            ],
            'initial_node_id': self.initial_node_id,
            'next_node_id': self.next_node_id
        }

    @classmethod
    def from_dict(
        cls, story_contents_dict: StoryContentsDict
    ) -> StoryContents:
        """Return a StoryContents domain object from a dict.

        Args:
            story_contents_dict: dict. The dict representation of
                StoryContents object.

        Returns:
            StoryContents. The corresponding StoryContents domain object.
        """
        story_contents = cls(
            [
                StoryNode.from_dict(story_node_dict)
                for story_node_dict in story_contents_dict['nodes']
            ],
            story_contents_dict['initial_node_id'],
            story_contents_dict['next_node_id']
        )

        return story_contents


class StoryDict(TypedDict):
    """Dictionary representing the Story object."""

    id: str
    title: str
    thumbnail_filename: Optional[str]
    thumbnail_bg_color: Optional[str]
    thumbnail_size_in_bytes: Optional[int]
    description: str
    notes: str
    story_contents: StoryContentsDict
    story_contents_schema_version: int
    language_code: str
    corresponding_topic_id: str
    version: int
    url_fragment: str
    meta_tag_content: str


class SerializableStoryDict(StoryDict):
    """Dictionary representing the serializable Story object."""

    created_on: str
    last_updated: str


class VersionedStoryContentsDict(TypedDict):
    """Dictionary representing the versioned StoryContents object."""

    schema_version: int
    story_contents: StoryContentsDict


class Story:
    """Domain object for an Oppia Story."""

    def __init__(
        self,
        story_id: str,
        title: str,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_size_in_bytes: Optional[int],
        description: str,
        notes: str,
        story_contents: StoryContents,
        story_contents_schema_version: int,
        language_code: str,
        corresponding_topic_id: str,
        version: int,
        url_fragment: str,
        meta_tag_content: str,
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a Story domain object.

        Args:
            story_id: str. The unique ID of the story.
            title: str. The title of the story.
            description: str. The high level description of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting. To be provided in html form.
            story_contents: StoryContents. The StoryContents instance
                representing the contents (like nodes) that are part of the
                story.
            story_contents_schema_version: int. The schema version for the
                story contents object.
            language_code: str. The ISO 639-1 code for the language this
                story is written in.
            corresponding_topic_id: str. The id of the topic to which the story
                belongs.
            version: int. The version of the story.
            created_on: datetime.datetime. Date and time when the story is
                created.
            last_updated: datetime.datetime. Date and time when the
                story was last updated.
            thumbnail_filename: str|None. The thumbnail filename of the story.
            thumbnail_bg_color: str|None. The thumbnail background color of
                the story.
            thumbnail_size_in_bytes: int|None. The size of thumbnail in bytes.
            url_fragment: str. The url fragment for the story.
            meta_tag_content: str. The meta tag content in the topic viewer
                page.
        """
        self.id = story_id
        self.title = title
        self.thumbnail_filename = thumbnail_filename
        self.thumbnail_bg_color = thumbnail_bg_color
        self.thumbnail_size_in_bytes = thumbnail_size_in_bytes
        self.description = description
        self.notes = html_cleaner.clean(notes)
        self.story_contents = story_contents
        self.story_contents_schema_version = story_contents_schema_version
        self.language_code = language_code
        self.corresponding_topic_id = corresponding_topic_id
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version
        self.url_fragment = url_fragment
        self.meta_tag_content = meta_tag_content

    @classmethod
    def require_valid_description(cls, description: str) -> None:
        """Checks whether the description is a valid string.

        Args:
            description: str. The description to be checked.

        Raises:
            ValidationError. The description is not a valid string.
        """
        if not isinstance(description, str):
            raise utils.ValidationError(
                'Expected description to be a string, received %s'
                % description)
        if description == '':
            raise utils.ValidationError(
                'Expected description field not to be empty')

        description_length_limit = (
            android_validation_constants.MAX_CHARS_IN_STORY_DESCRIPTION)
        if len(description) > description_length_limit:
            raise utils.ValidationError(
                'Expected description to be less than %d chars, received %s'
                % (description_length_limit, len(description)))

    @classmethod
    def require_valid_thumbnail_filename(cls, thumbnail_filename: str) -> None:
        """Checks whether the thumbnail filename of the story is a valid
            one.

        Args:
            thumbnail_filename: str. The thumbnail filename to validate.
        """
        utils.require_valid_thumbnail_filename(thumbnail_filename)

    @classmethod
    def require_valid_thumbnail_bg_color(cls, thumbnail_bg_color: str) -> bool:
        """Checks whether the thumbnail background color of the story is a
            valid one.

        Args:
            thumbnail_bg_color: str. The thumbnail background color to
                validate.

        Returns:
            bool. Whether the thumbnail background color is valid or not.
        """
        return thumbnail_bg_color in constants.ALLOWED_THUMBNAIL_BG_COLORS[
            'story']

    def validate(self) -> None:
        """Validates various properties of the story object.

        Raises:
            ValidationError. One or more attributes of story are invalid.
        """
        self.require_valid_title(self.title)
        self.require_valid_description(self.description)
        assert self.url_fragment is not None
        utils.require_valid_url_fragment(
            self.url_fragment, 'Story Url Fragment',
            constants.MAX_CHARS_IN_STORY_URL_FRAGMENT)
        utils.require_valid_meta_tag_content(self.meta_tag_content)
        if self.thumbnail_filename is not None:
            self.require_valid_thumbnail_filename(self.thumbnail_filename)
        if self.thumbnail_bg_color is not None and not (
                self.require_valid_thumbnail_bg_color(self.thumbnail_bg_color)):
            raise utils.ValidationError(
                'Story thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Story thumbnail image is not provided.')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Story thumbnail background color is not specified.')
        if not isinstance(self.notes, str):
            raise utils.ValidationError(
                'Expected notes to be a string, received %s' % self.notes)

        if not isinstance(self.story_contents_schema_version, int):
            raise utils.ValidationError(
                'Expected story contents schema version to be an integer, '
                'received %s' % self.story_contents_schema_version)

        if (self.story_contents_schema_version !=
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected story contents schema version to be %s, '
                'received %s' % (
                    feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
                    self.story_contents_schema_version))

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.corresponding_topic_id, str):
            raise utils.ValidationError(
                'Expected corresponding_topic_id should be a string, received: '
                '%s' % self.corresponding_topic_id)

        self.story_contents.validate()

    @classmethod
    def require_valid_story_id(cls, story_id: str) -> None:
        """Checks whether the story id is a valid one.

        Args:
            story_id: str. The story id to validate.
        """
        if not isinstance(story_id, str):
            raise utils.ValidationError(
                'Story id should be a string, received: %s' % story_id)

        if len(story_id) != constants.STORY_ID_LENGTH:
            raise utils.ValidationError('Invalid story id.')

    @classmethod
    def require_valid_title(cls, title: str) -> None:
        """Checks whether the story title is a valid one.

        Args:
            title: str. The title to validate.
        """

        if not isinstance(title, str):
            raise utils.ValidationError('Title should be a string.')
        if title == '':
            raise utils.ValidationError('Title field should not be empty')

        title_limit = android_validation_constants.MAX_CHARS_IN_STORY_TITLE
        if len(title) > title_limit:
            raise utils.ValidationError(
                'Story title should be less than %d chars, received %s'
                % (title_limit, title))

    def get_acquired_skill_ids_for_node_ids(
        self, node_ids: List[str]
    ) -> List[str]:
        """Returns the acquired skill ids of the nodes having the given
        node ids.

        Args:
            node_ids: list(str). The list of IDs of the nodes inside
                the story.

        Returns:
            list(str). The union of the acquired skill IDs corresponding to
            each of the node IDs.
        """
        acquired_skill_ids = []
        for node in self.story_contents.nodes:
            if node.id in node_ids:
                for skill_id in node.acquired_skill_ids:
                    if skill_id not in acquired_skill_ids:
                        acquired_skill_ids.append(skill_id)
        return acquired_skill_ids

    def get_prerequisite_skill_ids_for_exp_id(
        self, exp_id: str
    ) -> Optional[List[str]]:
        """Returns the prerequisite skill ids of the node having the given
        exploration id.

        Args:
            exp_id: str. The ID of the exploration linked to the story.

        Returns:
            list(str)|None. The list of prerequisite skill ids for the
            exploration or None, if no node is linked to it.
        """
        for node in self.story_contents.nodes:
            if node.exploration_id == exp_id:
                return node.prerequisite_skill_ids
        return None

    def has_exploration(self, exp_id: str) -> bool:
        """Checks whether an exploration is present in the story.

        Args:
            exp_id: str. The ID of the exploration linked to the story.

        Returns:
            bool. Whether the exploration is linked to the story.
        """
        for node in self.story_contents.nodes:
            if node.exploration_id == exp_id:
                return True
        return False

    def to_dict(self) -> StoryDict:
        """Returns a dict representing this Story domain object.

        Returns:
            dict. A dict, mapping all fields of Story instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'notes': self.notes,
            'language_code': self.language_code,
            'story_contents_schema_version': self.story_contents_schema_version,
            'corresponding_topic_id': self.corresponding_topic_id,
            'version': self.version,
            'story_contents': self.story_contents.to_dict(),
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'thumbnail_size_in_bytes': self.thumbnail_size_in_bytes,
            'url_fragment': self.url_fragment,
            'meta_tag_content': self.meta_tag_content
        }

    @classmethod
    def deserialize(cls, json_string: str) -> Story:
        """Returns a Story domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a Story.
                Only call on strings that were created using serialize().

        Returns:
            Story. The corresponding Story domain object.
        """
        story_dict = json.loads(json_string)
        created_on = (
            utils.convert_string_to_naive_datetime_object(
                story_dict['created_on'])
            if 'created_on' in story_dict else None)
        last_updated = (
            utils.convert_string_to_naive_datetime_object(
                story_dict['last_updated'])
            if 'last_updated' in story_dict else None)

        story = cls.from_dict(
            story_dict,
            story_version=story_dict['version'],
            story_created_on=created_on,
            story_last_updated=last_updated)

        return story

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded str encoding all of the information composing
            the object.
        """
        # Here we use MyPy ignore because to_dict() method returns a general
        # dictionary representation of domain object (StoryDict) which does not
        # contain properties like created_on and last_updated but MyPy expecting
        # story_dict, a dictionary which contain all the properties of domain
        # object. That's why we explicitly changing the type of story_dict,
        # here which causes MyPy to throw an error. Thus, to silence the error,
        # we added an ignore here.
        story_dict: SerializableStoryDict = self.to_dict()  # type: ignore[assignment]
        # The only reason we add the version parameter separately is that our
        # yaml encoding/decoding of this object does not handle the version
        # parameter.
        # NOTE: If this changes in the future (i.e the version parameter is
        # added as part of the yaml representation of this object), all YAML
        # files must add a version parameter to their files with the correct
        # version of this object. The line below must then be moved to
        # to_dict().
        story_dict['version'] = self.version

        if self.created_on:
            story_dict['created_on'] = utils.convert_naive_datetime_to_string(
                self.created_on)

        if self.last_updated:
            story_dict['last_updated'] = utils.convert_naive_datetime_to_string(
                self.last_updated)

        return json.dumps(story_dict)

    @classmethod
    def from_dict(
        cls,
        story_dict: StoryDict,
        story_version: int = 0,
        story_created_on: Optional[datetime.datetime] = None,
        story_last_updated: Optional[datetime.datetime] = None
    ) -> Story:
        """Returns a Story domain object from a dictionary.

        Args:
            story_dict: dict. The dictionary representation of story
                object.
            story_version: int. The version of the story.
            story_created_on: datetime.datetime. Date and time when the
                story is created.
            story_last_updated: datetime.datetime. Date and time when the
                story was last updated.

        Returns:
            Story. The corresponding Story domain object.
        """
        story = cls(
            story_dict['id'],
            story_dict['title'],
            story_dict['thumbnail_filename'],
            story_dict['thumbnail_bg_color'],
            story_dict['thumbnail_size_in_bytes'],
            story_dict['description'],
            story_dict['notes'],
            StoryContents.from_dict(story_dict['story_contents']),
            story_dict['story_contents_schema_version'],
            story_dict['language_code'],
            story_dict['corresponding_topic_id'],
            story_version,
            story_dict['url_fragment'],
            story_dict['meta_tag_content'],
            story_created_on,
            story_last_updated
        )

        return story

    @classmethod
    def create_default_story(
        cls,
        story_id: str,
        title: str,
        description: str,
        corresponding_topic_id: str,
        url_fragment: str
    ) -> Story:
        """Returns a story domain object with default values. This is for
        the frontend where a default blank story would be shown to the user
        when the story is created for the first time.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title for the newly created story.
            description: str. The high level description of the story.
            corresponding_topic_id: str. The id of the topic to which the story
                belongs.
            url_fragment: str. The url fragment of the story.

        Returns:
            Story. The Story domain object with the default values.
        """
        # Initial node id for a new story.
        initial_node_id = '%s1' % NODE_ID_PREFIX
        story_contents = StoryContents([], None, initial_node_id)
        return cls(
            story_id, title, None, None, None, description,
            feconf.DEFAULT_STORY_NOTES, story_contents,
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, corresponding_topic_id, 0,
            url_fragment, '')

    @classmethod
    def _convert_story_contents_v1_dict_to_v2_dict(
        cls, story_contents_dict: StoryContentsDict
    ) -> StoryContentsDict:
        """Converts old Story Contents schema to the modern v2 schema.
        v2 schema introduces the thumbnail_filename and thumbnail_bg_color
        fields for Story Nodes.

        Args:
            story_contents_dict: dict. A dict used to initialize a Story
                Contents domain object.

        Returns:
            dict. The converted story_contents_dict.
        """
        for index in range(len(story_contents_dict['nodes'])):
            story_contents_dict['nodes'][index]['thumbnail_filename'] = None
            story_contents_dict['nodes'][index]['thumbnail_bg_color'] = None
        return story_contents_dict

    @classmethod
    def _convert_story_contents_v2_dict_to_v3_dict(
        cls, story_contents_dict: StoryContentsDict
    ) -> StoryContentsDict:
        """Converts v2 Story Contents schema to the v3 schema.
        v3 schema introduces the description field for Story Nodes.

        Args:
            story_contents_dict: dict. A dict used to initialize a Story
                Contents domain object.

        Returns:
            dict. The converted story_contents_dict.
        """
        for node in story_contents_dict['nodes']:
            node['description'] = ''
        return story_contents_dict

    @classmethod
    def _convert_story_contents_v3_dict_to_v4_dict(
        cls, story_contents_dict: StoryContentsDict
    ) -> StoryContentsDict:
        """Converts v3 Story Contents schema to the v4 schema.
        v4 schema introduces the new schema for Math components.

        Args:
            story_contents_dict: dict. A dict used to initialize a Story
                Contents domain object.

        Returns:
            dict. The converted story_contents_dict.
        """
        for node in story_contents_dict['nodes']:
            node['outline'] = (
                html_validation_service.add_math_content_to_math_rte_components(
                    node['outline']
                )
            )
        return story_contents_dict

    @classmethod
    def _convert_story_contents_v4_dict_to_v5_dict(
        cls,
        story_id: str,
        story_contents_dict: StoryContentsDict
    ) -> StoryContentsDict:
        """Converts v4 Story Contents schema to the modern v5 schema.
        v5 schema introduces the thumbnail_size_in_bytes for Story Nodes.

        Args:
            story_id: str. The unique ID of the story.
            story_contents_dict: dict. A dict used to initialize a Story
                Contents domain object.

        Returns:
            dict. The converted story_contents_dict.
        """
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, story_id)
        for index in range(len(story_contents_dict['nodes'])):
            filepath = '%s/%s' % (
                constants.ASSET_TYPE_THUMBNAIL,
                story_contents_dict['nodes'][index]['thumbnail_filename'])
            story_contents_dict['nodes'][index]['thumbnail_size_in_bytes'] = (
                len(fs.get(filepath)) if fs.isfile(filepath) else None)
        return story_contents_dict

    @classmethod
    def update_story_contents_from_model(
        cls,
        versioned_story_contents: VersionedStoryContentsDict,
        current_version: int,
        story_id: str
    ) -> None:
        """Converts the story_contents blob contained in the given
        versioned_story_contents dict from current_version to
        current_version + 1. Note that the versioned_story_contents being
        passed in is modified in-place.

        Args:
            versioned_story_contents: dict. A dict with two keys:
                - schema_version: int. The schema version for the
                    story_contents dict.
                - story_contents: dict. The dict comprising the story
                    contents.
            current_version: int. The current schema version of story_contents.
            story_id: str. The unique ID of the story.
        """
        versioned_story_contents['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_story_contents_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))

        if current_version == 4:
            conversion_fn = functools.partial(conversion_fn, story_id)

        versioned_story_contents['story_contents'] = conversion_fn(
            versioned_story_contents['story_contents'])

    def update_title(self, title: str) -> None:
        """Updates the title of the story.

        Args:
            title: str. The new title of the story.
        """
        self.title = title

    def update_thumbnail_filename(
        self, new_thumbnail_filename: Optional[str]
    ) -> None:
        """Updates the thumbnail filename and file size of the story.

        Args:
            new_thumbnail_filename: str|None. The new thumbnail filename of the
                story.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
        """
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, self.id)

        filepath = '%s/%s' % (
            constants.ASSET_TYPE_THUMBNAIL, new_thumbnail_filename)
        if fs.isfile(filepath):
            self.thumbnail_filename = new_thumbnail_filename
            self.thumbnail_size_in_bytes = len(fs.get(filepath))
        else:
            raise Exception(
                'The thumbnail %s for story with id %s does not exist'
                ' in the filesystem.' % (new_thumbnail_filename, self.id))

    def update_thumbnail_bg_color(
        self, thumbnail_bg_color: Optional[str]
    ) -> None:
        """Updates the thumbnail background color of the story.

        Args:
            thumbnail_bg_color: str|None. The new thumbnail background color of
                the story.
        """
        self.thumbnail_bg_color = thumbnail_bg_color

    def update_description(self, description: str) -> None:
        """Updates the description of the story.

        Args:
            description: str. The new description of the story.
        """
        self.description = description

    def update_notes(self, notes: str) -> None:
        """Updates the notes of the story.

        Args:
            notes: str. The new notes of the story.
        """
        self.notes = notes

    def update_language_code(self, language_code: str) -> None:
        """Updates the language code of the story.

        Args:
            language_code: str. The new language code of the story.
        """
        self.language_code = language_code

    def update_url_fragment(self, url_fragment: str) -> None:
        """Updates the url fragment of the story.

        Args:
            url_fragment: str. The new url fragment of the story.
        """
        self.url_fragment = url_fragment

    def update_meta_tag_content(self, new_meta_tag_content: str) -> None:
        """Updates the meta tag content of the story.

        Args:
            new_meta_tag_content: str. The updated meta tag content for the
                story.
        """
        self.meta_tag_content = new_meta_tag_content

    def add_node(self, desired_node_id: str, node_title: str) -> None:
        """Adds a new default node with the id as story_contents.next_node_id.

        Args:
            desired_node_id: str. The node id to be given to the new node in the
                story.
            node_title: str. The title for the new story node.

        Raises:
            Exception. The desired_node_id differs from
                story_contents.next_node_id.
        """
        if self.story_contents.next_node_id != desired_node_id:
            raise Exception(
                'The node id %s does not match the expected '
                'next node id for the story.' % desired_node_id)
        self.story_contents.nodes.append(
            StoryNode.create_default_story_node(desired_node_id, node_title))
        self.story_contents.next_node_id = (
            StoryNode.get_incremented_node_id(self.story_contents.next_node_id))
        if self.story_contents.initial_node_id is None:
            self.story_contents.initial_node_id = desired_node_id

    def _check_exploration_id_already_present(
        self, exploration_id: str
    ) -> bool:
        """Returns whether a node with the given exploration id is already
        present in story_contents.

        Args:
            exploration_id: str. The id of the exploration.

        Returns:
            bool. Whether a node with the given exploration ID is already
            present.
        """
        for node in self.story_contents.nodes:
            if node.exploration_id == exploration_id:
                return True
        return False

    def delete_node(self, node_id: str) -> None:
        """Deletes a node with the given node_id.

        Args:
            node_id: str. The id of the node.

        Raises:
            ValueError. The node is the starting node for story, change the
                starting node before deleting it.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_id == self.story_contents.initial_node_id:
            if len(self.story_contents.nodes) == 1:
                self.story_contents.initial_node_id = None
            else:
                raise ValueError(
                    'The node with id %s is the starting node for the story, '
                    'change the starting node before deleting it.' % node_id)
        for node in self.story_contents.nodes:
            if node_id in node.destination_node_ids:
                node.destination_node_ids.remove(node_id)
        del self.story_contents.nodes[node_index]

    def update_node_outline(self, node_id: str, new_outline: str) -> None:
        """Updates the outline field of a given node.

        Args:
            node_id: str. The id of the node.
            new_outline: str. The new outline of the given node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].outline = new_outline

    def update_node_title(self, node_id: str, new_title: str) -> None:
        """Updates the title field of a given node.

        Args:
            node_id: str. The id of the node.
            new_title: str. The new title of the given node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].title = new_title

    def update_node_description(
        self,
        node_id: str,
        new_description: str
    ) -> None:
        """Updates the description field of a given node.

        Args:
            node_id: str. The id of the node.
            new_description: str. The new description of the given node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].description = new_description

    def update_node_thumbnail_filename(
        self,
        node_id: str,
        new_thumbnail_filename: Optional[str]
    ) -> None:
        """Updates the thumbnail filename and file size field of a given node.

        Args:
            node_id: str. The id of the node.
            new_thumbnail_filename: str|None. The new thumbnail filename of the
                given node.

        Raises:
            Exception. The node with the given id doesn't exist.
        """
        node_index = self.story_contents.get_node_index(node_id)
        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, self.id)

        filepath = '%s/%s' % (
            constants.ASSET_TYPE_THUMBNAIL, new_thumbnail_filename)
        if fs.isfile(filepath):
            self.story_contents.nodes[node_index].thumbnail_filename = (
                new_thumbnail_filename)
            self.story_contents.nodes[node_index].thumbnail_size_in_bytes = (
                len(fs.get(filepath)))
        else:
            raise Exception(
                'The thumbnail %s for story node with id %s does not exist'
                ' in the filesystem.' % (new_thumbnail_filename, self.id))

    def update_node_thumbnail_bg_color(
        self,
        node_id: str,
        new_thumbnail_bg_color: Optional[str]
    ) -> None:
        """Updates the thumbnail background color field of a given node.

        Args:
            node_id: str. The id of the node.
            new_thumbnail_bg_color: str|None. The new thumbnail background
                color of the given node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].thumbnail_bg_color = (
            new_thumbnail_bg_color)

    def mark_node_outline_as_finalized(self, node_id: str) -> None:
        """Updates the outline_is_finalized field of the node with the given
        node_id as True.

        Args:
            node_id: str. The id of the node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].outline_is_finalized = True

    def mark_node_outline_as_unfinalized(self, node_id: str) -> None:
        """Updates the outline_is_finalized field of the node with the given
        node_id as False.

        Args:
            node_id: str. The id of the node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].outline_is_finalized = False

    def update_node_acquired_skill_ids(
        self,
        node_id: str,
        new_acquired_skill_ids: List[str]
    ) -> None:
        """Updates the acquired skill ids field of a given node.

        Args:
            node_id: str. The id of the node.
            new_acquired_skill_ids: list(str). The updated acquired skill id
                list.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].acquired_skill_ids = (
            new_acquired_skill_ids)

    def update_node_prerequisite_skill_ids(
        self,
        node_id: str,
        new_prerequisite_skill_ids: List[str]
    ) -> None:
        """Updates the prerequisite skill ids field of a given node.

        Args:
            node_id: str. The id of the node.
            new_prerequisite_skill_ids: list(str). The updated prerequisite
                skill id list.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].prerequisite_skill_ids = (
            new_prerequisite_skill_ids)

    def update_node_status(self, node_id: str, new_status: str) -> None:
        """Updates the status of a given node

        Args:
            node_id: str. The Id of the node.
            new_status: str. The new publication status of the node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].status = new_status

    def update_node_planned_publication_date(
            self, node_id: str,
            new_planned_publication_date_msecs: float) -> None:
        """Updates the planned publication date of a given node

        Args:
            node_id: str. The Id of the node.
            new_planned_publication_date_msecs: float. The planned publication
                date of the node in miliseconds.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].planned_publication_date = (
            utils.convert_millisecs_time_to_datetime_object(
                new_planned_publication_date_msecs) if
                new_planned_publication_date_msecs else None)

    def update_node_last_modified(
            self, node_id: str, new_last_modified_msecs: float) -> None:
        """Updates the last modified of a given node

        Args:
            node_id: str. The Id of the node.
            new_last_modified_msecs: float. The last modified date time
                of the node in miliseconds.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].last_modified = (
            utils.convert_millisecs_time_to_datetime_object(
            new_last_modified_msecs)) if new_last_modified_msecs else None

    def update_node_first_publication_date(
            self, node_id: str, new_publication_date_msecs: float) -> None:
        """Updates the first publication date of a given node.

        Args:
            node_id: str. The Id of the node.
            new_publication_date_msecs: float. The first publication date
                of the node in miliseconds.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].first_publication_date = (
            utils.convert_millisecs_time_to_datetime_object(
                new_publication_date_msecs) if
                new_publication_date_msecs else None)

    def update_node_unpublishing_reason(
            self, node_id: str, new_unpublishing_reason: str) -> None:
        """Updates the unpublishing reason of a given node.

        Args:
            node_id: str. The Id of the node.
            new_unpublishing_reason: str. The reason behind unpublishing
                this node.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].unpublishing_reason = (
            new_unpublishing_reason)

    def update_node_destination_node_ids(
        self,
        node_id: str,
        new_destination_node_ids: List[str]
    ) -> None:
        """Updates the destination_node_ids field of a given node.

        Args:
            node_id: str. The id of the node.
            new_destination_node_ids: list(str). The updated destination
                node id list.
        """
        node_index = self.story_contents.get_node_index(node_id)
        self.story_contents.nodes[node_index].destination_node_ids = (
            new_destination_node_ids)

    def rearrange_node_in_story(self, from_index: int, to_index: int) -> None:
        """Rearranges or moves a node in the story content.

        Args:
            from_index: int. The index of the node to move.
            to_index: int. The index at which to insert the moved node.

        Raises:
            Exception. Invalid input.
        """
        if not isinstance(from_index, int):
            raise Exception(
                'Expected from_index value to be a number, '
                'received %s' % from_index)

        if not isinstance(to_index, int):
            raise Exception(
                'Expected to_index value to be a number, '
                'received %s' % to_index)

        if from_index == to_index:
            raise Exception(
                'Expected from_index and to_index values to be different.')

        story_content_nodes = self.story_contents.nodes
        if from_index >= len(story_content_nodes) or from_index < 0:
            raise Exception('Expected from_index value to be with-in bounds.')

        if to_index >= len(story_content_nodes) or to_index < 0:
            raise Exception('Expected to_index value to be with-in bounds.')

        story_node_to_move = copy.deepcopy(story_content_nodes[from_index])
        del story_content_nodes[from_index]
        story_content_nodes.insert(to_index, story_node_to_move)

    def update_node_exploration_id(
        self, node_id: str, new_exploration_id: str
    ) -> None:
        """Updates the exploration id field of a given node.

        Args:
            node_id: str. The id of the node.
            new_exploration_id: str. The updated exploration id for a node.

        Raises:
            ValueError. A node with given exploration id is already exists.
        """
        node_index = self.story_contents.get_node_index(node_id)

        if (
                self.story_contents.nodes[node_index].exploration_id ==
                new_exploration_id):
            return

        if (
                new_exploration_id is not None and
                self._check_exploration_id_already_present(new_exploration_id)):
            raise ValueError(
                'A node with exploration id %s already exists.' %
                new_exploration_id)
        self.story_contents.nodes[node_index].exploration_id = (
            new_exploration_id)

    def update_initial_node(self, new_initial_node_id: str) -> None:
        """Updates the starting node of the story.

        Args:
            new_initial_node_id: str. The new starting node id.
        """
        self.story_contents.get_node_index(new_initial_node_id)
        self.story_contents.initial_node_id = new_initial_node_id


class HumanReadableStorySummaryDict(TypedDict):
    """Dictionary representing the human readable StorySummary object."""

    id: str
    title: str
    description: str
    node_titles: List[str]
    thumbnail_bg_color: Optional[str]
    thumbnail_filename: Optional[str]
    url_fragment: str


class StorySummaryDict(HumanReadableStorySummaryDict):
    """Dictionary representing the StorySummary object."""

    language_code: str
    version: int
    story_model_created_on: float
    story_model_last_updated: float


class StorySummary:
    """Domain object for Story Summary."""

    def __init__(
        self,
        story_id: str,
        title: str,
        description: str,
        language_code: str,
        version: int,
        node_titles: List[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_filename: Optional[str],
        url_fragment: str,
        story_model_created_on: datetime.datetime,
        story_model_last_updated: datetime.datetime
    ) -> None:
        """Constructs a StorySummary domain object.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title of the story.
            description: str. The description of the story.
            language_code: str. The language code of the story.
            version: int. The version of the story.
            node_titles: list(str). The titles of nodes present in the story.
            thumbnail_bg_color: str|None. The thumbnail background color of the
                story.
            thumbnail_filename: str|None. The thumbnail filename of the story.
            url_fragment: str. The url fragment for the story.
            story_model_created_on: datetime.datetime. Date and time when
                the story model is created.
            story_model_last_updated: datetime.datetime. Date and time
                when the story model was last updated.
        """
        self.id = story_id
        self.title = title
        self.description = description
        self.language_code = language_code
        self.version = version
        self.node_titles = node_titles
        self.thumbnail_bg_color = thumbnail_bg_color
        self.thumbnail_filename = thumbnail_filename
        self.url_fragment = url_fragment
        self.story_model_created_on = story_model_created_on
        self.story_model_last_updated = story_model_last_updated

    def validate(self) -> None:
        """Validates various properties of the story summary object.

        Raises:
            ValidationError. One or more attributes of story summary are
                invalid.
        """
        assert self.url_fragment is not None
        utils.require_valid_url_fragment(
            self.url_fragment, 'Story Url Fragment',
            constants.MAX_CHARS_IN_STORY_URL_FRAGMENT)

        if not isinstance(self.title, str):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)

        if self.title == '':
            raise utils.ValidationError('Title field should not be empty')

        if not isinstance(self.description, str):
            raise utils.ValidationError(
                'Expected description to be a string, received %s'
                % self.description)

        if not isinstance(self.node_titles, list):
            raise utils.ValidationError(
                'Expected node_titles to be a list, received \'%s\'' % (
                    self.node_titles))

        for title in self.node_titles:
            if not isinstance(title, str):
                raise utils.ValidationError(
                    'Expected each chapter title to be a string, received %s'
                    % title)

        if self.thumbnail_filename is not None:
            utils.require_valid_thumbnail_filename(self.thumbnail_filename)
        if (
                self.thumbnail_bg_color is not None and not (
                    Story.require_valid_thumbnail_bg_color(
                        self.thumbnail_bg_color))):
            raise utils.ValidationError(
                'Story thumbnail background color %s is not supported.' % (
                    self.thumbnail_bg_color))
        if self.thumbnail_bg_color and self.thumbnail_filename is None:
            raise utils.ValidationError(
                'Story thumbnail image is not provided.')
        if self.thumbnail_filename and self.thumbnail_bg_color is None:
            raise utils.ValidationError(
                'Story thumbnail background color is not specified.')

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

    def to_dict(self) -> StorySummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this StorySummary object.
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'language_code': self.language_code,
            'version': self.version,
            'node_titles': self.node_titles,
            'thumbnail_filename': self.thumbnail_filename,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'url_fragment': self.url_fragment,
            'story_model_created_on': utils.get_time_in_millisecs(
                self.story_model_created_on),
            'story_model_last_updated': utils.get_time_in_millisecs(
                self.story_model_last_updated)
        }

    def to_human_readable_dict(self) -> HumanReadableStorySummaryDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this StorySummary object.
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'node_titles': self.node_titles,
            'thumbnail_bg_color': self.thumbnail_bg_color,
            'thumbnail_filename': self.thumbnail_filename,
            'url_fragment': self.url_fragment
        }


class LearnerGroupSyllabusStorySummaryDict(StorySummaryDict):
    """Dictionary representation of a StorySummary object for learner
    groups syllabus.
    """

    story_is_published: bool
    completed_node_titles: List[str]
    all_node_dicts: List[StoryNodeDict]
    topic_name: str
    topic_url_fragment: str
    classroom_url_fragment: Optional[str]


class StoryChapterProgressSummaryDict(TypedDict):
    """Dictionary representation of a StoryChapterProgressSummary object for
    learner groups syllabus.
    """

    exploration_id: str
    visited_checkpoints_count: int
    total_checkpoints_count: int


class StoryPublicationTimeliness:
    """Domain object for stories with behind-schedule chapters
    or chapters upcoming within CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS.
    """

    def __init__(
        self,
        story_id: str,
        story_name: str,
        topic_name: str,
        overdue_chapters: List[str],
        upcoming_chapters: List[str]
    ) -> None:
        """Constructs a StoryPublicationTimeliness domain object.

        Args:
            story_id: str. The unique id of the story.
            story_name: str. The title of the story.
            topic_name: str. The title of the topic.
            overdue_chapters: list(str). The list of behind schedule chapter
                names.
            upcoming_chapters: list(str). The list of chapter names
                upcoming within CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS.
        """
        self.id = story_id
        self.story_name = story_name
        self.topic_name = topic_name
        self.overdue_chapters = overdue_chapters
        self.upcoming_chapters = upcoming_chapters
