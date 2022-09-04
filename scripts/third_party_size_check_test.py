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

"""Unit tests for scripts/third_party_size_check.py"""

from __future__ import annotations

import builtins
import os
import shutil
import sys

from core import utils
from core.tests import test_utils
from scripts import third_party_size_check


class ThirdPartySizeCheckTests(test_utils.GenericTestBase):
    """Unit tests for scripts/third_party_size_check.py"""

    def test_get_skip_files_list(self) -> None:
        skip_files_list = (
            'random_file.py\n'
            '# This is a comment\n'
            'new_file.py')
        with open('dummy_skip_file_list.txt', 'w', encoding='utf-8') as f:
            f.write(skip_files_list)

        dummy_file_object = open(
            'dummy_skip_file_list.txt', 'r', encoding='utf-8')

        swap_open = self.swap_with_checks(
            utils, 'open_file',
            lambda *unused_args, **unused_kwargs: dummy_file_object,
            expected_args=(('.gcloudignore', 'r'),))

        with swap_open:
            returned_list = third_party_size_check._get_skip_files_list() # pylint: disable=protected-access

        skipped_files = ['random_file.py', 'new_file.py']
        expected_skipped_files_list = [
            os.path.join(os.getcwd(), file) for file in skipped_files]
        print(expected_skipped_files_list)
        self.assertEqual(returned_list, expected_skipped_files_list)

        dummy_file_object.close()
        os.remove('dummy_skip_file_list.txt')

    def test_get_skip_files_list_throws_error(self) -> None:
        err = IOError('XYZ error.')
        print_swap = self.swap_with_checks(
            builtins, 'print', lambda _: None,
            expected_args=((err,),))
        def mock_open_file(*unused_args) -> None:
            raise err
        swap_open = self.swap_with_checks(
            utils, 'open_file', mock_open_file,
            expected_args=(('.gcloudignore', 'r'),))
        swap_sys_exit = self.swap(sys, 'exit', lambda _: None)

        with swap_open, swap_sys_exit, print_swap:
            third_party_size_check._get_skip_files_list() # pylint: disable=protected-access

    def test_check_size_in_dir(self) -> None:
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir', mode=0o777)
        os.mkdir('dummy_dir/dummy_dir2', mode=0o777)
        with open('dummy_dir/file1.py', 'w', encoding='utf-8') as f:
            f.write('Text message')
        with open('dummy_dir/dummy_dir2/file2.py', 'w', encoding='utf-8') as f:
            f.write('Text message')

        files_count = third_party_size_check._check_size_in_dir( # pylint: disable=protected-access
            os.path.join(os.getcwd(), 'dummy_dir'), [])
        self.assertEqual(files_count, 2)
        shutil.rmtree('dummy_dir')

    def test_check_size_in_dir_ignores_files_to_be_skipped(self) -> None:
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir', mode=0o777)
        with open('dummy_dir/file1.py', 'w', encoding='utf-8') as f:
            f.write('Text message')
        with open('dummy_dir/file2.py', 'w', encoding='utf-8') as f:
            f.write('Text message')
        with open('dummy_dir/random_file3.py', 'w', encoding='utf-8') as f:
            f.write('Text message')

        files_count = third_party_size_check._check_size_in_dir( # pylint: disable=protected-access
            os.path.join(os.getcwd(), 'dummy_dir'), [
                os.path.join(os.getcwd(), 'dummy_dir', 'file1.py'),
                os.path.join(os.getcwd(), 'dummy_dir', 'random*.py')])
        self.assertEqual(files_count, 1)
        shutil.rmtree('dummy_dir')

    def test_check_third_party_size_pass(self) -> None:
        print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        swap_check_size_in_dir = self.swap(
            third_party_size_check, '_check_size_in_dir',
            lambda *unused_args: 100)
        with print_swap, swap_check_size_in_dir:
            third_party_size_check._check_third_party_size() # pylint: disable=protected-access

        self.assertIn(
            '    The size of third-party folder is within the limits.',
            print_arr)

    def test_check_third_party_size_fail(self) -> None:
        print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        swap_check_size_in_dir = self.swap(
            third_party_size_check, '_check_size_in_dir',
            lambda *unused_args: (
                third_party_size_check.THIRD_PARTY_SIZE_LIMIT + 1))
        swap_sys_exit = self.swap(sys, 'exit', lambda _: None)
        with print_swap, swap_check_size_in_dir, swap_sys_exit:
            third_party_size_check._check_third_party_size() # pylint: disable=protected-access

        self.assertIn(
            '    ERROR: The third-party folder size exceeded the %d files'
            ' limit.' % third_party_size_check.THIRD_PARTY_SIZE_LIMIT,
            print_arr)
