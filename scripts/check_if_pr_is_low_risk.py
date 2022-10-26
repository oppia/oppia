# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Check whether a PR is low-risk.

A low-risk PR can be merged without running the full CI checks. When
called with a URL to a PR, this script exits with code 0 if and only if
the PR is low-risk. Otherwise, the exit code is nonzero.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib

from core import utils
from scripts import common

from typing import Dict, Final, List, Optional, Tuple, TypedDict

GITHUB_API_PR_ENDPOINT: Final = (
    'https://api.github.com/repos/%s/%s/pulls/%s')
PR_URL_REGEX: Final = (
    r'^https://github.com/(?P<owner>\w+)/(?P<repo>\w+)/pull/(?P<num>\w+)/?$')
UPSTREAM_REMOTE: Final = 'upstream'
FILES_THAT_NEED_DIFFS: Final = (
    'package.json'
    'core/templates/pages/about-page/about-page.constants.ts',
)


class RepoDict(TypedDict):
    """Dictionary representation of repository with branch reference."""

    repo: Dict[str, str]
    ref: str


class PRDict(TypedDict):
    """Dictionary representation of PR JSON object."""

    head: RepoDict
    base: RepoDict


def parse_pr_url(pr_url: str) -> Optional[Tuple[str, ...]]:
    """Extract the owner, repo, and PR number from a PR URL.

    For example, in the URL https://github.com/foobar/oppia/pull/23, the
    owner is `foobar`, the repo is `oppia`, and the PR number is `23`.

    Args:
        pr_url: str. URL to the PR on GitHub.

    Returns:
        str, str, str. 3-tuple of the PR owner, repository, and number.
    """
    match = re.match(PR_URL_REGEX, pr_url)
    if match:
        return match.group('owner', 'repo', 'num')
    else:
        return None


def load_diff(
    base_branch: str
) -> Tuple[List[Tuple[str, str]], Dict[str, List[str]]]:
    """Load the diff between the head and base.

    Only determine the diffs for files in FILES_THAT_NEED_DIFFS. Other
    files will be listed as having changed, but their diff lines will
    not be returned.

    Args:
        base_branch: str. Base branch of PR.

    Returns:
        tuple(list(tuple(str, str)), dict(str, list(str)). Tuple of a
        list of changed files (each a tuple of before, after) and a
        dictionary mapping from file names to list of diff lines for
        each file. In the event of a parsing error, a tuple of an empty
        list and empty dictionary is returned.
    """
    diff_name_status = common.run_cmd([
        'git', 'diff', '--name-status',
        '{}/{}'.format(UPSTREAM_REMOTE, base_branch),
    ])
    diff_files = []
    for line in diff_name_status.split('\n'):
        if not line:
            continue
        split = line.split()
        if len(split) < 2 or len(split) > 3:
            print('Failed to parse diff --name-status line "%s"' % line)
            return [], {}
        elif len(split) == 2:
            diff_files.append((split[1], split[1]))
        else:
            # When we rule out the possibility of 'len' being less than 2 or
            # greater than 3, 'len' can only have two values. If len is not 2,
            # then it must be 3.
            assert len(split) == 3
            diff_files.append((split[1], split[2]))
    file_diffs = {}
    for file_tuple in diff_files:
        for filename in file_tuple:
            if filename in file_diffs:
                # Don't re-generate a diff we already have.
                continue
            if filename not in FILES_THAT_NEED_DIFFS:
                continue
            file_diff = common.run_cmd([
                'git', 'diff', '-U0',
                '{}/{}'.format(UPSTREAM_REMOTE, base_branch),
                '--', filename,
            ])
            file_diff_split = file_diff.rstrip().split('\n')
            i = 0
            # Find the end of the diff header. See
            # https://git-scm.com/docs/diff-format for details on the
            # git diff format.
            for line in file_diff_split:
                i += 1
                if line.startswith('@@'):
                    break
            if i == len(file_diff_split):
                # We reached the end of the diff without finding the
                # header, or the header consumes the entire diff.
                print('Failed to find end of header in "%s" diff' % filename)
                return [], {}
            file_diffs[filename] = file_diff_split[i:]
    return diff_files, file_diffs


def lookup_pr(owner: str, repo: str, pull_number: str) -> Optional[PRDict]:
    """Lookup a PR using the GitHub API.

    Args:
        owner: str. Owner of the repository the PR is in.
        repo: str. Repository the PR is in.
        pull_number: str. PR number.

    Returns:
        dict. JSON object returned by the GitHub API v3. This is an
        empty dictionary if the response code from the GitHub API is not
        200.
    """
    request = urllib.request.Request(
        GITHUB_API_PR_ENDPOINT % (owner, repo, pull_number),
        None,
        {'Accept': 'application/vnd.github.v3+json'})
    response = utils.url_open(request)
    if response.getcode() != 200:
        response.close()
        return None
    pr: PRDict = json.load(response)
    response.close()
    return pr


def check_if_pr_is_translation_pr(
    pr: PRDict,
    diff_files: List[Tuple[str, str]],
    unused_file_diffs: Dict[str, List[str]]
) -> str:
    """Check if a PR is low-risk by virtue of being a translation PR.

    To be a low-risk translation PR, a PR must:

    * Be opened from a branch on the oppia/oppia repository.
    * Be opened from the branch `translatewiki-prs`.
    * Only change JSON files in `assets/i18n`.
    * Not change the names of any files.
    * Be opened to the branch `develop`

    Args:
        pr: dict. JSON object of PR from GitHub API.
        diff_files: list(tuple(str, str)). Changed files, each as a
            tuple of (old name, new name).
        unused_file_diffs: dict(str, list(str)). Map from file names to
            the lines of that file's diff.

    Returns:
        str. An empty string if the PR is a translation PR and low-risk,
        else a message explaining why the PR is not low-risk.
    """
    source_repo = pr['head']['repo']['full_name']
    if source_repo != 'oppia/oppia':
        return 'Source repo is not oppia/oppia'
    source_branch = pr['head']['ref']
    if source_branch != 'translatewiki-prs':
        return 'Source branch is not translatewiki-prs'
    base_branch = pr['base']['ref']
    if base_branch != 'develop':
        return 'Base branch is not develop'
    for old, new in diff_files:
        if not old == new:
            return 'File name change: %s -> %s' % (old, new)
        if not re.match('^assets/i18n/[a-z-]+.json$', old):
            return 'File %s changed and not low-risk' % old
    return ''


def _check_changelog_pr_diff(
    diff_files: List[Tuple[str, str]], file_diffs: Dict[str, List[str]]
) -> str:
    """Check whether a changelog PR diff is valid.

    Args:
        diff_files: list(tuple(str, str)). Changed files, each as a
            tuple of (old name, new name).
        file_diffs: dict(str, list(str)). Map from file names to the
            lines of that file's diff.

    Returns:
        str. If the diff is not valid for a low-risk changelog PR, an
        error message explaining why. Otherwise, an empty string.
    """
    for old, new in diff_files:
        if not old == new:
            return 'File name change: %s -> %s' % (old, new)
        if old in ('AUTHORS', 'CONTRIBUTORS', 'CHANGELOG'):
            pass
        elif old == 'package.json':
            lines = file_diffs[old]
            if len(lines) != 2:
                return 'Only 1 line should change in package.json'
            # Check that only the version has been updated.
            if not (
                    bool(re.match(
                        r'-  "version": "[0-9]\.[0-9]\.[0-9]",',
                        lines[0],
                    )) and bool(re.match(
                        r'\+  "version": "[0-9]\.[0-9]\.[0-9]",',
                        lines[1],
                    ))):
                return 'package.json changes not low-risk'

        elif old == 'core/templates/pages/about-page/about-page.constants.ts':
            for line in file_diffs[old]:
                # All changes should be additions of strings
                # (specifically names) to a list.
                if not re.match(r'\+    \'[A-Za-z ]+\',', line):
                    return 'about-page.constants.ts changes not low-risk'
        else:
            return 'File %s changed and not low-risk' % old
    return ''


def check_if_pr_is_changelog_pr(
    pr: PRDict,
    diff_files: List[Tuple[str, str]],
    file_diffs: Dict[str, List[str]]
) -> str:
    """Check if a PR is low-risk by virtue of being a changelog PR.

    To be a low-risk changelog PR, a PR must:

    * Be opened from a branch on the oppia/oppia repository.
    * Be opened from a branch matching
      `^update-changelog-for-release-v[0-9.]+$`.
    * Only change the following files:
        * AUTHORS
        * CONTRIBUTORS
        * CHANGELOG
        * package.json to update the version number
        * about-page.constants.ts to add names to the contributors list
    * Be opened to the branch `develop`

    Args:
        pr: dict. JSON object of PR from GitHub API.
        diff_files: list(tuple(str, str)). Changed files, each as a
            tuple of (old name, new name).
        file_diffs: dict(str, list(str)). Map from file names to the
            lines of that file's diff.

    Returns:
        str. An empty string if the PR is a changelog PR and low-risk,
        else a message explaining why the PR is not low-risk.
    """
    source_repo = pr['head']['repo']['full_name']
    if source_repo != 'oppia/oppia':
        return 'Source repo is not oppia/oppia'
    source_branch = pr['head']['ref']
    if not re.match(
            '^update-changelog-for-release-v[0-9.]+$',
            source_branch):
        return 'Source branch does not indicate a changelog PR'
    base_branch = pr['base']['ref']
    if base_branch != 'develop':
        return 'Base branch is not develop'
    return _check_changelog_pr_diff(diff_files, file_diffs)


LOW_RISK_CHECKERS: Final = (
    ('translatewiki', check_if_pr_is_translation_pr),
    ('changelog', check_if_pr_is_changelog_pr),
)


def main(tokens: Optional[List[str]] = None) -> int:
    """Check if a PR is low-risk."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'pr_url',
        help='The URL of the pull request.'
    )
    args = parser.parse_args(args=tokens)
    parsed_url = parse_pr_url(args.pr_url)
    if not parsed_url:
        raise RuntimeError('Failed to parse PR URL %s' % args.pr_url)
    owner, repo, number = parsed_url
    pr = lookup_pr(owner, repo, number)
    if not pr:
        raise RuntimeError('Failed to load PR from GitHub API')
    base_repo_url = pr['base']['repo']['clone_url']
    common.run_cmd(
        ['git', 'remote', 'add', UPSTREAM_REMOTE, base_repo_url])
    base_branch = pr['base']['ref']
    common.run_cmd(['git', 'fetch', UPSTREAM_REMOTE, base_branch])
    diff_files, file_diffs = load_diff(pr['base']['ref'])
    if not diff_files:
        raise RuntimeError('Failed to load PR diff')
    for low_risk_type, low_risk_checker in LOW_RISK_CHECKERS:
        reason_not_low_risk = low_risk_checker(
            pr, diff_files, file_diffs)
        if reason_not_low_risk:
            print(
                'PR is not a low-risk PR of type %s because: %s' %
                (low_risk_type, reason_not_low_risk))
        else:
            print('PR is low-risk. Skipping some CI checks.')
            return 0
    print('PR is not low-risk. Running all CI checks.')
    return 1


if __name__ == '__main__':
    # This line cannot be covered.
    sys.exit(main())  # pragma: no cover
