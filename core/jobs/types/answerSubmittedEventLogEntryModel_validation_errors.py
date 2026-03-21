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

"""Error classes for AnswerSubmittedEventLogEntryModel audits."""

from __future__ import annotations

from core.jobs.types import base_validation_errors
from core.platform import models


MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class InvalidExplorationIdError(base_validation_errors.BaseValidationError):
    """Error class for invalid exploration reference."""

    def __init__(self, model: base_models.BaseModel) -> None:
        message = f'exp_id {model.exp_id} does not correspond to a valid ExplorationModel'
        super().__init__(message, model)


class InvalidEntityIdFormatError(base_validation_errors.BaseValidationError):
    """Error class for incorrect entity id format."""

    def __init__(self, model: base_models.BaseModel) -> None:
        message = (
            f'Entity id {model.id} does not match required format '
            '"[timestamp]:[exp_id]:[session_id]"'
        )
        super().__init__(message, model)


class EntityIdModelMismatchError(base_validation_errors.BaseValidationError):
    """Error class when entity_id fields do not match model fields."""

    def __init__(self, model: base_models.BaseModel) -> None:
        message = (
            f'Entity id {model.id} does not match model fields '
            f'exp_id={model.exp_id}, session_id={model.session_id}'
        )
        super().__init__(message, model)


class DomainValidationError(base_validation_errors.BaseValidationError):
    """Error class for domain validation failures."""

    def __init__(
        self, error_message: str, model: base_models.BaseModel
    ) -> None:
        message = f'Domain validation failed with error: {error_message}'
        super().__init__(message, model)
