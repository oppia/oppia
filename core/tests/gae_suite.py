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

sys.path.insert(1, os.getcwd())

from scripts import common # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')
THIRD_PARTY_PYTHON_LIBS_DIR = os.path.join(THIRD_PARTY_DIR, 'python_libs')

GOOGLE_APP_ENGINE_SDK_HOME = os.path.join(
    OPPIA_TOOLS_DIR, 'google-cloud-sdk-304.0.0', 'google-cloud-sdk', 'platform',
    'google_appengine')

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

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)
        sys.path.insert(0, directory)

    # The devappserver function fixes the system path by adding certain google
    # appengine libraries that we need in oppia to the system path. The Google
    # Cloud SDK comes with certain packages preinstalled including webapp2,
    # jinja2, and pyyaml so this function makes sure that those libraries are
    # installed.
    import dev_appserver
    dev_appserver.fix_sys_path()

    # In the process of migrating Oppia from Python 2 to Python 3, we are using
    # both google app engine apis that are contained in the Google Cloud SDK
    # folder, and also google cloud apis that are installed in our
    # 'third_party/python_libs' directory. Therefore, there is a confusion of
    # where the google module is located and which google module to import from.
    # The following code ensures that the google module that python looks at
    # imports from the 'third_party/python_libs' folder so that the imports are
    # correct.
    if 'google' in sys.modules:
        google_path = os.path.join(THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
        google_module = sys.modules['google']
        google_module.__path__ = [google_path]
        google_module.__file__ = os.path.join(google_path, '__init__.py')

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
