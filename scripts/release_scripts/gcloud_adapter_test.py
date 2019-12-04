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

"""Unit tests for scripts/gcloud_adapter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess

from core.tests import test_utils
from scripts.release_scripts import gcloud_adapter


class GcloudAdapterTests(test_utils.GenericTestBase):
    """Test the methods for gcloud adapter."""

    def setUp(self):
        super(GcloudAdapterTests, self).setUp()
        self.check_function_calls = {
            'check_output_is_called': False
        }
        self.expected_check_function_calls = {
            'check_output_is_called': True
        }
        def mock_check_output(unused_cmd_tokens):
            self.check_function_calls['check_output_is_called'] = True
        self.check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)

    def test_require_gcloud_to_be_available_with_missing_gcloud(self):
        def mock_check_output(unused_cmd_tokens):
            raise Exception('Missing Gcloud')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'gcloud required, but could not be found. Please run python -m '
            'scripts.start to install gcloud.'):
            gcloud_adapter.require_gcloud_to_be_available()

    def test_require_gcloud_to_be_available_with_available_gcloud(self):
        with self.check_output_swap:
            gcloud_adapter.require_gcloud_to_be_available()
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_update_indexes_with_missing_indexes_file(self):
        def mock_isfile(unused_path):
            return False

        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        with isfile_swap, self.assertRaises(AssertionError):
            gcloud_adapter.update_indexes('yaml path', 'app name')

    def test_update_indexes_with_available_indexes_file(self):
        def mock_isfile(unused_path):
            return True

        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        with isfile_swap, self.check_output_swap:
            gcloud_adapter.update_indexes('yaml path', 'app name')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_get_all_index_descriptions(self):
        def mock_check_output(unused_cmd_tokens):
            return (
                '[{'
                '"state": "READY",'
                '"indexId": "index1"'
                '}, {'
                '"state": "PENDING",'
                '"indexId": "index2"'
                '}]')
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap:
            self.assertEqual(
                gcloud_adapter.get_all_index_descriptions('app name'),
                [{
                    'state': 'READY',
                    'indexId': 'index1'
                }, {
                    'state': 'PENDING',
                    'indexId': 'index2'
                }])

    def test_check_all_indexes_are_serving_with_some_indexes_not_serving(self):
        def mock_get_all_index_descriptions(unused_app_name):
            return [{
                'state': 'READY',
                'indexId': 'index1'
            }, {
                'state': 'PENDING',
                'indexId': 'index2'
            }]

        get_all_index_descriptions_swap = self.swap(
            gcloud_adapter, 'get_all_index_descriptions',
            mock_get_all_index_descriptions)
        with get_all_index_descriptions_swap:
            self.assertFalse(
                gcloud_adapter.check_all_indexes_are_serving('app name'))

    def test_check_all_indexes_are_serving_with_all_indexes_serving(self):
        def mock_get_all_index_descriptions(unused_app_name):
            return [{
                'state': 'READY',
                'indexId': 'index1'
            }, {
                'state': 'READY',
                'indexId': 'index2'
            }]

        get_all_index_descriptions_swap = self.swap(
            gcloud_adapter, 'get_all_index_descriptions',
            mock_get_all_index_descriptions)
        with get_all_index_descriptions_swap:
            self.assertTrue(
                gcloud_adapter.check_all_indexes_are_serving('app name'))

    def test_get_currently_served_version(self):
        def mock_check_output(unused_cmd_tokens):
            return (
                'SERVICE VERSION TRAFFIC_SPLIT LAST_DEPLOYED SERVING_STATUS\n'
                'default  2-1-1 1.00 SERVING\n')
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap:
            self.assertEqual(
                gcloud_adapter.get_currently_served_version('app name'),
                '2-1-1')

    def test_switch_version(self):
        with self.check_output_swap:
            gcloud_adapter.switch_version('app name', '2.1.1')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_deploy_application(self):
        with self.check_output_swap:
            gcloud_adapter.deploy_application(
                'yaml path', 'app name', version='2.1.1')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)

    def test_flush_memcache(self):
        import dev_appserver
        from google.appengine.ext.remote_api import remote_api_stub
        from google.appengine.api import memcache

        check_function_calls = {
            'fix_sys_path_is_called': False,
            'configure_remote_api_for_oauth_is_called': False,
            'flush_all_is_called': False
        }
        expected_check_function_calls = {
            'fix_sys_path_is_called': True,
            'configure_remote_api_for_oauth_is_called': True,
            'flush_all_is_called': True
        }
        def mock_fix_sys_path():
            check_function_calls['fix_sys_path_is_called'] = True
        def mock_configure_remote_api_for_oauth(unused_url, unused_api):
            check_function_calls[
                'configure_remote_api_for_oauth_is_called'] = True
        def mock_flush_all():
            check_function_calls['flush_all_is_called'] = True
            return True

        fix_sys_path_swap = self.swap(
            dev_appserver, 'fix_sys_path', mock_fix_sys_path)
        configure_swap = self.swap(
            remote_api_stub, 'ConfigureRemoteApiForOAuth',
            mock_configure_remote_api_for_oauth)
        flush_all_swap = self.swap(
            memcache, 'flush_all', mock_flush_all)

        with fix_sys_path_swap, configure_swap, flush_all_swap:
            self.assertTrue(gcloud_adapter.flush_memcache('app name'))
        self.assertEqual(check_function_calls, expected_check_function_calls)
