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

from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import user_services
from core.tests import test_utils

class SearchServicesUnitTests(test_utils.GenericTestBase):
    """Test the search services module."""
    EXP_ID = 'An_exploration_id'

    def setUp(self):
        super(SearchServicesUnitTests, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        user_services.create_new_user(self.editor_id, self.EDITOR_EMAIL)
        user_services.create_new_user(self.viewer_id, self.VIEWER_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.set_admins([self.ADMIN_USERNAME])
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)

    def test_get_search_rank(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        base_search_rank = 20

        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        rating_services.assign_rating_to_exploration(
            self.owner_id, self.EXP_ID, 5)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 10)

        rating_services.assign_rating_to_exploration(
            self.user_id_admin, self.EXP_ID, 2)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank + 8)

    def test_search_ranks_cannot_be_negative(self):
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)

        base_search_rank = 20

        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank)

        # A user can (down-)rate an exploration at most once.
        for i in xrange(50):
            rating_services.assign_rating_to_exploration(
                'user_id_1', self.EXP_ID, 1)
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(
            search_services.get_search_rank_from_exp_summary(exp_summary),
            base_search_rank - 5)

        for i in xrange(50):
            rating_services.assign_rating_to_exploration(
                'user_id_%s' % i, self.EXP_ID, 1)

        # The rank will be at least 0.
        exp_summary = exp_services.get_exploration_summary_by_id(self.EXP_ID)
        self.assertEqual(search_services.get_search_rank_from_exp_summary(
            exp_summary), 0)
