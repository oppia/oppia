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
import os
import re
import shutil
import subprocess
import sys

from types import TracebackType
from typing import Final, List, Optional, Type

# When executing Python scripts using `python -m ...` from oppia/oppia,
# Python adds the repository root to sys.path. See the documentation at
#
#   https://docs.python.org/3.9/library/sys.html#sys.path
#
# However, when git executes pre_push_hook.py from its symlink in
# /.git/hooks, the shebang #!/usr/bin/env python at the top of this file
# causes the python interpreter to execute this hook directly rather than
# as a discovered module. So, Python instead adds /.git/hooks to sys.path,
# rather than the opipa/oppia root. To correct this problem, we add the
# current working directory to sys.path.
sys.path.append(os.getcwd())
from scripts import common  # isort:skip  # pylint: disable=wrong-import-position
from scripts import install_python_prod_dependencies # isort:skip  # pylint: disable=wrong-import-position
from core import feconf #isort:skip # pylint: disable=wrong-import-position
from scripts import git_changes_utils # isort:skip # pylint: disable=wrong-import-position

# Git hash of /dev/null, refers to an 'empty' commit.
GIT_NULL_COMMIT: Final = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

# CAUTION: __file__ is here *OPPIA/.git/hooks* and not in *OPPIA/scripts*.
LINTER_MODULE: Final = 'scripts.linters.run_lint_checks'
MYPY_TYPE_CHECK_MODULE: Final = 'scripts.run_mypy_checks'
FILE_DIR: Final = os.path.abspath(os.path.dirname(__file__))
OPPIA_DIR: Final = os.path.join(FILE_DIR, os.pardir, os.pardir)
LINTER_FILE_FLAG: Final = '--files'

# Path to currently running python interpreter,
# it is required to resolve python version conflict in docker.
PYTHON_CMD: Final = sys.executable if feconf.OPPIA_IS_DOCKERIZED else 'python'

OPPIA_PARENT_DIR: Final = os.path.join(
    FILE_DIR, os.pardir, os.pardir, os.pardir
)
FRONTEND_TEST_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.run_frontend_tests', '--check_coverage']
BACKEND_TEST_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.run_backend_tests']
BACKEND_ASSOCIATED_TEST_FILE_CHECK_CMD: Final = [
    PYTHON_CMD, '-m', 'scripts.check_backend_associated_test_file']
TYPESCRIPT_CHECKS_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.run_typescript_checks']
TESTS_ARE_CAPTURED_IN_CI_CHECK_CMDS: Final = [
    PYTHON_CMD, '-m', 'scripts.check_tests_are_captured_in_ci']
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
    task = subprocess.Popen([PYTHON_CMD, '-m', MYPY_TYPE_CHECK_MODULE])
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
    return bool(uncommitted_files)


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
    _, err_chmod_cmd = common.start_subprocess_for_result(chmod_cmd)

    if not err_chmod_cmd:
        print('pre-push hook file is now executable!')
    else:
        raise ValueError(err_chmod_cmd)


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


def does_diff_include_ci_config_or_test_files(diff_files: List[bytes]) -> bool:
    """Returns true if diff includes CI config or test files.

    Args:
        diff_files: list(bytes). List of files changed.

    Returns:
        bool. Whether the diff contains changes in CI config or test files.
    """

    for file_path in diff_files:
        if (
            re.search(rb'ci-test-suite-configs/.*\.json', file_path) or
            re.search(rb'wdio\.conf\.js', file_path) or
            re.search(rb'webdriverio', file_path) or
            re.search(rb'puppeteer-acceptance-tests', file_path)
        ):
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
            'file or running `scripts.install_third_party_libs` to regenerate\n'
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

    remote = (
        parsed_args.remote if parsed_args.remote else
        git_changes_utils.get_local_git_repository_remote_name()
    )
    refs = git_changes_utils.get_refs()
    collected_files = git_changes_utils.get_changed_files(
        refs, remote)
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

            # When using Docker, we run MYPY checks in docker/pre_push_hook.sh
            # itself.
            if not feconf.OPPIA_IS_DOCKERIZED:
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
            backend_status = 0
            js_or_ts_files = git_changes_utils.get_js_or_ts_files_from_diff(
                files_to_lint)
            if js_or_ts_files:
                frontend_test_cmds = FRONTEND_TEST_CMDS.copy()
                frontend_test_cmds.append(
                    '--allow_no_spec')
                frontend_test_cmds.append(
                    '--specs_to_run=%s'
                        % ','.join(js_or_ts_files))
                frontend_status = run_script_and_get_returncode(
                    frontend_test_cmds)
            if frontend_status != 0:
                print('Push aborted due to failing frontend tests.')
                sys.exit(1)
            if does_diff_include_ci_config_or_test_files(files_to_lint):
                ci_check_status = run_script_and_get_returncode(
                    TESTS_ARE_CAPTURED_IN_CI_CHECK_CMDS)
            if ci_check_status != 0:
                print(
                    'Push aborted due to failing tests are captured '
                    'in ci check.')
                sys.exit(1)
            python_test_files = (
                git_changes_utils.get_python_dot_test_files_from_diff(
                    files_to_lint
                )
            )
            if python_test_files:
                backend_test_cmds = BACKEND_TEST_CMDS.copy()
                backend_test_cmds.append(
                    '--test_targets=%s' % ','.join(python_test_files))
                backend_status = run_script_and_get_returncode(
                    backend_test_cmds)
            if backend_status != 0:
                print('Push aborted due to failing backend tests.')
                sys.exit(1)
    return


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when pre_push_hook.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
