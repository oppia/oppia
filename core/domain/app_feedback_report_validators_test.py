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

"""Tests for app feedback report validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from core.domain import app_feedback_report_validators
from core.domain import prod_validation_jobs_one_off as prod_validation_jobs
from core.platform import models
from core.tests import test_utils
import feconf
import utils

datastore_services = models.Registry.import_datastore_services()

(app_feedback_report_models,) = models.Registry.import_models([
    models.NAMES.app_feedback_report])


class AppFeedbackReportModelValidatorTests(test_utils.AuditJobsTestBase):

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
    CATEGORY_OTHER = 'other'
    PLATFORM_VERSION = '0.1-alpha-abcdef1234'
    COUNTRY_LOCALE_CODE_INDIA = 'in'
    ANDROID_DEVICE_MODEL = 'Pixel 4a'
    ANDROID_SDK_VERSION = 28
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
    ANDROID_REPORT_INFO_SCHEMA_VERSION = 1

    def setUp(self):
        super(AppFeedbackReportModelValidatorTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.report_id = (
            app_feedback_report_models.AppFeedbackReportModel.create(
                platform=self.PLATFORM_ANDROID,
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                android_device_country_locale_code=(
                    self.COUNTRY_LOCALE_CODE_INDIA),
                android_sdk_version=self.ANDROID_SDK_VERSION,
                android_device_model=self.ANDROID_DEVICE_MODEL,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                entry_point_topic_id=None,
                entry_point_story_id=None,
                entry_point_exploration_id=None,
                entry_point_subtopic_id=None,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=self.ANDROID_REPORT_INFO,
                web_report_info=None))

        self.expected_successful_validation_output = [
            u'[u\'fully-validated AppFeedbackReportModel\', 1]']
        self.job_class = (
            prod_validation_jobs.AppFeedbackReportModelAuditOneOffJob)

    def test_standard_model(self):
        self.run_job_and_check_output(
            self.expected_successful_validation_output, sort=False,
            literal_eval=False)

    def test_model_validation_with_valid_external_references_succesful(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.ticket_id = self.TICKET_ID
        model_entity.update_timestamps()
        model_entity.put()
        app_feedback_report_models.AppFeedbackReportTicketModel(
            id=self.TICKET_ID, ticket_name='example ticket',
            github_issue_repo_name=None, github_issue_number=None,
            archived=False,
            newest_report_timestamp=self.REPORT_SUBMITTED_TIMESTAMP,
            report_ids=[self.report_id]).put()

        self.run_job_and_check_output(
            self.expected_successful_validation_output, sort=False,
            literal_eval=False)

    def test_model_validation_with_invalid_external_references_id_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.ticket_id = 'invalid_ticket_id'
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for ticket_id field check of '
                'AppFeedbackReportModel\', '
                '[u"Entity id %s: based on field ticket_id having value '
                'invalid_ticket_id, expected model AppFeedbackReportTicketModel'
                ' with id invalid_ticket_id but it doesn\'t exist"]]') % (
                    model_entity.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_with_deleted_external_references_fails(self):
        app_feedback_report_models.AppFeedbackReportTicketModel(
            id=self.TICKET_ID, ticket_name='example ticket',
            github_issue_repo_name=None, github_issue_number=None,
            archived=False,
            newest_report_timestamp=self.REPORT_SUBMITTED_TIMESTAMP,
            report_ids=[self.report_id]).put()
        ticket_model_to_delete = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.TICKET_ID))
        ticket_model_to_delete.delete()

        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.ticket_id = self.TICKET_ID
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for ticket_id field check of '
                'AppFeedbackReportModel\', '
                '[u"Entity id %s: based on field ticket_id having value '
                '%s, expected model AppFeedbackReportTicketModel'
                ' with id %s but it doesn\'t exist"]]') % (
                    model_entity.id, self.TICKET_ID, self.TICKET_ID)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_with_invalid_id_fails(self):
        app_feedback_report_models.AppFeedbackReportModel(
            id='invalid_entity_id',
            platform=self.PLATFORM_ANDROID,
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            u'[u\'failed validation check for model id check of '
            'AppFeedbackReportModel\', '
            '[u\'Entity id invalid_entity_id: Entity id does not match regex '
            'pattern\']]')
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_with_android_schema_version_greater_than_current_schema_fails(
            self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.android_report_info_schema_version = 2
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for report schema version check '
                'of AppFeedbackReportModel\', '
                '[u\'Entity id %s: android report schema version %s is outside '
                'the range of supported versions [%s, %s]\']]') % (
                    model_entity.id,
                    model_entity.android_report_info_schema_version,
                    feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION,
                    feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_android_schema_version_less_than_min_schema_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.android_report_info_schema_version = 0
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for report schema version check '
                'of AppFeedbackReportModel\', '
                '[u\'Entity id %s: android report schema version %s is outside '
                'the range of supported versions [%s, %s]\']]') % (
                    model_entity.id,
                    model_entity.android_report_info_schema_version,
                    feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION,
                    feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_web_schema_version_greater_than_current_schema_fails(
            self):
        web_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.create(
                platform=self.PLATFORM_WEB,
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                android_device_country_locale_code=None,
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                entry_point_topic_id=None, entry_point_story_id=None,
                entry_point_exploration_id=None, entry_point_subtopic_id=None,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=None,
                web_report_info={}))
        web_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                web_report_id))
        web_entity.web_report_info_schema_version = 2
        web_entity.update_timestamps()
        web_entity.put()

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            (
                u'[u\'failed validation check for report schema version check '
                'of AppFeedbackReportModel\', '
                '[u\'Entity id %s: web report schema version %s is outside the '
                'range of supported versions [%s, %s]\']]') % (
                    web_entity.id, web_entity.web_report_info_schema_version,
                    feconf.MINIMUM_WEB_REPORT_SCHEMA_VERSION,
                    feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION))
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_web_schema_version_less_than_min_schema_fails(self):
        web_report_id = (
            app_feedback_report_models.AppFeedbackReportModel.create(
                platform=self.PLATFORM_WEB,
                submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
                report_type=self.REPORT_TYPE_SUGGESTION,
                category=self.CATEGORY_OTHER,
                platform_version=self.PLATFORM_VERSION,
                android_device_country_locale_code=None,
                android_device_model=self.ANDROID_DEVICE_MODEL,
                android_sdk_version=self.ANDROID_SDK_VERSION,
                entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
                entry_point_topic_id=None, entry_point_story_id=None,
                entry_point_exploration_id=None, entry_point_subtopic_id=None,
                text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
                audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
                android_report_info=None,
                web_report_info={}))
        web_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                web_report_id))
        web_entity.web_report_info_schema_version = 0
        web_entity.update_timestamps()
        web_entity.put()

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            (
                u'[u\'failed validation check for report schema version check '
                'of AppFeedbackReportModel\', '
                '[u\'Entity id %s: web report schema version %s is outside the '
                'range of supported versions [%s, %s]\']]') % (
                    web_entity.id, web_entity.web_report_info_schema_version,
                    feconf.MINIMUM_WEB_REPORT_SCHEMA_VERSION,
                    feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION))
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_created_on_greater_than_current_time_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.created_on = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for created_on datetime check '
                'of AppFeedbackReportModel\', '
                '[u\'Entity id %s: The created_on field has a value %s which '
                'is greater than the time when the job was run\']]') % (
                    model_entity.id, model_entity.created_on),
            (
                u'[u\'failed validation check for time field relation check '
                'of AppFeedbackReportModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value %s of last_updated '
                'field\']]') % (
                    model_entity.id, model_entity.created_on,
                    model_entity.last_updated)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_created_on_less_than_earliest_datetime_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        # Add a scrubber user so that it passes the scrubbing validation.
        model_entity.scrubbed_by = 'scrubber_user'
        model_entity.created_on = (
            app_feedback_report_validators.EARLIEST_VALID_DATETIME -
            datetime.timedelta(days=4))
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for created_on datetime check '
                'of AppFeedbackReportModel\', [u\'Entity id %s: The '
                'created_on field has a value %s which is less than the '
                'earliest possible submission date\']]') % (
                    model_entity.id, model_entity.created_on)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_no_scrubbed_by_field_with_created_on_inside_buffer_is_valid(
            self):
        valid_datetime_buffer = (
            app_feedback_report_validators.VALID_SCRUBBING_DATETIME_BUFFER -
            datetime.timedelta(days=1))
        valid_datetime = datetime.datetime.utcnow() - (
            feconf.APP_FEEDBACK_REPORT_MAXIMUM_DAYS + valid_datetime_buffer)
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.report_id))
        model_entity.created_on = valid_datetime
        model_entity.update_timestamps()
        model_entity.put()

        # We want to suppress the error from the created_on timestamp validation
        # because if this test is run APP_FEEDBACK_REPORT_MAXIMUM_DAYS number
        # of days within the EARLIEST_VALID_DATETIME, it will fail the
        # created_on timestamp validation. This is because the scrubbed_by field
        # validator checks that the scrubbed_by field exists if the created_on
        # timestamp is more than APP_FEEDBACK_REPORT_MAXIMUM_DAYS number of days
        # before the current timestamp, so if the current timestamp is within
        # this number of days from the EARLIEST_VALID_DATETIME, the created_on
        # validation check will always fail.
        validator_class = (
            app_feedback_report_validators.AppFeedbackReportModelValidator)
        with self.swap(
            validator_class, '_validate_created_on_datetime',
            types.MethodType(lambda x, y: True, validator_class)):
            self.run_job_and_check_output(
                self.expected_successful_validation_output, sort=False,
                literal_eval=False)

    def test_model_no_scrubbed_by_field_with_created_on_outside_buffer_fails(
            self):
        invalid_datetime_buffer = (
            app_feedback_report_validators.VALID_SCRUBBING_DATETIME_BUFFER +
            datetime.timedelta(days=2))
        invalid_datetime = datetime.datetime.utcnow() - (
            feconf.APP_FEEDBACK_REPORT_MAXIMUM_DAYS + invalid_datetime_buffer)
        model_id = app_feedback_report_models.AppFeedbackReportModel.create(
            platform=self.PLATFORM_ANDROID,
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            entry_point_topic_id=None,
            entry_point_story_id=None,
            entry_point_exploration_id=None,
            entry_point_subtopic_id=None,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            web_report_info=None)
        model_entity = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                model_id))
        model_entity.created_on = invalid_datetime
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            (
                u'[u\'failed validation check for scrubbed_by field check of '
                'AppFeedbackReportModel\', '
                '[u"Entity id %s: based on entity created_on date %s, '
                'expected model AppFeedbackReportModel to have field '
                'scrubbed_by but it doesn\'t exist"]]') % (
                    model_entity.id,
                    utils.get_time_in_millisecs(model_entity.created_on)))
        # We want to suppress the error from the created_on timestamp validation
        # because if this test is run APP_FEEDBACK_REPORT_MAXIMUM_DAYS number
        # of days within the EARLIEST_VALID_DATETIME, it will fail the
        # created_on timestamp validation. This is because the scrubbed_by field
        # validator checks that the scrubbed_by field exists if the created_on
        # timestamp is more than APP_FEEDBACK_REPORT_MAXIMUM_DAYS number of days
        # before the current timestamp, so if the current timestamp is within
        # this number of days from the EARLIEST_VALID_DATETIME, the created_on
        # validation check will always fail.
        validator_class = (
            app_feedback_report_validators.AppFeedbackReportModelValidator)
        with self.swap(
            validator_class, '_validate_created_on_datetime',
            types.MethodType(lambda x, y: True, validator_class)):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)


class AppFeedbackReportTicketModelValidatorTests(test_utils.AuditJobsTestBase):
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    PLATFORM_ANDROID = 'android'
    # The timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615151836)
    REPORT_SUBMITTED_TIMESTAMP_MSEC = utils.get_time_in_millisecs(
        REPORT_SUBMITTED_TIMESTAMP)
    REPORT_ID = '%s.%s.%s' % (
        PLATFORM_ANDROID, int(REPORT_SUBMITTED_TIMESTAMP_MSEC),
        'randomInteger123')
    REPORT_IDS_LIST = [REPORT_ID]
    TICKET_NAME = 'example ticket name'
    REPORT_TYPE_SUGGESTION = 'suggestion'
    CATEGORY_OTHER = 'other'
    PLATFORM_VERSION = '0.1-alpha-abcdef1234'
    COUNTRY_LOCALE_CODE_INDIA = 'in'
    ANDROID_DEVICE_MODEL = 'Pixel 4a'
    ANDROID_SDK_VERSION = 28
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
    ANDROID_REPORT_INFO_SCHEMA_VERSION = 1

    def setUp(self):
        super(AppFeedbackReportTicketModelValidatorTests, self).setUp()

        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)

        self.ticket_id = (
            app_feedback_report_models.AppFeedbackReportTicketModel.create(
                ticket_name=self.TICKET_NAME, github_issue_repo_name=None,
                github_issue_number=None,
                newest_report_timestamp=self.REPORT_SUBMITTED_TIMESTAMP,
                report_ids=self.REPORT_IDS_LIST))
        app_feedback_report_models.AppFeedbackReportModel(
            id=self.REPORT_ID,
            platform=self.PLATFORM_ANDROID,
            ticket_id=self.ticket_id,
            submitted_on=self.REPORT_SUBMITTED_TIMESTAMP,
            report_type=self.REPORT_TYPE_SUGGESTION,
            category=self.CATEGORY_OTHER,
            platform_version=self.PLATFORM_VERSION,
            android_device_country_locale_code=self.COUNTRY_LOCALE_CODE_INDIA,
            android_device_model=self.ANDROID_DEVICE_MODEL,
            android_sdk_version=self.ANDROID_SDK_VERSION,
            entry_point=self.ENTRY_POINT_NAVIGATION_DRAWER,
            text_language_code=self.TEXT_LANGUAGE_CODE_ENGLISH,
            audio_language_code=self.AUDIO_LANGUAGE_CODE_ENGLISH,
            android_report_info=self.ANDROID_REPORT_INFO,
            android_report_info_schema_version=(
                self.ANDROID_REPORT_INFO_SCHEMA_VERSION)
        ).put()

        self.expected_successful_validation_output = [
            u'[u\'fully-validated AppFeedbackReportTicketModel\', 1]']
        self.job_class = (
            prod_validation_jobs.AppFeedbackReportTicketModelAuditOneOffJob)

    def test_standard_model(self):
        self.run_job_and_check_output(
            self.expected_successful_validation_output, sort=False,
            literal_eval=False)

    def test_model_validation_with_invalid_id_fails(self):
        app_feedback_report_models.AppFeedbackReportTicketModel(
            id='invalid_entity_id', ticket_name=self.TICKET_NAME,
            github_issue_repo_name=None, github_issue_number=None,
            archived=False,
            newest_report_timestamp=self.REPORT_SUBMITTED_TIMESTAMP,
            report_ids=self.REPORT_IDS_LIST
        ).put()

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            u'[u\'failed validation check for model id check of '
            'AppFeedbackReportTicketModel\', '
            '[u\'Entity id invalid_entity_id: Entity id does not match regex '
            'pattern\']]')

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_newest_report_greater_than_current_datetime_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.ticket_id))
        model_entity.newest_report_timestamp = (
            datetime.datetime.utcnow() + datetime.timedelta(hours=1))
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for newest_report_timestamp '
                'datetime check of AppFeedbackReportTicketModel\', '
                '[u\'Entity id %s: The newest_report_timestamp field has a '
                'value %s which is greater than the time when the job was '
                'run\']]') % (
                    model_entity.id, model_entity.newest_report_timestamp)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_newest_report_less_than_earliest_datetime_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.ticket_id))
        model_entity.newest_report_timestamp = (
            app_feedback_report_validators.EARLIEST_VALID_DATETIME -
            datetime.timedelta(hours=1))
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for newest_report_timestamp '
                'datetime check of AppFeedbackReportTicketModel\', '
                '[u\'Entity id %s: The newest_report_timestamp field has a '
                'value %s which is less than the earliest possible submission '
                'date\']]') % (
                    model_entity.id, model_entity.newest_report_timestamp)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_with_invalid_external_references_ids_fails(self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.ticket_id))
        model_entity.report_ids = ['invalid_report_id']
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for report_ids field check of '
                'AppFeedbackReportTicketModel\', '
                '[u"Entity id %s: based on field report_ids having value '
                'invalid_report_id, expected model AppFeedbackReportModel'
                ' with id invalid_report_id but it doesn\'t exist"]]') % (
                    model_entity.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_validation_with_deleted_external_references_fails(self):
        report_model_to_delete = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                self.REPORT_ID))
        report_model_to_delete.delete()

        expected_output = [
            (
                u'[u\'failed validation check for report_ids field check of '
                'AppFeedbackReportTicketModel\', '
                '[u"Entity id %s: based on field report_ids having value '
                '%s, expected model AppFeedbackReportModel'
                ' with id %s but it doesn\'t exist"]]') % (
                    self.ticket_id, self.REPORT_ID, self.REPORT_ID)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class AppFeedbackReportStatsModelValidatorTests(test_utils.AuditJobsTestBase):
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    PLATFORM_ANDROID = 'android'
    # Timestamp in sec since epoch for Mar 19 2021 17:10:36 UTC.
    TICKET_CREATION_TIMESTAMP = datetime.datetime.fromtimestamp(1616173836)
    TICKET_CREATION_TIMESTAMP_MSEC = utils.get_time_in_millisecs(
        TICKET_CREATION_TIMESTAMP)
    TICKET_ID = '%s.%s.%s' % (
        'random_hash', int(TICKET_CREATION_TIMESTAMP_MSEC),
        '16CharString1234')
    # Timestamp date in sec since epoch for Mar 19 2021 UTC.
    STATS_DATE = datetime.date.fromtimestamp(1616173836)
    DAILY_STATS = {
        'report_type': {
            'suggestion': 1, 'issue': 1, 'crash': 1}}
    TOTAL_REPORTS_SUBMITTED = 3
    STATS_ID = '%s:%s:%s' % (
        PLATFORM_ANDROID, TICKET_ID, STATS_DATE.isoformat())

    # The timestamp in sec since epoch for Mar 7 2021 21:17:16 UTC.
    REPORT_SUBMITTED_TIMESTAMP = datetime.datetime.fromtimestamp(1615151836)
    REPORT_SUBMITTED_TIMESTAMP_MSEC = utils.get_time_in_millisecs(
        REPORT_SUBMITTED_TIMESTAMP)
    REPORT_ID = '%s.%s.%s' % (
        PLATFORM_ANDROID, int(REPORT_SUBMITTED_TIMESTAMP_MSEC),
        'randomInteger123')

    def setUp(self):
        super(AppFeedbackReportStatsModelValidatorTests, self).setUp()

        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)

        self.entity_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.create(
                platform=self.PLATFORM_ANDROID,
                ticket_id=self.TICKET_ID,
                stats_tracking_date=self.STATS_DATE,
                total_reports_submitted=self.TOTAL_REPORTS_SUBMITTED,
                daily_param_stats=self.DAILY_STATS
            ))
        app_feedback_report_models.AppFeedbackReportTicketModel(
            id=self.TICKET_ID, ticket_name='example ticket',
            github_issue_repo_name=None, github_issue_number=None,
            archived=False,
            newest_report_timestamp=self.REPORT_SUBMITTED_TIMESTAMP,
            report_ids=[self.REPORT_ID]).put()

        self.expected_successful_validation_output = [
            u'[u\'fully-validated AppFeedbackReportStatsModel\', 1]']
        self.job_class = (
            prod_validation_jobs.AppFeedbackReportStatsModelAuditOneOffJob)

    def test_standard_model(self):
        self.run_job_and_check_output(
            self.expected_successful_validation_output, sort=False,
            literal_eval=False)

    def test_model_validation_with_invalid_id_fails(self):
        app_feedback_report_models.AppFeedbackReportStatsModel(
            id='invalid_entity_id',
            ticket_id=self.TICKET_ID,
            platform=self.PLATFORM_ANDROID,
            stats_tracking_date=self.STATS_DATE,
            total_reports_submitted=self.TOTAL_REPORTS_SUBMITTED,
            daily_param_stats=self.DAILY_STATS,
            daily_param_stats_schema_version=(
                feconf.CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION)
        ).put()

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            (
                u'[u\'failed validation check for model id check of '
                'AppFeedbackReportStatsModel\', '
                '[u\'Entity id invalid_entity_id: Entity id does not match '
                'regex pattern\']]'))
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_stats_schema_version_greater_than_current_schema_fails(
            self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                self.entity_id))
        model_entity.daily_param_stats_schema_version = 2
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for report stats schema version '
                'check of AppFeedbackReportStatsModel\', '
                '[u\'Entity id %s: daily stats schema version %s is outside the'
                ' range of supported versions [%s, %s]\']]') % (
                    model_entity.id,
                    model_entity.daily_param_stats_schema_version,
                    feconf.MINIMUM_FEEDBACK_REPORT_STATS_SCHEMA_VERSION,
                    feconf.CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_stats_schema_version_less_than_min_schema_fails(
            self):
        model_entity = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                self.entity_id))
        model_entity.daily_param_stats_schema_version = 0
        model_entity.update_timestamps()
        model_entity.put()

        expected_output = [
            (
                u'[u\'failed validation check for report stats schema version '
                'check of AppFeedbackReportStatsModel\', '
                '[u\'Entity id %s: daily stats schema version %s is outside the'
                ' range of supported versions [%s, %s]\']]') % (
                    model_entity.id,
                    model_entity.daily_param_stats_schema_version,
                    feconf.MINIMUM_FEEDBACK_REPORT_STATS_SCHEMA_VERSION,
                    feconf.CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_stats_tracking_date_less_than_earliest_datetime_fails(self):
        validator_class = app_feedback_report_validators
        invalid_datetime = (
            validator_class.EARLIEST_VALID_DATETIME -
            datetime.timedelta(days=1))
        entity_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.create(
                platform=self.PLATFORM_ANDROID,
                ticket_id=self.TICKET_ID,
                stats_tracking_date=invalid_datetime.date(),
                total_reports_submitted=self.TOTAL_REPORTS_SUBMITTED,
                daily_param_stats=self.DAILY_STATS))
        model_entity = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                entity_id))

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            (
                u'[u\'failed validation check for stats_tracking_date '
                'datetime check of AppFeedbackReportStatsModel\', [u\'Entity '
                'id %s: The stats_tracking_date field has a value %s which '
                'is less than the earliest possible submission date\']]') % (
                    model_entity.id, model_entity.stats_tracking_date))
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_with_invalid_external_references_ids_fails(self):
        entity_id = (
            app_feedback_report_models.AppFeedbackReportStatsModel.create(
                platform=self.PLATFORM_ANDROID,
                ticket_id='invalid_ticket_id',
                stats_tracking_date=self.STATS_DATE,
                total_reports_submitted=self.TOTAL_REPORTS_SUBMITTED,
                daily_param_stats=self.DAILY_STATS))
        model_entity = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                entity_id))

        expected_output = self.expected_successful_validation_output
        expected_output.append(
            (
                u'[u\'failed validation check for ticket_id field check of '
                'AppFeedbackReportStatsModel\', '
                '[u"Entity id %s: based on field ticket_id having value '
                'invalid_ticket_id, expected model AppFeedbackReportTicketModel'
                ' with id invalid_ticket_id but it doesn\'t exist"]]') % (
                    model_entity.id))
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_validation_with_deleted_external_references_fails(self):
        ticket_model_to_delete = (
            app_feedback_report_models.AppFeedbackReportTicketModel.get_by_id(
                self.TICKET_ID))
        ticket_model_to_delete.delete()
        model_entity = (
            app_feedback_report_models.AppFeedbackReportStatsModel.get_by_id(
                self.entity_id))

        expected_output = [
            (
                u'[u\'failed validation check for ticket_id field check of '
                'AppFeedbackReportStatsModel\', '
                '[u"Entity id %s: based on field ticket_id having value '
                '%s, expected model AppFeedbackReportTicketModel'
                ' with id %s but it doesn\'t exist"]]') % (
                    model_entity.id, self.TICKET_ID, self.TICKET_ID)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)
