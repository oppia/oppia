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
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Services for certificate assessment offerings."""

from __future__ import annotations

from core.domain import certificate_assessment_domain
from core.storage.certificate_assessment import gae_models

from typing import List, cast


def _model_to_domain(
    certificate_assessment_offering_model: gae_models.CertificateAssessmentOfferingModel,
) -> certificate_assessment_domain.CertificateAssessmentOffering:
    """Converts a storage model to a domain object."""
    return certificate_assessment_domain.CertificateAssessmentOffering(
        certificate_id=certificate_assessment_offering_model.id,
        title=certificate_assessment_offering_model.title,
        description=certificate_assessment_offering_model.description,
        classroom_id=certificate_assessment_offering_model.classroom_id,
        topic_ids=list(certificate_assessment_offering_model.topic_ids),
        total_questions=certificate_assessment_offering_model.total_questions,
        time_limit_in_minutes=(
            certificate_assessment_offering_model.time_limit_in_minutes
        ),
        demonstrates=list(certificate_assessment_offering_model.demonstrates),
        async_status=certificate_assessment_offering_model.async_status,
        version=certificate_assessment_offering_model.version,
    )


def create_certificate_assessment_offering(
    title: str,
    description: str,
    classroom_id: str,
    topic_ids: list[str],
    total_questions: int,
    time_limit_in_minutes: int,
    demonstrates: list[str],
    async_status: str,
) -> certificate_assessment_domain.CertificateAssessmentOffering:
    """Creates and stores a certificate assessment offering."""
    # TODO(#24717-M1.14): Re-enable classroom and topic existence checks once the
    # frontend create flow sends real classroom/topic selections instead of
    # temporary hardcoded stub values.

    # Classroom = classroom_config_services.get_classroom_by_id(classroom_id)
    # if classroom is None:
    #     raise Exception('classroom_id must correspond to an existing classroom.')

    # For topic_id in topic_ids:
    #     topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
    #     if topic is None:
    #         raise Exception('topic_ids must refer to existing topics.')
    #     if topic_id not in classroom.get_topic_ids():
    #         raise Exception(
    #             'topic_ids must belong to the specified classroom.'
    #         )

    certificate_assessment_offering = (
        certificate_assessment_domain.CertificateAssessmentOffering(
            certificate_id='temporary_certificate_id',
            title=title,
            description=description,
            classroom_id=classroom_id,
            topic_ids=topic_ids,
            total_questions=total_questions,
            time_limit_in_minutes=time_limit_in_minutes,
            demonstrates=demonstrates,
            async_status=async_status,
            version=1,
        )
    )
    certificate_assessment_offering.validate()

    certificate_assessment_offering_model = (
        gae_models.CertificateAssessmentOfferingModel.create(
            title=title,
            description=description,
            classroom_id=classroom_id,
            topic_ids=topic_ids,
            total_questions=total_questions,
            time_limit_in_minutes=time_limit_in_minutes,
            demonstrates=demonstrates,
            async_status=async_status,
        )
    )
    certificate_assessment_offering = _model_to_domain(
        certificate_assessment_offering_model
    )
    return certificate_assessment_offering


def get_certificate_assessment_offerings() -> (
    List[certificate_assessment_domain.CertificateAssessmentOffering]
):
    """Returns all certificate assessment offerings from datastore."""
    certificate_assessment_offering_models: List[
        gae_models.CertificateAssessmentOfferingModel
        # Here we use cast because the datastore fetch returns a generic sequence and
        # mypy cannot infer the concrete CertificateAssessmentOfferingModel item
        # type from this storage-layer API.
    ] = cast(
        List[gae_models.CertificateAssessmentOfferingModel],
        gae_models.CertificateAssessmentOfferingModel.get_all().fetch(),
    )
    return [
        _model_to_domain(certificate_assessment_offering_model)
        for certificate_assessment_offering_model in (
            certificate_assessment_offering_models
        )
    ]
