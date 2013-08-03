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

"""Oppia test suite for django tests.

Invoke this test script from the command line by running

    python oppia/tests/django_suite.py

from the root folder.
"""
__author__ = 'Tarashish Mishra'

import argparse
import os
import unittest

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--test_path',
    help='optional file or subdirectory path containing the test(s) to run',
    type=str)


def create_test_suites(parsed_args):
    """Creates test suites. If test_dir is None, runs all tests."""
    loader = unittest.TestLoader()
    root_dir = os.path.realpath(os.path.join(os.getcwd()))
    if parsed_args.test_path:
        root_dir = os.path.join(root_dir, parsed_args.test_path)

    suite = loader.discover(
        root_dir, pattern='test_django.py', top_level_dir=root_dir)
    return [suite]


def main():
    """Runs the tests."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "oppia.settings")
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

if __name__ == '__main__':
    main()
