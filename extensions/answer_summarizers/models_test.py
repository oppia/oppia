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

from __future__ import annotations

import re

from core.domain import calculation_registry
from core.domain import exp_domain
from core.domain import stats_domain
from core.tests import test_utils
from extensions.answer_summarizers import models as answer_models

from typing import Dict, List, Union

MYPY = False
if MYPY:  # pragma: no cover
    from core.domain import state_domain


class BaseCalculationUnitTests(test_utils.GenericTestBase):
    """Test cases for BaseCalculation."""

    def test_requires_override_for_calculation(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'Subclasses of BaseCalculation should implement the '
                'calculate_from_state_answers_dict(state_answers_dict) '
                'method.')):
            answer_models.BaseCalculation().calculate_from_state_answers_dict({
                'exploration_id': 'exp_id',
                'exploration_version': 1,
                'state_name': 'Home',
                'interaction_id': 'test_id',
                'submitted_answer_list': []
            })

    def test_equality_of_hashable_answers(self) -> None:
        hashable_answer_1 = answer_models.HashableAnswer('answer_1')
        hashable_answer_2 = answer_models.HashableAnswer('answer_2')
        hashable_answer_3 = answer_models.HashableAnswer('answer_1')

        self.assertFalse(hashable_answer_1 == hashable_answer_2)
        self.assertTrue(hashable_answer_1 == hashable_answer_3)
        self.assertFalse(hashable_answer_1 == 1)


class CalculationUnitTestBase(test_utils.GenericTestBase):
    """Utility methods for testing calculations."""

    # TODO(brianrodri): Only non-zero answer-counts are tested. Should
    # look into adding coverage for answers with zero-frequencies.

    CALCULATION_ID = 'AnswerFrequencies'

    def _create_answer_dict(
        self,
        answer: state_domain.AcceptableCorrectAnswerTypes,
        time_spent_in_card: float = 3.2,
        session_id: str = 'sid1',
        classify_category: str = exp_domain.EXPLICIT_CLASSIFICATION
    ) -> stats_domain.SubmittedAnswerDict:
        """Returns the answer dict.

        Args:
            answer: dict(str, *). The answer in dict format.
            time_spent_in_card: float. The time spent (in sec) in each card. By
                default, it's 3.2 sec.
            session_id: str. The session id. By default, it's 'sid1'.
            classify_category: str. The answer classification category. By
                default, it's 'explicit classification'.

        Returns:
            dict(str, *). The answer object in dict format.
        """
        return {
            'answer': answer,
            'time_spent_in_sec': time_spent_in_card,
            'session_id': session_id,
            'classification_categorization': classify_category,
            'answer_group_index': 1,
            'rule_spec_index': 2,
            'interaction_id': '',
            'params': {},
            'rule_spec_str': None,
            'answer_str': None
        }

    def _create_state_answers_dict(
        self,
        answer_dicts_list: List[stats_domain.SubmittedAnswerDict],
        exploration_id: str = '0',
        exploration_version: int = 1,
        state_name: str = 'Welcome!',
        interaction_id: str = 'MultipleChoiceInput'
    ) -> stats_domain.StateAnswersDict:
        """Builds a simple state_answers_dict with optional default values."""
        return {
            'exploration_id': exploration_id,
            'exploration_version': exploration_version,
            'state_name': state_name,
            'interaction_id': interaction_id,
            'submitted_answer_list': answer_dicts_list,
        }

    def _get_calculation_instance(self) -> answer_models.BaseCalculation:
        """Requires the existance of the class constant: CALCULATION_ID."""
        return calculation_registry.Registry.get_calculation_by_id(
            self.CALCULATION_ID)

    def _perform_calculation(
        self, state_answers_dict: stats_domain.StateAnswersDict
    ) -> Union[
        stats_domain.AnswerFrequencyList,
        stats_domain.CategorizedAnswerFrequencyLists
    ]:
        """Performs calculation on state_answers_dict and returns its output."""
        calculation_instance = self._get_calculation_instance()
        state_answers_calc_output = (
            calculation_instance.calculate_from_state_answers_dict(
                state_answers_dict))
        self.assertEqual(
            state_answers_calc_output.calculation_id,
            self.CALCULATION_ID)
        return state_answers_calc_output.calculation_output


class AnswerFrequenciesUnitTests(CalculationUnitTestBase):
    """Tests for arbitrary answer frequency calculations."""

    CALCULATION_ID = 'AnswerFrequencies'

    def test_top_answers_without_ties(self) -> None:
        # Create 12 answers with different frequencies.
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] * 8 + ['F'] * 7 + ['G'] * 6 + ['H'] * 5 +
            ['I'] * 4 + ['J'] * 3 + ['K'] * 2 + ['L'])
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

    def test_answers_with_ties(self) -> None:
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

    def test_answer_frequencies_are_not_calculated_for_linear_interactions(
        self
    ) -> None:
        # None answer can only be present when interaction is a linear
        # interaction. Eg: continue.
        answer_dicts_list = [self._create_answer_dict(None)]
        state_answers_dict = self._create_state_answers_dict(
            answer_dicts_list, interaction_id='Continue'
        )

        with self.assertRaisesRegex(
            Exception,
            'Linear interaction \'Continue\' is not allowed for the calculation'
            ' of answers\' frequencies.'
        ):
            self._perform_calculation(state_answers_dict)


class Top5AnswerFrequenciesUnitTests(CalculationUnitTestBase):
    """Tests for Top 5 answer frequency calculations."""

    CALCULATION_ID = 'Top5AnswerFrequencies'

    def test_top5_without_ties(self) -> None:
        """Simplest case: ordering is obvious."""
        # Create 12 answers with different frequencies.
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] * 8 + ['F'] * 7 + ['G'] * 6 + ['H'] * 5 +
            ['I'] * 4 + ['J'] * 3 + ['K'] * 2 + ['L'])
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

    def test_top5_with_ties(self) -> None:
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

    def test_top_5_answers_are_not_calculated_for_linear_interactions(
        self
    ) -> None:
        # None answer can only be present when interaction is a linear
        # interaction. Eg: continue.
        answer_dicts_list = [self._create_answer_dict(None)]
        state_answers_dict = self._create_state_answers_dict(
            answer_dicts_list, interaction_id='Continue'
        )

        with self.assertRaisesRegex(
            Exception,
            'Linear interaction \'Continue\' is not allowed for the calculation'
            ' of top 5 answers, by frequency.'
        ):
            self._perform_calculation(state_answers_dict)


class Top10AnswerFrequenciesUnitTests(CalculationUnitTestBase):
    """Tests for Top 10 answer frequency calculations."""

    CALCULATION_ID = 'Top10AnswerFrequencies'

    def test_top10_answers_without_ties(self) -> None:
        # Create 12 answers with different frequencies.
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] * 8 + ['F'] * 7 + ['G'] * 6 + ['H'] * 5 +
            ['I'] * 4 + ['J'] * 3 + ['K'] * 2 + ['L'])
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

    def test_top10_with_ties(self) -> None:
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

    def test_top_10_answers_are_not_calculated_for_linear_interactions(
        self
    ) -> None:
        # None answer can only be present when interaction is a linear
        # interaction. Eg: continue.
        answer_dicts_list = [self._create_answer_dict(None)]
        state_answers_dict = self._create_state_answers_dict(
            answer_dicts_list, interaction_id='Continue'
        )

        with self.assertRaisesRegex(
            Exception,
            'Linear interaction \'Continue\' is not allowed for the calculation'
            ' of top 10 answers, by frequency.'
        ):
            self._perform_calculation(state_answers_dict)


class FrequencyCommonlySubmittedElementsUnitTests(CalculationUnitTestBase):
    """This calculation only works on answers which are all lists."""

    CALCULATION_ID = 'FrequencyCommonlySubmittedElements'

    def test_shared_answers(self) -> None:
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

    def test_many_shared_answers(self) -> None:
        answers = (
            ['A'] * 12 + ['B'] * 11 + ['C'] * 10 + ['D'] * 9 +
            ['E'] * 8 + ['F'] * 7 + ['G'] * 6 + ['H'] * 5 +
            ['I'] * 4 + ['J'] * 3 + ['K'] * 2 + ['L'])
        split_len = len(answers) // 4
        answer_dicts_list = [
            self._create_answer_dict(answers[:split_len * 1]),
            self._create_answer_dict(answers[split_len * 1:split_len * 2]),
            self._create_answer_dict(answers[split_len * 2:split_len * 3]),
            self._create_answer_dict(answers[split_len * 3:]),
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

    def test_common_answers_are_not_calculated_for_linear_interactions(
        self
    ) -> None:
        # None answer can only be present when interaction is a linear
        # interaction. Eg: continue.
        answer_dicts_list = [self._create_answer_dict(None)]
        state_answers_dict = self._create_state_answers_dict(
            answer_dicts_list, interaction_id='Continue'
        )

        with self.assertRaisesRegex(
            Exception,
            'Linear interaction \'Continue\' is not allowed for the calculation'
            ' of commonly submitted answers\' frequencies.'
        ):
            self._perform_calculation(state_answers_dict)

    def test_raises_error_if_non_iterable_answer_provided(
        self
    ) -> None:
        # Here 123 is not an iterable answer.
        answer_dicts_list = [self._create_answer_dict(123)]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        with self.assertRaisesRegex(
            Exception,
            'To calculate commonly submitted answers\' frequencies, answers '
            'must be provided in an iterable form, like: SetOfUnicodeString.'
        ):
            self._perform_calculation(state_answers_dict)


class TopAnswersByCategorizationUnitTests(CalculationUnitTestBase):
    CALCULATION_ID = 'TopAnswersByCategorization'

    def test_empty_state_answers_dict(self) -> None:
        state_answers_dict = self._create_state_answers_dict([])
        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output: Dict[str, str] = {}
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_only_one_category(self) -> None:
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

    def test_many_categories(self) -> None:
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

    def test_top_answers_are_not_calculated_for_linear_interactions(
        self
    ) -> None:
        # None answer can only be present when interaction is a linear
        # interaction. Eg: continue.
        answer_dicts_list = [self._create_answer_dict(None)]
        state_answers_dict = self._create_state_answers_dict(
            answer_dicts_list, interaction_id='Continue'
        )

        with self.assertRaisesRegex(
            Exception,
            'Linear interaction \'Continue\' is not allowed for the calculation'
            ' of top submitted answers, by frequency.'
        ):
            self._perform_calculation(state_answers_dict)


class TopNUnresolvedAnswersByFrequencyUnitTests(CalculationUnitTestBase):
    CALCULATION_ID = 'TopNUnresolvedAnswersByFrequency'

    def test_empty_state_answers_dict(self) -> None:
        state_answers_dict = self._create_state_answers_dict([])
        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output: List[stats_domain.AnswerOccurrenceDict] = []
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_unresolved_answers_list(self) -> None:
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
                'Explicit B',
                classify_category=exp_domain.STATISTICAL_CLASSIFICATION),
            # EXPLICIT.
            self._create_answer_dict(
                'Trained data B',
                classify_category=exp_domain.EXPLICIT_CLASSIFICATION),
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
            # EXPLICIT.
            self._create_answer_dict(
                'Default B',
                classify_category=exp_domain.EXPLICIT_CLASSIFICATION),
            # STATS CLASSIFIER.
            self._create_answer_dict(
                'Default B',
                classify_category=exp_domain.STATISTICAL_CLASSIFICATION),
        ]
        state_answers_dict = self._create_state_answers_dict(answer_dicts_list)

        actual_calc_output = self._perform_calculation(state_answers_dict)
        expected_calc_output = [
            {'answer': 'Default B', 'frequency': 3},
            {'answer': 'Explicit B', 'frequency': 2},
            {'answer': 'Stats C', 'frequency': 2},
            {'answer': 'Default C', 'frequency': 2},
            {'answer': 'Stats B', 'frequency': 1},
        ]
        self.assertEqual(actual_calc_output.to_raw_type(), expected_calc_output)

    def test_top_unresolved_answers_are_not_calculated_for_linear_interactions(
        self
    ) -> None:
        # None answer can only be present when interaction is a linear
        # interaction. Eg: continue.
        answer_dicts_list = [self._create_answer_dict(None)]
        state_answers_dict = self._create_state_answers_dict(
            answer_dicts_list, interaction_id='Continue'
        )

        with self.assertRaisesRegex(
            Exception,
            'Linear interaction \'Continue\' is not allowed for the calculation'
            ' of top submitted answers, by frequency.'
        ):
            self._perform_calculation(state_answers_dict)
