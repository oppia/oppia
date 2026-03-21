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

    def test_invalid_exploration_id_error(self):
        model = base_models.BaseModel(id='test_id')
        model.exp_id = 'test_exp_id'

        error = answerSubmittedEventLogEntryModel_validation_errors.InvalidExplorationIdError(
            model
        )

        self.assertEqual(
            'InvalidExplorationIdError in BaseModel(id="test_id"): '
            'exp_id test_exp_id does not correspond to a valid ExplorationModel',
            error.stderr,
        )

    def test_invalid_entity_id_format_error(self):
        model = base_models.BaseModel(id='invalid_id')

        error = answerSubmittedEventLogEntryModel_validation_errors.InvalidEntityIdFormatError(
            model
        )

        self.assertEqual(
            (
                'InvalidEntityIdFormatError in BaseModel(id="invalid_id"): '
                'Entity id invalid_id does not match required format '
                '"[timestamp]:[exp_id]:[session_id]"'
            ),
            error.stderr,
        )

    def test_entity_id_model_mismatch_error(self):
        model = base_models.BaseModel(id='123:exp1:session2')

        # Simulate attributes used by error message.
        model.exp_id = 'exp1'
        model.session_id = 'session1'

        error = answerSubmittedEventLogEntryModel_validation_errors.EntityIdModelMismatchError(
            model
        )

        self.assertEqual(
            (
                'EntityIdModelMismatchError in BaseModel(id="123:exp1:session2"): '
                'Entity id 123:exp1:session2 does not match model fields '
                'exp_id=exp1, session_id=session1'
            ),
            error.stderr,
        )

    def test_domain_validation_error(self):
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
