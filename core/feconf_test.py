# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core/feconf.py."""

from __future__ import annotations

import os

from core import feconf
from core.tests import test_utils

from typing import Callable


class FeconfTests(test_utils.GenericTestBase):
    """Unit tests for core/feconf.py."""

    def test_dev_mode_in_production_throws_error(self) -> None:
        def mock_getenv(env: str) -> str:
            if env == 'SERVER_SOFTWARE':
                return 'Production'
            return 'Development'

        swap_getenv = self.swap(os, 'getenv', mock_getenv)
        with swap_getenv, self.assertRaisesRegex(
                Exception, 'DEV_MODE can\'t be true on production.'):
            feconf.check_dev_mode_is_true()

    def test_dev_mode_in_development_passes_succcessfully(self) -> None:
        def mock_getenv(*unused_args: str) -> str:
            return 'Development'

        swap_getenv = self.swap(os, 'getenv', mock_getenv)
        with swap_getenv:
            feconf.check_dev_mode_is_true()

    def test_get_empty_ratings(self) -> None:
        self.assertEqual(feconf.get_empty_ratings(), feconf._EMPTY_RATINGS) # pylint: disable=protected-access

    def test_callable_variables_return_correctly(self) -> None:
        recipient_username = 'Anshuman'
        self.assertEqual(
            feconf.DEFAULT_SALUTATION_HTML_FN(recipient_username),
            'Hi %s,' % recipient_username)

        sender_username = 'Ezio'
        self.assertEqual(
            feconf.DEFAULT_SIGNOFF_HTML_FN(sender_username),
            'Thanks!<br>%s (Oppia moderator)' % sender_username)

        self.assertEqual(
            feconf.VALID_MODERATOR_ACTIONS[
                'unpublish_exploration']['email_config'],
            'unpublish_exploration_email_html_body')
        self.assertEqual(
            feconf.VALID_MODERATOR_ACTIONS[
                'unpublish_exploration']['email_intent'],
            'unpublish_exploration')
        self.assertEqual(
            feconf.VALID_MODERATOR_ACTIONS[
                'unpublish_exploration']['email_subject_fn']('Test'),
            'Your Oppia exploration "Test" has been unpublished')
