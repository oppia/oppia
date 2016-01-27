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

__author__ = 'Ben Henning'

"""Tests for statistics one-off jobs."""

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_services
from core.domain import stats_jobs_one_off
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
from core.tests import test_utils


# TODO(bhenning): Implement tests for multiple answers submitted to the same
# rule. Implement tests for multiple identical rules being submitted. Test
# submissions to answer groups and rules other than the default.
class AnswerMigrationJobTests(test_utils.GenericTestBase):
    """Tests for the answer migration job."""

    DEMO_EXP_ID = '16'
    DEFAULT_RULESPEC_STR = 'Default'

    # This is based on the old stats_models.process_submitted_answer().
    def _record_old_answer(
            self, state_name, rule_spec_str, answer_html_str):
        answer_log = stats_models.StateRuleAnswerLogModel.get_or_create(
            self.exploration.id, state_name, rule_spec_str)
        if answer_html_str in answer_log.answers:
            answer_log.answers[answer_html_str] += 1
        else:
            answer_log.answers[answer_html_str] = 1
        try:
            answer_log.put()
        except Exception as e:
            logging.error(e)
            pass

    def _run_migration_job(self):
        # Start migration job on sample answers.
        job_id = stats_jobs_one_off.AnswerMigrationJob.create_new()
        stats_jobs_one_off.AnswerMigrationJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

    def _get_state_answers(self, state_name):
        return stats_services.get_state_answers(
            self.DEMO_EXP_ID, 1, state_name)

    def setUp(self):
        super(AnswerMigrationJobTests, self).setUp()
        exp_services.load_demo(self.DEMO_EXP_ID)
        self.exploration = exp_services.get_exploration_by_id(self.DEMO_EXP_ID)

    def test_migrate_code_repl(self):
        state_name = 'Code Editor'

        rule_spec_str = 'OutputEquals(Hello Oppia)'
        code_answer = '# Type your code here.\nprint \'Hello Oppia\''
        self._record_old_answer(state_name, rule_spec_str, code_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
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
            'params': []
        }])

    def test_migrate_continue(self):
        state_name = 'Continue'
        self._record_old_answer(state_name, self.DEFAULT_RULESPEC_STR, '')

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': None,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'Continue',
            'params': []
        }])

    def test_migrate_graph_input(self):
        pass

    def test_migrate_image_click_input(self):
        state_name = 'Image Region'

        rule_spec_str = 'IsInRegion(ctor)'
        html_answer = '(0.307, 0.871)'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
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
            'params': []
        }])

    def test_migrate_interactive_map(self):
        state_name = 'World Map'

        rule_spec_str = (
            'Within(100.0,[19.228176737766262, -99.13993835449219])')
        html_answer = '(18.979026, -99.316406)'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': [18.979026, -99.316406],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 2,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'InteractiveMap',
            'params': []
        }])

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

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': ['<p>Good option A.</p>', '<p>Good option C.</p>'],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'ItemSelectionInput',
            'params': []
        }])

    def test_migrate_logic_proof(self):
        pass

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

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
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
            'params': []
        }])

    def test_migrate_multiple_choice_input(self):
        state_name = 'Multiple Choice'

        rule_spec_str = 'Equals(1)'
        html_answer = '<p>Second choice</p>'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': 1,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'MultipleChoiceInput',
            'params': []
        }])

    def test_migrate_music_notes_input(self):
        pass

    def test_migrate_numeric_input(self):
        state_name = 'Number Input'

        rule_spec_str = 'IsGreaterThan(9.0)'
        html_answer = '89.0'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': 89.0,
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'NumericInput',
            'params': []
        }])

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

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
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
            'params': []
        }])

    def test_migrate_set_input(self):
        state_name = 'Set Input'

        rule_spec_str = (
            'HasElementsIn([u\'orange\', u\'purple\', u\'silver\'])')
        html_answer = '[u\'purple\']'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': ['purple'],
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'SetInput',
            'params': []
        }])

    def test_migrate_text_input(self):
        state_name = 'Text Input'

        rule_spec_str = 'Contains(ate)'
        html_answer = 'appreciate'
        self._record_old_answer(state_name, rule_spec_str, html_answer)

        # There should be no answers in the new data storage model.
        state_answers = self._get_state_answers(state_name)
        self.assertIsNone(state_answers)

        self._run_migration_job()

        # The answer should have been properly migrated to the new storage
        # model.
        state_answers = self._get_state_answers(state_name)
        self.assertEqual(state_answers.answers_list, [{
            'answer': 'appreciate',
            'time_spent_in_sec': 0.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'session_id': 'migrated_state_answer_session_id',
            'interaction_id': 'TextInput',
            'params': []
        }])
