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

import sys
from collections import deque

from core import feconf, utils
from core.domain import (
    certificate_assessment_domain,
    question_services,
    skill_fetchers,
    topic_fetchers,
)
from core.storage.certificate_assessment import gae_models

from typing import Dict, List, TypedDict, cast

# Number of questions required per topic (one each of easy, medium, hard).
QUESTIONS_PER_TOPIC = 3


class CertificateAssessmentOfferingValidationResultDict(TypedDict):
    """Dict representation of certificate offering validation results."""

    is_valid: bool
    validation_errors: Dict[str, Dict[str, Dict[str, int]]]
    validation_message: str


def _get_topic_name_to_question_ids_map(
    topic_ids: List[str],
) -> Dict[str, List[str]]:
    """Returns a mapping from topic ID to unique question IDs for its skills."""
    # Build a deduplicated pool of question IDs per topic so we can detect
    # both per-topic shortages and cross-topic overlap later in validation.
    topic_id_to_question_ids: Dict[str, List[str]] = {}
    for topic_id in topic_ids:
        try:
            topic = topic_fetchers.get_topic_by_id(topic_id, strict=True)
        except Exception as e:
            raise utils.ValidationError(
                'Topic %s does not exist.' % topic_id
            ) from e

        question_ids: set[str] = set()
        for skill_id in topic.get_all_skill_ids():
            skill = skill_fetchers.get_skill_by_id(skill_id)
            if skill is None:
                continue
            question_ids.update(
                link.question_id
                for link in question_services.get_question_skill_links_of_skill(
                    skill_id, skill.description
                )
            )

        topic_id_to_question_ids[topic_id] = sorted(question_ids)
    return topic_id_to_question_ids


def _get_difficulty_counts(total_questions: int) -> Dict[str, int]:
    """Distributes questions over medium, easy and hard in a repeating cycle."""
    # Spread required questions across difficulty buckets in a stable order so
    # the validator can compare each bucket against the available pool.
    counts = {'easy': 0, 'medium': 0, 'hard': 0}
    # Keep this order stable. We intentionally start with medium, then easy,
    # then hard so the extra questions are biased toward the core mastery
    # evidence and discrimination buckets instead of over-allocating easy
    # questions.
    cycle = ['medium', 'easy', 'hard']
    for index in range(total_questions):
        counts[cycle[index % len(cycle)]] += 1
    return counts


def _get_difficulty_label(skill_difficulty: float) -> str | None:
    """Returns the certificate difficulty label for a linked skill difficulty."""
    # Map persisted skill difficulty values into certificate buckets so the
    # validator can count available questions per difficulty.
    if skill_difficulty == 0.3:
        return 'easy'
    if skill_difficulty == 0.6:
        return 'medium'
    if skill_difficulty == 0.9:
        return 'hard'
    return None


def _get_topic_validation_result(
    available_questions_by_difficulty: Dict[str, int], required_questions: int
) -> Dict[str, Dict[str, int]]:
    """Returns the required/available breakdown for one topic."""
    required = _get_difficulty_counts(required_questions)
    return {
        'easy': {
            'required': required['easy'],
            'available': available_questions_by_difficulty['easy'],
        },
        'medium': {
            'required': required['medium'],
            'available': available_questions_by_difficulty['medium'],
        },
        'hard': {
            'required': required['hard'],
            'available': available_questions_by_difficulty['hard'],
        },
    }


def _get_distinct_question_ids(
    topic_name_to_question_ids_map: Dict[str, List[str]],
    topic_ids: List[str],
) -> set[str]:
    """Returns all distinct question IDs reachable from the selected topics."""
    distinct_question_ids: set[str] = set()
    for topic_id in topic_ids:
        distinct_question_ids.update(topic_name_to_question_ids_map[topic_id])
    return distinct_question_ids


def _format_list(items: List[str]) -> str:
    """Formats a short human-readable list."""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return '%s and %s' % (items[0], items[1])
    return '%s, and %s' % (', '.join(items[:-1]), items[-1])


def _has_valid_distinct_assignment(
    topic_id_to_question_ids_by_difficulty: Dict[str, Dict[str, set[str]]],
    topic_ids: List[str],
    required_questions_by_topic: Dict[str, Dict[str, int]],
    difficulty: str,
) -> bool:
    """Checks whether questions can be assigned distinctly for one difficulty."""
    source = 'source'
    sink = 'sink'
    capacity_graph: Dict[str, Dict[str, int]] = {
        source: {},
        sink: {},
    }

    total_required = 0
    for topic_id in topic_ids:
        required = required_questions_by_topic[topic_id][difficulty]
        if required == 0:
            continue
        topic_node = 'topic:%s' % topic_id
        total_required += required
        capacity_graph.setdefault(source, {})[topic_node] = required
        capacity_graph.setdefault(topic_node, {})

        for question_id in topic_id_to_question_ids_by_difficulty[topic_id][
            difficulty
        ]:
            question_node = 'question:%s' % question_id
            capacity_graph.setdefault(topic_node, {})[question_node] = 1
            capacity_graph.setdefault(question_node, {})
            capacity_graph[question_node][sink] = 1

    if total_required == 0:
        return True

    flow = 0
    while True:
        parent: Dict[str, str | None] = {source: None}
        queue: deque[str] = deque([source])
        while queue and sink not in parent:
            node = queue.popleft()
            for neighbor, remaining_capacity in capacity_graph.get(
                node, {}
            ).items():
                if remaining_capacity <= 0 or neighbor in parent:
                    continue
                parent[neighbor] = node
                queue.append(neighbor)

        if sink not in parent:
            break

        path_capacity = sys.maxsize
        node = sink
        while parent[node] is not None:
            previous = cast(str, parent[node])
            path_capacity = min(path_capacity, capacity_graph[previous][node])
            node = previous

        node = sink
        while parent[node] is not None:
            previous = cast(str, parent[node])
            capacity_graph[previous][node] -= path_capacity
            capacity_graph[node][previous] = (
                capacity_graph.get(node, {}).get(previous, 0) + path_capacity
            )
            node = previous

        flow += path_capacity
        if flow == total_required:
            return True

    return False


def validate_certificate_assessment_offering(
    topic_ids: List[str], total_questions: int
) -> CertificateAssessmentOfferingValidationResultDict:
    """Pre-validates whether a certificate offering can be created.

    Args:
        topic_ids: list(str). The selected topic IDs for the certificate.
        total_questions: int. The total number of questions requested.

    Returns:
        dict. Contains is_valid, validation_errors and validation_message.
    """
    if not topic_ids:
        raise utils.ValidationError(
            'topic_ids must contain at least one topic.'
        )
    if total_questions < 1:
        raise utils.ValidationError(
            'total_questions must be a positive integer.'
        )

    topic_name_to_question_ids_map = _get_topic_name_to_question_ids_map(
        topic_ids
    )
    base_questions_per_topic = total_questions // len(topic_ids)
    remainder = total_questions % len(topic_ids)

    validation_errors: Dict[str, Dict[str, Dict[str, int]]] = {}
    message_parts: List[str] = []
    is_valid = True
    required_questions_by_topic: Dict[str, Dict[str, int]] = {}
    topic_id_to_question_ids_by_difficulty: Dict[str, Dict[str, set[str]]] = {}
    topic_id_to_name: Dict[str, str] = {}

    expected_total_questions = len(topic_ids) * QUESTIONS_PER_TOPIC
    if total_questions < expected_total_questions:
        is_valid = False
        message_parts.append(
            'total_questions must be greater than or equal to %d '
            '(%d per topic: easy, medium, hard) for %d topic(s).'
            % (
                expected_total_questions,
                QUESTIONS_PER_TOPIC,
                len(topic_ids),
            )
        )

    distinct_question_ids = _get_distinct_question_ids(
        topic_name_to_question_ids_map, topic_ids
    )
    if len(distinct_question_ids) < total_questions:
        is_valid = False
        message_parts.append(
            'Only %d unique question(s) are available across the selected '
            'topics, but %d are required without reusing questions.'
            % (len(distinct_question_ids), total_questions)
        )

    for index, topic_id in enumerate(topic_ids):
        required_questions = base_questions_per_topic + (
            1 if index < remainder else 0
        )
        required_questions_by_topic[topic_id] = _get_difficulty_counts(
            required_questions
        )
        topic = topic_fetchers.get_topic_by_id(topic_id)
        topic_id_to_name[topic_id] = (
            topic.name if topic is not None else topic_id
        )
        available_question_ids_by_difficulty: Dict[str, set[str]] = {
            'easy': set(),
            'medium': set(),
            'hard': set(),
        }
        if topic is not None:
            for skill_id in topic.get_all_skill_ids():
                skill = skill_fetchers.get_skill_by_id(skill_id)
                if skill is None:
                    continue
                for (
                    question_skill_link
                ) in question_services.get_question_skill_links_of_skill(
                    skill_id, skill.description
                ):
                    difficulty_label = _get_difficulty_label(
                        question_skill_link.skill_difficulty
                    )
                    if difficulty_label is None:
                        continue
                    available_question_ids_by_difficulty[difficulty_label].add(
                        question_skill_link.question_id
                    )
        topic_id_to_question_ids_by_difficulty[topic_id] = (
            available_question_ids_by_difficulty
        )

        available_questions_by_difficulty = {
            difficulty: len(question_ids)
            for difficulty, question_ids in available_question_ids_by_difficulty.items()
        }
        validation_result = _get_topic_validation_result(
            available_questions_by_difficulty, required_questions
        )
        validation_errors[topic_id] = validation_result
        if not (
            available_questions_by_difficulty['easy']
            >= validation_result['easy']['required']
            and available_questions_by_difficulty['medium']
            >= validation_result['medium']['required']
            and available_questions_by_difficulty['hard']
            >= validation_result['hard']['required']
        ):
            is_valid = False
            message_parts.append(
                '%s does not have enough questions in every difficulty bucket.'
                % topic_id_to_name[topic_id]
            )

    missing_distinct_difficulties: List[str] = []
    for difficulty in ('easy', 'medium', 'hard'):
        if not _has_valid_distinct_assignment(
            topic_id_to_question_ids_by_difficulty,
            topic_ids,
            required_questions_by_topic,
            difficulty,
        ):
            is_valid = False
            missing_distinct_difficulties.append(difficulty)

    if missing_distinct_difficulties:
        is_valid = False
        message_parts.append(
            'Selected topics %s do not have enough distinct %s questions '
            'to satisfy the requested certificate without reusing '
            'questions across topics.'
            % (
                _format_list(
                    [topic_id_to_name[topic_id] for topic_id in topic_ids]
                ),
                _format_list(missing_distinct_difficulties),
            )
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


class CertificateAssessmentOfferingNotFoundException(Exception):
    """Exception raised when a certificate assessment offering is missing."""

    pass


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
    """Creates and stores a certificate assessment offering.

    Args:
        title: str. The title of the certificate assessment offering.
        description: str. The description of the certificate assessment
            offering.
        classroom_id: str. The classroom ID associated with the offering.
        topic_ids: list(str). The topic IDs associated with the offering.
        total_questions: int. The total number of questions in the offering.
        time_limit_in_minutes: int. The time limit for the offering in
            minutes.
        demonstrates: list(str). The list of skills demonstrated by the
            offering.
        async_status: str. The availability status of the offering.

    Returns:
        CertificateAssessmentOffering. The created certificate assessment
        offering.
    """

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


def get_certificate_assessment_offering(
    certificate_id: str,
) -> certificate_assessment_domain.CertificateAssessmentOffering:
    """Returns a single certificate assessment offering from datastore.

    Args:
        certificate_id: str. The ID of the certificate assessment offering.

    Returns:
        CertificateAssessmentOffering. The certificate assessment offering
        with the given ID.

    Raises:
        CertificateAssessmentOfferingNotFoundException. The certificate
            assessment offering does not exist.
    """
    certificate_assessment_offering_model = (
        gae_models.CertificateAssessmentOfferingModel.get_by_id(certificate_id)
    )
    if certificate_assessment_offering_model is None:
        raise CertificateAssessmentOfferingNotFoundException(
            'Certificate assessment offering %s does not exist.'
            % certificate_id
        )

    return _model_to_domain(certificate_assessment_offering_model)


def update_certificate_assessment_offering(
    certificate_id: str,
    title: str,
    description: str,
    classroom_id: str,
    topic_ids: list[str],
    total_questions: int,
    time_limit_in_minutes: int,
    demonstrates: list[str],
    async_status: str,
) -> certificate_assessment_domain.CertificateAssessmentOffering:
    """Updates an existing certificate assessment offering.

    Args:
        certificate_id: str. The ID of the certificate assessment offering.
        title: str. The title of the certificate assessment offering.
        description: str. The description of the certificate assessment
            offering.
        classroom_id: str. The classroom ID associated with the offering.
        topic_ids: list(str). The topic IDs associated with the offering.
        total_questions: int. The total number of questions in the offering.
        time_limit_in_minutes: int. The time limit for the offering in
            minutes.
        demonstrates: list(str). The list of skills demonstrated by the
            offering.
        async_status: str. The availability status of the offering.

    Returns:
        CertificateAssessmentOffering. The updated certificate assessment
        offering.

    Raises:
        CertificateAssessmentOfferingNotFoundException. The certificate
            assessment offering does not exist.
        ValidationError. The provided offering data is invalid.
    """
    certificate_assessment_offering_model = (
        gae_models.CertificateAssessmentOfferingModel.get_by_id(certificate_id)
    )
    if certificate_assessment_offering_model is None:
        raise CertificateAssessmentOfferingNotFoundException(
            'Certificate assessment offering %s does not exist.'
            % certificate_id
        )

    certificate_assessment_offering_model.title = title
    certificate_assessment_offering_model.description = description
    certificate_assessment_offering_model.classroom_id = classroom_id
    certificate_assessment_offering_model.topic_ids = topic_ids
    certificate_assessment_offering_model.total_questions = total_questions
    certificate_assessment_offering_model.time_limit_in_minutes = (
        time_limit_in_minutes
    )
    certificate_assessment_offering_model.demonstrates = demonstrates
    certificate_assessment_offering_model.async_status = async_status

    certificate_assessment_offering = _model_to_domain(
        certificate_assessment_offering_model
    )
    certificate_assessment_offering.validate()

    certificate_assessment_offering_model.commit(
        feconf.SYSTEM_COMMITTER_ID,
        'Certificate assessment offering updated.',
        [
            {'cmd': 'update_title', 'new_title': title},
            {'cmd': 'update_description', 'new_description': description},
            {'cmd': 'update_classroom_id', 'new_classroom_id': classroom_id},
            {'cmd': 'update_topic_ids', 'new_topic_ids': topic_ids},
            {
                'cmd': 'update_total_questions',
                'new_total_questions': total_questions,
            },
            {
                'cmd': 'update_time_limit_in_minutes',
                'new_time_limit_in_minutes': time_limit_in_minutes,
            },
            {'cmd': 'update_demonstrates', 'new_demonstrates': demonstrates},
            {'cmd': 'update_async_status', 'new_async_status': async_status},
        ],
    )

    return _model_to_domain(certificate_assessment_offering_model)


def delete_certificate_assessment_offering(certificate_id: str) -> None:
    """Deletes a certificate assessment offering from datastore.

    Args:
        certificate_id: str. The ID of the certificate assessment offering.

    Raises:
        CertificateAssessmentOfferingNotFoundException. The certificate
            assessment offering does not exist.
    """
    certificate_assessment_offering_model = (
        gae_models.CertificateAssessmentOfferingModel.get_by_id(certificate_id)
    )
    if certificate_assessment_offering_model is None:
        raise CertificateAssessmentOfferingNotFoundException(
            'Certificate assessment offering %s does not exist.'
            % certificate_id
        )

    certificate_assessment_offering_model.delete(
        feconf.SYSTEM_COMMITTER_ID,
        'Certificate assessment offering deleted.',
        force_deletion=True,
    )


def get_certificate_assessment_offerings() -> (
    List[certificate_assessment_domain.CertificateAssessmentOffering]
):
    """Returns all certificate assessment offerings from datastore.

    Returns:
        list(CertificateAssessmentOffering). A list of all certificate
        assessment offerings.
    """
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
