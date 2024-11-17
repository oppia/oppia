# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for the cron jobs."""

from __future__ import annotations

import datetime
from unittest import mock

from core import feconf
from core.constants import constants
from core.domain import beam_job_services
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry
from core.domain import question_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import taskqueue_services
from core.domain import translation_domain
from core.domain import user_services
from core.jobs.batch_jobs import blog_post_search_indexing_jobs
from core.jobs.batch_jobs import exp_recommendation_computation_jobs
from core.jobs.batch_jobs import exp_search_indexing_jobs
from core.jobs.batch_jobs import user_stats_computation_jobs
from core.platform import models
from core.tests import test_utils

import main

from typing import Dict, Final, List, Set, Union
import webtest

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_feedback_report_models
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models
    from mypy_imports import user_models

(
    app_feedback_report_models, exp_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.Names.APP_FEEDBACK_REPORT, models.Names.EXPLORATION,
    models.Names.SUGGESTION, models.Names.USER
])


class CronJobTests(test_utils.GenericTestBase):

    FIVE_WEEKS: Final = datetime.timedelta(weeks=5)
    NINE_WEEKS: Final = datetime.timedelta(weeks=9)
    FOURTEEN_WEEKS: Final = datetime.timedelta(weeks=14)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.email_subjects: List[str] = []
        self.email_bodies: List[str] = []
        def _mock_send_mail_to_admin(
            email_subject: str, email_body: str
        ) -> None:
            """Mocks email_manager.send_mail_to_admin() as it's not possible to
            send mail with self.testapp_swap, i.e with the URLs defined in
            main.
            """
            self.email_subjects.append(email_subject)
            self.email_bodies.append(email_body)

        self.send_mail_to_admin_swap = self.swap(
            email_manager, 'send_mail_to_admin', _mock_send_mail_to_admin)

        self.task_status = 'Not Started'
        def _mock_taskqueue_service_defer(
            unused_function_id: str, unused_queue_name: str
        ) -> None:
            """Mocks taskqueue_services.defer() so that it can be checked
            if the method is being invoked or not.
            """
            self.task_status = 'Started'

        self.taskqueue_service_defer_swap = self.swap(
            taskqueue_services, 'defer', _mock_taskqueue_service_defer)

    def test_run_cron_to_hard_delete_models_marked_as_deleted(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        completed_activities_model = user_models.CompletedActivitiesModel(
            id=admin_user_id,
            exploration_ids=[],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            last_updated=datetime.datetime.utcnow() - self.NINE_WEEKS,
            deleted=True
        )
        completed_activities_model.update_timestamps(
            update_last_updated_time=False)
        completed_activities_model.put()

        with self.testapp_swap:
            self.get_json('/cron/models/cleanup')

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(admin_user_id))

    def test_run_cron_to_hard_delete_versioned_models_marked_as_deleted(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        with self.mock_datetime_utcnow(
            datetime.datetime.utcnow() - self.NINE_WEEKS):
            self.save_new_default_exploration('exp_id', admin_user_id)
            exp_services.delete_exploration(admin_user_id, 'exp_id')

        self.assertIsNotNone(exp_models.ExplorationModel.get_by_id('exp_id'))

        with self.testapp_swap:
            self.get_json('/cron/models/cleanup')

        self.assertIsNone(exp_models.ExplorationModel.get_by_id('exp_id'))

    def test_run_cron_to_mark_old_models_as_deleted(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        user_query_model = user_models.UserQueryModel(
            id='query_id',
            user_ids=[],
            submitter_id=admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_PROCESSING,
            last_updated=datetime.datetime.utcnow() - self.FIVE_WEEKS
        )
        user_query_model.update_timestamps(update_last_updated_time=False)
        user_query_model.put()

        with self.testapp_swap:
            self.get_json('/cron/models/cleanup')

        self.assertTrue(user_query_model.get_by_id('query_id').deleted)

    def test_run_cron_to_scrub_app_feedback_reports_scrubs_reports(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        report_timestamp = (
            datetime.datetime.utcnow() - self.FOURTEEN_WEEKS)
        report_submitted_timestamp = report_timestamp
        ticket_creation_timestamp = datetime.datetime.fromtimestamp(1616173836)
        android_report_info = {
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
            'account_is_profile_admin': False
        }
        report_id = (
            app_feedback_report_models.AppFeedbackReportModel.generate_id(
                'android', report_submitted_timestamp))
        report_model = (
            app_feedback_report_models.AppFeedbackReportModel(
                id=report_id,
                platform='android',
                ticket_id='%s.%s.%s' % (
                    'random_hash',
                    ticket_creation_timestamp.second,
                    '16CharString1234'),
                submitted_on=report_submitted_timestamp,
                local_timezone_offset_hrs=0,
                report_type='suggestion',
                category='other_suggestion',
                platform_version='0.1-alpha-abcdef1234',
                android_device_country_locale_code='in',
                android_device_model='Pixel 4a',
                android_sdk_version=23,
                entry_point='navigation_drawer',
                text_language_code='en',
                audio_language_code='en',
                android_report_info=android_report_info,
                android_report_info_schema_version=1))
        report_model.created_on = report_timestamp
        report_model.update_timestamps(update_last_updated_time=False)
        report_model.put()

        with self.testapp_swap:
            self.get_html_response(
                '/cron/app_feedback_report/scrub_expiring_reports')

        scrubbed_model = (
            app_feedback_report_models.AppFeedbackReportModel.get_by_id(
                report_id))
        scrubbed_report_info = scrubbed_model.android_report_info
        self.assertEqual(
            scrubbed_model.scrubbed_by,
            feconf.APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID)
        self.assertEqual(
            scrubbed_report_info['user_feedback_other_text_input'], '')
        self.assertEqual(
            scrubbed_report_info['event_logs'], [])
        self.assertEqual(
            scrubbed_report_info['logcat_logs'], [])

    def test_cron_user_deletion_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        self.assertEqual(self.task_status, 'Not Started')
        with self.testapp_swap, self.taskqueue_service_defer_swap:
            self.get_json('/cron/users/user_deletion')
            self.assertEqual(self.task_status, 'Started')
        self.logout()

    def test_cron_fully_complete_user_deletion_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        self.assertEqual(self.task_status, 'Not Started')
        with self.testapp_swap, self.taskqueue_service_defer_swap:
            self.get_json('/cron/users/fully_complete_user_deletion')
            self.assertEqual(self.task_status, 'Started')
            self.logout()


class CronMailReviewersContributorDashboardSuggestionsHandlerTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    language_code = 'en'
    default_translation_html = '<p>Sample translation</p>'
    AUTHOR_USERNAME: Final = 'author'
    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_USERNAME: Final = 'reviewer'
    REVIEWER_EMAIL: Final = 'reviewer@community.org'

    def _create_translation_suggestion(
        self
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': self.language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': self.default_translation_html,
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description')

    def _assert_reviewable_suggestion_email_infos_are_equal(
        self,
        reviewable_suggestion_email_info: (
            suggestion_registry.ReviewableSuggestionEmailInfo
        ),
        expected_reviewable_suggestion_email_info: (
            suggestion_registry.ReviewableSuggestionEmailInfo
        )
    ) -> None:
        """Asserts that the reviewable suggestion email info is equal to the
        expected reviewable suggestion email info.
        """
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_type,
            expected_reviewable_suggestion_email_info.suggestion_type)
        self.assertEqual(
            reviewable_suggestion_email_info.language_code,
            expected_reviewable_suggestion_email_info.language_code)
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_content,
            expected_reviewable_suggestion_email_info.suggestion_content)
        self.assertEqual(
            reviewable_suggestion_email_info.submission_datetime,
            expected_reviewable_suggestion_email_info.submission_datetime)

    def _mock_send_contributor_dashboard_reviewers_emails(
        self,
        reviewer_ids: List[str],
        reviewers_suggestion_email_infos: List[
            List[suggestion_registry.ReviewableSuggestionEmailInfo]
        ]
    ) -> None:
        """Mocks
        email_manager.send_mail_to_notify_contributor_dashboard_reviewers as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.reviewer_ids = reviewer_ids
        self.reviewers_suggestion_email_infos = reviewers_suggestion_email_infos

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_id, True, False, False, False)
        self.save_new_valid_exploration(self.target_id, self.author_id)
        # Give reviewer rights to review translations in the given language
        # code.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, self.language_code)
        # Create a translation suggestion so that the reviewer has something
        # to be notified about.
        translation_suggestion = self._create_translation_suggestion()
        self.expected_reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))

        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.reviewers_suggestion_email_infos = []
        self.reviewer_ids = []

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, False), # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_sending_reviewer_emails_is_not_enabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_json(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 0)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 0)

        self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, False),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, False), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, False) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_sending_emails_is_not_enabled(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_json(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 0)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 0)

        self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_sent_to_reviewer_if_sending_reviewer_emails_is_enabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_json(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 1)
        self.assertEqual(self.reviewer_ids[0], self.reviewer_id)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 1)
        self.assertEqual(len(self.reviewers_suggestion_email_infos[0]), 1)
        self._assert_reviewable_suggestion_email_infos_are_equal(
            self.reviewers_suggestion_email_infos[0][0],
            self.expected_reviewable_suggestion_email_info)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_reviewer_ids_is_empty(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        user_services.remove_translation_review_rights_in_language(
            self.reviewer_id, self.language_code)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_json(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 0)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 0)

        self.logout()


class CronMailReviewerNewSuggestionsHandlerTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    language_code = 'en'
    default_translation_html = '<p>Sample translation</p>'
    AUTHOR_USERNAME: Final = 'author'
    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_USERNAME: Final = 'reviewer'
    REVIEWER_EMAIL: Final = 'reviewer@community.org'

    def _create_translation_suggestion_for_en_language(
        self
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': self.language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': self.default_translation_html,
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description')

    def _create_translation_suggestion_for_hi_language(
        self
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': self.default_translation_html,
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description')

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, False) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_sending_reviewer_emails_is_not_enabled(self) -> None: # pylint: disable=line-too-long
        # Here we use object because we need to spy on
        # send_reviewer_notifications method and assert
        # if it's being called.
        with mock.patch.object(
            email_manager, 'send_reviewer_notifications',
            new_callable=mock.Mock
        ) as mock_send:
            self.login(
                self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

            with self.testapp_swap:
                self.get_json(
                    '/cron/mail/reviewers/new_cont'
                    'ributor_dashboard_suggestions')

            mock_send.assert_not_called()
            self.logout()

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.signup(self.AUTHOR_EMAIL, self.AUTHOR_USERNAME)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, self.REVIEWER_USERNAME)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        user_services.update_email_preferences(
            self.reviewer_id, True, False, False, False)
        self.save_new_valid_exploration(self.target_id, self.author_id)
        # Give reviewer rights to review translations in the given language
        # code.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_id, self.language_code)
        # Create a translation suggestion so that the reviewer has something
        # to be notified about.
        translation_suggestion = (
            self._create_translation_suggestion_for_en_language())

        self.expected_reviewable_suggestion_email_info = (
            suggestion_services
            .create_reviewable_suggestion_email_info_from_suggestion(
                translation_suggestion))

        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, False),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, False), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, False) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_sending_emails_is_not_enabled(self) -> None:
        # Here we use object because we need to spy on
        # send_reviewer_notifications method and assert
        # if it's being called.
        with mock.patch.object(
            email_manager, 'send_reviewer_notifications',
            new_callable=mock.Mock
        ) as mock_send:
            self.login(
                self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

            with self.testapp_swap:
                self.get_json(
                    '/cron/mail/reviewers/new_contr'
                    'ibutor_dashboard_suggestions')

            mock_send.assert_not_called()
            self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_sent_to_reviewer_if_sending_reviewer_emails_is_enabled(self) -> None: # pylint: disable=line-too-long
        # Here we use object because we need to spy on
        # send_reviewer_notifications method and assert
        # if it's being called.
        with mock.patch.object(
            email_manager, 'send_reviewer_notifications',
            new_callable=mock.Mock
        ) as mock_send:
            self.login(
                self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

            with self.testapp_swap:
                self.get_json(
                    '/cron/mail/reviewers/new_cont'
                    'ributor_dashboard_suggestions')
            mock_send.assert_called_once_with(
                {'en': [self.reviewer_id]},
                {'en': [mock.ANY]}
            )

            self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_reviewer_ids_is_empty(self) -> None:
        # Here we use object because we need to spy on
        # send_reviewer_notifications method and assert
        # if it's being called.
        with mock.patch.object(
            email_manager, 'send_reviewer_notifications',
            new_callable=mock.Mock
        ) as mock_send:
            self.login(
                self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

            user_services.remove_translation_review_rights_in_language(
                self.reviewer_id, self.language_code)
            user_services.remove_translation_review_rights_in_language(
                self.reviewer_id, 'hi'
            )
            with self.testapp_swap:
                self.get_json(
                    '/cron/mail/reviewers/new_contr'
                    'ibutor_dashboard_suggestions')
            mock_send.assert_called_once_with(
                {'en': []},
                mock.ANY
            )
            self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_sent_to_reviewers_successfully(self) -> None:
        # Here we use object because we need to spy on
        # send_reviewer_notifications method and assert
        # if it's being called.
        with mock.patch.object(
            email_manager, 'send_reviewer_notifications',
            new_callable=mock.Mock) as mock_send:
            self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

            with self.testapp_swap:
                self.get_json(
                    '/cron/mail/reviewers/new_contr'
                    'ibutor_dashboard_suggestions')

            mock_send.assert_called_once_with(
                {'en': [self.reviewer_id]},
                {'en': [mock.ANY]}
            )
            self.logout()


class CronMailAdminContributorDashboardBottlenecksHandlerTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    skill_id = 'skill_123456'
    language_code = 'en'
    AUTHOR_EMAIL: Final = 'author@example.com'

    def _create_translation_suggestion_with_language_code(
        self, language_code: str
    ) -> suggestion_registry.BaseSuggestion:
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': 'content_0',
            'language_code': language_code,
            'content_html': feconf.DEFAULT_STATE_CONTENT_STR,
            'translation_html': '<p>This is the translated content.</p>',
            'data_format': 'html'
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            self.target_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_translation_change_dict,
            'test description'
        )

    def _create_question_suggestion(self) -> suggestion_registry.BaseSuggestion:
        """Creates a question suggestion."""
        content_id_generator = translation_domain.ContentIdGenerator()
        add_question_change_dict: Dict[
            str, Union[str, question_domain.QuestionDict, float]
        ] = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': constants.DEFAULT_LANGUAGE_CODE,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index),
                'version': 44,
                'id': ''
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        return suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            self.skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description'
        )

    def _assert_reviewable_suggestion_email_infos_are_equal(
        self,
        reviewable_suggestion_email_info: (
            suggestion_registry.ReviewableSuggestionEmailInfo
        ),
        expected_reviewable_suggestion_email_info: (
           suggestion_registry.ReviewableSuggestionEmailInfo
        )
    ) -> None:
        """Asserts that the reviewable suggestion email info is equal to the
        expected reviewable suggestion email info.
        """
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_type,
            expected_reviewable_suggestion_email_info.suggestion_type)
        self.assertEqual(
            reviewable_suggestion_email_info.language_code,
            expected_reviewable_suggestion_email_info.language_code)
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_content,
            expected_reviewable_suggestion_email_info.suggestion_content)
        self.assertEqual(
            reviewable_suggestion_email_info.submission_datetime,
            expected_reviewable_suggestion_email_info.submission_datetime)

    def mock_send_mail_to_notify_admins_that_reviewers_are_needed(
        self,
        admin_ids: List[str],
        translation_admin_ids: List[str],
        question_admin_ids: List[str],
        suggestion_types_needing_reviewers: Dict[str, Set[str]]
    ) -> None:
        """Mocks
        email_manager.send_mail_to_notify_admins_that_reviewers_are_needed as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.admin_ids = admin_ids
        self.translation_admin_ids = translation_admin_ids
        self.question_admin_ids = question_admin_ids
        self.suggestion_types_needing_reviewers = (
            suggestion_types_needing_reviewers)

    def _mock_send_mail_to_notify_admins_suggestions_waiting(
        self,
        admin_ids: List[str],
        translation_admin_ids: List[str],
        question_admin_ids: List[str],
        reviewable_suggestion_email_infos: List[
            suggestion_registry.ReviewableSuggestionEmailInfo
        ]
    ) -> None:
        """Mocks
        email_manager.send_mail_to_notify_admins_suggestions_waiting_long as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.admin_ids = admin_ids
        self.translation_admin_ids = translation_admin_ids
        self.question_admin_ids = question_admin_ids
        self.reviewable_suggestion_email_infos = (
            reviewable_suggestion_email_infos)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        # This sets the role of the user to admin.
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.save_new_valid_exploration(self.target_id, self.author_id)
        self.save_new_skill(self.skill_id, self.author_id)
        suggestion_1 = (
            self._create_translation_suggestion_with_language_code('en'))
        suggestion_2 = (
            self._create_translation_suggestion_with_language_code('fr'))
        suggestion_3 = self._create_question_suggestion()
        self.expected_reviewable_suggestion_email_infos = [
            (
                suggestion_services
                .create_reviewable_suggestion_email_info_from_suggestion(
                    suggestion
                )
            ) for suggestion in [suggestion_1, suggestion_2, suggestion_3]
        ]
        self.expected_suggestion_types_needing_reviewers = {
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT: {
                'en', 'fr'},
            feconf.SUGGESTION_TYPE_ADD_QUESTION: set()
        }

        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.admin_ids = []
        self.suggestion_types_needing_reviewers = {}
        self.reviewable_suggestion_email_infos = []
        self.translation_admin_ids = []
        self.question_admin_ids = []

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, False),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, True), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_sending_emails_is_disabled(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                with self.swap(
                    email_manager,
                    'send_mail_to_notify_admins_suggestions_waiting_long',
                    self._mock_send_mail_to_notify_admins_suggestions_waiting):
                    with self.swap(
                        suggestion_models,
                        'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
                        self.get_json(
                            '/cron/mail/admins/contributor_dashboard'
                            '_bottlenecks')

        self.assertEqual(len(self.admin_ids), 0)
        self.assertEqual(len(self.reviewable_suggestion_email_infos), 0)
        self.assertDictEqual(self.suggestion_types_needing_reviewers, {})

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, False), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, False) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_notifying_admins_reviewers_needed_is_disabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                self.get_json(
                    '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 0)
        self.assertDictEqual(self.suggestion_types_needing_reviewers, {})

        self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, False), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, False) # pylint: disable=line-too-long
        ]
    )
    def test_email_not_sent_if_notifying_admins_about_suggestions_is_disabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                self.get_json(
                    '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 0)
        self.assertDictEqual(self.suggestion_types_needing_reviewers, {})

        self.logout()

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, True), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_sent_to_admin_if_sending_admin_need_reviewers_emails_enabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                self.get_json(
                    '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 1)
        self.assertEqual(self.admin_ids[0], self.admin_id)
        self.assertDictEqual(
            self.suggestion_types_needing_reviewers,
            self.expected_suggestion_types_needing_reviewers)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'admin'),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, 'dummy_footer'),
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE, True), # pylint: disable=line-too-long
            (platform_parameter_list.ParamName.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW, True) # pylint: disable=line-too-long
        ]
    )
    def test_email_sent_to_admin_if_notifying_admins_about_suggestions_enabled(
        self
    ) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        platform_parameter_registry.Registry.update_platform_parameter(
            (
                platform_parameter_list.ParamName.
                ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW.value
            ),
            self.admin_id,
            'Updating value.',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Web']
                            ],
                        }
                    ],
                    'value_when_matched': True
                })
            ],
            False
        )

        with self.testapp_swap:
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0
            ):
                with self.swap(
                    email_manager,
                    'send_mail_to_notify_admins_suggestions_waiting_long',
                    self._mock_send_mail_to_notify_admins_suggestions_waiting):
                    self.get_json(
                        '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 1)
        self.assertEqual(self.admin_ids[0], self.admin_id)
        self.assertEqual(len(self.reviewable_suggestion_email_infos), 3)
        self._assert_reviewable_suggestion_email_infos_are_equal(
            self.reviewable_suggestion_email_infos[0],
            self.expected_reviewable_suggestion_email_infos[0])
        self._assert_reviewable_suggestion_email_infos_are_equal(
            self.reviewable_suggestion_email_infos[1],
            self.expected_reviewable_suggestion_email_infos[1])
        self._assert_reviewable_suggestion_email_infos_are_equal(
            self.reviewable_suggestion_email_infos[2],
            self.expected_reviewable_suggestion_email_infos[2])

    def test_cron_exploration_recommendations_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        swap_with_checks = self.swap_with_checks(
            beam_job_services, 'run_beam_job', lambda **_: None,
            expected_kwargs=[{
                'job_class': (
                    exp_recommendation_computation_jobs
                    .ComputeExplorationRecommendationsJob),
            }]
        )
        with swap_with_checks, self.testapp_swap:
            self.get_html_response('/cron/explorations/recommendations')

    def test_cron_activity_search_rank_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        swap_with_checks = self.swap_with_checks(
            beam_job_services, 'run_beam_job', lambda **_: None,
            expected_kwargs=[{
                'job_class': (
                    exp_search_indexing_jobs.IndexExplorationsInSearchJob),
            }]
        )
        with swap_with_checks, self.testapp_swap:
            self.get_html_response('/cron/explorations/search_rank')

    def test_cron_blog_post_search_rank_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        swap_with_checks = self.swap_with_checks(
            beam_job_services, 'run_beam_job', lambda **_: None,
            expected_kwargs=[{
                'job_class': (
                    blog_post_search_indexing_jobs.IndexBlogPostsInSearchJob),
            }]
        )
        with swap_with_checks, self.testapp_swap:
            self.get_html_response('/cron/blog_posts/search_rank')

    def test_cron_dashboard_stats_handler(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        swap_with_checks = self.swap_with_checks(
            beam_job_services, 'run_beam_job', lambda **_: None,
            expected_kwargs=[{
                'job_class': (
                    user_stats_computation_jobs.CollectWeeklyDashboardStatsJob),
            }]
        )
        with swap_with_checks, self.testapp_swap:
            self.get_html_response('/cron/users/dashboard_stats')


class CronMailChapterPublicationsNotificationsHandlerTests(
    test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.story_publication_timeliness_1 = (
            story_domain.StoryPublicationTimeliness(
            'story_1', 'Story', 'Topic', ['Chapter 1'], ['Chapter 2']))
        self.story_publication_timeliness_2 = (
            story_domain.StoryPublicationTimeliness(
            'story_2', 'Story 2', 'Topic', ['Chapter 3'], ['Chapter 4']))

        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.curriculum_admin_ids: List[str] = []
        self.chapter_notifications_list: List[
            story_domain.StoryPublicationTimeliness] = []

    def _mock_send_reminder_mail_to_notify_curriculum_admins(
        self,
        curriculum_admin_ids: List[str],
        chapter_notifications_list: List[
            story_domain.StoryPublicationTimeliness]) -> None:
        """Mocks
        email_manager.send_reminder_mail_to_notify_curriculum_admins as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.curriculum_admin_ids = curriculum_admin_ids
        self.chapter_notifications_list = chapter_notifications_list

    def _mock_get_chapter_notifications_stories_list(self) -> List[
        story_domain.StoryPublicationTimeliness]:
        """Mocks
        story_services.get_chapter_notifications_stories_list.
        """

        chapter_notifications_stories_list: List[
            story_domain.StoryPublicationTimeliness] = [
                self.story_publication_timeliness_1,
                self.story_publication_timeliness_2]
        return chapter_notifications_stories_list

    def test_email_not_sent_if_sending_emails_is_not_enabled(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_reminder_mail_to_notify_curriculum_admins',
                self._mock_send_reminder_mail_to_notify_curriculum_admins):
                self.get_json(
                    '/cron/mail/curriculum_admins/'
                    'chapter_publication_notfications')

        self.assertEqual(len(self.curriculum_admin_ids), 0)
        self.assertEqual(len(self.chapter_notifications_list), 0)

        self.logout()

    @test_utils.set_platform_parameters(
        [(platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True)]
    )
    def test_email_sent_if_sending_emails_is_enabled(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

        with self.testapp_swap:
            with self.swap(
                email_manager,
                'send_reminder_mail_to_notify_curriculum_admins',
                self._mock_send_reminder_mail_to_notify_curriculum_admins):
                with self.swap(
                    story_services, 'get_chapter_notifications_stories_list',
                    self._mock_get_chapter_notifications_stories_list):
                    self.get_json(
                        '/cron/mail/curriculum_admins/'
                        'chapter_publication_notfications')

        self.assertEqual(len(self.curriculum_admin_ids), 1)
        self.assertEqual(self.curriculum_admin_ids[0], self.admin_id)

        self.assertEqual(len(self.chapter_notifications_list), 2)
        self.assertEqual(
            self.chapter_notifications_list[0],
            self.story_publication_timeliness_1)
        self.assertEqual(
            self.chapter_notifications_list[1],
            self.story_publication_timeliness_2)

        self.logout()
