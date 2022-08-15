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
# successful migration, this file should be renamed as classroom_services and
# the exiting classroom service file should be deleted, until then both of
# the files will exist simultaneously.

"""Commands for operations on classrooms."""

from __future__ import annotations

from core.domain import classroom_config_domain
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import classroom_models

(classroom_models,) = models.Registry.import_models([models.NAMES.classroom])


def get_classroom_id_to_classroom_name_dict():
    pass

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
    return (
        classroom_model.id,
        classroom_model.name,
        classroom_model.url_fragment,
        classroom_model.course_details,
        classroom_model.topic_list_intro,
        classroom_model.topic_id_to_prerequisite_topic_ids
    )


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
    url_fragment: str,
    strict: bool = True
) -> Optional[classroom_config_domain.Classroom]:
    """Returns a domain object representing a classroom.

    Args:
        url_fragment: str. The url fragment of the classroom.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        Classroom or None. The domain object representing a classroom with the
        given id, or None if it does not exist.
    """
    classroom_model = classroom_models.ClassroomModel.get_by_url_fragment(
        classroom_id, strict=strict)
    if classroom_model:
        return get_classroom_from_classroom_model(classroom_model)
    else:
        return None

def get_new_classroom_id() -> str:
    """Returns a new classroom ID.

    Returns:
        str. A new classroom ID.
    """
    return classroom_models.ClassroomModel.generate_new_blog_post_id()

def create_new_default_classroom():
    """Creates a new default classroom.

    Returns:
        Classroom. A default classroom object.
    """
    classroom_id = get_new_classroom_id()
    default_classroom_name = ''
    default
    classroom_model = classroom_models.ClassroomModel.create(
        classroom_id,
        '
    )


def update_classroom_properties():
    pass


def delete_classroom():
    pass