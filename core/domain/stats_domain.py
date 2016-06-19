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

"""Domain object for statistics models."""

import copy
import operator

from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


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
        return sum(self.answers.values())

    @classmethod
    def get_multi(cls, exploration_state_list, rule_str_list):
        """Gets domain objects given a list of exploration and state tuples.

        Args:
            exploration_state_list: a list of exploration ID and state name
                tuples
            rule_str_list: a list of rule spec strings which are used to filter
                the answers matched to the provided explorations and states

        Returns a list with a list of StateRuleAnswerLog objects for each group
        of answers matched to each exploration ID-state name.
        """
        # TODO(sll): Should each rule_str be unicode instead?
        answer_log_models_list = (
            stats_models.StateRuleAnswerLogModel.get_or_create_multi(
                exploration_state_list, rule_str_list))
        return [
            [cls(answer_log_model.answers)
             for answer_log_model in answer_log_models]
            for answer_log_models in answer_log_models_list
        ]

    @classmethod
    def get(cls, exploration_id, state_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_multi([(exploration_id, state_name)], [rule_str])[0][0]

    def get_top_answers(self, num_answers_to_return):
        """Returns the top `num_answers_to_return` answers.

        Args:
            num_answers_to_return: the maximum number of answers to return.

        Returns:
            A list of (answer, count) tuples for the `num_answers_to_return`
            answers with the highest counts.
        """
        return sorted(
            self.answers.iteritems(), key=operator.itemgetter(1),
            reverse=True)[:num_answers_to_return]
