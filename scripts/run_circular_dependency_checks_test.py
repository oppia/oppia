# Copyright 2025 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at.
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software.
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and.
# limitations under the License.

'''Unit tests for scripts/run_circular_dependency_checks.py.

This test file follows Oppia's established testing patterns and conventions.
It uses mocking to isolate functionality and test individual components
without requiring external dependencies like Madge.

Run this test with:
    python -m scripts.run_circular_dependency_checks_test
'''

from __future__ import annotations

import contextlib
import os
import subprocess
import sys
import unittest
from typing import Any, Iterator, List, Tuple

# Add the current directory to sys.path so we can import our script.
if '.' not in sys.path:
    sys.path.insert(0, '.')

from scripts import common
from scripts import run_circular_dependency_checks


class TestBase:
    '''Base test class with swap functionality similar to Oppia's test_utils.'''

    @contextlib.contextmanager
    def swap(self, obj: Any, attr: str, newvalue: Any) -> Iterator[None]:
    # Here we use type Any because mock objects need flexible typing.
        '''Swap an object's attribute value within the context of a 'with'
        statement. Similar to Oppia's test_utils.swap method.
        '''
        original = getattr(obj, attr)
        setattr(obj, attr, newvalue)
        try:
            yield
        finally:
            setattr(obj, attr, original)


class MockSubprocessReturn:
    '''Mock subprocess return object.'''

    def __init__(self, returncode: int = 0, stdout: str = '', stderr: str = '') -> None:
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


class RunCircularDependencyChecksTests(unittest.TestCase, TestBase):
    '''Test the circular dependency checking functionality.

    This test class follows Oppia's established testing patterns
    and provides comprehensive validation of all functionality.
    '''

    def test_get_madge_config_defaults(self) -> None:
        '''Test default Madge configuration generation.'''
        config = run_circular_dependency_checks.get_madge_config()

        self.assertEqual(config['extensions'], ['ts', 'js'])
        self.assertTrue(config['circular'])
        self.assertEqual(config['format'], 'text')
        self.assertIn('node_modules/', config['exclude_patterns'])
        self.assertIn('**/*.spec.ts', config['exclude_patterns'])

    def test_get_madge_config_with_custom_excludes(self) -> None:
        '''Test Madge configuration with additional exclusions.'''
        custom_excludes = ['custom_exclude/', '**/*.custom.ts']
        config = run_circular_dependency_checks.get_madge_config(
            exclude_patterns=custom_excludes
        )

        # Should contain both default and custom excludes.
        self.assertIn('node_modules/', config['exclude_patterns'])
        self.assertIn('custom_exclude/', config['exclude_patterns'])
        self.assertIn('**/*.custom.ts', config['exclude_patterns'])

    def test_get_madge_config_json_format(self) -> None:
        '''Test Madge configuration with JSON output format.'''
        config = run_circular_dependency_checks.get_madge_config(
            output_format='json'
        )

        self.assertEqual(config['format'], 'json')

    def test_check_madge_installation_global_success(self) -> None:
        '''Test successful global Madge installation detection.'''
        def mock_run_success(*args: Any, **kwargs: Any) -> MockSubprocessReturn:
        # Here we use type Any because mock objects need flexible typing.
            return MockSubprocessReturn(returncode=0, stdout='6.1.0')

        with self.swap(subprocess, 'run', mock_run_success):
            result = run_circular_dependency_checks.check_madge_installation()
            self.assertEqual(result, 'madge')

    def test_check_madge_installation_skip_check(self) -> None:
        '''Test skipping Madge installation check.'''
        def mock_run_not_called(*args: Any, **kwargs: Any) -> MockSubprocessReturn:
        # Here we use type Any because mock objects need flexible typing.
            self.fail('subprocess.run should not be called when skip_check=True')

        with self.swap(subprocess, 'run', mock_run_not_called):
            result = run_circular_dependency_checks.check_madge_installation(
                skip_check=True
            )
            self.assertEqual(result, 'madge')

    def test_validate_target_paths_all_exist(self) -> None:
        '''Test path validation when all paths exist.'''
        def mock_path_exists(path: str) -> bool:
            return True

        with self.swap(os.path, 'exists', mock_path_exists):
            targets = ['path1', 'path2', 'path3']
            result = run_circular_dependency_checks.validate_target_paths(targets)
            self.assertEqual(result, targets)

    def test_validate_target_paths_some_missing(self) -> None:
        '''Test path validation with some missing paths.'''
        def mock_path_exists(path: str) -> bool:
            return path in ['path1', 'path3']

        with self.swap(os.path, 'exists', mock_path_exists):
            targets = ['path1', 'missing_path', 'path3']
            result = run_circular_dependency_checks.validate_target_paths(targets)
            self.assertEqual(result, ['path1', 'path3'])

    def test_run_madge_command_success_no_cycles(self) -> None:
        '''Test successful Madge execution with no circular dependencies.'''
        def mock_run_no_cycles(*args: Any, **kwargs: Any) -> MockSubprocessReturn:
        # Here we use type Any because mock objects need flexible typing.
            return MockSubprocessReturn(returncode=0, stdout='', stderr='')

        with self.swap(subprocess, 'run', mock_run_no_cycles):
            with self.swap(common, 'CURR_DIR', '/oppia/root'):
                config = run_circular_dependency_checks.get_madge_config()
                success, output = run_circular_dependency_checks.run_madge_command(
                    'madge', ['core'], config
                )

        self.assertTrue(success)
        self.assertEqual(output, 'No circular dependencies detected.')

    def test_run_madge_command_success_with_cycles(self) -> None:
        '''Test successful Madge execution with circular dependencies found.'''
        circular_output = 'file1.ts > file2.ts > file1.ts'

        def mock_run_with_cycles(*args: Any, **kwargs: Any) -> MockSubprocessReturn:
        # Here we use type Any because mock objects need flexible typing.
            return MockSubprocessReturn(
                returncode=0,
                stdout=circular_output,
                stderr=''
            )

        with self.swap(subprocess, 'run', mock_run_with_cycles):
            with self.swap(common, 'CURR_DIR', '/oppia/root'):
                config = run_circular_dependency_checks.get_madge_config()
                success, output = run_circular_dependency_checks.run_madge_command(
                    'madge', ['core'], config
                )

        self.assertFalse(success)
        self.assertEqual(output, circular_output)

    def test_check_circular_dependencies_success(self) -> None:
        '''Test successful circular dependency check with no cycles found.'''
        def mock_validate_paths(targets: List[str], verbose: bool = False) -> List[str]:
            return targets

        def mock_check_installation(skip_check: bool = False) -> str:
            return 'madge'

        def mock_run_madge(
            madge_cmd: str,
            targets: List[str],
            config: Any,
            # Here we use type Any because mock objects need flexible typing.
            timeout: int = 300,
            verbose: bool = False
        ) -> Tuple[bool, str]:
            return (True, 'No circular dependencies detected.')

        with self.swap(run_circular_dependency_checks, 'validate_target_paths', mock_validate_paths):
            with self.swap(run_circular_dependency_checks, 'check_madge_installation', mock_check_installation):
                with self.swap(run_circular_dependency_checks, 'run_madge_command', mock_run_madge):
                    success, message = run_circular_dependency_checks.check_circular_dependencies(
                        files=['core'], verbose=True
                    )

        self.assertTrue(success)
        self.assertEqual(message, 'No circular dependencies detected.')

    def test_check_circular_dependencies_failure(self) -> None:
        '''Test circular dependency check with cycles found.'''
        def mock_validate_paths(targets: List[str], verbose: bool = False) -> List[str]:
            return targets

        def mock_check_installation(skip_check: bool = False) -> str:
            return 'madge'

        def mock_run_madge(
            madge_cmd: str,
            targets: List[str],
            config: Any,
            # Here we use type Any because mock objects need flexible typing.
            timeout: int = 300,
            verbose: bool = False
        ) -> Tuple[bool, str]:
            return (False, 'Circular dependencies detected')

        with self.swap(run_circular_dependency_checks, 'validate_target_paths', mock_validate_paths):
            with self.swap(run_circular_dependency_checks, 'check_madge_installation', mock_check_installation):
                with self.swap(run_circular_dependency_checks, 'run_madge_command', mock_run_madge):
                    success, message = run_circular_dependency_checks.check_circular_dependencies(
                        files=['core'], verbose=True
                    )

        self.assertFalse(success)
        self.assertEqual(message, 'Circular dependencies detected')

    def test_main_success(self) -> None:
        '''Test main function with successful check.'''
        def mock_check_dependencies(*args: Any, **kwargs: Any) -> Tuple[bool, str]:
        # Here we use type Any because mock objects need flexible typing.
            return (True, 'No circular dependencies found.')

        with self.swap(run_circular_dependency_checks, 'check_circular_dependencies', mock_check_dependencies):
            with self.swap(sys, 'exit', lambda code: None):
                run_circular_dependency_checks.main(['--files', 'core'])

    def test_main_failure(self) -> None:
        '''Test main function with circular dependencies found.'''
        def mock_check_dependencies(*args: Any, **kwargs: Any) -> Tuple[bool, str]:
        # Here we use type Any because mock objects need flexible typing.
            return (False, 'Circular dependencies detected')

        with self.assertRaisesRegex(SystemExit, '1'):
            run_circular_dependency_checks.main(['--files', 'core'])

    def test_argument_parsing_defaults(self) -> None:
        '''Test default command line argument parsing.'''
        args = run_circular_dependency_checks._PARSER.parse_args([])
        self.assertIsNone(args.files)
        self.assertFalse(args.verbose)
        self.assertFalse(args.skip_install_check)
        self.assertEqual(args.format, 'text')
        self.assertEqual(args.timeout, 300)

    def test_argument_parsing_custom(self) -> None:
        '''Test custom command line argument parsing.'''
        args = run_circular_dependency_checks._PARSER.parse_args([
            '--files', 'core', 'extensions',
            '--verbose',
            '--skip-install-check',
            '--exclude', '**/*.custom.ts',
            '--format', 'json',
            '--timeout', '120'
        ])

        self.assertEqual(args.files, ['core', 'extensions'])
        self.assertTrue(args.verbose)
        self.assertTrue(args.skip_install_check)
        self.assertEqual(args.exclude, ['**/*.custom.ts'])
        self.assertEqual(args.format, 'json')
        self.assertEqual(args.timeout, 120)

    def test_default_exclude_patterns_comprehensive(self) -> None:
        '''Test that default exclusion patterns cover all necessary files.'''
        patterns = run_circular_dependency_checks.DEFAULT_EXCLUDE_PATTERNS

        # Should exclude node modules and third party.
        self.assertIn('node_modules/', patterns)
        self.assertIn('third_party/', patterns)

        # Should exclude all test files.
        self.assertIn('**/*.spec.ts', patterns)
        self.assertIn('**/*.test.ts', patterns)
        self.assertIn('**/*_test.ts', patterns)
        self.assertIn('core/tests/', patterns)

        # Should exclude generated and infrastructure files.
        self.assertIn('stubs/', patterns)
        self.assertIn('typings/', patterns)
        self.assertIn('local_compiled_js_for_test/', patterns)

    def test_default_target_directories(self) -> None:
        '''Test that default target directories are correct.'''
        targets = run_circular_dependency_checks.DEFAULT_TARGET_DIRECTORIES

        expected_targets = ['core', 'extensions', 'assets']
        self.assertEqual(targets, expected_targets)

    def test_integration_scenario(self) -> None:
        '''Test comprehensive integration scenario with all components.'''
        mock_subprocess_calls = []

        def mock_subprocess_run(*args, **kwargs):
            mock_subprocess_calls.append((args, kwargs))
            # Mock successful madge execution with no cycles.
            return MockSubprocessReturn(returncode=0, stdout='', stderr='')

        def mock_path_exists(path: str) -> bool:
            return True  # All paths exist.

        with self.swap(subprocess, 'run', mock_subprocess_run):
            with self.swap(os.path, 'exists', mock_path_exists):
                success, message = run_circular_dependency_checks.check_circular_dependencies(
                    files=['core', 'extensions'],
                    verbose=True,
                    skip_install_check=False
                )

        self.assertTrue(success)
        self.assertEqual(message, 'No circular dependencies detected.')

        # Verify subprocess calls were made.
        self.assertGreater(len(mock_subprocess_calls), 0)

    def test_error_handling_scenarios(self) -> None:
        '''Test various error handling scenarios.'''
        # Test subprocess timeout.
        def mock_run_timeout(*args: Any, **kwargs: Any) -> None:
        # Here we use type Any because mock objects need flexible typing.
            raise subprocess.TimeoutExpired('madge', 30)

        with self.swap(subprocess, 'run', mock_run_timeout):
            with self.swap(common, 'CURR_DIR', '/oppia/root'):
                config = run_circular_dependency_checks.get_madge_config()
                success, output = run_circular_dependency_checks.run_madge_command(
                    'madge', ['core'], config
                )

        self.assertFalse(success)
        self.assertIn('timed out', output.lower())

        # Test subprocess error.
        def mock_run_error(*args: Any, **kwargs: Any) -> MockSubprocessReturn:
        # Here we use type Any because mock objects need flexible typing.
            return MockSubprocessReturn(returncode=127, stderr='Command not found')

        with self.swap(subprocess, 'run', mock_run_error):
            with self.swap(common, 'CURR_DIR', '/oppia/root'):
                config = run_circular_dependency_checks.get_madge_config()
                success, output = run_circular_dependency_checks.run_madge_command(
                    'madge', ['core'], config
                )

        self.assertFalse(success)
        self.assertIn('Command not found', output)


def main() -> None:
    '''Main function to run tests similar to run_acceptance_tests.py pattern.'''
    print('🧪 Running Oppia Circular Dependency Checker Tests')
    print('=' * 50)

    # Create test suite.
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(RunCircularDependencyChecksTests)

    # Run tests with detailed output.
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    # Print summary.
    tests_run = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)

    print('\n' + '=' * 50)
    print(f'📊 Test Summary:')
    print(f'   Tests run: {tests_run}')
    print(f'   Failures: {failures}')
    print(f'   Errors: {errors}')

    if failures == 0 and errors == 0:
        print('🎉 All tests passed!')
        sys.exit(0)
    else:
        print('❌ Some tests failed!')
        sys.exit(1)


if __name__ == '__main__':  # pragma: no cover.
    main()
