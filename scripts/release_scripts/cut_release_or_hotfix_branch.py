# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Helper script used for creating a new release or hotfix branch on GitHub.

ONLY RELEASE COORDINATORS SHOULD USE THIS SCRIPT.

Usage: Run this script from your oppia root folder:

For release branch:

    python -m scripts.cut_release_or_hotfix_branch --version="x.y.z"

where x.y.z is the new version of Oppia, e.g. 2.5.3. The generated branch
name will be release-x.y.z, e.g. release-2.5.3.

For hotfix branch:

    python -m scripts.cut_release_or_hotfix_branch --version="x.y.z"
    --hotfix_number=d

where x.y.z is the new version of Oppia, e.g. 2.5.3,
d is number of the hotfix being created, e.g. 1. The generated branch
name will be release-x.y.z-hotfix-d, e.g. release-2.5.3-hotfix-1.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import json
import re
import subprocess
import sys

import python_utils
import release_constants
from scripts import common


def new_version_type(arg, pattern=re.compile(r'\d\.\d\.\d')):
    """Checks that the new version name matches the expected pattern.

    Args:
        arg: str. The new version name.
        pattern: RegularExpression. The pattern that release version should
            match.

    Raises:
        argparse.ArgumentTypeError: The new version name does not match
            the pattern.

    Returns:
        str. The new version name with correct pattern.
    """
    if not pattern.match(arg):
        raise argparse.ArgumentTypeError(
            'The format of "new_version" should be: x.x.x')
    return arg


_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--new_version', help='new version to be released', type=new_version_type)
_PARSER.add_argument('--hotfix_number', default=0)


def verify_target_branch_does_not_already_exist(remote_alias, new_branch_name):
    """Checks that the new release branch doesn't already exist locally or
    remotely.

    Args:
        remote_alias: str. The alias that points to the remote oppia
            repository. Example: When calling git remote -v, you get:
            upstream    https://github.com/oppia/oppia.git (fetch),
            where 'upstream' is the alias that points to the remote oppia
            repository.
        new_branch_name: str. The name of the new branch to cut.

    Raises:
        Exception: The target branch name already exists locally.
        Exception: The target branch name already exists on the remote
            oppia repository.
    """

    git_branch_output = subprocess.check_output(['git', 'branch'])
    if new_branch_name in git_branch_output:
        raise Exception(
            'ERROR: The target branch name already exists locally. '
            'Run "git branch -D %s" to delete it.' % new_branch_name)
    git_ls_remote_output = subprocess.check_output(
        ['git', 'ls-remote', '--heads', remote_alias])
    remote_branch_ref = 'refs/heads/%s' % new_branch_name
    if remote_branch_ref in git_ls_remote_output:
        raise Exception(
            'ERROR: The target branch name already exists on the remote repo.')


def verify_target_version_compatible_with_latest_release(
        target_version):
    """Checks that the target version is consistent with the latest released
    version on GitHub.

    Args:
        target_version: str. The release version.

    Raises:
        Exception: Failed to fetch latest release info from GitHub.
        Exception: Could not parse version number of latest GitHub release.
        AssertionError: The previous and the current major version are not the
            same.
        AssertionError: The current patch version is not equal to previous patch
            version plus one.
        AssertionError: The current patch version is greater or equal to 10.
        AssertionError: The current minor version is not equal to previous
            minor version plus one.
        AssertionError: The current patch version is different than 0.
    """
    response = python_utils.url_open(
        'https://api.github.com/repos/oppia/oppia/releases/latest')
    if response.getcode() != 200:
        raise Exception(
            'ERROR: Failed to fetch latest release info from GitHub.')

    data = json.load(response)
    latest_release_tag_name = data['tag_name']

    match_result = re.match(r'v(\d)\.(\d)\.(\d)', latest_release_tag_name)
    if match_result is None:
        raise Exception(
            'ERROR: Could not parse version number of latest GitHub release.')
    prev_major, prev_minor, prev_patch = match_result.group(1, 2, 3)

    match_result = re.match(r'(\d)\.(\d)\.(\d)', target_version)
    curr_major, curr_minor, curr_patch = match_result.group(1, 2, 3)

    # This will need to be overridden if the major version changes.
    assert prev_major == curr_major, 'Unexpected major version change.'
    if prev_minor == curr_minor:
        assert int(curr_patch) == int(prev_patch) + 1
    else:
        assert int(curr_minor) == int(prev_minor) + 1
        assert int(curr_patch) == 0


def verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
        remote_alias, target_version, hotfix_number):
    """Checks that the hotfix number is one ahead of previous hotfix
    number.

    Args:
        remote_alias: str. The alias that points to the remote oppia
            repository. Example: When calling git remote -v, you get:
            upstream    https://github.com/oppia/oppia.git (fetch),
            where 'upstream' is the alias that points to the remote oppia
            repository.
        target_version: str. The release version.
        hotfix_number: int. The number for the hotfix branch.

    Raises:
        Exception: The difference between two continuous hotfix numbers
             is not one.
    """
    all_branches = subprocess.check_output([
        'git', 'branch', '-a'])[:-1].split('\n')

    last_hotfix_number = 0
    release_branch_exists = False
    hotfix_branch_name_regex = '^%s/release-%s-hotfix-\\d*$' % (
        remote_alias, target_version)
    for branch_name in all_branches:
        branch_name = branch_name.lstrip().rstrip()
        if branch_name == '%s/release-%s' % (
                remote_alias, target_version):
            release_branch_exists = True
        if re.match(hotfix_branch_name_regex, branch_name):
            branch_hotfix_number = int(branch_name[branch_name.rfind('-') + 1:])
            if branch_hotfix_number > last_hotfix_number:
                last_hotfix_number = branch_hotfix_number

    assert release_branch_exists
    assert hotfix_number == last_hotfix_number + 1


def _get_release_branch_type_and_name(target_version):
    """Returns type and name of release branch for a target version.

    Args:
        target_version: str. The release version.

    Returns:
        tuple(str, str). The type and name of release branch.
    """
    return (
        release_constants.BRANCH_TYPE_RELEASE, 'release-%s' % target_version)


def _get_hotfix_branch_type_and_name(target_version, hotfix_number):
    """Returns type and name of hotfix branch for a target version.

    Args:
        target_version: str. The release version.
        hotfix_number: int. The number for the hotfix branch.

    Returns:
        tuple(str, str). The type and name of hotfix branch.
    """
    return (
        release_constants.BRANCH_TYPE_HOTFIX, 'release-%s-hotfix-%s' % (
            target_version, hotfix_number))


def execute_branch_cut():
    """Pushes the new release branch to Github."""

    parsed_args = _PARSER.parse_args()
    if parsed_args.new_version:
        target_version = parsed_args.new_version
    else:
        raise Exception('ERROR: A "new_version" arg must be specified.')

    # Construct the new branch name.
    hotfix_number = int(parsed_args.hotfix_number)
    if not hotfix_number:
        new_branch_type, new_branch_name = _get_release_branch_type_and_name(
            target_version)
    else:
        new_branch_type, new_branch_name = _get_hotfix_branch_type_and_name(
            target_version, hotfix_number)

    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    common.verify_local_repo_is_clean()
    common.verify_current_branch_name('develop')

    # Update the local repo.
    remote_alias = common.get_remote_alias(release_constants.REMOTE_URL)
    subprocess.check_call(['git', 'pull', remote_alias, 'develop'])

    verify_target_branch_does_not_already_exist(remote_alias, new_branch_name)

    # The release coordinator should verify that tests are passing on develop
    # before checking out the release branch.
    common.open_new_tab_in_browser_if_possible(
        'https://github.com/oppia/oppia#oppia----')
    while True:
        if not hotfix_number:
            branch_to_check = 'develop'
        elif hotfix_number == 1:
            branch_to_check = 'release-%s' % target_version
        else:
            branch_to_check = 'release-%s-hotfix-%s' % (
                target_version, hotfix_number - 1)
        python_utils.PRINT(
            'Please confirm: are Travis checks passing on %s? (y/n) ' % (
                branch_to_check))
        answer = python_utils.INPUT().lower()
        if answer in release_constants.AFFIRMATIVE_CONFIRMATIONS:
            break
        elif answer:
            python_utils.PRINT(
                'Tests should pass on %s before this script is run. '
                'Exiting.' % branch_to_check)
            sys.exit()

    # Cut a new release or hotfix branch.
    if new_branch_type == release_constants.BRANCH_TYPE_HOTFIX:
        verify_hotfix_number_is_one_ahead_of_previous_hotfix_number(
            remote_alias, target_version, hotfix_number)
        if hotfix_number == 1:
            branch_to_cut_from = 'release-%s' % target_version
        else:
            branch_to_cut_from = 'release-%s-hotfix-%s' % (
                target_version, hotfix_number - 1)
        python_utils.PRINT('Cutting a new hotfix branch: %s' % new_branch_name)
        subprocess.check_call([
            'git', 'checkout', '-b', new_branch_name, branch_to_cut_from])
    else:
        verify_target_version_compatible_with_latest_release(
            target_version)
        python_utils.PRINT('Cutting a new release branch: %s' % new_branch_name)
        subprocess.check_call(['git', 'checkout', '-b', new_branch_name])

    # Push the new release branch to GitHub.
    python_utils.PRINT('Pushing new %s branch to GitHub.' % new_branch_type)
    subprocess.check_call(['git', 'push', remote_alias, new_branch_name])

    python_utils.PRINT('')
    python_utils.PRINT(
        'New %s branch successfully cut. You are now on branch %s' % (
            new_branch_type, new_branch_name))
    python_utils.PRINT('Done!')

    common.ask_user_to_confirm(
        'Ask Sean (or Ben, if Sean isn\'t available) to create '
        'a new branch protection rule by:\n'
        '1. Going to this page: https://github.com/oppia/oppia/'
        'settings/branch_protection_rules/new.\n'
        '2. Typing in the full branch name %s.\n'
        '3. Checking the box: Restrict who can push to matching '
        'branches (then add the oppia/release-coordinators team)\n' % (
            new_branch_name))


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when cut_release_or_hotfix_branch.py is used as a
# script.
if __name__ == '__main__': # pragma: no cover
    execute_branch_cut()
