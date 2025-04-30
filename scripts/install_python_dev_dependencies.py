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
    'pip': '24.3.1',
    'pip-tools': '7.4.1',
    'setuptools': '75.6.0',
}
REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.in'
COMPILED_REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.txt'

_PARSER = argparse.ArgumentParser(
    'Install Python development dependencies')
_PARSER.add_argument(
    '--assert_compiled', action='store_true',
    help='Assert that the dev requirements file is already compiled.')
_PARSER.add_argument(
    '--uninstall', action='store_true',
    help='Uninstall all dev requirements.')


def check_python_env_is_suitable() -> None:
    """Raise an error if we are not in a virtual environment or on CI."""
    if 'GITHUB_ACTION' in os.environ:
        return
    if (
        sys.prefix == sys.base_prefix
        and not (hasattr(sys, 'real_prefix') and getattr(sys, 'real_prefix'))
    ):
        raise AssertionError(
            'Oppia must be developed within a virtual environment.')


def install_installation_tools() -> None:
    """Install the minimal tooling needed to install dependencies."""
    # Forcefully set pip version first to avoid warnings or auto-upgrades
    subprocess.run([
        sys.executable, '-m', 'pip', 'install',
        f'pip=={INSTALLATION_TOOL_VERSIONS["pip"]}', '--disable-pip-version-check'
    ], check=True)

    # Show the actual pip version being used
    subprocess.run([sys.executable, '-m', 'pip', '--version'], check=True)

    # Install remaining tools
    for package, version in INSTALLATION_TOOL_VERSIONS.items():
        if package == "pip":
            continue
        proc_pip_install = subprocess.Popen(
            [sys.executable, '-m', 'pip', 'install', f'{package}=={version}'],
            stdout=subprocess.PIPE
        )
        proc_filter_output = subprocess.Popen(
            ['grep', '-v', 'Requirement already satisfied'],
            stdin=proc_pip_install.stdout,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        if proc_pip_install.stdout is not None:
            proc_pip_install.stdout.close()

        out, err = proc_filter_output.communicate()
        if out:
            print(out.decode().splitlines())
        if err:
            print('ERRORS: {0}'.format(str(err)))


def install_dev_dependencies() -> None:
    """Install dev dependencies from COMPILED_REQUIREMENTS_DEV_FILE_PATH."""
    subprocess.run(
        ['pip-sync', COMPILED_REQUIREMENTS_DEV_FILE_PATH, '--pip-args',
         '--require-hashes --no-deps'],
        check=True,
        encoding='utf-8',
    )


def uninstall_dev_dependencies() -> None:
    """Uninstall dev dependencies from COMPILED_REQUIREMENTS_DEV_FILE_PATH."""
    subprocess.run(
        ['pip', 'uninstall', '-r', COMPILED_REQUIREMENTS_DEV_FILE_PATH, '-y'],
        check=True,
        encoding='utf-8',
    )


def compile_pip_requirements(
    requirements_path: str, compiled_path: str
) -> bool:
    """Compile a requirements.txt file."""
    with open(compiled_path, 'r', encoding='utf-8') as f:
        old_compiled = f.read()
    subprocess.run(
        [
            'pip-compile', '--no-emit-index-url', '--quiet',
            '--strip-extras', '--generate-hashes', requirements_path,
            '--output-file', compiled_path,
        ],
        check=True,
        encoding='utf-8',
    )
    with open(compiled_path, 'r', encoding='utf-8') as f:
        new_compiled = f.read()
    return old_compiled != new_compiled


def main(cli_args: Optional[List[str]] = None) -> None:
    """Install all dev dependencies."""
    args = _PARSER.parse_args(cli_args)
    check_python_env_is_suitable()
    install_installation_tools()
    not_compiled = compile_pip_requirements(
        REQUIREMENTS_DEV_FILE_PATH, COMPILED_REQUIREMENTS_DEV_FILE_PATH)
    if args.uninstall:
        uninstall_dev_dependencies()
    else:
        install_dev_dependencies()
        if args.assert_compiled and not_compiled:
            raise RuntimeError(
                'The Python development requirements file '
                f'{COMPILED_REQUIREMENTS_DEV_FILE_PATH} was changed by the '
                'installation script. Please commit the changes. '
                'You can get the changes again by running this command: '
                'python -m scripts.install_python_dev_dependencies')


if __name__ == '__main__':  # pragma: no cover
    main()
