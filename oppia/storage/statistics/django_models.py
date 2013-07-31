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

import oppia.storage.base_model.models as base_models

from django.db import models

from oppia.django_utils import JSONField


class StateCounterModel(base_models.IdModel):
    """A set of counts that correspond to a state.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_ID].
    """
    # When this entity was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this counter was last updated.
    last_updated = models.DateTimeField(auto_now=True)

    # Number of times the state was entered for the first time in a reader
    # session.
    first_entry_count = models.IntegerField(default=0)
    # Number of times the state was entered for the second time or later in a
    # reader session.
    subsequent_entries_count = models.IntegerField(default=0)
    # Number of times an answer submitted for this state was subsequently
    # resolved by an exploration admin and removed from the answer logs.
    resolved_answer_count = models.IntegerField(default=0)
    # Number of times an answer was entered for this state and was not
    # subsequently resolved by an exploration admin.
    active_answer_count = models.IntegerField(default=0)

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


class StateRuleAnswerLogModel(base_models.IdModel):
    """The log of all answers hitting a given state rule.

    The id/key of instances of this class has the form
        [EXPLORATION_ID].[STATE_ID].[RULE_NAME]

    WARNING: If a change is made to existing rules in data/objects (e.g.
    renaming them or changing their signature), this class will contain
    invalid values.

    WARNING: Rule names and args that are used to construct the key here must
    be < 400 characters in length, since these are used as part of the key.
    """
    # When this entity was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this entity was last updated.
    last_updated = models.DateTimeField(auto_now=True)

    # Log of answers that hit this rule and that have not been resolved. The
    # JSON blob represents a dict. The keys of this dict are the answers
    # encoded as HTML strings, and the values are integer counts representing
    # how many times the answer has been entered.
    # WARNING: do not use default={} in JsonProperty, it does not work as you
    # expect.
    answers = JSONField(default={}, isdict=True)

    @classmethod
    def get_or_create(cls, exploration_id, state_id, rule_str):
        instance_id = '.'.join([exploration_id, state_id, rule_str])
        answer_log = cls.get(instance_id, strict=False)
        if not answer_log:
            answer_log = cls(id=instance_id, answers={})
        return answer_log


def process_submitted_answer(exploration_id, state_id, rule, answer):
    """Adds an answer to the answer log for the rule it hits.

    Args:
        exploration_id: the exploration id
        state_id: the state id
        rule: a string representation of the rule
        answer: an HTML string representation of the answer
    """
    # TODO(sll): Run these two updates in a transaction.

    answer_log = StateRuleAnswerLogModel.get_or_create(
        exploration_id, state_id, rule)
    if answer in answer_log.answers:
        answer_log.answers[answer] += 1
    else:
        answer_log.answers[answer] = 1
    answer_log.put()

    counter = StateCounterModel.get_or_create(exploration_id, state_id)
    counter.active_answer_count += 1
    counter.put()


def resolve_answers(exploration_id, state_id, rule, answers):
    """Resolves answers for the given rule.

    Args:
        exploration_id: the exploration id
        state_id: the state id
        rule: a string representation of the rule
        answers: a list of HTML string representations of the resolved answers
    """
    # TODO(sll): Run this in a transaction (together with any updates to the
    # state).
    answer_log = StateRuleAnswerLogModel.get_or_create(
        exploration_id, state_id, rule)

    resolved_count = 0
    for answer in answers:
        if answer not in answer_log.answers:
            logging.error(
                'Answer %s not found in answer log for rule %s of exploration '
                '%s, state %s' % (answer, rule, exploration_id, state_id))

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
            item.delete()
