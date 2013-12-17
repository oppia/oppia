# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

import logging

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb

QUERY_LIMIT = 100


class StateCounterModel(base_models.BaseModel):
    """A set of counts that correspond to a state.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_ID].
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
    def get_or_create(cls, exploration_id, state_id):
        instance_id = '.'.join([exploration_id, state_id])
        counter = cls.get(instance_id, strict=False)
        if not counter:
            counter = cls(id=instance_id)
        return counter

    @classmethod
    def inc(cls, exploration_id, state_id, first_time):
        """Increments the relevant counter for state entries."""
        counter = cls.get_or_create(exploration_id, state_id)

        if first_time:
            counter.first_entry_count += 1
        else:
            counter.subsequent_entries_count += 1

        counter.put()


class StateRuleAnswerLogModel(base_models.BaseModel):
    """The log of all answers hitting a given state rule.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_ID].[HANDLER_NAME].[RULE_NAME]

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
    def get_or_create(cls, exploration_id, state_id, handler_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_or_create_multi(exploration_id, [{
            'state_id': state_id,
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
                (state_id, handler_name, rule_str).
        """
        entity_ids = ['.'.join([
            exploration_id, datum['state_id'],
            datum['handler_name'], datum['rule_str']
        ]) for datum in rule_data]

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
 

def process_submitted_answer(
        exploration_id, state_id, handler_name, rule_str, answer):
    """Adds an answer to the answer log for the rule it hits.

    Args:
        exploration_id: the exploration id
        state_id: the state id
        handler_name: a string representing the handler name (e.g., 'submit')
        rule_str: a string representation of the rule
        answer: an HTML string representation of the answer
    """
    # TODO(sll): Run these two updates in a transaction.

    answer_log = StateRuleAnswerLogModel.get_or_create(
        exploration_id, state_id, handler_name, rule_str)
    if answer in answer_log.answers:
        answer_log.answers[answer] += 1
    else:
        answer_log.answers[answer] = 1
    answer_log.put()

    counter = StateCounterModel.get_or_create(exploration_id, state_id)
    counter.active_answer_count += 1
    counter.put()


def resolve_answers(exploration_id, state_id, handler_name, rule_str, answers):
    """Resolves selected answers for the given rule.

    Args:
        exploration_id: the exploration id
        state_id: the state id
        handler_name: a string representing the handler name (e.g., 'submit')
        rule_str: a string representation of the rule
        answers: a list of HTML string representations of the resolved answers
    """
    # TODO(sll): Run this in a transaction (together with any updates to the
    # state).
    assert isinstance(answers, list)
    answer_log = StateRuleAnswerLogModel.get_or_create(
        exploration_id, state_id, handler_name, rule_str)

    resolved_count = 0
    for answer in answers:
        if answer not in answer_log.answers:
            logging.error(
                'Answer %s not found in answer log for rule %s of exploration '
                '%s, state %s, handler %s' % (
                    answer, rule_str, exploration_id, state_id, handler_name))
        else:
            resolved_count += answer_log.answers[answer]
            del answer_log.answers[answer]
    answer_log.put()

    counter = StateCounterModel.get_or_create(exploration_id, state_id)
    counter.active_answer_count -= resolved_count
    counter.resolved_answer_count += resolved_count
    counter.put()


def delete_all_stats():
    """Deletes all stats for all explorations."""
    classes = [StateCounterModel, StateRuleAnswerLogModel]
    for cls in classes:
        for item in cls.get_all():
            item.key.delete()
