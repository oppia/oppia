#!/usr/bin/env python
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Script that performs task to wrap up the release."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

import python_utils
import release_constants
from scripts import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position


def remove_release_labels(repo):
    """Removes PR: released labels from PRs.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Raises:
        Exception: If any PR is not released.
    """
    current_release_label = repo.get_label(
        release_constants.LABEL_FOR_CURRENT_RELEASE_PRS)
    released_label = repo.get_label(release_constants.LABEL_FOR_RELEASED_PRS)

    current_release_prs = list(repo.get_issues(
        state='all', labels=[current_release_label])) + list(
            repo.get_issues(
                state='open', labels=[released_label]))

    if current_release_prs:
        raise Exception(
            'Following PRs are not released: %s.' % (
                [pr.number for pr in current_release_prs]))

    released_prs = repo.get_issues(state='closed', labels=[released_label])
    for pr in released_prs:
        pr.remove_from_labels(release_constants.LABEL_FOR_RELEASED_PRS)
        python_utils.PRINT('Label removed from PR: #%s' % pr.number)


def remove_blocking_bugs_milestone_from_issues(repo):
    """Removes blocking bug milestone from issues.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Raises:
        Exception: If there is an open issue with blocking bug milestone.
    """
    blocking_bugs_milestone = repo.get_milestone(
        number=release_constants.BLOCKING_BUG_MILESTONE_NUMBER)
    if blocking_bugs_milestone.state == 'closed':
        raise Exception('The blocking bug milestone is closed.')
    if blocking_bugs_milestone.open_issues:
        common.open_new_tab_in_browser_if_possible(
            'https://github.com/oppia/oppia/issues?q=is%3Aopen+'
            'is%3Aissue+milestone%3A%22Blocking+bugs%22')
        raise Exception('%s blocking bugs are not resolved.' % (
            blocking_bugs_milestone.open_issues))
    issues = repo.get_issues(milestone=blocking_bugs_milestone, state='closed')
    for issue in issues:
        issue.edit(milestone=None)


def main():
    """Performs task to wrap up the release."""
    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'This script should only be run from the latest release branch.')

    if not os.path.exists(release_constants.RELEASE_SUMMARY_FILEPATH):
        raise Exception(
            'Release summary file %s is missing. Please run the '
            'release_info.py script and re-run this script.' % (
                release_constants.RELEASE_SUMMARY_FILEPATH))
    personal_access_token = common.get_personal_access_token()
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')

    remove_blocking_bugs_milestone_from_issues(repo)
    remove_release_labels(repo)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when wrap_up_release.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
