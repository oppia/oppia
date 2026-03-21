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

"""Domain error class for AnswerSubmittedEventLogEntry."""

from __future__ import annotations

from core import utils


class AnswerSubmittedEventLogEntryDomainError(utils.ValidationError):
    """Base class for AnswerSubmittedEventLogEntry domain errors."""

    pass


class InvalidExpIdError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid exploration id."""

    def __init__(self, exp_id: object) -> None:
        message = (
            'Expected exp_id to be a non-empty string, received %s' % exp_id
        )
        super().__init__(message)


class InvalidExpVersionError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid exploration version."""

    def __init__(self, exp_version: object) -> None:
        message = (
            'Expected exp_version to be an integer >= 1, received %s'
            % exp_version
        )
        super().__init__(message)


class ExplorationDoesNotExistError(AnswerSubmittedEventLogEntryDomainError):
    """Error class when exploration does not exist."""

    def __init__(self, exp_id: str) -> None:
        message = 'Exploration with id %s does not exist' % exp_id
        super().__init__(message)


class ExpVersionOutOfRangeError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for exploration version outside valid range."""

    def __init__(self, current_version: int, exp_version: int) -> None:
        message = (
            'Expected exp_version <= current exploration version %s, received %s'
            % (current_version, exp_version)
        )
        super().__init__(message)


class InvalidStateNameError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid state name."""

    def __init__(self, state_name: object) -> None:
        message = (
            'Expected state_name to be a valid state name as per '
            'retrieved exploration by exp_id, received %s' % state_name
        )
        super().__init__(message)


class InvalidSessionIdError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid session id."""

    def __init__(self, session_id: object) -> None:
        message = 'Expected session_id to be a string, received %s' % session_id
        super().__init__(message)


class InvalidTimeSpentError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid time spent in state."""

    def __init__(self, value: object) -> None:
        message = (
            'Expected time_spent_in_state_secs to be a non-negative float, '
            'received %s' % value
        )
        super().__init__(message)


class InvalidFeedbackUsefulError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid is_feedback_useful value."""

    def __init__(self, value: object) -> None:
        message = (
            'Expected is_feedback_useful to be boolean, received %s' % value
        )
        super().__init__(message)


class InvalidEventSchemaVersionError(AnswerSubmittedEventLogEntryDomainError):
    """Error class for invalid event schema version."""

    def __init__(self, expected: int, received: object) -> None:
        message = (
            'Expected event_schema_version to be %s and also integer, received %s'
            % (expected, received)
        )
        super().__init__(message)
