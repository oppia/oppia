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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator as validation_method
from core.domain import blog_domain
from core.domain import blog_services
from core.domain import config_domain
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import user_services
import feconf
import utils


def _get_blog_card_summary_dicts_for_dashboard(summaries):
    # type: (list[BlogPostSummaries]) -> list[BlogPostSummayDicts]
    """Creates summary dicts for use in blog dashboard.

    Args:
        summaries: BlogPostSummaries. List of blog post summary
            domain objects.

    Returns:
        BlogPostSummaryDicts. The list of blog post summary dicts.
    """
    summary_dicts = []
    for summary in summaries:
        summary_dict = summary.to_dict()
        del summary_dict['author_id']
        summary_dicts.append(summary_dict)
    return summary_dicts


class BlogDashboardDataHandler(base.BaseHandler):
    """Provides user data for the blog dashboard."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {},
    }

    @acl_decorators.can_access_blog_dashboard
    def get(self):
        # type: () -> None
        """Handles GET requests."""
        user_settings = user_services.get_user_settings(self.user_id)

        no_of_published_blog_posts = 0
        published_post_summary_dicts = None
        no_of_draft_blog_posts = 0
        draft_blog_post_summary_dicts = None
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
            'username': user_settings.username,
            'profile_picture_data_url': user_settings.profile_picture_data_url,
            'no_of_published_blog_posts': no_of_published_blog_posts,
            'no_of_draft_blog_posts': no_of_draft_blog_posts,
            'published_blog_post_summary_dicts': published_post_summary_dicts,
            'draft_blog_post_summary_dicts': draft_blog_post_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_access_blog_dashboard
    def post(self):
        # type: () -> None
        """Handles POST requests to create a new blog post draft."""
        new_blog_post = blog_services.create_new_blog_post(self.user_id)
        self.render_json({'blog_post_id': new_blog_post.id})


class BlogPostHandler(base.BaseHandler):
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
                },
                'default_value': None
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
    def get(self, blog_post_id):
        # type: (str) -> None
        """Populates the data on the blog dashboard editor page."""
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
        blog_post = (
            blog_services.get_blog_post_by_id(blog_post_id, strict=False))
        if blog_post is None:
            raise self.PageNotFoundException(
                Exception(
                    'The blog post with the given id or url doesn\'t exist.'))
        user_settings = user_services.get_users_settings(
            [blog_post.author_id], strict=False, include_marked_deleted=True)
        username = user_settings[0].username

        max_no_of_tags = config_domain.Registry.get_config_property(
            'max_number_of_tags_assigned_to_blog_post').value
        list_of_default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post').value

        blog_post_dict = blog_post.to_dict()
        del blog_post_dict['author_id']

        self.values.update({
            'blog_post_dict': blog_post_dict,
            'username': username,
            'profile_picture_data_url': (
                user_settings[0].profile_picture_data_url),
            'max_no_of_tags': max_no_of_tags,
            'list_of_default_tags': list_of_default_tags
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_blog_post
    def put(self, blog_post_id):
        # type: (str) -> None
        """Updates properties of the given blog post."""
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
        blog_post_rights = (
            blog_services.get_blog_post_rights(blog_post_id, strict=False))
        blog_post_currently_published = blog_post_rights.blog_post_is_published
        change_dict = self.normalized_payload.get('change_dict')

        blog_services.update_blog_post(blog_post_id, change_dict)
        new_publish_status = self.normalized_payload.get('new_publish_status')
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
    def post(self, blog_post_id):
        # type: (str) -> None
        """Stores thumbnail of the blog post in the datastore."""
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
        raw_image = self.normalized_request.get('image')
        thumbnail_filename = self.normalized_payload.get('thumbnail_filename')
        try:
            file_format = image_validation_services.validate_image_and_filename(
                raw_image, thumbnail_filename)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        entity_id = blog_post_id
        filename_prefix = 'blog_post_thumbnail'

        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            thumbnail_filename, feconf.ENTITY_TYPE_BLOG_POST, entity_id,
            raw_image, filename_prefix, image_is_compressible)

        self.render_json(self.values)

    @acl_decorators.can_delete_blog_post
    def delete(self, blog_post_id):
        # type: (str) -> None
        """Handles Delete requests."""
        blog_domain.BlogPost.require_valid_blog_post_id(blog_post_id)
        blog_services.delete_blog_post(blog_post_id)
        self.render_json(self.values)
