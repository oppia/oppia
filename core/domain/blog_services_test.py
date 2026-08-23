# coding: utf-8
#
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

"""Tests for blog post services."""

from __future__ import annotations

import datetime
import logging

from core import feconf, utils
from core.domain import (
    blog_domain,
    blog_services,
    user_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Any, Dict, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])


class BlogServicesUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.blog_post_a = blog_services.create_new_blog_post(self.user_id_a)
        self.blog_post_b = blog_services.create_new_blog_post(self.user_id_b)
        self.blog_post_a_id = self.blog_post_a.id
        self.blog_post_b_id = self.blog_post_b.id

        # Here we use MyPy ignore because dictionary of type BlogPostChangeDict
        # should contain 'title' key but for testing purpose here we are not
        # providing the 'title' key, which causes MyPy to throw error. Thus to
        # silent the error, we used ignore here.
        self.change_dict: blog_services.BlogPostChangeDict = {  # type: ignore[typeddict-item]
            'thumbnail_filename': 'test.svg',
            'content': '<p>hi<p>',
            'tags': ['one', 'two'],
        }
        self.change_dict_one: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '<p>Hello</p>',
            'tags': [],
        }
        self.change_dict_two: blog_services.BlogPostChangeDict = {
            'title': 'Sample title two',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '<p>Hello</p>',
            'tags': ['one', 'two'],
        }

    def test_get_blog_post_from_model(self) -> None:
        blog_post_model = blog_models.BlogPostModel.get(self.blog_post_a_id)
        blog_post = blog_services.get_blog_post_from_model(blog_post_model)
        self.assertEqual(blog_post.to_dict(), self.blog_post_a.to_dict())

    def test_get_blog_post_by_id(self) -> None:
        expected_blog_post = self.blog_post_a.to_dict()
        blog_post = blog_services.get_blog_post_by_id(self.blog_post_a_id)
        self.assertEqual(blog_post.to_dict(), expected_blog_post)

    def test_get_blog_post_summary_models_list_by_user_id(self) -> None:
        blog_posts = blog_services.get_blog_post_summary_models_list_by_user_id(
            self.user_id_a, True
        )
        self.assertEqual(blog_posts, [])
        blog_posts = blog_services.get_blog_post_summary_models_list_by_user_id(
            self.user_id_a, False
        )
        self.assertEqual(self.blog_post_a_id, blog_posts[0].id)

    def test_get_new_blog_post_id(self) -> None:
        blog_post_id = blog_services.get_new_blog_post_id()
        self.assertFalse(blog_post_id == self.blog_post_a_id)
        self.assertFalse(blog_post_id == self.blog_post_b_id)

    def test_create_new_blog_post_creates_author_details(self) -> None:
        """Tests that create_new_blog_post ensures BlogAuthorDetailsModel exists."""
        self.signup('newauthor@example.com', 'newauthor')
        new_user_id = self.get_user_id_from_email('newauthor@example.com')

        author_model_before = blog_models.BlogAuthorDetailsModel.get_by_author(
            new_user_id
        )
        self.assertIsNone(author_model_before)
        new_blog_post = blog_services.create_new_blog_post(new_user_id)
        author_model_after = blog_models.BlogAuthorDetailsModel.get_by_author(
            new_user_id
        )
        self.assertIsNotNone(author_model_after)
        assert author_model_after is not None
        self.assertEqual(author_model_after.author_id, new_user_id)
        self.assertEqual(new_blog_post.author_id, new_user_id)

    def test_generate_summary_of_blog_post(self) -> None:
        html_content = '<a href="http://www.google.com">Hello, Oppia Blog</a>'
        expected_summary = 'Hello, Oppia Blog'
        summary = blog_services.generate_summary_of_blog_post(html_content)
        self.assertEqual(expected_summary, summary)

        content = '<p>abc</p><strong>QWERTY</strong>' * 150
        expected_summary = '%s...' % ('abc' * 99)
        summary = blog_services.generate_summary_of_blog_post(content)
        self.assertEqual(expected_summary, summary)

    def test_compute_summary_of_blog_post(self) -> None:
        expected_blog_post_summary = blog_domain.BlogPostSummary(
            self.blog_post_a_id,
            self.user_id_a,
            '',
            '',
            '',
            [],
            self.blog_post_a.thumbnail_filename,
            self.blog_post_a.last_updated,
            self.blog_post_a.published_on,
        )
        blog_post_summary = blog_services.compute_summary_of_blog_post(
            self.blog_post_a
        )
        self.assertEqual(
            expected_blog_post_summary.to_dict(), blog_post_summary.to_dict()
        )

    def test_get_published_blog_post_summaries(self) -> None:
        self.assertEqual(
            len(blog_services.get_published_blog_post_summaries()), 0
        )
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        number_of_published_blogs = (
            blog_services.get_published_blog_post_summaries(0, 2)
        )
        self.assertEqual(len(number_of_published_blogs), 1)

        number_of_published_blogs = (
            blog_services.get_published_blog_post_summaries(1, 1)
        )
        self.assertEqual(len(number_of_published_blogs), 0)

    def test_get_total_number_of_published_blog_post_summaries_by_author(
        self,
    ) -> None:
        self.assertEqual(
            blog_services.get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_a
            ),
            0,
        )

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)

        self.assertEqual(
            blog_services.get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_a
            ),
            1,
        )

        # Publishing blog post from user with user_id_b.
        change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample title B',
            'thumbnail_filename': 'test.svg',
            'content': '<p>hi<p>',
            'tags': ['one', 'two'],
        }
        blog_services.update_blog_post(self.blog_post_b_id, change_dict)
        blog_services.publish_blog_post(self.blog_post_b_id)

        self.assertEqual(
            blog_services.get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_a
            ),
            1,
        )
        self.assertEqual(
            blog_services.get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_b
            ),
            1,
        )

    def test_get_total_number_of_published_blog_post_summaries(self) -> None:
        number_of_published_blogs = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(number_of_published_blogs, 0)
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        number_of_published_blogs = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(number_of_published_blogs, 1)

    def test_get_published_blog_post_summaries_by_user_id(self) -> None:
        self.assertEqual(
            len(
                blog_services.get_published_blog_post_summaries_by_user_id(
                    self.user_id_a, 20, 0
                )
            ),
            0,
        )
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        no_of_published_blog_post = (
            blog_services.get_published_blog_post_summaries_by_user_id(
                self.user_id_a, 20, 0
            )
        )
        self.assertEqual(len(no_of_published_blog_post), 1)

    def test_get_blog_post_summary_from_model(self) -> None:
        blog_post_summary_model = blog_models.BlogPostSummaryModel.get(
            self.blog_post_a_id
        )
        blog_post_summary = blog_services.get_blog_post_summary_from_model(
            blog_post_summary_model
        )
        expected_blog_post_summary = blog_domain.BlogPostSummary(
            self.blog_post_a_id,
            self.user_id_a,
            '',
            '',
            '',
            [],
            blog_post_summary_model.thumbnail_filename,
            blog_post_summary_model.last_updated,
            blog_post_summary_model.published_on,
            blog_post_summary_model.deleted,
        )
        self.assertEqual(
            blog_post_summary.to_dict(), expected_blog_post_summary.to_dict()
        )

    def test_blog_post_summary_by_id(self) -> None:
        blog_post_summary = blog_services.get_blog_post_summary_by_id(
            self.blog_post_a_id
        )
        expected_blog_post_summary = blog_domain.BlogPostSummary(
            self.blog_post_a_id,
            self.user_id_a,
            '',
            '',
            '',
            [],
            blog_post_summary.thumbnail_filename,
            blog_post_summary.last_updated,
            blog_post_summary.published_on,
            blog_post_summary.deleted,
        )
        self.assertEqual(
            blog_post_summary.to_dict(), expected_blog_post_summary.to_dict()
        )

    def test_publish_blog_post(self) -> None:
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        self.assertFalse(blog_post_rights.blog_post_is_published)

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        blog_post_summary = blog_services.get_blog_post_summary_by_id(
            self.blog_post_a_id
        )
        blog_post = blog_services.get_blog_post_by_id(self.blog_post_a_id)
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )

        self.assertTrue(blog_post_rights.blog_post_is_published)
        self.assertIsNotNone(blog_post.published_on)
        self.assertIsNotNone(blog_post_summary.published_on)
        self.assertEqual(blog_post.published_on, blog_post_summary.published_on)

    def test_publish_blog_post_creates_author_details(self) -> None:
        """Tests that publish_blog_post creates author model if missing."""
        self.signup('author@example.com', 'Author')
        author_user_id = self.get_user_id_from_email('author@example.com')
        blog_post = blog_services.create_new_blog_post(author_user_id)
        blog_post_id = blog_post.id
        author_model = blog_models.BlogAuthorDetailsModel.get_by_author(
            author_user_id
        )
        self.assertIsNotNone(author_model)
        assert author_model is not None
        author_model.delete()
        author_model_after_delete = (
            blog_models.BlogAuthorDetailsModel.get_by_author(author_user_id)
        )
        self.assertIsNone(author_model_after_delete)
        blog_services.update_blog_post(blog_post_id, self.change_dict_two)
        blog_services.publish_blog_post(blog_post_id)
        recreated_author_model = (
            blog_models.BlogAuthorDetailsModel.get_by_author(author_user_id)
        )
        self.assertIsNotNone(recreated_author_model)
        assert recreated_author_model is not None
        self.assertEqual(recreated_author_model.author_id, author_user_id)

    def test_cannot_publish_invalid_blog_post(self) -> None:
        """Checks that an invalid blog post is not published."""
        with self.assertRaisesRegex(Exception, ('Title should not be empty')):
            blog_services.publish_blog_post(self.blog_post_a_id)

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one
        )
        with self.assertRaisesRegex(
            Exception, ('Atleast one tag should be selected')
        ):
            blog_services.publish_blog_post(self.blog_post_a_id)

        change_dict_three: blog_services.BlogPostChangeDict = {
            'title': 'Sample',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '',
            'tags': ['one', 'two'],
        }

        blog_services.update_blog_post(self.blog_post_a_id, change_dict_three)
        with self.assertRaisesRegex(Exception, ('Content can not be empty')):
            blog_services.publish_blog_post(self.blog_post_a_id)

        blog_services.delete_blog_post(self.blog_post_a_id)
        with self.assertRaisesRegex(
            Exception, ('The given blog post does not exist')
        ):
            blog_services.publish_blog_post(self.blog_post_a_id)

    def test_unpublish_blog_post(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        self.assertTrue(blog_post_rights.blog_post_is_published)

        blog_services.unpublish_blog_post(self.blog_post_a_id)
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        self.assertFalse(blog_post_rights.blog_post_is_published)
        blog_post_model = blog_services.get_blog_post_by_id(self.blog_post_a_id)
        self.assertIsNone(blog_post_model.published_on)
        blog_post_summary_model = blog_services.get_blog_post_summary_by_id(
            self.blog_post_a_id
        )
        self.assertIsNone(blog_post_summary_model.published_on)

    def test_cannot_unpublish_invalid_blog_post(self) -> None:
        blog_services.delete_blog_post(self.blog_post_a_id)
        with self.assertRaisesRegex(
            Exception, ('The given blog post does not exist')
        ):
            blog_services.unpublish_blog_post(self.blog_post_a_id)

    def test_filter_blog_post_ids(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        filtered_model_ids = blog_services.filter_blog_post_ids(
            self.user_id_a, True
        )
        self.assertEqual(filtered_model_ids, [self.blog_post_a_id])
        filtered_model_ids = blog_services.filter_blog_post_ids(
            self.user_id_b, False
        )
        self.assertEqual(filtered_model_ids, [self.blog_post_b_id])

    def test_update_blog_post(self) -> None:
        self.assertEqual(self.blog_post_a.title, '')
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one
        )
        updated_blog_post = blog_services.get_blog_post_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(updated_blog_post.thumbnail_filename, 'thummbnail.svg')
        self.assertEqual(updated_blog_post.content, '<p>Hello</p>')
        lower_id = '-' + self.blog_post_a_id.lower()
        self.assertEqual(
            updated_blog_post.url_fragment, 'sample-title' + lower_id
        )

        blog_services.update_blog_post(self.blog_post_a_id, self.change_dict)
        updated_blog_post = blog_services.get_blog_post_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(updated_blog_post.tags, ['one', 'two'])

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one
        )

        updated_blog_post = blog_services.get_blog_post_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(updated_blog_post.title, 'Sample Title')
        with self.assertRaisesRegex(
            Exception,
            ('Blog Post with given title already exists: %s' % 'Sample Title'),
        ):
            blog_services.update_blog_post(
                self.blog_post_b_id, self.change_dict_one
            )

    def test_get_blog_post_by_url_fragment(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one
        )
        expected_blog_post = blog_services.get_blog_post_by_id(
            self.blog_post_a_id
        )
        lower_id = '-' + self.blog_post_a_id.lower()
        blog_post = blog_services.get_blog_post_by_url_fragment(
            'sample-title' + lower_id
        )
        # Ruling out the possibility of None for mypy type checking.
        assert blog_post is not None
        self.assertEqual(blog_post.to_dict(), expected_blog_post.to_dict())

    def test_get_blog_post_by_invalid_url(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception,
            r'Blog Post URL fragment should be a string. Recieved:\s*\[123\]',
        ):
            blog_services.does_blog_post_with_url_fragment_exist([123])  # type: ignore[arg-type]

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception, 'Blog Post URL fragment should be a string. Recieved:123'
        ):
            blog_services.does_blog_post_with_url_fragment_exist(123)  # type: ignore[arg-type]

    def test_does_blog_post_with_url_fragment_exist(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one
        )
        lower_id = '-' + self.blog_post_a_id.lower()
        self.assertTrue(
            blog_services.does_blog_post_with_url_fragment_exist(
                'sample-title' + lower_id
            )
        )
        self.assertFalse(
            blog_services.does_blog_post_with_url_fragment_exist('title')
        )

    def test_update_blog_post_summary(self) -> None:
        blog_post_summary = blog_services.get_blog_post_summary_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(blog_post_summary.title, '')
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one
        )
        updated_blog_post_summary = blog_services.get_blog_post_summary_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(
            updated_blog_post_summary.thumbnail_filename, 'thummbnail.svg'
        )
        self.assertEqual(updated_blog_post_summary.summary, 'Hello')
        lower_id = '-' + self.blog_post_a_id.lower()
        self.assertEqual(
            updated_blog_post_summary.url_fragment, 'sample-title' + lower_id
        )

    def test_check_can_edit_blog_post(self) -> None:
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        user_info_a = user_services.get_user_actions_info(self.user_id_a)
        user_info_b = user_services.get_user_actions_info(self.user_id_b)

        self.assertFalse(
            blog_services.check_can_edit_blog_post(
                user_info_b, blog_post_rights
            )
        )
        self.assertTrue(
            blog_services.check_can_edit_blog_post(
                user_info_a, blog_post_rights
            )
        )
        self.assertFalse(
            blog_services.check_can_edit_blog_post(user_info_a, None)
        )

        user_info_b.actions.append('EDIT_ANY_BLOG_POST')
        self.assertTrue(
            blog_services.check_can_edit_blog_post(
                user_info_b, blog_post_rights
            )
        )

    def test_deassign_user_from_all_blog_posts(self) -> None:
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        self.assertTrue(self.user_id_a in blog_post_rights.editor_ids)

        blog_services.deassign_user_from_all_blog_posts(self.user_id_a)

        updated_blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        self.assertFalse(self.user_id_a in updated_blog_post_rights.editor_ids)

    def test_generate_url_fragment(self) -> None:
        url_fragment = blog_services.generate_url_fragment(
            'Sample Url Fragment', 'ABC123EFG'
        )
        self.assertEqual(url_fragment, 'sample-url-fragment-abc123efg')

        url_fragment = blog_services.generate_url_fragment(
            'SaMple Url FrAgMent', 'ABC123Efgh'
        )
        self.assertEqual(url_fragment, 'sample-url-fragment-abc123efgh')

    def test_save_blog_post_rights(self) -> None:
        blog_post_rights = blog_domain.BlogPostRights(
            self.blog_post_a_id, [self.user_id_a, self.user_id_b], False
        )
        blog_services.save_blog_post_rights(blog_post_rights)
        fetched_blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_a_id
        )
        self.assertEqual(
            blog_post_rights.to_dict(), fetched_blog_post_rights.to_dict()
        )

    def test_delete_blog_post(self) -> None:
        blog_services.delete_blog_post(self.blog_post_a_id)
        self.assertIsNone(
            blog_services.get_blog_post_rights(
                self.blog_post_a_id, strict=False
            )
        )
        self.assertIsNone(
            blog_services.get_blog_post_by_id(self.blog_post_a_id, strict=False)
        )
        self.assertIsNone(
            blog_services.get_blog_post_summary_by_id(
                self.blog_post_a_id, strict=False
            )
        )

    def test_get_blog_post_summary_by_title(self) -> None:
        model = blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_a_id)
        model.title = 'Hello Bloggers'
        model.update_timestamps()
        model.put()

        blog_post_summary = blog_services.get_blog_post_summary_by_title(
            'Hello Bloggers'
        )
        # Ruling out the possibility of None for mypy type checking.
        assert blog_post_summary is not None
        expected_blog_post_summary = blog_domain.BlogPostSummary(
            self.blog_post_a_id,
            self.user_id_a,
            'Hello Bloggers',
            '',
            '',
            [],
            blog_post_summary.thumbnail_filename,
            blog_post_summary.last_updated,
            blog_post_summary.published_on,
        )
        self.assertEqual(
            blog_post_summary.to_dict(), expected_blog_post_summary.to_dict()
        )
        self.assertIsNone(blog_services.get_blog_post_summary_by_title('Hello'))

    def test_update_blog_models_author_and_published_on_date_successfully(
        self,
    ) -> None:
        model = blog_models.BlogPostModel.get_by_id(self.blog_post_a_id)
        model.title = 'sample title'
        model.tags = ['news']
        model.thumbnail_filename = 'image.png'
        model.content = 'hello bloggers'
        model.url_fragment = 'sample'
        model.published_on = utils.get_current_utc_datetime()
        model.update_timestamps()
        model.put()

        blog_services.update_blog_models_author_and_published_on_date(
            self.blog_post_a_id, self.user_id_b, '05/09/2000'
        )

        blog_model = blog_models.BlogPostSummaryModel.get_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(blog_model.author_id, self.user_id_b)
        self.assertEqual(
            blog_model.published_on, datetime.datetime(2000, 5, 9, 0, 0)
        )

        blog_summary_model = blog_models.BlogPostSummaryModel.get_by_id(
            self.blog_post_a_id
        )
        self.assertEqual(blog_summary_model.author_id, self.user_id_b)
        self.assertEqual(
            blog_summary_model.published_on, datetime.datetime(2000, 5, 9, 0, 0)
        )

        blog_rights_model = blog_models.BlogPostRightsModel.get_by_id(
            self.blog_post_a_id
        )
        self.assertTrue(self.user_id_b in blog_rights_model.editor_ids)

    def test_update_blog_models_author_and_publish_date_with_invalid_date(
        self,
    ) -> None:
        model = blog_models.BlogPostModel.get_by_id(self.blog_post_a_id)
        model.title = 'sample title'
        model.tags = ['news']
        model.thumbnail_filename = 'image.png'
        model.content = 'hello bloggers'
        model.url_fragment = 'sample'
        model.published_on = utils.get_current_utc_datetime()
        model.update_timestamps()
        model.put()

        # Invalid month.
        with self.assertRaisesRegex(
            Exception,
            'time data \'123/09/2000, 00:00:00:00\' does not match'
            ' format \'%m/%d/%Y, %H:%M:%S:%f\'',
        ):
            blog_services.update_blog_models_author_and_published_on_date(
                self.blog_post_a_id, self.user_id_b, '123/09/2000'
            )

        # Invalid day.
        with self.assertRaisesRegex(
            Exception,
            'time data \'01/38/2000, 00:00:00:00\' does not match'
            ' format \'%m/%d/%Y, %H:%M:%S:%f\'',
        ):
            blog_services.update_blog_models_author_and_published_on_date(
                self.blog_post_a_id, self.user_id_b, '01/38/2000'
            )

        # Invalid year.
        with self.assertRaisesRegex(
            Exception,
            'time data \'01/22/31126, 00:00:00:00\' does not match'
            ' format \'%m/%d/%Y, %H:%M:%S:%f\'',
        ):
            blog_services.update_blog_models_author_and_published_on_date(
                self.blog_post_a_id, self.user_id_b, '01/22/31126'
            )

    def test_update_blog_model_author_and_publish_on_with_invalid_blog_id(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Entity for class BlogPostModel with id invalid_blog_id not found',
        ):
            blog_services.update_blog_models_author_and_published_on_date(
                'invalid_blog_id', self.user_id_b, '01/12/2000'
            )

    def test_update_blog_post_with_each_field_individually(self) -> None:
        blog_post = blog_services.create_new_blog_post(self.user_id_a)

        initial_dict: blog_services.BlogPostChangeDict = {
            'title': 'Initial Title',
            'thumbnail_filename': 'thumb_old.svg',
            'content': '<p>Old Content</p>',
            'tags': ['tag0'],
        }
        blog_services.update_blog_post(blog_post.id, initial_dict)
        blog_services.publish_blog_post(blog_post.id)

        expected = {
            'title': 'Initial Title',
            'thumbnail_filename': 'thumb_old.svg',
            'content': '<p>Old Content</p>',
            'tags': ['tag0'],
        }
        # Here we use MyPy ignore because dictionary of type BlogPostChangeDict
        # should contain 'content','title','thumbnail_filename' key but for testing purpose here we are not
        # providing some keys, which causes MyPy to throw error. Thus to
        # silent the error, we used ignore here.
        title_dict: blog_services.BlogPostChangeDict = {  # type: ignore[typeddict-item]
            'title': 'New Title'
        }
        blog_services.update_blog_post(blog_post.id, title_dict)
        updated = blog_services.get_blog_post_by_id(blog_post.id)
        expected['title'] = 'New Title'
        self.assertEqual(updated.title, expected['title'])
        self.assertEqual(
            updated.thumbnail_filename, expected['thumbnail_filename']
        )
        self.assertEqual(updated.content, expected['content'])
        self.assertEqual(updated.tags, expected['tags'])
        # Here we use MyPy ignore because dictionary of type BlogPostChangeDict
        # should contain 'content','title','thumbnail_filename' key but for testing purpose here we are not
        # providing some keys, which causes MyPy to throw error. Thus to
        # silent the error, we used ignore here.
        thumbnail_dict: blog_services.BlogPostChangeDict = {  # type: ignore[typeddict-item]
            'thumbnail_filename': 'thumb_new.svg'
        }
        blog_services.update_blog_post(blog_post.id, thumbnail_dict)
        updated = blog_services.get_blog_post_by_id(blog_post.id)
        expected['thumbnail_filename'] = 'thumb_new.svg'
        self.assertEqual(
            updated.thumbnail_filename, expected['thumbnail_filename']
        )
        self.assertEqual(updated.title, expected['title'])
        self.assertEqual(updated.content, expected['content'])
        self.assertEqual(updated.tags, expected['tags'])
        # Here we use MyPy ignore because dictionary of type BlogPostChangeDict
        # should contain 'content','title','thumbnail_filename' key but for testing purpose here we are not
        # providing some keys, which causes MyPy to throw error. Thus to
        # silent the error, we used ignore here.
        content_dict: blog_services.BlogPostChangeDict = {  # type: ignore[typeddict-item]
            'content': '<p>Updated Content</p>'
        }
        blog_services.update_blog_post(blog_post.id, content_dict)
        updated = blog_services.get_blog_post_by_id(blog_post.id)
        expected['content'] = '<p>Updated Content</p>'
        self.assertEqual(updated.content, expected['content'])
        self.assertEqual(updated.title, expected['title'])
        self.assertEqual(
            updated.thumbnail_filename, expected['thumbnail_filename']
        )
        self.assertEqual(updated.tags, expected['tags'])
        # Here we use MyPy ignore because dictionary of type BlogPostChangeDict
        # should contain 'content','title','thumbnail_filename' key but for testing purpose here we are not
        # providing some keys, which causes MyPy to throw error. Thus to
        # silent the error, we used ignore here.
        tags_dict: blog_services.BlogPostChangeDict = {  # type: ignore[typeddict-item]
            'tags': ['new1', 'new2']
        }
        blog_services.update_blog_post(blog_post.id, tags_dict)
        updated = blog_services.get_blog_post_by_id(blog_post.id)
        expected['tags'] = ['new1', 'new2']
        self.assertEqual(updated.tags, expected['tags'])
        self.assertEqual(updated.title, expected['title'])
        self.assertEqual(
            updated.thumbnail_filename, expected['thumbnail_filename']
        )
        self.assertEqual(updated.content, expected['content'])


class BlogAuthorDetailsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        auth_id = 'someUser'
        self.user_bio = 'new bio'
        self.user_name = 'username'
        user_email = 'user@example.com'
        user_settings = user_services.create_new_user(auth_id, user_email)
        self.user_id = user_settings.user_id
        user_settings.user_bio = self.user_bio
        user_services.save_user_settings(user_settings)
        user_services.set_username(self.user_id, self.user_name)
        blog_services.create_blog_author_details_model(self.user_id)

    def test_get_blog_author_details_model(self) -> None:
        author_details = blog_services.get_blog_author_details(self.user_id)
        self.assertEqual(author_details.displayed_author_name, self.user_name)
        self.assertEqual(author_details.author_bio, self.user_bio)

    def test_get_blog_author_details_model_raises_exception(self) -> None:
        def _mock_get_author_details_by_author(unused_user_id: str) -> None:
            return None

        get_author_details_swap = self.swap(
            blog_models.BlogAuthorDetailsModel,
            'get_by_author',
            _mock_get_author_details_by_author,
        )

        with get_author_details_swap:
            with self.assertRaisesRegex(
                Exception,
                'No BlogAuthorDetailsModel found for user_id=',
            ):
                # Test with strict=True (default).
                blog_services.get_blog_author_details(self.user_id)

    def test_get_blog_author_details_with_strict_false_returns_default(
        self,
    ) -> None:
        """Tests that get_blog_author_details returns a default
        BlogAuthorDetails when strict=False and the model is missing.
        """

        def _mock_get_author_details_by_author(unused_user_id: str) -> None:
            return None

        get_author_details_swap = self.swap(
            blog_models.BlogAuthorDetailsModel,
            'get_by_author',
            _mock_get_author_details_by_author,
        )

        with get_author_details_swap:
            # With strict=False, should return a default object.
            author_details = blog_services.get_blog_author_details(
                self.user_id, strict=False
            )
            self.assertEqual(
                author_details.displayed_author_name, 'Deleted User'
            )
            self.assertEqual(author_details.author_bio, '')
            self.assertEqual(author_details.author_id, self.user_id)

    def test_get_blog_author_details_create_fails(self) -> None:
        """Tests that create_blog_author_details_model raises an error when user details cannot be fetched."""

        # Here we use type Any because this mock replaces the real get_user_settings function,
        # which accepts flexible keyword arguments (like 'strict')
        # whose types vary and are not relevant to the test.
        def _mock_get_user_settings(
            unused_user_id: str, **_kwargs: Any
        ) -> None:
            """Mocked get_user_settings that always returns None."""
            return None

        get_user_settings_swap = self.swap(
            user_services,
            'get_user_settings',
            _mock_get_user_settings,
        )

        with get_user_settings_swap:
            with self.assertRaisesRegex(
                Exception, 'Unable to fetch user details for the given user'
            ):
                # This should fail when trying to create author details.
                blog_services.create_blog_author_details_model(self.user_id)

    def test_update_blog_author_details(self) -> None:
        new_author_name = 'new author name'
        new_author_bio = 'new blog author bio'

        pre_update_author_details = blog_services.get_blog_author_details(
            self.user_id
        )
        self.assertNotEqual(
            pre_update_author_details.displayed_author_name, new_author_name
        )
        self.assertNotEqual(
            pre_update_author_details.author_bio, new_author_bio
        )

        blog_services.update_blog_author_details(
            self.user_id, new_author_name, new_author_bio
        )

        updated_author_details = blog_services.get_blog_author_details(
            self.user_id
        )
        self.assertEqual(
            updated_author_details.displayed_author_name, new_author_name
        )
        self.assertEqual(updated_author_details.author_bio, new_author_bio)

    def test_update_blog_author_details_with_invalid_author_name(self) -> None:
        new_author_name = 'new_author_name'
        new_author_bio = 'new blog author bio'

        pre_update_author_details = blog_services.get_blog_author_details(
            self.user_id
        )
        self.assertNotEqual(
            pre_update_author_details.displayed_author_name, new_author_name
        )
        self.assertNotEqual(
            pre_update_author_details.author_bio, new_author_bio
        )

        with self.assertRaisesRegex(
            Exception,
            ('Author name can only have alphanumeric characters and spaces.'),
        ):
            blog_services.update_blog_author_details(
                self.user_id, new_author_name, new_author_bio
            )

    def test_update_blog_author_details_raises_exception(self) -> None:
        """Test that updating blog author details raises an exception if author not found."""

        def _mock_get_by_author(unused_user_id: str) -> None:
            return None

        get_by_author_swap = self.swap(
            blog_models.BlogAuthorDetailsModel,
            'get_by_author',
            _mock_get_by_author,
        )

        with get_by_author_swap:
            with self.assertRaisesRegex(
                Exception, 'Unable to fetch author details for the given user.'
            ):
                blog_services.update_blog_author_details(
                    self.user_id,
                    displayed_author_name='new name',
                    author_bio='new bio',
                )
