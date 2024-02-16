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

"""Checks if the new todo comment is a duplicate of the latest comment."""

from __future__ import annotations

import argparse

from typing import List, Optional

COMMIT_SHA_HASH_LENGTH = 40

_PARSER = argparse.ArgumentParser(
    description="""
Checks if the new todo comment is a duplicate of the latest comment.
""")

_PARSER.add_argument(
    '--repository_path', type=str,
    help='The path to the repository to check for todos.')

_PARSER.add_argument(
    '--latest_comment_file', type=str,
    help='The latest comment.')

_PARSER.add_argument(
    '--new_comment_file', type=str,
    help='The new comment.')


def main(args: Optional[List[str]] = None) -> None:
    """Checks if the new todo comment is a duplicate of the latest comment."""

    parsed_args = _PARSER.parse_args(args)

    repository_path = f'{parsed_args.repository_path}/'
    github_perma_link_url = 'https://github.com/oppia/oppia/blob/'
    compare_start_index = len(github_perma_link_url) + COMMIT_SHA_HASH_LENGTH

    latest_comment: List[str] = []
    new_comment: List[str] = []
    with open(
        repository_path + parsed_args.latest_comment_file, 'r',
        encoding='utf-8'
    ) as latest_comment_file:
        latest_comment_lines = latest_comment_file.read().strip().split('\n')
        latest_comment = [line.strip() for line in latest_comment_lines]

    with open(
        repository_path + parsed_args.new_comment_file, 'r',
        encoding='utf-8'
    ) as new_comment_file:
        new_comment_lines = new_comment_file.read().strip().split('\n')
        new_comment = [line.strip() for line in new_comment_lines]

    if (
        len(latest_comment) != len(new_comment) or
        latest_comment[0] != new_comment[0]
    ):
        raise Exception('New todo comment should be posted.')

    for index in range(1, len(latest_comment)):
        latest_comment_line_content = (
            latest_comment[index][compare_start_index:])
        new_comment_line_content = new_comment[index][compare_start_index:]
        if latest_comment_line_content != new_comment_line_content:
            raise Exception('New todo comment should be posted.')

    print('The latest comment is the same as the new todo comment.')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
