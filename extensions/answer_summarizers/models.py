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

"""Classes for calculations to get interaction answer views.

Calculations are performed on recorded state answers.

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
        'calculation_id': 'AnswerFrequencies',
    }]
"""

import collections

from core.domain import exp_domain
from core.domain import stats_domain


def _get_hashable_value(value):
    """This function returns a hashable version of the input value. If the
    value itself is hashable, it simply returns that value. If it's a list, it
    will return a tuple with all of the list's elements converted to hashable
    types. If it's a dictionary, it will first convert it to a list of pairs,
    where the key and value of the pair are converted to hashable types, then
    it will convert this list as any other list would be converted.
    """
    if isinstance(value, list):
        # Avoid needlessly wrapping a single value in a tuple.
        if len(value) == 1:
            return _get_hashable_value(value[0])
        return tuple([_get_hashable_value(elem) for elem in value])
    elif isinstance(value, dict):
        return _get_hashable_value(
            sorted([
                (_get_hashable_value(key), _get_hashable_value(val))
                for (key, val) in value.iteritems()]))
    else:
        return value


def _count_answers(answer_dicts_list):
    """Count an input list of answer objects using collections.Counter. This
    returns a list of pairs with the first element being an answer object and
    the second being the number of times it shows up in the input list.
    """
    hashable_answer_values = [
        _get_hashable_value(answer_dict['answer'])
        for answer_dict in answer_dicts_list]
    answer_frequencies = collections.Counter(hashable_answer_values)
    return [
        ([answer_dicts_list[idx]
          for idx, val in enumerate(hashable_answer_values)
          if val == hashable_answer][0], frequency)
        for (hashable_answer, frequency) in answer_frequencies.most_common()]


def _calculate_top_answer_frequencies(state_answers_dict, num_results):
    """Computes the number of occurrences of each answer, keeping only the top
    num_results answers, and returns a list of dicts; each dict has keys
    'answer' and 'frequency'.

    This method is run from within the context of a MapReduce job.
    """
    top_answer_counts_as_list_of_pairs = _count_answers(
        state_answers_dict['submitted_answer_list'])[:num_results]

    calculation_output = []
    for item in top_answer_counts_as_list_of_pairs:
        calculation_output.append({
            'answer': item[0]['answer'],
            'frequency': item[1],
        })

    return calculation_output


class BaseCalculation(object):
    """
    Base calculation class.

    This is the superclass for all calculations used to generate interaction
    answer views.
    """

    @property
    def id(self):
        return self.__class__.__name__

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Perform calculation on a single StateAnswers entity. This is run
        in the context of a batch MapReduce job.

        This method must be overwritten in subclasses.
        """
        raise NotImplementedError(
            'Subclasses of BaseCalculation should implement the '
            'calculate_from_state_answers_dict(state_answers_dict) method.')


class AnswerFrequencies(BaseCalculation):
    """Calculation for answers' frequencies (how often each answer was
    submitted).
    """
    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, and returns a
        list of dicts; each dict has keys 'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        answer_counts_as_list_of_pairs = _count_answers(
            state_answers_dict['submitted_answer_list'])

        calculation_output = []
        for item in answer_counts_as_list_of_pairs:
            calculation_output.append({
                'answer': item[0]['answer'],
                'frequency': item[1],
            })

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            self.id,
            calculation_output)


class Top5AnswerFrequencies(BaseCalculation):
    """Calculation for the top 5 answers, by frequency."""

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, keeping only
        the top 5 answers, and returns a list of dicts; each dict has keys
        'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        calculation_output = _calculate_top_answer_frequencies(
            state_answers_dict, 5)

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            self.id,
            calculation_output)


class Top10AnswerFrequencies(BaseCalculation):
    """Calculation for the top 10 answers, by frequency."""

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, keeping only
        the top 10 answers, and returns a list of dicts; each dict has keys
        'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        calculation_output = _calculate_top_answer_frequencies(
            state_answers_dict, 10)

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            self.id,
            calculation_output)


class FrequencyCommonlySubmittedElements(BaseCalculation):
    """Calculation for determining the frequency of commonly submitted elements
    among multiple set answers (such as of type SetOfUnicodeString).
    """

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each element across
        all given answers, keeping only the top 10 elements. Returns a
        list of dicts; each dict has keys 'element' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        answer_values = [
            answer_dict['answer']
            for answer_dict in state_answers_dict['submitted_answer_list']]

        list_of_all_elements = []
        for set_value in answer_values:
            list_of_all_elements += set_value

        elements_as_list_of_pairs = sorted(
            collections.Counter(list_of_all_elements).items(),
            key=lambda x: x[1],
            reverse=True)
        # Keep only top 10 elements
        if len(elements_as_list_of_pairs) > 10:
            elements_as_list_of_pairs = elements_as_list_of_pairs[:10]

        calculation_output = []
        for item in elements_as_list_of_pairs:
            # Save element with key 'answer' so it gets displayed correctly
            # by FrequencyTable visualization.
            calculation_output.append({
                'answer': item[0],
                'frequency': item[1],
            })

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            self.id,
            calculation_output)


class TopAnswersByCategorization(BaseCalculation):
    """Calculation for the top answers by both frequency and respective
    categorizations. The output from this calculation is one list for each
    classification category, where each list is a ranked list of answers, by
    frequency.
    """
    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, split into groups
        based on the number of classification categories.

        This method is run from within the context of a MapReduce job.
        """
        classify_categories = [
            exp_domain.EXPLICIT_CLASSIFICATION,
            exp_domain.TRAINING_DATA_CLASSIFICATION,
            exp_domain.STATISTICAL_CLASSIFICATION,
            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION
        ]

        submitted_answer_list = state_answers_dict['submitted_answer_list']
        submitted_answers_by_categorization = {
            classify_category: [
                submitted_answer_dict
                for submitted_answer_dict in submitted_answer_list
                if submitted_answer_dict['classification_categorization'] == (
                    classify_category)]
            for classify_category in classify_categories
        }
        top_answer_count_pairs_by_category = {
            classify_category: _count_answers(answers)
            for classify_category, answers
            in submitted_answers_by_categorization.iteritems()
        }

        calculation_output = {
            classify_category: []
            for classify_category in classify_categories
        }
        for classify_category, top_answer_counts_as_list_of_pairs in (
                top_answer_count_pairs_by_category.iteritems()):
            for item in top_answer_counts_as_list_of_pairs:
                answer_dict = item[0]
                calculation_output[classify_category].append({
                    'answer': answer_dict['answer'],
                    'frequency': item[1]
                })

        # Remove empty lists if no answers match within those categories.
        for classify_category in classify_categories:
            if not calculation_output[classify_category]:
                del calculation_output[classify_category]

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            self.id,
            calculation_output)
