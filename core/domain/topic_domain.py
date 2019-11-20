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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy

from constants import constants
from core.domain import change_domain
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

(topic_models,) = models.Registry.import_models([models.NAMES.topic])

CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'
CMD_REMOVE_MANAGER_ROLE = 'remove_manager_role'
CMD_PUBLISH_TOPIC = 'publish_topic'
CMD_UNPUBLISH_TOPIC = 'unpublish_topic'

ROLE_MANAGER = 'manager'
ROLE_NONE = 'none'
# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
TOPIC_PROPERTY_NAME = 'name'
TOPIC_PROPERTY_DESCRIPTION = 'description'
TOPIC_PROPERTY_CANONICAL_STORY_REFERENCES = 'canonical_story_references'
TOPIC_PROPERTY_ADDITIONAL_STORY_REFERENCES = 'additional_story_references'
TOPIC_PROPERTY_LANGUAGE_CODE = 'language_code'

SUBTOPIC_PROPERTY_TITLE = 'title'

CMD_ADD_SUBTOPIC = 'add_subtopic'
CMD_DELETE_SUBTOPIC = 'delete_subtopic'
CMD_ADD_CANONICAL_STORY = 'add_canonical_story'
CMD_DELETE_CANONICAL_STORY = 'delete_canonical_story'
CMD_ADD_ADDITIONAL_STORY = 'add_additional_story'
CMD_DELETE_ADDITIONAL_STORY = 'delete_additional_story'
CMD_PUBLISH_STORY = 'publish_story'
CMD_UNPUBLISH_STORY = 'unpublish_story'
CMD_ADD_UNCATEGORIZED_SKILL_ID = 'add_uncategorized_skill_id'
CMD_REMOVE_UNCATEGORIZED_SKILL_ID = 'remove_uncategorized_skill_id'
CMD_MOVE_SKILL_ID_TO_SUBTOPIC = 'move_skill_id_to_subtopic'
CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC = 'remove_skill_id_from_subtopic'
# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_TOPIC_PROPERTY = 'update_topic_property'
CMD_UPDATE_SUBTOPIC_PROPERTY = 'update_subtopic_property'

CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION = 'migrate_subtopic_schema_to_latest_version' # pylint: disable=line-too-long


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
        - 'create_new' (with name)
    """

    # The allowed list of topic properties which can be used in
    # update_topic_property command.
    TOPIC_PROPERTIES = (
        TOPIC_PROPERTY_NAME, TOPIC_PROPERTY_DESCRIPTION,
        TOPIC_PROPERTY_CANONICAL_STORY_REFERENCES,
        TOPIC_PROPERTY_ADDITIONAL_STORY_REFERENCES,
        TOPIC_PROPERTY_LANGUAGE_CODE)

    # The allowed list of subtopic properties which can be used in
    # update_subtopic_property command.
    SUBTOPIC_PROPERTIES = (SUBTOPIC_PROPERTY_TITLE,)

    ALLOWED_COMMANDS = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['name'],
        'optional_attribute_names': []
    }, {
        'name': CMD_ADD_SUBTOPIC,
        'required_attribute_names': ['title', 'subtopic_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_DELETE_SUBTOPIC,
        'required_attribute_names': ['subtopic_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_ADD_CANONICAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_DELETE_CANONICAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_ADD_ADDITIONAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_DELETE_ADDITIONAL_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_PUBLISH_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_UNPUBLISH_STORY,
        'required_attribute_names': ['story_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_ADD_UNCATEGORIZED_SKILL_ID,
        'required_attribute_names': ['new_uncategorized_skill_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_REMOVE_UNCATEGORIZED_SKILL_ID,
        'required_attribute_names': ['uncategorized_skill_id'],
        'optional_attribute_names': [],
    }, {
        'name': CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
        'required_attribute_names': [
            'old_subtopic_id', 'new_subtopic_id', 'skill_id'],
        'optional_attribute_names': [],
    }, {
        'name': CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
        'required_attribute_names': ['subtopic_id', 'skill_id'],
        'optional_attribute_names': [],
    }, {
        'name': CMD_UPDATE_SUBTOPIC_PROPERTY,
        'required_attribute_names': [
            'subtopic_id', 'property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'allowed_values': {'property_name': SUBTOPIC_PROPERTIES}
    }, {
        'name': CMD_UPDATE_TOPIC_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value', 'old_value'],
        'optional_attribute_names': [],
        'allowed_values': {'property_name': TOPIC_PROPERTIES}
    }, {
        'name': CMD_MIGRATE_SUBTOPIC_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': []
    }]


class TopicRightsChange(change_domain.BaseChange):
    """Domain object for changes made to a topic rights object.

    The allowed commands, together with the attributes:
        - 'change_role' (with assignee_id, new_role and old_role)
        - 'create_new'
        - 'publish_story'
        - 'unpublish_story'.
    """

    # The allowed list of roles which can be used in change_role command.
    ALLOWED_ROLES = [ROLE_NONE, ROLE_MANAGER]

    ALLOWED_COMMANDS = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': [],
        'optional_attribute_names': []
    }, {
        'name': CMD_CHANGE_ROLE,
        'required_attribute_names': ['assignee_id', 'new_role', 'old_role'],
        'optional_attribute_names': [],
        'allowed_values': {'new_role': ALLOWED_ROLES, 'old_role': ALLOWED_ROLES}
    }, {
        'name': CMD_REMOVE_MANAGER_ROLE,
        'required_attribute_names': ['removed_user_id'],
        'optional_attribute_names': []
    }, {
        'name': CMD_PUBLISH_TOPIC,
        'required_attribute_names': [],
        'optional_attribute_names': []
    }, {
        'name': CMD_UNPUBLISH_TOPIC,
        'required_attribute_names': [],
        'optional_attribute_names': []
    }]


class StoryReference(python_utils.OBJECT):
    """Domain object for a Story reference."""

    def __init__(self, story_id, story_is_published):
        """Constructs a StoryReference domain object.

        Args:
            story_id: str. The ID of the story.
            story_is_published: bool. Whether the story is published or not.
        """
        self.story_id = story_id
        self.story_is_published = story_is_published

    def to_dict(self):
        """Returns a dict representing this StoryReference domain object.

        Returns:
            A dict, mapping all fields of StoryReference instance.
        """
        return {
            'story_id': self.story_id,
            'story_is_published': self.story_is_published
        }

    @classmethod
    def from_dict(cls, story_reference_dict):
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
    def create_default_story_reference(cls, story_id):
        """Creates a StoryReference object with default values.

        Args:
            story_id: str. ID of the new story.

        Returns:
            StoryReference. A story reference object with given story_id and
                'not published' status.
        """
        return cls(story_id, False)

    def validate(self):
        """Validates various properties of the StoryReference object.

        Raises:
            ValidationError: One or more attributes of the StoryReference are
                invalid.
        """
        if not isinstance(self.story_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected story id to be a string, received %s' %
                self.story_id)
        if not isinstance(self.story_is_published, bool):
            raise utils.ValidationError(
                'Expected story_is_published to be a boolean, received %s' %
                self.story_is_published)


class Subtopic(python_utils.OBJECT):
    """Domain object for a Subtopic."""

    def __init__(self, subtopic_id, title, skill_ids):
        """Constructs a Subtopic domain object.

        Args:
            subtopic_id: int. The number of the subtopic.
            title: str. The title of the subtopic.
            skill_ids: list(str). The list of skill ids that are part of this
                subtopic.
        """
        self.id = subtopic_id
        self.title = title
        self.skill_ids = skill_ids

    def to_dict(self):
        """Returns a dict representing this Subtopic domain object.

        Returns:
            A dict, mapping all fields of Subtopic instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'skill_ids': self.skill_ids
        }

    @classmethod
    def from_dict(cls, subtopic_dict):
        """Returns a Subtopic domain object from a dict.

        Args:
            subtopic_dict: dict. The dict representation of Subtopic object.

        Returns:
            Subtopic. The corresponding Subtopic domain object.
        """
        subtopic = cls(
            subtopic_dict['id'], subtopic_dict['title'],
            subtopic_dict['skill_ids'])
        return subtopic

    @classmethod
    def create_default_subtopic(cls, subtopic_id, title):
        """Creates a Subtopic object with default values.

        Args:
            subtopic_id: str. ID of the new subtopic.
            title: str. The title for the new subtopic.

        Returns:
            Subtopic. A subtopic object with given id, title and empty skill ids
                list.
        """
        return cls(subtopic_id, title, [])

    def validate(self):
        """Validates various properties of the Subtopic object.

        Raises:
            ValidationError: One or more attributes of the subtopic are
                invalid.
        """
        if not isinstance(self.id, int):
            raise utils.ValidationError(
                'Expected subtopic id to be an int, received %s' % self.id)
        if not isinstance(self.title, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected subtopic title to be a string, received %s' %
                self.title)
        if not isinstance(self.skill_ids, list):
            raise utils.ValidationError(
                'Expected skill ids to be a list, received %s' %
                self.skill_ids)

        for skill_id in self.skill_ids:
            if not isinstance(skill_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each skill id to be a string, received %s' %
                    skill_id)

        if len(self.skill_ids) > len(set(self.skill_ids)):
            raise utils.ValidationError(
                'Expected all skill ids to be distinct.')


class Topic(python_utils.OBJECT):
    """Domain object for an Oppia Topic."""

    def __init__(
            self, topic_id, name, description, canonical_story_references,
            additional_story_references, uncategorized_skill_ids, subtopics,
            subtopic_schema_version, next_subtopic_id, language_code, version,
            story_reference_schema_version, created_on=None,
            last_updated=None):
        """Constructs a Topic domain object.

        Args:
            topic_id: str. The unique ID of the topic.
            name: str. The name of the topic.
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
            created_on: datetime.datetime. Date and time when the topic is
                created.
            last_updated: datetime.datetime. Date and time when the
                topic was last updated.
        """
        self.id = topic_id
        self.name = name
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

    def to_dict(self):
        """Returns a dict representing this Topic domain object.

        Returns:
            A dict, mapping all fields of Topic instance.
        """
        return {
            'id': self.id,
            'name': self.name,
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
                self.story_reference_schema_version)
        }

    @classmethod
    def require_valid_topic_id(cls, topic_id):
        """Checks whether the topic id is a valid one.

        Args:
            topic_id: str. The topic id to validate.
        """
        if not isinstance(topic_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Topic id should be a string, received: %s' % topic_id)

        if len(topic_id) != 12:
            raise utils.ValidationError('Topic id %s is invalid' % topic_id)

    @classmethod
    def require_valid_name(cls, name):
        """Checks whether the name of the topic is a valid one.

        Args:
            name: str. The name to validate.
        """
        if not isinstance(name, python_utils.BASESTRING):
            raise utils.ValidationError('Name should be a string.')

        if name == '':
            raise utils.ValidationError('Name field should not be empty')

    def get_all_skill_ids(self):
        """Returns all the ids of all the skills present in the topic.

        Returns:
            list(str). The list of all the skill ids present in the topic.
        """
        skill_ids = copy.deepcopy(self.uncategorized_skill_ids)

        for subtopic in self.subtopics:
            skill_ids.extend(copy.deepcopy(subtopic.skill_ids))
        return skill_ids

    def publish_story(self, story_id):
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

    def unpublish_story(self, story_id):
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

    def get_canonical_story_ids(self, include_only_published=False):
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

    def get_all_story_references(self):
        """Returns all the story references in the topic - both canonical and
        additional.

        Returns:
            list(StoryReference). The list of StoryReference objects in topic.
        """
        return (
            self.canonical_story_references + self.additional_story_references)

    def get_additional_story_ids(self, include_only_published=False):
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

    def get_all_uncategorized_skill_ids(self):
        """Returns ids of all the uncategorized skills present in the topic.

        Returns:
            list(str). The list of all the uncategorized skill ids present
            in the topic.
        """
        return self.uncategorized_skill_ids

    def delete_canonical_story(self, story_id):
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

    def add_canonical_story(self, story_id):
        """Adds a story to the canonical_story_references list.

        Args:
            story_id: str. The story id to add to the list.
        """
        canonical_story_ids = self.get_canonical_story_ids()
        if story_id in canonical_story_ids:
            raise Exception(
                'The story_id %s is already present in the canonical '
                'story references list of the topic.' % story_id)
        self.canonical_story_references.append(
            StoryReference.create_default_story_reference(story_id)
        )

    def add_additional_story(self, story_id):
        """Adds a story to the additional_story_references list.

        Args:
            story_id: str. The story id to add to the list.
        """
        additional_story_ids = self.get_additional_story_ids()
        if story_id in additional_story_ids:
            raise Exception(
                'The story_id %s is already present in the additional '
                'story references list of the topic.' % story_id)
        self.additional_story_references.append(
            StoryReference.create_default_story_reference(story_id)
        )

    def delete_additional_story(self, story_id):
        """Removes a story from the additional_story_references list.

        Args:
            story_id: str. The story id to remove from the list.

        Raises:
            Exception. The story_id is not present in the additional stories
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

    def validate(self):
        """Validates all properties of this topic and its constituents.

        Raises:
            ValidationError: One or more attributes of the Topic are not
                valid.
        """
        self.require_valid_name(self.name)
        if not isinstance(self.description, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected description to be a string, received %s'
                % self.description)

        if not isinstance(self.subtopics, list):
            raise utils.ValidationError(
                'Expected subtopics to be a list, received %s'
                % self.subtopics)

        if not isinstance(self.next_subtopic_id, int):
            raise utils.ValidationError(
                'Expected next_subtopic_id to be an int, received %s'
                % self.next_subtopic_id)

        if not isinstance(self.subtopic_schema_version, int):
            raise utils.ValidationError(
                'Expected subtopic schema version to be an integer, received %s'
                % self.subtopic_schema_version)

        if not isinstance(self.story_reference_schema_version, int):
            raise utils.ValidationError(
                'Expected story reference schema version to be an integer, '
                'received %s' % self.story_reference_schema_version)

        if (self.subtopic_schema_version !=
                feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION):
            raise utils.ValidationError(
                'Expected subtopic schema version to be %s, received %s'
                % (
                    feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
                    self.subtopic_schema_version))

        for subtopic in self.subtopics:
            if not isinstance(subtopic, Subtopic):
                raise utils.ValidationError(
                    'Expected each subtopic to be a Subtopic object, '
                    'received %s' % subtopic)
            subtopic.validate()
            if subtopic.id >= self.next_subtopic_id:
                raise utils.ValidationError(
                    'The id for subtopic %s is greater than or equal to '
                    'next_subtopic_id %s'
                    % (subtopic.id, self.next_subtopic_id))

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.canonical_story_references, list):
            raise utils.ValidationError(
                'Expected canonical story references to be a list, received %s'
                % self.canonical_story_references)

        canonical_story_ids = self.get_canonical_story_ids()
        if len(canonical_story_ids) > len(set(canonical_story_ids)):
            raise utils.ValidationError(
                'Expected all canonical story ids to be distinct.')

        if not isinstance(self.additional_story_references, list):
            raise utils.ValidationError(
                'Expected additional story references to be a list, received %s'
                % self.additional_story_references)
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

        if not isinstance(self.uncategorized_skill_ids, list):
            raise utils.ValidationError(
                'Expected uncategorized skill ids to be a list, received %s'
                % self.uncategorized_skill_ids)

    @classmethod
    def create_default_topic(cls, topic_id, name):
        """Returns a topic domain object with default values. This is for
        the frontend where a default blank topic would be shown to the user
        when the topic is created for the first time.

        Args:
            topic_id: str. The unique id of the topic.
            name: str. The initial name for the topic.

        Returns:
            Topic. The Topic domain object with the default values.
        """
        return cls(
            topic_id, name,
            feconf.DEFAULT_TOPIC_DESCRIPTION, [], [], [], [],
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, 1,
            constants.DEFAULT_LANGUAGE_CODE, 0,
            feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION)

    @classmethod
    def update_subtopics_from_model(cls, versioned_subtopics, current_version):
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
        """
        versioned_subtopics['schema_version'] = current_version + 1

        conversion_fn = getattr(
            cls, '_convert_subtopic_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))

        updated_subtopics = []
        for subtopic in versioned_subtopics['subtopics']:
            updated_subtopics.append(conversion_fn(subtopic))

        versioned_subtopics['subtopics'] = updated_subtopics

    @classmethod
    def update_story_references_from_model(
            cls, versioned_story_references, current_version):
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

    def update_name(self, new_name):
        """Updates the name of a topic object.

        Args:
            new_name: str. The updated name for the topic.
        """
        self.name = new_name

    def update_description(self, new_description):
        """Updates the description of a topic object.

        Args:
            new_description: str. The updated description for the topic.
        """
        self.description = new_description

    def update_language_code(self, new_language_code):
        """Updates the language code of a topic object.

        Args:
            new_language_code: str. The updated language code for the topic.
        """
        self.language_code = new_language_code

    def add_uncategorized_skill_id(self, new_uncategorized_skill_id):
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

    def remove_uncategorized_skill_id(self, uncategorized_skill_id):
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
        self.uncategorized_skill_ids.remove(uncategorized_skill_id)

    def get_all_subtopics(self):
        """Returns all subtopics in the topic.

        Returns:
            list(dict). The list of all subtopics present
                in topic.
        """
        subtopics = []
        for _, subtopic in enumerate(self.subtopics):
            subtopics.append(subtopic.to_dict())
        return subtopics

    def get_subtopic_index(self, subtopic_id):
        """Gets the index of the subtopic with the given id in the subtopics
        list.

        Args:
            subtopic_id: str. The id of the subtopic for which the index is to
                be found.

        Returns:
            int or None. Returns the index of the subtopic if it exists or else
                None.
        """
        for ind, subtopic in enumerate(self.subtopics):
            if subtopic.id == subtopic_id:
                return ind
        return None

    def add_subtopic(self, new_subtopic_id, title):
        """Adds a subtopic with the given id and title.

        Args:
            new_subtopic_id: int. The id of the new subtopic.
            title: str. The title for the new subtopic.

        Raises:
            Exception. The new_subtopic_id and the expected next subtopic id
                differs.
        Returns:
            int. The id of the newly created subtopic.
        """
        if self.next_subtopic_id != new_subtopic_id:
            raise Exception(
                'The given new subtopic id %s is not equal to the expected '
                'next subtopic id: %s'
                % (new_subtopic_id, self.next_subtopic_id))
        self.next_subtopic_id = self.next_subtopic_id + 1
        self.subtopics.append(
            Subtopic.create_default_subtopic(new_subtopic_id, title))

    def delete_subtopic(self, subtopic_id):
        """Deletes the subtopic with the given id and adds all its skills to
        uncategorized skill ids section.

        Args:
            subtopic_id: str. The id of the subtopic to remove.

        Raises:
            Exception. A subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        if subtopic_index is None:
            raise Exception(
                'A subtopic with id %s doesn\'t exist. ' % subtopic_id)
        for skill_id in self.subtopics[subtopic_index].skill_ids:
            self.uncategorized_skill_ids.append(skill_id)
        del self.subtopics[subtopic_index]

    def update_subtopic_title(self, subtopic_id, new_title):
        """Updates the title of the new subtopic.

        Args:
            subtopic_id: str. The id of the subtopic to edit.
            new_title: str. The new title for the subtopic.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
        """
        subtopic_index = self.get_subtopic_index(subtopic_id)
        if subtopic_index is None:
            raise Exception(
                'The subtopic with id %s does not exist.' % subtopic_id)
        self.subtopics[subtopic_index].title = new_title

    def move_skill_id_to_subtopic(
            self, old_subtopic_id, new_subtopic_id, skill_id):
        """Moves the skill_id to a new subtopic or to uncategorized skill ids.

        Args:
            old_subtopic_id: str or None. The id of the subtopic in which the
                skill is present currently (before moving) or None if it is
                uncategorized.
            new_subtopic_id: str. The id of the new subtopic to which the skill
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
            if old_subtopic_index is None:
                raise Exception(
                    'The subtopic with id %s does not exist.' % old_subtopic_id)
            if skill_id not in self.subtopics[old_subtopic_index].skill_ids:
                raise Exception(
                    'Skill id %s is not present in the given old subtopic'
                    % skill_id)
        else:
            if skill_id not in self.uncategorized_skill_ids:
                raise Exception(
                    'Skill id %s is not an uncategorized skill id.' % skill_id)

        new_subtopic_index = self.get_subtopic_index(new_subtopic_id)
        if new_subtopic_index is None:
            raise Exception(
                'The subtopic with id %s does not exist.' % new_subtopic_id)
        if skill_id in self.subtopics[new_subtopic_index].skill_ids:
            raise Exception(
                'Skill id %s is already present in the target subtopic'
                % skill_id)

        if old_subtopic_id is None:
            self.uncategorized_skill_ids.remove(skill_id)
        else:
            self.subtopics[old_subtopic_index].skill_ids.remove(skill_id)

        self.subtopics[new_subtopic_index].skill_ids.append(skill_id)

    def remove_skill_id_from_subtopic(self, subtopic_id, skill_id):
        """Removes the skill_id from a subtopic and adds it to
        uncategorized skill ids.

        Args:
            subtopic_id: str. The subtopic from which the skill is
                to be removed.
            skill_id: str. The skill id which is to be removed.

        Raises:
            Exception. The subtopic with the given id doesn't exist.
            Exception. The skill id should be present in the old subtopic
                already before moving.
        """

        subtopic_index = self.get_subtopic_index(subtopic_id)
        if subtopic_index is None:
            raise Exception(
                'The subtopic with id %s does not exist.' % subtopic_id)
        if skill_id not in self.subtopics[subtopic_index].skill_ids:
            raise Exception(
                'Skill id %s is not present in the old subtopic'
                % skill_id)

        self.subtopics[subtopic_index].skill_ids.remove(skill_id)
        self.uncategorized_skill_ids.append(skill_id)


class TopicSummary(python_utils.OBJECT):
    """Domain object for Topic Summary."""

    def __init__(
            self, topic_id, name, canonical_name, language_code, version,
            canonical_story_count, additional_story_count,
            uncategorized_skill_count, subtopic_count, total_skill_count,
            topic_model_created_on, topic_model_last_updated):
        """Constructs a TopicSummary domain object.

        Args:
            topic_id: str. The unique id of the topic.
            name: str. The name of the topic.
            canonical_name: str. The canonical name (lowercase) of the topic.
            language_code: str. The language code of the topic.
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
            topic_model_created_on: datetime.datetime. Date and time when
                the topic model is created.
            topic_model_last_updated: datetime.datetime. Date and time
                when the topic model was last updated.
        """
        self.id = topic_id
        self.name = name
        self.canonical_name = canonical_name
        self.language_code = language_code
        self.version = version
        self.canonical_story_count = canonical_story_count
        self.additional_story_count = additional_story_count
        self.uncategorized_skill_count = uncategorized_skill_count
        self.subtopic_count = subtopic_count
        self.total_skill_count = total_skill_count
        self.topic_model_created_on = topic_model_created_on
        self.topic_model_last_updated = topic_model_last_updated

    def validate(self):
        """Validates all properties of this topic summary.

        Raises:
            ValidationError: One or more attributes of the Topic summary
                are not valid.
        """
        if not isinstance(self.name, python_utils.BASESTRING):
            raise utils.ValidationError('Name should be a string.')
        if self.name == '':
            raise utils.ValidationError('Name field should not be empty')

        if not isinstance(self.canonical_name, python_utils.BASESTRING):
            raise utils.ValidationError('Canonical name should be a string.')
        if self.canonical_name == '':
            raise utils.ValidationError(
                'Canonical name field should not be empty')

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.canonical_story_count, int):
            raise utils.ValidationError(
                'Expected canonical story count to be an integer, '
                'received \'%s\'' % self.canonical_story_count)

        if self.canonical_story_count < 0:
            raise utils.ValidationError(
                'Expected canonical_story_count to be non-negative, '
                'received \'%s\'' % self.canonical_story_count)

        if not isinstance(self.additional_story_count, int):
            raise utils.ValidationError(
                'Expected additional story count to be an integer, '
                'received \'%s\'' % self.additional_story_count)

        if self.additional_story_count < 0:
            raise utils.ValidationError(
                'Expected additional_story_count to be non-negative, '
                'received \'%s\'' % self.additional_story_count)

        if not isinstance(self.uncategorized_skill_count, int):
            raise utils.ValidationError(
                'Expected uncategorized skill count to be an integer, '
                'received \'%s\'' % self.uncategorized_skill_count)

        if self.uncategorized_skill_count < 0:
            raise utils.ValidationError(
                'Expected uncategorized_skill_count to be non-negative, '
                'received \'%s\'' % self.uncategorized_skill_count)

        if not isinstance(self.total_skill_count, int):
            raise utils.ValidationError(
                'Expected total skill count to be an integer, received \'%s\''
                % self.total_skill_count)

        if self.total_skill_count < 0:
            raise utils.ValidationError(
                'Expected total_skill_count to be non-negative, '
                'received \'%s\'' % self.total_skill_count)

        if self.total_skill_count < self.uncategorized_skill_count:
            raise utils.ValidationError(
                'Expected total_skill_count to be greater than or equal to '
                'uncategorized_skill_count %s, received \'%s\'' % (
                    self.uncategorized_skill_count, self.total_skill_count))

        if not isinstance(self.subtopic_count, int):
            raise utils.ValidationError(
                'Expected subtopic count to be an integer, received \'%s\''
                % self.subtopic_count)

        if self.subtopic_count < 0:
            raise utils.ValidationError(
                'Expected subtopic_count to be non-negative, '
                'received \'%s\'' % self.subtopic_count)

    def to_dict(self):
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dict representing this TopicSummary object.
        """
        return {
            'id': self.id,
            'name': self.name,
            'language_code': self.language_code,
            'version': self.version,
            'canonical_story_count': self.canonical_story_count,
            'additional_story_count': self.additional_story_count,
            'uncategorized_skill_count': self.uncategorized_skill_count,
            'subtopic_count': self.subtopic_count,
            'total_skill_count': self.total_skill_count,
            'topic_model_created_on': utils.get_time_in_millisecs(
                self.topic_model_created_on),
            'topic_model_last_updated': utils.get_time_in_millisecs(
                self.topic_model_last_updated)
        }


class TopicRights(python_utils.OBJECT):
    """Domain object for topic rights."""

    def __init__(self, topic_id, manager_ids, topic_is_published):
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

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of TopicRights suitable for use by the
                frontend.
        """
        return {
            'topic_id': self.id,
            'manager_names': user_services.get_human_readable_user_ids(
                self.manager_ids),
            'topic_is_published': self.topic_is_published
        }

    def is_manager(self, user_id):
        """Checks whether given user is a manager of the topic.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is a topic manager of this topic.
        """
        return bool(user_id in self.manager_ids)
