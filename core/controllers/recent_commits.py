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

"""Controllers for queries relating to recent commits."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_services
from core.domain import user_services

from typing import Dict, Optional, TypedDict


class RecentCommitsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of RecentCommitsHandler's
    normalized_request dictionary.
    """

    cursor: Optional[str]
    query_type: str


class RecentCommitsHandler(
    base.BaseHandler[
        Dict[str, str], RecentCommitsHandlerNormalizedRequestDict
    ]
):
    """Returns a list of recent commits."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'cursor': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'query_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        'all_non_private_commits'
                    ]
                }
            }
        }
    }

    @acl_decorators.can_access_moderator_page
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        assert self.normalized_request is not None
        urlsafe_start_cursor = self.normalized_request.get('cursor')

        all_commits, new_urlsafe_start_cursor, more = (
            exp_services.get_next_page_of_all_non_private_commits(
                urlsafe_start_cursor=urlsafe_start_cursor))

        exp_ids = set(commit.exploration_id for commit in all_commits)
        exp_ids_to_exp_data = (
            exp_services.get_exploration_titles_and_categories(list(exp_ids)))

        unique_user_ids = list(set(commit.user_id for commit in all_commits))
        unique_usernames = user_services.get_usernames(unique_user_ids)
        user_id_to_username = dict(zip(unique_user_ids, unique_usernames))
        all_commit_dicts = []
        for commit in all_commits:
            commit_dict = commit.to_dict()
            commit_dict_with_username = {
                'last_updated': commit_dict['last_updated'],
                'exploration_id': commit_dict['exploration_id'],
                'commit_type': commit_dict['commit_type'],
                'commit_message': commit_dict['commit_message'],
                'version': commit_dict['version'],
                'post_commit_status': commit_dict['post_commit_status'],
                'post_commit_community_owned': (
                    commit_dict['post_commit_community_owned']
                ),
                'post_commit_is_private': commit_dict['post_commit_is_private'],
                'username': user_id_to_username[commit.user_id]
            }
            all_commit_dicts.append(commit_dict_with_username)

        self.render_json({
            'results': all_commit_dicts,
            'cursor': new_urlsafe_start_cursor,
            'more': more,
            'exp_ids_to_exp_data': exp_ids_to_exp_data,
        })
