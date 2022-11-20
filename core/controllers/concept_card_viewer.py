# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the Oppia skill's concept card viewer."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_fetchers

from typing import Dict, List


class ConceptCardDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A card that shows the explanation of a skill's concept."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'selected_skill_ids': {
            'schema': {
                'type': 'custom',
                'obj_type': 'JsonEncodedInString'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_view_skills
    def get(self, selected_skill_ids: List[str]) -> None:
        """Handles GET requests.

        Args:
            selected_skill_ids: list(str). List of skill ids.
        """

        skills = skill_fetchers.get_multi_skills(selected_skill_ids)

        concept_card_dicts = []
        for skill in skills:
            concept_card_dicts.append(skill.skill_contents.to_dict())

        self.values.update({
            'concept_card_dicts': concept_card_dicts
        })

        self.render_json(self.values)
