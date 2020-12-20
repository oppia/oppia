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

"""Tests for the Firebase Authentication platform services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib

from core.platform.auth import firebase_auth_services
from core.storage.base_model import gae_models as base_model
from core.tests import test_utils

import firebase_admin
import webapp2


class FirebaseAuthServicesPublicApiTest(test_utils.TestBase):
    """Test cases for the public Firebase-specific APIs."""

    @contextlib.contextmanager
    def swap_app_setup_and_teardown(self):
        """Mocks the Firebase SDK to always produce a successful app."""
        initialize_app_swap = self.swap_to_always_return(
            firebase_admin, 'initialize_app', value=object())
        delete_app_swap = self.swap_to_always_return(
            firebase_admin, 'delete_app')
        with initialize_app_swap, delete_app_swap:
            yield

    @contextlib.contextmanager
    def swap_verify_to_always_accept_tokens(self, **claims):
        """Mocks the Firebase SDK to always return claims for tokens."""
        if not claims:
            claims = {'sub': '123'}
        initialize_app_swap = self.swap_app_setup_and_teardown()
        auth_context = firebase_auth_services.acquire_auth_context()
        verify_id_token_swap = self.swap_to_always_return(
            firebase_admin.auth, 'verify_id_token', value=claims)
        with initialize_app_swap, auth_context, verify_id_token_swap:
            yield

    @contextlib.contextmanager
    def swap_verify_to_always_reject_tokens(self, exception_obj=Exception):
        """Mocks the Firebase SDK to always raise when inspecting tokens."""
        initialize_app_swap = self.swap_app_setup_and_teardown()
        auth_context = firebase_auth_services.acquire_auth_context()
        verify_id_token_swap = self.swap_to_always_raise(
            firebase_admin.auth, 'verify_id_token', exception_obj=exception_obj)
        with initialize_app_swap, auth_context, verify_id_token_swap:
            yield

    def make_response(self, auth_header=None):
        """Returns a webapp2.Response object with an optional auth header."""
        response = webapp2.Response()
        if auth_header is not None:
            response.headers['Authorization'] = auth_header
        return response

    def test_error_in_initialize_propogates(self):
        app_that_will_not_initialize = self.swap_to_always_raise(
            firebase_admin, 'initialize_app', exception_obj=Exception('error'))
        with app_that_will_not_initialize:
            with self.assertRaisesRegexp(Exception, 'error'):
                with firebase_auth_services.acquire_auth_context():
                    self.fail(msg='Context unexpectedly entered')

    def test_successful_initialization_allows_code_to_run(self):
        context_enterred = False
        with self.swap_app_setup_and_teardown():
            with firebase_auth_services.acquire_auth_context():
                context_enterred = True
        self.assertTrue(context_enterred)

    def test_verify_accepted_token(self):
        with self.swap_verify_to_always_accept_tokens(sub='123'):
            self.assertEqual(
                firebase_auth_services.get_verified_sub(
                    self.make_response(auth_header='Bearer MOCK_JWT_VALUE')),
                '123')

    def test_verify_rejected_token(self):
        err = Exception('untrusted!')
        with self.swap_verify_to_always_reject_tokens(exception_obj=err):
            with self.assertRaisesRegexp(Exception, 'untrusted!'):
                firebase_auth_services.get_verified_sub(
                    self.make_response(auth_header='Bearer MOCK_JWT_VALUE'))

    def test_verify_token_without_auth_header(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'header is missing'):
                firebase_auth_services.get_verified_sub(
                    self.make_response(auth_header=None))

    def test_verify_token_with_empty_auth_header(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'prefix is missing'):
                firebase_auth_services.get_verified_sub(
                    self.make_response(auth_header=''))

    def test_verify_token_with_auth_header_missing_bearer_prefix(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'prefix is missing'):
                firebase_auth_services.get_verified_sub(
                    self.make_response(auth_header='JWT_TOKEN'))

    def test_verify_token_with_auth_header_missing_space_after_bearer(self):
        with self.swap_verify_to_always_accept_tokens():
            with self.assertRaisesRegexp(Exception, 'prefix is missing'):
                firebase_auth_services.get_verified_sub(
                    self.make_response(auth_header='BearerJWT_TOKEN'))


class UserIdByFirebaseSubModelTests(test_utils.GenericTestBase):
    """Tests for _UserIdByFirebaseSubModel."""

    NONEXISTENT_AUTH_METHOD_NAME = 'auth_method_x'
    NONEXISTENT_USER_ID = 'id_x'
    NONREGISTERED_GAE_ID = 'gae_id_x'
    USER_ID = 'user_id'
    USER_GAE_ID = 'gae_id'
    PROFILE_ID = 'profile_id'
    PROFILE_2_ID = 'profile_2_id'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserIdByFirebaseSubModelTests, self).setUp()

        firebase_auth_services._UserIdByFirebaseSubModel( # pylint: disable=protected-access
            id=self.USER_GAE_ID, user_id=self.USER_ID).put()

    def test_get_deletion_policy_is_delete_at_end(self):
        self.assertEqual(
            firebase_auth_services._UserIdByFirebaseSubModel # pylint: disable=protected-access
            .get_deletion_policy(),
            base_model.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(self):
        # Deleting a full user.
        firebase_auth_services._UserIdByFirebaseSubModel.apply_deletion_policy( # pylint: disable=protected-access
            self.USER_ID)
        self.assertIsNone(
            firebase_auth_services._UserIdByFirebaseSubModel.get_by_id( # pylint: disable=protected-access
                self.USER_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(self):
        self.assertIsNone(
            firebase_auth_services._UserIdByFirebaseSubModel.get_by_id( # pylint: disable=protected-access
                self.NONEXISTENT_USER_ID))
        firebase_auth_services._UserIdByFirebaseSubModel.apply_deletion_policy( # pylint: disable=protected-access
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_existing_user_id_is_true(self):
        self.assertTrue(
            firebase_auth_services._UserIdByFirebaseSubModel # pylint: disable=protected-access
            .has_reference_to_user_id(self.USER_ID))

    def test_has_reference_to_non_existing_user_id_is_false(self):
        self.assertFalse(
            firebase_auth_services._UserIdByFirebaseSubModel # pylint: disable=protected-access
            .has_reference_to_user_id(
                self.NONEXISTENT_USER_ID))

    def test_get_by_user_id_for_correct_user_id(self):
        self.assertEqual(
            firebase_auth_services._UserIdByFirebaseSubModel.get_by_id( # pylint: disable=protected-access
                self.USER_GAE_ID),
            firebase_auth_services._UserIdByFirebaseSubModel.get_by_user_id( # pylint: disable=protected-access
                self.USER_ID))

    def test_get_model_association_to_user(self):
        self.assertEqual(
            firebase_auth_services._UserIdByFirebaseSubModel # pylint: disable=protected-access
            .get_model_association_to_user(),
            base_model.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self):
        self.assertEqual(
            firebase_auth_services._UserIdByFirebaseSubModel # pylint: disable=protected-access
            .get_export_policy(), {
                'created_on': base_model.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_model.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_model.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_model.EXPORT_POLICY.NOT_APPLICABLE,
            })


class FirebaseSubUserIdAssociationOperationsTests(test_utils.GenericTestBase):

    def put_association(self, sub, user_id):
        """Commits the given association to storage manually."""
        firebase_auth_services._UserIdByFirebaseSubModel( # pylint: disable=protected-access
            id=sub, user_id=user_id).put()

    def test_get_association_that_exists(self):
        self.put_association('sub', 'uid')

        self.assertEqual(
            firebase_auth_services.get_user_id_from_sub('sub'), 'uid')

    def test_get_association_that_does_not_exist(self):
        self.assertIsNone(
            firebase_auth_services.get_user_id_from_sub('does_not_exist'))

    def test_get_multi_associations_that_exist(self):
        self.put_association('sub1', 'uid1')
        self.put_association('sub2', 'uid2')
        self.put_association('sub3', 'uid3')

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_subs(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', 'uid2', 'uid3'])

    def test_get_multi_associations_that_do_not_exist(self):
        self.put_association('sub1', 'uid1')
        # Mapping from sub2 -> uid2 missing.
        self.put_association('sub3', 'uid3')

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_subs(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', None, 'uid3'])

    def test_associate_new_sub_to_user_id(self):
        firebase_auth_services.associate_sub_to_user_id('sub', 'uid')

        self.assertEqual(
            firebase_auth_services.get_user_id_from_sub('sub'), 'uid')

    def test_associate_existing_sub_to_user_id_raises(self):
        firebase_auth_services.associate_sub_to_user_id('sub', 'uid')

        with self.assertRaisesRegexp(Exception, 'already mapped to user_id'):
            firebase_auth_services.associate_sub_to_user_id('sub', 'uid')

    def test_associate_multi_new_subs_to_user_ids(self):
        firebase_auth_services.associate_multi_subs_to_user_ids(
            ['sub1', 'sub2', 'sub3'], ['uid1', 'uid2', 'uid3'])

        self.assertEqual(
            firebase_auth_services.get_multi_user_ids_from_subs(
                ['sub1', 'sub2', 'sub3']),
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_with_unequal_list_lengths_raises(self):
        with self.assertRaisesRegexp(Exception, 'lists have unequal lengths'):
            firebase_auth_services.associate_multi_subs_to_user_ids(
                ['sub1'], ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_an_existing_sub_to_user_id_mapping_raises(self):
        firebase_auth_services.associate_sub_to_user_id('sub1', 'uid1')

        with self.assertRaisesRegexp(Exception, 'associations already exist'):
            firebase_auth_services.associate_multi_subs_to_user_ids(
                ['sub1', 'sub2', 'sub3'], ['uid1', 'uid2', 'uid3'])
