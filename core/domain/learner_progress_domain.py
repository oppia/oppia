# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for learner progress."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils


class LearnerProgress(python_utils.OBJECT):
    """Domain object for the progress of the learner."""

    def __init__(
            self, incomplete_exp_summaries,
            incomplete_collection_summaries,
            partially_learnt_topic_summaries, completed_exp_summaries,
            completed_collection_summaries, completed_story_summaries,
            learnt_topic_summaries, exploration_playlist,
            collection_playlist, completed_to_incomplete_collection_titles,
            completed_to_incomplete_story_titles,
            learnt_to_partially_learnt_topic_titles):
        """Constructs a LearnerProgress domain object.

        Args:
            incomplete_exp_summaries: list(ExplorationSummary). The summaries
                of the explorations partially completed by the learner.
            incomplete_collection_summaries: list(CollectionSummary). The
                summaries of the collections partially completed by the
                learner.
            partially_learnt_topic_summaries: list(TopicSummary). The
                summaries of the topics partially learnt by the
                learner.
            completed_exp_summaries: list(ExplorationSummary). The summaries of
                the explorations partially completed by the learner.
            completed_collection_summaries: list(CollectionSummary). The
                summaries of the collections partially completed by the learner.
            completed_story_summaries: list(StorySummary). The
                summaries of the stories completed by the learner.
            learnt_topic_summaries: list(TopicSummary). The
                summaries of the topics learnt by the learner.
            exploration_playlist: list(ExplorationSummary). The summaries of the
                explorations in the learner playlist.
            collection_playlist: list(CollectionSummary). The summaries of the
                collections in the learner playlist.
            completed_to_incomplete_collection_titles: list(CollectionSummary).
                The summaries corresponding to those collections which have
                been moved to the in progress section on account of new
                explorations being added to them.
            completed_to_incomplete_story_titles: list(StorySummary).
                The summaries corresponding to those stories which have
                been moved to the in progress section on account of new
                nodes being added to them.
            learnt_to_partially_learnt_topic_titles: list(StorySummary).
                The summaries corresponding to those topics which have
                been moved to the in progress section on account of new
                stories being added to them.
        """
        self.incomplete_exp_summaries = incomplete_exp_summaries
        self.incomplete_collection_summaries = incomplete_collection_summaries
        self.partially_learnt_topic_summaries = partially_learnt_topic_summaries
        self.completed_exp_summaries = completed_exp_summaries
        self.completed_collection_summaries = completed_collection_summaries
        self.completed_story_summaries = completed_story_summaries
        self.learnt_topic_summaries = learnt_topic_summaries
        self.exploration_playlist_summaries = exploration_playlist
        self.collection_playlist_summaries = collection_playlist
        self.completed_to_incomplete_collections = (
            completed_to_incomplete_collection_titles)
        self.completed_to_incomplete_stories = (
            completed_to_incomplete_story_titles)
        self.learnt_to_partially_learnt_topics = (
            learnt_to_partially_learnt_topic_titles)


class ActivityIdsInLearnerDashboard(python_utils.OBJECT):
    """Domain object for ids of the activities completed, currently being
    completed or in the playlist of the user.
    """

    def __init__(
            self, completed_exploration_ids, completed_collection_ids,
            completed_story_ids, learnt_topic_ids,
            incomplete_exploration_ids, incomplete_collection_ids,
            partially_learnt_topic_ids,
            exploration_playlist_ids, collection_playlist_ids):
        """Constructs a ActivityIdsInLearnerDashboard domain object.

        Args:
            completed_exploration_ids: list(str). The ids of the explorations
                completed by the user.
            completed_collection_ids: list(str). The ids of the collections
                completed by the user.
            completed_story_ids: list(str). The ids of the stories
                completed by the user.
            learnt_topic_ids: list(str). The ids of the topics
                learnt by the user.
            incomplete_exploration_ids: list(str). The ids of the explorations
                currently in progress.
            incomplete_collection_ids: list(str). The ids of the collections
                currently in progress.
            partially_learnt_topic_ids: list(str). The ids of the topics
                partially learnt.
            exploration_playlist_ids: list(str). The ids of the explorations
                in the playlist of the user.
            collection_playlist_ids: list(str). The ids of the collections
                in the playlist of the user.
        """
        self.completed_exploration_ids = completed_exploration_ids
        self.completed_collection_ids = completed_collection_ids
        self.completed_story_ids = completed_story_ids
        self.learnt_topic_ids = learnt_topic_ids
        self.incomplete_exploration_ids = incomplete_exploration_ids
        self.incomplete_collection_ids = incomplete_collection_ids
        self.partially_learnt_topic_ids = partially_learnt_topic_ids
        self.exploration_playlist_ids = exploration_playlist_ids
        self.collection_playlist_ids = collection_playlist_ids

    def to_dict(self):
        """Return dictionary representation of ActivityIdsInLearnerDashboard.

        Returns:
            dict. The keys of the dict are:
                'completed_exploration_ids': list(str). The ids of the
                    explorations that are completed.
                'completed_collection_ids': list(str). The ids of the
                    collections that are completed.
                'completed_story_ids': list(str). The ids of the
                    stories that are completed.
                'learnt_topic_ids': list(str). The ids of the
                    topics that are learnt.
                'incomplete_exploration_ids': list(str). The ids of the
                    explorations that are incomplete.
                'incomplete_collection_ids': list(str). The ids of the
                    collections that are incomplete.
                'partially_learnt_topic_ids': list(str). The ids of the
                    topics that are partially learnt.
                'exploration_playlist_ids': list(str). The ids of the
                    explorations that are in the playlist
                'collection_playlist_ids': list(str). The ids of the
                    collections that are in the playlist.
        """

        return {
            'completed_exploration_ids': self.completed_exploration_ids,
            'completed_collection_ids': self.completed_collection_ids,
            'completed_story_ids': self.completed_story_ids,
            'learnt_topic_ids': self.learnt_topic_ids,
            'incomplete_exploration_ids': self.incomplete_exploration_ids,
            'incomplete_collection_ids': self.incomplete_collection_ids,
            'partially_learnt_topic_ids': self.partially_learnt_topic_ids,
            'exploration_playlist_ids': self.exploration_playlist_ids,
            'collection_playlist_ids': self.collection_playlist_ids
        }
