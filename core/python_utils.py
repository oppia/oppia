# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Feature detection utilities for Python 2 and Python 3."""

from __future__ import annotations

import io
import os
import pkgutil
import sys

_THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party', 'python_libs')
sys.path.insert(0, _THIRD_PARTY_PATH)

_CERTIFI_PATH = os.path.join(
    os.getcwd(), '..', 'oppia_tools', 'certifi-2021.10.8')
sys.path.insert(0, _CERTIFI_PATH)


def get_package_file_contents(package: str, filepath: str) -> str:
    """Open file and return its contents. This needs to be used for files that
    are loaded by the Python code directly, like constants.ts or
    rich_text_components.json. This function is needed to make loading these
    files work even when Oppia is packaged.

    Args:
        package: str. The package where the file is located.
            For Oppia the package is usually the folder in the root folder,
            like 'core' or 'extensions'.
        filepath: str. The path to the file in the package.

    Returns:
        str. The contents of the file.
    """
    try:
        file = io.open(os.path.join(package, filepath), 'r', encoding='utf-8')
        return file.read()
    except FileNotFoundError:
        return pkgutil.get_data(package, filepath).decode('utf-8')
