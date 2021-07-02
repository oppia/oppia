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

from jobs import base_jobs
from jobs.io import ndb_io
from jobs.types import blog_validation_errors

import apache_beam as beam
(blog_models) = models.Registry.import_models([models.NAMES.blog])


class BlogTitleUniquenessJob(base_jobs.JobBase):

    def run(self):
        blog_model_pcoll = (
            self.pipeline
            | 'Get every Blog Model' >> (
                ndb_io.GetModels(blog_models.BlogPostModel.query()))
        )

        blogs_with_duplicate_titles = (
            blog_model_pcoll
            | 'Generate (title, model) key value pairs' >> (
                beam.WithKeys(lambda blog_model: blog_model.title))
            | 'Group pairs by their title' >> beam.GroupByKey()
            | 'Discard keys' >> beam.Values()
            | 'Discard models with unique titles' >> (
                beam.Filter(lambda models: len(models) > 1))
        )

        return (
            blogs_with_duplicate_titles
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogTitleError(model)
                    for model in models
                ])
        )


class BlogUrlUniquenessJob(base_jobs.JobBase):

    def run(self):
        blog_model_pcoll = (
            self.pipeline
            | 'Get every Blog Post Model' >> (
                ndb_io.GetModels(blog_models.BlogPostModel.query()))
        )

        blogs_with_duplicate_url_fragment = (
            blog_model_pcoll
            | 'Generate (url, model) key value pairs' >> (
                beam.WithKeys(lambda blog_model: blog_model.url_fragment))
            | 'Group pairs by their url fragment' >> beam.GroupByKey()
            | 'Discard keys' >> beam.Values()
            | 'Discard models with unique urls' >> (
                beam.Filter(lambda models: len(models) > 1))
        )

        return (
            blogs_with_duplicate_url_fragment
            | 'Flatten models into a list of errors' >> beam.FlatMap(
                lambda models: [
                    blog_validation_errors.DuplicateBlogUrlError(model)
                    for model in models
                ])
        )
