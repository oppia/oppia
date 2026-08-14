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

"""Domain objects for learner lesson feedback, issue reports and session logs."""

from __future__ import annotations

from core import feconf

from typing import Dict, List, Optional, TypedDict


class LessonMetadataDict(TypedDict):
    """Lesson metadata captured when lesson feedback is submitted.

    Attributes:
        exploration_id: ID of the exploration where the feedback was
            submitted.
        exploration_version: Version of the exploration viewed by the learner.
        state_name: Name of the exploration state (card) where the learner
            submitted the feedback.
        state_index: Position of the displayed exploration card at the time
            the feedback was submitted. This helps reviewers identify the
            lesson context in which the learner submitted the feedback.
        learner_current_answer: The learner's current answer for the state, if
            available.
    """

    exploration_id: str
    exploration_version: int
    state_name: str
    state_index: int
    learner_current_answer: Optional[str]


class LessonFeedbackResponseDict(TypedDict):
    """A single creator response entry as included in takeout exports.

    Note: responded_by is intentionally excluded; it is stored on the model
    for internal use but stripped before any user-facing export.
    """

    response_text: str
    responded_on: float


class LessonFeedbackDict(TypedDict):
    """Dict representation of a LessonFeedback domain object."""

    id: str
    feedback_text: str
    status: str
    lesson_metadata: LessonMetadataDict
    parent_feedback_id: Optional[str]
    response_list: List[LessonFeedbackResponseDict]
    unread_response_count: int
    created_on_msecs: float


class LessonFeedbackSummaryDict(TypedDict):
    """Lightweight dict representation of a LessonFeedback."""

    id: str
    feedback_text_preview: str
    status: str
    source: str
    unread_response_count: int


class LearnerLessonFeedbackDetailDict(TypedDict):
    """Learner-facing dict representation of a LessonFeedback."""

    id: str
    feedback_text: str
    status: str
    lesson_metadata: LessonMetadataDict
    parent_feedback_id: Optional[str]
    response_list: List[LessonFeedbackResponseDict]
    unread_response_count: int
    created_on_msecs: float


class PlatformFeedbackDict(TypedDict):
    """Dict representation of a PlatformFeedback domain object."""

    id: str
    report_message: str
    source: str
    platform: str
    destination_dashboard: str
    status: str
    page_url: str
    category: Optional[str]
    lesson_metadata: Optional[LessonMetadataDict]
    include_technical_logs: bool
    # Here we use object because session-info diagnostics are heterogeneous
    # JSON-like payloads (nested dict/list values) from client logs.
    session_info: Optional[Dict[str, object]]
    screenshot_filename: Optional[str]
    screenshot_entity_id: Optional[str]
    created_on_msecs: float


class FeedbackSubmitPayloadDict(TypedDict):
    """Normalized payload for FeedbackSubmitHandler POST."""

    feedback_text: str
    lesson_metadata: LessonMetadataDict


class PlatformFeedbackSubmitPayloadDict(TypedDict):
    """Normalized payload for PlatformFeedbackSubmitHandler POST."""

    source: str
    report_message: str
    page_url: str
    category: Optional[str]
    lesson_metadata: Optional[LessonMetadataDict]
    include_technical_logs: bool
    # Here we use object because session-info diagnostics are heterogeneous
    # JSON-like payloads (nested dict/list values) from client logs.
    session_info: Optional[Dict[str, object]]
    screenshot_filename: Optional[str]
    screenshot_file: Optional[str]


class PlatformFeedbackSummaryDict(TypedDict):
    """Lightweight dict representation of a PlatformFeedback."""

    id: str
    report_message_preview: str
    status: str
    source: str
    category: Optional[str]


class GeneralFeedbackListRequestDict(TypedDict):
    """Normalized payload for LessonFeedbackListHandler and PlatformFeedbackListHandler GET."""

    status: Optional[str]
    cursor: Optional[str]
    date_from_msecs: Optional[float]
    date_to_msecs: Optional[float]


class LessonFeedbackUpdatePayloadDict(TypedDict):
    """Normalized payload for LessonFeedbackDetailHandler POST."""

    status: str
    reply_text: Optional[str]


class LessonFeedback:
    """Domain object for a learner lesson feedback submission.

    Encapsulates the full state of a single feedback entry, including the
    learner's original text, the lesson metadata at submission time,
    any creator responses, and the current moderation status.

    Fields:
        feedback_id: str. Unique identifier of the feedback entry.
        author_id: Optional[str]. User ID of the submitter.
        feedback_text: str. The main text body submitted by the learner.
        status: str. Current moderation status
            (open | fixed | ignored | compliment | not_actionable).
        lesson_metadata: LessonMetadataDict. Snapshot of lesson context
            captured at submission time.
        parent_feedback_id: Optional[str]. References the original
            LessonFeedback for follow-up notes; None for top-level entries.
        response_list: List[LessonFeedbackResponseDict]. Ordered list of
            creator responses. Each entry exposes only response_text and
            responded_on (responded_by is stored internally and never exported).
        unread_response_count: int. Total number of creator responses that have not yet been marked as read by the learner.
        created_on_msecs: float. Creation timestamp in milliseconds.
    """

    def __init__(
        self,
        feedback_id: str,
        author_id: Optional[str],
        feedback_text: str,
        status: str,
        lesson_metadata: LessonMetadataDict,
        response_list: List[LessonFeedbackResponseDict],
        unread_response_count: int,
        created_on_msecs: float,
        parent_feedback_id: Optional[str] = None,
    ) -> None:
        self.id = feedback_id
        self.author_id = author_id
        self.feedback_text = feedback_text
        self.status = status
        self.lesson_metadata = lesson_metadata
        self.parent_feedback_id = parent_feedback_id
        self.response_list = response_list
        self.unread_response_count = unread_response_count
        self.created_on_msecs = created_on_msecs

    def to_dict(self) -> LessonFeedbackDict:
        """Returns a dict representation of this LessonFeedback object.

        Returns:
            LessonFeedbackDict. A dict representation of the object.
        """
        return {
            'id': self.id,
            'feedback_text': self.feedback_text,
            'status': self.status,
            'lesson_metadata': self.lesson_metadata,
            'parent_feedback_id': self.parent_feedback_id,
            'response_list': self.response_list,
            'unread_response_count': self.unread_response_count,
            'created_on_msecs': self.created_on_msecs,
        }

    def to_summary_dict(self) -> LessonFeedbackSummaryDict:
        """Returns a lightweight summary dict for use in list views.

        Returns:
            LessonFeedbackSummaryDict. A summary dict representation of the
            object.
        """
        feedback_text_preview = self.feedback_text
        if len(feedback_text_preview) > 100:
            feedback_text_preview = feedback_text_preview[:97] + '...'
        return {
            'id': self.id,
            'feedback_text_preview': feedback_text_preview,
            'status': self.status,
            'source': feconf.SOURCE_LESSON,
            'unread_response_count': self.unread_response_count,
        }

    def to_learner_dict(self) -> LearnerLessonFeedbackDetailDict:
        """Returns the learner-facing dict representation of this feedback.

        Returns:
            LearnerLessonFeedbackDetailDict. A dict representation that omits
            internal author fields.
        """
        return {
            'id': self.id,
            'feedback_text': self.feedback_text,
            'status': self.status,
            'lesson_metadata': self.lesson_metadata,
            'parent_feedback_id': self.parent_feedback_id,
            'response_list': self.response_list,
            'unread_response_count': self.unread_response_count,
            'created_on_msecs': self.created_on_msecs,
        }


class PlatformFeedback:
    """Domain object for a lesson issue report or site issue report.

    Encapsulates all fields of a single report submission, including the
    automatically determined destination dashboard based on source and
    category.

    Fields:
        id: str. Unique identifier of the report.
        report_message: str. The text body of the report.
        source: str. Origin of the report ("lesson" | "app").
        platform: str. Submission platform ("web" | "android").
        destination_dashboard: str. Routing target ("curriculum" |
            "tech-external" | "tech-internal").
        status: str. Current moderation status
            (open | fixed | ignored | compliment | not_actionable).
        category: Optional[str]. Report category; present for lesson reports,
            None for site reports.
        lesson_metadata: Optional[LessonMetadataDict]. Lesson context snapshot;
            present for lesson reports, None for site reports.
        include_technical_logs: bool. Whether session diagnostics are attached.
        session_info: Optional[Dict[str, object]]. Session diagnostics; present
            if include_technical_logs is True and destination_dashboard is not "curriculum".
        screenshot_filename: Optional[str]. GCS filename of the screenshot.
        screenshot_entity_id: Optional[str]. GCS entity ID for the screenshot.
        created_on_msecs: float. Creation timestamp in milliseconds.
        page_url: str. Page URL where the report was submitted.
    """

    def __init__(
        self,
        report_id: str,
        report_message: str,
        source: str,
        platform: str,
        destination_dashboard: str,
        status: str,
        include_technical_logs: bool,
        created_on_msecs: float,
        page_url: str,
        # Here we use object because session-info diagnostics are heterogeneous
        # JSON-like payloads (nested dict/list values) from client logs.
        session_info: Optional[Dict[str, object]] = None,
        category: Optional[str] = None,
        lesson_metadata: Optional[LessonMetadataDict] = None,
        screenshot_filename: Optional[str] = None,
        screenshot_entity_id: Optional[str] = None,
    ) -> None:
        self.id = report_id
        self.report_message = report_message
        self.source = source
        self.platform = platform
        self.destination_dashboard = destination_dashboard
        self.status = status
        self.page_url = page_url
        self.category = category
        self.lesson_metadata = lesson_metadata
        self.include_technical_logs = include_technical_logs
        self.session_info = (
            session_info
            if destination_dashboard != feconf.DESTINATION_CURRICULUM
            else None
        )
        self.screenshot_filename = screenshot_filename
        self.screenshot_entity_id = screenshot_entity_id
        self.created_on_msecs = created_on_msecs

    def to_dict(self) -> PlatformFeedbackDict:
        """Returns a dict representation of this PlatformFeedback object.

        Returns:
            PlatformFeedbackDict. A dict representation of the object.
        """
        return {
            'id': self.id,
            'report_message': self.report_message,
            'source': self.source,
            'platform': self.platform,
            'destination_dashboard': self.destination_dashboard,
            'status': self.status,
            'page_url': self.page_url,
            'category': self.category,
            'lesson_metadata': self.lesson_metadata,
            'include_technical_logs': self.include_technical_logs,
            'session_info': (
                self.session_info
                if self.destination_dashboard != feconf.DESTINATION_CURRICULUM
                else None
            ),
            'screenshot_filename': self.screenshot_filename,
            'screenshot_entity_id': self.screenshot_entity_id,
            'created_on_msecs': self.created_on_msecs,
        }

    def to_summary_dict(self) -> PlatformFeedbackSummaryDict:
        """Returns a lightweight summary dict for use in list views.

        Returns:
            PlatformFeedbackSummaryDict. A summary dict representation of the
            object.
        """
        report_message_preview = self.report_message
        if len(report_message_preview) > 100:
            report_message_preview = report_message_preview[:97] + '...'
        return {
            'id': self.id,
            'report_message_preview': report_message_preview,
            'status': self.status,
            'source': self.source,
            'category': self.category,
        }
