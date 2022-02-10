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

"""Unit tests for jobs.batch_jobs.question_population_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import question_domain
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import question_population_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import question_models

(question_models,) = models.Registry.import_models([models.NAMES.question])


class PopulateQuestionWithAndroidProtoSizeInBytesJobTests(
    job_test_utils.JobTestBase):

    QUESTION_ID = 'question_1_id'

    JOB_CLASS = question_population_jobs.PopulateQuestionWithAndroidProtoSizeInBytesJob # pylint: disable=line-too-long

    def setUp(self):
        super().setUp()
        self.state = state_domain.State.create_default_state(
            'ABC', is_initial_state=True)
        self.state.update_interaction_id('TextInput')
        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is a solution.</p>',
            },
        }
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>This is a hint.</p>')),
        ]
        solution = state_domain.Solution.from_dict(
            self.state.interaction.id, solution_dict)
        self.state.update_interaction_solution(solution)
        self.state.update_interaction_hints(hints_list)
        self.state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder',
                    'unicode_str': 'Enter text here',
                },
            },
            'rows': {'value': 1},
        })
        self.state.update_next_content_id_index(2)
        self.state.interaction.default_outcome.labelled_as_correct = True
        self.state.interaction.default_outcome.dest = None

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_question_is_migrated(self) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_ID,
            question_state_data=self.state.to_dict(),
            language_code='en',
            version=1,
            linked_skill_ids=['test_skill1', 'test_skill2'],
            question_state_data_schema_version=48,
            inapplicable_skill_misconception_ids=['skillid12345-1']
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': question_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='QUESTION POPULATED WITH android_proto_size_in_bytes'
                ' SUCCESS: 1')
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_ID)
        self.assertEqual(
            migrated_question_model.android_proto_size_in_bytes, 219)

    def test_broken_question_is_not_migrated(self) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_ID,
            question_state_data=self.state.to_dict(),
            language_code='en',
            linked_skill_ids=[],
            question_state_data_schema_version=48,
            inapplicable_skill_misconception_ids=['skillid12345-1']
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': question_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'QUESTION PROCESSED ERROR: "(\'question_1_id\', '
                    'ValidationError(\'linked_skill_ids is either null'
                    ' or an empty list\'))": 1'
                )
            )
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_ID)
        self.assertEqual(
            migrated_question_model.version, 1)

    def test_migrated_question_is_not_migrated(self) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_ID,
            question_state_data=self.state.to_dict(),
            language_code='en',
            version=1,
            linked_skill_ids=['test_skill1', 'test_skill2'],
            question_state_data_schema_version=48,
            inapplicable_skill_misconception_ids=['skillid12345-1'],
            android_proto_size_in_bytes=219
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': question_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1')
        ])

        unmigrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_ID)
        self.assertEqual(
            unmigrated_question_model.android_proto_size_in_bytes, 219)
