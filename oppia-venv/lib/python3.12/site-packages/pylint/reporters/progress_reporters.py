# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt


class ProgressReporter:
    """Progress reporter."""

    def __init__(self, is_verbose: bool = True) -> None:
        self._is_verbose = is_verbose
        self._ast_count = 0
        self._lint_counter = 0

    def start_get_asts(self) -> None:
        self._print_message("Get ASTs.")

    def get_ast_for_file(self, filename: str) -> None:
        self._ast_count += 1
        self._print_message(f"AST for {filename}")

    def start_linting(self) -> None:
        self._print_message(f"Linting {self._ast_count} modules.")

    def lint_file(self, filename: str) -> None:
        self._lint_counter += 1
        self._print_message(f"{filename} ({self._lint_counter} of {self._ast_count})")

    def _print_message(self, msg: str) -> None:
        """Display progress message."""
        if self._is_verbose:
            print(msg, flush=True)
