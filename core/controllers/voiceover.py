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

from typing import Dict


class VoiceoverAdminPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Renders the voiceover admin page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_voiceover_admin_page
    def get(self) -> None:
        """Renders the voiceover admin page."""
        self.render_template('voiceover-admin-page.mainpage.html')


class VoiceoverAdminDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Fetches relevant data for the voiceover admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_voiceover_admin_page
    def get(self) -> None:
        """Retrieves relevant data for the voiceover admin page."""

        language_accent_code_to_description: Dict[str, str] = {}
        for language_accent_code_mapping in (
                voiceover_services.get_language_accent_master_list().values()):
            language_accent_code_to_description.update(
                language_accent_code_mapping)

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers())
        self.values.update({
            'language_accent_code_to_description':
                language_accent_code_to_description,
            'language_codes_mapping': language_codes_mapping
        })
        self.render_json(self.values)
