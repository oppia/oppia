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

"""Unit tests for 'scripts/install_python_prod_dependencies.py'."""

from __future__ import annotations

import builtins
import itertools
import json
import os
import re
import shutil
import subprocess
import sys

from core import utils
from core.tests import test_utils
from scripts import common
from scripts import install_python_prod_dependencies
from scripts import scripts_test_utils

import pkg_resources
from typing import Dict, List, Optional, Set, Tuple


class Distribution:
    """Mock distribution object containing python library information."""

    def __init__(
        self,
        library_name: str,
        version_string: str,
        metadata_dict: Dict[str, str]
    ) -> None:
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

    def has_metadata(self, key: str) -> bool:
        """Returns whether the given metadata key exists.

        Args:
            key: str. The key corresponding to the metadata.

        Returns:
            bool. Whether the metadata exists.
        """
        return key in self.metadata_dict

    def get_metadata(self, key: str) -> str:
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

    def setUp(self) -> None:
        super().setUp()
        self.print_arr: List[str] = []

        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        self.file_arr: List[str] = []
        def mock_write(msg: str) -> None:
            self.file_arr.append(msg)

        class MockFile:
            def seek(self, start: int, stop: int) -> None: # pylint: disable=missing-docstring
                pass
            def read(self) -> str: # pylint: disable=missing-docstring
                return ''
            def write(self, buf: str) -> None: # pylint: disable=missing-docstring
                mock_write(buf)

        class MockOpenFile:
            def __init__(
                self,
                path: Optional[str] = None,
                mode: Optional[str] = None
            ) -> None:
                self.path = path
                self.mode = mode
            def __enter__(self) -> MockFile:
                return MockFile()
            def __exit__(self, *args: int) -> None:
                pass

        self.open_file_swap = self.swap(
            utils, 'open_file', MockOpenFile)

        self.cmd_token_list: List[List[str]] = []
        def mock_check_call(
            cmd_tokens: List[str], **_kwargs: str
        ) -> scripts_test_utils.PopenStub:  # pylint: disable=unused-argument
            if cmd_tokens and cmd_tokens[0].endswith('%spython' % os.path.sep):
                # Some commands use the path to the Python executable. To make
                # specifying expected commands easier, replace these with just
                # "python".
                cmd_tokens[0] = 'python'
            self.cmd_token_list.append(cmd_tokens)
            return scripts_test_utils.PopenStub()

        def mock_run(
            cmd_tokens: List[str], **_kwargs: str
        ) -> str:
            if cmd_tokens and cmd_tokens[0].endswith('python'):
                # Some commands use the path to the Python executable. To make
                # specifying expected commands easier, replace these with just
                # "python".
                cmd_tokens[0] = 'python'
            self.cmd_token_list.append(cmd_tokens)
            return ''

        self.swap_check_call = self.swap(
            subprocess, 'check_call', mock_check_call)
        self.swap_Popen = self.swap(
            subprocess, 'Popen', mock_check_call)
        self.swap_run = self.swap(subprocess, 'run', mock_run)

        class MockErrorProcess:

            def __init__(self) -> None:
                self.returncode = 1

            def communicate(self) -> Tuple[str, str]:
                """Return required method."""
                return '', 'can\'t combine user with prefix'

        def mock_check_call_error(
            cmd_tokens: List[str], **kwargs: str
        ) -> MockErrorProcess:
            self.cmd_token_list.append(cmd_tokens)
            if kwargs.get('encoding') != 'utf-8':
                raise AssertionError(
                    'Popen should have been called with encoding="utf-8"')
            return MockErrorProcess()

        self.swap_Popen_error = self.swap(
            subprocess, 'Popen', mock_check_call_error)

    def get_git_version_string(self, name: str, sha1_piece: str) -> str:
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

    def test_invalid_git_dependency_raises_an_exception(self) -> None:
        swap_requirements = self.swap(
            common, 'COMPILED_REQUIREMENTS_FILE_PATH',
            self.INVALID_GIT_REQUIREMENTS_TEST_TXT_FILE_PATH)

        with swap_requirements:
            with self.assertRaisesRegex(
                Exception, 'does not match GIT_DIRECT_URL_REQUIREMENT_PATTERN'
            ):
                install_python_prod_dependencies.get_mismatches()

    def test_multiple_discrepancies_returns_correct_mismatches(self) -> None:
        swap_requirements = self.swap(
            common, 'COMPILED_REQUIREMENTS_FILE_PATH',
            self.REQUIREMENTS_TEST_TXT_FILE_PATH)

        def mock_find_distributions(paths: List[str]) -> List[Distribution]: # pylint: disable=unused-argument
            return [
                Distribution('dependency1', '1.5.1', {}),
                Distribution('dependency2', '4.9.1.2', {}),
                Distribution('dependency5', '0.5.3', {
                    'direct_url.json': json.dumps({
                        'url': 'git://github.com/oppia/dependency5',
                        'vcs_info': {'vcs': 'git', 'commit_id': 'b' * 40},
                    })
                }),
                Distribution('dependency6', '0.5.3', {
                    'direct_url.json': json.dumps({
                        'url': 'git://github.com/oppia/dependency6',
                        'vcs_info': {'vcs': 'git', 'commit_id': 'z' * 40},
                    })
                })
            ]

        swap_find_distributions = self.swap(
            pkg_resources, 'find_distributions', mock_find_distributions)
        with swap_requirements, swap_find_distributions:
            self.assertEqual(
                install_python_prod_dependencies.get_mismatches(),
                {
                    u'dependency1': (u'1.6.1', u'1.5.1'),
                    u'dependency2': (u'4.9.1', u'4.9.1.2'),
                    u'dependency3': (u'3.1.5', None),
                    u'dependency4': (u'0.3.0.1', None),
                    u'dependency5': (
                        self.get_git_version_string('dependency5', 'a'),
                        self.get_git_version_string('dependency5', 'b')),
                    u'dependency6': (
                        None, self.get_git_version_string('dependency6', 'z')),
                    u'dependency7': (
                        self.get_git_version_string('dependency7', 'b'), None),
                }
            )

    def test_library_removal_runs_correct_commands(self) -> None:
        """Library exists in the 'third_party/python_libs' directory but it is
        not required in the 'requirements.txt' file.
        """
        removed_dirs = []
        def mock_remove_dir(directory: str) -> None:
            removed_dirs.append(directory)

        def mock_get_mismatches(
        ) -> install_python_prod_dependencies.MismatchType:
            return {
                u'flask': (None, u'10.0.1'),
                u'six': (None, u'10.13.0.1'),
            }

        def mock_validate_metadata_directories() -> None:
            pass

        swap_validate_metadata_directories = self.swap(
            install_python_prod_dependencies, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_python_prod_dependencies,
            'get_mismatches',
            mock_get_mismatches)
        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)

        with self.swap_check_call, self.swap_Popen, swap_remove_dir:
            with self.open_file_swap, swap_get_mismatches:
                with swap_validate_metadata_directories, self.swap_run:
                    install_python_prod_dependencies.main()

        self.assertEqual(removed_dirs, [common.THIRD_PARTY_PYTHON_LIBS_DIR])

        self.assertEqual(
            self.cmd_token_list,
            [
                [
                    'pip-compile', '--no-emit-index-url',
                    '--generate-hashes', 'requirements.in',
                    '--output-file', 'requirements.txt',
                ],
                [
                    'python', '-m', 'pip', 'install', '--require-hashes',
                    '--no-deps', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies',
                    '-r', common.COMPILED_REQUIREMENTS_FILE_PATH,
                    '--upgrade'
                ]
            ]
        )

    def test_library_change_or_addition_runs_correct_commands(self) -> None:
        """Library is required by the 'requirements.txt' file but it doesn't
        exist in 'third_party/python_libs'.
        """
        def mock_get_mismatches(
        ) -> install_python_prod_dependencies.MismatchType:
            return {
                u'flask': (u'1.1.0.1', u'1.1.1.0'),
                u'six': (u'1.16.0', None),
                u'git-dep1': (
                    self.get_git_version_string('git-dep1', 'a'),
                    self.get_git_version_string('git-dep1', 'b')),
                u'git-dep2': (
                    self.get_git_version_string('git-dep2', 'a'), None),
            }

        def mock_validate_metadata_directories() -> None:
            pass
        swap_validate_metadata_directories = self.swap(
            install_python_prod_dependencies, 'validate_metadata_directories',
            mock_validate_metadata_directories)

        swap_get_mismatches = self.swap(
            install_python_prod_dependencies,
            'get_mismatches',
            mock_get_mismatches)

        with self.swap_check_call, self.swap_Popen, self.open_file_swap:
            with swap_get_mismatches, swap_validate_metadata_directories:
                with self.swap_run:
                    install_python_prod_dependencies.main()

        self.assertEqual(
            self.cmd_token_list,
            [
                [
                    'pip-compile', '--no-emit-index-url',
                    '--generate-hashes', 'requirements.in',
                    '--output-file', 'requirements.txt',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s#egg=git-dep1' % (
                        self.get_git_version_string('git-dep1', 'a')),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s#egg=git-dep2' % (
                        self.get_git_version_string('git-dep2', 'a')),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s==%s' % ('flask', '1.1.0.1'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s==%s' % ('six', '1.16.0'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
            ]
        )

    def test_large_number_of_discrepancies_results_in_clean_install(
        self
    ) -> None:
        """Test that the function reinstalls all of the libraries from scratch
        when 5 or more mismatches are found.
        """
        removed_dirs = []

        def mock_remove_dir(directory: str) -> None:
            removed_dirs.append(directory)

        def mock_get_mismatches(
        ) -> install_python_prod_dependencies.MismatchType:
            return {
                u'flask': (u'1.1.1', None),
                u'six': (u'1.16.0', None),
                u'simplejson': (None, u'3.16.0'),
                u'bleach': (u'3.1.4', u'3.1.5'),
                u'callbacks': (u'0.3.0', u'0.2.0'),
            }

        def mock_validate_metadata_directories() -> None:
            pass
        swap_validate_metadata_directories = self.swap(
            install_python_prod_dependencies, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_python_prod_dependencies,
            'get_mismatches',
            mock_get_mismatches)

        swap_remove_dir = self.swap(shutil, 'rmtree', mock_remove_dir)
        with self.swap_check_call, self.swap_Popen, swap_remove_dir:
            with self.open_file_swap, swap_get_mismatches:
                with swap_validate_metadata_directories, self.swap_run:
                    install_python_prod_dependencies.main()

        self.assertEqual(
            removed_dirs,
            [
                common.THIRD_PARTY_PYTHON_LIBS_DIR
            ]
        )

        self.assertEqual(
            self.cmd_token_list,
            [
                [
                    'pip-compile', '--no-emit-index-url',
                    '--generate-hashes', 'requirements.in',
                    '--output-file', 'requirements.txt',
                ],
                [
                    'python', '-m', 'pip', 'install', '--require-hashes',
                    '--no-deps', '--target',
                    common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--no-dependencies', '-r',
                    common.COMPILED_REQUIREMENTS_FILE_PATH,
                    '--upgrade'
                ]
            ]
        )

    def test_main_adds_comment_to_start_of_requirements(self) -> None:
        def mock_get_mismatches(
        ) -> install_python_prod_dependencies.MismatchType:
            return {}
        def mock_validate_metadata_directories() -> None:
            pass
        swap_validate_metadata_directories = self.swap(
            install_python_prod_dependencies, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_python_prod_dependencies,
            'get_mismatches',
            mock_get_mismatches)

        expected_lines = [
            '# Developers: Please do not modify this auto-generated file.'
            ' If\n# you want to add, remove, upgrade, or downgrade libraries,'
            '\n# please change the `requirements.in` file, and then follow\n#'
            ' the instructions there to regenerate this file.\n'
        ]
        self.assertEqual(self.file_arr, [])

        with self.swap_check_call, self.open_file_swap, self.swap_run:
            with swap_get_mismatches, swap_validate_metadata_directories:
                install_python_prod_dependencies.main()

        self.assertEqual(
            self.file_arr,
            expected_lines
        )

        self.assertEqual(self.cmd_token_list, [
            [
                'pip-compile', '--no-emit-index-url',
                '--generate-hashes', 'requirements.in',
                '--output-file', 'requirements.txt',
            ],
        ])

    def test_main_without_library_mismatches_calls_correct_functions(
        self
    ) -> None:

        def mock_get_mismatches(
        ) -> install_python_prod_dependencies.MismatchType:
            return {}

        print_statements = []

        def mock_print(s: str) -> None:
            print_statements.append(s)

        def mock_validate_metadata_directories() -> None:
            pass
        swap_validate_metadata_directories = self.swap(
            install_python_prod_dependencies, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_python_prod_dependencies, 'get_mismatches',
            mock_get_mismatches)
        swap_print = self.swap(builtins, 'print', mock_print)
        with self.swap_run, swap_get_mismatches, swap_print:
            with swap_validate_metadata_directories, self.open_file_swap:
                install_python_prod_dependencies.main()

        self.assertEqual(self.cmd_token_list, [
            [
                'pip-compile', '--no-emit-index-url',
                '--generate-hashes', 'requirements.in',
                '--output-file', 'requirements.txt',
            ],
        ])
        self.assertEqual(print_statements, [
            'Checking if pip is installed on the local machine',
            'Regenerating "requirements.txt" file...',
            'All third-party Python libraries are already installed '
            'correctly.'
        ])

    def test_library_version_change_is_handled_correctly(self) -> None:
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
        def mock_list_dir(path: str) -> List[str]:  # pylint: disable=unused-argument
            return directory_names

        paths_to_delete = []
        def mock_rm(path: str) -> None:
            paths_to_delete.append(
                path[len(common.THIRD_PARTY_PYTHON_LIBS_DIR) + 1:])

        def mock_is_dir(unused_path: str) -> bool:
            return True

        def mock_get_mismatches(
        ) -> install_python_prod_dependencies.MismatchType:
            return {
                u'flask': (u'1.1.1', u'10.0.1'),
                u'six': (u'1.16.0', u'10.13.0'),
                u'webencodings': (u'1.1.1', u'1.0.1'),
                u'google-cloud-datastore': (u'1.15.0', u'1.13.0')
            }
        def mock_validate_metadata_directories() -> None:
            pass

        swap_validate_metadata_directories = self.swap(
            install_python_prod_dependencies, 'validate_metadata_directories',
            mock_validate_metadata_directories)
        swap_get_mismatches = self.swap(
            install_python_prod_dependencies,
            'get_mismatches',
            mock_get_mismatches)
        swap_rm_tree = self.swap(shutil, 'rmtree', mock_rm)
        swap_list_dir = self.swap(os, 'listdir', mock_list_dir)
        swap_is_dir = self.swap(os.path, 'isdir', mock_is_dir)

        with self.swap_check_call, self.swap_Popen, swap_get_mismatches:
            with swap_validate_metadata_directories, self.open_file_swap:
                with swap_rm_tree, swap_list_dir, swap_is_dir, self.swap_run:
                    install_python_prod_dependencies.main()

        self.assertItemsEqual(
            self.cmd_token_list,
            [
                [
                    'pip-compile', '--no-emit-index-url',
                    '--generate-hashes', 'requirements.in',
                    '--output-file', 'requirements.txt',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s==%s' % ('flask', '1.1.1'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s==%s' % ('webencodings', '1.1.1'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'python', '-m', 'pip', 'install',
                    '%s==%s' % ('six', '1.16.0'),
                    '--target', common.THIRD_PARTY_PYTHON_LIBS_DIR,
                    '--upgrade', '--no-dependencies',
                ],
                [
                    'python', '-m', 'pip', 'install',
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

    def test_correct_metadata_directory_names_do_not_throw_error(self) -> None:
        def mock_find_distributions(
            unused_paths: List[str]
        ) -> List[Distribution]:
            return [
                Distribution('dependency-1', '1.5.1', {}),
                Distribution('dependency2', '5.0.0', {}),
                Distribution('dependency-5', '0.5.3', {}),
                Distribution('dependency6', '0.5.3', {
                    'direct_url.json': json.dumps({
                        'url': 'git://github.com/oppia/dependency6',
                        'vcs_info': {'vcs': 'git', 'commit_id': 'z' * 40},
                    })
                }),
            ]

        def mock_list_dir(unused_path: str) -> List[str]:
            return [
                'dependency-1-1.5.1.dist-info',
                'dependency2-5.0.0.egg-info',
                'dependency-5-0.5.3-py3.8.egg-info',
                'dependency_6-0.5.3-py3.8.egg-info',
            ]

        def mock_is_dir(unused_path: str) -> bool:
            return True

        swap_find_distributions = self.swap(
            pkg_resources, 'find_distributions', mock_find_distributions)
        swap_list_dir = self.swap(os, 'listdir', mock_list_dir)
        swap_is_dir = self.swap(os.path, 'isdir', mock_is_dir)

        with swap_find_distributions, swap_list_dir, swap_is_dir:
            install_python_prod_dependencies.validate_metadata_directories()

    def test_exception_raised_when_metadata_directory_names_are_missing(
        self
    ) -> None:
        def mock_find_distributions(
            unused_paths: List[str]
        ) -> List[Distribution]:
            return [
                Distribution('dependency1', '1.5.1', {}),
                Distribution('dependency2', '5.0.0', {}),
                Distribution('dependency5', '0.5.3', {}),
                Distribution('dependency6', '0.5.3', {
                    'direct_url.json': json.dumps({
                        'url': 'git://github.com/oppia/dependency6',
                        'vcs_info': {'vcs': 'git', 'commit_id': 'z' * 40},
                    })
                }),
            ]

        def mock_list_dir(unused_path: str) -> List[str]:
            return [
                'dependency1-1.5.1.dist-info',
                'dependency1',
                'dependency2',
                'dependency2-5.0.0.dist-info',
                'dependency5',
                'dependency5-0.5.3.metadata',
            ]

        def mock_is_dir(unused_path: str) -> bool:
            return True
        swap_find_distributions = self.swap(
            pkg_resources, 'find_distributions', mock_find_distributions)
        swap_list_dir = self.swap(
            os, 'listdir', mock_list_dir)
        swap_is_dir = self.swap(
            os.path, 'isdir', mock_is_dir
        )

        metadata_exception = self.assertRaisesRegex(
            Exception,
            'The python library dependency5 was installed without the correct '
            'metadata folders which may indicate that the convention for '
            'naming the metadata folders have changed. Please go to '
            '`scripts/install_python_prod_dependencies` and modify our '
            'assumptions in the '
            '_get_possible_normalized_metadata_directory_names'
            ' function for what metadata directory names can be.')
        with swap_find_distributions, swap_list_dir, metadata_exception:
            with swap_is_dir:
                install_python_prod_dependencies.validate_metadata_directories()

    def test_that_libraries_in_requirements_are_correctly_named(self) -> None:
        # Matches strings starting with a normal library name that contains
        # regular letters, digits, periods, underscores, or hyphens and ending
        # with an optional suffix of the pattern [str] with no brackets inside
        # the outside brackets.
        library_name_pattern = re.compile(
            r'^[a-zA-Z0-9_.-]+(\[[^\[^\]]+\])*$|^\s*--hash=sha256:.*$|\\$'
        )
        with utils.open_file(
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

    def test_pip_install_without_import_error(self) -> None:
        with self.swap_Popen:
            install_python_prod_dependencies.pip_install(
                'package==version', 'path')

    def test_pip_install_with_user_prefix_error(self) -> None:
        with self.swap_Popen_error, self.swap_check_call:
            install_python_prod_dependencies.pip_install('pkg==ver', 'path')

    def test_pip_install_exception_handling(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Error installing package'
        ):
            install_python_prod_dependencies.pip_install(
                'package==version', 'path')

    def test_pip_install_with_import_error_and_darwin_os(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')

        import pip
        try:
            # Here we use MyPy ignore because to test the case where pip
            # is not present, we need to set a value in sys.modules to None.
            sys.modules['pip'] = None  # type: ignore[assignment]
            with os_name_swap, self.print_swap, self.swap_check_call:
                with self.assertRaisesRegex(
                    ImportError,
                    'Error importing pip: import of pip halted; '
                    'None in sys.modules'
                ):
                    install_python_prod_dependencies.pip_install(
                        'package==version', 'path')
        finally:
            sys.modules['pip'] = pip
        self.assertTrue(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-'
            'OS%29' in self.print_arr)

    def test_pip_install_with_import_error_and_linux_os(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')

        import pip
        try:
            # Here we use MyPy ignore because to test the case where pip
            # is not present, we need to set a value in sys.modules to None.
            sys.modules['pip'] = None  # type: ignore[assignment]
            with os_name_swap, self.print_swap, self.swap_check_call:
                with self.assertRaisesRegex(
                    ImportError,
                    'Error importing pip: import of pip halted; '
                    'None in sys.modules'
                ):
                    install_python_prod_dependencies.pip_install(
                        'package==version', 'path')
        finally:
            sys.modules['pip'] = pip
        self.assertTrue(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux'
            '%29' in self.print_arr)

    def test_pip_install_with_import_error_and_windows_os(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        import pip
        try:
            # Here we use MyPy ignore because to test the case where pip
            # is not present, we need to set a value in sys.modules to None.
            sys.modules['pip'] = None  # type: ignore[assignment]
            with os_name_swap, self.print_swap, self.swap_check_call:
                with self.assertRaisesRegex(
                    ImportError,
                    'Error importing pip: import of pip halted; '
                    'None in sys.modules'
                ):
                    install_python_prod_dependencies.pip_install(
                        'package==version', 'path')
        finally:
            sys.modules['pip'] = pip
        self.assertTrue(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28'
            'Windows%29' in self.print_arr)

    def test_uniqueness_of_normalized_lib_names_in_requirements_file(
        self
    ) -> None:
        normalized_library_names: Set[str] = set()
        with utils.open_file(common.REQUIREMENTS_FILE_PATH, 'r') as f:
            lines = f.readlines()
            for line in lines:
                trimmed_line = line.strip()
                if not trimmed_line or trimmed_line.startswith(('#', 'git')):
                    continue
                library_name_and_version_string = trimmed_line.split(
                    ' ')[0].split('==')
                normalized_library_name = (
                    install_python_prod_dependencies
                    .normalize_python_library_name(
                        library_name_and_version_string[0]))
                self.assertNotIn(
                    normalized_library_name, normalized_library_names)
                normalized_library_names.add(normalized_library_name)

    def test_uniqueness_of_normalized_lib_names_in_compiled_requirements_file(
        self
    ) -> None:
        normalized_library_names: Set[str] = set()
        with utils.open_file(
            common.COMPILED_REQUIREMENTS_FILE_PATH, 'r') as f:
            lines = f.readlines()
            for line in lines:
                trimmed_line = line.strip()
                if not trimmed_line or trimmed_line.startswith(('#', 'git')):
                    continue
                library_name_and_version_string = trimmed_line.split(
                    ' ')[0].split('==')
                normalized_library_name = (
                    install_python_prod_dependencies
                    .normalize_python_library_name(
                        library_name_and_version_string[0]))
                self.assertNotIn(
                    normalized_library_name, normalized_library_names)
                normalized_library_names.add(normalized_library_name)
