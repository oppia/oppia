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

__author__ = 'Yana Malysheva'

from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import rights_manager
import feconf
import test_utils


class ModeratorTest(test_utils.GenericTestBase):

    def test_moderator_page(self):
        """Tests access to the Moderator page"""
        # Try accessing the moderator page without logging in
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 302)

        # Try accessing the moderator page without being a moderator or admin
        self.login('user@example.com', is_admin=False)
        response = self.testapp.get('/moderator', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        # Register and login as an admin.
        # self.login('admin@example.com', is_admin=True)
        # response = self.testapp.get('/moderator')
        # self.assertEqual(response.status_int, 200)
        # self.logout()
