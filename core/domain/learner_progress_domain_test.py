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

from __future__ import annotations

from core.domain import learner_progress_domain
from core.tests import test_utils


class LearnerProgressInTopicsAndStoriesUnitTests(test_utils.GenericTestBase):
    """Tests the learner progress in topics and stories domain object."""

    def test_initialization(self) -> None:
        """Tests init method."""
        user_learner_progress = (
            learner_progress_domain.LearnerProgressInTopicsAndStories(
                [], [], [], [], [], [], [], []))

        self.assertEqual(
            user_learner_progress.partially_learnt_topic_summaries, [])
        self.assertEqual(
            user_learner_progress.completed_story_summaries, [])
        self.assertEqual(
            user_learner_progress.learnt_topic_summaries, [])
        self.assertEqual(
            user_learner_progress.topics_to_learn_summaries, [])
        self.assertEqual(
            user_learner_progress.all_topic_summaries, [])
        self.assertEqual(
            user_learner_progress.untracked_topic_summaries, [])


class LearnerProgressInCollectionsUnitTests(test_utils.GenericTestBase):
    """Tests the learner progress in collections domain object."""

    def test_initialization(self) -> None:
        """Tests init method."""
        user_learner_progress = (
            learner_progress_domain.LearnerProgressInCollections(
                [], [], [], []))

        self.assertEqual(
            user_learner_progress.incomplete_collection_summaries, [])
        self.assertEqual(
            user_learner_progress.completed_collection_summaries, [])
        self.assertEqual(
            user_learner_progress.collection_playlist_summaries, [])


class LearnerProgressInExplorationsUnitTests(test_utils.GenericTestBase):
    """Tests the learner progress in explorations domain object."""

    def test_initialization(self) -> None:
        """Tests init method."""
        user_learner_progress = (
            learner_progress_domain.LearnerProgressInExplorations(
                [], [], []))

        self.assertEqual(
            user_learner_progress.incomplete_exp_summaries, [])
        self.assertEqual(user_learner_progress.completed_exp_summaries, [])
        self.assertEqual(
            user_learner_progress.exploration_playlist_summaries, [])


class ActivityIdsInLearnerDashboardUnitTests(test_utils.GenericTestBase):
    """Tests the activity ids in learner dashboard domain object."""

    def test_to_dict(self) -> None:
        incomplete_exp_ids = ['0']
        incomplete_coll_ids = ['1']
        partially_learnt_topic_ids = ['3']
        completed_exp_ids = ['4']
        completed_coll_ids = ['5']
        completed_story_ids = ['6']
        learnt_topic_ids = ['7']
        topic_ids_to_learn = ['8']
        all_topic_ids = ['9']
        untracked_topic_ids = ['10']
        exploration_playlist_ids = ['11']
        collection_playlist_ids = ['12']

        observed_activity_ids_in_learner_dashboard = (
            learner_progress_domain.ActivityIdsInLearnerDashboard(
                completed_exp_ids,
                completed_coll_ids,
                completed_story_ids,
                learnt_topic_ids,
                incomplete_exp_ids,
                incomplete_coll_ids,
                partially_learnt_topic_ids,
                topic_ids_to_learn,
                all_topic_ids,
                untracked_topic_ids,
                exploration_playlist_ids,
                collection_playlist_ids))
        to_dict_result = observed_activity_ids_in_learner_dashboard.to_dict()

        self.assertEqual(
            to_dict_result['completed_exploration_ids'], completed_exp_ids)
        self.assertEqual(
            to_dict_result['completed_collection_ids'], completed_coll_ids)
        self.assertEqual(
            to_dict_result['completed_story_ids'], completed_story_ids)
        self.assertEqual(
            to_dict_result['learnt_topic_ids'], learnt_topic_ids)
        self.assertEqual(
            to_dict_result['incomplete_exploration_ids'], incomplete_exp_ids)
        self.assertEqual(
            to_dict_result['incomplete_collection_ids'], incomplete_coll_ids)
        self.assertEqual(
            to_dict_result['partially_learnt_topic_ids'],
            partially_learnt_topic_ids)
        self.assertEqual(
            to_dict_result['topic_ids_to_learn'], topic_ids_to_learn)
        self.assertEqual(
            to_dict_result['all_topic_ids'], all_topic_ids)
        self.assertEqual(
            to_dict_result['untracked_topic_ids'], untracked_topic_ids)
        self.assertEqual(
            to_dict_result['exploration_playlist_ids'],
            exploration_playlist_ids)
        self.assertEqual(
            to_dict_result['collection_playlist_ids'], collection_playlist_ids)
