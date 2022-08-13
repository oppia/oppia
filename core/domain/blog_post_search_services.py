# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Commands for operating on the search status of blog post summaries."""

from __future__ import annotations
from core import utils

from core.domain import blog_domain
from core.domain import user_services
from core.platform import models

from typing import List, Optional, Tuple, cast
from typing_extensions import Final, TypedDict


MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import search_services as platform_search_services

platform_search_services = models.Registry.import_search_services()

# Name for the blog post search index.
SEARCH_INDEX_BLOG_POSTS: Final = 'blog-posts'

class BlogPostSummaryDomainSearchDict(TypedDict):
    """Dictionary representing the search dictionary of a blog post summary
    domain object.
    """

    id: str
    title: str
    tags: List[str]
    author_username: str
    rank: int


def index_blog_post_summaries(
    blog_post_summaries: List[blog_domain.BlogPostSummary]
) -> None:
    """Adds the blog post summaries to the search index.

    Args:
        blog_post_summaries: list(BlogPostSummary). List of BlogPostSummary
            domain objects to be indexed.
    """
    # The argument `documents` of add_documents_to_index() is annotated
    # with List[Dict[str, Any]] because this method can accept any kind
    # of dictionaries, but here we are providing a strict type
    # `List[DomainSearchDict]` which causes a conflict in type assignment
    # and due to this MyPy throws an error. So, to silent the error, we used
    # ignore here.
    platform_search_services.add_documents_to_index([
       _blog_post_summary_to_search_dict(blog_post_summary)  # type: ignore[misc]
        for blog_post_summary in blog_post_summaries
        if _should_index_blog_post_summary(blog_post_summary)
    ], SEARCH_INDEX_BLOG_POSTS)


def _blog_post_summary_to_search_dict(
    blog_post_summary: blog_domain.BlogPostSummary
) -> BlogPostSummaryDomainSearchDict:
    """Updates the dict to be returned, whether the given blog post summary is
    to be indexed for further queries or not.

    Args:
        blog_post_summary: BlogPostSummary. BlogPostSummary domain object.

    Returns:
        dict. The representation of the given blog post summary, in a form that
        can be used by the search index.
    """
    author_settings = (
        user_services.get_user_settings(blog_post_summary.author_id))

    doc: BlogPostSummaryDomainSearchDict = {
        'id': blog_post_summary.id,
        'title': blog_post_summary.title,
        'tags': blog_post_summary.tags,
        'author_username': author_settings.username,
        'rank': utils.get_time_in_millisecs(blog_post_summary.published_on)
    }

    return doc


def _should_index_blog_post_summary(
    blog_post_summary: blog_domain.BlogPostSummary
) -> bool:
    """Returns whether the given blog post should be indexed for future
    search queries.

    Args:
        blog_post_summary: BlogPostSummary. BlogPostSummary domain object.

    Returns:
        bool. Whether the given blog post should be indexed for future
        search queries.
    """
    return (
        not blog_post_summary.deleted and
        blog_post_summary.published_on is not None
    )


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
    # The return type of 'platform_search_services.search()' method is
    # tuple with 2 elements. For the first tuple element, it's return type
    # is Union[List[Dict[str, Any]], List[str]], but here we are sure that
    # the type of first element is always an List[str]. So, to narrow down
    # the type from Union to List, we used cast here.
    result_ids, result_offset = cast(
        Tuple[List[str], Optional[int]],
        platform_search_services.blog_post_summaries_search(
            query,
            SEARCH_INDEX_BLOG_POSTS,
            tags,
            offset=offset,
            size=size,
            ids_only=True
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
    """WARNING: This runs in-request, and may therefore fail if there are too
    many entries in the index.
    """
    platform_search_services.clear_index(SEARCH_INDEX_BLOG_POSTS)
