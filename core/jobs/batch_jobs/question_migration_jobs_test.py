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

"""Unit tests for jobs.batch_jobs.exp_recommendation_computation_jobs."""

from __future__ import annotations

import copy
import datetime

from core import feconf
from core.domain import story_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import question_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:
    from mypy_imports import question_models

(question_models,) = models.Registry.import_models([models.NAMES.question])


class MigrateStoryJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = question_migration_jobs.MigrateQuestionJob

    QUESTION_1_ID = 'question_1_id'

    def setUp(self):
        super().setUp()
        self.question_summary_model = self.create_model(
            question_models.QuestionSummaryModel,
            id=self.QUESTION_1_ID,
            question_model_last_updated=datetime.datetime.utcnow(),
            question_model_created_on=datetime.datetime.utcnow(),
            question_content='What is the answer to life?',
            misconception_ids=['misconception_1_id'],
            interaction_id='NumberInput'
        )
        self.question_summary_model.update_timestamps()
        self.question_summary_model.put()
        self.latest_question_state_data = {
                'content': {'content_id': 'content', 'html': 'test content'},
                'param_changes': [],
                'interaction': {
                    'solution': {
                        'explanation': {
                            'content_id': 'solution_1', 'html': 'solution'
                        },
                        'answer_is_exclusive': True,
                        'correct_answer': 'answer'
                    },
                    'answer_groups': [{
                        'outcome': {
                            'dest': None,
                            'feedback': {
                                'content_id': 'feedback_1',
                                'html': '<p>Feedback</p>'
                            },
                            'labelled_as_correct': True,
                            'param_changes': [],
                            'refresher_exploration_id': None,
                            'missing_prerequisite_skill_id': None
                        },
                        'rule_specs': [{
                            'inputs': {
                                'x': {
                                    'contentId': 'rule_input_Equals',
                                    'normalizedStrSet': ['Test']
                                }
                            },
                            'rule_type': 'Contains'
                        }],
                        'training_data': [],
                        'tagged_skill_misconception_id': None
                    }],
                    'default_outcome': {
                        'param_changes': [],
                        'feedback': {
                            'content_id': 'default_outcome',
                            'html': ''
                        },
                        'dest': None,
                        'refresher_exploration_id': None,
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': True
                    },
                    'customization_args': {
                        'rows': {
                            'value': 1
                        },
                        'placeholder': {
                            'value': {
                                'unicode_str': '',
                                'content_id': 'ca_placeholder_0'
                            }
                        }
                    },
                    'confirmed_unclassified_answers': [],
                    'id': 'TextInput',
                    'hints': [{
                        'hint_content': {
                            'content_id': 'hint_1', 'html': '<p>Hint 1</p>'
                        }
                    }]
                },
                'linked_skill_id': None,
                'recorded_voiceovers': {
                    'voiceovers_mapping': {
                        'content': {},
                        'default_outcome': {},
                        'feedback_1': {},
                        'rule_input_Equals': {},
                        'hint_1': {},
                        'solution_1': {},
                        'ca_placeholder_0': {}
                    }
                },
                'classifier_model_id': None,
                'written_translations': {
                    'translations_mapping': {
                        'content': {},
                        'default_outcome': {},
                        'feedback_1': {},
                        'rule_input_Equals': {},
                        'hint_1': {},
                        'solution_1': {},
                        'ca_placeholder_0': {}
                    }
                },
                'next_content_id_index': 1,
                'card_is_checkpoint': False,
                'solicit_answer_details': False
            }
        self.broken_question_state_data = copy.deepcopy(
            self.latest_question_state_data)
        self.broken_question_state_data['linked_skill_id'] = ['id1', 'id1']

        self.unmigrated_question_state_data = copy.deepcopy(
            self.latest_question_state_data)
        del self.unmigrated_question_state_data['linked_skill_id']

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_question_with_unmigrated_state_data_is_migrated(
        self
    ) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.unmigrated_question_state_data,
            question_state_data_schema_version=43,
            language_code='en',
            # The skill ids linked to this question.
            linked_skill_ids=['skill_id'],
            inapplicable_skill_misconception_ids=['abcdefghij12-1']
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='QUESTION MIGRATED SUCCESS: 1'),
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID)
        self.assertEqual(migrated_question_model.version, 2)
        self.assertEqual(
            migrated_question_model.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)
        self.assertEqual(
            migrated_question_model.question_state_data,
            self.latest_question_state_data)

    def test_question_summary_of_unmigrated_question_is_updated(self) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.unmigrated_question_state_data,
            question_state_data_schema_version=43,
            language_code='en',
            # The skill ids linked to this question.
            linked_skill_ids=['skill_id'],
            inapplicable_skill_misconception_ids=['abcdefghij12-1']
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assertEqual(
            self.question_summary_model.question_content,
            'What is the answer to life?'
        )
        self.assertEqual(
            self.question_summary_model.misconception_ids,
            ['misconception_1_id']
        )
        self.assertEqual(
            self.question_summary_model.interaction_id, 'NumberInput'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(stdout='QUESTION MIGRATED SUCCESS: 1'),
        ])

        migrated_question_summary_model = (
            question_models.QuestionSummaryModel.get(self.QUESTION_1_ID))
        self.assertEqual(
            migrated_question_summary_model.question_content, 'test content'
        )
        self.assertEqual(
            migrated_question_summary_model.misconception_ids,
            ['abcdefghij12-1']
        )
        self.assertEqual(
            migrated_question_summary_model.interaction_id, 'TextInput'
        )

    def test_broken_question_is_not_migrated(self) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.broken_question_state_data,
            question_state_data_schema_version=48,
            language_code='en',
            # The skill ids linked to this question.
            linked_skill_ids=['skill_id'],
            inapplicable_skill_misconception_ids=['abcdefghij12-1']
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'QUESTION PROCESSED ERROR: "(\'question_1_id\', '
                    'ValidationError("Expected linked_skill_id to be a str, '
                    'received [\'id1\', \'id1\']."))": 1'
                )
            )
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID)
        self.assertEqual(migrated_question_model.version, 1)

    def test_migrated_question_is_not_migrated(self) -> None:
        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.latest_question_state_data,
            question_state_data_schema_version=(
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            language_code='en',
            # The skill ids linked to this question.
            linked_skill_ids=['skill_id'],
            inapplicable_skill_misconception_ids=['abcdefghij12-1']
        )
        question_model.update_timestamps()
        question_model.commit(feconf.SYSTEM_COMMITTER_ID, 'Create question', [{
            'cmd': story_domain.CMD_CREATE_NEW
        }])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='QUESTION PROCESSED SUCCESS: 1')
        ])

        migrated_story_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID)
        self.assertEqual(migrated_story_model.version, 1)
