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
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class InvalidExplorationIdError(base_validation_errors.BaseValidationError):
    """Error class for invalid exploration reference."""

    def __init__(
        self, model: stats_models.AnswerSubmittedEventLogEntryModel
    ) -> None:
        message = f'exp_id={model.exp_id} with exp_version={model.exp_version} does not correspond to a valid ExplorationModel'
        super().__init__(message, model)


class ExplorationDoesNotExistError(base_validation_errors.BaseValidationError):
    """Error class for invalid exploration reference."""

    def __init__(
        self, model: stats_models.AnswerSubmittedEventLogEntryModel
    ) -> None:
        message = f'exp_id {model.exp_id} does not correspond to a valid ExplorationModel'
        super().__init__(message, model)


class DomainValidationError(base_validation_errors.BaseValidationError):
    """Error class for domain validation failures."""

    def __init__(
        self,
        error_message: str,
        model: stats_models.AnswerSubmittedEventLogEntryModel,
    ) -> None:
        message = f'Domain validation failed with error: {error_message}'
        super().__init__(message, model)


class ExpVersionOutOfRangeError(base_validation_errors.BaseValidationError):
    """Error class when exp_version field is out of range."""

    def __init__(
        self,
        current_exp_version: int,
        model: stats_models.AnswerSubmittedEventLogEntryModel,
    ) -> None:
        message = (
            'Expected 1 <= exp_version <= current exploration version %s, received %s'
            % (current_exp_version, model.exp_version)
        )
        super().__init__(message, model)


class InvalidStateNameError(base_validation_errors.BaseValidationError):
    """Error class for invalid state name."""

    def __init__(
        self,
        model: stats_models.AnswerSubmittedEventLogEntryModel,
    ) -> None:
        message = (
            'Expected state_name to be a valid state name as per '
            'retrieved exploration by exp_id, received %s' % model.state_name
        )
        super().__init__(message, model)
