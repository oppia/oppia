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

from core import feconf, utils
from core.domain import (
    blog_domain,
    collection_domain,
    exp_domain,
    exp_fetchers,
    rights_domain,
    rights_manager,
    translation_domain,
    translation_fetchers,
)
from core.platform import models

from typing import Final, List, Optional, Tuple, TypedDict, Union

MYPY = False
if MYPY:  # pragma: no cover
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
    language_code: Union[str, List[str]]
    title: str
    category: str
    tags: List[str]
    objective: str
    rank: int


class ExplorationSearchDict(DomainSearchDict):
    """Dictionary representing the search dictionary of an exploration."""

    translated_titles: List[str]
    translated_objectives: List[str]
    translated_tags: List[str]


# This duplicates the check that #27083 adds as the public
# translation_services.get_up_to_date_translation. This copy is replaced by a
# call to that helper once #27083 merges.
def _get_up_to_date_translation(
    entity_translation: translation_domain.EntityTranslation,
    content_id: str,
) -> Optional[str]:
    """Returns the translation of the given content ID, if it is usable.

    Args:
        entity_translation: EntityTranslation. The entity's translations.
        content_id: str. The content ID to look up.

    Returns:
        str or None. The translated value, or None when there is no translation
        or the translation is stale.
    """
    translated_content = entity_translation.translations.get(content_id)
    # A translation that needs an update is stale because the English content
    # changed after it was accepted, so it is not shown.
    if (
        translated_content is not None
        and not translated_content.needs_update
        and isinstance(translated_content.content_value, str)
    ):
        return translated_content.content_value
    return None


def _get_translated_search_texts(
    exp_id: str, exp_version: int, num_tags: int
) -> Tuple[List[str], List[str], List[str], List[str]]:
    """Returns the translated titles, objectives, and tags for an exploration.

    Args:
        exp_id: str. The exploration ID.
        exp_version: int. The exploration version.
        num_tags: int. The number of tags in the exploration.

    Returns:
        tuple(list(str), list(str), list(str), list(str)). The sorted, de-duplicated
        translated titles, translated objectives, translated tags, and translated language codes.
    """
    entity_translations = (
        translation_fetchers.get_all_entity_translations_for_entity(
            feconf.TranslatableEntityType.EXPLORATION, exp_id, exp_version
        )
    )

    translated_titles = set()
    translated_objectives = set()
    translated_tags = set()
    translated_languages = set()

    for entity_translation in entity_translations:
        has_valid_translation = False

        # Title translation.
        title_translation = _get_up_to_date_translation(
            entity_translation, feconf.EXPLORATION_TITLE_CONTENT_ID
        )
        if title_translation is not None:
            translated_titles.add(title_translation)
            has_valid_translation = True

        # Objective translation.
        objective_translation = _get_up_to_date_translation(
            entity_translation, feconf.EXPLORATION_OBJECTIVE_CONTENT_ID
        )
        if objective_translation is not None:
            translated_objectives.add(objective_translation)
            has_valid_translation = True

        # Tags translations.
        for idx in range(num_tags):
            tag_content_id = f'{feconf.EXPLORATION_TAG_CONTENT_ID_PREFIX}_{idx}'
            tag_translation = _get_up_to_date_translation(
                entity_translation, tag_content_id
            )
            if tag_translation is not None:
                translated_tags.add(tag_translation)
                has_valid_translation = True

        if has_valid_translation:
            translated_languages.add(entity_translation.language_code)

    return (
        sorted(list(translated_titles)),
        sorted(list(translated_objectives)),
        sorted(list(translated_tags)),
        sorted(list(translated_languages)),
    )


def index_exploration_summaries(
    exp_summaries: List[exp_domain.ExplorationSummary],
) -> None:
    """Adds the explorations to the search index.

    Args:
        exp_summaries: list(ExplorationSummary). List of Exp Summary domain
            objects to be indexed.
    """
    indexable = [s for s in exp_summaries if _should_index_exploration(s)]
    explorations_dict = exp_fetchers.get_multiple_explorations_by_id(
        [s.id for s in indexable], strict=False
    )

    documents: List[ExplorationSearchDict] = []
    for exp_summary in indexable:
        exploration = explorations_dict.get(exp_summary.id)
        if exploration is not None:
            (
                translated_titles,
                translated_objectives,
                translated_tags,
                translated_languages,
            ) = _get_translated_search_texts(
                exp_summary.id, exploration.version, len(exploration.tags)
            )
        else:
            (
                translated_titles,
                translated_objectives,
                translated_tags,
                translated_languages,
            ) = (
                [],
                [],
                [],
                [],
            )

        documents.append(
            _exp_summary_to_search_dict(
                exp_summary,
                translated_titles,
                translated_objectives,
                translated_tags,
                translated_languages,
            )
        )

    platform_search_services.add_documents_to_index(
        documents,
        SEARCH_INDEX_EXPLORATIONS,
    )


def _exp_summary_to_search_dict(
    exp_summary: exp_domain.ExplorationSummary,
    translated_titles: List[str],
    translated_objectives: List[str],
    translated_tags: List[str],
    translated_languages: List[str],
) -> ExplorationSearchDict:
    """Updates the dict to be returned, whether the given exploration is to
    be indexed for further queries or not.

    Args:
        exp_summary: ExplorationSummary. ExplorationSummary domain object.
        translated_titles: list(str). List of translated titles.
        translated_objectives: list(str). List of translated objectives.
        translated_tags: list(str). List of translated tags.
        translated_languages: list(str). List of translated languages.

    Returns:
        dict. The representation of the given exploration, in a form that can
        be used by the search index.
    """
    doc: ExplorationSearchDict = {
        'id': exp_summary.id,
        'language_code': sorted(
            list(set([exp_summary.language_code] + translated_languages))
        ),
        'title': exp_summary.title,
        'category': exp_summary.category,
        'tags': exp_summary.tags,
        'objective': exp_summary.objective,
        'rank': get_search_rank_from_exp_summary(exp_summary),
        'translated_titles': translated_titles,
        'translated_objectives': translated_objectives,
        'translated_tags': translated_tags,
    }
    return doc


def _should_index_exploration(
    exp_summary: exp_domain.ExplorationSummary,
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
        not exp_summary.deleted
        and exp_summary.status != rights_domain.ACTIVITY_STATUS_PRIVATE
    )


def get_search_rank_from_exp_summary(
    exp_summary: exp_domain.ExplorationSummary,
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
    rating_weightings = {'1': -5, '2': -2, '3': 2, '4': 5, '5': 10}

    rank = _DEFAULT_RANK
    if exp_summary.ratings:
        for rating_value in exp_summary.ratings.keys():
            rank += (
                exp_summary.ratings[rating_value]
                * rating_weightings[rating_value]
            )

    # Ranks must be non-negative.
    return max(rank, 0)


def index_collection_summaries(
    collection_summaries: List[collection_domain.CollectionSummary],
) -> None:
    """Adds the collections to the search index.

    Args:
        collection_summaries: list(CollectionSummary). List of collection
            summary domain objects to be indexed.
    """
    platform_search_services.add_documents_to_index(
        [
            _collection_summary_to_search_dict(collection_summary)
            for collection_summary in collection_summaries
            if _should_index_collection(collection_summary)
        ],
        SEARCH_INDEX_COLLECTIONS,
    )


def _collection_summary_to_search_dict(
    collection_summary: collection_domain.CollectionSummary,
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
    collection: collection_domain.CollectionSummary,
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
    offset: Optional[int] = None,
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
        query,
        SEARCH_INDEX_EXPLORATIONS,
        categories,
        language_codes,
        offset=offset,
        size=size,
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
        exploration_ids, SEARCH_INDEX_EXPLORATIONS
    )


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
    offset: Optional[int] = None,
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
        query,
        SEARCH_INDEX_COLLECTIONS,
        categories,
        language_codes,
        offset=offset,
        size=size,
    )
    return result_ids, result_offset


def delete_collections_from_search_index(collection_ids: List[str]) -> None:
    """Removes the given collections from the search index.

    Args:
        collection_ids: list(str). List of IDs of the collections to be removed
            from the search index.
    """
    platform_search_services.delete_documents_from_index(
        collection_ids, SEARCH_INDEX_COLLECTIONS
    )


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
    summary: str
    rank: int


def index_blog_post_summaries(
    blog_post_summaries: List[blog_domain.BlogPostSummary],
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
    platform_search_services.add_documents_to_index(
        [doc for doc in docs_to_index if doc], SEARCH_INDEX_BLOG_POSTS
    )


def _blog_post_summary_to_search_dict(
    blog_post_summary: blog_domain.BlogPostSummary,
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
        not blog_post_summary.deleted
        and blog_post_summary.published_on is not None
    ):
        doc: BlogPostSummaryDomainSearchDict = {
            'id': blog_post_summary.id,
            'title': blog_post_summary.title,
            'tags': blog_post_summary.tags,
            'summary': blog_post_summary.summary,
            'rank': math.floor(
                utils.get_time_in_millisecs(blog_post_summary.published_on)
            ),
        }
        return doc
    return None


def search_blog_post_summaries(
    query: str, tags: List[str], size: int, offset: Optional[int] = None
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
            query, tags, offset=offset, size=size
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
        [blog_post_id], SEARCH_INDEX_BLOG_POSTS
    )


def clear_blog_post_summaries_search_index() -> None:
    """Clears the blog post search index.

    WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    platform_search_services.clear_index(SEARCH_INDEX_BLOG_POSTS)
