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

import itertools

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

    def _create_answer_dict(
            self, answer, time_spent_in_card, session_id,
            classify_category=exp_domain.EXPLICIT_CLASSIFICATION):
        return {
            'answer': answer,
            'time_spent_in_sec': time_spent_in_card,
            'session_id': session_id,
            'classification_categorization': classify_category,
        }

    def _create_answer_dicts_list(
            self, answers, times_spent_in_card, session_ids,
            classify_categories=(exp_domain.EXPLICIT_CLASSIFICATION,),
            num=None):
        """This is similar to _create_answer_dict, except it simplifies building
        several different answers at once.

        Args:
            answers: iterable of str. Each member is used cyclically to produce
                each individual answer_dict.
            times_spent_in_card: iterable of float. Each member is used
                cyclically to produce each individual answer_dict.
            session_ids: iterable of str. Each member is used cyclically to
                produce each individual answer_dict.
            classify_categories: iterable of str. The classifications that will
                be assigned to the answers.
            num: int or None. The total number of answers to produce. When None,
                len(answers) is used instead.

        Returns:
            dict(str : *). Built by sending zipped args to _create_answer_dict.
        """
        if num is None:
            num = len(answers)
        infinite_args = itertools.izip(
            itertools.cycle(answers), itertools.cycle(times_spent_in_card),
            itertools.cycle(session_ids), itertools.cycle(classify_categories))
        return [
            self._create_answer_dict(*create_answer_dict_args)
            for create_answer_dict_args in itertools.islice(infinite_args, num)
        ]

    def _create_session_ids(self, num):
        """Builds a list of N simple session id values."""
        return ['sid%d' % n for n in range(1, num + 1)]

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
        try:
            return calculation_registry.Registry.get_calculation_by_id(
                self.CALCULATION_ID)
        except AttributeError:
            raise NotImplementedError(
                'Subclasses must provide a value for CALCULATION_ID.')

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
        answers = ''.join(
            v * r for v, r in zip('ABCDEFGHIJKL', range(12, 0, -1)))
        answer_dicts_list = self._create_answer_dicts_list(
            answers, times_spent_in_card=[1., 2., 3., 4., 5.],
            session_ids=self._create_session_ids(7))
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
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
        self.assertEqual(actual_calc_output, expected_calc_output)

    def test_answers_with_ties(self):
        """Ties are resolved by submission ordering: earlier ranks higher."""
        answer_dicts_list = self._create_answer_dicts_list(
            answers='ABCDEFGHIJKL', times_spent_in_card=[1., 2.],
            session_ids=self._create_session_ids(3))
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
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
        self.assertEqual(actual_calc_output, expected_calc_output)


class Top5AnswerFrequenciesUnitTestCase(CalculationUnitTestBase):
    """Tests for Top 5 answer frequency calculations."""

    CALCULATION_ID = 'Top5AnswerFrequencies'

    def test_top5_without_ties(self):
        """Simplest case: ordering is obvious."""
        answer_dicts_list = self._create_answer_dicts_list(
            answers='A' * 5 + 'B' * 4 + 'C' * 3 + 'D' * 2 + 'E',
            times_spent_in_card=[1., 2., 3.],
            session_ids=self._create_session_ids(4))
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = [
            {'answer': 'A', 'frequency': 5},
            {'answer': 'B', 'frequency': 4},
            {'answer': 'C', 'frequency': 3},
            {'answer': 'D', 'frequency': 2},
            {'answer': 'E', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output, expected_calc_output)

    def test_top5_with_ties(self):
        """Ties are resolved by submission ordering: earlier ranks higher."""
        answer_dicts_list = self._create_answer_dicts_list(
            answers='ABCDE', times_spent_in_card=[1., 2.],
            session_ids=self._create_session_ids(3))
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = [
            {'answer': 'A', 'frequency': 1},
            {'answer': 'B', 'frequency': 1},
            {'answer': 'C', 'frequency': 1},
            {'answer': 'D', 'frequency': 1},
            {'answer': 'E', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output, expected_calc_output)


class Top10AnswerFrequenciesUnitTestCase(CalculationUnitTestBase):
    """Tests for Top 10 answer frequency calculations."""

    CALCULATION_ID = 'Top10AnswerFrequencies'

    def test_top10_answers_without_ties(self):
        # Create 12 answers with different frequencies.
        answers = ''.join(
            v * r for v, r in zip('ABCDEFGHIJ', range(10, 0, -1)))
        answer_dicts_list = self._create_answer_dicts_list(
            answers, times_spent_in_card=[1., 2., 3., 4., 5.],
            session_ids=self._create_session_ids(7))
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = [
            {'answer': 'A', 'frequency': 10},
            {'answer': 'B', 'frequency': 9},
            {'answer': 'C', 'frequency': 8},
            {'answer': 'D', 'frequency': 7},
            {'answer': 'E', 'frequency': 6},
            {'answer': 'F', 'frequency': 5},
            {'answer': 'G', 'frequency': 4},
            {'answer': 'H', 'frequency': 3},
            {'answer': 'I', 'frequency': 2},
            {'answer': 'J', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output, expected_calc_output)

    def test_top10_with_ties(self):
        """Ties are resolved by submission ordering: earlier ranks higher."""
        answer_dicts_list = self._create_answer_dicts_list(
            answers='ABCDEFGHIJ', times_spent_in_card=[1., 2.],
            session_ids=self._create_session_ids(3))
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
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
        self.assertEqual(actual_calc_output, expected_calc_output)


class FrequencyCommonlySubmittedElementsUnitTestCase(CalculationUnitTestBase):
    CALCULATION_ID = 'FrequencyCommonlySubmittedElements'

    def test_shared_answers(self):
        """This calculation only works on answers that accept multiple answers.
        """
        answers = [
            {'B': 1},
            'A',
            ['C', 'D', 'E'],
            {'A': 3},
        ]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list=[
            self._create_answer_dict([answers[1], answers[0]], 0.1, 'sid1'),
            self._create_answer_dict([answers[0], answers[2]], 0.1, 'sid1'),
            self._create_answer_dict([answers[3]], 0.1, 'sid1'),
            self._create_answer_dict([answers[1], answers[0]], 0.1, 'sid1')
        ])

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = [
            {'answer': {'B': 1}, 'frequency': 3},
            {'answer': 'A', 'frequency': 2},
            {'answer': ['C', 'D', 'E'], 'frequency': 1},
            {'answer': {'A': 3}, 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output, expected_calc_output)


class TopAnswersByCategorizationUnitTestCase(CalculationUnitTestBase):
    CALCULATION_ID = 'TopAnswersByCategorization'

    def test_empty_state_answers_dict(self):
        state_answers_dict = self._create_state_answers_dict([])
        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = {}
        self.assertEqual(actual_calc_output, expected_calc_output)

    def test_only_one_category(self):
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list=[
            self._create_answer_dict(
                'Hard A', 0.2, 'sid1', exp_domain.EXPLICIT_CLASSIFICATION),
        ])

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = {
            'explicit': [{'answer': 'Hard A', 'frequency': 1}],
        }
        self.assertEqual(actual_calc_output, expected_calc_output)

    def test_many_categories(self):
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list=[
            # EXPLICIT
            self._create_answer_dict(
                'Explicit A', 0., 'sid1', exp_domain.EXPLICIT_CLASSIFICATION),
            self._create_answer_dict(
                'Explicit B', 0., 'sid1', exp_domain.EXPLICIT_CLASSIFICATION),
            self._create_answer_dict(
                'Explicit A', 0., 'sid1', exp_domain.EXPLICIT_CLASSIFICATION),
            # TRAINING DATA
            self._create_answer_dict(
                'Trained data A', 0., 'sid1',
                exp_domain.TRAINING_DATA_CLASSIFICATION),
            self._create_answer_dict(
                'Trained data B', 0., 'sid1',
                exp_domain.TRAINING_DATA_CLASSIFICATION),
            self._create_answer_dict(
                'Trained data B', 0., 'sid1',
                exp_domain.TRAINING_DATA_CLASSIFICATION),
            # STATS CLASSIFIER
            self._create_answer_dict(
                'Stats B', 0., 'sid1', exp_domain.STATISTICAL_CLASSIFICATION),
            self._create_answer_dict(
                'Stats C', 0., 'sid1', exp_domain.STATISTICAL_CLASSIFICATION),
            self._create_answer_dict(
                'Stats C', 0., 'sid1', exp_domain.STATISTICAL_CLASSIFICATION),
            self._create_answer_dict(
                'Trained data B', 0., 'sid1',
                exp_domain.STATISTICAL_CLASSIFICATION),
            # DEFAULT OUTCOMES
            self._create_answer_dict(
                'Default C', 0., 'sid1',
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            self._create_answer_dict(
                'Default C', 0., 'sid1',
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
            self._create_answer_dict(
                'Default B', 0., 'sid1',
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
        ])

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
        self.assertEqual(actual_calc_output, expected_calc_output)
