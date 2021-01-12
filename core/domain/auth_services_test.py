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

"""Tests for core.domain.auth_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import auth_domain
from core.domain import auth_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

import webapp2

auth_models, = models.Registry.import_models([models.NAMES.auth])


class AuthServicesTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AuthServicesTests, self).setUp()

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.full_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.auth_id = self.get_auth_id_from_email(self.NEW_USER_EMAIL)

        self.modifiable_full_user_data = user_domain.ModifiableUserData(
            'full_user_1', '12345', [constants.DEFAULT_LANGUAGE_CODE],
            None, None, user_id=self.full_user_id)
        self.modifiable_profile_user_data = [
            user_domain.ModifiableUserData(
                'profile_user_1', '12345', [constants.DEFAULT_LANGUAGE_CODE],
                None, None),
            user_domain.ModifiableUserData(
                'profile_user_2', '12345', [constants.DEFAULT_LANGUAGE_CODE],
                None, None),
        ]

        user_services.update_multiple_users_data(
            [self.modifiable_full_user_data])
        profile_users = user_services.create_new_profiles(
            self.auth_id, self.NEW_USER_EMAIL,
            self.modifiable_profile_user_data)
        self.profile_user_1_id = profile_users[0].user_id
        self.profile_user_2_id = profile_users[1].user_id

    def test_create_profile_user_auth_details(self):
        user_auth_details = auth_services.create_profile_user_auth_details(
            'uid', 'pid')

        self.assertEqual(user_auth_details.user_id, 'uid')
        self.assertEqual(user_auth_details.parent_user_id, 'pid')
        self.assertIsNone(user_auth_details.gae_id)
        self.assertIsNone(user_auth_details.firebase_auth_id)
        self.assertFalse(user_auth_details.deleted)

    def test_create_profile_user_auth_details_with_self_as_parent_is_error(
            self):
        with self.assertRaisesRegexp(ValueError, 'cannot be its own parent'):
            auth_services.create_profile_user_auth_details('uid', 'uid')

    def test_get_all_profiles_for_parent_user_id_returns_all_profiles(self):
        self.assertItemsEqual(
            auth_services.get_all_profiles_by_parent_user_id(self.full_user_id),
            [auth_models.UserAuthDetailsModel.get(self.profile_user_1_id),
             auth_models.UserAuthDetailsModel.get(self.profile_user_2_id)])

    def test_get_auth_claims_from_request(self):
        request = webapp2.Request.blank('/')

        self.assertIsNone(auth_services.get_auth_claims_from_request(request))

        with self.login_context(self.NEW_USER_EMAIL):
            self.assertEqual(
                auth_services.get_auth_claims_from_request(request),
                auth_domain.AuthClaims(
                    self.get_auth_id_from_email(self.NEW_USER_EMAIL),
                    self.NEW_USER_EMAIL, False))

        with self.super_admin_context():
            self.assertEqual(
                auth_services.get_auth_claims_from_request(request),
                auth_domain.AuthClaims(
                    self.get_auth_id_from_email(self.SUPER_ADMIN_EMAIL),
                    self.SUPER_ADMIN_EMAIL,
                    True))

        self.assertIsNone(auth_services.get_auth_claims_from_request(request))

    def test_mark_user_for_deletion_will_force_auth_id_to_be_none(self):
        self.assertIsNotNone(
            auth_services.get_auth_id_from_user_id(self.full_user_id))

        auth_services.mark_user_for_deletion(self.full_user_id)

        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.full_user_id))

    def test_get_association_that_is_present(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self):
        self.assertIsNone(
            auth_services.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(
            auth_services.get_auth_id_from_user_id('does_not_exist'))

    def test_get_multi_associations_with_all_present(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid2', 'uid2'))
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', 'uid2', 'uid3'])
        self.assertEqual(
            auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', 'aid2', 'aid3'])

    def test_get_multi_associations_with_one_missing(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # The aid2 <-> uid2 association is missing.
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', None, 'uid3'])
        self.assertEqual(
            auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', None, 'aid3'])

    def test_associate_auth_id_with_user_id_without_collision(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_auth_id_with_user_id_with_collision_raises(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            auth_services.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_auth_ids_with_user_ids_without_collisions(self):
        auth_services.associate_multi_auth_ids_with_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [auth_services.get_user_id_from_auth_id('aid1'),
             auth_services.get_user_id_from_auth_id('aid2'),
             auth_services.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_auth_ids_with_user_ids_with_collision_raises(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            auth_services.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_present_association_is_not_considered_to_be_deleted(self):
        auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted('uid'))

    def test_missing_association_is_considered_to_be_deleted(self):
        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                'does_not_exist'))

    def test_delete_association_when_it_is_present(self):
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted(
                self.full_user_id))

        auth_services.delete_external_auth_associations(self.full_user_id)

        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                self.full_user_id))

    def test_delete_association_when_it_is_missing_does_not_raise(self):
        # Should not raise.
        auth_services.delete_external_auth_associations('does_not_exist')
