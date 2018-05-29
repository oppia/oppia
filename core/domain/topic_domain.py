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

from constants import constants
from core.domain import user_services
from core.platform import models
import feconf

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
            self.new_value = change_dict['new_value']
            self.old_value = change_dict['old_value']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)


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
    def create_default_topic(cls, topic_id):
        """Returns a topic domain object with default values. This is for
        the frontend where a default blank topic would be shown to the user
        when the topic is created for the first time.

        Args:
            topic_id: str. The unique id of the topic.

        Returns:
            Topic. The Topic domain object with the default values.
        """
        return cls(
            topic_id, feconf.DEFAULT_TOPIC_NAME,
            feconf.DEFAULT_TOPIC_DESCRIPTION, [], [], [],
            constants.DEFAULT_LANGUAGE_CODE, 0)


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
