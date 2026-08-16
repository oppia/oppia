# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.blog_author_details_migration_jobs."""

from __future__ import annotations

import datetime

from core.jobs import job_test_utils
from core.jobs.batch_jobs import blog_author_details_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import blog_models, user_models

(blog_models, user_models) = models.Registry.import_models(
    [models.Names.BLOG, models.Names.USER]
)


class AuditBlogAuthorDetailsForDeletedUsersJobTests(job_test_utils.JobTestBase):
    """Tests for AuditBlogAuthorDetailsForDeletedUsersJob."""

    JOB_CLASS: Type[
        blog_author_details_migration_jobs.AuditBlogAuthorDetailsForDeletedUsersJob
    ] = (
        blog_author_details_migration_jobs.AuditBlogAuthorDetailsForDeletedUsersJob
    )

    # Active user with a UserSettingsModel.
    AUTHOR_ID_1: Final = 'uid_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    # Deleted user (pseudonymized, no UserSettingsModel).
    AUTHOR_ID_2: Final = 'pid_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    # Another deleted user (no UserSettingsModel).
    AUTHOR_ID_3: Final = 'uid_cccccccccccccccccccccccccccccccccc'

    def test_empty_storage_produces_no_output(self) -> None:
        """Tests that the job produces no output when the datastore is
        empty.
        """
        self.assert_job_output_is_empty()

    def test_no_orphaned_authors_produces_count_only(self) -> None:
        """Tests that the job reports only the total count when every
        published blog post has a matching BlogAuthorDetailsModel.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost1aaa',
            author_id=self.AUTHOR_ID_1,
            title='Test Blog Post',
            summary='A test blog post summary.',
            url_fragment='test-blog-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        author_details = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='authordetail1',
            author_id=self.AUTHOR_ID_1,
            displayed_author_name='Test Author',
            author_bio='A test author bio.',
        )
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.AUTHOR_ID_1,
            email='author1@example.com',
        )
        self.put_multi([blog_post_summary, author_details, user_settings])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TOTAL BLOG POST AUTHOR IDS COUNT SUCCESS: 1'
                ),
            ]
        )

    def test_deleted_user_without_author_details_is_reported(self) -> None:
        """Tests that the job correctly identifies and reports an
        author_id whose user has been deleted (no UserSettingsModel)
        and has no BlogAuthorDetailsModel.
        """
        # Published blog post by a deleted user (no UserSettingsModel).
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost2aaa',
            author_id=self.AUTHOR_ID_2,
            title='Deleted Author Post',
            summary='Post by a deleted author.',
            url_fragment='deleted-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        self.put_multi([blog_post_summary])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'ORPHANED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ORPHANED AUTHOR IDS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TOTAL BLOG POST AUTHOR IDS COUNT SUCCESS: 1'
                ),
            ]
        )

    def test_active_user_without_author_details_is_not_reported(
        self,
    ) -> None:
        """Tests that an active user (with UserSettingsModel) who lacks
        a BlogAuthorDetailsModel is NOT flagged as orphaned, because the
        runtime code will auto-create one using the user's real name.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost10aa',
            author_id=self.AUTHOR_ID_1,
            title='Active Author Post',
            summary='Post by an active author without details model.',
            url_fragment='active-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        # The user still exists, just lacks a BlogAuthorDetailsModel.
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.AUTHOR_ID_1,
            email='author1@example.com',
        )
        self.put_multi([blog_post_summary, user_settings])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'TOTAL BLOG POST AUTHOR IDS COUNT SUCCESS: 1'
                ),
            ]
        )

    def test_draft_blog_posts_are_excluded(self) -> None:
        """Tests that draft blog posts (published_on is None) are not
        included in the orphan detection.
        """
        # Draft blog post by a deleted user — should not be flagged.
        draft_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost3aaa',
            author_id=self.AUTHOR_ID_2,
            title='Draft Post',
            summary='A draft post.',
            url_fragment='draft-post',
            tags=['draft'],
            thumbnail_filename='thumbnail.svg',
            published_on=None,
        )
        self.put_multi([draft_summary])

        self.assert_job_output_is_empty()

    def test_mixed_deleted_active_and_valid_authors(self) -> None:
        """Tests that the job correctly differentiates between:
        - a deleted user with no BlogAuthorDetailsModel (orphaned),
        - an active user with a BlogAuthorDetailsModel (not orphaned),
        - an active user without a BlogAuthorDetailsModel (not orphaned,
          runtime handles it).
        """
        # Active user with BlogAuthorDetailsModel.
        blog_post_summary_1 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost4aaa',
            author_id=self.AUTHOR_ID_1,
            title='Valid Author Post',
            summary='Post by an existing author.',
            url_fragment='valid-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        author_details_1 = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='authordetail2',
            author_id=self.AUTHOR_ID_1,
            displayed_author_name='Valid Author',
            author_bio='A valid author bio.',
        )
        user_settings_1 = self.create_model(
            user_models.UserSettingsModel,
            id=self.AUTHOR_ID_1,
            email='author1@example.com',
        )
        # Deleted user without BlogAuthorDetailsModel.
        blog_post_summary_2 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost5aaa',
            author_id=self.AUTHOR_ID_2,
            title='Orphaned Author Post',
            summary='Post by a deleted author.',
            url_fragment='orphaned-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 2, 1),
        )
        self.put_multi(
            [
                blog_post_summary_1,
                blog_post_summary_2,
                author_details_1,
                user_settings_1,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'ORPHANED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ORPHANED AUTHOR IDS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TOTAL BLOG POST AUTHOR IDS COUNT SUCCESS: 2'
                ),
            ]
        )

    def test_multiple_posts_by_same_orphaned_author_counted_once(
        self,
    ) -> None:
        """Tests that multiple published blog posts by the same deleted
        author_id are deduplicated and reported as a single orphan.
        """
        blog_post_summary_1 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost6aaa',
            author_id=self.AUTHOR_ID_2,
            title='Orphan Post One',
            summary='First post by deleted author.',
            url_fragment='orphan-post-one',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        blog_post_summary_2 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost7aaa',
            author_id=self.AUTHOR_ID_2,
            title='Orphan Post Two',
            summary='Second post by deleted author.',
            url_fragment='orphan-post-two',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 2, 1),
        )
        self.put_multi([blog_post_summary_1, blog_post_summary_2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'ORPHANED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'ORPHANED AUTHOR IDS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'TOTAL BLOG POST AUTHOR IDS COUNT SUCCESS: 1'
                ),
            ]
        )


class MigrateBlogAuthorDetailsForDeletedUsersJobTests(
    job_test_utils.JobTestBase
):
    """Tests for MigrateBlogAuthorDetailsForDeletedUsersJob."""

    JOB_CLASS: Type[
        blog_author_details_migration_jobs.MigrateBlogAuthorDetailsForDeletedUsersJob
    ] = (
        blog_author_details_migration_jobs.MigrateBlogAuthorDetailsForDeletedUsersJob
    )

    # Active user with a UserSettingsModel.
    AUTHOR_ID_1: Final = 'uid_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    # Deleted user (pseudonymized, no UserSettingsModel).
    AUTHOR_ID_2: Final = 'pid_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    # Another deleted user (no UserSettingsModel).
    AUTHOR_ID_3: Final = 'uid_cccccccccccccccccccccccccccccccccc'

    def test_empty_storage_produces_no_output(self) -> None:
        """Tests that the job produces no output when the datastore is
        empty.
        """
        self.assert_job_output_is_empty()

    def test_no_orphaned_authors_produces_no_migration(self) -> None:
        """Tests that no migration occurs when all published blog posts
        have matching BlogAuthorDetailsModels.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost1aaa',
            author_id=self.AUTHOR_ID_1,
            title='Test Blog Post',
            summary='A test blog post summary.',
            url_fragment='test-blog-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        author_details = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='authordetail1',
            author_id=self.AUTHOR_ID_1,
            displayed_author_name='Test Author',
            author_bio='A test author bio.',
        )
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.AUTHOR_ID_1,
            email='author1@example.com',
        )
        self.put_multi([blog_post_summary, author_details, user_settings])

        self.assert_job_output_is_empty()

    def test_deleted_user_gets_migrated(self) -> None:
        """Tests that a BlogAuthorDetailsModel is created for a deleted
        user's author_id with the correct fallback display name.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost2aaa',
            author_id=self.AUTHOR_ID_2,
            title='Deleted Author Post',
            summary='Post by a deleted author.',
            url_fragment='deleted-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        self.put_multi([blog_post_summary])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'MIGRATED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED AUTHOR DETAILS COUNT SUCCESS: 1'
                ),
            ]
        )

        created_model = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.AUTHOR_ID_2
        )
        self.assertIsNotNone(created_model)
        assert created_model is not None
        self.assertEqual(
            created_model.displayed_author_name,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_NAME,
        )
        self.assertEqual(
            created_model.author_bio,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_BIO,
        )

    def test_active_user_without_author_details_is_not_migrated(
        self,
    ) -> None:
        """Tests that an active user (with UserSettingsModel) who lacks
        a BlogAuthorDetailsModel is NOT migrated, because the runtime
        code will auto-create the model using the user's real name.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost11aa',
            author_id=self.AUTHOR_ID_1,
            title='Active Author Post',
            summary='Post by an active author.',
            url_fragment='active-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        # User exists but has no BlogAuthorDetailsModel.
        user_settings = self.create_model(
            user_models.UserSettingsModel,
            id=self.AUTHOR_ID_1,
            email='author1@example.com',
        )
        self.put_multi([blog_post_summary, user_settings])

        self.assert_job_output_is_empty()

    def test_migration_creates_model_with_correct_fallback_values(
        self,
    ) -> None:
        """Tests that the created BlogAuthorDetailsModel has the
        expected fallback display name and bio.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost3aaa',
            author_id=self.AUTHOR_ID_2,
            title='Deleted Author Post',
            summary='Post by a deleted author.',
            url_fragment='deleted-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        self.put_multi([blog_post_summary])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'MIGRATED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED AUTHOR DETAILS COUNT SUCCESS: 1'
                ),
            ]
        )

        # Verify that the model was persisted with correct values.
        created_model = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.AUTHOR_ID_2
        )
        self.assertIsNotNone(created_model)
        assert created_model is not None
        self.assertEqual(
            created_model.displayed_author_name,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_NAME,
        )
        self.assertEqual(
            created_model.author_bio,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_BIO,
        )

    def test_mixed_deleted_and_active_authors_only_migrates_deleted(
        self,
    ) -> None:
        """Tests that only deleted users are migrated, while active
        users with or without BlogAuthorDetailsModels are left
        unchanged.
        """
        # Active user with BlogAuthorDetailsModel.
        blog_post_summary_1 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost4aaa',
            author_id=self.AUTHOR_ID_1,
            title='Valid Author Post',
            summary='Post by an existing author.',
            url_fragment='valid-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        author_details_1 = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='authordetail2',
            author_id=self.AUTHOR_ID_1,
            displayed_author_name='Valid Author',
            author_bio='A valid author bio.',
        )
        user_settings_1 = self.create_model(
            user_models.UserSettingsModel,
            id=self.AUTHOR_ID_1,
            email='author1@example.com',
        )
        # Deleted user without BlogAuthorDetailsModel.
        blog_post_summary_2 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost5aaa',
            author_id=self.AUTHOR_ID_2,
            title='Orphaned Author Post',
            summary='Post by a deleted author.',
            url_fragment='orphaned-author-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 2, 1),
        )
        self.put_multi(
            [
                blog_post_summary_1,
                blog_post_summary_2,
                author_details_1,
                user_settings_1,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'MIGRATED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED AUTHOR DETAILS COUNT SUCCESS: 1'
                ),
            ]
        )

        migrated_model = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.AUTHOR_ID_2
        )
        self.assertIsNotNone(migrated_model)
        assert migrated_model is not None
        self.assertEqual(
            migrated_model.displayed_author_name,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_NAME,
        )
        self.assertEqual(
            migrated_model.author_bio,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_BIO,
        )

        existing_model = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.AUTHOR_ID_1
        )
        self.assertIsNotNone(existing_model)
        assert existing_model is not None
        self.assertEqual(existing_model.displayed_author_name, 'Valid Author')
        self.assertEqual(existing_model.author_bio, 'A valid author bio.')

    def test_multiple_deleted_authors_are_all_migrated(self) -> None:
        """Tests that all deleted author_ids get migrated when multiple
        deleted users have published blog posts.
        """
        blog_post_summary_1 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost6aaa',
            author_id=self.AUTHOR_ID_2,
            title='Deleted Author Post One',
            summary='First deleted author post.',
            url_fragment='deleted-author-post-one',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        blog_post_summary_2 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost7aaa',
            author_id=self.AUTHOR_ID_3,
            title='Deleted Author Post Two',
            summary='Second deleted author post.',
            url_fragment='deleted-author-post-two',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 2, 1),
        )
        self.put_multi([blog_post_summary_1, blog_post_summary_2])

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    f'MIGRATED AUTHOR ID: {self.AUTHOR_ID_2}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    f'MIGRATED AUTHOR ID: {self.AUTHOR_ID_3}'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'MIGRATED AUTHOR DETAILS COUNT SUCCESS: 2'
                ),
            ]
        )

        model_2 = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.AUTHOR_ID_2
        )
        self.assertIsNotNone(model_2)
        assert model_2 is not None
        self.assertEqual(
            model_2.displayed_author_name,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_NAME,
        )
        self.assertEqual(
            model_2.author_bio,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_BIO,
        )
        model_3 = blog_models.BlogAuthorDetailsModel.get_by_author(
            self.AUTHOR_ID_3
        )
        self.assertIsNotNone(model_3)
        assert model_3 is not None
        self.assertEqual(
            model_3.displayed_author_name,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_NAME,
        )
        self.assertEqual(
            model_3.author_bio,
            blog_author_details_migration_jobs.DELETED_USER_FALLBACK_AUTHOR_BIO,
        )

    def test_draft_blog_posts_are_excluded_from_migration(self) -> None:
        """Tests that draft blog posts (published_on is None) do not
        trigger migration of their author_ids.
        """
        draft_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost8aaa',
            author_id=self.AUTHOR_ID_2,
            title='Draft Post',
            summary='A draft post.',
            url_fragment='draft-post',
            tags=['draft'],
            thumbnail_filename='thumbnail.svg',
            published_on=None,
        )
        self.put_multi([draft_summary])

        self.assert_job_output_is_empty()

    def test_already_migrated_deleted_user_is_not_migrated_again(
        self,
    ) -> None:
        """Tests that a deleted user who already has a
        BlogAuthorDetailsModel (from a prior migration run) is NOT
        migrated again.
        """
        blog_post_summary = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='blogpost12aa',
            author_id=self.AUTHOR_ID_2,
            title='Previously Migrated Post',
            summary='Post whose author was already migrated.',
            url_fragment='already-migrated-post',
            tags=['test'],
            thumbnail_filename='thumbnail.svg',
            published_on=datetime.datetime(2025, 1, 1),
        )
        # BlogAuthorDetailsModel already exists from prior migration.
        author_details = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='authordetail3',
            author_id=self.AUTHOR_ID_2,
            displayed_author_name='Deleted User',
            author_bio='',
        )
        self.put_multi([blog_post_summary, author_details])

        self.assert_job_output_is_empty()
