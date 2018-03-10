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

"""Commands that can be used to operate on activity summaries."""

from constants import constants
from core.domain import activity_services
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import stats_services
from core.domain import user_services
import utils

_LIBRARY_INDEX_GROUPS = [{
    'header_i18n_id': 'I18N_LIBRARY_GROUPS_MATHEMATICS_&_STATISTICS',
    'search_categories': [
        'Mathematics', 'Algebra', 'Arithmetic', 'Calculus', 'Combinatorics',
        'Geometry', 'Graph Theory', 'Logic', 'Probability', 'Statistics',
        'Trigonometry',
    ],
}, {
    'header_i18n_id': 'I18N_LIBRARY_GROUPS_COMPUTING',
    'search_categories': ['Algorithms', 'Computing', 'Programming'],
}, {
    'header_i18n_id': 'I18N_LIBRARY_GROUPS_SCIENCE',
    'search_categories': [
        'Astronomy', 'Biology', 'Chemistry', 'Engineering', 'Environment',
        'Medicine', 'Physics',
    ],
}, {
    'header_i18n_id': 'I18N_LIBRARY_GROUPS_HUMANITIES',
    'search_categories': [
        'Architecture', 'Art', 'Music', 'Philosophy', 'Poetry'
    ],
}, {
    'header_i18n_id': 'I18N_LIBRARY_GROUPS_LANGUAGES',
    'search_categories': [
        'Languages', 'Reading', 'English', 'Latin', 'Spanish', 'Gaulish'
    ],
}, {
    'header_i18n_id': 'I18N_LIBRARY_GROUPS_SOCIAL_SCIENCE',
    'search_categories': [
        'Business', 'Economics', 'Geography', 'Government', 'History', 'Law'
    ],
}]


def get_human_readable_contributors_summary(contributors_summary):
    """Gets contributors summary in human readable form.

    Args:
        contributors_summary: dict. The keys are user ids and
            the values are the number of commits made by that user.

    Returns:
        dict. Dicts of contributors in human readable form; the keys are
        usernames and the values are a dict. Example:

        {
            'albert': {
                'num_commits': 10,
            },
        }
    """
    contributor_ids = contributors_summary.keys()
    contributor_usernames = user_services.get_human_readable_user_ids(
        contributor_ids)
    return {
        contributor_usernames[ind]: {
            'num_commits': contributors_summary[contributor_ids[ind]],
        }
        for ind in xrange(len(contributor_ids))
    }


def get_learner_collection_dict_by_id(
        collection_id, user, strict=True,
        allow_invalid_explorations=False, version=None):
    """Gets a dictionary representation of a collection given by the provided
    collection ID. This dict includes user-specific playthrough information.

    Args:
        collection_id: str. The id of the collection.
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        strict: bool. Whether to fail noisily if no collection with the given
            id exists in the datastore.
        allow_invalid_explorations: bool. Whether to also return explorations
            that are invalid, such as deleted/private explorations.
        version: str or None. The version number of the collection to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        dict. A dictionary that contains extra information along with the dict
        returned by collection_domain.Collection.to_dict() which includes useful
        data for the collection learner view. The information includes progress
        in the collection, information about explorations referenced within the
        collection, and a slightly nicer data structure for frontend work.

    Raises:
        ValidationError: If the collection retrieved using the given
            ID references non-existent explorations.
    """
    collection = collection_services.get_collection_by_id(
        collection_id, strict=strict, version=version)

    exp_ids = collection.exploration_ids
    exp_summary_dicts = get_displayable_exp_summary_dicts_matching_ids(
        exp_ids, user=user)
    exp_summaries_dict_map = {
        exp_summary_dict['id']: exp_summary_dict
        for exp_summary_dict in exp_summary_dicts
    }

    # TODO(bhenning): Users should not be recommended explorations they have
    # completed outside the context of a collection (see #1461).
    next_exploration_ids = None
    completed_exp_ids = None
    if user.user_id:
        completed_exp_ids = (
            collection_services.get_valid_completed_exploration_ids(
                user.user_id, collection))
        next_exploration_ids = collection.get_next_exploration_ids(
            completed_exp_ids)
    else:
        # If the user is not logged in or they have not completed any of
        # the explorations yet within the context of this collection,
        # recommend the initial explorations.
        next_exploration_ids = collection.init_exploration_ids
        completed_exp_ids = []

    collection_dict = collection.to_dict()
    collection_dict['nodes'] = [
        node.to_dict() for node in collection.get_nodes_in_playable_order()]
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
    """Returns a list of collection summary dicts corresponding to the given
    collection ids.

    Args:
        collection_ids: list(str). A list of collection ids.

    Return:
        list(dict). Each element in this list is a collection summary dict.
        These elements are returned in the same order as that given
        in collection_ids.
    """
    collection_summaries = (
        collection_services.get_collection_summaries_matching_ids(
            collection_ids))
    return _get_displayable_collection_summary_dicts(collection_summaries)


def get_exp_metadata_dicts_matching_query(query_string, search_cursor, user):
    """Given a query string and a search cursor, returns a list of exploration
    metadata dicts that satisfy the search query.

    Args:
        query_string: str. The search query for which the search is to be
            performed.
        search_cursor: str or None. The cursor location to start the search
            from. If None, the returned values are from the beginning
            of the results list.
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.

    Returns:
        exploration_list: list(dict). A list of metadata dicts for explorations
            matching the query.
        new_search_cursor: str. New search cursor location.
    """
    exp_ids, new_search_cursor = (
        exp_services.get_exploration_ids_matching_query(
            query_string, cursor=search_cursor))

    exploration_list = get_exploration_metadata_dicts(
        exp_ids, user)

    return exploration_list, new_search_cursor


def get_exploration_metadata_dicts(exploration_ids, user):
    """Given a list of exploration ids, optionally filters the list for
    explorations that are currently non-private and not deleted, and returns a
    list of dicts of the corresponding exploration summaries for collection
    node search.

    Args:
        exploration_ids: list(str). A list of exploration ids for which
            exploration metadata dicts are to be returned.
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.

    Returns:
        list(dict). A list of metadata dicts corresponding to the given
        exploration ids. Each dict has three keys:
            'id': the exploration id;
            'title': the exploration title;
            'objective': the exploration objective.
    """
    exploration_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exploration_ids))
    exploration_rights_objects = (
        rights_manager.get_multiple_exploration_rights_by_ids(exploration_ids))

    filtered_exploration_summaries = []
    for (exploration_summary, exploration_rights) in (
            zip(exploration_summaries, exploration_rights_objects)):
        if exploration_summary is None:
            continue

        if exploration_rights is None:
            continue

        if exploration_summary.status == (
                rights_manager.ACTIVITY_STATUS_PRIVATE):
            if user.user_id is None:
                continue

            if not rights_manager.check_can_edit_activity(
                    user, exploration_rights):
                continue

        filtered_exploration_summaries.append(exploration_summary)

    return [
        summary.to_metadata_dict()
        for summary in filtered_exploration_summaries]


def get_displayable_exp_summary_dicts_matching_ids(exploration_ids, user=None):
    """Gets a summary of explorations in human readable form from
    exploration ids.

    Given a list of exploration ids, optionally filters the list for
    explorations that are currently non-private and not deleted, and returns a
    list of dicts of the corresponding exploration summaries. This function can
    also filter based on a user ID who has edit access to the corresponding
    exploration, where the editor ID is for private explorations. Please use
    this function when needing summary information to display on exploration
    summary tiles in the frontend.

    Args:
        exploration_ids: list(str). List of exploration ids.
        user: UserActionsInfo or None. Object having user_id, role and actions
            for given user.

    Return:
        list(dict). A list of exploration summary dicts in human readable form.
        Example:

        [ {
            'category': u'A category',
            'community_owned': False,
            'id': 'eid2',
            'language_code': 'en',
            'num_views': 0,
            'objective': u'An objective',
            'status': 'public',
            'tags': [],
            'thumbnail_bg_color': '#a33f40',
            'thumbnail_icon_url': self.get_static_asset_url(
                '/images/subjects/Lightbulb.svg'),
            'title': u'Exploration 2 Albert title',
        }, ]
    """
    exploration_summaries = (
        exp_services.get_exploration_summaries_matching_ids(exploration_ids))
    exploration_rights_objects = (
        rights_manager.get_multiple_exploration_rights_by_ids(exploration_ids))

    filtered_exploration_summaries = []
    for (exploration_summary, exploration_rights) in (
            zip(exploration_summaries, exploration_rights_objects)):
        if exploration_summary is None:
            continue

        if exploration_rights is None:
            continue
        if exploration_summary.status == (
                rights_manager.ACTIVITY_STATUS_PRIVATE):
            if user is None:
                continue
            if not rights_manager.check_can_edit_activity(
                    user, exploration_rights):
                continue

        filtered_exploration_summaries.append(exploration_summary)

    return get_displayable_exp_summary_dicts(filtered_exploration_summaries)


def get_displayable_exp_summary_dicts(exploration_summaries):
    """Gets a summary of explorations in human readable form.

    Given a list of exploration summary domain objects, returns a list,
    with the same number of elements, of the corresponding human-readable
    exploration summary dicts.
    This assumes that all the exploration summary domain objects passed in are
    valid (i.e., none of them are None).

    Args:
        exploration_summaries: list(ExplorationSummary). List of exploration
        summary objects.

    Return:
        list(dict). A list of exploration summary dicts in human readable form.
        Example:

        [ {
            'category': u'A category',
            'community_owned': False,
            'id': 'eid2',
            'language_code': 'en',
            'num_views': 0,
            'objective': u'An objective',
            'status': 'public',
            'tags': [],
            'thumbnail_bg_color': '#a33f40',
            'thumbnail_icon_url': self.get_static_asset_url(
                '/images/subjects/Lightbulb.svg'),
            'title': u'Exploration 2 Albert title',
        }, ]
    """
    exp_version_references = [
        exp_domain.ExpVersionReference(exp_summary.id, exp_summary.version)
        for exp_summary in exploration_summaries]
    exp_stats_list = stats_services.get_exploration_stats_multi(
        exp_version_references)
    view_counts = [exp_stats.num_starts for exp_stats in exp_stats_list]

    displayable_exp_summaries = []

    for ind, exploration_summary in enumerate(exploration_summaries):
        if not exploration_summary:
            continue

        summary_dict = {
            'id': exploration_summary.id,
            'title': exploration_summary.title,
            'activity_type': constants.ACTIVITY_TYPE_EXPLORATION,
            'category': exploration_summary.category,
            'created_on_msec': utils.get_time_in_millisecs(
                exploration_summary.exploration_model_created_on),
            'objective': exploration_summary.objective,
            'language_code': exploration_summary.language_code,
            'last_updated_msec': utils.get_time_in_millisecs(
                exploration_summary.exploration_model_last_updated
            ),
            'human_readable_contributors_summary': (
                get_human_readable_contributors_summary(
                    exploration_summary.contributors_summary)
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
    """Gets a summary of collections in human readable form.

    Args:
        collection_summaries: list(CollectionSummary). List of collection
        summary domain object.

    Return:
        list(dict). A list of exploration summary dicts in human readable form.
        Example:

        [ {
            'category': u'A category',
            'community_owned': False,
            'id': 'eid2',
            'language_code': 'en',
            'num_views': 0,
            'objective': u'An objective',
            'status': 'public',
            'tags': [],
            'thumbnail_bg_color': '#a33f40',
            'thumbnail_icon_url': self.get_static_asset_url(
                '/images/subjects/Lightbulb.svg'),
            'title': u'Exploration 2 Albert title',
        }, ]
    """
    displayable_collection_summaries = []
    for collection_summary in collection_summaries:
        if collection_summary and collection_summary.status != (
                rights_manager.ACTIVITY_STATUS_PRIVATE):
            displayable_collection_summaries.append({
                'id': collection_summary.id,
                'title': collection_summary.title,
                'category': collection_summary.category,
                'activity_type': constants.ACTIVITY_TYPE_COLLECTION,
                'objective': collection_summary.objective,
                'language_code': collection_summary.language_code,
                'tags': collection_summary.tags,
                'node_count': collection_summary.node_count,
                'last_updated_msec': utils.get_time_in_millisecs(
                    collection_summary.collection_model_last_updated),
                'thumbnail_icon_url': (
                    utils.get_thumbnail_icon_url_for_category(
                        collection_summary.category)),
                'thumbnail_bg_color': utils.get_hex_color_for_category(
                    collection_summary.category)})
    return displayable_collection_summaries


def get_library_groups(language_codes):
    """Returns a list of groups for the library index page. Each group has a
    header and a list of dicts representing activity summaries.

    Args:
        language_codes: list(str). A list of language codes. Only explorations
            with these languages will be returned.

    Return:
        list(dict). A list of groups for the library index page. Each group is
        represented by a dict with the following keys and values:
            - activity_summary_dicts: list(dict). A list of dicts representing
                activity summaries.
            - categories: list(str). The list of group categories.
            - header_i18n_id: str. The i18n id for the header of the category.
            - has_full_results_page: bool. Whether the group header links to
                a "full results" page. This is always True for the
                "exploration category" groups.
            - full_results_url: str. The URL to the corresponding "full results"
                page.
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
    header_id_to_collection_ids = {}
    for group in _LIBRARY_INDEX_GROUPS:
        collection_ids = search_services.search_collections(
            _generate_query(group['search_categories']), 8)[0]
        header_id_to_collection_ids[group['header_i18n_id']] = collection_ids
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
        exp_ids = search_services.search_explorations(
            _generate_query(group['search_categories']), 8)[0]
        header_to_exp_ids[group['header_i18n_id']] = exp_ids
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
        collection_ids_to_display = (
            header_id_to_collection_ids[group['header_i18n_id']])
        summary_dicts = [
            collection_summary_dicts[collection_id]
            for collection_id in collection_ids_to_display
            if collection_id in collection_summary_dicts]

        exp_ids_to_display = header_to_exp_ids[group['header_i18n_id']]
        summary_dicts += [
            exp_summary_dicts[exp_id] for exp_id in exp_ids_to_display
            if exp_id in exp_summary_dicts]

        if not summary_dicts:
            continue

        results.append({
            'header_i18n_id': group['header_i18n_id'],
            'categories': group['search_categories'],
            'activity_summary_dicts': summary_dicts,
            'has_full_results_page': True,
            'full_results_url': None,
        })

    return results


def require_activities_to_be_public(activity_references):
    """Raises an exception if any activity reference in the list does not
    exist, or is not public.

    Args:
        activity_references: list(ActivityReference). A list of
            ActivityReference domain objects.

    Raises:
        Exception: Any activity reference in the list does not
            exist, or is not public.
    """
    exploration_ids, collection_ids = activity_services.split_by_type(
        activity_references)

    activity_summaries_by_type = [{
        'type': constants.ACTIVITY_TYPE_EXPLORATION,
        'ids': exploration_ids,
        'summaries': exp_services.get_exploration_summaries_matching_ids(
            exploration_ids),
    }, {
        'type': constants.ACTIVITY_TYPE_COLLECTION,
        'ids': collection_ids,
        'summaries': collection_services.get_collection_summaries_matching_ids(
            collection_ids),
    }]

    for activities_info in activity_summaries_by_type:
        for index, summary in enumerate(activities_info['summaries']):
            if summary is None:
                raise Exception(
                    'Cannot feature non-existent %s with id %s' %
                    (activities_info['type'], activities_info['ids'][index]))
            if summary.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
                raise Exception(
                    'Cannot feature private %s with id %s' %
                    (activities_info['type'], activities_info['ids'][index]))


def get_featured_activity_summary_dicts(language_codes):
    """Returns a list of featured activities with the given language codes.
    The return value is sorted according to the list stored in the datastore.

    Args:
        language_codes: list(str). A list of language codes. Only explorations
            with these languages will be returned.

    Return:
        list(dict). Each dict in this list represents a featured activity.
        For example:

        [ {
            'status': 'public',
            'thumbnail_bg_color': '#a33f40',
            'community_owned': False,
            'tags': [],
            'thumbnail_icon_url': self.get_static_asset_url(
                '/images/subjects/Lightbulb.svg'),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': 'eid2',
            'category': 'A category',
            'ratings': feconf.get_empty_ratings(),
            'title': 'A title',
            'num_views': 0,
            'objective': 'An objective',
        }, ]
    """
    activity_references = activity_services.get_featured_activity_references()
    exploration_ids, collection_ids = activity_services.split_by_type(
        activity_references)

    exp_summary_dicts = get_displayable_exp_summary_dicts_matching_ids(
        exploration_ids)
    col_summary_dicts = get_displayable_collection_summary_dicts_matching_ids(
        collection_ids)

    summary_dicts_by_id = {
        constants.ACTIVITY_TYPE_EXPLORATION: {
            summary_dict['id']: summary_dict
            for summary_dict in exp_summary_dicts
        },
        constants.ACTIVITY_TYPE_COLLECTION: {
            summary_dict['id']: summary_dict
            for summary_dict in col_summary_dicts
        },
    }

    featured_summary_dicts = []
    for reference in activity_references:
        if reference.id in summary_dicts_by_id[reference.type]:
            summary_dict = summary_dicts_by_id[reference.type][reference.id]
            if summary_dict and summary_dict['language_code'] in language_codes:
                featured_summary_dicts.append(summary_dict)
    return featured_summary_dicts


def get_top_rated_exploration_summary_dicts(language_codes, limit):
    """Returns a list of top rated explorations with the given language codes.
    The return value is sorted in decreasing order of average rating.

    Args:
        language_codes: list(str). A list of language codes. Only explorations
            with these languages will be returned.
        limit: int. The maximum number of explorations to return.

    Return:
        list(dict). Each dict in this list represents a exploration summary in
        human readable form. The list is sorted in decreasing order of average
        rating. For example:

        [ {
            'category': u'A category',
            'community_owned': False,
            'id': 'eid2',
            'language_code': 'en',
            'num_views': 0,
            'objective': u'An objective',
            'status': 'public',
            'tags': [],
            'thumbnail_bg_color': '#a33f40',
            'thumbnail_icon_url': self.get_static_asset_url(
                '/images/subjects/Lightbulb.svg'),
            'title': u'Exploration 2 Albert title',
        }, ]
    """
    filtered_exp_summaries = [
        exp_summary for exp_summary in
        exp_services.get_top_rated_exploration_summaries(limit).values()
        if exp_summary.language_code in language_codes and
        sum(exp_summary.ratings.values()) > 0]

    sorted_exp_summaries = sorted(
        filtered_exp_summaries,
        key=lambda exp_summary: exp_summary.scaled_average_rating,
        reverse=True)

    return get_displayable_exp_summary_dicts(sorted_exp_summaries)


def get_recently_published_exp_summary_dicts(limit):
    """Returns a list of recently published explorations.

    Args:
        limit: int. The maximum number of explorations to return.

    Return:
        list(dict). Each dict in this list represents a featured activity in
        human readable form. For example:

        [ {
            'category': u'A category',
            'community_owned': False,
            'id': 'eid2',
            'language_code': 'en',
            'num_views': 0,
            'objective': u'An objective',
            'status': 'public',
            'tags': [],
            'thumbnail_bg_color': '#a33f40',
            'thumbnail_icon_url': self.get_static_asset_url(
                '/images/subjects/Lightbulb.svg'),
            'title': u'Exploration 2 Albert title',
        }, ]
    """
    recently_published_exploration_summaries = [
        exp_summary for exp_summary in
        exp_services.get_recently_published_exp_summaries(limit).values()]

    # Arranging recently published exploration summaries with respect to time.
    # sorted() is used to sort the random list of recently published summaries.
    summaries = sorted(
        recently_published_exploration_summaries,
        key=lambda exp_summary: exp_summary.first_published_msec,
        reverse=True)

    return get_displayable_exp_summary_dicts(summaries)
