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

import collections
import datetime
import json
import math
import secrets
import sys

from core import feconf, utils
from core.constants import constants
from core.domain import (
    certificate_assessment_domain,
    classroom_config_services,
    question_fetchers,
    question_services,
    skill_fetchers,
    state_domain,
    topic_domain,
    topic_fetchers,
)
from core.platform import models
from core.storage.certificate_assessment import gae_models

from typing import Dict, List, Optional, Tuple, TypedDict, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, skill_models

transaction_services = models.Registry.import_transaction_services()
(skill_models,) = models.Registry.import_models([models.Names.SKILL])
datastore_services = models.Registry.import_datastore_services()

CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY: str = (
    constants.CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY
)
CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM: str = (
    constants.CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM
)
CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD: str = (
    constants.CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD
)
CERTIFICATE_ASSESSMENT_PASSING_SCORE_THRESHOLD: float = 80.0

# The order in which questions are sampled for a certificate attempt. Medium
# is sampled before easy and hard so that when multiple difficulties compete
# for the same questions, the core mastery evidence is claimed first.
CERTIFICATE_ASSESSMENT_DIFFICULTY_SAMPLING_ORDER: List[str] = [
    CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM,
    CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY,
    CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD,
]


class CertificateAssessmentOfferingValidationResultDict(TypedDict):
    """Dict representation of certificate offering validation results."""

    is_valid: bool
    validation_errors: Dict[str, Dict[str, Dict[str, int]]]
    validation_message: str


class CertificateAssessmentAttemptNotReadyException(Exception):
    """Raised when the certificate question pool is no longer valid."""

    pass


class CertificateAssessmentAttemptCooldownException(Exception):
    """Raised when a learner starts a new attempt during the cooldown window.

    The message here is server-side only and intentionally not user-facing
    English: the HTTP handler converts this into a structured response
    (I18N key + remaining_minutes) so the frontend can render a translated
    message via its translate pipes.
    """

    def __init__(self, remaining_minutes: int) -> None:
        super().__init__(
            'Assessment attempt blocked by cooldown; %d minute(s) remaining.'
            % remaining_minutes
        )
        self.remaining_minutes = remaining_minutes


class CertificateOfferingClassroomSummary(TypedDict):
    """Dict representation of a classroom-facing certificate offering."""

    certificate_id: str
    title: str
    attempt_status: str
    passed_on_date: Optional[float]
    failed_on_date: Optional[float]


def _get_topic_name_to_question_ids_map(
    topic_ids: List[str],
) -> tuple[Dict[str, List[str]], List[topic_domain.Topic]]:
    """Returns question IDs per topic and the fetched topics themselves."""
    # Build a deduplicated pool of question IDs per topic so we can detect
    # both per-topic shortages and cross-topic overlap later in validation.
    topic_id_to_question_ids: Dict[str, List[str]] = {}
    try:
        topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)
    except Exception as e:
        for topic_id in topic_ids:
            try:
                topic_fetchers.get_topic_by_id(topic_id, strict=True)
            except Exception as topic_error:
                raise utils.ValidationError(
                    'Topic %s does not exist.' % topic_id
                ) from topic_error
        raise utils.ValidationError(
            'One or more selected topics do not exist.'
        ) from e
    for topic_id, topic in zip(topic_ids, topics):
        assert topic is not None

        question_ids: set[str] = set()
        skill_models_list = skill_models.SkillModel.get_multi(
            topic.get_all_skill_ids()
        )
        for skill_model in skill_models_list:
            if skill_model is None:
                continue
            skill = skill_fetchers.get_skill_from_model(skill_model)
            question_ids.update(
                link.question_id
                for link in question_services.get_question_skill_links_of_skill(
                    skill_model.id, skill.description
                )
            )

        topic_id_to_question_ids[topic_id] = sorted(question_ids)
    return topic_id_to_question_ids, topics


def _get_difficulty_counts(total_questions: int) -> Dict[str, int]:
    """Distributes questions over medium, easy and hard in a repeating cycle."""
    # Spread required questions across difficulty buckets in a stable order so
    # the validator can compare each bucket against the available pool.
    counts = {
        CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY: 0,
        CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM: 0,
        CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD: 0,
    }
    # Keep this order stable. We intentionally start with medium, then easy,
    # then hard so the extra questions are biased toward the core mastery
    # evidence and discrimination buckets instead of over-allocating easy
    # questions.
    cycle = CERTIFICATE_ASSESSMENT_DIFFICULTY_SAMPLING_ORDER
    for index in range(total_questions):
        counts[cycle[index % len(cycle)]] += 1
    return counts


def get_required_questions_for_topic_share(
    total_questions_for_topic: int,
) -> Dict[str, int]:
    """Returns the validator-approved difficulty split for one topic share.

    Args:
        total_questions_for_topic: int. The number of questions assigned to
            one topic.

    Returns:
        dict. A mapping from difficulty label to the number of questions
        required for that difficulty.
    """
    return _get_difficulty_counts(total_questions_for_topic)


def _get_difficulty_label(skill_difficulty: float) -> str | None:
    """Returns the certificate difficulty label for a linked skill difficulty."""
    # Map persisted skill difficulty values into certificate buckets so the
    # validator can count available questions per difficulty.
    if (
        skill_difficulty
        == constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[
            constants.SKILL_DIFFICULTY_EASY
        ]
    ):
        return CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY
    if (
        skill_difficulty
        == constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[
            constants.SKILL_DIFFICULTY_MEDIUM
        ]
    ):
        return CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM
    if (
        skill_difficulty
        == constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[
            constants.SKILL_DIFFICULTY_HARD
        ]
    ):
        return CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD
    return None


def _get_topic_validation_result(
    available_questions_by_difficulty: Dict[str, int], required_questions: int
) -> Dict[str, Dict[str, int]]:
    """Returns the required/available breakdown for one topic."""
    required = _get_difficulty_counts(required_questions)
    return {
        CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY: {
            'required': required[CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY],
            'available': available_questions_by_difficulty[
                CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY
            ],
        },
        CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM: {
            'required': required[CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM],
            'available': available_questions_by_difficulty[
                CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM
            ],
        },
        CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD: {
            'required': required[CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD],
            'available': available_questions_by_difficulty[
                CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD
            ],
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
        # Find one more augmenting path so we can assign another distinct
        # question to each topic without reusing a question already claimed
        # by another topic.
        parent: Dict[str, str | None] = {source: None}
        queue: collections.deque[str] = collections.deque([source])
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
            previous = parent[node]
            assert previous is not None
            path_capacity = min(path_capacity, capacity_graph[previous][node])
            node = previous

        node = sink
        while parent[node] is not None:
            previous = parent[node]
            assert previous is not None
            capacity_graph[previous][node] -= path_capacity
            capacity_graph[node][previous] = (
                capacity_graph.get(node, {}).get(previous, 0) + path_capacity
            )
            node = previous

        flow += path_capacity
        if flow == total_required:
            return True

    return False


def _get_topic_question_ids_by_difficulty(
    topic_ids: List[str],
) -> Dict[str, Dict[str, List[str]]]:
    """Returns available question ids grouped by topic and difficulty."""
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)
    topic_id_to_question_ids_by_difficulty: Dict[str, Dict[str, set[str]]] = (
        collections.defaultdict(lambda: collections.defaultdict(set))
    )
    for topic_id, topic in zip(topic_ids, topics):
        skill_models_list = skill_models.SkillModel.get_multi(
            topic.get_all_skill_ids()
        )
        for skill_model in skill_models_list:
            if skill_model is None:
                continue
            skill = skill_fetchers.get_skill_from_model(skill_model)
            for (
                question_skill_link
            ) in question_services.get_question_skill_links_of_skill(
                skill_model.id, skill.description
            ):
                # Add the question to every difficulty bucket that any of its
                # linked skills produce, matching the validator's available
                # pool, so a validator-approved offering can always be picked.
                difficulty_label = _get_difficulty_label(
                    question_skill_link.skill_difficulty
                )
                if difficulty_label is None:
                    continue
                topic_id_to_question_ids_by_difficulty[topic_id][
                    difficulty_label
                ].add(question_skill_link.question_id)
    # Iterate over topic_ids (not the defaultdict's keys) so that every topic
    # gets an entry, even one with no question links, because _pick_questions
    # looks each topic up directly.
    return {
        topic_id: {
            difficulty_label: list(question_ids)
            for difficulty_label, question_ids in (
                topic_id_to_question_ids_by_difficulty.get(topic_id, {}).items()
            )
        }
        for topic_id in topic_ids
    }


def _pick_questions(
    topic_ids: List[str], total_questions: int
) -> List[Tuple[str, str]]:
    """Selects questions using the validator's topic and difficulty split."""
    secure_random = secrets.SystemRandom()
    topic_id_to_question_ids_by_difficulty = (
        _get_topic_question_ids_by_difficulty(topic_ids)
    )
    per_topic = total_questions // len(topic_ids)
    remainder = total_questions % len(topic_ids)
    selected_question_ids: List[Tuple[str, str]] = []
    used_question_ids: set[str] = set()
    for index, topic_id in enumerate(topic_ids):
        topic_share = per_topic + (1 if index < remainder else 0)
        difficulty_counts = get_required_questions_for_topic_share(topic_share)
        for difficulty in CERTIFICATE_ASSESSMENT_DIFFICULTY_SAMPLING_ORDER:
            available_question_ids = [
                question_id
                for question_id in topic_id_to_question_ids_by_difficulty[
                    topic_id
                ].get(difficulty, [])
                if question_id not in used_question_ids
            ]
            required_count = difficulty_counts[difficulty]
            if len(available_question_ids) < required_count:
                raise CertificateAssessmentAttemptNotReadyException()
            sampled_question_ids = secure_random.sample(
                available_question_ids, required_count
            )
            selected_question_ids.extend(
                (question_id, topic_id) for question_id in sampled_question_ids
            )
            used_question_ids.update(sampled_question_ids)
    return selected_question_ids


def _build_version_data(
    certificate_id: str,
    certificate_version: int,
    topic_ids: List[str],
    selected_questions: List[Tuple[str, str]],
) -> certificate_assessment_domain.CertificateAssessmentAttemptVersionDataDict:
    """Builds the version snapshot for a started attempt."""
    selected_question_ids = [
        question_id for question_id, _ in selected_questions
    ]
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)
    questions = question_fetchers.get_questions_by_ids(selected_question_ids)
    topic_versions: Dict[str, int] = {}
    for topic_id, topic in zip(topic_ids, topics):
        assert topic is not None
        topic_versions[topic_id] = topic.version

    question_versions: Dict[str, int] = {}
    for question_id, question in zip(selected_question_ids, questions):
        assert question is not None
        question_versions[question_id] = question.version
    return {
        'certificate_id': certificate_id,
        'certificate_version': certificate_version,
        'topic_versions': topic_versions,
        'question_versions': question_versions,
        'question_topic_links': {
            question_id: [topic_id]
            for question_id, topic_id in selected_questions
        },
    }


def _get_most_recent_attempt_for_learner_and_certificate(
    learner_id: str, certificate_id: str
) -> Optional[gae_models.CertificateAssessmentAttemptModel]:
    """Returns the learner's most recent attempt for a certificate, if any.

    Attempts are ordered by their creation time. We would prefer to sort by
    started_at, but that property is not indexed (see
    CertificateAssessmentAttemptModel.started_at) and Datastore cannot order
    by a computed expression such as IF(started_at, -started_at,
    -created_on), so started_at cannot be used as a query sort key. Since
    attempts are created when they start, creation order matches start order,
    so ordering by created_on yields the most recently started attempt.
    """
    return (
        gae_models.CertificateAssessmentAttemptModel.query(
            gae_models.CertificateAssessmentAttemptModel.learner_id
            == learner_id,
            gae_models.CertificateAssessmentAttemptModel.certificate_id
            == certificate_id,
        )
        .order(-gae_models.CertificateAssessmentAttemptModel.created_on)
        .get()
    )


def _get_certificate_assessment_attempt_model(
    attempt_id: str,
) -> gae_models.CertificateAssessmentAttemptModel:
    """Returns the attempt model with the given ID or raises.

    The underlying EntityNotFoundError includes the failing attempt ID, which
    helps server admins debug missing attempts, so it is chained to the
    raised error.

    Args:
        attempt_id: str. The ID of the attempt.

    Returns:
        CertificateAssessmentAttemptModel. The attempt model with the given ID.

    Raises:
        utils.ValidationError. If the attempt does not exist.
    """
    try:
        return gae_models.CertificateAssessmentAttemptModel.get(
            attempt_id, strict=True
        )
    except (
        gae_models.CertificateAssessmentAttemptModel.EntityNotFoundError
    ) as e:
        raise utils.ValidationError('Attempt does not exist.') from e


def _get_next_attempt_index_for_certificate(
    learner_id: str, certificate_id: str
) -> int:
    """Returns the next attempt index for a learner and a certificate.

    The index is 1-based and counts submitted attempts per learner and
    certificate. For example, learner A's first attempt at certificate A is
    index 1, learner B's first attempt at the same certificate is also index 1,
    and learner A's next attempt at certificate A is index 2.

    Args:
        learner_id: str. The learner submitting the attempt.
        certificate_id: str. The certificate being attempted.

    Returns:
        int. The next index to assign to the submitted attempt.
    """
    highest_submitted_attempt: Optional[
        gae_models.CertificateAssessmentAttemptModel
    ] = (
        gae_models.CertificateAssessmentAttemptModel.query(
            gae_models.CertificateAssessmentAttemptModel.learner_id
            == learner_id,
            gae_models.CertificateAssessmentAttemptModel.certificate_id
            == certificate_id,
            gae_models.CertificateAssessmentAttemptModel.is_submitted  # pylint: disable=singleton-comparison
            == True,
        )
        .order(-gae_models.CertificateAssessmentAttemptModel.attempt_index)
        .get()
    )
    if highest_submitted_attempt is None:
        return 1
    # Here we use cast because attempt_index is an IntegerProperty, which
    # mypy types as Any, so mypy cannot infer the result type of the
    # addition.
    return cast(int, highest_submitted_attempt.attempt_index) + 1


def start_certificate_assessment_attempt(
    certificate_id: str, learner_id: str
) -> Tuple[
    certificate_assessment_domain.CertificateAssessmentAttempt,
    List[Dict[str, Union[str, int]]],
]:
    """Starts a new DB-backed certificate assessment attempt.

    Args:
        certificate_id: str. The certificate assessment to start.
        learner_id: str. The learner starting the attempt.

    Returns:
        tuple(domain.CertificateAssessmentAttempt, list(dict)). The created
        attempt and the question/version payload for the client.

    Raises:
        CertificateAssessmentAttemptNotReadyException. If the assessment can no
            longer be started because the question pool is invalid.
        CertificateAssessmentAttemptCooldownException. If the learner started an attempt for this
            certificate less than MIN_TIME_BETWEEN_ATTEMPTS_IN_MINUTES minutes
            ago.
    """

    def _start_txn() -> Tuple[
        certificate_assessment_domain.CertificateAssessmentAttempt,
        List[Dict[str, Union[str, int]]],
    ]:
        most_recent_attempt = (
            _get_most_recent_attempt_for_learner_and_certificate(
                learner_id, certificate_id
            )
        )
        if most_recent_attempt is not None:
            cooldown = datetime.timedelta(
                minutes=(
                    certificate_assessment_domain.MIN_TIME_BETWEEN_ATTEMPTS_IN_MINUTES
                )
            )
            remaining_cooldown = cooldown - (
                datetime.datetime.utcnow() - most_recent_attempt.started_at
            )
            if remaining_cooldown > datetime.timedelta(seconds=0):
                # Round up so the reported wait never lapses before the actual
                # cooldown expires, and never drop below one minute.
                remaining_minutes = max(
                    1,
                    int(math.ceil(remaining_cooldown.total_seconds() / 60)),
                )
                raise CertificateAssessmentAttemptCooldownException(
                    remaining_minutes
                )
        attempt_model = gae_models.CertificateAssessmentAttemptModel.create(
            learner_id=learner_id,
            certificate_id=certificate_id,
            total_score=0.0,
            attempt_index=0,
            attempt_data={},
            # Here we use cast because the storage layer's create method
            # expects a loose dict for its JSON-backed version_data property,
            # while the domain layer exposes the strict version_data TypedDict.
            version_data=cast(
                Dict[
                    str,
                    gae_models.CertificateAssessmentAttemptVersionDataValue,
                ],
                version_data,
            ),
            started_at=datetime.datetime.utcnow(),
            finished_at=None,
            is_submitted=False,
        )
        attempt = _attempt_model_to_domain(attempt_model)
        attempt.validate()
        return (
            attempt,
            [
                {
                    'question_id': question_id,
                    'question_version': version_data['question_versions'][
                        question_id
                    ],
                }
                for question_id, _ in selected_questions
            ],
        )

    offering = get_certificate_assessment_offering(certificate_id)
    validation_result = validate_certificate_assessment_offering(
        offering.topic_ids, offering.total_questions
    )
    if not validation_result['is_valid']:
        update_certificate_assessment_offering(
            certificate_id=offering.certificate_id,
            title=offering.title,
            description=offering.description,
            classroom_id=offering.classroom_id,
            topic_ids=offering.topic_ids,
            total_questions=offering.total_questions,
            time_limit_in_minutes=offering.time_limit_in_minutes,
            demonstrates=offering.demonstrates,
            async_status='Blocked',
        )
        raise CertificateAssessmentAttemptNotReadyException(
            'Sorry, this assessment isn\'t ready anymore! We\'ve alerted the creator, and in the meantime you can try a different assessment.'
        )

    selected_questions = _pick_questions(
        offering.topic_ids, offering.total_questions
    )
    version_data = _build_version_data(
        certificate_id,
        offering.version,
        offering.topic_ids,
        selected_questions,
    )

    # Here we use cast because transaction_services is dynamically imported
    # from the platform layer, so mypy cannot infer the transaction's return
    # type from the generic run_in_transaction_wrapper.
    return cast(
        Tuple[
            certificate_assessment_domain.CertificateAssessmentAttempt,
            List[Dict[str, Union[str, int]]],
        ],
        transaction_services.run_in_transaction_wrapper(_start_txn)(),
    )


def _create_responses_in_attempt_entity_group(
    attempt_key: datastore_services.Key,
    response_dicts: List[gae_models.CertificateAssessmentResponseCreateDict],
) -> None:
    """Stores the submitted responses as children of the attempt.

    The responses are persisted as children of the attempt, one entity per
    question keyed by the question ID, so the attempt and all of its responses
    belong to a single entity group. A retried submission therefore overwrites
    the same response entities instead of creating duplicates.

    Args:
        attempt_key: Key. The key of the attempt the responses belong to.
        response_dicts: list(dict). The validated response dicts to store.
    """
    gae_models.CertificateAssessmentResponseModel.create_multi(
        attempt_key=attempt_key, response_dicts=response_dicts
    )


def _build_question_response(
    attempt_id: str,
    question_id: str,
    question_version: int,
    answer: Dict[str, Union[state_domain.AcceptableCorrectAnswerTypes, bool]],
) -> Tuple[gae_models.CertificateAssessmentResponseCreateDict, bool]:
    """Builds and validates the stored response for one submitted question.

    The learner's answer is serialized to a string before storage because the
    response model stores selected_answer as a string: None (unanswered
    questions) becomes an empty string, strings are kept as-is, and ints,
    dicts and lists (the other interaction answer types) are JSON-encoded.
    The resulting response is validated before it is returned, so malformed
    or oversized answers never reach the Datastore.

    Args:
        attempt_id: str. The ID of the attempt being submitted.
        question_id: str. The ID of the question.
        question_version: int. The version of the question in the attempt.
        answer: dict. The submitted answer dict for the question, which is
            empty when the learner did not answer the question.

    Returns:
        tuple. A tuple containing the validated response dict and whether
        the answer was correct.
    """
    selected_answer = answer.get('selected_answer')
    is_correct = bool(answer.get('is_correct', False))
    serialized_selected_answer = (
        ''
        if selected_answer is None
        else (
            selected_answer
            if isinstance(selected_answer, str)
            else json.dumps(selected_answer)
        )
    )
    response = certificate_assessment_domain.CertificateAssessmentResponse(
        attempt_id=attempt_id,
        question_id=question_id,
        question_version=question_version,
        selected_answer=serialized_selected_answer,
        is_correct=is_correct,
    )
    response.validate()
    return response.to_dict(), is_correct


def submit_certificate_assessment_attempt(
    attempt_id: str,
    answers: List[
        Dict[str, Union[state_domain.AcceptableCorrectAnswerTypes, bool]]
    ],
) -> certificate_assessment_domain.CertificateAssessmentAttempt:
    """Records a submitted attempt using the client-computed correctness flags.

    Answer correctness is determined by the frontend's answer-classification
    rules (the same rules the exploration player and question player use), so
    the backend stores the learner's answer and the client-computed is_correct
    flag without re-evaluating the answer server-side.

    Args:
        attempt_id: str. The ID of the attempt being submitted.
        answers: list(dict). The submitted answers, each with a question_id, a
            selected_answer whose type depends on the question's interaction
            (str, int, Dict[str, str], List[str], or List[List[str]]), and an
            is_correct flag computed by the client's answer classification.

    Returns:
        CertificateAssessmentAttempt. The updated submitted attempt.

    Raises:
        utils.ValidationError. If the attempt does not exist or has already
            been submitted.
    """
    attempt_model = _get_certificate_assessment_attempt_model(attempt_id)

    answers_by_question_id = {
        answer['question_id']: answer for answer in answers
    }
    question_versions = attempt_model.version_data['question_versions']
    question_topic_links = attempt_model.version_data['question_topic_links']
    responses: List[gae_models.CertificateAssessmentResponseCreateDict] = []
    attempt_data: Dict[str, Dict[str, int]] = collections.defaultdict(
        lambda: {
            'total_related_questions': 0,
            'total_correct_questions': 0,
        }
    )
    correct_count = 0
    for question_id, question_version in question_versions.items():
        response_dict, is_correct = _build_question_response(
            attempt_id,
            question_id,
            question_version,
            answers_by_question_id.get(question_id, {}),
        )
        responses.append(response_dict)
        if is_correct:
            correct_count += 1
        for topic_id in question_topic_links.get(question_id, []):
            attempt_data[topic_id]['total_related_questions'] += 1
            if is_correct:
                attempt_data[topic_id]['total_correct_questions'] += 1

    def _submit_txn() -> (
        certificate_assessment_domain.CertificateAssessmentAttempt
    ):
        # Re-fetch inside the transaction so that the submitted check and the
        # writes are atomic, and responses cannot be left behind for an
        # unsubmitted attempt.
        attempt_model = _get_certificate_assessment_attempt_model(attempt_id)
        if attempt_model.is_submitted:
            raise utils.ValidationError(
                'This assessment has already been submitted.'
            )
        attempt_model.attempt_index = _get_next_attempt_index_for_certificate(
            attempt_model.learner_id,
            attempt_model.certificate_id,
        )
        _create_responses_in_attempt_entity_group(attempt_model.key, responses)
        attempt_model.attempt_data = dict(attempt_data)
        attempt_model.total_score = (
            float(correct_count) / float(len(question_versions)) * 100.0
            if question_versions
            else 0.0
        )
        attempt_model.finished_at = datetime.datetime.utcnow()
        attempt_model.is_submitted = True
        attempt = _attempt_model_to_domain(attempt_model)
        attempt.validate()
        attempt_model.update_timestamps()
        attempt_model.put()
        return attempt

    # Here we use cast because transaction_services is dynamically imported
    # from the platform layer, so mypy cannot infer the transaction's return
    # type from the generic run_in_transaction_wrapper.
    return cast(
        certificate_assessment_domain.CertificateAssessmentAttempt,
        transaction_services.run_in_transaction_wrapper(_submit_txn)(),
    )


def get_question_state_data_for_assessment_attempt(
    learner_id: str,
    attempt_id: str,
    question_id: str,
) -> state_domain.StateDict:
    """Returns pinned question state data for an in-progress attempt.

    Args:
        learner_id: str. The ID of the learner requesting the question.
        attempt_id: str. The ID of the active assessment attempt.
        question_id: str. The ID of the question to fetch.

    Returns:
        dict. The pinned question state data for the requested question, with
        the interaction solution and hints removed so the learner cannot see
        the answer before submitting the assessment.

    Raises:
        utils.ValidationError. If the attempt does not exist, does not belong
            to the learner, has already been submitted, or does not contain
            the requested question.
    """
    attempt_model = _get_certificate_assessment_attempt_model(attempt_id)
    if attempt_model.learner_id != learner_id:
        raise utils.ValidationError(
            'This attempt does not belong to the current learner.'
        )
    if attempt_model.is_submitted:
        raise utils.ValidationError(
            'This assessment has already been submitted.'
        )

    question_version = attempt_model.version_data['question_versions'].get(
        question_id
    )
    if question_version is None:
        raise utils.ValidationError('Question is not part of this attempt.')
    question = question_services.get_question_by_id_and_version(
        question_id, question_version
    )
    question_state_data = question.question_state_data.to_dict()
    # Do not leak the solution (including correct_answer) or hints to the
    # learner while the assessment is still in progress.
    question_state_data['interaction']['solution'] = None
    question_state_data['interaction']['hints'] = []
    return question_state_data


def validate_certificate_assessment_offering(
    topic_ids: List[str], total_questions: int
) -> CertificateAssessmentOfferingValidationResultDict:
    """Pre-validates whether a certificate offering can be created.

    Args:
        topic_ids: list(str). The selected topic IDs for the certificate.
        total_questions: int. The total number of questions requested.

    Returns:
        dict. Contains is_valid, validation_errors and validation_message.

        The validation checks three things:
        - Each selected topic exists and has enough questions in every
          difficulty bucket for its share of the requested total.
        - The combined set of questions across the selected topics is large
          enough to satisfy the requested total without reusing questions.
        - The selected topics can be assigned distinct questions per
          difficulty so a certificate can be built without overlaps between
          topics.
    """
    if not topic_ids:
        raise utils.ValidationError(
            'topic_ids must contain at least one topic.'
        )
    if total_questions < 1:
        raise utils.ValidationError(
            'total_questions must be a positive integer.'
        )

    topic_name_to_question_ids_map, topics = (
        _get_topic_name_to_question_ids_map(topic_ids)
    )
    base_questions_per_topic = total_questions // len(topic_ids)
    remainder = total_questions % len(topic_ids)

    validation_errors: Dict[str, Dict[str, Dict[str, int]]] = {}
    message_parts: List[str] = []
    is_valid = True
    required_questions_by_topic: Dict[str, Dict[str, int]] = {}
    topic_id_to_question_ids_by_difficulty: Dict[str, Dict[str, set[str]]] = {}
    topic_id_to_name: Dict[str, str] = {}

    expected_total_questions = len(topic_ids) * constants.QUESTIONS_PER_TOPIC
    if total_questions < expected_total_questions:
        is_valid = False
        message_parts.append(
            'total_questions must be greater than or equal to %d '
            '(%d per topic: easy, medium, hard) for %d topic(s).'
            % (
                expected_total_questions,
                constants.QUESTIONS_PER_TOPIC,
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

    for index, (topic_id, topic) in enumerate(zip(topic_ids, topics)):
        required_questions = base_questions_per_topic + (
            1 if index < remainder else 0
        )
        required_questions_by_topic[topic_id] = _get_difficulty_counts(
            required_questions
        )
        topic_id_to_name[topic_id] = (
            topic.name if topic is not None else topic_id
        )
        available_question_ids_by_difficulty: Dict[str, set[str]] = {
            CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY: set(),
            CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM: set(),
            CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD: set(),
        }
        if topic is not None:
            skill_models_list = skill_models.SkillModel.get_multi(
                topic.get_all_skill_ids()
            )
            for skill_model in skill_models_list:
                if skill_model is None:
                    continue
                skill = skill_fetchers.get_skill_from_model(skill_model)
                for (
                    question_skill_link
                ) in question_services.get_question_skill_links_of_skill(
                    skill_model.id, skill.description
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
            available_questions_by_difficulty[
                CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY
            ]
            >= validation_result[CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY][
                'required'
            ]
            and available_questions_by_difficulty[
                CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM
            ]
            >= validation_result[CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM][
                'required'
            ]
            and available_questions_by_difficulty[
                CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD
            ]
            >= validation_result[CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD][
                'required'
            ]
        ):
            is_valid = False
            message_parts.append(
                '%s does not have enough questions in every difficulty bucket.'
                % topic_id_to_name[topic_id]
            )

    missing_distinct_difficulties: List[str] = []
    for difficulty in (
        CERTIFICATE_ASSESSMENT_DIFFICULTY_EASY,
        CERTIFICATE_ASSESSMENT_DIFFICULTY_MEDIUM,
        CERTIFICATE_ASSESSMENT_DIFFICULTY_HARD,
    ):
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


def get_certificate_assessment_attempt(
    attempt_id: str,
) -> certificate_assessment_domain.CertificateAssessmentAttempt:
    """Returns the attempt with the given ID.

    Args:
        attempt_id: str. The ID of the attempt.

    Returns:
        CertificateAssessmentAttempt. The attempt with the given ID.

    Raises:
        utils.ValidationError. If the attempt does not exist.
    """
    attempt_model = _get_certificate_assessment_attempt_model(attempt_id)
    return _attempt_model_to_domain(attempt_model)


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


def get_certificate_assessment_offerings_by_ids(
    certificate_ids: List[str],
) -> Dict[str, certificate_assessment_domain.CertificateAssessmentOffering]:
    """Returns a mapping from certificate ID to certificate assessment offering.

    Args:
        certificate_ids: list(str). The IDs of the certificate assessment
            offerings to fetch.

    Returns:
        dict(str, CertificateAssessmentOffering). A mapping from each requested
        certificate ID to its certificate assessment offering. Only IDs for
        which an offering exists are included in the mapping.
    """
    certificate_assessment_offering_models = (
        gae_models.CertificateAssessmentOfferingModel.get_multi(certificate_ids)
    )
    offerings_by_id: Dict[
        str, certificate_assessment_domain.CertificateAssessmentOffering
    ] = {}
    for certificate_id, certificate_assessment_offering_model in zip(
        certificate_ids, certificate_assessment_offering_models
    ):
        if certificate_assessment_offering_model is None:
            continue
        offerings_by_id[certificate_id] = _model_to_domain(
            certificate_assessment_offering_model
        )
    return offerings_by_id


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


class CertificateAssessmentAttemptNotFoundException(Exception):
    """Exception raised when a certificate assessment attempt is missing."""

    pass


def _attempt_model_to_domain(
    attempt_model: gae_models.CertificateAssessmentAttemptModel,
) -> certificate_assessment_domain.CertificateAssessmentAttempt:
    """Converts a certificate assessment attempt storage model to a domain
    object.

    Args:
        attempt_model: CertificateAssessmentAttemptModel. The storage model
            to convert.

    Returns:
        CertificateAssessmentAttempt. The corresponding domain object.
    """
    return certificate_assessment_domain.CertificateAssessmentAttempt(
        attempt_id=attempt_model.id,
        learner_id=attempt_model.learner_id,
        total_score=attempt_model.total_score,
        attempt_index=attempt_model.attempt_index,
        attempt_data=attempt_model.attempt_data,
        version_data=attempt_model.version_data,
        started_at=attempt_model.started_at,
        finished_at=attempt_model.finished_at,
        is_submitted=attempt_model.is_submitted,
    )


def get_certificate_attempt(
    attempt_id: str,
) -> certificate_assessment_domain.CertificateAssessmentAttempt:
    """Returns a single certificate assessment attempt with full result data.

    Args:
        attempt_id: str. The ID of the certificate assessment attempt.

    Returns:
        CertificateAssessmentAttempt. The attempt with the given ID,
        including its score and per-topic result data.

    Raises:
        CertificateAssessmentAttemptNotFoundException. The attempt does not
            exist.
    """
    attempt_model = gae_models.CertificateAssessmentAttemptModel.get_by_id(
        attempt_id
    )
    if attempt_model is None:
        raise CertificateAssessmentAttemptNotFoundException(
            'Certificate assessment attempt %s does not exist.' % attempt_id
        )

    return _attempt_model_to_domain(attempt_model)


def get_certificate_attempts(
    learner_id: str,
) -> List[certificate_assessment_domain.CertificateAssessmentAttempt]:
    """Returns all certificate assessment attempts for a learner.

    Args:
        learner_id: str. The ID of the learner.

    Returns:
        list(CertificateAssessmentAttempt). All attempts made by the learner,
        ordered by attempt_index.
    """
    attempt_models: List[
        gae_models.CertificateAssessmentAttemptModel
        # Here we use cast because the datastore fetch returns a generic sequence and
        # mypy cannot infer the concrete CertificateAssessmentAttemptModel item
        # type from this storage-layer API.
    ] = cast(
        List[gae_models.CertificateAssessmentAttemptModel],
        gae_models.CertificateAssessmentAttemptModel.query(
            gae_models.CertificateAssessmentAttemptModel.learner_id
            == learner_id
        )
        .order(gae_models.CertificateAssessmentAttemptModel.attempt_index)
        .fetch(),
    )
    return [
        _attempt_model_to_domain(attempt_model)
        for attempt_model in attempt_models
    ]


def get_certificate_offerings_for_classroom(
    classroom_url_fragment: str, learner_id: str
) -> List[CertificateOfferingClassroomSummary]:
    """Fetches certificate offerings for a classroom, available to a learner.

    Args:
        classroom_url_fragment: str. The URL fragment of the classroom to
            fetch offerings for.
        learner_id: str. The ID of the learner to filter attempts by.

    Returns:
        list(CertificateOfferingClassroomSummary). A list of certificate
        offering summaries with attempt status for the given learner.
    """
    classroom = classroom_config_services.get_classroom_by_url_fragment(
        classroom_url_fragment
    )
    if classroom is None:
        return []

    certificate_assessment_offering_models: List[
        gae_models.CertificateAssessmentOfferingModel
        # Here we use cast because .fetch() returns a generic list,
        # but we need a typed list for the type checker.
    ] = cast(
        List[gae_models.CertificateAssessmentOfferingModel],
        gae_models.CertificateAssessmentOfferingModel.query(
            gae_models.CertificateAssessmentOfferingModel.classroom_id
            == classroom.classroom_id,
            gae_models.CertificateAssessmentOfferingModel.async_status
            == 'Available',
        ).fetch(),
    )
    certificate_assessment_offering_models.sort(
        key=lambda offering_model: str(offering_model.title.lower())
    )
    if not certificate_assessment_offering_models:
        return []

    certificate_ids = [
        offering_model.id
        for offering_model in certificate_assessment_offering_models
    ]
    # Here we use cast because .fetch() returns a generic list,
    # but we need a typed list for the type checker.
    attempt_models: List[gae_models.CertificateAssessmentAttemptModel] = cast(
        List[gae_models.CertificateAssessmentAttemptModel],
        gae_models.CertificateAssessmentAttemptModel.query(
            gae_models.CertificateAssessmentAttemptModel.learner_id
            == learner_id,
            gae_models.CertificateAssessmentAttemptModel.certificate_id.IN(
                certificate_ids
            ),
            gae_models.CertificateAssessmentAttemptModel.is_submitted  # pylint: disable=singleton-comparison
            == True,
        ).fetch(),
    )

    latest_attempt_by_certificate_id: Dict[
        str, gae_models.CertificateAssessmentAttemptModel
    ] = {}
    for attempt_model in attempt_models:
        certificate_id = getattr(attempt_model, 'certificate_id', None)
        if certificate_id is None:
            certificate_id = attempt_model.version_data['certificate_id']
        if certificate_id not in certificate_ids:
            continue
        existing_attempt_model = latest_attempt_by_certificate_id.get(
            certificate_id
        )
        if existing_attempt_model is None:
            latest_attempt_by_certificate_id[certificate_id] = attempt_model
            continue
        if attempt_model.attempt_index > existing_attempt_model.attempt_index:
            latest_attempt_by_certificate_id[certificate_id] = attempt_model
            continue
        if (
            attempt_model.attempt_index == existing_attempt_model.attempt_index
            and attempt_model.finished_at is not None
            and (
                existing_attempt_model.finished_at is None
                or attempt_model.finished_at
                > existing_attempt_model.finished_at
            )
        ):
            latest_attempt_by_certificate_id[certificate_id] = attempt_model

    certificate_offerings: List[CertificateOfferingClassroomSummary] = []
    for offering_model in certificate_assessment_offering_models:
        latest_attempt = latest_attempt_by_certificate_id.get(offering_model.id)
        if latest_attempt is None:
            attempt_status = 'Not Attempted'
        elif (
            latest_attempt.total_score
            >= CERTIFICATE_ASSESSMENT_PASSING_SCORE_THRESHOLD
        ):
            attempt_status = 'Passed'
        else:
            attempt_status = 'Not Passed'
        passed_on_date: Optional[float] = None
        failed_on_date: Optional[float] = None
        if (
            latest_attempt is not None
            and latest_attempt.finished_at is not None
        ):
            if attempt_status == 'Passed':
                passed_on_date = utils.get_time_in_millisecs(
                    latest_attempt.finished_at
                )
            else:
                failed_on_date = utils.get_time_in_millisecs(
                    latest_attempt.finished_at
                )
        certificate_offerings.append(
            {
                'certificate_id': offering_model.id,
                'title': offering_model.title,
                'attempt_status': attempt_status,
                'passed_on_date': passed_on_date,
                'failed_on_date': failed_on_date,
            }
        )
    return certificate_offerings
