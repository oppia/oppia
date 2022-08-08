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

"""Unit tests for scripts/run_lighthouse_tests.py."""

from __future__ import annotations

import argparse
import builtins
import contextlib
import os
import subprocess
import sys

from core.constants import constants
from core.tests import test_utils
from scripts import build
from scripts import common
from scripts import run_lighthouse_tests
from scripts import servers
from typing import Any

class RunLighthouseTestsTests(test_utils.GenericTestBase):
    """Unit tests for scripts/run_lighthouse_tests.py."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        node_path = os.path.join(common.NODE_PATH, 'bin', 'node')
        nyc_path = os.path.join('node_modules', 'nyc', 'bin', 'nyc.js')
        mocha_path = os.path.join('node_modules', 'mocha', 'bin', 'mocha')
        filepath = 'scripts/linters/custom_eslint_checks/rules/'
        self.proc_args = [node_path, nyc_path, mocha_path, filepath]

        self.cmd_token_list: list[list[str]] = []

        self.sys_exit_code: int = 0
        def mock_sys_exit(err_code: int) -> None:
            self.sys_exit_code = err_code
        self.swap_sys_exit = self.swap(sys, 'exit', mock_sys_exit)

    def test_run_lighthouse_puppeteer_script(self) -> None:
        class MockTask:
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (
                    b'All files | 100 | 100 | 100 | 100 | ',
                    b'Path not found.')

        def mock_popen(
            cmd_tokens: list[str], **unsued_kwargs: Any) -> MockTask:  # pylint: disable=unused-argument
            self.cmd_token_list.append(cmd_tokens)
            return MockTask()
        swap_popen = self.swap(subprocess, 'Popen', mock_popen)
