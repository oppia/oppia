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
import json

from core.controllers import base
from core.domain import acl_decorators
from core.domain import question_domain
from core.domain import question_services
from core.domain import role_services
from core.domain import user_services
import feconf
import utils


class QuestionEditorPage(base.BaseHandler):
    """The editor page for a single question."""

    @acl_decorators.can_view_any_question_editor
    def get(self, question_id):
        """Handles GET requests."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(question_id)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        self.values.update({
            'question_id': question.question_id,
            'nav_mode': feconf.NAV_MODE_QUESTION_EDITOR
        })

        self.render_template(
            'pages/question_editor/question_editor.html',
            redirect_url_on_logout='/')


class EditableQuestionDataHandler(base.BaseHandler):
    """A data handler for questions which supports writing."""

    def _require_valid_version(self, version_from_payload, question_version):
        """Check that the payload version matches the given question
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != question_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of question from version %s, '
                'which is too old. Please reload the page and try again.'
                % (question_version, version_from_payload))

    @acl_decorators.can_view_any_question_editor
    def get(self, question_id):
        """Populates the data on the individual question page."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question_domain.Question.require_valid_question_id(question_id)

        question = question_services.get_question_by_id(question_id)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        self.values.update({
            'question': question.to_dict()
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_question
    def put(self, question_id):
        """Updates properties of the given question."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question_domain.Question.require_valid_question_id(question_id)
        question = question_services.get_question_by_id(question_id)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        version = self.payload.get('version')
        self._require_valid_version(version, question.version)

        commit_message = self.payload.get('commit_message')
        change_dicts = self.payload.get('change_dicts')
        change_list = []
        for change in change_dicts:
            change_list.append(
                question_domain.QuestionChange(change))
        try:
            question_services.update_question_pages(
                self.user_id, question_id, change_list,
                commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        question_dict = question_services.get_question_by_id(
            question_id).to_dict()

        self.values.update({
            'question': question_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_question
    def delete(self, question_id):
        """Handles Delete requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question_domain.Question.require_valid_question_id(question_id)
        question = question_services.get_question_by_id(question_id)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')
        question_services.delete_question(self.user_id, question_id)


class QuestionRightsHandler(base.BaseHandler):
    """A handler for returning question rights."""

    @acl_decorators.can_view_any_question_editor
    def get(self, question_id):
        """Returns the QuestionRights object of a question."""
        question_domain.Question.require_valid_question_id(question_id)

        question_rights = question_services.get_question_rights(question_id)
        if question_rights is None:
            raise self.InvalidInputException(
                'Expected a valid question id to be provided.')
        user_actions_info = user_services.UserActionsInfo(self.user_id)
        can_edit_question = question_services.check_can_edit_question(
            user_actions_info, question_rights)

        can_publish_question = (
            role_services.ACTION_CHANGE_QUESTION_STATUS in
            user_actions_info.actions)

        self.values.update({
            'can_edit_question': can_edit_question,
            'published': question_rights.question_is_published,
            'can_publish_question': can_publish_question
        })

        self.render_json(self.values)


class QuestionPublishHandler(base.BaseHandler):
    """A handler for publishing and unpublishing questions."""

    @acl_decorators.can_change_question_publication_status
    def put(self, question_id):
        """Publishes or unpublishes a question."""
        question_domain.Question.require_valid_question_id(question_id)

        publish_status = self.payload.get('publish_status')

        if not isinstance(publish_status, bool):
            raise self.InvalidInputException(
                'Publish status should only be true or false.')

        try:
            if publish_status:
                question_services.publish_question(question_id, self.user_id)
            else:
                question_services.unpublish_question(question_id, self.user_id)
        except Exception as e:
            raise self.UnauthorizedUserException(e)

        self.render_json(self.values)


class QuestionsHandler(base.BaseHandler):
    """This handler completes PUT/DELETE requests for questions."""

    @acl_decorators.can_access_moderator_page
    def put(self, question_id):
        """Handles PUT requests."""
        commit_message = self.payload.get('commit_message')
        if not question_id:
            raise self.PageNotFoundException
        if not commit_message:
            raise self.PageNotFoundException
        if not self.payload.get('change_list'):
            raise self.PageNotFoundException
        change_list = [
            question_domain.QuestionChange(change)
            for change in json.loads(self.payload.get('change_list'))]
        question_services.update_question(
            self.user_id, question_id, change_list,
            commit_message)
        return self.render_json({
            'question_id': question_id
        })

    @acl_decorators.can_access_moderator_page
    def delete(self, question_id):
        """Handles Delete requests."""
        if not question_id:
            raise self.PageNotFoundException
        question_services.delete_question(
            self.user_id, question_id)
