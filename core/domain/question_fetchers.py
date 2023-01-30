# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

"""Getter commands for for question models."""

from __future__ import annotations

import copy

from core import feconf
from core.domain import question_domain
from core.domain import state_domain
from core.platform import models

from typing import List, Optional, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import question_models
    from mypy_imports import skill_models

(question_models, skill_models) = models.Registry.import_models(
    [models.Names.QUESTION, models.Names.SKILL])


QuestionAndSkillDescriptionsType = Tuple[
    List[Optional[question_domain.Question]],
    List[List[Optional[str]]]
]


def get_questions_and_skill_descriptions_by_skill_ids(
    question_count: int,
    skill_ids: List[str],
    offset: int
) -> QuestionAndSkillDescriptionsType:
    """Returns the questions linked to the given skill ids.

    Args:
        question_count: int. The number of questions to return.
        skill_ids: list(str). The ID of the skills to which the questions are
            linked.
        offset: int. Number of query results to skip.

    Returns:
        list(Question|None), list(list(str|None)). The list of questions, and
        the corresponding linked skill descriptions which are linked to the
        given skill ids and None when skill are not available.
    """
    if not skill_ids:
        return [], []

    question_skill_link_models = (
        question_models.QuestionSkillLinkModel
        .get_question_skill_links_by_skill_ids(
            question_count, skill_ids, offset))
    question_ids = []
    grouped_skill_ids = []
    grouped_skill_descriptions = []
    for question_skill_link in question_skill_link_models:
        if question_skill_link.question_id not in question_ids:
            question_ids.append(question_skill_link.question_id)
            grouped_skill_ids.append([question_skill_link.skill_id])
        else:
            grouped_skill_ids[-1].append(question_skill_link.skill_id)

    for skill_ids_list in grouped_skill_ids:
        skills = skill_models.SkillModel.get_multi(skill_ids_list)
        grouped_skill_descriptions.append(
            [skill.description if skill else None for skill in skills])

    questions = get_questions_by_ids(question_ids)
    return questions, grouped_skill_descriptions


def get_questions_by_ids(
    question_ids: List[str]
) -> List[Optional[question_domain.Question]]:
    """Returns a list of domain objects representing questions.

    Args:
        question_ids: list(str). List of question ids.

    Returns:
        list(Question|None). A list of domain objects representing questions
        with the given ids or None when the id is not valid.
    """
    question_model_list = question_models.QuestionModel.get_multi(question_ids)
    questions: List[Optional[question_domain.Question]] = []
    for question_model in question_model_list:
        if question_model is not None:
            questions.append(get_question_from_model(question_model))
        else:
            questions.append(None)
    return questions


def get_question_from_model(
    question_model: question_models.QuestionModel
) -> question_domain.Question:
    """Returns domain object representing the given question model.

    Args:
        question_model: QuestionModel. The question model loaded from the
            datastore.

    Returns:
        Question. The domain object representing the question model.
    """

    # Ensure the original question model does not get altered.
    versioned_question_state: question_domain.VersionedQuestionStateDict = {
        'state_schema_version': (
            question_model.question_state_data_schema_version),
        'state': copy.deepcopy(
            question_model.question_state_data)
    }

    # Migrate the question if it is not using the latest schema version.
    if (question_model.question_state_data_schema_version !=
            feconf.CURRENT_STATE_SCHEMA_VERSION):
        _migrate_state_schema(versioned_question_state)

    return question_domain.Question(
        question_model.id,
        state_domain.State.from_dict(
            versioned_question_state['state'], validate=False),
        versioned_question_state['state_schema_version'],
        question_model.language_code, question_model.version,
        question_model.linked_skill_ids,
        question_model.inapplicable_skill_misconception_ids,
        question_model.created_on, question_model.last_updated)


def _migrate_state_schema(
    versioned_question_state: question_domain.VersionedQuestionStateDict
) -> None:
    """Holds the responsibility of performing a step-by-step, sequential update
    of the state structure based on the schema version of the input
    state dictionary. If the current State schema changes, a new
    conversion function must be added and some code appended to this function
    to account for that new version.

    Args:
        versioned_question_state: dict. A dict with two keys:
            state_schema_version: int. the state schema version for the
                question.
            state: The State domain object representing the question
                state data.

    Raises:
        Exception. The given state_schema_version is invalid.
    """
    state_schema_version = versioned_question_state[
        'state_schema_version']
    if state_schema_version is None or state_schema_version < 1:
        state_schema_version = 0

    if not (25 <= state_schema_version
            <= feconf.CURRENT_STATE_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v25-v%d state schemas at present.' %
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    while state_schema_version < feconf.CURRENT_STATE_SCHEMA_VERSION:
        question_domain.Question.update_state_from_model(
            versioned_question_state, state_schema_version)
        state_schema_version += 1
