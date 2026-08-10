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
    general_feedback_domain,
    topic_services,
)
from core.platform import models

from typing import Dict, List, Optional, Tuple, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import general_feedback_models

(general_feedback_models,) = models.Registry.import_models(
    [models.Names.GENERAL_FEEDBACK]
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
        recipient_email = _get_classroom_feedback_recipient_email(
            feedback.lesson_metadata['exploration_id']
        )

    elif feedback.destination_dashboard == feconf.DESTINATION_CURRICULUM:
        assert feedback.lesson_metadata is not None
        recipient_email = _get_classroom_feedback_recipient_email(
            feedback.lesson_metadata['exploration_id']
        )

    elif (
        feedback.destination_dashboard
        == feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM
    ):
        recipient_email = feconf.DESTINATION_TECHNICAL_EXTERNAL_TEAM_EMAIL

    elif (
        feedback.destination_dashboard
        == feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM
    ):
        recipient_email = feconf.DESTINATION_TECHNICAL_INTERNAL_TEAM_EMAIL

    else:
        raise utils.InvalidInputException(
            'Invalid destination dashboard: %s' % feedback.destination_dashboard
        )
    # send email to recipient
