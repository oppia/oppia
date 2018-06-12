# coding: utf-8
#
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

"""Controllers for suggestions."""

from core.controllers import base
from core.domain import acl_decorators
from core.domain import suggestion_services
from core.platform import models

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionHandler(base.BaseHandler):
    """"Handles operations relating to learner suggestions."""

    @acl_decorators.can_suggest_changes
    def post(self):
        suggestion_services.create_suggestion(
            self.payload.get('suggestion_type'),
            self.payload.get('target_type'), self.payload.get('target_id'),
            self.payload.get('target_version_at_submission'),
            self.user_id, self.payload.get('change_cmd'),
            self.payload.get('description'),
            self.payload.get('assigned_reviewer_id'),
            self.payload.get('final_reviewer_id'))
        self.render_json(self.values)


class SuggestionActionHandler(base.BaseHandler):
    """Handles actions performed to suggestions."""

    ACTION_TYPE_ACCEPT = 'accept'
    ACTION_TYPE_REJECT = 'reject'

    @acl_decorators.can_accept_suggestion
    def put(self, suggestion_id):
        action = self.payload.get('action')
        if action == self.ACTION_TYPE_ACCEPT:
            suggestion = suggestion_services.get_suggestion_by_id(
                suggestion_id)
            suggestion_services.accept_suggestion(
                suggestion, self.user_id, self.payload.get('commit_message'),
                self.payload.get('review_message'))
        elif action == self.ACTION_TYPE_REJECT:
            suggestion = suggestion_services.get_suggestion_by_id(
                suggestion_id)
            suggestion_services.reject_suggestion(
                suggestion, self.user_id, self.payload.get('review_message'))
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class SuggestionListHandler(base.BaseHandler):
    """Handles list operations on suggestions."""

    LIST_TYPE_ASSIGNED_REVIEWER = 'assignedReviewer'
    LIST_TYPE_AUTHOR = 'author'
    LIST_TYPE_ID = 'id'
    LIST_TYPE_REVIEWER = 'reviewer'
    LIST_TYPE_STATUS = 'status'
    LIST_TYPE_SUGGESTION_TYPE = 'type'
    LIST_TYPE_TARGET_ID = 'target'

    @acl_decorators.open_access
    def get(self):
        list_type = self.request.get('list_type')
        if list_type == self.LIST_TYPE_ASSIGNED_REVIEWER:
            suggestions = (
                suggestion_services.get_suggestions_assigned_to_reviewer(
                    self.request.get('assigned_reviewer_id')))
        elif list_type == self.LIST_TYPE_AUTHOR:
            suggestions = suggestion_services.get_suggestions_by_author(
                self.request.get('author_id'))
        elif list_type == self.LIST_TYPE_ID:
            suggestions = [suggestion_services.get_suggestion_by_id(
                self.request.get('suggestion_id'))]
        elif list_type == self.LIST_TYPE_REVIEWER:
            suggestions = suggestion_services.get_suggestions_reviewed_by(
                self.request.get('reviewer_id'))
        elif list_type == self.LIST_TYPE_STATUS:
            suggestions = suggestion_services.get_suggestions_by_status(
                self.request.get('status'))
        elif list_type == self.LIST_TYPE_SUGGESTION_TYPE:
            suggestions = suggestion_services.get_suggestions_by_type(
                self.request.get('suggestion_type'))
        elif list_type == self.LIST_TYPE_TARGET_ID:
            suggestions = suggestion_services.get_suggestions_by_target_id(
                self.request.get('target_type'), self.request.get('target_id'))
        else:
            raise self.InvalidInputException('Invalid list type.')

        self.values.update({'suggestions': [s.to_dict() for s in suggestions]})
        self.render_json(self.values)
