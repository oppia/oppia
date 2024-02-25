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

"""Controllers for the blog dashboard page"""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator as validation_method
from core.domain import blog_domain
from core.domain import blog_services
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import platform_parameter_list
from core.domain import platform_parameter_services

from typing import Dict, List, Optional, TypedDict


class BlogCardSummaryDict(TypedDict):
    """Type for the dict representation of blog_card_summary_dict."""

    id: str
    title: str
    summary: str
    url_fragment: str
    tags: List[str]
    thumbnail_filename: Optional[str]
    last_updated: Optional[str]
    published_on: Optional[str]


def _get_blog_card_summary_dicts_for_dashboard(
    summaries: List[blog_domain.BlogPostSummary]
) -> List[BlogCardSummaryDict]:
    """Creates summary dicts for use in blog dashboard.

    Args:
        summaries: list(BlogPostSummary). List of blog post summary
            domain objects.

    Returns:
        list(BlogCardSummaryDict). The list of blog post summary dicts.
    """
    summary_dicts: List[BlogCardSummaryDict] = []
    for summary in summaries:
        summary_dict = summary.to_dict()
        summary_dicts.append({
            'id': summary_dict['id'],
            'title': summary_dict['title'],
            'summary': summary_dict['summary'],
            'url_fragment': summary_dict['url_fragment'],
            'tags': summary_dict['tags'],
            'thumbnail_filename': summary_dict['thumbnail_filename'],
            'last_updated': summary_dict['last_updated'],
            'published_on': summary_dict['published_on'],
        })
    return summary_dicts


class BlogDashboardDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides user data for the blog dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {},
        'PUT': {
            'displayed_author_name': {
                'schema': {
                    'type': 'basestring',
                },
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_AUTHOR_NAME_LENGTH
                    }
                ]
            },
            'author_bio': {
                'schema': {
                    'type': 'basestring',
                },
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_CHARS_IN_AUTHOR_BIO
                    }
                ]
            },
        },
    }

    @acl_decorators.can_access_blog_dashboard
    def get(self) -> None:
        """Retrieves data for the blog dashboard."""
        assert self.user_id is not None
        author_details = (
            blog_services.get_blog_author_details(self.user_id).to_dict())
        no_of_published_blog_posts = 0
        published_post_summary_dicts = []
        no_of_draft_blog_posts = 0
        draft_blog_post_summary_dicts = []
        published_post_summaries = (
            blog_services.get_blog_post_summary_models_list_by_user_id(
                self.user_id, True))
        if published_post_summaries:
            no_of_published_blog_posts = len(published_post_summaries)
            published_post_summary_dicts = (
                _get_blog_card_summary_dicts_for_dashboard(
                    published_post_summaries))

        draft_blog_post_summaries = (
            blog_services.get_blog_post_summary_models_list_by_user_id(
                self.user_id, False))
        if draft_blog_post_summaries:
            no_of_draft_blog_posts = len(draft_blog_post_summaries)
            draft_blog_post_summary_dicts = (
                _get_blog_card_summary_dicts_for_dashboard(
                    draft_blog_post_summaries))
        self.values.update({
            'author_details': author_details,
            'no_of_published_blog_posts': no_of_published_blog_posts,
            'no_of_draft_blog_posts': no_of_draft_blog_posts,
            'published_blog_post_summary_dicts': published_post_summary_dicts,
            'draft_blog_post_summary_dicts': draft_blog_post_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_access_blog_dashboard
    def post(self) -> None:
        """Creates a new blog post draft."""
        assert self.user_id is not None
        new_blog_post = blog_services.create_new_blog_post(self.user_id)
        self.render_json({'blog_post_id': new_blog_post.id})

    @acl_decorators.can_access_blog_dashboard
    def put(self) -> None:
        """Updates author details of the user."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        displayed_author_name = self.normalized_payload[
            'displayed_author_name']
        author_bio = self.normalized_payload['author_bio']
        blog_services.update_blog_author_details(
            self.user_id, displayed_author_name, author_bio
        )
        author_details = (
            blog_services.get_blog_author_details(self.user_id).to_dict())

        self.values.update({
            'author_details': author_details,
        })
        self.render_json(self.values)


class BlogPostHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of BlogPostHandler's normalized_payload
    dictionary.
    """

    change_dict: blog_services.BlogPostChangeDict
    new_publish_status: str
    thumbnail_filename: str


class BlogPostHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BlogPostHandler's normalized_request
    dictionary.
    """

    image: bytes


class BlogPostHandler(
    base.BaseHandler[
        BlogPostHandlerNormalizedPayloadDict,
        BlogPostHandlerNormalizedRequestDict
    ]
):
    """Handler for blog dashboard editor"""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'blog_post_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.BLOG_POST_ID_LENGTH
                    },
                    {
                        'id': 'has_length_at_least',
                        'min_value': constants.BLOG_POST_ID_LENGTH
                    }
                ]
            },
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'new_publish_status': {
                'schema': {
                    'type': 'bool',
                }
            },
            'change_dict': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        validation_method.validate_change_dict_for_blog_post
                    ),
                }
            },
        },
        'POST': {
            'thumbnail_filename': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'image': {
                'schema': {
                    'type': 'basestring'
                }
            },
        },
        'DELETE': {}
    }

    @acl_decorators.can_access_blog_dashboard
    def get(self, blog_post_id: str) -> None:
        """Populates the data on the blog dashboard editor page.

        Args:
            blog_post_id: str. The ID of the blog post.

        Raises:
            PageNotFoundException. The blog post with the given id
                or url doesn't exist.
        """
        blog_post = (
            blog_services.get_blog_post_by_id(blog_post_id, strict=False))
        if blog_post is None:
            raise self.PageNotFoundException(
                'The blog post with the given id or url doesn\'t exist.')

        author_details = blog_services.get_blog_author_details(
            blog_post.author_id)
        max_no_of_tags = (
            platform_parameter_services.get_platform_parameter_value(
                platform_parameter_list.ParamName.
                MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
            )
        )
        list_of_default_tags = constants.LIST_OF_DEFAULT_TAGS_FOR_BLOG_POST

        blog_post_dict = blog_post.to_dict()
        blog_post_dict_for_dashboard = {
            'id': blog_post_dict['id'],
            'title': blog_post_dict['title'],
            'displayed_author_name': author_details.displayed_author_name,
            'content': blog_post_dict['content'],
            'url_fragment': blog_post_dict['url_fragment'],
            'tags': blog_post_dict['tags'],
            'thumbnail_filename': blog_post_dict['thumbnail_filename'],
            'last_updated': blog_post_dict['last_updated'],
            'published_on': blog_post_dict['published_on'],
        }
        self.values.update({
            'blog_post_dict': blog_post_dict_for_dashboard,
            'displayed_author_name': author_details.displayed_author_name,
            'max_no_of_tags': max_no_of_tags,
            'list_of_default_tags': list_of_default_tags
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_blog_post
    def put(self, blog_post_id: str) -> None:
        """Updates properties of the given blog post.

        Args:
            blog_post_id: str. The ID of the blog post.
        """
        assert self.normalized_payload is not None
        blog_post_rights = (
            blog_services.get_blog_post_rights(blog_post_id, strict=True))
        blog_post_currently_published = blog_post_rights.blog_post_is_published
        change_dict = self.normalized_payload['change_dict']
        blog_services.update_blog_post(blog_post_id, change_dict)
        new_publish_status = self.normalized_payload['new_publish_status']
        if new_publish_status:
            blog_services.publish_blog_post(blog_post_id)
        elif blog_post_currently_published:
            blog_services.unpublish_blog_post(blog_post_id)

        blog_post_dict = (
            blog_services.get_blog_post_by_id(blog_post_id).to_dict())

        self.values.update({
            'blog_post': blog_post_dict
        })
        self.render_json(self.values)

    @acl_decorators.can_edit_blog_post
    def post(self, blog_post_id: str) -> None:
        """Stores thumbnail of the blog post in the datastore.

        Args:
            blog_post_id: str. The ID of the blog post.

        Raises:
            InvalidInputException. The input provided is not valid.
        """
        assert self.normalized_request is not None
        assert self.normalized_payload is not None
        raw_image = self.normalized_request['image']
        thumbnail_filename = self.normalized_payload['thumbnail_filename']
        try:
            file_format = image_validation_services.validate_image_and_filename(
                raw_image, thumbnail_filename, feconf.ENTITY_TYPE_BLOG_POST)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        entity_id = blog_post_id
        filename_prefix = 'thumbnail'

        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            thumbnail_filename, feconf.ENTITY_TYPE_BLOG_POST, entity_id,
            raw_image, filename_prefix, image_is_compressible)

        self.render_json(self.values)

    @acl_decorators.can_delete_blog_post
    def delete(self, blog_post_id: str) -> None:
        """Deletes a blog post.

        Args:
            blog_post_id: str. The ID of the blog post.
        """
        blog_services.delete_blog_post(blog_post_id)
        self.render_json(self.values)


class BlogPostTitleHandlerNormalizedDict(TypedDict):
    """Dict representation of BlogPostTitleHandler's normalized_request
    and payload dictionary.
    """

    title: str


class BlogPostTitleHandler(
    base.BaseHandler[
        BlogPostTitleHandlerNormalizedDict,
        BlogPostTitleHandlerNormalizedDict
    ]
):
    """A data handler for checking if a blog post with given title exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'blog_post_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.BLOG_POST_ID_LENGTH
                    },
                    {
                        'id': 'has_length_at_least',
                        'min_value': constants.BLOG_POST_ID_LENGTH,
                    }
                ]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'title': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': constants.MAX_CHARS_IN_BLOG_POST_TITLE
                        }
                    ]
                }
            }
        },
    }

    @acl_decorators.can_edit_blog_post
    def get(self, blog_post_id: str) -> None:
        """Handler that receives a blog post title and checks whether
        a blog post with the same title exists.

        Args:
            blog_post_id: str. The ID of the blog post.
        """
        assert self.normalized_request is not None
        title = self.normalized_request['title']
        self.render_json({
            'blog_post_exists': (
                blog_services.does_blog_post_with_title_exist(
                    title, blog_post_id
                )
            )
        })
