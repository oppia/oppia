# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for the Firebase Admin SDK."""

from __future__ import annotations

import os

from core.domain import auth_domain
from core.tests import firebase_admin_sdk_stub, test_utils

import webapp2


class FirebaseAdminSdkStubTests(test_utils.TestBase):
    """Testes para o Firebase Admin SDK Stub."""

    def setUp(self) -> None:
        super().setUp()
        self.stub = firebase_admin_sdk_stub.FirebaseAdminSdkStub()
        self.mock_request = webapp2.Request.blank('/')
        self.mock_response = webapp2.Response()

    def test_establish_auth_session_sets_active_state(self) -> None:
        self.assertFalse(getattr(self.stub, '_is_session_active'))
        self.stub.establish_auth_session(self.mock_request, self.mock_response)
        self.assertTrue(getattr(self.stub, '_is_session_active'))

    def test_destroy_auth_session_sets_inactive_state(self) -> None:
        setattr(self.stub, '_is_session_active', True)
        self.stub.destroy_auth_session(self.mock_response)
        self.assertFalse(getattr(self.stub, '_is_session_active'))

    def test_get_auth_claims_returns_none_when_session_inactive(self) -> None:
        os.environ['USER_ID'] = 'user_123'
        os.environ['USER_EMAIL'] = 'test@example.com'
        setattr(self.stub, '_is_session_active', False)
        claims = self.stub.get_auth_claims_from_request(self.mock_request)
        self.assertIsNone(claims)

    def test_get_auth_claims_returns_claims_when_session_active(self) -> None:
        os.environ['USER_ID'] = 'user_123'
        os.environ['USER_EMAIL'] = 'test@example.com'
        os.environ['USER_IS_ADMIN'] = '0'
        setattr(self.stub, '_is_session_active', True)
        claims = self.stub.get_auth_claims_from_request(self.mock_request)
        self.assertIsNotNone(claims)
        assert claims is not None
        self.assertEqual(claims.auth_id, 'user_123')
        self.assertEqual(claims.email, 'test@example.com')
        self.assertFalse(claims.role_is_super_admin)

    def test_get_association_that_is_present(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.assertEqual(self.stub.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(self.stub.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self) -> None:
        self.assertIsNone(self.stub.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(self.stub.get_auth_id_from_user_id('does_not_exist'))

    def test_fail_to_get_deleted_association(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.stub.mark_user_for_deletion('uid')
        self.assertIsNone(self.stub.get_user_id_from_auth_id('aid'))

    def test_get_multi_associations_with_all_present(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1')
        )
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid2', 'uid2')
        )
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3')
        )
        self.assertEqual(
            self.stub.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']
            ),
            ['uid1', 'uid2', 'uid3'],
        )
        self.assertEqual(
            self.stub.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']
            ),
            ['aid1', 'aid2', 'aid3'],
        )

    def test_get_multi_associations_with_one_missing(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1')
        )
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid3', 'uid3')
        )
        self.assertEqual(
            self.stub.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']
            ),
            ['uid1', None, 'uid3'],
        )
        self.assertEqual(
            self.stub.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']
            ),
            ['aid1', None, 'aid3'],
        )

    def test_associate_auth_id_with_user_id_without_collision(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.assertEqual(self.stub.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(self.stub.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_auth_id_with_user_id_with_collision_raises(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        with self.assertRaisesRegex(Exception, 'already associated'):
            self.stub.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid')
            )

    def test_associate_multi_auth_ids_with_user_ids_without_collisions(
        self,
    ) -> None:
        self.stub.associate_multi_auth_ids_with_user_ids(
            [
                auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                auth_domain.AuthIdUserIdPair('aid3', 'uid3'),
            ]
        )
        self.assertEqual(
            [
                self.stub.get_user_id_from_auth_id('aid1'),
                self.stub.get_user_id_from_auth_id('aid2'),
                self.stub.get_user_id_from_auth_id('aid3'),
            ],
            ['uid1', 'uid2', 'uid3'],
        )

    def test_associate_multi_auth_ids_with_user_ids_with_collision_raises(
        self,
    ) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid1', 'uid1')
        )
        with self.assertRaisesRegex(Exception, 'already associated'):
            self.stub.associate_multi_auth_ids_with_user_ids(
                [
                    auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                    auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                    auth_domain.AuthIdUserIdPair('aid3', 'uid3'),
                ]
            )

    def test_present_association_is_not_considered_to_be_deleted(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.assertFalse(
            self.stub.verify_external_auth_associations_are_deleted('uid')
        )

    def test_missing_association_is_considered_to_be_deleted(self) -> None:
        self.assertTrue(
            self.stub.verify_external_auth_associations_are_deleted(
                'does_not_exist'
            )
        )

    def test_delete_association_when_it_is_present(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.assertFalse(
            self.stub.verify_external_auth_associations_are_deleted('uid')
        )
        self.stub.delete_external_auth_associations('uid')
        self.assertTrue(
            self.stub.verify_external_auth_associations_are_deleted('uid')
        )

    def test_delete_association_when_it_is_missing_does_not_raise(self) -> None:
        self.stub.delete_external_auth_associations('does_not_exist')

    def test_get_auth_id_from_user_id_for_deleted_user_returns_none(
        self,
    ) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.stub.mark_user_for_deletion('uid')
        self.assertIsNone(self.stub.get_auth_id_from_user_id('uid'))

    def test_get_user_id_from_auth_id_with_include_deleted_true(self) -> None:
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid')
        )
        self.stub.mark_user_for_deletion('uid')
        self.assertEqual(
            self.stub.get_user_id_from_auth_id('aid', include_deleted=True),
            'uid',
        )
