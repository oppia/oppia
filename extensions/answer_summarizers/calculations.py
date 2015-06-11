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

import collections
import copy
import os

from core.domain import stats_domain
import feconf
import schema_utils
import utils


"""
Calculations performed on recorded state answers.

NOTE TO DEVELOPERS: To specify calculations desired for an interaction named
<INTERACTION_NAME>, edit

    extensions.interactions.<INTERACTION_NAME>.answer_visualizations

This is a list of visualizations, each of which is specified by a dict
with keys 'visualization_id', 'visualization_customization_args' and 
'data_source'. The value of 'data_source' should be a dict that specifies a
calculation_id. An example for a single visualization and calculation may look
like this:

    answer_visualizations = [{
        'visualization_id': 'BarChart',
        'visualization_customization_args': {
            'x_axis_label': 'Answer',
            'y_axis_label': 'Count',
        },
        'data_source': {
            'calculation_id': calculations.AnswerCounts.calculation_id,
        }}]
"""


class BaseCalculation(object):
    """
    Base calculation class.

    This is the superclass for all calculations used to generate interaction
    answer views.
    """

    # These values should be overridden in subclasses.
    calculation_id = 'BaseCalculation'
    description = 'Base calculation overwritten by specific calculations.'

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

    calculation_id = 'AnswerCounts'
    description = 'Calculate answer counts for each answer.'

    @staticmethod
    def calculate_from_state_answers_entity(state_answers):
        """
        Calculate answer counts from a single StateAnswers entity.
        Return list of pairs (answer_value, count).
        """

        answer_values = [answer_dict['answer_value'] for answer_dict 
                          in state_answers.answers_list]

        answer_counts_as_list_of_pairs = (
            collections.Counter(answer_values).items())

        calc_output = {'data': answer_counts_as_list_of_pairs,
                       'calculation_description': AnswerCounts.description}
        
        # get StateAnswersCalcOutput instance
        state_answers_calc_output = stats_domain.StateAnswersCalcOutput(
            state_answers.exploration_id, state_answers.exploration_version,
            state_answers.state_name, AnswerCounts.calculation_id, calc_output)

        return state_answers_calc_output


# List of all calculation classes. Do not include BaseCalculation.
LIST_OF_CALCULATION_CLASSES = [AnswerCounts]

