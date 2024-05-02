# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the feedback_updates."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_fetchers
from core.domain import feedback_services
from core.domain import subscription_services
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import user_services

from typing import Dict, List, Optional, TypedDict, Union


class MessageSummaryDict(TypedDict):
    """Dict representation of author's messages summary."""

    message_id: int
    text: str
    updated_status: str
    author_username: Optional[str]
    created_on_msecs: float


class SuggestionSummaryDict(TypedDict):
    """Dict representation of suggestion's summary."""

    suggestion_html: str
    current_content_html: str
    description: str
    author_username: Optional[str]
    created_on_msecs: float


class FeedbackUpdatesHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of FeedbackUpdatesHandler's
    normalized_payload dictionary.
    """

    paginated_threads_list: List[List[str]]


class FeedbackUpdatesHandler(
    base.BaseHandler[
        FeedbackUpdatesHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """Provides data for the user's feedback updates page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'paginated_threads_list': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'list',
                        'items': {
                            'type': 'basestring'
                        },
                    },
                },
                'default_value': []
            }
        }
    }

    @acl_decorators.can_access_feedback_updates
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        if not self.normalized_payload['paginated_threads_list']:
            full_thread_ids = (
                subscription_services.get_all_threads_subscribed_to(
                    self.user_id
                )
            )
            paginated_threads_list = [
                full_thread_ids[index: index + 100]
                for index in range(0, len(full_thread_ids), 100)]
        else:
            paginated_threads_list = self.normalized_payload[
                'paginated_threads_list'
            ]
        if paginated_threads_list and paginated_threads_list[0]:
            thread_summaries, number_of_unread_threads = (
                feedback_services.get_exp_thread_summaries(
                    self.user_id, paginated_threads_list[0]))
        else:
            thread_summaries, number_of_unread_threads = [], 0

        self.values.update({
            'thread_summaries': [s.to_dict() for s in thread_summaries],
            'number_of_unread_threads': number_of_unread_threads,
            'paginated_threads_list': paginated_threads_list[1:]
        })
        self.render_json(self.values)


class FeedbackThreadHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Gets all the messages in a thread."""

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
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_feedback_updates
    def get(self, thread_id: str) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        messages = feedback_services.get_messages(thread_id)
        author_ids = [m.author_id for m in messages]
        authors_settings = list(user_services.get_users_settings(author_ids))

        message_ids = [m.message_id for m in messages]
        feedback_services.update_messages_read_by_the_user(
            self.user_id, thread_id, message_ids)

        message_summary_list: List[
            Union[MessageSummaryDict, SuggestionSummaryDict]
        ] = []
        suggestion = suggestion_services.get_suggestion_by_id(
            thread_id, strict=False
        )
        suggestion_thread = feedback_services.get_thread(thread_id)

        exploration_id = feedback_services.get_exp_id_from_thread_id(thread_id)
        if suggestion:
            suggestion_author_setting = user_services.get_user_settings(
                author_ids[0], strict=True
            )
            if not isinstance(
                suggestion,
                suggestion_registry.SuggestionEditStateContent
            ):
                raise Exception(
                    'No edit state content suggestion found for the given '
                    'thread_id: %s' % thread_id
                )
            exploration = exp_fetchers.get_exploration_by_id(exploration_id)
            current_content_html = (
                exploration.states[
                    suggestion.change_cmd.state_name
                ].content.html
            )
            suggestion_summary: SuggestionSummaryDict = {
                'suggestion_html': suggestion.change_cmd.new_value['html'],
                'current_content_html': current_content_html,
                'description': suggestion_thread.subject,
                'author_username': suggestion_author_setting.username,
                'created_on_msecs': utils.get_time_in_millisecs(
                    messages[0].created_on)
            }
            message_summary_list.append(suggestion_summary)
            messages.pop(0)
            authors_settings.pop(0)

        for m, author_settings in zip(messages, authors_settings):

            if author_settings is None:
                author_username = None
            else:
                author_username = author_settings.username

            message_summary: MessageSummaryDict = {
                'message_id': m.message_id,
                'text': m.text,
                'updated_status': m.updated_status,
                'author_username': author_username,
                'created_on_msecs': utils.get_time_in_millisecs(m.created_on)
            }
            message_summary_list.append(message_summary)

        self.render_json({
            'message_summary_list': message_summary_list
        })
