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

"""Test calculations to get interaction answer views."""

from core.domain import calculation_registry
from core.domain import exp_domain
from core.tests import test_utils
from extensions.answer_summarizers import models as answer_models


class BaseCalculationUnitTests(test_utils.GenericTestBase):
    """Test cases for BaseCalculation."""

    def test_requires_override_for_calculation(self):
        with self.assertRaises(NotImplementedError):
            answer_models.BaseCalculation().calculate_from_state_answers_dict(
                state_answers_dict={})


class CalculationUnitTestBase(test_utils.GenericTestBase):
    """Utility methods for testing calculations."""

    # TODO(brianrodri, msl): Only non-zero answer-counts are tested. Should look
    # into adding coverage for answers with zero-frequencies.

    def _create_answer_dict(
            self, answer, time_spent_in_card=3.2, session_id='sid1',
            classify_category=exp_domain.EXPLICIT_CLASSIFICATION):
        return {
            'answer': answer,
            'time_spent_in_sec': time_spent_in_card,
            'session_id': session_id,
            'classification_categorization': classify_category,
        }

    def _create_state_answers_dict(
            self, answer_dicts_list, exploration_id='0', exploration_version=1,
            state_name='Welcome!', interaction_id='MultipleChoiceInput'):
        """Builds a simple state_answers_dict with optional default values."""
        return {
            'exploration_id': exploration_id,
            'exploration_version': exploration_version,
            'state_name': state_name,
            'interaction_id': interaction_id,
            'submitted_answer_list': answer_dicts_list,
        }

    def _get_calculation_instance(self):
        """Requires the existance of the class constant: CALCULATION_ID."""
        if not hasattr(self, 'CALCULATION_ID'):
            raise NotImplementedError(
                'Subclasses must provide a value for CALCULATION_ID.')
        return calculation_registry.Registry.get_calculation_by_id(
            self.CALCULATION_ID)

    def _perform_calculation(self, state_answers_dict):
        """Performs calculation on state_answers_dict and returns its output."""
        calculation_instance = self._get_calculation_instance()
        state_answers_calc_output = (
            calculation_instance.calculate_from_state_answers_dict(
                state_answers_dict))
        self.assertEqual(
            state_answers_calc_output.calculation_id,
            self.CALCULATION_ID)
        return state_answers_calc_output.calculation_output


class AnswerFrequenciesUnitTestCase(CalculationUnitTestBase):
    """Tests for arbitrary answer frequency calculations."""

    CALCULATION_ID = 'AnswerFrequencies'

    def test_top_answers_without_ties(self):
        # Create 12 answers with different frequencies.
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] *  8 + ['F'] *  7 + ['G'] *  6 + ['H'] * 5 +
            ['I'] *  4 + ['J'] *  3 + ['K'] *  2 + ['L'])
        answer_dicts_list = [self._create_answer_dict(a) for a in answers]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # All 12 should be sorted.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 12},
            {'answer': 'B', 'frequency': 11},
            {'answer': 'C', 'frequency': 10},
            {'answer': 'D', 'frequency': 9},
            {'answer': 'E', 'frequency': 8},
            {'answer': 'F', 'frequency': 7},
            {'answer': 'G', 'frequency': 6},
            {'answer': 'H', 'frequency': 5},
            {'answer': 'I', 'frequency': 4},
            {'answer': 'J', 'frequency': 3},
            {'answer': 'K', 'frequency': 2},
            {'answer': 'L', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_answers_with_ties(self):
        """Ties are resolved by submission ordering: earlier ranks higher."""
        answers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
        answer_dicts_list = [self._create_answer_dict(a) for a in answers]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # All 12 should appear in-order.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 1},
            {'answer': 'B', 'frequency': 1},
            {'answer': 'C', 'frequency': 1},
            {'answer': 'D', 'frequency': 1},
            {'answer': 'E', 'frequency': 1},
            {'answer': 'F', 'frequency': 1},
            {'answer': 'G', 'frequency': 1},
            {'answer': 'H', 'frequency': 1},
            {'answer': 'I', 'frequency': 1},
            {'answer': 'J', 'frequency': 1},
            {'answer': 'K', 'frequency': 1},
            {'answer': 'L', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)


class Top5AnswerFrequenciesUnitTestCase(CalculationUnitTestBase):
    """Tests for Top 5 answer frequency calculations."""

    CALCULATION_ID = 'Top5AnswerFrequencies'

    def test_top5_without_ties(self):
        """Simplest case: ordering is obvious."""
        # Create 12 answers with different frequencies.
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] *  8 + ['F'] *  7 + ['G'] *  6 + ['H'] * 5 +
            ['I'] *  4 + ['J'] *  3 + ['K'] *  2 + ['L'])
        answer_dicts_list = [self._create_answer_dict(a) for a in answers]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # Only top 5 are kept.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 12},
            {'answer': 'B', 'frequency': 11},
            {'answer': 'C', 'frequency': 10},
            {'answer': 'D', 'frequency': 9},
            {'answer': 'E', 'frequency': 8},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_top5_with_ties(self):
        """Ties are resolved by submission ordering: earlier ranks higher."""
        # Create 12 answers with same frequencies.
        answers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
        answer_dicts_list = [self._create_answer_dict(a) for a in answers]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # Only first 5 are kept.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 1},
            {'answer': 'B', 'frequency': 1},
            {'answer': 'C', 'frequency': 1},
            {'answer': 'D', 'frequency': 1},
            {'answer': 'E', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)


class Top10AnswerFrequenciesUnitTestCase(CalculationUnitTestBase):
    """Tests for Top 10 answer frequency calculations."""

    CALCULATION_ID = 'Top10AnswerFrequencies'

    def test_top10_answers_without_ties(self):
        # Create 12 answers with different frequencies.
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] *  8 + ['F'] *  7 + ['G'] *  6 + ['H'] * 5 +
            ['I'] *  4 + ['J'] *  3 + ['K'] *  2 + ['L'])
        answer_dicts_list = [self._create_answer_dict(a) for a in answers]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # Only top 10 are kept.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 12},
            {'answer': 'B', 'frequency': 11},
            {'answer': 'C', 'frequency': 10},
            {'answer': 'D', 'frequency': 9},
            {'answer': 'E', 'frequency': 8},
            {'answer': 'F', 'frequency': 7},
            {'answer': 'G', 'frequency': 6},
            {'answer': 'H', 'frequency': 5},
            {'answer': 'I', 'frequency': 4},
            {'answer': 'J', 'frequency': 3},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_top10_with_ties(self):
        """Ties are resolved by submission ordering: earlier ranks higher."""
        # Create 12 answers with same frequencies.
        answers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
        answer_dicts_list = [self._create_answer_dict(a) for a in answers]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # Only first 10 are kept.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 1},
            {'answer': 'B', 'frequency': 1},
            {'answer': 'C', 'frequency': 1},
            {'answer': 'D', 'frequency': 1},
            {'answer': 'E', 'frequency': 1},
            {'answer': 'F', 'frequency': 1},
            {'answer': 'G', 'frequency': 1},
            {'answer': 'H', 'frequency': 1},
            {'answer': 'I', 'frequency': 1},
            {'answer': 'J', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)


class FrequencyCommonlySubmittedElementsUnitTestCase(CalculationUnitTestBase):
    """This calculation only works on answers which are all lists."""
    CALCULATION_ID = 'FrequencyCommonlySubmittedElements'

    def test_shared_answers(self):
        answer_dicts_list = [
            self._create_answer_dict(['B', 'A']),
            self._create_answer_dict(['A', 'C']),
            self._create_answer_dict(['D']),
            self._create_answer_dict(['B', 'A']),
        ]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = [
            {'answer': 'A', 'frequency': 3},
            {'answer': 'B', 'frequency': 2},
            {'answer': 'C', 'frequency': 1},
            {'answer': 'D', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_many_shared_answers(self):
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] *  8 + ['F'] *  7 + ['G'] *  6 + ['H'] * 5 +
            ['I'] *  4 + ['J'] *  3 + ['K'] *  2 + ['L'])
        split_len = len(answers) // 4
        answer_dicts_list = [
            self._create_answer_dict(answers[           :split_len*1]),
            self._create_answer_dict(answers[split_len*1:split_len*2]),
            self._create_answer_dict(answers[split_len*2:split_len*3]),
            self._create_answer_dict(answers[split_len*3:           ]),
        ]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        # Only top 10 are kept.
        expected_calc_output = [
            {'answer': 'A', 'frequency': 12},
            {'answer': 'B', 'frequency': 11},
            {'answer': 'C', 'frequency': 10},
            {'answer': 'D', 'frequency': 9},
            {'answer': 'E', 'frequency': 8},
            {'answer': 'F', 'frequency': 7},
            {'answer': 'G', 'frequency': 6},
            {'answer': 'H', 'frequency': 5},
            {'answer': 'I', 'frequency': 4},
            {'answer': 'J', 'frequency': 3},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)


class TopAnswersByCategorizationUnitTestCase(CalculationUnitTestBase):
    CALCULATION_ID = 'TopAnswersByCategorization'

    def test_empty_state_answers_dict(self):
        state_answers_dict = self._create_state_answers_dict([])
        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = {}
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_only_one_category(self):
        answer_dicts_list = [
            self._create_answer_dict(
                'Hard A', classify_category=exp_domain.EXPLICIT_CLASSIFICATION),
        ]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = {
            'explicit': [{'answer': 'Hard A', 'frequency': 1}],
        }
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_many_categories(self):
        answer_dicts_list = [
            # EXPLICIT.
            self._create_answer_dict(
                'Explicit A',
                classify_category=exp_domain.EXPLICIT_CLASSIFICATION),
            self._create_answer_dict(
                'Explicit B',
                classify_category=exp_domain.EXPLICIT_CLASSIFICATION),
            self._create_answer_dict(
                'Explicit A',
                classify_category=exp_domain.EXPLICIT_CLASSIFICATION),
            # TRAINING DATA.
            self._create_answer_dict(
                'Trained data A',
                classify_category=exp_domain.TRAINING_DATA_CLASSIFICATION),
            self._create_answer_dict(
                'Trained data B',
                classify_category=exp_domain.TRAINING_DATA_CLASSIFICATION),
            self._create_answer_dict(
                'Trained data B',
                classify_category=exp_domain.TRAINING_DATA_CLASSIFICATION),
            # STATS CLASSIFIER.
            self._create_answer_dict(
                'Stats B',
                classify_category=exp_domain.STATISTICAL_CLASSIFICATION),
            self._create_answer_dict(
                'Stats C',
                classify_category=exp_domain.STATISTICAL_CLASSIFICATION),
            self._create_answer_dict(
                'Stats C',
                classify_category=exp_domain.STATISTICAL_CLASSIFICATION),
            self._create_answer_dict(
                'Trained data B',
                classify_category=exp_domain.STATISTICAL_CLASSIFICATION),
            # DEFAULT OUTCOMES.
            self._create_answer_dict(
                'Default C',
                classify_category=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            self._create_answer_dict(
                'Default C',
                classify_category=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            self._create_answer_dict(
                'Default B',
                classify_category=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
        ]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = {
            'explicit': [
                {'answer': 'Explicit A', 'frequency': 2},
                {'answer': 'Explicit B', 'frequency': 1},
            ],
            'training_data_match': [
                {'answer': 'Trained data B', 'frequency': 2},
                {'answer': 'Trained data A', 'frequency': 1},
            ],
            'statistical_classifier': [
                {'answer': 'Stats C', 'frequency': 2},
                {'answer': 'Stats B', 'frequency': 1},
                {'answer': 'Trained data B', 'frequency': 1},
            ],
            'default_outcome': [
                {'answer': 'Default C', 'frequency': 2},
                {'answer': 'Default B', 'frequency': 1},
            ],
        }
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)
