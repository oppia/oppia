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

"""Implements additional custom Pylint checkers to be used as part of
presubmit checks. Next message id would be C0041.
"""

from __future__ import annotations

import copy
import fnmatch
import linecache
import re
import tokenize

from core import handler_schema_constants
from pylint import lint
from pylint import utils as pylint_utils
from typing import (
    Dict, Final, Generator, List, Optional, Pattern, Set, Tuple, TypedDict
)

from .. import docstrings_checker

# List of punctuation symbols that can be used at the end of
# comments and docstrings.
ALLOWED_TERMINATING_PUNCTUATIONS: Final = ['.', '?', '}', ']', ')']

# If any of these phrases are found inside a docstring or comment,
# the punctuation and capital letter checks will be skipped for that
# comment or docstring.
EXCLUDED_PHRASES: Final = [
    'coding:', 'pylint:', 'http://', 'https://', 'scripts/', 'extract_node'
]

ALLOWED_PRAGMAS_FOR_INLINE_COMMENTS: Final = [
    'pylint:', 'isort:', 'type: ignore', 'pragma:', 'https:'
]

ALLOWED_LINES_OF_GAP_IN_COMMENT: Final = 15

import astroid  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
from pylint import checkers  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
from pylint import interfaces  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
from pylint.checkers import utils as checker_utils  # isort:skip  pylint: disable=wrong-import-order, wrong-import-position
from pylint.extensions import _check_docs_utils # isort:skip  pylint: disable=wrong-import-order, wrong-import-position


def read_from_node(node: astroid.scoped_nodes.Module) -> List[str]:
    """Returns the data read from the ast node in unicode form.

    Args:
        node: astroid.scoped_nodes.Module. Node to access module content.

    Returns:
        list(str). The data read from the ast node.
    """
    # Readlines returns bytes, thus we need to decode them to string.
    return [line.decode('utf-8') for line in node.stream().readlines()]


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class HangingIndentChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks for break after parenthesis in case
    of hanging indentation.
    """

    __implements__ = interfaces.ITokenChecker

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

    def process_tokens(self, tokens: List[tokenize.TokenInfo]) -> None:
        """Process tokens to check if there is a line break after the bracket.

        Args:
            tokens: List[TokenInfo]. Object to process tokens.
        """
        escape_character_indicator = '\\'
        string_indicator = '\''
        excluded = False
        for (token_type, token, (line_num, _), _, line) in tokens:
            # Check if token type is an operator and is either a
            # left parenthesis '(' or a right parenthesis ')'.
            if token_type == tokenize.OP and token in ('(', ')'):
                line = line.strip()

                # Exclude 'if', 'elif', 'while' statements.
                if line.startswith(('if ', 'while ', 'elif ')):
                    excluded = True
                # Skip check if there is a comment at the end of line.
                if excluded:
                    split_line = line.split()
                    if '#' in split_line:
                        comment_index = split_line.index('#')
                        if (split_line[comment_index - 1].endswith(':') or
                                split_line[comment_index - 1].endswith('):')):
                            excluded = False
                    elif line.endswith(':') or line.endswith('):'):
                        excluded = False
                if excluded:
                    continue

                bracket_count = 0
                line_length = len(line)
                escape_character_found = False
                in_string = False
                for char_num in range(line_length):
                    char = line[char_num]
                    if in_string and (
                            char == escape_character_indicator or
                            escape_character_found):
                        escape_character_found = not escape_character_found
                        continue

                    # Check if we found the string indicator and flip the
                    # in_string boolean.
                    if char == string_indicator:
                        in_string = not in_string

                    # Ignore anything inside a string.
                    if in_string:
                        continue

                    if char == '(':
                        if bracket_count == 0:
                            position = char_num
                        bracket_count += 1
                    elif char == ')' and bracket_count > 0:
                        bracket_count -= 1

                if bracket_count > 0 and position + 1 < line_length:
                    # Allow the use of '[', ']', '{', '}' after the parenthesis.
                    separators = set('[{( ')
                    if line[line_length - 1] in separators:
                        continue
                    content = line[position + 1:]
                    # Skip check if there is nothing after the bracket.
                    split_content = content.split()
                    # Skip check if there is a comment at the end of line.
                    if '#' in split_content:
                        comment_index = split_content.index('#')
                        if comment_index == 0:
                            continue

                        last_content_before_comment = (
                            split_content[comment_index - 1])
                        if last_content_before_comment.endswith(
                                ('(', '[', '{')
                        ):
                            continue
                    self.add_message(
                        'no-break-after-hanging-indent', line=line_num)


# The following class was derived from
# https://github.com/PyCQA/pylint/blob/377cc42f9e3116ff97cddd4567d53e9a3e24ebf9/pylint/extensions/docparams.py#L26
# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class DocstringParameterChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Checker for Sphinx, Google, or Numpy style docstrings

    * Check that all function, method and constructor parameters are mentioned
      in the params and types part of the docstring.  Constructor parameters
      can be documented in either the class docstring or ``__init__`` docstring,
      but not both.
    * Check that there are no naming inconsistencies between the signature and
      the documentation, i.e. also report documented parameters that are missing
      in the signature. This is important to find cases where parameters are
      renamed only in the code, not in the documentation.
    * Check that all explicitly raised exceptions in a function are documented
      in the function docstring. Caught exceptions are ignored.

    Args:
        linter: Pylinter. The linter object.
    """

    __implements__ = interfaces.IAstroidChecker

    name = 'parameter_documentation'
    msgs = {
        'W9005': (
            '"%s" has constructor parameters '
            'documented in class and __init__',
            'multiple-constructor-doc',
            'Please remove parameter declarations '
            'in the class or constructor.'),
        'W9006': (
            '"%s" not documented as being raised',
            'missing-raises-doc',
            'Please document exceptions for '
            'all raised exception types.'),
        'W9008': (
            'Redundant returns documentation',
            'redundant-returns-doc',
            'Please remove the return/rtype '
            'documentation from this method.'),
        'W9010': (
            'Redundant yields documentation',
            'redundant-yields-doc',
            'Please remove the yields documentation from this method.'),
        'W9011': (
            'Missing return documentation',
            'missing-return-doc',
            'Please add documentation about what this method returns.',
            {'old_names': [('W9007', 'missing-returns-doc')]}),
        'W9012': (
            'Missing return type documentation',
            'missing-return-type-doc',
            'Please document the type returned by this method.',
            # We can't use the same old_name for two different warnings
            # {'old_names': [('W9007', 'missing-returns-doc')]}.
        ),
        'W9013': (
            'Missing yield documentation',
            'missing-yield-doc',
            'Please add documentation about what this generator yields.',
            {'old_names': [('W9009', 'missing-yields-doc')]}),
        'W9014': (
            'Missing yield type documentation',
            'missing-yield-type-doc',
            'Please document the type yielded by this method.',
        ),
        'W9015': (
            '"%s" missing in parameter documentation',
            'missing-param-doc',
            'Please add parameter declarations for all parameters.',
            {'old_names': [('W9003', 'old-missing-param-doc')]}),
        'W9016': (
            '"%s" missing in parameter type documentation',
            'missing-type-doc',
            'Please add parameter type declarations for all parameters.'
        ),
        'W9017': (
            '"%s" differing in parameter documentation',
            'differing-param-doc',
            'Please check parameter names in declarations.',
        ),
        'W9018': (
            '"%s" differing in parameter type documentation',
            'differing-type-doc',
            'Please check parameter names in type declarations.',
        ),
        'W9019': (
            'Line starting with "%s" requires 4 space indentation relative to'
            ' args line indentation',
            '4-space-indentation-for-arg-parameters-doc',
            'Please use 4 space indentation in parameter definitions relative'
            ' to the args line indentation.'
        ),
        'W9020': (
            'Line starting with "%s" requires 8 space indentation relative to'
            ' args line indentation',
            '8-space-indentation-for-arg-in-descriptions-doc',
            'Please indent wrap-around descriptions by 8 relative to the args'
            ' line indentation.'
        ),
        'W9021': (
            'Args: indentation is incorrect, must be at the outermost'
            ' indentation level.',
            'incorrect-indentation-for-arg-header-doc',
            'Please indent args line to the outermost indentation level.'
        ),
        'W9022': (
            '4 space indentation in docstring.',
            '4-space-indentation-in-docstring',
            'Please use 4 space indentation for parameters relative to section'
            ' headers.'
        ),
        'W9023': (
            '8 space indentation in docstring.',
            '8-space-indentation-in-docstring',
            'Please use 8 space indentation in wrap around messages'
            ' relative to section headers.'
        ),
        'W9024': (
            'Raises section should be the following form: Exception_name. '
            'Description.',
            'malformed-raises-section',
            'The parameter is incorrectly formatted.'
        ),
        'W9025': (
            'Period is not used at the end of the docstring.',
            'no-period-used',
            'Please use a period at the end of the docstring,'
        ),
        'W9026': (
            'Multiline docstring should end with a new line.',
            'no-newline-used-at-end',
            'Please end multiline docstring with a new line.'
        ),
        'W9027': (
            'Single line docstring should not span two lines.',
            'single-line-docstring-span-two-lines',
            'Please do not use two lines for a single line docstring. '
            'If line length exceeds 80 characters, '
            'convert the single line docstring to a multiline docstring.'
        ),
        'W9028': (
            'Empty line before the end of multi-line docstring.',
            'empty-line-before-end',
            'Please do not use empty line before '
            'the end of the multi-line docstring.'
        ),
        'W9029': (
            'Space after """ in docstring.',
            'space-after-triple-quote',
            'Please do not use space after """ in docstring.'
        ),
        'W9030': (
            'Missing single newline below class docstring.',
            'newline-below-class-docstring',
            'Please add a single newline below class docstring.'
        ),
        'W9031': (
            'Files must have a single newline above args in doc string.',
            'single-space-above-args',
            'Please enter a single newline above args in doc string.'
        ),
        'W9032': (
            'Files must have a single newline above returns in doc string.',
            'single-space-above-returns',
            'Please enter a single newline above returns in doc string.'
        ),
        'W9033': (
            'Files must have a single newline above raises in doc string.',
            'single-space-above-raises',
            'Please enter a single newline above raises in doc string.'
        ),
        'W9034': (
            'Files must have a single newline above yield in doc string.',
            'single-space-above-yield',
            'Please enter a single newline above yield in doc string.'
        ),
        'W9035': (
            'Arguments should be in following form: variable_name: typeinfo. '
            'Description.',
            'malformed-args-section',
            'The parameter is incorrectly formatted.'
        ),
        'W9036': (
            'Returns should be in the following form: typeinfo. Description.',
            'malformed-returns-section',
            'The parameter is incorrectly formatted.'
        ),
        'W9037': (
            'Yields should be in the following form: typeinfo. Description.',
            'malformed-yields-section',
            'The parameter is incorrectly formatted.'
        ),
        'W9038': (
            'Arguments starting with *args should be formatted in the following'
            ' form: *args: list(*). Description.',
            'malformed-args-argument',
            'The parameter is incorrectly formatted.'
        )
    }

    options = (
        (
            'accept-no-param-doc',
            {'default': True, 'type': 'yn', 'metavar': '<y or n>',
             'help': 'Whether to accept totally missing parameter '
                     'documentation in the docstring of a '
                     'function that has parameters.'
            }),
        (
            'accept-no-raise-doc',
            {'default': True, 'type': 'yn', 'metavar': '<y or n>',
             'help': 'Whether to accept totally missing raises '
                     'documentation in the docstring of a function that '
                     'raises an exception.'
            }),
        (
            'accept-no-return-doc',
            {'default': True, 'type': 'yn', 'metavar': '<y or n>',
             'help': 'Whether to accept totally missing return '
                     'documentation in the docstring of a function that '
                     'returns a statement.'
            }),
        (
            'accept-no-yields-doc',
            {'default': True, 'type': 'yn', 'metavar': '<y or n>',
             'help': 'Whether to accept totally missing yields '
                     'documentation in the docstring of a generator.'
            }),
        )

    priority = -2

    constructor_names = {'__init__', '__new__'}
    not_needed_param_in_docstring = {'self', 'cls', 'mcs'}
    docstring_sections = {'Raises:', 'Returns:', 'Yields:'}

    # Docstring section headers split up into arguments, returns, yields
    # and raises sections signifying that we are currently parsing the
    # corresponding section of that docstring.
    DOCSTRING_SECTION_RETURNS = 'returns'
    DOCSTRING_SECTION_YIELDS = 'yields'
    DOCSTRING_SECTION_RAISES = 'raises'

    def visit_classdef(self, node: astroid.nodes.ClassDef) -> None:
        """Visit each class definition in a module and check if there is a
        single new line below each class docstring.

        Args:
            node: astroid.nodes.ClassDef. Node for a class definition
                in the AST.
        """
        # Check if the given node has docstring.
        if node.doc is None:
            return
        line_number = node.fromlineno
        # Iterate till the start of docstring.
        while True:
            line = linecache.getline(node.root().file, line_number).strip()
            if line.startswith(('"""', '\'\'\'', '\'', '"')):
                break

            line_number += 1

        doc_length = len(node.doc.split('\n'))
        line_number += doc_length
        first_line_after_doc = linecache.getline(
            node.root().file, line_number).strip()
        second_line_after_doc = linecache.getline(
            node.root().file, line_number + 1).strip()
        if first_line_after_doc != '':
            self.add_message('newline-below-class-docstring', node=node)
        elif second_line_after_doc == '':
            self.add_message('newline-below-class-docstring', node=node)

    def visit_functiondef(self, node: astroid.nodes.FunctionDef) -> None:
        """Called for function and method definitions (def).

        Args:
            node: astroid.scoped_nodes.FunctionDef. Node for a function or
                method definition in the AST.
        """
        node_doc = docstrings_checker.docstringify(node.doc_node)
        self.check_functiondef_params(node, node_doc)
        self.check_functiondef_returns(node, node_doc)
        self.check_functiondef_yields(node, node_doc)
        self.check_docstring_style(node)
        self.check_docstring_section_indentation(node)
        self.check_typeinfo(node, node_doc)

    def check_typeinfo(
        self,
        node: astroid.nodes.FunctionDef,
        node_doc: _check_docs_utils.Docstring
    ) -> None:
        """Checks whether all parameters in a function definition are
        properly formatted.

        Args:
            node: astroid.node.FunctionDef. Node for a function or
                method definition in the AST.
            node_doc: Docstring. Pylint Docstring class instance representing
                a node's docstring.
        """
        # The regexes are taken from the pylint codebase and are modified
        # according to our needs. Link: https://github.com/PyCQA/pylint/blob/
        # e89c361668aeead9fd192d5289c186611ef779ca/pylint/extensions/
        # _check_docs_utils.py#L428.
        re_param_line = re.compile(
            r"""
            \s*  \*{{0,2}}(\w+)          # identifier potentially with asterisks
            \s*  ( [:]
                \s*
                ({type}|\S*|[\s\S]*)
                (?:,\s+optional)?
                [.]+\s )+ \s*
            \s*  [A-Z0-9](.*)[.\]}}\)]+$     # beginning of optional description
        """.format(
            type=_check_docs_utils.GoogleDocstring.re_multiple_type,
        ), flags=re.X | re.S | re.M)

        re_returns_line = re.compile(
            r"""
            \s* (({type}|\S*|[\s\S]*).[.]+\s)+        # identifier
            \s* [A-Z0-9](.*)[.\]}}\)]+$               # beginning of description
        """.format(
            type=_check_docs_utils.GoogleDocstring.re_multiple_type,
        ), flags=re.X | re.S | re.M)

        re_yields_line = re_returns_line

        re_raise_line = re.compile(
            r"""
            \s* ({type}[.])+                    # identifier
            \s* [A-Z0-9](.*)[.\]}}\)]+$         # beginning of description
        """.format(
            type=_check_docs_utils.GoogleDocstring.re_multiple_type,
        ), flags=re.X | re.S | re.M)

        # We need to extract the information from the given section for that
        # we need to use _parse_section as this will extract all the arguments
        # from the Args section, as this is a private method hence we need to
        # use the pylint pragma to escape the pylint warning.
        if node_doc.has_params():
            entries = node_doc._parse_section(  # pylint: disable=protected-access
                _check_docs_utils.GoogleDocstring.re_param_section)
            for entry in entries:
                if entry.lstrip().startswith('*args') and not (
                        entry.lstrip().startswith('*args: list(*)')):
                    self.add_message('malformed-args-argument', node=node)
                match = re_param_line.match(entry)
                if not match:
                    self.add_message('malformed-args-section', node=node)

        # We need to extract the information from the given section for that
        # we need to use _parse_section as this will extract all the returns
        # from the Returns section, as this is a private method hence we need to
        # use the pylint pragma to escape the pylint warning.
        if node_doc.has_returns():
            entries = node_doc._parse_section(  # pylint: disable=protected-access
                _check_docs_utils.GoogleDocstring.re_returns_section)
            entries = [''.join(entries)]
            for entry in entries:
                match = re_returns_line.match(entry)
                if not match:
                    self.add_message('malformed-returns-section', node=node)

        # We need to extract the information from the given section for that
        # we need to use _parse_section as this will extract all the yields
        # from the Yields section, as this is a private method hence we need to
        # use the pylint pragma to escape the pylint warning.
        if node_doc.has_yields():
            entries = node_doc._parse_section(  # pylint: disable=protected-access
                _check_docs_utils.GoogleDocstring.re_yields_section)
            entries = [''.join(entries)]
            for entry in entries:
                match = re_yields_line.match(entry)
                if not match:
                    self.add_message('malformed-yields-section', node=node)

        # We need to extract the information from the given section for that
        # we need to use _parse_section as this will extract all the exceptions
        # from the Raises section, as this is a private method hence we need to
        # use the pylint pragma to escape the pylint warning.
        if node_doc.exceptions():
            entries = node_doc._parse_section(  # pylint: disable=protected-access
                _check_docs_utils.GoogleDocstring.re_raise_section)
            for entry in entries:
                match = re_raise_line.match(entry)
                if not match:
                    self.add_message('malformed-raises-section', node=node)

    def check_functiondef_params(
        self,
        node: astroid.nodes.FunctionDef,
        node_doc: _check_docs_utils.Docstring
    ) -> None:
        """Checks whether all parameters in a function definition are
        documented.

        Args:
            node: astroid.scoped_nodes.FunctionDef. Node for a function or
                method definition in the AST.
            node_doc: Docstring. Pylint Docstring class instance representing
                a node's docstring.
        """
        node_allow_no_param = None
        if node.name in self.constructor_names:
            class_node = checker_utils.node_frame_class(node)
            if class_node is not None:
                class_doc = docstrings_checker.docstringify(class_node.doc_node)
                self.check_single_constructor_params(
                    class_doc, node_doc, class_node)

                # __init__ or class docstrings can have no parameters documented
                # as long as the other documents them.
                node_allow_no_param = (
                    class_doc.has_params() or
                    class_doc.params_documented_elsewhere() or
                    None
                )
                class_allow_no_param = (
                    node_doc.has_params() or
                    node_doc.params_documented_elsewhere() or
                    None
                )

                self.check_arguments_in_docstring(
                    class_doc, node.args, class_node,
                    accept_no_param_doc=class_allow_no_param)

        self.check_arguments_in_docstring(
            node_doc, node.args, node,
            accept_no_param_doc=node_allow_no_param)

    def check_docstring_style(
        self, node: astroid.nodes.FunctionDef
    ) -> None:
        """It fetches a function node and extract the class node from function
        node if it is inside a class body and passes it to
        check_docstring_structure which checks whether the docstring has a
        space at the beginning and a period at the end.

        Args:
            node: astroid.scoped_nodes.FunctionDef. Node for a function or
                method definition in the AST.
        """
        if node.name in self.constructor_names:
            class_node = checker_utils.node_frame_class(node)
            if class_node is not None:
                self.check_docstring_structure(class_node)
        self.check_docstring_structure(node)

    def check_newline_above_args(
        self,
        node: astroid.nodes.FunctionDef,
        docstring: List[str]
    ) -> None:
        """Checks to ensure that there is a single space above the
        argument parameters in the docstring.

        Args:
            node: astroid.node.FunctionDef. Node for a function or method
                definition in the AST.
            docstring: list(str). Function docstring in splitted by newlines.
        """
        blank_line_counter = 0
        for line in docstring:
            line = line.strip()
            if line == '':
                blank_line_counter += 1
            if blank_line_counter == 0 or blank_line_counter > 1:
                if line == 'Args:':
                    self.add_message(
                        'single-space-above-args', node=node)
                elif line == 'Returns:':
                    self.add_message(
                        'single-space-above-returns', node=node)
                elif line == 'Raises:':
                    self.add_message(
                        'single-space-above-raises', node=node)
                elif line == 'Yields:':
                    self.add_message(
                        'single-space-above-yield', node=node)
            if line != '':
                blank_line_counter = 0

    def check_docstring_structure(
        self, node: astroid.NodeNG
    ) -> None:
        """Checks whether the docstring has the correct structure i.e.
        do not have space at the beginning and have a period at the end of
        docstring.

        Args:
            node: astroid.NodeNG. Node for a function or
                method definition in the AST.
        """
        if node.doc:
            docstring = node.doc.splitlines()
            # Check for space after """ in docstring.
            if len(docstring[0]) > 0 and docstring[0][0] == ' ':
                self.add_message('space-after-triple-quote', node=node)
            # Check if single line docstring span two lines.
            if len(docstring) == 2 and docstring[-1].strip() == '':
                self.add_message(
                    'single-line-docstring-span-two-lines', node=node)
            # Check for punctuation at end of a single line docstring.
            elif (len(docstring) == 1 and docstring[-1][-1] not in
                  ALLOWED_TERMINATING_PUNCTUATIONS):
                self.add_message('no-period-used', node=node)
            # Check for punctuation at the end of a multiline docstring.
            elif len(docstring) > 1:
                if docstring[-2].strip() == '':
                    self.add_message('empty-line-before-end', node=node)
                elif docstring[-1].strip() != '':
                    self.add_message(
                        'no-newline-used-at-end', node=node)
                elif (docstring[-2][-1] not in
                      ALLOWED_TERMINATING_PUNCTUATIONS and not
                      any(word in docstring[-2] for word in EXCLUDED_PHRASES)):
                    self.add_message('no-period-used', node=node)

    def check_docstring_section_indentation(
        self, node: astroid.nodes.FunctionDef
    ) -> None:
        """Checks whether the function argument definitions ("Args": section,
        "Returns": section, "Yield": section, "Raises: section) are indented
        properly. Parameters should be indented by 4 relative to the 'Args:'
        'Return:', 'Raises:', 'Yield:' line and any wrap-around descriptions
        should be indented by 8.

        Args:
            node: astroid.nodes.FunctionDef. Node for a function or
                method definition in the AST.
        """
        arguments_node = node.args
        expected_argument_names = set(
            None if (arg.name in self.not_needed_param_in_docstring)
            else (arg.name + ':') for arg
            in arguments_node.args + arguments_node.kwonlyargs)
        currently_in_args_section = False
        # When we are in the args section and a line ends in a colon,
        # we can ignore the indentation styling in the next section of
        # description, hence a freeform section.
        currently_in_freeform_section = False
        args_indentation = 0
        if node.doc:
            current_docstring_section = None
            in_description = False
            args_indentation_in_spaces = 0
            docstring = node.doc.splitlines()
            self.check_newline_above_args(node, docstring)
            for line in docstring:
                stripped_line = line.lstrip()
                current_line_indentation = len(line) - len(stripped_line)
                parameter = re.search('^[^:]+:', stripped_line)

                # Check for empty lines and ignore them.
                if len(line.strip()) == 0:
                    continue

                # If line starts with Returns: , it is the header of a Returns
                # subsection.
                if stripped_line.startswith('Returns:'):
                    current_docstring_section = self.DOCSTRING_SECTION_RETURNS
                    in_freeform_section = False
                    in_description = False
                    args_indentation_in_spaces = current_line_indentation

                # If line starts with Raises: , it is the header of a Raises
                # subsection.
                elif stripped_line.startswith('Raises:'):
                    current_docstring_section = (
                        self.DOCSTRING_SECTION_RAISES)
                    in_freeform_section = False
                    in_description = False
                    args_indentation_in_spaces = current_line_indentation

                # If line starts with Yields: , it is the header of a Yields
                # subsection.
                elif stripped_line.startswith('Yields:'):
                    current_docstring_section = (
                        self.DOCSTRING_SECTION_YIELDS)
                    in_freeform_section = False
                    in_description = False
                    args_indentation_in_spaces = current_line_indentation

                # Check if we are in a docstring raises section.
                elif (
                    current_docstring_section and
                    current_docstring_section == self.DOCSTRING_SECTION_RAISES
                ):
                    # In the raises section, if we see this regex expression, we
                    # can assume it's the start of a new parameter definition.
                    # We check the indentation of the parameter definition.
                    if re.search(r'^[a-zA-Z0-9_\.\*]+[.] ', stripped_line):
                        if current_line_indentation != (
                                args_indentation_in_spaces + 4):
                            self.add_message(
                                '4-space-indentation-in-docstring', node=node)
                        in_description = True

                    # In a description line that is wrapped around (doesn't
                    # start off with the parameter name), we need to make sure
                    # the indentation is 8.
                    elif in_description:
                        if current_line_indentation != (
                                args_indentation_in_spaces + 8):
                            self.add_message(
                                '8-space-indentation-in-docstring', node=node)

                # Check if we are in a docstring returns or yields section.
                # NOTE: Each function should only have one yield or return
                # object. If a tuple is returned, wrap both in a tuple parameter
                # section.
                elif (
                    current_docstring_section and
                    current_docstring_section in (
                        self.DOCSTRING_SECTION_RETURNS,
                        self.DOCSTRING_SECTION_YIELDS
                    )
                ):
                    # Check for the start of a new parameter definition in the
                    # format "type (elaboration)." and check the indentation.
                    if (
                        re.search(r'^[a-zA-Z_() -:,\*]+\.', stripped_line) and
                        not in_description
                    ):
                        if current_line_indentation != (
                                args_indentation_in_spaces + 4):
                            self.add_message(
                                '4-space-indentation-in-docstring', node=node)

                        # If the line ends with a colon, we can assume the rest
                        # of the section is free form.
                        if re.search(r':$', stripped_line):
                            in_freeform_section = True

                        in_description = True

                    # In a description line of a returns or yields, we keep the
                    # indentation the same as the definition line.
                    elif in_description:
                        if (
                            current_line_indentation !=
                            args_indentation_in_spaces + 4 and
                            not in_freeform_section
                        ):
                            self.add_message(
                                '4-space-indentation-in-docstring', node=node)

                        # If the description line ends with a colon, we can
                        # assume the rest of the section is free form.
                        if re.search(r':$', stripped_line):
                            in_freeform_section = True

                # Check for the start of an Args: section and check the correct
                # indentation.
                elif stripped_line.startswith('Args:'):
                    args_indentation = current_line_indentation
                    # The current args indentation is incorrect.
                    if current_line_indentation % 4 != 0:
                        self.add_message(
                            'incorrect-indentation-for-arg-header-doc',
                            node=node
                        )
                        # Since other checks are based on relative indentation,
                        # we need to fix this indentation first.
                        break

                    currently_in_args_section = True

                # Check for parameter section header by checking that the
                # parameter is in the function arguments set. We also check for
                # arguments that start with * which means it's autofill and will
                # not appear in the node args list so we handle those too.
                elif (
                    currently_in_args_section and
                    parameter and
                    (
                        parameter.group(0).strip('*') in expected_argument_names
                        or re.search(r'\*[^ ]+: ', stripped_line)
                    )
                ):
                    words_in_line = stripped_line.split(' ')
                    currently_in_freeform_section = False
                    # Check if the current parameter section indentation is
                    # correct.
                    if current_line_indentation != args_indentation + 4:
                        # Use the first word in the line to identify the error.
                        beginning_of_line = (
                            words_in_line[0] if words_in_line else None)
                        self.add_message(
                            '4-space-indentation-for-arg-parameters-doc',
                            node=node,
                            args=beginning_of_line
                        )

                    # If the line ends with a colon, that means
                    # the next subsection of description is free form.
                    if line.endswith(':'):
                        currently_in_freeform_section = True

                # All other lines can be treated as description.
                elif currently_in_args_section:
                    # If it is not a freeform section, we check the indentation.
                    words_in_line = stripped_line.split(' ')
                    if (
                        not currently_in_freeform_section and
                        current_line_indentation != args_indentation + 8
                    ):
                        # Use the first word in the line to identify the error.
                        beginning_of_line = (
                            words_in_line[0] if words_in_line else None)
                        self.add_message(
                            '8-space-indentation-for-arg-in-descriptions-doc',
                            node=node,
                            args=beginning_of_line
                        )

                    # If the line ends with a colon, that
                    # means the next subsection of description is free form.
                    if line.endswith(':'):
                        currently_in_freeform_section = True

    def check_functiondef_returns(
        self,
        node: astroid.nodes.FunctionDef,
        node_doc: _check_docs_utils.Docstring
    ) -> None:
        """Checks whether a function documented with a return value actually has
        a return statement in its definition.

        Args:
            node: astroid.nodes.FunctionDef. Node for a function or
                method definition in the AST.
            node_doc: Docstring. Pylint Docstring class instance representing
                a node's docstring.
        """
        if not node_doc.supports_yields and node.is_generator():
            return

        return_nodes = node.nodes_of_class(astroid.Return)
        if ((
                node_doc.has_returns() or node_doc.has_rtype()) and
                not any(
                    docstrings_checker.returns_something(
                        ret_node) for ret_node in return_nodes)):
            self.add_message(
                'redundant-returns-doc',
                node=node)

    def check_functiondef_yields(
        self,
        node: astroid.nodes.FunctionDef,
        node_doc: _check_docs_utils.Docstring
    ) -> None:
        """Checks whether a function documented with a yield value actually has
        a yield statement in its definition.

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
                method definition in the AST.
            node_doc: Docstring. Pylint Docstring class instance representing
                a node's docstring.
        """
        if not node_doc.supports_yields:
            return

        if ((node_doc.has_yields() or node_doc.has_yields_type()) and
                not node.is_generator()):
            self.add_message(
                'redundant-yields-doc',
                node=node)

    def visit_raise(
        self, node: astroid.nodes.FunctionDef
    ) -> None:
        """Visits a function node that raises an exception and verifies that all
        exceptions raised in the function definition are documented.

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
                method definition in the AST.
        """
        func_node = node.frame()
        if not isinstance(func_node, astroid.FunctionDef):
            return

        expected_excs = docstrings_checker.possible_exc_types(node)
        if not expected_excs:
            return

        if not func_node.doc:
            # If this is a property setter,
            # the property should have the docstring instead.
            setters_property = docstrings_checker.get_setters_property(
                func_node)
            if setters_property:
                func_node = setters_property

        doc = docstrings_checker.docstringify(func_node.doc_node)
        if doc.matching_sections() == 0:
            if doc.doc:
                self._handle_no_raise_doc(expected_excs, func_node)
            return

        found_excs = doc.exceptions()
        missing_excs = expected_excs - found_excs
        self._add_raise_message(missing_excs, func_node)

    def visit_return(
        self, node: astroid.nodes.FunctionDef
    ) -> None:
        """Visits a function node that contains a return statement and verifies
        that the return value and the return type are documented.

        Args:
            node: astroid.scoped_nodes.FunctionDef. Node for a function or
                method definition in the AST.
        """
        if not docstrings_checker.returns_something(node):
            return

        func_node = node.frame()

        doc = docstrings_checker.docstringify(func_node.doc_node)
        if doc.matching_sections() == 0 and self.config.accept_no_return_doc:
            return

        is_property = checker_utils.decorated_with_property(func_node)

        if not (doc.has_returns() or
                (doc.has_property_returns() and is_property)):
            self.add_message(
                'missing-return-doc',
                node=func_node
            )

        if not (doc.has_rtype() or
                (doc.has_property_type() and is_property)):
            self.add_message(
                'missing-return-type-doc',
                node=func_node
            )

    def visit_yield(
        self, node: astroid.nodes.FunctionDef
    ) -> None:
        """Visits a function node that contains a yield statement and verifies
        that the yield value and the yield type are documented.

        Args:
            node: astroid.scoped_nodes.FunctionDef. Node for a function or
                method definition in the AST.
        """
        func_node = node.frame()

        doc = docstrings_checker.docstringify(func_node.doc_node)
        if doc.matching_sections() == 0 and self.config.accept_no_yields_doc:
            return

        doc_has_yields = doc.has_yields()
        doc_has_yields_type = doc.has_yields_type()

        if not doc_has_yields:
            self.add_message(
                'missing-yield-doc',
                node=func_node
            )

        if not doc_has_yields_type:
            self.add_message(
                'missing-yield-type-doc',
                node=func_node
            )

    def visit_yieldfrom(
        self, node: astroid.nodes.FunctionDef
    ) -> None:
        """Visits a function node that contains a yield from statement and
        verifies that the yield from value and the yield from type are
        documented.

        Args:
            node: astroid.nodes.FunctionDef. Node to access module content.
        """
        self.visit_yield(node)

    def check_arguments_in_docstring(
        self,
        doc: _check_docs_utils.Docstring,
        arguments_node: astroid.nodes.Arguments,
        warning_node: astroid.nodes.NodeNG,
        accept_no_param_doc: Optional[bool] = None
    ) -> None:
        """Check that all parameters in a function, method or class constructor
        on the one hand and the parameters mentioned in the parameter
        documentation (e.g. the Sphinx tags 'param' and 'type') on the other
        hand are consistent with each other.

        * Undocumented parameters except 'self' are noticed.
        * Undocumented parameter types except for 'self' and the ``*<args>``
          and ``**<kwargs>`` parameters are noticed.
        * Parameters mentioned in the parameter documentation that don't or no
          longer exist in the function parameter list are noticed.
        * If the text "For the parameters, see" or "For the other parameters,
          see" (ignoring additional whitespace) is mentioned in the docstring,
          missing parameter documentation is tolerated.
        * If there's no Sphinx style, Google style or NumPy style parameter
          documentation at all, i.e. ``:param`` is never mentioned etc., the
          checker assumes that the parameters are documented in another format
          and the absence is tolerated.

        Args:
            doc: str. Docstring for the function, method or class.
            arguments_node: astroid.scoped_nodes.Arguments. Arguments node
                for the function, method or class constructor.
            warning_node: astroid.scoped_nodes.Node. The node to assign
                the warnings to.
            accept_no_param_doc: bool|None. Whether or not to allow
                no parameters to be documented. If None then
                this value is read from the configuration.
        """
        # Tolerate missing param or type declarations if there is a link to
        # another method carrying the same name.
        if not doc.doc:
            return

        if accept_no_param_doc is None:
            accept_no_param_doc = self.config.accept_no_param_doc
        tolerate_missing_params = doc.params_documented_elsewhere()

        # Collect the function arguments.
        expected_argument_names = set(
            arg.name for arg in arguments_node.args)
        expected_argument_names.update(
            arg.name for arg in arguments_node.kwonlyargs)
        not_needed_type_in_docstring = (
            self.not_needed_param_in_docstring.copy())

        if arguments_node.vararg is not None:
            expected_argument_names.add(arguments_node.vararg)
            not_needed_type_in_docstring.add(arguments_node.vararg)
        if arguments_node.kwarg is not None:
            expected_argument_names.add(arguments_node.kwarg)
            not_needed_type_in_docstring.add(arguments_node.kwarg)
        params_with_doc, params_with_type = doc.match_param_docs()

        # Tolerate no parameter documentation at all.
        if (not params_with_doc and not params_with_type
                and accept_no_param_doc):
            tolerate_missing_params = True

        def _compare_missing_args(
            found_argument_names: Set[str],
            message_id: str,
            not_needed_names: Set[str]
        ) -> None:
            """Compare the found argument names with the expected ones and
            generate a message if there are arguments missing.

            Args:
                found_argument_names: set(str). Argument names found in the
                    docstring.
                message_id: str. Pylint message id.
                not_needed_names: set(str). Names that may be omitted.
            """
            if not tolerate_missing_params:
                missing_argument_names = (
                    (expected_argument_names - found_argument_names)
                    - not_needed_names)
                if missing_argument_names:
                    self.add_message(
                        message_id,
                        args=(', '.join(
                            sorted(missing_argument_names)),),
                        node=warning_node)

        def _compare_different_args(
            found_argument_names: Set[str],
            message_id: str,
            not_needed_names: Set[str]
        ) -> None:
            """Compare the found argument names with the expected ones and
            generate a message if there are extra arguments found.

            Args:
                found_argument_names: set(str). Argument names found in the
                    docstring.
                message_id: str. Pylint message id.
                not_needed_names: set(str). Names that may be omitted.
            """
            differing_argument_names = (
                (expected_argument_names ^ found_argument_names)
                - not_needed_names - expected_argument_names)

            if differing_argument_names:
                self.add_message(
                    message_id,
                    args=(', '.join(
                        sorted(differing_argument_names)),),
                    node=warning_node)

        _compare_missing_args(
            params_with_doc, 'missing-param-doc',
            self.not_needed_param_in_docstring)
        _compare_missing_args(
            params_with_type, 'missing-type-doc', not_needed_type_in_docstring)

        _compare_different_args(
            params_with_doc, 'differing-param-doc',
            self.not_needed_param_in_docstring)
        _compare_different_args(
            params_with_type, 'differing-type-doc',
            not_needed_type_in_docstring)

    def check_single_constructor_params(
        self,
        class_doc: _check_docs_utils.Docstring,
        init_doc: _check_docs_utils.Docstring,
        class_node: astroid.nodes.ClassDef
    ) -> None:
        """Checks whether a class and corresponding  init() method are
        documented. If both of them are documented, it adds an error message.

        Args:
            class_doc: Docstring. Pylint docstring class instance representing
                a class's docstring.
            init_doc:  Docstring. Pylint docstring class instance representing
                a method's docstring, the method here is the constructor method
                for the above class.
            class_node: astroid.nodes.ClassDef. Node for class definition
                in AST.
        """
        if class_doc.has_params() and init_doc.has_params():
            self.add_message(
                'multiple-constructor-doc',
                args=(class_node.name,),
                node=class_node)

    def _handle_no_raise_doc(
        self, excs: Set[str], node: astroid.nodes.FunctionDef
    ) -> None:
        """Checks whether the raised exception in a function has been
        documented, add a message otherwise.

        Args:
            excs: list(str). A list of exception types.
            node: astroid.nodes.FunctionDef. Node to access module content.
        """
        if self.config.accept_no_raise_doc:
            return

        self._add_raise_message(excs, node)

    def _add_raise_message(
        self, missing_excs: Set[str], node: astroid.nodes.NodeNG
    ) -> None:
        """Adds a message on :param:`node` for the missing exception type.

        Args:
            missing_excs: list(str). A list of missing exception types.
            node: astroid.node_classes.NodeNG. The node show the message on.
        """
        if not missing_excs:
            return

        self.add_message(
            'missing-raises-doc',
            args=(', '.join(sorted(missing_excs)),),
            node=node)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class ImportOnlyModulesChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Checker for import-from statements. It checks that
    modules are only imported.
    """

    __implements__ = interfaces.IAstroidChecker

    name = 'import-only-modules'
    priority = -1
    msgs = {
        'C0003': (
            'Import \"%s\" from \"%s\" is not a module.',
            'import-only-modules',
            'Modules should only be imported.',
        ),
    }

    # If import from any of these is made, it may not be a module.
    EXCLUDED_IMPORT_MODULES = [
        '__future__',
        'types',
        'typing',
        'mypy_imports',
        'typing_extensions'
    ]

    # TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
    # pylint library and absences of stubs in pylint, forces MyPy to
    # assume that checker_utils.check_messages function
    # is untyped. Thus to avoid MyPy's error
    # (Untyped decorator makes function "visit_importfrom" untyped),
    # we added an ignore here.
    @checker_utils.check_messages('import-only-modules')  # type: ignore[misc]
    def visit_importfrom(self, node: astroid.nodes.ImportFrom) -> None:
        """Visits all import-from statements in a python file and checks that
        modules are imported. It then adds a message accordingly.

        Args:
            node: astroid.node_classes.ImportFrom. Node for a import-from
                statement in the AST.
        """

        try:
            imported_module = node.do_import_module(node.modname)
        except astroid.AstroidBuildingException:
            return

        if node.modname in self.EXCLUDED_IMPORT_MODULES:
            return

        modname = node.modname
        for (name, _) in node.names:
            try:
                imported_module.import_module(name, True)
            except astroid.AstroidImportError:
                self.add_message(
                    'import-only-modules',
                    node=node,
                    args=(name, modname),
                )


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class BackslashContinuationChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks that backslash is not used
    for continuation.
    """

    __implements__ = interfaces.IRawChecker

    name = 'backslash-continuation'
    priority = -1
    msgs = {
        'C0004': (
            (
                'Backslash should not be used to break continuation lines. '
                'Use braces to break long lines.'),
            'backslash-continuation',
            'Use braces to break long lines instead of backslash.'
        ),
    }

    def process_module(self, node: astroid.nodes.Module) -> None:
        """Process a module.

        Args:
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        file_content = read_from_node(node)
        for (line_num, line) in enumerate(file_content):
            if line.rstrip('\r\n').endswith('\\'):
                self.add_message(
                    'backslash-continuation', line=line_num + 1)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class FunctionArgsOrderChecker(checkers.BaseChecker): # type: ignore[misc]
    """Custom pylint checker which checks the order of arguments in function
    definition.
    """

    __implements__ = interfaces.IAstroidChecker
    name = 'function-args-order'
    priority = -1
    msgs = {
        'C0005': (
            'Wrong order of arguments in function definition '
            '\'self\' should come first.',
            'function-args-order-self',
            '\'self\' should come first',),
        'C0006': (
            'Wrong order of arguments in function definition '
            '\'cls\' should come first.',
            'function-args-order-cls',
            '\'cls\' should come first'),
    }

    def visit_functiondef(self, node: astroid.nodes.FunctionDef) -> None:
        """Visits every function definition in the python file and check the
        function arguments order. It then adds a message accordingly.

        Args:
            node: astroid.nodes.FunctionDef. Node for a function or method
                definition in the AST.
        """

        args_list = [args.name for args in node.args.args]
        if 'self' in args_list and args_list[0] != 'self':
            self.add_message('function-args-order-self', node=node)
        elif 'cls' in args_list and args_list[0] != 'cls':
            self.add_message('function-args-order-cls', node=node)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class RestrictedImportChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks layers importing modules
    from their respective restricted layers.
    """

    __implements__ = interfaces.IAstroidChecker
    name = 'invalid-import'
    priority = -1
    msgs = {
        'C0009': (
            'Importing any file from module %s in module "%s" is prohibited.',
            'invalid-import',
            'Some modules cannot be imported in other modules.'
        ),
        'C0010': (
            'Importing file named "%s" from module "%s" '
            'in module "%s" is prohibited.',
            'invalid-import-from',
            'Some modules cannot be imported in other modules.'
        ),
    }

    options = (
        (
            'forbidden-imports',
            {
                'default': [],
                'type': 'csv',
                'metavar': '<comma separated list>',
                'help': (
                    'List of disallowed imports. The items start with '
                    'the module name where the imports are forbidden, the path '
                    'needs to be absolute with the root module name included '
                    '(e.g. \'oppia.core.domain\'), then comes '
                    'the \':\' separator, and after that a list of the imports '
                    'that are forbidden separated by \'|\', these imports are '
                    'relative to the root module (e.g. \'core.domain\').'
                )
            }
        ),
    )

    def __init__(self, linter: Optional[lint.PyLinter] = None) -> None:
        super().__init__(linter=linter)
        self._module_to_forbidden_imports: List[
            Tuple[str, List[Tuple[str, Optional[str]]]]
        ] = []

    def open(self) -> None:
        """Parse the forbidden imports."""
        module_to_forbidden_imports: List[Tuple[str, str]] = [
            forbidden_import.strip().split(':')
            for forbidden_import in self.config.forbidden_imports
        ]
        self._module_to_forbidden_imports = []
        for module_regex, forbidden_imports in module_to_forbidden_imports:
            processed_forbidden_imports: List[Tuple[str, Optional[str]]] = []
            for forbidden_import in forbidden_imports.split('|'):
                stripped_forbidden_import = forbidden_import.strip()
                if stripped_forbidden_import.startswith('from'):
                    from_part, import_part = (
                        stripped_forbidden_import[4:].split(' import '))
                    processed_forbidden_imports.append(
                        (from_part.strip(), import_part.strip()))
                else:
                    processed_forbidden_imports.append(
                        (stripped_forbidden_import[7:].strip(), None))
            self._module_to_forbidden_imports.append((
                module_regex.strip(),
                processed_forbidden_imports
            ))

    def _iterate_forbidden_imports(
        self, node: astroid.nodes.Import
    ) -> Generator[Tuple[str, Tuple[str, Optional[str]]], None, None]:
        """Yields pairs of module name and forbidden imports.

        Args:
            node: astroid.node_classes.Import. Node for a import statement
                in the AST.

        Yields:
            tuple(str, tuple(str, None)). Yields pair of module name and
            forbidden import.
        """
        modnode = node.root()
        for module_name, forbidden_imports in self._module_to_forbidden_imports:
            for forbidden_import in forbidden_imports:
                if (
                        fnmatch.fnmatch(modnode.name, module_name) and
                        not '_test' in modnode.name
                ):
                    yield module_name, forbidden_import

    def _add_invalid_import_message(
        self,
        node: astroid.nodes.Import,
        module_name: str,
        forbidden_import_names: Tuple[str, Optional[str]]
    ) -> None:
        """Adds pylint message about the invalid import.

        Args:
            node: astroid.node_classes.Import. Node for a import statement
                in the AST.
            module_name: str. The module that was checked.
            forbidden_import_names: tuple(str, str|None). The import that
                was invalid.
        """
        if forbidden_import_names[1] is None:
            self.add_message(
                'invalid-import',
                node=node,
                args=(forbidden_import_names[0], module_name)
            )
        else:
            self.add_message(
                'invalid-import-from',
                node=node,
                args=(
                    forbidden_import_names[1],
                    forbidden_import_names[0],
                    module_name
                )
            )

    def visit_import(self, node: astroid.nodes.Import) -> None:
        """Visits every import statement in the file.

        Args:
            node: astroid.node_classes.Import. Node for a import statement
                in the AST.
        """
        names = [name for name, _ in node.names]
        forbidden_imports = self._iterate_forbidden_imports(node)
        for module_name, forbidden_import_names in forbidden_imports:
            if forbidden_import_names[1] is not None:
                import_to_check = '%s.%s' % (
                    forbidden_import_names[0],
                    forbidden_import_names[1]
                )
            else:
                import_to_check = forbidden_import_names[0]
            if any(fnmatch.fnmatch(name, import_to_check) for name in names):
                self._add_invalid_import_message(
                    node, module_name, forbidden_import_names)

    def visit_importfrom(self, node: astroid.Import) -> None:
        """Visits all import-from statements in a python file and checks that
        modules are imported. It then adds a message accordingly.

        Args:
            node: astroid.node_classes.ImportFrom. Node for a import-from
                statement in the AST.
        """
        forbidden_imports = self._iterate_forbidden_imports(node)
        for module_name, forbidden_import_names in forbidden_imports:
            if fnmatch.fnmatch(node.modname, forbidden_import_names[0]):
                if forbidden_import_names[1] is None:
                    self._add_invalid_import_message(
                        node, module_name, forbidden_import_names)
                elif any(
                        fnmatch.fnmatch(name[0], forbidden_import_names[1])
                        for name in node.names
                ):
                    self._add_invalid_import_message(
                        node, module_name, forbidden_import_names)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class SingleCharAndNewlineAtEOFChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Checker for single character files and newline at EOF."""

    __implements__ = interfaces.IRawChecker
    name = 'newline-at-eof'
    priority = -1
    msgs = {
        'C0007': (
            'Files should end in a single newline character.',
            'newline-at-eof',
            'Please enter a single newline at the end of the file.'),
        'C0008': (
            'Only one character in file',
            'only-one-character',
            'Files with only one character are not allowed.'),
    }

    def process_module(self, node: astroid.Module) -> None:
        """Process a module.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """

        file_content = read_from_node(node)
        file_length = len(file_content)

        if file_length == 1 and len(file_content[0]) == 1:
            self.add_message('only-one-character', line=file_length)
        if file_length >= 2 and not re.search(r'[^\n]\n', file_content[-1]):
            self.add_message('newline-at-eof', line=file_length)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class SingleLineCommentChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Checks if comments follow correct style."""

    __implements__ = interfaces.ITokenChecker
    name = 'incorrectly_styled_comment'
    priority = -1
    msgs = {
        'C0016': (
            'Invalid punctuation is used.',
            'invalid-punctuation-used',
            'Please use valid punctuation.'
        ),
        'C0017': (
            'Please use single space at beginning of comment.',
            'no-space-at-beginning',
            'Please use single space at the beginning of comment.'
        ),
        'C0018': (
            'Please use a capital letter at the beginning of comment.',
            'no-capital-letter-at-beginning',
            'Please use capital letter to begin the content of comment.'
        ),
        'C0040': (
            'This inline comment does not start with any allowed pragma. Please'
            ' put this comment in a new line.',
            'no-allowed-inline-pragma',
            'Inline comments should always start with an allowed inline pragma.'
        )
    }
    options = ((
        'allowed-comment-prefixes',
        {
            'default': ('int', 'str', 'float', 'bool', 'v'),
            'type': 'csv', 'metavar': '<comma separated list>',
            'help': 'List of allowed prefixes in a comment.'
        }
    ),)

    def _check_space_at_beginning_of_comments(
        self, line: str, line_num: int
    ) -> None:
        """Checks if the comment starts with a space.

        Args:
            line: str. The current line of comment.
            line_num: int. Line number of the current comment.
        """
        if re.search(r'^#[^\s].*$', line) and not line.startswith('#!'):
            self.add_message(
                'no-space-at-beginning', line=line_num)

    def _check_comment_starts_with_capital_letter(
        self, line: str, line_num: int
    ) -> None:
        """Checks if the comment starts with a capital letter.
        Comments may include a lowercase character at the beginning only if they
        start with version info or a data type or a variable name e.g.
        "# next_line is of string type." or "# v2 version does not have
        ExplorationStats Model." or "# int. The file size, in bytes.".

        Args:
            line: str. The current line of comment.
            line_num: int. Line number of the current comment.
        """
        # Check if variable name is used.
        if line[1:].startswith(' '):
            starts_with_underscore = '_' in line.split()[1]
        else:
            starts_with_underscore = '_' in line.split()[0]

        # Check if allowed prefix is used.
        allowed_prefix_is_present = any(
            line[2:].startswith(word) for word in
            self.config.allowed_comment_prefixes)

        # Check if comment contains any excluded phrase.
        excluded_phrase_is_present = any(
            line[1:].strip().startswith(word) for word in EXCLUDED_PHRASES)
        if (re.search(r'^# [a-z].*', line) and not (
                excluded_phrase_is_present or
                starts_with_underscore or allowed_prefix_is_present)):
            self.add_message(
                'no-capital-letter-at-beginning', line=line_num)

    def _check_punctuation(
        self, line: str, line_num: int
    ) -> None:
        """Checks if the comment starts with a correct punctuation.

        Args:
            line: str. The current line of comment.
            line_num: int. Line number of the current comment.
        """
        excluded_phrase_is_present_at_end = any(
            word in line for word in EXCLUDED_PHRASES)
        # Comments must end with the proper punctuation.
        last_char_is_invalid = line[-1] not in (
            ALLOWED_TERMINATING_PUNCTUATIONS)

        excluded_phrase_at_beginning_of_line = any(
            line[1:].startswith(word) for word in EXCLUDED_PHRASES)
        if (last_char_is_invalid and not (
                excluded_phrase_is_present_at_end or
                excluded_phrase_at_beginning_of_line)):
            self.add_message('invalid-punctuation-used', line=line_num)

    def _check_trailing_comment_starts_with_allowed_pragma(
        self, line: str, line_num: int
    ) -> None:
        """Checks if the trailing inline comment starts with a valid and
        allowed pragma.

        Args:
            line: str. The current line of comment.
            line_num: int. Line number of the current comment.
        """
        comment_start_index = -1
        for pos, char in enumerate(line):
            if char == '#':
                comment_start_index = pos
        line = line[comment_start_index:]
        self._check_space_at_beginning_of_comments(line, line_num)
        allowed_inline_pragma_present = any(
            line[2:].startswith(word) for word in
            ALLOWED_PRAGMAS_FOR_INLINE_COMMENTS
        )
        if allowed_inline_pragma_present:
            return
        self.add_message('no-allowed-inline-pragma', line=line_num)

    def process_tokens(self, tokens: List[tokenize.TokenInfo]) -> None:
        """Custom pylint checker to ensure that comments follow correct style.

        Args:
            tokens: list(TokenInfo). Object to access all tokens of a module.
        """
        prev_line_num = -1
        comments_group_list: List[List[Tuple[str, int]]] = []
        comments_index = -1

        for (token_type, _, (line_num, _), _, line) in tokens:
            if token_type == tokenize.COMMENT:
                line = line.strip()
                if line.startswith('#'):
                    self._check_space_at_beginning_of_comments(line, line_num)
                    if prev_line_num + 1 == line_num:
                        comments_group_list[comments_index].append(
                            (line, line_num))
                    else:
                        comments_group_list.append([(line, line_num)])
                        comments_index += 1
                    prev_line_num = line_num
                else:
                    self._check_trailing_comment_starts_with_allowed_pragma(
                        line, line_num)

        for comments in comments_group_list:
            # Checks first line of comment.
            self._check_comment_starts_with_capital_letter(*comments[0])
            # Checks last line of comment.
            self._check_punctuation(*comments[-1])


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class BlankLineBelowFileOverviewChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Checks if there is a single empty line below the fileoverview docstring.
    Note: The check assumes that all files have a file overview. This
    assumption is justified because Pylint has an inbuilt check
    (missing-docstring) for missing file overviews.
    """

    __implements__ = interfaces.IAstroidChecker
    name = 'space_between_imports_and_file-overview'
    priority = -1
    msgs = {
        'C0024': (
            'Please add an empty line below the fileoverview docstring.',
            'no-empty-line-provided-below-fileoverview',
            'please provide an empty line below the fileoverview.'
        ),
        'C0025': (
            'Single empty line should be provided below the fileoverview.',
            'only-a-single-empty-line-should-be-provided',
            'please provide an empty line below the fileoverview.'
        )
    }

    def visit_module(self, node: astroid.Module) -> None:
        """Visit a module to ensure that there is a blank line below
        file overview docstring.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """
        # Check if the given node has docstring.
        if node.doc is None:
            return
        line_number = node.fromlineno
        # Iterate till the start of docstring.
        while True:
            line = linecache.getline(node.root().file, line_number).strip()
            if line.startswith(('\'', '"')):
                break

            line_number += 1

        doc_length = len(node.doc.split('\n'))
        line_number += doc_length
        first_line_after_doc = linecache.getline(
            node.root().file, line_number).strip()
        second_line_after_doc = linecache.getline(
            node.root().file, line_number + 1).strip()
        if first_line_after_doc != '':
            self.add_message(
                'no-empty-line-provided-below-fileoverview', node=node)
        elif second_line_after_doc == '':
            self.add_message(
                'only-a-single-empty-line-should-be-provided', node=node)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class SingleLinePragmaChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks if pylint pragma is used to disable
    a rule for a single line only.
    """

    __implements__ = interfaces.ITokenChecker

    name = 'single-line-pragma'
    priority = -1
    msgs = {
        'C0028': (
            'Pylint pragmas should be used to disable a rule '
            'for a single line only',
            'single-line-pragma',
            'Please use pylint pragmas to disable a rule for a single line only'
        )
    }

    def process_tokens(self, tokens: List[tokenize.TokenInfo]) -> None:
        """Custom pylint checker which allows paramas to disable a rule for a
        single line only.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
        """
        for (token_type, _, (line_num, _), _, line) in tokens:
            if token_type == tokenize.COMMENT:
                line = line.lstrip()
                # Ignore line that is enabling this check.
                # Example:
                # # pylint: disable=import-only-modules, single-line-pragma
                # def func(a, b):
                # # pylint: enable=import-only-modules, single-line-pragma
                # Now if do not ignore the line with 'enable' statement
                # pylint will raise the error of single-line-pragma because
                # from here on all this lint check is enabled. So we need to
                # ignore this line.
                if re.search(r'^(#\s*pylint:)', line):
                    if 'enable' in line and 'single-line-pragma' in line:
                        continue
                    self.add_message(
                        'single-line-pragma', line=line_num)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class TypeIgnoreCommentChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks if MyPy's type ignores are properly
    documented or not.
    """

    __implements__ = interfaces.IAstroidChecker

    name = 'type-ignore-comment'
    priority = -1
    msgs = {
        'C0045': (
            'Please try to avoid the use of \'type: ignore\' if possible.'
            ' If \'type: ignore\' is really necessary, then add a proper'
            ' comment with clear justification. The format of the comment'
            ' should be -> Here we use MyPy ignore because ...',
            'mypy-ignore-used',
            'MyPy ignores (except for \'type: ignore[no-untyped-call]\')'
            ' should be accompanied by proper comments. The format of'
            ' comments should be -> Here we use MyPy ignore because ...'
        ),
        'C0046': (
            'Extra comment is present for MyPy type: ignore. Please'
            ' remove it.',
            'redundant-type-comment',
            'No corresponding \'type: ignore\' is found for the comment.'
        ),
        'C0050': (
            'Please avoid the usage of \'type: ignore[%s]\' as it is'
            ' not allowed in the codebase. Instead try to fix the code'
            ' implementation so that the MyPy error is suppressed. For'
            ' more information, visit :'
            ' https://github.com/oppia/oppia/wiki/Backend-Type-Annotations',
            'prohibited-type-ignore-used',
            'Only a limited number of type ignores are allowed in the codebase.'
        ),
        'C0051': (
            'Usage of generic MyPy type ignores is prohibited. '
            'MyPy type ignores can only be used with specific '
            'error codes: type: ignore[<error-code>]',
            'generic-mypy-ignore-used',
            'Generic type ignore can be ambiguous while reading and could be '
            'dangerous for python static typing. So, only error code specific '
            'type ignores are allowed.'
        )
    }

    options = (
        (
            'allowed-type-ignore-error-codes',
                {
                    'default': [],
                    'type': 'csv', 'metavar': '<comma separated list>',
                    'help': 'List of allowed MyPy type ignore error codes.'
                }
        ),
    )

    def visit_module(self, node: astroid.Module) -> None:
        """Visit a module to ensure that there is a comment for each MyPy
        type ignore.

        Args:
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        tokens = pylint_utils.tokenize_module(node)
        self._process_module_tokens(tokens, node)

    def _process_module_tokens(
        self, tokens: List[tokenize.TokenInfo], node: astroid.Module
    ) -> None:
        """Checks if the MyPy type ignores present in a module are properly
        documented by a code comment or not. Also, checks for unnecessary code
        comments for which no corresponding type: ignore is found.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        expected_type_ignore_comment_substring = (
            r'Here we use MyPy ignore because'
        )
        type_ignore_comment_present = False
        no_of_type_ignore_comments = 0
        previous_comment_line_number = 0
        comment_line_number = 0

        for (token_type, _, (line_num, _), _, line) in tokens:
            if token_type == tokenize.COMMENT:
                line = line.lstrip()

                if expected_type_ignore_comment_substring in line:
                    type_ignore_comment_present = True
                    no_of_type_ignore_comments += 1

                    if no_of_type_ignore_comments > 1:
                        previous_comment_line_number = comment_line_number
                        self.add_message(
                            'redundant-type-comment',
                            line=previous_comment_line_number,
                            node=node
                        )

                    comment_line_number = line_num

                specific_type_ignore_matches = re.search(
                    r'(\s*type:\s*ignore)\[([a-z-\s\,]*)\]', line
                )
                if specific_type_ignore_matches:
                    error_codes = (
                        specific_type_ignore_matches.group(2)
                    )

                    encountered_error_codes = []
                    encountered_prohibited_error_codes = []
                    for error_code in error_codes.split(','):
                        error_code = error_code.strip()
                        if (
                            error_code not in
                            self.config.allowed_type_ignore_error_codes
                        ):
                            encountered_prohibited_error_codes.append(
                                error_code
                            )
                        encountered_error_codes.append(error_code)

                    if encountered_prohibited_error_codes:
                        self.add_message(
                            'prohibited-type-ignore-used',
                            line=line_num,
                            args=tuple(encountered_prohibited_error_codes),
                            node=node
                        )
                    if ['no-untyped-call'] == encountered_error_codes:
                        continue
                    if (
                        type_ignore_comment_present and
                        line_num <= (
                            comment_line_number +
                            ALLOWED_LINES_OF_GAP_IN_COMMENT
                        )
                    ):
                        type_ignore_comment_present = False
                        no_of_type_ignore_comments = 0
                    elif not encountered_prohibited_error_codes:
                        self.add_message(
                            'mypy-ignore-used', line=line_num, node=node
                        )
                elif re.search(r'(\s*type:\s*ignore)', line):
                    self.add_message(
                        'generic-mypy-ignore-used', line=line_num, node=node
                    )

        if type_ignore_comment_present:
            self.add_message(
                'redundant-type-comment', line=comment_line_number, node=node)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class SingleSpaceAfterKeyWordChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks that there is a single space
    after keywords like `if`, `elif`, `while`, and `yield`.
    """

    __implements__ = interfaces.ITokenChecker

    name = 'single-space-after-keyword'
    priority = -1
    msgs = {
        'C0029': (
            'Please add a single space after `%s` statement.',
            'single-space-after-keyword',
            'A single space should be added after a keyword.',
        ),
    }

    keywords = set(['if', 'elif', 'while', 'yield'])

    def process_tokens(self, tokens: List[tokenize.TokenInfo]) -> None:
        """Custom pylint checker which makes sure that every keyword is
        followed by a single space.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
        """
        for (token_type, token, (line_num, _), _, line) in tokens:
            if token_type == tokenize.NAME and token in self.keywords:
                line = line.strip()
                # Regex evaluates to True if the line is of the form "if #" or
                # "... if #" where # is not a space.
                if not re.search(r'(\s|^)' + token + r'(\s[^\s]|$)', line):
                    self.add_message(
                        'single-space-after-keyword',
                        args=(token),
                        line=line_num)


class ImportStatusDict(TypedDict):
    """This dictionary which contains the variables
    that tracks the module's import status."""

    single_line_import: bool
    inside_multi_line_import_scope: bool
    import_line_num: int


class TypeStatusDict(TypedDict):
    """The dict containing all the information about the exceptional
    type that was passed to this method."""

    type_comment_pending: bool
    type_comment_line_num: int
    outside_function_signature_block: bool
    outside_args_section: bool
    type_present_inside_arg_section: bool
    type_present_inside_return_section: bool
    type_present_in_function_signature: bool
    args_section_end_line_num: int
    func_def_start_line: int


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class ExceptionalTypesCommentChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker which checks that there is always a comment
    for exceptional types in the backend type annotations.
    """

    EXCEPTIONAL_TYPE_STATUS_DICT: TypeStatusDict = {
        'type_comment_pending': False,
        'type_comment_line_num': 0,
        'outside_function_signature_block': True,
        'outside_args_section': True,
        'type_present_inside_arg_section': False,
        'type_present_inside_return_section': False,
        'type_present_in_function_signature': False,
        'args_section_end_line_num': 0,
        'func_def_start_line': 0,
    }

    __implements__ = interfaces.IAstroidChecker

    name = 'comment-for-exceptional-types'
    priority = -1
    msgs = {
        'C0047': (
            'Any type is used. If the Any type is really needed, then please'
            ' add a proper comment with clear justification why other specific'
            ' types cannot be used. The format of the comment should be'
            ' -> Here we use type Any because ...',
            'any-type-used',
            'Annotations with Any type should only be done for exceptional'
            ' cases with proper explanation in the code comment.'
        ),
        'C0048': (
            'cast function is used. If the cast is really needed, then please'
            ' add a proper comment with clear justification why cast function'
            ' is needed. The format of the comment should be -> Here use cast'
            ' because ...',
            'cast-func-used',
            'Casting of any value should be done with a proper explanation in'
            ' the code comment.'
        ),
        'C0049': (
            'object class is used. If the object class is really needed, then'
            ' please add a proper comment with clear justification why other'
            ' specific types cannot be used. The format of the comment should'
            ' be -> Here we use object because ...',
            'object-class-used',
            'Annotations with object should only be done for exceptional'
            ' cases with proper explanation in the code comment.'
        )
    }

    def visit_module(self, node: astroid.Module) -> None:
        """Visit a module to ensure that there is a comment for each exceptional
        type (cast, Any and object).

        Args:
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        tokens = pylint_utils.tokenize_module(node)
        self._process_module_tokens(tokens, node)

    def _process_module_tokens(
        self, tokens: List[tokenize.TokenInfo], node: astroid.Module
    ) -> None:
        """Checks whether an exceptional type in backend type annotations is
        documented. If exceptional type is not documented, then it adds a
        message accordingly.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        self.check_comment_is_present_with_any_type(tokens, node)
        self.check_comment_is_present_with_cast_method(tokens, node)
        self.check_comment_is_present_with_object_class(tokens, node)

    def _check_import_status(
        self,
        import_status_dict: ImportStatusDict,
        token_type: int,
        token: str,
        line_num: int
    ) -> None:
        """Checks whether the single-line import or multi-line import is
        present inside the module. If multi-line import is present then
        it checks whether the linters are currently inside multi-line
        import's scope or not.

        Args:
            import_status_dict: dict. This dictionary contains the variables
                that tracks the module's import status, where:
                1st element of dict: Indicates whether single line import
                    is encountered or not.
                2nd element of dict: Indicates the line number if import
                    is encountered, otherwise it is zero.
                3rd element of dict: Indicates whether the multi-line import is
                    encountered and linters are in it's scope or not.
                    import(
                        << multi-line import's scope >>
                    )
            token_type: int. The kind of token that pylint provided.
            token: str. The token of module the pylint provided.
            line_num: int. The line number of given token.
        """
        # Checking if single-line import is present.
        # Eg: from typing import Any.
        if token_type == tokenize.NAME:
            if token == 'import':
                import_status_dict['single_line_import'] = True
                import_status_dict['import_line_num'] = line_num

        # Checking if multi-line import is present.
        # Eg: from typing import (
        #   Any, Callable, Dict, FrozenSet, Iterator, List, Set,
        #   Tuple, Type, cast
        # )
        if token_type == tokenize.OP:
            if import_status_dict['single_line_import'] and token == '(':
                import_status_dict['inside_multi_line_import_scope'] = True
                import_status_dict['single_line_import'] = False
            if (
                import_status_dict['inside_multi_line_import_scope'] and
                token == ')'
            ):
                import_status_dict['inside_multi_line_import_scope'] = False

    def _check_exceptional_type_is_documented(
        self,
        type_status_dict: TypeStatusDict,
        import_status_dict: Optional[ImportStatusDict],
        token_type: int,
        token: str,
        line: str,
        line_num: int,
        exceptional_type: str,
        node: astroid.Module
    ) -> None:
        """Checks whether the given exceptional type in a module has been
        documented or not. If the exceptional type is not documented then
        adds an error message.

        Args:
            type_status_dict: dict. The dict containing all the information
                about the exceptional type that was passed to this method.
            import_status_dict: Optional[Dict]. This dictionary contains the
                variables that tracks the module's import status, whether a
                multi-line import or single-line import is present, or None
                if the given exceptional_type is not imported in the module.
            token_type: int. The kind of token that pylint provided.
            token: str. The token of module the pylint provided.
            line: str. The line of the module where current token is present.
            line_num: int. The line number of given token.
            exceptional_type: str. The exceptional type for which this method
                is called, Possible values can be 'Any' or 'object'.
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        # Checking if linters are in argument-section, return-section or
        # outside of the function signature.
        # Eg:
        #       <outside function signature block>
        #   def func(<argument-section>) -> <return-section>:
        #       <outside function signature block>.
        if token_type == tokenize.NAME:
            if token == 'def':
                type_status_dict['outside_function_signature_block'] = False
                type_status_dict['func_def_start_line'] = line_num
                type_status_dict['outside_args_section'] = False

        if token_type == tokenize.OP:
            if token == '->':
                type_status_dict['outside_args_section'] = True
                type_status_dict['args_section_end_line_num'] = line_num
            if type_status_dict['outside_args_section'] and token == ':':
                type_status_dict['outside_function_signature_block'] = True

        # Checking if exceptional_type is present in function definition or not.
        if token_type == tokenize.NAME and token == exceptional_type:
            if not type_status_dict['outside_args_section']:
                type_status_dict['type_present_inside_arg_section'] = True
            elif (
                type_status_dict['outside_args_section'] and
                type_status_dict['args_section_end_line_num'] == line_num
            ):
                type_status_dict['type_present_inside_return_section'] = True

        if (
            type_status_dict['type_present_inside_arg_section'] or
            type_status_dict['type_present_inside_return_section']
        ):
            type_status_dict['type_present_in_function_signature'] = True

        if type_status_dict['outside_function_signature_block']:
            if type_status_dict['type_present_in_function_signature']:
                if (
                    type_status_dict['type_comment_pending'] and
                    type_status_dict['func_def_start_line'] <= (
                        type_status_dict['type_comment_line_num'] +
                        ALLOWED_LINES_OF_GAP_IN_COMMENT
                    )
                ):
                    type_status_dict['type_comment_pending'] = False
                else:
                    self._add_exceptional_type_error_message(
                        exceptional_type,
                        type_status_dict['func_def_start_line'],
                        node
                    )

                type_status_dict['type_present_in_function_signature'] = False
                type_status_dict['type_present_inside_arg_section'] = False
                type_status_dict['type_present_inside_return_section'] = False
            if token_type == tokenize.NAME and token == exceptional_type:
                if exceptional_type == 'object':
                    # Excluding the case when object is called:
                    # Eg: var = object()
                    if 'object()' in line:
                        return
                # Passing those cases where Any is imported.
                if exceptional_type == 'Any' and import_status_dict:
                    if (
                        import_status_dict['single_line_import'] and
                        import_status_dict['import_line_num'] == line_num
                    ):
                        return
                    elif import_status_dict['inside_multi_line_import_scope']:
                        return
                # Checking if comment for exceptional_type is present and it's
                # with in the range (minimum 15 line of gaps).
                if (
                    type_status_dict['type_comment_pending'] and
                    line_num <= (
                        type_status_dict['type_comment_line_num'] +
                        ALLOWED_LINES_OF_GAP_IN_COMMENT
                    )
                ):
                    type_status_dict['type_comment_pending'] = False
                else:
                    self._add_exceptional_type_error_message(
                        exceptional_type, line_num, node
                    )

    def _add_exceptional_type_error_message(
        self, exceptional_type: str, line_num: int, node: astroid.Module
    ) -> None:
        """This method should be called only when an exceptional type error is
        encountered. If the exceptional type is Any then 'any-type-used' error
        message is added, for object 'object-class-used' is added and for cast
        'cast-func-used' is added.

        Args:
            exceptional_type: str. The exceptional type for which this method
                is called, Possible values can be 'Any', 'object' and 'cast'.
            line_num: int. The line number where error is encountered.
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        if exceptional_type == 'Any':
            self.add_message(
                'any-type-used', line=line_num, node=node
            )
        if exceptional_type == 'object':
            self.add_message(
                'object-class-used', line=line_num, node=node
            )
        if exceptional_type == 'cast':
            self.add_message(
                'cast-func-used', line=line_num, node=node
            )

    def check_comment_is_present_with_object_class(
        self, tokens: List[tokenize.TokenInfo], node: astroid.Module
    ) -> None:
        """Checks whether the object class in a module has been documented
        or not. If the object class is not documented then adds an error
        message.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
            node: astroid.Module. Node to access module content.
        """
        object_class_status_dict: TypeStatusDict = copy.deepcopy(
            self.EXCEPTIONAL_TYPE_STATUS_DICT
        )

        expected_object_class_comment_substring = r'Here we use object because'

        for (token_type, token, (line_num, _), _, line) in tokens:
            line = line.strip()

            if token_type == tokenize.COMMENT:
                if expected_object_class_comment_substring in line:
                    object_class_status_dict[
                        'type_comment_pending'
                    ] = True
                    object_class_status_dict['type_comment_line_num'] = line_num

            self._check_exceptional_type_is_documented(
                object_class_status_dict, None, token_type, token,
                line, line_num, 'object', node
            )

    def check_comment_is_present_with_cast_method(
        self, tokens: List[tokenize.TokenInfo], node: astroid.Module
    ) -> None:
        """Checks whether the cast method in a module has been documented
        or not. If the cast method is not documented then adds an error
        message.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
            node: astroid.scoped_nodes.Module. Node to access module content.
        """
        expected_cast_method_comment_substring = r'Here we use cast because'
        cast_comment_present = False
        cast_comment_line_num = 0
        import_status_dict: ImportStatusDict = {
            'single_line_import': False,
            'import_line_num': 0,
            'inside_multi_line_import_scope': False
        }

        for (token_type, token, (line_num, _), _, line) in tokens:
            line = line.strip()

            if token_type == tokenize.COMMENT:
                if expected_cast_method_comment_substring in line:
                    cast_comment_present = True
                    cast_comment_line_num = line_num

            self._check_import_status(
                import_status_dict, token_type, token, line_num
            )

            if token_type == tokenize.NAME and token == 'cast':
                # Passing those cases where cast is imported.
                if (
                    import_status_dict['single_line_import'] and
                    import_status_dict['import_line_num'] == line_num
                ):
                    pass
                elif import_status_dict['inside_multi_line_import_scope']:
                    pass
                # Throwing an error when cast is encountered but there is no
                # corresponding comment exist.
                elif (
                    cast_comment_present and
                    line_num <= (
                        cast_comment_line_num +
                        ALLOWED_LINES_OF_GAP_IN_COMMENT
                    )
                ):
                    cast_comment_present = False
                else:
                    self._add_exceptional_type_error_message(
                        'cast', line_num, node
                    )

    def check_comment_is_present_with_any_type(
        self, tokens: List[tokenize.TokenInfo], node: astroid.Module
    ) -> None:
        """Checks whether the Any type in a module has been documented
        or not. If the Any type is not documented then adds an error
        message.

        Args:
            tokens: List[TokenInfo]. Object to access all tokens of a module.
            node: astroid.Module. Node to access module content.
        """
        import_status_dict: ImportStatusDict = {
            'single_line_import': False,
            'import_line_num': 0,
            'inside_multi_line_import_scope': False
        }

        any_type_status_dict: TypeStatusDict = copy.deepcopy(
            self.EXCEPTIONAL_TYPE_STATUS_DICT
        )

        expected_any_type_comment_substring = r'Here we use type Any because'

        for (token_type, token, (line_num, _), _, line) in tokens:
            line = line.strip()

            if token_type == tokenize.COMMENT:
                if expected_any_type_comment_substring in line:
                    any_type_status_dict[
                        'type_comment_pending'
                    ] = True
                    any_type_status_dict['type_comment_line_num'] = line_num

            self._check_import_status(
                import_status_dict, token_type, token, line_num
            )

            self._check_exceptional_type_is_documented(
                any_type_status_dict, import_status_dict, token_type, token,
                line, line_num, 'Any', node
            )


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class InequalityWithNoneChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker prohibiting use of "if x != None" and
    enforcing use of "if x is not None" instead.
    """

    __implements__ = interfaces.IAstroidChecker

    name = 'inequality-with-none'
    priority = -1
    msgs = {
        'C0030': (
            'Please refrain from using "x != None" '
            'and use "x is not None" instead.',
            'inequality-with-none',
            'Use "is" to assert equality or inequality against None.'
        )
    }

    def visit_compare(self, node: astroid.Compare) -> None:
        """Called for comparisons (a != b).

        Args:
            node: astroid.Compare. A node indicating comparison.
        """

        ops = node.ops
        for operator, operand in ops:
            if operator != '!=':
                continue
            # Check if value field is in operand node, since
            # not all righthand side nodes will have this field.
            if 'value' in vars(operand) and operand.value is None:
                self.add_message('inequality-with-none', node=node)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class NonTestFilesFunctionNameChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker prohibiting use of "test_only" prefix in function
    names of non-test files.
    """

    __implements__ = interfaces.IAstroidChecker

    name = 'non-test-files-function-name-checker'
    priority = -1
    msgs = {
        'C0031': (
            'Please change the name of the function so that it does not use '
            '"test_only" as its prefix in non-test files.',
            'non-test-files-function-name-checker',
            'Prohibit use of "test_only" prefix in function names of non-test '
            'files.'
        )
    }

    def visit_functiondef(self, node: astroid.FunctionDef) -> None:
        """Visit every function definition and ensure their name doesn't have
        test_only as its prefix.

        Args:
            node: astroid.FunctionDef. A node for a function or method
                definition in the AST.
        """
        modnode = node.root()
        if modnode.name.endswith('_test'):
            return
        function_name = node.name
        if function_name.startswith('test_only'):
            self.add_message(
                'non-test-files-function-name-checker', node=node)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class DisallowedFunctionsChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker for language specific general purpose
    regex checks of functions calls to be removed or replaced.
    """

    __implements__ = interfaces.IAstroidChecker
    name = 'disallowed-function-calls'
    priority = -1
    msgs = {
        'C0032': (
            'Please remove the call to %s.',
            'remove-disallowed-function-calls',
            (
                'Disallows usage of black-listed functions that '
                'should be removed.'),
        ),
        'C0033': (
            'Please replace the call to %s with %s.',
            'replace-disallowed-function-calls',
            (
                'Disallows usage of black-listed functions that '
                'should be replaced by allowed alternatives.'),
        ),
    }

    options = (
        (
            'disallowed-functions-and-replacements-str',
            {
                'default': (),
                'type': 'csv',
                'metavar': '<comma separated list>',
                'help': (
                    'List of strings of disallowed function names. '
                    'Strings should be either in the format (1) "A=>B", '
                    'where A is the disallowed function and B is the '
                    'replacement, or (2) in the format "A", which signifies '
                    'that A should just be removed.')
            },
        ),
        (
            'disallowed-functions-and-replacements-regex',
            {
                'default': (),
                'type': 'csv',
                'metavar': '<comma separated list>',
                'help': (
                    'List of strings of regex to find disallowed function '
                    'names. Strings should be either in the format "A=>B", '
                    'where A is a regex for the disallowed function and B '
                    'is the replacement or in the format "A", which '
                    ' signifies that A should just be removed. '
                    'An example regex entry is: ".*func=>other", which '
                    'suggests "somefunc" be replaced by "other".')
            },
        ),)

    def __init__(self, linter: Optional[lint.PyLinter] = None) -> None:
        super().__init__(linter=linter)
        self.funcs_to_replace_str: Dict[str, str] = {}
        self.funcs_to_remove_str: Set[str] = set()
        self.funcs_to_replace_regex: List[Tuple[Pattern[str], str]] = []
        self.funcs_to_remove_regex: Optional[Pattern[str]] = None

    def open(self) -> None:
        self._populate_disallowed_functions_and_replacements_str()
        self._populate_disallowed_functions_and_replacements_regex()

    def _populate_disallowed_functions_and_replacements_str(self) -> None:
        """Parse pylint config entries for replacements of disallowed
        functions represented by strings.
        """
        for entry in self.config.disallowed_functions_and_replacements_str:
            splits = [s.strip() for s in entry.split('=>')]
            assert len(splits) in (1, 2)
            if len(splits) == 1:
                self.funcs_to_remove_str.add(splits[0])
            else:
                self.funcs_to_replace_str[splits[0]] = splits[1]

    def _populate_disallowed_functions_and_replacements_regex(self) -> None:
        """Parse pylint config entries for replacements of disallowed
        functions represented by regex.
        """
        remove_regexes = []
        for entry in self.config.disallowed_functions_and_replacements_regex:
            splits = [s.strip() for s in entry.split('=>')]
            assert len(splits) in (1, 2)
            if len(splits) == 1:
                remove_regexes.append(splits[0])
            else:
                rgx = re.compile(r'{}'.format(splits[0]))
                self.funcs_to_replace_regex.append((rgx, splits[1]))

        # Store removal regexes as one large regex, concatenated by "|".
        if len(remove_regexes) > 0:
            self.funcs_to_remove_regex = (
                re.compile(r'{}'.format('|'.join(remove_regexes))))

    def visit_call(self, node: astroid.Call) -> None:
        """Visit a function call to ensure that the call is
        not using any disallowed functions.

        Args:
            node: astroid.Call. Node to access call content.
        """
        func = node.func.as_string()
        if func in self.funcs_to_replace_str:
            self.add_message(
                'replace-disallowed-function-calls',
                node=node, args=(func, self.funcs_to_replace_str[func]))
        elif (
                func in self.funcs_to_remove_str
                or (
                    self.funcs_to_remove_regex is not None
                    and self.funcs_to_remove_regex.match(func) is not None
                )
            ):
            self.add_message(
                'remove-disallowed-function-calls',
                node=node, args=func)
        else:
            # Search through list of replacement regexes entries
            # (tuple(rgx, replacement)). If a match is found, return the
            # corresponding replacement.
            for rgx, replacement in self.funcs_to_replace_regex:
                if rgx.match(func) is not None:
                    self.add_message(
                        'replace-disallowed-function-calls',
                        node=node, args=(func, replacement))
                    break


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class DisallowHandlerWithoutSchema(checkers.BaseChecker):  # type: ignore[misc]
    """Custom pylint checker prohibiting handlers which do not have schema
    defined within the class.
    """

    __implements__ = interfaces.IAstroidChecker

    name = 'disallow-handlers-without-schema'
    priority = -1
    msgs = {
        'C0035': (
            'Please add schema in URL_ARGS_PATH_SCHEMA for %s class. \nVisit '
            'https://github.com/oppia/oppia/wiki/Writing-schema-for-'
            'handler-args'
            'to learn how to write schema for handlers.',
            'no-schema-for-url-path-elements',
            'Enforce writing schema for url path arguments of handler class.'
        ),
        'C0036': (
            'Please add schema in HANDLER_ARGS_SCHEMA for %s class. \nVisit '
            'https://github.com/oppia/oppia/wiki/Writing-schema-for-'
            'handler-args'
            'to learn how to write schema for handlers.',
            'no-schema-for-handler-args',
            'Enforce writing schema for request arguments of handler class.'
        ),
        'C0037': (
            'URL_PATH_ARGS_SCHEMAS for %s class must be dict.',
            'url-path-args-schemas-must-be-dict',
            'Enforce URL_ARGS_PATH_SCHEMAS to be of dict type.'
        ),
        'C0038': (
            'HANDLER_ARGS_SCHEMAS for %s class must be dict.',
            'handler-args-schemas-must-be-dict',
            'Enforce HANDLER_ARGS_SCHEMAS to be of dict type.'
        )
    }

    def check_given_variable_is_a_dict(
        self, node: astroid.ClassDef, variable_name: str
    ) -> bool:
        """Checks whether schema variable of a handlers class is of dict type.

        Args:
            node: astroid.nodes.ClassDef. Node for a class definition
                in the AST.
            variable_name: str. Name of the variable which contains schemas.

        Returns:
            bool. Whether schema variable of a class is of dict type.
        """
        generator_object_for_value_of_schemas = (
            node.locals[variable_name][0].assigned_stmts())

        for value_of_schemas in generator_object_for_value_of_schemas:
            if value_of_schemas.name != 'dict':
                return False
        return True

    def check_parent_class_is_basehandler(
        self, node: astroid.ClassDef
    ) -> bool:
        """Checks whether the parent class of given class is BaseHandler.

        Args:
            node: astroid.nodes.ClassDef. Node for a class definition
                in the AST.

        Returns:
            bool. Whether the parent class of given class is BaseHandler.
        """
        for ancestor_node in node.ancestors():
            if ancestor_node.name == u'BaseHandler':
                return True
        return False

    def visit_classdef(self, node: astroid.nodes.ClassDef) -> None:
        """Visit each class definition in controllers layer module and check
        if it contains schema or not.

        Args:
            node: astroid.nodes.ClassDef. Node for a class definition
                in the AST.
        """
        if not self.check_parent_class_is_basehandler(node):
            return

        if (
            node.name in
            handler_schema_constants.HANDLER_CLASS_NAMES_WITH_NO_SCHEMA
        ):
            return

        if 'URL_PATH_ARGS_SCHEMAS' not in node.locals:
            self.add_message(
                'no-schema-for-url-path-elements', node=node, args=node.name)
        elif not self.check_given_variable_is_a_dict(
                node, 'URL_PATH_ARGS_SCHEMAS'):
            self.add_message(
                'url-path-args-schemas-must-be-dict',
                node=node, args=node.name)

        if 'HANDLER_ARGS_SCHEMAS' not in node.locals:
            self.add_message(
                'no-schema-for-handler-args', node=node, args=node.name)
        elif not self.check_given_variable_is_a_dict(
                node, 'HANDLER_ARGS_SCHEMAS'):
            self.add_message(
                'handler-args-schemas-must-be-dict',
                node=node, args=node.name)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class DisallowedImportsChecker(checkers.BaseChecker):  # type: ignore[misc]
    """Check that disallowed imports are not made."""

    __implements__ = interfaces.IAstroidChecker

    name = 'disallowed-imports'
    priority = -1
    msgs = {
        'C0039': (
            'Please use str instead of Text',
            'disallowed-text-import',
            'Disallow import of Text from typing module',
        ),
    }

    def visit_importfrom(self, node: astroid.nodes.ImportFrom) -> None:
        """Visits all import-from statements in a python file and ensures that
        only allowed imports are made.

        Args:
            node: astroid.node_classes.ImportFrom. Node for a import-from
                statement in the AST.
        """
        if node.modname != 'typing':
            return
        for (name, _) in node.names:
            if name == 'Text':
                self.add_message('disallowed-text-import', node=node)


def register(linter: lint.PyLinter) -> None:
    """Registers the checker with pylint.

    Args:
        linter: Pylinter. The Pylinter object.
    """
    linter.register_checker(HangingIndentChecker(linter))
    linter.register_checker(DocstringParameterChecker(linter))
    linter.register_checker(ImportOnlyModulesChecker(linter))
    linter.register_checker(BackslashContinuationChecker(linter))
    linter.register_checker(FunctionArgsOrderChecker(linter))
    linter.register_checker(RestrictedImportChecker(linter))
    linter.register_checker(SingleCharAndNewlineAtEOFChecker(linter))
    linter.register_checker(SingleLineCommentChecker(linter))
    linter.register_checker(BlankLineBelowFileOverviewChecker(linter))
    linter.register_checker(SingleLinePragmaChecker(linter))
    linter.register_checker(TypeIgnoreCommentChecker(linter))
    linter.register_checker(SingleSpaceAfterKeyWordChecker(linter))
    linter.register_checker(ExceptionalTypesCommentChecker(linter))
    linter.register_checker(InequalityWithNoneChecker(linter))
    linter.register_checker(NonTestFilesFunctionNameChecker(linter))
    linter.register_checker(DisallowedFunctionsChecker(linter))
    linter.register_checker(DisallowHandlerWithoutSchema(linter))
    linter.register_checker(DisallowedImportsChecker(linter))
