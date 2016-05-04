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

_GALLERY_CATEGORY_GROUPINGS = [{
    'header': 'Computation & Programming',
    'search_categories': ['Computing', 'Programming'],
}, {
    'header': 'Mathematics & Statistics',
    'search_categories': ['Mathematics', 'Statistics'],
}, {
    'header': 'Biology, Chemistry & Medicine',
    'search_categories': ['Biology', 'Chemistry', 'Medicine'],
}, {
    'header': 'Physics, Astronomy & Engineering',
    'search_categories': ['Physics', 'Astronomy', 'Engineering'],
}, {
    'header': 'Languages & Reading',
    'search_categories': ['Languages', 'Reading'],
}, {
    'header': 'Environment & Geography',
    'search_categories': ['Environment', 'Geography'],
}, {
    'header': 'Business, Economics, Government & Law',
    'search_categories': ['Business', 'Economics', 'Government', 'Law'],
}]

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
    exploration_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exploration_ids))

    filtered_exploration_summaries = []
    for exploration_summary in exploration_summaries:
        if not exploration_summary:
            continue
        if exploration_summary.status == (
                rights_manager.ACTIVITY_STATUS_PRIVATE):
            if editor_user_id is None:
                continue
            if not rights_manager.Actor(editor_user_id).can_edit(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION,
                    exploration_summary.id):
                continue

        filtered_exploration_summaries.append(exploration_summary)

    return _get_displayable_exp_summary_dicts(filtered_exploration_summaries)


def _get_displayable_exp_summary_dicts(exploration_summaries):
    """Given a list of exploration summary domain objects, returns a list of
    the corresponding human-readable exploration summary dicts.
    """
    exploration_ids = [(
        exploration_summary.id if exploration_summary is not None
        else None) for exploration_summary in exploration_summaries]

    view_counts = (
        stats_jobs_continuous.StatisticsAggregator.get_views_multi(
            exploration_ids))
    displayable_exp_summaries = []

    for ind, exploration_summary in enumerate(exploration_summaries):
        if not exploration_summary:
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


def get_gallery_category_groupings(language_codes):
    """Returns a list of groups in the gallery. Each group has a header and
    a list of dicts representing activity summaries.
    """
    language_codes_suffix = ''
    if language_codes:
        language_codes_suffix = ' language_code=("%s")' % (
            '" OR "'.join(language_codes))

    def _generate_query(categories):
        # This assumes that 'categories' is non-empty.
        return 'category=("%s")%s' % (
            '" OR "'.join(categories), language_codes_suffix)

    results = []
    for gallery_group in _GALLERY_CATEGORY_GROUPINGS:
        # TODO(sll): Extend this to include collections.
        exp_ids = exp_services.search_explorations(
            _generate_query(gallery_group['search_categories']), 10)[0]

        summary_dicts = get_displayable_exp_summary_dicts_matching_ids(
            exp_ids)

        if not summary_dicts:
            continue

        results.append({
            'header': gallery_group['header'],
            'categories': gallery_group['search_categories'],
            'activity_summary_dicts': summary_dicts,
        })

    return results


def get_featured_exploration_summary_dicts():
    """Returns a list of featured explorations."""
    featured_exp_summaries = (
        exp_services.get_featured_exploration_summaries())
    return _get_displayable_exp_summary_dicts(
        featured_exp_summaries.values())
