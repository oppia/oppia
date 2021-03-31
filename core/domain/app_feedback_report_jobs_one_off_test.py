# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for one-off jobs related to app feedback reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import app_feedback_report_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

(app_feedback_report_models,) = models.Registry.import_models([
    models.NAMES.app_feedback_report])


class ScrubAppFeedbackReportsOneOffJobTests(test_utils.GenericTestBase):
    PLATFORM_ANDROID = 'android'
    PLATFORM_WEB = 'web'
    # Timestamp in sec since epoch for Dec 28 2020 23:02:16 GMT.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1609196540)
    TIMESTAMP_AT_MAX_DAYS = (
        datetime.datetime.utcnow() - datetime.timedelta(
            days=feconf.APP_FEEDBACK_REPORT_MAX_NUMBER_OF_DAYS))
    TIMESTAMP_OVER_MAX_DAYS = (
        datetime.datetime.utcnow() - datetime.timedelta(
            days=feconf.APP_FEEDBACK_REPORT_MAX_NUMBER_OF_DAYS + 10))
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

    REPORT_ID_AT_MAX_DAYS = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP.second,
        'AtMaxDaysxxx')
    ANDROID_REPORT_ID_OVER_MAX_DAYS = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP.second,
        'OverMaxDaysx')
    WEB_REPORT_ID_OVER_MAX_DAYS = '%s.%s.%s' % (
        PLATFORM_WEB, REPORT_SUBMITTED_TIMESTAMP.second,
        'OverMaxDaysx')
    
    def setUp(self):
        super(ScrubAppFeedbackReportsOneOffJobTests, self).setUp()
        self.job_class = (
            app_feedback_report_jobs_one_off.ScrubAppFeedbackReportsOneOffJob)

    def _add_current_reports(self):
        """Adds reports to the model that should not be scrubbed."""
        current_feedback_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=self.REPORT_ID_AT_MAX_DAYS,
                platform=self.PLATFORM_ANDROID,
                ticket_id='%s.%s.%s' % (
                    'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        current_feedback_report_model.created_on = self.TIMESTAMP_AT_MAX_DAYS
        current_feedback_report_model.put()

    def _add_expiring_reports(self):
        """Adds reports to the model that should be scrubbed."""
        expiring_android_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=self.ANDROID_REPORT_ID_OVER_MAX_DAYS,
                platform=self.PLATFORM_ANDROID,
                ticket_id='%s.%s.%s' % (
                    'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        expiring_android_report_model.created_on = self.TIMESTAMP_OVER_MAX_DAYS
        expiring_android_report_model.put()

        expiring_web_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=self.WEB_REPORT_ID_OVER_MAX_DAYS,
                platform=self.PLATFORM_WEB,
                ticket_id='%s.%s.%s' % (
                    'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                web_report_info=self.WEB_REPORT_INFO,
                web_report_info_schema_version=(
                    self.WEB_REPORT_INFO_SCHEMA_VERSION)))
        expiring_web_report_model.created_on = self.TIMESTAMP_OVER_MAX_DAYS
        expiring_web_report_model.put()

    def test_scrubs_no_models(self):
        self._add_current_reports()

        job_id = self.job_class.create_new()
        self.job_class.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = self.job_class.get_output(job_id)
        self.assertEqual(output, [])

        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_AT_MAX_DAYS))
        self.assertFalse(current_model is None)
        self.assertTrue(current_model.scrubbed_by is None)

    def test_scrubs_all_models(self):
        self._add_expiring_reports()

        job_id = self.job_class.create_new()
        self.job_class.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = self.job_class.get_output(job_id)
        self.assertEqual(output, [])

        android_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.ANDROID_REPORT_ID_OVER_MAX_DAYS))
        self.assertFalse(android_model is None)
        self.assertEqual(
            android_model.scrubbed_by, feconf.REPORT_SCRUBBER_BOT_ID)

        web_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.WEB_REPORT_ID_OVER_MAX_DAYS))
        self.assertFalse(web_model is None)
        self.assertEqual(web_model.scrubbed_by, feconf.REPORT_SCRUBBER_BOT_ID)

    def test_standard_operation(self):
        self._add_current_reports()
        self._add_expiring_reports()

        job_id = self.job_class.create_new()
        self.job_class.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = self.job_class.get_output(job_id)
        self.assertEqual(output, [])

        scrubbed_android_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.ANDROID_REPORT_ID_OVER_MAX_DAYS))
        self.assertFalse(scrubbed_android_model is None)
        self.assertEqual(
            scrubbed_android_model.scrubbed_by, feconf.REPORT_SCRUBBER_BOT_ID)

        scrubbed_web_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.WEB_REPORT_ID_OVER_MAX_DAYS))
        self.assertFalse(scrubbed_web_model is None)
        self.assertEqual(
            scrubbed_web_model.scrubbed_by, feconf.REPORT_SCRUBBER_BOT_ID)

        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_AT_MAX_DAYS))
        self.assertFalse(current_model is None)
        self.assertTrue(current_model.scrubbed_by is None)
        self.assertIsNone(self.job_class.reduce('key', 'values'))
