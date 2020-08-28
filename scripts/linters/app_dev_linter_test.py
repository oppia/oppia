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

"""Unit tests for app_dev_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing

from core.tests import test_utils

from . import app_dev_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files


class AppDevLinterTests(test_utils.GenericTestBase):
    """Tests for the app_dev_linter.py."""

    def test_check_valid_pattern_in_app_dev_yaml(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                '# Just a comment',
                '# Third party files:',
                '- third_party/static/bootstrap-4.3.1/')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            summary_messages = (
                app_dev_linter.check_skip_files_in_app_dev_yaml(
                    FILE_CACHE, True))
            expected_summary_messages = ['SUCCESS  app_dev file check passed']
            self.assertEqual(summary_messages, expected_summary_messages)

    def test_check_invalid_pattern_in_app_dev_yaml(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                '# Third party files:', '- third_party/static/bootstrap-4.3/')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            summary_messages = (
                app_dev_linter.check_skip_files_in_app_dev_yaml(
                    FILE_CACHE, True))
        self.assertEqual(len(summary_messages), 2)
        self.assertTrue(
            'Pattern on line 2 doesn\'t match any file or directory' in
            summary_messages[0])
