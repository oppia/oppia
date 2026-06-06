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

from core import utils
from core.platform import models
from core.tests import test_utils

from typing import List, Sequence, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, general_feedback_models

(base_models, general_feedback_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.GENERAL_FEEDBACK]
)


NONEXISTENT_USER_ID = 'id_x'
TARGET_TYPE_EXPLORATION = 'exploration'
TARGET_TYPE_GENERAL = 'general'
LESSON_TARGET_ID = 'exp_id_2'
PLATFORM_TARGET_ID = 'platform_target'
CATEGORY1 = 'lesson'
CATEGORY2 = 'platform'
PAGE_URL = '/learn/math'
LANGUAGE_CODE = 'en'
RATING = 4
THREAD_ID1 = 'general.thread.1'
THREAD_ID2 = 'general.thread.2'


class WebFeedbackThreadModelTests(test_utils.GenericTestBase):
    """Tests for WebFeedbackThreadModel."""

    def setUp(self) -> None:
        super().setUp()

        self.signup('learner@example.com', 'learner')
        self.USER_ID = self.get_user_id_from_email('learner@example.com')

        thread_model1 = general_feedback_models.WebFeedbackThreadModel(
            id=THREAD_ID1,
            category=CATEGORY1,
            target_type=TARGET_TYPE_EXPLORATION,
            target_id=LESSON_TARGET_ID,
            original_author_id=self.USER_ID,
            page_url=PAGE_URL,
            language_code=LANGUAGE_CODE,
            rating=RATING,
            has_screenshot=False,
            has_session_info=False,
            status=general_feedback_models.STATUS_CHOICES_OPEN,
            message_count=2,
        )
        thread_model1.put()

        thread_model2 = general_feedback_models.WebFeedbackThreadModel(
            id=THREAD_ID2,
            category=CATEGORY2,
            target_type=TARGET_TYPE_GENERAL,
            target_id=PLATFORM_TARGET_ID,
            original_author_id=self.USER_ID,
            page_url=PAGE_URL,
            language_code=LANGUAGE_CODE,
            rating=RATING,
            has_screenshot=False,
            has_session_info=False,
            status=general_feedback_models.STATUS_CHOICES_OPEN,
            message_count=2,
        )
        thread_model2.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.WebFeedbackThreadModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE,
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            general_feedback_models.WebFeedbackThreadModel.has_reference_to_user_id(
                self.USER_ID
            )
        )
        self.assertFalse(
            general_feedback_models.WebFeedbackThreadModel.has_reference_to_user_id(
                NONEXISTENT_USER_ID
            )
        )

    def test_get_model_associated_with_user_id(self) -> None:

        self.assertEqual(
            general_feedback_models.WebFeedbackThreadModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER,
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.WebFeedbackThreadModel.get_export_policy(),
            {
                'category': base_models.EXPORT_POLICY.EXPORTED,
                'target_type': base_models.EXPORT_POLICY.EXPORTED,
                'target_id': base_models.EXPORT_POLICY.EXPORTED,
                'original_author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'page_url': base_models.EXPORT_POLICY.EXPORTED,
                'language_code': base_models.EXPORT_POLICY.EXPORTED,
                'rating': base_models.EXPORT_POLICY.EXPORTED,
                'has_screenshot': base_models.EXPORT_POLICY.EXPORTED,
                'has_session_info': base_models.EXPORT_POLICY.EXPORTED,
                'status': base_models.EXPORT_POLICY.EXPORTED,
                'message_count': base_models.EXPORT_POLICY.EXPORTED,
                'created_on': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.EXPORTED,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_get_field_names_for_takeout(self) -> None:
        self.assertEqual(
            general_feedback_models.WebFeedbackThreadModel.get_field_names_for_takeout(),
            {
                'created_on': 'created_on_msec',
                'last_updated': 'last_updated_msec',
            },
        )

    def test_export_data(self) -> None:
        thread_with_session_info = (
            general_feedback_models.WebFeedbackThreadModel.get_by_id(THREAD_ID1)
        )
        thread_with_session_info.has_session_info = True
        thread_with_session_info.update_timestamps()
        thread_with_session_info.put()

        general_feedback_models.FeedbackSessionLogModel.create(
            THREAD_ID1,
            console_errors_json=[{'message': 'err'}],
            failed_requests_json=[{'url': '/test'}],
            navigation_history_json=[{'url': '/learn/math'}],
            environment_json={'user_agent': 'test-agent'},
        )
        session_log_model = (
            general_feedback_models.FeedbackSessionLogModel.get_by_id(
                THREAD_ID1
            )
        )

        export_data = (
            general_feedback_models.WebFeedbackThreadModel.export_data(
                self.USER_ID
            )
        )
        expected_export_data = {
            THREAD_ID1: (CATEGORY1, TARGET_TYPE_EXPLORATION),
            THREAD_ID2: (CATEGORY2, TARGET_TYPE_GENERAL),
        }
        self.assertEqual(
            set(export_data.keys()), set(expected_export_data.keys())
        )

        for thread_id, (
            expected_category,
            expected_target_type,
        ) in expected_export_data.items():
            thread_data = {
                'category': expected_category,
                'target_type': expected_target_type,
                'page_url': PAGE_URL,
                'language_code': LANGUAGE_CODE,
                'rating': RATING,
                'has_screenshot': False,
                'has_session_info': thread_id == THREAD_ID1,
                'session_info': (
                    session_log_model.to_dict()
                    if thread_id == THREAD_ID1
                    else None
                ),
                'status': general_feedback_models.STATUS_CHOICES_OPEN,
                'message_count': 2,
                'created_on': utils.get_time_in_millisecs(
                    general_feedback_models.WebFeedbackThreadModel.get_by_id(
                        thread_id
                    ).created_on
                ),
                'last_updated': utils.get_time_in_millisecs(
                    general_feedback_models.WebFeedbackThreadModel.get_by_id(
                        thread_id
                    ).last_updated
                ),
            }

            if expected_target_type == TARGET_TYPE_EXPLORATION:
                thread_data['target_id'] = LESSON_TARGET_ID

            self.assertEqual(
                export_data[thread_id],
                thread_data,
            )

    def test_get_filtered_query_of_feedback_threads(self) -> None:
        # Test filtering by category.
        # Here we use cast because NDB query.fetch() loses concrete model typing.
        threads = cast(
            Sequence[general_feedback_models.WebFeedbackThreadModel],
            general_feedback_models.WebFeedbackThreadModel.get_filtered_query_of_feedback_threads(
                category_filter=CATEGORY1
            ).fetch(),
        )
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, THREAD_ID1)
        # Test filtering by status.
        # Here we use cast because NDB query.fetch() loses concrete model typing.
        threads = cast(
            Sequence[general_feedback_models.WebFeedbackThreadModel],
            general_feedback_models.WebFeedbackThreadModel.get_filtered_query_of_feedback_threads(
                status_filter=general_feedback_models.STATUS_CHOICES_OPEN
            ).fetch(),
        )
        self.assertEqual(len(threads), 2)
        self.assertEqual(
            {thread.id for thread in threads}, {THREAD_ID1, THREAD_ID2}
        )

        # Test filtering by target_type.
        # Here we use cast because NDB query.fetch() loses concrete model typing.
        threads = cast(
            Sequence[general_feedback_models.WebFeedbackThreadModel],
            general_feedback_models.WebFeedbackThreadModel.get_filtered_query_of_feedback_threads(
                target_type_filter=TARGET_TYPE_GENERAL
            ).fetch(),
        )
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, THREAD_ID2)

        # Test filtering by target_id.
        # Here we use cast because NDB query.fetch() loses concrete model typing.
        threads = cast(
            Sequence[general_feedback_models.WebFeedbackThreadModel],
            general_feedback_models.WebFeedbackThreadModel.get_filtered_query_of_feedback_threads(
                target_id_filter=LESSON_TARGET_ID
            ).fetch(),
        )
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, THREAD_ID1)

        # Test filtering by date range.
        # Here we use cast because NDB query.fetch() loses concrete model typing.
        now = datetime.datetime.utcnow()
        threads = cast(
            Sequence[general_feedback_models.WebFeedbackThreadModel],
            general_feedback_models.WebFeedbackThreadModel.get_filtered_query_of_feedback_threads(
                date_from=now - datetime.timedelta(days=1),
                date_to=now + datetime.timedelta(days=1),
            ).fetch(),
        )
        self.assertEqual(len(threads), 2)
        self.assertEqual(
            {thread.id for thread in threads}, {THREAD_ID1, THREAD_ID2}
        )
        # Test filtering by category and target_type.
        # Here we use cast because NDB query.fetch() loses concrete model typing.
        threads = cast(
            Sequence[general_feedback_models.WebFeedbackThreadModel],
            general_feedback_models.WebFeedbackThreadModel.get_filtered_query_of_feedback_threads(
                category_filter=CATEGORY1,
                target_type_filter=TARGET_TYPE_EXPLORATION,
            ).fetch(),
        )
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, THREAD_ID1)

    def test_fetch_page_of_feedback_threads(self) -> None:
        seen_thread_ids: List[str] = []
        cursor = None

        while True:
            threads, cursor, more = (
                general_feedback_models.WebFeedbackThreadModel.fetch_page_of_feedback_threads(
                    page_size=1, cursor=cursor
                )
            )
            self.assertLessEqual(len(threads), 1)
            seen_thread_ids.extend(thread.id for thread in threads)
            if not more:
                break

        self.assertEqual(set(seen_thread_ids), {THREAD_ID1, THREAD_ID2})

    def test_generate_new_thread_id(self) -> None:
        new_thread_id = general_feedback_models.WebFeedbackThreadModel.generate_new_thread_id(
            entity_type=TARGET_TYPE_EXPLORATION, entity_id='new_exp_id'
        )
        self.assertTrue(new_thread_id.startswith('exploration.new_exp_id.'))

        new_thread_id = general_feedback_models.WebFeedbackThreadModel.generate_new_thread_id(
            entity_type=TARGET_TYPE_GENERAL,
            entity_id='new_platform_target',
        )
        self.assertTrue(
            new_thread_id.startswith('general.new_platform_target.')
        )

    def test_generate_new_thread_id_raises_error_after_many_collisions(
        self,
    ) -> None:
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get_by_id',
            lambda _: object(),
        ):
            with self.assertRaisesRegex(
                Exception,
                'New thread ID generator is producing too many collisions',
            ):
                general_feedback_models.WebFeedbackThreadModel.generate_new_thread_id(
                    entity_type=TARGET_TYPE_GENERAL,
                    entity_id='new_platform_target',
                )

    def test_create(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Lesson feedback must have target_type'
        ):
            general_feedback_models.WebFeedbackThreadModel.create(
                category=CATEGORY1,
                target_type=TARGET_TYPE_GENERAL,
                target_id='new_platform_target',
                original_author_id=self.USER_ID,
                page_url=PAGE_URL,
                language_code=LANGUAGE_CODE,
                rating=RATING,
                has_screenshot=False,
                has_session_info=False,
            )

        with self.assertRaisesRegex(
            ValueError, 'Platform feedback must have target_type'
        ):
            general_feedback_models.WebFeedbackThreadModel.create(
                category=CATEGORY2,
                target_type=TARGET_TYPE_EXPLORATION,
                target_id='new_exp_id',
                original_author_id=self.USER_ID,
                page_url=PAGE_URL,
                language_code=LANGUAGE_CODE,
                rating=RATING,
                has_screenshot=False,
                has_session_info=False,
            )

        new_thread_id = general_feedback_models.WebFeedbackThreadModel.create(
            category=CATEGORY1,
            target_type=TARGET_TYPE_EXPLORATION,
            target_id='new_exp_id',
            original_author_id=self.USER_ID,
            page_url=PAGE_URL,
            language_code=LANGUAGE_CODE,
            rating=RATING,
            has_screenshot=False,
            has_session_info=False,
        )
        thread_model = general_feedback_models.WebFeedbackThreadModel.get_by_id(
            new_thread_id
        )
        self.assertIsNotNone(thread_model)
        self.assertEqual(thread_model.category, CATEGORY1)
        self.assertEqual(thread_model.target_type, TARGET_TYPE_EXPLORATION)
        self.assertEqual(thread_model.target_id, 'new_exp_id')
        self.assertEqual(thread_model.original_author_id, self.USER_ID)
        self.assertEqual(thread_model.page_url, PAGE_URL)
        self.assertEqual(thread_model.language_code, LANGUAGE_CODE)
        self.assertEqual(thread_model.rating, RATING)
        self.assertFalse(thread_model.has_screenshot)
        self.assertFalse(thread_model.has_session_info)
        self.assertEqual(
            thread_model.status, general_feedback_models.STATUS_CHOICES_OPEN
        )
        self.assertEqual(thread_model.message_count, 0)


class WebFeedbackMessageModelTests(test_utils.GenericTestBase):
    """Tests for WebFeedbackMessageModel."""

    def setUp(self) -> None:
        super().setUp()

        self.signup('learner@example.com', 'learner')
        self.USER_ID = self.get_user_id_from_email('learner@example.com')
        second_user_email = 'feedbackadmin@example.com'
        self.signup(second_user_email, 'feedback')
        second_user_id = self.get_user_id_from_email(second_user_email)

        self.message_id1 = (
            general_feedback_models.WebFeedbackMessageModel.create(
                thread_id=THREAD_ID1,
                message_index=0,
                author_id=self.USER_ID,
                author_status='learner',
                text='Test message',
                updated_status=general_feedback_models.STATUS_CHOICES_OPEN,
                screenshot_filename=None,
                screenshot_entity_id=None,
            )
        )
        self.message_id2 = (
            general_feedback_models.WebFeedbackMessageModel.create(
                thread_id=THREAD_ID1,
                message_index=1,
                author_id=self.USER_ID,
                author_status='learner',
                text='Test message 2',
                updated_status=general_feedback_models.STATUS_CHOICES_OPEN,
                screenshot_filename=None,
                screenshot_entity_id=None,
            )
        )
        self.message_id3 = (
            general_feedback_models.WebFeedbackMessageModel.create(
                thread_id=THREAD_ID2,
                message_index=0,
                author_id=second_user_id,
                author_status='feedback_admin',
                text='Admin reply',
                updated_status=general_feedback_models.STATUS_CHOICES_FIXED,
                screenshot_filename='reply.png',
                screenshot_entity_id='entity_1',
            )
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.WebFeedbackMessageModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE,
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            general_feedback_models.WebFeedbackMessageModel.has_reference_to_user_id(
                self.USER_ID
            )
        )

    def test_get_model_associated_with_user_id(self) -> None:

        self.assertEqual(
            general_feedback_models.WebFeedbackMessageModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER,
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            general_feedback_models.WebFeedbackMessageModel.get_export_policy(),
            {
                'thread_id': base_models.EXPORT_POLICY.EXPORTED,
                'message_index': base_models.EXPORT_POLICY.EXPORTED,
                'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'author_status': base_models.EXPORT_POLICY.EXPORTED,
                'text': base_models.EXPORT_POLICY.EXPORTED,
                'updated_status': base_models.EXPORT_POLICY.EXPORTED,
                'screenshot_filename': base_models.EXPORT_POLICY.EXPORTED,
                'screenshot_entity_id': base_models.EXPORT_POLICY.EXPORTED,
                'created_on': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.EXPORTED,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_get_field_names_for_takeout(self) -> None:
        self.assertEqual(
            general_feedback_models.WebFeedbackMessageModel.get_field_names_for_takeout(),
            {
                'created_on': 'created_on_msec',
                'last_updated': 'last_updated_msec',
            },
        )

    def test_export_data(self) -> None:
        message_model1 = (
            general_feedback_models.WebFeedbackMessageModel.get_by_id(
                self.message_id1
            )
        )
        message_model2 = (
            general_feedback_models.WebFeedbackMessageModel.get_by_id(
                self.message_id2
            )
        )
        expected_export_data = {
            self.message_id1: {
                'thread_id': THREAD_ID1,
                'message_index': 0,
                'author_status': 'learner',
                'text': 'Test message',
                'updated_status': general_feedback_models.STATUS_CHOICES_OPEN,
                'screenshot_filename': None,
                'screenshot_entity_id': None,
                'created_on_msec': utils.get_time_in_millisecs(
                    message_model1.created_on
                ),
                'last_updated_msec': utils.get_time_in_millisecs(
                    message_model1.last_updated
                ),
            },
            self.message_id2: {
                'thread_id': THREAD_ID1,
                'message_index': 1,
                'author_status': 'learner',
                'text': 'Test message 2',
                'updated_status': general_feedback_models.STATUS_CHOICES_OPEN,
                'screenshot_filename': None,
                'screenshot_entity_id': None,
                'created_on_msec': utils.get_time_in_millisecs(
                    message_model2.created_on
                ),
                'last_updated_msec': utils.get_time_in_millisecs(
                    message_model2.last_updated
                ),
            },
        }
        export_data = (
            general_feedback_models.WebFeedbackMessageModel.export_data(
                self.USER_ID
            )
        )
        self.assertEqual(export_data, expected_export_data)

    def test_get_messages(self) -> None:
        messages1 = (
            general_feedback_models.WebFeedbackMessageModel.get_messages(
                THREAD_ID1
            )
        )
        self.assertEqual(len(messages1), 2)
        self.assertEqual(messages1[0].message_index, 0)
        self.assertEqual(messages1[0].text, 'Test message')
        self.assertEqual(messages1[1].message_index, 1)
        self.assertEqual(messages1[1].text, 'Test message 2')

        messages2 = (
            general_feedback_models.WebFeedbackMessageModel.get_messages(
                THREAD_ID2
            )
        )
        self.assertEqual(len(messages2), 1)
        self.assertEqual(messages2[0].message_index, 0)
        self.assertEqual(messages2[0].text, 'Admin reply')

    def test_get_messages_by_thread_ids(self) -> None:
        messages = general_feedback_models.WebFeedbackMessageModel.get_messages_by_thread_ids(
            [THREAD_ID1, THREAD_ID2]
        )
        self.assertEqual(set(messages.keys()), {THREAD_ID1, THREAD_ID2})
        self.assertEqual(len(messages[THREAD_ID1]), 2)
        self.assertEqual(messages[THREAD_ID1][0].message_index, 0)
        self.assertEqual(messages[THREAD_ID1][0].text, 'Test message')
        self.assertEqual(messages[THREAD_ID1][1].message_index, 1)
        self.assertEqual(messages[THREAD_ID1][1].text, 'Test message 2')
        self.assertEqual(len(messages[THREAD_ID2]), 1)
        self.assertEqual(messages[THREAD_ID2][0].message_index, 0)
        self.assertEqual(messages[THREAD_ID2][0].text, 'Admin reply')

        messages = general_feedback_models.WebFeedbackMessageModel.get_messages_by_thread_ids(
            []
        )
        self.assertEqual(messages, {})

    def test_get_message_count_for_thread(self) -> None:
        message_count1 = general_feedback_models.WebFeedbackMessageModel.get_message_count_for_thread(
            THREAD_ID1
        )
        self.assertEqual(message_count1, 2)

        message_count2 = general_feedback_models.WebFeedbackMessageModel.get_message_count_for_thread(
            THREAD_ID2
        )
        self.assertEqual(message_count2, 1)

    def test_create(self) -> None:
        message_id = general_feedback_models.WebFeedbackMessageModel.create(
            thread_id=THREAD_ID1,
            message_index=2,
            author_id=self.USER_ID,
            author_status='learner',
            text='Test message 3',
            updated_status=general_feedback_models.STATUS_CHOICES_OPEN,
            screenshot_filename=None,
            screenshot_entity_id=None,
        )
        message_model = (
            general_feedback_models.WebFeedbackMessageModel.get_by_id(
                message_id
            )
        )
        self.assertEqual(message_model.text, 'Test message 3')
        self.assertEqual(message_model.message_index, 2)
        self.assertEqual(message_model.author_id, self.USER_ID)
        self.assertEqual(message_model.author_status, 'learner')
        self.assertEqual(
            message_model.updated_status,
            general_feedback_models.STATUS_CHOICES_OPEN,
        )
        self.assertIsNone(message_model.screenshot_filename)
        self.assertIsNone(message_model.screenshot_entity_id)

    def test_create_raises_error_for_duplicate_message_id(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Message with ID %s already exists.' % self.message_id1
        ):
            general_feedback_models.WebFeedbackMessageModel.create(
                thread_id=THREAD_ID1,
                message_index=0,
                author_id=self.USER_ID,
                author_status='learner',
                text='Test duplicate message',
                updated_status=general_feedback_models.STATUS_CHOICES_OPEN,
                screenshot_filename=None,
                screenshot_entity_id=None,
            )


class FeedbackSessionLogModelTests(test_utils.GenericTestBase):
    """Tests for FeedbackSessionLogModel."""

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
                'console_errors_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'failed_requests_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'navigation_history_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'environment_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_create(self) -> None:
        general_feedback_models.FeedbackSessionLogModel.create(
            thread_id=THREAD_ID1,
            console_errors_json=[{'message': 'err'}],
            failed_requests_json=[{'url': '/test'}],
            navigation_history_json=[{'url': '/learn/math'}],
            environment_json={'user_agent': 'test-agent'},
        )
        session_log_model = (
            general_feedback_models.FeedbackSessionLogModel.get_by_id(
                THREAD_ID1
            )
        )
        self.assertIsNotNone(session_log_model)
        self.assertEqual(session_log_model.id, THREAD_ID1)
        self.assertEqual(
            session_log_model.console_errors_json, [{'message': 'err'}]
        )
        self.assertEqual(
            session_log_model.failed_requests_json, [{'url': '/test'}]
        )
        self.assertEqual(
            session_log_model.navigation_history_json,
            [{'url': '/learn/math'}],
        )
        self.assertEqual(
            session_log_model.environment_json, {'user_agent': 'test-agent'}
        )

    def test_create_raises_error_for_duplicate_thread_id(self) -> None:
        general_feedback_models.FeedbackSessionLogModel.create(
            thread_id=THREAD_ID1,
            console_errors_json=[{'message': 'err'}],
            failed_requests_json=[{'url': '/test'}],
            navigation_history_json=[{'url': '/learn/math'}],
            environment_json={'user_agent': 'test-agent'},
        )
        with self.assertRaisesRegex(
            Exception,
            'Session log for thread ID %s already exists.' % THREAD_ID1,
        ):
            general_feedback_models.FeedbackSessionLogModel.create(
                thread_id=THREAD_ID1,
                console_errors_json=[{'message': 'err2'}],
                failed_requests_json=[{'url': '/test2'}],
                navigation_history_json=[{'url': '/learn/science'}],
                environment_json={'user_agent': 'test-agent-2'},
            )
