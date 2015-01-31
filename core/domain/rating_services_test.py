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

__author__ = 'Jacob Davis'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rating_services
import test_utils


class RatingServicesTests(test_utils.GenericTestBase):
    """Test functions in rating_services."""

    EXP_ID = 'exp_id'
    USER_ID_1 = 'user_1'
    USER_ID_2 = 'user_2'

    def setUp(self):
        super(RatingServicesTests, self).setUp()

        self.exploration = exp_domain.Exploration.create_default_exploration(
            self.EXP_ID, 'A title', 'A category')
        exp_services.save_new_exploration(self.EXP_ID, self.exploration)

    def test_rating_assignation(self):
        """Check ratings are correctly assigned"""

        self.assertEqual(
            rating_services.get_overall_ratings(self.EXP_ID),
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

        self.assertEqual(
            rating_services.get_user_specific_rating(
                self.USER_ID_1, self.EXP_ID), None)

        rating_services.assign_rating(self.USER_ID_1, self.EXP_ID, 2)
        rating_services.assign_rating(self.USER_ID_2, self.EXP_ID, 4)
        rating_services.assign_rating(self.USER_ID_1, self.EXP_ID, 3)

        self.assertEqual(
            rating_services.get_user_specific_rating(
                self.USER_ID_1, self.EXP_ID), 3)
        self.assertEqual(
            rating_services.get_user_specific_rating(
                self.USER_ID_2, self.EXP_ID), 4)

        self.assertEqual(
            rating_services.get_overall_ratings(self.EXP_ID),
            {'1': 0, '2': 0, '3': 1, '4': 1, '5': 0})

    def forbid_invalid_ratings(self):
        with self.assertRaisesRegexp(
                ValueError, 'Rating of 0 is not acceptable.'):
            rating_services.assign_rating(self.USER_ID_1, self.EXP_ID, 0)

        with self.assertRaisesRegexp(
                ValueError, 'Rating of 7 is not acceptable.'):
            rating_services.assign_rating(self.USER_ID_1, self.EXP_ID, 7)

        with self.assertRaisesRegexp(
                ValueError, 'Rating of aaa is not acceptable.'):
            rating_services.assign_rating(self.USER_ID_1, self.EXP_ID, 'aaa')

    def forbid_invalid_exploration_ids(self):
        with self.assertRaisesRegexp(
                Exception, 'Invalid exploration id invalid_id'):
            rating_services.assign_rating(self.USER_ID_1, 'invalid_id', '3')
