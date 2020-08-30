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

from pip._internal.utils import misc
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
    with python_utils.open_file(common.REQUIREMENTS_FILE_PATH, 'r') as f:
        lines = f.readlines()
        for l in lines:
            if l.startswith('#'):
                continue
            library_and_version = l.split(' ')[0].split('==')
            library = library_and_version[0].lower()
            version = library_and_version[1]
            requirements_contents[library] = version

    return requirements_contents


def _get_third_party_directory_contents():
    """Returns a dictionary representing all of the libraries with their
    corresponding versions installed in the 'third_party/python_libs' directory.

    Returns:
        dict(string, string). Dictionary with the name of the library installed
        as the key and the version string of that library as the value.
    """
    installed_distributions = misc.get_installed_distributions(
        skip=[], paths=[common.THIRD_PARTY_PYTHON_LIBS_DIR])
    directory_contents = collections.defaultdict()
    for d in installed_distributions:
        library_and_version = python_utils.convert_to_bytes(d).split(' ')
        library = library_and_version[0].lower()
        version = library_and_version[1]
        directory_contents[library] = version

    return directory_contents


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
        library names as keys and a tuple for values. The 1st element of the
        tuple is the version string of the library required by the
        requirements.txt file while the 2nd element is the version string of
        the library currently in the 'third_party/python_libs' directory. If
        the library doesn't exist, the tuple element will be None.
        For example, the following dictionary signifies that 'requirements.txt'
        requires flask with version 1.0.1 while the 'third_party/python_libs'
        directory contains flask 1.1.1 (or mismatch 4 above):
            {
              flask: ('1.0.1', '1.1.1')
            }
    """
    requirements_contents = _get_requirements_file_contents()
    directory_contents = _get_third_party_directory_contents()

    mismatches = {}
    for library in requirements_contents:
        # Library exists in the directory and the requirements file.
        if library in directory_contents:
            # Library and version match.
            if directory_contents[library] == requirements_contents[library]:
                continue
            # Library matches but version doesn't match.
            else:
                mismatches[library] = (
                    requirements_contents[library], directory_contents[library])
        # Library exists in the requirements file but not in the directory.
        else:
            mismatches[library] = (requirements_contents[library], None)

    for library in directory_contents:
        # Library exists in the directory but is not in the requirements file.
        if library not in requirements_contents:
            mismatches[library] = (None, directory_contents[library])

    return mismatches


def _remove_metadata(library, version):
    """Removes the residual metadata files pertaining to a specific library that
    was reinstalled with a new version. The reason we need this function is
    because `pip install --upgrade` upgrades the library to the new version but
    does not remove the metadata that was installed with the previous version.
    These metadata files confuse the pip function that extracts all of the
    information about currently installed libraries and will cause this install
    script to not behave correctly.
    """
    # The possible strings that a metadata directory or file name can
    # start with.
    possible_filename_start_strings = [
        '%s-%s' % (library, version),
        # Some metadata folders replace the hyphens with underscores.
        '%s-%s' % (library.replace('-', '_'), version)
    ]
    for f in os.listdir(common.THIRD_PARTY_PYTHON_LIBS_DIR):
        if (f.startswith(possible_filename_start_strings[0]) or
                f.startswith(possible_filename_start_strings[1])):
            to_delete_path = os.path.join(
                common.THIRD_PARTY_PYTHON_LIBS_DIR, f)
            if os.path.isdir(to_delete_path):
                shutil.rmtree(to_delete_path)
            else:
                os.remove(to_delete_path)


def _rectify_third_party_directory(mismatches):
    """Rectifies the 'third_party/python_libs' directory to reflect the current
    'requirements.txt' file. It takes a list of mismatches and corrects those
    mismatches by installing or uninstalling the packages.

    Args:
        mismatches: dict(string, tuple(string|None, string|None)). Dictionary
            with the library names as keys and a tuple for values. The 1st
            element of the tuple is the version string of the library required
            by the requirements.txt file while the 2nd element is the version
            string of the library currently in the  'third_party/python_libs'
            directory. If the library doesn't exist, the tuple element will be
            None. For example, this dictionary signifies that 'requirements.txt'
            requires flask with version 1.0.1 while the
            'third_party/python_libs' directory contains flask 1.1.1:
                {
                  flask: ('1.0.1', '1.1.1')
                }
    """
    # Handling 5 or more mismatches requires 5 or more individual `pip install`
    # commands which is slower than just reinstalling all of the libraries using
    # `pip install -r requirements.txt`.
    if len(mismatches) >= 5:
        if os.path.isdir(common.THIRD_PARTY_PYTHON_LIBS_DIR):
            shutil.rmtree(common.THIRD_PARTY_PYTHON_LIBS_DIR)
        subprocess.check_call([
            'pip', 'install', '--target',
            common.THIRD_PARTY_PYTHON_LIBS_DIR,
            '--no-dependencies', '-r',
            common.REQUIREMENTS_FILE_PATH
        ])
        return

    for library, versions in mismatches.items():
        requirements_version = (
            pkg_resources.parse_version(versions[0]) if versions[0] else None)
        directory_version = (
            pkg_resources.parse_version(versions[1]) if versions[1] else None)

        # Library is installed in the directory but not listed in
        # requirements.
        if not requirements_version:
            shutil.rmtree(common.THIRD_PARTY_PYTHON_LIBS_DIR)
            subprocess.check_call([
                'pip', 'install', '--target',
                common.THIRD_PARTY_PYTHON_LIBS_DIR,
                '--no-dependencies', '-r',
                common.REQUIREMENTS_FILE_PATH
            ])

        # Library exists in requirements but not in the directory or the
        # currently installed library version is not up-to-date with the
        # required 'requirements.txt' version.
        elif (not directory_version or
              requirements_version > directory_version):
            subprocess.check_call([
                'pip', 'install', '--target',
                common.THIRD_PARTY_PYTHON_LIBS_DIR,
                '--no-dependencies',
                '%s==%s' % (
                    library,
                    python_utils.convert_to_bytes(requirements_version)),
                '--upgrade'
            ])
        # The currently installed library version is higher than the required
        # 'requirements.txt' version.
        elif requirements_version < directory_version:
            subprocess.check_call([
                'pip', 'install', '--target',
                common.THIRD_PARTY_PYTHON_LIBS_DIR,
                '--no-dependencies',
                '%s==%s' % (
                    library,
                    python_utils.convert_to_bytes(requirements_version)),
                '--upgrade'
            ])
            _remove_metadata(
                library, python_utils.convert_to_bytes(directory_version))


def main():
    """Compares the state of the current 'third_party/python_libs' directory to
    the required libraries listed in the 'requirements.txt' file. If there are
    mismatches, regenerate the 'requirements.txt' file and correct the
    mismatches.
    """
    python_utils.PRINT('Regenerating "requirements.txt" file...')
    # Calls the script to regenerate requirements. The reason we cannot call the
    # regenerate requirements functionality inline is because the python script
    # that regenerates the file is a cli. Once the cli finishes execution, it
    # forces itself and any python scripts in the current callstack to exit.
    # Therefore, in order to continue execution after the requirements file is
    # generated, we must call it as a separate process.
    subprocess.check_call(
        ['python', '-m', 'scripts.regenerate_requirements'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    mismatches = get_mismatches()
    if mismatches:
        _rectify_third_party_directory(mismatches)
    else:
        python_utils.PRINT(
            'Third party python libraries already installed correctly.')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
