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

"""Jobs to execute and get result of a query."""
import ast

from core import jobs
from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.platform import models

(user_models, exp_models, topic_models) = (
    models.Registry.import_models(
        [models.NAMES.user, models.NAMES.exploration, models.NAMES.topic]))


class ExplorationOpportunitySummaryModelRegenerationJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job for regenerating ExplorationOpportunitySummaryModel."""
    @classmethod
    def _pre_start_hook(cls, job_id):
        opportunity_services.delete_all_exploration_opportunity_summary_models()

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(topic_model):
        if topic_model.deleted:
            return

        topic = topic_fetchers.get_topic_from_model(topic_model)
        story_ids = topic.get_canonical_story_ids()
        stories = story_fetchers.get_story_by_ids(story_ids)
        exp_ids = []
        for story in stories:
            exp_ids += story.story_contents.get_all_linked_exp_ids()
        exp_ids_to_exp = exp_fetchers.get_multiple_explorations_by_id(exp_ids)

        exploration_opportunity_summary_list = []
        for story in stories:
            for exp_id in story.story_contents.get_all_linked_exp_ids():
                exploration_opportunity_summary = (
                    opportunity_services
                    .create_exploration_opportunity_summary_model(
                        topic, story, exp_ids_to_exp[exp_id]))
                exploration_opportunity_summary_list.append(
                    exploration_opportunity_summary)

        opportunity_services.save_multi_exploration_opportunity_summary(
            exploration_opportunity_summary_list)
        yield ('SUCCESS', len(exploration_opportunity_summary_list))

    @staticmethod
    def reduce(key, values):
        counts = [ast.literal_eval(value) for value in values]
        yield (key, sum(counts))
