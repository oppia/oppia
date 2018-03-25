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
import feconf


class QuestionsBatchHandler(base.BaseHandler):
    """This handler completes requests for questions batch."""
    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_access_moderator_page
    def get(self):
        """Handles GET requests."""
        collection_id = self.request.get('collection_id')
        if not collection_id:
            raise self.PageNotFoundException
        if not self.request.get('stringified_skill_ids'):
            raise self.PageNotFoundException
        skill_ids = json.loads(self.request.get('stringified_skill_ids'))
        batch_size = feconf.QUESTION_BATCH_SIZE
        questions_dict = [question.to_dict() for question in (
            question_services.get_questions_batch(
                collection_id, skill_ids, self.user_id, batch_size))]
        return self.render_json({
            'questions_dict': questions_dict
        })


class QuestionsHandler(base.BaseHandler):
    """This handler completes PUT/DELETE requests for questions."""
    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_access_moderator_page
    def put(self, collection_id, question_id):
        """Handles PUT requests."""
        commit_message = self.payload.get('commit_message')
        if not question_id:
            raise self.PageNotFoundException
        if not collection_id:
            raise self.PageNotFoundException
        if not commit_message:
            raise self.PageNotFoundException
        if not self.payload.get('change_list'):
            raise self.PageNotFoundException
        change_list = [
            question_domain.QuestionChange(change)
            for change in json.loads(self.payload.get('change_list'))]
        question_services.update_question(
            self.user_id, collection_id, question_id, change_list,
            commit_message)
        return self.render_json({
            'question_id': question_id
        })

    @acl_decorators.can_access_moderator_page
    def delete(self, collection_id, question_id):
        """Handles Delete requests."""
        if not collection_id:
            raise self.PageNotFoundException
        if not question_id:
            raise self.PageNotFoundException
        question_services.delete_question(
            self.user_id, collection_id, question_id)


class QuestionCreationHandler(base.BaseHandler):
    """This handler completes POST requests for questions."""
    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_access_moderator_page
    def post(self):
        """Handles POST requests."""
        if not self.payload.get('question'):
            raise self.PageNotFoundException
        if not self.payload.get('skill_id'):
            raise self.PageNotFoundException
        question = question_domain.Question.from_dict(
            self.payload.get('question'))
        skill_id = self.payload.get('skill_id')
        question_id = question_services.add_question(
            self.user_id, question)
        question_services.add_question_id_to_skill(
            question_id, question.collection_id, skill_id, self.user_id)
        return self.render_json({
            'question_id': question_id
        })


class QuestionManagerHandler(base.BaseHandler):
    """This handler completes requests for question summaries."""
    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.can_access_moderator_page
    def get(self):
        """Handles GET requests."""
        collection_id = self.request.get('collection_id')
        if not collection_id:
            raise self.PageNotFoundException
        question_summaries = (
            question_services.get_question_summaries_for_collection(
                collection_id))
        return self.render_json({
            'question_summary_dicts': [
                question_summary.to_dict()
                for question_summary in question_summaries]
            })
