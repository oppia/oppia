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

"""Unit tests for scripts/run_lint_checks.py."""

from __future__ import annotations
from unittest import mock

import multiprocessing
import os
import subprocess
import sys

from core.tests import test_utils

from typing import List, Optional

from .. import concurrent_task_utils, install_third_party_libs
from . import run_lint_checks

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
PYLINTRC_FILEPATH = os.path.join(os.getcwd(), '.pylintrc')

# HTML filepaths.
VALID_HTML_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.html')

# CSS filepaths.
VALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.css')
INVALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.css')

# Js and Ts filepaths.
VALID_JS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')

# PY filepaths.
VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')


def mock_exit(unused_status: int) -> None:
    """Mock for sys.exit."""
    pass


def mock_install_third_party_libs_main() -> None:
    """Mock for install_third_party_libs."""
    return


def all_checks_passed(linter_stdout: List[str]) -> bool:
    """Helper function to check if all checks have passed.

    Args:
        linter_stdout: list(str). List of output messages from
            run_lint_checks.

    Returns:
        bool. Whether all checks have passed or not.
    """
    return 'All Linter Checks Passed.' in linter_stdout[-1]


class PreCommitLinterTests(test_utils.LinterTestBase):
    """Tests for methods in run_lint_checks module."""

    def setUp(self) -> None:
        super().setUp()
        self.sys_patch = mock.patch.object(sys, 'exit', mock_exit)
        self.install_patch = mock.patch.object(
            install_third_party_libs,
            'main',
            side_effect=mock_install_third_party_libs_main,
        )

    def test_main_with_no_files(self) -> None:
        def mock_get_all_filepaths(
            unused_path: str,
            unused_files: List[str],
            unused_shard: str,
            namespace: multiprocessing.managers.Namespace,  # pylint: disable=unused-argument
        ) -> List[str]:
            return []

        all_filepath_patch = mock.patch.object(
            run_lint_checks, '_get_all_filepaths', mock_get_all_filepaths
        )

        with self.print_patch, self.sys_patch:
            with self.install_patch:
                with all_filepath_patch:
                    run_lint_checks.main()
        self.assert_same_list_elements(
            ['No files to check'], self.linter_stdout
        )
        self.install_patch.assert_called()

    def test_main_with_no_args(self) -> None:
        def mock_get_changed_filepaths() -> List[str]:
            return []

        get_changed_filepaths_patch = mock.patch.object(
            run_lint_checks,
            '_get_changed_filepaths',
            mock_get_changed_filepaths,
        )

        with self.print_patch, self.sys_patch:
            with self.install_patch:
                with get_changed_filepaths_patch:
                    run_lint_checks.main()
        self.assert_same_list_elements(
            ['No files to check'], self.linter_stdout
        )
        self.install_patch.assert_called()

    def test_main_with_non_other_shard(self) -> None:
        mock_shards = {
            '1': [
                'a/',
                'b/',
            ],
        }

        def mock_get_filepaths_from_path(
            path: str,
            namespace: multiprocessing.managers.Namespace,  # pylint: disable=unused-argument
        ) -> List[str]:
            if path == mock_shards['1'][0]:
                return [VALID_PY_FILEPATH]
            return []

        shards_patch = mock.patch.object(run_lint_checks, 'SHARDS', mock_shards)

        get_filenames_from_path_patch = mock.patch.object(
            run_lint_checks,
            '_get_filepaths_from_path',
            side_effect=mock_get_filepaths_from_path,
        )

        with self.print_patch, self.sys_patch, shards_patch:
            with self.install_patch:
                with get_filenames_from_path_patch:
                    run_lint_checks.main(args=['--shard', '1'])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.install_patch.assert_called()
        for prefix in mock_shards['1']:
            get_filenames_from_path_patch.assert_any_call(prefix)

    def test_main_with_invalid_shards(self) -> None:
        def mock_get_filepaths_from_path(
            unused_path: str,
            namespace: multiprocessing.managers.Namespace,  # pylint: disable=unused-argument
        ) -> List[str]:
            return ['mock_file', 'mock_file']

        def mock_install_third_party_main() -> None:
            raise AssertionError('Third party libs should not be installed.')

        mock_shards = {
            '1': [
                'a/',
            ],
        }

        shards_patch = mock.patch.object(run_lint_checks, 'SHARDS', mock_shards)

        get_filenames_from_path_patch = mock.patch.object(
            run_lint_checks,
            '_get_filepaths_from_path',
            side_effect=mock_get_filepaths_from_path,
        )
        install_patch = mock.patch.object(
            install_third_party_libs, 'main', mock_install_third_party_main
        )

        with self.print_patch, self.sys_patch, install_patch, shards_patch:
            with get_filenames_from_path_patch:
                with self.assertRaisesRegex(
                    RuntimeError, 'mock_file in multiple shards'
                ):
                    run_lint_checks.main(args=['--shard', '1'])

        get_filenames_from_path_patch.assert_called_once_with('a/')

    def test_main_with_other_shard(self) -> None:
        def mock_get_filepaths_from_path(
            path: str,
            namespace: multiprocessing.managers.Namespace,  # pylint: disable=unused-argument
        ) -> List[str]:
            if os.path.abspath(path) == os.getcwd():
                return [VALID_PY_FILEPATH, 'nonexistent_file']
            elif path == 'core/templates/':
                return ['nonexistent_file']
            else:
                return []

        mock_shards = {
            '1': [
                'a/',
            ],
            'other': [
                'b/',
            ],
        }

        shards_patch = mock.patch.object(run_lint_checks, 'SHARDS', mock_shards)

        filenames_from_path_expected_args = [(os.getcwd(),)] + [
            (prefix,) for prefix in mock_shards['1']
        ]

        get_filenames_from_path_patch = mock.patch.object(
            run_lint_checks,
            '_get_filepaths_from_path',
            side_effect=mock_get_filepaths_from_path,
        )

        with self.print_patch, self.sys_patch, shards_patch:
            with self.install_patch:
                with get_filenames_from_path_patch:
                    run_lint_checks.main(
                        args=['--shard', run_lint_checks.OTHER_SHARD_NAME]
                    )
        get_filenames_from_path_patch.assert_any_call(os.getcwd())
        get_filenames_from_path_patch.assert_any_call('a/')
        self.assertFalse(all_checks_passed(self.linter_stdout))

    def test_main_with_files_arg(self) -> None:
        with self.print_patch, self.sys_patch:
            with self.install_patch:
                run_lint_checks.main(args=['--files=%s' % PYLINTRC_FILEPATH])
        self.assertTrue(all_checks_passed(self.linter_stdout))

    def test_main_with_error_message(self) -> None:
        all_errors_patch = mock.patch.object(
            concurrent_task_utils, 'ALL_ERRORS', ['This is an error.']
        )

        with self.print_patch, self.sys_patch:
            with self.install_patch, all_errors_patch:
                run_lint_checks.main(args=['--path=%s' % VALID_PY_FILEPATH])
        self.assert_same_list_elements(
            ['This is an error.'], self.linter_stdout
        )

    def test_main_with_path_arg(self) -> None:
        with self.print_patch, self.sys_patch:
            with self.install_patch:
                run_lint_checks.main(args=['--path=%s' % INVALID_CSS_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assert_same_list_elements(
            ['19:16', 'Unexpected whitespace before \":\"'], self.linter_stdout
        )

    def test_main_with_invalid_filepath_with_path_arg(self) -> None:
        with self.print_patch, self.assertRaisesRegex(SystemExit, '1'):
            run_lint_checks.main(args=['--path=invalid_file.py'])
        self.assert_same_list_elements(
            ['Could not locate file or directory'], self.linter_stdout
        )

    def test_main_with_invalid_filepath_with_file_arg(self) -> None:
        with self.print_patch, self.assertRaisesRegex(SystemExit, '1'):
            run_lint_checks.main(args=['--files=invalid_file.py'])
        self.assert_same_list_elements(
            ['The following file(s) do not exist'], self.linter_stdout
        )

    def test_path_arg_with_directory_name(self) -> None:
        def mock_get_all_files_in_directory(
            unused_input_path: str, unused_excluded_glob_patterns: List[str]
        ) -> List[str]:
            return [VALID_PY_FILEPATH]

        get_all_files_patch = mock.patch.object(
            run_lint_checks,
            '_get_all_files_in_directory',
            mock_get_all_files_in_directory,
        )

        with self.print_patch, self.sys_patch:
            with self.install_patch:
                with get_all_files_patch:
                    run_lint_checks.main(args=['--path=scripts/linters/'])
        self.assertFalse(all_checks_passed(self.linter_stdout))

    def test_main_with_only_check_file_extensions_arg(self) -> None:
        with self.print_patch, self.sys_patch:
            with self.install_patch:
                run_lint_checks.main(
                    args=[
                        '--path=%s' % VALID_TS_FILEPATH,
                        '--only_check_file_extensions=ts',
                    ]
                )
        self.assertFalse(all_checks_passed(self.linter_stdout))

    def test_main_with_only_check_file_extensions_arg_with_js_ts_options(
        self,
    ) -> None:
        with self.print_patch, self.assertRaisesRegex(SystemExit, '1'):
            run_lint_checks.main(
                args=[
                    '--path=%s' % VALID_TS_FILEPATH,
                    '--only_check_file_extensions',
                    'ts',
                    'js',
                ]
            )
        self.assert_same_list_elements(
            [
                'Please use only one of "js" or "ts", as we do not have '
                'separate linters for JS and TS files. If both these options '
                'are used together, then the JS/TS linter will be run twice.'
            ],
            self.linter_stdout,
        )

    def test_get_all_files_in_directory(self) -> None:
        with self.print_patch, self.sys_patch:
            with self.install_patch:
                run_lint_checks.main(
                    args=[
                        '--path=scripts/linters/',
                        '--only_check_file_extensions=ts',
                    ]
                )

    def test_html_file(self) -> None:
        with self.print_patch, self.sys_patch, self.install_patch:
            run_lint_checks.main(args=['--path=%s' % VALID_HTML_FILEPATH])
        self.assert_same_list_elements(
            ['All Linter Checks Passed.'], self.linter_stdout
        )

    def test_get_changed_filepaths(self) -> None:
        def mock_check_output(unused_list: List[str]) -> Optional[str]:
            return ''

        subprocess_patch = mock.patch.object(
            subprocess, 'check_output', mock_check_output
        )

        with self.print_patch, self.sys_patch, self.install_patch, (
            subprocess_patch
        ):
            run_lint_checks.main()
