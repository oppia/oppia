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

    python -m scripts.run_backend_tests

from the oppia/ root folder.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import sys
import unittest

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')

GOOGLE_APP_ENGINE_SDK_HOME = os.path.join(
    OPPIA_TOOLS_DIR, 'google-cloud-sdk-304.0.0', 'google-cloud-sdk', 'platform',
    'google_appengine')

DIRS_TO_ADD_TO_SYS_PATH = [
    GOOGLE_APP_ENGINE_SDK_HOME,
    os.path.join(OPPIA_TOOLS_DIR, 'webtest-2.0.35'),
    os.path.join(GOOGLE_APP_ENGINE_SDK_HOME, 'lib', 'webob_0_9'),
    os.path.join(OPPIA_TOOLS_DIR, 'Pillow-6.2.2'),
    os.path.join(OPPIA_TOOLS_DIR, 'psutil-5.7.0'),
    os.path.join(OPPIA_TOOLS_DIR, 'PyGithub-1.45'),
    CURR_DIR,
    os.path.join(THIRD_PARTY_DIR, 'backports.functools_lru_cache-1.6.1'),
    os.path.join(THIRD_PARTY_DIR, 'beautifulsoup4-4.9.1'),
    os.path.join(THIRD_PARTY_DIR, 'bleach-3.1.5'),
    os.path.join(THIRD_PARTY_DIR, 'callbacks-0.3.0'),
    os.path.join(THIRD_PARTY_DIR, 'future-0.17.1'),
    os.path.join(THIRD_PARTY_DIR, 'gae-cloud-storage-1.9.22.1'),
    os.path.join(THIRD_PARTY_DIR, 'gae-mapreduce-1.9.22.0'),
    os.path.join(THIRD_PARTY_DIR, 'gae-pipeline-1.9.22.1'),
    os.path.join(THIRD_PARTY_DIR, 'graphy-1.0.0'),
    os.path.join(THIRD_PARTY_DIR, 'html5lib-python-1.1'),
    os.path.join(THIRD_PARTY_DIR, 'mutagen-1.43.0'),
    os.path.join(THIRD_PARTY_DIR, 'packaging-20.4'),
    os.path.join(THIRD_PARTY_DIR, 'pylatexenc-2.6'),
    os.path.join(THIRD_PARTY_DIR, 'redis-3.5.3'),
    os.path.join(THIRD_PARTY_DIR, 'simplejson-3.17.0'),
    os.path.join(THIRD_PARTY_DIR, 'six-1.15.0'),
    os.path.join(THIRD_PARTY_DIR, 'soupsieve-1.9.5'),
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


def main(args=None):
    """Runs the tests."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)
        sys.path.insert(0, directory)

    import dev_appserver
    dev_appserver.fix_sys_path()

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
