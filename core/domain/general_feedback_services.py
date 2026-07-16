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

"""Services for learner lesson feedback and platform issue report submissions."""

from __future__ import annotations

import urllib.parse

from core import feconf, utils
from core.domain import general_feedback_domain
from core.platform import models

from typing import Dict, List, Optional, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import general_feedback_models

(general_feedback_models,) = models.Registry.import_models(
    [models.Names.GENERAL_FEEDBACK]
)


def _lesson_feedback_model_to_domain(
    model: general_feedback_models.LessonFeedbackModel,
) -> general_feedback_domain.LessonFeedback:
    """Converts a LessonFeedbackModel to a LessonFeedback domain object.

    Args:
        model: LessonFeedbackModel. The model to convert.

    Returns:
        LessonFeedback. The corresponding domain object.
    """
    lesson_metadata = model.lesson_metadata or {}
    lesson_metadata: general_feedback_domain.LessonMetadataDict = {
        'exploration_id': lesson_metadata.get('exploration_id', ''),
        'exploration_version': lesson_metadata.get('exploration_version', 0),
        'state_name': lesson_metadata.get('state_name', ''),
        'state_index': lesson_metadata.get('state_index', 0),
        'learner_current_answer': lesson_metadata.get('learner_current_answer'),
    }

    # responded_by is stored in the backend for internal tracking of who authored
    # a staff response. Since this information is not intended for learners, remove
    # it before surfacing the data through the domain layer. Only response_text and
    # responded_on are exposed.
    sanitized_responses: List[
        general_feedback_domain.LessonFeedbackResponseDict
    ] = [
        {
            'response_text': r.get('response_text', ''),
            'responded_on': r.get('responded_on', 0.0),
        }
        for r in (model.response_list or [])
    ]

    return general_feedback_domain.LessonFeedback(
        feedback_id=model.id,
        author_id=model.author_id,
        feedback_text=model.feedback_text,
        status=model.status,
        lesson_metadata=lesson_metadata,
        parent_feedback_id=model.parent_feedback_id,
        response_list=sanitized_responses,
        unread_response_count=model.unread_response_count,
        created_on_msecs=utils.get_time_in_millisecs(model.created_on),
    )


def _platform_feedback_model_to_domain(
    model: general_feedback_models.PlatformFeedbackModel,
) -> general_feedback_domain.PlatformFeedback:
    """Converts a PlatformFeedbackModel to a PlatformFeedback domain object.

    Args:
        model: PlatformFeedbackModel. The model to convert.

    Returns:
        PlatformFeedback. The corresponding domain object.
    """
    lesson_metadata: Optional[general_feedback_domain.LessonMetadataDict] = None
    if model.lesson_metadata is not None:
        raw = model.lesson_metadata
        lesson_metadata = {
            'exploration_id': raw.get('exploration_id', ''),
            'exploration_version': raw.get('exploration_version', 0),
            'state_name': raw.get('state_name', ''),
            'state_index': raw.get('state_index', 0),
            'learner_current_answer': raw.get('learner_current_answer'),
        }

    return general_feedback_domain.PlatformFeedback(
        report_id=model.id,
        feedback_text=model.feedback_text,
        source=model.source,
        platform=model.platform,
        destination_dashboard=model.destination_dashboard,
        status=model.status,
        page_url=model.page_url,
        category=model.category,
        lesson_metadata=lesson_metadata,
        include_technical_logs=model.include_technical_logs,
        screenshot_filename=model.screenshot_filename,
        screenshot_entity_id=model.screenshot_entity_id,
        created_on_msecs=utils.get_time_in_millisecs(model.created_on),
    )


def _determine_destination_dashboard(
    page_url: str, category: Optional[str]
) -> str:
    """Determines the destination dashboard based on page_url, source and category.

    Routing rules:
        - All site (app) reports → technical (depends on the team that owns the page URL.)
        - typo → creator
        - confusing_or_incorrect_answer → creator
        - broken_layout_or_image → technical (depends on the team that owns the page URL.)
        - other_or_not_sure → technical (depends on the team that owns the page URL.)

    Args:
        page_url: str. The page URL where the report was submitted.
        category: Optional[str]. The report category; None for site reports.

    Returns:
        str. The destination dashboard ("creator" | "LEAP" | "CORE).
    """
    if category in feconf.CREATOR_DASHBOARD_CATEGORIES:
        return feconf.DESTINATION_CREATOR
    else:
        parsed_url = urllib.parse.urlparse(page_url)
        path = parsed_url.path.strip('/')
        first_path_segement = path.split('/', 1)[0]

        if first_path_segement in feconf.LEAP_DASHBOARD_PATHS:
            return feconf.DESTINATION_TECHNICAL_LEAP_TEAM
        else:
            return feconf.DESTINATION_TECHNICAL_CORE_TEAM


def create_lesson_feedback(
    author_id: str,
    feedback_text: str,
    lesson_metadata: general_feedback_domain.LessonMetadataDict,
    parent_feedback_id: Optional[str] = None,
) -> general_feedback_domain.LessonFeedback:
    """Creates a new lesson feedback entry and returns its domain object.

    Args:
        author_id: str. User ID of the logged-in learner. Lesson feedback
            always requires a logged-in user.
        feedback_text: str. The main text body submitted by the learner.
        lesson_metadata: LessonMetadataDict. Snapshot of lesson context
            at submission time, including exploration_id, exploration_version,
            state_name, state_index, and learner_current_answer.
        parent_feedback_id: Optional[str]. If provided, links this submission
            as a follow-up note to the original LessonFeedback entry.

    Returns:
        LessonFeedback. The created feedback as a domain object.
    """
    feedback_id = general_feedback_models.LessonFeedbackModel.create(
        author_id=author_id,
        feedback_text=feedback_text,
        # Here we use cast because lesson_metadata is a TypedDict, while
        # the storage model create() method expects a Dict.
        lesson_metadata=cast(Dict[str, Union[str, int, None]], lesson_metadata),
        parent_feedback_id=parent_feedback_id,
    )

    model = general_feedback_models.LessonFeedbackModel.get_by_id(feedback_id)
    return _lesson_feedback_model_to_domain(model)


def create_platform_report(
    feedback_text: str,
    source: str,
    page_url: str,
    category: Optional[str],
    lesson_metadata: Optional[general_feedback_domain.LessonMetadataDict],
    # Here we use object because session-info diagnostics are heterogeneous
    # JSON-like payloads (nested dict/list values) from client logs.
    session_info: Optional[Dict[str, object]],
    screenshot_filename: Optional[str],
    screenshot_entity_id: Optional[str],
    include_technical_logs: bool,
) -> general_feedback_domain.PlatformFeedback:
    """Creates a new issue report (lesson or site) and returns its domain object.

    Routing is determined automatically inside PlatformFeedbackModel.create:
        typo                          → creator dashboard
        confusing_or_incorrect_answer → creator dashboard
        broken_layout_or_image        → technical dashboard
        other_or_not_sure             → technical dashboard
        all site (app) reports        → technical dashboard

    Args:
        feedback_text: str. Description of the reported issue.
        source: str. Handler-facing source value. One of "lesson" or "site".
            "site" is mapped to the model constant SOURCE_APP before storage.
        category: Optional[str]. Report category; required for lesson reports,
            must be None for site reports.
        lesson_metadata: Optional[LessonMetadataDict]. Lesson context
            snapshot; required for lesson reports, None for site reports.
        session_info: Optional[Dict[str, object]]. Session diagnostics
            attached when include_technical_logs is True; None otherwise.
        screenshot_filename: Optional[str]. GCS filename of the uploaded
            screenshot, or None if no screenshot was provided.
        screenshot_entity_id: Optional[str]. GCS entity ID for the screenshot.
            Must be provided if and only if screenshot_filename is provided.
        include_technical_logs: bool. Whether session diagnostics are attached
            to this report.
        page_url: str. Page URL where the report was submitted.

    Returns:
        PlatformFeedback. The created report as a domain object.
    """
    # Map the handler-facing "site" source value to the model constant.
    model_source = (
        feconf.SOURCE_APP if source == 'site' else feconf.SOURCE_LESSON
    )

    destination_dashboard = _determine_destination_dashboard(
        category=category,
        page_url=page_url,
    )

    report_id = general_feedback_models.PlatformFeedbackModel.create(
        feedback_text=feedback_text,
        source=model_source,
        platform=feconf.PLATFORM_WEB,
        category=category,
        destination_dashboard=destination_dashboard,
        # Here we use cast because lesson_metadata is a TypedDict, while
        # the storage model create() method expects a Dict.
        lesson_metadata=cast(
            Optional[Dict[str, Union[str, int, None]]], lesson_metadata
        ),
        include_technical_logs=include_technical_logs,
        screenshot_filename=screenshot_filename,
        screenshot_entity_id=screenshot_entity_id,
        page_url=page_url,
    )

    # Persist session diagnostics in a linked FeedbackSessionLogModel when
    # the user opted in. The log uses the same ID as the report model.
    if include_technical_logs and session_info is not None:
        console_logs = session_info.get('console_logs')
        failed_requests = session_info.get('failed_requests')
        navigation_history = session_info.get('navigation_history')
        environment = session_info.get('environment')
        if not isinstance(console_logs, list):
            console_logs = []
        if not isinstance(failed_requests, list):
            failed_requests = []
        if not isinstance(navigation_history, list):
            navigation_history = []
        if not isinstance(environment, dict):
            environment = {}
        general_feedback_models.FeedbackSessionLogModel.create(
            report_id=report_id,
            console_logs=console_logs,
            failed_requests=failed_requests,
            navigation_history=navigation_history,
            environment=environment,
        )

    model = general_feedback_models.PlatformFeedbackModel.get_by_id(report_id)
    return _platform_feedback_model_to_domain(model)
