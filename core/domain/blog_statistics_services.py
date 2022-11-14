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
from core.platform import models
from core.domain import event_services

from typing import Dict, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_stats_models
    from mypy_imports import transaction_services

(blog_stats_models,) = models.Registry.import_models(
    [models.Names.BLOG_STATISTICS,]
)
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
    return blog_statistics_domain.BlogPostViewsAggregatedStats(
        blog_post_id,
        stats_model.views_by_hour,
        stats_model.views_by_date,
        stats_model.views_by_month,
        stats_model.created_on
    )


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
    return blog_statistics_domain.BlogPostReadsAggregatedStats(
        blog_post_id,
        stats_model.reads_by_hour,
        stats_model.reads_by_date,
        stats_model.reads_by_month,
        stats_model.created_on
    )


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
        author_id: str. user ID of the author.

    Returns:
        AuthorBlogPostViewsAggregatedStats. The author blog post view stats
        domain object.
    """
    stats_model = blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
        author_id, strict=True)
    return blog_statistics_domain.AuthorBlogPostViewsAggregatedStats(
        author_id,
        stats_model.views_by_hour,
        stats_model.views_by_date,
        stats_model.views_by_month,
        stats_model.created_on
    )


def get_author_blog_post_reads_stats_by_id(
    author_id: str
) -> blog_statistics_domain.AuthorBlogPostReadsAggregatedStats:
    """Retrieves the AuthorBlogPostReadsAggregatedStats domain instance.

    Args:
        author_id: str. user ID of the author.

    Returns:
        AuthorBlogPostReadsAggregatedStats. The author blog posts read stats
        domain object.
    """
    stats_model = blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
        author_id, strict=True)
    return blog_statistics_domain.AuthorBlogPostReadsAggregatedStats(
        author_id,
        stats_model.reads_by_hour,
        stats_model.reads_by_date,
        stats_model.reads_by_month,
        stats_model.created_on
    )


def get_author_blog_posts_reading_time_stats_by_id(
    author_id: str
) -> blog_statistics_domain.AuthorBlogPostsReadingTime:
    """Retrieves the AuthorBlogPostsReadingTime domain instance.

    Args:
        author_id: str. user ID of the author.

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
        reading_time_stats: BlogPostReadingTime. The blog post reading time stats
            domain object.

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
    reading_time_model.seven_to_eight_min = reading_time_stats.seven_to_eight_min
    reading_time_model.eight_to_nine_min = reading_time_stats.eight_to_nine_min
    reading_time_model.nine_to_ten_min = reading_time_stats.nine_to_ten_min
    reading_time_model.more_than_ten_min = reading_time_stats.more_than_ten_min
    
    reading_time_model.update_timestamps()
    reading_time_model.put()


def save_author_blog_post_views_stats_model(
    views_stats: blog_statistics_domain.AuthorBlogPostViewsAggregatedStats
) -> None:
    """Updates the AuthorBlogPostViewsAggregatedStatsModel datastore instance with the
    passed BlogPostViewsAggregatedStats domain object.

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
    reading_time_model.seven_to_eight_min = reading_time_stats.seven_to_eight_min
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
    return {
        '0' +  str(i): 0 for i in range(0,10)
    } | {
        str(i): 0 for i in range(10, 25)
    }

def generate_stats_by_month_dict() -> Dict[str, int]:
    """Generates default stats by month dict.

    Returns:
        dict. A dict containing months in UTC format as keys with 0 as value.
    """
    return {
        '0' +  str(i): 0 for i in range(0,10)
    } | {
        str(i): 0 for i in range(10, 13)
    }

def generate_stats_by_date_dict(month: int, year: int) -> Dict[str, int]:
    """Generates default stats by date dict for the given month.

    Returns:
        dict. A dict containing all dates of the mmonth in UTC format as keys
        with 0 as value.
    """
    num_of_days_in_given_month = calendar.monthrange(year, month)[1]
    return {
        '0' +  str(i): 0 for i in range(0,10)
    } | {
        str(i): 0 for i in range(10, num_of_days_in_given_month+1)
    }


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
    time_taken_to_read_post: str,
) -> None:
    """Updates Blog Post Reading Time Model and Author Blog Post Reading Time
    Model.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.
        time_taken_to_read_post: str. The time taken to read the blog post.
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

    current_date = get_current_date_as_string()
    current_datetime_obj = parse_date_from_datetime(
        datetime.datetime.utcnow())
    current_day = current_datetime_obj.day
    current_hour = current_datetime_obj.hour
    current_month =current_datetime_obj.month
    current_year = current_datetime_obj.year
    current_month_year = current_year + '-' + current_month

    add_missing_stat_keys_with_default_values_in_views_stats(
        blog_post_views_stats
    )
    blog_post_views_stats.views_by_hour[current_date][current_hour] += 1
    blog_post_views_stats.views_by_date[current_month_year][current_day] += 1
    blog_post_views_stats.views_by_month[current_year] += 1

    add_missing_stat_keys_with_default_values_in_views_stats(
        author_blog_post_views_stats
    )
    author_blog_post_views_stats.views_by_hour[current_date][current_hour] += 1
    author_blog_post_views_stats.views_by_date[
        current_month_year][current_day] += 1
    author_blog_post_views_stats.views_by_month[current_year] += 1
    
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

    current_date = get_current_date_as_string()
    current_datetime_obj = parse_date_from_datetime(
        datetime.datetime.utcnow())
    current_day = current_datetime_obj.day
    current_hour = current_datetime_obj.hour
    current_month =current_datetime_obj.month
    current_year = current_datetime_obj.year
    current_month_year = current_year + '-' + current_month

    add_missing_stat_keys_with_default_values_in_reads_stats(
        blog_post_reads_stats)
    blog_post_reads_stats.views_by_hour[current_date][current_hour] += 1
    blog_post_reads_stats.views_by_date[current_month_year][current_day] += 1
    blog_post_reads_stats.views_by_month[current_year] += 1

    add_missing_stat_keys_with_default_values_in_reads_stats(
        author_blog_post_reads_stats)
    author_blog_post_reads_stats.views_by_hour[current_date][current_hour] += 1
    author_blog_post_reads_stats.views_by_date[
        current_month_year][current_day] += 1
    author_blog_post_reads_stats.views_by_month[current_year] += 1
    
    blog_post_reads_stats.repack_stats()
    author_blog_post_reads_stats.repack_stats()

    save_blog_post_reads_stats_model(blog_post_reads_stats)
    save_author_blog_post_reads_stats_model(author_blog_post_reads_stats)


@transaction_services.run_in_transaction_wrapper
def _update_reading_time_stats_transactional(
    blog_post_id: str,
    author_id: str,
    time_taken_to_read_post: str
) -> None:
    """Updates Blog Post Reading Time Model and Author Blog Post Reading Time
    Model. The model GET and PUT must be done in a transaction to avoid loss of
    updates that come in rapid succession.

    Args:
        blog_post_id: str. ID of the blog post.
        author_id: str. ID of the author of the blog post.
        time_taken_to_read_post: str. The time taken to read the blog post.

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
            'AuthorBlogPostsAggregatedReadingTimeModel id="%s" does not' +
            'exist' % (blog_post_id)
        )

    blog_post_reading_time_stats[time_taken_to_read_post] += 1
    author_blog_post_reading_time_stats[time_taken_to_read_post] += 1

    save_blog_post_reading_time_model(blog_post_reading_time_stats)
    save_author_blog_posts_aggregated_reading_time_model(
        author_blog_post_reading_time_stats
    )


def create_aggregated_blog_post_stats_models_for_newly_published_blog_post(
    blog_post_id: str
) -> None:
    """Creates Blog Post Stats Models for a newly published blog post.

    Args:
        blog_post_id: str. ID of the blog post.
    """
    stats_model = blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
        blog_post_id)

    if stats_model is None:
        blog_stats_models.BlogPostViewsAggregatedStatsModel.create(blog_post_id)
        blog_stats_models.BlogPostReadsAggregatedStatsModel.create(blog_post_id)
        blog_stats_models.BlogPostReadingTimeModel.create(blog_post_id)


def create_aggregated_author_blog_post_stats_models(
    author_id: str
) -> None:
    """Creates Author Blog Post Aggreagted Stats Models for a new blog post
    author

    Args:
        author_id: str. user ID of the author.
    """
    stats_model = blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
        author_id)

    if stats_model is None:
        blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.create(
            author_id)
        blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.create(
            author_id)
        blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.create(
            author_id)


def get_current_date_as_string() -> str:
    """Gets the current date.

    Returns:
        str. Current date as a string of format 'YYYY-MM-DD'.
    """
    return datetime.datetime.utcnow().strftime(
        feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)


def parse_date_as_string(date: datetime.datetime) -> str:
    """Gets yesterays date.

    Returns:
        str. Yesterdays date as a string of format 'YYYY-MM-DD'.
    """
    return date.strftime(feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)


def parse_date_from_datetime(date_time_obj: datetime.datetime) -> Dict[str, int]:
    """Parses the given string, and returns the year, month, date, day and
    hour of the date that it represents.

    Args:
        date_time_obj: datetime.datetime. date time obj that needs to parsed.

    Returns:
        dict. Representing date with year, month, day, hour as keys.
    """
    date_time_str = datetime.datetime.strptime(date_time_obj, '%Y-%m-%d-%H')
    return {
        'year': date_time_str.year,
        'month': date_time_str.month,
        'day': date_time_str.day,
        'hour': date_time_str.hour
    }


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
        stats: BlogPostViewsAggregatedStats | AuthorBlogPostViewsAggregatedStats
            The stats domain object for which missing keys are to be added.

    Returns:
        BlogPostViewsAggregatedStats | AuthorBlogPostViewsAggregatedStats. Stats
        domain object with added missing keys.
    """
    current_date = get_current_date_as_string()
    current_datetime_obj = parse_date_from_datetime(
        datetime.datetime.utcnow()
    )
    current_month =current_datetime_obj.month
    current_year = current_datetime_obj.year
    current_month_year = current_year + '-' + current_month

    yesterday_datetime = (
        datetime.datetime.utcnow() - datetime.timedelta(days = 1))
    yesterday_date = parse_date_as_string(yesterday_datetime)

    day_before_yesterday_datetime = (
        datetime.datetime.utcnow() - datetime.timedelta(days = 2))
    day_before_yesterday_date = parse_date_as_string(
        day_before_yesterday_datetime)

    if current_date not in stats.views_by_hour:
        stats.views_by_hour[current_date] = generate_stats_by_hour_dict()
        # Only if current_date is not present in views_by_hour, there is a
        # possibilty of missing yesterday_date key in views_by_hour.
        if yesterday_datetime > stats.created_on:
            if yesterday_date not in stats.views_by_hour:
                stats.views_by_hour[yesterday_date] = (
                    generate_stats_by_hour_dict()
                )
            # Only if yesterdays_date is not present in views_by_hour, there is
            # a possibilty of missing yesterday_date key in views_by_hour.              
            if day_before_yesterday_datetime > stats.created_on:
                if day_before_yesterday_date not in stats.views_by_hour:
                    stats.views_by_hour[day_before_yesterday_date] = (
                        generate_stats_by_hour_dict()
                    )


    prev_month_year = (
        datetime.datetime.utcnow().replace(day=1) - datetime.timedelta(days=1)
    )
    if current_month_year not in stats.views_by_date:
        stats.views_by_date[current_month_year] = (
            generate_stats_by_date_dict(int(current_month), int(current_year))
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

    if current_year not in stats.views_by_month:
        stats.views_by_month[current_year] = generate_stats_by_month_dict()

    return stats
    

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
        stats: BlogPostreadsAggregatedStats | AuthorBlogPostreadsAggregatedStats
            The stats domain object for which missing keys are to be added.

    Returns:
        BlogPostReadsAggregatedStats | AuthorBlogPostReadsAggregatedStats. Stats
        domain object with added missing keys.
    """
    current_date = get_current_date_as_string()
    current_datetime_obj = parse_date_from_datetime(
        datetime.datetime.utcnow()
    )
    current_month =current_datetime_obj.month
    current_year = current_datetime_obj.year
    current_month_year = current_year + '-' + current_month

    yesterday_datetime = (
        datetime.datetime.utcnow() - datetime.timedelta(days = 1))
    yesterday_date = parse_date_as_string(yesterday_datetime)

    day_before_yesterday_datetime = (
        datetime.datetime.utcnow() - datetime.timedelta(days = 2))
    day_before_yesterday_date = parse_date_as_string(
        day_before_yesterday_datetime)

    if current_date not in stats.reads_by_hour:
        stats.reads_by_hour[current_date] = generate_stats_by_hour_dict()
        # Only if current_date is not present in reads_by_hour, there is a
        # possibilty of missing yesterday_date key in reads_by_hour.
        if yesterday_datetime > stats.created_on:
            if yesterday_date not in stats.reads_by_hour:
                stats.reads_by_hour[yesterday_date] = (
                    generate_stats_by_hour_dict()
                )
            # Only if yesterdays_date is not present in reads_by_hour, there is
            # a possibilty of missing yesterday_date key in reads_by_hour.              
            if day_before_yesterday_datetime > stats.created_on:
                if day_before_yesterday_date not in stats.reads_by_hour:
                    stats.reads_by_hour[day_before_yesterday_date] = (
                        generate_stats_by_hour_dict()
                    )


    prev_month_year = (
        datetime.datetime.utcnow().replace(day=1) - datetime.timedelta(days=1)
    )
    if current_month_year not in stats.reads_by_date:
        stats.reads_by_date[current_month_year] = (
            generate_stats_by_date_dict(int(current_month), int(current_year))
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

    if current_year not in stats.reads_by_month:
        stats.reads_by_month[current_year] = generate_stats_by_month_dict()

    return stats

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
            author_id: str. user ID of the author of the blog post
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
            author_id: str. user ID of the author of the blog post
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
            author_id: str. user ID of the author of the blog post.
            time_taken_to_read_blog_post: float. Amount of time user stayed on
                the blog post to read it.
        """
        blog_stats_models.BlogPostExitedEventLogEntryModel.create(
            blog_post_id, author_id, time_taken_to_read_blog_post
        )
        time_taken = int(time_taken_to_read_blog_post)
        if time_taken == 0:
            time_bucket_to_read_blog_post = 'zero_to_one_min'
        elif time_taken == 1:
            time_bucket_to_read_blog_post = 'one_to_two_min'
        elif time_taken == 2:
            time_bucket_to_read_blog_post = 'two_to_three_min'
        elif time_taken == 3:
            time_bucket_to_read_blog_post = 'three_to_four_min'
        elif time_taken == 4:
            time_bucket_to_read_blog_post = 'four_to_five_min'
        elif time_taken == 5:
            time_bucket_to_read_blog_post = 'five_to_six_min'
        elif time_taken == 6:
            time_bucket_to_read_blog_post = 'six_to_seven_min'
        elif time_taken == 7:
            time_bucket_to_read_blog_post = 'seven_to_eight_min'
        elif time_taken == 8:
            time_bucket_to_read_blog_post = 'eight_to_nine_min'
        elif time_taken == 9:
            time_bucket_to_read_blog_post = 'nine_to_ten_min'
        else:
            time_bucket_to_read_blog_post = 'more_than_ten_min'

        update_reading_time_stats(
            blog_post_id,
            author_id,
            time_bucket_to_read_blog_post
        )

