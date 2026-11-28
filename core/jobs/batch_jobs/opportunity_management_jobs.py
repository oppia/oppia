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

"""Jobs that manage Skill Opportunity models."""

from __future__ import annotations

import itertools

from core.domain import (
    opportunity_domain,
    skill_fetchers,
)
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        datastore_services,
        opportunity_models,
        question_models,
        skill_models,
    )

(
    opportunity_models,
    question_models,
    skill_models,
) = models.Registry.import_models(
    [
        models.Names.OPPORTUNITY,
        models.Names.QUESTION,
        models.Names.SKILL,
    ]
)

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
            | 'Get all non-deleted skill models'
            >> ndb_io.GetModels(
                opportunity_models.SkillOpportunityModel.get_all(
                    include_deleted=False
                )
            )
        )

        unused_delete_result = (
            skill_opportunity_model
            | beam.Map(lambda model: model.key)
            | 'Delete all models' >> ndb_io.DeleteModels()
        )

        return skill_opportunity_model | 'Create job run result' >> (
            job_result_transforms.CountObjectsToJobRunResult()
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
        ],
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
        question_skill_links: List[question_models.QuestionSkillLinkModel],
    ) -> result.Result[opportunity_models.SkillOpportunityModel, Exception]:
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
                        question_skill_links
                    )
                ),
            )
            skill_opportunity.validate()
            with datastore_services.get_ndb_context():
                opportunity_model = opportunity_models.SkillOpportunityModel(
                    id=skill_opportunity.id,
                    skill_description=skill_opportunity.skill_description,
                    question_count=skill_opportunity.question_count,
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
            | 'Get all non-deleted QuestionSkillLinkModels'
            >> (
                ndb_io.GetModels(
                    question_models.QuestionSkillLinkModel.get_all(
                        include_deleted=False
                    )
                )
            )
            | 'Group QuestionSkillLinkModels by skill ID'
            >> beam.GroupBy(lambda n: n.skill_id)
        )

        skills = (
            self.pipeline
            | 'Get all non-deleted SkillModels'
            >> (
                ndb_io.GetModels(
                    skill_models.SkillModel.get_all(include_deleted=False)
                )
            )
            | 'Get skill object from model'
            >> beam.Map(skill_fetchers.get_skill_from_model)
            | 'Group skill objects by skill ID' >> beam.GroupBy(lambda m: m.id)
        )

        skills_with_question_counts = (
            {
                'skill': skills,
                'question_skill_links': question_skill_link_models,
            }
            | 'Merge by skill ID' >> beam.CoGroupByKey()
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove skill IDs'
            >> beam.Values()  # pylint: disable=no-value-for-parameter
            # We are using itertools.chain.from_iterable to flatten
            # question_skill_links from a 2D list into a 1D list.
            | 'Flatten skill and question_skill_links'
            >> beam.Map(
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
                    ),
                }
            )
        )

        opportunities_results = skills_with_question_counts | beam.Map(
            lambda skills_with_question_counts_object: self._create_skill_opportunity_model(
                skills_with_question_counts_object['skill'],
                skills_with_question_counts_object['question_skill_links'],
            )
        )

        unused_put_result = (
            opportunities_results
            | 'Filter the results with OK status'
            >> beam.Filter(lambda result: result.is_ok())
            | 'Fetch the models to be put'
            >> beam.Map(lambda result: result.unwrap())
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return opportunities_results | 'Transform Results to JobRunResults' >> (
            job_result_transforms.ResultsToJobRunResults()
        )
