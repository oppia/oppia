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

"""Tests for the GAE Authentication platform services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import auth_domain
from core.platform import models
from core.platform.auth import gae_auth_services
from core.tests import test_utils

import webapp2

auth_models, = models.Registry.import_models([models.NAMES.auth])


class GaeAuthServicesTests(test_utils.GenericTestBase):

    ENABLE_AUTH_SERVICES_STUB = False

    def test_get_auth_claims_from_request_returns_none_if_not_logged_in(self):
        request = webapp2.Request.blank('/')

        self.assertIsNone(
            gae_auth_services.get_auth_claims_from_request(request))

    def test_get_auth_claims_from_request_returns_claims_about_logged_in_user(
            self):
        request = webapp2.Request.blank('/')
        email = 'user@test.com'

        with self.login_context('user@test.com'):
            claims = gae_auth_services.get_auth_claims_from_request(request)

        self.assertIsNotNone(claims)
        self.assertEqual(claims.auth_id, self.get_auth_id_from_email(email))
        self.assertEqual(claims.email, email)
        self.assertFalse(claims.role_is_super_admin)

    def test_get_auth_claims_from_request_returns_admin_privileges(self):
        request = webapp2.Request.blank('/')
        email = 'admin@test.com'

        with self.login_context(email, is_super_admin=True):
            claims = gae_auth_services.get_auth_claims_from_request(request)

        self.assertIsNotNone(claims)
        self.assertEqual(claims.auth_id, self.get_auth_id_from_email(email))
        self.assertEqual(claims.email, email)
        self.assertTrue(claims.role_is_super_admin)

    def test_get_association_that_is_present(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(
            gae_auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(
            gae_auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self):
        self.assertIsNone(
            gae_auth_services.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(
            gae_auth_services.get_auth_id_from_user_id('does_not_exist'))

    def test_get_multi_associations_with_all_present(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid2', 'uid2'))
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            gae_auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', 'uid2', 'uid3'])
        self.assertEqual(
            gae_auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', 'aid2', 'aid3'])

    def test_get_multi_associations_with_one_missing(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # The aid2 <-> uid2 association is missing.
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3'))

        self.assertEqual(
            gae_auth_services.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', None, 'uid3'])
        self.assertEqual(
            gae_auth_services.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', None, 'aid3'])

    def test_associate_without_collision(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        self.assertEqual(
            gae_auth_services.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(
            gae_auth_services.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_with_user_id_collision_raises(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            gae_auth_services.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_with_auth_id_collision_raises(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        # Erase the user_id collision, but leave the auth_id collision.
        auth_models.UserIdentifiersModel.delete_by_id('aid')

        with self.assertRaisesRegexp(Exception, 'already associated'):
            gae_auth_services.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_without_collisions(self):
        gae_auth_services.associate_multi_auth_ids_with_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [gae_auth_services.get_user_id_from_auth_id('aid1'),
             gae_auth_services.get_user_id_from_auth_id('aid2'),
             gae_auth_services.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_with_user_id_collision_raises(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))

        with self.assertRaisesRegexp(Exception, 'already associated'):
            gae_auth_services.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_associate_multi_with_auth_id_collision_raises(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1'))
        # Erase the user_id collision, but leave the auth_id collision.
        auth_models.UserIdentifiersModel.delete_by_id('aid1')

        with self.assertRaisesRegexp(Exception, 'already associated'):
            gae_auth_services.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_gae_associations_are_deleted(self):
        # Should not raise.
        gae_auth_services.delete_external_auth_associations('does_not_exist')
        self.assertTrue(
            gae_auth_services.verify_external_auth_associations_are_deleted(
                'uid'))

    def test_disable_association_marks_model_for_deletion(self):
        gae_auth_services.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        gae_auth_services.mark_user_for_deletion('uid')
        self.assertIsNone(
            auth_models.UserIdentifiersModel.get('aid', strict=False))
