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

from __future__ import annotations

import datetime
import enum

from unittest import mock

from core import feconf
from core import utils
from core.domain import app_feedback_report_constants
from core.domain import app_feedback_report_domain
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import app_feedback_report_models

(app_feedback_report_models,) = models.Registry.import_models(
    [models.Names.APP_FEEDBACK_REPORT])


USER_1_EMAIL = 'some@email.com'
USER_1_USERNAME = 'username1'
# The timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615151836)
# The timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)
TICKET_CREATION_TIMESTAMP_MSEC = utils.get_time_in_millisecs(
    TICKET_CREATION_TIMESTAMP)

PLATFORM_ANDROID = app_feedback_report_constants.PLATFORM_CHOICE_ANDROID
PLATFORM_WEB = app_feedback_report_constants.PLATFORM_CHOICE_WEB
TICKET_NAME = 'ticket name'
TICKET_ID = '%s.%s.%s' % (
    'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC), '16CharString1234')
REPORT_TYPE_SUGGESTION = app_feedback_report_constants.ReportType.SUGGESTION
REPORT_TYPE_ISSUE = app_feedback_report_constants.ReportType.ISSUE
CATEGORY_SUGGESTION_OTHER = (
    app_feedback_report_constants.Category.OTHER_SUGGESTION)
CATEGORY_ISSUE_TOPICS = app_feedback_report_constants.Category.TOPICS_ISSUE
ANDROID_PLATFORM_VERSION = '0.1-alpha-abcdef1234'
COUNTRY_LOCALE_CODE_INDIA = 'in'
ANDROID_DEVICE_MODEL = 'Pixel 4a'
ANDROID_SDK_VERSION = 28
ENTRY_POINT_CRASH = 'crash'
ENTRY_POINT_NAVIGATION_DRAWER = 'navigation_drawer'
LANGUAGE_LOCALE_CODE_ENGLISH = 'en'
ANDROID_PACKAGE_VERSION_CODE = 1
NETWORK_WIFI = app_feedback_report_constants.AndroidNetworkType.WIFI
ANDROID_TEXT_SIZE = (
    app_feedback_report_constants.AndroidTextSize.MEDIUM_TEXT_SIZE)
ANDROID_BUILD_FINGERPRINT = 'example_fingerprint_id'
EVENT_LOGS = ['event1', 'event2']
LOGCAT_LOGS = ['logcat1', 'logcat2']
USER_SELECTED_ITEMS: List[str] = []
USER_TEXT_INPUT = 'add and admin'
ANDROID_REPORT_INFO: app_feedback_report_models.ReportInfoDict = {
    'user_feedback_selected_items': USER_SELECTED_ITEMS,
    'user_feedback_other_text_input': USER_TEXT_INPUT,
    'event_logs': ['event1', 'event2'],
    'logcat_logs': ['logcat1', 'logcat2'],
    'package_version_code': ANDROID_PACKAGE_VERSION_CODE,
    'build_fingerprint': ANDROID_BUILD_FINGERPRINT,
    'network_type': NETWORK_WIFI.value,
    'android_device_language_locale_code': LANGUAGE_LOCALE_CODE_ENGLISH,
    'language_locale_code': 'en',
    'entry_point_info': {
        'entry_point_name': ENTRY_POINT_NAVIGATION_DRAWER,
    },
    'text_size': ANDROID_TEXT_SIZE.value,
    'only_allows_wifi_download_and_update': True,
    'automatically_update_topics': False,
    'is_curriculum_admin': False,
    'account_is_profile_admin': False
}
WEB_REPORT_INFO = {
    'user_feedback_selected_items': [],
    'user_feedback_other_text_input': USER_TEXT_INPUT,
}
ANDROID_REPORT_INFO_SCHEMA_VERSION = 1
WEB_PLATFORM_VERSION = '3.0.8'
PLATFORM_CHOICE_ANDROID = app_feedback_report_models.PLATFORM_CHOICE_ANDROID
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


class AppFeedbackReportDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.android_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP))
        android_user_supplied_feedback = (
            app_feedback_report_domain.UserSuppliedFeedback(
                REPORT_TYPE_SUGGESTION, CATEGORY_SUGGESTION_OTHER,
                USER_SELECTED_ITEMS, USER_TEXT_INPUT))
        android_device_system_context = (
            app_feedback_report_domain.AndroidDeviceSystemContext(
                ANDROID_PLATFORM_VERSION, ANDROID_PACKAGE_VERSION_CODE,
                COUNTRY_LOCALE_CODE_INDIA, LANGUAGE_LOCALE_CODE_ENGLISH,
                ANDROID_DEVICE_MODEL, ANDROID_SDK_VERSION,
                ANDROID_BUILD_FINGERPRINT, NETWORK_WIFI))
        navigation_drawer_entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())
        android_app_context = (
            app_feedback_report_domain.AndroidAppContext(
                navigation_drawer_entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH, ANDROID_TEXT_SIZE, True,
                False, False, EVENT_LOGS, LOGCAT_LOGS))
        self.android_report_obj = app_feedback_report_domain.AppFeedbackReport(
            self.android_report_id, ANDROID_REPORT_INFO_SCHEMA_VERSION,
            PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP, 0, TICKET_ID, None,
            android_user_supplied_feedback, android_device_system_context,
            android_app_context)

        self.web_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                PLATFORM_WEB, REPORT_SUBMITTED_TIMESTAMP))
        web_user_supplied_feedback = (
            app_feedback_report_domain.UserSuppliedFeedback(
                REPORT_TYPE_SUGGESTION, CATEGORY_SUGGESTION_OTHER,
                USER_SELECTED_ITEMS, USER_TEXT_INPUT))
        device_system_context = (
            app_feedback_report_domain.DeviceSystemContext(
                WEB_PLATFORM_VERSION, LANGUAGE_LOCALE_CODE_ENGLISH))
        crash_entry_point = app_feedback_report_domain.CrashEntryPoint()
        app_context = (
            app_feedback_report_domain.AppContext(
                crash_entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH))
        self.web_report_obj = app_feedback_report_domain.AppFeedbackReport(
            self.web_report_id, ANDROID_REPORT_INFO_SCHEMA_VERSION,
            PLATFORM_WEB, REPORT_SUBMITTED_TIMESTAMP, 0, TICKET_ID, None,
            web_user_supplied_feedback, device_system_context, app_context)

    def test_to_dict_android_report(self) -> None:
        expected_report_id = self.android_report_id
        expected_dict = {
            'report_id': expected_report_id,
            'schema_version': ANDROID_REPORT_INFO_SCHEMA_VERSION,
            'platform': PLATFORM_ANDROID,
            'submitted_on_timestamp': utils.get_human_readable_time_string(
                utils.get_time_in_millisecs(REPORT_SUBMITTED_TIMESTAMP)),
            'local_timezone_offset_hrs': 0,
            'ticket_id': TICKET_ID,
            'scrubbed_by': None,
            'user_supplied_feedback': {
                'report_type': REPORT_TYPE_SUGGESTION.value,
                'category': CATEGORY_SUGGESTION_OTHER.value,
                'user_feedback_selected_items': USER_SELECTED_ITEMS,
                'user_feedback_other_text_input': USER_TEXT_INPUT
            },
            'device_system_context': {
                'version_name': ANDROID_PLATFORM_VERSION,
                'package_version_code': ANDROID_PACKAGE_VERSION_CODE,
                'device_country_locale_code': COUNTRY_LOCALE_CODE_INDIA,
                'device_language_locale_code': LANGUAGE_LOCALE_CODE_ENGLISH,
                'device_model': ANDROID_DEVICE_MODEL,
                'sdk_version': ANDROID_SDK_VERSION,
                'build_fingerprint': ANDROID_BUILD_FINGERPRINT,
                'network_type': NETWORK_WIFI.value
            },
            'app_context': {
                'entry_point': {
                    'entry_point_name': ENTRY_POINT_NAVIGATION_DRAWER
                },
                'text_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
                'audio_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
                'text_size': ANDROID_TEXT_SIZE.value,
                'only_allows_wifi_download_and_update': True,
                'automatically_update_topics': False,
                'account_is_profile_admin': False,
                'event_logs': EVENT_LOGS,
                'logcat_logs': LOGCAT_LOGS
            }
        }
        self.assertDictEqual(expected_dict, self.android_report_obj.to_dict())

    def test_report_web_platform_validation_fails(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Domain objects for web reports have not been implemented yet.'):
            self.web_report_obj.validate()

    def test_raise_not_implemented_error_for_web_platform_feedback(
        self
    ) -> None:
        REPORT_JSON['platform_type'] = 'invalid_platform_type'
        with self.assertRaisesRegex(
            NotImplementedError,
            'Domain objects for web reports must be implemented.'):
            self.web_report_obj.from_submitted_feedback_dict(REPORT_JSON)

    def test_android_report_creation_from_submitted_feedback(self) -> None:
        REPORT_JSON['platform_type'] = (
            app_feedback_report_constants.PLATFORM_CHOICE_ANDROID)
        result = (
            self.android_report_obj.from_submitted_feedback_dict(REPORT_JSON))
        expected_report_datetime = datetime.datetime.fromtimestamp(
            REPORT_JSON['report_submission_timestamp_sec'])
        expected_report_schema_version = (
            REPORT_JSON['android_report_info_schema_version'])
        self.assertEqual(
            result.submitted_on_timestamp,
            expected_report_datetime)
        self.assertEqual(result.schema_version, expected_report_schema_version)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_report_android_schema_version_not_an_int_validation_fails(
        self
    ) -> None:
        self.android_report_obj.schema_version = 'bad_schema_version' # type: ignore[assignment]
        self._assert_validation_error(
            self.android_report_obj,
            'The report schema version %r is invalid, expected an integer' % (
                self.android_report_obj.schema_version))

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_android_report_with_none_ticket_id_context_invalid_type_fails(
        self
    ) -> None:
        self.android_report_obj.ticket_id = None
        self.android_report_obj.device_system_context = {} # type: ignore[assignment]
        self._assert_validation_error(
            self.android_report_obj,
            'Expected device and system context to be of type '
            'AndroidDeviceSystemContext')

    def test_report_android_schema_version_less_than_minimum_validation_fails(
            self) -> None:
        # The current minimum is 1 a version less than the minimum returns
        # an error for a non-positive integer.
        self.android_report_obj.schema_version = (
            feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION - 1)
        self._assert_validation_error(
            self.android_report_obj,
            'The report schema version %r is invalid, expected an integer' % (
                self.android_report_obj.schema_version))

    def test_report_android_schema_version_greater_than_max_validation_fails(
            self) -> None:
        self.android_report_obj.schema_version = (
            feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION + 1)
        self._assert_validation_error(
            self.android_report_obj,
            'The supported report schema versions for %s reports are' % (
                PLATFORM_ANDROID))

    def test_report_platform_is_invalid_validation_fails(self) -> None:
        self.android_report_obj.platform = 'invalid_platform'
        self._assert_validation_error(
            self.android_report_obj, 'Report platform should be one of ')

    def test_report_scrubber_id_is_invalid_validation_fails(self) -> None:
        self.android_report_obj.scrubbed_by = 'invalid_user'
        self._assert_validation_error(
            self.android_report_obj,
            'The scrubbed_by user id \'%s\' is invalid.' % (
                self.android_report_obj.scrubbed_by))

    def test_validate_android_report_with_bot_id_passes(
        self
    ) -> None:
        """Tests that validation passes when the scrubbed_by ID is bot ID."""
        # Set the scrubbed_by ID to the valid bot ID constant.
        self.android_report_obj.scrubbed_by = (
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID
        )
        self.android_report_obj.validate()
        self.assertEqual(
            self.android_report_obj.scrubbed_by,
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID,
            'The scrubbed_by ID did not match the expected bot ID.'
        )

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_report_scrubber_id_is_not_string_validation_fails(self) -> None:
        self.android_report_obj.scrubbed_by = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.android_report_obj,
            'The scrubbed_by user must be a string')

    def test_report_timezone_offset_is_invalid_validation_fails(self) -> None:
        self.android_report_obj.local_timezone_offset_hrs = (
            app_feedback_report_constants.TIMEZONE_MINIMUM_OFFSET - 1)
        self._assert_validation_error(
            self.android_report_obj,
            'Expected local timezone offset to be in')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_android_report_system_context_invalid_type_validation_fails(
        self
    ) -> None:
        self.android_report_obj.device_system_context = {} # type: ignore[assignment]
        self._assert_validation_error(
            self.android_report_obj,
            'Expected device and system context to be of type '
            'AndroidDeviceSystemContext')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_report_platform_is_none_fails_validation(self) -> None:
        self.android_report_obj.platform = None # type: ignore[assignment]
        self._assert_validation_error(
            self.android_report_obj, 'No platform supplied.')

    def test_get_report_type_from_string_returns_expected_report_type(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        for report_type in app_feedback_report_constants.ReportType:
            self.assertEqual(
                feedback_report.get_report_type_from_string(
                    report_type.value), report_type)

    def test_get_report_type_from_string_with_invalid_string_raises_error(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        invalid_report_type = 'invalid_report_type'
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The given report type %s is invalid.' % invalid_report_type):
            feedback_report.get_report_type_from_string(
                invalid_report_type)

    def test_get_category_from_string_returns_expected_category(self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        for category in app_feedback_report_constants.ALLOWED_CATEGORIES:
            self.assertEqual(
                feedback_report.get_category_from_string(
                    category.value), category)

    def test_get_category_from_string_with_invalid_string_raises_error(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        invalid_category = 'invalid_category'
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The given category %s is invalid.' % invalid_category):
            feedback_report.get_category_from_string(
                invalid_category)

    def test_get_android_text_size_from_string_returns_expected_text_size(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        for text_size in (
            app_feedback_report_constants.ALLOWED_ANDROID_TEXT_SIZES):
            self.assertEqual(
                feedback_report.get_android_text_size_from_string(
                    text_size.value), text_size)

    def test_get_android_text_size_from_string_with_invalid_string_raises_error(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        invalid_text_size = 'invalid_text_size'
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The given Android app text size %s is invalid.' % (
                invalid_text_size)):
            feedback_report.get_android_text_size_from_string(
                invalid_text_size)

    def test_get_entry_point_from_json_returns_expected_entry_point_obj(
        self
    ) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        entry_point_json: app_feedback_report_domain.EntryPointDict = {
            'entry_point_name': '',
            'entry_point_topic_id': 'topic_id',
            'entry_point_story_id': 'story_id',
            'entry_point_exploration_id': 'exploration_id',
            'entry_point_subtopic_id': 'subtopic_id'
        }

        entry_point_json['entry_point_name'] = (
            app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER.value)
        navigation_drawer_obj = (
            feedback_report.get_entry_point_from_json(
                entry_point_json))
        self.assertTrue(
            isinstance(
                navigation_drawer_obj,
                app_feedback_report_domain.NavigationDrawerEntryPoint))

        entry_point_json['entry_point_name'] = (
            app_feedback_report_constants.EntryPoint.LESSON_PLAYER.value)
        lesson_player_obj = (
            feedback_report.get_entry_point_from_json(
                entry_point_json))
        self.assertTrue(
            isinstance(
                lesson_player_obj,
                app_feedback_report_domain.LessonPlayerEntryPoint))

        entry_point_json['entry_point_name'] = (
            app_feedback_report_constants.EntryPoint.REVISION_CARD.value)
        revision_card_obj = (
            feedback_report.get_entry_point_from_json(
                entry_point_json))
        self.assertTrue(
            isinstance(
                revision_card_obj,
                app_feedback_report_domain.RevisionCardEntryPoint))

        entry_point_json['entry_point_name'] = (
            app_feedback_report_constants.EntryPoint.CRASH.value)
        crash_obj = (
            feedback_report.get_entry_point_from_json(
                entry_point_json))
        self.assertTrue(
            isinstance(
                crash_obj, app_feedback_report_domain.CrashEntryPoint))

    def test_raises_error_with_invalid_entry_point_during_entry_point_from_json(
        self
    ) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        entry_point_json: app_feedback_report_domain.EntryPointDict = {
            'entry_point_name': '',
            'entry_point_topic_id': 'topic_id',
            'entry_point_story_id': 'story_id',
            'entry_point_exploration_id': 'exploration_id',
            'entry_point_subtopic_id': 'subtopic_id'
        }

        entry_point_json['entry_point_name'] = (
            app_feedback_report_constants.EntryPoint.LESSON_PLAYER.value)

        with self.assertRaisesRegex(
            Exception, 'No story_id provided for LessonPlayerEntryPoint.'
        ):
            entry_point_json['entry_point_story_id'] = None
            feedback_report.get_entry_point_from_json(entry_point_json)

        with self.assertRaisesRegex(
            Exception, 'No topic_id provided for LessonPlayerEntryPoint.'
        ):
            entry_point_json['entry_point_story_id'] = 'story_id'
            entry_point_json['entry_point_topic_id'] = None
            feedback_report.get_entry_point_from_json(entry_point_json)

        with self.assertRaisesRegex(
            Exception,
            'No exploration_id provided for LessonPlayerEntryPoint.'
        ):
            entry_point_json['entry_point_topic_id'] = 'topic_id'
            entry_point_json['entry_point_exploration_id'] = None
            feedback_report.get_entry_point_from_json(entry_point_json)

        entry_point_json['entry_point_name'] = (
            app_feedback_report_constants.EntryPoint.REVISION_CARD.value)

        with self.assertRaisesRegex(
            Exception,
            'No topic_id provided for RevisionCardEntryPoint.'
        ):
            entry_point_json['entry_point_topic_id'] = None
            feedback_report.get_entry_point_from_json(entry_point_json)

        with self.assertRaisesRegex(
            Exception,
            'No subtopic_id provided for RevisionCardEntryPoint.'
        ):
            entry_point_json['entry_point_topic_id'] = 'topic_id'
            entry_point_json['entry_point_subtopic_id'] = None
            feedback_report.get_entry_point_from_json(entry_point_json)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_get_entry_point_from_json_with_invalid_json_raises_error(
        self
    ) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        invalid_json = {
            'entry_point_name': 'invalid_entry_point_name'
        }
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The given entry point %s is invalid.' % (
                'invalid_entry_point_name')):
            feedback_report.get_entry_point_from_json(
                invalid_json)  # type: ignore[arg-type]

    def test_get_android_network_type_from_string_returns_expected_network_type(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        for network_type in app_feedback_report_constants.AndroidNetworkType:
            self.assertEqual(
                feedback_report.get_android_network_type_from_string(
                    network_type.value), network_type)

    def test_get_android_network_type_from_string_invalid_string_raises_error(
            self) -> None:
        feedback_report = app_feedback_report_domain.AppFeedbackReport
        invalid_network_type = 'invalid_text_size'
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'The given Android network type %s is invalid.' % (
                invalid_network_type)):
            feedback_report.get_android_network_type_from_string(
                invalid_network_type)

    def _assert_validation_error(
            self,
            report_obj: app_feedback_report_domain.AppFeedbackReport,
            expected_error_substring: str
    ) -> None:
        """Checks that the feedback report passes validation.

        Args:
            report_obj: AppFeedbackReport. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            report_obj.validate()

    def _assert_not_implemented_error(
            self,
            report_obj: app_feedback_report_domain.AppFeedbackReport,
            expected_error_substring: str
    ) -> None:
        """Checks that the feedback report passes validation.

        Args:
            report_obj: AppFeedbackReport. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            NotImplementedError, expected_error_substring):
            report_obj.validate()


class UserSuppliedFeedbackDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.user_supplied_feedback = (
            app_feedback_report_domain.UserSuppliedFeedback(
                REPORT_TYPE_SUGGESTION, CATEGORY_SUGGESTION_OTHER,
                USER_SELECTED_ITEMS, USER_TEXT_INPUT))

    def test_to_dict(self) -> None:
        expected_dict = {
            'report_type': REPORT_TYPE_SUGGESTION.value,
            'category': CATEGORY_SUGGESTION_OTHER.value,
            'user_feedback_selected_items': USER_SELECTED_ITEMS,
            'user_feedback_other_text_input': USER_TEXT_INPUT
        }
        self.assertDictEqual(
            expected_dict, self.user_supplied_feedback.to_dict())

    def test_validation_invalid_report_type_fails(self) -> None:
        # Here we use MyPy ignore because here we assign type string to
        # type class ReportType. This is done to test the validation of the
        # report_type.
        self.user_supplied_feedback.report_type = 'invalid_report_type' # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback, 'Invalid report type ')

    def test_validation_invalid_report_category_fails(self) -> None:
        self.user_supplied_feedback.report_type = REPORT_TYPE_ISSUE
        # Here we use MyPy ignore because here we assign type string to
        # type class category. This is done to test the validation of the
        # category.
        self.user_supplied_feedback.category = 'invalid_category' # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Invalid category invalid_category,')

    def test_validation_has_selected_items_for_invalid_category_fails(
            self) -> None:
        self.user_supplied_feedback.user_feedback_selected_items = (
            ['invalid', 'list'])
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Report cannot have selection options for category ')

    # Here we use MyPy ignore because here we assign type None to
    # type List[str]. This is done to test the validation of the
    # UserSuppliedFeedback.
    def test_validation_selected_items_is_none_fails(self) -> None:
        self.user_supplied_feedback.user_feedback_selected_items = None # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback,
            'No user_feedback_selected_items supplied')

    # Here we use MyPy ignore because here we assign type None to
    # type List[str]. This is done to test the validation of the
    # UserSuppliedFeedback.
    def test_validation_text_input_is_none_fails(self) -> None:
        self.user_supplied_feedback.report_type = REPORT_TYPE_SUGGESTION
        self.user_supplied_feedback.category = CATEGORY_SUGGESTION_OTHER
        self.user_supplied_feedback.user_feedback_selected_items = []
        self.user_supplied_feedback.user_feedback_other_text_input = None # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback,
            'No user_feedback_selected_items supplied')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_invalid_selected_item_list_fails(self) -> None:
        self.user_supplied_feedback.report_type = REPORT_TYPE_ISSUE
        self.user_supplied_feedback.category = CATEGORY_ISSUE_TOPICS
        self.user_supplied_feedback.user_feedback_selected_items = (
            ['123', 123]) # type: ignore[list-item]
        self.user_supplied_feedback.user_feedback_other_text_input = ''
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Invalid option 123 selected by user.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_invalid_text_input_with_only_text_input_allowed_fails(
            self) -> None:
        self.user_supplied_feedback.user_feedback_selected_items = []
        self.user_supplied_feedback.user_feedback_other_text_input = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Invalid input text, must be a string')

    def test_validation_valid_text_input_with_empty_selected_items(
            self) -> None:
        self.user_supplied_feedback.category = CATEGORY_ISSUE_TOPICS
        self.user_supplied_feedback.user_feedback_selected_items = []
        self.user_supplied_feedback.user_feedback_other_text_input = 'Some text'
        self.user_supplied_feedback.validate()

    def test_report_type_is_none_fails_validation(self) -> None:
        # Here we use MyPy ignore because here we assign type None to
        # type class ReportType. This is done to test the validation of
        # the UserSuppliedFeedback.
        self.user_supplied_feedback.report_type = None # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback, 'No report_type supplied.')

    def test_report_category_is_none_fails_validation(self) -> None:
        # Here we use MyPy ignore because here we assign type None to
        # type class category. This is done to test the validation of the
        # category.
        self.user_supplied_feedback.category = None # type: ignore[assignment]
        self._assert_validation_error(
            self.user_supplied_feedback, 'No category supplied.')

    def _assert_validation_error(
            self,
            feedback_obj: app_feedback_report_domain.UserSuppliedFeedback,
            expected_error_substring: str
    ) -> None:
        """Checks that the user supplied feeedback passes validation.

        Args:
            feedback_obj: UserSuppliedFeedback. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            feedback_obj.validate()


class DeviceSystemContextDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.device_system_context = (
            app_feedback_report_domain.DeviceSystemContext(
                WEB_PLATFORM_VERSION, COUNTRY_LOCALE_CODE_INDIA))

    def test_to_dict(self) -> None:
        expected_dict = {
            'version_name': WEB_PLATFORM_VERSION,
            'device_country_locale_code': COUNTRY_LOCALE_CODE_INDIA
        }
        self.assertDictEqual(
            expected_dict, self.device_system_context.to_dict())

    def test_validation_raises_not_implemented_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of DeviceSystemContext should implement domain '
            'validation.'):
            self.device_system_context.validate()


class AndroidDeviceSystemContextTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.device_system_context = (
            app_feedback_report_domain.AndroidDeviceSystemContext(
                ANDROID_PLATFORM_VERSION, ANDROID_PACKAGE_VERSION_CODE,
                COUNTRY_LOCALE_CODE_INDIA, LANGUAGE_LOCALE_CODE_ENGLISH,
                ANDROID_DEVICE_MODEL, ANDROID_SDK_VERSION,
                ANDROID_BUILD_FINGERPRINT, NETWORK_WIFI))

    def test_to_dict(self) -> None:
        expected_dict = {
            'version_name': ANDROID_PLATFORM_VERSION,
            'package_version_code': ANDROID_PACKAGE_VERSION_CODE,
            'device_country_locale_code': COUNTRY_LOCALE_CODE_INDIA,
            'device_language_locale_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'device_model': ANDROID_DEVICE_MODEL,
            'sdk_version': ANDROID_SDK_VERSION,
            'build_fingerprint': ANDROID_BUILD_FINGERPRINT,
            'network_type': NETWORK_WIFI.value
        }
        self.assertDictEqual(
            expected_dict, self.device_system_context.to_dict())

    # Here we use MyPy ignore because here we assign type None
    # to type int. This is done to test the validation of
    # AndroidDeviceSystemContext.
    def test_validation_version_name_is_none_fails(self) -> None:
        self.device_system_context.version_name = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'No version name supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_version_name_is_not_a_string_fails(self) -> None:
        self.device_system_context.version_name = 1 # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'Version name must be a string')

    def test_validation_invalid_version_name_fails(self) -> None:
        self.device_system_context.version_name = 'invalid_version_name'
        self._assert_validation_error(
            self.device_system_context,
            'The version name is not a valid string format')

    # Here we use MyPy ignore because here we assign type None
    # to type int. This is done to test the validation of the
    # AndroidDeviceSystemContext.
    def test_validation_package_version_code_is_none_fails(self) -> None:
        self.device_system_context.package_version_code = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'No package version code supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_package_version_code_is_not_an_int_fails(self) -> None:
        self.device_system_context.package_version_code = 'invalid_code' # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'Package version code must be an int')

    def test_validation_package_version_code_less_than_minimum_fails(
            self) -> None:
        self.device_system_context.package_version_code = (
            feconf.MINIMUM_ANDROID_PACKAGE_VERSION_CODE - 1)
        self._assert_validation_error(
            self.device_system_context,
            'The package version code is not a valid int. The minimum '
            'supported version is %d' % (
                feconf.MINIMUM_ANDROID_PACKAGE_VERSION_CODE))

    # Here we use MyPy ignore because here we assign type None
    # to type str. This is done to test the validation of the
    # AndroidDeviceSystemContext.
    def test_validation_country_locale_code_is_none_fails(self) -> None:
        self.device_system_context.device_country_locale_code = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context,
            'No device country locale code supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_country_locale_code_not_a_string_fails(self) -> None:
        self.device_system_context.device_country_locale_code = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context,
            'device\'s country locale code must be an string,')

    def test_validation_invalid_country_locale_code_fails(self) -> None:
        self.device_system_context.device_country_locale_code = 'not a code 123'
        self._assert_validation_error(
            self.device_system_context,
            'device\'s country locale code is not a valid string')

    # Here we use MyPy ignore because here we assign type None
    # to type str. This is done to test the validation of the
    # AndroidDeviceSystemContext.
    def test_validation_language_locale_code_is_none_fails(self) -> None:
        self.device_system_context.device_language_locale_code = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context,
            'No device language locale code supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_language_locale_code_not_a_string_fails(self) -> None:
        self.device_system_context.device_language_locale_code = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context,
            'device\'s language locale code must be an string,')

    def test_validation_invalid_language_locale_code_fails(self) -> None:
        self.device_system_context.device_language_locale_code = 'not a code 12'
        self._assert_validation_error(
            self.device_system_context,
            'device\'s language locale code is not a valid string')

    # Here we use MyPy ignore because here we assign type None
    # to type str. This is done to test the validation of the
    # AndroidDeviceSystemContext.
    def test_validation_device_model_is_none_fails(self) -> None:
        self.device_system_context.device_model = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context,
            'No device model supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_device_model_not_a_string_fails(self) -> None:
        self.device_system_context.device_model = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context,
            'Android device model must be an string')

    # Here we use MyPy ignore because here we assign type None
    # to type int. This is done to test the validation of the
    # AndroidDeviceSystemContext.
    def test_validation_sdk_version_is_none_fails(self) -> None:
        self.device_system_context.sdk_version = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'No SDK version supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_sdk_version_not_an_int_fails(self) -> None:
        self.device_system_context.sdk_version = 'invalid_sdk_code' # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'SDK version must be an int')

    def test_validation_sdk_version_lower_than_minimum_fails(self) -> None:
        self.device_system_context.sdk_version = (
            app_feedback_report_constants.MINIMUM_ANDROID_SDK_VERSION - 1)
        self._assert_validation_error(
            self.device_system_context, 'Invalid SDK version')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_build_fingerprint_is_none_fails(self) -> None:
        self.device_system_context.build_fingerprint = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'Build fingerprint must be a string')

    # Here we use MyPy ignore because here we assigning type None
    # to type str. This is done to test the validation of the
    # AndroidDeviceSystemContext.
    def test_validation_build_fingerprint_not_a_string_fails(self) -> None:
        self.device_system_context.build_fingerprint = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'No build fingerprint supplied.')

    # Here we use MyPy ignore because here we assigning type None
    # to type AndroidNetworkType Enum. This is done to test the
    # validation of the AndroidDeviceSystemContext.
    def test_validation_network_type_is_none_fails(self) -> None:
        self.device_system_context.network_type = None # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'No network type supplied.')

    # Here we use MyPy ignore because here we assigning type str
    # to type AndroidNetworkType Enum. This is done to test the
    # validation of the AndroidDeviceSystemContext.
    def test_validation_invalid_network_type_fails(self) -> None:
        self.device_system_context.network_type = 'invaid_network_type' # type: ignore[assignment]
        self._assert_validation_error(
            self.device_system_context, 'Invalid network type,')

    def _assert_validation_error(
            self,
            context_obj: app_feedback_report_domain.AndroidDeviceSystemContext,
            expected_error_substring: str
    ) -> None:
        """Checks that the Android device system context passes validation.

        Args:
            context_obj: AndroidDeviceSystemContext. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            context_obj.validate()


class EntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.entry_point = (
            app_feedback_report_domain.EntryPoint(
                app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER,
                'topic_id', 'story_id', 'exploration_id', 'subtopic_id'))

    def test_to_dict_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of EntryPoint should implement their own dict'):
            self.entry_point.to_dict()

    def test_validation_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of EntryPoint should implement their own validation'):
            self.entry_point.validate()


class NavigationDrawerEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())

    def test_to_dict(self) -> None:
        expected_dict = {
            'entry_point_name': (
                app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER.value) # pylint: disable=line-too-long
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_name_is_none_fails(self) -> None:
        # Here we use MyPy ignore because we assign type None to
        # type str. This is done to test that the validation fails.
        self.entry_point.entry_point_name = None # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No entry point name supplied.'):
            self.entry_point.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_name_not_a_string_fails(self) -> None:
        self.entry_point.entry_point_name = 123 # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Entry point name must be a string,'):
            self.entry_point.validate()

    def test_validation_name_is_invalid_fails(self) -> None:
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected entry point name %s' % (
                app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER.value)): # pylint: disable=line-too-long
            self.entry_point.validate()


class LessonPlayerEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.entry_point = (
            app_feedback_report_domain.LessonPlayerEntryPoint(
                'topic_id', 'story_id', 'exploration_id'))

    def test_to_dict(self) -> None:
        expected_dict = {
            'entry_point_name': (
                app_feedback_report_constants.EntryPoint.LESSON_PLAYER.value),
            'topic_id': 'topic_id',
            'story_id': 'story_id',
            'exploration_id': 'exploration_id'
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    # Here we use MyPy ignore because we assign type None to type str.
    # This is done to test the validation of LessonPlayerEntryPoint.
    def test_validation_name_is_none_fails(self) -> None:
        self.entry_point.entry_point_name = None # type: ignore[assignment]
        self._assert_validation_error(
            self.entry_point,
            'No entry point name supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_name_not_a_string_fails(self) -> None:
        self.entry_point.entry_point_name = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.entry_point,
            'Entry point name must be a string,')

    def test_validation_name_is_invalid_fails(self) -> None:
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        self._assert_validation_error(
            self.entry_point,
            'Expected entry point name %s' % (
                app_feedback_report_constants.EntryPoint.LESSON_PLAYER.value))

    def test_validation_invalid_topic_id_fails(self) -> None:
        self.entry_point.topic_id = 'invalid_topic_id'
        self._assert_validation_error(
            self.entry_point,
            'Topic id %s is invalid' % 'invalid_topic_id')

    def test_validation_invalid_story_id_fails(self) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'invalid_story_id'
        self._assert_validation_error(
            self.entry_point, 'Invalid story id')

    def test_validation_invalid_exploration_id_fails(self) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'valid_story1'
        self.entry_point.exploration_id = 'invalid_exploration'
        self._assert_validation_error(
            self.entry_point,
            'Exploration with id invalid_exploration is not part of story '
            'with id')

    @mock.patch('core.domain.exp_services.get_story_id_linked_to_exploration')
    def test_validation_with_valid_story_id(
        self,
        mock_get_story_id_linked_to_exploration: mock.MagicMock
    ) -> None:
        mock_get_story_id_linked_to_exploration.return_value = 'story_id'
        # Here the method should return None and not raise any exceptions.
        self.assertIsNone(
            self.entry_point.require_valid_entry_point_exploration(
                exploration_id=self.entry_point.exploration_id,
                story_id=self.entry_point.story_id,
        ))

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_entry_point_with_invalid_exploration_id_type(
        self,
    ) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'valid_story1'
        self.entry_point.exploration_id = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Exploration id should be a string, received: %r' % (
                    self.entry_point.exploration_id)):
            self.entry_point.require_valid_entry_point_exploration(
                exploration_id=self.entry_point.exploration_id,
                story_id=self.entry_point.story_id,
            )

    def test_entry_point_with_mismatched_story_id_and_exploration_id(
        self
    ) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'valid_story1'
        self.entry_point.exploration_id = 'invalid_exploration'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Exploration with id %s is not part of story with id of %s' % (
                self.entry_point.exploration_id, self.entry_point.story_id)
        ):
            self.entry_point.require_valid_entry_point_exploration(
                exploration_id=self.entry_point.exploration_id,
                story_id=self.entry_point.story_id,
            )

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_fails_if_exploration_id_is_not_a_string(self) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'valid_story1'
        self.entry_point.exploration_id = 123  # type: ignore[assignment]
        self._assert_validation_error(
            self.entry_point,
            'Exploration id should be a string')

    def test_validation_story_id_fails_on_none_value(self) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = None
        self._assert_validation_error(
            self.entry_point,
            'The story_id must be a string value, received None')

    def _assert_validation_error(
            self,
            entry_point_obj: app_feedback_report_domain.LessonPlayerEntryPoint,
            expected_error_substring: str
    ) -> None:
        """Checks that the entry point passes validation.

        Args:
            entry_point_obj: LessonPlayerEntryPoint. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            entry_point_obj.validate()


class RevisionCardEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.entry_point = (
            app_feedback_report_domain.RevisionCardEntryPoint(
                'topic_id', 'subtopic_id'))

    def test_to_dict(self) -> None:
        expected_dict = {
            'entry_point_name': (
                app_feedback_report_constants.EntryPoint.REVISION_CARD.value),
            'topic_id': 'topic_id',
            'subtopic_id': 'subtopic_id'
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_name_is_none_fails(self) -> None:
        # Here we use MyPy ignore because we assign type None to
        # type str. This is done to test that the validation fails.
        self.entry_point.entry_point_name = None # type: ignore[assignment]
        self._assert_validation_error(
            self.entry_point,
            'No entry point name supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_name_not_a_string_fails(self) -> None:
        self.entry_point.entry_point_name = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.entry_point,
            'Entry point name must be a string,')

    def test_validation_name_is_invalid_fails(self) -> None:
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        self._assert_validation_error(
            self.entry_point,
            'Expected entry point name %s' % (
                app_feedback_report_constants.EntryPoint.REVISION_CARD.value))

    def test_validation_invalid_topic_id_fails(self) -> None:
        self.entry_point.topic_id = 'invalid_topic_id'
        self._assert_validation_error(
            self.entry_point,
            'Topic id %s is invalid' % 'invalid_topic_id')

    def test_validation_invalid_subtopic_id_fails(self) -> None:
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.subtopic_id = 'invalid_subtopic_id'
        self._assert_validation_error(
            self.entry_point, 'Expected subtopic id to be an int')

    def test_validation_with_valid_subtopic_id(self) -> None:
        """Tests the `validate` method with a valid subtopic ID."""
        self.entry_point.topic_id = 'valid_topic1'
        # Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally
        # test wrong inputs that we can normally catch by typing.
        self.entry_point.subtopic_id = 42 # type: ignore[assignment]
        # There should be no exception raised when trying to validate.
        # If exception is raised, the test fails.
        self.entry_point.validate()

    def _assert_validation_error(
            self,
            entry_point_obj: app_feedback_report_domain.RevisionCardEntryPoint,
            expected_error_substring: str
    ) -> None:
        """Checks that the entry point passes validation.

        Args:
            entry_point_obj: RevisionCardEntryPoint. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            entry_point_obj.validate()


class CrashEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.entry_point = (
            app_feedback_report_domain.CrashEntryPoint())

    def test_to_dict(self) -> None:
        expected_dict = {
            'entry_point_name': (
                app_feedback_report_constants.EntryPoint.CRASH.value)
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_name_is_none_fails(self) -> None:
        # Here we use MyPy ignore because we assign type None to
        # type str. This is done to test that the validation fails.
        self.entry_point.entry_point_name = None # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'No entry point name supplied.'):
            self.entry_point.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_name_not_a_string_fails(self) -> None:
        self.entry_point.entry_point_name = 123 # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Entry point name must be a string,'):
            self.entry_point.validate()

    def test_validation_name_is_invalid_fails(self) -> None:
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected entry point name %s' % (
                app_feedback_report_constants.EntryPoint.CRASH.value)):
            self.entry_point.validate()


class AppContextDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())
        self.app_context = (
            app_feedback_report_domain.AppContext(
                entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH))

    def test_to_dict(self) -> None:
        expected_dict = {
            'entry_point': {
                'entry_point_name': (
                    app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER.value), # pylint: disable=line-too-long
            },
            'text_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'audio_language_code': LANGUAGE_LOCALE_CODE_ENGLISH
        }
        self.assertDictEqual(
            expected_dict, self.app_context.to_dict())

    def test_validation_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of AppContext should implement their own validation'):
            self.app_context.validate()


class AndroidAppContextDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())
        self.app_context = (
            app_feedback_report_domain.AndroidAppContext(
                entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH, ANDROID_TEXT_SIZE, True, False,
                False, EVENT_LOGS, LOGCAT_LOGS))

    def test_to_dict(self) -> None:
        expected_dict = {
            'entry_point': {
                'entry_point_name': (
                    app_feedback_report_constants.EntryPoint.NAVIGATION_DRAWER.value), # pylint: disable=line-too-long
            },
            'text_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'audio_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'text_size': ANDROID_TEXT_SIZE.value,
            'only_allows_wifi_download_and_update': True,
            'automatically_update_topics': False,
            'account_is_profile_admin': False,
            'event_logs': EVENT_LOGS,
            'logcat_logs': LOGCAT_LOGS
        }
        self.assertDictEqual(
            expected_dict, self.app_context.to_dict())

    # Here we use MyPy ignore because we assign type None to
    # type AndroidTextSize Enum. This is done to test that the
    # validation fails.
    def test_validation_text_size_is_none_fails(self) -> None:
        self.app_context.text_size = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context, 'No text size supplied.')

    # Here we use MyPy ignore because we assign type string to
    # type AndroidTextSize Enum. This is done to test that the
    # validation fails.
    def test_validation_text_size_is_invalid_fails(self) -> None:
        self.app_context.text_size = 'invalid_text_size' # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context, 'App text size should be one of')

    # Here we use MyPy ignore because we assign type None to
    # type str. This is done to test that the validation fails.
    def test_validation_text_language_code_is_none_fails(self) -> None:
        self.app_context.text_language_code = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context, 'No app text language code supplied.')

    # Here we use MyPy ignore because we assign type None to
    # type str. This is done to test that the validation fails.
    def test_validation_audio_language_code_is_none_fails(self) -> None:
        self.app_context.audio_language_code = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context, 'No app audio language code supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_text_language_code_is_not_a_string_fails(self) -> None:
        self.app_context.text_language_code = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context,
            'Expected the app\'s text language code to be a string')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_audio_language_code_is_not_a_string_fails(self) -> None:
        self.app_context.audio_language_code = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context,
            'Expected the app\'s audio language code to be a string')

    def test_validation_text_language_code_does_not_match_fails(self) -> None:
        self.app_context.text_language_code = 'invalid string regex'
        self._assert_validation_error(
            self.app_context,
            'The app\'s text language code is not a valid string')

    def test_validation_audio_language_code_does_not_match_fails(self) -> None:
        self.app_context.audio_language_code = 'invalid string regex'
        self._assert_validation_error(
            self.app_context,
            'The app\'s audio language code is not a valid string')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_only_allow_wifi_downloads_is_none_fails(self) -> None:
        self.app_context.only_allows_wifi_download_and_update = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context,
            'only_allows_wifi_download_and_update field should be a boolean')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_automatically_update_topics_is_none_fails(self) -> None:
        self.app_context.automatically_update_topics = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context,
            'automatically_update_topics field should be a boolean')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_account_is_profile_admin_is_none_fails(self) -> None:
        self.app_context.account_is_profile_admin = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context,
            'account_is_profile_admin field should be a boolean')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_event_logs_is_none_fails(self) -> None:
        self.app_context.event_logs = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context, 'Should have an event log list')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_logcat_logs_is_none_fails(self) -> None:
        self.app_context.logcat_logs = None # type: ignore[assignment]
        self._assert_validation_error(
            self.app_context, 'Should have a logcat log list')

    def _assert_validation_error(
            self,
            app_context_obj: app_feedback_report_domain.AndroidAppContext,
            expected_error_substring: str
    ) -> None:
        """Checks that the app context passes validation.

        Args:
            app_context_obj: AndroidAppContext. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            app_context_obj.validate()


class AppFeedbackReportTicketDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                TICKET_NAME))

        self.android_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP))
        android_user_supplied_feedback = (
            app_feedback_report_domain.UserSuppliedFeedback(
                REPORT_TYPE_SUGGESTION, CATEGORY_SUGGESTION_OTHER,
                USER_SELECTED_ITEMS, USER_TEXT_INPUT))
        android_device_system_context = (
            app_feedback_report_domain.AndroidDeviceSystemContext(
                ANDROID_PLATFORM_VERSION, ANDROID_PACKAGE_VERSION_CODE,
                COUNTRY_LOCALE_CODE_INDIA, LANGUAGE_LOCALE_CODE_ENGLISH,
                ANDROID_DEVICE_MODEL, ANDROID_SDK_VERSION,
                ANDROID_BUILD_FINGERPRINT, NETWORK_WIFI))
        navigation_drawer_entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())
        android_app_context = (
            app_feedback_report_domain.AndroidAppContext(
                navigation_drawer_entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH, ANDROID_TEXT_SIZE, True,
                False, False, EVENT_LOGS, LOGCAT_LOGS))
        self.android_report_obj = app_feedback_report_domain.AppFeedbackReport(
            self.android_report_id, ANDROID_REPORT_INFO_SCHEMA_VERSION,
            PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP, 0, self.ticket_id,
            None, android_user_supplied_feedback, android_device_system_context,
            android_app_context)

        self.ticket_obj = app_feedback_report_domain.AppFeedbackReportTicket(
            self.ticket_id, TICKET_NAME, PLATFORM_ANDROID, None, None, False,
            REPORT_SUBMITTED_TIMESTAMP, [self.android_report_id])

    def test_to_dict(self) -> None:
        expected_dict = {
            'ticket_id': self.ticket_id,
            'ticket_name': TICKET_NAME,
            'platform': PLATFORM_ANDROID,
            'github_issue_repo_name': None,
            'github_issue_number': None,
            'archived': False,
            'newest_report_creation_timestamp_isoformat': (
                REPORT_SUBMITTED_TIMESTAMP.isoformat()),
            'reports': [self.android_report_id]
        }
        self.assertDictEqual(
            expected_dict, self.ticket_obj.to_dict())

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_ticket_id_not_a_string_fails(self) -> None:
        self.ticket_obj.ticket_id = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket id should be a string')

    def test_validation_invalid_ticket_id_fails(self) -> None:
        self.ticket_obj.ticket_id = 'invalid_ticket_id'
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket id %s is invalid' % 'invalid_ticket_id')

    # Here we use MyPy ignore because we assign type None to
    # type str. This is done to test that the validation fails.
    def test_validation_ticket_name_is_none_fails(self) -> None:
        self.ticket_obj.ticket_name = None  # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'No ticket name supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_ticket_name_is_not_a_string_fails(self) -> None:
        self.ticket_obj.ticket_name = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket name should be a string')

    def test_validation_ticket_name_too_long_fails(self) -> None:
        long_name = 'too long%s' % 'x' * (
            app_feedback_report_constants.MAXIMUM_TICKET_NAME_LENGTH)
        self.ticket_obj.ticket_name = long_name
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket name is too long, has %d characters' % len(long_name))

    # Here we use MyPy ignore because we assign type None to
    # type List[str]. This is done to test that the validation fails.
    def test_validation_report_ids_is_none_fails(self) -> None:
        self.ticket_obj.reports = None # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'No reports list supplied.')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_report_ids_not_a_list_fails(self) -> None:
        self.ticket_obj.reports = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'The reports list should be a list')

    def test_validation_invalid_report_ids_fails(self) -> None:
        self.ticket_obj.reports = ['invalid_report_id']
        self._assert_validation_error(
            self.ticket_obj,
            'The report with id %s is invalid.' % 'invalid_report_id')

    def test_validation_invalid_github_issue_number_fails(self) -> None:
        self.ticket_obj.github_issue_number = -1
        self._assert_validation_error(
            self.ticket_obj,
            'The Github issue number name must be a positive integer')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_github_repo_name_not_a_string_fails(self) -> None:
        self.ticket_obj.github_issue_repo_name = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'The Github repo name should be a string')

    def test_validation_invalid_github_repo_name_fails(self) -> None:
        self.ticket_obj.github_issue_repo_name = 'invalid_repo_name'
        self._assert_validation_error(
            self.ticket_obj,
            'The Github repo %s is invalid' % 'invalid_repo_name')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_archived_is_not_boolean_fails(self) -> None:
        self.ticket_obj.archived = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket archived status must be a boolean')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_check_with_integer_github_issue_number(self) -> None:
        self.ticket_obj.github_issue_number = 5
        self.ticket_obj.github_issue_repo_name = PLATFORM_CHOICE_ANDROID
        self.ticket_obj.archived = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket archived status must be a boolean')

    def _assert_validation_error(
            self,
            ticket_obj: app_feedback_report_domain.AppFeedbackReportTicket,
            expected_error_substring: str
    ) -> None:
        """Checks that the ticket passes validation.

        Args:
            ticket_obj: AppFeedbackReportTicket. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            ticket_obj.validate()


class AppFeedbackReportDailyStatsDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.generate_id(
                TICKET_NAME))
        self.android_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP))
        self.ticket_obj = app_feedback_report_domain.AppFeedbackReportTicket(
            self.ticket_id, TICKET_NAME, PLATFORM_ANDROID, None, None, False,
            REPORT_SUBMITTED_TIMESTAMP, [self.android_report_id])
        app_feedback_report_models.AppFeedbackReportModel.create(
            self.android_report_id, PLATFORM_ANDROID,
            REPORT_SUBMITTED_TIMESTAMP, 0, REPORT_TYPE_SUGGESTION.value,
            CATEGORY_SUGGESTION_OTHER.value, ANDROID_PLATFORM_VERSION,
            COUNTRY_LOCALE_CODE_INDIA, ANDROID_SDK_VERSION,
            ANDROID_DEVICE_MODEL, ENTRY_POINT_NAVIGATION_DRAWER, None, None,
            None, None, LANGUAGE_LOCALE_CODE_ENGLISH,
            LANGUAGE_LOCALE_CODE_ENGLISH, ANDROID_REPORT_INFO, None)

        param_stats = {
            'platform': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    PLATFORM_ANDROID: 1})
            ),
            'report_type': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    REPORT_TYPE_SUGGESTION.value: 1})
            ),
            'country_locale_code': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    COUNTRY_LOCALE_CODE_INDIA: 1})
            ),
            'entry_point_name': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    ENTRY_POINT_NAVIGATION_DRAWER: 1})
            ),
            'text_language_code': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    LANGUAGE_LOCALE_CODE_ENGLISH: 1})
            ),
            'audio_language_code': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    LANGUAGE_LOCALE_CODE_ENGLISH: 1})
            ),
            'android_sdk_version': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    str(ANDROID_SDK_VERSION): 1})
            ),
            'version_name': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    ANDROID_PLATFORM_VERSION: 1})
            )
        }
        self.stats_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.calculate_id(
                PLATFORM_ANDROID, self.ticket_id,
                REPORT_SUBMITTED_TIMESTAMP.date()))
        self.stats_obj = app_feedback_report_domain.AppFeedbackReportDailyStats(
            self.stats_id, self.ticket_obj, PLATFORM_ANDROID,
            REPORT_SUBMITTED_TIMESTAMP, 1, param_stats)

    def test_to_dict(self) -> None:
        expected_dict = {
            'stats_id': self.stats_id,
            'ticket': self.ticket_obj.to_dict(),
            'platform': PLATFORM_ANDROID,
            'stats_tracking_date': REPORT_SUBMITTED_TIMESTAMP.isoformat(),
            'total_reports_submitted': 1,
            'daily_param_stats': {
                'platform': {PLATFORM_ANDROID: 1},
                'report_type': {REPORT_TYPE_SUGGESTION.value: 1},
                'country_locale_code': {COUNTRY_LOCALE_CODE_INDIA: 1},
                'entry_point_name': {ENTRY_POINT_NAVIGATION_DRAWER: 1},
                'text_language_code': {LANGUAGE_LOCALE_CODE_ENGLISH: 1},
                'audio_language_code': {LANGUAGE_LOCALE_CODE_ENGLISH: 1},
                'android_sdk_version': {str(ANDROID_SDK_VERSION): 1},
                'version_name': {ANDROID_PLATFORM_VERSION: 1}
            }
        }
        self.assertDictEqual(expected_dict, self.stats_obj.to_dict())

    def test_validation_on_valid_stats_does_not_fail(self) -> None:
        self.stats_obj.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_stats_id_is_not_a_string_fails(self) -> None:
        self.stats_obj.stats_id = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.stats_obj, 'The stats id should be a string')

    def test_validation_invalid_id_fails(self) -> None:
        self.stats_obj.stats_id = 'invalid_stats_id'
        self._assert_validation_error(
            self.stats_obj, 'The stats id %s is invalid' % 'invalid_stats_id')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_total_reports_submitted_is_not_an_int_fails(
        self
    ) -> None:
        self.stats_obj.total_reports_submitted = 'wrong type' # type: ignore[assignment]
        self._assert_validation_error(
            self.stats_obj,
            'The total number of submitted reports should be an int')

    def test_validation_total_reports_submitted_is_less_than_0_fails(
            self) -> None:
        self.stats_obj.total_reports_submitted = -1
        self._assert_validation_error(
            self.stats_obj,
            'The total number of submitted reports should be a non-negative '
            'int')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_daily_param_stats_is_not_a_dict_fails(self) -> None:
        self.stats_obj.daily_param_stats = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.stats_obj, 'The parameter stats should be a dict')

    def test_validation_invalid_daily_param_stats_fails(self) -> None:
        self.stats_obj.daily_param_stats = {
            'invalid_stat_name':
            app_feedback_report_domain.ReportStatsParameterValueCounts(
                {'invalid_stats': 0}),
        }
        self._assert_validation_error(
            self.stats_obj,
            'The parameter %s is not a valid parameter to aggregate stats '
            'on' % 'invalid_stat_name')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_parameter_value_counts_objects_are_invalid_fails(
            self) -> None:
        self.stats_obj.daily_param_stats = {
            'report_type': (
                app_feedback_report_domain.ReportStatsParameterValueCounts(
                    {
                        123: 1 # type: ignore[dict-item]
                    }
                )
            )
        }
        self._assert_validation_error(
            self.stats_obj, 'The parameter value should be a string')

    def _assert_validation_error(
            self,
            stats_obj: app_feedback_report_domain.AppFeedbackReportDailyStats,
            expected_error_substring: str
    ) -> None:
        """Checks that the stats object passes validation.

        Args:
            stats_obj: AppFeedbackReportStats. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            stats_obj.validate()


class ReportStatsParameterValueCountsDomainTests(test_utils.GenericTestBase):

    def test_to_dict(self) -> None:
        counts_obj = app_feedback_report_domain.ReportStatsParameterValueCounts(
            {
                PLATFORM_ANDROID: 1,
                PLATFORM_WEB: 1
            })
        expected_dict = {
            'android': 1,
            'web': 1
        }
        self.assertDictEqual(
            expected_dict, counts_obj.to_dict())

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_invalid_parameter_value_fails(self) -> None:
        counts_obj = app_feedback_report_domain.ReportStatsParameterValueCounts(
            {
                1: 1, # type: ignore[dict-item]
                # Here we use MyPy ignore because this wrong type is provided
                # only for type checking.
                2: 1 # type: ignore[dict-item]
            })
        self._assert_validation_error(
            counts_obj, 'The parameter value should be a string')

    def test_validation_with_invalid_parameter_counts_fails(self) -> None:
        counts_obj = app_feedback_report_domain.ReportStatsParameterValueCounts(
            {
                'value_1': -1,
            })
        self._assert_validation_error(
            counts_obj, 'The parameter value count should be a non-negative '
            'int')

    def _assert_validation_error(
            self,
            counts_obj: (
                app_feedback_report_domain.ReportStatsParameterValueCounts),
            expected_error_substring: str
    ) -> None:
        """Checks that the parameter counts passes validation.

        Args:
            counts_obj: ReportStatsParameterValueCounts. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            counts_obj.validate()


class AppFeedbackReportFilterDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.filter = app_feedback_report_domain.AppFeedbackReportFilter(
            app_feedback_report_constants.FilterFieldNames.PLATFORM,
            ['web', 'android'])

    def test_to_dict(self) -> None:
        app_feedback_report_constants.PLATFORM_CHOICES.sort()
        expected_dict = {
            'filter_field': 'PLATFORM',
            'filter_options': app_feedback_report_constants.PLATFORM_CHOICES
        }
        self.assertDictEqual(
            expected_dict, self.filter.to_dict())

    def test_validation_with_invalid_filter_field_fails(self) -> None:
        class InvalidFieldName(enum.Enum):
            """Invalid field name."""

            INVALID_FILTER_FIELD = 'invalid_filter_field'
        # Here we use MyPy ignore because we assign type
        # "InvalidFieldName" to the class filter field name.
        # This is done to make sure that the type checker does
        # not complain about the type of the filter field name.
        self.filter.filter_field = InvalidFieldName.INVALID_FILTER_FIELD # type: ignore[assignment]
        self._assert_validation_error(
            self.filter,
            'The filter field should be one of ')

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_filter_values_list_is_none_fails(self) -> None:
        self.filter.filter_options = None # type: ignore[assignment]
        self._assert_validation_error(
            self.filter,
            'The filter options should be a list')

    def test_validation_passes_with_valid_filter_options_list(self) -> None:
        """Tests that validation passes when filter_options is a valid list."""
        self.filter.filter_options = ['web', 'android']
        # There should be no exception raised when trying to validate.
        # If exception is raised, the test fails.
        self.filter.validate()

    def _assert_validation_error(
            self,
            filter_obj: app_feedback_report_domain.AppFeedbackReportFilter,
            expected_error_substring: str
    ) -> None:
        """Checks that the filter object passes validation.

        Args:
            filter_obj: AppFeedbackReportFilter. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            filter_obj.validate()
