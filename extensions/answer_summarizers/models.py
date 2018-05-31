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

This is a list of visualizations, each of which is specified by a dict with keys
'id', 'options' and 'calculation_id'. An example for a single visualization and
calculation may look like this:

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
import itertools
import operator

from core.domain import exp_domain
from core.domain import stats_domain
import feconf
import utils

CLASSIFICATION_CATEGORIES = frozenset([
    exp_domain.EXPLICIT_CLASSIFICATION,
    exp_domain.TRAINING_DATA_CLASSIFICATION,
    exp_domain.STATISTICAL_CLASSIFICATION,
    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
])

UNRESOLVED_ANSWER_CLASSIFICATION_CATEGORIES = frozenset([
    exp_domain.STATISTICAL_CLASSIFICATION,
    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
])


class _HashableAnswer(object):
    """Wraps answer with object that can be placed into sets and dicts."""

    def __init__(self, answer):
        self.answer = answer
        self.hashable_answer = utils.get_hashable_value(answer)

    def __hash__(self):
        return hash(self.hashable_answer)

    def __eq__(self, other):
        if isinstance(other, _HashableAnswer):
            return self.hashable_answer == other.hashable_answer
        return False


def _get_top_answers_by_frequency(answers, limit=None):
    """Computes the number of occurrences of each answer, keeping only the top
    limit answers, and returns an AnswerFrequencyList.

    This method is run from within the context of a MapReduce job.

    Args:
        answers: iterable(*). The collection of answers to be tallied.
        limit: int or None. The maximum number of answers to return. When None,
            all answers are returned.

    Returns:
        stats_domain.AnswerFrequencyList. A list of the top "limit" answers.
    """
    answer_counter = utils.OrderedCounter(_HashableAnswer(a) for a in answers)
    return stats_domain.AnswerFrequencyList([
        stats_domain.AnswerOccurrence(hashable_answer.answer, frequency)
        for hashable_answer, frequency in answer_counter.most_common(limit)
    ])


def _get_top_unresolved_answers_by_frequency(
        answers_with_classification, limit=None):
    hashable_answers_with_classification = [{
        'hashable_answer': _HashableAnswer(ans['answer']),
        'classification_categorization': ans['classification_categorization']
    } for ans in answers_with_classification]

    classification_results_dict = {}
    for ans in hashable_answers_with_classification:
        frequency = 0
        if ans['hashable_answer'] in classification_results_dict:
            frequency = classification_results_dict[ans['hashable_answer']][
                'frequency']
        classification_results_dict[ans['hashable_answer']] = {
            'classification_categorization': (
                ans['classification_categorization']),
            'frequency': frequency + 1
        }

    answers_with_most_recent_classification = [{
        'answer': ans.answer,
        'classification_categorization': val['classification_categorization'],
        'frequency': val['frequency']
    } for ans, val in classification_results_dict.iteritems()]

    grouped_hashable_answers = itertools.groupby(
        answers_with_most_recent_classification,
        operator.itemgetter('classification_categorization'))

    unresolved_answers_with_frequency_list = []
    for category, answers in grouped_hashable_answers:
        if category in UNRESOLVED_ANSWER_CLASSIFICATION_CATEGORIES:
            unresolved_answers_with_frequency_list.extend({
                'answer': ans['answer'],
                'frequency': ans['frequency']
            } for ans in answers)

    unresolved_answers_with_frequency_list.sort(
        key=lambda x: x['frequency'], reverse=True)

    return stats_domain.AnswerFrequencyList([
        stats_domain.AnswerOccurrence(item['answer'], item['frequency'])
        for item in unresolved_answers_with_frequency_list[:limit]
    ])


class BaseCalculation(object):
    """Base calculation class.

    This is the superclass for all calculations used to generate interaction
    answer views.
    """

    @property
    def id(self):
        return self.__class__.__name__

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Perform calculation on a single StateAnswers entity. This is run in
        the context of a batch MapReduce job.

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
        """Computes the number of occurrences of each answer, and returns a list
        of dicts; each dict has keys 'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        answer_dicts = state_answers_dict['submitted_answer_list']
        answer_frequency_list = (
            _get_top_answers_by_frequency(d['answer'] for d in answer_dicts))
        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            answer_frequency_list)


class Top5AnswerFrequencies(BaseCalculation):
    """Calculation for the top 5 answers, by frequency."""

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, keeping only the
        top 5 answers, and returns a list of dicts; each dict has keys 'answer'
        and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        answer_dicts = state_answers_dict['submitted_answer_list']
        answer_frequency_list = _get_top_answers_by_frequency(
            (d['answer'] for d in answer_dicts), limit=5)
        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            answer_frequency_list)


class Top10AnswerFrequencies(BaseCalculation):
    """Calculation for the top 10 answers, by frequency."""

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, keeping only the
        top 10 answers, and returns a list of dicts; each dict has keys 'answer'
        and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        answer_dicts = state_answers_dict['submitted_answer_list']
        answer_frequency_list = _get_top_answers_by_frequency(
            (d['answer'] for d in answer_dicts), limit=10)
        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            answer_frequency_list)


class FrequencyCommonlySubmittedElements(BaseCalculation):
    """Calculation for determining the frequency of commonly submitted
    individual answers among multiple set answers (such as of type
    SetOfUnicodeString).
    """

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each individual answer across
        all given answer sets, keeping only the top 10. Returns a list of dicts;
        each dict has keys 'answer' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        answer_dicts = state_answers_dict['submitted_answer_list']
        answer_frequency_list = _get_top_answers_by_frequency(
            itertools.chain.from_iterable(d['answer'] for d in answer_dicts),
            limit=10)
        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            answer_frequency_list)


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
        grouped_submitted_answer_dicts = itertools.groupby(
            state_answers_dict['submitted_answer_list'],
            operator.itemgetter('classification_categorization'))
        submitted_answers_by_categorization = collections.defaultdict(list)
        for category, answer_dicts in grouped_submitted_answer_dicts:
            if category in CLASSIFICATION_CATEGORIES:
                submitted_answers_by_categorization[category].extend(
                    d['answer'] for d in answer_dicts)

        categorized_answer_frequency_lists = (
            stats_domain.CategorizedAnswerFrequencyLists({
                category: _get_top_answers_by_frequency(categorized_answers)
                for category, categorized_answers in
                submitted_answers_by_categorization.iteritems()}))
        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            categorized_answer_frequency_lists)


class TopNUnresolvedAnswersByFrequency(BaseCalculation):
    """Calculation for the top unresolved answers by frequency
    The output from this calculation is a ranked list of unresolved answers, by
    frequency.
    """

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Filters unresolved answers and then computes the number of
        occurrences of each unresolved answers.

        This method is run within the context of MapReduce job.

        Args:
            state_answers_dict: dict. A dict containing state answers and
                exploration information.

        Returns:
            stats_domain.StateAnswersCalcOutput. A calculation output
                domain object.
        """
        answers_with_classification = [{
            'answer': ans['answer'],
            'classification_categorization': (
                ans['classification_categorization'])
        } for ans in state_answers_dict['submitted_answer_list']]

        unresolved_answers = _get_top_unresolved_answers_by_frequency(
            answers_with_classification,
            limit=feconf.TOP_UNRESOLVED_ANSWERS_LIMIT)

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            unresolved_answers)
