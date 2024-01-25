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

import re

from core import feconf
from core import utils

from core.domain import state_domain

from typing import Dict, TypedDict


class EntityVoiceoversDict(TypedDict):
    """Dictionary representing the EntityVoiceovers object."""

    entity_id: str
    entity_type: str
    entity_version: int
    language_accent_code: str
    voiceovers: Dict[str, Dict[str, state_domain.VoiceoverDict]]


class EntityVoiceovers:
    """A domain object for the entity voiceovers instance for a given
    versioned entity in a given language-accent pair.

    NOTE: This domain object corresponds to EntityVoiceoversModel in the
    storage layer.

    Args:
        entity_id: str. The id of the corresponding entity.
        entity_type: str. The type of the corresponding entity.
        entity_version: str. The version of the corresponding entity.
        language_accent_code: str. The language-accent code in which the
            voiceover is stored.
        voiceovers: dict(str, dict(VoiceoverType, VoiceoverDict)). A dict
            containing content IDs as keys and nested dicts as values.
            Each nested dict contains VoiceoverType as keys and VoiceoverDict
            as values.
    """

    def __init__(
        self,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_accent_code: str,
        voiceovers: Dict[str, Dict[
            feconf.VoiceoverType, state_domain.Voiceover]]
    ) -> None:
        """Constructs an EntityVoiceovers domain object.

        Args:
            entity_id: str. The ID of the entity.
            entity_type: str. The type of the entity.
            entity_version: int. The version of the entity.
            language_accent_code: str. The language-accent code of the
                given voiceover.
            voiceovers: dict(str, dict(VoiceoverType, VoiceoverDict)). A dict
                containing content IDs as keys and nested dicts as values.
                Each nested dict contains VoiceoverType as keys and
                VoiceoverDict as values.
        """
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.entity_version = entity_version
        self.language_accent_code = language_accent_code
        self.voiceovers = voiceovers

    def to_dict(self) -> EntityVoiceoversDict:
        """Returns the dict representation of the EntityVoiceovers object.

        Returns:
            EntityVoiceoversDict. The dict representation of the
            EntityVoiceovers object.
        """
        voiceovers_dict = {}
        for content_id, voiceover_type_to_voiceover in self.voiceovers.items():
            voiceovers_dict[content_id] = {
                voiceover_type.value: voiceover_type_to_voiceover[
                    voiceover_type].to_dict()
                for voiceover_type in feconf.VoiceoverType
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
        cls, entity_voiceovers_dict: EntityVoiceoversDict
    ) -> EntityVoiceovers:
        """Creates the EntityVoiceovers instance from the given dict.

        Args:
            entity_voiceovers_dict: EntityVoiceoversDict. The dict
                representation of the EntityVoiceovers object.

        Returns:
            EntityVoiceovers. The EntityVoiceovers instance created using the
            given dict.
        """
        content_id_to_voiceovers = {}
        for content_id, voiceover_type_to_voiceover_dict in (
                entity_voiceovers_dict['voiceovers'].items()):
            content_id_to_voiceovers[content_id] = {
                voiceover_type: state_domain.Voiceover.from_dict(
                    voiceover_type_to_voiceover_dict[voiceover_type.value])
                for voiceover_type in feconf.VoiceoverType
            }
        return cls(
            entity_voiceovers_dict['entity_id'],
            entity_voiceovers_dict['entity_type'],
            entity_voiceovers_dict['entity_version'],
            entity_voiceovers_dict['language_accent_code'],
            content_id_to_voiceovers
        )

    def validate(self) -> None:
        """Validates the EntityVoiceovers object."""
        if not isinstance(self.entity_type, str):
            raise utils.ValidationError(
                'entity_type must be a string, received %s' % self.entity_type)
        if not isinstance(self.entity_id, str):
            raise utils.ValidationError(
                'entity_id must be a string, received %s' % self.entity_id)
        if not isinstance(self.entity_version, int):
            raise utils.ValidationError(
                'entity_version must be an int, received %s' %
                self.entity_version)
        if not isinstance(self.language_accent_code, str):
            raise utils.ValidationError(
                'language_accent_code must be a string, received %s' %
                self.language_accent_code)
        if not bool(re.match(
                feconf.LANGUAGE_ACCENT_CODE_REGEX, self.language_accent_code)):
            raise utils.ValidationError(
                'language_accent_code must be formatted as '
                '{{language}}-{{accent}}, received %s' %
                self.language_accent_code)
        for content_id, voiceover_type_to_voiceover in self.voiceovers.items():
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'content_id must be a string, received %s' % content_id)
            for voiceover_type, voiceover in (
                    voiceover_type_to_voiceover.items()):
                if not isinstance(voiceover_type, feconf.VoiceoverType):
                    raise utils.ValidationError(
                        'voiceover type must be VoiceoverType, received %s' %
                        voiceover_type)
                voiceover.validate()

    def add_voiceover(
        self,
        content_id: str,
        voiceover_type: feconf.VoiceoverType,
        voiceover: state_domain.Voiceover
    ) -> None:
        """Adds voiceover to the entity voiceover instance.

        Args:
            content_id: str. The ID of the content for which the voiceover is
                being added.
            voiceover_type: VoiceoverType. The voiceover type of the given
                voiceover.
            voiceover: Voiceover. The voiceover instance to be added to the
                entity voiceovers object.
        """
        self.voiceovers[content_id][voiceover_type] = voiceover

    def remove_voiceover(
        self,
        content_id: str,
        voiceover_type: feconf.VoiceoverType
    ) -> None:
        """Removes voiceover from the entity voiceover instance.

        Args:
            content_id: str. The ID of the content for which the voiceover is
                being removed.
            voiceover_type: VoiceoverType. The voiceover type of the given
                voiceover.
        """
        del self.voiceovers[content_id][voiceover_type]

    @classmethod
    def create_empty(
        cls,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_accent_code: str
    ) -> EntityVoiceovers:
        """Creates a new, empty EntityVoiceovers object."""
        return cls(
            entity_id=entity_id,
            entity_type=entity_type,
            entity_version=entity_version,
            language_accent_code=language_accent_code,
            voiceovers={})
