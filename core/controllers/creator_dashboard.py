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

from __future__ import annotations

import logging

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import role_services
from core.domain import subscription_services
from core.domain import suggestion_services
from core.domain import summary_services
from core.domain import topic_fetchers
from core.domain import user_services

EXPLORATION_ID_KEY = 'exploration_id'
COLLECTION_ID_KEY = 'collection_id'


class OldContributorDashboardRedirectPage(base.BaseHandler):
    """Redirects the old contributor dashboard URL to the new one."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect('/contributor-dashboard', permanent=True)


class OldCreatorDashboardRedirectPage(base.BaseHandler):
    """Redirects the old creator dashboard URL to the new one."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        self.redirect(feconf.CREATOR_DASHBOARD_URL, permanent=True)


class CreatorDashboardPage(base.BaseHandler):
    """Page showing the user's creator dashboard."""

    ADDITIONAL_DEPENDENCY_IDS = ['codemirror']
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_access_creator_dashboard
    def get(self):

        self.render_template('creator-dashboard-page.mainpage.html')


class CreatorDashboardHandler(base.BaseHandler):
    """Provides data for the user's creator dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'display_preference': {
                'schema': {
                    'type': 'basestring',
                    'choices': (
                        constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS
                        .values()
                    )
                }
            }
        }
    }

    @acl_decorators.can_access_creator_dashboard
    def get(self):
        """Handles GET requests."""

        def _round_average_ratings(rating):
            """Returns the rounded average rating to display on the creator
            dashboard.

            Args:
                rating: float. The rating of the lesson.

            Returns:
                float. The rounded average value of rating.
            """
            return round(
                rating, feconf.AVERAGE_RATINGS_DASHBOARD_PRECISION)

        subscribed_exploration_summaries = (
            exp_fetchers.get_exploration_summaries_subscribed_to(
                self.user_id))
        subscribed_collection_summaries = (
            collection_services.get_collection_summaries_subscribed_to(
                self.user_id))

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

        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_summary_dicts = [
            summary.to_dict() for summary in topic_summaries]

        if role_services.ACTION_CREATE_COLLECTION in self.user.actions:
            for collection_summary in subscribed_collection_summaries:
                # TODO(sll): Reuse _get_displayable_collection_summary_dicts()
                # in summary_services, instead of replicating it like this.
                collection_summary_dicts.append({
                    'id': collection_summary.id,
                    'title': collection_summary.title,
                    'category': collection_summary.category,
                    'objective': collection_summary.objective,
                    'language_code': collection_summary.language_code,
                    'last_updated_msec': utils.get_time_in_millisecs(
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

        dashboard_stats = user_services.get_dashboard_stats(self.user_id)
        dashboard_stats.update({
            'total_open_feedback': feedback_services.get_total_open_threads(
                feedback_thread_analytics)
        })
        if dashboard_stats and dashboard_stats.get('average_ratings'):
            dashboard_stats['average_ratings'] = (
                _round_average_ratings(dashboard_stats['average_ratings']))

        last_week_stats = (
            user_services.get_last_week_dashboard_stats(self.user_id))

        if last_week_stats and len(list(last_week_stats.keys())) != 1:
            logging.error(
                '\'last_week_stats\' should contain only one key-value pair'
                ' denoting last week dashboard stats of the user keyed by a'
                ' datetime string.')
            last_week_stats = None

        if last_week_stats:
            # 'last_week_stats' is a dict with only one key-value pair denoting
            # last week dashboard stats of the user keyed by a datetime string.
            datetime_of_stats = list(last_week_stats.keys())[0]
            last_week_stats_average_ratings = (
                list(last_week_stats.values())[0].get('average_ratings'))
            if last_week_stats_average_ratings:
                last_week_stats[datetime_of_stats]['average_ratings'] = (
                    _round_average_ratings(last_week_stats_average_ratings))

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

        user_settings = user_services.get_user_settings(
            self.user_id, strict=False)
        creator_dashboard_display_pref = (
            user_settings.creator_dashboard_display_pref)

        suggestions_created_by_user = suggestion_services.query_suggestions(
            [('author_id', self.user_id),
             (
                 'suggestion_type',
                 feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT)])
        suggestions_which_can_be_reviewed = (
            suggestion_services
            .get_all_suggestions_that_can_be_reviewed_by_user(self.user_id))

        for s in suggestions_created_by_user:
            s.populate_old_value_of_change()

        for s in suggestions_which_can_be_reviewed:
            s.populate_old_value_of_change()

        suggestion_dicts_created_by_user = (
            [s.to_dict() for s in suggestions_created_by_user])
        suggestion_dicts_which_can_be_reviewed = (
            [s.to_dict() for s in suggestions_which_can_be_reviewed])

        ids_of_suggestions_created_by_user = (
            [s['suggestion_id'] for s in suggestion_dicts_created_by_user])
        ids_of_suggestions_which_can_be_reviewed = (
            [s['suggestion_id']
             for s in suggestion_dicts_which_can_be_reviewed])

        threads_linked_to_suggestions_by_user = (
            [t.to_dict() for t in feedback_services.get_multiple_threads(
                ids_of_suggestions_created_by_user)])
        threads_linked_to_suggestions_which_can_be_reviewed = (
            [t.to_dict() for t in feedback_services.get_multiple_threads(
                ids_of_suggestions_which_can_be_reviewed)])

        self.values.update({
            'explorations_list': exp_summary_dicts,
            'collections_list': collection_summary_dicts,
            'dashboard_stats': dashboard_stats,
            'last_week_stats': last_week_stats,
            'subscribers_list': subscribers_list,
            'display_preference': creator_dashboard_display_pref,
            'threads_for_created_suggestions_list': (
                threads_linked_to_suggestions_by_user),
            'threads_for_suggestions_to_review_list': (
                threads_linked_to_suggestions_which_can_be_reviewed),
            'created_suggestions_list': suggestion_dicts_created_by_user,
            'suggestions_to_review_list': (
                suggestion_dicts_which_can_be_reviewed),
            'topic_summary_dicts': topic_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_access_creator_dashboard
    def post(self):
        creator_dashboard_display_pref = (
            self.normalized_payload.get('display_preference'))
        user_services.update_user_creator_dashboard_display(
            self.user_id, creator_dashboard_display_pref)
        self.render_json({})


class NewExplorationHandler(base.BaseHandler):
    """Creates a new exploration."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'title': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': feconf.DEFAULT_EXPLORATION_TITLE
            }
        }
    }

    @acl_decorators.can_create_exploration
    def post(self):
        """Handles POST requests."""
        title = self.normalized_payload.get('title')

        new_exploration_id = exp_fetchers.get_new_exploration_id()
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exploration_id, title=title)
        exp_services.save_new_exploration(self.user_id, exploration)

        self.render_json({
            EXPLORATION_ID_KEY: new_exploration_id
        })


class NewCollectionHandler(base.BaseHandler):
    """Creates a new collection."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {}
    }

    @acl_decorators.can_create_collection
    def post(self):
        """Handles POST requests."""
        new_collection_id = collection_services.get_new_collection_id()
        collection = collection_domain.Collection.create_default_collection(
            new_collection_id)
        collection_services.save_new_collection(self.user_id, collection)

        self.render_json({
            COLLECTION_ID_KEY: new_collection_id
        })


class UploadExplorationHandler(base.BaseHandler):
    """Uploads a new exploration."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'yaml_file': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_upload_exploration
    def post(self):
        """Handles POST requests."""
        yaml_content = self.normalized_request.get('yaml_file')

        new_exploration_id = exp_fetchers.get_new_exploration_id()
        if constants.ALLOW_YAML_FILE_UPLOAD:
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.user_id, yaml_content, new_exploration_id, [],
                strip_voiceovers=True)
            self.render_json({
                EXPLORATION_ID_KEY: new_exploration_id
            })
        else:
            raise self.InvalidInputException(
                'This server does not allow file uploads.')
