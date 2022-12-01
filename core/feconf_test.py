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

import datetime
import os

from core import feconf
from core.tests import test_utils

import bs4


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
        self.assertEqual(
            feconf.get_empty_ratings(),
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

    def test_callable_variables_return_correctly(self) -> None:
        recipient_username = 'Anshuman'
        self.assertEqual(
            feconf.DEFAULT_SALUTATION_HTML_FN(recipient_username),
            'Hi %s,' % recipient_username)

        sender_username = 'Ezio'
        self.assertEqual(
            feconf.DEFAULT_SIGNOFF_HTML_FN(sender_username),
            'Thanks!<br>%s (Oppia moderator)' % sender_username)

        exploration_title = 'Test'
        self.assertEqual(
            feconf.DEFAULT_EMAIL_SUBJECT_FN(exploration_title),
            'Your Oppia exploration "Test" has been unpublished')

        self.assertEqual(
            feconf.VALID_MODERATOR_ACTIONS[
                'unpublish_exploration']['email_config'],
            'unpublish_exploration_email_html_body')
        self.assertEqual(
            feconf.VALID_MODERATOR_ACTIONS[
                'unpublish_exploration']['email_intent'],
            'unpublish_exploration')

    def test_terms_page_last_updated_is_in_sync_with_terms_page(self) -> None:
        with open(
            'core/templates/pages/terms-page/terms-page.component.html',
            'r',
            encoding='utf-8'
        ) as f:
            terms_page_contents = f.read()
            terms_page_parsed_html = bs4.BeautifulSoup(
                terms_page_contents, 'html.parser')
            max_date = max(
                datetime.datetime.strptime(
                    element.get_text().split(':')[0], '%d %b %Y'
                ) for element in terms_page_parsed_html.find(
                    'ul', class_='e2e-test-changelog'
                ).find_all('li')
            )
        self.assertEqual(
            feconf.TERMS_PAGE_LAST_UPDATED_UTC, max_date)
