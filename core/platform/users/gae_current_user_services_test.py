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

"""Tests for the GAE current user services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.users import gae_current_user_services
from core.tests import test_utils


class GaeCurrentUserServicesTests(test_utils.GenericTestBase):

    def test_create_login_url(self):
        self.assertEqual(
            gae_current_user_services.create_login_url(''),
            'https://www.google.com/accounts/Login'
            '?continue=http%3A//localhost/signup%3Freturn_url%3D')
