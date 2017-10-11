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

"""Jobs for statistics views."""

import ast
import collections

from core import jobs
from core.domain import stats_jobs_continuous
from core.platform import models

(stats_models,) = models.Registry.import_models([
    models.NAMES.statistics
])


class RecomputeStateCompleteStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing the statistics for the
    StateCompleteEvent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateCompleteEventLogEntryModel]

    @staticmethod
    def map(item):
        yield ((item.exp_id, item.exp_version, item.state_name),
               1)

    @staticmethod
    def reduce(key, values):
        key = ast.literal_eval(key)
        num_completions = len(values)
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            key[0], key[1])
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[key[2]]
        state_stats['num_completions'] = num_completions
        model.state_stats_mapping[key[2]] = state_stats
        model.put()


class RecomputeAnswerSubmittedStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing the statistics for the
    AnswerSubmittedEvent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.AnswerSubmittedEventLogEntryModel]

    @staticmethod
    def map(item):
        yield ((item.exp_id, item.exp_version, item.state_name),
               item.is_feedback_useful)

    @staticmethod
    def reduce(key, values):
        key = ast.literal_eval(key)
        total_answers_count = len(values)
        useful_feedback_count = sum([1 for useful_feedback in values
                                     if useful_feedback == 'True'])

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            key[0], key[1])
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[key[2]]
        state_stats['total_answers_count'] = total_answers_count
        state_stats['useful_feedback_count'] = useful_feedback_count
        model.state_stats_mapping[key[2]] = state_stats
        model.put()


class RecomputeStateHitStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing the statistics for the
    StateHitEvent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateHitEventLogEntryModel]

    @staticmethod
    def map(item):
        yield ((item.exploration_id, item.exploration_version, item.state_name),
               item.session_id)

    @staticmethod
    def reduce(key, values):
        key = ast.literal_eval(key)
        total_hit_count = len(values)
        # Only count the first session in which a user submits
        # the correct answer.
        first_hit_count = 0
        for idx, session_id in enumerate(values):
            if idx == values.index(session_id):
                first_hit_count += 1


        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            key[0], key[1])
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[key[2]]
        state_stats['total_hit_count'] = total_hit_count
        state_stats['first_hit_count'] = first_hit_count
        model.state_stats_mapping[key[2]] = state_stats
        model.put()


class RecomputeSolutionHitStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing the statistics for the
    SolutionHitEvent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.SolutionHitEventLogEntryModel]

    @staticmethod
    def map(item):
        yield ((item.exp_id, item.exp_version, item.state_name),
               item.session_id)

    @staticmethod
    def reduce(key, values):
        key = ast.literal_eval(key)
        # Only count the first session in which a user triggers
        # the solution.
        solution_triggered = 0
        for idx, event in enumerate(values):
            if idx == values.index(event):
                solution_triggered += 1

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            key[0], key[1])
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[key[2]]
        state_stats['num_times_solution_viewed'] = solution_triggered
        model.state_stats_mapping[key[2]] = state_stats
        model.put()


class RecomputeActualStartStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing the statistics for the
    ExplorationActualStartEvent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.ExplorationActualStartEventLogEntryModel]

    @staticmethod
    def map(item):
        yield ((item.exp_id, item.exp_version),
               1)

    @staticmethod
    def reduce(key, values):
        key = ast.literal_eval(key)
        num_actual_starts = len(values)
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            key[0], key[1])
        model = stats_models.ExplorationStatsModel.get(model_id)
        model.num_actual_starts = num_actual_starts
        model.put()


class RecomputeCompleteEventStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing the statistics for the
    CompleteExplorationEvent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.CompleteExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        yield ((item.exploration_id, item.exploration_version),
               1)

    @staticmethod
    def reduce(key, values):
        key = ast.literal_eval(key)
        num_completions = len(values)
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            key[0], key[1])
        model = stats_models.ExplorationStatsModel.get(model_id)
        model.num_completions = num_completions
        model.put()


class StatisticsAudit(jobs.BaseMapReduceOneOffJobManager):
    """A one-off statistics audit.

    Performs a brief audit of exploration completions and state hit counts to
    make sure they match counts stored in StateCounterModel. It also checks for
    some possible error cases like negative counts.
    """
    _STATE_COUNTER_ERROR_KEY = 'State Counter ERROR'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.ExplorationAnnotationsModel,
            stats_models.StateCounterModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: ExplorationAnnotationsModel or
                StateCounterModel.

        Yields:
            tuple. For StateCounterModel, a 2-tuple in the form
                (_STATE_COUNTER_ERROR_KEY, error message).
            tuple. For ExplorationAnnotationModel, a 2-tuple in the form
                ('exploration_id', value).
                'exploration_id': str. the id of the exploration.
                'value': a dict, whose structure is as follows:
                    {
                        'version': str. version of the exploration.
                        'starts': int. # of times exploration was started.
                        'completions': int. # of times exploration was
                            completed.
                        'state_hit': a dict containing the hit counts for the
                            states in the exploration. It is formatted as
                            follows:
                            {
                                state_name: {
                                    'first_entry_count': int. # of sessions
                                        which hit this state.
                                    'total_entry_count': int. # of total hits
                                        for this state.
                                    'no_answer_count': int. # of hits with no
                                        answer for this state.
                                }
                            }
                    }
        """
        if isinstance(item, stats_models.StateCounterModel):
            if item.first_entry_count < 0:
                yield (
                    StatisticsAudit._STATE_COUNTER_ERROR_KEY,
                    'Less than 0: %s %d' % (item.key, item.first_entry_count))
            return
        # Older versions of ExplorationAnnotations didn't store exp_id
        # This is short hand for making sure we get ones updated most recently
        else:
            if item.exploration_id is not None:
                yield (item.exploration_id, {
                    'version': item.version,
                    'starts': item.num_starts,
                    'completions': item.num_completions,
                    'state_hit': item.state_hit_counts
                })

    @staticmethod
    def reduce(key, stringified_values):
        """Updates statistics for the given exploration.

        Args:
            key: str. The id of the exploration.
            stringified_values: list(str). A list of stringified values
                associated with the given key. An element of stringified_values
                would be of the form:
                    {
                        'version': str. version of the exploration.
                        'starts': int. # of times exploration was started.
                        'completions': int. # of times exploration was
                            completed.
                        'state_hit': dict. a dict containing the hit counts
                            for the states in the exploration. It is formatted
                            as follows:
                            {
                                state_name: {
                                    'first_entry_count': int. # of sessions
                                        which hit this state.
                                    'total_entry_count': int. # of total
                                        hits for this state.
                                    'no_answer_count': int. # of hits with
                                        no answer for this state.
                                }
                            }
                    }

        Yields:
            tuple(str). A 1-tuple whose only element is an error message.
        """
        if key == StatisticsAudit._STATE_COUNTER_ERROR_KEY:
            for value_str in stringified_values:
                yield (value_str,)
            return

        # If the code reaches this point, we are looking at values that
        # correspond to each version of a particular exploration.

        # These variables correspond to the VERSION_ALL version.
        all_starts = 0
        all_completions = 0
        all_state_hit = collections.defaultdict(int)

        # These variables correspond to the sum of counts for all other
        # versions besides VERSION_ALL.
        sum_starts = 0
        sum_completions = 0
        sum_state_hit = collections.defaultdict(int)

        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['starts'] < 0:
                yield (
                    'Negative start count: exp_id:%s version:%s starts:%s' %
                    (key, value['version'], value['starts']),)

            if value['completions'] < 0:
                yield (
                    'Negative completion count: exp_id:%s version:%s '
                    'completions:%s' %
                    (key, value['version'], value['completions']),)

            if value['completions'] > value['starts']:
                yield ('Completions > starts: exp_id:%s version:%s %s>%s' % (
                    key, value['version'], value['completions'],
                    value['starts']),)

            if value['version'] == stats_jobs_continuous.VERSION_ALL:
                all_starts = value['starts']
                all_completions = value['completions']
                for (state_name, counts) in value['state_hit'].iteritems():
                    all_state_hit[state_name] = counts['first_entry_count']
            else:
                sum_starts += value['starts']
                sum_completions += value['completions']
                for (state_name, counts) in value['state_hit'].iteritems():
                    sum_state_hit[state_name] += counts['first_entry_count']

        if sum_starts != all_starts:
            yield (
                'Non-all != all for starts: exp_id:%s sum: %s all: %s'
                % (key, sum_starts, all_starts),)
        if sum_completions != all_completions:
            yield (
                'Non-all != all for completions: exp_id:%s sum: %s all: %s'
                % (key, sum_completions, all_completions),)

        for state_name in all_state_hit:
            if (state_name not in sum_state_hit and
                    all_state_hit[state_name] != 0):
                yield (
                    'state hit count not same exp_id:%s state:%s, '
                    'all:%s sum: null' % (
                        key, state_name, all_state_hit[state_name]),)
            elif all_state_hit[state_name] != sum_state_hit[state_name]:
                yield (
                    'state hit count not same exp_id: %s state: %s '
                    'all: %s sum:%s' % (
                        key, state_name, all_state_hit[state_name],
                        sum_state_hit[state_name]),)
