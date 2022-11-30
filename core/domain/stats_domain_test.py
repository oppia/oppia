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

"""Tests for core.domain.stats_domain."""

from __future__ import annotations

import datetime
import re

from core import feconf
from core import utils
from core.domain import exp_domain
from core.domain import stats_domain
from core.domain import stats_services
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class ExplorationStatsTests(test_utils.GenericTestBase):
    """Tests the ExplorationStats domain object."""

    def setUp(self) -> None:
        super().setUp()

        self.state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }

        self.exploration_stats_dict: stats_domain.ExplorationStatsDict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts_v1': 0,
            'num_starts_v2': 30,
            'num_actual_starts_v1': 0,
            'num_actual_starts_v2': 10,
            'num_completions_v1': 0,
            'num_completions_v2': 5,
            'state_stats_mapping': {
                'Home': self.state_stats_dict,
                'Home2': self.state_stats_dict
            }
        }

        self.exploration_stats = self._get_exploration_stats_from_dict(
            self.exploration_stats_dict)

    def _get_exploration_stats_from_dict(
        self,
        exploration_stats_dict: stats_domain.ExplorationStatsDict
    ) -> stats_domain.ExplorationStats:
        """Converts and returns the ExplorationStats object from the given
        exploration stats dict.
        """
        state_stats_mapping = {}
        for state_name in exploration_stats_dict['state_stats_mapping']:
            state_stats_mapping[state_name] = stats_domain.StateStats.from_dict(
                exploration_stats_dict['state_stats_mapping'][state_name])
        return stats_domain.ExplorationStats(
            exploration_stats_dict['exp_id'],
            exploration_stats_dict['exp_version'],
            exploration_stats_dict['num_starts_v1'],
            exploration_stats_dict['num_starts_v2'],
            exploration_stats_dict['num_actual_starts_v1'],
            exploration_stats_dict['num_actual_starts_v2'],
            exploration_stats_dict['num_completions_v1'],
            exploration_stats_dict['num_completions_v2'],
            state_stats_mapping)

    def test_create_default(self) -> None:
        exploration_stats = (
            stats_domain.ExplorationStats.create_default('exp_id1', 1, {}))

        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {})

    def test_to_dict(self) -> None:
        expected_exploration_stats_dict: stats_domain.ExplorationStatsDict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts_v1': 0,
            'num_starts_v2': 30,
            'num_actual_starts_v1': 0,
            'num_actual_starts_v2': 10,
            'num_completions_v1': 0,
            'num_completions_v2': 5,
            'state_stats_mapping': {
                'Home': self.state_stats_dict
            }
        }
        observed_exploration_stats = self._get_exploration_stats_from_dict(
            expected_exploration_stats_dict)
        self.assertDictEqual(
            expected_exploration_stats_dict,
            observed_exploration_stats.to_dict())

    def test_get_sum_of_first_hit_counts(self) -> None:
        """Test the get_sum_of_first_hit_counts method."""
        self.assertEqual(
            self.exploration_stats.get_sum_of_first_hit_counts(), 14)

    def test_validate_for_exploration_stats_with_correct_data(self) -> None:
        self.exploration_stats.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validate_with_int_exp_id(self) -> None:
        self.exploration_stats.exp_id = 10 # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected exp_id to be a string')):
            self.exploration_stats.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validation_with_string_num_actual_starts(self) -> None:
        self.exploration_stats.num_actual_starts_v2 = '0' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected num_actual_starts_v2 to be an int')):
            self.exploration_stats.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validation_with_list_state_stats_mapping(self) -> None:
        self.exploration_stats.state_stats_mapping = [] # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected state_stats_mapping to be a dict')):
            self.exploration_stats.validate()

    def test_validation_with_negative_num_completions(self) -> None:
        self.exploration_stats.num_completions_v2 = -5
        with self.assertRaisesRegex(utils.ValidationError, (
            '%s cannot have negative values' % ('num_completions_v2'))):
            self.exploration_stats.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate().
    def test_validate_exp_version(self) -> None:
        self.exploration_stats.exp_version = 'invalid_exp_version' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected exp_version to be an int')):
            self.exploration_stats.validate()

    def test_to_frontend_dict(self) -> None:
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        exploration_stats_dict: stats_domain.ExplorationStatsDict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts_v1': 0,
            'num_starts_v2': 30,
            'num_actual_starts_v1': 0,
            'num_actual_starts_v2': 10,
            'num_completions_v1': 0,
            'num_completions_v2': 5,
            'state_stats_mapping': {
                'Home': state_stats_dict
            }
        }

        expected_state_stats_dict = {
            'total_answers_count': 10,
            'useful_feedback_count': 4,
            'total_hit_count': 18,
            'first_hit_count': 7,
            'num_times_solution_viewed': 2,
            'num_completions': 2
        }

        expected_frontend_dict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'num_starts': 30,
            'num_actual_starts': 10,
            'num_completions': 5,
            'state_stats_mapping': {
                'Home': expected_state_stats_dict
            }
        }

        exploration_stats = self._get_exploration_stats_from_dict(
            exploration_stats_dict)

        self.assertEqual(
            exploration_stats.to_frontend_dict(), expected_frontend_dict)

    def test_clone_instance(self) -> None:
        exploration_stats = (stats_domain.ExplorationStats.create_default(
            'exp_id1', 1, {}))
        expected_clone_object = exploration_stats.clone()
        self.assertEqual(
            exploration_stats.to_dict(), expected_clone_object.to_dict()
        )


class StateStatsTests(test_utils.GenericTestBase):
    """Tests the StateStats domain object."""

    def setUp(self) -> None:
        super().setUp()

        self.state_stats = stats_domain.StateStats(
            0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)

    def test_from_dict(self) -> None:
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        state_stats = stats_domain.StateStats(0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)
        expected_state_stats = stats_domain.StateStats.from_dict(
            state_stats_dict)
        self.assertEqual(
            state_stats.total_answers_count_v1,
            expected_state_stats.total_answers_count_v1)
        self.assertEqual(
            state_stats.total_answers_count_v2,
            expected_state_stats.total_answers_count_v2)
        self.assertEqual(
            state_stats.useful_feedback_count_v1,
            expected_state_stats.useful_feedback_count_v1)
        self.assertEqual(
            state_stats.useful_feedback_count_v2,
            expected_state_stats.useful_feedback_count_v2)
        self.assertEqual(
            state_stats.total_hit_count_v1,
            expected_state_stats.total_hit_count_v1)
        self.assertEqual(
            state_stats.total_hit_count_v2,
            expected_state_stats.total_hit_count_v2)
        self.assertEqual(
            state_stats.first_hit_count_v1,
            expected_state_stats.first_hit_count_v1)
        self.assertEqual(
            state_stats.first_hit_count_v2,
            expected_state_stats.first_hit_count_v2)
        self.assertEqual(
            state_stats.num_times_solution_viewed_v2,
            expected_state_stats.num_times_solution_viewed_v2)
        self.assertEqual(
            state_stats.num_completions_v1,
            expected_state_stats.num_completions_v1)
        self.assertEqual(
            state_stats.num_completions_v2,
            expected_state_stats.num_completions_v2)

    def test_repr(self) -> None:
        state_stats = stats_domain.StateStats(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
        self.assertEqual(
            '%r' % (state_stats,),
            'StateStats('
            'total_answers_count_v1=1, total_answers_count_v2=2, '
            'useful_feedback_count_v1=3, useful_feedback_count_v2=4, '
            'total_hit_count_v1=5, total_hit_count_v2=6, '
            'first_hit_count_v1=7, first_hit_count_v2=8, '
            'num_times_solution_viewed_v2=9, '
            'num_completions_v1=10, num_completions_v2=11)')

    def test_str(self) -> None:
        state_stats = stats_domain.StateStats(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
        self.assertEqual(
            '%s' % (state_stats,),
            'StateStats('
            'total_answers_count=3, '
            'useful_feedback_count=7, '
            'total_hit_count=11, '
            'first_hit_count=15, '
            'num_times_solution_viewed=9, '
            'num_completions=21)')

    def test_create_default(self) -> None:
        state_stats = stats_domain.StateStats.create_default()
        self.assertEqual(state_stats.total_answers_count_v1, 0)
        self.assertEqual(state_stats.total_answers_count_v2, 0)
        self.assertEqual(state_stats.useful_feedback_count_v1, 0)
        self.assertEqual(state_stats.useful_feedback_count_v2, 0)
        self.assertEqual(state_stats.total_hit_count_v1, 0)
        self.assertEqual(state_stats.total_hit_count_v2, 0)
        self.assertEqual(state_stats.total_answers_count_v1, 0)
        self.assertEqual(state_stats.total_answers_count_v2, 0)
        self.assertEqual(state_stats.num_times_solution_viewed_v2, 0)
        self.assertEqual(state_stats.num_completions_v1, 0)
        self.assertEqual(state_stats.num_completions_v2, 0)

    def test_equality(self) -> None:
        state_stats_a = stats_domain.StateStats.create_default()
        state_stats_b = stats_domain.StateStats.create_default()
        state_stats_c = stats_domain.StateStats.create_default()

        self.assertEqual(state_stats_a, state_stats_b)
        self.assertEqual(state_stats_b, state_stats_c)
        self.assertEqual(state_stats_a, state_stats_c)

        state_stats_a.total_answers_count_v1 += 1
        self.assertEqual(state_stats_b, state_stats_c)
        self.assertNotEqual(state_stats_a, state_stats_b)
        self.assertNotEqual(state_stats_a, state_stats_c)

        state_stats_b.total_answers_count_v1 += 1
        state_stats_c.total_answers_count_v1 += 1

        self.assertEqual(state_stats_a, state_stats_b)
        self.assertEqual(state_stats_b, state_stats_c)
        self.assertEqual(state_stats_a, state_stats_c)

    def test_equality_with_different_class(self) -> None:
        class DifferentStats:
            """A different class."""

            pass

        state_stats = stats_domain.StateStats.create_default()
        different_stats = DifferentStats()

        self.assertFalse(state_stats == different_stats)

    def test_hash(self) -> None:
        state_stats = stats_domain.StateStats.create_default()
        with self.assertRaisesRegex(TypeError, 'unhashable'):
            unused_hash = hash(state_stats)

    def test_aggregate_from_state_stats(self) -> None:
        state_stats = stats_domain.StateStats(
            100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100)
        other_state_stats = stats_domain.StateStats(
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)

        state_stats.aggregate_from(other_state_stats)

        self.assertEqual(
            state_stats,
            stats_domain.StateStats(
                101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111))

    def test_aggregate_from_session_state_stats(self) -> None:
        state_stats = stats_domain.StateStats(
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10)
        session_state_stats = stats_domain.SessionStateStats(
            1, 2, 3, 4, 5, 6)

        state_stats.aggregate_from(session_state_stats)

        self.assertEqual(
            state_stats,
            stats_domain.StateStats(
                10, 11, 10, 12, 10, 13, 10, 14, 15, 10, 16))

    def test_aggregate_from_different_stats(self) -> None:
        class DifferentStats:
            """A different class."""

            pass

        state_stats = stats_domain.StateStats.create_default()
        different_stats = DifferentStats()

        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[arg-type]
        # is used to test method aggregate_from() input type.
        with self.assertRaisesRegex(TypeError, 'can not be aggregated from'):
            state_stats.aggregate_from(different_stats) # type: ignore[arg-type]

    def test_to_dict(self) -> None:
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }
        state_stats = stats_domain.StateStats(0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)
        self.assertEqual(state_stats_dict, state_stats.to_dict())

    def test_validation_for_state_stats_with_correct_data(self) -> None:
        self.state_stats.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validation_for_state_stats_with_string_total_answers_count(
        self
    ) -> None:
        self.state_stats.total_answers_count_v2 = '10' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected total_answers_count_v2 to be an int')):
            self.state_stats.validate()

    def test_validation_for_state_stats_with_negative_total_answers_count(
        self
    ) -> None:
        self.state_stats.total_answers_count_v2 = -5
        with self.assertRaisesRegex(utils.ValidationError, (
            '%s cannot have negative values' % ('total_answers_count_v2'))):
            self.state_stats.validate()

    def test_to_frontend_dict(self) -> None:
        state_stats_dict = {
            'total_answers_count_v1': 0,
            'total_answers_count_v2': 10,
            'useful_feedback_count_v1': 0,
            'useful_feedback_count_v2': 4,
            'total_hit_count_v1': 0,
            'total_hit_count_v2': 18,
            'first_hit_count_v1': 0,
            'first_hit_count_v2': 7,
            'num_times_solution_viewed_v2': 2,
            'num_completions_v1': 0,
            'num_completions_v2': 2
        }

        state_stats = stats_domain.StateStats.from_dict(state_stats_dict)

        expected_state_stats_dict = {
            'total_answers_count': 10,
            'useful_feedback_count': 4,
            'total_hit_count': 18,
            'first_hit_count': 7,
            'num_times_solution_viewed': 2,
            'num_completions': 2
        }

        self.assertEqual(
            state_stats.to_frontend_dict(), expected_state_stats_dict)

    def test_cloned_object_replicates_original_object(self) -> None:
        state_stats = stats_domain.StateStats(0, 10, 0, 4, 0, 18, 0, 7, 2, 0, 2)
        expected_state_stats = state_stats.clone()
        self.assertEqual(state_stats.to_dict(), expected_state_stats.to_dict())


class SessionStateStatsTests(test_utils.GenericTestBase):
    """Tests the SessionStateStats domain object."""

    def test_from_dict(self) -> None:
        session_state_stats_dict = {
            'total_answers_count': 10,
            'useful_feedback_count': 4,
            'total_hit_count': 18,
            'first_hit_count': 7,
            'num_times_solution_viewed': 2,
            'num_completions': 2
        }
        session_state_stats = stats_domain.SessionStateStats(10, 4, 18, 7, 2, 2)
        expected_session_state_stats = stats_domain.SessionStateStats.from_dict(
            session_state_stats_dict)
        self.assertEqual(
            session_state_stats.total_answers_count,
            expected_session_state_stats.total_answers_count)
        self.assertEqual(
            session_state_stats.useful_feedback_count,
            expected_session_state_stats.useful_feedback_count)
        self.assertEqual(
            session_state_stats.total_hit_count,
            expected_session_state_stats.total_hit_count)
        self.assertEqual(
            session_state_stats.first_hit_count,
            expected_session_state_stats.first_hit_count)
        self.assertEqual(
            session_state_stats.num_times_solution_viewed,
            expected_session_state_stats.num_times_solution_viewed)
        self.assertEqual(
            session_state_stats.num_completions,
            expected_session_state_stats.num_completions)

    def test_repr(self) -> None:
        session_state_stats = stats_domain.SessionStateStats(1, 2, 3, 4, 5, 6)
        self.assertEqual(
            '%r' % (session_state_stats,),
            'SessionStateStats('
            'total_answers_count=1, '
            'useful_feedback_count=2, '
            'total_hit_count=3, '
            'first_hit_count=4, '
            'num_times_solution_viewed=5, '
            'num_completions=6)')

    def test_create_default(self) -> None:
        session_state_stats = stats_domain.SessionStateStats.create_default()
        self.assertEqual(session_state_stats.total_answers_count, 0)
        self.assertEqual(session_state_stats.useful_feedback_count, 0)
        self.assertEqual(session_state_stats.total_hit_count, 0)
        self.assertEqual(session_state_stats.total_answers_count, 0)
        self.assertEqual(session_state_stats.num_times_solution_viewed, 0)
        self.assertEqual(session_state_stats.num_completions, 0)

    def test_equality(self) -> None:
        session_state_stats_a = stats_domain.SessionStateStats.create_default()
        session_state_stats_b = stats_domain.SessionStateStats.create_default()
        session_state_stats_c = stats_domain.SessionStateStats.create_default()

        self.assertEqual(session_state_stats_a, session_state_stats_b)
        self.assertEqual(session_state_stats_b, session_state_stats_c)
        self.assertEqual(session_state_stats_a, session_state_stats_c)

        session_state_stats_a.total_answers_count += 1
        self.assertEqual(session_state_stats_b, session_state_stats_c)
        self.assertNotEqual(session_state_stats_a, session_state_stats_b)
        self.assertNotEqual(session_state_stats_a, session_state_stats_c)

        session_state_stats_b.total_answers_count += 1
        session_state_stats_c.total_answers_count += 1

        self.assertEqual(session_state_stats_a, session_state_stats_b)
        self.assertEqual(session_state_stats_b, session_state_stats_c)
        self.assertEqual(session_state_stats_a, session_state_stats_c)

    def test_equality_with_different_class(self) -> None:
        class DifferentStats:
            """A different class."""

            pass

        session_state_stats = stats_domain.SessionStateStats.create_default()
        different_stats = DifferentStats()

        self.assertFalse(session_state_stats == different_stats)

    def test_hash(self) -> None:
        session_state_stats = stats_domain.SessionStateStats.create_default()
        with self.assertRaisesRegex(TypeError, 'unhashable'):
            unused_hash = hash(session_state_stats)

    def test_to_dict(self) -> None:
        self.assertEqual(
            stats_domain.SessionStateStats(1, 2, 3, 4, 5, 6).to_dict(), {
                'total_answers_count': 1,
                'useful_feedback_count': 2,
                'total_hit_count': 3,
                'first_hit_count': 4,
                'num_times_solution_viewed': 5,
                'num_completions': 6
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that num_starts must be in aggregated stats dict.
    def test_aggregated_stats_validation_when_session_property_is_missing(
            self
        ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = { # type: ignore[typeddict-item]
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'num_starts not in aggregated stats dict.'
        ):
            stats_domain.SessionStateStats.validate_aggregated_stats_dict(
                sessions_state_stats)

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that num_actual_starts must be an int.
    def test_aggregated_stats_validation_when_session_property_type_is_invalid(
        self
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 'invalid_type', # type: ignore[typeddict-item]
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected num_actual_starts to be an int, received invalid_type'
        ):
            stats_domain.SessionStateStats.validate_aggregated_stats_dict(
                sessions_state_stats)

    def test_aggregated_stats_validation_when_state_property_type_is_missing(
        self
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'total_answers_count not in state stats mapping of Home in '
            'aggregated stats dict.'
        ):
            stats_domain.SessionStateStats.validate_aggregated_stats_dict(
                sessions_state_stats)

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[dict-item] is used to
    # test that first_hit_count must be an int.
    def test_aggregated_stats_validation_when_state_property_type_is_invalid(
        self
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 'invalid_count', # type: ignore[dict-item]
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected first_hit_count to be an int, received invalid_count'
        ):
            stats_domain.SessionStateStats.validate_aggregated_stats_dict(
                sessions_state_stats)

    def test_aggregated_stats_validation_when_fully_valid(
        self
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }
        self.assertEqual(
            stats_domain.SessionStateStats.validate_aggregated_stats_dict(
                sessions_state_stats
            ),
            sessions_state_stats
        )


class ExplorationIssuesTests(test_utils.GenericTestBase):
    """Tests the ExplorationIssues domain object."""

    def setUp(self) -> None:
        super().setUp()

        self.exp_issues = stats_domain.ExplorationIssues(
            'exp_id1', 1, [
                stats_domain.ExplorationIssue.from_dict({
                    'issue_type': 'EarlyQuit',
                    'issue_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                        },
                        'time_spent_in_exp_in_msecs': {
                            'value': 200
                        }
                    },
                    'playthrough_ids': ['playthrough_id1'],
                    'schema_version': 1,
                    'is_valid': True})
                ])

    def test_create_default(self) -> None:
        exp_issues = stats_domain.ExplorationIssues.create_default('exp_id1', 1)
        self.assertEqual(exp_issues.exp_id, 'exp_id1')
        self.assertEqual(exp_issues.exp_version, 1)
        self.assertEqual(exp_issues.unresolved_issues, [])

    def test_to_dict(self) -> None:
        exp_issues_dict = self.exp_issues.to_dict()

        self.assertEqual(exp_issues_dict['exp_id'], 'exp_id1')
        self.assertEqual(exp_issues_dict['exp_version'], 1)
        self.assertEqual(
            exp_issues_dict['unresolved_issues'], [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True
            }])

    def test_from_dict(self) -> None:
        exp_issues_dict: stats_domain.ExplorationIssuesDict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'unresolved_issues': [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True
            }]
        }

        exp_issues = stats_domain.ExplorationIssues.from_dict(exp_issues_dict)

        self.assertEqual(exp_issues.exp_id, 'exp_id1')
        self.assertEqual(exp_issues.exp_version, 1)
        self.assertEqual(
            exp_issues.unresolved_issues[0].to_dict(),
            {
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True})

    def test_validate_for_exp_issues_with_correct_data(self) -> None:
        self.exp_issues.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validate_with_int_exp_id(self) -> None:
        self.exp_issues.exp_id = 5 # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected exp_id to be a string, received %s' % (type(5)))):
            self.exp_issues.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the validate() method input type.
    def test_validate_exp_version(self) -> None:
        self.exp_issues.exp_version = 'invalid_version' # type: ignore[assignment]

        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected exp_version to be an int')):
            self.exp_issues.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the validate() method input type.
    def test_validate_unresolved_issues(self) -> None:
        self.exp_issues.unresolved_issues = 0 # type: ignore[assignment]

        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected unresolved_issues to be a list')):
            self.exp_issues.validate()


class PlaythroughTests(test_utils.GenericTestBase):
    """Tests the Playthrough domain object."""

    def setUp(self) -> None:
        super().setUp()

        self.playthrough = self._get_valid_early_quit_playthrough()

    def _get_valid_early_quit_playthrough(self) -> stats_domain.Playthrough:
        """Returns an early quit playthrough after validating it."""
        playthrough = stats_domain.Playthrough(
            'exp_id1', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [stats_domain.LearnerAction.from_dict({
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            })])
        playthrough.validate()
        return playthrough

    def test_to_dict(self) -> None:
        playthrough = stats_domain.Playthrough(
            'exp_id1', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [stats_domain.LearnerAction.from_dict({
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            })])

        playthrough_dict = playthrough.to_dict()

        self.assertEqual(playthrough_dict['exp_id'], 'exp_id1')
        self.assertEqual(playthrough_dict['exp_version'], 1)
        self.assertEqual(playthrough_dict['issue_type'], 'EarlyQuit')
        self.assertEqual(
            playthrough_dict['issue_customization_args'], {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            })
        self.assertEqual(
            playthrough_dict['actions'], [
                {
                    'action_type': 'ExplorationStart',
                    'action_customization_args': {
                        'state_name': {
                            'value': 'state_name1'
                        }
                    },
                    'schema_version': 1
                }])

    def test_from_dict(self) -> None:
        """Test the from_dict() method."""
        playthrough_dict: stats_domain.PlaythroughDict = {
            'exp_id': 'exp_id1',
            'exp_version': 1,
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            },
            'actions': [{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            }],
        }

        playthrough = stats_domain.Playthrough.from_dict(playthrough_dict)

        self.assertEqual(playthrough.exp_id, 'exp_id1')
        self.assertEqual(playthrough.exp_version, 1)
        self.assertEqual(playthrough.issue_type, 'EarlyQuit')
        self.assertEqual(
            playthrough.issue_customization_args, {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            })
        self.assertEqual(
            playthrough.actions[0].to_dict(),
            {
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
                'schema_version': 1
            })

    def test_from_dict_raises_exception_when_miss_exp_id(self) -> None:
        """Test the from_dict() method."""
        # Test that a playthrough dict without 'exp_id' key raises exception.
        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[typeddict-item]
        # is used to test that playthrough dict contains 'exp_id' key.
        playthrough_dict: stats_domain.PlaythroughDict = { # type: ignore[typeddict-item]
            'exp_version': 1,
            'issue_type': 'EarlyQuit',
            'issue_customization_args': {},
            'actions': []
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'exp_id not in playthrough data dict.'):
            stats_domain.Playthrough.from_dict(playthrough_dict)

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validate_with_string_exp_version(self) -> None:
        self.playthrough.exp_version = '1' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected exp_version to be an int, received %s' % (type('1')))):
            self.playthrough.validate()

    def test_validate_with_invalid_issue_type(self) -> None:
        self.playthrough.issue_type = 'InvalidIssueType'
        with self.assertRaisesRegex(utils.ValidationError, (
            'Invalid issue type: %s' % self.playthrough.issue_type)):
            self.playthrough.validate()

    def test_validate_with_invalid_action_type(self) -> None:
        self.playthrough.actions = [
            stats_domain.LearnerAction.from_dict({
                'action_type': 'InvalidActionType',
                'schema_version': 1,
                'action_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    }
                },
            })]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Invalid action type: %s' % 'InvalidActionType')):
            self.playthrough.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate().
    def test_validate_non_str_exp_id(self) -> None:
        self.playthrough.exp_id = 0 # type: ignore[assignment]

        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected exp_id to be a string')):
            self.playthrough.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate().
    def test_validate_non_str_issue_type(self) -> None:
        self.playthrough.issue_type = 0 # type: ignore[assignment]

        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected issue_type to be a string')):
            self.playthrough.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate().
    def test_validate_non_list_actions(self) -> None:
        self.playthrough.actions = 0 # type: ignore[assignment]

        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected actions to be a list')):
            self.playthrough.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate().
    def test_validate_non_dict_issue_customization_args(self) -> None:
        self.playthrough.issue_customization_args = 0 # type: ignore[assignment]

        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected issue_customization_args to be a dict')):
            self.playthrough.validate()


class ExplorationIssueTests(test_utils.GenericTestBase):
    """Tests the ExplorationIssue domain object."""

    DUMMY_TIME_SPENT_IN_MSECS = 1000.0

    def setUp(self) -> None:
        super().setUp()

        self.exp_issue = stats_domain.ExplorationIssue(
            'EarlyQuit', {
                'state_name': {'value': ''},
                'time_spent_in_exp_in_msecs': {'value': 0}
            }, [], 1, True)

    def test_equality_with_different_class(self) -> None:
        class DifferentIssue:
            """A different class."""

            pass

        exploration_issue = stats_domain.ExplorationIssue(
            'EarlyQuit', {
                'state_name': {'value': ''},
                'time_spent_in_exp_in_msecs': {'value': 0}
            }, [], 1, True)
        different_issue = DifferentIssue()

        self.assertFalse(exploration_issue == different_issue)

    # TODO(#15995): Here we use type Any because currently customization
    # args are typed according to the codebase implementation, which can
    # be considered as loose type. But once the customization args are
    # implemented properly. we can remove this Any type and this todo also.
    def _dummy_convert_issue_v1_dict_to_v2_dict(
        self, issue_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """A test implementation of schema conversion function. It sets all the
        "time spent" fields for EarlyQuit issues to DUMMY_TIME_SPENT_IN_MSECS.
        """
        issue_dict['schema_version'] = 2
        if issue_dict['issue_type'] == 'EarlyQuit':
            issue_dict['issue_customization_args'][
                'time_spent_in_exp_in_msecs'] = self.DUMMY_TIME_SPENT_IN_MSECS

        return issue_dict

    def test_to_dict(self) -> None:
        exp_issue = stats_domain.ExplorationIssue(
            'EarlyQuit',
            {
                'time_spent_in_exp_in_msecs': {
                    'value': 0
                },
                'state_name': {
                    'value': ''
                }
            }, [], 1, True)
        exp_issue_dict = exp_issue.to_dict()
        expected_customization_args = {
            'time_spent_in_exp_in_msecs': {
                'value': 0
            },
            'state_name': {
                'value': ''
            }
        }
        self.assertEqual(
            exp_issue_dict, {
                'issue_type': 'EarlyQuit',
                'issue_customization_args': expected_customization_args,
                'playthrough_ids': [],
                'schema_version': 1,
                'is_valid': True
            })

    def test_from_dict(self) -> None:
        expected_customization_args: (
            stats_domain.IssuesCustomizationArgsDictType
        ) = {
            'time_spent_in_exp_in_msecs': {
                'value': 0
            },
            'state_name': {
                'value': ''
            }
        }
        exp_issue = stats_domain.ExplorationIssue.from_dict({
            'issue_type': 'EarlyQuit',
            'issue_customization_args': expected_customization_args,
            'playthrough_ids': [],
            'schema_version': 1,
            'is_valid': True
        })
        exp_issue_dict = exp_issue.to_dict()
        self.assertEqual(
            exp_issue_dict, {
                'issue_type': 'EarlyQuit',
                'issue_customization_args': expected_customization_args,
                'playthrough_ids': [],
                'schema_version': 1,
                'is_valid': True
            })

    def test_from_dict_raises_exception(self) -> None:
        """Test the from_dict() method."""
        # Test that an exploration issue dict without 'issue_type' key raises
        # exception.
        # Here we use MyPy ignore because we want to silent the error that was
        # generated by defining ExplorationIssueDict without 'issue_type' key.
        exp_issue_dict: stats_domain.ExplorationIssueDict = {  # type: ignore[typeddict-item]
            'issue_customization_args': {},
            'playthrough_ids': [],
            'schema_version': 1,
            'is_valid': True
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'issue_type not in exploration issue dict.'):
            stats_domain.ExplorationIssue.from_dict(exp_issue_dict)

    def test_update_exp_issue_from_model(self) -> None:
        """Test the migration of exploration issue domain objects."""
        exp_issue = stats_domain.ExplorationIssue(
            'EarlyQuit',
            {
                'time_spent_in_exp_in_msecs': {
                    'value': 0
                },
                'state_name': {
                    'value': ''
                }
            }, [], 1, True)
        exp_issue_dict = exp_issue.to_dict()
        stats_models.ExplorationIssuesModel.create(
            'exp_id', 1, [exp_issue_dict])

        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            'exp_id', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_issues_model is not None

        current_issue_schema_version_swap = self.swap(
            stats_models, 'CURRENT_ISSUE_SCHEMA_VERSION', 2)
        convert_issue_dict_swap = self.swap(
            stats_domain.ExplorationIssue,
            '_convert_issue_v1_dict_to_v2_dict',
            self._dummy_convert_issue_v1_dict_to_v2_dict)

        with convert_issue_dict_swap, current_issue_schema_version_swap:
            exp_issue_from_model = stats_services.get_exp_issues_from_model(
                exp_issues_model)

        self.assertEqual(
            exp_issue_from_model.unresolved_issues[0].issue_type, 'EarlyQuit')
        self.assertEqual(
            exp_issue_from_model.unresolved_issues[0].issue_customization_args[
                'time_spent_in_exp_in_msecs'
            ], self.DUMMY_TIME_SPENT_IN_MSECS)

        # For other issue types, no changes happen during migration.
        exp_issue1 = stats_domain.ExplorationIssue(
            'MultipleIncorrectSubmissions', {
                'state_name': {'value': ''},
                'num_times_answered_incorrectly': {'value': 7}
            }, [], 1, True)
        exp_issue_dict1 = exp_issue1.to_dict()

        stats_models.ExplorationIssuesModel.create(
            'exp_id_1', 1, [exp_issue_dict1])

        exp_issues_model1 = stats_models.ExplorationIssuesModel.get_model(
            'exp_id_1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_issues_model1 is not None

        current_issue_schema_version_swap = self.swap(
            stats_models, 'CURRENT_ISSUE_SCHEMA_VERSION', 2)
        convert_issue_dict_swap = self.swap(
            stats_domain.ExplorationIssue,
            '_convert_issue_v1_dict_to_v2_dict',
            self._dummy_convert_issue_v1_dict_to_v2_dict)

        with convert_issue_dict_swap, current_issue_schema_version_swap:
            exp_issue_from_model1 = stats_services.get_exp_issues_from_model(
                exp_issues_model1)

        self.assertEqual(
            exp_issue_from_model1.unresolved_issues[0].issue_type,
            'MultipleIncorrectSubmissions')

    def test_cannot_update_exp_issue_from_invalid_schema_version_model(
        self
    ) -> None:
        exp_issue = stats_domain.ExplorationIssue('EarlyQuit', {}, [], 4, True)
        exp_issue_dict = exp_issue.to_dict()
        stats_models.ExplorationIssuesModel.create(
            'exp_id', 1, [exp_issue_dict])

        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            'exp_id', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_issues_model is not None

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d and unversioned issue schemas at'
            ' present.' %
            stats_models.CURRENT_ISSUE_SCHEMA_VERSION):
            stats_services.get_exp_issues_from_model(exp_issues_model)

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[arg-type] is used to
    # test updating exp_issue with no schema_version.
    def test_cannot_update_exp_issue_with_no_schema_version(self) -> None:
        exp_issue = stats_domain.ExplorationIssue(
            'EarlyQuit', {}, [], None, True) # type: ignore[arg-type]
        exp_issue_dict = exp_issue.to_dict()
        stats_models.ExplorationIssuesModel.create(
            'exp_id', 1, [exp_issue_dict])

        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            'exp_id', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_issues_model is not None

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'unsupported operand type(s) for +=: \'NoneType\' '
                'and \'int\'')):
            stats_services.get_exp_issues_from_model(exp_issues_model)

    def test_actual_update_exp_issue_from_model_raises_error(self) -> None:
        exp_issue = stats_domain.ExplorationIssue('EarlyQuit', {}, [], 1, True)
        exp_issue_dict = exp_issue.to_dict()

        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The _convert_issue_v1_dict_to_v2_dict() method is missing '
                'from the derived class. It should be implemented in the '
                'derived class.')):
            stats_domain.ExplorationIssue.update_exp_issue_from_model(
                exp_issue_dict)

    def test_validate_for_exp_issues_with_correct_data(self) -> None:
        self.exp_issue.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the validate() method input type.
    def test_validate_with_int_issue_type(self) -> None:
        self.exp_issue.issue_type = 5 # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected issue_type to be a string, received %s' % (type(5)))):
            self.exp_issue.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the validate() method input type.
    def test_validate_with_string_schema_version(self) -> None:
        self.exp_issue.schema_version = '1' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected schema_version to be an int, received %s' % (type('1')))):
            self.exp_issue.validate()

    def test_validate_issue_type(self) -> None:
        self.exp_issue.issue_type = 'invalid_issue_type'
        with self.assertRaisesRegex(utils.ValidationError, (
            'Invalid issue type')):
            self.exp_issue.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the validate() method input type.
    def test_validate_playthrough_ids(self) -> None:
        self.exp_issue.playthrough_ids = 'invalid_playthrough_ids' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected playthrough_ids to be a list')):
            self.exp_issue.validate()

    # TODO(#13528): Here we use MyPy ignore because we Remove this test after
    # the backend is fully type-annotated. Here ignore[list-item] is used to
    # test that playthrough_id is a string.
    def test_validate_playthrough_id_type(self) -> None:
        self.exp_issue.playthrough_ids = [0, 1] # type: ignore[list-item]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected each playthrough_id to be a string')):
            self.exp_issue.validate()

    def test_comparison_between_exploration_issues_returns_correctly(
        self) -> None:
        expected_customization_args: (
            stats_domain.IssuesCustomizationArgsDictType
        ) = {
            'time_spent_in_exp_in_msecs': {
                'value': 0
            },
            'state_name': {
                'value': ''
            }
        }
        exp_issue1 = stats_domain.ExplorationIssue(
            'EarlyQuit',
            expected_customization_args,
            [],
            1,
            True
        )
        exp_issue2 = stats_domain.ExplorationIssue(
            'EarlyQuit',
            expected_customization_args,
            [],
            2,
            True
        )
        exp_issue3 = stats_domain.ExplorationIssue(
            'EarlyQuit',
            expected_customization_args,
            [],
            1,
            True
        )

        self.assertTrue(exp_issue1 == exp_issue3)
        self.assertFalse(exp_issue2 == exp_issue3)
        self.assertFalse(exp_issue1 == exp_issue2)


class LearnerActionTests(test_utils.GenericTestBase):
    """Tests the LearnerAction domain object."""

    def setUp(self) -> None:
        super().setUp()

        self.learner_action = stats_domain.LearnerAction(
            'ExplorationStart', {
                'state_name': {
                    'value': ''
                }
            }, 1)

    def _dummy_convert_action_v1_dict_to_v2_dict(
        self,
        action_dict: stats_domain.LearnerActionDict
    ) -> stats_domain.LearnerActionDict:
        """A test implementation of schema conversion function."""
        action_dict['schema_version'] = 2
        if action_dict['action_type'] == 'ExplorationStart':
            action_dict['action_type'] = 'ExplorationStart1'
            action_dict['action_customization_args']['new_key'] = {
                'value': 5
            }

        return action_dict

    def test_to_dict(self) -> None:
        learner_action = stats_domain.LearnerAction(
            'ExplorationStart',
            {
                'state_name': {
                    'value': ''
                }
            }, 1)
        learner_action_dict = learner_action.to_dict()
        expected_customization_args = {
            'state_name': {
                'value': ''
            }
        }
        self.assertEqual(
            learner_action_dict, {
                'action_type': 'ExplorationStart',
                'action_customization_args': expected_customization_args,
                'schema_version': 1
            })

    def test_update_learner_action_from_model(self) -> None:
        """Test the migration of learner action domain objects."""
        learner_action = stats_domain.LearnerAction('ExplorationStart', {}, 1)
        learner_action_dict = learner_action.to_dict()

        playthrough_id = stats_models.PlaythroughModel.create(
            'exp_id', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [learner_action_dict])

        playthrough_model = stats_models.PlaythroughModel.get(playthrough_id)

        current_action_schema_version_swap = self.swap(
            stats_models, 'CURRENT_ACTION_SCHEMA_VERSION', 2)
        convert_action_dict_swap = self.swap(
            stats_domain.LearnerAction,
            '_convert_action_v1_dict_to_v2_dict',
            self._dummy_convert_action_v1_dict_to_v2_dict)

        with current_action_schema_version_swap, convert_action_dict_swap:
            playthrough = stats_services.get_playthrough_from_model(
                playthrough_model)

        self.assertEqual(
            playthrough.actions[0].action_type, 'ExplorationStart1')
        self.assertEqual(
            playthrough.actions[0].action_customization_args['new_key'],
            {'value': 5})

        # For other action types, no changes happen during migration.
        learner_action1 = stats_domain.LearnerAction('ExplorationQuit', {}, 1)
        learner_action_dict1 = learner_action1.to_dict()

        playthrough_id_1 = stats_models.PlaythroughModel.create(
            'exp_id', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [learner_action_dict1])

        playthrough_model_1 = stats_models.PlaythroughModel.get(
            playthrough_id_1)

        current_action_schema_version_swap = self.swap(
            stats_models, 'CURRENT_ACTION_SCHEMA_VERSION', 2)
        convert_action_dict_swap = self.swap(
            stats_domain.LearnerAction,
            '_convert_action_v1_dict_to_v2_dict',
            self._dummy_convert_action_v1_dict_to_v2_dict)

        with current_action_schema_version_swap, convert_action_dict_swap:
            playthrough1 = stats_services.get_playthrough_from_model(
                playthrough_model_1)

        self.assertEqual(
            playthrough1.actions[0].action_type, 'ExplorationQuit')

    def test_cannot_update_learner_action_from_invalid_schema_version_model(
        self
    ) -> None:
        learner_action = stats_domain.LearnerAction('ExplorationStart', {}, 4)
        learner_action_dict = learner_action.to_dict()

        playthrough_id = stats_models.PlaythroughModel.create(
            'exp_id', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [learner_action_dict])

        playthrough_model = stats_models.PlaythroughModel.get(playthrough_id)

        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d and unversioned action schemas'
            ' at present.' %
            stats_models.CURRENT_ISSUE_SCHEMA_VERSION):
            stats_services.get_playthrough_from_model(
                playthrough_model)

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[arg-type] is used to test
    # updating learner_action with no schema_version.
    def test_cannot_update_learner_action_with_no_schema_version(self) -> None:
        learner_action = stats_domain.LearnerAction(
            'ExplorationStart', {}, None) # type: ignore[arg-type]
        learner_action_dict = learner_action.to_dict()

        playthrough_id = stats_models.PlaythroughModel.create(
            'exp_id', 1, 'EarlyQuit', {
                'state_name': {
                    'value': 'state_name1'
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 200
                }
            }, [learner_action_dict])

        playthrough_model = stats_models.PlaythroughModel.get(playthrough_id)

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'unsupported operand type(s) for +=: \'NoneType\' '
                'and \'int\'')):
            stats_services.get_playthrough_from_model(playthrough_model)

    def test_actual_update_learner_action_from_model_raises_error(self) -> None:
        learner_action = stats_domain.LearnerAction('ExplorationStart', {}, 1)
        learner_action_dict = learner_action.to_dict()

        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'The _convert_action_v1_dict_to_v2_dict() method is missing '
                'from the derived class. It should be implemented in the '
                'derived class.')):
            stats_domain.LearnerAction.update_learner_action_from_model(
                learner_action_dict)

    def test_validate_for_learner_action_with_correct_data(self) -> None:
        self.learner_action.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validate_with_int_action_type(self) -> None:
        self.learner_action.action_type = 5 # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected action_type to be a string, received %s' % (type(5)))):
            self.learner_action.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method validate() input type.
    def test_validate_with_string_schema_version(self) -> None:
        self.learner_action.schema_version = '1' # type: ignore[assignment]
        with self.assertRaisesRegex(utils.ValidationError, (
            'Expected schema_version to be an int, received %s' % (type('1')))):
            self.learner_action.validate()


class StateAnswersTests(test_utils.GenericTestBase):
    """Tests the StateAnswers domain object."""

    def test_can_retrieve_properly_constructed_submitted_answer_dict_list(
        self
    ) -> None:
        state_answers = stats_domain.StateAnswers(
            'exp_id', 1, 'initial_state', 'TextInput', [
                stats_domain.SubmittedAnswer(
                    'Text', 'TextInput', 0, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'sess', 10.5,
                    rule_spec_str='rule spec str1', answer_str='answer str1'),
                stats_domain.SubmittedAnswer(
                    'Other text', 'TextInput', 1, 0,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION, {}, 'sess', 7.5,
                    rule_spec_str='rule spec str2', answer_str='answer str2')])
        submitted_answer_dict_list = (
            state_answers.get_submitted_answer_dict_list())
        self.assertEqual(
            submitted_answer_dict_list, [{
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': 'rule spec str1',
                'answer_str': 'answer str1'
            }, {
                'answer': 'Other text',
                'interaction_id': 'TextInput',
                'answer_group_index': 1,
                'rule_spec_index': 0,
                'classification_categorization': (
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 7.5,
                'rule_spec_str': 'rule spec str2',
                'answer_str': 'answer str2'
            }])


class StateAnswersValidationTests(test_utils.GenericTestBase):
    """Tests the StateAnswers domain object for validation."""

    def setUp(self) -> None:
        super().setUp()
        self.state_answers = stats_domain.StateAnswers(
            'exp_id', 1, 'initial_state', 'TextInput', [])

        # The canonical object should have no validation problems.
        self.state_answers.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the type of exploration_id.
    def test_exploration_id_must_be_string(self) -> None:
        self.state_answers.exploration_id = 0 # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers, 'Expected exploration_id to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that state_name is a string.
    def test_state_name_must_be_string(self) -> None:
        self.state_answers.state_name = ['state'] # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers, 'Expected state_name to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the type of interaction_id.
    def test_interaction_id_can_be_none(self) -> None:
        self.state_answers.interaction_id = None # type: ignore[assignment]
        self.state_answers.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the type of interaction_id.
    def test_interaction_id_must_otherwise_be_string(self) -> None:
        self.state_answers.interaction_id = 10 # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers, 'Expected interaction_id to be a string')

    def test_interaction_id_must_refer_to_existing_interaction(self) -> None:
        self.state_answers.interaction_id = 'FakeInteraction'
        self._assert_validation_error(
            self.state_answers, 'Unknown interaction_id: FakeInteraction')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the type of submitted_answer_list.
    def test_submitted_answer_list_must_be_list(self) -> None:
        self.state_answers.submitted_answer_list = {} # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers, 'Expected submitted_answer_list to be a list')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test the type of schema_version.
    def test_schema_version_must_be_integer(self) -> None:
        self.state_answers.schema_version = '1' # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers, 'Expected schema_version to be an integer')

    def test_schema_version_must_be_between_one_and_current_version(
        self
    ) -> None:
        self.state_answers.schema_version = 0
        self._assert_validation_error(
            self.state_answers, 'schema_version < 1: 0')

        self.state_answers.schema_version = (
            feconf.CURRENT_STATE_ANSWERS_SCHEMA_VERSION + 1)
        self._assert_validation_error(
            self.state_answers,
            'schema_version > feconf\\.CURRENT_STATE_ANSWERS_SCHEMA_VERSION')

        self.state_answers.schema_version = 1
        self.state_answers.validate()


class SubmittedAnswerTests(test_utils.GenericTestBase):
    """Tests the SubmittedAnswer domain object."""

    def test_can_be_converted_to_from_full_dict(self) -> None:
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5, rule_spec_str='rule spec str',
            answer_str='answer str')
        submitted_answer_dict = submitted_answer.to_dict()
        cloned_submitted_answer = stats_domain.SubmittedAnswer.from_dict(
            submitted_answer_dict)
        self.assertEqual(
            cloned_submitted_answer.to_dict(), submitted_answer_dict)

    def test_can_be_converted_to_full_dict(self) -> None:
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5, rule_spec_str='rule spec str',
            answer_str='answer str')
        self.assertEqual(submitted_answer.to_dict(), {
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        })

    def test_dict_may_not_include_rule_spec_str_or_answer_str(self) -> None:
        submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 1, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'sess', 10.5)
        self.assertEqual(submitted_answer.to_dict(), {
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': exp_domain.EXPLICIT_CLASSIFICATION,
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'answer_str': None,
            'rule_spec_str': None
        })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'answer' key is in the submitted answer dict.
    def test_requires_answer_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'answer'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'interaction_id' key is in the submitted answer dict.
    def test_requires_interaction_id_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'interaction_id'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'answer_group_index' key is in the submitted answer dict.
    def test_requires_answer_group_index_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'answer_group_index'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'rule_spec_index' key is in the submitted answer dict.
    def test_requires_rule_spec_index_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'rule_spec_index'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'classification_categorization' key is in the submitted
    # answer dict.
    def test_requires_classification_categ_to_be_created_from_dict(
        self
    ) -> None:
        with self.assertRaisesRegex(KeyError, 'classification_categorization'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'params' key is in the submitted answer dict.
    def test_requires_params_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'params'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'session_id' key is in the submitted answer dict.
    def test_requires_session_id_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'session_id'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'time_spent_in_sec': 10.5,
                'rule_spec_str': None,
                'answer_str': None
            })

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that the 'time_spent_in_sec' key is in the submitted answer dict.
    def test_requires_time_spent_in_sec_to_be_created_from_dict(self) -> None:
        with self.assertRaisesRegex(KeyError, 'time_spent_in_sec'):
            stats_domain.SubmittedAnswer.from_dict({ # type: ignore[typeddict-item]
                'answer': 'Text',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'rule_spec_str': None,
                'answer_str': None
            })

    def test_can_be_created_from_full_dict(self) -> None:
        submitted_answer = stats_domain.SubmittedAnswer.from_dict({
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        })
        self.assertEqual(submitted_answer.answer, 'Text')
        self.assertEqual(submitted_answer.interaction_id, 'TextInput')
        self.assertEqual(submitted_answer.answer_group_index, 0)
        self.assertEqual(submitted_answer.rule_spec_index, 1)
        self.assertEqual(
            submitted_answer.classification_categorization,
            exp_domain.EXPLICIT_CLASSIFICATION)
        self.assertEqual(submitted_answer.params, {})
        self.assertEqual(submitted_answer.session_id, 'sess')
        self.assertEqual(submitted_answer.time_spent_in_sec, 10.5)
        self.assertEqual(submitted_answer.rule_spec_str, 'rule spec str')
        self.assertEqual(submitted_answer.answer_str, 'answer str')

    def test_can_be_created_from_dict_missing_rule_spec_and_answer(
        self
    ) -> None:
        submitted_answer = stats_domain.SubmittedAnswer.from_dict({
            'answer': 'Text',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': None,
            'answer_str': None
        })
        self.assertEqual(submitted_answer.answer, 'Text')
        self.assertEqual(submitted_answer.interaction_id, 'TextInput')
        self.assertEqual(submitted_answer.answer_group_index, 0)
        self.assertEqual(submitted_answer.rule_spec_index, 1)
        self.assertEqual(
            submitted_answer.classification_categorization,
            exp_domain.EXPLICIT_CLASSIFICATION)
        self.assertEqual(submitted_answer.params, {})
        self.assertEqual(submitted_answer.session_id, 'sess')
        self.assertEqual(submitted_answer.time_spent_in_sec, 10.5)
        self.assertIsNone(submitted_answer.rule_spec_str)
        self.assertIsNone(submitted_answer.answer_str)


class SubmittedAnswerValidationTests(test_utils.GenericTestBase):
    """Tests the SubmittedAnswer domain object for validation."""

    def setUp(self) -> None:
        super().setUp()
        self.submitted_answer = stats_domain.SubmittedAnswer(
            'Text', 'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION, {},
            'session_id', 0.)

        # The canonical object should have no validation problems.
        self.submitted_answer.validate()

    def test_answer_may_be_none_only_for_linear_interaction(self) -> None:
        # It's valid for answer to be None if the interaction type is Continue.
        self.submitted_answer.answer = None
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided answer except for linear '
            'interactions')

        self.submitted_answer.interaction_id = 'Continue'
        self.submitted_answer.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that time_spent_in_sec is not None.
    def test_time_spent_in_sec_must_not_be_none(self) -> None:
        self.submitted_answer.time_spent_in_sec = None # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided time_spent_in_sec')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that time_spent_in_sec is int.
    def test_time_spent_in_sec_must_be_number(self) -> None:
        self.submitted_answer.time_spent_in_sec = '0' # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer, 'Expected time_spent_in_sec to be a number')

    def test_time_spent_in_sec_must_be_positive(self) -> None:
        self.submitted_answer.time_spent_in_sec = -1.
        self._assert_validation_error(
            self.submitted_answer,
            'Expected time_spent_in_sec to be non-negative')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that session_id is not None.
    def test_session_id_must_not_be_none(self) -> None:
        self.submitted_answer.session_id = None # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer,
            'SubmittedAnswers must have a provided session_id')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that session_id is a string.
    def test_session_id_must_be_string(self) -> None:
        self.submitted_answer.session_id = 90 # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer, 'Expected session_id to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that params is a dict.
    def test_params_must_be_dict(self) -> None:
        self.submitted_answer.params = [] # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer, 'Expected params to be a dict')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that answer_group_index is int.
    def test_answer_group_index_must_be_integer(self) -> None:
        self.submitted_answer.answer_group_index = '0' # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_group_index to be an integer')

    def test_answer_group_index_must_be_positive(self) -> None:
        self.submitted_answer.answer_group_index = -1
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_group_index to be non-negative')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test type of rule_spec_index.
    def test_rule_spec_index_can_be_none(self) -> None:
        self.submitted_answer.rule_spec_index = None # type: ignore[assignment]
        self.submitted_answer.validate()

    def test_rule_spec_index_must_be_integer(self) -> None:
        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[assignment]
        # is used to test that rule_spec_index is int.
        self.submitted_answer.rule_spec_index = '0' # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer, 'Expected rule_spec_index to be an integer')

        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[assignment]
        # is used to test that rule_spec_index is int.
        self.submitted_answer.rule_spec_index = '' # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer, 'Expected rule_spec_index to be an integer')
        self.submitted_answer.rule_spec_index = 0
        self.submitted_answer.validate()

    def test_rule_spec_index_must_be_positive(self) -> None:
        self.submitted_answer.rule_spec_index = -1
        self._assert_validation_error(
            self.submitted_answer,
            'Expected rule_spec_index to be non-negative')

    def test_classification_categorization_must_be_valid_category(self) -> None:
        self.submitted_answer.classification_categorization = (
            exp_domain.TRAINING_DATA_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = (
            exp_domain.STATISTICAL_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = (
            exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
        self.submitted_answer.validate()

        self.submitted_answer.classification_categorization = 'soft'
        self._assert_validation_error(
            self.submitted_answer,
            'Expected valid classification_categorization')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that rule_spec_str is None or str.
    def test_rule_spec_str_must_be_none_or_string(self) -> None:
        self.submitted_answer.rule_spec_str = 10 # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer,
            'Expected rule_spec_str to be either None or a string')

        self.submitted_answer.rule_spec_str = 'str'
        self.submitted_answer.validate()

        self.submitted_answer.rule_spec_str = None
        self.submitted_answer.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that answer_str is None or str.
    def test_answer_str_must_be_none_or_string(self) -> None:
        self.submitted_answer.answer_str = 10 # type: ignore[assignment]
        self._assert_validation_error(
            self.submitted_answer,
            'Expected answer_str to be either None or a string')

        self.submitted_answer.answer_str = 'str'
        self.submitted_answer.validate()

        self.submitted_answer.answer_str = None
        self.submitted_answer.validate()


class AnswerFrequencyListDomainTests(test_utils.GenericTestBase):
    """Tests AnswerFrequencyList for basic domain object operations."""

    ANSWER_A = stats_domain.AnswerOccurrence('answer a', 3)
    ANSWER_B = stats_domain.AnswerOccurrence('answer b', 2)
    ANSWER_C = stats_domain.AnswerOccurrence('answer c', 1)

    def test_has_correct_type(self) -> None:
        answer_frequency_list = stats_domain.AnswerFrequencyList([])
        self.assertEqual(
            answer_frequency_list.calculation_output_type,
            stats_domain.CALC_OUTPUT_TYPE_ANSWER_FREQUENCY_LIST)

    def test_defaults_to_empty_list(self) -> None:
        answer_frequency_list = stats_domain.AnswerFrequencyList()
        self.assertEqual(len(answer_frequency_list.answer_occurrences), 0)

    def test_create_list_from_raw_object(self) -> None:
        answer_frequency_list = (
            stats_domain.AnswerFrequencyList.from_raw_type([{
                'answer': 'answer a', 'frequency': 3
            }, {
                'answer': 'answer b', 'frequency': 2
            }]))
        answer_occurrences = answer_frequency_list.answer_occurrences
        self.assertEqual(len(answer_occurrences), 2)
        self.assertEqual(answer_occurrences[0].answer, 'answer a')
        self.assertEqual(answer_occurrences[0].frequency, 3)
        self.assertEqual(answer_occurrences[1].answer, 'answer b')
        self.assertEqual(answer_occurrences[1].frequency, 2)

    def test_convert_list_to_raw_object(self) -> None:
        answer_frequency_list = stats_domain.AnswerFrequencyList(
            [self.ANSWER_A, self.ANSWER_B])
        self.assertEqual(answer_frequency_list.to_raw_type(), [{
            'answer': 'answer a', 'frequency': 3
        }, {
            'answer': 'answer b', 'frequency': 2
        }])


class CategorizedAnswerFrequencyListsDomainTests(test_utils.GenericTestBase):
    """Tests CategorizedAnswerFrequencyLists for basic domain object
    operations.
    """

    ANSWER_A = stats_domain.AnswerOccurrence('answer a', 3)
    ANSWER_B = stats_domain.AnswerOccurrence('answer b', 2)
    ANSWER_C = stats_domain.AnswerOccurrence('answer c', 1)

    def test_has_correct_type(self) -> None:
        answer_frequency_lists = (
            stats_domain.CategorizedAnswerFrequencyLists({}))
        self.assertEqual(
            answer_frequency_lists.calculation_output_type,
            stats_domain.CALC_OUTPUT_TYPE_CATEGORIZED_ANSWER_FREQUENCY_LISTS)

    def test_defaults_to_empty_dict(self) -> None:
        answer_frequency_lists = stats_domain.CategorizedAnswerFrequencyLists()
        self.assertEqual(
            len(answer_frequency_lists.categorized_answer_freq_lists), 0)

    def test_create_list_from_raw_object(self) -> None:
        answer_frequency_lists = (
            stats_domain.CategorizedAnswerFrequencyLists.from_raw_type({
                'category a': [{'answer': 'answer a', 'frequency': 3}],
                'category b': [{
                    'answer': 'answer b',
                    'frequency': 2
                }, {
                    'answer': 'answer c',
                    'frequency': 1
                }]
            }))
        self.assertEqual(
            len(answer_frequency_lists.categorized_answer_freq_lists), 2)
        self.assertIn(
            'category a', answer_frequency_lists.categorized_answer_freq_lists)
        self.assertIn(
            'category b', answer_frequency_lists.categorized_answer_freq_lists)

        category_a_answer_list = (
            answer_frequency_lists.categorized_answer_freq_lists['category a'])
        category_b_answer_list = (
            answer_frequency_lists.categorized_answer_freq_lists['category b'])
        category_a_answers = category_a_answer_list.answer_occurrences
        category_b_answers = category_b_answer_list.answer_occurrences
        self.assertEqual(len(category_a_answers), 1)
        self.assertEqual(len(category_b_answers), 2)

        self.assertEqual(category_a_answers[0].answer, 'answer a')
        self.assertEqual(category_a_answers[0].frequency, 3)
        self.assertEqual(category_b_answers[0].answer, 'answer b')
        self.assertEqual(category_b_answers[0].frequency, 2)
        self.assertEqual(category_b_answers[1].answer, 'answer c')
        self.assertEqual(category_b_answers[1].frequency, 1)

    def test_convert_list_to_raw_object(self) -> None:
        answer_frequency_lists = stats_domain.CategorizedAnswerFrequencyLists({
            'category a': stats_domain.AnswerFrequencyList([self.ANSWER_A]),
            'category b': stats_domain.AnswerFrequencyList(
                [self.ANSWER_B, self.ANSWER_C]),
        })
        self.assertEqual(answer_frequency_lists.to_raw_type(), {
            'category a': [{'answer': 'answer a', 'frequency': 3}],
            'category b': [{
                'answer': 'answer b',
                'frequency': 2
            }, {
                'answer': 'answer c',
                'frequency': 1
            }]
        })


class StateAnswersCalcOutputValidationTests(test_utils.GenericTestBase):
    """Tests the StateAnswersCalcOutput domain object for validation."""

    class MockCalculationOutputObjectWithUnknownType:
        pass

    def setUp(self) -> None:
        super().setUp()
        self.state_answers_calc_output = stats_domain.StateAnswersCalcOutput(
            'exp_id', 1, 'initial_state', 'TextInput', 'AnswerFrequencies',
            stats_domain.AnswerFrequencyList.from_raw_type([]))

        # The canonical object should have no validation problems.
        self.state_answers_calc_output.validate()

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that exploration_id is a string.
    def test_exploration_id_must_be_string(self) -> None:
        self.state_answers_calc_output.exploration_id = 0 # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected exploration_id to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that sstate_name is a string.
    def test_state_name_must_be_string(self) -> None:
        self.state_answers_calc_output.state_name = ['state'] # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected state_name to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that calculation_id is a string.
    def test_calculation_id_must_be_string(self) -> None:
        self.state_answers_calc_output.calculation_id = ['calculation id'] # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected calculation_id to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that calculation_output is a known type.
    def test_calculation_output_must_be_known_type(self) -> None:
        self.state_answers_calc_output.calculation_output = (
            self.MockCalculationOutputObjectWithUnknownType()) # type: ignore[assignment]
        self._assert_validation_error(
            self.state_answers_calc_output,
            'Expected calculation output to be one of')

    def test_calculation_output_must_be_less_than_one_million_bytes(
        self
    ) -> None:
        occurred_answer = stats_domain.AnswerOccurrence(
            'This is not a long sentence.', 1)
        self.state_answers_calc_output.calculation_output = (
            stats_domain.AnswerFrequencyList(
                [occurred_answer] * 200000))
        self._assert_validation_error(
            self.state_answers_calc_output,
            'calculation_output is too big to be stored')


class LearnerAnswerDetailsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.learner_answer_details = stats_domain.LearnerAnswerDetails(
            'exp_id:state_name', feconf.ENTITY_TYPE_EXPLORATION,
            'TextInput', [stats_domain.LearnerAnswerInfo(
                'id_1', 'This is my answer', 'This is my answer details',
                datetime.datetime(2019, 6, 19, 13, 59, 29, 153073))], 4000)
        self.learner_answer_details.validate()

    def test_to_dict(self) -> None:
        expected_learner_answer_details_dict = {
            'state_reference': 'exp_id:state_name',
            'entity_type': 'exploration',
            'interaction_id': 'TextInput',
            'learner_answer_info_list': [{
                'id': 'id_1',
                'answer': 'This is my answer',
                'answer_details': 'This is my answer details',
                'created_on': '2019-06-19 13:59:29.153073'
            }],
            'accumulated_answer_info_json_size_bytes': 4000,
            'learner_answer_info_schema_version': 1}
        learner_answer_details_dict = self.learner_answer_details.to_dict()
        self.assertEqual(
            learner_answer_details_dict, expected_learner_answer_details_dict)

    def test_from_dict(self) -> None:
        learner_answer_details_dict: stats_domain.LearnerAnswerDetailsDict = {
            'state_reference': 'exp_id:state_name',
            'entity_type': 'exploration',
            'interaction_id': 'TextInput',
            'learner_answer_info_list': [{
                'id': 'id_1',
                'answer': 'This is my answer',
                'answer_details': 'This is my answer details',
                'created_on': '2019-06-19 13:59:29.153073'
            }],
            'accumulated_answer_info_json_size_bytes': 4000,
            'learner_answer_info_schema_version': 1}
        learner_answer_details = stats_domain.LearnerAnswerDetails.from_dict(
            learner_answer_details_dict)
        self.assertEqual(
            learner_answer_details.state_reference, 'exp_id:state_name')
        self.assertEqual(
            learner_answer_details.entity_type, 'exploration')
        self.assertEqual(
            learner_answer_details.interaction_id, 'TextInput')
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 1)
        self.assertEqual(
            learner_answer_details.learner_answer_info_list[0].answer,
            'This is my answer')
        self.assertEqual(
            learner_answer_details.learner_answer_info_list[0].answer_details,
            'This is my answer details')
        self.assertEqual(
            learner_answer_details.learner_answer_info_list[0].created_on,
            datetime.datetime(2019, 6, 19, 13, 59, 29, 153073))
        self.assertEqual(
            learner_answer_details.accumulated_answer_info_json_size_bytes,
            4000)
        self.assertEqual(
            learner_answer_details.learner_answer_info_schema_version, 1)

    def test_add_learner_answer_info(self) -> None:
        learner_answer_info = stats_domain.LearnerAnswerInfo(
            'id_2', 'This answer', 'This details',
            datetime.datetime.strptime('27 Sep 2012', '%d %b %Y'))
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 1)
        self.learner_answer_details.add_learner_answer_info(
            learner_answer_info)
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 2)

    def test_learner_answer_info_with_big_size_must_not_be_added(self) -> None:
        answer = 'This is answer abc' * 900
        answer_details = 'This is answer details' * 400
        created_on = datetime.datetime.strptime('27 Sep 2012', '%d %b %Y')
        id_base = 'id:'
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 1)
        for i in range(36):
            learner_answer_info = stats_domain.LearnerAnswerInfo(
                id_base + str(i), answer, answer_details, created_on)
            self.learner_answer_details.add_learner_answer_info(
                learner_answer_info)
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 36)
        learner_answer_info = stats_domain.LearnerAnswerInfo(
            'id:40', answer, answer_details, created_on)
        self.learner_answer_details.add_learner_answer_info(
            learner_answer_info)
        # Due to overflow of the size of learner_answer_info_list, this learner
        # answer info was not added in the list.
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 36)

    def test_delete_learner_answer_info(self) -> None:
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 1)
        learner_answer_info = stats_domain.LearnerAnswerInfo(
            'id_2', 'This answer', 'This details',
            datetime.datetime.strptime('27 Sep 2012', '%d %b %Y'))
        self.learner_answer_details.add_learner_answer_info(
            learner_answer_info)
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 2)
        self.learner_answer_details.delete_learner_answer_info('id_1')
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 1)
        self.assertNotEqual(
            self.learner_answer_details.accumulated_answer_info_json_size_bytes,
            0)
        with self.assertRaisesRegex(
            Exception, 'Learner answer info with the given id not found'):
            self.learner_answer_details.delete_learner_answer_info('id_3')
        self.assertEqual(
            len(self.learner_answer_details.learner_answer_info_list), 1)

    def test_update_state_reference(self) -> None:
        self.assertEqual(
            self.learner_answer_details.state_reference, 'exp_id:state_name')
        self.learner_answer_details.update_state_reference(
            'exp_id_1:state_name_1')
        self.assertEqual(
            self.learner_answer_details.state_reference,
            'exp_id_1:state_name_1')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that state_reference is str.
    def test_state_reference_must_be_string(self) -> None:
        self.learner_answer_details.state_reference = 0 # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_details,
            'Expected state_reference to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that entity_type is str.
    def test_entity_type_must_be_string(self) -> None:
        self.learner_answer_details.entity_type = 0 # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_details,
            'Expected entity_type to be a string')

    def test_entity_type_must_be_valid(self,) -> None:
        self.learner_answer_details.entity_type = 'topic'
        self._assert_validation_error(
            self.learner_answer_details,
            'Invalid entity type received topic')

    def test_state_reference_must_be_valid_for_exploration(self) -> None:
        self.learner_answer_details.state_reference = 'expidstatename'
        self._assert_validation_error(
            self.learner_answer_details,
            'For entity type exploration, the state reference should')

    def test_state_reference_must_be_valid_for_question(self) -> None:
        self.learner_answer_details.entity_type = 'question'
        self.learner_answer_details.state_reference = 'expid:statename'
        self._assert_validation_error(
            self.learner_answer_details,
            'For entity type question, the state reference should')

    def test_interaction_id_must_be_valid(self) -> None:
        self.learner_answer_details.interaction_id = 'MyInteraction'
        self._assert_validation_error(
            self.learner_answer_details,
            'Unknown interaction_id: MyInteraction')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that interaction_id is str.
    def test_interaction_id_must_be_string(self) -> None:
        self.learner_answer_details.interaction_id = 0 # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_details,
            'Expected interaction_id to be a string')

    def test_continue_interaction_cannot_solicit_answer_details(self) -> None:
        self.learner_answer_details.interaction_id = 'Continue'
        self._assert_validation_error(
            self.learner_answer_details,
            'The Continue interaction does not support '
            'soliciting answer details')

    def test_end_exploration_interaction_cannot_solicit_answer_details(
        self
    ) -> None:
        self.learner_answer_details.interaction_id = 'EndExploration'
        self._assert_validation_error(
            self.learner_answer_details,
            'The EndExploration interaction does not support '
            'soliciting answer details')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that learner_answer_info is a List.
    def test_learner_answer_info_must_be_list(self) -> None:
        self.learner_answer_details.learner_answer_info_list = 'list' # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_details,
            'Expected learner_answer_info_list to be a list')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that learner_answer_info_schema_version is int.
    def test_learner_answer_info_schema_version_must_be_int(self) -> None:
        self.learner_answer_details.learner_answer_info_schema_version = 'v' # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_details,
            'Expected learner_answer_info_schema_version to be an int')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that accumulated_answer_info_json_size_bytes is a string.
    def test_accumulated_answer_info_json_size_bytes_must_be_int(self) -> None:
        self.learner_answer_details.accumulated_answer_info_json_size_bytes = (
            'size') # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_details,
            'Expected accumulated_answer_info_json_size_bytes to be an int')


class LearnerAnswerInfoTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.learner_answer_info = stats_domain.LearnerAnswerInfo(
            'id_1', 'This is my answer', 'This is my answer details',
            datetime.datetime(2019, 6, 19, 13, 59, 29, 153073))
        self.learner_answer_info.validate()

    def test_to_dict(self) -> None:
        expected_learner_answer_info_dict = {
            'id': 'id_1',
            'answer': 'This is my answer',
            'answer_details': 'This is my answer details',
            'created_on': '2019-06-19 13:59:29.153073'
        }
        self.assertEqual(
            expected_learner_answer_info_dict,
            self.learner_answer_info.to_dict())

    def test_from_dict(self) -> None:
        learner_answer_info_dict: stats_domain.LearnerAnswerInfoDict = {
            'id': 'id_1',
            'answer': 'This is my answer',
            'answer_details': 'This is my answer details',
            'created_on': '2019-06-19 13:59:29.153073'
        }
        learner_answer_info = stats_domain.LearnerAnswerInfo.from_dict(
            learner_answer_info_dict)
        self.assertEqual(learner_answer_info.id, 'id_1')
        self.assertEqual(learner_answer_info.answer, 'This is my answer')
        self.assertEqual(
            learner_answer_info.answer_details, 'This is my answer details')
        self.assertEqual(
            learner_answer_info.created_on,
            datetime.datetime(2019, 6, 19, 13, 59, 29, 153073))

    def test_from_dict_to_dict(self) -> None:
        learner_answer_info_dict: stats_domain.LearnerAnswerInfoDict = {
            'id': 'id_1',
            'answer': 'This is my answer',
            'answer_details': 'This is my answer details',
            'created_on': '2019-06-19 13:59:29.153073'
        }
        learner_answer_info = stats_domain.LearnerAnswerInfo.from_dict(
            learner_answer_info_dict)
        self.assertEqual(learner_answer_info.id, 'id_1')
        self.assertEqual(learner_answer_info.answer, 'This is my answer')
        self.assertEqual(
            learner_answer_info.answer_details, 'This is my answer details')
        self.assertEqual(
            learner_answer_info.created_on,
            datetime.datetime(2019, 6, 19, 13, 59, 29, 153073))
        self.assertEqual(
            learner_answer_info.to_dict(), learner_answer_info_dict)

    def test_get_learner_answer_info_dict_size(self) -> None:
        learner_answer_info_dict_size = (
            self.learner_answer_info.get_learner_answer_info_dict_size())
        self.assertNotEqual(learner_answer_info_dict_size, 0)
        self.assertTrue(learner_answer_info_dict_size > 0)

    def test_get_new_learner_answer_info_id(self) -> None:
        learner_answer_info_id = (
            stats_domain.LearnerAnswerInfo.get_new_learner_answer_info_id())
        self.assertNotEqual(learner_answer_info_id, None)
        self.assertTrue(isinstance(learner_answer_info_id, str))

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test id type.
    def test_id_must_be_string(self) -> None:
        self.learner_answer_info.id = 123 # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_info, 'Expected id to be a string')

    def test_answer_must_not_be_none(self) -> None:
        self.learner_answer_info.answer = None
        self._assert_validation_error(
            self.learner_answer_info,
            'The answer submitted by the learner cannot be empty')

    def test_answer_must_not_be_empty_dict(self) -> None:
        self.learner_answer_info.answer = {}
        self._assert_validation_error(
            self.learner_answer_info,
            'The answer submitted cannot be an empty dict')

    def test_answer_must_not_be_empty_string(self) -> None:
        self.learner_answer_info.answer = ''
        self._assert_validation_error(
            self.learner_answer_info,
            'The answer submitted cannot be an empty string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test method that answer_details from learner_answer_info is not None.
    def test_answer_details_must_not_be_none(self) -> None:
        self.learner_answer_info.answer_details = None # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_info,
            'Expected answer_details to be a string')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that answer_details is str.
    def test_answer_details_must_be_string(self) -> None:
        self.learner_answer_info.answer_details = 1 # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_info,
            'Expected answer_details to be a string')

    def test_answer_details_must_not_be_empty_string(self) -> None:
        self.learner_answer_info.answer_details = ''
        self._assert_validation_error(
            self.learner_answer_info,
            'The answer details submitted cannot be an empty string')

    def test_large_answer_details_must_not_be_stored(self) -> None:
        self.learner_answer_info.answer_details = 'abcdef' * 2000
        self._assert_validation_error(
            self.learner_answer_info,
            'The answer details size is to large to be stored')

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[assignment] is used to
    # test that created_on is a datetime.
    def test_created_on_must_be_datetime_type(self) -> None:
        self.learner_answer_info.created_on = '19 June 2019' # type: ignore[assignment]
        self._assert_validation_error(
            self.learner_answer_info,
            'Expected created_on to be a datetime')
