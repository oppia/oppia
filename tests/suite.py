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

"""This script runs all Oppia tests."""

__author__ = 'Sean Lip'

import os
import sys
import unittest

EXPECTED_TEST_COUNT = 68


def main():
    """Runs the tests."""

    # TODO(sll): Check if the next dir is valid.
    sdk_path = os.path.join(
        os.getcwd(), '..', 'oppia_runtime', 'google_appengine_1.7.7',
        'google_appengine')
    sys.path.insert(0, sdk_path)

    import dev_appserver
    dev_appserver.fix_sys_path()

    root_dir = os.path.realpath(os.path.join(os.getcwd()))
    suite = unittest.loader.TestLoader().discover(
        root_dir, pattern='*_test.py', top_level_dir=root_dir)
    result = unittest.TextTestRunner(verbosity=2).run(suite)

    suite2 = unittest.loader.TestLoader().discover(
        root_dir, pattern='tests.py', top_level_dir=root_dir)
    result2 = unittest.TextTestRunner(verbosity=2).run(suite2)

    if result.errors or result.failures or result2.errors or result2.failures:
        raise Exception(
            'Functional test suite failed: %s errors, %s failures of '
            ' %s tests run.' % (
                len(result.errors), len(result.failures), result.testsRun))

    if result.testsRun + result2.testsRun != EXPECTED_TEST_COUNT:
        raise Exception('Expected %s tests to be run, not %s.' %
                        (EXPECTED_TEST_COUNT, result.testsRun + result2.testsRun))


if __name__ == '__main__':
    main()
