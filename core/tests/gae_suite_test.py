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

import unittest

from core.tests import test_utils
from core.tests import gae_suite


class GaeSuiteTests(test_utils.GenericTestBase):

    def test_cannot_create_test_suites_with_invalid_test_target_format(self):
        with self.assertRaisesRegexp(
            Exception, 'The delimiter in test_target should be a dot (.)'):
            gae_suite.create_test_suites('core/controllers')

    def test_create_test_suites(self):
        test_suite = gae_suite.create_test_suites('core.controllers.admin_test')
        self.assertEqual(len(test_suite), 1)
        self.assertEqual(type(test_suite[0]), unittest.suite.TestSuite)

    def test_cannot_add_directory_with_invalid_path(self):
        dir_to_add_swap = self.swap(
            gae_suite, 'DIRS_TO_ADD_TO_SYS_PATH', ['invalid_path'])
        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'Directory invalid_path does not exist.')
        with assert_raises_regexp_context_manager, dir_to_add_swap:
            gae_suite.main()
