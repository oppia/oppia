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

"""Classes for handling events."""

import inspect

from core import jobs_registry
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
import feconf

(stats_models, feedback_models) = models.Registry.import_models([
    models.NAMES.statistics, models.NAMES.feedback])
taskqueue_services = models.Registry.import_taskqueue_services()


class BaseEventHandler(object):
    """Base class for event dispatchers."""

    # A string denoting the type of the event. Should be specified by
    # subclasses and considered immutable.
    EVENT_TYPE = None

    @classmethod
    def _notify_continuous_computation_listeners_async(cls, *args, **kwargs):
        """Dispatch events asynchronously to continuous computation realtime
        layers that are listening for them.
        """
        taskqueue_services.defer(
            jobs_registry.ContinuousComputationEventDispatcher.dispatch_event,
            taskqueue_services.QUEUE_NAME_EVENTS, cls.EVENT_TYPE, *args,
            **kwargs)

    @classmethod
    def _handle_event(cls, *args, **kwargs):
        """Perform in-request processing of an incoming event."""
        raise NotImplementedError(
            'Subclasses of BaseEventHandler should implement the '
            '_handle_event() method, using explicit arguments '
            '(no *args or **kwargs).')

    @classmethod
    def record(cls, *args, **kwargs):
        """Process incoming events.

        Callers of event handlers should call this method, not _handle_event().
        """
        cls._notify_continuous_computation_listeners_async(*args, **kwargs)
        cls._handle_event(*args, **kwargs)


class StatsEventsHandler(BaseEventHandler):
    """Event handler for incremental update of analytics model using aggregated
    stats data.
    """

    EVENT_TYPE = feconf.EVENT_TYPE_ALL_STATS

    @classmethod
    def _is_latest_version(cls, exp_id, exp_version):
        """Verifies whether the exploration version for the stats to be stored
        corresponds to the latest version of the exploration.
        """
        exploration = exp_services.get_exploration_by_id(exp_id)
        return exploration.version == exp_version

    @classmethod
    def _handle_event(cls, exploration_id, exp_version, aggregated_stats):
        if cls._is_latest_version(exploration_id, exp_version):
            taskqueue_services.defer(
                stats_services.update_stats,
                taskqueue_services.QUEUE_NAME_STATS, exploration_id,
                exp_version, aggregated_stats)


class AnswerSubmissionEventHandler(BaseEventHandler):
    """Event handler for recording answer submissions."""

    EVENT_TYPE = feconf.EVENT_TYPE_ANSWER_SUBMITTED

    @classmethod
    def _notify_continuous_computation_listeners_async(cls, *args, **kwargs):
        # Disable this method until we can deal with large answers, otherwise
        # the data that is being placed on the task queue is too large.
        pass

    @classmethod
    def _handle_event(
            cls, exploration_id, exploration_version, state_name,
            interaction_id, answer_group_index, rule_spec_index,
            classification_categorization, session_id, time_spent_in_secs,
            params, normalized_answer):
        """Records an event when an answer triggers a rule. The answer recorded
        here is a Python-representation of the actual answer submitted by the
        user.
        """
        # TODO(sll): Escape these args?
        stats_services.record_answer(
            exploration_id, exploration_version, state_name, interaction_id,
            stats_domain.SubmittedAnswer(
                normalized_answer, interaction_id, answer_group_index,
                rule_spec_index, classification_categorization, params,
                session_id, time_spent_in_secs))

        feedback_is_useful = (
            classification_categorization != (
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION))

        stats_models.AnswerSubmittedEventLogEntryModel.create(
            exploration_id, exploration_version, state_name, session_id,
            time_spent_in_secs, feedback_is_useful)


class ExplorationActualStartEventHandler(BaseEventHandler):
    """Event handler for recording exploration actual start events."""

    EVENT_TYPE = feconf.EVENT_TYPE_ACTUAL_START_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id):
        stats_models.ExplorationActualStartEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id)


class SolutionHitEventHandler(BaseEventHandler):
    """Event handler for recording solution hit events."""

    EVENT_TYPE = feconf.EVENT_TYPE_SOLUTION_HIT

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        stats_models.SolutionHitEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class StartExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration start events."""

    EVENT_TYPE = feconf.EVENT_TYPE_START_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, params,
            play_type):
        stats_models.StartExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, params,
            play_type)


class MaybeLeaveExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration leave events."""

    EVENT_TYPE = feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type):
        stats_models.MaybeLeaveExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


class CompleteExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration completion events."""

    EVENT_TYPE = feconf.EVENT_TYPE_COMPLETE_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type):
        stats_models.CompleteExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


class RateExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration rating events."""

    EVENT_TYPE = feconf.EVENT_TYPE_RATE_EXPLORATION

    @classmethod
    def _handle_event(cls, exploration_id, user_id, rating, old_rating):
        stats_models.RateExplorationEventLogEntryModel.create(
            exploration_id, user_id, rating, old_rating)


class StateHitEventHandler(BaseEventHandler):
    """Event handler for recording state hit events."""

    EVENT_TYPE = feconf.EVENT_TYPE_STATE_HIT

    # TODO(sll): remove params before sending this event to the jobs taskqueue.
    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id,
            params, play_type):
        stats_models.StateHitEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            params, play_type)


class StateCompleteEventHandler(BaseEventHandler):
    """Event handler for recording state complete events."""

    EVENT_TYPE = feconf.EVENT_TYPE_STATE_COMPLETED

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        stats_models.StateCompleteEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class LeaveForRefresherExpEventHandler(BaseEventHandler):
    """Event handler for recording "leave for refresher exploration" events."""

    EVENT_TYPE = feconf.EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP

    @classmethod
    def _handle_event(
            cls, exp_id, refresher_exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        stats_models.LeaveForRefresherExplorationEventLogEntryModel.create(
            exp_id, refresher_exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs)


class FeedbackThreadCreatedEventHandler(BaseEventHandler):
    """Event handler for recording new feedback thread creation events."""

    EVENT_TYPE = feconf.EVENT_TYPE_NEW_THREAD_CREATED

    @classmethod
    def _handle_event(cls, exp_id):
        pass


class FeedbackThreadStatusChangedEventHandler(BaseEventHandler):
    """Event handler for recording reopening feedback thread events."""

    EVENT_TYPE = feconf.EVENT_TYPE_THREAD_STATUS_CHANGED

    @classmethod
    def _handle_event(cls, exp_id, old_status, new_status):
        pass


class Registry(object):
    """Registry of event handlers."""

    # Dict mapping event types to their classes.
    _event_types_to_classes = {}

    @classmethod
    def _refresh_registry(cls):
        """Regenerates the event handler registry."""
        cls._event_types_to_classes.clear()

        # Find all subclasses of BaseEventHandler in the current module.
        for obj_name, obj in globals().iteritems():
            if inspect.isclass(obj) and issubclass(obj, BaseEventHandler):
                if obj_name == 'BaseEventHandler':
                    continue
                if not obj.EVENT_TYPE:
                    raise Exception(
                        'Event handler class %s does not specify an event '
                        'type' % obj_name)
                elif obj.EVENT_TYPE in cls._event_types_to_classes:
                    raise Exception('Duplicate event type %s' % obj.EVENT_TYPE)

                cls._event_types_to_classes[obj.EVENT_TYPE] = obj

    @classmethod
    def get_event_class_by_type(cls, event_type):
        """Gets an event handler class by its type.

        Refreshes once if the event type is not found; subsequently, throws an
        error.
        """
        if event_type not in cls._event_types_to_classes:
            cls._refresh_registry()
        return cls._event_types_to_classes[event_type]
