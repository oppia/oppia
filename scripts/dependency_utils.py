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

"""Utility for caching and validating Python dependency installations."""

from __future__ import annotations

import hashlib
import json
import os
import platform
import sys

from scripts import common, install_python_dev_dependencies

from typing import Optional

# Define where the cache manifest lives (ignored by git).
MANIFEST_PATH = os.path.join(os.getcwd(), 'pip_requirements_checksums.json')
REQUIREMENTS_FILES = [
    common.REQUIREMENTS_FILE_PATH,
    install_python_dev_dependencies.REQUIREMENTS_DEV_FILE_PATH,
    common.COMPILED_REQUIREMENTS_FILE_PATH,
    install_python_dev_dependencies.COMPILED_REQUIREMENTS_DEV_FILE_PATH,
]


class DependencyGatekeeper:
    """Determines whether Python dependency installation can be skipped."""

    def __init__(self, python_libs_dir: str) -> None:
        self.python_libs_dir = python_libs_dir
        self._cached_fingerprint: Optional[str] = None

    def _get_env_metadata(self) -> str:
        """Captures Python version and OS to prevent cross-env drift."""
        return f'{sys.version}_{platform.platform()}_{sys.executable}'

    def calculate_current_fingerprint(self) -> Optional[str]:
        """Generates a SHA256 hash of files and environment metadata."""
        if self._cached_fingerprint is not None:
            return self._cached_fingerprint

        sha256 = hashlib.sha256()

        for file_name in REQUIREMENTS_FILES:
            try:
                with open(file_name, 'rb') as f:
                    sha256.update(f.read())
            except FileNotFoundError:
                return None

        sha256.update(self._get_env_metadata().encode('utf-8'))
        self._cached_fingerprint = sha256.hexdigest()
        return self._cached_fingerprint

    def is_install_required(self) -> bool:
        """Returns True if we MUST run pip install, False if we can skip."""
        if not os.path.exists(self.python_libs_dir):
            return True

        current_hash = self.calculate_current_fingerprint()
        try:
            with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                cached_checksum: Optional[str] = cached_data.get('checksum')
                return cached_checksum != current_hash
        except (json.JSONDecodeError, IOError):
            # If JSON is corrupt, assume we need an install.
            return True

    def record_success(self) -> None:
        """Updates the local JSON with the new fingerprint."""
        new_hash = self.calculate_current_fingerprint()
        if new_hash:
            with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
                json.dump({'checksum': new_hash}, f, indent=2)
            print(f'Dependency manifest updated: {MANIFEST_PATH}')
