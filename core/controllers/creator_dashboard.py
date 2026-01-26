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

import io
import logging

from core import feconf, utils
from core.constants import constants
from core.controllers import acl_decorators, base
from core.domain import (
    collection_domain,
    collection_services,
    exp_domain,
    exp_fetchers,
    exp_services,
    feedback_services,
    role_services,
    stats_services,
    subscription_services,
    suggestion_services,
    summary_services,
    topic_fetchers,
    user_services,
)

from typing import Dict, Final, List, TypedDict

EXPLORATION_ID_KEY: Final = 'exploration_id'
COLLECTION_ID_KEY: Final = 'collection_id'


class DisplayableExplorationSummaryDict(TypedDict):
    """Type for the displayable exploration summary dictionary."""

    id: str
    title: str
    activity_type: str
    category: str
    created_on_msec: float
    objective: str
    language_code: str
    last_updated_msec: float
    human_readable_contributors_summary: Dict[str, Dict[str, int]]
    status: str
    ratings: Dict[str, int]
    community_owned: bool
    tags: List[str]
    thumbnail_icon_url: str
    thumbnail_bg_color: str
    num_views: int
    num_open_threads: int
    num_total_threads: int


class OldContributorDashboardRedirectPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Redirects the old contributor dashboard URL to the new one."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect('/contributor-dashboard', permanent=True)


class OldCreatorDashboardRedirectPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Redirects the old creator dashboard URL to the new one."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect(feconf.CREATOR_DASHBOARD_URL, permanent=True)


class CreatorDashboardHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of CreatorDashboardHandler's normalized_payload
    dictionary.
    """

    display_preference: str


class CreatorDashboardHandler(
    base.BaseHandler[
        CreatorDashboardHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Provides data for the user's creator dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'display_preference': {
                'schema': {
                    'type': 'basestring',
                    'choices': (
                        constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.values()
                    ),
                }
            }
        },
    }

    @acl_decorators.can_access_creator_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None

        def _round_average_ratings(rating: float) -> float:
            """Returns the rounded average rating to display on the creator
            dashboard.

            Args:
                rating: float. The rating of the lesson.

            Returns:
                float. The rounded average value of rating.
            """
            return round(rating, feconf.AVERAGE_RATINGS_DASHBOARD_PRECISION)

        subscribed_exploration_summaries = (
            exp_fetchers.get_exploration_summaries_subscribed_to(self.user_id)
        )
        subscribed_collection_summaries = (
            collection_services.get_collection_summaries_subscribed_to(
                self.user_id
            )
        )

        exploration_ids_subscribed_to = [
            summary.id for summary in subscribed_exploration_summaries
        ]

        exp_summary_dicts = summary_services.get_displayable_exp_summary_dicts(
            subscribed_exploration_summaries
        )
        collection_summary_dicts = []

        feedback_thread_analytics = (
            feedback_services.get_thread_analytics_multi(
                exploration_ids_subscribed_to
            )
        )

        displayable_exploration_summary_dicts: List[
            DisplayableExplorationSummaryDict
        ] = []
        for ind, exploration in enumerate(exp_summary_dicts):
            feedback_analytics_dict = feedback_thread_analytics[ind].to_dict()
            displayable_exploration_summary_dicts.append(
                {
                    'id': exploration['id'],
                    'title': exploration['title'],
                    'activity_type': exploration['activity_type'],
                    'category': exploration['category'],
                    'created_on_msec': exploration['created_on_msec'],
                    'objective': exploration['objective'],
                    'language_code': exploration['language_code'],
                    'last_updated_msec': exploration['last_updated_msec'],
                    'human_readable_contributors_summary': (
                        exploration['human_readable_contributors_summary']
                    ),
                    'status': exploration['status'],
                    'ratings': exploration['ratings'],
                    'community_owned': exploration['community_owned'],
                    'tags': exploration['tags'],
                    'thumbnail_icon_url': exploration['thumbnail_icon_url'],
                    'thumbnail_bg_color': exploration['thumbnail_bg_color'],
                    'num_views': exploration['num_views'],
                    'num_open_threads': feedback_analytics_dict[
                        'num_open_threads'
                    ],
                    'num_total_threads': (
                        feedback_analytics_dict['num_total_threads']
                    ),
                }
            )

        displayable_exploration_summary_dicts = sorted(
            displayable_exploration_summary_dicts,
            key=lambda x: (x['num_open_threads'], x['last_updated_msec']),
            reverse=True,
        )

        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_summary_dicts = [summary.to_dict() for summary in topic_summaries]

        if role_services.ACTION_CREATE_COLLECTION in self.user.actions:
            for collection_summary in subscribed_collection_summaries:
                # TODO(sll): Reuse _get_displayable_collection_summary_dicts()
                # in summary_services, instead of replicating it like this.
                collection_summary_dicts.append(
                    {
                        'id': collection_summary.id,
                        'title': collection_summary.title,
                        'category': collection_summary.category,
                        'objective': collection_summary.objective,
                        'language_code': collection_summary.language_code,
                        'last_updated_msec': utils.get_time_in_millisecs(
                            collection_summary.collection_model_last_updated
                        ),
                        'created_on': utils.get_time_in_millisecs(
                            collection_summary.collection_model_created_on
                        ),
                        'status': collection_summary.status,
                        'node_count': collection_summary.node_count,
                        'community_owned': collection_summary.community_owned,
                        'thumbnail_icon_url': (
                            utils.get_thumbnail_icon_url_for_category(
                                collection_summary.category
                            )
                        ),
                        'thumbnail_bg_color': utils.get_hex_color_for_category(
                            collection_summary.category
                        ),
                    }
                )

        dashboard_stats = user_services.get_dashboard_stats(self.user_id)
        dashboard_stats_dict = {
            'num_ratings': dashboard_stats['num_ratings'],
            'average_ratings': dashboard_stats['average_ratings'],
            'total_plays': dashboard_stats['total_plays'],
            'total_open_feedback': feedback_services.get_total_open_threads(
                feedback_thread_analytics
            ),
        }
        if dashboard_stats:
            average_ratings = dashboard_stats_dict.get('average_ratings')
            if average_ratings:
                dashboard_stats_dict['average_ratings'] = (
                    _round_average_ratings(average_ratings)
                )

        last_week_stats = user_services.get_last_week_dashboard_stats(
            self.user_id
        )

        if last_week_stats and len(list(last_week_stats.keys())) != 1:
            logging.error(
                '\'last_week_stats\' should contain only one key-value pair'
                ' denoting last week dashboard stats of the user keyed by a'
                ' datetime string.'
            )
            last_week_stats = None

        if last_week_stats:
            # 'last_week_stats' is a dict with only one key-value pair denoting
            # last week dashboard stats of the user keyed by a datetime string.
            datetime_of_stats = list(last_week_stats.keys())[0]
            last_week_stats_average_ratings = list(last_week_stats.values())[
                0
            ].get('average_ratings')
            if last_week_stats_average_ratings:
                last_week_stats[datetime_of_stats]['average_ratings'] = (
                    _round_average_ratings(last_week_stats_average_ratings)
                )

        subscriber_ids = subscription_services.get_all_subscribers_of_creator(
            self.user_id
        )
        subscribers_settings = user_services.get_users_settings(
            subscriber_ids, strict=True
        )
        subscribers_list = []
        for index, subscriber_settings in enumerate(subscribers_settings):
            subscriber_summary = {
                'subscriber_username': subscriber_settings.username,
                'subscriber_impact': (
                    user_services.get_user_impact_score(subscriber_ids[index])
                ),
            }

            subscribers_list.append(subscriber_summary)

        user_settings = user_services.get_user_settings(
            self.user_id, strict=True
        )
        creator_dashboard_display_pref = (
            user_settings.creator_dashboard_display_pref
        )

        suggestions_created_by_user = suggestion_services.query_suggestions(
            [
                ('author_id', self.user_id),
                ('suggestion_type', feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            ]
        )
        suggestions_which_can_be_reviewed = suggestion_services.get_all_suggestions_that_can_be_reviewed_by_user(
            self.user_id
        )

        for s in suggestions_created_by_user:
            s.populate_old_value_of_change()

        for s in suggestions_which_can_be_reviewed:
            s.populate_old_value_of_change()

        suggestion_dicts_created_by_user = [
            s.to_dict() for s in suggestions_created_by_user
        ]
        suggestion_dicts_which_can_be_reviewed = [
            s.to_dict() for s in suggestions_which_can_be_reviewed
        ]

        ids_of_suggestions_created_by_user = [
            s['suggestion_id'] for s in suggestion_dicts_created_by_user
        ]
        ids_of_suggestions_which_can_be_reviewed = [
            s['suggestion_id'] for s in suggestion_dicts_which_can_be_reviewed
        ]

        threads_linked_to_suggestions_by_user = [
            t.to_dict()
            for t in feedback_services.get_multiple_threads(
                ids_of_suggestions_created_by_user
            )
        ]
        threads_linked_to_suggestions_which_can_be_reviewed = [
            t.to_dict()
            for t in feedback_services.get_multiple_threads(
                ids_of_suggestions_which_can_be_reviewed
            )
        ]

        self.values.update(
            {
                'explorations_list': displayable_exploration_summary_dicts,
                'collections_list': collection_summary_dicts,
                'dashboard_stats': dashboard_stats_dict,
                'last_week_stats': last_week_stats,
                'subscribers_list': subscribers_list,
                'display_preference': creator_dashboard_display_pref,
                'threads_for_created_suggestions_list': (
                    threads_linked_to_suggestions_by_user
                ),
                'threads_for_suggestions_to_review_list': (
                    threads_linked_to_suggestions_which_can_be_reviewed
                ),
                'created_suggestions_list': suggestion_dicts_created_by_user,
                'suggestions_to_review_list': (
                    suggestion_dicts_which_can_be_reviewed
                ),
                'topic_summary_dicts': topic_summary_dicts,
            }
        )

        self.render_json(self.values)

    @acl_decorators.can_access_creator_dashboard
    def post(self) -> None:
        """Updates the creator dashboard display."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        creator_dashboard_display_pref = self.normalized_payload[
            'display_preference'
        ]
        user_settings = user_services.get_user_settings(self.user_id)
        user_settings.creator_dashboard_display_pref = (
            creator_dashboard_display_pref
        )
        user_services.save_user_settings(user_settings)
        self.render_json({})


class CreatorStatsReportHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides consolidated stats report JSON for the creator."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_creator_dashboard
    def get(self) -> None:
        assert self.user_id is not None

        def _round_avg(rating: float) -> float:
            return round(rating, feconf.AVERAGE_RATINGS_DASHBOARD_PRECISION)

        subscribed_exploration_summaries = (
            exp_fetchers.get_exploration_summaries_subscribed_to(self.user_id)
        )

        exploration_ids = [s.id for s in subscribed_exploration_summaries]
        exp_summary_dicts = summary_services.get_displayable_exp_summary_dicts(
            subscribed_exploration_summaries
        )
        feedback_thread_analytics = (
            feedback_services.get_thread_analytics_multi(exploration_ids)
        )

        dashboard_stats = user_services.get_dashboard_stats(self.user_id)
        summary = {
            'num_ratings': dashboard_stats['num_ratings'],
            'average_ratings': dashboard_stats['average_ratings'],
            'total_plays': dashboard_stats['total_plays'],
            'total_open_feedback': feedback_services.get_total_open_threads(
                feedback_thread_analytics
            ),
        }
        weekly_stats = user_services.get_weekly_dashboard_stats(self.user_id)
        weekly_series = []
        for item in weekly_stats:
            for dt, stats in item.items():
                weekly_series.append(
                    {
                        'date': dt,
                        'num_ratings': stats.get('num_ratings', 0),
                        'average_ratings': stats.get('average_ratings'),
                        'total_plays': stats.get('total_plays', 0),
                    }
                )
        summary['weekly_series'] = weekly_series
        avg_summary_val = summary.get('average_ratings')
        if isinstance(avg_summary_val, (int, float)):
            summary['average_ratings'] = _round_avg(float(avg_summary_val))

        subscriber_ids = subscription_services.get_all_subscribers_of_creator(
            self.user_id
        )
        summary['total_subscribers'] = len(subscriber_ids)

        total_starts = 0
        total_completions = 0
        for exp_id in exploration_ids:
            exp_obj = exp_fetchers.get_exploration_by_id(exp_id)
            exp_stats = stats_services.get_exploration_stats(
                exp_id, exp_obj.version
            )
            total_starts += exp_stats.num_starts
            total_completions += exp_stats.num_completions
        summary['creator_completion_rate'] = (
            round((total_completions / total_starts) * 100, 2)
            if total_starts > 0
            else None
        )

        explorations = []
        for ind, exploration in enumerate(exp_summary_dicts):
            feedback_analytics_dict = feedback_thread_analytics[ind].to_dict()
            avg_val = (
                exploration['ratings'].get('scaled_average_rating')
                if exploration.get('ratings')
                else None
            )
            avg_rounded = (
                _round_avg(float(avg_val))
                if isinstance(avg_val, (int, float))
                else None
            )
            exp_obj = exp_fetchers.get_exploration_by_id(exploration['id'])
            exp_stats = stats_services.get_exploration_stats(
                exploration['id'], exp_obj.version
            )
            exp_starts = exp_stats.num_starts
            exp_completions = exp_stats.num_completions
            exp_completion_rate = (
                round((exp_completions / exp_starts) * 100, 2)
                if exp_starts > 0
                else None
            )
            explorations.append(
                {
                    'id': exploration['id'],
                    'title': exploration['title'],
                    'num_open_threads': feedback_analytics_dict[
                        'num_open_threads'
                    ],
                    'average_rating': avg_rounded,
                    'plays': exploration['num_views'],
                    'num_starts': exp_starts,
                    'num_completions': exp_completions,
                    'completion_rate': exp_completion_rate,
                    'last_updated_msec': exploration['last_updated_msec'],
                }
            )

        self.render_json({'summary': summary, 'explorations': explorations})


class CreatorStatsCsvHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provides consolidated stats report CSV for the creator."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_creator_dashboard
    def get(self) -> None:
        assert self.user_id is not None

        subscribed_exploration_summaries = (
            exp_fetchers.get_exploration_summaries_subscribed_to(self.user_id)
        )

        exploration_ids = [s.id for s in subscribed_exploration_summaries]
        exp_summary_dicts = summary_services.get_displayable_exp_summary_dicts(
            subscribed_exploration_summaries
        )
        feedback_thread_analytics = (
            feedback_services.get_thread_analytics_multi(exploration_ids)
        )
        dashboard_stats = user_services.get_dashboard_stats(self.user_id)
        subscriber_ids = subscription_services.get_all_subscribers_of_creator(
            self.user_id
        )

        total_starts = 0
        total_completions = 0
        for exp_id in exploration_ids:
            exp_obj = exp_fetchers.get_exploration_by_id(exp_id)
            exp_stats = stats_services.get_exploration_stats(
                exp_id, exp_obj.version
            )
            total_starts += exp_stats.num_starts
            total_completions += exp_stats.num_completions
        completion_rate = (
            round((total_completions / total_starts) * 100, 2)
            if total_starts > 0
            else ''
        )

        lines = []
        header = [
            'Total Plays',
            'Average Ratings',
            'Total Open Feedback',
            'Total Subscribers',
            'Average Completion Rate (%)',
        ]
        lines.append(','.join(header))
        lines.append(
            ','.join(
                [
                    str(dashboard_stats['total_plays']),
                    str(dashboard_stats['average_ratings'] or ''),
                    str(
                        feedback_services.get_total_open_threads(
                            feedback_thread_analytics
                        )
                    ),
                    str(len(subscriber_ids)),
                    str(completion_rate),
                ]
            )
        )
        lines.append(
            'Exploration ID,Title,Open Threads,Average Rating,Plays,Starts,Completions,Completion Rate (%),Last Updated'
        )
        for ind, exp in enumerate(exp_summary_dicts):
            feedback_analytics_dict = feedback_thread_analytics[ind].to_dict()
            avg = exp['ratings'] and exp['ratings'].get('scaled_average_rating')
            avg_str = (
                str(round(avg, feconf.AVERAGE_RATINGS_DASHBOARD_PRECISION))
                if isinstance(avg, (int, float))
                else 'N/A'
            )
            title = (exp['title'] or 'Untitled').replace('"', '""')
            last_updated = utils.get_human_readable_time_string(
                exp['last_updated_msec']
            )
            exp_obj = exp_fetchers.get_exploration_by_id(exp['id'])
            exp_stats = stats_services.get_exploration_stats(
                exp['id'], exp_obj.version
            )
            exp_starts = exp_stats.num_starts
            exp_completions = exp_stats.num_completions
            exp_completion_rate = (
                round((exp_completions / exp_starts) * 100, 2)
                if exp_starts > 0
                else ''
            )
            lines.append(
                ','.join(
                    [
                        exp['id'],
                        '"' + title + '"',
                        str(feedback_analytics_dict['num_open_threads']),
                        avg_str,
                        str(exp['num_views']),
                        str(exp_starts),
                        str(exp_completions),
                        str(exp_completion_rate),
                        '"' + last_updated + '"',
                    ]
                )
            )

        data = '\n'.join(lines)
        file = io.BytesIO(data.encode('utf-8'))
        self.render_downloadable_file(file, 'creator_stats.csv', 'text/csv')


class NewExplorationHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of NewExplorationHandler's normalized_payload
    dictionary.
    """

    title: str


class NewExplorationHandler(
    base.BaseHandler[NewExplorationHandlerNormalizedPayloadDict, Dict[str, str]]
):
    """Creates a new exploration."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'title': {
                'schema': {'type': 'basestring'},
                'default_value': feconf.DEFAULT_EXPLORATION_TITLE,
            }
        }
    }

    @acl_decorators.can_create_exploration
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        title = self.normalized_payload['title']

        new_exploration_id = exp_fetchers.get_new_exploration_id()
        exploration = exp_domain.Exploration.create_default_exploration(
            new_exploration_id, title=title
        )
        exp_services.save_new_exploration(self.user_id, exploration)

        self.render_json({EXPLORATION_ID_KEY: new_exploration_id})


class NewCollectionHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Creates a new collection."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

    @acl_decorators.can_create_collection
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        new_collection_id = collection_services.get_new_collection_id()
        collection = collection_domain.Collection.create_default_collection(
            new_collection_id
        )
        collection_services.save_new_collection(self.user_id, collection)

        self.render_json({COLLECTION_ID_KEY: new_collection_id})


class UploadExplorationHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of UploadExplorationHandler's normalized_request
    dictionary.
    """

    yaml_file: str


class UploadExplorationHandler(
    base.BaseHandler[
        Dict[str, str], UploadExplorationHandlerNormalizedRequestDict
    ]
):
    """Uploads a new exploration."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {'yaml_file': {'schema': {'type': 'basestring'}}}
    }

    @acl_decorators.can_upload_exploration
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_request is not None
        yaml_content = self.normalized_request['yaml_file']

        new_exploration_id = exp_fetchers.get_new_exploration_id()
        if constants.ALLOW_YAML_FILE_UPLOAD:
            exp_services.save_new_exploration_from_yaml_and_assets(
                self.user_id, yaml_content, new_exploration_id, []
            )
            self.render_json({EXPLORATION_ID_KEY: new_exploration_id})
        else:
            raise self.InvalidInputException(
                'This server does not allow file uploads.'
            )
