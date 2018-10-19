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
    """"Handles operations relating to suggestions."""

    @acl_decorators.can_suggest_changes
    def post(self):
        suggestion_services.create_suggestion(
            self.payload.get('suggestion_type'),
            self.payload.get('target_type'), self.payload.get('target_id'),
            self.payload.get('target_version_at_submission'),
            self.user_id, self.payload.get('change'),
            self.payload.get('description'),
            self.payload.get('final_reviewer_id'))
        self.render_json(self.values)


class SuggestionToExplorationActionHandler(base.BaseHandler):
    """Handles actions performed on suggestions to explorations."""

    @acl_decorators.get_decorator_for_accepting_suggestion(
        acl_decorators.can_edit_exploration)
    def put(self, target_id, suggestion_id):
        if len(suggestion_id.split('.')) != 3:
            raise self.InvalidInputException('Invalid format for suggestion_id.'
                                             ' It must contain 3 parts'
                                             ' separated by \'.\'')

        if (
                suggestion_id.split('.')[0] !=
                suggestion_models.TARGET_TYPE_EXPLORATION):
            raise self.InvalidInputException('This handler allows actions only'
                                             ' on suggestions to explorations.')

        if suggestion_id.split('.')[1] != target_id:
            raise self.InvalidInputException('The exploration id provided does '
                                             'not match the exploration id '
                                             'present as part of the '
                                             'suggestion_id')

        action = self.payload.get('action')
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        if suggestion.author_id == self.user_id:
            raise self.UnauthorizedUserException('You cannot accept/reject your'
                                                 ' own suggestion.')

        if action == suggestion_models.ACTION_TYPE_ACCEPT:
            suggestion_services.accept_suggestion(
                suggestion, self.user_id, self.payload.get('commit_message'),
                self.payload.get('review_message'))
        elif action == suggestion_models.ACTION_TYPE_REJECT:
            suggestion_services.reject_suggestion(
                suggestion, self.user_id, self.payload.get('review_message'))
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class ReSubmitSuggestionHandler(base.BaseHandler):
    """Handler to Reopen a rejected suggestion."""

    @acl_decorators.can_resubmit_suggestion
    def put(self, suggestion_id):
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        if not suggestion:
            raise self.InvalidInputException(
                'No suggestion found with given suggestion id')
        new_change = self.payload.get('change')
        change_type = type(suggestion.change)
        change_object = change_type(new_change)
        suggestion.pre_update_validate(change_object)
        suggestion.change = change_object
        summary_message = self.payload.get('summary_message')
        suggestion_services.resubmit_rejected_suggestion(
            suggestion, summary_message, self.user_id)
        self.render_json(self.values)


class SuggestionToTopicActionHandler(base.BaseHandler):
    """Handles actions performed on suggestions to topics."""

    @acl_decorators.get_decorator_for_accepting_suggestion(
        acl_decorators.can_edit_topic)
    def put(self, target_id, suggestion_id):
        if not constants.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException

        if len(suggestion_id.split('.')) != 3:
            raise self.InvalidInputException(
                'Invalid format for suggestion_id. It must contain 3 parts'
                ' separated by \'.\'')

        if suggestion_id.split('.')[0] != suggestion_models.TARGET_TYPE_TOPIC:
            raise self.InvalidInputException(
                'This handler allows actions only on suggestions to topics.')

        if suggestion_id.split('.')[1] != target_id:
            raise self.InvalidInputException(
                'The topic id provided does not match the topic id present as '
                'part of the suggestion_id')

        action = self.payload.get('action')
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        if action == suggestion_models.ACTION_TYPE_ACCEPT:
            if (
                    suggestion.suggestion_type ==
                    suggestion_models.SUGGESTION_TYPE_ADD_QUESTION):
                # The skill_id is passed only at the time of accepting the
                # suggestion.
                skill_id = self.payload.get('skill_id')
                suggestion.change.skill_id = skill_id
            suggestion_services.accept_suggestion(
                suggestion, self.user_id, self.payload.get('commit_message'),
                self.payload.get('review_message'))
        elif action == suggestion_models.ACTION_TYPE_REJECT:
            suggestion_services.reject_suggestion(
                suggestion, self.user_id, self.payload.get('review_message'))
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class SuggestionListHandler(base.BaseHandler):
    """Handles list operations on suggestions."""

    @acl_decorators.open_access
    def get(self):
        # The query_fields_and_values variable is a list of tuples. The first
        # element in each tuple is the field being queried and the second
        # element is the value of the field being queried.
        # request.GET.items() parses the params from the url into the above
        # format. So in the url, the query should be passed as:
        # ?field1=value1&field2=value2...fieldN=valueN.
        query_fields_and_values = self.request.GET.items()

        for query in query_fields_and_values:
            if query[0] not in suggestion_models.ALLOWED_QUERY_FIELDS:
                raise Exception('Not allowed to query on field %s' % query[0])

        suggestions = suggestion_services.query_suggestions(
            query_fields_and_values)

        self.values.update({'suggestions': [s.to_dict() for s in suggestions]})
        self.render_json(self.values)
