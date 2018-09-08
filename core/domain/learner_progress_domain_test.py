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

"""Testing Domain objects for learner progress."""

from core.domain import learner_progress_domain
from core.tests import test_utils

exploration_ids = ['exp_id1', 'exp_id2', 'exp_id3']
collection_ids = ['collection_id1', 'collection_id2', 'collection_id3']


class LearnerProgressDomainUnitTests(test_utils.GenericTestBase):
    """Test the LearnerProgress domain object."""

    def test_init_learner_progress(self):
        learner_progress = learner_progress_domain.LearnerProgress(
            exploration_ids[0], collection_ids[0],
            exploration_ids[1], collection_ids[1],
            exploration_ids[2], collection_ids[2])
        self.assertIsNotNone(learner_progress)


class ActivityIdsInLearnerDashboardDomainTests(LearnerProgressDomainUnitTests):
    """Test the ActivityIdsInLearnerDashboard domain object."""

    def setUp(self):
        super(ActivityIdsInLearnerDashboardDomainTests, self).setUp()
        self.learner_values = [
            exploration_ids[0], collection_ids[0],
            exploration_ids[1], collection_ids[1],
            exploration_ids[2], collection_ids[2]]
        self.learner = learner_progress_domain.ActivityIdsInLearnerDashboard(
            self.learner_values[0], self.learner_values[1],
            self.learner_values[2], self.learner_values[3],
            self.learner_values[4], self.learner_values[5])

    def test_to_dict(self):
        learner_dict = self.learner.to_dict()
        expected_activity_ids_dict = {
            'completed_exploration_ids': self.learner_values[0],
            'completed_collection_ids': self.learner_values[1],
            'incomplete_exploration_ids': self.learner_values[2],
            'incomplete_collection_ids': self.learner_values[3],
            'exploration_playlist_ids': self.learner_values[4],
            'collection_playlist_ids': self.learner_values[5]}
        self.assertEqual(expected_activity_ids_dict, learner_dict)
