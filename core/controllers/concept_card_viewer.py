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

from core.controllers import base
from core.domain import skill_services
import feconf


class ConceptCardDataHandler(base.BaseHandler):
    """A card that shows the explanation of a skill's concept."""

    def get(self, skill_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        skill = skill_services.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.PageNotFoundException

        skill_dict = skill.to_dict()
        self.values.update({
            'concept_card': skill_dict['skill_contents']
        })

        self.render_json(self.values)
