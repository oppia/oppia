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

"""Tests for core.platform.app_identity.gae_app_identity_services."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from constants import constants
from core.platform.app_identity import gae_app_identity_services
from core.tests import test_utils

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class GaeAppIdentityServicesTests(test_utils.GenericTestBase):

    def setUp(self):
        super(GaeAppIdentityServicesTests, self).setUp()
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
