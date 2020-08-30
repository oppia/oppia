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
from pip._internal.utils import misc
import python_utils
from scripts import common
from scripts import install_backend_python_libs


class InstallBackendPythonLibsTests(test_utils.GenericTestBase):
    """Test the script for installing backend python libs."""

    THIRD_PARTY_DATA_FILE_PATH = os.path.join(
        common.CURR_DIR, 'core', 'tests', 'data', 'third_party')

    TEST_REQUIREMENTS_TXT_FILE_PATH = os.path.join(
        THIRD_PARTY_DATA_FILE_PATH, 'requirements_test.txt')

    def test_adding_library_to_requirements_returns_correct_mismatches(self):
        def mock_get_requirements_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1',
                u'flask': u'1.0.1'
            }
        def mock_get_directory_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1',
            }

        swap_get_requirements_file_contents = self.swap(
            install_backend_python_libs, '_get_requirements_file_contents',
            mock_get_requirements_file_contents)
        swap_get_directory_file_contents = self.swap(
            install_backend_python_libs, '_get_third_party_directory_contents',
            mock_get_directory_file_contents)
        with swap_get_requirements_file_contents, (
            swap_get_directory_file_contents):
            self.assertEqual(
                {
                    u'flask': (u'1.0.1', None)
                },
                install_backend_python_libs.get_mismatches())

    def test_removing_library_from_requirements_returns_correct_mismatches(
            self):
        def mock_get_requirements_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1'
            }
        def mock_get_directory_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'flask': u'1.0.1',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1',
            }

        swap_get_requirements_file_contents = self.swap(
            install_backend_python_libs, '_get_requirements_file_contents',
            mock_get_requirements_file_contents)
        swap_get_directory_file_contents = self.swap(
            install_backend_python_libs, '_get_third_party_directory_contents',
            mock_get_directory_file_contents)
        with swap_get_requirements_file_contents, (
            swap_get_directory_file_contents):
            self.assertEqual(
                {
                    u'flask': (None, u'1.0.1')
                },
                install_backend_python_libs.get_mismatches())

    def test_multiple_discrepancies_returns_correct_mismatches(self):
        def mock_get_requirements_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.13.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.2',
                u'bleach': u'3.1.5'
            }
        def mock_get_directory_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'flask': u'1.0.1',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.0'
            }

        swap_get_requirements_file_contents = self.swap(
            install_backend_python_libs, '_get_requirements_file_contents',
            mock_get_requirements_file_contents)
        swap_get_directory_file_contents = self.swap(
            install_backend_python_libs, '_get_third_party_directory_contents',
            mock_get_directory_file_contents)
        with swap_get_requirements_file_contents, (
            swap_get_directory_file_contents):
            self.assertEqual(
                {
                    u'flask': (None, u'1.0.1'),
                    u'six': (u'1.13.0', u'1.15.0'),
                    u'bleach': (u'3.1.5', None),
                    u'webencodings': (u'0.5.2', u'0.5.0')
                },
                install_backend_python_libs.get_mismatches())

    def test_rectify_party_directory_handles_library_upgrade(self):
        cmd_token_list = []
        def mock_check_call(cmd_tokens):
            cmd_token_list.append(cmd_tokens)

        mismatches = {
            u'flask': (u'1.1.1', u'1.0.1'),
            u'six': (u'1.15.0', u'1.13.0')
        }

        swap_check_call = self.swap(subprocess, 'check_call', mock_check_call)
        with swap_check_call:
            install_backend_python_libs._rectify_third_party_directory( # pylint: disable=protected-access
                mismatches)

        self.assertEqual(
            cmd_token_list,
            [
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

    def test_rectify_party_directory_handles_library_downgrade(self):
        cmd_token_list = []
        def mock_check_call(cmd_tokens):
            cmd_token_list.append(cmd_tokens)

        metadata_removal_list = []
        def mock_remove_metadata(library, directory_version):
            metadata_removal_list.append((library, directory_version))

        mismatches = {
            u'flask': (u'1.1.1', u'10.0.1'),
            u'six': (u'1.15.0', u'10.13.0')
        }
        swap_metadata_removal = self.swap(
            install_backend_python_libs, '_remove_metadata',
            mock_remove_metadata)

        swap_check_call = self.swap(subprocess, 'check_call', mock_check_call)
        with swap_check_call, swap_metadata_removal:
            install_backend_python_libs._rectify_third_party_directory( # pylint: disable=protected-access
                mismatches)

        self.assertEqual(
            metadata_removal_list,
            [
                (u'flask', '10.0.1'),
                (u'six', '10.13.0')
            ]
        )

        self.assertEqual(
            cmd_token_list,
            [
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

    def test_rectify_party_directory_handles_library_removal(self):
        """Library exists in the 'third_party/python_libs' directory but it is
        not required in the 'requirements.txt' file.
        """
        cmd_token_list = []
        def mock_check_call(cmd_tokens):
            cmd_token_list.append(cmd_tokens)

        removed_dirs = []
        def mock_remove_dir(directory):
            removed_dirs.append(directory)

        mismatches = {
            u'flask': (None, u'10.0.1'),
            u'six': (None, u'10.13.0')
        }
        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)

        swap_check_call = self.swap(subprocess, 'check_call', mock_check_call)
        with swap_check_call, swap_remove_dir:
            install_backend_python_libs._rectify_third_party_directory( # pylint: disable=protected-access
                mismatches)

        self.assertEqual(
            removed_dirs,
            [
                common.THIRD_PARTY_PYTHON_LIBS_DIR,
                common.THIRD_PARTY_PYTHON_LIBS_DIR
            ]
        )

        self.assertEqual(
            cmd_token_list,
            [
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '-r', common.REQUIREMENTS_FILE_PATH
                ],
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '-r', common.REQUIREMENTS_FILE_PATH
                ]
            ]
        )

    def test_rectify_party_directory_handles_library_addition(self):
        """Library is required by the 'requirements.txt' file but it doesn't
        exist in 'third_party/python_libs'.
        """
        cmd_token_list = []
        def mock_check_call(cmd_tokens):
            cmd_token_list.append(cmd_tokens)

        mismatches = {
            u'flask': (u'1.1.1', None),
            u'six': (u'1.15.0', None)
        }

        swap_check_call = self.swap(subprocess, 'check_call', mock_check_call)
        with swap_check_call:
            install_backend_python_libs._rectify_third_party_directory( # pylint: disable=protected-access
                mismatches)

        self.assertEqual(
            cmd_token_list,
            [
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

    def test_rectify_party_directory_handles_more_than_five_mismatches(self):
        """Test that the function reinstalls all of the libraries from scratch
        when 5 or more mismatches are found.
        """
        cmd_token_list = []
        def mock_check_call(cmd_tokens):
            cmd_token_list.append(cmd_tokens)

        removed_dirs = []
        def mock_remove_dir(directory):
            removed_dirs.append(directory)

        mismatches = {
            u'flask': (u'1.1.1', None),
            u'six': (u'1.15.0', None),
            u'simplejson': (None, u'3.16.0'),
            u'bleach': (u'3.1.4', u'3.1.5'),
            u'callbacks': (u'0.3.0', u'0.2.0'),
        }

        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)

        swap_check_call = self.swap(subprocess, 'check_call', mock_check_call)
        with swap_check_call, swap_remove_dir:
            install_backend_python_libs._rectify_third_party_directory( # pylint: disable=protected-access
                mismatches)

        self.assertEqual(
            removed_dirs,
            [
                common.THIRD_PARTY_PYTHON_LIBS_DIR
            ]
        )

        self.assertEqual(
            cmd_token_list,
            [
                [
                    'pip', 'install', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies', '-r',
                    common.REQUIREMENTS_FILE_PATH
                ]
            ]
        )

    def test_get_third_party_directory_contents(self):
        def mock_get_installed_distributions(skip, paths): # pylint: disable=unused-argument
            return [
                'GoogleAppEnginePipeline 1.9.22.1',
                'html5lib 1.0.1',
                'mox 0.5.3'
            ]

        swap_get_installed_distributions = self.swap(
            misc,
            'get_installed_distributions',
            mock_get_installed_distributions)

        with swap_get_installed_distributions:
            directory_contents = (
                install_backend_python_libs. # pylint: disable=protected-access
                _get_third_party_directory_contents())

        self.assertEqual(
            directory_contents,
            {
                'googleappenginepipeline': '1.9.22.1',
                'html5lib': '1.0.1',
                'mox': '0.5.3'
            })

    def test_get_requirements_file_contents(self):
        swap_requirements = self.swap(
            common, 'REQUIREMENTS_FILE_PATH',
            self.TEST_REQUIREMENTS_TXT_FILE_PATH)

        with swap_requirements:
            requirements_contents = (
                install_backend_python_libs._get_requirements_file_contents()) # pylint: disable=protected-access

        self.assertEqual(
            requirements_contents,
            {
                u'funcsigs': u'1.0.2', u'packaging': u'20.4',
                u'googleappenginecloudstorageclient': u'1.9.22.1',
                u'pyparsing': u'2.4.7', u'pylatexenc': u'2.6',
                u'html5lib': u'1.0.1', u'six': u'1.15.0',
                u'redis': u'3.5.3', u'webencodings': u'0.5.1',
                u'mock': u'3.0.5', u'mox': u'0.5.3', u'simplejson': u'3.17.0',
                u'callbacks': u'0.3.0', u'bleach': u'3.1.5',
                u'beautifulsoup4': u'4.9.1', u'soupsieve': u'1.9.5',
                u'backports.functools-lru-cache': u'1.6.1',
                u'mutagen': u'1.43.0', u'future': u'0.17.1',
                u'graphy': u'1.0.0', u'googleappenginemapreduce': u'1.9.22.0',
                u'googleappenginepipeline': u'1.9.22.1'
            })

    def test_remove_metadata(self):
        files_in_directory = [
            'webencodings-0.5.1.dist-info/',
            'webencodings',
            'redis',
            'redis-3.5.3.dist-info/',
            'google_cloud_datastore-1.15.0-py3.8-nspkg.pth',
            'google_cloud_datastore-1.15.0.dist-info/',
            'google'
        ]
        def mock_list_dir(path):  # pylint: disable=unused-argument
            return files_in_directory

        def mock_is_dir(path):
            return path.endswith('/')

        paths_to_delete = []
        def mock_rm(path):
            paths_to_delete.append(
                path[len(common.THIRD_PARTY_PYTHON_LIBS_DIR) + 1:])

        swap_rm_tree = self.swap(shutil, 'rmtree', mock_rm)
        swap_os_rm = self.swap(os, 'remove', mock_rm)
        swap_list_dir = self.swap(os, 'listdir', mock_list_dir)
        swap_is_dir = self.swap(os.path, 'isdir', mock_is_dir)

        libraries_to_remove = [
            ('webencodings', '0.5.1'),
            ('google-cloud-datastore', '1.15.0')
        ]
        with swap_rm_tree, swap_os_rm, swap_list_dir, swap_is_dir:
            for library, version in libraries_to_remove:
                install_backend_python_libs._remove_metadata(library, version) # pylint: disable=protected-access

        self.assertEqual(
            paths_to_delete,
            [
                'webencodings-0.5.1.dist-info/',
                'google_cloud_datastore-1.15.0-py3.8-nspkg.pth',
                'google_cloud_datastore-1.15.0.dist-info/',
            ])

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
            common, 'REQUIREMENTS_FILE_PATH', temp_file)
        expected_lines = [
            '\n',
            '# Developers: Please do not add to this auto-generated file. If\n',
            '# you want to add, remove, upgrade, or downgrade libraries,\n',
            '# please change the `requirements.in` file and run the script\n',
            '# `scripts/install_third_party` again to see your changes\n',
            '# reflected in this file.\n'
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
                'Third party python libraries already installed correctly.'
            ])
