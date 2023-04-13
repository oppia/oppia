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

"""Commands for operations on classrooms."""

from __future__ import annotations

from core.constants import constants
from core.domain import classroom_domain
from core.domain import config_domain

from typing import Optional

# TODO(#17246): Currently, the classroom data is stored in the config model and
# we are planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be deleted.


def get_classroom_url_fragment_for_topic_id(topic_id: str) -> str:
    """Returns the classroom url fragment for the provided topic id.

    Args:
        topic_id: str. The topic id.

    Returns:
        str. Returns the classroom url fragment for a topic.
    """
    for classroom_dict in config_domain.CLASSROOM_PAGES_DATA.value:
        if topic_id in classroom_dict['topic_ids']:
            # As config_property in config domain is set to Any, we need type
            # casting to return a string value.
            return str(classroom_dict['url_fragment'])
        # As it is described in 'core/constants/parse_json_from_ts', we are
        # casting the type to change it from Any to string to return
        # string type value.
    return str(constants.CLASSROOM_URL_FRAGMENT_FOR_UNATTACHED_TOPICS)


def get_classroom_by_url_fragment(
    classroom_url_fragment: str
) -> Optional[classroom_domain.Classroom]:
    """Returns the classroom domain object for the provided classroom url
    fragment.

    Args:
        classroom_url_fragment: str. The classroom url fragment.

    Returns:
        Classroom|None. Returns the classroom domain object if found, else
        returns None.
    """
    for classroom_dict in config_domain.CLASSROOM_PAGES_DATA.value:
        if classroom_url_fragment == classroom_dict['url_fragment']:
            return classroom_domain.Classroom(
                classroom_dict['name'],
                classroom_dict['url_fragment'],
                classroom_dict['topic_ids'],
                classroom_dict['course_details'],
                classroom_dict['topic_list_intro'])
    return None
