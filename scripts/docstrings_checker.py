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

"""Utility methods for docstring checking."""

import os
import re
import sys
import ast

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.8.4')
sys.path.insert(0, _PYLINT_PATH)

# pylint: disable=wrong-import-position
import astroid # isort:skip
from pylint.checkers import utils # isort:skip
from pylint.extensions import _check_docs_utils # isort:skip
# pylint: enable=wrong-import-position


def space_indentation(s):
    """The number of leading spaces in a string

    Args:
        s: str. The input string.

    Returns:
        int. The number of leading spaces.
    """
    return len(s) - len(s.lstrip(' '))


def get_setters_property_name(node):
    """Get the name of the property that the given node is a setter for.

    Args:
        node: str. The node to get the property name for.

    Returns:
        str|None. The name of the property that the node is a setter for,
            or None if one could not be found.
    """
    decorator_nodes = node.decorators.nodes if node.decorators else []
    for decorator_node in decorator_nodes:
        if (isinstance(decorator_node, astroid.Attribute) and
                decorator_node.attrname == 'setter' and
                isinstance(decorator_node.expr, astroid.Name)):
            return decorator_node.expr.name
    return None


def get_setters_property(node):
    """Get the property node for the given setter node.

    Args:
        node: astroid.FunctionDef. The node to get the property for.

    Returns:
        astroid.FunctionDef|None. The node relating to the property of
            the given setter node, or None if one could not be found.
    """
    property_ = None

    property_name = get_setters_property_name(node)
    class_node = utils.node_frame_class(node)
    if property_name and class_node:
        class_attrs = class_node.getattr(node.name)
        for attr in class_attrs:
            if utils.decorated_with_property(attr):
                property_ = attr
                break

    return property_


def returns_something(return_node):
    """Check if a return node returns a value other than None.

    Args:
        return_node: astroid.Return. The return node to check.

    Returns:
        bool. True if the return node returns a value
            other than None, False otherwise.
    """
    returns = return_node.value

    if returns is None:
        return False

    return not (isinstance(returns, astroid.Const) and returns.value is None)


def possible_exc_types(node):
    """Gets all of the possible raised exception types for the given raise node.
    Caught exception types are ignored.

    Args:
        node: astroid.node_classes.NodeNG. The raise
            to find exception types for.

    Returns:
        set(str). A list of exception types.
    """
    excs = []
    if isinstance(node.exc, astroid.Name):
        inferred = utils.safe_infer(node.exc)
        if inferred:
            excs = [inferred.name]
    elif (isinstance(node.exc, astroid.Call) and
          isinstance(node.exc.func, astroid.Name)):
        target = utils.safe_infer(node.exc.func)
        if isinstance(target, astroid.ClassDef):
            excs = [target.name]
        elif isinstance(target, astroid.FunctionDef):
            for ret in target.nodes_of_class(astroid.Return):
                if ret.frame() != target:
                    continue

                val = utils.safe_infer(ret.value)
                if (val and isinstance(val, (
                        astroid.Instance, astroid.ClassDef)) and
                        utils.inherit_from_std_ex(val)):
                    excs.append(val.name)
    elif node.exc is None:
        handler = node.parent
        while handler and not isinstance(handler, astroid.ExceptHandler):
            handler = handler.parent

        if handler and handler.type:
            inferred_excs = astroid.unpack_infer(handler.type)
            excs = (exc.name for exc in inferred_excs
                    if exc is not astroid.Uninferable)


    try:
        return set(
            exc for exc in excs if not utils.node_ignores_exception(
                node, exc))
    except astroid.InferenceError:
        return set()


def docstringify(docstring):
    """Converts a docstring in its str form to its Docstring object
    as defined in the pylint library.

    Args:
        docstring: str. Docstring for a particular class or function.

    Returns:
        Docstring. Pylint Docstring class instance representing
            a node's docstring.
    """
    for docstring_type in [GoogleDocstring]:
        instance = docstring_type(docstring)
        if instance.is_valid():
            return instance

    return _check_docs_utils.Docstring(docstring)


class GoogleDocstring(_check_docs_utils.GoogleDocstring):

    re_multiple_type = _check_docs_utils.GoogleDocstring.re_multiple_type
    re_param_line = re.compile(r"""
        \s*  \*{{0,2}}(\w+)             # identifier potentially with asterisks
        \s*  ( [:]
            \s*
            ({type}|\S*)
            (?:,\s+optional)?
            [.] )? \s*                  # optional type declaration
        \s*  (.*)                       # beginning of optional description
    """.format(
        type=re_multiple_type,
    ), flags=re.X | re.S | re.M)

    re_returns_line = re.compile(r"""
        \s* (({type}|\S*).)?              # identifier
        \s* (.*)                          # beginning of description
    """.format(
        type=re_multiple_type,
    ), flags=re.X | re.S | re.M)

    re_yields_line = re_returns_line


class ASTDocStringChecker(object):
    """Checks that docstrings meet the code style."""

    def __init__(self):
        pass

    @classmethod
    def get_args_list_from_function_definition(cls, function_node):
        """Extracts the arguments from a function definition.
        Ignores class specific arguments (self and cls).

        Args:
            function_node: ast node object. Represents a function.

        Returns:
            list(str) of the args for a function as listed in the function
            definition.
        """
        # Ignore self and cls args.
        args_to_ignore = ['self', 'cls']
        return [a.id for a in function_node.args.args if a.id not in
                args_to_ignore]

    @classmethod
    def parse_arg_list_from_docstring(cls, docstring):
        """Extracts the arguments from a function definition.
        NOTE this will fail if the arg does not have a colon after it.

        Args:
            docstring: str. The contents of a docstring.

        Returns:
            list(str) of the args for a function as listed in the docstring.
        """
        if docstring is not None and 'Args:' in docstring:
            # only keep the docstring contents after 'Args' and before
            # 'Returns' or 'Raises'.
            docstring = docstring.split('Args:')[1]
            docstring = docstring.split('Returns:')[0]
            docstring = docstring.split('Raises:')[0]
            ds_arg_lines = docstring.split('\n')
            # Extract just the arg name from the line describing the arg.
            # This only finds lines that contain a colon, which should be
            # between the arg name and its description.
            ds_arg_lines = [line.split(':')[0].strip() for line in ds_arg_lines
                            if ':' in line]
            return ds_arg_lines
        else:
            return []

    @classmethod
    def compare_arg_order(cls, func_def_args, docstring_args):
        """Compares the arguments listed in the function definition and
        docstring, and raises errors if there are missing or mis-ordered
        arguments in the docstring.

        Args:
            func_def_args: list(str). The args as listed in the function
            definition.

            docstring_args: list(str). The args as listed in the docstring.

        Returns:
            bool, representing whether the function passed linting or failed.
        """
        results = []

        # If there are no args listed in the docstring, exit without errors.
        if len(docstring_args) == 0:
            return results

        for i, arg_name in enumerate(func_def_args):
            if func_def_args[i] not in docstring_args:
                results.append('Arg missing from docstring: {}'.format(
                    arg_name))
            elif i < len(docstring_args):
                if func_def_args[i] != docstring_args[i]:
                    results.append('Arg ordering error in docstring: '
                                   '{}'.format(arg_name))
            else:
                results.append('Arg ordering error in docstring: '
                               '{}'.format(arg_name))
        return results

    @classmethod
    def check_docstrings_arg_order(cls, function_node):
        """Extracts the arguments from a function definition.

        Args:
            function_node: ast node object. Represents a function.

        Returns:
            func_result: list(str). List of docstring errors associated with
            the function. If the function has no errors, the list is empty.
        """
        func_def_args = cls.get_args_list_from_function_definition(
            function_node)
        docstring = ast.get_docstring(function_node)
        docstring_args = cls.parse_arg_list_from_docstring(docstring)
        func_result = cls.compare_arg_order(func_def_args, docstring_args)
        return func_result
