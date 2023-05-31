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
from core.constants import constants
from core.domain import blog_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class BlogHomepageDataHandlerTest(test_utils.GenericTestBase):
    """Checks that the data for blog homepage is handled properly."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
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
        self.change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers<p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post.id, self.change_dict)
        blog_services.publish_blog_post(blog_post.id)

    def test_get_blog_homepage_data(self) -> None:
        self.login(self.user_email)
        json_response = self.get_json(
            '%s?offset=0' % (feconf.BLOG_HOMEPAGE_DATA_URL),
            )
        default_tags = constants.LIST_OF_DEFAULT_TAGS_FOR_BLOG_POST
        self.assertEqual(default_tags, json_response['list_of_default_tags'])
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['blog_post_summary_dicts'][0]['displayed_author_name']
        )
        self.assertEqual(
            len(json_response['blog_post_summary_dicts']), 1)
        self.assertEqual(json_response['no_of_blog_post_summaries'], 1)

        blog_post_two = blog_services.create_new_blog_post(self.blog_admin_id)
        change_dict_two: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title Two',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Blog<p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post_two.id, change_dict_two)
        blog_services.publish_blog_post(blog_post_two.id)
        json_response = self.get_json(
            '%s?offset=0' % feconf.BLOG_HOMEPAGE_DATA_URL)
        self.assertEqual(
            len(json_response['blog_post_summary_dicts']), 2)
        self.assertEqual(json_response['no_of_blog_post_summaries'], 2)
        self.assertTrue(
            json_response['blog_post_summary_dicts'][0]['published_on'] >
            json_response['blog_post_summary_dicts'][1]['published_on']
        )
        self.assertEqual(
            json_response['blog_post_summary_dicts'][0]['title'],
            'Sample Title Two'
        )

        json_response = self.get_json(
            '%s?offset=1' % feconf.BLOG_HOMEPAGE_DATA_URL
        )
        self.assertEqual(
            len(json_response['blog_post_summary_dicts']), 1)
        self.assertEqual(
            json_response['blog_post_summary_dicts'][0]['title'],
            'Sample Title'
        )
        self.assertEqual(
            json_response['blog_post_summary_dicts'][0]['author_username'],
            self.BLOG_ADMIN_USERNAME
        )
        self.assertEqual(
            json_response[
                'blog_post_summary_dicts'][0]['displayed_author_name'],
            self.BLOG_ADMIN_USERNAME
        )

    def test_get_blog_homepage_data_with_author_account_deleted(self) -> None:
        blog_services.create_blog_author_details_model(self.blog_admin_id)
        blog_services.update_blog_author_details(
            self.blog_admin_id, 'new author name', 'general user bio')
        # Deleting user setting model.
        blog_admin_model = (
            user_models.UserSettingsModel.get_by_id(self.blog_admin_id))
        blog_admin_model.deleted = True
        blog_admin_model.update_timestamps()
        blog_admin_model.put()

        self.login(self.user_email)
        json_response = self.get_json(
            '%s?offset=0' % (feconf.BLOG_HOMEPAGE_DATA_URL),
            )
        self.assertEqual(
            len(json_response['blog_post_summary_dicts']), 1)
        self.assertEqual(json_response['no_of_blog_post_summaries'], 1)
        self.assertEqual(
            json_response['blog_post_summary_dicts'][0]['author_username'],
            'author account deleted'
        )
        self.assertEqual(
            json_response[
                'blog_post_summary_dicts'][0]['displayed_author_name'],
            'new author name'
        )


class BlogPostDataHandlerTest(test_utils.GenericTestBase):
    """Checks that the data of the blog post and other data on
    BlogPostPage is properly handled."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
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
        self.blog_post_one = blog_services.create_new_blog_post(
            self.blog_admin_id)
        self.change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers</p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(self.blog_post_one.id, self.change_dict)
        blog_services.publish_blog_post(self.blog_post_one.id)
        blog_services.create_blog_author_details_model(self.blog_admin_id)
        blog_services.update_blog_author_details(
            self.blog_admin_id, 'new author name', 'general user bio')

    def test_get_post_page_data(self) -> None:
        self.login(self.user_email)
        blog_post = blog_services.get_blog_post_by_id(self.blog_post_one.id)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_DATA_URL, blog_post.url_fragment),
            )
        self.assertEqual(
            'new author name',
            json_response['blog_post_dict']['displayed_author_name']
        )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME, json_response['author_username'])
        self.assertEqual(
            '<p>Hello Bloggers</p>',
            json_response['blog_post_dict']['content'])
        self.assertEqual(len(json_response['summary_dicts']), 0)

        blog_post_two_id = (
            blog_services.create_new_blog_post(self.blog_admin_id).id)
        change_dict_two: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title Two',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Blog</p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(blog_post_two_id, change_dict_two)
        blog_services.publish_blog_post(blog_post_two_id)
        blog_post_two = blog_services.get_blog_post_by_id(blog_post_two_id)
        json_response = self.get_json(
            '%s/%s' % (
                feconf.BLOG_HOMEPAGE_DATA_URL, blog_post_two.url_fragment),
            )
        self.assertEqual(
            'new author name',
            json_response['blog_post_dict']['displayed_author_name']
        )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME, json_response['author_username'])
        self.assertEqual(
            '<p>Hello Blog</p>',
            json_response['blog_post_dict']['content'])
        self.assertEqual(len(json_response['summary_dicts']), 1)

        # Deleting blog admin's user setting model.
        blog_admin_model = (
            user_models.UserSettingsModel.get_by_id(self.blog_admin_id))
        blog_admin_model.deleted = True
        blog_admin_model.update_timestamps()
        blog_admin_model.put()
        json_response = self.get_json(
            '%s/%s' % (
                feconf.BLOG_HOMEPAGE_DATA_URL, blog_post_two.url_fragment),
            )
        self.assertEqual(
            'new author name',
            json_response['blog_post_dict']['displayed_author_name']
        )
        self.assertEqual(
            'author account deleted', json_response['author_username'])
        self.assertEqual(
            '<p>Hello Blog</p>',
            json_response['blog_post_dict']['content'])
        self.assertEqual(len(json_response['summary_dicts']), 1)

    def test_should_get_correct_recommendations_for_post_page(self) -> None:
        self.signup(
            self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME, feconf.ROLE_ID_BLOG_POST_EDITOR)
        blog_editor_id = (
            self.get_user_id_from_email(self.BLOG_EDITOR_EMAIL))
        blog_post = blog_services.get_blog_post_by_id(self.blog_post_one.id)

        blog_post_two_id = (
            blog_services.create_new_blog_post(self.blog_admin_id).id)
        change_dict_two: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title Two',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Blog</p>',
            'tags': ['Newsletter']
        }
        blog_services.update_blog_post(blog_post_two_id, change_dict_two)
        blog_services.publish_blog_post(blog_post_two_id)

        blog_post_three_id = (
            blog_services.create_new_blog_post(blog_editor_id).id)
        change_dict_three: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title Three',
            'thumbnail_filename': 'thumbnail_filename.svg',
            'content': '<p>Hello Blog</p>',
            'tags': ['Maths', 'English']
        }
        blog_services.update_blog_post(blog_post_three_id, change_dict_three)
        blog_services.publish_blog_post(blog_post_three_id)
        blog_post_three = blog_services.get_blog_post_by_id(blog_post_three_id)

        blog_post_four_id = (
            blog_services.create_new_blog_post(blog_editor_id).id)
        change_dict_four: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title Four',
            'thumbnail_filename': 'thumbnail_filename.svg',
            'content': '<p>Hello Blog</p>',
            'tags': ['English']
        }
        blog_services.update_blog_post(blog_post_four_id, change_dict_four)
        blog_services.publish_blog_post(blog_post_four_id)
        blog_post_four = blog_services.get_blog_post_by_id(blog_post_four_id)

        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_DATA_URL, blog_post.url_fragment),
            )
        self.assertEqual(len(json_response['summary_dicts']), 2)
        self.assertEqual(
            json_response['summary_dicts'][0]['id'], blog_post_two_id)
        self.assertEqual(
            json_response['summary_dicts'][1]['id'], blog_post_four_id)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.BLOG_HOMEPAGE_DATA_URL,
                blog_post_four.url_fragment
            ))
        self.assertEqual(len(json_response['summary_dicts']), 2)
        self.assertEqual(
            json_response['summary_dicts'][0]['id'], blog_post_three_id)
        self.assertEqual(
            json_response['summary_dicts'][1]['id'], blog_post_two_id)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.BLOG_HOMEPAGE_DATA_URL,
                blog_post_three.url_fragment
            ))
        self.assertEqual(len(json_response['summary_dicts']), 2)
        self.assertEqual(
            json_response['summary_dicts'][0]['id'], blog_post_four_id)
        self.assertEqual(
            json_response['summary_dicts'][1]['id'], blog_post_two_id)

        json_response = self.get_json(
            '%s/%s' % (
                feconf.BLOG_HOMEPAGE_DATA_URL,
                blog_post_three.url_fragment
            ))
        self.assertEqual(len(json_response['summary_dicts']), 2)
        self.assertEqual(
            json_response['summary_dicts'][0]['id'], blog_post_four_id)
        self.assertEqual(
            json_response['summary_dicts'][1]['id'], blog_post_two_id)

    def test_raise_exception_if_blog_post_does_not_exists(self) -> None:
        self.login(self.user_email)
        blog_post = blog_services.get_blog_post_by_id(self.blog_post_one.id)
        self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_DATA_URL, blog_post.url_fragment),
        )
        blog_services.delete_blog_post(blog_post.id)
        self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_DATA_URL, blog_post.url_fragment),
            expected_status_int=404
        )

    def test_raise_exception_if_blog_post_url_is_invalid(
        self
    ) -> None:
        self.login(self.user_email)
        # Blog post URL fragment is exceeding max character limit.
        self.get_json(
            '%s/%s' % (
                feconf.BLOG_HOMEPAGE_DATA_URL,
                'aa' * feconf.MAX_CHARS_IN_BLOG_POST_URL
            ),
            expected_status_int=400
        )
        # Blog post URL fragment fails minimum character validation.
        self.get_json(
            '%s/%s' % (feconf.BLOG_HOMEPAGE_DATA_URL, 'aa'),
            expected_status_int=400
        )


class AuthorsPageHandlerTest(test_utils.GenericTestBase):
    """Checks that the author data and related blog summary cards are
    properly handled."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
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
        self.change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers</p>',
            'tags': ['Newsletter', 'Learners']
        }
        blog_services.update_blog_post(self.blog_post.id, self.change_dict)
        blog_services.publish_blog_post(self.blog_post.id)
        blog_services.create_blog_author_details_model(self.blog_admin_id)
        blog_services.update_blog_author_details(
            self.blog_admin_id, 'new author name', 'general user bio')

    def test_get_authors_page_data(self) -> None:
        self.login(self.user_email)
        json_response = self.get_json(
            '%s/%s?offset=0' % (
                feconf.BLOG_AUTHOR_PROFILE_PAGE_DATA_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            )
        self.assertEqual(
            self.BLOG_ADMIN_USERNAME,
            json_response['summary_dicts'][0]['author_username'])
        self.assertEqual(
            'new author name',
            json_response['summary_dicts'][0]['displayed_author_name']
        )
        self.assertEqual(
            len(json_response['summary_dicts']), 1)

        blog_services.unpublish_blog_post(self.blog_post.id)
        json_response = self.get_json(
            '%s/%s?offset=0' % (
                feconf.BLOG_AUTHOR_PROFILE_PAGE_DATA_URL_PREFIX,
                self.BLOG_ADMIN_USERNAME),
            )
        self.assertEqual(json_response['summary_dicts'], [])

    def test_invalid_author_username_raises_error(self) -> None:
        json_response = self.get_json(
            '%s/%s?offset=0' % (
                feconf.BLOG_AUTHOR_PROFILE_PAGE_DATA_URL_PREFIX,
                'Invalid_author_username'
            ),
            expected_status_int=500
        )
        self.assertEqual(
            json_response['error'],
            'No user settings found for the given author_username: '
            'Invalid_author_username'
        )


class BlogPostSearchHandlerTest(test_utils.GenericTestBase):
    """Checks that the search functionality for blog posts is working as
    expected."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        """Complete the setup process for testing."""

        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

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

    def test_get_search_page_data(self) -> None:
        self.login(self.user_email)

        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['blog_post_summaries_list']), 4)

        # Deleting a blog post should remove it from search results.
        blog_services.delete_blog_post(self.ids_of_blog_posts_by_user_A[0])
        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['blog_post_summaries_list']), 3)

        # Unpublishing a blog post should remove it from search results.
        blog_services.unpublish_blog_post(self.ids_of_blog_posts_by_user_A[1])
        # Load the search results with an empty query.
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['blog_post_summaries_list']), 2)

    def test_library_handler_with_exceeding_query_limit_logs_error(
        self
    ) -> None:
        self.login(self.user_email)
        response_dict = self.get_json(feconf.BLOG_SEARCH_DATA_URL)
        self.assertEqual(len(response_dict['blog_post_summaries_list']), 4)
        self.assertEqual(response_dict['search_offset'], None)

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
                    'default query limits.')
                self.assertEqual(
                    len(response_dict['blog_post_summaries_list']), 2)
                self.assertEqual(response_dict['search_offset'], 2)

    def test_handler_with_given_query_and_tag(self) -> None:
        self.login(self.user_email)
        response_dict = self.get_json(
            feconf.BLOG_SEARCH_DATA_URL, params={
                'q': 'Welcome',
                'tags': '("Science")'
            })

        default_tags = constants.LIST_OF_DEFAULT_TAGS_FOR_BLOG_POST
        self.assertEqual(default_tags, response_dict['list_of_default_tags'])
        self.assertEqual(len(response_dict['blog_post_summaries_list']), 1)
        self.assertEqual(
            response_dict['blog_post_summaries_list'][0]['id'],
            self.ids_of_blog_posts_by_user_A[0]
        )

        self.logout()
