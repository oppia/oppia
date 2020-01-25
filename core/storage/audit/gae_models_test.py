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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(audit_models, base_models) = models.Registry.import_models(
    [models.NAMES.audit, models.NAMES.base_model])


class RoleQueryAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the RoleQueryAuditModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID = 'user_id'
    ID = 'user_id.111.update.111'
    USERNAME = 'username'
    ROLE = 'role'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(RoleQueryAuditModelUnitTests, self).setUp()

        audit_models.RoleQueryAuditModel(
            id=self.ID,
            user_id=self.USER_ID,
            intent=feconf.ROLE_ACTION_UPDATE,
            role=self.ROLE,
            username=self.USERNAME
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            audit_models.RoleQueryAuditModel
            .has_reference_to_user_id(self.USER_ID)
        )
        self.assertFalse(
            audit_models.RoleQueryAuditModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_get_user_id_migration_field(self):
        # We need to compare the field types not the field values, thus using
        # python_utils.UNICODE.
        self.assertEqual(
            python_utils.UNICODE(
                audit_models.RoleQueryAuditModel.get_user_id_migration_field()),
            python_utils.UNICODE(audit_models.RoleQueryAuditModel.user_id))

    def test_get_model(self):
        audit_model = audit_models.RoleQueryAuditModel.get(self.ID)

        self.assertEqual(audit_model.id, self.ID)
        self.assertEqual(audit_model.intent, feconf.ROLE_ACTION_UPDATE)
        self.assertEqual(audit_model.user_id, self.USER_ID)
        self.assertEqual(audit_model.role, self.ROLE)
        self.assertEqual(audit_model.username, self.USERNAME)
