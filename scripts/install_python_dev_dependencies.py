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
import difflib
import hashlib
import json
import os
import subprocess
import sys

from typing import Dict, List, Optional

INSTALLATION_TOOL_VERSIONS = {
    'pip': '25.3',
    'pip-tools': '7.5.2',
    'setuptools': '80.9.0',
}
REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.in'
COMPILED_REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.txt'
PIP_REQUIREMENTS_CHECKSUMS_FILE_PATH = 'pip_requirements_checksums.json'

_PARSER = argparse.ArgumentParser('Install Python development dependencies')
_PARSER.add_argument(
    '--assert_compiled',
    action='store_true',
    help='Assert that the dev requirements file is already compiled.',
)
_PARSER.add_argument(
    '--uninstall', action='store_true', help='Uninstall all dev requirements.'
)


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
    if sys.prefix == sys.base_prefix and not (
        hasattr(sys, 'real_prefix') and getattr(sys, 'real_prefix')
    ):
        raise AssertionError(
            'Oppia must be developed within a virtual environment.'
        )


def install_installation_tools() -> None:
    """Install the minimal tooling needed to install dependencies."""
    for package, version in INSTALLATION_TOOL_VERSIONS.items():
        # We run pip as a subprocess because importing from the pip
        # module is not supported:
        # https://pip.pypa.io/en/stable/user_guide/#using-pip-from-your-program.
        proc_pip_install = subprocess.Popen(
            [sys.executable, '-m', 'pip', 'install', f'{package}=={version}'],
            stdout=subprocess.PIPE,
        )

        # We suppress the "Requirement already satisfied" warning since it
        # clutters the output.
        proc_filter_output = subprocess.Popen(
            ['grep', '-v', 'Requirement already satisfied'],
            stdin=proc_pip_install.stdout,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

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
        [
            'pip-sync',
            COMPILED_REQUIREMENTS_DEV_FILE_PATH,
            '--pip-args',
            '--require-hashes --no-deps',
        ],
        check=True,
        encoding='utf-8',
    )


def _get_file_checksum(file_path: str) -> str:
    """Returns the SHA256 checksum of the given file.

    Args:
        file_path: str. Path to the file whose checksum should be calculated.

    Returns:
        str. The SHA256 checksum of the file.
    """
    hash_obj = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()


def _read_pip_requirements_checksums() -> Dict[str, str]:
    """Reads the cached requirements file checksums."""
    if not os.path.exists(PIP_REQUIREMENTS_CHECKSUMS_FILE_PATH):
        return {}

    try:
        with open(
            PIP_REQUIREMENTS_CHECKSUMS_FILE_PATH, 'r', encoding='utf-8'
        ) as f:
            checksum_dict = json.load(f)
    except json.JSONDecodeError:
        return {}

    if not isinstance(checksum_dict, dict):
        return {}

    return {
        str(requirements_path): str(checksum)
        for requirements_path, checksum in checksum_dict.items()
    }


def _write_pip_requirements_checksums(checksum_dict: Dict[str, str]) -> None:
    """Writes the cached requirements file checksums."""
    with open(PIP_REQUIREMENTS_CHECKSUMS_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(checksum_dict, f, indent=2, sort_keys=True)
        f.write('\n')


def should_skip_dependency_install(
    requirements_path: str, compiled_path: str
) -> bool:
    """Checks whether dependency installation can be skipped.

    Dependency installation is skipped only after a previous successful
    installation recorded a checksum matching the current requirements input
    file.

    Args:
        requirements_path: str. Path to the requirements input file.
        compiled_path: str. Path to the compiled requirements file.

    Returns:
        bool. Whether dependency installation can be skipped.
    """
    if not os.path.exists(compiled_path):
        return False

    checksum_dict = _read_pip_requirements_checksums()
    return checksum_dict.get(requirements_path) == _get_file_checksum(
        requirements_path
    )


def update_pip_requirements_checksum(requirements_path: str) -> None:
    """Updates the cached checksum for a requirements input file."""
    checksum_dict = _read_pip_requirements_checksums()
    checksum_dict[requirements_path] = _get_file_checksum(requirements_path)
    _write_pip_requirements_checksums(checksum_dict)


def remove_pip_requirements_checksum(requirements_path: str) -> None:
    """Removes the cached checksum for a requirements input file."""
    checksum_dict = _read_pip_requirements_checksums()
    if requirements_path not in checksum_dict:
        return

    del checksum_dict[requirements_path]
    _write_pip_requirements_checksums(checksum_dict)


def uninstall_dev_dependencies() -> None:
    """Uninstall dev dependencies from COMPILED_REQUIREMENTS_DEV_FILE_PATH."""
    subprocess.run(
        ['pip', 'uninstall', '-r', COMPILED_REQUIREMENTS_DEV_FILE_PATH, '-y'],
        check=True,
        encoding='utf-8',
    )


def compile_pip_requirements(requirements_path: str, compiled_path: str) -> str:
    """Compile a requirements.txt file.

    Args:
        requirements_path: str. Path to the requirements.in file.
        compiled_path: str. Path to the requirements.txt file.

    Returns:
        str. The diff between the original and compiled requirements files, as
        a string containing newlines.
    """
    with open(compiled_path, 'r', encoding='utf-8') as f:
        old_compiled = list(f.readlines())
    # Warning: In some CI environments, running this command seems to add
    # --cert=None --client-cert=None --pip-args=None flags to the pip-compile
    # command referenced at the start of the compiled requirements file. It is
    # not clear why this happens, since these args are not explicitly being
    # passed here. We account for that later below when computing the diff.
    subprocess.run(
        [
            'pip-compile',
            '--no-emit-index-url',
            '--quiet',
            '--strip-extras',
            '--generate-hashes',
            requirements_path,
            '--output-file',
            compiled_path,
        ],
        check=True,
        encoding='utf-8',
    )
    with open(compiled_path, 'r', encoding='utf-8') as f:
        new_compiled = list(f.readlines())

    # The options to pip-compile sometimes differ on regeneration (e.g.
    # cert=None might be passed), so we skip the pip-compile line and those
    # above it when computing the diff.
    old_pip_compile_line_index = [
        i
        for i, value in enumerate(old_compiled)
        if value.startswith('#    pip-compile')
    ][0]
    new_pip_compile_line_index = [
        i
        for i, value in enumerate(new_compiled)
        if value.startswith('#    pip-compile')
    ][0]
    diff = list(
        difflib.unified_diff(
            old_compiled[old_pip_compile_line_index + 1 :],
            new_compiled[new_pip_compile_line_index + 1 :],
            lineterm='',
        )
    )
    print('Printing diff in %s:' % requirements_path)
    print('--------------------------')
    for line in diff:
        print(line)
    print('--------------------------')

    return '\n'.join(list(diff))


def main(cli_args: Optional[List[str]] = None) -> None:
    """Install all dev dependencies."""
    args = _PARSER.parse_args(cli_args)
    check_python_env_is_suitable()

    if not args.uninstall and should_skip_dependency_install(
        REQUIREMENTS_DEV_FILE_PATH, COMPILED_REQUIREMENTS_DEV_FILE_PATH
    ):
        return

    install_installation_tools()
    diff = compile_pip_requirements(
        REQUIREMENTS_DEV_FILE_PATH, COMPILED_REQUIREMENTS_DEV_FILE_PATH
    )
    if args.uninstall:
        uninstall_dev_dependencies()
        remove_pip_requirements_checksum(REQUIREMENTS_DEV_FILE_PATH)
    else:
        install_dev_dependencies()
        if args.assert_compiled and diff:
            raise RuntimeError(
                'The Python development requirements file '
                f'{COMPILED_REQUIREMENTS_DEV_FILE_PATH} was changed by the '
                'installation script. See diff:\n%s\n\n. Please commit the '
                'changes. You can get the changes again by running this '
                'command: python -m scripts.install_python_dev_dependencies'
                % diff
            )
        update_pip_requirements_checksum(REQUIREMENTS_DEV_FILE_PATH)


# This code cannot be covered by tests since it only runs when this file
# is executed as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
