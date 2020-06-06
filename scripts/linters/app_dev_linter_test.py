# coding: utf-8
#
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

"""Unit tests for third_party_typings_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing

from core.tests import test_utils

import python_utils

from . import app_dev_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files  # pylint: disable=redefined-builtin


class AppDevLinterTests(test_utils.GenericTestBase):
    """Tests for the app_dev_linter_test.py."""

    def setUp(self):
        super(AppDevLinterTests, self).setUp()
        self.print_arr = []
        def mock_print(msg):
            self.print_arr.append(msg)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_check_valid_pattern_in_app_dev_yaml(self):
        def mock_get_data(unused_self, unused_filepath, unused_mode):
            return '# Third party files:\n- third_party/static/bootstrap-4.3.1/'
        get_data_swap = self.swap(
            pre_commit_linter.FileCache, '_get_data', mock_get_data)
        with self.print_swap, get_data_swap:
            summary_messages = (
                app_dev_linter.check_skip_files_in_app_dev_yaml(
                    FILE_CACHE, True))
            expected_summary_messages = ['SUCCESS   app_dev file check passed']
            self.assertEqual(summary_messages, expected_summary_messages)

    def test_check_invalid_pattern_in_app_dev_yaml(self):
        def mock_get_data(unused_self, unused_filepath, unused_mode):
            return '# Third party files:\n- third_party/static/bootstrap-4.3/'
        get_data_swap = self.swap(
            pre_commit_linter.FileCache, '_get_data', mock_get_data)
        with self.print_swap, get_data_swap:
            summary_messages = (
                app_dev_linter.check_skip_files_in_app_dev_yaml(
                    FILE_CACHE, True))
            expected_summary_messages = (
                'FAILED   app_dev file coverage check failed, see messages '
                'above for invalid file names in app_dev.yaml file')
        self.assertEqual(summary_messages[1], expected_summary_messages)
        self.assertTrue(
            'Pattern on line 2 doesn\'t match any file or directory' in
            summary_messages[0])
