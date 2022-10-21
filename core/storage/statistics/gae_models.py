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

from __future__ import annotations

import datetime
import json
import sys

from core import feconf
from core import utils
from core.platform import models

from typing import Dict, Final, List, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    # TODO(#13594): After the domain layer is refactored to be independent of
    # the storage layer, the disable=invalid-import will
    # be removed.
    # The following import is dangerous and should not be generally
    # used. We had to use this ignore as we need to import the domain layer
    # for type-annotation and we have not imported them globally but inside
    # this if block to prevent circular imports.
    from core.domain import exp_domain # isort:skip # pylint: disable=invalid-import,unused-import,ungrouped-imports
    from core.domain import stats_domain # isort:skip # pylint: disable=invalid-import,unused-import,ungrouped-imports
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import transaction_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

CURRENT_ACTION_SCHEMA_VERSION: Final = 1
CURRENT_ISSUE_SCHEMA_VERSION: Final = 1

ACTION_TYPE_EXPLORATION_START: Final = 'ExplorationStart'
ACTION_TYPE_ANSWER_SUBMIT: Final = 'AnswerSubmit'
ACTION_TYPE_EXPLORATION_QUIT: Final = 'ExplorationQuit'

ISSUE_TYPE_EARLY_QUIT: Final = 'EarlyQuit'
ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS: Final = (
    'MultipleIncorrectSubmissions'
)
ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS: Final = 'CyclicStateTransitions'

# Types of allowed issues.
ALLOWED_ISSUE_TYPES: Final = [
    ISSUE_TYPE_EARLY_QUIT,
    ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS,
    ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS
]
# Types of allowed learner actions.
ALLOWED_ACTION_TYPES: Final = [
    ACTION_TYPE_EXPLORATION_START,
    ACTION_TYPE_ANSWER_SUBMIT,
    ACTION_TYPE_EXPLORATION_QUIT
]

# The entity types for which the LearnerAnswerDetailsModel instance
# can be created.
ALLOWED_ENTITY_TYPES: Final = [
    feconf.ENTITY_TYPE_EXPLORATION, feconf.ENTITY_TYPE_QUESTION
]


class StateCounterModel(base_models.BaseModel):
    """A set of counts that correspond to a state.

    The ID/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_NAME].
    """

    # Number of times the state was entered for the first time in a reader
    # session.
    first_entry_count = (
        datastore_services.IntegerProperty(default=0, indexed=False))
    # Number of times the state was entered for the second time or later in a
    # reader session.
    subsequent_entries_count = (
        datastore_services.IntegerProperty(default=0, indexed=False))
    # Number of times an answer submitted for this state was subsequently
    # resolved by an exploration admin and removed from the answer logs.
    resolved_answer_count = (
        datastore_services.IntegerProperty(default=0, indexed=False))
    # Number of times an answer was entered for this state and was not
    # subsequently resolved by an exploration admin.
    active_answer_count = (
        datastore_services.IntegerProperty(default=0, indexed=False))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_or_create(
        cls, exploration_id: str, state_name: str
    ) -> StateCounterModel:
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

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user.."""
        return dict(super(cls, cls).get_export_policy(), **{
            'first_entry_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subsequent_entries_count':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'resolved_answer_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'active_answer_count': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class AnswerSubmittedEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student submitting an answer."""

    # Id of exploration currently being played.
    exp_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = datastore_services.FloatProperty()
    # Whether the submitted answer received useful feedback.
    is_feedback_useful = datastore_services.BooleanProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[exp_id]:[session_id]'.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls,
            exp_id: str,
            exp_version: int,
            state_name: str,
            session_id: str,
            time_spent_in_state_secs: float,
            is_feedback_useful: bool
    ) -> str:
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
            is_feedback_useful=is_feedback_useful,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        answer_submitted_event_entity.update_timestamps()
        answer_submitted_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'is_feedback_useful': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class ExplorationActualStartEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student entering an exploration. In this context,
    'actually' entering an exploration means the student has completed the
    initial state of the exploration and traversed to the second state.
    """

    # Id of exploration currently being played.
    exp_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[exp_id]:[session_id]'.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls,
            exp_id: str,
            exp_version: int,
            state_name: str,
            session_id: str
    ) -> str:
        """Creates a new actual exploration start event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        actual_start_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        actual_start_event_entity.update_timestamps()
        actual_start_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class SolutionHitEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student triggering the solution."""

    # Id of exploration currently being played.
    exp_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = datastore_services.FloatProperty()
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[exp_id]:[session_id]'.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls,
            exp_id: str,
            exp_version: int,
            state_name: str,
            session_id: str,
            time_spent_in_state_secs: float
    ) -> str:
        """Creates a new solution hit event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        solution_hit_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_state_secs,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        solution_hit_event_entity.update_timestamps()
        solution_hit_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    event_type = datastore_services.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    client_time_spent_in_secs = datastore_services.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = datastore_services.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = datastore_services.StringProperty(
        indexed=True, choices=[
            feconf.PLAY_TYPE_PLAYTEST, feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
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

    # In the type annotation below, Dict[str, str] is used for 'params'.
    # This is due to lack of information about the possible values for 'params'.
    # If you're working with this part of the code in the future and find that
    # the type for 'params' is incorrect, please go ahead and change it, and
    # feel free to remove this comment once you've done so.
    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        params: Dict[str, str],
        play_type: str,
        unused_version: int = 1
    ) -> str:
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

        Returns:
            str. The ID of the entity.
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
            play_type=play_type,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        start_event_entity.update_timestamps()
        start_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'client_time_spent_in_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    event_type = datastore_services.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    # Note: Some of these events were migrated from StateHit event instances
    # which did not record timestamp data. For this, we use a placeholder
    # value of 0.0 for client_time_spent_in_secs.
    client_time_spent_in_secs = datastore_services.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = datastore_services.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = datastore_services.StringProperty(
        indexed=True, choices=[
            feconf.PLAY_TYPE_PLAYTEST, feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
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

    # In the type annotation below, Dict[str, str] is used for 'params'.
    # This is due to lack of information about the possible values for 'params'.
    # If you're working with this part of the code in the future and find that
    # the type for 'params' is incorrect, please go ahead and change it, and
    # feel free to remove this comment once you've done so.
    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        client_time_spent_in_secs: float,
        params: Dict[str, str],
        play_type: str
    ) -> str:
        """Creates a new leave exploration event and then writes it
        to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exp_version: int. Version of exploration.
            state_name: str. Name of current state.
            session_id: str. ID of current student's session.
            client_time_spent_in_secs: float. Time since start of this
                state before this event occurred.
            params: dict. Current parameter values, map of parameter name
                to value.
            play_type: str. Type of play-through.

        Returns:
            str. New unique ID for this entity instance.
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
            play_type=play_type,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        leave_event_entity.update_timestamps()
        leave_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'client_time_spent_in_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    event_type = datastore_services.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    # Note: Some of these events were migrated from StateHit event instances
    # which did not record timestamp data. For this, we use a placeholder
    # value of 0.0 for client_time_spent_in_secs.
    client_time_spent_in_secs = datastore_services.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = datastore_services.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = datastore_services.StringProperty(
        indexed=True, choices=[
            feconf.PLAY_TYPE_PLAYTEST, feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
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

    # In the type annotation below, Dict[str, str] is used for 'params'.
    # This is due to lack of information about the possible values for 'params'.
    # If you're working with this part of the code in the future and find that
    # the type for 'params' is incorrect, please go ahead and change it, and
    # feel free to remove this comment once you've done so.
    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        client_time_spent_in_secs: float,
        params: Dict[str, str],
        play_type: str
    ) -> str:
        """Creates a new exploration completion event and then writes it
        to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            exp_version: int. Version of exploration.
            state_name: str. Name of current state.
            session_id: str. ID of current student's session.
            client_time_spent_in_secs: float. Time since start of this
                state before this event occurred.
            params: dict. Current parameter values, map of parameter name
                to value.
            play_type: str. Type of play-through.

        Returns:
            str. The ID of the entity.
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
            play_type=play_type,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        complete_event_entity.update_timestamps()
        complete_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'client_time_spent_in_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    event_type = datastore_services.StringProperty(indexed=True)
    # Id of exploration which has been rated.
    exploration_id = datastore_services.StringProperty(indexed=True)
    # Value of rating assigned.
    rating = datastore_services.IntegerProperty(indexed=True)
    # Value of rating previously assigned by the same user. Will be None when a
    # user rates an exploration for the first time.
    old_rating = datastore_services.IntegerProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, user_id: str) -> str:
        """Generates entity ID for a new rate exploration event based on its
        exploration_id and user_id of the learner.

        Args:
            exp_id: str. ID of the exploration currently being played.
            user_id: str. ID of the user.

        Returns:
            str. New unique ID for this entity instance.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            user_id))

    @classmethod
    def create(
        cls,
        exp_id: str,
        user_id: str,
        rating: int,
        old_rating: Optional[int]
    ) -> str:
        """Creates a new rate exploration event and then writes it to the
        datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            user_id: str. ID of the user.
            rating: int. Value of rating assigned to exploration.
            old_rating: int or None. Will be None if the user rates an
                exploration for the first time.

        Returns:
            str. New unique ID for this entity instance.
        """
        entity_id = cls.get_new_event_entity_id(
            exp_id, user_id)
        cls(
            id=entity_id,
            event_type=feconf.EVENT_TYPE_RATE_EXPLORATION,
            exploration_id=exp_id,
            rating=rating,
            old_rating=old_rating,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION
        ).put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rating': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'old_rating': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    event_type = datastore_services.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Current parameter values, map of parameter name to value.
    params = datastore_services.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = datastore_services.StringProperty(
        indexed=True, choices=[
            feconf.PLAY_TYPE_PLAYTEST, feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
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

    # In the type annotation below, Dict[str, str] is used for 'params'.
    # This is due to lack of information about the possible values for 'params'.
    # If you're working with this part of the code in the future and find that
    # the type for 'params' is incorrect, please go ahead and change it, and
    # feel free to remove this comment once you've done so.
    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        params: Dict[str, str],
        play_type: str
    ) -> str:
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

        Returns:
            str. The ID of the entity.
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
            play_type=play_type,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        state_event_entity.update_timestamps()
        state_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class StateCompleteEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student completing a state."""

    # Id of exploration currently being played.
    exp_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = datastore_services.FloatProperty()
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[exp_id]:[session_id]'.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent_in_state_secs: float
    ) -> str:
        """Creates a new state complete event."""
        entity_id = cls.get_new_event_entity_id(
            exp_id, session_id)
        state_finish_event_entity = cls(
            id=entity_id,
            exp_id=exp_id,
            exp_version=exp_version,
            state_name=state_name,
            session_id=session_id,
            time_spent_in_state_secs=time_spent_in_state_secs,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        state_finish_event_entity.update_timestamps()
        state_finish_event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class LeaveForRefresherExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student leaving for a refresher exploration."""

    # ID of exploration currently being played.
    exp_id = datastore_services.StringProperty(indexed=True)
    # ID of the refresher exploration.
    refresher_exp_id = datastore_services.StringProperty(indexed=True)
    # Current version of exploration.
    exp_version = datastore_services.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = datastore_services.StringProperty(indexed=True)
    # ID of current student's session.
    session_id = datastore_services.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    time_spent_in_state_secs = datastore_services.FloatProperty()
    # The version of the event schema used to describe an event of this type.
    event_schema_version = datastore_services.IntegerProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, exp_id: str, session_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[exp_id]:[session_id]'.
        """
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
        cls,
        exp_id: str,
        refresher_exp_id: str,
        exp_version: int,
        state_name: str,
        session_id: str,
        time_spent_in_state_secs: float
    ) -> str:
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
            time_spent_in_state_secs=time_spent_in_state_secs,
            event_schema_version=feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)
        leave_for_refresher_exp_entity.update_timestamps()
        leave_for_refresher_exp_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'refresher_exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })


class ExplorationStatsModel(base_models.BaseModel):
    """Model for storing analytics data for an exploration. This model contains
    statistics data aggregated from version 1 to the version given in the key.

    The ID of instances of this class has the form [exp_id].[exp_version].
    """

    # NOTE TO DEVELOPERS: The method save_multi() was removed in #13021 as part
    # of the migration to Apache Beam. Please refer to that PR if you need to
    # reinstate it.

    # ID of exploration.
    exp_id = datastore_services.StringProperty(indexed=True)
    # Version of exploration.
    exp_version = datastore_services.IntegerProperty(indexed=True)
    # Number of learners starting the exploration (v1 - data collected before
    # Dec 2017).
    num_starts_v1 = datastore_services.IntegerProperty(indexed=True)
    num_starts_v2 = datastore_services.IntegerProperty(indexed=True)
    # Number of students who actually attempted the exploration. Only learners
    # who spent a minimum time on the exploration are considered to have
    # actually started the exploration (v1 - data collected before Dec 2017).
    num_actual_starts_v1 = datastore_services.IntegerProperty(indexed=True)
    num_actual_starts_v2 = datastore_services.IntegerProperty(indexed=True)
    # Number of students who completed the exploration (v1 - data collected
    # before Dec 2017).
    num_completions_v1 = datastore_services.IntegerProperty(indexed=True)
    num_completions_v2 = datastore_services.IntegerProperty(indexed=True)
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
    state_stats_mapping = datastore_services.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_entity_id(cls, exp_id: str, exp_version: int) -> str:
        """Generates an ID for the instance of the form
        '[exp_id].[exp_version]'.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            str. ID of the new ExplorationStatsModel instance.
        """
        return '%s.%s' % (exp_id, exp_version)

    @classmethod
    def get_model(
        cls, exp_id: str, exp_version: int
    ) -> Optional[ExplorationStatsModel]:
        """Retrieves ExplorationStatsModel given exploration ID and version.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            ExplorationStatsModel|None. Exploration analytics model instance in
            datastore, or None if no such model instance exists.
        """
        instance_id = cls.get_entity_id(exp_id, exp_version)
        exploration_stats_model = cls.get(instance_id, strict=False)
        return exploration_stats_model

    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        num_starts_v1: int,
        num_starts_v2: int,
        num_actual_starts_v1: int,
        num_actual_starts_v2: int,
        num_completions_v1: int,
        num_completions_v2: int,
        state_stats_mapping: Dict[str, Dict[str, int]]
    ) -> str:
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
        stats_instance.update_timestamps()
        stats_instance.put()
        return instance_id

    @classmethod
    def get_multi_versions(
        cls, exp_id: str, version_numbers: List[int]
    ) -> List[Optional[ExplorationStatsModel]]:
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
    def get_multi_stats_models(
        cls, exp_version_references: List[exp_domain.ExpVersionReference]
    ) -> List[Optional[ExplorationStatsModel]]:
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

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_starts_v1': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_starts_v2': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_actual_starts_v1': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_actual_starts_v2': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_completions_v1': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_completions_v2': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_stats_mapping': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class ExplorationIssuesModel(base_models.BaseModel):
    """Model for storing the list of playthroughs for an exploration grouped by
    issues.
    """

    # ID of exploration.
    exp_id = datastore_services.StringProperty(indexed=True, required=True)
    # Version of exploration.
    exp_version = (
        datastore_services.IntegerProperty(indexed=True, required=True))
    # The unresolved issues for this exploration. This will be a list of dicts
    # where each dict represents an issue along with the associated
    # playthroughs.
    unresolved_issues = datastore_services.JsonProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_entity_id(cls, exp_id: str, exp_version: int) -> str:
        """Generates an ID for the instance of the form
        [exp_id].[exp_version].

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            str. ID of the new ExplorationIssuesModel instance.
        """
        return '%s.%s' % (exp_id, exp_version)

    @classmethod
    def get_model(
            cls, exp_id: str, exp_version: int
    ) -> Optional[ExplorationIssuesModel]:
        """Retrieves ExplorationIssuesModel given exploration ID and version.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            ExplorationIssuesModel|None. Exploration issues model instance in
            datastore, or None if no such model instance exists.
        """
        instance_id = cls.get_entity_id(exp_id, exp_version)
        return cls.get(instance_id, strict=False)

    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        unresolved_issues: List[stats_domain.ExplorationIssueDict]
    ) -> str:
        """Creates an ExplorationIssuesModel instance and writes it to the
        datastore.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            unresolved_issues: list(dict). The unresolved issues for this
                exploration. This will be a list of dicts where each dict
                represents an issue along with the associated playthroughs.

        Returns:
            str. ID of the new ExplorationIssuesModel instance.
        """
        instance_id = cls.get_entity_id(exp_id, exp_version)
        exp_issues_instance = cls(
            id=instance_id, exp_id=exp_id, exp_version=exp_version,
            unresolved_issues=unresolved_issues)
        exp_issues_instance.update_timestamps()
        exp_issues_instance.put()
        return instance_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """All playthrough issue data is anonymized and contains no data
        directly corresponding to users. For specifics on the data included in
        this model, see:
        https://github.com/oppia/oppia/tree/develop/extensions/issues.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'unresolved_issues': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })


class PlaythroughModel(base_models.BaseModel):
    """Model for storing recorded useful playthrough data in the datastore.

    The ID of instances of this class are of the form
    '[exp_id].[random hash of 16 chars]'.
    """

    # ID of the exploration.
    exp_id = datastore_services.StringProperty(indexed=True, required=True)
    # Version of the exploration.
    exp_version = (
        datastore_services.IntegerProperty(indexed=True, required=True))
    # Type of the issue.
    issue_type = datastore_services.StringProperty(
        indexed=True, required=True, choices=ALLOWED_ISSUE_TYPES)
    # The customization args dict for the given issue_type.
    issue_customization_args = datastore_services.JsonProperty(required=True)
    # The playthrough actions for this playthrough. This will be a list of dicts
    # where each dict represents a single playthrough action. The list is
    # ordered by the time of occurence of the action.
    actions = datastore_services.JsonProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """All playthrough data is anonymized and contains no data directly
        corresponding to users. For specifics on the data included in this
        model, see:
        https://github.com/oppia/oppia/tree/develop/extensions/actions.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def _generate_id(cls, exp_id: str) -> str:
        """Generates a unique id for the playthrough of the form
        '[exp_id].[random hash of 16 chars]'.

        Args:
            exp_id: str. ID of the exploration.

        Returns:
            str. ID of the new PlaythroughModel instance.

        Raises:
            Exception. The id generator for PlaythroughModel is producing too
                many collisions.
        """

        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                exp_id,
                utils.convert_to_hash(
                    str(utils.get_random_int(base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for PlaythroughModel is producing too many '
            'collisions.')

    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        issue_type: str,
        issue_customization_args: (
            stats_domain.IssuesCustomizationArgsDictType
        ),
        actions: List[stats_domain.LearnerActionDict]
    ) -> str:
        """Creates a PlaythroughModel instance and writes it to the
        datastore.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            issue_type: str. Type of the issue.
            issue_customization_args: dict. The customization args dict for the
                given issue_type.
            actions: list(dict). The playthrough actions for this playthrough.
                This will be a list of dicts where each dict represents a single
                playthrough action. The list is ordered by the time of occurence
                of the action.

        Returns:
            str. ID of the new PlaythroughModel instance.
        """
        instance_id = cls._generate_id(exp_id)
        cls(
            id=instance_id, exp_id=exp_id, exp_version=exp_version,
            issue_type=issue_type,
            issue_customization_args=issue_customization_args,
            actions=actions).put()
        return instance_id

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(PlaythroughModel, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'issue_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'issue_customization_args': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'actions': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class LearnerAnswerDetailsModel(base_models.BaseModel):
    """Model for storing the answer details that a learner enters when they
    are asked for an explanation of their answer. Currently, the model supports
    exploration states and questions. One instance of this model is created for
    each of these objects.
    The id of this model instance is 'entity_id:state_reference' which is
    generated by the get_instance_id function.
    """

    # The reference to the state for which model instance is created.
    # For exploration state the state reference is of the form
    # 'exp_id':'state_name', while for question state reference is of the form
    # 'question_id' as currently the one question holds only one state.
    state_reference = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The type of entity e.g "exploration" or "question".
    entity_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=ALLOWED_ENTITY_TYPES)
    # The id of the interaction for which the answer details were received.
    interaction_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # List of LearnerAnswerInfo dicts, which is defined in
    # stats_domain.py, each dict corresponds to a single answer info of
    # learner.
    learner_answer_info_list = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # The schema version of the LearnerAnswerInfo dict. If the
    # LearnerAnswerInfo schema changes in future this needs to be incremented.
    learner_answer_info_schema_version = datastore_services.IntegerProperty(
        indexed=True, default=(
            feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION))
    # The total number of bytes needed to store all of the answers in the
    # learner_answer_info_list. This value is found by summing the JSON
    # sizes of all answer info dicts stored inside learner_answer_info_list.
    accumulated_answer_info_json_size_bytes = (
        datastore_services.IntegerProperty(
            indexed=True, required=False, default=0))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_state_reference_for_exploration(
            cls, exp_id: str, state_name: str
    ) -> str:
        """Generate the state_reference for the state in an exploration.

        Args:
            exp_id: str. The id of the exploration.
            state_name: str. The name of the state.

        Returns:
            str. The state_reference for a new instance of this class.
        """
        return '%s:%s' % (exp_id, state_name)

    @classmethod
    def get_state_reference_for_question(cls, question_id: str) -> str:
        """Generate the state_reference for the state in the question.

        Args:
            question_id: str. The id of the question.

        Returns:
            str. The state_reference for a new instance of this class.
        """
        return question_id

    @classmethod
    def get_instance_id(cls, entity_type: str, state_reference: str) -> str:
        """Generates the id for the newly created model instance.

        Args:
            entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION
                or ENTITY_TYPE_QUESTION which are declared in feconf.py.
            state_reference: str. The reference to the state for which model
                instance is being created. For exploration state it will be of
                the form 'exp_id:state_name', and for question it will be of
                the form 'question_id'.

        Returns:
            instance_id: str. The  generated id of the instance.
        """
        instance_id = (
            '%s:%s' % (entity_type, state_reference))
        return instance_id

    # TODO(#13523): Change 'learner_answer_info_list' to TypedDict/Domain Object
    # to remove Any used below.
    @classmethod
    def create_model_instance(
        cls,
        entity_type: str,
        state_reference: str,
        interaction_id: str,
        learner_answer_info_list: List[stats_domain.LearnerAnswerInfo],
        learner_answer_info_schema_version: int,
        accumulated_answer_info_json_size_bytes: int
    ) -> None:
        """Creates a new LearnerAnswerDetailsModel for the given entity type
        then writes it to the datastore.

        Args:
            entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION
                or ENTITY_TYPE_QUESTION which are declared in feconf.py.
            state_reference: str. The reference to the state for which model
                instance is being created. For exploration state it will be of
                the form 'exp_id:state_name', and for question it will be of
                the form 'question_id'.
            interaction_id: str. The ID of the interaction for which the
                answer details are received.
            learner_answer_info_list: list(LearnerAnswerInfo). The list of
                LearnerAnswerInfo objects in dict format, which is defined in
                the stats_domain.
            learner_answer_info_schema_version: int. The version of
                LearnerAnswerInfo dict, which is currently supported by
                the Oppia.
            accumulated_answer_info_json_size_bytes: int. The size of the
                learner_answer_info_list in bytes.
        """
        instance_id = cls.get_instance_id(entity_type, state_reference)
        answer_details_instance = cls(
            id=instance_id,
            entity_type=entity_type,
            state_reference=state_reference,
            interaction_id=interaction_id,
            learner_answer_info_list=[
                learner_answer_info.to_dict()
                for learner_answer_info in learner_answer_info_list
            ],
            learner_answer_info_schema_version=(
                learner_answer_info_schema_version),
            accumulated_answer_info_json_size_bytes=(
                accumulated_answer_info_json_size_bytes))
        answer_details_instance.update_timestamps()
        answer_details_instance.put()

    @classmethod
    def get_model_instance(
        cls, entity_type: str, state_reference: str
    ) -> Optional[LearnerAnswerDetailsModel]:
        """Returns the model instance related to the entity type and
        state reference.

        Args:
            entity_type: str. The type of entity i.e ENTITY_TYPE_EXPLORATION
                or ENTITY_TYPE_QUESTION which are declared in feconf.py.
            state_reference: str. The reference to a state, for which the model
                is to be fetched. Foe exploration state it will be of the form
                'exp_id:state_name', and for question state it will be of the
                form 'question_id'.

        Returns:
            LearnerAnswerDetailsModel or None. The answer details model
            associated with the given entity type and state reference or
            None if the instance is not found. Doesn't include deleted
            entries.
        """
        instance_id = cls.get_instance_id(entity_type, state_reference)
        return cls.get(instance_id, strict=False)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'state_reference': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'learner_answer_info_list':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'learner_answer_info_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'accumulated_answer_info_json_size_bytes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class ExplorationAnnotationsModel(base_models.BaseMapReduceBatchResultsModel):
    """Batch model for storing MapReduce calculation output for
    exploration-level statistics.
    This model is keyed using a custom ID of the format
    {[EXPLORATION_ID]:[EXPLORATION_VERSION]}.
    """

    # ID of exploration.
    exploration_id = datastore_services.StringProperty(indexed=True)
    # TODO(#13614): Determine whether ExplorationAnnotationsModel can be
    # updated to use an int type for the 'version' instead,
    # and update existing datastore models if needed.
    # Version of exploration.
    version = datastore_services.StringProperty(indexed=True)
    # Number of students who started the exploration.
    num_starts = datastore_services.IntegerProperty(indexed=False)
    # Number of students who have completed the exploration.
    num_completions = datastore_services.IntegerProperty(indexed=False)
    # Keyed by state name that describes the numbers of hits for each state
    # {state_name: {'first_entry_count': ...,
    #               'total_entry_count': ...,
    #               'no_answer_count': ...}}
    state_hit_counts = datastore_services.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_entity_id(
            cls, exploration_id: str, exploration_version: int
    ) -> str:
        """Gets entity_id for a batch model based on given exploration state.

        Args:
            exploration_id: str. ID of the exploration currently being played.
            exploration_version: int. Version of the exploration currently
                being played.

        Returns:
            str. Returns entity_id for a new instance of this class.
        """
        return '%s:%s' % (exploration_id, exploration_version)

    @classmethod
    def create(
        cls,
        exp_id: str,
        version: str,
        num_starts: int,
        num_completions: int,
        state_hit_counts: Dict[str, int]
    ) -> None:
        """Creates a new ExplorationAnnotationsModel and
        then writes it to the datastore.

        Args:
            exp_id: str. ID of the exploration currently being played.
            version: str. Version of exploration.
            num_starts: int. Number of students who started the exploration.
            num_completions: int. Number of students who have completed
                the exploration.
            state_hit_counts: dict. Describes the number of hits
                for each state.
        """
        entity_id = cls.get_entity_id(exp_id, int(version))
        cls(
            id=entity_id,
            exploration_id=exp_id,
            version=version,
            num_starts=num_starts,
            num_completions=num_completions,
            state_hit_counts=state_hit_counts).put()

    @classmethod
    def get_versions(cls, exploration_id: str) -> List[str]:
        """This function returns a list containing versions of
        ExplorationAnnotationsModel for a specific exploration_id.

        Args:
            exploration_id: str. ID of the exploration currently being played.

        Returns:
            list(str). List of versions corresponding to annotation models
            with given exp_id.
        """
        annotations_result: Sequence[ExplorationAnnotationsModel] = (
            cls.get_all().filter(
                cls.exploration_id == exploration_id
            ).fetch(feconf.DEFAULT_QUERY_LIMIT)
        )
        return [annotations.version for annotations in annotations_result]

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_starts': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_completions': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_hit_counts': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


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
    exploration_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    exploration_version = (
        datastore_services.IntegerProperty(indexed=True, required=True))
    state_name = datastore_services.StringProperty(indexed=True, required=True)
    # Which shard this corresponds to in the list of shards. If this is 0 it
    # represents the master shard which includes the shard_count. All other
    # shards look similar to the master shard except they do not populate
    # shard_count.
    shard_id = datastore_services.IntegerProperty(indexed=True, required=True)
    # Store interaction type to know which calculations should be performed.
    interaction_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Store how many extra shards are associated with this state. This is only
    # present when shard_id is 0. This starts at 0 (the main shard is not
    # counted).
    shard_count = (
        datastore_services.IntegerProperty(indexed=True, required=False))
    # The total number of bytes needed to store all of the answers in the
    # submitted_answer_list, minus any overhead of the property itself. This
    # value is found by summing the JSON sizes of all answer dicts stored inside
    # submitted_answer_list.
    accumulated_answer_json_size_bytes = datastore_services.IntegerProperty(
        indexed=False, required=False, default=0)

    # List of answer dicts, each of which is stored as JSON blob. The content
    # of answer dicts is specified in core.domain.stats_domain.StateAnswers.
    # NOTE: The answers stored in submitted_answers_list must be sorted
    # according to the chronological order of their submission otherwise
    # TopNUnresolvedAnswersByFrequency calculation in
    # InteractionAnswerSummariesAggregator will output invalid results.
    submitted_answer_list = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # The version of the submitted_answer_list currently supported by Oppia. If
    # the internal JSON structure of submitted_answer_list changes,
    # CURRENT_SCHEMA_VERSION in this class needs to be incremented.
    schema_version = datastore_services.IntegerProperty(
        indexed=True, default=feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def _get_model(
        cls,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        shard_id: int
    ) -> Optional[StateAnswersModel]:
        """Gets model instance based on given exploration state and shard_id.

        Args:
            exploration_id: str. The exploration ID.
            exploration_version: int. The version of the exploration to
                fetch answers for.
            state_name: str. The name of the state to fetch answers for.
            shard_id: int. The ID of the shard to fetch answers for.

        Returns:
            StateAnswersModel|None. The model associated with the specified
            exploration state and shard ID, or None if no answers
            have been submitted corresponding to this state.
        """
        entity_id = cls._get_entity_id(
            exploration_id, exploration_version, state_name, shard_id)
        return cls.get(entity_id, strict=False)

    @classmethod
    def get_master_model(
        cls,
        exploration_id: str,
        exploration_version: int,
        state_name: str
    ) -> Optional[StateAnswersModel]:
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
    def get_all_models(
        cls, exploration_id: str, exploration_version: int, state_name: str
    ) -> Optional[List[StateAnswersModel]]:
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
                    for shard_id in range(
                        1, main_shard.shard_count + 1)]
                state_answer_models = cls.get_multi(shard_ids)
                for state_answer_model in state_answer_models:
                    # Filtering out the None cases for MyPy type checking,
                    # because shard deletion is not supported and we expect
                    # main_shard.shard_count to be present, since the master
                    # model keeps track of the number of shards explicitly.
                    assert state_answer_model is not None
                    all_models.append(state_answer_model)
            return all_models
        else:
            return None

    @classmethod
    @transaction_services.run_in_transaction_wrapper
    def _insert_submitted_answers_unsafe_transactional(
        cls,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        interaction_id: str,
        new_submitted_answer_dict_list: List[
            stats_domain.SubmittedAnswerDict
        ]
    ) -> None:
        """See the insert_submitted_answers for general documentation of what
        this method does. It's only safe to call this method from within a
        transaction.

        NOTE: The answers stored in submitted_answers_list must be sorted
        according to the chronological order of their submission otherwise
        TopNUnresolvedAnswersByFrequency calculation in
        InteractionAnswerSummariesAggregator will output invalid results.

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

        # Ruling out the possibility of None for mypy type checking.
        assert last_shard is not None
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
        for i in range(1, len(sharded_answer_lists)):
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

        cls.update_timestamps_multi(entities_to_put)
        cls.put_multi(entities_to_put)

    @classmethod
    def insert_submitted_answers(
        cls,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        interaction_id: str,
        new_submitted_answer_dict_list: List[
            stats_domain.SubmittedAnswerDict
        ]
    ) -> None:
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
        cls._insert_submitted_answers_unsafe_transactional(
            exploration_id, exploration_version, state_name,
            interaction_id, new_submitted_answer_dict_list)

    @classmethod
    def _get_entity_id(
        cls,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        shard_id: int
    ) -> str:
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
            exploration_id,
            str(exploration_version),
            state_name,
            str(shard_id)
        ])

    @classmethod
    def _shard_answers(
        cls,
        current_answer_list: List[stats_domain.SubmittedAnswerDict],
        current_answer_list_size: int,
        new_answer_list: List[stats_domain.SubmittedAnswerDict]
    ) -> Tuple[List[List[stats_domain.SubmittedAnswerDict]], List[int]]:
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
    def _get_answer_dict_size(
        cls, answer_dict: stats_domain.SubmittedAnswerDict
    ) -> int:
        """Returns a size overestimate (in bytes) of the given answer dict.

        Args:
            answer_dict: dict. Answer entered by the user.

        Returns:
            int. Size of the answer_dict.
        """
        return sys.getsizeof(json.dumps(answer_dict))

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'shard_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'shard_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'accumulated_answer_json_size_bytes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'submitted_answer_list': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class StateAnswersCalcOutputModel(base_models.BaseMapReduceBatchResultsModel):
    """Store output of calculation performed on StateAnswers.
    This model is keyed using a custom ID of the format
    {[EXPLORATION_ID]:[EXPLORATION_VERSION]:[STATE_NAME]:[CALCULATION_ID]}.
    """

    # NOTE TO DEVELOPERS: The methods create_or_update() and get_model() were
    # removed in #13021 as part of the migration to Apache Beam. Please refer to
    # that PR if you need to reinstate them.

    exploration_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    # May be an integral exploration_version or 'all' if this entity represents
    # an aggregation of multiple sets of answers.
    exploration_version = (
        datastore_services.StringProperty(indexed=True, required=True))
    state_name = datastore_services.StringProperty(indexed=True, required=True)
    interaction_id = datastore_services.StringProperty(indexed=True)
    calculation_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Calculation output type (for deserialization). See
    # stats_domain.StateAnswersCalcOutput for an enumeration of valid types.
    calculation_output_type = datastore_services.StringProperty(indexed=True)
    # Calculation output dict stored as JSON blob.
    calculation_output = datastore_services.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'calculation_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'calculation_output_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'calculation_output': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
