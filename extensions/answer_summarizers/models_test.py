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

__author__ = 'Marcel Schmittfull'

import copy
import os
import sys

from core.domain import calculation_registry
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_services
from core.tests import test_utils
import feconf
import schema_utils
import utils


class InteractionAnswerSummaryCalculationUnitTests(test_utils.GenericTestBase):
    """Tests for answer summary calculations."""

    def _create_sample_answer(
            self, answer_value, time_spent_in_card, session_id):
        return {
            'answer_value': answer_value,
            'time_spent_in_sec': time_spent_in_card,
            'session_id': session_id
        }

    def _create_sample_answers(
            self, repeated_answer_value, times_spent_in_card, session_ids,
            repeat_count):
        """This is similar to _create_sample_answer, except it repeats a single
        answer N times. It reuses times_spent_in_card and session_ids
        cyclically as it constructs the list of sample answers.
        """
        return [self._create_sample_answer(
            repeated_answer_value,
            times_spent_in_card[i % len(times_spent_in_card)],
            session_ids[i % len(session_ids)]) for i in range(repeat_count)]

    def test_answer_frequencies_calculation(self):
        """For multiple choice interactions, test if the most common answers
        are calculated correctly for interaction answer views.
        """
        exp_id = '0'
        exp_version = 1
        state_name = 'Welcome!'
        params = {}
        DEFAULT_RULE_STR = exp_domain.DEFAULT_RULESPEC_STR
        exp_services.load_demo(exp_id)

        # Some answers.
        dummy_answers_list = [
            self._create_sample_answer('First choice', 4., 'sid1'),
            self._create_sample_answer('Second choice', 5., 'sid1'),
            self._create_sample_answer('Fourth choice', 2.5, 'sid1'),
            self._create_sample_answer('First choice', 10., 'sid2'),
            self._create_sample_answer('First choice', 3., 'sid2'),
            self._create_sample_answer('First choice', 1., 'sid2'),
            self._create_sample_answer('Second choice', 20., 'sid2'),
            self._create_sample_answer('First choice', 20., 'sid3')
        ]

        # Record answers.
        for answer in dummy_answers_list:
            stats_services.record_answer(
                exp_id, exp_version, state_name, 'test_handler',
                DEFAULT_RULE_STR, answer['session_id'],
                answer['time_spent_in_sec'], params,
                answer['answer_value'])

        # Retrieve state answers from storage and get corresponding
        # StateAnswers domain object.
        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        self.assertEquals(state_answers.interaction_id, 'MultipleChoiceInput')

        # Calculate answer counts. Input is dummy StateAnswersModel entity,
        # output is a list of dicts, each with keys 'answer' and 'frequency'.
        calculation_instance = (
            calculation_registry.Registry.get_calculation_by_id(
                'AnswerFrequencies'))
        actual_state_answers_calc_output = (
            calculation_instance.calculate_from_state_answers_entity(
                state_answers))

        self.assertEquals(
            actual_state_answers_calc_output.calculation_id,
            'AnswerFrequencies')
        actual_calc_output = actual_state_answers_calc_output.calculation_output

        # Expected answer counts (result of calculation)
        # TODO(msl): Include answers that were never clicked and received 0
        # count from the calculation. This is useful to help creators identify
        # multiple choice options which might not be useful since learners
        # don't click on them.
        expected_answer_counts = [{
            'answer': 'First choice',
            'frequency': 5,
        }, {
            'answer': 'Second choice',
            'frequency': 2,
        }, {
            'answer': 'Fourth choice',
            'frequency': 1,
        }]

        # Ensure the expected answers and their frequencies match.
        self.assertItemsEqual(actual_calc_output, expected_answer_counts)

    def test_top5_answer_frequencies_calculation(self):
        """Ensure the top 5 most frequent answers are submitted for TextInput.
        """
        exp_id = '0'
        exp_version = 1
        state_name = 'What language'
        params = {}
        DEFAULT_RULE_STR = exp_domain.DEFAULT_RULESPEC_STR
        exp_services.load_demo(exp_id)

        # Since this test is looking for the top 5 answers, it will submit ten
        # different answers are varying frequency:
        #   English (12 times), French (9), Finnish (7), Italian (4),
        #   Spanish (3), Japanese (3), Hungarian (2), Portuguese (1),
        #   German (1), and Gaelic (1).
        # Note that there are some ties here, including on the border of the
        # top 5 most frequent answers.
        english_answers_list = self._create_sample_answers(
            'English', [1., 2., 3.], ['sid1', 'sid2', 'sid3', 'sid4'], 12)
        french_answers_list = self._create_sample_answers(
            'French', [4., 5., 6.], ['sid2', 'sid3', 'sid5'], 9)
        finnish_answers_list = self._create_sample_answers(
            'Finnish', [7., 8., 9.], ['sid1', 'sid3', 'sid5', 'sid6'], 7)
        italian_answers_list = self._create_sample_answers(
            'Italian', [1., 4., 7.], ['sid1', 'sid6'], 4)
        spanish_answers_list = self._create_sample_answers(
            'Spanish', [2., 5., 8.], ['sid3'], 3)
        japanese_answers_list = self._create_sample_answers(
            'Japanese', [3., 6., 9.], ['sid1', 'sid2'], 3)
        hungarian_answers_list = self._create_sample_answers(
            'Hungarian', [1., 5.], ['sid6', 'sid7'], 2)
        portuguese_answers_list = self._create_sample_answers(
            'Portuguese', [5.], ['sid1'], 1)
        german_answers_list = self._create_sample_answers(
            'German', [4.], ['sid7'], 1)
        gaelic_answers_list = self._create_sample_answers(
            'Gaelic', [7.], ['sid8'], 1)

        all_answer_lists = [
            english_answers_list, french_answers_list, finnish_answers_list,
            italian_answers_list, spanish_answers_list, japanese_answers_list,
            hungarian_answers_list, portuguese_answers_list,
            german_answers_list, gaelic_answers_list
        ]

        # The answer list based on submitting each of the above answers at
        # different times.
        dummy_answers_list = [
            all_answer_lists[1][0], all_answer_lists[2][4],
            all_answer_lists[0][11], all_answer_lists[5][0],
            all_answer_lists[0][0], all_answer_lists[3][1],
            all_answer_lists[1][8], all_answer_lists[4][0],
            all_answer_lists[0][3], all_answer_lists[2][6],
            all_answer_lists[7][0], all_answer_lists[5][2],
            all_answer_lists[3][3], all_answer_lists[0][9],
            all_answer_lists[1][6], all_answer_lists[1][1],
            all_answer_lists[2][1], all_answer_lists[0][2],
            all_answer_lists[1][7], all_answer_lists[3][2],
            all_answer_lists[0][4], all_answer_lists[2][2],
            all_answer_lists[9][0], all_answer_lists[5][1],
            all_answer_lists[1][4], all_answer_lists[2][0],
            all_answer_lists[1][5], all_answer_lists[0][7],
            all_answer_lists[8][0], all_answer_lists[2][5],
            all_answer_lists[6][0], all_answer_lists[1][2],
            all_answer_lists[2][3], all_answer_lists[0][5],
            all_answer_lists[4][2], all_answer_lists[0][1],
            all_answer_lists[0][6], all_answer_lists[0][8],
            all_answer_lists[3][0], all_answer_lists[0][10],
            all_answer_lists[1][3], all_answer_lists[4][1],
            all_answer_lists[6][1]
        ]

        # Record answers.
        for answer in dummy_answers_list:
            stats_services.record_answer(
                exp_id, exp_version, state_name, 'test_handler',
                DEFAULT_RULE_STR, answer['session_id'],
                answer['time_spent_in_sec'], params,
                answer['answer_value'])

        # Retrieve state answers from storage and get corresponding
        # StateAnswers domain object.
        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        self.assertEquals(state_answers.interaction_id, 'TextInput')

        # Calculate answer counts. Input is dummy StateAnswersModel entity,
        # output is a list of dicts, each with keys 'answer' and 'frequency'.
        calculation_instance = (
            calculation_registry.Registry.get_calculation_by_id(
                'Top5AnswerFrequencies'))
        actual_state_answers_calc_output = (
            calculation_instance.calculate_from_state_answers_entity(
                state_answers))

        self.assertEquals(
            actual_state_answers_calc_output.calculation_id,
            'Top5AnswerFrequencies')
        actual_calc_output = actual_state_answers_calc_output.calculation_output

        # TODO(msl): Include answers that were never clicked and received 0
        # count from the calculation. This is useful to help creators identify
        # multiple choice options which might not be useful since learners
        # don't click on them.

        # Note that the expected answers are based on the order in which they
        # were submitted in order to resolve ties. These are the top 5 answers,
        # by submission frequency.
        expected_answer_counts = [{
            'answer': 'English',
            'frequency': 12
        }, {
            'answer': 'French',
            'frequency': 9
        }, {
            'answer': 'Finnish',
            'frequency': 7
        }, {
            'answer': 'Italian',
            'frequency': 4
        }, {
            'answer': 'Japanese',
            'frequency': 3
        }]

        # Ensure the expected answers and their frequencies match.
        self.assertItemsEqual(actual_calc_output, expected_answer_counts)

    def test_top5_answer_frequencies_calculation_with_less_than_5_answers(self):
        """Ensure the top 5 most frequent answers are submitted for TextInput,
        even if only one answer is actually submitted.
        """
        exp_id = '0'
        exp_version = 1
        state_name = 'What language'
        params = {}
        DEFAULT_RULE_STR = exp_domain.DEFAULT_RULESPEC_STR
        exp_services.load_demo(exp_id)

        answer = self._create_sample_answer('English', 2., 'sid1')
        stats_services.record_answer(
            exp_id, exp_version, state_name, 'test_handler',
            DEFAULT_RULE_STR, answer['session_id'],
            answer['time_spent_in_sec'], params,
            answer['answer_value'])

        # Retrieve state answers from storage and get corresponding
        # StateAnswers domain object.
        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        self.assertEquals(state_answers.interaction_id, 'TextInput')

        # Calculate answer counts. Input is dummy StateAnswersModel entity,
        # output is a list of dicts, each with keys 'answer' and 'frequency'.
        calculation_instance = (
            calculation_registry.Registry.get_calculation_by_id(
                'Top5AnswerFrequencies'))
        actual_state_answers_calc_output = (
            calculation_instance.calculate_from_state_answers_entity(
                state_answers))

        self.assertEquals(
            actual_state_answers_calc_output.calculation_id,
            'Top5AnswerFrequencies')
        actual_calc_output = actual_state_answers_calc_output.calculation_output

        # Note that the expected answers are based on the order in which they
        # were submitted in order to resolve ties. These are the top 5 answers,
        # by submission frequency.
        expected_answer_counts = [{
            'answer': 'English',
            'frequency': 1
        }]

        # Ensure the expected answers and their frequencies match.
        self.assertItemsEqual(actual_calc_output, expected_answer_counts)

    def test_frequency_commonly_submitted_elements_calculation(self):
        # TODO(msl): Implement this test.
        pass
