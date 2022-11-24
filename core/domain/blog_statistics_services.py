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

import calendar
import datetime

from core import feconf

from core.domain import blog_statistics_domain
from core.domain import event_services
from core.platform import models

from typing import Dict, Union, overload

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_stats_models
    from mypy_imports import transaction_services

(blog_stats_models,) = models.Registry.import_models(
    [models.Names.BLOG_STATISTICS, ])
transaction_services = models.Registry.import_transaction_services()


def get_blog_post_views_stats_by_id(
    blog_post_id: str
) -> blog_statistics_domain.BlogPostViewsAggregatedStats:
    """Retrieves the BlogPostViewsAggregatedStats domain instance.

    Args:
        blog_post_id: str. ID of the blog post.

    Returns:
        BlogPostViewsAggregatedStats. The blog post view stats domain object.
    """
    stats_model = blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
        blog_post_id, strict=True)
    stats_domain_obj = blog_statistics_domain.BlogPostViewsAggregatedStats(
        blog_post_id,
        stats_model.views_by_hour,
        stats_model.views_by_date,
        stats_model.views_by_month,
        stats_model.created_on
    )
    add_missing_stat_keys_with_default_values_in_views_stats(
        stats_domain_obj)
    return stats_domain_obj


def get_blog_post_reads_stats_by_id(
    blog_post_id: str
) -> blog_statistics_domain.BlogPostReadsAggregatedStats:
    """Retrieves the BlogPostReadsAggregatedStats domain instance.

    Args:
        blog_post_id: str. ID of the blog post.

    Returns:
        BlogPostReadsAggregatedStats. The blog post read stats domain object.
    """
    stats_model = blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
        blog_post_id, strict=True)
    stats_domain_obj = blog_statistics_domain.BlogPostReadsAggregatedStats(
        blog_post_id,
        stats_model.reads_by_hour,
        stats_model.reads_by_date,
        stats_model.reads_by_month,
        stats_model.created_on
    )
    add_missing_stat_keys_with_default_values_in_reads_stats(
        stats_domain_obj)
    return stats_domain_obj


def get_blog_post_reading_time_stats_by_id(
    blog_post_id: str
) -> blog_statistics_domain.BlogPostReadingTime:
    """Retrieves the BlogPostReadingTime domain instance.

    Args:
        blog_post_id: str. ID of the blog post.

    Returns:
        BlogPostReadingTime. The blog post reading time stats domain object.
    """
    blog_reading_time_stats = blog_stats_models.BlogPostReadingTimeModel.get(
        blog_post_id, strict=True)
    return blog_statistics_domain.BlogPostReadingTime(
        blog_post_id,
        blog_reading_time_stats.zero_to_one_min,
        blog_reading_time_stats.one_to_two_min,
        blog_reading_time_stats.two_to_three_min,
        blog_reading_time_stats.three_to_four_min,
        blog_reading_time_stats.four_to_five_min,
        blog_reading_time_stats.five_to_six_min,
        blog_reading_time_stats.six_to_seven_min,
        blog_reading_time_stats.seven_to_eight_min,
        blog_reading_time_stats.eight_to_nine_min,
        blog_reading_time_stats.nine_to_ten_min,
        blog_reading_time_stats.more_than_ten_min,
    )


def get_author_blog_post_views_stats_by_id(
    author_id: str
) -> blog_statistics_domain.AuthorBlogPostViewsAggregatedStats:
    """Retrieves the BlogPostViewsAggregatedStats domain instance.

    Args:
        author_id: str. User ID of the author.

    Returns:
        AuthorBlogPostViewsAggregatedStats. The author blog post view stats
        domain object.
    """
    stats_model = blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
        author_id, strict=True)
    stats_domain_obj = (
        blog_statistics_domain.AuthorBlogPostViewsAggregatedStats(
            author_id,
            stats_model.views_by_hour,
            stats_model.views_by_date,
            stats_model.views_by_month,
            stats_model.created_on
        )
    )
    add_missing_stat_keys_with_default_values_in_views_stats(
        stats_domain_obj)
    return stats_domain_obj


def get_author_blog_post_reads_stats_by_id(
    author_id: str
) -> blog_statistics_domain.AuthorBlogPostReadsAggregatedStats:
    """Retrieves the AuthorBlogPostReadsAggregatedStats domain instance.

    Args:
        author_id: str. User ID of the author.

    Returns:
        AuthorBlogPostReadsAggregatedStats. The author blog posts read stats
        domain object.
    """
    stats_model = blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
        author_id, strict=True)
    stats_domain_obj = (
        blog_statistics_domain.AuthorBlogPostReadsAggregatedStats(
            author_id,
            stats_model.reads_by_hour,
            stats_model.reads_by_date,
            stats_model.reads_by_month,
            stats_model.created_on
        )
    )
    add_missing_stat_keys_with_default_values_in_reads_stats(
        stats_domain_obj)
    return stats_domain_obj


def get_author_blog_posts_reading_time_stats_by_id(
    author_id: str
) -> blog_statistics_domain.AuthorBlogPostsReadingTime:
    """Retrieves the AuthorBlogPostsReadingTime domain instance.

    Args:
        author_id: str. User ID of the author.

    Returns:
        AuthorBlogPostsReadingTime. The author blog post reading time stats
        domain object.
    """
    reading_time_stats = (
        blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
            author_id
        )
    )
    return blog_statistics_domain.AuthorBlogPostsReadingTime(
        author_id,
        reading_time_stats.zero_to_one_min,
        reading_time_stats.one_to_two_min,
        reading_time_stats.two_to_three_min,
        reading_time_stats.three_to_four_min,
        reading_time_stats.four_to_five_min,
        reading_time_stats.five_to_six_min,
        reading_time_stats.six_to_seven_min,
        reading_time_stats.seven_to_eight_min,
        reading_time_stats.eight_to_nine_min,
        reading_time_stats.nine_to_ten_min,
        reading_time_stats.more_than_ten_min,
    )


def save_blog_post_views_stats_model(
    views_stats: blog_statistics_domain.BlogPostViewsAggregatedStats
) -> None:
    """Updates the BlogPostViewsAggregatedStatsModel datastore instance with the
    passed BlogPostViewsAggregatedStats domain object.

    Args:
        views_stats: BlogPostViewsAggregatedStats. The blog post views
            aggregated stats domain object.

    Raises:
        Exception. No blog post views stats model exists for the given
            blog_post_id.
    """
    blog_post_views_aggregated_stats = (
        blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
            views_stats.blog_post_id
        )
    )
    if blog_post_views_aggregated_stats is None:
        raise Exception(
            'No blog post views stats model exists for the given blog_post_id.'
        )

    blog_post_views_aggregated_stats.views_by_hour = views_stats.views_by_hour
    blog_post_views_aggregated_stats.views_by_month = views_stats.views_by_month
    blog_post_views_aggregated_stats.views_by_date = views_stats.views_by_date

    blog_post_views_aggregated_stats.update_timestamps()
    blog_post_views_aggregated_stats.put()


def save_blog_post_reads_stats_model(
    reads_stats: blog_statistics_domain.BlogPostReadsAggregatedStats
) -> None:
    """Updates the BlogPostReadsAggregatedStatsModel datastore instance with the
    passed BlogPostReadsAggregatedStats domain object.

    Args:
        reads_stats: BlogPostReadsAggregatedStats. The blog post reads
            aggregated stats domain object.

    Raises:
        Exception. No blog post reads stats model exists for the given
            blog_post_id.
    """
    blog_post_reads_aggregated_stats = (
        blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
            reads_stats.blog_post_id
        )
    )
    if blog_post_reads_aggregated_stats is None:
        raise Exception(
            'No blog post reads stats model exists for the given blog_post_id.'
        )

    blog_post_reads_aggregated_stats.reads_by_hour = reads_stats.reads_by_hour
    blog_post_reads_aggregated_stats.reads_by_month = reads_stats.reads_by_month
    blog_post_reads_aggregated_stats.reads_by_date = reads_stats.reads_by_date

    blog_post_reads_aggregated_stats.update_timestamps()
    blog_post_reads_aggregated_stats.put()


def save_blog_post_reading_time_model(
    reading_time_stats: blog_statistics_domain.BlogPostReadingTime
) -> None:
    """Updates the BlogPostReadingTimeModel datastore instance with the
    passed BlogPostReadingTime domain object.

    Args:
        reading_time_stats: BlogPostReadingTime. The blog post reading time
            stats domain object.

    Raises:
        Exception. No blog post reading time model exists for the given
            blog_post_id.
    """
    reading_time_model = (
        blog_stats_models.BlogPostReadingTimeModel.get(
            reading_time_stats.blog_post_id
        )
    )
    if reading_time_model is None:
        raise Exception(
            'No blog post reading time model exists for the given blog_post_id.'
        )

    reading_time_model.zero_to_one_min = reading_time_stats.zero_to_one_min
    reading_time_model.one_to_two_min = reading_time_stats.one_to_two_min
    reading_time_model.two_to_three_min = reading_time_stats.two_to_three_min
    reading_time_model.three_to_four_min = reading_time_stats.three_to_four_min
    reading_time_model.four_to_five_min = reading_time_stats.four_to_five_min
    reading_time_model.five_to_six_min = reading_time_stats.five_to_six_min
    reading_time_model.six_to_seven_min = reading_time_stats.six_to_seven_min
    reading_time_model.seven_to_eight_min = (
        reading_time_stats.seven_to_eight_min
    )
    reading_time_model.eight_to_nine_min = reading_time_stats.eight_to_nine_min
    reading_time_model.nine_to_ten_min = reading_time_stats.nine_to_ten_min
    reading_time_model.more_than_ten_min = reading_time_stats.more_than_ten_min

    reading_time_model.update_timestamps()
    reading_time_model.put()


def save_author_blog_post_views_stats_model(
    views_stats: blog_statistics_domain.AuthorBlogPostViewsAggregatedStats
) -> None:
    """Updates the AuthorBlogPostViewsAggregatedStatsModel datastore instance
    with the passed BlogPostViewsAggregatedStats domain object.

    Args:
        views_stats: AuthorBlogPostViewsAggregatedStats. The author blog post
            views aggregated stats domain object.

    Raises:
        Exception. No author blog post views stats model exists for the given
            author_id.
    """
    author_views_aggregated_stats = (
        blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
            views_stats.author_id
        )
    )
    if author_views_aggregated_stats is None:
        raise Exception(
            'No author blog post views stats model exists for the given' +
            ' author_id.'
        )

    author_views_aggregated_stats.views_by_hour = views_stats.views_by_hour
    author_views_aggregated_stats.views_by_month = views_stats.views_by_month
    author_views_aggregated_stats.views_by_date = views_stats.views_by_date

    author_views_aggregated_stats.update_timestamps()
    author_views_aggregated_stats.put()


def save_author_blog_post_reads_stats_model(
    reads_stats: blog_statistics_domain.AuthorBlogPostReadsAggregatedStats
) -> None:
    """Updates the AuthorBlogPostReadsAggregatedStatsModel datastore instance
    with the passed AuthorBlogPostReadsAggregatedStats domain object.

    Args:
        reads_stats: AuthorBlogPostReadsAggregatedStats. The author blog post
            reads aggregated stats domain object.

    Raises:
        Exception. No author blog post reads stats model exists for the given
            author_id.
    """
    author_reads_aggregated_stats = (
        blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
            reads_stats.author_id
        )
    )
    if author_reads_aggregated_stats is None:
        raise Exception(
            'No author blog post reads stats model exists for the given' +
            'author_id.'
        )

    author_reads_aggregated_stats.reads_by_hour = reads_stats.reads_by_hour
    author_reads_aggregated_stats.reads_by_month = reads_stats.reads_by_month
    author_reads_aggregated_stats.reads_by_date = reads_stats.reads_by_date

    author_reads_aggregated_stats.update_timestamps()
    author_reads_aggregated_stats.put()


def save_author_blog_posts_aggregated_reading_time_model(
    reading_time_stats: blog_statistics_domain.AuthorBlogPostsReadingTime
) -> None:
    """Updates the AuthorBlogPostReadingTimeModel datastore instance with the
    passed AuthorBlogPostReadingTime domain object.

    Args:
        reading_time_stats: AuthorBlogPostsReadingTime. The blog post reading
            time stats domain object.

    Raises:
        Exception. No author blog posts aggregated reading time model exists for
            the given author_id.
    """
    reading_time_model = (
        blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
            reading_time_stats.author_id
        )
    )
    if reading_time_model is None:
        raise Exception(
            'No author blog post reading time model exists for the given' +
            'author_id.'
        )

    reading_time_model.zero_to_one_min = reading_time_stats.zero_to_one_min
    reading_time_model.one_to_two_min = reading_time_stats.one_to_two_min
    reading_time_model.two_to_three_min = reading_time_stats.two_to_three_min
    reading_time_model.three_to_four_min = reading_time_stats.three_to_four_min
    reading_time_model.four_to_five_min = reading_time_stats.four_to_five_min
    reading_time_model.five_to_six_min = reading_time_stats.five_to_six_min
    reading_time_model.six_to_seven_min = reading_time_stats.six_to_seven_min
    reading_time_model.seven_to_eight_min = (
        reading_time_stats.seven_to_eight_min
    )
    reading_time_model.eight_to_nine_min = reading_time_stats.eight_to_nine_min
    reading_time_model.nine_to_ten_min = reading_time_stats.nine_to_ten_min
    reading_time_model.more_than_ten_min = reading_time_stats.more_than_ten_min

    reading_time_model.update_timestamps()
    reading_time_model.put()


def generate_stats_by_hour_dict() -> Dict[str, int]:
    """Generates default stats by hour dict.

    Returns:
        dict. A dict containing hours in UTC format as keys with 0 as value.
    """
    intial_dict = {
        '0' + str(i): 0 for i in range(0, 10)
    }
    intial_dict.update({
        str(i): 0 for i in range(10, 24)
    })
    return intial_dict


def generate_stats_by_month_dict() -> Dict[str, int]:
    """Generates default stats by month dict.

    Returns:
        dict. A dict containing months in UTC format as keys with 0 as value.
    """
    initial_dict = {
        '0' + str(i): 0 for i in range(1, 10)
    }
    initial_dict.update({
        str(i): 0 for i in range(10, 13)
    })
    return initial_dict


def generate_stats_by_date_dict(month: int, year: int) -> Dict[str, int]:
    """Generates default stats by date dict for the given month.

    Args:
        month: int. The month for which the stats_by_date dict has to be
            generated.
        year: int. The year for which the stats_by_date dict has to be
            generated.

    Returns:
        dict. A dict containing all dates of the mmonth in UTC format as keys
        with 0 as value.
    """
    num_of_days_in_given_month = calendar.monthrange(year, month)[1]
    initial_dict = {
        '0' + str(i): 0 for i in range(1, 10)
    }
    initial_dict.update({
        str(i): 0 for i in range(10, num_of_days_in_given_month + 1)
    })
    return initial_dict


def update_views_stats(
    blog_post_id: str,
    author_id: str
) -> None:
    """Updates Blog Post Views Stats Model and Author Blog Post Views Stats
    Model.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.
    """
    _update_views_stats_transactional(
        blog_post_id, author_id)


def update_reads_stats(
    blog_post_id: str,
    author_id: str
) -> None:
    """Updates Blog Post Reads Stats Model and Author Blog Post Reads Stats
    Model.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.
    """
    _update_reads_stats_transactional(
        blog_post_id, author_id)


def update_reading_time_stats(
    blog_post_id: str,
    author_id: str,
    time_taken_to_read_post: int,
) -> None:
    """Updates Blog Post Reading Time Model and Author Blog Post Reading Time
    Model.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.
        time_taken_to_read_post: int. The time taken to read the blog post.
    """
    _update_reading_time_stats_transactional(
        blog_post_id, author_id, time_taken_to_read_post)


@transaction_services.run_in_transaction_wrapper
def _update_views_stats_transactional(
    blog_post_id: str,
    author_id: str
) -> None:
    """Updates Blog Post Views Stats Model and Author Blog Post Views Stats
    Model. The model GET and PUT must be done in a transaction to avoid loss of
    updates that come in rapid succession.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.

    Raises:
        Exception. BlogPostViewsStatsModel and AuthorBlogPostViewsModel does not
            exist.
    """
    blog_post_views_stats = get_blog_post_views_stats_by_id(blog_post_id)
    if blog_post_views_stats is None:
        raise Exception(
            'BlogPostViewsStatsModel id="%s" does not exist' % (blog_post_id)
        )

    author_blog_post_views_stats = (
        get_author_blog_post_views_stats_by_id(author_id)
    )
    if author_blog_post_views_stats is None:
        raise Exception(
            'AuthorBlogPostViewsStatsModel id="%s" does not exist' % (author_id)
        )
    current_datetime = datetime.datetime.utcnow()
    current_date = parse_date_as_string(current_datetime)
    current_day = current_datetime.strftime('%d')
    current_month = current_datetime.strftime('%m')
    current_year = current_datetime.strftime('%Y')
    current_month_year = current_year + '-' + current_month
    current_hour = current_datetime.strftime('%H')

    blog_post_views_stats.views_by_hour[current_date][current_hour] += 1
    blog_post_views_stats.views_by_date[current_month_year][current_day] += 1
    blog_post_views_stats.views_by_month[current_year][current_month] += 1

    author_blog_post_views_stats.views_by_hour[current_date][current_hour] += 1
    author_blog_post_views_stats.views_by_date[
        current_month_year][current_day] += 1
    author_blog_post_views_stats.views_by_month[
        current_year][current_month] += 1

    blog_post_views_stats.repack_stats()
    author_blog_post_views_stats.repack_stats()

    save_blog_post_views_stats_model(blog_post_views_stats)
    save_author_blog_post_views_stats_model(author_blog_post_views_stats)


@transaction_services.run_in_transaction_wrapper
def _update_reads_stats_transactional(
    blog_post_id: str,
    author_id: str
) -> None:
    """Updates Blog Post Reads Stats Model and Author Blog Post Reads Stats
    Model. The model GET and PUT must be done in a transaction to avoid loss of
    updates that come in rapid succession.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.

    Raises:
        Exception. BlogPostReadsStatsModel and AuthorBlogPostReadsModel does not
            exist.
    """
    blog_post_reads_stats = get_blog_post_reads_stats_by_id(blog_post_id)
    if blog_post_reads_stats is None:
        raise Exception(
            'BlogPostReadsStatsModel id="%s" does not exist' % (blog_post_id)
        )

    author_blog_post_reads_stats = (
        get_author_blog_post_reads_stats_by_id(author_id)
    )
    if author_blog_post_reads_stats is None:
        raise Exception(
            'AuthorBlogPostReadsStatsModel id="%s" does not exist' % (author_id)
        )
    current_datetime = datetime.datetime.utcnow()
    current_date = parse_date_as_string(current_datetime)
    current_day = current_datetime.strftime('%d')
    current_month = current_datetime.strftime('%m')
    current_year = current_datetime.strftime('%Y')
    current_month_year = current_year + '-' + current_month
    current_hour = current_datetime.strftime('%H')

    blog_post_reads_stats.reads_by_hour[current_date][current_hour] += 1
    blog_post_reads_stats.reads_by_date[current_month_year][current_day] += 1
    blog_post_reads_stats.reads_by_month[current_year][current_month] += 1

    author_blog_post_reads_stats.reads_by_hour[current_date][current_hour] += 1
    author_blog_post_reads_stats.reads_by_date[
        current_month_year][current_day] += 1
    author_blog_post_reads_stats.reads_by_month[
        current_year][current_month] += 1

    blog_post_reads_stats.repack_stats()
    author_blog_post_reads_stats.repack_stats()

    save_blog_post_reads_stats_model(blog_post_reads_stats)
    save_author_blog_post_reads_stats_model(author_blog_post_reads_stats)


@transaction_services.run_in_transaction_wrapper
def _update_reading_time_stats_transactional(
    blog_post_id: str,
    author_id: str,
    time_taken_to_read_post: int
) -> None:
    """Updates Blog Post Reading Time Model and Author Blog Post Reading Time
    Model. The model GET and PUT must be done in a transaction to avoid loss of
    updates that come in rapid succession.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.
        time_taken_to_read_post: int. The time taken to read the blog post.

    Raises:
        Exception. BlogPostReadingTimeModel and AuthorBlogPostReadingTimeModel
            does not exist.
    """
    blog_post_reading_time_stats = (
        get_blog_post_reading_time_stats_by_id(blog_post_id)
    )
    if blog_post_reading_time_stats is None:
        raise Exception(
            'BlogPostReadingTimeModel id="%s" does not exist' % (blog_post_id)
        )

    author_blog_post_reading_time_stats = (
        get_author_blog_posts_reading_time_stats_by_id(author_id)
    )
    if author_blog_post_reading_time_stats is None:
        raise Exception(
            'AuthorBlogPostsAggregatedReadingTimeModel for the given id does'
            'not exist.'
        )

    _increment_reading_time_bucket_count(
        blog_post_reading_time_stats, time_taken_to_read_post)
    _increment_reading_time_bucket_count(
        author_blog_post_reading_time_stats, time_taken_to_read_post)

    save_blog_post_reading_time_model(blog_post_reading_time_stats)
    save_author_blog_posts_aggregated_reading_time_model(
        author_blog_post_reading_time_stats
    )


@overload
def _increment_reading_time_bucket_count(
    stats: blog_statistics_domain.BlogPostReadingTime,
    time_taken: int
) -> None: ...


@overload
def _increment_reading_time_bucket_count(
    stats: blog_statistics_domain.AuthorBlogPostsReadingTime,
    time_taken: int
) -> None: ...


def _increment_reading_time_bucket_count(
    stats: Union[
        blog_statistics_domain.BlogPostReadingTime,
        blog_statistics_domain.AuthorBlogPostsReadingTime
    ],
    time_taken: int
) -> None:
    """Increments the value of the time bucket corresponding to time taken by
    user to read the blog post.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which weekly reads are to be generated.
        time_taken: int. Time taken by the user to read the blog post.
    """
    if time_taken == 0:
        stats.zero_to_one_min += 1
    elif time_taken == 1:
        stats.one_to_two_min += 1
    elif time_taken == 2:
        stats.two_to_three_min += 1
    elif time_taken == 3:
        stats.three_to_four_min += 1
    elif time_taken == 4:
        stats.four_to_five_min += 1
    elif time_taken == 5:
        stats.five_to_six_min += 1
    elif time_taken == 6:
        stats.six_to_seven_min += 1
    elif time_taken == 7:
        stats.seven_to_eight_min += 1
    elif time_taken == 8:
        stats.eight_to_nine_min += 1
    elif time_taken == 9:
        stats.nine_to_ten_min += 1
    else:
        stats.more_than_ten_min += 1


def create_aggregated_stats_models_for_newly_published_blog_post(
    blog_post_id: str
) -> None:
    """Creates Blog Post Stats Models for a newly published blog post.

    Args:
        blog_post_id: str. ID of the blog post.
    """
    stats_model = blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
        blog_post_id, strict=False)

    if stats_model is None:
        blog_stats_models.BlogPostViewsAggregatedStatsModel.create(blog_post_id)
        blog_stats_models.BlogPostReadsAggregatedStatsModel.create(blog_post_id)
        blog_stats_models.BlogPostReadingTimeModel.create(blog_post_id)


def parse_date_as_string(date: datetime.datetime) -> str:
    """Parses given datetime object into 'YYYY-MM-DD' format.

    Args:
        date: datetime.datetime. The datetime obj that needs to parsed.

    Returns:
        str. Date as a string of format 'YYYY-MM-DD'.
    """
    return date.strftime(feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)


def parse_datetime_into_date_dict(
    date_time_obj: datetime.datetime
) -> Dict[str, int]:
    """Parses the given string, and returns the year, month, date, day and
    hour of the date that it represents.

    Args:
        date_time_obj: datetime.datetime. The datetime obj that needs to parsed.

    Returns:
        dict. Representing date with year, month, day, hour as keys.
    """
    return {
        'year': date_time_obj.year,
        'month': date_time_obj.month,
        'day': date_time_obj.day,
        'hour': date_time_obj.hour
    }


@overload
def add_missing_stat_keys_with_default_values_in_views_stats(
    stats: blog_statistics_domain.BlogPostViewsAggregatedStats
) -> blog_statistics_domain.BlogPostViewsAggregatedStats: ...


@overload
def add_missing_stat_keys_with_default_values_in_views_stats(
    stats: blog_statistics_domain.AuthorBlogPostViewsAggregatedStats
) -> blog_statistics_domain.AuthorBlogPostViewsAggregatedStats: ...


def add_missing_stat_keys_with_default_values_in_views_stats(stats: Union[
    blog_statistics_domain.BlogPostViewsAggregatedStats,
    blog_statistics_domain.AuthorBlogPostViewsAggregatedStats
]) -> Union[
    blog_statistics_domain.BlogPostViewsAggregatedStats,
    blog_statistics_domain.AuthorBlogPostViewsAggregatedStats
]:
    """Returns aggregated views stats domain object with added missing keys with
    default values.We maintain views_by_hour for past 3 days
    (including the ongoing day) and views_by_date keyed to 3 months (including
    the ongoing month). If any of the day or month is missing (i.e no user
    viewed the blog post on that day or month), we add it to the domain object.

    Args:
        stats: BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats.
            The stats domain object for which missing keys are to be added.

    Returns:
        BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats. Stats
        domain object with added missing keys.
    """
    current_datetime = datetime.datetime.utcnow()
    current_date = parse_date_as_string(current_datetime)
    current_datetime_obj = parse_datetime_into_date_dict(current_datetime)
    current_month = current_datetime_obj['month']
    current_month_str = datetime.datetime.utcnow().strftime('%m')
    current_year = current_datetime_obj['year']
    current_month_year = str(current_year) + '-' + current_month_str

    yesterday_datetime = (
        current_datetime - datetime.timedelta(days=1))
    yesterday_date = parse_date_as_string(yesterday_datetime)

    day_before_yesterday_datetime = (
        current_datetime - datetime.timedelta(days=2))
    day_before_yesterday_date = parse_date_as_string(
        day_before_yesterday_datetime)

    if current_date not in stats.views_by_hour:
        stats.views_by_hour[current_date] = generate_stats_by_hour_dict()
        # Only if current_date is not present in views_by_hour, there is a
        # possibilty of missing yesterday_date key in views_by_hour.
        if yesterday_datetime.date() >= stats.created_on.date():
            if yesterday_date not in stats.views_by_hour:
                stats.views_by_hour[yesterday_date] = (
                    generate_stats_by_hour_dict()
                )
            # Only if yesterdays_date is not present in views_by_hour, there is
            # a possibilty of missing yesterday_date key in views_by_hour.
            if day_before_yesterday_datetime.date() >= stats.created_on.date():
                if day_before_yesterday_date not in stats.views_by_hour:
                    stats.views_by_hour[day_before_yesterday_date] = (
                        generate_stats_by_hour_dict()
                    )

    prev_month_year = (
        current_datetime.replace(day=1) - datetime.timedelta(days=1)
    )
    if current_month_year not in stats.views_by_date:
        stats.views_by_date[current_month_year] = (
            generate_stats_by_date_dict(current_month, current_year)
        )
        # Only if current_month_year is not present in views_by_date, there is a
        # possibilty of missing prev_month_year key in views_by_date if blog
        # post is created after that.
        if prev_month_year > stats.created_on.replace(day=1, hour=0):
            if prev_month_year.strftime('%Y-%m') not in stats.views_by_date:
                stats.views_by_date[prev_month_year.strftime('%Y-%m')] = (
                    generate_stats_by_date_dict(
                        int(prev_month_year.strftime('%m')),
                        int(prev_month_year.strftime('%Y'))
                    )
                )
            past_two_mon_year = (
                prev_month_year.replace(day=1) - datetime.timedelta(days=1)
            )
            if past_two_mon_year > stats.created_on:
                if past_two_mon_year.strftime(
                    '%Y-%m') not in stats.views_by_date:
                    stats.views_by_date[past_two_mon_year.strftime('%Y-%m')] = (
                        generate_stats_by_date_dict(
                            int(past_two_mon_year.strftime('%m')),
                            int(past_two_mon_year.strftime('%Y'))
                        )
                    )

    if str(current_year) not in stats.views_by_month:
        stats.views_by_month[str(current_year)] = generate_stats_by_month_dict()

    return stats


@overload
def add_missing_stat_keys_with_default_values_in_reads_stats(
    stats: blog_statistics_domain.BlogPostReadsAggregatedStats
) -> blog_statistics_domain.BlogPostReadsAggregatedStats: ...


@overload
def add_missing_stat_keys_with_default_values_in_reads_stats(
    stats: blog_statistics_domain.AuthorBlogPostReadsAggregatedStats
) -> blog_statistics_domain.AuthorBlogPostReadsAggregatedStats: ...


def add_missing_stat_keys_with_default_values_in_reads_stats(stats: Union[
    blog_statistics_domain.BlogPostReadsAggregatedStats,
    blog_statistics_domain.AuthorBlogPostReadsAggregatedStats
]) -> Union[
    blog_statistics_domain.BlogPostReadsAggregatedStats,
    blog_statistics_domain.AuthorBlogPostReadsAggregatedStats
]:
    """Returns aggregated reads stats domain object with added missing keys with
    default values.We maintain reads_by_hour for past 3 days
    (including the ongoing day) and reads_by_date keyed to 3 months (including
    the ongoing month). If any of the day or month is missing (i.e no user
    viewed the blog post on that day or month), we add it to the domain object.

    Args:
        stats: BlogPostreadsAggregatedStats|AuthorBlogPostreadsAggregatedStats.
            The stats domain object for which missing keys are to be added.

    Returns:
        BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats. Stats
        domain object with added missing keys.
    """
    current_datetime = datetime.datetime.utcnow()
    current_date = parse_date_as_string(current_datetime)
    current_datetime_obj = parse_datetime_into_date_dict(
        current_datetime
    )
    current_month = current_datetime_obj['month']
    current_month_str = datetime.datetime.utcnow().strftime('%m')
    current_year = current_datetime_obj['year']
    current_month_year = str(current_year) + '-' + current_month_str

    yesterday_datetime = (current_datetime - datetime.timedelta(days=1))
    yesterday_date = parse_date_as_string(yesterday_datetime)

    day_before_yesterday_datetime = (
        current_datetime - datetime.timedelta(days=2))
    day_before_yesterday_date = parse_date_as_string(
        day_before_yesterday_datetime)

    if current_date not in stats.reads_by_hour:
        stats.reads_by_hour[current_date] = generate_stats_by_hour_dict()
        # Only if current_date is not present in reads_by_hour, there is a
        # possibilty of missing yesterday_date key in reads_by_hour.
        if yesterday_datetime.date() >= stats.created_on.date():
            if yesterday_date not in stats.reads_by_hour:
                stats.reads_by_hour[yesterday_date] = (
                    generate_stats_by_hour_dict()
                )
            # Only if yesterdays_date is not present in reads_by_hour, there is
            # a possibilty of missing yesterday_date key in reads_by_hour.
            if day_before_yesterday_datetime.date() > stats.created_on.date():
                if day_before_yesterday_date not in stats.reads_by_hour:
                    stats.reads_by_hour[day_before_yesterday_date] = (
                        generate_stats_by_hour_dict()
                    )

    prev_month_year = (
        current_datetime.replace(day=1) - datetime.timedelta(days=1)
    )
    if current_month_year not in stats.reads_by_date:
        stats.reads_by_date[current_month_year] = (
            generate_stats_by_date_dict(current_month, current_year)
        )
        # Only if current_month_year is not present in reads_by_date, there is a
        # possibilty of missing prev_month_year key in reads_by_date if blog
        # post is created after that.
        if prev_month_year > stats.created_on.replace(day=1, hour=0):
            if prev_month_year.strftime('%Y-%m') not in stats.reads_by_date:
                stats.reads_by_date[prev_month_year.strftime('%Y-%m')] = (
                    generate_stats_by_date_dict(
                        int(prev_month_year.strftime('%m')),
                        int(prev_month_year.strftime('%Y'))
                    )
                )
            past_two_mon_year = (
                prev_month_year.replace(day=1) - datetime.timedelta(days=1)
            )
            if past_two_mon_year > stats.created_on:
                if past_two_mon_year.strftime(
                    '%Y-%m') not in stats.reads_by_date:
                    stats.reads_by_date[past_two_mon_year.strftime('%Y-%m')] = (
                        generate_stats_by_date_dict(
                            int(past_two_mon_year.strftime('%m')),
                            int(past_two_mon_year.strftime('%Y'))
                        )
                    )

    if str(current_year) not in stats.reads_by_month:
        stats.reads_by_month[str(current_year)] = generate_stats_by_month_dict()

    return stats

@overload
def get_blog_post_stats_by_blog_post_id(
    blog_post_id: str, stats_type: str
) -> blog_statistics_domain.BlogPostReadsAggregatedStats: ...


@overload
def get_blog_post_stats_by_blog_post_id(
    blog_post_id: str, stats_type: str
) -> blog_statistics_domain.BlogPostViewsAggregatedStats: ...


@overload
def get_blog_post_stats_by_blog_post_id(
    blog_post_id: str, stats_type: str
) -> blog_statistics_domain.BlogPostReadingTime: ...


def get_blog_post_stats_by_blog_post_id(
    blog_post_id: str, stats_type: str
) -> Union[
    blog_statistics_domain.BlogPostReadsAggregatedStats,
    blog_statistics_domain.BlogPostViewsAggregatedStats,
    blog_statistics_domain.BlogPostReadingTime
]:
    """Returns aggregated stats domain object for the given blog post id and
    chart type.

    Args:
        blog_post_id: ID of the blog post for which the stats are to be loaded.
        stats_type: the type of stats object, views, reads or reading time for
            which the stats are required.

    Returns:
        BlogPostReadsAggregatedStats|BlogPostViewsAggregatedStats|
        BlogPostReadingTime. Stats domain object for the given blog post ID and
        chart type.
    """
    if stats_type == 'views':
        return get_blog_post_views_stats_by_id(blog_post_id)
    elif stats_type == 'reads':
        return get_blog_post_reads_stats_by_id(blog_post_id)
    else:
        return get_blog_post_reading_time_stats_by_id(blog_post_id)


@overload
def get_author_aggregated_stats_by_author_id(
    author_id: str, stats_type: str
) -> blog_statistics_domain.AuthorBlogPostReadsAggregatedStats: ...


@overload
def get_author_aggregated_stats_by_author_id(
    author_id: str, stats_type: str
) -> blog_statistics_domain.AuthorBlogPostViewsAggregatedStats: ...


@overload
def get_author_aggregated_stats_by_author_id(
    author_id: str, stats_type: str
) -> blog_statistics_domain.AuthorBlogPostsReadingTime: ...


def get_author_aggregated_stats_by_author_id(
    author_id: str, stats_type: str
) -> Union[
    blog_statistics_domain.AuthorBlogPostReadsAggregatedStats,
    blog_statistics_domain.AuthorBlogPostViewsAggregatedStats,
    blog_statistics_domain.AuthorBlogPostsReadingTime,
]:
    """Returns aggregated stats domain object for the given blog post id and
    chart type.

    Args:
        blog_post_id: ID of the blog post for which the stats are to be loaded.
        stats_type: the type of stats object, views, reads or reading time for
            which the stats are required.

    Returns:
        AuthorBlogPostReadsAggregatedStats|AuthorBlogPostViewsAggregatedStats|
        AuthorBlogPostsReadingTime. Stats domain object for the given
        author ID and chart type.
    """
    if stats_type == 'views':
        return get_author_blog_post_views_stats_by_id(author_id)
    elif stats_type == 'reads':
        return get_author_blog_post_reads_stats_by_id(author_id)
    else:
        return get_author_blog_posts_reading_time_stats_by_id(author_id)

class BlogPostViewedEventHandler(event_services.BaseEventHandler):
    """Event handler for recording blog post view events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_BLOG_POST_VIEWED

    @classmethod
    def _handle_event(
        cls,
        blog_post_id: str,
        author_id: str
    ) -> None:
        """Perform in-request processing of recording blog post viewed events.

        Args:
            blog_post_id: str. ID of the blog post that was viewed.
            author_id: str. User ID of the author of the blog post.
        """
        blog_stats_models.BlogPostViewedEventLogEntryModel.create(
            blog_post_id, author_id
        )
        update_views_stats(blog_post_id, author_id)


class BlogPostReadEventHandler(event_services.BaseEventHandler):
    """Event handler for recording blog post read events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_BLOG_POST_READ

    @classmethod
    def _handle_event(
        cls,
        blog_post_id: str,
        author_id: str
    ) -> None:
        """Perform in-request processing of recording blog post read events.

        Args:
            blog_post_id: str. ID of the blog post that was resd.
            author_id: str. User ID of the author of the blog post.
        """
        blog_stats_models.BlogPostReadEventLogEntryModel.create(
            blog_post_id, author_id
        )
        update_reads_stats(blog_post_id, author_id)


class BlogPostExitedEventHandler(event_services.BaseEventHandler):
    """Event handler for recording blog post exited events."""

    EVENT_TYPE: str = feconf.EVENT_TYPE_BLOG_POST_EXITED

    @classmethod
    def _handle_event(
        cls,
        blog_post_id: str,
        author_id: str,
        time_taken_to_read_blog_post: float
    ) -> None:
        """Perform in-request processing of recording blog post read events.

        Args:
            blog_post_id: str. ID of the blog post that was exited.
            author_id: str. User ID of the author of the blog post.
            time_taken_to_read_blog_post: float. Amount of time user stayed on
                the blog post to read it.
        """
        blog_stats_models.BlogPostExitedEventLogEntryModel.create(
            blog_post_id, author_id, time_taken_to_read_blog_post
        )
        update_reading_time_stats(
            blog_post_id,
            author_id,
            int(time_taken_to_read_blog_post)
        )
