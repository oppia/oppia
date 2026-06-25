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

"""Models for web user feedback threads, messages and session logs."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.platform import models

from typing import Dict, Final, List, Literal, Optional, Sequence, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

# Category choices for feedback threads.
CATEGORY_LESSON: Final = 'lesson'
CATEGORY_PLATFORM: Final = 'platform'
CATEGORY_CHOICES: Final = [CATEGORY_LESSON, CATEGORY_PLATFORM]

# Target type choices for feedback threads.
TARGET_TYPE_EXPLORATION: Final = 'exploration'
TARGET_TYPE_GENERAL: Final = 'general'
TARGET_TYPE_CHOICES: Final = [TARGET_TYPE_EXPLORATION, TARGET_TYPE_GENERAL]

# Allowed feedback thread statuses.
STATUS_CHOICES_OPEN: Final = 'open'
STATUS_CHOICES_FIXED: Final = 'fixed'
STATUS_CHOICES_IGNORED: Final = 'ignored'
STATUS_CHOICES_COMPLIMENT: Final = 'compliment'
STATUS_CHOICES_NOT_ACTIONABLE: Final = 'not_actionable'
STATUS_CHOICES: Final = [
    STATUS_CHOICES_OPEN,
    STATUS_CHOICES_FIXED,
    STATUS_CHOICES_IGNORED,
    STATUS_CHOICES_COMPLIMENT,
    STATUS_CHOICES_NOT_ACTIONABLE,
]

# Author roles for two-way feedback messages.
AUTHOR_ROLE_LEARNER: Final = 'learner'
AUTHOR_ROLE_LESSONS_TEAM: Final = 'editor'
AUTHOR_ROLE_FEEDBACK_ADMIN: Final = 'feedback_admin'
AUTHOR_ROLE_CHOICES: Final = [
    AUTHOR_ROLE_LEARNER,
    AUTHOR_ROLE_LESSONS_TEAM,
    AUTHOR_ROLE_FEEDBACK_ADMIN,
]

# Constants used for generating new ids.
_MAX_RETRIES: Final = 10
_RAND_RANGE: Final = 127 * 127

_THREAD_ID_IN_FILTER_BATCH_SIZE: Final = 30


class WebFeedbackThreadModel(base_models.BaseModel):
    """Storage model for thread-based web feedback submissions.

    This model represents a single feedback thread and serves as the
    primary source of truth for all feedback submitted across the Oppia
    web platform. Each feedback submission creates exactly one thread.

    The id of instances of this class has the form
        [entity_type].[entity_id].[generated_string]

    Note:
        The actual feedback description is NOT stored in this model.
        It is stored as the text of the first message (message_index = 0)
        in WebFeedbackMessageModel. This ensures a clean separation
        between metadata and user-generated content.


    Fields:
        id: str. Unique identifier for the feedback thread
            (<entity_type>.<entity_id>.<random_string>).
        category: str. Type of feedback ("platform" or "lesson").
        target_type: str. Entity type ("exploration" for lesson feedback,
            "general" for platform feedback).
        target_id: str.  Identifier for the feedback target:
            For lesson feedback: exploration_id
            For platform feedback: deterministically generated as sha1(page_url).
        original_author_id: Optional[str]. User ID of the submitter,
            or None for anonymous users.
        page_url: str. URL where the feedback was submitted.
        language_code: str. Language selected by the user.
        rating: int. Rating value in range [0, 5].
        has_session_info: bool. Whether session diagnostics are included.
        has_screenshot: bool. Whether a screenshot is included in message-0.
        status: str. Moderation status of the feedback
            (open | fixed | ignored | compliment | not_actionable).
        message_count: int. Total number of messages in the thread.
        created_on: datetime. Timestamp of thread creation.
        last_updated: datetime. Timestamp of last update.
        deleted: bool. Whether the thread is soft-deleted.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    category = datastore_services.StringProperty(
        required=True, indexed=True, choices=CATEGORY_CHOICES
    )
    target_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=TARGET_TYPE_CHOICES
    )
    target_id = datastore_services.StringProperty(required=True, indexed=True)
    original_author_id = datastore_services.StringProperty(
        required=False, indexed=True
    )
    page_url = datastore_services.TextProperty(required=True)
    language_code = datastore_services.TextProperty(required=True)
    rating = datastore_services.IntegerProperty(required=False, indexed=False)
    has_screenshot = datastore_services.BooleanProperty(
        required=True, default=False, indexed=False
    )
    has_session_info = datastore_services.BooleanProperty(
        required=True, default=False, indexed=False
    )
    status = datastore_services.StringProperty(
        required=True,
        indexed=True,
        choices=STATUS_CHOICES,
    )
    message_count = datastore_services.IntegerProperty(
        required=True, default=0, indexed=False
    )
    deleted = datastore_services.BooleanProperty(
        required=True, default=False, indexed=True
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains user ids to pseudonymize."""
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model is exported as one user can participate in multiple feedback threads."""
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(
            super(cls, cls).get_export_policy(),
            **{
                'category': base_models.EXPORT_POLICY.EXPORTED,
                'target_type': base_models.EXPORT_POLICY.EXPORTED,
                'target_id': base_models.EXPORT_POLICY.EXPORTED,
                # Intentionally not exporting original_author_id to protect
                # user privacy.
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
            },
        )

    @classmethod
    def get_field_names_for_takeout(cls) -> Dict[str, str]:
        """Indicates renamed keys used in takeout exports."""
        return {
            'created_on': 'created_on_msec',
            'last_updated': 'last_updated_msec',
        }

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Checks whether thread/message data references the given user ID.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. True if the user ID is referenced in any thread or message, False otherwise.
        """
        if cls.query(cls.original_author_id == user_id).get(keys_only=True):
            return True

        return (
            WebFeedbackMessageModel.query(
                WebFeedbackMessageModel.author_id == user_id
            )
            .filter(WebFeedbackMessageModel.deleted.IN([False]))
            .get(keys_only=True)
            is not None
        )

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, bool, int, float, None]]]:
        """Exports feedback thread data corresponding to a user_id.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. The exported data, structured as a dict with thread IDs as keys and
            thread details as values.
        """

        user_data = {}

        authored_threads: Sequence[WebFeedbackThreadModel] = (
            cls.get_all()
            .filter(cls.deleted.IN([False]))
            .filter(cls.original_author_id == user_id)
            .fetch()
        )

        participated_messages: Sequence[WebFeedbackMessageModel] = (
            WebFeedbackMessageModel.get_all()
            .filter(WebFeedbackMessageModel.deleted.IN([False]))
            .filter(WebFeedbackMessageModel.author_id == user_id)
            .fetch()
        )

        thread_ids = {thread.id for thread in authored_threads}

        thread_ids.update(
            message.thread_id for message in participated_messages
        )

        feedback_models = [
            model
            for model in cls.get_multi(list(thread_ids))
            if model is not None
        ]

        session_logs = FeedbackSessionLogModel.get_multi(
            [model.id for model in feedback_models if model.has_session_info]
        )

        session_logs_by_id = {
            log.id: log for log in session_logs if log is not None
        }

        for feedback_model in feedback_models:
            session_info = None

            session_model = session_logs_by_id.get(feedback_model.id)

            if session_model is not None:
                session_info = session_model.to_dict()

            thread_data = {
                'category': feedback_model.category,
                'target_type': feedback_model.target_type,
                'page_url': feedback_model.page_url,
                'language_code': feedback_model.language_code,
                'rating': feedback_model.rating,
                'has_screenshot': feedback_model.has_screenshot,
                'has_session_info': feedback_model.has_session_info,
                'session_info': session_info,
                'status': feedback_model.status,
                'message_count': feedback_model.message_count,
                'created_on': utils.get_time_in_millisecs(
                    feedback_model.created_on
                ),
                'last_updated': utils.get_time_in_millisecs(
                    feedback_model.last_updated
                ),
            }

            if feedback_model.target_type == TARGET_TYPE_EXPLORATION:
                thread_data['target_id'] = feedback_model.target_id

            user_data[feedback_model.id] = thread_data

        return user_data

    @classmethod
    def get_filtered_query_of_feedback_threads(
        cls,
        category_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        target_type_filter: Optional[str] = None,
        target_id_filter: Optional[str] = None,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None,
    ) -> datastore_services.Query:
        """Returns a query for feedback threads matching the given filters.

        Args:
            category_filter: Optional[str]. If provided, only threads with this category are returned.
            status_filter: Optional[str]. If provided, only threads with this status are returned.
            target_type_filter: Optional[str]. If provided, only threads with this target type are returned.
            target_id_filter: Optional[str]. If provided, only threads with this target ID are returned.
            date_from: Optional[datetime.datetime]. If provided, only threads created on or after this date are returned.
            date_to: Optional[datetime.datetime]. If provided, only threads created on or before this date are returned.

        Returns:
            Query. Query over feedback thread models matching the filters.
        """
        query = cls.query()
        # Ignoring deleted threads as they are not relevant for operations.
        query = query.filter(cls.deleted.IN([False]))
        if category_filter and category_filter in CATEGORY_CHOICES:
            query = query.filter(cls.category == category_filter)
        if status_filter and status_filter in STATUS_CHOICES:
            query = query.filter(cls.status == status_filter)
        if target_type_filter and target_type_filter in TARGET_TYPE_CHOICES:
            query = query.filter(cls.target_type == target_type_filter)
        if target_id_filter:
            query = query.filter(cls.target_id == target_id_filter)
        if date_from is not None:
            query = query.filter(cls.created_on >= date_from)
        if date_to is not None:
            query = query.filter(cls.created_on <= date_to)
        return query

    @classmethod
    def fetch_page_of_feedback_threads(
        cls,
        page_size: int,
        cursor: Optional[str] = None,
        category_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        target_type_filter: Optional[str] = None,
        target_id_filter: Optional[str] = None,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None,
    ) -> Tuple[Sequence['WebFeedbackThreadModel'], Optional[str], bool]:
        """Fetches a page of feedback threads sorted by created_on desc."""
        query = cls.get_filtered_query_of_feedback_threads(
            category_filter=category_filter,
            status_filter=status_filter,
            target_type_filter=target_type_filter,
            target_id_filter=target_id_filter,
            date_from=date_from,
            date_to=date_to,
        ).order(-cls.created_on)

        start_cursor = datastore_services.make_cursor(urlsafe_cursor=cursor)
        results: Sequence[WebFeedbackThreadModel]
        results, next_cursor, more = query.fetch_page(
            page_size, start_cursor=start_cursor
        )

        next_cursor_str = None
        if next_cursor and more:
            next_cursor_str = next_cursor.urlsafe().decode('utf-8')

        return results, next_cursor_str, more

    @classmethod
    def generate_new_thread_id(cls, entity_type: str, entity_id: str) -> str:
        """Generates a new unique thread ID with the format [entity_type].[entity_id].[random_string].

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.

        Returns:
            str. A globally unique thread ID containing the entity type
            and entity ID as part of the ID format.

        Raises:
            Exception. Raised when too many collisions occur while generating a
                new thread ID.
        """
        for _ in range(_MAX_RETRIES):
            thread_id = '%s.%s.%s%s' % (
                entity_type,
                entity_id,
                utils.base64_from_int(
                    int(utils.get_current_time_in_millisecs())
                ),
                utils.base64_from_int(utils.get_random_int(_RAND_RANGE)),
            )
            if not cls.get_by_id(thread_id):
                return thread_id
        raise Exception(
            'New thread ID generator is producing too many collisions'
        )

    @classmethod
    def create(
        cls,
        category: str,
        page_url: str,
        language_code: str,
        rating: int,
        target_type: str,
        target_id: str,
        has_screenshot: bool,
        has_session_info: bool,
        original_author_id: Optional[str] = None,
    ) -> str:
        """Creates a new WebFeedbackThreadModel and returns its ID."""
        if (
            category == CATEGORY_LESSON
            and target_type != TARGET_TYPE_EXPLORATION
        ):
            raise ValueError(
                'Lesson feedback must have target_type "%s".'
                % TARGET_TYPE_EXPLORATION
            )
        if category == CATEGORY_PLATFORM and target_type != TARGET_TYPE_GENERAL:
            raise ValueError(
                'Platform feedback must have target_type "%s".'
                % TARGET_TYPE_GENERAL
            )

        thread_id = cls.generate_new_thread_id(target_type, target_id)

        thread = cls(
            id=thread_id,
            category=category,
            page_url=page_url,
            language_code=language_code,
            original_author_id=original_author_id,
            rating=rating,
            target_type=target_type,
            target_id=target_id,
            has_screenshot=has_screenshot,
            has_session_info=has_session_info,
            status=STATUS_CHOICES_OPEN,
            message_count=0,
        )
        thread.update_timestamps()
        thread.put()
        return thread_id


class WebFeedbackMessageModel(base_models.BaseModel):
    """Storage model for messages within a web feedback thread.

    This model stores individual messages that belong to a feedback
    thread. Each thread contains a sequence of messages, starting
    with the initial user submission (message_index = 0).

    Messages support:
    - Text content
    - Status updates
    - Optional screenshot attachments

    This enables structured conversation history, moderation workflows,
    and audit tracking.

    Fields:
        id: str. Unique identifier in format "<thread_id>.<message_index>".
        thread_id: str. ID of the associated WebFeedbackThreadModel.
        message_index: int. Sequential index of the message within the thread.
        author_id: Optional[str]. User ID of the message author,
            or None for anonymous users.
        author_status: str. Role of the author
            ("learner" | "feedback_admin" | "editor").
        text: Optional[str]. Message content.
        updated_status: Optional[str]. Status change associated with
            this message, if any.
        screenshot_filename: Optional[str]. FileName of the uploaded
            screenshot stored in GCS.
        screenshot_entity_id: Optional[str]. Entity ID used for
            screenshot storage in GCS.
        created_on: datetime. Timestamp of message creation.
        last_updated: datetime. Timestamp of last update.
        deleted: bool. Whether the message is soft-deleted.
    """

    # Message ID has the form [thread_id].[message_index].
    ID_IS_USED_AS_TAKEOUT_KEY: bool = True

    thread_id = datastore_services.StringProperty(
        required=True,
        indexed=True,
    )
    message_index = datastore_services.IntegerProperty(
        required=True,
        indexed=True,
    )
    author_id = datastore_services.StringProperty(
        required=False,
        indexed=True,
    )
    author_status = datastore_services.StringProperty(
        required=True, indexed=True, choices=AUTHOR_ROLE_CHOICES
    )
    text = datastore_services.TextProperty(required=False, indexed=False)
    updated_status = datastore_services.TextProperty(
        required=False,
        choices=STATUS_CHOICES,
    )
    screenshot_filename = datastore_services.TextProperty(
        required=False,
    )
    screenshot_entity_id = datastore_services.TextProperty(
        required=False,
    )
    deleted = datastore_services.BooleanProperty(
        required=True, default=False, indexed=True
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains user ids to pseudonymize."""
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model is exported as multiple instances per user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(
            super(cls, cls).get_export_policy(),
            **{
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
            },
        )

    @classmethod
    def get_field_names_for_takeout(cls) -> Dict[str, str]:
        """Indicates renamed keys used in takeout exports."""
        return {
            'created_on': 'created_on_msec',
            'last_updated': 'last_updated_msec',
        }

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Checks whether message data references the given user ID."""
        return (
            cls.query(cls.author_id == user_id)
            .filter(cls.deleted.IN([False]))
            .get(keys_only=True)
            is not None
        )

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, Union[str, int, float, None]]]:
        """Exports feedback message data corresponding to user_id."""
        user_data = {}
        message_models: Sequence[WebFeedbackMessageModel] = (
            cls.get_all()
            .filter(cls.author_id == user_id)
            .filter(cls.deleted.IN([False]))
            .fetch()
        )

        for message_model in message_models:
            user_data[message_model.id] = {
                'thread_id': message_model.thread_id,
                'message_index': message_model.message_index,
                'author_status': message_model.author_status,
                'text': message_model.text,
                'updated_status': message_model.updated_status,
                'screenshot_filename': message_model.screenshot_filename,
                'screenshot_entity_id': message_model.screenshot_entity_id,
                'created_on_msec': utils.get_time_in_millisecs(
                    message_model.created_on
                ),
                'last_updated_msec': utils.get_time_in_millisecs(
                    message_model.last_updated
                ),
            }

        return user_data

    @classmethod
    def get_messages(
        cls, thread_id: str
    ) -> Sequence['WebFeedbackMessageModel']:
        """Returns all messages belonging to a given thread, sorted by message_index."""
        return (
            cls.query(cls.thread_id == thread_id)
            .filter(cls.deleted.IN([False]))
            .order(cls.message_index)
            .fetch()
        )

    @classmethod
    def get_messages_by_thread_ids(
        cls, thread_ids: Sequence[str]
    ) -> Dict[str, List['WebFeedbackMessageModel']]:
        """Returns all messages belonging to a list of thread IDs, grouped by thread ID."""
        messages_by_thread_id: Dict[str, List[WebFeedbackMessageModel]] = {
            thread_id: [] for thread_id in thread_ids
        }
        if not thread_ids:
            return messages_by_thread_id

        for index in range(0, len(thread_ids), _THREAD_ID_IN_FILTER_BATCH_SIZE):
            batch_thread_ids = thread_ids[
                index : index + _THREAD_ID_IN_FILTER_BATCH_SIZE
            ]
            message_models: Sequence[WebFeedbackMessageModel] = (
                cls.query(cls.thread_id.IN(batch_thread_ids))
                .filter(cls.deleted.IN([False]))
                .order(cls.thread_id)
                .order(cls.message_index)
                .fetch()
            )
            for message_model in message_models:
                messages_by_thread_id[message_model.thread_id].append(
                    message_model
                )

        return messages_by_thread_id

    @classmethod
    def get_message_count_for_thread(cls, thread_id: str) -> int:
        """Returns the total number of messages in a given thread."""
        return (
            cls.query(cls.thread_id == thread_id)
            .filter(cls.deleted.IN([False]))
            .count()
        )

    @classmethod
    def create(
        cls,
        thread_id: str,
        message_index: int,
        author_status: str,
        author_id: Optional[str],
        text: Optional[str],
        screenshot_filename: Optional[str],
        screenshot_entity_id: Optional[str],
        updated_status: Optional[str],
    ) -> str:
        """Creates a new message in Feedback thread and returns its ID."""

        message_id = '%s.%d' % (thread_id, message_index)
        if cls.get_by_id(message_id):
            raise Exception('Message with ID %s already exists.' % message_id)
        message = cls(
            id=message_id,
            thread_id=thread_id,
            message_index=message_index,
            author_id=author_id,
            author_status=author_status,
            text=text,
            screenshot_filename=screenshot_filename,
            screenshot_entity_id=screenshot_entity_id,
            updated_status=updated_status,
        )
        message.update_timestamps()
        message.put()
        return message_id


class FeedbackSessionLogModel(base_models.BaseModel):
    """Storage model for feedback session diagnostics.

    This model stores optional debugging context associated with a
    feedback submission. Session diagnostics are collected when the
    user opts in to share session information in the feedback modal.

    Each session log is directly associated with a feedback thread
    using the same ID as WebFeedbackThreadModel.

    Fields:
        id: str. Feedback thread ID associated with the session log.
        session_info_schema_version: int. Schema version for FeedbackSessionLogModel schema.
        console_logs_json: List[Dict]. Console errors captured during session.
        failed_requests_json: List[Dict]. Failed HTTP request logs.
        navigation_history_json: List[Dict]. Recent navigation history.
        environment_json: Dict. Browser and device metadata.
        created_on: datetime. Timestamp of creation.
        last_updated: datetime. Timestamp of last update.
        deleted: bool.
    """

    # We use the thread ID as the model ID to ensure a one-to-one relationship.
    ID_IS_USED_AS_TAKEOUT_KEY: bool = True

    session_info_schema_version = datastore_services.IntegerProperty(
        required=True,
        indexed=True,
    )
    console_logs_json = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )
    failed_requests_json = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )
    navigation_history_json = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )
    environment_json = datastore_services.JsonProperty(
        required=False,
        indexed=False,
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model is not directly associated with users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model does not correspond directly to a user."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model should not be exported directly in takeout."""
        return dict(
            super(cls, cls).get_export_policy(),
            **{
                'session_info_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'console_logs_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'failed_requests_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'navigation_history_json': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'environment_json': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    @classmethod
    def create(
        cls,
        thread_id: str,
        console_logs_json: Optional[List[Dict[str, str]]],
        failed_requests_json: Optional[List[Dict[str, str]]],
        navigation_history_json: Optional[List[Dict[str, str]]],
        environment_json: Optional[Dict[str, str]],
    ) -> str:
        """Creates a new FeedbackSessionLogModel for a given thread ID."""
        if cls.get_by_id(thread_id):
            raise Exception(
                'Session log for thread ID %s already exists.' % thread_id
            )
        session_log = cls(
            id=thread_id,
            session_info_schema_version=feconf.CURRENT_SESSION_INFO_SCHEMA_VERSION,
            console_logs_json=console_logs_json,
            failed_requests_json=failed_requests_json,
            navigation_history_json=navigation_history_json,
            environment_json=environment_json,
        )
        session_log.update_timestamps()
        session_log.put()
        return thread_id
