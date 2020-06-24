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

"""Unit tests for core.domain.value_generators_domain."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import importlib
import inspect
import os

from core.domain import value_generators_domain
from core.tests import test_utils


class ValueGeneratorsUnitTests(test_utils.GenericTestBase):
    """Test the value generator registry."""

    def test_value_generator_registry(self):
        copier_id = 'Copier'

        copier = value_generators_domain.Registry.get_generator_class_by_id(
            copier_id)
        self.assertEqual(copier().id, copier_id)

        all_generator_classes = (
            value_generators_domain.Registry.get_all_generator_classes())
        self.assertEqual(len(all_generator_classes), 2)

    def test_generate_value_of_base_value_generator_raises_error(self):
        base_generator = value_generators_domain.BaseValueGenerator()
        with self.assertRaises(NotImplementedError):
            base_generator.generate_value()


class ValueGeneratorNameTests(test_utils.GenericTestBase):

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

    def test_value_generator_names(self):
        """This function checks for duplicate value generators."""

        all_python_files = self._get_all_python_files()
        all_value_generators = []

        for file_name in all_python_files:
            python_module = importlib.import_module(file_name)
            for name, clazz in inspect.getmembers(
                    python_module, predicate=inspect.isclass):
                all_base_classes = [base_class.__name__ for base_class in
                                    (inspect.getmro(clazz))]
                # Check that it is a subclass of 'BaseValueGenerator'.
                if 'BaseValueGenerator' in all_base_classes:
                    all_value_generators.append(name)

        expected_value_generators = ['BaseValueGenerator', 'Copier',
                                     'RandomSelector']

        self.assertEqual(
            sorted(all_value_generators), sorted(expected_value_generators))
