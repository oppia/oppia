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

__author__ = 'Sean Lip'

import inspect

from core import jobs_registry
from core.domain import exp_domain
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
taskqueue_services = models.Registry.import_taskqueue_services()
import feconf


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
            cls.EVENT_TYPE, *args, **kwargs)

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


class StateHitEventHandler(BaseEventHandler):
    """Event handler for recording state hits."""

    EVENT_TYPE = feconf.EVENT_TYPE_STATE_HIT

    @classmethod
    def _handle_event(cls, exploration_id, state_name, first_time):
        """Record an event when a state is encountered by the reader."""
        stats_models.StateCounterModel.inc(
            exploration_id, state_name, first_time)


class AnswerSubmissionEventHandler(BaseEventHandler):
    """Event handler for recording answer submissions."""

    EVENT_TYPE = feconf.EVENT_TYPE_ANSWER_SUBMITTED

    @classmethod
    def _notify_continuous_computation_listeners_async(cls, *args, **kwargs):
        # Disable this method until we can deal with large answers, otherwise
        # the data that is being placed on the task queue is too large.
        pass

    @classmethod
    def _handle_event(cls, exploration_id, exploration_version, state_name,
                      handler_name, rule, answer):
        """Records an event when an answer triggers a rule."""
        # TODO(sll): Escape these args?
        stats_models.process_submitted_answer(
            exploration_id, exploration_version, state_name,
            handler_name, rule, answer)


class DefaultRuleAnswerResolutionEventHandler(BaseEventHandler):
    """Event handler for recording resolving of answers triggering the default
    rule."""

    EVENT_TYPE = feconf.EVENT_TYPE_DEFAULT_ANSWER_RESOLVED

    @classmethod
    def _handle_event(cls, exploration_id, state_name, handler_name, answers):
        """Resolves a list of answers for the default rule of this state."""
        # TODO(sll): Escape these args?
        stats_models.resolve_answers(
            exploration_id, state_name, handler_name,
            exp_domain.DEFAULT_RULESPEC_STR, answers)


class StartExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration start events."""

    EVENT_TYPE = feconf.EVENT_TYPE_START_EXPLORATION

    @classmethod
    def _handle_event(cls, exp_id, exp_version, state_name, session_id,
                      params, play_type):
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


class ExplorationContentChangeEventHandler(BaseEventHandler):
    """Event handler for receiving exploration change events. This event is
    triggered whenever changes to an exploration's contents or metadata (title, blurb etc.)
    are persisted. This includes when a a new exploration is created."""

    EVENT_TYPE = feconf.EVENT_TYPE_EXPLORATION_CHANGE

    @classmethod
    def _handle_event(cls, exp_id):
        """Indexes the changed exploration."""
        # We're inline importing here to break import loops like this: (-> means imports)
        # event_services -> jobs_registry -> exp_jobs -> exp_services -> event_services.
        from core.domain import exp_services
        exp_services.index_explorations_given_ids([exp_id])


class ExplorationStatusChangeEventHandler(BaseEventHandler):
    """Event handler for receiving exploration status change events.
    These events are triggered whenever an exploration is published, publicized,
    unpublished or unpublicized."""

    EVENT_TYPE = feconf.EVENT_TYPE_EXPLORATION_STATUS_CHANGE

    @classmethod
    def _handle_event(cls, exp_id):
        """Indexes the changed exploration."""
        # We're inline importing here to break import loops like this: (-> means imports)
        # event_services -> jobs_registry -> exp_jobs -> exp_services -> event_services.
        from core.domain import exp_services
        from core.domain import rights_manager
        exp_rights = rights_manager.get_exploration_rights(exp_id)
        exp_services.update_exploration_status_in_search(exp_rights)


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
