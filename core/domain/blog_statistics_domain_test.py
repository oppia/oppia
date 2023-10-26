# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

import datetime

from core import utils
from core.domain import blog_statistics_domain
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models
    from mypy_imports import blog_stats_models


(blog_stats_models, blog_models) = models.Registry.import_models([
    models.Names.BLOG_STATISTICS, models.Names.BLOG
])


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

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        self.stats_obj.author_id = 1234 # type: ignore[assignment]
        self._assert_valid_reading_time_stats_domain_obj(
            'Author ID must be a string, but got 1234'
        )


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
            'Blog Post ID invalidBlogPostId is invalid'
        )

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        self.stats_obj.blog_post_id = 1234 # type: ignore[assignment]
        self._assert_valid_reading_time_stats_domain_obj(
            'Blog Post ID must be a string, but got 1234'
        )


class AuthorBlogPostsReadsStatsDomainUnitTests(test_utils.GenericTestBase):
    """Tests for author blog post reads stats domain object."""

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20).replace(hour=6)

    def setUp(self) -> None:
        """Set up for testing blog post reading domain object."""
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        with self.mock_datetime_utcnow(self.MOCK_DATE):
            stats_model = (
                blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
                    .create(self.user_id_a)
            )

        self.author_stats = (
            blog_statistics_domain.AuthorBlogPostReadsAggregatedStats(
                self.user_id_a,
                stats_model.reads_by_hour,
                stats_model.reads_by_date,
                stats_model.reads_by_month,
                stats_model.created_on
            )
        )

    def _assert_valid_author_blog_post_reads_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that reading time domain object passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.author_stats.validate()

    def test_author_blog_post_reads_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.author_stats.validate()

        # Validate with empty author id.
        self.author_stats.author_id = ''
        self._assert_valid_author_blog_post_reads_domain_obj(
            'No author_id specified'
        )

        # Validate with invalid format.
        self.author_stats.author_id = 'uid_%s%s' % ('a' * 31, 'A')
        self._assert_valid_author_blog_post_reads_domain_obj('wrong format')

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        self.author_stats.author_id = 1234 # type: ignore[assignment]
        self._assert_valid_author_blog_post_reads_domain_obj(
            'Author ID must be a string, but got 1234'
        )


class AuthorBlogPostsViewsStatsDomainUnitTests(test_utils.GenericTestBase):
    """Tests for author blog post views stats domain object."""

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20)

    def setUp(self) -> None:
        """Set up for testing blog post reading domain object."""
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        with self.mock_datetime_utcnow(self.MOCK_DATE):
            stats_model = (
                blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel
                    .create(self.user_id_a)
            )

        self.author_stats = (
            blog_statistics_domain.AuthorBlogPostViewsAggregatedStats(
                self.user_id_a,
                stats_model.views_by_hour,
                stats_model.views_by_date,
                stats_model.views_by_month,
                stats_model.created_on
            )
        )

    def _assert_valid_author_blog_post_views_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that author blog post views domain object passes
        validation.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.author_stats.validate()

    def test_author_blog_post_views_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.author_stats.validate()

        # Validate with empty author id.
        self.author_stats.author_id = ''
        self._assert_valid_author_blog_post_views_domain_obj(
            'No author_id specified'
        )

        # Validate with invalid format.
        self.author_stats.author_id = 'uid_%s%s' % ('a' * 31, 'A')
        self._assert_valid_author_blog_post_views_domain_obj('wrong format')

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        self.author_stats.author_id = 1234  # type: ignore[assignment]
        self._assert_valid_author_blog_post_views_domain_obj(
            'Author ID must be a string, but got 1234'
        )


class BlogPostsReadsStatsDomainUnitTests(test_utils.GenericTestBase):
    """Tests for blog post reads stats domain object."""

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20)

    def setUp(self) -> None:
        """Set up for testing blog post reads stats domain object."""
        super().setUp()
        self.blog_id_a = blog_models.BlogPostModel.generate_new_blog_post_id()
        with self.mock_datetime_utcnow(self.MOCK_DATE):
            stats_model = (
                blog_stats_models.BlogPostReadsAggregatedStatsModel
                    .create(self.blog_id_a)
            )

        self.blog_stats = (
            blog_statistics_domain.BlogPostReadsAggregatedStats(
                self.blog_id_a,
                stats_model.reads_by_hour,
                stats_model.reads_by_date,
                stats_model.reads_by_month,
                stats_model.created_on
            )
        )

    def _assert_valid_blog_post_reads_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that reading time domain object passes validation."""
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_stats.validate()

    def test_author_blog_post_reads_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.blog_stats.validate()

        # Validate with empty blog post id.
        self.blog_stats.blog_post_id = ''
        self._assert_valid_blog_post_reads_domain_obj(
            'No blog_post_id specified'
        )

        # Validate with invalid format.
        self.blog_stats.blog_post_id = 'invalidBlogPostId'
        self._assert_valid_blog_post_reads_domain_obj(
            'Blog ID invalidBlogPostId is invalid'
        )

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        self.blog_stats.blog_post_id = 1234  # type: ignore[assignment]
        self._assert_valid_blog_post_reads_domain_obj(
            'Blog Post ID must be a string, but got 1234'
        )


class BlogPostsViewsStatsDomainUnitTests(test_utils.GenericTestBase):
    """Tests for blog post views stats domain object."""

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20)

    def setUp(self) -> None:
        """Set up for testing blog post views stats domain object."""
        super().setUp()
        self.blog_id_a = blog_models.BlogPostModel.generate_new_blog_post_id()
        with self.mock_datetime_utcnow(self.MOCK_DATE):
            stats_model = (
                blog_stats_models.BlogPostViewsAggregatedStatsModel
                    .create(self.blog_id_a)
            )

        self.blog_stats = (
            blog_statistics_domain.BlogPostViewsAggregatedStats(
                self.blog_id_a,
                stats_model.views_by_hour,
                stats_model.views_by_date,
                stats_model.views_by_month,
                stats_model.created_on
            )
        )

    def _assert_valid_blog_post_views_domain_obj(
        self, expected_error_substring: str
    ) -> None:
        """Checks that author blog post views domain object passes
        validation.
        """
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_substring):
            self.blog_stats.validate()

    def test_blog_post_views_stats_validation(self) -> None:
        # Checking for valid stats object.
        self.blog_stats.validate()

        # Validate with empty blog post id.
        self.blog_stats.blog_post_id = ''
        self._assert_valid_blog_post_views_domain_obj(
            'No blog_post_id specified'
        )

        # Validate with invalid format.
        self.blog_stats.blog_post_id = 'invalidBlogPostId'
        self._assert_valid_blog_post_views_domain_obj(
            'Blog ID invalidBlogPostId is invalid'
        )

        # Here we use MyPy ignore because we are assigning a None value
        # where instance of 'PlatformParameter' is expected, and this is
        # done to Replace the stored instance with None in order to
        # trigger the unexpected exception during update.
        self.blog_stats.blog_post_id = 1234  # type: ignore[assignment]
        self._assert_valid_blog_post_views_domain_obj(
            'Blog Post ID must be a string, but got 1234'
        )
