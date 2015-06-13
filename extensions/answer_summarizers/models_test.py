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


class InteractionAnswerSummariesCalculationsTest(test_utils.GenericTestBase):
    """Tests for ExpSummary aggregations."""

    def test_answer_counts_calc_without_job(self):
        """For multiple choice interaction, test if most common answers are
        calculated correctly for interaction answer views."""

        exp_id = '0'
        exp_version = 1
        state_name = 'Welcome!'
        params = {}
        DEFAULT_RULESPEC = exp_domain.RuleSpec.get_default_rule_spec(
            'dummy_state_name', 'NormalizedString')
        exp_services.load_demo(exp_id)

        # Some answers
        dummy_answers_list = [
            {'answer_value': 'First choice', 'time_spent_in_sec': 4.,
            'session_id': 'sid1'},
            {'answer_value': 'Second choice', 'time_spent_in_sec': 5.,
            'session_id': 'sid1'},
            {'answer_value': 'Fourth choice', 'time_spent_in_sec': 2.5,
            'session_id': 'sid1'},
            {'answer_value': 'First choice', 'time_spent_in_sec': 10.,
            'session_id': 'sid2'},
            {'answer_value': 'First choice', 'time_spent_in_sec': 3.,
            'session_id': 'sid2'},
            {'answer_value': 'First choice', 'time_spent_in_sec': 1.,
            'session_id': 'sid2'},
            {'answer_value': 'Second choice', 'time_spent_in_sec': 20.,
            'session_id': 'sid2'},
            {'answer_value': 'First choice', 'time_spent_in_sec': 20.,
            'session_id': 'sid3'}
            ]

        # Record answers
        for answer in dummy_answers_list:
            stats_services.record_answer(
                exp_id, exp_version, state_name, 'test_handler', 
                DEFAULT_RULESPEC, answer['session_id'], 
                answer['time_spent_in_sec'], params, 
                answer['answer_value'])

        # Retrieve state answers from storage and get corresponding
        # StateAnswers domain object.
        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        self.assertEquals(
            state_answers.interaction_id, 'MultipleChoiceInput')

        # Calculate answer counts. Input is dummy StateAnswersModel entity, 
        # output is a list of dicts, each with keys 'answer' and 'frequency'.
        calculation_instance = (
            calculation_registry.Registry.get_calculation_by_id(
                'AnswerCounts'))
        actual_state_answers_calc_output = (
            calculation_instance.calculate_from_state_answers_entity(
                state_answers))

        self.assertEquals(
            actual_state_answers_calc_output.calculation_id, 'AnswerCounts')
        actual_calc_output = actual_state_answers_calc_output.calculation_output

        # Expected answer counts (result of calculation)
        # TODO(msl): Maybe include answers that were never clicked and got 0 count
        # (e.g. useful for multiple choice answers that are never clicked)
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

        # Check if actual and expected answer counts agree
        self.assertItemsEqual(
            actual_calc_output, expected_answer_counts)
