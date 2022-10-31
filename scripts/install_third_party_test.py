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

from __future__ import annotations

import builtins
import io
import os
import re
import subprocess
import tarfile
import tempfile
import zipfile

from core import utils
from core.tests import test_utils

from . import common
from . import install_python_prod_dependencies
from . import install_third_party

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')
MOCK_TMP_UNZIP_PATH = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.zip')


class InstallThirdPartyTests(test_utils.GenericTestBase):
    """Test the methods for installing third party."""

    def setUp(self):
        super().setUp()
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
        def mock_url_retrieve(unused_url, filename):  # pylint: disable=unused-argument
            pass
        def mock_extractall(unused_self, path):  # pylint: disable=unused-argument
            self.check_function_calls['extractall_is_called'] = True

        self.unzip_swap = self.swap(
            install_third_party, 'TMP_UNZIP_PATH', MOCK_TMP_UNZIP_PATH)
        self. dir_exists_swap = self.swap(
            common, 'ensure_directory_exists', mock_ensure_directory_exists)
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.remove_swap = self.swap(os, 'remove', mock_remove)
        self.rename_swap = self.swap(os, 'rename', mock_rename)
        self.url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        self.extract_swap = self.swap(
            zipfile.ZipFile, 'extractall', mock_extractall)

    def test_download_files_with_invalid_source_filenames(self):
        with self.assertRaisesRegex(
            AssertionError,
            'Expected list of filenames, got \'invalid source filename\''):
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
            common, 'url_retrieve', mock_url_retrieve)
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
            # The function is used as follows: utils.url_open(req).read()
            # So, the mock returns a file object as a mock so that the read
            # function can work correctly.
            temp_file = tempfile.NamedTemporaryFile()
            file_obj = utils.open_file(temp_file.name, 'r')
            return file_obj
        def mock_string_io(buffer_value):  # pylint: disable=unused-argument
            return MOCK_TMP_UNZIP_PATH

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        url_open_swap = self.swap(utils, 'url_open', mock_url_open)
        string_io_swap = self.swap(io, 'StringIO', mock_string_io)
        with exists_swap, self.dir_exists_swap, self.url_retrieve_swap:
            with self.remove_swap, self.rename_swap, self.extract_swap:
                with url_open_swap, string_io_swap:
                    install_third_party.download_and_unzip_files(
                        'http://src', 'target dir', 'zip root', 'target root')
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
        with utils.open_file(temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_third_party.get_file_contents(temp_file), actual_text)

    def test_return_json(self):
        temp_file = tempfile.NamedTemporaryFile().name
        actual_text = '{"Testing": "install_third_party"}'
        with utils.open_file(temp_file, 'w') as f:
            f.write(actual_text)
        self.assertEqual(
            install_third_party.return_json(temp_file),
            {'Testing': 'install_third_party'})

    def test_dependencies_syntax_testing_with_valid_syntax(self):
        install_third_party.test_dependencies_syntax(
            'zip', {
                'version': 'c26ebb9baaf0abc060c8a13254dad283c6ee7304',
                'downloadFormat': 'zip',
                'url': 'https://github.com/oppia/MIDI.js/archive/c26e.zip',
                'rootDirPrefix': 'MIDI.js-',
                'targetDir': 'midi-js-c26ebb'
            }
        )

    def test_dependencies_syntax_with_missing_mandatory_key(self):
        print_arr = []
        def mock_print(msg):
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_third_party.test_dependencies_syntax(
                'files', {
                    'files': ['MathJax-2.7.5.jar'],
                    'version': '2.7.5',
                    'targetDirPrefix': 'MathJax-',
                    'downloadFormat': 'files'
                }
            )
        self.assertTrue(
            'This key is missing or misspelled: "url".' in print_arr)

    def test_dependencies_syntax_with_extra_optional_key(self):
        print_arr = []
        def mock_print(msg):
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_third_party.test_dependencies_syntax(
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

    def test_dependencies_syntax_with_invalid_url(self):
        print_arr = []
        def mock_print(msg):
            print_arr.append(msg)
        print_swap = self.swap(builtins, 'print', mock_print)
        with print_swap, self.assertRaisesRegex(SystemExit, '1'):
            install_third_party.test_dependencies_syntax(
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

    def test_validate_dependencies_with_correct_syntax(self):
        def mock_return_json(unused_filepath):
            return {
                'dependencies': {
                    'frontend': {
                        'mathJax': {
                            'url': 'https://github.com/mathjax/2.7.5',
                            'files': ['MathJax-2.7.5.jar'],
                            'version': '2.7.5',
                            'targetDirPrefix': 'MathJax-',
                            'downloadFormat': 'files'
                        }
                    }
                }
            }

        return_json_swap = self.swap(
            install_third_party, 'return_json', mock_return_json)
        with return_json_swap:
            install_third_party.validate_dependencies('filepath')

    def test_validate_dependencies_with_missing_download_format(self):
        def mock_return_json(unused_filepath):
            return {
                'dependencies': {
                    'frontend': {
                        'mathJax': {
                            'version': '2.7.5',
                            'url': 'https://github.com/mathjax/2.7.5.zip',
                            'targetDirPrefix': 'MathJax-'
                        }
                    }
                }
            }
        return_json_swap = self.swap(
            install_third_party, 'return_json', mock_return_json)
        with return_json_swap, self.assertRaisesRegex(
            Exception,
            re.escape(
                'downloadFormat not specified in {\'version\': \'2.7.5\', '
                '\'url\': \'https://github.com/mathjax/2.7.5.zip\', '
                '\'targetDirPrefix\': \'MathJax-\'}'
            )
        ):
            install_third_party.validate_dependencies('filepath')

    def test_function_calls(self):
        check_function_calls = {
            'validate_dependencies_is_called': False,
            'download_files_is_called': False,
            'download_and_unzip_files_is_called': False,
            'download_and_untar_files_is_called': False,
            'install_python_prod_dependencies_is_called': False
        }
        expected_check_function_calls = {
            'validate_dependencies_is_called': True,
            'download_files_is_called': True,
            'download_and_unzip_files_is_called': True,
            'download_and_untar_files_is_called': True,
            'install_python_prod_dependencies_is_called': True
        }
        def mock_return_json(unused_filepath):
            return {
                'dependencies': {
                    'oppiaTools': {
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
                            'targetDir': 'bootstrap'
                        },
                        'angularTest': {
                            'version': '1.8.2',
                            'downloadFormat': 'files',
                            'url': 'https://code.angularjs.org/1.8.2',
                            'targetDirPrefix': 'angularjs-',
                            'files': ['angular-mocks.js']
                        },
                    }
                }
            }

        def mock_validate_dependencies(unused_filepath):
            check_function_calls['validate_dependencies_is_called'] = True
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
        def mock_install_python_prod_dependencies():
            check_function_calls[
                'install_python_prod_dependencies_is_called'] = True
        return_json_swap = self.swap(
            install_third_party, 'return_json', mock_return_json)
        validate_swap = self.swap(
            install_third_party,
            'validate_dependencies',
            mock_validate_dependencies
        )
        download_files_swap = self.swap(
            install_third_party, 'download_files', mock_download_files)
        unzip_files_swap = self.swap(
            install_third_party, 'download_and_unzip_files',
            mock_download_and_unzip_files)
        untar_files_swap = self.swap(
            install_third_party, 'download_and_untar_files',
            mock_download_and_untar_files)
        mock_install_python_prod_dependencies_swap = self.swap(
            install_python_prod_dependencies, 'main',
            mock_install_python_prod_dependencies)

        with validate_swap, return_json_swap, download_files_swap, (
            mock_install_python_prod_dependencies_swap):
            with unzip_files_swap, untar_files_swap:
                install_third_party.main(args=[])
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_windows_os_throws_exception(self):
        def mock_is_windows_os():
            return True
        windows_not_supported_exception = self.assertRaisesRegex(
            Exception,
            'The redis command line interface will not be installed because '
            'your machine is on the Windows operating system.')

        with self.swap(common, 'is_windows_os', mock_is_windows_os), (
            windows_not_supported_exception):
            install_third_party.main(args=[])

    def test_install_redis_cli_function_calls(self):
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': True
        }
        def mock_download_and_untar_files(
                unused_source_url, unused_target_parent_dir,
                unused_tar_root_name, unused_target_root_name):
            check_function_calls['download_and_untar_files_is_called'] = True

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret:
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            # The first subprocess.call() in install_redis_cli needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [common.REDIS_SERVER_PATH, '--version']:
                raise OSError('redis-server: command not found')

            return Ret()

        swap_call = self.swap(
            subprocess, 'call', mock_call)
        untar_files_swap = self.swap(
            install_third_party, 'download_and_untar_files',
            mock_download_and_untar_files)
        with swap_call, untar_files_swap:
            install_third_party.install_redis_cli()

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_install_elasticsearch_dev_server_windows(self):
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': True
        }
        def mock_is_mac_os():
            return False
        def mock_is_linux_os():
            return False
        def mock_is_windows_os():
            return True
        def mock_download_and_unzip_files(
                unused_source_url, unused_target_parent_dir,
                unused_tar_root_name, unused_target_root_name):
            check_function_calls['download_and_unzip_files_is_called'] = True
        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret:
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            # The first subprocess.call() needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [
                    '%s/bin/elasticsearch' % common.ES_PATH, '--version']:
                raise OSError('elasticsearch: command not found')

            return Ret()

        swap_call = self.swap(
            subprocess, 'call', mock_call)
        unzip_files_swap = self.swap(
            install_third_party, 'download_and_unzip_files',
            mock_download_and_unzip_files)

        mac_swap = self.swap(common, 'is_mac_os', mock_is_mac_os)
        linux_swap = self.swap(common, 'is_linux_os', mock_is_linux_os)
        windows_swap = self.swap(common, 'is_windows_os', mock_is_windows_os)
        with swap_call, unzip_files_swap, mac_swap, linux_swap, windows_swap:
            install_third_party.install_elasticsearch_dev_server()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_install_elasticsearch_dev_server_unix(self):
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }
        def mock_is_linux_os():
            return False
        def mock_is_mac_os():
            return True
        def mock_download_and_untar_files(
                unused_source_url, unused_target_parent_dir,
                unused_tar_root_name, unused_target_root_name):
            check_function_calls['download_and_untar_files_is_called'] = True

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret:
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            # The first subprocess.call() needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [
                    '%s/bin/elasticsearch' % common.ES_PATH, '--version']:
                raise OSError('elasticsearch: command not found')

            return Ret()

        swap_call = self.swap(
            subprocess, 'call', mock_call)
        untar_files_swap = self.swap(
            install_third_party, 'download_and_untar_files',
            mock_download_and_untar_files)

        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': True,
            'download_and_unzip_files_is_called': False
        }

        mac_os_swap = self.swap(common, 'is_mac_os', mock_is_mac_os)
        linux_os_swap = self.swap(common, 'is_linux_os', mock_is_linux_os)
        with swap_call, untar_files_swap, mac_os_swap, linux_os_swap:
            install_third_party.install_elasticsearch_dev_server()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_install_elasticsearch_unrecognized_os(self):

        def mock_is_mac_os():
            return False
        def mock_is_linux_os():
            return False
        def mock_is_windows_os():
            return False

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            class Ret:
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            # The first subprocess.call() needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [
                    '%s/bin/elasticsearch' % common.ES_PATH, '--version']:
                raise OSError('elasticsearch: command not found')

            return Ret()

        swap_call = self.swap(
            subprocess, 'call', mock_call)

        os_not_supported_exception = self.assertRaisesRegex(
            Exception, 'Unrecognized or unsupported operating system.')
        mac_swap = self.swap(common, 'is_mac_os', mock_is_mac_os)
        linux_swap = self.swap(common, 'is_linux_os', mock_is_linux_os)
        windows_swap = self.swap(common, 'is_windows_os', mock_is_windows_os)
        with mac_swap, linux_swap, windows_swap, swap_call, (
            os_not_supported_exception):
            install_third_party.install_elasticsearch_dev_server()

    def test_elasticsearch_already_installed(self):
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret:
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            return Ret()

        swap_call = self.swap(
            subprocess, 'call', mock_call)

        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }

        with swap_call:
            install_third_party.install_elasticsearch_dev_server()
        self.assertEqual(check_function_calls, expected_check_function_calls)
