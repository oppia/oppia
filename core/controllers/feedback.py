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
from core.domain import feedback_domain
from core.domain import feedback_services
from core.domain import suggestion_services
from core.domain import user_services

from typing import Dict, List, Optional, TypedDict


class UpdatedLastMessageAuthorFeedbackThreadDict(TypedDict):
    """Dict representation of FeedbackThread domain object with
    updated author_username and last_nonempty_message_author keys.
    """

    last_updated_msecs: float
    original_author_username: Optional[str]
    state_name: Optional[str]
    status: str
    subject: str
    summary: str
    thread_id: str
    message_count: int
    last_nonempty_message_text: Optional[str]
    last_nonempty_message_author: Optional[str]


class UpdatedAuthorUsernameFeedbackThreadDict(TypedDict):
    """Dict representation of FeedbackThread domain object with
    updated author_username key.
    """

    last_updated_msecs: float
    original_author_username: Optional[str]
    state_name: Optional[str]
    status: str
    subject: str
    summary: str
    thread_id: str
    message_count: int
    last_nonempty_message_text: Optional[str]
    last_nonempty_message_author_id: Optional[str]


class UpdatedFeedbackMessageDict(TypedDict):
    """Dict representation of FeedbackMessage object with updated
    author_username key.
    """

    author_username: Optional[str]
    created_on_msecs: float
    entity_type: str
    entity_id: str
    message_id: int
    text: str
    updated_status: str
    updated_subject: str


def update_original_and_last_message_author_id_in_feedback_thread_dicts(
    feedback_thread_dicts: List[feedback_domain.FeedbackThreadDict]
) -> List[UpdatedLastMessageAuthorFeedbackThreadDict]:
    """Replaces original author id and last message author id with there
    corresponding username in the given feedback thread dictionaries.

    Args:
        feedback_thread_dicts: list(dict). The list of feedback thread
            dictionaries that need to be updated.

    Returns:
        list(dict). The list of updated feedback thread dictionaries.
    """
    updated_feedback_thread_dicts = []
    for feedback_thread_dict in feedback_thread_dicts:
        last_nonempty_message_author_id = (
            feedback_thread_dict['last_nonempty_message_author_id']
        )
        updated_feedback_thread_dict: (
            UpdatedLastMessageAuthorFeedbackThreadDict
        ) = {
            'last_updated_msecs': feedback_thread_dict['last_updated_msecs'],
            'original_author_username': (
                user_services.get_username(
                    feedback_thread_dict['original_author_id']
                )
                if feedback_thread_dict['original_author_id'] else None
            ),
            'state_name': feedback_thread_dict['state_name'],
            'status': feedback_thread_dict['status'],
            'subject': feedback_thread_dict['subject'],
            'summary': feedback_thread_dict['summary'],
            'thread_id': feedback_thread_dict['thread_id'],
            'message_count': feedback_thread_dict['message_count'],
            'last_nonempty_message_text': (
                feedback_thread_dict['last_nonempty_message_text']
            ),
            'last_nonempty_message_author': (
                user_services.get_username(
                    last_nonempty_message_author_id
                ) if last_nonempty_message_author_id else None
            )
        }
        updated_feedback_thread_dicts.append(updated_feedback_thread_dict)
    return updated_feedback_thread_dicts


def update_original_author_id_in_feedback_thread_dicts(
    feedback_thread_dicts: List[feedback_domain.FeedbackThreadDict]
) -> List[UpdatedAuthorUsernameFeedbackThreadDict]:
    """Replaces original author id with the corresponding username in the
    given feedback thread dictionaries.

    Args:
        feedback_thread_dicts: list(dict). The list of feedback thread
            dictionaries that need to be updated.

    Returns:
        list(dict). The list of updated feedback thread dictionaries.
    """
    updated_feedback_thread_dicts = []
    for feedback_thread_dict in feedback_thread_dicts:
        updated_feedback_thread_dict: (
            UpdatedAuthorUsernameFeedbackThreadDict
        ) = {
            'last_updated_msecs': feedback_thread_dict['last_updated_msecs'],
            'original_author_username': (
                user_services.get_username(
                    feedback_thread_dict['original_author_id']
                )
                if feedback_thread_dict['original_author_id'] else None
            ),
            'state_name': feedback_thread_dict['state_name'],
            'status': feedback_thread_dict['status'],
            'subject': feedback_thread_dict['subject'],
            'summary': feedback_thread_dict['summary'],
            'thread_id': feedback_thread_dict['thread_id'],
            'message_count': feedback_thread_dict['message_count'],
            'last_nonempty_message_text': (
                feedback_thread_dict['last_nonempty_message_text']
            ),
            'last_nonempty_message_author_id': (
                feedback_thread_dict['last_nonempty_message_author_id']
            )
        }
        updated_feedback_thread_dicts.append(updated_feedback_thread_dict)
    return updated_feedback_thread_dicts


def update_author_id_in_message_dicts(
    message_dicts: List[feedback_domain.FeedbackMessageDict]
) -> List[UpdatedFeedbackMessageDict]:
    """Replaces author id with the corresponding username in the
    given message dictionaries.

    Args:
        message_dicts: list(dict). The list of message
            dictionaries that need to be updated.

    Returns:
        list(dict). The list of updated message dictionaries.
    """
    updated_message_dicts = []
    for message_dict in message_dicts:
        updated_message_dict: UpdatedFeedbackMessageDict = {
            'author_username': (
                user_services.get_username(
                    message_dict['author_id']
                )
                if message_dict['author_id'] else None
            ),
            'created_on_msecs': message_dict['created_on_msecs'],
            'entity_type': message_dict['entity_type'],
            'entity_id': message_dict['entity_id'],
            'message_id': message_dict['message_id'],
            'text': message_dict['text'],
            'updated_status': message_dict['updated_status'],
            'updated_subject': message_dict['updated_subject']
        }
        updated_message_dicts.append(updated_message_dict)
    return updated_message_dicts


class ThreadListHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ThreadListHandler's
    normalized_Payload dictionary.
    """

    subject: str
    text: str


class ThreadListHandler(
    base.BaseHandler[
        ThreadListHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
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
    def get(self, exploration_id: str) -> None:

        feedback_thread_dicts = [
            thread.to_dict() for thread in feedback_services.get_all_threads(
               feconf.ENTITY_TYPE_EXPLORATION, exploration_id, False
            )
        ]
        self.values.update({
            'feedback_thread_dicts': (
                update_original_and_last_message_author_id_in_feedback_thread_dicts(  # pylint: disable=line-too-long
                    feedback_thread_dicts
                )
            )
        })
        self.render_json(self.values)

    @acl_decorators.can_create_feedback_thread
    def post(self, exploration_id: str) -> None:
        assert self.normalized_payload is not None
        subject = self.normalized_payload['subject']
        text = self.normalized_payload['text']

        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, exploration_id, self.user_id,
            subject, text)
        self.render_json(self.values)


class ThreadListHandlerForTopicsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
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
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_edit_topic
    def get(self, topic_id: str) -> None:

        suggestion_thread_dicts = [
            thread.to_dict() for thread in feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_TOPIC, topic_id, True
            )
        ]
        self.values.update({
            'suggestion_thread_dicts': (
                update_original_author_id_in_feedback_thread_dicts(
                    suggestion_thread_dicts
                )
            )
        })
        self.render_json(self.values)


class ThreadHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of ThreadHandler's
    normalized_Payload dictionary.
    """

    updated_status: Optional[str]
    text: str
    updated_subject: Optional[str]


class ThreadHandler(
    base.BaseHandler[ThreadHandlerNormalizedPayloadDict, Dict[str, str]]
):
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
    def get(self, thread_id: str) -> None:
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
            'messages': update_author_id_in_message_dicts(
                message_dicts
            ),
            'suggestion': suggestion.to_dict() if suggestion else None
        })
        self.render_json(self.values)

    @acl_decorators.can_comment_on_feedback_thread
    def post(self, thread_id: str) -> None:
        assert self.user_id is not None
        assert self.normalized_payload is not None
        suggestion = suggestion_services.get_suggestion_by_id(
            thread_id, strict=False
        )
        text = self.normalized_payload['text']
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
            'messages': update_author_id_in_message_dicts(
                message_dict
            )
        })


class RecentFeedbackMessagesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of RecentFeedbackMessagesHandler's
    normalized_request dictionary.
    """

    cursor: Optional[str]


class RecentFeedbackMessagesHandler(
    base.BaseHandler[
        Dict[str, str], RecentFeedbackMessagesHandlerNormalizedRequestDict
    ]
):
    """Returns a list of recently-posted feedback messages.

    Note that this currently also includes messages posted in private
    explorations.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
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
    def get(self) -> None:
        assert self.normalized_request is not None
        urlsafe_start_cursor = self.normalized_request.get('cursor')

        all_feedback_messages, new_urlsafe_start_cursor, more = (
            feedback_services.get_next_page_of_all_feedback_messages(
                urlsafe_start_cursor=urlsafe_start_cursor))

        message_dict = [message.to_dict() for message in all_feedback_messages]

        self.render_json({
            'results': update_author_id_in_message_dicts(
                message_dict
            ),
            'cursor': new_urlsafe_start_cursor,
            'more': more,
        })


class FeedbackStatsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
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
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
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


class FeedbackThreadViewEventHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
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
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

    @acl_decorators.can_comment_on_feedback_thread
    def post(self, thread_id: str) -> None:
        exploration_id = feedback_services.get_exp_id_from_thread_id(thread_id)
        feedback_services.clear_feedback_message_references_transactional(
            self.user_id, exploration_id, thread_id)
        self.render_json(self.values)
