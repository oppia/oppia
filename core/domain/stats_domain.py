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

"""Domain object for statistics models."""

__author__ = 'Sean Lip'

import copy
import operator

from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class StateCounter(object):
    """Domain object that keeps counts associated with states.

    All methods and properties in this file should be independent of the
    specific storage model used.
    """
    def __init__(self, first_entry_count, subsequent_entries_count,
                 resolved_answer_count, active_answer_count):
        self.first_entry_count = first_entry_count
        self.subsequent_entries_count = subsequent_entries_count
        self.resolved_answer_count = resolved_answer_count
        self.active_answer_count = active_answer_count

    @property
    def total_entry_count(self):
        """Total number of entries to the state."""
        return self.first_entry_count + self.subsequent_entries_count

    @property
    def no_answer_count(self):
        """Number of times a reader left without entering an answer."""
        return (self.first_entry_count + self.subsequent_entries_count
                - self.resolved_answer_count - self.active_answer_count)

    @classmethod
    def get(cls, exploration_id, state_id):
        state_counter_model = stats_models.StateCounterModel.get_or_create(
            exploration_id, state_id)
        return cls(
            state_counter_model.first_entry_count,
            state_counter_model.subsequent_entries_count,
            state_counter_model.resolved_answer_count,
            state_counter_model.active_answer_count
        )


class StateRuleAnswerLog(object):
    """Domain object that stores answers which match different state rules.

    All methods and properties in this file should be independent of the
    specific storage model used.
    """
    def __init__(self, answers):
        # This dict represents a log of answers that hit this rule and that
        # have not been resolved. The keys of this dict are the answers encoded
        # as HTML strings, and the values are integer counts representing how
        # many times the answer has been entered.
        self.answers = copy.deepcopy(answers)

    @property
    def total_answer_count(self):
        """Total count of answers for this rule that have not been resolved."""
        # TODO(sll): Cache this computed property.
        total_count = 0
        for answer, count in self.answers.iteritems():
            total_count += count
        return total_count

    @classmethod
    def get_multi(cls, exploration_id, rule_data):
        """Gets domain objects corresponding to the given rule data.

        Args:
            exploration_id: the exploration id
            rule_data: a list of dicts, each with the following keys:
                (state_id, handler_name, rule_str).
        """
        # TODO(sll): Should each rule_str be unicode instead?
        answer_log_models = (
            stats_models.StateRuleAnswerLogModel.get_or_create_multi(
                exploration_id, rule_data))
        return [cls(answer_log_model.answers)
                for answer_log_model in answer_log_models]

    @classmethod
    def get(cls, exploration_id, state_id, handler_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_multi(exploration_id, [{
            'state_id': state_id,
            'handler_name': handler_name,
            'rule_str': rule_str
        }])[0]

    def get_top_answers(self, N):
        """Returns the top N answers.

        Args:
            N: the maximum number of answers to return.

        Returns:
            A list of (answer, count) tuples for the N answers with the highest
            counts.
        """
        return sorted(
            self.answers.iteritems(), key=operator.itemgetter(1),
            reverse=True)[:N]


class FeedbackItem(object):
    """Domain object for a generic feedback item.

    All methods and properties in this file should be independent of the
    specific storage model used.
    """
    def __init__(self, feedback_item_model):
        self.id = feedback_item_model.id
        self.target_id = feedback_item_model.target_id
        self.content = feedback_item_model.content
        self.additional_data = feedback_item_model.additional_data
        self.submitter_id = feedback_item_model.submitter_id
        self.status = feedback_item_model.status

    @classmethod
    def _get_feedback_items_for_target(cls, target_id):
        return [
            FeedbackItem(f) for f in
            stats_models.FeedbackItemModel.get_new_feedback_items_for_target(
                target_id)]

    @classmethod
    def _get_target_id_for_state(cls, exploration_id, state_id):
        return 'state:%s.%s' % (exploration_id, state_id)

    @classmethod
    def _get_target_id_for_exploration(cls, exploration_id):
        return 'exploration:%s' % (exploration_id)

    @classmethod
    def get_feedback_items_for_state(cls, exploration_id, state_id):
        target_id = cls._get_target_id_for_state(exploration_id, state_id)
        return cls._get_feedback_items_for_target(target_id)

    @classmethod
    def get_feedback_items_for_exploration(cls, exploration_id):
        target_id = cls._get_target_id_for_exploration(exploration_id)
        return cls._get_feedback_items_for_target(target_id)

    @classmethod
    def _create_feedback_for_target(
            cls, target_id, content, additional_data, submitter_id):
        feedback_item_model = stats_models.FeedbackItemModel.get_or_create(
            target_id, content, additional_data, submitter_id)
        return cls(feedback_item_model)

    @classmethod
    def create_feedback_for_state(
            cls, exploration_id, state_id, content, additional_data=None,
            submitter_id=None):
        target_id = cls._get_target_id_for_state(exploration_id, state_id)
        return cls._create_feedback_for_target(
            target_id, content, additional_data, submitter_id)

    @classmethod
    def create_feedback_for_exploration(
            cls, exploration_id, content, additional_data=None,
            submitter_id=None):
        target_id = cls._get_target_id_for_exploration(exploration_id)
        return cls._create_feedback_for_target(
            target_id, content, additional_data, submitter_id)

    def change_status(self, new_status):
        self.status = new_status
