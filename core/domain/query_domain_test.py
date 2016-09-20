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

"""Tests for query domain object."""

from core.domain import query_domain
from core.platform import models
from core.tests import test_utils

(job_models,) = models.Registry.import_models([models.NAMES.job])


class QueryParametersTests(test_utils.GenericTestBase):
    """Tests for QueryParameters domain object."""
    def setUp(self):
        super(QueryParametersTests, self).setUp()

    def test_to_dict(self):
        query_params = query_domain.QueryParameters(
            has_user_logged_in_since_n_days=10,
            created_less_than_n_exploration=3,
            created_more_than_n_exploration=1,
            edited_less_than_n_exploration=5, edited_more_than_n_exploration=2,
            created_or_edited_exploration_in_n_days=5)

        expected_params = {
            job_models.QUERY_PARAMETERS.has_user_logged_in_since_n_days: 10,
            (job_models.QUERY_PARAMETERS.
             created_or_edited_exploration_in_n_days): 5,
            job_models.QUERY_PARAMETERS.created_less_than_n_exploration: 3,
            job_models.QUERY_PARAMETERS.created_more_than_n_exploration: 1,
            job_models.QUERY_PARAMETERS.edited_more_than_n_exploration: 2,
            job_models.QUERY_PARAMETERS.edited_less_than_n_exploration: 5
        }

        self.assertDictEqual(query_params.to_dict(), expected_params)
