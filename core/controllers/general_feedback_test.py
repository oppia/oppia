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

"""Tests for controllers for web feedback threads, messages, and session logs."""

from __future__ import annotations

from unittest import mock

from core import feconf
from core.domain import (
    captcha_services,
    exp_fetchers,
    fs_services,
    general_feedback_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Dict

models.Registry.import_models([models.Names.GENERAL_FEEDBACK])


class GeneralFeedbackSubmitHandlerTests(test_utils.GenericTestBase):
    """Tests for GeneralFeedbackSubmitHandler."""

    EXP_ID = 'exp_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.save_new_valid_exploration(self.EXP_ID, self.editor_id)

    # Here we use object because feedback payload values include multiple JSON
    # scalar types and nested dictionaries.
    def _get_base_payload(self) -> Dict[str, object]:
        """Returns a valid platform feedback submission payload."""
        return {
            'category': 'platform',
            'description': 'The page did not load correctly.',
            'page_url': 'https://www.oppia.org/learn',
            'language_code': 'en',
            'rating': 4,
            'target_type': 'general',
            'target_id': None,
            'submit_anonymously': True,
            'include_session_info': False,
            'captcha_token': None,
            'screenshot_filename': None,
            'screenshot_file': None,
            'session_info': None,
        }

    # Here we use object because session diagnostics are heterogeneous
    # JSON-like values nested under stable top-level keys.
    def _get_valid_session_info(self) -> Dict[str, object]:
        """Returns valid browser session diagnostics."""
        return {
            'console_logs_json': [
                {
                    'error_message': 'Console error.',
                    'timestamp_msecs': 1,
                    'log_level': 'error',
                    'stack_trace': 'stack',
                }
            ],
            'failed_requests_json': [
                {
                    'url': 'https://www.oppia.org/api',
                    'method': 'GET',
                    'status_code': 500,
                    'timestamp_msecs': 2,
                    'status_text': 'Server Error',
                    'error_message': 'Request failed.',
                }
            ],
            'navigation_history_json': [
                {
                    'path': '/learn',
                    'timestamp_msecs': 3,
                }
            ],
            'environment_json': {
                'client_time_msecs': 4,
                'timezone_offset_mins': 0,
                'user_agent': 'Mozilla/5.0',
                'viewport': {
                    'width': 1024,
                    'height': 768,
                },
                'page': {
                    'url': 'https://www.oppia.org/learn',
                    'title': 'Learn',
                },
                'locale': {
                    'language_code': 'en',
                    'direction': 'ltr',
                },
            },
        }

    def test_submit_platform_feedback_successfully(self) -> None:
        create_thread_mock = mock.Mock(return_value='thread_id')
        csrf_token = self.get_new_csrf_token()
        payload = self._get_base_payload()
        payload['captcha_token'] = 'valid-token'
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ):
            with self.swap(
                general_feedback_services, 'create_thread', create_thread_mock
            ):
                response = self.post_json(
                    feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                    payload,
                    csrf_token=csrf_token,
                    expected_status_int=200,
                )

        self.assertEqual(response, {'success': True, 'thread_id': 'thread_id'})
        create_thread_mock.assert_called_once_with(
            category='platform',
            description='The page did not load correctly.',
            page_url='https://www.oppia.org/learn',
            language_code='en',
            rating=4,
            target_type='general',
            target_id=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            user_id=None,
            session_info=None,
        )

    def test_submit_feedback_with_valid_captcha_token(self) -> None:
        payload = self._get_base_payload()
        payload['captcha_token'] = 'valid-token'
        create_thread_mock = mock.Mock(return_value='thread_id')
        verify_token_mock = mock.Mock(return_value=True)
        csrf_token = self.get_new_csrf_token()
        with self.swap(
            captcha_services, 'verify_turnstile_token', verify_token_mock
        ):
            with self.swap(
                general_feedback_services, 'create_thread', create_thread_mock
            ):
                response = self.post_json(
                    feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                    payload,
                    csrf_token=csrf_token,
                    expected_status_int=200,
                )

        self.assertEqual(response['thread_id'], 'thread_id')
        verify_token_mock.assert_called_once_with('valid-token')

    def test_submit_feedback_rejects_invalid_captcha_token(self) -> None:
        payload = self._get_base_payload()
        payload['captcha_token'] = 'invalid-token'
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', False
        ):
            response = self.post_json(
                feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                payload,
                csrf_token=csrf_token,
                expected_status_int=400,
            )

        self.assertEqual(response['error'], 'Invalid captcha token.')

    def test_submit_feedback_rejects_missing_captcha_token(self) -> None:
        payload = self._get_base_payload()
        payload['captcha_token'] = None
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', False
        ):
            response = self.post_json(
                feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                payload,
                csrf_token=csrf_token,
                expected_status_int=400,
            )

        self.assertEqual(
            response['error'], 'Captcha token is required for logged-out users.'
        )

    def test_submit_lesson_feedback_successfully(self) -> None:
        payload = self._get_base_payload()
        payload.update(
            {
                'category': 'lesson',
                'target_type': 'exploration',
                'target_id': self.EXP_ID,
            }
        )
        payload['captcha_token'] = 'valid-token'
        create_thread_mock = mock.Mock(return_value='lesson_thread_id')
        csrf_token = self.get_new_csrf_token()

        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ):
            with self.swap(
                general_feedback_services, 'create_thread', create_thread_mock
            ):
                response = self.post_json(
                    feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                    payload,
                    csrf_token=csrf_token,
                    expected_status_int=200,
                )

        self.assertEqual(
            response, {'success': True, 'thread_id': 'lesson_thread_id'}
        )
        self.assertEqual(
            create_thread_mock.call_args.kwargs['target_id'], self.EXP_ID
        )

    def test_submit_lesson_feedback_rejects_invalid_exploration_id(
        self,
    ) -> None:
        payload = self._get_base_payload()
        payload.update(
            {
                'category': 'lesson',
                'target_type': 'exploration',
                'target_id': 'missing_exp_id',
            }
        )
        payload['captcha_token'] = 'valid-token'
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ):
            with self.swap_to_always_return(
                exp_fetchers, 'get_exploration_by_id', None
            ):
                response = self.post_json(
                    feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                    payload,
                    csrf_token=csrf_token,
                    expected_status_int=400,
                )

        self.assertEqual(
            response['error'],
            'Invalid target_id for lesson feedback, target_id is not a valid '
            'exploration id.',
        )

    def test_submit_feedback_with_screenshot_successfully(self) -> None:
        payload = self._get_base_payload()
        payload.update(
            {
                'screenshot_filename': 'feedback.png',
                'screenshot_file': {'feedback.png': 'aGVsbG8='},
            }
        )
        payload['captcha_token'] = 'valid-token'

        create_thread_mock = mock.Mock(return_value='thread_id')
        validate_and_save_image_mock = mock.Mock()
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ):
            with self.swap(
                fs_services,
                'validate_and_save_image',
                validate_and_save_image_mock,
            ):
                with self.swap(
                    general_feedback_services,
                    'create_thread',
                    create_thread_mock,
                ):
                    self.post_json(
                        feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                        payload,
                        csrf_token=csrf_token,
                        expected_status_int=200,
                    )

        validate_and_save_image_mock.assert_called_once()
        self.assertEqual(
            validate_and_save_image_mock.call_args.args[1], 'feedback.png'
        )
        self.assertEqual(
            create_thread_mock.call_args.kwargs['screenshot_filename'],
            'feedback.png',
        )
        self.assertIsNotNone(
            create_thread_mock.call_args.kwargs['screenshot_entity_id']
        )

    def test_submit_feedback_rejects_screenshot_when_save_fails(self) -> None:
        payload = self._get_base_payload()
        payload.update(
            {
                'screenshot_filename': 'feedback.png',
                'screenshot_file': {'feedback.png': 'aGVsbG8='},
            }
        )
        payload['captcha_token'] = 'valid-token'
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ):
            with self.swap(
                fs_services,
                'validate_and_save_image',
                mock.Mock(side_effect=Exception('save failed')),
            ):
                response = self.post_json(
                    feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                    payload,
                    csrf_token=csrf_token,
                    expected_status_int=500,
                )

        self.assertEqual(response['error'], 'save failed')

    def test_submit_non_anonymous_feedback_uses_logged_in_user_id(self) -> None:
        payload = self._get_base_payload()
        payload.update(
            {
                'submit_anonymously': False,
                'include_session_info': True,
                'session_info': self._get_valid_session_info(),
            }
        )
        create_thread_mock = mock.Mock(return_value='thread_id')

        self.login(self.EDITOR_EMAIL)
        with self.swap(
            general_feedback_services, 'create_thread', create_thread_mock
        ):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                feconf.GENERAL_FEEDBACK_SUBMISSION_URL,
                payload,
                csrf_token=csrf_token,
                expected_status_int=200,
            )
        self.logout()

        self.assertEqual(
            create_thread_mock.call_args.kwargs['user_id'], self.editor_id
        )
        self.assertEqual(
            create_thread_mock.call_args.kwargs['session_info'],
            self._get_valid_session_info(),
        )


class GeneralFeedbackCaptchaConfigHandlerTests(test_utils.GenericTestBase):
    """Tests for GeneralFeedbackCaptchaConfigHandler."""

    def test_get_captcha_config_returns_site_key(self) -> None:
        with self.swap_to_always_return(
            captcha_services, 'get_turnstile_site_key', 'site-key'
        ):
            response = self.get_json(feconf.GENERAL_FEEDBACK_CAPTCHA_CONFIG_URL)

        self.assertEqual(response, {'site_key': 'site-key'})
