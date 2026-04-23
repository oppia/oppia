# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Utility functions for caching pip requirements checksums.

This module speeds up backend test runs and dev server startup by skipping
Python package installation when the requirements files have not changed since
the last successful install. It works by hashing the contents of
requirements.in and requirements_dev.in, storing the result in a local JSON
file (pip_requirements_checksums.json) that is git-ignored, and comparing
the stored hash against the current hash before each install.

If the hashes match, installation is skipped. If they differ (or no cached
hash exists), installation proceeds and the new hash is written on success.
"""

from __future__ import annotations

import hashlib
import json
import os

from typing import Optional

# Path (relative to the repo root) where checksums are persisted locally.
# This file is git-ignored so each developer's cache is independent.
CHECKSUMS_FILEPATH = 'pip_requirements_checksums.json'

# The requirements source files whose combined hash determines whether
# a re-install is needed.
REQUIREMENTS_IN_FILEPATH = 'requirements.in'
REQUIREMENTS_DEV_IN_FILEPATH = 'requirements_dev.in'


def _hash_file_contents(filepath: str) -> str:
    """Returns the SHA-256 hex digest of the given file's contents.

    Args:
        filepath: str. Path to the file to hash.

    Returns:
        str. Lowercase hex-encoded SHA-256 digest.

    Raises:
        IOError: If the file cannot be read.
    """
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def compute_requirements_hash(
    requirements_in_path: str = REQUIREMENTS_IN_FILEPATH,
    requirements_dev_in_path: str = REQUIREMENTS_DEV_IN_FILEPATH,
) -> str:
    """Computes a combined SHA-256 hash over both requirements source files.

    Concatenating the individual digests (with a separator) and re-hashing
    ensures a single canonical fingerprint for the pair, regardless of order.

    Args:
        requirements_in_path: str. Path to requirements.in.
        requirements_dev_in_path: str. Path to requirements_dev.in.

    Returns:
        str. Hex-encoded SHA-256 digest of the combined file contents.
    """
    hash_prod = _hash_file_contents(requirements_in_path)
    hash_dev = _hash_file_contents(requirements_dev_in_path)
    combined = f'{hash_prod}:{hash_dev}'.encode('utf-8')
    return hashlib.sha256(combined).hexdigest()


def load_stored_hash(checksums_path: str = CHECKSUMS_FILEPATH) -> Optional[str]:
    """Loads the previously stored requirements hash from disk.

    Args:
        checksums_path: str. Path to the JSON checksums file.

    Returns:
        str|None. The stored hash string, or None if the file does not exist
        or cannot be parsed.
    """
    if not os.path.isfile(checksums_path):
        return None
    try:
        with open(checksums_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        stored = data.get('requirements_hash')
        return stored if isinstance(stored, str) else None
    except (json.JSONDecodeError, OSError):
        return None


def save_hash(
    requirements_hash: str, checksums_path: str = CHECKSUMS_FILEPATH
) -> None:
    """Persists the given requirements hash to the checksums file.

    Args:
        requirements_hash: str. The hash to persist.
        checksums_path: str. Path to the JSON checksums file.
    """
    data = {'requirements_hash': requirements_hash}
    with open(checksums_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def installation_is_current(
    requirements_in_path: str = REQUIREMENTS_IN_FILEPATH,
    requirements_dev_in_path: str = REQUIREMENTS_DEV_IN_FILEPATH,
    checksums_path: str = CHECKSUMS_FILEPATH,
) -> bool:
    """Returns True if the installed packages are up-to-date.

    Compares the hash of the current requirements source files against the
    hash stored from the last successful installation.  Returns False (meaning
    re-installation is required) in any of the following cases:

    * No checksums file exists yet (first run).
    * The checksums file is malformed or unreadable.
    * Either requirements source file is missing.
    * The computed hash differs from the stored hash.

    Args:
        requirements_in_path: str. Path to requirements.in.
        requirements_dev_in_path: str. Path to requirements_dev.in.
        checksums_path: str. Path to the JSON checksums file.

    Returns:
        bool. True iff the stored hash matches the current hash of both
        requirements source files.
    """
    stored = load_stored_hash(checksums_path)
    if stored is None:
        return False
    try:
        current = compute_requirements_hash(
            requirements_in_path, requirements_dev_in_path
        )
    except OSError:
        return False
    return stored == current
