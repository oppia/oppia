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

"""Helper script used for creating a new release branch on GitHub.

ONLY RELEASE COORDINATORS SHOULD USE THIS SCRIPT.

Usage: Run this script from your oppia root folder:

    python scripts/cut_release_branch.py --version="x.y.z"

where x.y.z is the new version of Oppia, e.g. 2.5.3.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib

import common  # pylint: disable=relative-import


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

PARSED_ARGS = _PARSER.parse_args()
if PARSED_ARGS.new_version:
    TARGET_VERSION = PARSED_ARGS.new_version
else:
    raise Exception('ERROR: A "new_version" arg must be specified.')

# Construct the new branch name.
NEW_BRANCH_NAME = 'release-%s' % TARGET_VERSION
NEW_APP_YAML_VERSION = TARGET_VERSION.replace('.', '-')
assert '.' not in NEW_APP_YAML_VERSION


def _verify_target_branch_does_not_already_exist(remote_alias):
    """Checks that the new release branch doesn't already exist locally or
    remotely.

    Args:
        remote_alias: str. The alias that points to the remote oppia
            repository. Example: When calling git remote -v, you get:
            upstream    https://github.com/oppia/oppia.git (fetch),
            where 'upstream' is the alias that points to the remote oppia
            repository.

    Raises:
        Exception: The target branch name already exists locally.
        Exception: The target branch name already exists on the remote
            oppia repository.
    """

    git_branch_output = subprocess.check_output(['git', 'branch'])
    if NEW_BRANCH_NAME in git_branch_output:
        raise Exception(
            'ERROR: The target branch name already exists locally. '
            'Run "git branch -D %s" to delete it.' % NEW_BRANCH_NAME)
    git_ls_remote_output = subprocess.check_output(
        ['git', 'ls-remote', '--heads', remote_alias])
    remote_branch_ref = 'refs/heads/%s' % NEW_BRANCH_NAME
    if remote_branch_ref in git_ls_remote_output:
        raise Exception(
            'ERROR: The target branch name already exists on the remote repo.')


def _verify_target_version_is_consistent_with_latest_released_version():
    """Checks that the target version is consistent with the latest released
    version on GitHub.

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
    response = urllib.urlopen(
        'https://api.github.com/repos/oppia/oppia/releases/latest')
    if response.getcode() != 200:
        raise Exception(
            'ERROR: Failed to fetch latest release info from GitHub')

    data = json.load(response)
    latest_release_tag_name = data['tag_name']

    match_result = re.match(r'v(\d)\.(\d)\.(\d)', latest_release_tag_name)
    if match_result is None:
        raise Exception(
            'ERROR: Could not parse version number of latest GitHub release.')
    prev_major, prev_minor, prev_patch = match_result.group(1, 2, 3)

    match_result = re.match(r'(\d)\.(\d)\.(\d)', TARGET_VERSION)
    curr_major, curr_minor, curr_patch = match_result.group(1, 2, 3)

    # This will need to be overridden if the major version changes.
    assert prev_major == curr_major, 'Unexpected major version change.'
    if prev_minor == curr_minor:
        assert int(curr_patch) == int(prev_patch) + 1
        assert int(curr_patch) < 10
    else:
        assert int(curr_minor) == int(prev_minor) + 1
        assert int(curr_patch) == 0


def _execute_branch_cut():
    """Pushes the new release branch to Github.

    Raises:
         AssertionError: 'version: default' was not found in app.yaml.
    """
    # Do prerequisite checks.
    common.require_cwd_to_be_oppia()
    common.verify_local_repo_is_clean()
    common.verify_current_branch_name('develop')

    # Update the local repo.
    remote_alias = common.get_remote_alias('https://github.com/oppia/oppia')
    subprocess.call(['git', 'pull', remote_alias])

    _verify_target_branch_does_not_already_exist(remote_alias)
    _verify_target_version_is_consistent_with_latest_released_version()

    # The release coordinator should verify that tests are passing on develop
    # before checking out the release branch.
    common.open_new_tab_in_browser_if_possible(
        'https://github.com/oppia/oppia#oppia---')
    while True:
        print (
            'Please confirm: are Travis checks passing on develop? (y/n) ')
        answer = raw_input().lower()
        if answer in ['y', 'ye', 'yes']:
            break
        elif answer:
            print (
                'Tests should pass on develop before this script is run. '
                'Exiting.')
            sys.exit()

    # Cut a new release branch.
    print 'Cutting a new release branch: %s' % NEW_BRANCH_NAME
    subprocess.call(['git', 'checkout', '-b', NEW_BRANCH_NAME])

    # Update the version in app.yaml.
    print 'Updating the version number in app.yaml ...'
    with open('app.yaml', 'r') as f:
        content = f.read()
        assert content.count('version: default') == 1
    os.remove('app.yaml')
    content = content.replace(
        'version: default', 'version: %s' % NEW_APP_YAML_VERSION)
    with open('app.yaml', 'w+') as f:
        f.write(content)
    print 'Version number updated.'

    # Make a commit.
    print 'Committing the change.'
    subprocess.call([
        'git', 'commit', '-a', '-m',
        '"Update version number to %s"' % TARGET_VERSION])

    # Push the new release branch to GitHub.
    print 'Pushing new release branch to GitHub.'
    subprocess.call(['git', 'push', remote_alias, NEW_BRANCH_NAME])

    print ''
    print (
        'New release branch successfully cut. You are now on branch %s' %
        NEW_BRANCH_NAME)
    print 'Done!'


if __name__ == '__main__':
    _execute_branch_cut()
