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
(By providing the list of files to `scripts.linters.run_lint_checks`)
To install the hook manually simply execute this script from the oppia root dir
with the `--install` flag.
To bypass the validation upon `git push` use the following command:
`git push REMOTE BRANCH --no-verify`

This hook works only on Unix like systems as of now.
On Vagrant under Windows it will still copy the hook to the .git/hooks dir
but it will have no effect.
"""

from __future__ import annotations

import argparse
import collections
import os
import pprint
import re
import shutil
import subprocess
import sys

from types import TracebackType
from typing import Dict, Final, List, Optional, Tuple, Type

# `pre_push_hook.py` is symlinked into `/.git/hooks`, so we explicitly import
# the current working directory so that Git knows where to find python_utils.
sys.path.append(os.getcwd())
from scripts import common  # isort:skip  # pylint: disable=wrong-import-position
from scripts import install_python_prod_dependencies # isort:skip  # pylint: disable=wrong-import-position

GitRef = collections.namedtuple(
    'GitRef', ['local_ref', 'local_sha1', 'remote_ref', 'remote_sha1'])
FileDiff = collections.namedtuple('FileDiff', ['status', 'name'])

# Git hash of /dev/null, refers to an 'empty' commit.
GIT_NULL_COMMIT: Final = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

# CAUTION: __file__ is here *OPPIA/.git/hooks* and not in *OPPIA/scripts*.
LINTER_MODULE: Final = 'scripts.linters.run_lint_checks'
MYPY_TYPE_CHECK_MODULE: Final = 'scripts.run_mypy_checks'
FILE_DIR: Final = os.path.abspath(os.path.dirname(__file__))
OPPIA_DIR: Final = os.path.join(FILE_DIR, os.pardir, os.pardir)
LINTER_FILE_FLAG: Final = '--files'
PYTHON_CMD: Final = 'python'
OPPIA_PARENT_DIR: Final = os.path.join(
    FILE_DIR, os.pardir, os.pardir, os.pardir
)
FRONTEND_TEST_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.run_frontend_tests', '--check_coverage']
BACKEND_ASSOCIATED_TEST_FILE_CHECK_CMD: Final = [
    PYTHON_CMD, '-m', 'scripts.check_backend_associated_test_file']
CI_PROTRACTOR_CHECK_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.check_e2e_tests_are_captured_in_ci']
TYPESCRIPT_CHECKS_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.run_typescript_checks']
STRICT_TYPESCRIPT_CHECKS_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.run_typescript_checks', '--strict_checks']
GIT_IS_DIRTY_CMD: Final = 'git status --porcelain --untracked-files=no'


class ChangedBranch:
    """Context manager class that changes branch when there are modified files
    that need to be linted. It does not change branch when modified files are
    not committed.
    """

    def __init__(self, new_branch: str) -> None:
        get_branch_cmd = 'git symbolic-ref -q --short HEAD'.split()
        self.old_branch = subprocess.check_output(
            get_branch_cmd, encoding='utf-8'
        ).strip()
        self.new_branch = new_branch
        self.is_same_branch = self.old_branch == self.new_branch

    def __enter__(self) -> None:
        if not self.is_same_branch:
            try:
                subprocess.check_output(
                    ['git', 'checkout', self.new_branch, '--'], encoding='utf-8'
                )
            except subprocess.CalledProcessError:
                print(
                    '\nCould not change branch to %s. This is most probably '
                    'because you are in a dirty state. Change manually to '
                    'the branch that is being linted or stash your changes.'
                    % self.new_branch)
                sys.exit(1)

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> None:
        if not self.is_same_branch:
            subprocess.check_output(
                ['git', 'checkout', self.old_branch, '--'], encoding='utf-8'
            )


def start_subprocess_for_result(cmd: List[str]) -> Tuple[bytes, bytes]:
    """Starts subprocess and returns (stdout, stderr)."""
    task = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def get_remote_name() -> Optional[bytes]:
    """Get the remote name of the local repository.

    Returns:
        Optional[bytes]. The remote name of the local repository.

    Raises:
        ValueError. Subprocess failed to start.
        Exception. Upstream not set.
    """
    remote_name = b''
    remote_num = 0
    get_remotes_name_cmd = 'git remote'.split()
    task = subprocess.Popen(
        get_remotes_name_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = task.communicate()
    remotes = out[:-1].split(b'\n')
    if not err:
        for remote in remotes:
            get_remotes_url_cmd = (
                b'git config --get remote.%s.url' % remote).split()
            task = subprocess.Popen(
                get_remotes_url_cmd, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE)
            remote_url, err = task.communicate()
            if not err:
                if remote_url.endswith(b'oppia/oppia.git\n'):
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

    if remote_num > 1:
        print(
            'Warning: Please keep only one remote branch for oppia:develop '
            'to run the lint checks efficiently.\n')
        return None
    return remote_name


def git_diff_name_status(
    left: str, right: str, diff_filter: str = ''
) -> List[FileDiff]:
    """Compare two branches/commits with git.

    Parameter:
        left: str. The name of the lefthand branch.
        right: str. The name of the righthand branch.
        diff_filter: str. Arguments given to --diff-filter (ACMRTD...).

    Returns:
        list. List of FileDiffs (tuple with name/status).

    Raises:
        ValueError. Raise ValueError if git command fails.
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
            file_list.append(
                FileDiff(bytes([line[0]]), line[line.rfind(b'\t') + 1:]))
        return file_list
    else:
        raise ValueError(err)


def get_merge_base(branch: str, other_branch: str) -> str:
    """Returns the most-recent commit shared by both branches. Order doesn't
    matter.

    The commit returned is the same one used on GitHub's UI for comparing pull
    requests.

    Args:
        branch: str. A branch name or commit hash.
        other_branch: str. A branch name or commit hash.

    Returns:
        str. The common commit hash shared by both branches.

    Raises:
        ValueError. An error occurred in the git command.
    """
    merge_base, err = start_subprocess_for_result(
        ['git', 'merge-base', branch, other_branch])
    if err:
        raise ValueError(err)

    return merge_base.decode('utf-8').strip()


def compare_to_remote(
    remote: str, local_branch: str, remote_branch: Optional[str] = None
) -> List[FileDiff]:
    """Compare local with remote branch with git diff.

    Parameter:
        remote: str. Name of the git remote being pushed to.
        local_branch: str. Name of the git branch being pushed to.
        remote_branch: str|None. The name of the branch on the remote
            to test against. If None, the remote branch is considered
            to be the same as the local branch.

    Returns:
        list(FileDiff). List of FileDiffs that are modified, changed,
        renamed or added but not deleted.

    Raises:
        ValueError. Raise ValueError if git command fails.
    """
    remote_branch = remote_branch if remote_branch else local_branch
    git_remote = '%s/%s' % (remote, remote_branch)
    # Ensure that references to the remote branches exist on the local machine.
    start_subprocess_for_result(['git', 'pull', remote])
    # Only compare differences to the merge base of the local and remote
    # branches (what GitHub shows in the files tab of pull requests).
    return git_diff_name_status(
        get_merge_base(git_remote, local_branch), local_branch)


def extract_files_to_lint(file_diffs: List[FileDiff]) -> List[bytes]:
    """Grab only files out of a list of FileDiffs that have a ACMRT status."""
    if not file_diffs:
        return []
    lint_files = [f.name for f in file_diffs if f.status in b'ACMRT']
    return lint_files


def get_parent_branch_name_for_diff() -> str:
    """Returns remote branch name against which the diff has to be checked.

    Returns:
        str. The name of the remote branch.
    """
    if common.is_current_branch_a_hotfix_branch():
        return 'release-%s' % common.get_current_release_version_number(
            common.get_current_branch_name())
    return 'develop'


def collect_files_being_pushed(
    ref_list: List[GitRef], remote: str
) -> Dict[str, Tuple[List[FileDiff], List[bytes]]]:
    """Collect modified files and filter those that need linting.

    Parameter:
        ref_list: list of references to parse (provided by git in stdin)
        remote: str. The name of the remote being pushed to.

    Returns:
        dict. Dict mapping branch names to 2-tuples of the form (list of
        changed files, list of files to lint).
    """
    if not ref_list:
        return {}
    # Avoid testing of non branch pushes (tags for instance) or deletions.
    # TODO(#11620): Change the following to a denylist instead of an allowlist.
    ref_heads_only = [
        ref for ref in ref_list
        if (ref.local_ref.startswith('refs/heads/') or ref.local_ref == 'HEAD')]
    # Get branch name from e.g. local_ref='refs/heads/lint_hook'.
    branches = [ref.local_ref.split('/')[-1] for ref in ref_heads_only]
    hashes = [ref.local_sha1 for ref in ref_heads_only]
    collected_files = {}
    # Git allows that multiple branches get pushed simultaneously with the "all"
    # flag. Therefore we need to loop over the ref_list provided.
    for branch, _ in zip(branches, hashes):
        # Get the difference to remote/develop.
        modified_files = compare_to_remote(
            remote, branch, remote_branch=get_parent_branch_name_for_diff())
        files_to_lint = extract_files_to_lint(modified_files)
        collected_files[branch] = (modified_files, files_to_lint)

    for branch, (modified_files, files_to_lint) in collected_files.items():
        if modified_files:
            print('\nModified files in %s:' % branch)
            pprint.pprint(modified_files)
            print('\nFiles to lint in %s:' % branch)
            pprint.pprint(files_to_lint)
            print('\n')
    return collected_files


def get_refs() -> List[GitRef]:
    """Returns the ref list taken from STDIN."""
    # Git provides refs in STDIN.
    ref_list = [GitRef(*ref_str.split()) for ref_str in sys.stdin]
    if ref_list:
        print('ref_list:')
        pprint.pprint(ref_list)
    return ref_list


def start_linter(files: List[bytes]) -> int:
    """Starts the lint checks and returns the returncode of the task."""
    cmd_list: List[str] = [
        PYTHON_CMD, '-m', LINTER_MODULE, LINTER_FILE_FLAG
    ]
    for file in files:
        cmd_list.append(file.decode('utf-8'))
    task = subprocess.Popen(cmd_list)
    task.communicate()
    return task.returncode


def execute_mypy_checks() -> int:
    """Executes the mypy type checks.

    Returns:
        int. The return code from mypy checks.
    """
    task = subprocess.Popen(
        [PYTHON_CMD, '-m', MYPY_TYPE_CHECK_MODULE, '--skip-install'])
    task.communicate()
    return task.returncode


def run_script_and_get_returncode(cmd_list: List[str]) -> int:
    """Runs script and returns the returncode of the task.

    Args:
        cmd_list: list(str). The cmd list containing the command to be run.

    Returns:
        int. The return code from the task executed.
    """
    task = subprocess.Popen(cmd_list)
    task.communicate()
    task.wait()
    return task.returncode


def has_uncommitted_files() -> bool:
    """Returns true if the repo contains modified files that are uncommitted.
    Ignores untracked files.
    """
    uncommitted_files = subprocess.check_output(
        GIT_IS_DIRTY_CMD.split(' '), encoding='utf-8'
    )
    return bool(len(uncommitted_files))


def install_hook() -> None:
    """Installs the pre_push_hook script and makes it executable.
    It ensures that oppia/ is the root folder.

    Raises:
        ValueError. Raise ValueError if chmod command fails.
    """
    oppia_dir = os.getcwd()
    hooks_dir = os.path.join(oppia_dir, '.git', 'hooks')
    pre_push_file = os.path.join(hooks_dir, 'pre-push')
    chmod_cmd = ['chmod', '+x', pre_push_file]
    file_is_symlink = os.path.islink(pre_push_file)
    file_exists = os.path.exists(pre_push_file)
    if file_is_symlink and file_exists:
        print('Symlink already exists')
    else:
        # If its a broken symlink, delete it.
        if file_is_symlink and not file_exists:
            os.unlink(pre_push_file)
            print('Removing broken symlink')
        try:
            os.symlink(os.path.abspath(__file__), pre_push_file)
            print('Created symlink in .git/hooks directory')
        # Raises AttributeError on windows, OSError added as failsafe.
        except (OSError, AttributeError):
            shutil.copy(__file__, pre_push_file)
            print('Copied file to .git/hooks directory')

    print('Making pre-push hook file executable ...')
    _, err_chmod_cmd = start_subprocess_for_result(chmod_cmd)

    if not err_chmod_cmd:
        print('pre-push hook file is now executable!')
    else:
        raise ValueError(err_chmod_cmd)


def does_diff_include_js_or_ts_files(diff_files: List[bytes]) -> bool:
    """Returns true if diff includes JavaScript or TypeScript files.

    Args:
        diff_files: list(bytes). List of files changed.

    Returns:
        bool. Whether the diff contains changes in any JavaScript or TypeScript
        files.
    """

    for file_path in diff_files:
        if file_path.endswith(b'.ts') or file_path.endswith(b'.js'):
            return True
    return False


def does_diff_include_ts_files(diff_files: List[bytes]) -> bool:
    """Returns true if diff includes TypeScript files.

    Args:
        diff_files: list(bytes). List of files changed.

    Returns:
        bool. Whether the diff contains changes in any TypeScript files.
    """

    for file_path in diff_files:
        if file_path.endswith(b'.ts'):
            return True
    return False


def does_diff_include_ci_config_or_js_files(diff_files: List[bytes]) -> bool:
    """Returns true if diff includes CI config or Javascript files.

    Args:
        diff_files: list(bytes). List of files changed.

    Returns:
        bool. Whether the diff contains changes in CI config or
        Javascript files.
    """

    for file_path in diff_files:
        if file_path.endswith(b'.js') or re.search(rb'e2e_.*\.yml', file_path):
            return True
    return False


def check_for_backend_python_library_inconsistencies() -> None:
    """Checks the state of the 'third_party/python_libs' folder and compares it
    to the required libraries specified in 'requirements.txt'.
    If any inconsistencies are found, the script displays the inconsistencies
    and exits.
    """
    mismatches = install_python_prod_dependencies.get_mismatches()

    if mismatches:
        print(
            'Your currently installed python libraries do not match the\n'
            'libraries listed in your "requirements.txt" file. Here is a\n'
            'full list of library/version discrepancies:\n')

        print(
            '{:<35} |{:<25}|{:<25}'.format(
                'Library', 'Requirements Version',
                'Currently Installed Version'))
        for library_name, version_strings in mismatches.items():
            print('{!s:<35} |{!s:<25}|{!s:<25}'.format(
                library_name, version_strings[0], version_strings[1]))
        print('\n')
        common.print_each_string_after_two_new_lines([
            'Please fix these discrepancies by editing the `requirements.in`\n'
            'file or running `scripts.install_third_party` to regenerate\n'
            'the `third_party/python_libs` directory.\n'])
        sys.exit(1)
    else:
        print('Python dependencies consistency check succeeded.')


def main(args: Optional[List[str]] = None) -> None:
    """Main method for pre-push hook that executes the Python/JS linters on all
    files that deviate from develop.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('remote', nargs='?', help='provided by git before push')
    parser.add_argument('url', nargs='?', help='provided by git before push')
    parser.add_argument(
        '--install', action='store_true', default=False,
        help='Install pre_push_hook to the .git/hooks dir')
    parsed_args = parser.parse_args(args=args)
    if parsed_args.install:
        install_hook()
        return

    remote = get_remote_name()
    remote = remote if remote else parsed_args.remote
    refs = get_refs()
    collected_files = collect_files_being_pushed(refs, remote.decode('utf-8'))
    # Only interfere if we actually have something to lint (prevent annoyances).
    if collected_files and has_uncommitted_files():
        print(
            'Your repo is in a dirty state which prevents the linting from'
            ' working.\nStash your changes or commit them.\n')
        sys.exit(1)

    check_for_backend_python_library_inconsistencies()

    for branch, (modified_files, files_to_lint) in collected_files.items():
        with ChangedBranch(branch):
            if not modified_files and not files_to_lint:
                continue

            if files_to_lint:
                lint_status = start_linter(files_to_lint)
                if lint_status != 0:
                    print(
                        'Push failed, please correct the linting issues above.')
                    sys.exit(1)

            mypy_check_status = execute_mypy_checks()
            if mypy_check_status != 0:
                print(
                    'Push failed, please correct the mypy type annotation '
                    'issues above.')
                sys.exit(mypy_check_status)

            backend_associated_test_file_check_status = (
                run_script_and_get_returncode(
                    BACKEND_ASSOCIATED_TEST_FILE_CHECK_CMD))
            if backend_associated_test_file_check_status != 0:
                print(
                    'Push failed due to some backend files lacking an '
                    'associated test file.')
                sys.exit(1)

            typescript_checks_status = 0
            if does_diff_include_ts_files(files_to_lint):
                typescript_checks_status = run_script_and_get_returncode(
                    TYPESCRIPT_CHECKS_CMDS)
            if typescript_checks_status != 0:
                print('Push aborted due to failing typescript checks.')
                sys.exit(1)

            strict_typescript_checks_status = 0
            if does_diff_include_ts_files(files_to_lint):
                strict_typescript_checks_status = run_script_and_get_returncode(
                    STRICT_TYPESCRIPT_CHECKS_CMDS)
            if strict_typescript_checks_status != 0:
                print(
                    'Push aborted due to failing typescript checks in '
                    'strict mode.')
                sys.exit(1)

            frontend_status = 0
            ci_check_status = 0
            if does_diff_include_js_or_ts_files(files_to_lint):
                frontend_status = run_script_and_get_returncode(
                    FRONTEND_TEST_CMDS)
            if frontend_status != 0:
                print('Push aborted due to failing frontend tests.')
                sys.exit(1)
            if does_diff_include_ci_config_or_js_files(files_to_lint):
                ci_check_status = run_script_and_get_returncode(
                    CI_PROTRACTOR_CHECK_CMDS)
            if ci_check_status != 0:
                print(
                    'Push aborted due to failing e2e test configuration check.')
                sys.exit(1)
    return


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when pre_push_hook.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
