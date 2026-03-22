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

"""Unit tests for jobs.answerSubmittedEventLogEntryModel_validation_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import (
    answerSubmittedEventLogEntryModel_validation_jobs,
)
from core.jobs.types import answerSubmittedEventLogEntryModel_validation_errors
from core.platform import models
from core.tests import test_utils

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class AnswerSubmittedEventLogEntryModelValidationJobTest(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    """Tests for AnswerSubmittedEventLogEntryModelValidationJob."""

    JOB_CLASS = (
        answerSubmittedEventLogEntryModel_validation_jobs.AnswerSubmittedEventLogEntryModelValidationJob
    )

    def test_valid_model(self):
        """Test that valid model produces no errors."""

        self.save_new_valid_exploration(
            'exp1', 'owner_id', title='Test Exploration'
        )
        model = stats_models.AnswerSubmittedEventLogEntryModel(
            exp_id='exp1',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
        )
        model.put()

        self.assert_job_output_is_empty()

    def test_invalid_exploration_id(self):
        """Test invalid exp_id."""

        stats_models.AnswerSubmittedEventLogEntryModel.create(
            exp_id='expX',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
        )

        output = self.run_job_and_get_output(self.JOB_CLASS)

        self.assertIn(
            answerSubmittedEventLogEntryModel_validation_errors.InvalidExplorationIdError.__name__,
            output,
        )

    def test_invalid_entity_id_format(self):
        """Test entity_id format error."""

        self.save_new_valid_exploration(
            'exp1', 'owner_id', title='Test Exploration'
        )

        model = stats_models.AnswerSubmittedEventLogEntryModel(
            id='invalid-format',
            exp_id='exp1',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=1,
        )
        model.put()

        output = self.run_job_and_get_output(self.JOB_CLASS)

        self.assertIn(
            answerSubmittedEventLogEntryModel_validation_errors.InvalidEntityIdFormatError.__name__,
            output,
        )

    def test_entity_id_mismatch(self):
        """Test entity_id mismatch with model fields."""

        model = stats_models.AnswerSubmittedEventLogEntryModel(
            id='123:exp1:session999',
            exp_id='exp1',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=1,
        )
        model.put()

        output = self.run_job_and_get_output(self.JOB_CLASS)

        self.assertIn(
            answerSubmittedEventLogEntryModel_validation_errors.EntityIdModelMismatchError.__name__,
            output,
        )

    def test_domain_validation_error(self):
        """Test domain validation failure."""

        model = stats_models.AnswerSubmittedEventLogEntryModel(
            id='123:exp1:session1',
            exp_id='exp1',
            exp_version=-1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=1,
        )
        model.put()

        output = self.run_job_and_get_output(self.JOB_CLASS)

        self.assertIn(
            answerSubmittedEventLogEntryModel_validation_errors.DomainValidationError.__name__,
            output,
        )
