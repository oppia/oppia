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

"""Controllers for the splash page and user dashboard."""

__author__ = 'sll@google.com (Sean Lip)'

from core.controllers import base
from core.domain import config_domain
from core.domain import exp_services
from core.domain import subscription_services
from core.domain import user_jobs
from core.domain import user_services
import feconf
import utils


SPLASH_PAGE_EXPLORATION_ID = config_domain.ConfigProperty(
    'splash_page_exploration_id', 'UnicodeString',
    ('The id for the exploration on the splash page '
     '(a blank value indicates that no exploration should be displayed)'),
    default_value='')
SPLASH_PAGE_EXPLORATION_VERSION = config_domain.ConfigProperty(
    'splash_page_exploration_version', 'UnicodeString',
    ('The version number for the exploration on the splash page '
     '(a blank value indicates that the latest version should be used)'),
    default_value='')


class DashboardPage(base.BaseHandler):
    """Page for the user's dashboard."""
    # We use 'gallery' because the createExploration() modal makes a call
    # there.
    PAGE_NAME_FOR_CSRF = 'gallery'

    @base.require_user
    def get(self):
        if self.username in config_domain.BANNED_USERNAMES.value:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        elif user_services.has_user_registered_as_editor(self.user_id):
            self.values.update({
                'nav_mode': feconf.NAV_MODE_HOME,
            })
            self.render_template(
                'dashboard/dashboard.html', redirect_url_on_logout='/')
        else:
            self.redirect(utils.set_url_query_parameter(
                feconf.SIGNUP_URL, 'return_url', '/dashboard'))


class DashboardHandler(base.BaseHandler):
    """Provides data for the user dashboard."""

    def get(self):
        """Handles GET requests."""
        if self.user_id is None:
            raise self.PageNotFoundException

        job_queued_msec, recent_updates = (
            user_jobs.DashboardRecentUpdatesAggregator.get_recent_updates(
                self.user_id))

        last_seen_msec = (
            subscription_services.get_last_seen_notifications_msec(
                self.user_id))

        # Replace author_ids with their usernames.
        author_ids = [
            update['author_id'] for update in recent_updates
            if update['author_id']]
        author_usernames = user_services.get_usernames(author_ids)

        author_id_to_username = {
            None: '',
        }
        for ind in range(len(author_ids)):
            author_id_to_username[author_ids[ind]] = author_usernames[ind]
        for update in recent_updates:
            update['author_username'] = (
                author_id_to_username[update['author_id']])
            del update['author_id']

        subscription_services.record_user_has_seen_notifications(
            self.user_id, job_queued_msec if job_queued_msec else 0.0)

        editable_exp_summaries = (
            exp_services.get_at_least_editable_exploration_summaries(
                self.user_id))

        self.values.update({
            'explorations': {
                exp_summary.id: {
                    'title': exp_summary.title,
                    'category': exp_summary.category,
                    'objective': exp_summary.objective,
                    'language_code': exp_summary.language_code,
                    'last_updated': utils.get_time_in_millisecs(
                        exp_summary.exploration_model_last_updated),
                    'status': exp_summary.status,
                    'community_owned': exp_summary.community_owned,
                    'is_editable': True,
                } for exp_summary in editable_exp_summaries.values()
            },
            # This may be None if no job has ever run for this user.
            'job_queued_msec': job_queued_msec,
            # This may be None if this is the first time the user has seen
            # the dashboard.
            'last_seen_msec': last_seen_msec,
            'recent_updates': recent_updates,
        })
        self.render_json(self.values)


class NotificationsHandler(base.BaseHandler):
    """Provides data about unseen notifications."""

    def get(self):
        """Handles GET requests."""
        num_unseen_notifications = 0
        if self.user_id and self.username:
            last_seen_msec = (
                subscription_services.get_last_seen_notifications_msec(
                    self.user_id))
            _, recent_updates = (
                user_jobs.DashboardRecentUpdatesAggregator.get_recent_updates(
                    self.user_id))
            for update in recent_updates:
                if (update['last_updated_ms'] > last_seen_msec and
                        update['author_id'] != self.user_id):
                    num_unseen_notifications += 1

        self.render_json({
            'num_unseen_notifications': num_unseen_notifications,
        })
