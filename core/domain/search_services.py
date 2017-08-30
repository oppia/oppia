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

"""Commands for manipulating search rank"""

from core.platform import models
from core.domain import rights_manager

search_services = models.Registry.import_search_services()

# Name for the exploration search index.
SEARCH_INDEX_EXPLORATIONS = 'explorations'

# Name for the collection search index.
SEARCH_INDEX_COLLECTIONS = 'collections'

# This is done to prevent the rank hitting 0 too easily. Note that
# negative ranks are disallowed in the Search API.
_DEFAULT_RANK = 20

def index_exploration_summaries(exp_summaries):
    """Adds the explorations to the search index.

    Args:
        exp_summaries: list(ExpSummaryModel). List of Exp Summary domain
            objects to be indexed.
    """
    search_services.add_documents_to_index([
        _exp_summary_to_search_dict(exp_summary)
        for exp_summary in exp_summaries
        if _should_index_exploration(exp_summary)
    ], SEARCH_INDEX_EXPLORATIONS)


def _exp_summary_to_search_dict(exp_summary):
    """Updates the dict to be returned, whether the given exploration is to
    be indexed for further queries or not.

    Args:
        exp: Exploration. Exploration domain object.

    Returns:
        dict. The representation of the given exploration, in a form that can
        be used by the search index.
    """
    doc = {
        'id': exp_summary.id,
        'language_code': exp_summary.language_code,
        'title': exp_summary.title,
        'category': exp_summary.category,
        'tags': exp_summary.tags,
        'objective': exp_summary.objective,
        'rank': get_search_rank_from_exp_summary(exp_summary),
    }
    return doc


def _should_index_exploration(exp_summary):
    """Returns whether the given exploration should be indexed for future
    search queries.

    Args:
        exp_summary: ExpSummaryModel.
    """
    rights = rights_manager.get_exploration_rights(exp_summary.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def get_search_rank_from_exp_summary(exp_summary):
    """Returns an integer determining the document's rank in search.

    Featured explorations get a ranking bump, and so do explorations that
    have been more recently updated. Good ratings will increase the ranking
    and bad ones will lower it.

    Args:
        exp_summary: ExplorationSummary. ExplorationSummary domain object.

    Returns:
        int. Document's rank in search.
    """
    # TODO(sll): Improve this calculation.
    rating_weightings = {'1': -5, '2': -2, '3': 2, '4': 5, '5': 10}

    rank = _DEFAULT_RANK
    if exp_summary.ratings:
        for rating_value in exp_summary.ratings:
            rank += (
                exp_summary.ratings[rating_value] *
                rating_weightings[rating_value])

    # Ranks must be non-negative.
    return max(rank, 0)


def index_collection_summaries(collection_summaries):
    """Adds the collections to the search index.

    Args:
        collection_summaries: list(CollectionSummaryModel). List of
            Collection Summary domain objects to be indexed.
    """
    search_services.add_documents_to_index([
        _collection_summary_to_search_dict(collection_summary)
        for collection_summary in collection_summaries
        if _should_index_collection(collection_summary)
    ], SEARCH_INDEX_COLLECTIONS)


def _collection_summary_to_search_dict(collection_summary):
    """Converts a collection domain object to a search dict.

    Args:
        collection_summary: CollectionSummaryModel. The collection
            summary object to be converted.

    Returns:
        The search dict of the collection domain object.
    """
    doc = {
        'id': collection_summary.id,
        'title': collection_summary.title,
        'category': collection_summary.category,
        'objective': collection_summary.objective,
        'language_code': collection_summary.language_code,
        'tags': collection_summary.tags,
        'rank': _DEFAULT_RANK,
    }
    return doc


def _should_index_collection(collection):
    """Checks if a particular collection should be indexed.

    Args:
        collection: CollectionSummaryModel.
    """
    rights = rights_manager.get_collection_rights(collection.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE
