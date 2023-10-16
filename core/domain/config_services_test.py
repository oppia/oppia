# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for config services."""

from __future__ import annotations

from core.domain import config_domain
from core.domain import config_services
from core.tests import test_utils


class ConfigServicesTests(test_utils.GenericTestBase):
    """Tests for config services."""

    def test_can_set_config_property(self) -> None:
        self.assertEqual(
            config_domain.CLASSROOM_PAGES_DATA.value, [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': '',
                'topic_list_intro': ''
            }]
        )
        config_services.set_property(
            'admin', 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': 'Detailed math classroom.',
                'topic_list_intro': ''
            }]
        )
        self.assertEqual(
            config_domain.CLASSROOM_PAGES_DATA.value, [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': 'Detailed math classroom.',
                'topic_list_intro': ''
            }]
        )

    def test_can_not_set_config_property_with_invalid_config_property_name(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No config property with name new_config_property_name found.'):
            config_services.set_property(
                'admin', 'new_config_property_name', True)

    def test_can_revert_config_property(self) -> None:
        self.assertEqual(
            config_domain.CLASSROOM_PAGES_DATA.value, [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': '',
                'topic_list_intro': ''
            }])
        config_services.set_property(
            'admin', 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': 'Detailed math classroom.',
                'topic_list_intro': ''
            }])
        self.assertEqual(
            config_domain.CLASSROOM_PAGES_DATA.value, [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': 'Detailed math classroom.',
                'topic_list_intro': ''
            }])
        config_services.revert_property(
            'admin', 'classroom_pages_data')
        self.assertEqual(
            config_domain.CLASSROOM_PAGES_DATA.value, [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': '',
                'topic_list_intro': ''
            }])

    def test_can_not_revert_config_property_with_invalid_config_property_name(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No config property with name new_config_property_name found.'):
            config_services.revert_property('admin', 'new_config_property_name')
