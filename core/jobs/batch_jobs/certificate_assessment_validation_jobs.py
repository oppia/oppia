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
"""Jobs used to validate CertificateAssessmentOfferingModel question pools
against the latest topic/skill data, and mark offerings as 'Blocked' when
their question pool no longer satisfies the certificate's requirements.

Only offerings whose async_status is 'Available' are checked. Offerings in
'Not_Ready' status are skipped entirely (their question pool isn't expected
to be complete yet), and offerings already 'Blocked' are left untouched.

This job does NOT use any domain fetchers/services (e.g. topic_fetchers,
skill_fetchers, question_services) because those issue raw NDB calls that
are unsafe to run inside a Beam worker function. Instead, every model this
job needs (CertificateAssessmentOfferingModel, TopicModel,
QuestionSkillLinkModel) is loaded through the Beam pipeline via
ndb_io.GetModels, and all of the topic -> skill -> question matching is
done as plain in-memory Python/Beam transforms.
"""

from __future__ import annotations

import logging

from core.domain import (
    certificate_assessment_domain,
    certificate_assessment_services,
)
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Tuple, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        certificate_assessment_offering_models,
        question_models,
        topic_models,
    )

(
    certificate_assessment_offering_models,
    question_models,
    topic_models,
) = models.Registry.import_models(
    [
        models.Names.CERTIFICATE_ASSESSMENT_OFFERING,
        models.Names.QUESTION,
        models.Names.TOPIC,
    ]
)
datastore_services = models.Registry.import_datastore_services()

# These must always match certificate_assessment_domain.VALID_ASYNC_STATUSES.
ASYNC_STATUS_AVAILABLE = 'Available'
ASYNC_STATUS_NOT_READY = 'Not_Ready'
ASYNC_STATUS_BLOCKED = 'Blocked'


class TopicSkillInfoDict(TypedDict):
    """In-memory representation of a topic's name and skill ids, built
    purely from TopicModel fields (no fetchers)."""

    name: str
    skill_ids: List[str]


class ValidationResultDict(TypedDict):
    """Dict representation of certificate offering validation results."""

    is_valid: bool
    validation_errors: Dict[str, Dict[str, Dict[str, int]]]
    validation_message: str


class SkillQuestionInfoDict(TypedDict):
    """In-memory representation of a linked question's id and difficulty."""

    question_id: str
    skill_difficulty: float


ModelAndValidationResultTuple = Tuple[
    certificate_assessment_offering_models.CertificateAssessmentOfferingModel,
    ValidationResultDict,
]


def _get_topic_skill_ids(
    topic_model: topic_models.TopicModel,
) -> List[str]:
    """Reimplements Topic.get_all_skill_ids() using only TopicModel's raw
    fields (uncategorized_skill_ids + each subtopic dict's skill_ids), with
    no fetcher/domain-object construction.

    Args:
        topic_model: TopicModel. The topic model to read skill ids from.

    Returns:
        list(str). All skill ids belonging to the topic.
    """
    skill_ids = list(topic_model.uncategorized_skill_ids)
    for subtopic_dict in topic_model.subtopics:
        skill_ids.extend(subtopic_dict.get('skill_ids', []))
    return skill_ids


class BlockInvalidCertificateAssessmentOfferingsJob(base_jobs.JobBase):
    """One-off/cron job to validate each 'Available' CertificateAssessment-
    OfferingModel's question pool against the latest topic/skill data, and
    mark its async_status as 'Blocked' if the pool is no longer valid.

    Offerings in 'Not_Ready' status are skipped entirely (not validated,
    not logged) since their question pool is not yet expected to be
    complete. Offerings already 'Blocked' are also skipped.

    All topic/skill/question data is loaded through the Beam pipeline via
    ndb_io.GetModels and joined as side inputs -- no domain fetchers or
    NDB calls happen inside any per-element worker function.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def get_topic_id_to_info_pair(
        self, topic_model: topic_models.TopicModel
    ) -> Tuple[str, TopicSkillInfoDict]:
        """Builds the (topic_id, {name, skill_ids}) pair for a topic model.

        Args:
            topic_model: TopicModel. The topic model to read from.

        Returns:
            tuple(str, TopicSkillInfoDict). The topic_id paired with its
            name and skill_ids.
        """
        return (
            topic_model.id,
            {
                'name': topic_model.name,
                'skill_ids': _get_topic_skill_ids(topic_model),
            },
        )

    def get_skill_id_question_id_pair(
        self,
        question_skill_link_model: question_models.QuestionSkillLinkModel,
    ) -> Tuple[str, SkillQuestionInfoDict]:
        """Extracts the (skill_id, question info) pair from a question-skill
        link model.

        Args:
            question_skill_link_model: QuestionSkillLinkModel. The link
                model to read from.

        Returns:
            tuple(str, SkillQuestionInfoDict). The skill_id paired with the
            linked question metadata.
        """
        return (
            question_skill_link_model.skill_id,
            {
                'question_id': question_skill_link_model.question_id,
                'skill_difficulty': question_skill_link_model.skill_difficulty,
            },
        )

    def get_validation_result_for_model(
        self,
        certificate_assessment_offering_model: (
            certificate_assessment_offering_models.CertificateAssessmentOfferingModel
        ),
        topic_id_to_info: Dict[str, TopicSkillInfoDict],
        skill_id_to_question_info: Dict[str, List[SkillQuestionInfoDict]],
    ) -> ModelAndValidationResultTuple:
        """Runs the question pool validation for a single offering using
        only the pre-built in-memory side-input maps (no NDB calls).

        Args:
            certificate_assessment_offering_model: CertificateAssessmentOfferingModel.
                The offering model to validate. Caller must ensure this is
                only invoked for offerings with async_status 'Available'.
            topic_id_to_info: dict(str, TopicSkillInfoDict). Side input
                mapping topic_id to its name/skill_ids.
            skill_id_to_question_info: dict(str, list(SkillQuestionInfoDict)).
                Side input mapping skill_id to its linked question info.

        Returns:
            tuple(CertificateAssessmentOfferingModel, ValidationResultDict).
            The model paired with its validation result.
        """
        topic_name_to_question_ids_map: Dict[str, List[str]] = {}
        topic_id_to_question_ids_by_difficulty: Dict[
            str, Dict[str, set[str]]
        ] = {}
        topic_id_to_name: Dict[str, str] = {}
        for topic_id in certificate_assessment_offering_model.topic_ids:
            question_ids = set()
            question_ids_by_difficulty: Dict[str, set[str]] = {
                'easy': set(),
                'medium': set(),
                'hard': set(),
            }
            topic_info = topic_id_to_info.get(topic_id)
            if topic_info is None:
                # The topic referenced by this offering no longer exists
                # (e.g. it was deleted). Treat it as a topic with zero
                # skills/questions so the validator below naturally marks
                # the offering as invalid.
                topic_id_to_name[topic_id] = topic_id
            else:
                topic_id_to_name[topic_id] = topic_info['name']
                for skill_id in topic_info['skill_ids']:
                    for skill_question_info in skill_id_to_question_info[
                        skill_id
                    ]:
                        question_ids.add(skill_question_info['question_id'])
                        difficulty_label = certificate_assessment_services._get_difficulty_label(  # pylint: disable=protected-access
                            skill_question_info['skill_difficulty']
                        )
                        if difficulty_label is None:
                            continue
                        question_ids_by_difficulty[difficulty_label].add(
                            skill_question_info['question_id']
                        )
            topic_name_to_question_ids_map[topic_id] = sorted(question_ids)
            topic_id_to_question_ids_by_difficulty[topic_id] = (
                question_ids_by_difficulty
            )

        validation_result = certificate_assessment_services.validate_certificate_assessment_offering_against_preloaded_maps(
            topic_ids=list(certificate_assessment_offering_model.topic_ids),
            total_questions=(
                certificate_assessment_offering_model.total_questions
            ),
            topic_name_to_question_ids_map=topic_name_to_question_ids_map,
            topic_id_to_question_ids_by_difficulty=(
                topic_id_to_question_ids_by_difficulty
            ),
            topic_id_to_name=topic_id_to_name,
        )
        if not validation_result['is_valid']:
            logging.warning(
                'Available CertificateAssessmentOfferingModel with id %s '
                'failed validation before blocking: %s'
                % (
                    certificate_assessment_offering_model.id,
                    validation_result['validation_message'],
                )
            )
        return (certificate_assessment_offering_model, validation_result)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the BlockInvalidCertificateAssessmentOfferingsJob.

        Returns:
            JobRunResult. Contains the total number of offerings marked as
            'Blocked', along with the IDs of those offerings.
        """
        all_offering_models = (
            self.pipeline
            | 'Get CertificateAssessmentOfferingModels from the datastore'
            >> ndb_io.GetModels(
                certificate_assessment_offering_models.CertificateAssessmentOfferingModel.get_all()
            )
        )

        available_offering_models = (
            all_offering_models
            | 'Keep only Available offerings'
            >> beam.Filter(
                lambda model: model.async_status == ASYNC_STATUS_AVAILABLE
            )
        )

        all_topic_models = (
            self.pipeline
            | 'Get TopicModels from the datastore'
            >> ndb_io.GetModels(topic_models.TopicModel.get_all())
        )

        all_question_skill_link_models = (
            self.pipeline
            | 'Get QuestionSkillLinkModels from the datastore'
            >> ndb_io.GetModels(
                question_models.QuestionSkillLinkModel.get_all()
            )
        )

        topic_id_to_info = (
            all_topic_models
            | 'Map TopicModels to topic id info pairs'
            >> beam.Map(self.get_topic_id_to_info_pair)
        )

        skill_id_to_question_info = (
            all_question_skill_link_models
            | 'Extract skill id question info pairs'
            >> beam.Map(self.get_skill_id_question_id_pair)
        )

        validated_offering_models = (
            available_offering_models
            | 'Run question pool validation for each Available offering'
            >> beam.Map(
                self.get_validation_result_for_model,
                beam.pvalue.AsDict(topic_id_to_info),
                beam.pvalue.AsMultiMap(skill_id_to_question_info),
            )
        )

        invalid_offering_models = (
            validated_offering_models
            | 'Filter offerings whose question pool failed validation'
            >> beam.Filter(
                lambda model_and_result: not model_and_result[1]['is_valid']
            )
        )

        updated_offering_models = (
            invalid_offering_models
            | 'Mark invalid CertificateAssessmentOfferingModels as Blocked'
            >> beam.Map(
                certificate_assessment_services.mark_certificate_assessment_offering_model_as_blocked
            )
        )

        count_run_result = (
            updated_offering_models
            | 'Count updated CertificateAssessmentOfferingModels'
            >> beam.combiners.Count.Globally()
            | 'Format count to JobRunResult'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels updated '
                    'to Blocked: %d.' % count
                )
            )
        )

        updated_model_ids_result = (
            updated_offering_models
            | 'Adds updated CertificateAssessmentOfferingModel IDs to job run result'
            >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Updated state of CertificateAssessmentOfferingModel '
                    'with ID: %s.' % model.id
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            _ = (
                updated_offering_models
                | 'Write updated CertificateAssessmentOfferingModels to datastore'
                >> ndb_io.PutModels()
            )

        return (
            count_run_result,
            updated_model_ids_result,
        ) | beam.Flatten()


class BlockInvalidCertificateAssessmentOfferingsAuditJob(
    BlockInvalidCertificateAssessmentOfferingsJob
):
    """Audit job to check which 'Available' CertificateAssessmentOfferingModel
    entries would be blocked due to failing question pool validation, and
    log their IDs without writing any changes."""

    DATASTORE_UPDATES_ALLOWED = False
