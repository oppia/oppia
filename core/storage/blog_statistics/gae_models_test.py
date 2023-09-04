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

"""Tests for Blog Post models."""

from __future__ import annotations

from core.platform import models
from core.tests import test_utils

from typing import Final


MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import blog_stats_models

(base_models, blog_stats_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.BLOG_STATISTICS, models.Names.USER
])


class BlogPostViewedEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the BlogPostViewedEventLogEntryModel class."""

    USER_ONE_ID: Final = 'user_1'
    USER_TWO_ID: Final = 'user_2'
    NONEXISTENT_USER_ID: Final = 'user_id_x'

    BLOG_POST_ONE_ID: Final = 'blog_post_one'
    BLOG_POST_TWO_ID: Final = 'blog_post_two'

    def setUp(self) -> None:
        """Set up blog post view even log entry models in datastore for use in
        testing.
        """
        super().setUp()

        self.event_model_one = (
            blog_stats_models.BlogPostViewedEventLogEntryModel(
                id='event_model_1',
                blog_post_id=self.BLOG_POST_ONE_ID
            )
        )
        self.event_model_one.update_timestamps()
        self.event_model_one.put()

        self.event_model_two = (
            blog_stats_models.BlogPostViewedEventLogEntryModel(
                id='event_model_2',
                blog_post_id=self.BLOG_POST_ONE_ID
            )
        )
        self.event_model_two.update_timestamps()
        self.event_model_two.put()

        self.event_model_three = (
            blog_stats_models.BlogPostViewedEventLogEntryModel(
                id='event_model_3',
                blog_post_id=self.BLOG_POST_ONE_ID
            )
        )
        self.event_model_three.update_timestamps()
        self.event_model_three.put()

        self.event_model_four = (
            blog_stats_models.BlogPostViewedEventLogEntryModel(
                id='event_model_4',
                blog_post_id=self.BLOG_POST_TWO_ID
            )
        )
        self.event_model_four.update_timestamps()
        self.event_model_four.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostViewedEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE
        )

    def test_create_and_get_event_models(self) -> None:
        entity_id = (
            blog_stats_models.BlogPostViewedEventLogEntryModel.create(
                self.BLOG_POST_TWO_ID
            )
        )
        event_model = blog_stats_models.BlogPostViewedEventLogEntryModel.get(
            entity_id)

        self.assertEqual(event_model.blog_post_id, self.BLOG_POST_TWO_ID)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostViewedEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'blog_post_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.BlogPostViewedEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class BlogPostReadEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the BlogPostReadEventLogEntryModel class."""

    USER_ONE_ID: Final = 'user_1'
    USER_TWO_ID: Final = 'user_2'
    NONEXISTENT_USER_ID: Final = 'user_id_x'

    BLOG_POST_ONE_ID: Final = 'blog_post_one'
    BLOG_POST_TWO_ID: Final = 'blog_post_two'

    def setUp(self) -> None:
        """Set up blog post read event log entry models in datastore for use in
        testing.
        """
        super().setUp()

        self.event_model_one = blog_stats_models.BlogPostReadEventLogEntryModel(
            id='event_model_1',
            blog_post_id=self.BLOG_POST_ONE_ID
        )
        self.event_model_one.update_timestamps()
        self.event_model_one.put()

        self.event_model_two = (
            blog_stats_models.BlogPostReadEventLogEntryModel(
                id='event_model_2',
                blog_post_id=self.BLOG_POST_ONE_ID
            )
        )
        self.event_model_two.update_timestamps()
        self.event_model_two.put()

        self.event_model_three = (
            blog_stats_models.BlogPostReadEventLogEntryModel(
                id='event_model_3',
                blog_post_id=self.BLOG_POST_ONE_ID
            )
        )
        self.event_model_three.update_timestamps()
        self.event_model_three.put()

        self.event_model_four = (
            blog_stats_models.BlogPostReadEventLogEntryModel(
                id='event_model_4',
                blog_post_id=self.BLOG_POST_TWO_ID
            )
        )
        self.event_model_four.update_timestamps()
        self.event_model_four.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostReadEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_create_and_get_event_models(self) -> None:
        entity_id = (
            blog_stats_models.BlogPostReadEventLogEntryModel.create(
                self.BLOG_POST_TWO_ID
            )
        )
        event_model = blog_stats_models.BlogPostReadEventLogEntryModel.get(
            entity_id)

        self.assertEqual(event_model.blog_post_id, self.BLOG_POST_TWO_ID)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostReadEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'blog_post_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.BlogPostReadEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class BlogPostExitedEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the BlogPostExitedEventLogEntryModel class."""

    USER_ONE_ID: Final = 'user_1'
    USER_TWO_ID: Final = 'user_2'
    NONEXISTENT_USER_ID: Final = 'user_id_x'

    BLOG_POST_ONE_ID: Final = 'blog_post_one'
    BLOG_POST_TWO_ID: Final = 'blog_post_two'

    def setUp(self) -> None:
        """Set up blog post exited event log entry models in datastore for use
        in testing.
        """
        super().setUp()

        self.event_model_one = (
            blog_stats_models.BlogPostExitedEventLogEntryModel(
                id='event_model_1',
                blog_post_id=self.BLOG_POST_ONE_ID,
                time_user_stayed_on_blog_post=10.05
            )
        )
        self.event_model_one.update_timestamps()
        self.event_model_one.put()

        self.event_model_two = (
            blog_stats_models.BlogPostExitedEventLogEntryModel(
                id='event_model_2',
                blog_post_id=self.BLOG_POST_ONE_ID,
                time_user_stayed_on_blog_post=9.05
            )
        )
        self.event_model_two.update_timestamps()
        self.event_model_two.put()

        self.event_model_three = (
            blog_stats_models.BlogPostExitedEventLogEntryModel(
                id='event_model_3',
                blog_post_id=self.BLOG_POST_ONE_ID,
                time_user_stayed_on_blog_post=6.5
            )
        )
        self.event_model_three.update_timestamps()
        self.event_model_three.put()

        self.event_model_four = (
            blog_stats_models.BlogPostExitedEventLogEntryModel(
                id='event_model_4',
                blog_post_id=self.BLOG_POST_TWO_ID,
                time_user_stayed_on_blog_post=8
            )
        )
        self.event_model_four.update_timestamps()
        self.event_model_four.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostExitedEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_create_and_get_event_models(self) -> None:
        entity_id = (
            blog_stats_models.BlogPostExitedEventLogEntryModel.create(
                self.BLOG_POST_TWO_ID, 0.5
            )
        )
        event_model = blog_stats_models.BlogPostExitedEventLogEntryModel.get(
            entity_id)

        self.assertEqual(event_model.blog_post_id, self.BLOG_POST_TWO_ID)
        self.assertEqual(event_model.time_user_stayed_on_blog_post, 0.5)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostExitedEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'blog_post_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_user_stayed_on_blog_post': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.BlogPostExitedEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class BlogPostViewsAggregatedStatsModelUnitTests(test_utils.GenericTestBase):
    """Test the BlogPostViewsAggregatedStatsModel class."""

    BLOG_POST_ONE_ID: Final = 'blog_post_one'
    BLOG_POST_TWO_ID: Final = 'blog_post_two'

    def setUp(self) -> None:
        """Set up blog post exited event log entry models in datastore for use
        in testing.
        """
        super().setUp()

        self.model_one = (
            blog_stats_models.BlogPostViewsAggregatedStatsModel(
                id=self.BLOG_POST_ONE_ID,
                views_by_hour={},
                views_by_date={},
                views_by_month={}
            )
        )
        self.model_one.update_timestamps()
        self.model_one.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostViewsAggregatedStatsModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE
        )

    def test_create_and_get_stats_models(self) -> None:
        blog_stats_models.BlogPostViewsAggregatedStatsModel.create(
            self.BLOG_POST_TWO_ID
        )
        stats_model = blog_stats_models.BlogPostViewsAggregatedStatsModel.get(
            self.BLOG_POST_TWO_ID)

        self.assertEqual(stats_model.id, self.BLOG_POST_TWO_ID)

        # Test should raise exception if model with given blog post id already
        # exists.
        with self.assertRaisesRegex(
            Exception,
            'A blog post views stats model with the given blog post ID'
            'exists already.'):
            blog_stats_models.BlogPostViewsAggregatedStatsModel.create(
                 self.BLOG_POST_TWO_ID
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostViewsAggregatedStatsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'views_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.BlogPostViewsAggregatedStatsModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class BlogPostReadsAggregatedStatsModelUnitTests(test_utils.GenericTestBase):
    """Test the BlogPostReadsAggregatedStatsModel class."""

    BLOG_POST_ONE_ID: Final = 'blog_post_one'
    BLOG_POST_TWO_ID: Final = 'blog_post_two'

    def setUp(self) -> None:
        """Set up blog post reads aggregated stats models in datastore for use
        in testing.
        """
        super().setUp()

        self.model_one = (
            blog_stats_models.BlogPostReadsAggregatedStatsModel(
                id=self.BLOG_POST_ONE_ID,
                reads_by_hour={},
                reads_by_date={},
                reads_by_month={}
            )
        )
        self.model_one.update_timestamps()
        self.model_one.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostReadsAggregatedStatsModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE
        )

    def test_create_and_get_stats_models(self) -> None:
        blog_stats_models.BlogPostReadsAggregatedStatsModel.create(
            self.BLOG_POST_TWO_ID
        )
        stats_model = blog_stats_models.BlogPostReadsAggregatedStatsModel.get(
            self.BLOG_POST_TWO_ID)

        self.assertEqual(stats_model.id, self.BLOG_POST_TWO_ID)

        # Test should raise exception if model with given blog post id already
        # exists.
        with self.assertRaisesRegex(
            Exception,
            'A blog post reads stats model with the given blog post ID'
            'exists already.'):
            blog_stats_models.BlogPostReadsAggregatedStatsModel.create(
                self.BLOG_POST_TWO_ID
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostReadsAggregatedStatsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'reads_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.BlogPostReadsAggregatedStatsModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class BlogPostReadingTimeModelUnitTests(test_utils.GenericTestBase):
    """Test the BlogPostReadingTimeModel class."""

    BLOG_POST_ONE_ID: Final = 'blog_post_one'
    BLOG_POST_TWO_ID: Final = 'blog_post_two'

    def setUp(self) -> None:
        """Set up blog post reading time model in datastore for use
        in testing.
        """
        super().setUp()

        self.model_one = (
            blog_stats_models.BlogPostReadingTimeModel(
                id=self.BLOG_POST_ONE_ID,
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
                more_than_ten_min=0,
            )
        )
        self.model_one.update_timestamps()
        self.model_one.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostReadingTimeModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE
        )

    def test_create_and_get_stats_models(self) -> None:
        blog_stats_models.BlogPostReadingTimeModel.create(
            self.BLOG_POST_TWO_ID
        )
        stats_model = blog_stats_models.BlogPostReadingTimeModel.get(
            self.BLOG_POST_TWO_ID)

        self.assertEqual(stats_model.id, self.BLOG_POST_TWO_ID)

        # Test should raise exception if model with given blog post id already
        # exists.
        with self.assertRaisesRegex(
            Exception,
            'A blog post reading time model with the given blog post ID'
            'exists already.'):
            blog_stats_models.BlogPostReadingTimeModel.create(
                self.BLOG_POST_TWO_ID
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.BlogPostReadingTimeModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
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
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.BlogPostReadingTimeModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class AuthorBlogPostReadsAggregatedStatsModelUnitTests(
    test_utils.GenericTestBase
):
    """Test the BlogPostReadsAggregatedStatsModel class."""

    AUTHOR_ONE_ID: Final = 'author_one'
    AUTHOR_TWO_ID: Final = 'author_two'
    NONEXISTENT_USER_ID: Final = 'no_user'

    def setUp(self) -> None:
        """Set up author blog post reads aggregated stats models in datastore
        for use in testing.
        """
        super().setUp()

        self.model_one = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel(
                id=self.AUTHOR_ONE_ID,
                reads_by_hour={},
                reads_by_date={},
                reads_by_month={}
            )
        )
        self.model_one.update_timestamps()
        self.model_one.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE
        )

    def test_create_and_get_stats_models(self) -> None:
        blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.create(
            self.AUTHOR_TWO_ID
        )
        stats_model = (
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel.get(
                self.AUTHOR_TWO_ID
            )
        )

        self.assertEqual(stats_model.id, self.AUTHOR_TWO_ID)

        # Test should raise exception if model with given author id already
        # exists.
        with self.assertRaisesRegex(
            Exception,
            'A author blog post reads stats model with the given author ID'
            ' exists already.'):
            (
                blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
                    .create(self.AUTHOR_TWO_ID)
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'reads_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'reads_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
                .get_export_policy(),
            expected_export_policy_dict
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
                .has_reference_to_user_id(self.AUTHOR_ONE_ID))
        self.assertFalse(
            blog_stats_models.AuthorBlogPostReadsAggregatedStatsModel
                .has_reference_to_user_id(self.NONEXISTENT_USER_ID))


class AuthorBlogPostViewsAggregatedStatsModelUnitTests(
    test_utils.GenericTestBase
):
    """Test the BlogPostViewsAggregatedStatsModel class."""

    AUTHOR_ONE_ID: Final = 'author_one'
    AUTHOR_TWO_ID: Final = 'author_two'
    NONEXISTENT_USER_ID: Final = 'no_user'

    def setUp(self) -> None:
        """Set up author blog post views aggregated stats models in datastore
        for use in testing.
        """
        super().setUp()

        self.model_one = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel(
                id=self.AUTHOR_ONE_ID,
                views_by_hour={},
                views_by_date={},
                views_by_month={}
            )
        )
        self.model_one.update_timestamps()
        self.model_one.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE
        )

    def test_create_and_get_stats_models(self) -> None:
        blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.create(
            self.AUTHOR_TWO_ID
        )
        stats_model = (
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.get(
                self.AUTHOR_TWO_ID
            )
        )

        self.assertEqual(stats_model.id, self.AUTHOR_TWO_ID)

        # Test should raise exception if model with given author id already
        # exists.
        with self.assertRaisesRegex(
            Exception,
            'A author blog post views stats model with the given author ID'
            ' exists already.'):
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel.create(
                self.AUTHOR_TWO_ID
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'views_by_hour': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_date': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'views_by_month': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel
                .get_export_policy(),
            expected_export_policy_dict
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel
                .has_reference_to_user_id(self.AUTHOR_ONE_ID))
        self.assertFalse(
            blog_stats_models.AuthorBlogPostViewsAggregatedStatsModel
                .has_reference_to_user_id(self.NONEXISTENT_USER_ID))


class AuthorBlogPostsReadingTimeModelUnitTests(test_utils.GenericTestBase):
    """Test the AuthorBlogPostAggregatedReadingTimeModel class."""

    AUTHOR_ONE_ID: Final = 'author_one'
    AUTHOR_TWO_ID: Final = 'author_two'
    NONEXISTENT_USER_ID: Final = 'no_user'

    def setUp(self) -> None:
        """Set up blog post reading time model in datastore for use
        in testing.
        """
        super().setUp()

        self.model_one = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel(
                id=self.AUTHOR_ONE_ID,
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
                more_than_ten_min=0,
            )
        )
        self.model_one.update_timestamps()
        self.model_one.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE
        )

    def test_create_and_get_stats_models(self) -> None:
        blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.create(
            self.AUTHOR_TWO_ID
        )
        stats_model = (
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.get(
                self.AUTHOR_TWO_ID
            )
        )

        self.assertEqual(stats_model.id, self.AUTHOR_TWO_ID)

        # Test should raise exception if model with given author id already
        # exists.
        with self.assertRaisesRegex(
            Exception,
            'A author blog post reading time model with the given author ID'
            ' exists already.'):
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel.create(
                self.AUTHOR_TWO_ID
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
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
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel
                .get_export_policy(),
            expected_export_policy_dict
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel
                .has_reference_to_user_id(self.AUTHOR_ONE_ID))
        self.assertFalse(
            blog_stats_models.AuthorBlogPostAggregatedReadingTimeModel
                .has_reference_to_user_id(self.NONEXISTENT_USER_ID))
