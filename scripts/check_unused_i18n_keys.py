# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Script to detect unused i18n keys in the codebase."""

from __future__ import annotations

import fnmatch
import json
import logging
import os
import re
import sys

from typing import List, Set

# Files and extensions to search for keys.
CODE_FILE_EXTENSIONS = ('.ts', '.html', '.py', '.js')
EN_JSON_PATH = os.path.join('assets', 'i18n', 'en.json')
ALLOWLIST_PATH = os.path.join(
    'scripts', 'linters', 'i18n_unused_keys_allowlist.json'
)


def get_all_code_tokens() -> Set[str]:
    """Extracts all alphanumeric tokens from the codebase.

    Returns:
        set(str). All literal string tokens found in code files.
    """
    token_pattern = re.compile(r'[A-Za-z0-9_&/-]+')
    tokens: Set[str] = set()

    for root, _, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root or 'third_party' in root:
            continue
        for file in files:
            if not file.endswith(CODE_FILE_EXTENSIONS):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    tokens.update(token_pattern.findall(content))
            except Exception as e:
                logging.error('Error reading %s: %s' % (path, e))

    return tokens


def check_unused_keys() -> bool:
    """Checks for unused I18N keys across the codebase.

    Returns:
        bool. True if unused keys are found, False otherwise.

    Raises:
        Exception. The en.json file does not exist.
    """
    if not os.path.exists(EN_JSON_PATH):
        raise Exception('File %s does not exist.' % EN_JSON_PATH)

    with open(EN_JSON_PATH, 'r', encoding='utf-8') as f:
        en_json = json.load(f)

    all_keys = set(en_json.keys())

    with open(ALLOWLIST_PATH, 'r', encoding='utf-8') as f:
        allowlist = json.load(f)
    allowlist_patterns = [item['pattern'] for item in allowlist['patterns']]

    code_tokens = get_all_code_tokens()

    unused_keys: List[str] = []
    for key in sorted(all_keys):
        # Ignore keys matched by our allowlist.
        if any(fnmatch.fnmatch(key, pattern) for pattern in allowlist_patterns):
            continue

        # Check if key literally exists in code.
        if key not in code_tokens:
            unused_keys.append(key)

    if unused_keys:
        print('-------------------------------------------')
        print('Unused I18N Keys check failed.')
        print('-------------------------------------------')
        print(
            'The following %d I18N keys were found in en.json '
            'but appear to be entirely unused in the codebase:'
            % len(unused_keys)
        )
        for key in unused_keys:
            print('  - %s' % key)

        print('\nTo fix this:')
        print(
            ' (a) If the key is truly unused, delete it from all JSON '
            'files in assets/i18n/.'
        )
        print(
            ' (b) If the key is dynamically constructed in code (e.g., '
            'I18N_TOPIC_{id}_TITLE), please add a glob pattern to '
            'the allowlist here: %s.' % ALLOWLIST_PATH
        )
        return True

    print('-------------------------------------------')
    print('Unused I18N Keys check passed.')
    print('-------------------------------------------')
    return False


def main() -> None:
    """Runs the script."""
    has_errors = check_unused_keys()
    if has_errors:
        sys.exit(1)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_unused_i18n_keys.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
