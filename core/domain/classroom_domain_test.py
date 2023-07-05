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

"""Unit tests for classroom_domain.py"""

from __future__ import annotations

from core.domain import classroom_domain
from core.tests import test_utils


class ClassroomDomainTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        classroom_data = classroom_domain.Classroom(
            'exp', 'exp/', [], 'general details', 'general intro')
        self.assertEqual(classroom_data.name, 'exp')
        self.assertEqual(classroom_data.url_fragment, 'exp/')
        self.assertEqual(classroom_data.topic_ids, [])
        self.assertEqual(classroom_data.course_details, 'general details')
        self.assertEqual(classroom_data.topic_list_intro, 'general intro')

    def test_to_dict_returns_correct_dict(self) -> None:
        classroom_data = classroom_domain.Classroom(
            'exp', 'exp/', [], 'general details', 'general intro')
        self.assertEqual(
            classroom_data.to_dict(),
            {
                'name': classroom_data.name,
                'url_fragment': classroom_data.url_fragment,
                'topic_ids': classroom_data.topic_ids,
                'course_details': classroom_data.course_details,
                'topic_list_intro': classroom_data.topic_list_intro
            }
        )
