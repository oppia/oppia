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

"""Tests for exp_end_state_normalization_jobs."""

from __future__ import annotations

from core.domain import exp_domain, exp_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_end_state_normalization_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])
datastore_services = models.Registry.import_datastore_services()


class ExplorationEndStateNormalizationJobTests(job_test_utils.JobTestBase):
    """Tests for ExplorationEndStateNormalizationJob."""

    JOB_CLASS = (
        exp_end_state_normalization_jobs.ExplorationEndStateNormalizationJob
    )

    def test_job_skips_exploration_with_none_states(self) -> None:
        """Tests that the job does not fail on exploration models with None states."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        exploration_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertIsNotNone(exploration_model)
        assert exploration_model is not None

        exploration_model.states = None
        exploration_model.update_timestamps(update_last_updated_time=False)
        datastore_services.put_multi([exploration_model])

        self.assert_job_output_is_empty()

    def test_job_updates_content_without_paragraph_tag(self) -> None:
        """Tests that the job reports updates when terminal content has no p-tag."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        exploration_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertIsNotNone(exploration_model)
        assert exploration_model is not None

        exploration_model.states['Introduction']['content'][
            'html'
        ] = self.JOB_CLASS.DEFAULT_TERMINAL_STATE_CONTENT_WITHOUT_P_TAG
        exploration_model.update_timestamps(update_last_updated_time=False)
        datastore_services.put_multi([exploration_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Updated exploration with ID: exp_id '
                    'after end state normalization.'
                )
            ]
        )


class ExplorationEndStateNormalizationAuditJobTests(job_test_utils.JobTestBase):
    """Tests for ExplorationEndStateNormalizationAuditJob."""

    JOB_CLASS = (
        exp_end_state_normalization_jobs.ExplorationEndStateNormalizationAuditJob
    )

    def test_audit_job_reports_updates_without_saving_models(self) -> None:
        """Tests that audit job reports matching explorations but does not update them."""
        exploration = exp_domain.Exploration.create_default_exploration(
            'exp_id', title='Test Exploration', category='Test'
        )
        exp_services.save_new_exploration('owner_id', exploration)

        exploration_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertIsNotNone(exploration_model)
        assert exploration_model is not None

        exploration_model.states['Introduction']['content'][
            'html'
        ] = (
            exp_end_state_normalization_jobs.ExplorationEndStateNormalizationJob.DEFAULT_TERMINAL_STATE_CONTENT_WITHOUT_P_TAG
        )
        exploration_model.update_timestamps(update_last_updated_time=False)
        datastore_services.put_multi([exploration_model])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Updated exploration with ID: exp_id '
                    'after end state normalization.'
                )
            ]
        )

        updated_exploration_model = exp_models.ExplorationModel.get_by_id(
            'exp_id'
        )
        self.assertIsNotNone(updated_exploration_model)
        assert updated_exploration_model is not None

        self.assertEqual(
            updated_exploration_model.states['Introduction']['content']['html'],
            exp_end_state_normalization_jobs.ExplorationEndStateNormalizationJob.DEFAULT_TERMINAL_STATE_CONTENT_WITHOUT_P_TAG,
        )
