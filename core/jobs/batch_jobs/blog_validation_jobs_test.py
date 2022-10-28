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

"""Unit tests for jobs.blog_validation_jobs."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.batch_jobs import blog_validation_jobs
from core.jobs.types import blog_validation_errors
from core.platform import models

from typing import Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])


class FindDuplicateBlogPostTitlesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        blog_validation_jobs.FindDuplicateBlogPostTitlesJob
    ] = blog_validation_jobs.FindDuplicateBlogPostTitlesJob

    def test_run_with_same_titles_for_blog_posts(self) -> None:
        blog_post_model_1 = self.create_model(
            blog_models.BlogPostModel,
            id='validblogid1',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1')
        blog_post_model_2 = self.create_model(
            blog_models.BlogPostModel,
            id='validblogid2',
            title='Sample Title',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')
        blog_post_model_3 = self.create_model(
            blog_models.BlogPostModel,
            id='validblogid3',
            title='Sample Diff Title',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')

        self.put_multi(
            [
                blog_post_model_1,
                blog_post_model_2,
                blog_post_model_3,
            ]
        )

        self.assert_job_output_is(
            [
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_model_1
                ),
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_model_2
                ),
            ]
        )


class FindDuplicateBlogPostSummaryTitlesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        blog_validation_jobs.FindDuplicateBlogPostSummaryTitlesJob
    ] = blog_validation_jobs.FindDuplicateBlogPostSummaryTitlesJob

    def test_run_with_same_titles_for_blog_posts(self) -> None:
        blog_post_summary_model_1 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='validblogid1',
            title='Sample Title',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1')
        blog_post_summary_model_2 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='validblogid2',
            title='Sample Title',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')
        blog_post_summary_model_3 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='validblogid3',
            title='Sample Diff Title',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')

        self.put_multi(
            [
                blog_post_summary_model_1,
                blog_post_summary_model_2,
                blog_post_summary_model_3,
            ])

        self.assert_job_output_is(
            [
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_summary_model_1
                ),
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_summary_model_2
                ),
            ])


class FindDuplicateBlogPostUrlsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        blog_validation_jobs.FindDuplicateBlogPostUrlsJob
    ] = blog_validation_jobs.FindDuplicateBlogPostUrlsJob

    def test_run_with_same_url_for_blog_posts(self) -> None:
        blog_post_model_1 = self.create_model(
            blog_models.BlogPostModel,
            id='validblogid1',
            title='Sample Title 1',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_model_2 = self.create_model(
            blog_models.BlogPostModel,
            id='validblogid2',
            title='Sample Title 2',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_model_3 = self.create_model(
            blog_models.BlogPostModel,
            id='validblogid3',
            title='Sample Diff Title',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='diff_url_fragment')

        self.put_multi(
            [
                blog_post_model_1,
                blog_post_model_2,
                blog_post_model_3,
            ])

        self.assert_job_output_is(
            [
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_model_1
                ),
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_model_2
                ),
            ])


class FindDuplicateBlogPostSummaryUrlsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        blog_validation_jobs.FindDuplicateBlogPostSummaryUrlsJob
    ] = blog_validation_jobs.FindDuplicateBlogPostSummaryUrlsJob

    def test_run_with_same_url_for_blog_posts(self) -> None:
        blog_post_summary_model_1 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='validblogid1',
            title='Sample Title 1',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_summary_model_2 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='validblogid2',
            title='Sample Title 2',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_summary_model_3 = self.create_model(
            blog_models.BlogPostSummaryModel,
            id='validblogid3',
            title='Sample Diff Title',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='diff_url_fragment')

        self.put_multi(
            [
                blog_post_summary_model_1,
                blog_post_summary_model_2,
                blog_post_summary_model_3,
            ]
        )

        self.assert_job_output_is(
            [
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_summary_model_1
                ),
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_summary_model_2
                ),
            ])


class FindDuplicateBlogAuthorDetailsModelForAuthorJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS: Type[
        blog_validation_jobs.FindDuplicateBlogAuthorDetailsModelForAuthorJob
    ] = blog_validation_jobs.FindDuplicateBlogAuthorDetailsModelForAuthorJob

    def test_run_with_same_author_id_for_blog_posts(self) -> None:
        author_details_model_1 = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='validblogid1',
            displayed_author_name='user one',
            author_id='user',
            author_bio='')
        author_details_model_2 = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='validblogid2',
            displayed_author_name='user two',
            author_id='user',
            author_bio='author general bio')
        author_details_model_3 = self.create_model(
            blog_models.BlogAuthorDetailsModel,
            id='validblogid3',
            displayed_author_name='user name',
            author_id='diffUserId',
            author_bio='some author bio')

        self.put_multi(
            [
                author_details_model_1,
                author_details_model_2,
                author_details_model_3,
            ]
        )

        self.assert_job_output_is(
            [
                blog_validation_errors.DuplicateBlogAuthorModelError(
                    author_details_model_1
                ),
                blog_validation_errors.DuplicateBlogAuthorModelError(
                    author_details_model_2
                ),
            ])
