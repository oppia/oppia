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

"""Unit tests for testing import of gcloud_adapter and
install_third_party_libs. This is written separate from the main tests
for gcloud_adapter and install_third_party_libs since those tests require
importing the respective files in the start and if the files are imported
in start, then adding the same import statement in a test function
(as done in this file) creates a conflict.
"""

from __future__ import annotations

import subprocess
import sys

from core.tests import test_utils

from typing import List


class InstallThirdPartyLibsImportTests(test_utils.GenericTestBase):
    """Tests import of install third party libs."""

    def test_import_with_missing_packages(self) -> None:
        commands: List[List[str]] = []
        def mock_run(
            cmd_tokens: List[str], *_args: str, **_kwargs: str
        ) -> None:
            commands.append(cmd_tokens)
        run_swap = self.swap(subprocess, 'run', mock_run)

        with run_swap:
            from scripts import install_third_party_libs  # isort:skip pylint: disable=unused-import,line-too-long
        expected_commands = [
            [sys.executable, '-m', 'pip', 'install', version_string]
            for version_string in (
                'pip==22.1.1', 'pip-tools==6.6.2', 'setuptools==58.5.3')
        ]
        expected_commands += [
            [
                'pip-compile', '--no-emit-index-url', 'requirements_dev.in',
                '--output-file', 'requirements_dev.txt',
            ],
            ['pip-sync', 'requirements_dev.txt'],
        ]
        self.assertEqual(commands, expected_commands)
