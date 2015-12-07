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

__author__ = 'kashida@google.com (Koji Ashida)'

from core.controllers import base
from core.controllers import editor
from core.domain import exp_services
from core.domain import feedback_services


class ThreadListHandler(base.BaseHandler):
    """Handles operations relating to feedback thread lists."""

    PAGE_NAME_FOR_CSRF = 'editor'

    def get(self, exploration_id):
        self.values.update({
            'threads': feedback_services.get_threadlist(exploration_id)})
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

    PAGE_NAME_FOR_CSRF = 'editor'

    def get(self, exploration_id, thread_id):
        self.values.update({
            'messages': feedback_services.get_messages(
                exploration_id, thread_id)})
        self.values.update(
            {'suggestion': feedback_services.get_suggestion(
                exploration_id, thread_id)})
        self.render_json(self.values)

    @base.require_user
    def post(self, exploration_id, thread_id):
        text = self.payload.get('text')
        updated_status = self.payload.get('updated_status')
        if not text and not updated_status:
            raise self.InvalidInputException(
                'Text for the message must be specified.')

        feedback_services.create_message(
            '.'.join((exploration_id, thread_id)),
            self.user_id,
            updated_status,
            self.payload.get('updated_subject'),
            text)
        self.render_json(self.values)


class FeedbackLastUpdatedHandler(base.BaseHandler):
    """Returns the last time a thread for this exploration was updated."""

    def get(self, exploration_id):
        self.values.update({
            'last_updated': feedback_services.get_last_updated_time(
                exploration_id)})
        self.render_json(self.values)


class RecentFeedbackMessagesHandler(base.BaseHandler):
    """Returns a list of recently-posted feedback messages.

    Note that this currently also includes messages posted in private
    explorations.
    """

    @base.require_moderator
    def get(self):
        urlsafe_start_cursor = self.request.get('cursor')

        all_feedback_messages, new_urlsafe_start_cursor, more = (
            feedback_services.get_next_page_of_all_feedback_messages(
                urlsafe_start_cursor=urlsafe_start_cursor))

        self.render_json({
            'results': all_feedback_messages,
            'cursor': new_urlsafe_start_cursor,
            'more': more,
        })


class SuggestionHandler(base.BaseHandler):
    """"Handles operations relating to learner suggestions."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_user
    def post(self, exploration_id):
        feedback_services.create_suggestion(
            exploration_id,
            self.user_id,
            self.payload.get('exploration_version'),
            self.payload.get('state_name'),
            self.payload.get('suggestion_content'))
        self.render_json(self.values)


class SuggestionActionHandler(base.BaseHandler):
    """"Handles actions performed on threads with suggestions."""

    PAGE_NAME_FOR_CSRF = 'editor'
    ACCEPT_ACTION = 'accept'
    REJECT_ACTION = 'reject'

    @editor.require_editor
    def put(self, exploration_id, thread_id):
        action = self.payload.get('action')
        if action == self.ACCEPT_ACTION:
            exp_services.accept_suggestion(
                self.user_id,
                thread_id,
                exploration_id,
                self.payload.get('commit_message'))
        elif action == self.REJECT_ACTION:
             exp_services.reject_suggestion(thread_id, exploration_id)
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json(self.values)


class SuggestionListHandler(base.BaseHandler):
    """Handles operations relating to list of threads with suggestions."""

    PAGE_NAME_FOR_CSRF = 'editor'
    OPEN_LIST_TYPE = 'open'
    CLOSED_LIST_TYPE = 'closed'
    ALL_LIST_TYPE = 'all'

    def _string_to_bool(self, str):
        if str == 'true':
            return True
        if str == 'false':
            return False

    @base.require_user
    def get(self, exploration_id):
        threads = None
        list_type = self.request.get('list_type')
        has_suggestion = self.request.get('has_suggestion')
        if list_type == self.OPEN_LIST_TYPE:
            threads = feedback_services.get_open_threads(
                exploration_id, self._string_to_bool(has_suggestion))
        elif list_type == self.CLOSED_LIST_TYPE:
            threads = feedback_services.get_closed_threads(
                exploration_id, self._string_to_bool(has_suggestion))
        elif list_type == self.ALL_LIST_TYPE:
            threads = feedback_services.get_all_suggestion_threads(
                exploration_id)
        else:
            raise self.InvalidInputException('Invalid list type.')
         
        self.values.update({'threads': threads})
        self.render_json(self.values)
