# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for web user feedback thread and message domain objects."""

from __future__ import annotations

import datetime

from core import utils
from core.domain import general_feedback_domain
from core.tests import test_utils

from typing import Dict


class WebFeedbackThreadDomainUnitTests(test_utils.GenericTestBase):
    EXP_ID = 'exp0'
    ENTITY_ID = 'entity_id_123'
    THREAD_ID1 = 'exploration.exp0.thread0'
    THREAD_ID2 = 'general.entity_id_123.thread1'
    # Here we use object because session-info payloads contain heterogeneous
    # nested JSON-like values (dicts, lists, strings, ints).
    SESSION_INFO: Dict[str, object] = {
        'console_logs_json': [
            {
                'error_message': 'TypeError: Cannot read properties of undefined',
                'log_level': 'error',
                'timestamp_msecs': 1767225600000,
                'stack_trace': (
                    'TypeError: Cannot read properties of undefined\n'
                    ' at FeedbackComponent.submit (feedback.component.ts:45)'
                ),
            }
        ],
        'failed_requests_json': [
            {
                'url': '/createhandler/web_feedback',
                'method': 'POST',
                'status_code': 500,
                'timestamp_msecs': 1767225601000,
                'status_text': 'Internal Server Error',
                'error_message': 'Request failed with status code 500',
            }
        ],
        'navigation_history_json': [
            {
                'path': '/learn/math',
                'timestamp_msecs': 1767225590000,
            },
            {
                'path': '/explore/exp0',
                'timestamp_msecs': 1767225600000,
            },
        ],
        'environment_json': {
            'client_time_msecs': 1767225602000,
            'timezone_offset_mins': -330,
            'user_agent': (
                'Mozilla/5.0 (X11; Linux x86_64) '
                'AppleWebKit/537.36 Chrome/136.0 Safari/537.36'
            ),
            'viewport': {
                'width': 1920,
                'height': 1080,
            },
            'page': {
                'url': 'http://oppia.org/explore/exp0',
                'title': 'Fractions Exploration',
            },
            'locale': {
                'language_code': 'en',
                'direction': 'ltr',
            },
        },
    }

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_to_dict_for_lesson_category(self) -> None:
        fake_date = datetime.datetime(2026, 1, 1, 0, 0, 0, 0)
        expected_thread_dict: general_feedback_domain.WebFeedbackThreadDict = {
            'id': self.THREAD_ID1,
            'category': 'lesson',
            'description': 'test description',
            'page_url': 'http://oppia.org/explore/exp0',
            'language_code': 'en',
            'status': 'open',
            'rating': 4,
            'target_type': 'exploration',
            'target_id': self.EXP_ID,
            'has_screenshot': True,
            'session_info': self.SESSION_INFO,
            'user_id': self.viewer_id,
            'message_count': 1,
            'messages': [
                {
                    'message_index': 0,
                    'author_id': self.viewer_id,
                    'author_status': 'user',
                    'text': 'test message',
                    'updated_status': None,
                    'screenshot_filename': 'test_screenshot.png',
                    'screenshot_entity_id': 'entity_id_123',
                    'created_on_msecs': utils.get_time_in_millisecs(fake_date),
                }
            ],
            'created_on_msecs': utils.get_time_in_millisecs(fake_date),
        }

        observed_thread = general_feedback_domain.WebFeedbackThread(
            self.THREAD_ID1,
            'lesson',
            'test description',
            'http://oppia.org/explore/exp0',
            'en',
            'open',
            4,
            True,
            'exploration',
            self.EXP_ID,
            1,
            [
                general_feedback_domain.WebFeedbackMessage(
                    0,
                    self.viewer_id,
                    'user',
                    'test message',
                    None,
                    'test_screenshot.png',
                    'entity_id_123',
                    utils.get_time_in_millisecs(fake_date),
                )
            ],
            utils.get_time_in_millisecs(fake_date),
            self.SESSION_INFO,
            self.viewer_id,
        )
        self.assertDictEqual(expected_thread_dict, observed_thread.to_dict())
        self.assertDictEqual(
            {
                'id': self.THREAD_ID1,
                'category': 'lesson',
                'status': 'open',
                'rating': 4,
                'target_type': 'exploration',
                'target_id': self.EXP_ID,
                'has_screenshot': True,
                'has_session_info': True,
                'description_preview': 'test description',
                'created_on_msecs': utils.get_time_in_millisecs(fake_date),
            },
            observed_thread.to_summary_dict(),
        )

    def test_to_dict_for_platform_category(self) -> None:
        fake_date = datetime.datetime(2026, 1, 1, 0, 0, 0, 0)
        expected_thread_dict: general_feedback_domain.WebFeedbackThreadDict = {
            'id': self.THREAD_ID2,
            'category': 'platform',
            'description': 'test description',
            'page_url': 'http://oppia.org/explore/exp0',
            'language_code': 'en',
            'status': 'open',
            'rating': 4,
            'target_type': 'general',
            'target_id': self.ENTITY_ID,
            'has_screenshot': True,
            'session_info': self.SESSION_INFO,
            'user_id': self.viewer_id,
            'message_count': 1,
            'messages': [
                {
                    'message_index': 0,
                    'author_id': self.viewer_id,
                    'author_status': 'user',
                    'text': 'test message',
                    'updated_status': None,
                    'screenshot_filename': 'test_screenshot.png',
                    'screenshot_entity_id': 'entity_id_123',
                    'created_on_msecs': utils.get_time_in_millisecs(fake_date),
                }
            ],
            'created_on_msecs': utils.get_time_in_millisecs(fake_date),
        }

        observed_thread = general_feedback_domain.WebFeedbackThread(
            self.THREAD_ID2,
            'platform',
            'test description',
            'http://oppia.org/explore/exp0',
            'en',
            'open',
            4,
            True,
            'general',
            self.ENTITY_ID,
            1,
            [
                general_feedback_domain.WebFeedbackMessage(
                    0,
                    self.viewer_id,
                    'user',
                    'test message',
                    None,
                    'test_screenshot.png',
                    'entity_id_123',
                    utils.get_time_in_millisecs(fake_date),
                )
            ],
            utils.get_time_in_millisecs(fake_date),
            self.SESSION_INFO,
            self.viewer_id,
        )
        self.assertDictEqual(expected_thread_dict, observed_thread.to_dict())


class WebFeedbackMessageDomainUnitTests(test_utils.GenericTestBase):
    EXP_ID = 'exp0'
    MESSAGE_INDEX = 0
    THREAD_ID = 'exploration.exp0.thread0'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_to_dict(self) -> None:
        fake_date = datetime.datetime(2026, 1, 1, 0, 0, 0, 0)
        expected_message_dict: (
            general_feedback_domain.WebFeedbackMessageDict
        ) = {
            'message_index': self.MESSAGE_INDEX,
            'author_id': self.viewer_id,
            'author_status': 'user',
            'text': 'test message',
            'updated_status': None,
            'screenshot_filename': 'test_screenshot.png',
            'screenshot_entity_id': 'entity_id_123',
            'created_on_msecs': utils.get_time_in_millisecs(fake_date),
        }
        observed_message = general_feedback_domain.WebFeedbackMessage(
            self.MESSAGE_INDEX,
            self.viewer_id,
            'user',
            'test message',
            None,
            'test_screenshot.png',
            'entity_id_123',
            utils.get_time_in_millisecs(fake_date),
        )
        self.assertDictEqual(expected_message_dict, observed_message.to_dict())
