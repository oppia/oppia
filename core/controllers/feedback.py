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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import feedback_services
from core.domain import suggestion_services
import feconf


class ThreadListHandler(base.BaseHandler):
    """Handles operations relating to feedback thread lists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        self.values.update({
            'feedback_thread_dicts': (
                [t.to_dict() for t in feedback_services.get_all_threads(
                    feconf.ENTITY_TYPE_EXPLORATION, exploration_id, False)]),
            'suggestion_thread_dicts': (
                [t.to_dict() for t in feedback_services.get_all_threads(
                    feconf.ENTITY_TYPE_EXPLORATION, exploration_id, True)])
        })
        self.render_json(self.values)

    @acl_decorators.can_create_feedback_thread
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
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id, self.user_id,
            subject, text)
        self.render_json(self.values)


class ThreadListHandlerForTopicsHandler(base.BaseHandler):
    """Handles listing of suggestions threads linked to topics."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_topic
    def get(self, topic_id):
        self.values.update({
            'suggestion_thread_dicts': (
                [t.to_dict() for t in feedback_services.get_all_threads(
                    feconf.ENTITY_TYPE_TOPIC, topic_id, True)])
            })
        self.render_json(self.values)


class ThreadHandler(base.BaseHandler):
    """Handles operations relating to feedback threads."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_feedback_thread
    def get(self, thread_id):
        suggestion_id = thread_id
        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)

        messages = [m.to_dict() for m in feedback_services.get_messages(
            thread_id)]
        message_ids = [message['message_id'] for message in messages]
        if self.user_id:
            feedback_services.update_messages_read_by_the_user(
                self.user_id, thread_id, message_ids)
        self.values.update({
            'messages': messages,
            'suggestion': suggestion.to_dict() if suggestion else None
        })
        self.render_json(self.values)

    @acl_decorators.can_comment_on_feedback_thread
    def post(self, thread_id):
        suggestion = suggestion_services.get_suggestion_by_id(thread_id)
        text = self.payload.get('text')
        updated_status = self.payload.get('updated_status')
        if not text and not updated_status:
            raise self.InvalidInputException(
                'Text for the message must be specified.')
        if suggestion and updated_status:
            raise self.InvalidInputException(
                'Suggestion thread status cannot be changed manually.')

        messages = feedback_services.get_messages(thread_id)
        new_message = feedback_services.create_message(
            thread_id, self.user_id, updated_status,
            self.payload.get('updated_subject'), text)

        # Currently we are manually adding new message to the messages list as
        # the feedback_services.get_messages is not returning a correct list of
        # messages after adding new message model to the datastore because of an
        # unknown reason.
        messages.append(new_message)
        self.render_json({
            'messages': [message.to_dict() for message in messages]
        })


class RecentFeedbackMessagesHandler(base.BaseHandler):
    """Returns a list of recently-posted feedback messages.

    Note that this currently also includes messages posted in private
    explorations.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_moderator_page
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
        - Number of open threads.
        - Number of total threads.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
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


class FeedbackThreadViewEventHandler(base.BaseHandler):
    """Records when the given user views a feedback thread, in order to clear
    viewed feedback messages from emails that might be sent in future to this
    user.
    """

    @acl_decorators.can_comment_on_feedback_thread
    def post(self, thread_id):
        exploration_id = feedback_services.get_exp_id_from_thread_id(thread_id)
        feedback_services.clear_feedback_message_references_transactional(
            self.user_id, exploration_id, thread_id)
        self.render_json(self.values)
