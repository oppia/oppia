# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Installation script for Oppia python backend libraries."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import os
import shutil
import subprocess

import python_utils
from scripts import common

import pkg_resources


def _get_requirements_file_contents():
    """Returns a dictionary containing all of the required library names with
    their corresponding version strings listed in the 'requirements.txt' file.

    Returns:
        dict(string, string). Dictionary with the name of the library as the key
        and the version string of that library as the value.
    """
    requirements_contents = collections.defaultdict()
    with python_utils.open_file(
        common.COMPILED_REQUIREMENTS_FILE_PATH, 'r') as f:
        lines = f.readlines()
        for l in lines:
            l = l.strip()
            if l.startswith('#') or len(l) == 0:
                continue
            library_name_and_version_string = l.split(' ')[0].split('==')
            # Libraries are not distinguished by case so in order to make sure
            # the same libraries have the same library name for easy comparison,
            # all library names are changed to lowercase.
            library_name = library_name_and_version_string[0].lower()
            version_string = library_name_and_version_string[1]
            requirements_contents[library_name] = version_string
    return requirements_contents


def _get_third_party_python_libs_directory_contents():
    """Returns a dictionary representing all of the libraries with their
    corresponding versions installed in the 'third_party/python_libs' directory.

    Returns:
        dict(string, string). Dictionary with the name of the library installed
        as the key and the version string of that library as the value.
    """
    installed_packages = [
        (d.project_name, d.version)
        for d in pkg_resources.find_distributions(
            common.THIRD_PARTY_PYTHON_LIBS_DIR)]
    directory_contents = {
        library_name.lower(): version_string
        for library_name, version_string in installed_packages
    }

    return directory_contents


def _remove_metadata(library_name, version_string):
    """Removes the residual metadata files pertaining to a specific library that
    was reinstalled with a new version. The reason we need this function is
    because `pip install --upgrade` upgrades libraries to a new version but
    does not remove the metadata that was installed with the previous version.
    These metadata files confuse the pkg_resources function that extracts all of
    the information about the currently installed python libraries and causes
    this installation script to behave incorrectly.

    Args:
        library_name: str. Name of the library to remove the metadata for.
        version_string: str. Stringified version of the library to remove the
            metadata for.
    """
    possible_file_names = _get_possible_metadata_directory_names(
        library_name, version_string)
    for f in os.listdir(common.THIRD_PARTY_PYTHON_LIBS_DIR):
        if f.lower() in possible_file_names:
            path_to_delete = os.path.join(
                common.THIRD_PARTY_PYTHON_LIBS_DIR, f)
            if os.path.isdir(path_to_delete):
                shutil.rmtree(path_to_delete)


def _rectify_third_party_directory(mismatches):
    """Rectifies the 'third_party/python_libs' directory state to reflect the
    current 'requirements.txt' file requirements. It takes a list of mismatches
    and corrects those mismatches by installing or uninstalling packages.

    Args:
        mismatches: dict(string, tuple(string|None, string|None)). Dictionary
            with the library names as keys and a tuple as values. The 1st
            element of the tuple is the version string of the library required
            by the requirements.txt file while the 2nd element is the version
            string of the library currently installed in the
            'third_party/python_libs' directory. If the library doesn't exist,
            the corresponding tuple element will be None. For example, this
            dictionary signifies that 'requirements.txt' requires flask with
            version 1.0.1 while the 'third_party/python_libs' directory contains
            flask 1.1.1:
                {
                  flask: ('1.0.1', '1.1.1')
                }
    """
    # Handling 5 or more mismatches requires 5 or more individual `pip install`
    # commands, which is slower than just reinstalling all of the libraries
    # using `pip install -r requirements.txt`.
    if len(mismatches) >= 5:
        if os.path.isdir(common.THIRD_PARTY_PYTHON_LIBS_DIR):
            shutil.rmtree(common.THIRD_PARTY_PYTHON_LIBS_DIR)
        _reinstall_all_dependencies()
        return

    for library_name, versions in mismatches.items():
        requirements_version = (
            pkg_resources.parse_version(versions[0]) if versions[0] else None)
        directory_version = (
            pkg_resources.parse_version(versions[1]) if versions[1] else None)

        # The library is installed in the directory but is not listed in
        # requirements.
        # We don't have functionality to remove a library cleanly, and if we
        # ignore the library, This might cause issues when pushing the branch to
        # develop as there are possible hidden use cases of a deleted library
        # that the developer did not catch. The only way to enforce the removal
        # of a library is to clean out the folder and reinstall everything from
        # scratch.
        if not requirements_version:
            if os.path.isdir(common.THIRD_PARTY_PYTHON_LIBS_DIR):
                shutil.rmtree(common.THIRD_PARTY_PYTHON_LIBS_DIR)
            _reinstall_all_dependencies()
            return

        # The library listed in 'requirements.txt' is not in the
        # 'third_party/python_libs' directory.
        if not directory_version:
            _install_library(
                library_name,
                python_utils.convert_to_bytes(requirements_version))
        # The currently installed library version is not equal to the required
        # 'requirements.txt' version.
        elif requirements_version != directory_version:
            _install_library(
                library_name,
                python_utils.convert_to_bytes(requirements_version))
            _remove_metadata(
                library_name, python_utils.convert_to_bytes(directory_version))


def _install_library(library_name, version_string):
    """Installs a library with a certain version to the
    'third_party/python_libs' folder.

    Args:
        library_name: str. Name of the library to install.
        version_string: str. Stringified version of the library to install.
    """
    subprocess.check_call([
        'pip', 'install', '--target',
        common.THIRD_PARTY_PYTHON_LIBS_DIR,
        '--no-dependencies',
        '%s==%s' % (
            library_name,
            version_string),
        '--upgrade'
    ])


def _reinstall_all_dependencies():
    """Reinstalls all of the libraries detailed in the compiled
    'requirements.txt' file to the 'third_party/python_libs' folder.
    """
    subprocess.check_call([
        'pip', 'install', '--target',
        common.THIRD_PARTY_PYTHON_LIBS_DIR,
        '--no-dependencies', '-r',
        common.COMPILED_REQUIREMENTS_FILE_PATH,
        '--upgrade'
    ])


def _get_possible_metadata_directory_names(library_name, version_string):
    """Possible metadata directory names for python libraries installed using
    pip (following the guidelines of PEP-427 and PEP-376).
    This ensures that our _remove_metadata() function works as intended. More
    details about the guidelines concerning the metadata folders can be found
    here:
    https://www.python.org/dev/peps/pep-0427/#file-contents
    https://www.python.org/dev/peps/pep-0376/#how-distributions-are-installed.

    Args:
        library_name: str. Name of the library.
        version_string: str. Stringified version of the library.

    Returns:
        set(str). Set containing the possible directory name strings of metadata
        folders.
    """
    possible_names = {
        '%s-%s.dist-info' % (library_name, version_string),
        # Some metadata folders replace the hyphens of the library name with
        # underscores.
        '%s-%s.dist-info' % (
            library_name.replace('-', '_'), version_string),
        '%s-%s.egg-info' % (library_name, version_string),
        # Some metadata folders replace the hyphens of the library name with
        # underscores.
        '%s-%s.egg-info' % (
            library_name.replace('-', '_'), version_string),
    }
    return possible_names


def get_mismatches():
    """Returns a dictionary containing mismatches between the 'requirements.txt'
    file and the 'third_party/python_libs' directory. Mismatches are defined as
    the following inconsistencies:
        1. A library exists in the requirements file but is not installed in the
           'third_party/python_libs' directory.
        2. A library is installed in the 'third_party/python_libs'
           directory but it is not listed in the requirements file.
        3. The library version installed is not as recent as the library version
           listed in the requirements file.
        4. The library version installed is more recent than the library version
           listed in the requirements file.

    Returns:
        dict(string, tuple(string|None, string|None)). Dictionary with the
        library names as keys and tuples as values. The 1st element of the
        tuple is the version string of the library required by the
        requirements.txt file while the 2nd element is the version string of
        the library currently in the 'third_party/python_libs' directory. If
        the library doesn't exist, the corresponding tuple element will be None.
        For example, the following dictionary signifies that 'requirements.txt'
        requires flask with version 1.0.1 while the 'third_party/python_libs'
        directory contains flask 1.1.1 (or mismatch 4 above):
            {
              flask: ('1.0.1', '1.1.1')
            }
    """
    requirements_contents = _get_requirements_file_contents()
    directory_contents = _get_third_party_python_libs_directory_contents()

    mismatches = {}
    for library_name in requirements_contents:
        # Library exists in the directory and the requirements file.
        if library_name in directory_contents:
            # Library matches but version doesn't match.
            if (directory_contents[library_name] !=
                    requirements_contents[library_name]):
                mismatches[library_name] = (
                    requirements_contents[library_name],
                    directory_contents[library_name])
        # Library exists in the requirements file but not in the directory.
        else:
            mismatches[library_name] = (
                requirements_contents[library_name], None)

    for library_name in directory_contents:
        # Library exists in the directory but is not in the requirements file.
        if library_name not in requirements_contents:
            mismatches[library_name] = (None, directory_contents[library_name])

    return mismatches


def validate_metadata_directories():
    """Validates that for each installed library in the
    'third_party/python_libs' folder, there exists corresponding metadata
    directories following the correct naming conventions that are detailed by
    the PEP-427 and PEP-376 python guidelines.

    Raises:
        Exception. An installed library's metadata does not exist the
            'third_party/python_libs' directory in the format that we expect
            (following the PEP-427 and PEP-376 python guidelines).
    """
    directory_contents = _get_third_party_python_libs_directory_contents()
    directory_names = set(
        [
            name.lower()
            for name in os.listdir(common.THIRD_PARTY_PYTHON_LIBS_DIR)
        ])
    for library_name, version_string in directory_contents.items():
        # Possible names of the metadata directory installed.
        possible_file_names = _get_possible_metadata_directory_names(
            library_name, version_string)
        has_name_in_directory = False
        for name in possible_file_names:
            if name in directory_names:
                has_name_in_directory = True
                break
        if not has_name_in_directory:
            raise Exception(
                'The python library %s was installed without the correct '
                'metadata folders which may indicate that the convention for '
                'naming the metadata folders have changed. Please go to '
                '`scripts/install_backend_python_libs` and modify our '
                'assumptions in the _get_possible_metadata_directory_names'
                ' function for what metadata directory names can be.' %
                library_name)


def main():
    """Compares the state of the current 'third_party/python_libs' directory to
    the libraries listed in the 'requirements.txt' file. If there are
    mismatches, regenerate the 'requirements.txt' file and correct the
    mismatches.
    """
    python_utils.PRINT('Regenerating "requirements.txt" file...')
    # Calls the script to regenerate requirements. The reason we cannot call the
    # regenerate requirements functionality inline is because the python script
    # that regenerates the file is a command-line interface (CLI). Once the CLI
    # finishes execution, it forces itself and any python scripts in the current
    # callstack to exit.
    # Therefore, in order to allow continued execution after the requirements
    # file is generated, we must call it as a separate process.
    subprocess.check_call(
        ['python', '-m', 'scripts.regenerate_requirements'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    # Adds a note to the end of the 'requirements.txt' file to make sure
    # developers understand that they should not append or change this
    # autogenerated file.
    with python_utils.open_file(
        common.COMPILED_REQUIREMENTS_FILE_PATH, 'r+') as f:
        content = f.read()
        f.seek(0, 0)
        f.write(
            '# Developers: Please do not modify this auto-generated file. If\n'
            '# you want to add, remove, upgrade, or downgrade libraries,\n'
            '# please change the `requirements.in` file, and then follow\n'
            '# the instructions there to regenerate this file.\n' + content)

    mismatches = get_mismatches()
    if mismatches:
        _rectify_third_party_directory(mismatches)
        validate_metadata_directories()
    else:
        python_utils.PRINT(
            'All third-party Python libraries are already installed correctly.')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
