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

"""Tests for methods in gadget registry."""

import os

from core.domain import gadget_registry
from core.tests import test_utils
import feconf


class GadgetRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the gadget registry."""

    def test_allowed_gadgets_and_counts(self):
        """Do sanity checks on the ALLOWED_GADGETS dict in feconf.py."""
        self.assertEqual(
            len(gadget_registry.Registry.get_all_gadgets()),
            len(feconf.ALLOWED_GADGETS))

        for (gadget_name, gadget_definition) in (
                feconf.ALLOWED_GADGETS.iteritems()):
            contents = os.listdir(
                os.path.join(os.getcwd(), gadget_definition['dir']))
            self.assertIn('%s.py' % gadget_name, contents)

    def test_get_all_specs(self):
        """Test the get_all_specs() method."""
        specs_dict = gadget_registry.Registry.get_all_specs()
        self.assertEqual(
            len(specs_dict.keys()), len(feconf.ALLOWED_GADGETS))
