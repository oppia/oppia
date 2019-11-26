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

"""Unit tests for scripts/update_indexes.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import sys

from core.tests import test_utils
from scripts import common
from scripts.release_scripts import gcloud_adapter
from scripts.release_scripts import update_indexes


class UpdateIndexesTests(test_utils.GenericTestBase):
    """Test the methods for updating indexes."""

    def setUp(self):
        super(UpdateIndexesTests, self).setUp()

        self.check_function_calls = {
            'require_gcloud_to_be_available_is_called': False,
            'update_indexes_is_called': False
        }
        self.expected_check_function_calls = {
            'require_gcloud_to_be_available_is_called': True,
            'update_indexes_is_called': True
        }
        def mock_require_gcloud_to_be_available():
            self.check_function_calls[
                'require_gcloud_to_be_available_is_called'] = True
        self.gcloud_available_swap = self.swap(
            gcloud_adapter, 'require_gcloud_to_be_available',
            mock_require_gcloud_to_be_available)
        self.args_swap = self.swap(
            sys, 'argv', ['update_indexes.py', '--app_name=test-app'])

    def test_missing_app_name(self):
        args_swap = self.swap(sys, 'argv', ['update_indexes.py'])
        with args_swap, self.assertRaisesRegexp(
            Exception, 'No app name specified.'):
            update_indexes.update_indexes()

    def test_invalid_branch_name(self):
        def mock_is_current_branch_a_release_branch():
            return False
        branch_check_swap = self.swap(
            common, 'is_current_branch_a_release_branch',
            mock_is_current_branch_a_release_branch)
        with self.args_swap, self.gcloud_available_swap, branch_check_swap:
            with self.assertRaisesRegexp(
                Exception,
                'Indexes should only be updated from a release branch.'):
                update_indexes.update_indexes()
        self.expected_check_function_calls['update_indexes_is_called'] = False
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_function_calls(self):
        def mock_is_current_branch_a_release_branch():
            return True
        def mock_update_indexes(unused_index_yaml_path, unused_app_name):
            self.check_function_calls['update_indexes_is_called'] = True
        branch_check_swap = self.swap(
            common, 'is_current_branch_a_release_branch',
            mock_is_current_branch_a_release_branch)
        update_indexes_swap = self.swap(
            gcloud_adapter, 'update_indexes', mock_update_indexes)
        with self.args_swap, self.gcloud_available_swap, branch_check_swap:
            with update_indexes_swap:
                update_indexes.update_indexes()
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
