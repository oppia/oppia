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

"""Oppia test suite for non-GAE platforms.

First activate the virtual environment by running

    source ../venv/bin/activate

from the root folder. Then invoke this test script from the command
line by running

    python core/tests/django_suite.py

from the root folder.

When you are finished running the tests deactivate the virtual environment
by running

    deactivate


=====================
CUSTOMIZATION OPTIONS
=====================

You can customize this script as follows:

(1) Append a test target to make the script run all tests in a given module
or class, or run a particular test. For example,

    python core/tests/django_suite.py --test_target='foo.bar.Baz'

runs all tests in test class Baz in the foo/bar.py module, and

    python core/tests/gae_suite.py --test_target='foo.bar.Baz.quux'

runs the test method quux in the test class Baz in the foo/bar.py module.


(2) Append a test path to make the script run all tests in a given
subdirectory. For example,

    python core/tests/django_suite.py --test_path='core/controllers'

runs all tests in the core/controllers/ directory.


Only one of test_path and test_target should be specified.

In addition, you can add the --omit_slow_tests flag to exclude tests that are
tagged with test_utils.TestBase.SLOW_TEST.
"""

__author__ = 'Tarashish Mishra'

import argparse
import os
import sys
import unittest


_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--test_target',
    help='optional dotted module name of the test(s) to run',
    type=str)
_PARSER.add_argument(
    '--test_path',
    help='optional file or subdirectory path containing the test(s) to run',
    type=str)
_PARSER.add_argument(
    '--omit_slow_tests',
    help='whether to omit tests that are flagged as slow',
    action='store_true')


def create_test_suites(parsed_args):
    """Creates test suites. If test_dir is None, runs all tests."""
    loader = unittest.TestLoader()
    root_dir = os.path.realpath(os.path.join(os.getcwd()))

    if parsed_args.test_target and parsed_args.test_path:
        raise Exception('At most one of test_path and test_target '
                        'should be specified.')
    if parsed_args.test_target and '/' in parsed_args.test_target:
        raise Exception('The delimiter in test_target should be a slash (/)')
    if parsed_args.test_path and '.' in parsed_args.test_path:
        raise Exception('The delimiter in test_target should be a dot (.)')

    if parsed_args.test_target:
        return [loader.loadTestsFromName(parsed_args.test_target)]

    if parsed_args.test_path:
        root_dir = os.path.join(root_dir, parsed_args.test_path)

    suite1 = loader.discover(
        root_dir, pattern='*_test.py', top_level_dir=root_dir)
    suite2 = loader.discover(
        root_dir, pattern='test_django.py', top_level_dir=root_dir)
    return [suite1, suite2]


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

    sys.path.insert(0, os.path.abspath(os.getcwd()))
    sys.path.append(os.path.abspath(
        os.path.join(os.getcwd(), '../tools/webtest-1.4.2')))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

    from core import settings
    dbname = settings.DATABASES['default']['NAME']
    settings.DATABASES['default']['NAME'] = 'testdb.db'
    os.system('python manage.py syncdb --noinput --setting=core.test_settings')

    parsed_args = _PARSER.parse_args()
    suites = create_test_suites(parsed_args)

    import test_utils

    if parsed_args.omit_slow_tests:
        new_suites = []
        for suite in suites:
            new_suite = unittest.TestSuite()
            for test in _iterate(suite):
                if (not hasattr(test, 'TAGS') or
                        not test_utils.TestTags.SLOW_TEST in test.TAGS):
                    new_suite.addTest(test)
            new_suites.append(new_suite)

        suites = new_suites

    results = [unittest.TextTestRunner(verbosity=2).run(suite)
               for suite in suites]

    # Cleaning up.
    settings.DATABASES['default']['NAME'] = dbname
    os.remove('testdb.db')

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
