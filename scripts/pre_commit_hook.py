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

"""Pre-commit hook that checks files added/modified in a commit.

To install the hook manually simply execute this script from the oppia root dir
with the `--install` flag.
To bypass the validation upon `git commit` use the following command:
`git commit --no-verify --am "<Your Commit Message>"`

This hook works only on Unix like systems as of now.
On Vagrant under Windows it will still copy the hook to the .git/hooks dir
but it will have no effect.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

from typing import Final, List, Optional, Tuple

# TODO(#15567): The order can be fixed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
sys.path.append(os.getcwd())
from scripts import common  # isort:skip # pylint: disable=wrong-import-position
from core import utils  # isort:skip # pylint: disable=wrong-import-position

FECONF_FILEPATH: Final = os.path.join('core', 'feconf.py')
CONSTANTS_FILEPATH: Final = os.path.join('.', 'assets', 'constants.ts')
RELEASE_CONSTANTS_FILEPATH: Final = os.path.join(
    '.', 'assets', 'release_constants.json')
KEYS_UPDATED_IN_FECONF: Final = [
    b'ADMIN_EMAIL_ADDRESS',
    b'SYSTEM_EMAIL_ADDRESS', b'NOREPLY_EMAIL_ADDRESS', b'CAN_SEND_EMAILS',
    b'CAN_SEND_EDITOR_ROLE_EMAILS', b'CAN_SEND_FEEDBACK_MESSAGE_EMAILS',
    b'CAN_SEND_SUBSCRIPTION_EMAILS', b'DEFAULT_EMAIL_UPDATES_PREFERENCE',
    b'REQUIRE_EMAIL_ON_MODERATOR_ACTION', b'EMAIL_SERVICE_PROVIDER',
    b'SYSTEM_EMAIL_NAME', b'MAILGUN_DOMAIN_NAME']
KEYS_UPDATED_IN_CONSTANTS: Final = [
    b'SITE_FEEDBACK_FORM_URL', b'FIREBASE_CONFIG_API_KEY',
    b'FIREBASE_CONFIG_APP_ID', b'FIREBASE_CONFIG_AUTH_DOMAIN',
    b'FIREBASE_CONFIG_MESSAGING_SENDER_ID', b'FIREBASE_CONFIG_PROJECT_ID',
    b'FIREBASE_CONFIG_STORAGE_BUCKET', b'FIREBASE_CONFIG_GOOGLE_CLIENT_ID']


def install_hook() -> None:
    """Installs the pre_commit_hook script and makes it executable.
    It ensures that oppia/ is the root folder.

    Raises:
        ValueError. If chmod command fails.
    """
    oppia_dir = os.getcwd()
    hooks_dir = os.path.join(oppia_dir, '.git', 'hooks')
    pre_commit_file = os.path.join(hooks_dir, 'pre-commit')
    chmod_cmd = ['chmod', '+x', pre_commit_file]
    file_is_symlink = os.path.islink(pre_commit_file)
    file_exists = os.path.exists(pre_commit_file)
    if file_is_symlink and file_exists:
        print('Symlink already exists')
    else:
        # This is needed, because otherwise some systems symlink/copy the .pyc
        # file instead of the .py file.
        this_file = __file__.replace('pyc', 'py')
        # If its a broken symlink, delete it.
        if file_is_symlink and not file_exists:
            os.unlink(pre_commit_file)
            print('Removing broken symlink')
        try:
            os.symlink(os.path.abspath(this_file), pre_commit_file)
            print('Created symlink in .git/hooks directory')
        # Raises AttributeError on windows, OSError added as failsafe.
        except (OSError, AttributeError):
            shutil.copy(this_file, pre_commit_file)
            print('Copied file to .git/hooks directory')

    print('Making pre-commit hook file executable ...')
    if not common.is_windows_os():
        _, err_chmod_cmd = start_subprocess_for_result(chmod_cmd)

        if not err_chmod_cmd:
            print('pre-commit hook file is now executable!')
        else:
            raise ValueError(err_chmod_cmd)


def start_subprocess_for_result(cmd: List[str]) -> Tuple[bytes, bytes]:
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def does_diff_include_package_lock_file() -> bool:
    """Checks whether the diff includes package-lock.json.

    Returns:
        bool. Whether the diff includes package-lock.json.

    Raises:
        ValueError. If git command fails.
    """

    git_cmd = ['git', 'diff', '--name-only', '--cached']
    out, err = start_subprocess_for_result(git_cmd)

    if not err:
        files_changed = out.split(b'\n')
        return b'package-lock.json' in files_changed
    else:
        raise ValueError(err)


def does_current_folder_contain_have_package_lock_file() -> bool:
    """Checks whether package-lock.json exists in the current folder.

    Returns:
        bool. Whether the current folder includes package-lock.json.
    """
    return os.path.isfile('package-lock.json')


def check_changes(filetype: str) -> bool:
    """Checks if diff in feconf or constants file includes
    changes made for release.

    Args:
        filetype: str. The file to check - feconf or constants.

    Returns:
        bool. Whether the diff includes changes made for release.
    """
    if filetype == 'feconf':
        filepath = FECONF_FILEPATH
        keys_to_check = [b'%s = ' % key for key in KEYS_UPDATED_IN_FECONF]
    elif filetype == 'constants':
        filepath = CONSTANTS_FILEPATH
        keys_to_check = [b'"%s": ' % key for key in KEYS_UPDATED_IN_CONSTANTS]
    else:
        return True

    diff_output = subprocess.check_output([
        'git', 'diff', filepath])[:-1].split(b'\n')
    for line in diff_output:
        if (line.startswith(b'-') or line.startswith(b'+')) and any(
                key in line for key in keys_to_check):
            return False
    return True


def check_changes_in_config() -> None:
    """Checks whether feconf and assets have changes made for release
    deployment.

    Raises:
        Exception. There are deployment changes in feconf or constants filepath.
    """
    if not check_changes('feconf'):
        raise Exception(
            'Changes to %s made for deployment cannot be committed.' % (
                FECONF_FILEPATH))

    if not check_changes('constants'):
        raise Exception(
            'Changes to %s made for deployment cannot be committed.' % (
                CONSTANTS_FILEPATH))


def check_changes_in_gcloud_path() -> None:
    """Checks that the gcloud path in common.py matches with the path in
    release_constants.json.

    Raises:
        Exception. The gcloud path in common.py does not match with the path
            in release_constants.json.
    """
    with utils.open_file(RELEASE_CONSTANTS_FILEPATH, 'r') as f:
        release_constants_gcloud_path = json.loads(f.read())['GCLOUD_PATH']

    if not (
            os.path.exists(release_constants_gcloud_path) and
            os.path.samefile(release_constants_gcloud_path, common.GCLOUD_PATH)
    ):
        raise Exception(
            'The gcloud path in common.py: %s should match the path in '
            'release_constants.json: %s. Please fix.' % (
                common.GCLOUD_PATH, release_constants_gcloud_path))


def main(args: Optional[List[str]] = None) -> None:
    """Main method for pre-commit hook that checks files added/modified
    in a commit.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--install', action='store_true', default=False,
        help='Install pre_commit_hook to the .git/hooks dir')
    parsed_args = parser.parse_args(args=args)
    if parsed_args.install:
        install_hook()
        return

    print('Running pre-commit check for feconf and constants ...')
    check_changes_in_config()
    print('Running pre-commit check for gcloud path changes...')
    check_changes_in_gcloud_path()
    print('Running pre-commit check for package-lock.json ...')
    if does_diff_include_package_lock_file() and (
            does_current_folder_contain_have_package_lock_file()):
        # The following message is necessary since there git commit aborts
        # quietly when the status is non-zero.
        print('-----------COMMIT ABORTED-----------')
        print(
            'Oppia utilize Yarn to manage node packages. Please delete '
            'package-lock.json, revert the changes in package.json, and use '
            'yarn to add, update, or delete the packages. For more information '
            'on how to use yarn, see https://yarnpkg.com/en/docs/usage.'
        )
        sys.exit(1)
    return


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when pre_commit_hook.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
