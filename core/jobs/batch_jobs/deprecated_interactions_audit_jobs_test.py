# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.deprecated_interactions_audit_jobs."""

from __future__ import annotations

from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import deprecated_interactions_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models, stats_models

(exp_models, stats_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.STATISTICS]
)

datastore_services = models.Registry.import_datastore_services()


class AuditDeprecatedInteractionsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        deprecated_interactions_audit_jobs.AuditDeprecatedInteractionsJob
    ] = deprecated_interactions_audit_jobs.AuditDeprecatedInteractionsJob

    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_finds_deprecated_interactions_with_answers(self) -> None:
        exp_model_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'init_state': state_domain.State.create_default_state(
                    'state',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'graph_state': state_domain.State.create_default_state(
                    'state',
                    'content_2',
                    'default_outcome_3',
                    is_initial_state=True,
                ).to_dict(),
            },
            next_content_id_index=4,
        )
        exp_model_1.states['graph_state']['interaction']['id'] = 'GraphInput'
        exp_model_1.update_timestamps()

        # Exploration 2 without deprecated interactions.
        exp_model_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'init_state': state_domain.State.create_default_state(
                    'state',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'text_state': state_domain.State.create_default_state(
                    'state',
                    'content_2',
                    'default_outcome_3',
                    is_initial_state=True,
                ).to_dict(),
            },
            next_content_id_index=4,
        )
        exp_model_2.states['text_state']['interaction']['id'] = 'TextInput'
        exp_model_2.update_timestamps()

        # State Answers Model for exp 1.
        answers_model_1 = self.create_model(
            stats_models.StateAnswersModel,
            id='exp_1_id:1:init_state:0',
            exploration_id=self.EXP_1_ID,
            exploration_version=1,
            state_name='init_state',
            shard_id=0,
            interaction_id='GraphInput',
            submitted_answer_list=[],
        )
        answers_model_1.update_timestamps()

        datastore_services.put_multi(
            [exp_model_1, exp_model_2, answers_model_1]
        )

        last_updated_str = exp_model_1.last_updated.strftime(
            '%Y-%m-%d %H:%M:%S'
        )
        last_answer_str = answers_model_1.created_on.strftime(
            '%Y-%m-%d %H:%M:%S'
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Exp ID: exp_1_id, Interactions: [\'GraphInput\'], '
                        'Last Edited: %s, Last Answer: %s'
                        % (last_updated_str, last_answer_str)
                    )
                ),
            ]
        )

    def test_job_finds_deprecated_interactions_without_answers(self) -> None:
        exp_model_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'init_state': state_domain.State.create_default_state(
                    'state',
                    'content_0',
                    'default_outcome_1',
                    is_initial_state=True,
                ).to_dict(),
                'pencil_state': state_domain.State.create_default_state(
                    'state',
                    'content_2',
                    'default_outcome_3',
                    is_initial_state=True,
                ).to_dict(),
            },
            next_content_id_index=4,
        )
        exp_model_1.states['pencil_state']['interaction'][
            'id'
        ] = 'PencilCodeEditor'
        exp_model_1.update_timestamps()

        datastore_services.put_multi([exp_model_1])

        last_updated_str = exp_model_1.last_updated.strftime(
            '%Y-%m-%d %H:%M:%S'
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout=(
                        'Exp ID: exp_1_id, Interactions: [\'PencilCodeEditor\'], '
                        'Last Edited: %s, Last Answer: None' % last_updated_str
                    )
                ),
            ]
        )
