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

import datetime

from core import feature_flag_list, feconf
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import (
    beam_job_services,
    exp_fetchers,
    feature_flag_services,
    opportunity_services,
    taskqueue_services,
    translation_fetchers,
    voiceover_cloud_task_services,
    voiceover_regeneration_services,
    voiceover_services,
)
from core.jobs.batch_jobs import synthesize_voiceover_by_language_accent_jobs

from typing import Dict, List, Optional, TypedDict


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
            voiceover_services.get_language_accent_master_list()
        )

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers()
        )

        autogeneratable_language_accent_codes = (
            voiceover_services.get_autogeneratable_language_accent_codes()
        )

        self.values.update(
            {
                'language_accent_master_list': language_accent_master_list,
                'language_codes_mapping': language_codes_mapping,
                'autogeneratable_language_accent_codes': autogeneratable_language_accent_codes,
            }
        )
        self.render_json(self.values)


class PutLanguageCodesHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of VoiceoverLanguageCodesMappingHandler's
    normalized_request dictionary.
    """

    language_codes_mapping: Dict[str, Dict[str, bool]]


class VoiceoverLanguageCodesMappingHandler(
    base.BaseHandler[
        PutLanguageCodesHandlerNormalizedPayloadDict, Dict[str, str]
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
                    'keys': {'schema': {'type': 'basestring'}},
                    'values': {
                        'schema': {
                            'type': 'variable_keys_dict',
                            'keys': {'schema': {'type': 'basestring'}},
                            'values': {'schema': {'type': 'bool'}},
                        }
                    },
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
        language_codes_mapping = self.normalized_payload[
            'language_codes_mapping'
        ]

        new_accent_code = voiceover_services.get_new_auto_voiceover_accent(
            language_codes_mapping
        )
        voiceover_services.save_language_accent_support(language_codes_mapping)

        if (
            new_accent_code
            and voiceover_services.is_accent_code_valid_for_autogeneration(
                new_accent_code
            )
            and feature_flag_services.is_feature_flag_enabled(
                feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS.value,
                None,
            )
        ):
            beam_job_services.run_beam_job(
                job_class=(
                    synthesize_voiceover_by_language_accent_jobs.VoiceoverSynthesisByAccentJob
                ),
                parameterized_args={'language_accent_code': new_accent_code},
            )

        self.render_json(self.values)


class EntityVoiceoversBulkHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler class to get entity voiceovers data for a given language code
    of an exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'entity_type': {'schema': {'type': 'basestring'}},
        'entity_id': {'schema': {'type': 'basestring'}},
        'entity_version': {'schema': {'type': 'int'}},
        'language_code': {'schema': {'type': 'basestring'}},
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
                entity_id, entity_type, entity_version, language_code
            )
        )
        entity_voiceovers_dicts = []

        for entity_voiceovers in entity_voiceovers_objects:
            entity_voiceovers_dicts.append(entity_voiceovers.to_dict())

        self.values.update({'entity_voiceovers_list': entity_voiceovers_dicts})
        self.render_json(self.values)


class AutomaticVoiceoverRegenerationRecordHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler class to retrieve automatic voiceover regeneration records
    within a specified date range."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'start_date': {'schema': {'type': 'basestring'}},
            'end_date': {'schema': {'type': 'basestring'}},
        }
    }

    @acl_decorators.can_access_voiceover_admin_page
    def get(self) -> None:
        """Retrieves automatic voiceover regeneration records within the
        specified start and end dates.
        """
        assert self.normalized_request is not None
        start_date: str = self.normalized_request.get('start_date', '')
        end_date: str = self.normalized_request.get('end_date', '')

        # Convert start_date and end_date to datetime objects.
        start_date_obj: datetime.datetime = datetime.datetime.fromisoformat(
            start_date.replace('Z', '+00:00')
        )
        end_date_obj: datetime.datetime = datetime.datetime.fromisoformat(
            end_date.replace('Z', '+00:00')
        )

        # Fetch only those records that are related to voiceover regeneration
        # and are within the specified date range.
        cloud_task_run_objects = sorted(
            taskqueue_services.get_cloud_task_run_by_given_params(
                taskqueue_services.QUEUE_NAME_VOICEOVER_REGENERATION,
                start_date_obj,
                end_date_obj,
            ),
            key=lambda task_run: task_run.last_updated,
            reverse=True,
        )

        # During testing, we observed that the UI remains usable with around
        # 5,000 records, but performance degrades significantly at 15,000
        # records. Setting a limit of 100 ensures a safe and consistent user
        # experience and prevents users from being overwhelmed by excessive
        # records.
        maximum_allowed_records = 100

        self.values.update(
            {
                'automatic_voiceover_regeneration_records': [
                    cloud_task_run.to_dict_with_timezone_info()
                    for cloud_task_run in cloud_task_run_objects[
                        :maximum_allowed_records
                    ]
                ]
            }
        )
        self.render_json(self.values)


class RegenerateAutomaticVoiceoverHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Regenerates the automatic voiceover for the given exploration data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'exploration_version': {'schema': {'type': 'int'}},
            'state_name': {'schema': {'type': 'basestring'}},
            'content_id': {'schema': {'type': 'basestring'}},
            'language_accent_code': {'schema': {'type': 'basestring'}},
        }
    }

    @acl_decorators.can_voiceover_exploration
    def put(self, exploration_id: str) -> None:
        """Regenerates the voiceover for the given exploration data."""
        assert self.normalized_payload is not None
        state_name: str = self.normalized_payload['state_name']
        content_id: str = self.normalized_payload['content_id']
        language_accent_code: str = self.normalized_payload[
            'language_accent_code'
        ]
        exploration_version: int = int(
            self.normalized_payload['exploration_version']
        )

        generated_voiceover, sentence_tokens_with_durations = (
            voiceover_regeneration_services.regenerate_voiceover_for_exploration_content(
                exploration_id,
                exploration_version,
                state_name,
                content_id,
                language_accent_code,
            )
        )

        self.values.update(
            {
                'filename': generated_voiceover.filename,
                'duration_secs': generated_voiceover.duration_secs,
                'file_size_bytes': generated_voiceover.file_size_bytes,
                'needs_update': generated_voiceover.needs_update,
                'sentence_tokens_with_durations': sentence_tokens_with_durations,
            }
        )

        self.render_json(self.values)


class RegenerateVoiceoverOnExpUpdateHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Regenerates the automatic voiceover for the given exploration data
    when an exploration is updated.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {'schema': {'type': 'basestring'}},
        'exploration_version': {'schema': {'type': 'int'}},
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

    @acl_decorators.can_voiceover_exploration
    def post(
        self,
        exploration_id: str,
        exploration_version: int,
    ) -> None:
        """Regenerates the voiceover for the given exploration data when an
        exploration is updated.
        """
        # Asynchronously regenerates voiceovers using a deferred job when
        # curated exploration content changes.
        if opportunity_services.is_exploration_available_for_contribution(
            exploration_id
        ) and feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS.value,
            None,
        ):
            taskqueue_services.defer(
                feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                    'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_UPDATE'
                ],
                taskqueue_services.QUEUE_NAME_VOICEOVER_REGENERATION,
                exploration_id,
                exploration_version,
            )
        self.render_json(self.values)


class VoiceoverRegenerationRequestToCloudTaskHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Retrieves the status of all voiceover-regeneration requests queued in
    Cloud Tasks for the specified exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Retrieves the status of all voiceover-regeneration requests queued in
        Cloud Tasks for the specified exploration.

        Args:
            exploration_id: str. The ID of the exploration.
        """

        self.values.update(
            voiceover_cloud_task_services.get_existing_voiceover_regeneration_requests_in_task_queue(
                exploration_id
            )
        )
        self.render_json(self.values)


class ExplorationDataForVoiceoverRegenerationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Fetches exploration data required for regenerating automatic
    voiceovers for a given exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {'schema': {'type': 'basestring'}}
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_voiceover_admin_page
    def get(self, exploration_id: str) -> None:
        """Fetches exploration data required for regenerating automatic
        voiceovers for a given exploration.
        """
        exploration = exp_fetchers.get_exploration_by_id(
            exploration_id, strict=False
        )

        language_accent_codes_mapping = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers()
        )

        is_exploration_curated = (
            opportunity_services.is_exploration_available_for_contribution(
                exploration_id
            )
        )

        response_data: Dict[str, Optional[str | Dict[str, str | List[str]]]] = (
            {}
        )

        if exploration is None:
            response_data['exploration_data'] = None
            response_data['response_message'] = (
                'Exploration with the given id does not exist.'
            )
        elif not is_exploration_curated:
            response_data['exploration_data'] = None
            response_data['response_message'] = (
                'The Exploration is not linked to any published story, '
                'hence not available for voiceover regeneration.'
            )
        else:
            # The final else branch handles the case where the exploration
            # exists and it is linked to a published story.

            # A list of language codes for the exploration that contain
            # available content, including English and any translated languages.
            exploration_language_codes = []
            exploration_language_codes.append(constants.DEFAULT_LANGUAGE_CODE)

            autogeneratable_language_accent_codes = []

            entity_translations = (
                translation_fetchers.get_all_entity_translations_for_entity(
                    feconf.TranslatableEntityType.EXPLORATION,
                    exploration_id,
                    exploration.version,
                )
            )
            for entity_translation in entity_translations:
                exploration_language_codes.append(
                    entity_translation.language_code
                )

            for language_code in exploration_language_codes:
                language_accent_codes_to_autogeneration_support = (
                    language_accent_codes_mapping.get(language_code, {})
                )

                for (
                    accent_code,
                    is_autogeneration_enabled,
                ) in language_accent_codes_to_autogeneration_support.items():
                    if is_autogeneration_enabled is False:
                        continue

                    autogeneratable_language_accent_codes.append(accent_code)

            response_data['exploration_data'] = {
                'exploration_title': exploration.title,
                'autogeneratable_language_accent_codes': (
                    autogeneratable_language_accent_codes
                ),
            }
            response_data['response_message'] = None

        self.values.update(response_data)
        self.render_json(self.values)


class RegenerateVoiceoversForExplorationHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Regenerates the automatic voiceover for the specified exploration in the
    selected language and accent."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {'schema': {'type': 'basestring'}},
        'language_accent_code': {'schema': {'type': 'basestring'}},
    }
    HANDLER_ARGS_SCHEMAS = {'POST': {}}

    @acl_decorators.can_access_voiceover_admin_page
    def post(self, exploration_id: str, language_accent_code: str) -> None:
        """Regenerates the automatic voiceover for the specified exploration in
        the selected language and accent.
        """

        if opportunity_services.is_exploration_available_for_contribution(
            exploration_id
        ) and feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS.value,
            None,
        ):
            taskqueue_services.defer(
                feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                    'FUNCTION_ID_REGENERATE_VOICEOVERS_BY_LANGUAGE_ACCENT'
                ],
                taskqueue_services.QUEUE_NAME_VOICEOVER_REGENERATION,
                exploration_id,
                language_accent_code,
            )
        self.render_json(self.values)
