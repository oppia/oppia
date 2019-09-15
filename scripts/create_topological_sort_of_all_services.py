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

NODES = set()
VISIT_STACK = []
TOPO_SORT_STACK = []
ADJ_LIST = collections.defaultdict(list)
DIRECTORY_NAMES = ['core/templates/dev/head', 'extensions']


def dfs(node):
    """Depth First Search starting with node.

    Args:
        node: str. The service name from which dfs will begin.
    """
    VISIT_STACK.append(node)
    for pt in ADJ_LIST[node]:
        if pt not in VISIT_STACK:
            dfs(pt)
    TOPO_SORT_STACK.append(node)


def make_graph():
    """Creates an adjaceny list considering services as node and dependencies
    as edges.
    """
    for dirname in DIRECTORY_NAMES:
        for root, _, filenames in os.walk(dirname):
            for filename in filenames:
                if filename.endswith((
                        '.service.ts', 'Service.ts', 'Factory.ts')):
                    NODES.add(filename)
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
                                if dep_path.endswith((
                                        '.service.ts', 'Service.ts',
                                        'Factory.ts')):
                                    dep_name = os.path.basename(dep_path)
                                    ADJ_LIST[dep_name].append(filename)


if __name__ == '__main__':
    make_graph()

    for unchecked_node in NODES:
        if unchecked_node not in VISIT_STACK:
            dfs(unchecked_node)
    TOPO_SORT_STACK.reverse()
    for service in TOPO_SORT_STACK:
        python_utils.PRINT(service)
