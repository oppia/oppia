# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

#Tests for the Gae current user services.

from core.platform.users import gae_current_user_services
from core.tests import test_utils

from google.appengine.api import users


class GaeCurrentUserServicesTest(test_utils.GenericTestBase):

    def test_create_login_url(self):

        login_url = gae_current_user_services.create_login_url('splash')
        self.assertEquals(
            login_url,
            'https://www.google.com/accounts/Login' +
            '?continue=http%3A//localhost/signup%3Freturn_url%3Dsplash'
        )

    def test_create_logout_url(self):

        logout_url = gae_current_user_services.create_logout_url('splash')
        self.assertEquals(logout_url, '/logout?return_url=splash')

    def test_get_current_user(self):
        # user login.
        self.login(self.OWNER_EMAIL)
        current_user = gae_current_user_services.get_current_user()
        self.assertEquals(
            current_user,
            users.User(
                email='owner@example.com',
                _user_id='176177241684014293971'
            )
        )
        # user logout.
        self.logout()
        current_user = gae_current_user_services.get_current_user()
        self.assertEquals(current_user, None)

    def test_is_current_user_super_admin(self):
        # owner login.
        self.login(self.OWNER_EMAIL)
        is_super_admin = gae_current_user_services.is_current_user_super_admin()
        self.assertEquals(is_super_admin, False)
        # admin login.
        self.login(self.ADMIN_EMAIL, is_super_admin=True)
        is_super_admin = gae_current_user_services.is_current_user_super_admin()
        self.assertEquals(is_super_admin, True)
        #user logout.
        self.logout()
        is_super_admin = gae_current_user_services.is_current_user_super_admin()
        self.assertEquals(is_super_admin, False)

    def test_get_user_id_from_email(self):
        # existed user case.
        user_id = gae_current_user_services.get_user_id_from_email(
            self.OWNER_EMAIL)
        self.assertEquals(user_id, '176177241684014293971')
        # user not existed case.
        user_id = gae_current_user_services.get_user_id_from_email('')
        self.assertEquals(user_id, None)

    def test_get_current_user_id(self):

        self.login(self.OWNER_EMAIL)
        user_id = gae_current_user_services.get_current_user_id()
        self.assertEquals(user_id, '176177241684014293971')
        # user logout.
        self.logout()
        user_id = gae_current_user_services.get_current_user_id()
        self.assertEquals(user_id, None)

    def test_get_current_user_email(self):
        # user login.
        self.login(self.OWNER_EMAIL)
        email = gae_current_user_services.get_current_user_email()
        self.assertEquals(email, self.OWNER_EMAIL)
        # user logout.
        self.logout()
        email = gae_current_user_services.get_current_user_email()
        self.assertEquals(email, None)
