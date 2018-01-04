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

"""Jobs for statistics views."""

import ast
import collections
import copy
import datetime

import feconf
import utils


from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.platform import models

(exp_models, stats_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics
])


class RecomputeStatisticsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
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
        if item.event_schema_version != 2:
            return
        if isinstance(item, stats_models.StateCompleteEventLogEntryModel):
            yield (item.exp_id,
                   {
                       'event_type': feconf.EVENT_TYPE_STATE_COMPLETED,
                       'version': item.exp_version,
                       'state_name': item.state_name
                   })
        elif isinstance(
                item, stats_models.AnswerSubmittedEventLogEntryModel):
            yield (item.exp_id,
                   {
                       'event_type': feconf.EVENT_TYPE_ANSWER_SUBMITTED,
                       'version': item.exp_version,
                       'state_name': item.state_name,
                       'is_feedback_useful': item.is_feedback_useful
                   })
        elif isinstance(item, stats_models.StateHitEventLogEntryModel):
            yield (item.exploration_id,
                   {
                       'event_type': feconf.EVENT_TYPE_STATE_HIT,
                       'version': item.exploration_version,
                       'state_name': item.state_name,
                       'session_id': item.session_id
                   })
        elif isinstance(item, stats_models.SolutionHitEventLogEntryModel):
            yield (item.exp_id,
                   {
                       'event_type': feconf.EVENT_TYPE_SOLUTION_HIT,
                       'version': item.exp_version,
                       'state_name': item.state_name,
                       'session_id': item.session_id
                   })
        elif isinstance(
                item, stats_models.ExplorationActualStartEventLogEntryModel):
            yield (item.exp_id,
                   {
                       'event_type': feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION,
                       'version': item.exp_version,
                       'state_name': item.state_name
                   })
        elif isinstance(
                item, stats_models.CompleteExplorationEventLogEntryModel):
            yield (item.exploration_id,
                   {
                       'event_type': feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
                       'version': item.exploration_version,
                       'state_name': item.state_name
                   })

    @staticmethod
    def reduce(exp_id, values):
        values = map(ast.literal_eval, values)
        sorted_events_dicts = sorted(values, key=lambda x: x['version'])

        # Find the latest version number
        exploration = exp_services.get_exploration_by_id(exp_id)
        latest_exp_version = exploration.version
        versions = range(1, latest_exp_version + 1)

        # Get a copy of the corrupted statistics models to copy uncorrupted
        # v1 fields
        old_stats = stats_services.get_multiple_exploration_stats_by_version(
            exp_id, versions)
        # Get list of snapshot models for each version of the exploration
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exp_id, versions))

        exp_stats_dicts = []
        event_dict_idx = 0
        event_dict = sorted_events_dicts[event_dict_idx]
        for version in versions:
            datastore_stats_for_version = old_stats[version-1]
            if version == 1:
                # Reset the possibly corrupted stats
                datastore_stats_for_version.num_starts_v2 = 0
                datastore_stats_for_version.num_completions_v2 = 0
                datastore_stats_for_version.num_actual_starts_v2 = 0
                for state_stats in (datastore_stats_for_version.
                                    state_stats_mapping.values()):
                    state_stats.total_answers_count_v2 = 0
                    state_stats.useful_feedback_count_v2 = 0
                    state_stats.total_hit_count_v2 = 0
                    state_stats.first_hit_count_v2 = 0
                    state_stats.num_times_solution_viewed_v2 = 0
                    state_stats.num_completions_v2 = 0
                exp_stats_dict = datastore_stats_for_version.to_dict()
            else:
                change_list = snapshots_by_version[version - 1]['commit_cmds']
                # Copy recomputed v2 events from previous version
                prev_stats_dict = copy.deepcopy(exp_stats_dicts[-1])
                prev_stats_dict = (
                    RecomputeStatisticsOneOffJob._apply_state_name_changes(
                        prev_stats_dict, change_list))
                # Copy uncorrupt v1 stats
                prev_stats_dict['num_starts_v1'] = (
                    datastore_stats_for_version.num_starts_v1)
                prev_stats_dict['num_completions_v1'] = (
                    datastore_stats_for_version.num_completions_v1)
                prev_stats_dict['num_actual_starts_v1'] = (
                    datastore_stats_for_version.num_actual_starts_v1)
                state_stats_mapping = prev_stats_dict['state_stats_mapping']
                for state in state_stats_mapping:
                    state_stats_mapping[state]['total_answers_count_v1'] = (
                        datastore_stats_for_version.state_stats_mapping[state]
                        .total_answers_count_v1)
                    state_stats_mapping[state]['useful_feedback_count_v1'] = (
                        datastore_stats_for_version.state_stats_mapping[state]
                        .useful_feedback_count_v1)
                    state_stats_mapping[state]['total_hit_count_v1'] = (
                        datastore_stats_for_version.state_stats_mapping[state]
                        .total_hit_count_v1)
                    state_stats_mapping[state]['first_hit_count_v1'] = (
                        datastore_stats_for_version.state_stats_mapping[state]
                        .first_hit_count_v1)
                    state_stats_mapping[state]['num_completions_v1'] = (
                        datastore_stats_for_version.state_stats_mapping[state]
                        .num_completions_v1)
                exp_stats_dict = copy.deepcopy(prev_stats_dict)

            # Compute the statistics for events corresponding to this version
            state_hit_session_ids, solution_hit_session_ids = set(), set()
            while event_dict['version'] == version:
                state_stats = (exp_stats_dict['state_stats_mapping'][
                    event_dict['state_name']])
                if event_dict['event_type'] == (
                        feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION):
                    exp_stats_dict['num_actual_starts_v2'] += 1
                elif event_dict['event_type'] == (
                        feconf.EVENT_TYPE_COMPLETE_EXPLORATION):
                    exp_stats_dict['num_completions_v2'] += 1
                elif event_dict['event_type'] == (
                        feconf.EVENT_TYPE_ANSWER_SUBMITTED):
                    state_stats['total_answers_count_v2'] += 1
                    if event_dict['is_feedback_useful']:
                        state_stats['useful_feedback_count_v2'] += 1
                elif event_dict['event_type'] == feconf.EVENT_TYPE_STATE_HIT:
                    state_stats['total_hit_count_v2'] += 1
                    state_hit_key = (
                        event_dict['session_id'] + event_dict['state_name'])
                    if state_hit_key not in state_hit_session_ids:
                        state_stats['first_hit_count_v2'] += 1
                        state_hit_session_ids.add(state_hit_key)
                elif event_dict['event_type'] == feconf.EVENT_TYPE_SOLUTION_HIT:
                    solution_hit_key = (
                        event_dict['session_id'] + event_dict['state_name'])
                    if solution_hit_key not in solution_hit_session_ids:
                        state_stats['num_times_solution_viewed_v2'] += 1
                        solution_hit_session_ids.add(solution_hit_key)
                elif event_dict['event_type'] == (
                        feconf.EVENT_TYPE_STATE_COMPLETED):
                    state_stats['num_completions_v2'] += 1
                event_dict_idx += 1
                if event_dict_idx < len(sorted_events_dicts):
                    event_dict = sorted_events_dicts[event_dict_idx]
                else:
                    break

            exp_stats_dicts.append(copy.deepcopy(exp_stats_dict))
        stats_models.ExplorationStatsModel.save_multi(exp_stats_dicts)

    @classmethod
    def _apply_state_name_changes(cls, prev_stats_dict, change_list):
        """Update the state_stats_mapping to correspond with the changes
        in change_list.

        Args:
            prev_stats_dict: dict. A dict representation of an
                ExplorationStatsModel.
            change_list: list(dict). A list of all of the commit cmds from
                the old_stats_model up to the next version.

        Returns:
            dict. A dict representation of an ExplorationStatsModel
                with updated state_stats_mapping and version.
        """
        # Handling state additions, deletions and renames.
        for change_dict in change_list:
            if change_dict['cmd'] == exp_domain.CMD_ADD_STATE:

                prev_stats_dict['state_stats_mapping'][change_dict[
                    'state_name']] = (stats_domain.StateStats
                                      .create_default())
            elif change_dict['cmd'] == exp_domain.CMD_DELETE_STATE:
                prev_stats_dict['state_stats_mapping'].pop(change_dict[
                    'state_name'])
            elif change_dict['cmd'] == exp_domain.CMD_RENAME_STATE:
                prev_stats_dict['state_stats_mapping'][
                    change_dict['new_state_name']] = (
                        prev_stats_dict['state_stats_mapping'].pop(
                            change_dict['old_state_name']))
        prev_stats_dict['exp_version'] += 1

        return prev_stats_dict


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
                'version': item.exploration_version,
                'session_id': item.session_id
            })

        elif isinstance(
                item, stats_models.CompleteExplorationEventLogEntryModel):
            yield (item.exploration_id, {
                'event_type': feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
                'version': item.exploration_version,
                'session_id': item.session_id
            })

        elif isinstance(item, stats_models.StateHitEventLogEntryModel):
            if item.state_name is None:
                return
            unicode_state_name = item.state_name if isinstance(
                item.state_name, unicode) else item.state_name.decode('utf-8')
            value = {
                'event_type': feconf.EVENT_TYPE_STATE_HIT,
                'event_id': item.id,
                'version': item.exploration_version,
                'state_name': unicode_state_name,
                'session_id': item.session_id,
                'created_on': utils.get_time_in_millisecs(item.created_on)
            }
            yield (item.exploration_id, value)

        else:
            if item.state_name is None:
                return

            unicode_state_name = item.state_name if isinstance(
                item.state_name, unicode) else item.state_name.decode('utf-8')

            total_answers_count = len(item.submitted_answer_list)
            useful_feedback_count = 0
            for answer in item.submitted_answer_list:
                if answer['classification_categorization'] != (
                        exp_domain.DEFAULT_OUTCOME_CLASSIFICATION):
                    useful_feedback_count += 1
                else:
                    try:
                        exploration = exp_services.get_exploration_by_id(
                            item.exploration_id,
                            version=item.exploration_version)
                    except Exception:
                        # Exploration does not exist.
                        return

                    state = exploration.states[unicode_state_name]
                    if state.interaction.default_outcome is None:
                        yield (
                            'ERROR: Default outcome does not exist for state '
                            '%s of exploration %s.' % (
                                unicode_state_name, item.exploration_id))
                        continue

                    dest_state = state.interaction.default_outcome.dest
                    if dest_state != unicode_state_name:
                        useful_feedback_count += 1
            value = {
                'event_type': GenerateV1StatisticsJob.EVENT_TYPE_STATE_ANSWERS,
                'version': item.exploration_version,
                'state_name': unicode_state_name,
                'total_answers_count': total_answers_count,
                'useful_feedback_count': useful_feedback_count
            }
            yield (item.exploration_id, value)

    @staticmethod
    def reduce(exp_id, stringified_values):
        num_starts = 0
        num_completions = 0
        num_actual_starts = 0

        try:
            exploration = exp_services.get_exploration_by_id(exp_id)
        except Exception as e:
            # Exploration does not exist.
            return

        latest_exp_version = exploration.version

        version_numbers = range(1, latest_exp_version + 1)
        try:
            explorations_by_version = (
                exp_services.get_multiple_explorations_by_version(
                    exp_id, version_numbers))
        except Exception as e:
            yield str(e)
            return
        # Retrieve list of snapshot models representing each version of the
        # exploration.
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exp_id, version_numbers))
        snapshot_timestamps_msec = [
            snapshot['created_on_ms']
            for snapshot in snapshots_by_version]
        exploration_stats_by_version = (
            stats_services.get_multiple_exploration_stats_by_version(
                exp_id, version_numbers))

        # The list of exploration start counts mapped by version.
        start_exploration_counts_by_version = collections.defaultdict(int)
        # The list of exploration complete counts mapped by version.
        complete_exploration_counts_by_version = collections.defaultdict(int)
        # The dict of state hit counts mapped by version.
        state_hit_counts_by_version = collections.defaultdict(
            lambda: collections.defaultdict(lambda: {
                'total_hit_count': 0,
                'first_hit_count': 0
            }))
        # The dict of state answer counts mapped by version.
        state_answer_counts_by_version = collections.defaultdict(
            lambda: collections.defaultdict(lambda: {
                'total_answers_count': 0,
                'useful_feedback_count': 0
            }))
        # The set of session_ids of learners starting an exploration.
        exp_started_session_ids = set()
        # The set of session_ids of learners completing an exploration.
        exp_completed_session_ids = set()
        # Dict mapping versions -> sessionID -> state hit events.
        session_id_state_hit_event_mapping = collections.defaultdict(
            lambda: collections.defaultdict(list))
        # The dict of state completions count mapped by version.
        state_completion_counts_by_version = collections.defaultdict(
            lambda: collections.defaultdict(int))
        # The dict mapping version -> sessionID -> StateHitEvent with largest
        # timestamp.
        session_id_latest_event_mapping = collections.defaultdict(
            lambda: collections.defaultdict(lambda: {'created_on': 0}))
        # Dict mapping versions -> state_names -> set(sessionIDs)
        state_session_ids_by_version = collections.defaultdict(
            lambda: collections.defaultdict(set))

        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            version = value['version']

            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                if value['session_id'] not in exp_started_session_ids:
                    start_exploration_counts_by_version[version] += 1
                exp_started_session_ids.add(value['session_id'])
            elif value['event_type'] == feconf.EVENT_TYPE_COMPLETE_EXPLORATION:
                if value['session_id'] not in exp_completed_session_ids:
                    complete_exploration_counts_by_version[version] += 1
                exp_completed_session_ids.add(value['session_id'])
            elif value['event_type'] == feconf.EVENT_TYPE_STATE_HIT:
                state_name = value['state_name']
                session_id = value['session_id']
                event_timestamp_msec = value['created_on']

                # Some state hit events have version as None. In these cases,
                # we identify the version by comparing the event timestamp with
                # the snapshot timestamps.
                if version is None:
                    # If the event timestamp is greater than the max snapshot
                    # timestamp, then it is the latest version.
                    if event_timestamp_msec > max(snapshot_timestamps_msec):
                        version = len(snapshot_timestamps_msec)
                    else:
                        for index, snapshot_timestamp_msec in enumerate(
                                snapshot_timestamps_msec):
                            if event_timestamp_msec < snapshot_timestamp_msec:
                                version = index
                                break

                versioned_exploration = explorations_by_version[version - 1]

                # Some state names in events have spaces replaced with plus
                # signs. We explicitly log these for future reference.
                if '+' in state_name and (
                        state_name not in versioned_exploration.states):
                    state_name = state_name.replace('+', ' ')
                    value['state_name'] = state_name
                    yield (
                        'LOG: State name %s of event (with ID %s created on '
                        '%s) contains + instead of spaces.' % (
                            state_name, value['event_id'],
                            datetime.datetime.fromtimestamp(
                                event_timestamp_msec/1000)))

                # Check that the event state name is in the list of states of
                # the exploration domain object. If it is not, skip the event.
                if state_name not in versioned_exploration.states:
                    yield (
                        'LOG: StateHitEvent with ID %s does not correspond to '
                        'state name %s of version %s of the exploration with '
                        'ID %s.' % (
                            value['event_id'], state_name, version, exp_id))
                    continue

                state_hit_counts_by_version[version][state_name][
                    'total_hit_count'] += 1
                state_session_ids_by_version[version][state_name].add(
                    session_id)

                if event_timestamp_msec > session_id_latest_event_mapping[
                        version][session_id]['created_on']:
                    session_id_latest_event_mapping[version][
                        session_id] = value
                session_id_state_hit_event_mapping[version][
                    session_id].append(value)
            elif value['event_type'] == (
                    GenerateV1StatisticsJob.EVENT_TYPE_STATE_ANSWERS):
                state_answer_counts_by_version[version][value['state_name']][
                    'total_answers_count'] += value['total_answers_count']
                state_answer_counts_by_version[version][value['state_name']][
                    'useful_feedback_count'] += value['useful_feedback_count']

        # Compute num_completions for all versions and state names. Completion
        # is assumed for all state hit events in a session except the state hit
        # event with the largest timestamp. If the sessionID belongs to the set
        # of sessionIDs that completed the exploration, the state hit event with
        # the largest timestamp also gets a completion increment.
        for version in session_id_state_hit_event_mapping:
            for session_id in session_id_state_hit_event_mapping[version]:
                for state_hit_event in session_id_state_hit_event_mapping[
                        version][session_id]:
                    if state_hit_event != session_id_latest_event_mapping[
                            version][session_id]:
                        state_completion_counts_by_version[version][
                            state_hit_event['state_name']] += 1
                if session_id in exp_completed_session_ids:
                    final_state_name = session_id_latest_event_mapping[
                        version][session_id]['state_name']
                    state_completion_counts_by_version[version][
                        final_state_name] += 1

        # This dict will store the cumulative values of state stats from version
        # 1 till the latest version of an exploration.
        state_stats_mapping = {}
        # This list will contain all the ExplorationStats domain objects for
        # each version.
        exploration_stats_by_version_updated = []
        for version in version_numbers:
            state_hit_counts_for_this_version = (
                state_hit_counts_by_version[version])
            state_completion_counts_for_this_version = (
                state_completion_counts_by_version[version])
            state_answer_counts_for_this_version = (
                state_answer_counts_by_version[version])

            versioned_exploration = explorations_by_version[version - 1]

            revert_to_version = None
            if version == 1:
                # Create default state stats mapping for the first version.
                for state_name in versioned_exploration.states:
                    state_stats_mapping[state_name] = (
                        stats_domain.StateStats.create_default())
            else:
                change_list = snapshots_by_version[version - 1]['commit_cmds']

                # Handling state additions, renames and deletions.
                for change_dict in change_list:
                    # During v1 -> v2 migration of states, all pseudo END states
                    # were replaced by an explicit END state through this
                    # migration. We account for that change in the
                    # state_stats_mapping too.
                    if change_dict['cmd'] == (
                            'migrate_states_schema_to_latest_version'):
                        pseudo_end_state_name = 'END'
                        if int(change_dict['from_version']) < 2 <= int(
                                change_dict['to_version']):
                            # The explicit end state is created only if there is
                            # some state that used to refer to an implicit 'END'
                            # state. This is confirmed by checking that there is
                            # a state called 'END' in the immediate version of
                            # the exploration after migration.
                            if pseudo_end_state_name in (
                                    versioned_exploration.states) and (
                                        pseudo_end_state_name not in (
                                            state_stats_mapping)):
                                state_stats_mapping[pseudo_end_state_name] = (
                                    stats_domain.StateStats.create_default())
                    elif change_dict['cmd'] == exp_domain.CMD_ADD_STATE:
                        state_stats_mapping[change_dict['state_name']] = (
                            stats_domain.StateStats.create_default())
                    elif change_dict['cmd'] == exp_domain.CMD_DELETE_STATE:
                        if change_dict['state_name'] not in state_stats_mapping:
                            yield (
                                'ERROR during state deletion: State name %s not'
                                ' in state stats mapping of exploration with ID'
                                ' %s and version %s' % (
                                    change_dict['state_name'], exp_id, version))
                            return
                        state_stats_mapping.pop(change_dict['state_name'])
                    elif change_dict['cmd'] == exp_domain.CMD_RENAME_STATE:
                        if change_dict['old_state_name'] not in (
                                state_stats_mapping):
                            yield (
                                'ERROR during state rename: State name %s not '
                                'in state stats mapping of exploration with ID '
                                '%s and version %s' % (
                                    change_dict['old_state_name'], exp_id,
                                    version))
                            return
                        state_stats_mapping[change_dict['new_state_name']] = (
                            state_stats_mapping.pop(
                                change_dict['old_state_name']))
                    elif change_dict['cmd'] == 'AUTO_revert_version_number':
                        revert_to_version = change_dict['version_number']

            # Handling exploration reverts.
            if revert_to_version:
                old_exploration_stats = exploration_stats_by_version_updated[
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
            num_starts += start_exploration_counts_by_version[version]
            num_completions += complete_exploration_counts_by_version[
                version]

            # Compute total_hit_count and first_hit_count for the states.
            for state_name in state_hit_counts_for_this_version:
                # There are a few state hit events which contain the pseudo end
                # state as state name. These states are meant to be skipped.
                if state_name not in state_stats_mapping and (
                        state_name == 'END'):
                    continue

                state_stats_mapping[state_name].total_hit_count_v1 += (
                    state_hit_counts_for_this_version[state_name][
                        'total_hit_count'])
                state_stats_mapping[state_name].first_hit_count_v1 += (
                    len(state_session_ids_by_version[version][state_name]))

            # Compute num_completions for the states.
            for state_name in state_completion_counts_for_this_version:
                # There are a few state hit events which contain the pseudo end
                # state as state name. These states are meant to be skipped.
                if state_name not in state_stats_mapping and (
                        state_name == 'END'):
                    continue

                state_stats_mapping[state_name].num_completions_v1 += (
                    state_completion_counts_for_this_version[state_name])

            # Compute total_answers_count and useful_feedback_count.
            for state_name in state_answer_counts_for_this_version:
                state_stats_mapping[state_name].total_answers_count_v1 += (
                    state_answer_counts_for_this_version[state_name][
                        'total_answers_count'])
                state_stats_mapping[state_name].useful_feedback_count_v1 += (
                    state_answer_counts_for_this_version[state_name][
                        'useful_feedback_count'])

            # If the exploration has only one state, then the number of actual
            # starts will be equal to the number of starts.
            if len(versioned_exploration.states) == 1:
                num_actual_starts = num_starts
            else:
                # Now that the stats for the exploration's version are computed,
                # calculate num_actual_starts. To compute this, we take the max
                # of the first hit counts of all states that the initial state
                # leads to. The max is taken instead of sum because the sum of
                # first_hit_counts will sometimes end up counting a single
                # learner twice. The max of both first hit counts ensures that
                # we are counting only unique learners who traversed past the
                # initial state.
                # We also check if the outcome of the initial state is present
                # in the list of states because some older explorations use an
                # implicit, pseudo-END state.
                init_state = versioned_exploration.states[
                    versioned_exploration.init_state_name]
                first_hit_counts_from_init_state = []

                dest_states = [
                    answer_group.outcome.dest
                    for answer_group in init_state.interaction.answer_groups]
                if init_state.interaction.default_outcome is not None:
                    dest_states.append(
                        init_state.interaction.default_outcome.dest)
                for dest_state in dest_states:
                    if dest_state != versioned_exploration.init_state_name:
                        # Some older explorations had the pseudo-END state as a
                        # potential destination from the initial state. For
                        # these states, the first hit count is the completions
                        # count of the exploration.
                        if dest_state == 'END':
                            first_hit_counts_from_init_state.append(
                                num_completions)
                        else:
                            first_hit_counts_from_init_state.append(
                                state_stats_mapping[
                                    dest_state].first_hit_count_v1)

                num_actual_starts = max(
                    first_hit_counts_from_init_state or [0])

            # Check if model already exists. If it does, update it, otherwise
            # create a fresh ExplorationStatsModel instance.
            exploration_stats = exploration_stats_by_version[version - 1]
            if exploration_stats is not None:
                exploration_stats = stats_domain.ExplorationStats(
                    exp_id, version, num_starts,
                    exploration_stats.num_starts_v2, num_actual_starts,
                    exploration_stats.num_actual_starts_v2,
                    num_completions, exploration_stats.num_completions_v2,
                    state_stats_mapping)
            else:
                exploration_stats = stats_domain.ExplorationStats(
                    exp_id, version, num_starts, 0, num_actual_starts, 0,
                    num_completions, 0, state_stats_mapping)

            # Check if the number of actual starts is greater than the number of
            # starts and update num_starts to be the maximum of the
            # first hit count of all states of the exploration.
            if exploration_stats.num_actual_starts_v1 > (
                    exploration_stats.num_starts_v1):
                exploration_stats.num_starts_v1 = max([
                    exploration_stats.state_stats_mapping[
                        state_name].first_hit_count_v1
                    for state_name in exploration_stats.state_stats_mapping])

            exploration_stats_by_version_updated.append(
                exploration_stats.to_dict())

        refresh = False
        # Check if number of actual starts is still greater than the number of
        # starts for any version of the exploration.
        for exploration_stats_dict in exploration_stats_by_version_updated:
            if exploration_stats_dict['num_actual_starts_v1'] > (
                    exploration_stats_dict['num_starts_v1']):
                yield (
                    'LOG: Refreshing statistics due to actual starts being '
                    'greater than starts for exploration with ID %s ' % (
                        exp_id))
                refresh = True
                break

        # Check if number of actual starts is lesser than the number of
        # completions for any version of the exploration.
        for exploration_stats_dict in exploration_stats_by_version_updated:
            if exploration_stats_dict['num_actual_starts_v1'] < (
                    exploration_stats_dict['num_completions_v1']):
                yield (
                    'LOG: Refreshing statistics due to actual starts being '
                    'lesser than completions for exploration with ID %s ' % (
                        exp_id))
                refresh = True
                break

        # Refresh statistics for all versions of the exploration.
        if refresh:
            for index, exploration_stats_dict in enumerate(
                    exploration_stats_by_version_updated):
                default_state_stats_mapping = {}
                for state_name in exploration_stats_dict['state_stats_mapping']:
                    default_state_stats_mapping[state_name] = (
                        stats_domain.StateStats.create_default())
                exploration_stats_by_version_updated[index] = (
                    stats_domain.ExplorationStats.create_default(
                        exp_id, index + 1,
                        default_state_stats_mapping).to_dict())

        # Save all the ExplorationStats models to storage.
        stats_models.ExplorationStatsModel.save_multi(
            exploration_stats_by_version_updated)


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
            num_completions_v1 = exp_stats['num_completions_v1']
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


class GenerateAllStatsModelsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Generates default state stats models for all explorations. This should be
    run before GenerateV1StatisticsJob. If there are existing stats models,
    their values are refreshed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exp_model):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            exp_model: ExplorationModel.
        """
        if exp_model.deleted:
            return

        try:
            exploration = exp_services.get_exploration_from_model(exp_model)
        except Exception as e:
            # Exploration does not exist.
            return

        latest_exp_version = exploration.version
        exp_id = exploration.id

        version_numbers = range(1, latest_exp_version + 1)
        try:
            explorations_by_version = (
                exp_services.get_multiple_explorations_by_version(
                    exp_id, version_numbers))
        except Exception as e:
            yield (exp_id, str(e))
            return

        yield (exp_id, 'Stats initial generation started')

        # Retrieve list of snapshot models representing each version of the
        # exploration.
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exp_id, version_numbers))

        # This dict will store the cumulative values of state stats from version
        # 1 till the latest version of an exploration.
        state_stats_mapping = {}
        # This list will contain all the ExplorationStats domain objects for
        # each version.
        exploration_stats_by_version_updated = []
        for version in version_numbers:
            versioned_exploration = explorations_by_version[version - 1]

            revert_to_version = None
            if version == 1:
                # Create default state stats mapping for the first version.
                for state_name in versioned_exploration.states:
                    state_stats_mapping[state_name] = (
                        stats_domain.StateStats.create_default())
            else:
                change_list = snapshots_by_version[version - 1]['commit_cmds']

                # Handling state additions, renames and deletions.
                for change_dict in change_list:
                    # During v1 -> v2 migration of states, all pseudo END states
                    # were replaced by an explicit END state through this
                    # migration. We account for that change in the
                    # state_stats_mapping too.
                    if change_dict['cmd'] == (
                            'migrate_states_schema_to_latest_version'):
                        pseudo_end_state_name = 'END'
                        if int(change_dict['from_version']) < 2 <= int(
                                change_dict['to_version']):
                            # The explicit end state is created only if there is
                            # some state that used to refer to an implicit 'END'
                            # state. This is confirmed by checking that there is
                            # a state called 'END' in the immediate version of
                            # the exploration after migration.
                            if pseudo_end_state_name in (
                                    versioned_exploration.states) and (
                                        pseudo_end_state_name not in (
                                            state_stats_mapping)):
                                state_stats_mapping[pseudo_end_state_name] = (
                                    stats_domain.StateStats.create_default())
                    elif change_dict['cmd'] == exp_domain.CMD_ADD_STATE:
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
                old_exploration_stats = exploration_stats_by_version_updated[
                    revert_to_version - 1]
                state_stats_mapping = {
                    state_name: stats_domain.StateStats.from_dict(
                        old_exploration_stats['state_stats_mapping'][
                            state_name])
                    for state_name in old_exploration_stats[
                        'state_stats_mapping']
                }

            # Create a fresh ExplorationStatsModel instance.
            exploration_stats = stats_domain.ExplorationStats(
                exp_id, version, 0, 0, 0, 0, 0, 0, state_stats_mapping)
            exploration_stats_by_version_updated.append(
                exploration_stats.to_dict())

        # Save all the ExplorationStats models to storage.
        stats_models.ExplorationStatsModel.save_multi(
            exploration_stats_by_version_updated)

    @staticmethod
    def reduce(key, stringified_values):
        yield (key, stringified_values)
