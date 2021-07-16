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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import blog_validation_errors
from jobs import blog_validation_jobs
from jobs import job_test_utils

(blog_models, user_models) = models.Registry.import_models( # type: ignore[no-untyped-call]
    [models.NAMES.blog, models.NAMES.user])


class BlogPostTitleUniquenessJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = blog_validation_jobs.BlogPostTitleUniquenessJob

    def test_run_with_same_titles_for_blog_posts(self):
        # type: () -> None
        blog_post_model_1 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostModel,
            id='validblogid1',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1')
        blog_post_model_2 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostModel,
            id='validblogid2',
            title='Sample Title',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')
        blog_post_model_3 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostModel,
            id='validblogid3',
            title='Sample Diff Title',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')

        self.put_multi( # type: ignore[no-untyped-call]
            [
                blog_post_model_1,
                blog_post_model_2,
                blog_post_model_3,
            ]
        )

        self.assert_job_output_is( # type: ignore[no-untyped-call]
            [
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_model_1
                ),
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_model_2
                ),
            ]
        )


class BlogPostSummaryTitleUniquenessJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = blog_validation_jobs.BlogPostSummaryTitleUniquenessJob

    def test_run_with_same_titles_for_blog_posts(self):
        # type: () -> None
        blog_post_summary_model_1 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostSummaryModel,
            id='validblogid1',
            title='Sample Title',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1')
        blog_post_summary_model_2 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostSummaryModel,
            id='validblogid2',
            title='Sample Title',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')
        blog_post_summary_model_3 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostSummaryModel,
            id='validblogid3',
            title='Sample Diff Title',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment_2')

        self.put_multi( # type: ignore[no-untyped-call]
            [
                blog_post_summary_model_1,
                blog_post_summary_model_2,
                blog_post_summary_model_3,
            ])

        self.assert_job_output_is( # type: ignore[no-untyped-call]
            [
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_summary_model_1
                ),
                blog_validation_errors.DuplicateBlogTitleError(
                    blog_post_summary_model_2
                ),
            ])


class BlogPostUrlUniquenessJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = blog_validation_jobs.BlogPostUrlUniquenessJob

    def test_run_with_same_url_for_blog_posts(self):
        # type: () -> None
        blog_post_model_1 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostModel,
            id='validblogid1',
            title='Sample Title 1',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_model_2 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostModel,
            id='validblogid2',
            title='Sample Title 2',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_model_3 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostModel,
            id='validblogid3',
            title='Sample Diff Title',
            content='<p>hello tho</p>,',
            author_id='user',
            url_fragment='diff_url_fragment')

        self.put_multi( # type: ignore[no-untyped-call]
            [
                blog_post_model_1,
                blog_post_model_2,
                blog_post_model_3,
            ])

        self.assert_job_output_is( # type: ignore[no-untyped-call]
            [
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_model_1
                ),
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_model_2
                ),
            ])


class BlogPostSummaryUrlUniquenessJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = blog_validation_jobs.BlogPostSummaryUrlUniquenessJob

    def test_run_with_same_url_for_blog_posts(self):
        # type: () -> None
        blog_post_summary_model_1 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostSummaryModel,
            id='validblogid1',
            title='Sample Title 1',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_summary_model_2 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostSummaryModel,
            id='validblogid2',
            title='Sample Title 2',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='url_fragment')
        blog_post_summary_model_3 = self.create_model( # type: ignore[no-untyped-call]
            blog_models.BlogPostSummaryModel,
            id='validblogid3',
            title='Sample Diff Title',
            summary='<p>hello tho</p>,',
            author_id='user',
            url_fragment='diff_url_fragment')

        self.put_multi( # type: ignore[no-untyped-call]
            [
                blog_post_summary_model_1,
                blog_post_summary_model_2,
                blog_post_summary_model_3,
            ]
        )

        self.assert_job_output_is(# type: ignore[no-untyped-call]
            [
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_summary_model_1
                ),
                blog_validation_errors.DuplicateBlogUrlError(
                    blog_post_summary_model_2
                ),
            ])
