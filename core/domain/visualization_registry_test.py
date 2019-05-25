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

import importlib
import inspect
import os

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

    def test_get_visualization_class_with_invalid_id_raises_error(self):
        with self.assertRaisesRegexp(
            TypeError, 'is not a valid visualization id.'):
            visualization_registry.Registry.get_visualization_class(
                'invalid_visualization_id')


class VisualizationsNameTests(test_utils.GenericTestBase):

    def _get_all_python_files(self):
        """Recursively collects all Python files in the core/ and extensions/
        directory.

        Returns:
            a list of Python files.
        """
        current_dir = os.getcwd()
        files_in_directory = []
        for _dir, _, files in os.walk(current_dir):
            for file_name in files:
                filepath = os.path.relpath(
                    os.path.join(_dir, file_name), current_dir)
                if filepath.endswith('.py') and (
                        filepath.startswith('core/') or (
                            filepath.startswith('extensions/'))):
                    module = filepath[:-3].replace('/', '.')
                    files_in_directory.append(module)
        return files_in_directory

    def test_visualization_names(self):
        """This function checks for duplicate visualizations."""

        all_python_files = self._get_all_python_files()
        all_visualizations = []

        for file_name in all_python_files:
            python_module = importlib.import_module(file_name)
            for name, clazz in inspect.getmembers(
                    python_module, predicate=inspect.isclass):
                all_base_classes = [base_class.__name__ for base_class in
                                    (inspect.getmro(clazz))]
                # Check that it is a subclass of 'BaseVisualization'.
                if 'BaseVisualization' in all_base_classes:
                    all_visualizations.append(name)

        expected_visualizations = ['BaseVisualization', 'FrequencyTable',
                                   'BarChart', 'EnumeratedFrequencyTable']

        self.assertEqual(
            sorted(all_visualizations), sorted(expected_visualizations))
