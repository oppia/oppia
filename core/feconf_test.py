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

"""Unit tests for core/feconf.py"""

from __future__ import annotations

import os

from core.tests import test_utils


class FeconfTests(test_utils.GenericTestBase):

    def test_dev_mode_in_production_throws_error(self) -> None:
        def mock_getenv(env: str):
            if env == 'SERVER_SOFTWARE':
                return 'Production'
            return 'Development'

        swap_getenv = self.swap(os, 'getenv', mock_getenv)
        with swap_getenv, self.assertRaisesRegex(
                Exception, 'DEV_MODE can\'t be true on production.'):
            from core import feconf # pylint: disable=unused-import

    def test_get_empty_ratings(self) -> None:
        from core import feconf
        self.assertEqual(feconf.get_empty_ratings(), feconf._EMPTY_RATINGS) # pylint: disable=protected-access

    def test_callable_variables_return_correctly(self) -> None:
        from core import feconf
        recipient_username = 'Anshuman'
        self.assertEqual(
            feconf.DEFAULT_SALUTATION_HTML_FN(recipient_username),
            'Hi %s,' % recipient_username)

        sender_username = 'Ezio'
        self.assertEqual(
            feconf.DEFAULT_SIGNOFF_HTML_FN(sender_username),
            'Thanks!<br>%s (Oppia moderator)' % sender_username)
