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
from core.platform import models
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
STORY_PROPERTY_TITLE = 'title'
STORY_PROPERTY_DESCRIPTION = 'description'
STORY_PROPERTY_NOTES = 'notes'
STORY_PROPERTY_LANGUAGE_CODE = 'language_code'
STORY_PROPERTY_STORY_NODES = 'story_nodes'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_STORY_PROPERTY = 'update_story_property'


class StoryChange(object):
    """Domain object for changes made to story object."""
    STORY_PROPERTIES = (
        STORY_PROPERTY_TITLE, STORY_PROPERTY_DESCRIPTION,
        STORY_PROPERTY_NOTES, STORY_PROPERTY_STORY_NODES,
        STORY_PROPERTY_LANGUAGE_CODE)

    def __init__(self, change_dict):
        """Initialize a StoryChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update story property' (with property_name, new_value
                and old_value)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_UPDATE_STORY_PROPERTY:
            if (change_dict['property_name'] in
                    self.STORY_PROPERTIES):
                self.property_name = change_dict['property_name']
                self.new_value = change_dict['new_value']
                self.old_value = change_dict.get('old_value')
            else:
                raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing StoryChange domain object.

        Returns:
            dict. A dict representing StoryChange instance.
        """
        return {
            'cmd': self.cmd,
            'property_name': self.property_name,
            'new_value': self.new_value,
            'old_value': self.old_value
        }


class StoryNode(object):
    """Domain object describing a node in the exploration graph of a
    story.
    """

    def __init__(
            self, node_id, destination_node_ids,
            acquired_skill_ids, prerequisite_skill_ids,
            story_outline, exploration_id):
        """Initializes a StoryNode domain object.

        Args:
            node_id: str. The unique id for each node.
            destination_node_ids: list(str). The list of destination node ids
                that this node points to in the story graph.
            acquired_skill_ids: list(str). The list of skill ids acquired by
                the user on completion of the node.
            prerequisite_skill_ids: list(str). The list of skill ids required
                before starting a node.
            story_outline: str. Free-form annotations that a lesson implementer
                can use to construct the exploration. It describes the basic
                theme or template of the story.
            exploration_id: str or None. The valid exploration id that fits the
                story node. It can be None initially, when the story creator
                has just created a story with the basic storyline (by providing
                notes) without linking an exploration to any node.
        """
        self.id = node_id
        self.destination_node_ids = destination_node_ids
        self.acquired_skill_ids = acquired_skill_ids
        self.prerequisite_skill_ids = prerequisite_skill_ids
        self.story_outline = story_outline
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
            'story_outline': self.story_outline,
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
            node_dict['prerequisite_skill_ids'], node_dict['story_outline'],
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
        return cls(node_id, [], [], [], '', '')


class Story(object):
    """Domain object for an Oppia Story."""

    def __init__(
            self, story_id, title, description, notes, topic_id,
            story_nodes, schema_version, language_code, version,
            created_on=None, last_updated=None):
        """Constructs a Question domain object.

        Args:
            story_id: str. The unique ID of the story.
            title: str. The title of the story.
            description: str. The high level desscription of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting.
            topic_id: str. The topic id the story corresponds to.
            story_nodes: list(StoryNode). List of the story nodes present in
                the story.
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
        self.topic_id = topic_id
        self.story_nodes = story_nodes
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
            'topic_id': self.topic_id,
            'schema_version': self.schema_version,
            'version': self.version,
            'story_nodes': [
                node.to_dict() for node in self.story_nodes
            ]
        }

    @classmethod
    def from_dict(
            cls, story_dict,
            story_created_on=None, story_last_updated=None):
        """Return a Story domain object from a dict.

        Args:
            story_dict: dict. The dictionary representation of the
                story.
            story_created_on: datetime.datetime. Date and time when the
                story is created.
            story_last_updated: datetime.datetime. Date and time when
                the story was last updated.

        Returns:
            Story. The corresponding Story domain object.
        """
        story = cls(
            story_dict['id'], story_dict['title'],
            story_dict['description'], story_dict['notes'],
            story_dict['topic_id'],
            [
                StoryNode.from_dict(node_dict)
                for node_dict in story_dict['story_nodes']
            ], story_dict['schema_version'], story_dict['language_code'],
            story_dict['version'], story_created_on, story_last_updated)

        return story

    @classmethod
    def create_default_story(
            cls, story_id, title=feconf.DEFAULT_STORY_TITLE,
            description=feconf.DEFAULT_STORY_DESCRIPTION,
            notes=feconf.DEFAULT_STORY_NOTES,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Returns a story domain object with default values.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title of the story.
            category: str. The category of the story.
            objective: str. The objective of the story.
            language_code: str. The language code of the story (like 'en'
                for English).

        Returns:
            Story. The Story domain object with the default values.
        """
        return cls(
            story_id, title, description, notes, None, [],
            feconf.CURRENT_STORY_SCHEMA_VERSION, language_code, 0)

    @classmethod
    def update_story_contents_from_model(
            cls, versioned_story_contents, current_version):
        """Converts the states blob contained in the given
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
                feconf.CURRENT_STORY_SCHEMA_VERSION):
            raise Exception('story is version %d but current story'
                            ' schema version is %d' % (
                                versioned_story_contents['schema_version'],
                                feconf.CURRENT_STORY_SCHEMA_VERSION))

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
            node_count, topic_id, story_model_created_on,
            story_model_last_updated):
        """Constructs a StorySummary domain object.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title of the story.
            language_code: str. The language code of the story.
            version: int. The version of the story.
            node_count: int. The number of nodes present in the story.
            topic_id: str. The id of the topic, the story corresponds to.
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
        self.topic_id = topic_id
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
            'topic_id': self.topic_id,
            'story_model_created_on': self.story_model_created_on,
            'story_model_last_updated': self.story_model_last_updated
        }
