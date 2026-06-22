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

from core import feconf
from core import feature_flag_list
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import feature_flag_services
from core.domain import machine_translation_services
from core.domain import translation_services

from typing import Any, Dict


class MachineTranslationGenerateHandler(
    base.BaseHandler[Dict[str, str], Dict[str, Any]]
):
    """Handler for generating AI translation suggestions."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, Any]] = {
        'POST': {
            'source_text': {'schema': {'type': 'unicode'}},
            'source_language_code': {'schema': {'type': 'unicode'}},
            'target_language_code': {'schema': {'type': 'unicode'}},
        }
    }

    @acl_decorators.open_access
    def post(self) -> None:
        """Handles POST requests to generate a machine translation."""

        if not feature_flag_services.is_feature_flag_enabled(
            feature_flag_list.FeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS.value,
            self.user_id,
        ):
            raise self.PageNotFoundException()

        if not translation_services.is_automatic_translation_enabled():
            raise self.InvalidInputException(
                'Automatic translation is currently disabled by the site admin.'
            )

        # TODO(#24714): In Milestone 2, implement strict role-based access control
        # to verify the user holds the new "translation submitter" role before
        # allowing them to trigger paid Azure API calls.

        source_text = self.payload.get('source_text')
        source_language_code = self.payload.get('source_language_code')
        target_language_code = self.payload.get('target_language_code')

        try:
            translation_result = (
                machine_translation_services.generate_and_cache_translation(
                    source_language_code, target_language_code, source_text
                )
            )
        except Exception as e:
            raise self.InternalServerErrorException(str(e))

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
