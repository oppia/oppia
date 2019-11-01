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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import shutil
import subprocess
import sys

sys.path.append(os.getcwd())
import python_utils  # isort:skip  # pylint: disable=wrong-import-position


def _install_hook():
    """Installs the pre_commit_hook script and makes it executable.
    It ensures that oppia/ is the root folder.

    Raises:
        ValueError if chmod command fails.
    """
    oppia_dir = os.getcwd()
    hooks_dir = os.path.join(oppia_dir, '.git', 'hooks')
    pre_commit_file = os.path.join(hooks_dir, 'pre-commit')
    chmod_cmd = ['chmod', '+x', pre_commit_file]
    if os.path.islink(pre_commit_file):
        python_utils.PRINT('Symlink already exists')
    else:
        try:
            os.symlink(os.path.abspath(__file__), pre_commit_file)
            python_utils.PRINT('Created symlink in .git/hooks directory')
        # Raises AttributeError on windows, OSError added as failsafe.
        except (OSError, AttributeError):
            shutil.copy(__file__, pre_commit_file)
            python_utils.PRINT('Copied file to .git/hooks directory')

    python_utils.PRINT('Making pre-commit hook file executable ...')
    _, err_chmod_cmd = _start_subprocess_for_result(chmod_cmd)

    if not err_chmod_cmd:
        python_utils.PRINT('pre-commit hook file is now executable!')
    else:
        raise ValueError(err_chmod_cmd)


def _start_subprocess_for_result(cmd):
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def _does_diff_include_package_lock_file():
    """Checks whether the diff includes package-lock.json.

    Returns:
        bool. Whether the diff includes package-lock.json.

    Raises:
        ValueError if git command fails.
    """

    git_cmd = ['git', 'diff', '--name-only', '--cached']
    out, err = _start_subprocess_for_result(git_cmd)

    if not err:
        files_changed = out.split('\n')
        return 'package-lock.json' in files_changed
    else:
        raise ValueError(err)


def _does_current_folder_contain_have_package_lock_file():
    """Checks whether package-lock.json exists in the current folder.

    Returns:
        bool. Whether the current folder includes package-lock.json.
    """
    return os.path.isfile('package-lock.json')


def main(args=None):
    """Main method for pre-commit hook that checks files added/modified
    in a commit.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('--install', action='store_true', default=False,
                        help='Install pre_commit_hook to the .git/hooks dir')
    args = parser.parse_args(args=args)
    if args.install:
        _install_hook()
        return

    python_utils.PRINT('Running pre-commit check for package-lock.json ...')
    if _does_diff_include_package_lock_file() and (
            _does_current_folder_contain_have_package_lock_file()):
        # The following message is necessary since there git commit aborts
        # quietly when the status is non-zero.
        python_utils.PRINT('-----------COMMIT ABORTED-----------')
        python_utils.PRINT(
            'Oppia utilize Yarn to manage node packages. Please delete '
            'package-lock.json, revert the changes in package.json, and use '
            'yarn to add, update, or delete the packages. For more information '
            'on how to use yarn, see https://yarnpkg.com/en/docs/usage.'
        )
        sys.exit(1)
    return


if __name__ == '__main__':
    main()
