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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import json
import re

import python_utils
from scripts import common


GITHUB_API_PR_ENDPOINT = (
    'https://api.github.com/repos/%s/%s/pulls/%s')
PR_URL_REGEX = (
    r'^https://github.com/(?P<owner>\w+)/(?P<repo>\w+)/pull/(?P<num>\w+)/?$')


def parse_pr_url(pr_url):
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


def load_diff(url):
    """Download a PR diff from GitHub.

    Args:
        url: str. URL of the diff on GitHub.

    Returns:
        list(str). List of the right-stripped lines of the diff.
    """
    response = python_utils.url_request(url, None, None)
    lines = [line.rstrip() for line in response]
    response.close()
    return lines


def lookup_pr(owner, repo, pull_number):
    """Lookup a PR using the GitHub API.

    Args:
        owner: str. Owner of the repository the PR is in.
        repo: str. Repository the PR is in.
        pull_number: str. PR number.

    Returns:
        dict. JSON object returned by the GitHub API v3.
    """
    request = python_utils.url_request(
        GITHUB_API_PR_ENDPOINT % (owner, repo, pull_number),
        None,
        {'Accept': 'application/vnd.github.v3+json'})
    response = python_utils.url_open(request)
    pr = json.load(response)
    response.close()
    return pr


def parse_diff(diff):
    """Parse a PR diff into the changes made in each file.

    Args:
        diff: list(str). List of the right-stripped lines of the diff.

    Returns:
        dict(tuple(str, str), list(str)). A dictionary that maps from
        tuples of (old filename, new filename) to lists of the diff
        lines associated with those files. Context lines before the
        first changed line and after the last changed line are excluded.
    """
    file_diffs = {}
    old, new = '', ''
    file_diff_started = False
    for line in diff:
        if line.startswith('diff --git '):
            match = re.match(
                '^diff --git a/(?P<old>) b/(?P<new>)$', line)
            old, new = match.group('old', 'new')
            file_diffs[old, new] = []
            file_diff_started = False
            continue
        if line.startswith('+++'):
            file_diff_started = True
            continue
        if bool(old) and bool(new) and file_diff_started:
            fild_diffs[old, new].append(line)
    for old, new in file_diffs:
        lines = file_diffs[old, new]
        i_start = -1
        i_end = -1
        for i, line in enumerate(lines):
            if line.startswith(('-', '+')):
                if i_start < 0:
                    i_start = i
                i_end = i
        file_diffs[old, new] = lines[i_start:i_end + 1]
    return file_diffs


def check_if_pr_is_translation_pr(pr):
    """Check if a PR is low-risk by virtue of being a translation PR.

    To be a low-risk translation PR, a PR must:

    * Be opened from a branch on the oppia/oppia repository.
    * Be opened from the branch `translatewiki-prs`.
    * Only change JSON files in `assets/i18n`.
    * Not change the names of any files.

    Args:
        pr: dict. JSON object of PR from GitHub API.

    Returns:
        str. An empty string if the PR is a translation PR and low-risk,
        else a message explaining why the PR is not low-risk.
    """
    source_repo = pr['head']['repo']['full_name']
    if source_repo != 'oppia/oppia':
        return 'Source repo is not oppia/oppia'
    pr_source_branch = pr['head']['ref']
    if source_branch != 'translatewiki-prs':
        return 'Source branch is not translatewiki-prs'
    diff = parse_diff(load_diff(pr['diff_url']))
    for old, new in diff:
        if not old == new:
            return 'File name change: %s -> %s' % (old, new)
        if not re.match(old, '^assets/i18n/[a-z-]+.json$'):
            return 'File %s changed and not low-risk' % old
    return ''


def check_if_pr_is_changelog_pr(pr):
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

    Args:
        pr: dict. JSON object of PR from GitHub API.

    Returns:
        str. An empty string if the PR is a changelog PR and low-risk,
        else a message explaining why the PR is not low-risk.
    """
    source_repo = pr['head']['repo']['full_name']
    if source_repo != 'oppia/oppia':
        return 'Source repo is not oppia/oppia'
    pr_source_branch = pr['head']['ref']
    if re.match(
            '^update-changelog-for-release-v[0-9.]+$',
            source_branch):
        return 'Source branch does not indicate a changelog PR'
    diff = parse_diff(load_diff(pr['diff_url']))
    for old, new in diff:
        if not old == new:
            return 'File name change: %s -> %s' % (old, new)
        if old in ('AUTHORS', 'CONTRIBUTORS', 'CHANGELOG'):
            pass
        elif old == 'package.json':
            lines = diff[old, new]
            if len(lines) != 2:
                return 'Too many lines changed in package.json'
            if not (
                    re.match(
                        '-  "version": "[0-9].[0-9].[0-9]",',
                        line[0],
                    ) and re.match(
                        '+  "version": "[0-9].[0-9].[0-9]",',
                        line[0],
                    )):
                return 'package.json changes not low-risk'

        elif old == 'core/templates/pages/about-page/about-page.constants.ts':
            for line in diff[old, new]:
                if not re.match(r'+    \'[A-Za-z ]\',', line):
                    return 'about-page.constants.ts changes not low-risk'
        else:
            return 'File %s changed and not low-risk' % old
    return ''


LOW_RISK_CHECKERS = {
    'translatewiki': check_if_pr_is_translation_pr,
    'changelog': check_if_pr_is_changelog_pr,
}


def main(tokens=None):
    """Check if a PR is low-risk."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'pr_url',
        help='The URL of the pull request.'
    )
    args = parser.parse_args(tokens)
    parsed_url = parse_pr_url(args.pr_url)
    if not parsed_url:
        raise RuntimeError('Failed to parse PR URL %s', args.pr_url)
    owner, repo, number = parsed_url
    pr = lookup_pr(owner, repo, number)
    for low_risk_type, low_risk_checker in LOW_RISK_CHECKERS.items():
        reason_not_low_risk = low_risk_checker(pr)
        if reason_not_low_risk:
            python_utils.PRINT(
                'PR is not a low-risk PR of type %s because: %s' %
                (low_risk_type, reason_not_low_risk))
        else:
            python_utils.PRINT('PR is low-risk. Skipping some CI checks.')
            exit(0)
    python_utils.PRINT('PR is not low-risk. Running all CI checks.')
    exit(1)


if __name__ == '__main__':
    main()
