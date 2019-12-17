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

"""Unit tests for scripts/install_third_party.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import tarfile
import tempfile
import zipfile

from core.tests import test_utils

import python_utils

from . import common
from . import install_third_party

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')
MOCK_TMP_UNZIP_PATH = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.zip')


class InstallThirdPartyTests(test_utils.GenericTestBase):
    """Test the methods for installing third party."""

    def setUp(self):
        super(InstallThirdPartyTests, self).setUp()
        self.check_function_calls = {
            'remove_is_called': False,
            'rename_is_called': False,
            'extractall_is_called': False
        }
        self.expected_check_function_calls = {
            'remove_is_called': True,
            'rename_is_called': True,
            'extractall_is_called': True
        }
        def mock_ensure_directory_exists(unused_path):
            pass
        def mock_exists(unused_path):
            return True
        def mock_remove(unused_path):
            self.check_function_calls['remove_is_called'] = True
        def mock_rename(unused_path1, unused_path2):
            self.check_function_calls['rename_is_called'] = True
        # pylint: disable=unused-argument
        def mock_url_retrieve(unused_url, filename):
            pass
        def mock_extractall(unused_self, path):
            self.check_function_calls['extractall_is_called'] = True
        # pylint: enable=unused-argument

        self.unzip_swap = self.swap(
            install_third_party, 'TMP_UNZIP_PATH', MOCK_TMP_UNZIP_PATH)
        self. dir_exists_swap = self.swap(
            common, 'ensure_directory_exists', mock_ensure_directory_exists)
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.remove_swap = self.swap(os, 'remove', mock_remove)
        self.rename_swap = self.swap(os, 'rename', mock_rename)
        self.url_retrieve_swap = self.swap(
            python_utils, 'url_retrieve', mock_url_retrieve)
        self.extract_swap = self.swap(
            zipfile.ZipFile, 'extractall', mock_extractall)

    def test_download_files_with_invalid_source_filenames(self):
        with self.assertRaises(AssertionError):
            install_third_party.download_files(
                'source_url', 'target_dir', 'invalid source filename')

    def test_download_files_with_valid_source_filenames(self):
        check_file_downloads = {
            'target_dir/file1': False,
            'target_dir/file2': False
        }
        expected_check_file_downloads = {
            'target_dir/file1': False,
            'target_dir/file2': True
        }

        def mock_exists(path):
            if path == 'target_dir/file1':
                return True
            return False
        def mock_url_retrieve(unused_url, filename):
            check_file_downloads[filename] = True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_retrieve_swap = self.swap(
            python_utils, 'url_retrieve', mock_url_retrieve)
        with self.dir_exists_swap, exists_swap, url_retrieve_swap:
            install_third_party.download_files(
                'source_url', 'target_dir', ['file1', 'file2'])
        self.assertEqual(check_file_downloads, expected_check_file_downloads)

    def test_download_and_unzip_files_without_exception(self):
        exists_arr = []
        self.check_function_calls['url_open_is_called'] = False
        self.expected_check_function_calls['url_open_is_called'] = False
        def mock_exists(unused_path):
            exists_arr.append(False)
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, self.unzip_swap:
                with self.extract_swap:
                    install_third_party.download_and_unzip_files(
                        'source url', 'target dir', 'zip root', 'target root')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertEqual(exists_arr, [False])

    def test_download_and_unzip_files_with_exception(self):
        exists_arr = []
        self.check_function_calls['url_open_is_called'] = False
        self.expected_check_function_calls['url_open_is_called'] = True
        def mock_exists(path):
            if path == install_third_party.TMP_UNZIP_PATH:
                exists_arr.append(True)
                return True
            exists_arr.append(False)
            return False
        def mock_url_open(unused_url):
            self.check_function_calls['url_open_is_called'] = True
            # The function is used as follows: python_utils.url_open(req).read()
            # So, the mock returns a file object as a mock so that the read
            # function can work correctly.
            temp_file = tempfile.NamedTemporaryFile()
            file_obj = python_utils.open_file(temp_file.name, 'r')
            return file_obj
        # pylint: disable=unused-argument
        def mock_string_io(buffer_value):
            return MOCK_TMP_UNZIP_PATH
        # pylint: enable=unused-argument

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_open_swap = self.swap(python_utils, 'url_open', mock_url_open)
        string_io_swap = self.swap(python_utils, 'string_io', mock_string_io)
        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, self.extract_swap:
                with url_open_swap, string_io_swap:
                    install_third_party.download_and_unzip_files(
                        'source url', 'target dir', 'zip root', 'target root')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertEqual(exists_arr, [False, True])

    def test_download_and_untar_files(self):
        exists_arr = []
        def mock_exists(unused_path):
            exists_arr.append(False)
            return False
        def mock_extractall(unused_self, unused_path):
            self.check_function_calls['extractall_is_called'] = True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        extract_swap = self.swap(
            tarfile.TarFile, 'extractall', mock_extractall)
        unzip_swap = self.swap(
            install_third_party, 'TMP_UNZIP_PATH', os.path.join(
                RELEASE_TEST_DIR, 'tmp_unzip.tar.gz'))

        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, unzip_swap, extract_swap:
                install_third_party.download_and_untar_files(
                    'source url', 'target dir', 'zip root', 'target root')
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertEqual(exists_arr, [False])

    def test_get_file_contents(self):
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = 'Testing install third party file.'
        with python_utils.open_file(temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_third_party.get_file_contents(temp_file), actual_text)

    def test_return_json(self):
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = '{"Testing": "install_third_party"}'
        with python_utils.open_file(temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_third_party.return_json(temp_file),
            {'Testing': 'install_third_party'})

    def test_manifest_syntax_testing_with_valid_syntax(self):
        install_third_party.test_manifest_syntax(
            'files', {
                'url': 'https://github.com/yui/yuicompressor/v2.4.8#md5=123456',
                'files': ['yuicompressor-2.4.8.jar'],
                'version': '2.4.8',
                'targetDirPrefix': 'yuicompressor-',
                'downloadFormat': 'files'})

    def test_manifest_syntax_with_missing_mandatory_key(self):
        print_arr = []
        def mock_print(msg):
            print_arr.append(msg)
        print_swap = self.swap(python_utils, 'PRINT', mock_print)
        with print_swap, self.assertRaises(SystemExit):
            install_third_party.test_manifest_syntax(
                'files', {
                    'files': ['yuicompressor-2.4.8.jar'],
                    'version': '2.4.8',
                    'targetDirPrefix': 'yuicompressor-',
                    'downloadFormat': 'files'})
        self.assertTrue(
            'This key is missing or misspelled: "url".' in print_arr)

    def test_manifest_syntax_with_extra_optional_key(self):
        print_arr = []
        def mock_print(msg):
            print_arr.append(msg)
        print_swap = self.swap(python_utils, 'PRINT', mock_print)
        with print_swap, self.assertRaises(SystemExit):
            install_third_party.test_manifest_syntax(
                'zip', {
                    'url': 'https://github.com/jsocol/bleach/v3.1.0.zip',
                    'version': '3.1.0',
                    'targetDirPrefix': 'bleach-',
                    'downloadFormat': 'files',
                    'rootDir': 'rootDir',
                    'rootDirPrefix': 'rootDirPrefix'})
        self.assertTrue(
            'Only one of these keys pair must be used: '
            '"rootDir, rootDirPrefix".' in print_arr)

    def test_manifest_syntax_with_invalid_url(self):
        print_arr = []
        def mock_print(msg):
            print_arr.append(msg)
        print_swap = self.swap(python_utils, 'PRINT', mock_print)
        with print_swap, self.assertRaises(SystemExit):
            install_third_party.test_manifest_syntax(
                'tar', {
                    'version': '4.7.1',
                    'downloadFormat': 'tar',
                    'url': (
                        'https://python.org/packages/beautifulsoup4-4.7.1.zip'
                        '#md5=321d'),
                    'tarRootDirPrefix': 'beautifulsoup4-',
                    'rootDirPrefix': 'beautifulsoup4-',
                    'targetDirPrefix': 'beautifulsoup4-'})
        self.assertTrue(
            'This url https://python.org/packages/beautifulsoup4-4.7.1.zip is '
            'invalid for tar file format.' in print_arr)

    def test_validate_manifest_with_correct_syntax(self):
        def mock_return_json(unused_filepath):
            return {
                'dependencies': {
                    'oppiaTools': {
                        'yuiCompressor': {
                            'url': 'https://github.com/yui/v2.4.8',
                            'files': ['yuicompressor-2.4.8.jar'],
                            'version': '2.4.8',
                            'targetDirPrefix': 'yuicompressor-',
                            'downloadFormat': 'files'}}}}
        return_json_swap = self.swap(
            install_third_party, 'return_json', mock_return_json)
        with return_json_swap:
            install_third_party.validate_manifest('filepath')

    def test_validate_manifest_with_missing_download_format(self):
        def mock_return_json(unused_filepath):
            return {
                'dependencies': {
                    'oppiaTools': {
                        'yuiCompressor': {
                            'url': 'https://github.com/yui/v2.4.8',
                            'files': ['yuicompressor-2.4.8.jar'],
                            'version': '2.4.8',
                            'targetDirPrefix': 'yuicompressor-'}}}}
        return_json_swap = self.swap(
            install_third_party, 'return_json', mock_return_json)
        with return_json_swap, self.assertRaisesRegexp(
            Exception,
            'downloadFormat not specified in \\{u\'url\': '
            'u\'https://github.com/yui/v2.4.8\', u\'files\': '
            '\\[u\'yuicompressor-2.4.8.jar\'\\], u\'version\': u\'2.4.8\', '
            'u\'targetDirPrefix\': u\'yuicompressor-\'\\}'):
            install_third_party.validate_manifest('filepath')

    def test_function_calls(self):
        check_function_calls = {
            'validate_manifest_is_called': False,
            'download_files_is_called': False,
            'download_and_unzip_files_is_called': False,
            'download_and_untar_files_is_called': False
        }
        expected_check_function_calls = {
            'validate_manifest_is_called': True,
            'download_files_is_called': True,
            'download_and_unzip_files_is_called': True,
            'download_and_untar_files_is_called': True
        }
        def mock_return_json(unused_filepath):
            return {
                'dependencies': {
                    'oppiaTools': {
                        'yuiCompressor': {
                            'url': 'https://github.com/yui/v2.4.8',
                            'files': ['yuicompressor-2.4.8.jar'],
                            'version': '2.4.8',
                            'targetDirPrefix': 'yuicompressor-',
                            'downloadFormat': 'files'
                        },
                        'bleach': {
                            'version': '3.1.0',
                            'downloadFormat': 'zip',
                            'url': 'https://github.com/bleach/v3.1.0.zip',
                            'rootDirPrefix': 'bleach-',
                            'targetDirPrefix': 'bleach-'
                        },
                        'graphy': {
                            'version': '1.0.0',
                            'downloadFormat': 'tar',
                            'url': 'https://pypi/Graphy/Graphy-1.0.0.tar.gz',
                            'tarRootDirPrefix': 'Graphy-',
                            'rootDirPrefix': 'graphy-',
                            'targetDirPrefix': 'graphy-'
                        },
                        'bootstrap': {
                            'version': '4.3.1',
                            'downloadFormat': 'zip',
                            'url': 'https://bootstrap/bootstrap-4.3.1-dist.zip',
                            'rootDir': 'bootstrap-4.3.1-dist',
                            'targetDir': 'bootstrap'}}}}
        def mock_validate_manifest(unused_filepath):
            check_function_calls['validate_manifest_is_called'] = True
        def mock_download_files(
                unused_source_url_root, unused_target_dir,
                unused_source_filenames):
            check_function_calls['download_files_is_called'] = True
        def mock_download_and_unzip_files(
                unused_source_url, unused_target_parent_dir,
                unused_zip_root_name, unused_target_root_name):
            check_function_calls['download_and_unzip_files_is_called'] = True
        def mock_download_and_untar_files(
                unused_source_url, unused_target_parent_dir,
                unused_tar_root_name, unused_target_root_name):
            check_function_calls['download_and_untar_files_is_called'] = True
        return_json_swap = self.swap(
            install_third_party, 'return_json', mock_return_json)
        validate_swap = self.swap(
            install_third_party, 'validate_manifest', mock_validate_manifest)
        download_files_swap = self.swap(
            install_third_party, 'download_files', mock_download_files)
        unzip_files_swap = self.swap(
            install_third_party, 'download_and_unzip_files',
            mock_download_and_unzip_files)
        untar_files_swap = self.swap(
            install_third_party, 'download_and_untar_files',
            mock_download_and_untar_files)

        with validate_swap, return_json_swap, download_files_swap:
            with unzip_files_swap, untar_files_swap:
                install_third_party.main(args=[])
        self.assertEqual(check_function_calls, expected_check_function_calls)
