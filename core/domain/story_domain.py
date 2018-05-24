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

from constants import constants
import feconf

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
STORY_PROPERTY_TITLE = 'title'
STORY_PROPERTY_DESCRIPTION = 'description'
STORY_PROPERTY_NOTES = 'notes'
STORY_PROPERTY_LANGUAGE_CODE = 'language_code'

STORY_NODE_PROPERTY_DESTINATION_NODE_IDS = 'destination_node_ids'
STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS = 'acquired_skill_ids'
STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS = 'prerequisite_skill_ids'
STORY_NODE_PROPERTY_OUTLINE = 'outline'
STORY_NODE_PROPERTY_EXPLORATION_ID = 'exploration_id'


# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_STORY_PROPERTY = 'update_story_property'
CMD_UPDATE_STORY_NODE_PROPERTY = 'update_story_node_property'

# These take node_id as parameter.
CMD_ADD_STORY_NODE = 'add_story_node'
CMD_DELETE_STORY_NODE = 'delete_story_node'

# This takes additional 'title' parameters.
CMD_CREATE_NEW = 'create_new'


class StoryChange(object):
    """Domain object for changes made to story object."""
    STORY_PROPERTIES = (
        STORY_PROPERTY_TITLE, STORY_PROPERTY_DESCRIPTION,
        STORY_PROPERTY_NOTES, STORY_PROPERTY_LANGUAGE_CODE)

    STORY_NODE_PROPERTIES = (
        STORY_NODE_PROPERTY_DESTINATION_NODE_IDS,
        STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS,
        STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, STORY_NODE_PROPERTY_OUTLINE,
        STORY_NODE_PROPERTY_EXPLORATION_ID)

    def __init__(self, change_dict):
        """Initialize a StoryChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update_story_property' (with property_name, new_value
                and old_value)
                - 'update_story_node_property' (with property_name, new_value
                and old_value)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_ADD_STORY_NODE:
            self.node_id = change_dict['node_id']
        elif self.cmd == CMD_DELETE_STORY_NODE:
            self.node_id = change_dict['node_id']
        elif self.cmd == CMD_UPDATE_STORY_NODE_PROPERTY:
            if (change_dict['property_name'] not in
                    self.STORY_NODE_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.node_id = change_dict['node_id']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        elif self.cmd == CMD_UPDATE_STORY_PROPERTY:
            if change_dict['property_name'] not in self.STORY_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)


class StoryNode(object):
    """Domain object describing a node in the exploration graph of a
    story.
    """

    def __init__(
            self, node_id, destination_node_ids,
            acquired_skill_ids, prerequisite_skill_ids,
            outline, exploration_id):
        """Initializes a StoryNode domain object.

        Args:
            node_id: str. The unique id for each node.
            destination_node_ids: list(str). The list of destination node ids
                that this node points to in the story graph.
            acquired_skill_ids: list(str). The list of skill ids acquired by
                the user on completion of the node.
            prerequisite_skill_ids: list(str). The list of skill ids required
                before starting a node.
            outline: str. Free-form annotations that a lesson implementer
                can use to construct the exploration. It describes the basic
                theme or template of the story.
            exploration_id: str or None. The valid exploration id that fits the
                story node. It can be None initially, when the story creator
                has just created a story with the basic storyline (by providing
                outlines) without linking an exploration to any node.
        """
        self.id = node_id
        self.destination_node_ids = destination_node_ids
        self.acquired_skill_ids = acquired_skill_ids
        self.prerequisite_skill_ids = prerequisite_skill_ids
        self.outline = outline
        self.exploration_id = exploration_id

    def to_dict(self):
        """Returns a dict representing this StoryNode domain object.

        Returns:
            A dict, mapping all fields of StoryNode instance.
        """
        return {
            'id': self.id,
            'destination_node_ids': self.destination_node_ids,
            'acquired_skill_ids': self.acquired_skill_ids,
            'prerequisite_skill_ids': self.prerequisite_skill_ids,
            'outline': self.outline,
            'exploration_id': self.exploration_id
        }

    @classmethod
    def from_dict(cls, node_dict):
        """Return a StoryNode domain object from a dict.

        Args:
            node_dict: dict. The dict representation of StoryNode object.

        Returns:
            StoryNode. The corresponding StoryNode domain object.
        """
        node = cls(
            node_dict['id'], node_dict['destination_node_ids'],
            node_dict['acquired_skill_ids'],
            node_dict['prerequisite_skill_ids'], node_dict['outline'],
            node_dict['exploration_id'])

        return node

    @classmethod
    def create_default_story_node(cls, node_id):
        """Returns a StoryNode domain object with default values.

        Args:
            node_id: str. The id of the node.

        Returns:
            StoryNode. The StoryNode domain object with default
            value.
        """
        return cls(node_id, [], [], [], '', None)


class StoryContents(object):
    """Domain object representing the story_contents dict."""

    def __init__(self, story_nodes):
        """Constructs a StoryContents domain object.

        Args:
            story_nodes: list(StoryNode). The list of story nodes that are part
                of this story.
        """
        self.nodes = story_nodes

    def to_dict(self):
        """Returns a dict representing this StoryContents domain object.

        Returns:
            A dict, mapping all fields of StoryContents instance.
        """
        return {
            'nodes': [
                node.to_dict() for node in self.nodes
            ]
        }

    @classmethod
    def from_dict(cls, story_contents_dict):
        """Return a StoryContents domain object from a dict.

        Args:
            story_contents_dict: dict. The dict representation of
                StoryContents object.

        Returns:
            StoryContents. The corresponding StoryContents domain object.
        """
        story_contents = cls([
            StoryNode.from_dict(story_node_dict)
            for story_node_dict in story_contents_dict['nodes']
        ])

        return story_contents


class Story(object):
    """Domain object for an Oppia Story."""

    def __init__(
            self, story_id, title, description, notes,
            story_contents, schema_version, language_code, version,
            created_on=None, last_updated=None):
        """Constructs a Story domain object.

        Args:
            story_id: str. The unique ID of the story.
            title: str. The title of the story.
            description: str. The high level desscription of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting.
            story_contents: StoryContents. The dict representing the contents
                that are part of this story.
            created_on: datetime.datetime. Date and time when the story is
                created.
            last_updated: datetime.datetime. Date and time when the
                story was last updated.
            schema_version: int. The schema version for the story nodes object.
            language_code: str. The ISO 639-1 code for the language this
                story is written in.
            version: int. The version of the story.
        """
        self.id = story_id
        self.title = title
        self.description = description
        self.notes = notes
        self.story_contents = story_contents
        self.schema_version = schema_version
        self.language_code = language_code
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version

    def to_dict(self):
        """Returns a dict representing this Story domain object.

        Returns:
            A dict, mapping all fields of Story instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'notes': self.notes,
            'language_code': self.language_code,
            'schema_version': self.schema_version,
            'version': self.version,
            'story_contents': self.story_contents.to_dict()
        }

    @classmethod
    def create_default_story(cls, story_id):
        """Returns a story domain object with default values. This is for the
        the frontend where a default blank story would be shown to the user
        when the story is created for the first time.

        Args:
            story_id: str. The unique id of the story.

        Returns:
            Story. The Story domain object with the default values.
        """
        story_contents = StoryContents([])
        return cls(
            story_id, feconf.DEFAULT_STORY_TITLE,
            feconf.DEFAULT_STORY_DESCRIPTION, feconf.DEFAULT_STORY_NOTES,
            story_contents, feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0)

    @classmethod
    def update_story_contents_from_model(
            cls, versioned_story_contents, current_version):
        """Converts the story_contents blob contained in the given
        versioned_story_contents dict from current_version to
        current_version + 1. Note that the versioned_story_contents being
        passed in is modified in-place.

        Args:
            versioned_story_contents: dict. A dict with two keys:
                - schema_version: str. The schema version for the
                    story_contents dict.
                - story_contents: dict. The dict comprising the story
                    contents.
            current_version: int. The current schema version of story_contents.

        Raises:
            Exception: The value of the key 'schema_version' in
            versioned_story_contents is not valid.
        """
        if (versioned_story_contents['schema_version'] + 1 >
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
            raise Exception('story_contents is version %d but current '
                            'story_contents schema version is %d' % (
                                versioned_story_contents['schema_version'],
                                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION))

        versioned_story_contents['schema_version'] = (
            current_version + 1)

        conversion_fn = getattr(
            cls, '_convert_story_contents_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))
        versioned_story_contents['story_contents'] = conversion_fn(
            versioned_story_contents['story_contents'])


class StorySummary(object):
    """Domain object for Story Summary."""

    def __init__(
            self, story_id, title, language_code, version,
            node_count, story_model_created_on,
            story_model_last_updated):
        """Constructs a StorySummary domain object.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title of the story.
            language_code: str. The language code of the story.
            version: int. The version of the story.
            node_count: int. The number of nodes present in the story.
            story_model_created_on: datetime.datetime. Date and time when
                the story model is created.
            story_model_last_updated: datetime.datetime. Date and time
                when the story model was last updated.
        """
        self.id = story_id
        self.title = title
        self.language_code = language_code
        self.version = version
        self.node_count = node_count
        self.story_model_created_on = story_model_created_on
        self.story_model_last_updated = story_model_last_updated

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this StorySummary object.
        """
        return {
            'id': self.id,
            'title': self.title,
            'language_code': self.language_code,
            'version': self.version,
            'node_count': self.node_count,
            'story_model_created_on': self.story_model_created_on,
            'story_model_last_updated': self.story_model_last_updated
        }
