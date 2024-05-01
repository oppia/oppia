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

"""Model for storing voiceovers."""

from __future__ import annotations

from core import feconf
from core.platform import models

from typing import Dict, Final, List, TypedDict, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([
    models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

VOICEOVER_AUTOGENERATION_POLICY_ID: Final = 'voiceover_policy'


class VoiceoverDict(TypedDict):
    """Dictionary representing Voiceover object."""

    filename: str
    file_size_bytes: int
    needs_update: bool
    duration_secs: float


VoiceoversAndContentsMappingType = Dict[
    str, Dict[
        str, Union[
            str,
            Dict[str, List[str]],
            List[VoiceoverDict]
        ]
    ]
]


class EntityVoiceoversModel(base_models.BaseModel):
    """Model for storing entity voiceovers."""

    # The id of the corresponding entity.
    entity_id = datastore_services.StringProperty(required=True, indexed=True)
    # The type of the corresponding entity.
    entity_type = datastore_services.StringProperty(
        required=True, indexed=True, choices=[
            feconf.ENTITY_TYPE_EXPLORATION
        ])
    # The version of the corresponding entity.
    entity_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # A language-accent code, e.g., en-US.
    language_accent_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # A dict representing content IDs as keys and nested dicts as values.
    # Each nested dict contains 'manual' and 'auto' as keys and VoiceoverDict
    # as values.
    voiceovers = datastore_services.JsonProperty(required=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_accent_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'voiceovers': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @staticmethod
    def _generate_id(
        entity_type: str,
        entity_id: str,
        entity_version: int,
        language_accent_code: str
    ) -> str:
        """Generates the ID for an entity voiceovers model.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.
            entity_version: int. The version of the entity.
            language_accent_code: str.
                The language-accent code in which the voiceover is stored.

        Returns:
            str. Returns a unique id of the form
            [entity_type]-[entity_id]-[entity_version]-[language_accent_code].
        """
        return '%s-%s-%s-%s' % (
            entity_type, entity_id, str(entity_version), language_accent_code)

    @classmethod
    def get_model(
        cls,
        entity_type: str,
        entity_id: str,
        entity_version: int,
        language_accent_code: str
    ) -> EntityVoiceoversModel:
        """Gets EntityVoiceoversModel by help of entity_type, entity_id,
        entity_version and language_accent_code.

        Args:
            entity_type: str. The type of the entity whose voiceovers are
                to be fetched.
            entity_id: str. The ID of the entity whose voiceovers are to be
                fetched.
            entity_version: int. The version of the entity whose voiceovers
                are to be fetched.
            language_accent_code: str. The language-accent code of the
                voiceovers.

        Returns:
            EntityVoiceoversModel. The EntityVoiceoversModel instance
            corresponding to the given inputs, if such a voiceover
            exists, or None if no voiceover is found.
        """
        model_id = cls._generate_id(
            entity_type, entity_id, entity_version, language_accent_code)
        return cls.get_by_id(model_id)

    @classmethod
    def create_new(
        cls,
        entity_type: str,
        entity_id: str,
        entity_version: int,
        language_accent_code: str,
        voiceovers: Dict[str, Dict[str, VoiceoverDict]]
    ) -> EntityVoiceoversModel:
        """Creates and returns a new EntityVoiceoversModel instance.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.
            entity_version: int. The version of the entity.
            language_accent_code: str. The language code for the entity.
            voiceovers: dict(str, dict(str, VoiceoverDict)). A dict
                containing content IDs as keys and nested dicts as values.
                Each nested dict contains str as keys and
                VoiceoverDict as values.

        Returns:
            EntityVoiceoversModel. Returns a new EntityVoiceoversModel.
        """
        return cls(
            id=cls._generate_id(
                entity_type, entity_id, entity_version, language_accent_code),
            entity_type=entity_type,
            entity_id=entity_id,
            entity_version=entity_version,
            language_accent_code=language_accent_code,
            voiceovers=voiceovers
        )


class VoiceoverAutogenerationPolicyModel(base_models.BaseModel):
    """Model for storing language-accent codes for Oppia supported voiceovers.

    There should only be one instance of this class, and it is keyed by
    VOICEOVER_AUTOGENERATION_POLICY_ID.
    """

    # A dict with language_codes as keys and nested dicts as values.
    # Each nested dict contains language_accent_codes as keys and booleans
    # indicating whether it's possible to generate automatic voiceovers
    # for this language-accent code as values.
    language_codes_mapping = datastore_services.JsonProperty(required=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'language_codes_mapping': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class VoiceArtistMetadataModel(base_models.BaseModel):
    """The model stores manual voice artists' information with their
    provided voiceovers metadata.
    Instances of this class are keyed by the user ID.
    """

    # Dictionary mapping language codes to nested dictionaries. Each
    # nested dictionary contains the following key-value pairs:
    # - 'language_accent_code': A string indicating the accent code of
    # the voice artist for voiceovers in the respective language.
    # - 'exploration_id_to_content_ids': A mapping from exploration IDs
    # (strings) to lists of content IDs (strings), denoting the content IDs
    # for which voiceovers are provided in a given exploration by the
    # voice artist.
    # - 'voiceovers': A list of sample voiceovers, where each voiceover is
    # represented as a dictionary (VoiceoverDict). This field specifically
    # contains the five sample voiceovers with the longest duration.
    voiceovers_and_contents_mapping = (
        datastore_services.JsonProperty(required=True))

    @classmethod
    def has_reference_to_user_id(cls, voice_artist_id: str) -> bool:
        """Check whether VoiceArtistMetadataModel references user.

        Args:
            voice_artist_id: str. The ID of the user whose data
                should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get(voice_artist_id, strict=False) is not None

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user to export."""
        return dict(
            super(
                VoiceArtistMetadataModel, cls
            ).get_export_policy(), **{
                'voiceovers_and_contents_mapping': (
                    base_models.EXPORT_POLICY.EXPORTED)
            }
        )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """The model contains data corresponding to a user: user_id and their
        provided voiceover data, but it isn't deleted because the voiceover
        data is needed to classify voiceovers.
        """
        return base_models.DELETION_POLICY.KEEP

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model contain user ID of voice artist and their provided
        voiceovers metadata.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def create(
        cls,
        voice_artist_id: str,
        voiceovers_and_contents_mapping: VoiceoversAndContentsMappingType
    ) -> VoiceArtistMetadataModel:
        """Creates a new VoiceArtistMetadataModel instance.

        Args:
            voice_artist_id: str. User ID of the voice artist.
            voiceovers_and_contents_mapping: VoiceoversAndContentsMappingType.
                A dictionary mapping language codes to nested dictionaries.
                Each nested dictionary contains the following key-value pairs:
                (a). 'language_accent_code': A string indicating the accent
                code of the voice artist for voiceovers in the respective
                language.
                (b). 'exploration_id_to_content_ids': A mapping from
                exploration IDs (strings) to lists of content IDs (strings),
                denoting the content IDs for which voiceovers are provided in a
                given exploration by the voice artist.
                (c). 'voiceovers': A list of sample voiceovers, where each
                voiceover is represented as a dictionary (VoiceoverDict).
                This field specifically contains the five sample voiceovers
                with the longest duration.

        Returns:
            VoiceArtistMetadataModel. The newly created
            VoiceArtistMetadataModel instance.

        Raises:
            Exception. A voice artist metadata model with a given voice
                artist ID already exists.
        """
        if cls.get(voice_artist_id, strict=False):
            raise Exception(
                'A voice artist metadata model with a given voice'
                'artist ID already exists')

        entity = cls(
            id=voice_artist_id,
            voiceovers_and_contents_mapping=voiceovers_and_contents_mapping
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, VoiceoversAndContentsMappingType]:
        """Exports the data from VoiceArtistMetadataModel into
        dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from VoiceArtistMetadataModel.
        """
        user_data: Dict[str, VoiceoversAndContentsMappingType] = {}
        voice_artist_metadata_model = cls.get(user_id, strict=False)
        if voice_artist_metadata_model is not None:
            user_data = {
                'voiceovers_and_contents_mapping': (
                    voice_artist_metadata_model.voiceovers_and_contents_mapping)
            }
        return user_data
