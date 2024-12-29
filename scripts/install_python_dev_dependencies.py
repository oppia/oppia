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
    """Raise an error if we are not in a virtual environment or on CI.

    We want developers to use a virtual environment when developing locally so
    that our scripts don't change their global Python environments. On CI
    however, it's okay to change the global environment since the checks are
    running in an ephemeral virtual machine. Therefore, a "suitable" Python
    environment is one that either is on CI or is a virtual environment.
    """
    if 'GITHUB_ACTION' in os.environ:
        # The GITHUB_ACTION environment variable indicates we are running on
        # GitHub Actions according to
        # https://docs.github.com/en/actions/learn-github-actions/environment-variables.
        return
    # There are two signals that a virtual environment is active:
    # * When sys.prefix != sys.base_prefix
    # * When sys.real_prefix exists
    # If either is true, we are in a virtual environment. We also check that
    # sys.real_prefix is Truthy to make testing easier.
    if (
        sys.prefix == sys.base_prefix
        and not (hasattr(sys, 'real_prefix') and getattr(sys, 'real_prefix'))
    ):
        raise AssertionError(
            'Oppia must be developed within a virtual environment.')


def install_installation_tools() -> None:
    """Install the minimal tooling needed to install dependencies."""
    for package, version in INSTALLATION_TOOL_VERSIONS.items():
        # We run pip as a subprocess because importing from the pip
        # module is not supported:
        # https://pip.pypa.io/en/stable/user_guide/#using-pip-from-your-program.
        proc_pip_install = subprocess.Popen(
            [sys.executable, '-m', 'pip', 'install', f'{package}=={version}'],
            stdout=subprocess.PIPE)

        # We suppress the "Requirement already satisfied" warning since it
        # clutters the output.
        proc_filter_output = subprocess.Popen(
            ['grep', '-v', 'Requirement already satisfied'],
            stdin=proc_pip_install.stdout,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if proc_pip_install.stdout is not None:
            proc_pip_install.stdout.close()

        out, err = proc_filter_output.communicate()
        if out:
            print(out.splitlines())
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
    """Compile a requirements.txt file.

    Args:
        requirements_path: str. Path to the requirements.in file.
        compiled_path: str. Path to the requirements.txt file.

    Returns:
        bool. Whether the compiled dev requirements file was changed.
    """
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


# This code cannot be covered by tests since it only runs when this file
# is executed as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
