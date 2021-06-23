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

"""Unit tests for scripts/linters/js_ts_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess

from core.tests import test_utils

from . import js_ts_linter

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')
INVALID_SORTED_DEPENDENCIES_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_sorted_dependencies.ts')

# Note: Almost all test functions have a subprocess call. This call is to mock
# the compile function used in js_ts_linter. The tests require fewer files to
# be compiled instead of all files as done in js_ts_linter. Mocking the
# compile method reduces the compile time as fewer files are compiled
# thereby making the tests run faster.


class JsTsLintTests(test_utils.LinterTestBase):
    """Tests for js_ts_linter file."""

    def validate(self, lint_task_report, expected_messages, failed_count):
        """Assert linter output messages with expected messages."""
        for stdout in lint_task_report:
            if stdout.failed:
                for message in expected_messages:
                    self.assert_same_list_elements(
                        [message], stdout.trimmed_messages)
                self.assert_failed_messages_count(
                    stdout.get_report(), failed_count)
            else:
                continue

    def test_third_party_linter(self):
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            [INVALID_SORTED_DEPENDENCIES_FILEPATH]
        ).perform_all_lint_checks()
        expected_messages = ['Unused injected value IMPORT_STATEMENT']
        self.validate(lint_task_report, expected_messages, 1)

    def test_third_party_linter_with_stderr(self):
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        def mock_popen(unused_cmd, stdout, stderr):  # pylint: disable=unused-argument
            return process
        def mock_communicate(unused_self):
            return ('Output', 'Invalid')
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate)
        with popen_swap, communicate_swap:
            with self.assertRaisesRegexp(Exception, 'Invalid'):
                js_ts_linter.ThirdPartyJsTsLintChecksManager(
                    [INVALID_SORTED_DEPENDENCIES_FILEPATH]
                ).perform_all_lint_checks()

    def test_third_party_linter_with_invalid_eslint_path(self):
        def mock_exists(unused_path):
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with exists_swap, self.assertRaisesRegexp(
            Exception,
            'ERROR    Please run start.sh first to install node-eslint and '
            'its dependencies.'):
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_SORTED_DEPENDENCIES_FILEPATH]
            ).perform_all_lint_checks()

    def test_third_party_linter_with_success_message(self):
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            [VALID_TS_FILEPATH]).perform_all_lint_checks()
        expected_messages = (
            ['SUCCESS  ESLint check passed'])
        self.validate(lint_task_report, expected_messages, 0)

    def test_third_party_linter_with_no_files(self):
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            []).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)
