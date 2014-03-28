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

__author__ = 'Sean Lip'

import base64
import logging
import hashlib

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import utils

from google.appengine.ext import ndb

QUERY_LIMIT = 100
MAX_ANSWER_HASH_LEN = 100


def hash_answer(answer):
    return utils.convert_to_hash(answer, MAX_ANSWER_HASH_LEN)


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

    @classmethod
    def inc(cls, exploration_id, state_name, first_time):
        """Increments the relevant counter for state entries."""
        counter = cls.get_or_create(exploration_id, state_name)

        if first_time:
            counter.first_entry_count += 1
        else:
            counter.subsequent_entries_count += 1

        counter.put()


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
    def get_or_create(cls, exploration_id, state_name, handler_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_or_create_multi(exploration_id, [{
            'state_name': state_name,
            'handler_name': handler_name,
            'rule_str': rule_str
        }])[0]

    @classmethod
    def _get_entity_key(cls, exploration_id, entity_id):
        return ndb.Key(cls._get_kind(), entity_id)

    @classmethod
    def get_or_create_multi(cls, exploration_id, rule_data):
        """Gets or creates entities for the given rules.

        Args:
            exploration_id: the exploration id
            rule_data: a list of dicts, each with the following keys:
                (state_name, handler_name, rule_str).
        """
        # TODO(sll): Use a hash instead to disambiguate.
        entity_ids = ['.'.join([
            exploration_id, datum['state_name'],
            datum['handler_name'], datum['rule_str']
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


class FeedbackItemModel(base_models.BaseModel):
    """A piece of feedback for a particular resource."""
    # The id for the target of the feedback (e.g. an exploration, a state, the
    # app as a whole, etc.)
    target_id = ndb.StringProperty()
    # The text of the feedback message.
    content = ndb.TextProperty(indexed=False)
    # Additional data supplied with the feedback message, such as the reader's
    # state/answer history.
    additional_data = ndb.JsonProperty(indexed=False)
    # The id of the user who submitted this feedback. If None, it means that
    # the feedback was submitted anonymously.
    submitter_id = ndb.StringProperty()
    # The status of the feedback.
    status = ndb.StringProperty(
        default='new',
        choices=[
            'new', 'accepted', 'fixed', 'verified', 'will_not_fix',
            'needs_clarification'
        ]
    )

    @classmethod
    def get_or_create(cls, target_id, content, additional_data, submitter_id):
        """Creates a new feedback entry."""
        entity_id = cls.get_new_id('%s:%s' % (target_id, content))
        feedback_entity = cls(
            id=entity_id, target_id=target_id, content=content,
            additional_data=additional_data, submitter_id=submitter_id)
        feedback_entity.put()

        return feedback_entity

    @classmethod
    def get_new_feedback_items_for_target(cls, target_id):
        """Gets all 'new' feedback items corresponding to a given target_id."""
        return cls.get_all().filter(
            cls.target_id == target_id
        ).filter(cls.status == 'new').fetch(QUERY_LIMIT)


class UnresolvedAnswerHistoryModel(base_models.BaseModel):
    """A record of an unresolved answer and the history that led up to it.

    Entities here cannot be modified after they are created.
    """
    # A string containing the full (unhashed) answer.
    answer = ndb.TextProperty()
    # A record of the previous interactions by this reader.
    history = ndb.JsonProperty()

    @classmethod
    def _construct_id(
            cls, exploration_id, exploration_version, state_name, rule, answer):
        return ':'.join([
            exploration_id, str(exploration_version), state_name, rule,
            hash_answer(answer)
        ])

    @classmethod
    def get_or_create(
            cls, exploration_id, exploration_version, state_name, rule, answer,
            history):
        """Gets or creates a new unresolved answers entity."""
        entity_id = cls._construct_id(
            exploration_id, exploration_version, state_name, rule, answer)
        unresolved_answer_entity = cls(
            id=entity_id, answer=answer, history=history)
        # TODO(sfederwisch): figure out a way to store this so it doesn't go over
        # maximum length of a property. NOTE: this only works for now since we are
        # not retrieving UnresolvedAnswerHistoryModel for anything.
        try:
            unresolved_answer_entity.put()
        except Exception as e:
            logging.error(e)
            pass

    # TODO(sfederwisch): Implement the following methods (all of these have a
    # given exploration id, exploration version, state name and rule):
    #     get_entities_for_answer(..., answer)
    #     get_an_entity_with_answer(..., answer)  (optional)
    #     delete_entity(..., answer)


class StateAnnotationsModel(base_models.BaseModel):
    """Data related to a state.

    This includes unresolved answers, reader-submitted feedback and any
    calculated scores for the annotations (like confusion scores, etc.)
    """
    # Reader answers that have not been addressed. This is a dict keyed by a
    # hash of the answer, and whose value is a dict with the following keys:
    # 'answer', 'rule', 'count', 'exploration_version'.
    unresolved_answers = ndb.JsonProperty(indexed=False)
    # Save key values to be used later.
    exp_id = ndb.StringProperty(indexed=False)
    state_name = ndb.StringProperty(indexed=False) 

    @classmethod
    def get_or_create(cls, exp_id, state_name):
        """Returns a state annotations object, possibly creating it."""
        entity_id = '%s:%s' % (exp_id, state_name)

        state_annotations = cls.get(entity_id, strict=False)
        if not state_annotations:
            state_annotations = cls(id=entity_id, unresolved_answers={},
                                    exp_id=exp_id, state_name=state_name)
        return state_annotations

    def increment_unresolved_answer_count(
            self, exploration_version, rule, answer):
        """Increments the corresponding count for this unresolved answer."""
        hashed_answer = hash_answer(answer)
        if hashed_answer in self.unresolved_answers:
            self.unresolved_answers[hashed_answer]['count'] += 1
            score = self.unresolved_answers[hashed_answer]['count']
        else:
            self.unresolved_answers[hashed_answer] = {
                'answer': answer,
                'rule': str(rule),
                'count': 1,
                'exploration_version': exploration_version
            }
            score = 1
        exp_model = ExplorationAnnotationsModel.get_or_create(
            self.exp_id)
        exp_model.update_state_data(self.state_name, 'missing',
            score, answer, rule.is_generic)
        exp_model.put()

    # TODO(sfederwisch): Add additional methods and properties.


class ExplorationAnnotationsModel(base_models.BaseModel):
    """Data related to an exploration"""
    # Threshold for an answer to qualify as 'missing'
    MISSING_ANSWER_THRESHOLD = 7
    # Data from states that would be retrieved for display with 
    # exploration as a whole, namely which states should be flagged.
    # This is a dict keyed by state_name, and whose value is a dict
    # with the following keys: 'flag_type', 'score', 'data'.
    summarized_state_data = ndb.JsonProperty(indexed=False)

    @classmethod
    def get_or_create(cls, exploration_id):
        """Returns ExplorationAnnotationsModel, possibly creating it."""
        exploration_annotations = cls.get(exploration_id, strict=False)
        if not exploration_annotations:
            exploration_annotations = cls(id=exploration_id,
                                          summarized_state_data={})
        return exploration_annotations

    def update_state_data(self, state_name, flag_type, score, data, is_generic):
        """Update state specific data if needed based off of new flag values."""
        flaggable = False
        if flag_type == "missing":
            flaggable = (score > self.MISSING_ANSWER_THRESHOLD) and is_generic
        if flaggable:
            if state_name in self.summarized_state_data:
                saved_score = self.summarized_state_data[state_name]['score']
                if (score > saved_score):
                    self.summarized_state_data[state_name] = {
                        'flag_type': flag_type,
                        'score': score,
                        'data': data
                    }
            else:
                self.summarized_state_data[state_name] = {
                    'flag_type': flag_type,
                    'score': score,
                    'data': data
                }
        
    # TODO(sfederwisch): add functions for resolved answers, or similar changes


def process_submitted_answer(
        exploration_id, exploration_version, state_name, handler_name,
        rule, answer):
    """Adds an answer to the answer log for the rule it hits.

    Args:
        exploration_id: the exploration id
        state_name: the state name
        handler_name: a string representing the handler name (e.g., 'submit')
        rule: the rule
        answer: an HTML string representation of the answer
    """
    # TODO(sll): Run these two updates in a transaction.

    answer_log = StateRuleAnswerLogModel.get_or_create(
        exploration_id, state_name, handler_name, str(rule))
    if answer in answer_log.answers:
        answer_log.answers[answer] += 1
    else:
        answer_log.answers[answer] = 1

    # This may fail due to answer_log.answers being larger than 1 MB in size.
    try:
        answer_log.put()
    except Exception as e:
        logging.error(e)
        pass

    counter = StateCounterModel.get_or_create(exploration_id, state_name)
    counter.active_answer_count += 1
    counter.put()

    state_annotations = StateAnnotationsModel.get_or_create(
        exploration_id, state_name)
    state_annotations.increment_unresolved_answer_count(
        exploration_version, rule, answer)
    # TODO(sfederwisch): figure out a way to store this so it doesn't go over
    # maximum length of a property. NOTE: this only works for now since we are
    # not retrieving StateAnnotations for anything.
    try:
        state_annotations.put()
    except Exception as e:
        logging.error(e)
        pass

    # TODO(sfederwisch): Replace None with the actual reader history.
    UnresolvedAnswerHistoryModel.get_or_create(
        exploration_id, exploration_version, state_name, str(rule), answer,
        None)


def resolve_answers(
        exploration_id, state_name, handler_name, rule_str, answers):
    """Resolves selected answers for the given rule.

    Args:
        exploration_id: the exploration id
        state_name: the state name
        handler_name: a string representing the handler name (e.g., 'submit')
        rule_str: a string representation of the rule
        answers: a list of HTML string representations of the resolved answers
    """
    # TODO(sll): Run this in a transaction (together with any updates to the
    # state).
    assert isinstance(answers, list)
    answer_log = StateRuleAnswerLogModel.get_or_create(
        exploration_id, state_name, handler_name, rule_str)

    resolved_count = 0
    for answer in answers:
        if answer not in answer_log.answers:
            logging.error(
                'Answer %s not found in answer log for rule %s of exploration '
                '%s, state %s, handler %s' % (
                    answer, rule_str, exploration_id, state_name,
                    handler_name))
        else:
            resolved_count += answer_log.answers[answer]
            del answer_log.answers[answer]
    answer_log.put()

    counter = StateCounterModel.get_or_create(exploration_id, state_name)
    counter.active_answer_count -= resolved_count
    counter.resolved_answer_count += resolved_count
    counter.put()
