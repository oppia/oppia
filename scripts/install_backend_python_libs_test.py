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

    THIRD_PARTY_DATA_DIRECTORY_FILE_PATH = os.path.join(
        common.CURR_DIR, 'core', 'tests', 'data', 'third_party')

    TEST_REQUIREMENTS_TXT_FILE_PATH = os.path.join(
        THIRD_PARTY_DATA_DIRECTORY_FILE_PATH, 'requirements_test.txt')

    def setUp(self):
        super(InstallBackendPythonLibsTests, self).setUp()
        self.print_arr = []

        def mock_print(msg):
            self.print_arr.append(msg)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

        self.file_arr = []
        def mock_write(msg):
            self.file_arr.append(msg)

        class MockFile(python_utils.OBJECT):
            def write(self, buffer): # pylint: disable=missing-docstring
                mock_write(buffer)

        class MockOpenFile(object):
            def __init__(self, path=None, mode=None):
                self.path = path
                self.mode = mode
            def __enter__(self):
                return MockFile()
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

        swap_find_distributions = self.swap(
            pkg_resources, 'find_distributions', mock_find_distributions)
        with swap_requirements, swap_find_distributions:
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

        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)
        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)

        with self.swap_check_call, swap_remove_dir, self.open_file_swap:
            with swap_get_mismatches, swap_validate_metadata_directories:
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

        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)

        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)

        with self.swap_check_call, swap_get_mismatches:
            with swap_validate_metadata_directories:
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
        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)

        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)
        with self.swap_check_call, swap_remove_dir, swap_get_mismatches:
            with swap_validate_metadata_directories:
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

    def test_main_adds_comment_to_end_of_requirements(self):
        def mock_get_mismatches():
            return {}
        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)

        expected_lines = [
            '\n',
            '# Developers: Please do not modify this auto-generated file.'
            ' If\n# you want to add, remove, upgrade, or downgrade libraries,'
            '\n# please change the `requirements.in` file, and then follow\n#'
            ' the instructions there to regenerate this file.\n'
        ]
        self.assertEqual(self.file_arr, [])

        with self.swap_check_call, self.open_file_swap:
            with swap_get_mismatches, swap_validate_metadata_directories:
                install_backend_python_libs.main()

        self.assertEqual(
            self.file_arr,
            expected_lines
        )

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
        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches',
            mock_get_mismatches)
        swap_call = self.swap(subprocess, 'check_call', mock_call)
        swap_print = self.swap(python_utils, 'PRINT', mock_print)
        with swap_call, swap_get_mismatches, swap_print:
            with swap_validate_metadata_directories:
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
            'webencodings-1.1.1.dist-info',
            'webencodings-1.0.1.dist-info',
            'webencodings',
            'flask',
            'flask-1.1.1.dist-info',
            'flask-10.0.1.dist-info',
            'six',
            'six-1.15.0.dist-info',
            'six-10.13.0.egg-info',
            'google_cloud_datastore-1.15.0-py3.8-nspkg.pth',
            'google_cloud_datastore-1.15.0.dist-info',
            'google_cloud_datastore-1.13.0-py3.8-nspkg.pth',
            'google_cloud_datastore-1.13.0.dist-info',
            'google/'
        ]
        def mock_list_dir(path):  # pylint: disable=unused-argument
            return files_in_directory

        paths_to_delete = []
        def mock_rm(path):
            paths_to_delete.append(
                path[len(common.THIRD_PARTY_PYTHON_LIBS_DIR) + 1:])

        def mock_is_dir(path):
            if (path[len(common.THIRD_PARTY_PYTHON_LIBS_DIR) + 1:]
                in files_in_directory):
                return True
            return False

        def mock_get_mismatches():
            return {
                u'flask': (u'1.1.1', u'10.0.1'),
                u'six': (u'1.15.0', u'10.13.0'),
                u'webencodings': (u'1.1.1', u'1.0.1'),
                u'google-cloud-datastore': (u'1.15.0', u'1.13.0')
            }
        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)
        swap_rm_tree = self.swap(shutil, 'rmtree', mock_rm)
        swap_list_dir = self.swap(os, 'listdir', mock_list_dir)
        swap_is_dir = self.swap(os.path, 'isdir', mock_is_dir)

        with self.swap_check_call, swap_get_mismatches:
            with self.open_file_swap, swap_validate_metadata_directories:
                with swap_rm_tree, swap_list_dir, swap_is_dir:
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
        self.assertEqual(
            paths_to_delete,
            [
                u'flask-10.0.1.dist-info',
                u'webencodings-1.0.1.dist-info',
                u'six-10.13.0.egg-info',
                u'google_cloud_datastore-1.13.0.dist-info'
            ])

    def test_exception_raised_when_metadata_directory_names_are_missing(self):
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

        def mock_list_dir(path): # pylint: disable=unused-argument
            return [
                'dependency1-1.5.1.dist-info',
                'dependency1',
                'dependency2',
                'dependency2-5.0.0.dist-info',
                'dependency5',
                'dependency5-0.5.3.metadata',
            ]
        swap_find_distributions = self.swap(
            pkg_resources, 'find_distributions', mock_find_distributions)
        swap_list_dir = self.swap(
            os, 'listdir', mock_list_dir)
        dependency_with_missing_metadata = 'dependency5'

        metadata_exception = self.assertRaisesRegexp(
                Exception,
                'The python library dependency5 was installed without the '
                'correct metadata folders which may indicate that the '
                'convention for naming the metadata folders have changed. '
                'Please go to `scripts/install_backend_python_libs` and modify '
                'our assumptions in the _get_possible_metadata_directory_names'
                ' function for what metadata directory names can be.' )
        with swap_find_distributions, swap_list_dir, metadata_exception:
            install_backend_python_libs.validate_metadata_directories()
