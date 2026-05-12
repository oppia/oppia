# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Validation Jobs for user models."""

from __future__ import annotations

from core.domain import user_services
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import (
    base_validation_errors,
    job_run_result,
    user_validation_errors,
)
from core.platform import models

from typing import Callable, Iterator, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class GetUsersWithInvalidBioJob(base_validation_jobs.BaseValidationJob):
    """Validates that no user has a null bio
    or a bio with length greater than 2000.
    """

    def get_validation_fns(
        self,
    ) -> List[
        Callable[[base_models.BaseModel], Iterator[job_run_result.JobRunResult]]
    ]:
        return [self.validate_user_bio]

    def validate_user_bio(
        self, model: base_models.BaseModel
    ) -> Iterator[user_validation_errors.InvalidUserBioError]:
        """Yields an error if the model has a null or too-long bio.

        Args:
            model: BaseModel. The model to validate.

        Yields:
            InvalidUserBioError. If the user bio is invalid.
        """
        if not isinstance(model, user_models.UserSettingsModel):
            return
        if not isinstance(model.user_bio, str) or len(model.user_bio) > 2000:
            yield user_validation_errors.InvalidUserBioError(model)

    def get_validate_domain_object_fn(
        self,
    ) -> Callable[
        [base_models.BaseModel], Iterator[job_run_result.JobRunResult]
    ]:
        def validate_domain_object(
            model: base_models.BaseModel,
        ) -> Iterator[job_run_result.JobRunResult]:
            if not isinstance(model, user_models.UserSettingsModel):
                return
            try:
                user_services._get_user_settings_from_model(  # pylint: disable=protected-access
                    model
                ).validate()
            except Exception as e:
                yield base_validation_errors.ModelDomainObjectValidateError(
                    model, str(e)
                )

        return validate_domain_object
