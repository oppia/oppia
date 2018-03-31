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

"""Tests for the ratings system."""

import datetime

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rating_services
from core.tests import test_utils


class RatingServicesTests(test_utils.GenericTestBase):
    """Test functions in rating_services."""

    EXP_ID = 'exp_id'
    USER_ID_1 = 'user_1'
    USER_ID_2 = 'user_2'

    def test_rating_assignation(self):
        """Check ratings are correctly assigned to an exploration."""

        exp_services.save_new_exploration(
            self.EXP_ID,
            exp_domain.Exploration.create_default_exploration(self.EXP_ID))

        self.assertEqual(
            rating_services.get_overall_ratings_for_exploration(self.EXP_ID),
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            exp_summary.scaled_average_rating, 0)

        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_1, self.EXP_ID), None)

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 2)
        rating_services.assign_rating_to_exploration(
            self.USER_ID_2, self.EXP_ID, 4)
        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 3)

        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertAlmostEqual(
            exp_summary.scaled_average_rating, 1.5667471839848, places=4)

        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_1, self.EXP_ID), 3)
        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_2, self.EXP_ID), 4)
        self.assertEqual(
            rating_services.get_overall_ratings_for_exploration(self.EXP_ID),
            {'1': 0, '2': 0, '3': 1, '4': 1, '5': 0})

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 4)

        self.assertEqual(
            rating_services.get_overall_ratings_for_exploration(self.EXP_ID),
            {'1': 0, '2': 0, '3': 0, '4': 2, '5': 0})

    def test_time_of_ratings_recorded(self):
        """Check that the time a rating is given is recorded correctly."""

        time_allowed_for_computation = datetime.timedelta(seconds=10)

        exp_services.save_new_exploration(
            self.EXP_ID,
            exp_domain.Exploration.create_default_exploration(self.EXP_ID))

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 1)
        first_rating_time = rating_services.get_when_exploration_rated(
            self.USER_ID_1, self.EXP_ID)
        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, self.EXP_ID, 3)
        second_rating_time = rating_services.get_when_exploration_rated(
            self.USER_ID_1, self.EXP_ID)

        self.assertLess(
            datetime.datetime.utcnow(),
            first_rating_time + time_allowed_for_computation)
        self.assertLess(first_rating_time, second_rating_time)
        self.assertLess(second_rating_time, datetime.datetime.utcnow())

    def test_rating_assignations_do_not_conflict(self):
        """Check that ratings of different explorations are independant."""

        exp_id_a = 'exp_id_A'
        exp_id_b = 'exp_id_B'

        exp_services.save_new_exploration(
            exp_id_a,
            exp_domain.Exploration.create_default_exploration(exp_id_a))
        exp_services.save_new_exploration(
            exp_id_b,
            exp_domain.Exploration.create_default_exploration(exp_id_b))

        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, exp_id_a, 1)
        rating_services.assign_rating_to_exploration(
            self.USER_ID_1, exp_id_b, 3)
        rating_services.assign_rating_to_exploration(
            self.USER_ID_2, exp_id_a, 2)
        rating_services.assign_rating_to_exploration(
            self.USER_ID_2, exp_id_b, 5)

        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_1, exp_id_a), 1)
        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_1, exp_id_b), 3)
        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_2, exp_id_a), 2)
        self.assertEqual(
            rating_services.get_user_specific_rating_for_exploration(
                self.USER_ID_2, exp_id_b), 5)

        self.assertEqual(
            rating_services.get_overall_ratings_for_exploration(exp_id_a),
            {'1': 1, '2': 1, '3': 0, '4': 0, '5': 0})
        self.assertEqual(
            rating_services.get_overall_ratings_for_exploration(exp_id_b),
            {'1': 0, '2': 0, '3': 1, '4': 0, '5': 1})

    def test_invalid_ratings_are_forbidden(self):
        with self.assertRaisesRegexp(
            ValueError, 'Expected a rating 1-5, received 0'
            ):
            rating_services.assign_rating_to_exploration(
                self.USER_ID_1, self.EXP_ID, 0)

        with self.assertRaisesRegexp(
            ValueError, 'Expected a rating 1-5, received 7'
            ):
            rating_services.assign_rating_to_exploration(
                self.USER_ID_1, self.EXP_ID, 7)

        with self.assertRaisesRegexp(
            ValueError, 'Expected the rating to be an integer, received 2'
            ):
            rating_services.assign_rating_to_exploration(
                self.USER_ID_1, self.EXP_ID, '2')

        with self.assertRaisesRegexp(
            ValueError, 'Expected the rating to be an integer, received aaa'
            ):
            rating_services.assign_rating_to_exploration(
                self.USER_ID_1, self.EXP_ID, 'aaa')

    def test_invalid_exploration_ids_are_forbidden(self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid exploration id invalid_id'
            ):
            rating_services.assign_rating_to_exploration(
                self.USER_ID_1, 'invalid_id', 3)
