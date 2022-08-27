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

"""Tests for the blog homepage page."""

from __future__ import annotations

from core import feconf
from core.domain import blog_services
from core.domain import config_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.Names.USER])


class BlogHomepageDataHandlerTest(test_utils.GenericTestBase):
    """Checks that the data for blog homepage is handled properly."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self):
        """Complete the setup process for testing."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME,
            feconf.ROLE_ID_BLOG_ADMIN)
        self.signup(self.user_email, self.username)
        blog_post = blog_services.create_new_blog_post(self.blog_admin_id)
        self.change_dict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers<p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post.id, self.change_dict)
        blog_services.publish_blog_post(blog_post.id)

    def test_get_homepage_data(self):
        self.login(self.user_email)
        json_response = self.get_json(
            '%s' % (feconf.BLOG_HOMEPAGE_DATA_URL),
            )
        default_tags = config_domain.Registry.get_config_property(
            'list_of_default_tags_for_blog_post').value
        self.assertEqual(default_tags, json_response['list_of_default_tags'])
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['blog_post_summary_dicts'][0]['author_name'])
        self.assertEqual(
            len(json_response['blog_post_summary_dicts']), 1)

        blog_post_two = blog_services.create_new_blog_post(self.blog_admin_id)
        change_dict_two = {
            'title': 'Sample Title Two',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Blog<p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post_two.id, change_dict_two)
        blog_services.publish_blog_post(blog_post_two.id)
        json_response = self.get_json(
            '%s' % feconf.BLOG_HOMEPAGE_DATA_URL)
        self.assertEqual(
            len(json_response['blog_post_summary_dicts']), 2)
        self.assertTrue(
            json_response['blog_post_summary_dicts'][0]['published_on'] >
            json_response['blog_post_summary_dicts'][1]['published_on']
        )
        self.assertEqual(
            json_response['blog_post_summary_dicts'][0]['title'],
            'Sample Title Two'
        )


class BlogPostHandlerTest(test_utils.GenericTestBase):
    """Checks that the data of the blog post and other data on
    BlogPostPage is properly handled."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self):
        """Complete the setup process for testing."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME,
            feconf.ROLE_ID_BLOG_ADMIN)
        self.signup(self.user_email, self.username)
        self.blog_post = blog_services.create_new_blog_post(self.blog_admin_id)
        self.change_dict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers</p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(self.blog_post.id, self.change_dict)
        blog_services.publish_blog_post(self.blog_post.id)

    def test_get_post_page_data(self):
        self.login(self.user_email)
        blog_post = blog_services.get_blog_post_by_id(self.blog_post.id)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_URL, blog_post.url_fragment),
            )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['blog_post_dict']['author_name'])
        self.assertEqual(
            '<p>Hello Bloggers</p>',
            json_response['blog_post_dict']['content'])
        self.assertEqual(len(json_response['summary_dicts']), 1)
        self.assertIsNotNone(json_response['profile_picture_data_url'])

        blog_post_two_id = (
            blog_services.create_new_blog_post(self.blog_admin_id).id)
        change_dict_two = {
            'title': 'Sample Title Two',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Blog</p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post_two_id, change_dict_two)
        blog_services.publish_blog_post(blog_post_two_id)
        blog_post_two = blog_services.get_blog_post_by_id(blog_post_two_id)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_URL, blog_post_two.url_fragment),
            )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['blog_post_dict']['author_name'])
        self.assertEqual(
            '<p>Hello Blog</p>',
            json_response['blog_post_dict']['content'])
        self.assertEqual(
            len(json_response['summary_dicts']), 2)
        self.assertIsNotNone(json_response['profile_picture_data_url'])

    def test_raise_exception_if_blog_post_does_not_exists(self):
        self.login(self.user_email)
        blog_post = blog_services.get_blog_post_by_id(self.blog_post.id)
        self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_URL, blog_post.url_fragment),
        )
        blog_services.delete_blog_post(blog_post.id)
        self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_URL, blog_post.url_fragment),
            expected_status_int=404
        )


class AuthorsPageHandlerTest(test_utils.GenericTestBase):
    """Checks that the author data and related blog summary cards are
    properly handled."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self):
        """Complete the setup process for testing."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.signup(self.user_email, self.username)
        self.blog_post = blog_services.create_new_blog_post(self.blog_admin_id)
        self.change_dict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers</p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(self.blog_post.id, self.change_dict)
        blog_services.publish_blog_post(self.blog_post.id)

    def test_get_authors_page_data(self):
        self.login(self.user_email)
        json_response = self.get_json(
            '%s/%s' % (
                feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['summary_dicts'][0]['author_name'])
        self.assertEqual(
            len(json_response['summary_dicts']), 1)
        self.assertIsNotNone(json_response['profile_picture_data_url'])

        blog_services.unpublish_blog_post(self.blog_post.id)
        json_response = self.get_json(
            '%s/%s' % (
                feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            )
        self.assertEqual(json_response['summary_dicts'], [])

    def test_get_authors_data_raises_exception_if_user_deleted_account(self):
        self.login(self.user_email)
        json_response = self.get_json(
            '%s/%s' % (
                feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['summary_dicts'][0]['author_name'])
        blog_admin_model = (
            user_models.UserSettingsModel.get_by_id(self.blog_admin_id))
        blog_admin_model.deleted = True
        blog_admin_model.update_timestamps()
        blog_admin_model.put()
        self.get_json(
            '%s/%s' % (
                feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            expected_status_int=404)

    def test_raise_exception_if_username_provided_is_not_of_author(self):
        self.login(self.user_email)
        self.get_json(
            '%s/%s' % (
                feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            )
        user_services.remove_user_role(
            self.blog_admin_id, feconf.ROLE_ID_BLOG_ADMIN)
        self.get_json(
            '%s/%s' % (
                feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            expected_status_int=404)
