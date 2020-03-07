# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/case_change_service.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils

import python_utils

from . import case_change_service 

class CheckCaseChangeServiceTests(test_utils.GenericTestBase):

    def test_camelize_string(self):
        test_strings = [
            'test_string',
            'testString',
            ]
        expected_results = [
            'testString',
            'testString'
            ]
        
        for i in python_utils.RANGE(len(test_strings)):
            string = test_strings[i]
            expected_result = expected_results[i]
            result = case_change_service.camelize_string(string)
            self.assertEqual(result, expected_result)

    def test_camelize(self):
        test_objects = [
            [
                {
                    'key_one': 0,
                    'key_two': {
                        'key_three': 0,
                        'key_four': [
                            {
                                'key_five': 0
                            }
                        ]
                    }
                },
                {
                    'keySix': 0
                }
            ],
            {
                'key_one': 'value_one',
                'key_two': {
                    'key_Three': 'value_two'
                }
            },
            [
                'string_one',
                'string_two'
            ]
        ]

        expected_results = [
            [
                {
                    'keyOne': 0,
                    'keyTwo': {
                        'keyThree': 0,
                        'keyFour': [
                            {
                                'keyFive': 0
                            }
                        ]
                    }
                },
                {
                    'keySix': 0
                }
            ],
            {
                'keyOne': 'value_one',
                'keyTwo': {
                    'keyThree': 'value_two'
                }
            },
            [
                'string_one',
                'string_two'
            ]
        ]

        for i in python_utils.RANGE(len(test_objects)):
            test_object = test_objects[i]
            expected_result = expected_results[i]
            result = case_change_service.camelize(test_object)
            self.assertEqual(result, expected_result)
