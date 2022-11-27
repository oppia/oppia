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

from __future__ import annotations

import datetime
import json
import numbers
import sys

from core import feconf
from core import utils
from core.constants import constants
from core.domain import customization_args_util
from core.domain import exp_domain

from typing import Any, Dict, Final, List, Literal, Optional, TypedDict, Union

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.
from core.domain import action_registry  # pylint: disable=invalid-import-from # isort:skip
from core.domain import interaction_registry  # pylint: disable=invalid-import-from # isort:skip
from core.domain import playthrough_issue_registry  # pylint: disable=invalid-import-from # isort:skip

MYPY = False
if MYPY:  # pragma: no cover
    from core.domain import state_domain

# These are special sentinel values attributed to answers migrated from the old
# answer storage model. Those answers could not have session IDs or time spent
# values inferred or reconstituted perfectly, so they are assigned these
# values, instead. Logic and jobs which use these values are expected to skip
# over the migrated answers to avoid tainted results. Furthermore, all migrated
# answers are easy to retrieve by reducing session value on this session ID.
# NOTE TO DEVELOPERS: All other state answer data model entities must not ever
# store this session ID unless it was created by the 2017 answer migration job
# (see #1205). Also, this string must never change.
MIGRATED_STATE_ANSWER_SESSION_ID_2017: Final = (
    'migrated_state_answer_session_id_2017')
MIGRATED_STATE_ANSWER_TIME_SPENT_IN_SEC: Final = 0.0

# These values dictate the types of calculation objects stored in
# StateAnswersCalcOutput.
CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST: Final = 'AnswerFrequencyList'
CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS: Final = (
    'CategorizedAnswerFrequencyLists')

# The maximum size in bytes the learner_answer_info_list can take
# in LearnerAnswerDetails.
MAX_LEARNER_ANSWER_INFO_LIST_BYTE_SIZE: Final = 900000

# The maximum size in bytes the answer_details can take in
# LearnerAnswerInfo.
MAX_ANSWER_DETAILS_BYTE_SIZE: Final = 10000

IssuesCustomizationArgsDictType = Dict[
    str, Dict[str, Union[str, int, List[str]]]
]


class SubmittedAnswerDict(TypedDict):
    """Dictionary representing the SubmittedAnswer object."""

    answer: state_domain.AcceptableCorrectAnswerTypes
    time_spent_in_sec: float
    answer_group_index: int
    rule_spec_index: int
    classification_categorization: str
    session_id: str
    interaction_id: str
    params: Dict[str, Union[str, int]]
    rule_spec_str: Optional[str]
    answer_str: Optional[str]


class StateAnswersDict(TypedDict):
    """Dictionary representing the StateAnswers object."""

    exploration_id: str
    exploration_version: int
    state_name: str
    interaction_id: str
    submitted_answer_list: List[SubmittedAnswerDict]


class ExplorationIssueDict(TypedDict):
    """Dictionary representing the ExplorationIssue object."""

    issue_type: str
    issue_customization_args: IssuesCustomizationArgsDictType
    playthrough_ids: List[str]
    schema_version: int
    is_valid: bool


class PlaythroughDict(TypedDict):
    """Dictionary representing the PlayThrough object."""

    exp_id: str
    exp_version: int
    issue_type: str
    issue_customization_args: IssuesCustomizationArgsDictType
    actions: List[LearnerActionDict]


class ExplorationIssuesDict(TypedDict):
    """Dictionary representing the ExplorationIssues object."""

    exp_id: str
    exp_version: int
    unresolved_issues: List[ExplorationIssueDict]


class LearnerAnswerDetailsDict(TypedDict):
    """Dictionary representing the LearnerAnswerDetail object."""

    state_reference: str
    entity_type: str
    interaction_id: str
    learner_answer_info_list: List[LearnerAnswerInfoDict]
    accumulated_answer_info_json_size_bytes: int
    learner_answer_info_schema_version: int


class ExplorationStatsDict(TypedDict):
    """Dictionary representing the ExplorationStats object."""

    exp_id: str
    exp_version: int
    num_starts_v1: int
    num_starts_v2: int
    num_actual_starts_v1: int
    num_actual_starts_v2: int
    num_completions_v1: int
    num_completions_v2: int
    state_stats_mapping: Dict[str, Dict[str, int]]


class ExplorationStatsFrontendDict(TypedDict):
    """Dictionary representing the ExplorationStats object
    for use in frontend."""

    exp_id: str
    exp_version: int
    num_starts: int
    num_actual_starts: int
    num_completions: int
    state_stats_mapping: Dict[str, Dict[str, int]]


# In argument 'customization_args', we used Any type because it accepts the
# values of customization args and that values can be of type str, int, Dict,
# bool, List and other types too. So to make it generalize for every type of
# values, we used Any here.
class LearnerActionDict(TypedDict):
    """Dictionary representing the LearnerAction object."""

    action_type: str
    action_customization_args: Dict[str, Dict[str, Union[str, int]]]
    schema_version: int


class AnswerOccurrenceDict(TypedDict):
    """Dictionary representing the AnswerOccurrence object."""

    answer: state_domain.AcceptableCorrectAnswerTypes
    frequency: int


class LearnerAnswerInfoDict(TypedDict):
    """Dictionary representing LearnerAnswerInfo object."""

    id: str
    answer: Optional[Union[str, int, Dict[str, str], List[str]]]
    answer_details: str
    created_on: str


class AggregatedStatsDict(TypedDict):
    """Dictionary representing aggregated_stats dict used to validate the
    SessionStateStats domain object."""

    num_starts: int
    num_actual_starts: int
    num_completions: int
    state_stats_mapping: Dict[str, Dict[str, int]]


class ExplorationStats:
    """Domain object representing analytics data for an exploration."""

    def __init__(
        self,
        exp_id: str,
        exp_version: int,
        num_starts_v1: int,
        num_starts_v2: int,
        num_actual_starts_v1: int,
        num_actual_starts_v2: int,
        num_completions_v1: int,
        num_completions_v2: int,
        state_stats_mapping: Dict[str, StateStats]
    ) -> None:
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
    def num_starts(self) -> int:
        """Returns the number of learners who started the exploration.

        Returns:
            int. The number of learners who started the exploration.
        """
        return self.num_starts_v1 + self.num_starts_v2

    @property
    def num_actual_starts(self) -> int:
        """Returns the number of learners who actually attempted the
        exploration. These are the learners who have completed the initial
        state of the exploration and traversed to the next state.

        Returns:
            int. The number of learners who actually attempted the exploration.
        """
        return self.num_actual_starts_v1 + self.num_actual_starts_v2

    @property
    def num_completions(self) -> int:
        """Returns the number of learners who completed the exploration.

        Returns:
            int. The number of learners who completed the exploration.
        """
        return self.num_completions_v1 + self.num_completions_v2

    def to_dict(self) -> ExplorationStatsDict:
        """Returns a dict representation of the domain object."""
        state_stats_mapping_dict = {}
        for state_name in self.state_stats_mapping:
            state_stats_mapping_dict[state_name] = self.state_stats_mapping[
                state_name].to_dict()

        exploration_stats_dict: ExplorationStatsDict = {
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

    def to_frontend_dict(self) -> ExplorationStatsFrontendDict:
        """Returns a dict representation of the domain object for use in the
        frontend.
        """
        state_stats_mapping_dict = {}
        for state_name in self.state_stats_mapping:
            state_stats_mapping_dict[state_name] = self.state_stats_mapping[
                state_name].to_frontend_dict()

        exploration_stats_dict: ExplorationStatsFrontendDict = {
            'exp_id': self.exp_id,
            'exp_version': self.exp_version,
            'num_starts': self.num_starts,
            'num_actual_starts': self.num_actual_starts,
            'num_completions': self.num_completions,
            'state_stats_mapping': state_stats_mapping_dict
        }
        return exploration_stats_dict

    @classmethod
    def create_default(
        cls,
        exp_id: str,
        exp_version: int,
        state_stats_mapping: Dict[str, StateStats]
    ) -> ExplorationStats:
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

    def get_sum_of_first_hit_counts(self) -> int:
        """Compute the sum of first hit counts for the exploration stats.

        Returns:
            int. Sum of first hit counts.
        """
        sum_first_hits = 0
        for state_name in self.state_stats_mapping:
            state_stats = self.state_stats_mapping[state_name]
            sum_first_hits += state_stats.first_hit_count
        return sum_first_hits

    def validate(self) -> None:
        """Validates the ExplorationStats domain object."""

        exploration_stats_properties: List[Literal[
            'num_starts_v1',
            'num_starts_v2',
            'num_actual_starts_v1',
            'num_actual_starts_v2',
            'num_completions_v1',
            'num_completions_v2'
        ]] = [
            'num_starts_v1',
            'num_starts_v2',
            'num_actual_starts_v1',
            'num_actual_starts_v2',
            'num_completions_v1',
            'num_completions_v2',
        ]

        if not isinstance(self.exp_id, str):
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

    def clone(self) -> ExplorationStats:
        """Returns a clone of this instance."""
        return ExplorationStats(
            self.exp_id, self.exp_version, self.num_starts_v1,
            self.num_starts_v2, self.num_actual_starts_v1,
            self.num_actual_starts_v2, self.num_completions_v1,
            self.num_completions_v2,
            {
                state_name: state_stats.clone()
                for state_name, state_stats in self.state_stats_mapping.items()
            })


class StateStats:
    """Domain object representing analytics data for an exploration's state.
    Instances of these domain objects pertain to the exploration ID and version
    as well.
    """

    def __init__(
        self,
        total_answers_count_v1: int,
        total_answers_count_v2: int,
        useful_feedback_count_v1: int,
        useful_feedback_count_v2: int,
        total_hit_count_v1: int,
        total_hit_count_v2: int,
        first_hit_count_v1: int,
        first_hit_count_v2: int,
        num_times_solution_viewed_v2: int,
        num_completions_v1: int,
        num_completions_v2: int
    ) -> None:
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
    def total_answers_count(self) -> int:
        """Returns the total number of answers submitted to this state.

        Returns:
            int. The total number of answers submitted to this state.
        """
        return self.total_answers_count_v1 + self.total_answers_count_v2

    @property
    def useful_feedback_count(self) -> int:
        """Returns the total number of answers that received useful feedback.

        Returns:
            int. The total number of answers that received useful feedback.
        """
        return self.useful_feedback_count_v1 + self.useful_feedback_count_v2

    @property
    def total_hit_count(self) -> int:
        """Returns the total number of times the state was entered.

        Returns:
            int. The total number of times the state was entered.
        """
        return self.total_hit_count_v1 + self.total_hit_count_v2

    @property
    def first_hit_count(self) -> int:
        """Returns the number of times the state was entered for the first time.

        Returns:
            int. The number of times the state was entered for the first time.
        """
        return self.first_hit_count_v1 + self.first_hit_count_v2

    @property
    def num_completions(self) -> int:
        """Returns total number of times the state was completed.

        Returns:
            int. The total number of times the state was completed.
        """
        return self.num_completions_v1 + self.num_completions_v2

    @property
    def num_times_solution_viewed(self) -> int:
        """Returns the number of times the solution button was triggered.

        Returns:
            int. Number of times the solution button was triggered to answer a
            state only for events for schema version 2.
        """
        return self.num_times_solution_viewed_v2

    @classmethod
    def create_default(cls) -> StateStats:
        """Creates a StateStats domain object and sets all properties to 0."""
        return cls(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

    def aggregate_from(
        self, other: Union[StateStats, SessionStateStats]
    ) -> None:
        """Aggregates data from the other state stats into self.

        Args:
            other: StateStats | SessionStateStats. The other collection of stats
                to aggregate from.

        Raises:
            TypeError. Given SessionStateStats can not be aggregated from.
        """
        if isinstance(other, StateStats):
            self.total_answers_count_v1 += other.total_answers_count_v1
            self.total_answers_count_v2 += other.total_answers_count_v2
            self.useful_feedback_count_v1 += other.useful_feedback_count_v1
            self.useful_feedback_count_v2 += other.useful_feedback_count_v2
            self.total_hit_count_v1 += other.total_hit_count_v1
            self.total_hit_count_v2 += other.total_hit_count_v2
            self.first_hit_count_v1 += other.first_hit_count_v1
            self.first_hit_count_v2 += other.first_hit_count_v2
            self.num_times_solution_viewed_v2 += (
                other.num_times_solution_viewed_v2)
            self.num_completions_v1 += other.num_completions_v1
            self.num_completions_v2 += other.num_completions_v2
        elif isinstance(other, SessionStateStats):
            self.total_answers_count_v2 += other.total_answers_count
            self.useful_feedback_count_v2 += other.useful_feedback_count
            self.total_hit_count_v2 += other.total_hit_count
            self.first_hit_count_v2 += other.first_hit_count
            self.num_times_solution_viewed_v2 += other.num_times_solution_viewed
            self.num_completions_v2 += other.num_completions
        else:
            raise TypeError(
                '%s can not be aggregated from' % (other.__class__.__name__,))

    def to_dict(self) -> Dict[str, int]:
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

    def to_frontend_dict(self) -> Dict[str, int]:
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

    def __repr__(self) -> str:
        """Returns a detailed representation of self, distinguishing v1 values
        from v2 values.

        Returns:
            str. A string representation of self.
        """
        props = [
            'total_answers_count_v1', 'total_answers_count_v2',
            'useful_feedback_count_v1', 'useful_feedback_count_v2',
            'total_hit_count_v1', 'total_hit_count_v2',
            'first_hit_count_v1', 'first_hit_count_v2',
            'num_times_solution_viewed_v2',
            'num_completions_v1', 'num_completions_v2',
        ]
        return '%s(%s)' % (
            self.__class__.__name__,
            ', '.join('%s=%r' % (prop, getattr(self, prop)) for prop in props))

    def __str__(self) -> str:
        """Returns a simple representation of self, combining v1 and v2 values.

        Returns:
            str. A string representation of self.
        """
        props = [
            'total_answers_count',
            'useful_feedback_count',
            'total_hit_count',
            'first_hit_count',
            'num_times_solution_viewed',
            'num_completions',
        ]
        return '%s(%s)' % (
            self.__class__.__name__,
            ', '.join('%s=%r' % (prop, getattr(self, prop)) for prop in props))

    # NOTE: Here we use type Any because of:
    # https://github.com/python/mypy/issues/363#issue-39383094
    def __eq__(self, other: Any) -> Any:
        """Implements == comparison between two StateStats instances, returning
        whether they both hold the same values.

        Args:
            other: StateStats. The other instance to compare.

        Returns:
            bool. Whether the two instances have the same values.
        """
        if not isinstance(other, StateStats):
            # https://docs.python.org/3.7/library/constants.html
            return NotImplemented
        return (
            self.total_answers_count_v1,
            self.total_answers_count_v2,
            self.useful_feedback_count_v1,
            self.useful_feedback_count_v2,
            self.total_hit_count_v1,
            self.total_hit_count_v2,
            self.first_hit_count_v1,
            self.first_hit_count_v2,
            self.num_times_solution_viewed_v2,
            self.num_completions_v1,
            self.num_completions_v2,
        ) == (
            other.total_answers_count_v1,
            other.total_answers_count_v2,
            other.useful_feedback_count_v1,
            other.useful_feedback_count_v2,
            other.total_hit_count_v1,
            other.total_hit_count_v2,
            other.first_hit_count_v1,
            other.first_hit_count_v2,
            other.num_times_solution_viewed_v2,
            other.num_completions_v1,
            other.num_completions_v2,
        )

    def __hash__(self) -> int:
        """Disallow hashing StateStats since they are mutable by design."""
        raise TypeError('%s is unhashable' % self.__class__.__name__)

    @classmethod
    def from_dict(cls, state_stats_dict: Dict[str, int]) -> StateStats:
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
            state_stats_dict['num_completions_v2'])

    def validate(self) -> None:
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

    def clone(self) -> StateStats:
        """Returns a clone of this instance."""
        return StateStats(
            self.total_answers_count_v1, self.total_answers_count_v2,
            self.useful_feedback_count_v1, self.useful_feedback_count_v2,
            self.total_hit_count_v1, self.total_hit_count_v2,
            self.first_hit_count_v1, self.first_hit_count_v2,
            self.num_times_solution_viewed_v2, self.num_completions_v1,
            self.num_completions_v2)


class SessionStateStats:
    """Domain object representing analytics data for a specific state of an
    exploration, aggregated during a continuous learner session.
    """

    def __init__(
        self,
        total_answers_count: int,
        useful_feedback_count: int,
        total_hit_count: int,
        first_hit_count: int,
        num_times_solution_viewed: int,
        num_completions: int
    ):
        """Constructs a SessionStateStats domain object.

        Args:
            total_answers_count: int. Total number of answers submitted to this
                state.
            useful_feedback_count: int. Total number of answers that received
                useful feedback.
            total_hit_count: int. Total number of times the state was entered.
            first_hit_count: int. Number of times the state was entered for the
                first time.
            num_times_solution_viewed: int. Number of times the solution button
                was triggered to answer a state.
            num_completions: int. Number of times the state was completed.
        """
        self.total_answers_count = total_answers_count
        self.useful_feedback_count = useful_feedback_count
        self.total_hit_count = total_hit_count
        self.first_hit_count = first_hit_count
        self.num_times_solution_viewed = num_times_solution_viewed
        self.num_completions = num_completions

    def __repr__(self) -> str:
        """Returns a detailed string representation of self."""
        props = [
            'total_answers_count',
            'useful_feedback_count',
            'total_hit_count',
            'first_hit_count',
            'num_times_solution_viewed',
            'num_completions',
        ]
        return '%s(%s)' % (
            self.__class__.__name__,
            ', '.join('%s=%r' % (prop, getattr(self, prop)) for prop in props))

    def to_dict(self) -> Dict[str, int]:
        """Returns a dict representation of self."""
        session_state_stats_dict = {
            'total_answers_count': self.total_answers_count,
            'useful_feedback_count': self.useful_feedback_count,
            'total_hit_count': self.total_hit_count,
            'first_hit_count': self.first_hit_count,
            'num_times_solution_viewed': self.num_times_solution_viewed,
            'num_completions': self.num_completions
        }
        return session_state_stats_dict

    @staticmethod
    def validate_aggregated_stats_dict(
        aggregated_stats: AggregatedStatsDict
    ) -> AggregatedStatsDict:
        """Validates the SessionStateStats domain object.

        Args:
            aggregated_stats: dict. The aggregated stats dict to validate.

        Returns:
            aggregated_stats: dict. The validated aggregated stats dict.

        Raises:
            ValidationError. Whether the aggregated_stats dict is invalid.
        """

        exploration_stats_properties = [
            'num_starts',
            'num_actual_starts',
            'num_completions'
        ]
        state_stats_properties = [
            'total_answers_count',
            'useful_feedback_count',
            'total_hit_count',
            'first_hit_count',
            'num_times_solution_viewed',
            'num_completions'
        ]
        for exp_stats_property in exploration_stats_properties:
            if exp_stats_property not in aggregated_stats:
                raise utils.ValidationError(
                    '%s not in aggregated stats dict.' % (exp_stats_property))
            # Here we use MyPy ignore because MyPy does not recognize
            # that keys represented by the variable exp_stats_property
            # are string literals.
            if not isinstance(aggregated_stats[exp_stats_property], int): # type: ignore[misc]
                raise utils.ValidationError(
                    'Expected %s to be an int, received %s' % (
                        exp_stats_property,
                        # Here we use MyPy ignore because MyPy does not
                        # recognize that keys represented by the variable
                        # exp_stats_property are string literals.
                        aggregated_stats[exp_stats_property] # type: ignore[misc]
                    )
                )
        state_stats_mapping = aggregated_stats['state_stats_mapping']
        for state_name in state_stats_mapping:
            for state_stats_property in state_stats_properties:
                if state_stats_property not in state_stats_mapping[state_name]:
                    raise utils.ValidationError(
                        '%s not in state stats mapping of %s in aggregated '
                        'stats dict.' % (state_stats_property, state_name))
                if not isinstance(
                    state_stats_mapping[state_name][state_stats_property],
                    int
                ):
                    state_stats = state_stats_mapping[state_name]
                    raise utils.ValidationError(
                        'Expected %s to be an int, received %s' % (
                            state_stats_property,
                            state_stats[state_stats_property]
                        )
                    )
        # The aggregated_stats parameter does not represent any domain class,
        # hence dict form of the data is returned from here.
        return aggregated_stats

    # NOTE: Here we use type Any because of:
    # https://github.com/python/mypy/issues/363#issue-39383094
    def __eq__(self, other: Any) -> Any:
        """Implements == comparison between two SessionStateStats instances,
        returning whether they hold the same values.

        Args:
            other: SessionStateStats. The other instance to compare.

        Returns:
            bool. Whether the two instances have the same values.
        """
        if not isinstance(other, SessionStateStats):
            # https://docs.python.org/3.7/library/constants.html
            return NotImplemented
        return (
            self.total_answers_count,
            self.useful_feedback_count,
            self.total_hit_count,
            self.first_hit_count,
            self.num_times_solution_viewed,
            self.num_completions,
        ) == (
            other.total_answers_count,
            other.useful_feedback_count,
            other.total_hit_count,
            other.first_hit_count,
            other.num_times_solution_viewed,
            other.num_completions,
        )

    def __hash__(self) -> int:
        """Disallow hashing SessionStateStats since it is mutable by design."""
        raise TypeError('%s is unhashable' % self.__class__.__name__)

    @classmethod
    def create_default(cls) -> SessionStateStats:
        """Creates a SessionStateStats domain object with all values at 0."""
        return cls(0, 0, 0, 0, 0, 0)

    @classmethod
    def from_dict(
        cls, session_state_stats_dict: Dict[str, int]
    ) -> SessionStateStats:
        """Creates a SessionStateStats domain object from the given dict."""
        return cls(
            session_state_stats_dict['total_answers_count'],
            session_state_stats_dict['useful_feedback_count'],
            session_state_stats_dict['total_hit_count'],
            session_state_stats_dict['first_hit_count'],
            session_state_stats_dict['num_times_solution_viewed'],
            session_state_stats_dict['num_completions'])


class ExplorationIssues:
    """Domain object representing the exploration to issues mapping for an
    exploration.
    """

    def __init__(
        self,
        exp_id: str,
        exp_version: int,
        unresolved_issues: List[ExplorationIssue]
    ) -> None:
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
    def create_default(cls, exp_id: str, exp_version: int) -> ExplorationIssues:
        """Creates a default ExplorationIssues domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. Version of the exploration.

        Returns:
            ExplorationIssues. The exploration issues domain object.
        """
        return cls(exp_id, exp_version, [])

    def to_dict(self) -> ExplorationIssuesDict:
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
    def from_dict(
        cls, exp_issues_dict: ExplorationIssuesDict
    ) -> ExplorationIssues:
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

    def validate(self) -> None:
        """Validates the ExplorationIssues domain object."""
        if not isinstance(self.exp_id, str):
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


class Playthrough:
    """Domain object representing a learner playthrough."""

    def __init__(
        self,
        exp_id: str,
        exp_version: int,
        issue_type: str,
        issue_customization_args: IssuesCustomizationArgsDictType,
        actions: List[LearnerAction]
    ):
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

    def to_dict(self) -> PlaythroughDict:
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
    def from_dict(cls, playthrough_data: PlaythroughDict) -> Playthrough:
        """Checks whether the playthrough dict has the correct keys and then
        returns a domain object instance.

        Args:
            playthrough_data: dict. A dict mapping of all fields of Playthrough
                object.

        Returns:
            Playthrough. The corresponding Playthrough domain object.
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

    def validate(self) -> None:
        """Validates the Playthrough domain object."""
        if not isinstance(self.exp_id, str):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % type(
                    self.exp_id))

        if not isinstance(self.exp_version, int):
            raise utils.ValidationError(
                'Expected exp_version to be an int, received %s' % (
                    type(self.exp_version)))

        if not isinstance(self.issue_type, str):
            raise utils.ValidationError(
                'Expected issue_type to be a string, received %s' % type(
                    self.issue_type))

        if not isinstance(self.issue_customization_args, dict):
            raise utils.ValidationError(
                'Expected issue_customization_args to be a dict, '
                'received %s' % (
                    type(self.issue_customization_args)))

        try:
            issue = playthrough_issue_registry.Registry.get_issue_by_type(
                self.issue_type)
        except KeyError as e:
            raise utils.ValidationError('Invalid issue type: %s' % (
                self.issue_type)) from e

        customization_args_util.validate_customization_args_and_values(
            'issue', self.issue_type, self.issue_customization_args,
            issue.customization_arg_specs)

        if not isinstance(self.actions, list):
            raise utils.ValidationError(
                'Expected actions to be a list, received %s' % (
                    type(self.actions)))

        for action in self.actions:
            action.validate()


class ExplorationIssue:
    """Domain object representing an exploration issue."""

    def __init__(
        self,
        issue_type: str,
        issue_customization_args: IssuesCustomizationArgsDictType,
        playthrough_ids: List[str],
        schema_version: int,
        is_valid: bool
    ):
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

    # NOTE: Here we use type Any because of:
    # https://github.com/python/mypy/issues/363#issue-39383094
    def __eq__(self, other: Any) -> Any:
        if not isinstance(other, ExplorationIssue):
            #  https://docs.python.org/3.7/library/constants.html
            return NotImplemented
        return (
            self.issue_type == other.issue_type and
            self.issue_customization_args == other.issue_customization_args and
            self.playthrough_ids == other.playthrough_ids and
            self.schema_version == other.schema_version and
            self.is_valid == other.is_valid
        )

    def to_dict(self) -> ExplorationIssueDict:
        """Returns a dict representation of the ExplorationIssue domain object.

        Returns:
            dict. A dict mapping of all fields of ExplorationIssue object.
        """
        return {
            'issue_type': self.issue_type,
            'issue_customization_args': self.issue_customization_args,
            'playthrough_ids': self.playthrough_ids,
            'schema_version': self.schema_version,
            'is_valid': self.is_valid
        }

    @classmethod
    def from_dict(
        cls, exp_issue_dict: ExplorationIssueDict
    ) -> ExplorationIssue:
        """Checks whether the exploration issue dict has the correct keys and
        then returns a domain object instance.

        Args:
            exp_issue_dict: dict. A dict mapping of all fields of
                ExplorationIssue object.

        Returns:
            ExplorationIssue. The corresponding ExplorationIssue domain object.
        """
        exp_issue_properties = [
            'issue_type', 'schema_version', 'issue_customization_args',
            'playthrough_ids', 'is_valid']
        for exp_issue_property in exp_issue_properties:
            if exp_issue_property not in exp_issue_dict:
                raise utils.ValidationError(
                    '%s not in exploration issue dict.' % (
                        exp_issue_property))

        exp_issue = cls(
            exp_issue_dict['issue_type'],
            exp_issue_dict['issue_customization_args'],
            exp_issue_dict['playthrough_ids'],
            exp_issue_dict['schema_version'],
            exp_issue_dict['is_valid'])

        exp_issue.validate()
        return exp_issue

    @classmethod
    def update_exp_issue_from_model(
        cls, issue_dict: ExplorationIssueDict
    ) -> None:
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
    def _convert_issue_v1_dict_to_v2_dict(
        cls,
        issue_dict: Dict[
            str, Union[str, Dict[str, Dict[str, str]], List[str], int, bool]
        ]
    ) -> None:
        """Converts a v1 issue dict to a v2 issue dict. This function is now
        implemented only for testing purposes and must be rewritten when an
        actual schema migration from v1 to v2 takes place.
        """
        raise NotImplementedError(
            'The _convert_issue_v1_dict_to_v2_dict() method is missing from the'
            ' derived class. It should be implemented in the derived class.')

    def validate(self) -> None:
        """Validates the ExplorationIssue domain object."""
        if not isinstance(self.issue_type, str):
            raise utils.ValidationError(
                'Expected issue_type to be a string, received %s' % (
                    type(self.issue_type)))

        if not isinstance(self.schema_version, int):
            raise utils.ValidationError(
                'Expected schema_version to be an int, received %s' % (
                    type(self.schema_version)))

        try:
            issue = playthrough_issue_registry.Registry.get_issue_by_type(
                self.issue_type)
        except KeyError as e:
            raise utils.ValidationError('Invalid issue type: %s' % (
                self.issue_type)) from e

        customization_args_util.validate_customization_args_and_values(
            'issue', self.issue_type, self.issue_customization_args,
            issue.customization_arg_specs)

        if not isinstance(self.playthrough_ids, list):
            raise utils.ValidationError(
                'Expected playthrough_ids to be a list, received %s' % (
                    type(self.playthrough_ids)))

        for playthrough_id in self.playthrough_ids:
            if not isinstance(playthrough_id, str):
                raise utils.ValidationError(
                    'Expected each playthrough_id to be a string, received '
                    '%s' % type(playthrough_id))


class LearnerAction:
    """Domain object representing a learner action."""

    def __init__(
        self,
        action_type: str,
        action_customization_args: Dict[str, Dict[str, Union[str, int]]],
        schema_version: int
    ):
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

    def to_dict(self) -> LearnerActionDict:
        """Returns a dict representation of the LearnerAction domain object.

        Returns:
            dict. A dict mapping of all fields of LearnerAction object.
        """
        return {
            'action_type': self.action_type,
            'action_customization_args': self.action_customization_args,
            'schema_version': self.schema_version
        }

    @classmethod
    def from_dict(cls, action_dict: LearnerActionDict) -> LearnerAction:
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
    def update_learner_action_from_model(
        cls, action_dict: LearnerActionDict
    ) -> None:
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
    def _convert_action_v1_dict_to_v2_dict(
        cls, action_dict: LearnerActionDict
    ) -> None:
        """Converts a v1 action dict to a v2 action dict. This function is now
        implemented only for testing purposes and must be rewritten when an
        actual schema migration from v1 to v2 takes place.
        """
        raise NotImplementedError(
            'The _convert_action_v1_dict_to_v2_dict() method is missing from '
            'the derived class. It should be implemented in the derived class.')

    def validate(self) -> None:
        """Validates the LearnerAction domain object."""
        if not isinstance(self.action_type, str):
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
        except KeyError as e:
            raise utils.ValidationError(
                'Invalid action type: %s' % self.action_type) from e
        customization_args_util.validate_customization_args_and_values(
            'action', self.action_type, self.action_customization_args,
            action.customization_arg_specs)


# TODO(bhenning): Monitor sizes (lengths of submitted_answer_list) of these
# objects and determine if we should enforce an upper bound for
# submitted_answer_list.
class StateAnswers:
    """Domain object containing answers submitted to an exploration state."""

    def __init__(
        self,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        interaction_id: str,
        submitted_answer_list: List[SubmittedAnswer],
        schema_version: int = feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION
    ) -> None:
        """Constructs a StateAnswers domain object.

        Args:
            exploration_id: str. The ID of the exploration corresponding to
                submitted answers.
            exploration_version: int. The version of the exploration
                corresponding to submitted answers.
            state_name: str. The state to which the answers were submitted.
            interaction_id: str. The ID of the interaction which created the
                answers.
            submitted_answer_list: list. The list of SubmittedAnswer domain
                objects that were submitted to the exploration and version
                specified in this object.
            schema_version: int. The schema version of this answers object.
        """
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.state_name = state_name
        self.interaction_id = interaction_id
        self.submitted_answer_list = submitted_answer_list
        self.schema_version = schema_version

    def get_submitted_answer_dict_list(self) -> List[SubmittedAnswerDict]:
        """Returns the submitted_answer_list stored within this object as a list
        of StateAnswer dicts.
        """
        return [state_answer.to_dict()
                for state_answer in self.submitted_answer_list]

    def validate(self) -> None:
        """Validates StateAnswers domain object entity."""

        if not isinstance(self.exploration_id, str):
            raise utils.ValidationError(
                'Expected exploration_id to be a string, received %s'
                % str(self.exploration_id))

        if not isinstance(self.state_name, str):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s'
                % str(self.state_name))

        if self.interaction_id is not None:
            if not isinstance(self.interaction_id, str):
                raise utils.ValidationError(
                    'Expected interaction_id to be a string, received %s'
                    % str(self.interaction_id))

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
                'Expected schema_version to be an integer, received %s'
                % str(self.schema_version))

        if self.schema_version < 1:
            raise utils.ValidationError(
                'schema_version < 1: %d' % self.schema_version)

        if self.schema_version > feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION:
            raise utils.ValidationError(
                'schema_version > feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION '
                '(%d): %d' % (
                    feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION,
                    self.schema_version))


class SubmittedAnswer:
    """Domain object representing an answer submitted to a state."""

    # NOTE TO DEVELOPERS: do not use the rule_spec_str and answer_str
    # parameters; they are only populated by the answer migration job. They only
    # represent context that is lost as part of the answer migration and are
    # used as part of validating the migration was correct. They may be
    # referenced in future migration or mapreduce jobs, or they may be removed
    # without warning or migration.

    def __init__(
        self,
        answer: state_domain.AcceptableCorrectAnswerTypes,
        interaction_id: str,
        answer_group_index: int,
        rule_spec_index: int,
        classification_categorization: str,
        params: Dict[str, Union[str, int]],
        session_id: str,
        time_spent_in_sec: float,
        rule_spec_str: Optional[str] = None,
        answer_str: Optional[str] = None
    ) -> None:
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

    def to_dict(self) -> SubmittedAnswerDict:
        """Returns the dict of submitted answer.

        Returns:
            dict. The submitted answer dict.
        """
        submitted_answer_dict: SubmittedAnswerDict = {
            'answer': self.answer,
            'interaction_id': self.interaction_id,
            'answer_group_index': self.answer_group_index,
            'rule_spec_index': self.rule_spec_index,
            'classification_categorization': self.classification_categorization,
            'params': self.params,
            'session_id': self.session_id,
            'time_spent_in_sec': self.time_spent_in_sec,
            'rule_spec_str': self.rule_spec_str,
            'answer_str': self.answer_str
        }
        if self.rule_spec_str is not None:
            submitted_answer_dict['rule_spec_str'] = self.rule_spec_str
        if self.answer_str is not None:
            submitted_answer_dict['answer_str'] = self.answer_str
        return submitted_answer_dict

    @classmethod
    def from_dict(
        cls, submitted_answer_dict: SubmittedAnswerDict
    ) -> SubmittedAnswer:
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

    def validate(self) -> None:
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
                self.rule_spec_str, str):
            raise utils.ValidationError(
                'Expected rule_spec_str to be either None or a string, '
                'received %s' % str(self.rule_spec_str))

        if self.answer_str is not None and not isinstance(
                self.answer_str, str):
            raise utils.ValidationError(
                'Expected answer_str to be either None or a string, received '
                '%s' % str(self.answer_str))

        if not isinstance(self.session_id, str):
            raise utils.ValidationError(
                'Expected session_id to be a string, received %s' %
                str(self.session_id))

        if not isinstance(self.time_spent_in_sec, numbers.Number):
            raise utils.ValidationError(
                'Expected time_spent_in_sec to be a number, received %s' %
                str(self.time_spent_in_sec))

        if not isinstance(self.params, dict):
            raise utils.ValidationError(
                'Expected params to be a dict, received %s'
                % str(self.params))

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


class AnswerOccurrence:
    """Domain object that represents a specific answer that occurred some number
    of times.
    """

    def __init__(
        self, answer: state_domain.AcceptableCorrectAnswerTypes,
        frequency: int
    ) -> None:
        """Initialize domain object for answer occurrences."""
        self.answer = answer
        self.frequency = frequency

    def to_raw_type(self) -> AnswerOccurrenceDict:
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
    def from_raw_type(
        cls, answer_occurrence_dict: AnswerOccurrenceDict
    ) -> AnswerOccurrence:
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


class AnswerCalculationOutput:
    """Domain object superclass that represents the output of an answer
    calculation.
    """

    def __init__(self, calculation_output_type: str):
        self.calculation_output_type = calculation_output_type


class AnswerFrequencyList(AnswerCalculationOutput):
    """Domain object that represents an output list of AnswerOccurrences."""

    def __init__(
        self, answer_occurrences: Optional[List[AnswerOccurrence]] = None
    ) -> None:
        """Initialize domain object for answer frequency list for a given list
        of AnswerOccurrence objects (default is empty list).
        """
        super().__init__(
            CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST)
        self.answer_occurrences = (
            answer_occurrences if answer_occurrences else [])

    def to_raw_type(self) -> List[AnswerOccurrenceDict]:
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
    def from_raw_type(
        cls, answer_occurrence_list: List[AnswerOccurrenceDict]
    ) -> AnswerFrequencyList:
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

    def __init__(
        self,
        categorized_answer_freq_lists: Optional[
            Dict[str, AnswerFrequencyList]
        ] = None
    ) -> None:
        """Initialize domain object for categorized answer frequency lists for
        a given dict (default is empty).
        """
        super().__init__(
            CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS)
        self.categorized_answer_freq_lists = (
            categorized_answer_freq_lists
            if categorized_answer_freq_lists else {})

    def to_raw_type(self) -> Dict[str, List[AnswerOccurrenceDict]]:
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
                self.categorized_answer_freq_lists.items())
        }

    @classmethod
    def from_raw_type(
        cls, categorized_frequency_dict: Dict[str, List[AnswerOccurrenceDict]]
    ) -> CategorizedAnswerFrequencyLists:
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
                categorized_frequency_dict.items())
        })


class StateAnswersCalcOutput:
    """Domain object that represents output of calculations operating on
    state answers.
    """

    def __init__(
        self,
        exploration_id: str,
        exploration_version: int,
        state_name: str,
        interaction_id: str,
        calculation_id: str,
        calculation_output: Union[
            AnswerFrequencyList, CategorizedAnswerFrequencyLists
        ]
    ) -> None:
        """Initialize domain object for state answers calculation output.

        Args:
            exploration_id: str. The ID of the exploration corresponding to the
                answer calculation output.
            exploration_version: int. The version of the exploration
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

    def validate(self) -> None:
        """Validates StateAnswersCalcOutputModel domain object entity before
        it is commited to storage.
        """

        # There is a danger of data overflow if answer_opts exceeds 1MB. This
        # will be addressed later if it happens regularly. At the moment, a
        # ValidationError is raised if an answer exceeds the maximum size.
        max_bytes_per_calc_output_data = 999999

        if not isinstance(self.exploration_id, str):
            raise utils.ValidationError(
                'Expected exploration_id to be a string, received %s'
                % str(self.exploration_id))

        if not isinstance(self.state_name, str):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s'
                % str(self.state_name))

        if not isinstance(self.calculation_id, str):
            raise utils.ValidationError(
                'Expected calculation_id to be a string, received %s'
                % str(self.calculation_id))

        if (not isinstance(self.calculation_output, AnswerFrequencyList)
                and not isinstance(
                    self.calculation_output, CategorizedAnswerFrequencyLists)):
            raise utils.ValidationError(
                'Expected calculation output to be one of AnswerFrequencyList '
                'or CategorizedAnswerFrequencyLists, encountered: %s' % (
                    self.calculation_output))

        output_data = self.calculation_output.to_raw_type()
        if sys.getsizeof(output_data) > max_bytes_per_calc_output_data:
            # TODO(msl): Find a better way to deal with big
            # calculation output data, e.g. just skip. At the moment,
            # too long answers produce a ValidationError.
            raise utils.ValidationError(
                'calculation_output is too big to be stored (size: %d): %s' % (
                    sys.getsizeof(output_data),
                    str(output_data)))


class LearnerAnswerDetails:
    """Domain object that represents the answer details submitted by the
    learner.
    """

    def __init__(
        self,
        state_reference: str,
        entity_type: str,
        interaction_id: str,
        learner_answer_info_list: List[LearnerAnswerInfo],
        accumulated_answer_info_json_size_bytes: int,
        learner_answer_info_schema_version: int = (
            feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION)
    ) -> None:
        """Constructs a LearnerAnswerDetail domain object.

        Args:
            state_reference: str. This field is used to refer to a state
                in an exploration or question. For an exploration the value
                will be equal to 'exp_id:state_name' & for question this will
                be equal to 'question_id' only.
            entity_type: str. The type of entity, for which the domain
                object is being created. The value must be one of
                ENTITY_TYPE_EXPLORATION or ENTITY_TYPE_QUESTION.
            interaction_id: str. The ID of the interaction, but this value
                should not be equal to EndExploration and
                Continue as these interactions cannot solicit answer
                details.
            learner_answer_info_list: list(LearnerAnswerInfo). The list of
                LearnerAnswerInfo objects.
            accumulated_answer_info_json_size_bytes: int. The size of
                learner_answer_info_list in bytes.
            learner_answer_info_schema_version: int. The schema version of the
                LearnerAnswerInfo dict.
        """

        self.state_reference = state_reference
        self.entity_type = entity_type
        self.interaction_id = interaction_id
        self.learner_answer_info_list = learner_answer_info_list
        self.accumulated_answer_info_json_size_bytes = (
            accumulated_answer_info_json_size_bytes)
        self.learner_answer_info_schema_version = (
            learner_answer_info_schema_version)

    def to_dict(self) -> LearnerAnswerDetailsDict:
        """Returns a dict representing LearnerAnswerDetails domain object.

        Returns:
            dict. A dict, mapping all fields of LearnerAnswerDetails instance.
        """
        return {
            'state_reference': self.state_reference,
            'entity_type': self.entity_type,
            'interaction_id': self.interaction_id,
            'learner_answer_info_list': [
                learner_answer_info.to_dict() for learner_answer_info in (
                    self.learner_answer_info_list)
            ],
            'accumulated_answer_info_json_size_bytes': (
                self.accumulated_answer_info_json_size_bytes),
            'learner_answer_info_schema_version': (
                self.learner_answer_info_schema_version)
        }

    @classmethod
    def from_dict(
        cls,
        learner_answer_details_dict: LearnerAnswerDetailsDict
    ) -> LearnerAnswerDetails:
        """Return a LearnerAnswerDetails domain object from a dict.

        Args:
            learner_answer_details_dict: dict. The dict representation of
                LearnerAnswerDetails object.

        Returns:
            LearnerAnswerDetails. The corresponding LearnerAnswerDetails
            domain object.
        """
        return cls(
            learner_answer_details_dict['state_reference'],
            learner_answer_details_dict['entity_type'],
            learner_answer_details_dict['interaction_id'],
            [LearnerAnswerInfo.from_dict(learner_answer_info_dict)
             for learner_answer_info_dict in learner_answer_details_dict[
                 'learner_answer_info_list']],
            learner_answer_details_dict[
                'accumulated_answer_info_json_size_bytes'],
            learner_answer_details_dict['learner_answer_info_schema_version']
        )

    def validate(self) -> None:
        """Validates LearnerAnswerDetails domain object."""

        if not isinstance(self.state_reference, str):
            raise utils.ValidationError(
                'Expected state_reference to be a string, received %s'
                % str(self.state_reference))

        if not isinstance(self.entity_type, str):
            raise utils.ValidationError(
                'Expected entity_type to be a string, received %s'
                % str(self.entity_type))

        split_state_reference = self.state_reference.split(':')
        if self.entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            if len(split_state_reference) != 2:
                raise utils.ValidationError(
                    'For entity type exploration, the state reference '
                    'should be of the form \'exp_id:state_name\', but '
                    'received %s' % (self.state_reference))
        elif self.entity_type == feconf.ENTITY_TYPE_QUESTION:
            if len(split_state_reference) != 1:
                raise utils.ValidationError(
                    'For entity type question, the state reference should '
                    'be of the form \'question_id\', but received %s' % (
                        self.state_reference))
        else:
            raise utils.ValidationError(
                'Invalid entity type received %s' % (self.entity_type))

        if not isinstance(self.interaction_id, str):
            raise utils.ValidationError(
                'Expected interaction_id to be a string, received %s'
                % str(self.interaction_id))

        if (self.interaction_id not in
                interaction_registry.Registry.get_all_interaction_ids()):
            raise utils.ValidationError(
                'Unknown interaction_id: %s' % self.interaction_id)

        if self.interaction_id in (
                constants.INTERACTION_IDS_WITHOUT_ANSWER_DETAILS):
            raise utils.ValidationError(
                'The %s interaction does not support soliciting '
                'answer details from learners.' % (self.interaction_id))

        if not isinstance(self.learner_answer_info_list, list):
            raise utils.ValidationError(
                'Expected learner_answer_info_list to be a list, '
                'received %s'
                % str(self.learner_answer_info_list))

        for learner_answer_info in self.learner_answer_info_list:
            learner_answer_info.validate()

        if not isinstance(self.learner_answer_info_schema_version, int):
            raise utils.ValidationError(
                'Expected learner_answer_info_schema_version to be an int, '
                'received %s' % self.learner_answer_info_schema_version)

        if not isinstance(self.accumulated_answer_info_json_size_bytes, int):
            raise utils.ValidationError(
                'Expected accumulated_answer_info_json_size_bytes to be an int '
                'received %s' % self.accumulated_answer_info_json_size_bytes)

    def add_learner_answer_info(
        self, learner_answer_info: LearnerAnswerInfo
    ) -> None:
        """Adds new learner answer info in the learner_answer_info_list.

        Args:
            learner_answer_info: LearnerAnswerInfo. The learner answer info
                object, which is created after the learner has submitted the
                details of the answer.
        """
        learner_answer_info_dict_size = (
            learner_answer_info.get_learner_answer_info_dict_size())
        if (self.accumulated_answer_info_json_size_bytes +
                learner_answer_info_dict_size <= (
                    MAX_LEARNER_ANSWER_INFO_LIST_BYTE_SIZE)):
            self.learner_answer_info_list.append(learner_answer_info)
            self.accumulated_answer_info_json_size_bytes += (
                learner_answer_info_dict_size)

    def delete_learner_answer_info(self, learner_answer_info_id: str) -> None:
        """Delete the learner answer info from the learner_answer_info_list.

        Args:
            learner_answer_info_id: str. The learner answer info
                id, which needs to be deleted from
                the learner_answer_info_list.

        Raises:
            Exception. If the learner answer info with the given id is not
                found in the learner answer info list.
        """
        new_learner_answer_info_list = []
        for learner_answer_info in self.learner_answer_info_list:
            if learner_answer_info.id != learner_answer_info_id:
                new_learner_answer_info_list.append(learner_answer_info)
            else:
                self.accumulated_answer_info_json_size_bytes -= (
                    learner_answer_info.get_learner_answer_info_dict_size())
        if self.learner_answer_info_list == new_learner_answer_info_list:
            raise Exception('Learner answer info with the given id not found.')

        self.learner_answer_info_list = new_learner_answer_info_list

    def update_state_reference(self, new_state_reference: str) -> None:
        """Updates the state_reference of the LearnerAnswerDetails object.

        Args:
            new_state_reference: str. The new state reference of the
                LearnerAnswerDetails.
        """
        self.state_reference = new_state_reference


class LearnerAnswerInfo:
    """Domain object containing the answer details submitted by the learner."""

    def __init__(
        self,
        learner_answer_info_id: str,
        answer: Optional[Union[str, int, Dict[str, str], List[str]]],
        answer_details: str,
        created_on: datetime.datetime
    ) -> None:
        """Constructs a LearnerAnswerInfo domain object.

        Args:
            learner_answer_info_id: str. The id of the LearnerAnswerInfo object.
            answer: dict or list or str or int or bool. The answer which is
                submitted by the learner. Actually type of the answer is
                interaction dependent, like TextInput interactions have
                string type answer, NumericInput have int type answers etc.
            answer_details: str. The details the learner will submit when the
                learner will be asked questions like 'Hey how did you land on
                this answer', 'Why did you pick that answer' etc.
            created_on: datetime. The time at which the answer details were
                received.
        """
        self.id = learner_answer_info_id
        self.answer = answer
        self.answer_details = answer_details
        self.created_on = created_on

    def to_dict(self) -> LearnerAnswerInfoDict:
        """Returns the dict of learner answer info.

        Returns:
            dict. The learner_answer_info dict.
        """
        learner_answer_info_dict: LearnerAnswerInfoDict = {
            'id': self.id,
            'answer': self.answer,
            'answer_details': self.answer_details,
            'created_on': self.created_on.strftime('%Y-%m-%d %H:%M:%S.%f')
        }
        return learner_answer_info_dict

    @classmethod
    def from_dict(
        cls, learner_answer_info_dict: LearnerAnswerInfoDict
    ) -> LearnerAnswerInfo:
        """Returns a dict representing LearnerAnswerInfo domain object.

        Returns:
            dict. A dict, mapping all fields of LearnerAnswerInfo instance.
        """

        return cls(
            learner_answer_info_dict['id'],
            learner_answer_info_dict['answer'],
            learner_answer_info_dict['answer_details'],
            datetime.datetime.strptime(
                learner_answer_info_dict['created_on'], '%Y-%m-%d %H:%M:%S.%f')
        )

    @classmethod
    def get_new_learner_answer_info_id(cls) -> str:
        """Generates the learner answer info domain object id.

        Returns:
            learner_answer_info_id: str. The id generated by the function.
        """
        learner_answer_info_id = (
            utils.base64_from_int(
                int(utils.get_current_time_in_millisecs())) +
            utils.base64_from_int(utils.get_random_int(127 * 127)))
        return learner_answer_info_id

    def validate(self) -> None:
        """Validates the LearnerAnswerInfo domain object."""
        if not isinstance(self.id, str):
            raise utils.ValidationError(
                'Expected id to be a string, received %s' % self.id)
        if self.answer is None:
            raise utils.ValidationError(
                'The answer submitted by the learner cannot be empty')
        if isinstance(self.answer, dict):
            if self.answer == {}:
                raise utils.ValidationError(
                    'The answer submitted cannot be an empty dict.')
        if isinstance(self.answer, str):
            if self.answer == '':
                raise utils.ValidationError(
                    'The answer submitted cannot be an empty string')
        if not isinstance(self.answer_details, str):
            raise utils.ValidationError(
                'Expected answer_details to be a string, received %s' % type(
                    self.answer_details))
        if self.answer_details == '':
            raise utils.ValidationError(
                'The answer details submitted cannot be an empty string.')
        if sys.getsizeof(self.answer_details) > MAX_ANSWER_DETAILS_BYTE_SIZE:
            raise utils.ValidationError(
                'The answer details size is to large to be stored')
        if not isinstance(self.created_on, datetime.datetime):
            raise utils.ValidationError(
                'Expected created_on to be a datetime, received %s'
                % str(self.created_on))

    def get_learner_answer_info_dict_size(self) -> int:
        """Returns a size overestimate (in bytes) of the given learner answer
        info dict.

        Returns:
            int. Size of the learner_answer_info_dict in bytes.
        """
        learner_answer_info_dict = self.to_dict()
        return sys.getsizeof(
            json.dumps(learner_answer_info_dict, default=str))
