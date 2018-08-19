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

from core.domain import action_registry
from core.domain import exp_domain
from core.domain import interaction_registry
from core.domain import issue_registry
from core.domain import state_domain
from core.platform import models
import feconf
import utils

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

# These values dictate the types of calculation objects stored in
# StateAnswersCalcOutput.
CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST = 'AnswerFrequencyList'
CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS = (
    'CategorizedAnswerFrequencyLists')


class ExplorationStats(object):
    """Domain object representing analytics data for an exploration."""

    def __init__(
            self, exp_id, exp_version, num_starts_v1, num_starts_v2,
            num_actual_starts_v1, num_actual_starts_v2, num_completions_v1,
            num_completions_v2, state_stats_mapping):
        """Constructs an ExplorationStats domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            num_starts_v1: int. Number of learners who started the exploration.
            num_starts_v2: int. As above, but for events with version 2.
            num_actual_starts_v1: int. Number of learners who actually attempted
                the exploration. These are the learners who have completed the
                initial state of the exploration and traversed to the next
                state.
            num_actual_starts_v2: int. As above, but for events with version 2.
            num_completions_v1: int. Number of learners who completed the
                exploration.
            num_completions_v2: int. As above, but for events with version 2.
            state_stats_mapping: dict. A dictionary mapping the state names of
                an exploration to the corresponding StateStats domain object.
        """
        self.exp_id = exp_id
        self.exp_version = exp_version
        self.num_starts_v1 = num_starts_v1
        self.num_starts_v2 = num_starts_v2
        self.num_actual_starts_v1 = num_actual_starts_v1
        self.num_actual_starts_v2 = num_actual_starts_v2
        self.num_completions_v1 = num_completions_v1
        self.num_completions_v2 = num_completions_v2
        self.state_stats_mapping = state_stats_mapping

    @property
    def num_starts(self):
        """Returns the number of learners who started the exploration.

        Returns:
            int. The number of learners who started the exploration.
        """
        return self.num_starts_v1 + self.num_starts_v2

    @property
    def num_actual_starts(self):
        """Returns the number of learners who actually attempted the
        exploration. These are the learners who have completed the initial
        state of the exploration and traversed to the next state.

        Returns:
            int. The number of learners who actually attempted
                the exploration.
        """
        return self.num_actual_starts_v1 + self.num_actual_starts_v2

    @property
    def num_completions(self):
        """Returns the number of learners who completed the exploration.

        Returns:
            int. The number of learners who completed the exploration.
        """
        return self.num_completions_v1 + self.num_completions_v2

    def to_dict(self):
        """Returns a dict representation of the domain object."""
        state_stats_mapping_dict = {}
        for state_name in self.state_stats_mapping:
            state_stats_mapping_dict[state_name] = self.state_stats_mapping[
                state_name].to_dict()

        exploration_stats_dict = {
            'exp_id': self.exp_id,
            'exp_version': self.exp_version,
            'num_starts_v1': self.num_starts_v1,
            'num_starts_v2': self.num_starts_v2,
            'num_actual_starts_v1': self.num_actual_starts_v1,
            'num_actual_starts_v2': self.num_actual_starts_v2,
            'num_completions_v1': self.num_completions_v1,
            'num_completions_v2': self.num_completions_v2,
            'state_stats_mapping': state_stats_mapping_dict
        }
        return exploration_stats_dict

    def to_frontend_dict(self):
        """Returns a dict representation of the domain object for use in the
        frontend.
        """
        state_stats_mapping_dict = {}
        for state_name in self.state_stats_mapping:
            state_stats_mapping_dict[state_name] = self.state_stats_mapping[
                state_name].to_frontend_dict()

        exploration_stats_dict = {
            'exp_id': self.exp_id,
            'exp_version': self.exp_version,
            'num_starts': self.num_starts,
            'num_actual_starts': self.num_actual_starts,
            'num_completions': self.num_completions,
            'state_stats_mapping': state_stats_mapping_dict
        }
        return exploration_stats_dict

    @classmethod
    def create_default(cls, exp_id, exp_version, state_stats_mapping):
        """Creates a ExplorationStats domain object and sets all properties to
        0.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            state_stats_mapping: dict. A dict mapping state names to their
                corresponding StateStats.

        Returns:
            ExplorationStats. The exploration stats domain object.
        """
        return cls(exp_id, exp_version, 0, 0, 0, 0, 0, 0, state_stats_mapping)

    def get_sum_of_first_hit_counts(self):
        """Compute the sum of first hit counts for the exploration stats.

        Returns:
            int. Sum of first hit counts.
        """
        sum_first_hits = 0
        for state_name in self.state_stats_mapping:
            state_stats = self.state_stats_mapping[state_name]
            sum_first_hits += state_stats.first_hit_count
        return sum_first_hits

    def validate(self):
        """Validates the ExplorationStats domain object."""

        exploration_stats_properties = [
            'num_starts_v1',
            'num_starts_v2',
            'num_actual_starts_v1',
            'num_actual_starts_v2',
            'num_completions_v1',
            'num_completions_v2',
        ]

        if not isinstance(self.exp_id, basestring):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % (self.exp_id))

        if not isinstance(self.exp_version, int):
            raise utils.ValidationError(
                'Expected exp_version to be an int, received %s' % (
                    self.exp_version))

        exploration_stats_dict = self.to_dict()

        for stat_property in exploration_stats_properties:
            if not isinstance(exploration_stats_dict[stat_property], int):
                raise utils.ValidationError(
                    'Expected %s to be an int, received %s' % (
                        stat_property, exploration_stats_dict[stat_property]))
            if exploration_stats_dict[stat_property] < 0:
                raise utils.ValidationError(
                    '%s cannot have negative values' % (stat_property))

        if not isinstance(self.state_stats_mapping, dict):
            raise utils.ValidationError(
                'Expected state_stats_mapping to be a dict, received %s' % (
                    self.state_stats_mapping))


class StateStats(object):
    """Domain object representing analytics data for an exploration's state.
    Instances of these domain objects pertain to the exploration ID and version
    as well.
    """

    def __init__(
            self, total_answers_count_v1, total_answers_count_v2,
            useful_feedback_count_v1, useful_feedback_count_v2,
            total_hit_count_v1, total_hit_count_v2, first_hit_count_v1,
            first_hit_count_v2, num_times_solution_viewed_v2,
            num_completions_v1, num_completions_v2):
        """Constructs a StateStats domain object.

        Args:
            total_answers_count_v1: int. Total number of answers submitted to
                this state.
            total_answers_count_v2: int. As above, but for events with version
                2.
            useful_feedback_count_v1: int. Total number of answers that received
                useful feedback.
            useful_feedback_count_v2: int. As above, but for events with version
                2.
            total_hit_count_v1: int. Total number of times the state was
                entered.
            total_hit_count_v2: int. As above, but for events with version 2.
            first_hit_count_v1: int. Number of times the state was entered for
                the first time.
            first_hit_count_v2: int. As above, but for events with version 2.
            num_times_solution_viewed_v2: int. Number of times the solution
                button was triggered to answer a state (only for version 2).
            num_completions_v1: int. Number of times the state was completed.
            num_completions_v2: int. As above, but for events with version 2.
        """
        self.total_answers_count_v1 = total_answers_count_v1
        self.total_answers_count_v2 = total_answers_count_v2
        self.useful_feedback_count_v1 = useful_feedback_count_v1
        self.useful_feedback_count_v2 = useful_feedback_count_v2
        self.total_hit_count_v1 = total_hit_count_v1
        self.total_hit_count_v2 = total_hit_count_v2
        self.first_hit_count_v1 = first_hit_count_v1
        self.first_hit_count_v2 = first_hit_count_v2
        # Solution view analytics were only introduced in v2, and there are no
        # existing event models in v1 that record solution viewed events.
        self.num_times_solution_viewed_v2 = num_times_solution_viewed_v2
        self.num_completions_v1 = num_completions_v1
        self.num_completions_v2 = num_completions_v2

    @property
    def total_answers_count(self):
        """Returns the total number of answers submitted to this state.

        Returns:
            int. The total number of answers submitted to this state.
        """
        return self.total_answers_count_v1 + self.total_answers_count_v2

    @property
    def useful_feedback_count(self):
        """Returns the total number of answers that received useful feedback.

        Returns:
            int. The total number of answers that received useful feedback.
        """
        return self.useful_feedback_count_v1 + self.useful_feedback_count_v2

    @property
    def total_hit_count(self):
        """Returns the total number of times the state was entered.

        Returns:
            int. The total number of times the state was entered.
        """
        return self.total_hit_count_v1 + self.total_hit_count_v2

    @property
    def first_hit_count(self):
        """Returns the number of times the state was entered for the first time.

        Returns:
            int. The number of times the state was entered for the first time.
        """
        return self.first_hit_count_v1 + self.first_hit_count_v2

    @property
    def num_completions(self):
        """Returns total number of times the state was completed.

        Returns:
            int. The total number of times the state was completed.
        """
        return self.num_completions_v1 + self.num_completions_v2

    @property
    def num_times_solution_viewed(self):
        """Returns the number of times the solution button was triggered.

        Returns:
            int. Number of times the solution button was triggered to answer a
                state only for events for schema version 2.
        """
        return self.num_times_solution_viewed_v2

    @classmethod
    def create_default(cls):
        """Creates a StateStats domain object and sets all properties to 0."""
        return cls(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

    def to_dict(self):
        """Returns a dict representation of the domain object."""
        state_stats_dict = {
            'total_answers_count_v1': self.total_answers_count_v1,
            'total_answers_count_v2': self.total_answers_count_v2,
            'useful_feedback_count_v1': self.useful_feedback_count_v1,
            'useful_feedback_count_v2': self.useful_feedback_count_v2,
            'total_hit_count_v1': self.total_hit_count_v1,
            'total_hit_count_v2': self.total_hit_count_v2,
            'first_hit_count_v1': self.first_hit_count_v1,
            'first_hit_count_v2': self.first_hit_count_v2,
            'num_times_solution_viewed_v2': (
                self.num_times_solution_viewed_v2),
            'num_completions_v1': self.num_completions_v1,
            'num_completions_v2': self.num_completions_v2
        }
        return state_stats_dict

    def to_frontend_dict(self):
        """Returns a dict representation of the domain object for use in the
        frontend.
        """
        state_stats_dict = {
            'total_answers_count': self.total_answers_count,
            'useful_feedback_count': self.useful_feedback_count,
            'total_hit_count': self.total_hit_count,
            'first_hit_count': self.first_hit_count,
            'num_times_solution_viewed': self.num_times_solution_viewed,
            'num_completions': self.num_completions
        }
        return state_stats_dict

    @classmethod
    def from_dict(cls, state_stats_dict):
        """Constructs a StateStats domain object from a dict."""
        return cls(
            state_stats_dict['total_answers_count_v1'],
            state_stats_dict['total_answers_count_v2'],
            state_stats_dict['useful_feedback_count_v1'],
            state_stats_dict['useful_feedback_count_v2'],
            state_stats_dict['total_hit_count_v1'],
            state_stats_dict['total_hit_count_v2'],
            state_stats_dict['first_hit_count_v1'],
            state_stats_dict['first_hit_count_v2'],
            state_stats_dict['num_times_solution_viewed_v2'],
            state_stats_dict['num_completions_v1'],
            state_stats_dict['num_completions_v2']
        )

    def validate(self):
        """Validates the StateStats domain object."""

        state_stats_properties = [
            'total_answers_count_v1',
            'total_answers_count_v2',
            'useful_feedback_count_v1',
            'useful_feedback_count_v2',
            'total_hit_count_v1',
            'total_hit_count_v2',
            'first_hit_count_v1',
            'first_hit_count_v2',
            'num_times_solution_viewed_v2',
            'num_completions_v1',
            'num_completions_v2'
        ]

        state_stats_dict = self.to_dict()

        for stat_property in state_stats_properties:
            if not isinstance(state_stats_dict[stat_property], int):
                raise utils.ValidationError(
                    'Expected %s to be an int, received %s' % (
                        stat_property, state_stats_dict[stat_property]))
            if state_stats_dict[stat_property] < 0:
                raise utils.ValidationError(
                    '%s cannot have negative values' % (stat_property))


class ExplorationIssues(object):
    """Domain object representing the exploration to issues mapping for an
    exploration.
    """

    def __init__(self, exp_id, exp_version, unresolved_issues):
        """Constructs an ExplorationIssues domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            unresolved_issues: list(ExplorationIssue). List of exploration
                issues.
        """
        self.exp_id = exp_id
        self.exp_version = exp_version
        self.unresolved_issues = unresolved_issues

    @classmethod
    def create_default(cls, exp_id, exp_version):
        """Creates a default ExplorationIssues domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            ExplorationIssues. The exploration issues domain object.
        """
        return cls(exp_id, exp_version, [])

    def to_dict(self):
        """Returns a dict representation of the ExplorationIssues domain object.

        Returns:
            dict. A dict mapping of all fields of ExplorationIssues object.
        """
        unresolved_issue_dicts = [
            unresolved_issue.to_dict()
            for unresolved_issue in self.unresolved_issues]
        return {
            'exp_id': self.exp_id,
            'exp_version': self.exp_version,
            'unresolved_issues': unresolved_issue_dicts
        }

    @classmethod
    def from_dict(cls, exp_issues_dict):
        """Returns an ExplorationIssues object from a dict.

        Args:
            exp_issues_dict: dict. A dict mapping of all fields of
                ExplorationIssues object.

        Returns:
            ExplorationIssues. The corresponding ExplorationIssues domain
                object.
        """
        unresolved_issues = [
            ExplorationIssue.from_dict(unresolved_issue_dict)
            for unresolved_issue_dict in exp_issues_dict['unresolved_issues']]
        return cls(
            exp_issues_dict['exp_id'], exp_issues_dict['exp_version'],
            unresolved_issues)

    def validate(self):
        """Validates the ExplorationIssues domain object."""
        if not isinstance(self.exp_id, basestring):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % type(
                    self.exp_id))

        if not isinstance(self.exp_version, int):
            raise utils.ValidationError(
                'Expected exp_version to be an int, received %s' % type(
                    self.exp_version))

        if not isinstance(self.unresolved_issues, list):
            raise utils.ValidationError(
                'Expected unresolved_issues to be a list, received %s' % (
                    type(self.unresolved_issues)))

        for issue in self.unresolved_issues:
            issue.validate()


class Playthrough(object):
    """Domain object representing a learner playthrough.
    """

    def __init__(
            self, exp_id, exp_version, issue_type, issue_customization_args,
            actions):
        """Constructs a Playthrough domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.
            issue_type: str. Type of the issue.
            issue_customization_args: dict. The customization args dict for the
                given issue_type.
            actions: list(LearnerAction). List of playthrough learner actions.
        """
        self.exp_id = exp_id
        self.exp_version = exp_version
        self.issue_type = issue_type
        self.issue_customization_args = issue_customization_args
        self.actions = actions

    def to_dict(self):
        """Returns a dict representation of the Playthrough domain object.

        Returns:
            dict. A dict mapping of all fields of Playthrough object.
        """
        action_dicts = [action.to_dict() for action in self.actions]
        return {
            'exp_id': self.exp_id,
            'exp_version': self.exp_version,
            'issue_type': self.issue_type,
            'issue_customization_args': self.issue_customization_args,
            'actions': action_dicts,
        }

    @classmethod
    def from_dict(cls, playthrough_dict):
        """Returns a Playthrough object from a dict.

        Args:
            playthrough_dict: dict. A dict mapping of all fields of Playthrough
                object.

        Returns:
            Playthrough. The corresponding Playthrough domain object.
        """
        actions = [
            LearnerAction.from_dict(action_dict)
            for action_dict in playthrough_dict['actions']]
        return cls(
            playthrough_dict['exp_id'],
            playthrough_dict['exp_version'],
            playthrough_dict['issue_type'],
            playthrough_dict['issue_customization_args'],
            actions)

    @classmethod
    def from_backend_dict(cls, playthrough_data):
        """Checks whether the playthrough dict has the correct keys and then
        returns a domain object instance.

        Args:
            playthrough_data: dict. Dict representing a playthrough.

        Returns:
            Playthrough. A playthrough domain object.
        """
        playthrough_properties = [
            'exp_id', 'exp_version', 'issue_type',
            'issue_customization_args', 'actions']

        for playthrough_property in playthrough_properties:
            if playthrough_property not in playthrough_data:
                raise utils.ValidationError(
                    '%s not in playthrough data dict.' % (
                        playthrough_property))

        actions = [
            LearnerAction.from_dict(action_dict)
            for action_dict in playthrough_data['actions']]

        playthrough = cls(
            playthrough_data['exp_id'],
            playthrough_data['exp_version'],
            playthrough_data['issue_type'],
            playthrough_data['issue_customization_args'],
            actions)

        playthrough.validate()
        return playthrough

    def validate(self):
        """Validates the Playthrough domain object."""
        if not isinstance(self.exp_id, basestring):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % type(
                    self.exp_id))

        if not isinstance(self.exp_version, int):
            raise utils.ValidationError(
                'Expected exp_version to be an int, received %s' % (
                    type(self.exp_version)))

        if not isinstance(self.issue_type, basestring):
            raise utils.ValidationError(
                'Expected issue_type to be a string, received %s' % type(
                    self.issue_type))

        if not isinstance(self.issue_customization_args, dict):
            raise utils.ValidationError(
                'Expected issue_customization_args to be a dict, '
                'received %s' % (
                    type(self.issue_customization_args)))

        try:
            issue = issue_registry.Registry.get_issue_by_type(
                self.issue_type)
        except KeyError:
            raise utils.ValidationError('Invalid issue type: %s' % (
                self.issue_type))

        state_domain.validate_customization_args_and_values(
            'issue', self.issue_type, self.issue_customization_args,
            issue.customization_arg_specs)

        if not isinstance(self.actions, list):
            raise utils.ValidationError(
                'Expected actions to be a list, received %s' % (
                    type(self.actions)))

        for action in self.actions:
            action.validate()


class ExplorationIssue(object):
    """Domain object representing an exploration issue."""

    def __init__(
            self, issue_type, issue_customization_args, playthrough_ids,
            schema_version, is_valid):
        """Constructs an ExplorationIssue domain object.

        Args:
            issue_type: str. Type of the issue.
            issue_customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
            playthrough_ids: list(str). List of playthrough IDs.
            schema_version: int. Schema version for the exploration issue.
            is_valid: bool. Whether the issue and the associated playthroughs
                are valid.
        """
        self.issue_type = issue_type
        self.issue_customization_args = issue_customization_args
        self.playthrough_ids = playthrough_ids
        self.schema_version = schema_version
        self.is_valid = is_valid

    def to_dict(self):
        """Returns a dict representation of the ExplorationIssue domain object.

        Returns:
            dict. A dict mapping of all fields of ExplorationIssue object.
        """
        return {
            'issue_type': self.issue_type,
            'issue_customization_args': (
                state_domain.get_full_customization_args(
                    self.issue_customization_args,
                    issue_registry.Registry.get_issue_by_type(
                        self.issue_type).customization_arg_specs)),
            'playthrough_ids': self.playthrough_ids,
            'schema_version': self.schema_version,
            'is_valid': self.is_valid
        }

    @classmethod
    def from_dict(cls, issue_dict):
        """Returns an ExplorationIssue object from a dict.

        Args:
            issue_dict: dict. A dict mapping of all fields of ExplorationIssue
                object.

        Returns:
            ExplorationIssue. The corresponding ExplorationIssue domain object.
        """
        return cls(
            issue_dict['issue_type'],
            issue_dict['issue_customization_args'],
            issue_dict['playthrough_ids'],
            issue_dict['schema_version'],
            issue_dict['is_valid'])

    @classmethod
    def from_backend_dict(cls, exp_issue_dict):
        """Checks whether the exploration issue dict has the correct keys and
        then returns a domain object instance.

        Args:
            exp_issue_dict: dict. Dict representing an exploration issue.

        Returns:
            ExplorationIssue. The exploration issue domain object.
        """
        exp_issue_properties = [
            'issue_type', 'schema_version', 'issue_customization_args',
            'playthrough_ids', 'is_valid']

        for exp_issue_property in exp_issue_properties:
            if exp_issue_property not in exp_issue_dict:
                raise utils.ValidationError(
                    '%s not in exploration issue dict.' % (exp_issue_property))

        dummy_exp_issue = cls(
            exp_issue_dict['issue_type'],
            exp_issue_dict['issue_customization_args'], [],
            exp_issue_dict['schema_version'], exp_issue_dict['is_valid'])

        dummy_exp_issue.validate()
        return dummy_exp_issue

    @classmethod
    def update_exp_issue_from_model(cls, issue_dict):
        """Converts the exploration issue blob given from
        current issue_schema_version to current issue_schema_version + 1.
        Note that the issue_dict being passed in is modified in-place.

        Args:
            issue_dict: dict. Dict representing the ExplorationIssue object.
        """
        current_issue_schema_version = issue_dict['schema_version']
        issue_dict['schema_version'] += 1

        conversion_fn = getattr(cls, '_convert_issue_v%s_dict_to_v%s_dict' % (
            current_issue_schema_version, current_issue_schema_version + 1))
        issue_dict = conversion_fn(issue_dict)

    @classmethod
    def _convert_issue_v1_dict_to_v2_dict(cls, issue_dict):
        """Converts a v1 issue dict to a v2 issue dict. This function is now
        implemented only for testing purposes and must be rewritten when an
        actual schema migration from v1 to v2 takes place.
        """
        raise NotImplementedError

    def validate(self):
        """Validates the ExplorationIssue domain object."""
        if not isinstance(self.issue_type, basestring):
            raise utils.ValidationError(
                'Expected issue_type to be a string, received %s' % (
                    type(self.issue_type)))

        if not isinstance(self.schema_version, int):
            raise utils.ValidationError(
                'Expected schema_version to be an int, received %s' % (
                    type(self.schema_version)))

        try:
            issue = issue_registry.Registry.get_issue_by_type(
                self.issue_type)
        except KeyError:
            raise utils.ValidationError('Invalid issue type: %s' % (
                self.issue_type))

        state_domain.validate_customization_args_and_values(
            'issue', self.issue_type, self.issue_customization_args,
            issue.customization_arg_specs)

        if not isinstance(self.playthrough_ids, list):
            raise utils.ValidationError(
                'Expected playthrough_ids to be a list, received %s' % (
                    type(self.playthrough_ids)))

        for playthrough_id in self.playthrough_ids:
            if not isinstance(playthrough_id, basestring):
                raise utils.ValidationError(
                    'Expected each playthrough_id to be a string, received '
                    '%s' % type(playthrough_id))


class LearnerAction(object):
    """Domain object representing a learner action."""

    def __init__(self, action_type, action_customization_args, schema_version):
        """Constructs a LearnerAction domain object.

        Args:
            action_type: str. Type of the action.
            action_customization_args: dict. The customization dict. The keys
                are names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
            schema_version: int. Schema version for the learner action.
        """
        self.action_type = action_type
        self.action_customization_args = action_customization_args
        self.schema_version = schema_version

    def to_dict(self):
        """Returns a dict representation of the LearnerAction domain object.

        Returns:
            dict. A dict mapping of all fields of LearnerAction object.
        """
        return {
            'action_type': self.action_type,
            'action_customization_args': (
                state_domain.get_full_customization_args(
                    self.action_customization_args,
                    action_registry.Registry.get_action_by_type(
                        self.action_type).customization_arg_specs)),
            'schema_version': self.schema_version
        }

    @classmethod
    def from_dict(cls, action_dict):
        """Returns a LearnerAction object from a dict.

        Args:
            action_dict: dict. A dict mapping of all fields of LearnerAction
                object.

        Returns:
            LearnerAction. The corresponding LearnerAction domain object.
        """
        return cls(
            action_dict['action_type'],
            action_dict['action_customization_args'],
            action_dict['schema_version'])

    @classmethod
    def update_learner_action_from_model(cls, action_dict):
        """Converts the learner action blob given from
        current action_schema_version to current action_schema_version + 1.
        Note that the action_dict being passed in is modified in-place.

        Args:
            action_dict: dict. Dict representing the LearnerAction object.
        """
        current_action_schema_version = action_dict['schema_version']
        action_dict['schema_version'] += 1

        conversion_fn = getattr(cls, '_convert_action_v%s_dict_to_v%s_dict' % (
            current_action_schema_version, current_action_schema_version + 1))
        action_dict = conversion_fn(action_dict)

    @classmethod
    def _convert_action_v1_dict_to_v2_dict(cls, action_dict):
        """Converts a v1 action dict to a v2 action dict. This function is now
        implemented only for testing purposes and must be rewritten when an
        actual schema migration from v1 to v2 takes place.
        """
        raise NotImplementedError

    def validate(self):
        """Validates the LearnerAction domain object."""
        if not isinstance(self.action_type, basestring):
            raise utils.ValidationError(
                'Expected action_type to be a string, received %s' % (
                    type(self.action_type)))

        if not isinstance(self.schema_version, int):
            raise utils.ValidationError(
                'Expected schema_version to be an int, received %s' % (
                    type(self.schema_version)))

        try:
            action = action_registry.Registry.get_action_by_type(
                self.action_type)
        except KeyError:
            raise utils.ValidationError(
                'Invalid action type: %s' % self.action_type)

        state_domain.validate_customization_args_and_values(
            'action', self.action_type, self.action_customization_args,
            action.customization_arg_specs)


# TODO(bhenning): Monitor sizes (lengths of submitted_answer_list) of these
# objects and determine if we should enforce an upper bound for
# submitted_answer_list.
class StateAnswers(object):
    """Domain object containing answers submitted to an exploration state."""

    def __init__(
            self, exploration_id, exploration_version, state_name,
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

    def __init__(
            self, answer, interaction_id, answer_group_index,
            rule_spec_index, classification_categorization, params,
            session_id, time_spent_in_sec, rule_spec_str=None,
            answer_str=None):
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

    def to_dict(self):
        """Returns the dict of submitted answer.

        Returns:
            dict. The submitted answer dict.
        """
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
        return submitted_answer_dict

    @classmethod
    def from_dict(cls, submitted_answer_dict):
        """Returns the domain object representing an answer submitted to a
        state.

        Returns:
            SubmittedAnswer. The SubmittedAnswer domin object.
        """
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

        if self.rule_spec_index is not None and not (
                isinstance(self.rule_spec_index, int)):
            raise utils.ValidationError(
                'Expected rule_spec_index to be an integer, received %s' %
                str(self.rule_spec_index))

        if self.answer_group_index < 0:
            raise utils.ValidationError(
                'Expected answer_group_index to be non-negative, received %d' %
                self.answer_group_index)

        if self.rule_spec_index is not None and self.rule_spec_index < 0:
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


class AnswerOccurrence(object):
    """Domain object that represents a specific answer that occurred some number
    of times.
    """

    def __init__(self, answer, frequency):
        """Initialize domain object for answer occurrences."""
        self.answer = answer
        self.frequency = frequency

    def to_raw_type(self):
        """Returns a Python dict representing the specific answer.

        Returns:
            dict. The specific answer dict in the following format:
            {
                'answer': *. The answer submitted by the learner.
                'frequency': int. The number of occurrences of the answer.
            }
        """
        return {
            'answer': self.answer,
            'frequency': self.frequency
        }

    @classmethod
    def from_raw_type(cls, answer_occurrence_dict):
        """Returns domain object that represents a specific answer that occurred
        some number of times.

        Args:
            answer_occurrence_dict: dict. The specific answer dict in the
                following format:
                {
                    'answer': *. The answer submitted by the learner.
                    'frequency': int. The number of occurrences of the answer.
                }

        Returns:
            AnswerOccurrence. The AnswerOccurrence domain object.
        """
        return cls(
            answer_occurrence_dict['answer'],
            answer_occurrence_dict['frequency'])


class AnswerCalculationOutput(object):
    """Domain object superclass that represents the output of an answer
    calculation.
    """

    def __init__(self, calculation_output_type):
        self.calculation_output_type = calculation_output_type


class AnswerFrequencyList(AnswerCalculationOutput):
    """Domain object that represents an output list of AnswerOccurrences."""

    def __init__(self, answer_occurrences=None):
        """Initialize domain object for answer frequency list for a given list
        of AnswerOccurrence objects (default is empty list).
        """
        super(AnswerFrequencyList, self).__init__(
            CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST)
        self.answer_occurrences = (
            answer_occurrences if answer_occurrences else [])

    def to_raw_type(self):
        """Returns the answer occurrences list with each answer represented as
        a Python dict.

        Returns:
            list(dict). A list of answer occurrence dicts. Each dict has the
                following format:
                {
                    'answer': *. The answer submitted by the learner.
                    'frequency': int. The number of occurrences of the answer.
                }
        """
        return [
            answer_occurrence.to_raw_type()
            for answer_occurrence in self.answer_occurrences]

    @classmethod
    def from_raw_type(cls, answer_occurrence_list):
        """Creates a domain object that represents an output list of
        AnswerOccurrences.

        Args:
            answer_occurrence_list: list(dict). A list containing answer
                occurrence dicts in the following format:
                {
                    'answer': *. The answer submitted by the learner.
                    'frequency': int. The number of occurrences of the answer.
                }

        Returns:
            AnswerFrequencyList. The domain object for answer occurrences list.
        """
        return cls([
            AnswerOccurrence.from_raw_type(answer_occurrence_dict)
            for answer_occurrence_dict in answer_occurrence_list])


class CategorizedAnswerFrequencyLists(AnswerCalculationOutput):
    """AnswerFrequencyLists that are categorized based on arbitrary
    categories.
    """

    def __init__(self, categorized_answer_freq_lists=None):
        """Initialize domain object for categorized answer frequency lists for
        a given dict (default is empty).
        """
        super(CategorizedAnswerFrequencyLists, self).__init__(
            CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS)
        self.categorized_answer_freq_lists = (
            categorized_answer_freq_lists
            if categorized_answer_freq_lists else {})

    def to_raw_type(self):
        """Returns the categorized frequency Python dict.

        Returns:
            dict. A dict whose keys are category names and whose corresponding
                values are lists of answer frequency dicts. Each answer
                frequency dict has the following keys and values:
                {
                    'answer': *. The answer submitted by the learner.
                    'frequency': int. The number of occurrences of the answer.
                }
        """
        return {
            category: answer_frequency_list.to_raw_type()
            for category, answer_frequency_list in (
                self.categorized_answer_freq_lists.iteritems())
        }

    @classmethod
    def from_raw_type(cls, categorized_frequency_dict):
        """Returns the domain object for categorized answer frequency dict for
        a given dict.

        Args:
            categorized_frequency_dict: dict. The categorized answer frequency
                dict whose keys are category names and whose corresponding
                values are lists of answer frequency dicts. Each answer
                frequency dict has the following keys and values:
                {
                    'answer': *. The answer submitted by the learner.
                    'frequency': int. The number of occurrences of the answer.
                }

        Returns:
            CategorizedAnswerFrequencyLists. The domain object for categorized
                answer frequency dict.
        """
        return cls({
            category: AnswerFrequencyList.from_raw_type(answer_occurrence_list)
            for category, answer_occurrence_list in (
                categorized_frequency_dict.iteritems())
        })


class StateAnswersCalcOutput(object):
    """Domain object that represents output of calculations operating on
    state answers.
    """

    def __init__(
            self, exploration_id, exploration_version, state_name,
            interaction_id, calculation_id, calculation_output):
        """Initialize domain object for state answers calculation output.

        Args:
            exploration_id: str. The ID of the exploration corresponding to the
                answer calculation output.
            exploration_version: str. The version of the exploration
                corresponding to the answer calculation output.
            state_name: str. The name of the exploration state to which the
                aggregated answers were submitted.
            interaction_id: str. The ID of the interaction.
            calculation_id: str. Which calculation was performed on the given
                answer data.
            calculation_output: AnswerCalculationOutput. The output of an
                answer aggregation operation.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.calculation_id = calculation_id
        self.interaction_id = interaction_id
        self.calculation_output = calculation_output

    def save(self):
        """Validate the domain object and commit it to storage."""
        self.validate()
        stats_models.StateAnswersCalcOutputModel.create_or_update(
            self.exploration_id, self.exploration_version, self.state_name,
            self.interaction_id, self.calculation_id,
            self.calculation_output.calculation_output_type,
            self.calculation_output.to_raw_type())

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

        if (not isinstance(self.calculation_output, AnswerFrequencyList)
                and not isinstance(
                    self.calculation_output, CategorizedAnswerFrequencyLists)):
            raise utils.ValidationError(
                'Expected calculation output to be one of AnswerFrequencyList '
                'or CategorizedAnswerFrequencyLists, encountered: %s' % (
                    self.calculation_output))

        output_data = self.calculation_output.to_raw_type()
        if sys.getsizeof(output_data) > max_bytes_per_calc_output_data:
            # TODO(msl): find a better way to deal with big
            # calculation output data, e.g. just skip. At the moment,
            # too long answers produce a ValidationError.
            raise utils.ValidationError(
                'calculation_output is too big to be stored (size: %d): %s' % (
                    sys.getsizeof(output_data), str(output_data)))
