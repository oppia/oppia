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

from core.domain import certificate_assessment_services
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


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an ignore
# here.
class GetAvailableCertificateAssessmentOfferingModels(beam.PTransform):  # type: ignore[misc]
    """Filters the offering stream down to Available models only."""

    def expand(
        self,
        offerings: beam.PCollection[
            certificate_assessment_offering_models.CertificateAssessmentOfferingModel
        ],
    ) -> beam.PCollection[
        certificate_assessment_offering_models.CertificateAssessmentOfferingModel
    ]:
        """Returns only offerings with Available async status."""
        return offerings | 'Keep only Available offerings' >> beam.Filter(
            lambda model: model.async_status == ASYNC_STATUS_AVAILABLE
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an ignore
# here.
class GetTopicIdToInfoPairs(beam.PTransform):  # type: ignore[misc]
    """Maps topic models to the info pairs used by validation."""

    def expand(
        self,
        topic_models_pcoll: beam.PCollection[topic_models.TopicModel],
    ) -> beam.PCollection[Tuple[str, TopicSkillInfoDict]]:
        """Maps topics to their validation side-input pair."""
        return (
            topic_models_pcoll
            | 'Map TopicModels to topic id info pairs'
            >> beam.Map(self._to_pair)  # pylint: disable=line-too-long
        )

    def _to_pair(
        self, topic_model: topic_models.TopicModel
    ) -> Tuple[str, TopicSkillInfoDict]:
        """Builds the tuple needed by the validation pipeline."""
        return (
            topic_model.id,
            {
                'name': topic_model.name,
                'skill_ids': certificate_assessment_services._get_topic_skill_ids(  # pylint: disable=protected-access
                    topic_model
                ),
            },
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an ignore
# here.
class GetSkillIdToQuestionInfoPairs(beam.PTransform):  # type: ignore[misc]
    """Maps question-skill link models to the info pairs used by validation."""

    def expand(
        self,
        question_skill_link_models: beam.PCollection[
            question_models.QuestionSkillLinkModel
        ],
    ) -> beam.PCollection[Tuple[str, SkillQuestionInfoDict]]:
        """Maps question-skill link models to side-input pairs."""
        return (
            question_skill_link_models
            | 'Extract skill id question info pairs'
            >> beam.Map(self._to_pair)  # pylint: disable=line-too-long
        )

    def _to_pair(
        self,
        question_skill_link_model: question_models.QuestionSkillLinkModel,
    ) -> Tuple[str, SkillQuestionInfoDict]:
        """Builds the tuple needed by the validation pipeline."""
        return (
            question_skill_link_model.skill_id,
            {
                'question_id': question_skill_link_model.question_id,
                'skill_difficulty': question_skill_link_model.skill_difficulty,
            },
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class ValidateCertificateAssessmentOfferingModels(beam.DoFn):  # type: ignore[misc]
    """Validates one offering using preloaded side inputs."""

    def process(
        self,
        certificate_assessment_offering_model: (
            certificate_assessment_offering_models.CertificateAssessmentOfferingModel
        ),
        topic_id_to_info: Dict[str, TopicSkillInfoDict],
        skill_id_to_question_info: Dict[str, List[SkillQuestionInfoDict]],
    ) -> List[ModelAndValidationResultTuple]:
        validation_result = self._get_validation_result(
            certificate_assessment_offering_model,
            topic_id_to_info,
            skill_id_to_question_info,
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
        return [(certificate_assessment_offering_model, validation_result)]

    def _get_validation_result(
        self,
        certificate_assessment_offering_model: (
            certificate_assessment_offering_models.CertificateAssessmentOfferingModel
        ),
        topic_id_to_info: Dict[str, TopicSkillInfoDict],
        skill_id_to_question_info: Dict[str, List[SkillQuestionInfoDict]],
    ) -> ValidationResultDict:
        """Computes the preloaded-map validation result for one offering."""
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
        return certificate_assessment_services.validate_certificate_assessment_offering_against_preloaded_maps(
            topic_ids=list(certificate_assessment_offering_model.topic_ids),
            total_questions=certificate_assessment_offering_model.total_questions,
            topic_name_to_question_ids_map=topic_name_to_question_ids_map,
            topic_id_to_question_ids_by_difficulty=(
                topic_id_to_question_ids_by_difficulty
            ),
            topic_id_to_name=topic_id_to_name,
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an ignore
# here.
class FormatValidationErrorResults(beam.PTransform):  # type: ignore[misc]
    """Formats invalid offerings into job run results."""

    def expand(
        self,
        invalid_offering_models: beam.PCollection[
            ModelAndValidationResultTuple
        ],
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Formats invalid offering models into stdout job results."""
        return (
            invalid_offering_models
            | 'Format validation errors to JobRunResult'
            >> beam.Map(self._to_result)  # pylint: disable=line-too-long
        )

    def _to_result(
        self, model_and_result: ModelAndValidationResultTuple
    ) -> job_run_result.JobRunResult:
        """Converts a validation failure into a job run result."""
        return job_run_result.JobRunResult.as_stdout(
            'CertificateAssessmentOfferingModel with ID: %s failed '
            'validation: %s'
            % (
                model_and_result[0].id,
                model_and_result[1]['validation_message'],
            )
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an ignore
# here.
class BlockInvalidCertificateAssessmentOfferingModels(beam.PTransform):  # type: ignore[misc]
    """Marks invalid offerings as blocked and optionally writes them back."""

    def __init__(self, write_to_datastore: bool) -> None:
        """Initializes the transform.

        Args:
            write_to_datastore: bool. Whether to persist the blocked models.
        """
        super().__init__()
        self._write_to_datastore = write_to_datastore

    def expand(
        self,
        invalid_offering_models: beam.PCollection[
            ModelAndValidationResultTuple
        ],
    ) -> beam.PCollection[
        certificate_assessment_offering_models.CertificateAssessmentOfferingModel
    ]:
        """Blocks invalid offerings and optionally writes them to storage."""
        blocked_offering_models = (
            invalid_offering_models
            | 'Mark invalid CertificateAssessmentOfferingModels as Blocked'
            >> beam.Map(
                certificate_assessment_services.mark_certificate_assessment_offering_model_as_blocked
            )
        )
        if self._write_to_datastore:
            _ = (
                blocked_offering_models
                | 'Write updated CertificateAssessmentOfferingModels to datastore'
                >> ndb_io.PutModels()
            )  # pylint: disable=line-too-long
        return blocked_offering_models


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an ignore
# here.
class FormatBlockedOfferingResults(beam.PTransform):  # type: ignore[misc]
    """Formats blocked offerings into counts and ID results."""

    def __init__(self, write_to_datastore: bool) -> None:
        """Initializes the transform.

        Args:
            write_to_datastore: bool. Whether the job is writing updates.
        """
        super().__init__()
        self._write_to_datastore = write_to_datastore

    def expand(
        self,
        blocked_offering_models: beam.PCollection[
            certificate_assessment_offering_models.CertificateAssessmentOfferingModel
        ],
    ) -> Tuple[
        beam.PCollection[job_run_result.JobRunResult],
        beam.PCollection[job_run_result.JobRunResult],
    ]:
        """Formats count and per-model results for the blocked offerings."""
        count_label = (
            'Count updated CertificateAssessmentOfferingModels'
            if self._write_to_datastore
            else 'Count dry-run CertificateAssessmentOfferingModels'
        )
        count_run_result = (
            blocked_offering_models
            | count_label >> beam.combiners.Count.Globally()
            | 'Format count to JobRunResult'
            >> beam.Map(
                lambda count: job_run_result.JobRunResult.as_stdout(
                    'Number of CertificateAssessmentOfferingModels '
                    'would be updated to Blocked: %d.' % count
                )
            )
        )
        id_label = (
            'Adds updated CertificateAssessmentOfferingModel IDs to job run result'
            if self._write_to_datastore
            else 'Adds dry-run CertificateAssessmentOfferingModel IDs to job run result'
        )
        updated_model_ids_result = (
            blocked_offering_models | id_label >> beam.Map(self._to_result)
        )
        return count_run_result, updated_model_ids_result

    def _to_result(
        self,
        model: certificate_assessment_offering_models.CertificateAssessmentOfferingModel,
    ) -> job_run_result.JobRunResult:
        """Formats a blocked offering ID result for the current mode."""
        if self._write_to_datastore:
            return job_run_result.JobRunResult.as_stdout(
                'Updated state of CertificateAssessmentOfferingModel with ID: %s.'
                % model.id
            )
        return job_run_result.JobRunResult.as_stdout(
            'CertificateAssessmentOfferingModel with ID: %s would be updated to Blocked.'
            % model.id
        )


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

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Runs the BlockInvalidCertificateAssessmentOfferingsJob.

        Returns:
            JobRunResult. Contains the total number of offerings marked as
            'Blocked', along with the IDs and validation error messages of
            those offerings.
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
            | GetAvailableCertificateAssessmentOfferingModels()
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

        topic_id_to_info = all_topic_models | GetTopicIdToInfoPairs()

        skill_id_to_question_info = (
            all_question_skill_link_models | GetSkillIdToQuestionInfoPairs()
        )

        validated_offering_models = (
            available_offering_models
            | 'Run question pool validation for each Available offering'
            >> beam.ParDo(
                ValidateCertificateAssessmentOfferingModels(),
                beam.pvalue.AsDict(topic_id_to_info),
                beam.pvalue.AsMultiMap(skill_id_to_question_info),
            )
        )

        invalid_offering_models = (
            validated_offering_models
            | 'Filter offerings whose question pool failed validation'
            >> beam.Filter(  # pylint: disable=line-too-long
                lambda model_and_result: not model_and_result[1]['is_valid']
            )
        )

        validation_error_results = (
            invalid_offering_models | FormatValidationErrorResults()
        )

        updated_offering_models = (
            invalid_offering_models
            | BlockInvalidCertificateAssessmentOfferingModels(  # pylint: disable=line-too-long
                self.DATASTORE_UPDATES_ALLOWED
            )
        )
        count_run_result, updated_model_ids_result = (
            updated_offering_models
            | FormatBlockedOfferingResults(self.DATASTORE_UPDATES_ALLOWED)
        )

        return (
            count_run_result,
            updated_model_ids_result,
            validation_error_results,
        ) | beam.Flatten()


class BlockInvalidCertificateAssessmentOfferingsAuditJob(
    BlockInvalidCertificateAssessmentOfferingsJob
):
    """Audit job to check which 'Available' CertificateAssessmentOfferingModel
    entries would be blocked due to failing question pool validation, and
    log their IDs without writing any changes."""

    DATASTORE_UPDATES_ALLOWED = False
