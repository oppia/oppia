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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess
import sys

from core.tests import test_utils


class GcloudAdapterImportTests(test_utils.GenericTestBase):
    """Tests import of gcloud adapter."""

    def test_import_with_missing_gae_dir(self):
        def mock_exists(unused_path):
            return False
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        gae_dir = os.path.join(
            os.path.abspath(os.getcwd()), '..', 'oppia_tools',
            'google_appengine_1.9.67', 'google_appengine')
        with exists_swap, self.assertRaisesRegexp(
            Exception, 'Directory %s does not exist.' % gae_dir):
            from scripts.release_scripts import gcloud_adapter # pylint: disable=unused-variable


class InstallThirdPartyLibsImportTests(test_utils.GenericTestBase):
    """Tests import of install third party libs."""
    def setUp(self):
        super(InstallThirdPartyLibsImportTests, self).setUp()
        self.commands = []
        def mock_check_call(cmd_tokens):
            self.commands.extend(cmd_tokens)
        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)

    def test_import_with_missing_packages(self):
        def mock_exists(unused_path):
            return False
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with self.check_call_swap, exists_swap:
            from scripts import install_third_party_libs # pylint: disable=unused-variable
        self.assertEqual(
            self.commands, [
                sys.executable, '-m', 'pip', 'install', 'pyyaml==5.1.2',
                '--target', '../oppia_tools/pyyaml-5.1.2',
                sys.executable, '-m', 'pip', 'install',
                'future==0.17.1', '--target', 'third_party/future-0.17.1'])
