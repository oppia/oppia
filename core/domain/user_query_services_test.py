# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for user query services."""

from core.domain import user_query_services
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserQueryServicesTests(test_utils.GenericTestBase):
    def test_save_new_query_model(self):
        submitter_id = 'submitter'
        inactive_in_last_n_days = 10
        created_at_least_n_exps = 5
        has_not_logged_in_for_n_days = 30
        query_id = user_query_services.save_new_query_model(
            submitter_id, inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days)

        query_model = user_models.UserQueryModel.get(query_id)

        self.assertEqual(query_model.submitter_id, submitter_id)
        self.assertEqual(
            query_model.inactive_in_last_n_days, inactive_in_last_n_days)
        self.assertEqual(
            query_model.created_at_least_n_exps, created_at_least_n_exps)
        self.assertEqual(
            query_model.has_not_logged_in_for_n_days,
            has_not_logged_in_for_n_days)
        self.assertIsNone(query_model.created_fewer_than_n_exps)
        self.assertIsNone(query_model.edited_at_least_n_exps)
        self.assertIsNone(query_model.edited_fewer_than_n_exps)
