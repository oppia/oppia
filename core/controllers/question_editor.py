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
import logging

from core.controllers import base
from core.domain import acl_decorators
from core.domain import question_domain
from core.domain import question_services
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
            'question': question.to_dict(),
            'can_edit': question_services.check_can_edit_question(
                self.user.user_id, question.question_id)
        })

        self.render_template(
            'pages/question_editor/question_editor.html',
            redirect_url_on_logout='/')


class EditableQuestionDataHandler(base.BaseHandler):
    """A data handler for questions which supports writing."""

    @acl_decorators.can_view_any_question_editor
    def get(self, question_id):
        """Gets the data for the question overview page."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question_data = question_services.get_question_by_id(question_id)

        self.values.update(question_data.to_dict())
        self.render_json(self.values)

    @acl_decorators.can_edit_question
    def put(self, question_id):
        """Updates properties of the given question."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

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

    @acl_decorators.can_delete_question
    def delete(self, question_id):
        """Handles Delete requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        log_debug_string = '(%s) %s tried to delete question %s' % (
            self.role, self.user_id, question_id)
        logging.debug(log_debug_string)

        question = question_services.get_question_by_id(question_id)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')
        question_services.delete_question(self.user_id, question_id)

        log_info_string = '(%s) %s deleted question %s' % (
            self.role, self.user_id, question_id)
        logging.info(log_info_string)
