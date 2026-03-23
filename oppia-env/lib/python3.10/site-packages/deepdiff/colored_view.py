import json
import os
from ast import literal_eval
from importlib.util import find_spec
from typing import Any, Dict

from deepdiff.model import TextResult, TreeResult


if os.name == "nt" and find_spec("colorama"):
    import colorama

    colorama.init()


# ANSI color codes
RED = '\033[31m'
GREEN = '\033[32m'
RESET = '\033[0m'


class ColoredView:
    """A view that shows JSON with color-coded differences."""

    def __init__(self, t2: Any, tree_result: TreeResult, compact: bool = False):
        self.t2 = t2
        self.tree = tree_result
        self.compact = compact
        self.diff_paths = self._collect_diff_paths()

    def _collect_diff_paths(self) -> Dict[str, str]:
        """Collect all paths that have differences and their types."""
        text_result = TextResult(tree_results=self.tree, verbose_level=2)
        diff_paths = {}
        for diff_type, items in text_result.items():
            if not items:
                continue
            try:
                iter(items)
            except TypeError:
                continue
            for path, item in items.items():
                if diff_type in ("values_changed", "type_changes"):
                    changed_path = item.get("new_path") or path
                    diff_paths[changed_path] = ("changed", item["old_value"], item["new_value"])
                elif diff_type in ("dictionary_item_added", "iterable_item_added", "set_item_added"):
                    diff_paths[path] = ("added", None, item)
                elif diff_type in ("dictionary_item_removed", "iterable_item_removed", "set_item_removed"):
                    diff_paths[path] = ("removed", item, None)
        return diff_paths

    def _format_value(self, value: Any) -> str:
        """Format a value for display."""
        if isinstance(value, bool):
            return 'true' if value else 'false'
        elif isinstance(value, str):
            return f'"{value}"'
        elif isinstance(value, (dict, list, tuple)):
            return json.dumps(value)
        else:
            return str(value)

    def _get_path_removed(self, path: str) -> dict:
        """Get all removed items for a given path."""
        removed = {}
        for key, value in self.diff_paths.items():
            if value[0] == 'removed' and key.startswith(path + "["):
                key_suffix = key[len(path):]
                if key_suffix.count("[") == 1 and key_suffix.endswith("]"):
                    removed[literal_eval(key_suffix[1:-1])] = value[1]
        return removed

    def _has_differences(self, path_prefix: str) -> bool:
        """Check if a path prefix has any differences under it."""
        return any(diff_path.startswith(path_prefix + "[") for diff_path in self.diff_paths)

    def _colorize_json(self, obj: Any, path: str = 'root', indent: int = 0) -> str:
        """Recursively colorize JSON based on differences, with pretty-printing."""
        INDENT = '  '
        current_indent = INDENT * indent
        next_indent = INDENT * (indent + 1)

        if path in self.diff_paths and path not in self._colorize_skip_paths:
            diff_type, old, new = self.diff_paths[path]
            if diff_type == 'changed':
                return f"{RED}{self._format_value(old)}{RESET} -> {GREEN}{self._format_value(new)}{RESET}"
            elif diff_type == 'added':
                return f"{GREEN}{self._format_value(new)}{RESET}"
            elif diff_type == 'removed':
                return f"{RED}{self._format_value(old)}{RESET}"

        if isinstance(obj, (dict, list)) and self.compact and not self._has_differences(path):
            return '{...}' if isinstance(obj, dict) else '[...]'

        if isinstance(obj, dict):
            if not obj:
                return '{}'
            items = []
            for key, value in obj.items():
                new_path = f"{path}['{key}']" if isinstance(key, str) else f"{path}[{key}]"
                if new_path in self.diff_paths and self.diff_paths[new_path][0] == 'added':
                    # Colorize both key and value for added fields
                    items.append(f'{next_indent}{GREEN}"{key}": {self._colorize_json(value, new_path, indent + 1)}{RESET}')
                else:
                    items.append(f'{next_indent}"{key}": {self._colorize_json(value, new_path, indent + 1)}')
            for key, value in self._get_path_removed(path).items():
                new_path = f"{path}['{key}']" if isinstance(key, str) else f"{path}[{key}]"
                items.append(f'{next_indent}{RED}"{key}": {self._colorize_json(value, new_path, indent + 1)}{RESET}')
            return '{\n' + ',\n'.join(items) + f'\n{current_indent}' + '}'

        elif isinstance(obj, (list, tuple)):
            if not obj:
                return '[]'
            removed_map = self._get_path_removed(path)
            for index in removed_map:
                self._colorize_skip_paths.add(f"{path}[{index}]")

            items = []
            remove_index = 0
            for index, value in enumerate(obj):
                while remove_index == next(iter(removed_map), None):
                    items.append(f'{next_indent}{RED}{self._format_value(removed_map.pop(remove_index))}{RESET}')
                    remove_index += 1
                items.append(f'{next_indent}{self._colorize_json(value, f"{path}[{index}]", indent + 1)}')
                remove_index += 1
            for value in removed_map.values():
                items.append(f'{next_indent}{RED}{self._format_value(value)}{RESET}')
            return '[\n' + ',\n'.join(items) + f'\n{current_indent}' + ']'
        else:
            return self._format_value(obj)

    def __str__(self) -> str:
        """Return the colorized, pretty-printed JSON string."""
        self._colorize_skip_paths = set()
        return self._colorize_json(self.t2)

    def __iter__(self):
        """Make the view iterable by yielding the tree results."""
        yield from self.tree.items()
