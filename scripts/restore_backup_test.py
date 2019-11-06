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

"""Unit tests for scripts/restore_backup.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.tests import test_utils

import python_utils

from . import common
from . import restore_backup


class RestoreBackupTests(test_utils.GenericTestBase):
    """Test the methods for restoring backup."""

    def setUp(self):
        super(RestoreBackupTests, self).setUp()
        self.all_cmd_tokens = []
        def mock_run_cmd(cmd_tokens):
            self.all_cmd_tokens.extend(cmd_tokens)
        def mock_exists(unused_path):
            return True
        def mock_is_current_branch_a_release_branch():
            return True

        self.run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.branch_check_swap = self.swap(
            common, 'is_current_branch_a_release_branch',
            mock_is_current_branch_a_release_branch)

    def test_missing_gae_dir(self):
        def mock_exists(unused_path):
            return False
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with exists_swap, self.assertRaisesRegexp(
            Exception, 'Directory %s does not exist.' % restore_backup.GAE_DIR):
            restore_backup.main(args=[])

    def test_invalid_branch(self):
        def mock_is_current_branch_a_release_branch():
            return False
        branch_check_swap = self.swap(
            common, 'is_current_branch_a_release_branch',
            mock_is_current_branch_a_release_branch)
        with self.exists_swap, branch_check_swap, self.assertRaisesRegexp(
            Exception,
            'This script should only be run from the latest '
            'release branch.'):
            restore_backup.main(args=[])

    def test_missing_project_name(self):
        with self.exists_swap, self.branch_check_swap, self.assertRaisesRegexp(
            Exception, 'Please provide project name for backup restoration.'):
            restore_backup.main(args=[])

    def test_backup_restoration(self):
        check_function_calls = {
            'open_tab_is_called': False,
            'input_is_called': False
        }
        expected_check_function_calls = {
            'open_tab_is_called': True,
            'input_is_called': True
        }
        def mock_open_tab(unused_url):
            check_function_calls['open_tab_is_called'] = True
        def mock_input():
            check_function_calls['input_is_called'] = True
            return 'export_metadata_filepath'

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        with self.exists_swap, self.branch_check_swap, self.run_cmd_swap:
            with open_tab_swap, input_swap:
                restore_backup.main(args=['--project_name=sample_project_name'])

        self.assertEqual(
            self.all_cmd_tokens,
            [
                restore_backup.GCLOUD_PATH, 'config', 'set', 'project',
                'sample_project_name',
                restore_backup.GCLOUD_PATH, 'datastore', 'import',
                'gs://export_metadata_filepath', '--async'])
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_check_status(self):
        with self.exists_swap, self.branch_check_swap, self.run_cmd_swap:
            restore_backup.main(args=['--check_status'])

        self.assertEqual(
            self.all_cmd_tokens,
            [restore_backup.GCLOUD_PATH, 'datastore', 'operations', 'list'])
