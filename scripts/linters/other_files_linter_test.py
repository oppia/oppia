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

from __future__ import annotations

import io
import multiprocessing
import os

from core import utils
from core.tests import test_utils

from . import other_files_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')


class CustomLintChecksManagerTests(test_utils.LinterTestBase):
    """Tests for CustomLintChecksManager."""

    def setUp(self):
        super(CustomLintChecksManagerTests, self).setUp()
        self.verbose_mode_enabled = False
        self.dependencies_file = io.StringIO(
            '{\"dependencies\":{\"frontend\":{\"guppy\":'
            '{\"version\": \"0.1\"},\"skulpt-dist\":{\"version\": \"0.2\"}'
            ',\"midiJs\":{\"version\": \"0.4\"}}}}')
        self.package_file = io.StringIO(
            '{\"dependencies\":{\"nerdamer\":\"^0.6\"}}')
        self.files_in_typings_dir = [
            'guppy-defs-0.1.d.ts',
            'skulpt-defs-0.2.d.ts',
            'midi-defs-0.4.d.ts',
            'nerdamer-defs-0.6.d.ts'
        ]
        def mock_open_file(path, unused_permissions):
            if path == other_files_linter.DEPENDENCIES_JSON_FILE_PATH:
                return self.dependencies_file
            elif path == other_files_linter.PACKAGE_JSON_FILE_PATH:
                return self.package_file
        def mock_listdir(unused_path):
            return self.files_in_typings_dir
        self.open_file_swap = self.swap(
            utils, 'open_file', mock_open_file)
        self.listdir_swap = self.swap(os, 'listdir', mock_listdir)

    def test_check_valid_pattern_in_app_dev_yaml(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                '# Just a comment',
                '# Third party files:',
                '- third_party/static/bootstrap-4.3.1/')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_skip_files_in_app_dev_yaml()
            expected_error_messages = ['SUCCESS  App dev file check passed']
            self.assertEqual(
                error_messages.get_report(), expected_error_messages)
            self.assertEqual('App dev file', error_messages.name)
            self.assertFalse(error_messages.failed)

    def test_check_invalid_pattern_in_app_dev_yaml(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                '# Third party files:', '- third_party/static/bootstrap-4.3/')

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_skip_files_in_app_dev_yaml()
        self.assertEqual(len(error_messages.get_report()), 2)
        self.assertTrue(
            'Pattern on line 2 doesn\'t match any file or directory' in
            error_messages.get_report()[0])
        self.assertEqual('App dev file', error_messages.name)
        self.assertTrue(error_messages.failed)

    def test_check_valid_pattern(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                '// This is a comment.',
                'plugins: [',
                '   new HtmlWebpackPlugin({',
                '       chunks: [\'about\'],',
                '       filename: \'about-page.mainpage.html\',',
                '       meta: defaultMeta,',
                '       template: commonPrefix + \'/pages/about-page/about-page'
                '.mainpage.html\',',
                '       minify: htmlMinifyConfig,',
                '       inject: false', '}),]'
            )

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_webpack_config_file()
        expected_error_messages = [
            'SUCCESS  Webpack config file check passed']
        self.assertEqual(
            error_messages.get_report(), expected_error_messages)
        self.assertEqual('Webpack config file', error_messages.name)
        self.assertFalse(error_messages.failed)

    def test_check_invalid_pattern_with_some_keys_missing(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'plugins: [',
                '   new HtmlWebpackPlugin({',
                '       chunks: [\'about\'],',
                '       filename: \'about-page.mainpage.html\',',
                '       minify: htmlMinifyConfig,',
                '       inject: false', '}),]'
            )

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_webpack_config_file()
        expected_error_messages = [
            'Line 2: The following keys: meta, template are missing in '
            'HtmlWebpackPlugin block in webpack.common.config.ts',
            'FAILED  Webpack config file check failed']
        self.assertEqual(
            error_messages.get_report(), expected_error_messages)
        self.assertEqual('Webpack config file', error_messages.name)
        self.assertTrue(error_messages.failed)

    def test_check_invalid_pattern_without_all_keys(self):
        def mock_readlines(unused_self, unused_filepath):
            return (
                'plugins: [',
                '   new HtmlWebpackPlugin({',
                '}),]'
            )

        readlines_swap = self.swap(
            pre_commit_linter.FileCache, 'readlines', mock_readlines)
        with readlines_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_webpack_config_file()
        expected_error_messages = [
            'Line 2: The following keys: chunks, filename, meta, template,'
            ' minify, inject are missing in HtmlWebpackPlugin block in '
            'webpack.common.config.ts', 'FAILED  Webpack config file check'
            ' failed']
        self.assertEqual(
            error_messages.get_report(), expected_error_messages)
        self.assertEqual('Webpack config file', error_messages.name)
        self.assertTrue(error_messages.failed)

    def test_check_third_party_libs_type_defs(self):
        expected_error_messages = [
            'SUCCESS  Third party type defs check passed']
        with self.open_file_swap, self.listdir_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_third_party_libs_type_defs()
            self.assertEqual(
                error_messages.get_report(), expected_error_messages)
        self.assertEqual('Third party type defs', error_messages.name)
        self.assertFalse(error_messages.failed)

    def test_check_third_party_libs_type_defs_verbose(self):
        self.verbose_mode_enabled = True
        expected_error_messages = [
            'SUCCESS  Third party type defs check passed']
        with self.open_file_swap, self.listdir_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_third_party_libs_type_defs()
            self.assertEqual(
                error_messages.get_report(), expected_error_messages)
            self.assertEqual('Third party type defs', error_messages.name)
            self.assertFalse(error_messages.failed)

    def test_check_third_party_libs_type_defs_multiple(self):
        self.files_in_typings_dir.append('guppy-defs-0.2.d.ts')
        expected_error_messages = 'FAILED  Third party type defs check failed'
        with self.open_file_swap, self.listdir_swap, self.print_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_third_party_libs_type_defs()
            self.assertEqual(
                error_messages.get_report()[1], expected_error_messages)
            self.assert_same_list_elements([
                'There are multiple type definitions for Guppy in the '
                'typings dir.'], error_messages.get_report())
            self.assertEqual('Third party type defs', error_messages.name)
            self.assertTrue(error_messages.failed)

    def test_check_third_party_libs_type_defs_no_type_defs(self):
        self.files_in_typings_dir = [
            'skulpt-defs-0.2.d.ts',
            'math-expressions-defs-0.3.d.ts',
            'midi-defs-0.4.d.ts',
            'nerdamer-defs-0.6.d.ts'
        ]
        expected_error_messages = 'FAILED  Third party type defs check failed'
        with self.open_file_swap, self.listdir_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_third_party_libs_type_defs()
            self.assertEqual(
                error_messages.get_report()[1], expected_error_messages)
            self.assert_same_list_elements([
                'There are no type definitions for Guppy in the '
                'typings dir.'], error_messages.get_report())
            self.assertEqual('Third party type defs', error_messages.name)
            self.assertTrue(error_messages.failed)

    def test_check_third_party_libs_type_defs_wrong_version(self):
        self.files_in_typings_dir = [
            'guppy-defs-0.2.d.ts',
            'skulpt-defs-0.2.d.ts',
            'math-expressions-defs-0.3.d.ts',
            'midi-defs-0.4.d.ts',
            'nerdamer-defs-0.6.d.ts'
        ]
        expected_error_messages = 'FAILED  Third party type defs check failed'
        with self.open_file_swap, self.listdir_swap, self.print_swap:
            error_messages = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_third_party_libs_type_defs()
            self.assertEqual(
                error_messages.get_report()[1], expected_error_messages)
            self.assert_same_list_elements([
                'Type definitions for Guppy are not up to date. The '
                'current version of Guppy is 0.1 and the type definitions '
                'are for version 0.2. Please refer typings/README.md '
                'for more details.'], error_messages.get_report())
            self.assertEqual('Third party type defs', error_messages.name)
            self.assertTrue(error_messages.failed)

    def test_check_github_workflows_use_merge_action_checks(self):
        def mock_listdir(unused_path):
            return ['pass.yml', 'fail.yml', 'README']

        def mock_read(path):
            if path.endswith('pass.yml'):
                return '\n'.join([
                    'name: Passing workflow file',
                    'on:',
                    '  push:',
                    '    branches:',
                    '      - develop',
                    '',
                    'jobs:',
                    '  run:',
                    '    steps:',
                    '      - uses: actions/checkout@v2',
                    '      - uses: ./.github/actions/merge',
                    '      - run: echo "oppia"',
                ])
            elif path.endswith('fail.yml'):
                return '\n'.join([
                    'name: Passing workflow file',
                    'on:',
                    '  push:',
                    '    branches:',
                    '      - develop',
                    '',
                    'jobs:',
                    '  run:',
                    '    steps:',
                    '      - uses: actions/checkout@v2',
                    '      - run: echo "oppia"',
                ])
            raise AssertionError(
                'mock_read called with unexpected path %s' % path)

        listdir_swap = self.swap_with_checks(
            os, 'listdir', mock_listdir,
            expected_args=[(other_files_linter.WORKFLOWS_DIR,)])
        read_swap = self.swap(FILE_CACHE, 'read', mock_read)

        expected = [
            '%s --> Job run does not use the .github/actions/merge action.' %
            os.path.join(other_files_linter.WORKFLOWS_DIR, 'fail.yml'),
            'FAILED  Github workflows use merge action check failed',
        ]

        with listdir_swap, read_swap:
            task_results = other_files_linter.CustomLintChecksManager(
                FILE_CACHE).check_github_workflows_use_merge_action()
            self.assertEqual(task_results.get_report(), expected)

    def test_perform_all_lint_checks(self):
        lint_task_report = other_files_linter.CustomLintChecksManager(
            FILE_CACHE).perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_get_linters_with_success(self):
        custom_linter, third_party_linter = (
            other_files_linter.get_linters(FILE_CACHE))
        self.assertTrue(
            isinstance(
                custom_linter, other_files_linter.CustomLintChecksManager))
        self.assertEqual(third_party_linter, None)
