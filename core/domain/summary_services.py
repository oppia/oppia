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

_LIBRARY_INDEX_GROUPS = [{
    'header': 'Mathematics & Statistics',
    'search_categories': [
        'Mathematics', 'Algebra', 'Arithmetic', 'Calculus', 'Combinatorics',
        'Geometry', 'Graph Theory', 'Logic', 'Probability', 'Statistics',
        'Trigonometry',
    ],
}, {
    'header': 'Computing',
    'search_categories': ['Algorithms', 'Computing', 'Programming'],
}, {
    'header': 'Science',
    'search_categories': [
        'Astronomy', 'Biology', 'Chemistry', 'Engineering', 'Environment',
        'Medicine', 'Physics',
    ],
}, {
    'header': 'Humanities',
    'search_categories': [
        'Architecture', 'Art', 'Music', 'Philosophy', 'Poetry'
    ],
}, {
    'header': 'Languages',
    'search_categories': ['Languages', 'Reading', 'English', 'Latin'],
}, {
    'header': 'Social Science',
    'search_categories': [
        'Business', 'Economics', 'Geography', 'Government', 'History', 'Law'],
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
        if exploration_summary is None:
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
    """Given a list of exploration summary domain objects, returns a list,
    with the same number of elements, of the corresponding human-readable
    exploration summary dicts.

    This assumes that all the exploration summary domain objects passed in are
    valid (i.e., none of them are None).
    """
    exploration_ids = [
        exploration_summary.id
        for exploration_summary in exploration_summaries]

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


def get_library_groups(language_codes):
    """Returns a list of groups for the library index page. Each group has a
    header and a list of dicts representing activity summaries.
    """
    language_codes_suffix = ''
    if language_codes:
        language_codes_suffix = ' language_code=("%s")' % (
            '" OR "'.join(language_codes))

    def _generate_query(categories):
        # This assumes that 'categories' is non-empty.
        return 'category=("%s")%s' % (
            '" OR "'.join(categories), language_codes_suffix)

    # Collect all exp ids so that the summary details can be retrieved with a
    # single get_multi() call.
    all_exp_ids = []
    header_to_exp_ids = {}
    for group in _LIBRARY_INDEX_GROUPS:
        exp_ids = exp_services.search_explorations(
            _generate_query(group['search_categories']), 8)[0]
        header_to_exp_ids[group['header']] = exp_ids
        all_exp_ids += exp_ids

    all_exploration_summaries = (
        exp_services.get_exploration_summaries_matching_ids(all_exp_ids))
    all_summary_dicts = {
        summary_dict['id']: summary_dict
        for summary_dict in _get_displayable_exp_summary_dicts(
            all_exploration_summaries)
    }

    results = []
    for group in _LIBRARY_INDEX_GROUPS:
        exp_ids_to_display = header_to_exp_ids[group['header']]
        summary_dicts = [
            all_summary_dicts[exp_id] for exp_id in exp_ids_to_display
            if exp_id in all_summary_dicts]

        if not summary_dicts:
            continue

        results.append({
            'header': group['header'],
            'categories': group['search_categories'],
            'activity_summary_dicts': summary_dicts,
        })

    return results


def get_featured_exploration_summary_dicts(language_codes):
    """Returns a list of featured explorations with the given language code.

    The return value is sorted in decreasing order of search rank.
    """
    filtered_exp_summaries = [
        exp_summary for exp_summary in
        exp_services.get_featured_exploration_summaries().values()
        if exp_summary.language_code in language_codes]

    search_ranks = {
        exp_summary.id: exp_services.get_search_rank_from_exp_summary(
            exp_summary)
        for exp_summary in filtered_exp_summaries
    }

    sorted_exp_summaries = sorted(
        filtered_exp_summaries,
        key=lambda exp_summary: search_ranks[exp_summary.id],
        reverse=True)

    return _get_displayable_exp_summary_dicts(sorted_exp_summaries)
