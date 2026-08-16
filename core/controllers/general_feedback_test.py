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

"""Tests for lesson feedback and platform issue report controllers."""

from __future__ import annotations

from unittest import mock

from core import feconf
from core.domain import (
    captcha_services,
    exp_fetchers,
    fs_services,
    general_feedback_domain,
    general_feedback_services,
)
from core.tests import test_utils

from typing import Optional


class FeedbackSubmitHandlerTests(test_utils.GenericTestBase):
    """Tests for FeedbackSubmitHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

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

    def test_submit_lesson_feedback_successfully(self) -> None:
        feedback = general_feedback_domain.LessonFeedback(
            feedback_id='feedback_id',
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            status='open',
            lesson_metadata=self._get_lesson_metadata(),
            response_list=[],
            unread_response_count=0,
            created_on_msecs=0,
        )
        create_lesson_feedback_mock = mock.Mock(return_value=feedback)

        with self.login_context(self.VIEWER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            with self.swap(
                general_feedback_services,
                'create_lesson_feedback',
                create_lesson_feedback_mock,
            ):
                response = self.post_json(
                    feconf.LESSON_FEEDBACK_URL,
                    {
                        'feedback_text': 'Helpful lesson.',
                        'lesson_metadata': self._get_lesson_metadata(),
                    },
                    csrf_token=csrf_token,
                    expected_status_int=200,
                )

        self.assertEqual(response, {'id': 'feedback_id'})
        create_lesson_feedback_mock.assert_called_once_with(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )

    def test_submit_lesson_feedback_rejects_logged_out_user(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            feconf.LESSON_FEEDBACK_URL,
            {
                'feedback_text': 'Helpful lesson.',
                'lesson_metadata': self._get_lesson_metadata(),
            },
            csrf_token=csrf_token,
            expected_status_int=401,
        )

        self.assertEqual(
            response['error'], 'You must be logged in to submit feedback.'
        )

    def test_submit_lesson_feedback_rejects_missing_metadata(self) -> None:

        with self.login_context(self.VIEWER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                feconf.LESSON_FEEDBACK_URL,
                {
                    'feedback_text': 'Helpful lesson.',
                    'lesson_metadata': None,
                },
                csrf_token=csrf_token,
                expected_status_int=400,
            )

        self.assertIn(
            'Missing key in handler args: lesson_metadata',
            response['error'],
        )


class MyFeedbackHandlerTests(test_utils.GenericTestBase):
    """Tests for learner-facing feedback handlers."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.signup('other@example.com', 'otheruser')
        self.other_user_id = self.get_user_id_from_email('other@example.com')

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

    def test_learner_can_list_own_feedback(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )
        general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata(),
        )

        with self.login_context(self.VIEWER_EMAIL):
            response = self.get_json(feconf.MY_FEEDBACK_URL)

        self.assertEqual(len(response['summaries']), 1)
        self.assertEqual(response['summaries'][0]['id'], feedback.id)
        self.assertIsNone(response['next_cursor'])
        self.assertFalse(response['more'])

    def test_learner_can_get_own_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )

        with self.login_context(self.VIEWER_EMAIL):
            response = self.get_json(
                '%s/%s' % (feconf.MY_FEEDBACK_URL, feedback.id)
            )

        self.assertEqual(response, feedback.to_learner_dict())
        self.assertNotIn('author_id', response)

    def test_learner_can_post_follow_up_feedback(self) -> None:
        parent_feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )
        current_exploration = mock.Mock(version=7)
        get_exploration_by_id_mock = mock.Mock(return_value=current_exploration)

        with self.login_context(self.VIEWER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            with self.swap(
                exp_fetchers,
                'get_exploration_by_id',
                get_exploration_by_id_mock,
            ):
                response = self.post_json(
                    '%s/%s' % (feconf.MY_FEEDBACK_URL, parent_feedback.id),
                    {'feedback_text': 'Follow-up feedback.'},
                    csrf_token=csrf_token,
                )

        summaries = general_feedback_services.get_learner_feedback_summaries(
            self.viewer_id
        )[0]
        child_feedback_id = [
            summary['id']
            for summary in summaries
            if summary['feedback_text_preview'] == 'Follow-up feedback.'
        ][0]
        child_feedback = general_feedback_services.get_learner_feedback(
            child_feedback_id, self.viewer_id
        )

        self.assertEqual(response, {'success': True})
        self.assertIsNotNone(child_feedback)
        assert child_feedback is not None
        self.assertEqual(child_feedback.parent_feedback_id, parent_feedback.id)
        self.assertEqual(
            child_feedback.lesson_metadata,
            {
                'exploration_id': 'exp_id',
                'exploration_version': 7,
                'state_name': 'Introduction',
                'state_index': 0,
                'learner_current_answer': 'answer',
            },
        )
        get_exploration_by_id_mock.assert_called_once_with(
            'exp_id', strict=False
        )

    def test_learner_cannot_get_other_user_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata(),
        )

        with self.login_context(self.VIEWER_EMAIL):
            self.get_json(
                '%s/%s' % (feconf.MY_FEEDBACK_URL, feedback.id),
                expected_status_int=404,
            )

    def test_learner_cannot_post_follow_up_to_other_user_feedback(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata(),
        )

        with self.login_context(self.VIEWER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '%s/%s' % (feconf.MY_FEEDBACK_URL, feedback.id),
                {'feedback_text': 'Follow-up feedback.'},
                csrf_token=csrf_token,
                expected_status_int=404,
            )

    def test_learner_cannot_post_follow_up_when_exploration_is_missing(
        self,
    ) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )
        get_exploration_by_id_mock = mock.Mock(return_value=None)

        with self.login_context(self.VIEWER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            with self.swap(
                exp_fetchers,
                'get_exploration_by_id',
                get_exploration_by_id_mock,
            ):
                response = self.post_json(
                    '%s/%s' % (feconf.MY_FEEDBACK_URL, feedback.id),
                    {'feedback_text': 'Follow-up feedback.'},
                    csrf_token=csrf_token,
                    expected_status_int=404,
                )

        self.assertIn('Could not find the resource', response['error'])
        get_exploration_by_id_mock.assert_called_once_with(
            'exp_id', strict=False
        )

    def test_logged_out_user_cannot_list_feedback(self) -> None:
        response = self.get_json(
            feconf.MY_FEEDBACK_URL, expected_status_int=401
        )

        self.assertEqual(
            response['error'], 'You must be logged in to submit feedback.'
        )

    def test_logged_out_user_cannot_post_follow_up_feedback(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            '%s/%s' % (feconf.MY_FEEDBACK_URL, feedback.id),
            {'feedback_text': 'Follow-up feedback.'},
            csrf_token=csrf_token,
            expected_status_int=401,
        )

        self.assertEqual(
            response['error'], 'You must be logged in to submit feedback.'
        )

    def test_logged_out_user_cannot_get_user_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata(),
        )
        response = self.get_json(
            '%s/%s' % (feconf.MY_FEEDBACK_URL, feedback.id),
            expected_status_int=401,
        )

        self.assertEqual(
            response['error'], 'You must be logged in to view feedback.'
        )


class PlatformFeedbackSubmitHandlerTests(test_utils.GenericTestBase):
    """Tests for PlatformFeedbackSubmitHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def _get_lesson_metadata(
        self,
    ) -> general_feedback_domain.LessonMetadataDict:
        """Returns valid lesson metadata."""
        return {
            'exploration_id': 'exp_id',
            'exploration_version': 1,
            'state_name': 'Introduction',
            'state_index': 0,
            'learner_current_answer': None,
        }

    def _get_report(
        self,
        report_id: str,
        source: str,
        page_url: str,
        category: Optional[str],
        lesson_metadata: Optional[general_feedback_domain.LessonMetadataDict],
    ) -> general_feedback_domain.PlatformFeedback:
        """Returns a PlatformFeedback domain object."""
        return general_feedback_domain.PlatformFeedback(
            report_id=report_id,
            report_message='The card image is broken.',
            source=source,
            platform='web',
            destination_dashboard=feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM,
            status='open',
            category=category,
            lesson_metadata=lesson_metadata,
            include_technical_logs=False,
            created_on_msecs=0,
            page_url=page_url,
        )

    def test_submit_lesson_issue_report_with_payload_wrapper(self) -> None:
        report = self._get_report(
            'report_id',
            'lesson',
            'https://oppia.org/exp1',
            'broken_layout_or_image',
            self._get_lesson_metadata(),
        )
        create_platform_report_mock = mock.Mock(return_value=report)
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ), self.swap(
            general_feedback_services,
            'create_platform_report',
            create_platform_report_mock,
        ):
            response = self.post_json(
                feconf.PLATFORM_FEEDBACK_URL,
                {
                    'source': 'lesson',
                    'report_message': 'The card image is broken.',
                    'page_url': 'https://oppia.org/exp1',
                    'category': 'broken_layout_or_image',
                    'lesson_metadata': self._get_lesson_metadata(),
                    'include_technical_logs': False,
                    'session_info': None,
                    'screenshot_filename': None,
                    'screenshot_file': None,
                    'captcha_token': 'captcha_token',
                },
                csrf_token=csrf_token,
                expected_status_int=200,
            )

        self.assertEqual(response, {'id': 'report_id'})
        create_platform_report_mock.assert_called_once_with(
            feedback_text='The card image is broken.',
            source='lesson',
            page_url='https://oppia.org/exp1',
            category='broken_layout_or_image',
            lesson_metadata=self._get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

    def test_logged_in_submitter_does_not_need_captcha_token(self) -> None:
        report = self._get_report(
            'report_id',
            'lesson',
            'https://oppia.org/exp1',
            'broken_layout_or_image',
            self._get_lesson_metadata(),
        )
        create_platform_report_mock = mock.Mock(return_value=report)

        with self.login_context(self.VIEWER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            with self.swap(
                general_feedback_services,
                'create_platform_report',
                create_platform_report_mock,
            ):
                response = self.post_json(
                    feconf.PLATFORM_FEEDBACK_URL,
                    {
                        'source': 'lesson',
                        'report_message': 'The card image is broken.',
                        'page_url': 'https://oppia.org/exp1',
                        'category': 'broken_layout_or_image',
                        'lesson_metadata': self._get_lesson_metadata(),
                        'include_technical_logs': False,
                        'session_info': None,
                        'screenshot_filename': None,
                        'screenshot_file': None,
                        'captcha_token': None,
                    },
                    csrf_token=csrf_token,
                    expected_status_int=200,
                )

        self.assertEqual(response, {'id': 'report_id'})
        create_platform_report_mock.assert_called_once()

    def test_submit_report_rejects_missing_captcha_token(self) -> None:
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', False
        ):
            response = self.post_json(
                feconf.PLATFORM_FEEDBACK_URL,
                {
                    'source': 'lesson',
                    'report_message': 'The card image is broken.',
                    'page_url': 'https://oppia.org/exp1',
                    'category': 'broken_layout_or_image',
                    'lesson_metadata': self._get_lesson_metadata(),
                    'include_technical_logs': False,
                    'session_info': None,
                    'screenshot_filename': None,
                    'screenshot_file': None,
                    'captcha_token': None,
                },
                csrf_token=csrf_token,
                expected_status_int=400,
            )

        self.assertEqual(
            response['error'], 'Captcha token is required for logged-out users.'
        )

    def test_submit_feedback_rejects_invalid_captcha_token(self) -> None:
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', False
        ):
            response = self.post_json(
                feconf.PLATFORM_FEEDBACK_URL,
                {
                    'source': 'lesson',
                    'report_message': 'The card image is broken.',
                    'page_url': 'https://oppia.org/exp1',
                    'category': 'broken_layout_or_image',
                    'lesson_metadata': self._get_lesson_metadata(),
                    'include_technical_logs': False,
                    'session_info': None,
                    'screenshot_filename': None,
                    'screenshot_file': None,
                    'captcha_token': 'invalid_token',
                },
                csrf_token=csrf_token,
                expected_status_int=400,
            )

        self.assertEqual(response['error'], 'Invalid captcha token.')

    def test_submit_lesson_issue_report_allows_null_category(self) -> None:
        report = self._get_report(
            'report_id',
            'lesson',
            'https://oppia.org/exp1',
            None,
            self._get_lesson_metadata(),
        )
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            captcha_services, 'verify_turnstile_token', True
        ), self.swap(
            general_feedback_services,
            'create_platform_report',
            mock.Mock(return_value=report),
        ):
            response = self.post_json(
                feconf.PLATFORM_FEEDBACK_URL,
                {
                    'source': 'lesson',
                    'report_message': 'Something is wrong.',
                    'page_url': 'https://oppia.org/exp1',
                    'category': None,
                    'lesson_metadata': self._get_lesson_metadata(),
                    'include_technical_logs': False,
                    'session_info': None,
                    'screenshot_filename': None,
                    'screenshot_file': None,
                    'captcha_token': 'captcha_token',
                },
                csrf_token=csrf_token,
                expected_status_int=200,
            )

        self.assertEqual(response, {'id': 'report_id'})

    def test_submit_lesson_issue_report_rejects_missing_metadata(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            feconf.PLATFORM_FEEDBACK_URL,
            {
                'source': 'lesson',
                'report_message': 'Something is wrong.',
                'page_url': 'https://oppia.org/exp1',
                'category': 'other_or_not_sure',
                'lesson_metadata': None,
                'include_technical_logs': False,
                'session_info': None,
                'screenshot_filename': None,
                'screenshot_file': None,
            },
            csrf_token=csrf_token,
            expected_status_int=400,
        )

        self.assertEqual(
            response['error'],
            'lesson_metadata is required for lesson reports.',
        )

    def test_submit_site_issue_report_rejects_metadata(self) -> None:
        csrf_token = self.get_new_csrf_token()

        response = self.post_json(
            feconf.PLATFORM_FEEDBACK_URL,
            {
                'source': 'app',
                'report_message': 'The page is broken.',
                'page_url': 'https://oppia.org/exp1',
                'category': None,
                'lesson_metadata': self._get_lesson_metadata(),
                'include_technical_logs': False,
                'session_info': None,
                'screenshot_filename': None,
                'screenshot_file': None,
            },
            csrf_token=csrf_token,
            expected_status_int=400,
        )

        self.assertEqual(
            response['error'],
            'lesson_metadata must be omitted for site reports.',
        )

    def test_submit_issue_report_with_screenshot_successfully(self) -> None:
        report = self._get_report(
            'report_id',
            'lesson',
            'https://oppia.org/exp1',
            'broken_layout_or_image',
            self._get_lesson_metadata(),
        )
        validate_and_save_image_mock = mock.Mock()
        create_platform_report_mock = mock.Mock(return_value=report)
        csrf_token = self.get_new_csrf_token()

        with (
            self.swap_to_always_return(
                captcha_services,
                'verify_turnstile_token',
                True,
            ),
            self.swap(
                fs_services,
                'validate_and_save_image',
                validate_and_save_image_mock,
            ),
            self.swap(
                general_feedback_services,
                'create_platform_report',
                create_platform_report_mock,
            ),
        ):
            response = self.post_json(
                feconf.PLATFORM_FEEDBACK_URL,
                {
                    'source': 'lesson',
                    'report_message': 'The card image is broken.',
                    'page_url': 'https://oppia.org/exp1',
                    'category': 'broken_layout_or_image',
                    'lesson_metadata': self._get_lesson_metadata(),
                    'include_technical_logs': False,
                    'session_info': None,
                    'screenshot_filename': 'feedback.png',
                    'screenshot_file': 'aGVsbG8=',
                    'captcha_token': 'captcha_token',
                },
                csrf_token=csrf_token,
                expected_status_int=200,
            )

        self.assertEqual(response, {'id': 'report_id'})
        validate_and_save_image_mock.assert_called_once()
        self.assertEqual(
            create_platform_report_mock.call_args.kwargs['screenshot_filename'],
            'feedback.png',
        )
        self.assertIsNotNone(
            create_platform_report_mock.call_args.kwargs['screenshot_entity_id']
        )

    def test_get_captcha_config(self) -> None:
        with self.swap_to_always_return(
            captcha_services, 'get_turnstile_site_key', 'site-key'
        ):
            response = self.get_json(feconf.GENERAL_FEEDBACK_CAPTCHA_CONFIG_URL)

        self.assertEqual(response, {'site_key': 'site-key'})


class PlatformFeedbackListHandlerTests(test_utils.GenericTestBase):
    """Tests for PlatformFeedbackListHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration('exp_id', self.owner_id)

        self.signup(self.TECH_LEAD_EMAIL, self.TECH_LEAD_USERNAME)
        self.add_user_role(
            self.TECH_LEAD_USERNAME,
            feconf.ROLE_ID_TECH_TEAM_LEAD,
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
            'learner_current_answer': None,
        }

    def test_creator_can_list_feedback_for_owned_exploration(self) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            page_url='https://oppia.org/learn',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self._get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json('/platform-feedback/curriculum/exp_id')

        self.assertEqual(len(response['summaries']), 1)
        self.assertEqual(response['summaries'][0]['id'], report.id)
        self.assertEqual(
            response['summaries'][0]['report_message_preview'],
            'There is a typo.',
        )
        self.assertIsNone(response['next_cursor'])
        self.assertFalse(response['more'])

    def test_tech_lead_can_list_technical_feedback(self) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='The donate page is broken.',
            source='app',
            page_url='https://oppia.org/donate',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.TECH_LEAD_EMAIL):
            response = self.get_json(
                '/platform-feedback/technical/tech-external'
            )

        self.assertEqual(len(response['summaries']), 1)
        self.assertEqual(response['summaries'][0]['id'], report.id)

    def test_invalid_dashboard_fails_to_list_feedback(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            self.get_json(
                '/platform-feedback/invalid-dashboard/exp_id',
                expected_status_int=400,
            )

    def test_invalid_technical_dashboard_id_fails_to_list_feedback(
        self,
    ) -> None:
        with self.login_context(self.TECH_LEAD_EMAIL):
            self.get_json(
                '/platform-feedback/technical/invalid-id',
                expected_status_int=400,
            )


class LessonFeedbackDetailHandlerTests(test_utils.GenericTestBase):
    """Tests for LessonFeedbackDetailHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration('exp_id', self.owner_id)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def _get_lesson_metadata(
        self,
    ) -> general_feedback_domain.LessonMetadataDict:
        """Returns valid lesson metadata."""
        return {
            'exploration_id': 'exp_id',
            'exploration_version': 1,
            'state_name': 'Introduction',
            'state_index': 0,
            'learner_current_answer': None,
        }

    def test_creator_can_get_lesson_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json('/feedback/exp_id/%s' % feedback.id)

        self.assertEqual(response, feedback.to_dict())

    def test_creator_can_update_status_and_reply_to_lesson_feedback(
        self,
    ) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata(),
        )

        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/feedback/exp_id/%s' % feedback.id,
                {
                    'status': feconf.STATUS_CHOICES_FIXED,
                    'reply_text': 'Thanks, this is fixed.',
                },
                csrf_token=csrf_token,
                expected_status_int=200,
            )

        updated_feedback = general_feedback_services.get_lesson_feedback(
            feedback.id
        )
        self.assertEqual(response, {'success': True})
        self.assertIsNotNone(updated_feedback)
        assert updated_feedback is not None
        self.assertEqual(updated_feedback.status, feconf.STATUS_CHOICES_FIXED)
        self.assertEqual(updated_feedback.unread_response_count, 1)
        self.assertEqual(
            updated_feedback.response_list[0]['response_text'],
            'Thanks, this is fixed.',
        )

    def test_creator_cannot_update_missing_lesson_feedback(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/feedback/exp_id/missing_feedback',
                {'status': feconf.STATUS_CHOICES_FIXED},
                csrf_token=csrf_token,
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/feedback/exp_id/missing_feedback.',
        )

    def test_creator_cannot_update_lesson_feedback_for_different_exploration(
        self,
    ) -> None:
        self.save_new_valid_exploration('other_exp_id', self.owner_id)
        lesson_metadata = self._get_lesson_metadata()
        lesson_metadata['exploration_id'] = 'other_exp_id'
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.viewer_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=lesson_metadata,
        )

        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/feedback/exp_id/%s' % feedback.id,
                {'status': feconf.STATUS_CHOICES_FIXED},
                csrf_token=csrf_token,
                expected_status_int=404,
            )


class PlatformFeedbackDetailHandlerTests(test_utils.GenericTestBase):
    """Tests for PlatformFeedbackDetailHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration('exp_id', self.owner_id)

    def _get_lesson_metadata(
        self,
    ) -> general_feedback_domain.LessonMetadataDict:
        """Returns valid lesson metadata."""
        return {
            'exploration_id': 'exp_id',
            'exploration_version': 1,
            'state_name': 'Introduction',
            'state_index': 0,
            'learner_current_answer': None,
        }

    def test_creator_can_get_feedback_detail_for_owned_exploration(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            page_url='https://oppia.org/learn',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self._get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json(
                '/platform-feedback/curriculum/exp_id/%s' % report.id
            )

        self.assertEqual(response['id'], report.id)
        self.assertEqual(response['report_message'], 'There is a typo.')
        self.assertEqual(response, report.to_dict())

    def test_creator_cannot_get_missing_feedback_detail(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json(
                '/platform-feedback/curriculum/exp_id/missing_report',
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/platform-feedback/curriculum/exp_id/missing_report.',
        )

    def test_creator_can_update_feedback_status_for_owned_exploration(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            page_url='https://oppia.org/learn',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self._get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/platform-feedback/curriculum/exp_id/%s' % report.id,
                {'status': feconf.STATUS_CHOICES_FIXED},
                csrf_token=csrf_token,
                expected_status_int=200,
            )

        updated_report = general_feedback_services.get_platform_feedback(
            report.id
        )
        self.assertEqual(response, {'success': True})
        self.assertIsNotNone(updated_report)
        assert updated_report is not None
        self.assertEqual(updated_report.status, feconf.STATUS_CHOICES_FIXED)

    def test_creator_can_not_update_feedback_status_for_owned_exploration_with_invalid_status(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            page_url='https://oppia.org/learn',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self._get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/platform-feedback/curriculum/exp_id/%s' % report.id,
                {'status': 'invalid_status'},
                csrf_token=csrf_token,
                expected_status_int=400,
            )

    def test_creator_cannot_update_missing_feedback(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/platform-feedback/curriculum/exp_id/missing_report',
                {'status': feconf.STATUS_CHOICES_FIXED},
                csrf_token=csrf_token,
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/platform-feedback/curriculum/exp_id/missing_report.',
        )

    def test_creator_cannot_get_feedback_for_different_exploration(
        self,
    ) -> None:
        self.save_new_valid_exploration('other_exp_id', self.owner_id)

        other_lesson_metadata = self._get_lesson_metadata()
        other_lesson_metadata['exploration_id'] = 'other_exp_id'
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            page_url='https://oppia.org/learn',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=other_lesson_metadata,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json(
                '/platform-feedback/curriculum/exp_id/%s' % report.id,
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/platform-feedback/curriculum/exp_id/%s.'
            % report.id,
        )

    def test_creator_cannot_update_feedback_for_different_exploration(
        self,
    ) -> None:
        self.save_new_valid_exploration('other_exp_id', self.owner_id)

        lesson_metadata = self._get_lesson_metadata()
        lesson_metadata['exploration_id'] = 'other_exp_id'

        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            page_url='https://oppia.org/learn',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=lesson_metadata,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        with self.login_context(self.OWNER_EMAIL):
            csrf_token = self.get_new_csrf_token()

            response = self.post_json(
                '/platform-feedback/curriculum/exp_id/%s' % report.id,
                {'status': feconf.STATUS_CHOICES_FIXED},
                csrf_token=csrf_token,
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/platform-feedback/curriculum/exp_id/%s.'
            % report.id,
        )


class LessonFeedbackHandlerTests(test_utils.GenericTestBase):
    """Tests for LessonFeedbackListHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.save_new_valid_exploration('exp_id', self.owner_id)
        self.signup('other@example.com', 'otheruser')
        self.other_user_id = self.get_user_id_from_email('other@example.com')
        self.save_new_valid_exploration('exp_id_2', self.other_user_id)

    def _get_lesson_metadata(
        self,
        exp_id: str,
    ) -> general_feedback_domain.LessonMetadataDict:
        """Returns valid lesson metadata."""
        return {
            'exploration_id': exp_id,
            'exploration_version': 1,
            'state_name': 'Introduction',
            'state_index': 0,
            'learner_current_answer': None,
        }

    def test_creator_can_list_owned_exploration_feedback(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.owner_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata('exp_id'),
        )
        general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata('exp_id_2'),
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json('/feedback/exp_id')

        self.assertEqual(len(response['summaries']), 1)
        self.assertEqual(response['summaries'][0]['id'], feedback.id)
        self.assertIsNone(response['next_cursor'])
        self.assertFalse(response['more'])

    def test_learner_can_get_own_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.owner_id,
            feedback_text='Helpful lesson.',
            lesson_metadata=self._get_lesson_metadata('exp_id'),
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json('/feedback/exp_id/%s' % feedback.id)

        self.assertEqual(response, feedback.to_dict())

    def test_creator_cannot_get_missing_lesson_feedback_detail(self) -> None:
        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json(
                '/feedback/exp_id/missing_feedback',
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/feedback/exp_id/missing_feedback.',
        )

    def test_learner_cannot_get_other_user_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata('exp_id_2'),
        )

        with self.login_context(self.OWNER_EMAIL):
            response = self.get_json(
                '/feedback/exp_id/%s' % feedback.id,
                expected_status_int=404,
            )

        self.assertEqual(
            response['error'],
            'Could not find the resource '
            'http://localhost/feedback/exp_id/%s.' % feedback.id,
        )

    def test_logged_out_user_cannot_list_feedback(self) -> None:
        response = self.get_json('/feedback/exp_id_2', expected_status_int=401)

        self.assertEqual(
            response['error'], 'You must be logged in to access this resource.'
        )

    def test_logged_out_user_cannot_get_lesson_feedback_detail(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id=self.other_user_id,
            feedback_text='Other learner feedback.',
            lesson_metadata=self._get_lesson_metadata('exp_id_2'),
        )
        response = self.get_json(
            '/feedback/exp_id_2/%s' % feedback.id,
            expected_status_int=401,
        )

        self.assertEqual(
            response['error'], 'You must be logged in to access this resource.'
        )
