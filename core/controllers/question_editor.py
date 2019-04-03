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

"""Controllers for the questions editor, from where questions are edited
and are created.
"""

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
import feconf


class QuestionCreationHandler(base.BaseHandler):
    """A handler that creates the question model given a question dict."""

    @acl_decorators.can_manage_question_skill_status
    def post(self, skill_id):
        """Handles POST requests."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        skill_domain.Skill.require_valid_skill_id(skill_id)
        skill = skill_services.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.PageNotFoundException(
                'The skill with the given id doesn\'t exist.')

        question_dict = self.payload.get('question_dict')
        if (
                (question_dict['id'] is not None) or
                ('question_state_data' not in question_dict) or
                ('language_code' not in question_dict) or
                (question_dict['version'] != 1)):
            raise self.InvalidInputException

        question_dict['question_state_data_schema_version'] = (
            feconf.CURRENT_STATES_SCHEMA_VERSION)
        question_dict['id'] = question_services.get_new_question_id()
        try:
            question = question_domain.Question.from_dict(question_dict)
        except:
            raise self.InvalidInputException
        question_services.add_question(self.user_id, question)
        # TODO(vinitamurthi): Replace DEFAULT_SKILL_DIFFICULTY
        # with a value passed from the frontend.
        question_services.create_new_question_skill_link(
            question.id, skill_id, constants.DEFAULT_SKILL_DIFFICULTY)
        self.values.update({
            'question_id': question.id
        })
        self.render_json(self.values)


class QuestionSkillLinkHandler(base.BaseHandler):
    """A handler for linking and unlinking questions to or from a skill."""

    @acl_decorators.can_manage_question_skill_status
    def post(self, question_id, skill_id):
        """Links a question to a skill."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        skill_domain.Skill.require_valid_skill_id(skill_id)
        skill = skill_services.get_skill_by_id(skill_id, strict=False)
        if skill is None:
            raise self.PageNotFoundException(
                'The skill with the given id doesn\'t exist.')

        # TODO(vinitamurthi): Replace DEFAULT_SKILL_DIFFICULTY
        # with a value passed from the frontend.
        question_services.create_new_question_skill_link(
            question_id, skill_id, constants.DEFAULT_SKILL_DIFFICULTY)
        self.render_json(self.values)

    @acl_decorators.can_manage_question_skill_status
    def delete(self, question_id, skill_id):
        """Unlinks a question from a skill."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        question_services.delete_question_skill_link(
            question_id, skill_id)
        self.render_json(self.values)


class EditableQuestionDataHandler(base.BaseHandler):
    """A data handler for questions which supports writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_question_editor
    def get(self, question_id):
        """Gets the data for the question overview page."""

        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(
            question_id, strict=False)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        associated_skills = question_services.get_skills_linked_to_question(
            question_id)
        associated_skill_dicts = [
            skill.to_dict() for skill in associated_skills]

        self.values.update({
            'question_dict': question.to_dict(),
            'associated_skill_dicts': associated_skill_dicts
        })
        self.render_json(self.values)

    @acl_decorators.can_edit_question
    def put(self, question_id):
        """Updates properties of the given question."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(
            question_id, strict=False)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        commit_message = self.payload.get('commit_message')

        if not commit_message:
            raise self.PageNotFoundException
        if not self.payload.get('change_list'):
            raise self.PageNotFoundException
        change_list = [
            question_domain.QuestionChange(change)
            for change in self.payload.get('change_list')
        ]

        for change in change_list:
            if (
                    change.cmd ==
                    question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION):
                raise self.InvalidInputException

        question_services.update_question(
            self.user_id, question_id, change_list,
            commit_message)

        question_dict = question_services.get_question_by_id(
            question_id).to_dict()
        self.render_json({
            'question_dict': question_dict
        })

    @acl_decorators.can_delete_question
    def delete(self, question_id):
        """Handles Delete requests."""
        if not constants.ENABLE_NEW_STRUCTURE_EDITORS:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(
            question_id, strict=False)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')
        question_services.delete_question(self.user_id, question_id)
        self.render_json(self.values)
