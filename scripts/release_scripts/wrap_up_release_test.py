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

"""Unit tests for scripts/wrap_up_release.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import getpass
import os
import sys

from core.tests import test_utils
import release_constants
from scripts import common
from scripts.release_scripts import wrap_up_release

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position


class WrapReleaseTests(test_utils.GenericTestBase):
    """Test the methods for wrapping up the release."""

    def setUp(self):
        super(WrapReleaseTests, self).setUp()
        self.mock_repo = github.Repository.Repository(
            requester='', headers='', attributes={}, completed='')
        def mock_get_current_branch_name():
            return 'release-1.2.3'
        def mock_exists(unused_filepath):
            return True

        self.branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)

    def test_invalid_branch_name(self):
        def mock_get_current_branch_name():
            return 'invalid'
        branch_name_swap = self.swap(
            common, 'get_current_branch_name', mock_get_current_branch_name)
        with branch_name_swap, self.assertRaisesRegexp(
            Exception, (
                'This script should only be run from the latest release '
                'branch.')):
            wrap_up_release.main()

    def test_missing_release_summary_file(self):
        release_summary_swap = self.swap(
            release_constants, 'RELEASE_SUMMARY_FILEPATH', 'invalid.md')
        with self.branch_name_swap, release_summary_swap:
            with self.assertRaisesRegexp(
                Exception, (
                    'Release summary file invalid.md is missing. Please run '
                    'the release_info.py script and re-run this script.')):
                wrap_up_release.main()

    def test_missing_personal_access_token(self):
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return None
        # pylint: enable=unused-argument
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with self.branch_name_swap, self.exists_swap:
            with getpass_swap, self.assertRaisesRegexp(
                Exception, (
                    'No personal access token provided, please set up a '
                    'personal access token at https://github.com/settings/'
                    'tokens and re-run the script')):
                wrap_up_release.main()

    def test_closed_blocking_bugs_milestone_results_in_exception(self):
        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'state': 'closed'}, completed='')
        # pylint: enable=unused-argument
        get_milestone_swap = self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone)
        with get_milestone_swap, self.assertRaisesRegexp(
            Exception, 'The blocking bug milestone is closed.'):
            wrap_up_release.remove_blocking_bugs_milestone_from_issues(
                self.mock_repo)

    def test_non_zero_blocking_bugs_count_results_in_exception(self):
        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return github.Milestone.Milestone(
                requester='', headers='',
                attributes={'open_issues': 10, 'state': 'open'}, completed='')
        # pylint: enable=unused-argument
        def mock_open_tab(unused_url):
            pass
        get_milestone_swap = self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone)
        open_tab_swap = self.swap(
            common, 'open_new_tab_in_browser_if_possible', mock_open_tab)
        with get_milestone_swap, open_tab_swap, self.assertRaisesRegexp(
            Exception, '10 blocking bugs are not resolved.'):
            wrap_up_release.remove_blocking_bugs_milestone_from_issues(
                self.mock_repo)

    def test_blocking_bugs_milestone_removal(self):
        blocking_bug_milestone = github.Milestone.Milestone(
            requester='', headers='',
            attributes={'open_issues': 0, 'number': 1, 'state': 'open'},
            completed='')
        issue = github.Issue.Issue(
            requester='', headers='',
            attributes={'milestone': blocking_bug_milestone}, completed='')

        check_function_calls = {
            'edit_gets_called': False
        }
        expected_function_calls = {
            'edit_gets_called': True
        }

        # pylint: disable=unused-argument
        def mock_get_milestone(unused_self, number):
            return blocking_bug_milestone
        def mock_get_issues(unused_self, milestone, state):
            return [issue]
        def mock_edit(unused_self, milestone):
            check_function_calls['edit_gets_called'] = True
        # pylint: enable=unused-argument

        get_milestone_swap = self.swap(
            github.Repository.Repository, 'get_milestone', mock_get_milestone)
        get_issues_swap = self.swap(
            github.Repository.Repository, 'get_issues', mock_get_issues)
        edit_swap = self.swap(
            github.Issue.Issue, 'edit', mock_edit)
        with get_milestone_swap, get_issues_swap, edit_swap:
            wrap_up_release.remove_blocking_bugs_milestone_from_issues(
                self.mock_repo)
        self.assertEqual(check_function_calls, expected_function_calls)

    def test_unreleased_prs_result_in_exception(self):
        label_for_current_release_prs = github.Label.Label(
            requester='', headers='',
            attributes={
                'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS},
            completed='')
        label_for_released_prs = github.Label.Label(
            requester='', headers='',
            attributes={'name': release_constants.LABEL_FOR_RELEASED_PRS},
            completed='')
        pr_for_current_release = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={'label': label_for_current_release_prs, 'number': 7567},
            completed='')
        def mock_get_label(unused_self, name):
            if name == release_constants.LABEL_FOR_RELEASED_PRS:
                return label_for_released_prs
            else:
                return label_for_current_release_prs
        # pylint: disable=unused-argument
        def mock_get_issues(unused_self, state, labels):
            if labels[0].name == (
                    release_constants.LABEL_FOR_CURRENT_RELEASE_PRS):
                return [pr_for_current_release]
            else:
                return []
        # pylint: enable=unused-argument

        get_label_swap = self.swap(
            github.Repository.Repository, 'get_label', mock_get_label)
        get_issues_swap = self.swap(
            github.Repository.Repository, 'get_issues', mock_get_issues)

        with get_label_swap, get_issues_swap:
            with self.assertRaisesRegexp(
                Exception, 'Following PRs are not released: \\[7567\\].'):
                wrap_up_release.remove_release_labels(self.mock_repo)

    def test_label_removal_from_prs(self):
        label_for_current_release_prs = github.Label.Label(
            requester='', headers='',
            attributes={
                'name': release_constants.LABEL_FOR_CURRENT_RELEASE_PRS},
            completed='')
        label_for_released_prs = github.Label.Label(
            requester='', headers='',
            attributes={'name': release_constants.LABEL_FOR_RELEASED_PRS},
            completed='')
        released_pr = github.PullRequest.PullRequest(
            requester='', headers='',
            attributes={'label': label_for_released_prs, 'number': 7567},
            completed='')

        check_function_calls = {
            'remove_from_labels_gets_called': False
        }
        expected_function_calls = {
            'remove_from_labels_gets_called': True
        }

        def mock_get_label(unused_self, name):
            if name == release_constants.LABEL_FOR_RELEASED_PRS:
                return label_for_released_prs
            else:
                return label_for_current_release_prs
        # pylint: disable=unused-argument
        def mock_get_issues(unused_self, state, labels):
            if state == 'closed':
                return [released_pr]
            else:
                return []
        # pylint: enable=unused-argument
        def mock_remove_from_labels(unused_self, unused_name):
            check_function_calls['remove_from_labels_gets_called'] = True

        get_label_swap = self.swap(
            github.Repository.Repository, 'get_label', mock_get_label)
        get_issues_swap = self.swap(
            github.Repository.Repository, 'get_issues', mock_get_issues)
        remove_from_labels_swap = self.swap(
            github.PullRequest.PullRequest, 'remove_from_labels',
            mock_remove_from_labels)

        with get_label_swap, get_issues_swap, remove_from_labels_swap:
            wrap_up_release.remove_release_labels(self.mock_repo)
        self.assertEqual(check_function_calls, expected_function_calls)

    def test_function_calls(self):
        check_function_calls = {
            'remove_blocking_bugs_milestone_from_issues_gets_called': False,
            'remove_release_labels_gets_called': False,
        }
        expected_check_function_calls = {
            'remove_blocking_bugs_milestone_from_issues_gets_called': True,
            'remove_release_labels_gets_called': True,
        }
        def mock_remove_blocking_bugs_milestone_from_issues(unused_repo):
            check_function_calls[
                'remove_blocking_bugs_milestone_from_issues_gets_called'] = True
        def mock_remove_release_labels(unused_repo):
            check_function_calls['remove_release_labels_gets_called'] = True
        def mock_get_organization(unused_self, unused_name):
            return github.Organization.Organization(
                requester='', headers='', attributes={}, completed='')
        def mock_get_repo(unused_self, unused_org):
            return self.mock_repo
        # pylint: disable=unused-argument
        def mock_getpass(prompt):
            return 'test-token'
        # pylint: enable=unused-argument

        remove_blocking_bugs_milestone_from_issues_swap = self.swap(
            wrap_up_release, 'remove_blocking_bugs_milestone_from_issues',
            mock_remove_blocking_bugs_milestone_from_issues)
        remove_release_labels_swap = self.swap(
            wrap_up_release, 'remove_release_labels',
            mock_remove_release_labels)
        get_org_swap = self.swap(
            github.Github, 'get_organization', mock_get_organization)
        get_repo_swap = self.swap(
            github.Organization.Organization, 'get_repo', mock_get_repo)
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)

        with self.branch_name_swap, self.exists_swap, get_org_swap:
            with get_repo_swap, getpass_swap, remove_release_labels_swap:
                with remove_blocking_bugs_milestone_from_issues_swap:
                    wrap_up_release.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)
