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
import logging
import operator

from core.platform import models
import feconf
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])
transaction_services = models.Registry.import_transaction_services()

# TODO(bhenning): Everything is handler name submit; therefore, it is
# pointless and should be removed.
_OLD_SUBMIT_HANDLER_NAME = 'submit'


class StateCounterModel(base_models.BaseModel):
    """A set of counts that correspond to a state.

    The id/key of instances of this class has the form
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
        instance_id = '.'.join([exploration_id, state_name])
        counter = cls.get(instance_id, strict=False)
        if not counter:
            counter = cls(id=instance_id)
        return counter


class StateRuleAnswerLogModel(base_models.BaseModel):
    """The log of all answers hitting a given state rule.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_NAME].[HANDLER_NAME].[RULE_NAME]

    WARNING: If a change is made to existing rules in data/objects (e.g.
    renaming them or changing their signature), this class will contain
    invalid values.

    WARNING: Rule names and args that are used to construct the key here must
    be < 400 characters in length, since these are used as part of the key.
    """
    # Log of answers that hit this rule and that have not been resolved. The
    # JSON blob represents a dict. The keys of this dict are the answers
    # encoded as HTML strings, and the values are integer counts representing
    # how many times the answer has been entered.
    # WARNING: do not use default={} in JsonProperty, it does not work as you
    # expect.
    answers = ndb.JsonProperty(indexed=False)

    @classmethod
    def get_or_create(cls, exploration_id, state_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_or_create_multi_for_multi_explorations(
            [(exploration_id, state_name)], [rule_str])[0][0]

    @classmethod
    def _get_entity_key(cls, unused_exploration_id, entity_id):
        return ndb.Key(cls._get_kind(), entity_id)

    @classmethod
    def get_or_create_multi_for_multi_explorations(
            cls, exploration_state_list, rule_str_list):
        """Gets entities given a list of exploration ID and state name tuples,
        and a list of rule spec strings to filter answers matched for each of
        the given explorations and states. Returns a list containing a list of
        matched entities for each input exploration ID-state name tuple.

        Args:
            exploration_state_list: a list of exploration ID and state name
                tuples
            rule_str_list: a list of rule spec strings which are used to filter
                the answers matched to the provided explorations and states
        """
        # TODO(sll): Use a hash instead to disambiguate.
        exploration_ids = []
        state_names = []
        entity_ids = []
        for exploration_id, state_name in exploration_state_list:
            for rule_str in rule_str_list:
                exploration_ids.append(exploration_id)
                state_names.append(state_name)
                entity_ids.append('.'.join([
                    exploration_id, state_name, _OLD_SUBMIT_HANDLER_NAME,
                    rule_str])[:490])

        entity_keys = [
            cls._get_entity_key(exploration_id, entity_id)
            for exploration_id, entity_id in zip(exploration_ids, entity_ids)]

        entities = ndb.get_multi(entity_keys)
        entities_to_put = []
        for ind, entity in enumerate(entities):
            if entity is None:
                new_entity = cls(id=entity_ids[ind], answers={})
                entities_to_put.append(new_entity)
                entities[ind] = new_entity
        if entities_to_put:
            ndb.put_multi(entities_to_put)

        exploration_entities_list = []
        exploration_state_name_entity_map = {}
        for ind, exp_state_tuple in enumerate(exploration_state_list):
            exploration_entities_list.append([])
            exploration_state_name_entity_map[exp_state_tuple] = (
                exploration_entities_list[ind])

        for (exploration_id, state_name, entity) in zip(
                exploration_ids, state_names, entities):
            exploration_state_name_entity_map[(
                exploration_id, state_name)].append(entity)
        return exploration_entities_list

    @classmethod
    def get_or_create_multi(cls, exploration_id, rule_data):
        """Gets or creates entities for the given rules.
        Args:
            exploration_id: the exploration id
            rule_data: a list of dicts, each with the following keys:
                (state_name, rule_str).
        """
        # TODO(sll): Use a hash instead to disambiguate.
        entity_ids = ['.'.join([
            exploration_id, datum['state_name'],
            _OLD_SUBMIT_HANDLER_NAME, datum['rule_str']
        ])[:490] for datum in rule_data]

        entity_keys = [cls._get_entity_key(exploration_id, entity_id)
                       for entity_id in entity_ids]

        entities = ndb.get_multi(entity_keys)
        entities_to_put = []
        for ind, entity in enumerate(entities):
            if entity is None:
                new_entity = cls(id=entity_ids[ind], answers={})
                entities_to_put.append(new_entity)
                entities[ind] = new_entity

        ndb.put_multi(entities_to_put)
        return entities


class StartExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a student starting the exploration.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'start'
        exploration_id: id of exploration currently being played
        exploration_version: version of exploration
        state_name: Name of current state
        client_time_spent_in_secs: 0
        play_type: 'normal'
        created_on date
        event_schema_version: 1
        session_id: ID of current student's session
        params: current parameter values, in the form of a map of parameter
            name to value
    """
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1

    # Which specific type of event this is
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    client_time_spent_in_secs = ndb.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(cls, exp_id, exp_version, state_name, session_id,
               params, play_type, unused_version=1):
        """Creates a new start exploration event."""
        # TODO(sll): Some events currently do not have an entity id that was
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


class MaybeLeaveExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a reader attempting to leave the
    exploration without completing.

    Due to complexity on browser end, this event may be logged when user clicks
    close and then cancel. Thus, the real event is the last event of this type
    logged for the session id.

    Note: shortly after the release of v2.0.0.rc.2, some of these events
    were migrated from StateHitEventLogEntryModel. These events have their
    client_time_spent_in_secs field set to 0.0 (since this field was not
    recorded in StateHitEventLogEntryModel), and they also have the wrong
    'last updated' timestamp. However, the 'created_on' timestamp is the
    same as that of the original model.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'leave' (there are no 'maybe leave' events in V0)
        exploration_id: id of exploration currently being played
        exploration_version: version of exploration
        state_name: Name of current state
        play_type: 'normal'
        created_on date
        event_schema_version: 1
        session_id: ID of current student's session
        params: current parameter values, in the form of a map of parameter
            name to value
        client_time_spent_in_secs: time spent in this state before the event
            was triggered
    """
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1

    # Which specific type of event this is
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    # Note: Some of these events were migrated from StateHit event instances
    # which did not record timestamp data. For this, we use a placeholder
    # value of 0.0 for client_time_spent_in_secs.
    client_time_spent_in_secs = ndb.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(cls, exp_id, exp_version, state_name, session_id,
               client_time_spent_in_secs, params, play_type):
        """Creates a new leave exploration event."""
        # TODO(sll): Some events currently do not have an entity id that was
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
        event_type: 'complete'
        exploration_id: id of exploration currently being played
        exploration_version: version of exploration
        state_name: Name of the terminal state
        play_type: 'normal'
        created_on date
        event_schema_version: 1
        session_id: ID of current student's session
        params: current parameter values, in the form of a map of parameter
            name to value
        client_time_spent_in_secs: time spent in this state before the event
            was triggered

    Note: shortly after the release of v2.0.0.rc.3, some of these events
    were migrated from MaybeLeaveExplorationEventLogEntryModel. These events
    have the wrong 'last updated' timestamp. However, the 'created_on'
    timestamp is the same as that of the original model.
    """
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1

    # Which specific type of event this is
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session
    session_id = ndb.StringProperty(indexed=True)
    # Time since start of this state before this event occurred (in sec).
    # Note: Some of these events were migrated from StateHit event instances
    # which did not record timestamp data. For this, we use a placeholder
    # value of 0.0 for client_time_spent_in_secs.
    client_time_spent_in_secs = ndb.FloatProperty(indexed=True)
    # Current parameter values, map of parameter name to value
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(cls, exp_id, exp_version, state_name, session_id,
               client_time_spent_in_secs, params, play_type):
        """Creates a new exploration completion event."""
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


class RateExplorationEventLogEntryModel(base_models.BaseModel):
    """An event triggered by a learner rating the exploration.

    Event schema documentation
    --------------------------
    V1:
        event_type: 'rate_exploration'
        exploration_id: id of exploration which is being rated
        rating: value of rating assigned to exploration
    """
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1

    # Which specific type of event this is
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration which has been rated.
    exploration_id = ndb.StringProperty(indexed=True)
    # Value of rating assigned
    rating = ndb.IntegerProperty(indexed=True)
    # Value of rating previously assigned by the same user. Will be None when a
    # user rates an exploration for the first time.
    old_rating = ndb.IntegerProperty(indexed=True)
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, user_id):
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            user_id))

    @classmethod
    def create(cls, exp_id, user_id, rating, old_rating):
        """Creates a new rate exploration event."""
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
    - event_type: 'state_hit'
    - exploration_id: id of exploration currently being played
    - exploration_version: version of exploration
    - state_name: Name of current state
    - play_type: 'normal'
    - created_on date
    - event_schema_version: 1
    - session_id: ID of current student's session
    - params: current parameter values, in the form of a map of parameter name
              to its value
    NOTE TO DEVELOPERS: Unlike other events, this event does not have a
    client_time_spent_in_secs. Instead, it is the reference event for
    all other client_time_spent_in_secs values, which each represent the
    amount of time between this event (i.e., the learner entering the
    state) and the other event.
    """
    # This value should be updated in the event of any event schema change.
    CURRENT_EVENT_SCHEMA_VERSION = 1

    # Which specific type of event this is
    event_type = ndb.StringProperty(indexed=True)
    # Id of exploration currently being played.
    exploration_id = ndb.StringProperty(indexed=True)
    # Current version of exploration.
    exploration_version = ndb.IntegerProperty(indexed=True)
    # Name of current state.
    state_name = ndb.StringProperty(indexed=True)
    # ID of current student's session
    session_id = ndb.StringProperty(indexed=True)
    # Current parameter values, map of parameter name to value
    params = ndb.JsonProperty(indexed=False)
    # Which type of play-through this is (editor preview, or learner view).
    # Note that the 'playtest' option is legacy, since editor preview
    # playthroughs no longer emit events.
    play_type = ndb.StringProperty(indexed=True,
                                   choices=[feconf.PLAY_TYPE_PLAYTEST,
                                            feconf.PLAY_TYPE_NORMAL])
    # The version of the event schema used to describe an event of this type.
    # Details on the schema are given in the docstring for this class.
    event_schema_version = ndb.IntegerProperty(
        indexed=True, default=CURRENT_EVENT_SCHEMA_VERSION)

    @classmethod
    def get_new_event_entity_id(cls, exp_id, session_id):
        timestamp = datetime.datetime.utcnow()
        return cls.get_new_id('%s:%s:%s' % (
            utils.get_time_in_millisecs(timestamp),
            exp_id,
            session_id))

    @classmethod
    def create(
            cls, exp_id, exp_version, state_name, session_id, params,
            play_type):
        """Creates a new leave exploration event."""
        # TODO(sll): Some events currently do not have an entity id that was
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


class ExplorationAnnotationsModel(base_models.BaseMapReduceBatchResultsModel):
    """Batch model for storing MapReduce calculation output for
    exploration-level statistics.
    """
    # Id of exploration.
    exploration_id = ndb.StringProperty(indexed=True)
    # Version of exploration.
    version = ndb.StringProperty(indexed=False)
    # Number of students who started the exploration
    num_starts = ndb.IntegerProperty(indexed=False)
    # Number of students who have completed the exploration
    num_completions = ndb.IntegerProperty(indexed=False)
    # Keyed by state name that describes the numbers of hits for each state
    # {state_name: {'first_entry_count': ...,
    #               'total_entry_count': ...,
    #               'no_answer_count': ...}}
    state_hit_counts = ndb.JsonProperty(indexed=False)

    @classmethod
    def get_entity_id(cls, exploration_id, exploration_version):
        return '%s:%s' % (exploration_id, exploration_version)

    @classmethod
    def create(
            cls, exp_id, version, num_starts, num_completions,
            state_hit_counts):
        """Creates a new ExplorationAnnotationsModel."""
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

    The id/key of instances of this class has the form
        [EXPLORATION_ID]:[EXPLORATION_VERSION]:[STATE_NAME]:[SHARD_ID].
    """
    # This provides about 48k of padding for the other properties and entity
    # storage overhead (since the max entity size is 1MB).
    _MAX_ANSWER_LIST_BYTE_SIZE = 100000

    # Explicitly store exploration id, exploration version and state name
    # so we can easily do queries on them.
    exploration_id = ndb.StringProperty(indexed=True, required=True)
    exploration_version = ndb.IntegerProperty(indexed=True, required=True)
    state_name = ndb.StringProperty(indexed=True, required=True)
    shard_id = ndb.IntegerProperty(indexed=True, required=True)
    # Store interaction type to know which calculations should be performed
    interaction_id = ndb.StringProperty(indexed=True, required=True)
    # Store how many extra shards are associated with this state. This is only
    # present when shard_id is 0. This starts at 0 (the main shard is not
    # counted).
    shard_count = ndb.IntegerProperty(indexed=True, required=False)
    # The total number of bytes needed to store all of the answers in the
    # submitted_answer_list, minus any overhead of the property itself. This
    # value is found by summing all json_size values for answer dicts inside
    # submitted_answer_list.
    accumulated_answer_json_size = ndb.IntegerProperty(
        indexed=False, required=False, default=0)
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
        entity_id = cls._get_entity_id(
            exploration_id, exploration_version, state_name, shard_id)
        return cls.get(entity_id, strict=False)

    @classmethod
    def get_all_models(cls, exploration_id, exploration_version, state_name):
        """Retrieves all models and shards associated with the specific
        exploration state. Returns None if no answers have yet been submitted to
        the specified exploration state.
        """
        # It's okay if this isn't run in a transaction. When adding new shards,
        # it's guaranteed the master shard will be updated at the same time the
        # new shard is added. Shard deletion is not supported, so there will
        # never be a shard accessed after retrieving the master shard. Finally,
        # if a new shard is added after the master shard is retrieved, it will
        # simply be ignored in the result of this function. It will be included
        # during the next call.
        main_shard = cls._get_model(
            exploration_id, exploration_version, state_name, 0)

        if main_shard:
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
        # The main shard always needs to be retrieved. At most one other shard
        # needs to be retrieved (the last one).
        main_shard = cls._get_model(
            exploration_id, exploration_version, state_name, 0)
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
            last_shard.accumulated_answer_json_size,
            new_submitted_answer_dict_list)
        new_shard_count = main_shard.shard_count + len(sharded_answer_lists) - 1

        # Collect all entities to update to efficiently send them as a single
        # update.
        entities_to_put = []
        last_shard_is_main = main_shard.shard_count == 0

        # Update the last shard if it changed.
        if sharded_answer_lists[0] != last_shard.submitted_answer_list:
            last_shard.submitted_answer_list = sharded_answer_lists[0]
            last_shard.accumulated_answer_json_size = (
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
                id=entity_id, exploration_id=exploration_id,
                exploration_version=exploration_version, state_name=state_name,
                shard_id=shard_id, interaction_id=interaction_id,
                submitted_answer_list=sharded_answer_lists[i],
                accumulated_answer_json_size=sharded_answer_list_sizes[i])
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
        """
        transaction_services.run_in_transaction(
            cls._insert_submitted_answers_unsafe, exploration_id,
            exploration_version, state_name, interaction_id,
            new_submitted_answer_dict_list)

    @classmethod
    def _get_entity_id(
            cls, exploration_id, exploration_version, state_name, shard_id):
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
        """
        # Sort the new answers to insert in a descending by size in bytes.
        new_answer_list_sorted = sorted(
            new_answer_list, key=lambda x: x['json_size'])
        sharded_answer_lists = [list(current_answer_list)]
        sharded_answer_list_sizes = [current_answer_list_size]
        for answer_dict in new_answer_list_sorted:
            answer_size = answer_dict['json_size']
            if (sharded_answer_list_sizes[-1] + answer_size <=
                    cls._MAX_ANSWER_LIST_BYTE_SIZE):
                sharded_answer_lists[-1].append(answer_dict)
                sharded_answer_list_sizes[-1] += answer_size
            else:
                sharded_answer_lists.append([answer_dict])
                sharded_answer_list_sizes.append(answer_size)
        return sharded_answer_lists, sharded_answer_list_sizes


class StateAnswersCalcOutputModel(base_models.BaseMapReduceBatchResultsModel):
    """Store output of calculation performed on StateAnswers."""

    exploration_id = ndb.StringProperty(indexed=True, required=True)
    # May be an integral exploration_version or 'all' if this entity represents
    # an aggregation of multiple sets of answers.
    exploration_version = ndb.StringProperty(indexed=True, required=True)
    state_name = ndb.StringProperty(indexed=True, required=True)
    calculation_id = ndb.StringProperty(indexed=True, required=True)
    # Calculation output dict stored as JSON blob
    calculation_output = ndb.JsonProperty(indexed=False)

    @classmethod
    def create_or_update(cls, exploration_id, exploration_version, state_name,
                         calculation_id, calculation_output):
        instance_id = cls._get_entity_id(
            exploration_id, exploration_version, state_name, calculation_id)
        instance = cls.get(instance_id, strict=False)
        if not instance:
            # create new instance
            instance = cls(
                id=instance_id, exploration_id=exploration_id,
                exploration_version=exploration_version,
                state_name=state_name, calculation_id=calculation_id,
                calculation_output=calculation_output)
        else:
            instance.calculation_output = calculation_output

        try:
            # This may fail if calculation_output is too large.
            instance.put()
        except Exception as e:
            logging.error(e)

    @classmethod
    def get_model(cls, exploration_id, exploration_version, state_name,
                  calculation_id):
        entity_id = cls._get_entity_id(
            exploration_id, str(exploration_version), state_name,
            calculation_id)
        instance = cls.get(entity_id, strict=False)
        return instance

    @classmethod
    def _get_entity_id(cls, exploration_id, exploration_version, state_name,
                       calculation_id):
        return ':'.join([
            exploration_id, str(exploration_version), state_name,
            calculation_id])


class LargeAnswerBucketModel(base_models.BaseModel):
    """Stores answers from StateRuleAnswerLogModel for entities with very large
    numbers of answers. Those answers are copied to this model and stored in a
    fragmented way so that the answer migration can perform the larger
    migrations in smaller chunks.
    """
    # TODO(bhenning): Remove this model once the AnswerMigrationJob has
    # successfully run in production.

    _MAX_ANSWERS_PER_BUCKET = 100
    log_model_item_id = ndb.StringProperty(indexed=True)
    answers = ndb.JsonProperty(indexed=False)
    log_model_last_update = ndb.DateTimeProperty(indexed=False)

    @classmethod
    def should_split_log_entity(cls, item):
        """Returns whether the given StateRuleAnswerLogModel entity has enough
        answers to be split up.
        """
        return len(item.answers) > cls._MAX_ANSWERS_PER_BUCKET

    @classmethod
    def get_split_entity_count_for_answer_log_entity(cls, item_id):
        """Returns how many times the given StateRuleAnswerLogModel entity (by
        ID) has been split and stored within this model in shards, or 0 if it is
        not split at all. This will never return 1.
        """
        return cls.query(cls.log_model_item_id == item_id).count()

    @classmethod
    def insert_state_rule_answer_log_entity(cls, item):
        """Attemps to instance a StateRuleAnswerLogModel entity, splitting up
        its entities as necessary. This method guarantees more than one
        LargeAnswerBucketModel entity will be written, otherwise the entity will
        not be split up.
        """
        total_answer_count = len(item.answers)
        if total_answer_count <= cls._MAX_ANSWERS_PER_BUCKET:
            raise Exception(
                'Cannot split up entity with less than max answers: %s' % (
                    item.id))
        full_bucket_count = total_answer_count / cls._MAX_ANSWERS_PER_BUCKET
        remaining_answer_count = (
            total_answer_count % cls._MAX_ANSWERS_PER_BUCKET)
        answer_list = item.answers.items()
        # TODO(bhenning): Figure out a better way to deal with this situation.
        # This sort is only here for the benefit of tests, but it might be slow
        # enough to cause the transaction to fail.
        answer_list.sort(key=operator.itemgetter(0))
        for i in xrange(full_bucket_count):
            bucket_id = cls.get_new_id('')
            start_shard_answer_index = i * cls._MAX_ANSWERS_PER_BUCKET
            end_shard_answer_index = (i + 1) * cls._MAX_ANSWERS_PER_BUCKET
            sharded_answer_list = answer_list[
                start_shard_answer_index:end_shard_answer_index]
            bucket_entity = cls(
                id=bucket_id,
                log_model_item_id=item.id,
                answers=dict(sharded_answer_list),
                log_model_last_update=item.last_updated)
            bucket_entity.put()

        if remaining_answer_count > 0:
            bucket_id = cls.get_new_id('')
            sharded_answer_list = answer_list[
                full_bucket_count*cls._MAX_ANSWERS_PER_BUCKET:]
            bucket_entity = cls(
                id=bucket_id,
                log_model_item_id=item.id,
                answers=dict(sharded_answer_list),
                log_model_last_update=item.last_updated)
            bucket_entity.put()


class MigratedAnswerModel(base_models.BaseModel):
    """A temporary model which maps answers in StateRuleAnswerLogModel and
    LargeAnswerBucketModel to answers migrated and inserted in
    StateAnswersModel. This model can be used to verify a given answer exists
    (and the correct number of times) in StateAnswersModel. Although the
    AnswerMigrationJob is not idempotent, this model aims to help make it closer
    to idempotent.
    """
    # TODO(bhenning): Remove this model once the AnswerMigrationJob has
    # successfully run in production.

    exploration_id = ndb.StringProperty(indexed=True, required=True)
    state_name = ndb.StringProperty(indexed=True, required=True)
    exploration_versions = ndb.IntegerProperty(indexed=False, repeated=True)
    started_migration = ndb.BooleanProperty(indexed=False, default=False)
    finished_migration = ndb.BooleanProperty(indexed=False, default=False)
    started_large_answer_bucket_ids = ndb.StringProperty(
        indexed=False, repeated=True)
    finished_large_answer_bucket_ids = ndb.StringProperty(
        indexed=False, repeated=True)
    expected_large_answer_bucket_count = ndb.IntegerProperty(
        indexed=False, default=0)

    @classmethod
    def _start_migrating_answer_bucket(
            cls, state_answer_log_model_item_id, exploration_id, state_name,
            large_answer_bucket_id, large_answer_bucket_count):
        model = cls.get(state_answer_log_model_item_id, strict=False)
        # Only expect migration to not have been started if there aren't a group
        # of answers being matched to this entity.
        if not large_answer_bucket_id and model:
            raise Exception(
                'Expected to not have started migrating answer bucket: %s' % (
                    state_answer_log_model_item_id))

        if (large_answer_bucket_id and model
                and large_answer_bucket_id
                in model.started_large_answer_bucket_ids):
            raise Exception(
                'Expected to not have started migrating large answer bucket: '
                '\'%s\' (part of group \'%s\')' % (
                    large_answer_bucket_id, state_answer_log_model_item_id))
        if not model:
            started_large_answer_bucket_ids = (
                [large_answer_bucket_id] if large_answer_bucket_id else [])
            model = cls(
                id=state_answer_log_model_item_id,
                exploration_id=exploration_id, state_name=state_name,
                exploration_versions=[], started_migration=True,
                started_large_answer_bucket_ids=started_large_answer_bucket_ids,
                finished_large_answer_bucket_ids=[],
                expected_large_answer_bucket_count=large_answer_bucket_count)
        else:
            started_large_answer_bucket_ids = set(
                model.started_large_answer_bucket_ids)
            started_large_answer_bucket_ids.add(large_answer_bucket_id)
            model.started_large_answer_bucket_ids = list(
                started_large_answer_bucket_ids)
        model.put()

    @classmethod
    def start_migrating_answer_bucket(
            cls, state_answer_log_model_item_id, exploration_id, state_name,
            large_answer_bucket_id, large_answer_bucket_count):
        transaction_services.run_in_transaction(
            cls._start_migrating_answer_bucket, state_answer_log_model_item_id,
            exploration_id, state_name, large_answer_bucket_id,
            large_answer_bucket_count)

    @classmethod
    def _finish_migrating_answer(
            cls, state_answer_log_model_item_id, exploration_version):
        model = cls.get(state_answer_log_model_item_id)
        # Avoid an unnecessary put if the given version is already recorded
        if exploration_version not in model.exploration_versions:
            model.exploration_versions.append(exploration_version)
            model.put()

    @classmethod
    def finish_migrating_answer(
            cls, state_answer_log_model_item_id, exploration_version):
        transaction_services.run_in_transaction(
            cls._finish_migrating_answer, state_answer_log_model_item_id,
            exploration_version)

    @classmethod
    def _finish_migration_answer_bucket(
            cls, state_answer_log_model_item_id, large_answer_bucket_id):
        model = cls.get(state_answer_log_model_item_id)
        if large_answer_bucket_id:
            finished_large_answer_bucket_ids = set(
                model.finished_large_answer_bucket_ids)
            finished_large_answer_bucket_ids.add(large_answer_bucket_id)
            expected_bucket_count = model.expected_large_answer_bucket_count
            model.finished_migration = (
                len(finished_large_answer_bucket_ids) >= expected_bucket_count)
            model.finished_large_answer_bucket_ids = list(
                finished_large_answer_bucket_ids)
        else:
            model.finished_migration = True
        model.put()

    @classmethod
    def finish_migration_answer_bucket(
            cls, state_answer_log_model_item_id, large_answer_bucket_id):
        transaction_services.run_in_transaction(
            cls._finish_migration_answer_bucket, state_answer_log_model_item_id,
            large_answer_bucket_id)

    @classmethod
    def has_started_being_migrated(
            cls, state_answer_log_model_item_id, large_answer_bucket_id=None):
        model = cls.get(state_answer_log_model_item_id, strict=False)
        return model is not None and (
            not large_answer_bucket_id or large_answer_bucket_id
            in model.started_large_answer_bucket_ids)

    @classmethod
    def validate_answers_are_migrated(cls, state_rule_answer_log_model):
        migrated_answer_model = MigratedAnswerModel.get(
            state_rule_answer_log_model.id, strict=False)
        if not migrated_answer_model:
            raise utils.ValidationError(
                u'Answers not migrated: %s' % state_rule_answer_log_model.id)
        state_answer_models_list = []

        # A version of -1 is a special sentinel value to silence the
        # validation on this answer bucket. It typically represents an
        # answer which cannot be migrated for a known reason. These answers
        # should not be validated, since they were never migrated.
        if migrated_answer_model.exploration_versions == [-1]:
            return

        for exploration_version in migrated_answer_model.exploration_versions:
            state_answer_models = StateAnswersModel.get_all_models(
                migrated_answer_model.exploration_id, exploration_version,
                migrated_answer_model.state_name)
            if not state_answer_models:
                raise utils.ValidationError(
                    u'Inconsistency: previous mentioned answers were migrated '
                    'for exploration %s (version=%s) state name %s, but none '
                    'found' % (
                        migrated_answer_model.exploration_id,
                        exploration_version, migrated_answer_model.state_name))
            state_answer_models_list.append(state_answer_models)
        answer_str_list = (
            cls._get_answer_str_list_from_state_answer_models_list(
                state_answer_models_list))
        for answer_str, expected_count in (
                state_rule_answer_log_model.answers.iteritems()):
            observed_count = answer_str_list.count(answer_str)
            if expected_count != observed_count:
                raise utils.ValidationError(
                    u'Expected \'%s\' answer string %d time(s) in new data '
                    'model, but found it %d time(s)' % (
                        answer_str, expected_count, observed_count))

    @classmethod
    def _get_answer_str_list_from_state_answer_models_list(
            cls, state_answer_models_list):
        answer_str_list = []
        for state_answer_models in state_answer_models_list:
            for state_answer_model in state_answer_models:
                for submitted_answer_dict in (
                        state_answer_model.submitted_answer_list):
                    answer_str_list.append(
                        submitted_answer_dict.get('answer_str'))
        return answer_str_list
