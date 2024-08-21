# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for scripts/generate_root_files_mapping.py."""

from __future__ import annotations

import builtins
import subprocess

from core.tests import test_utils
from scripts import common
from scripts import generate_root_files_mapping
from scripts import run_typescript_checks


class GenerateRootFilesMappingTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()
        self.print_messages: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_messages.append(msg)
        self.print_swap = self.swap(
            builtins, 'print', mock_print)
        def mock_compile_and_check_typescript(_tsconfig_filepath: str) -> None:
            return
        self.compile_and_check_typescript_swap = self.swap_with_checks(
            run_typescript_checks, 'compile_and_check_typescript',
            mock_compile_and_check_typescript,
            expected_args=[
                (generate_root_files_mapping.TEST_DEPENDENCIES_TSCONFIG_FILEPATH,) # pylint: disable=line-too-long
            ]
        )

    def tearDown(self) -> None:
        super().tearDown()
        self.print_messages = []

    def test_generate_root_files_mapping_success(self) -> None:
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_subprocess_popen(
            cmd: list[str],
            stdout: int, stderr: int # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:
            self.assertEqual(cmd, [
                common.NODE_BIN_PATH,
                generate_root_files_mapping.ROOT_FILES_MAPPING_GENERATOR_FILEPATH # pylint: disable=line-too-long
            ])
            return process
        subprocess_popen_swap = self.swap(
            subprocess, 'Popen', mock_subprocess_popen)

        with self.print_swap, self.compile_and_check_typescript_swap:
            with subprocess_popen_swap:
                generate_root_files_mapping.main()
                self.assertEqual(
                    self.print_messages, [
                        'Generating root files mapping...',
                        'test\n',
                        'Root files mapping generated successfully!'])

    def test_generate_root_files_mapping_failure(self) -> None:
        def mock_communicate() -> tuple[bytes, bytes]:
            return (b'', b'Error')
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_subprocess_popen(
            cmd: list[str],
            stdout: int, stderr: int # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:
            self.assertEqual(cmd, [
                common.NODE_BIN_PATH,
                generate_root_files_mapping.ROOT_FILES_MAPPING_GENERATOR_FILEPATH # pylint: disable=line-too-long
            ])
            return process
        communicate_swap = self.swap(process, 'communicate', mock_communicate)
        subprocess_popen_swap = self.swap(
            subprocess, 'Popen', mock_subprocess_popen)

        with self.compile_and_check_typescript_swap, communicate_swap:
            with subprocess_popen_swap:
                with self.assertRaisesRegex(Exception, 'Error'):
                    generate_root_files_mapping.main()
