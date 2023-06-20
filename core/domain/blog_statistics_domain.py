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

"""Domain objects relating to blog post statistics."""

from __future__ import annotations

import datetime

from core import utils
from core.constants import constants

from typing import Dict, TypedDict, Union


def _repack_views_stats(stats: Union[
        BlogPostViewsAggregatedStats,
        AuthorBlogPostViewsAggregatedStats
    ]
) -> None:
    """Repacks aggregated stats domain object to contain necessary keys removing
    older stats. We will only maintain views_by_hour for past 3 days
    (including the ongoing day) and views_by_date keyed to 3 months and delete
    the rest for these fields.

    Args:
        stats: BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats.
            The stats domain object for which hourly views are to be generated.
    """
    stats.views_by_date = {
        k: stats.views_by_date[k] for k in list(stats.views_by_date)[:3]
    }
    stats.views_by_hour = {
        k: stats.views_by_hour[k] for k in list(stats.views_by_hour)[:3]
    }


def _repack_reads_stats(stats: Union[
        BlogPostReadsAggregatedStats,
        AuthorBlogPostReadsAggregatedStats
    ]
) -> None:
    """Repacks aggregated stats domain object to contain necessary keys removing
    older stats. We will only maintain reads_by_hour for past 3 days
    (including the ongoing day) and reads_by_date keyed to 3 months and delete
    the rest for these fields.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which hourly reads are to be generated.
    """
    stats.reads_by_date = {
        k: stats.reads_by_date[k] for k in list(stats.reads_by_date)[:3]
    }
    stats.reads_by_hour = {
        k: stats.reads_by_hour[k] for k in list(stats.reads_by_hour)[:3]
    }


def _generate_past_twenty_four_hour_views_stats_from_views_by_hour(
    stats: Union[
        BlogPostViewsAggregatedStats,
        AuthorBlogPostViewsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of views hour wise for the past twenty four
    hours.

    Args:
        stats: BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats.
            The stats domain object for which hourly views are to be generated.

    Returns:
        dict. A dict with number of views keyed to hour('HH') in UTC fromat for
        the past twenty four hours.
    """
    current_hour = datetime.datetime.utcnow().hour
    current_date = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    yesterdays_date = (
        datetime.datetime.utcnow() - datetime.timedelta(days=1)
    ).strftime('%Y-%m-%d')
    deficit_hours_in_current_date = 24 - current_hour - 1
    hourly_stats = {}
    if yesterdays_date in stats.views_by_hour.keys():
        yesterday_stats = stats.views_by_hour[yesterdays_date]
        # We add '_' after the hour key to avoid auto ordering of keys in
        # frontend, otherwise the keys get treated like numeric keys instead of
        # strings by typescript.
        hourly_stats = {
             k + '_': yesterday_stats[k] for k in list(
                yesterday_stats)[-deficit_hours_in_current_date:]
        }
    todays_stats = stats.views_by_hour[current_date]
    hourly_stats.update({
         k + '_': todays_stats[k] for k in list(todays_stats)[:current_hour + 1]
    })
    return hourly_stats


def _generate_past_week_views_stats_from_views_by_date(
    stats: Union[
        BlogPostViewsAggregatedStats,
        AuthorBlogPostViewsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of views date wise for the past seven days.

    Args:
        stats: BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats.
            The stats domain object for which weekly views are to be generated.

    Returns:
        dict. A dict with number of views keyed to date('DD') in UTC fromat for
        the past week(past seven days).
    """
    current_month_year = datetime.datetime.utcnow().strftime('%Y-%m')
    current_day = datetime.datetime.utcnow().day
    current_month_stats = stats.views_by_date[current_month_year]
    weekly_stats = {}
    if current_day < 7:
        last_month_year = (
            datetime.datetime.utcnow() - datetime.timedelta(days=7)
        ).strftime('%Y-%m')
        if last_month_year in stats.views_by_date.keys():
            last_month_stats = stats.views_by_date[last_month_year]
            # We add '_' after the weekly stats keys to avoid auto ordering of
            # keys in frontend, otherwise the keys get treated like numeric keys
            #  instead of strings by typescript.
            weekly_stats = {
                 k + '_': last_month_stats[k] for k in list(
                    last_month_stats)[- (7 - current_day):]
            }
        weekly_stats.update({
         k + '_': current_month_stats[k] for k in list(
            current_month_stats)[:current_day]
        })
    else:
        weekly_stats.update({
             k + '_': current_month_stats[k] for k in list(
                current_month_stats)[(current_day - 7):current_day]
        })
    return weekly_stats


def _generate_monthly_views_from_views_by_date(
    stats: Union[
        BlogPostViewsAggregatedStats,
        AuthorBlogPostViewsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of reads date wise for the ongoing month.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which monthly reads are to be generated.

    Returns:
        dict. A dict with number of reads keyed to date('DD') in UTC fromat for
        the ongoing month.
    """
    current_month_year = datetime.datetime.utcnow().strftime('%Y-%m')
    # We add '_' after the day stat keys to avoid auto ordering of keys
    # in frontend, otherwise the keys get treated like numeric keys instead of
    # strings by typescript.
    stats_dict = {
         k + '_': stats.views_by_date[current_month_year][k] for k in list(
            stats.views_by_date[current_month_year])
    }
    return stats_dict


def _generate_yearly_views_from_views_by_month(
    stats: Union[
        BlogPostViewsAggregatedStats,
        AuthorBlogPostViewsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of views month wise for the ongoing year.

    Args:
        stats: BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats.
            The stats domain object for which yearly views are to be generated.

    Returns:
        dict. A dict with number of views keyed to months in UTC fromat in the
        ongoing year.
    """
    current_year = datetime.datetime.utcnow().strftime('%Y')
    # We add '_' after the month keys to avoid auto ordering of keys
    # in frontend, otherwise the keys get treated like numeric keys instead of
    # strings by typescript.
    stats_dict = {
         k + '_': stats.views_by_month[current_year][k] for k in list(
            stats.views_by_month[current_year])
    }
    return stats_dict


def _generate_past_twenty_four_hour_reads_stats_from_reads_by_hour(
    stats: Union[
        BlogPostReadsAggregatedStats,
        AuthorBlogPostReadsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of reads hour wise for the past twenty four
    hours.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which hourly reads are to be generated.

    Returns:
        dict. A dict with number of reads keyed to hour('HH') in UTC fromat for
        the past twenty four hours.
    """
    current_hour = datetime.datetime.utcnow().hour
    current_date = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    yesterdays_date = (
        datetime.datetime.utcnow() - datetime.timedelta(days=1)
    ).strftime('%Y-%m-%d')
    deficit_hours_in_current_date = 24 - current_hour - 1
    hourly_stats = {}
    if yesterdays_date in stats.reads_by_hour.keys():
        yesterday_stats = stats.reads_by_hour[yesterdays_date]
        # We add '_' after the hour key to avoid auto ordering of keys in
        # frontend, otherwise the keys get treated like numeric keys instead of
        # strings by typescript.
        hourly_stats = {
             k + '_': yesterday_stats[k] for k in list(
                yesterday_stats)[- deficit_hours_in_current_date:]
        }
    todays_stats = stats.reads_by_hour[current_date]
    hourly_stats.update({
         k + '_': todays_stats[k] for k in list(todays_stats)[:current_hour + 1]
    })
    return hourly_stats


def _generate_past_week_reads_stats_from_reads_by_date(
    stats: Union[
        BlogPostReadsAggregatedStats,
        AuthorBlogPostReadsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of reads date wise for the past seven days.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which weekly reads are to be generated.

    Returns:
        dict. A dict with number of reads keyed to date('DD') in UTC fromat for
        the past week(past seven days).
    """
    current_month_year = datetime.datetime.utcnow().strftime('%Y-%m')
    current_day = datetime.datetime.utcnow().day
    current_month_stats = stats.reads_by_date[current_month_year]
    weekly_stats = {}
    if current_day < 7:
        last_month_year = (
            datetime.datetime.utcnow() - datetime.timedelta(days=7)
        ).strftime('%Y-%m')
        if last_month_year in stats.reads_by_date.keys():
            last_month_stats = stats.reads_by_date[last_month_year]
            # We add '_' after the weekly stats keys to avoid auto ordering of
            # keys in frontend, otherwise the keys get treated like numeric keys
            # instead of strings by typescript.
            weekly_stats = {
                 k + '_': last_month_stats[k] for k in list(
                    last_month_stats)[- (7 - current_day):]
            }
        weekly_stats.update({
             k + '_': current_month_stats[k] for k in list(
                current_month_stats)[:current_day]
        })
    else:
        weekly_stats.update({
             k + '_': current_month_stats[k] for k in list(
                current_month_stats)[(current_day - 7):current_day]
        })
    return weekly_stats


def _generate_monthly_reads_from_reads_by_date(
    stats: Union[
        BlogPostReadsAggregatedStats,
        AuthorBlogPostReadsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of reads date wise for the ongoing month.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which monthly reads are to be generated.

    Returns:
        dict. A dict with number of reads keyed to date('DD') in UTC fromat for
        the ongoing month.
    """
    current_month_year = datetime.datetime.utcnow().strftime('%Y-%m')
    # We add '_' after the day stat keys to avoid auto ordering of keys
    # in frontend, otherwise the keys get treated like numeric keys instead of
    # strings by typescript.
    stats_dict = {
         k + '_': stats.reads_by_date[current_month_year][k] for k in list(
            stats.reads_by_date[current_month_year])
    }
    return stats_dict


def _generate_yearly_reads_from_reads_by_month(
    stats: Union[
        BlogPostReadsAggregatedStats,
        AuthorBlogPostReadsAggregatedStats
    ]
) -> Dict[str, int]:
    """Returns a dict with number of reads month wise for the ongoing year.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which yearly reads are to be generated.

    Returns:
        dict. A dict with number of reads keyed to months in UTC fromat in the
        ongoing year.
    """
    current_year = datetime.datetime.utcnow().strftime('%Y')
    # We add '_' after the month keys to avoid auto ordering of keys
    # in frontend, otherwise the keys get treated like numeric keys instead of
    # strings by typescript.
    stats_dict = {
         k + '_': stats.reads_by_month[current_year][k] for k in list(
            stats.reads_by_month[current_year])
    }
    return stats_dict


def _generate_all_reads_from_reads_by_month(
    stats: Union[
        BlogPostReadsAggregatedStats,
        AuthorBlogPostReadsAggregatedStats
    ]
) -> Dict[str, Dict[str, int]]:
    """Returns a dict with number of reads month wise for all the past years.

    Args:
        stats: BlogPostReadsAggregatedStats|AuthorBlogPostReadsAggregatedStats.
            The stats domain object for which all reads are to be generated.

    Returns:
        dict. A dict with number of reads keyed to months in UTC fromat keyed to
        their respective years.
    """
    # We add '_' after the month keys to avoid auto ordering of keys
    # in frontend, otherwise the keys get treated like numeric keys instead of
    # strings by typescript.
    stats_dict = {
         k + '_': {
             m + '_': stats.reads_by_month[k][m] for m in list(
                stats.reads_by_month[k]
            )
        } for k in list(stats.reads_by_month)
    }
    return stats_dict


def _generate_all_views_from_views_by_month(
    stats: Union[
        BlogPostViewsAggregatedStats,
        AuthorBlogPostViewsAggregatedStats
    ]
) -> Dict[str, Dict[str, int]]:
    """Returns a dict with number of views month wise for all the past years.

    Args:
        stats: BlogPostViewsAggregatedStats|AuthorBlogPostViewsAggregatedStats.
            The stats domain object for which all views are to be generated.

    Returns:
        dict. A dict with number of views keyed to months in UTC fromat keyed to
        their respective years.
    """
    # We add '_' after the month keys to avoid auto ordering of keys
    # in frontend, otherwise the keys get treated like numeric keys instead of
    # strings by typescript.
    stats_dict = {
         k + '_': {
             m + '_': stats.views_by_month[k][m] for m in list(
                stats.views_by_month[k]
            )
        } for k in list(stats.views_by_month)
    }
    return stats_dict


class BlogPostViewsAggregatedStatsFrontendDict(TypedDict):
    """Frontend Dict type for BlogPostViewsAggregatedStats object."""

    blog_post_id: str
    hourly_views: Dict[str, int]
    weekly_views: Dict[str, int]
    monthly_views: Dict[str, int]
    yearly_views: Dict[str, int]
    all_views: Dict[str, Dict[str, int]]


class BlogPostReadsAggregatedStatsFrontendDict(TypedDict):
    """Frontend Dict type for BlogPostReadsAggregatedStats object."""

    blog_post_id: str
    hourly_reads: Dict[str, int]
    weekly_reads: Dict[str, int]
    monthly_reads: Dict[str, int]
    yearly_reads: Dict[str, int]
    all_reads: Dict[str, Dict[str, int]]


class AuthorBlogPostReadsAggregatedStatsDict(TypedDict):
    """Frontend Dict type for AuthorBlogPostReadsAggregatedStats object."""

    hourly_reads: Dict[str, int]
    weekly_reads: Dict[str, int]
    monthly_reads: Dict[str, int]
    yearly_reads: Dict[str, int]
    all_reads: Dict[str, Dict[str, int]]


class AuthorBlogPostViewsAggregatedStatsDict(TypedDict):
    """Frontend Dict type for AuthorBlogPostViewsAggregatedStats object."""

    hourly_views: Dict[str, int]
    weekly_views: Dict[str, int]
    monthly_views: Dict[str, int]
    yearly_views: Dict[str, int]
    all_views: Dict[str, Dict[str, int]]


class BlogPostReadingTimeDict(TypedDict):
    """Frontend Dict type for BlogPostReadingTime object."""

    blog_post_id: str
    zero_to_one_min: int
    one_to_two_min: int
    two_to_three_min: int
    three_to_four_min: int
    four_to_five_min: int
    five_to_six_min: int
    six_to_seven_min: int
    seven_to_eight_min: int
    eight_to_nine_min: int
    nine_to_ten_min: int
    more_than_ten_min: int


class AuthorBlogPostReadingTimeDict(TypedDict):
    """Frontend Dict type for AuthorBlogPostReadingTime object."""

    zero_to_one_min: int
    one_to_two_min: int
    two_to_three_min: int
    three_to_four_min: int
    four_to_five_min: int
    five_to_six_min: int
    six_to_seven_min: int
    seven_to_eight_min: int
    eight_to_nine_min: int
    nine_to_ten_min: int
    more_than_ten_min: int


class BlogPostViewsAggregatedStats:
    """Domain object representing blog post views aggregated stats model."""

    def __init__(
        self,
        blog_post_id: str,
        views_by_hour: Dict[str, Dict[str, int]],
        views_by_date: Dict[str, Dict[str, int]],
        views_by_month: Dict[str, Dict[str, int]],
        created_on: datetime.datetime
    ) -> None:
        """Constructs an BlogPostViewsAggregatedStats domain object.

        Args:
            blog_post_id: str. ID of the blog post.
            views_by_hour: Dict. It will consist of a dict of dictionaries where
                key is the date (YYYY-MM-DD) in the UTC format) and value is
                dict with keys as hours (in the UTC format) and number of views
                as values.
            views_by_date: Dict. It will consist of key-value pairs where key is
                the month(YYYY-MM) and value is dict with keys as UTC date and
                values as  number of views on the blog posts on that date.
            views_by_month: Dict. It will consist of a dict of dictionaries
                where key is the year (in the UTC format) and value is dict
                with keys as month number (in the UTC format) and number of
                views in that month as value.
            created_on: datetime. The time at which the blog post was created.
        """
        self.blog_post_id = blog_post_id
        self.views_by_hour = views_by_hour
        self.views_by_date = views_by_date
        self.views_by_month = views_by_month
        self.created_on = created_on

    def repack_stats(self) -> None:
        """Repacks stats to contain only required aggregated stats removing old
        stats.
        """
        _repack_views_stats(self)

    def to_frontend_dict(self) -> BlogPostViewsAggregatedStatsFrontendDict:
        """Returns a dict representation of the domain object for use in the
        frontend.

        Returns:
            dict. A dict, representing aggregated stats in a format that can be
            used in frontend.
        """
        stats_dict: BlogPostViewsAggregatedStatsFrontendDict = {
            'blog_post_id': self.blog_post_id,
            'hourly_views': (
                _generate_past_twenty_four_hour_views_stats_from_views_by_hour(
                    self
                )
            ),
            'weekly_views': (
                _generate_past_week_views_stats_from_views_by_date(self)
            ),
            'monthly_views': _generate_monthly_views_from_views_by_date(self),
            'yearly_views': _generate_yearly_views_from_views_by_month(self),
            'all_views': _generate_all_views_from_views_by_month(self),
        }
        return stats_dict

    def validate(self) -> None:
        """Checks whether the blog post id is a valid one.

        Raises:
            ValidationError. No blog_post_id specified.
            ValidationError. The blog_post_id is not a string.
            ValidationError. The blog_post_id is invalid.
        """
        if not self.blog_post_id:
            raise utils.ValidationError('No blog_post_id specified')

        if not isinstance(self.blog_post_id, str):
            raise utils.ValidationError(
                'Blog Post ID must be a string, but got %r' % self.blog_post_id)

        if len(self.blog_post_id) != constants.BLOG_POST_ID_LENGTH:
            raise utils.ValidationError(
                'Blog ID %s is invalid' % self.blog_post_id)


class BlogPostReadsAggregatedStats:
    """Domain object representing blog post reads aggregated stats model."""

    def __init__(
        self,
        blog_post_id: str,
        reads_by_hour: Dict[str, Dict[str, int]],
        reads_by_date: Dict[str, Dict[str, int]],
        reads_by_month: Dict[str, Dict[str, int]],
        created_on: datetime.datetime
    ) -> None:
        """Constructs an BlogPostReadsAggregatedStats domain object.

        Args:
            blog_post_id: str. ID of the blog post.
            reads_by_hour: Dict. It will consist of a dict of dictionaries where
                key is the date (YYYY-MM-DD) in the UTC format) and value is
                dict with keys as hours (in the UTC format) and number of reads
                as values.
            reads_by_date: Dict. It will consist of key-value pairs where key is
                the month(YYYY-MM) and value is dict with keys as UTC date and
                values as number of reads on the blog posts on that date.
            reads_by_month: Dict. It will consist of a dict of dictionaries
                where key is the year (in the UTC format) and value is dict
                with keys as month number (in the UTC format) and number of
                reads in that month as value.
            created_on: datetime. The time at which the blog post was created.
        """
        self.blog_post_id = blog_post_id
        self.reads_by_hour = reads_by_hour
        self.reads_by_date = reads_by_date
        self.reads_by_month = reads_by_month
        self.created_on = created_on

    def repack_stats(self) -> None:
        """Repacks stats to contain only required aggregated stats removing old
        stats.
        """
        _repack_reads_stats(self)

    def to_frontend_dict(self) -> BlogPostReadsAggregatedStatsFrontendDict:
        """Returns a dict representation of the domain object for use in the
        frontend.

        Returns:
            dict. A dict, representing aggregated stats in a format that can be
            used in frontend.
        """
        stats_dict: BlogPostReadsAggregatedStatsFrontendDict = {
            'blog_post_id': self.blog_post_id,
            'hourly_reads': (
                _generate_past_twenty_four_hour_reads_stats_from_reads_by_hour(
                    self
                )),
            'weekly_reads': (
                _generate_past_week_reads_stats_from_reads_by_date(self)
                ),
            'monthly_reads': _generate_monthly_reads_from_reads_by_date(self),
            'yearly_reads': _generate_yearly_reads_from_reads_by_month(self),
            'all_reads': _generate_all_reads_from_reads_by_month(self),
        }
        return stats_dict

    def validate(self) -> None:
        """Checks whether the blog post id is a valid one.

        Raises:
            ValidationError. No blog_post_id specified.
            ValidationError. The blog_post_id is not a string.
            ValidationError. The blog_post_id is invalid.
        """
        if not self.blog_post_id:
            raise utils.ValidationError('No blog_post_id specified')

        if not isinstance(self.blog_post_id, str):
            raise utils.ValidationError(
                'Blog Post ID must be a string, but got %r' % self.blog_post_id)

        if len(self.blog_post_id) != constants.BLOG_POST_ID_LENGTH:
            raise utils.ValidationError(
                'Blog ID %s is invalid' % self.blog_post_id)


class BlogPostReadingTime:
    """Domain object representing blog post reading time model."""

    def __init__(
        self,
        blog_post_id: str,
        zero_to_one_min: int,
        one_to_two_min: int,
        two_to_three_min: int,
        three_to_four_min: int,
        four_to_five_min: int,
        five_to_six_min: int,
        six_to_seven_min: int,
        seven_to_eight_min: int,
        eight_to_nine_min: int,
        nine_to_ten_min: int,
        more_than_ten_min: int,
    ) -> None:
        """Constructs an BlogPostReadingTime domain object.

        Args:
            blog_post_id: str. ID of the blog post.
            zero_to_one_min: int. Number of user taking less than a minute to
                read the blog post.
            one_to_two_min: int. Number of users taking one to two minutes to
                read the blog post.
            two_to_three_min: int. Number of users taking two to three minutes
                to read the blog post.
            three_to_four_min: int. Number of users taking three to four minutes
                to read the blog post.
            four_to_five_min: int. Number of users taking four to five minutes
                to read the blog post.
            five_to_six_min: int. Number of users taking five to six minutes to
                read the blog post.
            six_to_seven_min: int. Number of users taking six to seven minutes
                to read the blog post.
            seven_to_eight_min: int. Number of users taking seven to eight
                minutes to read the blog post.
            eight_to_nine_min: int. Number of users taking eight to nine minutes
                to read the blog post.
            nine_to_ten_min: int. Number of users taking nine to ten minutes to
                read the blog post.
            more_than_ten_min: int. Number of users taking more than ten minutes
                to read the blog post.
        """
        self.blog_post_id = blog_post_id
        self.zero_to_one_min = zero_to_one_min
        self.one_to_two_min = one_to_two_min
        self.two_to_three_min = two_to_three_min
        self.three_to_four_min = three_to_four_min
        self.four_to_five_min = four_to_five_min
        self.five_to_six_min = five_to_six_min
        self.six_to_seven_min = six_to_seven_min
        self.seven_to_eight_min = seven_to_eight_min
        self.eight_to_nine_min = eight_to_nine_min
        self.nine_to_ten_min = nine_to_ten_min
        self.more_than_ten_min = more_than_ten_min

    def to_frontend_dict(self) -> BlogPostReadingTimeDict:
        """Returns a dict representation of the domain object for use in the
        frontend.

        Returns:
            dict. A dict, mapping all fields of blog post reading time instance.
        """
        stats_dict: BlogPostReadingTimeDict = {
            'blog_post_id': self.blog_post_id,
            'zero_to_one_min': self.zero_to_one_min,
            'one_to_two_min': self.one_to_two_min,
            'two_to_three_min': self.two_to_three_min,
            'three_to_four_min': self.three_to_four_min,
            'four_to_five_min': self.four_to_five_min,
            'five_to_six_min': self.five_to_six_min,
            'six_to_seven_min': self. six_to_seven_min,
            'seven_to_eight_min': self.seven_to_eight_min,
            'eight_to_nine_min': self.eight_to_nine_min,
            'nine_to_ten_min': self.nine_to_ten_min,
            'more_than_ten_min': self.more_than_ten_min,
        }
        return stats_dict

    def validate(self) -> None:
        """Checks whether the blog post id is a valid one.

        Raises:
            ValidationError. No blog_post_id specified.
            ValidationError. The blog_post_id is not a string.
            ValidationError. The blog_post_id is invalid.
        """
        if not self.blog_post_id:
            raise utils.ValidationError('No blog_post_id specified')

        if not isinstance(self.blog_post_id, str):
            raise utils.ValidationError(
                'Blog Post ID must be a string, but got %r' % self.blog_post_id)

        if len(self.blog_post_id) != constants.BLOG_POST_ID_LENGTH:
            raise utils.ValidationError(
                'Blog Post ID %s is invalid' % self.blog_post_id)


class AuthorBlogPostViewsAggregatedStats:
    """Domain object representing author blog post views aggregated stats
    model.
    """

    def __init__(
        self,
        author_id: str,
        views_by_hour: Dict[str, Dict[str, int]],
        views_by_date: Dict[str, Dict[str, int]],
        views_by_month: Dict[str, Dict[str, int]],
        created_on: datetime.datetime
    ) -> None:
        """Constructs an AuthorBlogPostViewsAggregatedStats domain object.

        Args:
            author_id: str. User ID of the author.
            views_by_hour: Dict. It will consist of a dict of dictionaries where
                key is the date (YYYY-MM-DD) in the UTC format) and value is
                dict with keys as hours (in the UTC format) and number of views
                as values.
            views_by_date: Dict. It will consist of key-value pairs where key is
                the month(YYYY-MM) and value is dict with keys as UTC date and
                values as  number of views on the blog posts on that date.
            views_by_month: Dict. It will consist of a dict of dictionaries
                where key is the year (in the UTC format) and value is dict
                with keys as month number (in the UTC format) and number of
                views in that month as value.
            created_on: datetime. The time at which the author stats model was
                created.
        """
        self.author_id = author_id
        self.views_by_hour = views_by_hour
        self.views_by_date = views_by_date
        self.views_by_month = views_by_month
        self.created_on = created_on

    def repack_stats(self) -> None:
        """Repacks stats to contain only required aggregated stats removing old
        stats.
        """
        _repack_views_stats(self)

    def to_frontend_dict(self) -> AuthorBlogPostViewsAggregatedStatsDict:
        """Returns a dict representation of the domain object for use in the
        frontend.

        Returns:
            dict. A dict, representing aggregated stats in a format that can be
            used in frontend.
        """
        stats_dict: AuthorBlogPostViewsAggregatedStatsDict = {
            'hourly_views': (
                _generate_past_twenty_four_hour_views_stats_from_views_by_hour(
                    self
                )),
            'weekly_views': (
                _generate_past_week_views_stats_from_views_by_date(self)
                ),
            'monthly_views': _generate_monthly_views_from_views_by_date(self),
            'yearly_views': _generate_yearly_views_from_views_by_month(self),
            'all_views': _generate_all_views_from_views_by_month(self),
        }
        return stats_dict

    def validate(self) -> None:
        """Checks whether the blog post id is a valid one.

        Raises:
            ValidationError. No author_id specified.
            ValidationError. The author_id is not a string.
            ValidationError. The author_id has invalid format.
        """
        if not self.author_id:
            raise utils.ValidationError('No author_id specified')

        if not isinstance(self.author_id, str):
            raise utils.ValidationError(
                'Author ID must be a string, but got %r' % self.author_id)

        if not utils.is_user_id_valid(self.author_id):
            raise utils.ValidationError(
                'author_id=%r has the wrong format' % self.author_id)


class AuthorBlogPostReadsAggregatedStats:
    """Domain object representing author blog post reads aggregated stats
    model.
    """

    def __init__(
        self,
        author_id: str,
        reads_by_hour: Dict[str, Dict[str, int]],
        reads_by_date: Dict[str, Dict[str, int]],
        reads_by_month: Dict[str, Dict[str, int]],
        created_on: datetime.datetime
    ) -> None:
        """Constructs an AuthorBlogPostReadsAggregatedStats domain object.

        Args:
            author_id: str. ID of the author.
            reads_by_hour: Dict. It will consist of a dict of dictionaries where
                key is the date (YYYY-MM-DD) in the UTC format) and value is
                dict with keys as hours (in the UTC format) and number of reads
                as values.
            reads_by_date: Dict. It will consist of key-value pairs where key is
                the month(YYYY-MM) and value is dict with keys as UTC date and
                values as number of reads on the blog posts on that date.
            reads_by_month: Dict. It will consist of a dict of dictionaries
                where key is the year (in the UTC format) and value is dict
                with keys as month number (in the UTC format) and number of
                reads in that month as value.
            created_on: datetime. The time at which the author stats model was
                created.
        """
        self.author_id = author_id
        self.reads_by_hour = reads_by_hour
        self.reads_by_date = reads_by_date
        self.reads_by_month = reads_by_month
        self.created_on = created_on

    def repack_stats(self) -> None:
        """Repacks stats to contain only required aggregated stats removing old
        stats.
        """
        _repack_reads_stats(self)

    def to_frontend_dict(self) -> AuthorBlogPostReadsAggregatedStatsDict:
        """Returns a dict representation of the domain object for use in the
        frontend.

        Returns:
            dict. A dict, representing aggregated stats in a format that can be
            used in frontend.
        """
        stats_dict: AuthorBlogPostReadsAggregatedStatsDict = {
            'hourly_reads': (
                _generate_past_twenty_four_hour_reads_stats_from_reads_by_hour(
                    self
                )),
            'weekly_reads': (
                _generate_past_week_reads_stats_from_reads_by_date(self)
                ),
            'monthly_reads': _generate_monthly_reads_from_reads_by_date(self),
            'yearly_reads': _generate_yearly_reads_from_reads_by_month(self),
            'all_reads': _generate_all_reads_from_reads_by_month(self),
        }
        return stats_dict

    def validate(self) -> None:
        """Checks whether the blog post id is a valid one.

        Raises:
            ValidationError. No author_id specified.
            ValidationError. The author_id is not a string.
            ValidationError. The author_id has invalid format.
        """
        if not self.author_id:
            raise utils.ValidationError('No author_id specified')

        if not isinstance(self.author_id, str):
            raise utils.ValidationError(
                'Author ID must be a string, but got %r' % self.author_id)

        if not utils.is_user_id_valid(self.author_id):
            raise utils.ValidationError(
                'author_id=%r has the wrong format' % self.author_id)


class AuthorBlogPostsReadingTime:
    """Domain object representing author blog post reading time model."""

    def __init__(
        self,
        author_id: str,
        zero_to_one_min: int,
        one_to_two_min: int,
        two_to_three_min: int,
        three_to_four_min: int,
        four_to_five_min: int,
        five_to_six_min: int,
        six_to_seven_min: int,
        seven_to_eight_min: int,
        eight_to_nine_min: int,
        nine_to_ten_min: int,
        more_than_ten_min: int,
    ) -> None:
        """Constructs an BlogPostReadingTime domain object.

        Args:
            author_id: str. User ID of the author.
            zero_to_one_min: int. Number of user taking less than a minute to
                read the blog posts written by the author.
            one_to_two_min: int. Number of users taking one to two minutes to
                read the blog posts written by the author.
            two_to_three_min: int. Number of users taking two to three minutes
                to read the blog posts written by the author.
            three_to_four_min: int. Number of users taking three to four minutes
                to read the blog posts written by the author.
            four_to_five_min: int. Number of users taking four to five minutes
                to read the blog posts written by the author.
            five_to_six_min: int. Number of users taking five to six minutes to
                read the blog posts written by the author.
            six_to_seven_min: int. Number of users taking six to seven minutes
                to read the blog posts written by the author.
            seven_to_eight_min: int. Number of users taking seven to eight
                minutes to read the blog posts written by the author.
            eight_to_nine_min: int. Number of users taking eight to nine minutes
                to read the blog posts written by the author.
            nine_to_ten_min: int. Number of users taking nine to ten minutes to
                read the blog posts written by the author.
            more_than_ten_min: int. Number of users taking more than ten minutes
                to read the blog posts written by the author.
        """
        self.author_id = author_id
        self.zero_to_one_min = zero_to_one_min
        self.one_to_two_min = one_to_two_min
        self.two_to_three_min = two_to_three_min
        self.three_to_four_min = three_to_four_min
        self.four_to_five_min = four_to_five_min
        self.five_to_six_min = five_to_six_min
        self.six_to_seven_min = six_to_seven_min
        self.seven_to_eight_min = seven_to_eight_min
        self.eight_to_nine_min = eight_to_nine_min
        self.nine_to_ten_min = nine_to_ten_min
        self.more_than_ten_min = more_than_ten_min

    def to_frontend_dict(self) -> AuthorBlogPostReadingTimeDict:
        """Returns a dict representation of the domain object for use in the
        frontend.

        Returns:
            dict. A dict, mapping all fields of author blog post reading time
            instance.
        """
        stats_dict: AuthorBlogPostReadingTimeDict = {
            'zero_to_one_min': self.zero_to_one_min,
            'one_to_two_min': self.one_to_two_min,
            'two_to_three_min': self.two_to_three_min,
            'three_to_four_min': self.three_to_four_min,
            'four_to_five_min': self.four_to_five_min,
            'five_to_six_min': self.five_to_six_min,
            'six_to_seven_min': self. six_to_seven_min,
            'seven_to_eight_min': self.seven_to_eight_min,
            'eight_to_nine_min': self.eight_to_nine_min,
            'nine_to_ten_min': self.nine_to_ten_min,
            'more_than_ten_min': self.more_than_ten_min,
        }
        return stats_dict

    def validate(self) -> None:
        """Checks whether the author id is a valid one.

        Raises:
            ValidationError. No author_id specified.
            ValidationError. The author_id is not a string.
            ValidationError. The author_id has invalid format.
        """
        if not self.author_id:
            raise utils.ValidationError('No author_id specified')

        if not isinstance(self.author_id, str):
            raise utils.ValidationError(
                'Author ID must be a string, but got %r' % self.author_id)

        if not utils.is_user_id_valid(self.author_id):
            raise utils.ValidationError(
                'author_id=%r has the wrong format' % self.author_id)
