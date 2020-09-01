# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for 'scripts/install_backend_python_libs.py'."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import shutil
import subprocess

from core.tests import test_utils
import pkg_resources
import python_utils
from scripts import common
from scripts import install_backend_python_libs


class InstallBackendPythonLibsTests(test_utils.GenericTestBase):
    """Tests for installing backend python libraries."""

    THIRD_PARTY_DATA_FILE_PATH = os.path.join(
        common.CURR_DIR, 'core', 'tests', 'data', 'third_party')

    TEST_REQUIREMENTS_TXT_FILE_PATH = os.path.join(
        THIRD_PARTY_DATA_FILE_PATH, 'requirements_test.txt')

    ThIRD_PARTY_DATA_FILE_PATH

    def setUp(self):
        super(InstallBackendPythonLibsTests, self).setUp()
        self.print_arr = []

        def mock_print(msg):
            self.print_arr.append(msg)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)
        class MockFile(python_utils.OBJECT):
            def __init__(self, file):
                self.file = file
            def read(self): # pylint: disable=missing-docstring
                return self.file
            def write(self, buffer): # pylint: disable=missing-docstring
                self.file.append(buffer)
        class MockOpenFile(object):
            def __init__(self, path=None, mode=None, file=''):
                self.path = path
                self.mode = mode
                self.file = file
            def __enter__(self):
                return MockFile(self.file)
            def __exit__(self, *args):
                pass
        self.open_file_swap = self.swap(
            python_utils, 'open_file', MockOpenFile)
        self.cmd_token_list = []
        def mock_check_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''
            self.cmd_token_list.append(unused_cmd_tokens)
            return Ret()
        self.swap_check_call = self.swap(
            subprocess, 'check_call', mock_check_call)

    def test_multiple_discrepancies_returns_correct_mismatches(self):
        swap_requirements = self.swap(
            common, 'COMPILED_REQUIREMENTS_FILE_PATH',
            self.TEST_REQUIREMENTS_TXT_FILE_PATH)

        def mock_find_distributions(paths): # pylint: disable=unused-argument
            class Distribution(python_utils.OBJECT):
                """Distribution object containing python library information."""
                def __init__(self, library_name, version_string):
                    """Creates mock distribution metadata class that contains
                    the name and version information for a python library.

                    Args:
                        library_name: str. The name of the library this object
                            is representing.
                        version_string: str. The stringified version of this
                            library.
                    """
                    self.project_name = library_name
                    self.version = version_string
            return [
                Distribution('dependency1', '1.5.1'),
                Distribution('dependency2', '5.0.0'),
                Distribution('dependency5', '0.5.3')
            ]

        swap_get_directory_file_contents = self.swap(
            pkg_resources, 'find_distributions', mock_find_distributions)
        with swap_requirements, swap_get_directory_file_contents:
            self.assertEqual(
                {
                    u'dependency1': (u'1.6.1', u'1.5.1'),
                    u'dependency2': (u'4.9.1', u'5.0.0'),
                    u'dependency3': (u'3.1.5', None),
                    u'dependency4': (u'0.3.0', None),
                    u'dependency5': (None, u'0.5.3')
                },
                install_backend_python_libs.get_mismatches())

    def test_library_removal_runs_correct_commands(self):
        """Library exists in the 'third_party/python_libs' directory but it is
        not required in the 'requirements.txt' file.
        """
        removed_dirs = []
        def mock_remove_dir(directory):
            removed_dirs.append(directory)

        def mock_get_mismatches():
            return {
                u'flask': (None, u'10.0.1'),
                u'six': (None, u'10.13.0')
            }
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)
        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)

        with self.swap_check_call, swap_remove_dir, self.open_file_swap:
            with swap_get_mismatches:
                install_backend_python_libs.main()

        self.assertEqual(
            removed_dirs,
            [
                common.THIRD_PARTY_PYTHON_LIBS_DIR
            ]
        )

        self.assertEqual(
            self.cmd_token_list,
            [
                ['python', '-m', 'scripts.regenerate_requirements'],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '-r', common.COMPILED_REQUIREMENTS_FILE_PATH,
                    '--upgrade'
                ]
            ]
        )

    def test_library_addition_runs_correct_commands(self):
        """Library is required by the 'requirements.txt' file but it doesn't
        exist in 'third_party/python_libs'.
        """
        def mock_get_mismatches():
            return {
                u'flask': (u'1.1.1', None),
                u'six': (u'1.15.0', None)
            }
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)

        with self.swap_check_call, swap_get_mismatches:
            install_backend_python_libs.main()

        self.assertEqual(
            self.cmd_token_list,
            [
                ['python', '-m', 'scripts.regenerate_requirements'],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '%s==%s' % ('flask', '1.1.1'),
                    '--upgrade'
                ],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '%s==%s' % ('six', '1.15.0'),
                    '--upgrade'
                ]
            ]
        )

    def test_large_number_of_discrepancies_results_in_clean_install(self):
        """Test that the function reinstalls all of the libraries from scratch
        when 5 or more mismatches are found.
        """
        removed_dirs = []
        def mock_remove_dir(directory):
            removed_dirs.append(directory)
        def mock_get_mismatches():
            return {
                u'flask': (u'1.1.1', None),
                u'six': (u'1.15.0', None),
                u'simplejson': (None, u'3.16.0'),
                u'bleach': (u'3.1.4', u'3.1.5'),
                u'callbacks': (u'0.3.0', u'0.2.0'),
            }
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)

        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)
        with self.swap_check_call, swap_remove_dir, swap_get_mismatches:
            install_backend_python_libs.main()

        self.assertEqual(
            removed_dirs,
            [
                common.THIRD_PARTY_PYTHON_LIBS_DIR
            ]
        )

        self.assertEqual(
            self.cmd_token_list,
            [
                ['python', '-m', 'scripts.regenerate_requirements'],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies', '-r',
                    common.COMPILED_REQUIREMENTS_FILE_PATH,
                    '--upgrade'
                ]
            ]
        )

    def test_main_with_library_mismatches_calls_correct_functions(self):
        check_function_calls = {
            'subprocess_call_is_called': False,
            '_rectify_third_party_directory': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            '_rectify_third_party_directory': True
        }

        temp_file = os.path.join(self.THIRD_PARTY_DATA_FILE_PATH, 'temp')
        swap_requirements = self.swap(
            common, 'COMPILED_REQUIREMENTS_FILE_PATH', temp_file)
        expected_lines = [
            '\n',
            '# Developers: Please do not modify this auto-generated file. If\n',
            '# you want to add, remove, upgrade, or downgrade libraries,\n',
            '# please change the `requirements.in` file, and then follow\n',
            '# the instructions there to regenerate this file.\n'
        ]

        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            return Ret()

        def mock_get_mismatches():
            return {
                'library': ('version', 'version')
            }

        def mock_rectify_third_party_directory(mismatches): # pylint: disable=unused-argument
            check_function_calls['_rectify_third_party_directory'] = True

        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches',
            mock_get_mismatches)
        swap_rectify_third_party_directory = self.swap(
            install_backend_python_libs, '_rectify_third_party_directory',
            mock_rectify_third_party_directory)
        swap_call = self.swap(subprocess, 'check_call', mock_call)
        with swap_call, swap_get_mismatches, swap_rectify_third_party_directory:
            with swap_requirements:
                install_backend_python_libs.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)

        with python_utils.open_file(temp_file, 'r') as f:
            self.assertEqual(expected_lines, f.readlines())
        # Revert the file.
        os.remove(temp_file)

    def test_main_without_library_mismatches_calls_correct_functions(self):
        check_function_calls = {
            'subprocess_call_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True
        }
        def mock_call(unused_cmd_tokens, *args, **kwargs):  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True
            class Ret(python_utils.OBJECT):
                """Return object with required attributes."""

                def __init__(self):
                    self.returncode = 0
                def communicate(self):
                    """Return required method."""
                    return '', ''

            return Ret()

        def mock_get_mismatches():
            return {}

        print_statements = []

        def mock_print(s):
            print_statements.append(s)

        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches',
            mock_get_mismatches)
        swap_call = self.swap(subprocess, 'check_call', mock_call)
        swap_print = self.swap(python_utils, 'PRINT', mock_print)
        with swap_call, swap_get_mismatches, swap_print:
            install_backend_python_libs.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
        self.assertEqual(
            print_statements,
            [
                'Regenerating "requirements.txt" file...',
                'All third-party Python libraries are already installed '
                'correctly.'
            ])

    def test_library_version_change_is_handled_correctly(self):
        files_in_directory = [
            'webencodings-1.1.1.dist-info/',
            'webencodings-1.0.1.dist-info/',
            'webencodings/',
            'flask/',
            'flask-1.1.1.dist-info/',
            'flask-10.0.1.dist-info/',
            'six/',
            'six-1.15.0.dist-info/',
            'six-10.13.0.dist-info/',
            'google_cloud_datastore-1.15.0-py3.8-nspkg.pth',
            'google_cloud_datastore-1.15.0.dist-info/',
            'google_cloud_datastore-1.13.0-py3.8-nspkg.pth',
            'google_cloud_datastore-1.13.0.dist-info/',
            'google/'
        ]
        def mock_list_dir(path):  # pylint: disable=unused-argument
            return files_in_directory

        def mock_is_dir(path):
            return path.endswith('/')

        paths_to_delete = []
        def mock_rm(path):
            paths_to_delete.append(
                path[len(common.THIRD_PARTY_PYTHON_LIBS_DIR) + 1:])

        def mock_get_mismatches():
            return {
                u'flask': (u'1.1.1', u'10.0.1'),
                u'six': (u'1.15.0', u'10.13.0'),
                u'webencodings': (u'1.1.1', u'1.0.1'),
                u'google-cloud-datastore': (u'1.15.0', u'1.13.0')
            }
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)
        swap_rm_tree = self.swap(shutil, 'rmtree', mock_rm)
        swap_os_rm = self.swap(os, 'remove', mock_rm)
        swap_list_dir = self.swap(os, 'listdir', mock_list_dir)
        swap_is_dir = self.swap(os.path, 'isdir', mock_is_dir)

        with self.swap_check_call, swap_get_mismatches:
            with self.open_file_swap:
                with swap_rm_tree, swap_os_rm, swap_list_dir, swap_is_dir:
                    install_backend_python_libs.main()

        self.assertEqual(
            self.cmd_token_list,
            [
                ['python', '-m', 'scripts.regenerate_requirements'],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '%s==%s' % ('flask', '1.1.1'),
                    '--upgrade'
                ],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '%s==%s' % ('webencodings', '1.1.1'),
                    '--upgrade'
                ],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '%s==%s' % ('six', '1.15.0'),
                    '--upgrade'
                ],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '%s==%s' % ('google-cloud-datastore', '1.15.0'),
                    '--upgrade'
                ]
            ]
        )
        print(paths_to_delete)
        self.assertEqual(
            paths_to_delete,
            [
                u'flask-10.0.1.dist-info/',
                u'webencodings-1.0.1.dist-info/',
                u'six-10.13.0.dist-info/',
                u'google_cloud_datastore-1.13.0-py3.8-nspkg.pth',
                u'google_cloud_datastore-1.13.0.dist-info/'
            ])
