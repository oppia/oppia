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

"""Tests for app feedback reporting domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import app_feedback_report_domain
from core.domain import app_feedback_report_services
from core.tests import test_utils
from core.platform import models

import feconf
import python_utils
import utils

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])


USER_1_EMAIL = 'some@email.com'
USER_1_USERNAME = 'username1'
# The timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615151836)
# The timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)
TICKET_CREATION_TIMESTAMP_MSEC = utils.get_time_in_millisecs(
    TICKET_CREATION_TIMESTAMP)

PLATFORM_ANDROID = 'android'
PLATFORM_WEB = 'web'
TICKET_ID = '%s.%s.%s' % (
    'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC), '16CharString1234')
REPORT_TYPE_SUGGESTION = 'suggestion'
CATEGORY_OTHER = 'suggestion_other'
ANDROID_PLATFORM_VERSION = '0.1-alpha-abcdef1234'
COUNTRY_LOCALE_CODE_INDIA = 'in'
ANDROID_DEVICE_MODEL = 'Pixel 4a'
ANDROID_SDK_VERSION = 28
ENTRY_POINT_NAVIGATION_DRAWER = 'navigation_drawer'
LANGUAGE_CODE_ENGLISH = 'en'
ANDROID_PACKAGE_VERSION_CODE = 1
NETWORK_WIFI = 'wifi'
ANDROID_TEXT_SIZE = 'medium_text_size'
ANDROID_BUILD_FINGERPRINT = 'example_fingerprint_id'
EVENT_LOGS = ['event1', 'event2']
LOGCAT_LOGS = ['logcat1', 'logcat2']
USER_SELECTED_ITEMS = None
USER_TEXT_INPUT = 'add and admin'
ANDROID_REPORT_INFO = {
    'user_feedback_selected_items': USER_SELECTED_ITEMS,
    'user_feedback_other_text_input': USER_TEXT_INPUT,
    'event_logs': ['event1', 'event2'],
    'logcat_logs': ['logcat1', 'logcat2'],
    'package_version_code': ANDROID_PACKAGE_VERSION_CODE,
    'build_fingerprint': ANDROID_BUILD_FINGERPRINT,
    'network_type': NETWORK_WIFI,
    'android_device_language_locale_code': LANGUAGE_CODE_ENGLISH,
    'entry_point_info': {
        'entry_point_name': ENTRY_POINT_NAVIGATION_DRAWER,
    },
    'text_size': ANDROID_TEXT_SIZE,
    'only_allows_wifi_download_and_update': True,
    'automatically_update_topics': False,
    'account_is_profile_admin': False
}
ANDROID_REPORT_INFO_SCHEMA_VERSION = 1


class AppFeedbackReportTest(test_utils.GenericTestBase):

    def setUp(self):
        super(AppFeedbackReportTest, self).setUp()
        self.signup(USER_1_EMAIL, USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(USER_1_EMAIL)
        self.report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP))
        app_feedback_report_models.AppFeedbackReportModel.create(
            entity_id=self.report_id,
            platform=PLATFORM_ANDROID,
            submitted_on=REPORT_SUBMITTED_TIMESTAMP,
            report_type=REPORT_TYPE_SUGGESTION,
            category=CATEGORY_OTHER,
            platform_version=ANDROID_PLATFORM_VERSION,
            android_device_country_locale_code=(
                COUNTRY_LOCALE_CODE_INDIA),
            android_sdk_version=ANDROID_SDK_VERSION,
            android_device_model=ANDROID_DEVICE_MODEL,
            entry_point=ENTRY_POINT_NAVIGATION_DRAWER,
            entry_point_topic_id=None,
            entry_point_story_id=None,
            entry_point_exploration_id=None,
            entry_point_subtopic_id=None,
            text_language_code=LANGUAGE_CODE_ENGLISH,
            audio_language_code=LANGUAGE_CODE_ENGLISH,
            android_report_info=ANDROID_REPORT_INFO,
            web_report_info=None)

    def test_to_dict_android_report(self):
        expected_report_id = self.report_id
        expected_dict = {
            'report_id': expected_report_id,
            'schema_version': ANDROID_REPORT_INFO_SCHEMA_VERSION,
            'platform': PLATFORM_ANDROID,
            'submitted_on_timestamp': utils.get_human_readable_time_string(
                utils.get_time_in_millisecs(REPORT_SUBMITTED_TIMESTAMP)),
            'ticket_id': None,
            'scrubbed_by': None,
            'user_supplied_feedback': {
                'report_type': REPORT_TYPE_SUGGESTION,
                'category': CATEGORY_OTHER,
                'user_feedback_selected_items': USER_SELECTED_ITEMS,
                'user_feedback_other_text_input': USER_TEXT_INPUT
            },
            'device_system_context': {
                'version_name': ANDROID_PLATFORM_VERSION,
                'package_version_code': ANDROID_PACKAGE_VERSION_CODE,
                'device_country_locale_code':COUNTRY_LOCALE_CODE_INDIA,
                'device_language_locale_code': LANGUAGE_CODE_ENGLISH,
                'device_model': ANDROID_DEVICE_MODEL,
                'sdk_version': ANDROID_SDK_VERSION,
                'build_fingerprint': ANDROID_BUILD_FINGERPRINT,
                'network_type': NETWORK_WIFI
            },
            'app_context': {
                'entry_point': {
                    'entry_point_name': 'navigation_drawer'
                },
                'text_language_code': LANGUAGE_CODE_ENGLISH,
                'audio_language_code': LANGUAGE_CODE_ENGLISH,
                'text_size': ANDROID_TEXT_SIZE,
                'only_allows_wifi_download_and_update': True,
                'automatically_update_topics': False,
                'account_is_profile_admin': False,
                'event_logs': EVENT_LOGS,
                'logcat_logs': LOGCAT_LOGS
            }
        }
        
        report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        report_obj = app_feedback_report_services.get_report_from_model(
            report_model)

        # user_supplied_feedback = (
        #     app_feedback_report_domain.UserSuppliedFeedback(
        #         REPORT_TYPE_SUGGESTION, CATEGORY_OTHER, USER_SELECTED_ITEMS,
        #         USER_TEXT_INPUT))
        # device_system_context = (
        #     app_feedback_report_domain.AndroidDeviceSystemContext(
        #         ANDROID_PLATFORM_VERSION, ANDROID_PACKAGE_VERSION_CODE,
        #         LANGUAGE_CODE_ENGLISH, LANGUAGE_CODE_ENGLISH,
        #         ANDROID_DEVICE_MODEL, ANDROID_SDK_VERSION,
        #         ANDROID_BUILD_FINGERPRINT, NETWORK_WIFI))
        # entry_point = app_feedback_report_domain.NavigationDrawerEntryPoint()
        # app_context = app_feedback_report_domain.AndroidAppContext(
        #     entry_point, LANGUAGE_CODE_ENGLISH,
        #     LANGUAGE_CODE_ENGLISH, ANDROID_TEXT_SIZE, True, False, False,
        #     EVENT_LOGS, LOGCAT_LOGS)
        # actual_dict = app_feedback_report_domain.AppFeedbackReport(
        #     self.report_id, ANDROID_REPORT_INFO_SCHEMA_VERSION,
        #     PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP, TICKET_ID, None,
        #     user_supplied_feedback, device_system_context, app_context)

        self.assertDictEqual(
            expected_dict, report_obj.to_dict())


# class AppFeedbackReportTicketTest(test_utils.GenericTestBase):


