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

"""Unit tests for blog_validation_jobs.py (issue #21869)."""

from __future__ import annotations

import datetime

from core.jobs import job_test_utils
from core.jobs.batch_jobs import blog_validation_jobs
from core.jobs.types import blog_validation_errors
from core.jobs.types import job_run_result
from core.platform import models

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])


# ---------------------------------------------------------------------------
# Shared test helpers
# ---------------------------------------------------------------------------

CREATED_ON: Final = datetime.datetime(2021, 1, 1, 0, 0, 0)
LAST_UPDATED: Final = datetime.datetime(2021, 6, 1, 0, 0, 0)


# ---------------------------------------------------------------------------
# Tests for ValidateBlogPostModelJob
# ---------------------------------------------------------------------------

class ValidateBlogPostModelJobTest(job_test_utils.JobTestBase):
    """Tests for ValidateBlogPostModelJob."""

    JOB_CLASS = blog_validation_jobs.ValidateBlogPostModelJob

    def _create_valid_blog_post(self, model_id: str = 'valid-blog-id'):
        """Creates and stores a valid BlogPostModel."""
        model = blog_models.BlogPostModel(
            id=model_id,
            title='Test Blog Post',
            content='Hello world.',
            author_id='user_1',
            url_fragment='test-blog-post',
            created_on=CREATED_ON,
            last_updated=LAST_UPDATED,
            deleted=False,
        )
        model.put()
        return model

    def test_empty_datastore_produces_no_output(self):
        self.assert_job_output_is_empty()

    def test_valid_model_produces_no_errors(self):
        self._create_valid_blog_post()
        self.assert_job_output_is_empty()

    def test_multiple_valid_models_produce_no_errors(self):
        self._create_valid_blog_post('id-1')
        self._create_valid_blog_post('id-2')
        self.assert_job_output_is_empty()

    def test_model_with_last_updated_before_created_on_raises_error(self):
        model = blog_models.BlogPostModel(
            id='bad-blog-id',
            title='Bad Blog Post',
            content='Content.',
            author_id='user_1',
            url_fragment='bad-blog-post',
            created_on=LAST_UPDATED,       # later datetime as created_on
            last_updated=CREATED_ON,       # earlier datetime as last_updated
            deleted=False,
        )
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogPostModel with id 'bad-blog-id' has last_updated (%r) "
                'earlier than created_on (%r).' % (CREATED_ON, LAST_UPDATED)
            )
        ])

    def test_model_with_non_bool_deleted_raises_error(self):
        model = self._create_valid_blog_post('non-bool-deleted-id')
        # Force an invalid deleted value bypassing normal setters.
        model._values['deleted'] = 'yes'  # pylint: disable=protected-access
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogPostModel with id 'non-bool-deleted-id' has a "
                "non-boolean deleted field: 'yes'"
            )
        ])

    def test_model_with_invalid_created_on_raises_error(self):
        model = self._create_valid_blog_post('bad-created-on-id')
        model._values['created_on'] = 'not-a-date'  # pylint: disable=protected-access
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogPostModel with id 'bad-created-on-id' has an invalid "
                "created_on value: 'not-a-date'"
            )
        ])


# ---------------------------------------------------------------------------
# Tests for ValidateBlogPostSummaryModelJob
# ---------------------------------------------------------------------------

class ValidateBlogPostSummaryModelJobTest(job_test_utils.JobTestBase):
    """Tests for ValidateBlogPostSummaryModelJob."""

    JOB_CLASS = blog_validation_jobs.ValidateBlogPostSummaryModelJob

    def _create_valid_summary(self, model_id: str = 'valid-summary-id'):
        """Creates and stores a valid BlogPostSummaryModel."""
        model = blog_models.BlogPostSummaryModel(
            id=model_id,
            title='Summary Title',
            summary='Short summary.',
            author_id='user_1',
            url_fragment='summary-title',
            created_on=CREATED_ON,
            last_updated=LAST_UPDATED,
            deleted=False,
        )
        model.put()
        return model

    def test_empty_datastore_produces_no_output(self):
        self.assert_job_output_is_empty()

    def test_valid_model_produces_no_errors(self):
        self._create_valid_summary()
        self.assert_job_output_is_empty()

    def test_model_with_last_updated_before_created_on_raises_error(self):
        model = blog_models.BlogPostSummaryModel(
            id='bad-summary-id',
            title='Bad Summary',
            summary='Bad.',
            author_id='user_1',
            url_fragment='bad-summary',
            created_on=LAST_UPDATED,
            last_updated=CREATED_ON,
            deleted=False,
        )
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogPostSummaryModel with id 'bad-summary-id' has "
                'last_updated (%r) earlier than created_on (%r).'
                % (CREATED_ON, LAST_UPDATED)
            )
        ])

    def test_model_with_non_bool_deleted_raises_error(self):
        model = self._create_valid_summary('bad-deleted-summary')
        model._values['deleted'] = 1  # pylint: disable=protected-access
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogPostSummaryModel with id 'bad-deleted-summary' has a "
                'non-boolean deleted field: 1'
            )
        ])


# ---------------------------------------------------------------------------
# Tests for ValidateBlogAuthorDetailsModelJob
# ---------------------------------------------------------------------------

class ValidateBlogAuthorDetailsModelJobTest(job_test_utils.JobTestBase):
    """Tests for ValidateBlogAuthorDetailsModelJob."""

    JOB_CLASS = blog_validation_jobs.ValidateBlogAuthorDetailsModelJob

    def _create_valid_author_details(
        self, model_id: str = 'valid-author-id'
    ):
        """Creates and stores a valid BlogAuthorDetailsModel."""
        model = blog_models.BlogAuthorDetailsModel(
            id=model_id,
            author_id='user_1',
            displayed_author_name='Test Author',
            author_bio='This is a bio.',
            created_on=CREATED_ON,
            last_updated=LAST_UPDATED,
            deleted=False,
        )
        model.put()
        return model

    def test_empty_datastore_produces_no_output(self):
        self.assert_job_output_is_empty()

    def test_valid_model_produces_no_errors(self):
        self._create_valid_author_details()
        self.assert_job_output_is_empty()

    def test_model_with_last_updated_before_created_on_raises_error(self):
        model = blog_models.BlogAuthorDetailsModel(
            id='bad-author-id',
            author_id='user_1',
            displayed_author_name='Bad Author',
            author_bio='Bio.',
            created_on=LAST_UPDATED,
            last_updated=CREATED_ON,
            deleted=False,
        )
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogAuthorDetailsModel with id 'bad-author-id' has "
                'last_updated (%r) earlier than created_on (%r).'
                % (CREATED_ON, LAST_UPDATED)
            )
        ])

    def test_model_with_invalid_last_updated_raises_error(self):
        model = self._create_valid_author_details('bad-last-updated')
        model._values['last_updated'] = 'not-a-date'  # pylint: disable=protected-access
        model.put()
        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stderr(
                "BlogAuthorDetailsModel with id 'bad-last-updated' has an "
                "invalid last_updated value: 'not-a-date'"
            )
        ])


# ---------------------------------------------------------------------------
# Existing duplicate-check job tests (unchanged)
# ---------------------------------------------------------------------------

class FindDuplicateBlogPostTitlesJobTest(job_test_utils.JobTestBase):
    """Tests for FindDuplicateBlogPostTitlesJob."""

    JOB_CLASS = blog_validation_jobs.FindDuplicateBlogPostTitlesJob

    def test_no_models_produces_no_output(self):
        self.assert_job_output_is_empty()

    def test_unique_titles_produce_no_errors(self):
        blog_models.BlogPostModel(
            id='post-1', title='Title A', url_fragment='url-a',
            author_id='user_1', content='', created_on=CREATED_ON,
            last_updated=LAST_UPDATED, deleted=False,
        ).put()
        blog_models.BlogPostModel(
            id='post-2', title='Title B', url_fragment='url-b',
            author_id='user_2', content='', created_on=CREATED_ON,
            last_updated=LAST_UPDATED, deleted=False,
        ).put()
        self.assert_job_output_is_empty()

    def test_duplicate_titles_raise_errors(self):
        blog_models.BlogPostModel(
            id='post-1', title='Same Title', url_fragment='url-1',
            author_id='user_1', content='', created_on=CREATED_ON,
            last_updated=LAST_UPDATED, deleted=False,
        ).put()
        blog_models.BlogPostModel(
            id='post-2', title='Same Title', url_fragment='url-2',
            author_id='user_2', content='', created_on=CREATED_ON,
            last_updated=LAST_UPDATED, deleted=False,
        ).put()
        self.assert_job_output_is([
            blog_validation_errors.DuplicateBlogTitleError(
                blog_models.BlogPostModel.get_by_id('post-1')
            ),
            blog_validation_errors.DuplicateBlogTitleError(
                blog_models.BlogPostModel.get_by_id('post-2')
            ),
        ])