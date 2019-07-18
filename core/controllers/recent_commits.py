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

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_services
import feconf


class RecentCommitsHandler(base.BaseHandler):
    """Returns a list of recent commits."""

    # TODO(sll): Accept additional URL parameters that filter by user_id and
    # exploration_id. For the former, do a check to ensure that the user is
    # allowed to see this data (as it may include private explorations).

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_moderator_page
    def get(self):
        """Handles GET requests."""
        urlsafe_start_cursor = self.request.get('cursor')
        query_type = self.request.get('query_type')

        if query_type == 'all_non_private_commits':
            all_commits, new_urlsafe_start_cursor, more = (
                exp_services.get_next_page_of_all_non_private_commits(
                    urlsafe_start_cursor=urlsafe_start_cursor))
        else:
            raise self.PageNotFoundException

        exp_ids = set([commit.exploration_id for commit in all_commits])
        exp_ids_to_exp_data = (
            exp_services.get_exploration_titles_and_categories(exp_ids))

        all_commit_dicts = [commit.to_dict() for commit in all_commits]
        self.render_json({
            'results': all_commit_dicts,
            'cursor': new_urlsafe_start_cursor,
            'more': more,
            'exp_ids_to_exp_data': exp_ids_to_exp_data,
        })
