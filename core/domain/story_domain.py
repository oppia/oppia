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

from core.platform import models

(story_models,) = models.Registry.import_models([models.NAMES.story])


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
STORY_PROPERTY_TITLE = 'title'
STORY_PROPERTY_DESCRIPTION = 'description'
STORY_PROPERTY_TOPIC = 'topic'
STORY_PROPERTY_NOTES = 'notes'
STORY_PROPERTY_LANGUAGE_CODE = 'language_code'
STORY_PROPERTY_STORY_CONTENTS = 'story_nodes'

# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_STORY_PROPERTY = 'update_story_property'


class StoryChange(object):
    """Domain object for changes made to story object."""
    STORY_PROPERTIES = (
        STORY_PROPERTY_TITLE, STORY_PROPERTY_DESCRIPTION,
        STORY_PROPERTY_TOPIC, STORY_PROPERTY_NOTES,
        STORY_PROPERTY_STORY_CONTENTS, STORY_PROPERTY_LANGUAGE_CODE)

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
            self, node_id, destination_nodes,
            acquired_skill_ids, prerequisite_skill_ids,
            annotations, exploration_id):
        """Initializes a StoryNode domain object.

        Args:
            node_id: str. The unique id for each node.
            destination_nodes: list(str). The list of destination node ids that
                this node points to in the story graph.
            acquired_skill_ids: list(str). The list of skill ids acquired by
                the user on completion of the node.
            prerequisite_skill_ids: list(str). The list of skill ids required
                before starting a node.
            annotations: str. Free-form annotations that a lesson implementer
                can use to construct the exploration. It described the basic
                theme or template of the story.
            exploration_id: str. The valid exploration id that fits the
                story node.
        """
        self.id = node_id
        self.destination_nodes = destination_nodes
        self.acquired_skill_ids = acquired_skill_ids
        self.prerequisite_skill_ids = prerequisite_skill_ids
        self.annotations = annotations
        self.exploration_id = exploration_id

    def to_dict(self):
        """Returns a dict representing this StoryNode domain object.

        Returns:
            A dict, mapping all fields of StoryNode instance.
        """
        return {
            'id': self.id,
            'destination_nodes': self.destination_nodes,
            'acquired_skill_ids': self.acquired_skill_ids,
            'prerequisite_skill_ids': self.prerequisite_skill_ids,
            'annotations': self.annotations,
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
            node_dict['id'], node_dict['destination_nodes'],
            node_dict['acquired_skill_ids'],
            node_dict['prerequisite_skill_ids'], node_dict['annotations'],
            node_dict['exploration_id'])

        return node


class Story(object):
    """Domain object for an Oppia Story."""

    def __init__(
            self, story_id, title, description, notes, topic,
            story_nodes, schema_version, language_code, version,
            created_on=None, last_updated=None):
        """Constructs a Question domain object.

        Args:
            story_id: str. The unique ID of the story.
            title: str. The title of the story.
            description: str. The high level desscription of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting.
            topic: str. The topic id the story corresponds to.
            story_nodes: list(StoryNode). List of the story nodes present in
                the story.
            created_on: datetime.datetime. Date and time when the story is
                created.
            last_updated: datetime.datetime. Date and time when the
                story was last updated.
            schema_version: int. The schema version for the story.
            language_code: str. The ISO 639-1 code for the language this
                story is written in.
            version: int. The version of the story.
        """
        self.id = story_id
        self.title = title
        self.description = description
        self.notes = notes
        self.topic = topic
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
            'topic': self.topic,
            'schema_version': self.schema_version,
            'version': self.version,
            'story_nodes': [
                node.to_dict() for node in self.story_nodes
            ]
        }

    @classmethod
    def from_dict(
            cls, story_dict, story_version=0,
            story_created_on=None, story_last_updated=None):
        """Return a Story domain object from a dict.

        Args:
            story_dict: dict. The dictionary representation of  the
                story.
            story_version: int. The version of the story.
            story_created_on: datetime.datetime. Date and time when the
                story is created.
            story_last_updated: datetime.datetime. Date and time when
                the story is updated last time.

        Returns:
            Story. The corresponding Story domain object.
        """
        story = cls(
            story_dict['id'], story_dict['title'],
            story_dict['description'], story_dict['notes'],
            story_dict['topic'],
            [
                StoryNode.from_dict(node_dict)
                for node_dict in story_dict['nodes']
            ], story_dict['schema_version'], story_dict['language_code'],
            story_version, story_created_on, story_last_updated)

        return story


class StorySummary(object):
    """Domain object for Story Summary."""

    def __init__(
            self, story_id, title, language_code, version,
            node_count, topic, story_model_created_on,
            story_model_last_updated):
        """Constructs a StorySummary domain object.

        Args:
            story_id: str. The unique id of the story.
            title: str. The title of the story.
            language_code: str. The language code of the story.
            version: int. The version of the story.
            node_count: int. The number of nodes present in the story.
            topic: str. The id of the topic, the story corresponds to.
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
        self.topic = topic
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
            'topic': self.topic,
            'story_model_created_on': self.story_model_created_on,
            'story_model_last_updated': self.story_model_last_updated
        }
