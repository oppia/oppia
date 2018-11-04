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

"""Tests for methods in the visualization registry."""

from core.domain import visualization_registry
from core.tests import test_utils


class VisualizationRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the visualization registry."""

    def test_visualization_registry(self):
        """Sanity checks on the visualization registry."""
        self.assertGreater(
            len(visualization_registry.Registry.get_all_visualization_ids()),
            0)

    def test_get_full_html(self):
        """Check that the visualization HTML contains templates and directives
        for all visualizations.
        """

        full_html = visualization_registry.Registry.get_full_html()
        all_visualization_ids = (
            visualization_registry.Registry.get_all_visualization_ids())

        for visualization_id in all_visualization_ids:
            self.assertIn('oppiaVisualization%s' % visualization_id, full_html)
