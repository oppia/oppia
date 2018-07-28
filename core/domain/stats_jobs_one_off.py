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

from core import jobs
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.platform import models
import feconf

(exp_models, stats_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics
])


class ExplorationIssuesModelCreatorOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A one-off job for creating a default ExplorationIsssues model instance
    for all the explorations in the datastore. If an ExplorationIssues model
    already exists for an exploration, it is refreshed to a default instance.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(exploration_model):
        if not exploration_model.deleted:
            current_version = exploration_model.version
            for exp_version in xrange(1, current_version + 1):
                exp_issues_model = (
                    stats_models.ExplorationIssuesModel.get_model(
                        exploration_model.id, exp_version))
                if not exp_issues_model:
                    exp_issues_default = (
                        stats_domain.ExplorationIssues.create_default(
                            exploration_model.id, exp_version))
                    stats_models.ExplorationIssuesModel.create(
                        exp_issues_default.exp_id,
                        exp_issues_default.exp_version,
                        exp_issues_default.unresolved_issues)
                else:
                    exp_issues_model.unresolved_issues = []
                    exp_issues_model.put()
            yield(
                exploration_model.id,
                'ExplorationIssuesModel created')

    @staticmethod
    def reduce(exp_id, values):
        yield "%s: %s" % (exp_id, values)


class RegenerateMissingStatsModelsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-off job to regenerate missing stats models for explorations with
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

        # Find the latest version number.
        exploration = exp_services.get_exploration_by_id(exploration_model.id)
        latest_exp_version = exploration.version
        versions = range(1, latest_exp_version + 1)

        # Retrieve all exploration instances.
        exploration_instances = exp_models.ExplorationModel.get_multi_versions(
            exploration.id, versions)

        old_exp_stats_instances = (
            stats_models.ExplorationStatsModel.get_multi_versions(
                exploration.id, versions))

        # Get list of snapshot models for each version of the exploration.
        snapshots_by_version = (
            exp_models.ExplorationModel.get_snapshots_metadata(
                exploration.id, versions))

        current_version = exploration_model.version
        for exp_version in xrange(1, current_version + 1):
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
                    change_list = snapshots_by_version[exp_version - 1][
                        'commit_cmds']
                    exp_versions_diff = (
                        exp_domain.ExplorationVersionsDiff(change_list))
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
                        # pssm is previous state stats mapping.
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
            else:
                exp_stats_instances.append(exp_stats)
        yield(
            exploration.id,
            'ExplorationStatsModel for missing versions regenerated.')

    @staticmethod
    def reduce(exp_id, values):
        yield "%s: %s" % (exp_id, values)


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
        # pylint: disable=too-many-return-statements
        if isinstance(item, stats_models.StateCompleteEventLogEntryModel):
            return (
                item.exp_id,
                {
                    'event_type': feconf.EVENT_TYPE_STATE_COMPLETED,
                    'version': item.exp_version,
                    'state_name': item.state_name
                })
        elif isinstance(
                item, stats_models.AnswerSubmittedEventLogEntryModel):
            return (
                item.exp_id,
                {
                    'event_type': feconf.EVENT_TYPE_ANSWER_SUBMITTED,
                    'version': item.exp_version,
                    'state_name': item.state_name,
                    'is_feedback_useful': item.is_feedback_useful
                })
        elif isinstance(item, stats_models.StateHitEventLogEntryModel):
            return (
                item.exploration_id,
                {
                    'event_type': feconf.EVENT_TYPE_STATE_HIT,
                    'version': item.exploration_version,
                    'state_name': item.state_name,
                    'session_id': item.session_id
                })
        elif isinstance(item, stats_models.SolutionHitEventLogEntryModel):
            return (
                item.exp_id,
                {
                    'event_type': feconf.EVENT_TYPE_SOLUTION_HIT,
                    'version': item.exp_version,
                    'state_name': item.state_name,
                    'session_id': item.session_id
                })
        elif isinstance(
                item, stats_models.StartExplorationEventLogEntryModel):
            return (
                item.exploration_id,
                {
                    'event_type': feconf.EVENT_TYPE_START_EXPLORATION,
                    'version': item.exploration_version,
                    'state_name': item.state_name,
                    'id': item.id,
                    'created_on': str(item.created_on)
                })
        elif isinstance(
                item, stats_models.ExplorationActualStartEventLogEntryModel):
            return (
                item.exp_id,
                {
                    'event_type': feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION,
                    'version': item.exp_version,
                    'state_name': item.state_name
                })
        elif isinstance(
                item, stats_models.CompleteExplorationEventLogEntryModel):
            return (
                item.exploration_id,
                {
                    'event_type': feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
                    'version': item.exploration_version,
                    'state_name': item.state_name
                })
        else:
            raise Exception('Bad item: %s' % type(item))
        # pylint: enable=too-many-return-statements

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
        values = map(ast.literal_eval, values)
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
        exploration = exp_services.get_exploration_by_id(exp_id, strict=False)
        if exploration is None:
            return [], [], error_messages
        latest_exp_version = exploration.version
        versions = range(1, latest_exp_version + 1)

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
            state_hit_session_ids, solution_hit_session_ids = set(), set()
            while event_dict['version'] == version:
                state_stats = (exp_stats_dict['state_stats_mapping'][
                    event_dict['state_name']])
                if event_dict['event_type'] == (
                        feconf.EVENT_TYPE_START_EXPLORATION):
                    exp_stats_dict['num_starts_v2'] += 1
                elif event_dict['event_type'] == (
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
            dict. A dict representation of an ExplorationStatsModel
                with updated state_stats_mapping and version.
        """
        RELEVANT_COMMIT_CMDS = [
            exp_domain.CMD_ADD_STATE,
            exp_domain.CMD_RENAME_STATE,
            exp_domain.CMD_DELETE_STATE,
            exp_models.ExplorationModel.CMD_REVERT_COMMIT
        ]

        change_list = [
            exp_domain.ExplorationChange(change_dict)
            for change_dict in change_dicts
            if change_dict['cmd'] in RELEVANT_COMMIT_CMDS]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

        # Handling state deletions, renames and additions (in that order). The
        # order in which the above changes are handled is important.

        for state_name in exp_versions_diff.deleted_state_names:
            prev_stats_dict['state_stats_mapping'].pop(state_name)

        for old_state_name, new_state_name in (
                exp_versions_diff.old_to_new_state_names.iteritems()):
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

    @classmethod
    def require_non_negative(
            cls, exp_id, exp_version, property_name, value, state_name=None):
        """Ensures that all the statistical data is non-negative.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: str. Version of the exploration.
            property_name: str. The name used as the property's key in the
                value dict.
            value: dict. Its structure is as follows:
                {
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
            state_name: str|None. The name of the state whose statistics should
                be checked. It is None when exploration-wide stats models are
                passed in.

        Yield:
            str. "Negative count: exp_id:? version:? state:? ?:?",
                where ? is the placeholder for exp_id, exp_version,
                state_name, property_name and value.
        """
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


class StatisticsAuditV2(jobs.BaseMapReduceOneOffJobManager):
    """A one-off statistics audit for the v2 stats.

    Performs a brief audit of exploration stats values to ensure that they
    maintain simple sanity checks like being non-negative and so on.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.ExplorationStatsModel]

    @classmethod
    def _require_non_negative(
            cls, exp_id, exp_version, property_name, value, state_name=None):
        """Ensures that all the statistical data is non-negative.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: str. Version of the exploration.
            property_name: str. The name used as the property's key in the
                value dict.
            value: dict. Its structure is as follows:
                {
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
            state_name: str|None. The name of the state whose statistics should
                be checked. It is None when exploration-wide stats models are
                passed in.

        Yield:
            str. "Negative count: exp_id:? version:? state:? ?:?",
                where ? is the placeholder for exp_id, exp_version,
                state_name, property_name and value.
        """
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
        for exp_stats in stringified_values:
            exp_stats = ast.literal_eval(exp_stats)
            exp_version = exp_stats['exp_version']

            num_starts_v2 = exp_stats['num_starts_v2']
            num_completions_v2 = exp_stats['num_completions_v2']
            num_actual_starts_v2 = exp_stats['num_actual_starts_v2']

            StatisticsAuditV2._require_non_negative(
                exp_id, exp_version, 'num_starts_v2', num_starts_v2)
            StatisticsAuditV2._require_non_negative(
                exp_id, exp_version, 'num_completions_v2', num_completions_v2)
            StatisticsAuditV2._require_non_negative(
                exp_id, exp_version, 'num_actual_starts_v2',
                num_actual_starts_v2)

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

                StatisticsAuditV2._require_non_negative(
                    exp_id, exp_version, 'total_answers_count_v2',
                    total_answers_count_v2, state_name=state_name)
                StatisticsAuditV2._require_non_negative(
                    exp_id, exp_version, 'useful_feedback_count_v2',
                    useful_feedback_count_v2, state_name=state_name)
                StatisticsAuditV2._require_non_negative(
                    exp_id, exp_version, 'total_hit_count_v2',
                    total_hit_count_v2, state_name=state_name)
                StatisticsAuditV2._require_non_negative(
                    exp_id, exp_version, 'first_hit_count_v2',
                    first_hit_count_v2, state_name=state_name)
                StatisticsAuditV2._require_non_negative(
                    exp_id, exp_version, 'num_completions_v2',
                    num_completions_v2, state_name=state_name)
                StatisticsAuditV2._require_non_negative(
                    exp_id, exp_version, 'num_times_solution_viewed_v2',
                    num_times_solution_viewed_v2, state_name=state_name)

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
