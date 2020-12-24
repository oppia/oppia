# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.storage.auth.auth_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils

auth_models, base_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.base_model]))


class UserIdByFirebaseAuthIdModelTests(test_utils.GenericTestBase):
    """Tests for auth_models.UserIdByFirebaseAuthIdModel."""

    NONEXISTENT_AUTH_METHOD_NAME = 'auth_method_x'
    NONEXISTENT_USER_ID = 'id_x'
    NONREGISTERED_AUTH_ID = 'auth_id_x'
    USER_ID = 'user_id'
    USER_AUTH_ID = 'auth_id'
    PROFILE_ID = 'profile_id'
    PROFILE_2_ID = 'profile_2_id'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserIdByFirebaseAuthIdModelTests, self).setUp()

        auth_models.UserIdByFirebaseAuthIdModel(
            id=self.USER_AUTH_ID, user_id=self.USER_ID).put()

    def test_get_deletion_policy_is_delete_at_end(self):
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(self):
        # Deleting a full user.
        auth_models.UserIdByFirebaseAuthIdModel.apply_deletion_policy(
            self.USER_ID)
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get(
                self.USER_ID, strict=False))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(self):
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get(
                self.NONEXISTENT_USER_ID, strict=False))
        auth_models.UserIdByFirebaseAuthIdModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_existing_user_id_is_true(self):
        self.assertTrue(
            auth_models.UserIdByFirebaseAuthIdModel.has_reference_to_user_id(
                self.USER_ID))

    def test_has_reference_to_non_existing_user_id_is_false(self):
        self.assertFalse(
            auth_models.UserIdByFirebaseAuthIdModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID))

    def test_get_by_user_id_for_correct_user_id(self):
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel.get(
                self.USER_AUTH_ID),
            auth_models.UserIdByFirebaseAuthIdModel.get_by_user_id(
                self.USER_ID))

    def test_get_model_association_to_user(self):
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self):
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            })
