# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

from core.constants import constants
from core.domain import exp_domain
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import refresher_exp_id_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import user_models

(exp_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class FilterRefresherExplorationIdJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = refresher_exp_id_jobs.FilterRefresherExplorationIdJob

    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    EXP_ID = 'some_id'
    REFRESHER_EXP_ID = 'refresher_exp_id'

    def setUp(self) -> None:
        # Creates 3 users, 3 exp rights, one exp, and some objects which are
        # reused throughout the test.
        super().setUp()
        user1 = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_1,
            email='some@email.com',
        )
        user1.update_timestamps()
        user2 = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_2,
            email='some2@email.com',
        )
        user2.update_timestamps()
        user3 = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_3,
            email='some3@email.com',
        )
        user2.update_timestamps()
        exp_rights1 = self.create_model(
            exp_models.ExplorationRightsModel,
            id=self.EXP_1_ID,
            owner_ids=[self.USER_ID_1, self.USER_ID_2],
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_rights1.update_timestamps()
        exp_rights2 = self.create_model(
            exp_models.ExplorationRightsModel,
            id=self.EXP_2_ID,
            owner_ids=[self.USER_ID_1, self.USER_ID_2, self.USER_ID_3],
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_rights2.update_timestamps()
        exp = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state name',
            states_schema_version=48,
            states={
                'state name': state_domain.State.create_default_state( # type: ignore [no-untyped-call]
                    'state').to_dict()
            }
        )
        exp.update_timestamps()
        self.put_multi([user1, user2, user3, exp_rights1, exp_rights2, exp])
        self.state_interaction_cust_args = {
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': 'Placeholder'
                }
            },
            'rows': {'value': 1}
        }
        self.default_outcome_with_refresher_id = state_domain.Outcome(
            'Introduction', state_domain.SubtitledHtml(
                'default_outcome', '<p>The default outcome.</p>'),
            False, [], 'refresher_exp_id_1', None
        )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_exp_with_no_refresher_exp_id(self) -> None:
        # This test is initialized by setUp().
        self.assert_job_output_is([])

    def test_community_owned_exp(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('1')
        state1 = exploration.states[exploration.init_state_name]
        state1.update_interaction_id('TextInput')
        state1.update_interaction_customization_args(
            self.state_interaction_cust_args)

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], self.REFRESHER_EXP_ID, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    }
                )
            ],
            [],
            None
        )
        state1.update_interaction_answer_groups(
            [state_answer_group])

        # Community owned explorations have empty owner ids.
        exp_rights = self.create_model(
            exp_models.ExplorationRightsModel,
            id=self.EXP_ID,
            owner_ids=[],
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_rights.update_timestamps()
        exp = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state name',
            states_schema_version=48,
            states={
                'state with ref': state1.to_dict(),
                'state without ref': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state2'
                ).to_dict()
            }
        )
        exp.update_timestamps()
        self.put_multi([exp, exp_rights])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: some_id, data: {\'user emails\': [], '
                '\'state names\': [\'state with ref\']}'
            )
        ])

    def test_exp_with_one_owner(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('1')
        state1 = exploration.states[exploration.init_state_name]
        state1.update_interaction_id('TextInput')
        state1.update_interaction_customization_args(
            self.state_interaction_cust_args)

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], self.REFRESHER_EXP_ID, None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    }
                )
            ],
            [],
            None
        )
        state1.update_interaction_answer_groups(
            [state_answer_group])

        exp = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='en',
            init_state_name='state name',
            states_schema_version=48,
            states={
                'state with ref': state1.to_dict(),
                'state without ref': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state2'
                ).to_dict()
            }
        )
        exp.update_timestamps()
        exp_rights = self.create_model(
            exp_models.ExplorationRightsModel,
            id=self.EXP_ID,
            owner_ids=[self.USER_ID_1],
            status=constants.ACTIVITY_STATUS_PUBLIC,
        )
        exp_rights.update_timestamps()
        self.put_multi([exp, exp_rights])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: some_id, data: {\'user emails\': '
                '[\'some@email.com\'], \'state names\': [\'state with ref\']}'
            )
        ])

    def test_exploration_with_one_refresher_id(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        state1 = exploration.states[exploration.init_state_name]
        state1.update_interaction_id('TextInput')
        state1.update_interaction_customization_args(
            self.state_interaction_cust_args)
        state1.update_interaction_default_outcome(
            self.default_outcome_with_refresher_id)
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], 'refresher_exp_id_2', None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    }
                )
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
            }
        )
        exp.update_timestamps()
        self.put_multi([exp])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: exp_1_id, data: {\'user emails\': '
                '[\'some@email.com\', \'some2@email.com\'], \'state names\': '
                '[\'state1\']}'
            )
        ])

    def test_refresher_id_in_answer_group(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('1')
        state1 = exploration.states[exploration.init_state_name]
        state1.update_interaction_id('TextInput')
        state1.update_interaction_customization_args(
            self.state_interaction_cust_args)

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], 'refresher_exp_id', None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    }
                )
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
            init_state_name='state with ref',
            states_schema_version=48,
            states={'state with ref': state1.to_dict()}
        )
        exp.update_timestamps()
        self.put_multi([exp])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: exp_1_id, data: {\'user emails\': '
                '[\'some@email.com\', \'some2@email.com\'], \'state names\': '
                '[\'state with ref\']}'
            )
        ])

    def test_state_with_two_ans_group_with_refresher_id_yield_state_name_once(
        self
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        state1 = exploration.states[exploration.init_state_name]
        state1.update_interaction_id('TextInput')
        state1.update_interaction_customization_args(
            self.state_interaction_cust_args)
        state1.update_interaction_default_outcome(
            self.default_outcome_with_refresher_id)

        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], 'refresher_exp_id_2', None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    }
                )
            ],
            [],
            None
        )
        state1.update_interaction_answer_groups(
            [state_answer_group, state_answer_group])

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
            }
        )
        exp.update_timestamps()
        self.put_multi([exp])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: exp_1_id, data: {\'user emails\': '
                '[\'some@email.com\', \'some2@email.com\'], \'state names\': '
                '[\'state1\']}'
            )
        ])

    def test_multiple_explorations(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration('0')
        exploration1 = exp_domain.Exploration.create_default_exploration('1')
        state1 = state_domain.State.create_default_state('state1')  # type: ignore[no-untyped-call]
        state2 = state_domain.State.create_default_state('state2')  # type: ignore[no-untyped-call]
        state3 = exploration.states[exploration.init_state_name]  # type: ignore[no-untyped-call]
        state3.update_interaction_id('TextInput')
        state3.update_interaction_customization_args(
            self.state_interaction_cust_args)
        state_answer_group = state_domain.AnswerGroup(
            state_domain.Outcome(
                exploration.init_state_name, state_domain.SubtitledHtml(
                    'feedback_1', '<p>Feedback</p>'),
                False, [], 'refresher_exp_id', None),
            [
                state_domain.RuleSpec(
                    'Contains',
                    {
                        'x': {
                            'contentId': 'rule_input_4',
                            'normalizedStrSet': ['Input1', 'Input2']
                            }
                    }
                )
            ],
            [],
            None
        )
        state3.update_interaction_answer_groups(
            [state_answer_group, state_answer_group]
        )
        state4 = exploration.states[exploration1.init_state_name]  # type: ignore[no-untyped-call]
        state4.update_interaction_id('TextInput')
        state4.update_interaction_customization_args(
            self.state_interaction_cust_args)
        state4.update_interaction_answer_groups(
            [state_answer_group, state_answer_group])

        state1.update_interaction_default_outcome(
            self.default_outcome_with_refresher_id)

        state4.update_interaction_default_outcome(
            self.default_outcome_with_refresher_id)

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
                'state2': state2.to_dict(),
                'state3': state3.to_dict(),
                'state4': state4.to_dict(),
            }
        )
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
            states={
                'state1': state1.to_dict(),
                'state2': state2.to_dict(),
                'state3': state3.to_dict(),
            }
        )
        exp2.update_timestamps()
        self.put_multi([exp1, exp2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='exp_id: exp_1_id, data: {\'user emails\': '
                '[\'some@email.com\', \'some2@email.com\'], \'state names\': '
                '[\'state1\', \'state3\', \'state4\']}'
            ),
            job_run_result.JobRunResult(
                stdout='exp_id: exp_2_id, data: {\'user emails\': '
                '[\'some@email.com\', \'some2@email.com\', '
                '\'some3@email.com\'], \'state names\': '
                '[\'state1\', \'state3\']}'
            )
        ])
