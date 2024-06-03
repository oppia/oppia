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

"""Controllers for the voiceover admin page."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import voiceover_services

from typing import Dict, TypedDict


class VoiceoverAdminDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Fetches relevant data for the voiceover admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves relevant data for the voiceover admin page."""

        language_accent_master_list: Dict[str, Dict[str, str]] = (
            voiceover_services.get_language_accent_master_list())

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers())
        self.values.update({
            'language_accent_master_list':
                language_accent_master_list,
            'language_codes_mapping': language_codes_mapping
        })
        self.render_json(self.values)


class PutLanguageCodesHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of VoiceoverLanguageCodesMappingHandler's
    normalized_request dictionary.
    """

    language_codes_mapping: Dict[str, Dict[str, bool]]


class VoiceoverLanguageCodesMappingHandler(
    base.BaseHandler[
        PutLanguageCodesHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Updates the language codes mapping field in the backend."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'language_codes_mapping': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {
                        'schema': {
                            'type': 'basestring'
                        }
                    },
                    'values': {
                        'schema': {
                            'type': 'variable_keys_dict',
                            'keys': {
                                'schema': {
                                    'type': 'basestring'
                                }
                            },
                            'values': {
                                'schema': {
                                    'type': 'bool'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @acl_decorators.can_access_voiceover_admin_page
    def put(self) -> None:
        """Updates the language codes mapping for the Oppia supported
        voiceovers.
        """
        assert self.normalized_payload is not None
        language_codes_mapping = (
            self.normalized_payload['language_codes_mapping'])

        voiceover_services.save_language_accent_support(
            language_codes_mapping)
        self.render_json(self.values)


class PutVoiceArtistMetadataHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of VoiceArtistMetadataHandler's normalized_payload
    dictionary.
    """

    voice_artist_id: str
    language_code: str
    language_accent_code: str


class VoiceArtistMetadataHandler(
    base.BaseHandler[
        PutVoiceArtistMetadataHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Handler class to manage voice artist data for the voiceover admin page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'voice_artist_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'language_code': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'language_accent_code': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_voiceover_admin_page
    def get(self) -> None:
        """Retrieves voice artist data for the voiceover admin page."""
        voice_artist_id_to_language_mapping = (
            voiceover_services.get_all_voice_artist_language_accent_mapping())
        voice_artist_id_to_voice_artist_name = (
            voiceover_services.get_voice_artist_ids_to_voice_artist_names())

        self.values.update({
            'voice_artist_id_to_language_mapping':
                voice_artist_id_to_language_mapping,
            'voice_artist_id_to_voice_artist_name':
                voice_artist_id_to_voice_artist_name
        })
        self.render_json(self.values)

    @acl_decorators.can_access_voiceover_admin_page
    def put(self) -> None:
        """Updates voice artist data from the voiceover admin page."""
        assert self.normalized_payload is not None
        voice_artist_id = self.normalized_payload['voice_artist_id']
        language_code = self.normalized_payload['language_code']
        language_accent_code = self.normalized_payload['language_accent_code']

        voiceover_services.update_voice_artist_language_mapping(
            voice_artist_id, language_code, language_accent_code)
        self.render_json(self.values)


class GetSampleVoiceoversForGivenVoiceArtistHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler class to get sample contributed voiceovers of a voice artist in
    a given language.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'voice_artist_id': {
            'schema': {
                'type': 'basestring'
            }
        },
        'language_code': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_voiceover_admin_page
    def get(self, voice_artist_id: str, language_code: str) -> None:
        exploration_id_to_filenames = (
            voiceover_services.get_voiceover_filenames(
                voice_artist_id=voice_artist_id,
                language_code=language_code
            )
        )

        self.values.update({
            'exploration_id_to_filenames': exploration_id_to_filenames,
        })
        self.render_json(self.values)


class EntityVoiceoversBulkHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler class to get entity voiceovers data for a given language code
    of an exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'entity_type': {
            'schema': {
                'type': 'basestring'
            }
        },
        'entity_id': {
            'schema': {
                'type': 'basestring'
            }
        },
        'entity_version': {
            'schema': {
                'type': 'int'
            }
        },
        'language_code': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(
        self,
        entity_type: str,
        entity_id: str,
        entity_version: int,
        language_code: str,
    ) -> None:
        entity_voiceovers_objects = (
            voiceover_services.fetch_entity_voiceovers_by_language_code(
                entity_id, entity_type, entity_version, language_code)
        )
        entity_voiceovers_dicts = []

        for entity_voiceovers in entity_voiceovers_objects:
            entity_voiceovers_dicts.append(entity_voiceovers.to_dict())

        self.values.update({
            'entity_voiceovers_list': entity_voiceovers_dicts
        })
        self.render_json(self.values)
