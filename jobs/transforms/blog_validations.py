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

"""Beam DoFns and PTransforms to provide validation of blog post models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import blog_services
from core.platform import models
from jobs.decorators import validation_decorators
from jobs.transforms import base_validation

(blog_models, user_models) = models.Registry.import_models([
    models.NAMES.blog, models.Names.user])


@validation_decorators.AuditsExisting(
    blog_models.BlogPostModel,
    blog_models.BlogPostSummaryModel)
class ValidateBlogModelDomainObjectsInstances(
        base_validation.ValidateModelDomainObjectInstances):
    """Provides the validation type for validating blog post objects."""

    def _get_domain_object_validation_type(self, item):
        """Returns the type of domain object validation to be performed.

        Args:
            item: datastore_services.Model. Entity to validate.

        Returns:
            str. The type of validation mode: strict or non strict.
        """
        blog_post_rights = blog_services.get_blog_post_rights(
            item.id, strict=True)

        if blog_post_rights.blog_post_is_published:
            return base_validation.VALIDATION_MODES.strict

        return base_validation.VALIDATION_MODES.non_strict


@validation_decorators.RelationshipsOf(blog_models.BlogPostModel)
def blog_post_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostSummaryModel]
    yield model.id, [blog_models.BlogPostRightsModel]
    yield model.author_id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(blog_models.BlogPostSummaryModel)
def blog_post_summary_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostModel]
    yield model.id, [blog_models.BlogPostRightsModel]
    yield model.author_id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(blog_models.BlogPostRightsModel)
def blog_post_rights_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostModel]
    yield model.id, [blog_models.BlogPostSummaryModel]
    yield model.editor_ids, [user_models.UserSettingsModel]
