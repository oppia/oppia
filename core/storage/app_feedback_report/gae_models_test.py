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

from __future__ import annotations

import datetime
import enum
import types

from core import feconf
from core import utils
from core.platform import models
from core.tests import test_utils

from typing import Final, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_feedback_report_models
    from mypy_imports import base_models

(base_models, app_feedback_report_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.APP_FEEDBACK_REPORT
])


class AppFeedbackReportModelTests(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReportModel class."""

    PLATFORM_ANDROID: Final = 'android'
    PLATFORM_WEB: Final = 'web'
    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP_1: Final = datetime.datetime.fromtimestamp(
        1615151836
    )
    REPORT_SUBMITTED_TIMESTAMP_1_MSEC: Final = (
        utils.get_time_in_millisecs(REPORT_SUBMITTED_TIMESTAMP_1))
    # Timestamp in sec since epoch for Mar 12 2021 3:22:17 UTC.
    REPORT_SUBMITTED_TIMESTAMP_2: Final = datetime.datetime.fromtimestamp(
        1615519337
    )
    REPORT_SUBMITTED_TIMESTAMP_2_MSEC: Final = (
        utils.get_time_in_millisecs(REPORT_SUBMITTED_TIMESTAMP_2))
    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP: Final = datetime.datetime.fromtimestamp(
        1616173836
    )
    TICKET_CREATION_TIMESTAMP_MSEC: Final = (
        utils.get_time_in_millisecs(TICKET_CREATION_TIMESTAMP))
    TICKET_ID: Final = '%s.%s.%s' % (
        'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC),
        '16CharString1234')
    REPORT_TYPE_SUGGESTION: Final = 'suggestion'
    CATEGORY_OTHER: Final = 'other'
    PLATFORM_VERSION: Final = '0.1-alpha-abcdef1234'
    DEVICE_COUNTRY_LOCALE_CODE_INDIA: Final = 'in'
    ANDROID_DEVICE_MODEL: Final = 'Pixel 4a'
    ANDROID_SDK_VERSION: Final = 28
    ENTRY_POINT_NAVIGATION_DRAWER: Final = 'navigation_drawer'
    TEXT_LANGUAGE_CODE_ENGLISH: Final = 'en'
    AUDIO_LANGUAGE_CODE_ENGLISH: Final = 'en'
    ANDROID_REPORT_INFO: app_feedback_report_models.ReportInfoDict = {
        'user_feedback_selected_items': [],
        'user_feedback_other_text_input': 'add an admin',
        'event_logs': ['event1', 'event2'],
        'logcat_logs': ['logcat1', 'logcat2'],
        'package_version_code': 1,
        'build_fingerprint': 'example_fingerprint_id',
        'network_type': 'wifi',
        'android_device_language_locale_code': 'en',
        'language_locale_code': 'en',
        'entry_point_info': {
            'entry_point_name': 'crash',
        },
        'text_size': 'MEDIUM_TEXT_SIZE',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'is_curriculum_admin': False,
        'account_is_profile_admin': False
    }
    WEB_REPORT_INFO: app_feedback_report_models.ReportInfoDict = {
        'user_feedback_selected_items': [],
        'user_feedback_other_text_input': 'add an admin',
        'event_logs': ['event1', 'event2'],
        'logcat_logs': ['logcat1', 'logcat2'],
        'package_version_code': 1,
        'build_fingerprint': 'example_fingerprint_id',
        'network_type': 'wifi',
        'android_device_language_locale_code': 'en',
        'language_locale_code': 'en',
        'entry_point_info': {
            'entry_point_name': 'crash',
        },
        'text_size': 'MEDIUM_TEXT_SIZE',
        'only_allows_wifi_download_and_update': True,
        'automatically_update_topics': False,
        'is_curriculum_admin': False,
        'account_is_profile_admin': False
    }
    ANDROID_REPORT_INFO_SCHEMA_VERSION: Final = 1
    WEB_REPORT_INFO_SCHEMA_VERSION: Final = 1

    def setUp(self) -> None:
        """Set up  models in datastore for use in testing."""
        super().setUp()

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.feedback_report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id='%s.%s.%s' % (
                    self.PLATFORM_ANDROID,
                    int(self.REPORT_SUBMITTED_TIMESTAMP_1_MSEC),
                    'randomInteger123'),
                platform=self.PLATFORM_ANDROID,
                scrubbed_by=self.user_id,
                ticket_id='%s.%s.%s' % (
                    'random_hash',
                    int(self.TICKET_CREATION_TIMESTAMP_MSEC),
                    '16CharString1234'),
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP_1,
                local_timezone_offset_hrs=0,
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
                    self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
            )
        )
        self.feedback_report_model.update_timestamps()
        self.feedback_report_model.put()

    def test_create_and_get_android_report_model(self) -> None:
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP_2))
        app_feedback_report_models.AppFeedbackReportModel.create(
            report_id, self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP_2,
            0, self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
            self.PLATFORM_VERSION, self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH,
            self.AUDIO_LANGUAGE_CODE_ENGLISH, self.ANDROID_REPORT_INFO,
            None)

        report_model = app_feedback_report_models.AppFeedbackReportModel.get(
            report_id)

        self.assertEqual(report_model.platform, self.PLATFORM_ANDROID)
        self.assertEqual(
            report_model.submitted_on, self.REPORT_SUBMITTED_TIMESTAMP_2)
        self.assertEqual(report_model.report_type, self.REPORT_TYPE_SUGGESTION)
        self.assertEqual(report_model.android_report_info_schema_version, 1)
        self.assertEqual(report_model.web_report_info, None)

    def test_create_and_get_web_report_model(self) -> None:
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                self.PLATFORM_WEB, self.REPORT_SUBMITTED_TIMESTAMP_2))
        app_feedback_report_models.AppFeedbackReportModel.create(
            report_id, self.PLATFORM_WEB, self.REPORT_SUBMITTED_TIMESTAMP_2, 0,
            self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
            self.PLATFORM_VERSION, self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
            self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
            self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
            self.TEXT_LANGUAGE_CODE_ENGLISH, self.AUDIO_LANGUAGE_CODE_ENGLISH,
            None, self.WEB_REPORT_INFO)

        report_model = app_feedback_report_models.AppFeedbackReportModel.get(
            report_id)

        self.assertEqual(report_model.platform, self.PLATFORM_WEB)
        self.assertEqual(
            report_model.submitted_on, self.REPORT_SUBMITTED_TIMESTAMP_2)
        self.assertEqual(report_model.report_type, self.REPORT_TYPE_SUGGESTION)
        self.assertEqual(report_model.web_report_info_schema_version, 1)
        self.assertEqual(report_model.android_report_info, None)

    def test_create_raises_exception_by_mocking_collision(self) -> None:
        model_class = app_feedback_report_models.AppFeedbackReportModel
        # Test Exception for AppFeedbackReportModel.
        with self.assertRaisesRegex(
            Exception, 'The id generator for AppFeedbackReportModel is '
            'producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                app_feedback_report_models.AppFeedbackReportModel,
                'get_by_id', types.MethodType(
                    lambda x, y: True,
                    app_feedback_report_models.AppFeedbackReportModel)):
                report_id = model_class.generate_id(
                    self.PLATFORM_ANDROID, self.REPORT_SUBMITTED_TIMESTAMP_2)
                model_class.create(
                    report_id, self.PLATFORM_ANDROID,
                    self.REPORT_SUBMITTED_TIMESTAMP_1, 0,
                    self.REPORT_TYPE_SUGGESTION, self.CATEGORY_OTHER,
                    self.PLATFORM_VERSION,
                    self.DEVICE_COUNTRY_LOCALE_CODE_INDIA,
                    self.ANDROID_SDK_VERSION, self.ANDROID_DEVICE_MODEL,
                    self.ENTRY_POINT_NAVIGATION_DRAWER, None, None, None, None,
                    self.TEXT_LANGUAGE_CODE_ENGLISH,
                    self.AUDIO_LANGUAGE_CODE_ENGLISH, self.ANDROID_REPORT_INFO,
                    None)

    def test_get_deletion_policy(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(
            model.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_export_data_without_scrubber(self) -> None:
        self.feedback_report_model.scrubbed_by = 'id'
        self.feedback_report_model.update_timestamps()
        self.feedback_report_model.put()

        exported_data = (
            app_feedback_report_models.AppFeedbackReportModel.export_data('id'))

        report_id = '%s.%s.%s' % (
            self.PLATFORM_ANDROID,
            int(self.REPORT_SUBMITTED_TIMESTAMP_1_MSEC),
            'randomInteger123')
        expected_data = {
            report_id: {
                'scrubbed_by': None,
                'platform': self.PLATFORM_ANDROID,
                'ticket_id': self.TICKET_ID,
                'submitted_on': utils.get_human_readable_time_string(
                    self.REPORT_SUBMITTED_TIMESTAMP_1_MSEC),
                'local_timezone_offset_hrs': 0,
                'report_type': self.REPORT_TYPE_SUGGESTION,
                'category': self.CATEGORY_OTHER,
                'platform_version': self.PLATFORM_VERSION
            }
        }
        self.assertEqual(exported_data, expected_data)

    def test_export_data_with_scrubber(self) -> None:
        exported_data = (
            app_feedback_report_models.AppFeedbackReportModel.export_data(
                self.user_id))

        report_id = '%s.%s.%s' % (
            self.PLATFORM_ANDROID,
            int(self.REPORT_SUBMITTED_TIMESTAMP_1_MSEC),
            'randomInteger123')
        expected_data = {
            report_id: {
                'scrubbed_by': self.NEW_USER_USERNAME,
                'platform': self.PLATFORM_ANDROID,
                'ticket_id': self.TICKET_ID,
                'submitted_on': utils.get_human_readable_time_string(
                    self.REPORT_SUBMITTED_TIMESTAMP_1_MSEC),
                'local_timezone_offset_hrs': 0,
                'report_type': self.REPORT_TYPE_SUGGESTION,
                'category': self.CATEGORY_OTHER,
                'platform_version': self.PLATFORM_VERSION
            }
        }
        self.assertEqual(exported_data, expected_data)

    def test_get_all_unscrubbed_expiring_report_models(self) -> None:
        expired_timestamp = datetime.datetime.utcnow() - (
            feconf.APP_FEEDBACK_REPORT_MAXIMUM_LIFESPAN +
            datetime.timedelta(days=10))
        expired_model = app_feedback_report_models.AppFeedbackReportModel(
            id='%s.%s.%s' % (
                self.PLATFORM_ANDROID,
                int(utils.get_time_in_millisecs(expired_timestamp)),
                'randomInteger123'),
            platform=self.PLATFORM_ANDROID,
            scrubbed_by=None,
            ticket_id='%s.%s.%s' % (
                'random_hash',
                int(self.TICKET_CREATION_TIMESTAMP_MSEC),
                '16CharString1234'),
            submitted_on=expired_timestamp,
            local_timezone_offset_hrs=0,
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
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        )
        expired_model.created_on = expired_timestamp
        expired_model.put()

        model_class = app_feedback_report_models.AppFeedbackReportModel
        model_entities = model_class.get_all_unscrubbed_expiring_report_models()

        self.assertEqual(len(model_entities), 1)
        self.assertEqual(model_entities[0].id, expired_model.id)

    def test_get_lowest_supported_role(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(
            model.get_lowest_supported_role(), feconf.ROLE_ID_MODERATOR)

    def test_has_reference_to_user_id(self) -> None:
        model_class = app_feedback_report_models.AppFeedbackReportModel
        # The only user references will be those who have scrubbed a report.
        report_id = '%s.%s.%s' % (
            self.PLATFORM_ANDROID,
            int(self.REPORT_SUBMITTED_TIMESTAMP_1_MSEC),
            'randomInteger123')
        model_entity = model_class.get(report_id)
        model_entity.scrubbed_by = 'scrubber_user'
        model_entity.update_timestamps()
        model_entity.put()

        self.assertTrue(model_class.has_reference_to_user_id('scrubber_user'))
        self.assertFalse(model_class.has_reference_to_user_id('id_x'))

    def test_get_filter_options_with_invalid_field_throws_exception(
        self
    ) -> None:
        model_class = app_feedback_report_models.AppFeedbackReportModel

        class InvalidFilter(enum.Enum):
            """Invalid filter."""

            INVALID_FIELD = 'invalid_field'
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The field %s is not a valid field to filter reports on' % (
                InvalidFilter.INVALID_FIELD.name)
        ):
            with self.swap(
                model_class, 'query',
                self._mock_query_filters_returns_empty_list):
                # Here we use MyPy ignore because we passes arg of type
                # InvalidFilter to type class filter_field_names. This is done
                # to ensure that InvalidInputException is thrown.
                model_class.get_filter_options_for_field(
                    InvalidFilter.INVALID_FIELD) # type: ignore[arg-type]

    def test_get_filter_options_returns_correctly(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames.REPORT_TYPE),
            [self.REPORT_TYPE_SUGGESTION])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames.PLATFORM),
            [self.PLATFORM_ANDROID])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames.ENTRY_POINT),
            [self.ENTRY_POINT_NAVIGATION_DRAWER])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames.SUBMITTED_ON),
            [self.REPORT_SUBMITTED_TIMESTAMP_1.date()])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames
                .ANDROID_DEVICE_MODEL),
            [self.ANDROID_DEVICE_MODEL])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames.TEXT_LANGUAGE_CODE),
            [self.TEXT_LANGUAGE_CODE_ENGLISH])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames
                .ANDROID_SDK_VERSION),
            [self.ANDROID_SDK_VERSION])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames
                .AUDIO_LANGUAGE_CODE),
            [self.AUDIO_LANGUAGE_CODE_ENGLISH])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames.PLATFORM_VERSION),
            [self.PLATFORM_VERSION])
        self.assertEqual(
            model.get_filter_options_for_field(
                app_feedback_report_models.FilterFieldNames
                .ANDROID_DEVICE_COUNTRY_LOCALE_CODE),
            [self.DEVICE_COUNTRY_LOCALE_CODE_INDIA])

    def test_get_export_policy(self) -> None:
        expected_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'platform': base_models.EXPORT_POLICY.EXPORTED,
            'scrubbed_by': base_models.EXPORT_POLICY.EXPORTED,
            'ticket_id': base_models.EXPORT_POLICY.EXPORTED,
            'submitted_on': base_models.EXPORT_POLICY.EXPORTED,
            'local_timezone_offset_hrs': base_models.EXPORT_POLICY.EXPORTED,
            'report_type': base_models.EXPORT_POLICY.EXPORTED,
            'category': base_models.EXPORT_POLICY.EXPORTED,
            'platform_version': base_models.EXPORT_POLICY.EXPORTED,
            'android_device_country_locale_code': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'android_device_model': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'android_sdk_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point_topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point_story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entry_point_exploration_id': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'entry_point_subtopic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'text_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'audio_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'android_report_info': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'android_report_info_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'web_report_info': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'web_report_info_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(model.get_export_policy(), expected_dict)

    def test_get_model_association_to_user(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportModel
        self.assertEqual(
            model.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def _mock_query_filters_returns_empty_list(
        self, projection: bool, distinct: bool  # pylint: disable=unused-argument
    ) -> List[str]:
        """Mock the model query to test for an invalid filter field. Named
        parameters 'projection' and 'distinct' are required to mock the
        query function.
        """
        return []


class AppFeedbackReportTicketModelTests(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReportTicketModel class."""

    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP: Final = datetime.datetime.fromtimestamp(
        1615151836
    )
    REPORT_SUBMITTED_TIMESTAMP_MSEC: Final = utils.get_time_in_millisecs(
        REPORT_SUBMITTED_TIMESTAMP)
    # Timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    NEWEST_REPORT_TIMESTAMP: Final = datetime.datetime.fromtimestamp(1615151836)
    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP: Final = datetime.datetime.fromtimestamp(
        1616173836
    )
    TICKET_CREATION_TIMESTAMP_MSEC: Final = utils.get_time_in_millisecs(
        TICKET_CREATION_TIMESTAMP)

    PLATFORM: Final = 'android'
    PLATFORM_VERSION: Final = '0.1-alpha-abcdef1234'
    TICKET_NAME: Final = 'example ticket name'
    TICKET_ID: Final = '%s.%s.%s' % (
        'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC),
        '16CharString1234')
    REPORT_IDS: Final = ['%s.%s.%s' % (
        PLATFORM, int(REPORT_SUBMITTED_TIMESTAMP_MSEC),
        'randomInteger123')]

    def test_create_and_get_ticket_model(self) -> None:
        ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                self.TICKET_NAME))
        app_feedback_report_models.AppFeedbackReportTicketModel.create(
            entity_id=ticket_id, ticket_name=self.TICKET_NAME,
            platform=self.PLATFORM, github_issue_repo_name=None,
            github_issue_number=None,
            newest_report_timestamp=self.NEWEST_REPORT_TIMESTAMP,
            report_ids=self.REPORT_IDS)

        ticket_model = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get(
                ticket_id))

        self.assertEqual(ticket_model.id, ticket_id)
        self.assertEqual(ticket_model.platform, self.PLATFORM)
        self.assertEqual(
            ticket_model.newest_report_timestamp, self.NEWEST_REPORT_TIMESTAMP)
        self.assertEqual(ticket_model.ticket_name, self.TICKET_NAME)
        self.assertEqual(ticket_model.report_ids, self.REPORT_IDS)

    def test_create_raises_exception_by_mocking_collision(self) -> None:
        model_class = app_feedback_report_models.AppFeedbackReportTicketModel
        # Test Exception for AppFeedbackReportTicketModel.
        with self.assertRaisesRegex(
            Exception,
            'The id generator for AppFeedbackReportTicketModel is producing too'
            'many collisions.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(model_class, 'get_by_id', types.MethodType(
                lambda x, y: True, model_class)):
                ticket_id = model_class.generate_id(self.TICKET_NAME)
                model_class.create(
                    entity_id=ticket_id, ticket_name=self.TICKET_NAME,
                    platform=self.PLATFORM, github_issue_repo_name=None,
                    github_issue_number=None,
                    newest_report_timestamp=self.NEWEST_REPORT_TIMESTAMP,
                    report_ids=self.REPORT_IDS)

    def test_get_deletion_policy(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportTicketModel()
        self.assertEqual(
            model.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_lowest_supported_role(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportTicketModel
        self.assertEqual(
            model.get_lowest_supported_role(), feconf.ROLE_ID_MODERATOR)

    def test_get_export_policy(self) -> None:
        expected_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'ticket_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'platform': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'github_issue_repo_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'github_issue_number': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'archived': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'newest_report_timestamp': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'report_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        model = app_feedback_report_models.AppFeedbackReportTicketModel
        self.assertEqual(model.get_export_policy(), expected_dict)

    def test_get_model_association_to_user(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportTicketModel
        self.assertEqual(
            model.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)


class AppFeedbackReportStatsModelTests(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReportStatsModel class."""

    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP: Final = datetime.datetime.fromtimestamp(
        1616173836
    )
    TICKET_CREATION_TIMESTAMP_MSEC: Final = (
        utils.get_time_in_millisecs(TICKET_CREATION_TIMESTAMP))
    TICKET_ID: Final = '%s.%s.%s' % (
        'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC),
        '16CharString1234')
    # Timestamp date in sec since epoch for Mar 19 2021 UTC.
    STATS_DATE: Final = datetime.date.fromtimestamp(1616173836)
    DAILY_STATS: Final = {
        'report_type': {
            'suggestion': 1, 'issue': 1, 'crash': 1}}
    TOTAL_REPORTS_SUBMITTED: Final = 3

    def test_create_and_get_stats_model(self) -> None:
        entity_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                'android', self.TICKET_ID, self.STATS_DATE))
        app_feedback_report_models.AppFeedbackReportStatsModel.create(
            entity_id=entity_id,
            platform='android',
            ticket_id=self.TICKET_ID,
            stats_tracking_date=self.STATS_DATE,
            total_reports_submitted=self.TOTAL_REPORTS_SUBMITTED,
            daily_param_stats=self.DAILY_STATS)

        stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                entity_id))
        # Ruling out the possibility of None for mypy type checking.
        assert stats_model is not None

        self.assertEqual(stats_model.id, '%s:%s:%s' % (
            'android', self.TICKET_ID, self.STATS_DATE.isoformat()))
        self.assertEqual(stats_model.platform, 'android')
        self.assertEqual(
            stats_model.stats_tracking_date, self.STATS_DATE)
        self.assertEqual(
            stats_model.total_reports_submitted, self.TOTAL_REPORTS_SUBMITTED)
        self.assertEqual(stats_model.daily_param_stats, self.DAILY_STATS)

    def test_get_id_on_same_ticket_produces_same_id(self) -> None:
        model_class = (
            app_feedback_report_models.AppFeedbackReportStatsModel)
        entity_id = model_class.calculate_id(
            'android', self.TICKET_ID, self.STATS_DATE)
        entity_id_copy = model_class.calculate_id(
            'android', self.TICKET_ID, self.STATS_DATE)

        self.assertEqual(entity_id, entity_id_copy)

    def test_null_ticket_id_is_handled(self) -> None:
        model_class = (
            app_feedback_report_models.AppFeedbackReportStatsModel)
        entity_id = model_class.calculate_id(
            'android', None, self.STATS_DATE)
        self.assertEqual(
            entity_id,
            '%s:%s:%s' % (
                'android', 'unticketed_android_reports_stats_ticket_id',
                self.STATS_DATE.isoformat())
        )

    def test_get_export_policy(self) -> None:
        expected_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'ticket_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'platform': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'stats_tracking_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'total_reports_submitted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'daily_param_stats_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'daily_param_stats': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        model = app_feedback_report_models.AppFeedbackReportStatsModel
        self.assertEqual(model.get_export_policy(), expected_dict)

    def test_get_model_association_to_user(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportStatsModel
        self.assertEqual(
            model.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_stats_for_ticket(self) -> None:
        entity_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                'android', self.TICKET_ID, self.STATS_DATE))
        app_feedback_report_models.AppFeedbackReportStatsModel.create(
            entity_id=entity_id,
            platform='android',
            ticket_id=self.TICKET_ID,
            total_reports_submitted=self.TOTAL_REPORTS_SUBMITTED,
            stats_tracking_date=self.STATS_DATE,
            daily_param_stats=self.DAILY_STATS)
        expected_stats_model = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                entity_id))

        stats_model_class = (
            app_feedback_report_models.AppFeedbackReportStatsModel)
        stats_models = (
            stats_model_class.get_stats_for_ticket(self.TICKET_ID))
        self.assertEqual(len(stats_models), 1)
        self.assertEqual(stats_models[0].id, entity_id)
        self.assertEqual(stats_models[0], expected_stats_model)

    def test_get_deletion_policy(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportStatsModel()
        self.assertEqual(
            model.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_lowest_supported_role(self) -> None:
        model = app_feedback_report_models.AppFeedbackReportStatsModel
        self.assertEqual(
            model.get_lowest_supported_role(),
            feconf.ROLE_ID_MODERATOR)
