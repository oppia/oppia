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

"""Controllers for the skill editor."""
from core.controllers import base
from core.domain import acl_decorators
from core.domain import skill_domain
from core.domain import skill_services
import feconf
import utils


def _require_valid_skill_id(skill_id):
    """Checks whether the skill id received from the frontend is a
    valid one.
    """
    if not isinstance(skill_id, basestring):
        raise base.BaseHandler.InvalidInputException(
            Exception('Skill id should be a string.'))

    if len(skill_id) != 12:
        raise base.BaseHandler.InvalidInputException(
            Exception('The skill id given is invalid.'))


class SkillEditorPage(base.BaseHandler):
    """The editor page for a single skill."""

    @acl_decorators.can_access_admin_page
    def get(self, skill_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_skill_id(skill_id)

        skill = skill_services.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        self.values.update({
            'skill_id': skill.id
        })

        self.render_template('pages/skill_editor/skill_editor.html')


class EditableSkillDataHandler(base.BaseHandler):
    """A data handler for skills which supports writing."""

    def _require_valid_version(self, version_from_payload, skill_version):
        """Check that the payload version matches the given skill
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != skill_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of skill from version %s, '
                'which is too old. Please reload the page and try again.'
                % (skill_version, version_from_payload))

    @acl_decorators.can_access_admin_page
    def get(self, skill_id):
        """Populates the data on the individual skill page."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_skill_id(skill_id)

        skill = skill_services.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        self.values.update({
            'skill': skill.to_dict()
        })

        self.render_json(self.values)

    @acl_decorators.can_access_admin_page
    def put(self, skill_id):
        """Updates properties of the given skill."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_skill_id(skill_id)
        skill = skill_services.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        version = self.payload.get('version')
        self._require_valid_version(version, skill.version)

        commit_message = self.payload.get('commit_message')
        change_dicts = self.payload.get('change_dicts')
        change_list = [
            skill_domain.SkillChange(change_dict)
            for change_dict in change_dicts
        ]
        try:
            skill_services.update_skill(
                self.user_id, skill_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        skill_dict = skill_services.get_skill_by_id(skill_id).to_dict()

        self.values.update({
            'skill': skill_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_access_admin_page
    def delete(self, skill_id):
        """Handles Delete requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        _require_valid_skill_id(skill_id)
        if not skill_id:
            raise self.PageNotFoundException
        skill_services.delete_skill(self.user_id, skill_id)
