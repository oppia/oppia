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
import json

from core import jobs
from core.platform import models
(base_models, stats_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics, models.NAMES.exploration
])
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils

from google.appengine.ext import ndb

_NO_SPECIFIED_VERSION_STRING = 'none'
_ALL_VERSIONS_STRING = 'all'
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
        """
        Args:
          - exploration_id: id of the exploration to get statistics for
          - exploration_version: str. Which version of the exploration to get
              statistics for; this can be a version number, the string 'all',
              or the string 'none'.

        Returns a dict with the following keys:
        - 'start_exploration_count': # of times exploration was started
        - 'complete_exploration_count': # of times exploration was completed
        - 'state_hit_counts': a dict containing the hit counts for the states
           in the exploration. It is formatted as follows:
            {
                state_name: {
                    'first_entry_count': # of sessions which hit this state
                    'total_entry_count': # of total hits for this state
                    'no_answer_count': # of hits with no answer for this state
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


class StatisticsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates and creates stats models for exploration view.
       Includes: * number of visits to the exploration
                 * number of completions of the exploration
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
        if StatisticsMRJobManager._entity_created_before_job_queued(item):
            if isinstance(item, stats_models.StateCounterModel):
                first_dot_index = item.id.find('.')
                exploration_id = item.id[:first_dot_index]
                state_name = item.id[first_dot_index + 1:]

                value = {
                    'type': StatisticsMRJobManager._TYPE_STATE_COUNTER_STRING,
                    'exploration_id': exploration_id,
                    'version': _NO_SPECIFIED_VERSION_STRING,
                    'state_name': state_name,
                    'first_entry_count': item.first_entry_count,
                    'subsequent_entries_count': item.subsequent_entries_count,
                    'resolved_answer_count': item.resolved_answer_count,
                    'active_answer_count': item.active_answer_count}
                yield (
                    '%s:%s' % (exploration_id, _NO_SPECIFIED_VERSION_STRING),
                    value)
                yield ('%s:%s' % (exploration_id, _ALL_VERSIONS_STRING), value)
            else:
                version = _NO_SPECIFIED_VERSION_STRING
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
                yield (
                    '%s:%s' % (item.exploration_id, _ALL_VERSIONS_STRING),
                    value)

    @staticmethod
    def reduce(key, stringified_values):
        from core.domain import exp_services

        exploration = None
        exp_id, version = key.split(':')
        try:
            if version == _NO_SPECIFIED_VERSION_STRING:
                exploration = exp_services.get_exploration_by_id(exp_id)

                # Rewind to the last commit before the transition from
                # StateCounterModel.
                current_version = exploration.version
                while (exploration.last_updated > _STATE_COUNTER_CUTOFF_DATE
                       and current_version > 1):
                    current_version -= 1
                    exploration = exp_models.ExplorationModel.get_version(
                        exp_id, current_version)
            elif version == _ALL_VERSIONS_STRING:
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
        session_id_to_latest_leave_event = collections.defaultdict(
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
                    session_id_to_latest_leave_event[session_id])
                if latest_timestamp_so_far < created_on:
                    latest_timestamp_so_far = created_on
                    session_id_to_latest_leave_event[session_id] = (
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
        leave_states = set(session_id_to_latest_leave_event.keys()).difference(
            new_models_end_sessions)
        for session_id in leave_states:
            # Grab the state name of the state they left on and count that as a
            # 'no answer' for that state.
            (_, state_name) = session_id_to_latest_leave_event[session_id]
            state_hit_counts[state_name]['no_answer_count'] += 1

        num_starts = (
            old_models_start_count + new_models_start_count)
        num_completions = (
            old_models_complete_count + new_models_complete_count)

        stats_models.ExplorationAnnotationsModel.create(
            exp_id, str(version), num_starts, num_completions,
            state_hit_counts)


class StatisticsAudit(jobs.BaseMapReduceJobManager):

    _STATE_COUNTER_ERROR_KEY = 'State Counter ERROR'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            stats_models.ExplorationAnnotationsModel,
            stats_models.StateCounterModel]

    @staticmethod
    def map(item):
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
        if key == StatisticsAudit._STATE_COUNTER_ERROR_KEY:
            for value_str in stringified_values:
                yield (value_str,)
            return

        # If the code reaches this point, we are looking at values that
        # correspond to each version of a particular exploration.

        # These variables correspond to the _ALL_VERSIONS_STRING version.
        all_starts = 0
        all_completions = 0
        all_state_hit = collections.defaultdict(int)

        # These variables correspond to the sum of counts for all other
        # versions besides _ALL_VERSIONS_STRING.
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

            if value['version'] == _ALL_VERSIONS_STRING:
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
            yield ('Non-all != all for starts: exp_id:%s sum: %s all: %s'
                % (key, sum_starts, all_starts),)
        if sum_completions != all_completions:
            yield ('Non-all != all for completions: exp_id:%s sum: %s all: %s'
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
