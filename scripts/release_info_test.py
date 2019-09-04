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


class ReleaseInfoTests(test_utils.GenericTestBase):
    """Test the methods for generation of release summary."""
    def setUp(self):
        super(ReleaseInfoTests, self).setUp()
        def mock_get_current_branch_name():
            return 'release-1.2.3'
        def mock_open_browser(unused_url):
            pass
        def mock_get_organization(unused_self, unused_name):
            return github.Organization.Organization(
                requester='', headers='', attributes={}, completed='')
        def mock_get_repo(unused_self, unused_org):
            return github.Repository.Repository(
                requester='', headers='', attributes={}, completed='')
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

    def test_ordering_of_sections(self):
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
            old_log1 = release_info.Log('sha3', 'author3', 'email3', 'message3')
            if stop == 'HEAD':
                return [new_log1, new_log2, old_log1]
            else:
                return [old_log1]
        def mock_extract_issues(unused_logs):
            return {}
        def mock_check_versions(unused_current_release):
            return []
        def mock_check_setup_scripts(unused_base_release_tag):
            return []
        def mock_check_storage_models(unused_current_release):
            return []
        def mock_extract_pr_numbers(unused_logs):
            return []
        def mock_get_prs_from_pr_numbers(unused_pr_numbers, unused_repo):
            return []
        def mock_get_changelog_categories(unused_pulls):
            return []

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
        with python_utils.open_file(tmp_file.name, 'r') as f:
            update_changelog_and_credits.check_ordering_of_sections(
                f.readlines())
