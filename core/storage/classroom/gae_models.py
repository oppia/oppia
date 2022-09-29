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

"""Models for storing classroom data."""

from __future__ import annotations

from core import utils
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()
(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class ClassroomModel(base_models.BaseModel):
    """Model to store the classroom data.

    The id of instances of this class is in the form of random hash of
    12 chars.
    """

    # The name of the classroom.
    name = datastore_services.StringProperty(required=True, indexed=True)
    # The url fragment of the classroom.
    url_fragment = datastore_services.StringProperty(
        required=True, indexed=True)
    # A text to provide course details present in the classroom.
    course_details = datastore_services.StringProperty(
        indexed=True, required=True)
    # A text to provide an introduction for all the topics in the classroom.
    topic_list_intro = datastore_services.StringProperty(
        indexed=True, required=True)
    # A property that is used to establish dependencies among the topics in the
    # classroom. This field contains a dict with topic ID as key and a list of
    # prerequisite topic IDs as value.
    topic_id_to_prerequisite_topic_ids = datastore_services.JsonProperty(
        indexed=False, required=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'course_details': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_list_intro': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id_to_prerequisite_topic_ids': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE)
        })

    @classmethod
    def generate_new_classroom_id(cls) -> str:
        """Generates a new classroom ID which is unique and is in the form of
        random hash of 12 chars.

        Returns:
            str. A classroom ID that is different from the IDs of all
            the existing classroom.

        Raises:
            Exception. There were too many collisions with existing classroom
                IDs when attempting to generate a new classroom ID.
        """
        for _ in range(base_models.MAX_RETRIES):
            classroom_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            if not cls.get_by_id(classroom_id):
                return classroom_id
        raise Exception(
            'New classroom id generator is producing too many collisions.')

    @classmethod
    def create(
        cls, classroom_id: str, name: str, url_fragment: str,
        course_details: str, topic_list_intro: str,
        topic_id_to_prerequisite_topic_ids: Dict[str, List[str]]
    ) -> ClassroomModel:
        """Creates a new ClassroomModel entry.

        Args:
            classroom_id: str. Classroom ID of the newly-created classroom.
            name: str. The name of the classroom.
            url_fragment: str. The url fragment of the classroom.
            course_details: str. A text to provide course details present in
                the classroom.
            topic_list_intro: str. A text to provide an introduction for all
                the topics in the classroom.
            topic_id_to_prerequisite_topic_ids: dict(str, list(str)). A dict
                with topic ID as key and list of topic IDs as value.

        Returns:
            ClassroomModel. The newly created ClassroomModel instance.

        Raises:
            Exception. A classroom with the given ID already exists.
        """
        if cls.get_by_id(classroom_id):
            raise Exception(
                'A classroom with the given classroom ID already exists.')

        entity = cls(
            id=classroom_id,
            name=name,
            url_fragment=url_fragment,
            course_details=course_details,
            topic_list_intro=topic_list_intro,
            topic_id_to_prerequisite_topic_ids=(
                topic_id_to_prerequisite_topic_ids)
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def get_by_url_fragment(cls, url_fragment: str) -> Optional[ClassroomModel]:
        """Gets ClassroomModel by url_fragment. Returns None if the classroom
        with the given url_fragment doesn't exist.

        Args:
            url_fragment: str. The url fragment of the classroom.

        Returns:
            ClassroomModel | None. The Classroom model or None if not found.
        """
        return ClassroomModel.query(
            datastore_services.all_of(
                cls.url_fragment == url_fragment,
                cls.deleted == False # pylint: disable=singleton-comparison
            )
        ).get()

    @classmethod
    def get_by_name(cls, classroom_name: str) -> Optional[ClassroomModel]:
        """Gets ClassroomModel by name. Returns None if the classroom
        with the given name doesn't exist.

        Args:
            classroom_name: str. The name of the classroom.

        Returns:
            ClassroomModel | None. The Classroom model or None if not found.
        """
        return ClassroomModel.query(
            datastore_services.all_of(
                cls.name == classroom_name,
                cls.deleted == False  # pylint: disable=singleton-comparison
            )
        ).get()
