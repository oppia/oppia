# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Functions for retrieving voiceovers."""

from __future__ import annotations

import json
import os

from core import feconf
from core import utils
from core.domain import state_domain
from core.domain import voiceover_domain
from core.platform import models

from typing import Dict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


def _get_entity_voiceovers_from_model(
    entity_voiceovers_model: voiceover_models.EntityVoiceoversModel
) -> voiceover_domain.EntityVoiceovers:
    """Returns the EntityVoiceovers domain object from its model representation
    (EntityVoiceoversModel).

    Args:
        entity_voiceovers_model: EntityVoiceoversModel. An instance of
            EntityVoiceoversModel.

    Returns:
        EntityVoiceovers. An instance of EntityVoiceovers object, created from
        its model.
    """
    content_id_to_voiceovers_dict = {}
    for content_id, voiceover_type_to_voiceover_dict in (
            entity_voiceovers_model.voiceovers.items()):
        content_id_to_voiceovers_dict[content_id] = {
            voiceover_type: state_domain.Voiceover.from_dict(
                    voiceover_type_to_voiceover_dict[voiceover_type.value])
                for voiceover_type in feconf.VoiceoverType
        }

    entity_voiceovers_instance = voiceover_domain.EntityVoiceovers(
        entity_id=entity_voiceovers_model.entity_id,
        entity_type=entity_voiceovers_model.entity_type,
        entity_version=entity_voiceovers_model.entity_version,
        language_accent_code=entity_voiceovers_model.language_accent_code,
        voiceovers=content_id_to_voiceovers_dict
    )
    return entity_voiceovers_instance


def get_voiceovers_for_given_language_accent_code(
    entity_type: str,
    entity_id: str,
    entity_version: int,
    language_accent_code: str
) -> voiceover_domain.EntityVoiceovers:
    """Returns a unique entity voiceovers domain object.

    Args:
        entity_type: str. The type of the entity.
        entity_id: str. The ID of the entity.
        entity_version: int. The version of the entity.
        language_accent_code: str. The language-accent code of the voiceover.

    Returns:
        EntityVoiceovers. An instance of entity voiceover.
    """
    entity_voiceovers_model = (
        voiceover_models.EntityVoiceoversModel.get_model(
            entity_type, entity_id, entity_version, language_accent_code))

    if entity_voiceovers_model:
        return _get_entity_voiceovers_from_model(
            entity_voiceovers_model)
    return voiceover_domain.EntityVoiceovers.create_empty(
        entity_type=entity_type,
        entity_id=entity_id,
        entity_version=entity_version,
        language_accent_code=language_accent_code)


# NOTE TO DEVELOPERS: The method is not ready for use since the corresponding
# model does not contain any data yet. Issue #19590 tracks the changes required
# in order to use this function.
def get_all_language_accent_codes_for_voiceovers(
) -> Dict[str, Dict[str, bool]]:
    """Returns all language-accent codes which are supported by
    Oppia's voiceovers.

    Returns:
        Dict[str, Dict[str, bool]]. Returns a dict with language_codes as keys
        and nested dicts as values. Each nested dict contains
        language_accent_codes as keys and booleans indicating whether it's
        possible to generate automatic voiceovers for this language-accent code
        as values.
    """

    voiceover_autogeneration_policy_model = (
        voiceover_models.VoiceoverAutogenerationPolicyModel.get(
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False)
    )
    language_codes_mapping: Dict[str, Dict[str, bool]] = {}
    if voiceover_autogeneration_policy_model is None:
        return language_codes_mapping

    language_codes_mapping = (
        voiceover_autogeneration_policy_model.language_codes_mapping)
    return language_codes_mapping


def save_language_accent_support(
    language_codes_mapping: Dict[str, Dict[str, bool]]
) -> None:
    """The method saves the language-accent codes into the
    VoiceoverAutogenerationPolicyModel, which will be supported by
    Oppia's voiceovers.

    Args:
        language_codes_mapping: Dict[str, Dict[str, bool]]. A dict with
            language_codes as keys and nested dicts as values. Each nested dict
            contains language_accent_codes as keys and booleans indicating
            whether it's possible to generate automatic voiceovers for this
            language-accent code as values.
    """
    retrieved_voiceover_autogeneration_policy_model = (
        voiceover_models.VoiceoverAutogenerationPolicyModel.get(
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False)
    )
    voiceover_autogeneration_policy_model = (
        retrieved_voiceover_autogeneration_policy_model
        if retrieved_voiceover_autogeneration_policy_model is not None
        else voiceover_models.VoiceoverAutogenerationPolicyModel(
            id=voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID)
    )

    voiceover_autogeneration_policy_model.language_codes_mapping = (
        language_codes_mapping)
    voiceover_autogeneration_policy_model.update_timestamps()
    voiceover_autogeneration_policy_model.put()


def get_language_accent_master_list() -> Dict[str, Dict[str, str]]:
    """The method returns the lanaguage accent master list stored in the
    JSON file.

    Returns:
        Dict[str, Dict[str, str]]. A dict with with language codes as keys and
        nested dicts as values. Each nested dict contains language-accent codes
        as keys and its description as values. This is an exhaustive list of
        language-accent pairs that Oppia may support for
        voiceovers (manual and auto).
    """
    file_path = os.path.join(
        feconf.VOICEOVERS_DATA_DIR, 'language_accent_master_list.json')
    with utils.open_file(file_path, 'r') as f:
        language_accent_master_list: Dict[str, Dict[str, str]] = json.loads(
            f.read())
        return language_accent_master_list


def get_autogeneratable_language_accent_list() -> Dict[str, Dict[str, str]]:
    """The method returns the autogeneratable lanaguage accent list stored
    in the JSON file.

    Returns:
        Dict[str, Dict[str, str]]. A dict with language-accent codes as keys
        and nested dicts as values. Each nested dictionary includes 'service'
        and 'voice_code' keys with their corresponding field values.
        The 'service' field denotes the third-party service utilized by Oppia
        for voiceover generation, while 'voice_code' signifies the desired
        voice type.
    """
    file_path = os.path.join(
        feconf.VOICEOVERS_DATA_DIR, 'autogeneratable_language_accent_list.json')
    with utils.open_file(file_path, 'r') as f:
        autogeneratable_language_accent_list: Dict[str, Dict[str, str]] = (
            json.loads(f.read()))
        return autogeneratable_language_accent_list
