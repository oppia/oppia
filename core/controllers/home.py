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

"""Controllers for the creator dashboard, notifications, and creating new
activities.
"""

from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import subscription_services
from core.domain import user_jobs_continuous
from core.domain import user_services
import feconf
import utils

EXPLORATION_ID_KEY = 'explorationId'
COLLECTION_ID_KEY = 'collectionId'

ALLOW_YAML_FILE_UPLOAD = config_domain.ConfigProperty(
    'allow_yaml_file_upload', {'type': 'bool'},
    'Whether to allow exploration uploads via YAML.',
    default_value=False)


class NotificationsDashboardPage(base.BaseHandler):
    """Page with notifications for the user."""

    @base.require_user
    def get(self):
        if self.username in config_domain.BANNED_USERNAMES.value:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        elif user_services.has_fully_registered(self.user_id):
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

    PAGE_NAME_FOR_CSRF = 'dashboard'

    def get(self):
        """Handles GET requests."""
        if self.user_id is None:
            raise self.PageNotFoundException

        job_queued_msec, recent_notifications = (
            user_jobs_continuous.DashboardRecentUpdatesAggregator.get_recent_notifications(  # pylint: disable=line-too-long
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
        for ind, author_id in enumerate(author_ids):
            author_id_to_username[author_id] = author_usernames[ind]
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

    PAGE_NAME_FOR_CSRF = 'dashboard'

    @base.require_user
    def get(self):
        if self.username in config_domain.BANNED_USERNAMES.value:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        elif user_services.has_fully_registered(self.user_id):
            self.values.update({
                'nav_mode': feconf.NAV_MODE_HOME,
                'can_create_collections': (
                    self.username in
                    config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES.value
                ),
                'allow_yaml_file_upload': ALLOW_YAML_FILE_UPLOAD.value,
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
                'thumbnail_icon_url': (
                    utils.get_thumbnail_icon_url_for_category(
                        exp_summary.category)),
                'thumbnail_bg_color': utils.get_hex_color_for_category(
                    exp_summary.category),
                'ratings': exp_summary.ratings,
                'num_open_threads': (
                    feedback_thread_analytics.num_open_threads),
                'num_total_threads': (
                    feedback_thread_analytics.num_total_threads),
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
                user_jobs_continuous.DashboardRecentUpdatesAggregator.get_recent_notifications( # pylint: disable=line-too-long
                    self.user_id))
            for notification in recent_notifications:
                if (notification['last_updated_ms'] > last_seen_msec and
                        notification['author_id'] != self.user_id):
                    num_unseen_notifications += 1

        self.render_json({
            'num_unseen_notifications': num_unseen_notifications,
        })


class NewExploration(base.BaseHandler):
    """Creates a new exploration."""

    PAGE_NAME_FOR_CSRF = 'dashboard'

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')
        objective = self.payload.get('objective')
        language_code = self.payload.get('language_code')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')
        if not language_code:
            raise self.InvalidInputException('No language chosen.')

        new_exploration_id = exp_services.get_new_exploration_id()
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exploration_id, title, category,
            objective=objective, language_code=language_code)
        exp_services.save_new_exploration(self.user_id, exploration)

        self.render_json({
            EXPLORATION_ID_KEY: new_exploration_id
        })


class NewCollection(base.BaseHandler):
    """Creates a new collection."""

    PAGE_NAME_FOR_CSRF = 'dashboard'

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')
        objective = self.payload.get('objective')
        # TODO(bhenning): Implement support for language codes in collections.

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        new_collection_id = collection_services.get_new_collection_id()
        collection = collection_domain.Collection.create_default_collection(
            new_collection_id, title, category, objective=objective)
        collection_services.save_new_collection(self.user_id, collection)

        self.render_json({
            COLLECTION_ID_KEY: new_collection_id
        })


class UploadExploration(base.BaseHandler):
    """Uploads a new exploration."""

    PAGE_NAME_FOR_CSRF = 'dashboard'

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title')
        category = self.payload.get('category')
        yaml_content = self.request.get('yaml_file')

        if not title:
            raise self.InvalidInputException('No title supplied.')
        if not category:
            raise self.InvalidInputException('No category chosen.')

        new_exploration_id = exp_services.get_new_exploration_id()
        if ALLOW_YAML_FILE_UPLOAD.value:
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.user_id, yaml_content, title, category,
                new_exploration_id, [])
            self.render_json({
                EXPLORATION_ID_KEY: new_exploration_id
            })
        else:
            raise self.InvalidInputException(
                'This server does not allow file uploads.')
