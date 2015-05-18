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

from core.domain import exp_services
from core.domain import stats_services
from core.tests import test_utils
from extensions.answer_summarizers import calculations
import feconf
import schema_utils
import utils



class InteractionAnswerViewCalculationsTest(test_utils.GenericTestBase):
    """Tests for ExpSummary aggregations."""

    def test_answer_counts_calc_without_job(self):
        """For multiple choice interaction, test if most common answers are
        calculated correctly for interaction answer views."""

        exp_id = '0'
        exp_version = 1
        state_name='Welcome!'
        params = {}
        exp_services.load_demo(exp_id)

        # Some answers
        dummy_answers_list = [
            {'answer_string': 'First choice', 'time_taken_to_answer': 4.,
            'session_id': 'sid1'},
            {'answer_string': 'Second choice', 'time_taken_to_answer': 5.,
            'session_id': 'sid1'},
            {'answer_string': 'Fourth choice', 'time_taken_to_answer': 2.5,
            'session_id': 'sid1'},
            {'answer_string': 'First choice', 'time_taken_to_answer': 10.,
            'session_id': 'sid2'},
            {'answer_string': 'First choice', 'time_taken_to_answer': 3.,
            'session_id': 'sid2'},
            {'answer_string': 'First choice', 'time_taken_to_answer': 1.,
            'session_id': 'sid2'},
            {'answer_string': 'Second choice', 'time_taken_to_answer': 20.,
            'session_id': 'sid2'},
            {'answer_string': 'First choice', 'time_taken_to_answer': 20.,
            'session_id': 'sid3'}
            ]

        # Record answers
        for answer in dummy_answers_list:
            stats_services.record_answer(
                exp_id, exp_version, state_name, 'test_handler',
                answer['session_id'], answer['time_taken_to_answer'],
                params, answer['answer_string'])

        # Retrieve state answers from storage and get corresponding
        # StateAnswers domain object.
        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        self.assertEquals(state_answers.interaction_id,
                          'MultipleChoiceInput')

        # Calculate answer counts. Input is dummy StateAnswersModel entity, 
        # output is List of pairs (values, frequencies). 
        actual_state_answers_calc_output = (
            calculations.AnswerCounts.calculate_from_state_answers_entity(
                state_answers))

        actual_calc_outputs = actual_state_answers_calc_output.calculation_outputs
        self.assertEquals(len(actual_calc_outputs), 1)
        self.assertEquals(actual_calc_outputs[0]['visualization_id'],
                          'values_and_counts_table')
        actual_answer_counts = actual_calc_outputs[0]['visualization_opts']['data']

        # Expected answer counts (result of calculation)
        # TODO(msl): Maybe include answers that were never clicked and got 0 count
        # (e.g. useful for multiple choice answers that are never clicked)
        expected_answer_counts = [('First choice', 5),
                                  ('Second choice', 2), 
                                  ('Fourth choice', 1)]

        # Check if actual and expected answer counts agree
        self.assertEquals(set(actual_answer_counts), 
                          set(expected_answer_counts))

