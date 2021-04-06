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

A low-risk PR can be merged without running the full CI checks.
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


def parse_pr_url(pr_url):
    match = re.match(
        r'^https://github.com/(?P<owner>)/(?P<repo>)/pull/(?P<num>)/?$')
    if match:
        return match.group('owner', 'repo', 'num')
    else:
        return None


def lookup_pr(owner, repo, pull_number):
    response = python_utils.url_request(
        GITHUB_API_ENDPOINT % (owner, repo, pull_number)
    )
    pr = json.load(response)
    response.close()
    return pr


def check_if_pr_is_translation_pr(source_branch):
    if source_branch != 'translatewiki-prs':
        return False
    return True


def main(tokens=None):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'pr_url'
        help='The URL of the pull request.'
    )
    args = parser.parse_args(tokens)
    parsed_url = parse_pr_url(args.pr_url)
    if not parsed_url:
        raise RuntimeError('Failed to parse PR URL %s', args.pr_url)
    owner, repo, number = parsed_url
    print('----')
    print(parsed_url)
    print('----')
    pr = lookup_pr(owner, repo, numer)
    print(pr)
    print('----')
    remotes = common.run_cmd(['git', 'remote', '-v'])
    print(remotes)
    print('----')


if __name__ == '__main__':
    main()
