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

import os
import subprocess
import sys


INSTALLATION_TOOL_VERSIONS = {
    'pip': '22.1.1',
    'pip-tools': '6.6.2',
    'setuptools': '58.5.3',
}
REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.in'
COMPILED_REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.txt'


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
            [
                sys.executable, '-m', 'pip', 'install',
                f'{package}=={version}'
            ],
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


def compile_dev_dependencies() -> None:
    """Generate COMPILED_REQUIREMENTS_DEV_FILE_PATH file."""
    subprocess.run(
        [
            'pip-compile', REQUIREMENTS_DEV_FILE_PATH, '--output-file',
            COMPILED_REQUIREMENTS_DEV_FILE_PATH
        ],
        check=True,
        encoding='utf-8',
    )


def main() -> None:
    """Install all dev dependencies."""
    assert_in_venv()
    install_installation_tools()
    compile_dev_dependencies()
    install_dev_dependencies()
