# Copyright 2023 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Utility functions for scripts/start.py and scripts/common.py.
This module should NOT import any other Oppia modules to avoid circular dependencies.
"""

from __future__ import annotations

import contextlib
import importlib
import socket
import sys
from typing import Any, List, Sequence


def is_port_in_use(port: int) -> bool:
    """Checks if a process is listening to the port.

    Args:
        port: int. The port number.

    Returns:
        bool. True if port is open else False.
    """
    with contextlib.closing(
        socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    ) as s:
        return bool(not s.connect_ex(('localhost', port)))


def print_each_string_after_two_new_lines(strings: Sequence[str]) -> None:
    """Prints the given strings, separating adjacent strings with two newlines.

    Args:
        strings: list(str). The strings to print.
    """
    for string in strings:
        print('%s\n' % string)


def lazy_import(name: str) -> Any:
    """Lazily imports a module.

    Args:
        name: str. The name of the module to import.

    Returns:
        module. The imported module.
        
    Raises:
        ModuleNotFoundError: If the module is not found, with instructions
            on how to fix it.
    """
    try:
        return importlib.import_module(name)
    except ModuleNotFoundError as e:
        raise ModuleNotFoundError(
            f"Missing dependency '{name}'. Fix: activate your dev venv and "
            f"run 'pip install -r requirements.txt'."
        ) from e
