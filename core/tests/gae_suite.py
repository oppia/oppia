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

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')

DIRS_TO_ADD_TO_SYS_PATH = [
    os.path.join(
        OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine'),
    os.path.join(OPPIA_TOOLS_DIR, 'webtest-2.0.33'),
    os.path.join(
        OPPIA_TOOLS_DIR, 'google_appengine_1.9.67', 'google_appengine',
        'lib', 'webob_0_9'),
    os.path.join(OPPIA_TOOLS_DIR, 'browsermob-proxy-0.8.0'),
    os.path.join(OPPIA_TOOLS_DIR, 'selenium-3.13.0'),
    os.path.join(OPPIA_TOOLS_DIR, 'Pillow-6.0.0'),
    CURR_DIR,
    os.path.join(THIRD_PARTY_DIR, 'backports.functools_lru_cache-1.5'),
    os.path.join(THIRD_PARTY_DIR, 'beautifulsoup4-4.7.1'),
    os.path.join(THIRD_PARTY_DIR, 'bleach-3.1.0'),
    os.path.join(THIRD_PARTY_DIR, 'callbacks-0.3.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-cloud-storage-1.9.22.1'),
    os.path.join(THIRD_PARTY_DIR, 'gae-mapreduce-1.9.22.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-pipeline-1.9.22.1'),
    os.path.join(THIRD_PARTY_DIR, 'graphy-1.0.0'),
    os.path.join(THIRD_PARTY_DIR, 'html5lib-python-1.0.1'),
    os.path.join(THIRD_PARTY_DIR, 'mutagen-1.42.0'),
    os.path.join(THIRD_PARTY_DIR, 'simplejson-3.16.0'),
    os.path.join(THIRD_PARTY_DIR, 'six-1.12.0'),
    os.path.join(THIRD_PARTY_DIR, 'soupsieve-1.9.1'),
    os.path.join(THIRD_PARTY_DIR, 'webencodings-0.5.1'),
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
            CURR_DIR, pattern='[^core/tests/data]*_test.py',
            top_level_dir=CURR_DIR)])


def main():
    """Runs the tests."""
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

    for result in results:
        if result.errors or result.failures:
            raise Exception(
                'Test suite failed: %s tests run, %s errors, %s failures.' % (
                    result.testsRun, len(result.errors), len(result.failures)))


if __name__ == '__main__':
    main()
