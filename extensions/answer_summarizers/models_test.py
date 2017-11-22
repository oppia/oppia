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
import random
import string

from extensions.answer_summarizers import models as answer_models
from core.domain import calculation_registry
from core.domain import exp_domain
from core.tests import test_utils


class BaseCalculationUnitTest(test_utils.GenericTestBase):
    """Test cases for BaseCalculation."""

    def test_requires_override_for_calculation(self):
        _ = {}
        with self.assertRaises(NotImplementedError):
            answer_models.BaseCalculation().calculate_from_state_answers_dict(_)


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
            classify_categories=[exp_domain.EXPLICIT_CLASSIFICATION], num=None):
        """This is similar to _create_answer_dict, except it provides a list
        of N answers. It reuses answers, times_spent_in_card, and session_ids
        cyclically to construct the list. When num isn't provided, the returned
        list will be len(answers).
        """
        if num is None:
            num = len(answers)
        infinite_args = itertools.izip(
            itertools.cycle(answers), itertools.cycle(times_spent_in_card),
            itertools.cycle(session_ids), itertools.cycle(classify_categories))
        return [
            self._create_answer_dict(*a)
            for a in itertools.islice(infinite_args, num)
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


class Top5AnswerFrequenciesUnitTests(CalculationUnitTestBase):
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
        self.assertItemsEqual(actual_calc_output, expected_calc_output)

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
        self.assertItemsEqual(actual_calc_output, expected_calc_output)
