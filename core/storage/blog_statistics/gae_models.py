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

"""Models for storing statistics data related to blog posts."""

from __future__ import annotations

from core import utils
from core.platform import models

from typing import Dict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models, ) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class BlogPostViewedEventLogEntryModel(base_models.BaseModel):
    """An event triggered when a blog post is viewed by any user.
    The model will be keyed to unique ID which will be of the form -
    '[timestamp]:[blog_post_id]:[random_hash]'.
    """

    # ID of blog post currently being viewed.
    blog_post_id = datastore_services.StringProperty(
        indexed=True, required=True
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, blog_post_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[blog_post_id]:[random_hash]'.
        """

        # To avoid collision between events occuring at the same date and time,
        # a random hash is appended to the event model id.
        for _ in range(base_models.MAX_RETRIES):
            random_hash = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH
            )
            new_id = ('%s:%s:%s' % (
                str(int(utils.get_current_time_in_millisecs())),
                blog_post_id,
                random_hash)
            )
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for the model is producing too many collisions.'
        )

    @classmethod
    def create(
            cls,
            blog_post_id: str,
    ) -> str:
        """Creates a new blog post viewed event entry."""
        entity_id = cls.get_new_event_entity_id(blog_post_id)
        event_entity = cls(
            id=entity_id,
            blog_post_id=blog_post_id
        )
        event_entity.update_timestamps()
        event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain neccessary information for user for
        takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'blog_post_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class BlogPostReadEventLogEntryModel(base_models.BaseModel):
    """An event triggered when a blog post is read by any user, that is,
    if the user stays on the blog post longer than 50% of the time calculated
    using the number of words in the blog post,the blog post will be marked as
    read.
    The model will be keyed to unique ID which will be of the form -
    [timestamp]:[blog_post_id]:[random_hash].
    """

    # ID of blog post currently being read.
    blog_post_id = datastore_services.StringProperty(
        indexed=True, required=True
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, blog_post_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[blog_post_id]:[random_hash]'.
        """

        # To avoid collision between events occuring at the same date and time,
        # a random hash is appended to the event model id.
        for _ in range(base_models.MAX_RETRIES):
            random_hash = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH
            )
            new_id = ('%s:%s:%s' % (
                str(int(utils.get_current_time_in_millisecs())),
                blog_post_id,
                random_hash)
            )
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for the model is producing too many collisions.'
        )

    @classmethod
    def create(
            cls,
            blog_post_id: str
    ) -> str:
        """Creates a new blog post read event entry."""
        entity_id = cls.get_new_event_entity_id(blog_post_id)
        event_entity = cls(
            id=entity_id,
            blog_post_id=blog_post_id
        )
        event_entity.update_timestamps()
        event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user() -> (
        base_models.MODEL_ASSOCIATION_TO_USER
    ):
        """Model does not contain neccessary information for user for
        takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'blog_post_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class BlogPostExitedEventLogEntryModel(base_models.BaseModel):
    """An event triggered when a blog post is read by any user, that is,
    if the user stays on the blog post longer than 50% of the time calculated
    using the number of words in the blog post,the blog post will be marked as
    read.
    The model will be keyed to unique ID which will be of the form -
    [timestamp]:[blog_post_id]:[random_hash].
    """

    # ID of blog post being exited.
    blog_post_id = datastore_services.StringProperty(
        indexed=True, required=True
    )
    # Time user stayed on the blog post.
    time_user_stayed_on_blog_post = (
        datastore_services.FloatProperty(indexed=True, required=True)
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_new_event_entity_id(cls, blog_post_id: str) -> str:
        """Generates a unique id for the event model of the form
        '[timestamp]:[blog_post_id]:[random_hash]'.
        """

        # To avoid collision between events occuring at the same date and time,
        # a random hash is appended to the event model id.
        for _ in range(base_models.MAX_RETRIES):
            random_hash = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH
            )
            new_id = ('%s:%s:%s' % (
                str(int(utils.get_current_time_in_millisecs())),
                blog_post_id,
                random_hash)
            )
            if not cls.get_by_id(new_id):
                return new_id
        raise Exception(
            'The id generator for the model is producing too many collisions.'
        )

    @classmethod
    def create(
            cls,
            blog_post_id: str,
            time_user_stayed_on_blog_post: float,
    ) -> str:
        """Creates a new blog post exited event entry."""
        entity_id = cls.get_new_event_entity_id(blog_post_id)
        event_entity = cls(
            id=entity_id,
            blog_post_id=blog_post_id,
            time_user_stayed_on_blog_post=time_user_stayed_on_blog_post)
        event_entity.update_timestamps()
        event_entity.put()
        return entity_id

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain neccessary information for user for
        takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'blog_post_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_user_stayed_on_blog_post': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE)
        })


class BlogPostViewsAggregatedStatsModel(base_models.BaseModel):
    """A summary model to store number of views on the blog post.
    It will be keyed to the blog_post_id of the blog post. This model can be
    regenerated from 'BlogPostViewedEventLogEntryModel' in case of data
    corruption.
    """

    # It will consist of a dict of dictionaries where key is the date
    # (YYYY-MM-DD) in the UTC format) and value is dict with keys as hours
    # (in the UTC format) and number of views as values. We will maintain hourly
    # views for past 3 days (including the ongoing day) and delete the rest
    # whenever a PUT request is performed on the storage model.
    views_by_hour = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of key-value pairs where key is the month(YYYY-MM) and
    # value is dict with keys as UTC date and values as  number of views on the
    # blog posts on that date. At max there will be views by date keyed to 3
    # months (ongoing month and the past 2 months(all the days of the month)).
    views_by_date = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of a dict of dictionaries where key is the year (in the
    # UTC format) and value is dict with keys as month number (in the UTC
    # format) and number of views in that month as value.
    views_by_month = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The model doesn't contain relevant data corresponding to users."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'views_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @classmethod
    def create(cls, blog_post_id: str) -> BlogPostViewsAggregatedStatsModel:
        """Creates a new BlogPostViewsAggregatedStatsModel entry.

        Args:
            blog_post_id: str. Blog Post ID of the newly-published blog post for
                which the stats model has to be created.

        Returns:
            BlogPostViewsAggregatedStatsModel. The newly created
            BlogPostViewsAggregatedStatsModel instance.

        Raises:
            Exception. A views stats model with the given blog post ID exists
                already.
        """
        if cls.get_by_id(blog_post_id):
            raise Exception(
                'A blog post views stats model with the given blog post ID'
                'exists already.')
        entity = cls(
            id=blog_post_id,
            views_by_hour={},
            views_by_date={},
            views_by_month={}
        )
        entity.update_timestamps()
        entity.put()

        return entity


class BlogPostReadsAggregatedStatsModel(base_models.BaseModel):
    """A summary model to store number of reads on the blog post.
    It will be keyed to the blog_post_id of the blog post. This model can be
    regenerated from 'BlogPostReadEventLogEntryModel' in case of data
    corruption.
    """

    # It will consist of a dict of dictionaries where key is the date
    # (YYYY-MM-DD) in the UTC format) and value is dict with keys as hours
    # (in the UTC format) and number of views as values. We will maintain hourly
    # reads for past 3 days (including the ongoing day) and delete the rest
    # whenever a PUT request is performed on the storage model.
    reads_by_hour = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of key-value pairs where key is the month(YYYY-MM) and
    # value is dict with keys as UTC date and values as number of reads on the
    # blog posts on that date. At max there will be reads by date keyed to 3
    # months (ongoing month and the past 2 months(all the days of the month)).
    reads_by_date = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of a dict of dictionaries where key is the year (in the
    # UTC format) and value is dict with keys as month number (in the UTC
    # format) and number of reads in that month as value.
    reads_by_month = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The model doesn't contain relevant data corresponding to users."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'reads_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(cls, blog_post_id: str) -> BlogPostReadsAggregatedStatsModel:
        """Creates a new BlogPostReadsAggregatedStatsModel entry.

        Args:
            blog_post_id: str. Blog Post ID of the newly-published blog post for
                which the stats model has to be created.

        Returns:
            BlogPostReadsAggregatedStatsModel. The newly created
            BlogPostReadsAggregatedStatsModel instance.

        Raises:
            Exception. A reads stats model with the given blog post ID exists
                already.
        """
        if cls.get_by_id(blog_post_id):
            raise Exception(
                'A blog post reads stats model with the given blog post ID'
                'exists already.')
        entity = cls(
            id=blog_post_id,
            reads_by_hour={},
            reads_by_date={},
            reads_by_month={}
        )
        entity.update_timestamps()
        entity.put()

        return entity


class BlogPostReadingTimeModel(base_models.BaseModel):
    """A summary model to store total number of users staying for a particular
    time on the blog post. It will be updated as soon as the user leaves the
    blog post completely.
    It will be keyed to the blog_post_id of the blog post. This model can be
    regenerated from 'BlogPostExitedEventLogEntryModel' in case of data
    corruption.
    """

    # Number of user taking less than a minute to read the blog post.
    zero_to_one_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking one to two minutes to read the blog post.
    one_to_two_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking two to three minutes to read the blog post.
    two_to_three_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking three to four minutes to read the blog post.
    three_to_four_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking four to five minutes to read the blog post.
    four_to_five_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking five to six minutes to read the blog post.
    five_to_six_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking six to seven minutes to read the blog post.
    six_to_seven_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking seven to eight minutes to read the blog post.
    seven_to_eight_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking eight to nine minutes to read the blog post.
    eight_to_nine_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking nine to ten minutes to read the blog post.
    nine_to_ten_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)
    # Number of users taking more than ten minutes to read the blog post.
    more_than_ten_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The model doesn't contain relevant data corresponding to users."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'zero_to_one_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'one_to_two_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'two_to_three_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'three_to_four_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'four_to_five_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'five_to_six_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'six_to_seven_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'seven_to_eight_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'eight_to_nine_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'nine_to_ten_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'more_than_ten_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @classmethod
    def create(cls, blog_post_id: str) -> BlogPostReadingTimeModel:
        """Creates a new BlogPostReadingTimeModel entry.

        Args:
            blog_post_id: str. Blog Post ID of the newly-published blog post for
                which the stats model has to be created.

        Returns:
            BlogPostReadingTimeModel. The newly created BlogPostReadingTimeModel
            instance.

        Raises:
            Exception. A reading time model with the given blog post ID exists
                already.
        """
        if cls.get_by_id(blog_post_id):
            raise Exception(
                'A blog post reading time model with the given blog post ID'
                'exists already.')
        entity = cls(
            id=blog_post_id,
            zero_to_one_min=0,
            one_to_two_min=0,
            two_to_three_min=0,
            three_to_four_min=0,
            four_to_five_min=0,
            five_to_six_min=0,
            six_to_seven_min=0,
            seven_to_eight_min=0,
            eight_to_nine_min=0,
            nine_to_ten_min=0,
            more_than_ten_min=0
        )
        entity.update_timestamps()
        entity.put()

        return entity


class AuthorBlogPostViewsAggregatedStatsModel(base_models.BaseModel):
    """A summary model to store number of views on all the blog posts by a
    particular author.
    It will be keyed to the user ID of the author. This model can be
    regenerated from 'BlogPostViewedEventLogEntryModel' in case of data
    corruption.
    """

    # It will consist of a dict of dictionaries where key is the date
    # (YYYY-MM-DD) in the UTC format) and value is dict with keys as hours
    # (in the UTC format) and number of views as values. We will maintain hourly
    # views for past 3 days (including the ongoing day) and delete the rest
    # whenever a PUT request is performed on the storage model.
    views_by_hour = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of key-value pairs where key is the month(YYYY-MM) and
    # value is dict with keys as UTC date and values as number of views on the
    # blog posts on that date. At max there will be views by date keyed to 3
    # months (ongoing month and the past 2 months(all the days of the month)).
    views_by_date = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of a dict of dictionaries where key is the year (in the
    # UTC format) and value is dict with keys as month number (in the UTC
    # format) and number of views in that month as value.
    views_by_month = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain neccessary information for user for
        takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'views_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(cls, author_id: str) -> AuthorBlogPostViewsAggregatedStatsModel:
        """Creates a new AuthorBlogPostViewsAggregatedStatsModel entry.

        Args:
            author_id: str. User ID of the author.

        Returns:
            AuthorBlogPostViewsAggregatedStatsModel. The newly created
            AuthorBlogPostViewsAggregatedStatsModel instance.
        Raises:  AuthorBlogPostViewsAggregatedStatsModel. The newly created
            AuthorBlogPostViewsAggregatedStatsModel instance.

        Raises:
            Exception. A views stats model with the given author ID exists
                already.
        """

        if cls.get_by_id(author_id):
            raise Exception(
                'A author blog post views stats model with the given author ID'
                ' exists already.')
        entity = cls(
            id=author_id,
            views_by_hour={},
            views_by_date={},
            views_by_month={}
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether author blog post views stats model references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None


class AuthorBlogPostAggregatedReadingTimeModel(base_models.BaseModel):
    """A summary model to store total number of users staying for a particular
    time on the blog posts written by a particular author. It will be updated as
    soon as the user leaves the blog post written completely.
    It will be keyed to the user ID of the author. This model can be
    regenerated from 'BlogPostExitedEventLogEntryModel' in case of data
    corruption.
    """

    # Number of user taking less than a minute to read the blog post.
    zero_to_one_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    # Number of users taking one to two minutes to read the blog post.
    one_to_two_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    two_to_three_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    three_to_four_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    four_to_five_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    five_to_six_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    six_to_seven_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    seven_to_eight_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    eight_to_nine_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    nine_to_ten_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )
    # Number of users taking more than ten minutes to read the blog post.
    more_than_ten_min = datastore_services.IntegerProperty(
        indexed=False, required=True, repeated=False
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain neccessary information for user for
        takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'zero_to_one_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'one_to_two_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'two_to_three_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'three_to_four_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'four_to_five_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'five_to_six_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'six_to_seven_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'seven_to_eight_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'eight_to_nine_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'nine_to_ten_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'more_than_ten_min': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether author blog post reads stats model references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @classmethod
    def create(
        cls, author_id: str
    ) -> AuthorBlogPostAggregatedReadingTimeModel:
        """Creates a new AuthorBlogPostAggregatedReadingTimeModel entry.

        Args:
            author_id: str. User ID of the author.

        Returns:
            AuthorBlogPostAggregatedReadingTimeModel. The newly created
            AuthorBlogPostAggregatedReadingTimeModel instance.

        Raises:
            Exception. A reading time model with the given author ID exists
                already.
        """
        if cls.get_by_id(author_id):
            raise Exception(
                'A author blog post reading time model with the given author ID'
                ' exists already.')

        entity = cls(
            id=author_id,
            zero_to_one_min=0,
            one_to_two_min=0,
            two_to_three_min=0,
            three_to_four_min=0,
            four_to_five_min=0,
            five_to_six_min=0,
            six_to_seven_min=0,
            seven_to_eight_min=0,
            eight_to_nine_min=0,
            nine_to_ten_min=0,
            more_than_ten_min=0
        )
        entity.update_timestamps()
        entity.put()

        return entity


class AuthorBlogPostReadsAggregatedStatsModel(base_models.BaseModel):
    """A summary model to store number of reads on all blog posts written
    by a particular author.
    It will be keyed to the user ID of the author. This model can be
    regenerated from 'BlogPostReadEventLogEntryModel' in case of data
    corruption.
    """

    # It will consist of a dict of dictionaries where key is the date
    # (YYYY-MM-DD) in the UTC format) and value is dict with keys as hours
    # (in the UTC format) and number of views as values. We will maintain hourly
    # reads for past 3 days (including the ongoing day) and delete the rest
    # whenever a PUT request is performed on the storage model.
    reads_by_hour = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of key-value pairs where key is the month(YYYY-MM) and
    # value is dict with keys as UTC date and values as number of reads on the
    # blog posts on that date. At max there will be reads by date keyed to 3
    # months (ongoing month and the past 2 months(all the days of the month)).
    reads_by_date = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)
    # It will consist of a dict of dictionaries where key is the year ( in the
    # UTC format) and value is dict with keys as month number (in the UTC
    # format) and number of reads in that month as value.
    reads_by_month = datastore_services.JsonProperty(
        indexed=False, required=True, repeated=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id field."""
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain neccessary information for user for
        takeout.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user that
        should be exported.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'reads_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(cls, author_id: str) -> AuthorBlogPostReadsAggregatedStatsModel:
        """Creates a new AuthorBlogPostReadsAggregatedStatsModel entry.

        Args:
            author_id: str. User ID of author.

        Returns:
            AuthorBlogPostReadsAggregatedStatsModel. The newly created
            AuthorBlogPostReadsAggregatedStatsModel instance.

        Raises:
            Exception. A reads stats model with the given author ID exists
                already.
        """
        if cls.get_by_id(author_id):
            raise Exception(
                'A author blog post reads stats model with the given author ID'
                ' exists already.')

        entity = cls(
            id=author_id,
            reads_by_hour={},
            reads_by_date={},
            reads_by_month={}
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether author blog post reads stats model references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.get_by_id(user_id) is not None
