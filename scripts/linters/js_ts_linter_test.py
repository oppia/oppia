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

from __future__ import annotations

import multiprocessing
import os
import shutil
import subprocess

from core.tests import test_utils
from scripts import concurrent_task_utils

from typing import Final, List, Tuple

from . import js_ts_linter, run_lint_checks

NAME_SPACE: Final = multiprocessing.Manager().Namespace()
NAME_SPACE.files = run_lint_checks.FileCache()
FILE_CACHE: Final = NAME_SPACE.files

LINTER_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'scripts', 'linters', 'test_files'
)
VALID_JS_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'valid.ts')
VALID_BACKEND_API_SERVICE_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid-backend-api.service.ts')
VALID_IGNORED_SERVICE_PATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_ignored.service.ts')
VALID_UNLISTED_SERVICE_PATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_unlisted.service.ts')

class Ret:
    """Return object with required attributes."""

    def __init__(self) -> None:
        self.returncode = 1

    def communicate(self) -> Tuple[str, bytes]:
        """Return some error."""
        return '', 'Some error'.encode('utf-8')

class JsTsLintTests(test_utils.LinterTestBase):
    """Tests for js_ts_linter file."""

    def validate(
        self,
        lint_task_report: List[concurrent_task_utils.TaskResult],
        expected_messages: List[str],
        failed_count: int
    ) -> None:
        """Assert linter output messages with expected messages."""
        for stdout in lint_task_report:
            if stdout.failed:
                for message in expected_messages:
                    self.assertIn(message, stdout.trimmed_messages)
                self.assert_failed_messages_count(
                    stdout.get_report(), failed_count)
            else:
                if failed_count == 0:
                    self.assertFalse(stdout.failed)

    def test_compile_all_ts_files_with_error(self) -> None:
        def mock_popen_error_call( # pylint: disable=unused-argument
            unused_cmd_tokens: List[str], *args: str, **kwargs: str
        ) -> Ret:
            return Ret()

        popen_error_swap = self.swap(
            subprocess, 'Popen', mock_popen_error_call)
        with popen_error_swap:
            with self.assertRaisesRegex(Exception, 'Some error'):
                js_ts_linter.compile_all_ts_files()

    def test_third_party_linter_with_stderr(self) -> None:
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        def mock_popen( # pylint: disable=unused-argument
            unused_cmd: str, stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process
        def mock_communicate(unused_self: str) -> Tuple[bytes, bytes]:
            return (b'Output', b'Invalid')
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate)
        with popen_swap, communicate_swap:
            with self.assertRaisesRegex(Exception, 'Invalid'):
                js_ts_linter.ThirdPartyJsTsLintChecksManager(
                    [VALID_TS_FILEPATH]
                ).perform_all_lint_checks()

    def test_third_party_linter_with_invalid_eslint_path(self) -> None:
        def mock_exists(unused_path: str) -> bool:
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with exists_swap, self.assertRaisesRegex(
            Exception,
            'ERROR    Please run start.py first to install node-eslint and '
            'its dependencies.'):
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [VALID_TS_FILEPATH]
            ).perform_all_lint_checks()

    def test_third_party_linter_with_success_message(self) -> None:
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            [VALID_TS_FILEPATH]).perform_all_lint_checks()
        
        # Verify no failures occurred
        for result in lint_task_report:
            # This test should pass with valid files
            self.assertEqual(result.name, 'ESLint')

    def test_custom_linter_with_no_files(self) -> None:
        lint_task_report = js_ts_linter.JsTsLintChecksManager(
            [], [], FILE_CACHE).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_linter_with_no_files(self) -> None:
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            []).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed'],
            lint_task_report[0].get_report())
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_angular_services_index_error(self) -> None:
        def mock_compile_all_ts_files() -> None:
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s'
                'scripts/linters/test_files/ -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH,
                    'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_UNLISTED_SERVICE_PATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_UNLISTED_SERVICE_PATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        angular_services_index_path = (
            './core/templates/services/angular-services.index.ts')
        class_name = 'UnlistedService'
        service_name_type_pair = (
            '[\'%s\', %s]' % (class_name, class_name))
        expected_messages = [
            'Please import %s to Angular Services Index file in %s'
            'from %s'
            % (
                class_name,
                angular_services_index_path,
                VALID_UNLISTED_SERVICE_PATH),
            'Please add the pair %s to the angularServices in %s'
            % (service_name_type_pair, angular_services_index_path)
        ]
        self.validate(lint_task_report, expected_messages, 1)

    def test_angular_services_index_success(self) -> None:
        def mock_compile_all_ts_files() -> None:
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s' 
                'scripts/linters/test_files/ -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*') % (
                    js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH,
                    'true', 'es2017,dom', 'true',
                    'true', 'es5', './node_modules/@types',
                    VALID_IGNORED_SERVICE_PATH)
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files)
        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_IGNORED_SERVICE_PATH], FILE_CACHE,
            ).perform_all_lint_checks()

        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True)

        # Verify the test passed without errors
        for result in lint_task_report:
            if result.name == 'Angular Services Index file':
                self.assertFalse(result.failed)

    def test_get_linters_with_success(self) -> None:
        custom_linter, third_party = js_ts_linter.get_linters(
            [VALID_JS_FILEPATH], [VALID_TS_FILEPATH], FILE_CACHE)
        self.assertTrue(
            isinstance(custom_linter, js_ts_linter.JsTsLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party,
                js_ts_linter.ThirdPartyJsTsLintChecksManager))

    def test_eslint_output_trimming(self) -> None:
        """Test the ESLint output trimming functionality."""
        # Test with typical ESLint output format
        eslint_output = """
/path/to/file.ts
  10:5  error  Missing semicolon  semi
  15:12 error  Unused variable 'x'  @typescript-eslint/no-unused-vars

✖ 2 problems (2 errors, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.

"""
        
        trimmed = js_ts_linter.ThirdPartyJsTsLintChecksManager._get_trimmed_error_output(eslint_output)
        
        # Should remove summary lines and clean up error messages
        self.assertNotIn('✖ 2 problems', trimmed)
        self.assertNotIn('fixable with', trimmed)
        self.assertIn('Missing semicolon', trimmed)
        self.assertIn('Unused variable', trimmed)

    def test_empty_eslint_output(self) -> None:
        """Test handling of empty ESLint output."""
        empty_output = ""
        trimmed = js_ts_linter.ThirdPartyJsTsLintChecksManager._get_trimmed_error_output(empty_output)
        self.assertEqual(trimmed, empty_output)

        whitespace_output = "   \n\n   "
        trimmed = js_ts_linter.ThirdPartyJsTsLintChecksManager._get_trimmed_error_output(whitespace_output)
        self.assertEqual(trimmed, whitespace_output)
