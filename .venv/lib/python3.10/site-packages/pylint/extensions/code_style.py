# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

from __future__ import annotations

import difflib
from typing import TYPE_CHECKING, TypeGuard, cast

from astroid import nodes

from pylint.checkers import BaseChecker, utils
from pylint.checkers.utils import only_required_for_messages, safe_infer
from pylint.interfaces import INFERENCE

if TYPE_CHECKING:
    from pylint.lint import PyLinter


class CodeStyleChecker(BaseChecker):
    """Checkers that can improve code consistency.

    As such they don't necessarily provide a performance benefit and
    are often times opinionated.

    Before adding another checker here, consider this:
    1. Does the checker provide a clear benefit,
       i.e. detect a common issue or improve performance
       => it should probably be part of the core checker classes
    2. Is it something that would improve code consistency,
       maybe because it's slightly better with regard to performance
       and therefore preferred => this is the right place
    3. Everything else should go into another extension
    """

    name = "code_style"
    msgs = {
        "R6101": (
            "Consider using namedtuple or dataclass for dictionary values",
            "consider-using-namedtuple-or-dataclass",
            "Emitted when dictionary values can be replaced by namedtuples or dataclass instances.",
        ),
        "R6102": (
            "Consider using an in-place tuple instead of list",
            "consider-using-tuple",
            "Only for style consistency! "
            "Emitted where an in-place defined ``list`` can be replaced by a ``tuple``. "
            "Due to optimizations by CPython, there is no performance benefit from it.",
        ),
        "R6103": (
            "Use '%s' instead",
            "consider-using-assignment-expr",
            "Emitted when an if assignment is directly followed by an if statement and "
            "both can be combined by using an assignment expression ``:=``. "
            "Requires Python 3.8 and ``py-version >= 3.8``.",
        ),
        "R6104": (
            "Use '%s' to do an augmented assign directly",
            "consider-using-augmented-assign",
            "Emitted when an assignment is referring to the object that it is assigning "
            "to. This can be changed to be an augmented assign.\n"
            "Disabled by default!",
            {
                "default_enabled": False,
            },
        ),
        "R6105": (
            "Prefer 'typing.NamedTuple' over 'collections.namedtuple'",
            "prefer-typing-namedtuple",
            "'typing.NamedTuple' uses the well-known 'class' keyword "
            "with type-hints for readability (it's also faster as it avoids "
            "an internal exec call).\n"
            "Disabled by default!",
            {
                "default_enabled": False,
            },
        ),
        "R6106": (
            "Consider %smath.%s instead of %s",
            "consider-math-not-float",
            "Using math.inf or math.nan permits to benefit from typing and it is up "
            "to 4 times faster than a float call (after the initial import of math). "
            "This check also catches typos in float calls as a side effect.",
        ),
    }
    options = (
        (
            "max-line-length-suggestions",
            {
                "type": "int",
                "default": 0,
                "metavar": "<int>",
                "help": (
                    "Max line length for which to sill emit suggestions. "
                    "Used to prevent optional suggestions which would get split "
                    "by a code formatter (e.g., black). "
                    "Will default to the setting for ``max-line-length``."
                ),
            },
        ),
    )

    def open(self) -> None:
        py_version = self.linter.config.py_version
        self._py36_plus = py_version >= (3, 6)
        self._py38_plus = py_version >= (3, 8)
        self._max_length: int = (
            self.linter.config.max_line_length_suggestions
            or self.linter.config.max_line_length
        )

    @only_required_for_messages("prefer-typing-namedtuple", "consider-math-not-float")
    def visit_call(self, node: nodes.Call) -> None:
        if self._py36_plus:
            called = safe_infer(node.func)
            if not (called and isinstance(called, (nodes.FunctionDef, nodes.ClassDef))):
                return
            if called.qname() == "collections.namedtuple":
                self.add_message(
                    "prefer-typing-namedtuple", node=node, confidence=INFERENCE
                )
            elif called.qname() == "builtins.float":
                if (
                    node.args
                    and isinstance(node.args[0], nodes.Const)
                    and isinstance(node.args[0].value, str)
                    and any(
                        c.isalpha() and c.lower() != "e" for c in node.args[0].value
                    )
                ):
                    value = node.args[0].value.lower()
                    math_call: str
                    if "nan" in value:
                        math_call = "nan"
                    elif "inf" in value:
                        math_call = "inf"
                    else:
                        math_call = difflib.get_close_matches(
                            value, ["inf", "nan"], n=1, cutoff=0
                        )[0]
                    minus = "-" if math_call == "inf" and value.startswith("-") else ""
                    self.add_message(
                        "consider-math-not-float",
                        node=node,
                        args=(minus, math_call, node.as_string()),
                        confidence=INFERENCE,
                    )

    @only_required_for_messages("consider-using-namedtuple-or-dataclass")
    def visit_dict(self, node: nodes.Dict) -> None:
        self._check_dict_consider_namedtuple_dataclass(node)

    @only_required_for_messages("consider-using-tuple")
    def visit_for(self, node: nodes.For) -> None:
        if isinstance(node.iter, nodes.List):
            self.add_message("consider-using-tuple", node=node.iter)

    @only_required_for_messages("consider-using-tuple")
    def visit_comprehension(self, node: nodes.Comprehension) -> None:
        if isinstance(node.iter, nodes.List):
            self.add_message("consider-using-tuple", node=node.iter)

    @only_required_for_messages("consider-using-assignment-expr")
    def visit_if(self, node: nodes.If) -> None:
        if self._py38_plus:
            self._check_consider_using_assignment_expr(node)

    def _check_dict_consider_namedtuple_dataclass(self, node: nodes.Dict) -> None:
        """Check if dictionary values can be replaced by Namedtuple or Dataclass."""
        if not (
            (
                isinstance(node.parent, (nodes.Assign, nodes.AnnAssign))
                and isinstance(node.parent.parent, nodes.Module)
            )
            or (
                isinstance(node.parent, nodes.AnnAssign)
                and isinstance(node.parent.target, nodes.AssignName)
                and utils.is_assign_name_annotated_with(node.parent.target, "Final")
            )
        ):
            # If dict is not part of an 'Assign' or 'AnnAssign' node in
            # a module context OR 'AnnAssign' with 'Final' annotation, skip check.
            return

        # All dict_values are itself dict nodes
        if len(node.items) > 1 and all(
            isinstance(dict_value, nodes.Dict) for _, dict_value in node.items
        ):
            KeyTupleT = tuple[type[nodes.NodeNG], str]

            # Makes sure all keys are 'Const' string nodes
            keys_checked: set[KeyTupleT] = set()
            for _, dict_value in node.items:
                dict_value = cast(nodes.Dict, dict_value)
                for key, _ in dict_value.items:
                    key_tuple = (type(key), key.as_string())
                    if key_tuple in keys_checked:
                        continue
                    inferred = safe_infer(key)
                    if not (
                        isinstance(inferred, nodes.Const)
                        and inferred.pytype() == "builtins.str"
                    ):
                        return
                    keys_checked.add(key_tuple)

            # Makes sure all subdicts have at least 1 common key
            key_tuples: list[tuple[KeyTupleT, ...]] = []
            for _, dict_value in node.items:
                dict_value = cast(nodes.Dict, dict_value)
                key_tuples.append(
                    tuple((type(key), key.as_string()) for key, _ in dict_value.items)
                )
            keys_intersection: set[KeyTupleT] = set(key_tuples[0])
            for sub_key_tuples in key_tuples[1:]:
                keys_intersection.intersection_update(sub_key_tuples)
            if not keys_intersection:
                return

            self.add_message("consider-using-namedtuple-or-dataclass", node=node)
            return

        # All dict_values are itself either list or tuple nodes
        if len(node.items) > 1 and all(
            isinstance(dict_value, (nodes.List, nodes.Tuple))
            for _, dict_value in node.items
        ):
            # Make sure all sublists have the same length > 0
            list_length = len(node.items[0][1].elts)
            if list_length == 0:
                return
            for _, dict_value in node.items[1:]:
                if len(dict_value.elts) != list_length:
                    return

            # Make sure at least one list entry isn't a dict
            for _, dict_value in node.items:
                if all(isinstance(entry, nodes.Dict) for entry in dict_value.elts):
                    return

            self.add_message("consider-using-namedtuple-or-dataclass", node=node)
            return

    def _check_consider_using_assignment_expr(self, node: nodes.If) -> None:
        """Check if an assignment expression (walrus operator) can be used.

        For example if an assignment is directly followed by an if statement:
        >>> x = 2
        >>> if x:
        >>>     ...

        Can be replaced by:
        >>> if (x := 2):
        >>>     ...

        Note: Assignment expressions were added in Python 3.8
        """
        # Check if `node.test` contains a `Name` node
        match node.test:
            case (
                (nodes.Name() as node_name)
                | nodes.UnaryOp(op="not", operand=nodes.Name() as node_name)
                | nodes.Compare(left=nodes.Name() as node_name, ops=[_])
            ):
                pass
            case _:
                return

        # Make sure the previous node is an assignment to the same name
        # used in `node.test`. Furthermore, ignore if assignment spans multiple lines.
        prev_sibling = node.previous_sibling()
        if CodeStyleChecker._check_prev_sibling_to_if_stmt(
            prev_sibling, node_name.name
        ):
            # Check if match statement would be a better fit.
            # I.e. multiple ifs that test the same name.
            if CodeStyleChecker._check_ignore_assignment_expr_suggestion(
                node, node_name.name
            ):
                return

            # Build suggestion string. Check length of suggestion
            # does not exceed max-line-length-suggestions
            test_str = node.test.as_string().replace(
                node_name.name,
                f"({node_name.name} := {prev_sibling.value.as_string()})",
                1,
            )
            suggestion = f"if {test_str}:"
            if (
                node.col_offset is not None
                and len(suggestion) + node.col_offset > self._max_length
            ) or len(suggestion) > self._max_length:
                return

            self.add_message(
                "consider-using-assignment-expr",
                node=node_name,
                args=(suggestion,),
            )

    @staticmethod
    def _check_prev_sibling_to_if_stmt(
        prev_sibling: nodes.NodeNG | None, name: str | None
    ) -> TypeGuard[nodes.Assign | nodes.AnnAssign]:
        """Check if previous sibling is an assignment with the same name.

        Ignore statements which span multiple lines.
        """
        if prev_sibling is None or prev_sibling.tolineno - prev_sibling.fromlineno != 0:
            return False

        match prev_sibling:
            case nodes.Assign(
                targets=[nodes.AssignName(name=target_name)]
            ) | nodes.AnnAssign(target=nodes.AssignName(name=target_name)):
                return target_name == name and prev_sibling.value is not None
        return False

    @staticmethod
    def _check_ignore_assignment_expr_suggestion(
        node: nodes.If, name: str | None
    ) -> bool:
        """Return True if suggestion for assignment expr should be ignored.

        E.g., in cases where a match statement would be a better fit
        (multiple conditions).
        """
        if isinstance(node.test, nodes.Compare):
            next_if_node: nodes.If | None = None
            next_sibling = node.next_sibling()
            if len(node.orelse) == 1 and isinstance(node.orelse[0], nodes.If):
                # elif block
                next_if_node = node.orelse[0]
            elif isinstance(next_sibling, nodes.If):
                # separate if block
                next_if_node = next_sibling

            match next_if_node:
                case nodes.If(
                    test=nodes.Compare(left=nodes.Name(name=n)) | nodes.Name(name=n)
                ) if (n == name):
                    return True
        return False

    @only_required_for_messages("consider-using-augmented-assign")
    def visit_assign(self, node: nodes.Assign) -> None:
        is_aug, op = utils.is_augmented_assign(node)
        if is_aug:
            self.add_message(
                "consider-using-augmented-assign",
                args=f"{op}=",
                node=node,
                line=node.lineno,
                col_offset=node.col_offset,
                confidence=INFERENCE,
            )


def register(linter: PyLinter) -> None:
    linter.register_checker(CodeStyleChecker(linter))
