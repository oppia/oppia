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

from __future__ import annotations

import os
import webapp2

from core.tests import test_utils
from core.tests.firebase_admin_sdk_stub import AuthServicesStub


class AuthServicesStubTests(test_utils.TestBase):
    """Testes para o Firebase Admin SDK Stub."""

    def setUp(self) -> None:
        super().setUp()
        # Garante que o estado está limpo antes de cada teste
        AuthServicesStub._is_session_active = False

        # Cria mocks de request e response vazios, pois o stub não os utiliza de verdade
        self.mock_request = webapp2.Request.blank('/')
        self.mock_response = webapp2.Response()

    def test_establish_auth_session_sets_active_state(self) -> None:
        self.assertFalse(AuthServicesStub._is_session_active)

        AuthServicesStub.establish_auth_session(
            self.mock_request, self.mock_response
        )

        self.assertTrue(AuthServicesStub._is_session_active)

    def test_destroy_auth_session_sets_inactive_state(self) -> None:
        AuthServicesStub._is_session_active = True

        AuthServicesStub.destroy_auth_session(self.mock_response)

        self.assertFalse(AuthServicesStub._is_session_active)

    def test_get_auth_claims_returns_none_when_session_inactive(self) -> None:
        # Configura o ambiente como se o usuário estivesse logado no os.environ
        os.environ['USER_ID'] = 'user_123'
        os.environ['USER_EMAIL'] = 'test@example.com'

        AuthServicesStub._is_session_active = False

        claims = AuthServicesStub.get_auth_claims_from_request(
            self.mock_request
        )
        self.assertIsNone(claims)

    def test_get_auth_claims_returns_claims_when_session_active(self) -> None:
        # Configura o ambiente
        os.environ['USER_ID'] = 'user_123'
        os.environ['USER_EMAIL'] = 'test@example.com'
        os.environ['USER_IS_ADMIN'] = '0'

        AuthServicesStub._is_session_active = True

        claims = AuthServicesStub.get_auth_claims_from_request(
            self.mock_request
        )

        self.assertIsNotNone(claims)
        self.assertEqual(claims.auth_id, 'user_123')
        self.assertEqual(claims.email, 'test@example.com')
        self.assertFalse(claims.role_is_super_admin)
