# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

"""Visitor doing some post-processing on the astroid tree.

Try to resolve definitions (namespace) dictionary, relationship...
"""

from __future__ import annotations

import collections
import os
import traceback
from abc import ABC, abstractmethod
from collections.abc import Callable, Sequence

import astroid
import astroid.exceptions
import astroid.modutils
from astroid import nodes
from astroid.typing import InferenceResult

from pylint import constants
from pylint.checkers.utils import safe_infer
from pylint.pyreverse import utils

_WrapperFuncT = Callable[
    [Callable[[str], nodes.Module], str, bool], nodes.Module | None
]


def _astroid_wrapper(
    func: Callable[[str], nodes.Module],
    modname: str,
    verbose: bool = False,
) -> nodes.Module | None:
    if verbose:
        print(f"parsing {modname}...")
    try:
        return func(modname)
    except astroid.exceptions.AstroidBuildingError as exc:
        print(exc)
    except Exception:  # pylint: disable=broad-except
        traceback.print_exc()
    return None


class IdGeneratorMixIn:
    """Mixin adding the ability to generate integer uid."""

    def __init__(self, start_value: int = 0) -> None:
        self.id_count = start_value

    def init_counter(self, start_value: int = 0) -> None:
        """Init the id counter."""
        self.id_count = start_value

    def generate_id(self) -> int:
        """Generate a new identifier."""
        self.id_count += 1
        return self.id_count


class Project:
    """A project handle a set of modules / packages."""

    def __init__(self, name: str = ""):
        self.name = name
        self.uid: int | None = None
        self.path: str = ""
        self.modules: list[nodes.Module] = []
        self.locals: dict[str, nodes.Module] = {}
        self.__getitem__ = self.locals.__getitem__
        self.__iter__ = self.locals.__iter__
        self.values = self.locals.values
        self.keys = self.locals.keys
        self.items = self.locals.items

    def add_module(self, node: nodes.Module) -> None:
        self.locals[node.name] = node
        self.modules.append(node)

    def get_module(self, name: str) -> nodes.Module:
        return self.locals[name]

    def get_children(self) -> list[nodes.Module]:
        return self.modules

    def __repr__(self) -> str:
        return f"<Project {self.name!r} at {id(self)} ({len(self.modules)} modules)>"


class Linker(IdGeneratorMixIn, utils.LocalsVisitor):
    """Walk on the project tree and resolve relationships.

    According to options the following attributes may be
    added to visited nodes:

    * uid,
      a unique identifier for the node (on astroid.Project, nodes.Module,
      nodes.Class and astroid.locals_type). Only if the linker
      has been instantiated with tag=True parameter (False by default).

    * Function
      a mapping from locals names to their bounded value, which may be a
      constant like a string or an integer, or an astroid node
      (on nodes.Module, nodes.Class and nodes.Function).

    * instance_attrs_type
      as locals_type but for klass member attributes (only on nodes.Class)

    * associations_type
      as instance_attrs_type but for association relationships

    * aggregations_type
      as instance_attrs_type but for aggregations relationships

    * compositions_type
      as instance_attrs_type but for compositions relationships
    """

    def __init__(self, project: Project, tag: bool = False) -> None:
        IdGeneratorMixIn.__init__(self)
        utils.LocalsVisitor.__init__(self)
        # tag nodes or not
        self.tag = tag
        # visited project
        self.project = project

        # Chain: Composition → Aggregation → Association
        self.compositions_handler = CompositionsHandler()
        aggregation_handler = AggregationsHandler()
        association_handler = AssociationsHandler()

        self.compositions_handler.set_next(aggregation_handler)
        aggregation_handler.set_next(association_handler)

    def visit_project(self, node: Project) -> None:
        """Visit a pyreverse.utils.Project node.

        * optionally tag the node with a unique id
        """
        if self.tag:
            node.uid = self.generate_id()
        for module in node.modules:
            self.visit(module)

    def visit_module(self, node: nodes.Module) -> None:
        """Visit an nodes.Module node.

        * set the locals_type mapping
        * set the depends mapping
        * optionally tag the node with a unique id
        """
        if hasattr(node, "locals_type"):
            return
        node.locals_type = collections.defaultdict(list)
        node.depends = []
        node.type_depends = []
        if self.tag:
            node.uid = self.generate_id()

    def visit_classdef(self, node: nodes.ClassDef) -> None:
        """Visit an nodes.Class node.

        * set the locals_type and instance_attrs_type mappings
        * optionally tag the node with a unique id
        """
        if hasattr(node, "locals_type"):
            return
        node.locals_type = collections.defaultdict(list)
        if self.tag:
            node.uid = self.generate_id()
        # resolve ancestors
        for baseobj in node.ancestors(recurs=False):
            specializations = getattr(baseobj, "specializations", [])
            specializations.append(node)
            baseobj.specializations = specializations
        # resolve instance attributes
        node.compositions_type = collections.defaultdict(list)
        node.instance_attrs_type = collections.defaultdict(list)
        node.aggregations_type = collections.defaultdict(list)
        node.associations_type = collections.defaultdict(list)
        for assignattrs in tuple(node.instance_attrs.values()):
            for assignattr in assignattrs:
                if not isinstance(assignattr, nodes.Unknown):
                    self.compositions_handler.handle(assignattr, node)
                    self.handle_assignattr_type(assignattr, node)

        # Process class attributes
        for local_nodes in node.locals.values():
            for local_node in local_nodes:
                if isinstance(local_node, nodes.AssignName) and isinstance(
                    local_node.parent, nodes.Assign
                ):
                    self.compositions_handler.handle(local_node, node)

    def visit_functiondef(self, node: nodes.FunctionDef) -> None:
        """Visit an nodes.Function node.

        * set the locals_type mapping
        * optionally tag the node with a unique id
        """
        if hasattr(node, "locals_type"):
            return
        node.locals_type = collections.defaultdict(list)
        if self.tag:
            node.uid = self.generate_id()

    def visit_assignname(self, node: nodes.AssignName) -> None:
        """Visit an nodes.AssignName node.

        handle locals_type
        """
        # avoid double parsing done by different Linkers.visit
        # running over the same project:
        if hasattr(node, "_handled"):
            return
        node._handled = True
        if node.name in node.frame():
            frame = node.frame()
        else:
            # the name has been defined as 'global' in the frame and belongs
            # there.
            frame = node.root()
        if not hasattr(frame, "locals_type"):
            # If the frame doesn't have a locals_type yet,
            # it means it wasn't yet visited. Visit it now
            # to add what's missing from it.
            if isinstance(frame, nodes.ClassDef):
                self.visit_classdef(frame)
            elif isinstance(frame, nodes.FunctionDef):
                self.visit_functiondef(frame)
            else:
                self.visit_module(frame)

        current = frame.locals_type[node.name]
        frame.locals_type[node.name] = list(set(current) | utils.infer_node(node))

    @staticmethod
    def handle_assignattr_type(node: nodes.AssignAttr, parent: nodes.ClassDef) -> None:
        """Handle an astroid.assignattr node.

        handle instance_attrs_type
        """
        current = set(parent.instance_attrs_type[node.attrname])
        parent.instance_attrs_type[node.attrname] = list(
            current | utils.infer_node(node)
        )

    def visit_import(self, node: nodes.Import) -> None:
        """Visit an nodes.Import node.

        resolve module dependencies
        """
        context_file = node.root().file
        for name in node.names:
            relative = astroid.modutils.is_relative(name[0], context_file)
            self._imported_module(node, name[0], relative)

    def visit_importfrom(self, node: nodes.ImportFrom) -> None:
        """Visit an nodes.ImportFrom node.

        resolve module dependencies
        """
        basename = node.modname
        context_file = node.root().file
        if context_file is not None:
            relative = astroid.modutils.is_relative(basename, context_file)
        else:
            relative = False
        for name in node.names:
            if name[0] == "*":
                continue
            # analyze dependencies
            fullname = f"{basename}.{name[0]}"
            if fullname.find(".") > -1:
                try:
                    fullname = astroid.modutils.get_module_part(fullname, context_file)
                except ImportError:
                    continue
            if fullname != basename:
                self._imported_module(node, fullname, relative)

    def compute_module(self, context_name: str, mod_path: str) -> bool:
        """Should the module be added to dependencies ?"""
        package_dir = os.path.dirname(self.project.path)
        if context_name == mod_path:
            return False
        # astroid does return a boolean but is not typed correctly yet

        return astroid.modutils.module_in_path(mod_path, (package_dir,))  # type: ignore[no-any-return]

    def _imported_module(
        self, node: nodes.Import | nodes.ImportFrom, mod_path: str, relative: bool
    ) -> None:
        """Notify an imported module, used to analyze dependencies."""
        module = node.root()
        context_name = module.name
        if relative:
            mod_path = f"{'.'.join(context_name.split('.')[:-1])}.{mod_path}"
        if self.compute_module(context_name, mod_path):
            # handle dependencies
            if not hasattr(module, "depends"):
                module.depends = []
            mod_paths = module.depends
            if mod_path not in mod_paths:
                mod_paths.append(mod_path)


class RelationshipHandlerInterface(ABC):
    @abstractmethod
    def set_next(
        self, handler: RelationshipHandlerInterface
    ) -> RelationshipHandlerInterface:
        pass

    @abstractmethod
    def handle(
        self, node: nodes.AssignAttr | nodes.AssignName, parent: nodes.ClassDef
    ) -> None:
        pass


class AbstractRelationshipHandler(RelationshipHandlerInterface):
    """
    Chain of Responsibility for handling types of relationships, useful
    to expand in the future if we want to add more distinct relationships.

    Every link of the chain checks if it's a certain type of relationship.
    If no relationship is found it's set as a generic relationship in `relationships_type`.

    The default chaining behavior is implemented inside the base handler
    class.
    """

    _next_handler: RelationshipHandlerInterface

    def set_next(
        self, handler: RelationshipHandlerInterface
    ) -> RelationshipHandlerInterface:
        self._next_handler = handler
        return handler

    @abstractmethod
    def handle(
        self, node: nodes.AssignAttr | nodes.AssignName, parent: nodes.ClassDef
    ) -> None:
        if self._next_handler:
            self._next_handler.handle(node, parent)


class CompositionsHandler(AbstractRelationshipHandler):
    """Handle composition relationships where parent creates child objects."""

    def handle(
        self, node: nodes.AssignAttr | nodes.AssignName, parent: nodes.ClassDef
    ) -> None:
        # If the node is not part of an assignment, pass to next handler
        if not isinstance(node.parent, (nodes.AnnAssign, nodes.Assign)):
            super().handle(node, parent)
            return

        value = node.parent.value

        # Extract the name to handle both AssignAttr and AssignName nodes
        name = node.attrname if isinstance(node, nodes.AssignAttr) else node.name

        # Composition: direct object creation (self.x = P())
        if isinstance(value, nodes.Call):
            inferred_types = utils.infer_node(node)
            element_types = extract_element_types(inferred_types)

            # Resolve nodes to actual class definitions
            resolved_types = resolve_to_class_def(element_types)

            current = set(parent.compositions_type[name])
            parent.compositions_type[name] = list(current | resolved_types)
            return

        # Composition: comprehensions with object creation (self.x = [P() for ...])
        if isinstance(
            value, (nodes.ListComp, nodes.DictComp, nodes.SetComp, nodes.GeneratorExp)
        ):
            if isinstance(value, nodes.DictComp):
                element = value.value
            else:
                element = value.elt

            # If the element is a Call (object creation), it's composition
            if isinstance(element, nodes.Call):
                inferred_types = utils.infer_node(node)
                element_types = extract_element_types(inferred_types)

                # Resolve nodes to actual class definitions
                resolved_types = resolve_to_class_def(element_types)

                current = set(parent.compositions_type[name])
                parent.compositions_type[name] = list(current | resolved_types)
                return

        # Not a composition, pass to next handler
        super().handle(node, parent)


class AggregationsHandler(AbstractRelationshipHandler):
    """Handle aggregation relationships where parent receives child objects."""

    def handle(
        self, node: nodes.AssignAttr | nodes.AssignName, parent: nodes.ClassDef
    ) -> None:
        # If the node is not part of an assignment, pass to next handler
        if not isinstance(node.parent, (nodes.AnnAssign, nodes.Assign)):
            super().handle(node, parent)
            return

        value = node.parent.value

        # Extract the name to handle both AssignAttr and AssignName nodes
        name = node.attrname if isinstance(node, nodes.AssignAttr) else node.name

        # Aggregation: direct assignment (self.x = x)
        if isinstance(value, nodes.Name):
            inferred_types = utils.infer_node(node)
            element_types = extract_element_types(inferred_types)

            # Resolve nodes to actual class definitions
            resolved_types = resolve_to_class_def(element_types)

            current = set(parent.aggregations_type[name])
            parent.aggregations_type[name] = list(current | resolved_types)
            return

        # Aggregation: comprehensions without object creation (self.x = [existing_obj for ...])
        if isinstance(
            value, (nodes.ListComp, nodes.DictComp, nodes.SetComp, nodes.GeneratorExp)
        ):
            if isinstance(value, nodes.DictComp):
                element = value.value
            else:
                element = value.elt

            # If the element is a Name, it means it's an existing object, so it's aggregation
            if isinstance(element, nodes.Name):
                inferred_types = utils.infer_node(node)
                element_types = extract_element_types(inferred_types)

                # Resolve nodes to actual class definitions
                resolved_types = resolve_to_class_def(element_types)

                current = set(parent.aggregations_type[name])
                parent.aggregations_type[name] = list(current | resolved_types)
                return

        # Not an aggregation, pass to next handler
        super().handle(node, parent)


class AssociationsHandler(AbstractRelationshipHandler):
    """Handle regular association relationships."""

    def handle(
        self, node: nodes.AssignAttr | nodes.AssignName, parent: nodes.ClassDef
    ) -> None:
        # Extract the name to handle both AssignAttr and AssignName nodes
        name = node.attrname if isinstance(node, nodes.AssignAttr) else node.name

        # Type annotation only (x: P) -> Association
        # BUT only if there's no actual assignment (to avoid duplicates)
        if isinstance(node.parent, nodes.AnnAssign) and node.parent.value is None:
            inferred_types = utils.infer_node(node)
            element_types = extract_element_types(inferred_types)

            # Resolve nodes to actual class definitions
            resolved_types = resolve_to_class_def(element_types)

            current = set(parent.associations_type[name])
            parent.associations_type[name] = list(current | resolved_types)
            return

        # Everything else is also association (fallback)
        current = set(parent.associations_type[name])
        inferred_types = utils.infer_node(node)
        element_types = extract_element_types(inferred_types)

        # Resolve Name nodes to actual class definitions
        resolved_types = resolve_to_class_def(element_types)
        parent.associations_type[name] = list(current | resolved_types)


def resolve_to_class_def(types: set[nodes.NodeNG]) -> set[nodes.ClassDef]:
    """Resolve a set of nodes to ClassDef nodes."""
    class_defs = set()
    for node in types:
        if isinstance(node, nodes.ClassDef):
            class_defs.add(node)
        elif isinstance(node, nodes.Name):
            inferred = safe_infer(node)
            if isinstance(inferred, nodes.ClassDef):
                class_defs.add(inferred)
        elif isinstance(node, astroid.Instance):
            # Instance of a class -> get the actual class
            class_defs.add(node._proxied)
    return class_defs


def extract_element_types(inferred_types: set[InferenceResult]) -> set[nodes.NodeNG]:
    """Extract element types in case the inferred type is a container.

    This function checks if the inferred type is a container type (like list, dict, etc.)
    and extracts the element type(s) from it. If the inferred type is a direct type (like a class),
    it adds that type directly to the set of element types it returns.
    """
    element_types = set()

    for inferred_type in inferred_types:
        if isinstance(inferred_type, nodes.Subscript):
            slice_node = inferred_type.slice

            # Handle both Tuple (dict[K,V]) and single element (list[T])
            elements = (
                slice_node.elts if isinstance(slice_node, nodes.Tuple) else [slice_node]
            )

            for elt in elements:
                if isinstance(elt, (nodes.Name, nodes.ClassDef)):
                    element_types.add(elt)
        else:
            element_types.add(inferred_type)

    return element_types


def project_from_files(
    files: Sequence[str],
    func_wrapper: _WrapperFuncT = _astroid_wrapper,
    project_name: str = "no name",
    black_list: tuple[str, ...] = constants.DEFAULT_IGNORE_LIST,
    verbose: bool = False,
) -> Project:
    """Return a Project from a list of files or modules."""
    # build the project representation
    astroid_manager = astroid.MANAGER
    project = Project(project_name)
    for something in files:
        if not os.path.exists(something):
            fpath = astroid.modutils.file_from_modpath(something.split("."))
        elif os.path.isdir(something):
            fpath = os.path.join(something, "__init__.py")
        else:
            fpath = something
        ast = func_wrapper(astroid_manager.ast_from_file, fpath, verbose)
        if ast is None:
            continue
        project.path = project.path or ast.file
        project.add_module(ast)
        base_name = ast.name
        # recurse in package except if __init__ was explicitly given
        if ast.package and something.find("__init__") == -1:
            # recurse on others packages / modules if this is a package
            for fpath in astroid.modutils.get_module_files(
                os.path.dirname(ast.file), black_list
            ):
                ast = func_wrapper(astroid_manager.ast_from_file, fpath, verbose)
                if ast is None or ast.name == base_name:
                    continue
                project.add_module(ast)
    return project
