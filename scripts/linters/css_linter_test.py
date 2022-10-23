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

"""Unit tests for scripts/linters/css_linter.py."""

from __future__ import annotations

import os
import subprocess

from core.tests import test_utils
from scripts import scripts_test_utils

from typing import Final, List

from . import css_linter

LINTER_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'scripts', 'linters', 'test_files'
)
VALID_CSS_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'valid.css')
INVALID_CSS_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'invalid.css')


class ThirdPartyCSSLintChecksManagerTests(test_utils.LinterTestBase):
    """Tests for ThirdPartyCSSLintChecksManager class."""

    def test_all_filepaths_with_success(self) -> None:
        filepaths = [VALID_CSS_FILEPATH, INVALID_CSS_FILEPATH]
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            filepaths)
        returned_filepaths = third_party_linter.all_filepaths
        self.assertEqual(returned_filepaths, filepaths)

    def test_perform_all_lint_checks_with_invalid_file(self) -> None:
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            [INVALID_CSS_FILEPATH])
        lint_task_report = third_party_linter.lint_css_files()
        self.assert_same_list_elements(
            ['19:16', 'Unexpected whitespace before ":"'],
            lint_task_report.get_report())
        self.assertEqual('Stylelint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_perform_all_lint_checks_with_invalid_stylelint_path(self) -> None:
        def mock_join(*unused_args: str) -> str:
            return 'node_modules/stylelint/bin/stylelinter.js'

        join_swap = self.swap(os.path, 'join', mock_join)

        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            [INVALID_CSS_FILEPATH])
        with self.print_swap, join_swap, self.assertRaisesRegex(
            Exception,
            'ERROR    Please run start.py first to install node-eslint or '
            'node-stylelint and its dependencies.'):
            third_party_linter.perform_all_lint_checks()

    def test_perform_all_lint_checks_with_stderr(self) -> None:
        # Note: In general, stdout and stderr can be ints, e.g. subprocess.PIPE
        # is an Integer constant whose value is -1. Reference:
        # https://github.com/python/cpython/blob/8827b95e80302ef19d19561fdcd81c6efde2ecdb/Lib/subprocess.py#L259
        def mock_popen(
            unused_commands: List[str], stdout: int, stderr: int  # pylint: disable=unused-argument
        ) -> scripts_test_utils.PopenStub:
            return scripts_test_utils.PopenStub(stdout=b'True', stderr=b'True')

        popen_swap = self.swap_with_checks(subprocess, 'Popen', mock_popen)

        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            [VALID_CSS_FILEPATH])
        with self.print_swap, popen_swap, self.assertRaisesRegex(
            Exception, 'True'
        ):
            third_party_linter.perform_all_lint_checks()

    def test_perform_all_lint_checks_with_no_files(self) -> None:
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager([])
        lint_task_report = third_party_linter.perform_all_lint_checks()
        self.assertEqual(
            'There are no HTML or CSS files to lint.',
            lint_task_report[0].get_report()[0])
        self.assertEqual('CSS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_perform_all_lint_checks_with_valid_file(self) -> None:
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            [VALID_CSS_FILEPATH])
        lint_task_report = third_party_linter.perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_get_linters(self) -> None:
        custom_linter, third_party_linter = css_linter.get_linters(
            [VALID_CSS_FILEPATH, INVALID_CSS_FILEPATH])
        self.assertEqual(custom_linter, None)
        self.assertTrue(
            isinstance(
                third_party_linter, css_linter.ThirdPartyCSSLintChecksManager))
