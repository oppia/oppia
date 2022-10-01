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

"""Unit tests for models.py"""

from __future__ import annotations

from core import utils
from core.tests import test_utils

from . import models


class BaseVisualizationTests(test_utils.GenericTestBase):

    def test_get_class_name_correctly(self) -> None:
        self.assertEqual(
            models.BaseVisualization(
                'AnswerFrequencies', {}, True).id, 'BaseVisualization')

    def test_valid_options_dict_raises_no_error(self) -> None:
        base_obj = models.BaseVisualization('AnswerFrequencies', {}, True)
        base_obj.validate()
        sorted_tiles_obj = models.SortedTiles(
            'AnswerFrequencies',
            {
                'header': u'\u00e4',
                'use_percentages': True
            }, True)
        sorted_tiles_obj.validate()

    def test_invalid_options_dict_raises_error(self) -> None:
        error_message = (
            'For visualization BaseVisualization, expected option names %s;'
            ' received names %s' % ([], ['key1']))
        with self.assertRaisesRegex(utils.ValidationError, error_message):
            models.BaseVisualization(
                'AnswerFrequencies', {'key1': 'value1'}, True).validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_invalid_addressed_info_is_supported_raises_error(self) -> None:
        error_message = (
            'For visualization BaseVisualization, expected a bool value for '
            'addressed_info_is_supported; received false')
        with self.assertRaisesRegex(utils.ValidationError, error_message):
            models.BaseVisualization(
                'AnswerFrequencies', {}, 'false').validate()  # type: ignore[arg-type]
