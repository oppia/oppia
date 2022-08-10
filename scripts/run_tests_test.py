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

"""Unit tests for scripts/run_tests.py."""

from __future__ import annotations

import builtins
import subprocess

from core.tests import test_utils

from scripts import install_third_party_libs
from scripts import run_frontend_tests
from scripts import setup
from scripts import setup_gae


class RunTestsTests(test_utils.GenericTestBase):
    """Unit tests for scripts/run_tests.py."""

    def test_all_tests_are_run_correctly(self) -> None:
        print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)

        scripts_called = {
            'setup': False,
            'setup_gae': False,
            'run_frontend_tests': False,
            'run_backend_tests': False,
            'run_e2e_tests': False
        }

        def mock_setup(args: list[str]) -> None:  # pylint: disable=unused-argument
            scripts_called['setup'] = True
        def mock_setup_gae(args: list[str]) -> None:  # pylint: disable=unused-argument
            scripts_called['setup_gae'] = True
        def mock_frontend_tests(args: list[str]) -> None:  # pylint: disable=unused-argument
            scripts_called['run_frontend_tests'] = True
        def mock_backend_tests(args: list[str]) -> None:  # pylint: disable=unused-argument
            scripts_called['run_backend_tests'] = True
        def mock_popen(cmd: str, shell: bool) -> None:
            if cmd == 'bash scripts/run_e2e_tests.sh' and shell:
                scripts_called['run_e2e_tests'] = True
        def mock_install_third_party_libs() -> None:
            pass

        swap_install_third_party_libs = self.swap(
            install_third_party_libs, 'main', mock_install_third_party_libs)
        swap_setup = self.swap(setup, 'main', mock_setup)
        swap_setup_gae = self.swap(setup_gae, 'main', mock_setup_gae)
        swap_frontend_tests = self.swap(
            run_frontend_tests, 'main', mock_frontend_tests)
        swap_popen = self.swap(subprocess, 'Popen', mock_popen)

        # We import run_backend_tests script under install_third_party_libs
        # mock since run_backend_tests script installs third party libs
        # whenever it is imported.
        # The run_tests script imports the run_backend_tests script.
        # Therefore, it has to be imported under a mock as well.
        with swap_install_third_party_libs:
            from scripts import run_backend_tests
            from scripts import run_tests
            swap_backend_tests = self.swap(
                run_backend_tests, 'main', mock_backend_tests)
            with print_swap, swap_setup, swap_setup_gae, swap_popen:
                with swap_frontend_tests, swap_backend_tests:
                    run_tests.main(args=[])

        for script in scripts_called:
            self.assertTrue(script)
        self.assertIn(
            'SUCCESS    All frontend, backend and end-to-end tests passed!',
            print_arr)
