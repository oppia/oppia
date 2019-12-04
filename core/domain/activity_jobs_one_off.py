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

"""One-off jobs for activities."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import search_services
from core.platform import models

(
    collection_models, config_models,
    exp_models, question_models,
    skill_models, story_models,
    topic_models) = (
        models.Registry.import_models([
            models.NAMES.collection, models.NAMES.config,
            models.NAMES.exploration, models.NAMES.question,
            models.NAMES.skill, models.NAMES.story,
            models.NAMES.topic]))


class IndexAllActivitiesJobManager(jobs.BaseMapReduceOneOffJobManager):
    """Job that indexes all explorations and collections and compute their
    ranks.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel,
                collection_models.CollectionSummaryModel]

    @staticmethod
    def map(item):
        if not item.deleted:
            if isinstance(item, exp_models.ExpSummaryModel):
                search_services.index_exploration_summaries([item])
            else:
                search_services.index_collection_summaries([item])

    @staticmethod
    def reduce(key, values):
        pass
