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

import copy
import re

from constants import constants
from core.domain import html_cleaner
import feconf
import utils

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
STORY_NODE_PROPERTY_TITLE = 'title'
STORY_NODE_PROPERTY_EXPLORATION_ID = 'exploration_id'


INITIAL_NODE_ID = 'initial_node_id'

CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION = 'migrate_schema_to_latest_version'

# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_STORY_PROPERTY = 'update_story_property'
CMD_UPDATE_STORY_NODE_PROPERTY = 'update_story_node_property'
CMD_UPDATE_STORY_CONTENTS_PROPERTY = 'update_story_contents_property'

# These take node_id as parameter.
CMD_ADD_STORY_NODE = 'add_story_node'
CMD_DELETE_STORY_NODE = 'delete_story_node'
CMD_UPDATE_STORY_NODE_OUTLINE_STATUS = 'update_story_node_outline_status'

# This takes additional 'title' parameters.
CMD_CREATE_NEW = 'create_new'

CMD_CHANGE_ROLE = 'change_role'
CMD_PUBLISH_STORY = 'publish_story'
CMD_UNPUBLISH_STORY = 'unpublish_story'

ROLE_MANAGER = 'manager'
ROLE_NONE = 'none'
# The prefix for all node ids of a story.
NODE_ID_PREFIX = 'node_'


class StoryChange(object):
    """Domain object for changes made to story object."""
    STORY_PROPERTIES = (
        STORY_PROPERTY_TITLE, STORY_PROPERTY_DESCRIPTION,
        STORY_PROPERTY_NOTES, STORY_PROPERTY_LANGUAGE_CODE)

    STORY_NODE_PROPERTIES = (
        STORY_NODE_PROPERTY_DESTINATION_NODE_IDS,
        STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS,
        STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, STORY_NODE_PROPERTY_OUTLINE,
        STORY_NODE_PROPERTY_EXPLORATION_ID, STORY_NODE_PROPERTY_TITLE)

    STORY_CONTENTS_PROPERTIES = (INITIAL_NODE_ID,)

    OPTIONAL_CMD_ATTRIBUTE_NAMES = [
        'property_name', 'new_value', 'old_value', 'node_id', 'from_version',
        'to_version', 'title', 'finalized'
    ]

    def __init__(self, change_dict):
        """Initialize a StoryChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'add_story_node' (with node_id)
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

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_ADD_STORY_NODE:
            self.node_id = change_dict['node_id']
            self.title = change_dict['title']
        elif self.cmd == CMD_DELETE_STORY_NODE:
            self.node_id = change_dict['node_id']
        elif self.cmd == CMD_UPDATE_STORY_NODE_OUTLINE_STATUS:
            self.node_id = change_dict['node_id']
            self.old_value = change_dict['old_value']
            self.new_value = change_dict['new_value']
        elif self.cmd == CMD_UPDATE_STORY_NODE_PROPERTY:
            if (change_dict['property_name'] not in
                    self.STORY_NODE_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.node_id = change_dict['node_id']
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
        elif self.cmd == CMD_UPDATE_STORY_PROPERTY:
            if change_dict['property_name'] not in self.STORY_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
        elif self.cmd == CMD_UPDATE_STORY_CONTENTS_PROPERTY:
            if change_dict['property_name'] not in (
                    self.STORY_CONTENTS_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
        elif self.cmd == CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION:
            self.from_version = change_dict['from_version']
            self.to_version = change_dict['to_version']
        elif self.cmd == CMD_CREATE_NEW:
            self.title = change_dict['title']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing the StoryChange domain object.

        Returns:
            A dict, mapping all fields of StoryChange instance.
        """
        story_change_dict = {}
        story_change_dict['cmd'] = self.cmd
        for attribute_name in self.OPTIONAL_CMD_ATTRIBUTE_NAMES:
            if hasattr(self, attribute_name):
                story_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return story_change_dict


class StoryNode(object):
    """Domain object describing a node in the exploration graph of a
    story.
    """

    def __init__(
            self, node_id, title, destination_node_ids,
            acquired_skill_ids, prerequisite_skill_ids,
            outline, outline_is_finalized, exploration_id):
        """Initializes a StoryNode domain object.

        Args:
            node_id: str. The unique id for each node.
            title: str. The title of the story node.
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
        """
        self.id = node_id
        self.title = title
        self.destination_node_ids = destination_node_ids
        self.acquired_skill_ids = acquired_skill_ids
        self.prerequisite_skill_ids = prerequisite_skill_ids
        self.outline = html_cleaner.clean(outline)
        self.outline_is_finalized = outline_is_finalized
        self.exploration_id = exploration_id

    @classmethod
    def get_number_from_node_id(cls, node_id):
        """Decodes the node_id to get the number at the end of the id.

        Args:
            node_id: str. The id of the node.

        Returns:
            int. The number at the end of the id.
        """
        return int(node_id.replace(NODE_ID_PREFIX, ''))

    @classmethod
    def get_incremented_node_id(cls, node_id):
        """Increments the next node id of the story.

        Returns:
            str. The new next node id.
        """
        current_number = StoryNode.get_number_from_node_id(node_id)
        incremented_node_id = NODE_ID_PREFIX + str(current_number + 1)
        return incremented_node_id

    @classmethod
    def require_valid_node_id(cls, node_id):
        """Validates the node id for a StoryNode object.

        Args:
            node_id: str. The node id to be validated.
        """
        if not isinstance(node_id, basestring):
            raise utils.ValidationError(
                'Expected node ID to be a string, received %s' %
                node_id)
        pattern = re.compile('%s[0-9]+' % NODE_ID_PREFIX)
        if not pattern.match(node_id):
            raise utils.ValidationError(
                'Invalid node_id: %s' % node_id)

    def to_dict(self):
        """Returns a dict representing this StoryNode domain object.

        Returns:
            A dict, mapping all fields of StoryNode instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'destination_node_ids': self.destination_node_ids,
            'acquired_skill_ids': self.acquired_skill_ids,
            'prerequisite_skill_ids': self.prerequisite_skill_ids,
            'outline': self.outline,
            'outline_is_finalized': self.outline_is_finalized,
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
            node_dict['id'], node_dict['title'],
            node_dict['destination_node_ids'],
            node_dict['acquired_skill_ids'],
            node_dict['prerequisite_skill_ids'], node_dict['outline'],
            node_dict['outline_is_finalized'], node_dict['exploration_id'])

        return node

    @classmethod
    def create_default_story_node(cls, node_id, title):
        """Returns a StoryNode domain object with default values.

        Args:
            node_id: str. The id of the node.
            title: str. The title of the node.

        Returns:
            StoryNode. The StoryNode domain object with default
            value.
        """
        return cls(node_id, title, [], [], [], '', False, None)

    def validate(self):
        """Validates various properties of the story node.

        Raises:
            ValidationError: One or more attributes of the story node are
            invalid.
        """
        if self.exploration_id:
            if not isinstance(self.exploration_id, basestring):
                raise utils.ValidationError(
                    'Expected exploration ID to be a string, received %s' %
                    self.exploration_id)

        if not isinstance(self.outline, basestring):
            raise utils.ValidationError(
                'Expected outline to be a string, received %s' %
                self.outline)

        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' %
                self.title)

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
            if not isinstance(skill_id, basestring):
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
            if not isinstance(skill_id, basestring):
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


class StoryContents(object):
    """Domain object representing the story_contents dict."""

    def __init__(self, story_nodes, initial_node_id, next_node_id):
        """Constructs a StoryContents domain object.

        Args:
            story_nodes: list(StoryNode). The list of story nodes that are part
                of this story.
            initial_node_id: str. The id of the starting node of the story.
            next_node_id: str. The id for the next node to be added to the
                story.
        """
        self.initial_node_id = initial_node_id
        self.nodes = story_nodes
        self.next_node_id = next_node_id

    def validate(self):
        """Validates various properties of the story contents object.

        Raises:
            ValidationError: One or more attributes of the story contents are
            invalid.
        """
        if not isinstance(self.nodes, list):
            raise utils.ValidationError(
                'Expected nodes field to be a list, received %s' % self.nodes)

        if len(self.nodes) > 0:
            StoryNode.require_valid_node_id(self.initial_node_id)
        StoryNode.require_valid_node_id(self.next_node_id)

        initial_node_is_present = False
        node_id_list = []

        for node in self.nodes:
            if not isinstance(node, StoryNode):
                raise utils.ValidationError(
                    'Expected each node to be a StoryNode object, received %s' %
                    node)
            node.validate()
            for destination_node_id in node.destination_node_ids:
                if next(
                        (node for node in self.nodes
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

        if len(self.nodes) > 0:
            if not initial_node_is_present:
                raise utils.ValidationError('Expected starting node to exist.')

            if len(node_id_list) > len(set(node_id_list)):
                raise utils.ValidationError(
                    'Expected all node ids to be distinct.')

            # nodes_queue stores the pending nodes to visit in the story that
            # are unlocked, in a 'queue' form with a First In First Out
            # structure.
            nodes_queue = []
            is_node_visited = [False] * len(self.nodes)
            starting_node_index = self.get_node_index(self.initial_node_id)
            nodes_queue.append(self.nodes[starting_node_index].id)

            # The user is assumed to have all the prerequisite skills of the
            # starting node before starting the story. Also, this list models
            # the skill IDs acquired by a learner as they progress through the
            # story.
            simulated_skill_ids = copy.deepcopy(
                self.nodes[starting_node_index].prerequisite_skill_ids)

            # The following loop employs a Breadth First Search from the given
            # starting node and makes sure that the user has acquired all the
            # prerequisite skills required by the destination nodes 'unlocked'
            # by visiting a particular node by the time that node is finished.
            while len(nodes_queue) > 0:
                current_node_id = nodes_queue.pop()
                current_node_index = self.get_node_index(current_node_id)
                is_node_visited[current_node_index] = True
                current_node = self.nodes[current_node_index]

                for skill_id in current_node.acquired_skill_ids:
                    simulated_skill_ids.append(skill_id)

                for node_id in current_node.destination_node_ids:
                    node_index = self.get_node_index(node_id)
                    # The following condition checks whether the destination
                    # node for a particular node, has already been visited, in
                    # which case the story would have loops, which are not
                    # allowed.
                    if is_node_visited[node_index]:
                        raise utils.ValidationError(
                            'Loops are not allowed in stories.')
                    destination_node = self.nodes[node_index]
                    if not (
                            set(
                                destination_node.prerequisite_skill_ids
                            ).issubset(simulated_skill_ids)):
                        raise utils.ValidationError(
                            'The prerequisite skills ' +
                            ' '.join(
                                set(destination_node.prerequisite_skill_ids) -
                                set(simulated_skill_ids)) +
                            ' were not completed before the node with id %s'
                            ' was unlocked.' % node_id)
                    nodes_queue.append(node_id)

            for index, node_visited in enumerate(is_node_visited):
                if not node_visited:
                    raise utils.ValidationError(
                        'The node with id %s is disconnected from the '
                        'story graph.' % self.nodes[index].id)

    def get_node_index(self, node_id):
        """Returns the index of the story node with the given node
        id, or None if the node id is not in the story contents dict.

        Args:
            node_id: str. The id of the node.

        Returns:
            int or None. The index of the corresponding node, or None if there
            is no such node.
        """
        for ind, node in enumerate(self.nodes):
            if node.id == node_id:
                return ind
        return None

    def to_dict(self):
        """Returns a dict representing this StoryContents domain object.

        Returns:
            A dict, mapping all fields of StoryContents instance.
        """
        return {
            'nodes': [
                node.to_dict() for node in self.nodes
            ],
            'initial_node_id': self.initial_node_id,
            'next_node_id': self.next_node_id
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
        story_contents = cls(
            [
                StoryNode.from_dict(story_node_dict)
                for story_node_dict in story_contents_dict['nodes']
            ], story_contents_dict['initial_node_id'],
            story_contents_dict['next_node_id']
        )

        return story_contents


class Story(object):
    """Domain object for an Oppia Story."""

    def __init__(
            self, story_id, title, description, notes,
            story_contents, story_contents_schema_version, language_code,
            version, created_on=None, last_updated=None):
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
            version: int. The version of the story.
            created_on: datetime.datetime. Date and time when the story is
                created.
            last_updated: datetime.datetime. Date and time when the
                story was last updated.
        """
        self.id = story_id
        self.title = title
        self.description = description
        self.notes = html_cleaner.clean(notes)
        self.story_contents = story_contents
        self.story_contents_schema_version = story_contents_schema_version
        self.language_code = language_code
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version

    def validate(self):
        """Validates various properties of the story object.

        Raises:
            ValidationError: One or more attributes of story are invalid.
        """
        self.require_valid_title(self.title)

        if not isinstance(self.description, basestring):
            raise utils.ValidationError(
                'Expected description to be a string, received %s'
                % self.description)

        if not isinstance(self.notes, basestring):
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

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        self.story_contents.validate()

    @classmethod
    def require_valid_story_id(cls, story_id):
        """Checks whether the story id is a valid one.

        Args:
            story_id: str. The story id to validate.
        """
        if not isinstance(story_id, basestring):
            raise utils.ValidationError(
                'Story id should be a string, received: %s' % story_id)

        if len(story_id) != 12:
            raise utils.ValidationError('Invalid story id.')

    @classmethod
    def require_valid_title(cls, title):
        """Checks whether the story title is a valid one.

        Args:
            title: str. The title to validate.
        """

        if not isinstance(title, basestring):
            raise utils.ValidationError('Title should be a string.')
        if title == '':
            raise utils.ValidationError('Title field should not be empty')

    def get_prerequisite_skill_ids_for_exp_id(self, exp_id):
        """Returns the prerequisite skill ids of the node having the given
        exploration id.

        Args:
            exp_id: str. The ID of the exploration linked to the story,

        Returns:
            list(str)|None. The list of prerequisite skill ids for the
                exploration or None, if no node is linked to it.
        """
        for node in self.story_contents.nodes:
            if node.exploration_id == exp_id:
                return node.prerequisite_skill_ids
        return None

    def has_exploration(self, exp_id):
        """Checks whether an exploration is present in the story.

        Args:
            exp_id: str. The ID of the exploration linked to the story,

        Returns:
            bool. Whether the exploration is linked to the story.
        """
        for node in self.story_contents.nodes:
            if node.exploration_id == exp_id:
                return True
        return False

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
            'story_contents_schema_version': self.story_contents_schema_version,
            'version': self.version,
            'story_contents': self.story_contents.to_dict()
        }

    @classmethod
    def create_default_story(cls, story_id, title):
        """Returns a story domain object with default values. This is for
        the frontend where a default blank story would be shown to the user
        when the story is created for the first time.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title for the newly created story.

        Returns:
            Story. The Story domain object with the default values.
        """
        # Initial node id for a new story.
        initial_node_id = '%s1' % NODE_ID_PREFIX
        story_contents = StoryContents([], None, initial_node_id)
        return cls(
            story_id, title,
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
        """
        versioned_story_contents['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_story_contents_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))
        versioned_story_contents['story_contents'] = conversion_fn(
            versioned_story_contents['story_contents'])

    def update_title(self, title):
        """Updates the title of the story.

        Args:
            title: str. The new title of the story.
        """
        self.title = title

    def update_description(self, description):
        """Updates the description of the story.

        Args:
            description: str. The new description of the story.
        """
        self.description = description

    def update_notes(self, notes):
        """Updates the notes of the story.

        Args:
            notes: str. The new notes of the story.
        """
        self.notes = notes

    def update_language_code(self, language_code):
        """Updates the language code of the story.

        Args:
            language_code: str. The new language code of the story.
        """
        self.language_code = language_code

    def add_node(self, desired_node_id, node_title):
        """Adds a new default node with the id as story_contents.next_node_id.

        Args:
            desired_node_id: str. The node id to be given to the new node in the
                story.
            node_title: str. The title for the new story node.

        Raises:
            Exception: The desired_node_id differs from
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

    def _check_exploration_id_already_present(self, exploration_id):
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

    def delete_node(self, node_id):
        """Deletes a node with the given node_id.

        Args:
            node_id: str. The id of the node.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
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

    def update_node_outline(self, node_id, new_outline):
        """Updates the outline field of a given node.

        Args:
            node_id: str. The id of the node.
            new_outline: str. The new outline of the given node.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].outline = new_outline

    def update_node_title(self, node_id, new_title):
        """Updates the title field of a given node.

        Args:
            node_id: str. The id of the node.
            new_title: str. The new title of the given node.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].title = new_title

    def mark_node_outline_as_finalized(self, node_id):
        """Updates the outline_is_finalized field of the node with the given
        node_id as True.

        Args:
            node_id: str. The id of the node.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].outline_is_finalized = True

    def mark_node_outline_as_unfinalized(self, node_id):
        """Updates the outline_is_finalized field of the node with the given
        node_id as False.

        Args:
            node_id: str. The id of the node.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].outline_is_finalized = False

    def update_node_acquired_skill_ids(self, node_id, new_acquired_skill_ids):
        """Updates the acquired skill ids field of a given node.

        Args:
            node_id: str. The id of the node.
            new_acquired_skill_ids: list(str). The updated acquired skill id
                list.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].acquired_skill_ids = (
            new_acquired_skill_ids)

    def update_node_prerequisite_skill_ids(
            self, node_id, new_prerequisite_skill_ids):
        """Updates the prerequisite skill ids field of a given node.

        Args:
            node_id: str. The id of the node.
            new_prerequisite_skill_ids: list(str). The updated prerequisite
                skill id list.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].prerequisite_skill_ids = (
            new_prerequisite_skill_ids)

    def update_node_destination_node_ids(
            self, node_id, new_destination_node_ids):
        """Updates the destination_node_ids field of a given node.

        Args:
            node_id: str. The id of the node.
            new_destination_node_ids: list(str). The updated destination
                node id list.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story' % node_id)
        self.story_contents.nodes[node_index].destination_node_ids = (
            new_destination_node_ids)

    def update_node_exploration_id(
            self, node_id, new_exploration_id):
        """Updates the exploration id field of a given node.

        Args:
            node_id: str. The id of the node.
            new_exploration_id: str. The updated exploration id for a node.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story.' % node_id)
        if self._check_exploration_id_already_present(new_exploration_id):
            raise ValueError(
                'A node with exploration id %s already exists.' %
                new_exploration_id)
        self.story_contents.nodes[node_index].exploration_id = (
            new_exploration_id)

    def update_initial_node(self, new_initial_node_id):
        """Updates the starting node of the story.

        Args:
            new_initial_node_id: str. The new starting node id.

        Raises:
            ValueError: The node is not part of the story.
        """
        node_index = self.story_contents.get_node_index(new_initial_node_id)
        if node_index is None:
            raise ValueError(
                'The node with id %s is not part of this story.'
                % new_initial_node_id)
        self.story_contents.initial_node_id = new_initial_node_id


class StorySummary(object):
    """Domain object for Story Summary."""

    def __init__(
            self, story_id, title, description, language_code, version,
            node_count, story_model_created_on,
            story_model_last_updated):
        """Constructs a StorySummary domain object.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title of the story.
            description: str. The description of the story.
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
        self.description = description
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
            'description': self.description,
            'language_code': self.language_code,
            'version': self.version,
            'node_count': self.node_count,
            'story_model_created_on': utils.get_time_in_millisecs(
                self.story_model_created_on),
            'story_model_last_updated': utils.get_time_in_millisecs(
                self.story_model_last_updated)
        }

    def to_human_readable_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this StorySummary object.
        """
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description
        }


class StoryRights(object):
    """Domain object for story rights."""

    def __init__(self, story_id, manager_ids, story_is_published):
        """Constructs a StoryRights domain object.

        Args:
            story_id: str. The id of the story.
            manager_ids: list(str). The id of the users who have been assigned
                as managers for the story.
            story_is_published: bool. Whether the story is viewable by a
                learner.
        """
        self.id = story_id
        self.manager_ids = manager_ids
        self.story_is_published = story_is_published

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of StoryRights suitable for use by the
                frontend.
        """
        return {
            'story_id': self.id,
            'manager_names': self.manager_ids,
            'story_is_published': self.story_is_published
        }

    def is_manager(self, user_id):
        """Checks whether given user is a manager of the story.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is a manager of this story.
        """
        return bool(user_id in self.manager_ids)


class StoryRightsChange(object):
    """Domain object for changes made to a story rights object."""

    OPTIONAL_CMD_ATTRIBUTE_NAMES = [
        'assignee_id', 'new_role', 'old_role'
    ]

    def __init__(self, change_dict):
        """Initialize a StoryRightsChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'change_role' (with assignee_id, new_role and old_role)
                - 'create_new'
                - 'publish_story'
                - 'unpublish_story'

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_CHANGE_ROLE:
            self.assignee_id = change_dict['assignee_id']
            self.new_role = change_dict['new_role']
            self.old_role = change_dict['old_role']
        elif self.cmd == CMD_CREATE_NEW:
            pass
        elif self.cmd == CMD_PUBLISH_STORY:
            pass
        elif self.cmd == CMD_UNPUBLISH_STORY:
            pass
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing the StoryRightsChange domain object.

        Returns:
            A dict, mapping all fields of StoryRightsChange instance.
        """
        story_rights_change_dict = {}
        story_rights_change_dict['cmd'] = self.cmd
        for attribute_name in self.OPTIONAL_CMD_ATTRIBUTE_NAMES:
            if hasattr(self, attribute_name):
                story_rights_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return story_rights_change_dict
