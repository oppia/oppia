# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for MyPy type check runner script."""

from __future__ import annotations

import subprocess

from core.tests import test_utils
from scripts import run_mypy_checks

from typing import Final, List, Optional, Tuple

PYTHON_CMD: Final = 'python3'
MYPY_SCRIPT_MODULE: Final = 'scripts.run_mypy_checks'

# Fixtures for filter_unreachable_errors_for_allowlisted_files tests.
# 'dir1/foo.py' is the file these tests treat as allowlisted; keep it
# in sync with the ALLOWLISTED_FILES swap set up in setUp().
_MYPY_OUTPUT_WITH_ALLOWLISTED_UNREACHABLE_ERROR: Final = (
    'dir1/foo.py:12: error: Statement is unreachable  [unreachable]\n'
    'Found 1 errors in 1 files (checked 5 source files)\n'
)
_MYPY_OUTPUT_WITH_NON_ALLOWLISTED_UNREACHABLE_ERROR: Final = (
    'dir2/bar.py:7: error: Statement is unreachable  [unreachable]\n'
    'Found 1 errors in 1 files (checked 5 source files)\n'
)
_MYPY_OUTPUT_WITH_PYI_ERROR: Final = (
    'dir2/bar.pyi:9: error: Name "NotARealType" is not defined  '
    '[name-defined]\n'
    'Found 1 errors in 1 files (checked 5 source files)\n'
)
_MYPY_OUTPUT_WITH_ALLOWLISTED_UNREACHABLE_AND_PYI_ERROR: Final = (
    'dir1/foo.py:12: error: Statement is unreachable  [unreachable]\n'
    'dir2/bar.pyi:9: error: Name "NotARealType" is not defined  '
    '[name-defined]\n'
    'Found 2 errors in 2 files (checked 5 source files)\n'
)
_CLEAN_MYPY_OUTPUT: Final = 'Success: no issues found in 5 source files\n'


class Ret:
    """Return object that gives user-prefix error."""

    def __init__(self, cmd_tokens: List[str]) -> None:
        if '--user' in cmd_tokens:
            self.returncode = 0
        else:
            self.returncode = 1

    def communicate(self) -> Tuple[bytes, bytes]:
        """Return user-prefix error as stderr."""
        return b'', b'can\'t combine user with prefix'


class MypyScriptChecks(test_utils.GenericTestBase):
    """Tests for MyPy type check runner script."""

    def setUp(self) -> None:
        super().setUp()
        process_success = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        def mock_popen_success(
            unused_cmd: str,
            stdout: Optional[str] = None,  # pylint: disable=unused-argument
            stdin: Optional[str] = None,  # pylint: disable=unused-argument
            stderr: Optional[str] = None,  # pylint: disable=unused-argument
            env: Optional[str] = None,  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process_success

        process_failure = subprocess.Popen(
            ['test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        def mock_popen_failure(
            unused_cmd: str,
            stdout: Optional[str] = None,  # pylint: disable=unused-argument
            stdin: Optional[str] = None,  # pylint: disable=unused-argument
            stderr: Optional[str] = None,  # pylint: disable=unused-argument
            env: Optional[str] = None,  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process_failure

        self.popen_swap_success = self.swap(
            subprocess, 'Popen', mock_popen_success
        )
        self.popen_swap_failure = self.swap(
            subprocess, 'Popen', mock_popen_failure
        )

        self.directories_swap = self.swap(
            run_mypy_checks, 'EXCLUDED_DIRECTORIES', ['dir1/', 'dir2/']
        )

        # The mocked Popen output ('test\n') has nothing to do with real
        # mypy output, so none of the real allowlist entries would ever
        # show up as "hit" in it. Without this swap, any full-run test
        # using the success/failure mocks below would incorrectly trip
        # the stale-allowlist-entry check, since it'd look like every
        # real allowlisted file stopped producing unreachable errors.
        self.empty_allowlist_swap = self.swap(
            run_mypy_checks, 'NOT_FULLY_COVERED_FILES_FOR_UNREACHABLE_CODE', []
        )

        # Shared by the filter_unreachable_errors_for_allowlisted_files
        # tests below - treats 'dir1/foo.py' as the sole allowlisted
        # file, matching the _MYPY_OUTPUT_* fixtures above.
        self.allowlist_swap = self.swap(
            run_mypy_checks,
            'NOT_FULLY_COVERED_FILES_FOR_UNREACHABLE_CODE',
            ['dir1/foo.py'],
        )

    def test_get_mypy_cmd_without_files(self) -> None:
        expected_cmd = [
            'mypy',
            '--exclude',
            'dir1/|dir2/',
            '--config-file',
            './mypy.ini',
            '--warn-unreachable',
            '.',
        ]
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(None)
            self.assertEqual(cmd, expected_cmd)

    def test_get_mypy_cmd_with_files(self) -> None:
        expected_cmd = [
            'mypy',
            '--config-file',
            './mypy.ini',
            '--warn-unreachable',
            'file1.py',
            'file2.py',
        ]
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(['file1.py', 'file2.py'])
            self.assertEqual(cmd, expected_cmd)

    def test_running_script_without_mypy_errors(self) -> None:
        with self.popen_swap_success:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE
            )
            output = process.communicate()
            self.assertEqual(output[0], b'test\n')

    def test_running_script_with_mypy_errors(self) -> None:
        with self.popen_swap_failure:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE
            )
            output = process.communicate()
            self.assertEqual(output[0], b'')

    def test_main_with_files_without_mypy_errors(self) -> None:
        # No empty_allowlist_swap needed here: passing --files means
        # check_stale_entries is False, so the allowlist is never
        # consulted for this run regardless of its contents.
        with self.popen_swap_success:
            process = run_mypy_checks.main(args=['--files', 'file1.py'])
            self.assertEqual(process, 0)

    def test_main_without_mypy_errors(self) -> None:
        with self.popen_swap_success, self.empty_allowlist_swap:
            process = run_mypy_checks.main(args=[])
            self.assertEqual(process, 0)

    def test_main_with_files_with_mypy_errors(self) -> None:
        with self.assertRaisesRegex(SystemExit, '1'):
            run_mypy_checks.main(args=['--files', 'file1.py'])

    def test_main_failure_due_to_mypy_errors(self) -> None:
        with self.popen_swap_failure, self.empty_allowlist_swap:
            with self.assertRaisesRegex(SystemExit, '1'):
                run_mypy_checks.main(args=[])

    def test_filter_unreachable_errors_suppresses_allowlisted_file(
        self,
    ) -> None:
        with self.allowlist_swap:
            filtered, remaining_error_count, suppressed_something = (
                run_mypy_checks.filter_unreachable_errors_for_allowlisted_files(
                    _MYPY_OUTPUT_WITH_ALLOWLISTED_UNREACHABLE_ERROR,
                    check_stale_entries=True,
                )
            )
        self.assertNotIn('dir1/foo.py', filtered)
        self.assertEqual(remaining_error_count, 0)
        self.assertTrue(suppressed_something)

    def test_filter_unreachable_errors_keeps_non_allowlisted_file(self) -> None:
        with self.allowlist_swap:
            filtered, remaining_error_count, suppressed_something = (
                run_mypy_checks.filter_unreachable_errors_for_allowlisted_files(
                    _MYPY_OUTPUT_WITH_NON_ALLOWLISTED_UNREACHABLE_ERROR,
                    check_stale_entries=True,
                )
            )
        self.assertIn('dir2/bar.py', filtered)
        # 'dir1/foo.py' never showed up, so it's flagged stale on top of
        # dir2/bar.py's genuine, non-allowlisted error.
        self.assertEqual(remaining_error_count, 2)
        self.assertFalse(suppressed_something)

    def test_filter_unreachable_errors_flags_stale_allowlist_entry(
        self,
    ) -> None:
        with self.allowlist_swap:
            filtered, remaining_error_count, suppressed_something = (
                run_mypy_checks.filter_unreachable_errors_for_allowlisted_files(
                    _CLEAN_MYPY_OUTPUT, check_stale_entries=True
                )
            )
        self.assertIn('dir1/foo.py', filtered)
        self.assertIn('must be removed from', filtered)
        self.assertEqual(remaining_error_count, 1)
        self.assertFalse(suppressed_something)

    def test_filter_unreachable_errors_skips_stale_check_for_files_run(
        self,
    ) -> None:
        with self.allowlist_swap:
            filtered, remaining_error_count, suppressed_something = (
                run_mypy_checks.filter_unreachable_errors_for_allowlisted_files(
                    _CLEAN_MYPY_OUTPUT, check_stale_entries=False
                )
            )
        self.assertNotIn('must be removed from', filtered)
        self.assertEqual(remaining_error_count, 0)
        self.assertFalse(suppressed_something)

    def test_filter_unreachable_errors_keeps_pyi_file_error(self) -> None:
        with self.allowlist_swap:
            filtered, remaining_error_count, suppressed_something = (
                run_mypy_checks.filter_unreachable_errors_for_allowlisted_files(
                    _MYPY_OUTPUT_WITH_PYI_ERROR, check_stale_entries=True
                )
            )
        self.assertIn('dir2/bar.pyi', filtered)
        # 'dir1/foo.py' never showed up in this run either, so it's
        # flagged stale on top of dir2/bar.pyi's genuine error - same
        # pattern as test_filter_unreachable_errors_keeps_non_allowlisted_file.
        self.assertEqual(remaining_error_count, 2)
        self.assertFalse(suppressed_something)

    def test_filter_unreachable_errors_pyi_error_not_masked_by_suppressed_allowlisted_error(
        self,
    ) -> None:
        with self.allowlist_swap:
            filtered, remaining_error_count, suppressed_something = (
                run_mypy_checks.filter_unreachable_errors_for_allowlisted_files(
                    _MYPY_OUTPUT_WITH_ALLOWLISTED_UNREACHABLE_AND_PYI_ERROR,
                    check_stale_entries=True,
                )
            )
        self.assertNotIn('dir1/foo.py', filtered)
        self.assertIn('dir2/bar.pyi', filtered)
        self.assertTrue(suppressed_something)
        self.assertEqual(remaining_error_count, 1)
        self.assertNotIn('Success: no issues found', filtered)
