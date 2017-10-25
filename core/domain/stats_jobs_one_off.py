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
from core.platform import models

import feconf
import utils

(stats_models, exp_models) = models.Registry.import_models([
    models.NAMES.statistics, models.NAMES.exploration
])


class GenerateV1StatisticsJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off migration of existing event model instances to generate
    ExplorationStatsModel instances for all existing explorations. This job
    will handle only event models with event schema version 1. This job will
    exclusively update only the *_v1 fields of the analytics model so that
    future re-computation would not be needed.
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
                (exp_id, value).
                The structure of 'value' is:
                    {
                        'event_type': str. Type of event.
                        'session_id': str. ID of the session.
                    }
            tuple. For StateHitEventLogEntryModel, a 2-tuple of the form
                (exp_id, value).
                The structure of 'value' is:
                    {
                        'event_type': str. Type of event.
                        'version': str. Version of the exploration.
                        'state_name': str. Name of the state.
                        'session_id': str. ID of the session.
                        'created_on': milliseconds since Epoch.
                    }
            tuple. For StateAnswersModel, a 2-tuple of the form
                (exp_id, value).
                The structure of 'value' is:
                    {
                        'event_type': str. Type of event.
                        'version': str. Version of the exploration.
                        'state_name': str. Name of the state.
                        'total_answers_count': int. Total number of answers for
                            the state.
                        'useful_feedback_count': int. Total number of answers
                            for the state that received useful feedback.
                    }
        """
        if isinstance(item, stats_models.StartExplorationEventLogEntryModel):
            yield (item.exploration_id, {
                'event_type': feconf.EVENT_TYPE_START_EXPLORATION,
                'version': item.exploration_version
            })

        elif isinstance(
                item, stats_models.CompleteExplorationEventLogEntryModel):
            yield (item.exploration_id, {
                'event_type': feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
                'version': item.exploration_version,
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
            yield (item.exploration_id, value)

        else:
            total_answers_count = len(item.submitted_answer_list)
            useful_feedback_count = 0
            for answer in item.submitted_answer_list:
                if answer['classification_categorization'] != (
                        exp_domain.DEFAULT_OUTCOME_CLASSIFICATION):
                    useful_feedback_count += 1
            value = {
                'event_type': GenerateV1StatisticsJob.EVENT_TYPE_STATE_ANSWERS,
                'version': item.exploration_version,
                'state_name': item.state_name,
                'total_answers_count': total_answers_count,
                'useful_feedback_count': useful_feedback_count
            }
            yield (item.exploration_id, value)

    @staticmethod
    def reduce(exp_id, stringified_values):
        num_starts = 0
        num_completions = 0
        num_actual_starts = 0

        exploration = exp_services.get_exploration_by_id(exp_id)
        latest_exp_version = exploration.version

        # The list of exploration start counts mapped by version.
        start_exploration_counts_by_version = {}
        # The list of exploration complete counts mapped by version.
        complete_exploration_counts_by_version = {}
        # The list of state hit events mapped by version.
        state_hit_events_by_version = {}
        # The list of state answers mapped by events.
        state_answer_events_by_version = {}
        # The list of session_ids of learners completing an exploration.
        completed_session_ids = []
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)

            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                if str(value['version']) not in (
                        start_exploration_counts_by_version):
                    start_exploration_counts_by_version[
                        str(value['version'])] = 0
                start_exploration_counts_by_version[str(value['version'])] += 1
            elif value['event_type'] == feconf.EVENT_TYPE_COMPLETE_EXPLORATION:
                if str(value['version']) not in (
                        complete_exploration_counts_by_version):
                    complete_exploration_counts_by_version[
                        str(value['version'])] = 0
                complete_exploration_counts_by_version[
                    str(value['version'])] += 1
                completed_session_ids.append(value['session_id'])
            elif value['event_type'] == feconf.EVENT_TYPE_STATE_HIT:
                if str(value['version']) not in state_hit_events_by_version:
                    state_hit_events_by_version[str(value['version'])] = []
                state_hit_events_by_version[str(value['version'])].append(value)
            elif value['event_type'] == (
                    GenerateV1StatisticsJob.EVENT_TYPE_STATE_ANSWERS):
                if str(value['version']) not in state_answer_events_by_version:
                    state_answer_events_by_version[str(value['version'])] = []
                state_answer_events_by_version[str(value['version'])].append(
                    value)

        # This dict will store the cumulative values of state stats from version
        # 1 till the latest version of an exploration.
        state_stats_mapping = {}
        # This list will contain all the ExplorationStats domain objects for
        # each version.
        exploration_stats_list = []
        for version in range(1, latest_exp_version + 1):
            state_hit_events_for_this_version = []
            if str(version) in state_hit_events_by_version:
                state_hit_events_for_this_version = (
                    state_hit_events_by_version[str(version)])
            # Sort list of state hit events in increasing order of timestamp.
            state_hit_events_for_this_version = sorted(
                state_hit_events_for_this_version, key=lambda e: e[
                    'created_on'])
            state_answer_events_for_this_version = []
            if str(version) in state_answer_events_by_version:
                state_answer_events_for_this_version = (
                    state_answer_events_by_version[str(version)])
            versioned_exploration = exp_services.get_exploration_by_id(
                exp_id, version=version)

            revert_to_version = None
            if version == 1:
                # Create default state stats mapping for the first version.
                for state_name in versioned_exploration.states:
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
                    elif change_dict['cmd'] == 'AUTO_revert_version_number':
                        revert_to_version = change_dict['version_number']

            # Handling exploration reverts.
            if revert_to_version:
                old_exploration_stats = exploration_stats_list[
                    revert_to_version - 1]
                num_starts = old_exploration_stats['num_starts_v1']
                num_completions = old_exploration_stats['num_completions_v1']
                num_actual_starts = old_exploration_stats[
                    'num_actual_starts_v1']
                state_stats_mapping = {
                    state_name: stats_domain.StateStats.from_dict(
                        old_exploration_stats['state_stats_mapping'][
                            state_name])
                    for state_name in old_exploration_stats[
                        'state_stats_mapping']
                }

            # Computing num_starts and num_completions.
            if str(version) in start_exploration_counts_by_version:
                num_starts += start_exploration_counts_by_version[str(version)]
            if str(version) in complete_exploration_counts_by_version:
                num_completions += complete_exploration_counts_by_version[
                    str(version)]
            # Dict mapping each session ID to the list of state hit events for
            # that session.
            state_hit_events_session_id_mapping = {}
            # Dict mapping each state name of the exploration and the list of
            # unique session IDs that have entered that state.
            state_session_ids = {
                state_name: set() for state_name in versioned_exploration.states
            }
            session_ids_set = set()
            # Compute total_hit_count and first_hit_count for the states.
            for state_hit_event in state_hit_events_for_this_version:
                state_name = state_hit_event['state_name']
                state_stats_mapping[state_name].total_hit_count_v1 += 1
                if state_hit_event['session_id'] not in state_session_ids[
                        state_name]:
                    state_stats_mapping[state_name].first_hit_count_v1 += 1
                    state_session_ids[state_name].add(state_hit_event[
                        'session_id'])
                    session_ids_set.add(state_hit_event['session_id'])
                if state_hit_event['session_id'] not in (
                        state_hit_events_session_id_mapping):
                    state_hit_events_session_id_mapping[state_hit_event[
                        'session_id']] = []
                state_hit_events_session_id_mapping[state_hit_event[
                    'session_id']].append(state_hit_event)

            # Compute num_completions for the states.
            for session_id in session_ids_set:
                state_hit_event_dicts_sessioned = (
                    state_hit_events_session_id_mapping[session_id])
                # All state hit events in the above list are ordered by their
                # timestamp. This implies that the last state hit event is the
                # state at which the learner quit the exploration (This is only
                # True if the last state hit event is not the terminal state).
                # So, if the last state is not the terminal state, we increment
                # num_completions for all states except the last state.
                # Otherwise, we increment num_completions for all the states.
                for state_hit_event in state_hit_event_dicts_sessioned[:-1]:
                    state_stats_mapping[state_hit_event[
                        'state_name']].num_completions_v1 += 1
                if session_id in completed_session_ids:
                    state_stats_mapping[state_hit_event_dicts_sessioned[-1][
                        'state_name']].num_completions_v1 += 1

            # Compute total_answers_count and useful_feedback_count.
            for value in state_answer_events_for_this_version:
                state_stats_mapping[value[
                    'state_name']].total_answers_count_v1 += value[
                        'total_answers_count']
                state_stats_mapping[value[
                    'state_name']].useful_feedback_count_v1 += value[
                        'useful_feedback_count']

            # Now that the stats for the exploration's version are computed,
            # calculate num_actual_starts. To compute this, we take the max of
            # the first hit counts of all states that the initial state leads
            # to. The max is taken instead of sum because the sum of
            # first_hit_counts will sometimes end up counting a single learner
            # twice. The max of both first hit counts ensures that we are
            # counting only unique learners who traversed past the initial
            # state.
            init_state = versioned_exploration.states[
                versioned_exploration.init_state_name]
            max_first_hit_from_init_state = max([
                state_stats_mapping[
                    answer_group.outcome.dest].first_hit_count_v1
                for answer_group in init_state.interaction.answer_groups if (
                    answer_group.outcome.dest != (
                        versioned_exploration.init_state_name))] or [0])
            # If the exploration has only one state, then the number of actual
            # starts will be equal to the number of starts.
            if len(versioned_exploration.states) == 1:
                num_actual_starts = num_starts
            else:
                num_actual_starts = max_first_hit_from_init_state

            # Check if model already exists. If it does, update it, otherwise
            # create a fresh ExplorationStatsModel instance.
            exploration_stats_model = (
                stats_models.ExplorationStatsModel.get_model(exp_id, version))
            if exploration_stats_model is not None:
                exploration_stats = stats_domain.ExplorationStats(
                    exp_id, version, num_starts,
                    exploration_stats_model.num_starts_v2, num_actual_starts,
                    exploration_stats_model.num_actual_starts_v2,
                    num_completions, exploration_stats_model.num_completions_v2,
                    state_stats_mapping)
            else:
                exploration_stats = stats_domain.ExplorationStats(
                    exp_id, version, num_starts, 0, num_actual_starts, 0,
                    num_completions, 0, state_stats_mapping)
            exploration_stats_list.append(exploration_stats.to_dict())

        # Save all the ExplorationStats models to storage.
        stats_models.ExplorationStatsModel.create_multi(exploration_stats_list)


class StatisticsAuditV1(jobs.BaseMapReduceOneOffJobManager):
    """A one-off statistics audit.

    Performs a brief audit of exploration stats values to ensure that they
    maintain simple sanity checks like being non-negative and so on.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.ExplorationStatsModel]

    @classmethod
    def require_non_negative(
            cls, exp_id, exp_version, property_name, value, state_name=None):
        state_name = state_name if state_name else ''
        if value[property_name] < 0:
            yield (
                'Negative count: exp_id:%s version:%s state:%s %s:%s' % (
                    exp_id, exp_version, property_name, state_name, value))

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item. ExplorationStatsModel.

        Yields:
            tuple. For ExplorationStatsModel, a 2-tuple of the form
                (exp_id, value) where value is of the form:
                    {
                        'version': int. Version of the exploration.
                        'num_starts_v1': int. # of times exploration was
                            started.
                        'num_completions_v1': int. # of times exploration was
                            completed.
                        'num_actual_starts_v1': int. # of times exploration was
                            actually started.
                        'state_stats_mapping': A dict containing the values of
                            stats for the states of the exploration. It is
                            formatted as follows:
                            {
                                state_name: {
                                    'total_answers_count_v1',
                                    'useful_feedback_count_v1',
                                    'total_hit_count_v1',
                                    'first_hit_count_v1',
                                    'num_completions_v1'
                                }
                            }
                    }
        """
        reduced_state_stats_mapping = {
            state_name: {
                'total_answers_count_v1': item.state_stats_mapping[state_name][
                    'total_answers_count_v1'],
                'useful_feedback_count_v1': item.state_stats_mapping[
                    state_name]['useful_feedback_count_v1'],
                'total_hit_count_v1': item.state_stats_mapping[state_name][
                    'total_hit_count_v1'],
                'first_hit_count_v1': item.state_stats_mapping[state_name][
                    'first_hit_count_v1'],
                'num_completions_v1': item.state_stats_mapping[state_name][
                    'num_completions_v1']
            } for state_name in item.state_stats_mapping
        }

        yield (item.exp_id, {
            'exp_version': item.exp_version,
            'num_starts_v1': item.num_starts_v1,
            'num_completions_v1': item.num_completions_v1,
            'num_actual_starts_v1': item.num_actual_starts_v1,
            'state_stats_mapping': reduced_state_stats_mapping
        })

    @staticmethod
    def reduce(exp_id, stringified_values):
        for exp_stats in stringified_values:
            exp_stats = ast.literal_eval(exp_stats)
            exp_version = exp_stats['exp_version']

            num_starts_v1 = exp_stats['num_starts_v1']
            num_completions_v1 = exp_stats['num_completions_v1'],
            num_actual_starts_v1 = exp_stats['num_actual_starts_v1']

            StatisticsAuditV1.require_non_negative(
                exp_id, exp_version, 'num_starts_v1', num_starts_v1)
            StatisticsAuditV1.require_non_negative(
                exp_id, exp_version, 'num_completions_v1', num_completions_v1)
            StatisticsAuditV1.require_non_negative(
                exp_id, exp_version, 'num_actual_starts_v1',
                num_actual_starts_v1)

            # Number of starts must never be less than the number of
            # completions.
            if num_starts_v1 < num_completions_v1:
                yield ('Completions > starts: exp_id:%s version:%s %s > %s' % (
                    exp_id, exp_version, num_completions_v1, num_starts_v1),)

            # Number of actual starts must never be less than the number of
            # completions.
            if num_actual_starts_v1 < num_completions_v1:
                yield (
                    'Completions > actual starts: exp_id:%s '
                    'version:%s %s > %s' % (
                        exp_id, exp_version, num_completions_v1,
                        num_actual_starts_v1),)

            # Number of starts must never be less than the number of actual
            # starts.
            if num_starts_v1 < num_actual_starts_v1:
                yield (
                    'Actual starts > starts: exp_id:%s '
                    'version:%s %s > %s' % (
                        exp_id, exp_version, num_actual_starts_v1,
                        num_starts_v1),)

            for state_name in exp_stats['state_stats_mapping']:
                state_stats = exp_stats['state_stats_mapping'][state_name]

                total_answers_count_v1 = state_stats['total_answers_count_v1']
                useful_feedback_count_v1 = state_stats[
                    'useful_feedback_count_v1']
                total_hit_count_v1 = state_stats['total_hit_count_v1']
                first_hit_count_v1 = state_stats['first_hit_count_v1']
                num_completions_v1 = state_stats['num_completions_v1']

                StatisticsAuditV1.require_non_negative(
                    exp_id, exp_version, 'total_answers_count_v1',
                    total_answers_count_v1, state_name)
                StatisticsAuditV1.require_non_negative(
                    exp_id, exp_version, 'useful_feedback_count_v1',
                    useful_feedback_count_v1, state_name)
                StatisticsAuditV1.require_non_negative(
                    exp_id, exp_version, 'total_hit_count_v1',
                    total_hit_count_v1, state_name)
                StatisticsAuditV1.require_non_negative(
                    exp_id, exp_version, 'first_hit_count_v1',
                    first_hit_count_v1, state_name)
                StatisticsAuditV1.require_non_negative(
                    exp_id, exp_version, 'num_completions_v1',
                    num_completions_v1, state_name)

                # The total number of answers submitted can never be less than
                # the number of submitted answers for which useful feedback was
                # given.
                if total_answers_count_v1 < useful_feedback_count_v1:
                    yield (
                        'Total answers < Answers with useful feedback: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name,
                            total_answers_count_v1, useful_feedback_count_v1),)

                # The total hit count for a state can never be less than the
                # number of times the state was hit for the first time.
                if total_hit_count_v1 < first_hit_count_v1:
                    yield (
                        'Total state hits < First state hits: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name, total_hit_count_v1,
                            first_hit_count_v1),)

                # The total hit count for a state can never be less than the
                # total number of times the state was completed.
                if total_hit_count_v1 < num_completions_v1:
                    yield (
                        'Total state hits < Total state completions: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name, total_hit_count_v1,
                            num_completions_v1),)


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
