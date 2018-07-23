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
import feconf


class LearnerProgressDomainUnitTests(test_utils.GenericTestBase):
    """Test the Learner Progress domain."""

    def setUp(self):
        super(LearnerProgressDomainUnitTests, self).setUp()
        self.exploration_keys = []
        self.collection_keys = []
        # Preparing Learner Progress exploration & collection ids.
        # In case there are less DEMO dictionary members, than needed.
        # Will need to reuse values to initiate Learner Progress.
        self.num_of_demo_explorations = len(feconf.DEMO_EXPLORATIONS)
        self.num_of_demo_collections = len(feconf.DEMO_COLLECTIONS)
        exploration_keys_iter = feconf.DEMO_EXPLORATIONS.iterkeys()
        collection_keys_iter = feconf.DEMO_COLLECTIONS.iterkeys()
        for _ in xrange(0, self.num_of_demo_explorations):
            self.exploration_keys.append(next(exploration_keys_iter))
        for _ in xrange(0, self.num_of_demo_collections):
            self.collection_keys.append(next(collection_keys_iter))

    def test_init_learner_progress(self):
        learner_progress = learner_progress_domain.LearnerProgress(
            feconf.DEMO_EXPLORATIONS[self.exploration_keys[0]],
            feconf.DEMO_COLLECTIONS[self.collection_keys[0]],
            feconf.DEMO_EXPLORATIONS[
                self.exploration_keys[1 % self.num_of_demo_explorations]],
            feconf.DEMO_COLLECTIONS[
                self.collection_keys[1 % self.num_of_demo_collections]],
            feconf.DEMO_EXPLORATIONS[
                self.exploration_keys[2 % self.num_of_demo_explorations]],
            feconf.DEMO_COLLECTIONS[
                self.collection_keys[2 % self.num_of_demo_collections]])
        self.assertIsNotNone(learner_progress)


class ActivityIdsInLearnerDashboardDomainTests(LearnerProgressDomainUnitTests):
    """Test the ActivityIdsInLearnerDashboard domain."""

    def setUp(self):
        super(ActivityIdsInLearnerDashboardDomainTests, self).setUp()
        self.learner_values = [
            feconf.DEMO_EXPLORATIONS[self.exploration_keys[0]],
            feconf.DEMO_COLLECTIONS[self.collection_keys[0]],
            feconf.DEMO_EXPLORATIONS[
                self.exploration_keys[1 % self.num_of_demo_explorations]],
            feconf.DEMO_COLLECTIONS[
                self.collection_keys[1 % self.num_of_demo_collections]],
            feconf.DEMO_EXPLORATIONS[
                self.exploration_keys[2 % self.num_of_demo_explorations]],
            feconf.DEMO_COLLECTIONS[
                self.collection_keys[2 % self.num_of_demo_collections]]]
        self.learner = learner_progress_domain.ActivityIdsInLearnerDashboard(
            self.learner_values[0], self.learner_values[1],
            self.learner_values[2], self.learner_values[3],
            self.learner_values[4], self.learner_values[5])

    def test_to_dict(self):
        learner_dict = self.learner.to_dict()
        learner_tester_dict = {
            'completed_exploration_ids': self.learner_values[0],
            'completed_collection_ids': self.learner_values[1],
            'incomplete_exploration_ids': self.learner_values[2],
            'incomplete_collection_ids': self.learner_values[3],
            'exploration_playlist_ids': self.learner_values[4],
            'collection_playlist_ids': self.learner_values[5]}
        self.assertEqual(learner_tester_dict, learner_dict)
