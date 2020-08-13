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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import classroom_domain
from core.domain import config_domain


def get_classroom_url_fragment_for_topic_id(topic_id):
    """Returns the classroom url fragment for the provided topic id.

    Args:
        topic_id: str. The topic id.

    Returns:
        str. Returns the classroom url fragment for a topic.
    """
    for classroom_dict in config_domain.CLASSROOM_PAGES_DATA.value:
        if topic_id in classroom_dict['topic_ids']:
            return classroom_dict['url_fragment']
    return constants.CLASSROOM_URL_FRAGMENT_FOR_UNATTACHED_TOPICS


def get_classroom_by_url_fragment(classroom_url_fragment):
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
