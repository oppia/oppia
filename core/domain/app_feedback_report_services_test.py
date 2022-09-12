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

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.domain import app_feedback_report_constants
from core.domain import app_feedback_report_domain
from core.domain import app_feedback_report_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_feedback_report_models

(app_feedback_report_models,) = models.Registry.import_models(
    [models.Names.APP_FEEDBACK_REPORT])


class AppFeedbackReportServicesUnitTests(test_utils.GenericTestBase):
    """Tests for functions in app_feedback_report_services."""

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    PLATFORM_ANDROID = 'android'
    PLATFORM_WEB = 'web'
    # Timestamp in sec since epoch for Mar 12 2021 3:22:17 UTC.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615519337)
    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TIMESTAMP_AT_MAX_DAYS = datetime.datetime.utcnow() - (
        feconf.APP_FEEDBACK_REPORT_MAXIMUM_LIFESPAN)
    TIMESTAMP_OVER_MAX_DAYS = datetime.datetime.utcnow() - (
        feconf.APP_FEEDBACK_REPORT_MAXIMUM_LIFESPAN +
        datetime.timedelta(days=2))
    TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)
    TICKET_CREATION_TIMESTAMP_MSEC = utils.get_time_in_millisecs(
        TICKET_CREATION_TIMESTAMP)
    TICKET_NAME = 'a ticket name'
    TICKET_ID = '%s.%s.%s' % (
        'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC), '16CharString1234')
    USER_ID = 'user_1'
    REPORT_TYPE_SUGGESTION = (
        app_feedback_report_constants.ReportType.SUGGESTION)
    CATEGORY_OTHER = app_feedback_report_constants.Category.OTHER_SUGGESTION
    ANDROID_PLATFORM_VERSION = '0.1-alpha-abcdef1234'
    COUNTRY_LOCALE_CODE_INDIA = 'in'
    ANDROID_DEVICE_MODEL = 'Pixel 4a'
    ANDROID_SDK_VERSION = 23
    ENTRY_POINT_NAVIGATION_DRAWER = (
        app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER)
    TEXT_LANGUAGE_CODE_ENGLISH = 'en'
    AUDIO_LANGUAGE_CODE_ENGLISH = 'en'
    ANDROID_REPORT_INFO: app_feedback_report_models.ReportInfoDict = {
        'user_feedback_selected_items': [],
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
        'text_size': 'medium_text_size',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'account_is_profile_admin': False,
        'is_curriculum_admin': False,
        'language_locale_code': 'en'
    }
    WEB_PLATFORM_VERSION = '3.0.8'
    WEB_REPORT_INFO = {
        'user_feedback_other_text_input': 'add an admin'
    }
    ANDROID_REPORT_INFO_SCHEMA_VERSION = 1
    WEB_REPORT_INFO_SCHEMA_VERSION = 1

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

    REPORT_STATS = {
        'platform': {PLATFORM_ANDROID: 1},
        'report_type': {REPORT_TYPE_SUGGESTION.value: 1},
        'country_locale_code': {COUNTRY_LOCALE_CODE_INDIA: 1},
        'entry_point_name': {ENTRY_POINT_NAVIGATION_DRAWER.value: 1},
        'text_language_code': {TEXT_LANGUAGE_CODE_ENGLISH: 1},
        'audio_language_code': {AUDIO_LANGUAGE_CODE_ENGLISH: 1},
        'android_sdk_version': {str(ANDROID_SDK_VERSION): 1},
        'version_name': {ANDROID_PLATFORM_VERSION: 1}
    }

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        self.android_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP))
        app_feedback_report_models.AppFeedbackReportModel.create(
            self.android_report_id, self.PLATFORM_ANDROID,
            self.REPORT_SUBMITTED_TIMESTAMP, 0,
            self.REPORT_TYPE_SUGGESTION.value, self.CATEGORY_OTHER.value,
            self.ANDROID_PLATFORM_VERSION,
            self.COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER.value, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            self.ANDROID_REPORT_INFO, None)
        self.android_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.android_report_id))
        self.android_report_obj = (
            app_feedback_report_services.get_report_from_model(
                self.android_report_model))

        self.android_ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                self.TICKET_NAME))
        app_feedback_report_models.AppFeedbackReportTicketModel.create(
            self.android_ticket_id, self.TICKET_NAME, self.PLATFORM_ANDROID,
            None, None, self.REPORT_SUBMITTED_TIMESTAMP, [])
        self.android_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.android_ticket_id))
        self.android_ticket_obj = (
            app_feedback_report_services.get_ticket_from_model(
                self.android_ticket_model))

    def test_get_reports_returns_same_report(self) -> None:
        optional_report_models = app_feedback_report_services.get_report_models(
            [self.android_report_id])
        # Ruling out the possibility of None for mypy type checking.
        assert optional_report_models[0] is not None
        self.assertEqual(optional_report_models[0].id, self.android_report_id)

    def test_invalid_report_id_raises_error_if_method_is_called_strictly(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No AppFeedbackReportModel exists for the id invalid_id'
        ):
            app_feedback_report_services.get_report_models(
                ['invalid_id'], strict=True
            )

    def test_get_multiple_reports_returns_all_reports(self) -> None:
        new_report_id_1 = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP))
        app_feedback_report_models.AppFeedbackReportModel.create(
            new_report_id_1, self.PLATFORM_ANDROID,
            self.REPORT_SUBMITTED_TIMESTAMP, 0,
            self.REPORT_TYPE_SUGGESTION.value, self.CATEGORY_OTHER.value,
            self.ANDROID_PLATFORM_VERSION,
            self.COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER.value, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            self.ANDROID_REPORT_INFO, None)
        new_report_id_2 = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP))
        app_feedback_report_models.AppFeedbackReportModel.create(
            new_report_id_2, self.PLATFORM_ANDROID,
            self.REPORT_SUBMITTED_TIMESTAMP, 0,
            self.REPORT_TYPE_SUGGESTION.value, self.CATEGORY_OTHER.value,
            self.ANDROID_PLATFORM_VERSION,
            self.COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER.value, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            self.ANDROID_REPORT_INFO, None)

        optional_report_models = app_feedback_report_services.get_report_models(
            [self.android_report_id, new_report_id_1, new_report_id_2])
        report_ids = [
            report_model.id for report_model in optional_report_models
            if report_model is not None
        ]
        self.assertEqual(len(optional_report_models), 3)
        self.assertTrue(self.android_report_id in report_ids)
        self.assertTrue(new_report_id_1 in report_ids)
        self.assertTrue(new_report_id_2 in report_ids)

    def test_get_nonexistent_report_returns_no_report(self) -> None:
        report_models = app_feedback_report_services.get_report_models(
            ['bad_id'])
        self.assertIsNone(report_models[0])

    def test_get_report_from_model_has_same_report_info(self) -> None:
        self.assertEqual(
            self.android_report_model.id, self.android_report_obj.report_id)
        self.assertEqual(
            self.android_report_model.platform,
            self.android_report_obj.platform)
        self.assertEqual(self.android_report_model.ticket_id, None)
        self.assertEqual(self.android_report_model.scrubbed_by, None)

    def test_get_web_report_raises_error(self) -> None:
        mock_web_report_model = self.android_report_model
        mock_web_report_model.platform = self.PLATFORM_WEB

        with self.assertRaisesRegex(
            NotImplementedError,
            'Web app feedback report domain objects must be defined.'):
            app_feedback_report_services.get_report_from_model(
                mock_web_report_model)

    def test_get_report_from_model_has_same_user_supplied_feedback_info(
            self
    ) -> None:
        user_supplied_feedback = self.android_report_obj.user_supplied_feedback

        self.assertEqual(
            user_supplied_feedback.report_type.value,
            self.android_report_model.report_type)
        self.assertEqual(
            user_supplied_feedback.category.value,
            self.android_report_model.category)
        self.assertEqual(
            user_supplied_feedback.user_feedback_selected_items, [])
        self.assertEqual(
            user_supplied_feedback.user_feedback_other_text_input,
            self.android_report_model.android_report_info[
                'user_feedback_other_text_input'])

    def test_get_report_from_model_has_same_device_system_info(self) -> None:
        assert isinstance(
            self.android_report_obj.device_system_context,
            app_feedback_report_domain.AndroidDeviceSystemContext)
        device_system_context = self.android_report_obj.device_system_context
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
            device_system_context.network_type.value,
            self.android_report_model.android_report_info[
                'network_type'])

    def test_get_report_from_model_has_same_app_info(self) -> None:
        assert isinstance(
            self.android_report_obj.app_context,
            app_feedback_report_domain.AndroidAppContext
        )
        app_context = self.android_report_obj.app_context
        self.assertEqual(
            app_context.entry_point.entry_point_name,
            self.android_report_model.entry_point)
        self.assertEqual(
            app_context.text_language_code,
            self.android_report_model.text_language_code)
        self.assertEqual(
            app_context.audio_language_code,
            self.android_report_model.audio_language_code)
        self.assertEqual(
            app_context.text_size.value,
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
            app_context.logcat_logs,
            self.android_report_model.android_report_info['logcat_logs'])

    def test_get_report_from_model_with_lower_schema_raises_error(self) -> None:
        self.android_report_model.android_report_info_schema_version = (
            feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION - 1)

        with self.assertRaisesRegex(
            NotImplementedError,
            'Android app feedback report migrations must be added for new '
            'report schemas implemented.'):
            app_feedback_report_services.get_report_from_model(
                self.android_report_model)

    def test_save_android_report_and_get_from_model_has_new_info(self) -> None:
        self.assertIsNone(self.android_report_obj.scrubbed_by)

        # Add a user in the scrubbed_by field and verify that the updated model
        # is saved to storage.
        self.android_report_obj.scrubbed_by = self.user_id
        app_feedback_report_services.save_feedback_report_to_storage(
            self.android_report_obj)
        optional_scrubbed_report_models = (
            app_feedback_report_services.get_report_models(
                [self.android_report_id]))
        # Ruling out the possibility of None for mypy type checking.
        assert optional_scrubbed_report_models[0] is not None
        scrubbed_report_obj = (
            app_feedback_report_services.get_report_from_model(
                optional_scrubbed_report_models[0]
            )
        )

        self.assertEqual(scrubbed_report_obj.scrubbed_by, self.user_id)

    def test_save_web_report_raises_exception(self) -> None:
        mock_web_report_obj = self.android_report_obj
        mock_web_report_obj.platform = self.PLATFORM_WEB

        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'Web report domain objects have not been defined.'):
            app_feedback_report_services.save_feedback_report_to_storage(
                mock_web_report_obj)

    def test_get_ticket_from_model_has_same_ticket_info(self) -> None:
        self.assertEqual(
            self.android_ticket_obj.ticket_id, self.android_ticket_model.id)
        self.assertEqual(
            self.android_ticket_obj.ticket_name,
            self.android_ticket_model.ticket_name)
        self.assertEqual(
            self.android_ticket_obj.platform,
            self.android_ticket_model.platform)
        self.assertEqual(self.android_ticket_obj.github_issue_repo_name, None)
        self.assertEqual(
            self.android_ticket_obj.github_issue_number, None)
        self.assertEqual(self.android_ticket_obj.archived, False)
        self.assertEqual(
            self.android_ticket_obj.newest_report_creation_timestamp,
            self.android_ticket_model.newest_report_timestamp)
        self.assertEqual(
            self.android_ticket_obj.reports,
            self.android_ticket_model.report_ids)

    def test_get_ticket_from_model_with_github_info_has_same_ticket_info(
            self
    ) -> None:
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP))
        ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                self.TICKET_NAME))
        ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel(
                id=ticket_id, ticket_name=self.TICKET_NAME,
                platform=self.PLATFORM_ANDROID,
                github_issue_repo_name=self.PLATFORM_ANDROID,
                github_issue_number=12, archived=False,
                newest_report_timestamp=self.REPORT_SUBMITTED_TIMESTAMP,
                report_ids=[report_id]))
        ticket_obj = app_feedback_report_services.get_ticket_from_model(
            ticket_model)

        self.assertEqual(ticket_obj.ticket_id, ticket_id)
        self.assertEqual(ticket_obj.platform, ticket_model.platform)
        self.assertEqual(
            ticket_obj.github_issue_repo_name,
            ticket_model.github_issue_repo_name)
        self.assertEqual(
            ticket_obj.github_issue_number, ticket_model.github_issue_number)
        self.assertEqual(ticket_obj.archived, ticket_model.archived)
        self.assertEqual(
            ticket_obj.newest_report_creation_timestamp,
            ticket_model.newest_report_timestamp)
        self.assertEqual(ticket_obj.reports, ticket_model.report_ids)

    def test_get_ticket_from_model_is_archived_has_same_ticket_info(
            self
    ) -> None:
        self.android_ticket_model.archived = True
        self.android_ticket_model.update_timestamps()
        self.android_ticket_model.put()
        ticket_obj = app_feedback_report_services.get_ticket_from_model(
            self.android_ticket_model)

        self.assertEqual(ticket_obj.ticket_id, self.android_ticket_model.id)
        self.assertEqual(
            ticket_obj.platform, self.android_ticket_model.platform)
        self.assertEqual(
            ticket_obj.github_issue_repo_name,
            self.android_ticket_model.github_issue_repo_name)
        self.assertEqual(
            ticket_obj.github_issue_number,
            self.android_ticket_model.github_issue_number)
        self.assertEqual(ticket_obj.ticket_id, self.android_ticket_model.id)
        self.assertEqual(ticket_obj.archived, True)
        self.assertEqual(
            ticket_obj.newest_report_creation_timestamp,
            self.android_ticket_model.newest_report_timestamp)
        self.assertEqual(
            ticket_obj.reports, self.android_ticket_model.report_ids)

    def test_get_stats_from_model_is_correct_object(self) -> None:
        stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                app_feedback_report_constants.PLATFORM_CHOICE_ANDROID,
                self.android_ticket_id,
                self.android_report_obj.submitted_on_timestamp))
        app_feedback_report_models.AppFeedbackReportStatsModel.create(
            stats_id, app_feedback_report_constants.PLATFORM_CHOICE_ANDROID,
            self.android_ticket_id,
            self.android_report_obj.submitted_on_timestamp, 1,
            self.REPORT_STATS)
        stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                stats_id))

        actual_stats_obj = app_feedback_report_services.get_stats_from_model(
            stats_model)
        daily_stats = {
            'platform': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.PLATFORM_ANDROID: 1})),
            'report_type': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.REPORT_TYPE_SUGGESTION.value: 1})),
            'country_locale_code': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.COUNTRY_LOCALE_CODE_INDIA: 1})),
            'entry_point_name': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.ENTRY_POINT_NAVIGATION_DRAWER.value: 1})),
            'text_language_code': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.TEXT_LANGUAGE_CODE_ENGLISH: 1})),
            'audio_language_code': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.AUDIO_LANGUAGE_CODE_ENGLISH: 1})),
            'android_sdk_version': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {str(self.ANDROID_SDK_VERSION): 1})),
            'version_name': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {self.ANDROID_PLATFORM_VERSION: 1}))
        }
        expected_stats_obj = (
            app_feedback_report_domain.AppFeedbackReportDailyStats(
                stats_id, self.android_ticket_obj,
                app_feedback_report_constants.PLATFORM_CHOICE_ANDROID,
                self.android_report_obj.submitted_on_timestamp.date(), 1,
                daily_stats))

        self.assertEqual(actual_stats_obj.stats_id, expected_stats_obj.stats_id)
        self.assertEqual(
            actual_stats_obj.ticket.ticket_id,
            expected_stats_obj.ticket.ticket_id)
        self.assertEqual(actual_stats_obj.platform, expected_stats_obj.platform)
        self.assertEqual(
            actual_stats_obj.stats_tracking_date,
            expected_stats_obj.stats_tracking_date)
        self.assertEqual(
            actual_stats_obj.total_reports_submitted,
            expected_stats_obj.total_reports_submitted)
        for stat_name in expected_stats_obj.daily_param_stats.keys():
            actual_stat_values_dict = (
                actual_stats_obj.daily_param_stats[stat_name])
            expected_stat_values_dict = (
                expected_stats_obj.daily_param_stats[stat_name])
            for stat_value in (
                    expected_stat_values_dict.parameter_value_counts.keys()):
                self.assertEqual(
                    actual_stat_values_dict.parameter_value_counts[stat_value],
                    expected_stat_values_dict.parameter_value_counts[
                        stat_value])

    def test_create_report_from_json_is_correct_object(self) -> None:
        report_obj = (
            app_feedback_report_services.create_report_from_json(
                self.REPORT_JSON))

        self.assertTrue(isinstance(
            report_obj, app_feedback_report_domain.AppFeedbackReport))
        self.assertTrue(isinstance(
            report_obj.device_system_context,
            app_feedback_report_domain.AndroidDeviceSystemContext))
        self.assertTrue(isinstance(
            report_obj.app_context,
            app_feedback_report_domain.AndroidAppContext))
        self.assertEqual(report_obj.platform, self.PLATFORM_ANDROID)
        self.assertEqual(
            report_obj.submitted_on_timestamp, self.REPORT_SUBMITTED_TIMESTAMP)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_create_report_from_json_web_report_throws_error(self) -> None:
        web_dict = {
            'platform_type': 'web'
        }
        with self.assertRaisesRegex(
            NotImplementedError,
            'Domain objects for web reports must be implemented.'):
            app_feedback_report_services.create_report_from_json(web_dict)  # type: ignore[arg-type]

    def test_save_new_android_report_from_json_saves_model_to_storage(
            self
    ) -> None:
        report_obj = (
            app_feedback_report_services.create_report_from_json(
                self.REPORT_JSON))
        app_feedback_report_services.save_feedback_report_to_storage(
            report_obj, new_incoming_report=True)
        report_id = report_obj.report_id
        optional_report_models = app_feedback_report_services.get_report_models(
            [report_id])
        # Ruling out the possibility of None for mypy type checking.
        assert optional_report_models[0] is not None
        actual_model = optional_report_models[0]

        self.assertEqual(actual_model.id, report_id)
        # Verify some of the model's fields based on input JSON.
        self.assertEqual(actual_model.platform, self.PLATFORM_ANDROID)
        self.assertEqual(
            actual_model.submitted_on, self.REPORT_SUBMITTED_TIMESTAMP)
        self.assertEqual(
            actual_model.report_type, self.REPORT_TYPE_SUGGESTION.value)
        self.assertEqual(
            actual_model.entry_point, self.ENTRY_POINT_NAVIGATION_DRAWER.value)

    def test_new_reports_added_updates_unticketed_stats_model_correctly(
            self
    ) -> None:
        report_obj_1 = (
            app_feedback_report_services.create_report_from_json(
                self.REPORT_JSON))
        report_obj_2 = (
            app_feedback_report_services.create_report_from_json(
                self.REPORT_JSON))
        app_feedback_report_services.store_incoming_report_stats(report_obj_1)
        app_feedback_report_services.store_incoming_report_stats(report_obj_2)

        # Both reports should be added to the unticketed stat model.
        unticketed_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.PLATFORM_ANDROID,
                app_feedback_report_constants.UNTICKETED_ANDROID_REPORTS_STATS_TICKET_ID, # pylint: disable=line-too-long
                self.REPORT_SUBMITTED_TIMESTAMP.date()))
        unticketed_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                unticketed_stats_id))

        stats_parameter_names = (
            app_feedback_report_constants.StatsParameterNames)
        expected_json = {
            stats_parameter_names.REPORT_TYPE.value: {
                self.REPORT_TYPE_SUGGESTION.value: 2
            },
            stats_parameter_names.COUNTRY_LOCALE_CODE.value: {
                self.COUNTRY_LOCALE_CODE_INDIA: 2
            },
            stats_parameter_names.ENTRY_POINT_NAME.value: {
                self.ENTRY_POINT_NAVIGATION_DRAWER.value: 2
            },
            stats_parameter_names.TEXT_LANGUAGE_CODE.value: {
                self.TEXT_LANGUAGE_CODE_ENGLISH: 2
            },
            stats_parameter_names.AUDIO_LANGUAGE_CODE.value: {
                self.AUDIO_LANGUAGE_CODE_ENGLISH: 2
            },
            stats_parameter_names.ANDROID_SDK_VERSION.value: {
                str(self.ANDROID_SDK_VERSION): 2
            },
            stats_parameter_names.VERSION_NAME.value: {
                self.ANDROID_PLATFORM_VERSION: 2
            }
        }

        self.assertEqual(unticketed_stats_model.platform, self.PLATFORM_ANDROID)
        self.assertEqual(unticketed_stats_model.total_reports_submitted, 2)
        self._verify_stats_model(
            unticketed_stats_model.daily_param_stats, expected_json)

    def test_new_report_added_updates_all_reports_stats_model_correctly(
            self) -> None:
        report_obj_1 = (
            app_feedback_report_services.create_report_from_json(
                self.REPORT_JSON))
        report_obj_2 = (
            app_feedback_report_services.create_report_from_json(
                self.REPORT_JSON))
        app_feedback_report_services.store_incoming_report_stats(report_obj_1)
        app_feedback_report_services.store_incoming_report_stats(report_obj_2)

        # Both reports should be added to the all reports stats model.
        all_report_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.PLATFORM_ANDROID,
                app_feedback_report_constants.ALL_ANDROID_REPORTS_STATS_TICKET_ID, # pylint: disable=line-too-long
                self.REPORT_SUBMITTED_TIMESTAMP.date()))
        all_reports_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                all_report_stats_id))

        stats_parameter_names = (
            app_feedback_report_constants.StatsParameterNames)
        expected_json = {
            stats_parameter_names.REPORT_TYPE.value: {
                self.REPORT_TYPE_SUGGESTION.value: 2
            },
            stats_parameter_names.COUNTRY_LOCALE_CODE.value: {
                self.COUNTRY_LOCALE_CODE_INDIA: 2
            },
            stats_parameter_names.ENTRY_POINT_NAME.value: {
                self.ENTRY_POINT_NAVIGATION_DRAWER.value: 2
            },
            stats_parameter_names.TEXT_LANGUAGE_CODE.value: {
                self.TEXT_LANGUAGE_CODE_ENGLISH: 2
            },
            stats_parameter_names.AUDIO_LANGUAGE_CODE.value: {
                self.AUDIO_LANGUAGE_CODE_ENGLISH: 2
            },
            stats_parameter_names.ANDROID_SDK_VERSION.value: {
                str(self.ANDROID_SDK_VERSION): 2
            },
            stats_parameter_names.VERSION_NAME.value: {
                self.ANDROID_PLATFORM_VERSION: 2
            }
        }

        self.assertEqual(
            all_reports_stats_model.platform, self.PLATFORM_ANDROID)
        self.assertEqual(all_reports_stats_model.total_reports_submitted, 2)
        self._verify_stats_model(
            all_reports_stats_model.daily_param_stats, expected_json)

    def test_get_all_expiring_reports(self) -> None:
        expiring_report_id_1 = (
            self._add_expiring_android_report_with_no_scrubber())
        expiring_report_id_2 = (
            self._add_expiring_android_report_with_no_scrubber())

        expiring_reports = (
            app_feedback_report_services.get_all_expiring_reports_to_scrub())
        expiring_report_ids = [report.report_id for report in expiring_reports]

        self.assertEqual(len(expiring_reports), 2)
        self.assertTrue(expiring_report_id_1 in expiring_report_ids)
        self.assertTrue(expiring_report_id_2 in expiring_report_ids)

    def test_get_all_filter_options(self) -> None:
        filter_options = app_feedback_report_services.get_all_filter_options()
        filter_fields = [
            filter_obj.filter_field for filter_obj in filter_options]

        filter_field_names = (
            app_feedback_report_constants.FilterFieldNames)
        for filter_obj in filter_options:
            self.assertTrue(filter_obj.filter_field in filter_fields)
            if filter_obj.filter_field == (
                    filter_field_names.REPORT_TYPE):
                self.assertEqual(
                    filter_obj.filter_options[0],
                    self.REPORT_TYPE_SUGGESTION.value)
            elif filter_obj.filter_field == (
                    filter_field_names.PLATFORM):
                self.assertEqual(
                    filter_obj.filter_options[0], self.PLATFORM_ANDROID)
            elif filter_obj.filter_field == (
                    filter_field_names.ENTRY_POINT):
                self.assertEqual(
                    filter_obj.filter_options[0],
                    self.ENTRY_POINT_NAVIGATION_DRAWER.value)
            elif filter_obj.filter_field == (
                    filter_field_names.SUBMITTED_ON):
                self.assertEqual(
                    filter_obj.filter_options[0],
                    self.REPORT_SUBMITTED_TIMESTAMP.date())
            elif filter_obj.filter_field == (
                    filter_field_names.ANDROID_DEVICE_MODEL):
                self.assertEqual(
                    filter_obj.filter_options[0], self.ANDROID_DEVICE_MODEL)
            elif filter_obj.filter_field == (
                    filter_field_names.ANDROID_SDK_VERSION):
                self.assertEqual(
                    filter_obj.filter_options[0], self.ANDROID_SDK_VERSION)
            elif filter_obj.filter_field == (
                    filter_field_names.TEXT_LANGUAGE_CODE):
                self.assertEqual(
                    filter_obj.filter_options[0],
                    self.TEXT_LANGUAGE_CODE_ENGLISH)
            elif filter_obj.filter_field == (
                    filter_field_names.AUDIO_LANGUAGE_CODE):
                self.assertEqual(
                    filter_obj.filter_options[0],
                    self.AUDIO_LANGUAGE_CODE_ENGLISH)
            elif filter_obj.filter_field == (
                    filter_field_names.PLATFORM_VERSION):
                self.assertEqual(
                    filter_obj.filter_options[0], self.ANDROID_PLATFORM_VERSION)
            elif filter_obj.filter_field == (
                    filter_field_names.ANDROID_DEVICE_COUNTRY_LOCALE_CODE): # pylint: disable=line-too-long
                self.assertEqual(
                    filter_obj.filter_options[0],
                    self.COUNTRY_LOCALE_CODE_INDIA)

    def test_edit_ticket_name_updates_ticket_model(self) -> None:
        self.android_report_obj.ticket_id = self.android_ticket_id
        new_ticket_name = 'a ticket name'
        app_feedback_report_services.edit_ticket_name(
            self.android_ticket_obj, new_ticket_name)

        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.android_ticket_id))

        self.assertEqual(self.android_ticket_obj.ticket_id, new_ticket_model.id)
        self.assertEqual(new_ticket_model.ticket_name, new_ticket_name)
        self.assertEqual(self.android_report_obj.ticket_id, new_ticket_model.id)

    def test_edit_ticket_name_does_not_change_ticket_id(self) -> None:
        new_ticket_name = 'a new ticket name'
        app_feedback_report_services.edit_ticket_name(
            self.android_ticket_obj, new_ticket_name)

        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.android_ticket_id))

        self.assertEqual(new_ticket_model.ticket_name, new_ticket_name)
        self.assertEqual(self.android_ticket_obj.ticket_id, new_ticket_model.id)
        self.assertEqual(
            self.android_report_obj.platform, new_ticket_model.platform)

    def test_edit_ticket_name_does_not_change_stats_model(self) -> None:
        self.android_ticket_obj.reports = []
        old_ticket_name = 'old ticket name'
        old_ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                old_ticket_name))
        app_feedback_report_models.AppFeedbackReportTicketModel.create(
            old_ticket_id, old_ticket_name, self.PLATFORM_ANDROID,
            None, None, self.REPORT_SUBMITTED_TIMESTAMP,
            [self.android_report_id])
        self.android_report_model.ticket_id = old_ticket_id
        self.android_report_model.update_timestamps()
        self.android_report_model.put()
        self.android_report_obj = (
            app_feedback_report_services.get_report_from_model(
                self.android_report_model))

        old_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.android_report_obj.platform,
                self.android_report_obj.ticket_id,
                self.android_report_obj.submitted_on_timestamp.date()))
        app_feedback_report_models.AppFeedbackReportStatsModel.create(
            old_stats_id, self.android_report_obj.platform, old_ticket_id,
            self.android_report_obj.submitted_on_timestamp.date(), 1,
            self.REPORT_STATS)
        old_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                old_stats_id))

        new_ticket_name = 'a new ticket name'
        app_feedback_report_services.edit_ticket_name(
            self.android_ticket_obj, new_ticket_name)

        new_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.android_report_id))
        new_report_obj = (
            app_feedback_report_services.get_report_from_model(
                new_report_model))
        new_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                new_report_obj.platform,
                new_report_obj.ticket_id,
                new_report_obj.submitted_on_timestamp.date()))
        new_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                new_stats_id))

        self.assertEqual(old_stats_id, new_stats_id)
        self.assertEqual(old_stats_model.ticket_id, new_stats_model.ticket_id)
        self.assertEqual(
            old_stats_model.total_reports_submitted,
            new_stats_model.total_reports_submitted)
        self.assertEqual(
            old_stats_model.platform, new_stats_model.platform)
        self.assertEqual(
            old_stats_model.stats_tracking_date,
            new_stats_model.stats_tracking_date)
        self._verify_stats_model(
            new_stats_model.daily_param_stats,
            old_stats_model.daily_param_stats)

    def test_reassign_report_to_ticket_updates_increasing_stats_model(
            self) -> None:
        new_ticket_id = self._add_new_android_ticket(
            'ticket_name', ['report_id'])
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        new_ticket_obj = app_feedback_report_services.get_ticket_from_model(
            new_ticket_model)

        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)
        old_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.android_report_obj.platform,
                self.android_report_obj.ticket_id,
                self.android_report_obj.submitted_on_timestamp.date()))

        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, new_ticket_obj)
        new_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                new_ticket_obj.platform,
                new_ticket_obj.ticket_id,
                self.android_report_obj.submitted_on_timestamp.date()))
        new_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                new_stats_id))

        stats_parameter_names = (
            app_feedback_report_constants.StatsParameterNames)
        expected_json = {
            stats_parameter_names.REPORT_TYPE.value: {
                self.REPORT_TYPE_SUGGESTION.value: 1
            },
            stats_parameter_names.COUNTRY_LOCALE_CODE.value: {
                self.COUNTRY_LOCALE_CODE_INDIA: 1
            },
            stats_parameter_names.ENTRY_POINT_NAME.value: {
                self.ENTRY_POINT_NAVIGATION_DRAWER.value: 1
            },
            stats_parameter_names.TEXT_LANGUAGE_CODE.value: {
                self.TEXT_LANGUAGE_CODE_ENGLISH: 1
            },
            stats_parameter_names.AUDIO_LANGUAGE_CODE.value: {
                self.AUDIO_LANGUAGE_CODE_ENGLISH: 1
            },
            stats_parameter_names.ANDROID_SDK_VERSION.value: {
                str(self.ANDROID_SDK_VERSION): 1
            },
            stats_parameter_names.VERSION_NAME.value: {
                self.ANDROID_PLATFORM_VERSION: 1
            }
        }
        self.assertNotEqual(old_stats_id, new_stats_id)
        self.assertEqual(new_stats_model.total_reports_submitted, 1)
        self._verify_stats_model(
            new_stats_model.daily_param_stats,
            expected_json)

    def test_reassign_ticket_updates_decreasing_stats_model(self) -> None:
        old_ticket_id = self._add_new_android_ticket(
            'old_ticket_name', [self.android_report_obj.report_id])
        old_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                old_ticket_id))
        old_ticket_obj = app_feedback_report_services.get_ticket_from_model(
            old_ticket_model)
        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)
        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, old_ticket_obj)
        old_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.android_report_obj.platform,
                self.android_report_obj.ticket_id,
                self.android_report_obj.submitted_on_timestamp.date()))

        new_ticket_id = self._add_new_android_ticket(
            'new_ticket_name', ['new_report_id'])
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        new_ticket_obj = app_feedback_report_services.get_ticket_from_model(
            new_ticket_model)
        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, new_ticket_obj)
        # Get the updated stats from the old model.
        decremented_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                old_stats_id))

        stats_parameter_names = (
            app_feedback_report_constants.StatsParameterNames)
        expected_json = {
            stats_parameter_names.REPORT_TYPE.value: {
                self.REPORT_TYPE_SUGGESTION.value: 0
            },
            stats_parameter_names.COUNTRY_LOCALE_CODE.value: {
                self.COUNTRY_LOCALE_CODE_INDIA: 0
            },
            stats_parameter_names.ENTRY_POINT_NAME.value: {
                self.ENTRY_POINT_NAVIGATION_DRAWER.value: 0
            },
            stats_parameter_names.TEXT_LANGUAGE_CODE.value: {
                self.TEXT_LANGUAGE_CODE_ENGLISH: 0
            },
            stats_parameter_names.AUDIO_LANGUAGE_CODE.value: {
                self.AUDIO_LANGUAGE_CODE_ENGLISH: 0
            },
            stats_parameter_names.ANDROID_SDK_VERSION.value: {
                str(self.ANDROID_SDK_VERSION): 0
            },
            stats_parameter_names.VERSION_NAME.value: {
                self.ANDROID_PLATFORM_VERSION: 0
            }
        }
        self.assertEqual(decremented_stats_model.total_reports_submitted, 0)
        self._verify_stats_model(
            decremented_stats_model.daily_param_stats,
            expected_json)

    def test_reassign_ticket_from_none_updates_decreasing_stats_model(
            self) -> None:
        new_ticket_id = self._add_new_android_ticket(
            'ticket_name', ['report_id'])
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        new_ticket_obj = app_feedback_report_services.get_ticket_from_model(
            new_ticket_model)

        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)
        old_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.android_report_obj.platform,
                self.android_report_obj.ticket_id,
                self.android_report_obj.submitted_on_timestamp.date()))

        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, new_ticket_obj)
        # Get the updated stats from the old model.
        decremented_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                old_stats_id))

        stats_parameter_names = (
            app_feedback_report_constants.StatsParameterNames)
        expected_json = {
            stats_parameter_names.REPORT_TYPE.value: {
                self.REPORT_TYPE_SUGGESTION.value: 0
            },
            stats_parameter_names.COUNTRY_LOCALE_CODE.value: {
                self.COUNTRY_LOCALE_CODE_INDIA: 0
            },
            stats_parameter_names.ENTRY_POINT_NAME.value: {
                self.ENTRY_POINT_NAVIGATION_DRAWER.value: 0
            },
            stats_parameter_names.TEXT_LANGUAGE_CODE.value: {
                self.TEXT_LANGUAGE_CODE_ENGLISH: 0
            },
            stats_parameter_names.AUDIO_LANGUAGE_CODE.value: {
                self.AUDIO_LANGUAGE_CODE_ENGLISH: 0
            },
            stats_parameter_names.ANDROID_SDK_VERSION.value: {
                str(self.ANDROID_SDK_VERSION): 0
            },
            stats_parameter_names.VERSION_NAME.value: {
                self.ANDROID_PLATFORM_VERSION: 0
            }
        }
        self.assertEqual(decremented_stats_model.total_reports_submitted, 0)
        self._verify_stats_model(
            decremented_stats_model.daily_param_stats,
            expected_json)

    def test_reassign_ticket_updates_old_ticket_model_to_empty(self) -> None:
        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)
        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, self.android_ticket_obj)
        self.assertIn(self.android_report_id, self.android_ticket_obj.reports)
        new_ticket_id = self._add_new_android_ticket(
            'new_ticket_name', [])
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        new_ticket_obj = app_feedback_report_services.get_ticket_from_model(
            new_ticket_model)

        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, new_ticket_obj)
        updated_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.android_report_id))
        self.assertEqual(updated_report_model.ticket_id, new_ticket_id)
        self.assertIn(
            self.android_report_id, new_ticket_obj.reports)
        empty_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.android_ticket_id))

        self.assertNotEqual(
            self.android_report_obj.ticket_id, empty_ticket_model.id)
        self.assertIsNone(
            empty_ticket_model.newest_report_timestamp)
        self.assertNotIn(
            self.android_report_id, empty_ticket_model.report_ids)

    def test_reassign_ticket_updates_old_ticket_existing_ticket(self) -> None:
        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)
        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, self.android_ticket_obj)
        older_timestamp = (
            self.REPORT_SUBMITTED_TIMESTAMP - datetime.timedelta(days=1))
        for i in range(1, 4):
            # Set timestamps in increasing timestamp order so that the test will
            # iterate through them all and reassign the latest timestamp.
            temp_timestamp = (
                self.REPORT_SUBMITTED_TIMESTAMP - datetime.timedelta(
                    days=4 - i))
            report_id = self._add_current_report(
                submitted_on=temp_timestamp, assign_ticket=False)
            report_model = (
                app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                    report_id))
            report_obj = app_feedback_report_services.get_report_from_model(
                report_model)
            app_feedback_report_services.store_incoming_report_stats(report_obj)
            app_feedback_report_services.reassign_ticket(
                report_obj, self.android_ticket_obj)
        new_ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                'new_ticket_name'))
        app_feedback_report_models.AppFeedbackReportTicketModel.create(
            new_ticket_id, 'new_ticket_name', self.PLATFORM_ANDROID,
            None, None, self.REPORT_SUBMITTED_TIMESTAMP, [])
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        new_ticket_obj = (
            app_feedback_report_services.get_ticket_from_model(
                new_ticket_model))

        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, new_ticket_obj)
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        original_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.android_ticket_id))

        self.assertEqual(
            original_ticket_model.newest_report_timestamp, older_timestamp)
        self.assertNotIn(
            self.android_report_id, original_ticket_model.report_ids)

    def test_reassign_updates_new_ticket_newest_report_creation_timestamp(
            self) -> None:
        ticket_name = 'ticket_name'
        report_ids = ['report_id']
        older_timestamp = (
            self.REPORT_SUBMITTED_TIMESTAMP - datetime.timedelta(days=2))
        original_ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                ticket_name))
        app_feedback_report_models.AppFeedbackReportTicketModel.create(
            original_ticket_id, ticket_name, self.PLATFORM_ANDROID,
            None, None, older_timestamp, report_ids)
        original_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                original_ticket_id))
        original_ticket_obj = (
            app_feedback_report_services.get_ticket_from_model(
                original_ticket_model))
        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)

        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, original_ticket_obj)
        updated_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                original_ticket_obj.ticket_id))

        self.assertEqual(
            updated_ticket_model.newest_report_timestamp,
            self.android_report_obj.submitted_on_timestamp)

    def test_reassign_ticket_does_not_change_all_report_stats_model(
            self) -> None:
        new_ticket_id = self._add_new_android_ticket(
            'ticket_name', ['report_id'])
        new_ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                new_ticket_id))
        new_ticket_obj = app_feedback_report_services.get_ticket_from_model(
            new_ticket_model)

        app_feedback_report_services.store_incoming_report_stats(
            self.android_report_obj)
        old_all_report_stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                self.android_report_obj.platform,
                app_feedback_report_constants.ALL_ANDROID_REPORTS_STATS_TICKET_ID, # pylint: disable=line-too-long
                self.android_report_obj.submitted_on_timestamp.date()))
        old_all_reports_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                old_all_report_stats_id))

        app_feedback_report_services.reassign_ticket(
            self.android_report_obj, new_ticket_obj)
        new_all_reports_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                old_all_report_stats_id))

        self.assertEqual(
            new_all_reports_stats_model.total_reports_submitted,
            old_all_reports_stats_model.total_reports_submitted)
        self._verify_stats_model(
            new_all_reports_stats_model.daily_param_stats,
            old_all_reports_stats_model.daily_param_stats)

    def test_reassign_web_ticket_raises_error(self) -> None:
        mock_web_report_obj = self.android_report_obj
        mock_web_report_obj.platform = self.PLATFORM_WEB

        with self.assertRaisesRegex(
            NotImplementedError,
            'Assigning web reports to tickets has not been implemented yet.'):
            app_feedback_report_services.reassign_ticket(
                mock_web_report_obj, None)

    def test_reassign_ticket_with_invalid_stats_model_raises_error(
            self) -> None:
        # Set an invalid ticket_id so that the stats model calculates an invalid
        # id for this ticket's stats model.
        self.android_report_obj.ticket_id = 'invalid_id'
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The report is being removed from an invalid ticket id'):
            app_feedback_report_services.reassign_ticket(
                self.android_report_obj, None)

    def test_scrub_android_report_removes_info(self) -> None:
        app_feedback_report_services.scrub_single_app_feedback_report(
            self.android_report_obj, self.user_id)
        scrubbed_report_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.android_report_obj.report_id))

        # Values from the model dict are read as strings in the assertion.
        expected_report_dict = {
            'user_feedback_selected_items': [],
            'user_feedback_other_text_input': '',
            'event_logs': [],
            'logcat_logs': [],
            'package_version_code': '1',
            'android_device_language_locale_code': 'en',
            'build_fingerprint': 'example_fingerprint_id',
            'network_type': 'wifi',
            'text_size': 'medium_text_size',
            'only_allows_wifi_download_and_update': 'True',
            'automatically_update_topics': 'False',
            'account_is_profile_admin': 'False'
        }

        self.assertEqual(scrubbed_report_model.scrubbed_by, self.user_id)
        self.assertEqual(
            scrubbed_report_model.android_report_info, expected_report_dict)

    def test_scrubbing_on_current_and_expired_reports_only_scrubs_expired(
            self) -> None:
        current_report_id = self._add_current_report()
        expired_report_id = self._add_expiring_android_report_with_no_scrubber()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            self.user_id)

        scrubbed_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                expired_report_id))
        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                current_report_id))

        self._verify_report_is_scrubbed(scrubbed_model, self.user_id)
        self._verify_report_is_not_scrubbed(current_model)

    def test_scrubbing_with_no_reports_in_storage_does_not_scrub_storage(
            self) -> None:
        current_models_query = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_all())
        current_models: Sequence[
            app_feedback_report_models.AppFeedbackReportModel] = (
                current_models_query.fetch())
        self.assertEqual(len(current_models), 0)
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            'scrubber_user')

        stored_models_query = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_all())
        stored_models: Sequence[
            app_feedback_report_models.AppFeedbackReportStatsModel] = (
                stored_models_query.fetch())
        self.assertEqual(len(stored_models), 0)

    def test_scrubbing_on_only_current_reports_does_not_scrub_models(
            self) -> None:
        current_report_id = self._add_current_report()
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            self.user_id)

        current_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                current_report_id))
        self._verify_report_is_not_scrubbed(current_model)

    def test_scrubbing_on_all_expired_models_updates_all_models(self) -> None:
        android_report_id_1 = (
            self._add_expiring_android_report_with_no_scrubber())
        android_report_id_2 = (
            self._add_expiring_android_report_with_no_scrubber())
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            self.user_id)

        android_model_1 = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                android_report_id_1))
        android_model_2 = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                android_report_id_2))

        self._verify_report_is_scrubbed(android_model_1, self.user_id)
        self._verify_report_is_scrubbed(android_model_2, self.user_id)

    def test_scrubbing_on_already_scrubbed_models_does_not_change_models(
            self) -> None:
        report_id = self._add_scrubbed_report('scrubber_user')
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            self.user_id)

        scrubbed_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                report_id))

        self._verify_report_is_scrubbed(scrubbed_model, 'scrubber_user')

    def test_scrubbing_on_newly_added_expired_models_scrubs_new_models(
            self) -> None:
        expired_report_id = (
            self._add_expiring_android_report_with_no_scrubber())
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            self.user_id)
        scrubbed_android_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                expired_report_id))
        self._verify_report_is_scrubbed(
            scrubbed_android_model, self.user_id)

        self.signup('user2@test.com', 'user2')
        different_user = self.get_user_id_from_email('user2@test.com')
        to_scrub_report_id = (
            self._add_expiring_android_report_with_no_scrubber())
        app_feedback_report_services.scrub_all_unscrubbed_expiring_reports(
            different_user)

        newly_scrubbed_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                to_scrub_report_id))
        self._verify_report_is_scrubbed(
            newly_scrubbed_model, different_user)
        # Check that the originally-scrubbed model is still valid.
        self._verify_report_is_scrubbed(
            scrubbed_android_model, self.user_id)

    def test_store_incoming_report_stats_with_web_platform_raises_error(
            self) -> None:
        mock_web_report_obj = self.android_report_obj
        mock_web_report_obj.platform = (
            app_feedback_report_constants.PLATFORM_CHOICE_WEB)

        with self.assertRaisesRegex(
            NotImplementedError,
            'Stats aggregation for incoming web reports have not been '
            'implemented yet.'):
            app_feedback_report_services.store_incoming_report_stats(
                mock_web_report_obj)

    def test_calculate_new_stats_count_for_parameter_adds_new_stats_val_to_dict(
            self) -> None:
        stats_map = {
            'value_1': 1
        }
        delta = 1

        new_stats_map = (
            app_feedback_report_services.calculate_new_stats_count_for_parameter( # pylint: disable=line-too-long
                stats_map, 'value_2', delta))

        self.assertEqual(new_stats_map['value_2'], delta)

    def test_calculate_new_stats_count_with_invalid_delta_raises_error(
            self) -> None:
        stats_map = {
            'current_value': 1
        }
        delta = -1

        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'Cannot decrement a count for a parameter value that does '
            'not exist'):
            app_feedback_report_services.calculate_new_stats_count_for_parameter( # pylint: disable=line-too-long
                stats_map, 'value_2', delta)

    def _verify_report_is_scrubbed(
            self,
            model_entity: app_feedback_report_models.AppFeedbackReportModel,
            scrubber: str
    ) -> None:
        """Verifies the report model is scrubbed."""
        self.assertIsNotNone(model_entity)
        self.assertEqual(
            model_entity.scrubbed_by, scrubber)

    def _verify_report_is_not_scrubbed(
            self,
            model_entity: app_feedback_report_models.AppFeedbackReportModel
    ) -> None:
        """Verifies the report model is not scrubbed."""
        self.assertIsNotNone(model_entity)
        self.assertIsNone(model_entity.scrubbed_by)

    def _add_current_report(
            self,
            submitted_on: datetime.datetime=datetime.datetime.fromtimestamp(
                1615519337),
            assign_ticket: bool=True
    ) -> str:
        """Adds reports to the model that should not be scrubbed."""
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.TIMESTAMP_AT_MAX_DAYS))
        ticket_id = None
        if assign_ticket:
            ticket_id = self._add_new_android_ticket(
                'current report ticket name', [report_id])
        current_feedback_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=report_id,
                platform=self.PLATFORM_ANDROID,
                ticket_id=ticket_id,
                submitted_on=submitted_on,
                local_timezone_offset_hrs=0,
                report_type=self.REPORT_TYPE_SUGGESTION.value,
                category=self.CATEGORY_OTHER.value,
                platform_version=self.ANDROID_PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER.value,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        current_feedback_report_model.created_on = self.TIMESTAMP_AT_MAX_DAYS
        current_feedback_report_model.put()
        return report_id

    def _add_expiring_android_report_with_no_scrubber(self) -> str:
        """Adds reports to the model that should be scrubbed."""
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.TIMESTAMP_OVER_MAX_DAYS))
        ticket_id = self._add_new_android_ticket(
            'expiring report ticket name', [report_id])
        expiring_android_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=report_id,
                platform=self.PLATFORM_ANDROID,
                ticket_id=ticket_id,
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                local_timezone_offset_hrs=0,
                report_type=self.REPORT_TYPE_SUGGESTION.value,
                category=self.CATEGORY_OTHER.value,
                platform_version=self.ANDROID_PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER.value,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        expiring_android_report_model.created_on = self.TIMESTAMP_OVER_MAX_DAYS
        expiring_android_report_model.put()
        return report_id

    def _add_scrubbed_report(self, scrubber_user: str) -> str:
        """Add an already-scrubbed report to the model."""
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP))
        ticket_id = self._add_new_android_ticket(
            'scrubbed report ticket name', [report_id])
        expiring_android_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=report_id,
                platform=self.PLATFORM_ANDROID,
                scrubbed_by=scrubber_user,
                ticket_id=ticket_id,
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                local_timezone_offset_hrs=0,
                report_type=self.REPORT_TYPE_SUGGESTION.value,
                category=self.CATEGORY_OTHER.value,
                platform_version=self.ANDROID_PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.COUNTRY_LOCALE_CODE_INDIA),
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER.value,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                android_report_info_schema_version=(
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)))
        expiring_android_report_model.created_on = self.TIMESTAMP_OVER_MAX_DAYS
        expiring_android_report_model.put()
        return report_id

    def _add_new_android_ticket(
            self, ticket_name: str, report_ids: List[str]) -> str:
        """Create an Android report ticket."""
        android_ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                ticket_name))
        app_feedback_report_models.AppFeedbackReportTicketModel.create(
            android_ticket_id, ticket_name, self.PLATFORM_ANDROID,
            None, None, self.REPORT_SUBMITTED_TIMESTAMP, report_ids)
        return android_ticket_id

    def _verify_stats_model(
            self,
            stats_json: Dict[str, Dict[str, int]],
            expected_json: Dict[str, Dict[str, int]]
    ) -> None:
        """Verify the fields of the feedback report stats model."""
        self.assertEqual(
            stats_json['report_type'],
            expected_json['report_type'])
        self.assertEqual(
            stats_json['country_locale_code'],
            expected_json['country_locale_code'])
        self.assertEqual(
            stats_json['entry_point_name'],
            expected_json['entry_point_name'])
        self.assertEqual(
            stats_json['text_language_code'],
            expected_json['text_language_code'])
        self.assertEqual(
            stats_json['audio_language_code'],
            expected_json['audio_language_code'])
        self.assertEqual(
            stats_json['android_sdk_version'],
            expected_json['android_sdk_version'])
        self.assertEqual(
            stats_json['version_name'],
            expected_json['version_name'])
