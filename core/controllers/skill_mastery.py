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

"""Controllers for the skill mastery."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_domain
from core.domain import skill_services
import feconf
import utils


class SkillMasteryDataHandler(base.BaseHandler):
    """A handler that handles fetching and updating the degrees of user
    skill mastery.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_learner_dashboard
    def get(self):
        """Handles GET requests."""
        comma_separated_skill_ids = (
            self.request.get('comma_separated_skill_ids'))
        if not comma_separated_skill_ids:
            raise self.InvalidInputException(
                'Expected request to contain parameter '
                'comma_separated_skill_ids.')

        skill_ids = comma_separated_skill_ids.split(',')

        try:
            for skill_id in skill_ids:
                skill_domain.Skill.require_valid_skill_id(skill_id)
        except Exception:
            raise self.InvalidInputException('Invalid skill ID %s' % skill_id)

        try:
            skill_services.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        degrees_of_mastery = skill_services.get_multi_user_skill_mastery(
            self.user_id, skill_ids)

        self.values.update({
            'degrees_of_mastery': degrees_of_mastery
        })
        self.render_json(self.values)


    @acl_decorators.can_access_learner_dashboard
    def put(self):
        """Handles PUT requests."""
        mastery_change_per_skill = (
            self.payload.get('mastery_change_per_skill'))
        if (not mastery_change_per_skill or
                not isinstance(mastery_change_per_skill, dict)):
            raise self.InvalidInputException(
                'Expected payload to contain mastery_change_per_skill '
                'as a dict.')

        skill_ids = list(mastery_change_per_skill.keys())

        current_degrees_of_mastery = (
            skill_services.get_multi_user_skill_mastery(self.user_id, skill_ids)
        )
        new_degrees_of_mastery = {}

        for skill_id in skill_ids:
            try:
                skill_domain.Skill.require_valid_skill_id(skill_id)
            except utils.ValidationError:
                raise self.InvalidInputException(
                    'Invalid skill ID %s' % skill_id)

            # float(bool) will not raise an error.
            if isinstance(mastery_change_per_skill[skill_id], bool):
                raise self.InvalidInputException(
                    'Expected degree of mastery of skill %s to be a number, '
                    'received %s.'
                    % (skill_id, mastery_change_per_skill[skill_id]))

            try:
                mastery_change_per_skill[skill_id] = (
                    float(mastery_change_per_skill[skill_id]))
            except (TypeError, ValueError):
                raise self.InvalidInputException(
                    'Expected degree of mastery of skill %s to be a number, '
                    'received %s.'
                    % (skill_id, mastery_change_per_skill[skill_id]))

            if current_degrees_of_mastery[skill_id] is None:
                current_degrees_of_mastery[skill_id] = 0.0
            new_degrees_of_mastery[skill_id] = (
                current_degrees_of_mastery[skill_id] +
                mastery_change_per_skill[skill_id])

            if new_degrees_of_mastery[skill_id] < 0.0:
                new_degrees_of_mastery[skill_id] = 0.0
            elif new_degrees_of_mastery[skill_id] > 1.0:
                new_degrees_of_mastery[skill_id] = 1.0

        try:
            skill_services.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        skill_services.create_multi_user_skill_mastery(
            self.user_id, new_degrees_of_mastery)

        self.render_json({})
