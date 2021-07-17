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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs import base_jobs
from jobs import blog_validation_errors
from jobs import job_utils
from jobs.io import ndb_io

import apache_beam as beam

from typing import Any, Text # isort:skip # pylint: disable=unused-import

(blog_models,) = models.Registry.import_models( # type: ignore[no-untyped-call]
    [models.NAMES.blog, ])


class GetModelsWithDuplicatePropertyValues(beam.PTransform): # type: ignore[misc]
    """Helper class to retrive models with duplicate properties."""

    def __init__(self, property_name):
        # type: (Text) -> None
        super(GetModelsWithDuplicatePropertyValues, self).__init__()
        self._property_name = property_name

    def expand(self, blog_model_pcoll):
        # type: (Any) -> Any # type: ignore[no-any-return]
        return (
            blog_model_pcoll
            | 'Discard models with empty property value' >> (
                beam.Filter(lambda model: self.get_property_value(model) != ''))
            | 'Generate (%s, model) key value pairs' % self._property_name >> (
                beam.WithKeys(self.get_property_value)) # pylint: disable=no-value-for-parameter
            | 'Group pairs by their %s' % self._property_name >> (
                beam.GroupByKey())
            | 'Discard %s key' % self._property_name >> beam.Values()
            | 'Discard models with unique %s' % self._property_name >> (
                beam.Filter(lambda models: len(models) > 1))
        )

    def get_property_value(self, model):
        # type: (Any) -> Any # type: ignore[no-any-return]
        """Returns value of the given property of model

        Args:
            model: datastore_services.Model. Entity to validate.

        Returns:
            value. The value of the property of model.
        """
        return job_utils.get_model_property( # type: ignore[no-untyped-call]
            model, self._property_name)


class BlogPostTitleUniquenessJob(base_jobs.JobBase):
    """Validates that all the Blog Posts have unique title."""

    def run(self):
        # type: () -> base_jobs.JobBase.pipeline
        return (
            self.pipeline
            | 'Get every Blog Model' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    blog_models.BlogPostModel.query(), self.datastoreio_stub
                ))
            | GetModelsWithDuplicatePropertyValues('title')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogTitleError(model)
                    for model in models
                ])
        )


class BlogPostUrlUniquenessJob(base_jobs.JobBase):
    """Validates that all the Blog Posts have unique url."""

    def run(self):
        # type: () -> base_jobs.JobBase.pipeline
        return (
            self.pipeline
            | 'Get every Blog Post Model' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    blog_models.BlogPostModel.query(), self.datastoreio_stub
                ))
            | GetModelsWithDuplicatePropertyValues('url_fragment')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogUrlError(model)
                    for model in models
                ])
        )


class BlogPostSummaryTitleUniquenessJob(base_jobs.JobBase):
    """Validates that all the Blog Post Summary Model have unique title."""

    def run(self):
        # type: () -> base_jobs.JobBase.pipeline
        return (
            self.pipeline
            | 'Get every Blog Summary Model' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    blog_models.BlogPostSummaryModel.query(),
                    self.datastoreio_stub
                ))
            | GetModelsWithDuplicatePropertyValues('title')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogTitleError(model)
                    for model in models
                ])
        )


class BlogPostSummaryUrlUniquenessJob(base_jobs.JobBase):
    """Validates that all the Blog Post Summary Model have unique url."""

    def run(self):
        # type: () -> base_jobs.JobBase.pipeline
        return (
            self.pipeline
            | 'Get every Blog Post Summary Model' >> (
                ndb_io.GetModels( # type: ignore[no-untyped-call]
                    blog_models.BlogPostSummaryModel.query(),
                    self.datastoreio_stub
                ))
            | GetModelsWithDuplicatePropertyValues('url_fragment')
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogUrlError(model)
                    for model in models
                ])
        )
