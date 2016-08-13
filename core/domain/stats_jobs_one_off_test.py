# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for statistics one-off jobs."""

import logging

from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_services
from core.domain import stats_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


# TODO(bhenning): Implement tests for multiple answers submitted to the same
# rule. Implement tests for multiple identical rules being submitted. Test
# submissions to answer groups and rules other than the default.
class AnswerMigrationJobTests(test_utils.GenericTestBase):
    """Tests for the answer migration job."""

    DEMO_EXP_ID = '16'
    DEFAULT_RULESPEC_STR = 'Default'

    # This is based on the old stats_models.process_submitted_answer().
    def _record_old_answer(
            self, state_name, rule_spec_str, answer_html_str,
            exploration_id=DEMO_EXP_ID, submitted_answer_count=1):
        answer_log = stats_models.StateRuleAnswerLogModel.get_or_create(
            exploration_id, state_name, rule_spec_str)
        if answer_html_str in answer_log.answers:
            answer_log.answers[answer_html_str] += submitted_answer_count
        else:
            answer_log.answers[answer_html_str] = submitted_answer_count
        try:
            answer_log.put()
        except Exception as e:
            logging.error(e)

    def _run_migration_job(self):
        # Start migration job on sample answers.
        job_id = stats_jobs_one_off.AnswerMigrationJob.create_new()
        stats_jobs_one_off.AnswerMigrationJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        return jobs.get_job_output(job_id)

    def _run_migration_validation_job(self):
        job_id = stats_jobs_one_off.AnswerMigrationValidationJob.create_new()
        stats_jobs_one_off.AnswerMigrationValidationJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        return jobs.get_job_output(job_id)

    def _verify_no_migration_validation_problems(self):
        self.assertEqual(self._run_migration_validation_job(), [])

    def _verify_migration_validation_problems(self, count):
        self.assertEqual(len(self._run_migration_validation_job()), count)

    def _get_state_answers(
            self, state_name, exploration_id=DEMO_EXP_ID,
            exploration_version=1):
        return stats_services.get_state_answers(
            exploration_id, exploration_version, state_name)

    def setUp(self):
        super(AnswerMigrationJobTests, self).setUp()
        exp_services.load_demo(self.DEMO_EXP_ID)
        self.exploration = exp_services.get_exploration_by_id(self.DEMO_EXP_ID)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.get_or_create_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_fuzzy_matches_does_not_migrate(self):
        state_name = 'Text Input'

        rule_spec_str = 'FuzzyMatches'
        html_answer = 'weight'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should not be properly migrated.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)
        self.assertEqual(job_output, [])

    def test_supports_migrating_params_out_of_order(self):
        state_name = 'Music Notes Input'

        rule_spec_str = (
            'Equals([{u\'readableNoteName\': u\'C5\', '
            'u\'noteDuration\': {u\'den\': 1, u\'num\': 1}}])')
        html_answer = u'[C5]\n'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': [{
                'readableNoteName': 'C5',
                'noteDuration': {
                    'num': 1.0,
                    'den': 1.0
                }
            }],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MusicNotesInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_from_deleted_exploration_is_still_migrated(self):
        state_name = 'Text Input'

        rule_spec_str = 'Contains(ate)'
        html_answer = 'appreciate'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        exp_services.delete_exploration(self.owner_id, self.DEMO_EXP_ID)

        job_output = self._run_migration_job()

        # The answer should have still migrated.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'appreciate',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])

        self.assertEqual(len(job_output), 0)
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_from_fully_deleted_exploration_is_migrated(self):
        state_name = 'Text Input'

        rule_spec_str = 'Contains(ate)'
        html_answer = 'appreciate'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        exp_services.delete_exploration(
            self.owner_id, self.DEMO_EXP_ID, force_deletion=True)

        job_output = self._run_migration_job()

        # There should still be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_version=0)

        self.assertEqual(state_answers.exploration_id, self.DEMO_EXP_ID)
        self.assertEqual(state_answers.exploration_version, 0)
        self.assertEqual(state_answers.state_name, state_name)
        self.assertEqual(state_answers.interaction_id, 'EndExploration')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': None,
            'time_spent_in_sec': 0.0,
            'answer_group_index': None,
            'rule_spec_index': None,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'EndExploration',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])

        self.assertEqual(len(job_output), 4)
        self.assertIn(
            'Encountered permanently missing exploration referenced to by '
            'submitted answers. Migrating with missing exploration.',
            job_output)
        self.assertIn(
            'Assuming answer belongs to the default outcome due to missing '
            'state object.', job_output)
        self.assertIn(
            'Assuming answer belongs to EndExploration due to missing state '
            'object', job_output)
        self.assertIn(
            'Cannot migrate answer due to missing answer state. Assuming it is '
            'None.', job_output)
        self._verify_no_migration_validation_problems()

    def test_rule_parameter_evaluation_with_invalid_characters(self):
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name
        initial_state = exploration.states[state_name]
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'MathExpressionInput',
            'old_value': initial_state.interaction.id
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'IsMathematicallyEquivalentTo',
                    'inputs': {
                        'x': 'y=mx+b'
                    }
                }],
                'outcome': {
                    'dest': 'End',
                    'feedback': ['Yes'],
                    'param_changes': []
                }
            }],
            'old_value': [
                answer_group.to_dict()
                for answer_group in initial_state.interaction.answer_groups]
        }], 'Add state with bad parameter')

        rule_spec_str = 'IsMathematicallyEquivalentTo(F\'(G(x))=e^{x^{3}})'
        html_answer = (
            '{\'ascii\': u\'y=(1)/(2)mx+b\', '
            '\'latex\': u\'y=\\\\dfract{1}{2}mx+b\'}')
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id='exp_id0')

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should not be migrated due to an invalid rule str.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self.assertEqual(len(job_output), 1)
        self.assertIn('failing to evaluate param string', job_output[0])
        self._verify_migration_validation_problems(1)

    def test_multiple_migrations_does_not_duplicate_answers(self):
        state_name = 'Text Input'

        rule_spec_str = 'Contains(ate)'
        self._record_old_answer(state_name, rule_spec_str, 'levitate')
        self._record_old_answer(state_name, rule_spec_str, 'appropriate')
        self._record_old_answer(state_name, rule_spec_str, 'truncate')

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # 3 answers should be in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(len(state_answers.submitted_answer_list), 3)
        self.assertEqual(job_output, [])

        job_output = self._run_migration_job()

        # Only 3 answers should be in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(len(state_answers.submitted_answer_list), 3)
        self.assertEqual(job_output, [
            'Encountered a submitted answer which has already been migrated'])
        self._verify_no_migration_validation_problems()

    def test_migration_results_can_be_validated(self):
        state_name1 = 'Text Input'
        rule_spec_str1 = 'Contains(ate)'

        state_name2 = 'Code Editor'
        rule_spec_str2 = 'OutputEquals(Hello Oppia)'
        code_answer2 = '# Type your code here.\nprint \'Hello Oppia\''

        self._record_old_answer(state_name1, rule_spec_str1, 'levitate')
        self._record_old_answer(state_name1, rule_spec_str1, 'appropriate')

        # There should be no answers in the new data storage model.
        state_answers1 = self._get_state_answers(state_name1)
        state_answers2 = self._get_state_answers(state_name2)
        self.assertIsNone(state_answers1)
        self.assertIsNone(state_answers2)

        self._run_migration_job()
        validation_output = self._run_migration_validation_job()

        # 2 answers should be in the new data storage model. No errors should
        # occur on validation.
        state_answers1 = self._get_state_answers(state_name1)
        state_answers2 = self._get_state_answers(state_name2)
        self.assertEqual(len(state_answers1.submitted_answer_list), 2)
        self.assertIsNone(state_answers2)
        self.assertEqual(validation_output, [])

        # TODO(bhenning): Update the validation process so that if this answer
        # were submitted to the same state as the other answers, it would not be
        # skipped.

        # Simulate the migration job "missing an answer".
        self._record_old_answer(state_name2, rule_spec_str2, code_answer2)
        validation_output = self._run_migration_validation_job()

        # Two answers are still in the new model, but now a validation error
        # will occur because an answer was not migrated.
        state_answers1 = self._get_state_answers(state_name1)
        state_answers2 = self._get_state_answers(state_name2)
        self.assertEqual(len(state_answers1.submitted_answer_list), 2)
        self.assertIsNone(state_answers2)
        self.assertEqual(validation_output, [
            'Answers not migrated: '
            '16.Code Editor.submit.OutputEquals(Hello Oppia)'])

        # Running the migration job again should fix the problem and reuslt in
        # no validation issues.
        self._run_migration_job()
        validation_output = self._run_migration_validation_job()

        # All 3 answers should be in the new data storage model.
        state_answers1 = self._get_state_answers(state_name1)
        state_answers2 = self._get_state_answers(state_name2)
        self.assertEqual(len(state_answers1.submitted_answer_list), 2)
        self.assertEqual(len(state_answers2.submitted_answer_list), 1)
        self.assertEqual(validation_output, [])

    def test_migration_job_catches_answer_which_fails_normalization(self):
        state_name = 'Set Input'

        rule_spec_str = (
            'HasElementsIn([u\'orange\', u\'purple\', u\'silver\'])')
        html_answer = '[u\'purple\', u\'orange\', u\'purple\']'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should fail to migrate because it cannot be normalized.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self.assertEqual(len(job_output), 2)
        self.assertIn('Failed to migrate all answers', job_output[0])
        self.assertIn('Failed to normalize', job_output[1])
        self._verify_migration_validation_problems(1)

    def test_migration_job_should_support_very_large_answers(self):
        """This test ensures the migration job does not fail when submitting
        large numbers of answers to the new data store that would require the
        new data store to begin using its linked-list functionality.
        """
        state_name = 'Text Input'

        rule_spec_str = 'Contains(ate)'
        html_answer = ''.join([str(x) for x in xrange(1024)])
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, submitted_answer_count=1000)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # All 1,000 answers should be retrievable, even though they exceed the
        # size limit of a single entity.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(len(state_answers.submitted_answer_list), 1000)
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_matches_to_correct_exp_version(self):
        """This test creates and updates an exploration at certain dates. It
        then submits an answer for the current exploration, then updates that
        exploration state to mean something completely different. During
        migration, the answer should properly be matched to the correct version
        of the exploration based on time. This scenario was based on a real
        exploration found in production.
        """
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name
        initial_state = exploration.states[state_name]
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'NumericInput',
            'old_value': initial_state.interaction.id
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': '4.0'
                    }
                }, {
                    'rule_type': 'IsLessThan',
                    'inputs': {
                        'x': '4.0'
                    }
                }, {
                    'rule_type': 'IsGreaterThan',
                    'inputs': {
                        'x': '4.0'
                    }
                }],
                'outcome': {
                    'dest': 'End',
                    'feedback': ['Yes'],
                    'param_changes': []
                }
            }],
            'old_value': [
                answer_group.to_dict()
                for answer_group in initial_state.interaction.answer_groups]
        }], 'Add state with rule specs')

        rule_spec_str = 'Equals(4.0)'
        html_answer = '4.0'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id='exp_id0')

        # Update the exploration to have different answer groups.
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'NumericInput',
            'old_value': initial_state.interaction.id
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': '5.0'
                    }
                }, {
                    'rule_type': 'IsLessThan',
                    'inputs': {
                        'x': '5.0'
                    }
                }, {
                    'rule_type': 'IsGreaterThan',
                    'inputs': {
                        'x': '5.0'
                    }
                }],
                'outcome': {
                    'dest': 'End',
                    'feedback': ['Yes'],
                    'param_changes': []
                }
            }],
            'old_value': [
                answer_group.to_dict()
                for answer_group in initial_state.interaction.answer_groups]
        }], 'The exploration is now looking for 5')

        # Verify the exploration is at version 3, since the answer should be
        # migrated to version 2.
        exploration = exp_services.get_exploration_by_id('exp_id0')
        self.assertEqual(exploration.version, 3)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0')
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=2)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 4.0,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'NumericInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 2)
        self._verify_no_migration_validation_problems()

    def test_migrate_code_repl(self):
        state_name = 'Code Editor'

        rule_spec_str = 'OutputEquals(Hello Oppia)'
        code_answer = '# Type your code here.\nprint \'Hello Oppia\''
        self._record_old_answer(state_name, rule_spec_str, code_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': {
                'code': code_answer,
                'output': 'Hello Oppia',
                'evaluation': '',
                'error': ''
            },
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'CodeRepl',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': code_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_continue(self):
        state_name = 'Continue'
        self._record_old_answer(state_name, self.DEFAULT_RULESPEC_STR, '')

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': None,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'Continue',
            'params': [],
            'rule_spec_str': 'Default',
            'answer_str': ''
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_image_click_input(self):
        state_name = 'Image Region'

        rule_spec_str = 'IsInRegion(ctor)'
        html_answer = '(0.307, 0.871)'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': {
                'clickPosition': [0.307, 0.871],
                'clickedRegions': ['ctor']
            },
            'time_spent_in_sec': 0.0,
            'answer_group_index': 4,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'ImageClickInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_interactive_map(self):
        state_name = 'World Map'

        rule_spec_str = (
            'Within(100.0,[19.228176737766262, -99.13993835449219])')
        html_answer = '(18.979026, -99.316406)'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': [18.979026, -99.316406],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 2,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'InteractiveMap',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_item_selection_input(self):
        state_name = 'Item Selection'

        rule_spec_str = (
            'Equals([u\'<p>Good option A.</p>\', u\'<p>Good option C.</p>\'])')
        html_answer = (
            '[u\'<p>Good option A.</p>\', u\'<p>Good option C.</p>\']')
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': ['<p>Good option A.</p>', '<p>Good option C.</p>'],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'ItemSelectionInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_logic_proof(self):
        state_name = 'Logic Proof'

        rule_spec_str = 'Correct()'
        html_answer = u'From p we have p'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': {
                'assumptions_string': 'p',
                'target_string': 'p',
                'proof_string': 'From p we have p',
                'correct': True
            },
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'LogicProof',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_math_expression_input(self):
        state_name = 'Math Expression Input'

        rule_spec_str = 'IsMathematicallyEquivalentTo(y=mx+b)'
        html_answer = (
            '{\'ascii\': u\'y=(1)/(2)mx+b\', '
            '\'latex\': u\'y=\\\\dfract{1}{2}mx+b\'}')
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': {
                'ascii': 'y=(1)/(2)mx+b',
                'latex': 'y=\\dfract{1}{2}mx+b'
            },
            'time_spent_in_sec': 0.0,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MathExpressionInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_multiple_choice_input(self):
        state_name = 'Multiple Choice'

        rule_spec_str = 'Equals(1)'
        html_answer = '<p>Second choice</p>'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 1,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_music_notes_input(self):
        state_name = 'Music Notes Input'

        rule_spec_str = (
            'Equals([{u\'noteDuration\': {u\'num\': 1, u\'den\': 1}, '
            'u\'readableNoteName\': u\'C5\'}])')
        html_answer = u'[C5]\n'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': [{
                'readableNoteName': 'C5',
                'noteDuration': {
                    'num': 1.0,
                    'den': 1.0
                }
            }],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MusicNotesInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_numeric_input(self):
        state_name = 'Number Input'

        rule_spec_str = 'IsGreaterThan(9.0)'
        html_answer = '89.0'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 89.0,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'NumericInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_pencil_code_editor(self):
        state_name = 'Pencil Code Editor'

        rule_spec_str = 'OutputEquals(Bye Oppia)'
        html_answer = (
            '{\'error\': u\'\', \'evaluation\': u\'\', \'code\': u"# Write a '
            'goodbye to me, below.\\nwrite \'Bye Oppia\'\\n", \'output\': '
            'u\'Bye Oppia\'}')
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': {
                'error': '',
                'evaluation': '',
                'code': (
                    '# Write a goodbye to me, below.\nwrite \'Bye Oppia\'\n'),
                'output': 'Bye Oppia'
            },
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'PencilCodeEditor',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_set_input(self):
        state_name = 'Set Input'

        rule_spec_str = (
            'HasElementsIn([u\'orange\', u\'purple\', u\'silver\'])')
        html_answer = '[u\'purple\']'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': ['purple'],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'SetInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_set_input_with_html(self):
        state_name = 'Set Input'

        rule_spec_str = (
            'HasElementsIn([u\'orange\', u\'purple\', u\'silver\'])')
        html_answer = '[u\'<p>some element</p>\']'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': ['<p>some element</p>'],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'SetInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrate_text_input(self):
        state_name = 'Text Input'

        rule_spec_str = 'Contains(ate)'
        html_answer = 'appreciate'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'appreciate',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': [],
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()
