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
import datetime
import json
import logging

from core import constants, feconf
from core.domain import (
    cloud_task_domain,
    email_manager,
    exp_domain,
    exp_fetchers,
    exp_services,
    state_domain,
    suggestion_services,
    taskqueue_services,
    translation_domain,
    translation_fetchers,
    user_services,
    voiceover_cloud_task_services,
    voiceover_domain,
    voiceover_regeneration_services,
)
from core.platform import models
from core.storage.voiceover import gae_models

from typing import Dict, List, Optional, Set, Tuple, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, voiceover_models

(
    exp_models,
    voiceover_models,
) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.VOICEOVER]
)


MAX_SAMPLE_VOICEOVERS_FOR_GIVEN_VOICE_ARTIST = 5


def get_entity_voiceovers_from_model(
    entity_voiceovers_model: voiceover_models.EntityVoiceoversModel,
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
    entity_voiceovers = voiceover_domain.EntityVoiceovers.from_dict(
        {
            'entity_id': entity_voiceovers_model.entity_id,
            'entity_type': entity_voiceovers_model.entity_type,
            'entity_version': entity_voiceovers_model.entity_version,
            'language_accent_code': entity_voiceovers_model.language_accent_code,
            'voiceovers_mapping': entity_voiceovers_model.voiceovers_mapping,
            'automated_voiceovers_audio_offsets_msecs': (
                entity_voiceovers_model.automated_voiceovers_audio_offsets_msecs
            ),
        }
    )
    return entity_voiceovers


def get_voiceovers_for_given_language_accent_code(
    entity_type: str,
    entity_id: str,
    entity_version: int,
    language_accent_code: str,
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
    entity_voiceovers_model = voiceover_models.EntityVoiceoversModel.get_model(
        entity_type, entity_id, entity_version, language_accent_code
    )

    if entity_voiceovers_model:
        return get_entity_voiceovers_from_model(entity_voiceovers_model)
    return voiceover_domain.EntityVoiceovers.create_empty(
        entity_type=entity_type,
        entity_id=entity_id,
        entity_version=entity_version,
        language_accent_code=language_accent_code,
    )


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
    entity_voiceovers_models = voiceover_models.EntityVoiceoversModel.get_entity_voiceovers_for_given_exploration(
        entity_id, entity_type, entity_version
    )

    for model_instance in entity_voiceovers_models:
        entity_voiceovers_objects.append(
            get_entity_voiceovers_from_model(model_instance)
        )
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
        entity_id, entity_type, entity_version
    )

    language_codes_mapping = get_all_language_accent_codes_for_voiceovers()

    supported_language_accent_codes = language_codes_mapping.get(
        language_code, {}
    )

    entity_voiceovers_list = []

    for entity_voiceovers in entity_voiceovers_for_exp:
        if (
            entity_voiceovers.language_accent_code
            not in supported_language_accent_codes
        ):
            continue
        if not bool(entity_voiceovers.voiceovers_mapping):
            continue

        entity_voiceovers_list.append(entity_voiceovers)

    return entity_voiceovers_list


def compute_voiceover_related_change(
    updated_exploration: exp_domain.Exploration,
    voiceover_changes: List[exp_domain.ExplorationChange],
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
        entity_id, entity_type, entity_version
    )

    for entity_voiceovers in entity_voiceovers_objects:
        entity_voiceovers_id = generate_id_method(
            entity_voiceovers.entity_type,
            entity_voiceovers.entity_id,
            entity_voiceovers.entity_version,
            entity_voiceovers.language_accent_code,
        )
        entity_voiceover_id_to_entity_voiceovers[entity_voiceovers_id] = (
            entity_voiceovers
        )

    language_code_to_language_accent_mapping = (
        get_all_language_accent_codes_for_voiceovers()
    )
    for change in voiceover_changes:
        if change.cmd == exp_domain.CMD_UPDATE_VOICEOVERS:
            # Here we use cast because this forces change to have type
            # VoiceoversChangesCmd.
            voiceover_change = cast(exp_domain.VoiceoversChangesCmd, change)
            content_id = voiceover_change.content_id
            language_accent_code = voiceover_change.language_accent_code

            entity_voiceover_id = generate_id_method(
                entity_type, entity_id, entity_version, language_accent_code
            )

            empty_entity_voiceovers = (
                voiceover_domain.EntityVoiceovers.create_empty(
                    entity_id, entity_type, entity_version, language_accent_code
                )
            )

            entity_voiceovers = entity_voiceover_id_to_entity_voiceovers.get(
                entity_voiceover_id, empty_entity_voiceovers
            )

            if content_id not in entity_voiceovers.voiceovers_mapping:
                manual_voiceover_dict: state_domain.VoiceoverDict = (
                    voiceover_change.voiceovers['manual']
                )
                manual_voiceover = state_domain.Voiceover.from_dict(
                    manual_voiceover_dict
                )

                entity_voiceovers.add_new_content_id_without_voiceovers(
                    content_id
                )
                entity_voiceovers.add_voiceover(
                    content_id, feconf.VoiceoverType.MANUAL, manual_voiceover
                )
            else:
                if 'manual' not in voiceover_change.voiceovers:
                    entity_voiceovers.remove_voiceover(
                        content_id, feconf.VoiceoverType.MANUAL
                    )
                else:
                    manual_voiceover_dict = voiceover_change.voiceovers[
                        'manual'
                    ]
                    manual_voiceover = state_domain.Voiceover.from_dict(
                        manual_voiceover_dict
                    )

                    entity_voiceovers.voiceovers_mapping[content_id][
                        'manual'
                    ] = manual_voiceover

            entity_voiceovers.validate()
            entity_voiceover_id_to_entity_voiceovers[entity_voiceover_id] = (
                entity_voiceovers
            )
        elif change.cmd == exp_domain.CMD_MARK_VOICEOVER_AS_NEEDING_UPDATE:
            language_code = change.language_code
            language_accent_codes = language_code_to_language_accent_mapping[
                language_code
            ].keys()
            all_entity_voiceovers = (
                entity_voiceover_id_to_entity_voiceovers.values()
            )

            for entity_voiceovers in all_entity_voiceovers:
                # If the language code is English, it indicates that the
                # English content was modified, so all associated
                # voiceovers must be marked as needing update.
                if (
                    language_code != constants.constants.DEFAULT_LANGUAGE_CODE
                    and entity_voiceovers.language_accent_code
                    not in language_accent_codes
                ):
                    continue

                entity_voiceovers.mark_voiceovers_as_needing_update(
                    change.content_id, feconf.VoiceoverType.MANUAL
                )
                entity_voiceovers.mark_voiceovers_as_needing_update(
                    change.content_id, feconf.VoiceoverType.AUTO
                )

        elif change.cmd == exp_domain.CMD_REMOVE_VOICEOVERS:
            language_code = change.language_code
            language_accent_codes = language_code_to_language_accent_mapping[
                language_code
            ].keys()
            all_entity_voiceovers = (
                entity_voiceover_id_to_entity_voiceovers.values()
            )

            for entity_voiceovers in all_entity_voiceovers:
                # If the language code is English, it indicates that the
                # English content was modified, so all associated
                # voiceovers must be removed.
                if (
                    language_code != constants.constants.DEFAULT_LANGUAGE_CODE
                    and entity_voiceovers.language_accent_code
                    not in language_accent_codes
                ):
                    continue

                entity_voiceovers.remove_voiceover(
                    change.content_id, feconf.VoiceoverType.MANUAL
                )
                entity_voiceovers.remove_voiceover(
                    change.content_id, feconf.VoiceoverType.AUTO
                )

    for entity_voiceovers in entity_voiceover_id_to_entity_voiceovers.values():
        entity_voiceovers_dict = entity_voiceovers.to_dict()
        new_voiceovers_models.append(
            voiceover_models.EntityVoiceoversModel.create_new(
                entity_voiceovers_dict['entity_type'],
                entity_voiceovers_dict['entity_id'],
                entity_voiceovers_dict['entity_version'] + 1,
                entity_voiceovers_dict['language_accent_code'],
                # Here we use cast because the .to_dict() method returns a
                # dictionary with a general value type. This cast assures the
                # static type checker that the 'voiceovers_mapping' value
                # conforms to the specific nested dictionary structure required
                # by the create_new() method.
                cast(
                    Dict[
                        str,
                        Dict[
                            gae_models.VoiceoverTypeStr,
                            Optional[state_domain.VoiceoverDict],
                        ],
                    ],
                    entity_voiceovers_dict['voiceovers_mapping'],
                ),
                entity_voiceovers_dict[
                    'automated_voiceovers_audio_offsets_msecs'
                ],
            )
        )

    return new_voiceovers_models


def get_all_language_accent_codes_for_voiceovers() -> (
    Dict[str, Dict[str, bool]]
):
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
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False
        )
    )
    language_codes_mapping: Dict[str, Dict[str, bool]] = {}
    if voiceover_autogeneration_policy_model is None:
        return language_codes_mapping

    language_codes_mapping = (
        voiceover_autogeneration_policy_model.language_codes_mapping
    )
    return language_codes_mapping


def is_voiceover_autogeneration_using_cloud_service_enabled() -> bool:
    """The method verifies whether admins have enabled the configuration
    for generating voiceovers automatically using cloud service.

    Returns:
        bool. True if cloud based voiceover autogeneration is enabled,
        False otherwise.
    """
    voiceover_autogeneration_policy_model = (
        voiceover_models.VoiceoverAutogenerationPolicyModel.get(
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False
        )
    )

    autogenerated_voiceovers_are_enabled: bool = False

    if voiceover_autogeneration_policy_model is not None:
        autogenerated_voiceovers_are_enabled = (
            voiceover_autogeneration_policy_model.autogenerated_voiceovers_are_enabled
        )
    return autogenerated_voiceovers_are_enabled


def update_admin_config_for_voiceover_autogeneration(
    autogenerated_voiceovers_are_enabled: bool,
) -> None:
    """The method allows admins to enable or disable the use of cloud service
    for automatic voiceover generation from admin misc tab.

    Args:
        autogenerated_voiceovers_are_enabled: bool. A boolean value
            indicating whether cloud based voiceover autogeneration is enabled
            by admins or not.
    """
    voiceover_autogeneration_policy_model = (
        voiceover_models.VoiceoverAutogenerationPolicyModel.get(
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False
        )
    )

    assert voiceover_autogeneration_policy_model is not None

    (
        voiceover_autogeneration_policy_model.autogenerated_voiceovers_are_enabled
    ) = autogenerated_voiceovers_are_enabled

    voiceover_autogeneration_policy_model.update_timestamps()
    voiceover_autogeneration_policy_model.put()


def create_entity_voiceovers_model(
    entity_voiceovers: voiceover_domain.EntityVoiceovers,
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
    # Here we use cast because the .to_dict() method returns a
    # dictionary with a general value type. This cast assures the
    # static type checker that the 'voiceovers_mapping' value
    # conforms to the specific nested dictionary structure required
    # by the create_new() method.
    voiceovers_mapping = cast(
        Dict[
            str,
            Dict[
                gae_models.VoiceoverTypeStr,
                Optional[state_domain.VoiceoverDict],
            ],
        ],
        entity_voiceovers_dict['voiceovers_mapping'],
    )
    automated_voiceovers_audio_offsets_msecs_dict = entity_voiceovers_dict[
        'automated_voiceovers_audio_offsets_msecs'
    ]

    entity_voiceovers_model = voiceover_models.EntityVoiceoversModel.create_new(
        entity_type,
        entity_id,
        entity_version,
        language_accent_code,
        voiceovers_mapping,
        automated_voiceovers_audio_offsets_msecs_dict,
    )
    entity_voiceovers_model.update_timestamps()
    return entity_voiceovers_model


def save_entity_voiceovers(
    entity_voiceovers: voiceover_domain.EntityVoiceovers,
) -> None:
    """Saves the entity voiceovers domain object to the datastore.

    Args:
        entity_voiceovers: EntityVoiceovers. An instance of the entity
            voiceovers domain class.
    """
    entity_voiceovers_model = create_entity_voiceovers_model(entity_voiceovers)
    entity_voiceovers_model.put()


def save_language_accent_support(
    language_codes_mapping: Dict[str, Dict[str, bool]],
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
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False
        )
    )
    voiceover_autogeneration_policy_model = (
        retrieved_voiceover_autogeneration_policy_model
        if retrieved_voiceover_autogeneration_policy_model is not None
        else voiceover_models.VoiceoverAutogenerationPolicyModel(
            id=voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID
        )
    )

    voiceover_autogeneration_policy_model.language_codes_mapping = (
        language_codes_mapping
    )
    voiceover_autogeneration_policy_model.update_timestamps()
    voiceover_autogeneration_policy_model.put()


def is_accent_code_valid_for_autogeneration(language_accent_code: str) -> bool:
    """The method validates whether the provided language accent code is valid
    for Oppia's voiceover autogeneration.

    Args:
        language_accent_code: str. The language accent code to be validated.

    Returns:
        bool. True if the provided language accent code is valid for Oppia's
        voiceover autogeneration, False otherwise.
    """
    autogeneratable_language_accents = (
        get_autogeneratable_language_accent_codes()
    )
    return (
        isinstance(language_accent_code, str)
        and language_accent_code in autogeneratable_language_accents
    )


def get_new_auto_voiceover_accent(
    updated_language_accent_mapping: Dict[str, Dict[str, bool]],
) -> Optional[str]:
    """Returns the newly added language-accent code enabled for automatic
    voiceover regeneration, if any.

    Args:
        updated_language_accent_mapping: dict(str, dict(str, bool)). Mapping of
            language codes to their accent configurations after the update.
            Each accent code maps to a boolean indicating whether automatic
            voiceover generation is enabled.

    Returns:
        Optional[str]. The newly added language-accent code enabled for automatic
        voiceover regeneration, or None if no such accent was added.
    """
    retrieved_voiceover_autogeneration_policy_model = (
        voiceover_models.VoiceoverAutogenerationPolicyModel.get(
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False
        )
    )
    voiceover_autogeneration_policy_model = (
        retrieved_voiceover_autogeneration_policy_model
        if retrieved_voiceover_autogeneration_policy_model is not None
        else voiceover_models.VoiceoverAutogenerationPolicyModel(
            id=voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID
        )
    )

    existing_language_accent_mapping = (
        voiceover_autogeneration_policy_model.language_codes_mapping
        if voiceover_autogeneration_policy_model.language_codes_mapping
        is not None
        else {}
    )
    existing_autogeneratable_accents: Set[str] = set()
    updated_autogeneratable_accents: Set[str] = set()

    for accent_mapping in existing_language_accent_mapping.values():
        for (
            language_accent_code,
            supports_autogeneration,
        ) in accent_mapping.items():
            if supports_autogeneration:
                existing_autogeneratable_accents.add(language_accent_code)

    for accent_mapping in updated_language_accent_mapping.values():
        for (
            language_accent_code,
            supports_autogeneration,
        ) in accent_mapping.items():
            if supports_autogeneration:
                updated_autogeneratable_accents.add(language_accent_code)

    new_accents_set = (
        updated_autogeneratable_accents - existing_autogeneratable_accents
    )

    # Since the UI triggers a backend request immediately whenever a language
    # accent code is updated, the new_accents_set can contain at most one element.
    # Therefore, we can safely use pop() to retrieve the newly added language
    # accent code.
    if new_accents_set:
        assert len(new_accents_set) == 1, (
            'Expected only one new language-accent code to be added for automatic '
            'voiceover regeneration, but found multiple: %s' % new_accents_set
        )
        return new_accents_set.pop()
    return None


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
    language_accent_master_list: Dict[str, Dict[str, str]] = (
        constants.language_accent_master_list_constants
    )
    return language_accent_master_list


def get_language_accent_codes_to_descriptions() -> Dict[str, str]:
    """The method returns a mapping of language accent codes to their
    descriptions.

    Returns:
        Dict[str, str]. A dict mapping language accent codes to their
        descriptions.
    """
    language_accent_codes_to_descriptions = {}
    for (
        language_accent_code_to_description
    ) in get_language_accent_master_list().values():
        language_accent_codes_to_descriptions.update(
            language_accent_code_to_description
        )
    return language_accent_codes_to_descriptions


def get_language_code_from_language_accent_code(
    language_accent_code: str,
) -> Optional[str]:
    """The method returns the language code corresponding to the provided
    language accent code.

    Args:
        language_accent_code: str. Language accent code.

    Returns:
        str. The language code corresponds to the provided language accent code.
    """
    language_accent_master_dict = get_language_accent_master_list()
    language_code_for_given_accent = None

    for (
        language_code,
        language_accent_code_to_description,
    ) in language_accent_master_dict.items():
        if language_accent_code in list(
            language_accent_code_to_description.keys()
        ):
            language_code_for_given_accent = language_code
            break

    return language_code_for_given_accent


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
    autogeneratable_language_accent_list: Dict[str, Dict[str, str]] = (
        constants.autogeneratable_language_accent_constants
    )
    return autogeneratable_language_accent_list


def get_autogeneratable_language_accent_codes() -> List[str]:
    """The method returns the list of language accent codes that are supported
    by cloud service for autogeneration.

    Returns:
        List[str]. A list of language accent codes that are supported by the
        cloud service for autogeneration.
    """
    language_accent_codes = list(
        get_autogeneratable_language_accent_list().keys()
    )
    return language_accent_codes


def compute_voiceover_related_changes_upon_revert(
    reverted_exploration: exp_domain.Exploration, revert_to_version: int
) -> List[voiceover_models.EntityVoiceoversModel]:
    """Creates new EntityVoiceovers models corresponding to voiceover related
    changes upon reverting an exploration.

    Args:
        reverted_exploration: Exploration. The reverted exploration object.
        revert_to_version: int. The version to which the exploration is being
            reverted.

    Returns:
        list(EntityVoiceoversModel). A list of EntityVoiceoversModel's with
        respect to reverted exploration version.
    """
    entity_voiceovers_domain_objects = (
        get_entity_voiceovers_for_given_exploration(
            reverted_exploration.id, 'exploration', revert_to_version
        )
    )
    new_entity_voiceovers_models = []

    for entity_voiceovers in entity_voiceovers_domain_objects:
        entity_voiceovers_dict = entity_voiceovers.to_dict()
        new_entity_voiceovers_models.append(
            voiceover_models.EntityVoiceoversModel.create_new(
                entity_voiceovers_dict['entity_type'],
                entity_voiceovers_dict['entity_id'],
                reverted_exploration.version,
                entity_voiceovers_dict['language_accent_code'],
                # Here we use cast because the .to_dict() method returns a
                # dictionary with a general value type. This cast assures the
                # static type checker that the 'voiceovers_mapping' value
                # conforms to the specific nested dictionary structure required
                # by the create_new() method.
                cast(
                    Dict[
                        str,
                        Dict[
                            gae_models.VoiceoverTypeStr,
                            Optional[state_domain.VoiceoverDict],
                        ],
                    ],
                    entity_voiceovers_dict['voiceovers_mapping'],
                ),
                entity_voiceovers_dict[
                    'automated_voiceovers_audio_offsets_msecs'
                ],
            )
        )
    return new_entity_voiceovers_models


def get_supported_autogeneratable_accents_by_language(
    language_code: str,
) -> List[str]:
    """Returns accent codes for a language where autogeneration is enabled for
    Oppia's voiceovers.

    Args:
        language_code: str. The language code for which accent codes are to be
            fetched.

    Returns:
        List[str]. A list of accent codes for the specified language where
        autogeneration is enabled.
    """
    language_codes_mapping = get_all_language_accent_codes_for_voiceovers()
    accent_codes_mapping = language_codes_mapping.get(language_code, {})
    return [
        accent_code
        for accent_code, autogeneration_enabled in accent_codes_mapping.items()
        if autogeneration_enabled
    ]


def send_email_to_voiceover_admins_and_tech_leads_after_regeneration(
    exploration_id: str,
    exploration_title: str,
    date_time: str,
    language_accents_used_for_voiceover_regeneration: List[str],
    error_collections_during_voiceover_regeneration: List[
        Dict[str, List[Tuple[str, str]] | str]
    ],
    number_of_contents_for_voiceover_regeneration: int,
    number_of_contents_failed_to_regenerate: int,
    author_id: str,
) -> None:
    """Sends an email to voiceover admins and tech leads after the
    regeneration of voiceovers is complete.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            were regenerated.
        exploration_title: str. The title of the exploration for which
            voiceovers were regenerated.
        date_time: str. The date and time when the voiceovers were regenerated.
        language_accents_used_for_voiceover_regeneration: List[str]. A list of
            language accents used for the voiceover regeneration.
        error_collections_during_voiceover_regeneration: List[Dict[str, Any]].
            A list of dictionaries containing error messages during the
            voiceover regeneration process.
        number_of_contents_for_voiceover_regeneration: int. The total number of
            contents for which voiceovers were regenerated.
        number_of_contents_failed_to_regenerate: int. The number of contents
            that failed to regenerate voiceovers.
        author_id: str. The ID of the author who initiated the voiceover
            regeneration.
    """
    date_time_object = datetime.datetime.fromisoformat(date_time)
    date = date_time_object.date().isoformat()
    time = date_time_object.time().replace(microsecond=0).isoformat()

    user_settings = user_services.get_user_settings(author_id)
    assert user_settings is not None
    author_username = user_settings.username
    assert author_username is not None

    number_of_successful_regenerations = (
        number_of_contents_for_voiceover_regeneration
        - number_of_contents_failed_to_regenerate
    )

    # Email to voiceover tech leads should be sent only if there are voiceover
    # regeneration errors.
    if number_of_contents_failed_to_regenerate > 0:
        email_manager.send_emails_to_voiceover_tech_leads(
            exploration_id,
            exploration_title,
            date,
            time,
            language_accents_used_for_voiceover_regeneration,
            error_collections_during_voiceover_regeneration,
        )

    email_manager.send_emails_to_voiceover_admins(
        date,
        time,
        exploration_id,
        exploration_title,
        number_of_contents_for_voiceover_regeneration,
        number_of_successful_regenerations,
        number_of_contents_failed_to_regenerate,
        language_accents_used_for_voiceover_regeneration,
        author_username,
    )


def extract_english_voiceover_texts_from_exploration(
    exploration: exp_domain.Exploration,
) -> Dict[str, Dict[str, str]]:
    """Extracts English voiceover texts from the given exploration.

    Args:
        exploration: Exploration. The exploration from which to
            extract English voiceover texts.

    Returns:
        dict. A dictionary that maps the language code (English) to its
        corresponding content IDs and their associated values.
    """
    language_code_to_contents_mapping: Dict[str, Dict[str, str]] = {}

    for state in exploration.states.values():
        content_id_to_translatable_content = (
            state.get_translatable_contents_collection()
        ).content_id_to_translatable_content

        for translatable_content in content_id_to_translatable_content.values():
            content_id = translatable_content.content_id

            # Rule inputs are not considered for voiceover generation.
            if content_id.startswith('rule_input'):
                continue

            content_value = translatable_content.content_value
            assert isinstance(content_value, str)

            language_code_to_contents_mapping.setdefault('en', {})[
                content_id
            ] = content_value

    return language_code_to_contents_mapping


def extract_translated_voiceover_texts_from_entity_translations(
    entity_translations: List[translation_domain.EntityTranslation],
) -> Dict[str, Dict[str, str]]:
    """Retrieves translated voiceover texts from an exploration’s entity
    translations object.

    Args:
        entity_translations: List[translation_domain.EntityTranslation]. A list
            of entity translations to extract voiceover texts from.

    Returns:
        dict. A dictionary mapping language codes to their corresponding content
        IDs and translated values.
    """
    language_code_to_contents_mapping: Dict[str, Dict[str, str]] = {}

    for entity_translation in entity_translations:
        language_code = entity_translation.language_code
        translations = entity_translation.translations

        for content_id, translated_content in translations.items():

            # Rule inputs are not considered for voiceover generation.
            if content_id.startswith('rule_input'):
                continue

            # Voiceovers should only be regenerated if the translation is
            # updated.
            if translated_content.needs_update:
                continue

            content_value = translated_content.content_value
            assert isinstance(content_value, str)

            language_code_to_contents_mapping.setdefault(language_code, {})[
                content_id
            ] = content_value

    return language_code_to_contents_mapping


def regenerate_voiceovers_for_given_contents(
    exploration_id: str,
    exploration_version: int,
    language_code_to_contents_mapping: Dict[str, Dict[str, str]],
    task_run_id: str,
    specific_language_accent_code: Optional[str] = None,
) -> None:
    """Helper method to regenerate voiceovers for specified contents
    of an exploration.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        exploration_version: int. The version of the exploration for which
            voiceovers need to be regenerated.
        language_code_to_contents_mapping: dict. A dictionary mapping language
            codes to the corresponding content IDs and their associated HTML
            that require voiceover regeneration.
        task_run_id: str. The unique identifier for the voiceover
            regeneration task.
        specific_language_accent_code: Optional[str]. The specific language
            accent code to use for voiceover regeneration, if provided.
    """
    # Get all language codes that need voiceover regeneration in this request.
    language_codes = list(language_code_to_contents_mapping.keys())

    # A dictionary mapping each language code to a list of accent codes that
    # support autogeneration.
    language_code_to_autogeneratable_accent_codes = {}

    # Retrieve all Oppia-supported language accents, grouped by language code,
    # for which voiceovers need to be regenerated for the given contents.
    for language_code in language_codes:
        language_accent_codes = (
            get_supported_autogeneratable_accents_by_language(language_code)
        )

        if not language_accent_codes:
            continue

        if specific_language_accent_code:
            language_code_to_autogeneratable_accent_codes[language_code] = [
                specific_language_accent_code
            ]
            break

        language_code_to_autogeneratable_accent_codes[language_code] = (
            language_accent_codes
        )

    voiceover_regeneration_job = voiceover_cloud_task_services.create_voiceover_regeneration_task_with_status_generating(
        exploration_id,
        task_run_id,
        language_code_to_contents_mapping,
        language_code_to_autogeneratable_accent_codes,
    )

    # Ruling out the possibility of None for mypy type checking.
    assert voiceover_regeneration_job is not None

    voiceover_cloud_task_services.save_voiceover_regeneration_job(
        voiceover_regeneration_job
    )

    # Voiceover regeneration for a large number of contents within a single
    # Cloud Task run (deferred request) significantly increases the workload and
    # may lead to timeout failures due to Gunicorn limitations of 60 seconds.
    # To mitigate this issue, a single deferred regeneration task is split into
    # multiple smaller batches.
    divide_and_enqueue_voiceover_regeneration_tasks_in_smaller_batches(
        language_code_to_contents_mapping,
        language_code_to_autogeneratable_accent_codes,
        exploration_id,
        exploration_version,
        task_run_id,
    )


def divide_and_enqueue_voiceover_regeneration_tasks_in_smaller_batches(
    language_code_to_contents_mapping: Dict[str, Dict[str, str]],
    language_code_to_autogeneratable_accent_codes: Dict[str, List[str]],
    exploration_id: str,
    exploration_version: int,
    parent_cloud_task_run_id: str,
) -> None:
    """It divides the voiceover regeneration process for an exploration into
    smaller batches and enqueues a separate task for each batch in the
    Google Cloud Task Queue. This approach prevents asynchronous deferred
    requests from timing out when processing a large number of contents
    in one request, thereby avoiding the 60-second Gunicorn timeout limit.

    Args:
        language_code_to_contents_mapping: dict. A dictionary mapping language
            codes to the corresponding content IDs and their associated HTML
            that require voiceover regeneration.
        language_code_to_autogeneratable_accent_codes: dict. A dictionary mapping
            language codes to a list of accent codes that support autogeneration.
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        exploration_version: int. The version of the exploration for which
            voiceovers need to be regenerated.
        parent_cloud_task_run_id: str. The unique identifier for the parent
            cloud task run, which is responsible for regenerating voiceovers
            for all the contents of the exploration in batches.
    """
    logging.info(
        'Voiceover regeneration logs: Starting to divide and enqueue voiceover '
        'regeneration tasks in smaller batches for exploration_id: %s, '
        'parent_cloud_task_run_id: %s'
        % (
            exploration_id,
            parent_cloud_task_run_id,
        )
    )
    # Based on testing data, regenerating a voiceover for each state content
    # takes approximately 6 seconds. Therefore, to avoid hitting the timeout
    # limit, we can process about 8 contents per batch. This would take roughly
    # 48 seconds, leaving sufficient buffer time to handle any variations
    # in processing.
    batch_size = 8

    batch_counter = 0
    child_cloud_task_model_ids = []

    for (
        language_code,
        content_ids_to_content_values,
    ) in language_code_to_contents_mapping.items():
        language_accent_codes = (
            language_code_to_autogeneratable_accent_codes.get(language_code, [])
        )
        for language_accent_code in language_accent_codes:
            content_id_value_pairs = list(content_ids_to_content_values.items())

            for i in range(0, len(content_id_value_pairs), batch_size):
                batch_content_id_value_pairs = content_id_value_pairs[
                    i : i + batch_size
                ]
                batch_content_ids_to_content_values = dict(
                    batch_content_id_value_pairs
                )
                batch_counter += 1

                child_cloud_task_model_id = (
                    taskqueue_services.get_new_cloud_task_run_id()
                )

                logging.info(
                    'Voiceover regeneration logs: Enqueuing batch %d for '
                    'exploration_id: %s, parent_cloud_task_run_id: %s, '
                    'child_cloud_task_run_id: %s'
                    % (
                        batch_counter,
                        exploration_id,
                        parent_cloud_task_run_id,
                        child_cloud_task_model_id,
                    )
                )

                voiceover_regeneration_task_batch_instance = (
                    cloud_task_domain.VoiceoverRegenerationTaskBatch(
                        parent_cloud_task_run_id,
                        child_cloud_task_model_id,
                        exploration_id,
                        exploration_version,
                        language_accent_code,
                        batch_content_ids_to_content_values,
                    )
                )

                voiceover_cloud_task_services.create_voiceover_regeneration_task_batch_model(
                    voiceover_regeneration_task_batch_instance
                )

                # Enqueue to Google cloud task queue.
                taskqueue_services.defer_voiceover_regeneration_task_in_batches(
                    feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                        'FUNCTION_ID_REGENERATE_VOICEOVERS_FOR_BATCH_CONTENTS'
                    ],
                    taskqueue_services.QUEUE_NAME_VOICEOVER_REGENERATION,
                    parent_cloud_task_run_id,
                    child_cloud_task_model_id,
                    exploration_id,
                )

                child_cloud_task_model_ids.append(child_cloud_task_model_id)

    logging.info(
        'Voiceover regeneration logs: Number of batches: %s, Parent Cloud Task Run ID: %s, Child Cloud Task Run IDs: %s'
        % (
            batch_counter,
            parent_cloud_task_run_id,
            child_cloud_task_model_ids,
        )
    )


def regenerate_voiceovers_for_batch_contents(
    exploration_id: str,
    parent_cloud_task_run_id: str,
    child_cloud_task_run_id: str,
) -> None:
    """Regenerates automatic voiceovers for some contents of an exploration, so
    that we can't hit the state where in an async deferred request due to large
    numbers of contents to regenerate in one go we have a timeout becuase of
    Gunicorn's timeout of 60 secs.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        parent_cloud_task_run_id: str. The unique identifier for the parent
            cloud task run, which is responsible for regenerating voiceovers
            for all the contents of the exploration in batches.
        child_cloud_task_run_id: str. The unique identifier for the child
            cloud task run, which is responsible for regenerating voiceovers
            for a batch of contents of the exploration in a language accent.

    Raises:
        Exception. Raised when there is an error during the voiceover
            regeneration process for the batch of contents.
    """
    logging.info(
        'Voiceover regeneration logs: Starting to regenerate voiceovers for '
        'batch contents for exploration_id: %s, parent_cloud_task_run_id: %s, '
        'child_cloud_task_run_id: %s'
        % (exploration_id, parent_cloud_task_run_id, child_cloud_task_run_id)
    )

    voiceover_regeneration_batch_execution_job = voiceover_cloud_task_services.get_voiceover_regeneration_task_batch_model(
        parent_cloud_task_run_id, child_cloud_task_run_id
    )

    logging.info(
        'Voiceover regeneration logs: Trying to fetch voiceover regeneration batch execution job, '
        'parent_cloud_task_run_id: %s, child_cloud_task_run_id: %s.'
        % (parent_cloud_task_run_id, child_cloud_task_run_id)
    )

    # Ruling out the possibility of None for mypy type checking.
    assert voiceover_regeneration_batch_execution_job is not None

    exploration_id = voiceover_regeneration_batch_execution_job.exploration_id
    exploration_version = (
        voiceover_regeneration_batch_execution_job.exploration_version
    )
    language_accent_code = (
        voiceover_regeneration_batch_execution_job.language_accent_code
    )
    content_ids_to_content_values = (
        voiceover_regeneration_batch_execution_job.content_ids_to_contents_map
    )

    try:
        errors_while_voiceover_regeneration = voiceover_regeneration_services.regenerate_voiceovers_of_exploration(
            exploration_id,
            exploration_version,
            content_ids_to_content_values,
            language_accent_code,
        )
    except Exception as e:
        errors_while_voiceover_regeneration = [
            (content_id, str(e))
            for content_id in content_ids_to_content_values.keys()
        ]

    error_collections_during_voiceover_regeneration = []

    error_collections_during_voiceover_regeneration.append(
        json.dumps(
            {
                'exploration_id': exploration_id,
                'language_accent_code': language_accent_code,
                'error_messages': errors_while_voiceover_regeneration,
            }
        )
    )

    child_cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
        child_cloud_task_run_id
    )
    # Ruling out the possibility of None for mypy type checking.
    assert child_cloud_task_run is not None

    child_cloud_task_run.exception_messages_for_failed_runs.extend(
        error_collections_during_voiceover_regeneration
    )
    if len(errors_while_voiceover_regeneration) > 0:
        child_cloud_task_run.latest_job_state = 'PERMANENTLY_FAILED'
    else:
        child_cloud_task_run.latest_job_state = 'SUCCEEDED'

    taskqueue_services.update_cloud_task_run_model(child_cloud_task_run)

    wrap_up_voiceover_regeneration_task(
        exploration_id, parent_cloud_task_run_id
    )


def wrap_up_voiceover_regeneration_task(
    exploration_id: str,
    parent_cloud_task_run_id: str,
) -> None:
    """Wraps up the voiceover regeneration task by sending a summary email to
    voiceover admins and tech leads, which includes the details of the
    voiceover regeneration process.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            were regenerated.
        parent_cloud_task_run_id: str. The unique identifier for the parent
            cloud task run, which is responsible for regenerating voiceovers
            for all the contents of the exploration in batches.
    """
    child_cloud_task_run_ids = []
    language_accent_codes = []
    number_of_contents_for_voiceover_regeneration = 0

    voiceover_regeneration_batch_instances = voiceover_cloud_task_services.get_voiceover_regeneration_batch_instances_by_parent_task_run_id(
        parent_cloud_task_run_id
    )

    for batch_instance in voiceover_regeneration_batch_instances:
        child_cloud_task_run_ids.append(batch_instance.child_cloud_task_run_id)
        language_accent_codes.append(batch_instance.language_accent_code)
        number_of_contents_for_voiceover_regeneration += len(
            batch_instance.content_ids_to_contents_map
        )

    child_cloud_task_runs = taskqueue_services.get_cloud_task_runs_by_model_ids(
        child_cloud_task_run_ids
    )

    # Verify first if all the task runs are completed i.e., their status must
    # be either 'SUCCEEDED' or 'PERMANENTLY_FAILED'. If not, we should not
    # proceed with wrapping up the voiceover regeneration task, as it indicates
    # that some batches are still being processed.
    for child_cloud_task_run in child_cloud_task_runs:
        if child_cloud_task_run.latest_job_state not in [
            'SUCCEEDED',
            'PERMANENTLY_FAILED',
        ]:
            logging.info(
                'Voiceover regeneration logs: Not wrapping up the voiceover '
                'regeneration task for parent_cloud_task_run_id: %s, because '
                'child_cloud_task_run_id: %s is still in processing with status: %s'
                % (
                    parent_cloud_task_run_id,
                    child_cloud_task_run.task_id,
                    child_cloud_task_run.latest_job_state,
                )
            )
            return

    error_collections_during_voiceover_regeneration: List[
        Dict[str, str | List[Tuple[str, str]]]
    ] = []
    language_accent_code_to_error: Dict[str, List[Tuple[str, str]]] = (
        collections.defaultdict(list)
    )
    number_of_contents_failed_to_regenerate = 0

    voiceover_regeneration_job_status = (
        voiceover_cloud_task_services.get_voiceover_regeneration_job(
            exploration_id, parent_cloud_task_run_id
        )
    )
    # Ruling out the possibility of None for mypy type checking.
    assert voiceover_regeneration_job_status is not None

    parent_cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
        parent_cloud_task_run_id
    )
    # Ruling out the possibility of None for mypy type checking.
    assert parent_cloud_task_run is not None

    for cloud_task_run in child_cloud_task_runs:
        for error_details in cloud_task_run.exception_messages_for_failed_runs:
            error_collections_during_voiceover_regeneration.append(
                json.loads(error_details)
            )

    final_error_string = 'Exploration ID: %s\n' % exploration_id

    for error_collection in error_collections_during_voiceover_regeneration:
        # Here we use cast because we are narrowing down the type of
        # 'language_accent_code' from Union of str and List to a str.
        language_accent_code: str = cast(
            str, error_collection['language_accent_code']
        )

        # Here we use cast because we are narrowing down the type of
        # 'error_messages' from Union of str and List to a List of Tuples.
        content_id_and_error_message_tuple = cast(
            List[Tuple[str, str]], error_collection['error_messages']
        )

        language_accent_code_to_error[language_accent_code].extend(
            content_id_and_error_message_tuple
        )

    for (
        language_accent_code,
        content_id_and_error_message_tuple,
    ) in language_accent_code_to_error.items():
        final_error_string += 'Language Accent Code: %s\nErrors: %s \n' % (
            language_accent_code,
            content_id_and_error_message_tuple,
        )
        failed_content_ids = [
            error[0] for error in content_id_and_error_message_tuple
        ]
        voiceover_regeneration_job_status.update_failed_content_status(
            language_accent_code, failed_content_ids
        )
        number_of_contents_failed_to_regenerate += len(failed_content_ids)

    if number_of_contents_failed_to_regenerate > 0:
        parent_cloud_task_run.exception_messages_for_failed_runs.append(
            final_error_string
        )
        parent_cloud_task_run.latest_job_state = 'PERMANENTLY_FAILED'
        taskqueue_services.update_cloud_task_run_model(parent_cloud_task_run)

    voiceover_regeneration_job_status.update_remaining_content_status_as_succeeded()
    voiceover_cloud_task_services.save_voiceover_regeneration_job(
        voiceover_regeneration_job_status
    )
    logging.info(
        'Voiceover regeneration logs: %s'
        % voiceover_regeneration_job_status.to_dict()
    )

    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, strict=False
    )
    exploration_title = exploration.title if exploration else ''

    language_accent_codes_to_descriptions = (
        get_language_accent_codes_to_descriptions()
    )
    language_accent_descriptions_used_for_regeneration = [
        language_accent_codes_to_descriptions.get(language_accent_code, '')
        for language_accent_code in language_accent_codes
    ]

    logging.info(
        'Voiceover regeneration logs: Finished regenerating voiceovers for '
        'all batches for exploration_id: %s, now sending summary email to '
        'voiceover admins and tech leads.' % exploration_id
    )
    send_email_to_voiceover_admins_and_tech_leads_after_regeneration(
        exploration_id,
        exploration_title,
        parent_cloud_task_run.created_on.isoformat(),
        language_accent_descriptions_used_for_regeneration,
        error_collections_during_voiceover_regeneration,
        number_of_contents_for_voiceover_regeneration,
        number_of_contents_failed_to_regenerate,
        feconf.SYSTEM_COMMITTER_ID,
    )


def regenerate_voiceovers_on_exploration_update(
    exploration_id: str,
    exploration_version: int,
    task_run_id: str,
) -> None:
    """Regenerates voiceovers for the updated exploration based on the changes
    made in the exploration content (in English) or translations (in other
    languages) from the Exploration editor page.

    NOTE: Always invoke this method from a deferred task, as it is a
    time-consuming operation and should be performed asynchronously.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        exploration_version: int. The version of the exploration for which
            voiceovers need to be regenerated.
        task_run_id: str. The unique identifier for the voiceover
            regeneration task.

    Raises:
        Exception. If the voiceover regeneration fails for any of the content
            IDs or language-accent codes.
    """
    logging.info(
        'Voiceover regeneration logs: Started regenerating voiceovers for '
        'exploration with ID: %s and version: %s on exploration update.'
        % (exploration_id, exploration_version)
    )

    # Fetches the exploration change diff for the given exploration ID and
    # exploration version from the ExplorationCommitLogEntryModel.
    exploration_commit_log_entry_model_id = 'exploration-%s-%s' % (
        str(exploration_id),
        str(exploration_version),
    )
    exploration_change_diff = []
    try:
        exploration_change_diff = (
            exp_models.ExplorationCommitLogEntryModel.get(
                exploration_commit_log_entry_model_id
            )
        ).commit_cmds
    except Exception as e:
        raise Exception(
            'Could not fetch change diff for exploration %s, version %s during '
            'voiceover regeneration.'
            % (exploration_id, str(exploration_version))
        ) from e

    # A dictionary where each key is a language code, and each value is a
    # content mapping dictionary. The content mapping dictionary contains
    # content IDs as keys and their corresponding updated HTML content as
    # values.
    language_code_to_contents_mapping: Dict[str, Dict[str, str]] = {}

    for change in exploration_change_diff:
        cmd = change.get('cmd')
        if cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
            # Here we use cast because the from_dict() method returns a object of
            # type BaseChange, which is a parent class for ExplorationChange.
            # This cast assures the static type checker that the 'change_object'
            # variable is of type ExplorationChange, allowing us to access its
            # specific attributes and methods without type errors.
            change_object = cast(
                exp_domain.ExplorationChange,
                exp_domain.ExplorationChange.from_dict(change),
            )
            content_id_to_content_values = exp_services.get_content_updates_from_cmd_edit_state_property_change(
                change_object
            )

            for (
                content_id,
                content_value,
            ) in content_id_to_content_values.items():
                language_code_to_contents_mapping.setdefault('en', {})[
                    content_id
                ] = content_value
        elif cmd == exp_domain.CMD_EDIT_TRANSLATION:
            # CMD_EDIT_TRANSLATION is used to fetch the updated content for
            # the translations in other languages.
            language_code = change['language_code']
            updated_content = change['translation']['content_value']
            content_id = change['content_id']
            language_code_to_contents_mapping.setdefault(language_code, {})[
                content_id
            ] = updated_content
    logging.info(
        'Voiceover regeneration logs: %s' % language_code_to_contents_mapping
    )
    regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_version,
        language_code_to_contents_mapping,
        task_run_id,
    )


def regenerate_voiceovers_on_exploration_added_to_topic(
    exploration_id: str,
    task_run_id: str,
) -> None:
    """Regenerates all voiceovers (in English and in all the available
    translated languages) for the given exploration when it is curated — i.e.,
    added to a published story.

    NOTE: This is a time-intensive operation and must be executed via a
    deferred task to ensure it runs asynchronously.

    Args:
        exploration_id: str. The ID of the exploration to regenerate
            voiceovers for.
        task_run_id: str. The unique identifier for the voiceover
            regeneration task.
    """
    logging.info(
        'Voiceover regeneration logs: Started regenerating voiceovers for '
        'exploration with ID: %s when it is added to topic.' % exploration_id
    )
    # A dictionary where each key is a language code, and each value is a
    # content mapping dictionary. The content mapping dictionary contains
    # content IDs as keys and their corresponding HTML content as values.
    language_code_to_contents_mapping: Dict[str, Dict[str, str]] = {}

    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    assert exploration is not None

    exploration_version = exploration.version

    # Retrieve all English-language contents from the exploration.
    language_code_to_contents_mapping.update(
        extract_english_voiceover_texts_from_exploration(exploration)
    )

    # Retrieve all translated contents of the exploration.
    entity_translations = (
        translation_fetchers.get_all_entity_translations_for_entity(
            feconf.TranslatableEntityType.EXPLORATION,
            exploration_id,
            exploration_version,
        )
    )
    language_code_to_contents_mapping.update(
        extract_translated_voiceover_texts_from_entity_translations(
            entity_translations
        )
    )
    logging.info(
        'Voiceover regeneration logs: %s' % language_code_to_contents_mapping
    )

    regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_version,
        language_code_to_contents_mapping,
        task_run_id,
    )


def regenerate_voiceovers_of_exploration_for_given_language_accent(
    exploration_id: str,
    language_accent_code: str,
    cloud_task_run_id: str,
) -> None:
    """Regenerates voiceovers of the provided exploration for the given
    language accent code.

    NOTE: This is a time-intensive operation and must be executed via a
    deferred task to ensure it runs asynchronously.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        language_accent_code: str. The language accent code for which
            voiceovers need to be regenerated.
        cloud_task_run_id: str. The unique identifier for the voiceover
            regeneration task.

    Raises:
        Exception. If the provided language accent code is invalid.
    """
    logging.info(
        'Voiceover regeneration logs: Started regenerating voiceovers for '
        'exploration with ID: %s and language accent code: %s.'
        % (
            exploration_id,
            language_accent_code,
        )
    )
    # A dictionary where each key is a language code, and each value is a
    # content mapping dictionary. The content mapping dictionary contains
    # content IDs as keys and their corresponding HTML content as values.
    language_code_to_contents_mapping: Dict[str, Dict[str, str]] = {}

    language_code = get_language_code_from_language_accent_code(
        language_accent_code
    )

    if language_code is None:
        raise Exception(
            'Invalid language accent code: %s' % language_accent_code
        )

    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    assert exploration is not None

    exploration_version = exploration.version

    if language_code == constants.constants.DEFAULT_LANGUAGE_CODE:
        # Retrieve all English-language contents from the exploration.
        language_code_to_contents_mapping.update(
            extract_english_voiceover_texts_from_exploration(exploration)
        )
    else:
        # Retrieve all translated contents of the exploration in the given
        # language code.
        entity_translation = translation_fetchers.get_entity_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            exploration_id,
            exploration_version,
            language_code,
        )
        language_code_to_contents_mapping.update(
            extract_translated_voiceover_texts_from_entity_translations(
                [entity_translation]
            )
        )
    logging.info(
        'Voiceover regeneration logs: %s' % language_code_to_contents_mapping
    )
    regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_version,
        language_code_to_contents_mapping,
        cloud_task_run_id,
        specific_language_accent_code=language_accent_code,
    )


def regenerate_voiceovers_after_accepting_suggestion(
    suggestion_id: str,
    task_run_id: str,
) -> None:
    """Regenerates voiceover for the given content ID and language code after
    accepting a translation suggestion.

    Args:
        suggestion_id: str. The ID of the suggestion.
        task_run_id: str. The ID of the task run.
    """
    logging.info(
        'Voiceover regeneration logs: Started regenerating voiceovers after '
        'accepting suggestion with ID: %s.' % suggestion_id,
    )
    suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
    translated_html_content = suggestion.change_cmd.translation_html
    content_id = suggestion.change_cmd.content_id
    language_code = suggestion.language_code
    exploration_id = suggestion.target_id
    exploration_version = suggestion.target_version_at_submission
    language_code_to_contents_mapping = {
        language_code: {content_id: translated_html_content}
    }
    logging.info(
        'Voiceover regeneration logs: %s' % language_code_to_contents_mapping
    )
    regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_version,
        language_code_to_contents_mapping,
        task_run_id,
    )
