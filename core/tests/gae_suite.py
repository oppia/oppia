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

from __future__ import annotations

import argparse
import os
import sys
import unittest

from typing import Final, List, Optional

sys.path.insert(1, os.getcwd())

from scripts import common # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

CURR_DIR: Final = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR: Final = os.path.join(CURR_DIR, '..', 'oppia_tools')
THIRD_PARTY_DIR: Final = os.path.join(CURR_DIR, 'third_party')
THIRD_PARTY_PYTHON_LIBS_DIR: Final = os.path.join(
    THIRD_PARTY_DIR, 'python_libs'
)

GOOGLE_APP_ENGINE_SDK_HOME: Final = os.path.join(
    OPPIA_TOOLS_DIR, 'google-cloud-sdk-335.0.0', 'google-cloud-sdk', 'platform',
    'google_appengine')

_PARSER: Final = argparse.ArgumentParser()
_PARSER.add_argument(
    '--test_target',
    help='optional dotted module name of the test(s) to run',
    type=str)


def create_test_suites(
    test_target: Optional[str] = None
) -> List[unittest.TestSuite]:
    """Creates test suites. If test_target is None, runs all tests.

    Args:
        test_target: str. The name of the test script.
            Default to None if not specified.

    Returns:
        list. A list of tests within the test script.

    Raises:
        Exception. The delimeter in the test_target should be a dot (.)
    """

    if test_target and '/' in test_target:
        raise Exception('The delimiter in test_target should be a dot (.)')

    loader = unittest.TestLoader()
    master_test_suite = (
        loader.loadTestsFromName(test_target)
        if test_target else
        loader.discover(
            CURR_DIR,
            pattern='[^core/tests/data]*_test.py',
            top_level_dir=CURR_DIR
        )
    )
    return [master_test_suite]


def main(args: Optional[List[str]] = None) -> None:
    """Runs the tests.

    Args:
        args: list. A list of arguments to parse.

    Raises:
        Exception. Directory invalid_path does not exist.
    """

    parsed_args = _PARSER.parse_args(args=args)
    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        if not os.path.exists(os.path.dirname(directory)):
            raise Exception('Directory %s does not exist.' % directory)
        sys.path.insert(0, directory)

    # Remove coverage from path since it causes conflicts with the Python html
    # library. The problem is that coverage library has a file named html.py,
    # then when bs4 library attempts to do 'from html.entities import ...',
    # it will fail with error "No module named 'html.entities';
    # 'html' is not a package". This happens because Python resolves to
    # the html.py file in coverage instead of the native html library.
    sys.path = [path for path in sys.path if 'coverage' not in path]

    suites = create_test_suites(
        test_target=parsed_args.test_target,
    )

    results = [unittest.TextTestRunner(verbosity=2).run(suite)
               for suite in suites]

    for result in results:
        if result.errors or result.failures:
            raise Exception(
                'Test suite failed: %s tests run, %s errors, %s failures.' % (
                    result.testsRun, len(result.errors), len(result.failures)))


if __name__ == '__main__':
    main()
