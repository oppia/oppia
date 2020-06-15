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
presubmit checks.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
import sys

import python_utils
from .. import docstrings_checker

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.9.4')
sys.path.insert(0, _PYLINT_PATH)

# List of punctuation symbols that can be used at the end of
# comments and docstrings.
ALLOWED_TERMINATING_PUNCTUATIONS = ['.', '?', '}', ']', ')']

# If any of these phrases are found inside a docstring or comment,
# the punctuation and capital letter checks will be skipped for that
# comment or docstring.
EXCLUDED_PHRASES = [
    'utf', 'pylint:', 'http://', 'https://', 'scripts/', 'extract_node']

# pylint: disable=wrong-import-order
# pylint: disable=wrong-import-position
import astroid  # isort:skip
from pylint import checkers  # isort:skip
from pylint import interfaces  # isort:skip
from pylint.checkers import typecheck  # isort:skip
from pylint.checkers import utils as checker_utils  # isort:skip
# pylint: enable=wrong-import-position
# pylint: enable=wrong-import-order


def read_from_node(node):
    """Returns the data read from the ast node in unicode form.

    Args:
        node: astroid.scoped_nodes.Function. Node to access module content.

    Returns:
        list(str). The data read from the ast node.
    """
    return list([line.decode('utf-8') for line in node.stream().readlines()])


class ExplicitKeywordArgsChecker(checkers.BaseChecker):
    """Custom pylint checker which checks for explicit keyword arguments
    in any function call.
    """
    __implements__ = interfaces.IAstroidChecker

    name = 'explicit-keyword-args'
    priority = -1
    msgs = {
        'C0001': (
            'Keyword argument %s should be named explicitly in %s call of %s.',
            'non-explicit-keyword-args',
            'All keyword arguments should be explicitly named in function call.'
        ),
    }

    def visit_call(self, node):
        """Visits each function call in a lint check.

        Args:
            node: Call. The current function call node.
        """
        called = checker_utils.safe_infer(node.func)

        try:
            # For the rationale behind the Pylint pragma below,
            # see https://stackoverflow.com/a/35701863/8115428
            called, implicit_args, callable_name = (
                typecheck._determine_callable(called))  # pylint: disable=protected-access
        except ValueError:
            return

        if called.args.args is None:
            # Built-in functions have no argument information.
            return

        if len(called.argnames()) != len(set(called.argnames())):
            return

        # Build the set of keyword arguments and count the positional arguments.
        call_site = astroid.arguments.CallSite.from_call(node)

        num_positional_args = len(call_site.positional_arguments)
        keyword_args = list(call_site.keyword_arguments.keys())

        already_filled_positionals = getattr(called, 'filled_positionals', 0)
        already_filled_keywords = getattr(called, 'filled_keywords', {})

        keyword_args += list(already_filled_keywords)
        num_positional_args += already_filled_positionals
        num_positional_args += implicit_args

        # Analyze the list of formal parameters.
        num_mandatory_parameters = len(called.args.args) - len(
            called.args.defaults)

        parameters = []
        parameter_name_to_index = {}
        for i, arg in enumerate(called.args.args):
            if isinstance(arg, astroid.Tuple):
                name = None
            else:
                assert isinstance(arg, astroid.AssignName)
                name = arg.name
                parameter_name_to_index[name] = i
            if i >= num_mandatory_parameters:
                defval = called.args.defaults[i - num_mandatory_parameters]
            else:
                defval = None
            parameters.append([(name, defval), False])

        num_positional_args_unused = num_positional_args
        # Check that all parameters with a default value have
        # been called explicitly.
        for [(name, defval), _] in parameters:
            if defval:
                display_name = repr(name)

                if name not in keyword_args and (
                        num_positional_args_unused > (
                            num_mandatory_parameters)) and (
                                callable_name != 'constructor'):
                    # This try/except block tries to get the function
                    # name. Since each node may differ, multiple
                    # blocks have been used.
                    try:
                        func_name = node.func.attrname
                    except AttributeError:
                        func_name = node.func.name

                    self.add_message(
                        'non-explicit-keyword-args', node=node,
                        args=(
                            display_name,
                            callable_name,
                            func_name))
                    num_positional_args_unused -= 1


class HangingIndentChecker(checkers.BaseChecker):
    """Custom pylint checker which checks for break after parenthesis in case
    of hanging indentation.
    """
    __implements__ = interfaces.IRawChecker

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
            node: astroid.scoped_nodes.Function. Node to access module content.
        """
        file_content = read_from_node(node)
        file_length = len(file_content)
        exclude = False
        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].lstrip().rstrip()
            # The source files are read as bytes, hence the b' prefix.
            if line.startswith(b'"""') and not line.endswith(b'"""'):
                exclude = True
            if line.endswith(b'"""'):
                exclude = False
            if line.startswith(b'#') or exclude:
                continue
            line_length = len(line)
            bracket_count = 0
            for char_num in python_utils.RANGE(line_length):
                char = line[char_num]
                if char == b'(':
                    if bracket_count == 0:
                        position = char_num
                    bracket_count += 1
                elif char == b')' and bracket_count > 0:
                    bracket_count -= 1
            if bracket_count > 0 and position + 1 < line_length:
                content = line[position + 1:]
                if not len(content) or not b',' in content:
                    continue
                split_list = content.split(b', ')
                if len(split_list) == 1 and not any(
                        char.isalpha() for char in split_list[0]):
                    continue
                separators = set('@^! #%$&)(+*-=')
                if not any(char in separators for item in split_list
                           for char in item):
                    self.add_message(
                        'no-break-after-hanging-indent', line=line_num + 1)


# The following class was derived from
# https://github.com/PyCQA/pylint/blob/377cc42f9e3116ff97cddd4567d53e9a3e24ebf9/pylint/extensions/docparams.py#L26
class DocstringParameterChecker(checkers.BaseChecker):
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
        'W9005': ('"%s" has constructor parameters '
                  'documented in class and __init__',
                  'multiple-constructor-doc',
                  'Please remove parameter declarations '
                  'in the class or constructor.'),
        'W9006': ('"%s" not documented as being raised',
                  'missing-raises-doc',
                  'Please document exceptions for '
                  'all raised exception types.'),
        'W9008': ('Redundant returns documentation',
                  'redundant-returns-doc',
                  'Please remove the return/rtype '
                  'documentation from this method.'),
        'W9010': ('Redundant yields documentation',
                  'redundant-yields-doc',
                  'Please remove the yields documentation from this method.'),
        'W9011': ('Missing return documentation',
                  'missing-return-doc',
                  'Please add documentation about what this method returns.',
                  {'old_names': [('W9007', 'missing-returns-doc')]}),
        'W9012': ('Missing return type documentation',
                  'missing-return-type-doc',
                  'Please document the type returned by this method.',
                  # We can't use the same old_name for two different warnings
                  # {'old_names': [('W9007', 'missing-returns-doc')]}.
                 ),
        'W9013': ('Missing yield documentation',
                  'missing-yield-doc',
                  'Please add documentation about what this generator yields.',
                  {'old_names': [('W9009', 'missing-yields-doc')]}),
        'W9014': ('Missing yield type documentation',
                  'missing-yield-type-doc',
                  'Please document the type yielded by this method.',
                  # We can't use the same old_name for two different warnings
                  # {'old_names': [('W9009', 'missing-yields-doc')]}.
                 ),
        'W9015': ('"%s" missing in parameter documentation',
                  'missing-param-doc',
                  'Please add parameter declarations for all parameters.',
                  {'old_names': [('W9003', 'missing-param-doc')]}),
        'W9016': ('"%s" missing in parameter type documentation',
                  'missing-type-doc',
                  'Please add parameter type declarations for all parameters.',
                  {'old_names': [('W9004', 'missing-type-doc')]}),
        'W9017': ('"%s" differing in parameter documentation',
                  'differing-param-doc',
                  'Please check parameter names in declarations.',
                 ),
        'W9018': ('"%s" differing in parameter type documentation',
                  'differing-type-doc',
                  'Please check parameter names in type declarations.',
                 ),
    }

    options = (('accept-no-param-doc',
                {'default': True, 'type': 'yn', 'metavar': '<y or n>',
                 'help': 'Whether to accept totally missing parameter '
                         'documentation in the docstring of a '
                         'function that has parameters.'
                }),
               ('accept-no-raise-doc',
                {'default': True, 'type': 'yn', 'metavar': '<y or n>',
                 'help': 'Whether to accept totally missing raises '
                         'documentation in the docstring of a function that '
                         'raises an exception.'
                }),
               ('accept-no-return-doc',
                {'default': True, 'type': 'yn', 'metavar': '<y or n>',
                 'help': 'Whether to accept totally missing return '
                         'documentation in the docstring of a function that '
                         'returns a statement.'
                }),
               ('accept-no-yields-doc',
                {'default': True, 'type': 'yn', 'metavar': '<y or n>',
                 'help': 'Whether to accept totally missing yields '
                         'documentation in the docstring of a generator.'
                }),
              )

    priority = -2

    constructor_names = {'__init__', '__new__'}
    not_needed_param_in_docstring = {'self', 'cls'}

    def visit_functiondef(self, node):
        """Called for function and method definitions (def).

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
                method definition in the AST.
        """
        node_doc = docstrings_checker.docstringify(node.doc)
        self.check_functiondef_params(node, node_doc)
        self.check_functiondef_returns(node, node_doc)
        self.check_functiondef_yields(node, node_doc)

    def check_functiondef_params(self, node, node_doc):
        """Checks whether all parameters in a function definition are
        documented.

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
                method definition in the AST.
            node_doc: Docstring. Pylint Docstring class instance representing
                a node's docstring.
        """
        node_allow_no_param = None
        if node.name in self.constructor_names:
            class_node = checker_utils.node_frame_class(node)
            if class_node is not None:
                class_doc = docstrings_checker.docstringify(class_node.doc)
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

    def check_functiondef_returns(self, node, node_doc):
        """Checks whether a function documented with a return value actually has
        a return statement in its definition.

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
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

    def check_functiondef_yields(self, node, node_doc):
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

    def visit_raise(self, node):
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
            property_ = docstrings_checker.get_setters_property(func_node)
            if property_:
                func_node = property_

        doc = docstrings_checker.docstringify(func_node.doc)
        if not doc.is_valid():
            if doc.doc:
                self._handle_no_raise_doc(expected_excs, func_node)
            return

        found_excs = doc.exceptions()
        missing_excs = expected_excs - found_excs
        self._add_raise_message(missing_excs, func_node)

    def visit_return(self, node):
        """Visits a function node that contains a return statement and verifies
        that the return value and the return type are documented.

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
                method definition in the AST.
        """
        if not docstrings_checker.returns_something(node):
            return

        func_node = node.frame()

        doc = docstrings_checker.docstringify(func_node.doc)
        if not doc.is_valid() and self.config.accept_no_return_doc:
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

    def visit_yield(self, node):
        """Visits a function node that contains a yield statement and verifies
        that the yield value and the yield type are documented.

        Args:
            node: astroid.scoped_nodes.Function. Node for a function or
                method definition in the AST.
        """
        func_node = node.frame()

        doc = docstrings_checker.docstringify(func_node.doc)
        if not doc.is_valid() and self.config.accept_no_yields_doc:
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

    def visit_yieldfrom(self, node):
        """Visits a function node that contains a yield from statement and
        verifies that the yield from value and the yield from type are
        documented.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """
        self.visit_yield(node)

    def check_arguments_in_docstring(
            self, doc, arguments_node, warning_node, accept_no_param_doc=None):
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
                found_argument_names, message_id, not_needed_names):
            """Compare the found argument names with the expected ones and
            generate a message if there are arguments missing.

            Args:
                found_argument_names: set. Argument names found in the
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
                found_argument_names, message_id, not_needed_names):
            """Compare the found argument names with the expected ones and
            generate a message if there are extra arguments found.

            Args:
                found_argument_names: set. Argument names found in the
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

        _compare_missing_args(params_with_doc, 'missing-param-doc',
                              self.not_needed_param_in_docstring)
        _compare_missing_args(params_with_type, 'missing-type-doc',
                              not_needed_type_in_docstring)

        _compare_different_args(params_with_doc, 'differing-param-doc',
                                self.not_needed_param_in_docstring)
        _compare_different_args(params_with_type, 'differing-type-doc',
                                not_needed_type_in_docstring)

    def check_single_constructor_params(self, class_doc, init_doc, class_node):
        """Checks whether a class and corresponding  init() method are
        documented. If both of them are documented, it adds an error message.

        Args:
            class_doc: Docstring. Pylint docstring class instance representing
                a class's docstring.
            init_doc:  Docstring. Pylint docstring class instance representing
                a method's docstring, the method here is the constructor method
                for the above class.
            class_node: astroid.scoped_nodes.Function. Node for class definition
                in AST.
        """
        if class_doc.has_params() and init_doc.has_params():
            self.add_message(
                'multiple-constructor-doc',
                args=(class_node.name,),
                node=class_node)

    def _handle_no_raise_doc(self, excs, node):
        """Checks whether the raised exception in a function has been
        documented, add a message otherwise.

        Args:
            excs: list(str). A list of exception types.
            node: astroid.scoped_nodes.Function. Node to access module content.
        """
        if self.config.accept_no_raise_doc:
            return

        self._add_raise_message(excs, node)

    def _add_raise_message(self, missing_excs, node):
        """Adds a message on :param:`node` for the missing exception type.

        Args:
            missing_excs: list. A list of missing exception types.
            node: astroid.node_classes.NodeNG. The node show the message on.
        """
        if not missing_excs:
            return

        self.add_message(
            'missing-raises-doc',
            args=(', '.join(sorted(missing_excs)),),
            node=node)


class ImportOnlyModulesChecker(checkers.BaseChecker):
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

    @checker_utils.check_messages('import-only-modules')
    def visit_importfrom(self, node):
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

        if node.level is None:
            modname = node.modname
        else:
            modname = '.' * node.level + node.modname

        for (name, _) in node.names:
            if name == 'constants':
                continue
            try:
                imported_module.import_module(name, True)
            except astroid.AstroidImportError:
                self.add_message(
                    'import-only-modules',
                    node=node,
                    args=(name, modname),
                )


class BackslashContinuationChecker(checkers.BaseChecker):
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

    def process_module(self, node):
        """Process a module.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """
        file_content = read_from_node(node)
        for (line_num, line) in enumerate(file_content):
            if line.rstrip(b'\r\n').endswith(b'\\'):
                self.add_message(
                    'backslash-continuation', line=line_num + 1)


class FunctionArgsOrderChecker(checkers.BaseChecker):
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

    def visit_functiondef(self, node):
        """Visits every function definition in the python file and check the
        function arguments order. It then adds a message accordingly.

        Args:
         node: astroid.scoped_nodes.Function. Node for a function or method
                definition in the AST.
        """

        args_list = [args.name for args in node.args.args]
        if 'self' in args_list and args_list[0] != 'self':
            self.add_message('function-args-order-self', node=node)
        elif 'cls' in args_list and args_list[0] != 'cls':
            self.add_message('function-args-order-cls', node=node)


class RestrictedImportChecker(checkers.BaseChecker):
    """Custom pylint checker which checks layers importing modules
    from their respective restricted layers.
    """

    __implements__ = interfaces.IAstroidChecker
    name = 'invalid-import'
    priority = -1
    msgs = {
        'C0009': (
            'Importing %s layer in %s layer is prohibited.',
            'invalid-import',
            'Storage layer and domain layer must not import'
            'domain layer and controller layer respectively.'),
    }

    def visit_import(self, node):
        """Visits every import statement in the file.

        Args:
         node: astroid.node_classes.Import. Node for a import statement
                 in the AST.
        """

        modnode = node.root()
        names = [name for name, _ in node.names]
        # Checks import of domain layer in storage layer.
        if 'oppia.core.storage' in modnode.name and not '_test' in modnode.name:
            if any('core.domain' in name for name in names):
                self.add_message(
                    'invalid-import',
                    node=node,
                    args=('domain', 'storage'),
                )
        # Checks import of controller layer in domain layer.
        if 'oppia.core.domain' in modnode.name and not '_test' in modnode.name:
            if any('core.controllers' in name for name in names):
                self.add_message(
                    'invalid-import',
                    node=node,
                    args=('controller', 'domain'),
                )

    def visit_importfrom(self, node):
        """Visits all import-from statements in a python file and checks that
        modules are imported. It then adds a message accordingly.

        Args:
            node: astroid.node_classes.ImportFrom. Node for a import-from
                statement in the AST.
        """

        modnode = node.root()
        if 'oppia.core.storage' in modnode.name and not '_test' in modnode.name:
            if 'core.domain' in node.modname:
                self.add_message(
                    'invalid-import',
                    node=node,
                    args=('domain', 'storage'),
                )
        if 'oppia.core.domain' in modnode.name and not '_test' in modnode.name:
            if 'core.controllers' in node.modname:
                self.add_message(
                    'invalid-import',
                    node=node,
                    args=('controller', 'domain'),
                )


class SingleCharAndNewlineAtEOFChecker(checkers.BaseChecker):
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

    def process_module(self, node):
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


class SingleSpaceAfterYieldChecker(checkers.BaseChecker):
    """Checks if only one space is used after a yield statement
    when applicable ('yield' is acceptable).
    """
    __implements__ = interfaces.IRawChecker

    name = 'single-space-after-yield'
    priority = -1
    msgs = {
        'C0010': (
            'Not using \'yield\' or a single space after yield statement.',
            'single-space-after-yield',
            'Ensure a single space is used after yield statement.',
        ),
    }

    def process_module(self, node):
        """Process a module to ensure that yield keywords are followed by
        exactly one space, so matching 'yield *' where * is not a
        whitespace character. Note that 'yield' is also acceptable in
        cases where the user wants to yield nothing.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module
                content.
        """
        in_multi_line_comment = False
        multi_line_indicator = b'"""'
        file_content = read_from_node(node)
        for (line_num, line) in enumerate(file_content):
            bare_line = line.strip()

            # Single multi-line comment, ignore it.
            if bare_line.count(multi_line_indicator) == 2:
                continue

            # Flip multi-line boolean depending on whether or not we see
            # the multi-line indicator. Possible for multiline comment to
            # be somewhere other than the start of a line (e.g. func arg),
            # so we can't look at start of or end of a line, which is why
            # the case where two indicators in a single line is handled
            # separately (i.e. one line comment with multi-line strings).
            if multi_line_indicator in bare_line:
                in_multi_line_comment = not in_multi_line_comment

            # Ignore anything inside a multi-line comment.
            if in_multi_line_comment:
                continue

            # Whitespace to right of yield keyword is important for regex.
            # Allows alphabet characters and underscore for cases where 'yield'
            # is used at the start of a variable name.
            source_line = line.lstrip()
            if (source_line.startswith(b'yield') and
                    not re.search(br'^(yield)( \S|$|\w)', source_line)):
                self.add_message('single-space-after-yield', line=line_num + 1)


class ExcessiveEmptyLinesChecker(checkers.BaseChecker):
    """Checks if there are excessive newlines between method definitions."""
    __implements__ = interfaces.IRawChecker

    name = 'excessive-new-lines'
    priority = -1
    msgs = {
        'C0011': (
            'Excessive new lines between function definations.',
            'excessive-new-lines',
            'Remove extra newlines.'
        )
    }

    def process_module(self, node):
        """Process a module to ensure that method definitions are not seperated
        by more than two blank lines.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """
        in_multi_line_comment = False
        multi_line_indicator = b'"""'
        file_content = read_from_node(node)
        file_length = len(file_content)
        blank_line_counter = 0

        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].strip()

            # Single multi-line comment, ignore it.
            if line.count(multi_line_indicator) == 2:
                continue

            # Flip multi-line boolean depending on whether or not we see
            # the multi-line indicator. Possible for multiline comment to
            # be somewhere other than the start of a line (e.g. func arg),
            # so we can't look at start of or end of a line, which is why
            # the case where two indicators in a single line is handled
            # separately (i.e. one line comment with multi-line strings).
            if multi_line_indicator in line:
                in_multi_line_comment = not in_multi_line_comment

            # Ignore anything inside a multi-line comment.
            if in_multi_line_comment:
                continue

            if file_content[line_num] == b'\n':
                blank_line_counter += 1
            else:
                blank_line_counter = 0

            if line_num + 1 < file_length and blank_line_counter > 2:
                line = file_content[line_num + 1].strip()
                if line.startswith(b'def') or line.startswith(b'@'):
                    self.add_message('excessive-new-lines', line=line_num + 1)


class SingleNewlineAboveArgsChecker(checkers.BaseChecker):
    """Checker for single space above args in python doc string."""

    __implements__ = interfaces.IRawChecker
    name = 'single-space-above-args-raises-returns'
    priority = -1
    msgs = {
        'C0012': (
            'Files must have a single newline above args in doc string.',
            'single-space-above-args',
            'Please enter a single newline above args in doc string.'
        ),
        'C0013': (
            'Files must have a single newline above returns in doc string.',
            'single-space-above-returns',
            'Please enter a single newline above returns in doc string.'
        ),
        'C0014': (
            'Files must have a single newline above raises in doc string.',
            'single-space-above-raises',
            'Please enter a single newline above raises in doc string.'
        )
    }

    def process_module(self, node):
        """Process a module to ensure that there is a single newline above args,
        raises, returns in python doc string.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """

        in_class_or_function = False
        in_docstring = False
        file_content = read_from_node(node)
        file_length = len(file_content)
        blank_line_counter = 0
        prev_line = ''

        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].strip()

            if line_num > 0:
                prev_line = file_content[line_num - 1].strip()

            # Check if it is a docstring and not some multi-line string.
            if (prev_line.startswith(b'class ') or
                    prev_line.startswith(b'def ') or in_class_or_function):
                in_class_or_function = True
                if prev_line.endswith(b'):') and line.startswith(b'"""'):
                    in_docstring = True
                    in_class_or_function = False

            if line.endswith(b'"""'):
                in_docstring = False

            if not in_docstring:
                continue

            if file_content[line_num] == b'\n':
                blank_line_counter += 1
            else:
                blank_line_counter = 0

            if (line_num + 1 < file_length and (
                    blank_line_counter == 0 or blank_line_counter > 1)):
                line = file_content[line_num + 1].strip()
                if line == b'Args:':
                    self.add_message(
                        'single-space-above-args', line=line_num + 1)
                elif line == b'Returns:':
                    self.add_message(
                        'single-space-above-returns', line=line_num + 1)
                elif line == b'Raises:':
                    self.add_message(
                        'single-space-above-raises', line=line_num + 1)


class DivisionOperatorChecker(checkers.BaseChecker):
    """Checks if division operator is used."""

    __implements__ = interfaces.IRawChecker
    name = 'division-operator-used'
    priority = -1
    msgs = {
        'C0015': (
            'Division Operator is used.',
            'division-operator-used',
            'Please use python_utils.divide() instead of the "/" operator'
        )
    }

    def process_module(self, node):
        """Process a module to ensure that the division operator('/') is not
        used and python_utils.divide() is used instead.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """

        in_multi_line_comment = False
        multi_line_indicator = b'"""'
        string_indicator = b'\''
        file_content = read_from_node(node)
        file_length = len(file_content)

        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].strip()

            # Single line comment, ignore it.
            if line.startswith(b'#'):
                continue

            # Single multi-line comment, ignore it.
            if line.count(multi_line_indicator) == 2:
                continue

            # Flip multi-line boolean depending on whether or not we see
            # the multi-line indicator. Possible for multiline comment to
            # be somewhere other than the start of a line (e.g. func arg),
            # so we can't look at start of or end of a line, which is why
            # the case where two indicators in a single line is handled
            # separately (i.e. one line comment with multi-line strings).
            if multi_line_indicator in line:
                in_multi_line_comment = not in_multi_line_comment

            # Ignore anything inside a multi-line comment.
            if in_multi_line_comment:
                continue

            # Ignore anything inside a string.
            if line.count(string_indicator) >= 2:
                continue

            if (re.search(br'[^/]/[^/]', line) and
                    not line.endswith(multi_line_indicator)):
                self.add_message(
                    'division-operator-used', line=line_num + 1)


class SingleLineCommentChecker(checkers.BaseChecker):
    """Checks if comments follow correct style."""

    __implements__ = interfaces.IRawChecker
    name = 'incorrectly_styled_comment'
    priority = -1
    msgs = {
        'C0016': (
            'Invalid punctuation is used.',
            'invalid-punctuation-used',
            'Please use valid punctuation.'
        ),
        'C0017': (
            'No space is used at beginning of comment.',
            'no-space-at-beginning',
            'Please use single space at the beginning of comment.'
        ),
        'C0018': (
            'No capital letter is used at the beginning of comment.',
            'no-capital-letter-at-beginning',
            'Please use capital letter to begin the content of comment.'
        )
    }

    def process_module(self, node):
        """Process a module to ensure that comments follow correct style.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """

        allowed_comment_prefixes = ['int', 'str', 'float', 'bool', 'v']
        in_multi_line_comment = False
        space_at_beginning_of_comment = True
        multi_line_indicator = b'"""'
        file_content = read_from_node(node)
        file_length = len(file_content)

        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].strip()

            # Single multi-line comment, ignore it.
            if line.count(multi_line_indicator) == 2:
                continue

            # Flip multi-line boolean depending on whether or not we see
            # the multi-line indicator. Possible for multiline comment to
            # be somewhere other than the start of a line (e.g. func arg),
            # so we can't look at start of or end of a line, which is why
            # the case where two indicators in a single line is handled
            # separately (i.e. one line comment with multi-line strings).
            if multi_line_indicator in line:
                in_multi_line_comment = not in_multi_line_comment

            # Ignore anything inside a multiline comment.
            if in_multi_line_comment:
                continue

            next_line = ''
            previous_line = ''
            if line_num + 1 < file_length:
                next_line = file_content[line_num + 1].strip()
            if line_num > 0:
                previous_line = file_content[line_num - 1].strip()

            # Ignore lines which are not comments.
            if not line.startswith(b'#'):
                continue

            # Check if comment contains any excluded phrase.
            word_is_present_in_excluded_phrases = any(
                word in line for word in EXCLUDED_PHRASES)

            # Comments may include a lowercase character at beginning
            # or may not use a punctuation at end if it contains a
            # excluded phrase e.g. "# coding: utf-8".
            if word_is_present_in_excluded_phrases:
                continue

            if not next_line.startswith(b'#'):
                # Comments must end with the proper punctuation.
                last_char_is_invalid = line[-1] not in (
                    ALLOWED_TERMINATING_PUNCTUATIONS)
                if last_char_is_invalid:
                    self.add_message(
                        'invalid-punctuation-used', line=line_num + 1)

            # Comments must start with a space.
            if re.search(br'^#[^\s].*$', line) and not line.startswith(b'#!'):
                space_at_beginning_of_comment = False
                self.add_message(
                    'no-space-at-beginning', line=line_num + 1)

            # Comments may include a lowercase character at the beginning
            # only if they start with version info or a data type or.
            # a variable name e.g. "# next_line is of string type."
            # or "# v2 version does not have ExplorationStatsModel."
            # or "# int. The file size, in bytes.".
            if len(line) > 1 and space_at_beginning_of_comment:

                # Check if variable name is used.
                underscore_is_present = '_' in line.split()[1]
                if underscore_is_present:
                    continue

                # Check if allowed prefix is used.
                allowed_prefix_is_present = any(
                    line[2:].startswith(word) for word in (
                        allowed_comment_prefixes))
                if allowed_prefix_is_present:
                    continue

            # Comments must start with a capital letter.
            if not previous_line.startswith(b'#') and (
                    re.search(br'^# [a-z][A-Za-z]*.*$', line)):
                self.add_message(
                    'no-capital-letter-at-beginning', line=line_num + 1)


class DocstringChecker(checkers.BaseChecker):
    """Checks if docstring follow correct style."""

    __implements__ = interfaces.IRawChecker
    name = 'invalid-docstring-format'
    priority = -1
    msgs = {
        'C0019': (
            'Period is not used at the end of the docstring.',
            'no-period-used',
            'Please use a period at the end of the docstring,'
        ),
        'C0020': (
            'Multiline docstring should end with a new line.',
            'no-newline-used-at-end',
            'Please end multiline docstring with a new line.'
        ),
        'C0021': (
            'Single line docstring should not span two lines.',
            'single-line-docstring-span-two-lines',
            'Please do not use two lines for a single line docstring. '
            'If line length exceeds 80 characters, '
            'convert the single line docstring to a multiline docstring.'
        ),
        'C0022': (
            'Empty line before the end of multi-line docstring.',
            'empty-line-before-end',
            'Please do not use empty line before '
            'the end of the multi-line docstring.'
        ),
        'C0023': (
            'Space after """ in docstring.',
            'space-after-triple-quote',
            'Please do not use space after """ in docstring.'
        )
    }

    def process_module(self, node):
        """Process a module to ensure that docstring end in a period and the
        arguments order in the function definition matches the order in the
        docstring.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """

        is_docstring = False
        is_class_or_function = False
        file_content = read_from_node(node)
        file_length = len(file_content)

        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].strip()
            prev_line = ''

            if line_num > 0:
                prev_line = file_content[line_num - 1].strip()

            # Check if it is a docstring and not some multi-line string.
            if (prev_line.startswith(b'class ') or
                    prev_line.startswith(b'def ')) or (is_class_or_function):
                is_class_or_function = True
                if prev_line.endswith(b'):') and line.startswith(b'"""'):
                    is_docstring = True
                    is_class_or_function = False

            # Check for space after """ in docstring.
            if re.search(br'^""".+$', line) and is_docstring and (
                    line[3] == b' '):
                is_docstring = False
                self.add_message(
                    'space-after-triple-quote', line=line_num + 1)

            # Check if single line docstring span two lines.
            if line == b'"""' and prev_line.startswith(b'"""') and is_docstring:
                is_docstring = False
                self.add_message(
                    'single-line-docstring-span-two-lines', line=line_num + 1)

            # Check for single line docstring.
            elif re.search(br'^""".+"""$', line) and is_docstring:
                # Check for punctuation at line[-4] since last three
                # characters are double quotes.
                if (len(line) > 6) and (
                        line[-4] not in ALLOWED_TERMINATING_PUNCTUATIONS):
                    self.add_message(
                        'no-period-used', line=line_num + 1)
                is_docstring = False

            # Check for mutliline docstring.
            elif line.endswith(b'"""') and is_docstring:
                # Case 1: line is """. This is correct for multiline docstring.
                if line == b'"""':
                    # Check for empty line before the end of docstring.
                    if prev_line == b'':
                        self.add_message(
                            'empty-line-before-end', line=line_num + 1)
                    # Check for punctuation at the end of docstring.
                    else:
                        last_char_is_invalid = prev_line[-1] not in (
                            ALLOWED_TERMINATING_PUNCTUATIONS)
                        no_word_is_present_in_excluded_phrases = (not any(
                            word in prev_line for word in EXCLUDED_PHRASES))
                        if last_char_is_invalid and (
                                no_word_is_present_in_excluded_phrases):
                            self.add_message(
                                'no-period-used', line=line_num + 1)

                # Case 2: line contains some words before """. """
                # should shift to next line.
                elif not any(word in line for word in EXCLUDED_PHRASES):
                    self.add_message(
                        'no-newline-used-at-end', line=line_num + 1)
                is_docstring = False


class BlankLineBelowFileOverviewChecker(checkers.BaseChecker):
    """Checks if there is a single empty line below the fileoverview docstring.
    Note: The check assumes that all files have a file overview. This
    assumption is justified because Pylint has an inbuilt check
    (missing-docstring) for missing file overviews.
    """

    __implements__ = interfaces.IRawChecker
    name = 'space_between_imports_and_file-overview'
    priority = -1
    msgs = {
        'C0024': (
            'No empty line used below the fileoverview docstring.',
            'no-empty-line-provided-below-fileoverview',
            'please provide an empty line below the fileoverview.'
        ),
        'C0025': (
            'Single empty line should be provided below the fileoverview.',
            'only-a-single-empty-line-should-be-provided',
            'please provide an empty line below the fileoverview.'
        )
    }

    def process_module(self, node):
        """Process a module to ensure that there is a blank line below
        file overview docstring.

        Args:
            node: astroid.scoped_nodes.Function. Node to access module content.
        """

        multi_line_indicator = b'"""'
        file_content = read_from_node(node)
        file_length = len(file_content)
        triple_quote_counter = 0
        empty_line_counter = 0
        for line_num in python_utils.RANGE(file_length):
            line = file_content[line_num].strip()
            # Single line comment, ignore it.
            if line.startswith(b'#'):
                continue
            triple_quote_counter += line.count(multi_line_indicator)

            if line.endswith(b'"""') and triple_quote_counter == 2:
                closing_line_index_of_fileoverview = line_num
                break

        if triple_quote_counter == 2:
            empty_line_check_index = closing_line_index_of_fileoverview
            if empty_line_check_index < file_length - 1:
                while file_content[empty_line_check_index + 1] == b'\n':
                    empty_line_counter += 1
                    empty_line_check_index += 1

            if empty_line_counter > 1:
                self.add_message(
                    'only-a-single-empty-line-should-be-provided',
                    line=closing_line_index_of_fileoverview + 1)
            elif empty_line_counter == 0:
                self.add_message(
                    'no-empty-line-provided-below-fileoverview',
                    line=closing_line_index_of_fileoverview + 1)


def register(linter):
    """Registers the checker with pylint.

    Args:
        linter: Pylinter. The Pylinter object.
    """
    linter.register_checker(ExplicitKeywordArgsChecker(linter))
    linter.register_checker(HangingIndentChecker(linter))
    linter.register_checker(DocstringParameterChecker(linter))
    linter.register_checker(ImportOnlyModulesChecker(linter))
    linter.register_checker(BackslashContinuationChecker(linter))
    linter.register_checker(FunctionArgsOrderChecker(linter))
    linter.register_checker(RestrictedImportChecker(linter))
    linter.register_checker(SingleCharAndNewlineAtEOFChecker(linter))
    linter.register_checker(SingleSpaceAfterYieldChecker(linter))
    linter.register_checker(ExcessiveEmptyLinesChecker(linter))
    linter.register_checker(SingleNewlineAboveArgsChecker(linter))
    linter.register_checker(DivisionOperatorChecker(linter))
    linter.register_checker(SingleLineCommentChecker(linter))
    linter.register_checker(DocstringChecker(linter))
    linter.register_checker(BlankLineBelowFileOverviewChecker(linter))
