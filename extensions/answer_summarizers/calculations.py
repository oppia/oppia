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

"""Classes for calculations to get interaction answer views."""

__author__ = 'Marcel Schmittfull'

from collections import Counter
import copy
import os

from core.domain import stats_domain
import feconf
import schema_utils
import utils


"""
Calculations performed on recorded state answers.

NOTE TO DEVELOPERS: Calculations desired for an interaction named
<INTERACTION_NAME> need to be registered in

    extensions.interactions.<INTERACTION_NAME>.<INTERACTION_NAME>
    .registered_state_answers_calculations
"""

class BaseCalculation(object):
    """
    Base calculation class.

    This is the superclass for all calculations used to generate interaction
    answer views.
    """

    # These values should be overridden in subclasses.
    name = ''
    description = ''
    allowed_input_interactions = []

    @staticmethod
    def calculate_from_state_answers_entity(state_answers):
        """
        Perform calculation on a single StateAnswers entity. 
        This must be overwritten in subclasses.
        """
        raise NotImplementedError(
            'Subclasses of BaseCalculation should implement the '
            'calculate_from_state_answers_entity(state_answers) method.')


class AnswerCounts(BaseCalculation):
    """
    Class for calculating answer counts, i.e. list of all answers
    showing how often each answer was given.
    """

    name = 'Answer counts'
    description = 'Calculate answer counts for each answer option.'

    @staticmethod
    def calculate_from_state_answers_entity(state_answers):
        """
        Calculate answer counts from a single StateAnswers entity.
        Return list of pairs (answer_string, count).
        """

        answer_strings = [answer_dict['answer_string'] for answer_dict 
                          in state_answers.answers_list]

        answer_counts_as_list_of_pairs = Counter(answer_strings).items()

        calc_outputs = []
        calc_outputs.append(
            {'visualization_id': 'values_and_counts_table',
             'visualization_opts': {'data': answer_counts_as_list_of_pairs,
                                    'title': 'Answer counts',
                                    'column_labels': ['Answer', 'Count']}
             })
        
        # get StateAnswersCalcOutput instance
        state_answers_calc_output = stats_domain.StateAnswersCalcOutput(
            state_answers.exploration_id, state_answers.exploration_version,
            state_answers.state_name, calc_outputs)

        return state_answers_calc_output
