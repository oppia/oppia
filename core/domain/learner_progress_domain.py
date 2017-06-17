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

"""Domain objects for learner progress."""

class LearnerProgress(object):
    """Domain object for the progress of the learner."""

    def __init__(self, incomplete_exp_summaries,
                 incomplete_collection_summaries, completed_exp_summaries,
                 completed_collection_summaries):
        """Constructs a LearnerProgress domain object.

        Args:
            incomplete_exp_summaries: list(ExplorationSummary). The summaries
                of the explorations partially completed by the learner.
            incomplete_collection_summaries: list(CollectionSummary). The
                summaries of the explorations partially completed by the
                learner.
            completed_exp_summaries: list(ExplorationSummary). The summaries of
                the explorations partially completed by the learner.
            completed_collection_summaries: list(CollectionSummary). The
                summaries of the collections partially completed by the learner.
        """
        self.incomplete_exp_summaries = incomplete_exp_summaries
        self.incomplete_collection_summaries = incomplete_collection_summaries
        self.completed_exp_summaries = completed_exp_summaries
        self.completed_collection_summaries = completed_collection_summaries
