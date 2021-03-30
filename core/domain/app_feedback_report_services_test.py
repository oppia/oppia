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

"""Tests for services that operate on app feedback reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import app_feedback_report_services
from core.platform import models
from core.tests import test_utils

(app_feedback_report_models,) = models.Registry.import_models(
    [models.NAMES.app_feedback_report])
transaction_services = models.Registry.import_transaction_services()


class AppFeedbackReportServicesUnitTests(test_utils.GenericTestBase):
    """Test functions in app_feedback_report_services."""

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'
    EXP_1_ID = 'exp_1_id'

    PLATFORM_ANDROID = 'android'
    PLATFORM_WEB = 'web'
    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    # REPORT_SUBMITTED_TIMESTAMP_1 = datetime.datetime.fromtimestamp(1615151836)
    # Timestamp in sec since epoch for Mar 12 2021 3:22:17 UTC.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615519337)
    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)
    TICKET_ID = '%s.%s.%s' % (
        'random_hash', TICKET_CREATION_TIMESTAMP.second, '16CharString1234')
    USER_ID = 'user_1'
    REPORT_TYPE_SUGGESTION = 'suggestion'
    CATEGORY_OTHER = 'other'
    PLATFORM_VERSION = '0.1-alpha-abcdef1234'
    DEVICE_COUNTRY_LOCALE_CODE_INDIA = 'in'
    ANDROID_DEVICE_MODEL = 'Pixel 4a'
    ANDROID_SDK_VERSION = 22
    ENTRY_POINT_NAVIGATION_DRAWER = 'navigation_drawer'
    TEXT_LANGUAGE_CODE_ENGLISH = 'en'
    AUDIO_LANGUAGE_CODE_ENGLISH = 'en'
    ANDROID_REPORT_INFO = {
        'user_feedback_other_text_input': 'add an admin',
        'event_logs': ['event1', 'event2'],
        'logcat_logs': ['logcat1', 'logcat2'],
        'package_version_code': 1,
        'language_locale_code': 'en',
        'entry_point_info': {
            'entry_point_name': 'crash',
        },
        'text_size': 'MEDIUM_TEXT_SIZE',
        'download_and_update_only_on_wifi': True,
        'automatically_update_topics': False,
        'is_admin': False
    }
    WEB_REPORT_INFO = {
        'user_feedback_other_text_input': 'add an admin'
    }
    ANDROID_REPORT_INFO_SCHEMA_VERSION = 1
    WEB_REPORT_INFO_SCHEMA_VERSION = 1

    def setUp(self):
        super(AppFeedbackReportServicesUnitTests, self).setUp()
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        model_class = app_feedback_report_models.AppFeedbackReportModel
        self.web_report_id = model_class.create(
            self.PLATFORM_WEB, self.REPORT_SUBMITTED_TIMESTAMP,
            self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
            self.PLATFORM_VERSION, self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            None, self.WEB_REPORT_INFO)
        self.android_report_id = model_class.create(
            self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP,
            self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
            self.PLATFORM_VERSION, self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            self.ANDROID_REPORT_INFO, None)

    def test_scrub_android_report(self):
        expected_report_dict = {
            'package_version_code': 1,
            'language_locale_code': 'en',
            'entry_point_info': {
                'entry_point_name': 'crash',
            },
            'text_size': 'MEDIUM_TEXT_SIZE',
            'download_and_update_only_on_wifi': True,
            'automatically_update_topics': False,
            'is_admin': False
        }

        app_feedback_report_services.scrub_report(
            self.android_report_id, 'scrubber_user')
        scrubbed_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get(
                self.android_report_id))
        self.assertEqual(scrubbed_report_model.scrubbed_by, 'scrubber_user')
        self.assertEqual(
            scrubbed_report_model.android_report_info, expected_report_dict)

    def test_scrub_web_report(self):
        app_feedback_report_services.scrub_report(
            self.web_report_id, 'scrubber_user')
        scrubbed_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get(
                self.web_report_id))
        expected_report_dict = {}

        self.assertEqual(scrubbed_report_model.scrubbed_by, 'scrubber_user')
        self.assertEqual(
            scrubbed_report_model.web_report_info, expected_report_dict)

    def test_scrubbing_nonexistent_report_raise_exception(self):
        fake_report_id = '%s.%s.%s' % (
            self.PLATFORM_WEB, self.REPORT_SUBMITTED_TIMESTAMP.second,
            'randomInteger123')
        # Test exception for AppFeedbackReportModel.
        with self.assertRaisesRegexp(
            Exception,
            'The AppFeedbackReportModel trying to be scrubbed does not '
            'exist.'):
            app_feedback_report_services.scrub_report(
                fake_report_id, 'scrubber_user')
