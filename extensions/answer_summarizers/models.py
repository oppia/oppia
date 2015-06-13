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
with keys 'id', 'options' and 'calculation_id'. An example for a single
visualization and calculation may look like this:

    answer_visualizations = [{
        'id': 'BarChart',
        'options': {
            'x_axis_label': 'Answer',
            'y_axis_label': 'Count',
        },
        'calculation_id': 'AnswerCounts',
    }]
"""


class BaseCalculation(object):
    """
    Base calculation class.

    This is the superclass for all calculations used to generate interaction
    answer views.
    """

    @property
    def id(self):
        return self.__class__.__name__

    def calculate_from_state_answers_entity(self, state_answers):
        """Perform calculation on a single StateAnswers entity. This is run
        in the context of a batch MapReduce job.

        This method must be overwritten in subclasses.
        """
        raise NotImplementedError(
            'Subclasses of BaseCalculation should implement the '
            'calculate_from_state_answers_entity(state_answers) method.')


class AnswerCounts(BaseCalculation):
    """Class for calculating answer counts, i.e. list of all answers
    showing how often each answer was given.
    """

    def calculate_from_state_answers_entity(self, state_answers):
        """Computes the number of occurrences of each answer, and returns a
        list of dicts; each dict has keys 'answer_value' and 'count'.

        This method is run from within the context of a MapReduce job.
        """

        answer_values = [answer_dict['answer_value'] for answer_dict 
                          in state_answers.answers_list]

        answer_counts_as_list_of_pairs = (
            collections.Counter(answer_values).items())

        calculation_output = []
        for item in answer_counts_as_list_of_pairs:
            calculation_output.append({
                'answer': item[0],
                'frequency': item[1],
            })
        
        return stats_domain.StateAnswersCalcOutput(
            state_answers.exploration_id,
            state_answers.exploration_version,
            state_answers.state_name,
            self.id,
            calculation_output)
