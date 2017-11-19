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

from core.domain import exp_domain
from core.domain import stats_domain


CLASSIFY_CATEGORIES = [
    exp_domain.EXPLICIT_CLASSIFICATION,
    exp_domain.TRAINING_DATA_CLASSIFICATION,
    exp_domain.STATISTICAL_CLASSIFICATION,
    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
]


class _HashedAnswerDict(object):
    """Wraps an arbitrarily-complex answer dict object into an object that can
    be hashed into built-in collections.
    """

    @classmethod
    def _get_hashable_value(cls, value):
        """This function returns a hashable version of the input value.

        It converts the built-in collections into their hashable counterparts
        {list: (tuple), set: (frozenset), dict: (sorted tuple of pairs)}.
        Additionally, their elements are converted to hashable values through
        recursive calls. All other values are assumed to already be hashable.
        """
        if isinstance(value, list):
            return tuple(cls._get_hashable_value(e) for e in value)
        elif isinstance(value, set):
            return frozenset(value)  # Set elements are always hashable.
        elif isinstance(value, dict):
            return tuple(sorted(
                # Dict keys already hashable, only values need converting.
                (k, cls._get_hashable_value(v)) for k, v in value.iteritems()))
        else:
            return value  # Any other type is assumed to already be hashable.

    def __init__(self, answer_dict):
        self.answer = answer_dict
        self.answer_hash = self._get_hashable_value(self.answer['answer'])

    def __hash__(self):
        return hash(self.answer_hash)

    def __eq__(self, other):
        if isinstance(other, _HashedAnswerDict):
            return self.answer_hash == other.answer_hash
        return False


def _calculate_top_answer_frequencies(answer_dicts_list, limit=None):
    """Computes the number of occurrences of each answer, keeping only the top
    limit answers.

    This method is run from within the context of a MapReduce job.

    Args:
        answer_dicts_list: list(dict(*)). Contains the answers to be counted.
        limit: int or None. The top number of results to keep.

    Returns:
        list(dict(str : *)). Where each dict has the keys:
            answer: *. One of the submitted answers.
            frequency: int. The number of occurrences of the answer.
    """
    hashed_answer_frequencies = (
        collections.Counter(_HashedAnswerDict(a) for a in answer_dicts_list))

    return [{'answer': h.answer['answer'], 'frequency': f}
            for h, f in hashed_answer_frequencies.most_common(limit)]


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
        calculation_output = _calculate_top_answer_frequencies(
            state_answers_dict['submitted_answer_list'])

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            calculation_output)


class Top5AnswerFrequencies(BaseCalculation):
    """Calculation for the top 5 answers, by frequency."""

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, keeping only the
        top 5 answers, and returns a list of dicts; each dict has keys 'answer'
        and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        calculation_output = _calculate_top_answer_frequencies(
            state_answers_dict['submitted_answer_list'], limit=5)

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            calculation_output)


class Top10AnswerFrequencies(BaseCalculation):
    """Calculation for the top 10 answers, by frequency."""

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each answer, keeping only the
        top 10 answers, and returns a list of dicts; each dict has keys 'answer'
        and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        calculation_output = _calculate_top_answer_frequencies(
            state_answers_dict['submitted_answer_list'], limit=10)

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            calculation_output)


class FrequencyCommonlySubmittedElements(BaseCalculation):
    """Calculation for determining the frequency of commonly submitted elements
    among multiple set answers (such as of type SetOfUnicodeString).
    """

    def calculate_from_state_answers_dict(self, state_answers_dict):
        """Computes the number of occurrences of each element across all given
        answers, keeping only the top 10 elements. Returns a list of dicts; each
        dict has keys 'element' and 'frequency'.

        This method is run from within the context of a MapReduce job.
        """
        calculation_output = _calculate_top_answer_frequencies(
            state_answers_dict['submitted_answer_list'], limit=10)
        for d in calculation_output:
            d['element'] = d.pop('answer')  # Rename answer to element.

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
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
        grouped_submitted_answer_dicts = itertools.groupby(
            state_answers_dict['submitted_answer_list'],
            lambda answer_dict: answer_dict['classification_categorization'])

        submitted_answers_by_categorization = collections.defaultdict(list)
        for category, answer_dicts in grouped_submitted_answer_dicts:
            if category in CLASSIFY_CATEGORIES:
                submitted_answers_by_categorization[category].extend(
                    answer_dicts)

        calculation_output = {
            category: _calculate_top_answer_frequencies(answer_dicts)
            for category, answer_dicts in
            submitted_answers_by_categorization.iteritems()
        }

        return stats_domain.StateAnswersCalcOutput(
            state_answers_dict['exploration_id'],
            state_answers_dict['exploration_version'],
            state_answers_dict['state_name'],
            state_answers_dict['interaction_id'],
            self.id,
            calculation_output)
