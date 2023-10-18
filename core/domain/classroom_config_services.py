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

"""Commands for operations on classrooms."""

from __future__ import annotations

from core.constants import constants
from core.domain import classroom_config_domain
from core.platform import models

from typing import Dict, List, Literal, Optional, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import classroom_models

(classroom_models,) = models.Registry.import_models([models.Names.CLASSROOM])

# TODO(#17246): Currently, the classroom data is stored in the config model and
# we are planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be renamed as classroom_services and
# the existing classroom services file should be deleted, until then both of
# the files will exist simultaneously.


def get_all_classrooms() -> List[classroom_config_domain.Classroom]:
    """Returns all the classrooms present in the datastore.

    Returns:
        list(Classroom). The list of classrooms present in the datastore.
    """
    backend_classroom_models = classroom_models.ClassroomModel.get_all()
    classrooms: List[classroom_config_domain.Classroom] = [
        get_classroom_from_classroom_model(model)
        for model in backend_classroom_models
    ]
    return classrooms


def get_classroom_id_to_classroom_name_dict() -> Dict[str, str]:
    """Returns a dict with classroom id as key and classroom name as value for
    all the classrooms present in the datastore.

    Returns:
        dict(str, str). A dict with classroom id as key and classroom name as
        value for all the classrooms present in the datastore.
    """
    classrooms = get_all_classrooms()
    return {
        classroom.classroom_id: classroom.name for classroom in classrooms
    }


def get_classroom_from_classroom_model(
    classroom_model: classroom_models.ClassroomModel
) -> classroom_config_domain.Classroom:
    """Returns a classroom domain object given a classroom model loaded
    from the datastore.

    Args:
        classroom_model: ClassroomModel. The classroom model loaded from the
            datastore.

    Returns:
        Classroom. A classroom domain object corresponding to the given
        classroom model.
    """
    return classroom_config_domain.Classroom(
        classroom_model.id,
        classroom_model.name,
        classroom_model.url_fragment,
        classroom_model.course_details,
        classroom_model.topic_list_intro,
        classroom_model.topic_id_to_prerequisite_topic_ids
    )


@overload
def get_classroom_by_id(
    classroom_id: str
) -> classroom_config_domain.Classroom: ...


@overload
def get_classroom_by_id(
    classroom_id: str, *, strict: Literal[True]
) -> classroom_config_domain.Classroom: ...


@overload
def get_classroom_by_id(
    classroom_id: str, *, strict: Literal[False]
) -> Optional[classroom_config_domain.Classroom]: ...


def get_classroom_by_id(
    classroom_id: str,
    strict: bool = True
) -> Optional[classroom_config_domain.Classroom]:
    """Returns a domain object representing a classroom.

    Args:
        classroom_id: str. ID of the classroom.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        Classroom or None. The domain object representing a classroom with the
        given id, or None if it does not exist.
    """
    classroom_model = classroom_models.ClassroomModel.get(
        classroom_id, strict=strict)
    if classroom_model:
        return get_classroom_from_classroom_model(classroom_model)
    else:
        return None


def get_classroom_by_url_fragment(
    url_fragment: str
) -> Optional[classroom_config_domain.Classroom]:
    """Returns a domain object representing a classroom.

    Args:
        url_fragment: str. The url fragment of the classroom.

    Returns:
        Classroom or None. The domain object representing a classroom with the
        given id, or None if it does not exist.
    """
    classroom_model = classroom_models.ClassroomModel.get_by_url_fragment(
        url_fragment)
    if classroom_model:
        return get_classroom_from_classroom_model(classroom_model)
    else:
        return None


def get_classroom_url_fragment_for_topic_id(topic_id: str) -> str:
    """Returns the classroom url fragment for the provided topic id.

    Args:
        topic_id: str. The topic id.

    Returns:
        str. Returns the classroom url fragment for a topic.
    """
    classrooms = get_all_classrooms()
    for classroom in classrooms:
        topic_ids = list(classroom.topic_id_to_prerequisite_topic_ids.keys())
        if topic_id in topic_ids:
            return classroom.url_fragment
    return str(constants.CLASSROOM_URL_FRAGMENT_FOR_UNATTACHED_TOPICS)


def get_new_classroom_id() -> str:
    """Returns a new classroom ID.

    Returns:
        str. A new classroom ID.
    """
    return classroom_models.ClassroomModel.generate_new_classroom_id()


def update_classroom(
    classroom: classroom_config_domain.Classroom,
    classroom_model: classroom_models.ClassroomModel
) -> None:
    """Saves a Clasroom domain object to the datastore.

    Args:
        classroom: Classroom. The classroom domain object for the given
            classroom.
        classroom_model: ClassroomModel. The classroom model instance.
    """
    classroom.validate()
    classroom_model.name = classroom.name
    classroom_model.url_fragment = classroom.url_fragment
    classroom_model.course_details = classroom.course_details
    classroom_model.topic_list_intro = classroom.topic_list_intro
    classroom_model.topic_id_to_prerequisite_topic_ids = (
        classroom.topic_id_to_prerequisite_topic_ids)

    classroom_model.update_timestamps()
    classroom_model.put()


def create_new_classroom(
    classroom: classroom_config_domain.Classroom
) -> None:
    """Creates a new classroom model from using the classroom domain object.

    Args:
        classroom: Classroom. The classroom domain object for the given
            classroom.
    """
    classroom.validate()
    classroom_models.ClassroomModel.create(
        classroom.classroom_id,
        classroom.name,
        classroom.url_fragment,
        classroom.course_details,
        classroom.topic_list_intro,
        classroom.topic_id_to_prerequisite_topic_ids
    )


def update_or_create_classroom_model(
    classroom: classroom_config_domain.Classroom
) -> None:
    """Updates the properties of an existing classroom model or creates a new
    classroom model.
    """
    model = classroom_models.ClassroomModel.get(
        classroom.classroom_id, strict=False)

    if model is None:
        create_new_classroom(classroom)
    else:
        update_classroom(classroom, model)


def delete_classroom(classroom_id: str) -> None:
    """Deletes the classroom model.

    Args:
        classroom_id: str. ID of the classroom which is to be deleted.
    """
    classroom_models.ClassroomModel.get(classroom_id).delete()
