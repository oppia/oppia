# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the questions player."""

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_domain
from core.domain import skill_services


class SkillMasteryDataHandler(base.BaseHandler):
    """A handler that handles fetching and updating the degrees of user
    skill mastery.
    """

    @acl_decorators.can_access_user_skill_mastery
    def put(self):
        """Handles PUT requests."""
        degree_of_mastery_per_skill = (
            self.payload.get('degree_of_mastery_per_skill'))
        if (not degree_of_mastery_per_skill or
                not isinstance(degree_of_mastery_per_skill, dict)):
            raise self.InvalidInputException(
                'Expected payload to contain degree_of_mastery_per_skill '
                'as a dict.')

        skill_ids = degree_of_mastery_per_skill.keys()

        try:
            for skill_id in skill_ids:
                skill_domain.Skill.require_valid_skill_id(skill_id)
        except Exception:
            raise self.InvalidInputException

        try:
            skill_services.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        for skill_id in skill_ids:
            try:
                degree_of_mastery_per_skill[skill_id] = (
                    float(degree_of_mastery_per_skill[skill_id]))
            except TypeError:
                raise self.InvalidInputException(
                    'Expected degree of mastery of skill %s to be a number.'
                    % skill_id)
            if (degree_of_mastery_per_skill[skill_id] < 0.0 or
                    degree_of_mastery_per_skill[skill_id] > 1.0):
                raise self.InvalidInputException(
                    'Expected degree of mastery of skill %s to be a float '
                    'between 0.0 and 1.0.' % skill_id)

        degrees_of_mastery = degree_of_mastery_per_skill.values()

        skill_services.create_multi_user_skill_mastery(
            self.user_id, skill_ids, degrees_of_mastery)

        self.values.update({})
        self.render_json(self.values)
