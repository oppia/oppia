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

"""Domain objects for certificate assessment."""

from __future__ import annotations

from core import utils

from typing import List, TypedDict

# Valid values for async_status field.
VALID_ASYNC_STATUSES: List[str] = ['Available', 'Not_Ready', 'Blocked']
MAX_TITLE_LENGTH = 80
MAX_DESCRIPTION_LENGTH = 500
MAX_TIME_LIMIT_IN_MINUTES = 60
MAX_TOTAL_QUESTIONS = 50


class CertificateAssessmentOfferingDict(TypedDict):
    """Dict representation of a certificate assessment offering."""

    certificate_id: str
    title: str
    description: str
    classroom_id: str
    topic_ids: List[str]
    total_questions: int
    time_limit_in_minutes: int
    demonstrates: List[str]
    async_status: str
    version: int


class CertificateAssessmentOffering:
    """Domain object representing a certificate assessment offering.

    A CertificateAssessmentOffering stores the complete configuration
    used to generate and evaluate a certificate assessment for a given
    classroom and set of topics.

    NOTE: The version field maps directly to the storage model's
    VersionedModel.version and is auto-incremented on every commit.
    It is not stored as a separate field in the storage model.
    """

    def __init__(
        self,
        certificate_id: str,
        title: str,
        description: str,
        classroom_id: str,
        topic_ids: List[str],
        total_questions: int,
        time_limit_in_minutes: int,
        demonstrates: List[str],
        async_status: str,
        version: int,
    ) -> None:
        """Initializes a CertificateAssessmentOffering domain object.

        Args:
            certificate_id: str. The unique ID of this certificate
                offering. Corresponds to the storage model ID.
            title: str. The title of the certificate.
            description: str. A human-readable description of what
                the certificate covers.
            classroom_id: str. The ID of the classroom this certificate
                belongs to.
            topic_ids: list(str). The IDs of topics covered by this
                certificate.
            total_questions: int. Total number of questions in the
                certificate assessment.
            time_limit_in_minutes: int. Maximum time (in minutes) a
                learner has to complete the assessment.
            demonstrates: list(str). Human-readable strings stating
                what skills this certificate demonstrates.
            async_status: str. The publication status of this offering.
                Must be one of 'Available', 'Not_Ready', or 'Blocked'.
            version: int. The current version of this certificate
                offering. Maps to VersionedModel.version and is
                incremented on every commit.
        """
        self.certificate_id = certificate_id
        self.title = title
        self.description = description
        self.classroom_id = classroom_id
        self.topic_ids = topic_ids
        self.total_questions = total_questions
        self.time_limit_in_minutes = time_limit_in_minutes
        self.demonstrates = demonstrates
        self.async_status = async_status
        self.version = version

    def validate(self) -> None:
        """Validates the CertificateAssessmentOffering domain object.

        Raises:
            utils.ValidationError. If any field is invalid.
        """
        if not isinstance(self.certificate_id, str) or not self.certificate_id:
            raise utils.ValidationError(
                'certificate_id must be a non-empty string.'
            )
        if not isinstance(self.title, str) or not self.title.strip():
            raise utils.ValidationError('title must be a non-empty string.')
        if len(self.title) > MAX_TITLE_LENGTH:
            raise utils.ValidationError(
                'title must be at most %d characters long.' % MAX_TITLE_LENGTH
            )
        if (
            not isinstance(self.description, str)
            or not self.description.strip()
        ):
            raise utils.ValidationError(
                'description must be a non-empty string.'
            )
        if len(self.description) > MAX_DESCRIPTION_LENGTH:
            raise utils.ValidationError(
                'description must be at most %d characters long.'
                % MAX_DESCRIPTION_LENGTH
            )
        if not isinstance(self.classroom_id, str) or not self.classroom_id:
            raise utils.ValidationError(
                'classroom_id must be a non-empty string.'
            )
        if not isinstance(self.topic_ids, list) or not self.topic_ids:
            raise utils.ValidationError(
                'topic_ids must contain at least one topic.'
            )
        if any(
            not isinstance(topic_id, str) or not topic_id
            for topic_id in self.topic_ids
        ):
            raise utils.ValidationError(
                'topic_ids must contain only non-empty strings.'
            )
        if (
            not isinstance(self.total_questions, int)
            or self.total_questions < 1
        ):
            raise utils.ValidationError(
                'total_questions must be a positive integer.'
            )
        if self.total_questions > MAX_TOTAL_QUESTIONS:
            raise utils.ValidationError(
                'total_questions must be at most %d.' % MAX_TOTAL_QUESTIONS
            )
        if (
            not isinstance(self.time_limit_in_minutes, int)
            or self.time_limit_in_minutes < 1
        ):
            raise utils.ValidationError(
                'time_limit_in_minutes must be a positive integer.'
            )
        if self.time_limit_in_minutes > MAX_TIME_LIMIT_IN_MINUTES:
            raise utils.ValidationError(
                'time_limit_in_minutes must be at most %d.'
                % MAX_TIME_LIMIT_IN_MINUTES
            )
        if not isinstance(self.demonstrates, list):
            raise utils.ValidationError(
                'demonstrates must be a list of strings.'
            )
        if not self.demonstrates:
            raise utils.ValidationError(
                'demonstrates must contain at least one item.'
            )
        if any(
            not isinstance(demonstration, str) or not demonstration
            for demonstration in self.demonstrates
        ):
            raise utils.ValidationError(
                'demonstrates must contain only non-empty strings.'
            )
        if self.async_status not in VALID_ASYNC_STATUSES:
            raise utils.ValidationError(
                'async_status must be one of %s.' % VALID_ASYNC_STATUSES
            )
        if not isinstance(self.version, int) or self.version < 1:
            raise utils.ValidationError('version must be a positive integer.')

    def to_dict(self) -> CertificateAssessmentOfferingDict:
        """Returns a dict representation of this
        CertificateAssessmentOffering.

        Returns:
            CertificateAssessmentOfferingDict. A dictionary containing
            all fields of this domain object. Used when serializing
            the object for the frontend or for storage.
        """
        return {
            'certificate_id': self.certificate_id,
            'title': self.title,
            'description': self.description,
            'classroom_id': self.classroom_id,
            'topic_ids': self.topic_ids,
            'total_questions': self.total_questions,
            'time_limit_in_minutes': self.time_limit_in_minutes,
            'demonstrates': self.demonstrates,
            'async_status': self.async_status,
            'version': self.version,
        }

    @classmethod
    def from_dict(
        cls,
        certificate_offering_dict: CertificateAssessmentOfferingDict,
    ) -> CertificateAssessmentOffering:
        """Returns a CertificateAssessmentOffering domain object from
        a dict.

        Args:
            certificate_offering_dict: CertificateAssessmentOfferingDict.
                A dictionary containing all fields needed to construct
                a CertificateAssessmentOffering.

        Returns:
            CertificateAssessmentOffering. The corresponding domain
            object.
        """
        return cls(
            certificate_id=certificate_offering_dict['certificate_id'],
            title=certificate_offering_dict['title'],
            description=certificate_offering_dict['description'],
            classroom_id=certificate_offering_dict['classroom_id'],
            topic_ids=certificate_offering_dict['topic_ids'],
            total_questions=certificate_offering_dict['total_questions'],
            time_limit_in_minutes=(
                certificate_offering_dict['time_limit_in_minutes']
            ),
            demonstrates=certificate_offering_dict['demonstrates'],
            async_status=certificate_offering_dict['async_status'],
            version=certificate_offering_dict['version'],
        )
