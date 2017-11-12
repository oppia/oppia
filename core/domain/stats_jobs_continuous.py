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
import datetime

from core import jobs
from core.domain import calculation_registry
from core.domain import exp_services
from core.domain import interaction_registry
from core.platform import models

import feconf
import utils

from google.appengine.ext import ndb

(base_models, stats_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()

# Counts contributions from all versions.
VERSION_ALL = 'all'
# Indicates that no version has been specified.
VERSION_NONE = 'none'
# This date represents the date we stopped using StateCounterModel.
# This is here because StateCounterModel did not explicitly record
# a start event. It only used the hit count for the start state.
# This means that we need to figure out what the start state was
# during the StateCounterModel time period so that we can select the
# correct state hits to count as starts.
_STATE_COUNTER_CUTOFF_DATE = datetime.datetime(2014, 10, 11, 0, 0, 0)

# States with this name used to be treated as a pseudoend state, but are not
# anymore. This is kept here until the stats job may be updated to work with
# proper terminal states, rather than a hardcoded END pseudostate.
# TODO(bhenning): fix this
OLD_END_DEST = 'END'


class StatisticsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    num_starts = ndb.IntegerProperty(default=0)
    num_completions = ndb.IntegerProperty(default=0)


class StatisticsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that counts 'start exploration' and
    'complete exploration' events.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return [
            feconf.EVENT_TYPE_START_EXPLORATION,
            feconf.EVENT_TYPE_COMPLETE_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return StatisticsRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return StatisticsMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        """Records incoming events in the given realtime layer.

        Args:
            active_realtime_layer: int. Currently active realtime datastore
                layer.
            event_type: str. The event triggered by a student. For example, when
                a student starts an exploration, event of type `start` is
                triggered. If he/she completes an exploration, event of type
                `complete` is triggered.
            *args: Variable length argument list. The first element of *args
                corresponds to the id of the exploration currently being played.
        """
        exp_id = args[0]

        def _increment_visit_counter():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_starts=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_starts += 1
                model.put()

        def _increment_completion_counter():
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, exp_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, num_completions=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.num_completions += 1
                model.put()

        if event_type == feconf.EVENT_TYPE_START_EXPLORATION:
            transaction_services.run_in_transaction(
                _increment_visit_counter)
        else:
            transaction_services.run_in_transaction(
                _increment_completion_counter)

    # Public query method.
    @classmethod
    def get_statistics(cls, exploration_id, exploration_version):
        """Gets the statistics for the specified exploration and version.

        Args:
            exploration_id: str. The id of the exploration to get statistics
                for.
            exploration_version: str. Which version of the exploration to
                get statistics for. This can be a version number, the string
                'all', or the string 'none'.

        Returns:
            dict. The keys of the dict are:
                'start_exploration_count': # of times exploration was started.
                'complete_exploration_count': # of times exploration was
                    completed.
                'state_hit_counts': a dict containing the hit counts for the
                    states in the exploration. It is formatted as follows:
                    {
                        state_name: {
                            'first_entry_count': # of sessions which hit
                                this state.
                            'total_entry_count': # of total hits for this
                                state.
                            'no_answer_count': # of hits with no answer for
                                this state.
                        }
                    }
        """
        num_starts = 0
        num_completions = 0
        state_hit_counts = {}
        last_updated = None

        entity_id = stats_models.ExplorationAnnotationsModel.get_entity_id(
            exploration_id, exploration_version)
        mr_model = stats_models.ExplorationAnnotationsModel.get(
            entity_id, strict=False)
        if mr_model is not None:
            num_starts += mr_model.num_starts
            num_completions += mr_model.num_completions
            state_hit_counts = mr_model.state_hit_counts
            last_updated = utils.get_time_in_millisecs(mr_model.last_updated)

        realtime_model = cls._get_realtime_datastore_class().get(
            cls.get_active_realtime_layer_id(exploration_id), strict=False)
        if realtime_model is not None:
            num_starts += realtime_model.num_starts
            num_completions += realtime_model.num_completions

        return {
            'start_exploration_count': num_starts,
            'complete_exploration_count': num_completions,
            'state_hit_counts': state_hit_counts,
            'last_updated': last_updated,
        }

    @classmethod
    def get_views_multi(cls, exploration_ids):
        """Generates the view counts for the given exploration IDs.

        Args:
            exploration_ids: list(str). The list of exploration IDs to get view
                counts for.

        Returns:
            list(int). The number of times each exploration in exploration_ids
                has been viewed.
        """
        entity_ids = [stats_models.ExplorationAnnotationsModel.get_entity_id(
            exploration_id, VERSION_ALL) for exploration_id in exploration_ids]
        mr_models = stats_models.ExplorationAnnotationsModel.get_multi(
            entity_ids)

        realtime_model_ids = cls.get_multi_active_realtime_layer_ids(
            exploration_ids)
        realtime_models = cls._get_realtime_datastore_class().get_multi(
            realtime_model_ids)

        return [(
            mr_models[i].num_starts if mr_models[i] is not None else 0
        ) + (
            realtime_models[i].num_starts
            if realtime_models[i] is not None else 0
        ) for i in range(len(exploration_ids))]


class StatisticsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates and creates stats models for exploration view.
       Includes: * number of visits to the exploration
                 * number of completions of the exploration
       This deals with statistics of the whole exploration. See
       stats_domain.StateAnswers for statistics of individual states.
    """

    _TYPE_STATE_COUNTER_STRING = 'counter'
    _TYPE_EVENT_STRING = 'event'

    @classmethod
    def _get_continuous_computation_class(cls):
        return StatisticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel,
                stats_models.CompleteExplorationEventLogEntryModel,
                stats_models.StateHitEventLogEntryModel,
                stats_models.StateCounterModel]

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        Args:
            item: StartExplorationEventLogEntryModel or
                MaybeLeaveExplorationEventLogEntryModel or
                CompleteExplorationEventLogEntryModel or
                StateHitEventLogEntryModel or StateCounterModel. If item is of
                type StateCounterModel the information yielded corresponds to
                the various counts related to the exploration. If it is of any
                LogEntryModel type the information yielded corresponds to the
                type of the event and other details related to the exploration.

        Yields:
            tuple. 2-tuple in the form ('exploration_id:version', value).
                `exploration_id` corresponds to the id of the exploration.
                `version` corresponds to the version of the exploration.
                `value`: If item is of type StateCounterModel, the value
                    yielded is:
                    {
                        'type': 'counter',
                        'exploration_id': The ID of the exploration,
                        'version': Version of the exploration,
                        'state_name': Name of current state,
                        'first_entry_count': Number of times the state was
                            entered for the first time in a reader session,
                        'subsequent_entries_count': Number of times the state
                            was entered for the second time or later in a reader
                            session,
                        'resolved_answer_count': Number of times an answer
                            submitted for this state was subsequently resolved
                            by an exploration editor and removed from the answer
                            logs,
                        'active_answer_count': Number of times an answer was
                            entered for this state and was not subsequently
                            resolved by an exploration admin}
                    If item is of LogEntryModel type, value yielded is:
                    {
                        'type': 'event',
                        'event_type': Type of event triggered,
                        'session_id': ID of current student's session,
                        'state_name': Name of current state,
                        'created_on': How many milliseconds ago the exploration
                            was created,
                        'exploration_id': The ID of the exploration,
                        'version': Version of exploration}
        """
        if StatisticsMRJobManager._entity_created_before_job_queued(item):
            if isinstance(item, stats_models.StateCounterModel):
                first_dot_index = item.id.find('.')
                exploration_id = item.id[:first_dot_index]
                state_name = item.id[first_dot_index + 1:]

                value = {
                    'type': StatisticsMRJobManager._TYPE_STATE_COUNTER_STRING,
                    'exploration_id': exploration_id,
                    'version': VERSION_NONE,
                    'state_name': state_name,
                    'first_entry_count': item.first_entry_count,
                    'subsequent_entries_count': item.subsequent_entries_count,
                    'resolved_answer_count': item.resolved_answer_count,
                    'active_answer_count': item.active_answer_count}
                yield (
                    '%s:%s' % (exploration_id, VERSION_NONE),
                    value)
                yield ('%s:%s' % (exploration_id, VERSION_ALL), value)
            else:
                version = VERSION_NONE
                if item.exploration_version is not None:
                    version = str(item.exploration_version)

                value = {
                    'type': StatisticsMRJobManager._TYPE_EVENT_STRING,
                    'event_type': item.event_type,
                    'session_id': item.session_id,
                    'state_name': item.state_name,
                    'created_on': utils.get_time_in_millisecs(item.created_on),
                    'exploration_id': item.exploration_id,
                    'version': version}

                yield ('%s:%s' % (item.exploration_id, version), value)
                yield ('%s:%s' % (item.exploration_id, VERSION_ALL), value)

    @staticmethod
    def reduce(key, stringified_values):
        """Updates statistics for the given (exploration, version) and list of
        events and creates batch model(ExplorationAnnotationsModel) for storing
        this output.

        Args:
            key: str. The exploration id and version of the exploration in the
                form 'exploration_id.version'.
            stringified_values: list(str). A list of stringified values
                associated with the given key. It includes information depending
                on the type of event. If type of event is 'event',
                an element of stringified_values would be:
                '{
                    'type': 'event',
                    'event_type': Type of event triggered,
                    'session_id': ID of current student's session,
                    'state_name': Name of current state,
                    'created_on': How many milliseconds ago the exploration was
                        created,
                    'exploration_id': The ID of the exploration,
                    'version': Version of exploration}'
                If type is 'counter', then an element of stringified_values
                would be of the form:
                '{
                    'type': 'counter',
                    'exploration_id': The ID of the exploration,
                    'version': Version of the exploration,
                    'state_name': Name of current state,
                    'first_entry_count': Number of times the state was entered
                        for the first time in a reader session,
                    'subsequent_entries_count': Number of times the state was
                        entered for the second time or later in a reader
                        session,
                    'resolved_answer_count': Number of times an answer
                        submitted for this state was subsequently resolved by
                        an exploration admin and removed from the answer logs,
                    'active_answer_count': Number of times an answer was entered
                        for this state and was not subsequently resolved by an
                        exploration admin}'
        """
        exploration = None
        exp_id, version = key.split(':')
        try:
            if version == VERSION_NONE:
                exploration = exp_services.get_exploration_by_id(exp_id)

                # Rewind to the last commit before the transition from
                # StateCounterModel.
                current_version = exploration.version
                while (exploration.last_updated > _STATE_COUNTER_CUTOFF_DATE
                       and current_version > 1):
                    current_version -= 1
                    exploration = exp_models.ExplorationModel.get_version(
                        exp_id, current_version)
            elif version == VERSION_ALL:
                exploration = exp_services.get_exploration_by_id(exp_id)
            else:
                exploration = exp_services.get_exploration_by_id(
                    exp_id, version=version)

        except base_models.BaseModel.EntityNotFoundError:
            return

        # Number of times exploration was started
        new_models_start_count = 0
        # Number of times exploration was completed
        new_models_complete_count = 0
        # Session ids that have completed this state
        new_models_end_sessions = set()
        # {session_id: (created-on timestamp of last known maybe leave event,
        # state_name)}
        session_id_to_latest_leave_evt = collections.defaultdict(
            lambda: (0, ''))
        old_models_start_count = 0
        old_models_complete_count = 0

        # {state_name: {'total_entry_count': ...,
        #               'first_entry_count': ...,
        #               'no_answer_count': ...}}
        state_hit_counts = collections.defaultdict(
            lambda: collections.defaultdict(int))
        for state_name in exploration.states:
            state_hit_counts[state_name] = {
                'total_entry_count': 0,
                'first_entry_count': 0,
                'no_answer_count': 0,
            }

        # {state_name: set(session ids that have reached this state)}
        state_session_ids = collections.defaultdict(set)
        for state_name in exploration.states:
            state_session_ids[state_name] = set([])

        # Iterate over and process each event for this exploration.
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)

            state_name = value['state_name']

            # Convert the state name to unicode, if necessary.
            # Note: sometimes, item.state_name is None for
            # StateHitEventLogEntryModel.
            # TODO(sll): Track down the reason for this, and fix it.
            if (state_name is not None and
                    not isinstance(state_name, unicode)):
                state_name = state_name.decode('utf-8')

            if (value['type'] ==
                    StatisticsMRJobManager._TYPE_STATE_COUNTER_STRING):
                if state_name == exploration.init_state_name:
                    old_models_start_count = value['first_entry_count']
                if state_name == OLD_END_DEST:
                    old_models_complete_count = value['first_entry_count']
                else:
                    state_hit_counts[state_name]['no_answer_count'] += (
                        value['first_entry_count']
                        + value['subsequent_entries_count']
                        - value['resolved_answer_count']
                        - value['active_answer_count'])
                    state_hit_counts[state_name]['first_entry_count'] += (
                        value['first_entry_count'])
                    state_hit_counts[state_name]['total_entry_count'] += (
                        value['first_entry_count']
                        + value['subsequent_entries_count'])
                continue

            event_type = value['event_type']
            created_on = value['created_on']
            session_id = value['session_id']

            # If this is a start event, increment start count.
            if event_type == feconf.EVENT_TYPE_START_EXPLORATION:
                new_models_start_count += 1
            elif event_type == feconf.EVENT_TYPE_COMPLETE_EXPLORATION:
                new_models_complete_count += 1
                # Track that we have seen a 'real' end for this session id
                new_models_end_sessions.add(session_id)
            elif event_type == feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION:
                # Identify the last learner event for this session.
                latest_timestamp_so_far, _ = (
                    session_id_to_latest_leave_evt[session_id])
                if latest_timestamp_so_far < created_on:
                    latest_timestamp_so_far = created_on
                    session_id_to_latest_leave_evt[session_id] = (
                        created_on, state_name)
            # If this is a state hit, increment the total count and record that
            # we have seen this session id.
            elif event_type == feconf.EVENT_TYPE_STATE_HIT:
                state_hit_counts[state_name]['total_entry_count'] += 1
                state_session_ids[state_name].add(session_id)

        # After iterating through all events, take the size of the set of
        # session ids as the first entry count.
        for state_name in state_session_ids:
            state_hit_counts[state_name]['first_entry_count'] += len(
                state_session_ids[state_name])

        # Get the set of session ids that left without completing. This is
        # determined as the set of session ids with maybe-leave events at
        # intermediate states, minus the ones that have a maybe-leave event
        # at the END state.
        leave_states = set(session_id_to_latest_leave_evt.keys()).difference(
            new_models_end_sessions)
        for session_id in leave_states:
            # Grab the state name of the state they left on and count that as a
            # 'no answer' for that state.
            (_, state_name) = session_id_to_latest_leave_evt[session_id]
            state_hit_counts[state_name]['no_answer_count'] += 1

        num_starts = (
            old_models_start_count + new_models_start_count)
        num_completions = (
            old_models_complete_count + new_models_complete_count)

        stats_models.ExplorationAnnotationsModel.create(
            exp_id, str(version), num_starts, num_completions,
            state_hit_counts)


class InteractionAnswerSummariesMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job to calculate interaction view statistics, e.g. most frequent answers
    of multiple-choice interactions.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return InteractionAnswerSummariesAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StateAnswersModel]

    # TODO(bhenning): Update this job to persist results for all older
    # exploration versions, since those versions should never have new answers
    # submitted to them. Moreover, answers are also only added so this job might
    # be further optimized to increment on previous results, rather than
    # recomputing results from scratch each time.
    @staticmethod
    def map(item):
        if InteractionAnswerSummariesMRJobManager._entity_created_before_job_queued( # pylint: disable=line-too-long
                item):
            # Output answers submitted to the exploration for this exp version.
            versioned_key = u'%s:%s:%s' % (
                item.exploration_id, item.exploration_version, item.state_name)
            yield (versioned_key.encode('utf-8'), {
                'state_answers_model_id': item.id,
                'interaction_id': item.interaction_id,
                'exploration_version': item.exploration_version
            })

            # Output the same set of answers independent of the version. This
            # allows the reduce step to aggregate answers across all
            # exploration versions.
            all_versions_key = u'%s:%s:%s' % (
                item.exploration_id, VERSION_ALL, item.state_name)
            yield (all_versions_key.encode('utf-8'), {
                'state_answers_model_id': item.id,
                'interaction_id': item.interaction_id,
                'exploration_version': item.exploration_version
            })

    @staticmethod
    def reduce(key, stringified_values):
        exploration_id, exploration_version, state_name = key.split(':')

        value_dicts = [
            ast.literal_eval(stringified_value)
            for stringified_value in stringified_values]

        # Extract versions in descending order since answers are prioritized
        # based on recency.
        versions = list(set([
            int(value_dict['exploration_version'])
            for value_dict in value_dicts]))
        versions.sort(reverse=True)

        # For answers mapped to specific versions, the versions list should only
        # contain the version they correspond to. Otherwise, if they map to
        # VERSION_ALL, then multiple versions may be included.
        if exploration_version != VERSION_ALL and (
                len(versions) != 1 or versions[0] != exploration_version):
            yield (
                'Expected a single version when aggregating answers for '
                'exploration %s (v=%s), but found: %s' % (
                    exploration_id, exploration_version, versions))

        # Map interaction IDs and StateAnswersModel IDs to exploration versions.
        versioned_interaction_ids = {version: set() for version in versions}
        versioned_item_ids = {version: set() for version in versions}
        for value_dict in value_dicts:
            version = value_dict['exploration_version']
            versioned_interaction_ids[version].add(value_dict['interaction_id'])
            versioned_item_ids[version].add(
                value_dict['state_answers_model_id'])

        # Convert the interaction IDs to a list so they may be easily indexed.
        versioned_interaction_ids = {
            v: list(interaction_ids)
            for v, interaction_ids in versioned_interaction_ids.iteritems()
        }

        # Verify all interaction ID and item ID containers are well-structured.
        for version, interaction_ids in versioned_interaction_ids.iteritems():
            if len(interaction_ids) != 1:
                yield (
                    'Expected exactly one interaction ID for exploration %s '
                    'and version %s, found: %s' % (
                        exploration_id, version, len(interaction_ids)))
        for version, item_ids in versioned_item_ids.iteritems():
            if not item_ids:
                yield (
                    'Expected at least one item ID for exploration %s and '
                    'version %s, found: %s' % (
                        exploration_id, version, len(item_ids)))

        # Filter out any item IDs which happen at and before a version with a
        # changed interaction ID. Start with the most recent version since it
        # will refer to the most relevant answers.
        latest_version = versions[0]
        latest_interaction_id = versioned_interaction_ids[latest_version][0]

        if exploration_version == VERSION_ALL:
            # If aggregating across all versions, verify that the latest answer
            # version is equal to the latest version of the exploration,
            # otherwise ignore all answers since none of them can be applied to
            # the latest version.
            exp = exp_services.get_exploration_by_id(exploration_id)
            if state_name in exp.states:
                loaded_interaction_id = exp.states[state_name].interaction.id
                # Only check if the version mismatches if the new version has a
                # different interaction ID.
                if latest_interaction_id != loaded_interaction_id and (
                        latest_version != exp.version):
                    yield (
                        'Ignoring answers submitted to version %s and below '
                        'since the latest exploration version is %s' % (
                            latest_version, exp.version))
                    versions = []

        # In the VERSION_ALL case, we only take into account the most recent
        # consecutive block of versions with the same interaction ID as the
        # current version, and ignore all versions prior to this block. This
        # logic isn't needed for individually-mapped versions and, in that case,
        # we skip all this code in favor of performance.
        if len(versions) > 1:
            invalid_version_indexes = [
                index for index, version in enumerate(versions)
                if versioned_interaction_ids[version][0] != (
                    latest_interaction_id)]
            earliest_acceptable_version_index = (
                invalid_version_indexes[0] - 1
                if invalid_version_indexes else len(versions) - 1)
            earliest_acceptable_version = versions[
                earliest_acceptable_version_index]
            # Trim away anything related to the versions which correspond to
            # different or since changed interaction IDs.
            ignored_versions = [
                version for version in versions
                if version < earliest_acceptable_version]
            for ignored_version in ignored_versions:
                del versioned_interaction_ids[ignored_version]
                del versioned_item_ids[ignored_version]
            versions = versions[:earliest_acceptable_version_index+1]

        # Retrieve all StateAnswerModel entities associated with the remaining
        # item IDs which correspond to a single interaction ID shared among all
        # the versions between start_version and latest_version, inclusive.
        item_ids = set()
        for version in versions:
            item_ids.update(versioned_item_ids[version])

        # Collapse the list of answers into a single answer dict. This
        # aggregates across multiple answers if the key ends with VERSION_ALL.
        # TODO(bhenning): Find a way to iterate across all answers more
        # efficiently and by not loading all answers for a particular
        # exploration into memory.
        submitted_answer_list = []
        combined_state_answers = {
            'exploration_id': exploration_id,
            'exploration_version': exploration_version,
            'state_name': state_name,
            'interaction_id': latest_interaction_id,
            'submitted_answer_list': submitted_answer_list
        }

        state_answers_models = stats_models.StateAnswersModel.get_multi(
            item_ids)
        for state_answers_model in state_answers_models:
            if state_answers_model:
                submitted_answer_list += (
                    state_answers_model.submitted_answer_list)

        # Get all desired calculations for the current interaction id.
        calc_ids = interaction_registry.Registry.get_interaction_by_id(
            latest_interaction_id).answer_calculation_ids
        calculations = [
            calculation_registry.Registry.get_calculation_by_id(calc_id)
            for calc_id in calc_ids]

        # Perform each calculation, and store the output.
        for calc in calculations:
            calc_output = calc.calculate_from_state_answers_dict(
                combined_state_answers)
            calc_output.save()


class InteractionAnswerSummariesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    # TODO(bhenning): Implement a real-time model for
    # InteractionAnswerSummariesAggregator.
    pass


class InteractionAnswerSummariesAggregator(
        jobs.BaseContinuousComputationManager):
    """A continuous-computation job that listens to answers to states and
    updates StateAnswer view calculations.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return [feconf.EVENT_TYPE_ANSWER_SUBMITTED]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return InteractionAnswerSummariesRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return InteractionAnswerSummariesMRJobManager
