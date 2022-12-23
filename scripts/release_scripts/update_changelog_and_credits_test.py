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

"""Unit tests for scripts/release_scripts/update_changelog_and_credits.py."""

from __future__ import annotations

import builtins
import contextlib
import getpass
import os
import re
import subprocess
import sys
import tempfile

from core import constants
from core import utils
from core.tests import test_utils
from scripts import common
from scripts.release_scripts import update_changelog_and_credits

from typing import Final, List, Union
import github  # isort:skip pylint: disable=wrong-import-position

RELEASE_TEST_DIR: Final = os.path.join('core', 'tests', 'release_sources', '')
MOCK_RELEASE_SUMMARY_FILEPATH: Final = os.path.join(
    RELEASE_TEST_DIR, 'release_summary.md')

MOCK_CHANGELOG_FILEPATH: Final = os.path.join(RELEASE_TEST_DIR, 'CHANGELOG')
MOCK_AUTHORS_FILEPATH: Final = os.path.join(RELEASE_TEST_DIR, 'AUTHORS')
MOCK_CONTRIBUTORS_FILEPATH: Final = os.path.join(
    RELEASE_TEST_DIR, 'CONTRIBUTORS'
)
MOCK_ABOUT_PAGE_CONSTANTS_FILEPATH: Final = 'about_temp_file.ts'
MOCK_PACKAGE_JSON_PATH: Final = os.path.join(
    RELEASE_TEST_DIR, 'mock_package.json'
)
MOCK_FECONF_PATH: Final = os.path.join(RELEASE_TEST_DIR, 'feconf.txt')

MOCK_UPDATED_CHANGELOG_FILEPATH: Final = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CHANGELOG')
MOCK_UPDATED_CHANGELOG_FILEPATH_FOR_REMOVAL_TEST: Final = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CHANGELOG_FOR_REMOVAL_TEST')
MOCK_UPDATED_AUTHORS_FILEPATH: Final = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_AUTHORS')
MOCK_UPDATED_CONTRIBUTORS_FILEPATH: Final = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CONTRIBUTORS')

# Here we use MyPy ignore because the pool_size argument is required by
# Requester.__init__(), but it is missing from the typing definition in
# Requester.pyi. We therefore disable type checking here. Here is the
# type definition:
# https://github.com/PyGithub/PyGithub/blob/001970d4a828017f704f6744a5775b4207a6523c/github/Requester.pyi#L97
MOCK_REQUESTER = github.Requester.Requester(  # type: ignore[call-arg]
    login_or_token=None,
    password=None,
    jwt=None,
    base_url='https://github.com',
    timeout=0,
    user_agent='user',
    per_page=0,
    verify=False,
    retry=None,
    pool_size=None,
)


def read_from_file(filepath: str) -> List[str]:
    """Reads the lines from a file.

    Args:
        filepath: str. The path of the file to read.

    Returns:
        list(str). The list of lines in the file.
    """
    with utils.open_file(filepath, 'r') as f:
        return f.readlines()


def write_to_file(
    filepath: str, filelines: Union[str, List[str]]
) -> None:
    """Writes a list of lines to a file.

    Args:
        filepath: str. The path of the file to write to.
        filelines: Union[str, List[str]]. The line(s) to
            write to the file.
    """
    with utils.open_file(filepath, 'w') as f:
        for line in filelines:
            f.write(line)


class ChangelogAndCreditsUpdateTests(test_utils.GenericTestBase):
    """Test the methods for automatic update of changelog and credits."""

    def setUp(self) -> None:
        super().setUp()
        def mock_get_current_branch_name() -> str:
            return 'release-1.2.3'
        def mock_run_cmd(unused_cmd: str) -> None:
            pass
        def mock_get_git_ref(
            unused_self: str, unused_ref: str
        ) -> github.GitRef.GitRef:
            return github.GitRef.GitRef(
                requester=MOCK_REQUESTER,
                headers={},
                attributes={},
                completed=False
            )
        def mock_getpass(prompt: str) -> str:  # pylint: disable=unused-argument
            return 'test-token'

        self.mock_repo = github.Repository.Repository(
            requester=MOCK_REQUESTER,
            headers={},
            attributes={},
            completed=False
        )
        self.branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        self.release_summary_swap = self.swap(
            constants.release_constants, 'RELEASE_SUMMARY_FILEPATH',
            MOCK_RELEASE_SUMMARY_FILEPATH)
        self.args_swap = self.swap(
            sys, 'argv', [
                'update_changelog_and_credits.py',
                '--github_username=test'])
        self.run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        self.get_git_ref_swap = self.swap(
            github.Repository.Repository, 'get_git_ref', mock_get_git_ref)
        self.getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

    def test_get_previous_release_version_without_hotfix(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'v2.0.6\nv2.0.7\n'
        with self.swap(subprocess, 'check_output', mock_check_output):
            self.assertEqual(
                update_changelog_and_credits.get_previous_release_version(
                    constants.release_constants.BRANCH_TYPE_RELEASE,
                    '2.0.8'
                ),
                '2.0.7'
            )

    def test_get_previous_release_version_with_hotfix(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'v2.0.6\nv2.0.7\nv2.0.8\n'
        with self.swap(subprocess, 'check_output', mock_check_output):
            self.assertEqual(
                update_changelog_and_credits.get_previous_release_version(
                    constants.release_constants.BRANCH_TYPE_HOTFIX,
                    '2.0.8'
                ),
                '2.0.7'
            )

    def test_get_previous_release_version_with_invalid_branch_type(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'v2.0.6\nv2.0.7\nv2.0.8\n'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            Exception, 'Invalid branch type: invalid.'):
            update_changelog_and_credits.get_previous_release_version(
                'invalid', '2.0.8')

    def test_get_previous_release_version_with_repeated_previous_version(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'v2.0.7\nv2.0.8\n'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            AssertionError,
            'Previous release version is same as current release version.'
        ):
            update_changelog_and_credits.get_previous_release_version(
                'release', '2.0.8')

    def test_update_changelog_with_non_hotfix_branch(self) -> None:
        try:
            release_summary_lines = read_from_file(
                MOCK_RELEASE_SUMMARY_FILEPATH)
            changelog_filelines = read_from_file(MOCK_CHANGELOG_FILEPATH)
            expected_filelines = read_from_file(MOCK_UPDATED_CHANGELOG_FILEPATH)
            changelog_swap = self.swap(
                update_changelog_and_credits, 'CHANGELOG_FILEPATH',
                MOCK_CHANGELOG_FILEPATH)
            date_swap = self.swap(
                update_changelog_and_credits, 'CURRENT_DATE',
                '29 Aug 2019')
            with changelog_swap, date_swap:
                update_changelog_and_credits.update_changelog(
                    'release-1.2.3', release_summary_lines, '1.2.3')
            actual_filelines = read_from_file(MOCK_CHANGELOG_FILEPATH)
            self.assertEqual(actual_filelines, expected_filelines)
        finally:
            write_to_file(MOCK_CHANGELOG_FILEPATH, changelog_filelines)

    def test_update_changelog_with_current_version_changelog_present(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'v1.0.0\nv1.0.1\n'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        try:
            release_summary_lines = read_from_file(
                MOCK_RELEASE_SUMMARY_FILEPATH)
            changelog_filelines = read_from_file(MOCK_CHANGELOG_FILEPATH)
            expected_filelines = read_from_file(
                MOCK_UPDATED_CHANGELOG_FILEPATH_FOR_REMOVAL_TEST)
            changelog_swap = self.swap(
                update_changelog_and_credits, 'CHANGELOG_FILEPATH',
                MOCK_CHANGELOG_FILEPATH)
            date_swap = self.swap(
                update_changelog_and_credits, 'CURRENT_DATE',
                '29 Aug 2019')
            with changelog_swap, date_swap, check_output_swap:
                update_changelog_and_credits.update_changelog(
                    'release-1.0.2', release_summary_lines, '1.0.2')
            actual_filelines = read_from_file(MOCK_CHANGELOG_FILEPATH)
            self.assertEqual(actual_filelines, expected_filelines)
        finally:
            write_to_file(MOCK_CHANGELOG_FILEPATH, changelog_filelines)

    def test_update_changelog_with_hotfix_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'v1.0.0\nv1.0.1\nv1.0.2\n'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        try:
            release_summary_lines = read_from_file(
                MOCK_RELEASE_SUMMARY_FILEPATH)
            changelog_filelines = read_from_file(MOCK_CHANGELOG_FILEPATH)
            expected_filelines = read_from_file(
                MOCK_UPDATED_CHANGELOG_FILEPATH_FOR_REMOVAL_TEST)
            changelog_swap = self.swap(
                update_changelog_and_credits, 'CHANGELOG_FILEPATH',
                MOCK_CHANGELOG_FILEPATH)
            date_swap = self.swap(
                update_changelog_and_credits, 'CURRENT_DATE',
                '29 Aug 2019')
            with changelog_swap, date_swap, check_output_swap:
                update_changelog_and_credits.update_changelog(
                    'release-1.0.2-hotfix-1', release_summary_lines, '1.0.2')
            actual_filelines = read_from_file(MOCK_CHANGELOG_FILEPATH)
            self.assertEqual(actual_filelines, expected_filelines)
        finally:
            write_to_file(MOCK_CHANGELOG_FILEPATH, changelog_filelines)

    def test_update_authors(self) -> None:
        try:
            release_summary_lines = read_from_file(
                MOCK_RELEASE_SUMMARY_FILEPATH)
            authors_filelines = read_from_file(MOCK_AUTHORS_FILEPATH)
            expected_filelines = read_from_file(MOCK_UPDATED_AUTHORS_FILEPATH)
            with self.swap(
                update_changelog_and_credits, 'AUTHORS_FILEPATH',
                MOCK_AUTHORS_FILEPATH):
                update_changelog_and_credits.update_authors(
                    release_summary_lines)
            actual_filelines = read_from_file(MOCK_AUTHORS_FILEPATH)
            self.assertEqual(actual_filelines, expected_filelines)
        finally:
            write_to_file(MOCK_AUTHORS_FILEPATH, authors_filelines)

    def test_update_contributors(self) -> None:
        try:
            release_summary_lines = read_from_file(
                MOCK_RELEASE_SUMMARY_FILEPATH)
            contributors_filelines = read_from_file(MOCK_CONTRIBUTORS_FILEPATH)
            expected_filelines = read_from_file(
                MOCK_UPDATED_CONTRIBUTORS_FILEPATH)
            with self.swap(
                update_changelog_and_credits, 'CONTRIBUTORS_FILEPATH',
                MOCK_CONTRIBUTORS_FILEPATH):
                update_changelog_and_credits.update_contributors(
                    release_summary_lines)
            actual_filelines = read_from_file(MOCK_CONTRIBUTORS_FILEPATH)
            self.assertEqual(actual_filelines, expected_filelines)
        finally:
            write_to_file(MOCK_CONTRIBUTORS_FILEPATH, contributors_filelines)

    def test_update_developer_names(self) -> None:
        with utils.open_file(
            update_changelog_and_credits.ABOUT_PAGE_CONSTANTS_FILEPATH, 'r'
        ) as f:
            about_page_lines = f.readlines()
            start_index = about_page_lines.index(
                update_changelog_and_credits.CREDITS_START_LINE) + 1
            end_index = about_page_lines[start_index:].index(
                update_changelog_and_credits.CREDITS_END_LINE) + 1
            existing_developer_names = about_page_lines[start_index:end_index]

        tmp_file = tempfile.NamedTemporaryFile()
        # Here we use MyPy ignore because here 'name' is a read-only property
        # but for testing purposes, we are assigning a value to this 'name'
        # property which causes MyPy to throw an error. Thus, to avoid the
        # error, we used ignore here.
        tmp_file.name = MOCK_ABOUT_PAGE_CONSTANTS_FILEPATH  # type: ignore[misc]
        with utils.open_file(
            MOCK_ABOUT_PAGE_CONSTANTS_FILEPATH, 'w'
        ) as f:
            for line in about_page_lines:
                f.write(str(line))

        release_summary_lines = read_from_file(MOCK_RELEASE_SUMMARY_FILEPATH)
        new_developer_names = update_changelog_and_credits.get_new_contributors(
            release_summary_lines, return_only_names=True)

        expected_developer_names = existing_developer_names
        for name in new_developer_names:
            expected_developer_names.append('%s\'%s\',\n' % (
                update_changelog_and_credits.CREDITS_INDENT, name))
        expected_developer_names = sorted(
            list(set(expected_developer_names)), key=lambda s: s.lower())

        with self.swap(
            update_changelog_and_credits, 'ABOUT_PAGE_CONSTANTS_FILEPATH',
            MOCK_ABOUT_PAGE_CONSTANTS_FILEPATH):
            update_changelog_and_credits.update_developer_names(
                release_summary_lines)

        with utils.open_file(tmp_file.name, 'r') as f:
            about_page_lines = f.readlines()
            start_index = about_page_lines.index(
                update_changelog_and_credits.CREDITS_START_LINE) + 1
            end_index = about_page_lines[start_index:].index(
                update_changelog_and_credits.CREDITS_END_LINE) + 1
            actual_developer_names = about_page_lines[start_index:end_index]

            self.assertEqual(actual_developer_names, expected_developer_names)

        tmp_file.close()
        if os.path.isfile(MOCK_ABOUT_PAGE_CONSTANTS_FILEPATH):
            # Occasionally this temp file is not deleted.
            os.remove(MOCK_ABOUT_PAGE_CONSTANTS_FILEPATH)

    def test_missing_section_in_release_summary(self) -> None:
        release_summary_lines = read_from_file(MOCK_RELEASE_SUMMARY_FILEPATH)
        invalid_ordering = {
            '### section1:\n': '### section2: \n'
        }
        ordering_swap = self.swap(
            update_changelog_and_credits, 'EXPECTED_ORDERING_DICT',
            invalid_ordering)
        with ordering_swap:
            self.assertFalse(
                update_changelog_and_credits.is_order_of_sections_valid(
                    release_summary_lines))

    def test_invalid_ordering_of_sections_in_release_summary(self) -> None:
        release_summary_lines = read_from_file(MOCK_RELEASE_SUMMARY_FILEPATH)
        invalid_ordering = {
            constants.release_constants.NEW_AUTHORS_HEADER: '### section2: \n'
        }
        ordering_swap = self.swap(
            update_changelog_and_credits, 'EXPECTED_ORDERING_DICT',
            invalid_ordering)
        with ordering_swap:
            self.assertFalse(
                update_changelog_and_credits.is_order_of_sections_valid(
                    release_summary_lines))

    def test_valid_ordering_of_sections_in_release_summary(self) -> None:
        release_summary_lines = read_from_file(MOCK_RELEASE_SUMMARY_FILEPATH)
        self.assertTrue(
            update_changelog_and_credits.is_order_of_sections_valid(
                release_summary_lines))

    def test_removal_of_updates_with_no_exception(self) -> None:
        def mock_delete(unused_self: str) -> None:
            pass
        delete_swap = self.swap(
            github.GitRef.GitRef, 'delete', mock_delete)
        with self.run_cmd_swap, self.get_git_ref_swap, delete_swap:
            update_changelog_and_credits.remove_updates_and_delete_branch(
                self.mock_repo, 'target_branch')

    def test_removal_of_updates_with_unknown_object_exception(self) -> None:
        def mock_delete(unused_self: str) -> None:
            raise github.UnknownObjectException(status='', data='', headers={})
        delete_swap = self.swap(
            github.GitRef.GitRef, 'delete', mock_delete)
        with self.run_cmd_swap, self.get_git_ref_swap, delete_swap:
            update_changelog_and_credits.remove_updates_and_delete_branch(
                self.mock_repo, 'target_branch')

    def test_removal_of_updates_with_valid_exception(self) -> None:
        def mock_delete(unused_self: str) -> None:
            raise Exception('Error')
        delete_swap = self.swap(
            github.GitRef.GitRef, 'delete', mock_delete)
        with self.run_cmd_swap, self.get_git_ref_swap, delete_swap:
            with self.assertRaisesRegex(
                Exception, (
                    'Please ensure that target_branch branch is deleted before '
                    're-running the script')):
                update_changelog_and_credits.remove_updates_and_delete_branch(
                    self.mock_repo, 'target_branch')

    def test_invalid_branch_name(self) -> None:
        def mock_get_current_branch_name() -> str:
            return 'invalid'
        branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with branch_name_swap, self.assertRaisesRegex(
            Exception, (
                'This script should only be run from the latest release '
                'branch.')):
            update_changelog_and_credits.main()

    def test_missing_github_username(self) -> None:
        args_swap = self.swap(
            sys, 'argv', ['update_changelog_and_credits.py'])
        with self.branch_name_swap, self.release_summary_swap, args_swap:
            with self.assertRaisesRegex(
                Exception, (
                    'No GitHub username provided. Please re-run the script '
                    'specifying a username using --github_username='
                    '<Your username>')):
                update_changelog_and_credits.main()

    def test_missing_personal_access_token(self) -> None:
        def mock_getpass(prompt: str) -> None:  # pylint: disable=unused-argument
            return None
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with self.branch_name_swap, self.release_summary_swap, self.args_swap:
            with getpass_swap, self.assertRaisesRegex(
                Exception, (
                    'No personal access token provided, please set up a '
                    'personal access token at https://github.com/settings/'
                    'tokens and re-run the script')):
                update_changelog_and_credits.main()

    def test_missing_release_summary_file(self) -> None:
        def mock_get_organization(
            unused_self: str, unused_name: str
        ) -> github.Organization.Organization:
            return github.Organization.Organization(
                requester=MOCK_REQUESTER,
                headers={},
                attributes={},
                completed=False
            )
        def mock_check_prs_for_current_release_are_released(
            unused_repo: github.Repository.Repository
        ) -> None:
            pass
        def mock_get_repo(
            unused_self: str, unused_repo_name: str
        ) -> github.Repository.Repository:
            return self.mock_repo

        get_org_swap = self.swap(
            github.Github, 'get_organization', mock_get_organization)
        get_repo_swap = self.swap(github.Github, 'get_repo', mock_get_repo)
        get_org_repo_swap = self.swap(
            github.Organization.Organization, 'get_repo', mock_get_repo)
        check_prs_swap = self.swap(
            common, 'check_prs_for_current_release_are_released',
            mock_check_prs_for_current_release_are_released)
        release_summary_swap = self.swap(
            constants.release_constants, 'RELEASE_SUMMARY_FILEPATH',
            'invalid.md')
        with self.branch_name_swap, release_summary_swap:
            with self.args_swap, self.getpass_swap:
                with get_org_swap, get_repo_swap, get_org_repo_swap:
                    with check_prs_swap, self.assertRaisesRegex(
                        Exception, (
                            'Release summary file invalid.md is missing. '
                            'Please re-run this script.')):
                        update_changelog_and_credits.main()

    def test_get_release_summary_lines(self) -> None:
        with utils.open_file(MOCK_RELEASE_SUMMARY_FILEPATH, 'r') as f:
            correct_lines = f.readlines()
            wrong_lines = []
            for line in correct_lines:
                line = line.replace(
                    'gmail.com',
                    constants.release_constants.INVALID_EMAIL_SUFFIX)
                wrong_lines.append(line)

        check_function_calls = {
            'readlines_gets_called': 0,
            'ask_user_to_confirm_gets_called': 0,
            'is_order_of_sections_valid_gets_called': 0
        }
        expected_check_function_calls = {
            'readlines_gets_called': 2,
            'ask_user_to_confirm_gets_called': 3,
            'is_order_of_sections_valid_gets_called': 2
        }
        class MockFile:
            def readlines(self) -> List[str]:
                """Read lines of the file object."""

                return mock_readlines()
        def mock_readlines() -> List[str]:
            check_function_calls['readlines_gets_called'] += 1
            if check_function_calls['readlines_gets_called'] == 2:
                return correct_lines
            return wrong_lines

        def mock_open_file(unused_path: str, unused_mode: str) -> MockFile:
            return MockFile()
        def mock_ask_user_to_confirm(unused_msg: str) -> None:
            check_function_calls['ask_user_to_confirm_gets_called'] += 1
        def mock_is_order_of_sections_valid(
            unused_release_summary_lines: List[str]
        ) -> bool:
            check_function_calls[
                'is_order_of_sections_valid_gets_called'] += 1
            if check_function_calls[
                    'is_order_of_sections_valid_gets_called'] == 1:
                return False
            return True

        open_file_swap = self.swap(utils, 'open_file', mock_open_file)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        check_order_swap = self.swap(
            update_changelog_and_credits, 'is_order_of_sections_valid',
            mock_is_order_of_sections_valid)
        with open_file_swap, ask_user_swap, check_order_swap:
            self.assertEqual(
                correct_lines,
                update_changelog_and_credits.get_release_summary_lines())
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_create_branch(self) -> None:
        check_function_calls = {
            'get_branch_gets_called': False,
            'create_git_ref_gets_called': False,
            'get_contents_gets_called': False,
            'update_file_gets_called': False,
            'run_cmd_gets_called': False,
            'open_new_tab_in_browser_if_possible_gets_called': False
        }
        expected_check_function_calls = {
            'get_branch_gets_called': True,
            'create_git_ref_gets_called': True,
            'get_contents_gets_called': True,
            'update_file_gets_called': True,
            'run_cmd_gets_called': True,
            'open_new_tab_in_browser_if_possible_gets_called': True
        }
        filepaths_get_contents_is_called_with = []
        def mock_get_branch(
            unused_self: str, unused_branch_name: str
        ) -> github.Branch.Branch:
            check_function_calls['get_branch_gets_called'] = True
            return github.Branch.Branch(
                requester=MOCK_REQUESTER,
                headers={},
                attributes={'commit': {'sha': 'test'}},
                completed=False
            )
        def mock_create_git_ref(
            unused_self: str, ref: str, sha: str  # pylint: disable=unused-argument
        ) -> None:
            check_function_calls['create_git_ref_gets_called'] = True
        def mock_get_contents(
            unused_self: str, filepath: str, ref: str  # pylint: disable=unused-argument
        ) -> github.ContentFile.ContentFile:
            check_function_calls['get_contents_gets_called'] = True
            filepaths_get_contents_is_called_with.append(filepath)
            return github.ContentFile.ContentFile(
                requester=MOCK_REQUESTER,
                headers={},
                attributes={'path': 'path', 'sha': 'sha'},
                completed=False
            )
        def mock_update_file(
            unused_self: str,
            unused_path: str,
            unused_msg: str,
            unused_content: str,
            unused_sha: str,
            branch: str  # pylint: disable=unused-argument
        ) -> None:
            check_function_calls['update_file_gets_called'] = True
        def mock_run_cmd(unused_cmd: str) -> None:
            check_function_calls['run_cmd_gets_called'] = True
        def mock_open_new_tab_in_browser_if_possible(unused_url: str) -> None:
            check_function_calls[
                'open_new_tab_in_browser_if_possible_gets_called'] = True

        get_branch_swap = self.swap(
            github.Repository.Repository, 'get_branch', mock_get_branch)
        git_ref_swap = self.swap(
            github.Repository.Repository, 'create_git_ref', mock_create_git_ref)
        get_contents_swap = self.swap(
            github.Repository.Repository, 'get_contents', mock_get_contents)
        update_file_swap = self.swap(
            github.Repository.Repository, 'update_file', mock_update_file)
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_new_tab_in_browser_if_possible)

        with get_branch_swap, git_ref_swap, get_contents_swap, update_file_swap:
            with run_cmd_swap, open_tab_swap:
                update_changelog_and_credits.create_branch(
                    self.mock_repo, self.mock_repo, 'target_branch', 'username',
                    '1.2.3')
        self.assertEqual(check_function_calls, expected_check_function_calls)
        self.assertItemsEqual(
            filepaths_get_contents_is_called_with,
            update_changelog_and_credits.LIST_OF_FILEPATHS_TO_MODIFY
        )

    def test_update_version_in_config_files_updates_version(self) -> None:
        package_json_swap = self.swap(
            update_changelog_and_credits,
            'PACKAGE_JSON_FILEPATH',
            MOCK_PACKAGE_JSON_PATH
        )
        package_json_content = utils.open_file(
            MOCK_PACKAGE_JSON_PATH, 'r').read()
        package_json_regex = re.compile('"version": ".*"')
        expected_package_json_content = package_json_regex.sub(
            '"version": "1.2.3"', package_json_content)

        feconf_swap = self.swap(common, 'FECONF_PATH', MOCK_FECONF_PATH)
        feconf_content = utils.open_file(MOCK_FECONF_PATH, 'r').read()
        feconf_regex = re.compile('OPPIA_VERSION = \'.*\'')
        expected_feconf_content = feconf_regex.sub(
            'OPPIA_VERSION = \'1.2.3\'', feconf_content)

        try:
            with contextlib.ExitStack() as stack:
                stack.enter_context(self.branch_name_swap)
                stack.enter_context(feconf_swap)
                stack.enter_context(package_json_swap)
                update_changelog_and_credits.update_version_in_config_files()
            updated_package_json_content = utils.open_file(
                MOCK_PACKAGE_JSON_PATH, 'r').read()
            updated_feconf_content = utils.open_file(
                MOCK_FECONF_PATH, 'r').read()
            self.assertEqual(
                updated_package_json_content, expected_package_json_content)
            self.assertEqual(updated_feconf_content, expected_feconf_content)
        finally:
            write_to_file(MOCK_PACKAGE_JSON_PATH, package_json_content)
            write_to_file(MOCK_FECONF_PATH, feconf_content)

    def test_inform_server_errors_team(self) -> None:
        check_function_calls = {
            'ask_user_to_confirm_gets_called': False,
            'open_new_tab_in_browser_if_possible_gets_called': False
        }
        expected_check_function_calls = {
            'ask_user_to_confirm_gets_called': True,
            'open_new_tab_in_browser_if_possible_gets_called': True
        }
        def mock_open_new_tab_in_browser_if_possible(unused_url: str) -> None:
            check_function_calls[
                'open_new_tab_in_browser_if_possible_gets_called'] = True
        def mock_ask_user_to_confirm(unused_msg: str) -> None:
            check_function_calls['ask_user_to_confirm_gets_called'] = True

        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible',
            mock_open_new_tab_in_browser_if_possible)
        ask_user_swap = self.swap(
            common, 'ask_user_to_confirm', mock_ask_user_to_confirm)
        with open_tab_swap, ask_user_swap:
            update_changelog_and_credits.inform_server_errors_team(
                'rota-url', 'server-error-playbook-url')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls(self) -> None:
        check_function_calls = {
            'check_prs_for_current_release_are_released_gets_called': False,
            'remove_updates_and_delete_branch_gets_called': False,
            'update_changelog_gets_called': False,
            'update_authors_gets_called': False,
            'update_contributors_gets_called': False,
            'update_developer_names_gets_called': False,
            'get_release_summary_lines_gets_called': False,
            'create_branch_gets_called': False,
            'update_package_json_gets_called': False,
            'inform_server_errors_team_gets_called': False,
        }
        expected_check_function_calls = {
            'check_prs_for_current_release_are_released_gets_called': True,
            'remove_updates_and_delete_branch_gets_called': True,
            'update_changelog_gets_called': True,
            'update_authors_gets_called': True,
            'update_contributors_gets_called': True,
            'update_developer_names_gets_called': True,
            'get_release_summary_lines_gets_called': True,
            'create_branch_gets_called': True,
            'update_package_json_gets_called': True,
            'inform_server_errors_team_gets_called': True,
        }
        def mock_get_organization(
            unused_self: str, unused_name: str
        ) -> github.Organization.Organization:
            return github.Organization.Organization(
                requester=MOCK_REQUESTER,
                headers={},
                attributes={},
                completed=False
            )
        def mock_check_prs_for_current_release_are_released(
            unused_repo: github.Repository.Repository
        ) -> None:
            check_function_calls[
                'check_prs_for_current_release_are_released_gets_called'] = True
        def mock_remove_updates_and_delete_branch(
            unused_repo_fork: github.Repository.Repository,
            unused_target_branch: github.Branch.Branch
        ) -> None:
            check_function_calls[
                'remove_updates_and_delete_branch_gets_called'] = True
        def mock_update_changelog(
            unused_branch_name: str,
            unused_release_summary_lines: List[str],
            unused_current_release_version_number: int
        ) -> None:
            check_function_calls['update_changelog_gets_called'] = True
        def mock_update_authors(
            unused_release_summary_lines: List[str]
        ) -> None:
            check_function_calls['update_authors_gets_called'] = True
        def mock_update_contributors(
            unused_release_summary_lines: List[str]
        ) -> None:
            check_function_calls['update_contributors_gets_called'] = True
        def mock_update_developer_names(
            unused_release_summary_lines: List[str]
        ) -> None:
            check_function_calls['update_developer_names_gets_called'] = True
        def mock_get_release_summary_lines() -> None:
            check_function_calls['get_release_summary_lines_gets_called'] = True
        def mock_create_branch(
            unused_repo: github.Repository.Repository,
            unused_repo_fork: github.Repository.Repository,
            unused_target_branch: github.Branch.Branch,
            unused_github_username: str,
            unused_current_release_version_number: int
        ) -> None:
            check_function_calls['create_branch_gets_called'] = True
        def mock_inform_server_errors_team(
            unused_release_rota_url: str,
            unused_server_error_playbook_url: str
        ) -> None:
            check_function_calls['inform_server_errors_team_gets_called'] = True
        def mock_input() -> str:
            return 'y'
        def mock_get_repo(
            unused_self: str, unused_repo_name: str
        ) -> github.Repository.Repository:
            return self.mock_repo
        def mock_update_version_in_config_files() -> None:
            check_function_calls['update_package_json_gets_called'] = True

        get_org_swap = self.swap(
            github.Github, 'get_organization', mock_get_organization)
        check_prs_swap = self.swap(
            common, 'check_prs_for_current_release_are_released',
            mock_check_prs_for_current_release_are_released)
        remove_updates_swap = self.swap(
            update_changelog_and_credits, 'remove_updates_and_delete_branch',
            mock_remove_updates_and_delete_branch)
        update_changelog_swap = self.swap(
            update_changelog_and_credits, 'update_changelog',
            mock_update_changelog)
        update_authors_swap = self.swap(
            update_changelog_and_credits, 'update_authors',
            mock_update_authors)
        update_contributors_swap = self.swap(
            update_changelog_and_credits, 'update_contributors',
            mock_update_contributors)
        update_developer_names_swap = self.swap(
            update_changelog_and_credits, 'update_developer_names',
            mock_update_developer_names)
        get_lines_swap = self.swap(
            update_changelog_and_credits, 'get_release_summary_lines',
            mock_get_release_summary_lines)
        create_branch_swap = self.swap(
            update_changelog_and_credits, 'create_branch', mock_create_branch)
        inform_server_errors_team_swap = self.swap(
            update_changelog_and_credits, 'inform_server_errors_team',
            mock_inform_server_errors_team)
        input_swap = self.swap(builtins, 'input', mock_input)
        get_repo_swap = self.swap(github.Github, 'get_repo', mock_get_repo)
        get_org_repo_swap = self.swap(
            github.Organization.Organization, 'get_repo', mock_get_repo)
        update_swap = self.swap(
            update_changelog_and_credits, 'update_version_in_config_files',
            mock_update_version_in_config_files)

        with self.branch_name_swap, self.release_summary_swap, self.args_swap:
            with self.getpass_swap, input_swap, check_prs_swap:
                with remove_updates_swap, update_authors_swap:
                    with update_changelog_swap, update_contributors_swap:
                        with update_developer_names_swap, get_lines_swap:
                            with create_branch_swap, get_repo_swap, update_swap:
                                with get_org_swap, get_org_repo_swap:
                                    with inform_server_errors_team_swap:
                                        update_changelog_and_credits.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
