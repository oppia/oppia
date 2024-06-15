# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.question_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import question_domain
from core.domain import question_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import question_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Type
from typing_extensions import Final

MYPY = True
if MYPY:
    from mypy_imports import question_models

(question_model,) = models.Registry.import_models([models.Names.QUESTION])


class PopulateQuestionSummaryVersionOneOffJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        question_migration_jobs.PopulateQuestionSummaryVersionOneOffJob
    ] = question_migration_jobs.PopulateQuestionSummaryVersionOneOffJob

    QUESTION_1_ID: Final = 'question_1_id'
    answer_group1 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
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
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'MatchesExactlyWith'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'OmitsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    answer_group2 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'feedback_2',
                'html': '<p>Feedback</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        },
        'rule_specs': [{
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    question_state_dict = {
        'content': {
            'content_id': 'content',
            'html': 'Question 1'
        },
        'recorded_voiceovers': {
            'voiceovers_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'interaction': {
            'answer_groups': [answer_group1, answer_group2],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'customOskLetters': {
                    'value': ['a', 'b']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'default_outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome_2',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': 'Hint 1'
                }
            }],
            'solution': {
                'correct_answer': 'x-y',
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'explanation_1',
                    'html': 'Solution explanation'
                }
            },
            'id': 'AlgebraicExpressionInput'
        },
        'next_content_id_index': 4,
        'param_changes': [],
        'solicit_answer_details': False,
        'card_is_checkpoint': False,
        'linked_skill_id': None,
        'classifier_model_id': None
    }

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_version_is_added_after_running_job(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            version=1,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)
        question = question_services.get_question_by_id(self.QUESTION_1_ID)
        question_summary = question_services.compute_summary_of_question(
            question
        )
        question_summary.version = 0
        question_services.save_question_summary(question_summary)
        question_summary_model = question_models.QuestionSummaryModel.get(
            self.QUESTION_1_ID
        )
        self.assertEqual(question_summary_model.version, 0)
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION SUMMARY PROCESSED SUCCESS: 1'),
        ])

        updated_summary_model = question_models.QuestionSummaryModel.get(
            self.QUESTION_1_ID
        )
        self.assertEqual(
            updated_summary_model.version,
            unmigrated_question_model.version
        )

    def test_broken_summary_raises_error(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            version=-5,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)
        question = question_services.get_question_by_id(self.QUESTION_1_ID)
        question_summary = question_services.compute_summary_of_question(
            question
        )
        question_services.save_question_summary(question_summary)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='QUESTION SUMMARY PROCESSED ERROR: \"(\'question_1_id\''
                ', ValidationError(\'Expected version to be non-negative, '
                'received -4\'))": 1'),
        ])


class AuditPopulateQuestionSummaryVersionOneOffJobTests(
    job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        question_migration_jobs.AuditPopulateQuestionSummaryVersionOneOffJob
    ] = question_migration_jobs.AuditPopulateQuestionSummaryVersionOneOffJob

    QUESTION_1_ID: Final = 'question_1_id'
    answer_group1 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
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
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'MatchesExactlyWith'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'OmitsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    answer_group2 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'feedback_2',
                'html': '<p>Feedback</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        },
        'rule_specs': [{
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    question_state_dict = {
        'content': {
            'content_id': 'content',
            'html': 'Question 1'
        },
        'recorded_voiceovers': {
            'voiceovers_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'interaction': {
            'answer_groups': [answer_group1, answer_group2],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'customOskLetters': {
                    'value': ['a', 'b']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'default_outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome_2',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': 'Hint 1'
                }
            }],
            'solution': {
                'correct_answer': 'x-y',
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'explanation_1',
                    'html': 'Solution explanation'
                }
            },
            'id': 'AlgebraicExpressionInput'
        },
        'next_content_id_index': 4,
        'param_changes': [],
        'solicit_answer_details': False,
        'card_is_checkpoint': False,
        'linked_skill_id': None,
        'classifier_model_id': None
    }

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_check_models_after_running_job(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            version=-1,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)
        question_services.create_question_summary(self.QUESTION_1_ID)
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION SUMMARY PROCESSED SUCCESS: 1'),
        ])

    def test_broken_summary_raises_error(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            version=-5,
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)
        question = question_services.get_question_by_id(self.QUESTION_1_ID)
        question_summary = question_services.compute_summary_of_question(
            question
        )
        question_services.save_question_summary(question_summary)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr='QUESTION SUMMARY PROCESSED ERROR: \"(\'question_1_id\''
                ', ValidationError(\'Expected version to be non-negative, '
                'received -4\'))": 1'),
        ])


class MigrateQuestionJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        question_migration_jobs.MigrateQuestionJob
    ] = question_migration_jobs.MigrateQuestionJob

    QUESTION_1_ID: Final = 'question_1_id'
    QUESTION_2_ID: Final = 'question_2_id'
    answer_group1 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
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
                'x': 'a - b'
            },
            'rule_type': 'MatchesExactlyWith'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'OmitsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    answer_group2 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'feedback_2',
                'html': '<p>Feedback</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        },
        'rule_specs': [{
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    answer_group3 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'feedback_0',
                'html': '<p>Feedback</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        },
        'rule_specs': [{
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'MatchesExactlyWith'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    question_state_dict = {
        'content': {
            'content_id': 'content',
            'html': 'Question 1'
        },
        'recorded_voiceovers': {
            'voiceovers_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'interaction': {
            'answer_groups': [answer_group1, answer_group2],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'customOskLetters': {
                    'value': ['a', 'b']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'default_outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome_2',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': 'Hint 1'
                }
            }],
            'solution': {
                'correct_answer': 'x-y',
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'explanation_1',
                    'html': 'Solution explanation'
                }
            },
            'id': 'AlgebraicExpressionInput'
        },
        'next_content_id_index': 4,
        'param_changes': [],
        'solicit_answer_details': False,
        'card_is_checkpoint': False,
        'linked_skill_id': None,
        'classifier_model_id': None
    }
    question_state_dict_new_schema = {
        'content': {
            'content_id': 'content',
            'html': 'Question 1'
        },
        'recorded_voiceovers': {
            'voiceovers_mapping': {
                'content': {},
                'explanation_0': {},
                'feedback_0': {},
                'default_outcome_0': {},
                'hint_0': {}
            }
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'explanation_0': {},
                'feedback_0': {},
                'default_outcome_0': {},
                'hint_0': {}
            }
        },
        'interaction': {
            'answer_groups': [answer_group3],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'allowedVariables': {
                    'value': ['a', 'b']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'default_outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome_0',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_0',
                    'html': 'Hint 1'
                }
            }],
            'solution': {
                'correct_answer': 'x-y',
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'explanation_0',
                    'html': 'Solution explanation'
                }
            },
            'id': 'AlgebraicExpressionInput'
        },
        'next_content_id_index': 4,
        'param_changes': [],
        'solicit_answer_details': False,
        'card_is_checkpoint': False,
        'linked_skill_id': None,
        'classifier_model_id': None
    }

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_question_with_unmigrated_prop_is_migrated(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)
        question_services.create_question_summary(self.QUESTION_1_ID)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='QUESTION MIGRATED SUCCESS: 1'),
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID)
        self.assertEqual(migrated_question_model.version, 2)
        self.assertEqual(
            migrated_question_model.question_state_data_schema_version,
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_question_summary_of_unmigrated_question_is_updated(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)
        question_services.create_question_summary(self.QUESTION_1_ID)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='QUESTION MIGRATED SUCCESS: 1'),
        ])
        migrated_question_summary_model = (
            question_models.QuestionSummaryModel.get(self.QUESTION_1_ID)
        )
        self.assertEqual(migrated_question_summary_model.version, 2)

    def test_broken_question_leads_to_no_migration(self) -> None:
        first_unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='abc',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        first_unmigrated_question_model.update_timestamps()
        first_unmigrated_question_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create question',
            [{'cmd': question_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_2_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        second_unmigrated_question_model.update_timestamps()
        second_unmigrated_question_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create question',
            [{'cmd': question_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'QUESTION PROCESSED ERROR: \"(\'question_1_id\', '
                    'ValidationError(\'Invalid language code: abc\'))\": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID)
        self.assertEqual(first_migrated_question_model.version, 1)

        second_migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_2_ID)
        self.assertEqual(second_migrated_question_model.version, 1)

    def test_migrated_question_is_not_migrated(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict_new_schema,
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=(
                feconf.CURRENT_STATE_SCHEMA_VERSION)
        )
        commit_cmd = question_domain.QuestionChange({
            'cmd': question_domain.CMD_CREATE_NEW
        })
        commit_cmd_dicts = [commit_cmd.to_dict()]
        unmigrated_question_model.commit(
            'user_id_admin', 'question model created', commit_cmd_dicts)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='QUESTION PREVIOUSLY MIGRATED SUCCESS: 1'),
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID
        )
        self.assertEqual(migrated_question_model.version, 1)


class AuditQuestionMigrationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        question_migration_jobs.AuditQuestionMigrationJob
    ] = question_migration_jobs.AuditQuestionMigrationJob

    QUESTION_1_ID: Final = 'question_1_id'
    QUESTION_2_ID: Final = 'question_2_id'
    answer_group1 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
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
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'MatchesExactlyWith'
        }, {
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'OmitsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }
    answer_group2 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'feedback_2',
                'html': '<p>Feedback</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        },
        'rule_specs': [{
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'ContainsSomeOf'
        }, {
            'inputs': {
                'x': 'a - b',
                'y': []
            },
            'rule_type': 'MatchesWithGeneralForm'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }

    answer_group3 = {
        'outcome': {
            'dest': None,
            'dest_if_really_stuck': None,
            'feedback': {
                'content_id': 'feedback_0',
                'html': '<p>Feedback</p>'
            },
            'labelled_as_correct': True,
            'param_changes': [],
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None
        },
        'rule_specs': [{
            'inputs': {
                'x': 'a - b'
            },
            'rule_type': 'MatchesExactlyWith'
        }],
        'training_data': [],
        'tagged_skill_misconception_id': None
    }

    question_state_dict = {
        'content': {
            'content_id': 'content',
            'html': 'Question 1'
        },
        'recorded_voiceovers': {
            'voiceovers_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'explanation_1': {},
                'feedback_1': {},
                'default_outcome_2': {},
                'hint_1': {}
            }
        },
        'interaction': {
            'answer_groups': [answer_group1, answer_group2],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'customOskLetters': {
                    'value': ['a', 'b']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'default_outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome_2',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': 'Hint 1'
                }
            }],
            'solution': {
                'correct_answer': 'x-y',
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'explanation_1',
                    'html': 'Solution explanation'
                }
            },
            'id': 'AlgebraicExpressionInput'
        },
        'next_content_id_index': 4,
        'param_changes': [],
        'solicit_answer_details': False,
        'card_is_checkpoint': False,
        'linked_skill_id': None,
        'classifier_model_id': None
    }

    question_state_dict_new_schema = {
        'content': {
            'content_id': 'content',
            'html': 'Question 1'
        },
        'recorded_voiceovers': {
            'voiceovers_mapping': {
                'content': {},
                'explanation_0': {},
                'feedback_0': {},
                'default_outcome_0': {},
                'hint_0': {}
            }
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'explanation_0': {},
                'feedback_0': {},
                'default_outcome_0': {},
                'hint_0': {}
            }
        },
        'interaction': {
            'answer_groups': [answer_group3],
            'confirmed_unclassified_answers': [],
            'customization_args': {
                'allowedVariables': {
                    'value': ['a', 'b']
                },
                'useFractionForDivision': {
                    'value': False
                }
            },
            'default_outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'default_outcome_0',
                    'html': 'Correct Answer'
                },
                'param_changes': [],
                'refresher_exploration_id': None,
                'labelled_as_correct': True,
                'missing_prerequisite_skill_id': None
            },
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_0',
                    'html': 'Hint 1'
                }
            }],
            'solution': {
                'correct_answer': 'x-y',
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'explanation_0',
                    'html': 'Solution explanation'
                }
            },
            'id': 'AlgebraicExpressionInput'
        },
        'next_content_id_index': 4,
        'param_changes': [],
        'solicit_answer_details': False,
        'card_is_checkpoint': False,
        'linked_skill_id': None,
        'classifier_model_id': None
    }

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_broken_question_leads_to_no_migration(self) -> None:
        first_unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict,
            language_code='abc',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        first_unmigrated_question_model.update_timestamps()
        first_unmigrated_question_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create question',
            [{'cmd': question_domain.CMD_CREATE_NEW}]
        )

        second_unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_2_ID,
            question_state_data=self.question_state_dict,
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=45)
        second_unmigrated_question_model.update_timestamps()
        second_unmigrated_question_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create question',
            [{'cmd': question_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'QUESTION PROCESSED ERROR: \"(\'question_1_id\', '
                    'ValidationError(\'Invalid language code: abc\'))\": 1'
                )
            ),
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'
            )
        ])
        first_migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID)
        self.assertEqual(first_migrated_question_model.version, 1)

        second_migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_2_ID)
        self.assertEqual(second_migrated_question_model.version, 1)

    def test_migrated_question_is_not_migrated(self) -> None:
        unmigrated_question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=self.question_state_dict_new_schema,
            language_code='en',
            linked_skill_ids=['skill_id'],
            question_state_data_schema_version=(
                feconf.CURRENT_STATE_SCHEMA_VERSION)
        )
        unmigrated_question_model.update_timestamps()
        unmigrated_question_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Create question',
            [{'cmd': question_domain.CMD_CREATE_NEW}]
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='QUESTION PREVIOUSLY MIGRATED SUCCESS: 1'),
        ])

        migrated_question_model = question_models.QuestionModel.get(
            self.QUESTION_1_ID
        )
        self.assertEqual(migrated_question_model.version, 1)
