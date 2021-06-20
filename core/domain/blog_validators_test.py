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

"""Unit tests for core.domain.blog_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils

datastore_services = models.Registry.import_datastore_services()

(
    blog_models, user_models
) = models.Registry.import_models([
    models.NAMES.blog, models.NAMES.user
    ])


class BlogPostModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BlogPostModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.blog_post_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())
        self.blog_post_model_instance = blog_models.BlogPostModel.create(
            self.blog_post_id, self.author_id
        )
        self.blog_post_summary_model = (
            blog_models.BlogPostSummaryModel(
                id=self.blog_post_id,
                author_id=self.author_id,
                summary='',
                title='',
                published_on=None,
                url_fragment='',
                tags=[],
                thumbnail_filename=''
            ))
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()
        blog_models.BlogPostRightsModel.create(
            self.blog_post_id, self.author_id
        )

        self.job_class = (
            prod_validation_jobs_one_off
            .BlogPostModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.blog_post_model_instance.created_on = (
            self.blog_post_model_instance.last_updated + datetime.timedelta(
                days=1))
        self.blog_post_model_instance.update_timestamps()
        self.blog_post_model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BlogPostModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.blog_post_model_instance.id,
                self.blog_post_model_instance.created_on,
                self.blog_post_model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class BlogPostSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BlogPostSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.blog_post_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())

        self.blog_post_summary_model_instance = (
            blog_models.BlogPostSummaryModel(
                id=self.blog_post_id,
                author_id=self.author_id,
                summary='',
                title='',
                published_on=None,
                url_fragment='',
                tags=[],
                thumbnail_filename=''
            ))
        self.blog_post_summary_model_instance.update_timestamps()
        self.blog_post_summary_model_instance.put()
        blog_models.BlogPostModel.create(self.blog_post_id, self.author_id)
        blog_models.BlogPostRightsModel.create(
            self.blog_post_id, self.author_id)

        self.job_class = (
            prod_validation_jobs_one_off
            .BlogPostSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.blog_post_summary_model_instance.created_on = (
            self.blog_post_summary_model_instance.last_updated +
            datetime.timedelta(days=1))
        self.blog_post_summary_model_instance.update_timestamps()
        self.blog_post_summary_model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BlogPostSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.blog_post_summary_model_instance.id,
                self.blog_post_summary_model_instance.created_on,
                self.blog_post_summary_model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class BlogPostRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BlogPostRightsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.blog_post_id = (
            blog_models.BlogPostModel.generate_new_blog_post_id())

        self.blog_post_rights_model_instance = (
            blog_models.BlogPostRightsModel.create(
                self.blog_post_id, self.author_id
            ))
        blog_models.BlogPostModel.create(self.blog_post_id, self.author_id)

        self.blog_post_summary_model = (
            blog_models.BlogPostSummaryModel(
                id=self.blog_post_id,
                author_id=self.author_id,
                summary='',
                title='',
                published_on=None,
                url_fragment='',
                tags=[],
                thumbnail_filename=''
            ))
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()

        self.job_class = (
            prod_validation_jobs_one_off
            .BlogPostRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated BlogPostRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.blog_post_rights_model_instance.created_on = (
            self.blog_post_rights_model_instance.last_updated +
            datetime.timedelta(days=1))
        self.blog_post_rights_model_instance.update_timestamps()
        self.blog_post_rights_model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BlogPostRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.blog_post_rights_model_instance.id,
                self.blog_post_rights_model_instance.created_on,
                self.blog_post_rights_model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
