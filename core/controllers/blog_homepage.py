# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the blog homepage."""

from __future__ import annotations

import logging

from core import feconf
from core import utils
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import blog_domain
from core.domain import blog_services
from core.domain import config_domain
from core.domain import user_services

from typing import Dict, Final, List, Optional, Tuple, TypedDict

BLOG_ADMIN: Final = feconf.ROLE_ID_BLOG_ADMIN
BLOG_POST_EDITOR: Final = feconf.ROLE_ID_BLOG_POST_EDITOR
MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST: Final = (
    feconf.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST
)


class BlogCardSummaryDict(TypedDict):
    """Type for the dict representation of blog_card_summary_dict."""

    id: str
    title: str
    summary: str
    author_username: Optional[str]
    profile_pic_url: Optional[str]
    url_fragment: str
    tags: List[str]
    thumbnail_filename: Optional[str]
    last_updated: Optional[str]
    published_on: Optional[str]
    displayed_author_name: str


class AuthorsBlogPostDict(TypedDict):
    """Dict type for author's BlogPost object."""

    id: str
    title: str
    displayed_author_name: str
    content: str
    url_fragment: str
    tags: List[str]
    thumbnail_filename: Optional[str]
    last_updated: Optional[str]
    published_on: Optional[str]


def _get_blog_card_summary_dicts_for_homepage(
    summaries: List[blog_domain.BlogPostSummary]
) -> List[BlogCardSummaryDict]:
    """Creates summary dicts for use in blog homepage.

    Args:
        summaries: list(BlogPostSummary). List of blog post summary
            domain objects.

    Returns:
        list(dict). The list of blog post summary dicts.
    """
    summary_dicts: List[BlogCardSummaryDict] = []
    for summary in summaries:
        summary_dict = summary.to_dict()
        user_settings = user_services.get_user_settings(
            summary_dict['author_id'], strict=False)
        author_details = blog_services.get_blog_author_details(
            summary_dict['author_id'])
        if user_settings:
            card_summary_dict: BlogCardSummaryDict = {
                'id': summary_dict['id'],
                'title': summary_dict['title'],
                'summary': summary_dict['summary'],
                'author_username': user_settings.username,
                'profile_pic_url': user_settings.profile_picture_data_url,
                'tags': summary_dict['tags'],
                'thumbnail_filename': summary_dict['thumbnail_filename'],
                'url_fragment': summary_dict['url_fragment'],
                'published_on': summary_dict['published_on'],
                'last_updated': summary_dict['last_updated'],
                'displayed_author_name': author_details.displayed_author_name
            }
        else:
            card_summary_dict = {
                'id': summary_dict['id'],
                'title': summary_dict['title'],
                'summary': summary_dict['summary'],
                'author_username': 'author account deleted',
                'profile_pic_url': None,
                'tags': summary_dict['tags'],
                'thumbnail_filename': summary_dict['thumbnail_filename'],
                'url_fragment': summary_dict['url_fragment'],
                'published_on': summary_dict['published_on'],
                'last_updated': summary_dict['last_updated'],
                'displayed_author_name': author_details.displayed_author_name
            }
        summary_dicts.append(card_summary_dict)
    return summary_dicts


def _get_matching_blog_card_summary_dicts(
    query_string: str, tags: list[str], size: int, search_offset: Optional[int]
) -> Tuple[List[blog_domain.BlogPostSummary], Optional[int]]:
    """Given the details of a query and a search offset, returns a list of
    matching blog card summary domain objects that satisfy the query.

    Args:
        query_string: str. The search query string (this is what the user
            enters).
        tags: list(str). The list of tags to query for. If it is empty, no
            tags filter is applied to the results. If it is not empty, then
            a result is considered valid if it matches at least one of these
            tags.
        size: int. The maximum number of blog post summary domain objects to
            be returned.
        search_offset: int or None. Offset indicating where, in the list of
            blog post summaries search results, to start the search from.
            If None, blog post summaries search results are returned from
            beginning.

    Returns:
        tuple. A tuple consisting of two elements:
            - list(dict). Each element in this list is a blog post summary
            domain object, representing a search result to popoulate data on
            blog card.
            - int. The blog post search index offset from which to start the
                next search.
    """
    blog_post_ids, new_search_offset = (
        blog_services.get_blog_post_ids_matching_query(
            query_string, tags, size, offset=search_offset))
    blog_post_summaries = (
        blog_services.get_blog_post_summary_models_by_ids(blog_post_ids))
    if len(blog_post_summaries) == feconf.DEFAULT_QUERY_LIMIT:
        logging.exception(
            '%s blog post summaries were fetched to load the search/filter by '
            'result page. You may be running up against the default query '
            'limits.'
            % feconf.DEFAULT_QUERY_LIMIT)
    return blog_post_summaries, new_search_offset


class BlogHomepageDataHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BlogHomepageDataHandler's normalized_request
    dictionary.
    """

    offset: str


class BlogHomepageDataHandler(
    base.BaseHandler[
        Dict[str, str],
        BlogHomepageDataHandlerNormalizedRequestDict
    ]
):
    """Provides blog cards data and default tags data for the blog homepage."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'offset': {
                'schema': {
                    'type': 'basestring'
                },
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        offset = int(self.normalized_request['offset'])
        published_post_summaries = (
            blog_services.get_published_blog_post_summaries(offset))
        published_post_summary_dicts = []
        if published_post_summaries:
            published_post_summary_dicts = (
                _get_blog_card_summary_dicts_for_homepage(
                    published_post_summaries))
        # Total number of published blog posts is calculated only when we load
        # the blog home page for the first time (search offset will be 0).
        # It is not required to load other subsequent pages as the value is
        # already loaded in the frontend.
        if offset != 0:
            self.values.update({
                'blog_post_summary_dicts': published_post_summary_dicts,
            })
            self.render_json(self.values)
        else:
            number_of_published_blog_post_summaries = (
                blog_services
                .get_total_number_of_published_blog_post_summaries()
            )
            list_of_default_tags = config_domain.Registry.get_config_property(
                'list_of_default_tags_for_blog_post', strict=True
            ).value
            self.values.update({
                'no_of_blog_post_summaries': (
                    number_of_published_blog_post_summaries),
                'blog_post_summary_dicts': published_post_summary_dicts,
                'list_of_default_tags': list_of_default_tags
            })
            self.render_json(self.values)


class BlogPostDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides blog post data for the blog post page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'blog_post_url': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, blog_post_url: str) -> None:
        """Handles GET requests."""
        blog_post = blog_services.get_blog_post_by_url_fragment(blog_post_url)
        if not blog_post:
            raise self.PageNotFoundException(
                Exception(
                    'The blog post page with the given url doesn\'t exist.'))
        user_settings = user_services.get_user_settings(
            blog_post.author_id, strict=False)
        if user_settings:
            profile_picture_data_url = (
                user_settings.profile_picture_data_url)
            author_username = user_settings.username
        else:
            profile_picture_data_url = None
            author_username = 'author account deleted'
        author_details = blog_services.get_blog_author_details(
            blog_post.author_id)
        blog_post_dict = blog_post.to_dict()
        authors_blog_post_dict: AuthorsBlogPostDict = {
            'id': blog_post_dict['id'],
            'title': blog_post_dict['title'],
            'content': blog_post_dict['content'],
            'thumbnail_filename': blog_post_dict['thumbnail_filename'],
            'tags': blog_post_dict['tags'],
            'url_fragment': blog_post_dict['url_fragment'],
            'published_on': blog_post_dict['published_on'],
            'last_updated': blog_post_dict['last_updated'],
            'displayed_author_name': author_details.displayed_author_name
        }
        # We fetch 1 more than the required blog post summaries as the result
        # might contain the blog post which is currently being viewed.
        summaries, _ = (
            _get_matching_blog_card_summary_dicts(
                '',
                authors_blog_post_dict['tags'],
                MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST + 1,
                None
            )
        )

        if len(summaries) < MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST + 1:
            summary_ids = [summary.id for summary in summaries]
            # We fetch more blog post summaries than the deficit as the result
            # might contain the blog post summaries which are already fetched.
            size = MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST + len(summaries)
            resultant_summaries = (
                blog_services.get_published_blog_post_summaries_by_user_id(
                    blog_post.author_id, size
                )
            )
            summaries.extend(list(
                filter(
                    lambda i: i.id not in summary_ids, resultant_summaries
                )
            ))
        if len(summaries) < MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST + 1:
            summary_ids = [summary.id for summary in summaries]
            # We fetch more blog post summaries than the deficit as the result
            # might contain the blog post summaries which are already fetched.
            size = MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST + len(summaries)
            resultant_summaries = (
                blog_services.get_published_blog_post_summaries(0, size))
            summaries.extend(list(
                filter(
                    lambda i: i.id not in summary_ids, resultant_summaries
                )
            ))

        for summary in summaries[:MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST]:
            if summary.id == authors_blog_post_dict['id']:
                summaries.remove(summary)
                break

        self.values.update({
            'author_username': author_username,
            'profile_picture_data_url': profile_picture_data_url,
            'blog_post_dict': authors_blog_post_dict,
            'summary_dicts': _get_blog_card_summary_dicts_for_homepage(
                summaries[:MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST])
        })
        self.render_json(self.values)


class AuthorsPageHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides blog cards data and author data for the authors page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'author_username': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'offset': {
                'schema': {
                    'type': 'basestring'
                },
            }
        },
    }

    @acl_decorators.open_access
    def get(self, author_username: str) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        offset = int(self.normalized_request['offset'])

        user_settings = (
            user_services.get_user_settings_from_username(author_username)
        )
        if user_settings is None:
            raise Exception(
                'No user settings found for the given author_username: %s' %
                author_username
            )

        author_details = blog_services.get_blog_author_details(
            user_settings.user_id).to_dict()
        num_of_published_blog_post_summaries = (
                blog_services
                .get_total_number_of_published_blog_post_summaries_by_author(
                    user_settings.user_id
                )
            )
        blog_post_summaries = (
            blog_services.get_published_blog_post_summaries_by_user_id(
                user_settings.user_id,
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE,
                offset
            )
        )
        blog_post_summary_dicts = []
        if blog_post_summaries:
            blog_post_summary_dicts = (
                _get_blog_card_summary_dicts_for_homepage(
                    blog_post_summaries))

        self.values.update({
            'author_details': author_details,
            'profile_picture_data_url': (
                user_settings.profile_picture_data_url),
            'no_of_blog_post_summaries': num_of_published_blog_post_summaries,
            'summary_dicts': blog_post_summary_dicts
        })
        self.render_json(self.values)


class BlogPostSearchHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BlogPostSearchHandler's normalized_request
    dictionary.
    """

    q: str
    tags: str
    offset: Optional[int]


class BlogPostSearchHandler(
    base.BaseHandler[
        Dict[str, str],
        BlogPostSearchHandlerNormalizedRequestDict
    ]
):
    """Provides blog cards for blog search page based on query provided and
    applied tag filters.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'q': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': ''
            },
            'tags': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_search_query_string'
                    }, {
                        'id': 'is_regex_matched',
                        'regex_pattern': '[\\-\\w+()"\\s]*'
                    }]
                },
                'default_value': ''
            },
            'offset': {
                'schema': {
                    'type': 'int'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        query_string = utils.get_formatted_query_string(
            self.normalized_request['q']
        )

        # If there is a tags parameter, it should be in the following form:
        # tags=("GSOC" OR "Math"), tags=("Algebra" OR "Geometry" OR "Maths")
        # tags=("GSOC")
        tags_string = self.normalized_request['tags']
        tags = utils.convert_filter_parameter_string_into_list(tags_string)

        search_offset = self.normalized_request.get('offset')

        blog_post_summaries, new_search_offset = (
            _get_matching_blog_card_summary_dicts(
                query_string,
                tags,
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE,
                search_offset
            )
        )
        blog_post_summary_dicts = (
            _get_blog_card_summary_dicts_for_homepage(blog_post_summaries))
        list_of_default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post', strict=True
        ).value

        self.values.update({
            'blog_post_summaries_list': blog_post_summary_dicts,
            'search_offset': new_search_offset,
            'list_of_default_tags': list_of_default_tags,
        })

        self.render_json(self.values)
