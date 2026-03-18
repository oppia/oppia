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

"""Tests for answer submitted event log entry domain objects."""

from __future__ import annotations

from unittest import mock

from core import feconf
from core.domain import answer_submitted_event_log_entry_domain
from core.domain import (
    answer_submitted_event_log_entry_domain_errors as domain_errors,
)
from core.tests import test_utils


MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import answer_submitted_event_log_entry_domain


class AnswerSubmittedEventLogEntryDomainTest(test_utils.GenericTestBase):
    """Tests for AnswerSubmittedEventLogEntry domain object."""

    def setUp(self) -> None:
        super().setUp()

        self.exp_id = 'exp_1'
        self.exp_version = 1
        self.state_name = 'Introduction'
        self.session_id = 'session_123'
        self.time_spent = 10.5
        self.is_feedback_useful = True
        self.schema_version = feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION

        self.domain_obj = answer_submitted_event_log_entry_domain.AnswerSubmittedEventLogEntry(
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state_name,
            session_id=self.session_id,
            time_spent_in_state_secs=self.time_spent,
            is_feedback_useful=self.is_feedback_useful,
            event_schema_version=self.schema_version,
        )

        # Mock exploration object
        self.mock_exploration = mock.Mock()
        self.mock_exploration.version = 3
        self.mock_exploration.states = {
            'Introduction': mock.Mock(),
            'End': mock.Mock(),
        }

        # Patch exp_fetchers.get_exploration_by_id
        patcher = mock.patch('core.domain.exp_fetchers.get_exploration_by_id')
        self.mock_get_exploration = patcher.start()
        self.addCleanup(patcher.stop)

        # Return mocked exploration whenever the function is called
        self.mock_get_exploration.return_value = self.mock_exploration

    def test_validate_success(self) -> None:
        self.mock_get_exploration.return_value = self.mock_exploration
        self.domain_obj.validate()

    def test_validate_invalid_exp_id_type(self) -> None:
        self.domain_obj.exp_id = 5

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected exp_id to be a non-empty string, received 5',
        ):
            self.domain_obj.validate()

    def test_validation_fails_empty_string_exp_id(self) -> None:
        self.domain_obj.exp_id = ''

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected exp_id to be a non-empty string',
        ):
            self.domain_obj.validate()

    def test_validation_fails_invalid_exp_version_type(self) -> None:
        self.domain_obj.exp_version = 'exp_version'

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected exp_version to be an integer >= 1, received exp_version',
        ):
            self.domain_obj.validate()

    def test_validation_fails_negative_exp_version(self) -> None:
        self.domain_obj.exp_version = -1

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected exp_version to be an integer >= 1, received -1',
        ):
            self.domain_obj.validate()

    def test_validation_fails_with_zero_exp_version(self) -> None:
        self.domain_obj.exp_version = 0

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected exp_version to be an integer >= 1, received 0',
        ):
            self.domain_obj.validate()

    def test_validate_exploration_does_not_exist(self) -> None:
        self.mock_get_exploration.side_effect = Exception('Not found')

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Exploration with id %s does not exist' % (self.domain_obj.exp_id),
        ):
            self.domain_obj.validate()

    def test_validation_with_exp_version_out_of_range(self) -> None:
        self.mock_get_exploration.return_value = self.mock_exploration

        self.domain_obj.exp_version = 10

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected exp_version <= current exploration version %s, received %s'
            % (self.mock_exploration.version, self.domain_obj.exp_version),
        ):
            self.domain_obj.validate()

    def test_validate_invalid_state_name_type(self) -> None:
        self.domain_obj.state_name = 123

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected state_name to be a valid state name as per'
            ' retrieved exploration by exp_id, received %s'
            % self.domain_obj.state_name,
        ):
            self.domain_obj.validate()

    def test_validate_invalid_session_id(self) -> None:
        self.domain_obj.session_id = 123

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected session_id to be a string, received %s'
            % self.domain_obj.session_id,
        ):
            self.domain_obj.validate()

    def test_validation_fails_with_invalid_time_spent_type(self) -> None:
        self.domain_obj.time_spent_in_state_secs = 1

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected time_spent_in_state_secs to be a non-negative float, '
            'received %s' % self.domain_obj.time_spent_in_state_secs,
        ):
            self.domain_obj.validate()

    def test_validation_fails_with_invalid_time_spent_type(self) -> None:
        self.domain_obj.time_spent_in_state_secs = 'time_spent'

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected time_spent_in_state_secs to be a non-negative float, '
            'received %s' % self.domain_obj.time_spent_in_state_secs,
        ):
            self.domain_obj.validate()

    def test_validation_fails_with_time_spent_negative_value(self) -> None:
        self.domain_obj.time_spent_in_state_secs = -1.0

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected time_spent_in_state_secs to be a non-negative float, '
            'received %s' % self.domain_obj.time_spent_in_state_secs,
        ):
            self.domain_obj.validate()

    def test_validate_invalid_feedback_useful(self) -> None:
        self.domain_obj.is_feedback_useful = 'yes'

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected is_feedback_useful to be boolean, received %s'
            % self.domain_obj.is_feedback_useful,
        ):
            self.domain_obj.validate()

    def test_validate_invalid_schema_version(self) -> None:
        self.domain_obj.event_schema_version = -1

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected event_schema_version to be %s and also integer, received %s'
            % (
                feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION,
                self.domain_obj.event_schema_version,
            ),
        ):
            self.domain_obj.validate()

    def test_validate_invalid_state_name(self) -> None:
        self.mock_get_exploration.return_value = self.mock_exploration

        self.domain_obj.state_name = 'UnknownState'

        with self.assertRaisesRegex(
            domain_errors.AnswerSubmittedEventLogEntryDomainError,
            'Expected state_name to be a valid state name as per'
            ' retrieved exploration by exp_id, received %s'
            % self.domain_obj.state_name,
        ):
            self.domain_obj.validate()
