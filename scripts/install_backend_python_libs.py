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

from scripts import common
import collections
import os
import subprocess
import sys
from pip._internal.utils.misc import get_installed_distributions

TOOLS_DIR = os.path.join('..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join('.', 'third_party')
THIRD_PARTY_STATIC_DIR = os.path.join(THIRD_PARTY_DIR, 'static')
REQUIREMENTS_FILE_PATH = os.path.join('.', 'requirements.txt')
# The precompiled requirements file is the one that developers should be
# modifying. It is the file that pip-tools will use to compile a deterministic
# "requirements.txt" file so that all installations using "requirements.txt"
# will be the same.
PRE_COMPILED_REQUIREMENTS_FILE_PATH = os.path.join('.', 'requirements.in')

def _get_requirements_file_contents():
    requirements_contents = collections.defaultdict()
    with open(REQUIREMENTS_FILE_PATH, 'r') as f:
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
    installed_distributions = get_installed_distributions(
        skip=[], paths=[THIRD_PARTY_DIR])
    directory_contents = collections.defaultdict()
    for d in installed_distributions:
        library_and_version = str(d).split(' ')
        library = library_and_version[0].lower()
        version = library_and_version[1]
        directory_contents[library] = version

    return directory_contents


def validate_third_party_directory():
    requirements_contents = _get_requirements_file_contents()
    directory_contents = _get_third_party_directory_contents()
    if len(requirements_contents) != len(directory_contents):
        return False
    for library in requirements_contents:
        # Library library exists in directory.
        if library in directory_contents:
            # Library and version match.
            if directory_contents[library] == requirements_contents[library]:
                 continue
            # Library matches but version doesn't match.
            else:
                return False
        # Library library doesn't exist in directory.
        else:
            return False

    return True


def get_mismatches():
    requirements_contents = _get_requirements_file_contents()
    directory_contents = _get_third_party_directory_contents()
    mismatches = []
    for library in requirements_contents:
        if library in directory_contents:
            # Library and version match.
            if directory_contents[library] == requirements_contents[library]:
                 continue
            # Library matches but version doesn't match.
            else:
                mismatches.append(
                    (library, requirements_contents[library]),
                    (library, directory_contents[library]))
        else:
            mismatches.append(
                (library, requirements_contents[library]),
                None
            )

    for library in directory_contents:
        if library not in requirements_contents:
            mismatches.append(
                None,
                (library, requirements_contents[library])
            )

    return mismatches

def regenerate_requirements_file():
    print("Regenerating 'requirements.txt' file...")
    subprocess.check_call([
        'pip-compile', PRE_COMPILED_REQUIREMENTS_FILE_PATH
    ])

def main():
    sys.path.insert(0, os.path.join(
        TOOLS_DIR, 'pip-tools-%s' % common.PIP_TOOLS_VERSION))
    regenerate_requirements_file()
    validate_third_party_directory()

# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
