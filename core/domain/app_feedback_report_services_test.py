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

from core.domain import app_feedback_report_domain
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
        'user_feedback_selected_items': None,
        'user_feedback_other_text_input': 'add an admin',
        'event_logs': ['event1', 'event2'],
        'logcat_logs': ['logcat1', 'logcat2'],
        'package_version_code': 1,
        'build_fingerprint': 'example_fingerprint_id',
        'network_type': 'wifi',
        'android_device_language_locale_code': 'en',
        'entry_point_info': {
            'entry_point_name': 'crash',
        },
        'text_size': 'MEDIUM_TEXT_SIZE',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'account_is_profile_admin': False
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

        self.android_report_id = model_class.create(
            self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP,
            self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
            self.PLATFORM_VERSION, self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            self.ANDROID_REPORT_INFO, None)
        self.android_report_model  = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.android_report_id))
        self.android_report_obj = (
            app_feedback_report_services.get_report_from_model(report_model))

    def test_get_report_from_model_has_same_report_info(self):
        self.assertEqual(
            self.android_report_model.id, self.android_report_obj.report_id)
        self.assertEqual(
            self.android_report_model.platform,
            self.android_report_obj.platform)
        self.assertEqual(self.android_report_model.ticket_id, None)
        self.assertEqual(self.android_report_model.scrubbed_by, None)

    def test_get_report_from_model_has_same_user_supplied_feedback_info(self):
        user_supplied_feedback = self.android_report_obj.user_supplied_feedback
        
        self.assertEqual(
            user_supplied_feedback.report_type,
            self.android_report_model.report_type)
        self.assertEqual(
            user_supplied_feedback.category, self.android_report_model.category)
        self.assertEqual(
            user_supplied_feedback.user_feedback_selected_items, None)
        self.assertEqual(
            user_supplied_feedback.user_feedback_other_text_input,
            self.android_report_model.android_report_info[
                'user_feedback_other_text_input'])

    def test_get_report_from_model_has_same_device_system_info(self):
        device_system_context = self.android_report_obj.device_system_context
        
        self.assertTrue(isinstance(
            device_system_context,
            app_feedback_report_domain.AndroidDeviceSystemContext))
        self.assertEqual(
            device_system_context.version_name,
            self.android_report_model.platform_version)
        self.assertEqual(
            device_system_context.package_version_code,
            self.android_report_model.android_report_info[
                'package_version_code'])
        self.assertEqual(
            device_system_context.device_country_locale_code,
            self.android_report_model.android_device_country_locale_code)
        self.assertEqual(
            device_system_context.device_model,
            self.android_report_model.android_device_model)
        self.assertEqual(
            device_system_context.sdk_version,
            self.android_report_model.android_sdk_version)
        self.assertEqual(
            device_system_context.build_fingerprint,
            self.android_report_model.android_report_info[
                'build_fingerprint'])
        self.assertEqual(
            device_system_context.network_type,
            self.android_report_model.android_report_info[
                'network_type'])

    def test_get_report_from_model_has_same_app_info(self):
        app_context = self.android_report_obj.app_context
        
        self.assertTrue(isinstance(
            app_context, app_feedback_report_domain.AndroidAppContext))
        self.assertEqual(
            app_context.entry_point.entry_point_name,
            self.android_report_model.entry_point_name)
        self.assertEqual(
            app_context.text_language_code,
            self.android_report_model.text_language_code)
        self.assertEqual(
            app_context.audio_language_code,
            self.android_report_model.audio_language_code)
        self.assertEqual(
            app_context.text_size,
            self.android_report_model.android_report_info['text_size'])
        self.assertEqual(
            app_context.only_allows_wifi_download_and_update,
            self.android_report_model.android_report_info[
                'only_allows_wifi_download_and_update'])
        self.assertEqual(
            app_context.automatically_update_topics,
            self.android_report_model.android_report_info[
                'automatically_update_topics'])
        self.assertEqual(
            app_context.account_is_profile_admin,
            self.android_report_model.android_report_info[
                'account_is_profile_admin'])
        self.assertEqual(
            app_context.event_logs,
            self.android_report_model.android_report_info['event_logs'])
        self.assertEqual(
            app_context.logcat_ogs,
            self.android_report_model.android_report_info['logcat_logs'])

    def test_get_ticket_from_model_has_same_ticket_info(self):
        app_context = self.android_report_obj.app_context
        
        self.assertTrue(isinstance(
            app_context, app_feedback_report_domain.AndroidAppContext))
        self.assertEqual(
            app_context.entry_point.entry_point_name,
            self.android_report_model.entry_point_name)
        self.assertEqual(
            app_context.text_language_code,
            self.android_report_model.text_language_code)
        self.assertEqual(
            app_context.audio_language_code,
            self.android_report_model.audio_language_code)
        self.assertEqual(
            app_context.text_size,
            self.android_report_model.android_report_info['text_size'])
        self.assertEqual(
            app_context.only_allows_wifi_download_and_update,
            self.android_report_model.android_report_info[
                'only_allows_wifi_download_and_update'])
        self.assertEqual(
            app_context.automatically_update_topics,
            self.android_report_model.android_report_info[
                'automatically_update_topics'])
        self.assertEqual(
            app_context.account_is_profile_admin,
            self.android_report_model.android_report_info[
                'account_is_profile_admin'])
        self.assertEqual(
            app_context.event_logs,
            self.android_report_model.android_report_info['event_logs'])
        self.assertEqual(
            app_context.logcat_ogs,
            self.android_report_model.android_report_info['logcat_logs'])
        


    # Test get domain objects from model
    # test stats are calculated correctly
    # test new report added to unticketed stats
    # test new report added to all report stats
    # Test get all expiring reports
    # Test getting filter options
    # Reassigning ticket changes name
    # Reassigning ticket updates increasing stats
    # Reassigning ticket updates decreasing stats
    # reassigning ticket does not change all report stats
    # Edit ticket changes name



    def test_scrub_android_report_removes_info(self):
        expected_report_dict = {
            'package_version_code': 1,
            'language_locale_code': 'en',
            'entry_point_info': {
                'entry_point_name': 'crash',
            },
            'text_size': 'MEDIUM_TEXT_SIZE',
            'only_allows_wifi_download_and_update': True,
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

    def test_scrub_web_report_removes_info(self):
        app_feedback_report_services.scrub_report(
            self.web_report_id, 'scrubber_user')
        scrubbed_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get(
                self.web_report_id))
        expected_report_dict = {}

        self.assertEqual(scrubbed_report_model.scrubbed_by, 'scrubber_user')
        self.assertEqual(
            scrubbed_report_model.web_report_info, expected_report_dict)

    def test_scrubbing_nonexistent_report_raises_exception(self):
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

    def test_scrubbing_on_current_and_expired_reports_only_scrubs_expired(
            self):
        self._add_current_reports()
        self._add_expiring_android_report()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()

        scrubbed_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.ANDROID_REPORT_ID_OVER_MAX_DAYS))
        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_AT_MAX_DAYS))

        self._verify_report_is_scrubbed(
            scrubbed_model, feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)
        self._verify_report_is_not_scrubbed(current_model)

    def test_scrubbing_with_no_reports_in_storage_does_not_scrub_storage(
            self):
        current_models_query = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_all())
        current_models = current_models_query.fetch()
        self.assertEqual(len(current_models), 0)
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()

        stored_models_query = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_all())
        stored_models = stored_models_query.fetch()
        self.assertEqual(len(stored_models), 0)

    def test_scrubbing_on_no_models_does_not_scrub_models(self):
        self._add_current_reports()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()

        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID_AT_MAX_DAYS))
        self._verify_report_is_not_scrubbed(current_model)

    def test_scrubbing_on_all_expired_models_updates_all_models(self):
        self._add_expiring_android_report()
        self._add_expiring_web_report()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()

        android_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.ANDROID_REPORT_ID_OVER_MAX_DAYS))
        web_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.WEB_REPORT_ID_OVER_MAX_DAYS))

        self._verify_report_is_scrubbed(
            android_model, feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)
        self._verify_report_is_scrubbed(
            web_model, feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)

    def test_scrubbing_on_already_scrubbed_models_does_not_scrub_models(
            self):
        self._add_scrubbed_report()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()

        scrubbed_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.SCRUBBED_REPORT_ID))

        self._verify_report_is_scrubbed(scrubbed_model, 'scrubber_user')

    def test_scrubbing_runs_again_scrubs_newly_added_expired_models(self):
        self._add_expiring_android_report()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()
        scrubbed_android_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.ANDROID_REPORT_ID_OVER_MAX_DAYS))
        self._verify_report_is_scrubbed(
            scrubbed_android_model, feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)

        self._add_expiring_web_report()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports()

        scrubbed_web_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.WEB_REPORT_ID_OVER_MAX_DAYS))
        self._verify_report_is_scrubbed(
            scrubbed_web_model, feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)
        # Check that the originally-scrubbed model is still valid.
        self._verify_report_is_scrubbed(
            scrubbed_android_model, feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)

    def _verify_report_is_scrubbed(self, model_entity, scrubber):
        self.assertIsNotNone(model_entity)
        self.assertEqual(
            model_entity.scrubbed_by, scrubber)

    def _verify_report_is_not_scrubbed(self, model_entity):
        self.assertIsNotNone(model_entity)
        self.assertIsNone(model_entity.scrubbed_by)

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

    def _add_expiring_android_report(self):
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

    def _add_expiring_web_report(self):
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

    def _add_scrubbed_report(self):
        """Add an already-scrubbed report to the model."""
        expiring_android_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=self.SCRUBBED_REPORT_ID,
                platform=self.PLATFORM_ANDROID,
                scrubbed_by='scrubber_user',
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
