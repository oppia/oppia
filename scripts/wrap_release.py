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

import getpass
import os
import re
import sys

import feconf

from . import common

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
    current_release_label = repo.get_label('PR: for current release')
    released_label = repo.get_label('PR: released')

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
        pr.remove_from_labels('PR: released')


def remove_blocking_bugs_milestone_from_issues(repo):
    """Removes blocking bug milestone from issues.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Raises:
        Exception: If there is an open issue with blocking bug milestone.
    """
    blocking_bug_milestone = repo.get_milestone(
        number=feconf.BLOCKING_BUG_MILESTONE_NUMBER)
    if blocking_bug_milestone.open_issues:
        raise Exception('%s blocking bugs are not resolved.' % (
            blocking_bug_milestone.open_issues))
    issues = repo.get_issues(milestone=blocking_bug_milestone, state='closed')
    for issue in issues:
        issue.edit(milestone=None)


def main():
    """Performs task to wrap up the release."""
    branch_name = common.get_current_branch_name()
    if not re.match(r'release-\d+\.\d+\.\d+$', branch_name):
        raise Exception(
            'This script should only be run from the latest release branch.')

    if not os.path.exists(feconf.RELEASE_SUMMARY_FILEPATH):
        raise Exception(
            'Release summary file %s is missing. Please run the '
            'release_info.py script and re-run this script.' % (
                feconf.RELEASE_SUMMARY_FILEPATH))

    personal_access_token = getpass.getpass(
        prompt=(
            'Please provide personal access token for your github ID. '
            'You can create one at https://github.com/settings/tokens: '))

    if personal_access_token is None:
        raise Exception(
            'No personal access token provided, please set up a personal '
            'access token at https://github.com/settings/tokens and re-run '
            'the script')
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')

    remove_blocking_bugs_milestone_from_issues(repo)
    remove_release_labels(repo)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
