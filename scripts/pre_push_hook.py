#!/usr/bin/env python
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Pre-push hook that executes the Python/JS linters on all files that
deviate from develop.
(By providing the list of files to `scripts.pre_commit_linter`)
To install the hook manually simply execute this script from the oppia root dir
with the `--install` flag.
To bypass the validation upon `git push` use the following command:
`git push REMOTE BRANCH --no-verify`

This hook works only on Unix like systems as of now.
On Vagrant under Windows it will still copy the hook to the .git/hooks dir
but it will have no effect.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import collections
import os
import pprint
import shutil
import subprocess
import sys

# `pre_push_hook.py` is symlinked into `/.git/hooks`, so we explicitly import
# the current working directory so that Git knows where to find python_utils.
sys.path.append(os.getcwd())
import python_utils  # isort:skip  # pylint: disable=wrong-import-position

GitRef = collections.namedtuple(
    'GitRef', ['local_ref', 'local_sha1', 'remote_ref', 'remote_sha1'])
FileDiff = collections.namedtuple('FileDiff', ['status', 'name'])

# Git hash of /dev/null, refers to an 'empty' commit.
GIT_NULL_COMMIT = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

# CAUTION: __file__ is here *OPPIA/.git/hooks* and not in *OPPIA/scripts*.
LINTER_MODULE = 'scripts.pre_commit_linter'
FILE_DIR = os.path.abspath(os.path.dirname(__file__))
OPPIA_DIR = os.path.join(FILE_DIR, os.pardir, os.pardir)
LINTER_FILE_FLAG = '--files'
PYTHON_CMD = 'python'
OPPIA_PARENT_DIR = os.path.join(FILE_DIR, os.pardir, os.pardir, os.pardir)
NPM_CMD = os.path.join(
    OPPIA_PARENT_DIR, 'oppia_tools', 'node-10.15.3', 'bin', 'npm')
YARN_CMD = os.path.join(
    OPPIA_PARENT_DIR, 'oppia_tools', 'yarn-v1.17.3', 'bin', 'yarn')
FRONTEND_TEST_SCRIPT = 'run_frontend_tests'
GIT_IS_DIRTY_CMD = 'git status --porcelain --untracked-files=no'


class ChangedBranch(python_utils.OBJECT):
    """Context manager class that changes branch when there are modified files
    that need to be linted. It does not change branch when modified files are
    not committed.
    """
    def __init__(self, new_branch):
        get_branch_cmd = 'git symbolic-ref -q --short HEAD'.split()
        self.old_branch = subprocess.check_output(get_branch_cmd).strip()
        self.new_branch = new_branch
        self.is_same_branch = self.old_branch == self.new_branch

    def __enter__(self):
        if not self.is_same_branch:
            try:
                subprocess.check_output(
                    ['git', 'checkout', self.new_branch, '--'])
            except subprocess.CalledProcessError:
                python_utils.PRINT(
                    '\nCould not change branch to %s. This is most probably '
                    'because you are in a dirty state. Change manually to '
                    'the branch that is being linted or stash your changes.'
                    % self.new_branch)
                sys.exit(1)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not self.is_same_branch:
            subprocess.check_output(['git', 'checkout', self.old_branch, '--'])


def start_subprocess_for_result(cmd):
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def get_remote_name():
    """Get the remote name of the local repository.

    Returns:
        str. The remote name of the local repository.
    """
    remote_name = ''
    remote_num = 0
    get_remotes_name_cmd = 'git remote'.split()
    task = subprocess.Popen(get_remotes_name_cmd, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    out, err = task.communicate()
    remotes = python_utils.UNICODE(out)[:-1].split('\n')
    if not err:
        for remote in remotes:
            get_remotes_url_cmd = (
                'git config --get remote.%s.url' % remote).split()
            task = subprocess.Popen(get_remotes_url_cmd, stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE)
            remote_url, err = task.communicate()
            if not err:
                if remote_url.endswith('oppia/oppia.git\n'):
                    remote_num += 1
                    remote_name = remote
            else:
                raise ValueError(err)
    else:
        raise ValueError(err)

    if not remote_num:
        raise Exception(
            'Error: Please set upstream for the lint checks to run '
            'efficiently. To do that follow these steps:\n'
            '1. Run the command \'git remote -v\'\n'
            '2a. If upstream is listed in the command output, then run the '
            'command \'git remote set-url upstream '
            'https://github.com/oppia/oppia.git\'\n'
            '2b. If upstream is not listed in the command output, then run the '
            'command \'git remote add upstream '
            'https://github.com/oppia/oppia.git\'\n'
        )
    elif remote_num > 1:
        python_utils.PRINT(
            'Warning: Please keep only one remote branch for oppia:develop '
            'to run the lint checks efficiently.\n')
        return
    return remote_name


def git_diff_name_status(left, right, diff_filter=''):
    """Compare two branches/commits etc with git.
    Parameter:
        left: the lefthand comperator
        right: the righthand comperator
        diff_filter: arguments given to --diff-filter (ACMRTD...)
    Returns:
        List of FileDiffs (tuple with name/status)
    Raises:
        ValueError if git command fails.
    """
    git_cmd = ['git', 'diff', '--name-status']
    if diff_filter:
        git_cmd.append('--diff-filter={}'.format(diff_filter))
    git_cmd.extend([left, right])
    # Append -- to avoid conflicts between branch and directory name.
    # More here: https://stackoverflow.com/questions/26349191
    git_cmd.append('--')
    out, err = start_subprocess_for_result(git_cmd)
    if not err:
        file_list = []
        for line in out.splitlines():
            # The lines in the output generally look similar to these:
            #
            #   A\tfilename
            #   M\tfilename
            #   R100\toldfilename\tnewfilename
            #
            # We extract the first char (indicating the status), and the string
            # after the last tab character.
            file_list.append(FileDiff(line[0], line[line.rfind('\t') + 1:]))
        return file_list
    else:
        raise ValueError(err)


def compare_to_remote(remote, local_branch, remote_branch=None):
    """Compare local with remote branch with git diff.
    Parameter:
        remote: Git remote being pushed to
        local_branch: Git branch being pushed to
        remote_branch: The branch on the remote to test against. If None same
            as local branch.
    Returns:
        List of file names that are modified, changed, renamed or added
        but not deleted
    Raises:
        ValueError if git command fails.
    """
    remote_branch = remote_branch if remote_branch else local_branch
    git_remote = '%s/%s' % (remote, remote_branch)
    # Ensure that references to the remote branches exist on the local machine.
    start_subprocess_for_result(['git', 'pull', remote])
    return git_diff_name_status(git_remote, local_branch)


def extract_files_to_lint(file_diffs):
    """Grab only files out of a list of FileDiffs that have a ACMRT status."""
    if not file_diffs:
        return []
    lint_files = [f.name for f in file_diffs
                  if f.status.upper() in 'ACMRT']
    return lint_files


def collect_files_being_pushed(ref_list, remote):
    """Collect modified files and filter those that need linting.
    Parameter:
        ref_list: list of references to parse (provided by git in stdin)
        remote: the remote being pushed to
    Returns:
        dict: Dict mapping branch names to 2-tuples of the form (list of
            changed files, list of files to lint).
    """
    if not ref_list:
        return {}
    # Avoid testing of non branch pushes (tags for instance) or deletions.
    ref_heads_only = [ref for ref in ref_list
                      if ref.local_ref.startswith('refs/heads/')]
    # Get branch name from e.g. local_ref='refs/heads/lint_hook'.
    branches = [ref.local_ref.split('/')[-1] for ref in ref_heads_only]
    hashes = [ref.local_sha1 for ref in ref_heads_only]
    collected_files = {}
    # Git allows that multiple branches get pushed simultaneously with the "all"
    # flag. Therefore we need to loop over the ref_list provided.
    for branch, _ in python_utils.ZIP(branches, hashes):
        # Get the difference to remote/develop.
        modified_files = compare_to_remote(
            remote, branch, remote_branch='develop')
        files_to_lint = extract_files_to_lint(modified_files)
        collected_files[branch] = (modified_files, files_to_lint)

    for branch, (modified_files, files_to_lint) in collected_files.items():
        if modified_files:
            python_utils.PRINT('\nModified files in %s:' % branch)
            pprint.pprint(modified_files)
            python_utils.PRINT('\nFiles to lint in %s:' % branch)
            pprint.pprint(files_to_lint)
            python_utils.PRINT('\n')
    return collected_files


def get_refs():
    """Returns the ref list taken from STDIN."""
    # Git provides refs in STDIN.
    ref_list = [GitRef(*ref_str.split()) for ref_str in sys.stdin]
    if ref_list:
        python_utils.PRINT('ref_list:')
        pprint.pprint(ref_list)
    return ref_list


def start_linter(files):
    """Starts the lint checks and returns the returncode of the task."""
    task = subprocess.Popen(
        [PYTHON_CMD, '-m', LINTER_MODULE, LINTER_FILE_FLAG] + files)
    task.communicate()
    return task.returncode


def start_python_script(scriptname):
    """Runs the 'start.py' script and returns the returncode of the task."""
    cmd = [
        'python', '-m',
        os.path.join('scripts', scriptname).replace('/', '.')]
    task = subprocess.Popen(cmd)
    task.communicate()
    task.wait()
    return task.returncode


def has_uncommitted_files():
    """Returns true if the repo contains modified files that are uncommitted.
    Ignores untracked files.
    """
    uncommitted_files = subprocess.check_output(GIT_IS_DIRTY_CMD.split(' '))
    return bool(len(uncommitted_files))


def install_hook():
    """Installs the pre_push_hook script and makes it executable.
    It ensures that oppia/ is the root folder.

    Raises:
        ValueError if chmod command fails.
    """
    oppia_dir = os.getcwd()
    hooks_dir = os.path.join(oppia_dir, '.git', 'hooks')
    pre_push_file = os.path.join(hooks_dir, 'pre-push')
    chmod_cmd = ['chmod', '+x', pre_push_file]
    if os.path.islink(pre_push_file):
        python_utils.PRINT('Symlink already exists')
    else:
        try:
            os.symlink(os.path.abspath(__file__), pre_push_file)
            python_utils.PRINT('Created symlink in .git/hooks directory')
        # Raises AttributeError on windows, OSError added as failsafe.
        except (OSError, AttributeError):
            shutil.copy(__file__, pre_push_file)
            python_utils.PRINT('Copied file to .git/hooks directory')

    python_utils.PRINT('Making pre-push hook file executable ...')
    _, err_chmod_cmd = start_subprocess_for_result(chmod_cmd)

    if not err_chmod_cmd:
        python_utils.PRINT('pre-push hook file is now executable!')
    else:
        raise ValueError(err_chmod_cmd)


def does_diff_include_js_or_ts_files(files_to_lint):
    """Returns true if diff includes JavaScript or TypeScript files.

    Args:
        files_to_lint: list(str). List of files to be linted.

    Returns:
        bool. Whether the diff contains changes in any JavaScript or TypeScript
            files.
    """

    for filename in files_to_lint:
        if filename.endswith('.ts') or filename.endswith('.js'):
            return True
    return False


def main(args=None):
    """Main method for pre-push hook that executes the Python/JS linters on all
    files that deviate from develop.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('remote', nargs='?', help='provided by git before push')
    parser.add_argument('url', nargs='?', help='provided by git before push')
    parser.add_argument('--install', action='store_true', default=False,
                        help='Install pre_push_hook to the .git/hooks dir')
    args = parser.parse_args(args=args)
    if args.install:
        install_hook()
        return

    remote = get_remote_name()
    remote = remote if remote else args.remote
    refs = get_refs()
    collected_files = collect_files_being_pushed(refs, remote)
    # Only interfere if we actually have something to lint (prevent annoyances).
    if collected_files and has_uncommitted_files():
        python_utils.PRINT(
            'Your repo is in a dirty state which prevents the linting from'
            ' working.\nStash your changes or commit them.\n')
        sys.exit(1)
    for branch, (modified_files, files_to_lint) in collected_files.items():
        with ChangedBranch(branch):
            if not modified_files and not files_to_lint:
                continue
            if files_to_lint:
                lint_status = start_linter(files_to_lint)
                if lint_status != 0:
                    python_utils.PRINT(
                        'Push failed, please correct the linting issues above.')
                    sys.exit(1)
            frontend_status = 0
            if does_diff_include_js_or_ts_files(files_to_lint):
                frontend_status = start_python_script(FRONTEND_TEST_SCRIPT)
            if frontend_status != 0:
                python_utils.PRINT(
                    'Push aborted due to failing frontend tests.')
                sys.exit(1)
    return


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when pre_push_hook.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
