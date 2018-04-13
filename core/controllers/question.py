# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Controller for retrieving questions."""

import json

from core.controllers import base
from core.domain import acl_decorators
from core.domain import question_domain
from core.domain import question_services


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


class QuestionCreationHandler(base.BaseHandler):
    """This handler completes POST requests for questions."""

    @acl_decorators.can_access_moderator_page
    def post(self):
        """Handles POST requests."""
        if not self.payload.get('question'):
            raise self.PageNotFoundException
        question = question_domain.Question.from_dict(
            self.payload.get('question'))
        question_id = question_services.add_question(
            self.user_id, question)
        return self.render_json({
            'question_id': question_id
        })


class QuestionManagerHandler(base.BaseHandler):
    """This handler completes requests for question summaries.
       This class used to deal with getting all question ids linked to a
       collection, but as that functionality of collection is removed,
       this class is currently deprecated.
       """
