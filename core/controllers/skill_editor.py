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

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import dependency_registry
from core.domain import interaction_registry
from core.domain import obj_services
from core.domain import question_services
from core.domain import role_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import user_services
import feconf
import utils

import jinja2


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

    EDITOR_PAGE_DEPENDENCY_IDS = ['codemirror']

    @acl_decorators.can_edit_skill
    def get(self, skill_id):
        """Handles GET requests."""

        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        skill_domain.Skill.require_valid_skill_id(skill_id)

        skill = skill_services.get_skill_by_id(skill_id, strict=False)

        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        interaction_ids = feconf.ALLOWED_QUESTION_INTERACTION_IDS

        interaction_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                interaction_dependency_ids + self.EDITOR_PAGE_DEPENDENCY_IDS))

        interaction_templates = (
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))

        self.values.update({
            'skill_id': skill.id,
            'DEFAULT_OBJECT_VALUES': obj_services.get_default_object_values(),
            'additional_angular_modules': additional_angular_modules,
            'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
            'dependencies_html': jinja2.utils.Markup(dependencies_html),
            'ALLOWED_INTERACTION_CATEGORIES': (
                feconf.ALLOWED_QUESTION_INTERACTION_CATEGORIES)
        })

        self.render_template(
            'pages/skill_editor/skill_editor.html', redirect_url_on_logout='/')


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
        """Returns the SkillRights object of a skill."""
        skill_domain.Skill.require_valid_skill_id(skill_id)

        skill_rights = skill_services.get_skill_rights(skill_id, strict=False)
        user_actions_info = user_services.UserActionsInfo(self.user_id)
        can_edit_skill_description = check_can_edit_skill_description(
            user_actions_info)

        self.values.update({
            'skill_is_private': skill_rights.skill_is_private,
            'creator_id': skill_rights.creator_id,
            'can_edit_skill_description': can_edit_skill_description,
            'skill_id': skill_id
        })

        self.render_json(self.values)


class SkillEditorQuestionHandler(base.BaseHandler):
    """Manages the creation of a question and receiving of all question
    summaries for display in skill editor page.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_skill
    def get(self, skill_id):
        """Handles GET requests."""
        if not constants.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException
        skill_domain.Skill.require_valid_skill_id(skill_id)

        start_cursor = self.request.get('cursor')

        question_summaries, next_start_cursor = (
            question_services.get_question_summaries_linked_to_skills(
                constants.NUM_QUESTIONS_PER_PAGE, [skill_id], start_cursor)
        )
        question_summary_dicts = [
            summary.to_dict() for summary in question_summaries]

        self.values.update({
            'question_summary_dicts': question_summary_dicts,
            'next_start_cursor': next_start_cursor
        })
        self.render_json(self.values)


class EditableSkillDataHandler(base.BaseHandler):
    """A data handler for skills which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_skill
    def get(self, skill_id):
        """Populates the data on the individual skill page."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        skill_domain.Skill.require_valid_skill_id(skill_id)
        skill = skill_services.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.PageNotFoundException(
                Exception('The skill with the given id doesn\'t exist.'))

        self.values.update({
            'skill': skill.to_dict()
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_skill
    def put(self, skill_id):
        """Updates properties of the given skill."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

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
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        skill_domain.Skill.require_valid_skill_id(skill_id)
        if skill_services.skill_has_associated_questions(skill_id):
            raise Exception(
                'Please delete all questions associated with this skill '
                'first.')

        skill_services.delete_skill(self.user_id, skill_id)

        self.render_json(self.values)


class SkillPublishHandler(base.BaseHandler):
    """A handler for publishing skills."""

    @acl_decorators.can_publish_skill
    def put(self, skill_id):
        """Publishes a skill."""
        skill = skill_services.get_skill_by_id(skill_id)
        version = self.payload.get('version')
        _require_valid_version(version, skill.version)

        skill_domain.Skill.require_valid_skill_id(skill_id)

        try:
            skill_services.publish_skill(skill_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        skill_rights = skill_services.get_skill_rights(skill_id, strict=False)
        user_actions_info = user_services.UserActionsInfo(self.user_id)
        can_edit_skill_description = check_can_edit_skill_description(
            user_actions_info)

        self.values.update({
            'skill_is_private': skill_rights.skill_is_private,
            'creator_id': skill_rights.creator_id,
            'can_edit_skill_description': can_edit_skill_description
        })

        self.render_json(self.values)
