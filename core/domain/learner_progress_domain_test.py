# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for learner progress domain objects."""

from core.domain import learner_progress_domain
from core.tests import test_utils
import feconf

class LearnerProgressUnitTests(test_utils.GenericTestBase):
    """Tests the learner progress domain object."""

    def setUp(self):
        super(LearnerProgressUnitTests, self).setUp()



class ActivityIdsInLearnerDashboardUnitTests(test_utils.GenericTestBase):
    """Tests the activity ids in learner dashboard domain object."""

    def setUp(self):
        super(ActivityIdsInLearnerDashboardUnitTests, self).setUp()

    def test_to_dict(self):
        expected_activity_ids_in_learner_dashboard_dict = {
            'completed_exploration_ids': ["0"],
            'completed_collection_ids': ["0"],
            'incomplete_exploration_ids': ["0"],
            'incomplete_collection_ids': ["0"],
            'exploration_playlist_ids': ["0"],
            'collection_playlist_ids': ["0"]
        }
        observed_activity_ids_in_learner_dashboard = learner_progress_domain.ActivityIdsInLearnerDashboard(
            expected_activity_ids_in_learner_dashboard_dict['completed_exploration_ids'],
            expected_activity_ids_in_learner_dashboard_dict['completed_collection_ids'],
            expected_activity_ids_in_learner_dashboard_dict['incomplete_exploration_ids'],
            expected_activity_ids_in_learner_dashboard_dict['incomplete_collection_ids'],
            expected_activity_ids_in_learner_dashboard_dict['exploration_playlist_ids'],
            expected_activity_ids_in_learner_dashboard_dict['collection_playlist_ids'])
        self.assertDictEqual(
            expected_activity_ids_in_learner_dashboard_dict, observed_activity_ids_in_learner_dashboard.to_dict())
