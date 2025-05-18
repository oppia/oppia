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

from typing import Dict, List, Optional, Sequence, cast

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
        'voiceovers_mapping': entity_voiceovers_model.voiceovers_mapping,
        'automated_voiceovers_audio_offsets_msecs': (
            entity_voiceovers_model.automated_voiceovers_audio_offsets_msecs)
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
                entity_voiceovers_dict['voiceovers_mapping'],
                entity_voiceovers_dict[
                    'automated_voiceovers_audio_offsets_msecs']
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


def is_voiceover_autogeneration_using_cloud_service_enabled() -> bool:
    """The method verifies whether admins have enabled the configuration
    for generating voiceovers automatically using cloud service.

    Returns:
        bool. True if cloud based voiceover autogeneration is enabled,
        False otherwise.
    """
    voiceover_autogeneration_policy_model = (
        voiceover_models.VoiceoverAutogenerationPolicyModel.get(
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False)
    )

    autogenerated_voiceovers_are_enabled: bool = False

    if voiceover_autogeneration_policy_model is not None:
        autogenerated_voiceovers_are_enabled = (
            voiceover_autogeneration_policy_model.
            autogenerated_voiceovers_are_enabled
        )
    return autogenerated_voiceovers_are_enabled


def update_admin_config_for_voiceover_autogeneration(
    autogenerated_voiceovers_are_enabled: bool
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
            voiceover_models.VOICEOVER_AUTOGENERATION_POLICY_ID, strict=False))

    assert voiceover_autogeneration_policy_model is not None

    (
        voiceover_autogeneration_policy_model.
        autogenerated_voiceovers_are_enabled
    ) = (
        autogenerated_voiceovers_are_enabled
    )

    voiceover_autogeneration_policy_model.update_timestamps()
    voiceover_autogeneration_policy_model.put()


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
    automated_voiceovers_audio_offsets_msecs_dict = entity_voiceovers_dict[
        'automated_voiceovers_audio_offsets_msecs']

    entity_voiceovers_model = (
        voiceover_models.EntityVoiceoversModel.create_new(
            entity_type, entity_id, entity_version,
            language_accent_code, voiceovers_mapping,
            automated_voiceovers_audio_offsets_msecs_dict
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


def get_language_code_from_language_accent_code(
    language_accent_code: str
) -> Optional[str]:
    """The method returns the language code corresponding to the provided
    language accent code.

    Args:
        language_accent_code: str. Language accent code.

    Returns:
        str. The language code corresponds to the provided language accent code.
    """
    language_accent_master_dict = (
        get_language_accent_master_list())
    language_code_for_given_accent = None

    for language_code, language_accent_code_to_description in (
            language_accent_master_dict.items()):
        if language_accent_code in list(
                language_accent_code_to_description.keys()):
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
        feconf.VOICEOVERS_DATA_DIR, 'autogeneratable_language_accent_list.json')
    with utils.open_file(file_path, 'r') as f:
        autogeneratable_language_accent_list: Dict[str, Dict[str, str]] = (
            json.loads(f.read()))
        return autogeneratable_language_accent_list


def get_all_voice_artist_language_accent_mapping() -> Dict[str, Dict[str, str]]:
    """The method returns a dict with all voice artist IDs as keys and nested
    dicts as values. Each nested dict contains language codes as keys and
    language accent codes as values.

    Returns:
        dict(str, dict(str, str)). A dict representing voice artist IDs to
        language mappings.
    """
    voice_artist_id_to_language_mapping: Dict[str, Dict[str, str]] = {}
    all_voice_artist_to_language_mapping: Dict[str, Dict[str, str]] = {}

    voice_artist_metadata_models: Sequence[
        voiceover_models.VoiceArtistMetadataModel] = (
            voiceover_models.VoiceArtistMetadataModel.get_all().fetch())

    exploration_voice_artist_link_models: Sequence[
        voiceover_models.ExplorationVoiceArtistsLinkModel] = (
            voiceover_models.ExplorationVoiceArtistsLinkModel.get_all().fetch()
        )

    for voice_artist_metadata_model in voice_artist_metadata_models:
        voice_artist_id = voice_artist_metadata_model.id
        language_code_to_accent = (
            voice_artist_metadata_model.language_code_to_accent)

        voice_artist_id_to_language_mapping[voice_artist_id] = (
            language_code_to_accent
        )

    for exp_voice_artist_model in exploration_voice_artist_link_models:
        content_id_to_voiceovers_mapping = (
            exp_voice_artist_model.content_id_to_voiceovers_mapping)

        for lang_voiceover_mapping_tuple in (
                content_id_to_voiceovers_mapping.values()):

            for lang_code, voiceover_tuple in (
                    lang_voiceover_mapping_tuple.items()):

                voice_artist_id = voiceover_tuple[0]

                accent_type = ''
                if (
                    voice_artist_id in voice_artist_id_to_language_mapping and
                    lang_code in voice_artist_id_to_language_mapping[
                        voice_artist_id]
                ):
                    accent_type = (
                        voice_artist_id_to_language_mapping[
                            voice_artist_id][lang_code])

                if voice_artist_id not in all_voice_artist_to_language_mapping:
                    all_voice_artist_to_language_mapping[voice_artist_id] = {}

                all_voice_artist_to_language_mapping[
                    voice_artist_id][lang_code] = accent_type

    return all_voice_artist_to_language_mapping


def get_voice_artist_ids_to_voice_artist_names() -> Dict[str, str]:
    """The method returns a dict with all the voice artist IDs as keys and
    their respective usernames as values.

    Returns:
        dict(str, str). A dict with all the voice artist IDs as keys and their
        respective usernames as values.
    """
    voice_artist_id_to_voice_artist_name: Dict[str, str] = {}

    exploration_voice_artist_link_models: Sequence[
        voiceover_models.ExplorationVoiceArtistsLinkModel] = (
            voiceover_models.ExplorationVoiceArtistsLinkModel.get_all().fetch()
        )

    for exp_voice_artist_model in exploration_voice_artist_link_models:
        content_id_to_voiceovers_mapping = (
            exp_voice_artist_model.content_id_to_voiceovers_mapping)

        for lang_voiceover_mapping_tuple in (
                content_id_to_voiceovers_mapping.values()):

            for voiceover_tuple in (
                    lang_voiceover_mapping_tuple.values()):

                voice_artist_id = voiceover_tuple[0]

                if voice_artist_id in voice_artist_id_to_voice_artist_name:
                    continue

                voice_artist_name = user_services.get_username(voice_artist_id)

                voice_artist_id_to_voice_artist_name[voice_artist_id] = (
                    voice_artist_name)

    return voice_artist_id_to_voice_artist_name


def get_voiceover_filenames(
    voice_artist_id: str, language_code: str
) -> Dict[str, List[str]]:
    """The function returns a dictionary where each exploration ID corresponds
    to a list of filenames. These exploration IDs represent the explorations
    in which a specified voice artist has contributed voiceovers. The list of
    filenames contains up to five entries, representing the longest-duration
    voiceovers contributed by the specified artist.

    Args:
        voice_artist_id: str. The voice artist ID for which filenames should be
            fetched.
        language_code: str. The language in which voiceovers have been
            contributed.

    Returns:
        dict(str, list(str)). A dict with exploration IDs as keys and list of
        voiceover filenames as values.
    """

    exploration_id_to_filenames: Dict[str, List[str]] = {}
    filename_to_exp_id: Dict[str, str] = {}
    contributed_voiceovers: List[state_domain.VoiceoverDict] = []

    exp_voice_artist_link_models: Sequence[
        voiceover_models.ExplorationVoiceArtistsLinkModel] = (
            voiceover_models.ExplorationVoiceArtistsLinkModel.
            get_all().fetch()
        )

    for exp_voice_artist_model in exp_voice_artist_link_models:
        exploration_id = exp_voice_artist_model.id
        content_id_to_voiceovers_mapping = (
            exp_voice_artist_model.content_id_to_voiceovers_mapping)

        for lang_code_to_voiceover_mapping in (
                content_id_to_voiceovers_mapping.values()):

            for lang_code, voiceover_mapping_tuple in (
                    lang_code_to_voiceover_mapping.items()):

                if lang_code != language_code:
                    continue

                retrieved_voice_artist_id = voiceover_mapping_tuple[0]
                voiceover_dict = voiceover_mapping_tuple[1]

                if voice_artist_id != retrieved_voice_artist_id:
                    continue

                filename_to_exp_id[voiceover_dict['filename']] = exploration_id

                contributed_voiceovers.append(voiceover_dict)

    # The key for sorting is defined separately because of a mypy bug.
    # A [no-any-return] is thrown if key is defined in the sort()
    # method instead.
    # https://github.com/python/mypy/issues/9590
    k = lambda voiceover: voiceover['duration_secs']
    contributed_voiceovers.sort(key=k, reverse=True)

    if (
        len(contributed_voiceovers) >
        MAX_SAMPLE_VOICEOVERS_FOR_GIVEN_VOICE_ARTIST
    ):
        # According to the product specifications, up to five sample voiceovers
        # will be provided to voiceover administrators to assist them in
        # identifying the particular accent needed for the given voiceover in a
        # specific language.
        contributed_voiceovers = contributed_voiceovers[:5]

    for voiceover_dict in contributed_voiceovers:
        filename = voiceover_dict['filename']
        exp_id = filename_to_exp_id[filename]
        if exp_id not in exploration_id_to_filenames:
            exploration_id_to_filenames[exp_id] = []
        exploration_id_to_filenames[exp_id].append(filename)

    return exploration_id_to_filenames


def update_voice_artist_metadata(
    voice_artist_id: str,
    language_code_to_accent: Dict[str, str]
) -> None:
    """The method updates or creates metadata for a voice artist in the
    VoiceArtistMetadataModel.

    Args:
        voice_artist_id: str. The ID of the voice artist for which metadata
            needs to be updated.
        language_code_to_accent: dict(str, str). A dict representing the
            language accent codes as keys and accent codes as their
            corresponding value.
    """
    voice_artist_metadata_model = (
        voiceover_models.VoiceArtistMetadataModel.get(
            voice_artist_id, strict=False))

    if voice_artist_metadata_model is None:
        voiceover_models.VoiceArtistMetadataModel.create_model(
            voice_artist_id, language_code_to_accent)
    else:
        voice_artist_metadata_model.language_code_to_accent = (
            language_code_to_accent)
        voice_artist_metadata_model.update_timestamps()
        voice_artist_metadata_model.put()


def update_voice_artist_language_mapping(
    voice_artist_id: str, language_code: str, language_accent_code: str
) -> None:
    """The method updates the language accent information for the given voice
    artist in the given language code.

    Args:
        voice_artist_id: str. The voice artist ID for which language accent
            needs to be updated.
        language_code: str. The language code for which the accent needs to be
            updated.
        language_accent_code: str. The updated language accent code.
    """
    voice_artist_metadata_model = voiceover_models.VoiceArtistMetadataModel.get(
        voice_artist_id, strict=False)
    language_code_to_accent = {}

    if voice_artist_metadata_model is None:
        voice_artist_metadata_model = (
            create_voice_artist_metadata_model_instance(
                voice_artist_id=voice_artist_id,
                language_code_to_accent={}
            )
        )
    else:
        language_code_to_accent = (
            voice_artist_metadata_model.language_code_to_accent)

    language_code_to_accent[language_code] = language_accent_code

    voice_artist_metadata_model.language_code_to_accent = (
        language_code_to_accent)

    voice_artist_metadata_model.update_timestamps()
    voice_artist_metadata_model.put()


def create_voice_artist_metadata_model_instance(
    voice_artist_id: str,
    language_code_to_accent: Dict[str, str]
) -> voiceover_models.VoiceArtistMetadataModel:
    """Creates a VoiceArtistMetadataModel instance.

    Args:
        voice_artist_id: str. The ID of the voice artist for which new model
            will be created.
        language_code_to_accent: dict(str, str). A dict representing the
            language codes as keys and accent codes as their corresponding
            values.

    Returns:
        VoiceArtistMetadataModel. A new VoiceArtistMetadataModel instance
        that connects voiceover artists with the languages in which they have
        provided voiceovers.
    """
    voice_artist_metadata_model = voiceover_models.VoiceArtistMetadataModel(
        id=voice_artist_id,
        language_code_to_accent=language_code_to_accent)
    voice_artist_metadata_model.update_timestamps()

    return voice_artist_metadata_model


def create_exploration_voice_artists_link_model_instance(
    exploration_id: str,
    content_id_to_voiceovers_mapping: (
        voiceover_domain.ContentIdToVoiceoverMappingType)
) -> voiceover_models.ExplorationVoiceArtistsLinkModel:
    """Instantiates an ExplorationVoiceArtistsLinkModel, establishing a link
    between the latest content IDs within an exploration and the corresponding
    IDs of voice artists who provided voiceovers in the specified language code.
    Instances of this class are keyed by the exploration ID.

    Args:
        exploration_id: str. The ID of the exploration for which new model will
            be created.
        content_id_to_voiceovers_mapping: ContentIdToVoiceoverMappingType. The
            dictionary contains information about voice artists and their
            provided voiceovers in the exploration with the given exploration
            ID. The dict maps content IDs to nested dicts. Each nested dicts
            maps language code to voice artist and voiceover tuple.

    Returns:
        ExplorationVoiceArtistsLinkModel. An instance of
        ExplorationVoiceArtistsLinkModel, establishing a link between the latest
        content IDs within an exploration and the corresponding IDs of
        voice artists who provided voiceovers.
    """
    exploration_voice_artists_link_model = (
        voiceover_models.ExplorationVoiceArtistsLinkModel(
            id=exploration_id,
            content_id_to_voiceovers_mapping=content_id_to_voiceovers_mapping
        )
    )
    exploration_voice_artists_link_model.update_timestamps()

    return exploration_voice_artists_link_model


def update_exploration_voice_artist_link_model(
    user_id: str,
    change_list: Sequence[exp_domain.ExplorationChange],
    old_exploration: exp_domain.Exploration,
    updated_exploration: exp_domain.Exploration
) -> None:
    """Create or update a voice artist link model following modifications to
    the recorded voiceover property in an exploration's state.

    Args:
        user_id: str. The committer ID for the given change list.
        change_list: list(ExplorationChange). A list of exploration change
            objects.
        old_exploration: Exploration. An instance of exploration class
            representing an old version.
        updated_exploration: Exploration. An instance of exploration class
            representing the latest version.
    """

    if not feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.
            AUTO_UPDATE_EXP_VOICE_ARTIST_LINK.value,
            None):
        return

    is_voiceover_changes_made: bool = False
    for change in change_list:
        if (
            change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
            change.property_name == (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS)
        ):
            is_voiceover_changes_made = True
            break

    if not is_voiceover_changes_made:
        return

    old_filenames: List[str] = []
    for state in old_exploration.states.values():
        voiceovers_mapping = state.recorded_voiceovers.voiceovers_mapping
        for lang_code_to_voiceovers in voiceovers_mapping.values():
            for voiceover_dict in lang_code_to_voiceovers.values():
                old_filenames.append(voiceover_dict.filename)

    exp_voice_artist_link_model = (
        voiceover_models.ExplorationVoiceArtistsLinkModel.get(
            updated_exploration.id, strict=False))

    content_id_to_voiceovers_mapping: (
        voiceover_domain.ContentIdToVoiceoverMappingType) = (
            collections.defaultdict(dict))

    if exp_voice_artist_link_model is not None:
        content_id_to_voiceovers_mapping.update(
            exp_voice_artist_link_model.content_id_to_voiceovers_mapping)

    for state in updated_exploration.states.values():
        voiceovers_mapping = state.recorded_voiceovers.voiceovers_mapping
        for content_id, lang_code_to_voiceovers in voiceovers_mapping.items():
            for lang_code, voiceover_dict in lang_code_to_voiceovers.items():
                filename = voiceover_dict.filename

                if filename in old_filenames:
                    continue
                content_id_to_voiceovers_mapping[content_id][lang_code] = (
                    user_id, voiceover_dict.to_dict())

    if exp_voice_artist_link_model is None:
        exp_voice_artist_link_model = (
            create_exploration_voice_artists_link_model_instance(
                exploration_id=updated_exploration.id,
                content_id_to_voiceovers_mapping=(
                    content_id_to_voiceovers_mapping)
            )
        )
    else:
        exp_voice_artist_link_model.content_id_to_voiceovers_mapping = (
            content_id_to_voiceovers_mapping)

    exp_voice_artist_link_model.update_timestamps()
    exp_voice_artist_link_model.put()
