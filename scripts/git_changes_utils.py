# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Utils file for dealing with git changes."""

from __future__ import annotations

import collections
import os
import subprocess
import sys

from scripts import common

from typing import Dict, List, Optional, Set, Tuple

GitRef = collections.namedtuple(
    'GitRef', ['local_ref', 'local_sha1', 'remote_ref', 'remote_sha1'])
FileDiff = collections.namedtuple('FileDiff', ['status', 'name'])


def get_local_git_repository_remote_name() -> Optional[bytes]:
    """Get the remote name of the local repository.

    Returns:
        Optional[bytes]. The remote name of the local repository.

    Raises:
        ValueError. Subprocess failed to start.
        Exception. Upstream not set.
    """
    remote_name = b''
    remote_num = 0
    task = subprocess.Popen(
        ['git', 'remote'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
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
            'Error: Please set the git \'upstream\' repository.\n'
            'To do that follow these steps:\n'
            '1. Run the command \'git remote -v\'\n'
            '2a. If \'upstream\' is listed in the command output, then run the '
            'command \'git remote set-url upstream '
            'https://github.com/oppia/oppia.git\'\n'
            '2b. If \'upstream\' is not listed in the command output, then run '
            'the command \'git remote add upstream '
            'https://github.com/oppia/oppia.git\'\n'
        )

    if remote_num > 1:
        print(
            'Warning: Please keep only one remote branch for oppia:develop.\n'
            'To do that follow these steps:\n'
            '1. Run the command \'git remote -v\'\n'
            '2. This command will list the remote references. There will be '
            'multiple remotes with the main oppia github reopsitory url, but we'
            ' want to make sure that there is only one main \'upstream\' remote'
            ' that uses the url https://github.com/oppia/oppia.git. Please use '
            'the command, \'git remote remove <remote_name>\' on all remotes '
            'that have the url https://github.com/oppia/oppia.git except for '
            'the main \'upstream\' remote.\n'
        )
        return None
    return remote_name


def git_diff_name_status(
    left: Optional[str] = None, right: Optional[str] = None,
    diff_filter: Optional[str] = None
) -> List[FileDiff]:
    """Compare two branches/commits with git.

    Parameter:
        left: str. The name of the lefthand branch.
        right: str. The name of the righthand branch.
        diff_filter: str. Arguments given to --diff-filter (ACMRTD...).

    Returns:
        list. List of FileDiffs (tuple with name/status).

    Raises:
        ValueError. Raise ValueError if git command fails or if invalid
            arguments are provided.
    """
    git_cmd = ['git', 'diff', '--name-status']
    if diff_filter == '':
        raise ValueError(
            'Error: diff_filter should not be an empty string.')
    if diff_filter:
        git_cmd.append('--diff-filter={}'.format(diff_filter))
    if left == '':
        raise ValueError('Error: left should not be an empty string.')
    if right == '':
        raise ValueError('Error: right should not be an empty string.')
    if left and right:
        git_cmd.extend([left, right])
        # Append -- to avoid conflicts between branch and directory name.
        # More here: https://stackoverflow.com/questions/26349191
        git_cmd.append('--')
    out, err = common.start_subprocess_for_result(git_cmd)
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


def check_file_inside_directory(file_path: str, directory_path: str) -> bool:
    """Checks if a file is inside a directory.

    Args:
        file_path: str. The path to the file.
        directory_path: str. The path to the directory.

    Returns:
        bool. Whether the file is inside the directory.
    """
    abs_file_path: str = os.path.abspath(file_path)
    abs_directory_path: str = os.path.abspath(directory_path)
    common_path: str = os.path.commonpath([abs_file_path, abs_directory_path])

    return common_path == abs_directory_path


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
    merge_base, err = common.start_subprocess_for_result(
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
        list(FileDiff). List of FileDiffs (tuple with name/status).

    Raises:
        ValueError. Raise ValueError if git command fails or if a git diff
            file is not inside the oppia directory.
    """
    remote_branch = remote_branch if remote_branch else local_branch
    git_remote = '%s/%s' % (remote, remote_branch)
    # Ensure that references to the remote branches exist on the local machine.
    common.start_subprocess_for_result(['git', 'pull', remote])
    # Only compare differences to the merge base of the local and remote
    # branches (what GitHub shows in the files tab of pull requests).
    file_diffs = git_diff_name_status(
        get_merge_base(git_remote, local_branch), local_branch)
    for file_diff in file_diffs:
        if not check_file_inside_directory(
            file_diff.name.decode(), common.CURR_DIR
        ):
            raise ValueError(
                'Error: The file %s is not inside the oppia directory.' % (
                    file_diff.name.decode()))

    return file_diffs


def get_parent_branch_name_for_diff() -> str:
    """Returns remote branch name against which the diff has to be checked.

    Returns:
        str. The name of the remote branch.
    """
    if common.is_current_branch_a_hotfix_branch():
        return 'release-%s' % common.get_current_release_version_number(
            common.get_current_branch_name())
    return 'develop'


def extract_acmrt_files_from_diff(diff_files: List[FileDiff]) -> List[bytes]:
    """Grab only files out of a list of FileDiffs that have a ACMRT status.
    ACMRT files are files that are Added, Copied, Modified, Renamed, or
    Type-changed.
    """
    if not diff_files:
        return []
    acmrt_files = [f.name for f in diff_files if f.status in b'ACMRT']
    return acmrt_files


def get_refs() -> List[GitRef]:
    """Returns the ref list taken from STDIN or the current branch."""
    ref_list = []
    if not sys.stdin.isatty():
        # Git provides refs in STDIN.
        ref_list = [GitRef(*ref_str.split()) for ref_str in sys.stdin]
    # If git didn't provide refs or the refs are empty, use the current branch
    # to get the refs.
    if ref_list == []:
        current_branch = common.get_current_branch_name()
        encoded_stdout, encoded_stderr = common.start_subprocess_for_result(
            ['git', 'show-ref', current_branch])
        stderr = encoded_stderr.decode('utf-8')
        if stderr:
            raise ValueError(stderr)
        stdout = encoded_stdout.decode('utf-8')
        local_ref_line, remote_ref_line = stdout.splitlines()
        local_sha, local_ref = local_ref_line.split()
        remote_sha, remote_ref = remote_ref_line.split()
        ref_list.append(GitRef(local_ref, local_sha, remote_ref, remote_sha))
    return ref_list


def get_changed_files(
    ref_list: List[GitRef], remote: str
) -> Dict[str, Tuple[List[FileDiff], List[bytes]]]:
    """Collect diff files and ACMRT files for each branch in ref_list.
    ACMRT files are files that are Added, Copied, Modified, Renamed, or
    Type-changed.

    Parameter:
        ref_list: list of references to parse (provided by git in stdin)
        remote: str. The name of the remote being pushed to.

    Returns:
        dict. Dict mapping branch names to 2-tuples of the form (list of
        changed files, list of changed files that are ACMRT).
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
        diff_files = compare_to_remote(
            remote, branch, remote_branch=get_parent_branch_name_for_diff())
        acmrt_files = extract_acmrt_files_from_diff(diff_files)
        collected_files[branch] = (diff_files, acmrt_files)

    return collected_files


def get_staged_acmrt_files() -> List[bytes]:
    """Returns the list of staged ACMRT files."""
    staged_files = git_diff_name_status()
    acmrt_staged_files = extract_acmrt_files_from_diff(staged_files)

    return acmrt_staged_files


def get_js_or_ts_files_from_diff(diff_files: List[bytes]) -> List[str]:
    """Returns the list of JavaScript or TypeScript files from the diff.

    Args:
        diff_files: list(bytes). List of files changed.

    Returns:
        list(str). List of JavaScript or TypeScript files.
    """
    js_or_ts_files = []
    for file_path in diff_files:
        if file_path.endswith((b'.ts', b'.js')):
            js_or_ts_files.append(file_path.decode())
    return js_or_ts_files


def get_python_dot_test_files_from_diff(diff_files: List[bytes]) -> Set[str]:
    """Returns the list of Python test files from the diff in dot format.

    Args:
        diff_files: list(bytes). List of files changed.

    Returns:
        list(str). List of Python test files in dot format.
    """
    python_test_files: Set[str] = set()
    for file_path in diff_files:
        decoded_file_path = file_path.decode()
        if not decoded_file_path.endswith('.py'):
            continue
        if decoded_file_path.endswith('_test.py'):
            test_file_path = decoded_file_path
        else:
            test_file_path = decoded_file_path.replace('.py', '_test.py')
        if os.path.exists(test_file_path):
            python_test_files.add(
                test_file_path.replace('.py', '').replace('/', '.')
            )

    return python_test_files
