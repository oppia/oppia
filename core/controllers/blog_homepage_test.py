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
import logging

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


class BlogPostSearchHandlerTest(test_utils.GenericTestBase):
    """Checks that the search functionality for blog posts is working as
    expected."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self):
        """Complete the setup process for testing."""

        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')  # type: ignore[no-untyped-call]
        self.user_id_b = self.get_user_id_from_email('b@example.com')  # type: ignore[no-untyped-call]

        self.signup(self.user_email, self.username)

        self.ids_of_blog_posts_by_user_A = []
        for _ in range(2):
            blog_post = blog_services.create_new_blog_post(self.user_id_a)
            self.ids_of_blog_posts_by_user_A.append(blog_post.id)

        self.ids_of_blog_posts_by_user_B = []
        for _ in range(2):
            blog_post = blog_services.create_new_blog_post(self.user_id_b)
            self.ids_of_blog_posts_by_user_B.append(blog_post.id)

        self.all_blog_post_ids = (
            self.ids_of_blog_posts_by_user_A + self.ids_of_blog_posts_by_user_B
        )

        self.change_dict_1: blog_services.BlogPostChangeDict = {
            'title': 'Welcome to Oppia',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog Authors',
            'tags': ['Math', 'Science']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_A[0], self.change_dict_1)

        self.change_dict_2: blog_services.BlogPostChangeDict = {
            'title': 'Welcome',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog Authors',
            'tags': ['Math', 'Social']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_A[1], self.change_dict_2)

        self.change_dict_3: blog_services.BlogPostChangeDict = {
            'title': 'New Lessons in Mathematics',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog',
            'tags': ['Math', 'Oppia']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_B[0], self.change_dict_3)

        self.change_dict_4: blog_services.BlogPostChangeDict = {
            'title': 'Basic English Lessons',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Authors in Oppia',
            'tags': ['English', 'Oppia', 'Social']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_B[1], self.change_dict_4)

        for blog_id in self.all_blog_post_ids:
            blog_services.publish_blog_post(blog_id)

    def test_get_search_page_data(self):
        self.login(self.user_email)

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['summary_dicts']), 4)

        # Deleting a blog post should remove it from search results.
        blog_services.delete_blog_post(self.ids_of_blog_posts_by_user_A[0])
        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['summary_dicts']), 3)

        # Unpublishing a blog post should remove it from search results.
        blog_services.unpublish_blog_post(self.ids_of_blog_posts_by_user_A[1])
        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['summary_dicts']), 2)

    def test_library_handler_with_exceeding_query_limit_logs_error(self):
        self.login(self.user_email)
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['summary_dicts']), 4)
        self.assertEqual(response_dict['search_offset'], None)

        observed_log_messages = []

        def _mock_logging_function(msg, *_):
            """Mocks logging.error()."""
            observed_log_messages.append(msg)

        default_query_limit_swap = self.swap(feconf, 'DEFAULT_QUERY_LIMIT', 2)
        max_cards_limit_swap = self.swap(
            feconf, 'MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE', 2)
        # Load the search results with an empty query.
        with self.capture_logging(min_level=logging.ERROR) as logs:
            with default_query_limit_swap, max_cards_limit_swap:
                response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)

                self.assertEqual(len(logs), 1)
                self.assertEqual(
                    logs[0],
                    '2 blog post summaries were fetched to load the search'
                    '/filter by result page. You may be running up against the '
                    'default query limits.\nNoneType: None')
                self.assertEqual(len(response_dict['summary_dicts']), 2)
                self.assertEqual(response_dict['search_offset'], 2)

    def test_handler_with_given_query_and_tag(self):
        self.login(self.user_email)
        response_dict = self.get_json(
            feconf.BLOG_SEARCH_DATA_URL, params={
                'q': 'Welcome',
                'tags': '("Science")'
            })

        self.assertEqual(len(response_dict['summary_dicts']), 1)
        self.assertEqual(
            response_dict['summary_dicts'][0]['id'],
            self.ids_of_blog_posts_by_user_A[0]
        )

        self.logout()
