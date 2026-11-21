# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Validation jobs for blog models."""

from __future__ import annotations

from core import utils
from core.domain import blog_domain
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    base_validation_errors,
    blog_validation_errors,
    job_run_result,
    model_property,
)
from core.platform import models

from typing import Callable, Iterator, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, blog_models, user_models

(base_models, blog_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.BLOG, models.Names.USER]
)


class BlogPostRightsModelValidationJob(base_validation_jobs.BaseValidationJob):
    """Validates BlogPostRightsModel instances."""

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        return [
            self.validate_blog_post_and_summary,
            self.validate_editor_ids,
        ]

    def validate_blog_post_and_summary(
        self, model: base_models.BaseModel
    ) -> Iterator[job_run_result.JobRunResult]:
        """Validates the blog post and blog post summary with the same ID.

        Both must exist, and their published_on must be set exactly when
        blog_post_is_published is True (publish_blog_post and
        unpublish_blog_post keep the three in sync). The author of the blog
        post must be one of the editors, unless the author ID has been
        pseudonymized: BlogPostModel is locally pseudonymized when a user is
        deleted, while wipeout removes the user from editor_ids.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelRelationshipError. The error for a missing blog post or blog
            post summary.
            InconsistentBlogPostPublishedStatusError. The error for a published
            status that disagrees with the blog post or its summary.
            BlogPostAuthorNotEditorError. The error for an author who is not
            an editor.
        """
        if not isinstance(model, blog_models.BlogPostRightsModel):
            return

        id_property = model_property.ModelProperty(
            blog_models.BlogPostRightsModel,
            blog_models.BlogPostRightsModel.id,
        )
        blog_post_model = blog_models.BlogPostModel.get(model.id, strict=False)
        blog_post_summary_model = blog_models.BlogPostSummaryModel.get(
            model.id, strict=False
        )

        for target_kind, target_model in (
            ('BlogPostModel', blog_post_model),
            ('BlogPostSummaryModel', blog_post_summary_model),
        ):
            if target_model is None:
                yield base_validation_errors.ModelRelationshipError(
                    id_property=id_property,
                    model=model,
                    target_kind=target_kind,
                    target_id=model.id,
                )
            elif (
                target_model.published_on is not None
            ) != model.blog_post_is_published:
                yield (
                    blog_validation_errors.InconsistentBlogPostPublishedStatusError(
                        model, target_kind
                    )
                )

        if (
            blog_post_model is not None
            and not utils.is_pseudonymous_id(blog_post_model.author_id)
            and blog_post_model.author_id not in model.editor_ids
        ):
            yield blog_validation_errors.BlogPostAuthorNotEditorError(
                model, blog_post_model.author_id
            )

    def validate_editor_ids(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelRelationshipError]:
        """Validates that every editor has a UserSettingsModel.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelRelationshipError. The error for each editor without a
            UserSettingsModel.
        """
        if not isinstance(model, blog_models.BlogPostRightsModel):
            return

        user_settings_models = user_models.UserSettingsModel.get_multi(
            model.editor_ids
        )
        for editor_id, user_settings_model in zip(
            model.editor_ids, user_settings_models
        ):
            if user_settings_model is None:
                yield base_validation_errors.ModelRelationshipError(
                    id_property=model_property.ModelProperty(
                        blog_models.BlogPostRightsModel,
                        blog_models.BlogPostRightsModel.editor_ids,
                    ),
                    model=model,
                    target_kind='UserSettingsModel',
                    target_id=editor_id,
                )

    def validate_domain_object(
        self, model: base_models.BaseModel
    ) -> Iterator[base_validation_errors.ModelDomainObjectValidateError]:
        """Validates the BlogPostRights domain object for the model.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            ModelDomainObjectValidateError. The domain validation error.
        """
        if not isinstance(model, blog_models.BlogPostRightsModel):
            return

        blog_post_rights = blog_domain.BlogPostRights(
            model.id, model.editor_ids, model.blog_post_is_published
        )
        try:
            blog_post_rights.validate()
        except utils.ValidationError as error:
            yield base_validation_errors.ModelDomainObjectValidateError(
                model, str(error)
            )

    def get_validate_domain_object_fn(
        self,
    ) -> Callable[
        [base_models.BaseModel], Iterator[job_run_result.JobRunResult]
    ]:
        return self.validate_domain_object
