# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Jobs that are related to opportunity models.."""

from __future__ import absolute_import
from __future__ import annotations
from __future__ import unicode_literals

from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.platform import models
from jobs import base_jobs
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

from typing import List, cast # isort:skip

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import exp_models


(exp_models, opportunity_models, 
topic_models, story_models,) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.opportunity,
        models.NAMES.topic, models.NAMES.story]))


class ExplorationOpportunitySummaryModelRegenerationJob(base_jobs.JobBase):
    """Job that regenerates ExplorationOpportunitySummaryModel."""

    @staticmethod
    def _regenerate_opportunities_related_to_topic(topic, stories_dict, exploration_dict):
        try:
            story_ids = topic.get_canonical_story_ids()
            stories = [stories_dict.get(id, None) for id in story_ids]
            exp_ids = []
            non_existing_story_ids = []

            for index, story in enumerate(stories):
                if story is None:
                    non_existing_story_ids.append(story_ids[index])
                else:
                    exp_ids += story.story_contents.get_all_linked_exp_ids()
            
            exp_ids_to_exp = {
                eid: exploration_dict[eid] for eid in exp_ids 
                if exploration_dict.get(eid) is not None
            }
            non_existing_exp_ids = set(exp_ids) - set(exp_ids_to_exp.keys())

            if len(non_existing_exp_ids) > 0 or len(non_existing_story_ids) > 0:
                raise Exception(
                    'Failed to regenerate opportunities for topic id: %s, '
                    'missing_exp_with_ids: %s, missing_story_with_ids: %s' % (
                        topic.id, list(non_existing_exp_ids), non_existing_story_ids))
            
            exploration_opportunity_summary_list = []
            for story in stories:
                for exp_id in story.story_contents.get_all_linked_exp_ids():
                    exploration_opportunity_summary_list.append(
                        opportunity_services._create_exploration_opportunity_summary(
                            topic, story, exp_ids_to_exp[exp_id]))
            
            exploration_opportunity_summary_model_list = []
            for opportunity_summary in exploration_opportunity_summary_list:
                model = opportunity_models.ExplorationOpportunitySummaryModel(
                    id=opportunity_summary.id,
                    topic_id=opportunity_summary.topic_id,
                    topic_name=opportunity_summary.topic_name,
                    story_id=opportunity_summary.story_id,
                    story_title=opportunity_summary.story_title,
                    chapter_title=opportunity_summary.chapter_title,
                    content_count=opportunity_summary.content_count,
                    incomplete_translation_language_codes=(
                        opportunity_summary.incomplete_translation_language_codes),
                    translation_counts=opportunity_summary.translation_counts,
                    language_codes_needing_voice_artists=(
                        opportunity_summary.language_codes_needing_voice_artists),
                    language_codes_with_assigned_voice_artists=(
                        opportunity_summary.language_codes_with_assigned_voice_artists)
                )
                model.update_timestamps()
                exploration_opportunity_summary_model_list.append(model)

            return {
                    'status': 'SUCCESS',
                    'job_result': job_run_result.JobRunResult(stdout='SUCCESS'),
                    'models': exploration_opportunity_summary_model_list
                }
        except Exception as e:
            return {
                    'status': 'FAILURE',
                    'job_result': job_run_result.JobRunResult(stderr='FAILURE: %s' % e),
                    'models': []
                }
        

    def run(self) -> beam.PCollection:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        generating ExplorationOpportunitySummaryModel.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            generating ExplorationOpportunitySummaryModel.
        """
        # pre start hook
        exp_oppurtunity_models = (
            opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                        include_deleted=False))
        (
            self.pipeline 
            | beam.Create([model.key for model in exp_oppurtunity_models])
            | 'Delete all models' >> ndb_io.DeleteModels()
        )

        topics = (
            self.pipeline
            | 'Get all non-deleted topic models' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    topic_models.TopicModel.get_all(include_deleted=False)))
            | 'Get topic from model' >> beam.Map(
                topic_fetchers.get_topic_from_model)
        )

        story_ids_to_story = (
            self.pipeline
            | 'Get all non-deleted story models' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    story_models.StoryModel.get_all(include_deleted=False)))
            | 'Get story from model' >> beam.Map(
                story_fetchers.get_story_from_model)
            | 'Combine stories and ids' >> beam.Map(lambda story: (story.id, story))
        )

        exp_ids_to_exp = (
            self.pipeline
            | 'Get all non-deleted exp models' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    exp_models.ExplorationModel.get_all(include_deleted=False)))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Combine exploration and ids' >> beam.Map(lambda exp: (exp.id, exp))
        )


        stories_dict = beam.pvalue.AsDict(story_ids_to_story)
        exploration_dict = beam.pvalue.AsDict(exp_ids_to_exp)

        output = (
            topics
            | beam.Map(
                self._regenerate_opportunities_related_to_topic, stories_dict=stories_dict, exploration_dict=exploration_dict)
        )

        (
            output 
            | 'Filter the results with SUCCESS status' >> beam.Filter(
                lambda result: result['status'] == 'SUCCESS')
            | 'Fetch the models to be put' >> beam.FlatMap(lambda result: result['models'])
            | ndb_io.PutModels()
        )

        return (
            output
            | 'Fetch the job results' >> beam.Map(lambda result: result['job_result'])
        )

