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
from core.domain import rights_manager
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import stats_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
from extensions.objects.models import objects
(stats_models,exp_models) = models.Registry.import_models([
    models.NAMES.statistics, models.NAMES.exploration])

import feconf


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

        self.text_input_state_name = self.exploration.init_state_name

    def test_fuzzy_matches_does_not_migrate(self):
        state_name = self.text_input_state_name

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
        self.assertIn('Cannot reconstitute fuzzy rule', sorted(job_output)[0])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_from_deleted_exploration_is_still_migrated(self):
        state_name = self.text_input_state_name

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])

        self.assertEqual(len(job_output), 0)
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_from_fully_deleted_exploration_is_migrated(self):
        state_name = self.text_input_state_name

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
            state_name, exploration_version=(
                stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_VERSION))

        self.assertEqual(state_answers.exploration_id, self.DEMO_EXP_ID)
        self.assertEqual(state_answers.exploration_version, (
            stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_VERSION))
        self.assertEqual(state_answers.state_name, state_name)
        self.assertEqual(state_answers.interaction_id, (
            stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_INTERACTION_ID)) # pylint: disable=line-too-long
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': (
                stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_ANSWER),
            'time_spent_in_sec': 0.0,
            'answer_group_index': None,
            'rule_spec_index': None,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': (
                stats_domain.MIGRATED_STATE_ANSWER_MISSING_EXPLORATION_INTERACTION_ID), # pylint: disable=line-too-long
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])

        self.assertEqual(job_output, [
            'Encountered permanently missing exploration referenced to by '
            'submitted answers. Migrating with missing exploration and state.'])
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

        self.assertEqual(len(job_output), 2)
        self.assertIn('failing to evaluate param string', sorted(job_output)[0])
        self._verify_migration_validation_problems(1)

    def test_multiple_migrations_does_not_duplicate_answers(self):
        state_name = self.text_input_state_name

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
        state_name1 = self.text_input_state_name
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

        job_output = sorted(self._run_migration_job())

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
        state_name = self.text_input_state_name

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

    def test_migration_job_should_migrate_100_answers(self):
        """This test ensures the migration job properly migrates 100 answers,
        since it splits up answers in batches of 100 for less intense
        submission.
        """
        state_name = self.text_input_state_name

        rule_spec_str = 'Contains(ate)'
        html_answer = 'Plate'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, submitted_answer_count=100)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # All 100 answers should be retrievable.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(len(state_answers.submitted_answer_list), 100)
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migration_job_should_migrate_101_answers(self):
        """This test ensures the migration job properly migrates 101 answers,
        since it splits up answers in batches of 100 for less intense
        submission.
        """
        state_name = self.text_input_state_name

        rule_spec_str = 'Contains(ate)'
        html_answer = 'Plate'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, submitted_answer_count=101)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # All 100 answers should be retrievable.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(len(state_answers.submitted_answer_list), 101)
        self.assertEqual(job_output, [])
        self._verify_no_migration_validation_problems()

    def test_migration_job_should_migrate_200_answers(self):
        """This test ensures the migration job properly migrates 200 answers,
        since it splits up answers in batches of 100 for less intense
        submission.
        """
        state_name = self.text_input_state_name

        rule_spec_str = 'Contains(ate)'
        html_answer = 'Plate'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, submitted_answer_count=200)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()

        # All 100 answers should be retrievable.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(len(state_answers.submitted_answer_list), 200)
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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 2)
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_matches_to_correct_exp_version_after_stats(self):
        """Tests whether an answer is correctly matched to a given exp version
        if its answer model was created before the state could support a
        submitted answer. This is verified by creating an exploration without an
        interaction but a default outcome, visiting the stats page in the editor
        is simulated by creating a new answer model for this state, then the
        state is updated to have a valid exploration and an answer is submitted
        for it. This is based on a real exploration found in production.
        """
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name
        initial_state = exploration.states[state_name]

        # Although a user can't update an exploration to contain a default
        # outcome without an interaction ID, the modern exploration version can
        # migrate certain states that previously had some default information to
        # contain a default outcome even without an initialized interaction.
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
            'new_value': {
                'dest': state_name,
                'feedback': [],
                'param_changes': []
            }
        }], 'Update state to have default outcome')

        # Ensure the entity exists, even though it's empty. This happens for a
        # variety of read-only reasons.
        rule_spec_str = 'Default'
        stats_models.StateRuleAnswerLogModel.get_or_create(
            'exp_id0', state_name, rule_spec_str)

        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'Continue',
            'old_value': initial_state.interaction.id
        }], 'Update state to have Continue interaction')

        html_answer = ''
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id='exp_id0')

        # Verify the exploration is at version 3.
        exploration = exp_services.get_exploration_by_id('exp_id0')
        self.assertEqual(exploration.version, 3)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0')
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # The answer should be matched to version 3 of the exploration.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=3)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': None,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'Continue',
            'params': {},
            'rule_spec_str': 'Default',
            'answer_str': ''
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 3)
        self._verify_no_migration_validation_problems()

    def test_migrated_answer_matches_correct_version_after_inter_change(self):
        """Tests whether an answer is correctly matched to a given exp version
        if the interaction of the matching state has changed between created_on
        and last_updated for the submitted answers.
        """
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name
        initial_state = exploration.states[state_name]

        # Set the initial state to be text input.
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
            'new_value': {
                'dest': state_name,
                'feedback': [],
                'param_changes': []
            }
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': 'dle'
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }]
        }], 'Create initial text input state')

        # Insert an answer for the TextInput version of the state.
        rule_spec_str_text_input = 'Contains(dle)'
        html_answer_text_input = 'fiddle'
        self._record_old_answer(
            state_name, rule_spec_str_text_input, html_answer_text_input,
            exploration_id='exp_id0')

        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': []
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'Continue',
            'old_value': initial_state.interaction.id
        }], 'Update state to have Continue interaction')

        # Insert an answer for the Continue version of the state.
        rule_spec_str_continue = 'Default'
        html_answer_continue = ''
        self._record_old_answer(
            state_name, rule_spec_str_continue, html_answer_continue,
            exploration_id='exp_id0')

        # Verify the exploration is at version 3.
        exploration = exp_services.get_exploration_by_id('exp_id0')
        self.assertEqual(exploration.version, 3)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0')
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # The first answer should match version 2 and the second answer should
        # match version 3 of the exploration, since an interaction ID occurred
        # between those two answers.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=2)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'fiddle',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': {},
            'rule_spec_str': rule_spec_str_text_input,
            'answer_str': html_answer_text_input
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 2)

        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=3)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': None,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'Continue',
            'params': {},
            'rule_spec_str': rule_spec_str_continue,
            'answer_str': html_answer_continue
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 3)

        self._verify_no_migration_validation_problems()

    def test_migrated_answer_matches_correct_version_after_cust_change(self):
        """Tests whether an answer is correctly matched to a given exp version
        if the interaction customization arguments of the matching state has
        changed between created_on and last_updated for the submitted answers.
        """
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name

        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'MultipleChoiceInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME),
            'new_value': {
                'dest': state_name,
                'feedback': [],
                'param_changes': []
            }
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': 0
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }, {
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': 1
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }]
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'new_value': {
                'choices': {
                    'value': [
                        'Choice 1',
                        'Choice 2'
                    ]
                }
            }
        }], 'Create initial multiple choice state')

        # Insert an answer for the current multiple choice options.
        rule_spec_str0 = 'Equals(1)'
        html_answer0 = 'Choice 2'
        self._record_old_answer(
            state_name, rule_spec_str0, html_answer0, exploration_id='exp_id0')

        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
            'new_value': {
                'choices': {
                    'value': [
                        'Choice A',
                        'Choice B'
                    ]
                }
            }
        }], 'Update state to have different multiple choice options')

        # Insert an answer for the new version of the state.
        rule_spec_str1 = 'Equals(1)'
        html_answer1 = 'Choice B'
        self._record_old_answer(
            state_name, rule_spec_str1, html_answer1, exploration_id='exp_id0')

        # Verify the exploration is at version 3.
        exploration = exp_services.get_exploration_by_id('exp_id0')
        self.assertEqual(exploration.version, 3)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0')
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # The first answer should match version 2 and the second answer should
        # match version 3 of the exploration, since the customization arguments
        # changed between those two versions.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=2)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 1,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': {},
            'rule_spec_str': rule_spec_str0,
            'answer_str': html_answer0
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 2)

        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=3)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 1,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': {},
            'rule_spec_str': rule_spec_str1,
            'answer_str': html_answer1
        }])
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 3)

        self._verify_no_migration_validation_problems()

    def test_migrated_answer_matches_to_latest_correct_exp_version(self):
        """Tests to ensure that if irrelevant changes happen after a given
        answer is submitted, that answer will be matched to the latest matching
        exploration version.
        """
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name
        initial_state = exploration.states[state_name]

        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': 'ate'
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }]
        }], 'Create initial text input state')

        # Submit an answer to this version of the exploration.
        rule_spec_str0 = 'Contains(ate)'
        html_answer0 = 'levitate'
        self._record_old_answer(
            state_name, rule_spec_str0, html_answer0, exploration_id='exp_id0')

        # Make a few more changes to the exploration.
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'new_value': [{
                'type': 'text',
                'value': 'Changes to the state content'
            }]
        }], 'Change the state content')
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'new_value': [{
                'type': 'text',
                'value': 'Better changes to the state content'
            }]
        }], 'Change the state content (again)')

        # Submit another answer.
        rule_spec_str1 = 'Contains(ate)'
        html_answer1 = 'appreciate'
        self._record_old_answer(
            state_name, rule_spec_str1, html_answer1, exploration_id='exp_id0')

        # Now make a change to the exploration that would change which version
        # the answers should be matched to.
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': []
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'Continue',
            'old_value': initial_state.interaction.id
        }], 'Update state to have Continue interaction')

        # Verify the exploration is at version 5.
        exploration = exp_services.get_exploration_by_id('exp_id0')
        self.assertEqual(exploration.version, 5)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0')
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # Both answers should be matched to version 4 of the exploration, since
        # that's the latest version to which they both match but is before a
        # version which changes their meaning.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=4)
        submitted_answer_list = state_answers.get_submitted_answer_dict_list()
        self.assertIn({
            'answer': 'levitate',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': {},
            'rule_spec_str': rule_spec_str0,
            'answer_str': html_answer0
        }, submitted_answer_list)
        self.assertIn({
            'answer': 'appreciate',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': {},
            'rule_spec_str': rule_spec_str1,
            'answer_str': html_answer1
        }, submitted_answer_list)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 4)
        self._verify_no_migration_validation_problems()

    def test_answer_migration_with_exploration_that_cannot_be_migrated(self):
        """Some explorations (like cities) cannot be migrated to the latest
        schema version, so any answers submitted to them in the past cannot be
        recovered since the explorations fail to load during answer migration.
        This test is to verify answer migration job properly handles these
        answers and still successfully migrates them.
        """
        # Based on test_utils.save_new_exp_with_states_schema_v0, create a new
        # exploration (a subset of cities) with a non-answer subject and save it
        # directly to the data store (to circumvent the exploration migration
        # pipeline).
        exp_id = 'eid0'
        exp_model = exp_models.ExplorationModel(
            id=exp_id,
            category='category',
            title='title',
            objective='objective',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            skin_customizations={'panels_contents': {}},
            states_schema_version=0,
            init_state_name='PickCity',
            states={
                'AbuDhabi': {
                    'content': [{'type': 'text', 'value': 'Find {{CityName}}'}],
                    'interaction': {
                        'customization_args': {
                            'latitude': { 'value': 0 },
                            'longitude': { 'value': 0 },
                            'zoom': { 'value': 3 }
                        },
                        'id': 'InteractiveMap',
                        'handlers': [{
                            'name': 'submit',
                            'rule_specs': [{
                                'dest': 'PickCity',
                                'feedback': [
                                    'Yes, that\'s where {{CityName}} is!'],
                                'param_changes': [],
                                'definition': {
                                    'inputs': {
                                      'd': 11.0,
                                      'p': [24.467, 54.367]
                                    },
                                    'name': 'Within',
                                    'rule_type': 'atomic',
                                    'subject': 'answer'
                                }
                            }]
                        }]
                    },
                    'param_changes': []
                },
                'PickCity': {
                    'content': [{
                        'type': 'text',
                        'value': 'Let\s find {{CityName}}?'
                    }],
                    'interaction': {
                        'customization_args': {
                            'choices': {
                                'value': [
                                    'OK.',
                                    'No, I want to try a different city.',
                                    'Exit. I know enough cities.'
                                ]
                            }
                        },
                        'handlers': [{
                            'name': 'submit',
                            'rule_specs': [{
                                'definition': {
                                    'inputs': { 'x': 1 },
                                    'name': 'Equals',
                                    'rule_type': 'atomic',
                                    'subject': 'answer'
                                },
                                'dest': 'PickCity',
                                'feedback': ['Let us pick another city.'],
                                'param_changes': []
                            }, {
                                'definition': {
                                    'inputs': { 'x': 2 },
                                    'name': 'Equals',
                                    'rule_type': 'atomic',
                                    'subject': 'answer'
                                },
                                'dest': 'END',
                                'feedback': ['OK, bye.'],
                                'param_changes': []
                            }, {
                                'definition': {
                                    'inputs': { 'x': 'Abu Dhabi' },
                                    'name': 'Equals',
                                    'rule_type': 'atomic',
                                    'subject': 'CityName'
                                },
                                'dest': 'AbuDhabi',
                                'feedback': [],
                                'param_changes': []
                            }]
                        }],
                        'id': 'MultipleChoiceInput'
                    },
                    'param_changes': [{
                        'customization_args': {
                            'list_of_values': ['Abu Dhabi']
                        },
                        'generator_id': 'RandomSelector',
                        'name': 'CityName'
                    }]
                }
            },
            param_specs={
                'CityName': {
                    'obj_type': 'UnicodeString'
                }
            },
            param_changes=[]
        )
        rights_manager.create_new_exploration_rights(exp_id, self.owner_id)
        exp_model.commit(self.owner_id, 'Create unmigratable exp', [{
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category',
        }])

        # Start off picking another city.
        state_name = 'PickCity'
        rule_spec_str = 'Equals(1)'
        html_answer = 'No, I want to try a different city.'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id=exp_id)

        # Select Abu Dhabi.
        rule_spec_str = 'Equals(Abu Dhabi)'
        html_answer = 'OK.'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id=exp_id)

        # Send the right location.
        state_name = 'AbuDhabi'
        rule_spec_str = 'Within(11.0,[24.467, 54.367])'
        html_answer = '(27.28934, 50.99873)'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id=exp_id)

        # Select to exit the exploration.
        state_name = 'PickCity'
        rule_spec_str = 'Equals(2)'
        html_answer = 'Exit. I know enough cities.'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id=exp_id)

        # There should be no answers in the new data storage model.
        self.assertIsNone(self._get_state_answers(
            'PickCity', exploration_id=exp_id))
        self.assertIsNone(self._get_state_answers(
            'AbuDhabi', exploration_id=exp_id))

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # The answers should have been properly migrated to the new storage
        # model.
        state_answers0 = self._get_state_answers(
            'PickCity', exploration_id=exp_id)
        state_answers1 = self._get_state_answers(
            'AbuDhabi', exploration_id=exp_id)

        # Verify the answer submitted to AbuDhabi.
        self.assertEqual(state_answers1.get_submitted_answer_dict_list(), [{
            'answer': [27.28934, 50.99873],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'InteractiveMap',
            'params': {},
            'rule_spec_str': 'Within(11.0,[24.467, 54.367])',
            'answer_str': '(27.28934, 50.99873)'
        }])

        # Verify the answers submitted to PickCity.
        submitted_answers = state_answers0.get_submitted_answer_dict_list()
        self.assertEqual(len(submitted_answers), 3)
        self.assertIn({
            'answer': 1,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': {},
            'rule_spec_str': 'Equals(1)',
            'answer_str': 'No, I want to try a different city.'
        }, submitted_answers)
        self.assertIn({
            'answer': 2,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': {},
            'rule_spec_str': 'Equals(2)',
            'answer_str': 'Exit. I know enough cities.'
        }, submitted_answers)

        # This is the answer corresponding to a rule spec with a non-answer
        # subject. The answer is changed in the migration to properly correspond
        # to the multiple choice index. Between the answer and answer_str, it is
        # indistinguishable from a standard MC submission. However, params is
        # set here, since the parameter that was present when the answer was
        # submitted is fully recoverable.
        self.assertIn({
            'answer': 0,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 2,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': { 'CityName': 'Abu Dhabi' },
            'rule_spec_str': 'Equals(Abu Dhabi)',
            'answer_str': 'OK.'
        }, submitted_answers)

        self._verify_no_migration_validation_problems()

    def test_migrate_answer_which_matches_multiple_states(self):
        """Verifies the migration job, in the event of an answer perfectly
        matching to two different versions of an exploration, picks the version
        which comes later unconditionally. This represents cases observed in
        production.
        """
        exploration = self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        state_name = exploration.init_state_name
        initial_state = exploration.states[state_name]

        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'NumericInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': '2.5'
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }]
        }], 'Create initial text input state')

        # Submit an answer to this version of the exploration.
        rule_spec_str = 'Equals(2.5)'
        html_answer = '2.5'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id='exp_id0')

        # Update the explorations's interaction to be TextInput, allowing the
        # old answer to perfectly match both states.

        # Make a few more changes to the exploration.
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': '2.5'
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }]
        }], 'Change to TextInput')

        # Submit the same answer to this version of the exploration.
        rule_spec_str = 'Equals(2.5)'
        html_answer = '2.5'
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id='exp_id0')

        # Verify the exploration is at version 3.
        exploration = exp_services.get_exploration_by_id('exp_id0')
        self.assertEqual(exploration.version, 3)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=3)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # Both answers should be matched to version 3 of the exploration, even
        # though one was submitted to version 2 and both correctly match to
        # both.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=3)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': '2.5',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }] * 2)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 3)
        self._verify_no_migration_validation_problems()

    def test_answer_submitted_before_reused_exp_id_should_be_ignored(self):
        """This is testing for when an answer is submitted to an exploration,
        the exploration is permanently deleted, then a new exploration is added
        with the exact same ID. This test is meant to fix a problem theorized to
        plague answers observed in production.
        """
        state_name = feconf.DEFAULT_INIT_STATE_NAME

        rule_spec_str = 'Contains(ate)'
        html_answer = 'appreciate'

        # Create a valid exploration.
        self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')
        exp_services.update_exploration(self.owner_id, 'exp_id0', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': state_name,
            'property_name': (
                exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'Contains',
                    'inputs': {
                        'x': 'ate'
                    }
                }],
                'outcome': {
                    'dest': state_name,
                    'feedback': [],
                    'param_changes': []
                }
            }]
        }], 'Create initial text input state')

        # Record the answer to an exploration, then delete it since it will be
        # replaced by another exploration of the same ID.
        self._record_old_answer(
            state_name, rule_spec_str, html_answer, exploration_id='exp_id0')
        exp_services.delete_exploration(
            self.owner_id, 'exp_id0', force_deletion=True)

        # Create a new exploration with the same ID as the deleted one, but with
        # states that don't match the previous answer.
        self.save_new_valid_exploration(
            'exp_id0', self.owner_id, end_state_name='End')

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=2)
        self.assertIsNone(state_answers)

        # An answer should be lost since it's older than the current exploration
        # of the matched ID.
        job_output = self._run_migration_job()
        self.assertEqual(job_output, [
            'Expected failure: Cannot match answer to an exploration which was '
            'created after it was last submitted. (answer freq: 1)'])

        # The answer should not be migrated to the new storage model.
        state_answers = self._get_state_answers(
            state_name, exploration_id='exp_id0', exploration_version=2)
        self.assertIsNone(state_answers)

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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': code_answer
        }])
        self._verify_no_migration_validation_problems()

    def test_migrate_continue(self):
        state_name = 'Continue'
        self._record_old_answer(state_name, self.DEFAULT_RULESPEC_STR, '')

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': 'Default',
            'answer_str': ''
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self._verify_no_migration_validation_problems()

    def test_migrate_interactive_map_with_old_answer_html_formatting(self):
        """Similar to test_migrate_interactive_map, except this uses an answer
        string which comes from schema_utils, as was stored prior to commit
        #380ea2. This test is based on an exploration found in production.
        """
        state_name = 'World Map'

        rule_spec_str = (
            'Within(100.0,[19.228176737766262, -99.13993835449219])')
        html_answer = '%s' % (
            objects.CoordTwoDim.normalize([18.979026, -99.316406]))
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self._verify_no_migration_validation_problems()

    def test_migrate_interactive_map_with_much_old_answer_html_formatting(self):
        """Similar
        to test_migrate_interactive_map_with_old_answer_html_formatting, except
        in this case schema_utils was yet to be created, so answers were stored
        based on how they were represented in the frontend interaction
        implementation. This happened prior to commit #d60ccb. This test is
        based on an exploration found in production.
        """
        state_name = 'World Map'

        rule_spec_str = (
            'Within(100.0,[19.228176737766262, -99.13993835449219])')
        html_answer = '18.979026,-99.316406'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
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
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self._verify_no_migration_validation_problems()

    def test_migrate_text_input(self):
        state_name = self.text_input_state_name

        rule_spec_str = 'Contains(ate)'
        html_answer = 'appreciate'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

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
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self._verify_no_migration_validation_problems()

    def test_migrate_text_input_with_illegal_characters(self):
        """Similar to test_migrate_text_input, except answers with illegal
        characters like '<' and '>' are migrated. This test is based on an
        exploration found in production.
        """
        state_name = self.text_input_state_name

        rule_spec_str = 'Contains(ate)'
        html_answer = 'Let f(x)<|a|'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        job_output = self._run_migration_job()
        self.assertEqual(job_output, [])

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'Let f(x)<|a|',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': {},
            'rule_spec_str': rule_spec_str,
            'answer_str': html_answer
        }])
        self._verify_no_migration_validation_problems()
