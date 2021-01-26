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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import copy

from core import jobs
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import stats_domain
from core.domain import stats_services
from core.platform import models
import feconf
import python_utils

(exp_models, stats_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics
])


class RecomputeStatisticsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing creator statistics from the events
    in the datastore. Should only be run in events of data corruption.
    """

    ENTITY_CLASSES_TO_MAP_OVER = [
        stats_models.StateCompleteEventLogEntryModel,
        stats_models.AnswerSubmittedEventLogEntryModel,
        stats_models.StateHitEventLogEntryModel,
        stats_models.SolutionHitEventLogEntryModel,
        stats_models.StartExplorationEventLogEntryModel,
        stats_models.ExplorationActualStartEventLogEntryModel,
        stats_models.CompleteExplorationEventLogEntryModel
    ]

    @classmethod
    def entity_classes_to_map_over(cls):
        return RecomputeStatisticsOneOffJob.ENTITY_CLASSES_TO_MAP_OVER

    @classmethod
    def prepare_map(cls, item):
        """Returns a tuple that represents the given model instance, so that it
        can be processed by the MapReduce pipeline.

        Args:
            item: StateCompleteEventLogEntryModel|
                AnswerSubmittedEventLogEntryModel|StateHitEventLogEntryModel|
                SolutionHitEventLogEntryModel|StartExplorationEventLogEntryModel
                |ExplorationActualStartEventLogEntryModel|
                CompleteExplorationEventLogEntryModel. The model instance for
                different statistics models.

        Returns:
            tuple(str, dict(str, str)). The first element of the tuple is the
            exploration id corresponding to the item. The second element of
            the tuple is the dict containing information about the event
            associated with the map.

        Raises:
            Exception. The item type is wrong.
        """
        class_name_to_event_type = {
            'CompleteExplorationEventLogEntryModel':
                feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            'StateHitEventLogEntryModel': feconf.EVENT_TYPE_STATE_HIT,
            'StartExplorationEventLogEntryModel':
                feconf.EVENT_TYPE_START_EXPLORATION,
            'SolutionHitEventLogEntryModel': feconf.EVENT_TYPE_SOLUTION_HIT,
            'ExplorationActualStartEventLogEntryModel':
                feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION
        }

        if isinstance(item, stats_models.StateCompleteEventLogEntryModel):
            return (
                item.exp_id,
                {
                    'event_type': feconf.EVENT_TYPE_STATE_COMPLETED,
                    'version': item.exp_version,
                    'state_name': item.state_name,
                    'id': item.id,
                    'created_on': python_utils.UNICODE(item.created_on)
                })
        elif isinstance(
                item, stats_models.AnswerSubmittedEventLogEntryModel):
            return (
                item.exp_id,
                {
                    'event_type': feconf.EVENT_TYPE_ANSWER_SUBMITTED,
                    'version': item.exp_version,
                    'state_name': item.state_name,
                    'id': item.id,
                    'created_on': python_utils.UNICODE(item.created_on),
                    'is_feedback_useful': item.is_feedback_useful
                })
        elif (
                isinstance(
                    item, (
                        stats_models.CompleteExplorationEventLogEntryModel,
                        stats_models.StartExplorationEventLogEntryModel,
                        stats_models.StateHitEventLogEntryModel))):
            event_dict = {
                'event_type': class_name_to_event_type[
                    item.__class__.__name__],
                'version': item.exploration_version,
                'state_name': item.state_name,
                'id': item.id,
                'created_on': python_utils.UNICODE(item.created_on),
                'session_id': item.session_id
            }
            return (item.exploration_id, event_dict)

        elif (
                isinstance(item, (
                    stats_models.SolutionHitEventLogEntryModel,
                    stats_models.ExplorationActualStartEventLogEntryModel))):
            event_dict = {
                'event_type': class_name_to_event_type[
                    item.__class__.__name__],
                'version': item.exp_version,
                'state_name': item.state_name,
                'id': item.id,
                'created_on': python_utils.UNICODE(item.created_on),
                'session_id': item.session_id
            }
            return (item.exp_id, event_dict)

    @staticmethod
    def map(item):
        if item.event_schema_version != 2:
            return
        yield RecomputeStatisticsOneOffJob.prepare_map(item)

    @staticmethod
    def reduce(exp_id, values):
        exp_stats_dicts, _, error_messages = (
            RecomputeStatisticsOneOffJob.prepare_reduce(exp_id, values))
        for error_message in error_messages:
            yield (error_message,)
        stats_models.ExplorationStatsModel.save_multi(exp_stats_dicts)

    @classmethod
    def prepare_reduce(cls, exp_id, values):
        """Runs the reduce step to extract aggregate exploration statistics from
        the dicts passed in by the mapping function.

        Args:
            exp_id: str. The exploration id.
            values: list(str). List of string-encoded version of an event dict.

        Returns:
            tuple(list(dict), list(ExplorationStats), list(str)). 3-tuple where:
            - The first element is the list of dicts of different version-wise
                ExplorationStats. Each dict contains the following key-value
                pairs:
                - num_starts_v1: int. Number of learners who started the
                    exploration.
                - num_starts_v2: int. As above, but for events with version 2.
                - num_actual_starts_v1: int. Number of learners who actually
                    attempted the exploration. These are the learners who have
                    completed the initial state of the exploration and traversed
                    to the next state.
                - num_actual_starts_v2: int. As above, but for events with
                    version 2.
                - num_completions_v1: int. Number of learners who completed the
                    exploration.
                - num_completions_v2: int. As above, but for events with
                    version 2.
                - state_stats_mapping: dict. A dictionary mapping the state
                    names of an exploration to the corresponding statistics
                    dicts of the states.
            - The second element is the list of ExplorationStats domain class
                instances of the corrupted statistics models.
            - The third element is the list of all the errors that occured
                during the preparation of reduce.
        """
        values = list(python_utils.MAP(ast.literal_eval, values))
        error_messages = []

        for value in values:
            if value['version'] is None:
                error_messages.append(
                    'None version for %s %s %s %s %s' % (
                        exp_id,
                        value['event_type'], value['state_name'], value['id'],
                        value['created_on']))

        filtered_values = [
            value for value in values if value['version'] is not None]
        if not filtered_values:
            return [], [], error_messages

        sorted_events_dicts = sorted(
            filtered_values, key=lambda x: x['version'])

        # Find the latest version number.
        exploration = exp_fetchers.get_exploration_by_id(exp_id, strict=False)
        if exploration is None:
            error_messages.append(
                'Exploration with exploration_id %s not found' % exp_id)
            return [], [], error_messages
        latest_exp_version = exploration.version
        versions = list(python_utils.RANGE(1, latest_exp_version + 1))

        # Get a copy of the corrupted statistics models to copy uncorrupted
        # v1 fields.
        old_stats = stats_services.get_multiple_exploration_stats_by_version(
            exp_id, versions)
        # Get list of snapshot models for each version of the exploration.
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exp_id, versions))

        exp_stats_dicts = []
        event_dict_idx = 0
        event_dict = sorted_events_dicts[event_dict_idx]
        for version in versions:
            datastore_stats_for_version = copy.deepcopy(old_stats[version - 1])

            if datastore_stats_for_version is None:
                # All datastore stats from this version onwards are missing
                # anyway. No use processing further.
                error_messages.append(
                    'ERROR in retrieving datastore stats. They do not exist '
                    'for: exp_id: %s, exp_version: %s' % (exp_id, version))
                break

            if version == 1:
                # Reset the possibly corrupted stats.
                datastore_stats_for_version.num_starts_v2 = 0
                datastore_stats_for_version.num_completions_v2 = 0
                datastore_stats_for_version.num_actual_starts_v2 = 0
                for state_stats in list(
                        datastore_stats_for_version.
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
                # Copy recomputed v2 events from previous version.
                prev_stats_dict = copy.deepcopy(exp_stats_dicts[-1])
                prev_stats_dict = (
                    RecomputeStatisticsOneOffJob._apply_state_name_changes(
                        prev_stats_dict, change_list))
                # Copy uncorrupt v1 stats.
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

            # Compute the statistics for events corresponding to this version.
            exp_started_session_ids, exp_completed_session_ids = set(), set()
            exp_actually_started_session_ids = set()
            state_hit_session_ids, solution_hit_session_ids = set(), set()
            while event_dict['version'] == version:
                state_stats = (exp_stats_dict['state_stats_mapping'][
                    event_dict['state_name']])
                if event_dict['event_type'] == (
                        feconf.EVENT_TYPE_START_EXPLORATION):
                    if event_dict['session_id'] not in exp_started_session_ids:
                        exp_stats_dict['num_starts_v2'] += 1
                        exp_started_session_ids.add(event_dict['session_id'])
                elif event_dict['event_type'] == (
                        feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION):
                    if event_dict['session_id'] not in (
                            exp_actually_started_session_ids):
                        exp_stats_dict['num_actual_starts_v2'] += 1
                        exp_actually_started_session_ids.add(
                            event_dict['session_id'])
                elif event_dict['event_type'] == (
                        feconf.EVENT_TYPE_COMPLETE_EXPLORATION):
                    if event_dict['session_id'] not in (
                            exp_completed_session_ids):
                        exp_stats_dict['num_completions_v2'] += 1
                        exp_completed_session_ids.add(event_dict['session_id'])
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

        return exp_stats_dicts, old_stats, error_messages

    @classmethod
    def _apply_state_name_changes(cls, prev_stats_dict, change_dicts):
        """Update the state_stats_mapping to correspond with the changes
        in change_list.

        Args:
            prev_stats_dict: dict. A dict representation of an
                ExplorationStatsModel.
            change_dicts: list(dict). A list of all of the commit cmds from
                the old_stats_model up to the next version.

        Returns:
            dict. A dict representation of an ExplorationStatsModel with
            updated state_stats_mapping and version.
        """
        relevant_commit_cmds = [
            exp_domain.CMD_ADD_STATE,
            exp_domain.CMD_RENAME_STATE,
            exp_domain.CMD_DELETE_STATE,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT
        ]

        change_list = [
            exp_domain.ExplorationChange(change_dict)
            for change_dict in change_dicts
            if change_dict['cmd'] in relevant_commit_cmds]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        # Handling state deletions, renames and additions (in that order). The
        # order in which the above changes are handled is important.

        for state_name in exp_versions_diff.deleted_state_names:
            prev_stats_dict['state_stats_mapping'].pop(state_name)

        for old_state_name, new_state_name in (
                exp_versions_diff.old_to_new_state_names.items()):
            prev_stats_dict['state_stats_mapping'][new_state_name] = (
                prev_stats_dict['state_stats_mapping'].pop(old_state_name))

        for state_name in exp_versions_diff.added_state_names:
            prev_stats_dict['state_stats_mapping'][state_name] = (
                stats_domain.StateStats.create_default().to_dict())

        prev_stats_dict['exp_version'] += 1

        return prev_stats_dict
