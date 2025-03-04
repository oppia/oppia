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

from core import feconf
from core.constants import constants
from core.domain import classroom_config_domain
from core.platform import models

from typing import Dict, List, Literal, Optional, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import classroom_models
    from mypy_imports import transaction_services

(classroom_models,) = models.Registry.import_models([models.Names.CLASSROOM])
transaction_services = models.Registry.import_transaction_services()

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
    return {
        classroom.classroom_id: classroom.name
        for classroom in sorted(
            get_all_classrooms(), key=lambda classroom: classroom.index
        )
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
    thumbnail_data = classroom_config_domain.ImageData(
        classroom_model.thumbnail_filename,
        classroom_model.thumbnail_bg_color,
        classroom_model.thumbnail_size_in_bytes
    )
    banner_data = classroom_config_domain.ImageData(
        classroom_model.banner_filename,
        classroom_model.banner_bg_color,
        classroom_model.banner_size_in_bytes
    )
    return classroom_config_domain.Classroom(
        classroom_model.id,
        classroom_model.name,
        classroom_model.url_fragment,
        classroom_model.course_details,
        classroom_model.teaser_text,
        classroom_model.topic_list_intro,
        classroom_model.topic_id_to_prerequisite_topic_ids,
        classroom_model.is_published,
        classroom_model.is_diagnostic_test_enabled,
        thumbnail_data, banner_data,
        classroom_model.index
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
        if topic_id in classroom.get_topic_ids():
            return classroom.url_fragment
    return str(constants.CLASSROOM_URL_FRAGMENT_FOR_UNATTACHED_TOPICS)


def get_classroom_name_for_topic_id(topic_id: str) -> str:
    """Returns the classroom name for the provided topic id.

    Args:
        topic_id: str. The topic id.

    Returns:
        str. Returns the classroom name for a topic.
    """
    classrooms = get_all_classrooms()
    for classroom in classrooms:
        if topic_id in classroom.get_topic_ids():
            return classroom.name
    return str(constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS)


def get_new_classroom_id() -> str:
    """Returns a new classroom ID.

    Returns:
        str. A new classroom ID.
    """
    return classroom_models.ClassroomModel.generate_new_classroom_id()


def update_classroom(
    classroom: classroom_config_domain.Classroom,
    strict: bool = False
) -> None:
    """Saves a Clasroom domain object to the datastore.

    Args:
        classroom: Classroom. The classroom domain object for the given
            classroom.
        strict: bool. Whether to perform strict checking.
    """
    classroom.validate(strict)
    classroom_model = classroom_models.ClassroomModel.get(
        classroom.classroom_id, strict=False)

    if not classroom_model:
        return

    classroom_model.name = classroom.name
    classroom_model.url_fragment = classroom.url_fragment
    classroom_model.course_details = classroom.course_details
    classroom_model.topic_list_intro = classroom.topic_list_intro
    classroom_model.topic_id_to_prerequisite_topic_ids = (
        classroom.topic_id_to_prerequisite_topic_ids)
    classroom_model.teaser_text = classroom.teaser_text
    classroom_model.is_published = classroom.is_published
    classroom_model.is_diagnostic_test_enabled = (
        classroom.is_diagnostic_test_enabled)
    classroom_model.thumbnail_filename = (
        classroom.thumbnail_data.filename
    )
    classroom_model.thumbnail_bg_color = (
        classroom.thumbnail_data.bg_color
    )
    classroom_model.thumbnail_size_in_bytes = (
        classroom.thumbnail_data.size_in_bytes
    )
    classroom_model.banner_filename = classroom.banner_data.filename
    classroom_model.banner_bg_color = classroom.banner_data.bg_color
    classroom_model.banner_size_in_bytes = (
        classroom.banner_data.size_in_bytes
    )
    classroom_model.index = classroom.index

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
    classroom_count = len(get_all_classrooms())
    classroom_models.ClassroomModel.create(
        classroom.classroom_id,
        classroom.name,
        classroom.url_fragment,
        classroom.course_details,
        classroom.teaser_text,
        classroom.topic_list_intro,
        classroom.topic_id_to_prerequisite_topic_ids,
        classroom.is_published,
        classroom.is_diagnostic_test_enabled,
        classroom.thumbnail_data.filename,
        classroom.thumbnail_data.bg_color,
        classroom.thumbnail_data.size_in_bytes,
        classroom.banner_data.filename,
        classroom.banner_data.bg_color,
        classroom.banner_data.size_in_bytes,
        classroom_count
    )


def create_new_default_classroom(
        classroom_id: str, name: str, url_fragment: str
    ) -> classroom_config_domain.Classroom:
    """Creates a new default classroom model.

    Args:
        classroom_id: str. The id of new classroom.
        name: str. The name of the classroom.
        url_fragment: str. The url fragment of the classroom.

    Returns:
        Classroom. The domain object representing a classroom.
    """
    classroom_count = len(get_all_classrooms())
    classroom = classroom_config_domain.Classroom(
        classroom_id=classroom_id, name=name, url_fragment=url_fragment,
        teaser_text='', course_details='', topic_list_intro='',
        topic_id_to_prerequisite_topic_ids={},
        is_published=feconf.DEFAULT_CLASSROOM_PUBLICATION_STATUS,
        is_diagnostic_test_enabled=(
            feconf.DEFAULT_CLASSROOM_DIAGNOSTIC_TEST_STATUS),
        thumbnail_data=classroom_config_domain.ImageData('', '', 0),
        banner_data=classroom_config_domain.ImageData('', '', 0),
        index=classroom_count
    )

    classroom.require_valid_name(name)
    classroom.require_valid_url_fragment(url_fragment)

    classroom_models.ClassroomModel.create(
        classroom.classroom_id,
        classroom.name,
        classroom.url_fragment,
        classroom.course_details,
        classroom.teaser_text,
        classroom.topic_list_intro,
        classroom.topic_id_to_prerequisite_topic_ids,
        classroom.is_published,
        classroom.is_diagnostic_test_enabled,
        classroom.thumbnail_data.filename,
        classroom.thumbnail_data.bg_color,
        classroom.thumbnail_data.size_in_bytes,
        classroom.banner_data.filename,
        classroom.banner_data.bg_color,
        classroom.banner_data.size_in_bytes,
        classroom.index
    )

    return classroom


def delete_classroom(classroom_id: str) -> None:
    """Deletes the classroom model.

    Args:
        classroom_id: str. ID of the classroom which is to be deleted.
    """
    classrooms = get_all_classrooms()

    for classroom in classrooms:
        if classroom.classroom_id == classroom_id:
            index_to_delete = classroom.index
            break

    for classroom in classrooms:
        if classroom.index > index_to_delete:
            classroom.index -= 1
            update_classroom(classroom)

    classroom_models.ClassroomModel.get(classroom_id).delete()


@transaction_services.run_in_transaction_wrapper
def update_classroom_id_to_index_mappings(
    classroom_index_mappings: List[
        classroom_config_domain.ClassroomIdToIndexDict
    ]
) -> None:
    """Updates the index of multiple classrooms.

    Args:
        classroom_index_mappings: List[ClassroomIdToIndex]. The domain
            objects for the given mapping.

    Raises:
        Exception. No mapping found for the given classroom ID.
    """

    for classroom_index_mapping in classroom_index_mappings:
        classroom_id = classroom_index_mapping['classroom_id']
        classroom_index = int(classroom_index_mapping['classroom_index'])

        classroom = get_classroom_by_id(classroom_id)
        classroom.index = classroom_index
        update_classroom(classroom)
