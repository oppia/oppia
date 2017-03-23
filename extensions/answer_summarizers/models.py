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
            [(_get_hashable_value(key), _get_hashable_value(value))
             for (key, value) in value.iteritems()])
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
        top_5_answer_counts_as_list_of_pairs = (
            _count_answers(state_answers_dict['submitted_answer_list'])[:5])

        calculation_output = []
        for item in top_5_answer_counts_as_list_of_pairs:
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
        # Get a list of stringified sets, e.g. [u"[u'abc', u'www']",
        # u"[u'abc']", u"[u'xyz']", u"[u'xyz', u'abc']"]
        answer_values = [
            answer_dict['answer']
            for answer_dict in state_answers_dict['submitted_answer_list']]

        # For each stringified set, replace '[' and ']' by empty string,
        # and split at commas ', ' to convert string to set.
        # TODO(msl): This will yield wrong results if answers contain ',',
        # '[', or ']'. Consider saving sets instead of stringified sets.
        # TODO(bhenning): Remove this string parsing in favor of directly
        # working with the set itself, rather than a stringified representation
        # of it.
        list_of_all_elements = []
        for setstring in answer_values:
            elts_this_set = (
                setstring.replace('[', '').replace(']', '').split(', '))
            list_of_all_elements += elts_this_set

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
        top_answer_counts_as_list_of_pairs = _count_answers(
            state_answers_dict['submitted_answer_list'])

        calculation_output = {
            exp_domain.EXPLICIT_CLASSIFICATION: [],
            exp_domain.TRAINING_DATA_CLASSIFICATION: [],
            exp_domain.STATISTICAL_CLASSIFICATION: [],
            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION: [],
        }
        for item in top_answer_counts_as_list_of_pairs:
            answer_dict = item[0]
            classify_category = answer_dict['classification_categorization']
            if classify_category not in calculation_output:
                raise Exception(
                    'Cannot aggregate answer with unknown rule classification '
                    'category: %s' % classify_category)
            calculation_output[classify_category].append({
                'answer': answer_dict['answer'],
                'frequency': item[1]
            })

        # Remove empty lists if no answers match within those categories.
        if not calculation_output[exp_domain.EXPLICIT_CLASSIFICATION]:
            del calculation_output[exp_domain.EXPLICIT_CLASSIFICATION]
        if not calculation_output[exp_domain.TRAINING_DATA_CLASSIFICATION]:
            del calculation_output[exp_domain.TRAINING_DATA_CLASSIFICATION]
        if not calculation_output[exp_domain.STATISTICAL_CLASSIFICATION]:
            del calculation_output[exp_domain.STATISTICAL_CLASSIFICATION]
        if not calculation_output[exp_domain.DEFAULT_OUTCOME_CLASSIFICATION]:
            del calculation_output[exp_domain.DEFAULT_OUTCOME_CLASSIFICATION]

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            self.id,
            calculation_output)
