# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.refresher_exp_id_jobs."""

from __future__ import annotations

from core.domain import exp_domain
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import refresher_exp_id_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class FilterRefresherExplorationIdJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = refresher_exp_id_jobs.FilterRefresherExplorationIdJob

    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_yield_once_for_one_state(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        state1 = exploration.states[exploration.init_state_name]
        state1.update_interaction_id('TextInput')
        state_interaction_cust_args = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': 'Placeholder'
                }
            },
            'rows': {'value': 1}
        }
        state1.update_interaction_customization_args(
            state_interaction_cust_args)

        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], 'ref_exp_id_1', None
        )
        state1.update_interaction_default_outcome(default_outcome)
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], 'ref_exp_id_2', None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    })
            ],
            [],
            None
        )
        state1.update_interaction_answer_groups(
            [state_answer_group])

        exp = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=48,
            states={
                'state1': state1.to_dict(),
                'state2': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state2'
                ).to_dict()
            })
        exp.update_timestamps()
        self.put_multi([exp])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: exp_1_id, state name: state1'
            )
        ])

    def test_multiple_exploration(self) -> None:
        state1 = state_domain.State.create_default_state('state1')  # type: ignore[no-untyped-call]
        state3 = state_domain.State.create_default_state('state3')  # type: ignore[no-untyped-call]
        default_outcome = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], 'ref_exp_id_1', None
        )
        state1.update_interaction_default_outcome(default_outcome)
        state3.update_interaction_default_outcome(default_outcome)
        exp1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state1',
            states_schema_version=48,
            states={
                'state1': state1.to_dict(),
                'state2': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state2'
                ).to_dict()
            })
        exp1.update_timestamps()
        exp2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state3',
            states_schema_version=48,
            states={'state3': state3.to_dict()}
        )
        exp2.update_timestamps()
        self.put_multi([exp1, exp2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: exp_1_id, state name: state1'
            ),
            job_run_result.JobRunResult(
                stdout='exp_id: exp_2_id, state name: state3'
            )
        ])
