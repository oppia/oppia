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

"""Unit tests for jobs.batch_jobs.exp_tags_validation_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_tags_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpExceedsMaxTagsLengthJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = (
        exp_tags_validation_jobs.GetNumberOfExpHavingInvalidTagsListJob)

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'
    EXPLORATION_ID_4 = '4'
    STATE_1 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()
    STATE_2 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()
    STATE_3 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()
    STATE_4 = state_domain.State.create_default_state(
        feconf.DEFAULT_INIT_STATE_NAME, is_initial_state=True).to_dict()

    def setUp(self):
        super().setUp()

        # This is an invalid model with tags having 3 empty values.
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic', 'a', 'b', '', '', '', 'f', 'g'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_1}
        )

        # This is an invalid model with tags length greater than 10
        # and having tag length more than 30.
        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                'This is just a tag with length more than 30'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_2}
        )

        # This is an invalid model with tags length greater than 10,
        # 3 empty values, 1 tag having length greater than 30 and 2
        # duplicate values.
        self.exp_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['1', '2', '3', '', '', '', '7', '8', '9', '10', '11',
                'This is just a tag with length more than 30', '10', '11'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_3}
        )

        # This is an valid exploration model.
        self.exp_4 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_4,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            tags=['Topic', 'topic1', 'topic2', 'topic3', 'topic4', 'topic5'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_4}
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is([])

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.exp_4])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1')
        ])

    def test_run_with_single_invalid_model1(self) -> None:
        self.put_multi([self.exp_1])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The exp of id 1 contains'
                + ' 3 empty tag and 0 tag having length more than 30.'),
        ])

    def test_run_with_single_invalid_model2(self) -> None:
        self.put_multi([self.exp_2])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The exp of id 2 contains tags length more than 10,'
                + ' 0 empty tag and 1 tag having length more than 30.'),
        ])

    def test_run_with_single_invalid_model3(self) -> None:
        self.put_multi([self.exp_3])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 1'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 1'),
            job_run_result.JobRunResult.as_stderr(
                'The exp of id 3 contains tags length more than 10,'
                + ' 2 duplicate values [\'10\', \'11\'], 3 empty tag and'
                + ' 1 tag having length more than 30.'),
        ])

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.exp_1, self.exp_2, self.exp_3, self.exp_4])
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout('EXPS SUCCESS: 4'),
            job_run_result.JobRunResult.as_stdout('INVALID SUCCESS: 3'),
            job_run_result.JobRunResult.as_stderr(
                'The exp of id 1 contains'
                + ' 3 empty tag and 0 tag having length more than 30.'),
            job_run_result.JobRunResult.as_stderr(
                'The exp of id 2 contains tags length more than 10,'
                + ' 0 empty tag and 1 tag having length more than 30.'),
            job_run_result.JobRunResult.as_stderr(
                'The exp of id 3 contains tags length more than 10,'
                + ' 2 duplicate values [\'10\', \'11\'], 3 empty tag and'
                + ' 1 tag having length more than 30.'),
        ])
