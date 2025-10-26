# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from pylint.checkers.typecheck import _similar_names
from pylint.checkers.utils import (
    class_is_abstract,
    in_for_else_branch,
    infer_all,
    is_overload_stub,
    overridden_method,
    safe_infer,
    unimplemented_abstract_methods,
)

if TYPE_CHECKING:
    from functools import _lru_cache_wrapper


def clear_lru_caches() -> None:
    """Clear caches holding references to AST nodes."""
    caches_holding_node_references: list[_lru_cache_wrapper[Any]] = [
        class_is_abstract,
        in_for_else_branch,
        infer_all,
        is_overload_stub,
        overridden_method,
        unimplemented_abstract_methods,
        safe_infer,
        _similar_names,
    ]
    for lru in caches_holding_node_references:
        lru.cache_clear()
