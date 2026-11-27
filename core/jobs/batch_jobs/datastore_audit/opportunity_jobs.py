# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Validation jobs for opportunity models."""

from __future__ import annotations

from core import utils
from core.domain import opportunity_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.io import ndb_io
from core.jobs.types import (
    base_validation_errors,
    job_run_result,
    model_property,
    opportunity_validation_errors,
)
from core.platform import models

import apache_beam as beam
from typing import Callable, Dict, Iterable, Iterator, List, Tuple, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        base_models,
        opportunity_models,
        question_models,
        skill_models,
    )

(base_models, opportunity_models, question_models, skill_models) = (
    models.Registry.import_models(
        [
            models.Names.BASE_MODEL,
            models.Names.OPPORTUNITY,
            models.Names.QUESTION,
            models.Names.SKILL,
        ]
    )
)


class GroupedQuestionLinksDict(TypedDict):
    """Dictionary representing QuestionSkillLinkModels and QuestionModels joined
    by question ID.
    """

    links: Iterable[question_models.QuestionSkillLinkModel]
    questions: Iterable[question_models.QuestionModel]


class GroupedSkillOpportunityDict(TypedDict):
    """Dictionary representing SkillOpportunityModels, SkillModels, and linked
    question IDs joined by skill ID.
    """

    opportunities: Iterable[opportunity_models.SkillOpportunityModel]
    skills: Iterable[skill_models.SkillModel]
    question_ids: Iterable[str]


class SkillOpportunityModelValidationJob(base_validation_jobs.BaseValidationJob):
    """Validates SkillOpportunityModel instances."""

    def run(self) -> beam.PCollection[Dict[str, List[str]]]:
        """Runs the validation job using Dataflow-safe ndb_io.GetModels and
        CoGroupByKey joins for cross-model checks.

        Returns:
            PCollection. A PCollection of dictionaries, where keys are error
            types and values are lists of truncated model stderr strings.
        """
        skill_opportunity_models_pcoll = (
            self.pipeline
            | 'Get all non-deleted SkillOpportunityModels'
            >> ndb_io.GetModels(
                opportunity_models.SkillOpportunityModel.get_all(
                    include_deleted=False
                )
            )
        )
        skill_models_pcoll = (
            self.pipeline
            | 'Get all non-deleted SkillModels'
            >> ndb_io.GetModels(
                skill_models.SkillModel.get_all(include_deleted=False)
            )
        )
        question_models_pcoll = (
            self.pipeline
            | 'Get all non-deleted QuestionModels'
            >> ndb_io.GetModels(
                question_models.QuestionModel.get_all(include_deleted=False)
            )
        )
        question_skill_link_models_pcoll = (
            self.pipeline
            | 'Get all non-deleted QuestionSkillLinkModels'
            >> ndb_io.GetModels(
                question_models.QuestionSkillLinkModel.get_all(
                    include_deleted=False
                )
            )
        )

        single_model_validation_fns = [
            self.validate_created_on_less_than_last_updated,
            self.get_validate_domain_object_fn(),
        ] + self.get_validation_fns()
        single_model_errors = (
            skill_opportunity_models_pcoll
            | 'Apply single-model validations'
            >> beam.ParDo(
                base_validation_jobs.ApplyAllValidations(
                    single_model_validation_fns
                )
            )
        )

        links_by_question_id = (
            question_skill_link_models_pcoll
            | 'Key QuestionSkillLinkModels by question_id'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda link_model: link_model.question_id
            )
        )
        questions_by_id = (
            question_models_pcoll
            | 'Key QuestionModels by id'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda question_model: question_model.id
            )
        )
        valid_linked_question_ids_by_skill_id = (
            {
                'links': links_by_question_id,
                'questions': questions_by_id,
            }
            | 'Join links with questions by question_id' >> beam.CoGroupByKey()
            | 'Extract valid (skill_id, question_id) pairs'
            >> beam.FlatMap(self._extract_valid_skill_question_pairs)
        )

        opportunities_by_id = (
            skill_opportunity_models_pcoll
            | 'Key SkillOpportunityModels by id'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda opp_model: opp_model.id
            )
        )
        skills_by_id = (
            skill_models_pcoll
            | 'Key SkillModels by id'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda skill_model: skill_model.id
            )
        )
        cross_model_errors = (
            {
                'opportunities': opportunities_by_id,
                'skills': skills_by_id,
                'question_ids': valid_linked_question_ids_by_skill_id,
            }
            | 'Join SkillOpportunityModels by skill_id' >> beam.CoGroupByKey()
            | 'Validate cross-model invariants'
            >> beam.FlatMap(self._validate_cross_model_relations)
        )

        return (
            (single_model_errors, cross_model_errors)
            | 'Flatten validation errors' >> beam.Flatten()
            | 'Group Errors by Type'
            >> beam.GroupBy(lambda error: type(error).__name__)
            | 'Extract Error Messages'
            >> beam.Map(
                lambda group: {
                    group[0]: sorted([error.stderr for error in group[1]])[
                        : base_validation_jobs.ERROR_TRUNCATION_LIMIT
                    ]
                }
            )
        )

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        # Cross-model checks require CoGroupByKey across PCollections in run(),
        # so no additional single-model validation functions are needed here.
        return []

    @staticmethod
    def _extract_valid_skill_question_pairs(
        element: Tuple[str, GroupedQuestionLinksDict],
    ) -> Iterator[Tuple[str, str]]:
        """Yields (skill_id, question_id) pairs for links pointing to existing
        non-deleted QuestionModels.
        """
        question_id, grouped = element
        if not list(grouped['questions']):
            return
        for link in grouped['links']:
            yield (link.skill_id, question_id)

    @staticmethod
    def _validate_cross_model_relations(
        element: Tuple[str, GroupedSkillOpportunityDict],
    ) -> Iterator[job_run_result.JobRunResult]:
        """Validates SkillModel relationship, skill_description consistency,
        and linked question count consistency for joined SkillOpportunityModels.
        """
        _, grouped = element
        opportunities = list(grouped['opportunities'])
        if not opportunities:
            return

        skills = list(grouped['skills'])
        expected_question_count = len(set(grouped['question_ids']))

        for model in opportunities:
            if not skills:
                yield base_validation_errors.ModelRelationshipError(
                    id_property=model_property.ModelProperty(
                        opportunity_models.SkillOpportunityModel,
                        opportunity_models.SkillOpportunityModel.id,
                    ),
                    model=model,
                    target_kind='SkillModel',
                    target_id=model.id,
                )
            elif skills[0].description != model.skill_description:
                yield (
                    opportunity_validation_errors.InconsistentSkillDescriptionError(
                        model, skills[0].description
                    )
                )

            if model.question_count != expected_question_count:
                yield (
                    opportunity_validation_errors.InconsistentQuestionCountError(
                        model, expected_question_count
                    )
                )

    def validate_domain_object(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelDomainObjectValidateError]:
        """Validates the domain object represented by a SkillOpportunityModel.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelDomainObjectValidateError. The domain validation error.
        """
        assert isinstance(model, opportunity_models.SkillOpportunityModel)

        try:
            skill_opportunity = opportunity_domain.SkillOpportunity(
                model.id, model.skill_description, model.question_count
            )
            skill_opportunity.validate(strict=True)
        except utils.ValidationError as error:
            yield base_validation_errors.ModelDomainObjectValidateError(
                model, str(error)
            )

    def get_validate_domain_object_fn(
        self,
    ) -> Callable[
        [base_models.BaseModel], Iterator[job_run_result.JobRunResult]
    ]:
        return self.validate_domain_object
