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

from core.domain import app_feedback_report_constants as constants
from core.domain import app_feedback_report_domain
from core.platform import models
from core.tests import test_utils

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

PLATFORM_ANDROID = constants.PLATFORM_CHOICE_ANDROID
PLATFORM_WEB = constants.PLATFORM_CHOICE_WEB
TICKET_NAME = 'ticket name'
TICKET_ID = '%s.%s.%s' % (
    'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC), '16CharString1234')
REPORT_TYPE_SUGGESTION = constants.REPORT_TYPE.suggestion
REPORT_TYPE_ISSUE = constants.REPORT_TYPE.issue
CATEGORY_SUGGESTION_OTHER = constants.CATEGORY.other_suggestion
CATEGORY_ISSUE_TOPICS = constants.CATEGORY.topics_issue
ANDROID_PLATFORM_VERSION = '0.1-alpha-abcdef1234'
COUNTRY_LOCALE_CODE_INDIA = 'in'
ANDROID_DEVICE_MODEL = 'Pixel 4a'
ANDROID_SDK_VERSION = 28
ENTRY_POINT_CRASH = 'crash'
ENTRY_POINT_NAVIGATION_DRAWER = 'navigation_drawer'
LANGUAGE_LOCALE_CODE_ENGLISH = 'en'
ANDROID_PACKAGE_VERSION_CODE = 1
NETWORK_WIFI = constants.ANDROID_NETWORK_TYPES.wifi
ANDROID_TEXT_SIZE = constants.ANDROID_TEXT_SIZE.medium_text_size
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
    'network_type': NETWORK_WIFI.name,
    'android_device_language_locale_code': LANGUAGE_LOCALE_CODE_ENGLISH,
    'entry_point_info': {
        'entry_point_name': ENTRY_POINT_NAVIGATION_DRAWER,
    },
    'text_size': ANDROID_TEXT_SIZE.name,
    'only_allows_wifi_download_and_update': True,
    'automatically_update_topics': False,
    'account_is_profile_admin': False
}
WEB_REPORT_INFO = {
    'user_feedback_selected_items': None,
    'user_feedback_other_text_input': USER_TEXT_INPUT,
}
ANDROID_REPORT_INFO_SCHEMA_VERSION = 1
WEB_PLATFORM_VERSION = '3.0.8'


class AppFeedbackReportDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AppFeedbackReportDomainTests, self).setUp()
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
            self.android_report_id, ANDROID_REPORT_INFO_SCHEMA_VERSION,
            PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP, 0, TICKET_ID, None,
            web_user_supplied_feedback, device_system_context, app_context)

    def test_to_dict_android_report(self):
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
                'report_type': REPORT_TYPE_SUGGESTION.name,
                'category': CATEGORY_SUGGESTION_OTHER.name,
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
                'network_type': NETWORK_WIFI.name
            },
            'app_context': {
                'entry_point': {
                    'entry_point_name': ENTRY_POINT_NAVIGATION_DRAWER
                },
                'text_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
                'audio_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
                'text_size': ANDROID_TEXT_SIZE.name,
                'only_allows_wifi_download_and_update': True,
                'automatically_update_topics': False,
                'account_is_profile_admin': False,
                'event_logs': EVENT_LOGS,
                'logcat_logs': LOGCAT_LOGS
            }
        }
        self.assertDictEqual(expected_dict, self.android_report_obj.to_dict())

    def test_report_android_schema_version_less_than_minimum_validation_fails(
            self):
        self.android_report_obj.schema_version = (
            feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION - 1)
        self._assert_validation_error(
            self.android_report_obj,
            'The report schema version %r is invalid, expected an integer' % (
                feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION - 1))

    def test_android_schema_version_greater_than_current_validation_fails(self):
        self.android_report_obj.schema_version = (
            feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION + 1)
        self._assert_validation_error(
            self.android_report_obj,
            'The supported report schema versions for android reports are ')

    def test_report_web_schema_version_less_than_minimum_validation_fails(
            self):
        self.web_report_obj.platform = PLATFORM_WEB
        self.web_report_obj.schema_version = (
            feconf.MINIMUM_WEB_REPORT_SCHEMA_VERSION - 1)
        self._assert_validation_error(
            self.web_report_obj,
            'The report schema version %r is invalid, expected an integer' % (
                feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION - 1))

    def test_report_web_schema_version_greater_than_current_validation_fails(
            self):
        self.web_report_obj.platform = PLATFORM_WEB
        self.web_report_obj.schema_version = (
            feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION + 1)
        self._assert_validation_error(
            self.web_report_obj,
            'The supported report schema versions for web reports are ')

    def test_report_platform_is_invalid_validation_fails(self):
        self.android_report_obj.platform = 'invalid_platform'
        self._assert_validation_error(
            self.android_report_obj, 'Report platform should be one of ')

    def test_report_scrubber_id_is_invalid_validation_fails(self):
        self.android_report_obj.scrubbed_by = 'invalid_user'
        self._assert_validation_error(
            self.android_report_obj,
            'The scrubbed_by user id u\'invalid_user\' is invalid')

    def _assert_validation_error(
            self, report_obj, expected_error_substring):
        """Checks that the feedback report passes validation.

        Args:
            report_obj: AppFeedbackReport. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            report_obj.validate()


class UserSuppliedFeedbackDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserSuppliedFeedbackDomainTests, self).setUp()
        self.user_supplied_feedback = (
            app_feedback_report_domain.UserSuppliedFeedback(
                REPORT_TYPE_SUGGESTION, CATEGORY_SUGGESTION_OTHER,
                USER_SELECTED_ITEMS, USER_TEXT_INPUT))

    def test_to_dict(self):
        expected_dict = {
            'report_type': REPORT_TYPE_SUGGESTION.name,
            'category': CATEGORY_SUGGESTION_OTHER.name,
            'user_feedback_selected_items': USER_SELECTED_ITEMS,
            'user_feedback_other_text_input': USER_TEXT_INPUT
        }
        self.assertDictEqual(
            expected_dict, self.user_supplied_feedback.to_dict())

    def test_validation_invalid_report_type_fails(self):
        self.user_supplied_feedback.report_type = 'invalid_report_type'
        self._assert_validation_error(
            self.user_supplied_feedback, 'Invalid report type ')

    def test_validation_invalid_report_category_fails(self):
        self.user_supplied_feedback.report_type = REPORT_TYPE_ISSUE
        self.user_supplied_feedback.category = 'invalid_category'
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Invalid category invalid_category,')

    def test_validation_has_selection_items_for_invalid_category_fails(self):
        self.user_supplied_feedback.user_feedback_selected_items = (
            ['invalid', 'list'])
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Report cannot have selection options for category ')

    def test_validation_selection_items_is_none_for_selection_category_fails(
            self):
        self.user_supplied_feedback.report_type = REPORT_TYPE_ISSUE
        self.user_supplied_feedback.category = CATEGORY_ISSUE_TOPICS
        self.user_supplied_feedback.user_feedback_selected_items = None
        self._assert_validation_error(
            self.user_supplied_feedback,
            'requires selection options in the report.')

    def test_validation_has_text_input_without_other_selected_fails(self):
        self.user_supplied_feedback.report_type = REPORT_TYPE_ISSUE
        self.user_supplied_feedback.category = CATEGORY_ISSUE_TOPICS
        self.user_supplied_feedback.user_feedback_selected_items = (
            ['invalid', 'list'])
        self._assert_validation_error(
            self.user_supplied_feedback,
            'Report cannot have other input text ')

    def test_validation_text_input_is_none_with_other_selected_fails(self):
        self.user_supplied_feedback.report_type = REPORT_TYPE_ISSUE
        self.user_supplied_feedback.category = CATEGORY_ISSUE_TOPICS
        self.user_supplied_feedback.user_feedback_selected_items = (
            ['other'])
        self.user_supplied_feedback.user_feedback_other_text_input = None
        self._assert_validation_error(
            self.user_supplied_feedback,
            'requires text input in the report.')

    def _assert_validation_error(
            self, feedback_obj, expected_error_substring):
        """Checks that the user supplied feeedback passes validation.

        Args:
            feedback_obj: UserSuppliedFeedback. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            feedback_obj.validate()


class DeviceSystemContextDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(DeviceSystemContextDomainTests, self).setUp()
        self.device_system_context = (
            app_feedback_report_domain.DeviceSystemContext(
                WEB_PLATFORM_VERSION, COUNTRY_LOCALE_CODE_INDIA))

    def test_to_dict(self):
        expected_dict = {
            'version_name': WEB_PLATFORM_VERSION,
            'device_country_locale_code': COUNTRY_LOCALE_CODE_INDIA
        }
        self.assertDictEqual(
            expected_dict, self.device_system_context.to_dict())

    def test_validation_raises_not_implemented_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of DeviceSystemContext should implement domain '
            'validation.'):
            self.device_system_context.validate()


class AndroidDeviceSystemContextTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AndroidDeviceSystemContextTests, self).setUp()
        self.device_system_context = (
            app_feedback_report_domain.AndroidDeviceSystemContext(
                ANDROID_PLATFORM_VERSION, ANDROID_PACKAGE_VERSION_CODE,
                COUNTRY_LOCALE_CODE_INDIA, LANGUAGE_LOCALE_CODE_ENGLISH,
                ANDROID_DEVICE_MODEL, ANDROID_SDK_VERSION,
                ANDROID_BUILD_FINGERPRINT, NETWORK_WIFI))

    def test_to_dict(self):
        expected_dict = {
            'version_name': ANDROID_PLATFORM_VERSION,
            'package_version_code': ANDROID_PACKAGE_VERSION_CODE,
            'device_country_locale_code': COUNTRY_LOCALE_CODE_INDIA,
            'device_language_locale_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'device_model': ANDROID_DEVICE_MODEL,
            'sdk_version': ANDROID_SDK_VERSION,
            'build_fingerprint': ANDROID_BUILD_FINGERPRINT,
            'network_type': NETWORK_WIFI.name
        }
        self.assertDictEqual(
            expected_dict, self.device_system_context.to_dict())

    def test_validation_version_name_is_none_fails(self):
        self.device_system_context.version_name = None
        self._assert_validation_error(
            self.device_system_context, 'No version name supplied.')

    def test_validation_version_name_is_not_a_string_fails(self):
        self.device_system_context.version_name = 1
        self._assert_validation_error(
            self.device_system_context, 'Version name must be a string')

    def test_validation_invalid_version_name_fails(self):
        self.device_system_context.version_name = 'invalid_version_name'
        self._assert_validation_error(
            self.device_system_context,
            'The version name is not a valid string format')

    def test_validation_package_version_code_is_none_fails(self):
        self.device_system_context.package_version_code = None
        self._assert_validation_error(
            self.device_system_context, 'No package version code supplied.')

    def test_validation_package_version_code_is_not_an_int_fails(self):
        self.device_system_context.package_version_code = 'invalid_code'
        self._assert_validation_error(
            self.device_system_context, 'Package verion code must be an int')

    def test_validation_package_version_code_less_than_minimum_fails(self):
        self.device_system_context.package_version_code = (
            feconf.MINIMUM_ANDROID_PACKAGE_VERSION_CODE - 1)
        self._assert_validation_error(
            self.device_system_context,
            'Package version code is not a valid int')

    def test_validation_package_version_code_greater_than_maximum_fails(self):
        self.device_system_context.package_version_code = (
            feconf.MAXIMUM_ANDROID_PACKAGE_VERSION_CODE + 1)
        self._assert_validation_error(
            self.device_system_context,
            'Package version code is not a valid int')

    def test_validation_country_locale_code_is_none_fails(self):
        self.device_system_context.device_country_locale_code = None
        self._assert_validation_error(
            self.device_system_context,
            'No device country locale code supplied.')

    def test_validation_country_locale_code_not_a_string_fails(self):
        self.device_system_context.device_country_locale_code = 123
        self._assert_validation_error(
            self.device_system_context,
            'device\'s country locale code must be an string,')

    def test_validation_invalid_country_locale_code_fails(self):
        self.device_system_context.device_country_locale_code = 'not a code 123'
        self._assert_validation_error(
            self.device_system_context,
            'device\'s country locale code is not a valid string')

    def test_validation_language_locale_code_is_none_fails(self):
        self.device_system_context.device_language_locale_code = None
        self._assert_validation_error(
            self.device_system_context,
            'No device language locale code supplied.')

    def test_validation_language_locale_code_not_a_string_fails(self):
        self.device_system_context.device_language_locale_code = 123
        self._assert_validation_error(
            self.device_system_context,
            'device\'s language locale code must be an string,')

    def test_validation_invalid_language_locale_code_fails(self):
        self.device_system_context.device_language_locale_code = 'not a code 12'
        self._assert_validation_error(
            self.device_system_context,
            'device\'s language locale code is not a valid string')

    def test_validation_sdk_version_is_none_fails(self):
        self.device_system_context.sdk_version = None
        self._assert_validation_error(
            self.device_system_context, 'No SDK version supplied.')

    def test_validation_sdk_version_not_an_int_fails(self):
        self.device_system_context.sdk_version = 'invalid_sdk_code'
        self._assert_validation_error(
            self.device_system_context, 'SDK version must be an int')

    def test_validation_sdk_version_lower_than_minimum_fails(self):
        self.device_system_context.sdk_version = (
            constants.MINIMUM_ANDROID_SDK_VERSION - 1)
        self._assert_validation_error(
            self.device_system_context, 'Invalid SDK version')

    def test_validation_network_type_is_none_fails(self):
        self.device_system_context.network_type = None
        self._assert_validation_error(
            self.device_system_context, 'No network type supplied.')

    def test_validation_invalid_network_type_fails(self):
        self.device_system_context.network_type = 'invaid_network_type'
        self._assert_validation_error(
            self.device_system_context, 'Invalid network type,')

    def _assert_validation_error(
            self, context_obj, expected_error_substring):
        """Checks that the Android device system context passes validation.

        Args:
            context_obj: AndroidDeviceSystemContext. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            context_obj.validate()


class EntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(EntryPointDomainTests, self).setUp()
        self.entry_point = (
            app_feedback_report_domain.EntryPoint(
                constants.ENTRY_POINT.navigation_drawer, 'topic_id', 'story_id',
                'exploration_id', 'subtopic_id'))

    def test_to_dict_raises_exception(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of EntryPoint should implement their own dict'):
            self.entry_point.to_dict()

    def test_validation_raises_exception(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of EntryPoint should implement their own validation'):
            self.entry_point.validate()


class NavigationDrawerEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(NavigationDrawerEntryPointDomainTests, self).setUp()
        self.entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())

    def test_to_dict(self):
        expected_dict = {
            'entry_point_name': (
                constants.ENTRY_POINT.navigation_drawer.name)
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_invalid_name_fails(self):
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected entry point name %s' % (
                constants.ENTRY_POINT.navigation_drawer.name)):
            self.entry_point.validate()


class LessonPlayerEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(LessonPlayerEntryPointDomainTests, self).setUp()
        self.entry_point = (
            app_feedback_report_domain.LessonPlayerEntryPoint(
                'topic_id', 'story_id', 'exploration_id'))

    def test_to_dict(self):
        expected_dict = {
            'entry_point_name': (
                constants.ENTRY_POINT.lesson_player.name),
            'topic_id': 'topic_id',
            'story_id': 'story_id',
            'exploration_id': 'exploration_id'
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_invalid_name_fails(self):
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        self._assert_validation_error(
            self.entry_point,
            'Expected entry point name %s' % (
                constants.ENTRY_POINT.lesson_player.name))

    def test_validation_invalid_topic_id_fails(self):
        self.entry_point.topic_id = 'invalid_topic_id'
        self._assert_validation_error(
            self.entry_point,
            'Topic id %s is invalid' % 'invalid_topic_id')

    def test_validation_invalid_story_id_fails(self):
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'invalid_story_id'
        self._assert_validation_error(
            self.entry_point, 'Invalid story id')

    def test_validation_invalid_exploration_id_fails(self):
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.story_id = 'valid_story1'
        self.entry_point.exploration_id = 'invalid_exploration'
        self._assert_validation_error(
            self.entry_point,
            'Exploration with id invalid_exploration is not part of story '
            'with id')

    def _assert_validation_error(
            self, entry_point_obj, expected_error_substring):
        """Checks that the entry point passes validation.

        Args:
            entry_point_obj: LessonPlayerEntryPoint. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            entry_point_obj.validate()


class RevisionCardEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(RevisionCardEntryPointDomainTests, self).setUp()
        self.entry_point = (
            app_feedback_report_domain.RevisionCardEntryPoint(
                'topic_id', 'subtopic_id'))

    def test_to_dict(self):
        expected_dict = {
            'entry_point_name': (
                constants.ENTRY_POINT.revision_card.name),
            'topic_id': 'topic_id',
            'subtopic_id': 'subtopic_id'
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_invalid_name_fails(self):
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        self._assert_validation_error(
            self.entry_point,
            'Expected entry point name %s' % (
                constants.ENTRY_POINT.revision_card.name))

    def test_validation_invalid_topic_id_fails(self):
        self.entry_point.topic_id = 'invalid_topic_id'
        self._assert_validation_error(
            self.entry_point,
            'Topic id %s is invalid' % 'invalid_topic_id')

    def test_validation_invalid_subtopic_id_fails(self):
        self.entry_point.topic_id = 'valid_topic1'
        self.entry_point.subtopic_id = 'invalid_subtopic_id'
        self._assert_validation_error(
            self.entry_point, 'Expected subtopic id to be an int')

    def _assert_validation_error(
            self, entry_point_obj, expected_error_substring):
        """Checks that the entry point passes validation.

        Args:
            entry_point_obj: RevisionCardEntryPoint. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            entry_point_obj.validate()


class CrashEntryPointDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CrashEntryPointDomainTests, self).setUp()
        self.entry_point = (
            app_feedback_report_domain.CrashEntryPoint())

    def test_to_dict(self):
        expected_dict = {
            'entry_point_name': (
                constants.ENTRY_POINT.crash.name)
        }
        self.assertDictEqual(
            expected_dict, self.entry_point.to_dict())

    def test_validation_invalid_name_fails(self):
        self.entry_point.entry_point_name = 'invalid_entry_point_name'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected entry point name %s' % (
                constants.ENTRY_POINT.crash.name)):
            self.entry_point.validate()


class AppContextDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AppContextDomainTests, self).setUp()
        entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())
        self.app_context = (
            app_feedback_report_domain.AppContext(
                entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH))

    def test_to_dict(self):
        expected_dict = {
            'entry_point': {
                'entry_point_name': (
                    constants.ENTRY_POINT.navigation_drawer.name),
            },
            'text_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'audio_language_code': LANGUAGE_LOCALE_CODE_ENGLISH
        }
        self.assertDictEqual(
            expected_dict, self.app_context.to_dict())

    def test_validation_raises_exception(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of AppContext should implement their own validation'):
            self.app_context.validate()


class AndroidAppContextDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AndroidAppContextDomainTests, self).setUp()
        entry_point = (
            app_feedback_report_domain.NavigationDrawerEntryPoint())
        self.app_context = (
            app_feedback_report_domain.AndroidAppContext(
                entry_point, LANGUAGE_LOCALE_CODE_ENGLISH,
                LANGUAGE_LOCALE_CODE_ENGLISH, ANDROID_TEXT_SIZE, True, False,
                False, EVENT_LOGS, LOGCAT_LOGS))

    def test_to_dict(self):
        expected_dict = {
            'entry_point': {
                'entry_point_name': (
                    constants.ENTRY_POINT.navigation_drawer.name),
            },
            'text_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'audio_language_code': LANGUAGE_LOCALE_CODE_ENGLISH,
            'text_size': ANDROID_TEXT_SIZE.name,
            'only_allows_wifi_download_and_update': True,
            'automatically_update_topics': False,
            'account_is_profile_admin': False,
            'event_logs': EVENT_LOGS,
            'logcat_logs': LOGCAT_LOGS
        }
        self.assertDictEqual(
            expected_dict, self.app_context.to_dict())

    def test_validation_invalid_text_size_fails(self):
        self.app_context.text_size = 'invalid_text_size'
        self._assert_validation_error(
            self.app_context, 'App text size should be one of')

    def test_validation_event_logs_is_none_fails(self):
        self.app_context.event_logs = None
        self._assert_validation_error(
            self.app_context, 'Should have an event log list')

    def test_validation_logcat_logs_is_none_fails(self):
        self.app_context.logcat_logs = None
        self._assert_validation_error(
            self.app_context, 'Should have a logcat log list')

    def _assert_validation_error(
            self, app_context_obj, expected_error_substring):
        """Checks that the app context passes validation.

        Args:
            app_context_obj: AndroidAppContext. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            app_context_obj.validate()


class AppFeedbackReportTicketDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AppFeedbackReportTicketDomainTests, self).setUp()

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

    def test_to_dict(self):
        expected_dict = {
            'ticket_id': self.ticket_id,
            'ticket_name': TICKET_NAME,
            'platform': PLATFORM_ANDROID,
            'github_issue_repo_name': None,
            'github_issue_number': None,
            'archived': False,
            'newest_report_creation_timestamp': (
                REPORT_SUBMITTED_TIMESTAMP.isoformat()),
            'reports': [self.android_report_id]
        }
        self.assertDictEqual(
            expected_dict, self.ticket_obj.to_dict())

    def test_validation_invalid_ticket_id_fails(self):
        self.ticket_obj.ticket_id = 'invalid_ticket_id'
        self._assert_validation_error(
            self.ticket_obj,
            'The ticket id %s is invalid' % 'invalid_ticket_id')

    def test_validation_invalid_report_ids_fails(self):
        self.ticket_obj.reports = ['invalid_report_id']
        self._assert_validation_error(
            self.ticket_obj,
            'The report with id %s is invalid.' % 'invalid_report_id')

    def test_validation_invalid_github_issue_number_fails(self):
        self.ticket_obj.github_issue_number = -1
        self._assert_validation_error(
            self.ticket_obj,
            'The Github issue number name must be a positive integer')

    def test_validation_invalid_github_repo_name_fails(self):
        self.ticket_obj.github_issue_repo_name = 'invalid_repo_name'
        self._assert_validation_error(
            self.ticket_obj,
            'The Github repo %s is invalid' % 'invalid_repo_name')

    def _assert_validation_error(
            self, ticket_obj, expected_error_substring):
        """Checks that the ticket passes validation.

        Args:
            ticket_obj: AppFeedbackReportTicket. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            ticket_obj.validate()


class AppFeedbackReportStatsDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AppFeedbackReportStatsDomainTests, self).setUp()

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
            REPORT_SUBMITTED_TIMESTAMP, 0, REPORT_TYPE_SUGGESTION.name,
            CATEGORY_SUGGESTION_OTHER.name, ANDROID_PLATFORM_VERSION,
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
                    REPORT_TYPE_SUGGESTION.name: 1})
            ),
            'country_local_code': (
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
            'sdk_version': (
                app_feedback_report_domain.ReportStatsParameterValueCounts({
                    ANDROID_SDK_VERSION: 1})
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

    def test_to_dict(self):
        expected_dict = {
            'stats_id': self.stats_id,
            'ticket': self.ticket_obj.to_dict(),
            'platform': PLATFORM_ANDROID,
            'stats_tracking_date': REPORT_SUBMITTED_TIMESTAMP.isoformat(),
            'total_reports_submitted': 1,
            'daily_param_stats': {
                'platform': {PLATFORM_ANDROID: 1},
                'report_type': {REPORT_TYPE_SUGGESTION.name: 1},
                'country_local_code': {COUNTRY_LOCALE_CODE_INDIA: 1},
                'entry_point_name': {ENTRY_POINT_NAVIGATION_DRAWER: 1},
                'text_language_code': {LANGUAGE_LOCALE_CODE_ENGLISH: 1},
                'audio_language_code': {LANGUAGE_LOCALE_CODE_ENGLISH: 1},
                'sdk_version': {ANDROID_SDK_VERSION: 1},
                'version_name': {ANDROID_PLATFORM_VERSION: 1}
            }
        }
        self.assertDictEqual(expected_dict, self.stats_obj.to_dict())

    def test_validation_invalid_id_fails(self):
        self.stats_obj.stats_id = 'invalid_stats_id'
        self._assert_validation_error(
            self.stats_obj, 'The stats id %s is invalid' % 'invalid_stats_id')

    def test_validation_invalid_stats_fails(self):
        self.stats_obj.daily_param_stats = {
            'invalid_stat_name':
            app_feedback_report_domain.ReportStatsParameterValueCounts(
                {'invalid_stats': 0}),
        }
        self._assert_validation_error(
            self.stats_obj,
            'The param %s is not a valid param to aggregate stats on' % (
                'invalid_stat_name'))

    def _assert_validation_error(
            self, stats_obj, expected_error_substring):
        """Checks that the stats object passes validation.

        Args:
            stats_obj: AppFeedbackReportStats. The domain object to validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            stats_obj.validate()


class ReportStatsParameterValueCountsDomainTests(test_utils.GenericTestBase):

    def test_to_dict(self):
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

    def test_validation_with_invalid_parameter_value_fails(self):
        counts_obj = app_feedback_report_domain.ReportStatsParameterValueCounts(
            {
                1: 1,
                2: 1
            })
        self._assert_validation_error(
            counts_obj, 'The param value should be a string')

    def test_validation_with_invalid_parameter_counts_fails(self):
        counts_obj = app_feedback_report_domain.ReportStatsParameterValueCounts(
            {
                'value_1': 0,
            })
        self._assert_validation_error(
            counts_obj, 'The param value count should be a positive int')

    def _assert_validation_error(
            self, counts_obj, expected_error_substring):
        """Checks that the parameter counts passes validation.

        Args:
            counts_obj: ReportStatsParameterValueCounts. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            counts_obj.validate()


class AppFeedbackReportFilterDomainTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AppFeedbackReportFilterDomainTests, self).setUp()
        self.filter = app_feedback_report_domain.AppFeedbackReportFilter(
            constants.FILTER_FIELD_NAMES.platform, ['web', 'android'])

    def test_to_dict(self):
        expected_dict = {
            'filter_field': 'platform',
            'filter_options': (
                constants.PLATFORM_CHOICES.sort())
        }
        self.assertDictEqual(
            expected_dict, self.filter.to_dict())

    def test_validation_with_invalid_filter_field_fails(self):
        invalid_field_name = python_utils.create_enum('invalid_filter_field')
        self.filter.filter_field = invalid_field_name.invalid_filter_field
        self._assert_validation_error(
            self.filter,
            'The filter field should be one of ')

    def test_validation_filter_values_list_is_none_fails(self):
        self.filter.filter_options = None
        self._assert_validation_error(
            self.filter,
            'The filter options should be a list')

    def _assert_validation_error(
            self, filter_obj, expected_error_substring):
        """Checks that the filter object passes validation.

        Args:
            filter_obj: AppFeedbackReportFilter. The domain object to
                validate.
            expected_error_substring: str. String that should be a substring
                of the expected error message.
        """
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            filter_obj.validate()
