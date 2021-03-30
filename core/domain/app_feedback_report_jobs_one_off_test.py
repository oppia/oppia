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


class ScrubReportsOneOffJobTests(test_utils.GenericTestBase):
    PLATFORM_ANDROID = 'android'
    PLATFORM_WEB = 'web'
    # Timestamp in sec since epoch for Dec 28 2020 23:02:16 GMT.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1609196540)
    TIMESTAMP_AT_90_DAYS = (
        datetime.datetime.utcnow() - datetime.timedelta(days=90))
    TIMESTAMP_OVER_90_DAYS = (
        datetime.datetime.utcnow() - datetime.timedelta(days=100))
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

    REPORT_ID_AT_90_DAYS = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP.second,
        'At90Daysxxxx')
    ANDROID_REPORT_ID_OVER_90_DAYS = '%s.%s.%s' % (
        PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP.second,
        'Over90Daysxx')
    WEB_REPORT_ID_OVER_90_DAYS = '%s.%s.%s' % (
        PLATFORM_WEB, REPORT_SUBMITTED_TIMESTAMP.second,
        'Over90Daysxx')

    def _add_current_reports():
        """Adds reports to the model that should not be scrubbed."""
        current_feedback_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=REPORT_ID_AT_90_DAYS,
                platform=PLATFORM_ANDROID,
                ticket_id='%s.%s.%s' % (
                    'random_hash', TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=REPORT_SUBMITTED_TIMESTAMP,
                report_type=REPORT_TYPE_SUGGESTION,
                category=CATEGORY_OTHER,
                platform_version=PLATFORM_VERSION,
                device_country_locale_code=(
                    DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=ANDROID_DEVICE_MODEL,
                android_sdk_version=ANDROID_SDK_VERSION,
                entry_point=ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        current_feedback_report_model.created_on = TIMESTAMP_AT_90_DAYS
        current_feedback_report_model.put()

    def _add_expiring_reports():
        """Adds reports to the model that should be scrubbed."""
        expiring_android_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=ANDROID_REPORT_ID_OVER_90_DAYS,
                platform=PLATFORM_ANDROID,
                ticket_id='%s.%s.%s' % (
                    'random_hash', TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=REPORT_SUBMITTED_TIMESTAMP,
                report_type=REPORT_TYPE_SUGGESTION,
                category=CATEGORY_OTHER,
                platform_version=PLATFORM_VERSION,
                device_country_locale_code=(
                    DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=ANDROID_DEVICE_MODEL,
                android_sdk_version=ANDROID_SDK_VERSION,
                entry_point=ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        expiring_android_report_model.created_on = TIMESTAMP_OVER_90_DAYS
        expiring_android_report_model.put()

        expiring_web_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=WEB_REPORT_ID_OVER_90_DAYS,
                platform=PLATFORM_WEB,
                ticket_id='%s.%s.%s' % (
                    'random_hash', TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=REPORT_SUBMITTED_TIMESTAMP,
                report_type=REPORT_TYPE_SUGGESTION,
                category=CATEGORY_OTHER,
                platform_version=PLATFORM_VERSION,
                device_country_locale_code=(
                    DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=ANDROID_DEVICE_MODEL,
                android_sdk_version=ANDROID_SDK_VERSION,
                entry_point=ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=AUDIO_LANGUAGE_CODE_ENGLISH,
                web_report_info=WEB_REPORT_INFO,
                web_report_info_schema_version=WEB_REPORT_INFO_SCHEMA_VERSION))
        expiring_web_report_model.created_on = TIMESTAMP_OVER_90_DAYS
        expiring_web_report_model.put()

    def test_empty_model(self):
        model_class = app_feedback_report_models.AppFeedbackReportModel
        assertEqual(len(model_class.get_all()), 0)

        job_id = (
            app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.create_new())
        app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.enqueue(job_id))
        process_and_flush_pending_mapreduce_tasks()

        output = (
            app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.get_output(
                job_id))
        assertEqual(output, [])

        assertEqual(len(model_class.get_all()), 0)

    def test_scrubs_every_model(self):
        _add_current_reports()

        job_id = (
            app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.create_new())
        app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.enqueue(job_id))
        process_and_flush_pending_mapreduce_tasks()

        output = (
            app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.get_output(
                job_id))
        assertEqual(output, [])

        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                REPORT_ID_AT_90_DAYS))
        assertFalse(current_model is None)
        assertTrue(current_model.scrubbed_by is None)

    def test_standard_operation(self):
        _add_current_reports()
        _add_expiring_reports()

        job_id = (
            app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.create_new())
        app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.enqueue(job_id))
        process_and_flush_pending_mapreduce_tasks()

        output = (
            app_feedback_report_jobs_one_off.ScrubReportsOneOffJob.get_output(
                job_id))
        assertEqual(output, [])

        scrubbed_android_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                ANDROID_REPORT_ID_OVER_90_DAYS))
        assertFalse(scrubbed_android_model is None)
        assertEqual(
            scrubbed_android_model.scrubbed_by, feconf.REPORT_SCRUBBER_BOT_ID)

        scrubbed_web_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                WEB_REPORT_ID_OVER_90_DAYS))
        assertFalse(scrubbed_web_model is None)
        assertEqual(
            scrubbed_web_model.scrubbed_by, feconf.REPORT_SCRUBBER_BOT_ID)

        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                REPORT_ID_AT_90_DAYS))
        assertFalse(current_model is None)
        assertTrue(current_model.scrubbed_by is None)
