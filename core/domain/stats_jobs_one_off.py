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
import collections
import copy
import itertools

from core import jobs
from core.domain import action_registry
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import playthrough_issue_registry
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.platform import models
import feconf
import python_utils

(exp_models, stats_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics
])


def require_non_negative(
        exp_id, exp_version, property_name, value,
        require_non_negative_messages, state_name=None):
    """Ensures that all the statistical data is non-negative.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: str. Version of the exploration.
        property_name: str. The property name whose value is to be checked.
        value: int. The value of property_name which is to be checked.
        require_non_negative_messages: list(str). A list in which the
            error messages are to be appended.
        state_name: str|None. The name of the state whose statistics should
            be checked. It is None when exploration-wide stats models are
            passed in.
    """
    state_name = state_name if state_name else ''
    if value < 0:
        require_non_negative_messages.append(
            'Negative count: exp_id:%s version:%s state:%s %s:%s' % (
                exp_id, exp_version, state_name, property_name, value))


class RegenerateMissingStateStatsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to regenerate individual state-stats in
    ExplorationStatsModel.
    """

    REDUCE_KEY_BAD_RENAME = 'ExplorationStatsModel state stats has bad rename'
    REDUCE_KEY_REGENERATED = 'ExplorationStatsModel state stats regenerated'
    REDUCE_KEY_OK = 'ExplorationStatsModel with valid state(s)'

    RELEVANT_COMMIT_CMDS = [
        exp_domain.CMD_ADD_STATE,
        exp_domain.CMD_RENAME_STATE,
        exp_domain.CMD_DELETE_STATE,
        exp_models.ExplorationModel.CMD_REVERT_COMMIT
    ]

    @staticmethod
    def entity_classes_to_map_over():
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exp_model):
        if exp_model.deleted:
            return

        latest_exp = exp_fetchers.get_exploration_by_id(exp_model.id)
        exp_versions = list(python_utils.RANGE(1, latest_exp.version + 1))

        all_exps = exp_models.ExplorationModel.get_multi_versions(
            exp_model.id, exp_versions)
        all_exp_stats = [
            None if not model or model.deleted else
            stats_services.get_exploration_stats_from_model(model)
            for model in stats_models.ExplorationStatsModel.get_multi_versions(
                exp_model.id, exp_versions)
        ]
        all_exp_version_diffs = [
            exp_domain.ExplorationVersionsDiff([
                exp_domain.ExplorationChange(commit_cmd)
                for commit_cmd in snapshot['commit_cmds']
                if commit_cmd['cmd'] in (
                    RegenerateMissingStateStatsOneOffJob.RELEVANT_COMMIT_CMDS)
            ])
            for snapshot in exp_models.ExplorationModel.get_snapshots_metadata(
                exp_model.id, exp_versions)
        ]

        for index, (exp, version_diff, stats) in enumerate(python_utils.ZIP(
                all_exps, all_exp_version_diffs, all_exp_stats)):
            if not exp or not version_diff or not stats:
                continue

            missing_states = set(exp.states) - set(stats.state_stats_mapping)
            if not missing_states:
                yield (RegenerateMissingStateStatsOneOffJob.REDUCE_KEY_OK, 1)
                continue

            for state_name in missing_states:
                new_state_stats = stats_domain.StateStats.create_default()

                if (index > 0 and
                        state_name not in version_diff.added_state_names):
                    old_state_stats_mapping = (
                        all_exp_stats[index - 1] and
                        all_exp_stats[index - 1].state_stats_mapping)
                    old_state_name = version_diff.new_to_old_state_names.get(
                        state_name, state_name)

                    if (old_state_stats_mapping and
                            old_state_name in old_state_stats_mapping):
                        new_state_stats.aggregate_from(
                            old_state_stats_mapping[old_state_name])
                    else:
                        yield (
                            RegenerateMissingStateStatsOneOffJob
                            .REDUCE_KEY_BAD_RENAME, (
                                '%s.%s: "%s" -> "%s"' % (
                                    exp.id, exp.version - 1, old_state_name,
                                    state_name)
                                ).encode('utf-8'))

                stats.state_stats_mapping[state_name] = new_state_stats
                yield (
                    RegenerateMissingStateStatsOneOffJob
                    .REDUCE_KEY_REGENERATED, (
                        '%s.%s: %s' % (exp.id, exp.version, state_name)
                        ).encode('utf-8'))

            stats_services.save_stats_model(stats)

    @staticmethod
    def reduce(reduce_key, values):
        if reduce_key == RegenerateMissingStateStatsOneOffJob.REDUCE_KEY_OK:
            final_value = len(values)
        else:
            final_value = [v.decode('utf-8') for v in values]
        yield (reduce_key, final_value)


class RegenerateMissingV1StatsModelsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to regenerate missing v1 stats models for explorations with
    correct v1 stats from previous versions.

    Note that job RecomputeStatisticsOneOffJob must be run immediately after
    this one, otherwise the v2 stats will be inconsistent.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exploration_model):
        exp_stats_instances = []

        if exploration_model.deleted:
            return

        relevant_commit_cmds = [
            exp_domain.CMD_ADD_STATE,
            exp_domain.CMD_RENAME_STATE,
            exp_domain.CMD_DELETE_STATE,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT
        ]

        # Find the latest version number.
        exploration = exp_fetchers.get_exploration_by_id(exploration_model.id)
        latest_exp_version = exploration.version
        versions = list(python_utils.RANGE(1, latest_exp_version + 1))

        # Retrieve all exploration instances.
        exploration_instances = exp_models.ExplorationModel.get_multi_versions(
            exploration.id, versions)

        old_exp_stats_models = (
            stats_models.ExplorationStatsModel.get_multi_versions(
                exploration.id, versions))
        old_exp_stats_instances = [(
            stats_services.get_exploration_stats_from_model(exp_stats_model)
            if exp_stats_model else None
        ) for exp_stats_model in old_exp_stats_models]

        # Get list of snapshot models for each version of the exploration.
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exploration.id, versions))

        current_version = exploration_model.version
        for exp_version in python_utils.RANGE(1, current_version + 1):
            exp_stats = old_exp_stats_instances[exp_version - 1]
            if not exp_stats:
                curr_exploration = exploration_instances[exp_version - 1]
                state_stats_mapping = {
                    state_name: stats_domain.StateStats.create_default()
                    for state_name in curr_exploration.states
                }
                exp_stats_default = (
                    stats_domain.ExplorationStats.create_default(
                        exploration.id, exp_version, state_stats_mapping))
                if exp_version > 1:
                    prev_exp_stats = exp_stats_instances[exp_version - 2]
                    change_dicts = snapshots_by_version[exp_version - 1][
                        'commit_cmds']
                    change_list = [
                        exp_domain.ExplorationChange(change_dict)
                        for change_dict in change_dicts
                        if change_dict['cmd'] in relevant_commit_cmds]
                    exp_versions_diff = exp_domain.ExplorationVersionsDiff(
                        change_list)

                    # Copy v1 stats.
                    exp_stats_default.num_starts_v1 = (
                        prev_exp_stats.num_starts_v1)
                    exp_stats_default.num_actual_starts_v1 = (
                        prev_exp_stats.num_actual_starts_v1)
                    exp_stats_default.num_completions_v1 = (
                        prev_exp_stats.num_completions_v1)
                    for state_name in exp_stats_default.state_stats_mapping:
                        old_state_name = state_name
                        if state_name in (
                                exp_versions_diff.added_state_names):
                            continue
                        if state_name in (
                                exp_versions_diff.new_to_old_state_names):
                            old_state_name = (
                                exp_versions_diff.new_to_old_state_names[
                                    state_name])
                        if old_state_name not in (
                                prev_exp_stats.state_stats_mapping):
                            yield (
                                'ExplorationStatsModel ignored StateStats '
                                'regeneration due to missing historical data', (
                                    '%s.%s: %s' % (
                                        exploration.id, exp_version,
                                        old_state_name)
                                    ).encode('utf-8'))
                            continue
                        # 'pssm' mean 'previous state stats mapping'.
                        pssm = prev_exp_stats.state_stats_mapping[
                            old_state_name]
                        exp_stats_default.state_stats_mapping[
                            state_name].first_hit_count_v1 = (
                                pssm.first_hit_count_v1)
                        exp_stats_default.state_stats_mapping[
                            state_name].total_hit_count_v1 = (
                                pssm.total_hit_count_v1)
                        exp_stats_default.state_stats_mapping[
                            state_name].useful_feedback_count_v1 = (
                                pssm.useful_feedback_count_v1)
                        exp_stats_default.state_stats_mapping[
                            state_name].total_answers_count_v1 = (
                                pssm.total_answers_count_v1)
                        exp_stats_default.state_stats_mapping[
                            state_name].num_completions_v1 = (
                                pssm.num_completions_v1)

                exp_stats_instances.append(exp_stats_default)
                stats_services.create_stats_model(exp_stats_default)
                yield (
                    'ExplorationStatsModel for missing versions regenerated: ',
                    '%s v%s' % (exploration.id, exp_version))
            else:
                exp_stats_instances.append(exp_stats)

    @staticmethod
    def reduce(message, values):
        yield (message, values)


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


class RecomputeStatisticsValidationCopyOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for recomputing creator statistics from the events
    in the datastore and then validating it against the existing values. This
    does not lead to modifications in the datastore.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return RecomputeStatisticsOneOffJob.ENTITY_CLASSES_TO_MAP_OVER

    @staticmethod
    def map(item):
        if item.event_schema_version != 2:
            return
        yield RecomputeStatisticsOneOffJob.prepare_map(item)

    @staticmethod
    def reduce(exp_id, values):
        exp_stats_dicts, old_stats, error_messages = (
            RecomputeStatisticsOneOffJob.prepare_reduce(exp_id, values))

        for error_message in error_messages:
            yield (error_message,)

        for index, exp_stats_dict in enumerate(exp_stats_dicts):
            old_stats_dict = old_stats[index].to_dict()
            if exp_stats_dict != old_stats_dict:
                yield (
                    'ERROR in recomputation. exp_id: %s, exp_version: %s, '
                    'new_stats_dict: %s, old_stats_dict: %s' % (
                        exp_id, index + 1, exp_stats_dict, old_stats_dict))

        yield ('Completed', exp_id)


class StatisticsAuditV1(jobs.BaseMapReduceOneOffJobManager):
    """A one-off statistics audit.

    Performs a brief audit of exploration stats values to ensure that they
    maintain simple sanity checks like being non-negative and so on.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.ExplorationStatsModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: ExplorationStatsModel. The Exploration stats model object to
                fetch its properties.

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

        yield (
            item.exp_id, {
                'exp_version': item.exp_version,
                'num_starts_v1': item.num_starts_v1,
                'num_completions_v1': item.num_completions_v1,
                'num_actual_starts_v1': item.num_actual_starts_v1,
                'state_stats_mapping': reduced_state_stats_mapping
            })

    @staticmethod
    def reduce(exp_id, stringified_values):
        require_non_negative_messages = []

        for exp_stats in stringified_values:
            exp_stats = ast.literal_eval(exp_stats)
            exp_version = exp_stats['exp_version']

            num_starts_v1 = exp_stats['num_starts_v1']
            num_completions_v1 = exp_stats['num_completions_v1']
            num_actual_starts_v1 = exp_stats['num_actual_starts_v1']

            require_non_negative(
                exp_id, exp_version, 'num_starts_v1', num_starts_v1,
                require_non_negative_messages)
            require_non_negative(
                exp_id, exp_version, 'num_completions_v1', num_completions_v1,
                require_non_negative_messages)
            require_non_negative(
                exp_id, exp_version, 'num_actual_starts_v1',
                num_actual_starts_v1, require_non_negative_messages)

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

                require_non_negative(
                    exp_id, exp_version, 'total_answers_count_v1',
                    total_answers_count_v1, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'useful_feedback_count_v1',
                    useful_feedback_count_v1, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'total_hit_count_v1',
                    total_hit_count_v1, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'first_hit_count_v1',
                    first_hit_count_v1, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'num_completions_v1',
                    num_completions_v1, require_non_negative_messages,
                    state_name=state_name)

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

        for error_message in require_non_negative_messages:
            yield error_message


class StatisticsAuditV2(jobs.BaseMapReduceOneOffJobManager):
    """A one-off statistics audit for the v2 stats.

    Performs a brief audit of exploration stats values to ensure that they
    maintain simple sanity checks like being non-negative and so on.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.ExplorationStatsModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: ExplorationStatsModel. The Exploration stats model object to
                fetch its properties.

        Yields:
            tuple. For ExplorationStatsModel, a 2-tuple of the form
            (exp_id, value) where value is of the form:
                {
                    'version': int. Version of the exploration.
                    'num_starts_v2': int. # of times exploration was
                        started.
                    'num_completions_v2': int. # of times exploration was
                        completed.
                    'num_actual_starts_v2': int. # of times exploration was
                        actually started.
                    'state_stats_mapping': A dict containing the values of
                        stats for the states of the exploration. It is
                        formatted as follows:
                        {
                            state_name: {
                                'total_answers_count_v2',
                                'useful_feedback_count_v2',
                                'total_hit_count_v2',
                                'first_hit_count_v2',
                                'num_times_solution_viewed_v2',
                                'num_completions_v2'
                            }
                        }
                }
        """
        reduced_state_stats_mapping = {
            state_name: {
                'total_answers_count_v2': item.state_stats_mapping[state_name][
                    'total_answers_count_v2'],
                'useful_feedback_count_v2': item.state_stats_mapping[
                    state_name]['useful_feedback_count_v2'],
                'total_hit_count_v2': item.state_stats_mapping[state_name][
                    'total_hit_count_v2'],
                'first_hit_count_v2': item.state_stats_mapping[state_name][
                    'first_hit_count_v2'],
                'num_times_solution_viewed_v2': item.state_stats_mapping[
                    state_name]['num_times_solution_viewed_v2'],
                'num_completions_v2': item.state_stats_mapping[state_name][
                    'num_completions_v2']
            } for state_name in item.state_stats_mapping
        }

        yield (
            item.exp_id, {
                'exp_version': item.exp_version,
                'num_starts_v2': item.num_starts_v2,
                'num_completions_v2': item.num_completions_v2,
                'num_actual_starts_v2': item.num_actual_starts_v2,
                'state_stats_mapping': reduced_state_stats_mapping
            })

    @staticmethod
    def reduce(exp_id, stringified_values):
        require_non_negative_messages = []

        for exp_stats in stringified_values:
            exp_stats = ast.literal_eval(exp_stats)
            exp_version = exp_stats['exp_version']

            num_starts_v2 = exp_stats['num_starts_v2']
            num_completions_v2 = exp_stats['num_completions_v2']
            num_actual_starts_v2 = exp_stats['num_actual_starts_v2']

            require_non_negative(
                exp_id, exp_version, 'num_starts_v2', num_starts_v2,
                require_non_negative_messages)
            require_non_negative(
                exp_id, exp_version, 'num_completions_v2', num_completions_v2,
                require_non_negative_messages)
            require_non_negative(
                exp_id, exp_version, 'num_actual_starts_v2',
                num_actual_starts_v2, require_non_negative_messages)

            # Number of starts must never be less than the number of
            # completions.
            if num_starts_v2 < num_completions_v2:
                yield ('Completions > starts: exp_id:%s version:%s %s > %s' % (
                    exp_id, exp_version, num_completions_v2, num_starts_v2),)

            # Number of actual starts must never be less than the number of
            # completions.
            if num_actual_starts_v2 < num_completions_v2:
                yield (
                    'Completions > actual starts: exp_id:%s '
                    'version:%s %s > %s' % (
                        exp_id, exp_version, num_completions_v2,
                        num_actual_starts_v2),)

            # Number of starts must never be less than the number of actual
            # starts.
            if num_starts_v2 < num_actual_starts_v2:
                yield (
                    'Actual starts > starts: exp_id:%s '
                    'version:%s %s > %s' % (
                        exp_id, exp_version, num_actual_starts_v2,
                        num_starts_v2),)

            for state_name in exp_stats['state_stats_mapping']:
                state_stats = exp_stats['state_stats_mapping'][state_name]

                total_answers_count_v2 = state_stats['total_answers_count_v2']
                useful_feedback_count_v2 = state_stats[
                    'useful_feedback_count_v2']
                total_hit_count_v2 = state_stats['total_hit_count_v2']
                first_hit_count_v2 = state_stats['first_hit_count_v2']
                num_completions_v2 = state_stats['num_completions_v2']
                num_times_solution_viewed_v2 = state_stats[
                    'num_times_solution_viewed_v2']

                require_non_negative(
                    exp_id, exp_version, 'total_answers_count_v2',
                    total_answers_count_v2, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'useful_feedback_count_v2',
                    useful_feedback_count_v2, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'total_hit_count_v2',
                    total_hit_count_v2, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'first_hit_count_v2',
                    first_hit_count_v2, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'num_completions_v2',
                    num_completions_v2, require_non_negative_messages,
                    state_name=state_name)
                require_non_negative(
                    exp_id, exp_version, 'num_times_solution_viewed_v2',
                    num_times_solution_viewed_v2, require_non_negative_messages,
                    state_name=state_name)

                # The total number of answers submitted can never be less than
                # the number of submitted answers for which useful feedback was
                # given.
                if total_answers_count_v2 < useful_feedback_count_v2:
                    yield (
                        'Total answers < Answers with useful feedback: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name,
                            total_answers_count_v2, useful_feedback_count_v2),)

                # The solution count can never be greater than the total hit
                # count.
                if num_times_solution_viewed_v2 > total_hit_count_v2:
                    yield (
                        'Solution count > Total state hits: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name,
                            num_times_solution_viewed_v2,
                            total_hit_count_v2),)

                # The total hit count for a state can never be less than the
                # number of times the state was hit for the first time.
                if total_hit_count_v2 < first_hit_count_v2:
                    yield (
                        'Total state hits < First state hits: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name, total_hit_count_v2,
                            first_hit_count_v2),)

                # The total hit count for a state can never be less than the
                # total number of times the state was completed.
                if total_hit_count_v2 < num_completions_v2:
                    yield (
                        'Total state hits < Total state completions: '
                        'exp_id:%s version:%s state:%s %s > %s' % (
                            exp_id, exp_version, state_name, total_hit_count_v2,
                            num_completions_v2),)

        for error_message in require_non_negative_messages:
            yield error_message


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
            item: ExplorationAnnotationsModel or StateCounterModel. The object
                to fetch its properties.

        Yields:
            tuple. Different for different models:
            For StateCounterModel, a 2-tuple in the form
                (_STATE_COUNTER_ERROR_KEY, error message).
            For ExplorationAnnotationModel, a 2-tuple in the form
                ('exploration_id', value).
                'exploration_id': str. The id of the exploration.
                'value': dict. Its structure is as follows:
                    {
                        'version': str. Version of the exploration.
                        'starts': int. # of times exploration was started.
                        'completions': int. # of times exploration was
                            completed.
                        'state_hit': dict. It contains the hit counts for the
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
        # Older versions of ExplorationAnnotations didn't store exp_id.
        # This is short hand for making sure we get ones updated most recently.
        else:
            if item.exploration_id is not None:
                yield (
                    item.exploration_id, {
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
                        'version': str. Version of the exploration.
                        'starts': int. # of times exploration was started.
                        'completions': int. # of times exploration was
                            completed.
                        'state_hit': dict. A dict containing the hit counts
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
                for (state_name, counts) in value['state_hit'].items():
                    all_state_hit[state_name] = counts['first_entry_count']
            else:
                sum_starts += value['starts']
                sum_completions += value['completions']
                for (state_name, counts) in value['state_hit'].items():
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


class RegenerateMissingV2StatsModelsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to regenerate v2 stats models which were missing due to
    incorrect handling of exploration reverts. If a model is missing at version
    x, we will regenerate all models from version x-1 till the max version of
    the exploration.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exp):
        all_models = (
            stats_models.ExplorationStatsModel.get_multi_stats_models(
                [exp_domain.ExpVersionReference(exp.id, version)
                 for version in python_utils.RANGE(1, exp.version + 1)]))

        first_missing_version = None
        for version, model in enumerate(all_models):
            if model is None:
                first_missing_version = version + 1
                break

        # If no stats models are missing, we are good.
        if first_missing_version is None:
            yield ('No change', exp.id)
            return

        # The first model cannot be missing. It should only be missing for
        # revert commits and the first change cannot be a revert commit.
        if first_missing_version == 1:
            yield ('Missing model at version 1', exp.id)
            return

        new_exp_stats_dicts = []

        # From the version just before the first missing version to the latest
        # version of the exploration stats were incorrectly calculated. So we
        # recalculate stats for all these versions.
        for version in python_utils.RANGE(
                first_missing_version - 1, exp.version + 1):
            commit_log = exp_models.ExplorationCommitLogEntryModel.get_commit(
                exp.id, version)
            exp_at_version = exp_models.ExplorationModel.get_version(
                exp.id, version)

            # If commit log models are missing (we noticed this on prod), we
            # manually calculate a diff between adjacent versions.
            if commit_log is None:
                prev_exp = exp_models.ExplorationModel.get_version(
                    exp.id, version - 1)
                old_states = prev_exp.states
                new_states = exp_at_version.states
                inferred_change_list = []

                # If a state isn't present in the new version, we consider it as
                # a deletion.
                for old_state in old_states:
                    if old_state not in new_states:
                        inferred_change_list.append(
                            exp_domain.ExplorationChange({
                                'cmd': exp_domain.CMD_DELETE_STATE,
                                'state_name': old_state
                            }))

                # If a new state is present in the new version, we consider it
                # as an addition.
                for new_state in new_states:
                    if new_state not in old_states:
                        inferred_change_list.append(
                            exp_domain.ExplorationChange({
                                'cmd': exp_domain.CMD_ADD_STATE,
                                'state_name': new_state
                            }))
                exp_versions_diff = exp_domain.ExplorationVersionsDiff(
                    inferred_change_list)

                # If there are existing stats models for this version, which was
                # incorrectly calculated before, we delete it.
                if all_models[version - 1] is not None:
                    all_models[version - 1].delete()

                new_exp_stats_dicts.append(
                    stats_services.get_stats_for_new_exp_version(
                        exp.id, version, exp_at_version.states,
                        exp_versions_diff, None).to_dict())
            else:
                change_list = (
                    [exp_domain.ExplorationChange(commit_cmd)
                     for commit_cmd in commit_log.commit_cmds])
                exp_versions_diff = exp_domain.ExplorationVersionsDiff(
                    change_list)

                # If there are existing stats models for this version, which was
                # incorrectly calculated before, we delete it.
                if all_models[version - 1] is not None:
                    all_models[version - 1].delete()

                if commit_log.commit_type == 'revert':
                    revert_to_version = (
                        commit_log.commit_cmds[0]['version_number'])
                    new_exp_stats_dicts.append(
                        stats_services.get_stats_for_new_exp_version(
                            exp.id, version, exp_at_version.states, None,
                            revert_to_version).to_dict())
                else:
                    new_exp_stats_dicts.append(
                        stats_services.get_stats_for_new_exp_version(
                            exp.id, version, exp_at_version.states,
                            exp_versions_diff, None).to_dict())

        stats_models.ExplorationStatsModel.save_multi(new_exp_stats_dicts)

        yield ('Success', exp.id)

    @staticmethod
    def reduce(key, items):
        if key in ('Success', 'No change'):
            yield (key, len(items))
        else:
            yield (key, items)


class ExplorationMissingStatsAudit(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for finding explorations that are missing stats models."""

    STATUS_DELETED_KEY = 'deleted'
    STATUS_MISSING_KEY = 'missing'
    STATUS_VALID_KEY = 'valid'
    STATUS_STATE_MISSING_KEY = 'missing state'
    STATUS_STATE_UNKNOWN_KEY = 'unknown state'

    JOB_RESULT_EXPECTED = 'EXPECTED'
    JOB_RESULT_UNEXPECTED = 'UNEXPECTED'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(latest_exp_model):
        if latest_exp_model.deleted:
            return

        exp_id = latest_exp_model.id
        exp_versions_with_states = collections.defaultdict(set)

        for version in python_utils.RANGE(1, latest_exp_model.version + 1):
            exp_model = (
                latest_exp_model if version == latest_exp_model.version else
                exp_models.ExplorationModel.get_version(
                    exp_id, version, strict=False))
            exp_stats_model = stats_models.ExplorationStatsModel.get_by_id(
                stats_models.ExplorationStatsModel.get_entity_id(
                    exp_id, version))

            for state_name in exp_model.states:
                exp_versions_with_states[state_name].add(version)

            if exp_stats_model is None:
                key = '%s:%s' % (
                    exp_id, ExplorationMissingStatsAudit.STATUS_MISSING_KEY)
                yield (key.encode('utf-8'), exp_model.version)

            elif exp_stats_model.deleted:
                key = '%s:%s' % (
                    exp_id, ExplorationMissingStatsAudit.STATUS_DELETED_KEY)
                yield (key.encode('utf-8'), exp_model.version)

            else:
                exp_states = set(exp_model.states)
                exp_stats_states = set(exp_stats_model.state_stats_mapping)
                issue_found = False

                for state_name in exp_states - exp_stats_states:
                    issue_found = True
                    key = '%s:%s:%s' % (
                        exp_id,
                        state_name,
                        ExplorationMissingStatsAudit.STATUS_STATE_MISSING_KEY)
                    state_version_occurrences = tuple(
                        python_utils.UNICODE(v) for v in sorted(
                            exp_versions_with_states[state_name]))
                    yield (
                        key.encode('utf-8'),
                        (exp_model.version, state_version_occurrences))

                for state_name in exp_stats_states - exp_states:
                    # In early schema versions of ExplorationModel, the END
                    # card was a persistant, _implicit_ state present in every
                    # exploration. Because of this, it is not an error for
                    # stats to exist for END even though it does not appear in
                    # an exploration's representation.
                    if state_name == 'END':
                        continue
                    issue_found = True
                    key = '%s:%s:%s' % (
                        exp_id,
                        state_name,
                        ExplorationMissingStatsAudit.STATUS_STATE_UNKNOWN_KEY)
                    state_version_occurrences = tuple(
                        python_utils.UNICODE(v) for v in sorted(
                            exp_versions_with_states[state_name]))
                    yield (
                        key.encode('utf-8'),
                        (exp_model.version, state_version_occurrences))

                if not issue_found:
                    key = ExplorationMissingStatsAudit.STATUS_VALID_KEY
                    yield (key, exp_model.version)

    @staticmethod
    def reduce(encoded_key, str_escaped_values):
        key = encoded_key.decode('utf-8')

        if ExplorationMissingStatsAudit.STATUS_VALID_KEY in key:
            yield (
                ExplorationMissingStatsAudit.JOB_RESULT_EXPECTED,
                '%d ExplorationStats model%s valid' % (
                    len(str_escaped_values),
                    ' is' if len(str_escaped_values) == 1 else 's are'))

        elif ExplorationMissingStatsAudit.STATUS_STATE_MISSING_KEY in key:
            exp_id, state_name, _ = key.split(':')
            for exp_version, state_version_occurrences in (
                    ast.literal_eval(s) for s in str_escaped_values):
                error_str = 'but card appears in version%s: %s' % (
                    '' if len(state_version_occurrences) == 1 else 's',
                    ', '.join(state_version_occurrences))
                yield (
                    ExplorationMissingStatsAudit.JOB_RESULT_UNEXPECTED,
                    'ExplorationStats "%s" v%s does not have stats for card '
                    '"%s", %s.' % (exp_id, exp_version, state_name, error_str))

        elif ExplorationMissingStatsAudit.STATUS_STATE_UNKNOWN_KEY in key:
            exp_id, state_name, _ = key.split(':')
            for exp_version, state_version_occurrences in (
                    ast.literal_eval(s) for s in str_escaped_values):
                if state_version_occurrences:
                    error_str = 'but card only appears in version%s: %s' % (
                        '' if len(state_version_occurrences) == 1 else 's',
                        ', '.join(state_version_occurrences))
                else:
                    error_str = 'but card never existed'
                yield (
                    ExplorationMissingStatsAudit.JOB_RESULT_UNEXPECTED,
                    'ExplorationStats "%s" v%s has stats for card "%s", %s.' % (
                        exp_id, exp_version, state_name, error_str))

        else:
            exp_id, status = key.split(':')
            exp_versions_without_stats_as_strs = sorted(str_escaped_values)

            yield (
                ExplorationMissingStatsAudit.JOB_RESULT_UNEXPECTED,
                'ExplorationStats for Exploration "%s" %s at version%s: %s' % (
                    exp_id, status,
                    '' if len(exp_versions_without_stats_as_strs) == 1 else 's',
                    ', '.join(exp_versions_without_stats_as_strs)))


class StatisticsCustomizationArgsAudit(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to check if all customization arguments stored in
    Playthrough, and ExplorationIssues are fully populated with
    the appropriate keys.
    """

    STATUS_MISMATCH_KEYS = 'missing or extra customization argument key(s)'
    STATUS_MATCH_KEYS = 'the correct customization argument key(s)'

    JOB_RESULT_EXPECTED = 'EXPECTED'
    JOB_RESULT_UNEXPECTED = 'UNEXPECTED'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.ExplorationIssuesModel,
            stats_models.PlaythroughModel
        ]

    @staticmethod
    def map(item):
        if isinstance(item, stats_models.ExplorationIssuesModel):
            for issue in item.unresolved_issues:
                ca_specs = (
                    playthrough_issue_registry.Registry.get_issue_by_type(
                        issue['issue_type']).customization_arg_specs)
                all_ca_names = set([ca_spec.name for ca_spec in ca_specs])
                if all_ca_names == set(issue['issue_customization_args']):
                    yield ('ExplorationIssue -- SUCCESS', 1)
                else:
                    ca = [
                        ca_name.encode('utf-8')
                        for ca_name in issue['issue_customization_args'].keys()
                    ]
                    yield (
                        'ExplorationIssue -- FAILURE',
                        (
                            item.exp_id.encode('utf-8'),
                            issue['issue_type'].encode('utf-8'),
                            ca
                        )
                    )
        elif isinstance(item, stats_models.PlaythroughModel):
            ca_specs = playthrough_issue_registry.Registry.get_issue_by_type(
                item.issue_type).customization_arg_specs
            all_ca_names = set([ca_spec.name for ca_spec in ca_specs])
            if all_ca_names == set(item.issue_customization_args):
                yield ('Playthrough Issue -- SUCCESS', 1)
            else:
                ca = [
                    ca_name.encode('utf-8')
                    for ca_name in item.issue_customization_args.keys()
                ]
                yield (
                    'Playthrough Issue -- FAILURE',
                    (
                        item.exp_id.encode('utf-8'),
                        item.issue_type.encode('utf-8'),
                        ca
                    )
                )

            for action in item.actions:
                ca_specs = (
                    action_registry.Registry.get_action_by_type(
                        action['action_type']).customization_arg_specs)
                all_ca_names = set([ca_spec.name for ca_spec in ca_specs])
                if all_ca_names == set(action['action_customization_args']):
                    yield ('Playthrough Action -- SUCCESS', 1)
                else:
                    ca = [
                        ca_name.encode('utf-8')
                        for ca_name in action[
                            'action_customization_args'].keys()
                    ]
                    yield (
                        'Playthrough Action -- FAILURE',
                        (
                            item.exp_id.encode('utf-8'),
                            action['action_type'].encode('utf-8'),
                            ca
                        )
                    )

    @staticmethod
    def reduce(key, values):
        if 'SUCCESS' in key:
            yield (key, len(values))
        else:
            yield (key, values)


class WipeExplorationIssuesOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to wipe all `ExplorationIssuesModel`s and make them empty.
    The job also regenerates models when they are missing, and deletes
    playthroughs referenced by models before wiping them clean.

    IMPORTANT: This job only deletes playthroughs referenced by
    `ExplorationIssuesModel`s. If there are `PlaythroughModel`s that still exist
    after running this job, then they are *unreachable* and must be deleted
    manually.

    This job addresses a bug discovered in the November 2020 release. The bug
    made it to production, and corrupted a non-trivial amount of models.
    For details, see: https://github.com/oppia/oppia/pull/11320.

    Instead of recovering the corrupted models, we've decided to simply wipe
    them all out because:
    -   `PlaythroughModel`/`ExplorationIssuesModel` instances are not being read
        by the frontend yet, they are only being written.
        -   They will be read once the Improvements tab has launched, but that
            project has been delayed by the Cloud NDB migration.
    -   `PlaythroughModel`s current (and only) schema has bugs.
        -   This gives us an opportunity to fix it without going through a
            schema migration process.
    -   `PlaythroughModel`s have new privacy requirements to meet, and there are
        old models that do not satisfy them.
        -   Playthroughs do not hold enough data to identify privacy-adherent
            models without including false-positives.
    -   Non-trivial amount of effort required to identify corrupted models due
        to lack of debug information.
    """

    EXP_ISSUES_WIPED_KEY = 'Existing ExplorationIssuesModel(s) wiped out'
    EXP_ISSUES_MISSING_KEY = 'Missing ExplorationIssuesModel(s) regenerated'
    PLAYTHROUGH_DELETED_KEY = 'Referenced PlaythroughModel(s) deleted'
    PLAYTHROUGH_DANGLING_KEY = 'Dangling PlaythroughModel(s) discovered'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(latest_exp_model):
        exp_id = latest_exp_model.id
        exp_versions = list(python_utils.RANGE(1, latest_exp_model.version + 1))

        exp_issues_model_cls = stats_models.ExplorationIssuesModel
        exp_issues_models = exp_issues_model_cls.get_multi([
            exp_issues_model_cls.get_entity_id(exp_id, exp_version)
            for exp_version in exp_versions
        ])

        num_exp_issues_wiped = 0
        missing_exp_versions = list()
        referenced_playthrough_ids = set()

        for i, exp_issues_model in enumerate(exp_issues_models):
            if exp_issues_model is not None:
                referenced_playthrough_ids.update(itertools.chain.from_iterable(
                    exp_issue['playthrough_ids']
                    for exp_issue in exp_issues_model.unresolved_issues))
                exp_issues_model.unresolved_issues = []

                num_exp_issues_wiped += 1

            else:
                exp_version = exp_versions[i]
                exp_issues_models[i] = exp_issues_model_cls(
                    id=exp_issues_model_cls.get_entity_id(exp_id, exp_version),
                    exp_id=exp_id, exp_version=exp_version,
                    unresolved_issues=[])

                missing_exp_versions.append(exp_version)

        exp_issues_model_cls.update_timestamps_multi(exp_issues_models)
        exp_issues_model_cls.put_multi(exp_issues_models)

        if num_exp_issues_wiped:
            yield (
                WipeExplorationIssuesOneOffJob.EXP_ISSUES_WIPED_KEY,
                num_exp_issues_wiped)

        if missing_exp_versions:
            yield (
                WipeExplorationIssuesOneOffJob.EXP_ISSUES_MISSING_KEY,
                'exp_id=%r exp_version(s)=%r' % (exp_id, missing_exp_versions))

        if referenced_playthrough_ids:
            references = stats_models.PlaythroughModel.get_multi(
                referenced_playthrough_ids)

            active_references = [r for r in references if r is not None]
            if active_references:
                stats_models.PlaythroughModel.delete_multi(active_references)
                yield (
                    WipeExplorationIssuesOneOffJob.PLAYTHROUGH_DELETED_KEY,
                    len(active_references))

            num_dangling_references = len(references) - len(active_references)
            if num_dangling_references:
                yield (
                    WipeExplorationIssuesOneOffJob.PLAYTHROUGH_DANGLING_KEY,
                    num_dangling_references)

    @staticmethod
    def reduce(key, values):
        if key == WipeExplorationIssuesOneOffJob.EXP_ISSUES_MISSING_KEY:
            for value in values:
                yield (key, value)
        else:
            yield (key, sum(int(v) for v in values))
