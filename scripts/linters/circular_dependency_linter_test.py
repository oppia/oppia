# coding: utf-8
#
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

'''Tests for circular_dependency_linter.py.'''

from __future__ import annotations

import subprocess
from unittest import mock

from core.tests import test_utils
from scripts.linters import circular_dependency_linter
from scripts.linters import run_lint_checks


class CircularDependencyLintChecksManagerTests(test_utils.GenericTestBase):
    '''Test the CircularDependencyLintChecksManager class.'''

    def setUp(self) -> None:
        super().setUp()
        self.file_cache = run_lint_checks.FileCache()

    def test_init_with_empty_lists(self) -> None:
        manager = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                [], [], self.file_cache))
        self.assertEqual(manager.js_filepaths, [])
        self.assertEqual(manager.ts_filepaths, [])
        self.assertEqual(manager.all_filepaths, [])

    def test_init_with_files(self) -> None:
        js_files = ['file1.js', 'file2.js']
        ts_files = ['file1.ts', 'file2.ts']
        manager = (
            circular_dependency_linter.CircularDependencyLintChecksManager(
                js_files, ts_files, self.file_cache))

        self.assertEqual(manager.js_filepaths, js_files)
        self.assertEqual(manager.ts_filepaths, ts_files)
        self.assertEqual(manager.all_filepaths, js_files + ts_files)

    def test_perform_all_lint_checks_with_no_files(self) -> None:
        manager = circular_dependency_linter.CircularDependencyLintChecksManager(
            [], [], self.file_cache)
        results = manager.perform_all_lint_checks()

        self.assertEqual(len(results), 1)
        self.assertFalse(results[0].failed)
        self.assertIn('no JavaScript or Typescript files', results[0].messages[0])

    def test_perform_all_lint_checks_with_files(self) -> None:
        manager = circular_dependency_linter.CircularDependencyLintChecksManager(
            ['file1.js'], ['file1.ts'], self.file_cache)
        results = manager.perform_all_lint_checks()

        # Custom linter returns empty results since all checks are in third-party.
        self.assertEqual(len(results), 0)


class ThirdPartyCircularDependencyLintChecksManagerTests(test_utils.GenericTestBase):
    '''Test the ThirdPartyCircularDependencyLintChecksManager class.'''

    def test_init_with_files(self) -> None:
        files = ['file1.ts', 'file2.js']
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(files)
        self.assertEqual(manager.all_filepaths, files)

    @mock.patch('subprocess.run')
    def test_check_madge_installation_returns_true_when_local_madge_exists(
        self, mock_subprocess_run: mock.Mock
    ) -> None:
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])

        with mock.patch('os.path.exists', return_value=True):
            result = manager._check_madge_installation()
            self.assertTrue(result)

    @mock.patch('subprocess.run')
    def test_check_madge_installation_returns_true_when_global_madge_works(
        self, mock_subprocess_run: mock.Mock
    ) -> None:
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        mock_process = mock.Mock()
        mock_process.returncode = 0
        mock_subprocess_run.return_value = mock_process

        with mock.patch('os.path.exists', return_value=False):
            result = manager._check_madge_installation()
            self.assertTrue(result)

    @mock.patch('subprocess.run')
    def test_check_madge_installation_returns_false_when_madge_not_available(
        self, mock_subprocess_run: mock.Mock
    ) -> None:
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        mock_process = mock.Mock()
        mock_process.returncode = 1
        mock_subprocess_run.return_value = mock_process

        with mock.patch('os.path.exists', return_value=False):
            result = manager._check_madge_installation()
            self.assertFalse(result)

    @mock.patch('subprocess.run')
    def test_check_madge_installation_handles_exceptions(
        self, mock_subprocess_run: mock.Mock
    ) -> None:
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        mock_subprocess_run.side_effect = subprocess.TimeoutExpired('madge', timeout=10)

        with mock.patch('os.path.exists', return_value=False):
            result = manager._check_madge_installation()
            self.assertFalse(result)

    def test_lint_circular_dependencies_no_files(self) -> None:
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager([])
        result = manager._lint_circular_dependencies()

        self.assertFalse(result.failed)
        self.assertIn('no JavaScript or Typescript files', result.messages[0])

    @mock.patch.object(
        circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager,
        '_check_madge_installation'
    )
    def test_lint_circular_dependencies_madge_not_installed(
        self, mock_check_installation: mock.Mock
    ) -> None:
        mock_check_installation.return_value = False
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        result = manager._lint_circular_dependencies()

        self.assertTrue(result.failed)
        self.assertIn('Madge is not installed', result.messages[0])

    @mock.patch.object(
        circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager,
        '_check_madge_installation'
    )
    @mock.patch('subprocess.Popen')
    @mock.patch('os.path.exists')
    def test_lint_circular_dependencies_no_circular_deps(
        self,
        mock_exists: mock.Mock,
        mock_popen: mock.Mock,
        mock_check_installation: mock.Mock
    ) -> None:
        mock_check_installation.return_value = True
        mock_exists.return_value = True
        mock_process = mock.Mock()
        mock_process.communicate.return_value = (b'', b'')
        mock_popen.return_value = mock_process

        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        result = manager._lint_circular_dependencies()

        self.assertFalse(result.failed)
        self.assertIn('No circular dependencies found', result.messages[0])

    @mock.patch.object(
        circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager,
        '_check_madge_installation'
    )
    @mock.patch('subprocess.Popen')
    @mock.patch('os.path.exists')
    def test_lint_circular_dependencies_detects_circular_deps(
        self,
        mock_exists: mock.Mock,
        mock_popen: mock.Mock,
        mock_check_installation: mock.Mock
    ) -> None:
        mock_check_installation.return_value = True
        mock_exists.return_value = True
        mock_process = mock.Mock()
        mock_process.communicate.return_value = (b'file1.ts > file2.ts > file1.ts', b'')
        mock_popen.return_value = mock_process

        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        result = manager._lint_circular_dependencies()

        self.assertTrue(result.failed)
        self.assertIn('Circular dependencies detected', result.messages[0])

    @mock.patch.object(
        circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager,
        '_check_madge_installation'
    )
    @mock.patch('subprocess.Popen')
    @mock.patch('os.path.exists')
    def test_lint_circular_dependencies_handles_stderr(
        self,
        mock_exists: mock.Mock,
        mock_popen: mock.Mock,
        mock_check_installation: mock.Mock
    ) -> None:
        mock_check_installation.return_value = True
        mock_exists.return_value = True
        mock_process = mock.Mock()
        mock_process.communicate.return_value = (b'', b'Madge error')
        mock_popen.return_value = mock_process

        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])
        result = manager._lint_circular_dependencies()

        self.assertTrue(result.failed)
        self.assertIn('Madge error', result.messages[0])

    def test_perform_all_lint_checks(self) -> None:
        manager = circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager(['test.ts'])

        with mock.patch.object(manager, '_lint_circular_dependencies') as mock_lint:
            mock_result = mock.Mock()
            mock_lint.return_value = mock_result

            results = manager.perform_all_lint_checks()

            self.assertEqual(len(results), 1)
            self.assertEqual(results[0], mock_result)


class GetLintersTests(test_utils.GenericTestBase):
    '''Test the get_linters function.'''

    def test_get_linters_returns_correct_types(self) -> None:
        file_cache = run_lint_checks.FileCache()
        js_files = ['file1.js']
        ts_files = ['file1.ts']

        custom_linter, third_party_linter = circular_dependency_linter.get_linters(
            js_files, ts_files, file_cache)

        self.assertIsInstance(
            custom_linter,
            circular_dependency_linter.CircularDependencyLintChecksManager)
        self.assertIsInstance(
            third_party_linter,
            circular_dependency_linter.ThirdPartyCircularDependencyLintChecksManager)

        self.assertEqual(custom_linter.js_filepaths, js_files)
        self.assertEqual(custom_linter.ts_filepaths, ts_files)
        self.assertEqual(third_party_linter.all_filepaths, js_files + ts_files)
