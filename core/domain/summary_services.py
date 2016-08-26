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

from core.domain import activity_services
from core.domain import exp_domain
from core.domain import collection_domain
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
import feconf

(collection_models, exp_models) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration
])

# TODO(bhenning): Improve the ranking calculation. Some possible suggestions
# for a better ranking include using an average of the search ranks of each
# exploration referenced in the collection and/or demoting collections
# for any validation errors from explorations referenced in the collection.
_STATUS_PUBLICIZED_BONUS = 30
# This is done to prevent the rank hitting 0 too easily. Note that
# negative ranks are disallowed in the Search API.
_DEFAULT_RANK = 20


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


def require_activities_to_be_public(activity_references):
    """Raises an exception if any activity reference in the list does not
    exist, or is not public.
    """
    exploration_ids, collection_ids = activity_services.split_by_type(
        activity_references)

    activity_summaries_by_type = [{
        'type': feconf.ACTIVITY_TYPE_EXPLORATION,
        'ids': exploration_ids,
        'summaries': get_exploration_summaries_matching_ids(exploration_ids),
    }, {
        'type': feconf.ACTIVITY_TYPE_COLLECTION,
        'ids': collection_ids,
        'summaries': get_collection_summaries_matching_ids(collection_ids),
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


def get_exploration_summary_from_model(exp_summary_model):
    return exp_domain.ExplorationSummary(
        exp_summary_model.id, exp_summary_model.title,
        exp_summary_model.category, exp_summary_model.objective,
        exp_summary_model.language_code, exp_summary_model.tags,
        exp_summary_model.ratings, exp_summary_model.scaled_average_rating,
        exp_summary_model.status, exp_summary_model.community_owned,
        exp_summary_model.owner_ids, exp_summary_model.editor_ids,
        exp_summary_model.viewer_ids,
        exp_summary_model.contributor_ids,
        exp_summary_model.contributors_summary, exp_summary_model.version,
        exp_summary_model.exploration_model_created_on,
        exp_summary_model.exploration_model_last_updated,
        exp_summary_model.first_published_msec
    )


def get_exploration_summary_by_id(exploration_id):
    """Returns a domain object representing an exploration summary."""
    # TODO(msl): Maybe use memcache similarly to get_exploration_by_id.
    exp_summary_model = exp_models.ExpSummaryModel.get(
        exploration_id)
    if exp_summary_model:
        exp_summary = get_exploration_summary_from_model(exp_summary_model)
        return exp_summary
    else:
        return None


def _get_exploration_summaries_from_models(exp_summary_models):
    """Given an iterable of ExpSummaryModel instances, create a dict containing
    corresponding exploration summary domain objects, keyed by id.
    """
    exploration_summaries = [
        get_exploration_summary_from_model(exp_summary_model)
        for exp_summary_model in exp_summary_models]
    result = {}
    for exp_summary in exploration_summaries:
        result[exp_summary.id] = exp_summary
    return result


def get_exploration_summaries_matching_ids(exp_ids):
    """Given a list of exploration ids, return a list with the corresponding
    summary domain objects (or None if the corresponding summary does not
    exist).
    """
    return [
        (get_exploration_summary_from_model(model) if model else None)
        for model in exp_models.ExpSummaryModel.get_multi(exp_ids)]


def get_non_private_exploration_summaries():
    """Returns a dict with all non-private exploration summary domain objects,
    keyed by their id.
    """
    return _get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_non_private())


def get_top_rated_exploration_summaries():
    """Returns a dict with top rated exploration summary domain objects,
    keyed by their id.
    """
    return _get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_top_rated())


def get_recently_published_exploration_summaries():
    """Returns a dict with all featured exploration summary domain objects,
    keyed by their id.
    """
    return _get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_recently_published())


def get_all_exploration_summaries():
    """Returns a dict with all exploration summary domain objects,
    keyed by their id.
    """
    return _get_exploration_summaries_from_models(
        exp_models.ExpSummaryModel.get_all())


def save_exploration_summary(exp_summary):
    """Save an exploration summary domain object as an ExpSummaryModel entity
    in the datastore.
    """
    exp_summary_model = exp_models.ExpSummaryModel(
        id=exp_summary.id,
        title=exp_summary.title,
        category=exp_summary.category,
        objective=exp_summary.objective,
        language_code=exp_summary.language_code,
        tags=exp_summary.tags,
        ratings=exp_summary.ratings,
        scaled_average_rating=exp_summary.scaled_average_rating,
        status=exp_summary.status,
        community_owned=exp_summary.community_owned,
        owner_ids=exp_summary.owner_ids,
        editor_ids=exp_summary.editor_ids,
        viewer_ids=exp_summary.viewer_ids,
        contributor_ids=exp_summary.contributor_ids,
        contributors_summary=exp_summary.contributors_summary,
        version=exp_summary.version,
        exploration_model_last_updated=(
            exp_summary.exploration_model_last_updated),
        exploration_model_created_on=(
            exp_summary.exploration_model_created_on),
        first_published_msec=(
            exp_summary.first_published_msec)
    )

    exp_summary_model.put()


def delete_exploration_summary(exploration_id):
    """Delete an exploration summary model."""

    exp_models.ExpSummaryModel.get(exploration_id).delete()


def get_search_rank_from_exp_summary(exp_summary):
    """Returns an integer determining the document's rank in search.

    Featured explorations get a ranking bump, and so do explorations that
    have been more recently updated. Good ratings will increase the ranking
    and bad ones will lower it.
    """
    # TODO(sll): Improve this calculation.
    rating_weightings = {'1': -5, '2': -2, '3': 2, '4': 5, '5': 10}

    rank = _DEFAULT_RANK + (
        _STATUS_PUBLICIZED_BONUS
        if exp_summary.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED
        else 0)

    if exp_summary.ratings:
        for rating_value in exp_summary.ratings:
            rank += (
                exp_summary.ratings[rating_value] *
                rating_weightings[rating_value])

    # Ranks must be non-negative.
    return max(rank, 0)


def get_collection_summaries_matching_ids(collection_ids):
    """Given a list of collection ids, return a list with the corresponding
    summary domain objects (or None if the corresponding summary does not
    exist).
    """
    return [
        (get_collection_summary_from_model(model) if model else None)
        for model in collection_models.CollectionSummaryModel.get_multi(
            collection_ids)]


def get_collection_summary_from_model(collection_summary_model):
    return collection_domain.CollectionSummary(
        collection_summary_model.id, collection_summary_model.title,
        collection_summary_model.category, collection_summary_model.objective,
        collection_summary_model.language_code, collection_summary_model.tags,
        collection_summary_model.status,
        collection_summary_model.community_owned,
        collection_summary_model.owner_ids,
        collection_summary_model.editor_ids,
        collection_summary_model.viewer_ids,
        collection_summary_model.contributor_ids,
        collection_summary_model.contributors_summary,
        collection_summary_model.version,
        collection_summary_model.node_count,
        collection_summary_model.collection_model_created_on,
        collection_summary_model.collection_model_last_updated
    )


def get_collection_summary_by_id(collection_id):
    """Returns a domain object representing a collection summary."""
    # TODO(msl): Maybe use memcache similarly to get_collection_by_id.
    collection_summary_model = collection_models.CollectionSummaryModel.get(
        collection_id)
    if collection_summary_model:
        collection_summary = get_collection_summary_from_model(
            collection_summary_model)
        return collection_summary
    else:
        return None


def is_exp_summary_editable(exp_summary, user_id=None):
    """Checks if a given user may edit an exploration by checking
    the given domain object.
    """
    return user_id is not None and (
        user_id in exp_summary.editor_ids
        or user_id in exp_summary.owner_ids
        or exp_summary.community_owned)


def is_collection_summary_editable(collection_summary, user_id=None):
    """Checks if a given user may edit an collection by checking
    the given domain object.
    """
    return user_id is not None and (
        user_id in collection_summary.editor_ids
        or user_id in collection_summary.owner_ids
        or collection_summary.community_owned)


def save_collection_summary(collection_summary):
    """Save a collection summary domain object as a CollectionSummaryModel
    entity in the datastore.
    """
    collection_summary_model = collection_models.CollectionSummaryModel(
        id=collection_summary.id,
        title=collection_summary.title,
        category=collection_summary.category,
        objective=collection_summary.objective,
        language_code=collection_summary.language_code,
        tags=collection_summary.tags,
        status=collection_summary.status,
        community_owned=collection_summary.community_owned,
        owner_ids=collection_summary.owner_ids,
        editor_ids=collection_summary.editor_ids,
        viewer_ids=collection_summary.viewer_ids,
        contributor_ids=collection_summary.contributor_ids,
        contributors_summary=collection_summary.contributors_summary,
        version=collection_summary.version,
        node_count=collection_summary.node_count,
        collection_model_last_updated=(
            collection_summary.collection_model_last_updated),
        collection_model_created_on=(
            collection_summary.collection_model_created_on)
    )

    collection_summary_model.put()


def delete_collection_summary(collection_id):
    """Delete a collection summary model."""

    collection_models.CollectionSummaryModel.get(collection_id).delete()
