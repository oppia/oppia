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

"""Services for web user feedback threads, messages, and session logs."""

from __future__ import annotations

import datetime
import hashlib

from core import feconf, utils
from core.domain import (
    fs_services,
    general_feedback_domain,
    subscription_services,
)
from core.platform import models

from typing import Dict, List, Optional, Sequence, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import feedback_models, general_feedback_models

(feedback_models, general_feedback_models) = models.Registry.import_models(
    [models.Names.FEEDBACK, models.Names.GENERAL_FEEDBACK]
)


def get_platform_target_id_from_page_url(page_url: str) -> str:
    """Returns a deterministic target ID for platform feedback."""
    return hashlib.sha1(page_url.encode('utf-8')).hexdigest()


def _add_message_id_to_read_by_user(
    user_id: str,
    thread_id: str,
    message_index: int,
) -> None:
    """Marks a single message index as read by the given user."""
    thread_user_model = feedback_models.GeneralFeedbackThreadUserModel.get(
        user_id, thread_id
    )
    if thread_user_model is None:
        thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.create(
                user_id, thread_id
            )
        )
    # Add message index to the list of read message IDs.
    if message_index not in thread_user_model.message_ids_read_by_user:
        thread_user_model.message_ids_read_by_user.append(message_index)
        thread_user_model.update_timestamps()
        thread_user_model.put()


def get_message_ids_read_by_user(user_id: str, thread_id: str) -> set[int]:
    """Returns message IDs in a thread read by the user."""
    thread_user_model = feedback_models.GeneralFeedbackThreadUserModel.get(
        user_id, thread_id
    )
    if thread_user_model is None:
        return set()

    return set(thread_user_model.message_ids_read_by_user)


def update_messages_read_by_the_user(
    user_id: str,
    thread_id: str,
    message_ids: Sequence[int],
) -> None:
    """Replaces message IDs read by user for the given thread."""
    thread_user_model = feedback_models.GeneralFeedbackThreadUserModel.get(
        user_id, thread_id
    )
    if thread_user_model is None:
        thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.create(
                user_id, thread_id
            )
        )
    thread_user_model.message_ids_read_by_user = sorted(set(message_ids))
    thread_user_model.update_timestamps()
    thread_user_model.put()


def create_thread(
    category: str,
    description: str,
    page_url: str,
    language_code: str,
    rating: int,
    target_type: str,
    target_id: Optional[str],
    screenshot_filename: Optional[str] = None,
    screenshot_entity_id: Optional[str] = None,
    # Here we use object because session diagnostics payloads are
    # heterogeneous JSON-like structures from the client.
    session_info: Optional[Dict[str, object]] = None,
    user_id: Optional[str] = None,
) -> str:
    """Creates a new web feedback thread and returns its ID.

    Args:
        category: str. One of 'lesson' or 'platform'.
        description: str. Feedback text.
        page_url: str. URL of the page.
        language_code: str. Language code.
        rating: int. Rating from 0 to 5.
        target_type: str. Entity type ("exploration" or "general").
        target_id: Optional[str]. Identifier for the feedback target.
        screenshot_filename: Optional[str]. Screenshot blob key.
        screenshot_entity_id: Optional[str]. Screenshot entity ID.
        session_info: Optional[Dict[str, object]]. Session diagnostics payload.
        user_id: Optional[str]. User ID if logged in.

    Returns:
        str. The ID of the new feedback thread.

    Raises:
        ValueError. The target_id is missing for Lesson feedback.
    """
    if category == general_feedback_models.CATEGORY_PLATFORM:
        target_id = get_platform_target_id_from_page_url(page_url)
    elif target_id is None:
        raise ValueError('target_id must be provided for Lesson feedback.')

    has_screenshot = (
        screenshot_entity_id is not None and screenshot_filename is not None
    )
    has_session_info = session_info is not None

    thread_id = general_feedback_models.WebFeedbackThreadModel.create(
        category=category,
        page_url=page_url,
        language_code=language_code,
        rating=rating,
        target_type=target_type,
        target_id=target_id,
        original_author_id=user_id,
        has_session_info=has_session_info,
        has_screenshot=has_screenshot,
    )

    general_feedback_models.WebFeedbackMessageModel.create(
        thread_id=thread_id,
        message_index=0,
        author_status=general_feedback_models.AUTHOR_ROLE_LEARNER,
        author_id=user_id,
        text=description,
        screenshot_filename=screenshot_filename,
        screenshot_entity_id=screenshot_entity_id,
        updated_status=None,
    )
    # Update the message count for the thread.
    thread_model = general_feedback_models.WebFeedbackThreadModel.get(
        thread_id, strict=False
    )
    if thread_model is not None:
        thread_model.message_count = 1
        thread_model.update_timestamps()
        thread_model.put()
    # Update the session info for the thread.
    if session_info is not None:
        console_errors_json = session_info.get('console_errors_json')
        failed_requests_json = session_info.get('failed_requests_json')
        navigation_history_json = session_info.get('navigation_history_json')
        environment_json = session_info.get('environment_json')
        if not isinstance(console_errors_json, list):
            console_errors_json = []
        if not isinstance(failed_requests_json, list):
            failed_requests_json = []
        if not isinstance(navigation_history_json, list):
            navigation_history_json = []
        if not isinstance(environment_json, dict):
            environment_json = {}
        general_feedback_models.FeedbackSessionLogModel.create(
            thread_id=thread_id,
            console_errors_json=console_errors_json,
            failed_requests_json=failed_requests_json,
            navigation_history_json=navigation_history_json,
            environment_json=environment_json,
        )
        # Subscribe the user(Author) to the thread,
        # this will be used to show in feedback-updates page.
        if user_id is not None:
            subscription_services.subscribe_to_threads(user_id, [thread_id])
            _add_message_id_to_read_by_user(user_id, thread_id, 0)

    return thread_id


def create_message(
    thread_id: str,
    text: str,
    author_status: str,
    author_id: Optional[str] = None,
    screenshot_filename: Optional[str] = None,
    screenshot_entity_id: Optional[str] = None,
    updated_status: Optional[str] = None,
) -> general_feedback_domain.WebFeedbackMessage:
    """Creates a new message in an existing web feedback thread.

    Args:
        thread_id: str. ID of the associated feedback thread.
        text: str. Message body.
        author_status: str. Role of the author.
        author_id: Optional[str]. User ID of the message author,
            or None for anonymous users.
        updated_status: Optional[str]. Status change associated with
            this message, if any.
        screenshot_filename: Optional[str]. Filename of the uploaded
            screenshot stored in GCS.
        screenshot_entity_id: Optional[str]. Entity ID used for
            screenshot storage in GCS.

    Returns:
        WebFeedbackMessage. The created message as a domain object.

    Raises:
        ValueError. The thread ID is invalid.
        ValueError. The message was not created successfully.
    """
    thread_model = general_feedback_models.WebFeedbackThreadModel.get(thread_id)
    if thread_model is None:
        raise ValueError('Invalid thread ID: %s' % thread_id)

    next_message_index = general_feedback_models.WebFeedbackMessageModel.get_message_count_for_thread(
        thread_id
    )
    general_feedback_models.WebFeedbackMessageModel.create(
        thread_id=thread_id,
        message_index=next_message_index,
        author_status=author_status,
        author_id=author_id,
        text=text,
        screenshot_filename=screenshot_filename,
        screenshot_entity_id=screenshot_entity_id,
        updated_status=updated_status,
    )
    # Update the message count for the thread.
    thread_model.message_count = next_message_index + 1
    # Update the status of the thread.
    if updated_status is not None:
        thread_model.status = updated_status
    thread_model.update_timestamps()
    thread_model.put()

    message_model = general_feedback_models.WebFeedbackMessageModel.get_by_id(
        '%s.%s' % (thread_id, next_message_index)
    )
    if message_model is None:
        raise ValueError(
            'Message was not created for thread ID: %s' % thread_id
        )

    if author_id is not None:
        subscription_services.subscribe_to_threads(author_id, [thread_id])
        _add_message_id_to_read_by_user(
            author_id, thread_id, next_message_index
        )

    return _message_model_to_domain(message_model)


def _message_model_to_domain(
    model: general_feedback_models.WebFeedbackMessageModel,
) -> general_feedback_domain.WebFeedbackMessage:
    """Converts a general feedback message model to a domain object."""
    return general_feedback_domain.WebFeedbackMessage(
        message_index=model.message_index,
        author_status=model.author_status,
        author_id=model.author_id,
        text=model.text,
        screenshot_filename=model.screenshot_filename,
        screenshot_entity_id=model.screenshot_entity_id,
        updated_status=model.updated_status,
        created_on_msecs=utils.get_time_in_millisecs(model.created_on),
    )


def _thread_model_to_domain(
    model: general_feedback_models.WebFeedbackThreadModel,
    messages: Sequence[general_feedback_domain.WebFeedbackMessage],
    # Here we use object because session diagnostics payloads are
    # heterogeneous JSON-like structures from the client.
    session_info: Optional[Dict[str, object]],
) -> general_feedback_domain.WebFeedbackThread:
    """Converts a general feedback thread model to a domain object."""
    description = messages[0].text if messages else ''
    return general_feedback_domain.WebFeedbackThread(
        thread_id=model.id,
        category=model.category,
        description=description or '',
        page_url=model.page_url,
        language_code=model.language_code,
        status=model.status,
        rating=model.rating,
        has_screenshot=model.has_screenshot,
        target_type=model.target_type,
        target_id=model.target_id,
        message_count=model.message_count,
        messages=list(messages),
        created_on_msecs=utils.get_time_in_millisecs(model.created_on),
        session_info=session_info,
        user_id=model.original_author_id,
    )


def _thread_model_to_summary_domain(
    model: general_feedback_models.WebFeedbackThreadModel,
    description: str,
) -> general_feedback_domain.WebFeedbackThreadSummaryDict:
    """Converts a general feedback thread model to a summary domain object."""
    return {
        'id': model.id,
        'category': model.category,
        'status': model.status,
        'rating': model.rating,
        'target_type': model.target_type,
        'target_id': model.target_id,
        'has_screenshot': model.has_screenshot,
        'has_session_info': model.has_session_info,
        'description_preview': description[:140],
        'created_on_msecs': utils.get_time_in_millisecs(model.created_on),
    }


def _get_session_info_by_thread_ids(
    thread_ids: Sequence[str],
    # Here we use object because session diagnostics payloads are
    # heterogeneous JSON-like structures from the client.
) -> Dict[str, Dict[str, object]]:
    """Returns session diagnostics mapped by thread ID."""
    if not thread_ids:
        return {}
    session_models = general_feedback_models.FeedbackSessionLogModel.get_multi(
        thread_ids
    )
    # Here we use object because session diagnostics payloads are
    # heterogeneous JSON-like structures from the client.
    session_info_by_thread_id: Dict[str, Dict[str, object]] = {}
    for session_model in session_models:
        if session_model is None:
            continue
        session_info_by_thread_id[session_model.id] = session_model.to_dict()
    return session_info_by_thread_id


def get_messages(
    thread_id: str,
) -> List[general_feedback_domain.WebFeedbackMessage]:
    """Returns all messages for a web feedback thread."""
    message_models = (
        general_feedback_models.WebFeedbackMessageModel.get_messages(thread_id)
    )
    return [_message_model_to_domain(model) for model in message_models]


def get_thread(
    thread_id: str,
) -> Optional[general_feedback_domain.WebFeedbackThread]:
    """Returns the web feedback thread with the given ID, or None."""
    model = general_feedback_models.WebFeedbackThreadModel.get(thread_id)
    if model is None or model.deleted:
        return None

    messages = get_messages(thread_id)
    session_info_by_thread_id = _get_session_info_by_thread_ids([thread_id])
    return _thread_model_to_domain(
        model, messages, session_info_by_thread_id.get(thread_id)
    )


def get_threads_by_ids(
    thread_ids: Sequence[str],
) -> Sequence[general_feedback_domain.WebFeedbackThreadSummaryDict]:
    """Returns threads for the given IDs in the same order, skipping missing."""
    if not thread_ids:
        return []

    models_list = general_feedback_models.WebFeedbackThreadModel.get_multi(
        thread_ids
    )
    existing_models = [
        model
        for model in models_list
        if model is not None and not model.deleted
    ]
    message_models_by_thread_id = general_feedback_models.WebFeedbackMessageModel.get_messages_by_thread_ids(
        [model.id for model in existing_models]
    )

    threads = []
    for model in models_list:
        if model is None or model.deleted:
            continue
        message_models = message_models_by_thread_id.get(model.id, [])
        description = message_models[0].text or '' if message_models else ''
        threads.append(
            _thread_model_to_summary_domain(
                model,
                description,
            )
        )
    return threads


def _normalize_status_filter(status_filter: Optional[str]) -> Optional[str]:
    """Normalizes status filter values."""
    if status_filter is None:
        return None
    if status_filter.lower() == 'all':
        return None
    if status_filter in general_feedback_models.STATUS_CHOICES:
        return status_filter
    return None


def get_threads(
    page_size: int,
    cursor: Optional[str] = None,
    category_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    target_type_filter: Optional[str] = None,
    target_id_filter: Optional[str] = None,
    date_from_msecs: Optional[float] = None,
    date_to_msecs: Optional[float] = None,
) -> Tuple[
    Sequence[general_feedback_domain.WebFeedbackThreadSummaryDict],
    Optional[str],
    bool,
]:
    """Returns a page of web feedback threads for admin."""
    date_from: Optional[datetime.datetime] = None
    date_to: Optional[datetime.datetime] = None
    if date_from_msecs is not None:
        date_from = datetime.datetime.utcfromtimestamp(date_from_msecs / 1000.0)
    if date_to_msecs is not None:
        date_to = datetime.datetime.utcfromtimestamp(date_to_msecs / 1000.0)

    normalized_status_filter = _normalize_status_filter(status_filter)
    models_list, next_cursor, more = (
        general_feedback_models.WebFeedbackThreadModel.fetch_page_of_feedback_threads(
            page_size=page_size,
            cursor=cursor,
            category_filter=category_filter,
            status_filter=normalized_status_filter,
            target_type_filter=target_type_filter,
            target_id_filter=target_id_filter,
            date_from=date_from,
            date_to=date_to,
        )
    )
    message_models_by_thread_id = general_feedback_models.WebFeedbackMessageModel.get_messages_by_thread_ids(
        [model.id for model in models_list]
    )

    thread_list = []
    for model in models_list:
        message_models = message_models_by_thread_id.get(model.id, [])
        description = message_models[0].text or '' if message_models else ''
        thread_list.append(
            _thread_model_to_summary_domain(
                model,
                description,
            )
        )

    return thread_list, next_cursor, more


def update_thread_status(thread_id: str, new_status: str) -> bool:
    """Updates the status of a web feedback thread."""
    model = general_feedback_models.WebFeedbackThreadModel.get(thread_id)
    if model is None or new_status not in (
        general_feedback_models.STATUS_CHOICES_OPEN,
        general_feedback_models.STATUS_CHOICES_FIXED,
        general_feedback_models.STATUS_CHOICES_IGNORED,
        general_feedback_models.STATUS_CHOICES_COMPLIMENT,
        general_feedback_models.STATUS_CHOICES_NOT_ACTIONABLE,
    ):
        return False
    if model.deleted:
        return False

    model.status = new_status
    model.update_timestamps()
    model.put()
    return True


def delete_thread(thread_id: str) -> bool:
    """Soft-deletes a web feedback thread."""
    model = general_feedback_models.WebFeedbackThreadModel.get(thread_id)
    if model is None:
        return False
    if model.deleted:
        return True

    model.deleted = True
    model.update_timestamps()
    model.put()
    return True


def delete_general_feedback_older_than(
    cutoff_datetime: datetime.datetime,
    batch_size: int = 1000,
) -> int:
    """Deletes web feedback threads older than the given cutoff datetime.

    Args:
        cutoff_datetime: datetime. Any feedback created before this datetime
            will be deleted.
        batch_size: int. Maximum number of threads deleted in one run.

    Returns:
        int. Number of deleted feedback models.
    """
    old_models: Sequence[general_feedback_models.WebFeedbackThreadModel] = (
        general_feedback_models.WebFeedbackThreadModel.query(
            general_feedback_models.WebFeedbackThreadModel.created_on
            < cutoff_datetime
        ).fetch(batch_size)
    )
    if not old_models:
        return 0
    # Deleting the FeedbackSessionLogModel associated with the
    # WebFeedbackThreadModel.
    session_model_ids = [model.id for model in old_models]
    session_models = general_feedback_models.FeedbackSessionLogModel.get_multi(
        session_model_ids
    )
    existing_session_models = [m for m in session_models if m is not None]
    if existing_session_models:
        general_feedback_models.FeedbackSessionLogModel.delete_multi(
            existing_session_models
        )
    for model in old_models:
        thread_message_models = (
            general_feedback_models.WebFeedbackMessageModel.get_messages(
                model.id
            )
        )
        for message_model in thread_message_models:
            _delete_feedback_screenshot_files(
                message_model.screenshot_entity_id,
                message_model.screenshot_filename,
            )
            general_feedback_models.WebFeedbackMessageModel.delete(
                message_model
            )

    general_feedback_models.WebFeedbackThreadModel.delete_multi(old_models)
    return len(old_models)


def _delete_feedback_screenshot_files(
    screenshot_entity_id: Optional[str], screenshot_filename: Optional[str]
) -> None:
    """Deletes feedback screenshot derivatives from GCS."""
    if not screenshot_entity_id or not screenshot_filename:
        return

    file_system = fs_services.GcsFileSystem(
        feconf.ENTITY_TYPE_FEEDBACK_SCREENSHOT, screenshot_entity_id
    )
    filename_without_ext = screenshot_filename[: screenshot_filename.rfind('.')]
    file_ext = screenshot_filename[screenshot_filename.rfind('.') + 1 :]
    filepaths = [
        'image/%s' % screenshot_filename,
        'image/%s_compressed.%s' % (filename_without_ext, file_ext),
        'image/%s_micro.%s' % (filename_without_ext, file_ext),
    ]
    for filepath in filepaths:
        try:
            file_system.delete(filepath)
        except IOError:
            continue
