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

from core.domain import exp_services
from core.domain import story_domain
from core.domain import topic_domain
from core.tests import test_utils
from core.platform import models

import feconf
import python_utils
import utils

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
    'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC),
    '16CharString1234')
REPORT_TYPE_SUGGESTION = 'suggestion'
CATEGORY_OTHER = 'suggestion_other'
PLATFORM_VERSION = '0.1-alpha-abcdef1234'
COUNTRY_LOCALE_CODE_INDIA = 'in'
ANDROID_DEVICE_MODEL = 'Pixel 4a'
ANDROID_SDK_VERSION = 28
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
ANDROID_REPORT_INFO_SCHEMA_VERSION = 1


class AppFeedbackReportTest(test_utils.GenericTestBase):

    def setUp(self):
        super(AppFeedbackReportModelValidatorTests, self).setUp()
        signup(USER_1_EMAIL, USER_1_USERNAME)
        user_1_id = get_user_id_from_email(USER_1_EMAIL)
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                PLATFORM_ANDROID, REPORT_SUBMITTED_TIMESTAMP))
        app_feedback_report_models.AppFeedbackReportModel.create(
            entity_id=report_id,
            platform=PLATFORM_ANDROID,
            submitted_on=REPORT_SUBMITTED_TIMESTAMP,
            report_type=REPORT_TYPE_SUGGESTION,
            category=CATEGORY_OTHER,
            platform_version=PLATFORM_VERSION,
            android_device_country_locale_code=(
                COUNTRY_LOCALE_CODE_INDIA),
            android_sdk_version=ANDROID_SDK_VERSION,
            android_device_model=ANDROID_DEVICE_MODEL,
            entry_point=ENTRY_POINT_NAVIGATION_DRAWER,
            entry_point_topic_id=None,
            entry_point_story_id=None,
            entry_point_exploration_id=None,
            entry_point_subtopic_id=None,
            text_language_code=TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=ANDROID_REPORT_INFO,
            web_report_info=None)

    def test_to_dict(self):
        expected_dict = {
            'report_id': self.report_id,
            'schema_version': ANDROID_REPORT_INFO_SCHEMA_VERSION,
            'platform': PLATFORM_ANDROID,
            'submitted_on_timestamp': utils.get_human_readable_time_string(
                utils.get_time_in_millisecs(REPORT_SUBMITTED_TIMESTAMP)),
            'ticket_id': TICKET_ID,
            'scrubbed_by': None,
            'user_supplied_feedback': {
                'report_type': REPORT_TYPE_SUGGESTION,
                'category': CATEGORY_OTHER,
                'user_feedback_selected_items': None,
                'user_feedback_other_text_input': 'add an admin'
            },
            'device_system_context': {
                
            },
            'app_context': {
                
            }
        }
        actual_dict = app_feedback_report_domain.AppFeedbackReport(
            FULL_MESSAGE_ID, THREAD_ID, MESSAGE_ID,
            owner_id, expected_message_dict['updated_status'],
            expected_message_dict['updated_subject'],
            expected_message_dict['text'], fake_date, fake_date, False)
        assertDictEqual(
            expected_message_dict, observed_message.to_dict())



class AppFeedbackReportTicketTest(test_utils.GenericTestBase):


