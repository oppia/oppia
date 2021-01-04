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

"""Unit tests for auth_domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import auth_domain
from core.tests import test_utils


class AuthIdUserIdPairTests(test_utils.TestBase):

    def test_unpacking(self):
        auth_id, user_id = auth_domain.AuthIdUserIdPair('aid', 'uid')
        self.assertEqual(auth_id, 'aid')
        self.assertEqual(user_id, 'uid')


class AuthClaimsTests(test_utils.TestBase):

    def test_rejects_empty_auth_id(self):
        with self.assertRaisesRegexp(Exception, 'auth_id must not be empty'):
            auth_domain.AuthClaims(None, None, False)
        with self.assertRaisesRegexp(Exception, 'auth_id must not be empty'):
            auth_domain.AuthClaims('', None, True)

    def test_attributes(self):
        auth = auth_domain.AuthClaims('sub', 'email@test.com', True)

        self.assertEqual(auth.auth_id, 'sub')
        self.assertEqual(auth.email, 'email@test.com')
        self.assertTrue(auth.role_is_super_admin)

    def test_repr(self):
        self.assertEqual(
            repr(auth_domain.AuthClaims('sub', 'email@test.com', False)),
            'AuthClaims(auth_id=%r, email=%r, role_is_super_admin=%r)' % (
                'sub', 'email@test.com', False))
        self.assertEqual(
            repr(auth_domain.AuthClaims('tub', None, True)),
            'AuthClaims(auth_id=%r, email=%r, role_is_super_admin=%r)' % (
                'tub', None, True))

    def test_comparison(self):
        auth = auth_domain.AuthClaims('sub', 'email@test.com', False)

        self.assertEqual(
            auth, auth_domain.AuthClaims('sub', 'email@test.com', False))
        self.assertNotEqual(auth, auth_domain.AuthClaims('tub', None, False))

    def test_hash(self):
        a = auth_domain.AuthClaims('a', 'a@a.com', False)
        b = auth_domain.AuthClaims('b', 'b@b.com', True)

        # Should be able to create a set of AuthClaims.
        auth_set = set([a, b])

        self.assertIn(auth_domain.AuthClaims('a', 'a@a.com', False), auth_set)
        self.assertIn(auth_domain.AuthClaims('b', 'b@b.com', True), auth_set)
        self.assertNotIn(auth_domain.AuthClaims('a', 'a@a.com', True), auth_set)
        self.assertNotIn(auth_domain.AuthClaims('c', 'c@c.com', True), auth_set)
