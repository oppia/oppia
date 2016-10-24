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

from google.appengine.datastore.datastore_query import Cursor

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


class EmailDashboardPage(base.BaseHandler):
    """Page to submit query and show past queries."""

    @require_valid_sender
    def get(self):
        """Handles GET requests."""
        self.render_template('pages/email_dashboard/email_dashboard.html')


class EmailDashboardDataHandler(base.BaseHandler):
    """Query data handler."""

    QUERIES_PER_PAGE = 10

    @require_valid_sender
    def get(self):
        cursor = Cursor(urlsafe=self.request.get('cursor'))

        query_models, next_cursor, more = (
            user_models.UserQueryModel.query().
            order(-user_models.UserQueryModel.created_on).
            fetch_page(self.QUERIES_PER_PAGE, start_cursor=cursor))

        submitters_settings = user_services.get_users_settings(
            [model.submitter_id for model in query_models])

        submitter_details = {
            submitter.user_id: submitter.username
            for submitter in submitters_settings
        }

        queries_list = [{
            'id': model.id,
            'submitter_id': submitter_details[model.submitter_id],
            'created_on': model.created_on.strftime('%d-%m-%y %H:%M:%S'),
            'status': model.query_status,
            'num_qualified_users': len(model.user_ids)
        } for model in query_models]

        data = {
            'recent_queries': queries_list
        }
        if more and next_cursor:
            data['cursor'] = next_cursor.urlsafe()

        self.render_json(data)

    @require_valid_sender
    def post(self):
        """Post handler for query."""
        data = self.payload['data']
        query_id = user_query_services.save_new_query_model(
            self.user_id, **data)

        # Start MR job in background.
        job_id = user_query_jobs_one_off.UserQueryOneOffJob.create_new()
        params = {'query_id': query_id}
        user_query_jobs_one_off.UserQueryOneOffJob.enqueue(
            job_id, additional_job_params=params)

        self.render_json({})
