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

"""Tests for AnswerSubmittedEventLogEntry domain error classes."""

from __future__ import annotations

from core.domain import (
    answer_submitted_event_log_entry_domain_errors as domain_errors,
)
from core.tests import test_utils


class AnswerSubmittedEventLogEntryDomainErrorsTest(test_utils.GenericTestBase):
    """Tests for AnswerSubmittedEventLogEntry domain error classes."""

    def test_invalid_exp_id_error(self) -> None:
        """Test InvalidExpIdError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidExpIdError,
            'Expected exp_id to be a non-empty string, received exp_id_1',
        ):
            raise domain_errors.InvalidExpIdError('exp_id_1')

    def test_invalid_exp_version_error(self) -> None:
        """Test InvalidExpVersionError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidExpVersionError,
            'Expected exp_version to be an integer >= 1, received 0',
        ):
            raise domain_errors.InvalidExpVersionError(0)

    def test_exploration_does_not_exist_error(self) -> None:
        """Test ExplorationDoesNotExistError."""
        with self.assertRaisesRegex(
            domain_errors.ExplorationDoesNotExistError,
            'Exploration with id exp1 does not exist',
        ):
            raise domain_errors.ExplorationDoesNotExistError('exp1')

    def test_exp_version_out_of_range_error(self) -> None:
        """Test ExpVersionOutOfRangeError."""
        with self.assertRaisesRegex(
            domain_errors.ExpVersionOutOfRangeError,
            'Expected exp_version <= current exploration version 5, received 10',
        ):
            raise domain_errors.ExpVersionOutOfRangeError(5, 10)

    def test_invalid_state_name_error(self) -> None:
        """Test InvalidStateNameError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidStateNameError,
            (
                'Expected state_name to be a valid state name as per '
                'retrieved exploration by exp_id, received invalid_state'
            ),
        ):
            raise domain_errors.InvalidStateNameError('invalid_state')

    def test_invalid_session_id_error(self) -> None:
        """Test InvalidSessionIdError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidSessionIdError,
            'Expected session_id to be a string, received 123',
        ):
            raise domain_errors.InvalidSessionIdError(123)

    def test_invalid_time_spent_error(self) -> None:
        """Test InvalidTimeSpentError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidTimeSpentError,
            (
                'Expected time_spent_in_state_secs to be a non-negative float, '
                'received -1'
            ),
        ):
            raise domain_errors.InvalidTimeSpentError(-1)

    def test_invalid_feedback_useful_error(self) -> None:
        """Test InvalidFeedbackUsefulError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidFeedbackUsefulError,
            'Expected is_feedback_useful to be boolean, received yes',
        ):
            raise domain_errors.InvalidFeedbackUsefulError('yes')

    def test_invalid_event_schema_version_error(self) -> None:
        """Test InvalidEventSchemaVersionError."""
        with self.assertRaisesRegex(
            domain_errors.InvalidEventSchemaVersionError,
            'Expected event_schema_version to be 1 and also integer, received 2',
        ):
            raise domain_errors.InvalidEventSchemaVersionError(1, 2)
