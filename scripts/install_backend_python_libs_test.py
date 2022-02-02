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

from __future__ import annotations

import builtins
import itertools
import json
import os
import re
import shutil
import subprocess
import sys

from core import python_utils
from core.tests import test_utils
from scripts import common
from scripts import install_backend_python_libs
from scripts import scripts_test_utils

import pkg_resources


class Distribution:
    """Mock distribution object containing python library information."""

    def __init__(self, library_name, version_string, metadata_dict):
        """Creates mock distribution metadata class that contains the name and
        version information for a python library.

        Args:
            library_name: str. The name of the library this object is
                representing.
            version_string: str. The stringified version of this library.
            metadata_dict: dict(str: str). The stringified metadata contents of
                the library.
        """
        self.project_name = library_name
        self.version = version_string
        self.metadata_dict = metadata_dict

    def has_metadata(self, key):
        """Returns whether the given metadata key exists.

        Args:
            key: str. The key corresponding to the metadata.

        Returns:
            bool. Whether the metadata exists.
        """
        return key in self.metadata_dict

    def get_metadata(self, key):
        """The contents of the corresponding metadata.

        Args:
            key: str. The key corresponding to the metadata.

        Returns:
            str. The contents of the metadata.
        """
        return self.metadata_dict[key]


class InstallBackendPythonLibsTests(test_utils.GenericTestBase):
    """Tests for installing backend python libraries."""

    THIRD_PARTY_DATA_DIRECTORY_FILE_PATH = os.path.join(
        common.CURR_DIR, 'core', 'tests', 'data', 'third_party')

    REQUIREMENTS_TEST_TXT_FILE_PATH = os.path.join(
        THIRD_PARTY_DATA_DIRECTORY_FILE_PATH, 'requirements_test.txt')
    INVALID_GIT_REQUIREMENTS_TEST_TXT_FILE_PATH = os.path.join(
        THIRD_PARTY_DATA_DIRECTORY_FILE_PATH,
        'invalid_git_requirements_test.txt')

    def setUp(self):
        super(InstallBackendPythonLibsTests, self).setUp()
        self.print_arr = []

        def mock_print(msg):
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        self.file_arr = []
        def mock_write(msg):
            self.file_arr.append(msg)

        class MockFile:
            def seek(self, start, stop): # pylint: disable=missing-docstring
                pass
            def read(self): # pylint: disable=missing-docstring
                return ''
            def write(self, buf): # pylint: disable=missing-docstring
                mock_write(buf)

        class MockOpenFile:
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
        def mock_check_call(cmd_tokens, **unsued_kwargs):  # pylint: disable=unused-argument
            self.cmd_token_list.append(cmd_tokens[2:])
            return scripts_test_utils.PopenStub()

        self.swap_check_call = self.swap(
            subprocess, 'check_call', mock_check_call)
        self.swap_Popen = self.swap(
            subprocess, 'Popen', mock_check_call)

        class MockErrorProcess:

            def __init__(self):
                self.returncode = 1

            def communicate(self):
                """Return required method."""
                return '', 'can\'t combine user with prefix'

        def mock_check_call_error(cmd_tokens, **kwargs):  # pylint: disable=unused-argument
            self.cmd_token_list.append(cmd_tokens[2:])
            if kwargs.get('encoding') != 'utf-8':
                raise AssertionError(
                    'Popen should have been called with encoding="utf-8"')
            return MockErrorProcess()

        self.swap_Popen_error = self.swap(
            subprocess, 'Popen', mock_check_call_error)

    def get_git_version_string(self, name, sha1_piece):
        """Utility function for constructing a GitHub URL for testing.

        Args:
            name: str. Name of the package.
            sha1_piece: str. Commit hash of the package. The piece is
                concatenated with itself to construct a full 40-character hash.

        Returns:
            str. The full GitHub URL dependency.
        """
        sha1 = ''.join(itertools.islice(itertools.cycle(sha1_piece), 40))
        return 'git+git://github.com/oppia/%s@%s' % (name, sha1)

    def test_wrong_pip_version_raises_import_error(self):
        import pip

        with self.swap_Popen, self.swap(pip, '__version__', '21.1.0'):
            install_backend_python_libs.verify_pip_is_installed()

        pip_string_with_version = (
            'pip==%s' % install_backend_python_libs.OPPIA_REQUIRED_PIP_VERSION)

        self.assertEqual(self.cmd_token_list, [
            ['pip', 'install', pip_string_with_version],
        ])

    def test_correct_pip_version_does_nothing(self):
        import pip

        with self.swap_check_call, self.swap(
                pip, '__version__',
                install_backend_python_libs.OPPIA_REQUIRED_PIP_VERSION):
            install_backend_python_libs.verify_pip_is_installed()

        self.assertEqual(self.cmd_token_list, [])

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
                u'six': (None, u'10.13.0.1'),
            }

        def mock_validate_metadata_directories():
            pass

        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)
        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)

        with self.swap_check_call, self.swap_Popen, swap_remove_dir:
            with self.open_file_swap, swap_get_mismatches:
                with swap_validate_metadata_directories:
                    install_backend_python_libs.main()

        self.assertEqual(removed_dirs, [common.THIRD_PARTY_PYTHON_LIBS_DIR])

        self.assertEqual(
            self.cmd_token_list,
            [
                ['scripts.regenerate_requirements', '--no-emit-index-url'],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '-r', common.COMPILED_REQUIREMENTS_FILE_PATH,
                    '--upgrade'
                ]
            ]
        )

    def test_library_change_or_addition_runs_correct_commands(self):
        """Library is required by the 'requirements.txt' file but it doesn't
        exist in 'third_party/python_libs'.
        """
        def mock_get_mismatches():
            return {
                u'flask': (u'1.1.0.1', u'1.1.1.0'),
                u'six': (u'1.16.0', None),
                u'git-dep1': (
                    self.get_git_version_string('git-dep1', 'a'),
                    self.get_git_version_string('git-dep1', 'b')),
                u'git-dep2': (
                    self.get_git_version_string('git-dep2', 'a'), None),
            }

        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)

        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)

        with self.swap_check_call, self.swap_Popen, self.open_file_swap:
            with swap_get_mismatches, swap_validate_metadata_directories:
                install_backend_python_libs.main()

        self.assertEqual(
            self.cmd_token_list,
            [
                ['scripts.regenerate_requirements', '--no-emit-index-url'],
                [
                    'pip', 'install',
                    '%s#egg=git-dep1' % (
                        self.get_git_version_string('git-dep1', 'a')),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'pip', 'install',
                    '%s#egg=git-dep2' % (
                        self.get_git_version_string('git-dep2', 'a')),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'pip', 'install', '%s==%s' % ('flask', '1.1.0.1'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'pip', 'install', '%s==%s' % ('six', '1.16.0'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
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
                u'six': (u'1.16.0', None),
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
        with self.swap_check_call, self.swap_Popen, swap_remove_dir:
            with self.open_file_swap, swap_get_mismatches:
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
                ['scripts.regenerate_requirements', '--no-emit-index-url'],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies', '-r',
                    common.COMPILED_REQUIREMENTS_FILE_PATH,
                    '--upgrade'
                ]
            ]
        )

    def test_main_adds_comment_to_start_of_requirements(self):
        check_function_calls = {
            'subprocess_call_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True
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

        def mock_get_mismatches():
            return {}
        def mock_validate_metadata_directories():
            pass
        swap_validate_metadata_directories = self.swap(
            install_backend_python_libs, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_backend_python_libs, 'get_mismatches', mock_get_mismatches)
        swap_call = self.swap(subprocess, 'check_call', mock_call)

        expected_lines = [
            '# Developers: Please do not modify this auto-generated file.'
            ' If\n# you want to add, remove, upgrade, or downgrade libraries,'
            '\n# please change the `requirements.in` file, and then follow\n#'
            ' the instructions there to regenerate this file.\n'
        ]
        self.assertEqual(self.file_arr, [])

        with self.swap_check_call, self.open_file_swap, swap_call:
            with swap_get_mismatches, swap_validate_metadata_directories:
                install_backend_python_libs.main()

        self.assertEqual(
            self.file_arr,
            expected_lines
        )

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_main_without_library_mismatches_calls_correct_functions(self):
        check_function_calls = {
            'subprocess_call_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True
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
        swap_print = self.swap(builtins, 'print', mock_print)
        with swap_call, swap_get_mismatches, swap_print, self.open_file_swap:
            with swap_validate_metadata_directories:
                install_backend_python_libs.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
        self.assertEqual(print_statements, [
            'Checking if pip is installed on the local machine',
            'Regenerating "requirements.txt" file...',
            'All third-party Python libraries are already installed '
            'correctly.'
        ])

    def test_library_version_change_is_handled_correctly(self):
        directory_names = [
            'webencodings-1.1.1.dist-info',
            'webencodings-1.0.1.dist-info',
            'webencodings',
            'flask',
            'flask-1.1.1.dist-info',
            'flask-10.0.1.dist-info',
            'six',
            'six-1.16.0.dist-info',
            'six-10.13.0.egg-info',
            'google_cloud_datastore-1.15.0.dist-info',
            'google_cloud_datastore-1.13.0.dist-info',
            'google'
        ]
        def mock_list_dir(path):  # pylint: disable=unused-argument
            return directory_names

        paths_to_delete = []
        def mock_rm(path):
            paths_to_delete.append(
                path[len(common.THIRD_PARTY_PYTHON_LIBS_DIR) + 1:])

        def mock_is_dir(unused_path):
            return True

        def mock_get_mismatches():
            return {
                u'flask': (u'1.1.1', u'10.0.1'),
                u'six': (u'1.16.0', u'10.13.0'),
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

        with self.swap_check_call, self.swap_Popen, swap_get_mismatches:
            with swap_validate_metadata_directories, self.open_file_swap:
                with swap_rm_tree, swap_list_dir, swap_is_dir:
                    install_backend_python_libs.main()

        self.assertItemsEqual(
            self.cmd_token_list,
            [
                ['scripts.regenerate_requirements', '--no-emit-index-url'],
                [
                    'pip', 'install', '%s==%s' % ('flask', '1.1.1'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'pip', 'install', '%s==%s' % ('webencodings', '1.1.1'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'pip', 'install', '%s==%s' % ('six', '1.16.0'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'pip', 'install',
                    '%s==%s' % ('google-cloud-datastore', '1.15.0'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ]
            ]
        )
        self.assertItemsEqual(
            paths_to_delete,
            [
                u'flask-10.0.1.dist-info',
                u'webencodings-1.0.1.dist-info',
                u'six-10.13.0.egg-info',
                u'google_cloud_datastore-1.13.0.dist-info'
            ])

    def test_that_libraries_in_requirements_are_correctly_named(self):
        # Matches strings starting with a normal library name that contains
        # regular letters, digits, periods, underscores, or hyphens and ending
        # with an optional suffix of the pattern [str] with no brackets inside
        # the outside brackets.
        library_name_pattern = re.compile(r'^[a-zA-Z0-9_.-]+(\[[^\[^\]]+\])*$')
        with python_utils.open_file(
            common.COMPILED_REQUIREMENTS_FILE_PATH, 'r') as f:
            lines = f.readlines()
            for line in lines:
                trimmed_line = line.strip()
                if not trimmed_line or trimmed_line.startswith(('#', 'git')):
                    continue
                library_name_and_version_string = trimmed_line.split(
                    ' ')[0].split('==')
                library_name = library_name_and_version_string[0]
                self.assertIsNotNone(
                    re.match(library_name_pattern, library_name))
