# Copyright (c) 2006-2011, 2013 LOGILAB S.A. (Paris, FRANCE) <contact@logilab.fr>
# Copyright (c) 2014-2016 Claudiu Popa <pcmanticore@gmail.com>
# Copyright (c) 2014 Google, Inc.
# Copyright (c) 2015-2016 Cara Vinson <ceridwenv@gmail.com>

# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/PyCQA/astroid/blob/master/COPYING.LESSER

"""Every available node class.

.. seealso::
    :doc:`ast documentation <green_tree_snakes:nodes>`

All nodes inherit from :class:`~astroid.node_classes.NodeNG`.
"""
# pylint: disable=unused-import,redefined-builtin

from astroid.node_classes import (
    Arguments, AssignAttr, Assert, Assign, AnnAssign,
    AssignName, AugAssign, Repr, BinOp, BoolOp, Break, Call, Compare,
    Comprehension, Const, Continue, Decorators, DelAttr, DelName, Delete,
    Dict, Expr, Ellipsis, EmptyNode, ExceptHandler, Exec, ExtSlice, For,
    ImportFrom, Attribute, Global, If, IfExp, Import, Index, Keyword,
    List, Name, Nonlocal, Pass, Print, Raise, Return, Set, Slice, Starred, Subscript,
    TryExcept, TryFinally, Tuple, UnaryOp, While, With, Yield, YieldFrom,
    const_factory,
    AsyncFor, Await, AsyncWith,
    FormattedValue, JoinedStr,
    # Backwards-compatibility aliases
    Backquote, Discard, AssName, AssAttr, Getattr, CallFunc, From,
    # Node not present in the builtin ast module.
    DictUnpack,
    Unknown,
)
from astroid.scoped_nodes import (
    Module, GeneratorExp, Lambda, DictComp,
    ListComp, SetComp, FunctionDef, ClassDef,
    AsyncFunctionDef,
    # Backwards-compatibility aliases
    Class, Function, GenExpr,
)



ALL_NODE_CLASSES = (
    AsyncFunctionDef, AsyncFor, AsyncWith, Await,

    Arguments, AssignAttr, Assert, Assign, AnnAssign, AssignName, AugAssign,
    Repr, BinOp, BoolOp, Break,
    Call, ClassDef, Compare, Comprehension, Const, Continue,
    Decorators, DelAttr, DelName, Delete,
    Dict, DictComp, DictUnpack, Expr,
    Ellipsis, EmptyNode, ExceptHandler, Exec, ExtSlice,
    For, ImportFrom, FunctionDef,
    Attribute, GeneratorExp, Global,
    If, IfExp, Import, Index,
    Keyword,
    Lambda, List, ListComp,
    Name, Nonlocal,
    Module,
    Pass, Print,
    Raise, Return,
    Set, SetComp, Slice, Starred, Subscript,
    TryExcept, TryFinally, Tuple,
    UnaryOp,
    While, With,
    Yield, YieldFrom,
    FormattedValue, JoinedStr,
    )
