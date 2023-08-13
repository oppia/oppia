# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for Classroom."""

from __future__ import annotations

import copy
from core import utils
from core.constants import constants

from typing import Dict, List, TypedDict


class ClassroomDict(TypedDict):
    """Dict type for Classroom object."""

    classroom_id: str
    name: str
    url_fragment: str
    course_details: str
    topic_list_intro: str
    topic_id_to_prerequisite_topic_ids: Dict[str, List[str]]


# TODO(#17246): Currently, the classroom data is stored in the config model and
# we are planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be renamed as classroom_domain and
# the exiting classroom domain file should be deleted, until then both of
# the files will exist simultaneously.

class Classroom:
    """Domain object for a classroom."""

    def __init__(
        self,
        classroom_id: str,
        name: str,
        url_fragment: str,
        course_details: str,
        topic_list_intro: str,
        topic_id_to_prerequisite_topic_ids: Dict[str, List[str]]
    ) -> None:
        """Constructs a Classroom domain object.

        Args:
            classroom_id: str. The ID of the classroom.
            name: str. The name of the classroom.
            url_fragment: str. The url fragment of the classroom.
            course_details: str. Course details for the classroom.
            topic_list_intro: str. Topic list introduction for the classroom.
            topic_id_to_prerequisite_topic_ids: dict(str, list(str)). A dict
                with topic ID as key and a list of prerequisite topic IDs as
                value.
        """
        self.classroom_id = classroom_id
        self.name = name
        self.url_fragment = url_fragment
        self.course_details = course_details
        self.topic_list_intro = topic_list_intro
        self.topic_id_to_prerequisite_topic_ids = (
            topic_id_to_prerequisite_topic_ids)

    @classmethod
    def from_dict(cls, classroom_dict: ClassroomDict) -> Classroom:
        """Returns a classroom domain object from a dict.

        Args:
            classroom_dict: dict. The dict representation of the Classroom
                object.

        Returns:
            Classroom. The classroom object instance.
        """
        return cls(
            classroom_dict['classroom_id'],
            classroom_dict['name'],
            classroom_dict['url_fragment'],
            classroom_dict['course_details'],
            classroom_dict['topic_list_intro'],
            classroom_dict['topic_id_to_prerequisite_topic_ids']
        )

    def to_dict(self) -> ClassroomDict:
        """Returns a dict representing a classroom domain object.

        Returns:
            dict. A dict, mapping all fields of classroom instance.
        """
        return {
            'classroom_id': self.classroom_id,
            'name': self.name,
            'url_fragment': self.url_fragment,
            'course_details': self.course_details,
            'topic_list_intro': self.topic_list_intro,
            'topic_id_to_prerequisite_topic_ids': (
                self.topic_id_to_prerequisite_topic_ids)
        }

    @classmethod
    def require_valid_name(cls, name: str) -> None:
        """Checks whether the name of the classroom is a valid one.

        Args:
            name: str. The name to validate.
        """
        if not isinstance(name, str):
            raise utils.ValidationError(
                'Expected name of the classroom to be a string, received: %s.'
                % name)

        if name == '':
            raise utils.ValidationError('Name field should not be empty')

        if len(name) > constants.MAX_CHARS_IN_CLASSROOM_NAME:
            raise utils.ValidationError(
                'Classroom name should be at most %d characters, received %s.'
                % (constants.MAX_CHARS_IN_CLASSROOM_NAME, name))

    @classmethod
    def require_valid_url_fragment(cls, url_fragment: str) -> None:
        """Checks whether the url fragment of the classroom is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.
        """
        if not isinstance(url_fragment, str):
            raise utils.ValidationError(
                'Expected url fragment of the classroom to be a string, '
                'received: %s.' % url_fragment)

        if url_fragment == '':
            raise utils.ValidationError(
                'Url fragment field should not be empty')

        utils.require_valid_url_fragment(
            url_fragment, 'Classroom URL Fragment',
            constants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT)

    def validate(self) -> None:
        """Validates various properties of the Classroom."""

        if not isinstance(self.classroom_id, str):
            raise utils.ValidationError(
                'Expected ID of the classroom to be a string, received: %s.'
                % self.classroom_id)

        self.require_valid_name(self.name)

        self.require_valid_url_fragment(self.url_fragment)

        if not isinstance(self.course_details, str):
            raise utils.ValidationError(
                'Expected course_details of the classroom to be a string, '
                'received: %s.' % self.course_details)

        if not isinstance(self.topic_list_intro, str):
            raise utils.ValidationError(
                'Expected topic list intro of the classroom to be a string, '
                'received: %s.' % self.topic_list_intro)

        if not isinstance(self.topic_id_to_prerequisite_topic_ids, dict):
            raise utils.ValidationError(
                'Expected topic ID to prerequisite topic IDs of the classroom '
                'to be a string, received: %s.' % (
                    self.topic_id_to_prerequisite_topic_ids))

        cyclic_check_error = (
            'The topic ID to prerequisite topic IDs graph should not contain '
            'any cycles.')
        for topic_id in self.topic_id_to_prerequisite_topic_ids:
            ancestors = copy.deepcopy(
                self.topic_id_to_prerequisite_topic_ids[topic_id])
            visited_topic_ids_for_current_node = []
            while len(ancestors) > 0:
                if topic_id in ancestors:
                    raise utils.ValidationError(cyclic_check_error)

                ancestor_topic_id = ancestors.pop()

                if ancestor_topic_id in visited_topic_ids_for_current_node:
                    continue

                ancestors.extend(
                    self.topic_id_to_prerequisite_topic_ids[
                        ancestor_topic_id]
                )
                visited_topic_ids_for_current_node.append(ancestor_topic_id)
