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
(By providing the list of files to `scripts/pre_commit_linter.py`)
To install the hook manually simply execute this script from the oppia root dir
with the `--install` flag.
To bypass the validation upon `git push` use the following command:
`git push REMOTE BRANCH --no-verify`

This hook works only on Unix like systems as of now.
On Vagrant under Windows it will still copy the hook to the .git/hooks dir
but it will have no effect.
"""

# Pylint has issues with the import order of argparse.
# pylint: disable=wrong-import-order
import argparse
import collections
import os
import pprint
import shutil
import subprocess
import sys

# pylint: enable=wrong-import-order


GitRef = collections.namedtuple('GitRef', ['local_ref', 'local_sha1',
                                           'remote_ref', 'remote_sha1'])
FileDiff = collections.namedtuple('FileDiff', ['status', 'name'])

# git hash of /dev/null, refers to an 'empty' commit.
GIT_NULL_COMMIT = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

# caution, __file__ is here *OPPiA/.git/hooks* and not in *OPPIA/scripts*.
FILE_DIR = os.path.abspath(os.path.dirname(__file__))
OPPIA_DIR = os.path.join(FILE_DIR, os.pardir, os.pardir)
SCRIPTS_DIR = os.path.join(OPPIA_DIR, 'scripts')
LINTER_SCRIPT = 'pre_commit_linter.py'
LINTER_FILE_FLAG = '--files'
PYTHON_CMD = 'python'
FRONTEND_TEST_SCRIPT = 'run_frontend_tests.sh'
GIT_IS_DIRTY_CMD = 'git status --porcelain --untracked-files=no'


class ChangedBranch(object):
    def __init__(self, new_branch):
        get_branch_cmd = 'git symbolic-ref -q --short HEAD'.split()
        self.old_branch = subprocess.check_output(get_branch_cmd).strip()
        self.new_branch = new_branch
        self.is_same_branch = self.old_branch == self.new_branch

    def __enter__(self):
        if not self.is_same_branch:
            try:
                subprocess.check_output(['git', 'checkout', self.new_branch])
            except subprocess.CalledProcessError:
                print ('\nCould not change branch to %s. This is most probably '
                       'because you are in a dirty state. Change manually to '
                       'the branch that is being linted or stash your changes.'
                       % self.new_branch)
                sys.exit(1)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not self.is_same_branch:
            subprocess.check_output(['git', 'checkout', self.old_branch])


def _start_subprocess_for_result(cmd):
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def _git_diff_name_status(left, right, diff_filter=''):
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
    out, err = _start_subprocess_for_result(git_cmd)
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


def _compare_to_remote(remote, local_branch, remote_branch=None):
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
    return _git_diff_name_status(git_remote, local_branch)


def _extract_files_to_lint(file_diffs):
    """Grab only files out of a list of FileDiffs that have a ACMRT status."""
    if not file_diffs:
        return []
    lint_files = [f.name for f in file_diffs
                  if f.status.upper() in 'ACMRT']
    return lint_files


def _collect_files_being_pushed(ref_list, remote):
    """Collect modified files and filter those that need linting.
    Parameter:
        ref_list: list of references to parse (provided by git in stdin)
        remote: the remote being pushed to
    Returns:
        dict: Dict mapping branch names to 2-tuples of the form (list of
            changed files, list of files to lint)
    """
    if not ref_list:
        return {}
    # avoid testing of non branch pushes (tags for instance) or deletions.
    ref_heads_only = [ref for ref in ref_list
                      if ref.local_ref.startswith('refs/heads/')]
    # get branch name from e.g. local_ref='refs/heads/lint_hook'.
    branches = [ref.local_ref.split('/')[-1] for ref in ref_heads_only]
    hashes = [ref.local_sha1 for ref in ref_heads_only]
    remote_hashes = [ref.remote_sha1 for ref in ref_heads_only]
    collected_files = {}
    # git allows that multiple branches get pushed simultaneously with the "all"
    # flag. Therefore we need to loop over the ref_list provided.
    for branch, sha1, remote_sha1 in zip(branches, hashes, remote_hashes):
        # git reports the following for an empty / non existing branch
        # sha1: '0000000000000000000000000000000000000000'.
        if set(remote_sha1) != {'0'}:
            try:
                modified_files = _compare_to_remote(remote, branch)
            except ValueError as e:
                print e.message
                sys.exit(1)
        else:
            # Get the difference to origin/develop instead.
            try:
                modified_files = _compare_to_remote(remote, branch,
                                                    remote_branch='develop')
            except ValueError:
                # give up, return all files in repo.
                try:
                    modified_files = _git_diff_name_status(GIT_NULL_COMMIT,
                                                           sha1)
                except ValueError as e:
                    print e.message
                    sys.exit(1)
        files_to_lint = _extract_files_to_lint(modified_files)
        collected_files[branch] = (modified_files, files_to_lint)

    for branch, (modified_files, files_to_lint) in collected_files.iteritems():
        if modified_files:
            print '\nModified files in %s:' % branch
            pprint.pprint(modified_files)
            print '\nFiles to lint in %s:' % branch
            pprint.pprint(files_to_lint)
            print '\n'
    return collected_files


def _get_refs():
    # Git provides refs in STDIN.
    ref_list = [GitRef(*ref_str.split()) for ref_str in sys.stdin]
    if ref_list:
        print 'ref_list:'
        pprint.pprint(ref_list)
    return ref_list


def _start_linter(files):
    script = os.path.join(SCRIPTS_DIR, LINTER_SCRIPT)
    task = subprocess.Popen([PYTHON_CMD, script, LINTER_FILE_FLAG] + files)
    task.communicate()
    return task.returncode


def _start_sh_script(scriptname):
    cmd = ['bash', os.path.join(SCRIPTS_DIR, scriptname)]
    task = subprocess.Popen(cmd)
    task.communicate()
    return task.returncode


def _has_uncommitted_files():
    """Returns true if the repo contains modified files that are uncommitted.
    Ignores untracked files.
    """
    uncommitted_files = subprocess.check_output(GIT_IS_DIRTY_CMD.split(' '))
    return bool(len(uncommitted_files))


def _install_hook():
    # install script ensures that oppia is root.
    oppia_dir = os.getcwd()
    hooks_dir = os.path.join(oppia_dir, '.git', 'hooks')
    pre_push_file = os.path.join(hooks_dir, 'pre-push')
    if os.path.islink(pre_push_file):
        print 'Symlink already exists'
        return
    try:
        os.symlink(os.path.abspath(__file__), pre_push_file)
        print 'Created symlink in .git/hooks directory'
    # raises AttributeError on windows, OSError added as failsafe.
    except (OSError, AttributeError):
        shutil.copy(__file__, pre_push_file)
        print 'Copied file to .git/hooks directory'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('remote', nargs='?', help='provided by git before push')
    parser.add_argument('url', nargs='?', help='provided by git before push')
    parser.add_argument('--install', action='store_true', default=False,
                        help='Install pre_push_hook to the .git/hooks dir')
    args = parser.parse_args()
    remote = args.remote
    if args.install:
        _install_hook()
        sys.exit(0)
    refs = _get_refs()
    collected_files = _collect_files_being_pushed(refs, remote)
    # only interfere if we actually have something to lint (prevents annoyances)
    if collected_files and _has_uncommitted_files():
        print ('Your repo is in a dirty state which prevents the linting from'
               ' working.\nStash your changes or commit them.\n')
        sys.exit(1)
    for branch, (modified_files, files_to_lint) in collected_files.iteritems():
        with ChangedBranch(branch):
            if not modified_files and not files_to_lint:
                continue
            if files_to_lint:
                lint_status = _start_linter(files_to_lint)
                if lint_status != 0:
                    print 'Push failed, please correct the linting issues above'
                    sys.exit(1)
            frontend_status = _start_sh_script(FRONTEND_TEST_SCRIPT)
            if frontend_status != 0:
                print 'Push aborted due to failing frontend tests.'
                sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
