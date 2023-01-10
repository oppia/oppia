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
from core.domain import config_domain
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import user_services

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


class BlogDashboardPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Blog Dashboard Page Handler to render the frontend template."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_blog_dashboard
    def get(self) -> None:
        """Handles GET requests."""

        self.render_template('blog-dashboard-page.mainpage.html')


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
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_AUTHOR_NAME_LENGTH
                }]
            },
            'author_bio': {
                'schema': {
                    'type': 'basestring',
                },
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_CHARS_IN_AUTHOR_BIO
                }]
            },
        },
    }

    @acl_decorators.can_access_blog_dashboard
    def get(self) -> None:
        """Handles GET requests."""
        assert self.user_id is not None
        user_settings = user_services.get_user_settings(self.user_id)
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
            'profile_picture_data_url': user_settings.profile_picture_data_url,
            'no_of_published_blog_posts': no_of_published_blog_posts,
            'no_of_draft_blog_posts': no_of_draft_blog_posts,
            'published_blog_post_summary_dicts': published_post_summary_dicts,
            'draft_blog_post_summary_dicts': draft_blog_post_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_access_blog_dashboard
    def post(self) -> None:
        """Handles POST requests to create a new blog post draft."""
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
                'type': 'basestring'
            }
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
                        validation_method.validate_change_dict_for_blog_post),
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
        """Populates the data on the blog dashboard editor page."""
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
        blog_post = (
            blog_services.get_blog_post_by_id(blog_post_id, strict=False))
        if blog_post is None:
            raise self.PageNotFoundException(
                'The blog post with the given id or url doesn\'t exist.')

        user_settings = user_services.get_user_settings(
            blog_post.author_id, strict=False)
        if user_settings:
            profile_picture_data_url = user_settings.profile_picture_data_url
        else:
            profile_picture_data_url = None

        author_details = blog_services.get_blog_author_details(
            blog_post.author_id)
        max_no_of_tags = config_domain.Registry.get_config_property(
            'max_number_of_tags_assigned_to_blog_post', strict=True).value
        list_of_default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post', strict=True).value

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
            'profile_picture_data_url': profile_picture_data_url,
            'max_no_of_tags': max_no_of_tags,
            'list_of_default_tags': list_of_default_tags
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_blog_post
    def put(self, blog_post_id: str) -> None:
        """Updates properties of the given blog post."""
        assert self.normalized_payload is not None
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
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
        """Stores thumbnail of the blog post in the datastore."""
        assert self.normalized_request is not None
        assert self.normalized_payload is not None
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
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
        """Handles Delete requests."""
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
        blog_services.delete_blog_post(blog_post_id)
        self.render_json(self.values)
