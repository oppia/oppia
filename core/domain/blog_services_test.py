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
import math

from core import feconf
from core import utils
from core.domain import blog_domain
from core.domain import blog_services
from core.domain import search_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])

search_services = models.Registry.import_search_services()


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
            'tags': ['one', 'two']
        }
        self.change_dict_one: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '<p>Hello</p>',
            'tags': []
        }
        self.change_dict_two: blog_services.BlogPostChangeDict = {
            'title': 'Sample title two',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '<p>Hello</p>',
            'tags': ['one', 'two']
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
        blog_posts = (
            blog_services.get_blog_post_summary_models_list_by_user_id(
                self.user_id_a, True))
        self.assertEqual(blog_posts, [])
        blog_posts = (
            blog_services.get_blog_post_summary_models_list_by_user_id(
                self.user_id_a, False))
        self.assertEqual(self.blog_post_a_id, blog_posts[0].id)

    def test_get_new_blog_post_id(self) -> None:
        blog_post_id = blog_services.get_new_blog_post_id()
        self.assertFalse(blog_post_id == self.blog_post_a_id)
        self.assertFalse(blog_post_id == self.blog_post_b_id)

    def test_generate_summary_of_blog_post(self) -> None:
        html_content = '<a href="http://www.google.com">Hello, Oppia Blog</a>'
        expected_summary = 'Hello, Oppia Blog'
        summary = blog_services.generate_summary_of_blog_post(html_content)
        self.assertEqual(expected_summary, summary)

        content = '<p>abc</p><strong>QWERTY</strong>' * 150
        expected_summary = 'abc' * 99 + '...'
        summary = blog_services.generate_summary_of_blog_post(content)
        self.assertEqual(expected_summary, summary)

    def test_compute_summary_of_blog_post(self) -> None:
        expected_blog_post_summary = (
            blog_domain.BlogPostSummary(
                self.blog_post_a_id,
                self.user_id_a,
                '',
                '',
                '',
                [],
                self.blog_post_a.thumbnail_filename,
                self.blog_post_a.last_updated,
                self.blog_post_a.published_on
            )
        )
        blog_post_summary = (
            blog_services.compute_summary_of_blog_post(self.blog_post_a))
        self.assertEqual(
            expected_blog_post_summary.to_dict(), blog_post_summary.to_dict())

    def test_get_published_blog_post_summaries(self) -> None:
        self.assertEqual(
            len(blog_services.get_published_blog_post_summaries()),
            0
        )
        blog_services.update_blog_post(
            self.blog_post_a_id,
            self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)
        number_of_published_blogs = (
            blog_services.get_published_blog_post_summaries(0, 2)
        )
        self.assertEqual(
            len(number_of_published_blogs),
            1
        )

        number_of_published_blogs = (
            blog_services.get_published_blog_post_summaries(1, 1)
        )
        self.assertEqual(len(number_of_published_blogs), 0)

    def test_get_total_number_of_published_blog_post_summaries_by_author(
        self
    ) -> None:
        self.assertEqual(
             blog_services
             .get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_a
             ), 0)

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)

        self.assertEqual(
            blog_services
            .get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_a), 1)

        # Publishing blog post from user with user_id_b.
        change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample title B',
            'thumbnail_filename': 'test.svg',
            'content': '<p>hi<p>',
            'tags': ['one', 'two']
        }
        blog_services.update_blog_post(
                self.blog_post_b_id, change_dict)
        blog_services.publish_blog_post(self.blog_post_b_id)

        self.assertEqual(
            blog_services
            .get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_a), 1)
        self.assertEqual(
            blog_services
            .get_total_number_of_published_blog_post_summaries_by_author(
                self.user_id_b), 1)

    def test_get_total_number_of_published_blog_post_summaries(self) -> None:
        number_of_published_blogs = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(number_of_published_blogs, 0)
        blog_services.update_blog_post(
            self.blog_post_a_id,
            self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)
        number_of_published_blogs = (
            blog_services.get_total_number_of_published_blog_post_summaries()
        )
        self.assertEqual(number_of_published_blogs, 1)

    def test_get_published_blog_post_summaries_by_user_id(self) -> None:
        self.assertEqual(
            len(blog_services.get_published_blog_post_summaries_by_user_id(
                self.user_id_a, 20, 0
            )),
            0
        )
        blog_services.update_blog_post(
            self.blog_post_a_id,
            self.change_dict_two
        )
        blog_services.publish_blog_post(self.blog_post_a_id)
        no_of_published_blog_post = (
            blog_services.get_published_blog_post_summaries_by_user_id(
                self.user_id_a, 20, 0
            )
        )
        self.assertEqual(
            len(no_of_published_blog_post), 1
        )

    def test_get_blog_post_summary_from_model(self) -> None:
        blog_post_summary_model = (
            blog_models.BlogPostSummaryModel.get(self.blog_post_a_id))
        blog_post_summary = (
            blog_services.get_blog_post_summary_from_model(
                blog_post_summary_model))
        expected_blog_post_summary = (
            blog_domain.BlogPostSummary(
                self.blog_post_a_id,
                self.user_id_a,
                '',
                '',
                '',
                [],
                blog_post_summary_model.thumbnail_filename,
                blog_post_summary_model.last_updated,
                blog_post_summary_model.published_on,
                blog_post_summary_model.deleted
            )
        )
        self.assertEqual(
            blog_post_summary.to_dict(), expected_blog_post_summary.to_dict())

    def test_blog_post_summary_by_id(self) -> None:
        blog_post_summary = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_a_id)
        )
        expected_blog_post_summary = (
            blog_domain.BlogPostSummary(
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
        )
        self.assertEqual(
            blog_post_summary.to_dict(), expected_blog_post_summary.to_dict())

    def test_publish_blog_post(self) -> None:
        blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        self.assertFalse(blog_post_rights.blog_post_is_published)

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)
        blog_post_summary = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_a_id))
        blog_post = blog_services.get_blog_post_by_id(self.blog_post_a_id)
        blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))

        self.assertTrue(blog_post_rights.blog_post_is_published)
        self.assertIsNotNone(blog_post.published_on)
        self.assertIsNotNone(blog_post_summary.published_on)
        self.assertEqual(
            blog_post.published_on, blog_post_summary.published_on)

    def test_cannot_publish_invalid_blog_post(self) -> None:
        """Checks that an invalid blog post is not published."""
        with self.assertRaisesRegex(
            Exception, ('Title should not be empty')):
            blog_services.publish_blog_post(self.blog_post_a_id)

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one)
        with self.assertRaisesRegex(
            Exception, ('Atleast one tag should be selected')):
            blog_services.publish_blog_post(self.blog_post_a_id)

        change_dict_three: blog_services.BlogPostChangeDict = {
            'title': 'Sample',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '',
            'tags': ['one', 'two']
        }

        blog_services.update_blog_post(self.blog_post_a_id, change_dict_three)
        with self.assertRaisesRegex(
            Exception, ('Content can not be empty')):
            blog_services.publish_blog_post(self.blog_post_a_id)

        blog_services.delete_blog_post(self.blog_post_a_id)
        with self.assertRaisesRegex(
            Exception, ('The given blog post does not exist')):
            blog_services.publish_blog_post(self.blog_post_a_id)

    def test_unpublish_blog_post(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)
        blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        self.assertTrue(blog_post_rights.blog_post_is_published)

        blog_services.unpublish_blog_post(self.blog_post_a_id)
        blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        self.assertFalse(blog_post_rights.blog_post_is_published)
        blog_post_model = (
            blog_services.get_blog_post_by_id(self.blog_post_a_id))
        self.assertIsNone(blog_post_model.published_on)
        blog_post_summary_model = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_a_id))
        self.assertIsNone(blog_post_summary_model.published_on)

    def test_cannot_unpublish_invalid_blog_post(self) -> None:
        blog_services.delete_blog_post(self.blog_post_a_id)
        with self.assertRaisesRegex(
            Exception, ('The given blog post does not exist')):
            blog_services.unpublish_blog_post(self.blog_post_a_id)

    def test_filter_blog_post_ids(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)
        filtered_model_ids = (
            blog_services.filter_blog_post_ids(self.user_id_a, True))
        self.assertEqual(filtered_model_ids, [self.blog_post_a_id])
        filtered_model_ids = (
            blog_services.filter_blog_post_ids(self.user_id_b, False))
        self.assertEqual(filtered_model_ids, [self.blog_post_b_id])

    def test_update_blog_post(self) -> None:
        self.assertEqual(self.blog_post_a.title, '')
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one)
        updated_blog_post = (
            blog_services.get_blog_post_by_id(self.blog_post_a_id))
        self.assertEqual(updated_blog_post.thumbnail_filename, 'thummbnail.svg')
        self.assertEqual(updated_blog_post.content, '<p>Hello</p>')
        lower_id = '-' + self.blog_post_a_id.lower()
        self.assertEqual(
            updated_blog_post.url_fragment, 'sample-title' + lower_id)

        blog_services.update_blog_post(self.blog_post_a_id, self.change_dict)
        updated_blog_post = (
            blog_services.get_blog_post_by_id(self.blog_post_a_id))
        self.assertEqual(updated_blog_post.tags, ['one', 'two'])

        with self.assertRaisesRegex(
            Exception, (
                'Blog Post with given title already exists: %s'
                % 'Sample Title')):
            blog_services.update_blog_post(
                self.blog_post_b_id, self.change_dict_one)

    def test_get_blog_post_by_url_fragment(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one)
        expected_blog_post = (
            blog_services.get_blog_post_by_id(self.blog_post_a_id))
        lower_id = '-' + self.blog_post_a_id.lower()
        blog_post = blog_services.get_blog_post_by_url_fragment(
            'sample-title' + lower_id)
        # Ruling out the possibility of None for mypy type checking.
        assert blog_post is not None
        self.assertEqual(blog_post.to_dict(), expected_blog_post.to_dict())

    def test_get_blog_posy_by_invalid_url(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception,
            'Blog Post URL fragment should be a string. Recieved:'
            r'\[123\]'):
            blog_services.does_blog_post_with_url_fragment_exist([123])  # type: ignore[arg-type]

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception,
            'Blog Post URL fragment should be a string. Recieved:'
            '123'):
            blog_services.does_blog_post_with_url_fragment_exist(123)  # type: ignore[arg-type]

    def test_does_blog_post_with_url_fragment_exist(self) -> None:
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one)
        lower_id = '-' + self.blog_post_a_id.lower()
        self.assertTrue(
            blog_services.does_blog_post_with_url_fragment_exist(
                'sample-title' + lower_id))
        self.assertFalse(
            blog_services.does_blog_post_with_url_fragment_exist('title'))

    def test_update_blog_post_summary(self) -> None:
        blog_post_summary = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_a_id)
        )
        self.assertEqual(blog_post_summary.title, '')
        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one)
        updated_blog_post_summary = (
            blog_services.get_blog_post_summary_by_id(self.blog_post_a_id)
        )
        self.assertEqual(
            updated_blog_post_summary.thumbnail_filename, 'thummbnail.svg')
        self.assertEqual(updated_blog_post_summary.summary, 'Hello')
        lower_id = '-' + self.blog_post_a_id.lower()
        self.assertEqual(
            updated_blog_post_summary.url_fragment, 'sample-title' + lower_id)

    def test_check_can_edit_blog_post(self) -> None:
        blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        user_info_a = user_services.get_user_actions_info(self.user_id_a)
        user_info_b = user_services.get_user_actions_info(self.user_id_b)

        self.assertFalse(blog_services.check_can_edit_blog_post(
            user_info_b, blog_post_rights))
        self.assertTrue(blog_services.check_can_edit_blog_post(
            user_info_a, blog_post_rights))
        self.assertFalse(blog_services.check_can_edit_blog_post(
            user_info_a, None))

        user_info_b.actions.append(u'EDIT_ANY_BLOG_POST')
        self.assertTrue(blog_services.check_can_edit_blog_post(
            user_info_b, blog_post_rights))

    def test_deassign_user_from_all_blog_posts(self) -> None:
        blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        self.assertTrue(self.user_id_a in blog_post_rights.editor_ids)

        blog_services.deassign_user_from_all_blog_posts(self.user_id_a)

        updated_blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        self.assertFalse(self.user_id_a in updated_blog_post_rights.editor_ids)

    def test_generate_url_fragment(self) -> None:
        url_fragment = (
            blog_services.generate_url_fragment(
                'Sample Url Fragment', 'ABC123EFG'))
        self.assertEqual(url_fragment, 'sample-url-fragment-abc123efg')

        url_fragment = (
            blog_services.generate_url_fragment(
                'SaMple Url FrAgMent', 'ABC123Efgh'))
        self.assertEqual(url_fragment, 'sample-url-fragment-abc123efgh')

    def test_save_blog_post_rights(self) -> None:
        blog_post_rights = blog_domain.BlogPostRights(
            self.blog_post_a_id,
            [self.user_id_a, self.user_id_b],
            False
        )
        blog_services.save_blog_post_rights(blog_post_rights)
        fetched_blog_post_rights = (
            blog_services.get_blog_post_rights(self.blog_post_a_id))
        self.assertEqual(
            blog_post_rights.to_dict(), fetched_blog_post_rights.to_dict())

    def test_delete_blog_post(self) -> None:
        blog_services.delete_blog_post(self.blog_post_a_id)
        self.assertIsNone(blog_services.get_blog_post_rights(
            self.blog_post_a_id, strict=False))
        self.assertIsNone(blog_services.get_blog_post_by_id(
            self.blog_post_a_id, strict=False))
        self.assertIsNone(blog_services.get_blog_post_summary_by_id(
            self.blog_post_a_id, strict=False))

    def test_get_blog_post_summary_by_title(self) -> None:
        model = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_a_id))
        model.title = 'Hello Bloggers'
        model.update_timestamps()
        model.put()

        blog_post_summary = (
            blog_services.get_blog_post_summary_by_title('Hello Bloggers'))
        # Ruling out the possibility of None for mypy type checking.
        assert blog_post_summary is not None
        expected_blog_post_summary = (
            blog_domain.BlogPostSummary(
                self.blog_post_a_id,
                self.user_id_a,
                'Hello Bloggers',
                '',
                '',
                [],
                blog_post_summary.thumbnail_filename,
                blog_post_summary.last_updated,
                blog_post_summary.published_on
            )
        )
        self.assertEqual(
            blog_post_summary.to_dict(), expected_blog_post_summary.to_dict())
        self.assertIsNone(blog_services.get_blog_post_summary_by_title('Hello'))

    def test_update_blog_models_author_and_published_on_date_successfully(
        self
    ) -> None:
        model = (
            blog_models.BlogPostModel.get_by_id(self.blog_post_a_id))
        model.title = 'sample title'
        model.tags = ['news']
        model.thumbnail_filename = 'image.png'
        model.content = 'hello bloggers'
        model.url_fragment = 'sample'
        model.published_on = datetime.datetime.utcnow()
        model.update_timestamps()
        model.put()

        blog_services.update_blog_models_author_and_published_on_date(
            self.blog_post_a_id, self.user_id_b, '05/09/2000')

        blog_model = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_a_id))
        self.assertEqual(
            blog_model.author_id, self.user_id_b)
        self.assertEqual(
            blog_model.published_on, datetime.datetime(2000, 5, 9, 0, 0))

        blog_summary_model = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_a_id))
        self.assertEqual(
            blog_summary_model.author_id, self.user_id_b)
        self.assertEqual(
            blog_summary_model.published_on, datetime.datetime(
                2000, 5, 9, 0, 0))

        blog_rights_model = (
            blog_models.BlogPostRightsModel.get_by_id(self.blog_post_a_id))
        self.assertTrue(
            self.user_id_b in blog_rights_model.editor_ids)

    def test_update_blog_models_author_and_publish_date_with_invalid_date(
        self
    ) -> None:
        model = (
            blog_models.BlogPostModel.get_by_id(self.blog_post_a_id))
        model.title = 'sample title'
        model.tags = ['news']
        model.thumbnail_filename = 'image.png'
        model.content = 'hello bloggers'
        model.url_fragment = 'sample'
        model.published_on = datetime.datetime.utcnow()
        model.update_timestamps()
        model.put()

        # Invalid month.
        with self.assertRaisesRegex(
            Exception,
            'time data \'123/09/2000, 00:00:00:00\' does not match' +
            ' format \'%m/%d/%Y, %H:%M:%S:%f\''):
            blog_services.update_blog_models_author_and_published_on_date(
                self.blog_post_a_id, self.user_id_b, '123/09/2000')

        # Invalid day.
        with self.assertRaisesRegex(
            Exception,
            'time data \'01/38/2000, 00:00:00:00\' does not match' +
            ' format \'%m/%d/%Y, %H:%M:%S:%f\''):
            blog_services.update_blog_models_author_and_published_on_date(
                self.blog_post_a_id, self.user_id_b, '01/38/2000')

        # Invalid year.
        with self.assertRaisesRegex(
            Exception,
            'time data \'01/22/31126, 00:00:00:00\' does not match' +
            ' format \'%m/%d/%Y, %H:%M:%S:%f\''):
            blog_services.update_blog_models_author_and_published_on_date(
                self.blog_post_a_id, self.user_id_b, '01/22/31126')

    def test_update_blog_model_author_and_publish_on_with_invalid_blog_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Entity for class BlogPostModel with id invalid_blog_id not found'):
            blog_services.update_blog_models_author_and_published_on_date(
                'invalid_blog_id', self.user_id_b, '01/12/2000')

    def test_index_blog_post_summaries_given_ids(self) -> None:
        all_blog_post_ids = []
        for i in range(5):
            blog_post = blog_services.create_new_blog_post(self.user_id_a)
            all_blog_post_ids.append(blog_post.id)
        expected_blog_post_ids = all_blog_post_ids[:-1]

        all_blog_post_titles = [
            'title 0', 'title 1', 'title 2', 'title 3', 'title 4']
        expected_blog_post_titles = all_blog_post_titles[:-1]

        all_blog_post_thumbnails = [
            'thumb0.svg', 'thumb1.svg', 'thumb2.svg', 'thumb3.svg', 'thumb4.svg'
        ]

        all_blog_post_tags = [
            'tag0', 'tag1', 'tag2', 'tag3', 'tag4',
        ]
        expected_blog_post_tags = all_blog_post_tags[:-1]

        def mock_add_documents_to_index(
            docs: List[Dict[str, str]], index: int
        ) -> List[str]:
            self.assertEqual(index, blog_services.SEARCH_INDEX_BLOG_POSTS)
            ids = [doc['id'] for doc in docs]
            titles = [doc['title'] for doc in docs]
            tags = [doc['tags'] for doc in docs]
            self.assertEqual(set(ids), set(expected_blog_post_ids))
            self.assertEqual(set(titles), set(expected_blog_post_titles))
            self.assertEqual(tags.sort(), expected_blog_post_tags.sort())
            return ids

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(
            search_services,
            'add_documents_to_index',
            add_docs_counter)

        for i in range(5):
            change_dict: blog_services.BlogPostChangeDict = {
                'title': all_blog_post_titles[i],
                'thumbnail_filename': all_blog_post_thumbnails[i],
                'content': '<p>Hello Blog Post +</p>' + str(i),
                'tags': [all_blog_post_tags[i]]
            }
            blog_services.update_blog_post(
                all_blog_post_ids[i],
                change_dict
            )

        # We're only publishing the first 4 blog posts, so we're not
        # expecting the last blog post to be indexed.
        for i in range(4):
            blog_services.publish_blog_post(all_blog_post_ids[i])

        with add_docs_swap:
            blog_services.index_blog_post_summaries_given_ids(all_blog_post_ids)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_updated_blog_post_is_added_correctly_to_index(self) -> None:
        blog_post = blog_services.create_new_blog_post(self.user_id_a)
        old_blog_post_title = 'title 0'
        old_blog_post_tag = ['tag0']
        old_blog_post_change_dict: blog_services.BlogPostChangeDict = {
            'title': old_blog_post_title,
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Blog Post</p>',
            'tags': old_blog_post_tag
        }
        new_blog_post_title = 'title 1'
        new_blog_post_tags = ['tag1', 'tag2']
        new_blog_post_change_dict: blog_services.BlogPostChangeDict = {
            'title': new_blog_post_title,
            'thumbnail_filename': 'changed_thumb.svg',
            'content': '<p>Hello Blog Post</p>',
            'tags': new_blog_post_tags,
        }
        actual_docs = []

        def mock_add_documents_to_index(
            docs: List[Dict[str, str]], index: int
        ) -> None:
            self.assertEqual(index, blog_services.SEARCH_INDEX_BLOG_POSTS)
            actual_docs.extend(docs)

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(
            search_services,
            'add_documents_to_index',
            add_docs_counter)

        with add_docs_swap:

            blog_services.update_blog_post(
                blog_post.id,
                old_blog_post_change_dict,
            )
            blog_services.publish_blog_post(blog_post.id)
            old_blog_post_summary = blog_services.get_blog_post_summary_by_id(
                blog_post.id)
            if old_blog_post_summary.published_on:
                rank = math.floor(
                    utils.get_time_in_millisecs(
                        old_blog_post_summary.published_on))
            else:
                rank = 0
            initial_blog_post_doc = {
                'id': blog_post.id,
                'rank': rank,
                'tags': old_blog_post_tag,
                'title': old_blog_post_title
            }
            self.assertEqual(actual_docs, [initial_blog_post_doc])
            self.assertEqual(add_docs_counter.times_called, 1)

            actual_docs = []
            blog_services.update_blog_post(
                blog_post.id,
                new_blog_post_change_dict,
            )
            blog_services.publish_blog_post(blog_post.id)
            new_blog_post_summary = blog_services.get_blog_post_summary_by_id(
                blog_post.id)
            if new_blog_post_summary.published_on:
                rank = math.floor(
                    utils.get_time_in_millisecs(
                        new_blog_post_summary.published_on))
            else:
                rank = 0
            updated_blog_post_doc = {
                'id': blog_post.id,
                'rank': rank,
                'tags': new_blog_post_tags,
                'title': new_blog_post_title
            }

            self.process_and_flush_pending_tasks()
            self.assertEqual(actual_docs, [updated_blog_post_doc])
            self.assertEqual(add_docs_counter.times_called, 2)


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

    def test_get_blog_author_details_model(self) -> None:
        author_details = blog_services.get_blog_author_details(self.user_id)
        assert author_details is not None
        self.assertEqual(author_details.displayed_author_name, self.user_name)
        self.assertEqual(author_details.author_bio, self.user_bio)

    def test_get_blog_author_details_model_raises_exception(self) -> None:
        def _mock_get_author_details_by_author(unused_user_id: str) -> None:
            return None

        get_author_details_swap = self.swap(
            blog_models.BlogAuthorDetailsModel,
            'get_by_author',
            _mock_get_author_details_by_author
            )

        with get_author_details_swap:
            with self.assertRaisesRegex(
                Exception,
                (
                    'Unable to fetch author details for the given user.'
                )
            ):
                blog_services.get_blog_author_details(self.user_id)

    def test_update_blog_author_details(self) -> None:
        new_author_name = 'new author name'
        new_author_bio = 'new blog author bio'

        pre_update_author_details = blog_services.get_blog_author_details(
            self.user_id)
        assert pre_update_author_details is not None
        self.assertNotEqual(
            pre_update_author_details.displayed_author_name, new_author_name)
        self.assertNotEqual(
            pre_update_author_details.author_bio, new_author_bio)

        blog_services.update_blog_author_details(
            self.user_id, new_author_name, new_author_bio)

        updated_author_details = blog_services.get_blog_author_details(
            self.user_id)
        assert updated_author_details is not None
        self.assertEqual(
            updated_author_details.displayed_author_name, new_author_name)
        self.assertEqual(updated_author_details.author_bio, new_author_bio)

    def test_update_blog_author_details_with_invalid_author_name(self) -> None:
        new_author_name = 'new_author_name'
        new_author_bio = 'new blog author bio'

        pre_update_author_details = blog_services.get_blog_author_details(
            self.user_id)
        assert pre_update_author_details is not None
        self.assertNotEqual(
            pre_update_author_details.displayed_author_name, new_author_name)
        self.assertNotEqual(
            pre_update_author_details.author_bio, new_author_bio)

        with self.assertRaisesRegex(
            Exception, (
                'Author name can only have alphanumeric characters and spaces.'
            )):
            blog_services.update_blog_author_details(
                self.user_id, new_author_name, new_author_bio)


class BlogPostSummaryQueriesUnitTests(test_utils.GenericTestBase):
    """Tests blog post summary query methods which operate on BlogPostSummary
    objects.
    """

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        # Setup the blog posts to fit into different tags groups.
        # Also, ensure 2 of them have similar titles and are written by 2
        # different authors.
        self.ids_of_blog_posts_by_user_A = []
        for _ in range(3):
            blog_post = blog_services.create_new_blog_post(self.user_id_a)
            self.ids_of_blog_posts_by_user_A.append(blog_post.id)

        self.ids_of_blog_posts_by_user_B = []
        for _ in range(4):
            blog_post = blog_services.create_new_blog_post(self.user_id_b)
            self.ids_of_blog_posts_by_user_B.append(blog_post.id)

        self.all_blog_post_ids = (
            self.ids_of_blog_posts_by_user_A + self.ids_of_blog_posts_by_user_B
        )

        change_dict_1: blog_services.BlogPostChangeDict = {
            'title': 'Welcome to Oppia',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog Authors',
            'tags': ['Math', 'Science']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_A[0], change_dict_1)

        change_dict_2: blog_services.BlogPostChangeDict = {
            'title': 'Welcome',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog Authors',
            'tags': ['Math', 'Social']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_A[1], change_dict_2)

        change_dict_3: blog_services.BlogPostChangeDict = {
            'title': 'Intro to Mathematics in Oppia',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog Authors',
            'tags': ['Math']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_A[2], change_dict_3)

        change_dict_4: blog_services.BlogPostChangeDict = {
            'title': 'New Lessons in Mathematics',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Hello Blog',
            'tags': ['Math', 'Oppia']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_B[0], change_dict_4)
        change_dict_5: blog_services.BlogPostChangeDict = {
            'title': 'Basic English Lessons',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Authors in Oppia',
            'tags': ['English', 'Oppia', 'Social']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_B[1], change_dict_5)

        change_dict_6: blog_services.BlogPostChangeDict = {
            'title': 'Basic',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Basic Subject Lessons',
            'tags': ['English', 'Science', 'Social']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_B[2], change_dict_6)

        change_dict_7: blog_services.BlogPostChangeDict = {
            'title': 'Basic Learning',
            'thumbnail_filename': 'thumbnail.svg',
            'content': 'Basic Subject Lessons',
            'tags': ['English', 'Math', 'Science', 'Social']
        }
        blog_services.update_blog_post(
            self.ids_of_blog_posts_by_user_B[3], change_dict_7)

        # Publishing blog post 0-6. Draft blog post summaries should not show up
        # in a search query, even if they're indexed. Publishing a blog post
        # indexes the blog post summary.
        for blog_id in self.all_blog_post_ids[:6]:
            blog_services.publish_blog_post(blog_id)

        # Try Adding blog post 7 to the search index without publishing.
        blog_services.index_blog_post_summaries_given_ids(
            [self.all_blog_post_ids[6]])

    def test_get_blog_post_summaries_with_no_query(self) -> None:
        # An empty query should return all published blog posts.
        (blog_post_ids, search_offset) = (
            blog_services.get_blog_post_ids_matching_query(
                '',
                [],
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
            )
        )
        self.assertEqual(
            sorted(blog_post_ids),
            sorted(self.all_blog_post_ids[:6])
        )
        self.assertIsNone(search_offset)

    def test_get_blog_post_summaries_with_deleted_blog_post(self) -> None:
        # Ensure deleted blog posts do not show up in search results. Deleting
        # first 3 blog posts.
        for blog_id in self.all_blog_post_ids[:3]:
            blog_services.delete_blog_post(blog_id)

        blog_post_ids = (
            blog_services.get_blog_post_ids_matching_query(
                '',
                [],
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
            )
        )[0]
        self.assertEqual(
            sorted(blog_post_ids),
            sorted(self.all_blog_post_ids[3:6])
        )

        # Deleting remaining published blog posts.
        for blog_id in self.all_blog_post_ids[3:6]:
            blog_services.delete_blog_post(blog_id)
        # If no published blog posts are loaded, a blank query should not get
        # any blog post.
        self.assertEqual(
            blog_services.get_blog_post_ids_matching_query(
                '',
                [],
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
            ),
            ([], None)
        )

    def test_search_blog_post_summaries(self) -> None:

        # Search for blog posts containing 'Oppia'.
        blog_post_ids, _ = blog_services.get_blog_post_ids_matching_query(
            'Oppia',
            [],
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
        )
        self.assertEqual(
            sorted(blog_post_ids),
            sorted([
                self.ids_of_blog_posts_by_user_A[0],
                self.ids_of_blog_posts_by_user_A[2],
            ])
        )

        # Search for blog posts containing 'Basic'.
        blog_post_ids, _ = blog_services.get_blog_post_ids_matching_query(
            'Basic',
            [],
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
        )
        self.assertEqual(
            sorted(blog_post_ids),
            sorted([
                self.ids_of_blog_posts_by_user_B[1],
                self.ids_of_blog_posts_by_user_B[2],
            ])
        )

        # Search for blog posts containing tag 'Math' and 'Social'.
        blog_post_ids, _ = blog_services.get_blog_post_ids_matching_query(
            '',
            ['Math', 'Social'],
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
        )
        self.assertEqual(
            sorted(blog_post_ids),
            sorted([
                self.ids_of_blog_posts_by_user_A[1],
            ])
        )

        # Search for blog posts containing 'Lessons'.
        blog_post_ids, _ = blog_services.get_blog_post_ids_matching_query(
            'Lessons',
            [],
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
        )
        self.assertEqual(
            sorted(blog_post_ids),
            sorted([
                self.ids_of_blog_posts_by_user_B[0],
                self.ids_of_blog_posts_by_user_B[1],
            ])
        )

        # Search for blog posts containing 'Lessons' and tag 'Social'.
        blog_post_ids, _ = blog_services.get_blog_post_ids_matching_query(
            'Lessons',
            ['Social'],
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
        )
        self.assertEqual(
            sorted(blog_post_ids),
            sorted([
                self.ids_of_blog_posts_by_user_B[1],
            ])
        )

    def test_blog_post_summaries_pagination_in_filled_search_results(
        self
    ) -> None:
        # Ensure the maximum number of blog posts that can fit on the search
        # results page is maintained by the summaries function.
        with self.swap(
            feconf, 'MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE', 2
            ):
            # Need to load 3 pages to find all of the blog posts. Since the
            # returned order is arbitrary, we need to concatenate the results
            # to ensure all blog posts are returned. We validate the correct
            # length is returned each time.
            found_blog_post_ids = []

            # Page 1: 2 initial blog posts.
            (blog_post_ids, search_offset) = (
                blog_services.get_blog_post_ids_matching_query(
                    '',
                    [],
                    feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE,
                )
            )
            self.assertEqual(len(blog_post_ids), 2)
            self.assertIsNotNone(search_offset)
            found_blog_post_ids += blog_post_ids

            # Page 2: 2 more blog posts.
            (blog_post_ids, search_offset) = (
                blog_services.get_blog_post_ids_matching_query(
                    '',
                    [],
                    feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE,
                    offset=search_offset
                )
            )
            self.assertEqual(len(blog_post_ids), 2)
            self.assertIsNotNone(search_offset)
            found_blog_post_ids += blog_post_ids

            # Page 3: 2 final blog posts.
            (blog_post_ids, search_offset) = (
                blog_services.get_blog_post_ids_matching_query(
                    '',
                    [],
                    feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE,
                    offset=search_offset
                )
            )
            self.assertEqual(len(blog_post_ids), 2)
            self.assertIsNone(search_offset)
            found_blog_post_ids += blog_post_ids

            # Validate all blog posts were seen.
            self.assertEqual(
                sorted(found_blog_post_ids),
                sorted(self.all_blog_post_ids[:6])
            )

    def test_get_blog_post_ids_matching_query_with_stale_blog_post_ids(
            self
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        search_results_page_size_swap = self.swap(
            feconf, 'MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE', 5)
        max_iterations_swap = self.swap(blog_services, 'MAX_ITERATIONS', 1)

        def _mock_delete_documents_from_index(
            unused_doc_ids: List[str], unused_index: int
        ) -> None:
            """Mocks delete_documents_from_index() so that the blog post is
            not deleted from the document on deleting the blog post. This is
            required to fetch stale blog post ids.
            """
            pass

        with self.swap(
            search_services,
            'delete_documents_from_index',
            _mock_delete_documents_from_index):
            blog_services.delete_blog_post(self.all_blog_post_ids[0])
            blog_services.delete_blog_post(self.all_blog_post_ids[1])

        with logging_swap, search_results_page_size_swap, max_iterations_swap:
            (blog_post_ids, _) = (
                blog_services.get_blog_post_ids_matching_query(
                    '',
                    [],
                    feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
                )
            )

        self.assertEqual(
            observed_log_messages,
            [
                'Search index contains stale blog post ids: '
                '%s, %s' % (
                    self.all_blog_post_ids[0], self.all_blog_post_ids[1]),
                'Could not fulfill search request for query string ; at '
                'least 1 retries were needed.'
            ]
        )
        self.assertEqual(len(blog_post_ids), 3)
