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

"""Unit tests for jobs.batch_jobs.exp_title_validation_jobs."""

from __future__ import annotations
from turtle import title
from unicodedata import category

from core.constants import constants
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_title_validation_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, ) = models.Registry.import_models(
    [models.NAMES.exploration])

class GetNumberOfExpExceedsMaxTitleLengthJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS = exp_title_validation_jobs.GetNumberOfExpExceedsMaxTitleLengthJob

    EXPLORATION_ID_1 = '1'
    EXPLORATION_ID_2 = '2'
    EXPLORATION_ID_3 = '3'

    STATE_1 = state_domain.State.create_default_state('ABC')
    STATE_2 = state_domain.State.create_default_state('DEF')
    STATE_3 = state_domain.State.create_default_state('GHI')

    def __init__(self):
        super().__init__

        #Invalid exploration
        self.EXP_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_1,
            title='titleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            category='Algebra',
            tags='Topic',
            init_state_name='Introduction1',
            states={'Introduction1': self.STATE_1}
        )

        #Valid exploration
        self.EXP_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_2,
            title='title',
            category='Algebra',
            tags='Topic',
            init_state_name='Introduction2',
            states={'Introduction2': self.STATE_2}
        )

        #Invalid exploration
        self.EXP_3 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXPLORATION_ID_3,
            title='titleeeeeeeeeeeeeabcdefghijklmnopqrstuv',
            category='Category',
            tags='Topic',
            init_state_name='Introduction3',
            states={'Introduction3': self.STATE_3}
        )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: Queried 0 exps in total.'),
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: There are total 0 invalid exps.'),
            ]
        )

    def test_run_with_single_valid_model(self) -> None:
        self.put_multi([self.EXP_2])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: Queried 1 exps in total.'),
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: There are total 0 invalid exps.'),
            ]
        )

    def test_run_with_single_invalid_model(self) -> None:
        self.put_multi([self.EXP_1])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: Queried 1 exps in total.'),
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: There are total 1 invalid exps.'),
                job_run_result.JobRunResult.as_stderr(
                    f'The id of exp is {self.EXPLORATION_ID_1} and its actual '
                    + f'len is {len(self.EXP_1.title)}'),
            ]
        )

    def test_run_with_mixed_models(self) -> None:
        self.put_multi([self.EXP_1, self.EXP_2, self.EXP_3])
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: Queried 3 exps in total.'),
                job_run_result.JobRunResult.as_stdout(
                    'RESULT: There are total 2 invalid exps.'),
                job_run_result.JobRunResult.as_stderr(
                    f'The id of exp is {self.EXPLORATION_ID_1} and its actual '
                    + f'len is {len(self.EXP_1.title)}'),
                job_run_result.JobRunResult.as_stderr(
                    f'The id of exp is {self.EXPLORATION_ID_3} and its actual '
                    + f'len is {len(self.EXP_3.title)}'),
            ]
        )
