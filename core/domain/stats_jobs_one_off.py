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
import itertools

from core import jobs
from core.domain import exp_domain
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.platform import models

(exp_models, stats_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics
])


class RecomputeStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing creator statistics from the events
    in the datastore. Should only be run in events of data corruption.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateCompleteEventLogEntryModel,
                stats_models.AnswerSubmittedEventLogEntryModel,
                stats_models.StateHitEventLogEntryModel,
                stats_models.SolutionHitEventLogEntryModel,
                stats_models.ExplorationActualStartEventLogEntryModel,
                stats_models.CompleteExplorationEventLogEntryModel
               ]

    @staticmethod
    def map(item):
        if item.event_schema_version == 2:
            if isinstance(item, stats_models.StateCompleteEventLogEntryModel):
                yield (item.exp_id,
                       {
                           'type': 'state_complete',
                           'version': item.exp_version,
                           'state': item.state_name
                       })
            elif isinstance(
                    item, stats_models.AnswerSubmittedEventLogEntryModel):
                yield (item.exp_id,
                       {
                           'type': 'answer_submitted',
                           'version': item.exp_version,
                           'state': item.state_name,
                           'is_feedback_useful': item.is_feedback_useful
                       })
            elif isinstance(item, stats_models.StateHitEventLogEntryModel):
                yield (item.exploration_id,
                       {
                           'type': 'state_hit',
                           'version': item.exploration_version,
                           'state': item.state_name,
                           'session_id': item.session_id
                       })
            elif isinstance(item, stats_models.SolutionHitEventLogEntryModel):
                yield (item.exp_id,
                       {
                           'type': 'solution_hit',
                           'version': item.exp_version,
                           'state': item.state_name,
                           'session_id': item.session_id
                       })
            elif isinstance(
                    item,
                    stats_models.ExplorationActualStartEventLogEntryModel):
                yield (item.exp_id,
                       {
                           'type': 'exploration_actual_start',
                           'version': item.exp_version,
                           'state': item.state_name
                       })
            elif isinstance(
                    item, stats_models.CompleteExplorationEventLogEntryModel):
                yield (item.exploration_id,
                       {
                           'type': 'complete_exploration',
                           'version': item.exploration_version,
                           'state': item.state_name
                       })


    @staticmethod
    def reduce(key, values):
        values = map(ast.literal_eval, values)
        values = sorted(values, key=lambda x: x['version'])

        for version, events in itertools.groupby(values,
                                                 key=lambda x: x['version']):
            if version == 1:
                # Get a copy of the uncorrupted *_v1 statistics
                old_stats = stats_services.get_exploration_stats_by_id(
                    key, version)
                for state_stats in old_stats.state_stats_mapping.values():
                    state_stats.total_answers_count_v2 = 0
                    state_stats.useful_feedback_count_v2 = 0
                    state_stats.total_hit_count_v2 = 0
                    state_stats.first_hit_count_v2 = 0
                    state_stats.num_times_solution_viewed_v2 = 0
                    state_stats.num_completions_v2 = 0
                RecomputeStatistics._recompute_statistics(
                    key, version, events, old_stats)
            else:
                change_list = exp_models.ExplorationCommitLogEntryModel.get(
                    'exploration-%s-%s' % (key, version)).commit_cmds

                old_exp_version = version - 1
                exploration_stats = stats_services.get_exploration_stats_by_id(
                    key, old_exp_version)
                if exploration_stats is None:
                    raise ValueError('Recomputation of exploration with id'
                                     '%s for version %s failed'
                                     % (key, old_exp_version))
                exploration_stats = (
                    RecomputeStatistics._update_state_stats_mapping(
                        exploration_stats, change_list))

                RecomputeStatistics._recompute_statistics(
                    key, version, events, exploration_stats)

    @classmethod
    def _update_state_stats_mapping(cls, old_stats_model, change_list):
        """Update the state_stats_mapping to correspond with the changes
        in change_list.

        Args:
            old_stats_model: ExplorationStatsModel. The stats model
                for the previous verion.
            change_list: list(dict). A list of all of the commit cmds to
                the old_stats_model up to the next version.

        Returns:
            ExplorationStatsModel. An ExplorationStatsModel with updated
                state_stats_mapping and version.
        """
        # Handling state additions, deletions and renames.
        for change_dict in change_list:
            if change_dict['cmd'] == exp_domain.CMD_ADD_STATE:
                old_stats_model.state_stats_mapping[change_dict[
                    'state_name']] = (stats_domain.StateStats
                                      .create_default())
            elif change_dict['cmd'] == exp_domain.CMD_DELETE_STATE:
                old_stats_model.state_stats_mapping.pop(change_dict[
                    'state_name'])
            elif change_dict['cmd'] == exp_domain.CMD_RENAME_STATE:
                old_stats_model.state_stats_mapping[
                    change_dict['new_state_name']] = (
                        old_stats_model.state_stats_mapping.pop(
                            change_dict['old_state_name']))
        old_stats_model.exp_version += 1

        return old_stats_model

    @classmethod
    def _recompute_statistics(
            cls, exp_id, exp_version, events, old_stats_model):
        """Create a ExplorationStatsModel with the statistics from
        events added.

        Args:
            exp_id: str. The id of the exploration to recompute statistics for.
            exp_version. The version of the exploration.
            events: list(dict). A list of event data dicts from the datastore.
            stats_model: ExplorationStatsModel. The stats_model to recompute
                statistics for.
        """
        state_hit_ids, solution_hit_ids = set(), set()

        for event in events:
            state_stats = old_stats_model.state_stats_mapping[event['state']]
            if event['type'] == 'answer_submitted':
                state_stats.total_answers_count_v2 += 1
                if event['is_feedback_useful'] is True:
                    state_stats.useful_feedback_count_v2 += 1
            elif event['type'] == 'state_hit':
                state_stats.total_hit_count_v2 += 1
                if event['session_id'] not in state_hit_ids:
                    state_stats.first_hit_count_v2 += 1
                    state_hit_ids.add(event['session_id'])
            elif event['type'] == 'solution_hit':
                if event['session_id'] not in solution_hit_ids:
                    state_stats.num_times_solution_viewed_v2 += 1
                    solution_hit_ids.add(event['session_id'])
            elif event['type'] == 'exploration_actual_start':
                old_stats_model.num_actual_starts_v2 += 1
            elif event['type'] == 'complete_exploration':
                old_stats_model.num_completions_v2 += 1
            elif event['type'] == 'state_complete':
                state_stats.num_completions_v2 += 1

        for state, stats in old_stats_model.state_stats_mapping.iteritems():
            old_stats_model.state_stats_mapping[state] = stats.to_dict()

        stats_models.ExplorationStatsModel.create(
            exp_id=exp_id,
            exp_version=exp_version,
            num_starts_v1=old_stats_model.num_starts_v1,
            num_starts_v2=old_stats_model.num_starts_v2,
            num_actual_starts_v1=old_stats_model.num_actual_starts_v1,
            num_actual_starts_v2=old_stats_model.num_actual_starts_v2,
            num_completions_v1=old_stats_model.num_completions_v1,
            num_completions_v2=old_stats_model.num_completions_v2,
            state_stats_mapping=old_stats_model.state_stats_mapping)


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
