# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for topic domain objects."""

from __future__ import annotations

from core import feconf
from core import utils
from core.domain import wipeout_domain
from core.tests import test_utils


class PendingDeletionRequestUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

    def test_create_default_pending_deletion_request(self) -> None:
        """Tests the create_default_topic() function."""
        default_pending_deletion = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_id_a, 'username', 'a@example.com'))
        self.assertEqual(default_pending_deletion.user_id, self.user_id_a)
        self.assertEqual(default_pending_deletion.email, 'a@example.com')
        self.assertIsNone(
            default_pending_deletion.normalized_long_term_username)
        self.assertEqual(default_pending_deletion.deletion_complete, False)
        self.assertEqual(
            default_pending_deletion.pseudonymizable_entity_mappings, {})

    def test_validate_fails_for_wrong_key_in_activity_mappings(self) -> None:
        """Tests the create_default_topic() function."""
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_id_a, 'username', 'a@example.com'))
        pending_deletion_request.pseudonymizable_entity_mappings = {
            'wrong_key': {}
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'pseudonymizable_entity_mappings contain wrong key'
        ):
            pending_deletion_request.validate()

    def test_validate_succeeds_for_empty_pseudonymizable_entity_mappings(
        self
    ) -> None:
        """Tests the validate() function when pseudonymizable_entity_mappings
        is empty.
        """
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_id_a, 'username', 'a@example.com'))
        # No exception should be raised as the pseudonymizable_entity_mappings
        # is empty.
        pending_deletion_request.validate()

    def test_validate_success_for_correct_key_in_activity_mappings(
        self
    ) -> None:
        """Tests the validate() function with correct keys."""
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_id_a, 'username', 'a@example.com'))
        valid_key = feconf.ValidModelNames.ACTIVITY.value
        pending_deletion_request.pseudonymizable_entity_mappings = {
            valid_key: {}
        }
        # No exception should be raised when the key is valid.
        pending_deletion_request.validate()
