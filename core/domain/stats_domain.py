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
import feconf

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


# These are special sentinel values attributed to answers migrated from the old
# answer storage model. Those answers could not have session IDs or time spent
# values inferred or reconstituted perfectly, so they are assigned these
# values, instead. Logic and jobs which use these values are expected to skip
# over the migrated answers to avoid tainted results. Furthermore, all migrated
# answers are easy to retrieve by reducing session value on this session ID.
# NOTE TO DEVELOPERS: All other state answer data model entities must not ever
# store this session ID unless it was created by the AnswerMigrationJob. Also,
# this string must never change.
MIGRATED_STATE_ANSWER_SESSION_ID = 'migrated_state_answer_session_id'
MIGRATED_STATE_ANSWER_TIME_SPENT_IN_SEC = 0.0


# TODO(bhenning): Remove this.
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
    def get_multi_by_multi_explorations(
            cls, exploration_state_list, rule_str_list):
        """Gets domain objects given a list of exploration and state tuples.

        Args:
            exploration_state_list: a list of exploration ID and state name
                tuples
            rule_str_list: a list of rule spec strings which are used to filter
                the answers matched to the provided explorations and states

        Returns a list of StateRuleAnswerLog objects containing answers matched
        to each exploration ID-state name. The number of elements returned is
        the same as the number of elements passed in exploration_state_list. The
        number of answers in each StateRuleAnswerLog object depends on the
        number of answers matched against each rule spec strings specified in
        rule_str_list.
        """
        # TODO(sll): Should each rule_str be unicode instead?
        answer_log_models_list = (
            stats_models.StateRuleAnswerLogModel.get_or_create_multi_for_multi_explorations( # pylint: disable=line-too-long
                exploration_state_list, rule_str_list))
        answer_log_list = []
        for answer_log_models in answer_log_models_list:
            combined_answers = {}
            for answer_log_model in answer_log_models:
                for answer, frequency in answer_log_model.answers.iteritems():
                    if answer in combined_answers:
                        combined_answers[answer] += frequency
                    else:
                        combined_answers[answer] = frequency
            answer_log_list.append(cls(combined_answers))
        return answer_log_list

    @classmethod
    def get_multi(cls, exploration_id, rule_data):
        """Gets domain objects corresponding to the given rule data.
        Args:
            exploration_id: the exploration id
            rule_data: a list of dicts, each with the following keys:
                (state_name, rule_str).
        """
        # TODO(sll): Should each rule_str be unicode instead?
        # TODO(bhenning): Combine this with get_multi_by_multi_explorations as
        # part of the answer migration project.
        answer_log_models = (
            stats_models.StateRuleAnswerLogModel.get_or_create_multi(
                exploration_id, rule_data))
        return [cls(answer_log_model.answers)
                for answer_log_model in answer_log_models]

    @classmethod
    def get(cls, exploration_id, state_name, rule_str):
        # TODO(sll): Deprecate this method.
        return cls.get_multi_by_multi_explorations(
            [(exploration_id, state_name)], [rule_str])[0]

    def get_all_top_answers(self):
        """Returns a list of (answer, count) sorted by count."""

        return sorted(
            self.answers.iteritems(), key=operator.itemgetter(1),
            reverse=True)

    def get_top_answers(self, num_answers_to_return):
        """Returns the top `num_answers_to_return` answers.

        Args:
            num_answers_to_return: the maximum number of answers to return.

        Returns:
            A list of (answer, count) tuples for the `num_answers_to_return`
            answers with the highest counts.
        """
        return self.get_all_top_answers()[:num_answers_to_return]


class StateAnswers(object):
    """Domain object containing answers submitted to an exploration state."""

    def __init__(self, exploration_id, exploration_version, state_name,
                 interaction_id, submitted_answer_list,
                 schema_version=feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION):
        """Initialize domain object for state answers.

        interaction_id contains the interaction type of the state, e.g.
        multiple choice.

        submitted_answer_list contains a list of SubmittedAnswer objects.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.interaction_id = interaction_id
        self.submitted_answer_list = submitted_answer_list
        self.schema_version = schema_version

    def get_submitted_answer_dict_list(self):
        """Returns the submitted_answer_list stored within this object as a list
        of StateAnswer dicts.
        """
        return [state_answer.to_dict()
                for state_answer in self.submitted_answer_list]

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
                    self.interaction_id)

            # Verify interaction_id is valid.
            if (self.interaction_id not in
                    interaction_registry.Registry.get_all_interaction_ids()):
                raise utils.ValidationError(
                    'Unknown interaction id %s' % self.interaction_id)

        if not isinstance(self.submitted_answer_list, list):
            raise utils.ValidationError(
                'Expected submitted_answer_list to be a list, received %s' %
                self.submitted_answer_list)

        for submitted_answer in self.submitted_answer_list:
            submitted_answer.validate()


class SubmittedAnswer(object):
    """Domain object representing an answer submitted to a state."""

    # There is a danger of data overflow if the answer log exceeds 1 MB. Given
    # 1000-5000 answers, each answer must be at most 200-1000 bytes in size. We
    # will address this later if it happens regularly. At the moment, a
    # ValidationError is raised if an answer exceeds the maximum size.
    _MAX_BYTES_PER_ANSWER = 2500

    # Prefix of strings that are cropped because they are too long.
    _CROPPED_PREFIX_STRING = 'CROPPED: '

    # Answer value that is stored if non-string answer is too big
    # pylint: disable=invalid-name
    _PLACEHOLDER_FOR_TOO_LARGE_NONSTRING = 'TOO LARGE NONSTRING'

    # NOTE TO DEVELOPERS: do not use the rule_spec_str and answer_str
    # parameters, as they are here as part of the answer migration.
    def __init__(self, normalized_answer, interaction_id, answer_group_index,
                 rule_spec_index, classification_categorization, params,
                 session_id, time_spent_in_sec, rule_spec_str=None,
                 answer_str=None):
        self.normalized_answer = normalized_answer
        self.interaction_id = interaction_id
        self.answer_group_index = answer_group_index
        self.rule_spec_index = rule_spec_index
        self.classification_categorization = classification_categorization
        self.params = params
        self.session_id = session_id
        self.time_spent_in_sec = time_spent_in_sec
        self.rule_spec_str = rule_spec_str
        self.answer_str = answer_str

    def to_dict(self):
        submitted_answer_dict = {
            'answer': self.normalized_answer,
            'interaction_id': self.interaction_id,
            'answer_group_index': self.answer_group_index,
            'rule_spec_index': self.rule_spec_index,
            'classification_categorization': self.classification_categorization,
            'params': self.params,
            'session_id': self.session_id,
            'time_spent_in_sec': self.time_spent_in_sec
        }
        if self.rule_spec_str is not None:
            submitted_answer_dict['rule_spec_str'] = self.rule_spec_str
        if self.answer_str is not None:
            submitted_answer_dict['answer_str'] = self.answer_str
        return submitted_answer_dict

    @classmethod
    def from_dict(cls, submitted_answer_dict):
        return cls(
            submitted_answer_dict['answer'],
            submitted_answer_dict['interaction_id'],
            submitted_answer_dict['answer_group_index'],
            submitted_answer_dict['rule_spec_index'],
            submitted_answer_dict['classification_categorization'],
            submitted_answer_dict['params'],
            submitted_answer_dict['session_id'],
            submitted_answer_dict['time_spent_in_sec'],
            rule_spec_str=submitted_answer_dict.get('rule_spec_str'),
            answer_str=submitted_answer_dict.get('answer_str'))

    def validate(self):
        """Validates this submitted answer object."""
        # TODO(msl): These validation methods need tests to ensure that
        # the right errors show up in the various cases.

        # It's valid for normalized_answer to be None if the interaction type is
        # Continue.
        # TODO(bhenning): Validate the normalized answer against future answer
        # objects after #956 is addressed.

        if self.time_spent_in_sec is None:
            raise utils.ValidationError(
                'SubmittedAnswers must have a provided time_spent_in_sec')
        if self.session_id is None:
            raise utils.ValidationError(
                'SubmittedAnswers must have a provided session_id')

        if not isinstance(self.session_id, basestring):
            raise utils.ValidationError(
                'Expected session_id to be a string, received %s' %
                str(self.session_id))

        if not isinstance(self.time_spent_in_sec, float):
            raise utils.ValidationError(
                'Expected time_spent_in_sec to be a float, received %s' %
                str(self.time_spent_in_sec))

        if self.time_spent_in_sec < 0.:
            raise utils.ValidationError(
                'Expected time_spent_in_sec to be non-negative, received %f' %
                self.time_spent_in_sec)


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

        # There is a danger of data overflow if answer_opts exceeds 1MB. This
        # will be addressed later if it happens regularly. At the moment, a
        # ValidationError is raised if an answer exceeds the maximum size.
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
