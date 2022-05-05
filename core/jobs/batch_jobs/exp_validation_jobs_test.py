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

"""Unit tests for jobs.batch_jobs.exp_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import param_domain
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models

(exp_models, opportunity_models) = models.Registry.import_models([
    models.NAMES.exploration,
    models.NAMES.opportunity
])


class GetNumberOfInvalidExplorationsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = exp_validation_jobs.GetNumberOfInvalidExplorationsJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'

    STATE_1 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()
    STATE_2 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()
    STATE_3 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()
    STATE_4 = state_domain.State.create_default_state('Second State').to_dict()

    PARAM_CHANGES_1 = [
        param_domain.ParamChange(
            'ParamChange', 'RandomSelector', {
                'list_of_values': ['1', '2'],
                'parse_with_jinja': False
            }
        ).to_dict()
    ]
    PARAM_CHANGES_2 = [
        param_domain.ParamChange(
            'ParamChange', 'RandomSelector', {
                'list_of_values': ['3', '4'],
                'parse_with_jinja': True
            }
        ).to_dict(),
        param_domain.ParamChange(
            'ParamChange', 'RandomSelector', {
                'list_of_values': ['5', '6'],
                'parse_with_jinja': True
            }
        ).to_dict()
    ]

    PARAM_SPECS = param_domain.ParamSpec('UnicodeString').to_dict()

    STATE_ANSWER_GROUPS_1 = [state_domain.AnswerGroup(
        state_domain.Outcome(
            'state 1', state_domain.SubtitledHtml(
                'feedback_1', '<p>state outcome html</p>'),
            False, [], None, None),
        [
            state_domain.RuleSpec(
                'Equals', {
                    'x': {
                        'contentId': 'rule_input_Equals',
                        'normalizedStrSet': ['Test']
                        }})
        ],
        [{
            'answer_group_index': 1,
            'answers': [
                u'cheerful',
                u'merry',
                u'ecstatic',
                u'glad',
                u'overjoyed',
                u'pleased',
                u'thrilled',
                u'smile'
            ]
        }],
        None
    )]

    STATE_ANSWER_GROUPS_2 = [state_domain.AnswerGroup(
        state_domain.Outcome(
            'state 2', state_domain.SubtitledHtml(
                'feedback_2', '<p>state outcome html</p>'),
            False, [], None, None),
        [
            state_domain.RuleSpec(
                'Equals', {
                    'x': {
                        'contentId': 'rule_input_Equals',
                        'normalizedStrSet': ['Test']
                        }})
        ],
        [{
            'answer_group_index': 1,
            'answers': [
                u'cheerful',
                u'merry',
                u'ecstatic',
                u'glad',
                u'overjoyed',
                u'pleased',
                u'thrilled',
                u'smile'
            ]
        }],
        None
    )]

    INVALID_STATE_1 = state_domain.State.create_default_state('state 1')
    INVALID_STATE_2 = state_domain.State.create_default_state('state 2')

    def setUp(self):
        super().setUp()

        self.STATE_2.update({
            'classifier_model_id': '1'
        })
        self.STATE_3.update({
            'classifier_model_id': '2'
        })
        self.STATE_4.update({
            'classifier_model_id': '3'
        })

        self.INVALID_STATE_1.interaction.answer_groups = (
            self.STATE_ANSWER_GROUPS_1)
        self.INVALID_STATE_2.interaction.answer_groups = (
            self.STATE_ANSWER_GROUPS_2)

        # Valid exploration model for all cases.
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='title 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: self.STATE_1
            }
        )

        # Invalid exploration model.
        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='title 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={
                'ExampleParamOne': self.PARAM_SPECS
            },
            param_changes=self.PARAM_CHANGES_1,
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: self.STATE_2,
                'state 1': self.INVALID_STATE_1.to_dict()
            }
        )

        # Invalid exploration model.
        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='title 3',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={
                'ExampleParamOne': self.PARAM_SPECS,
                'ExampleParamTwo': self.PARAM_SPECS
            },
            param_changes=self.PARAM_CHANGES_2,
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: self.STATE_3,
                'second state': self.STATE_4,
                'state 1': self.INVALID_STATE_1.to_dict(),
                'state 2': self.INVALID_STATE_2.to_dict(),
            }
        )

        self.opportunity_1 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_1,
            topic_id='topic_id1',
            topic_name='a_topic name',
            story_id='story_id1',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_2 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_2,
            topic_id='topic_id2',
            topic_name='a_topic name',
            story_id='story_id2',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

        self.opportunity_3 = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXPLORATION_ID_3,
            topic_id='topic_id3',
            topic_name='a_topic name',
            story_id='story_id3',
            story_title='A story title',
            chapter_title='A chapter title',
            content_count=20,
            incomplete_translation_language_codes=['hi', 'ar'],
            translation_counts={},
            language_codes_needing_voice_artists=['en'],
            language_codes_with_assigned_voice_artists=[]
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.exp_1, self.opportunity_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.exp_2, self.opportunity_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout(
                'INVALID STATE CLASSIFIER SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the states having not None '
                'classifier model id are %s' % (
                    self.EXPLORATION_ID_2,
                    [feconf.DEFAULT_INIT_STATE_NAME])
            ),
            job_run_result.JobRunResult.as_stdout(
                'INVALID PARAM CHANGES SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the length of '
                'its param changes is %s' % (
                    self.EXPLORATION_ID_2, len(self.PARAM_CHANGES_1)
                )
            ),
            job_run_result.JobRunResult.as_stdout(
                'INVALID PARAM SPECS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the length of '
                'its param specs is %s' % (self.EXPLORATION_ID_2, 1)
            ),
            job_run_result.JobRunResult.as_stdout(
                'INVALID TRAINING DATA SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the states having interaction '
                'with non-empty training data are %s' % (
                    self.EXPLORATION_ID_2,
                    ['state 1']
                )
            )
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi(
            [self.exp_1, self.exp_2, self.exp_3,
                self.opportunity_1, self.opportunity_2, self.opportunity_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout(
                'INVALID STATE CLASSIFIER SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the states having not None '
                'classifier model id are %s' % (
                    self.EXPLORATION_ID_2, [feconf.DEFAULT_INIT_STATE_NAME])
            ),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the states having not None '
                'classifier model id are %s' % (
                    self.EXPLORATION_ID_3, [
                        feconf.DEFAULT_INIT_STATE_NAME,
                        'second state'
                    ])
            ),
            job_run_result.JobRunResult.as_stdout(
                'INVALID PARAM CHANGES SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the length of '
                'its param changes is %s' % (
                    self.EXPLORATION_ID_2, len(self.PARAM_CHANGES_1)
                )
            ),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the length of '
                'its param changes is %s' % (
                    self.EXPLORATION_ID_3, len(self.PARAM_CHANGES_2)
                )
            ),
            job_run_result.JobRunResult.as_stdout(
                'INVALID PARAM SPECS SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the length of '
                'its param specs is %s' % (self.EXPLORATION_ID_2, 1)
            ),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the length of '
                'its param specs is %s' % (self.EXPLORATION_ID_3, 2)
            ),
            job_run_result.JobRunResult.as_stdout(
                'INVALID TRAINING DATA SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the states having interaction '
                'with non-empty training data are %s' % (
                    self.EXPLORATION_ID_2,
                    ['state 1']
                )
            ),
            job_run_result.JobRunResult.as_stderr(
                'The id of exp is %s and the states having interaction '
                'with non-empty training data are %s' % (
                    self.EXPLORATION_ID_3,
                    ['state 1', 'state 2']
                )
            )
        ])
