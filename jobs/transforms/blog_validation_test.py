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

"""Unit tests for jobs.transforms.blog_post_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils
from jobs import blog_validation_errors
from jobs import job_test_utils
from jobs.decorators import validation_decorators
from jobs.transforms import blog_validation

import apache_beam as beam

(blog_models, user_models) = models.Registry.import_models(
    [models.NAMES.blog, models.NAMES.user])


class RelationshipsOfTests(test_utils.TestBase):

    def test_blog_post_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'id'),
            ['BlogPostSummaryModel', 'BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'author_id'),
            ['UserSettingsModel'])

    def test_blog_post_summary_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'id'),
            ['BlogPostModel', 'BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'author_id'),
            ['UserSettingsModel'])

    def test_blog_post_rights_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'id'),
            ['BlogPostModel', 'BlogPostSummaryModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'editor_ids'),
            ['UserSettingsModel'])


class ValidateModelPublishTimeFieldTests(job_test_utils.PipelinedTestBase):

    def test_reports_model_created_on_timestamp_relationship_error(self):
        invalid_timestamp = blog_models.BlogPostModel(
            id='validblogid1',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO,
            published_on=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateModelPublishTimestamps())
        )

        self.assert_pcoll_equal(output, [
            blog_validation_errors.InconsistentPublishTimestampsError(
                invalid_timestamp),
        ])

    def test_reports_model_last_updated_timestamp_relationship_error(self):
        invalid_timestamp = blog_models.BlogPostModel(
            id='validblogid1',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateModelPublishTimestamps())
        )

        self.assert_pcoll_equal(output, [
            blog_validation_errors
            .InconsistentPublishLastUpdatedTimestampsError(
                invalid_timestamp),
        ])

    def test_process_reports_model_mutated_during_job_error(self):
        invalid_timestamp = blog_models.BlogPostModel(
            id='124',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.NOW,
            last_updated=self.NOW,
            published_on=self.YEAR_LATER)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateModelPublishTimestamps())
        )

        self.assert_pcoll_equal(output, [
            blog_validation_errors.ModelMutatedDuringJobError(
                invalid_timestamp),
        ])


class ValidateBlogModelDomainObjectsInstancesTests(
        job_test_utils.PipelinedTestBase):

    def test_validation_type_for_domain_object_non_strict(self):
        blog_model = blog_models.BlogPostModel(
            id='validblogid1',
            title='',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.NOW)

        blog_summary_model = blog_models.BlogPostSummaryModel(
            id='validblogid1',
            title='',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.NOW)

        blog_rights_model = blog_models.BlogPostRightsModel(
            id='validblogid1',
            editor_ids=['user'],
            blog_post_is_published=False,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        blog_rights_model.update_timestamps()
        blog_rights_model.put()
        output = (
            self.pipeline
            | beam.Create([blog_model, blog_summary_model])
            | beam.ParDo(
                blog_validation.ValidateBlogModelDomainObjectsInstances())
        )

        self.assert_pcoll_equal(output, [])

    def test_validation_type_for_domain_object_strict(self):
        blog_model = blog_models.BlogPostModel(
            id='validblogid2',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.NOW)

        blog_summary_model = blog_models.BlogPostSummaryModel(
            id='validblogid2',
            title='Sample Title',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url_fragment_1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.NOW)

        blog_rights_model = blog_models.BlogPostRightsModel(
            id='validblogid2',
            editor_ids=['user'],
            blog_post_is_published=True,
            created_on=self.YEAR_AGO,
            last_updated=self.NOW)
        blog_rights_model.update_timestamps()
        blog_rights_model.put()
        output = (
            self.pipeline
            | beam.Create([blog_model, blog_summary_model])
            | beam.ParDo(
                blog_validation.ValidateBlogModelDomainObjectsInstances())
        )

        self.assert_pcoll_equal(output, [])
