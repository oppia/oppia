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

"""Unit tests for takeout_domain.py"""

from __future__ import annotations

from core.domain import takeout_domain
from core.tests import test_utils


class TakeoutDataTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        user_data = {
                'model_name': {
                    'property1': 'value1',
                    'property2': 'value2'
                }
            }
        takeout_data = takeout_domain.TakeoutData(user_data, [])
        self.assertEqual(takeout_data.user_data, user_data)
        self.assertEqual(takeout_data.user_images, [])


class TakeoutImageTests(test_utils.GenericTestBase):

    def test_that_domain_object_is_created_correctly(self) -> None:
        takeout_image_data = takeout_domain.TakeoutImage(
            'b64_fake_image_data', '/test/')
        self.assertEqual(
            takeout_image_data.b64_image_data, 'b64_fake_image_data')
        self.assertEqual(
            takeout_image_data.image_export_path, '/test/')
