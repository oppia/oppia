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

from core.domain import blog_services
from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils

datastore_services = models.Registry.import_datastore_services()

(blog_models, user_models) = models.Registry.import_models([
    models.NAMES.blog, models.NAMES.user])


class BlogPostModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BlogPostModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('abc@gmail.com', 'abc')
        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.author_id_1 = self.get_user_id_from_email('abc@gmail.com')
        self.blog_post_1 = blog_services.create_new_blog_post(self.author_id)
        self.blog_post_id_1 = self.blog_post_1.id
        self.blog_post_model_1 = (
            blog_models.BlogPostModel.get_by_id(self.blog_post_id_1))

        self.blog_post_2 = blog_services.create_new_blog_post(self.author_id_1)
        self.blog_post_id_2 = self.blog_post_2.id
        self.blog_post_model_2 = (
            blog_models.BlogPostModel.get_by_id(self.blog_post_id_2))
        self.blog_post_summary_model = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_id_1))

        self.job_class = (
            prod_validation_jobs_one_off.BlogPostModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated BlogPostModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.blog_post_model_1.created_on = (
            self.blog_post_model_1.last_updated + datetime.timedelta(
                days=1))
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BlogPostModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.blog_post_model_1.id,
                self.blog_post_model_1.created_on,
                self.blog_post_model_1.last_updated
            ), u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_repeated_title(self):
        self.blog_post_model_1.title = 'Sample Title'
        self.blog_post_model_2.title = 'Sample Title'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        self.blog_post_model_2.update_timestamps()
        self.blog_post_model_2.put()
        self.blog_post_summary_model.title = 'Sample Title'
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()
        blog_post_summary_model_2 = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_id_2))
        blog_post_summary_model_2.title = 'Sample Title'
        blog_post_summary_model_2.update_timestamps()
        blog_post_summary_model_2.put()
        expected_output = [
            (
                u'[u\'failed validation check for unique title for blog post '
                'of BlogPostModel\', '
                '[u"Entity id %s: title %s matches with title '
                'blog post models with ids [\'%s\']",'
                ' u"Entity id %s: title %s matches'
                ' with title blog post models with ids [\'%s\']"]]' % (
                    self.blog_post_id_1, self.blog_post_model_1.title,
                    self.blog_post_id_2, self.blog_post_id_2,
                    self.blog_post_model_1.title, self.blog_post_id_1)
            )
            ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_model_with_repeated_url_fragment(self):
        self.blog_post_model_1.url_fragment = 'sample-url'
        self.blog_post_model_2.url_fragment = 'sample-url'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        self.blog_post_model_2.update_timestamps()
        self.blog_post_model_2.put()
        expected_output = [
            (
                u'[u\'failed validation check for unique url fragment for '
                'blog post of BlogPostModel\', '
                '[u"Entity id %s: url fragment %s matches with url fragment'
                ' of blog post models with ids [\'%s\']",'
                ' u"Entity id %s: url fragment %s matches with url'
                ' fragment of blog post models with ids [\'%s\']"]]' % (
                    self.blog_post_id_1,
                    self.blog_post_model_1.url_fragment,
                    self.blog_post_id_2, self.blog_post_id_2,
                    self.blog_post_model_1.url_fragment,
                    self.blog_post_id_1)
            )
            ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_summary_model_failure(self):
        blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_id_1).delete()
        expected_output = [
            (
                u'[u\'failed validation check for blog_post_summary_model_ids '
                'field check of BlogPostModel\', '
                '[u"Entity id %s: based on field blog_post_summary_model_ids '
                'having value %s, expected model BlogPostSummaryModel with id'
                ' %s but it doesn\'t exist"]]' % (
                    self.blog_post_id_1, self.blog_post_id_1,
                    self.blog_post_id_1)
            ), u'[u\'fully-validated BlogPostModel\', 1]'
            ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_rights_model_failure(self):
        blog_models.BlogPostRightsModel.get_by_id(self.blog_post_id_1).delete()
        expected_output = [
            (
                u'[u\'failed validation check for blog_post_rights_model_ids'
                ' field check of BlogPostModel\', '
                '[u"Entity id %s: based on field blog_post_rights_model_ids '
                'having value %s, expected model BlogPostRightsModel with id %s'
                ' but it doesn\'t exist"]]' % (
                    self.blog_post_id_1, self.blog_post_id_1,
                    self.blog_post_id_1)
            ), (
                u'[u\'failed validation check for domain object check of '
                'BlogPostModel\', [u"Entity id %s: Entity fails domain '
                'validation with the error \'NoneType\' object has no '
                'attribute \'blog_post_is_published\'"]]' % self.blog_post_id_1
                ), u'[u\'fully-validated BlogPostModel\', 1]'
            ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_blog_post_with_missing_thumbnail_filename(self):
        expected_output = [
            u'[u\'fully-validated BlogPostModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_blog_post_with_missing_title(self):
        expected_output = [
            u'[u\'fully-validated BlogPostModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_blog_post_with_missing_url_fragment(self):
        expected_output = [
            u'[u\'fully-validated BlogPostModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_with_missing_thumbnail_filename(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_model_1.title = 'Sample Title'
        self.blog_post_model_1.tags = ['tag']
        self.blog_post_model_1.url = 'sample-title'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        self.blog_post_summary_model.title = 'Sample Title'
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Expected thumbnail filename '
                'to be a string, received: None.\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_with_missing_title(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_model_1.title = ''
        self.blog_post_model_1.tags = ['tag']
        self.blog_post_model_1.url = 'sample-title'
        self.blog_post_model_1.thumbnail = 'thumbnail.svg'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Title '
                'should not be empty\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_with_missing_url_fragment(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_model_1.title = 'sample-title'
        self.blog_post_model_1.tags = ['tag']
        self.blog_post_model_1.url = ''
        self.blog_post_model_1.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        self.blog_post_summary_model.title = 'sample-title'
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Blog Post URL Fragment '
                'field should not be empty.\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_with_missing_content(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_model_1.title = 'sample-title'
        self.blog_post_model_1.tags = ['tag']
        self.blog_post_model_1.url_fragment = 'sample-title'
        self.blog_post_model_1.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        self.blog_post_summary_model.title = 'sample-title'
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Content can not be '
                'empty\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.author_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_id '
                'field check of BlogPostModel\', '
                '[u"Entity id %s: based on field author_id having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.blog_post_id_1, self.author_id, self.author_id),
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_different_title_for_blog_post_summary(self):
        self.blog_post_model_1.title = 'sample'
        self.blog_post_model_1.update_timestamps()
        self.blog_post_model_1.put()
        self.blog_post_summary_model.title = 'sample-title'
        self.blog_post_summary_model.update_timestamps()
        self.blog_post_summary_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for Same Title for blog post'
                ' and blog post summary of BlogPostModel\', '
                '[u"Title for blog post with Entity id %s'
                ' does not match with title of corresponding'
                ' blog post summary model"]]' % (self.blog_post_id_1)
            ),
            u'[u\'fully-validated BlogPostModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)


class BlogPostSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BlogPostSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('abc@gmail.com', 'abc')
        self.author_id_1 = self.get_user_id_from_email('abc@gmail.com')
        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.blog_post_1 = blog_services.create_new_blog_post(self.author_id)
        self.blog_post_id_1 = self.blog_post_1.id
        self.blog_post_summary_model_1 = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_id_1))
        self.blog_post_2 = blog_services.create_new_blog_post(self.author_id_1)
        self.blog_post_id_2 = self.blog_post_2.id
        self.blog_post_summary_model_2 = (
            blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_id_2))

        self.job_class = (
            prod_validation_jobs_one_off.BlogPostSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated BlogPostSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.blog_post_summary_model_1.created_on = (
            self.blog_post_summary_model_1.last_updated +
            datetime.timedelta(days=1))
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BlogPostSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.blog_post_summary_model_1.id,
                self.blog_post_summary_model_1.created_on,
                self.blog_post_summary_model_1.last_updated
            ), u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.author_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_id '
                'field check of BlogPostSummaryModel\', '
                '[u"Entity id %s: based on field author_id having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.blog_post_id_1, self.author_id, self.author_id),
            u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_blog_post_summary_with_missing_title(self):
        expected_output = [
            u'[u\'fully-validated BlogPostSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_blog_post_summary_with_missing_thumbnail_filename(self):
        expected_output = [u'[u\'fully-validated BlogPostSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_rights_model_failure(self):
        blog_models.BlogPostRightsModel.get_by_id(
            self.blog_post_id_1).delete()

        expected_output = [
            (
                u'[u\'failed validation check for blog_post_rights_model_ids'
                ' field check of BlogPostSummaryModel\', '
                '[u"Entity id %s: based on field blog_post_rights_model_ids '
                'having value %s, expected model BlogPostRightsModel with id %s'
                ' but it doesn\'t exist"]]' % (
                    self.blog_post_id_1, self.blog_post_id_1,
                    self.blog_post_id_1)
            ), (
                u'[u\'failed validation check for domain object check of '
                'BlogPostSummaryModel\', [u"Entity id %s: Entity fails domain '
                'validation with the error \'NoneType\' object has no '
                'attribute \'blog_post_is_published\'"]]' % self.blog_post_id_1
                ), u'[u\'fully-validated BlogPostSummaryModel\', 1]'
            ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_blog_post_model_failure(self):
        blog_models.BlogPostModel.get_by_id(self.blog_post_id_1).delete()

        expected_output = [
            (
                u'[u\'failed validation check for blog_post_model_ids '
                'field check of BlogPostSummaryModel\', '
                '[u"Entity id %s: based on field blog_post_model_ids having '
                'value %s, expected model BlogPostModel with id %s '
                'but it doesn\'t exist"]]' % (
                    self.blog_post_id_1, self.blog_post_id_1,
                    self.blog_post_id_1)
            ), u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_blog_post_summary_with_missing_url_fragment(self):
        expected_output = [
            u'[u\'fully-validated BlogPostSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_summary_with_missing_thumbnail_filename(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_summary_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_summary_model_1.title = 'Sample Title'
        self.blog_post_summary_model_1.tags = ['tag']
        self.blog_post_summary_model_1.url_fragment = 'sample-title'
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostSummaryModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Expected thumbnail filename '
                'to be a string, received: None.\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_summary_with_missing_title(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_summary_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_summary_model_1.title = ''
        self.blog_post_summary_model_1.tags = ['tag']
        self.blog_post_summary_model_1.url = 'sample-title'
        self.blog_post_summary_model_1.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostSummaryModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Title '
                'should not be empty\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_summary_with_missing_url_fragment(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_summary_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_summary_model_1.title = 'sample-title'
        self.blog_post_summary_model_1.tags = ['tag']
        self.blog_post_summary_model_1.url_fragment = ''
        self.blog_post_summary_model_1.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostSummaryModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Blog Post URL Fragment '
                'field should not be empty.\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_blog_post_summary_with_missing_summary(self):
        blog_post_rights = blog_services.get_blog_post_rights(
            self.blog_post_summary_model_1.id, strict=False)
        blog_post_rights.blog_post_is_published = True
        blog_services.save_blog_post_rights(blog_post_rights)
        self.blog_post_summary_model_1.title = 'sample-title'
        self.blog_post_summary_model_1.tags = ['tag']
        self.blog_post_summary_model_1.url_fragment = 'sample-title'
        self.blog_post_summary_model_1.thumbnail_filename = 'thumbnail.svg'
        self.blog_post_summary_model_1.summary = ''
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'BlogPostSummaryModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Summary can not be '
                'empty\']]' % self.blog_post_id_1
            ),
            u'[u\'fully-validated BlogPostSummaryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_repeated_title(self):
        self.blog_post_summary_model_1.title = 'Sample Title'
        self.blog_post_summary_model_2.title = 'Sample Title'
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        self.blog_post_summary_model_2.update_timestamps()
        self.blog_post_summary_model_2.put()
        expected_output = [
            (
                u'[u\'failed validation check for unique title for blog post '
                'of BlogPostSummaryModel\', '
                '[u"Entity id %s: title %s matches with title '
                'blog post summary models with ids [\'%s\']",'
                ' u"Entity id %s: title %s matches'
                ' with title blog post summary models with ids [\'%s\']"]]'
                % (
                    self.blog_post_id_2, self.blog_post_summary_model_1.title,
                    self.blog_post_id_1, self.blog_post_id_1,
                    self.blog_post_summary_model_2.title, self.blog_post_id_2
                )
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_model_with_repeated_url_fragment(self):
        self.blog_post_summary_model_1.url_fragment = 'sample-url'
        self.blog_post_summary_model_2.url_fragment = 'sample-url'
        self.blog_post_summary_model_1.update_timestamps()
        self.blog_post_summary_model_1.put()
        self.blog_post_summary_model_2.update_timestamps()
        self.blog_post_summary_model_2.put()
        expected_output = [
            (
                u'[u\'failed validation check for unique url fragment for '
                'blog post of BlogPostSummaryModel\', '
                '[u"Entity id %s: url fragment %s matches with url fragment'
                ' of blog post summary models with ids [\'%s\']",'
                ' u"Entity id %s: url fragment %s matches with url'
                ' fragment of blog post summary models with ids [\'%s\']"]]' % (
                    self.blog_post_id_1,
                    self.blog_post_summary_model_1.url_fragment,
                    self.blog_post_id_2, self.blog_post_id_2,
                    self.blog_post_summary_model_1.url_fragment,
                    self.blog_post_id_1)
            )
            ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)


class BlogPostRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(BlogPostRightsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('abc@gmail.com', 'abc')
        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.author_id_1 = self.get_user_id_from_email('abc@gmail.com')
        self.author_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.blog_post_1 = blog_services.create_new_blog_post(self.author_id)
        self.blog_post_id_1 = self.blog_post_1.id
        self.blog_post_rights_model_1 = (
            blog_models.BlogPostRightsModel.get_by_id(self.blog_post_id_1))
        self.blog_post_2 = blog_services.create_new_blog_post(self.author_id_1)
        self.blog_post_id_2 = self.blog_post_2.id
        self.blog_post_rights_model_2 = (
            blog_models.BlogPostRightsModel.get_by_id(self.blog_post_id_2))
        self.job_class = (
            prod_validation_jobs_one_off.BlogPostRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated BlogPostRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.blog_post_rights_model_1.created_on = (
            self.blog_post_rights_model_1.last_updated +
            datetime.timedelta(days=1))
        self.blog_post_rights_model_1.update_timestamps()
        self.blog_post_rights_model_1.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of BlogPostRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.blog_post_rights_model_1.id,
                self.blog_post_rights_model_1.created_on,
                self.blog_post_rights_model_1.last_updated
            ), u'[u\'fully-validated BlogPostRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_blog_post_model_failure(self):
        blog_models.BlogPostModel.get_by_id(self.blog_post_id_1).delete()

        expected_output = [
            (
                u'[u\'failed validation check for blog_post_model_ids '
                'field check of BlogPostRightsModel\', '
                '[u"Entity id %s: based on field blog_post_model_ids having '
                'value %s, expected model BlogPostModel with id %s '
                'but it doesn\'t exist"]]' % (
                    self.blog_post_id_1, self.blog_post_id_1,
                    self.blog_post_id_1)
            ), u'[u\'fully-validated BlogPostRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        blog_models.BlogPostSummaryModel.get_by_id(self.blog_post_id_1).delete()

        expected_output = [
            u'[u\'failed validation check for blog_post_summary_model_ids '
            'field check of BlogPostRightsModel\', '
            '[u"Entity id %s: based on field blog_post_summary_model_ids '
            'having value %s, expected model BlogPostSummaryModel with id %s '
            'but it doesn\'t exist"]]' % (
                self.blog_post_id_1, self.blog_post_id_1,
                self.blog_post_id_1),
            u'[u\'fully-validated BlogPostRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.author_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_ids '
                'field check of BlogPostRightsModel\', '
                '[u"Entity id %s: based on field editor_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.blog_post_id_1, self.author_id, self.author_id),
            u'[u\'fully-validated BlogPostRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
