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
from core import utils
from core.platform import models

from typing import Dict, Final, Sequence, TypedDict

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


class VoiceoArtistToVoiceoverMetadataModel(base_models.BaseModel):
    """The model stores manual voice artists' information with their
    provided voiceover metadata.
    Instances of this class are keyed by the user ID.
    """

    # The ID of the voiceover artist's user.
    voice_artist_id = datastore_services.StringProperty(
        indexed=True, required=True)
    # A dictionary mapping language codes to nested dictionaries. Each
    # nested dictionary contains the following key-value pairs:
    # - 'language_accent_codes': A mapping of accent codes associated with
    # the language.
    # - 'exploration_id_to_content_ids': A mapping of exploration IDs to lists
    # of content IDs, representing the content IDs for which voice artists
    # have provided voiceovers.
    language_code_to_accent_and_contents_mapping = (
        datastore_services.JsonProperty(required=True))

    @classmethod
    def has_reference_to_user_id(cls, voice_artist_id: str) -> bool:
        """Check whether VoiceoArtistToVoiceoverMetadataModel references user.

        Args:
            voice_artist_id: str. The ID of the user whose data
                should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.voice_artist_id == voice_artist_id
        ).get(keys_only=True) is not None

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there can
        be multiple blog post models relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user to export."""
        return dict(
            super(
                VoiceoArtistToVoiceoverMetadataModel, cls
            ).get_export_policy(), **{
                # We do not export the author_id because we should not
                # export internal user ids.
                'voice_artist_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'language_code_to_accent_and_contents_mapping': (
                    base_models.EXPORT_POLICY.EXPORTED)
            }
        )

    @classmethod
    def generate_new_voice_artist_metadata_model_id(cls) -> str:
        """Generates a new voice artist metadata ID which is unique and is in
        the form of random hash of 12 chars.

        Returns:
            str. A voice artist metadata ID that is different from the IDs of
            all the existing voice artist metadata models.

        Raises:
            Exception. There were too many collisions with existing voice
                artist metadata IDs when attempting to generate a new ID.
        """
        for _ in range(base_models.MAX_RETRIES):
            voice_artist_metadata_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            if not cls.get_by_id(voice_artist_metadata_id):
                return voice_artist_metadata_id
        raise Exception(
            'New voice artist metadata id generator is producing too many'
            ' collisions.')

    @classmethod
    def create(
        cls, voice_artist_metadata_id: str, voice_artist_id: str
    ) -> VoiceoArtistToVoiceoverMetadataModel:
        """Creates a new BlogPostModel entry.

        Args:
            voice_artist_metadata_id: str. Voice artist to voiceover metadata
                model ID of the newly-created model.
            voice_artist_id: str. User ID of the voice artist.

        Returns:
            VoiceoArtistToVoiceoverMetadataModel. The newly created
            VoiceoArtistToVoiceoverMetadataModel instance.

        Raises:
            Exception. A voice artist to voiceover metadata model with given
            ID exists already.
        """
        if cls.get_by_id(voice_artist_metadata_id):
            raise Exception(
                'A voice artist to voiceover metadata model with the given '
                'ID exists already.')

        entity = cls(
            id=voice_artist_metadata_id,
            voice_artist_id=voice_artist_id,
            language_code_to_accent_and_contents_mapping={}
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def export_data(
        cls, user_id: str
    ) -> Dict[str, VoiceoArtistToVoiceoverMetadataModel]:
        """Exports the data from VoiceoArtistToVoiceoverMetadataModel into
        dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from
            VoiceoArtistToVoiceoverMetadataModel.
        """
        user_data: Dict[str, VoiceoArtistToVoiceoverMetadataModel] = {}
        voice_artist_metadata_models: Sequence[
            VoiceoArtistToVoiceoverMetadataModel] = cls.get_all().filter(
            cls.voice_artist_id == user_id).fetch()
        for voice_artist_metadata_model in voice_artist_metadata_models:
            user_data[voice_artist_metadata_model.id] = {
                'language_code_to_accent_and_contents_mapping': (
                    voice_artist_metadata_model.
                    language_code_to_accent_and_contents_mapping)
            }

        return user_data
