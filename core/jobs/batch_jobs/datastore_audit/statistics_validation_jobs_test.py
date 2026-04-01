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

from unittest import mock

from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import statistics_validation_jobs
from core.jobs.types import job_run_result, statistics_validation_errors
from core.platform import models
from core.tests import test_utils

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class AnswerSubmittedEventLogEntryModelValidationJobTest(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    """Tests for AnswerSubmittedEventLogEntryModelValidationJob."""

    JOB_CLASS = (
        statistics_validation_jobs.AnswerSubmittedEventLogEntryModelValidationJob
    )

    def test_validation_with_proper_model_data_yields_no_errors(self) -> None:
        """Test that valid model produces no errors."""

        self.save_new_valid_exploration(
            'exp1', 'owner_id', title='Test Exploration'
        )

        model = self.create_model(
            stats_models.AnswerSubmittedEventLogEntryModel,
            id='1029301283:exp1:session1',
            exp_id='exp1',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=2,
        )
        self.put_multi([model])

        self.assert_job_output_is([])

    def test_validation_with_invalid_exploration_id_yields_error(self) -> None:
        """Test invalid exp_id."""

        model = self.create_model(
            stats_models.AnswerSubmittedEventLogEntryModel,
            id='1029301283:expX:session1',
            exp_id='expX',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=2,
        )
        self.put_multi([model])

        error_message = (
            'Entity for class ExplorationModel with id expX not found'
        )
        invalid_exp_error = (
            statistics_validation_errors.ExplorationDoesNotExistError(
                error_message, model
            ).stderr
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    '\n'.join(
                        [
                            f'ExplorationDoesNotExistError: {invalid_exp_error}',
                            invalid_exp_error,
                        ]
                    )
                ),
            ]
        )

    @mock.patch('core.domain.exp_fetchers.get_exploration_by_id')
    def test_validation_with_missing_exploration_in_datastore_yields_error(
        self, mock_get_exploration_by_id: mock.MagicMock
    ) -> None:
        """Test retrieved exploration from datastore is None."""

        model = self.create_model(
            stats_models.AnswerSubmittedEventLogEntryModel,
            id='1029301283:expX:session1',
            exp_id='expX',
            exp_version=1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=2,
        )
        self.put_multi([model])

        invalid_exp_error = (
            statistics_validation_errors.InvalidExplorationIdError(model).stderr
        )
        does_not_exist_error = (
            statistics_validation_errors.ExplorationDoesNotExistError(
                '', model
            ).stderr
        )
        mock_get_exploration_by_id.return_value = None
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    f'InvalidExplorationIdError: {invalid_exp_error}'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'ExplorationDoesNotExistError: {does_not_exist_error}'
                ),
            ]
        )

    def test_validation_with_invalid_domain_logic_yields_error(self) -> None:
        """Test domain validation failure."""

        self.save_new_valid_exploration(
            'exp1', 'owner_id', title='Test Exploration'
        )
        model = self.create_model(
            stats_models.AnswerSubmittedEventLogEntryModel,
            id='123:exp1:session1',
            exp_id='exp1',
            exp_version=-1,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=2,
        )
        self.put_multi([model])

        domain_error = statistics_validation_errors.DomainValidationError(
            'Expected exp_version to be an integer >= 1, received -1',
            model,
        ).stderr

        invalid_exp_with_version_error = statistics_validation_errors.ExplorationDoesNotExistError(
            'Entity for class ExplorationSnapshotContentModel with id exp1--1 not found',
            model,
        ).stderr

        exp_version_error = (
            statistics_validation_errors.ExpVersionOutOfRangeError(
                1, model
            ).stderr
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    f'DomainValidationError: {domain_error}'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'ExplorationDoesNotExistError: {invalid_exp_with_version_error}'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'ExpVersionOutOfRangeError: {exp_version_error}'
                ),
            ]
        )

    def test_validation_with_invalid_state_name_yields_error(self) -> None:
        """Test invalid state_name according to retrieved exploration."""

        self.save_new_valid_exploration(
            'exp1', 'owner_id', title='Test Exploration'
        )
        model = self.create_model(
            stats_models.AnswerSubmittedEventLogEntryModel,
            id='123:exp1:session1',
            exp_id='exp1',
            exp_version=1,
            state_name='Invalid_state_name',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=2,
        )
        self.put_multi([model])

        invalid_state_name_error = (
            statistics_validation_errors.InvalidStateNameError(model).stderr
        )
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    f'InvalidStateNameError: {invalid_state_name_error}'
                ),
            ]
        )

    def test_validation_with_out_of_range_exp_version_yields_error(
        self,
    ) -> None:
        """Test domain validation failure."""

        self.save_new_valid_exploration(
            'exp1', 'owner_id', title='Test Exploration'
        )
        model = self.create_model(
            stats_models.AnswerSubmittedEventLogEntryModel,
            id='123:exp1:session1',
            exp_id='exp1',
            exp_version=10,
            state_name='Introduction',
            session_id='session1',
            time_spent_in_state_secs=10.0,
            is_feedback_useful=True,
            event_schema_version=2,
        )
        self.put_multi([model])

        exp_version_range_error = (
            statistics_validation_errors.ExpVersionOutOfRangeError(
                1, model
            ).stderr
        )
        invalid_exp_with_version_error = statistics_validation_errors.ExplorationDoesNotExistError(
            'Entity for class ExplorationSnapshotContentModel with id exp1-10 not found',
            model,
        ).stderr
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    f'ExplorationDoesNotExistError: {invalid_exp_with_version_error}'
                ),
                job_run_result.JobRunResult.as_stderr(
                    f'ExpVersionOutOfRangeError: {exp_version_range_error}'
                ),
            ]
        )
