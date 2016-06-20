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

from core.domain import collection_services
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import stats_jobs_continuous
from core.domain import user_services
import feconf
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
    'search_categories': [
        'Languages', 'Reading', 'English', 'Latin', 'Spanish', 'Gaulish'
    ],
}, {
    'header': 'Social Science',
    'search_categories': [
        'Business', 'Economics', 'Geography', 'Government', 'History', 'Law'
    ],
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


def get_learner_collection_dict_by_id(
        collection_id, user_id, strict=True, allow_invalid_explorations=False,
        version=None):
    """Creates and returns a dictionary representation of a collection given by
    the provided collection ID. This dictionary contains extra information
    along with the dict returned by collection_domain.Collection.to_dict()
    which includes useful data for the collection learner view. The information
    includes progress in the collection, information about explorations
    referenced within the collection, and a slightly nicer data structure for
    frontend work.
    This raises a ValidationError if the collection retrieved using the given
    ID references non-existent explorations.
    which includes useful data for the collection learner view.
    """
    collection = collection_services.get_collection_by_id(
        collection_id, strict=strict, version=version)

    exp_ids = collection.exploration_ids
    exp_summary_dicts = get_displayable_exp_summary_dicts_matching_ids(
        exp_ids, editor_user_id=user_id)
    exp_summaries_dict_map = {
        exp_summary_dict['id']: exp_summary_dict
        for exp_summary_dict in exp_summary_dicts
    }

    # TODO(bhenning): Users should not be recommended explorations they have
    # completed outside the context of a collection (see #1461).
    next_exploration_ids = None
    completed_exp_ids = None
    if user_id:
        completed_exp_ids = collection_services.get_valid_completed_exploration_ids( # pylint: disable=line-too-long
            user_id, collection_id, collection)
        next_exploration_ids = collection.get_next_exploration_ids(
            completed_exp_ids)
    else:
        # If the user is not logged in or they have not completed any of
        # the explorations yet within the context of this collection,
        # recommend the initial explorations.
        next_exploration_ids = collection.init_exploration_ids
        completed_exp_ids = []

    collection_dict = collection.to_dict()
    collection_dict['skills'] = collection.skills
    collection_dict['playthrough_dict'] = {
        'next_exploration_ids': next_exploration_ids,
        'completed_exploration_ids': completed_exp_ids
    }
    collection_dict['version'] = collection.version
    collection_is_public = rights_manager.is_collection_public(collection_id)

    # Insert an 'exploration' dict into each collection node, where the
    # dict includes meta information about the exploration (ID and title).
    for collection_node in collection_dict['nodes']:
        exploration_id = collection_node['exploration_id']
        summary_dict = exp_summaries_dict_map.get(exploration_id)
        if not allow_invalid_explorations:
            if not summary_dict:
                raise utils.ValidationError(
                    'Expected collection to only reference valid '
                    'explorations, but found an exploration with ID: %s (was '
                    'the exploration deleted or is it a private exploration '
                    'that you do not have edit access to?)'
                    % exploration_id)
            if collection_is_public and rights_manager.is_exploration_private(
                    exploration_id):
                raise utils.ValidationError(
                    'Cannot reference a private exploration within a public '
                    'collection, exploration ID: %s' % exploration_id)

        if summary_dict:
            collection_node['exploration_summary'] = summary_dict
        else:
            collection_node['exploration_summary'] = None

    return collection_dict


def get_displayable_collection_summary_dicts_matching_ids(collection_ids):
    """Returns a list with all collection summary objects that can be
    displayed on the library page as collection summary tiles.
    """
    collection_summaries = (
        collection_services.get_collection_summaries_matching_ids(
            collection_ids))
    return _get_displayable_collection_summary_dicts(collection_summaries)


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

    return get_displayable_exp_summary_dicts(filtered_exploration_summaries)


def get_displayable_exp_summary_dicts(exploration_summaries):
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

        summary_dict = {
            'id': exploration_summary.id,
            'title': exploration_summary.title,
            'activity_type': rights_manager.ACTIVITY_TYPE_EXPLORATION,
            'category': exploration_summary.category,
            'created_on_msec': utils.get_time_in_millisecs(
                exploration_summary.exploration_model_created_on),
            'objective': exploration_summary.objective,
            'language_code': exploration_summary.language_code,
            'last_updated_msec': utils.get_time_in_millisecs(
                exploration_summary.exploration_model_last_updated
            ),
            'status': exploration_summary.status,
            'ratings': exploration_summary.ratings,
            'community_owned': exploration_summary.community_owned,
            'tags': exploration_summary.tags,
            'thumbnail_icon_url': utils.get_thumbnail_icon_url_for_category(
                exploration_summary.category),
            'thumbnail_bg_color': utils.get_hex_color_for_category(
                exploration_summary.category),
            'num_views': view_counts[ind],
        }

        displayable_exp_summaries.append(summary_dict)

    return displayable_exp_summaries


def _get_displayable_collection_summary_dicts(collection_summaries):
    displayable_collection_summaries = []
    for collection_summary in collection_summaries:
        if collection_summary and collection_summary.status != (
                rights_manager.ACTIVITY_STATUS_PRIVATE):
            displayable_collection_summaries.append({
                'id': collection_summary.id,
                'title': collection_summary.title,
                'category': collection_summary.category,
                'activity_type': rights_manager.ACTIVITY_TYPE_COLLECTION,
                'objective': collection_summary.objective,
                'language_code': collection_summary.language_code,
                'tags': collection_summary.tags,
                'node_count': collection_summary.node_count,
                'last_updated_msec': utils.get_time_in_millisecs(
                    collection_summary.collection_model_last_updated),
                'thumbnail_icon_url': utils.get_thumbnail_icon_url_for_category(
                    collection_summary.category),
                'thumbnail_bg_color': utils.get_hex_color_for_category(
                    collection_summary.category)})
    return displayable_collection_summaries


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

    # Collect all collection ids so that the summary details can be retrieved
    # with a single get_multi() call.
    all_collection_ids = []
    header_to_collection_ids = {}
    for group in _LIBRARY_INDEX_GROUPS:
        collection_ids = collection_services.search_collections(
            _generate_query(group['search_categories']), 8)[0]
        header_to_collection_ids[group['header']] = collection_ids
        all_collection_ids += collection_ids

    collection_summaries = [
        summary for summary in
        collection_services.get_collection_summaries_matching_ids(
            all_collection_ids)
        if summary is not None]
    collection_summary_dicts = {
        summary_dict['id']: summary_dict
        for summary_dict in _get_displayable_collection_summary_dicts(
            collection_summaries)
    }

    # Collect all exp ids so that the summary details can be retrieved with a
    # single get_multi() call.
    all_exp_ids = []
    header_to_exp_ids = {}
    for group in _LIBRARY_INDEX_GROUPS:
        exp_ids = exp_services.search_explorations(
            _generate_query(group['search_categories']), 8)[0]
        header_to_exp_ids[group['header']] = exp_ids
        all_exp_ids += exp_ids

    exp_summaries = [
        summary for summary in
        exp_services.get_exploration_summaries_matching_ids(all_exp_ids)
        if summary is not None]

    exp_summary_dicts = {
        summary_dict['id']: summary_dict
        for summary_dict in get_displayable_exp_summary_dicts(exp_summaries)
    }

    results = []
    for group in _LIBRARY_INDEX_GROUPS:
        summary_dicts = []
        collection_ids_to_display = header_to_collection_ids[group['header']]
        summary_dicts = [
            collection_summary_dicts[collection_id]
            for collection_id in collection_ids_to_display
            if collection_id in collection_summary_dicts]

        exp_ids_to_display = header_to_exp_ids[group['header']]
        summary_dicts += [
            exp_summary_dicts[exp_id] for exp_id in exp_ids_to_display
            if exp_id in exp_summary_dicts]

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

    return get_displayable_exp_summary_dicts(sorted_exp_summaries)


def get_top_rated_exploration_summary_dicts(language_codes):
    """Returns a list of top rated explorations with the given language code.

    The return value is sorted in decreasing order of average rating.
    """
    filtered_exp_summaries = [
        exp_summary for exp_summary in
        exp_services.get_top_rated_exploration_summaries().values()
        if exp_summary.language_code in language_codes and
        sum(exp_summary.ratings.values()) > 0]

    sorted_exp_summaries = sorted(
        filtered_exp_summaries,
        key=lambda exp_summary: exp_summary.scaled_average_rating,
        reverse=True)[:feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS]

    return get_displayable_exp_summary_dicts(sorted_exp_summaries)


def get_recently_published_exploration_summary_dicts():
    """Returns a list of recently published explorations
     with the given language code.
    """
    recently_published_exploration_summaries = [
        exp_summary for exp_summary in
        exp_services.get_recently_published_exploration_summaries().values()]

    # Arranging recently published exploration summaries with respect to time.
    # sorted() is used to sort the random list of recently published summaries.
    summaries = sorted(
        recently_published_exploration_summaries,
        key=lambda exp_summary: exp_summary.first_published_msec,
        reverse=True)

    return get_displayable_exp_summary_dicts(summaries)
