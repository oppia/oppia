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

"""Unit tests for scripts/create_topological_sort_of_all_services.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import os

from core.tests import test_utils
import python_utils
from . import create_topological_sort_of_all_services

MOCK_DIRECTORY_NAMES = [os.path.join('core', 'tests', 'services_sources')]


class TopologicalSortTests(test_utils.GenericTestBase):
    """Test the methods which performs topological sort of services based
    on dependencies.
    """
    def test_dfs_with_connected_graph(self):
        topo_sort_stack = []
        visit_stack = []
        adj_list = collections.defaultdict(list)
        adj_list['A'] = ['B', 'C']
        adj_list['C'] = ['D']
        create_topological_sort_of_all_services.dfs(
            'A', topo_sort_stack, adj_list, visit_stack)
        self.assertEqual(topo_sort_stack, ['B', 'D', 'C', 'A'])
        self.assertEqual(visit_stack, ['A', 'B', 'C', 'D'])

    def test_make_graph(self):
        with self.swap(
            create_topological_sort_of_all_services, 'DIRECTORY_NAMES',
            MOCK_DIRECTORY_NAMES):
            adj_list, node_set = (
                create_topological_sort_of_all_services.make_graph())

            expected_adj_list = {
                'DTest.service.ts': [
                    'CTest.service.ts', 'ETestFactory.ts', 'ATestFactory.ts',
                    'BTestService.ts'],
                'BTestService.ts': ['CTest.service.ts'],
                'ATestFactory.ts': ['CTest.service.ts'],
                'CTest.service.ts': ['ETestFactory.ts']}

            expected_node_set = set([
                'DTest.service.ts', 'ETestFactory.ts', 'BTestService.ts',
                'CTest.service.ts', 'ATestFactory.ts'])

            self.assertEqual(
                sorted(adj_list.keys()), sorted(expected_adj_list.keys())) # pylint: disable=dict-keys-not-iterating

            for key in adj_list:
                self.assertEqual(
                    sorted(adj_list[key]), sorted(expected_adj_list[key]))

            self.assertEqual(node_set, expected_node_set)

    def test_complete_process(self):
        actual_output = []

        def mock_print(val):
            actual_output.append(val)

        print_swap = self.swap(python_utils, 'PRINT', mock_print)
        dir_names_swap = self.swap(
            create_topological_sort_of_all_services, 'DIRECTORY_NAMES',
            MOCK_DIRECTORY_NAMES)
        with print_swap, dir_names_swap:
            create_topological_sort_of_all_services.main()

        expected_output_1 = [
            'DTest.service.ts', 'BTestService.ts', 'ATestFactory.ts',
            'CTest.service.ts', 'ETestFactory.ts']
        expected_output_2 = [
            'DTest.service.ts', 'ATestFactory.ts', 'BTestService.ts',
            'CTest.service.ts', 'ETestFactory.ts']
        self.assertTrue((
            actual_output == expected_output_1) or (
                actual_output == expected_output_2))
