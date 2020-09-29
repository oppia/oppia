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
import re
import shutil
import subprocess
import sys

import pkg_resources
import python_utils
from scripts import common


def normalize_python_library_name(library_name):
    """Returns a normalized version of the python library name.

    Normalization of a library name means converting the library name to
    lowercase, and removing any "[...]" suffixes that occur. The reason we do
    this is because of 2 potential confusions when comparing library names that
    will cause this script to find incorrect mismatches.

    1. Python library name strings are case-insensitive, which means that
       libraries are considered equivalent even if the casing of the library
       names is different.
    2. There are certain python libraries with a default version and multiple
       variants. These variants have names like `library[sub-library]` and
       signify that it is a version of the library with special support for
       the sub-library. These variants can be considered equivalent to an
       individual developer and project because at any point in time, only one
       of these variants is allowed to be installed/used in a project.

    Here are some examples of ambiguities that this function resolves:
    - 'googleappenginemapreduce' is listed in the 'requirements.txt' file as
      all lowercase. However, the installed directories have names starting with
      the string 'GoogleAppEngineMapReduce'. This causes confusion when
      searching for mismatches because python treats the two library names as
      different even though they are equivalent.
    - If the name 'google-api-core[grpc]' is listed in the 'requirements.txt'
      file, this means that a variant of the 'google-api-core' package that
      supports grpc is required. However, the import names, the package
      directory names, and the metadata directory names of the installed package
      do not actually contain the sub-library identifier. This causes
      incorrect mismatches to be found because the script treats the installed
      package's library name, 'library', differently from the 'requirements.txt'
      listed library name, 'library[sub-library]'

    Args:
        library_name: str. The library name to be normalized.

    Returns:
        str. A normalized library name.
    """
    # Remove the special support package designation (e.g [grpc]) in the
    # brackets when parsing the requirements file to resolve confusion 2 in the
    # docstring.
    # NOTE: This does not cause ambiguities because there is no viable scenario
    # where both the library and a variant of the library exist in the
    # directory. Both the default version and the variant are imported in the
    # same way (e.g import google.api.core) and if pip allowed a scenario where
    # both versions were installed, then there would be ambiguities in the
    # imports. For this reason, it is safe to disambiguate the names by removing
    # the suffix. We have also implemented the backend tests,
    # test_uniqueness_of_lib_names_in_requirements_file and
    # test_uniqueness_of_lib_names_in_compiled_requirements_file, in
    # scripts/install_backend_python_libs_test.py to ensure that all
    # library names in the requirements files are distinct when normalized.
    library_name = re.sub(r'\[[^\[^\]]+\]', '', library_name)
    return library_name.lower()


def normalize_directory_name(directory_name):
    """Returns a normalized (lowercase) version of the directory name.

    Python library name strings are case insensitive which means that
    libraries are equivalent even if the casing of the library names are
    different. When python libraries are installed, the generated metadata
    directories also use the python library names as part of the directory name.
    This function normalizes directory names so that metadata directories with
    different case won't be treated as different in code. For example,
    `GoogleAppEnginePipeline-1.9.22.1.dist-info` and
    `googleappenginepipeline-1.9.22.1.dist-info` are equivalent, although their
    names are not the same. To make sure these two directory names are
    considered equal, we use this method to enforce that all directory names are
    lowercase.

    Args:
        directory_name: str. The directory name to be normalized.

    Returns:
        str. A normalized directory name string that is all lowercase.
    """
    return directory_name.lower()


def _get_requirements_file_contents():
    """Returns a dictionary containing all of the required normalized library
    names with their corresponding version strings listed in the
    'requirements.txt' file.

    Returns:
        dict(str, str). Dictionary with the normalized name of the library as
        the key and the version string of that library as the value.
    """
    requirements_contents = collections.defaultdict()
    with python_utils.open_file(
        common.COMPILED_REQUIREMENTS_FILE_PATH, 'r') as f:
        lines = f.readlines()
        for line in lines:
            trimmed_line = line.strip()
            if trimmed_line.startswith('#') or len(trimmed_line) == 0:
                continue
            library_name_and_version_string = trimmed_line.split(
                ' ')[0].split('==')
            # Libraries with different case are considered equivalent libraries:
            # e.g 'Flask' is the same library as 'flask'. Therefore, we
            # normalize all library names in order to compare libraries without
            # ambiguities.
            normalized_library_name = (
                normalize_python_library_name(
                    library_name_and_version_string[0]))
            version_string = library_name_and_version_string[1]
            requirements_contents[normalized_library_name] = version_string
    return requirements_contents


def _get_third_party_python_libs_directory_contents():
    """Returns a dictionary containing all of the normalized libraries name
    strings with their corresponding version strings installed in the
    'third_party/python_libs' directory.

    Returns:
        dict(str, str). Dictionary with the normalized name of the library
        installed as the key and the version string of that library as the
        value.
    """
    installed_packages = [
        (d.project_name, d.version)
        for d in pkg_resources.find_distributions(
            common.THIRD_PARTY_PYTHON_LIBS_DIR)]
    # Libraries with different case are considered equivalent libraries:
    # e.g 'Flask' is the same library as 'flask'. Therefore, we
    # normalize all library names in order to compare libraries without
    # ambiguities.
    directory_contents = {
        normalize_python_library_name(library_name): version_string
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
    possible_normalized_directory_names = (
        _get_possible_normalized_metadata_directory_names(
            library_name, version_string))
    normalized_directory_names = [
        normalize_directory_name(name)
        for name in os.listdir(common.THIRD_PARTY_PYTHON_LIBS_DIR)
        if os.path.isdir(
            os.path.join(common.THIRD_PARTY_PYTHON_LIBS_DIR, name))
    ]
    for normalized_directory_name in normalized_directory_names:
        # Python metadata directory names contain a python library name that
        # does not have uniform case. However, python libraries are equivalent
        # regardless of their case. Therefore, in order to check if a python
        # library's metadata exists in a directory, we need to normalize the
        # directory name. Otherwise, we would need to check every permutation of
        # the casing for metadata directories generated with the naming
        # convention: <library_name>-<library-version>.
        if normalized_directory_name in possible_normalized_directory_names:
            path_to_delete = os.path.join(
                common.THIRD_PARTY_PYTHON_LIBS_DIR, normalized_directory_name)
            shutil.rmtree(path_to_delete)


def _rectify_third_party_directory(mismatches):
    """Rectifies the 'third_party/python_libs' directory state to reflect the
    current 'requirements.txt' file requirements. It takes a list of mismatches
    and corrects those mismatches by installing or uninstalling packages.

    Args:
        mismatches: dict(str, tuple(str|None, str|None)). Dictionary
            with the normalized library names as keys and a tuple as values. The
            1st element of the tuple is the version string of the library
            required by the requirements.txt file while the 2nd element is the
            version string of the library currently installed in the
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

    for normalized_library_name, versions in mismatches.items():
        requirements_version = (
            pkg_resources.parse_version(versions[0]) if versions[0] else None)
        directory_version = (
            pkg_resources.parse_version(versions[1]) if versions[1] else None)

        # The library is installed in the directory but is not listed in
        # requirements.
        # We don't have functionality to remove a library cleanly, and if we
        # ignore the library, this might cause issues when pushing the branch to
        # develop as there might be possible hidden use cases of a deleted
        # library that the developer did not catch. The only way to enforce the
        # removal of a library is to clean out the folder and reinstall
        # everything from scratch.
        if not requirements_version:
            if os.path.isdir(common.THIRD_PARTY_PYTHON_LIBS_DIR):
                shutil.rmtree(common.THIRD_PARTY_PYTHON_LIBS_DIR)
            _reinstall_all_dependencies()
            return

        # The library listed in 'requirements.txt' is not in the
        # 'third_party/python_libs' directory.
        if not directory_version:
            _install_library(
                normalized_library_name,
                python_utils.convert_to_bytes(requirements_version))
        # The currently installed library version is not equal to the required
        # 'requirements.txt' version.
        elif requirements_version != directory_version:
            _install_library(
                normalized_library_name,
                python_utils.convert_to_bytes(requirements_version))
            _remove_metadata(
                normalized_library_name,
                python_utils.convert_to_bytes(directory_version))


def _install_library(library_name, version_string):
    """Installs a library with a certain version to the
    'third_party/python_libs' folder.

    Args:
        library_name: str. Name of the library to install.
        version_string: str. Stringified version of the library to install.
    """
    pip_install(
        library_name,
        version_string,
        common.THIRD_PARTY_PYTHON_LIBS_DIR,
        upgrade=True,
        no_dependencies=True
    )


def _reinstall_all_dependencies():
    """Reinstalls all of the libraries detailed in the compiled
    'requirements.txt' file to the 'third_party/python_libs' folder.
    """
    _pip_install_requirements(
        common.THIRD_PARTY_PYTHON_LIBS_DIR,
        common.COMPILED_REQUIREMENTS_FILE_PATH
    )


def _get_possible_normalized_metadata_directory_names(
        library_name, version_string):
    """Returns possible normalized metadata directory names for python libraries
    installed using pip (following the guidelines of PEP-427 and PEP-376).
    This ensures that our _remove_metadata() function works as intended. More
    details about the guidelines concerning the metadata folders can be found
    here:
    https://www.python.org/dev/peps/pep-0427/#file-contents
    https://www.python.org/dev/peps/pep-0376/#how-distributions-are-installed.

    Args:
        library_name: str. Name of the library.
        version_string: str. Stringified version of the library.

    Returns:
        set(str). Set containing the possible normalized directory name strings
        of metadata folders.
    """
    # Some metadata folders replace the hyphens in the library name with
    # underscores.
    return {
        normalize_directory_name(
            '%s-%s.dist-info' % (library_name, version_string)),
        normalize_directory_name(
            '%s-%s.dist-info' % (
                library_name.replace('-', '_'), version_string)),
        normalize_directory_name(
            '%s-%s.egg-info' % (library_name, version_string)),
        normalize_directory_name(
            '%s-%s.egg-info' % (
                library_name.replace('-', '_'), version_string)),
    }


def _verify_pip_is_installed():
    """Verify that pip is installed.

    Raises:
        ImportError. Error importing pip.
    """
    try:
        python_utils.PRINT('Checking if pip is installed on the local machine')
        # Importing pip just to check if its installed.
        import pip  #pylint: disable=unused-variable
    except ImportError as e:
        common.print_each_string_after_two_new_lines([
            'Pip is required to install Oppia dependencies, but pip wasn\'t '
            'found on your local machine.',
            'Please see \'Installing Oppia\' on the Oppia developers\' wiki '
            'page:'])

        if common.is_mac_os():
            python_utils.PRINT(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-'
                'OS%29')
        elif common.is_linux_os():
            python_utils.PRINT(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux'
                '%29')
        else:
            python_utils.PRINT(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28'
                'Windows%29')
        raise ImportError('Error importing pip: %s' % e)


def _run_pip_command(cmd_parts):
    """Run pip command with some flags and configs. If it fails try to rerun it
    with additional flags and else raise an exception.

    Args:
        cmd_parts: list(str). List of cmd parts to be run with pip.

    Raises:
        Exception. Error installing package.
    """
    _verify_pip_is_installed()
    # The call to python -m is used to ensure that Python and Pip versions are
    # compatible.
    command = [sys.executable, '-m', 'pip'] + cmd_parts
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if process.returncode == 0:
        python_utils.PRINT(stdout)
    elif 'can\'t combine user with prefix' in stderr:
        python_utils.PRINT('Trying by setting --user and --prefix flags.')
        subprocess.check_call(
            command + ['--user', '--prefix=', '--system'])
    else:
        python_utils.PRINT(stderr)
        python_utils.PRINT(
            'Refer to https://github.com/oppia/oppia/wiki/Troubleshooting')
        raise Exception('Error installing package')


def pip_install_to_system(package, version):
    """Installs third party libraries with pip to the user's system.

    Note: These libraries are installed to the user's default system-wide
    'site-packages' folder, not to a local Oppia third-party directory. This is
    ONLY required in very specific cases where the development server scripts
    require default libraries. (When running another python script using
    the shell, the call stack that is instantiated for that python script cannot
    be edited by us; therefore, we have no control over which system paths, the
    script visits when it looks for libraries and can only install those
    necessary libraries to the default system path.)

    In general, please DO NOT use this method when installing packages required
    for oppia. Use pip_install instead.

    Args:
        package: str. The package name.
        version: str. The package version.
    """
    _run_pip_command([
        'install', '%s==%s' % (package, version)])


def pip_install(
        package, version, install_path, upgrade=False, no_dependencies=False):
    """Installs third party libraries with pip to a specific path.

    Args:
        package: str. The package name.
        version: str. The package version.
        install_path: str. The installation path for the package.
        upgrade: bool. Whether to call pip with the --upgrade flag.
        no_dependencies: bool. Whether call the pip with --no-dependencies flag.
    """
    additional_pip_args = []
    if upgrade:
        additional_pip_args.append('--upgrade')
    if no_dependencies:
        additional_pip_args.append('--no-dependencies')

    _run_pip_command([
        'install', '%s==%s' % (package, version), '--target', install_path
    ] + additional_pip_args)


def _pip_install_requirements(install_path, requirements_path):
    """Installs third party libraries from requirements files with pip.

    Args:
        install_path: str. The installation path for the packages.
        requirements_path: str. The path to the requirements file.
    """
    _run_pip_command([
        'install', '--target', install_path, '--no-dependencies',
        '-r', requirements_path, '--upgrade'
    ])


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
        dict(str, tuple(str|None, str|None)). Dictionary with the
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
    for normalized_library_name in requirements_contents:
        # Library exists in the directory and the requirements file.
        if normalized_library_name in directory_contents:
            # Library matches but version doesn't match.
            if (directory_contents[normalized_library_name] !=
                    requirements_contents[normalized_library_name]):
                mismatches[normalized_library_name] = (
                    requirements_contents[normalized_library_name],
                    directory_contents[normalized_library_name])
        # Library exists in the requirements file but not in the directory.
        else:
            mismatches[normalized_library_name] = (
                requirements_contents[normalized_library_name], None)

    for normalized_library_name in directory_contents:
        # Library exists in the directory but is not in the requirements file.
        if normalized_library_name not in requirements_contents:
            mismatches[normalized_library_name] = (
                None, directory_contents[normalized_library_name])

    return mismatches


def validate_metadata_directories():
    """Validates that for each installed library in the
    'third_party/python_libs' folder, there exists a corresponding metadata
    directory following the correct naming conventions that are detailed by
    the PEP-427 and PEP-376 python guidelines.

    Raises:
        Exception. An installed library's metadata does not exist in the
            'third_party/python_libs' directory in the format that we expect
            (following the PEP-427 and PEP-376 python guidelines).
    """
    directory_contents = _get_third_party_python_libs_directory_contents()
    # Each python metadata directory name contains a python library name that
    # does not have uniform case. This is because we cannot guarantee the
    # casing of the directory names generated and there are no options that we
    # can provide to `pip install` to actually guarantee that a certain casing
    # format is used to create the directory names. The only official guidelines
    # for naming directories is that it must start with the string:
    # '<library_name>-<library-version>' but no casing guidelines are specified.
    # Therefore, in order to efficiently check if a python library's metadata
    # exists in a directory, we need to normalize the directory name. Otherwise,
    # we would need to check every permutation of the casing.
    normalized_directory_names = set(
        [
            normalize_directory_name(name)
            for name in os.listdir(common.THIRD_PARTY_PYTHON_LIBS_DIR)
            if os.path.isdir(
                os.path.join(common.THIRD_PARTY_PYTHON_LIBS_DIR, name))
        ])
    for normalized_library_name, version_string in directory_contents.items():
        # Possible names of the metadata directory installed when <library_name>
        # is installed.
        possible_normalized_directory_names = (
            _get_possible_normalized_metadata_directory_names(
                normalized_library_name, version_string))
        # If any of the possible metadata directory names show up in the
        # directory, that is confirmation that <library_name> was installed
        # correctly with the correct metadata.
        if not any(
                normalized_directory_name in normalized_directory_names
                for normalized_directory_name in
                possible_normalized_directory_names):
            raise Exception(
                'The python library %s was installed without the correct '
                'metadata folders which may indicate that the convention for '
                'naming the metadata folders have changed. Please go to '
                '`scripts/install_backend_python_libs` and modify our '
                'assumptions in the '
                '_get_possible_normalized_metadata_directory_names'
                ' function for what metadata directory names can be.' %
                normalized_library_name)


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
    # Adds a note to the beginning of the 'requirements.txt' file to make sure
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
