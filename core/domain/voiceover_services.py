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

import datetime
import json
import os

from core import feconf, utils
from core.constants import constants
from core.domain import (
    email_manager,
    exp_domain,
    exp_fetchers,
    platform_parameter_list,
    platform_parameter_services,
    state_domain,
    translation_domain,
    translation_fetchers,
    user_services,
    voiceover_domain,
    voiceover_regeneration_services,
)
from core.platform import models
from core.storage.voiceover import gae_models

from typing import Dict, List, Optional, Tuple, cast

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


def _get_entity_voiceovers_from_model(
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
        return _get_entity_voiceovers_from_model(entity_voiceovers_model)
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
            _get_entity_voiceovers_from_model(model_instance)
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
                if entity_voiceovers.language_accent_code in (
                    language_accent_codes
                ):
                    entity_voiceovers.mark_manual_voiceovers_as_needing_update(
                        change.content_id
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
                if entity_voiceovers.language_accent_code in (
                    language_accent_codes
                ):
                    entity_voiceovers.remove_voiceover(
                        change.content_id, feconf.VoiceoverType.MANUAL
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


# NOTE TO DEVELOPERS: The method is not ready for use since the corresponding
# model does not contain any data yet. Issue #19590 tracks the changes required
# in order to use this function.
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
        feconf.VOICEOVERS_DATA_DIR, 'language_accent_master_list.json'
    )
    with utils.open_file(file_path, 'r') as f:
        language_accent_master_list: Dict[str, Dict[str, str]] = json.loads(
            f.read()
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
    file_path = os.path.join(
        feconf.VOICEOVERS_DATA_DIR, 'autogeneratable_language_accent_list.json'
    )
    with utils.open_file(file_path, 'r') as f:
        autogeneratable_language_accent_list: Dict[str, Dict[str, str]] = (
            json.loads(f.read())
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


def _remove_empty_contents_for_voiceover_regeneration(
    language_code_to_contents_mapping: Dict[str, Dict[str, str]],
) -> None:
    """Removes empty contents from the provided input.

    Args:
        language_code_to_contents_mapping: dict. A dictionary mapping language
            codes to the corresponding content IDs and their associated HTML
            that require voiceover regeneration.
    """
    for (
        _,
        content_ids_to_content_values,
    ) in language_code_to_contents_mapping.items():
        content_ids_to_remove = [
            content_id
            for content_id, html in (content_ids_to_content_values.items())
            if not html.strip()
        ]
        for content_id in content_ids_to_remove:
            del content_ids_to_content_values[content_id]


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


def _regenerate_voiceovers_for_given_contents(
    exploration_id: str,
    exploration_title: str,
    exploration_version: int,
    language_code_to_contents_mapping: Dict[str, Dict[str, str]],
    date_time: str,
    author_id: str,
) -> None:
    """Private helper method to regenerate voiceovers for specified contents
    of an exploration.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        exploration_title: str. The title of the exploration for which
            voiceovers need to be regenerated.
        exploration_version: int. The version of the exploration for which
            voiceovers need to be regenerated.
        language_code_to_contents_mapping: dict. A dictionary mapping language
            codes to the corresponding content IDs and their associated HTML
            that require voiceover regeneration.
        date_time: str. The ISO-formatted timestamp indicating when the
            regeneration process was initiated.
        author_id: str. The ID of the user who triggered the voiceover
            regeneration, either directly or indirectly.
    """
    # A dictionary mapping each language code to a list of accent codes that
    # support autogeneration.
    language_code_to_autogeneratable_accent_codes = {}

    # Remove empty contents from the voiceover regeneration mapping.
    _remove_empty_contents_for_voiceover_regeneration(
        language_code_to_contents_mapping
    )

    # A list of error collections that occurred during the
    # voiceover regeneration.
    error_collections_during_voiceover_regeneration: List[
        Dict[str, List[Tuple[str, str]] | str]
    ] = []

    # Get all language codes that need voiceover regeneration in this request.
    language_codes = list(language_code_to_contents_mapping.keys())

    language_accent_codes_to_descriptions = (
        get_language_accent_codes_to_descriptions()
    )

    # Counter to track the number of contents for which voiceover regeneration
    # is triggered.
    number_of_contents_for_voiceover_regeneration = 0

    # Counter to track the number of contents that failed to regenerate
    # voiceovers.
    number_of_contents_failed_to_regenerate = 0

    # Retrieve all Oppia-supported language accents, grouped by language code,
    # for which voiceovers need to be regenerated for the given contents.
    for language_code in language_codes:
        language_accent_codes = (
            get_supported_autogeneratable_accents_by_language(language_code)
        )
        if not language_accent_codes:
            continue
        language_code_to_autogeneratable_accent_codes[language_code] = (
            language_accent_codes
        )

    # A list of language accents for which voiceovers are regenerated.
    language_accents_used_for_voiceover_regeneration = []

    for language_code in language_codes:
        language_accent_codes = (
            language_code_to_autogeneratable_accent_codes.get(language_code, [])
        )

        content_ids_to_content_values = language_code_to_contents_mapping.get(
            language_code, {}
        )

        for language_accent_code in language_accent_codes:
            language_accents_used_for_voiceover_regeneration.append(
                language_accent_codes_to_descriptions.get(
                    language_accent_code, ''
                )
            )

            number_of_contents_for_voiceover_regeneration += len(
                content_ids_to_content_values
            )

            errors_while_voiceover_regeneration = voiceover_regeneration_services.regenerate_voiceovers_of_exploration(
                exploration_id,
                exploration_version,
                content_ids_to_content_values,
                language_accent_code,
            )

            if errors_while_voiceover_regeneration:
                error_collections_during_voiceover_regeneration.append(
                    {
                        'exploration_id': exploration_id,
                        'language_accent_code': language_accent_code,
                        'error_messages': errors_while_voiceover_regeneration,
                    }
                )
                number_of_contents_failed_to_regenerate += len(
                    errors_while_voiceover_regeneration
                )

    # Confirming that the app can deliver emails.
    server_can_send_emails = (
        platform_parameter_services.get_platform_parameter_value(
            platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS.value
        )
    )
    if server_can_send_emails:
        send_email_to_voiceover_admins_and_tech_leads_after_regeneration(
            exploration_id,
            exploration_title,
            date_time,
            language_accents_used_for_voiceover_regeneration,
            error_collections_during_voiceover_regeneration,
            number_of_contents_for_voiceover_regeneration,
            number_of_contents_failed_to_regenerate,
            author_id,
        )


def regenerate_voiceovers_for_updated_exploration(
    exploration_id: str,
    exploration_title: str,
    exploration_version: int,
    author_id: str,
    date_time: str,
) -> None:
    """Regenerates voiceovers for the updated exploration based on the changes
    made in the exploration content (in English) or translations (in other
    languages) from the Exploration editor page.

    NOTE: Always invoke this method from a deferred task, as it is a
    time-consuming operation and should be performed asynchronously.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        exploration_title: str. The title of the exploration.
        exploration_version: int. The version of the exploration for which
            voiceovers need to be regenerated.
        author_id: str. The ID of the author who made the changes to the
            exploration.
        date_time: str. The date and time when the changes were
            made to the exploration.

    Raises:
        Exception. If the voiceover regeneration fails for any of the content
            IDs or language-accent codes.
    """
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
            # CMD_EDIT_STATE_PROPERTY is used to fetch the updated content for
            # the English language.
            updated_content = change['new_value']['html']
            content_id = change['new_value']['content_id']
            language_code_to_contents_mapping.setdefault('en', {})[
                content_id
            ] = updated_content
        elif cmd == exp_domain.CMD_EDIT_TRANSLATION:
            # CMD_EDIT_TRANSLATION is used to fetch the updated content for
            # the translations in other languages.
            language_code = change['language_code']
            updated_content = change['translation']['content_value']
            content_id = change['content_id']
            language_code_to_contents_mapping.setdefault(language_code, {})[
                content_id
            ] = updated_content

    _regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_title,
        exploration_version,
        language_code_to_contents_mapping,
        date_time,
        author_id,
    )


def regenerate_voiceovers_on_exploration_curation(
    exploration_id: str,
    date_time: str,
    author_id: str,
) -> None:
    """Regenerates all voiceovers (in English and in all the available
    translated languages) for the given exploration when it is curated — i.e.,
    added to a published story.

    NOTE: This is a time-intensive operation and must be executed via a
    deferred task to ensure it runs asynchronously.

    Args:
        exploration_id: str. The ID of the exploration to regenerate
            voiceovers for.
        date_time: str. The timestamp when the exploration was curated.
        author_id: str. The ID of the user who curated the exploration.
    """
    # A dictionary where each key is a language code, and each value is a
    # content mapping dictionary. The content mapping dictionary contains
    # content IDs as keys and their corresponding HTML content as values.
    language_code_to_contents_mapping: Dict[str, Dict[str, str]] = {}

    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    assert exploration is not None

    exploration_version = exploration.version
    exploration_title = exploration.title

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

    _regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_title,
        exploration_version,
        language_code_to_contents_mapping,
        date_time,
        author_id,
    )


def regenerate_voiceovers_of_exploration_for_given_language_accent(
    exploration_id: str,
    language_accent_code: str,
    author_id: str,
    date_time: str,
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
        author_id: str. The ID of the user who initiated the voiceover
            regeneration.
        date_time: str. The timestamp when the voiceover regeneration was
            initiated.

    Raises:
        Exception. If the provided language accent code is invalid.
    """
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
    exploration_title = exploration.title

    if language_code == constants.DEFAULT_LANGUAGE_CODE:
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

    _regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_title,
        exploration_version,
        language_code_to_contents_mapping,
        date_time,
        author_id,
    )


def generate_voiceover_from_translated_content(
    exploration_id: str,
    exploration_version: int,
    translation_content: str,
    content_id: str,
    language_code: str,
) -> None:
    """Generates a new voiceover for translated content once translation
    suggestions are approved by reviewers.

    Args:
        exploration_id: str. The ID of the exploration.
        exploration_version: int. The version of the exploration.
        translation_content: str. The translated content for which the
            voiceover needs to be generated.
        content_id: str. The content ID for which the voiceover is being
            generated.
        language_code: str. The language code for the voiceover.
    """
    language_code_to_contents_mapping = {
        language_code: {content_id: translation_content}
    }
    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    assert exploration is not None
    exploration_title = exploration.title

    _regenerate_voiceovers_for_given_contents(
        exploration_id,
        exploration_title,
        exploration_version,
        language_code_to_contents_mapping,
        datetime.datetime.utcnow().isoformat(),
        feconf.SYSTEM_COMMITTER_ID,
    )
