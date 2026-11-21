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

"""Domain error classes for user domain objects."""

from __future__ import annotations

from core import utils


class ExpUserLastPlaythroughDomainError(utils.ValidationError):
    """Base class for ExpUserLastPlaythrough domain errors."""

    pass


class InvalidLastPlaythroughUserIdError(ExpUserLastPlaythroughDomainError):
    """Error class for an invalid user id."""

    # Here we use object because user_id may receive values of any type during
    # validation (e.g., None, int, or other unexpected types). The validation
    # error message should display whatever value was provided.
    def __init__(self, user_id: object) -> None:
        message = 'Expected user_id to be a valid user ID, received %s' % (
            user_id
        )
        super().__init__(message)


class InvalidLastPlaythroughExplorationIdError(
    ExpUserLastPlaythroughDomainError
):
    """Error class for an invalid exploration id."""

    # Here we use object because exploration_id may receive values of any type
    # during validation (e.g., None, int, or other unexpected types). The
    # validation error message should display whatever value was provided.
    def __init__(self, exploration_id: object) -> None:
        message = (
            'Expected exploration_id to be a non-empty string, received %s'
            % exploration_id
        )
        super().__init__(message)


class InvalidLastPlayedExpVersionError(ExpUserLastPlaythroughDomainError):
    """Error class for an invalid last played exploration version."""

    # Here we use object because last_played_exp_version may receive values of
    # any type during validation (e.g., None, bool, or other unexpected types).
    # The validation error message should display whatever value was provided.
    def __init__(self, last_played_exp_version: object) -> None:
        message = (
            'Expected last_played_exp_version to be an integer >= 1, '
            'received %s' % last_played_exp_version
        )
        super().__init__(message)


class InvalidLastPlayedStateNameError(ExpUserLastPlaythroughDomainError):
    """Error class for an invalid last played state name."""

    # Here we use object because last_played_state_name may receive values of
    # any type during validation (e.g., None, int, or other unexpected types).
    # The validation error message should display whatever value was provided.
    def __init__(self, last_played_state_name: object) -> None:
        message = (
            'Expected last_played_state_name to be a non-empty string, '
            'received %s' % last_played_state_name
        )
        super().__init__(message)
