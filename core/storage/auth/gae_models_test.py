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

from __future__ import annotations

from core import feconf
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import auth_models
    from mypy_imports import base_models

(auth_models, base_models) = (
    models.Registry.import_models([models.Names.AUTH, models.Names.BASE_MODEL]))


class UserAuthDetailsModelTests(test_utils.GenericTestBase):
    """Tests for UserAuthDetailsModel."""

    NONEXISTENT_AUTH_METHOD_NAME = 'auth_method_x'
    NONEXISTENT_USER_ID = 'id_x'
    NONREGISTERED_GAE_ID = 'auth_id_x'
    USER_ID = 'user_id'
    USER_GAE_ID = 'auth_id'
    FIREBASE_USER_ID = 'firebase_user_id'
    FIREBASE_AUTH_ID = 'firebase_auth_id'
    PROFILE_ID = 'profile_id'
    PROFILE_2_ID = 'profile_2_id'

    def setUp(self) -> None:
        """Set up user models in storage for use in testing."""
        super(UserAuthDetailsModelTests, self).setUp()

        auth_models.UserAuthDetailsModel(
            id=self.USER_ID,
            gae_id=self.USER_GAE_ID,
        ).put()
        auth_models.UserAuthDetailsModel(
            id=self.FIREBASE_USER_ID,
            firebase_auth_id=self.FIREBASE_AUTH_ID,
        ).put()
        auth_models.UserAuthDetailsModel(
            id=self.PROFILE_ID,
            gae_id=None,
            parent_user_id=self.USER_ID
        ).put()
        auth_models.UserAuthDetailsModel(
            id=self.PROFILE_2_ID,
            gae_id=None,
            parent_user_id=self.USER_ID
        ).put()

    def test_get_deletion_policy_is_delete_at_end(self) -> None:
        self.assertEqual(
            auth_models.UserAuthDetailsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(
            self
    ) -> None:
        # Deleting a full user.
        auth_models.UserAuthDetailsModel.apply_deletion_policy(self.USER_ID)
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id(
            self.USER_ID))

        # Deleting a profile user.
        auth_models.UserAuthDetailsModel.apply_deletion_policy(self.PROFILE_ID)
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id(
            self.PROFILE_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(
            self
    ) -> None:
        self.assertIsNone(auth_models.UserAuthDetailsModel.get_by_id(
            self.NONEXISTENT_USER_ID))
        auth_models.UserAuthDetailsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_existing_user_id_is_true(self) -> None:
        # For a full user.
        self.assertTrue(
            auth_models.UserAuthDetailsModel.has_reference_to_user_id(
                self.USER_ID)
        )

        # For a profile user.
        self.assertTrue(
            auth_models.UserAuthDetailsModel.has_reference_to_user_id(
                self.PROFILE_ID)
        )

    def test_has_reference_to_non_existing_user_id_is_false(self) -> None:
        self.assertFalse(
            auth_models.UserAuthDetailsModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID)
        )

    def test_get_by_auth_id_with_invalid_auth_method_name_is_none(self) -> None:
        # For registered auth ID.
        self.assertIsNone(
            auth_models.UserAuthDetailsModel.get_by_auth_id(
                self.NONEXISTENT_AUTH_METHOD_NAME, self.USER_GAE_ID)
        )

        # For non registered auth ID.
        self.assertIsNone(
            auth_models.UserAuthDetailsModel.get_by_auth_id(
                self.NONEXISTENT_AUTH_METHOD_NAME, self.NONREGISTERED_GAE_ID)
        )

    def test_get_by_auth_id_for_unregistered_auth_id_is_none(self) -> None:
        self.assertIsNone(
            auth_models.UserAuthDetailsModel.get_by_auth_id(
                feconf.GAE_AUTH_PROVIDER_ID, self.NONREGISTERED_GAE_ID))

    def test_get_by_auth_id_for_correct_user_id_auth_id_mapping(self) -> None:
        self.assertEqual(
            auth_models.UserAuthDetailsModel.get_by_id(self.USER_ID),
            auth_models.UserAuthDetailsModel.get_by_auth_id(
                feconf.GAE_AUTH_PROVIDER_ID, self.USER_GAE_ID)
        )

    def test_get_by_auth_id_registered_auth_id_returns_no_profile_user(
            self
    ) -> None:
        self.assertNotEqual(
            auth_models.UserAuthDetailsModel.get_by_id(self.PROFILE_ID),
            auth_models.UserAuthDetailsModel.get_by_auth_id(
                feconf.GAE_AUTH_PROVIDER_ID, self.USER_GAE_ID)
        )

    def test_get_by_firebase_auth_id_returns_correct_profile_user(self) -> None:
        self.assertEqual(
            auth_models.UserAuthDetailsModel.get_by_id(self.FIREBASE_USER_ID),
            auth_models.UserAuthDetailsModel.get_by_auth_id(
                feconf.FIREBASE_AUTH_PROVIDER_ID, self.FIREBASE_AUTH_ID))


class UserIdentifiersModelTests(test_utils.GenericTestBase):
    """Tests for UserIdentifiersModel."""

    NONEXISTENT_AUTH_METHOD_NAME = 'auth_method_x'
    NONEXISTENT_USER_ID = 'id_x'
    NONREGISTERED_GAE_ID = 'auth_id_x'
    USER_ID = 'user_id'
    USER_GAE_ID = 'auth_id'
    PROFILE_ID = 'profile_id'
    PROFILE_2_ID = 'profile_2_id'

    def setUp(self) -> None:
        """Set up user models in storage for use in testing."""
        super(UserIdentifiersModelTests, self).setUp()

        auth_models.UserIdentifiersModel(
            id=self.USER_GAE_ID,
            user_id=self.USER_ID,
        ).put()

    def test_get_deletion_policy_is_delete_at_end(self) -> None:
        self.assertEqual(
            auth_models.UserIdentifiersModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(
            self
    ) -> None:
        # Deleting a full user.
        auth_models.UserIdentifiersModel.apply_deletion_policy(self.USER_ID)
        self.assertIsNone(auth_models.UserIdentifiersModel.get_by_id(
            self.USER_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(
            self
    ) -> None:
        self.assertIsNone(auth_models.UserIdentifiersModel.get_by_id(
            self.NONEXISTENT_USER_ID))
        auth_models.UserIdentifiersModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_existing_user_id_is_true(self) -> None:
        # For a full user.
        self.assertTrue(
            auth_models.UserIdentifiersModel.has_reference_to_user_id(
                self.USER_ID)
        )

    def test_has_reference_to_non_existing_user_id_is_false(self) -> None:
        self.assertFalse(
            auth_models.UserIdentifiersModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID)
        )

    def test_get_by_gae_id_for_correct_user_id(self) -> None:
        self.assertEqual(
            auth_models.UserIdentifiersModel.get_by_id(self.USER_GAE_ID),
            auth_models.UserIdentifiersModel.get_by_gae_id(self.USER_GAE_ID)
        )

    def test_get_by_gae_id_for_correct_user_id_marked_as_deleted(self) -> None:
        user_identifiers_model = (
            auth_models.UserIdentifiersModel.get_by_id(self.USER_GAE_ID))
        user_identifiers_model.deleted = True
        user_identifiers_model.update_timestamps()
        user_identifiers_model.put()
        self.assertEqual(
            user_identifiers_model,
            auth_models.UserIdentifiersModel.get_by_gae_id(self.USER_GAE_ID)
        )

    def test_get_by_user_id_for_correct_user_id(self) -> None:
        self.assertEqual(
            auth_models.UserIdentifiersModel.get_by_id(self.USER_GAE_ID),
            auth_models.UserIdentifiersModel.get_by_user_id(self.USER_ID)
        )


class UserIdByFirebaseAuthIdModelTests(test_utils.GenericTestBase):
    """Tests for auth_models.UserIdByFirebaseAuthIdModel."""

    NONEXISTENT_AUTH_METHOD_NAME = 'auth_method_x'
    NONEXISTENT_USER_ID = 'id_x'
    NONREGISTERED_AUTH_ID = 'auth_id_x'
    USER_ID = 'user_id'
    USER_AUTH_ID = 'auth_id'
    PROFILE_ID = 'profile_id'
    PROFILE_2_ID = 'profile_2_id'

    def setUp(self) -> None:
        """Set up user models in storage for use in testing."""
        super(UserIdByFirebaseAuthIdModelTests, self).setUp()

        auth_models.UserIdByFirebaseAuthIdModel(
            id=self.USER_AUTH_ID, user_id=self.USER_ID).put()

    def test_get_deletion_policy_is_delete_at_end(self) -> None:
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(
            self
    ) -> None:
        # Deleting a full user.
        auth_models.UserIdByFirebaseAuthIdModel.apply_deletion_policy(
            self.USER_ID)
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get(
                self.USER_ID, strict=False))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(
            self
    ) -> None:
        self.assertIsNone(
            auth_models.UserIdByFirebaseAuthIdModel.get(
                self.NONEXISTENT_USER_ID, strict=False))
        auth_models.UserIdByFirebaseAuthIdModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_existing_user_id_is_true(self) -> None:
        self.assertTrue(
            auth_models.UserIdByFirebaseAuthIdModel.has_reference_to_user_id(
                self.USER_ID))

    def test_has_reference_to_non_existing_user_id_is_false(self) -> None:
        self.assertFalse(
            auth_models.UserIdByFirebaseAuthIdModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID))

    def test_get_by_user_id_for_correct_user_id(self) -> None:
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel.get(
                self.USER_AUTH_ID),
            auth_models.UserIdByFirebaseAuthIdModel.get_by_user_id(
                self.USER_ID))

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            auth_models.UserIdByFirebaseAuthIdModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            })


class FirebaseSeedModelTests(test_utils.GenericTestBase):
    """Tests for auth_models.FirebaseSeedModel."""

    USER_ID = 'user_id'

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            auth_models.FirebaseSeedModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            auth_models.FirebaseSeedModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_has_reference_to_existing_user_id(self) -> None:
        self.assertFalse(
            auth_models.FirebaseSeedModel.has_reference_to_user_id(
                self.USER_ID))
