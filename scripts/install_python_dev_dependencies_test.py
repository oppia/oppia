# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Tests for install_python_dev_dependencies.py."""

from __future__ import annotations

import builtins
import contextlib
import io
import os
import subprocess
import sys

from core.tests import test_utils
from scripts import install_python_dev_dependencies

from typing import Dict, Generator, List, Optional


class InstallPythonDevDependenciesTests(test_utils.GenericTestBase):

    @contextlib.contextmanager
    def sys_real_prefix_context(
        self, new_value: str,
    ) -> Generator[None, None, None]:
        """Create a context manager to temporarily set sys.real_prefix.

        Args:
            new_value: str. The new value of sys.real_prefix to set.

        Yields:
            None. Yields nothing, but upon yielding sys.real_prefix will be set.
        """
        had_attribute = hasattr(sys, 'real_prefix')
        if had_attribute:
            original = getattr(sys, 'real_prefix')
        setattr(sys, 'real_prefix', new_value)
        try:
            yield
        finally:
            if had_attribute:
                # Pylint doesn't recognize that if we reach this part of the
                # code, then had_attribute is True, which means that we did set
                # `original` above.
                setattr(sys, 'real_prefix', original)  # pylint: disable=used-before-assignment
            else:
                delattr(sys, 'real_prefix')

    def test_check_python_env_is_suitable_passes_when_in_venv(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/oppia')
        real_prefix_manager = self.sys_real_prefix_context('')
        environ_swap = self.swap(os, 'environ', {})
        with prefix_swap, base_prefix_swap, real_prefix_manager, environ_swap:
            install_python_dev_dependencies.check_python_env_is_suitable()

    def test_check_python_env_is_suitable_passes_when_in_venv_real_prefix(
        self
    ) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/3.7.10')
        real_prefix_manager = self.sys_real_prefix_context(
            '/home/user/.pyenv/versions/oppia')
        environ_swap = self.swap(os, 'environ', {})
        with prefix_swap, base_prefix_swap, real_prefix_manager, environ_swap:
            install_python_dev_dependencies.check_python_env_is_suitable()

    def test_check_python_env_is_suitable_fails_when_out_of_venv(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/3.7.10')
        real_prefix_manager = self.sys_real_prefix_context('')
        environ_swap = self.swap(os, 'environ', {})
        expected_error = (
            'Oppia must be developed within a virtual environment.')
        with self.assertRaisesRegex(
            AssertionError, expected_error
        ):
            with prefix_swap, base_prefix_swap, real_prefix_manager:
                with environ_swap:
                    (
                        install_python_dev_dependencies
                        .check_python_env_is_suitable()
                    )

    def test_check_python_env_is_suitable_passes_when_on_ci(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/3.7.10')
        real_prefix_manager = self.sys_real_prefix_context('')
        environ_swap = self.swap(os, 'environ', {'GITHUB_ACTION': '1'})
        with prefix_swap, base_prefix_swap, real_prefix_manager, environ_swap:
            install_python_dev_dependencies.check_python_env_is_suitable()

    def test_install_installation_tools(self) -> None:
        expected_tools = {
            'pip': '24.3.1',
            'pip-tools': '7.4.1',
            'setuptools': '75.6.0',
        }
        installed_tools: Dict[str, str] = {}

        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stdin: Optional[int] = None,
            stderr: Optional[int] = None
        ) -> subprocess.Popen[bytes]:
            if len(cmd_tokens) > 3 and cmd_tokens[3] == 'install':
                package, version = cmd_tokens[4].split('==')
                installed_tools[package] = version
                self.assertEqual(cmd_tokens, [
                    sys.executable, '-m', 'pip', 'install',
                    f'{package}=={version}',
                ])
            return process

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)

        with popen_swap:
            install_python_dev_dependencies.install_installation_tools()

        self.assertEqual(installed_tools, expected_tools)

    def test_install_dev_dependencies(self) -> None:

        def mock_run(*_args: str, **_kwargs: str) -> None:  # pylint: disable=unused-argument
            pass

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                (
                    ['pip-sync', 'requirements_dev.txt',
                    '--pip-args', '--require-hashes --no-deps'],
                ),
            ],
            expected_kwargs=[
                {'check': True, 'encoding': 'utf-8'},
            ]
        )

        with run_swap:
            install_python_dev_dependencies.install_dev_dependencies()

    def test_uninstall_dev_dependencies(self) -> None:

        def mock_run(*_args: str, **_kwargs: str) -> None:  # pylint: disable=unused-argument
            pass

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                (['pip', 'uninstall', '-r', 'requirements_dev.txt', '-y'],),
            ],
            expected_kwargs=[
                {'check': True, 'encoding': 'utf-8'},
            ]
        )

        with run_swap:
            install_python_dev_dependencies.uninstall_dev_dependencies()

    def test_compile_pip_requirements_no_change(self) -> None:

        def mock_run(*_args: str, **_kwargs: str) -> None:  # pylint: disable=unused-argument
            pass

        def mock_open(*_args: str, **_kwargs: str) -> io.StringIO:
            return io.StringIO('mock file contents')

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                ([
                    'pip-compile', '--no-emit-index-url', '--quiet',
                    '--strip-extras', '--generate-hashes',
                    'requirements_dev.in',
                    '--output-file', 'requirements_dev.txt',
                ],),
            ],
            expected_kwargs=[
                {'check': True, 'encoding': 'utf-8'},
            ]
        )
        open_swap = self.swap_with_checks(
            builtins, 'open', mock_open, expected_args=[
                ('requirements_dev.txt', 'r'),
                ('requirements_dev.txt', 'r'),
            ],
            expected_kwargs=[
                {'encoding': 'utf-8'},
                {'encoding': 'utf-8'},
            ],
        )

        with run_swap, open_swap:
            change = (
                install_python_dev_dependencies.compile_pip_requirements(
                    'requirements_dev.in', 'requirements_dev.txt'))
        self.assertFalse(change)

    def test_compile_pip_requirements_change(self) -> None:

        def mock_run(*_args: str, **_kwargs: str) -> None:  # pylint: disable=unused-argument
            pass

        counter = []

        def mock_open(*_args: str, **_kwargs: str) -> io.StringIO:
            counter.append(1)
            return io.StringIO(f'mock file contents {len(counter)}')

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                ([
                    'pip-compile', '--no-emit-index-url', '--quiet',
                    '--strip-extras', '--generate-hashes',
                    'requirements_dev.in',
                    '--output-file', 'requirements_dev.txt',
                ],),
            ],
            expected_kwargs=[
                {'check': True, 'encoding': 'utf-8'},
            ]
        )
        open_swap = self.swap_with_checks(
            builtins, 'open', mock_open, expected_args=[
                ('requirements_dev.txt', 'r'),
                ('requirements_dev.txt', 'r'),
            ],
            expected_kwargs=[
                {'encoding': 'utf-8'},
                {'encoding': 'utf-8'},
            ],
        )

        with run_swap, open_swap:
            change = (
                install_python_dev_dependencies.compile_pip_requirements(
                    'requirements_dev.in', 'requirements_dev.txt'))
        self.assertTrue(change)

    def test_main_passes_with_no_assert_and_no_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile(*_args: str) -> bool:
            return False

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'check_python_env_is_suitable',
            mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_pip_requirements', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                install_python_dev_dependencies.main([])

    def test_main_passes_with_uninstall(self) -> None:
        def mock_compile(*_args: str) -> bool:
            return False

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'check_python_env_is_suitable',
            lambda: None)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', lambda: None)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_pip_requirements', mock_compile)
        uninstall_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'uninstall_dev_dependencies', lambda: None)

        with assert_swap, install_tools_swap, compile_swap:
            with uninstall_dependencies_swap:
                install_python_dev_dependencies.main(['--uninstall'])

    def test_main_passes_with_assert_and_no_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile(*_args: str) -> bool:
            return False

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'check_python_env_is_suitable',
            mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_pip_requirements', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                install_python_dev_dependencies.main(
                    ['--assert_compiled'])

    def test_main_passes_with_no_assert_and_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile(*_args: str) -> bool:
            return True

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'check_python_env_is_suitable',
            mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_pip_requirements', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                install_python_dev_dependencies.main([])

    def test_main_fails_with_assert_and_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile(*_args: str) -> bool:
            return True

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'check_python_env_is_suitable',
            mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_pip_requirements', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        error_regex = (
            'The Python development requirements file '
            'requirements_dev.txt was changed')

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                with self.assertRaisesRegex(
                        RuntimeError, error_regex):
                    install_python_dev_dependencies.main(
                        ['--assert_compiled'])
