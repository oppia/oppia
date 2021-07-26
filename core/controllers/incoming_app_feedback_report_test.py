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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
from core.tests import test_utils

import feconf

from typing import Dict, Any, Text # isort:skip # pylint: disable=unused-import

(app_feedback_report_models,) = models.Registry.import_models( # type: ignore[no-untyped-call]
    [models.NAMES.app_feedback_report])

REPORT_JSON = {
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
        'user_feedback_selected_items': None,
        'user_feedback_other_text_input': 'french'
    }
}

# Webtest requires explicit str-types rather than UNICODE for headers.
ANDROID_API_KEY_STRING = str(feconf.ANDROID_API_KEY) # pylint: disable=disallowed-function-calls
ANDROID_APP_PACKAGE_NAME_STRING = str(feconf.ANDROID_APP_PACKAGE_NAME) # pylint: disable=disallowed-function-calls
ANDROID_APP_VERSION_NAME_STRING = str(feconf.ANDROID_APP_VERSION_NAME) # pylint: disable=disallowed-function-calls
ANDROID_APP_VERSION_CODE_STRING = str(feconf.ANDROID_APP_VERSION_CODE) # pylint: disable=disallowed-function-calls


class IncomingAndroidFeedbackReportHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        # type: () -> None
        super(IncomingAndroidFeedbackReportHandlerTests, self).setUp() # type: ignore[no-untyped-call]
        self.payload = {
            'report': REPORT_JSON
        }
        # Webapp header values must be Python str types otherwise an
        # AssertionError for "not a string" is thrown.
        self.headers = {
            'api_key': ANDROID_API_KEY_STRING,
            'app_package_name': ANDROID_APP_PACKAGE_NAME_STRING,
            'app_version_name': ANDROID_APP_VERSION_NAME_STRING,
            'app_version_code': ANDROID_APP_VERSION_CODE_STRING
        }

    def test_incoming_report_saves_to_storage(self):
        # type: () -> None
        self._post_json_with_test_headers(self.payload)

        all_reports = (
            app_feedback_report_models.AppFeedbackReportModel.get_all().fetch())
        self.assertEqual(len(all_reports), 1)
        report_model = all_reports[0]

        self.assertEqual(report_model.platform, 'android')
        self.assertEqual(
            report_model.submitted_on,
            datetime.datetime.fromtimestamp(1615519337))

    def test_incoming_report_with_no_report_raises_error(self):
        # type: () -> None
        empty_report = {'report': None}
        response = self._post_json_with_test_headers(
            empty_report, expected_status=400)
        self.assertEqual(
            response['error'], 'A report must be sent in the request.')

    def test_incoming_report_with_invalid_headers_raises_exception(self):
        # type: () -> None
        token = self.get_new_csrf_token() # type: ignore[no-untyped-call]
        # Webtest requires explicit str-types headers.
        invalid_headers = {
            'api_key': str('bad_key'), # pylint: disable=disallowed-function-calls
            'app_package_name': str('bad_package_name'), # pylint: disable=disallowed-function-calls
            'app_version_name': str('bad_version_name'), # pylint: disable=disallowed-function-calls
            'app_version_code': str('bad_version_code'), # pylint: disable=disallowed-function-calls
        }
        response = self.post_json( # type: ignore[no-untyped-call]
            feconf.INCOMING_ANDROID_FEEDBACK_REPORT_URL, self.payload,
            headers=invalid_headers, csrf_token=token, expected_status_int=401)
        self.assertEqual(
            response['error'],
            'The incoming request does not have valid authentication for '
            'Oppia Android.')

    def test_incoming_report_with_no_headers_raises_exception(self):
        # type: () -> None
        token = self.get_new_csrf_token() # type: ignore[no-untyped-call]
        self.post_json( # type: ignore[no-untyped-call]
            feconf.INCOMING_ANDROID_FEEDBACK_REPORT_URL, self.payload,
            csrf_token=token, expected_status_int=500)

    def _post_json_with_test_headers(self, payload, expected_status=200):
        # type: (Dict[Text, Any], int) -> Dict[Text, Any]
        """Sends a post request usint str-type representations of the header
        values so that header validation is successful.

        Args:
            payload: dict. The request payload of a feedback report.
            expected_status: int. The expected response status of the
                request.

        Returns:
            dict. The JSON response for the request in dict form.
        """
        # Webapp requires the header values to be str-types, so they must have
        # parity for the tests correctly check these fields.
        token = self.get_new_csrf_token() # type: ignore[no-untyped-call]
        with self.swap(feconf, 'ANDROID_API_KEY', ANDROID_API_KEY_STRING):
            with self.swap(
                feconf, 'ANDROID_APP_PACKAGE_NAME',
                ANDROID_APP_PACKAGE_NAME_STRING):
                with self.swap(
                    feconf, 'ANDROID_APP_VERSION_NAME',
                    ANDROID_APP_VERSION_NAME_STRING):
                    with self.swap(
                        feconf, 'ANDROID_APP_VERSION_CODE',
                        ANDROID_APP_VERSION_CODE_STRING):
                        return ( # type: ignore[no-any-return]
                            self.post_json( # type: ignore[no-untyped-call]
                                feconf.INCOMING_ANDROID_FEEDBACK_REPORT_URL,
                                payload, headers=self.headers,
                                csrf_token=token,
                                expected_status_int=expected_status))
