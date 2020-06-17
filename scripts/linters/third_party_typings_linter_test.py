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

import os

from core.tests import test_utils

import python_utils

from . import linter_utils
from . import third_party_typings_linter


class ThirdPartyTypingsLinterTests(test_utils.GenericTestBase):
    """Tests for the third_party_typings_linter."""

    def setUp(self):
        super(ThirdPartyTypingsLinterTests, self).setUp()
        self.verbose_mode_enabled = False
        self.manifest_file = python_utils.string_io(
            buffer_value='{\"dependencies\":{\"frontend\":{\"guppy\":'
            '{\"version\": \"0.1\"},\"skulpt-dist\":{\"version\": \"0.2\"}'
            ',\"mathExpressions\":{\"version\": \"0.3\"},\"midiJs\":'
            '{\"version\": \"0.4\"}}}}')
        self.package_file = python_utils.string_io(
            buffer_value='{\"dependencies\":{\"wavesurfer.js\":\"0.5\",'
            '\"nerdamer\":\"^0.6\"}}')
        self.files_in_typings_dir = [
            'guppy-defs-0.1.d.ts',
            'skulpt-defs-0.2.d.ts',
            'math-expressions-defs-0.3.d.ts',
            'midi-defs-0.4.d.ts',
            'wavesurfer-defs-0.5.d.ts',
            'nerdamer-defs-0.6.d.ts'
        ]
        self.print_arr = []
        def mock_open_file(path, unused_permissions):
            if path == third_party_typings_linter.MANIFEST_JSON_FILE_PATH:
                return self.manifest_file
            elif path == third_party_typings_linter.PACKAGE_JSON_FILE_PATH:
                return self.package_file
        def mock_listdir(unused_path):
            return self.files_in_typings_dir
        def mock_print(msg):
            self.print_arr.append(msg)
        self.open_file_swap = self.swap(
            python_utils, 'open_file', mock_open_file)
        self.listdir_swap = self.swap(os, 'listdir', mock_listdir)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)


    def test_check_third_party_libs_type_defs(self):
        expected_summary_messages = [
            '%s Third party type defs check passed' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX)]
        with self.open_file_swap, self.listdir_swap:
            summary_messages = (
                third_party_typings_linter.check_third_party_libs_type_defs(
                    self.verbose_mode_enabled))
            self.assertEqual(summary_messages, expected_summary_messages)

    def test_check_third_party_libs_type_defs_verbose(self):
        self.verbose_mode_enabled = True
        expected_summary_messages = [
            '%s Third party type defs check passed' % (
                linter_utils.SUCCESS_MESSAGE_PREFIX)]
        with self.open_file_swap, self.listdir_swap:
            summary_messages = (
                third_party_typings_linter.check_third_party_libs_type_defs(
                    self.verbose_mode_enabled))
            self.assertEqual(summary_messages, expected_summary_messages)

    def test_check_third_party_libs_type_defs_multiple(self):
        self.files_in_typings_dir.append('guppy-defs-0.2.d.ts')
        expected_summary_messages = [
            '%s Third party type defs check failed, see messages '
            'above for more detail.' % (
                linter_utils.FAILED_MESSAGE_PREFIX)]
        with self.open_file_swap, self.listdir_swap, self.print_swap:
            summary_messages = (
                third_party_typings_linter.check_third_party_libs_type_defs(
                    self.verbose_mode_enabled))
            self.assertEqual(summary_messages, expected_summary_messages)
            self.assertTrue(
                'There are multiple type definitions for Guppy in the '
                'typings dir.' in self.print_arr)

    def test_check_third_party_libs_type_defs_no_type_defs(self):
        self.files_in_typings_dir = [
            'skulpt-defs-0.2.d.ts',
            'math-expressions-defs-0.3.d.ts',
            'midi-defs-0.4.d.ts',
            'wavesurfer-defs-0.5.d.ts',
            'nerdamer-defs-0.6.d.ts'
        ]
        expected_summary_messages = [
            '%s Third party type defs check failed, see messages '
            'above for more detail.' % (
                linter_utils.FAILED_MESSAGE_PREFIX)]
        with self.open_file_swap, self.listdir_swap, self.print_swap:
            summary_messages = (
                third_party_typings_linter.check_third_party_libs_type_defs(
                    self.verbose_mode_enabled))
            self.assertEqual(summary_messages, expected_summary_messages)
            self.assertTrue(
                'There are no type definitions for Guppy in the '
                'typings dir.' in self.print_arr)

    def test_check_third_party_libs_type_defs_wrong_version(self):
        self.files_in_typings_dir = [
            'guppy-defs-0.2.d.ts',
            'skulpt-defs-0.2.d.ts',
            'math-expressions-defs-0.3.d.ts',
            'midi-defs-0.4.d.ts',
            'wavesurfer-defs-0.5.d.ts',
            'nerdamer-defs-0.6.d.ts'
        ]
        expected_summary_messages = [
            '%s Third party type defs check failed, see messages '
            'above for more detail.' % (
                linter_utils.FAILED_MESSAGE_PREFIX)]
        with self.open_file_swap, self.listdir_swap, self.print_swap:
            summary_messages = (
                third_party_typings_linter.check_third_party_libs_type_defs(
                    self.verbose_mode_enabled))
            self.assertEqual(summary_messages, expected_summary_messages)
            self.assertTrue(
                'Type definitions for Guppy are not up to date. The '
                'current version of Guppy is 0.1 and the type definitions '
                'are for version 0.2. Please refer typings/README.md '
                'for more details.' in self.print_arr)
