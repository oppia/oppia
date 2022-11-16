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

"""Tests for blog statistics domain."""


from __future__ import annotations
import calendar
import datetime

from core import feconf
from core import utils
from core.domain import blog_statistics_domain
from core.platform import models
from core.domain import event_services
from core.tests import test_utils


from typing import Dict, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_stats_models
    from mypy_imports import transaction_services

(blog_stats_models,) = models.Registry.import_models(
    [models.Names.BLOG_STATISTICS,]
)

class AuthorBlogPostsReadingTimeDomainUnitTests(test_utils.GenericTestBase):
    """Tests for author blog post reading time domain objects."""

    def setUp(self) -> None:
        """Set up for testing author blog post reading domain object."""
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        self.stats_obj = blog_statistics_domain.AuthorBlogPostsReadingTime(
            author_id=self.user_id_a,
            zero_to_one_min=100,
            one_to_two_min=20,
            two_to_three_min=200,
            three_to_four_min=0,
            four_to_five_min=6,
            five_to_six_min=0,
            six_to_seven_min=40,
            seven_to_eight_min=7,
            eight_to_nine_min=0,
            nine_to_ten_min=0,
            more_than_ten_min=0,
        )

    def test_to_human_readable_dict(self) -> None:
        """Checks conversion of readingTimeStats to dict."""
        expected_dict = {
            'zero_to_one_min': 100,
            'one_to_two_min': 20,
            'two_to_three_min': 200,
            'three_to_four_min': 0,
            'four_to_five_min': 6,
            'five_to_six_min': 0,
            'six_to_seven_min': 40,
            'seven_to_eight_min': 7,
            'eight_to_nine_min': 0,
            'nine_to_ten_min': 0,
            'more_than_ten_min': 0,
        }
        self.assertEqual(self.stats_obj.to_frontend_dict(), expected_dict)


    def _assert_valid_reading_time_stats_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that reading time domain object passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.stats_obj.validate()

    def test_reading_time_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.stats_obj.validate()

        # Validate with empty author id.
        self.stats_obj.author_id = ''
        self._assert_valid_reading_time_stats_domain_obj(
            'No author_id specified'
        )

        # Validate with invalid format.
        self.stats_obj.author_id = 'uid_%s%s' % ('a' * 31, 'A')
        self._assert_valid_reading_time_stats_domain_obj('wrong format')

        # Validate with invalid format.
        self.stats_obj.author_id = 1234
        self._assert_valid_reading_time_stats_domain_obj(
            'Author ID must be a string, but got 1234')


class BlogPostsReadingTimeDomainUnitTests(test_utils.GenericTestBase):
    """Tests for blog post reading time domain objects."""

    def setUp(self) -> None:
        """Set up for testing blog post reading domain object."""
        super().setUp()

        self.stats_obj = blog_statistics_domain.BlogPostReadingTime(
            blog_post_id='sampleId2345',
            zero_to_one_min=100,
            one_to_two_min=20,
            two_to_three_min=200,
            three_to_four_min=0,
            four_to_five_min=6,
            five_to_six_min=0,
            six_to_seven_min=40,
            seven_to_eight_min=7,
            eight_to_nine_min=0,
            nine_to_ten_min=0,
            more_than_ten_min=0,
        )

    def test_to_human_readable_dict(self) -> None:
        """Checks conversion of BlogAuthorDetails to dict."""
        expected_dict = {
            'blog_post_id': 'sampleId2345',
            'zero_to_one_min': 100,
            'one_to_two_min': 20,
            'two_to_three_min': 200,
            'three_to_four_min': 0,
            'four_to_five_min': 6,
            'five_to_six_min': 0,
            'six_to_seven_min': 40,
            'seven_to_eight_min': 7,
            'eight_to_nine_min': 0,
            'nine_to_ten_min': 0,
            'more_than_ten_min': 0,
        }
        self.assertEqual(self.stats_obj.to_frontend_dict(), expected_dict)


    def _assert_valid_reading_time_stats_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that reading time domain object passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.stats_obj.validate()

    def test_reading_time_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.stats_obj.validate()

        # Validate with empty blog post id.
        self.stats_obj.blog_post_id = ''
        self._assert_valid_reading_time_stats_domain_obj(
            'No blog_post_id specified'
        )

        # Validate with invalid format.
        self.stats_obj.blog_post_id = 'invalidBlogPostId'
        self._assert_valid_reading_time_stats_domain_obj(
            'Blog ID invalidBlogPostId is invalid')

        # Validate with invalid format.
        self.stats_obj.blog_post_id = 1234
        self._assert_valid_reading_time_stats_domain_obj(
            'Blog Post ID must be a string, but got 1234')


class AuthorBlogPostsReadsStatsDomainUnitTests(test_utils.GenericTestBase):
    """Tests for author blog post reads stats domain object."""

    def setUp(self) -> None:
        """Set up for testing blog post reading domain object."""
        super().setUp()

        self.stats_obj = blog_statistics_domain.BlogPostReadingTime(
            blog_post_id='sampleId2345',
            zero_to_one_min=100,
            one_to_two_min=20,
            two_to_three_min=200,
            three_to_four_min=0,
            four_to_five_min=6,
            five_to_six_min=0,
            six_to_seven_min=40,
            seven_to_eight_min=7,
            eight_to_nine_min=0,
            nine_to_ten_min=0,
            more_than_ten_min=0,
        )

    def test_to_human_readable_dict(self) -> None:
        """Checks conversion of BlogAuthorDetails to dict."""
        expected_dict = {
            'blog_post_id': 'sampleId2345',
            'zero_to_one_min': 100,
            'one_to_two_min': 20,
            'two_to_three_min': 200,
            'three_to_four_min': 0,
            'four_to_five_min': 6,
            'five_to_six_min': 0,
            'six_to_seven_min': 40,
            'seven_to_eight_min': 7,
            'eight_to_nine_min': 0,
            'nine_to_ten_min': 0,
            'more_than_ten_min': 0,
        }
        self.assertEqual(self.stats_obj.to_frontend_dict(), expected_dict)


    def _assert_valid_reading_time_stats_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that reading time domain object passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.stats_obj.validate()

    def test_reading_time_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.stats_obj.validate()

        # Validate with empty blog post id.
        self.stats_obj.blog_post_id = ''
        self._assert_valid_reading_time_stats_domain_obj(
            'No blog_post_id specified'
        )

        # Validate with invalid format.
        self.stats_obj.blog_post_id = 'invalidBlogPostId'
        self._assert_valid_reading_time_stats_domain_obj(
            'Blog ID invalidBlogPostId is invalid')

        # Validate with invalid format.
        self.stats_obj.blog_post_id = 1234
        self._assert_valid_reading_time_stats_domain_obj(
            'Blog Post ID must be a string, but got 1234')