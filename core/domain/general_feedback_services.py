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

from typing import Dict, List, Optional, Tuple, Union, cast

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
    raw_lesson_metadata = model.lesson_metadata or {}
    lesson_metadata: general_feedback_domain.LessonMetadataDict = {
        'exploration_id': raw_lesson_metadata.get('exploration_id', ''),
        'exploration_version': raw_lesson_metadata.get(
            'exploration_version', 0
        ),
        'state_name': raw_lesson_metadata.get('state_name', ''),
        'state_index': raw_lesson_metadata.get('state_index', 0),
        'learner_current_answer': raw_lesson_metadata.get(
            'learner_current_answer'
        ),
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
    session_info_model: Optional[
        general_feedback_models.FeedbackSessionLogModel
    ] = None,
) -> general_feedback_domain.PlatformFeedback:
    """Converts a PlatformFeedbackModel to a PlatformFeedback domain object.

    Args:
        model: PlatformFeedbackModel. The model to convert.
        session_info_model: Optional[FeedbackSessionLogModel]. The session info
            model for the feedback.

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

    # Here we use object because session-info diagnostics are heterogeneous
    # JSON-like payloads (nested dict/list values) from client logs.
    session_info: Optional[Dict[str, object]] = None
    if session_info_model is not None:
        session_info = {
            'console_logs': session_info_model.console_logs or [],
            'failed_requests': (session_info_model.failed_requests or []),
            'navigation_history': (session_info_model.navigation_history or []),
            'environment': session_info_model.environment or {},
        }

    return general_feedback_domain.PlatformFeedback(
        report_id=model.id,
        report_message=model.feedback_text,
        source=model.source,
        platform=model.platform,
        destination_dashboard=model.destination_dashboard,
        status=model.status,
        page_url=model.page_url,
        category=model.category,
        lesson_metadata=lesson_metadata,
        include_technical_logs=model.include_technical_logs,
        session_info=session_info,
        screenshot_filename=model.screenshot_filename,
        screenshot_entity_id=model.screenshot_entity_id,
        created_on_msecs=utils.get_time_in_millisecs(model.created_on),
    )


def _determine_destination_dashboard(
    page_url: str, category: Optional[str]
) -> str:
    """Determines the destination dashboard based on page_url, source and category.

    Routing rules:
        - All site (app) reports → technical (depends on the team that owns
          the page URL.)
        - typo → curriculum
        - confusing_or_incorrect_answer → curriculum
        - broken_layout_or_image → technical (depends on the team that owns
          the page URL.)
        - other_or_not_sure → technical (depends on the team that owns the
          page URL.)

    Args:
        page_url: str. The page URL where the report was submitted.
        category: Optional[str]. The report category; None for site reports.

    Returns:
        str. The destination dashboard ("curriculum" | "tech-external" |
        "tech-internal").
    """
    if category in feconf.CREATOR_DASHBOARD_CATEGORIES:
        return feconf.DESTINATION_CURRICULUM
    else:
        parsed_url = urllib.parse.urlparse(page_url)
        path = parsed_url.path.strip('/')
        first_path_segement = path.split('/', 1)[0]

        if first_path_segement in feconf.TECHNICAL_EXTERNAL_DASHBOARD_PATHS:
            return feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
        else:
            return feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM


def validate_platform_feedback_belongs_to_dashboard(
    feedback: general_feedback_domain.PlatformFeedback,
    dashboard: str,
    dashboard_id: str,
) -> None:
    """Validates that the feedback belongs to the requested dashboard.

    Args:
        feedback: PlatformFeedback. The feedback to validate.
        dashboard: str. The dashboard from which the feedback is being
            accessed. This is either "creator" or "technical".
        dashboard_id: str. The dashboard-specific identifier. This is the
            exploration ID for the Creator Dashboard and the team identifier
            ("tech-external" or "tech-internal") for the Technical Dashboard.

    Raises:
        ValueError. The feedback does not belong to the requested dashboard.
    """
    if dashboard == feconf.DESTINATION_CURRICULUM:
        if (
            feedback.destination_dashboard != feconf.DESTINATION_CURRICULUM
            or feedback.lesson_metadata is None
        ):
            raise ValueError(
                'Feedback does not belong to the requested dashboard.'
            )
        exploration_id = feedback.lesson_metadata['exploration_id']
        if exploration_id != dashboard_id:
            raise ValueError(
                'Feedback does not belong to the requested exploration.'
            )
        return

    if dashboard == feconf.DESTINATION_TECHNICAL:
        if dashboard_id not in feconf.TECHNICAL_FEEDBACK_TEAM_CHOICES:
            raise ValueError('Invalid technical feedback team.')
        if feedback.destination_dashboard != dashboard_id:
            raise ValueError(
                'Feedback does not belong to the requested dashboard.'
            )
        return

    raise ValueError('Invalid dashboard.')


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


def get_lesson_feedback(
    feedback_id: str,
) -> Optional[general_feedback_domain.LessonFeedback]:
    """Returns the full LessonFeedback domain object for the given ID.

    Args:
        feedback_id: str. The ID of the lesson feedback to retrieve.

    Returns:
        Optional[LessonFeedback]. The retrieved feedback, or None if not found.
    """
    model = general_feedback_models.LessonFeedbackModel.get(
        feedback_id, strict=False
    )
    if model is None:
        return None
    return _lesson_feedback_model_to_domain(model)


def get_lesson_feedback_summaries(
    exp_id: str,
    status_filter: Optional[str] = feconf.STATUS_CHOICES_OPEN,
    cursor: Optional[str] = None,
    date_from_msecs: Optional[float] = None,
    date_to_msecs: Optional[float] = None,
) -> Tuple[
    List[general_feedback_domain.LessonFeedbackSummaryDict],
    Optional[str],
    bool,
]:
    """Returns a page of lesson feedback summaries with optional filters.

    Used by the Creator Dashboard GET.

    Args:
        exp_id: str. The exploration id to retrieve feedback for.
        status_filter: Optional[str]. If provided, only return reports with
            this status. Otherwise, open status reports are shown.
        cursor: Optional[str]. Pagination cursor from a previous response.
        date_from_msecs: Optional[float]. If provided, only return reports
            created after this time.
        date_to_msecs: Optional[float]. If provided, only return reports
            created before this time.

    Returns:
        tuple(summaries, next_cursor, more). Where:
            summaries: list(LessonFeedbackSummaryDict). The feedback
                summaries on the page.
            next_cursor: str|None. The cursor for the next page, or None.
            more: bool. Whether more results exist.
    """
    exploration_id = exp_id
    date_from = (
        utils.convert_millisecs_time_to_datetime_object(date_from_msecs)
        if date_from_msecs is not None
        else None
    )
    date_to = (
        utils.convert_millisecs_time_to_datetime_object(date_to_msecs)
        if date_to_msecs is not None
        else None
    )
    model_list, next_cursor, more = (
        general_feedback_models.LessonFeedbackModel.fetch_page(
            page_size=20,
            cursor=cursor,
            exploration_id=exploration_id,
            status_filter=status_filter,
            date_from=date_from,
            date_to=date_to,
        )
    )
    # Here we use cast because PlatformFeedbackModel.fetch_page() inherits its
    # return annotation from BaseFeedbackModel.fetch_page().
    summaries = [
        _lesson_feedback_model_to_domain(
            cast(general_feedback_models.LessonFeedbackModel, model)
        ).to_summary_dict()
        for model in model_list
    ]
    return summaries, next_cursor, more


def get_learner_feedback_summaries(
    author_id: str,
    status_filter: Optional[str] = None,
    cursor: Optional[str] = None,
    date_from_msecs: Optional[float] = None,
    date_to_msecs: Optional[float] = None,
) -> Tuple[
    List[general_feedback_domain.LessonFeedbackSummaryDict],
    Optional[str],
    bool,
]:
    """Returns a page of lesson feedback summaries for a learner.

    Args:
        author_id: str. The learner user ID.
        status_filter: Optional[str]. If provided, only return feedback with
            this status.
        cursor: Optional[str]. Pagination cursor from a previous response.
        date_from_msecs: Optional[float]. If provided, only return feedback
            created after this time.
        date_to_msecs: Optional[float]. If provided, only return feedback
            created before this time.

    Returns:
        tuple(summaries, next_cursor, more). Where:
            summaries: list(LessonFeedbackSummaryDict). The feedback summaries
                on the page.
            next_cursor: str|None. The cursor for the next page, or None.
            more: bool. Whether more results exist.
    """
    date_from = (
        utils.convert_millisecs_time_to_datetime_object(date_from_msecs)
        if date_from_msecs is not None
        else None
    )
    date_to = (
        utils.convert_millisecs_time_to_datetime_object(date_to_msecs)
        if date_to_msecs is not None
        else None
    )
    model_list, next_cursor, more = (
        general_feedback_models.LessonFeedbackModel.fetch_page(
            page_size=20,
            cursor=cursor,
            author_id=author_id,
            status_filter=status_filter,
            date_from=date_from,
            date_to=date_to,
        )
    )
    # Here we use cast because LessonFeedbackModel.fetch_page() inherits its
    # return annotation from BaseFeedbackModel.fetch_page().
    summaries = [
        _lesson_feedback_model_to_domain(
            cast(general_feedback_models.LessonFeedbackModel, model)
        ).to_summary_dict()
        for model in model_list
    ]
    return summaries, next_cursor, more


def get_learner_feedback(
    feedback_id: str, author_id: str
) -> Optional[general_feedback_domain.LessonFeedback]:
    """Returns learner-owned lesson feedback, or None if it is inaccessible.

    Args:
        feedback_id: str. The ID of the lesson feedback to retrieve.
        author_id: str. The learner user ID that must own the feedback.

    Returns:
        Optional[LessonFeedback]. The feedback when found and owned by the
        learner, otherwise None.
    """
    model = general_feedback_models.LessonFeedbackModel.get(
        feedback_id, strict=False
    )
    if model is None or model.author_id != author_id:
        return None

    model.unread_response_count = 0
    model.update_timestamps()
    model.put()
    return _lesson_feedback_model_to_domain(model)


def _append_lesson_feedback_model_response(
    model: general_feedback_models.LessonFeedbackModel,
    response_text: str,
    responder_id: str,
) -> None:
    """Appends a creator response to a lesson feedback model.

    Args:
        model: LessonFeedbackModel. The model to update.
        response_text: str. The response text.
        responder_id: str. The user ID of the creator who responded.
    """
    # Here we use cast because JsonProperty values are not statically typed,
    # but LessonFeedbackModel.response_list stores response dictionaries.
    response_list = cast(
        List[Dict[str, Union[str, float]]], model.response_list or []
    )
    response_list.append(
        {
            'response_text': response_text,
            'responded_by': responder_id,
            'responded_on': utils.get_current_time_in_millisecs(),
        }
    )
    model.response_list = response_list
    model.unread_response_count += 1


def update_lesson_feedback(
    feedback_id: str,
    new_status: str,
    exp_id: str,
    responder_id: str,
    reply_text: Optional[str] = None,
) -> Optional[general_feedback_domain.LessonFeedback]:
    """Updates status and optionally appends a creator reply.

    Args:
        feedback_id: str. ID of the LessonFeedbackModel to update.
        new_status: str. The new status value. Must be a valid status choice.
        exp_id: str. The exploration from which the feedback is being
            accessed.
        responder_id: str. The user ID of the creator making the update.
        reply_text: Optional[str]. Reply text to append to response_list.

    Returns:
        Optional[LessonFeedback]. The updated feedback, or None if not found.

    Raises:
        ValueError. The new status is invalid or exploration access is invalid.
    """
    if new_status not in feconf.STATUS_CHOICES:
        raise ValueError('Invalid status: %s' % new_status)

    model = general_feedback_models.LessonFeedbackModel.get(
        feedback_id, strict=False
    )
    if model is None:
        return None
    if model.lesson_metadata['exploration_id'] != exp_id:
        raise ValueError('Invalid exploration ID: %s' % exp_id)

    model.status = new_status
    if reply_text is not None:
        _append_lesson_feedback_model_response(
            model=model,
            response_text=reply_text,
            responder_id=responder_id,
        )
    model.update_timestamps()
    model.put()
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
        feconf.SOURCE_APP if source == 'app' else feconf.SOURCE_LESSON
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


def get_platform_feedback(
    report_id: str,
) -> Optional[general_feedback_domain.PlatformFeedback]:
    """Returns the full PlatformFeedback domain object for the given ID.

    Args:
        report_id: str. The ID of the platform feedback to retrieve.

    Returns:
        Optional[PlatformFeedback]. The retrieved report, or None if not found.
    """
    model = general_feedback_models.PlatformFeedbackModel.get(
        report_id, strict=False
    )
    if model is None:
        return None
    session_info_model = general_feedback_models.FeedbackSessionLogModel.get(
        report_id, strict=False
    )
    return _platform_feedback_model_to_domain(model, session_info_model)


def get_platform_feedback_summaries(
    dashboard: str,
    dashboard_id: str,
    status_filter: Optional[str] = feconf.STATUS_CHOICES_OPEN,
    cursor: Optional[str] = None,
    date_from_msecs: Optional[float] = None,
    date_to_msecs: Optional[float] = None,
) -> Tuple[
    List[general_feedback_domain.PlatformFeedbackSummaryDict],
    Optional[str],
    bool,
]:
    """Returns a page of platform feedback summaries with optional filters.

    Used by the Creator Dashboard GET and Technical Dashboard GET.

    Args:
        dashboard: str. The dashboard for which feedback is requested. This is
            either "creator" or "technical".
        dashboard_id: str. Identifier associated with the requested dashboard.
            This is an exploration ID for creator dashboards and a technical
            team ("tech-external" or "tech-internal") for technical
            dashboards.
        status_filter: Optional[str]. If provided, only return reports with
            this status. Otherwise, open status reports are shown.
        cursor: Optional[str]. Pagination cursor from a previous response.
        date_from_msecs: Optional[float]. If provided, only return reports
            created after this time.
        date_to_msecs: Optional[float]. If provided, only return reports
            created before this time.

    Returns:
        tuple(summaries, next_cursor, more). Where:
            summaries: list(PlatformFeedbackSummaryDict). The feedback
                summaries on the page.
            next_cursor: str|None. The cursor for the next page, or None.
            more: bool. Whether more results exist.

    Raises:
        ValueError. The dashboard or technical team is invalid.
    """
    if dashboard not in feconf.PLATFORM_FEEDBACK_DASHBOARD_CHOICES:
        raise ValueError('Invalid dashboard: %s' % dashboard)
    if dashboard == feconf.DESTINATION_CURRICULUM:
        exploration_id = dashboard_id
        dashboard_filter = feconf.DESTINATION_CURRICULUM
    else:
        if dashboard_id not in feconf.TECHNICAL_FEEDBACK_TEAM_CHOICES:
            raise ValueError(
                'Invalid technical feedback team: %s' % dashboard_id
            )
        exploration_id = None
        dashboard_filter = dashboard_id
    date_from = (
        utils.convert_millisecs_time_to_datetime_object(date_from_msecs)
        if date_from_msecs is not None
        else None
    )
    date_to = (
        utils.convert_millisecs_time_to_datetime_object(date_to_msecs)
        if date_to_msecs is not None
        else None
    )
    model_list, next_cursor, more = (
        general_feedback_models.PlatformFeedbackModel.fetch_page(
            page_size=20,
            cursor=cursor,
            destination_dashboard=dashboard_filter,
            exploration_id=exploration_id,
            status_filter=status_filter,
            date_from=date_from,
            date_to=date_to,
        )
    )
    # Here we use cast because PlatformFeedbackModel.fetch_page() inherits its
    # return annotation from BaseFeedbackModel.fetch_page().
    summaries = [
        _platform_feedback_model_to_domain(
            cast(general_feedback_models.PlatformFeedbackModel, model)
        ).to_summary_dict()
        for model in model_list
    ]
    return summaries, next_cursor, more


def _update_platform_feedback_model_status(
    model: general_feedback_models.PlatformFeedbackModel,
    new_status: str,
) -> general_feedback_domain.PlatformFeedback:
    """Updates the status of a platform feedback model.

    Args:
        model: PlatformFeedbackModel. The model to update.
        new_status: str. The new status value.

    Returns:
        PlatformFeedback. The updated report.
    """
    model.status = new_status
    model.update_timestamps()
    model.put()
    return _platform_feedback_model_to_domain(model)


def update_platform_feedback_status_for_dashboard(
    report_id: str,
    new_status: str,
    dashboard: str,
    dashboard_id: str,
) -> Optional[general_feedback_domain.PlatformFeedback]:
    """Updates the status of a platform feedback report for a dashboard.

    Args:
        report_id: str. ID of the PlatformFeedbackModel to update.
        new_status: str. The new status value. Must be a valid status choice.
        dashboard: str. The dashboard from which the feedback is being accessed.
        dashboard_id: str. The dashboard-specific identifier.

    Returns:
        Optional[PlatformFeedback]. The updated report, or None if not found.

    Raises:
        ValueError. The new status is invalid or dashboard access is invalid.
    """
    if new_status not in feconf.STATUS_CHOICES:
        raise ValueError('Invalid status: %s' % new_status)

    model = general_feedback_models.PlatformFeedbackModel.get(
        report_id, strict=False
    )
    if model is None:
        return None

    validate_platform_feedback_belongs_to_dashboard(
        feedback=_platform_feedback_model_to_domain(model),
        dashboard=dashboard,
        dashboard_id=dashboard_id,
    )
    return _update_platform_feedback_model_status(model, new_status)
