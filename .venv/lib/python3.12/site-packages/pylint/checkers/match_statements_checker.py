# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

"""Match statement checker for Python code."""

from __future__ import annotations

from typing import TYPE_CHECKING

import astroid.exceptions
from astroid import nodes

from pylint.checkers import BaseChecker
from pylint.checkers.utils import only_required_for_messages, safe_infer
from pylint.interfaces import HIGH, INFERENCE

if TYPE_CHECKING:
    from pylint.lint import PyLinter


# List of builtin classes which match self
# https://docs.python.org/3/reference/compound_stmts.html#class-patterns
MATCH_CLASS_SELF_NAMES = {
    "builtins.bool",
    "builtins.bytearray",
    "builtins.bytes",
    "builtins.dict",
    "builtins.float",
    "builtins.frozenset",
    "builtins.int",
    "builtins.list",
    "builtins.set",
    "builtins.str",
    "builtins.tuple",
}


class MatchStatementChecker(BaseChecker):
    name = "match_statements"
    msgs = {
        "E1901": (
            "The name capture `case %s` makes the remaining patterns unreachable. "
            "Use a dotted name (for example an enum) to fix this.",
            "bare-name-capture-pattern",
            "Emitted when a name capture pattern is used in a match statement "
            "and there are case statements below it.",
        ),
        "E1902": (
            "`__match_args__` must be a tuple of strings.",
            "invalid-match-args-definition",
            "Emitted if `__match_args__` isn't a tuple of strings required for match.",
        ),
        "E1903": (
            "%s expects %d positional sub-patterns (given %d)",
            "too-many-positional-sub-patterns",
            "Emitted when the number of allowed positional sub-patterns exceeds the "
            "number of allowed sub-patterns specified in `__match_args__`.",
        ),
        "E1904": (
            "Multiple sub-patterns for attribute %s",
            "multiple-class-sub-patterns",
            "Emitted when there is more than one sub-pattern for a specific "
            "attribute in a class pattern.",
        ),
        "R1905": (
            "Use '%s() as %s' instead",
            "match-class-bind-self",
            "Match class patterns are faster if the name binding happens "
            "for the whole pattern and any lookup for `__match_args__` "
            "can be avoided.",
        ),
        "R1906": (
            "Use keyword attributes instead of positional ones (%s)",
            "match-class-positional-attributes",
            "Keyword attributes are more explicit and slightly faster "
            "since CPython can skip the `__match_args__` lookup.",
        ),
    }

    @only_required_for_messages("invalid-match-args-definition")
    def visit_assignname(self, node: nodes.AssignName) -> None:
        if (
            node.name == "__match_args__"
            and isinstance(node.frame(), nodes.ClassDef)
            and isinstance(node.parent, nodes.Assign)
            and not (
                isinstance(node.parent.value, nodes.Tuple)
                and all(
                    isinstance(el, nodes.Const) and isinstance(el.value, str)
                    for el in node.parent.value.elts
                )
            )
        ):
            self.add_message(
                "invalid-match-args-definition",
                node=node.parent.value,
                args=(),
                confidence=HIGH,
            )

    @only_required_for_messages("bare-name-capture-pattern")
    def visit_match(self, node: nodes.Match) -> None:
        """Check if a name capture pattern prevents the other cases from being
        reached.
        """
        for idx, case in enumerate(node.cases):
            match case:
                case nodes.MatchCase(
                    pattern=nodes.MatchAs(
                        pattern=None, name=nodes.AssignName(name=name)
                    ),
                    guard=None,
                ) if (
                    idx < len(node.cases) - 1
                ):
                    self.add_message(
                        "bare-name-capture-pattern",
                        node=case.pattern,
                        args=(name,),
                        confidence=HIGH,
                    )

    @only_required_for_messages("match-class-bind-self")
    def visit_matchas(self, node: nodes.MatchAs) -> None:
        match node:
            case nodes.MatchAs(
                parent=nodes.MatchClass(cls=nodes.Name() as cls_name, patterns=[_]),
                name=nodes.AssignName(name=name),
                pattern=None,
            ):
                inferred = safe_infer(cls_name)
                if (
                    isinstance(inferred, nodes.ClassDef)
                    and inferred.qname() in MATCH_CLASS_SELF_NAMES
                ):
                    self.add_message(
                        "match-class-bind-self",
                        node=node,
                        args=(cls_name.name, name),
                        confidence=HIGH,
                    )

    @staticmethod
    def get_match_args_for_class(node: nodes.NodeNG) -> list[str] | None:
        """Infer __match_args__ from class name."""
        inferred = safe_infer(node)
        if not isinstance(inferred, nodes.ClassDef):
            return None
        try:
            match_args = inferred.getattr("__match_args__")
        except astroid.exceptions.NotFoundError:
            if inferred.qname() in MATCH_CLASS_SELF_NAMES:
                return ["<self>"]
            return None

        match match_args:
            case [
                nodes.AssignName(parent=nodes.Assign(value=nodes.Tuple(elts=elts))),
                *_,
            ] if all(
                isinstance(el, nodes.Const) and isinstance(el.value, str) for el in elts
            ):
                return [el.value for el in elts]
            case _:
                return None

    def check_duplicate_sub_patterns(
        self, name: str, node: nodes.NodeNG, *, attrs: set[str], dups: set[str]
    ) -> None:
        """Track attribute names and emit error if name is given more than once."""
        if name in attrs and name not in dups:
            dups.add(name)
            self.add_message(
                "multiple-class-sub-patterns",
                node=node,
                args=(name,),
                confidence=INFERENCE,
            )
        else:
            attrs.add(name)

    @only_required_for_messages(
        "match-class-positional-attributes",
        "multiple-class-sub-patterns",
        "too-many-positional-sub-patterns",
    )
    def visit_matchclass(self, node: nodes.MatchClass) -> None:
        attrs: set[str] = set()
        dups: set[str] = set()

        if (
            node.patterns
            and (match_args := self.get_match_args_for_class(node.cls)) is not None
        ):
            if len(node.patterns) > len(match_args):
                self.add_message(
                    "too-many-positional-sub-patterns",
                    node=node,
                    args=(node.cls.as_string(), len(match_args), len(node.patterns)),
                    confidence=INFERENCE,
                )
                return

            inferred = safe_infer(node.cls)
            if not (
                isinstance(inferred, nodes.ClassDef)
                and (
                    inferred.qname() in MATCH_CLASS_SELF_NAMES
                    or "tuple" in inferred.basenames
                )
            ):
                attributes = [f"'{attr}'" for attr in match_args[: len(node.patterns)]]
                self.add_message(
                    "match-class-positional-attributes",
                    node=node,
                    args=(", ".join(attributes),),
                    confidence=INFERENCE,
                )

            for i in range(len(node.patterns)):
                name = match_args[i]
                self.check_duplicate_sub_patterns(name, node, attrs=attrs, dups=dups)

        for kw_name in node.kwd_attrs:
            self.check_duplicate_sub_patterns(kw_name, node, attrs=attrs, dups=dups)


def register(linter: PyLinter) -> None:
    linter.register_checker(MatchStatementChecker(linter))
