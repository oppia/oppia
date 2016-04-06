# coding: utf-8
#
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

"""Commands that can be used to operate on exploration summaries."""

from core.domain import exp_services
from core.domain import rights_manager
from core.domain import stats_jobs_continuous
from core.domain import user_services
import utils


def get_human_readable_contributors_summary(contributors_summary):
    contributor_ids = contributors_summary.keys()
    contributor_usernames = user_services.get_human_readable_user_ids(
        contributor_ids)
    contributor_profile_pictures = (
        user_services.get_profile_pictures_by_user_ids(contributor_ids))
    return {
        contributor_usernames[ind]: {
            'num_commits': contributors_summary[contributor_ids[ind]],
            'profile_picture_data_url': contributor_profile_pictures[
                contributor_ids[ind]]
        }
        for ind in xrange(len(contributor_ids))
    }


def get_displayable_exp_summary_dicts_matching_ids(
        exploration_ids, editor_user_id=None):
    """Given a list of exploration ids, optionally filters the list for
    explorations that are currently non-private and not deleted, and returns a
    list of dicts of the corresponding exploration summaries. This function can
    also filter based on a user ID who has edit access to the corresponding
    exploration, where the editor ID is for private explorations. Please use
    this function when needing summary information to display on exploration
    summary tiles in the frontend.
    """
    displayable_exp_summaries = []
    exploration_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exploration_ids))
    view_counts = (
        stats_jobs_continuous.StatisticsAggregator.get_views_multi(
            exploration_ids))

    for ind, exploration_summary in enumerate(exploration_summaries):
        if not exploration_summary:
            continue
        if exploration_summary.status == (
                rights_manager.ACTIVITY_STATUS_PRIVATE):
            if not editor_user_id:
                continue
            if not rights_manager.Actor(editor_user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION,
                    exploration_summary.id):
                continue

        displayable_exp_summaries.append({
            'id': exploration_summary.id,
            'title': exploration_summary.title,
            'category': exploration_summary.category,
            'objective': exploration_summary.objective,
            'language_code': exploration_summary.language_code,
            'last_updated_msec': utils.get_time_in_millisecs(
                exploration_summary.exploration_model_last_updated
            ),
            'status': exploration_summary.status,
            'ratings': exploration_summary.ratings,
            'community_owned': exploration_summary.community_owned,
            'human_readable_contributors_summary':
                get_human_readable_contributors_summary(
                    exploration_summary.contributors_summary),
            'tags': exploration_summary.tags,
            'thumbnail_icon_url': utils.get_thumbnail_icon_url_for_category(
                exploration_summary.category),
            'thumbnail_bg_color': utils.get_hex_color_for_category(
                exploration_summary.category),
            'num_views': view_counts[ind],
        })

    return displayable_exp_summaries
