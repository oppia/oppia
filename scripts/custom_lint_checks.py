# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

import astroid

from pylint.checkers import BaseChecker
from pylint.interfaces import IAstroidChecker


class ExplicitKwargsChecker(BaseChecker):
    """Custom pylint checker which checks for explicit keyword arguments
    in any function call.
    """
    __implements__ = IAstroidChecker

    name = 'explicit-kwargs'
    priority = -1
    msgs = {
        'C0001': (
            'Keyword argument(s) should be named explicitly in function call.',
            'non-explicit-kwargs',
            'All keyword arguments should be explicitly named in function call.'
        ),
    }

    def __init__(self, linter=None):
        """Constructs an ExplicitKwargsChecker object.

        Args:
            linter: Pylinter. An object implementing Pylinter.
        """
        super(ExplicitKwargsChecker, self).__init__(linter)
        self._function_name = None
        self._defaults_count = 0
        self._positional_arguments_count = 0

    def visit_functiondef(self, node):
        """Visits each function definition in a lint check.

        Args:
            node. FunctionDef. The current function definition node.
        """
        self._function_name = node.name

    def visit_arguments(self, node):
        """Visits each function argument in a lint check.

        Args:
            node. Arguments. The current function arguments node.
        """
        if node.defaults is not None:
            self._defaults_count = len(node.defaults)
            if node.args is not None:
                self._positional_arguments_count = (
                    len(node.args) - len(node.defaults))

    def visit_call(self, node):
        """Visits each function call in a lint check.

        Args:
            node. Call. The current function call node.
        """
        if (isinstance(node.func, astroid.Name) and
                node.func.name == self._function_name):
            if (node.args is not None and
                    len(node.args) > self._positional_arguments_count):
                self.add_message('non-explicit-kwargs', node=node)


def register(linter):
    """Registers the checker with pylint.

    Args:
        linter: Pylinter. The Pylinter object.
    """
    linter.register_checker(ExplicitKwargsChecker(linter))
