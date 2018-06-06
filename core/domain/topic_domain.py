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

import copy

from constants import constants
from core.domain import user_services
from core.platform import models
import feconf
import utils

(topic_models,) = models.Registry.import_models([models.NAMES.topic])

CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'

ROLE_MANAGER = 'manager'
ROLE_NONE = 'none'
# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
TOPIC_PROPERTY_NAME = 'name'
TOPIC_PROPERTY_DESCRIPTION = 'description'
TOPIC_PROPERTY_CANONICAL_STORY_IDS = 'canonical_story_ids'
TOPIC_PROPERTY_ADDITIONAL_STORY_IDS = 'additional_story_ids'
TOPIC_PROPERTY_SKILL_IDS = 'skill_ids'
TOPIC_PROPERTY_LANGUAGE_CODE = 'language_code'


# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_TOPIC_PROPERTY = 'update_topic_property'


class TopicChange(object):
    """Domain object for changes made to topic object."""
    TOPIC_PROPERTIES = (
        TOPIC_PROPERTY_NAME, TOPIC_PROPERTY_DESCRIPTION,
        TOPIC_PROPERTY_CANONICAL_STORY_IDS, TOPIC_PROPERTY_ADDITIONAL_STORY_IDS,
        TOPIC_PROPERTY_SKILL_IDS, TOPIC_PROPERTY_LANGUAGE_CODE)

    OPTIONAL_CMD_ATTRIBUTE_NAMES = [
        'property_name', 'new_value', 'old_value', 'name'
    ]

    def __init__(self, change_dict):
        """Initialize a TopicChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update_topic_property' (with property_name, new_value
                and old_value)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_UPDATE_TOPIC_PROPERTY:
            if change_dict['property_name'] not in self.TOPIC_PROPERTIES:
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
        elif self.cmd == CMD_CREATE_NEW:
            self.name = change_dict['name']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing the TopicChange domain object.

        Returns:
            A dict, mapping all fields of TopicChange instance.
        """
        topic_change_dict = {}
        topic_change_dict['cmd'] = self.cmd
        for attribute_name in self.OPTIONAL_CMD_ATTRIBUTE_NAMES:
            if hasattr(self, attribute_name):
                topic_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return topic_change_dict


class Topic(object):
    """Domain object for an Oppia Topic."""

    def __init__(
            self, topic_id, name, description, canonical_story_ids,
            additional_story_ids, skill_ids, language_code, version,
            created_on=None, last_updated=None):
        """Constructs a Topic domain object.

        Args:
            topic_id: str. The unique ID of the topic.
            name: str. The name of the topic.
            description: str. The description of the topic.
            canonical_story_ids: list(str). A set of ids representing the
                canonical stories that are part of this topic.
            additional_story_ids: list(str). A set of ids representing the
                additional stories that are part of this topic.
            skill_ids: list(str). This consists of the full list of skill ids
                that are part of this topic.
            created_on: datetime.datetime. Date and time when the topic is
                created.
            last_updated: datetime.datetime. Date and time when the
                topic was last updated.
            language_code: str. The ISO 639-1 code for the language this
                topic is written in.
            version: int. The version of the topic.
        """
        self.id = topic_id
        self.name = name
        self.description = description
        self.canonical_story_ids = canonical_story_ids
        self.additional_story_ids = additional_story_ids
        self.skill_ids = skill_ids
        self.language_code = language_code
        self.created_on = created_on
        self.last_updated = last_updated
        self.version = version

    def to_dict(self):
        """Returns a dict representing this Topic domain object.

        Returns:
            A dict, mapping all fields of Topic instance.
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'canonical_story_ids': self.canonical_story_ids,
            'additional_story_ids': self.additional_story_ids,
            'language_code': self.language_code,
            'skill_ids': self.skill_ids,
            'version': self.version
        }

    @classmethod
    def require_valid_topic_id(cls, topic_id):
        """Checks whether the topic id is a valid one.

        Args:
            topic_id: str. The topic id to validate.
        """
        if not isinstance(topic_id, basestring):
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
        if not isinstance(name, basestring):
            raise utils.ValidationError('Name should be a string.')

        if name == '':
            raise utils.ValidationError('Name field should not be empty')

    def delete_skill(self, skill_id):
        """Removes a skill from the skill_ids list.

        Args:
            skill_id: str. The skill id to remove from the list.

        Raises:
            Exception. The skill_id is not present in the topic.
        """
        if skill_id not in self.skill_ids:
            raise Exception(
                'The skill id %s is not present in the topic.' % skill_id)
        self.skill_ids.remove(skill_id)

    def add_skill(self, skill_id):
        """Adds a skill to the skill_ids list.

        Args:
            skill_id: str. The skill id to add to the list.
        """
        if skill_id in self.skill_ids:
            raise Exception(
                'The skill id %s is already present in the topic.' % skill_id)
        self.skill_ids.append(skill_id)

    def delete_story(self, story_id):
        """Removes a story from the canonical_story_ids list.

        Args:
            story_id: str. The story id to remove from the list.

        Raises:
            Exception. The story_id is not present in the canonical story ids
                list of the topic.
        """
        if story_id not in self.canonical_story_ids:
            raise Exception(
                'The story_id %s is not present in the canonical '
                'story ids list of the topic.' % story_id)
        self.canonical_story_ids.remove(story_id)

    def add_canonical_story(self, story_id):
        """Adds a story to the canonical_story_ids list.

        Args:
            story_id: str. The story id to add to the list.
        """
        if story_id in self.canonical_story_ids:
            raise Exception(
                'The story_id %s is already present in the canonical '
                'story ids list of the topic.' % story_id)
        self.canonical_story_ids.append(story_id)

    def validate(self):
        """Validates all properties of this topic and its constituents.

        Raises:
            ValidationError: One or more attributes of the Topic are not
                valid.
        """
        self.require_valid_name(self.name)
        if not isinstance(self.description, basestring):
            raise utils.ValidationError(
                'Expected description to be a string, received %s'
                % self.description)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.canonical_story_ids, list):
            raise utils.ValidationError(
                'Expected canonical story ids to be a list, received %s'
                % self.canonical_story_ids)
        if len(self.canonical_story_ids) > len(set(self.canonical_story_ids)):
            raise utils.ValidationError(
                'Expected all canonical story ids to be distinct.')

        if not isinstance(self.additional_story_ids, list):
            raise utils.ValidationError(
                'Expected additional story ids to be a list, received %s'
                % self.additional_story_ids)
        if len(self.additional_story_ids) > len(set(self.additional_story_ids)):
            raise utils.ValidationError(
                'Expected all additional story ids to be distinct.')

        for story_id in self.additional_story_ids:
            if story_id in self.canonical_story_ids:
                raise utils.ValidationError(
                    'Expected additional story ids list and canonical story '
                    'ids list to be mutually exclusive. The story_id %s is '
                    'present in both lists' % story_id)

        if not isinstance(self.skill_ids, list):
            raise utils.ValidationError(
                'Expected skill ids to be a list, received %s'
                % self.skill_ids)

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
            feconf.DEFAULT_TOPIC_DESCRIPTION, [], [], [],
            constants.DEFAULT_LANGUAGE_CODE, 0)

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

    def update_canonical_story_ids(self, new_canonical_story_ids):
        """Updates the canonical story id list of a topic object.

        Args:
            new_canonical_story_ids: list(str). The updated list of canonical
                story ids.
        """
        self.canonical_story_ids = new_canonical_story_ids

    def update_additional_story_ids(self, new_additional_story_ids):
        """Updates the additional story id list of a topic object.

        Args:
            new_additional_story_ids: list(str). The updated list of additional
                story ids.
        """
        self.additional_story_ids = new_additional_story_ids

    def update_skill_ids(self, new_skill_ids):
        """Updates the skill id list of a topic object.

        Args:
            new_skill_ids: list(str). The updated list of skill ids.
        """
        self.skill_ids = new_skill_ids


class TopicSummary(object):
    """Domain object for Topic Summary."""

    def __init__(
            self, topic_id, name, language_code, version,
            canonical_story_count, additional_story_count, skill_count,
            topic_model_created_on, topic_model_last_updated):
        """Constructs a TopicSummary domain object.

        Args:
            topic_id: str. The unique id of the topic.
            name: str. The name of the topic.
            language_code: str. The language code of the topic.
            version: int. The version of the topic.
            canonical_story_count: int. The number of canonical stories present
                in the topic.
            additional_story_count: int. The number of additional stories
                present in the topic.
            skill_count: int. The number of skills the topic teaches.
            topic_model_created_on: datetime.datetime. Date and time when
                the topic model is created.
            topic_model_last_updated: datetime.datetime. Date and time
                when the topic model was last updated.
        """
        self.id = topic_id
        self.name = name
        self.language_code = language_code
        self.version = version
        self.canonical_story_count = canonical_story_count
        self.additional_story_count = additional_story_count
        self.skill_count = skill_count
        self.topic_model_created_on = topic_model_created_on
        self.topic_model_last_updated = topic_model_last_updated

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
            'skill_count': self.skill_count,
            'topic_model_created_on': self.topic_model_created_on,
            'topic_model_last_updated': self.topic_model_last_updated
        }


class TopicRights(object):
    """Domain object for topic rights."""

    def __init__(self, topic_id, manager_ids):
        self.id = topic_id
        self.manager_ids = manager_ids

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of TopicRights suitable for use by the
                frontend.
        """
        return {
            'topic_id': self.id,
            'manager_names': user_services.get_human_readable_user_ids(
                self.manager_ids)
        }

    def is_manager(self, user_id):
        """Checks whether given user is a manager of the topic.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is a topic manager of this topic.
        """
        return bool(user_id in self.manager_ids)
