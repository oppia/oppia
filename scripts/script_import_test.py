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

import os
import subprocess
import sys

from core.tests import test_utils


class InstallThirdPartyLibsImportTests(test_utils.GenericTestBase):
    """Tests import of install third party libs."""

    def setUp(self):
        super(InstallThirdPartyLibsImportTests, self).setUp()
        self.commands = []
        def mock_popen_error_call(unused_cmd_tokens, *args, **kwargs): # pylint: disable=unused-argument
            class Ret(test_utils.GenericTestBase):
                """Return object that gives user-prefix error."""

                def __init__(self):  # pylint: disable=super-init-not-called
                    self.returncode = 1
                def communicate(self):
                    """Return user-prefix error as stderr."""
                    return b'', b'can\'t combine user with prefix'
            return Ret()
        def mock_check_call(cmd_tokens):
            self.commands.extend(cmd_tokens)
        self.Popen_swap = self.swap(
            subprocess, 'Popen', mock_popen_error_call)
        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)

    def test_import_with_missing_packages(self):
        def mock_exists(unused_path):
            return False
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with self.Popen_swap, self.check_call_swap, exists_swap:
            from scripts import install_third_party_libs  # isort:skip pylint: disable=unused-import,line-too-long
        self.assertEqual(
            self.commands, [
                sys.executable, '-m', 'pip', 'install', 'pyyaml==6.0',
                '--target', '../oppia_tools/pyyaml-6.0',
                '--user', '--prefix=', '--system',
                sys.executable, '-m', 'pip', 'install',
                'future==0.18.2', '--target',
                'third_party/python_libs',
                '--user', '--prefix=', '--system',
                sys.executable, '-m', 'pip', 'install',
                'six==1.16.0', '--target',
                'third_party/python_libs',
                '--user', '--prefix=', '--system',
                sys.executable, '-m', 'pip', 'install',
                'certifi==2021.10.8', '--target',
                '../oppia_tools/certifi-2021.10.8',
                '--user', '--prefix=', '--system',
                sys.executable, '-m', 'pip', 'install',
                'typing-extensions==4.0.1', '--target',
                'third_party/python_libs',
                '--user', '--prefix=', '--system',
            ])
