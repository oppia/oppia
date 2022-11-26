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

import datetime

from core import utils
from core.domain import blog_statistics_domain
from core.domain import blog_statistics_services as stats_services
from core.platform import models
from core.tests import test_utils


from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models
    from mypy_imports import blog_stats_models

(blog_stats_models, blog_models) = models.Registry.import_models(
    [models.Names.BLOG_STATISTICS, models.Names.BLOG]
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

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20)

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
        """Checks conversion of BlogPostReadingTimeModel to dict."""
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
            'Blog ID invalidBlogPostId is invalid'
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

    def test_repacking_author_blog_post_reads_stats(self) -> None:
        # The date_today is 10 Jan, 2022.
        date_today = self.MOCK_DATE + datetime.timedelta(weeks=16)
        with self.mock_datetime_utcnow(date_today):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.author_stats
            )
        # The date_today is 13 December, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=4)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.author_stats
            )
        # The date_today is 8 November, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=9)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.author_stats
            )
        # The date_today is 27 August, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=15)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.author_stats
            )

            self.assertEqual(len(list(self.author_stats.reads_by_hour)), 12)
            self.assertEqual(len(list(self.author_stats.reads_by_date)), 4)
            self.assertEqual(len(list(self.author_stats.reads_by_month)), 2)

            self.author_stats.repack_stats()

            self.assertEqual(len(list(self.author_stats.reads_by_hour)), 3)
            self.assertEqual(len(list(self.author_stats.reads_by_date)), 3)
            self.assertEqual(len(list(self.author_stats.reads_by_month)), 2)
            # Checking that the past 3 days preserved.
            date_today_str = date_today.strftime('%Y-%m-%d')
            yesterday_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
            day_before_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')

            self.assertTrue(
                date_today_str in self.author_stats.reads_by_hour)
            self.assertTrue(
                yesterday_date_str in self.author_stats.reads_by_hour)
            self.assertTrue(
                day_before_date_str in self.author_stats.reads_by_hour)

            # Checking that the past 3 month are preserved.
            current_month_str = date_today.strftime('%Y-%m')
            past_month_str = (
                date_today - datetime.timedelta(days=21)
            ).strftime('%Y-%m')
            past_two_month_str = (
                date_today - datetime.timedelta(days=54)
            ).strftime('%Y-%m')

            self.assertTrue(
                current_month_str in self.author_stats.reads_by_date)
            self.assertTrue(
                past_month_str in self.author_stats.reads_by_date)
            self.assertTrue(
                past_two_month_str in self.author_stats.reads_by_date)

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

    def test_author_blog_post_reads_to_frontend_dict(self) -> None:
        current_datetime = self.MOCK_DATE + datetime.timedelta(days=5)
        with self.mock_datetime_utcnow(current_datetime):
            frontend_dict = (
                stats_services.get_author_blog_post_reads_stats_by_id(
                    self.user_id_a
                ).to_frontend_dict()
            )

            current_day = current_datetime.day
            self.assertEqual(len(frontend_dict['hourly_reads'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_reads'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_reads'].keys()), 30)
            self.assertEqual(len(frontend_dict['yearly_reads'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_reads'].keys()), 1)
            for i in range(current_day - 6, current_day + 1):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['weekly_reads'].keys()
                )

            current_year = '_' + str(current_datetime.year)
            self.assertTrue(current_year in frontend_dict['all_reads'])

        # Checking to_front_end_dict() when current date is less than 7.
        datetime_now = datetime.datetime(2021, 10, 5)
        with self.mock_datetime_utcnow(datetime_now):
            frontend_dict = (
                stats_services.get_author_blog_post_reads_stats_by_id(
                    self.user_id_a
                ).to_frontend_dict()
            )

            current_day = datetime_now.day
            self.assertEqual(len(frontend_dict['hourly_reads'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_reads'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_reads'].keys()), 31)
            self.assertEqual(len(frontend_dict['yearly_reads'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_reads'].keys()), 1)
            for i in range(
                (datetime_now - datetime.timedelta(days=6)).day, current_day + 1
            ):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['weekly_reads'].keys())

            current_year = '_' + str(datetime_now.year)
            self.assertTrue(current_year in frontend_dict['all_reads'])


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

    def test_repacking_author_blog_post_views_stats(self) -> None:
        # The date_today is 10 Jan, 2022.
        date_today = self.MOCK_DATE + datetime.timedelta(weeks=16)
        with self.mock_datetime_utcnow(date_today):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.author_stats
            )
        # The date_today is 13 December, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=4)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.author_stats
            )
        # The date_today is 8 November, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=9)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.author_stats
            )
        # The date_today is 27 August, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=15)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.author_stats
            )

            self.assertEqual(len(list(self.author_stats.views_by_hour)), 12)
            self.assertEqual(len(list(self.author_stats.views_by_date)), 4)
            self.assertEqual(len(list(self.author_stats.views_by_month)), 2)

            self.author_stats.repack_stats()

            self.assertEqual(len(list(self.author_stats.views_by_hour)), 3)
            self.assertEqual(len(list(self.author_stats.views_by_date)), 3)
            self.assertEqual(len(list(self.author_stats.views_by_month)), 2)
            # Checking that the past 3 days preserved.
            date_today_str = date_today.strftime('%Y-%m-%d')
            yesterday_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
            day_before_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')

            self.assertTrue(
                date_today_str in self.author_stats.views_by_hour)
            self.assertTrue(
                yesterday_date_str in self.author_stats.views_by_hour)
            self.assertTrue(
                day_before_date_str in self.author_stats.views_by_hour)

            # Checking that the past 3 month are preserved.
            current_month_str = date_today.strftime('%Y-%m')
            past_month_str = (
                date_today - datetime.timedelta(days=21)
            ).strftime('%Y-%m')
            past_two_month_str = (
                date_today - datetime.timedelta(days=54)
            ).strftime('%Y-%m')

            self.assertTrue(
                current_month_str in self.author_stats.views_by_date)
            self.assertTrue(
                past_month_str in self.author_stats.views_by_date)
            self.assertTrue(
                past_two_month_str in self.author_stats.views_by_date)

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

    def test_author_blog_post_reads_to_frontend_dict(self) -> None:
        current_datetime = self.MOCK_DATE + datetime.timedelta(days=5)
        with self.mock_datetime_utcnow(current_datetime):
            frontend_dict = (
                stats_services.get_author_blog_post_views_stats_by_id(
                    self.user_id_a
                ).to_frontend_dict()
            )

            current_day = current_datetime.day
            self.assertEqual(len(frontend_dict['hourly_views'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_views'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_views'].keys()), 30)
            self.assertEqual(len(frontend_dict['yearly_views'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_views'].keys()), 1)
            for i in range(current_day - 6, current_day + 1):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['weekly_views'].keys()
                )

            current_year = '_' + str(current_datetime.year)
            self.assertTrue(current_year in frontend_dict['all_views'])

        # Checking to_front_end_dict() when current date is less than 7.
        datetime_now = datetime.datetime(2021, 10, 5)
        with self.mock_datetime_utcnow(datetime_now):
            frontend_dict = (
                stats_services.get_author_blog_post_views_stats_by_id(
                    self.user_id_a
                ).to_frontend_dict()
            )

            current_day = datetime_now.day
            self.assertEqual(len(frontend_dict['hourly_views'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_views'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_views'].keys()), 31)
            self.assertEqual(len(frontend_dict['yearly_views'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_views'].keys()), 1)
            for i in range(
                (datetime_now - datetime.timedelta(days=6)).day, current_day + 1
            ):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['weekly_views'].keys()
                )

            current_year = '_' + str(datetime_now.year)
            self.assertTrue(current_year in frontend_dict['all_views'])


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

    def test_repacking_blog_post_reads_stats(self) -> None:
        # The date_today is 10 Jan, 2022.
        date_today = self.MOCK_DATE + datetime.timedelta(weeks=16)
        with self.mock_datetime_utcnow(date_today):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.blog_stats
            )
        # The date_today is 13 December, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=4)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.blog_stats
            )
        # The date_today is 8 November, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=9)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.blog_stats
            )
        # The date_today is 27 August, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=15)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_reads_stats( # pylint: disable=line-too-long
                self.blog_stats
            )

            self.assertEqual(len(list(self.blog_stats.reads_by_hour)), 12)
            self.assertEqual(len(list(self.blog_stats.reads_by_date)), 4)
            self.assertEqual(len(list(self.blog_stats.reads_by_month)), 2)

            self.blog_stats.repack_stats()

            self.assertEqual(len(list(self.blog_stats.reads_by_hour)), 3)
            self.assertEqual(len(list(self.blog_stats.reads_by_date)), 3)
            self.assertEqual(len(list(self.blog_stats.reads_by_month)), 2)
            # Checking that the past 3 days preserved.
            date_today_str = date_today.strftime('%Y-%m-%d')
            yesterday_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
            day_before_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')

            self.assertTrue(
                date_today_str in self.blog_stats.reads_by_hour)
            self.assertTrue(
                yesterday_date_str in self.blog_stats.reads_by_hour)
            self.assertTrue(
                day_before_date_str in self.blog_stats.reads_by_hour)

            # Checking that the past 3 month are preserved.
            current_month_str = date_today.strftime('%Y-%m')
            past_month_str = (
                date_today - datetime.timedelta(days=21)
            ).strftime('%Y-%m')
            past_two_month_str = (
                date_today - datetime.timedelta(days=54)
            ).strftime('%Y-%m')

            self.assertTrue(
                current_month_str in self.blog_stats.reads_by_date)
            self.assertTrue(
                past_month_str in self.blog_stats.reads_by_date)
            self.assertTrue(
                past_two_month_str in self.blog_stats.reads_by_date)

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

    def test_blog_post_reads_to_frontend_dict(self) -> None:
        current_datetime = (
            self.MOCK_DATE.replace(hour=6) + datetime.timedelta(days=5)
        )
        with self.mock_datetime_utcnow(current_datetime):
            domain_obj = stats_services.get_blog_post_reads_stats_by_id(
                    self.blog_id_a
                )
            frontend_dict = domain_obj.to_frontend_dict()

            current_day = current_datetime.day
            self.assertEqual(len(frontend_dict['hourly_reads'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_reads'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_reads'].keys()), 30)
            self.assertEqual(len(frontend_dict['yearly_reads'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_reads'].keys()), 1)

            for i in range(0, 9):
                self.assertTrue(
                    ('_0' + str(i)) in frontend_dict['hourly_reads'].keys()
                )
            for i in range(10, 24):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['hourly_reads'].keys()
                )
            for i in range(current_day - 6, current_day + 1):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['weekly_reads'].keys()
                )

            current_year = '_' + str(current_datetime.year)
            self.assertTrue(current_year in frontend_dict['all_reads'])

        # Checking to_front_end_dict() when current date is less than 7.
        datetime_now = datetime.datetime(2021, 10, 5)
        with self.mock_datetime_utcnow(datetime_now):
            frontend_dict = (
                stats_services.get_blog_post_reads_stats_by_id(
                    self.blog_id_a
                ).to_frontend_dict()
            )

            current_day = datetime_now.day
            self.assertEqual(len(frontend_dict['hourly_reads'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_reads'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_reads'].keys()), 31)
            self.assertEqual(len(frontend_dict['yearly_reads'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_reads'].keys()), 1)
            for i in range(
                (datetime_now - datetime.timedelta(days=6)).day, current_day + 1
            ):
                self.assertTrue(str(i) in frontend_dict['weekly_reads'].keys())

            current_year = '_' + str(datetime_now.year)
            self.assertTrue(current_year in frontend_dict['all_reads'])


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

    def test_repacking_author_blog_post_views_stats(self) -> None:
        # The date_today is 10 Jan, 2022.
        date_today = self.MOCK_DATE + datetime.timedelta(weeks=16)
        with self.mock_datetime_utcnow(date_today):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.blog_stats
            )
        # The date_today is 13 December, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=4)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.blog_stats
            )
        # The date_today is 8 November, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=9)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.blog_stats
            )
        # The date_today is 27 August, 2021.
        with self.mock_datetime_utcnow(
            date_today - datetime.timedelta(weeks=15)
        ):
            stats_services.add_missing_stat_keys_with_default_values_in_views_stats( # pylint: disable=line-too-long
                self.blog_stats
            )

            self.assertEqual(len(list(self.blog_stats.views_by_hour)), 12)
            self.assertEqual(len(list(self.blog_stats.views_by_date)), 4)
            self.assertEqual(len(list(self.blog_stats.views_by_month)), 2)

            self.blog_stats.repack_stats()

            self.assertEqual(len(list(self.blog_stats.views_by_hour)), 3)
            self.assertEqual(len(list(self.blog_stats.views_by_date)), 3)
            self.assertEqual(len(list(self.blog_stats.views_by_month)), 2)
            # Checking that the past 3 days preserved.
            date_today_str = date_today.strftime('%Y-%m-%d')
            yesterday_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
            day_before_date_str = (
                date_today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')

            self.assertTrue(
                date_today_str in self.blog_stats.views_by_hour)
            self.assertTrue(
                yesterday_date_str in self.blog_stats.views_by_hour)
            self.assertTrue(
                day_before_date_str in self.blog_stats.views_by_hour)

            # Checking that the past 3 month are preserved.
            current_month_str = date_today.strftime('%Y-%m')
            past_month_str = (
                date_today - datetime.timedelta(days=21)
            ).strftime('%Y-%m')
            past_two_month_str = (
                date_today - datetime.timedelta(days=54)
            ).strftime('%Y-%m')

            self.assertTrue(
                current_month_str in self.blog_stats.views_by_date)
            self.assertTrue(
                past_month_str in self.blog_stats.views_by_date)
            self.assertTrue(
                past_two_month_str in self.blog_stats.views_by_date)

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

    def test_blog_post_views_to_frontend_dict(self) -> None:
        current_datetime = self.MOCK_DATE + datetime.timedelta(days=5)
        with self.mock_datetime_utcnow(current_datetime):
            frontend_dict = (
                stats_services.get_blog_post_views_stats_by_id(
                    self.blog_id_a
                ).to_frontend_dict()
            )

            current_day = current_datetime.day
            self.assertEqual(len(frontend_dict['hourly_views'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_views'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_views'].keys()), 30)
            self.assertEqual(len(frontend_dict['yearly_views'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_views'].keys()), 1)
            for i in range(current_day - 6, current_day + 1):
                self.assertTrue(
                    ('_' + str(i)) in frontend_dict['weekly_views'].keys())

            current_year = '_' + str(current_datetime.year)
            self.assertTrue(current_year in frontend_dict['all_views'])

        # Checking to_front_end_dict() when current date is less than 7.
        datetime_now = datetime.datetime(2021, 10, 5)
        with self.mock_datetime_utcnow(datetime_now):
            frontend_dict = (
                stats_services.get_blog_post_views_stats_by_id(
                    self.blog_id_a
                ).to_frontend_dict()
            )

            current_day = datetime_now.day
            self.assertEqual(len(frontend_dict['hourly_views'].keys()), 24)
            self.assertEqual(len(frontend_dict['weekly_views'].keys()), 7)
            self.assertEqual(len(frontend_dict['monthly_views'].keys()), 31)
            self.assertEqual(len(frontend_dict['yearly_views'].keys()), 12)
            self.assertEqual(len(frontend_dict['all_views'].keys()), 1)
            for i in range(
                (datetime_now - datetime.timedelta(days=6)).day, current_day + 1
            ):
                self.assertTrue(str(i) in frontend_dict['weekly_views'].keys())

            current_year = '_' + str(datetime_now.year)
            self.assertTrue(current_year in frontend_dict['all_views'])
