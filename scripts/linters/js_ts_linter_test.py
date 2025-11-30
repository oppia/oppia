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
INVALID_TS_FILEPATH: Final = os.path.join(LINTER_TESTS_DIR, 'invalid.ts')
VALID_BACKEND_API_SERVICE_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid-backend-api.service.ts'
)
VALID_IGNORED_SERVICE_PATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_ignored.service.ts'
)
VALID_UNLISTED_SERVICE_PATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_unlisted.service.ts'
)


class Ret:
    """Return object with required attributes."""

    def __init__(self) -> None:
        self.returncode = 1

    def communicate(self) -> Tuple[str, bytes]:
        """Return some error."""
        return '', 'Some error'.encode('utf-8')


class MockProcess:
    """Mock process that properly simulates subprocess.Popen behavior."""

    def __init__(
        self, returncode: int = 1, stdout: bytes = b'', stderr: bytes = b''
    ) -> None:
        self.returncode = returncode
        self._stdout = stdout
        self._stderr = stderr

    def communicate(self) -> Tuple[bytes, bytes]:
        """Return mock communication result with proper types."""
        return self._stdout, self._stderr


class JsTsLintTests(test_utils.LinterTestBase):
    """Tests for js_ts_linter file."""

    def validate(
        self,
        lint_task_report: List[concurrent_task_utils.TaskResult],
        expected_messages: List[str],
        failed_count: int,
    ) -> None:
        """Assert linter output messages with expected messages."""
        for stdout in lint_task_report:
            if stdout.failed:
                for message in expected_messages:
                    self.assert_same_list_elements(
                        [message], stdout.trimmed_messages
                    )
                self.assert_failed_messages_count(
                    stdout.get_report(), failed_count
                )
            else:
                continue

    def test_compile_all_ts_files_with_error(self) -> None:
        def mock_popen_error_call(  # pylint: disable=unused-argument
            unused_cmd_tokens: List[str], *args: str, **kwargs: str
        ) -> Ret:
            return Ret()

        popen_error_swap = self.swap(subprocess, 'Popen', mock_popen_error_call)
        with popen_error_swap:
            with self.assertRaisesRegex(Exception, 'Some error'):
                js_ts_linter.compile_all_ts_files()

    def test_third_party_linter_with_stderr(self) -> None:
        process = subprocess.Popen(['test'], stdout=subprocess.PIPE)

        def mock_popen(  # pylint: disable=unused-argument
            unused_cmd: str, stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process

        def mock_communicate(unused_self: str) -> Tuple[bytes, bytes]:
            return (b'Output', b'Invalid')

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate
        )
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
            'its dependencies.',
        ):
            js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [VALID_TS_FILEPATH]
            ).perform_all_lint_checks()

    def test_third_party_linter_with_success_message(self) -> None:
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            [VALID_TS_FILEPATH]
        ).perform_all_lint_checks()
        expected_messages = ['SUCCESS  ESLint check passed']
        self.validate(lint_task_report, expected_messages, 0)

    def test_custom_linter_with_no_files(self) -> None:
        lint_task_report = js_ts_linter.JsTsLintChecksManager(
            [], [], FILE_CACHE
        ).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed',
            ],
            lint_task_report[0].get_report(),
        )
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_linter_with_no_files(self) -> None:
        lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
            []
        ).perform_all_lint_checks()
        self.assertEqual(
            [
                'There are no JavaScript or Typescript files to lint.',
                'SUCCESS  JS TS lint check passed',
            ],
            lint_task_report[0].get_report(),
        )
        self.assertEqual('JS TS lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_angular_services_index_error(self) -> None:
        def mock_compile_all_ts_files() -> None:
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s'
                'scripts/linters/test_files/ -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*'
            ) % (
                js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH,
                'true',
                'es2017,dom',
                'true',
                'true',
                'es5',
                './node_modules/@types',
                VALID_UNLISTED_SERVICE_PATH,
            )
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files
        )

        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [], [VALID_UNLISTED_SERVICE_PATH], FILE_CACHE
            ).perform_all_lint_checks()
        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True
        )

        angular_services_index_path = (
            './core/templates/services/angular-services.index.ts'
        )
        class_name = 'UnlistedService'
        service_name_type_pair = '[\'%s\', %s]' % (class_name, class_name)
        expected_messages = [
            'Please import %s to Angular Services Index file in %s'
            'from %s'
            % (
                class_name,
                angular_services_index_path,
                VALID_UNLISTED_SERVICE_PATH,
            ),
            'Please add the pair %s to the angularServices in %s'
            % (service_name_type_pair, angular_services_index_path),
        ]
        self.validate(lint_task_report, expected_messages, 1)

    def test_angular_services_index_success(self) -> None:
        def mock_compile_all_ts_files() -> None:
            cmd = (
                './node_modules/typescript/bin/tsc -outDir %s'
                'scripts/linters/test_files/ -allowJS %s '
                '-lib %s -noImplicitUseStrict %s -skipLibCheck '
                '%s -target %s -typeRoots %s %s typings/*'
            ) % (
                js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH,
                'true',
                'es2017,dom',
                'true',
                'true',
                'es5',
                './node_modules/@types',
                VALID_IGNORED_SERVICE_PATH,
            )
            subprocess.call(cmd, shell=True, stdout=subprocess.PIPE)

        compile_all_ts_files_swap = self.swap(
            js_ts_linter, 'compile_all_ts_files', mock_compile_all_ts_files
        )
        with compile_all_ts_files_swap:
            lint_task_report = js_ts_linter.JsTsLintChecksManager(
                [],
                [VALID_IGNORED_SERVICE_PATH],
                FILE_CACHE,
            ).perform_all_lint_checks()

        shutil.rmtree(
            js_ts_linter.COMPILED_TYPESCRIPT_TMP_PATH, ignore_errors=True
        )

        expected_messages = [
            'SUCCESS  Angular Services Index file check passed'
        ]
        self.validate(lint_task_report, expected_messages, 0)

    def test_get_linters_with_success(self) -> None:
        custom_linter, third_party = js_ts_linter.get_linters(
            [VALID_JS_FILEPATH], [VALID_TS_FILEPATH], FILE_CACHE
        )
        self.assertTrue(
            isinstance(custom_linter, js_ts_linter.JsTsLintChecksManager)
        )
        self.assertTrue(
            isinstance(
                third_party, js_ts_linter.ThirdPartyJsTsLintChecksManager
            )
        )

    def test_eslint_integration_with_invalid_ts_file(self) -> None:
        """Test ESLint integration using invalid.ts file (tests trimming through public interface)."""
        mock_eslint_output = f"""
    {INVALID_TS_FILEPATH}
    25:3  error  Duplicate identifier 'duplicateVariable'  @typescript-eslint/no-redeclare
    26:3  error  Duplicate identifier 'duplicateVariable'  @typescript-eslint/no-redeclare
    24:3  error  'unusedVariable' is assigned a value but never used  @typescript-eslint/no-unused-vars

    ✖ 3 problems (3 errors, 0 warnings)
    1 error and 0 warnings potentially fixable with the `--fix` option.

    """

        def mock_exists(unused_path: str) -> bool:
            return True

        def mock_popen(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess(
                returncode=1,
                stdout=mock_eslint_output.encode('utf-8'),
                stderr=b'',
            )

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)

        with exists_swap, popen_swap:
            lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_TS_FILEPATH]
            ).perform_all_lint_checks()

        self.assertTrue(lint_task_report[0].failed)
        self.assertEqual(lint_task_report[0].name, 'ESLint')

        trimmed_output = ''.join(lint_task_report[0].trimmed_messages)
        # The 'error' keywords should be removed from lines with line numbers.
        self.assertIn('25:3    Duplicate identifier', trimmed_output)
        self.assertIn('26:3    Duplicate identifier', trimmed_output)
        self.assertIn('24:3    \'unusedVariable\'', trimmed_output)
        # Footer might not be removed if conditions aren't met exactly.
        self.assertIn('Duplicate identifier', trimmed_output)

    def test_eslint_integration_footer_removal_with_exact_conditions(
        self,
    ) -> None:
        """Test ESLint footer removal with exact conditions through public interface."""
        # Create output that meets ALL footer removal conditions exactly:
        # 1. At least 4 lines
        # 2. Last line is empty
        # 3. Second to last line is empty
        # 4. Third to last ends with '`--fix` option.'
        # 5. Fourth to last starts with '\u2716'.
        mock_eslint_output_lines = [
            f'{INVALID_TS_FILEPATH}',
            '  25:3  error  Duplicate identifier  @typescript-eslint/no-redeclare',
            '  24:3  error  Variable never used  @typescript-eslint/no-unused-vars',
            '\u2716 2 problems (2 errors, 0 warnings)',
            '  1 error and 0 warnings potentially fixable with the `--fix` option.',
            '',
            '',
        ]
        mock_eslint_output = '\n'.join(mock_eslint_output_lines)

        def mock_exists(unused_path: str) -> bool:
            return True

        def mock_popen(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess(
                returncode=1,
                stdout=mock_eslint_output.encode('utf-8'),
                stderr=b'',
            )

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)

        with exists_swap, popen_swap:
            lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_TS_FILEPATH]
            ).perform_all_lint_checks()

        trimmed_output = ''.join(lint_task_report[0].trimmed_messages)
        self.assertNotIn('\u2716 2 problems', trimmed_output)
        self.assertNotIn(
            'potentially fixable with the `--fix` option.', trimmed_output
        )
        self.assertIn('25:3    Duplicate identifier', trimmed_output)
        self.assertIn('24:3    Variable never used', trimmed_output)

    def test_eslint_integration_no_footer_removal(self) -> None:
        """Test ESLint when footer removal conditions are not met."""
        mock_eslint_output = f"""
    {INVALID_TS_FILEPATH}
    25:3  error  Duplicate identifier  @typescript-eslint/no-redeclare
    X 1 problem (1 error, 0 warnings)
    """

        def mock_exists(unused_path: str) -> bool:
            return True

        def mock_popen(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess(
                returncode=1,
                stdout=mock_eslint_output.encode('utf-8'),
                stderr=b'',
            )

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)

        with exists_swap, popen_swap:
            lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_TS_FILEPATH]
            ).perform_all_lint_checks()

        trimmed_output = ''.join(lint_task_report[0].trimmed_messages)
        self.assertIn('X 1 problem', trimmed_output)
        self.assertIn('25:3    Duplicate identifier', trimmed_output)

    def test_eslint_integration_empty_output_simulation(self) -> None:
        """Test ESLint with empty output through public interface."""

        def mock_exists(unused_path: str) -> bool:
            return True

        def mock_popen(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess(returncode=0, stdout=b'', stderr=b'')

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)

        with exists_swap, popen_swap:
            lint_task_report = js_ts_linter.ThirdPartyJsTsLintChecksManager(
                [INVALID_TS_FILEPATH]
            ).perform_all_lint_checks()

        self.assertFalse(lint_task_report[0].failed)
        self.assertEqual(lint_task_report[0].name, 'ESLint')
        self.assertEqual(lint_task_report[0].trimmed_messages, [])
