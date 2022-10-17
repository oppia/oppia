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
from core.domain import blog_services
from core.domain import config_domain
from core.domain import user_services

from typing import Any, Dict, List, Tuple

BLOG_ADMIN = feconf.ROLE_ID_BLOG_ADMIN
BLOG_POST_EDITOR = feconf.ROLE_ID_BLOG_POST_EDITOR


def _get_blog_card_summary_dicts_for_homepage(summaries):
    """Creates summary dicts for use in blog homepage.

    Args:
        summaries: list(BlogPostSummary). List of blog post summary
            domain objects.

    Returns:
        list(dict). The list of blog post summary dicts.
    """
    summary_dicts = []
    for summary in summaries:
        summary_dict = summary.to_dict()
        user_settings = user_services.get_user_settings(
            summary_dict['author_id'])
        summary_dict['author_name'] = user_settings.username
        summary_dict['profile_pic_url'] = user_settings.profile_picture_data_url
        del summary_dict['author_id']
        summary_dicts.append(summary_dict)
    return summary_dicts


# Here we are using Dict[str, Any] for the return value
# `blog_post_summary_dicts` since we have to return a list with each element
# being domain object converted to a dictionary in the tuple.
def _get_matching_blog_card_summary_dicts(
    query_string: str, tags: list[str], search_offset: int
) -> Tuple[List[Dict[str, Any]], int]:
    """Given the details of a query and a search offset, returns a list of
    matching blog card summary dicts that satisfy the query.

    Args:
        query_string: str. The search query string (this is what the user
            enters).
        tags: list(str). The list of tags to query for. If it is empty, no
            tags filter is applied to the results. If it is not empty, then
            a result is considered valid if it matches at least one of these
            tags.
        search_offset: int or None. Offset indicating where, in the list of
            blog post summaries search results, to start the search from.
            If None, blog post summaries search results are returned from
            beginning.

    Returns:
        tuple. A tuple consisting of two elements:
            - list(dict). Each element in this list is a blog post summary dict,
            representing a search result to popoulate data on blog card.
            - int. The blog post search index offset from which to start the
                next search.
    """
    blog_post_ids, new_search_offset = (
        blog_services.get_blog_post_ids_matching_query(
            query_string, tags, offset=search_offset))
    blog_post_summaries = (
        blog_services.get_blog_post_summary_models_by_ids(blog_post_ids))
    blog_post_summary_dicts = (
        _get_blog_card_summary_dicts_for_homepage(blog_post_summaries))
    if len(blog_post_summary_dicts) == feconf.DEFAULT_QUERY_LIMIT:
        logging.exception(
            '%s blog post summaries were fetched to load the search/filter by '
            'result page. You may be running up against the default query '
            'limits.'
            % feconf.DEFAULT_QUERY_LIMIT)
    return blog_post_summary_dicts, new_search_offset


class BlogHomepageDataHandler(base.BaseHandler):
    """Provides blog cards data and default tags data for the blog homepage."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
    }

    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        published_post_summaries = (
            blog_services.get_published_blog_post_summaries())
        published_post_summary_dicts = []
        if published_post_summaries:
            published_post_summary_dicts = (
                _get_blog_card_summary_dicts_for_homepage(
                    published_post_summaries))
        list_of_default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post').value
        self.values.update({
            'blog_post_summary_dicts': published_post_summary_dicts,
            'list_of_default_tags': list_of_default_tags
        })
        self.render_json(self.values)


class BlogPostHandler(base.BaseHandler):
    """Provides blog post data for the blog post page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'blog_post_url': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
    }

    @acl_decorators.open_access
    def get(self, blog_post_url):
        """Handles GET requests."""
        blog_post = blog_services.get_blog_post_by_url_fragment(blog_post_url)
        if not blog_post:
            raise self.PageNotFoundException(
                Exception(
                    'The blog post page with the given url doesn\'t exist.'))
        user_settings = user_services.get_user_settings(blog_post.author_id)
        blog_post_dict = (
            blog_services.get_blog_post_from_model(blog_post).to_dict())
        blog_post_dict['author_name'] = user_settings.username
        del blog_post_dict['author_id']
        blog_post_summaries = (
            blog_services.get_published_blog_post_summaries_by_user_id(
                blog_post.author_id,
                feconf.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST))
        blog_post_summary_dicts = (
            _get_blog_card_summary_dicts_for_homepage(blog_post_summaries))

        self.values.update({
            'profile_picture_data_url': user_settings.profile_picture_data_url,
            'blog_post_dict': blog_post_dict,
            'summary_dicts': blog_post_summary_dicts
        })
        self.render_json(self.values)


class AuthorsPageHandler(base.BaseHandler):
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
        'GET': {},
    }

    @acl_decorators.open_access
    def get(self, author_username):
        """Handles GET requests."""
        user_settings = (
            user_services.get_user_settings_from_username(author_username))
        if user_settings is None:
            raise self.PageNotFoundException(
                Exception(
                    'User with given username does not exist'))
        if not any(role in user_settings.roles for role in [
                BLOG_ADMIN, BLOG_POST_EDITOR]):
            raise self.PageNotFoundException(
                Exception(
                    'The given user is not a blog post author.'))
        blog_post_summaries = (
            blog_services.get_published_blog_post_summaries_by_user_id(
                user_settings.user_id,
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_AUTHOR_SPECIFIC_BLOG_POST_PAGE)) # pylint: disable=line-too-long
        blog_post_summary_dicts = []
        if blog_post_summaries:
            blog_post_summary_dicts = (
                _get_blog_card_summary_dicts_for_homepage(
                    blog_post_summaries))

        self.values.update({
            'author_name': author_username,
            'profile_picture_data_url': (
                user_settings.profile_picture_data_url),
            'author_bio': user_settings.user_bio,
            'summary_dicts': blog_post_summary_dicts
        })
        self.render_json(self.values)


class BlogPostSearchHandler(base.BaseHandler):
    """Provides blog cards for blog search page based on query provided and
    applied tag filters.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
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
    def get(self):
        """Handles GET requests."""
        query_string = utils.get_formatted_query_string(
            self.normalized_request.get('q')
        )

        # If there is a tags parameter, it should be in the following form:
        #     tags=("GSOC" OR "Math")
        tags_string = self.normalized_request.get('tags')
        tags = utils.convert_filter_parameter_string_into_list(tags_string)

        search_offset = self.normalized_request.get('offset')

        blog_post_summary_dicts, new_search_offset = (
            _get_matching_blog_card_summary_dicts(
                query_string,
                tags,
                search_offset
            )
        )

        self.values.update({
            'summary_dicts': blog_post_summary_dicts,
            'search_offset': new_search_offset,
        })

        self.render_json(self.values)
