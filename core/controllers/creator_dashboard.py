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

from constants import constants
from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import subscription_services
from core.domain import summary_services
from core.domain import user_jobs_continuous
from core.domain import user_services
import feconf
import utils

EXPLORATION_ID_KEY = 'explorationId'
COLLECTION_ID_KEY = 'collectionId'

DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD = config_domain.ConfigProperty(
    'default_twitter_share_message_dashboard', {
        'type': 'unicode',
    },
    'Default text for the Twitter share message for the dashboard',
    default_value=(
        'Check out this interactive lesson I created on Oppia - a free '
        'platform for teaching and learning!'))


class NotificationsDashboardPage(base.BaseHandler):
    """Page with notifications for the user."""

    @base.require_user
    def get(self):
        if self.username in config_domain.BANNED_USERNAMES.value:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        elif user_services.has_fully_registered(self.user_id):
            self.values.update({
                'meta_description': feconf.CREATOR_DASHBOARD_PAGE_DESCRIPTION,
                'nav_mode': feconf.NAV_MODE_CREATOR_DASHBOARD,
            })
            self.render_template(
                'pages/notifications_dashboard/notifications_dashboard.html',
                redirect_url_on_logout='/')
        else:
            self.redirect(utils.set_url_query_parameter(
                feconf.SIGNUP_URL, 'return_url', '/notifications_dashboard'))


class NotificationsDashboardHandler(base.BaseHandler):
    """Provides data for the user notifications dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

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


class CreatorDashboardPage(base.BaseHandler):
    """Page showing the user's creator dashboard."""

    @base.require_user
    def get(self):
        if self.username in config_domain.BANNED_USERNAMES.value:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        elif user_services.has_fully_registered(self.user_id):
            self.values.update({
                'nav_mode': feconf.NAV_MODE_CREATOR_DASHBOARD,
                'allow_yaml_file_upload': feconf.ALLOW_YAML_FILE_UPLOAD,
                'DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD': (
                    DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD.value)
            })
            self.render_template(
                'pages/creator_dashboard/creator_dashboard.html',
                redirect_url_on_logout='/')
        else:
            self.redirect(utils.set_url_query_parameter(
                feconf.SIGNUP_URL, 'return_url', feconf.CREATOR_DASHBOARD_URL))


class CreatorDashboardHandler(base.BaseHandler):
    """Provides data for the user's creator dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def get(self):
        """Handles GET requests."""
        if self.user_id is None:
            raise self.PageNotFoundException

        def _get_intro_card_color(category):
            return (
                constants.CATEGORIES_TO_COLORS[category] if
                category in constants.CATEGORIES_TO_COLORS else
                constants.DEFAULT_COLOR)

        def _round_average_ratings(rating):
            return round(rating, feconf.AVERAGE_RATINGS_DASHBOARD_PRECISION)

        # We need to do the filtering because some activities that were
        # originally subscribed to may have been deleted since.
        subscribed_exploration_summaries = [
            summary for summary in
            exp_services.get_exploration_summaries_matching_ids(
                subscription_services.get_exploration_ids_subscribed_to(
                    self.user_id))
            if summary is not None]
        subscribed_collection_summaries = [
            summary for summary in
            collection_services.get_collection_summaries_matching_ids(
                subscription_services.get_collection_ids_subscribed_to(
                    self.user_id))
            if summary is not None]

        exploration_ids_subscribed_to = [
            summary.id for summary in subscribed_exploration_summaries]

        exp_summary_dicts = summary_services.get_displayable_exp_summary_dicts(
            subscribed_exploration_summaries)
        collection_summary_dicts = []

        feedback_thread_analytics = (
            feedback_services.get_thread_analytics_multi(
                exploration_ids_subscribed_to))

        # TODO(bhenning): Update this to use unresolved answers from
        # stats_services once the training interface is enabled and it's cheaper
        # to retrieve top answers from stats_services.
        for ind, exploration in enumerate(exp_summary_dicts):
            exploration.update(feedback_thread_analytics[ind].to_dict())

        exp_summary_dicts = sorted(
            exp_summary_dicts,
            key=lambda x: (x['num_open_threads'], x['last_updated_msec']),
            reverse=True)

        if (self.username in
                config_domain.WHITELISTED_COLLECTION_EDITOR_USERNAMES.value):
            for collection_summary in subscribed_collection_summaries:
                # TODO(sll): Reuse _get_displayable_collection_summary_dicts()
                # in summary_services, instead of replicating it like this.
                collection_summary_dicts.append({
                    'id': collection_summary.id,
                    'title': collection_summary.title,
                    'category': collection_summary.category,
                    'objective': collection_summary.objective,
                    'language_code': collection_summary.language_code,
                    'last_updated': utils.get_time_in_millisecs(
                        collection_summary.collection_model_last_updated),
                    'created_on': utils.get_time_in_millisecs(
                        collection_summary.collection_model_created_on),
                    'status': collection_summary.status,
                    'node_count': collection_summary.node_count,
                    'community_owned': collection_summary.community_owned,
                    'thumbnail_icon_url': (
                        utils.get_thumbnail_icon_url_for_category(
                            collection_summary.category)),
                    'thumbnail_bg_color': utils.get_hex_color_for_category(
                        collection_summary.category),
                })

        dashboard_stats = (
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.user_id))
        dashboard_stats.update({
            'total_open_feedback': feedback_services.get_total_open_threads(
                feedback_thread_analytics)
        })
        if dashboard_stats and dashboard_stats.get('average_ratings'):
            dashboard_stats['average_ratings'] = (
                _round_average_ratings(dashboard_stats['average_ratings']))

        last_week_stats = (
            user_services.get_last_week_dashboard_stats(self.user_id))
        if last_week_stats and last_week_stats.get('average_ratings'):
            last_week_stats['average_ratings'] = (
                _round_average_ratings(last_week_stats['average_ratings']))

        subscriber_ids = subscription_services.get_all_subscribers_of_creator(
            self.user_id)
        subscribers_settings = user_services.get_users_settings(subscriber_ids)
        subscribers_list = []
        for index, subscriber_settings in enumerate(subscribers_settings):
            subscriber_summary = {
                'subscriber_picture_data_url': (
                    subscriber_settings.profile_picture_data_url),
                'subscriber_username': subscriber_settings.username,
                'subscriber_impact': (
                    user_services.get_user_impact_score(subscriber_ids[index]))
            }

            subscribers_list.append(subscriber_summary)

        self.values.update({
            'explorations_list': exp_summary_dicts,
            'collections_list': collection_summary_dicts,
            'dashboard_stats': dashboard_stats,
            'last_week_stats': last_week_stats,
            'subscribers_list': subscribers_list
        })
        self.render_json(self.values)


class NotificationsHandler(base.BaseHandler):
    """Provides data about unseen notifications."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

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


class ExplorationDashboardStatsHandler(base.BaseHandler):
    """Returns the most recent open feedback for an exploration."""

    @base.require_fully_signed_up
    def get(self, exploration_id):
        """Handles GET requests."""
        self.render_json({
            'open_feedback': [
                feedback_message.to_dict()
                for feedback_message in
                feedback_services.get_most_recent_messages(exploration_id)]
        })


class NewExploration(base.BaseHandler):
    """Creates a new exploration."""

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        title = self.payload.get('title', feconf.DEFAULT_EXPLORATION_TITLE)

        new_exploration_id = exp_services.get_new_exploration_id()
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exploration_id, title=title)
        exp_services.save_new_exploration(self.user_id, exploration)

        self.render_json({
            EXPLORATION_ID_KEY: new_exploration_id
        })


class NewCollection(base.BaseHandler):
    """Creates a new collection."""

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        new_collection_id = collection_services.get_new_collection_id()
        collection = collection_domain.Collection.create_default_collection(
            new_collection_id)
        collection_services.save_new_collection(self.user_id, collection)

        self.render_json({
            COLLECTION_ID_KEY: new_collection_id
        })


class UploadExploration(base.BaseHandler):
    """Uploads a new exploration."""

    @base.require_fully_signed_up
    def post(self):
        """Handles POST requests."""
        yaml_content = self.request.get('yaml_file')

        new_exploration_id = exp_services.get_new_exploration_id()
        if feconf.ALLOW_YAML_FILE_UPLOAD:
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.user_id, yaml_content, new_exploration_id, [])
            self.render_json({
                EXPLORATION_ID_KEY: new_exploration_id
            })
        else:
            raise self.InvalidInputException(
                'This server does not allow file uploads.')


class CreatorDashboardRedirectPage(base.BaseHandler):
    """An page that redirects to the main Dashboard page."""

    def get(self):
        """Handles GET requests."""
        self.redirect(feconf.CREATOR_DASHBOARD_URL)
