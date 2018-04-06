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

"""Models for Oppia statistics."""

import datetime
import json
import logging
import sys

from core.platform import models
import feconf
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])
transaction_services = models.Registry.import_transaction_services()


class StateCounterModel(base_models.BaseModel):
    """A set of counts that correspond to a state.

    The ID/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_NAME].
    """
    # Number of times the state was entered for the first time in a reader
    # session.
    first_entry_count = ndb.IntegerProperty(default=0, indexed=False)
    # Number of times the state was entered for the second time or later in a
    # reader session.
    subsequent_entries_count = ndb.IntegerProperty(default=0, indexed=False)
    # Number of times an answer submitted for this state was subsequently
    # resolved by an exploration admin and removed from the answer logs.
    resolved_answer_count = ndb.IntegerProperty(default=0, indexed=False)
    # Number of times an answer was entered for this state and was not
    # subsequently resolved by an exploration admin.
    active_answer_count = ndb.IntegerProperty(default=0, indexed=False)

    @classmethod
    def get_or_create(cls, exploration_id, state_name):
        """Gets or creates an entity by exploration_id and state_name.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            state_name: str. Name of the current state.

        Returns:
            StateCounterModel. An instance of the StateCounterModel.
        """
        instance_id = '.'.join([exploration_id, state_name])
        counter = cls.get(instance_id, strict=False)
        if not counter:
            counter = cls(id=instance_id)
        return counter


class AnswerSubmittedEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student submitting an answer."""
    # Id of exploration currently being played.
    exp_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = ndb.FloatProperty()
    # Whether the submitted answer received useful feedback.
    is_feedback_useful = ndb.BooleanProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates a unique id for the event model of the form
        {{random_hash}} from {{timestamp}:{exp_id}:{session_id}}.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs, is_feedback_useful):
        """Creates a new answer submitted event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        answer_submitted_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_state_secs,
            is_feedback_useful=is_feedback_useful)
        answer_submitted_event_entity.put()
        return entity_id


class ExplorationActualStartEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student entering an exploration. In this context,
    'actually' entering an exploration means the student has completed the
    initial state of the exploration and traversed to the second state.
    """
    # Id of exploration currently being played.
    exp_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates a unique id for the event model of the form
        {{random_hash}} from {{timestamp}:{exp_id}:{session_id}}.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(cls, exp_id, exp_version, state_name, session_id):
        """Creates a new actual exploration start event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        actual_start_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id)
        actual_start_event_entity.put()
        return entity_id


class SolutionHitEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student triggering the solution."""
    # Id of exploration currently being played.
    exp_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = ndb.FloatProperty()
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates a unique id for the event model of the form
        {{random_hash}} from {{timestamp}:{exp_id}:{session_id}}.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        """Creates a new solution hit event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        solution_hit_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_state_secs)
        solution_hit_event_entity.put()
        return entity_id


class StartExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student starting the exploration.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'start'.
        exploration_id: ID of exploration currently being played.
        exploration_version: Version of exploration.
        state_name: Name of current state.
        client_time_spent_in_secs: 0.
        play_type: 'normal'.
        event_schema_version: 1.
        session_id: ID of current student's session.
        params: Current parameter values, in the form of a map of parameter
            name to value.
    """
    # Which specific type of event this is.
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    client_time_spent_in_secs = ndb.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates entity ID for a new event based on its
        exploration and session ID.

        Args:
            exp_id: str. ID of the exploration currently being played.
            session_id: str. ID of current student's session.

        Returns:
            str. New unique ID for this entity class.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id,
            params, play_type, unused_version=1):
        """Creates a new start exploration event and then writes it to
        the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exp_version: int. Version of exploration.
            state_name: str. Name of current state.
            session_id: str. ID of current student's session.
            params: dict. Current parameter values, map of parameter
                name to value.
            play_type: str. Type of play-through.
            unused_version: int. Default is 1.
        """
        # TODO(sll): Some events currently do not have an entity ID that was
        # set using this method; it was randomly set instead due tg an error.
        # Might need to migrate them.
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        start_event_entity = cls(
            id=entity_id,
            event_type=feconf.EVENT_TYPE_START_EXPLORATION,
            exploration_id=exp_id,
            exploration_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            client_time_spent_in_secs=0.0,
            params=params,
            play_type=play_type)
        start_event_entity.put()
        return entity_id


class MaybeLeaveExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a reader attempting to leave the
    exploration without completing.

    Due to complexity on browser end, this event may be logged when user clicks
    close and then cancel. Thus, the real event is the last event of this type
    logged for the session ID.

    Note: shortly after the release of v2.0.0.rc.2, some of these events
    were migrated from StateHitEventLogEntryModel. These events have their
    client_time_spent_in_secs field set to 0.0 (since this field was not
    recorded in StateHitEventLogEntryModel), and they also have the wrong
    'last updated' timestamp. However, the 'created_on' timestamp is the
    same as that of the original model.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'leave' (there are no 'maybe leave' events in V0).
        exploration_id: ID of exploration currently being played.
        exploration_version: version of exploration.
        state_name: Name of current state.
        play_type: 'normal'.
        event_schema_version: 1.
        session_id: ID of current student's session.
        params: Current parameter values, in the form of a map of parameter
            name to value.
        client_time_spent_in_secs: Time spent in this state before the event
            was triggered.
    """
    # Which specific type of event this is.
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    # Note: Some of these events were migrated from StateHit event instances
    # which did not record timestamp data. For this, we use a placeholder
    # value of 0.0 for client_time_spent_in_secs.
    client_time_spent_in_secs = ndb.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates entity ID for a new event based on its
        exploration and session ID.

        Args:
            exp_id: str. ID of the exploration currently being played.
            session_id: str. ID of current student's session.

        Returns:
            str. New unique ID for this entity class.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id,
            client_time_spent_in_secs, params, play_type):
        """Creates a new leave exploration event and then writes it
        to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exp_version: int. Version of exploration.
            state_name: str. Name of current state.
            session_id: str. ID of current student's session.
            params: dict. Current parameter values, map of parameter name
                to value.
            play_type: str. Type of play-through.
            client_time_spent_in_secs: float. Time since start of this
                state before this event occurred.
        """
        # TODO(sll): Some events currently do not have an entity ID that was
        # set using this method; it was randomly set instead due to an error.
        # Might need to migrate them.
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        leave_event_entity = cls(
            id=entity_id,
            event_type=feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION,
            exploration_id=exp_id,
            exploration_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            client_time_spent_in_secs=client_time_spent_in_secs,
            params=params,
            play_type=play_type)
        leave_event_entity.put()


class CompleteExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a learner reaching a terminal state of an
    exploration.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'complete'.
        exploration_id: ID of exploration currently being played.
        exploration_version: version of exploration.
        state_name: Name of the terminal state.
        play_type: 'normal'.
        event_schema_version: 1.
        session_id: ID of current student's session.
        params: Current parameter values, in the form of a map of parameter
            name to value.
        client_time_spent_in_secs: Time spent in this state before the event
            was triggered.

    Note: shortly after the release of v2.0.0.rc.3, some of these events
    were migrated from MaybeLeaveExplorationEventLogEntryModel. These events
    have the wrong 'last updated' timestamp. However, the 'created_on'
    timestamp is the same as that of the original model.
    """
    # Which specific type of event this is.
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    # Note: Some of these events were migrated from StateHit event instances
    # which did not record timestamp data. For this, we use a placeholder
    # value of 0.0 for client_time_spent_in_secs.
    client_time_spent_in_secs = ndb.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates entity ID for a new event based on its
        exploration and session ID.

        Args:
            exp_id: str. ID of the exploration currently being played.
            session_id: str. ID of current student's session.

        Returns:
            str. New unique ID for this entity class.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id,
            client_time_spent_in_secs, params, play_type):
        """Creates a new exploration completion event and then writes it
        to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exp_version: int. Version of exploration.
            state_name: str. Name of current state.
            session_id: str. ID of current student's session.
            params: dict. Current parameter values, map of parameter name
                to value.
            play_type: str. Type of play-through.
            client_time_spent_in_secs: float. Time since start of this
                state before this event occurred.
        """
        entity_id = cls.get_new_event_entity_id(exp_id, session_id)
        complete_event_entity = cls(
            id=entity_id,
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=exp_id,
            exploration_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            client_time_spent_in_secs=client_time_spent_in_secs,
            params=params,
            play_type=play_type)
        complete_event_entity.put()
        return entity_id


class RateExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a learner rating the exploration.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'rate_exploration'.
        exploration_id: ID of exploration which is being rated.
        rating: Value of rating assigned to exploration.
    """
    # Which specific type of event this is.
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration which has been rated.
    exploration_id = ndb.StringProperty(indexed=True)
    # Value of rating assigned.
    rating = ndb.IntegerProperty(indexed=True)
    # Value of rating previously assigned by the same user. Will be None when a
    # user rates an exploration for the first time.
    old_rating = ndb.IntegerProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, user_id):
        """Generates entity ID for a new rate exploration event based on its
        exploration_id and user_id of the learner.

        Args:
            exp_id: str. ID of the exploration currently being played.
            user_id: str. ID of the user.

        Returns:
            str. New unique ID for this entity class.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            user_id))

    @classmethod
    def create(cls, exp_id, user_id, rating, old_rating):
        """Creates a new rate exploration event and then writes it to the
        datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            user_id: str. ID of the user.
            rating: int. Value of rating assigned to exploration.
            old_rating: int or None. Will be None if the user rates an
                exploration for the first time.
        """
        entity_id = cls.get_new_event_entity_id(
            exp_id, user_id)
        cls(id=entity_id,
            event_type=feconf.EVENT_TYPE_RATE_EXPLORATION,
            exploration_id=exp_id,
            rating=rating,
            old_rating=old_rating).put()


class StateHitEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student getting to a particular state. The
    definitions of the fields are as follows:
    - event_type: 'state_hit'.
    - exploration_id: ID of exploration currently being played.
    - exploration_version: Version of exploration.
    - state_name: Name of current state.
    - play_type: 'normal'.
    - event_schema_version: 1.
    - session_id: ID of current student's session.
    - params: Current parameter values, in the form of a map of parameter name
              to its value.
    NOTE TO DEVELOPERS: Unlike other events, this event does not have a
    client_time_spent_in_secs. Instead, it is the reference event for
    all other client_time_spent_in_secs values, which each represent the
    amount of time between this event (i.e., the learner entering the
    state) and the other event.
    """
    # Which specific type of event this is.
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates entity ID for a new event based on its
        exploration and session ID.

        Args:
            exp_id: str. ID of the exploration currently being played.
            session_id: str. ID of current student's session.

        Returns:
            str. New unique ID for this entity class.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id, params,
            play_type):
        """Creates a new state hit event entity and then writes
        it to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exp_version: int. Version of exploration.
            state_name: str. Name of current state.
            session_id: str. ID of current student's session.
            params: dict. Current parameter values, map of parameter name
                to value.
            play_type: str. Type of play-through.
        """
        # TODO(sll): Some events currently do not have an entity ID that was
        # set using this method; it was randomly set instead due to an error.
        # Might need to migrate them.
        entity_id = cls.get_new_event_entity_id(exp_id, session_id)
        state_event_entity = cls(
            id=entity_id,
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=exp_id,
            exploration_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            params=params,
            play_type=play_type)
        state_event_entity.put()
        return entity_id


class StateCompleteEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student completing a state."""
    # Id of exploration currently being played.
    exp_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = ndb.FloatProperty()
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates a unique id for the event model of the form
        {{random_hash}} from {{timestamp}:{exp_id}:{session_id}}.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id,
            time_spent_in_state_secs):
        """Creates a new state complete event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        state_finish_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_state_secs)
        state_finish_event_entity.put()
        return entity_id


class LeaveForRefresherExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student leaving for a refresher exploration."""
    # ID of exploration currently being played.
    exp_id = ndb.StringProperty(indexed=True)
    # ID of the refresher exploration.
    refresher_exp_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = ndb.FloatProperty()
    # The version of the event schema used to describe an event of this type.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        """Generates a unique id for the event model of the form
        {{random_hash}} from {{timestamp}:{exp_id}:{session_id}}.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, refresher_exp_id, exp_version, state_name,
            session_id, time_spent_in_state_secs):
        """Creates a new leave for refresher exploration event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        leave_for_refresher_exp_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            refresher_exp_id=refresher_exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_state_secs)
        leave_for_refresher_exp_entity.put()
        return entity_id


class ExplorationStatsModel(base_models.BaseModel):
    """Model for storing analytics data for an exploration. This model contains
    statistics data aggregated from version 1 to the version given in the key.

    The ID of instances of this class has the form {{exp_id}}.{{exp_version}}.
    """
    # ID of exploration.
    exp_id = ndb.StringProperty(indexed=True)
    # Version of exploration.
    exp_version = ndb.IntegerProperty(indexed=True)
    # Number of learners starting the exploration (v1 - data collected before
    # Dec 2017).
    num_starts_v1 = ndb.IntegerProperty(indexed=True)
    num_starts_v2 = ndb.IntegerProperty(indexed=True)
    # Number of students who actually attempted the exploration. Only learners
    # who spent a minimum time on the exploration are considered to have
    # actually started the exploration (v1 - data collected before Dec 2017).
    num_actual_starts_v1 = ndb.IntegerProperty(indexed=True)
    num_actual_starts_v2 = ndb.IntegerProperty(indexed=True)
    # Number of students who completed the exploration (v1 - data collected
    # before Dec 2017).
    num_completions_v1 = ndb.IntegerProperty(indexed=True)
    num_completions_v2 = ndb.IntegerProperty(indexed=True)
    # Keyed by state name that describes the analytics for that state.
    # {state_name: {
    #   'total_answers_count_v1': ...,
    #   'total_answers_count_v2': ...,
    #   'useful_feedback_count_v1': ...,
    #   'useful_feedback_count_v2': ...,
    #   'total_hit_count_v1': ...,
    #   'total_hit_count_v2': ...,
    #   'first_hit_count_v1': ...,
    #   'first_hit_count_v2': ...,
    #   'num_times_solution_viewed_v2': ...,
    #   'num_completions_v1': ...,
    #   'num_completions_v2': ...}}
    state_stats_mapping = ndb.JsonProperty(indexed=False)

    @classmethod
    def get_entity_id(cls, exp_id, exp_version):
        """Generates an ID for the instance of the form
        {{exp_id}}.{{exp_version}}.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            str. ID of the new ExplorationStatsModel instance.
        """
        return '%s.%s' % (exp_id, exp_version)

    @classmethod
    def get_model(cls, exp_id, exp_version):
        """Retrieves ExplorationStatsModel given exploration ID and version.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            ExplorationStatsModel. Exploration analytics model instance in
                datastore.
        """
        instance_id = cls.get_entity_id(exp_id, exp_version)
        exploration_stats_model = cls.get(instance_id, strict=False)
        return exploration_stats_model

    @classmethod
    def create(
            cls, exp_id, exp_version, num_starts_v1, num_starts_v2,
            num_actual_starts_v1, num_actual_starts_v2, num_completions_v1,
            num_completions_v2, state_stats_mapping):
        """Creates an ExplorationStatsModel instance and writes it to the
        datastore.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            num_starts_v1: int. Number of learners who started the exploration.
            num_starts_v2: int. As above, but for events with version 2.
            num_actual_starts_v1: int. Number of learners who attempted the
                exploration.
            num_actual_starts_v2: int. As above, but for events with version 2.
            num_completions_v1: int. Number of learners who completed the
                exploration.
            num_completions_v2: int. As above, but for events with version 2.
            state_stats_mapping: dict. Mapping from state names to state stats
                dicts.

        Returns:
            str. ID of the new ExplorationStatsModel instance.
        """
        instance_id = cls.get_entity_id(exp_id, exp_version)
        stats_instance = cls(
            id=instance_id, exp_id=exp_id, exp_version=exp_version,
            num_starts_v1=num_starts_v1,
            num_starts_v2=num_starts_v2,
            num_actual_starts_v1=num_actual_starts_v1,
            num_actual_starts_v2=num_actual_starts_v2,
            num_completions_v1=num_completions_v1,
            num_completions_v2=num_completions_v2,
            state_stats_mapping=state_stats_mapping)
        stats_instance.put()
        return instance_id

    @classmethod
    def get_multi_versions(cls, exp_id, version_numbers):
        """Gets stats model instances for each version specified in
        version_numbers.

        Args:
            exp_id: str. ID of the exploration.
            version_numbers: list(int). List of version numbers.

        Returns:
            list(ExplorationStatsModel|None). Model instances representing the
                given versions.
        """
        entity_ids = [cls.get_entity_id(
            exp_id, version) for version in version_numbers]
        exploration_stats_models = cls.get_multi(entity_ids)
        return exploration_stats_models

    @classmethod
    def get_multi_stats_models(cls, exp_version_references):
        """Gets stats model instances for each exploration and the corresponding
        version number.

        Args:
            exp_version_references: list(ExpVersionReference). List of
                ExpVersionReference domain objects.

        Returns:
            list(ExplorationStatsModel|None). Model instances representing the
                given versions or None if it does not exist.
        """
        entity_ids = [
            cls.get_entity_id(
                exp_version_reference.exp_id,
                exp_version_reference.version)
            for exp_version_reference in exp_version_references]
        exploration_stats_models = cls.get_multi(entity_ids)
        return exploration_stats_models

    @classmethod
    def save_multi(cls, exploration_stats_dicts):
        """Creates/Updates multiple ExplorationStatsModel entries.

        Args:
            exploration_stats_dicts: list(dict). The list of dicts where each
                dict represents the attributes of one ExplorationStatsModel
                instance.
        """
        exploration_stats_models = []
        for exploration_stats_dict in exploration_stats_dicts:
            instance_id = cls.get_entity_id(
                exploration_stats_dict['exp_id'],
                exploration_stats_dict['exp_version'])
            stats_instance = cls(
                id=instance_id, exp_id=exploration_stats_dict['exp_id'],
                exp_version=exploration_stats_dict['exp_version'],
                num_starts_v1=exploration_stats_dict['num_starts_v1'],
                num_starts_v2=exploration_stats_dict['num_starts_v2'],
                num_actual_starts_v1=exploration_stats_dict[
                    'num_actual_starts_v1'],
                num_actual_starts_v2=exploration_stats_dict[
                    'num_actual_starts_v2'],
                num_completions_v1=exploration_stats_dict['num_completions_v1'],
                num_completions_v2=exploration_stats_dict['num_completions_v2'],
                state_stats_mapping=exploration_stats_dict[
                    'state_stats_mapping'])
            exploration_stats_models.append(stats_instance)
        cls.put_multi(exploration_stats_models)


class ExplorationAnnotationsModel(base_models.BaseMapReduceBatchResultsModel):
    """Batch model for storing MapReduce calculation output for
    exploration-level statistics.
    This model is keyed using a custom ID of the format
    {[EXPLORATION_ID]:[EXPLORATION_VERSION]}.
    """
    # ID of exploration.
    exploration_id = ndb.StringProperty(indexed=True)
    # Version of exploration.
    version = ndb.StringProperty(indexed=False)
    # Number of students who started the exploration.
    num_starts = ndb.IntegerProperty(indexed=False)
    # Number of students who have completed the exploration.
    num_completions = ndb.IntegerProperty(indexed=False)
    # Keyed by state name that describes the numbers of hits for each state
    # {state_name: {'first_entry_count': ...,
    #               'total_entry_count': ...,
    #               'no_answer_count': ...}}
    state_hit_counts = ndb.JsonProperty(indexed=False)

    @classmethod
    def get_entity_id(cls, exploration_id, exploration_version):
        """Gets entity_id for a batch model based on given exploration state.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of the exploration currently
                being played.

        Returns:
            str. Returns entity_id for a new instance of this class.
        """
        return '%s:%s' % (exploration_id, exploration_version)

    @classmethod
    def create(
            cls, exp_id, version, num_starts, num_completions,
            state_hit_counts):
        """Creates a new ExplorationAnnotationsModel and
        then writes it to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            version: int. Version of exploration.
            num_starts: int. Number of students who started the exploration.
            num_completions: int. Number of students who have completed
                the exploration.
            state_hit_counts: dict. Describes the number of hits
                for each state.
        """
        entity_id = cls.get_entity_id(exp_id, version)
        cls(
            id=entity_id,
            exploration_id=exp_id,
            version=version,
            num_starts=num_starts,
            num_completions=num_completions,
            state_hit_counts=state_hit_counts).put()

    @classmethod
    def get_versions(cls, exploration_id):
        """This function returns a list containing versions of
        ExplorationAnnotationsModel for a specific exploration_id.

        Args:
            exp_id: str. ID of the exploration currently being played.

        Returns:
            list(int). List of versions corresponding to annotation models
                with given exp_id.
        """
        return [
            annotations.version for annotations in cls.get_all().filter(
                cls.exploration_id == exploration_id
            ).fetch(feconf.DEFAULT_QUERY_LIMIT)]


class StateAnswersModel(base_models.BaseModel):
    """Store all answers of a state. This model encapsulates a sharded storage
    system for answers. Multiple entries in the model may contain answers for
    the same state. The initial entry has a shard ID of 0 and contains
    information about how many shards exist for this state. All other meta
    information is duplicated across all shards, since they are immutable or are
    local to that shard.

    This model is keyed using a custom ID of the format
        {[EXPLORATION_ID]:[EXPLORATION_VERSION]:[STATE_NAME]:[SHARD_ID]}.
    """
    # This provides about 124k of padding for the other properties and entity
    # storage overhead (since the max entity size is 1MB). The meta data can
    # get close to 50k or exceed it, so plenty of padding is left to avoid
    # risking overflowing an entity.
    _MAX_ANSWER_LIST_BYTE_SIZE = 900000

    # Explicitly store exploration ID, exploration version and state name
    # so we can easily do queries on them.
    exploration_id = ndb.StringProperty(indexed=True, required=True)
    exploration_version = ndb.IntegerProperty(indexed=True, required=True)
    state_name = ndb.StringProperty(indexed=True, required=True)
    # Which shard this corresponds to in the list of shards. If this is 0 it
    # represents the master shard which includes the shard_count. All other
    # shards look similar to the master shard except they do not populate
    # shard_count.
    shard_id = ndb.IntegerProperty(indexed=True, required=True)
    # Store interaction type to know which calculations should be performed.
    interaction_id = ndb.StringProperty(indexed=True, required=True)
    # Store how many extra shards are associated with this state. This is only
    # present when shard_id is 0. This starts at 0 (the main shard is not
    # counted).
    shard_count = ndb.IntegerProperty(indexed=True, required=False)
    # The total number of bytes needed to store all of the answers in the
    # submitted_answer_list, minus any overhead of the property itself. This
    # value is found by summing the JSON sizes of all answer dicts stored inside
    # submitted_answer_list.
    # pylint: disable=invalid-name
    accumulated_answer_json_size_bytes = ndb.IntegerProperty(
        indexed=False, required=False, default=0)
    # pylint: enable=invalid-name

    # List of answer dicts, each of which is stored as JSON blob. The content
    # of answer dicts is specified in core.domain.stats_domain.StateAnswers.
    submitted_answer_list = ndb.JsonProperty(repeated=True, indexed=False)
    # The version of the submitted_answer_list currently supported by Oppia. If
    # the internal JSON structure of submitted_answer_list changes,
    # CURRENT_SCHEMA_VERSION in this class needs to be incremented.
    schema_version = ndb.IntegerProperty(
        indexed=True, default=feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION)

    @classmethod
    def _get_model(
            cls, exploration_id, exploration_version, state_name, shard_id):
        """Gets model instance based on given exploration state and shard_id.

        Args:
            exploration_id: str. The exploration ID.
            exploration_version: int. The version of the exploration to
                fetch answers for.
            state_name: str. The name of the state to fetch answers for.
            shard_id: int. The ID of the shard to fetch answers for.

        Returns:
            StateAnswersModel. The model associated with the specified
                exploration state and shard ID, or None if no answers
                have been submitted corresponding to this state.
        """
        entity_id = cls._get_entity_id(
            exploration_id, exploration_version, state_name, shard_id)
        return cls.get(entity_id, strict=False)

    @classmethod
    def get_master_model(cls, exploration_id, exploration_version, state_name):
        """Retrieves the master model associated with the specific exploration
        state. Returns None if no answers have yet been submitted to the
        specified exploration state.

        Args:
            exploration_id: str. The exploration ID.
            exploration_version: int. The version of the exploration to fetch
                answers for.
            state_name: str. The name of the state to fetch answers for.

        Returns:
            StateAnswersModel|None. The master model associated with the
                specified exploration state, or None if no answers have been
                submitted to this state.
        """
        main_shard = cls._get_model(
            exploration_id, exploration_version, state_name, 0)
        return main_shard if main_shard else None

    @classmethod
    def get_all_models(cls, exploration_id, exploration_version, state_name):
        """Retrieves all models and shards associated with the specific
        exploration state.

        Args:
            exploration_id: str. The exploration ID.
            exploration_version: int. The version of the exploration to fetch
                answers for.
            state_name: str. The name of the state to fetch answers for.

        Returns:
            list(StateAnswersModel)|None. Returns None if no answers have yet
                been submitted to the specified exploration state.
        """
        # It's okay if this isn't run in a transaction. When adding new shards,
        # it's guaranteed the master shard will be updated at the same time the
        # new shard is added. Shard deletion is not supported. Finally, if a new
        # shard is added after the master shard is retrieved, it will simply be
        # ignored in the result of this function. It will be included during the
        # next call.
        main_shard = cls.get_master_model(
            exploration_id, exploration_version, state_name)

        if main_shard is not None:
            all_models = [main_shard]
            if main_shard.shard_count > 0:
                shard_ids = [
                    cls._get_entity_id(
                        exploration_id, exploration_version, state_name,
                        shard_id)
                    for shard_id in xrange(1, main_shard.shard_count + 1)]
                all_models += cls.get_multi(shard_ids)
            return all_models
        else:
            return None

    @classmethod
    def _insert_submitted_answers_unsafe(
            cls, exploration_id, exploration_version, state_name,
            interaction_id, new_submitted_answer_dict_list):
        """See the insert_submitted_answers for general documentation of what
        this method does. It's only safe to call this method from within a
        transaction.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of exploration.
            state_name: str. Name of current state.
            interaction_id: str. ID of the interaction.
            new_submitted_answer_dict_list: list(dict). List of new submitted
                answers each of which is stored as a JSON blob.
        """
        # The main shard always needs to be retrieved. At most one other shard
        # needs to be retrieved (the last one).
        main_shard = cls.get_master_model(
            exploration_id, exploration_version, state_name)
        last_shard = main_shard

        if not main_shard:
            entity_id = cls._get_entity_id(
                exploration_id, exploration_version, state_name, 0)
            main_shard = cls(
                id=entity_id, exploration_id=exploration_id,
                exploration_version=exploration_version, state_name=state_name,
                shard_id=0, interaction_id=interaction_id, shard_count=0,
                submitted_answer_list=[])
            last_shard = main_shard
        elif main_shard.shard_count > 0:
            last_shard = cls._get_model(
                exploration_id, exploration_version, state_name,
                main_shard.shard_count)

        sharded_answer_lists, sharded_answer_list_sizes = cls._shard_answers(
            last_shard.submitted_answer_list,
            last_shard.accumulated_answer_json_size_bytes,
            new_submitted_answer_dict_list)
        new_shard_count = main_shard.shard_count + (
            len(sharded_answer_lists) - 1)

        # Collect all entities to update to efficiently send them as a single
        # update.
        entities_to_put = []
        last_shard_is_main = main_shard.shard_count == 0

        # Update the last shard if it changed.
        if sharded_answer_list_sizes[0] != (
                last_shard.accumulated_answer_json_size_bytes):
            last_shard.submitted_answer_list = sharded_answer_lists[0]
            last_shard.accumulated_answer_json_size_bytes = (  # pylint: disable=invalid-name
                sharded_answer_list_sizes[0])
            last_shard_updated = True
        else:
            last_shard_updated = False

        # Insert any new shards.
        for i in xrange(1, len(sharded_answer_lists)):
            shard_id = main_shard.shard_count + i
            entity_id = cls._get_entity_id(
                exploration_id, exploration_version, state_name, shard_id)
            new_shard = cls(
                id=entity_id,
                exploration_id=exploration_id,
                exploration_version=exploration_version,
                state_name=state_name,
                shard_id=shard_id,
                interaction_id=interaction_id,
                submitted_answer_list=sharded_answer_lists[i],
                accumulated_answer_json_size_bytes=sharded_answer_list_sizes[i])
            entities_to_put.append(new_shard)

        # Update the shard count if any new shards were added.
        if main_shard.shard_count != new_shard_count:
            main_shard.shard_count = new_shard_count
            main_shard_updated = True
        else:
            main_shard_updated = False

        if last_shard_is_main and (main_shard_updated or last_shard_updated):
            entities_to_put.append(main_shard)
        else:
            if main_shard_updated:
                entities_to_put.append(main_shard)
            if last_shard_updated:
                entities_to_put.append(last_shard)

        cls.put_multi(entities_to_put)

    @classmethod
    def insert_submitted_answers(
            cls, exploration_id, exploration_version, state_name,
            interaction_id, new_submitted_answer_dict_list):
        """Given an exploration ID, version, state name, and interaction ID,
        attempt to insert a list of specified SubmittedAnswers into this model,
        performing sharding operations as necessary. This method automatically
        commits updated/new models to the data store. This method returns
        nothing. This method can guarantee atomicity since mutations are
        performed transactionally, but it cannot guarantee uniqueness for answer
        submission. Answers may be duplicated in cases where a past transaction
        is interrupted and retried. Furthermore, this method may fail with a
        DeadlineExceededError if too many answers are attempted for submission
        simultaneously.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of exploration.
            state_name: str. Name of current state.
            interaction_id: str. ID of the interaction.
            new_submitted_answer_dict_list: list(dict). List of new submitted
                answers each of which is stored as a JSON blob.
        """
        transaction_services.run_in_transaction(
            cls._insert_submitted_answers_unsafe, exploration_id,
            exploration_version, state_name, interaction_id,
            new_submitted_answer_dict_list)

    @classmethod
    def _get_entity_id(
            cls, exploration_id, exploration_version, state_name, shard_id):
        """Returns the entity_id of a StateAnswersModel based on it's
        exp_id, state_name, exploration_version and shard_id.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of exploration.
            state_name: str. Name of current state.
            shard_id: int. ID of shard.

        Returns:
            str. Entity_id for a StateAnswersModel instance.
        """
        return ':'.join([
            exploration_id, str(exploration_version), state_name,
            str(shard_id)])

    @classmethod
    def _shard_answers(
            cls, current_answer_list, current_answer_list_size,
            new_answer_list):
        """Given a current answer list which can fit within one NDB entity and
        a list of new answers which need to try and fit in the current answer
        list, shard the answers such that a list of answer lists are returned.
        The first entry is guaranteed to contain all answers of the current
        answer list.

        Args:
            current_answer_list: list(dict). List of answer dicts each of which
                is stored as JSON blob.
            current_answer_list_size: int. Number of bytes required
                to store all the answers in the current_answer_list.
            new_answer_list: list(dict). List of new submitted answers each of
                which is stored as a JSON blob.

        Returns:
            tuple(list(list(dict)), list(int)).
            Where:
                sharded_answer_lists: A sharded answer list
                    containing list of answer dicts.
                sharded_answer_list_sizes: List where each element corresponds
                    to number of bytes required to store all the
                    answers in the corresponding list of answer dicts
                    in sharded_answer_lists.
        """
        # Sort the new answers to insert in ascending order of their sizes in
        # bytes.
        new_answer_size_list = [
            (answer_dict, cls._get_answer_dict_size(answer_dict))
            for answer_dict in new_answer_list]
        new_answer_list_sorted = sorted(
            new_answer_size_list, key=lambda x: x[1])
        # NOTE TO DEVELOPERS: this list cast is needed because the nested list
        # is appended to later in this function and the list passed into here
        # may be a reference to an answer list stored within a model class.
        sharded_answer_lists = [list(current_answer_list)]
        sharded_answer_list_sizes = [current_answer_list_size]
        for answer_dict, answer_size in new_answer_list_sorted:
            if (sharded_answer_list_sizes[-1] + answer_size <=
                    cls._MAX_ANSWER_LIST_BYTE_SIZE):
                sharded_answer_lists[-1].append(answer_dict)
                sharded_answer_list_sizes[-1] += answer_size
            else:
                sharded_answer_lists.append([answer_dict])
                sharded_answer_list_sizes.append(answer_size)
        return sharded_answer_lists, sharded_answer_list_sizes

    @classmethod
    def _get_answer_dict_size(cls, answer_dict):
        """Returns a size overestimate (in bytes) of the given answer dict.

        Args:
            answer_dict: dict. Answer entered by the user.

        Returns:
            int. Size of the answer_dict.
        """
        return sys.getsizeof(json.dumps(answer_dict))


class StateAnswersCalcOutputModel(base_models.BaseMapReduceBatchResultsModel):
    """Store output of calculation performed on StateAnswers.
    This model is keyed using a custom ID of the format
    {[EXPLORATION_ID]:[EXPLORATION_VERSION]:[STATE_NAME]:[CALCULATION_ID]}.
    """

    exploration_id = ndb.StringProperty(indexed=True, required=True)
    # May be an integral exploration_version or 'all' if this entity represents
    # an aggregation of multiple sets of answers.
    exploration_version = ndb.StringProperty(indexed=True, required=True)
    state_name = ndb.StringProperty(indexed=True, required=True)
    interaction_id = ndb.StringProperty(indexed=True)
    calculation_id = ndb.StringProperty(indexed=True, required=True)
    # Calculation output type (for deserialization). See
    # stats_domain.StateAnswersCalcOutput for an enumeration of valid types.
    calculation_output_type = ndb.StringProperty(indexed=True)
    # Calculation output dict stored as JSON blob.
    calculation_output = ndb.JsonProperty(indexed=False)

    @classmethod
    def create_or_update(
            cls, exploration_id, exploration_version, state_name,
            interaction_id, calculation_id, calculation_output_type,
            calculation_output):
        """Creates or updates StateAnswersCalcOutputModel and then writes
        it to the datastore.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of exploration.
            state_name: str. Name of current state.
            interaction_id: str. ID of the interaction corresponding to the
                calculated output.
            calculation_id: str. ID of the calculation performed.
            calculation_output_type: str. Type of the calculation output.
            calculation_output: dict. Output of the calculation which is to be
                stored as a JSON blob.

        Raises:
            Exception: The calculation_output is too large.
        """
        instance_id = cls._get_entity_id(
            exploration_id, exploration_version, state_name, calculation_id)
        instance = cls.get(instance_id, strict=False)
        if not instance:
            # create new instance.
            instance = cls(
                id=instance_id, exploration_id=exploration_id,
                exploration_version=exploration_version,
                state_name=state_name, interaction_id=interaction_id,
                calculation_id=calculation_id,
                calculation_output_type=calculation_output_type,
                calculation_output=calculation_output)
        else:
            instance.calculation_output = calculation_output

        try:
            # This may fail if calculation_output is too large.
            instance.put()
        except Exception:
            logging.exception(
                'Failed to add calculation output for exploration ID %s, '
                'version %s, state name %s, and calculation ID %s' % (
                    exploration_id, exploration_version,
                    state_name.encode('utf-8'), calculation_id))

    @classmethod
    def get_model(
            cls, exploration_id, exploration_version, state_name,
            calculation_id):
        """Gets entity instance corresponding to the given exploration state.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of exploration.
            state_name: str. Name of current state.
            calculation_id: str. ID of the calculation performed.

        Returns:
            StateAnswersCalcOutputModel. Entity instance associated with the
                given exploration state.
        """
        entity_id = cls._get_entity_id(
            exploration_id, str(exploration_version), state_name,
            calculation_id)
        instance = cls.get(entity_id, strict=False)
        return instance

    @classmethod
    def _get_entity_id(
            cls, exploration_id, exploration_version, state_name,
            calculation_id):
        """Returns entity_id corresponding to the given exploration state.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of exploration.
            state_name: str. Name of current state.
            calculation_id: str. ID of the calculation performed.

        Returns:
            str. The entity ID corresponding to the given exploration state.
        """
        return ':'.join([
            exploration_id, str(exploration_version), state_name,
            calculation_id])
