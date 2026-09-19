# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/pylint-dev/astroid/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/astroid/blob/main/CONTRIBUTORS.txt

"""this module contains a set of functions to create astroid trees from scratch
(build_* functions) or from living object (object_build_* functions)
"""

from __future__ import annotations

import builtins
import inspect
import io
import logging
import os
import sys
import types
import warnings
from collections.abc import Iterable
from contextlib import redirect_stderr, redirect_stdout
from typing import TYPE_CHECKING, Any

from astroid import bases, nodes
from astroid.const import _EMPTY_OBJECT_MARKER, IS_PYPY
from astroid.nodes import node_classes

if TYPE_CHECKING:
    from astroid.manager import AstroidManager

logger = logging.getLogger(__name__)


_FunctionTypes = (
    types.FunctionType
    | types.MethodType
    | types.BuiltinFunctionType
    | types.WrapperDescriptorType
    | types.MethodDescriptorType
    | types.ClassMethodDescriptorType
)

TYPE_NONE = type(None)
TYPE_NOTIMPLEMENTED = type(NotImplemented)
TYPE_ELLIPSIS = type(...)


def _attach_local_node(parent, node, name: str) -> None:
    node.name = name  # needed by add_local_node
    parent.add_local_node(node)


def _add_dunder_class(func, parent: nodes.NodeNG, member) -> None:
    """Add a __class__ member to the given func node, if we can determine it."""
    python_cls = member.__class__
    cls_name = getattr(python_cls, "__name__", None)
    if not cls_name:
        return
    cls_bases = [ancestor.__name__ for ancestor in python_cls.__bases__]
    doc = python_cls.__doc__ if isinstance(python_cls.__doc__, str) else None
    ast_klass = build_class(cls_name, parent, cls_bases, doc)
    func.instance_attrs["__class__"] = [ast_klass]


def build_dummy(runtime_object) -> nodes.EmptyNode:
    enode = nodes.EmptyNode()
    enode.object = runtime_object
    return enode


def attach_dummy_node(node, name: str, runtime_object=_EMPTY_OBJECT_MARKER) -> None:
    """create a dummy node and register it in the locals of the given
    node with the specified name
    """
    _attach_local_node(node, build_dummy(runtime_object), name)


def attach_const_node(node, name: str, value) -> None:
    """create a Const node and register it in the locals of the given
    node with the specified name
    """
    if name not in node.special_attributes:
        _attach_local_node(node, nodes.const_factory(value), name)


def attach_import_node(node, modname: str, membername: str) -> None:
    """create a ImportFrom node and register it in the locals of the given
    node with the specified name
    """
    from_node = nodes.ImportFrom(modname, [(membername, None)])
    _attach_local_node(node, from_node, membername)


def build_module(name: str, doc: str | None = None) -> nodes.Module:
    """create and initialize an astroid Module node"""
    node = nodes.Module(name, pure_python=False, package=False)
    node.postinit(
        body=[],
        doc_node=nodes.Const(value=doc) if doc else None,
    )
    return node


def build_class(
    name: str,
    parent: nodes.NodeNG,
    basenames: Iterable[str] = (),
    doc: str | None = None,
) -> nodes.ClassDef:
    """Create and initialize an astroid ClassDef node."""
    node = nodes.ClassDef(
        name,
        lineno=0,
        col_offset=0,
        end_lineno=0,
        end_col_offset=0,
        parent=parent,
    )
    node.postinit(
        bases=[
            nodes.Name(
                name=base,
                lineno=0,
                col_offset=0,
                parent=node,
                end_lineno=None,
                end_col_offset=None,
            )
            for base in basenames
        ],
        body=[],
        decorators=None,
        doc_node=nodes.Const(value=doc) if doc else None,
    )
    return node


def build_function(
    name: str,
    parent: nodes.NodeNG,
    args: list[str] | None = None,
    posonlyargs: list[str] | None = None,
    defaults: list[Any] | None = None,
    doc: str | None = None,
    kwonlyargs: list[str] | None = None,
    kwonlydefaults: list[Any] | None = None,
) -> nodes.FunctionDef:
    """create and initialize an astroid FunctionDef node"""
    # first argument is now a list of decorators
    func = nodes.FunctionDef(
        name,
        lineno=0,
        col_offset=0,
        parent=parent,
        end_col_offset=0,
        end_lineno=0,
    )
    argsnode = nodes.Arguments(parent=func, vararg=None, kwarg=None)

    # If args is None we don't have any information about the signature
    # (in contrast to when there are no arguments and args == []). We pass
    # this to the builder to indicate this.
    if args is not None:
        # We set the lineno and col_offset to 0 because we don't have any
        # information about the location of the function definition.
        arguments = [
            nodes.AssignName(
                name=arg,
                parent=argsnode,
                lineno=0,
                col_offset=0,
                end_lineno=None,
                end_col_offset=None,
            )
            for arg in args
        ]
    else:
        arguments = None

    default_nodes: list[nodes.NodeNG] | None
    if defaults is None:
        default_nodes = None
    else:
        default_nodes = []
        for default in defaults:
            default_node = nodes.const_factory(default)
            default_node.parent = argsnode
            default_nodes.append(default_node)

    kwonlydefault_nodes: list[nodes.NodeNG | None] | None
    if kwonlydefaults is None:
        kwonlydefault_nodes = None
    else:
        kwonlydefault_nodes = []
        for kwonlydefault in kwonlydefaults:
            kwonlydefault_node = nodes.const_factory(kwonlydefault)
            kwonlydefault_node.parent = argsnode
            kwonlydefault_nodes.append(kwonlydefault_node)

    # We set the lineno and col_offset to 0 because we don't have any
    # information about the location of the kwonly and posonlyargs.
    argsnode.postinit(
        args=arguments,
        defaults=default_nodes,
        kwonlyargs=[
            nodes.AssignName(
                name=arg,
                parent=argsnode,
                lineno=0,
                col_offset=0,
                end_lineno=None,
                end_col_offset=None,
            )
            for arg in kwonlyargs or ()
        ],
        kw_defaults=kwonlydefault_nodes,
        annotations=[],
        posonlyargs=[
            nodes.AssignName(
                name=arg,
                parent=argsnode,
                lineno=0,
                col_offset=0,
                end_lineno=None,
                end_col_offset=None,
            )
            for arg in posonlyargs or ()
        ],
        kwonlyargs_annotations=[],
        posonlyargs_annotations=[],
    )
    func.postinit(
        args=argsnode,
        body=[],
        doc_node=nodes.Const(value=doc) if doc else None,
    )
    if args:
        register_arguments(func)
    return func


def build_from_import(fromname: str, names: list[str]) -> nodes.ImportFrom:
    """create and initialize an astroid ImportFrom import statement"""
    return nodes.ImportFrom(fromname, [(name, None) for name in names])


def register_arguments(func: nodes.FunctionDef, args: list | None = None) -> None:
    """add given arguments to local

    args is a list that may contains nested lists
    (i.e. def func(a, (b, c, d)): ...)
    """
    # If no args are passed in, get the args from the function.
    if args is None:
        if func.args.vararg:
            func.set_local(func.args.vararg, func.args)
        if func.args.kwarg:
            func.set_local(func.args.kwarg, func.args)
        args = func.args.args
        # If the function has no args, there is nothing left to do.
        if args is None:
            return
    for arg in args:
        if isinstance(arg, nodes.AssignName):
            func.set_local(arg.name, arg)
        else:
            register_arguments(func, arg.elts)


def object_build_class(
    node: nodes.Module | nodes.ClassDef, member: type
) -> nodes.ClassDef:
    """create astroid for a living class object"""
    basenames = [base.__name__ for base in member.__bases__]
    return _base_class_object_build(node, member, basenames)


def _get_args_info_from_callable(
    member: _FunctionTypes,
) -> tuple[list[str], list[str], list[Any], list[str], list[Any]]:
    """Returns args, posonlyargs, defaults, kwonlyargs.

    :note: currently ignores the return annotation.
    """
    signature = inspect.signature(member)
    args: list[str] = []
    defaults: list[Any] = []
    posonlyargs: list[str] = []
    kwonlyargs: list[str] = []
    kwonlydefaults: list[Any] = []

    for param_name, param in signature.parameters.items():
        if param.kind == inspect.Parameter.POSITIONAL_ONLY:
            posonlyargs.append(param_name)
        elif param.kind == inspect.Parameter.POSITIONAL_OR_KEYWORD:
            args.append(param_name)
        elif param.kind == inspect.Parameter.VAR_POSITIONAL:
            args.append(param_name)
        elif param.kind == inspect.Parameter.VAR_KEYWORD:
            args.append(param_name)
        elif param.kind == inspect.Parameter.KEYWORD_ONLY:
            kwonlyargs.append(param_name)
            if param.default is not inspect.Parameter.empty:
                kwonlydefaults.append(param.default)
            continue
        if param.default is not inspect.Parameter.empty:
            defaults.append(param.default)

    return args, posonlyargs, defaults, kwonlyargs, kwonlydefaults


def object_build_function(
    node: nodes.Module | nodes.ClassDef, member: _FunctionTypes
) -> nodes.FunctionDef:
    """create astroid for a living function object"""
    (
        args,
        posonlyargs,
        defaults,
        kwonlyargs,
        kwonly_defaults,
    ) = _get_args_info_from_callable(member)

    return build_function(
        getattr(member, "__name__", "<no-name>"),
        node,
        args,
        posonlyargs,
        defaults,
        member.__doc__ if isinstance(member.__doc__, str) else None,
        kwonlyargs=kwonlyargs,
        kwonlydefaults=kwonly_defaults,
    )


def object_build_datadescriptor(
    node: nodes.Module | nodes.ClassDef, member: type
) -> nodes.ClassDef:
    """create astroid for a living data descriptor object"""
    return _base_class_object_build(node, member, [])


def object_build_methoddescriptor(
    node: nodes.Module | nodes.ClassDef,
    member: _FunctionTypes,
) -> nodes.FunctionDef:
    """create astroid for a living method descriptor object"""
    # FIXME get arguments ?
    name = getattr(member, "__name__", "<no-name>")
    func = build_function(name, node, doc=member.__doc__)
    _add_dunder_class(func, node, member)
    return func


def _base_class_object_build(
    node: nodes.Module | nodes.ClassDef,
    member: type,
    basenames: list[str],
) -> nodes.ClassDef:
    """create astroid for a living class object, with a given set of base names
    (e.g. ancestors)
    """
    name = getattr(member, "__name__", "<no-name>")
    doc = member.__doc__ if isinstance(member.__doc__, str) else None
    klass = build_class(name, node, basenames, doc)
    klass._newstyle = isinstance(member, type)
    try:
        # limit the instantiation trick since it's too dangerous
        # (such as infinite test execution...)
        # this at least resolves common case such as Exception.args,
        # OSError.errno
        if issubclass(member, Exception):
            member_object = member()
            if hasattr(member_object, "__dict__"):
                instdict = member_object.__dict__
            else:
                raise TypeError
        else:
            raise TypeError
    except TypeError:
        pass
    else:
        for item_name, obj in instdict.items():
            valnode = nodes.EmptyNode()
            valnode.object = obj
            valnode.parent = klass
            valnode.lineno = 1
            klass.instance_attrs[item_name] = [valnode]
    return klass


def _build_from_function(
    node: nodes.Module | nodes.ClassDef,
    member: _FunctionTypes,
    module: types.ModuleType,
) -> nodes.FunctionDef | nodes.EmptyNode:
    # verify this is not an imported function
    try:
        code = member.__code__  # type: ignore[union-attr]
    except AttributeError:
        # Some implementations don't provide the code object,
        # such as Jython.
        code = None
    filename = getattr(code, "co_filename", None)
    if filename is None:
        return object_build_methoddescriptor(node, member)
    if filename == getattr(module, "__file__", None):
        return object_build_function(node, member)
    return build_dummy(member)


def _safe_has_attribute(obj, member: str) -> bool:
    """Required because unexpected RunTimeError can be raised.

    See https://github.com/pylint-dev/astroid/issues/1958
    """
    try:
        return hasattr(obj, member)
    except Exception:  # pylint: disable=broad-except
        return False


class InspectBuilder:
    """class for building nodes from living object

    this is actually a really minimal representation, including only Module,
    FunctionDef and ClassDef nodes and some others as guessed.
    """

    bootstrapped: bool = False

    def __init__(self, manager_instance: AstroidManager) -> None:
        self._manager = manager_instance
        self._done: dict[types.ModuleType | type, nodes.Module | nodes.ClassDef] = {}
        self._module: types.ModuleType

    def inspect_build(
        self,
        module: types.ModuleType,
        modname: str | None = None,
        path: str | None = None,
    ) -> nodes.Module:
        """build astroid from a living module (i.e. using inspect)
        this is used when there is no python source code available (either
        because it's a built-in module or because the .py is not available)
        """
        self._module = module
        if modname is None:
            modname = module.__name__
        try:
            node = build_module(modname, module.__doc__)
        except AttributeError:
            # in jython, java modules have no __doc__ (see #109562)
            node = build_module(modname)
        if path is None:
            node.path = node.file = path
        else:
            node.path = [os.path.abspath(path)]
            node.file = node.path[0]
        node.name = modname
        self._manager.cache_module(node)
        node.package = hasattr(module, "__path__")
        self._done = {}
        self.object_build(node, module)
        return node

    def object_build(
        self, node: nodes.Module | nodes.ClassDef, obj: types.ModuleType | type
    ) -> None:
        """recursive method which create a partial ast from real objects
        (only function, class, and method are handled)
        """
        if obj in self._done:
            return None
        self._done[obj] = node
        for alias in dir(obj):
            # inspect.ismethod() and inspect.isbuiltin() in PyPy return
            # the opposite of what they do in CPython for __class_getitem__.
            pypy__class_getitem__ = IS_PYPY and alias == "__class_getitem__"
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    member = getattr(obj, alias)
            except AttributeError:
                # damned ExtensionClass.Base, I know you're there !
                attach_dummy_node(node, alias)
                continue
            if inspect.ismethod(member) and not pypy__class_getitem__:
                member = member.__func__
            if inspect.isfunction(member):
                child = _build_from_function(node, member, self._module)
            elif inspect.isbuiltin(member) or pypy__class_getitem__:
                if self.imported_member(node, member, alias):
                    continue
                child = object_build_methoddescriptor(node, member)
            elif inspect.isclass(member):
                if self.imported_member(node, member, alias):
                    continue
                if member in self._done:
                    child = self._done[member]
                    assert isinstance(child, nodes.ClassDef)
                else:
                    child = object_build_class(node, member)
                    # recursion
                    self.object_build(child, member)
            elif inspect.ismethoddescriptor(member):
                child: nodes.NodeNG = object_build_methoddescriptor(node, member)
            elif inspect.isdatadescriptor(member):
                child = object_build_datadescriptor(node, member)
            elif isinstance(member, tuple(node_classes.CONST_CLS)):
                if alias in node.special_attributes:
                    continue
                child = nodes.const_factory(member)
            elif inspect.isroutine(member):
                # This should be called for Jython, where some builtin
                # methods aren't caught by isbuiltin branch.
                child = _build_from_function(node, member, self._module)
            elif _safe_has_attribute(member, "__all__"):
                child: nodes.NodeNG = build_module(alias)
                # recursion
                self.object_build(child, member)
            else:
                # create an empty node so that the name is actually defined
                child: nodes.NodeNG = build_dummy(member)
            if child not in node.locals.get(alias, ()):
                node.add_local_node(child, alias)
        return None

    def imported_member(self, node, member, name: str) -> bool:
        """verify this is not an imported class or handle it"""
        # /!\ some classes like ExtensionClass doesn't have a __module__
        # attribute ! Also, this may trigger an exception on badly built module
        # (see http://www.logilab.org/ticket/57299 for instance)
        try:
            modname = getattr(member, "__module__", None)
        except TypeError:
            modname = None
        if modname is None:
            if name in {"__new__", "__subclasshook__"}:
                # Python 2.5.1 (r251:54863, Sep  1 2010, 22:03:14)
                # >>> print object.__new__.__module__
                # None
                modname = builtins.__name__
            else:
                attach_dummy_node(node, name, member)
                return True

        # On PyPy during bootstrapping we infer _io while _module is
        # builtins. In CPython _io names itself io, see http://bugs.python.org/issue18602
        # Therefore, this basically checks whether we are not in PyPy.
        if modname == "_io" and not self._module.__name__ == "builtins":
            return False

        real_name = {"gtk": "gtk_gtk"}.get(modname, modname)

        if real_name != self._module.__name__:
            # check if it sounds valid and then add an import node, else use a
            # dummy node
            try:
                with (
                    redirect_stderr(io.StringIO()) as stderr,
                    redirect_stdout(io.StringIO()) as stdout,
                ):
                    getattr(sys.modules[modname], name)
                    stderr_value = stderr.getvalue()
                    if stderr_value:
                        logger.error(
                            "Captured stderr while getting %s from %s:\n%s",
                            name,
                            sys.modules[modname],
                            stderr_value,
                        )
                    stdout_value = stdout.getvalue()
                    if stdout_value:
                        logger.info(
                            "Captured stdout while getting %s from %s:\n%s",
                            name,
                            sys.modules[modname],
                            stdout_value,
                        )
            except (KeyError, AttributeError):
                attach_dummy_node(node, name, member)
            else:
                attach_import_node(node, modname, name)
            return True
        return False


# astroid bootstrapping ######################################################

_CONST_PROXY: dict[type, nodes.ClassDef] = {}


def _set_proxied(const) -> nodes.ClassDef:
    # TODO : find a nicer way to handle this situation;
    return _CONST_PROXY[const.value.__class__]


def _astroid_bootstrapping() -> None:
    """astroid bootstrapping the builtins module"""
    # this boot strapping is necessary since we need the Const nodes to
    # inspect_build builtins, and then we can proxy Const
    # pylint: disable-next=import-outside-toplevel
    from astroid.manager import AstroidManager

    builder = InspectBuilder(AstroidManager())
    astroid_builtin = builder.inspect_build(builtins)

    for cls, node_cls in node_classes.CONST_CLS.items():
        if cls is TYPE_NONE:
            proxy = build_class("NoneType", astroid_builtin)
        elif cls is TYPE_NOTIMPLEMENTED:
            proxy = build_class("NotImplementedType", astroid_builtin)
        elif cls is TYPE_ELLIPSIS:
            proxy = build_class("Ellipsis", astroid_builtin)
        else:
            proxy = astroid_builtin.getattr(cls.__name__)[0]
            assert isinstance(proxy, nodes.ClassDef)
        if cls in (dict, list, set, tuple):
            node_cls._proxied = proxy
        else:
            _CONST_PROXY[cls] = proxy

    # Set the builtin module as parent for some builtins.
    nodes.Const._proxied = property(_set_proxied)

    _GeneratorType = nodes.ClassDef(
        types.GeneratorType.__name__,
        lineno=0,
        col_offset=0,
        end_lineno=0,
        end_col_offset=0,
        parent=astroid_builtin,
    )
    astroid_builtin.set_local(_GeneratorType.name, _GeneratorType)
    generator_doc_node = (
        nodes.Const(value=types.GeneratorType.__doc__)
        if types.GeneratorType.__doc__
        else None
    )
    _GeneratorType.postinit(
        bases=[],
        body=[],
        decorators=None,
        doc_node=generator_doc_node,
    )
    bases.Generator._proxied = _GeneratorType
    builder.object_build(bases.Generator._proxied, types.GeneratorType)

    if hasattr(types, "AsyncGeneratorType"):
        _AsyncGeneratorType = nodes.ClassDef(
            types.AsyncGeneratorType.__name__,
            lineno=0,
            col_offset=0,
            end_lineno=0,
            end_col_offset=0,
            parent=astroid_builtin,
        )
        astroid_builtin.set_local(_AsyncGeneratorType.name, _AsyncGeneratorType)
        async_generator_doc_node = (
            nodes.Const(value=types.AsyncGeneratorType.__doc__)
            if types.AsyncGeneratorType.__doc__
            else None
        )
        _AsyncGeneratorType.postinit(
            bases=[],
            body=[],
            decorators=None,
            doc_node=async_generator_doc_node,
        )
        bases.AsyncGenerator._proxied = _AsyncGeneratorType
        builder.object_build(bases.AsyncGenerator._proxied, types.AsyncGeneratorType)

    if hasattr(types, "UnionType"):
        _UnionTypeType = nodes.ClassDef(
            types.UnionType.__name__,
            lineno=0,
            col_offset=0,
            end_lineno=0,
            end_col_offset=0,
            parent=astroid_builtin,
        )
        union_type_doc_node = (
            nodes.Const(value=types.UnionType.__doc__)
            if types.UnionType.__doc__
            else None
        )
        _UnionTypeType.postinit(
            bases=[],
            body=[],
            decorators=None,
            doc_node=union_type_doc_node,
        )
        bases.UnionType._proxied = _UnionTypeType
        builder.object_build(bases.UnionType._proxied, types.UnionType)

    builtin_types = (
        types.GetSetDescriptorType,
        types.GeneratorType,
        types.MemberDescriptorType,
        TYPE_NONE,
        TYPE_NOTIMPLEMENTED,
        types.FunctionType,
        types.MethodType,
        types.BuiltinFunctionType,
        types.ModuleType,
        types.TracebackType,
    )
    for _type in builtin_types:
        if _type.__name__ not in astroid_builtin:
            klass = nodes.ClassDef(
                _type.__name__,
                lineno=0,
                col_offset=0,
                end_lineno=0,
                end_col_offset=0,
                parent=astroid_builtin,
            )
            doc = _type.__doc__ if isinstance(_type.__doc__, str) else None
            klass.postinit(
                bases=[],
                body=[],
                decorators=None,
                doc_node=nodes.Const(doc) if doc else None,
            )
            builder.object_build(klass, _type)
            astroid_builtin[_type.__name__] = klass

    InspectBuilder.bootstrapped = True

    # pylint: disable-next=import-outside-toplevel
    from astroid.brain.brain_builtin_inference import on_bootstrap

    # Instantiates an AstroidBuilder(), which is where
    # InspectBuilder.bootstrapped is checked, so place after bootstrapped=True.
    on_bootstrap()
