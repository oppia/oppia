# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

'''Tests for the controller managing incoming feedback reports.'''

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import incoming_app_feedback_report
from core.tests import test_utils
from core.platform import models

import feconf

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])

REPORT_JSON = {
    'android_report_info_schema_version': 1,
    'app_context': {
        'entry_point': {
            'entry_point_name' : 'navigation_drawer'
        },
        'text_size': 'large',
        'text_language_code': 'en',
        'audio_language_code': 'en',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'is_admin': False,
        'event_logs': ['example', 'event'],
        'logcat_logs': ['example', 'log']
    },
    'device_context': {
        'device_model': 'example_model',
        'sdk_version': 23,
        'build_fingerprint': 'example_fingerprint_id',
        'network_type': 'wifi'
    },
    'report_submission_timestamp_sec': 1610519337,
    'report_submission_utc_offset_hrs': 0,
    'system_context': {
        'platform_version': '0.1-alpha-abcdef1234',
        'package_version_code': 1,
        'country_locale_code': 'in',
        'language_locale_code': 'en'
    },
    'user_supplied_feedback': {
        'report_type': 'suggestion',
        'category': 'language_suggestion',
        'user_feedback_selected_items': [],
        'user_feedback_other_text_input': 'french'
    }
}


class IncomingAndroidFeedbackReportHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(IncomingAndroidFeedbackReportHandlerTests, self).setUp()
        self.payload = {
            'report': REPORT_JSON
        }
        self.headers = {
            'api_key': feconf.ANDROID_API_KEY,
            'app_package_name': feconf.ANDROID_APP_PACKAGE_NAME,
            'app_version_name': feconf.ANDROID_APP_VERSION_NAME,
            'app_version_code': feconf.ANDROID_APP_VERSION_CODE
        }
        self.csrf_token = self.get_new_csrf_token()

    def test_incoming_report_saves_to_storage(self):
        self.post_json(
            feconf.INCOMING_APP_FEEDBACK_REPORT_URL, self.payload,
            headers=self.headers, csrf_token=self.csrf_token)

        all_reports = (
            app_feedback_report_models.AppFeedbackReportModel.get_all())
        self.assertTrue(len(all_reports), 1)

        report_model = all_reports[0]
        self.assertEqual(report_model.platform, 'android')
        self.assertEqual(
            report_model.submitted_on,
            datetime.datetime.fromtimestamp(1610519337))


    def test_incoming_report_with_invalid_headers_raises_exception(self):
        with self.assertRaisesRegexp(
            incoming_app_feedback_report.UnauthorizedRequestException,
            'The incoming request does not have valid authentication'):
            self.post_json(
                url=feconf.INCOMING_APP_FEEDBACK_REPORT_URL,
                payload=self.payload, csrf_token=self.csrf_token)
