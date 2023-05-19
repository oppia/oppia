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

"""Jobs that manage Exploration Opportunity models."""

from __future__ import annotations

import itertools
import logging

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import opportunity_domain
from core.domain import opportunity_services
from core.domain import skill_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

import result

from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import question_models
    from mypy_imports import skill_models
    from mypy_imports import story_models
    from mypy_imports import topic_models

(
    exp_models,
    opportunity_models,
    question_models,
    skill_models,
    story_models,
    topic_models
) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.OPPORTUNITY,
    models.Names.QUESTION,
    models.Names.SKILL,
    models.Names.STORY,
    models.Names.TOPIC
])

datastore_services = models.Registry.import_datastore_services()


class DeleteSkillOpportunityModelJob(base_jobs.JobBase):
    """Job that deletes SkillOpportunityModels."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        deleting SkillOpportunityModel.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            deleting SkillOpportunityModel.
        """
        skill_opportunity_model = (
            self.pipeline
            | 'Get all non-deleted skill models' >> ndb_io.GetModels(
                opportunity_models.SkillOpportunityModel.get_all(
                    include_deleted=False))
        )

        unused_delete_result = (
            skill_opportunity_model
            | beam.Map(lambda model: model.key)
            | 'Delete all models' >> ndb_io.DeleteModels()
        )

        return (
            skill_opportunity_model
            | 'Create job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )


class GenerateSkillOpportunityModelJob(base_jobs.JobBase):
    """Job for regenerating SkillOpportunityModel.

    NOTE: The DeleteSkillOpportunityModelJob must be run before this
    job.
    """

    @staticmethod
    def _count_unique_question_ids(
        question_skill_link_models: List[
            question_models.QuestionSkillLinkModel
        ]
    ) -> int:
        """Counts the number of unique question ids.

        Args:
            question_skill_link_models: list(QuestionSkillLinkModel).
                List of QuestionSkillLinkModels.

        Returns:
            int. The number of unique question ids.
        """

        return len({link.question_id for link in question_skill_link_models})

    @staticmethod
    def _create_skill_opportunity_model(
        skill: skill_models.SkillModel,
        question_skill_links: List[question_models.QuestionSkillLinkModel]
    ) -> result.Result[
        opportunity_models.SkillOpportunityModel, Exception
    ]:
        """Transforms a skill object and a list of QuestionSkillLink objects
        into a skill opportunity model.

        Args:
            skill: skill_models.SkillModel. The skill to create the opportunity
                for.
            question_skill_links: list(question_models.QuestionSkillLinkModel).
                The list of QuestionSkillLinkModel for the given skill.

        Returns:
            Result[opportunity_models.SkillOpportunityModel, Exception].
            Result object that contains SkillOpportunityModel when the operation
            is successful and Exception when an exception occurs.
        """
        try:
            skill_opportunity = opportunity_domain.SkillOpportunity(
                skill_id=skill.id,
                skill_description=skill.description,
                question_count=(
                    GenerateSkillOpportunityModelJob._count_unique_question_ids(
                        question_skill_links))
            )
            skill_opportunity.validate()
            with datastore_services.get_ndb_context():
                opportunity_model = opportunity_models.SkillOpportunityModel(
                    id=skill_opportunity.id,
                    skill_description=skill_opportunity.skill_description,
                    question_count=skill_opportunity.question_count
                )
                opportunity_model.update_timestamps()
                return result.Ok(opportunity_model)
        except Exception as e:
            return result.Err(e)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        generating SkillOpportunityModel.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            generating SkillOpportunityModel.
        """
        question_skill_link_models = (
            self.pipeline
            | 'Get all non-deleted QuestionSkillLinkModels' >> (
                ndb_io.GetModels(
                    question_models.QuestionSkillLinkModel.get_all(
                        include_deleted=False))
                )
            | 'Group QuestionSkillLinkModels by skill ID' >>
                beam.GroupBy(lambda n: n.skill_id)
        )

        skills = (
            self.pipeline
            | 'Get all non-deleted SkillModels' >> (
                ndb_io.GetModels(
                    skill_models.SkillModel.get_all(include_deleted=False)))
            | 'Get skill object from model' >> beam.Map(
                skill_fetchers.get_skill_from_model)
            | 'Group skill objects by skill ID' >> beam.GroupBy(lambda m: m.id)
        )

        skills_with_question_counts = (
            {
                'skill': skills,
                'question_skill_links': question_skill_link_models
            }
            | 'Merge by skill ID' >> beam.CoGroupByKey()
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove skill IDs' >> beam.Values() # pylint: disable=no-value-for-parameter
            # We are using itertools.chain.from_iterable to flatten
            # question_skill_links from a 2D list into a 1D list.
            | 'Flatten skill and question_skill_links' >> beam.Map(
                lambda skill_and_question_skill_links_object: {
                    'skill': list(
                        skill_and_question_skill_links_object['skill'][0]
                    )[0],
                    'question_skill_links': list(
                        itertools.chain.from_iterable(
                            skill_and_question_skill_links_object[
                                'question_skill_links'
                            ]
                        )
                    )
                }
            )
        )

        opportunities_results = (
            skills_with_question_counts
            | beam.Map(
                lambda skills_with_question_counts_object:
                    self._create_skill_opportunity_model(
                        skills_with_question_counts_object['skill'],
                        skills_with_question_counts_object[
                            'question_skill_links'
                        ]
            ))
        )

        unused_put_result = (
            opportunities_results
            | 'Filter the results with OK status' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Fetch the models to be put' >> beam.Map(
                lambda result: result.unwrap())
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            opportunities_results
            | 'Transform Results to JobRunResults' >> (
                job_result_transforms.ResultsToJobRunResults())
        )


class DeleteExplorationOpportunitySummariesJob(base_jobs.JobBase):
    """Job that deletes ExplorationOpportunitySummaryModels."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        deleting ExplorationOpportunitySummaryModel.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            deleting ExplorationOpportunitySummaryModel.
        """
        exp_opportunity_summary_model = (
            self.pipeline
            | 'Get all non-deleted opportunity models' >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all(
                    include_deleted=False))
        )

        unused_delete_result = (
            exp_opportunity_summary_model
            | beam.Map(lambda model: model.key)
            | 'Delete all models' >> ndb_io.DeleteModels()
        )

        return (
            exp_opportunity_summary_model
            | 'Create job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )


class GenerateExplorationOpportunitySummariesJob(base_jobs.JobBase):
    """Job that regenerates ExplorationOpportunitySummaryModel.

    NOTE: The DeleteExplorationOpportunitySummariesJob must be run before this
    job.
    """

    @staticmethod
    def _generate_opportunities_related_to_topic(
        topic: topic_domain.Topic,
        stories_dict: Dict[str, story_domain.Story],
        exps_dict: Dict[str, exp_domain.Exploration]
    ) -> result.Result[
        List[opportunity_models.ExplorationOpportunitySummaryModel], Exception
    ]:
        """Generate opportunities related to a topic.

        Args:
            topic: Topic. Topic for which to generate the opportunities.
            stories_dict: dict(str, Story). All stories in the datastore, keyed
                by their ID.
            exps_dict: dict(str, Exploration). All explorations in
                the datastore, keyed by their ID.

        Returns:
            dict(str, *). Metadata about the operation. Keys are:
                status: str. Whether the job succeeded or failed.
                job_result: JobRunResult. A detailed report of the status,
                    including exception details if a failure occurred.
                models: list(ExplorationOpportunitySummaryModel). The models
                    generated by the operation.
        """
        story_ids = topic.get_canonical_story_ids()
        existing_story_ids = (
            set(stories_dict.keys()).intersection(story_ids))
        exp_ids: List[str] = list(itertools.chain.from_iterable(
            stories_dict[story_id].story_contents.get_all_linked_exp_ids()
            for story_id in existing_story_ids))
        existing_exp_ids = set(exps_dict.keys()).intersection(exp_ids)

        missing_story_ids = set(story_ids).difference(existing_story_ids)
        missing_exp_ids = set(exp_ids).difference(existing_exp_ids)
        if len(missing_exp_ids) > 0 or len(missing_story_ids) > 0:
            return result.Err(
                'Failed to regenerate opportunities for topic id: %s, '
                'missing_exp_with_ids: %s, missing_story_with_ids: %s' % (
                    topic.id,
                    list(missing_exp_ids),
                    list(missing_story_ids)))

        exploration_opportunity_summary_list = []
        stories = [
            stories_dict[story_id] for story_id in existing_story_ids
        ]

        exploration_opportunity_summary_model_list = []
        with datastore_services.get_ndb_context():
            for story in stories:
                for exp_id in story.story_contents.get_all_linked_exp_ids():
                    try:
                        exploration_opportunity_summary_list.append(
                            opportunity_services.create_exp_opportunity_summary(
                                topic, story, exps_dict[exp_id]))
                    except Exception as e:
                        logging.exception(e)
                        return result.Err((exp_id, e))

            for opportunity in exploration_opportunity_summary_list:
                model = (
                    opportunity_models.ExplorationOpportunitySummaryModel(
                        id=opportunity.id,
                        topic_id=opportunity.topic_id,
                        topic_name=opportunity.topic_name,
                        story_id=opportunity.story_id,
                        story_title=opportunity.story_title,
                        chapter_title=opportunity.chapter_title,
                        content_count=opportunity.content_count,
                        incomplete_translation_language_codes=(
                            opportunity
                            .incomplete_translation_language_codes
                        ),
                        translation_counts=opportunity.translation_counts,
                        language_codes_needing_voice_artists=(
                            opportunity
                            .language_codes_needing_voice_artists
                        ),
                        language_codes_with_assigned_voice_artists=(
                            opportunity
                            .language_codes_with_assigned_voice_artists
                        )
                    )
                )
                model.update_timestamps()
                exploration_opportunity_summary_model_list.append(model)

        return result.Ok(exploration_opportunity_summary_model_list)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        generating ExplorationOpportunitySummaryModel.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            generating ExplorationOpportunitySummaryModel.
        """

        topics = (
            self.pipeline
            | 'Get all non-deleted topic models' >> (
                ndb_io.GetModels(
                    topic_models.TopicModel.get_all(include_deleted=False)))
            | 'Get topic from model' >> beam.Map(
                topic_fetchers.get_topic_from_model)
        )

        story_ids_to_story = (
            self.pipeline
            | 'Get all non-deleted story models' >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False))
            | 'Get story from model' >> beam.Map(
                story_fetchers.get_story_from_model)
            | 'Combine stories and ids' >> beam.Map(
                lambda story: (story.id, story))
        )

        exp_ids_to_exp = (
            self.pipeline
            | 'Get all non-deleted exp models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Combine exploration and ids' >> beam.Map(
                lambda exp: (exp.id, exp))
        )

        stories_dict = beam.pvalue.AsDict(story_ids_to_story)
        exps_dict = beam.pvalue.AsDict(exp_ids_to_exp)

        opportunities_results = (
            topics
            | beam.Map(
                self._generate_opportunities_related_to_topic,
                stories_dict=stories_dict,
                exps_dict=exps_dict)
        )

        unused_put_result = (
            opportunities_results
            | 'Filter the results with SUCCESS status' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Fetch the models to be put' >> beam.FlatMap(
                lambda result: result.unwrap())
            | 'Add ID as a key' >> beam.WithKeys(lambda model: model.id)  # pylint: disable=no-value-for-parameter
            | 'Allow only one item per key' >> (
                beam.combiners.Sample.FixedSizePerKey(1))
            | 'Remove the IDs' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Flatten the list of lists of models' >> beam.FlatMap(lambda x: x)
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            opportunities_results
            | 'Count the output' >> (
                job_result_transforms.ResultsToJobRunResults())
        )
