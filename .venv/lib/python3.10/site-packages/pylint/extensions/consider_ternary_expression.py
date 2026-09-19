# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

"""Check for if / assign blocks that can be rewritten with if-expressions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from astroid import nodes

from pylint.checkers import BaseChecker

if TYPE_CHECKING:
    from pylint.lint import PyLinter


class ConsiderTernaryExpressionChecker(BaseChecker):
    name = "consider_ternary_expression"
    msgs = {
        "W0160": (
            "Consider rewriting as a ternary expression",
            "consider-ternary-expression",
            "Multiple assign statements spread across if/else blocks can be "
            "rewritten with a single assignment and ternary expression",
        )
    }

    def visit_if(self, node: nodes.If) -> None:
        if isinstance(node.parent, nodes.If):
            return

        match node:
            case nodes.If(body=[nodes.Assign() as bst], orelse=[nodes.Assign() as ost]):
                pass
            case _:
                return

        for bname, oname in zip(bst.targets, ost.targets):
            if not (
                isinstance(bname, nodes.AssignName)
                and isinstance(oname, nodes.AssignName)
                and bname.name == oname.name
            ):
                return

        self.add_message("consider-ternary-expression", node=node)


def register(linter: PyLinter) -> None:
    linter.register_checker(ConsiderTernaryExpressionChecker(linter))
