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

"""Error classes for user model audits."""

from __future__ import annotations

from core import utils
from core.jobs.types import base_validation_errors
from core.platform import models

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

base_models, user_models = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.USER]
)


class ModelIncorrectKeyError(base_validation_errors.BaseValidationError):
    """Error class for incorrect key in PendingDeletionRequestModel."""

    def __init__(
        self,
        model: user_models.PendingDeletionRequestModel,
        incorrect_keys: List[str],
    ) -> None:
        message = 'contains keys %s are not allowed' % (incorrect_keys)
        super().__init__(message, model)


class DraftChangeListLastUpdatedNoneError(
    base_validation_errors.BaseValidationError
):
    """Error class for models with draft change list but draft change list
    last_updated is None.
    """

    def __init__(self, model: user_models.ExplorationUserDataModel) -> None:
        message = (
            'draft change list %s exists but draft change list '
            'last updated is None' % model.draft_change_list
        )
        super().__init__(message, model)


class DraftChangeListLastUpdatedInvalidError(
    base_validation_errors.BaseValidationError
):
    """Error class for models with invalid draft change list last_updated."""

    def __init__(self, model: user_models.ExplorationUserDataModel) -> None:
        message = (
            'draft change list last updated %s is greater than the time '
            'when job was run' % model.draft_change_list_last_updated
        )
        super().__init__(message, model)


class InvalidExpUserLastPlaythroughIdError(
    base_validation_errors.BaseValidationError
):
    """Error class for ExpUserLastPlaythroughModels whose ID does not match
    their user_id and exploration_id.
    """

    def __init__(self, model: user_models.ExpUserLastPlaythroughModel) -> None:
        message = 'id should be "%s.%s", i.e. "[user_id].[exploration_id]"' % (
            model.user_id,
            model.exploration_id,
        )
        super().__init__(message, model)


class LastPlayedExpVersionTooHighError(
    base_validation_errors.BaseValidationError
):
    """Error class for ExpUserLastPlaythroughModels whose last played version
    is greater than the current version of the exploration.
    """

    def __init__(
        self,
        model: user_models.ExpUserLastPlaythroughModel,
        current_exp_version: int,
    ) -> None:
        message = (
            'last_played_exp_version %s is greater than the current version '
            '%s of exploration %s'
            % (
                model.last_played_exp_version,
                current_exp_version,
                model.exploration_id,
            )
        )
        super().__init__(message, model)


class LastPlayedExpVersionNotFoundError(
    base_validation_errors.BaseValidationError
):
    """Error class for ExpUserLastPlaythroughModels whose last played version
    of the exploration cannot be found.
    """

    def __init__(self, model: user_models.ExpUserLastPlaythroughModel) -> None:
        message = 'version %s of exploration %s could not be found' % (
            model.last_played_exp_version,
            model.exploration_id,
        )
        super().__init__(message, model)


class LastPlayedStateNotInExplorationError(
    base_validation_errors.BaseValidationError
):
    """Error class for ExpUserLastPlaythroughModels whose last played state
    is not a state of the exploration at the last played version.
    """

    def __init__(self, model: user_models.ExpUserLastPlaythroughModel) -> None:
        message = (
            'last_played_state_name %s is not a state of version %s of '
            'exploration %s'
            % (
                utils.quoted(model.last_played_state_name),
                model.last_played_exp_version,
                model.exploration_id,
            )
        )
        super().__init__(message, model)


class ExplorationNotMarkedIncompleteError(
    base_validation_errors.BaseValidationError
):
    """Error class for ExpUserLastPlaythroughModels whose exploration is not
    in the user's list of incomplete explorations.
    """

    def __init__(self, model: user_models.ExpUserLastPlaythroughModel) -> None:
        message = (
            'exploration %s is not in the incomplete explorations of user %s'
            % (model.exploration_id, model.user_id)
        )
        super().__init__(message, model)
