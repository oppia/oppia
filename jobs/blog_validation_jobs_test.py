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
import feconf
from jobs import job_test_utils
from jobs import blog_validation_jobs
from jobs import blog_validation_errors

(blog_models, user_models) = models.Registry.import_models(
    [models.NAMES.blog, models.NAMES.user])

class BlogPostTitleUniquenessJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = blog_validation_jobs.BlogPostTitleUniquenessJob

    def test_run_with_same_titles_for_blog_posts(self):
        blog_post_model_1 = self.create_model(
            blog_models.BlogPostModel, id='validblogid1', deleted=False,
            title='Sample Title')
        blog_post_model_2 = self.create_model(
            blog_models.BlogPostModel, id='validblogid2', deleted=False,
            title='Sample Title')
        blog_post_model_3 = self.create_model(
            blog_models.BlogPostModel, id='validblogid3', deleted=False,
            title='Sample Diff Title')

        self.put_multi([
            blog_post_model_1,
            blog_post_model_2,
            blog_post_model_3,
        ])

        self.assert_job_output_is([
            blog_validation_errors.DuplicateBlogTitleError(
                blog_post_model_1
            ),
            blog_validation_errors.DuplicateBlogTitleError(
                blog_post_model_2
            ),
        ])
