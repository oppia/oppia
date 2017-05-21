# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the feedback thread page."""

from core.controllers import base
from core.controllers import editor
from core.domain import exp_services
from core.domain import feedback_services
from core.platform import models
import feconf


transaction_services = models.Registry.import_transaction_services()

class ThreadListHandler(base.BaseHandler):
    """Handles operations relating to feedback thread lists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def get(self, exploration_id):
        self.values.update({
            'threads': [t.to_dict() for t in feedback_services.get_all_threads(
                exploration_id, False)]})
        self.render_json(self.values)

    @base.require_user
    def post(self, exploration_id):
        subject = self.payload.get('subject')
        if not subject:
            raise self.InvalidInputException(
                'A thread subject must be specified.')

        text = self.payload.get('text')
        if not text:
            raise self.InvalidInputException(
                'Text for the first message in the thread must be specified.')

        feedback_services.create_thread(
            exploration_id,
            self.payload.get('state_name'),
            self.user_id,
            subject,
            text)
        self.render_json(self.values)


class ThreadHandler(base.BaseHandler):
    """Handles operations relating to feedback threads."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def get(self, exploration_id, thread_id):  # pylint: disable=unused-argument
        suggestion = feedback_services.get_suggestion(exploration_id, thread_id)
        self.values.update({
            'messages': [m.to_dict() for m in feedback_services.get_messages(
                exploration_id, thread_id)],
            'suggestion': suggestion.to_dict() if suggestion else None
        })
        self.render_json(self.values)

    @base.require_user
    def post(self, exploration_id, thread_id):  # pylint: disable=unused-argument
        suggestion = feedback_services.get_suggestion(exploration_id, thread_id)
        text = self.payload.get('text')
        updated_status = self.payload.get('updated_status')
        if not text and not updated_status:
            raise self.InvalidInputException(
                'Text for the message must be specified.')
        if suggestion and updated_status:
            raise self.InvalidInputException(
                'Suggestion thread status cannot be changed manually.')

        feedback_services.create_message(
            exploration_id,
            thread_id,
            self.user_id,
            updated_status,
            self.payload.get('updated_subject'),
            text)
        self.render_json(self.values)


class RecentFeedbackMessagesHandler(base.BaseHandler):
    """Returns a list of recently-posted feedback messages.

    Note that this currently also includes messages posted in private
    explorations.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @base.require_moderator
    def get(self):
        urlsafe_start_cursor = self.request.get('cursor')

        all_feedback_messages, new_urlsafe_start_cursor, more = (
            feedback_services.get_next_page_of_all_feedback_messages(
                urlsafe_start_cursor=urlsafe_start_cursor))

        self.render_json({
            'results': [m.to_dict() for m in all_feedback_messages],
            'cursor': new_urlsafe_start_cursor,
            'more': more,
        })


class FeedbackStatsHandler(base.BaseHandler):
    """Returns Feedback stats for an exploration.
        - Number of open threads
        - Number of total threads
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def get(self, exploration_id):
        feedback_thread_analytics = (
            feedback_services.get_thread_analytics(
                exploration_id))
        self.values.update({
            'num_open_threads': (
                feedback_thread_analytics.num_open_threads),
            'num_total_threads': (
                feedback_thread_analytics.num_total_threads),
        })
        self.render_json(self.values)


class SuggestionHandler(base.BaseHandler):
    """"Handles operations relating to learner suggestions."""

    @base.require_user
    def post(self, exploration_id):
        feedback_services.create_suggestion(
            exploration_id,
            self.user_id,
            self.payload.get('exploration_version'),
            self.payload.get('state_name'),
            self.payload.get('description'),
            self.payload.get('suggestion_content'))
        self.render_json(self.values)


class SuggestionActionHandler(base.BaseHandler):
    """"Handles actions performed on threads with suggestions."""

    _ACCEPT_ACTION = 'accept'
    _REJECT_ACTION = 'reject'

    @editor.require_editor
    def put(self, exploration_id, thread_id):
        action = self.payload.get('action')
        if action == self._ACCEPT_ACTION:
            exp_services.accept_suggestion(
                self.user_id,
                thread_id,
                exploration_id,
                self.payload.get('commit_message'))
        elif action == self._REJECT_ACTION:
            exp_services.reject_suggestion(
                self.user_id, thread_id, exploration_id)
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class SuggestionListHandler(base.BaseHandler):
    """Handles operations relating to list of threads with suggestions."""

    _LIST_TYPE_OPEN = 'open'
    _LIST_TYPE_CLOSED = 'closed'
    _LIST_TYPE_ALL = 'all'

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _string_to_bool(self, has_suggestion):
        if has_suggestion == 'true':
            return True
        elif has_suggestion == 'false':
            return False
        else:
            return None

    @base.require_user
    def get(self, exploration_id):
        threads = None
        list_type = self.request.get('list_type')
        has_suggestion = self._string_to_bool(
            self.request.get('has_suggestion'))
        if has_suggestion is None:
            raise self.InvalidInputException(
                'Invalid value for has_suggestion.')
        if list_type == self._LIST_TYPE_OPEN:
            threads = feedback_services.get_open_threads(
                exploration_id, has_suggestion)
        elif list_type == self._LIST_TYPE_CLOSED:
            threads = feedback_services.get_closed_threads(
                exploration_id, has_suggestion)
        elif list_type == self._LIST_TYPE_ALL:
            threads = feedback_services.get_all_threads(
                exploration_id, has_suggestion)
        else:
            raise self.InvalidInputException('Invalid list type.')

        self.values.update({'threads': [t.to_dict() for t in threads]})
        self.render_json(self.values)


class FeedbackThreadViewEventHandler(base.BaseHandler):
    """Records when the given user views a feedback thread, in order to clear
    viewed feedback messages from emails that might be sent in future to this
    user."""

    @base.require_user
    def post(self):
        exploration_id = self.payload.get('exploration_id')
        thread_id = self.payload.get('thread_id')
        transaction_services.run_in_transaction(
            feedback_services.clear_feedback_message_references, self.user_id,
            exploration_id, thread_id)
        self.render_json(self.values)
