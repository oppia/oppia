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

"""Domain objects related to voiceovers."""

from __future__ import annotations

from core import feconf
from core import utils

from core.domain import state_domain

from typing import Dict


class EntityVoiceoverDict:
    """Dictionary representing the EntityVoiceover object."""

    entity_id: str
    entity_type: str
    entity_version: int
    language_accent_code: str
    voiceovers: Dict[str, Dict[str, feconf.VoiceoverDict]]


class EntityVoiceover:
    """A domain object to store all voiceovers for a given versioned-entity
    in a given language.

    NOTE: This domain object corresponds to EntityVoiceoversModel in the
    storage layer.

    Args:
        entity_id: str. The id of the corresponding entity.
        entity_type: str. The type of the corresponding entity.
        entity_version: str. The version of the corresponding entity.
        language_accent_code: str. The language accent code in which the
            voiceover is stored.
        voiceovers: dict(str, dict(str, VoiceoverDict)). A dict representing
            content-id as keys and a nested dict as values. The nested dict
            contains 'manual' and 'auto' as keys and dict(Voiceover)
            as values.
    """

    def __init__(
        self,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_accent_code: str,
        voiceovers: Dict[str, Dict[str, state_domain.Voiceover]]
    ) -> None:
        """Constructs an EntityVoiceover domain object.

        Args:
            entity_id: str. The ID of the entity.
            entity_type: str. The type of the entity.
            entity_version: int. The version of the entity.
            language_accent_code: str. The langauge accent code of the
                given voiceover.
            voiceovers: dict(str, dict(str, VoiceoverDict)). A dict representing
                content-id as keys and a nested dict as values. The nested dict
                contains 'manual' and 'auto' as keys and dict(Voiceover)
                as values.
        """
        self.entity_id = entity_id
        self.entity_type = entity_type.value
        self.entity_version = entity_version
        self.language_accent_code = language_accent_code
        self.voiceovers = voiceovers

    def to_dict(self) -> EntityVoiceoverDict:
        """Returns the dict representation of the EntityVoiceover object.

        Returns:
            EntityVoiceoverDict. The dict representation of the
            EntityVoiceover object.
        """
        voiceovers_dict = {}
        for content_id, voiceover_type_to_voiceover in self.voiceovers.items():
            voiceovers_dict[content_id] = {
                'manual': voiceover_type_to_voiceover['manual'].to_dict(),
                'auto': voiceover_type_to_voiceover['auto'].to_dict()
            }
        return {
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'entity_version': self.entity_version,
            'language_accent_code': self.language_accent_code,
            'voiceovers': voiceovers_dict
        }

    @classmethod
    def from_dict(
        cls, entity_voiceover_dict: EntityVoiceoverDict
    ) -> EntityVoiceover:
        """Creates the EntityVoiceover from the given dict.

        Args:
            entity_voiceover_dict: EntityVoiceoverDict. The dict
                representation of the EntityVoiceover object.

        Returns:
            EntityVoiceover. The EntityVoiceover object created using the
            given dict.
        """
        content_id_to_voiceovers = {}
        for content_id, voiceover_type_to_voiceover_dict in (
                entity_voiceover_dict['voiceovers'].items()):
            content_id_to_voiceovers[content_id] = {
                'manual':
                    voiceover_type_to_voiceover_dict['manual'].from_dict(),
                'auto': voiceover_type_to_voiceover_dict['auto'].from_dict(),
            }

        return cls(
            entity_voiceover_dict['entity_id'],
            entity_voiceover_dict['entity_type'],
            entity_voiceover_dict['entity_version'],
            entity_voiceover_dict['language_accent_code'],
            content_id_to_voiceovers
        )

    def validate(self):
        """Validates the EntityVoiceover object."""
        if not isinstance(self.entity_type, str):
            raise utils.ValidationError(
                'entity_type must be a string, recieved %r' % self.entity_type)
        if not isinstance(self.entity_id, str):
            raise utils.ValidationError(
                'entity_id must be a string, recieved %r' % self.entity_id)
        if not isinstance(self.entity_version, int):
            raise utils.ValidationError(
                'entity_version must be an int, recieved %r' %
                self.entity_version)
        if not isinstance(self.language_accent_code, str):
            raise utils.ValidationError(
                'language_accent_code must be a string, recieved %r' %
                self.language_accent_code)

        for content_id, voiceover_type_to_voiceover in self.voiceovers.items():
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'content_id must be a string, recieved %r' % content_id)
            for voiceover_type, voiceover in (
                    voiceover_type_to_voiceover.items()):
                if not isinstance(voiceover_type, str):
                    raise utils.ValidationError(
                        'voiceover type must be string, recieved %r' %
                        voiceover_type)
                if not isinstance(voiceover.filename, str):
                    raise utils.ValidationError(
                        'voieover filename must be string, recieved %r' %
                        voiceover.filename)
                if not isinstance(voiceover.file_size_bytes, int):
                    raise utils.ValidationError(
                        'voiceover file size must be an int, recieved %r' %
                        voiceover.file_size_bytes)
                if not isinstance(voiceover.needs_update, bool):
                    raise utils.ValidationError(
                        'needs_update must be a bool, recieved %r' %
                        voiceover.needs_update)
                if not isinstance(voiceover.duration_secs, float):
                    raise utils.ValidationError(
                        'voiceover duration must be float, recieved %r' %
                        voiceover.duration_secs)

    def add_voiceover(
        self,
        content_id: str,
        voiceover_type: str,
        voiceover: state_domain.Voiceover
    ):
        """Adds voiceover to the entity voiceover instance."""
        if not isinstance(content_id, str):
            raise utils.ValidationError(
                'content ID must be a str, received %r' % content_id)

        if voiceover_type not in ['manual', 'auto']:
            raise utils.ValidationError(
                'The voiceover type must be either manual or auto, but '
                'received %r' % voiceover_type)
        voiceover.validate()
        self.voiceovers[content_id][voiceover_type] = voiceover

    def remove_voiceover(
        self,
        content_id: str,
        voiceover_type: str
    ):
        """Removes voiceover from the entity voiceover instance."""
        if not isinstance(content_id, str):
            raise utils.ValidationError(
                'content ID must be a str, received %r' % content_id)

        if voiceover_type not in ['manual', 'auto']:
            raise utils.ValidationError(
                'The voiceover type must be either manual or auto, but '
                'received %r' % voiceover_type)

        del self.voiceovers[content_id][voiceover_type]

    @classmethod
    def create_empty(
        cls,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_accent_code: str
    ) -> EntityVoiceover:
        """Creates a new and empty EntityVoiceover object."""
        return cls(
            entity_id=entity_id,
            entity_type=entity_type,
            entity_version=entity_version,
            language_accent_code=language_accent_code,
            voiceovers={})
