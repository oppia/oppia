# coding: utf-8
#
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

"""Tests for install_python_dev_dependencies.py."""

from __future__ import annotations

import builtins
import io
import os
import subprocess
import sys

from core.tests import test_utils
from scripts import install_python_dev_dependencies

from typing import Any, Dict, List, Tuple


class InstallPythonDevDependenciesTests(test_utils.GenericTestBase):

    def test_assert_in_venv_passes_when_in_venv(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/oppia')
        real_prefix_swap = self.swap(sys, 'real_prefix', '')
        environ_swap = self.swap(os, 'environ', {})
        with prefix_swap, base_prefix_swap, real_prefix_swap, environ_swap:
            install_python_dev_dependencies.assert_in_venv()

    def test_assert_in_venv_passes_when_in_venv_real_prefix(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/3.7.10')
        real_prefix_swap = self.swap(
            sys, 'real_prefix', '/home/user/.pyenv/versions/oppia')
        environ_swap = self.swap(os, 'environ', {})
        with prefix_swap, base_prefix_swap, real_prefix_swap, environ_swap:
            install_python_dev_dependencies.assert_in_venv()

    def test_assert_in_venv_fails_when_out_of_venv(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/3.7.10')
        real_prefix_swap = self.swap(sys, 'real_prefix', '')
        environ_swap = self.swap(os, 'environ', {})
        expected_error = (
            'Oppia must be developed within a virtual environment.')
        with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                AssertionError, expected_error):
            with prefix_swap, base_prefix_swap, real_prefix_swap:
                with environ_swap:
                    install_python_dev_dependencies.assert_in_venv()

    def test_assert_in_venv_passes_when_on_ci(self) -> None:
        prefix_swap = self.swap(
            sys, 'prefix', '/home/user/.pyenv/versions/3.7.10')
        base_prefix_swap = self.swap(
            sys, 'base_prefix', '/home/user/.pyenv/versions/3.7.10')
        real_prefix_swap = self.swap(sys, 'real_prefix', '')
        environ_swap = self.swap(os, 'environ', {'GITHUB_ACTION': '1'})
        with prefix_swap, base_prefix_swap, real_prefix_swap, environ_swap:
            install_python_dev_dependencies.assert_in_venv()

    def test_install_installation_tools(self) -> None:
        expected_tools = {
            'pip': '22.1.1',
            'pip-tools': '6.6.2',
            'setuptools': '58.5.3',
        }
        installed_tools = {}

        def mock_run(
                args: List[str], check: bool, encoding: str) -> None:
            package, version = args[-1].split('==')
            assert package not in installed_tools
            installed_tools[package] = version
            assert args == [
                sys.executable, '-m', 'pip', 'install',
                f'{package}=={version}']
            assert check
            assert encoding == 'utf-8'

        run_swap = self.swap(subprocess, 'run', mock_run)

        with run_swap:
            install_python_dev_dependencies.install_installation_tools()

        assert installed_tools == expected_tools

    def test_install_dev_dependencies(self) -> None:

        def mock_run(
                *_args: Tuple[Any],
                **_kwargs: Dict[Any, Any]) -> None:  # pylint: disable=unused-argument
            pass

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                (['pip-sync', 'requirements_dev.txt'],),
            ],
            expected_kwargs=[
                {'check': True, 'encoding': 'utf-8'},
            ]
        )

        with run_swap:
            install_python_dev_dependencies.install_dev_dependencies()

    def test_compile_dev_dependencies_no_change(self) -> None:

        def mock_run(
                *_args: Tuple[Any],
                **_kwargs: Dict[Any, Any]) -> None:  # pylint: disable=unused-argument
            pass

        def mock_open(
                *_args: Tuple[Any],
                **_kwargs: Dict[Any, Any]) -> io.StringIO:
            return io.StringIO('mock file contents')

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                ([
                    'pip-compile', 'requirements_dev.in',
                    '--output-file', 'requirements_dev.txt'
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
                install_python_dev_dependencies.compile_dev_dependencies())
        self.assertFalse(change)

    def test_compile_dev_dependencies_change(self) -> None:

        def mock_run(
                *_args: Tuple[Any],
                **_kwargs: Dict[Any, Any]) -> None:  # pylint: disable=unused-argument
            pass

        counter = []

        def mock_open(
                *_args: Tuple[Any],
                **_kwargs: Dict[Any, Any]) -> io.StringIO:
            counter.append(1)
            return io.StringIO(f'mock file contents {len(counter)}')

        run_swap = self.swap_with_checks(
            subprocess, 'run', mock_run, expected_args=[
                ([
                    'pip-compile', 'requirements_dev.in',
                    '--output-file', 'requirements_dev.txt'
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
                install_python_dev_dependencies.compile_dev_dependencies())
        self.assertTrue(change)

    def test_main_passes_with_no_assert_and_no_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile() -> bool:
            return False

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'assert_in_venv', mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_dev_dependencies', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                install_python_dev_dependencies.main([])

    def test_main_passes_with_assert_and_no_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile() -> bool:
            return False

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'assert_in_venv', mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_dev_dependencies', mock_compile)
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

        def mock_compile() -> bool:
            return True

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'assert_in_venv', mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_dev_dependencies', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                install_python_dev_dependencies.main([])

    def test_main_fails_with_assert_and_change(self) -> None:
        def mock_func() -> None:
            pass

        def mock_compile() -> bool:
            return True

        assert_swap = self.swap_with_checks(
            install_python_dev_dependencies, 'assert_in_venv', mock_func)
        install_tools_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_installation_tools', mock_func)
        compile_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'compile_dev_dependencies', mock_compile)
        install_dependencies_swap = self.swap_with_checks(
            install_python_dev_dependencies,
            'install_dev_dependencies', mock_func)

        error_regex = (
            'The Python development requirements file '
            'requirements_dev.txt was changed')

        with assert_swap, install_tools_swap, compile_swap:
            with install_dependencies_swap:
                with self.assertRaisesRegex(  # type: ignore[no-untyped-call]
                        RuntimeError, error_regex):
                    install_python_dev_dependencies.main(
                        ['--assert_compiled'])
