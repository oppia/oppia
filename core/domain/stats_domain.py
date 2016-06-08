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
import sys
import utils

from core.domain import interaction_registry
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
    def get_multi(cls, exploration_id, rule_data):
        """Gets domain objects corresponding to the given rule data.

        Args:
            exploration_id: the exploration id
            rule_data: a list of dicts, each with the following keys:
                (state_name, rule_str).
        """
        # TODO(sll): Should each rule_str be unicode instead?
        answer_log_models = (
            stats_models.StateRuleAnswerLogModel.get_or_create_multi(
                exploration_id, rule_data))
        return [cls(answer_log_model.answers)
                for answer_log_model in answer_log_models]

    @classmethod
    def get(cls, exploration_id, state_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_multi(exploration_id, [{
            'state_name': state_name,
            'rule_str': rule_str
        }])[0]

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


class StateAnswers(object):
    """Domain object containing answers of states."""

    def __init__(self, exploration_id, exploration_version, state_name,
                 interaction_id, answers_list):
        """
        Initialize domain object for state answers.

        interaction_id contains the interaction type of the state, e.g.
        multiple choice.

        answers_list contains a list of answer dicts, each of which
        contains information about an answer, e.g. answer_value, session_id,
        time_spent_in_sec.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.interaction_id = interaction_id
        self.answers_list = answers_list

    def validate(self):
        """Validates StateAnswers domain object entity."""

        if not isinstance(self.exploration_id, basestring):
            raise utils.ValidationError(
                'Expected exploration_id to be a string, received %s' %
                self.exploration_id)

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s' %
                self.state_name)

        if self.interaction_id is not None:
            if not isinstance(self.interaction_id, basestring):
                raise utils.ValidationError(
                    'Expected interaction_id to be a string, received %s' %
                    str(self.interaction_id))

            # check if interaction_id is valid
            if (self.interaction_id not in
                    interaction_registry.Registry.get_all_interaction_ids()):
                raise utils.ValidationError(
                    'Unknown interaction id %s' % self.interaction_id)

        if not isinstance(self.answers_list, list):
            raise utils.ValidationError(
                'Expected answers_list to be a list, received %s' %
                self.answers_list)

        # Note: There is no need to validate content of answers_list here
        # because each answer is validated before it is appended to
        # answers_list (which is faster than validating whole answers_list
        # each time a new answer is recorded).


class StateAnswersCalcOutput(object):
    """Domain object that represents output of calculations operating on
    state answers.
    """

    def __init__(self, exploration_id, exploration_version, state_name,
                 calculation_id, calculation_output):
        """Initialize domain object for state answers calculation output.

        calculation_output is a list of dicts containing the results of the
        specific calculation.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.calculation_id = calculation_id
        self.calculation_output = calculation_output

    def save(self):
        """Validate the domain object and commit it to storage."""
        self.validate()
        stats_models.StateAnswersCalcOutputModel.create_or_update(
            self.exploration_id, self.exploration_version, self.state_name,
            self.calculation_id, self.calculation_output)

    def validate(self):
        """Validates StateAnswersCalcOutputModel domain object entity before
        it is commited to storage.
        """

        # There is a danger of data overflow if answer_opts exceeds 1
        # MB. We will address this later if it happens regularly. At
        # the moment, a ValidationError is raised if an answer exceeds
        # the maximum size.
        max_bytes_per_calc_output_data = 999999

        if not isinstance(self.exploration_id, basestring):
            raise utils.ValidationError(
                'Expected exploration_id to be a string, received %s' %
                self.exploration_id)

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s' %
                self.state_name)

        if not isinstance(self.calculation_id, basestring):
            raise utils.ValidationError(
                'Expected calculation_id to be a string, received %s' %
                self.calculation_id)

        output_data = self.calculation_output
        if sys.getsizeof(output_data) > max_bytes_per_calc_output_data:
            # TODO(msl): find a better way to deal with big
            # calculation output data, e.g. just skip. At the moment,
            # too long answers produce a ValidationError.
            raise utils.ValidationError(
                "calculation_output is too big to be stored: %s" %
                str(output_data))
