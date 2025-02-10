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

from __future__ import annotations

import re

import astroid
from pylint.checkers import utils
from pylint.extensions import _check_docs_utils
from typing import Optional, Set


def space_indentation(s: str) -> int:
    """The number of leading spaces in a string

    Args:
        s: str. The input string.

    Returns:
        int. The number of leading spaces.
    """
    return len(s) - len(s.lstrip(' '))


def get_setters_property_name(node: astroid.FunctionDef) -> Optional[str]:
    """Get the name of the property that the given node is a setter for.

    Args:
        node: astroid.FunctionDef. The node to get the property name for.

    Returns:
        str|None. The name of the property that the node is a setter for,
        or None if one could not be found.
    """
    decorator_nodes = node.decorators.nodes if node.decorators else []
    for decorator_node in decorator_nodes:
        if (isinstance(decorator_node, astroid.Attribute) and
            decorator_node.attrname == 'setter' and
            isinstance(decorator_node.expr, astroid.Name)
        ):
            decorator_name: Optional[str] = decorator_node.expr.name
            return decorator_name
    return None


def get_setters_property(
    node: astroid.FunctionDef
) -> Optional[astroid.FunctionDef]:
    """Get the property node for the given setter node.

    Args:
        node: astroid.FunctionDef. The node to get the property for.

    Returns:
        astroid.FunctionDef|None. The node relating to the property of
        the given setter node, or None if one could not be found.
    """
    setters_property = None

    property_name = get_setters_property_name(node)
    class_node = utils.node_frame_class(node)
    if property_name and class_node:
        class_attrs = class_node.getattr(node.name)
        for attr in class_attrs:
            if utils.decorated_with_property(attr):
                setters_property = attr
                break

    return setters_property


def returns_something(return_node: astroid.Return) -> bool:
    """Check if a return node returns a value other than None.

    Args:
        return_node: astroid.Return. The return node to check.

    Returns:
        bool. True if the return node returns a value other than None, False
        otherwise.
    """
    returns = return_node.value

    if returns is None:
        return False

    return not (isinstance(returns, astroid.Const) and returns.value is None)


def possible_exc_types(node: astroid.NodeNG) -> Set[str]:
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
            excs = [
                exc.name for exc in inferred_excs
                if exc is not astroid.Uninferable]

    try:
        return set(
            exc for exc in excs if not utils.node_ignores_exception(
                node, exc))
    except astroid.InferenceError:
        return set()


def docstringify(docstring: astroid.nodes.Const) -> _check_docs_utils.Docstring:
    """Converts a docstring node to its Docstring object
    as defined in the pylint library.

    Args:
        docstring: astroid.nodes.Const. Docstring for a particular class or
            function.

    Returns:
        Docstring. Pylint Docstring class instance representing
        a node's docstring.
    """
    for docstring_type in [GoogleDocstring]:
        instance = docstring_type(docstring)
        if instance.matching_sections() > 0:
            return instance

    return _check_docs_utils.Docstring(docstring)


# TODO(#16567): Here we use MyPy ignore because of the incomplete typing of
# pylint library and absences of stubs in pylint, forces MyPy to
# assume that BaseChecker class has attributes of type Any.
# Thus to avoid MyPy's error
# (Class cannot subclass 'BaseChecker' (has type 'Any')),
# we added an ignore here.
class GoogleDocstring(_check_docs_utils.GoogleDocstring):  # type: ignore[misc]
    """Class for checking whether docstrings follow the Google Python Style
    Guide.
    """

    re_multiple_type = _check_docs_utils.GoogleDocstring.re_multiple_type
    re_param_line = re.compile(
        r"""
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

    re_returns_line = re.compile(
        r"""
        \s* (({type}|\S*).)?              # identifier
        \s* (.*)                          # beginning of description
    """.format(
        type=re_multiple_type,
    ), flags=re.X | re.S | re.M)

    re_yields_line = re_returns_line

    re_raise_line = re.compile(
        r"""
        \s* ({type}|\S*)?[.:]                    # identifier
        \s* (.*)                         # beginning of description
    """.format(
        type=re_multiple_type,
    ), flags=re.X | re.S | re.M)
