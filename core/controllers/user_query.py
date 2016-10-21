# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Controller for user query related pages and handlers."""

from core.controllers import base
from core.domain import config_domain
from core.domain import user_query_services
from core.domain import user_query_jobs_one_off
from core.domain import user_services
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])

current_user_services = models.Registry.import_current_user_services()

def require_valid_sender(handler):
    """Decorator that checks if the current user is a authorized sender."""
    def test_user(self, **kwargs):
        """Checks if the user is logged in and is authorized sender."""
        if not self.user_id:
            self.redirect(
                current_user_services.create_login_url(self.request.uri))
            return
        if self.username not in config_domain.WHITELISTED_EMAIL_SENDERS.value:
            raise self.UnauthorizedUserException(
                '%s is not a authorized user of this application', self.user_id)
        return handler(self, **kwargs)

    return test_user


class QueryPage(base.BaseHandler):
    """Page to submit query and show past queries."""

    @require_valid_sender
    def get(self):
        """Handles GET requests."""
        self.render_template('pages/query/query.html')


class QueryDataHandler(base.BaseHandler):
    """Query data handler."""

    @require_valid_sender
    def get(self):
        offset = (
            int(self.request.get('offset')) if self.request.get('offset') != ''
            else 0)
        base_offset = (
            int(self.request.get('base_offset'))
            if self.request.get('base_offset') != '' else 0)

        query_models = (
            user_models.UserQueryModel.query().
            order(-user_models.UserQueryModel.created_on).
            fetch(base_offset, offset=offset))
        queries_list = []

        for model in query_models:
            query = {}
            query['id'] = model.id
            query['submitter_id'] = user_services.get_username(
                model.submitter_id)
            query['created_on'] = model.created_on.strftime("%d-%m-%y %H:%M:%S")
            query['status'] = model.query_status
            query['qualified_users'] = len(model.user_ids)
            queries_list.append(query)

        self.render_json({
            'recent_queries': queries_list
        })

    @require_valid_sender
    def post(self):
        """Post handler for query."""
        data = self.payload['data']
        kwargs = {}
        if 'inactive_in_last_n_days' in data:
            if data['inactive_in_last_n_days'] != '':
                kwargs['inactive_in_last_n_days'] = (
                    int(data['inactive_in_last_n_days']))
        if 'has_not_logged_in_for_n_days' in data:
            if data['has_not_logged_in_for_n_days'] != '':
                kwargs['has_not_logged_in_for_n_days'] = (
                    int(data['has_not_logged_in_for_n_days']))
        if 'created_at_least_n_exps' in data:
            if data['created_at_least_n_exps'] != '':
                kwargs['created_at_least_n_exps'] = (
                    int(data['created_at_least_n_exps']))
        if 'created_fewer_than_n_exps' in data:
            if data['created_fewer_than_n_exps'] != '':
                kwargs['created_fewer_than_n_exps'] = (
                    int(data['created_fewer_than_n_exps']))
        if 'edited_at_least_n_exps' in data:
            if data['edited_at_least_n_exps'] != '':
                kwargs['edited_at_least_n_exps'] = (
                    int(data['edited_at_least_n_exps']))
        if 'edited_fewer_than_n_exps'in data:
            if data['edited_fewer_than_n_exps'] != '':
                kwargs['edited_fewer_than_n_exps'] = (
                    int(data['edited_fewer_than_n_exps']))

        query_id = user_query_services.save_new_query_model(
            self.user_id, **kwargs)

        # Start MR job in background.
        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        params = {'query_id': query_id}
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params=params)

        self.render_json({})
