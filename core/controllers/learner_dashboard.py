# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the learner dashboard."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators, base
from core.domain import (
    exp_domain,
    exp_fetchers,
    learner_progress_services,
    story_fetchers,
    subscription_services,
    summary_services,
    user_services,
)
from core.storage.user import gae_models as user_models

from typing import Dict, List, Optional, Set, TypedDict, Union, cast
from typing_extensions import NotRequired


class SuggestionSummaryDict(TypedDict):
    """Dict representation of suggestion's summary."""

    suggestion_html: str
    current_content_html: str
    description: str
    author_username: Optional[str]
    created_on_msecs: float


class OldLearnerDashboardRedirectPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Redirects the old learner dashboard URL to the new one."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect(feconf.LEARNER_DASHBOARD_URL, permanent=True)


class LearnerDashboardTopicsAndStoriesProgressHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides data of the user's topics and stories for the learner
    dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        (
            learner_progress_in_topics_and_stories,
            number_of_nonexistent_topics_and_stories,
        ) = learner_progress_services.get_topics_and_stories_progress(
            self.user_id
        )

        completed_story_sumamries = (
            learner_progress_in_topics_and_stories.completed_story_summaries
        )
        completed_story_summary_dicts = (
            learner_progress_services.get_displayable_story_summary_dicts(
                self.user_id, completed_story_sumamries
            )
        )

        learnt_topic_summary_dicts = (
            learner_progress_services.get_displayable_topic_summary_dicts(
                self.user_id,
                learner_progress_in_topics_and_stories.learnt_topic_summaries,
            )
        )
        partially_learnt_topic_summaries = (
            learner_progress_in_topics_and_stories.partially_learnt_topic_summaries  # pylint: disable=line-too-long
        )
        partially_learnt_topic_summary_dicts = (
            learner_progress_services.get_displayable_topic_summary_dicts(
                self.user_id, partially_learnt_topic_summaries
            )
        )

        topics_to_learn_summaries = (
            learner_progress_in_topics_and_stories.topics_to_learn_summaries
        )
        topics_to_learn_summary_dicts = (
            learner_progress_services.get_displayable_topic_summary_dicts(
                self.user_id, topics_to_learn_summaries
            )
        )
        all_topic_summary_dicts = (
            learner_progress_services.get_displayable_topic_summary_dicts(
                self.user_id,
                learner_progress_in_topics_and_stories.all_topic_summaries,
            )
        )
        untracked_topic_sumamries = (
            learner_progress_in_topics_and_stories.untracked_topic_summaries
        )
        untracked_topic_summary_dicts = learner_progress_services.get_displayable_untracked_topic_summary_dicts(
            self.user_id, untracked_topic_sumamries
        )

        completed_to_incomplete_stories = (
            learner_progress_in_topics_and_stories.completed_to_incomplete_stories  # pylint: disable=line-too-long
        )
        learnt_to_partially_learnt_topics = (
            learner_progress_in_topics_and_stories.learnt_to_partially_learnt_topics  # pylint: disable=line-too-long
        )
        self.values.update(
            {
                'completed_stories_list': completed_story_summary_dicts,
                'learnt_topics_list': learnt_topic_summary_dicts,
                'partially_learnt_topics_list': (
                    partially_learnt_topic_summary_dicts
                ),
                'topics_to_learn_list': topics_to_learn_summary_dicts,
                'all_topics_list': all_topic_summary_dicts,
                'untracked_topics': untracked_topic_summary_dicts,
                'number_of_nonexistent_topics_and_stories': (
                    number_of_nonexistent_topics_and_stories
                ),
                'completed_to_incomplete_stories': completed_to_incomplete_stories,
                'learnt_to_partially_learnt_topics': (
                    learnt_to_partially_learnt_topics
                ),
            }
        )
        self.render_json(self.values)


class LearnerCompletedChaptersCountHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides the number of chapters completed by the user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        learner_progress_in_topics_and_stories = (
            learner_progress_services.get_topics_and_stories_progress(
                self.user_id
            )[0]
        )

        all_topic_summary_dicts = (
            learner_progress_services.get_displayable_topic_summary_dicts(
                self.user_id,
                learner_progress_in_topics_and_stories.all_topic_summaries,
            )
        )

        completed_chapters_count = 0
        for topic in all_topic_summary_dicts:
            for story in topic['canonical_story_summary_dict']:
                completed_chapters_count += len(
                    story_fetchers.get_completed_nodes_in_story(
                        self.user_id, story['id']
                    )
                )

        self.render_json(
            {
                'completed_chapters_count': completed_chapters_count,
            }
        )


class LearnerDashboardCollectionsProgressHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides data of the user's collections for the learner
    dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        (learner_progress, number_of_nonexistent_collections) = (
            learner_progress_services.get_collection_progress(self.user_id)
        )

        completed_collection_summary_dicts = (
            learner_progress_services.get_collection_summary_dicts(
                learner_progress.completed_collection_summaries
            )
        )
        incomplete_collection_summary_dicts = (
            learner_progress_services.get_collection_summary_dicts(
                learner_progress.incomplete_collection_summaries
            )
        )

        collection_playlist_summary_dicts = (
            learner_progress_services.get_collection_summary_dicts(
                learner_progress.collection_playlist_summaries
            )
        )

        self.values.update(
            {
                'completed_collections_list': completed_collection_summary_dicts,
                'incomplete_collections_list': incomplete_collection_summary_dicts,
                'collection_playlist': collection_playlist_summary_dicts,
                'number_of_nonexistent_collections': (
                    number_of_nonexistent_collections
                ),
                'completed_to_incomplete_collections': (
                    learner_progress.completed_to_incomplete_collections
                ),
            }
        )
        self.render_json(self.values)


class LearnerDashboardExplorationsProgressHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides data for the user's learner dashboard page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        (learner_progress, number_of_nonexistent_explorations) = (
            learner_progress_services.get_exploration_progress(self.user_id)
        )

        def _get_state_bfs_order(
            current_exp: exp_domain.Exploration,
        ) -> List[str]:
            """Get BFS order of states in exploration."""
            queue: List[str] = [current_exp.init_state_name]
            visited: Set[str] = set()
            ordered_states: List[str] = []

            while queue:
                state_name = queue.pop(0)
                if state_name in visited:
                    continue
                visited.add(state_name)
                ordered_states.append(state_name)

                state = current_exp.states[state_name]
                interaction = state.interaction
                destinations: List[str] = []

                for answer_group in interaction.answer_groups:
                    if answer_group.outcome.dest is not None:
                        destinations.append(answer_group.outcome.dest)

                if (
                    interaction.default_outcome is not None
                    and interaction.default_outcome.dest is not None
                ):
                    destinations.append(interaction.default_outcome.dest)

                for dest in destinations:
                    if dest not in visited:
                        queue.append(dest)

            # Include any unvisited states (disconnected states)
            for state_name in current_exp.states:
                if state_name not in visited:
                    ordered_states.append(state_name)

            return ordered_states

        def _annotate_with_card_progress(
            summary_dicts: List[
                summary_services.DisplayableExplorationSummaryDict
            ],
            completed: bool = False,
        ) -> List[
            Dict[
                str,
                Union[
                    str,
                    int,
                    float,
                    bool,
                    Dict[str, int],
                    Dict[str, Dict[str, int]],
                    List[str],
                ],
            ]
        ]:
            """Annotate summaries with card-based progress."""
            enriched: List[
                Dict[
                    str,
                    Union[
                        str,
                        int,
                        float,
                        bool,
                        Dict[str, int],
                        Dict[str, Dict[str, int]],
                        List[str],
                    ],
                ]
            ] = []
            for summary_dict in summary_dicts:
                exp_id = summary_dict['id']

                try:
                    current_exp = exp_fetchers.get_exploration_by_id(
                        exp_id, strict=True
                    )
                except Exception:
                    # Here ignore is used because TypedDict cannot be
                    # appended to a Dict with Union values directly.
                    enriched.append(summary_dict)  # type: ignore[arg-type]
                    continue

                state_bfs_order = _get_state_bfs_order(current_exp)
                total_cards_count = len(state_bfs_order)

                if completed:
                    visited_cards_count = total_cards_count
                else:
                    visited_cards_count = 0
                    assert self.user_id is not None
                    last_playthrough_model = (
                        user_models.ExpUserLastPlaythroughModel.get(
                            self.user_id, exp_id
                        )
                    )

                    if (
                        last_playthrough_model is not None
                        and last_playthrough_model.last_played_state_name
                        is not None
                    ):
                        last_state = (
                            last_playthrough_model.last_played_state_name
                        )

                        if last_state in state_bfs_order:
                            visited_cards_count = (
                                state_bfs_order.index(last_state) + 1
                            )

                progress_percent = (
                    int((visited_cards_count * 100) / total_cards_count)
                    if total_cards_count > 0
                    else 0
                )

                # Here we create a new dict with extended fields.
                # The spread operator copies all fields from summary_dict.
                enriched_summary: Dict[
                    str,
                    Union[
                        str,
                        int,
                        float,
                        bool,
                        Dict[str, int],
                        Dict[str, Dict[str, int]],
                        List[str],
                    ],
                ] = {
                    'id': summary_dict['id'],
                    'title': summary_dict['title'],
                    'activity_type': summary_dict['activity_type'],
                    'category': summary_dict['category'],
                    'created_on_msec': summary_dict['created_on_msec'],
                    'objective': summary_dict['objective'],
                    'language_code': summary_dict['language_code'],
                    'last_updated_msec': summary_dict['last_updated_msec'],
                    'human_readable_contributors_summary': (
                        summary_dict['human_readable_contributors_summary']
                    ),
                    'status': summary_dict['status'],
                    'ratings': summary_dict['ratings'],
                    'community_owned': summary_dict['community_owned'],
                    'tags': summary_dict['tags'],
                    'thumbnail_icon_url': summary_dict['thumbnail_icon_url'],
                    'thumbnail_bg_color': summary_dict['thumbnail_bg_color'],
                    'num_views': summary_dict['num_views'],
                    'total_cards_count': total_cards_count,
                    'visited_cards_count': visited_cards_count,
                    'progress_percent': progress_percent,
                }
                enriched.append(enriched_summary)
            return enriched

        completed_exp_summary_dicts = _annotate_with_card_progress(
            summary_services.get_displayable_exp_summary_dicts(
                learner_progress.completed_exp_summaries
            ),
            completed=True,
        )

        incomplete_exp_summary_dicts = _annotate_with_card_progress(
            summary_services.get_displayable_exp_summary_dicts(
                learner_progress.incomplete_exp_summaries
            )
        )

        exploration_playlist_summary_dicts = _annotate_with_card_progress(
            summary_services.get_displayable_exp_summary_dicts(
                learner_progress.exploration_playlist_summaries
            )
        )

        creators_subscribed_to = (
            subscription_services.get_all_creators_subscribed_to(self.user_id)
        )
        creators_settings = user_services.get_users_settings(
            creators_subscribed_to, strict=True
        )
        subscription_list = []

        for index, creator_settings in enumerate(creators_settings):
            subscription_summary = {
                'creator_username': creator_settings.username,
                'creator_impact': (
                    user_services.get_user_impact_score(
                        creators_subscribed_to[index]
                    )
                ),
            }

            subscription_list.append(subscription_summary)

        self.values.update(
            {
                'completed_explorations_list': completed_exp_summary_dicts,
                'incomplete_explorations_list': incomplete_exp_summary_dicts,
                'exploration_playlist': exploration_playlist_summary_dicts,
                'number_of_nonexistent_explorations': (
                    number_of_nonexistent_explorations
                ),
                'subscription_list': subscription_list,
            }
        )
        self.render_json(self.values)


class LearnerDashboardIdsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Gets the progress of the learner.

    Gets the ids of all explorations, collections, topics and stories
    completed by the user, the activities currently being pursued,
    and the activities present in the playlist.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        learner_dashboard_activities = (
            learner_progress_services.get_learner_dashboard_activities(
                self.user_id
            )
        )

        self.values.update(
            {
                'learner_dashboard_activity_ids': (
                    learner_dashboard_activities.to_dict()
                )
            }
        )
        self.render_json(self.values)
