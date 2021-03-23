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

"""Tests for core.storage.app_feedback_report.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
from core.tests import test_utils
import feconf

(base_models, app_feedback_report_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.app_feedback_report])


class AppFeedbackReportModelTests(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReportModel class."""

    PLATFORM = 'android'
    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP_1 = datetime.datetime.fromtimestamp(1615151836)
    # Timestamp in sec since epoch for Mar 12 2021 3:22:17 UTC.
    REPORT_SUBMITTED_TIMESTAMP_2 = datetime.datetime.fromtimestamp(1615519337)
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
    AUDIO_LANGUAGE_ENGLISH = 'english'
    ANDROID_REPORT_INFO=  {
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
    ANDROID_REPORT_INFO_SCHEMA_VERSION = 1

    def setUp(self):
        """Set up  models in datastore for use in testing."""
        super(AppFeedbackReportModelTests, self).setUp()

        self.feedback_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id='%s.%s.%s' % (
                    self.PLATFORM, self.REPORT_SUBMITTED_TIMESTAMP_1.second,
                    'randomInteger123'),
                platform=self.PLATFORM,
                scrubbed_by=self.USER_ID,
                ticket_id='%s.%s.%s' % (
                    'random_hash', self.TICKET_CREATION_TIMESTAMP.second,
                    '16CharString1234'),
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_1,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                device_country_locale_code=(
                    self.DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
            )
        )
        self.feedback_report_model.update_timestamps()
        self.feedback_report_model.put()

    def test_create_and_get_report_model(self):
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.create(
                self.PLATFORM, self.REPORT_SUBMITTED_TIMESTAMP_2,
                self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
                self.PLATFORM_VERSION, self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
                self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
                self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
                self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_ENGLISH,
                self.ANDROID_REPORT_INFO, None))

        report_model = app_feedback_report_models.AppFeedbackReportModel.get(
            report_id)

        self.assertEqual(report_model.platform, self.PLATFORM)
        self.assertEqual(
            report_model.submitted_on, self.REPORT_SUBMITTED_TIMESTAMP_2)
        self.assertEqual(report_model.report_type, self.REPORT_TYPE_SUGGESTION)
        self.assertEqual(report_model.android_report_info_schema_version, 1)
        self.assertEqual(report_model.web_report_info, None)

    def test_scrub_report_model(self):
        report_id = '%s.%s.%s' % (
            self.PLATFORM, self.REPORT_SUBMITTED_TIMESTAMP_1.second,
            'randomInteger123')
        report_model = app_feedback_report_models.AppFeedbackReportModel.get(
            report_id)
        report_dict = report_model.android_report_info
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

        app_feedback_report_models.AppFeedbackReportModel.scrub_report(
            report_id, 'scrubber_user')
        scrubbed_report_model = app_feedback_report_models.AppFeedbackReportModel.get(
            report_id)
        self.assertEqual(scrubbed_report_model.scrubbed_by, 'scrubber_user')
        self.assertEqual(
            scrubbed_report_model.android_report_info, expected_report_dict)

    def test_get_deletion_policy(self):
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(model.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_export_data_nontrivial(self):
        stored_data = (
            app_feedback_report_models.AppFeedbackReportModel.export_data(
                self.USER_ID))

        report_id = '%s.%s.%s' % (
            self.PLATFORM, self.REPORT_SUBMITTED_TIMESTAMP_1.second,
            'randomInteger123')
        expected_data = {
            report_id: {
                'platform': self.PLATFORM,
                'ticket_id': self.TICKET_ID,
                'submitted_on': self.REPORT_SUBMITTED_TIMESTAMP_1,
                'report_type': self.REPORT_TYPE_SUGGESTION,
                'category': self.CATEGORY_OTHER,
                'platform_version': self.PLATFORM_VERSION,
                'device_country_locale_code': (
                    self.DEVICE_COUNTRY_LOCALE_CODE_INDIA),
                'android_device_model': self.ANDROID_DEVICE_MODEL,
                'android_sdk_version': self.ANDROID_SDK_VERSION,
                'entry_point': self.ENTRY_POINT_NAVIGATION_DRAWER,
                'entry_point_topic_id': None,
                'entry_point_exploration_id': None,
                'entry_point_story_id': None,
                'entry_point_subtopic_id': None,
                'text_language_code': self.TEXT_LANGUAGE_CODE_ENGLISH,
                'audio_language_code': self.AUDIO_LANGUAGE_ENGLISH,
                'android_report_info': self.ANDROID_REPORT_INFO,
                'android_report_info_schema_version': 
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION,
                'web_report_info': None,
                'web_report_info_schema_version': None
            }
        }
        self.assertEqual(stored_data, expected_data)

    def test_get_lowest_supported_role(self):
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(model.get_lowest_supported_role(),
            feconf.ROLE_ID_MODERATOR
        )


class AppFeedbackReportTicketModelTests(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReportTicketModel class."""

    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615151836)
    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    NEWEST_REPORT_TIMESTAMP = datetime.datetime.fromtimestamp(1615151836)
    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)

    PLATFORM = 'android'
    PLATFORM_VERSION='0.1-alpha-abcdef1234'
    TICKET_NAME = 'example ticket name'
    TICKET_ID = '%s.%s.%s' % ('random_hash', TICKET_CREATION_TIMESTAMP.second,
        '16CharString1234')
    REPORT_IDS = ['%s.%s.%s' % (PLATFORM, REPORT_SUBMITTED_TIMESTAMP.second,
        'randomInteger123')]

    def test_create_and_get_ticket_model(self):
        ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.create(
                ticket_name=self.TICKET_NAME,
                github_issue_number=None,
                newest_report_timestamp=self.NEWEST_REPORT_TIMESTAMP,
                report_ids=self.REPORT_IDS))

        ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get(
                ticket_id))

        self.assertEqual(ticket_model.id, ticket_id)
        self.assertEqual(
            ticket_model.newest_report_timestamp, self.NEWEST_REPORT_TIMESTAMP)
        self.assertEqual(ticket_model.ticket_name, self.TICKET_NAME)
        self.assertEqual(ticket_model.report_ids, self.REPORT_IDS)

    def test_get_deletion_policy(self):
        model = app_feedback_report_models.AppFeedbackReportTicketModel()
        self.assertEqual(model.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_lowest_supported_role(self):
        model = app_feedback_report_models.AppFeedbackReportTicketModel
        self.assertEqual(model.get_lowest_supported_role(),
            feconf.ROLE_ID_MODERATOR
        )


class AppFeedbackReportStatsModelTests(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReportStatsModel class."""

    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)
    TICKET_ID = '%s.%s.%s' % ('random_hash', TICKET_CREATION_TIMESTAMP.second,
        '16CharString1234')
    # Timestamp date in sec since epoch for Mar 19 2021 UTC.
    STATS_DATE_TIMESTAMP = datetime.date.fromtimestamp(1616173836)
    DAILY_STATS = {'daily_param_stats': {
                        'report_type': {
                            'suggestion': 1, 'issue': 1, 'crash': 1}},
                    'daily_total_report_submitted': 3}

    def test_create_and_get_stats_model(self):
        entity_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.create(
                platform='android',
                ticket_id=self.TICKET_ID,
                stats_tracking_date=self.STATS_DATE_TIMESTAMP,
                daily_ticket_stats=self.DAILY_STATS))

        stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get(
                entity_id))

        self.assertEqual(stats_model.id, '%s:%s:%s' % (
            'android', self.TICKET_ID, self.STATS_DATE_TIMESTAMP.isoformat()))
        self.assertEqual(stats_model.platform, 'android')
        self.assertEqual(
            stats_model.stats_tracking_date, self.STATS_DATE_TIMESTAMP)
        self.assertEqual(stats_model.daily_ticket_stats, self.DAILY_STATS)

    def test_get_deletion_policy(self):
        model = app_feedback_report_models.AppFeedbackReportStatsModel()
        self.assertEqual(model.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_lowest_supported_role(self):
        model = app_feedback_report_models.AppFeedbackReportStatsModel
        self.assertEqual(model.get_lowest_supported_role(),
            feconf.ROLE_ID_MODERATOR
        )
