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

"""Domain objects for web feedback threads, messages and session logs."""

from __future__ import annotations

from typing import Dict, List, Optional, TypedDict


class WebFeedbackMessageDict(TypedDict):
    """Dict representation of a web feedback message."""

    message_index: int
    author_id: Optional[str]
    author_status: str
    text: Optional[str]
    updated_status: Optional[str]
    screenshot_filename: Optional[str]
    screenshot_entity_id: Optional[str]
    created_on_msecs: float


class WebFeedbackThreadDict(TypedDict):
    """Dict representation of a web feedback thread."""

    id: str
    category: str
    description: str
    page_url: str
    language_code: str
    status: str
    rating: int
    target_type: str
    target_id: str
    has_screenshot: bool
    # Here we use object because session-info diagnostics are heterogeneous
    # JSON-like payloads (nested dict/list values) from client logs.
    session_info: Optional[Dict[str, object]]
    user_id: Optional[str]
    message_count: int
    messages: List[WebFeedbackMessageDict]
    created_on_msecs: float


class WebFeedbackThreadSummaryDict(TypedDict):
    """Lightweight dict representation of a web feedback thread."""

    id: str
    category: str
    status: str
    rating: int
    target_type: str
    target_id: str
    has_screenshot: bool
    has_session_info: bool
    description_preview: str
    created_on_msecs: float


class WebFeedbackMessage:
    """Domain object for a single web feedback message.

    This object represents one entry in the conversation timeline. It contains
    metadata such as author information, message content, timestamps, and any
    status updates that occurred as a result of this message.
    """

    def __init__(
        self,
        message_index: int,
        author_id: Optional[str],
        author_status: str,
        text: Optional[str],
        updated_status: Optional[str],
        screenshot_filename: Optional[str],
        screenshot_entity_id: Optional[str],
        created_on_msecs: float,
    ) -> None:
        self.message_index = message_index
        self.author_id = author_id
        self.author_status = author_status
        self.text = text
        self.updated_status = updated_status
        self.screenshot_filename = screenshot_filename
        self.screenshot_entity_id = screenshot_entity_id
        self.created_on_msecs = created_on_msecs

    def to_dict(self) -> WebFeedbackMessageDict:
        """Returns a dict representation of this WebFeedbackMessage object.

        Returns:
            dict. A dict representation of the WebFeedbackMessage object.
        """
        return {
            'message_index': self.message_index,
            'author_id': self.author_id,
            'author_status': self.author_status,
            'text': self.text,
            'updated_status': self.updated_status,
            'screenshot_filename': self.screenshot_filename,
            'screenshot_entity_id': self.screenshot_entity_id,
            'created_on_msecs': self.created_on_msecs,
        }


class WebFeedbackThread:
    """Domain object representing a web feedback thread.

    The object combines the thread's submission-level context with its
    conversation history. Shared metadata such as category, rating, target,
    screenshot references, and session-info flags live at this level, while
    individual replies are represented by WebFeedbackMessage instances.

    Fields:
        thread_id: str. Unique identifier of the thread.
        category: str. Type of feedback ("platform" or "lesson").
        page_url: str. URL where feedback was submitted.
        language_code: str. Selected language.
        status: str. Moderation status of the thread.
        rating: int. Rating in range [0, 5].
        target_type: str. Target entity type.
        target_id: str. Target entity ID
        has_screenshot: bool, whether screenshot is present in thread.
        session_info: Optional[Dict[str, object]]. Session diagnostics.
        user_id: Optional[str]. ID of the submitting user.
        message_count: int. Number of messages in the thread.
        messages: List[WebFeedbackMessage]. Message history.
        created_on_msecs: float. Creation timestamp in milliseconds.
    """

    def __init__(
        self,
        thread_id: str,
        category: str,
        description: str,
        page_url: str,
        language_code: str,
        status: str,
        rating: int,
        has_screenshot: bool,
        target_type: str,
        target_id: str,
        message_count: int,
        messages: List[WebFeedbackMessage],
        created_on_msecs: float,
        # Here we use object because session-info diagnostics are heterogeneous
        # JSON-like payloads (nested dict/list values) from client logs.
        session_info: Optional[Dict[str, object]],
        user_id: Optional[str] = None,
    ) -> None:
        self.id = thread_id
        self.category = category
        self.description = description
        self.page_url = page_url
        self.language_code = language_code
        self.status = status
        self.rating = rating
        self.has_screenshot = has_screenshot
        self.target_type = target_type
        self.target_id = target_id
        self.message_count = message_count
        self.messages = messages
        self.created_on_msecs = created_on_msecs
        self.session_info = session_info
        self.user_id = user_id

    def to_dict(self) -> WebFeedbackThreadDict:
        """Returns a dict representation of this WebFeedbackThread object.

        Returns:
            dict. A dict representation of the WebFeedbackThread object.
        """

        return {
            'id': self.id,
            'category': self.category,
            'description': self.description,
            'page_url': self.page_url,
            'language_code': self.language_code,
            'status': self.status,
            'rating': self.rating,
            'has_screenshot': self.has_screenshot,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'message_count': self.message_count,
            'messages': [message.to_dict() for message in self.messages],
            'created_on_msecs': self.created_on_msecs,
            'session_info': self.session_info,
            'user_id': self.user_id,
        }

    def to_summary_dict(self) -> WebFeedbackThreadSummaryDict:
        """Returns a lightweight dict representation of this thread."""
        return {
            'id': self.id,
            'category': self.category,
            'status': self.status,
            'rating': self.rating,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'has_screenshot': self.has_screenshot,
            'has_session_info': self.session_info is not None,
            'description_preview': self.description[:140],
            'created_on_msecs': self.created_on_msecs,
        }


class GeneralFeedbackNormalizedSubmitPayloadDict(TypedDict):
    """Dict representation of GeneralFeedbackHandler's normalized_payload
    dictionary.
    """

    category: str
    description: str
    page_url: str
    language_code: str
    rating: int
    target_type: str
    target_id: Optional[str]
    screenshot_filename: Optional[str]
    submit_anonymously: bool
    include_session_info: bool
    # Here we use object because session-info diagnostics are heterogeneous
    # JSON-like payloads (nested dict/list values) from client logs.
    session_info: Optional[Dict[str, object]]
    captcha_token: Optional[str]
    screenshot_file: Optional[Dict[str, str]]


class CreatorFeedbackListHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of CreatorFeedbackListHandler's normalized_request
    dictionary.
    """

    cursor: Optional[str]
    date_from_msecs: Optional[float]
    date_to_msecs: Optional[float]
    status_filter: Optional[str]


class CreatorFeedbackDetailHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of CreatorFeedbackDetailHandler's normalized_payload
    dictionary.
    """

    action: Optional[str]
    message: Optional[str]
    screenshot_filename: Optional[str]
    screenshot_file: Optional[Dict[str, str]]


class CreatorFeedbackDetailHandlerNormalizedResponseDict(WebFeedbackThreadDict):
    """Dict representation of CreatorFeedbackDetailHandler's response."""

    can_edit_exploration: bool
