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

"""Services for sending web user feedback emails."""

from __future__ import annotations

from core import feconf, utils
from core.domain import (
    classroom_config_services,
    email_manager,
    general_feedback_domain,
    platform_parameter_list,
    platform_parameter_services,
    topic_services,
    user_services,
)

from typing import Union


def _get_oppia_site_url_for_emails() -> str:
    """Returns the Oppia site URL used for email links.

    Returns:
        str. The Oppia site URL configured for email notifications.
    """
    oppia_site_url_for_emails = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.OPPIA_SITE_URL_FOR_EMAILS.value
        )
    )
    assert isinstance(oppia_site_url_for_emails, str)
    return oppia_site_url_for_emails


def _get_technical_feedback_url(
    feedback: general_feedback_domain.PlatformFeedback,
) -> str:
    """Returns the URL for a technical feedback report.

    Args:
        feedback: The platform feedback report.

    Returns:
        str. The URL to the specific technical feedback report.
    """
    return '%s/technical-feedback-dashboard/%s/%s' % (
        _get_oppia_site_url_for_emails(),
        feedback.destination_dashboard,
        feedback.id,
    )


def _get_curriculum_feedback_url(
    feedback: Union[
        general_feedback_domain.LessonFeedback,
        general_feedback_domain.PlatformFeedback,
    ],
) -> str:
    """Returns the URL for a curriculum feedback report.

    Args:
        feedback: The submitted lesson or curriculum platform feedback.

    Returns:
        str. The URL to the specific feedback report in the
        Exploration Editor Feedback Tab.
    """
    assert feedback.lesson_metadata is not None

    feedback_type = (
        'lesson_feedback'
        if isinstance(feedback, general_feedback_domain.LessonFeedback)
        else 'lesson_issue'
    )

    return '%s/create/%s#/feedback/%s/%s' % (
        _get_oppia_site_url_for_emails(),
        feedback.lesson_metadata['exploration_id'],
        feedback_type,
        feedback.id,
    )


def _get_my_suggestions_tab_url(
    feedback: general_feedback_domain.LessonFeedback,
) -> str:
    """Returns the URL for a curriculum feedback report on the My Suggestions Tab.

    Args:
        feedback: The submitted lesson feedback.

    Returns:
        str. The URL to the specific feedback report in the
        My Suggestions Tab.
    """
    return '%s/learner-dashboard?active_tab=my-suggestions&feedback_id=%s' % (
        _get_oppia_site_url_for_emails(),
        feedback.id,
    )


def _get_classroom_feedback_recipient_email(
    exploration_id: str,
) -> str:
    """Returns the feedback recipient email for an exploration's classroom.

    Args:
        exploration_id: The ID of the exploration associated with the
            feedback.

    Returns:
        str. The email address configured to receive feedback for the
        corresponding classroom.
    """
    topic_ids = topic_services.get_topic_ids_for_exploration_id(exploration_id)

    for topic_id in topic_ids:
        classroom = classroom_config_services.get_classroom_by_topic_id(
            topic_id
        )
        if classroom is not None:
            return classroom.feedback_recipient_email

    return feconf.DEFAULT_CLASSROOM_FEEDBACK_RECIPIENT_EMAIL


def _get_curriculum_feedback_submission_email_body(
    feedback: Union[
        general_feedback_domain.LessonFeedback,
        general_feedback_domain.PlatformFeedback,
    ],
    feedback_url: str,
) -> str:
    """Returns the email body for curriculum feedback submission.

    Args:
        feedback: The submitted lesson or curriculum platform feedback.
        feedback_url: URL to the specific feedback entry.

    Returns:
        str. The rendered HTML email body.
    """
    feedback_text = (
        feedback.feedback_text
        if isinstance(feedback, general_feedback_domain.LessonFeedback)
        else feedback.report_message
    )

    assert feedback.lesson_metadata is not None
    exp_id = feedback.lesson_metadata['exploration_id']

    category_text = ''
    if (
        isinstance(feedback, general_feedback_domain.PlatformFeedback)
        and feedback.category
    ):
        category_text = '<b>Category:</b> %s<br><br>' % feedback.category

    return (
        'Hi Lessons Team!<br><br>'
        'A new feedback report has been submitted for exploration '
        '<b>%s</b> on Oppia.<br><br>'
        '<b>Feedback:</b><br>'
        '%s<br><br>'
        '%s'
        'You can review and respond to this feedback using the '
        '<a href="%s">Exploration Editor Feedback Tab</a>.<br><br>'
        'Thanks for taking the time to review this feedback!<br>'
        '- The Oppia Exploration Feedback Team'
        % (
            exp_id,
            feedback_text,
            category_text,
            feedback_url,
        )
    )


def _get_technical_feedback_submission_email_body(
    feedback: general_feedback_domain.PlatformFeedback,
    feedback_url: str,
    team_name: str,
) -> str:
    """Returns the email body for technical-external and technical-internal feedback submission.

    Args:
        feedback: The submitted platform feedback routed to the
            technical-external dashboard.
        feedback_url: URL to the specific feedback entry.
        team_name: Name of the team responsible for the destination dashboard.

    Returns:
        str. The rendered HTML email body.
    """
    category_text = ''
    if feedback.category and feedback.lesson_metadata:
        category_text = (
            'The feedback was categorized as <b>%s</b> for this exploration '
            '<b>%s</b>.<br><br>'
            % (
                feedback.category,
                feedback.lesson_metadata['exploration_id'],
            )
        )
    return (
        'Hi "%s" Team!<br><br>'
        'A new technical feedback report has been submitted on Oppia.<br><br>'
        '<b>Feedback:</b><br>'
        '%s<br><br>'
        '%s'
        '<b>Page:</b> <a href="%s">%s</a><br><br>'
        'You can review and, if found buggy, transfer this report to '
        'GitHub using the <a href="%s">Technical Feedback Dashboard</a>.'
        '<br><br>'
        'Thanks for taking the time to review this feedback!<br>'
        '- The Oppia Technical Feedback Dashboard Team'
        % (
            team_name,
            feedback.report_message,
            category_text,
            feedback.page_url,
            feedback.page_url,
            feedback_url,
        )
    )


def _get_feedback_status_change_email_body(
    feedback: general_feedback_domain.LessonFeedback,
    feedback_url: str,
    author_id: str,
) -> str:
    """Returns the email body for a lesson feedback status change.

    Args:
        feedback: The lesson feedback whose status was changed.
        feedback_url: URL to the specific feedback entry.

    Returns:
        str. The rendered HTML email body.
    """
    assert feedback.lesson_metadata is not None
    exploration_id = feedback.lesson_metadata['exploration_id']
    recipient_username = user_services.get_username(author_id)
    return (
        'Hi <b>%s</b>!<br><br>'
        'The status of your feedback suggestion for exploration '
        '<b>%s</b> has been updated to <b>%s</b>.<br><br>'
        '<b>Your Feedback:</b><br>'
        '%s<br><br>'
        'You can view the feedback and its current status using the '
        '<a href="%s">My Suggestions Tab</a>.<br><br>'
        'Thanks for taking the time to share your feedback with us!<br>'
        '- The Oppia Team'
        % (
            recipient_username,
            exploration_id,
            feedback.status,
            feedback.feedback_text,
            feedback_url,
        )
    )


def _get_feedback_reply_email_body(
    feedback: general_feedback_domain.LessonFeedback,
    reply: str,
    feedback_url: str,
    author_id: str,
) -> str:
    """Returns the email body for a reply to lesson feedback.

    Args:
        feedback: The lesson feedback that received a reply.
        reply: The reply message from the creator.
        feedback_url: URL to the feedback in the My Suggestions Tab.
        author_id: ID of the user who submitted the feedback.

    Returns:
        str. The rendered HTML email body.
    """
    assert feedback.lesson_metadata is not None
    exploration_id = feedback.lesson_metadata['exploration_id']
    recipient_username = user_services.get_username(author_id)

    return (
        'Hi <b>%s</b>!<br><br>'
        'A creator has responded to your feedback suggestion for '
        'exploration <b>%s</b> on Oppia.<br><br>'
        '<b>Your Feedback:</b><br>'
        '%s<br><br>'
        '<b>Creator Response:</b><br>'
        '%s<br><br>'
        'You can view the full feedback thread and reply using the '
        '<a href="%s">My Suggestions Tab</a>.<br><br>'
        'Thanks for taking the time to help improve Oppia!<br>'
        '- The Oppia Team'
        % (
            recipient_username,
            exploration_id,
            feedback.feedback_text,
            reply,
            feedback_url,
        )
    )


def send_feedback_submission_email(
    feedback: Union[
        general_feedback_domain.LessonFeedback,
        general_feedback_domain.PlatformFeedback,
    ],
) -> None:
    """Sends an email notification when feedback is submitted.

    For lesson feedback and platform feedback routed to the curriculum
    dashboard, the email is sent to the feedback email recipients configured
    for the corresponding classroom.

    For platform feedback routed to the technical dashboards, the email is
    sent to the team responsible for the destination dashboard. Feedback
    routed to the technical-internal dashboard is sent to the CORE team,
    while feedback routed to the technical-external dashboard is sent to
    the LEAP team.

    Args:
        feedback: The submitted lesson feedback or platform feedback for
            which the notification should be sent.
    """
    if isinstance(feedback, general_feedback_domain.LessonFeedback):
        email_subject = (
            'New Lesson Feedback Suggestion submitted for %s on Oppia'
            % (feedback.lesson_metadata['exploration_id'])
        )
        recipient_id = 'lesson-creation-team'
        recipient_email = _get_classroom_feedback_recipient_email(
            feedback.lesson_metadata['exploration_id']
        )
        email_body = _get_curriculum_feedback_submission_email_body(
            feedback,
            feedback_url=_get_curriculum_feedback_url(feedback),
        )

    elif feedback.destination_dashboard == feconf.DESTINATION_CURRICULUM:
        assert feedback.lesson_metadata is not None
        recipient_id = 'lesson-creation-team'
        email_subject = (
            'New Lesson Feedback Report submitted for %s on Oppia'
            % (feedback.lesson_metadata['exploration_id'])
        )
        recipient_email = _get_classroom_feedback_recipient_email(
            feedback.lesson_metadata['exploration_id']
        )
        email_body = _get_curriculum_feedback_submission_email_body(
            feedback,
            feedback_url=_get_curriculum_feedback_url(feedback),
        )

    elif (
        feedback.destination_dashboard
        == feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
    ):
        email_subject = 'New Technical Feedback Report submitted for Oppia'
        recipient_id = 'web-leap-leads'
        recipient_email = feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM_EMAIL
        email_body = _get_technical_feedback_submission_email_body(
            feedback,
            feedback_url=_get_technical_feedback_url(feedback),
            team_name="LEAP",
        )

    elif (
        feedback.destination_dashboard
        == feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM
    ):
        email_subject = 'New Technical Feedback Report submitted for Oppia'
        recipient_id = 'web-core-leads'
        recipient_email = feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM_EMAIL
        email_body = _get_technical_feedback_submission_email_body(
            feedback,
            feedback_url=_get_technical_feedback_url(feedback),
            team_name="CORE",
        )

    else:
        raise utils.InvalidInputException(
            'Invalid destination dashboard: %s' % feedback.destination_dashboard
        )

    system_email_address = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS.value
        )
    )
    assert isinstance(system_email_address, str)

    email_manager._send_email(
        recipient_id,
        feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_WEB_USER_FEEDBACK_MESSAGE_NOTIFICATION,
        email_subject,
        email_body,
        system_email_address,
        recipient_email=recipient_email,
    )


def send_feedback_status_change_email(
    feedback: general_feedback_domain.LessonFeedback, author_id: str
) -> None:
    """Sends an email notification when the status of lesson feedback
    changes.

    Args:
        feedback: The lesson feedback whose status was changed.
        author_id: ID of the user who submitted the feedback.
    """
    email_subject = (
        'Your Lesson Feedback Status Has Been Updated for %s on Oppia'
        % feedback.lesson_metadata['exploration_id']
    )

    email_body = _get_feedback_status_change_email_body(
        feedback,
        feedback_url=_get_my_suggestions_tab_url(feedback),
        author_id=author_id,
    )

    system_email_address = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS.value
        )
    )
    assert isinstance(system_email_address, str)

    email_manager._send_email(
        author_id,
        feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_WEB_USER_FEEDBACK_MESSAGE_NOTIFICATION,
        email_subject,
        email_body,
        system_email_address,
    )


def send_feedback_reply_email(
    feedback: general_feedback_domain.LessonFeedback, reply: str, author_id: str
) -> None:
    """Sends an email notification when a feedback thread receives
    a reply.

    Args:
        feedback: The lesson feedback that received a reply.
        reply: The reply message from the creator.
        author_id: ID of the user who submitted the feedback.
    """
    assert feedback.lesson_metadata is not None

    email_subject = (
        'A Creator Has Responded to Your Feedback on %s'
        % feedback.lesson_metadata['exploration_id']
    )

    email_body = _get_feedback_reply_email_body(
        feedback,
        reply,
        feedback_url=_get_my_suggestions_tab_url(feedback),
        author_id=author_id,
    )

    system_email_address = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.SYSTEM_EMAIL_ADDRESS.value
        )
    )
    assert isinstance(system_email_address, str)

    email_manager._send_email(
        author_id,
        feconf.SYSTEM_COMMITTER_ID,
        feconf.EMAIL_INTENT_WEB_USER_FEEDBACK_MESSAGE_NOTIFICATION,
        email_subject,
        email_body,
        system_email_address,
    )
