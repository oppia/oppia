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

"""Controllers for the user dashboard and for notifications."""

__author__ = 'sll@google.com (Sean Lip)'

from core.controllers import base
from core.domain import config_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import subscription_services
from core.domain import user_jobs
from core.domain import user_services
import feconf
import utils


class NotificationsDashboardPage(base.BaseHandler):
    """Page with notifications for the user."""

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
                'dashboard/notifications_dashboard.html',
                redirect_url_on_logout='/')
        else:
            self.redirect(utils.set_url_query_parameter(
                feconf.SIGNUP_URL, 'return_url', '/notifications_dashboard'))


class NotificationsDashboardHandler(base.BaseHandler):
    """Provides data for the user notifications dashboard."""

    # We use 'gallery' because the createExploration() modal makes a call
    # there.
    PAGE_NAME_FOR_CSRF = 'gallery'

    def get(self):
        """Handles GET requests."""
        if self.user_id is None:
            raise self.PageNotFoundException

        job_queued_msec, recent_notifications = (
            user_jobs.DashboardRecentUpdatesAggregator.get_recent_notifications(
                self.user_id))

        last_seen_msec = (
            subscription_services.get_last_seen_notifications_msec(
                self.user_id))

        # Replace author_ids with their usernames.
        author_ids = [
            notification['author_id'] for notification in recent_notifications
            if notification['author_id']]
        author_usernames = user_services.get_usernames(author_ids)

        author_id_to_username = {
            None: '',
        }
        for ind in range(len(author_ids)):
            author_id_to_username[author_ids[ind]] = author_usernames[ind]
        for notification in recent_notifications:
            notification['author_username'] = (
                author_id_to_username[notification['author_id']])
            del notification['author_id']

        subscription_services.record_user_has_seen_notifications(
            self.user_id, job_queued_msec if job_queued_msec else 0.0)

        self.values.update({
            # This may be None if no job has ever run for this user.
            'job_queued_msec': job_queued_msec,
            # This may be None if this is the first time the user has seen
            # the dashboard.
            'last_seen_msec': last_seen_msec,
            'recent_notifications': recent_notifications,
        })
        self.render_json(self.values)


class MyExplorationsPage(base.BaseHandler):
    """Page showing the user's explorations."""
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
                'dashboard/my_explorations.html', redirect_url_on_logout='/')
        else:
            self.redirect(utils.set_url_query_parameter(
                feconf.SIGNUP_URL, 'return_url', '/my_explorations'))


class MyExplorationsHandler(base.BaseHandler):
    """Provides data for the user's explorations page."""

    def get(self):
        """Handles GET requests."""
        if self.user_id is None:
            raise self.PageNotFoundException

        subscribed_summaries = (
            exp_services.get_exploration_summaries_matching_ids(
                subscription_services.get_exploration_ids_subscribed_to(
                    self.user_id)))

        def _get_intro_card_color(category):
            return (
                feconf.CATEGORIES_TO_COLORS[category] if
                category in feconf.CATEGORIES_TO_COLORS else
                feconf.DEFAULT_COLOR)

        explorations_list = []

        for exp_summary in subscribed_summaries:
            if exp_summary is None:
                continue

            feedback_thread_analytics = feedback_services.get_thread_analytics(
                exp_summary.id)
            explorations_list.append({
                'id': exp_summary.id,
                'title': exp_summary.title,
                'category': exp_summary.category,
                'objective': exp_summary.objective,
                'language_code': exp_summary.language_code,
                'last_updated': utils.get_time_in_millisecs(
                    exp_summary.exploration_model_last_updated),
                'created_on': utils.get_time_in_millisecs(
                    exp_summary.exploration_model_created_on),
                'status': exp_summary.status,
                'community_owned': exp_summary.community_owned,
                'is_editable': True,
                'thumbnail_image_url': (
                    '/images/gallery/exploration_background_%s_small.png' %
                    _get_intro_card_color(exp_summary.category)),
                'ratings': exp_summary.ratings,
                'num_open_threads': (
                    feedback_thread_analytics['num_open_threads']),
                'num_total_threads': (
                    feedback_thread_analytics['num_total_threads']),
            })

        explorations_list = sorted(
            explorations_list,
            key=lambda x: (x['num_open_threads'], x['last_updated']),
            reverse=True)

        self.values.update({
            'explorations_list': explorations_list,
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
            _, recent_notifications = (
                user_jobs.DashboardRecentUpdatesAggregator.get_recent_notifications(
                    self.user_id))
            for notification in recent_notifications:
                if (notification['last_updated_ms'] > last_seen_msec and
                        notification['author_id'] != self.user_id):
                    num_unseen_notifications += 1

        self.render_json({
            'num_unseen_notifications': num_unseen_notifications,
        })
