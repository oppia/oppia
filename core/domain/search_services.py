# coding: utf-8
#
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

"""Commands for operating on the search status of activities and blog posts."""

from __future__ import annotations

import math

from core import utils
from core.domain import blog_domain
from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import rights_domain
from core.domain import rights_manager
from core.platform import models

from typing import Final, List, Optional, Tuple, TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import search_services as platform_search_services

platform_search_services = models.Registry.import_search_services()

# "NOTE TO DEVELOPERS: If you change any of these index names or add any new
# indexes, please contact Sean to update permissions on the ElasticSearch
# production servers, otherwise search operations will fail in production.
# Please do this before merging the PR. Thanks!"
# Name for the exploration search index.
SEARCH_INDEX_EXPLORATIONS: Final = 'explorations'

# "NOTE TO DEVELOPERS: If you change any of these index names or add any new
# indexes, please contact Sean to update permissions on the ElasticSearch
# production servers, otherwise search operations will fail in production.
# Please do this before merging the PR. Thanks!"
# Name for the collection search index.
SEARCH_INDEX_COLLECTIONS: Final = 'collections'

# "NOTE TO DEVELOPERS: If you change any of these index names or add any new
# indexes, please contact Sean to update permissions on the ElasticSearch
# production servers, otherwise search operations will fail in production.
# Please do this before merging the PR. Thanks!"
# Name for the blog post search index.
SEARCH_INDEX_BLOG_POSTS: Final = 'blog-posts'

# This is done to prevent the rank hitting 0 too easily. Note that
# negative ranks are disallowed in the Search API.
_DEFAULT_RANK: Final = 20


class DomainSearchDict(TypedDict):
    """Dictionary representing the search dictionary of a domain object."""

    id: str
    language_code: str
    title: str
    category: str
    tags: List[str]
    objective: str
    rank: int


def index_exploration_summaries(
    exp_summaries: List[exp_domain.ExplorationSummary]
) -> None:
    """Adds the explorations to the search index.

    Args:
        exp_summaries: list(ExplorationSummary). List of Exp Summary domain
            objects to be indexed.
    """
    platform_search_services.add_documents_to_index([
        _exp_summary_to_search_dict(exp_summary)
        for exp_summary in exp_summaries
        if _should_index_exploration(exp_summary)
    ], SEARCH_INDEX_EXPLORATIONS)


def _exp_summary_to_search_dict(
    exp_summary: exp_domain.ExplorationSummary
) -> DomainSearchDict:
    """Updates the dict to be returned, whether the given exploration is to
    be indexed for further queries or not.

    Args:
        exp_summary: ExplorationSummary. ExplorationSummary domain object.

    Returns:
        dict. The representation of the given exploration, in a form that can
        be used by the search index.
    """
    doc: DomainSearchDict = {
        'id': exp_summary.id,
        'language_code': exp_summary.language_code,
        'title': exp_summary.title,
        'category': exp_summary.category,
        'tags': exp_summary.tags,
        'objective': exp_summary.objective,
        'rank': get_search_rank_from_exp_summary(exp_summary),
    }
    return doc


def _should_index_exploration(
    exp_summary: exp_domain.ExplorationSummary
) -> bool:
    """Returns whether the given exploration should be indexed for future
    search queries.

    Args:
        exp_summary: ExplorationSummary. ExplorationSummary domain object.

    Returns:
        bool. Whether the given exploration should be indexed for future
        search queries.
    """
    return (
        not exp_summary.deleted and
        exp_summary.status != rights_domain.ACTIVITY_STATUS_PRIVATE
    )


def get_search_rank_from_exp_summary(
    exp_summary: exp_domain.ExplorationSummary
) -> int:
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
        for rating_value in exp_summary.ratings.keys():
            rank += (
                exp_summary.ratings[rating_value] *
                rating_weightings[rating_value]
            )

    # Ranks must be non-negative.
    return max(rank, 0)


def index_collection_summaries(
    collection_summaries: List[collection_domain.CollectionSummary]
) -> None:
    """Adds the collections to the search index.

    Args:
        collection_summaries: list(CollectionSummary). List of collection
            summary domain objects to be indexed.
    """
    platform_search_services.add_documents_to_index([
        _collection_summary_to_search_dict(collection_summary)
        for collection_summary in collection_summaries
        if _should_index_collection(collection_summary)
    ], SEARCH_INDEX_COLLECTIONS)


def _collection_summary_to_search_dict(
    collection_summary: collection_domain.CollectionSummary
) -> DomainSearchDict:
    """Converts a collection domain object to a search dict.

    Args:
        collection_summary: CollectionSummary. The collection
            summary object to be converted.

    Returns:
        dict. The search dict of the collection domain object.
    """
    doc: DomainSearchDict = {
        'id': collection_summary.id,
        'title': collection_summary.title,
        'category': collection_summary.category,
        'objective': collection_summary.objective,
        'language_code': collection_summary.language_code,
        'tags': collection_summary.tags,
        'rank': _DEFAULT_RANK,
    }
    return doc


def _should_index_collection(
    collection: collection_domain.CollectionSummary
) -> bool:
    """Checks if a particular collection should be indexed.

    Args:
        collection: CollectionSummary. CollectionSummary domain object.

    Returns:
        bool. Whether a particular collection should be indexed.
    """
    rights = rights_manager.get_collection_rights(collection.id)
    return rights.status != rights_domain.ACTIVITY_STATUS_PRIVATE


def search_explorations(
    query: str,
    categories: List[str],
    language_codes: List[str],
    size: int,
    offset: Optional[int] = None
) -> Tuple[List[str], Optional[int]]:
    """Searches through the available explorations.

    Args:
        query: str. The query string to search for.
        categories: list(str). The list of categories to query for. If it is
            empty, no category filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these categories.
        language_codes: list(str). The list of language codes to query for. If
            it is empty, no language code filter is applied to the results. If
            it is not empty, then a result is considered valid if it matches at
            least one of these language codes.
        size: int. The maximum number of results to return.
        offset: int or None. A marker that is used to get the next page of
            results. If there are more documents that match the query than
            'size', this function will return an offset to get the next page.

    Returns:
        tuple. A 2-tuple consisting of:
            - list(str). A list of exploration ids that match the query.
            - int or None. An offset if there are more matching explorations to
              fetch, None otherwise. If an offset is returned, it will be a
              web-safe string that can be used in URLs.
    """
    result_ids, result_offset = platform_search_services.search(
        query, SEARCH_INDEX_EXPLORATIONS,
        categories, language_codes,
        offset=offset, size=size
    )
    return result_ids, result_offset


def delete_explorations_from_search_index(exploration_ids: List[str]) -> None:
    """Deletes the documents corresponding to these exploration_ids from the
    search index.

    Args:
        exploration_ids: list(str). A list of exploration ids whose
            documents are to be deleted from the search index.
    """
    platform_search_services.delete_documents_from_index(
        exploration_ids, SEARCH_INDEX_EXPLORATIONS)


def clear_exploration_search_index() -> None:
    """WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    platform_search_services.clear_index(SEARCH_INDEX_EXPLORATIONS)


def search_collections(
    query: str,
    categories: List[str],
    language_codes: List[str],
    size: int,
    offset: Optional[int] = None
) -> Tuple[List[str], Optional[int]]:
    """Searches through the available collections.

    Args:
        query: str. The query string to search for.
        categories: list(str). The list of categories to query for. If it is
            empty, no category filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these categories.
        language_codes: list(str). The list of language codes to query for. If
            it is empty, no language code filter is applied to the results. If
            it is not empty, then a result is considered valid if it matches at
            least one of these language codes.
        size: int. The maximum number of results to return.
        offset: int|None. An offset, used to get the next page of results.
            If there are more documents that match the query than 'size', this
            function will return an offset to get the next page.

    Returns:
        2-tuple of (collection_ids, offset). Where:
            - A list of collection ids that match the query.
            - An offset if there are more matching collections to fetch, None
              otherwise. If an offset is returned, it will be a web-safe string
              that can be used in URLs.
    """
    result_ids, result_offset = platform_search_services.search(
        query, SEARCH_INDEX_COLLECTIONS,
        categories, language_codes,
        offset=offset, size=size
    )
    return result_ids, result_offset


def delete_collections_from_search_index(collection_ids: List[str]) -> None:
    """Removes the given collections from the search index.

    Args:
        collection_ids: list(str). List of IDs of the collections to be removed
            from the search index.
    """
    platform_search_services.delete_documents_from_index(
        collection_ids, SEARCH_INDEX_COLLECTIONS)


def clear_collection_search_index() -> None:
    """Clears the search index.

    WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    platform_search_services.clear_index(SEARCH_INDEX_COLLECTIONS)


class BlogPostSummaryDomainSearchDict(TypedDict):
    """Dictionary representing the search dictionary of a blog post summary
    domain object.
    """

    id: str
    title: str
    tags: List[str]
    rank: int


def index_blog_post_summaries(
    blog_post_summaries: List[blog_domain.BlogPostSummary]
) -> None:
    """Adds the blog post summaries to the search index.

    Args:
        blog_post_summaries: list(BlogPostSummary). List of BlogPostSummary
            domain objects to be indexed.
    """

    docs_to_index = [
        _blog_post_summary_to_search_dict(blog_post_summary)
        for blog_post_summary in blog_post_summaries
    ]
    platform_search_services.add_documents_to_index([
       doc for doc in docs_to_index if doc
    ], SEARCH_INDEX_BLOG_POSTS)


def _blog_post_summary_to_search_dict(
    blog_post_summary: blog_domain.BlogPostSummary
) -> Optional[BlogPostSummaryDomainSearchDict]:
    """Updates the dict to be returned, whether the given blog post summary is
    to be indexed for further queries or not.

    Args:
        blog_post_summary: BlogPostSummary. BlogPostSummary domain object.

    Returns:
        dict. The representation of the given blog post summary, in a form that
        can be used by the search index.
    """
    if (
        not blog_post_summary.deleted and
        blog_post_summary.published_on is not None
    ):
        doc: BlogPostSummaryDomainSearchDict = {
            'id': blog_post_summary.id,
            'title': blog_post_summary.title,
            'tags': blog_post_summary.tags,
            'rank': math.floor(
                utils.get_time_in_millisecs(blog_post_summary.published_on))
        }
        return doc
    return None


def search_blog_post_summaries(
    query: str,
    tags: List[str],
    size: int,
    offset: Optional[int] = None
) -> Tuple[List[str], Optional[int]]:
    """Searches through the available blog post summaries.

    Args:
        query: str. The query string to search for.
        tags: list(str). The list of tags to query for. If it is
            empty, no tags filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these tags.
        size: int. The maximum number of results to return.
        offset: int or None. A marker that is used to get the next page of
            results. If there are more documents that match the query than
            'size', this function will return an offset to get the next page.

    Returns:
        tuple. A 2-tuple consisting of:
            - list(str). A list of blog post ids that match the query.
            - int or None. An offset if there are more matching blog post
              summaries to fetch, None otherwise. If an offset is returned, it
              will be a web-safe string that can be used in URLs.
    """
    result_ids, result_offset = (
        platform_search_services.blog_post_summaries_search(
            query,
            tags,
            offset=offset,
            size=size
        )
    )
    return result_ids, result_offset


def delete_blog_post_summary_from_search_index(blog_post_id: str) -> None:
    """Deletes the documents corresponding to the blog_id from the
    search index.

    Args:
        blog_post_id: str. Blog post id whose document are to be deleted from
            the search index.
    """
    # The argument type of delete_documents_from_index() is List[str],
    # therefore, we provide [blog_post_id] as argument.
    platform_search_services.delete_documents_from_index(
        [blog_post_id], SEARCH_INDEX_BLOG_POSTS)


def clear_blog_post_summaries_search_index() -> None:
    """Clears the blog post search index.

    WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    platform_search_services.clear_index(SEARCH_INDEX_BLOG_POSTS)
