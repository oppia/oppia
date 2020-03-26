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

"""This script runs the following tests in all cases.
- Javascript and Python Linting
- Backend Python tests

Only when frontend files are changed will it run Frontend Karma unit tests.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import subprocess

import python_utils

from . import common
from . import run_backend_tests
from . import run_frontend_tests
from .linters import pre_commit_linter

_PARSER = argparse.ArgumentParser(description="""
Run this script from the oppia root folder prior to opening a PR:
    python -m scripts.run_presubmit_checks
Set the origin branch to compare against by adding
--branch=your_branch or -b=your_branch
By default, if the current branch tip exists on remote origin,
the current branch is compared against its tip on GitHub.
Otherwise it's compared against 'develop'.
This script runs the following tests in all cases.
- Javascript and Python Linting
- Backend Python tests
Only when frontend files are changed will it run Frontend Karma unit tests.
If any of these tests result in errors, this script will terminate.
Note: The test scripts are arranged in increasing order of time taken. This
enables a broken build to be detected as quickly as possible.
""")

_PARSER.add_argument(
    '--branch', '-b',
    help='optional; if specified, the origin branch to compare against.')


def main(args=None):
    """Run the presubmit checks."""
    parsed_args = _PARSER.parse_args(args=args)

    # Run Javascript and Python linters.
    python_utils.PRINT('Linting files since the last commit')
    pre_commit_linter.main(args=[])
    python_utils.PRINT('Linting passed.')
    python_utils.PRINT('')

    current_branch = subprocess.check_output([
        'git', 'rev-parse', '--abbrev-ref', 'HEAD'])

    # If the current branch exists on remote origin, matched_branch_num=1
    # else matched_branch_num=0.
    matched_branch_num = subprocess.check_output([
        'git', 'ls-remote', '--heads', 'origin', current_branch, '|', 'wc',
        '-l'])

    # Set the origin branch to develop if it's not specified.
    if parsed_args.branch:
        branch = parsed_args.branch
    elif matched_branch_num == '1':
        branch = 'origin/%s' % current_branch
    else:
        branch = 'develop'

    python_utils.PRINT('Comparing the current branch with %s' % branch)

    all_changed_files = subprocess.check_output([
        'git', 'diff', '--cached', '--name-only', '--diff-filter=ACM', branch])

    if common.FRONTEND_DIR in all_changed_files:
        # Run frontend unit tests.
        python_utils.PRINT('Running frontend unit tests')
        run_frontend_tests.main(args=['--run_minified_tests'])
        python_utils.PRINT('Frontend tests passed.')
    else:
        # If files in common.FRONTEND_DIR were not changed, skip the tests.
        common.print_each_string_after_two_new_lines([
            'No frontend files were changed.',
            'Skipped frontend tests'])

    # Run backend tests.
    python_utils.PRINT('Running backend tests')
    run_backend_tests.main(args=[])
    python_utils.PRINT('Backend tests passed.')


if __name__ == '__main__':
    main()
