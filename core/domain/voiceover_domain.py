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

from typing import Dict, List, Optional, Tuple, TypedDict, Union


class EntityVoiceoversDict(TypedDict):
    """Dictionary representing the EntityVoiceovers object."""

    entity_id: str
    entity_type: str
    entity_version: int
    language_accent_code: str
    voiceovers_mapping: Dict[str, Dict[
        feconf.VoiceoverType.value, Optional[state_domain.VoiceoverDict]]]
    automated_voiceovers_audio_offsets_msecs: Dict[
        str, List[Dict[str, Union[str, float]]]]


ContentIdToVoiceoverMappingType = Dict[
    str, Dict[str, Tuple[str, state_domain.VoiceoverDict]]
]


class EntityVoiceovers:
    """A domain object for the entity voiceovers instance for a given
    versioned entity in a given language-accent pair.

    NOTE: This domain object corresponds to EntityVoiceoversModel in the
    storage layer.
    """

    def __init__(
        self,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_accent_code: str,
        voiceovers_mapping: Dict[str, Dict[
            feconf.VoiceoverType, Optional[state_domain.Voiceover]]],
        automated_voiceovers_audio_offsets_msecs: Dict[
        str, List[Dict[str, Union[str, float]]]]
    ) -> None:
        """Constructs an EntityVoiceovers domain object.

        Args:
            entity_id: str. The ID of the corresponding entity.
            entity_type: str. The type of the corresponding entity.
            entity_version: int. The version of the corresponding entity.
            language_accent_code: str. The language-accent code in which the
                voiceovers are stored.
            voiceovers_mapping: dict(str, dict(VoiceoverType, VoiceoverDict)). A
                dict containing content IDs as keys and nested dicts as values.
                Each nested dict contains VoiceoverType as keys and
                VoiceoverDict as values.
            automated_voiceovers_audio_offsets_msecs: dict(str, list(dict)). A
                dictionary where each key is a content ID, and the value is a
                list of dictionaries. Each dictionary includes 'token' (a word
                or punctuation from the content) and 'audio_offset_msecs' (its
                time offset in milliseconds). This field only applies to
                automated voiceovers synthesized from Azure and does not include
                offsets for manual voiceovers.
        """
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.entity_version = entity_version
        self.language_accent_code = language_accent_code
        self.voiceovers_mapping = voiceovers_mapping
        self.automated_voiceovers_audio_offsets_msecs = (
            automated_voiceovers_audio_offsets_msecs)

    def to_dict(self) -> EntityVoiceoversDict:
        """Returns the dict representation of the EntityVoiceovers object.

        Returns:
            EntityVoiceoversDict. The dict representation of the
            EntityVoiceovers object.
        """
        content_id_to_voiceovers_dict: Dict[str, Dict[
            feconf.VoiceoverType.value, Optional[state_domain.VoiceoverDict]]
        ] = {}

        for content_id, voiceover_type_to_voiceover in (
                self.voiceovers_mapping.items()):
            content_id_to_voiceovers_dict[content_id] = {}
            for voiceover_type in feconf.VoiceoverType:
                voiceover = voiceover_type_to_voiceover[voiceover_type]
                voiceover_dict = (
                    None if voiceover is None else voiceover.to_dict())

                content_id_to_voiceovers_dict[content_id][
                    voiceover_type.value] = voiceover_dict
        return {
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'entity_version': self.entity_version,
            'language_accent_code': self.language_accent_code,
            'voiceovers_mapping': content_id_to_voiceovers_dict,
            'automated_voiceovers_audio_offsets_msecs': (
                self.automated_voiceovers_audio_offsets_msecs)
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
        content_id_to_voiceovers: Dict[str, Dict[
            feconf.VoiceoverType, Optional[state_domain.Voiceover]]] = {}
        for content_id, voiceover_type_to_voiceover_dict in (
                entity_voiceovers_dict['voiceovers_mapping'].items()):
            content_id_to_voiceovers[content_id] = {}
            for voiceover_type in feconf.VoiceoverType:
                voiceover_dict = voiceover_type_to_voiceover_dict[
                    voiceover_type.value]
                voiceover = (
                    None if voiceover_dict is None
                    else state_domain.Voiceover.from_dict(voiceover_dict))

                content_id_to_voiceovers[content_id][
                    voiceover_type] = voiceover

        return cls(
            entity_voiceovers_dict['entity_id'],
            entity_voiceovers_dict['entity_type'],
            entity_voiceovers_dict['entity_version'],
            entity_voiceovers_dict['language_accent_code'],
            content_id_to_voiceovers,
            entity_voiceovers_dict['automated_voiceovers_audio_offsets_msecs']
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
        for content_id, voiceover_type_to_voiceover in (
                self.voiceovers_mapping.items()):
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'content_id must be a string, received %s' % content_id)
            for voiceover_type, voiceover in (
                    voiceover_type_to_voiceover.items()):
                if not isinstance(voiceover_type, feconf.VoiceoverType):
                    raise utils.ValidationError(
                        'voiceover type must be VoiceoverType, received %s' %
                        voiceover_type)
                if voiceover is not None:
                    voiceover.validate()

        for content_id, audio_offset_list in (
                self.automated_voiceovers_audio_offsets_msecs.items()):
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'content_id must be a string, received %s' % content_id)

            for token_audio_offset_dict in audio_offset_list:
                if 'token' not in token_audio_offset_dict:
                    raise utils.ValidationError(
                        'Missing key `token` in word audio offset data.')

                if 'audio_offset_msecs' not in token_audio_offset_dict:
                    raise utils.ValidationError(
                        'Missing key `audio_offset_msecs` in word audio offset '
                        'data.'
                )

                token = token_audio_offset_dict['token']
                audio_offset_msecs = token_audio_offset_dict[
                    'audio_offset_msecs']

                if not isinstance(token, str):
                    raise utils.ValidationError(
                        'Token must be a string, received %s' % token)

                if not isinstance(audio_offset_msecs, float):
                    raise utils.ValidationError(
                        'audio_offset_msecs must be a floating value, '
                        'received %s' % audio_offset_msecs)

    def add_new_content_id_without_voiceovers(
        self,
        content_id: str
    ) -> None:
        """Adds a new content ID for which manual and automatic voiceovers
        can be added. Initially, both voiceover fields will be empty (None),
        and they will later be populated with their respective values using the
        add_voiceover method.

        Args:
            content_id: str. The new content ID for which voiceovers should be
                added.
        """
        self.voiceovers_mapping[content_id] = {
            feconf.VoiceoverType.MANUAL: None,
            feconf.VoiceoverType.AUTO: None
        }

    def add_voiceover(
        self,
        content_id: str,
        voiceover_type: feconf.VoiceoverType,
        voiceovers_mapping: state_domain.Voiceover
    ) -> None:
        """Adds voiceover to the entity voiceover instance.

        Args:
            content_id: str. The ID of the content for which the voiceover is
                being added.
            voiceover_type: VoiceoverType. The voiceover type of the given
                voiceover.
            voiceovers_mapping: Voiceover. The voiceover instance to be added to
                the entity voiceovers object.
        """

        if content_id not in self.voiceovers_mapping:
            self.add_new_content_id_without_voiceovers(content_id)

        self.voiceovers_mapping[content_id][voiceover_type] = voiceovers_mapping

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
        self.voiceovers_mapping[content_id][voiceover_type] = None

        if self.is_both_voiceovers_empty(content_id):
            del self.voiceovers_mapping[content_id]

    def is_both_voiceovers_empty(self, content_id: str) -> bool:
        """Verifies if both the manual and automatic voiceovers for the
        specified content ID is empty or not.

        Args:
            content_id: str. The ID of the content for which the voiceover is
                being checked.

        Returns:
            bool. A boolean value specifying whether both the manual and
            automatic voiceovers are empty or not.
        """
        return (
            self.voiceovers_mapping[content_id][
                feconf.VoiceoverType.MANUAL] is None and
            self.voiceovers_mapping[content_id][
                feconf.VoiceoverType.AUTO] is None
        )

    def add_automated_voiceovers_audio_offsets(
        self,
        content_id: str,
        sentence_tokens_with_durations: List[Dict[str, Union[str, float]]]
    ) -> None:
        """Adds the audio offsets for automated voiceovers to the entity
        voiceover instance.

        Args:
            content_id: str. The ID of the content for which the audio offsets
                are being added.
            sentence_tokens_with_durations: list(dict). A list of dictionaries
                where each dictionary includes 'token' (a word or punctuation
                from the content) and 'audio_offset_msecs' (its time offset in
                milliseconds). This field only applies to automated voiceovers
                synthesized from Cloud and does not include offsets for manual
                voiceovers.
        """
        self.automated_voiceovers_audio_offsets_msecs[content_id] = (
            sentence_tokens_with_durations)

    @classmethod
    def create_empty(
        cls,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_accent_code: str
    ) -> EntityVoiceovers:
        """Creates a new, empty EntityVoiceovers instance.

        Args:
            entity_id: str. The ID of the corresponding entity.
            entity_type: str. The type of the corresponding entity.
            entity_version: int. The version of the corresponding entity.
            language_accent_code: str. The language-accent code in which
                the voiceovers are stored.

        Returns:
            EntityVoiceovers. The new, empty EntityVoiceovers instance.
        """
        return cls(
            entity_id=entity_id,
            entity_type=entity_type,
            entity_version=entity_version,
            language_accent_code=language_accent_code,
            voiceovers_mapping={},
            automated_voiceovers_audio_offsets_msecs={})


class VoiceoverAutogenerationPolicy:
    """A domain object for the voiceover autogeneration policy."""

    def __init__(
        self,
        language_codes_mapping: Dict[str, Dict[str, bool]],
        autogenerated_voiceovers_are_enabled: bool = False
    ) -> None:
        """Constructs an VoiceoverAutogenerationPolicy domain object.

        Args:
            language_codes_mapping: dict(str, dict(str, bool)). A
                dict mapping language_codes to nested dicts. Each nested dict
                contains language_accent_codes as keys and booleans indicating
                if we can generate automatic voiceovers for the corresponding 
                language_accent_code as values.
            autogenerated_voiceovers_are_enabled: bool. Indicates whether 
                cloud-based voiceover generation is enabled.
        """
        self.language_codes_mapping = language_codes_mapping
        self.autogenerated_voiceovers_are_enabled = (
            autogenerated_voiceovers_are_enabled)

    def validate(self) -> None:
        """Validates the EntityVoiceovers object."""
        if not isinstance(self.language_codes_mapping, dict):
            raise utils.ValidationError(
                'language_codes_mapping must be a dict, received %s'
                % self.language_codes_mapping)
        for language_code in self.language_codes_mapping:
            if not isinstance(language_code, str):
                raise utils.ValidationError(
                    'language_code must be a string, received %s'
                    % language_code)
            if not utils.is_valid_language_code(language_code):
                raise utils.ValidationError(
                    'Invalid language_code: %s' % language_code)
            language_code_mapping = self.language_codes_mapping[language_code]
            if not isinstance(language_code_mapping, dict):
                raise utils.ValidationError(
                    'language_code_mapping must be a dict, received %s'
                    % language_code_mapping)
            self.validate_language_code_mapping(language_code_mapping)
        if not isinstance(self.autogenerated_voiceovers_are_enabled, bool):
            raise utils.ValidationError(
                'autogenerated_voiceovers_are_enabled must be a boolean,'
                ' received %s' % self.autogenerated_voiceovers_are_enabled)

    def validate_language_code_mapping(
        self,
        language_code_mapping: Dict[str, bool]
    ) -> None:
        """Validates the language_code_mapping dictionary."""
        for language_accent_code, is_auto_voiceover_enabled in (
                language_code_mapping.items()):
            if not isinstance(language_accent_code, str):
                raise utils.ValidationError(
                    'language_accent_code must be a string,'
                    ' received %s' % language_accent_code)
            if not bool(
                re.match(
                    feconf.LANGUAGE_ACCENT_CODE_REGEX, language_accent_code)):
                raise utils.ValidationError(
                    'language_accent_code must be formatted as '
                    '{{language}}-{{accent}}, received %s' %
                    language_accent_code)
            if not isinstance(is_auto_voiceover_enabled, bool):
                raise utils.ValidationError(
                    'is_auto_voiceover_enabled must be a boolean,'
                    ' received %s' % is_auto_voiceover_enabled)
