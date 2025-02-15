from datetime import datetime, timezone
from core.utils.datetime_utils import get_current_datetime_utc, from_milliseconds_utc
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
from core.storage.base_model.gae_models import get_current_datetime_utc

import apache_beam as beam
from typing import Iterator, List, Tuple, Type, Union
MYPY = False
if MYPY:
    from mypy_imports import blog_models
    from mypy_imports import user_models
blog_models, user_models = models.Registry.import_models([models.Names.BLOG,
    models.Names.USER])


@validation_decorators.AuditsExisting(blog_models.BlogPostModel)
class ValidateBlogPostModelDomainObjectsInstances(base_validation.
    ValidateModelDomainObjectInstances[blog_models.BlogPostModel]):
    """Provides the validation type for validating blog post objects."""

    def _get_model_domain_object_instance(self, blog_post_model:
        blog_models.BlogPostModel) ->blog_domain.BlogPost:
        """Returns blog post domain object instance created from the model.

        Args:
            blog_post_model: datastore_services.Model. Entity to validate.

        Returns:
            BlogPost. A domain object to validate.
        """
        return blog_domain.BlogPost(blog_post_model.id, blog_post_model.
            author_id, blog_post_model.title, blog_post_model.content,
            blog_post_model.url_fragment, blog_post_model.tags,
            blog_post_model.thumbnail_filename, blog_post_model.
            last_updated, blog_post_model.published_on)

    def _get_domain_object_validation_type(self, blog_post_model:
        blog_models.BlogPostModel) ->base_validation.ValidationModes:
        """Returns the type of domain object validation to be performed.

        Args:
            blog_post_model: datastore_services.Model. Entity to validate.

        Returns:
            str. The type of validation mode: strict or non strict.
        """
        if blog_post_model.published_on is None:
            return base_validation.ValidationModes.NON_STRICT
        return base_validation.ValidationModes.STRICT


@validation_decorators.AuditsExisting(blog_models.BlogPostModel,
    blog_models.BlogPostSummaryModel)
class ValidateBlogModelTimestamps(beam.DoFn):
    """DoFn to check whether created_on, last_updated and published_on
    timestamps are valid for both blog post models and blog post summary models.
    """

    def process(self, input_model: Union[blog_models.BlogPostModel,
        blog_models.BlogPostSummaryModel]) ->Iterator[Union[
        blog_validation_errors.InconsistentLastUpdatedTimestampsError,
        blog_validation_errors.ModelMutatedDuringJobErrorForLastUpdated,
        blog_validation_errors.ModelMutatedDuringJobErrorForPublishedOn,
        blog_validation_errors.InconsistentPublishLastUpdatedTimestampsError]]:
        """Function that validates that the last updated timestamp of the blog
        post models is greater than created on time, is less than current
        datetime and is equal to or greater than the published on timestamp.
        For blog posts migrated from 'Medium', published_on will be less than
        created_on time and last_updated time. Therefore published_on can be
        less than or greater than created_on time and less than or equal to
        last_updated time for blog posts.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Yields:
            ModelMutatedDuringJobError. Error for models mutated during the job.
            InconsistentTimestampsError. Error for models with inconsistent
            timestamps.
        """
        model = job_utils.clone_model(input_model)
        if (model.created_on > model.last_updated + base_validation.
            MAX_CLOCK_SKEW_SECS):
            yield blog_validation_errors.InconsistentLastUpdatedTimestampsError(
                model)

        current_datetime = get_current_datetime_utc()
        if model.published_on:
            if (model.published_on - base_validation.MAX_CLOCK_SKEW_SECS >
                current_datetime):
                yield blog_validation_errors.ModelMutatedDuringJobErrorForPublishedOn(
                    model)
            if (model.published_on - base_validation.MAX_CLOCK_SKEW_SECS >
                model.last_updated):
                yield blog_validation_errors.InconsistentPublishLastUpdatedTimestampsError(
                    model)
        if (model.last_updated - base_validation.MAX_CLOCK_SKEW_SECS >
            current_datetime):
            yield blog_validation_errors.ModelMutatedDuringJobErrorForLastUpdated(
                model)


@validation_decorators.AuditsExisting(blog_models.BlogPostSummaryModel)
class ValidateBlogSummaryModelDomainObjectsInstances(base_validation.
    ValidateModelDomainObjectInstances[blog_models.BlogPostSummaryModel]):
    """Provides the validation type for validating blog post objects."""

    def _get_model_domain_object_instance(self, summary_model: blog_models.
        BlogPostSummaryModel) ->blog_domain.BlogPostSummary:
        """Returns blog post domain object instance created from the model.

        Args:
            summary_model: datastore_services.Model. Entity to validate.

        Returns:
            BlogPost. A domain object to validate.
        """
        return blog_domain.BlogPostSummary(summary_model.id, summary_model.
            author_id, summary_model.title, summary_model.summary,
            summary_model.url_fragment, summary_model.tags, summary_model.
            thumbnail_filename, summary_model.last_updated, summary_model.
            published_on)

    def _get_domain_object_validation_type(self, blog_post_summary:
        blog_models.BlogPostSummaryModel) ->base_validation.ValidationModes:
        """Returns the type of domain object validation to be performed.

        Args:
            blog_post_summary: datastore_services.Model. Entity to validate.

        Returns:
            str. The type of validation mode: strict or non strict.
        """
        if blog_post_summary.published_on is None:
            return base_validation.ValidationModes.NON_STRICT
        return base_validation.ValidationModes.STRICT


@validation_decorators.RelationshipsOf(blog_models.BlogPostModel)
def blog_post_model_relationships(model: Type[blog_models.BlogPostModel]
    ) ->Iterator[Tuple[model_property.PropertyType, List[Type[Union[
    blog_models.BlogPostSummaryModel, blog_models.BlogPostRightsModel,
    user_models.UserSettingsModel]]]]]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostSummaryModel]
    yield model.id, [blog_models.BlogPostRightsModel]
    yield model.author_id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(blog_models.BlogPostSummaryModel)
def blog_post_summary_model_relationships(model: Type[blog_models.
    BlogPostSummaryModel]) ->Iterator[Tuple[model_property.PropertyType,
    List[Type[Union[blog_models.BlogPostModel, blog_models.
    BlogPostRightsModel, user_models.UserSettingsModel]]]]]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostModel]
    yield model.id, [blog_models.BlogPostRightsModel]
    yield model.author_id, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(blog_models.BlogPostRightsModel)
def blog_post_rights_model_relationships(model: Type[blog_models.
    BlogPostRightsModel]) ->Iterator[Tuple[model_property.PropertyType,
    List[Type[Union[blog_models.BlogPostModel, blog_models.
    BlogPostSummaryModel, user_models.UserSettingsModel]]]]]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [blog_models.BlogPostModel]
    yield model.id, [blog_models.BlogPostSummaryModel]
    yield model.editor_ids, [user_models.UserSettingsModel]


@validation_decorators.RelationshipsOf(blog_models.BlogAuthorDetailsModel)
def blog_author_details_model_relationships(model: Type[blog_models.
    BlogAuthorDetailsModel]) ->Iterator[Tuple[model_property.PropertyType,
    List[Type[user_models.UserSettingsModel]]]]:
    """Yields how the properties of the model relates to the ID of others."""
    yield model.author_id, [user_models.UserSettingsModel]