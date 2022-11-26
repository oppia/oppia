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

"""Services related to blog post statistics."""

from __future__ import annotations

import datetime

from core import feconf

from core.domain import blog_services
from core.domain import blog_statistics_domain
from core.domain import blog_statistics_services
from core.platform import models
from core.tests import test_utils

from typing import Final, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_stats_models

(blog_stats_models,) = models.Registry.import_models(
    [models.Names.BLOG_STATISTICS, ])


class BlogStatisticsServicesUnitTests(test_utils.GenericTestBase):

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20)

    def setUp(self) -> None:
        super().setUp()

        with self.mock_datetime_utcnow(self.MOCK_DATE):
            self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)

            # Addition of blog admin role creates author aggregated stat models.
            self.add_user_role(
                self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
            self.blog_admin_id = (
                self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
            self.login(self.BLOG_ADMIN_EMAIL)

            # Publishing a blog post to create aggregated blog post stat models.
            self.blog_post = (
                blog_services.create_new_blog_post(self.blog_admin_id)
            )

        with self.mock_datetime_utcnow(
            self.MOCK_DATE + datetime.timedelta(minutes=2)
        ):
            csrf_token = self.get_new_csrf_token()
            payload = {
                'change_dict': {
                    'title': 'Sample Title',
                    'content': '<p>Hello<p>',
                    'tags': ['New lessons', 'Learners'],
                    'thumbnail_filename': 'file.svg'
                },
                'new_publish_status': True
            }
            self.put_json(
                '%s/%s' % (
                    feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id
                ),
                payload,
                csrf_token=csrf_token
            )

        self.blog_post_url = (
            blog_services.get_blog_post_by_id(self.blog_post.id)).url_fragment

        self.current_datetime = self.MOCK_DATE + datetime.timedelta(days=1)
        with self.mock_datetime_utcnow(self.current_datetime):
            # Hitting Blog Post Stats Event Handler to create event log entry
            # model.
            self.post_json(
                '%s/blog_post_viewed_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {})
            self.post_json(
                '%s/blog_post_read_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {})
            self.post_json(
                '%s/blog_post_exited_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {
                    'time_taken_to_read_blog_post': 3.4
                }
            )

        self.logout()

    def test_get_blog_post_aggregated_views_stats_by_id(self) -> None:
        stats_model = blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
            self.blog_post.id
        )
        stats_obj = (
            blog_statistics_domain.BlogPostViewsAggregatedStats(
                self.blog_post.id,
                stats_model.views_by_hour,
                stats_model.views_by_date,
                stats_model.views_by_month,
                stats_model.created_on
            )
        )
        expected_stats = (
            blog_statistics_services
            .add_missing_stat_keys_with_default_values_in_views_stats(
                stats_obj
            )
        )
        self.assertEqual(
            expected_stats.to_frontend_dict(),
            blog_statistics_services.get_blog_post_views_stats_by_id(
                self.blog_post.id
            ).to_frontend_dict()
        )

    def test_get_blog_post_aggregated_reads_stats_by_id(self) -> None:
        stats_model = blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
            self.blog_post.id
        )
        stats_obj = (
            blog_statistics_domain.BlogPostReadsAggregatedStats(
                self.blog_post.id,
                stats_model.reads_by_hour,
                stats_model.reads_by_date,
                stats_model.reads_by_month,
                stats_model.created_on
            )
        )
        expected_stats = (
            blog_statistics_services
            .add_missing_stat_keys_with_default_values_in_reads_stats(
                stats_obj
            )
        )
        self.assertEqual(
            expected_stats.to_frontend_dict(),
            blog_statistics_services.get_blog_post_reads_stats_by_id(
                self.blog_post.id
            ).to_frontend_dict()
        )

    def test_get_blog_post_aggregated_reading_time_stats_by_id(self) -> None:
        stats_model = blog_stats_models.BlogPostReadingTimeModel.get(
            self.blog_post.id
        )
        expected_stats = (
            blog_statistics_domain.BlogPostReadingTime(
                self.blog_post.id,
                stats_model.zero_to_one_min,
                stats_model.one_to_two_min,
                stats_model.two_to_three_min,
                stats_model.three_to_four_min,
                stats_model.four_to_five_min,
                stats_model.five_to_six_min,
                stats_model.six_to_seven_min,
                stats_model.seven_to_eight_min,
                stats_model.eight_to_nine_min,
                stats_model.nine_to_ten_min,
                stats_model.more_than_ten_min,
            )
        )
        self.assertEqual(
            expected_stats.to_frontend_dict(),
            blog_statistics_services.get_blog_post_reading_time_stats_by_id(
                self.blog_post.id
            ).to_frontend_dict()
        )

    def test_get_author_blog_post_aggregated_views_stats_by_id(self) -> None:
        stats_model = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
                self.blog_admin_id
            )
        )
        stats_obj = (
            blog_statistics_domain.AuthorBlogPostViewsAggregatedStats(
                self.blog_admin_id,
                stats_model.views_by_hour,
                stats_model.views_by_date,
                stats_model.views_by_month,
                stats_model.created_on
            )
        )
        expected_stats = (
            blog_statistics_services
            .add_missing_stat_keys_with_default_values_in_views_stats(
                stats_obj
            )
        )
        self.assertEqual(
            expected_stats.to_frontend_dict(),
            blog_statistics_services.get_author_blog_post_views_stats_by_id(
                self.blog_admin_id
            ).to_frontend_dict()
        )

    def test_get_author_blog_post_aggregated_reads_stats_by_id(self) -> None:
        stats_model = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
                self.blog_admin_id
            )
        )
        stats_obj = (
            blog_statistics_domain.AuthorBlogPostReadsAggregatedStats(
                self.blog_admin_id,
                stats_model.reads_by_hour,
                stats_model.reads_by_date,
                stats_model.reads_by_month,
                stats_model.created_on
            )
        )
        expected_stats = (
            blog_statistics_services
            .add_missing_stat_keys_with_default_values_in_reads_stats(
                stats_obj
            )
        )
        self.assertEqual(
            expected_stats.to_frontend_dict(),
            blog_statistics_services.get_author_blog_post_reads_stats_by_id(
                self.blog_admin_id
            ).to_frontend_dict()
        )

    def test_get_author_aggregated_reading_time_stats_by_id(self) -> None:
        stats_model = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
                self.blog_admin_id
            )
        )
        expected_stats = (
            blog_statistics_domain.AuthorBlogPostsReadingTime(
                self.blog_admin_id,
                stats_model.zero_to_one_min,
                stats_model.one_to_two_min,
                stats_model.two_to_three_min,
                stats_model.three_to_four_min,
                stats_model.four_to_five_min,
                stats_model.five_to_six_min,
                stats_model.six_to_seven_min,
                stats_model.seven_to_eight_min,
                stats_model.eight_to_nine_min,
                stats_model.nine_to_ten_min,
                stats_model.more_than_ten_min,
            )
        )
        self.assertEqual(
            expected_stats.to_frontend_dict(),
            (
                blog_statistics_services
                .get_author_blog_posts_reading_time_stats_by_id(
                    self.blog_admin_id
                ).to_frontend_dict()
            )
        )

    def test_generate_stats_by_hour_dict(self) -> None:
        expected_dict = {
            '00': 0,
            '01': 0,
            '02': 0,
            '03': 0,
            '04': 0,
            '05': 0,
            '06': 0,
            '07': 0,
            '08': 0,
            '09': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
            '14': 0,
            '15': 0,
            '16': 0,
            '17': 0,
            '18': 0,
            '19': 0,
            '20': 0,
            '21': 0,
            '22': 0,
            '23': 0,
        }
        self.assertEqual(
            expected_dict,
            blog_statistics_services.generate_stats_by_hour_dict()
        )

    def test_generate_stats_by_month_dict(self) -> None:
        expected_dict = {
            '01': 0,
            '02': 0,
            '03': 0,
            '04': 0,
            '05': 0,
            '06': 0,
            '07': 0,
            '08': 0,
            '09': 0,
            '10': 0,
            '11': 0,
            '12': 0,
        }
        self.assertEqual(
            expected_dict,
            blog_statistics_services.generate_stats_by_month_dict()
        )

    def test_generate_stats_by_date_dict(self) -> None:
        expected_dict = {
            '01': 0,
            '02': 0,
            '03': 0,
            '04': 0,
            '05': 0,
            '06': 0,
            '07': 0,
            '08': 0,
            '09': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
            '14': 0,
            '15': 0,
            '16': 0,
            '17': 0,
            '18': 0,
            '19': 0,
            '20': 0,
            '21': 0,
            '22': 0,
            '23': 0,
            '24': 0,
            '25': 0,
            '26': 0,
            '27': 0,
            '28': 0
        }
        self.assertEqual(
            expected_dict,
            blog_statistics_services.generate_stats_by_date_dict(2, 2022)
        )

    def test_create_aggregated_stats_model_for_newly_published_blog_post(
        self
    ) -> None:
        blog_post_id = 'sample_id'
        self.assertIsNone(
            blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
                blog_post_id, strict=False
            )
        )
        self.assertIsNone(
            blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
                blog_post_id, strict=False
            )
        )
        self.assertIsNone(
            blog_stats_models.BlogPostReadingTimeModel.get(
                blog_post_id, strict=False
            )
        )

        (
            blog_statistics_services
            .create_aggregated_stats_models_for_newly_published_blog_post(
                blog_post_id
            )
        )

        self.assertIsNotNone(
            blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
                blog_post_id, strict=False
            )
        )
        self.assertIsNotNone(
            blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
                blog_post_id, strict=False
            )
        )
        self.assertIsNotNone(
            blog_stats_models.BlogPostReadingTimeModel.get(
                blog_post_id, strict=False
            )
        )

    def test_parse_datetime_into_date_dict(self) -> None:
        self.assertEqual(
            blog_statistics_services.parse_datetime_into_date_dict(
                self.MOCK_DATE
            ),
            {'year': 2021, 'hour': 0, 'month': 9, 'day': 20})

        self.assertEqual(
            blog_statistics_services.parse_datetime_into_date_dict(
                datetime.datetime(2018, 1, 5)
            ),
            {'year': 2018, 'hour': 0, 'month': 1, 'day': 5})

    def test_parse_date_as_string(self) -> None:
        self.assertEqual(
            blog_statistics_services.parse_date_as_string(
                self.MOCK_DATE
            ),
            '2021-09-20'
        )

        self.assertEqual(
            blog_statistics_services.parse_date_as_string(
                datetime.datetime(2018, 1, 5)
            ),
            '2018-01-05')

    def test_update_reads_stats(self) -> None:
        curr_date = self.current_datetime.strftime('%Y-%m-%d')
        current_month = self.current_datetime.strftime('%m')
        current_year = self.current_datetime.strftime('%Y')
        current_day = self.current_datetime.strftime('%d')
        current_month_year = current_year + '-' + current_month
        pre_update_hour = self.current_datetime.strftime('%H')
        update_datetime = self.current_datetime + datetime.timedelta(hours=1)
        update_hour = update_datetime.strftime('%H')

        pre_updated_blog_stats_model = (
            blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
                self.blog_post.id
            )
        )
        pre_updated_author_stats_model = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
                self.blog_admin_id
            )
        )

        self.assertEqual(
            pre_updated_blog_stats_model.reads_by_hour[
                curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            pre_updated_author_stats_model.reads_by_hour[
                curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            pre_updated_blog_stats_model.reads_by_hour[curr_date][update_hour],
            0
        )
        self.assertEqual(
            pre_updated_author_stats_model.reads_by_hour[
                curr_date][update_hour],
            0
        )

        with self.mock_datetime_utcnow(update_datetime):
            blog_statistics_services.update_reads_stats(
                self.blog_post.id, self.blog_admin_id
            )

        updated_blog_stats_model = (
            blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
                self.blog_post.id
            )
        )
        updated_author_stats_model = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
                self.blog_admin_id
            )
        )

        self.assertEqual(
            updated_blog_stats_model.reads_by_hour[curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            updated_blog_stats_model.reads_by_hour[curr_date][update_hour],
            1
        )
        self.assertEqual(
            updated_blog_stats_model.reads_by_date[
                current_month_year][current_day],
            2
        )
        self.assertEqual(
            updated_blog_stats_model.reads_by_month[
                current_year][current_month], 2
        )
        self.assertEqual(
            updated_author_stats_model.reads_by_hour[
                curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            updated_author_stats_model.reads_by_hour[curr_date][update_hour],
            1
        )
        self.assertEqual(
            updated_author_stats_model.reads_by_date[
                current_month_year][current_day],
            2
        )
        self.assertEqual(
            updated_author_stats_model.reads_by_month[
                current_year][current_month],
            2
        )

    def test_update_views_stats(self) -> None:
        curr_date = self.current_datetime.strftime('%Y-%m-%d')
        current_month = self.current_datetime.strftime('%m')
        current_year = self.current_datetime.strftime('%Y')
        current_day = self.current_datetime.strftime('%d')
        current_month_year = current_year + '-' + current_month
        pre_update_hour = self.current_datetime.strftime('%H')
        update_datetime = self.current_datetime + datetime.timedelta(hours=1)
        update_hour = update_datetime.strftime('%H')

        pre_updated_blog_stats_model = (
            blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
                self.blog_post.id
            )
        )
        pre_updated_author_stats_model = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
                self.blog_admin_id
            )
        )

        self.assertEqual(
            pre_updated_blog_stats_model.views_by_hour[
                curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            pre_updated_author_stats_model.views_by_hour[
                curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            pre_updated_blog_stats_model.views_by_hour[curr_date][update_hour],
            0
        )
        self.assertEqual(
            pre_updated_author_stats_model.views_by_hour[
                curr_date][update_hour],
            0
        )

        with self.mock_datetime_utcnow(update_datetime):
            blog_statistics_services.update_views_stats(
                self.blog_post.id, self.blog_admin_id
            )

        updated_blog_stats_model = (
            blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
                self.blog_post.id
            )
        )
        updated_author_stats_model = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
                self.blog_admin_id
            )
        )

        self.assertEqual(
            updated_blog_stats_model.views_by_hour[curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            updated_blog_stats_model.views_by_hour[curr_date][update_hour],
            1
        )
        self.assertEqual(
            updated_blog_stats_model.views_by_date[
                current_month_year][current_day],
            2
        )
        self.assertEqual(
            updated_blog_stats_model.views_by_month[
                current_year][current_month], 2
        )
        self.assertEqual(
            updated_author_stats_model.views_by_hour[
                curr_date][pre_update_hour],
            1
        )
        self.assertEqual(
            updated_author_stats_model.views_by_hour[curr_date][update_hour],
            1
        )
        self.assertEqual(
            updated_author_stats_model.views_by_date[
                current_month_year][current_day],
            2
        )
        self.assertEqual(
            updated_author_stats_model.views_by_month[
                current_year][current_month],
            2
        )

    def test_update_reading_time_stats(self) -> None:

        pre_updated_blog_stats_model = (
            blog_stats_models.BlogPostReadingTimeModel.get(self.blog_post.id)
        )
        pre_updated_author_stats_model = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
                self.blog_admin_id
            )
        )

        self.assertEqual(
            pre_updated_blog_stats_model.three_to_four_min, 1
        )
        self.assertEqual(
            pre_updated_author_stats_model.three_to_four_min, 1
        )
        self.assertEqual(
            pre_updated_blog_stats_model.six_to_seven_min, 0
        )
        self.assertEqual(
            pre_updated_author_stats_model.six_to_seven_min, 0
        )

        for i in range(0, 11):
            blog_statistics_services.update_reading_time_stats(
                self.blog_post.id, self.blog_admin_id, i)

        updated_blog_stats_model = (
            blog_stats_models.BlogPostReadingTimeModel.get(self.blog_post.id)
        )
        updated_author_stats_model = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
                self.blog_admin_id
            )
        )

        updated_blog_stats_domain_model = (
            blog_statistics_domain.BlogPostReadingTime(
                self.blog_post.id,
                updated_blog_stats_model.zero_to_one_min,
                updated_blog_stats_model.one_to_two_min,
                updated_blog_stats_model.two_to_three_min,
                updated_blog_stats_model.three_to_four_min,
                updated_blog_stats_model.four_to_five_min,
                updated_blog_stats_model.five_to_six_min,
                updated_blog_stats_model.six_to_seven_min,
                updated_blog_stats_model.seven_to_eight_min,
                updated_blog_stats_model.eight_to_nine_min,
                updated_blog_stats_model.nine_to_ten_min,
                updated_blog_stats_model.more_than_ten_min,
            )
        )

        updated_author_blog_stats_domain_model = (
            blog_statistics_domain.AuthorBlogPostsReadingTime(
                self.blog_admin_id,
                updated_author_stats_model.zero_to_one_min,
                updated_author_stats_model.one_to_two_min,
                updated_author_stats_model.two_to_three_min,
                updated_author_stats_model.three_to_four_min,
                updated_author_stats_model.four_to_five_min,
                updated_author_stats_model.five_to_six_min,
                updated_author_stats_model.six_to_seven_min,
                updated_author_stats_model.seven_to_eight_min,
                updated_author_stats_model.eight_to_nine_min,
                updated_author_stats_model.nine_to_ten_min,
                updated_author_stats_model.more_than_ten_min,
            )
        )

        expected_updated_blog_post_stats_dict = {
            'blog_post_id': self.blog_post.id,
            'zero_to_one_min': 1,
            'one_to_two_min': 1,
            'two_to_three_min': 1,
            'three_to_four_min': 2,
            'four_to_five_min': 1,
            'five_to_six_min': 1,
            'six_to_seven_min': 1,
            'seven_to_eight_min': 1,
            'eight_to_nine_min': 1,
            'nine_to_ten_min': 1,
            'more_than_ten_min': 1,
        }

        expected_updated_author_stats_dict = {
            'zero_to_one_min': 1,
            'one_to_two_min': 1,
            'two_to_three_min': 1,
            'three_to_four_min': 2,
            'four_to_five_min': 1,
            'five_to_six_min': 1,
            'six_to_seven_min': 1,
            'seven_to_eight_min': 1,
            'eight_to_nine_min': 1,
            'nine_to_ten_min': 1,
            'more_than_ten_min': 1,
        }

        self.assertEqual(
            expected_updated_blog_post_stats_dict,
            updated_blog_stats_domain_model.to_frontend_dict()
        )

        self.assertEqual(
            expected_updated_author_stats_dict,
            updated_author_blog_stats_domain_model.to_frontend_dict()
        )


class BlogPostEventHandlersTests(test_utils.GenericTestBase):
    """Tests for the Blog Post Event handlers which record viewing blog post,
    reading blog post, and exiting blog post events.
    """

    MOCK_DATE: Final = datetime.datetime(2021, 9, 20)

    def setUp(self) -> None:
        super().setUp()
        with self.mock_datetime_utcnow(self.MOCK_DATE):
            self.signup(self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
            # Addition of blog admin role creates author aggregated stat models.
            self.add_user_role(
                self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
            self.blog_admin_id = (
                self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
            self.login(self.BLOG_ADMIN_EMAIL)

            # Publishing a blog post to create aggregated blog post stat models.
            self.blog_post = (
                blog_services.create_new_blog_post(self.blog_admin_id))
        with self.mock_datetime_utcnow(
            self.MOCK_DATE + datetime.timedelta(minutes=2)
        ):
            csrf_token = self.get_new_csrf_token()
            payload = {
                'change_dict': {
                    'title': 'Sample Title',
                    'content': '<p>Hello<p>',
                    'tags': ['New lessons', 'Learners'],
                    'thumbnail_filename': 'file.svg'
                },
                'new_publish_status': True
            }
            self.put_json(
                '%s/%s' % (
                    feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id
                ),
                payload,
                csrf_token=csrf_token
            )

        # Checking blog post is succesfully published.
        blog_post_rights = blog_services.get_blog_post_rights(self.blog_post.id)
        self.assertTrue(blog_post_rights.blog_post_is_published)

        self.blog_post_url = (
            blog_services.get_blog_post_by_id(self.blog_post.id)).url_fragment
        self.logout()

    def test_blog_post_viewed_event_handler(self) -> None:
        current_datetime = self.MOCK_DATE + datetime.timedelta(days=1)
        with self.mock_datetime_utcnow(current_datetime):
            self.post_json(
                '%s/blog_post_viewed_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {})
            self.process_and_flush_pending_tasks()

        # Check that the event model is created and aggregated stats models are
        # updated.
        cls = blog_stats_models.BlogPostViewedEventLogEntryModel
        event_models: List[blog_stats_models.BlogPostViewedEventLogEntryModel]
        event_models = list(cls.query(
            cls.blog_post_id == self.blog_post.id
        ).fetch())
        self.assertEqual(len(event_models), 1)
        aggregated_blog_stats_model = (
            blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
                self.blog_post.id)
        )
        aggregated_author_stats_model = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
                self.blog_admin_id)
        )

        date_str = current_datetime.strftime('%Y-%m-%d')
        hour_str = current_datetime.strftime('%H')
        self.assertEqual(
            aggregated_blog_stats_model.views_by_hour[date_str][hour_str], 1)
        self.assertEqual(
            aggregated_author_stats_model.views_by_hour[date_str][hour_str],
            1
        )
        self.assertEqual(len(event_models), 1)

        # Blog Post is viewed again.
        current_datetime = (
            self.MOCK_DATE + datetime.timedelta(days=1, minutes=5)
        )
        with self.mock_datetime_utcnow(current_datetime):
            self.post_json(
                '%s/blog_post_viewed_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {})
            self.process_and_flush_pending_tasks()

        # Check that the event model is created and aggregated stats models are
        # updated.
        cls = blog_stats_models.BlogPostViewedEventLogEntryModel
        event_models = list(cls.query(
            cls.blog_post_id == self.blog_post.id
        ).fetch())
        self.assertEqual(len(event_models), 2)
        aggregated_blog_stats_model = (
            blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
                self.blog_post.id)
        )
        aggregated_author_stats_model = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
                self.blog_admin_id)
        )

        date_str = current_datetime.strftime('%Y-%m-%d')
        hour_str = current_datetime.strftime('%H')
        self.assertEqual(
            aggregated_blog_stats_model.views_by_hour[date_str][hour_str], 2)
        self.assertEqual(
            aggregated_author_stats_model.views_by_hour[date_str][hour_str],
            2
        )

    def test_blog_post_read_event_handler(self) -> None:
        current_datetime = self.MOCK_DATE + datetime.timedelta(days=1)
        with self.mock_datetime_utcnow(current_datetime):
            self.post_json(
                '%s/blog_post_read_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {})
            self.process_and_flush_pending_tasks()

        # Check that the event model is created and aggregated stats models are
        # updated.
        cls = blog_stats_models.BlogPostReadEventLogEntryModel
        event_models: List[blog_stats_models.BlogPostReadEventLogEntryModel]
        event_models = list(cls.query(
            cls.blog_post_id == self.blog_post.id
        ).fetch())
        self.assertEqual(len(event_models), 1)
        aggregated_blog_stats_model = (
            blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
                self.blog_post.id)
        )
        aggregated_author_stats_model = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
                self.blog_admin_id)
        )

        date_str = current_datetime.strftime('%Y-%m-%d')
        hour_str = current_datetime.strftime('%H')
        self.assertEqual(
            aggregated_blog_stats_model.reads_by_hour[date_str][hour_str], 1)
        self.assertEqual(
            aggregated_author_stats_model.reads_by_hour[date_str][hour_str],
            1
        )
        self.assertEqual(len(event_models), 1)

        # Blog Post is viewed again.
        current_datetime = (
            self.MOCK_DATE + datetime.timedelta(days=1, minutes=5)
        )
        with self.mock_datetime_utcnow(current_datetime):
            # Blog Post is read again.
            self.post_json(
                '%s/blog_post_read_event/%s' %
                (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), {})
            self.process_and_flush_pending_tasks()

        # Check that the event model is created and aggregated stats models are
        # updated.
        event_models = list(cls.query(
            cls.blog_post_id == self.blog_post.id
        ).fetch())
        self.assertEqual(len(event_models), 2)
        aggregated_blog_stats_model = (
            blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
                self.blog_post.id)
        )
        aggregated_author_stats_model = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
                self.blog_admin_id)
        )

        date_str = current_datetime.strftime('%Y-%m-%d')
        hour_str = current_datetime.strftime('%H')

        self.assertEqual(
            aggregated_blog_stats_model.reads_by_hour[date_str][hour_str], 2)
        self.assertEqual(
            aggregated_author_stats_model.reads_by_hour[date_str][hour_str],
            2
        )

    def test_blog_post_exited_event_handler(self) -> None:
        payload = {
                    'time_taken_to_read_blog_post': 3.4
                }
        self.post_json(
            '%s/blog_post_exited_event/%s' %
            (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), payload)
        self.process_and_flush_pending_tasks()

        # Check that the event model is created and aggregated stats models are
        # updated.
        cls = blog_stats_models.BlogPostExitedEventLogEntryModel
        event_models: List[blog_stats_models.BlogPostExitedEventLogEntryModel]
        event_models = list(cls.query(
            cls.blog_post_id == self.blog_post.id
        ).fetch())
        self.assertEqual(len(event_models), 1)
        aggregated_blog_stats_model = (
            blog_stats_models.BlogPostReadingTimeModel.get(
                self.blog_post.id)
        )
        aggregated_author_stats_model = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
                self.blog_admin_id)
        )

        self.assertEqual(
            aggregated_blog_stats_model.three_to_four_min, 1)
        self.assertEqual(
            aggregated_author_stats_model.three_to_four_min, 1)

        # Blog Post is exited again.
        payload = {
            'time_taken_to_read_blog_post': 3.55
        }
        self.post_json(
            '%s/blog_post_exited_event/%s' %
            (feconf.BLOG_HOMEPAGE_DATA_URL, self.blog_post_url), payload)
        self.process_and_flush_pending_tasks()

        # Check that the event model is created and aggregated stats models are
        # updated.
        cls = blog_stats_models.BlogPostExitedEventLogEntryModel
        event_models = list(cls.query(
            cls.blog_post_id == self.blog_post.id
        ).fetch())
        self.assertEqual(len(event_models), 2)
        aggregated_blog_stats_model = (
            blog_stats_models.BlogPostReadingTimeModel.get(
                self.blog_post.id)
        )
        aggregated_author_stats_model = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
                self.blog_admin_id)
        )

        self.assertEqual(
            aggregated_blog_stats_model.three_to_four_min, 2)
        self.assertEqual(
            aggregated_author_stats_model.three_to_four_min, 2)
