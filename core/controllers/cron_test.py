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

from __future__ import absolute_import
from __future__ import unicode_literals

import datetime

from constants import constants
from core.domain import config_services
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import question_domain
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import main

import webtest

(
    exp_models, job_models,
    suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.job,
    models.NAMES.suggestion, models.NAMES.user
])


class CronJobTests(test_utils.GenericTestBase):

    FIVE_WEEKS = datetime.timedelta(weeks=5)
    NINE_WEEKS = datetime.timedelta(weeks=9)

    def setUp(self):
        super(CronJobTests, self).setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.email_subjects = []
        self.email_bodies = []
        def _mock_send_mail_to_admin(email_subject, email_body):
            """Mocks email_manager.send_mail_to_admin() as it's not possible to
            send mail with self.testapp_swap, i.e with the URLs defined in
            main.
            """
            self.email_subjects.append(email_subject)
            self.email_bodies.append(email_body)

        self.send_mail_to_admin_swap = self.swap(
            email_manager, 'send_mail_to_admin', _mock_send_mail_to_admin)

    def test_run_cron_to_hard_delete_models_marked_as_deleted(self):
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
            self.get_html_response('/cron/models/cleanup')

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(admin_user_id))

    def test_run_cron_to_hard_delete_versioned_models_marked_as_deleted(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        with self.mock_datetime_utcnow(
            datetime.datetime.utcnow() - self.NINE_WEEKS):
            self.save_new_default_exploration('exp_id', admin_user_id)
            exp_services.delete_exploration(admin_user_id, 'exp_id')

        self.assertIsNotNone(exp_models.ExplorationModel.get_by_id('exp_id'))

        with self.testapp_swap:
            self.get_html_response('/cron/models/cleanup')

        self.assertIsNone(exp_models.ExplorationModel.get_by_id('exp_id'))

    def test_run_cron_to_mark_old_models_as_deleted(self):
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
            self.get_html_response('/cron/models/cleanup')

        self.assertTrue(user_query_model.get_by_id('query_id').deleted)


class CronMailReviewersContributorDashboardSuggestionsHandlerTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    language_code = 'en'
    default_translation_html = '<p>Sample translation</p>'
    AUTHOR_USERNAME = 'author'
    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_USERNAME = 'reviewer'
    REVIEWER_EMAIL = 'reviewer@community.org'

    def _create_translation_suggestion(self):
        """Creates a translation suggestion."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': feconf.DEFAULT_NEW_STATE_CONTENT_ID,
            'language_code': self.language_code,
            'content_html': feconf.DEFAULT_INIT_STATE_CONTENT_STR,
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
            self, reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info):
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
            self, reviewer_ids, reviewers_suggestion_email_infos):
        """Mocks
        email_manager.send_mail_to_notify_contributor_dashboard_reviewers as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.reviewer_ids = reviewer_ids
        self.reviewers_suggestion_email_infos = reviewers_suggestion_email_infos

    def setUp(self):
        super(
            CronMailReviewersContributorDashboardSuggestionsHandlerTests,
            self).setUp()
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

        self.can_send_emails = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_emails = self.swap(feconf, 'CAN_SEND_EMAILS', False)
        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.reviewers_suggestion_email_infos = []
        self.reviewer_ids = []

    def test_email_not_sent_if_sending_reviewer_emails_is_not_enabled(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'contributor_dashboard_reviewer_emails_is_enabled', False)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_html_response(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 0)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 0)

        self.logout()

    def test_email_not_sent_if_sending_emails_is_not_enabled(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'contributor_dashboard_reviewer_emails_is_enabled', True)

        with self.cannot_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_html_response(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 0)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 0)

        self.logout()

    def test_email_sent_to_reviewer_if_sending_reviewer_emails_is_enabled(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'contributor_dashboard_reviewer_emails_is_enabled', True)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_html_response(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 1)
        self.assertEqual(self.reviewer_ids[0], self.reviewer_id)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 1)
        self.assertEqual(len(self.reviewers_suggestion_email_infos[0]), 1)
        self._assert_reviewable_suggestion_email_infos_are_equal(
            self.reviewers_suggestion_email_infos[0][0],
            self.expected_reviewable_suggestion_email_info)

    def test_email_not_sent_if_reviewer_ids_is_empty(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'contributor_dashboard_reviewer_emails_is_enabled', True)
        user_services.remove_translation_review_rights_in_language(
            self.reviewer_id, self.language_code)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_contributor_dashboard_reviewers',
                self._mock_send_contributor_dashboard_reviewers_emails):
                self.get_html_response(
                    '/cron/mail/reviewers/contributor_dashboard_suggestions')

        self.assertEqual(len(self.reviewer_ids), 0)
        self.assertEqual(len(self.reviewers_suggestion_email_infos), 0)

        self.logout()


class CronMailAdminContributorDashboardBottlenecksHandlerTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    skill_id = 'skill_123456'
    language_code = 'en'
    AUTHOR_EMAIL = 'author@example.com'

    def _create_translation_suggestion_with_language_code(self, language_code):
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'content_id': feconf.DEFAULT_NEW_STATE_CONTENT_ID,
            'language_code': language_code,
            'content_html': feconf.DEFAULT_INIT_STATE_CONTENT_STR,
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

    def _create_question_suggestion(self):
        """Creates a question suggestion."""
        add_question_change_dict = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': constants.DEFAULT_LANGUAGE_CODE,
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
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
            self, reviewable_suggestion_email_info,
            expected_reviewable_suggestion_email_info):
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
            self, admin_ids, suggestion_types_needing_reviewers):
        """Mocks
        email_manager.send_mail_to_notify_admins_that_reviewers_are_needed as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.admin_ids = admin_ids
        self.suggestion_types_needing_reviewers = (
            suggestion_types_needing_reviewers)

    def _mock_send_mail_to_notify_admins_suggestions_waiting(
            self, admin_ids, reviewable_suggestion_email_infos):
        """Mocks
        email_manager.send_mail_to_notify_admins_suggestions_waiting_long as
        it's not possible to send mail with self.testapp_swap, i.e with the URLs
        defined in main.
        """
        self.admin_ids = admin_ids
        self.reviewable_suggestion_email_infos = (
            reviewable_suggestion_email_infos)

    def setUp(self):
        super(
            CronMailAdminContributorDashboardBottlenecksHandlerTests,
            self).setUp()
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
            feconf.SUGGESTION_TYPE_ADD_QUESTION: {}
        }

        self.can_send_emails = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        self.cannot_send_emails = self.swap(feconf, 'CAN_SEND_EMAILS', False)
        self.testapp_swap = self.swap(
            self, 'testapp', webtest.TestApp(main.app_without_context))

        self.admin_ids = []
        self.suggestion_types_needing_reviewers = {}
        self.reviewable_suggestion_email_infos = []

    def test_email_not_sent_if_sending_emails_is_disabled(self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'enable_admin_notifications_for_reviewer_shortage', True)
        config_services.set_property(
            'committer_id',
            'notify_admins_suggestions_waiting_too_long_is_enabled', True)

        with self.cannot_send_emails, self.testapp_swap:
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
                        self.get_html_response(
                            '/cron/mail/admins/contributor_dashboard'
                            '_bottlenecks')

        self.assertEqual(len(self.admin_ids), 0)
        self.assertEqual(len(self.reviewable_suggestion_email_infos), 0)
        self.assertDictEqual(self.suggestion_types_needing_reviewers, {})

    def test_email_not_sent_if_notifying_admins_reviewers_needed_is_disabled(
            self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'enable_admin_notifications_for_reviewer_shortage', False)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                self.get_html_response(
                    '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 0)
        self.assertDictEqual(self.suggestion_types_needing_reviewers, {})

        self.logout()

    def test_email_not_sent_if_notifying_admins_about_suggestions_is_disabled(
            self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'notify_admins_suggestions_waiting_too_long_is_enabled', False)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                self.get_html_response(
                    '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 0)
        self.assertDictEqual(self.suggestion_types_needing_reviewers, {})

        self.logout()

    def test_email_sent_to_admin_if_sending_admin_need_reviewers_emails_enabled(
            self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'enable_admin_notifications_for_reviewer_shortage', True)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                email_manager,
                'send_mail_to_notify_admins_that_reviewers_are_needed',
                self.mock_send_mail_to_notify_admins_that_reviewers_are_needed):
                self.get_html_response(
                    '/cron/mail/admins/contributor_dashboard_bottlenecks')

        self.assertEqual(len(self.admin_ids), 1)
        self.assertEqual(self.admin_ids[0], self.admin_id)
        self.assertDictEqual(
            self.suggestion_types_needing_reviewers,
            self.expected_suggestion_types_needing_reviewers)

    def test_email_sent_to_admin_if_notifying_admins_about_suggestions_enabled(
            self):
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        config_services.set_property(
            'committer_id',
            'notify_admins_suggestions_waiting_too_long_is_enabled', True)

        with self.can_send_emails, self.testapp_swap:
            with self.swap(
                suggestion_models,
                'SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS', 0):
                with self.swap(
                    email_manager,
                    'send_mail_to_notify_admins_suggestions_waiting_long',
                    self._mock_send_mail_to_notify_admins_suggestions_waiting):
                    self.get_html_response(
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
