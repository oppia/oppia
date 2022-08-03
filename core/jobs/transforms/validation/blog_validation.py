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

from __future__ import annotations

import datetime

from core.domain import blog_domain
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.jobs.types import blog_validation_errors
from core.jobs.types import model_property
from core.platform import models

import apache_beam as beam

from typing import Iterator, List, Tuple, Type, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import blog_models
    from mypy_imports import user_models

(blog_models, user_models) = models.Registry.import_models(
    [models.NAMES.blog, models.NAMES.user])


@validation_decorators.AuditsExisting(blog_models.BlogPostModel)
class ValidateBlogPostModelDomainObjectsInstances(
    base_validation.ValidateModelDomainObjectInstances[
        blog_models.BlogPostModel
    ]
):
    """Provides the validation type for validating blog post objects."""

    def _get_model_domain_object_instance(
        self, blog_post_model: blog_models.BlogPostModel
    ) -> blog_domain.BlogPost:
        """Returns blog post domain object instance created from the model.

        Args:
            blog_post_model: datastore_services.Model. Entity to validate.

        Returns:
            BlogPost. A domain object to validate.
        """
        return blog_domain.BlogPost(
            blog_post_model.id,
            blog_post_model.author_id,
            blog_post_model.title,
            blog_post_model.content,
            blog_post_model.url_fragment,
            blog_post_model.tags,
            blog_post_model.thumbnail_filename,
            blog_post_model.last_updated,
            blog_post_model.published_on
        )

    def _get_domain_object_validation_type(
        self, unused_item: blog_models.BlogPostModel
    ) -> base_validation.ValidationModes:
        """Returns the type of domain object validation to be performed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. The type of validation mode: strict or non strict.
        """
        # TODO(#13397): Write a custom job to avoid applying strict validation
        # to private blog posts. We can't determine public/private without
        # performing an NDB get() operation, which are forbidden in Apache Beam
        # jobs.
        return base_validation.ValidationModes.STRICT


# TODO(#15613): Due to incomplete typing of apache_beam library and absences
# of stubs in Typeshed, MyPy assuming DoFn class is of type Any. Thus to avoid
# MyPy's error (Class cannot subclass 'DoFn' (has type 'Any')) , we added an
# ignore here.
@validation_decorators.AuditsExisting(
    blog_models.BlogPostModel,
    blog_models.BlogPostSummaryModel)
class ValidateModelPublishTimestamps(beam.DoFn):  # type: ignore[misc]
    """DoFn to check whether created_on and last_updated timestamps are valid.
    """

    def process(
        self, input_model: blog_models.BlogPostModel
    ) -> Iterator[
        Union[
            blog_validation_errors.InconsistentPublishTimestampsError,
            blog_validation_errors.ModelMutatedDuringJobError,
            blog_validation_errors.InconsistentPublishLastUpdatedTimestampsError
        ]
    ]:
        """Function that validates that the published timestamp of the blog post
        models is either None or is greater than created on time, is less than
        current datetime and is equal to or greater than the last updated
        timestamp.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelMutatedDuringJobError. Error for models mutated during the job.
            InconsistentTimestampsError. Error for models with inconsistent
            timestamps.
        """
        model = job_utils.clone_model(input_model)
        if model.published_on is None:
            return

        if model.created_on > (
                model.published_on + base_validation.MAX_CLOCK_SKEW_SECS):
            yield blog_validation_errors.InconsistentPublishTimestampsError(
                model)

        current_datetime = datetime.datetime.utcnow()
        if (model.published_on - base_validation.MAX_CLOCK_SKEW_SECS) > (
                current_datetime):
            yield blog_validation_errors.ModelMutatedDuringJobError(
                model)

        if (model.published_on - base_validation.MAX_CLOCK_SKEW_SECS) > (
                model.last_updated):
            yield blog_validation_errors.InconsistentPublishLastUpdatedTimestampsError(model) # pylint: disable=line-too-long


@validation_decorators.AuditsExisting(
    blog_models.BlogPostSummaryModel)
class ValidateBlogSummaryModelDomainObjectsInstances(
    base_validation.ValidateModelDomainObjectInstances[
        blog_models.BlogPostSummaryModel
    ]
):
    """Provides the validation type for validating blog post objects."""

    def _get_model_domain_object_instance(
        self, summary_model: blog_models.BlogPostSummaryModel
    ) -> blog_domain.BlogPostSummary:
        """Returns blog post domain object instance created from the model.

        Args:
            summary_model: datastore_services.Model. Entity to validate.

        Returns:
            BlogPost. A domain object to validate.
        """
        return blog_domain.BlogPostSummary(
            summary_model.id,
            summary_model.author_id,
            summary_model.title,
            summary_model.summary,
            summary_model.url_fragment,
            summary_model.tags,
            summary_model.thumbnail_filename,
            summary_model.last_updated,
            summary_model.published_on
        )

    def _get_domain_object_validation_type(
        self, unused_item: blog_models.BlogPostSummaryModel
    ) -> base_validation.ValidationModes:
        """Returns the type of domain object validation to be performed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. The type of validation mode: strict or non strict.
        """
        # TODO(#13397): Write a custom job to avoid applying strict validation
        # to private blog posts. We can't determine public/private without
        # performing an NDB get() operation, which are forbidden in Apache Beam
        # jobs.
        return base_validation.ValidationModes.STRICT


@validation_decorators.RelationshipsOf(
    blog_models.BlogPostModel)
def blog_post_model_relationships(
    model: Type[blog_models.BlogPostModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[
            blog_models.BlogPostSummaryModel,
            blog_models.BlogPostRightsModel,
            user_models.UserSettingsModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield (model.id, [blog_models.BlogPostSummaryModel])
    yield (model.id, [blog_models.BlogPostRightsModel])
    yield (model.author_id, [user_models.UserSettingsModel])


@validation_decorators.RelationshipsOf(
    blog_models.BlogPostSummaryModel)
def blog_post_summary_model_relationships(
    model: Type[blog_models.BlogPostSummaryModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[
            blog_models.BlogPostModel,
            blog_models.BlogPostRightsModel,
            user_models.UserSettingsModel
        ]]]
    ]
]:
    """Yields how the properties of the model relates to the ID of others."""
    yield (model.id, [blog_models.BlogPostModel])
    yield (model.id, [blog_models.BlogPostRightsModel])
    yield (model.author_id, [user_models.UserSettingsModel])


@validation_decorators.RelationshipsOf(
    blog_models.BlogPostRightsModel)
def blog_post_rights_model_relationships(
    model: Type[blog_models.BlogPostRightsModel]
) -> Iterator[
    Tuple[
        model_property.PropertyType,
        List[Type[Union[
            blog_models.BlogPostModel,
            blog_models.BlogPostSummaryModel,
            user_models.UserSettingsModel
        ]]]
    ]]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostModel]
    yield model.id, [blog_models.BlogPostSummaryModel]
    yield model.editor_ids, [user_models.UserSettingsModel]
