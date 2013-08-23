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

Optionally, you can append a path to run tests in a particular
subdirectory, e.g.:

    python core/tests/django_suite.py --test_path='core/controllers'

runs all tests in the core/controllers/ directory.

When you are finished running the tests deactivate the virtual environment
by running

    deactivate
"""

__author__ = 'Tarashish Mishra'

import argparse
import os
import sys
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

    suite1 = loader.discover(
        root_dir, pattern='*_test.py', top_level_dir=root_dir)
    suite2 = loader.discover(
        root_dir, pattern='*tests.py', top_level_dir=root_dir)
    suite3 = loader.discover(
        root_dir, pattern='test_django.py', top_level_dir=root_dir)
    return [suite1, suite2, suite3]


def main():
    """Runs the tests."""
    sys.path.insert(0, os.path.abspath(os.getcwd()))
    sys.path.append(os.path.abspath(
        os.path.join(os.getcwd(), 'third_party/webtest-1.4.2')))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

    from core import settings
    dbname = settings.DATABASES['default']['NAME']
    settings.DATABASES['default']['NAME'] = 'testdb.db'
    os.system('python manage.py syncdb --noinput --setting=core.test_settings')

    parsed_args = _PARSER.parse_args()
    suites = create_test_suites(parsed_args)
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
