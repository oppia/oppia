#!/bin/bash
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Adds __init__ file in every dir of google module if not found."""

from __future__ import annotations

import os
from core import utils


def main() -> None:
    """Adds __init__ file in every dir of google module if not found."""

    google_module_path = '/app/oppia/third_party/python_libs/google'

    for path_list in os.walk(google_module_path):
        root_path = path_list[0]
        if not root_path.endswith('__pycache__'):
            with utils.open_file(
                os.path.join(root_path, '__init__.py'), 'a'):
                # If the file doesn't exist, it is created. If it does exist,
                # this open does nothing.
                pass


if __name__ == '__main__':
    main()
