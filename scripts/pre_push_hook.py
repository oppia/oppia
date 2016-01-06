#!/usr/bin/env python2.7
"""Pre-push hook that executes the Python/JS linters on all files that
deviate from develop.
(By providing the list of files to `scripts/pre_commit_linter.py`)
To install the hook manually simply execute this script with the `--install`
flag.
"""

import os
import sys
import subprocess
import collections
import pprint
import argparse
import shutil

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument("remote", nargs="?", help="provided by git before push")
_PARSER.add_argument("url", nargs="?", help="provided by git before push")
_PARSER.add_argument("--install", action="store_true", default=False,
                     help="Install pre_push_hook to the .git/hooks directory")
_ARGS = _PARSER.parse_args()
REMOTE = _ARGS.remote

GitRef = collections.namedtuple("GitRef", ["local_ref", "local_sha1",
                                           "remote_ref", "remote_sha1"])

# git hash of /dev/null, refers to an "empty" commit
GIT_NULL_COMMIT = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"


# caution, __file__ is here *OPPiA/.git/hooks* and not in *OPPIA/scripts*
FILE_DIR = os.path.abspath(os.path.dirname(__file__))
OPPIA_DIR = os.path.join(FILE_DIR, os.pardir, os.pardir)
SCRIPTS_DIR = os.path.join(OPPIA_DIR, "scripts")
LINTER_SCRIPT = "pre_commit_linter.py"
LINTER_FILE_FLAG = "--files"
PYTHON_CMD = "python"
BACKEND_TEST_SCRIPT = "run_backend_tests.sh"
FRONTEND_TEST_SCRIPT = "run_frontend_tests.sh"


def _start_subprocess_for_result(cmd):
    """Starts subprocess and returns (stdout, stderr)"""
    task = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    out, err = task.communicate()
    return out, err


def _git_diff_names_only(left, right, diff_filter=""):
    """Compare two branches/commits etc with git.
    Parameter:
        left: the lefthand comperator
        right: the righthand comperator
        diff_filter: arguments given to --diff-filter (ACMRTD...)
    Returns:
        List of file names
    Raises:
        ValueError if git command fails
    """
    git_cmd = ["git", "diff", "--name-only"]
    if diff_filter:
        git_cmd.append("--diff-filter={}".format(diff_filter))
    git_cmd.extend([left, right])
    out, err = _start_subprocess_for_result(git_cmd)
    if not err:
        return out.splitlines()
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
        ValueError if git command fails
    """
    remote_branch = remote_branch if remote_branch else local_branch
    git_remote = "{}/{}".format(remote, remote_branch)
    return _git_diff_names_only(git_remote, local_branch,
                                diff_filter="ACMRT")


def _collect_files_being_pushed(ref_list):
    """Get all files that are modified and are being pushed"""
    # get branch name from e.g. local_ref='refs/heads/lint_hook'
    branches = [ref.local_ref.split("/")[-1] for ref in ref_list]
    hashes = [ref.local_sha1 for ref in ref_list]
    remote_hashes = [ref.remote_sha1 for ref in ref_list]
    changed_files = set()
    for branch, sha1, remote_sha1 in zip(branches, hashes, remote_hashes):
        # if remote doesn't have the branch yet, git reports the following
        #  remote_sha1: '0000000000000000000000000000000000000000'
        if set(remote_sha1) != {"0"}:
            try:
                files = _compare_to_remote(REMOTE, branch)
            except ValueError as e:
                sys.exit(e.message)
        else:
            # Get the difference to origin/develop instead
            try:
                files = _compare_to_remote(REMOTE, branch,
                                           remote_branch="develop")
            except ValueError:
                # give up, return all files in repo
                try:
                    files = _git_diff_names_only(GIT_NULL_COMMIT, sha1,
                                                 diff_filter="ACMRT")
                except ValueError as e:
                    sys.exit(e.message)

        changed_files.update(files)

    return list(changed_files)


def _get_refs():
    # Git provides refs in STDIN
    ref_list = [GitRef(*ref_str.split()) for ref_str in sys.stdin]
    print "ref_list:"
    pprint.pprint(ref_list)
    return ref_list


def _start_linter(files):
    script = os.path.join(SCRIPTS_DIR, LINTER_SCRIPT)
    task = subprocess.Popen([PYTHON_CMD, script, LINTER_FILE_FLAG] + files)
    task.communicate()
    return task.returncode


def _start_sh_script(scriptname):
    cmd = ["bash", os.path.join(SCRIPTS_DIR, scriptname)]
    task = subprocess.Popen(cmd)
    task.communicate()
    return task.returncode


def _install_hook():
    # install script ensures that oppia is root
    oppia_dir = os.getcwd()
    hooks_dir = os.path.join(oppia_dir, ".git", "hooks")
    pre_push_file = os.path.join(hooks_dir, "pre-push")
    if os.path.islink(pre_push_file):
        print "Symlink already exists"
        return
    try:
        os.symlink(os.path.abspath(__file__), pre_push_file)
        print "Created symlink in .git/hooks directory"
    # raises AttributeError on windows, OSError added as failsafe
    except (OSError, AttributeError):
        shutil.copy(__file__, pre_push_file)
        print "Copied file to .git/hooks directory"


def main():
    if _ARGS.install:
        _install_hook()
        sys.exit(0)
    refs = _get_refs()
    modified_files = _collect_files_being_pushed(refs)
    print "Files being pushed:"
    pprint.pprint(modified_files)
    lint_status = _start_linter(modified_files)
    if lint_status != 0:
        sys.exit("Push failed, please correct the linting issues above")
    frontend_status = _start_sh_script(FRONTEND_TEST_SCRIPT)
    if frontend_status != 0:
        sys.exit("Push aborted due to failing frontend tests.")
    backend_status = _start_sh_script(BACKEND_TEST_SCRIPT)
    if backend_status != 0:
        sys.exit("Push aborted due to failing backend tests.")


if __name__ == "__main__":
    main()
