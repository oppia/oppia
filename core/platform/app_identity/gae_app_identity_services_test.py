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

from __future__ import absolute_import
from __future__ import unicode_literals

import os

from core.platform.app_identity import gae_app_identity_services
from core.tests import test_utils


class GaeAppIdentityServicesTests(test_utils.GenericTestBase):

    def test_get_application_id(self):
        # type: () -> None
        with self.swap(os, 'getenv', lambda _: 'some_id'):
            self.assertEqual(
                gae_app_identity_services.get_application_id(), 'some_id')

    def test_get_default_gcs_bucket_name(self):
        # type: () -> None
        with self.swap(os, 'getenv', lambda _: 'some_id'):
            self.assertEqual(
                gae_app_identity_services.get_gcs_resource_bucket_name(),
                'some_id-resources')
