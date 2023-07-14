# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""This file is used to build a Python package that can then by used by
Google Cloud Dataflow workers (Apache Beam).

The package is built by running 'python setup.py sdist' in the build.py.
"""

from __future__ import annotations

import re
import shutil
import tempfile

from core import feconf

import pkg_resources
import setuptools


def main() -> None:
    """Builds python package used by Google Cloud Dataflow workers."""
    # Configure the required packages and scripts to install.
    with open('requirements.txt', encoding='utf-8') as requirements_txt: # pylint: disable=replace-disallowed-function-calls
        requirements_content = requirements_txt.read()
        modified_requirements_content = re.sub(
            r'^--hash=sha256:.*$',
            '',
            requirements_content,
            flags=re.MULTILINE
        )

        print(modified_requirements_content)

        # # Temporary file to write the modified requirements content.
        # with tempfile.NamedTemporaryFile(
        #     mode='w', delete=False) as temp_file:
        #     temp_file.write(modified_requirements_content)

        # # Replace original requirements file with the modified
        # # temporary file with no hashes.
        # shutil.copy2('requirements.txt', 'requirements.txt.bak')
        # shutil.move(temp_file.name, 'requirements.txt')
        # The 'parse_requirements' returns a list of 'Requirement' objects.
        # We need to transform these to strings using the str() function.
        required_packages = [
            str(requirement)  # pylint: disable=replace-disallowed-function-calls
            for requirement in pkg_resources.parse_requirements(
                requirements_txt)
        ]
        # shutil.move('requirements.txt.bak', 'requirements.txt')

    setuptools.setup(
        name='oppia-beam-job',
        version=feconf.OPPIA_VERSION,
        description='Oppia Apache Beam package',
        install_requires=required_packages,
        packages=setuptools.find_packages(),
        include_package_data=True,
    )


if __name__ == '__main__':  # pragma: no cover
    main()
