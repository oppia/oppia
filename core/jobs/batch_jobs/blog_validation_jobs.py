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

"""Validation Jobs for blog models"""

from __future__ import annotations

import datetime

from core.jobs import base_jobs
from core.jobs import job_utils
from core.jobs.io import ndb_io
from core.jobs.types import blog_validation_errors
from core.platform import models

import apache_beam as beam

from typing import Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import blog_models

(blog_models,) = models.Registry.import_models([models.Names.BLOG])


class FindDuplicateBlogPostTitlesJob(base_jobs.JobBase):
    """Validates that all the Blog Posts have unique title."""

    def run(
        self
    ) -> beam.PCollection[blog_validation_errors.DuplicateBlogTitleError]:
        return (
            self.pipeline
            | 'Get every Blog Model' >> (
                ndb_io.GetModels(blog_models.BlogPostModel.query()))
            | GetModelsWithDuplicatePropertyValues('title')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogTitleError(model)
                    for model in models
                ])
        )


class FindDuplicateBlogPostUrlsJob(base_jobs.JobBase):
    """Validates that all the Blog Posts have unique url."""

    def run(
        self
    ) -> beam.PCollection[blog_validation_errors.DuplicateBlogUrlError]:
        return (
            self.pipeline
            | 'Get every Blog Post Model' >> (
                ndb_io.GetModels(blog_models.BlogPostModel.query()))
            | GetModelsWithDuplicatePropertyValues('url_fragment')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogUrlError(model)
                    for model in models
                ])
        )


class FindDuplicateBlogPostSummaryTitlesJob(base_jobs.JobBase):
    """Validates that all the Blog Post Summary Model have unique title."""

    def run(
        self
    ) -> beam.PCollection[blog_validation_errors.DuplicateBlogTitleError]:
        return (
            self.pipeline
            | 'Get every Blog Summary Model' >> (
                ndb_io.GetModels(blog_models.BlogPostSummaryModel.query()))
            | GetModelsWithDuplicatePropertyValues('title')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogTitleError(model)
                    for model in models
                ])
        )


class FindDuplicateBlogPostSummaryUrlsJob(base_jobs.JobBase):
    """Validates that all the Blog Post Summary Model have unique url."""

    def run(
        self
    ) -> beam.PCollection[blog_validation_errors.DuplicateBlogUrlError]:
        return (
            self.pipeline
            | 'Get every Blog Post Summary Model' >> (
                ndb_io.GetModels(blog_models.BlogPostSummaryModel.query()))
            | GetModelsWithDuplicatePropertyValues('url_fragment')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogUrlError(model)
                    for model in models
                ])
        )


class FindDuplicateBlogAuthorDetailsModelForAuthorJob(base_jobs.JobBase):
    """Validates that only one Blog Author Detail Models exists corresponding to
    given author id.
    """

    def run(
        self
    ) -> beam.PCollection[blog_validation_errors.DuplicateBlogAuthorModelError]:
        return (
            self.pipeline
            | 'Get every Blog Author Details Model' >> (
                ndb_io.GetModels(blog_models.BlogAuthorDetailsModel.query()))
            | GetModelsWithDuplicatePropertyValues('author_id')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogAuthorModelError(model)
                    for model in models
                ])
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class GetModelsWithDuplicatePropertyValues(beam.PTransform):  # type: ignore[misc]
    """Helper class to retrieve models with duplicate properties."""

    def __init__(self, property_name: str) -> None:
        super().__init__()
        self.property_name = property_name

    def expand(
        self, blog_model_pcoll: beam.PCollection[Union[
            blog_models.BlogPostModel,
            blog_models.BlogPostSummaryModel,
            blog_models.BlogAuthorDetailsModel
        ]]
    ) -> beam.PCollection[Union[
        blog_models.BlogPostModel,
        blog_models.BlogPostSummaryModel,
        blog_models.BlogAuthorDetailsModel
    ]]:
        return (
            blog_model_pcoll
            | 'Discard models with empty property value' >> (
                beam.Filter(lambda model: self.get_property_value(model) != ''))
            | 'Generate (%s, model) key value pairs' % self.property_name >> (
                beam.WithKeys(self.get_property_value)) # pylint: disable=no-value-for-parameter
            | 'Group pairs by their %s' % self.property_name >> (
                beam.GroupByKey())
            | 'Discard %s key' % self.property_name >> (
                beam.Values()) # pylint: disable=no-value-for-parameter
            | 'Discard models with unique %s' % self.property_name >> (
                beam.Filter(lambda models: len(list(models)) > 1))
        )

    def get_property_value(
        self, model: blog_models.BlogPostModel
    ) -> Union[str, bool, datetime.datetime]:
        """Returns value of the given property of model

        Args:
            model: datastore_services.Model. Entity to validate.

        Returns:
            value. The value of the property of model.
        """
        property_value: Union[
            str, bool, datetime.datetime
        ] = job_utils.get_model_property(model, self.property_name)
        # Here, we are narrowing down the type from Any to all the possible
        # types of a BlogPostModel's property.
        assert isinstance(property_value, (str, bool, datetime.datetime))
        return property_value
