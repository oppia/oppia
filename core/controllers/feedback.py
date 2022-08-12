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

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import feedback_services
from core.domain import suggestion_services
from core.domain import user_services


def replace_user_id_with_username_in_dict(thread_dicts, user_keys):
    """Replace user id with the corresponding username in the given dictionary.

    Args:
        thread_dicts: list(dict). The dictionary that will be updated.
        user_keys: list(tuple). A list that contains tuples of keys. The first
            item in the tuple is a key of the user ID and the second item is a
            key of a newly added username.

    Returns:
        list(dict). The updated dictionary.
    """
    for thread_dict in thread_dicts:
        for user_id_key, username_key in user_keys:
            thread_dict[username_key] = (
                user_services.get_username(thread_dict[user_id_key])
                if thread_dict[user_id_key] else None
            )
            thread_dict.pop(user_id_key)
    return thread_dicts


class ThreadListHandler(base.BaseHandler):
    """Handles operations relating to feedback thread lists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': r'^[a-zA-Z0-9\-_]{1,12}$'
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'subject': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'text': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):

        feedback_thread_dicts = [
            thread.to_dict() for thread in feedback_services.get_all_threads(
               feconf.ENTITY_TYPE_EXPLORATION, exploration_id, False
            )
        ]
        self.values.update({
            'feedback_thread_dicts': replace_user_id_with_username_in_dict(
                feedback_thread_dicts, [
                    ('original_author_id', 'original_author_username'),
                    (
                        'last_nonempty_message_author_id',
                        'last_nonempty_message_author'
                    )
                ]
            )
        })
        self.render_json(self.values)

    @acl_decorators.can_create_feedback_thread
    def post(self, exploration_id):
        subject = self.normalized_payload.get('subject')
        text = self.normalized_payload.get('text')

        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id, self.user_id,
            subject, text)
        self.render_json(self.values)


class ThreadListHandlerForTopicsHandler(base.BaseHandler):
    """Handles listing of suggestions threads linked to topics."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': r'^[a-zA-Z0-9\-_]{1,12}$'
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_edit_topic
    def get(self, topic_id):

        suggestion_thread_dicts = [
            thread.to_dict() for thread in feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_TOPIC, topic_id, True
            )
        ]
        self.values.update({
            'suggestion_thread_dicts': replace_user_id_with_username_in_dict(
                suggestion_thread_dicts,
                [('original_author_id', 'original_author_username')]
            )
        })
        self.render_json(self.values)


class ThreadHandler(base.BaseHandler):
    """Handles operations relating to feedback threads."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'thread_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.VALID_THREAD_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'updated_status': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'text': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'updated_subject': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_view_feedback_thread
    def get(self, thread_id):
        suggestion_id = thread_id
        suggestion = suggestion_services.get_suggestion_by_id(
            suggestion_id, strict=False
        )

        message_dicts = [
            message.to_dict() for message in feedback_services.get_messages(
                thread_id
            )
        ]
        message_ids = [message['message_id'] for message in message_dicts]
        if self.user_id:
            feedback_services.update_messages_read_by_the_user(
                self.user_id, thread_id, message_ids)

        self.values.update({
            'messages': replace_user_id_with_username_in_dict(
                message_dicts,
                [('author_id', 'author_username')]
            ),
            'suggestion': suggestion.to_dict() if suggestion else None
        })
        self.render_json(self.values)

    @acl_decorators.can_comment_on_feedback_thread
    def post(self, thread_id):
        suggestion = suggestion_services.get_suggestion_by_id(
            thread_id, strict=False
        )
        text = self.normalized_payload.get('text')
        updated_status = self.normalized_payload.get('updated_status')
        updated_subject = self.normalized_payload.get('updated_subject')

        if suggestion and updated_status:
            raise self.InvalidInputException(
                'Suggestion thread status cannot be changed manually.')

        messages = feedback_services.get_messages(thread_id)
        new_message = feedback_services.create_message(
            thread_id, self.user_id, updated_status, updated_subject, text)

        # Currently we are manually adding new message to the messages list as
        # the feedback_services.get_messages is not returning a correct list of
        # messages after adding new message model to the datastore because of an
        # unknown reason.
        messages.append(new_message)
        message_dict = [message.to_dict() for message in messages]

        self.render_json({
            'messages': replace_user_id_with_username_in_dict(
                message_dict,
                [('author_id', 'author_username')]
            )
        })


class RecentFeedbackMessagesHandler(base.BaseHandler):
    """Returns a list of recently-posted feedback messages.

    Note that this currently also includes messages posted in private
    explorations.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_access_moderator_page
    def get(self):
        urlsafe_start_cursor = self.normalized_request.get('cursor')

        all_feedback_messages, new_urlsafe_start_cursor, more = (
            feedback_services.get_next_page_of_all_feedback_messages(
                urlsafe_start_cursor=urlsafe_start_cursor))

        message_dict = [message.to_dict() for message in all_feedback_messages]

        self.render_json({
            'results': replace_user_id_with_username_in_dict(
                message_dict,
                [('author_id', 'author_username')]
            ),
            'cursor': new_urlsafe_start_cursor,
            'more': more,
        })


class FeedbackStatsHandler(base.BaseHandler):
    """Returns Feedback stats for an exploration.
        - Number of open threads.
        - Number of total threads.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': r'^[a-zA-Z0-9\-_]{1,12}$'
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

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

    URL_PATH_ARGS_SCHEMAS = {
        'thread_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.VALID_THREAD_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {}
    }

    @acl_decorators.can_comment_on_feedback_thread
    def post(self, thread_id):
        exploration_id = feedback_services.get_exp_id_from_thread_id(thread_id)
        feedback_services.clear_feedback_message_references_transactional(
            self.user_id, exploration_id, thread_id)
        self.render_json(self.values)
