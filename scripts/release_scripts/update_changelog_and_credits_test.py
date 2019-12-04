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

"""Unit tests for scripts/update_changelog_and_credits.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import getpass
import os
import subprocess
import sys

from core.tests import test_utils
import python_utils
import release_constants
from scripts import common
from scripts.release_scripts import generate_release_info
from scripts.release_scripts import update_changelog_and_credits

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')

MOCK_RELEASE_SUMMARY_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'release_summary.md')

MOCK_CHANGELOG_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'CHANGELOG')
MOCK_AUTHORS_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'AUTHORS')
MOCK_CONTRIBUTORS_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'CONTRIBUTORS')
MOCK_ABOUT_PAGE_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'about-page.directive.html')

MOCK_UPDATED_CHANGELOG_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CHANGELOG')
MOCK_UPDATED_CHANGELOG_FILEPATH_FOR_REMOVAL_TEST = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CHANGELOG_FOR_REMOVAL_TEST')
MOCK_UPDATED_AUTHORS_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_AUTHORS')
MOCK_UPDATED_CONTRIBUTORS_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'UPDATED_CONTRIBUTORS')
MOCK_UPDATED_ABOUT_PAGE_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'updated-about-page.directive.html')


def read_from_file(filepath):
    """Reads the lines from a file.

    Args:
        filepath: str. The path of the file to read.

    Returns:
        list(str). The list of lines in the file.
    """
    with python_utils.open_file(filepath, 'r') as f:
        return f.readlines()


def write_to_file(filepath, filelines):
    """Writes a list of lines to a file.

    Args:
        filepath: str. The path of the file to write to.
        filelines: list(str). The lines to write to the file.
    """
    with python_utils.open_file(filepath, 'w') as f:
        for line in filelines:
            f.write(line)


class ChangelogAndCreditsUpdateTests(test_utils.GenericTestBase):
    """Test the methods for automatic update of changelog and credits."""

    def setUp(self):
        super(ChangelogAndCreditsUpdateTests, self).setUp()
        def mock_get_current_branch_name():
            return 'release-1.2.3'
        def mock_run_cmd(unused_cmd):
            pass
        def mock_get_git_ref(unused_self, unused_ref):
            return github.GitRef.GitRef(
                requester='', headers='', attributes={}, completed='')
        def mock_main(unused_personal_access_token):
            pass
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return 'test-token'
        # pylint: enable=unused-argument

        self.mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        self.branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        self.release_summary_swap = self.swap(
            release_constants, 'RELEASE_SUMMARY_FILEPATH',
            MOCK_RELEASE_SUMMARY_FILEPATH)
        self.args_swap = self.swap(
            sys, 'argv', [
                'update_changelog_and_credits.py',
                '--github_username=test'])
        self.run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        self.get_git_ref_swap = self.swap(
            github.Repository.Repository, 'get_git_ref', mock_get_git_ref)
        self.main_swap = self.swap(generate_release_info, 'main', mock_main)
        self.getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

    def test_get_previous_release_version_without_hotfix(self):
        def mock_check_output(unused_cmd_tokens):
            return 'v2.0.6\nv2.0.7\n'
        with self.swap(subprocess, 'check_output', mock_check_output):
            self.assertEqual(
                update_changelog_and_credits.get_previous_release_version(
                    release_constants.BRANCH_TYPE_RELEASE, '2.0.8'), '2.0.7')

    def test_get_previous_release_version_with_hotfix(self):
        def mock_check_output(unused_cmd_tokens):
            return 'v2.0.6\nv2.0.7\nv2.0.8\n'
        with self.swap(subprocess, 'check_output', mock_check_output):
            self.assertEqual(
                update_changelog_and_credits.get_previous_release_version(
                    release_constants.BRANCH_TYPE_HOTFIX, '2.0.8'), '2.0.7')

    def test_get_previous_release_version_with_invalid_branch_type(self):
        def mock_check_output(unused_cmd_tokens):
            return 'v2.0.6\nv2.0.7\nv2.0.8\n'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception, 'Invalid branch type: invalid.'):
            update_changelog_and_credits.get_previous_release_version(
                'invalid', '2.0.8')

    def test_get_previous_release_version_with_repeated_previous_version(
            self):
        def mock_check_output(unused_cmd_tokens):
            return 'v2.0.7\nv2.0.8\n'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaises(AssertionError):
            update_changelog_and_credits.get_previous_release_version(
                'release', '2.0.8')

    def test_update_changelog_with_non_hotfix_branch(self):
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

    def test_update_changelog_with_current_version_changelog_present(self):
        def mock_check_output(unused_cmd_tokens):
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

    def test_update_changelog_with_hotfix_branch(self):
        def mock_check_output(unused_cmd_tokens):
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

    def test_update_authors(self):
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

    def test_update_contributors(self):
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

    def test_update_developer_names(self):
        try:
            release_summary_lines = read_from_file(
                MOCK_RELEASE_SUMMARY_FILEPATH)
            about_page_filelines = read_from_file(MOCK_ABOUT_PAGE_FILEPATH)
            expected_filelines = read_from_file(
                MOCK_UPDATED_ABOUT_PAGE_FILEPATH)
            with self.swap(
                update_changelog_and_credits, 'ABOUT_PAGE_FILEPATH',
                MOCK_ABOUT_PAGE_FILEPATH):
                update_changelog_and_credits.update_developer_names(
                    release_summary_lines)
            actual_filelines = read_from_file(MOCK_ABOUT_PAGE_FILEPATH)
            self.assertEqual(actual_filelines, expected_filelines)
        finally:
            write_to_file(MOCK_ABOUT_PAGE_FILEPATH, about_page_filelines)

    def test_missing_section_in_release_summary(self):
        release_summary_lines = read_from_file(MOCK_RELEASE_SUMMARY_FILEPATH)
        invalid_ordering = {
            '### section1:\n': '### section2: \n'
        }
        ordering_swap = self.swap(
            update_changelog_and_credits, 'EXPECTED_ORDERING',
            invalid_ordering)
        with ordering_swap, self.assertRaisesRegexp(
            Exception, (
                'Expected release_summary to have ### section1: section to '
                'ensure that automatic updates to changelog and credits are '
                'correct.')):
            update_changelog_and_credits.check_ordering_of_sections(
                release_summary_lines)

    def test_invalid_ordering_of_sections_in_release_summary(self):
        release_summary_lines = read_from_file(MOCK_RELEASE_SUMMARY_FILEPATH)
        invalid_ordering = {
            '### New Authors:\n': '### section2: \n'
        }
        ordering_swap = self.swap(
            update_changelog_and_credits, 'EXPECTED_ORDERING',
            invalid_ordering)
        with ordering_swap, self.assertRaisesRegexp(
            Exception, (
                'Expected ### New Authors: section to be followed by ### '
                'section2: section in release_summary to ensure that automatic '
                'updates to changelog and credits are correct.')):
            update_changelog_and_credits.check_ordering_of_sections(
                release_summary_lines)

    def test_missing_span_in_about_page(self):
        about_page_lines = [
            '<p>Invalid</p>\n', '<ul>\n', '  <li>line</li>\n', '</ul>\n']
        with self.assertRaisesRegexp(
            Exception, (
                'Expected about-page.directive.html to have <span>A</span>.')):
            update_changelog_and_credits.find_indentation(about_page_lines)

    def test_missing_li_in_about_page(self):
        about_page_lines = [
            '<span>A</span>\n', '<ul>\n', '  <p>Invalid line</p>\n', '</ul>\n']
        with self.assertRaisesRegexp(
            Exception, (
                'Expected <span>A</span> text to be followed by an unordered '
                'list in about-page.directive.html')):
            update_changelog_and_credits.find_indentation(about_page_lines)

    def test_removal_of_updates_with_no_exception(self):
        def mock_delete(unused_self):
            pass
        delete_swap = self.swap(
            github.GitRef.GitRef, 'delete', mock_delete)
        with self.run_cmd_swap, self.get_git_ref_swap, delete_swap:
            update_changelog_and_credits.remove_updates_and_delete_branch(
                self.mock_repo, 'target_branch')

    def test_removal_of_updates_with_unknown_object_exception(self):
        def mock_delete(unused_self):
            raise github.UnknownObjectException(status='', data='')
        delete_swap = self.swap(
            github.GitRef.GitRef, 'delete', mock_delete)
        with self.run_cmd_swap, self.get_git_ref_swap, delete_swap:
            update_changelog_and_credits.remove_updates_and_delete_branch(
                self.mock_repo, 'target_branch')

    def test_removal_of_updates_with_valid_exception(self):
        def mock_delete(unused_self):
            raise Exception('Error')
        delete_swap = self.swap(
            github.GitRef.GitRef, 'delete', mock_delete)
        with self.run_cmd_swap, self.get_git_ref_swap, delete_swap:
            with self.assertRaisesRegexp(
                Exception, (
                    'Please ensure that target_branch branch is deleted before '
                    're-running the script')):
                update_changelog_and_credits.remove_updates_and_delete_branch(
                    self.mock_repo, 'target_branch')

    def test_invalid_branch_name(self):
        def mock_get_current_branch_name():
            return 'invalid'
        branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with branch_name_swap, self.assertRaisesRegexp(
            Exception, (
                'This script should only be run from the latest release '
                'branch.')):
            update_changelog_and_credits.main()

    def test_missing_github_username(self):
        args_swap = self.swap(
            sys, 'argv', ['update_changelog_and_credits.py'])
        with self.branch_name_swap, self.release_summary_swap, args_swap:
            with self.assertRaisesRegexp(
                Exception, (
                    'No GitHub username provided. Please re-run the script '
                    'specifying a username using --github_username='
                    '<Your username>')):
                update_changelog_and_credits.main()

    def test_missing_personal_access_token(self):
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return None
        # pylint: enable=unused-argument
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with self.branch_name_swap, self.release_summary_swap, self.args_swap:
            with getpass_swap, self.assertRaisesRegexp(
                Exception, (
                    'No personal access token provided, please set up a '
                    'personal access token at https://github.com/settings/'
                    'tokens and re-run the script')):
                update_changelog_and_credits.main()

    def test_missing_release_summary_file(self):
        release_summary_swap = self.swap(
            release_constants, 'RELEASE_SUMMARY_FILEPATH', 'invalid.md')
        with self.main_swap, self.branch_name_swap, release_summary_swap:
            with self.args_swap, self.getpass_swap, self.assertRaisesRegexp(
                Exception, (
                    'Release summary file invalid.md is missing. '
                    'Please re-run this script.')):
                update_changelog_and_credits.main()

    def test_create_branch(self):
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
        def mock_get_branch(unused_self, unused_branch_name):
            check_function_calls['get_branch_gets_called'] = True
            return github.Branch.Branch(
                requester='', headers='',
                attributes={'commit': {'sha': 'test'}}, completed='')
        # pylint: disable=unused-argument
        def mock_create_git_ref(unused_self, ref, sha):
            check_function_calls['create_git_ref_gets_called'] = True
        def mock_get_contents(unused_self, unused_filepath, ref):
            check_function_calls['get_contents_gets_called'] = True
            return github.ContentFile.ContentFile(
                requester='', headers='',
                attributes={'path': 'path', 'sha': 'sha'}, completed='')
        def mock_update_file(
                unused_self, unused_path, unused_msg, unused_content,
                unused_sha, branch):
            check_function_calls['update_file_gets_called'] = True
        # pylint: enable=unused-argument
        def mock_run_cmd(unused_cmd):
            check_function_calls['run_cmd_gets_called'] = True
        def mock_open_new_tab_in_browser_if_possible(unused_url):
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
                    self.mock_repo, 'target_branch', 'username', '1.2.3')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_function_calls(self):
        check_function_calls = {
            'remove_updates_and_delete_branch_gets_called': False,
            'update_changelog_gets_called': False,
            'update_authors_gets_called': False,
            'update_contributors_gets_called': False,
            'update_developer_names_gets_called': False,
            'check_ordering_of_sections_gets_called': False,
            'create_branch_gets_called': False,
            'open_new_tab_in_browser_if_possible_gets_called': False
        }
        expected_check_function_calls = {
            'remove_updates_and_delete_branch_gets_called': True,
            'update_changelog_gets_called': True,
            'update_authors_gets_called': True,
            'update_contributors_gets_called': True,
            'update_developer_names_gets_called': True,
            'check_ordering_of_sections_gets_called': True,
            'create_branch_gets_called': True,
            'open_new_tab_in_browser_if_possible_gets_called': True
        }
        def mock_remove_updates_and_delete_branch(
                unused_repo_fork, unused_target_branch):
            check_function_calls[
                'remove_updates_and_delete_branch_gets_called'] = True
        def mock_update_changelog(
                unused_branch_name, unused_release_summary_lines,
                unused_current_release_version_number):
            check_function_calls['update_changelog_gets_called'] = True
        def mock_update_authors(unused_release_summary_lines):
            check_function_calls['update_authors_gets_called'] = True
        def mock_update_contributors(unused_release_summary_lines):
            check_function_calls['update_contributors_gets_called'] = True
        def mock_update_developer_names(unused_release_summary_lines):
            check_function_calls['update_developer_names_gets_called'] = True
        def mock_check_ordering_of_sections(unused_release_summary_lines):
            check_function_calls[
                'check_ordering_of_sections_gets_called'] = True
        def mock_create_branch(
                unused_repo_fork, unused_target_branch, unused_github_username,
                unused_current_release_version_number):
            check_function_calls['create_branch_gets_called'] = True
        def mock_input():
            return 'y'
        def mock_get_repo(unused_self, unused_repo_name):
            return self.mock_repo
        def mock_open_tab(unused_url):
            check_function_calls[
                'open_new_tab_in_browser_if_possible_gets_called'] = True

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
        check_order_swap = self.swap(
            update_changelog_and_credits, 'check_ordering_of_sections',
            mock_check_ordering_of_sections)
        create_branch_swap = self.swap(
            update_changelog_and_credits, 'create_branch', mock_create_branch)
        input_swap = self.swap(python_utils, 'INPUT', mock_input)
        get_repo_swap = self.swap(github.Github, 'get_repo', mock_get_repo)
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)

        with self.branch_name_swap, self.release_summary_swap, self.args_swap:
            with self.main_swap, self.getpass_swap, input_swap:
                with remove_updates_swap, update_authors_swap, open_tab_swap:
                    with update_changelog_swap, update_contributors_swap:
                        with update_developer_names_swap, check_order_swap:
                            with create_branch_swap, get_repo_swap:
                                update_changelog_and_credits.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
