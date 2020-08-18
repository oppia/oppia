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

"""Domain objects for Classroom."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils


class Classroom(python_utils.OBJECT):
    """Domain object for a classroom."""

    def __init__(
            self, name, url_fragment, topic_ids,
            course_details, topic_list_intro):
        """Constructs a Classroom domain object.

        Args:
            name: str. The name of the classroom.
            url_fragment: str. The url fragment of the classroom.
            topic_ids: list(str). List of topic ids attached to the classroom.
            course_details: str. Course details for the classroom.
            topic_list_intro: str. Topic list introduction for the classroom.
        """
        self.name = name
        self.url_fragment = url_fragment
        self.topic_ids = topic_ids
        self.course_details = course_details
        self.topic_list_intro = topic_list_intro
