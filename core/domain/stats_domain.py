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

import numbers
import sys
import utils

from core.domain import exp_domain
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
# store this session ID unless it was created by the 2017 answer migration job
# (see #1205). Also, this string must never change.
MIGRATED_STATE_ANSWER_SESSION_ID_2017 = 'migrated_state_answer_session_id_2017'
MIGRATED_STATE_ANSWER_TIME_SPENT_IN_SEC = 0.0


# TODO(bhenning): Monitor sizes (lengths of submitted_answer_list) of these
# objects and determine if we should enforce an upper bound for
# submitted_answer_list.
class StateAnswers(object):
    """Domain object containing answers submitted to an exploration state."""

    def __init__(self, exploration_id, exploration_version, state_name,
                 interaction_id, submitted_answer_list,
                 schema_version=feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION):
        """Constructs a StateAnswers domain object.

        Args:
            exploration_id. The ID of the exploration corresponding to submitted
                answers.
            exploration_version. The version of the exploration corresponding to
                submitted answers.
            state_name. The state to which the answers were submitted.
            interaction_id. The ID of the interaction which created the answers.
            submitted_answer_list. The list of SubmittedAnswer domain objects
                that were submitted to the exploration and version specified in
                this object.
            schema_version. The schema version of this answers object.
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
                'Expected exploration_id to be a string, received %s' % str(
                    self.exploration_id))

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s' % str(
                    self.state_name))

        if self.interaction_id is not None:
            if not isinstance(self.interaction_id, basestring):
                raise utils.ValidationError(
                    'Expected interaction_id to be a string, received %s' % str(
                        self.interaction_id))

            # Verify interaction_id is valid.
            if (self.interaction_id not in
                    interaction_registry.Registry.get_all_interaction_ids()):
                raise utils.ValidationError(
                    'Unknown interaction_id: %s' % self.interaction_id)

        if not isinstance(self.submitted_answer_list, list):
            raise utils.ValidationError(
                'Expected submitted_answer_list to be a list, received %s' %
                str(self.submitted_answer_list))

        if not isinstance(self.schema_version, int):
            raise utils.ValidationError(
                'Expected schema_version to be an integer, received %s' % str(
                    self.schema_version))

        if self.schema_version < 1:
            raise utils.ValidationError(
                'schema_version < 1: %d' % self.schema_version)

        if self.schema_version > feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION:
            raise utils.ValidationError(
                'schema_version > feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION '
                '(%d): %d' % (
                    feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION,
                    self.schema_version))


class SubmittedAnswer(object):
    """Domain object representing an answer submitted to a state."""

    # NOTE TO DEVELOPERS: do not use the rule_spec_str and answer_str
    # parameters; they are only populated by the answer migration job. They only
    # represent context that is lost as part of the answer migration and are
    # used as part of validating the migration was correct. They may be
    # referenced in future migration or mapreduce jobs, or they may be removed
    # without warning or migration.

    # TODO(bhenning): Remove large_bucket_entity_id once the answer migration is
    # completed in production.
    def __init__(self, answer, interaction_id, answer_group_index,
                 rule_spec_index, classification_categorization, params,
                 session_id, time_spent_in_sec, rule_spec_str=None,
                 answer_str=None, large_bucket_entity_id=None):
        self.answer = answer
        self.interaction_id = interaction_id
        self.answer_group_index = answer_group_index
        self.rule_spec_index = rule_spec_index
        self.classification_categorization = classification_categorization
        self.params = params
        self.session_id = session_id
        self.time_spent_in_sec = time_spent_in_sec
        self.rule_spec_str = rule_spec_str
        self.answer_str = answer_str
        self.large_bucket_entity_id = large_bucket_entity_id

    def to_dict(self):
        submitted_answer_dict = {
            'answer': self.answer,
            'interaction_id': self.interaction_id,
            'answer_group_index': self.answer_group_index,
            'rule_spec_index': self.rule_spec_index,
            'classification_categorization': self.classification_categorization,
            'params': self.params,
            'session_id': self.session_id,
            'time_spent_in_sec': self.time_spent_in_sec,
        }
        if self.rule_spec_str is not None:
            submitted_answer_dict['rule_spec_str'] = self.rule_spec_str
        if self.answer_str is not None:
            submitted_answer_dict['answer_str'] = self.answer_str
        if self.large_bucket_entity_id is not None:
            submitted_answer_dict['large_bucket_entity_id'] = (
                self.large_bucket_entity_id)
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
            answer_str=submitted_answer_dict.get('answer_str'),
            large_bucket_entity_id=submitted_answer_dict.get(
                'large_bucket_entity_id'))

    def validate(self):
        """Validates this submitted answer object."""
        # TODO(bhenning): Validate the normalized answer against future answer
        # objects after #956 is addressed.
        if self.time_spent_in_sec is None:
            raise utils.ValidationError(
                'SubmittedAnswers must have a provided time_spent_in_sec')
        if self.session_id is None:
            raise utils.ValidationError(
                'SubmittedAnswers must have a provided session_id')

        if self.rule_spec_str is not None and not isinstance(
                self.rule_spec_str, basestring):
            raise utils.ValidationError(
                'Expected rule_spec_str to be either None or a string, '
                'received %s' % str(self.rule_spec_str))

        if self.answer_str is not None and not isinstance(
                self.answer_str, basestring):
            raise utils.ValidationError(
                'Expected answer_str to be either None or a string, received '
                '%s' % str(self.answer_str))

        if not isinstance(self.session_id, basestring):
            raise utils.ValidationError(
                'Expected session_id to be a string, received %s' %
                str(self.session_id))

        if not isinstance(self.time_spent_in_sec, numbers.Number):
            raise utils.ValidationError(
                'Expected time_spent_in_sec to be a number, received %s' %
                str(self.time_spent_in_sec))

        if not isinstance(self.params, dict):
            raise utils.ValidationError(
                'Expected params to be a dict, received %s' % str(self.params))

        if not isinstance(self.answer_group_index, int):
            raise utils.ValidationError(
                'Expected answer_group_index to be an integer, received %s' %
                str(self.answer_group_index))

        if not isinstance(self.rule_spec_index, int):
            raise utils.ValidationError(
                'Expected rule_spec_index to be an integer, received %s' %
                str(self.rule_spec_index))

        if self.answer_group_index < 0:
            raise utils.ValidationError(
                'Expected answer_group_index to be non-negative, received %d' %
                self.answer_group_index)

        if self.rule_spec_index < 0:
            raise utils.ValidationError(
                'Expected rule_spec_index to be non-negative, received %d' %
                self.rule_spec_index)

        if self.time_spent_in_sec < 0.:
            raise utils.ValidationError(
                'Expected time_spent_in_sec to be non-negative, received %f' %
                self.time_spent_in_sec)

        if self.answer is None and (
                self.interaction_id not in feconf.LINEAR_INTERACTION_IDS):
            raise utils.ValidationError(
                'SubmittedAnswers must have a provided answer except for '
                'linear interactions')

        valid_classification_categories = [
            exp_domain.EXPLICIT_CLASSIFICATION,
            exp_domain.TRAINING_DATA_CLASSIFICATION,
            exp_domain.STATISTICAL_CLASSIFICATION,
            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION]
        if self.classification_categorization not in (
                valid_classification_categories):
            raise utils.ValidationError(
                'Expected valid classification_categorization, received %s' %
                self.classification_categorization)


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
                'Expected exploration_id to be a string, received %s' % str(
                    self.exploration_id))

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s' % str(
                    self.state_name))

        if not isinstance(self.calculation_id, basestring):
            raise utils.ValidationError(
                'Expected calculation_id to be a string, received %s' % str(
                    self.calculation_id))

        output_data = self.calculation_output
        if sys.getsizeof(output_data) > max_bytes_per_calc_output_data:
            # TODO(msl): find a better way to deal with big
            # calculation output data, e.g. just skip. At the moment,
            # too long answers produce a ValidationError.
            raise utils.ValidationError(
                'calculation_output is too big to be stored (size: %d): %s' % (
                    sys.getsizeof(output_data), str(output_data)))
