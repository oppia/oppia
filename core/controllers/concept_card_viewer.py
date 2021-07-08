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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_fetchers
import feconf


class ConceptCardDataHandler(base.BaseHandler):
    """A card that shows the explanation of a skill's concept."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'comma_separated_skill_ids': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_view_skills
    def get(self, comma_separated_skill_ids):
        """Handles GET requests.

        Args:
            comma_separated_skill_ids: str. Comma separated IDs of skills.
        """

        skill_ids = comma_separated_skill_ids.split(',')
        skills = skill_fetchers.get_multi_skills(skill_ids)

        concept_card_dicts = []
        for skill in skills:
            concept_card_dicts.append(skill.skill_contents.to_dict())

        self.values.update({
            'concept_card_dicts': concept_card_dicts
        })

        self.render_json(self.values)
