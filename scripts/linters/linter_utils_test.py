# coding: utf-8
#
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

"""Unit tests for linter_utils.py."""

from __future__ import annotations

import builtins
import os
import tempfile

from core import utils
from core.tests import test_utils

from . import linter_utils


class RedirectStoutTest(test_utils.GenericTestBase):
    """Tests for the redirect_stdout function."""

    def test_redirect_stdout(self) -> None:
        temp_file = tempfile.NamedTemporaryFile()

        with utils.open_file(temp_file.name, 'r+') as temp_file_contents:
            with linter_utils.redirect_stdout(temp_file_contents):
                print('This is a test')
            temp_file_contents.seek(0)
            data = temp_file_contents.read()
        temp_file.close()

        self.assertEqual(data, 'This is a test\n')


class ListDuplicateItemsTest(test_utils.GenericTestBase):
    """Tests for the get_duplicates_from_list_of_strings function."""

    def test_get_duplicates_from_list_of_strings_with_duplicat_strings(
        self
    ) -> None:
        strings_list = ['A', 'B', 'B', 'C', 'C', 'C']
        duplicates = linter_utils.get_duplicates_from_list_of_strings(
            strings_list)
        self.assertEqual(sorted(duplicates), ['B', 'C'])

    def test_get_duplicates_from_list_of_strings_without_duplicat_strings(
        self
    ) -> None:
        strings_list = ['A', 'B', 'C']
        duplicates = linter_utils.get_duplicates_from_list_of_strings(
            strings_list)
        self.assertEqual(duplicates, [])


class TempDirTest(test_utils.GenericTestBase):
    """Tests for the temp_dir function."""

    def test_directory_only_exists_within_context(self) -> None:
        with linter_utils.temp_dir() as temp_dir_path:
            self.assertTrue(os.path.exists(temp_dir_path))
            self.assertTrue(os.path.isdir(temp_dir_path))
        self.assertFalse(os.path.exists(temp_dir_path))

    def test_directory_is_placed_in_specified_dir(self) -> None:
        with linter_utils.temp_dir(parent=os.getcwd()) as temp_dir_path:
            parent = os.path.abspath(
                os.path.join(temp_dir_path, os.path.pardir))
            self.assertEqual(parent, os.getcwd())

    def test_directory_has_prefix_prepended(self) -> None:
        with linter_utils.temp_dir(prefix='abc') as temp_dir_path:
            self.assertTrue(os.path.basename(temp_dir_path).startswith('abc'))

    def test_directory_has_suffix_appended(self) -> None:
        with linter_utils.temp_dir(suffix='cba') as temp_dir_path:
            self.assertTrue(os.path.basename(temp_dir_path).endswith('cba'))


class ColorMessagePrintTest(test_utils.GenericTestBase):
    """Test for color message print."""

    def setUp(self) -> None:
        super().setUp()
        self.log = ''

        def mock_print(*args: str) -> None:
            """Mock for print."""
            self.log = ' '.join(str(arg) for arg in args)

        self.print_swap = self.swap(builtins, 'print', mock_print)

    def test_print_failure_message_prints_in_red_color(self) -> None:
        message = 'Failure Message'
        red_color_message_prefix = '\033[91m'
        escape_sequence = '\033[0m'

        with self.print_swap:
            linter_utils.print_failure_message(message)

        self.assertEqual(
            self.log,
            '%s%s%s' % (red_color_message_prefix, message, escape_sequence)
        )

    def test_print_success_message_in_green_color(self) -> None:
        message = 'Failure Message'
        green_color_message_prefix = '\033[92m'
        escape_sequence = '\033[0m'

        with self.print_swap:
            linter_utils.print_success_message(message)

        self.assertEqual(
            self.log,
            '%s%s%s' % (green_color_message_prefix, message, escape_sequence)
        )
