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

"""Unit tests for AnswerSubmittedEventLogEntryModel model validator errors."""

from __future__ import annotations

from core.jobs.types import answerSubmittedEventLogEntryModel_validation_errors
from core.platform import models
from core.tests import test_utils

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class AnswerSubmittedEventLogEntryModelValidationErrorsTest(
    test_utils.GenericTestBase
):
    """Tests for AnswerSubmittedEventLogEntryModel validation errors."""

    def test_initialization_with_invalid_exploration_id_yields_correct_stderr(
        self,
    ) -> None:
        model = base_models.BaseModel(id='test_id')
        model.exp_id = 'test_exp_id'
        model.exp_version = 2

        error = answerSubmittedEventLogEntryModel_validation_errors.InvalidExplorationIdError(
            model
        )

        self.assertEqual(
            'InvalidExplorationIdError in BaseModel(id="test_id"): '
            'exp_id=test_exp_id with exp_version=2 does not correspond to a valid ExplorationModel',
            error.stderr,
        )

    def test_initialization_with_empty_exploration_reference_yields_correct_stderr(
        self,
    ) -> None:
        model = base_models.BaseModel(id='test_id')
        model.exp_id = 'test_exp_id'

        error = answerSubmittedEventLogEntryModel_validation_errors.ExplorationDoesNotExistError(
            model
        )

        self.assertEqual(
            'ExplorationDoesNotExistError in BaseModel(id="test_id"): '
            'exp_id test_exp_id does not correspond to a valid ExplorationModel',
            error.stderr,
        )

    def test_initialization_with_custom_domain_failure_message_yields_correct_stderr(
        self,
    ) -> None:
        model = base_models.BaseModel(id='test_id')

        error = answerSubmittedEventLogEntryModel_validation_errors.DomainValidationError(
            'test failure', model
        )

        self.assertEqual(
            (
                'DomainValidationError in BaseModel(id="test_id"): '
                'Domain validation failed with error: test failure'
            ),
            error.stderr,
        )

    def test_initialization_with_out_of_range_exp_version_yields_correct_stderr(
        self,
    ) -> None:
        model = base_models.BaseModel(id='test_id')
        model.exp_version = 10

        error = answerSubmittedEventLogEntryModel_validation_errors.ExpVersionOutOfRangeError(
            1, model
        )

        self.assertEqual(
            (
                'ExpVersionOutOfRangeError in BaseModel(id="test_id"): '
                'Expected 1 <= exp_version <= current exploration version 1, received 10'
            ),
            error.stderr,
        )

    def test_initialization_with_invalid_state_name_yields_correct_stderr(
        self,
    ) -> None:
        model = base_models.BaseModel(id='test_id')
        model.state_name = 'Introduction'

        error = answerSubmittedEventLogEntryModel_validation_errors.InvalidStateNameError(
            model
        )

        self.assertEqual(
            (
                'InvalidStateNameError in BaseModel(id="test_id"): '
                'Expected state_name to be a valid state name as per '
                'retrieved exploration by exp_id, received Introduction'
            ),
            error.stderr,
        )
