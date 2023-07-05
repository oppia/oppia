# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Test for audit models."""

from __future__ import annotations

from core import feconf
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import audit_models
    from mypy_imports import base_models

(audit_models, base_models) = models.Registry.import_models(
    [models.Names.AUDIT, models.Names.BASE_MODEL])


class RoleQueryAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the RoleQueryAuditModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_id'
    ID: Final = 'user_id.111.update.111'
    USERNAME: Final = 'username'
    ROLE: Final = 'role'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        audit_models.RoleQueryAuditModel(
            id=self.ID,
            user_id=self.USER_ID,
            intent=feconf.ROLE_ACTION_ADD,
            role=self.ROLE,
            username=self.USERNAME
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_get_export_policy(self) -> None:
        sample_dict = {
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'intent': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'role': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_export_policy(),
            sample_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            audit_models.RoleQueryAuditModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            audit_models.RoleQueryAuditModel
            .has_reference_to_user_id(self.USER_ID)
        )
        self.assertFalse(
            audit_models.RoleQueryAuditModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_get_model(self) -> None:
        audit_model = audit_models.RoleQueryAuditModel.get(self.ID)

        self.assertEqual(audit_model.id, self.ID)
        self.assertEqual(audit_model.intent, feconf.ROLE_ACTION_ADD)
        self.assertEqual(audit_model.user_id, self.USER_ID)
        self.assertEqual(audit_model.role, self.ROLE)
        self.assertEqual(audit_model.username, self.USERNAME)


class UsernameChangeAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the UsernameChangeAuditModel class."""

    NONEXISTENT_COMMITTER_ID: Final = 'id_x'
    COMMITTER_ID: Final = 'committer_id'
    ID: Final = 'committer_id.111.222'
    OLD_USERNAME: Final = 'old_username'
    NEW_USERNAME: Final = 'new_username'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        audit_models.UsernameChangeAuditModel(
            id=self.ID,
            committer_id=self.COMMITTER_ID,
            old_username=self.OLD_USERNAME,
            new_username=self.NEW_USERNAME
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            audit_models.UsernameChangeAuditModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_get_export_policy(self) -> None:
        sample_dict = {
            'committer_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'old_username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'new_username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            audit_models.UsernameChangeAuditModel.get_export_policy(),
            sample_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            audit_models.UsernameChangeAuditModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            audit_models.UsernameChangeAuditModel
            .has_reference_to_user_id(self.COMMITTER_ID)
        )
        self.assertFalse(
            audit_models.UsernameChangeAuditModel
            .has_reference_to_user_id(self.NONEXISTENT_COMMITTER_ID)
        )

    def test_get_model(self) -> None:
        audit_model = audit_models.UsernameChangeAuditModel.get(self.ID)

        self.assertEqual(audit_model.id, self.ID)
        self.assertEqual(audit_model.committer_id, self.COMMITTER_ID)
        self.assertEqual(audit_model.old_username, self.OLD_USERNAME)
        self.assertEqual(audit_model.new_username, self.NEW_USERNAME)
