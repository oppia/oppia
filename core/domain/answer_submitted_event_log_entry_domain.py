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

"""Domain objects for an event triggered by a student submitting an answer.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used.
"""

from __future__ import annotations

from core import feconf
from core.domain import (
    answer_submitted_event_log_entry_domain_errors as domain_errors,
)


class AnswerSubmittedEventLogEntry:
    """Domain object for an event triggered by a student submitting an answer."""

    def __init__(
        self,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent_in_state_secs: float,
        is_feedback_useful: bool,
        event_schema_version: int,
    ) -> None:
        """Initializes a AnswerSubmittedEventLogEntry domain object.

        Args:
            exp_id: str. The exploration id.
            exp_version: int. The version of the exploration.
            state_name: str. Name of current state.
            session_id: str. The id of current student's session.
            time_spent_in_state_secs: float. Time since start of this
                state before this event occurred (in sec).
            is_feedback_useful: bool. Whether the submitted answer
                received useful feedback.
            event_schema_version: int. The version of the event schema
                used to describe an event of this type.
        """
        self.exp_id = exp_id
        self.exp_version = exp_version
        self.state_name = state_name
        self.session_id = session_id
        self.time_spent_in_state_secs = time_spent_in_state_secs
        self.is_feedback_useful = is_feedback_useful
        self.event_schema_version = event_schema_version

    def validate(self) -> None:
        """Validates properties of the AnswerSubmittedEventLogEntry domain object.

        Ensures that all attributes have the expected types and values, and that
        the referenced exploration and state exist.

        Raises:
            domain_errors.InvalidExpIdError: If exp_id is not a valid string.
            domain_errors.InvalidExpVersionError: If exp_version is not a valid
                positive integer.
            domain_errors.InvalidStateNameError: If state_name is not a valid
                state in the exploration.
            domain_errors.InvalidSessionIdError: If session_id is not a string.
            domain_errors.InvalidTimeSpentError: If time_spent_in_state_secs is
                not a non-negative float.
            domain_errors.InvalidFeedbackUsefulError: If is_feedback_useful is
                not a boolean.
            domain_errors.InvalidEventSchemaVersionError: If the event schema
                version is invalid.
        """
        if not isinstance(self.exp_id, str) or not self.exp_id.strip():
            raise domain_errors.InvalidExpIdError(self.exp_id)

        if not isinstance(self.exp_version, int) or (self.exp_version < 1):
            raise domain_errors.InvalidExpVersionError(self.exp_version)

        if not isinstance(self.state_name, str):
            raise domain_errors.InvalidStateNameTypeError(self.state_name)

        if not isinstance(self.session_id, str):
            raise domain_errors.InvalidSessionIdError(self.session_id)

        if not isinstance(self.time_spent_in_state_secs, float) or (
            self.time_spent_in_state_secs < 0.0
        ):
            raise domain_errors.InvalidTimeSpentError(
                self.time_spent_in_state_secs
            )

        if not isinstance(self.is_feedback_useful, bool):
            raise domain_errors.InvalidFeedbackUsefulError(
                self.is_feedback_useful
            )

        if not isinstance(self.event_schema_version, int) or not (
            1
            <= self.event_schema_version
            <= feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION
        ):
            raise domain_errors.InvalidEventSchemaVersionError(
                feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION,
                self.event_schema_version,
            )
