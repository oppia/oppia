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
import docstrings_checker  # pylint: disable=relative-import

from pylint import checkers
from pylint import interfaces
from pylint.checkers import typecheck
from pylint.checkers import utils as checker_utils


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
            node. Call. The current function call node.
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
        if call_site.has_invalid_arguments() or (
                call_site.has_invalid_keywords()):
            return

        num_positional_args = len(call_site.positional_arguments)
        keyword_args = list(call_site.keyword_arguments.keys())

        already_filled_positionals = getattr(called, 'filled_positionals', 0)
        already_filled_keywords = getattr(called, 'filled_keywords', {})

        keyword_args += list(already_filled_keywords)
        num_positional_args += implicit_args + already_filled_positionals

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
                if name is None:
                    display_name = '<tuple>'
                else:
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
                        try:
                            func_name = node.func.name
                        except AttributeError:
                            func_name = node.func

                    self.add_message('non-explicit-keyword-args', node=node,
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
        'W9005': ('''"%s" has constructor parameters
                    documented in class and __init__''',
                  'multiple-constructor-doc',
                  '''Please remove parameter declarations
                    in the class or constructor.'''),
        'W9006': ('"%s" not documented as being raised',
                  'missing-raises-doc',
                  '''Please document exceptions for
                    all raised exception types.'''),
        'W9008': ('Redundant returns documentation',
                  'redundant-returns-doc',
                  '''Please remove the return/rtype
                    documentation from this method.'''),
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
                  # we can't use the same old_name for two different warnings
                  # {'old_names': [('W9007', 'missing-returns-doc')]}.
                 ),
        'W9013': ('Missing yield documentation',
                  'missing-yield-doc',
                  'Please add documentation about what this generator yields.',
                  {'old_names': [('W9009', 'missing-yields-doc')]}),
        'W9014': ('Missing yield type documentation',
                  'missing-yield-type-doc',
                  'Please document the type yielded by this method.',
                  # we can't use the same old_name for two different warnings
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
        if not isinstance(func_node, astroid.FunctionDef):
            return

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
        if not isinstance(func_node, astroid.FunctionDef):
            return

        doc = docstrings_checker.docstringify(func_node.doc)
        if not doc.is_valid() and self.config.accept_no_yields_doc:
            return

        if doc.supports_yields:
            doc_has_yields = doc.has_yields()
            doc_has_yields_type = doc.has_yields_type()
        else:
            doc_has_yields = doc.has_returns()
            doc_has_yields_type = doc.has_rtype()

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
            node. astroid.scoped_nodes.Function. Node for a function or method
                definition in AST
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
            except astroid.AstroidBuildingException:
                pass


def register(linter):
    """Registers the checker with pylint.

    Args:
        linter: Pylinter. The Pylinter object.
    """
    linter.register_checker(ExplicitKeywordArgsChecker(linter))
    linter.register_checker(HangingIndentChecker(linter))
    linter.register_checker(DocstringParameterChecker(linter))
    linter.register_checker(ImportOnlyModulesChecker(linter))
