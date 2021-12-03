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

"""Unit tests for scripts/setup_gae.py."""

from __future__ import annotations

import builtins
import os
import tarfile
import urllib.request as urlrequest

from core.tests import test_utils

from . import common
from . import setup_gae

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')
MOCK_TMP_UNZIP_PATH = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.zip')
MOCK_TMP_UNTAR_PATH = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.tar.gz')


class SetupGaeTests(test_utils.GenericTestBase):
    """Test the methods for setup gae script."""

    def setUp(self):
        super(SetupGaeTests, self).setUp()
        self.check_function_calls = {
            'walk_is_called': False,
            'remove_is_called': False,
            'makedirs_is_called': False,
            'url_retrieve_is_called': False
        }
        self.expected_check_function_calls = {
            'walk_is_called': True,
            'remove_is_called': True,
            'makedirs_is_called': True,
            'url_retrieve_is_called': True
        }
        self.raise_error = False
        def mock_walk(unused_path):
            self.check_function_calls['walk_is_called'] = True
            return []
        def mock_remove(unused_path):
            self.check_function_calls['remove_is_called'] = True
        def mock_makedirs(unused_path):
            self.check_function_calls['makedirs_is_called'] = True
        self.print_arr = []
        def mock_print(msg):
            self.print_arr.append(msg)
        def mock_url_retrieve(unused_url, filename):  # pylint: disable=unused-argument
            self.check_function_calls['url_retrieve_is_called'] = True
            if self.raise_error:
                raise Exception
        self.walk_swap = self.swap(os, 'walk', mock_walk)
        self.remove_swap = self.swap(os, 'remove', mock_remove)
        self.makedirs_swap = self.swap(os, 'makedirs', mock_makedirs)
        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.url_retrieve_swap = self.swap(
            urlrequest, 'urlretrieve', mock_url_retrieve)

    def test_main_with_no_installs_required(self):
        check_file_removals = {
            'root/file1.js': False,
            'root/file2.pyc': False
        }
        expected_check_file_removals = {
            'root/file1.js': False,
            'root/file2.pyc': True
        }
        def mock_walk(unused_path):
            return [('root', ['dir1'], ['file1.js', 'file2.pyc'])]
        def mock_remove(path):
            check_file_removals[path] = True
        def mock_exists(unused_path):
            return True

        walk_swap = self.swap(os, 'walk', mock_walk)
        remove_swap = self.swap(os, 'remove', mock_remove)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with walk_swap, remove_swap, exists_swap:
            setup_gae.main(args=[])
        self.assertEqual(check_file_removals, expected_check_file_removals)

    def test_gcloud_install_without_errors(self):
        self.check_function_calls['open_is_called'] = False
        self.check_function_calls['extractall_is_called'] = False
        self.check_function_calls['close_is_called'] = False
        self.expected_check_function_calls['open_is_called'] = True
        self.expected_check_function_calls['extractall_is_called'] = True
        self.expected_check_function_calls['close_is_called'] = True
        def mock_exists(path):
            if path == common.GOOGLE_CLOUD_SDK_HOME:
                return False
            return True
        temp_file = tarfile.open(name=MOCK_TMP_UNTAR_PATH)
        def mock_open(name):  # pylint: disable=unused-argument
            self.check_function_calls['open_is_called'] = True
            return temp_file
        def mock_extractall(unused_self, path):  # pylint: disable=unused-argument
            self.check_function_calls['extractall_is_called'] = True
        def mock_close(unused_self):
            self.check_function_calls['close_is_called'] = True
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        open_swap = self.swap(tarfile, 'open', mock_open)
        extractall_swap = self.swap(
            tarfile.TarFile, 'extractall', mock_extractall)
        close_swap = self.swap(tarfile.TarFile, 'close', mock_close)

        with self.walk_swap, self.remove_swap, self.makedirs_swap:
            with self.print_swap, self.url_retrieve_swap, exists_swap:
                with open_swap, extractall_swap, close_swap:
                    setup_gae.main(args=[])
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertTrue(
            'Download complete. Installing Google Cloud SDK...'
            in self.print_arr)

    def test_gcloud_install_with_errors(self):
        self.expected_check_function_calls['remove_is_called'] = False
        self.raise_error = True
        def mock_exists(path):
            if path == common.GOOGLE_CLOUD_SDK_HOME:
                return False
            return True
        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with self.walk_swap, self.remove_swap, self.makedirs_swap:
            with self.print_swap, self.url_retrieve_swap, exists_swap:
                with self.assertRaisesRegexp(
                    Exception, 'Error downloading Google Cloud SDK.'):
                    setup_gae.main(args=[])
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertTrue(
            'Error downloading Google Cloud SDK. Exiting.'
            in self.print_arr)
