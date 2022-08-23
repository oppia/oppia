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

"""Deletes temporary and installed files."""

from __future__ import annotations

import argparse
import os
import shutil
from typing import Optional, Sequence

CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, '..', 'oppia_tools')

_PARSER = argparse.ArgumentParser(
    description="""
Deletes temporary and installed files.
""")


def delete_directory_tree(directory_path: str) -> None:
    """Recursively delete an existing directory tree. Does not do anything if
    directory does not exists.

    Args:
        directory_path: str. Directory path to be deleted.
    """
    if not os.path.exists(directory_path):
        return
    shutil.rmtree(directory_path)


def delete_file(filepath: str) -> None:
    """Delete an existing file. Does not do anything if file does not exists.

    Args:
        filepath: str. Filepath to be deleted.
    """
    if not os.path.isfile(filepath):
        return
    os.remove(filepath)


def main(args: Optional[Sequence[str]] = None) -> None:
    """Runs the script to clean temporary and installed files."""
    unused_parsed_args = _PARSER.parse_args(args=args)

    delete_directory_tree(OPPIA_TOOLS_DIR)
    delete_directory_tree('node_modules/')
    delete_directory_tree('third_party/')
    delete_directory_tree('build/')
    delete_directory_tree('backend_prod_files/')
    delete_file('.coverage')
    delete_directory_tree('local_compiled_js/')
    delete_directory_tree('local_compiled_js_for_test/')
    delete_directory_tree('readme_test_dir/')
    delete_file('tsc_output_log.txt')
    delete_file('dev_output.txt')
    delete_file('.viminfo')

    for filename in os.listdir(CURR_DIR):
        if filename.startswith('tmpcompiledjs'):
            delete_directory_tree(filename)

    print('Temporary and installed files deleted')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
