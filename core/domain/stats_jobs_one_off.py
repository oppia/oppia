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
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.platform import models

import feconf
import utils

(stats_models, exp_models) = models.Registry.import_models([
    models.NAMES.statistics, models.NAMES.exploration
])


class MigrateStatistics(jobs.BaseMapReduceOneOffJobManager):
    """A one-off migration of existing event model instance to generate
    ExplorationStatsModel instances for all existing explorations.
    """

    EVENT_TYPE_STATE_ANSWERS = 'state_answers'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.StartExplorationEventLogEntryModel,
            stats_models.CompleteExplorationEventLogEntryModel,
            stats_models.StateHitEventLogEntryModel,
            stats_models.StateAnswersModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: StartExplorationEventLogEntryModel,
                CompleteExplorationEventLogEntryModel,
                StateHitEventLogEntryModel or StateAnswersModel.

        Yields:
            tuple. For StartExplorationEventLogEntryModel and
                CompleteExplorationEventLogEntryModel, a 2-tuple of the form
                ((exp_id), value).
                The structure of 'value' is:
                    {
                        'event_type': str. Type of event.
                        'session_id': str. ID of the session.
                    }
            tuple. For StateHitEventLogEntryModel, a 2-tuple of the form
                ((exp_id), value).
                The structure of 'value' is:
                    {
                        'event_type': str. Type of event.
                        'version': str. Version of the exploration.
                        'state_name': str. Name of the state.
                        'session_id': str. ID of the session.
                        'created_on': How many milliseconds ago the event was
                            created.
                    }
            tuple. For StateAnswersModel, a 2-tuple of the form
                ((exp_id), value).
                The structure of 'value' is:
                    {
                        'event_type': str. Type of event.
                        'version': str. Version of the exploration.
                        'state_name': str. Name of the state.
                        'submitted_answer_list': List of submitted answers each
                            of which is stored as a JSON blob.
                    }
        """
        if isinstance(item, stats_models.StartExplorationEventLogEntryModel):
            yield(
                item.exploration_id,
                {'event_type': feconf.EVENT_TYPE_START_EXPLORATION})

        elif isinstance(
                item, stats_models.CompleteExplorationEventLogEntryModel):
            yield(
                item.exploration_id,
                {
                    'event_type': feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
                    'session_id': item.session_id
                })

        elif isinstance(item, stats_models.StateHitEventLogEntryModel):
            value = {
                'event_type': feconf.EVENT_TYPE_STATE_HIT,
                'version': item.exploration_version,
                'state_name': item.state_name,
                'session_id': item.session_id,
                'created_on': utils.get_time_in_millisecs(item.created_on)
            }
            yield(item.exploration_id, value)

        else:
            value = {
                'event_type': MigrateStatistics.EVENT_TYPE_STATE_ANSWERS,
                'version': item.exploration_version,
                'state_name': item.state_name,
                'submitted_answer_list': item.submitted_answer_list
            }
            yield(item.exploration_id, value)

    @staticmethod
    def reduce(key, stringified_values):
        num_starts = 0
        num_completions = 0

        exp_id = key
        exploration = exp_services.get_exploration_by_id(exp_id)
        latest_exp_version = exploration.version

        values_state_hit = []
        values_state_answer = []
        completed_session_ids = []
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)

            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                num_starts += 1
            elif value['event_type'] == feconf.EVENT_TYPE_COMPLETE_EXPLORATION:
                num_completions += 1
                completed_session_ids.append(value['session_id'])
            elif value['event_type'] == feconf.EVENT_TYPE_STATE_HIT:
                values_state_hit.append(value)
            elif value['event_type'] == (
                    MigrateStatistics.EVENT_TYPE_STATE_ANSWERS):
                values_state_answer.append(value)

        state_stats_mapping = {}
        values_state_hit = sorted(values_state_hit, key=lambda k: k[
            'created_on'])
        for version in range(1, latest_exp_version+1):
            values_state_hit_versioned = [
                val for val in values_state_hit if val['version'] == version]
            values_state_answer_versioned = [
                val for val in values_state_answer if val['version'] == version]
            exploration_versioned = exp_services.get_exploration_by_id(
                exp_id, version)

            if version == 1:
                for state_name in exploration_versioned.states:
                    state_stats_mapping[state_name] = (
                        stats_domain.StateStats.create_default())
            else:
                exp_commit_log = exp_models.ExplorationCommitLogEntryModel.get(
                    'exploration-%s-%s' % (exp_id, version))
                change_list = exp_commit_log.commit_cmds

                # Handling state additions, renames and deletions.
                for change_dict in change_list:
                    if change_dict['cmd'] == exp_domain.CMD_ADD_STATE:
                        state_stats_mapping[change_dict['state_name']] = (
                            stats_domain.StateStats.create_default())
                    elif change_dict['cmd'] == exp_domain.CMD_DELETE_STATE:
                        state_stats_mapping.pop(change_dict['state_name'])
                    elif change_dict['cmd'] == exp_domain.CMD_RENAME_STATE:
                        state_stats_mapping[change_dict['new_state_name']] = (
                            state_stats_mapping.pop(
                                change_dict['old_state_name']))

            state_session_ids = {
                state_name: [] for state_name in exploration_versioned.states
            }
            session_ids_set = set()
            # Compute total_hit_count and first_hit_count for the states.
            for value in values_state_hit_versioned:
                state_name = value['state_name']
                state_stats_mapping[state_name].total_hit_count += 1
                if value['session_id'] not in state_session_ids[state_name]:
                    state_stats_mapping[state_name].first_hit_count += 1
                    state_session_ids[state_name].append(value['session_id'])
                    session_ids_set.add(value['session_id'])

            # Compute num_completions for the states.
            for session_id in session_ids_set:
                values_state_hit_sessioned = [
                    val for val in values_state_hit_versioned if val[
                        'session_id'] == session_id]
                # All states in the above list except the last element (only if
                # complete exploration event doesn't exist for the session ID)
                # are counted as completed because they are ordered by their
                # timestamp.
                if session_id not in completed_session_ids:
                    for value in values_state_hit_sessioned[:-1]:
                        state_stats_mapping[value[
                            'state_name']].num_completions += 1
                else:
                    for value in values_state_hit_sessioned:
                        state_stats_mapping[value[
                            'state_name']].num_completions += 1

            # Compute total_answers_count and useful_feedback_count.
            for value in values_state_answer_versioned:
                for answer in value['submitted_answer_list']:
                    state_stats_mapping[value[
                        'state_name']].total_answers_count += 1
                    if answer['classification_categorization'] != (
                            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION):
                        state_stats_mapping[value[
                            'state_name']].useful_feedback_count += 1

        # Now that the stats for the complete exploration are computed,
        # calculate num_actual_starts.
        num_actual_starts = state_stats_mapping[
            exploration.states[
                exploration.init_state_name].interaction.answer_groups[
                    0].outcome.dest].first_hit_count

        # Create the ExplorationStatsModel instance.
        exploration_stats = stats_domain.ExplorationStats(
            exp_id, latest_exp_version, num_starts, num_actual_starts,
            num_completions, state_stats_mapping)
        stats_services.create_stats_model(exploration_stats)


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
