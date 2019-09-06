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

"""Unit tests for scripts/release_info.py."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import getpass
import os
import sys
import tempfile

from core.tests import test_utils
import feconf
import python_utils

from . import common
from . import release_info
from . import update_changelog_and_credits

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')

GENERATED_RELEASE_SUMMARY_FILEPATH = os.path.join(
    RELEASE_TEST_DIR, 'generated_release_summary.md')
MOCK_FECONF_FILEPATH = os.path.join(RELEASE_TEST_DIR, 'feconf.txt')


class ReleaseInfoTests(test_utils.GenericTestBase):
    """Test the methods for generation of release summary."""
    def setUp(self):
        super(ReleaseInfoTests, self).setUp()
        self.mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_get_current_branch_name():
            return 'release-1.2.3'
        def mock_open_browser(unused_url):
            pass
        def mock_get_organization(unused_self, unused_name):
            return github.Organization.Organization(
                requester='', headers='', attributes={}, completed='')
        def mock_get_repo(unused_self, unused_org):
            return self.mock_repo
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return 'test-token'
        # pylint: enable=unused-argument

        self.branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        self.open_browser_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_browser)
        self.get_organization_swap = self.swap(
            github.Github, 'get_organization', mock_get_organization)
        self.get_repo_swap = self.swap(
            github.Organization.Organization, 'get_repo', mock_get_repo)
        self.getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

    def test_invalid_branch_name(self):
        def mock_get_current_branch_name():
            return 'invalid'
        branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with branch_name_swap, self.assertRaisesRegexp(
            Exception, (
                'This script should only be run from the latest release '
                'branch.')):
            release_info.main()

    def test_missing_personal_access_token(self):
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return None
        # pylint: enable=unused-argument
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with self.branch_name_swap:
            with getpass_swap, self.assertRaisesRegexp(
                Exception, (
                    'No personal access token provided, please set up a '
                    'personal access token at https://github.com/settings/'
                    'tokens and re-run the script')):
                release_info.main()

    def test_non_zero_blocking_bugs_count_results_in_exception(self):
        def mock_get_blocking_bug_issue_count(unused_repo):
            return 10
        blocking_bug_swap = self.swap(
            release_info, 'get_blocking_bug_issue_count',
            mock_get_blocking_bug_issue_count)
        with self.branch_name_swap, self.open_browser_swap:
            with self.get_organization_swap, self.get_repo_swap:
                with self.getpass_swap, blocking_bug_swap:
                    with self.assertRaisesRegexp(
                        Exception, (
                            'There are 10 unresolved blocking bugs. Please '
                            'ensure that they are resolved before release '
                            'summary generation.')):
                        release_info.main()

    def test_unreleased_prs_result_in_exception(self):
        def mock_get_blocking_bug_issue_count(unused_repo):
            return 0
        def mock_check_prs_for_current_release_are_released(unused_repo):
            return False
        blocking_bug_swap = self.swap(
            release_info, 'get_blocking_bug_issue_count',
            mock_get_blocking_bug_issue_count)
        check_prs_swap = self.swap(
            release_info, 'check_prs_for_current_release_are_released',
            mock_check_prs_for_current_release_are_released)
        with self.branch_name_swap, self.open_browser_swap:
            with self.get_organization_swap, self.get_repo_swap:
                with self.getpass_swap, blocking_bug_swap, check_prs_swap:
                    with self.assertRaisesRegexp(
                        Exception, (
                            'There are PRs for current release which do not '
                            'have a \'PR: released\' label. Please ensure that '
                            'they are released before release summary '
                            'generation.')):
                        release_info.main()

    def test_get_current_version_tag(self):
        def mock_get_tags(unused_self):
            return ['tags']
        with self.swap(github.Repository.Repository, 'get_tags', mock_get_tags):
            tags = release_info.get_current_version_tag(self.mock_repo)
        self.assertEqual(tags, 'tags')

    def test_get_extra_commits_in_new_release(self):
        def mock_run_cmd(unused_cmd):
            return '+ sha1 commit1\n+ sha2 commit2\n- sha3 commit3'
        def mock_get_commit(unused_self, sha):
            return sha
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        get_commit_swap = self.swap(
            github.Repository.Repository, 'get_commit', mock_get_commit)
        with run_cmd_swap, get_commit_swap:
            actual_commits = release_info.get_extra_commits_in_new_release(
                'base_commit', self.mock_repo)
        self.assertEqual(actual_commits, ['sha1', 'sha2'])

    def test_gather_logs_with_no_logs(self):
        def mock_run_cmd(unused_cmd):
            return ''
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        with run_cmd_swap:
            actual_logs = release_info.gather_logs('start')
        self.assertEqual(actual_logs, [])

    def test_gather_logs_with_logs(self):
        def mock_run_cmd(unused_cmd):
            log1 = 'sha1{0}author1{0}email1{0}msg1'.format(
                release_info.GROUP_SEP)
            log2 = 'sha2{0}author2{0}email2{0}msg2'.format(
                release_info.GROUP_SEP)
            return '%s\x00%s' % (log1, log2)
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        with run_cmd_swap:
            actual_logs = release_info.gather_logs('start')
        expected_logs = [
            release_info.Log('sha1', 'author1', 'email1', 'msg1'),
            release_info.Log('sha2', 'author2', 'email2', 'msg2')]
        self.assertEqual(actual_logs, expected_logs)

    def test_extract_issues(self):
        log1 = release_info.Log('sha1', 'author1', 'email1', 'msg#1234')
        log2 = release_info.Log('sha2', 'author2', 'email2', 'msg#6789')
        log3 = release_info.Log('sha2', 'author2', 'email2', 'msg(#4588)')
        log4 = release_info.Log('sha2', 'author2', 'email2', 'msg1')
        actual_issues = release_info.extract_issues([log1, log2, log3, log4])
        expected_issues = {
            'https://github.com/oppia/oppia/issues/1234',
            'https://github.com/oppia/oppia/issues/4588',
            'https://github.com/oppia/oppia/issues/6789'}
        self.assertEqual(actual_issues, expected_issues)

    def test_extract_pr_numbers(self):
        log1 = release_info.Log('sha1', 'author1', 'email1', 'msg(#1234)')
        log2 = release_info.Log('sha2', 'author2', 'email2', 'msg#6789')
        log3 = release_info.Log('sha2', 'author2', 'email2', 'msg(#4588)')
        log4 = release_info.Log('sha2', 'author2', 'email2', 'msg1')
        actual_prs = release_info.extract_pr_numbers([log1, log2, log3, log4])
        expected_prs = ['4588', '1234']
        self.assertEqual(actual_prs, expected_prs)

    def test_get_prs_from_pr_numbers(self):
        def mock_get_pull(unused_self, pull_num):
            return 'pull-%s' % pull_num
        with self.swap(github.Repository.Repository, 'get_pull', mock_get_pull):
            actual_prs = release_info.get_prs_from_pr_numbers(
                ['1234', '4588'], self.mock_repo)
        expected_prs = ['pull-1234', 'pull-4588']
        self.assertEqual(set(actual_prs), set(expected_prs))

    def test_get_changelog_categories(self):
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': 'CHANGELOG: Test-changes-1'},
                    {'name': 'Test-label'}]}, completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': 'CHANGELOG: Test-changes-1'}]}, completed='')
        pull3 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR3', 'number': 3, 'labels': [
                    {'name': 'CHANGELOG: Test-changes-2'}]}, completed='')
        pull4 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR4', 'number': 4,
                'labels': [{'name': 'Test-label'}]}, completed='')
        actual_categories = release_info.get_changelog_categories([
            pull1, pull2, pull3, pull4])
        expected_categories = {
            'Test-changes-1': ['PR1 (#1)', 'PR2 (#2)'],
            'Test-changes-2': ['PR3 (#3)'],
            'Uncategorized': ['PR4 (#4)']}
        self.assertEqual(actual_categories, expected_categories)

    def test_check_versions_with_no_diff(self):
        def mock_run_cmd(unused_cmd):
            return (
                'CURRENT_STATE_SCHEMA_VERSION = 3'
                '\nCURRENT_COLLECTION_SCHEMA_VERSION = 4\n')
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        feconf_swap = self.swap(
            release_info, 'FECONF_FILEPATH', MOCK_FECONF_FILEPATH)
        with run_cmd_swap, feconf_swap:
            actual_version_changes = release_info.check_versions(
                'current_release')
        self.assertEqual(actual_version_changes, [])

    def test_check_versions_with_diff(self):
        def mock_run_cmd(unused_cmd):
            return (
                'CURRENT_STATE_SCHEMA_VERSION = 8'
                '\nCURRENT_COLLECTION_SCHEMA_VERSION = 4\n')
        run_cmd_swap = self.swap(common, 'run_cmd', mock_run_cmd)
        feconf_swap = self.swap(
            release_info, 'FECONF_FILEPATH', MOCK_FECONF_FILEPATH)
        with run_cmd_swap, feconf_swap:
            actual_version_changes = release_info.check_versions(
                'current_release')
        self.assertEqual(
            actual_version_changes, ['CURRENT_STATE_SCHEMA_VERSION'])

    def test_check_setup_scripts_to_get_changed_scripts_status(self):
        def mock_run_cmd(unused_cmd):
            return 'scripts/setup.sh\nscripts/setup_gae.sh'
        with self.swap(common, 'run_cmd', mock_run_cmd):
            actual_scripts = release_info.check_setup_scripts(
                'release_tag')
        expected_scripts = {
            'scripts/setup.sh': True,
            'scripts/setup_gae.sh': True
        }
        self.assertEqual(actual_scripts, expected_scripts)

    def test_check_setup_scripts_to_get_all_scripts_status(self):
        def mock_run_cmd(unused_cmd):
            return 'scripts/setup.sh\nscripts/setup_gae.sh'
        with self.swap(common, 'run_cmd', mock_run_cmd):
            actual_scripts = release_info.check_setup_scripts(
                'release_tag', changed_only=False)
        expected_scripts = {
            'scripts/setup.sh': True,
            'scripts/setup_gae.sh': True,
            'scripts/install_third_party.sh': False,
            'scripts/install_third_party.py': False
        }
        self.assertEqual(actual_scripts, expected_scripts)

    def test_check_storage_models(self):
        def mock_run_cmd(unused_cmd):
            return (
                'scripts/setup.sh\nextensions/test.ts\n'
                'core/storage/activity/gae_models.py\n'
                'core/storage/user/gae_models.py')
        with self.swap(common, 'run_cmd', mock_run_cmd):
            actual_storgae_models = release_info.check_storage_models(
                'current_release')
        expected_storage_models = [
            'core/storage/activity/gae_models.py',
            'core/storage/user/gae_models.py']
        self.assertEqual(actual_storgae_models, expected_storage_models)

    def test_get_blocking_bug_issue_count(self):
        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'open_issues': 10}, completed='')
        # pylint: enable=unused-argument
        with self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone):
            self.assertEqual(
                release_info.get_blocking_bug_issue_count(self.mock_repo),
                10)

    def test_check_prs_for_current_release_are_released_with_no_unreleased_prs(
            self):
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': 'PR: released'},
                    {'name': 'PR: for current release'}]}, completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': 'PR: released'},
                    {'name': 'PR: for current release'}]}, completed='')
        # pylint: disable=unused-argument
        def mock_get_pulls(unused_self, state):
            return [pull1, pull2]
        # pylint: enable=unused-argument
        with self.swap(
            github.Repository.Repository, 'get_pulls', mock_get_pulls):
            self.assertEqual(
                release_info.check_prs_for_current_release_are_released(
                    self.mock_repo), True)

    def test_check_prs_for_current_release_are_released_with_unreleased_prs(
            self):
        pull1 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR1', 'number': 1, 'labels': [
                    {'name': 'PR: for current release'}]}, completed='')
        pull2 = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={
                'title': 'PR2', 'number': 2, 'labels': [
                    {'name': 'PR: released'},
                    {'name': 'PR: for current release'}]}, completed='')
        # pylint: disable=unused-argument
        def mock_get_pulls(unused_self, state):
            return [pull1, pull2]
        # pylint: enable=unused-argument
        with self.swap(
            github.Repository.Repository, 'get_pulls', mock_get_pulls):
            self.assertEqual(
                release_info.check_prs_for_current_release_are_released(
                    self.mock_repo), False)

    def test_release_summary_content(self):
        def mock_get_blocking_bug_issue_count(unused_repo):
            return 0
        def mock_check_prs_for_current_release_are_released(unused_repo):
            return True
        def mock_get_current_version_tag(unused_repo):
            return github.Tag.Tag(
                requester='', headers='',
                attributes={'commit': {'sha': 'sha'}}, completed='')
        def mock_get_extra_commits_in_new_release(
                unused_base_commit, unused_repo):
            return [
                github.Commit.Commit(
                    requester='', headers='', attributes={'sha': 'sha1'},
                    completed=''),
                github.Commit.Commit(
                    requester='', headers='', attributes={'sha': 'sha2'},
                    completed=''),
                github.Commit.Commit(
                    requester='', headers='', attributes={'sha': 'sha3'},
                    completed='')]
        def mock_gather_logs(unused_start, stop='HEAD'):
            new_log1 = release_info.Log('sha1', 'author1', 'email1', 'message1')
            new_log2 = release_info.Log('sha2', 'author2', 'email2', 'message2')
            old_log = release_info.Log('sha3', 'author3', 'email3', 'message3')
            cherrypick_log = release_info.Log(
                'sha4', 'author4', 'email4', 'message4')
            if stop == 'HEAD':
                return [new_log1, new_log2, old_log, cherrypick_log]
            else:
                return [old_log]
        def mock_extract_issues(unused_logs):
            return {'issues'}
        def mock_check_versions(unused_current_release):
            return ['version_change']
        def mock_check_setup_scripts(unused_base_release_tag):
            return {'setup_changes': True}
        def mock_check_storage_models(unused_current_release):
            return ['storage_changes']
        def mock_extract_pr_numbers(unused_logs):
            return []
        def mock_get_prs_from_pr_numbers(unused_pr_numbers, unused_repo):
            return []
        def mock_get_changelog_categories(unused_pulls):
            return {'category': ['pr1', 'pr2']}

        blocking_bug_swap = self.swap(
            release_info, 'get_blocking_bug_issue_count',
            mock_get_blocking_bug_issue_count)
        check_prs_swap = self.swap(
            release_info, 'check_prs_for_current_release_are_released',
            mock_check_prs_for_current_release_are_released)
        version_tag_swap = self.swap(
            release_info, 'get_current_version_tag',
            mock_get_current_version_tag)
        extra_commits_swap = self.swap(
            release_info, 'get_extra_commits_in_new_release',
            mock_get_extra_commits_in_new_release)
        gather_logs_swap = self.swap(
            release_info, 'gather_logs', mock_gather_logs)
        extract_issues_swap = self.swap(
            release_info, 'extract_issues', mock_extract_issues)
        check_versions_swap = self.swap(
            release_info, 'check_versions', mock_check_versions)
        setup_scripts_swap = self.swap(
            release_info, 'check_setup_scripts', mock_check_setup_scripts)
        storage_models_swap = self.swap(
            release_info, 'check_storage_models', mock_check_storage_models)
        extract_prs_swap = self.swap(
            release_info, 'extract_pr_numbers', mock_extract_pr_numbers)
        get_prs_swap = self.swap(
            release_info, 'get_prs_from_pr_numbers',
            mock_get_prs_from_pr_numbers)
        get_changelog_swap = self.swap(
            release_info, 'get_changelog_categories',
            mock_get_changelog_categories)

        tmp_file = tempfile.NamedTemporaryFile()
        release_summary_swap = self.swap(
            feconf, 'RELEASE_SUMMARY_FILEPATH', tmp_file.name)

        with self.branch_name_swap, self.open_browser_swap:
            with self.get_organization_swap, self.get_repo_swap:
                with self.getpass_swap, blocking_bug_swap, check_prs_swap:
                    with version_tag_swap, extra_commits_swap, get_prs_swap:
                        with gather_logs_swap, extract_issues_swap:
                            with check_versions_swap, setup_scripts_swap:
                                with storage_models_swap, release_summary_swap:
                                    with get_changelog_swap, extract_prs_swap:
                                        release_info.main()
        with python_utils.open_file(
            GENERATED_RELEASE_SUMMARY_FILEPATH, 'r') as f:
            expected_lines = f.readlines()
        with python_utils.open_file(tmp_file.name, 'r') as f:
            actual_lines = f.readlines()
        update_changelog_and_credits.check_ordering_of_sections(actual_lines)
        self.assertEqual(actual_lines, expected_lines)
