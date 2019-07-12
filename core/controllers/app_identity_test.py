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

from constants import constants
from core.tests import test_utils

class AppIdentityHandlerTests(test_utils.GenericTestBase):
    USERNAME_A = 'a'
    EMAIL_A = 'a@example.com'

    def setUp(self):
        super(AppIdentityHandlerTests, self).setUp()
        self.expected_application_id = test_utils.TestBase.EXPECTED_TEST_APP_ID
        self.expected_bucket_name = (
            '%s-resources' % self.expected_application_id)


    def test_app_identity_handler(self):
        """Test returns correct app identity."""

        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.login(self.EMAIL_A)

        with self.swap(constants, 'DEV_MODE', False):
            json_response = self.get_json('/appidentityhandler')
            self.assertDictEqual({
                "GCS_RESOURCE_BUCKET_NAME": self.expected_bucket_name
                }, json_response)

        with self.swap(constants, 'DEV_MODE', True):
            json_response = self.get_json('/appidentityhandler')
            self.assertDictEqual({
                "GCS_RESOURCE_BUCKET_NAME": None
                }, json_response)
        self.logout()
