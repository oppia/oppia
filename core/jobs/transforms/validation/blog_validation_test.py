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

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import blog_validation
from core.jobs.types import blog_validation_errors
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])


class RelationshipsOfTests(test_utils.TestBase):

    def test_blog_post_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'id'),
            ['BlogPostSummaryModel', 'BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'author_id'),
            ['UserSettingsModel'])

    def test_blog_post_summary_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'id'),
            ['BlogPostModel', 'BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'author_id'),
            ['UserSettingsModel'])

    def test_blog_post_rights_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'id'),
            ['BlogPostModel', 'BlogPostSummaryModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'editor_ids'),
            ['UserSettingsModel'])

    def test_blog_author_details_model_relationships(self) -> None:
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogAuthorDetailsModel', 'author_id'),
            ['UserSettingsModel'])


class ValidateBlogModelTimeFieldTests(job_test_utils.PipelinedTestBase):

    def test_reports_model_created_on_timestamp_relationship_error(
        self
    ) -> None:
        invalid_timestamp = blog_models.BlogPostModel(
            id='validblogid1',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.NOW,
            last_updated=self.YEAR_AGO,
            published_on=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateBlogModelTimestamps())
        )

        self.assert_pcoll_equal(
            output, [
                blog_validation_errors.InconsistentLastUpdatedTimestampsError(
                    invalid_timestamp),
            ]
        )

    def test_reports_model_last_updated_timestamp_relationship_error(
            self
    ) -> None:
        invalid_timestamp = blog_models.BlogPostModel(
            id='validblogid1',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_AGO,
            published_on=self.NOW)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateBlogModelTimestamps())
        )

        self.assert_pcoll_equal(
            output, [
                blog_validation_errors
                .InconsistentPublishLastUpdatedTimestampsError(
                    invalid_timestamp),
            ]
        )

    def test_process_reports_no_error_if_published_on_is_none(self) -> None:
        valid_timestamp = blog_models.BlogPostModel(
            id='124',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=None)

        output = (
            self.pipeline
            | beam.Create([valid_timestamp])
            | beam.ParDo(blog_validation.ValidateBlogModelTimestamps())
        )

        self.assert_pcoll_equal(output, [])

    def test_process_reports_model_mutated_during_job_error_for_published_on(
        self) -> None:
        invalid_timestamp = blog_models.BlogPostModel(
            id='124',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.YEAR_LATER)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateBlogModelTimestamps())
        )

        self.assert_pcoll_equal(
            output, [
                blog_validation_errors.ModelMutatedDuringJobErrorForPublishedOn(
                    invalid_timestamp),
                blog_validation_errors.InconsistentPublishLastUpdatedTimestampsError( # pylint: disable=line-too-long
                    invalid_timestamp),
            ]
        )

    def test_process_reports_model_mutated_during_job_error_for_last_updated(
        self) -> None:
        invalid_timestamp = blog_models.BlogPostModel(
            id='124',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.YEAR_LATER,
            published_on=self.YEAR_AGO)

        output = (
            self.pipeline
            | beam.Create([invalid_timestamp])
            | beam.ParDo(blog_validation.ValidateBlogModelTimestamps())
        )

        self.assert_pcoll_equal(
            output, [
                blog_validation_errors.ModelMutatedDuringJobErrorForLastUpdated(
                    invalid_timestamp),
            ]
        )


class ValidateBlogPostModelDomainObjectsInstancesTests(
        job_test_utils.PipelinedTestBase):

    def test_validation_type_for_domain_object_strict(self) -> None:
        blog_model = blog_models.BlogPostModel(
            id='validblogid2',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.NOW,
            thumbnail_filename='sample.svg',
            tags=['learners'])

        output = (
            self.pipeline
            | beam.Create([blog_model])
            | beam.ParDo(
                blog_validation.ValidateBlogPostModelDomainObjectsInstances())
        )

        self.assert_pcoll_equal(output, [])

    def test_validation_type_for_domain_object_non_strict(self) -> None:
        blog_model = blog_models.BlogPostModel(
            id='validblogid2',
            title='Sample Title',
            content='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=None,
            thumbnail_filename=None,
            tags=[])

        output = (
            self.pipeline
            | beam.Create([blog_model])
            | beam.ParDo(
                blog_validation.ValidateBlogPostModelDomainObjectsInstances())
        )

        self.assert_pcoll_equal(output, [])


class ValidateBlogPostSummaryModelDomainObjectsInstancesTests(
        job_test_utils.PipelinedTestBase):

    def test_validation_type_for_domain_object_strict(self) -> None:
        blog_summary_model = blog_models.BlogPostSummaryModel(
            id='validblogid4',
            title='Sample Title',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=self.NOW,
            thumbnail_filename='sample.svg',
            tags=['learners'])

        output = (
            self.pipeline
            | beam.Create([blog_summary_model])
            | beam.ParDo(
                blog_validation.ValidateBlogSummaryModelDomainObjectsInstances()) # pylint: disable=line-too-long
        )

        self.assert_pcoll_equal(output, [])

    def test_validation_type_for_domain_object_non_strict(self) -> None:
        blog_summary_model = blog_models.BlogPostSummaryModel(
            id='validblogid5',
            title='Sample Title',
            summary='<p>hello</p>,',
            author_id='user',
            url_fragment='url-fragment-1',
            created_on=self.YEAR_AGO,
            last_updated=self.NOW,
            published_on=None,
            thumbnail_filename=None,
            tags=[])

        output = (
            self.pipeline
            | beam.Create([blog_summary_model])
            | beam.ParDo(
                blog_validation.ValidateBlogSummaryModelDomainObjectsInstances()) # pylint: disable=line-too-long
        )

        self.assert_pcoll_equal(output, [])
