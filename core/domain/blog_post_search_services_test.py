# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.search_services."""

from __future__ import annotations

from core.domain import blog_post_search_services
from core.domain import blog_services
from core.platform import models
from core.tests import test_utils

from typing import List, Optional, Tuple

blog_search_services = models.Registry.import_search_services()


class BlogPostSearchServicesUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()

        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')  # type: ignore[no-untyped-call]
        self.user_id_b = self.get_user_id_from_email('b@example.com')  # type: ignore[no-untyped-call]

        self.blog_post_a = blog_services.create_new_blog_post(self.user_id_a)
        self.blog_post_b = blog_services.create_new_blog_post(self.user_id_b)
        self.blog_post_a_id = self.blog_post_a.id
        self.blog_post_b_id = self.blog_post_b.id

        self.change_dict_one: blog_services.BlogPostChangeDict = {
            'title': 'Sample title one',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '<p>Hello</p>',
            'tags': ['one', 'two']
        }

        self.change_dict_two: blog_services.BlogPostChangeDict = {
            'title': 'Sample title two',
            'thumbnail_filename': 'thummbnail.svg',
            'content': '<p>Hello</p>',
            'tags': ['two']
        }

        blog_services.update_blog_post(
            self.blog_post_a_id, self.change_dict_one)
        blog_services.update_blog_post(
            self.blog_post_b_id, self.change_dict_two)
        blog_services.publish_blog_post(self.blog_post_a_id)
        blog_services.publish_blog_post(self.blog_post_b_id)

    def test_search_blog_post_summaries(self) -> None:
        expected_query_string = 'a query string'
        expected_offset = 0
        expected_size = 30
        expected_result_offset = 30
        doc_ids = ['id1', 'id2']

        def mock_search(
            query_string: str,
            index: str,
            tags: List[str],
            offset: Optional[int] = None,
            size: int = 20,
            ids_only: bool = False,
            retries: int = 3
        ) -> Tuple[List[str], Optional[int]]:
            self.assertEqual(query_string, expected_query_string)
            self.assertEqual(
                index, blog_post_search_services.SEARCH_INDEX_BLOG_POSTS)
            self.assertEqual(tags, [])
            self.assertEqual(offset, expected_offset)
            self.assertEqual(size, expected_size)
            self.assertEqual(ids_only, True)
            self.assertEqual(retries, 3)

            return doc_ids, expected_result_offset

        with self.swap(
            blog_search_services, 'blog_post_summaries_search', mock_search
        ):
            result, result_offset = (
                blog_post_search_services.search_blog_post_summaries(
                    expected_query_string, [], expected_size,
                    offset=expected_offset,
                )
            )

        self.assertEqual(result_offset, expected_result_offset)
        self.assertEqual(result, doc_ids)

    def test_clear_blog_post_search_index(self) -> None:
        result = blog_post_search_services.search_blog_post_summaries(
            'title', [], 2)[0]
        self.assertEqual(result, [self.blog_post_a_id, self.blog_post_b_id])
        blog_post_search_services.clear_blog_post_summaries_search_index()
        result = blog_post_search_services.search_blog_post_summaries(
            'title', [], 2)[0]
        self.assertEqual(result, [])

    def test_delete_blog_posts_from_search_index(self) -> None:

        def _mock_delete_docs(ids: List[str], index: str) -> None:
            """Mocks delete_documents_from_index()."""
            self.assertEqual(ids, [self.blog_post_a_id])
            self.assertEqual(
                index, blog_post_search_services.SEARCH_INDEX_BLOG_POSTS)

        delete_docs_counter = test_utils.CallCounter(_mock_delete_docs)  # type: ignore[no-untyped-call]

        delete_docs_swap = self.swap(
            blog_search_services, 'delete_documents_from_index',
            delete_docs_counter)

        with delete_docs_swap:
            blog_post_search_services.delete_blog_post_summary_from_search_index(self.blog_post_a_id)  # pylint: disable=line-too-long

        self.assertEqual(delete_docs_counter.times_called, 1)

    def test_should_not_index_draft_blog_post(self) -> None:
        result = blog_post_search_services.search_blog_post_summaries(
            'title', [], 2)[0]
        self.assertEqual(result, [self.blog_post_a_id, self.blog_post_b_id])

        # Unpublishing a blog post removes it from the search index.
        blog_services.unpublish_blog_post(self.blog_post_a_id)
        result = blog_post_search_services.search_blog_post_summaries(
            'title', [], 2)[0]
        self.assertEqual(result, [self.blog_post_b_id])

        # Trying indexing draft blog post
        draft_blog_post = blog_services.get_blog_post_summary_by_id(self.blog_post_a_id)
        blog_post_search_services.index_blog_post_summaries([draft_blog_post])

        result = blog_post_search_services.search_blog_post_summaries(
            'title', [], 2)[0]
        self.assertEqual(result, [self.blog_post_b_id])
