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

from core.controllers import base
from core.domain import acl_decorators
from core.domain import question_domain
from core.domain import question_services
import feconf


class EditableQuestionDataHandler(base.BaseHandler):
    """A data handler for questions which supports writing."""

    @acl_decorators.can_view_question_editor
    def get(self, question_id):
        """Gets the data for the question overview page."""

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(
            question_id, strict=False)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        self.values.update({
            'question_dict': question.to_dict()
        })
        self.render_json(self.values)

    @acl_decorators.can_edit_question
    def put(self, question_id):
        """Updates properties of the given question."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(
            question_id, strict=False)

        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')

        commit_message = self.payload.get('commit_message')
        if not question_id:
            raise self.PageNotFoundException
        if not commit_message:
            raise self.PageNotFoundException
        if not self.payload.get('change_list'):
            raise self.PageNotFoundException
        change_list = [
            question_domain.QuestionChange(change)
            for change in self.payload.get('change_list')
        ]
        question_services.update_question(
            self.user_id, question_id, change_list,
            commit_message)

        question_dict = question_services.get_question_by_id(
            question_id, strict=False).to_dict()
        return self.render_json({
            'question_dict': question_dict
        })

    @acl_decorators.can_delete_question
    def delete(self, question_id):
        """Handles Delete requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        question = question_services.get_question_by_id(
            question_id, strict=False)
        if question is None:
            raise self.PageNotFoundException(
                'The question with the given id doesn\'t exist.')
        question_services.delete_question(self.user_id, question_id)
