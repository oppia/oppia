# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for general feedback email services."""

from __future__ import annotations

from unittest import mock

from core import feconf, utils
from core.domain import (
    general_feedback_domain,
    general_feedback_email_services,
    platform_parameter_list,
    user_services,
)
from core.tests import test_utils

SYSTEM_EMAIL_ADDRESS = 'system@example.com'
OPPIA_SITE_URL_FOR_EMAILS = 'https://www.oppia.org'


class GeneralFeedbackEmailServicesUnitTests(test_utils.GenericTestBase):
    """Tests for general feedback email services."""

    def setUp(self) -> None:
        super().setUp()
        self.user = user_services.create_new_user(
            'auth_id',
            'test@example.com',
        )

    def _get_lesson_metadata(
        self,
    ) -> general_feedback_domain.LessonMetadataDict:
        """Returns valid lesson metadata."""
        return {
            'exploration_id': 'exp_id',
            'exploration_version': 1,
            'state_name': 'Introduction',
            'state_index': 0,
            'learner_current_answer': 'answer',
        }

    def _get_lesson_feedback(
        self,
    ) -> general_feedback_domain.LessonFeedback:
        """Returns a lesson feedback domain object."""
        return general_feedback_domain.LessonFeedback(
            feedback_id='feedback_id',
            author_id=self.user.user_id,
            feedback_text='The hint was useful.',
            status=feconf.STATUS_CHOICES_OPEN,
            lesson_metadata=self._get_lesson_metadata(),
            response_list=[],
            unread_response_count=0,
            created_on_msecs=0,
        )

    def _get_platform_feedback(
        self,
        destination_dashboard: str,
        category: str | None = None,
        lesson_metadata: general_feedback_domain.LessonMetadataDict | None = (
            None
        ),
    ) -> general_feedback_domain.PlatformFeedback:
        """Returns a platform feedback domain object."""
        return general_feedback_domain.PlatformFeedback(
            report_id='report_id',
            report_message='The page did not load.',
            source=feconf.SOURCE_APP,
            platform='web',
            destination_dashboard=destination_dashboard,
            status=feconf.STATUS_CHOICES_OPEN,
            include_technical_logs=False,
            created_on_msecs=0,
            page_url='https://www.oppia.org/learn/math',
            category=category,
            lesson_metadata=lesson_metadata,
        )

    def _assert_feedback_email_is_sent(
        self,
        mock_send_email: mock.Mock,
        recipient_id: str,
        email_subject: str,
        recipient_email: str | None = None,
    ) -> str:
        """Asserts that a feedback notification email was sent."""
        expected_kwargs = (
            {'recipient_email': recipient_email}
            if recipient_email is not None
            else {}
        )
        mock_send_email.assert_called_once_with(
            recipient_id,
            feconf.SYSTEM_COMMITTER_ID,
            feconf.EMAIL_INTENT_WEB_USER_FEEDBACK_MESSAGE_NOTIFICATION,
            email_subject,
            mock.ANY,
            SYSTEM_EMAIL_ADDRESS,
            **expected_kwargs,
        )
        return mock_send_email.call_args[0][4]

    @test_utils.set_platform_parameters(
        [
            (
                platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS,
                OPPIA_SITE_URL_FOR_EMAILS,
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                SYSTEM_EMAIL_ADDRESS,
            ),
        ]
    )
    def test_sends_lesson_feedback_submission_email(self) -> None:
        feedback = self._get_lesson_feedback()
        classroom = mock.Mock(feedback_recipient_email='feedback@example.com')
        mock_send_email = mock.Mock()
        mock_get_topic_ids = mock.Mock(return_value=['topic_id'])
        mock_get_classroom = mock.Mock(return_value=classroom)

        topic_ids_swap = self.swap(
            general_feedback_email_services.topic_services,
            'get_topic_ids_for_exploration_id',
            mock_get_topic_ids,
        )
        classroom_swap = self.swap(
            general_feedback_email_services.classroom_config_services,
            'get_classroom_by_topic_id',
            mock_get_classroom,
        )
        send_email_swap = self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        )

        with topic_ids_swap, classroom_swap, send_email_swap:
            general_feedback_email_services.send_feedback_submission_email(
                feedback
            )

        mock_get_topic_ids.assert_called_once_with('exp_id')
        mock_get_classroom.assert_called_once_with('topic_id')
        email_body = self._assert_feedback_email_is_sent(
            mock_send_email,
            'lesson-creation-team',
            'New Lesson Feedback Suggestion submitted for exp_id on Oppia',
            recipient_email='feedback@example.com',
        )
        self.assertIn('The hint was useful.', email_body)
        self.assertIn(
            '%s/create/exp_id#/feedback/lesson_feedback/feedback_id'
            % OPPIA_SITE_URL_FOR_EMAILS,
            email_body,
        )

    @test_utils.set_platform_parameters(
        [
            (
                platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS,
                OPPIA_SITE_URL_FOR_EMAILS,
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                SYSTEM_EMAIL_ADDRESS,
            ),
        ]
    )
    def test_sends_curriculum_platform_feedback_submission_email(self) -> None:
        feedback = self._get_platform_feedback(
            feconf.DESTINATION_CURRICULUM,
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self._get_lesson_metadata(),
        )
        mock_send_email = mock.Mock()
        mock_get_topic_ids = mock.Mock(return_value=[])

        topic_ids_swap = self.swap(
            general_feedback_email_services.topic_services,
            'get_topic_ids_for_exploration_id',
            mock_get_topic_ids,
        )
        send_email_swap = self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        )

        with topic_ids_swap, send_email_swap:
            general_feedback_email_services.send_feedback_submission_email(
                feedback
            )

        mock_get_topic_ids.assert_called_once_with('exp_id')
        email_body = self._assert_feedback_email_is_sent(
            mock_send_email,
            'lesson-creation-team',
            'New Lesson Feedback Report submitted for exp_id on Oppia',
            recipient_email=feconf.DEFAULT_CLASSROOM_FEEDBACK_RECIPIENT_EMAIL,
        )
        self.assertIn('The page did not load.', email_body)
        self.assertIn('<b>Category:</b> typo', email_body)
        self.assertIn(
            '%s/create/exp_id#/feedback/lesson_issue/report_id'
            % OPPIA_SITE_URL_FOR_EMAILS,
            email_body,
        )

    @test_utils.set_platform_parameters(
        [
            (
                platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS,
                OPPIA_SITE_URL_FOR_EMAILS,
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                SYSTEM_EMAIL_ADDRESS,
            ),
        ]
    )
    def test_sends_technical_external_platform_feedback_email(self) -> None:
        feedback = self._get_platform_feedback(
            feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
        )
        mock_send_email = mock.Mock()

        with self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        ):
            general_feedback_email_services.send_feedback_submission_email(
                feedback
            )

        email_body = self._assert_feedback_email_is_sent(
            mock_send_email,
            'web-leap-leads',
            'New Technical Feedback Report submitted for Oppia',
            recipient_email=feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM_EMAIL,
        )
        self.assertIn('Hi LEAP Team!', email_body)
        self.assertIn('The page did not load.', email_body)
        self.assertIn('https://www.oppia.org/learn/math', email_body)
        self.assertIn(
            '%s/technical-feedback-dashboard/%s/report_id'
            % (
                OPPIA_SITE_URL_FOR_EMAILS,
                feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM,
            ),
            email_body,
        )

    @test_utils.set_platform_parameters(
        [
            (
                platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS,
                OPPIA_SITE_URL_FOR_EMAILS,
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                SYSTEM_EMAIL_ADDRESS,
            ),
        ]
    )
    def test_sends_technical_internal_platform_feedback_email(self) -> None:
        feedback = self._get_platform_feedback(
            feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM,
            category='Incorrect answer',
            lesson_metadata=self._get_lesson_metadata(),
        )
        mock_send_email = mock.Mock()

        with self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        ):
            general_feedback_email_services.send_feedback_submission_email(
                feedback
            )

        email_body = self._assert_feedback_email_is_sent(
            mock_send_email,
            'web-core-leads',
            'New Technical Feedback Report submitted for Oppia',
            recipient_email=feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM_EMAIL,
        )
        self.assertIn('Hi CORE Team!', email_body)
        self.assertIn(
            'categorized as <b>Incorrect answer</b> for this exploration '
            '<b>exp_id</b>',
            email_body,
        )
        self.assertIn(
            '%s/technical-feedback-dashboard/%s/report_id'
            % (
                OPPIA_SITE_URL_FOR_EMAILS,
                feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM,
            ),
            email_body,
        )

    def test_submission_email_with_invalid_dashboard_raises_error(
        self,
    ) -> None:
        feedback = self._get_platform_feedback('invalid-dashboard')
        mock_send_email = mock.Mock()

        with self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        ):
            with self.assertRaisesRegex(
                utils.InvalidInputException,
                'Invalid destination dashboard: invalid-dashboard',
            ):
                general_feedback_email_services.send_feedback_submission_email(
                    feedback
                )

        mock_send_email.assert_not_called()

    @test_utils.set_platform_parameters(
        [
            (
                platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS,
                OPPIA_SITE_URL_FOR_EMAILS,
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                SYSTEM_EMAIL_ADDRESS,
            ),
        ]
    )
    def test_sends_feedback_status_change_email(self) -> None:
        feedback = self._get_lesson_feedback()
        feedback.status = feconf.STATUS_CHOICES_FIXED
        mock_send_email = mock.Mock()

        username_swap = self.swap(
            general_feedback_email_services.user_services,
            'get_username',
            mock.Mock(return_value='learner'),
        )
        send_email_swap = self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        )

        with username_swap, send_email_swap:
            general_feedback_email_services.send_feedback_status_change_email(
                feedback, self.user.user_id
            )

        email_body = self._assert_feedback_email_is_sent(
            mock_send_email,
            self.user.user_id,
            'Your Lesson Feedback Status Has Been Updated for exp_id on Oppia',
        )
        self.assertIn('Hi <b>learner</b>!', email_body)
        self.assertIn('updated to <b>fixed</b>', email_body)
        self.assertIn(
            '%s/learner-dashboard?active_tab=my-suggestions&feedback_id='
            'feedback_id' % OPPIA_SITE_URL_FOR_EMAILS,
            email_body,
        )

    @test_utils.set_platform_parameters(
        [
            (
                platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS,
                OPPIA_SITE_URL_FOR_EMAILS,
            ),
            (
                platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS,
                SYSTEM_EMAIL_ADDRESS,
            ),
        ]
    )
    def test_sends_feedback_reply_email(self) -> None:
        feedback = self._get_lesson_feedback()
        mock_send_email = mock.Mock()

        username_swap = self.swap(
            general_feedback_email_services.user_services,
            'get_username',
            mock.Mock(return_value='learner'),
        )
        send_email_swap = self.swap(
            general_feedback_email_services.email_manager,
            '_send_email',
            mock_send_email,
        )

        with username_swap, send_email_swap:
            general_feedback_email_services.send_feedback_reply_email(
                feedback, 'Thanks for the suggestion.', self.user.user_id
            )

        email_body = self._assert_feedback_email_is_sent(
            mock_send_email,
            self.user.user_id,
            'A Creator Has Responded to Your Feedback on exp_id',
        )
        self.assertIn('Hi <b>learner</b>!', email_body)
        self.assertIn('Thanks for the suggestion.', email_body)
        self.assertIn(
            '%s/learner-dashboard?active_tab=my-suggestions&feedback_id='
            'feedback_id' % OPPIA_SITE_URL_FOR_EMAILS,
            email_body,
        )
