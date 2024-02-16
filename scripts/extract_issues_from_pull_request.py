# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Extracts github issues from a pull request."""

from __future__ import annotations

import argparse
import re

ISSUE_REGEX = re.compile(r'Fixes\s+#(\d+)', re.IGNORECASE)

_PARSER = argparse.ArgumentParser(
    description="""
Extracts github issues from a pull request.
""")

_PARSER.add_argument(
    '--repository_path', type=str,
    help='The main repository path.')

_PARSER.add_argument(
    '--pull_request_file', type=str,
    help='The file where the pull request content is stored.')


def main() -> None:
    """Extracts github issues from a pull request."""

    parsed_args = _PARSER.parse_args()
    repository_path = f'{parsed_args.repository_path}/'
    issue_list_file = open(
        repository_path + 'issue_list.txt', 'w+', encoding='utf-8')

    with open(parsed_args.pull_request_file, 'r', encoding='utf-8') as file:
        for line in file:
            match = ISSUE_REGEX.search(line)
            if match:
                issue_list_file.write(f'{match.group(1)}\n')
    issue_list_file.close()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
