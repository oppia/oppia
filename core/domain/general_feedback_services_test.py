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

import datetime
from unittest import mock

from core.domain import (
    fs_services,
    general_feedback_domain,
    general_feedback_services,
    subscription_services,
)
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models, general_feedback_models

(feedback_models, general_feedback_models) = models.Registry.import_models(
    [models.Names.FEEDBACK, models.Names.GENERAL_FEEDBACK]
)


class _FakeThreadUserModel:
    """Fake thread user model for tests."""

    def __init__(self, message_ids_read_by_user: list[int]) -> None:
        self.message_ids_read_by_user = message_ids_read_by_user
        self.update_timestamps_called = False
        self.put_called = False

    def update_timestamps(self) -> None:
        """Marks timestamp update call."""
        self.update_timestamps_called = True

    def put(self) -> None:
        """Marks put call."""
        self.put_called = True


class _FakeThreadModel:
    """Fake thread model for tests."""

    def __init__(
        self,
        thread_id: str = 'tid',
        deleted: bool = False,
        status: str = 'open',
    ) -> None:
        self.id = thread_id
        self.deleted = deleted
        self.status = status
        self.category = 'lesson'
        self.page_url = '/learn'
        self.language_code = 'en'
        self.rating = 4
        self.has_screenshot = False
        self.target_type = 'exploration'
        self.target_id = 'exp1'
        self.original_author_id = 'uid'
        self.has_session_info = False
        self.created_on = datetime.datetime.utcfromtimestamp(1)
        self.message_count = 0
        self.update_timestamps_called = False
        self.put_called = False

    def update_timestamps(self) -> None:
        """Marks timestamp update call."""
        self.update_timestamps_called = True

    def put(self) -> None:
        """Marks put call."""
        self.put_called = True


class _FakeMessageModel:
    """Fake message model for tests."""

    def __init__(self) -> None:
        self.message_index = 2
        self.author_status = 'learner'
        self.author_id = 'uid'
        self.text = 'text'
        self.screenshot_filename = None
        self.screenshot_entity_id = None
        self.updated_status = None
        self.created_on = datetime.datetime.utcfromtimestamp(1)


class GeneralFeedbackServicesTests(test_utils.GenericTestBase):
    """Tests for general feedback services."""

    def test_get_platform_target_id_from_page_url(self) -> None:
        target_id_1 = (
            general_feedback_services.get_platform_target_id_from_page_url(
                '/learn'
            )
        )
        target_id_2 = (
            general_feedback_services.get_platform_target_id_from_page_url(
                '/learn'
            )
        )
        target_id_3 = (
            general_feedback_services.get_platform_target_id_from_page_url(
                '/contact'
            )
        )
        self.assertEqual(target_id_1, target_id_2)
        self.assertNotEqual(target_id_1, target_id_3)

    def test_add_message_id_to_read_by_user_creates_model_when_missing(
        self,
    ) -> None:
        created_model = _FakeThreadUserModel([])
        with self.swap(
            feedback_models.GeneralFeedbackThreadUserModel,
            'get',
            mock.Mock(return_value=None),
        ):
            with self.swap(
                feedback_models.GeneralFeedbackThreadUserModel,
                'create',
                mock.Mock(return_value=created_model),
            ):
                getattr(
                    general_feedback_services, '_add_message_id_to_read_by_user'
                )('uid', 'tid', 3)

        self.assertEqual(created_model.message_ids_read_by_user, [3])
        self.assertTrue(created_model.update_timestamps_called)
        self.assertTrue(created_model.put_called)

    def test_add_message_id_to_read_by_user_does_not_duplicate(self) -> None:
        thread_user_model = _FakeThreadUserModel([1, 2])
        with self.swap(
            feedback_models.GeneralFeedbackThreadUserModel,
            'get',
            mock.Mock(return_value=thread_user_model),
        ):
            getattr(
                general_feedback_services, '_add_message_id_to_read_by_user'
            )('uid', 'tid', 2)
        self.assertEqual(thread_user_model.message_ids_read_by_user, [1, 2])
        self.assertFalse(thread_user_model.update_timestamps_called)
        self.assertFalse(thread_user_model.put_called)

    def test_get_message_ids_read_by_user(self) -> None:
        with self.swap(
            feedback_models.GeneralFeedbackThreadUserModel,
            'get',
            mock.Mock(return_value=None),
        ):
            self.assertEqual(
                general_feedback_services.get_message_ids_read_by_user(
                    'uid', 'tid'
                ),
                set(),
            )

        with self.swap(
            feedback_models.GeneralFeedbackThreadUserModel,
            'get',
            mock.Mock(return_value=_FakeThreadUserModel([1, 2, 2])),
        ):
            self.assertEqual(
                general_feedback_services.get_message_ids_read_by_user(
                    'uid', 'tid'
                ),
                {1, 2},
            )

    def test_update_messages_read_by_the_user(self) -> None:
        created_model = _FakeThreadUserModel([])
        with self.swap(
            feedback_models.GeneralFeedbackThreadUserModel,
            'get',
            mock.Mock(return_value=None),
        ):
            with self.swap(
                feedback_models.GeneralFeedbackThreadUserModel,
                'create',
                mock.Mock(return_value=created_model),
            ):
                general_feedback_services.update_messages_read_by_the_user(
                    'uid', 'tid', [3, 1, 3, 2]
                )

        self.assertEqual(created_model.message_ids_read_by_user, [1, 2, 3])
        self.assertTrue(created_model.update_timestamps_called)
        self.assertTrue(created_model.put_called)

    def test_update_messages_read_by_the_user_when_model_exists(self) -> None:
        existing_model = _FakeThreadUserModel([8, 9])
        with self.swap(
            feedback_models.GeneralFeedbackThreadUserModel,
            'get',
            mock.Mock(return_value=existing_model),
        ):
            general_feedback_services.update_messages_read_by_the_user(
                'uid', 'tid', [5, 4, 4]
            )

        self.assertEqual(existing_model.message_ids_read_by_user, [4, 5])
        self.assertTrue(existing_model.update_timestamps_called)
        self.assertTrue(existing_model.put_called)

    def test_create_thread_raises_error_when_target_id_missing(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'target_id must be provided for Lesson feedback.'
        ):
            general_feedback_services.create_thread(
                category='lesson',
                description='desc',
                page_url='/learn',
                language_code='en',
                rating=4,
                target_type='exploration',
                target_id=None,
            )

    def test_create_thread_for_platform_feedback(self) -> None:
        thread_model = _FakeThreadModel(thread_id='t-1')
        create_thread_mock = mock.Mock(return_value='t-1')
        create_message_mock = mock.Mock()
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'create',
            create_thread_mock,
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'create',
                create_message_mock,
            ):
                with self.swap(
                    general_feedback_models.WebFeedbackThreadModel,
                    'get',
                    mock.Mock(return_value=thread_model),
                ):
                    thread_id = general_feedback_services.create_thread(
                        category=(general_feedback_models.CATEGORY_PLATFORM),
                        description='desc',
                        page_url='/learn',
                        language_code='en',
                        rating=4,
                        target_type='general',
                        target_id=None,
                    )

        self.assertEqual(thread_id, 't-1')
        self.assertEqual(
            create_thread_mock.call_args.kwargs['target_id'], mock.ANY
        )
        self.assertEqual(thread_model.message_count, 1)
        self.assertTrue(thread_model.update_timestamps_called)
        self.assertTrue(thread_model.put_called)
        self.assertEqual(
            create_message_mock.call_args.kwargs['message_index'], 0
        )

    def test_create_thread_with_session_info_and_user(self) -> None:
        thread_model = _FakeThreadModel(thread_id='t-2')
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'create',
            mock.Mock(return_value='t-2'),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'create',
                mock.Mock(),
            ):
                with self.swap(
                    general_feedback_models.WebFeedbackThreadModel,
                    'get',
                    mock.Mock(return_value=thread_model),
                ):
                    create_session_log_mock = mock.Mock()
                    with self.swap(
                        general_feedback_models.FeedbackSessionLogModel,
                        'create',
                        create_session_log_mock,
                    ):
                        subscribe_mock = mock.Mock()
                        with self.swap(
                            subscription_services,
                            'subscribe_to_threads',
                            subscribe_mock,
                        ):
                            add_read_mock = mock.Mock()
                            with self.swap(
                                general_feedback_services,
                                '_add_message_id_to_read_by_user',
                                add_read_mock,
                            ):
                                general_feedback_services.create_thread(
                                    category='lesson',
                                    description='desc',
                                    page_url='/learn',
                                    language_code='en',
                                    rating=3,
                                    target_type='exploration',
                                    target_id='exp1',
                                    session_info={
                                        'console_errors_json': 'bad',
                                        'failed_requests_json': {},
                                        'navigation_history_json': 'bad',
                                        'environment_json': [],
                                    },
                                    user_id='uid',
                                )

        self.assertEqual(
            create_session_log_mock.call_args.kwargs['console_errors_json'], []
        )
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['failed_requests_json'], []
        )
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['navigation_history_json'],
            [],
        )
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['environment_json'], {}
        )
        subscribe_mock.assert_called_once_with('uid', ['t-2'])
        add_read_mock.assert_called_once_with('uid', 't-2', 0)

    def test_create_thread_with_valid_session_info_and_no_user(self) -> None:
        console_errors = [{'message': 'error'}]
        failed_requests = [{'status': 500}]
        navigation_history = [{'url': '/learn'}]
        environment = {'browser': 'Chrome'}
        create_session_log_mock = mock.Mock()
        subscribe_mock = mock.Mock()

        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'create',
            mock.Mock(return_value='t-2'),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'create',
                mock.Mock(),
            ):
                with self.swap(
                    general_feedback_models.WebFeedbackThreadModel,
                    'get',
                    mock.Mock(return_value=None),
                ):
                    with self.swap(
                        general_feedback_models.FeedbackSessionLogModel,
                        'create',
                        create_session_log_mock,
                    ):
                        with self.swap(
                            subscription_services,
                            'subscribe_to_threads',
                            subscribe_mock,
                        ):
                            thread_id = general_feedback_services.create_thread(
                                category='lesson',
                                description='desc',
                                page_url='/learn',
                                language_code='en',
                                rating=3,
                                target_type='exploration',
                                target_id='exp1',
                                session_info={
                                    'console_errors_json': console_errors,
                                    'failed_requests_json': failed_requests,
                                    'navigation_history_json': (
                                        navigation_history
                                    ),
                                    'environment_json': environment,
                                },
                                user_id=None,
                            )

        self.assertEqual(thread_id, 't-2')
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['console_errors_json'],
            console_errors,
        )
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['failed_requests_json'],
            failed_requests,
        )
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['navigation_history_json'],
            navigation_history,
        )
        self.assertEqual(
            create_session_log_mock.call_args.kwargs['environment_json'],
            environment,
        )
        subscribe_mock.assert_not_called()

    def test_create_message_without_author_subscription(self) -> None:
        thread_model = _FakeThreadModel(thread_id='t-3', status='open')
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=thread_model),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_message_count_for_thread',
                mock.Mock(return_value=2),
            ):
                with self.swap(
                    general_feedback_models.WebFeedbackMessageModel,
                    'create',
                    mock.Mock(),
                ):
                    with self.swap(
                        general_feedback_models.WebFeedbackMessageModel,
                        'get_by_id',
                        mock.Mock(return_value=_FakeMessageModel()),
                    ):
                        subscribe_mock = mock.Mock()
                        with self.swap(
                            subscription_services,
                            'subscribe_to_threads',
                            subscribe_mock,
                        ):
                            result = general_feedback_services.create_message(
                                thread_id='t-3',
                                text='msg',
                                author_status='learner',
                                author_id=None,
                            )

        self.assertEqual(result.message_index, 2)
        self.assertEqual(thread_model.message_count, 3)
        self.assertEqual(thread_model.status, 'open')
        self.assertTrue(thread_model.update_timestamps_called)
        self.assertTrue(thread_model.put_called)
        subscribe_mock.assert_not_called()

    def test_create_message_with_status_and_author_subscription(self) -> None:
        thread_model = _FakeThreadModel(thread_id='t-4', status='open')
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=thread_model),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_message_count_for_thread',
                mock.Mock(return_value=0),
            ):
                with self.swap(
                    general_feedback_models.WebFeedbackMessageModel,
                    'create',
                    mock.Mock(),
                ):
                    with self.swap(
                        general_feedback_models.WebFeedbackMessageModel,
                        'get_by_id',
                        mock.Mock(return_value=_FakeMessageModel()),
                    ):
                        subscribe_mock = mock.Mock()
                        with self.swap(
                            subscription_services,
                            'subscribe_to_threads',
                            subscribe_mock,
                        ):
                            add_read_mock = mock.Mock()
                            with self.swap(
                                general_feedback_services,
                                '_add_message_id_to_read_by_user',
                                add_read_mock,
                            ):
                                general_feedback_services.create_message(
                                    thread_id='t-4',
                                    text='msg',
                                    author_status='feedback_admin',
                                    author_id='uid',
                                    updated_status='fixed',
                                )

        self.assertEqual(thread_model.status, 'fixed')
        subscribe_mock.assert_called_once_with('uid', ['t-4'])
        add_read_mock.assert_called_once_with('uid', 't-4', 0)

    def test_create_message_raises_error_for_invalid_thread_id(self) -> None:
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=None),
        ):
            with self.assertRaisesRegex(ValueError, 'Invalid thread ID: t-4'):
                general_feedback_services.create_message(
                    thread_id='t-4',
                    text='msg',
                    author_status='feedback_admin',
                    author_id='uid',
                )

    def test_create_message_raises_error_when_message_not_created(self) -> None:
        thread_model = _FakeThreadModel(thread_id='t-4', status='open')
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=thread_model),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_message_count_for_thread',
                mock.Mock(return_value=0),
            ):
                with self.swap(
                    general_feedback_models.WebFeedbackMessageModel,
                    'create',
                    mock.Mock(),
                ):
                    with self.swap(
                        general_feedback_models.WebFeedbackMessageModel,
                        'get_by_id',
                        mock.Mock(return_value=None),
                    ):
                        with self.assertRaisesRegex(
                            ValueError,
                            'Message was not created for thread ID: t-4',
                        ):
                            general_feedback_services.create_message(
                                thread_id='t-4',
                                text='msg',
                                author_status='feedback_admin',
                                author_id='uid',
                            )

    def test_message_model_to_domain(self) -> None:
        message_model = _FakeMessageModel()
        message = getattr(
            general_feedback_services, '_message_model_to_domain'
        )(message_model)
        self.assertEqual(message.message_index, 2)
        self.assertEqual(message.author_id, 'uid')
        self.assertEqual(message.text, 'text')

    def test_thread_model_to_domain(self) -> None:
        model = mock.Mock()
        model.id = 't1'
        model.category = 'lesson'
        model.target_type = 'exploration'
        model.original_author_id = 'uid'
        model.message_count = 1
        model.status = 'open'
        model.page_url = '/learn'
        model.language_code = 'en'
        model.rating = 5
        model.has_screenshot = False
        model.target_id = 'exp1'
        model.created_on = datetime.datetime.utcfromtimestamp(1)
        messages = [
            general_feedback_domain.WebFeedbackMessage(
                message_index=0,
                author_id='uid',
                author_status='learner',
                text='desc',
                updated_status=None,
                screenshot_filename=None,
                screenshot_entity_id=None,
                created_on_msecs=1.0,
            )
        ]
        thread = getattr(general_feedback_services, '_thread_model_to_domain')(
            model, messages, {'console_errors_json': {}}
        )
        self.assertEqual(thread.id, 't1')
        self.assertEqual(thread.description, 'desc')

    def test_thread_model_to_domain_with_empty_messages(self) -> None:
        model = _FakeThreadModel(thread_id='t1')
        thread = getattr(general_feedback_services, '_thread_model_to_domain')(
            model, [], None
        )
        self.assertEqual(thread.description, '')

    def test_thread_model_to_summary_domain(self) -> None:
        model = _FakeThreadModel(thread_id='t1')
        model.has_session_info = True
        summary = getattr(
            general_feedback_services, '_thread_model_to_summary_domain'
        )(model, 'x' * 200)
        self.assertEqual(summary['id'], 't1')
        self.assertEqual(summary['has_session_info'], True)
        self.assertEqual(summary['description_preview'], 'x' * 140)

    def test_get_messages(self) -> None:
        with self.swap(
            general_feedback_models.WebFeedbackMessageModel,
            'get_messages',
            mock.Mock(return_value=[_FakeMessageModel()]),
        ):
            messages = general_feedback_services.get_messages('tid')
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].message_index, 2)

    def test_get_thread(self) -> None:
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=None),
        ):
            self.assertIsNone(general_feedback_services.get_thread('tid'))

        deleted_model = _FakeThreadModel(thread_id='tid', deleted=True)
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=deleted_model),
        ):
            self.assertIsNone(general_feedback_services.get_thread('tid'))

        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=deleted_model),
        ):
            with self.swap(
                general_feedback_services,
                '_thread_model_to_domain',
                lambda _model, _messages, _session_info: 'thread',
            ):
                with self.swap(
                    general_feedback_services,
                    'get_messages',
                    lambda _thread_id: [],
                ):
                    with self.swap(
                        general_feedback_services,
                        '_get_session_info_by_thread_ids',
                        lambda _thread_ids: {},
                    ):
                        deleted_model.deleted = False
                        self.assertEqual(
                            general_feedback_services.get_thread('tid'),
                            'thread',
                        )

    def test_get_session_info_by_thread_ids_returns_empty_for_empty_ids(
        self,
    ) -> None:
        get_multi_mock = mock.Mock()
        with self.swap(
            general_feedback_models.FeedbackSessionLogModel,
            'get_multi',
            get_multi_mock,
        ):
            session_info = getattr(
                general_feedback_services, '_get_session_info_by_thread_ids'
            )([])
        self.assertEqual(session_info, {})
        get_multi_mock.assert_not_called()

    def test_get_session_info_by_thread_ids_skips_missing_models(self) -> None:
        session_model = mock.Mock()
        session_model.id = 't1'
        session_model.to_dict.return_value = {
            'console_errors_json': [{'message': 'error'}]
        }
        with self.swap(
            general_feedback_models.FeedbackSessionLogModel,
            'get_multi',
            mock.Mock(return_value=[None, session_model]),
        ):
            session_info = getattr(
                general_feedback_services, '_get_session_info_by_thread_ids'
            )(['missing', 't1'])
        self.assertEqual(
            session_info,
            {'t1': {'console_errors_json': [{'message': 'error'}]}},
        )

    def test_get_threads_by_ids(self) -> None:
        self.assertEqual(general_feedback_services.get_threads_by_ids([]), [])

        model_1 = _FakeThreadModel(thread_id='t1', deleted=False)
        model_2 = _FakeThreadModel(thread_id='t2', deleted=True)
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get_multi',
            mock.Mock(return_value=[model_1, None, model_2]),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={'t1': [_FakeMessageModel()]}),
            ):
                with self.swap(
                    general_feedback_services,
                    '_get_session_info_by_thread_ids',
                    lambda _thread_ids: {},
                ):
                    threads = general_feedback_services.get_threads_by_ids(
                        ['t1', 'missing', 't2']
                    )

        self.assertEqual(threads[0]['id'], 't1')
        self.assertEqual(threads[0]['description_preview'], 'text')
        self.assertEqual(threads[0]['has_session_info'], False)

    def test_get_threads_by_ids_without_messages_uses_empty_preview(
        self,
    ) -> None:
        model = _FakeThreadModel(thread_id='t1', deleted=False)
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get_multi',
            mock.Mock(return_value=[model]),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={}),
            ):
                threads = general_feedback_services.get_threads_by_ids(['t1'])
        self.assertEqual(threads[0]['description_preview'], '')

    def test_get_threads_by_ids_does_not_fetch_session_info(self) -> None:
        model = _FakeThreadModel(thread_id='t1', deleted=False)
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get_multi',
            mock.Mock(return_value=[model]),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={'t1': [_FakeMessageModel()]}),
            ):
                get_session_info_mock = mock.Mock(return_value={})
                with self.swap(
                    general_feedback_services,
                    '_get_session_info_by_thread_ids',
                    get_session_info_mock,
                ):
                    general_feedback_services.get_threads_by_ids(['t1'])
        get_session_info_mock.assert_not_called()

    def test_get_threads_passes_filters_to_model_fetch(self) -> None:
        model = _FakeThreadModel(thread_id='t1')
        fetch_page_mock = mock.Mock(return_value=([model], 'cur2', True))
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'fetch_page_of_feedback_threads',
            fetch_page_mock,
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={'t1': [_FakeMessageModel()]}),
            ):
                output = general_feedback_services.get_threads(
                    page_size=10,
                    cursor='cur1',
                    category_filter='platform',
                    status_filter='open',
                    target_type_filter='general',
                    target_id_filter='tid',
                    date_from_msecs=1_000.0,
                    date_to_msecs=2_000.0,
                )
        self.assertEqual(len(output[0]), 1)
        self.assertEqual(output[0][0]['description_preview'], 'text')
        self.assertEqual(output[0][0]['id'], 't1')
        self.assertEqual(output[0][0]['has_session_info'], False)
        self.assertEqual(output[1:], ('cur2', True))
        self.assertEqual(fetch_page_mock.call_args.kwargs['page_size'], 10)
        self.assertEqual(fetch_page_mock.call_args.kwargs['cursor'], 'cur1')
        self.assertEqual(
            fetch_page_mock.call_args.kwargs['category_filter'], 'platform'
        )
        self.assertEqual(
            fetch_page_mock.call_args.kwargs['status_filter'], 'open'
        )

    def test_get_threads_normalizes_all_status_filter(self) -> None:
        model = _FakeThreadModel(thread_id='t1')
        fetch_page_mock = mock.Mock(return_value=([model], None, False))
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'fetch_page_of_feedback_threads',
            fetch_page_mock,
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={}),
            ):
                general_feedback_services.get_threads(
                    page_size=10,
                    status_filter='all',
                )
        self.assertIsNone(fetch_page_mock.call_args.kwargs['status_filter'])

        fetch_page_mock.reset_mock()
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'fetch_page_of_feedback_threads',
            fetch_page_mock,
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={}),
            ):
                general_feedback_services.get_threads(
                    page_size=10,
                    status_filter='ALL',
                )
        self.assertIsNone(fetch_page_mock.call_args.kwargs['status_filter'])

    def test_get_threads_ignores_invalid_status_filter(self) -> None:
        fetch_page_mock = mock.Mock(return_value=([], None, False))
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'fetch_page_of_feedback_threads',
            fetch_page_mock,
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={}),
            ):
                general_feedback_services.get_threads(
                    page_size=10,
                    status_filter='invalid',
                )
        self.assertIsNone(fetch_page_mock.call_args.kwargs['status_filter'])

    def test_get_threads_does_not_fetch_session_info(self) -> None:
        model = _FakeThreadModel(thread_id='t1')
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'fetch_page_of_feedback_threads',
            mock.Mock(return_value=([model], None, False)),
        ):
            with self.swap(
                general_feedback_models.WebFeedbackMessageModel,
                'get_messages_by_thread_ids',
                mock.Mock(return_value={'t1': [_FakeMessageModel()]}),
            ):
                get_session_info_mock = mock.Mock(return_value={})
                with self.swap(
                    general_feedback_services,
                    '_get_session_info_by_thread_ids',
                    get_session_info_mock,
                ):
                    general_feedback_services.get_threads(page_size=10)
        get_session_info_mock.assert_not_called()

    def test_update_thread_status(self) -> None:
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=None),
        ):
            self.assertFalse(
                general_feedback_services.update_thread_status('tid', 'open')
            )

        model = _FakeThreadModel(thread_id='tid', deleted=False, status='open')
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=model),
        ):
            self.assertFalse(
                general_feedback_services.update_thread_status('tid', 'invalid')
            )

        model.deleted = True
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=model),
        ):
            self.assertFalse(
                general_feedback_services.update_thread_status('tid', 'open')
            )

        model.deleted = False
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=model),
        ):
            self.assertTrue(
                general_feedback_services.update_thread_status('tid', 'fixed')
            )
        self.assertEqual(model.status, 'fixed')
        self.assertTrue(model.update_timestamps_called)
        self.assertTrue(model.put_called)

    def test_delete_thread(self) -> None:
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=None),
        ):
            self.assertFalse(general_feedback_services.delete_thread('tid'))

        model = _FakeThreadModel(thread_id='tid', deleted=True)
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=model),
        ):
            self.assertTrue(general_feedback_services.delete_thread('tid'))
        self.assertFalse(model.put_called)

        model.deleted = False
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'get',
            mock.Mock(return_value=model),
        ):
            self.assertTrue(general_feedback_services.delete_thread('tid'))
        self.assertTrue(model.deleted)
        self.assertTrue(model.update_timestamps_called)
        self.assertTrue(model.put_called)

    def test_delete_general_feedback_older_than(self) -> None:
        empty_query_mock = mock.Mock()
        empty_query_mock.filter.return_value = empty_query_mock
        empty_query_mock.fetch.return_value = []
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'query',
            mock.Mock(return_value=empty_query_mock),
        ):
            self.assertEqual(
                general_feedback_services.delete_general_feedback_older_than(
                    datetime.datetime.utcnow()
                ),
                0,
            )

        old_model_1 = _FakeThreadModel(thread_id='t1')
        old_model_2 = _FakeThreadModel(thread_id='t2')
        old_message_1 = mock.Mock(
            screenshot_entity_id='entity-1', screenshot_filename='file-1.png'
        )
        old_message_2 = mock.Mock(
            screenshot_entity_id='entity-2', screenshot_filename='file-2.png'
        )
        query_mock = mock.Mock()
        query_mock.filter.return_value = query_mock
        query_mock.fetch.return_value = [old_model_1, old_model_2]
        delete_sessions_mock = mock.Mock()
        delete_message_mock = mock.Mock()
        delete_screenshots_mock = mock.Mock()
        delete_threads_mock = mock.Mock()
        call_order: list[tuple[str, str, str] | tuple[str, mock.Mock]] = []

        def _delete_screenshot_side_effect(
            screenshot_entity_id: str, screenshot_filename: str
        ) -> None:
            call_order.append(
                ('screenshot', screenshot_entity_id, screenshot_filename)
            )

        def _delete_message_side_effect(message_model: mock.Mock) -> None:
            call_order.append(('message', message_model))

        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'query',
            mock.Mock(return_value=query_mock),
        ):
            with self.swap(
                general_feedback_models.FeedbackSessionLogModel,
                'get_multi',
                mock.Mock(return_value=[None, mock.Mock()]),
            ):
                with self.swap(
                    general_feedback_models.FeedbackSessionLogModel,
                    'delete_multi',
                    delete_sessions_mock,
                ):
                    with self.swap(
                        general_feedback_services,
                        '_delete_feedback_screenshot_files',
                        delete_screenshots_mock,
                    ):
                        with self.swap(
                            general_feedback_models.WebFeedbackMessageModel,
                            'delete',
                            delete_message_mock,
                        ):
                            with self.swap(
                                general_feedback_models.WebFeedbackThreadModel,
                                'delete_multi',
                                delete_threads_mock,
                            ):
                                with self.swap(
                                    general_feedback_models.WebFeedbackMessageModel,
                                    'get_messages',
                                    mock.Mock(
                                        side_effect=[
                                            [old_message_1],
                                            [old_message_2],
                                        ]
                                    ),
                                ):
                                    delete_screenshots_mock.side_effect = (
                                        _delete_screenshot_side_effect
                                    )
                                    delete_message_mock.side_effect = (
                                        _delete_message_side_effect
                                    )
                                    deleted_count = general_feedback_services.delete_general_feedback_older_than(
                                        datetime.datetime.utcnow()
                                    )

        self.assertEqual(deleted_count, 2)
        delete_sessions_mock.assert_called_once()
        self.assertEqual(
            delete_screenshots_mock.call_args_list,
            [
                mock.call('entity-1', 'file-1.png'),
                mock.call('entity-2', 'file-2.png'),
            ],
        )
        self.assertEqual(
            delete_message_mock.call_args_list,
            [mock.call(old_message_1), mock.call(old_message_2)],
        )
        self.assertEqual(
            call_order,
            [
                ('screenshot', 'entity-1', 'file-1.png'),
                ('message', old_message_1),
                ('screenshot', 'entity-2', 'file-2.png'),
                ('message', old_message_2),
            ],
        )
        delete_threads_mock.assert_called_once_with([old_model_1, old_model_2])

    def test_delete_general_feedback_older_than_with_no_session_models(
        self,
    ) -> None:
        old_model = _FakeThreadModel(thread_id='t1')
        query_mock = mock.Mock()
        query_mock.filter.return_value = query_mock
        query_mock.fetch.return_value = [old_model]
        delete_sessions_mock = mock.Mock()
        with self.swap(
            general_feedback_models.WebFeedbackThreadModel,
            'query',
            mock.Mock(return_value=query_mock),
        ):
            with self.swap(
                general_feedback_models.FeedbackSessionLogModel,
                'get_multi',
                mock.Mock(return_value=[None]),
            ):
                with self.swap(
                    general_feedback_models.FeedbackSessionLogModel,
                    'delete_multi',
                    delete_sessions_mock,
                ):
                    with self.swap(
                        general_feedback_models.WebFeedbackMessageModel,
                        'get_messages',
                        mock.Mock(return_value=[]),
                    ):
                        with self.swap(
                            general_feedback_models.WebFeedbackThreadModel,
                            'delete_multi',
                            mock.Mock(),
                        ):
                            deleted_count = general_feedback_services.delete_general_feedback_older_than(
                                datetime.datetime.utcnow()
                            )
        self.assertEqual(deleted_count, 1)
        delete_sessions_mock.assert_not_called()

    def test_delete_feedback_screenshot_files_early_return(self) -> None:
        gcs_ctor = mock.Mock()
        delete_feedback_screenshot_files = getattr(
            general_feedback_services, '_delete_feedback_screenshot_files'
        )
        with self.swap(fs_services, 'GcsFileSystem', gcs_ctor):
            delete_feedback_screenshot_files(None, 'abc.png')
            delete_feedback_screenshot_files('entity-1', None)
        gcs_ctor.assert_not_called()

    def test_delete_feedback_screenshot_files_ignores_ioerror(self) -> None:
        file_system = mock.Mock()
        file_system.delete.side_effect = [
            IOError('boom'),
            None,
            IOError('boom2'),
        ]
        delete_feedback_screenshot_files = getattr(
            general_feedback_services, '_delete_feedback_screenshot_files'
        )
        with self.swap(
            fs_services, 'GcsFileSystem', mock.Mock(return_value=file_system)
        ):
            delete_feedback_screenshot_files('entity-1', 'file-1.png')
        self.assertEqual(file_system.delete.call_count, 3)
