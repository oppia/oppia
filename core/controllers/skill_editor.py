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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
import feconf
import utils


def _require_valid_version(version_from_payload, skill_version):
    """Check that the payload version matches the given skill
    version.

    Args:
        version_from_payload: int. The version that the frontend instance of the
            skill represents.
        skill_version: int. The latest version of the skill currently persisted
            in the backend.

    Raises:
        Exception: Invalid input.
    """
    if version_from_payload is None:
        raise base.BaseHandler.InvalidInputException(
            'Invalid POST request: a version must be specified.')

    if version_from_payload != skill_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of skill from version %s, '
            'which is too old. Please reload the page and try again.'
            % (skill_version, version_from_payload))


class SkillEditorPage(base.BaseHandler):
    """The editor page for a single skill."""

    @acl_decorators.can_edit_skill
    def get(self, skill_id):
        """Handles GET requests."""
        skill_domain.Skill.require_valid_skill_id(skill_id)

        skill = skill_services.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        self.render_template('skill-editor-page.mainpage.html')


def check_can_edit_skill_description(user):
    """Checks whether the user can edit skill descriptions.

    Args:
        user: UserActionsInfo. Object having user id, role and actions for
            given user.

    Returns:
        bool. Whether the given user can edit skill descriptions.
    """

    if role_services.ACTION_EDIT_SKILL_DESCRIPTION not in user.actions:
        return False
    else:
        return True


class SkillRightsHandler(base.BaseHandler):
    """A handler for returning skill rights."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_skill
    def get(self, skill_id):
        """Returns whether the user can edit the description of a skill."""
        skill_domain.Skill.require_valid_skill_id(skill_id)

        user_actions_info = user_services.UserActionsInfo(self.user_id)
        can_edit_skill_description = check_can_edit_skill_description(
            user_actions_info)

        self.values.update({
            'can_edit_skill_description': can_edit_skill_description,
            'skill_id': skill_id
        })

        self.render_json(self.values)


class EditableSkillDataHandler(base.BaseHandler):
    """A data handler for skills which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_skill
    def get(self, skill_id):
        """Populates the data on the individual skill page."""
        skill_domain.Skill.require_valid_skill_id(skill_id)
        skill = skill_services.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        topics = topic_fetchers.get_all_topics()
        grouped_skill_summary_dicts = {}

        for topic in topics:
            skill_summaries = skill_services.get_multi_skill_summaries(
                topic.get_all_skill_ids())
            skill_summary_dicts = [
                summary.to_dict() for summary in skill_summaries]
            grouped_skill_summary_dicts[topic.name] = skill_summary_dicts

        self.values.update({
            'skill': skill.to_dict(),
            'grouped_skill_summaries': grouped_skill_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_skill
    def put(self, skill_id):
        """Updates properties of the given skill."""
        skill_domain.Skill.require_valid_skill_id(skill_id)
        skill = skill_services.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        version = self.payload.get('version')
        _require_valid_version(version, skill.version)

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

    @acl_decorators.can_delete_skill
    def delete(self, skill_id):
        """Handles Delete requests."""
        skill_domain.Skill.require_valid_skill_id(skill_id)
        if skill_services.skill_has_associated_questions(skill_id):
            raise Exception(
                'Please delete all questions associated with this skill '
                'first.')

        skill_services.delete_skill(self.user_id, skill_id)

        self.render_json(self.values)


class SkillDataHandler(base.BaseHandler):
    """A handler for accessing skills data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, comma_separated_skill_ids):
        """Populates the data on skill pages of the skill ids."""

        skill_ids = comma_separated_skill_ids.split(',')

        try:
            for skill_id in skill_ids:
                skill_domain.Skill.require_valid_skill_id(skill_id)
        except Exception as e:
            raise self.PageNotFoundException('Invalid skill id.')
        try:
            skills = skill_services.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        skill_dicts = [skill.to_dict() for skill in skills]
        self.values.update({
            'skills': skill_dicts
        })

        self.render_json(self.values)


class FetchSkillsHandler(base.BaseHandler):
    """A handler for accessing all skills data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self):
        """Returns all skill IDs linked to some topic."""

        skill_ids = topic_services.get_all_skill_ids_assigned_to_some_topic()

        try:
            skills = skill_services.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        skill_dicts = [skill.to_dict() for skill in skills]
        self.values.update({
            'skills': skill_dicts
        })

        self.render_json(self.values)
