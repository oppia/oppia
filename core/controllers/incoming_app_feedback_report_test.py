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

"""Tests for the controller managing incoming feedback reports."""

from __future__ import annotations

import datetime

from core import android_validation_constants
from core.domain import app_feedback_report_domain
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_feedback_report_models

(app_feedback_report_models,) = models.Registry.import_models(
    [models.Names.APP_FEEDBACK_REPORT])

REPORT_JSON: app_feedback_report_domain.AndroidFeedbackReportDict = {
    'platform_type': 'android',
    'android_report_info_schema_version': 1,
    'app_context': {
        'entry_point': {
            'entry_point_name': 'navigation_drawer',
            'entry_point_exploration_id': None,
            'entry_point_story_id': None,
            'entry_point_topic_id': None,
            'entry_point_subtopic_id': None,
        },
        'text_size': 'large_text_size',
        'text_language_code': 'en',
        'audio_language_code': 'en',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'account_is_profile_admin': False,
        'event_logs': ['example', 'event'],
        'logcat_logs': ['example', 'log']
    },
    'device_context': {
        'android_device_model': 'example_model',
        'android_sdk_version': 23,
        'build_fingerprint': 'example_fingerprint_id',
        'network_type': 'wifi'
    },
    'report_submission_timestamp_sec': 1615519337,
    'report_submission_utc_offset_hrs': 0,
    'system_context': {
        'platform_version': '0.1-alpha-abcdef1234',
        'package_version_code': 1,
        'android_device_country_locale_code': 'in',
        'android_device_language_locale_code': 'en'
    },
    'user_supplied_feedback': {
        'report_type': 'suggestion',
        'category': 'language_suggestion',
        'user_feedback_selected_items': [],
        'user_feedback_other_text_input': 'french'
    }
}

# Webtest requires explicit str-types rather than UNICODE for headers.
ANDROID_API_KEY_STRING = str(android_validation_constants.ANDROID_API_KEY) # pylint: disable=disallowed-function-calls
ANDROID_APP_PACKAGE_NAME_STRING = str( # pylint: disable=disallowed-function-calls
    android_validation_constants.ANDROID_APP_PACKAGE_NAME)
ANDROID_APP_VERSION_NAME_STRING = str('1.0.0-flavor-commithash') # pylint: disable=disallowed-function-calls
ANDROID_APP_VERSION_CODE_STRING = str('2') # pylint: disable=disallowed-function-calls


class IncomingAndroidFeedbackReportHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.payload = {
            'report': REPORT_JSON
        }

    def test_incoming_report_saves_to_storage(self) -> None:
        # Webapp header values must be Python str types otherwise an
        # AssertionError for "not a string" is thrown.
        headers = {
            'api_key': ANDROID_API_KEY_STRING,
            'app_package_name': ANDROID_APP_PACKAGE_NAME_STRING,
            'app_version_name': ANDROID_APP_VERSION_NAME_STRING,
            'app_version_code': ANDROID_APP_VERSION_CODE_STRING
        }
        self._post_json_with_test_headers(self.payload, headers)

        report_model_class = app_feedback_report_models.AppFeedbackReportModel
        all_reports: Sequence[
            app_feedback_report_models.AppFeedbackReportModel] = (
                report_model_class.get_all().fetch())
        self.assertEqual(len(all_reports), 1)
        report_model: app_feedback_report_models.AppFeedbackReportModel = (
            all_reports[0])

        self.assertEqual(report_model.platform, 'android')
        self.assertEqual(
            report_model.submitted_on,
            datetime.datetime.fromtimestamp(1615519337))

    def test_incoming_report_with_invalid_headers_raises_exception(
        self
    ) -> None:
        token = self.get_new_csrf_token()
        # Webtest requires explicit str-types headers.
        invalid_headers = {
            'api_key': str('bad_key'), # pylint: disable=disallowed-function-calls
            'app_package_name': str('bad_package_name'), # pylint: disable=disallowed-function-calls
            'app_version_name': str('bad_version_name'), # pylint: disable=disallowed-function-calls
            'app_version_code': str('bad_version_code'), # pylint: disable=disallowed-function-calls
        }
        response = self.post_json(
            android_validation_constants.INCOMING_ANDROID_FEEDBACK_REPORT_URL,
            self.payload, headers=invalid_headers, csrf_token=token,
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'The incoming request is not a valid Oppia Android request.')

    def test_incoming_report_with_no_headers_raises_exception(self) -> None:
        token = self.get_new_csrf_token()
        self.post_json(
            android_validation_constants.INCOMING_ANDROID_FEEDBACK_REPORT_URL,
            self.payload, csrf_token=token, expected_status_int=500)

    # Here we use type Any because this method can return JSON response Dict
    # whose values can contain different types of values, like int, bool,
    # str and other types too.
    def _post_json_with_test_headers(
            self,
            payload: Dict[
                str, app_feedback_report_domain.AndroidFeedbackReportDict
            ],
            headers: Dict[str, str],
            expected_status: int=200
    ) -> Dict[str, Any]:
        """Sends a post request usint str-type representations of the header
        values so that header validation is successful.

        Args:
            payload: dict. The request payload of a feedback report.
            headers: dict. The request headers; values must be str-type for
                webtest to properly parse them.
            expected_status: int. The expected response status of the
                request.

        Returns:
            dict. The JSON response for the request in dict form.
        """
        # Webapp requires the header values to be str-types, so they must have
        # parity for the tests to correctly check these fields.
        token = self.get_new_csrf_token()
        with self.swap(
            android_validation_constants, 'ANDROID_API_KEY',
            ANDROID_API_KEY_STRING):
            with self.swap(
                android_validation_constants, 'ANDROID_APP_PACKAGE_NAME',
                ANDROID_APP_PACKAGE_NAME_STRING):
                return (
                    self.post_json(
                        android_validation_constants.INCOMING_ANDROID_FEEDBACK_REPORT_URL, # pylint: disable=line-too-long
                        payload, headers=headers, csrf_token=token,
                        expected_status_int=expected_status
                    )
                )
