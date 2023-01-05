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

"""Getter commands for for skill models."""

from __future__ import annotations

import copy

from core import feconf
from core.domain import caching_services
from core.domain import skill_domain
from core.platform import models

from typing import List, Literal, Optional, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import skill_models

(skill_models,) = models.Registry.import_models([models.Names.SKILL])


def get_multi_skills(
    skill_ids: List[str],
    strict: bool = True
) -> List[skill_domain.Skill]:
    """Returns a list of skills matching the skill IDs provided.

    Args:
        skill_ids: list(str). List of skill IDs to get skills for.
        strict: bool. Whether to raise an error if a skill doesn't exist.

    Returns:
        list(Skill). The list of skills matching the provided IDs.

    Raises:
        Exception. No skill exists for given ID.
    """
    local_skill_models = skill_models.SkillModel.get_multi(skill_ids)
    for skill_id, skill_model in zip(skill_ids, local_skill_models):
        if strict and skill_model is None:
            raise Exception('No skill exists for ID %s' % skill_id)
    skills = [
        get_skill_from_model(skill_model)
        for skill_model in local_skill_models
        if skill_model is not None]
    return skills


@overload
def get_skill_by_id(
    skill_id: str,
) -> skill_domain.Skill: ...


@overload
def get_skill_by_id(
    skill_id: str,
    *,
    version: Optional[int] = None
) -> skill_domain.Skill: ...


@overload
def get_skill_by_id(
    skill_id: str,
    *,
    strict: Literal[True],
    version: Optional[int] = None
) -> skill_domain.Skill: ...


@overload
def get_skill_by_id(
    skill_id: str,
    *,
    strict: Literal[False],
    version: Optional[int] = None
) -> Optional[skill_domain.Skill]: ...


def get_skill_by_id(
    skill_id: str,
    strict: bool = True,
    version: Optional[int] = None
) -> Optional[skill_domain.Skill]:
    """Returns a domain object representing a skill.

    Args:
        skill_id: str. ID of the skill.
        strict: bool. Whether to fail noisily if no skill with the given
            id exists in the datastore.
        version: int or None. The version number of the skill to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Skill or None. The domain object representing a skill with the
        given id, or None if it does not exist.
    """
    sub_namespace = str(version) if version else None
    cached_skill = caching_services.get_multi(
        caching_services.CACHE_NAMESPACE_SKILL,
        sub_namespace,
        [skill_id]).get(skill_id)

    if cached_skill is not None:
        return cached_skill
    else:
        skill_model = skill_models.SkillModel.get(
            skill_id, strict=strict, version=version)
        if skill_model:
            skill = get_skill_from_model(skill_model)
            caching_services.set_multi(
                caching_services.CACHE_NAMESPACE_SKILL,
                sub_namespace,
                {skill_id: skill})
            return skill
        else:
            return None


def get_skill_from_model(
    skill_model: skill_models.SkillModel
) -> skill_domain.Skill:
    """Returns a skill domain object given a skill model loaded
    from the datastore.

    Args:
        skill_model: SkillModel. The skill model loaded from the datastore.

    Returns:
        skill. A Skill domain object corresponding to the given skill model.
    """

    # Ensure the original skill model does not get altered.
    versioned_skill_contents: skill_domain.VersionedSkillContentsDict = {
        'schema_version': skill_model.skill_contents_schema_version,
        'skill_contents': copy.deepcopy(skill_model.skill_contents)
    }

    versioned_misconceptions: skill_domain.VersionedMisconceptionDict = {
        'schema_version': skill_model.misconceptions_schema_version,
        'misconceptions': copy.deepcopy(skill_model.misconceptions)
    }

    versioned_rubrics: skill_domain.VersionedRubricDict = {
        'schema_version': skill_model.rubric_schema_version,
        'rubrics': copy.deepcopy(skill_model.rubrics)
    }

    # Migrate the skill if it is not using the latest schema version.
    if (skill_model.skill_contents_schema_version !=
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        _migrate_skill_contents_to_latest_schema(versioned_skill_contents)

    if (skill_model.misconceptions_schema_version !=
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        _migrate_misconceptions_to_latest_schema(versioned_misconceptions)

    if (skill_model.rubric_schema_version !=
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
        _migrate_rubrics_to_latest_schema(versioned_rubrics)

    return skill_domain.Skill(
        skill_model.id, skill_model.description,
        [
            skill_domain.Misconception.from_dict(misconception)
            for misconception in versioned_misconceptions['misconceptions']
        ], [
            skill_domain.Rubric.from_dict(rubric)
            for rubric in versioned_rubrics['rubrics']
        ], skill_domain.SkillContents.from_dict(
            versioned_skill_contents['skill_contents']),
        versioned_misconceptions['schema_version'],
        versioned_rubrics['schema_version'],
        versioned_skill_contents['schema_version'],
        skill_model.language_code,
        skill_model.version, skill_model.next_misconception_id,
        skill_model.superseding_skill_id, skill_model.all_questions_merged,
        skill_model.prerequisite_skill_ids, skill_model.created_on,
        skill_model.last_updated)


def get_skill_by_description(description: str) -> Optional[skill_domain.Skill]:
    """Returns a domain object representing a skill.

    Args:
        description: str. The description of the skill.

    Returns:
        Skill or None. The domain object representing a skill with the
        given description, or None if it does not exist.
    """
    skill_model = (
        skill_models.SkillModel.get_by_description(description))
    return get_skill_from_model(skill_model) if skill_model else None


def _migrate_skill_contents_to_latest_schema(
    versioned_skill_contents: skill_domain.VersionedSkillContentsDict
) -> None:
    """Holds the responsibility of performing a step-by-step, sequential update
    of the skill contents structure based on the schema version of the input
    skill contents dictionary. If the current skill_contents schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_skill_contents: dict. A dict with two keys:
            - schema_version: int. The schema version for the skill_contents
                dict.
            - skill_contents: dict. The dict comprising the skill contents.

    Raises:
        Exception. The schema version of the skill_contents is outside of what
            is supported at present.
    """
    skill_contents_schema_version = versioned_skill_contents['schema_version']
    if not (1 <= skill_contents_schema_version
            <= feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d skill schemas at '
            'present.' % feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)

    while (skill_contents_schema_version <
           feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        skill_domain.Skill.update_skill_contents_from_model(
            versioned_skill_contents, skill_contents_schema_version)
        skill_contents_schema_version += 1


def _migrate_misconceptions_to_latest_schema(
    versioned_misconceptions: skill_domain.VersionedMisconceptionDict
) -> None:
    """Holds the responsibility of performing a step-by-step, sequential update
    of the misconceptions structure based on the schema version of the input
    misconceptions dictionary. If the current misconceptions schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_misconceptions: dict. A dict with two keys:
            - schema_version: int. The schema version for the misconceptions
                dict.
            - misconceptions: list(dict). The list of dicts comprising the skill
                misconceptions.

    Raises:
        Exception. The schema version of misconceptions is outside of what
            is supported at present.
    """
    misconception_schema_version = versioned_misconceptions['schema_version']
    if not (1 <= misconception_schema_version
            <= feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d misconception schemas at '
            'present.' % feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)

    while (misconception_schema_version <
           feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        skill_domain.Skill.update_misconceptions_from_model(
            versioned_misconceptions, misconception_schema_version)
        misconception_schema_version += 1


def _migrate_rubrics_to_latest_schema(
    versioned_rubrics: skill_domain.VersionedRubricDict
) -> None:
    """Holds the responsibility of performing a step-by-step, sequential update
    of the rubrics structure based on the schema version of the input
    rubrics dictionary. If the current rubrics schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_rubrics: dict. A dict with two keys:
            - schema_version: int. The schema version for the rubrics dict.
            - rubrics: list(dict). The list of dicts comprising the skill
                rubrics.

    Raises:
        Exception. The schema version of rubrics is outside of what is supported
            at present.
    """
    rubric_schema_version = versioned_rubrics['schema_version']
    if not (1 <= rubric_schema_version
            <= feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d rubric schemas at '
            'present.' % feconf.CURRENT_RUBRIC_SCHEMA_VERSION)

    while (rubric_schema_version <
           feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
        skill_domain.Skill.update_rubrics_from_model(
            versioned_rubrics, rubric_schema_version)
        rubric_schema_version += 1
