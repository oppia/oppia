# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.job_test_utils."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils
from jobs import job_test_utils
import python_utils

from apache_beam.testing import util as beam_testing_util


class DecorateBeamErrorsTests(test_utils.TestBase):

    def assert_error_is_decorated(self, actual_msg, decorated_msg):
        """Asserts that decorate_beam_errors() raises with the right message.

        Args:
            actual_msg: str. The actual message raised originally.
            decorated_msg: str. The expected decorated message produced by the
                context manager.
        """
        try:
            with job_test_utils.decorate_beam_errors():
                raise beam_testing_util.BeamAssertException(actual_msg)
        except AssertionError as e:
            self.assertMultiLineEqual(python_utils.UNICODE(e), decorated_msg)

    def test_decorates_message_with_both_unexpected_and_missing(self):
        actual_msg = (
            'Error, unexpected elements ["abc", "def"], missing elements '
            '["123", "456"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Unexpected:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
            '\n'
            'Missing:\n'
            '    \'123\'\n'
            '    \'456\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_decorates_message_with_only_unexpected(self):
        actual_msg = (
            'Error, unexpected elements ["abc", "def"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Unexpected:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_decorates_message_with_only_missing(self):
        actual_msg = (
            'Error, missing elements ["abc", "def"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Missing:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_decorates_message_with_comparison_to_empty_list(self):
        actual_msg = (
            'Error [] == ["abc", "def"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Unexpected:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_does_not_decorate_message_without_element_info(self):
        actual_msg = 'Error something went wrong [while running FooJob]'

        self.assert_error_is_decorated(actual_msg, actual_msg)

    def test_does_not_decorate_message_with_invalid_unexpected_value(self):
        actual_msg = (
            'Error, unexpected elements [abc, def] [while running FooJob]')

        self.assert_error_is_decorated(actual_msg, actual_msg)

    def test_does_not_decorate_message_with_invalid_missing_value(self):
        actual_msg = 'Error, missing elements [abc, def] [while running FooJob]'

        self.assert_error_is_decorated(actual_msg, actual_msg)

    def test_does_not_decorate_message_with_non_beam_type(self):
        with self.assertRaisesRegexp(Exception, 'Error coming through!'):
            with job_test_utils.decorate_beam_errors():
                raise Exception('Error coming through!')
