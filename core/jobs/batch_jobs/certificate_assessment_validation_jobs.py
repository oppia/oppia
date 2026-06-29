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

from core.domain import certificate_assessment_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Dict, List, Tuple, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        certificate_assessment_models,
        datastore_services,
        question_models,
        topic_models,
    )

(
    certificate_assessment_models,
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

assert set(
    [ASYNC_STATUS_AVAILABLE, ASYNC_STATUS_NOT_READY, ASYNC_STATUS_BLOCKED]
) == set(certificate_assessment_domain.VALID_ASYNC_STATUSES), (
    'The async_status constants in this job have drifted from '
    'certificate_assessment_domain.VALID_ASYNC_STATUSES.'
)


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


ModelAndValidationResultTuple = Tuple[
    certificate_assessment_models.CertificateAssessmentOfferingModel,
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


def _get_difficulty_counts(total_questions: int) -> Dict[str, int]:
    """Distributes questions over medium, easy and hard in a repeating cycle.
    Identical to certificate_assessment_services._get_difficulty_counts.

    Args:
        total_questions: int. The number of questions to distribute.

    Returns:
        dict(str, int). Counts of questions per difficulty.
    """
    counts = {'easy': 0, 'medium': 0, 'hard': 0}
    cycle = ['medium', 'easy', 'hard']
    for index in range(total_questions):
        counts[cycle[index % len(cycle)]] += 1
    return counts


def _get_topic_validation_result(
    available_questions: int, required_questions: int
) -> Dict[str, Dict[str, int]]:
    """Returns the required/available breakdown for one topic. Identical to
    certificate_assessment_services._get_topic_validation_result.

    Args:
        available_questions: int. Number of available questions.
        required_questions: int. Number of required questions.

    Returns:
        dict. Required/available breakdown by difficulty.
    """
    required = _get_difficulty_counts(required_questions)
    available = _get_difficulty_counts(available_questions)
    return {
        'easy': {
            'required': required['easy'],
            'available': available['easy'],
        },
        'medium': {
            'required': required['medium'],
            'available': available['medium'],
        },
        'hard': {
            'required': required['hard'],
            'available': available['hard'],
        },
    }


def _validate_offering_against_maps(
    topic_ids: List[str],
    total_questions: int,
    topic_id_to_info: Dict[str, TopicSkillInfoDict],
    skill_id_to_question_ids: Dict[str, List[str]],
) -> ValidationResultDict:
    """Pure-Python reimplementation of
    certificate_assessment_services.validate_certificate_assessment_offering,
    driven entirely by pre-built in-memory maps instead of NDB fetchers.

    Args:
        topic_ids: list(str). The selected topic IDs for the certificate.
        total_questions: int. The total number of questions requested.
        topic_id_to_info: dict(str, TopicSkillInfoDict). Maps topic_id to
            its name and skill_ids, built from TopicModel.
        skill_id_to_question_ids: dict(str, list(str)). Maps skill_id to the
            list of question_ids linked to it, built from
            QuestionSkillLinkModel. A skill_id with no entry (e.g. the skill
            was deleted) is treated as having zero linked questions, which
            matches the original service's behavior of silently skipping
            skills that no longer exist.

    Returns:
        ValidationResultDict. Contains is_valid, validation_errors and
        validation_message.
    """
    if not topic_ids:
        return {
            'is_valid': False,
            'validation_errors': {},
            'validation_message': (
                'topic_ids must contain at least one topic.'
            ),
        }
    if total_questions < 1:
        return {
            'is_valid': False,
            'validation_errors': {},
            'validation_message': (
                'total_questions must be a positive integer.'
            ),
        }

    missing_topic_ids = sorted(
        topic_id for topic_id in topic_ids if topic_id not in topic_id_to_info
    )
    if missing_topic_ids:
        return {
            'is_valid': False,
            'validation_errors': {},
            'validation_message': (
                'Topic(s) %s do not exist.' % ', '.join(missing_topic_ids)
            ),
        }

    topic_id_to_question_ids: Dict[str, List[str]] = {}
    for topic_id in topic_ids:
        question_ids = set()
        for skill_id in topic_id_to_info[topic_id]['skill_ids']:
            question_ids.update(skill_id_to_question_ids.get(skill_id, []))
        topic_id_to_question_ids[topic_id] = sorted(question_ids)

    base_questions_per_topic = total_questions // len(topic_ids)
    remainder = total_questions % len(topic_ids)
    validation_errors: Dict[str, Dict[str, Dict[str, int]]] = {}
    message_parts: List[str] = []
    is_valid = True

    for index, topic_id in enumerate(topic_ids):
        required_questions = base_questions_per_topic + (
            1 if index < remainder else 0
        )
        available_questions = len(topic_id_to_question_ids[topic_id])
        validation_errors[topic_id] = _get_topic_validation_result(
            available_questions, required_questions
        )
        if available_questions < required_questions:
            is_valid = False
            topic_name = topic_id_to_info[topic_id]['name']
            message_parts.append(
                '%s needs %d unique questions but only %d are available.'
                % (topic_name, required_questions, available_questions)
            )

    validation_message = (
        'Certificate assessment is valid.'
        if is_valid
        else ' '.join(message_parts)
    )
    return {
        'is_valid': is_valid,
        'validation_errors': validation_errors,
        'validation_message': validation_message,
    }


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
    ) -> Tuple[str, str]:
        """Extracts the (skill_id, question_id) pair from a question-skill
        link model.

        Args:
            question_skill_link_model: QuestionSkillLinkModel. The link
                model to read from.

        Returns:
            tuple(str, str). The skill_id paired with the question_id.
        """
        return (
            question_skill_link_model.skill_id,
            question_skill_link_model.question_id,
        )

    def get_validation_result_for_model(
        self,
        certificate_assessment_offering_model: (
            certificate_assessment_models.CertificateAssessmentOfferingModel
        ),
        topic_id_to_info: Dict[str, TopicSkillInfoDict],
        skill_id_to_question_ids: Dict[str, List[str]],
    ) -> ModelAndValidationResultTuple:
        """Runs the question pool validation for a single offering using
        only the pre-built in-memory side-input maps (no NDB calls).

        Args:
            certificate_assessment_offering_model: CertificateAssessmentOfferingModel.
                The offering model to validate. Caller must ensure this is
                only invoked for offerings with async_status 'Available'.
            topic_id_to_info: dict(str, TopicSkillInfoDict). Side input
                mapping topic_id to its name/skill_ids.
            skill_id_to_question_ids: dict(str, list(str)). Side input
                mapping skill_id to its linked question_ids.

        Returns:
            tuple(CertificateAssessmentOfferingModel, ValidationResultDict).
            The model paired with its validation result.
        """
        validation_result = _validate_offering_against_maps(
            topic_ids=list(certificate_assessment_offering_model.topic_ids),
            total_questions=(
                certificate_assessment_offering_model.total_questions
            ),
            topic_id_to_info=topic_id_to_info,
            skill_id_to_question_ids=skill_id_to_question_ids,
        )
        return (certificate_assessment_offering_model, validation_result)

    def mark_model_as_blocked(
        self,
        model_and_validation_result: ModelAndValidationResultTuple,
    ) -> certificate_assessment_models.CertificateAssessmentOfferingModel:
        """Marks the given offering's async_status as 'Blocked'.

        Args:
            model_and_validation_result: tuple(CertificateAssessmentOfferingModel, ValidationResultDict).
                The model to block, paired with the validation result that
                triggered the block.

        Returns:
            CertificateAssessmentOfferingModel. The updated model with its
            async_status marked as 'Blocked'.
        """
        certificate_assessment_offering_model, validation_result = (
            model_and_validation_result
        )
        certificate_assessment_offering_model.async_status = (
            ASYNC_STATUS_BLOCKED
        )
        logging.error(
            'Blocking CertificateAssessmentOfferingModel with id %s since '
            'its question pool failed validation: %s'
            % (
                certificate_assessment_offering_model.id,
                validation_result['validation_message'],
            )
        )
        return certificate_assessment_offering_model

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
                certificate_assessment_models.CertificateAssessmentOfferingModel.get_all()
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

        skill_id_to_question_ids = (
            all_question_skill_link_models
            | 'Extract skill id question id pairs'
            >> beam.Map(self.get_skill_id_question_id_pair)
            | 'Group question ids by skill id' >> beam.GroupByKey()
            | 'Convert grouped question ids to lists'
            >> beam.MapTuple(
                lambda skill_id, question_ids: (
                    skill_id,
                    list(question_ids),
                )
            )
        )

        validated_offering_models = (
            available_offering_models
            | 'Run question pool validation for each Available offering'
            >> beam.Map(
                self.get_validation_result_for_model,
                topic_id_to_info=beam.pvalue.AsDict(topic_id_to_info),
                skill_id_to_question_ids=beam.pvalue.AsDict(
                    skill_id_to_question_ids
                ),
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
            >> beam.Map(self.mark_model_as_blocked)
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
