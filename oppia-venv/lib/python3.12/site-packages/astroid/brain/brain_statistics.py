# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/pylint-dev/astroid/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/astroid/blob/main/CONTRIBUTORS.txt

"""Astroid hooks for understanding statistics library module.

Provides inference improvements for statistics module functions that have
complex runtime behavior difficult to analyze statically.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import TYPE_CHECKING

from astroid import nodes
from astroid.context import InferenceContext
from astroid.inference_tip import inference_tip
from astroid.manager import AstroidManager
from astroid.util import Uninferable

if TYPE_CHECKING:
    from astroid.typing import InferenceResult


def _looks_like_statistics_quantiles(node: nodes.Call) -> bool:
    """Check if this is a call to statistics.quantiles."""
    match node.func:
        case nodes.Attribute(expr=nodes.Name(name="statistics"), attrname="quantiles"):
            # Case 1: statistics.quantiles(...)
            return True
        case nodes.Name(name="quantiles"):
            # Case 2: from statistics import quantiles; quantiles(...)
            # Check if quantiles was imported from statistics
            try:
                frame = node.frame()
                if "quantiles" in frame.locals:
                    # Look for import from statistics
                    for stmt in frame.body:
                        if (
                            isinstance(stmt, nodes.ImportFrom)
                            and stmt.modname == "statistics"
                            and any(name[0] == "quantiles" for name in stmt.names or [])
                        ):
                            return True
            except (AttributeError, TypeError):
                # If we can't determine the import context, be conservative
                pass
    return False


def infer_statistics_quantiles(
    node: nodes.Call, context: InferenceContext | None = None
) -> Iterator[InferenceResult]:
    """Infer the result of statistics.quantiles() calls.

    Returns Uninferable because quantiles() has complex runtime behavior
    that cannot be statically analyzed, preventing false positives in
    pylint's unbalanced-tuple-unpacking checker.

    statistics.quantiles() returns a list with (n-1) elements, but static
    analysis sees only the empty list initializations in the function body.
    """
    yield Uninferable


def register(manager: AstroidManager) -> None:
    """Register statistics-specific inference improvements."""
    manager.register_transform(
        nodes.Call,
        inference_tip(infer_statistics_quantiles),
        _looks_like_statistics_quantiles,
    )
