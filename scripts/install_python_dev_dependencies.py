# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Install Python development dependencies."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys

from typing import List, Optional


INSTALLATION_TOOL_VERSIONS = {
    'pip': '22.1.1',
    'pip-tools': '6.6.2',
    'setuptools': '58.5.3',
}
REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.in'
COMPILED_REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.txt'

_PARSER = argparse.ArgumentParser(
    'Install Python development dependencies')
_PARSER.add_argument(
    '--assert_compiled', action='store_true',
    help='Assert that the dev requirements file is already compiled.')


def assert_in_venv() -> None:
    """Raise an error if we are not in a virtual environment.

    No error is raised if we are running on GitHub Actions because a
    virtual environment is unnecessary there.
    """
    if 'GITHUB_ACTION' in os.environ:
        return
    if sys.prefix == sys.base_prefix:
        raise AssertionError(
            'Oppia must be developed within a virtual environment.')


def install_installation_tools() -> None:
    """Install the minimal tooling needed to install dependencies."""
    for package, version in INSTALLATION_TOOL_VERSIONS.items():
        # We run pip as a subprocess because importing from the pip
        # module is not supported:
        # https://pip.pypa.io/en/stable/user_guide/#using-pip-from-your-program.
        subprocess.run(
            [sys.executable, '-m', 'pip', 'install', f'{package}=={version}'],
            check=True,
            encoding='utf-8',
        )


def install_dev_dependencies() -> None:
    """Install dev dependencies from
    COMPILED_REQUIREMENTS_DEV_FILE_PATH.
    """
    subprocess.run(
        ['pip-sync', COMPILED_REQUIREMENTS_DEV_FILE_PATH],
        check=True,
        encoding='utf-8',
    )


def compile_dev_dependencies() -> bool:
    """Generate COMPILED_REQUIREMENTS_DEV_FILE_PATH file.

    Returns:
        bool. Whether the compiled dev requirements file was changed.
    """
    with open(
        COMPILED_REQUIREMENTS_DEV_FILE_PATH, 'r', encoding='utf-8'
    ) as f:
        old_compiled = f.read()
    subprocess.run(
        [
            'pip-compile', REQUIREMENTS_DEV_FILE_PATH, '--output-file',
            COMPILED_REQUIREMENTS_DEV_FILE_PATH
        ],
        check=True,
        encoding='utf-8',
    )
    with open(
        COMPILED_REQUIREMENTS_DEV_FILE_PATH, 'r', encoding='utf-8'
    ) as f:
        new_compiled = f.read()

    return old_compiled != new_compiled


def main(cli_args: Optional[List[str]] = None) -> None:
    """Install all dev dependencies."""
    args = _PARSER.parse_args(cli_args)
    assert_in_venv()
    install_installation_tools()
    not_compiled = compile_dev_dependencies()
    install_dev_dependencies()
    if args.assert_compiled and not_compiled:
        raise RuntimeError(
            'The Python development requirements file '
            f'{COMPILED_REQUIREMENTS_DEV_FILE_PATH} was changed by the '
            'installation script. Please commit the changes. '
            'You can get the changes again by running this command: '
            'python -m scripts.install_python_dev_dependencies')


# This code cannot be covered by tests since it only runs when this file
# is executed as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
