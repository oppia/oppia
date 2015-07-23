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
        list of dicts; each dict has keys 'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """

        # The words 'counts' and 'frequency' are used interchangeably and
        # have the same meaning, referring to how often some answer was given.
        # TODO(msl): Only use frequency everywhere to be more consistent?

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


class Top5AnswerCounts(BaseCalculation):
    """Class for calculating answer counts for top 5 answers.
    """

    def calculate_from_state_answers_entity(self, state_answers):
        """Computes the number of occurrences of each answer, keeping only 
        the top 5 answers, and returns a list of dicts; each dict has keys
        'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """

        answer_values = [answer_dict['answer_value'] for answer_dict 
                          in state_answers.answers_list]

        top_5_answer_counts_as_list_of_pairs = (
            sorted(collections.Counter(answer_values).items(),
                   key=lambda x: x[1],
                   reverse=True)[:5])
        
        calculation_output = []
        for item in top_5_answer_counts_as_list_of_pairs:
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

class FrequencyCommonlySubmittedElements(BaseCalculation):
    """Class for calculating commonly submitted elements of answers that
    are sets.
    """

    def calculate_from_state_answers_entity(self, state_answers):
        """Computes the number of occurrences of each element across
        all given answers, keeping only the top 10 elements. Returns a 
        list of dicts; each dict has keys 'element' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """

        # get a list of sets
        answer_values = [answer_dict['answer_value'] for answer_dict 
                          in state_answers.answers_list]

        # convert to a list of all elements
        list_of_all_elements = [item 
                                 for myset in answer_values 
                                 for item in myset]

        # Get top 10 elements
        top_10_elements_as_list_of_pairs = (
            sorted(collections.Counter(list_of_all_elements).items(),
                   key=lambda x: x[1],
                   reverse=True)[:10])
        
        calculation_output = []
        for item in top_10_elements_as_list_of_pairs:
            calculation_output.append({
                'element': item[0],
                'frequency': item[1],
            })
        
        return stats_domain.StateAnswersCalcOutput(
            state_answers.exploration_id,
            state_answers.exploration_version,
            state_answers.state_name,
            self.id,
            calculation_output)

