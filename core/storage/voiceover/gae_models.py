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

from typing import Dict, Final, Optional, Sequence

MYPY = False
if MYPY: # pragma: no cover
    # Here, 'state_domain' is imported only for type checking.
    from core.domain import state_domain # pylint: disable=invalid-import # isort:skip
    # Here, 'voiceover_domain' is imported only for type checking.
    from core.domain import voiceover_domain # pylint: disable=invalid-import # isort:skip
    from mypy_imports import base_models
    from mypy_imports import datastore_services

    ContentIdToVoiceoverMappingType = (
        voiceover_domain.ContentIdToVoiceoverMappingType)

(base_models,) = models.Registry.import_models([
    models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

VOICEOVER_AUTOGENERATION_POLICY_ID: Final = 'voiceover_policy'


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
    voiceovers_mapping = datastore_services.JsonProperty(required=True)

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
            'voiceovers_mapping': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @staticmethod
    def generate_id(
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
        model_id = cls.generate_id(
            entity_type, entity_id, entity_version, language_accent_code)
        return cls.get_by_id(model_id)

    @classmethod
    def create_new(
        cls,
        entity_type: str,
        entity_id: str,
        entity_version: int,
        language_accent_code: str,
        voiceovers_mapping: Dict[str, Dict[
            feconf.VoiceoverType.value, Optional[state_domain.VoiceoverDict]]]
    ) -> EntityVoiceoversModel:
        """Creates and returns a new EntityVoiceoversModel instance.

        Args:
            entity_type: str. The type of the entity.
            entity_id: str. The ID of the entity.
            entity_version: int. The version of the entity.
            language_accent_code: str. The language code for the entity.
            voiceovers_mapping:
                dict(str, dict(VoiceoverType.value, VoiceoverDict)). A dict
                containing content IDs as keys and nested dicts as values. Each
                nested dict contains str as keys and VoiceoverDict as values.

        Returns:
            EntityVoiceoversModel. Returns a new EntityVoiceoversModel.
        """
        return cls(
            id=cls.generate_id(
                entity_type, entity_id, entity_version, language_accent_code),
            entity_type=entity_type,
            entity_id=entity_id,
            entity_version=entity_version,
            language_accent_code=language_accent_code,
            voiceovers_mapping=voiceovers_mapping
        )

    @classmethod
    def get_entity_voiceovers_for_given_exploration(
        cls, entity_id: str, entity_type: str, entity_version: int
    ) -> Sequence[EntityVoiceoversModel]:
        """Retrieves voiceovers models for the specified exploration data.

        Args:
            entity_id: str. The entity ID for which entity voiceovers need to be
                fetched.
            entity_type: str. The entity type for which entity voiceovers need
                to be fetched.
            entity_version: int. The entity version of the given exploration for
                which entity voiceovers need to be fetched.

        Returns:
            list(EntityVoiceovers|None). Returns a list of entity voiceover
            models for the specified exploration and version.
        """

        return cls.query(
            cls.entity_type == entity_type,
            cls.entity_id == entity_id,
            cls.entity_version == entity_version
        ).fetch()


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

    # A dictionary that maps language codes to accent codes. This field
    # indicates the languages and corresponding accents in which the specified
    # voice artist has provided voiceovers for curated explorations.
    language_code_to_accent = datastore_services.JsonProperty(
        default={}, indexed=False, required=True)

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
                'language_code_to_accent': (
                    base_models.EXPORT_POLICY.EXPORTED)
            }
        )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """The model contains data corresponding to a user: user_id and their
        provided language code for in which they contributed to voiceovers. This
        model is a transient one and is expected to be deleted by June 30, 2024.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The model contains the user ID of the voice artist and the language
        code and accent code in which they provided voiceovers.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @classmethod
    def create_model(
        cls,
        voice_artist_id: str,
        language_code_to_accent: Dict[str, str]
    ) -> VoiceArtistMetadataModel:
        """Creates a new VoiceArtistMetadataModel instance.

        Note that Beam jobs will still be able to modify this model after its
        creation because they bypass this method.

        Args:
            voice_artist_id: str. User ID of the voice artist.
            language_code_to_accent: dict(str, str). A dictionary mapping
                language codes to its corresponding language accent codes.

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
            language_code_to_accent=language_code_to_accent
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, Dict[str, str]]:
        """Exports the data from VoiceArtistMetadataModel into
        dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from VoiceArtistMetadataModel.
        """
        user_data: Dict[str, Dict[str, str]] = {}
        voice_artist_metadata_model = cls.get(user_id, strict=False)

        if voice_artist_metadata_model is not None:
            user_data = {
                'language_code_to_accent': (
                    voice_artist_metadata_model.language_code_to_accent)
            }
        return user_data


class ExplorationVoiceArtistsLinkModel(base_models.BaseModel):
    """The model links the exploration's latest content IDs and the voice
    artist ID who contributed voiceovers in the given language code.
    Instances of this class are keyed by the exploration ID.
    """

    # A dictionary with content IDs as keys and nested dicts as values. Each
    # nested dict contains language codes as keys and a 2-tuple as values. The
    # 2-tuple contains voice artist ID as the first element and VoiceoverDict
    # as the second element.
    content_id_to_voiceovers_mapping = (
        datastore_services.JsonProperty(required=True))

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """The model contains data corresponding to a user, but this isn't
        exported because the exploration voice artist link model stores the
        content IDs, language codes, and voiceover dicts for which they have
        contributed voiceovers and are not relevant to the user for Takeout.
        """
        return dict(
            super(
                ExplorationVoiceArtistsLinkModel, cls
            ).get_export_policy(), **{
                'content_id_to_voiceovers_mapping': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE)
            }
        )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user. This
        model is a transient one and is expected to be deleted by June 30, 2024.
        """
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The model contains data corresponding to a user, but this isn't
        exported because the exploration voice artist link model stores the
        content IDs, language codes, and voiceover dicts for which they have
        contributed voiceovers and are not relevant to the user for Takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def create_model(
        cls,
        exploration_id: str,
        content_id_to_voiceovers_mapping: ContentIdToVoiceoverMappingType,
    ) -> ExplorationVoiceArtistsLinkModel:
        """Creates a new ExplorationVoiceArtistsLinkModel instance.

        Note that Beam jobs will still be able to modify this model after its
        creation because they bypass this method.

        Args:
            exploration_id: str. The ID of the exploration for which new model
                will be created.
            content_id_to_voiceovers_mapping: ContentIdToVoiceoverMappingType.
                A dictionary with content IDs as keys and nested dicts as
                values. Each nested dict contains language codes as keys and a
                2-tuple as values. The 2-tuple contains voice artist ID as the
                first element and VoiceoverDict as the second element.

        Returns:
            ExplorationVoiceArtistsLinkModel. The newly created
            ExplorationVoiceArtistsLinkModel instance.

        Raises:
            Exception. An exploration voice artist link model with a given
                exploration ID already exists.
        """

        if cls.get(exploration_id, strict=False):
            raise Exception(
                'An exploration voice artist link model with a given '
                'exploration ID already exists')

        entity = cls(
            id=exploration_id,
            content_id_to_voiceovers_mapping=content_id_to_voiceovers_mapping
        )
        entity.update_timestamps()
        entity.put()

        return entity
