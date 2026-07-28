# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Controllers for generating machine translations."""

from __future__ import annotations

from core import feature_flag_list, feconf, utils
from core.controllers import acl_decorators, base
from core.domain import (
    feature_flag_services,
    machine_translation_services,
    translation_services,
)

from typing import Any, Dict


class MachineTranslationGenerateHandler(
    # Here we use type Any because the JSON response
    # payload contains dynamic, heterogeneous data.
    base.BaseHandler[Dict[str, str], Dict[str, Any]]
):
    """Handler for generating AI translation suggestions."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    # Here we use type Any because the schema dictionary accepts
    # variable nested types for validation.
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, Any]] = {
        'POST': {
            'source_text': {'schema': {'type': 'unicode'}},
            'source_language_code': {'schema': {'type': 'unicode'}},
            'target_language_code': {'schema': {'type': 'unicode'}},
        }
    }

    @acl_decorators.can_suggest_changes
    def post(self) -> None:
        """Handles POST requests to generate a machine translation."""

        if not feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS.value,
            self.user_id,
        ):
            raise self.NotFoundException()

        if not translation_services.is_automatic_translation_enabled():
            raise self.InvalidInputException(
                'Automatic translation is currently disabled by the site admin.'
            )

        # TODO(#24714): In Milestone 2, implement strict role-based access control
        # to verify the user holds the new "translation submitter" role before
        # allowing them to trigger paid Azure API calls.

        assert self.normalized_payload is not None
        source_text = self.normalized_payload['source_text']
        source_language_code = self.normalized_payload['source_language_code']
        target_language_code = self.normalized_payload['target_language_code']

        try:
            translation_result = (
                machine_translation_services.generate_and_cache_translation(
                    source_language_code, target_language_code, source_text
                )
            )
        except Exception as e:
            raise self.InternalErrorException(str(e))

        if translation_result is None:
            raise self.InvalidInputException(
                'No active translation provider is configured for %s.'
                % target_language_code
            )

        translated_text, provider_id = translation_result

        self.render_json(
            {
                'translated_text': translated_text,
                'translation_provider': provider_id,
            }
        )


class TranslationProviderMappingHandler(
    base.BaseHandler[
        # Here we use type Any because the request payload's provider
        # mapping values vary dynamically per language.
        Dict[str, Any],
        # Here we use type Any because the response payload contains
        # dynamic, heterogeneous data for the mapping and provider list.
        Dict[str, Any],
    ]
):
    """Handler for fetching and updating the translation provider mapping."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}

    # Here we use type Any because the schema dictionary accepts variable
    # nested types for validation.
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, Any]] = {
        'GET': {},
        'PUT': {
            'provider_mapping': {
                'schema': {
                    'type': 'variable_keys_dict',
                    'keys': {'schema': {'type': 'unicode'}},
                    'values': {'schema': {'type': 'unicode'}},
                }
            },
            'automatic_translation_is_enabled': {
                'schema': {'type': 'bool'},
                'default_value': None,
            },
        },
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        """Handles GET requests to fetch the current language-to-provider mapping."""

        if not feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS.value,
            self.user_id,
        ):
            raise self.NotFoundException()

        # TODO(#24714): In Milestone 2 (PR 2.1), replace can_access_admin_page with strict
        # role-based access control to verify the user is a Translation Admin.

        mapping = (
            machine_translation_services.get_translation_provider_mapping()
        )

        is_enabled = (
            machine_translation_services.is_automatic_translation_enabled()
        )
        available_providers = (
            machine_translation_services.get_available_providers_for_ui()
        )

        self.render_json(
            {
                'provider_mapping': mapping,
                'automatic_translation_is_enabled': is_enabled,
                'available_providers': available_providers,
            }
        )

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        """Handles PUT requests to update the language-to-provider mapping."""

        if not feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS.value,
            self.user_id,
        ):
            raise self.NotFoundException()

        # TODO(#24714): In Milestone 2 (PR 2.1), replace can_access_admin_page with strict
        # role-based access control to verify the user is a Translation  Admin.

        assert self.normalized_payload is not None
        new_translation_provider_mapping = self.normalized_payload.get(
            'provider_mapping'
        )
        new_is_enabled = self.normalized_payload.get(
            'automatic_translation_is_enabled'
        )

        try:
            machine_translation_services.update_machine_translation_policy(
                language_to_provider_mapping=new_translation_provider_mapping,
                automatic_translation_is_enabled=new_is_enabled,
            )
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)
        except Exception as e:
            raise self.InternalErrorException(str(e))

        self.render_json({'status': 'success'})
