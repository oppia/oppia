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

"""Unit tests for scripts/clean_test.py."""

from __future__ import annotations

import os
import shutil

from core.tests import test_utils

from typing import List, Literal

from . import clean


class CleanTests(test_utils.GenericTestBase):
    """Test the methods for clean script."""

    def test_delete_directory_with_missing_dir(self) -> None:
        check_function_calls = {
            'rmtree_is_called': False
        }
        expected_check_function_calls = {
            'rmtree_is_called': False
        }
        def mock_rmtree(unused_path: str) -> None:
            check_function_calls['rmtree_is_called'] = True
        def mock_exists(unused_path: str) -> Literal[False]:
            return False

        rmtree_swap = self.swap(shutil, 'rmtree', mock_rmtree)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with rmtree_swap, exists_swap:
            clean.delete_directory_tree('dir_path')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_delete_directory_with_existing_dir(self) -> None:
        check_function_calls = {
            'rmtree_is_called': False
        }
        expected_check_function_calls = {
            'rmtree_is_called': True
        }
        def mock_rmtree(unused_path: str) -> None:
            check_function_calls['rmtree_is_called'] = True
        def mock_exists(unused_path: str) -> Literal[True]:
            return True

        rmtree_swap = self.swap(shutil, 'rmtree', mock_rmtree)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with rmtree_swap, exists_swap:
            clean.delete_directory_tree('dir_path')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_delete_file_with_missing_file(self) -> None:
        check_function_calls = {
            'remove_is_called': False
        }
        expected_check_function_calls = {
            'remove_is_called': False
        }
        def mock_remove(unused_path: str) -> None:
            check_function_calls['remove_is_called'] = True
        def mock_isfile(unused_path: str) -> Literal[False]:
            return False

        remove_swap = self.swap(os, 'remove', mock_remove)
        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        with remove_swap, isfile_swap:
            clean.delete_file('file_path')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_delete_file_with_existing_file(self) -> None:
        check_function_calls = {
            'remove_is_called': False
        }
        expected_check_function_calls = {
            'remove_is_called': True
        }
        def mock_remove(unused_path: str) -> None:
            check_function_calls['remove_is_called'] = True
        def mock_isfile(unused_path: str) -> Literal[True]:
            return True

        remove_swap = self.swap(os, 'remove', mock_remove)
        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        with remove_swap, isfile_swap:
            clean.delete_file('file_path')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls(self) -> None:
        check_function_calls = {
            'delete_directory_tree_is_called': 0,
            'delete_file_is_called': 0
        }
        expected_check_function_calls = {
            'delete_directory_tree_is_called': 10,
            'delete_file_is_called': 4
        }
        def mock_delete_dir(unused_path: str) -> None:
            check_function_calls['delete_directory_tree_is_called'] += 1
        def mock_delete_file(unused_path: str) -> None:
            check_function_calls['delete_file_is_called'] += 1
        def mock_listdir(unused_path: str) -> List[str]:
            return ['some_dir', 'tmpcompiledjs_dir']
        delete_dir_swap = self.swap(
            clean, 'delete_directory_tree', mock_delete_dir)
        delete_file_swap = self.swap(clean, 'delete_file', mock_delete_file)
        listdir_swap = self.swap(os, 'listdir', mock_listdir)

        with delete_dir_swap, delete_file_swap, listdir_swap:
            clean.main(args=[])
        self.assertEqual(check_function_calls, expected_check_function_calls)
