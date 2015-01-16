# coding: utf-8
#
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

"""Tests for the base interaction specification."""

__author__ = 'Sean Lip'

from core.tests import test_utils
from extensions.interactions import base


class AnswerHandlerUnitTests(test_utils.GenericTestBase):
    """Test the AnswerHandler domain object."""

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = base.AnswerHandler('submit', 'Null')
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler = base.AnswerHandler(
            'submit', 'NonnegativeInt')
        self.assertEqual(len(answer_handler.rules), 1)

        with self.assertRaisesRegexp(Exception, 'not a valid object class'):
            base.AnswerHandler('submit', 'FakeObjType')
