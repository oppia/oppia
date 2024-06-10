# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Tasks Email Handler."""

from __future__ import annotations

from core import feconf
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import platform_parameter_list
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])


class TasksTests(test_utils.EmailTestBase):

    USER_A_EMAIL: Final = 'a@example.com'
    USER_B_EMAIL: Final = 'b@example.com'
    EMAIL_FOOTER: Final = (
        'You can change your email preferences via the Preferences page.'
    )

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.MODERATOR_EMAIL, 'moderator')
        self.moderator_id = self.get_user_id_from_email(
            self.MODERATOR_EMAIL)
        self.signup(self.USER_A_EMAIL, 'userA')
        self.user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, 'userB')
        self.user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_TRANSACTIONAL_EMAILS', True)
        self.THREAD_ID = 'exploration.exp1.thread_1'

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, EMAIL_FOOTER),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'sender')
        ]
    )
    def test_email_sent_when_feedback_in_thread(self) -> None:
        # Create feedback thread.
        with self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

            # Create another message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')

            # Check that there are two messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 2)

            # Check that there are no feedback emails sent to Editor.
            mock_email_messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            self.assertEqual(len(mock_email_messages), 0)

            # Send task and subsequent email to Editor.
            self.process_and_flush_pending_tasks()
            mock_email_messages = self._get_sent_email_messages(
                self.EDITOR_EMAIL)
            expected_message = (
                'Hi editor,\n\nYou\'ve received 2 new messages on your'
                ' Oppia explorations:\n- Title:\n- some text\n- user b message'
                '\nYou can view and reply to your messages from your dashboard.'
                '\n\nThanks, and happy teaching!\n\nBest wishes,\nThe Oppia'
                ' Team\n\nYou can change your email preferences via the '
                'Preferences page.')

            # Assert that the message is correct.
            self.assertEqual(len(mock_email_messages), 1)
            self.assertEqual(mock_email_messages[0].body, expected_message)

            # Create another message that is len = 201.
            user_b_message = 'B' * 201
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, user_b_message)

            # Check that there are three messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 3)

            # Send task and subsequent email to Editor.
            self.process_and_flush_pending_tasks()
            mock_email_messages = (
                self._get_sent_email_messages(self.EDITOR_EMAIL)
            )

            # What is expected in the email body.
            expected_message = (
                'Hi editor,\n\nYou\'ve received a new message on your Oppia'
                ' explorations:\n- Title:\n- %s...\nYou can'
                ' view and reply to your messages from your dashboard.\n\nThank'
                's, and happy teaching!\n\nBest wishes,\nThe Oppia Team\n\nYou'
                ' can change your email preferences via the Preferences page.'
                ) % ('B' * 200)

            # Check that greater than 200 word message is sent
            # and has correct message.

            self.assertEqual(len(mock_email_messages), 2)
            self.assertEqual(mock_email_messages[1].body, expected_message)

            # Create another message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b another message')

            # Pops feedback message references.
            feedback_services.pop_feedback_message_references_transactional(
                self.editor_id, 0)

            # Send task and subsequent email to Editor.
            self.process_and_flush_pending_tasks()
            mock_email_messages = (
                self._get_sent_email_messages(self.EDITOR_EMAIL)
            )

            # Check that there are three messages.
            self.assertEqual(len(mock_email_messages), 3)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, EMAIL_FOOTER),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'sender')
        ]
    )
    def test_email_is_sent_when_contributor_achieves_a_new_rank(self) -> None:
        """Tests ContributorDashboardAchievementEmailHandler functionality."""

        user_id = self.user_id_a
        user_services.update_email_preferences(
            user_id, True, False, False, False)

        payload = {
            'contributor_user_id': user_id,
            'contribution_type': feconf.CONTRIBUTION_TYPE_TRANSLATION,
            'contribution_sub_type': (
                feconf.CONTRIBUTION_SUBTYPE_ACCEPTANCE),
            'language_code': 'hi',
            'rank_name': 'Initial Contributor',
        }
        taskqueue_services.enqueue_task(
            feconf
            .TASK_URL_CONTRIBUTOR_DASHBOARD_ACHIEVEMENT_NOTIFICATION_EMAILS,
            payload, 0)
        self.process_and_flush_pending_tasks()

        # Check that user A received message.
        messages = self._get_sent_email_messages(
            self.USER_A_EMAIL)
        self.assertEqual(len(messages), 1)

        # Check that user A received correct message.
        expected_email_subject = 'Oppia Translator Rank Achievement!'
        expected_email_html_body = (
            'Hi userA,<br><br>'
            'This is to let you know that you have successfully achieved '
            'the Initial Contributor rank for submitting translations in '
            'हिन्दी (Hindi). Your efforts help Oppia grow better every '
            'day and support students around the world.<br><br>'
            'You can check all the achievements you earned in the '
            '<a href="http://localhost:8181/contributor-dashboard">'
            'Contributor Dashboard</a>.<br><br>'
            'Best wishes and we hope you can continue to contribute!'
            '<br><br>'
            'The Oppia Contributor Dashboard Team')
        self.assertEqual(messages[0].html, expected_email_html_body)
        self.assertEqual(messages[0].subject, expected_email_subject)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, EMAIL_FOOTER),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'sender')
        ]
    )
    def test_instant_feedback_reply_email(self) -> None:
        """Tests Instant feedback message handler."""
        with self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id
            # Create reply message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')
            # Get all messages in the thread.
            messages = feedback_services.get_messages(thread_id)
            # Make sure there are only 2 messages in thread.
            self.assertEqual(len(messages), 2)

            # Ensure that user A has no emails sent yet.
            mock_email_messages = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(mock_email_messages), 0)

            # Invoke InstantFeedbackMessageEmail which sends
            # instantFeedbackMessage.
            self.process_and_flush_pending_tasks()

            # Ensure that user A has an email sent now.
            mock_email_messages = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(mock_email_messages), 1)

            # Ensure that user A has right email sent to them.
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject" on'
                ' Title:\n- userB: user b message\n(You received'
                ' this message because you are a participant in'
                ' this thread.)\n\nBest wishes,\nThe Oppia'
                ' team\n\nYou can change your email preferences'
                ' via the Preferences page.')
            self.assertEqual(mock_email_messages[0].body, expected_message)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, EMAIL_FOOTER),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'sender')
        ]
    )
    def test_email_sent_when_status_changed(self) -> None:
        """Tests Feedback Thread Status Change Email Handler."""
        with self.can_send_feedback_email_ctx:
            # Create thread.
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                self.user_id_a, 'a subject', 'some text')
            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

            # User B creates message with status change.
            feedback_services.create_message(
                thread_id, self.user_id_b,
                feedback_models.STATUS_CHOICES_FIXED,
                None, 'user b message')

            # Ensure user A has no messages sent to him yet.
            messages = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages), 0)

            # Invoke feedback status change email handler.
            self.process_and_flush_pending_tasks()

            # Check that user A has 2 emails sent to him.
            # 1 instant feedback message email and 1 status change.
            messages = self._get_sent_email_messages(
                self.USER_A_EMAIL)
            self.assertEqual(len(messages), 2)

            # Check that user A has right email sent to him.
            expected_message = (
                'Hi userA,\n\nNew update to thread "a subject" on Title:\n-'
                ' userB: changed status from open to fixed\n(You received'
                ' this message because you are a participant in this thread'
                '.)\n\nBest wishes,\nThe Oppia team\n\nYou can change your'
                ' email preferences via the Preferences page.')
            status_change_email = messages[0]
            self.assertEqual(status_change_email.body, expected_message)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, EMAIL_FOOTER),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'sender')
        ]
    )
    def test_email_sent_to_moderator_after_flag(self) -> None:
        """Tests Flagged Exploration Email Handler."""

        def fake_get_user_ids_by_role(_: str) -> List[str]:
            """Replaces get_user_ids_by_role for testing purposes."""
            return [self.moderator_id]
        get_moderator_id_as_list = self.swap(
            user_services, 'get_user_ids_by_role',
            fake_get_user_ids_by_role)

        with self.can_send_feedback_email_ctx:
            with get_moderator_id_as_list:

                # Create thread.
                feedback_services.create_thread(
                    feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                    self.user_id_a, 'bad subject', 'bad text')

                # User B reports thread, sends email.
                payload = {
                    'exploration_id': self.exploration.id,
                    'report_text': 'He said a bad word :-( ',
                    'reporter_id': self.user_id_b}
                taskqueue_services.enqueue_task(
                    feconf.TASK_URL_FLAG_EXPLORATION_EMAILS,
                    payload, 0)
                # Ensure moderator has no messages sent to him yet.
                messages = self._get_sent_email_messages(
                    self.MODERATOR_EMAIL)
                self.assertEqual(len(messages), 0)

                # Invoke Flag Exploration Email Handler.
                self.process_and_flush_pending_tasks()

                # Ensure moderator has 1 email now.
                messages = self._get_sent_email_messages(
                    self.MODERATOR_EMAIL)
                self.assertEqual(len(messages), 1)

                # Ensure moderator has received correct email.
                expected_message = (
                    'Hello Moderator,\nuserB has flagged exploration "Title"'
                    ' on the following grounds: \nHe said a bad word :-( '
                    ' .\nYou can modify the exploration by clicking here'
                    '.\n\nThanks!\n- The Oppia Team\n\nYou can change your'
                    ' email preferences via the Preferences page.')
                self.assertEqual(messages[0].body, expected_message)

    def test_deferred_tasks_handler_raises_correct_exceptions(self) -> None:
        incorrect_function_identifier = 'incorrect_function_id'
        taskqueue_services.defer(
            incorrect_function_identifier,
            taskqueue_services.QUEUE_NAME_DEFAULT)

        raises_incorrect_function_id_exception = self.assertRaisesRegex(
            Exception,
            'The function id, %s, is not valid.' %
            incorrect_function_identifier)

        with raises_incorrect_function_id_exception:
            self.process_and_flush_pending_tasks()

        headers = {
            # Need to convert to bytes since test app doesn't allow unicode.
            'X-Appengine-QueueName': b'queue',
            'X-Appengine-TaskName': b'None',
            'X-AppEngine-Fake-Is-Admin': b'1'
        }
        csrf_token = self.get_new_csrf_token()

        self.post_task(
            feconf.TASK_URL_DEFERRED, {}, headers,
            csrf_token=csrf_token, expect_errors=True, expected_status_int=500)

    def test_deferred_tasks_handler_handles_tasks_correctly(self) -> None:
        exp_id = '15'
        self.login(self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        exp_services.load_demo(exp_id)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        exp_version = exploration.version
        state_name = 'Home'
        state_stats_mapping = {
            state_name: stats_domain.StateStats.create_default()
        }
        exploration_stats = stats_domain.ExplorationStats(
            exp_id, exp_version, 0, 0, 0, 0, 0, 0,
            state_stats_mapping)
        stats_services.create_stats_model(exploration_stats)

        aggregated_stats = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }
        self.post_json('/explorehandler/stats_events/%s' % (exp_id), {
            'aggregated_stats': aggregated_stats,
            'exp_version': exp_version})
        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_STATS), 1)
        self.process_and_flush_pending_tasks()

        # Check that the models are updated.
        updated_exploration_stats = stats_services.get_exploration_stats_by_id(
            exp_id, exp_version)
        assert updated_exploration_stats is not None
        self.assertEqual(updated_exploration_stats.num_starts_v2, 1)
        self.assertEqual(updated_exploration_stats.num_actual_starts_v2, 1)
        self.assertEqual(updated_exploration_stats.num_completions_v2, 1)
        self.assertEqual(
            updated_exploration_stats.state_stats_mapping[
                state_name].total_hit_count_v2,
            1
        )
