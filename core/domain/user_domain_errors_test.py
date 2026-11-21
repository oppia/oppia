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

"""Tests for user domain error classes."""

from __future__ import annotations

from core import utils
from core.domain import user_domain_errors
from core.tests import test_utils


class ExpUserLastPlaythroughDomainErrorsTests(test_utils.GenericTestBase):
    """Tests for ExpUserLastPlaythrough domain error classes."""

    def test_errors_are_validation_errors(self) -> None:
        self.assertTrue(
            issubclass(
                user_domain_errors.ExpUserLastPlaythroughDomainError,
                utils.ValidationError,
            )
        )
        for error_class in (
            user_domain_errors.InvalidLastPlaythroughUserIdError,
            user_domain_errors.InvalidLastPlaythroughExplorationIdError,
            user_domain_errors.InvalidLastPlayedExpVersionError,
            user_domain_errors.InvalidLastPlayedStateNameError,
        ):
            self.assertTrue(
                issubclass(
                    error_class,
                    user_domain_errors.ExpUserLastPlaythroughDomainError,
                )
            )

    def test_invalid_user_id_error_message(self) -> None:
        self.assertEqual(
            str(user_domain_errors.InvalidLastPlaythroughUserIdError(123)),
            'Expected user_id to be a valid user ID, received 123',
        )

    def test_invalid_exploration_id_error_message(self) -> None:
        self.assertEqual(
            str(
                user_domain_errors.InvalidLastPlaythroughExplorationIdError(
                    None
                )
            ),
            'Expected exploration_id to be a non-empty string, received None',
        )

    def test_invalid_last_played_exp_version_error_message(self) -> None:
        self.assertEqual(
            str(user_domain_errors.InvalidLastPlayedExpVersionError(None)),
            'Expected last_played_exp_version to be an integer >= 1, '
            'received None',
        )

    def test_invalid_last_played_state_name_error_message(self) -> None:
        self.assertEqual(
            str(user_domain_errors.InvalidLastPlayedStateNameError(123)),
            'Expected last_played_state_name to be a non-empty string, '
            'received 123',
        )
