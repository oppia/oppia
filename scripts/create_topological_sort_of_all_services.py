# coding: utf-8
#
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

"""This script generates topological sort of all the services based on how
services are dependent on each other.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import os
import sys
import python_utils

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))

_PATHS_TO_INSERT = [
    os.path.join(_PARENT_DIR, 'oppia_tools', 'esprima-4.0.1'),
]

for path in _PATHS_TO_INSERT:
    sys.path.insert(0, path)

# pylint: disable=wrong-import-position
import esprima # isort:skip
# pylint: enable=wrong-import-position

DIRECTORY_NAMES = ['core/templates', 'extensions']
SERVICE_FILES_SUFFICES = ('.service.ts', 'Service.ts', 'Factory.ts')


def dfs(node, topo_sort_stack, adj_list, visit_stack):
    """Depth First Search starting with node.

    Args:
        node: str. The service name from which dfs will begin.
        topo_sort_stack: list(str). Stores topological sort of services
            in reveresed way.
        adj_list: dict. Adjacency list of the graph formed with services
            as nodes and dependencies as edges.
        visit_stack: list(str). Keeps track of visited and unvisited nodes.
    """
    visit_stack.append(node)
    for pt in adj_list[node]:
        if pt not in visit_stack:
            dfs(pt, topo_sort_stack, adj_list, visit_stack)
    topo_sort_stack.append(node)


def make_graph():
    """Creates an adjaceny list considering services as node and dependencies
    as edges.

    Returns:
        tuple(dict, set(str)). Adjancency list of the graph formed with
        services as nodes and dependencies as edges, set of all the services.
    """
    adj_list = collections.defaultdict(list)
    nodes_set = set()
    for dirname in DIRECTORY_NAMES:
        for root, _, filenames in os.walk(dirname):
            for filename in filenames:
                if filename.endswith(SERVICE_FILES_SUFFICES):
                    nodes_set.add(filename)
                    filepath = os.path.join(root, filename)
                    with python_utils.open_file(filepath, 'r') as f:
                        file_lines = f.readlines()

                    dep_lines = ''
                    index = 0

                    while index < len(file_lines):
                        line = file_lines[index]
                        if line.startswith('require'):
                            while not line.endswith(';\n'):
                                dep_lines = dep_lines + line
                                index += 1
                                line = file_lines[index]
                            dep_lines = dep_lines + line
                            index += 1
                        elif line.startswith('import'):
                            while not line.endswith(';\n'):
                                index += 1
                                line = file_lines[index]
                                if '\'' in line:
                                    break

                            dep_lines = dep_lines + (
                                'require (' + line[
                                    line.find('\''):line.rfind('\'') + 1
                                    ] + ');\n')
                            index += 1
                        else:
                            index += 1

                    parsed_script = esprima.parseScript(dep_lines, comment=True)
                    parsed_nodes = parsed_script.body
                    for parsed_node in parsed_nodes:
                        # For require statements.
                        if parsed_node.type == 'ExpressionStatement' and (
                                parsed_node.expression.callee.name == (
                                    'require')):
                            arguments = parsed_node.expression.arguments
                            for argument in arguments:
                                dep_path = argument.value
                                if argument.operator == '+':
                                    dep_path = (
                                        argument.left.value +
                                        argument.right.value)
                                if not dep_path.endswith('.ts'):
                                    dep_path = dep_path + '.ts'
                                if dep_path.endswith(SERVICE_FILES_SUFFICES):
                                    dep_name = os.path.basename(dep_path)
                                    adj_list[dep_name].append(filename)

    return (adj_list, nodes_set)


def main():
    """Prints the topological order of the services based on the
    dependencies.
    """
    adj_list, nodes_set = make_graph()
    visit_stack = []
    topo_sort_stack = []

    for unchecked_node in nodes_set:
        if unchecked_node not in visit_stack:
            dfs(unchecked_node, topo_sort_stack, adj_list, visit_stack)

    topo_sort_stack.reverse()
    for service in topo_sort_stack:
        python_utils.PRINT(service)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when create_topological_sort_of_all_services.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
