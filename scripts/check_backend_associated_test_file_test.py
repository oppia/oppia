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

"""Unit tests for scripts/check_backend_associated_test_file.py."""

from __future__ import annotations

import builtins
import logging
import os
import sys
import tempfile

from core import utils
from core.tests import test_utils
from scripts import check_backend_associated_test_file


class CheckBackendAssociatedTestFileTests(test_utils.GenericTestBase):
    """Unit tests for scripts/check_backend_associated_test_file.py."""

    def setUp(self) -> None:
        super().setUp()
        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.error_arr: list[str] = []
        def mock_error(msg: str) -> None:
            self.error_arr.append(msg)

        self.backend_file = 'backend_file.py'
        self.backend_test_file = 'backend_file_test.py'
        self.frontend_file = 'frontend_file.ts'

        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.swap_logging = self.swap(logging, 'error', mock_error)
        self.swap_exit = self.swap(sys, 'exit', lambda _: None)

    def test_checks_fail_when_a_backend_file_lacks_associated_test_file(
            self) -> None:
        # Creating a backend file.
        temp_file1 = tempfile.NamedTemporaryFile()
        setattr(temp_file1, 'name', self.backend_file)
        # Creating a frontend file.
        temp_file2 = tempfile.NamedTemporaryFile()
        setattr(temp_file2, 'name', self.frontend_file)
        with utils.open_file(self.backend_file, 'w', encoding='utf8') as f:
            f.write('Example code')
        with utils.open_file(self.frontend_file, 'w', encoding='utf8') as f:
            f.write('Example code')

        with self.print_swap, self.swap_logging, self.swap_exit:
            check_backend_associated_test_file.main()

        temp_file1.close()
        temp_file2.close()
        # On Windows system, occasionally this temp file is not deleted.
        if os.path.isfile(self.backend_file):
            os.remove(self.backend_file)
        if os.path.isfile(self.frontend_file):
            os.remove(self.frontend_file)

        self.assertIn(
            'Backend associated test file checks failed.', self.print_arr)
        self.assertIn(
            '\033[1m{}\033[0m needs an associated backend test file.\n'
            .format(self.backend_file), self.error_arr)
        self.assertNotIn(
            '\033[1m{}\033[0m needs an associated backend test file.\n'
            .format(self.frontend_file), self.error_arr)

    def test_pass_when_file_in_exclusion_list_lacks_associated_test(
            self) -> None:
        # Creating a backend file.
        temp_file = tempfile.NamedTemporaryFile()
        setattr(temp_file, 'name', self.backend_file)
        (
            check_backend_associated_test_file.
                FILES_WITHOUT_ASSOCIATED_TEST_FILES.append(self.backend_file))
        with self.print_swap, self.swap_logging, self.swap_exit:
            check_backend_associated_test_file.main()

        temp_file.close()
        # On Windows system, occasionally this temp file is not deleted.
        if os.path.isfile(self.backend_file):
            os.remove(self.backend_file)
        self.assertIn(
            'Backend associated test file checks passed.', self.print_arr)
        self.assertNotIn(
            '\033[1m{}\033[0m needs an associated backend test file.\n'
            .format(self.backend_file), self.error_arr)
        self.assertNotIn(
            '\033[1m{}\033[0m needs an associated backend test file.\n'
            .format(self.frontend_file), self.error_arr)

    def test_checks_pass_when_all_backend_files_have_an_associated_test_file(
            self) -> None:
        temp_file1 = tempfile.NamedTemporaryFile()
        setattr(temp_file1, 'name', self.backend_file)
        # Creating the associated test file of the backend file.
        temp_file2 = tempfile.NamedTemporaryFile()
        setattr(temp_file2, 'name', self.backend_test_file)
        with open(self.backend_test_file, 'w', encoding='utf8') as f:
            f.write('Example code')
        with self.print_swap, self.swap_logging, self.swap_exit:
            check_backend_associated_test_file.main()

        temp_file1.close()
        temp_file2.close()
        # On Windows system, occasionally this temp file is not deleted.
        if os.path.isfile(self.backend_file):
            os.remove(self.backend_file)
        if os.path.isfile(self.backend_test_file):
            os.remove(self.backend_test_file)
        self.assertIn(
            'Backend associated test file checks passed.', self.print_arr)
        self.assertEqual(self.error_arr, [])
        self.assertNotIn(
            '\033[1m{}\033[0m needs an associated backend test file.\n'
            .format(self.frontend_file), self.error_arr)
