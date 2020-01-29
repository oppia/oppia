# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for gae_suite."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import unittest

from core.tests import gae_suite
from core.tests import test_utils


class GaeSuiteTests(test_utils.GenericTestBase):

    def test_cannot_create_test_suites_with_invalid_test_target_format(self):
        with self.assertRaisesRegexp(
            Exception, 'The delimiter in test_target should be a dot (.)'):
            gae_suite.create_test_suites(test_target='core/controllers')

    def test_create_test_suites(self):
        test_suite = gae_suite.create_test_suites(
            test_target='core.tests.gae_suite_test')
        self.assertEqual(len(test_suite), 1)
        self.assertEqual(type(test_suite[0]), unittest.suite.TestSuite)

    def test_cannot_add_directory_with_invalid_path(self):
        dir_to_add_swap = self.swap(
            gae_suite, 'DIRS_TO_ADD_TO_SYS_PATH', ['invalid_path'])
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Directory invalid_path does not exist.')
        with assert_raises_regexp_context_manager, dir_to_add_swap:
            gae_suite.main(args=[])

    def test_failing_tests(self):

        def _mock_create_test_suites(**unused_test_target):
            """Mocks create_test_suites()."""
            loader = unittest.TestLoader()
            return [loader.loadTestsFromName('core.tests.data.failing_tests')]

        create_test_suites_swap = self.swap(
            gae_suite, 'create_test_suites', _mock_create_test_suites)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception,
            'Test suite failed: 1 tests run, 0 errors, 1 failures.')

        with create_test_suites_swap, assert_raises_regexp_context_manager:
            gae_suite.main(args=[])

    def test_no_tests_run_with_invalid_filename(self):

        def _mock_create_test_suites(**unused_test_target):
            """Mocks create_test_suites()."""
            loader = unittest.TestLoader()
            return [loader.loadTestsFromName('invalid_test')]

        create_test_suites_swap = self.swap(
            gae_suite, 'create_test_suites', _mock_create_test_suites)
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'No module named invalid_test')

        with create_test_suites_swap, assert_raises_regexp_context_manager:
            gae_suite.main(args=[])
