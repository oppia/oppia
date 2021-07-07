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

"""Unit tests for blog model job errors."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import blog_validation_errors
from jobs.types import base_validation_errors_test
import utils

(blog_models,) = models.Registry.import_models([models.NAMES.blog])

datastore_services = models.Registry.import_datastore_services()


class DuplicateBlogTitleErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self):
        blog_post_model = blog_models.BlogPostModel(
            id='validblogid1',
            deleted=False,
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1')

        error = blog_validation_errors.DuplicateBlogTitleError(blog_post_model)

        self.assertEqual(
            error.stderr,
            'DuplicateBlogTitleError in BlogPostModel(id="validblogid1"):'
            ' title=%s is not unique' % utils.quoted(blog_post_model.title))


class DuplicateBlogUrlErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self):
        blog_post_model = blog_models.BlogPostModel(
            id='validblogid1',
            deleted=False,
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1')

        error = blog_validation_errors.DuplicateBlogUrlError(blog_post_model)

        self.assertEqual(
            error.stderr,
            'DuplicateBlogUrlError in BlogPostModel(id="validblogid1"): url=%s'
            ' is not unique' % utils.quoted(blog_post_model.url_fragment))
