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

"""Unit tests for jobs.batch_jobs.exp_outcome_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import param_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_outcome_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetExpsHavingNonEmptyParamChangesJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exp_outcome_validation_jobs.GetExpsHavingNonEmptyParamChangesJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'

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

    def setUp(self):
        super().setUp()

        # Invalid exploration.
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=self.PARAM_CHANGES_1,
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={}
        )

        # Invalid exploration.
        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='exp 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=self.PARAM_CHANGES_2,
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={}
        )

        # Valid exploration.
        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='exp 3',
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
            states={}
        )

    def test_with_no_models(self):
        self.assert_job_output_is([])

    def test_with_single_valid_model(self):
        self.put_multi([self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1')
        ])

    def test_with_single_invalid_model(self):
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param changes is %s' % (
                    self.EXPLORATION_ID_1, len(self.PARAM_CHANGES_1)
                )
            )
        ])

    def test_with_mixed_models(self):
        self.put_multi([self.exp_1, self.exp_2, self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param changes is %s' % (
                    self.EXPLORATION_ID_1, len(self.PARAM_CHANGES_1)
                )
            ),
            job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param changes is %s' % (
                    self.EXPLORATION_ID_2, len(self.PARAM_CHANGES_2)
                )
            )
        ])


class GetExpsHavingNonEmptyParamSpecsJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exp_outcome_validation_jobs.GetExpsHavingNonEmptyParamSpecsJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'

    PARAM_SPECS = param_domain.ParamSpec('UnicodeString').to_dict()

    def setUp(self):
        super().setUp()

        # Invalid exploration.
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='exp 1',
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
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={}
        )

        # Invalid exploration.
        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='exp 2',
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
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={}
        )

        # Valid exploration.
        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='exp 3',
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
            states={}
        )

    def test_with_no_models(self):
        self.assert_job_output_is([])

    def test_with_single_valid_model(self):
        self.put_multi([self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1')
        ])

    def test_with_single_invalid_model(self):
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param specs is %s' % (self.EXPLORATION_ID_1, 1)
            )
        ])

    def test_with_mixed_models(self):
        self.put_multi([self.exp_1, self.exp_2, self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 3'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 2'),
            job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param specs is %s' % (self.EXPLORATION_ID_1, 1)
            ),
            job_run_result.JobRunResult.as_stderr(
                    'The id of exp is %s and the length of '
                    'its param specs is %s' % (self.EXPLORATION_ID_2, 2)
            )
        ])
