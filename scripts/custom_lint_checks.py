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
from pylint.interfaces import IRawChecker


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
        if (isinstance(node.func, astroid.Name)) and (
                node.func.name == self._function_name):
            if (node.args is not None) and (
                    len(node.args) > self._positional_arguments_count):
                self.add_message('non-explicit-kwargs', node=node)


class HangingIndentChecker(BaseChecker):
    """Custom pylint checker which checks for break after parenthesis in case
    of hanging indentation.
    """
    __implements__ = IRawChecker

    name = 'hanging-indent'
    priority = -1
    msgs = {
        'C0002': (
            (
                'There should be a break after parenthesis when content within '
                'parenthesis spans multiple lines.'),
            'no-break-after-hanging-indent',
            (
                'If something within parenthesis extends along multiple lines, '
                'break after opening parenthesis.')
        ),
    }

    def process_module(self, node):
        """Process a module.

        Args:
            node: Node to access module content.
        """
        file_content = node.stream().readlines()
        file_length = len(file_content)
        exclude = False
        for line_num in xrange(file_length):
            line = file_content[line_num].lstrip().rstrip()
            if line.startswith('"""') and not line.endswith('"""'):
                exclude = True
            if line.endswith('"""'):
                exclude = False
            if line.startswith('#') or exclude:
                continue
            line_length = len(line)
            bracket_count = 0
            for char_num in xrange(line_length):
                char = line[char_num]
                if char == '(':
                    if bracket_count == 0:
                        position = char_num
                    bracket_count += 1
                elif char == ')' and bracket_count > 0:
                    bracket_count -= 1
            if bracket_count > 0 and position + 1 < line_length:
                content = line[position + 1:]
                if not len(content) or not ',' in content:
                    continue
                split_list = content.split(', ')
                if len(split_list) == 1 and not any(
                        char.isalpha() for char in split_list[0]):
                    continue
                separators = set('@^! #%$&)(+*-=')
                if not any(char in separators for item in split_list
                           for char in item):
                    self.add_message(
                        'no-break-after-hanging-indent', line=line_num + 1)


def register(linter):
    """Registers the checker with pylint.

    Args:
        linter: Pylinter. The Pylinter object.
    """
    linter.register_checker(ExplicitKwargsChecker(linter))
    linter.register_checker(HangingIndentChecker(linter))
