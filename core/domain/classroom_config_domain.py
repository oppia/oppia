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
# limitations under the License.]

# Currently, the classroom data is stored in the config model and we are
# planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be renamed as classroom_domain and
# the exiting classroom domain file should be deleted, until then both of
# the files will exist simultaneously.

"""Domain objects for Classroom."""

from __future__ import annotations

from typing import List
from core import utils



class Classroom:
    """Domain object for a classroom."""

    def __init__(
        self,
        id: str,
        name: str,
        url_fragment: str,
        course_details: str,
        topic_list_intro: str,
        topic_id_to_prerequisite_topic_ids: Dict[str, List[str]]
    ) -> None:
        """Constructs a Classroom domain object.

        Args:
            id: str. The ID of the classroom.
            name: str. The name of the classroom.
            url_fragment: str. The url fragment of the classroom.
            course_details: str. Course details for the classroom.
            topic_list_intro: str. Topic list introduction for the classroom.
            topic_id_to_prerequisite_topic_ids: dict(str, list(str)). A dict
                with topic ID as key and a list of prerequisite topic IDs as
                value.
        """
        self.id = id
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
        """
        return cls(
            classroom_dict['id'],
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
            'id': self.id,
            'name': self.name,
            'url_fragment': self.url_fragment,
            'course_details': self.course_details,
            'topic_list_intro': self.topic_list_intro,
            'topic_id_to_prerequisite_topic_ids': (
                self.topic_id_to_prerequisite_topic_ids)
        }

    def validate(self) -> None:
        """Validates various properties of the Classroom."""

        if not isinstance(self.id, str):
            raise utils.ValidationError(
                'Expected ID of the classroom to be a string, received: %s.'
                % self.id)
        if not isinstance(self.name, str):
            raise utils.ValidationError(
                'Expected name of the classroom to be a string, received: %s.'
                % self.name)
        if not isinstance(self.url_fragment, str):
            raise utils.ValidationError(
                'Expected url fragment of the classroom to be a string, '
                'received: %s.' % self.url_fragment)
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
            'The topic ID to prerequisite topic IDs should not contain any '
            'cycle.')
        for topic_id in self.topic_id_to_prerequisite_topic_ids:
            ancestors = self.topic_id_to_prerequisite_topic_ids[topic_id]

            while len(ancestors) > 0:
                if topic_id in ancestors:
                    raise utils.ValidationError(cyclic_check_error)
                ancestor_topic_id = ancestors.pop()
                ancestors.extend(
                    self.topic_id_to_prerequisite_topic_ids[ancestor_topic_id])

