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

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import suggestion_services
from core.platform import models

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionHandler(base.BaseHandler):
    """"Handles operations relating to learner suggestions."""

    @acl_decorators.can_suggest_changes
    def post(self):
        if not constants.USE_NEW_SUGGESTION_FRAMEWORK:
            raise self.PageNotFoundException

        suggestion_services.create_suggestion(
            self.payload.get('suggestion_type'),
            self.payload.get('target_type'), self.payload.get('target_id'),
            self.payload.get('target_version_at_submission'),
            self.user_id, self.payload.get('change_cmd'),
            self.payload.get('description'),
            self.payload.get('assigned_reviewer_id'),
            self.payload.get('final_reviewer_id'))
        self.render_json(self.values)


class SuggestionToExplorationActionHandler(base.BaseHandler):
    """Handles actions performed on suggestions to explorations."""

    ACTION_TYPE_ACCEPT = 'accept'
    ACTION_TYPE_REJECT = 'reject'


    # TODO (nithesh): Add permissions for users with enough scores to review
    # Will be added as part of milestone 2 of the generalized review system
    # project.
    @acl_decorators.can_edit_exploration
    def put(self, exploration_id, suggestion_id):
        if not constants.USE_NEW_SUGGESTION_FRAMEWORK:
            raise self.PageNotFoundException

        if len(suggestion_id.split('.')) != 3:
            raise self.InvalidInputException('Invalid format for suggestion_id.'
                                             ' It must contain 3 parts'
                                             ' separated by \'.\'')
        action = self.payload.get('action')
        if action == self.ACTION_TYPE_ACCEPT:
            suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
            suggestion_services.accept_suggestion(
                suggestion, self.user_id, self.payload.get('commit_message'),
                self.payload.get('review_message'))
        elif action == self.ACTION_TYPE_REJECT:
            suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
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

    LIST_TYPES_TO_SERVICES_MAPPING = {
        LIST_TYPE_ASSIGNED_REVIEWER: (
            suggestion_services.get_suggestions_assigned_to_reviewer),
        LIST_TYPE_AUTHOR: suggestion_services.get_suggestions_by_author,
        LIST_TYPE_ID: suggestion_services.get_suggestion_by_id,
        LIST_TYPE_REVIEWER: suggestion_services.get_suggestions_reviewed_by,
        LIST_TYPE_STATUS: suggestion_services.get_suggestions_by_status,
        LIST_TYPE_SUGGESTION_TYPE: suggestion_services.get_suggestion_by_type,
        LIST_TYPE_TARGET_ID: suggestion_services.get_suggestions_by_target_id
    }

    PARAMS_FOR_LIST_TYPES = {
        LIST_TYPE_ASSIGNED_REVIEWER: ['assigned_reviewer_id'],
        LIST_TYPE_AUTHOR: ['author_id'],
        LIST_TYPE_ID: ['suggestion_id'],
        LIST_TYPE_REVIEWER: ['reviewer_id'],
        LIST_TYPE_STATUS: ['status'],
        LIST_TYPE_SUGGESTION_TYPE: ['suggestion_type'],
        LIST_TYPE_TARGET_ID: ['target_type', 'target_id']
    }

    def get_params_from_request(self, request, list_type):
        return [request.get(param_name)
                for param_name in self.PARAMS_FOR_LIST_TYPES[list_type]]

    @acl_decorators.open_access
    def get(self):
        if not constants.USE_NEW_SUGGESTION_FRAMEWORK:
            raise self.PageNotFoundException

        list_type = self.request.get('list_type')

        if list_type not in self.LIST_TYPES_TO_SERVICES_MAPPING:
            raise self.InvalidInputException('Invalid list type.')

        params = self.get_params_from_request(self.request, list_type)
        suggestions = self.LIST_TYPES_TO_SERVICES_MAPPING[list_type](*params)

        # When querying by ID, only a single suggestion is retrieved, so we make
        # it a list.
        if list_type == self.LIST_TYPE_ID:
            suggestions = [suggestions]

        self.values.update({'suggestions': [s.to_dict() for s in suggestions]})
        self.render_json(self.values)
