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

"""Unit tests for scripts/run_typescript_checks.py."""

from __future__ import annotations

import json
import os
import subprocess

from core import utils
from core.tests import test_utils

from typing import List

from . import run_typescript_checks

TEST_SOURCE_DIR = os.path.join('core', 'tests', 'build_sources')
MOCK_COMPILED_JS_DIR = os.path.join(TEST_SOURCE_DIR, 'compiled_js_dir', '')


class TypescriptChecksTests(test_utils.GenericTestBase):
    """Test the typescript checks."""

    def setUp(self) -> None:
        super().setUp()
        process = subprocess.Popen(
            ['test'], stdout=subprocess.PIPE, encoding='utf-8')
        def mock_popen(
            unused_cmd: str, stdout: str, encoding: str  # pylint: disable=unused-argument
        ) -> subprocess.Popen[str]:  # pylint: disable=unsubscriptable-object
            return process

        self.popen_swap = self.swap(subprocess, 'Popen', mock_popen)

    def test_compiled_js_dir_validation(self) -> None:
        """Test that run_typescript_checks.COMPILED_JS_DIR is validated 
        correctly with outDir in 
        run_typescript_checks.TSCONFIG_FILEPATH.
        """
        with self.popen_swap:
            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.TSCONFIG_FILEPATH)
            out_dir = ''
            with utils.open_file(
                run_typescript_checks.TSCONFIG_FILEPATH, 'r') as f:
                config_data = json.load(f)
                out_dir = os.path.join(
                    config_data['compilerOptions']['outDir'], '')
            compiled_js_dir_swap = self.swap(
                run_typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR)
            with compiled_js_dir_swap, self.assertRaisesRegex(
                Exception,
                'COMPILED_JS_DIR: %s does not match the output directory '
                'in %s: %s' % (
                    MOCK_COMPILED_JS_DIR,
                      run_typescript_checks.TSCONFIG_FILEPATH,
                    out_dir)):
                run_typescript_checks.compile_and_check_typescript(
                    run_typescript_checks.TSCONFIG_FILEPATH)

    def test_compiled_js_dir_is_deleted_before_compilation(self) -> None:
        """Test that compiled_js_dir is deleted before a fresh compilation."""
        def mock_validate_compiled_js_dir() -> None:
            pass

        compiled_js_dir_swap = self.swap(
            run_typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR)
        validate_swap = self.swap(
            run_typescript_checks, 'validate_compiled_js_dir',
            mock_validate_compiled_js_dir)
        with self.popen_swap, compiled_js_dir_swap, validate_swap:
            if not os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)):
                os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))

            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH)
            self.assertFalse(
                os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)))

    def test_compiled_js_dir_is_deleted_before_temp_compilation(self) -> None:
        """Test that compiled_js_dir is deleted before a fresh temp
        compilation.
        """
        def mock_validate_compiled_js_dir() -> None:
            pass

        compiled_js_dir_swap = self.swap(
            run_typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR)
        validate_swap = self.swap(
            run_typescript_checks, 'validate_compiled_js_dir',
            mock_validate_compiled_js_dir)
        with self.popen_swap, compiled_js_dir_swap, validate_swap:
            if not os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)):
                os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))

            run_typescript_checks.compile_temp_strict_tsconfig(
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH, [])
            self.assertFalse(
                os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)))

    def test_no_error_for_valid_compilation_of_tsconfig(self) -> None:
        """Test that no error is produced if stdout is empty."""
        with self.popen_swap:
            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.TSCONFIG_FILEPATH)

    def test_no_error_for_valid_compilation_of_strict_tsconfig(self) -> None:
        """Test that no error is produced if stdout is empty."""
        with self.popen_swap:
            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH)

    def test_error_is_raised_for_invalid_compilation_of_tsconfig(self) -> None:
        """Test that error is produced if stdout is not empty."""
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, encoding='utf-8')
        def mock_popen_for_errors(
            unused_cmd: str, stdout: str, encoding: str  # pylint: disable=unused-argument
        ) -> subprocess.Popen[str]:  # pylint: disable=unsubscriptable-object
            return process

        with self.swap(subprocess, 'Popen', mock_popen_for_errors):
            with self.assertRaisesRegex(SystemExit, '1'):
                run_typescript_checks.compile_and_check_typescript(
                    run_typescript_checks.TSCONFIG_FILEPATH)

    def test_error_is_raised_for_invalid_compilation_of_strict_tsconfig(
            self) -> None:
        """Test that error is produced if stdout is not empty."""
        empty_process = subprocess.Popen(
            ['echo', ''], stdout=subprocess.PIPE, encoding='utf-8')
        non_empty_process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, encoding='utf-8')
        def mock_popen_for_errors(
            cmd_tokens: List[str], stdout: str, encoding: str  # pylint: disable=unused-argument
        ) -> subprocess.Popen[str]:
            if (
                cmd_tokens == [
                    './node_modules/typescript/bin/tsc', '--project',
                    run_typescript_checks.STRICT_TSCONFIG_FILEPATH
                ]
            ):
                return non_empty_process
            return empty_process

        with self.swap(subprocess, 'Popen', mock_popen_for_errors):
            with self.assertRaisesRegex(SystemExit, '1'):
                run_typescript_checks.compile_and_check_typescript(
                    run_typescript_checks.STRICT_TSCONFIG_FILEPATH)

    def test_error_is_raised_for_invalid_compilation_of_temp_strict_tsconfig(
            self) -> None:
        """Test that error is produced if stdout is not empty."""
        class MockOutput:
            """This class simulates a process stdout."""

            def __init__(self, call_counter: int = 0) -> None:
                self.call_counter = call_counter
            def readline(self) -> str:
                """This mocks the readline() method which reads and returns
                a single line. It stops when it hits the EOF or an empty
                string.

                Returns:
                    str. A single line of process output.
                """
                self.call_counter = self.call_counter + 1
                return_values = {
                    1: 'core/new_directory/new_file.ts',
                    2: ''
                }
                return return_values[self.call_counter]

        class MockProcess:
            stdout = MockOutput()
        def mock_popen_for_errors(
            unused_cmd: str, stdout: str, encoding: str  # pylint: disable=unused-argument
        ) -> MockProcess:  # pylint: disable=unsubscriptable-object
            return MockProcess()

        swap_path_exists = self.swap(os.path, 'exists', lambda _: False)
        with self.swap(subprocess, 'Popen', mock_popen_for_errors):
            with self.assertRaisesRegex(SystemExit, '1'), swap_path_exists:
                run_typescript_checks.compile_temp_strict_tsconfig(
                    run_typescript_checks.STRICT_TSCONFIG_FILEPATH,
                    ['core/new_directory/new_file.ts']
                )

    def test_config_path_when_no_arg_is_used(self) -> None:
        """Test if the config path is correct when no arg is used."""
        def mock_compile_and_check_typescript(config_path: str) -> None:
            self.assertEqual(
                config_path, run_typescript_checks.TSCONFIG_FILEPATH)
        compile_and_check_typescript_swap = self.swap(
            run_typescript_checks, 'compile_and_check_typescript',
            mock_compile_and_check_typescript)

        with compile_and_check_typescript_swap:
            run_typescript_checks.main(args=[])

    def test_config_path_when_strict_checks_arg_is_used(self) -> None:
        """Test if the config path is correct when strict checks arg is used."""
        def mock_compile_and_check_typescript(config_path: str) -> None:
            self.assertEqual(
                config_path, run_typescript_checks.STRICT_TSCONFIG_FILEPATH)
        compile_and_check_typescript_swap = self.swap(
            run_typescript_checks, 'compile_and_check_typescript',
            mock_compile_and_check_typescript)

        with compile_and_check_typescript_swap:
            run_typescript_checks.main(args=['--strict_checks'])
