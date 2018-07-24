# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

In general, this script should not be run directly. Instead, invoke
it from the command line by running

    bash scripts/run_backend_tests.sh

from the oppia/ root folder.
"""

import argparse
import os
import sys
import unittest

import feconf

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')

DIRS_TO_ADD_TO_SYS_PATH = [
    os.path.join(
        OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine'),
    os.path.join(OPPIA_TOOLS_DIR, 'webtest-1.4.2'),
    os.path.join(
        OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine',
        'lib', 'webob_0_9'),
    os.path.join(OPPIA_TOOLS_DIR, 'browsermob-proxy-0.7.1'),
    os.path.join(OPPIA_TOOLS_DIR, 'selenium-2.53.2'),
    CURR_DIR,
    os.path.join(THIRD_PARTY_DIR, 'bleach-1.2.2'),
    os.path.join(THIRD_PARTY_DIR, 'gae-cloud-storage-1.9.15.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-mapreduce-1.9.17.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-pipeline-1.9.17.0'),
    os.path.join(THIRD_PARTY_DIR, 'graphy-1.0.0'),
    os.path.join(THIRD_PARTY_DIR, 'html5lib-python-0.95'),
    os.path.join(THIRD_PARTY_DIR, 'requests-2.10.0'),
    os.path.join(THIRD_PARTY_DIR, 'simplejson-3.7.1'),
    os.path.join(THIRD_PARTY_DIR, 'beautifulsoup4-4.6.0'),
    os.path.join(THIRD_PARTY_DIR, 'mutagen-1.38'),
]

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--test_target',
    help='optional dotted module name of the test(s) to run',
    type=str)


def create_test_suites(test_target=None):
    """Creates test suites. If test_dir is None, runs all tests."""
    if test_target and '/' in test_target:
        raise Exception('The delimiter in test_target should be a dot (.)')

    loader = unittest.TestLoader()
    return (
        [loader.loadTestsFromName(test_target)]
        if test_target else [loader.discover(
            CURR_DIR, pattern='*_test.py', top_level_dir=CURR_DIR)])


def main():
    """Runs the tests."""

    def _iterate(test_suite_or_case):
        """Iterate through all the test cases in `test_suite_or_case`."""
        try:
            suite = iter(test_suite_or_case)
        except TypeError:
            yield test_suite_or_case
        else:
            for test in suite:
                for subtest in _iterate(test):
                    yield subtest

    feconf.PLATFORM = 'gae'

    for directory in DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)
        sys.path.insert(0, directory)

    import dev_appserver
    dev_appserver.fix_sys_path()

    parsed_args = _PARSER.parse_args()
    suites = create_test_suites(test_target=parsed_args.test_target)

    results = [unittest.TextTestRunner(verbosity=2).run(suite)
               for suite in suites]

    tests_run = 0
    for result in results:
        tests_run += result.testsRun
        if result.errors or result.failures:
            raise Exception(
                'Test suite failed: %s tests run, %s errors, %s failures.' % (
                    result.testsRun, len(result.errors), len(result.failures)))

    if tests_run == 0:
        raise Exception('No tests were run.')


if __name__ == '__main__':
    main()
