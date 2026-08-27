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

import builtins
import json
import os
import subprocess
import sys
import tempfile

from core.tests import test_utils
from scripts import common

from typing import Dict, List

from . import run_typescript_checks

TEST_SOURCE_DIR = os.path.join('core', 'tests', 'build_sources')
MOCK_COMPILED_JS_DIR = os.path.join(TEST_SOURCE_DIR, 'compiled_js_dir', '')


class TypescriptChecksTests(test_utils.GenericTestBase):
    """Test the typescript checks."""

    def setUp(self) -> None:
        super().setUp()
        process = subprocess.Popen(
            ['test'], stdout=subprocess.PIPE, encoding='utf-8'
        )

        def mock_popen(  # pylint: disable=unused-argument
            unused_cmd: str, stdout: str, encoding: str
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
                run_typescript_checks.TSCONFIG_FILEPATH
            )
            out_dir = ''
            with open(
                run_typescript_checks.TSCONFIG_FILEPATH, 'r', encoding='utf-8'
            ) as f:
                config_data = json.load(f)
                out_dir = os.path.join(
                    config_data['compilerOptions']['outDir'], ''
                )
            compiled_js_dir_swap = self.swap(
                run_typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR
            )
            with compiled_js_dir_swap, self.assertRaisesRegex(
                Exception,
                'COMPILED_JS_DIR: %s does not match the output directory '
                'in %s: %s'
                % (
                    MOCK_COMPILED_JS_DIR,
                    run_typescript_checks.TSCONFIG_FILEPATH,
                    out_dir,
                ),
            ):
                run_typescript_checks.compile_and_check_typescript(
                    run_typescript_checks.TSCONFIG_FILEPATH
                )

    def test_compiled_js_dir_is_deleted_before_compilation(self) -> None:
        """Test that compiled_js_dir is deleted before a fresh compilation."""

        def mock_validate_compiled_js_dir() -> None:
            pass

        compiled_js_dir_swap = self.swap(
            run_typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR
        )
        validate_swap = self.swap(
            run_typescript_checks,
            'validate_compiled_js_dir',
            mock_validate_compiled_js_dir,
        )
        with self.popen_swap, compiled_js_dir_swap, validate_swap:
            if not os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)):
                os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))

            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH
            )
            self.assertFalse(
                os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR))
            )

    def test_compiled_js_dir_is_deleted_before_temp_compilation(self) -> None:
        """Test that compiled_js_dir is deleted before a fresh temp
        compilation.
        """

        def mock_validate_compiled_js_dir() -> None:
            pass

        compiled_js_dir_swap = self.swap(
            run_typescript_checks, 'COMPILED_JS_DIR', MOCK_COMPILED_JS_DIR
        )
        validate_swap = self.swap(
            run_typescript_checks,
            'validate_compiled_js_dir',
            mock_validate_compiled_js_dir,
        )
        with self.popen_swap, compiled_js_dir_swap, validate_swap:
            if not os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR)):
                os.mkdir(os.path.dirname(MOCK_COMPILED_JS_DIR))

            run_typescript_checks.compile_temp_strict_tsconfig(
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH, []
            )
            self.assertFalse(
                os.path.exists(os.path.dirname(MOCK_COMPILED_JS_DIR))
            )

    def test_no_error_for_valid_compilation_of_tsconfig(self) -> None:
        """Test that no error is produced if stdout is empty."""
        with self.popen_swap:
            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.TSCONFIG_FILEPATH
            )

    def test_no_error_for_valid_compilation_of_strict_tsconfig(self) -> None:
        """Test that no error is produced if stdout is empty."""
        with self.popen_swap:
            run_typescript_checks.compile_and_check_typescript(
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH
            )

    def test_error_is_raised_for_invalid_compilation_of_tsconfig(self) -> None:
        """Test that error is produced if stdout is not empty."""
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, encoding='utf-8'
        )

        def mock_popen_for_errors(  # pylint: disable=unused-argument
            unused_cmd: str, stdout: str, encoding: str
        ) -> subprocess.Popen[str]:  # pylint: disable=unsubscriptable-object
            return process

        with self.swap(subprocess, 'Popen', mock_popen_for_errors):
            with self.assertRaisesRegex(SystemExit, '1'):
                run_typescript_checks.compile_and_check_typescript(
                    run_typescript_checks.TSCONFIG_FILEPATH
                )

    def test_error_is_raised_for_invalid_compilation_of_strict_tsconfig(
        self,
    ) -> None:
        """Test that error is produced if stdout is not empty."""
        empty_process = subprocess.Popen(
            ['echo', ''], stdout=subprocess.PIPE, encoding='utf-8'
        )
        non_empty_process = subprocess.Popen(
            [
                'echo',
                'core/new_directory/new_file.ts\ncore/new_directory/fake_excluded_file.ts',
            ],
            stdout=subprocess.PIPE,
            encoding='utf-8',
        )

        def mock_popen_for_errors(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: str, encoding: str
        ) -> subprocess.Popen[str]:
            if cmd_tokens == [
                './node_modules/typescript/bin/tsc',
                '--project',
                run_typescript_checks.STRICT_TSCONFIG_FILEPATH,
            ]:
                return non_empty_process
            return empty_process

        swap_exclude_paths = self.swap(
            run_typescript_checks,
            'TS_STRICT_EXCLUDE_PATHS',
            ['core/new_directory/fake_excluded_file.ts'],
        )

        with self.swap(
            subprocess, 'Popen', mock_popen_for_errors
        ), swap_exclude_paths:
            with self.assertRaisesRegex(SystemExit, '1'):
                run_typescript_checks.compile_and_check_typescript(
                    run_typescript_checks.STRICT_TSCONFIG_FILEPATH
                )

    def test_error_is_raised_for_invalid_compilation_of_temp_strict_tsconfig(
        self,
    ) -> None:
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
                return_values = {1: 'core/new_directory/new_file.ts', 2: ''}
                return return_values[self.call_counter]

        class MockProcess:
            stdout = MockOutput()

        def mock_popen_for_errors(  # pylint: disable=unused-argument
            unused_cmd: str, stdout: str, encoding: str
        ) -> MockProcess:  # pylint: disable=unsubscriptable-object
            return MockProcess()

        swap_path_exists = self.swap(os.path, 'exists', lambda _: False)
        with self.swap(subprocess, 'Popen', mock_popen_for_errors):
            with self.assertRaisesRegex(SystemExit, '1'), swap_path_exists:
                run_typescript_checks.compile_temp_strict_tsconfig(
                    run_typescript_checks.STRICT_TSCONFIG_FILEPATH,
                    ['core/new_directory/new_file.ts'],
                )

    def test_load_exclude_paths_ignores_comments_and_blank_lines(self) -> None:
        """Test that exclude paths are loaded without comments or blanks."""
        with tempfile.NamedTemporaryFile(
            mode='w', delete=False, encoding='utf-8'
        ) as tmp_file:
            tmp_file.write(
                '# Ignore this comment.\n'
                '\n'
                'core/templates/a.component.ts\n'
                'extensions/b.component.ts\n'
            )
            tmp_filepath = tmp_file.name

        def cleanup_tmp_filepath() -> None:
            if os.path.exists(tmp_filepath):
                os.remove(tmp_filepath)

        self.addCleanup(cleanup_tmp_filepath)

        self.assertEqual(
            run_typescript_checks.load_exclude_paths(tmp_filepath),
            [
                'core/templates/a.component.ts',
                'extensions/b.component.ts',
            ],
        )

    def test_run_ngcc_succeeds(self) -> None:
        """Test that ngcc success does not exit."""

        class MockOutput:
            def readline(self) -> str:  # pylint: disable=missing-docstring
                return ''

        class MockProcess:
            stdout = MockOutput()

            def wait(self) -> int:  # pylint: disable=missing-docstring
                return 0

        def mock_popen(  # pylint: disable=unused-argument
            cmd: List[str], stdout: int, stderr: int, encoding: str
        ) -> MockProcess:
            self.assertEqual(
                cmd,
                [
                    './node_modules/.bin/ngcc',
                    '--properties',
                    'es2015',
                    'browser',
                    'module',
                    'main',
                    '--first-only',
                    '--create-ivy-entry-points',
                ],
            )
            return MockProcess()

        print_arr: List[str] = []

        def mock_print(
            msg: str, end: str = '\n'  # pylint: disable=unused-argument
        ) -> None:
            print_arr.append(msg)

        with (
            self.swap(subprocess, 'Popen', mock_popen),
            self.swap(builtins, 'print', mock_print),
        ):
            run_typescript_checks.run_ngcc()

        self.assertEqual(
            print_arr, ['Processing Angular packages with ngcc...']
        )

    def test_run_ngcc_failure_exits(self) -> None:
        """Test that ngcc failures exit with code 1."""

        class MockOutput:
            def __init__(self) -> None:
                self.call_counter = 0

            def readline(self) -> str:  # pylint: disable=missing-docstring
                self.call_counter += 1
                return {1: 'ngcc error', 2: ''}[self.call_counter]

        class MockProcess:
            stdout = MockOutput()

            def wait(self) -> int:  # pylint: disable=missing-docstring
                return 1

        def mock_popen(  # pylint: disable=unused-argument
            cmd: List[str], stdout: int, stderr: int, encoding: str
        ) -> MockProcess:
            return MockProcess()

        with self.swap(subprocess, 'Popen', mock_popen):
            with self.assertRaisesRegex(SystemExit, '1'):
                run_typescript_checks.run_ngcc()

    def test_compile_temp_strict_template_tsconfig_succeeds(self) -> None:
        """Test that temp template compilation succeeds without exiting."""
        with tempfile.TemporaryDirectory() as temp_dir:
            template_config_path = os.path.join(
                temp_dir, 'tsconfig-template-strict.json'
            )
            exclude_paths_path = os.path.join(
                temp_dir, 'template_strict_exclude_paths.txt'
            )
            temp_template_config_path = os.path.join(
                temp_dir, 'temp-tsconfig-template-strict.json'
            )
            compiled_js_dir = os.path.join(temp_dir, 'compiled_js', '')
            with open(template_config_path, 'w', encoding='utf-8') as f:
                json.dump({'include': []}, f)
            with open(exclude_paths_path, 'w', encoding='utf-8') as f:
                f.write('extensions/excluded.component.ts\n')
            os.mkdir(os.path.dirname(compiled_js_dir))

            captured_include: List[str] = []

            class MockOutput:
                def readline(self) -> str:  # pylint: disable=missing-docstring
                    return ''

            class MockProcess:
                stdout = MockOutput()

            def mock_popen(  # pylint: disable=unused-argument
                cmd: List[str], stdout: int, stderr: int, encoding: str
            ) -> MockProcess:
                self.assertEqual(
                    cmd,
                    [
                        './node_modules/.bin/ngc',
                        '--project',
                        'temp-template-config.json',
                    ],
                )
                return MockProcess()

            def mock_remove(filepath: str) -> None:
                with open(filepath, 'r', encoding='utf-8') as f:
                    captured_include.extend(json.load(f)['include'])
                os.unlink(filepath)

            print_arr: List[str] = []

            def mock_print(
                msg: str, end: str = '\n'  # pylint: disable=unused-argument
            ) -> None:
                print_arr.append(msg)

            with (
                self.swap(
                    run_typescript_checks,
                    'TEMPLATE_STRICT_TSCONFIG_FILEPATH',
                    template_config_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'TEMPLATE_STRICT_EXCLUDE_PATHS_FILEPATH',
                    exclude_paths_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'TEMP_TEMPLATE_STRICT_TSCONFIG_FILEPATH',
                    temp_template_config_path,
                ),
                self.swap(
                    run_typescript_checks, 'COMPILED_JS_DIR', compiled_js_dir
                ),
                self.swap(
                    run_typescript_checks,
                    'validate_compiled_js_dir',
                    lambda: None,
                ),
                self.swap(subprocess, 'Popen', mock_popen),
                self.swap(os, 'remove', mock_remove),
                self.swap(builtins, 'print', mock_print),
            ):
                run_typescript_checks.compile_temp_strict_template_tsconfig(
                    'temp-template-config.json',
                    [
                        'core/templates/a.component.ts: error',
                        'extensions/excluded.component.ts: error',
                    ],
                )

            self.assertEqual(
                captured_include,
                ['core/templates/a.component.ts', 'typings'],
            )
            self.assertFalse(os.path.exists(os.path.dirname(compiled_js_dir)))
            self.assertIn('Angular template compilation successful!', print_arr)

    def test_compile_temp_strict_template_tsconfig_failure_exits(self) -> None:
        """Test that temp template compilation failures exit with code 1."""
        with tempfile.TemporaryDirectory() as temp_dir:
            template_config_path = os.path.join(
                temp_dir, 'tsconfig-template-strict.json'
            )
            exclude_paths_path = os.path.join(
                temp_dir, 'template_strict_exclude_paths.txt'
            )
            temp_template_config_path = os.path.join(
                temp_dir, 'temp-tsconfig-template-strict.json'
            )
            with open(template_config_path, 'w', encoding='utf-8') as f:
                json.dump({'include': []}, f)
            with open(exclude_paths_path, 'w', encoding='utf-8') as f:
                f.write('')

            class MockOutput:
                def __init__(self) -> None:
                    self.call_counter = 0

                def readline(self) -> str:  # pylint: disable=missing-docstring
                    self.call_counter += 1
                    return {
                        1: 'core/templates/a.component.ts: template error',
                        2: '',
                    }[self.call_counter]

            class MockProcess:
                stdout = MockOutput()

            def mock_popen(  # pylint: disable=unused-argument
                cmd: List[str], stdout: int, stderr: int, encoding: str
            ) -> MockProcess:
                return MockProcess()

            original_exists = os.path.exists

            def mock_exists(filepath: str) -> bool:
                if filepath == temp_template_config_path:
                    return False
                return original_exists(filepath)

            print_arr: List[str] = []

            def mock_print(
                msg: str, end: str = '\n'  # pylint: disable=unused-argument
            ) -> None:
                print_arr.append(msg)

            with (
                self.swap(
                    run_typescript_checks,
                    'TEMPLATE_STRICT_TSCONFIG_FILEPATH',
                    template_config_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'TEMPLATE_STRICT_EXCLUDE_PATHS_FILEPATH',
                    exclude_paths_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'TEMP_TEMPLATE_STRICT_TSCONFIG_FILEPATH',
                    temp_template_config_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'validate_compiled_js_dir',
                    lambda: None,
                ),
                self.swap(os.path, 'exists', mock_exists),
                self.swap(subprocess, 'Popen', mock_popen),
                self.swap(builtins, 'print', mock_print),
            ):
                with self.assertRaisesRegex(SystemExit, '1'):
                    run_typescript_checks.compile_temp_strict_template_tsconfig(
                        'temp-template-config.json',
                        ['core/templates/a.component.ts: initial error'],
                    )

            self.assertIn(
                '1 Files with errors found during Angular template '
                'compilation.\n',
                print_arr,
            )

    def test_compile_and_check_angular_templates_runs_expected_steps(
        self,
    ) -> None:
        """Test that Angular template checks update config and invoke helpers."""
        with tempfile.TemporaryDirectory() as temp_dir:
            template_config_path = os.path.join(
                temp_dir, 'tsconfig-template-strict.json'
            )
            compiled_js_dir = os.path.join(temp_dir, 'compiled_js', '')
            os.mkdir(os.path.dirname(compiled_js_dir))
            with open(template_config_path, 'w', encoding='utf-8') as f:
                json.dump({'include': ['old/path.ts']}, f)

            class MockOutput:
                def __init__(self) -> None:
                    self.call_counter = 0

                def readline(self) -> str:  # pylint: disable=missing-docstring
                    self.call_counter += 1
                    return {
                        1: 'core/templates/sample.component.ts: error',
                        2: '',
                    }[self.call_counter]

            class MockProcess:
                stdout = MockOutput()

            compile_temp_calls: List[tuple[str, List[str]]] = []
            hashes_written: List[Dict[str, str]] = []
            ngcc_calls: List[str] = []

            def mock_popen(  # pylint: disable=unused-argument
                cmd: List[str], stdout: int, stderr: int, encoding: str
            ) -> MockProcess:
                self.assertEqual(
                    cmd,
                    [
                        './node_modules/.bin/ngc',
                        '--project',
                        'template-config.json',
                    ],
                )
                return MockProcess()

            def mock_compile_temp(config_path: str, errors: List[str]) -> None:
                compile_temp_calls.append((config_path, errors))

            def mock_write_hashes_json_file(hashes: Dict[str, str]) -> None:
                hashes_written.append(hashes)

            with (
                self.swap(
                    run_typescript_checks,
                    'TEMPLATE_STRICT_TSCONFIG_FILEPATH',
                    template_config_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'COMPILED_JS_DIR',
                    compiled_js_dir,
                ),
                self.swap(
                    run_typescript_checks,
                    'validate_compiled_js_dir',
                    lambda: None,
                ),
                self.swap(
                    run_typescript_checks,
                    'run_ngcc',
                    lambda: ngcc_calls.append('called'),
                ),
                self.swap(
                    run_typescript_checks,
                    'compile_temp_strict_template_tsconfig',
                    mock_compile_temp,
                ),
                self.swap(
                    common,
                    'write_hashes_json_file',
                    mock_write_hashes_json_file,
                ),
                self.swap(subprocess, 'Popen', mock_popen),
            ):
                run_typescript_checks.compile_and_check_angular_templates(
                    'template-config.json'
                )

            self.assertEqual(hashes_written, [{}])
            self.assertEqual(ngcc_calls, ['called'])
            self.assertFalse(os.path.exists(os.path.dirname(compiled_js_dir)))
            self.assertEqual(
                compile_temp_calls,
                [
                    (
                        run_typescript_checks.TEMP_TEMPLATE_STRICT_TSCONFIG_FILEPATH,
                        ['core/templates/sample.component.ts: error'],
                    )
                ],
            )

    def test_compile_and_check_angular_templates_without_compiled_dir(
        self,
    ) -> None:
        """Test that Angular template checks run without a compiled dir."""
        with tempfile.TemporaryDirectory() as temp_dir:
            template_config_path = os.path.join(
                temp_dir, 'tsconfig-template-strict.json'
            )
            compiled_js_dir = os.path.join(temp_dir, 'compiled_js', '')
            with open(template_config_path, 'w', encoding='utf-8') as f:
                json.dump({'include': ['old/path.ts']}, f)

            class MockOutput:
                def readline(self) -> str:  # pylint: disable=missing-docstring
                    return ''

            class MockProcess:
                stdout = MockOutput()

            ngcc_calls: List[str] = []
            compile_temp_calls: List[tuple[str, List[str]]] = []

            def mock_popen(  # pylint: disable=unused-argument
                cmd: List[str], stdout: int, stderr: int, encoding: str
            ) -> MockProcess:
                return MockProcess()

            def mock_compile_temp(config_path: str, errors: List[str]) -> None:
                compile_temp_calls.append((config_path, errors))

            with (
                self.swap(
                    run_typescript_checks,
                    'TEMPLATE_STRICT_TSCONFIG_FILEPATH',
                    template_config_path,
                ),
                self.swap(
                    run_typescript_checks,
                    'COMPILED_JS_DIR',
                    compiled_js_dir,
                ),
                self.swap(
                    run_typescript_checks,
                    'validate_compiled_js_dir',
                    lambda: None,
                ),
                self.swap(
                    run_typescript_checks,
                    'run_ngcc',
                    lambda: ngcc_calls.append('called'),
                ),
                self.swap(
                    run_typescript_checks,
                    'compile_temp_strict_template_tsconfig',
                    mock_compile_temp,
                ),
                self.swap(
                    common,
                    'write_hashes_json_file',
                    lambda _hashes: None,
                ),
                self.swap(subprocess, 'Popen', mock_popen),
            ):
                run_typescript_checks.compile_and_check_angular_templates(
                    'template-config.json'
                )

            self.assertEqual(ngcc_calls, ['called'])
            self.assertEqual(
                compile_temp_calls,
                [
                    (
                        run_typescript_checks.TEMP_TEMPLATE_STRICT_TSCONFIG_FILEPATH,
                        [],
                    )
                ],
            )

    def test_config_path_when_no_arg_is_used(self) -> None:
        """Test if the config path is correct when no arg is used."""

        def mock_compile_and_check_typescript(config_path: str) -> None:
            self.assertEqual(
                config_path, run_typescript_checks.TSCONFIG_FILEPATH
            )

        compile_and_check_typescript_swap = self.swap(
            run_typescript_checks,
            'compile_and_check_typescript',
            mock_compile_and_check_typescript,
        )
        compile_and_check_angular_templates_swap = self.swap(
            run_typescript_checks,
            'compile_and_check_angular_templates',
            lambda _config_path: self.fail(
                'Template strict checks should not run without --strict_checks.'
            ),
        )

        with (
            compile_and_check_typescript_swap,
            compile_and_check_angular_templates_swap,
        ):
            run_typescript_checks.main(args=[])

    def test_config_path_when_strict_checks_arg_is_used(self) -> None:
        """Test if the config path is correct when strict checks arg is used."""

        def mock_compile_and_check_typescript(config_path: str) -> None:
            self.assertEqual(
                config_path, run_typescript_checks.STRICT_TSCONFIG_FILEPATH
            )

        def mock_compile_and_check_angular_templates(config_path: str) -> None:
            self.assertEqual(
                config_path,
                run_typescript_checks.TEMPLATE_STRICT_TSCONFIG_FILEPATH,
            )

        compile_and_check_typescript_swap = self.swap(
            run_typescript_checks,
            'compile_and_check_typescript',
            mock_compile_and_check_typescript,
        )
        compile_and_check_angular_templates_swap = self.swap(
            run_typescript_checks,
            'compile_and_check_angular_templates',
            mock_compile_and_check_angular_templates,
        )

        with (
            compile_and_check_typescript_swap,
            compile_and_check_angular_templates_swap,
        ):
            run_typescript_checks.main(args=['--strict_checks'])

    def test_run_typescript_type_tests_passed(self) -> None:
        """Test that type tests pass successfully without exiting."""

        class MockFile:
            def read(self) -> bytes:  # pylint: disable=missing-docstring
                return b''

        class MockTask:
            def __init__(
                self,
                returncode: int,
                stdout_output: bytes,  # pylint: disable=unused-argument
            ) -> None:
                self.returncode = returncode
                self.stdout = MockFile()
                self.stderr = MockFile()

            def wait(self) -> None:  # pylint: disable=missing-docstring
                return None

        def mock_popen(  # pylint: disable=unused-argument
            cmd: str, stdout: int, stderr: int
        ) -> MockTask:
            return MockTask(0, b'')

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        print_arr: List[str] = []

        def mock_print(
            msg: str, end: str = '\n'  # pylint: disable=unused-argument
        ) -> None:
            print_arr.append(msg)

        print_swap = self.swap(builtins, 'print', mock_print)

        with popen_swap, print_swap:
            run_typescript_checks.run_typescript_type_tests()

        self.assertIn('Running TypeScript type tests.', print_arr)
        self.assertIn('Done!', print_arr)

    def test_run_typescript_type_tests_failed(self) -> None:
        """Test that type tests exit with error on failure."""

        class MockFile:
            def read(self) -> bytes:  # pylint: disable=missing-docstring
                return b''

        class MockTask:
            def __init__(
                self,
                returncode: int,
                stdout_output: bytes,  # pylint: disable=unused-argument
            ) -> None:
                self.returncode = returncode
                self.stdout = MockFile()
                self.stderr = MockFile()

            def wait(self) -> None:  # pylint: disable=missing-docstring
                return None

        def mock_popen(  # pylint: disable=unused-argument
            cmd: str, stdout: int, stderr: int
        ) -> MockTask:
            return MockTask(1, b'')

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        print_arr: List[str] = []

        def mock_print(
            msg: str, end: str = '\n'  # pylint: disable=unused-argument
        ) -> None:
            print_arr.append(msg)

        print_swap = self.swap(builtins, 'print', mock_print)

        def mock_exit(code: int) -> None:
            raise SystemExit(code)

        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(1,)]
        )

        with popen_swap, print_swap, exit_swap:
            with self.assertRaisesRegex(SystemExit, '1'):
                run_typescript_checks.run_typescript_type_tests()

        self.assertIn('Running TypeScript type tests.', print_arr)
        self.assertNotIn('Done!', print_arr)
