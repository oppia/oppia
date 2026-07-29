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

"""Tests for general feedback services."""

from __future__ import annotations

from unittest import mock

from core import feconf
from core.domain import general_feedback_domain, general_feedback_services
from core.platform import models
from core.tests import test_utils

from typing import Dict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import general_feedback_models

(general_feedback_models,) = models.Registry.import_models(
    [models.Names.GENERAL_FEEDBACK]
)

# Here we use object because session-info diagnostics are heterogeneous
# JSON-like payloads (nested dict/list values) from client logs.
VALID_SESSION_INFO: Dict[str, object] = {
    'console_logs': [],
    'failed_requests': [],
    'navigation_history': [],
    'environment': {
        'client_time_msecs': 1767225602000,
        'timezone_offset_mins': -330,
        'user_agent': 'Mozilla/5.0',
        'viewport': {'width': 1920, 'height': 1080},
        'page': {
            'url': 'http://oppia.org/explore/exp_001',
            'title': 'Fractions',
        },
        'locale': {'language_code': 'en', 'direction': 'ltr'},
    },
}


class GeneralFeedbackServicesTests(test_utils.GenericTestBase):
    """Tests for general feedback services."""

    def get_lesson_metadata(
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

    def test_create_lesson_feedback_returns_domain_object(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )

        self.assertEqual(feedback.author_id, 'user_id')
        self.assertEqual(feedback.feedback_text, 'This lesson helped.')
        self.assertEqual(feedback.status, feconf.STATUS_CHOICES_OPEN)
        self.assertEqual(feedback.lesson_metadata, self.get_lesson_metadata())
        self.assertEqual(feedback.response_list, [])
        self.assertEqual(feedback.unread_response_count, 0)

    def test_create_lesson_feedback_preserves_parent_feedback_id(
        self,
    ) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='Follow-up feedback.',
            lesson_metadata=self.get_lesson_metadata(),
            parent_feedback_id='parent_id',
        )

        self.assertEqual(feedback.parent_feedback_id, 'parent_id')

    def test_get_learner_feedback_summaries_filters_by_author(self) -> None:
        expected_feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )
        general_feedback_services.create_lesson_feedback(
            author_id='other_user_id',
            feedback_text='Other learner feedback.',
            lesson_metadata=self.get_lesson_metadata(),
        )

        summaries, next_cursor, more = (
            general_feedback_services.get_learner_feedback_summaries('user_id')
        )

        self.assertEqual(len(summaries), 1)
        self.assertEqual(summaries[0]['id'], expected_feedback.id)
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_get_lesson_feedback_returns_none_for_missing_feedback(
        self,
    ) -> None:
        self.assertIsNone(
            general_feedback_services.get_lesson_feedback('missing_feedback')
        )

    def test_get_lesson_feedback_summaries_applies_filters(self) -> None:
        expected_feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )
        feedback_model = general_feedback_models.LessonFeedbackModel.get_by_id(
            expected_feedback.id
        )
        assert feedback_model is not None

        with mock.patch.object(
            general_feedback_models.LessonFeedbackModel,
            'fetch_page',
            return_value=([feedback_model], 'next_cursor', True),
        ) as mock_fetch_page:
            summaries, next_cursor, more = (
                general_feedback_services.get_lesson_feedback_summaries(
                    exp_id='exp_id',
                    status_filter=feconf.STATUS_CHOICES_OPEN,
                    cursor='cursor',
                    date_from_msecs=0,
                    date_to_msecs=9999999999999,
                )
            )

        self.assertEqual(len(summaries), 1)
        self.assertEqual(summaries[0]['id'], expected_feedback.id)
        self.assertEqual(
            summaries[0]['feedback_text_preview'], 'This lesson helped.'
        )
        self.assertEqual(next_cursor, 'next_cursor')
        self.assertTrue(more)
        self.assertEqual(mock_fetch_page.call_args.kwargs['page_size'], 20)
        self.assertEqual(mock_fetch_page.call_args.kwargs['cursor'], 'cursor')
        self.assertEqual(
            mock_fetch_page.call_args.kwargs['exploration_id'], 'exp_id'
        )
        self.assertEqual(
            mock_fetch_page.call_args.kwargs['status_filter'],
            feconf.STATUS_CHOICES_OPEN,
        )
        self.assertIsNotNone(mock_fetch_page.call_args.kwargs['date_from'])
        self.assertIsNotNone(mock_fetch_page.call_args.kwargs['date_to'])

    def test_get_learner_feedback_rejects_feedback_owned_by_other_user(
        self,
    ) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )

        self.assertIsNone(
            general_feedback_services.get_learner_feedback(
                feedback.id, 'other_user_id'
            )
        )

    def test_update_lesson_feedback_appends_creator_response(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )

        updated_feedback = general_feedback_services.update_lesson_feedback(
            feedback_id=feedback.id,
            new_status=feconf.STATUS_CHOICES_FIXED,
            exp_id='exp_id',
            responder_id='creator_id',
            reply_text='Thanks, this is fixed.',
        )
        feedback_model = general_feedback_models.LessonFeedbackModel.get_by_id(
            feedback.id
        )

        self.assertIsNotNone(updated_feedback)
        assert updated_feedback is not None
        self.assertEqual(updated_feedback.status, feconf.STATUS_CHOICES_FIXED)
        self.assertEqual(updated_feedback.unread_response_count, 1)
        self.assertEqual(
            updated_feedback.response_list[0]['response_text'],
            'Thanks, this is fixed.',
        )
        self.assertIn('responded_on', updated_feedback.response_list[0])
        self.assertIsNotNone(feedback_model)
        assert feedback_model is not None
        self.assertEqual(
            feedback_model.response_list[0]['responded_by'], 'creator_id'
        )

    def test_update_lesson_feedback_updates_status_without_reply(self) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )

        updated_feedback = general_feedback_services.update_lesson_feedback(
            feedback_id=feedback.id,
            new_status=feconf.STATUS_CHOICES_FIXED,
            exp_id='exp_id',
            responder_id='creator_id',
        )

        self.assertIsNotNone(updated_feedback)
        assert updated_feedback is not None
        self.assertEqual(updated_feedback.status, feconf.STATUS_CHOICES_FIXED)
        self.assertEqual(updated_feedback.response_list, [])
        self.assertEqual(updated_feedback.unread_response_count, 0)

    def test_update_lesson_feedback_returns_none_for_missing_feedback(
        self,
    ) -> None:
        self.assertIsNone(
            general_feedback_services.update_lesson_feedback(
                feedback_id='missing_feedback',
                new_status=feconf.STATUS_CHOICES_FIXED,
                exp_id='exp_id',
                responder_id='creator_id',
            )
        )

    def test_update_lesson_feedback_rejects_invalid_status(self) -> None:
        with self.assertRaisesRegex(ValueError, 'Invalid status: invalid'):
            general_feedback_services.update_lesson_feedback(
                feedback_id='feedback_id',
                new_status='invalid',
                exp_id='exp_id',
                responder_id='creator_id',
            )

    def test_update_lesson_feedback_rejects_invalid_exploration(
        self,
    ) -> None:
        feedback = general_feedback_services.create_lesson_feedback(
            author_id='user_id',
            feedback_text='This lesson helped.',
            lesson_metadata=self.get_lesson_metadata(),
        )

        with self.assertRaisesRegex(
            ValueError, 'Invalid exploration ID: other_exp_id'
        ):
            general_feedback_services.update_lesson_feedback(
                feedback_id=feedback.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                exp_id='other_exp_id',
                responder_id='creator_id',
            )

    def test_create_platform_report_for_lesson_routes_to_creator(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://example.com',
        )

        self.assertEqual(report.report_message, 'There is a typo.')
        self.assertEqual(report.source, feconf.SOURCE_LESSON)
        self.assertEqual(report.platform, feconf.PLATFORM_WEB)
        self.assertEqual(
            report.destination_dashboard,
            feconf.DESTINATION_CURRICULUM,
        )
        self.assertEqual(report.category, feconf.CATEGORY_TYPO)
        self.assertEqual(report.lesson_metadata, self.get_lesson_metadata())
        self.assertFalse(report.include_technical_logs)

    def test_create_platform_report_for_site_maps_source_to_app(self) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='The page is broken.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.com/donate',
        )

        self.assertEqual(report.source, feconf.SOURCE_APP)
        self.assertEqual(
            report.destination_dashboard,
            feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM,
        )
        self.assertIsNone(report.category)
        self.assertIsNone(report.lesson_metadata)

    def test_create_platform_report_stores_session_info_when_opted_in(
        self,
    ) -> None:
        session_info = {
            'console_logs': [
                {
                    'error_message': 'Console error.',
                    'timestamp_msecs': 1,
                    'log_level': 'error',
                }
            ],
            'failed_requests': [],
            'navigation_history': [{'path': '/learn', 'timestamp_msecs': 2}],
            'environment': {'user_agent': 'Mozilla/5.0'},
        }

        report = general_feedback_services.create_platform_report(
            feedback_text='The card image is broken.',
            source='lesson',
            category=feconf.CATEGORY_BROKEN_LAYOUT_OR_IMAGE,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=session_info,
            screenshot_filename='feedback.png',
            screenshot_entity_id='entity_id',
            include_technical_logs=True,
            page_url='https://oppia.org/learn',
        )
        session_model = (
            general_feedback_models.FeedbackSessionLogModel.get_by_id(report.id)
        )

        self.assertTrue(report.include_technical_logs)
        self.assertEqual(report.screenshot_filename, 'feedback.png')
        self.assertEqual(report.screenshot_entity_id, 'entity_id')
        self.assertIsNotNone(session_model)
        assert session_model is not None
        self.assertEqual(
            session_model.console_logs,
            session_info['console_logs'],
        )
        self.assertEqual(
            session_model.navigation_history,
            session_info['navigation_history'],
        )
        self.assertEqual(
            session_model.failed_requests,
            session_info['failed_requests'],
        )
        self.assertEqual(
            session_model.environment,
            session_info['environment'],
        )

    def test_create_platform_report_sanitizes_invalid_session_info(
        self,
    ) -> None:
        # Here we use object because session-info diagnostics are heterogeneous
        # JSON-like payloads (nested dict/list values) from client logs.
        session_info: Dict[str, object] = {
            'console_logs': 'invalid',
            'failed_requests': 'invalid',
            'navigation_history': 'invalid',
            'environment': 'invalid',
        }

        report = general_feedback_services.create_platform_report(
            feedback_text='Broken page',
            source='lesson',
            category=(feconf.CATEGORY_BROKEN_LAYOUT_OR_IMAGE),
            lesson_metadata=self.get_lesson_metadata(),
            session_info=session_info,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=True,
            page_url='https://oppia.org/learn',
        )

        session_model = (
            general_feedback_models.FeedbackSessionLogModel.get_by_id(report.id)
        )

        self.assertEqual(session_model.console_logs, [])
        self.assertEqual(session_model.failed_requests, [])
        self.assertEqual(session_model.navigation_history, [])
        self.assertEqual(session_model.environment, {})

    def test_create_platform_report_raises_for_missing_lesson_metadata(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Lesson feedback must include lesson metadata.'
        ):
            general_feedback_services.create_platform_report(
                feedback_text='The card image is broken.',
                source='lesson',
                category=feconf.CATEGORY_BROKEN_LAYOUT_OR_IMAGE,
                lesson_metadata=None,
                session_info=None,
                screenshot_filename=None,
                screenshot_entity_id=None,
                include_technical_logs=False,
                page_url='https://oppia.org/learn',
            )

    def test_create_platform_report_routes_to_core_dashboard(self) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='Technical issue.',
            source='app',
            page_url='https://oppia.org/create/12',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
        )

        self.assertEqual(
            report.destination_dashboard,
            feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM,
        )

    def test_update_platform_feedback_status_for_dashboard_rejects_creator_dashboard_for_technical_feedback(
        self,
    ) -> None:
        report1 = general_feedback_services.create_platform_report(
            feedback_text='App crashed.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        report2 = general_feedback_services.create_platform_report(
            feedback_text='App crashed.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        with self.assertRaisesRegex(
            ValueError, 'Feedback does not belong to the requested dashboard.'
        ):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report1.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )

        with self.assertRaisesRegex(
            ValueError, 'Feedback does not belong to the requested exploration.'
        ):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report2.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='invalid_exp_id',
            )

    def test_update_platform_feedback_status_for_dashboard_rejects_invalid_technical_team(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='App crashed.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        with self.assertRaisesRegex(
            ValueError, 'Invalid technical feedback team.'
        ):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_TECHNICAL,
                dashboard_id='INVALID_TEAM',
            )

    def test_update_platform_feedback_status_for_dashboard_rejects_mismatched_technical_team(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='App crashed.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        with self.assertRaisesRegex(
            ValueError, 'Feedback does not belong to the requested dashboard.'
        ):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_TECHNICAL,
                dashboard_id=feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM,
            )

    def test_get_platform_feedback_returns_domain_object(self) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_BROKEN_LAYOUT_OR_IMAGE,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=VALID_SESSION_INFO,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=True,
            page_url='https://oppia.org/learn',
        )

        retrieved_report = general_feedback_services.get_platform_feedback(
            report.id
        )

        self.assertIsNotNone(retrieved_report)
        assert retrieved_report is not None
        self.assertEqual(retrieved_report.id, report.id)
        self.assertEqual(retrieved_report.report_message, 'There is a typo.')
        self.assertEqual(
            retrieved_report.session_info,
            VALID_SESSION_INFO,
        )

    def test_get_platform_feedback_returns_none_for_missing_report(
        self,
    ) -> None:
        self.assertIsNone(
            general_feedback_services.get_platform_feedback('missing_report')
        )

    def test_get_platform_feedback_summaries_filters_creator_by_exploration(
        self,
    ) -> None:
        other_lesson_metadata = self.get_lesson_metadata()
        other_lesson_metadata['exploration_id'] = 'other_exp_id'
        expected_report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )
        general_feedback_services.create_platform_report(
            feedback_text='There is another typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=other_lesson_metadata,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        summaries, next_cursor, more = (
            general_feedback_services.get_platform_feedback_summaries(
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )
        )

        self.assertEqual(len(summaries), 1)
        self.assertEqual(summaries[0]['id'], expected_report.id)
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_get_platform_feedback_summaries_filters_technical_dashboard(
        self,
    ) -> None:
        expected_report = general_feedback_services.create_platform_report(
            feedback_text='The donate page is broken.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/donate',
        )
        general_feedback_services.create_platform_report(
            feedback_text='The create page is broken.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/create',
        )

        summaries, next_cursor, more = (
            general_feedback_services.get_platform_feedback_summaries(
                dashboard=feconf.DESTINATION_TECHNICAL,
                dashboard_id=feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM,
            )
        )

        self.assertEqual(len(summaries), 1)
        self.assertEqual(summaries[0]['id'], expected_report.id)
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_get_platform_feedback_summaries_rejects_invalid_dashboard(
        self,
    ) -> None:
        with self.assertRaisesRegex(ValueError, 'Invalid dashboard: invalid'):
            general_feedback_services.get_platform_feedback_summaries(
                dashboard='invalid',
                dashboard_id='exp_id',
            )

    def test_get_platform_feedback_summaries_rejects_invalid_technical_team(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Invalid technical feedback team: invalid'
        ):
            general_feedback_services.get_platform_feedback_summaries(
                dashboard=feconf.DESTINATION_TECHNICAL,
                dashboard_id='invalid',
            )

    def test_update_platform_feedback_status_for_creator_feedback_tab_updates_model(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        updated_report = general_feedback_services.update_platform_feedback_status_for_dashboard(
            report_id=report.id,
            new_status=feconf.STATUS_CHOICES_FIXED,
            dashboard=feconf.DESTINATION_CURRICULUM,
            dashboard_id='exp_id',
        )

        self.assertIsNotNone(updated_report)
        assert updated_report is not None
        self.assertEqual(updated_report.status, feconf.STATUS_CHOICES_FIXED)

    def test_update_platform_feedback_status_for_dashboard_fetches_once(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        with mock.patch.object(
            general_feedback_models.PlatformFeedbackModel,
            'get_by_id',
            wraps=general_feedback_models.PlatformFeedbackModel.get_by_id,
        ) as mock_get_by_id:
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )

        mock_get_by_id.assert_called_once_with(report.id)

    def test_update_platform_feedback_status_for_dashboard_returns_none_for_missing_report(
        self,
    ) -> None:
        self.assertIsNone(
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id='missing_report',
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )
        )

    def test_update_platform_feedback_status_for_dashboard_returns_none_for_deleted_report(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )
        model = general_feedback_models.PlatformFeedbackModel.get_by_id(
            report.id
        )
        assert model is not None
        model.delete()

        self.assertIsNone(
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )
        )

    def test_update_platform_feedback_status_for_dashboard_rejects_invalid_status(
        self,
    ) -> None:
        with self.assertRaisesRegex(ValueError, 'Invalid status: invalid'):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id='report_id',
                new_status='invalid',
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )

    def test_update_platform_feedback_status_for_dashboard_rejects_other_dashboard(
        self,
    ) -> None:
        other_lesson_metadata = self.get_lesson_metadata()
        other_lesson_metadata['exploration_id'] = 'other_exp_id'
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=other_lesson_metadata,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        with self.assertRaisesRegex(
            ValueError, 'Feedback does not belong to the requested exploration.'
        ):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard=feconf.DESTINATION_CURRICULUM,
                dashboard_id='exp_id',
            )

    def test_update_platform_feedback_status_for_dashboard_succeeds_for_technical_dashboard(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a bug.',
            source='app',
            category=None,
            lesson_metadata=None,
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        updated_report = general_feedback_services.update_platform_feedback_status_for_dashboard(
            report_id=report.id,
            new_status=feconf.STATUS_CHOICES_FIXED,
            dashboard=feconf.DESTINATION_TECHNICAL,
            dashboard_id=feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM,
        )

        self.assertIsNotNone(updated_report)
        assert updated_report is not None
        self.assertEqual(updated_report.status, feconf.STATUS_CHOICES_FIXED)

    def test_update_platform_feedback_status_for_dashboard_rejects_invalid_dashboard(
        self,
    ) -> None:
        report = general_feedback_services.create_platform_report(
            feedback_text='There is a typo.',
            source='lesson',
            category=feconf.CATEGORY_TYPO,
            lesson_metadata=self.get_lesson_metadata(),
            session_info=None,
            screenshot_filename=None,
            screenshot_entity_id=None,
            include_technical_logs=False,
            page_url='https://oppia.org/learn',
        )

        with self.assertRaisesRegex(ValueError, 'Invalid dashboard.'):
            general_feedback_services.update_platform_feedback_status_for_dashboard(
                report_id=report.id,
                new_status=feconf.STATUS_CHOICES_FIXED,
                dashboard='invalid',
                dashboard_id='exp_id',
            )
