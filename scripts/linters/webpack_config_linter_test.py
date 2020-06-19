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

"""Unit tests for webpack_config_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing

from core.tests import test_utils

from . import pre_commit_linter
from . import webpack_config_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files  # pylint: disable=redefined-builtin


class AppDevLinterTests(test_utils.GenericTestBase):
    """Tests for the webpack_config_linter.py."""

    def test_check_valid_pattern(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'plugins: [', 'new HtmlWebpackPlugin({', 'chunks: [\'about\'],',
                'filename: \'about-page.mainpage.html\',', 'meta: defaultMeta,',
                'template:',
                'commonPrefix + \'/pages/about-page/about-page.mainpage.'
                'html\',', 'minify: htmlMinifyConfig,', 'inject: false', '}),]')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            summary_messages = (
                webpack_config_linter.check_webpack_config_file(
                    FILE_CACHE, True))
            expected_summary_messages = [
                'SUCCESS  webpack config file checks passed']
            self.assertEqual(summary_messages, expected_summary_messages)

    def test_check_invalid_pattern(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'plugins: [', 'new HtmlWebpackPlugin({', '}),]')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            summary_messages = (
                webpack_config_linter.check_webpack_config_file(
                    FILE_CACHE, True))
            expected_summary_messages = [
                'Line 2: The following keys: chunks, filename, meta, template,'
                ' minify, inject are missing in HtmlWebpackPlugin block in '
                'webpack.common.config.ts', 'FAILED  webpack config file checks'
                ' failed, see messages above for missing keys in '
                'HtmlWebpackPlugin block in webpack.common.config.ts file']
            self.assertEqual(summary_messages, expected_summary_messages)
