# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/install_chrome_for_ci.py."""

from __future__ import annotations

import builtins
import subprocess

from core.tests import test_utils
from scripts import common
from scripts import install_chrome_for_ci

from typing import Iterable, List, NoReturn

URL = (
    'https://github.com/webnicer/chrome-downloads/raw/master/x64.deb/'
    'google-chrome-stable_102.0.5005.61-1_amd64.deb'
)
DOWNLOAD_VERSION = '102.0.5005.61-1'
INSTALLED_VERSION = '102.0.5005.61'
CHROME_DEB_FILE = 'google-chrome.deb'


class InstallChromeTests(test_utils.GenericTestBase):

    def test_success(self) -> None:
        def mock_run_cmd(unused_tokens: List[str]) -> str:
            return ''

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['sudo', 'apt-get', 'update'],),
                (['sudo', 'apt-get', 'install', 'libappindicator3-1'],),
                (['curl', '-L', '-o', CHROME_DEB_FILE, URL],),
                ([
                    'sudo', 'sed', '-i',
                    's|HERE/chrome\\"|HERE/chrome\\" '
                    '--disable-setuid-sandbox|g',
                    '/opt/google/chrome/google-chrome'],),
                (['sudo', 'dpkg', '-i', CHROME_DEB_FILE],),
            ])

        with run_cmd_swap:
            install_chrome_for_ci.install_chrome(DOWNLOAD_VERSION)

    def test_fail(self) -> None:
        def mock_run_cmd(tokens: Iterable[str]) -> NoReturn:
            command = ' '.join(tokens)
            raise subprocess.CalledProcessError(1, command, '')

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['sudo', 'apt-get', 'update'],),
            ])

        with run_cmd_swap:
            with self.assertRaisesRegex(
                subprocess.CalledProcessError,
                'Command \'sudo apt-get update\' returned non-zero exit '
                'status 1'
            ):
                install_chrome_for_ci.install_chrome(DOWNLOAD_VERSION)


class GetChromeVersionTests(test_utils.GenericTestBase):

    def test_real_example(self) -> None:
        def mock_run_cmd(unused_tokens: List[str]) -> str:
            return 'Google Chrome 88.0.4324.96 '

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['google-chrome', '--version'],),
            ])

        with run_cmd_swap:
            version = install_chrome_for_ci.get_chrome_version()
            self.assertEqual(version, '88.0.4324.96')

    def test_fails(self) -> None:
        def mock_run_cmd(tokens: Iterable[str]) -> NoReturn:
            command = ' '.join(tokens)
            raise subprocess.CalledProcessError(1, command, '')

        run_cmd_swap = self.swap_with_checks(
            common, 'run_cmd', mock_run_cmd,
            expected_args=[
                (['google-chrome', '--version'],),
            ])

        with run_cmd_swap:
            with self.assertRaisesRegex(
                subprocess.CalledProcessError,
                'Command \'google-chrome --version\' returned non-zero exit '
                'status 1'
            ):
                install_chrome_for_ci.get_chrome_version()


class MainTests(test_utils.GenericTestBase):

    def test_success(self) -> None:
        def mock_install_chrome(unused_version: str) -> None:
            return

        def mock_get_chrome_version() -> str:
            return INSTALLED_VERSION

        def mock_print(unused_string: str) -> None:
            return

        install_chrome_swap = self.swap_with_checks(
            install_chrome_for_ci, 'install_chrome',
            mock_install_chrome,
            expected_args=[
                (DOWNLOAD_VERSION,),
            ])
        get_version_swap = self.swap_with_checks(
            install_chrome_for_ci, 'get_chrome_version',
            mock_get_chrome_version,
            expected_args=[tuple()])
        print_swap = self.swap_with_checks(
            builtins, 'print', mock_print,
            expected_args=[
                (
                    'Chrome version {} installed.'.format(
                        INSTALLED_VERSION
                    ),
                )
            ])

        with install_chrome_swap, get_version_swap, print_swap:
            install_chrome_for_ci.main()

    def test_version_mismatch(self) -> None:
        def mock_install_chrome(unused_version: str) -> None:
            return

        def mock_get_chrome_version() -> str:
            return '123.0.12.45'

        install_chrome_swap = self.swap_with_checks(
            install_chrome_for_ci, 'install_chrome',
            mock_install_chrome,
            expected_args=[
                (DOWNLOAD_VERSION,),
            ])
        get_version_swap = self.swap_with_checks(
            install_chrome_for_ci, 'get_chrome_version',
            mock_get_chrome_version,
            expected_args=[tuple()])

        with install_chrome_swap, get_version_swap:
            with self.assertRaisesRegex(
                RuntimeError, (
                    'Chrome version {} should have been installed. '
                    'Version 123.0.12.45 was found instead.'
                ).format(DOWNLOAD_VERSION)
            ):
                install_chrome_for_ci.main()
