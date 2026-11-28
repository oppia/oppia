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

"""Tests for user domain errors."""

from __future__ import annotations

from core import utils
from core.domain import user_domain_errors
from core.tests import test_utils


class UserDomainErrorsTest(test_utils.GenericTestBase):
    """Tests for user domain error classes."""

    def test_invalid_user_id_error(self) -> None:
        error = user_domain_errors.InvalidUserIdError('Invalid user ID')
        self.assertIsInstance(error, user_domain_errors.UserDomainError)
        self.assertIsInstance(error, utils.ValidationError)
        self.assertEqual(str(error), 'Invalid user ID')

    def test_invalid_story_id_error(self) -> None:
        error = user_domain_errors.InvalidStoryIdError('Invalid story ID')
        self.assertIsInstance(error, user_domain_errors.UserDomainError)
        self.assertIsInstance(error, utils.ValidationError)
        self.assertEqual(str(error), 'Invalid story ID')

    def test_invalid_completed_node_ids_error(self) -> None:
        error = user_domain_errors.InvalidCompletedNodeIdsError(
            'Invalid completed node IDs'
        )
        self.assertIsInstance(error, user_domain_errors.UserDomainError)
        self.assertIsInstance(error, utils.ValidationError)
        self.assertEqual(str(error), 'Invalid completed node IDs')

    def test_duplicate_completed_node_ids_error(self) -> None:
        error = user_domain_errors.DuplicateCompletedNodeIdsError(
            'Duplicate node ID'
        )
        self.assertIsInstance(error, user_domain_errors.UserDomainError)
        self.assertIsInstance(error, utils.ValidationError)
        self.assertEqual(str(error), 'Duplicate node ID')
