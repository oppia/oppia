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

"""Unit tests for checking content of app_dev.yaml."""

# Note for developers: This test should not be changed in any circumstance
# since it depends on the format of app_dev.yaml file which is fixed as well.

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from core.tests import test_utils
import python_utils

APP_YAML_PATH = os.path.join(os.getcwd(), 'app_dev.yaml')
DEPLOYMENT_STATIC_START = '# DEPLOYMENT STATIC START\n'
DEPLOYMENT_STATIC_END = '# DEPLOYMENT STATIC END\n'
NON_DEPLOYMENT_STATIC_START = '# NON DEPLOYMENT STATIC START\n'
NON_DEPLOYMENT_STATIC_END = '# NON DEPLOYMENT STATIC END\n'


class AppYamlTests(test_utils.GenericTestBase):
    """Test the app yaml content."""

    def setUp(self):
        super(AppYamlTests, self).setUp()
        with python_utils.open_file(APP_YAML_PATH, 'r') as f:
            self.lines = f.readlines()

    def test_exactly_one_dev_section_is_present(self):
        """Test that only one instance of dev section is present."""
        dev_start_count = self.lines.count(DEPLOYMENT_STATIC_START)
        dev_end_count = self.lines.count(DEPLOYMENT_STATIC_END)
        self.assertEqual(dev_start_count, 1)
        self.assertEqual(dev_end_count, 1)

    def test_dev_start_is_present_before_dev_end(self):
        """Test that dev start is present before dev end."""
        dev_start_index = self.lines.index(DEPLOYMENT_STATIC_START)
        dev_end_index = self.lines.index(DEPLOYMENT_STATIC_END)
        self.assertTrue(dev_start_index < dev_end_index)

    def test_exactly_one_prod_section_is_present(self):
        """Test that only one instance of prod section is present."""
        prod_start_count = self.lines.count(NON_DEPLOYMENT_STATIC_START)
        prod_end_count = self.lines.count(NON_DEPLOYMENT_STATIC_END)
        self.assertEqual(prod_start_count, 1)
        self.assertEqual(prod_end_count, 1)

    def test_prod_start_is_present_before_prod_end(self):
        """Test that dev start is present before dev end."""
        prod_start_index = self.lines.index(NON_DEPLOYMENT_STATIC_START)
        prod_end_index = self.lines.index(NON_DEPLOYMENT_STATIC_END)
        self.assertTrue(prod_start_index < prod_end_index)

    def test_dev_and_prod_sections_are_non_interleaving(self):
        """Test that dev & prod section do not interleave."""
        dev_start_index = self.lines.index(DEPLOYMENT_STATIC_START)
        dev_end_index = self.lines.index(DEPLOYMENT_STATIC_END)
        prod_start_index = self.lines.index(NON_DEPLOYMENT_STATIC_START)
        prod_end_index = self.lines.index(NON_DEPLOYMENT_STATIC_END)

        self.assertTrue(
            (dev_end_index < prod_start_index) or (
                prod_end_index < dev_start_index))
