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

from core.domain import exp_domain
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
taskqueue_services = models.Registry.import_taskqueue_services()

EVENT_TYPE_STATE_HIT = 'state_hit'
EVENT_TYPE_ANSWER_SUBMITTED = 'answer_submitted'
EVENT_TYPE_DEFAULT_ANSWER_RESOLVED = 'default_answer_resolved'
EVENT_TYPE_START_EXPLORATION = 'start_exploration'
EVENT_TYPE_MAYBE_LEAVE_EXPLORATION = 'maybe_leave_exploration'


class BaseEventHandler(object):
    """Base class for event dispatchers."""

    # A string denoting the type of the event. Should be specified by
    # subclasses and considered immutable.
    event_type = None
    # Methods/functions that should be called asynchronously when an incoming
    # event arrives.
    # IMPORTANT: Implementers should be aware that listeners may receive events
    # after an extended period of time, so they should not refer to things like
    # the user currently in session. In addition, listeners should ensure that
    # they are robust to retries in the event of failure (or raise a
    # taskqueue_services.PermanentTaskFailure exception).
    _listeners = []

    @classmethod
    def add_listener(cls, listener):
        if listener not in cls._listeners:
            cls._listeners.append(listener)

    @classmethod
    def remove_listener(cls, listener):
        if listener in cls._listeners:
            cls._listeners.remove(listener)

    @classmethod
    def clear_listeners(cls):
        cls._listeners = []

    @classmethod
    def _notify_listeners_async(cls, *args, **kwargs):
        # Listeners are called with 'event_type' followed by the args and
        # kwargs passed to record().
        for listener in cls._listeners:
            taskqueue_services.defer(
                listener, cls.event_type, *args, **kwargs)

    @classmethod
    def _handle_event(cls, *args, **kwargs):
        """This method should specify what to do when an event is received."""
        raise NotImplementedError(
            'This method should be implemented by subclasses.')

    @classmethod
    def record(cls, *args, **kwargs):
        """This is the public method that callers should use."""
        cls._notify_listeners_async(*args, **kwargs)
        cls._handle_event(*args, **kwargs)


class StateHitEventHandler(BaseEventHandler):
    """Event handler for recording state hits."""

    event_type = EVENT_TYPE_STATE_HIT

    @classmethod
    def _handle_event(cls, exploration_id, state_name, first_time):
        """Record an event when a state is encountered by the reader."""
        stats_models.StateCounterModel.inc(
            exploration_id, state_name, first_time)


class AnswerSubmissionEventHandler(BaseEventHandler):
    """Event handler for recording answer submissions."""

    event_type = EVENT_TYPE_ANSWER_SUBMITTED

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

    event_type = EVENT_TYPE_DEFAULT_ANSWER_RESOLVED

    @classmethod
    def _handle_event(cls, exploration_id, state_name, handler_name, answers):
        """Resolves a list of answers for the default rule of this state."""
        # TODO(sll): Escape these args?
        stats_models.resolve_answers(
            exploration_id, state_name, handler_name,
            exp_domain.DEFAULT_RULESPEC_STR, answers)


class StartExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration start events."""

    event_type = EVENT_TYPE_START_EXPLORATION

    @classmethod
    def _handle_event(cls, exp_id, exp_version, state_name, session_id,
                      params, play_type):
        stats_models.StartExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, params,
            play_type)


class MaybeLeaveExplorationEventHandler(BaseEventHandler):
    """Event handler for recording exploration leave events."""

    event_type = EVENT_TYPE_MAYBE_LEAVE_EXPLORATION

    @classmethod
    def _handle_event(
            cls, exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type):
        stats_models.MaybeLeaveExplorationEventLogEntryModel.create(
            exp_id, exp_version, state_name, session_id, time_spent,
            params, play_type)


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
                if not obj.event_type:
                    raise Exception(
                        'Event handler class %s does not specify an event '
                        'type' % obj_name)
                elif obj.event_type in cls._event_types_to_classes:
                    raise Exception('Duplicate event type %s' % obj.EVENT_TYPE)

                cls._event_types_to_classes[obj.event_type] = obj

    @classmethod
    def clear_all_event_listeners(cls):
        """Clears all listeners."""
        cls._refresh_registry()
        for event_class in cls._event_types_to_classes.values():
            event_class.clear_listeners()

    @classmethod
    def get_event_class_by_type(cls, event_type):
        """Gets an event handler class by its type.

        Refreshes once if the event type is not found; subsequently, throws an
        error.
        """
        if event_type not in cls._event_types_to_classes:
            cls._refresh_registry()
        return cls._event_types_to_classes[event_type]
