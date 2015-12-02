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
                exp_id, exp_version, state_name, DEFAULT_RULE_STR,
                answer['session_id'], answer['time_spent_in_sec'], params,
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
        # different answers with varying frequency:
        #   English (12 times), French (9), Finnish (7), Italian (4),
        #   Spanish (3), Japanese (3), Hungarian (2), Portuguese (1),
        #   German (1), and Gaelic (1).
        # Note that there are some ties here, including on the border of the
        # top 5 most frequent answers.
        all_answer_lists = {
            'english': self._create_sample_answers(
                'English', [1., 2., 3.], ['sid1', 'sid2', 'sid3', 'sid4'], 12),
            'french': self._create_sample_answers(
                'French', [4., 5., 6.], ['sid2', 'sid3', 'sid5'], 9),
            'finnish': self._create_sample_answers(
                'Finnish', [7., 8., 9.], ['sid1', 'sid3', 'sid5', 'sid6'], 7),
            'italian': self._create_sample_answers(
                'Italian', [1., 4., 7.], ['sid1', 'sid6'], 4),
            'spanish': self._create_sample_answers(
                'Spanish', [2., 5., 8.], ['sid3'], 3),
            'japanese': self._create_sample_answers(
                'Japanese', [3., 6., 9.], ['sid1', 'sid2'], 3),
            'hungarian': self._create_sample_answers(
                'Hungarian', [1., 5.], ['sid6', 'sid7'], 2),
            'portuguese': self._create_sample_answers(
                'Portuguese', [5.], ['sid1'], 1),
            'german': self._create_sample_answers('German', [4.], ['sid7'], 1),
            'gaelic': self._create_sample_answers('Gaelic', [7.], ['sid8'], 1)
        }

        # This is a combined list of answers generated above. This list is a
        # special selection of answers from the generated lists such that
        # answers are submitted in varying orders and times.
        answer_submission_queue = [
            all_answer_lists['french'][0],
            all_answer_lists['finnish'][4],
            all_answer_lists['english'][11],
            all_answer_lists['japanese'][0],
            all_answer_lists['english'][0],
            all_answer_lists['italian'][1],
            all_answer_lists['french'][8],
            all_answer_lists['spanish'][0],
            all_answer_lists['english'][3],
            all_answer_lists['finnish'][6],
            all_answer_lists['portuguese'][0],
            all_answer_lists['japanese'][2],
            all_answer_lists['italian'][3],
            all_answer_lists['english'][9],
            all_answer_lists['french'][6],
            all_answer_lists['french'][1],
            all_answer_lists['finnish'][1],
            all_answer_lists['english'][2],
            all_answer_lists['french'][7],
            all_answer_lists['italian'][2],
            all_answer_lists['english'][4],
            all_answer_lists['finnish'][2],
            all_answer_lists['gaelic'][0],
            all_answer_lists['japanese'][1],
            all_answer_lists['french'][4],
            all_answer_lists['finnish'][0],
            all_answer_lists['french'][5],
            all_answer_lists['english'][7],
            all_answer_lists['german'][0],
            all_answer_lists['finnish'][5],
            all_answer_lists['hungarian'][0],
            all_answer_lists['french'][2],
            all_answer_lists['finnish'][3],
            all_answer_lists['english'][5],
            all_answer_lists['spanish'][2],
            all_answer_lists['english'][1],
            all_answer_lists['english'][6],
            all_answer_lists['english'][8],
            all_answer_lists['italian'][0],
            all_answer_lists['english'][10],
            all_answer_lists['french'][3],
            all_answer_lists['spanish'][1],
            all_answer_lists['hungarian'][1]
        ]

        # Ensure the submission queue includes all of the answers from the
        # generated answer lists. This protects further changes to the test.
        total_answer_count = sum([
            len(all_answer_lists[list_name])
            for list_name in all_answer_lists])
        self.assertEquals(total_answer_count, len(answer_submission_queue))

        # Verify the frequencies of answers in the submission queue. This is
        # another quick check to protect changes to this test.
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'English']), 12)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'French']), 9)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Finnish']), 7)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Italian']), 4)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Spanish']), 3)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Japanese']), 3)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Hungarian']), 2)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Portuguese']), 1)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'German']), 1)
        self.assertEquals(len([
            answer_submission
            for answer_submission in answer_submission_queue
            if answer_submission['answer_value'] == 'Gaelic']), 1)

        # Finally, verify that all of the answers in the answer lists are
        # represents in the submission queue (in case another answer is added to
        # the answer list but not added to the queue).
        self.assertEquals(len(set([
            answer_submission['answer_value']
            for answer_submission in answer_submission_queue])), 10)

        # Record answers.
        for answer in answer_submission_queue:
            stats_services.record_answer(
                exp_id, exp_version, state_name, DEFAULT_RULE_STR,
                answer['session_id'], answer['time_spent_in_sec'], params,
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
        """Verify the top 5 answer frequencies calculation still works if only
        one answer is submitted.
        """
        exp_id = '0'
        exp_version = 1
        state_name = 'What language'
        params = {}
        DEFAULT_RULE_STR = exp_domain.DEFAULT_RULESPEC_STR
        exp_services.load_demo(exp_id)

        answer = self._create_sample_answer('English', 2., 'sid1')
        stats_services.record_answer(
            exp_id, exp_version, state_name, DEFAULT_RULE_STR,
            answer['session_id'], answer['time_spent_in_sec'], params,
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

        expected_answer_counts = [{
            'answer': 'English',
            'frequency': 1
        }]

        # Ensure the expected answers and their frequencies match.
        self.assertItemsEqual(actual_calc_output, expected_answer_counts)

    def test_frequency_commonly_submitted_elements_calculation(self):
        # TODO(msl): Implement this test.
        pass
