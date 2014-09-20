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
from core.platform import models
(base_models, stats_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.statistics, models.NAMES.exploration])
transaction_services = models.Registry.import_transaction_services()
import feconf
import utils

from google.appengine.ext import ndb


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
            feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION]

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
    def get_statistics(cls, exploration_id):
        """Returns a dict with keys:
        'start_exploration_count': # of times exploration was started
        'complete_exploration_count': # of times exploration was completed
        'state_hit_counts': {state_name: {'first_entry_count': # of sessions state which hit this state
                                          'total_entry_count': # of total hits for this state
                                          'no_answer_count': # of hits with no answer for this state}}
        """
        mr_model = stats_models.ExplorationAnnotationsModel.get(
            exploration_id, strict=False)
        realtime_model = cls._get_realtime_datastore_class().get(
            cls.get_active_realtime_layer_id(exploration_id), strict=False)

        num_starts = 0
        if mr_model is not None:
            num_starts += mr_model.num_starts
        if realtime_model is not None:
            num_starts += realtime_model.num_starts

        num_completions = 0
        if mr_model is not None:
            num_completions += mr_model.num_completions
        if realtime_model is not None:
            num_completions += realtime_model.num_completions

        state_hit_counts = {}
        if mr_model is not None:
            state_hit_counts = mr_model.state_hit_counts

        last_updated = None
        if mr_model is not None:
            last_updated = utils.get_time_in_millisecs(mr_model.last_updated)

        return {
            'start_exploration_count': num_starts,
            'complete_exploration_count': num_completions,
            'state_hit_counts': state_hit_counts,
            'last_updated': last_updated,
        }

class StateCounterTranslationOneOffJob(jobs.BaseMapReduceJobManager):
    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        yield (item.exploration_id, {
                'event_type': item.event_type,
                'state_name': item.state_name})

    @staticmethod
    def reduce(key, stringified_values):
        exp_model = exp_models.ExplorationModel.get(key) 
        start_count = stats_models.StateCounterModel.get_or_create(
            key, exp_model.init_state_name)
        complete_count = stats_models.StateCounterModel.get_or_create(
            key, feconf.END_DEST)
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                start_count.first_entry_count -= 1
            elif (value['event_type'] ==
                feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION):
                if value['state_name'] == feconf.END_DEST:
                    complete_count.first_entry_count -= 1
        start_count.put()
        complete_count.put()


class StatisticsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates and creates stats models for exploration view.
       Includes: * number of visits to the exploration
                 * number of completions of the exploration
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return StatisticsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel,
                stats_models.StateHitEventLogEntryModel]

    @staticmethod
    def map(item):
        if StatisticsMRJobManager._entity_created_before_job_queued(item):
            yield (item.exploration_id, {
                'event_type': item.event_type,
                'session_id': item.session_id,
                'state_name': item.state_name,
                'timestamp': utils.get_time_in_millisecs(item.created_on)})

    @staticmethod
    def reduce(key, stringified_values):
        # Number of times exploration was started
        new_models_start_count = 0
        # Number of times exploration was completed
        new_models_complete_count = 0
        # {state_name: {'total_entry_count': ...,
        #               'first_entry_count': ...,
        #               'no_answer_count': ...}}
        state_stats = collections.defaultdict(lambda: collections.defaultdict(int))
        # {state_name: set(session ids that have reached this state)}
        state_session_ids = collections.defaultdict(set)
        # Session ids that have completed this state
        new_models_end_sessions = set()
        # {session_id: (timestamp of last known maybe leave event, state_name)}
        new_models_maybe_leave_info = collections.defaultdict(lambda: (0, ''))

        # Iterate through items
        for value_str in stringified_values:
            value = ast.literal_eval(value_str)
            # If this is a start event increment start count
            if value['event_type'] == feconf.EVENT_TYPE_START_EXPLORATION:
                new_models_start_count += 1
            elif (value['event_type'] ==
                  feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION):
                # If this maybe leave is on the end state, it is a complete
                if value['state_name'] == feconf.END_DEST:
                    # Increment count
                    new_models_complete_count += 1
                    # Track that we have seen a 'real' end for this session id
                    new_models_end_sessions.add(value['session_id'])
                # If this is not on the end state, we want to keep the last one so far
                else:
                    (last_timestamp_so_far, _) = new_models_maybe_leave_info[value['session_id']]
                    if last_timestamp_so_far < value['timestamp']:
                        new_models_maybe_leave_info[value['session_id']] = (
                            value['timestamp'], value['state_name'])
            # If this is a state hit, increment total count and add to the set of session ids seen so far
            elif (value['event_type'] ==
                  feconf.EVENT_TYPE_STATE_HIT):
                state_stats[value['state_name']]['total_entry_count'] += 1
                state_session_ids[value['state_name']].add(value['session_id'])

        # After iterating through all events, take the size of the set of session ids as the first entry count
        for state_name in state_session_ids:
            state_stats[state_name]['first_entry_count'] = len(state_session_ids[state_name])

        # Get the set of session ids that left without completing
        # Given by the set of session ids with maybe leave events at intermediate states 
        # minus the ones that have a end state maybe leave.
        leave_states = set(new_models_maybe_leave_info.keys()).difference(new_models_end_sessions)
        for session_id in leave_states:
            # Grab the state name of the state they left on and count that as no answer
            (_, state_name) = new_models_maybe_leave_info[session_id]
            state_stats[state_name]['no_answer_count'] += 1

        # Update all stats with old model values
        exp_model = exp_models.ExplorationModel.get(key) 
        old_models_start_count = stats_models.StateCounterModel.get_or_create(
            key, exp_model.init_state_name).first_entry_count
        old_models_complete_count = stats_models.StateCounterModel.get_or_create(
            key, feconf.END_DEST).first_entry_count

        num_starts = (
            old_models_start_count + new_models_start_count)
        num_completes = (
            old_models_complete_count + new_models_complete_count)
        for state_name in exp_model.states:
            state_counter = stats_models.StateCounterModel.get_or_create(key, state_name)
            no_answer_count = (
                state_counter.first_entry_count + state_counter.subsequent_entries_count
                    - state_counter.resolved_answer_count - state_counter.active_answer_count)
            state_stats[state_name]['no_answer_count'] += no_answer_count
            state_stats[state_name]['first_entry_count'] += state_counter.first_entry_count
            state_stats[state_name]['total_entry_count'] += state_counter.first_entry_count + state_counter.subsequent_entries_count

        stats_models.ExplorationAnnotationsModel(
            id=key,
            num_starts=num_starts,
            num_completions=num_completes,
            state_hit_counts=state_stats).put()
