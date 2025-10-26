# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/pylint-dev/astroid/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/astroid/blob/main/CONTRIBUTORS.txt

"""Python Abstract Syntax Tree New Generation.

The aim of this module is to provide a common base representation of
python source code for projects such as pychecker, pyreverse,
pylint... Well, actually the development of this library is essentially
governed by pylint's needs.

It mimics the class defined in the python's _ast module with some
additional methods and attributes. New nodes instances are not fully
compatible with python's _ast.

Instance attributes are added by a
builder object, which can either generate extended ast (let's call
them astroid ;) by visiting an existent ast tree or by inspecting living
object.

Main modules are:

* nodes and scoped_nodes for more information about methods and
  attributes added to different node classes

* the manager contains a high level object to get astroid trees from
  source files and living objects. It maintains a cache of previously
  constructed tree for quick access

* builder contains the class responsible to build astroid trees
"""

# isort: off
# We have an isort: off on 'astroid.nodes' because of a circular import.
from astroid.nodes import node_classes, scoped_nodes

# isort: on

from astroid import raw_building
from astroid.__pkginfo__ import __version__, version
from astroid.bases import BaseInstance, BoundMethod, Instance, UnboundMethod
from astroid.brain.helpers import register_module_extender
from astroid.builder import extract_node, parse
from astroid.const import Context
from astroid.exceptions import (
    AstroidBuildingError,
    AstroidError,
    AstroidImportError,
    AstroidIndexError,
    AstroidSyntaxError,
    AstroidTypeError,
    AstroidValueError,
    AttributeInferenceError,
    DuplicateBasesError,
    InconsistentMroError,
    InferenceError,
    InferenceOverwriteError,
    MroError,
    NameInferenceError,
    NoDefault,
    NotFoundError,
    ParentMissingError,
    ResolveError,
    StatementMissing,
    SuperArgumentTypeError,
    SuperError,
    TooManyLevelsError,
    UnresolvableName,
    UseInferenceDefault,
)
from astroid.inference_tip import _inference_tip_cached, inference_tip
from astroid.objects import ExceptionInstance

# isort: off
# It's impossible to import from astroid.nodes with a wildcard, because
# there is a cyclic import that prevent creating an __all__ in astroid/nodes
# and we need astroid/scoped_nodes and astroid/node_classes to work. So
# importing with a wildcard would clash with astroid/nodes/scoped_nodes
# and astroid/nodes/node_classes.
from astroid.astroid_manager import MANAGER
from astroid.nodes import (
    CONST_CLS,
    AnnAssign as _DEPRECATED_AnnAssign,
    Arguments as _DEPRECATED_Arguments,
    Assert as _DEPRECATED_Assert,
    Assign as _DEPRECATED_Assign,
    AssignAttr as _DEPRECATED_AssignAttr,
    AssignName as _DEPRECATED_AssignName,
    AsyncFor as _DEPRECATED_AsyncFor,
    AsyncFunctionDef as _DEPRECATED_AsyncFunctionDef,
    AsyncWith as _DEPRECATED_AsyncWith,
    Attribute as _DEPRECATED_Attribute,
    AugAssign as _DEPRECATED_AugAssign,
    Await as _DEPRECATED_Await,
    BinOp as _DEPRECATED_BinOp,
    BoolOp as _DEPRECATED_BoolOp,
    Break as _DEPRECATED_Break,
    Call as _DEPRECATED_Call,
    ClassDef as _DEPRECATED_ClassDef,
    Compare as _DEPRECATED_Compare,
    Comprehension as _DEPRECATED_Comprehension,
    ComprehensionScope as _DEPRECATED_ComprehensionScope,
    Const as _DEPRECATED_Const,
    Continue as _DEPRECATED_Continue,
    Decorators as _DEPRECATED_Decorators,
    DelAttr as _DEPRECATED_DelAttr,
    Delete as _DEPRECATED_Delete,
    DelName as _DEPRECATED_DelName,
    Dict as _DEPRECATED_Dict,
    DictComp as _DEPRECATED_DictComp,
    DictUnpack as _DEPRECATED_DictUnpack,
    EmptyNode as _DEPRECATED_EmptyNode,
    EvaluatedObject as _DEPRECATED_EvaluatedObject,
    ExceptHandler as _DEPRECATED_ExceptHandler,
    Expr as _DEPRECATED_Expr,
    For as _DEPRECATED_For,
    FormattedValue as _DEPRECATED_FormattedValue,
    FunctionDef as _DEPRECATED_FunctionDef,
    GeneratorExp as _DEPRECATED_GeneratorExp,
    Global as _DEPRECATED_Global,
    If as _DEPRECATED_If,
    IfExp as _DEPRECATED_IfExp,
    Import as _DEPRECATED_Import,
    ImportFrom as _DEPRECATED_ImportFrom,
    Interpolation as _DEPRECATED_Interpolation,
    JoinedStr as _DEPRECATED_JoinedStr,
    Keyword as _DEPRECATED_Keyword,
    Lambda as _DEPRECATED_Lambda,
    List as _DEPRECATED_List,
    ListComp as _DEPRECATED_ListComp,
    Match as _DEPRECATED_Match,
    MatchAs as _DEPRECATED_MatchAs,
    MatchCase as _DEPRECATED_MatchCase,
    MatchClass as _DEPRECATED_MatchClass,
    MatchMapping as _DEPRECATED_MatchMapping,
    MatchOr as _DEPRECATED_MatchOr,
    MatchSequence as _DEPRECATED_MatchSequence,
    MatchSingleton as _DEPRECATED_MatchSingleton,
    MatchStar as _DEPRECATED_MatchStar,
    MatchValue as _DEPRECATED_MatchValue,
    Module as _DEPRECATED_Module,
    Name as _DEPRECATED_Name,
    NamedExpr as _DEPRECATED_NamedExpr,
    NodeNG as _DEPRECATED_NodeNG,
    Nonlocal as _DEPRECATED_Nonlocal,
    ParamSpec as _DEPRECATED_ParamSpec,
    Pass as _DEPRECATED_Pass,
    Raise as _DEPRECATED_Raise,
    Return as _DEPRECATED_Return,
    Set as _DEPRECATED_Set,
    SetComp as _DEPRECATED_SetComp,
    Slice as _DEPRECATED_Slice,
    Starred as _DEPRECATED_Starred,
    Subscript as _DEPRECATED_Subscript,
    TemplateStr as _DEPRECATED_TemplateStr,
    Try as _DEPRECATED_Try,
    TryStar as _DEPRECATED_TryStar,
    Tuple as _DEPRECATED_Tuple,
    TypeAlias as _DEPRECATED_TypeAlias,
    TypeVar as _DEPRECATED_TypeVar,
    TypeVarTuple as _DEPRECATED_TypeVarTuple,
    UnaryOp as _DEPRECATED_UnaryOp,
    Unknown as _DEPRECATED_Unknown,
    While as _DEPRECATED_While,
    With as _DEPRECATED_With,
    Yield as _DEPRECATED_Yield,
    YieldFrom as _DEPRECATED_YieldFrom,
    are_exclusive,
    builtin_lookup,
    unpack_infer,
    function_to_method,
)

# isort: on

from astroid.util import Uninferable

__all__ = [
    "CONST_CLS",
    "MANAGER",
    "AstroidBuildingError",
    "AstroidError",
    "AstroidImportError",
    "AstroidIndexError",
    "AstroidSyntaxError",
    "AstroidTypeError",
    "AstroidValueError",
    "AttributeInferenceError",
    "BaseInstance",
    "BoundMethod",
    "Context",
    "DuplicateBasesError",
    "ExceptionInstance",
    "InconsistentMroError",
    "InferenceError",
    "InferenceOverwriteError",
    "Instance",
    "MroError",
    "NameInferenceError",
    "NoDefault",
    "NotFoundError",
    "ParentMissingError",
    "ResolveError",
    "StatementMissing",
    "SuperArgumentTypeError",
    "SuperError",
    "TooManyLevelsError",
    "UnboundMethod",
    "Uninferable",
    "UnresolvableName",
    "UseInferenceDefault",
    "__version__",
    "_inference_tip_cached",
    "are_exclusive",
    "builtin_lookup",
    "extract_node",
    "function_to_method",
    "inference_tip",
    "node_classes",
    "parse",
    "raw_building",
    "register_module_extender",
    "scoped_nodes",
    "unpack_infer",
    "version",
]


def __getattr__(name: str):
    if (val := globals().get(f"_DEPRECATED_{name}")) is None:
        msg = f"module '{__name__}' has no attribute '{name}"
        raise AttributeError(msg)

    # pylint: disable-next=import-outside-toplevel
    import warnings

    msg = (
        f"importing '{name}' from 'astroid' is deprecated and will be removed in v5, "
        "import it from 'astroid.nodes' instead"
    )
    warnings.warn(msg, DeprecationWarning, stacklevel=2)
    return val
