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

import datetime

from core.platform import models
from core.tests import test_utils
import feconf
from jobs import job_test_utils
from jobs.decorators import validation_decorators
from jobs.transforms import user_validation
from jobs.types import base_validation_errors
from jobs.types import user_validation_errors

import apache_beam as beam

(blog_models, user_models) = models.Registry.import_models(
    [models.NAMES.blog, models.Names.user])

class RelationshipsOfTests(test_utils.TestBase):

    def test_blog_post_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'id'),
            ['BlogPostSummaryModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'id'),
            ['BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostModel', 'author_id'),
            ['UserSettingsModel'])

    def test_blog_post_summary_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'id'),
            ['BlogPostModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'id'),
            ['BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostSummaryModel', 'author_id'),
            ['UserSettingsModel'])

    def test_blog_post_rights_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'id'),
            ['BlogPostModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'id'),
            ['BlogPostRightsModel'])
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'BlogPostRightsModel', 'author_id'),
            ['UserSettingsModel'])
