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

import collections
import json
import os

from core import feature_flag_list
from core import feconf
from core import utils
from core.domain import exp_domain
from core.domain import feature_flag_services
from core.domain import state_domain
from core.domain import user_services
from core.domain import voiceover_domain
from core.platform import models

from typing import Dict, List, Sequence, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


MAX_SAMPLE_VOICEOVERS_FOR_GIVEN_VOICE_ARTIST = 5


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
    entity_voiceovers = voiceover_domain.EntityVoiceovers.from_dict({
        'entity_id': entity_voiceovers_model.entity_id,
        'entity_type': entity_voiceovers_model.entity_type,
        'entity_version': entity_voiceovers_model.entity_version,
        'language_accent_code': entity_voiceovers_model.language_accent_code,
        'voiceovers_mapping': entity_voiceovers_model.voiceovers_mapping
    })
    return entity_voiceovers


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


def get_entity_voiceovers_for_given_exploration(
    entity_id: str, entity_type: str, entity_version: int
) -> List[voiceover_domain.EntityVoiceovers]:
    """Retrieves entity voiceovers models for the specified exploration version.

    Args:
        entity_id: str. The entity ID for which entity voiceovers need to be
            fetched.
        entity_type: str. The entity type for which entity voiceovers need to be
            fetched.
        entity_version: int. The entity version of the given exploration for
            which entity voiceovers need to be fetched.

    Returns:
        list(EntityVoiceovers). Returns a list of entity voiceover models for
        the specified exploration and version.
    """
    entity_voiceovers_objects: List[voiceover_domain.EntityVoiceovers] = []
    entity_voiceovers_models = (
        voiceover_models.EntityVoiceoversModel.
        get_entity_voiceovers_for_given_exploration(
            entity_id, entity_type, entity_version)
    )

    for model_instance in entity_voiceovers_models:
        entity_voiceovers_objects.append(
            _get_entity_voiceovers_from_model(model_instance))
    return entity_voiceovers_objects


def fetch_entity_voiceovers_by_language_code(
    entity_id: str, entity_type: str, entity_version: int, language_code: str
) -> List[voiceover_domain.EntityVoiceovers]:
    """Retrieves entity voiceovers models for the specified exploration and
    version for a given language code.

    Args:
        entity_id: str. The entity ID for which entity voiceovers need to be
            fetched.
        entity_type: str. The entity type for which entity voiceovers need to be
            fetched.
        entity_version: int. The entity version of the given exploration for
            which entity voiceovers need to be fetched.
        language_code: str. The language code in which entity voiceovers need
            to be fetched for the given exploration ID.

    Returns:
        list(EntityVoiceovers). Returns a list of entity voiceovers domain
        instances for the specified exploration data.
    """
    entity_voiceovers_for_exp = get_entity_voiceovers_for_given_exploration(
        entity_id, entity_type, entity_version)

    language_codes_mapping = get_all_language_accent_codes_for_voiceovers()

    supported_language_accent_codes = (
        language_codes_mapping.get(language_code, {}))

    entity_voiceovers_list = []

    for entity_voiceovers in entity_voiceovers_for_exp:
        if (
            entity_voiceovers.language_accent_code not in
            supported_language_accent_codes
        ):
            continue
        if not bool(entity_voiceovers.voiceovers_mapping):
            continue

        entity_voiceovers_list.append(entity_voiceovers)

    return entity_voiceovers_list


def compute_voiceover_related_change(
    updated_exploration: exp_domain.Exploration,
    voiceover_changes: List[exp_domain.ExplorationChange]
) -> List[voiceover_models.EntityVoiceoversModel]:
    """Creates new EntityVoiceovers models corresponding to voiceover related
    changes.

    Args:
        updated_exploration: Exploration. The updated exploration object.
        voiceover_changes: list(ExplorationChange). The list of changes to be
            applied.

    Returns:
        list(EntityVoiceoversModel). A list of EntityVoiceoversModel's with
        respect to updated exploration version.
    """
    new_voiceovers_models = []
    entity_voiceover_id_to_entity_voiceovers = {}
    generate_id_method = voiceover_models.EntityVoiceoversModel.generate_id

    entity_id = updated_exploration.id
    entity_version = updated_exploration.version - 1
    entity_type = 'exploration'

    entity_voiceovers_objects = get_entity_voiceovers_for_given_exploration(
        entity_id, entity_type, entity_version)

    for entity_voiceovers in entity_voiceovers_objects:
        entity_voiceovers_id = generate_id_method(
            entity_voiceovers.entity_type,
            entity_voiceovers.entity_id,
            entity_voiceovers.entity_version,
            entity_voiceovers.language_accent_code
        )
        entity_voiceover_id_to_entity_voiceovers[entity_voiceovers_id] = (
            entity_voiceovers)

    for change in voiceover_changes:
        # Here we use cast because this forces change to have type
        # VoiceoversChangesCmd.
        voiceover_change = cast(exp_domain.VoiceoversChangesCmd, change)
        content_id = voiceover_change.content_id
        language_accent_code = voiceover_change.language_accent_code

        entity_voiceover_id = generate_id_method(
            entity_type, entity_id, entity_version, language_accent_code)

        empty_entity_voiceovers = (
            voiceover_domain.EntityVoiceovers.create_empty(
                entity_id, entity_type, entity_version, language_accent_code)
        )

        entity_voiceovers = (
            entity_voiceover_id_to_entity_voiceovers.get(
                entity_voiceover_id, empty_entity_voiceovers)
        )

        if content_id not in entity_voiceovers.voiceovers_mapping:
            manual_voiceover_dict: state_domain.VoiceoverDict = (
                voiceover_change.voiceovers['manual'])
            manual_voiceover = state_domain.Voiceover.from_dict(
                manual_voiceover_dict)

            entity_voiceovers.add_new_content_id_without_voiceovers(content_id)
            entity_voiceovers.add_voiceover(
                content_id,
                feconf.VoiceoverType.MANUAL,
                manual_voiceover
            )
        else:
            if 'manual' not in voiceover_change.voiceovers:
                entity_voiceovers.remove_voiceover(
                    content_id,
                    feconf.VoiceoverType.MANUAL
                )
            else:
                manual_voiceover_dict = (
                    voiceover_change.voiceovers['manual'])
                manual_voiceover = state_domain.Voiceover.from_dict(
                    manual_voiceover_dict)

                entity_voiceovers.voiceovers_mapping[content_id][
                    feconf.VoiceoverType.MANUAL] = manual_voiceover

        entity_voiceovers.validate()

        entity_voiceover_id_to_entity_voiceovers[entity_voiceover_id] = (
            entity_voiceovers)

    for entity_voiceovers in entity_voiceover_id_to_entity_voiceovers.values():
        entity_voiceovers_dict = entity_voiceovers.to_dict()
        new_voiceovers_models.append(
            voiceover_models.EntityVoiceoversModel.create_new(
                entity_voiceovers_dict['entity_type'],
                entity_voiceovers_dict['entity_id'],
                entity_voiceovers_dict['entity_version'] + 1,
                entity_voiceovers_dict['language_accent_code'],
                entity_voiceovers_dict['voiceovers_mapping']
            )
        )

    return new_voiceovers_models


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


def create_entity_voiceovers_model(
    entity_voiceovers: voiceover_domain.EntityVoiceovers
) -> voiceover_models.EntityVoiceoversModel:
    """Creates and returns an entity voiceovers model instance, without putting
    it into the datastore.

    Args:
        entity_voiceovers: EntityVoiceovers. An instance of the
            entity voiceovers domain class.

    Returns:
        EntityVoiceoversModel. An instance of the entity voiceovers model.
    """

    entity_id = entity_voiceovers.entity_id
    entity_type = entity_voiceovers.entity_type
    entity_version = entity_voiceovers.entity_version
    language_accent_code = entity_voiceovers.language_accent_code

    entity_voiceovers_dict = entity_voiceovers.to_dict()
    voiceovers_mapping = entity_voiceovers_dict['voiceovers_mapping']

    entity_voiceovers_model = (
        voiceover_models.EntityVoiceoversModel.create_new(
            entity_type, entity_id, entity_version,
            language_accent_code, voiceovers_mapping
        )
    )
    entity_voiceovers_model.update_timestamps()
    return entity_voiceovers_model


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
