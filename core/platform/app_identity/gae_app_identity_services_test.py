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

from constants import constants
from core.platform.app_identity import gae_app_identity_services
from core.tests import test_utils


class GaeAppIdentityServicesTest(test_utils.GenericTestBase):

    def setUp(self):
        super(GaeAppIdentityServicesTest, self).setUp()
        self.expected_application_id = test_utils.TestBase.EXPECTED_TEST_APP_ID
        self.expected_bucket_name = (
            '%s-resources' % self.expected_application_id)

    def test_get_application_id(self):
        self.assertEqual(
            gae_app_identity_services.get_application_id(),
            self.expected_application_id)

    def test_get_gcs_resource_bucket_name_prod(self):
        # Turn off DEV_MODE.
        with self.swap(constants, 'DEV_MODE', False):
            self.assertEqual(
                gae_app_identity_services.get_gcs_resource_bucket_name(),
                self.expected_bucket_name)

    def test_get_gcs_resource_bucket_name_dev(self):
        self.assertIsNone(
            gae_app_identity_services.get_gcs_resource_bucket_name())
