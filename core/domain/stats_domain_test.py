# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from core.domain import exp_domain
from core.domain import stats_domain
from core.tests import test_utils
import feconf


class StateAnswersTests(test_utils.GenericTestBase):
    """Tests the StateAnswers domain object."""

    def test_can_retrieve_properly_constructed_submitted_answer_dict_list(self):
        state_answers = stats_domain.StateAnswers(
            'exp_id', 1, 'initial_state', 'TextInput', [
                stats_domain.SubmittedAnswer(
                    'Text', 'TextInput', 0, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'sess', 10.5,
                    rule_spec_str='rule spec str1', answer_str='answer str1'),
                stats_domain.SubmittedAnswer(
                    'Other text', 'TextInput', 1, 0,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION, {}, 'sess', 7.5,
                    rule_spec_str='rule spec str2', answer_str='answer str2')])
        submitted_answer_dict_list = (
            state_answers.get_submitted_answer_dict_list())
        self.assertEqual(submitted_answer_dict_list, [{
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str1',
            'answer_str': 'answer str1'
        }, {
            'answer': 'Other text',
            'interaction_id': 'TextInput',
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 7.5,
            'rule_spec_str': 'rule spec str2',
            'answer_str': 'answer str2'
        }])


class StateAnswersValidationTests(test_utils.GenericTestBase):
    """Tests the StateAnswers domain object for validation."""

    def setUp(self):
        super(StateAnswersValidationTests, self).setUp()
        self.state_answers = stats_domain.StateAnswers(
            'exp_id', 1, 'initial_state', 'TextInput', [])

        # The canonical object should have no validation problems
        self.state_answers.validate()

    def test_exploration_id_must_be_string(self):
        self.state_answers.exploration_id = 0
        self._assert_validation_error(
            self.state_answers, 'Expected exploration_id to be a string')

    def test_state_name_must_be_string(self):
        self.state_answers.state_name = ['state']
        self._assert_validation_error(
            self.state_answers, 'Expected state_name to be a string')

    def test_interaction_id_can_be_none(self):
        self.state_answers.interaction_id = None
        self.state_answers.validate()

    def test_interaction_id_must_otherwise_be_string(self):
        self.state_answers.interaction_id = 10
        self._assert_validation_error(
            self.state_answers, 'Expected interaction_id to be a string')

    def test_interaction_id_must_refer_to_existing_interaction(self):
        self.state_answers.interaction_id = 'FakeInteraction'
        self._assert_validation_error(
            self.state_answers, 'Unknown interaction_id: FakeInteraction')

    def test_submitted_answer_list_must_be_list(self):
        self.state_answers.submitted_answer_list = {}
        self._assert_validation_error(
            self.state_answers, 'Expected submitted_answer_list to be a list')

    def test_schema_version_must_be_integer(self):
        self.state_answers.schema_version = '1'
        self._assert_validation_error(
            self.state_answers, 'Expected schema_version to be an integer')

    def test_schema_version_must_be_between_one_and_current_version(self):
        self.state_answers.schema_version = 0
        self._assert_validation_error(
            self.state_answers, 'schema_version < 1: 0')

        self.state_answers.schema_version = (
            feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION + 1)
        self._assert_validation_error(
            self.state_answers,
            'schema_version > feconf\\.CURRENT_STATE_ANSWERS_SCHEMA_VERSION')

        self.state_answers.schema_version = 1
        self.state_answers.validate()


class SubmittedAnswerTests(test_utils.GenericTestBase):
    """Tests the SubmittedAnswer domain object."""

    def test_can_be_converted_to_from_full_dict(self):
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5, rule_spec_str='rule spec str',
            answer_str='answer str')
        submitted_answer_dict = submitted_answer.to_dict()
        cloned_submitted_answer = stats_domain.SubmittedAnswer.from_dict(
            submitted_answer_dict)
        self.assertEqual(
            cloned_submitted_answer.to_dict(), submitted_answer_dict)

    def test_can_be_converted_to_full_dict(self):
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5, rule_spec_str='rule spec str',
            answer_str='answer str')
        self.assertEqual(submitted_answer.to_dict(), {
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        })

    def test_dict_may_not_include_rule_spec_str_or_answer_str(self):
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5)
        self.assertEqual(submitted_answer.to_dict(), {
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5
        })

    def test_requires_answer_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'answer'):
            stats_domain.SubmittedAnswer.from_dict({
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_interaction_id_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'interaction_id'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_answer_group_index_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'answer_group_index'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_rule_spec_index_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'rule_spec_index'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_classification_categ_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'classification_categorization'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_params_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'params'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'session_id': 'sess',
                'time_spent_in_sec': 10.5
            })

    def test_requires_session_id_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'session_id'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'time_spent_in_sec': 10.5
            })

    def test_requires_time_spent_in_sec_to_be_created_from_dict(self):
        with self.assertRaisesRegexp(KeyError, 'time_spent_in_sec'):
            stats_domain.SubmittedAnswer.from_dict({
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
            })

    def test_can_be_created_from_full_dict(self):
        submitted_answer = stats_domain.SubmittedAnswer.from_dict({
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        })
        self.assertEqual(submitted_answer.answer, 'Text')
        self.assertEqual(submitted_answer.interaction_id, 'TextInput')
        self.assertEqual(submitted_answer.answer_group_index, 0)
        self.assertEqual(submitted_answer.rule_spec_index, 1)
        self.assertEqual(
            submitted_answer.classification_categorization,
            exp_domain.EXPLICIT_CLASSIFICATION)
        self.assertEqual(submitted_answer.params, {})
        self.assertEqual(submitted_answer.session_id, 'sess')
        self.assertEqual(submitted_answer.time_spent_in_sec, 10.5)
        self.assertEqual(submitted_answer.rule_spec_str, 'rule spec str')
        self.assertEqual(submitted_answer.answer_str, 'answer str')

    def test_can_be_created_from_dict_missing_rule_spec_and_answer(self):
        submitted_answer = stats_domain.SubmittedAnswer.from_dict({
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5
        })
        self.assertEqual(submitted_answer.answer, 'Text')
        self.assertEqual(submitted_answer.interaction_id, 'TextInput')
        self.assertEqual(submitted_answer.answer_group_index, 0)
        self.assertEqual(submitted_answer.rule_spec_index, 1)
        self.assertEqual(
            submitted_answer.classification_categorization,
            exp_domain.EXPLICIT_CLASSIFICATION)
        self.assertEqual(submitted_answer.params, {})
        self.assertEqual(submitted_answer.session_id, 'sess')
        self.assertEqual(submitted_answer.time_spent_in_sec, 10.5)
        self.assertIsNone(submitted_answer.rule_spec_str)
        self.assertIsNone(submitted_answer.answer_str)


class SubmittedAnswerValidationTests(test_utils.GenericTestBase):
    """Tests the SubmittedAnswer domain object for validation."""

    def setUp(self):
        super(SubmittedAnswerValidationTests, self).setUp()
        self.submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'session_id', 0.)

        # The canonical object should have no validation problems
        self.submitted_answer.validate()

    def test_answer_may_be_none_only_for_linear_interaction(self):
        # It's valid for answer to be None if the interaction type is Continue.
        self.submitted_answer.answer = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided answer except for linear '
            'interactions')

        self.submitted_answer.interaction_id = 'Continue'
        self.submitted_answer.validate()

    def test_time_spent_in_sec_must_not_be_none(self):
        self.submitted_answer.time_spent_in_sec = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided time_spent_in_sec')

    def test_time_spent_in_sec_must_be_number(self):
        self.submitted_answer.time_spent_in_sec = '0'
        self._assert_validation_error(
            self.submitted_answer, 'Expected time_spent_in_sec to be a number')

    def test_time_spent_in_sec_must_be_positive(self):
        self.submitted_answer.time_spent_in_sec = -1.
        self._assert_validation_error(
            self.submitted_answer,
            'Expected time_spent_in_sec to be non-negative')

    def test_session_id_must_not_be_none(self):
        self.submitted_answer.session_id = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided session_id')

    def test_session_id_must_be_string(self):
        self.submitted_answer.session_id = 90
        self._assert_validation_error(
            self.submitted_answer, 'Expected session_id to be a string')

    def test_params_must_be_dict(self):
        self.submitted_answer.params = []
        self._assert_validation_error(
            self.submitted_answer, 'Expected params to be a dict')

    def test_answer_group_index_must_be_integer(self):
        self.submitted_answer.answer_group_index = '0'
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_group_index to be an integer')

    def test_answer_group_index_must_be_positive(self):
        self.submitted_answer.answer_group_index = -1
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_group_index to be non-negative')

    def test_rule_spec_index_must_be_integer(self):
        self.submitted_answer.rule_spec_index = '0'
        self._assert_validation_error(
            self.submitted_answer, 'Expected rule_spec_index to be an integer')

    def test_rule_spec_index_must_be_positive(self):
        self.submitted_answer.rule_spec_index = -1
        self._assert_validation_error(
            self.submitted_answer,
            'Expected rule_spec_index to be non-negative')

    def test_classification_categorization_must_be_valid_category(self):
        self.submitted_answer.classification_categorization = (
            exp_domain.TRAINING_DATA_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = (
            exp_domain.STATISTICAL_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = (
            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = 'soft'
        self._assert_validation_error(
            self.submitted_answer,
            'Expected valid classification_categorization')

    def test_rule_spec_str_must_be_none_or_string(self):
        self.submitted_answer.rule_spec_str = 10
        self._assert_validation_error(
            self.submitted_answer,
            'Expected rule_spec_str to be either None or a string')

        self.submitted_answer.rule_spec_str = 'str'
        self.submitted_answer.validate()

        self.submitted_answer.rule_spec_str = None
        self.submitted_answer.validate()

    def test_answer_str_must_be_none_or_string(self):
        self.submitted_answer.answer_str = 10
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_str to be either None or a string')

        self.submitted_answer.answer_str = 'str'
        self.submitted_answer.validate()

        self.submitted_answer.answer_str = None
        self.submitted_answer.validate()


class StateAnswersCalcOutputValidationTests(test_utils.GenericTestBase):
    """Tests the StateAnswersCalcOutput domain object for validation."""

    def setUp(self):
        super(StateAnswersCalcOutputValidationTests, self).setUp()
        self.state_answers_calc_output = stats_domain.StateAnswersCalcOutput(
            'exp_id', 1, 'initial_state', 'AnswerFrequencies', {})

        # The canonical object should have no validation problems
        self.state_answers_calc_output.validate()

    def test_exploration_id_must_be_string(self):
        self.state_answers_calc_output.exploration_id = 0
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected exploration_id to be a string')

    def test_state_name_must_be_string(self):
        self.state_answers_calc_output.state_name = ['state']
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected state_name to be a string')

    def test_calculation_id_must_be_string(self):
        self.state_answers_calc_output.calculation_id = ['calculation id']
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected calculation_id to be a string')

    def test_calculation_output_must_be_less_than_one_million_bytes(self):
        self.state_answers_calc_output.calculation_output = (
            ['This is not a long sentence.'] * 200000)
        self._assert_validation_error(
            self.state_answers_calc_output,
            'calculation_output is too big to be stored')
