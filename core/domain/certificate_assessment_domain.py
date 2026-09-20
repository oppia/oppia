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

import datetime

from core import utils

from typing import Dict, List, Optional, TypedDict

# Valid values for async_status field.
VALID_ASYNC_STATUSES: List[str] = ['Available', 'Not_Ready', 'Blocked']
MAX_TITLE_LENGTH = 80
MAX_DESCRIPTION_LENGTH = 500
MIN_TIME_LIMIT_IN_MINUTES = 5
MAX_TIME_LIMIT_IN_MINUTES = 60
MIN_TOTAL_QUESTIONS = 3
MAX_TOTAL_QUESTIONS = 50
# Minimum time (in minutes) that must elapse between a learner's last
# attempt start and their next attempt start for the same certificate.
MIN_TIME_BETWEEN_ATTEMPTS_IN_MINUTES = 10

# Maximum size in bytes of a serialized selected_answer for a certificate
# assessment. Each response is stored in its own Datastore entity, so this
# bound keeps a single answer well below the entity size limit (1 MB).
MAX_CERTIFICATE_ASSESSMENT_ANSWER_BYTES = 10 * 1024

# Keys that must be present in a version_data dict for an attempt.
REQUIRED_VERSION_DATA_KEYS: List[str] = [
    'certificate_id',
    'certificate_version',
    'topic_versions',
    'question_versions',
    'question_topic_links',
]


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
        if not isinstance(self.total_questions, int):
            raise utils.ValidationError(
                'total_questions must be a positive integer.'
            )
        if self.total_questions < MIN_TOTAL_QUESTIONS:
            raise utils.ValidationError(
                'total_questions must be greater than or equal to %d.'
                % MIN_TOTAL_QUESTIONS
            )
        if self.total_questions > MAX_TOTAL_QUESTIONS:
            raise utils.ValidationError(
                'total_questions must be at most %d.' % MAX_TOTAL_QUESTIONS
            )
        if not isinstance(self.time_limit_in_minutes, int):
            raise utils.ValidationError(
                'time_limit_in_minutes must be a positive integer.'
            )
        if self.time_limit_in_minutes < MIN_TIME_LIMIT_IN_MINUTES:
            raise utils.ValidationError(
                'time_limit_in_minutes must be greater than or equal to %d.'
                % MIN_TIME_LIMIT_IN_MINUTES
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


class CertificateAssessmentAttemptTopicStatsDict(TypedDict):
    """Dict representation of per-topic question stats within an
    attempt.
    """

    total_related_questions: int
    total_correct_questions: int


class CertificateAssessmentAttemptVersionDataDict(TypedDict):
    """Dict representation of the version snapshot used to generate an
    attempt.
    """

    certificate_id: str
    certificate_version: int
    topic_versions: Dict[str, int]
    question_versions: Dict[str, int]
    question_topic_links: Dict[str, List[str]]


class CertificateAssessmentAttemptDict(TypedDict):
    """Dict representation of a certificate assessment attempt."""

    attempt_id: str
    learner_id: str
    total_score: float
    attempt_index: int
    attempt_data: Dict[str, CertificateAssessmentAttemptTopicStatsDict]
    version_data: CertificateAssessmentAttemptVersionDataDict
    started_at: datetime.datetime
    finished_at: Optional[datetime.datetime]
    is_submitted: bool


class CertificateAssessmentAttempt:
    """Domain object representing a single attempt made by a learner at
    a certificate assessment.
    A CertificateAssessmentAttempt stores the learner's progress and
    score for one attempt, together with a snapshot of the exact
    versions of the certificate offering, topics, questions, and
    question-topic-links that were in effect when the attempt was
    generated. This ensures the attempt can always be reconstructed
    and re-graded consistently, even if the underlying content changes
    later on.
    """

    def __init__(
        self,
        attempt_id: str,
        learner_id: str,
        total_score: float,
        attempt_index: int,
        attempt_data: Dict[str, CertificateAssessmentAttemptTopicStatsDict],
        version_data: CertificateAssessmentAttemptVersionDataDict,
        started_at: datetime.datetime,
        finished_at: Optional[datetime.datetime],
        is_submitted: bool,
    ) -> None:
        """Initializes a CertificateAssessmentAttempt domain object.

        Args:
            attempt_id: str. The unique ID of this attempt. Corresponds
                to the storage model ID.
            learner_id: str. The ID of the learner who made this
                attempt.
            total_score: float. The total score achieved in this
                attempt.
            attempt_index: int. The index of this attempt for the
                given learner and certificate (1-based).
            attempt_data: dict. Maps topic_id to a dict containing
                'total_related_questions' and
                'total_correct_questions' for that topic.
            version_data: dict. Captures the exact versions of the
                certificate, topics, questions, and
                question-topic-links used for this attempt.
            started_at: datetime.datetime. When the attempt was
                started.
            finished_at: datetime.datetime|None. When the attempt was
                finished, or None if not yet finished.
            is_submitted: bool. Whether the attempt has been submitted.
        """
        self.attempt_id = attempt_id
        self.learner_id = learner_id
        self.total_score = total_score
        self.attempt_index = attempt_index
        self.attempt_data = attempt_data
        self.version_data = version_data
        self.started_at = started_at
        self.finished_at = finished_at
        self.is_submitted = is_submitted

    def get_time_taken_in_minutes(self) -> Optional[int]:
        """Returns how long the attempt took, in whole minutes.

        Returns:
            int|None. The elapsed time between the attempt start and
            finish, in minutes, or None if the attempt has not been
            finished yet.
        """
        if self.finished_at is None:
            return None
        return int((self.finished_at - self.started_at).total_seconds() / 60)

    def _validate_ids_and_scores(self) -> None:
        """Validates the attempt identity and score fields."""
        if not isinstance(self.attempt_id, str) or not self.attempt_id:
            raise utils.ValidationError(
                'attempt_id must be a non-empty string.'
            )
        if not isinstance(self.learner_id, str) or not self.learner_id:
            raise utils.ValidationError(
                'learner_id must be a non-empty string.'
            )
        if (
            isinstance(self.total_score, bool)
            or not isinstance(self.total_score, (int, float))
            or self.total_score < 0
        ):
            raise utils.ValidationError(
                'total_score must be a non-negative number.'
            )
        # In-progress attempts are stored with a placeholder index of 0 until
        # they are submitted, at which point the real 1-based index is set.
        min_attempt_index = 1 if self.is_submitted else 0
        if (
            isinstance(self.attempt_index, bool)
            or not isinstance(self.attempt_index, int)
            or self.attempt_index < min_attempt_index
        ):
            raise utils.ValidationError(
                'attempt_index must be a %s integer.'
                % ('positive' if self.is_submitted else 'non-negative')
            )

    def _validate_attempt_data(self) -> None:
        """Validates the per-topic attempt statistics."""
        if not isinstance(self.attempt_data, dict):
            raise utils.ValidationError('attempt_data must be a dict.')
        # In-progress attempts have empty per-topic stats until submission.
        if not self.attempt_data and self.is_submitted:
            raise utils.ValidationError(
                'attempt_data must contain stats for at least one topic.'
            )
        for topic_id, topic_stats in self.attempt_data.items():
            if not isinstance(topic_id, str) or not topic_id:
                raise utils.ValidationError(
                    'attempt_data must use non-empty strings as topic ids.'
                )
            if not isinstance(topic_stats, dict) or set(topic_stats.keys()) != {
                'total_related_questions',
                'total_correct_questions',
            }:
                raise utils.ValidationError(
                    'attempt_data values must contain exactly '
                    '\'total_related_questions\' and '
                    '\'total_correct_questions\'.'
                )
            total_related_questions = topic_stats['total_related_questions']
            total_correct_questions = topic_stats['total_correct_questions']
            if (
                isinstance(total_related_questions, bool)
                or not isinstance(total_related_questions, int)
                or total_related_questions < 0
            ):
                raise utils.ValidationError(
                    'total_related_questions must be a non-negative '
                    'integer for every topic in attempt_data.'
                )
            if (
                isinstance(total_correct_questions, bool)
                or not isinstance(total_correct_questions, int)
                or total_correct_questions < 0
            ):
                raise utils.ValidationError(
                    'total_correct_questions must be a non-negative '
                    'integer for every topic in attempt_data.'
                )
            if total_correct_questions > total_related_questions:
                raise utils.ValidationError(
                    'total_correct_questions cannot exceed '
                    'total_related_questions for any topic in '
                    'attempt_data.'
                )

    def _validate_version_data(self) -> None:
        """Validates the captured certificate version snapshot."""
        if not isinstance(self.version_data, dict):
            raise utils.ValidationError('version_data must be a dict.')
        missing_keys = [
            key
            for key in REQUIRED_VERSION_DATA_KEYS
            if key not in self.version_data
        ]
        if missing_keys:
            raise utils.ValidationError(
                'version_data is missing required keys: %s.' % missing_keys
            )
        if (
            not isinstance(self.version_data['certificate_id'], str)
            or not self.version_data['certificate_id']
        ):
            raise utils.ValidationError(
                'version_data.certificate_id must be a non-empty string.'
            )
        if (
            isinstance(self.version_data['certificate_version'], bool)
            or not isinstance(self.version_data['certificate_version'], int)
            or self.version_data['certificate_version'] < 1
        ):
            raise utils.ValidationError(
                'version_data.certificate_version must be a positive '
                'integer.'
            )
        if not isinstance(self.version_data['topic_versions'], dict):
            raise utils.ValidationError(
                'version_data.topic_versions must be a dict.'
            )
        if not isinstance(self.version_data['question_versions'], dict):
            raise utils.ValidationError(
                'version_data.question_versions must be a dict.'
            )
        if not isinstance(self.version_data['question_topic_links'], dict):
            raise utils.ValidationError(
                'version_data.question_topic_links must be a dict.'
            )

    def _validate_timestamps(self) -> None:
        """Validates the attempt timestamps and submission flag."""
        if not isinstance(self.started_at, datetime.datetime):
            raise utils.ValidationError(
                'started_at must be a datetime.datetime instance.'
            )
        if self.finished_at is not None:
            if not isinstance(self.finished_at, datetime.datetime):
                raise utils.ValidationError(
                    'finished_at must be a datetime.datetime instance '
                    'or None.'
                )
            if self.finished_at < self.started_at:
                raise utils.ValidationError(
                    'finished_at cannot be earlier than started_at.'
                )
        if not isinstance(self.is_submitted, bool):
            raise utils.ValidationError('is_submitted must be a boolean.')

    def validate(self) -> None:
        """Validates the CertificateAssessmentAttempt domain object.

        Raises:
            utils.ValidationError. If any field is invalid.
        """
        self._validate_ids_and_scores()
        self._validate_attempt_data()
        self._validate_version_data()
        self._validate_timestamps()

    def to_dict(self) -> CertificateAssessmentAttemptDict:
        """Returns a dict representation of this
        CertificateAssessmentAttempt.

        Returns:
            CertificateAssessmentAttemptDict. A dictionary containing
            all fields of this domain object.
        """
        return {
            'attempt_id': self.attempt_id,
            'learner_id': self.learner_id,
            'total_score': self.total_score,
            'attempt_index': self.attempt_index,
            'attempt_data': self.attempt_data,
            'version_data': self.version_data,
            'started_at': self.started_at,
            'finished_at': self.finished_at,
            'is_submitted': self.is_submitted,
        }

    @classmethod
    def from_dict(
        cls, attempt_dict: CertificateAssessmentAttemptDict
    ) -> CertificateAssessmentAttempt:
        """Returns a CertificateAssessmentAttempt domain object from a
        dict.

        Args:
            attempt_dict: CertificateAssessmentAttemptDict. A
                dictionary containing all fields needed to construct a
                CertificateAssessmentAttempt.

        Returns:
            CertificateAssessmentAttempt. The corresponding domain
            object.
        """
        return cls(
            attempt_id=attempt_dict['attempt_id'],
            learner_id=attempt_dict['learner_id'],
            total_score=attempt_dict['total_score'],
            attempt_index=attempt_dict['attempt_index'],
            attempt_data=attempt_dict['attempt_data'],
            version_data=attempt_dict['version_data'],
            started_at=attempt_dict['started_at'],
            finished_at=attempt_dict['finished_at'],
            is_submitted=attempt_dict['is_submitted'],
        )


class CertificateAssessmentResponseDict(TypedDict):
    """Dict representation of a certificate assessment response."""

    attempt_id: str
    question_id: str
    question_version: int
    selected_answer: str
    is_correct: bool


class CertificateAssessmentResponse:
    """Domain object representing a single response submitted by a
    learner to a question during a certificate assessment attempt.

    The service builds and validates one of these for each submitted answer
    right before the response is persisted, so this is the gate that keeps
    malformed or oversized data out of the Datastore. selected_answer holds
    the already-serialized string form of the learner's answer; an empty
    string means the question was unanswered.
    """

    def __init__(
        self,
        attempt_id: str,
        question_id: str,
        question_version: int,
        selected_answer: str,
        is_correct: bool,
    ) -> None:
        """Initializes a CertificateAssessmentResponse domain object.

        Args:
            attempt_id: str. The ID of the attempt this response
                belongs to.
            question_id: str. The ID of the question being answered.
            question_version: int. The version of the question that
                was answered.
            selected_answer: str. The serialized answer selected by the
                learner. An empty string means the question was unanswered.
            is_correct: bool. Whether the selected answer was correct.
        """
        self.attempt_id = attempt_id
        self.question_id = question_id
        self.question_version = question_version
        self.selected_answer = selected_answer
        self.is_correct = is_correct

    def validate(self) -> None:
        """Validates the CertificateAssessmentResponse domain object.

        The learner's browser already grades each answer and sends the
        is_correct flag, so this method does not re-score anything. Its job
        is to make sure the serialized answer can be stored safely: the ids
        must be non-empty, is_correct must genuinely be a boolean (otherwise
        bool('false') would silently count as correct), and the serialized
        answer must fit well below the Datastore entity size limit.

        Raises:
            utils.ValidationError. If any field is invalid.
        """
        if not isinstance(self.attempt_id, str) or not self.attempt_id:
            raise utils.ValidationError(
                'attempt_id must be a non-empty string.'
            )
        if not isinstance(self.question_id, str) or not self.question_id:
            raise utils.ValidationError(
                'question_id must be a non-empty string.'
            )
        if (
            isinstance(self.question_version, bool)
            or not isinstance(self.question_version, int)
            or self.question_version < 1
        ):
            raise utils.ValidationError(
                'question_version must be a positive integer.'
            )
        if not isinstance(self.selected_answer, str):
            raise utils.ValidationError('selected_answer must be a string.')
        if (
            len(self.selected_answer.encode('utf-8'))
            > MAX_CERTIFICATE_ASSESSMENT_ANSWER_BYTES
        ):
            raise utils.ValidationError(
                'selected_answer must be at most %d bytes when '
                'serialized.' % MAX_CERTIFICATE_ASSESSMENT_ANSWER_BYTES
            )
        if not isinstance(self.is_correct, bool):
            raise utils.ValidationError('is_correct must be a boolean.')

    def to_dict(self) -> CertificateAssessmentResponseDict:
        """Returns a dict representation of this
        CertificateAssessmentResponse.

        Returns:
            CertificateAssessmentResponseDict. A dictionary containing
            all fields of this domain object.
        """
        return {
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'question_version': self.question_version,
            'selected_answer': self.selected_answer,
            'is_correct': self.is_correct,
        }

    @classmethod
    def from_dict(
        cls, response_dict: CertificateAssessmentResponseDict
    ) -> CertificateAssessmentResponse:
        """Returns a CertificateAssessmentResponse domain object from a
        dict.

        Args:
            response_dict: CertificateAssessmentResponseDict. A
                dictionary containing all fields needed to construct a
                CertificateAssessmentResponse.

        Returns:
            CertificateAssessmentResponse. The corresponding domain
            object.
        """
        return cls(
            attempt_id=response_dict['attempt_id'],
            question_id=response_dict['question_id'],
            question_version=response_dict['question_version'],
            selected_answer=response_dict['selected_answer'],
            is_correct=response_dict['is_correct'],
        )
