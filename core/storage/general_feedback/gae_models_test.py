# coding: utf-8
#
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

"""Tests for web feedback thread and message models."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, general_feedback_models

base_models, general_feedback_models = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.GENERAL_FEEDBACK]
)


NONEXISTENT_USER_ID = 'id_nonexistent'

LESSON_METADATA: Dict[str, Union[str, int, None]] = {
    'exploration_id': 'exp_001',
    'exploration_version': 3,
    'state_name': 'Introduction',
    'state_index': 0,
    'learner_current_answer': 'Paris',
}

FEEDBACK_TEXT = 'This card has a typo in the second paragraph.'
REPORT_TEXT = 'The image in step 3 does not load at all.'


class LessonFeedbackModelTests(test_utils.GenericTestBase):
    """Tests for LessonFeedbackModel."""

    def setUp(self) -> None:
        super().setUp()

        self.signup('learner@example.com', 'learner')
        self.USER_ID = self.get_user_id_from_email('learner@example.com')

        self.signup('other@example.com', 'other')
        self.OTHER_USER_ID = self.get_user_id_from_email('other@example.com')

        self.feedback_id1 = general_feedback_models.LessonFeedbackModel.create(
            author_id=self.USER_ID,
            feedback_text=FEEDBACK_TEXT,
            lesson_metadata=LESSON_METADATA,
        )

        # Follow-up note by USER_ID referencing feedback_id1.
        self.feedback_id2 = general_feedback_models.LessonFeedbackModel.create(
            author_id=self.USER_ID,
            feedback_text='Adding more context to my earlier note.',
            lesson_metadata=LESSON_METADATA,
            parent_feedback_id=self.feedback_id1,
        )

        self.feedback_id3 = general_feedback_models.LessonFeedbackModel.create(
            author_id=self.OTHER_USER_ID,
            feedback_text='Separate feedback from another learner.',
            lesson_metadata=LESSON_METADATA,
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE,
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER,
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get_export_policy(),
            {
                # Fields inherited from BaseFeedbackModel.
                'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'feedback_text': base_models.EXPORT_POLICY.EXPORTED,
                'status': base_models.EXPORT_POLICY.EXPORTED,
                'exploration_id': base_models.EXPORT_POLICY.EXPORTED,
                'lesson_metadata_schema_version': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'lesson_metadata': base_models.EXPORT_POLICY.EXPORTED,
                # Fields specific to LessonFeedbackModel.
                'parent_feedback_id': base_models.EXPORT_POLICY.EXPORTED,
                'response_list_schema_version': base_models.EXPORT_POLICY.EXPORTED,
                'response_list': base_models.EXPORT_POLICY.EXPORTED,
                'unread_response_count': base_models.EXPORT_POLICY.EXPORTED,
                'created_on': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.EXPORTED,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_get_field_names_for_takeout(self) -> None:
        self.assertEqual(
            general_feedback_models.LessonFeedbackModel.get_field_names_for_takeout(),
            {
                'created_on': 'created_on_msec',
                'last_updated': 'last_updated_msec',
            },
        )

    def test_has_reference_to_user_id_returns_true_for_existing_author_id(
        self,
    ) -> None:
        self.assertTrue(
            general_feedback_models.LessonFeedbackModel.has_reference_to_user_id(
                self.USER_ID
            )
        )

    def test_has_reference_to_user_id_returns_false_for_nonexistent_user(
        self,
    ) -> None:
        self.assertFalse(
            general_feedback_models.LessonFeedbackModel.has_reference_to_user_id(
                NONEXISTENT_USER_ID
            )
        )

    def test_export_data_returns_only_entries_authored_by_user(self) -> None:
        export_data = general_feedback_models.LessonFeedbackModel.export_data(
            self.USER_ID
        )
        # USER_ID authored feedback_id1 and feedback_id2 only.
        self.assertEqual(
            set(export_data.keys()),
            {self.feedback_id1, self.feedback_id2},
        )
        # feedback_id3 belongs to OTHER_USER_ID and must not appear.
        self.assertNotIn(self.feedback_id3, export_data)

    def test_export_data_shape_for_top_level_feedback(self) -> None:
        feedback_model = general_feedback_models.LessonFeedbackModel.get_by_id(
            self.feedback_id1
        )
        export_data = general_feedback_models.LessonFeedbackModel.export_data(
            self.USER_ID
        )
        # Here we use type Any because the expected dictionary contains
        # heterogeneous values, including strings, integers, dictionaries,
        # lists, and None.
        expected: Dict[str, Any] = {
            'feedback_text': FEEDBACK_TEXT,
            'status': feconf.STATUS_CHOICES_OPEN,
            'exploration_id': LESSON_METADATA['exploration_id'],
            'lesson_metadata': LESSON_METADATA,
            'parent_feedback_id': None,
            'response_list': [],
            'unread_response_count': 0,
            'created_on_msec': utils.get_time_in_millisecs(
                feedback_model.created_on
            ),
            'last_updated_msec': utils.get_time_in_millisecs(
                feedback_model.last_updated
            ),
        }
        self.assertEqual(export_data[self.feedback_id1], expected)

    def test_export_data_shape_for_follow_up_note(self) -> None:
        feedback_model = general_feedback_models.LessonFeedbackModel.get_by_id(
            self.feedback_id2
        )
        export_data = general_feedback_models.LessonFeedbackModel.export_data(
            self.USER_ID
        )
        self.assertEqual(
            export_data[self.feedback_id2]['parent_feedback_id'],
            self.feedback_id1,
        )
        self.assertEqual(
            export_data[self.feedback_id2]['feedback_text'],
            'Adding more context to my earlier note.',
        )
        self.assertEqual(
            export_data[self.feedback_id2]['created_on_msec'],
            utils.get_time_in_millisecs(feedback_model.created_on),
        )

    def test_export_data_returns_empty_dict_for_nonexistent_user(
        self,
    ) -> None:
        export_data = general_feedback_models.LessonFeedbackModel.export_data(
            NONEXISTENT_USER_ID
        )
        self.assertEqual(export_data, {})

    def test_fetch_page_filters_by_author_exploration_and_date_range(
        self,
    ) -> None:
        matching_feedback_model = (
            general_feedback_models.LessonFeedbackModel.get_by_id(
                self.feedback_id1
            )
        )
        assert matching_feedback_model is not None
        matching_feedback_model.created_on = datetime.datetime(2026, 1, 15)
        matching_feedback_model.update_timestamps()
        matching_feedback_model.put()

        other_author_feedback_model = (
            general_feedback_models.LessonFeedbackModel.get_by_id(
                self.feedback_id3
            )
        )
        assert other_author_feedback_model is not None
        other_author_feedback_model.created_on = datetime.datetime(2026, 1, 15)
        other_author_feedback_model.update_timestamps()
        other_author_feedback_model.put()

        outside_date_range_feedback_model = (
            general_feedback_models.LessonFeedbackModel.get_by_id(
                self.feedback_id2
            )
        )
        assert outside_date_range_feedback_model is not None
        outside_date_range_feedback_model.created_on = datetime.datetime(
            2026, 2, 1
        )
        outside_date_range_feedback_model.update_timestamps()
        outside_date_range_feedback_model.put()

        feedback_models, next_cursor, more = (
            general_feedback_models.LessonFeedbackModel.fetch_page(
                page_size=10,
                author_id=self.USER_ID,
                exploration_id='exp_001',
                date_from=datetime.datetime(2026, 1, 1),
                date_to=datetime.datetime(2026, 1, 31),
            )
        )

        self.assertEqual(
            [feedback_model.id for feedback_model in feedback_models],
            [self.feedback_id1],
        )
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_create_generates_id_with_correct_prefix(self) -> None:
        self.assertTrue(self.feedback_id1.startswith('feedback.lesson.'))
        self.assertTrue(self.feedback_id2.startswith('feedback.lesson.'))

    def test_create_generates_unique_ids(self) -> None:
        self.assertNotEqual(self.feedback_id1, self.feedback_id2)
        self.assertNotEqual(self.feedback_id1, self.feedback_id3)

    def test_generate_new_id_raises_error_after_many_collisions(
        self,
    ) -> None:
        with self.swap(
            general_feedback_models.LessonFeedbackModel,
            'get_by_id',
            lambda _: object(),
        ):
            with self.assertRaisesRegex(
                Exception,
                'LessonFeedbackModel ID generator is producing too many '
                'collisions.',
            ):
                general_feedback_models.LessonFeedbackModel.create(
                    feedback_text='Feedback text',
                    author_id=self.USER_ID,
                    lesson_metadata=LESSON_METADATA,
                )


class PlatformFeedbackModelTests(test_utils.GenericTestBase):
    """Tests for PlatformFeedbackModel."""

    def setUp(self) -> None:
        super().setUp()

        self.signup('reporter@example.com', 'reporter')
        self.USER_ID = self.get_user_id_from_email('reporter@example.com')

        self.signup('other@example.com', 'other')
        self.OTHER_USER_ID = self.get_user_id_from_email('other@example.com')

        # Lesson report → category typo → creator dashboard.
        self.report_id_typo = (
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text=REPORT_TEXT,
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                category=feconf.CATEGORY_TYPO,
                lesson_metadata=LESSON_METADATA,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )
        )

        # Lesson report → category broken_layout_or_image → technical external
        # dashboard.
        self.report_id_broken = (
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text='Image on step 3 fails to load.',
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                category=feconf.CATEGORY_BROKEN_LAYOUT_OR_IMAGE,
                destination_dashboard=(
                    feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
                ),
                lesson_metadata=LESSON_METADATA,
                include_technical_logs=False,
                screenshot_filename='step3.png',
                screenshot_entity_id='entity_step3',
                page_url='https://oppia.org/donate',
            )
        )

        # Site (app) report → technical dashboard.
        self.report_id_app = (
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text='The app crashes on startup.',
                source=feconf.SOURCE_APP,
                platform=feconf.PLATFORM_ANDROID,
                category=None,
                destination_dashboard=(
                    feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
                ),
                lesson_metadata=None,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.PlatformFeedbackModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            general_feedback_models.PlatformFeedbackModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.PlatformFeedbackModel.get_export_policy(),
            {
                # Fields inherited from BaseFeedbackModel.
                'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'feedback_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'lesson_metadata_schema_version': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'lesson_metadata': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                # Fields specific to PlatformFeedbackModel.
                'source': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'page_url': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'platform': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'destination_dashboard': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'include_technical_logs': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'screenshot_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'screenshot_entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_create_generates_id_with_correct_prefix(self) -> None:
        self.assertTrue(self.report_id_typo.startswith('feedback.platform.'))
        self.assertTrue(self.report_id_broken.startswith('feedback.platform.'))
        self.assertTrue(self.report_id_app.startswith('feedback.platform.'))

    def test_create_generates_unique_ids(self) -> None:
        self.assertNotEqual(self.report_id_typo, self.report_id_broken)
        self.assertNotEqual(self.report_id_typo, self.report_id_app)

    def test_create_raises_error_when_lesson_report_has_no_metadata(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Lesson feedback must include lesson metadata.'
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text=REPORT_TEXT,
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                category=feconf.CATEGORY_TYPO,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                lesson_metadata=None,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )

    def test_create_raises_error_when_lesson_report_has_no_exploration_id(
        self,
    ) -> None:
        lesson_metadata = dict(LESSON_METADATA)
        lesson_metadata['exploration_id'] = None

        with self.assertRaisesRegex(
            ValueError, 'Lesson feedback must include an exploration ID.'
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text=REPORT_TEXT,
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                category=feconf.CATEGORY_TYPO,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                lesson_metadata=lesson_metadata,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )

    def test_create_raises_error_for_invalid_source(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Invalid source: invalid_source'
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text='test',
                source='invalid_source',
                platform=feconf.PLATFORM_WEB,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                page_url='https://oppia.org/donate',
                category=None,
                lesson_metadata=None,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
            )

    def test_create_raises_error_when_app_report_includes_category(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'App feedback must not include a category.'
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text='App report with forbidden category.',
                source=feconf.SOURCE_APP,
                platform=feconf.PLATFORM_ANDROID,
                category=feconf.CATEGORY_TYPO,
                destination_dashboard=(
                    feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
                ),
                lesson_metadata=None,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )

    def test_create_raises_error_when_app_report_includes_lesson_metadata(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError, 'App feedback must not include lesson metadata.'
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text='App report with forbidden metadata.',
                source=feconf.SOURCE_APP,
                platform=feconf.PLATFORM_ANDROID,
                category=None,
                destination_dashboard=(
                    feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
                ),
                lesson_metadata=LESSON_METADATA,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )

    def test_create_raises_error_when_only_screenshot_filename_is_provided(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            'screenshot_filename and screenshot_entity_id must both be '
            'provided or both be None.',
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text=REPORT_TEXT,
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                category=feconf.CATEGORY_TYPO,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                lesson_metadata=LESSON_METADATA,
                include_technical_logs=False,
                screenshot_filename='only_filename.png',
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )

    def test_create_raises_error_when_only_screenshot_entity_id_is_provided(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            'screenshot_filename and screenshot_entity_id must both be '
            'provided or both be None.',
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text=REPORT_TEXT,
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                category=feconf.CATEGORY_TYPO,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                lesson_metadata=LESSON_METADATA,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id='only_entity_id',
                page_url='https://oppia.org/donate',
            )

    def test_fetch_page_filters_by_platform_source_and_destination(
        self,
    ) -> None:
        report_models, next_cursor, more = (
            general_feedback_models.PlatformFeedbackModel.fetch_page(
                page_size=10,
                destination_dashboard=(
                    feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
                ),
                platform=feconf.PLATFORM_ANDROID,
                source=feconf.SOURCE_APP,
            )
        )

        self.assertEqual(
            [model.id for model in report_models], [self.report_id_app]
        )
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_fetch_page_filters_without_destination_dashboard(
        self,
    ) -> None:
        report_models, next_cursor, more = (
            general_feedback_models.PlatformFeedbackModel.fetch_page(
                page_size=10,
                platform=feconf.PLATFORM_ANDROID,
                source=feconf.SOURCE_APP,
            )
        )

        self.assertEqual(
            [model.id for model in report_models], [self.report_id_app]
        )
        self.assertIsNone(next_cursor)
        self.assertFalse(more)

    def test_create_raises_error_when_lesson_metadata_has_no_exploration_id(
        self,
    ) -> None:
        lesson_metadata_without_exploration_id: Dict[
            str, Union[str, int, None]
        ] = dict(LESSON_METADATA)
        lesson_metadata_without_exploration_id['exploration_id'] = None

        with self.assertRaisesRegex(
            ValueError,
            'Lesson feedback must include an exploration ID.',
        ):
            general_feedback_models.PlatformFeedbackModel.create(
                feedback_text=REPORT_TEXT,
                source=feconf.SOURCE_LESSON,
                platform=feconf.PLATFORM_WEB,
                destination_dashboard=feconf.DESTINATION_CURRICULUM,
                category=feconf.CATEGORY_TYPO,
                lesson_metadata=lesson_metadata_without_exploration_id,
                include_technical_logs=False,
                screenshot_filename=None,
                screenshot_entity_id=None,
                page_url='https://oppia.org/donate',
            )

    def test_app_report_has_no_top_level_exploration_id(self) -> None:
        report = general_feedback_models.PlatformFeedbackModel.get_by_id(
            self.report_id_app
        )

        self.assertIsNone(report.exploration_id)

    def test_create_stores_top_level_exploration_id(self) -> None:
        report = general_feedback_models.PlatformFeedbackModel.get_by_id(
            self.report_id_typo
        )

        self.assertEqual(
            report.exploration_id,
            LESSON_METADATA['exploration_id'],
        )

    def test_generate_new_id_raises_error_after_many_collisions(
        self,
    ) -> None:
        with self.swap(
            general_feedback_models.PlatformFeedbackModel,
            'get_by_id',
            lambda _: object(),
        ):
            with self.assertRaisesRegex(
                Exception,
                'PlatformFeedbackModel ID generator is producing too many '
                'collisions.',
            ):
                general_feedback_models.PlatformFeedbackModel.create(
                    feedback_text='Feedback text',
                    source=feconf.SOURCE_APP,
                    platform=feconf.PLATFORM_WEB,
                    page_url='http://oppia.org/donate',
                    destination_dashboard=(
                        feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
                    ),
                    category=None,
                    lesson_metadata=None,
                    include_technical_logs=False,
                    screenshot_filename=None,
                    screenshot_entity_id=None,
                )


class FeedbackSessionLogModelTests(test_utils.GenericTestBase):
    """Tests for FeedbackSessionLogModel."""

    def setUp(self) -> None:
        super().setUp()

        self.signup('learner@example.com', 'learner')
        self.USER_ID = self.get_user_id_from_email('learner@example.com')

        self.signup('other@example.com', 'other')
        self.OTHER_USER_ID = self.get_user_id_from_email('other@example.com')

        self.feedback_id1 = general_feedback_models.LessonFeedbackModel.create(
            author_id=self.USER_ID,
            feedback_text=FEEDBACK_TEXT,
            lesson_metadata=LESSON_METADATA,
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.FeedbackSessionLogModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_get_model_associated_with_user_id(self) -> None:

        self.assertEqual(
            general_feedback_models.FeedbackSessionLogModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.FeedbackSessionLogModel.get_export_policy(),
            {
                'session_info_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'console_logs': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'failed_requests': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'navigation_history': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'environment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_create(self) -> None:
        general_feedback_models.FeedbackSessionLogModel.create(
            report_id=self.feedback_id1,
            console_logs=[{'message': 'err'}],
            failed_requests=[{'url': '/test'}],
            navigation_history=[{'url': '/learn/math'}],
            environment={'user_agent': 'test-agent'},
        )
        session_log_model = (
            general_feedback_models.FeedbackSessionLogModel.get_by_id(
                self.feedback_id1
            )
        )
        self.assertIsNotNone(session_log_model)
        self.assertEqual(session_log_model.id, self.feedback_id1)
        self.assertEqual(session_log_model.console_logs, [{'message': 'err'}])
        self.assertEqual(session_log_model.failed_requests, [{'url': '/test'}])
        self.assertEqual(
            session_log_model.navigation_history,
            [{'url': '/learn/math'}],
        )
        self.assertEqual(
            session_log_model.environment, {'user_agent': 'test-agent'}
        )

    def test_create_accepts_empty_session_sections(self) -> None:
        general_feedback_models.FeedbackSessionLogModel.create(
            report_id=self.feedback_id1,
            console_logs=None,
            failed_requests=None,
            navigation_history=None,
            environment=None,
        )
        session_log_model = (
            general_feedback_models.FeedbackSessionLogModel.get_by_id(
                self.feedback_id1
            )
        )

        self.assertIsNotNone(session_log_model)
        assert session_log_model is not None
        self.assertIsNone(session_log_model.console_logs)
        self.assertIsNone(session_log_model.failed_requests)
        self.assertIsNone(session_log_model.navigation_history)
        self.assertIsNone(session_log_model.environment)

    def test_create_raises_error_for_duplicate_thread_id(self) -> None:
        general_feedback_models.FeedbackSessionLogModel.create(
            report_id=self.feedback_id1,
            console_logs=[{'message': 'err'}],
            failed_requests=[{'url': '/test'}],
            navigation_history=[{'url': '/learn/math'}],
            environment={'user_agent': 'test-agent'},
        )
        with self.assertRaisesRegex(
            Exception,
            'Session log for thread ID %s already exists.' % self.feedback_id1,
        ):
            general_feedback_models.FeedbackSessionLogModel.create(
                report_id=self.feedback_id1,
                console_logs=[{'message': 'err2'}],
                failed_requests=[{'url': '/test2'}],
                navigation_history=[{'url': '/learn/science'}],
                environment={'user_agent': 'test-agent-2'},
            )
