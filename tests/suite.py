# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Oppia test suite.

Invoke this test script from the command line by running

    python tests/suite.py

from the oppia root folder.

Optionally, you can append a path to run tests in a particular
subdirectory, e.g.:

    python tests/suite.py --test_path='controllers'

runs all tests in the controllers/ directory.
"""

__author__ = 'Sean Lip'

import argparse
import os
import sys
import unittest

EXPECTED_TEST_COUNT = 75


_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--test_path',
    help='optional file or subdirectory path containing the test(s) to run', type=str)


def create_test_suites(parsed_args):
    """Creates test suites. If test_dir is None, runs all tests."""
    loader = unittest.TestLoader()
    root_dir = os.path.realpath(os.path.join(os.getcwd()))
    if parsed_args.test_path:
        root_dir = os.path.join(root_dir, parsed_args.test_path)

    suite1 = loader.discover(
        root_dir, pattern='*_test.py', top_level_dir=root_dir)
    suite2 = loader.discover(
        root_dir, pattern='tests.py', top_level_dir=root_dir)
    return [suite1, suite2]


def main():
    """Runs the tests."""
    # TODO(sll): Check if the next dir is valid.
    sdk_path = os.path.join(
        os.getcwd(), '..', 'oppia_runtime', 'google_appengine_1.7.7',
        'google_appengine')
    sys.path.insert(0, sdk_path)
    sys.path.insert(0, os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..')))
    sys.path.append(os.path.abspath(
        os.path.join(os.path.dirname(__file__), '../third_party/webtest-1.4.2')))
    sys.path.append(os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            '../../oppia_runtime/google_appengine_1.7.7/google_appengine/lib/webob_0_9')))

    import dev_appserver
    dev_appserver.fix_sys_path()

    parsed_args = _PARSER.parse_args()
    suites = create_test_suites(parsed_args)
    results = [unittest.TextTestRunner(verbosity=2).run(suite)
               for suite in suites]

    tests_run = 0
    for result in results:
        tests_run += result.testsRun
        if result.errors or result.failures:
            raise Exception(
                'Functional test suite failed: %s errors, %s failures of '
                ' %s tests run.' % (
                    len(result.errors), len(result.failures), result.testsRun))

    if tests_run == 0:
        raise Exception('No tests were run.')

    if parsed_args.test_path is None and tests_run != EXPECTED_TEST_COUNT:
        raise Exception('Expected %s tests to be run, not %s.' %
                        (EXPECTED_TEST_COUNT, tests_run))


if __name__ == '__main__':
    main()
