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

"""Setup.py module for Apache Beam workflows' worker utilities.

All the workflow related code is gathered in a package that will be built as a
source distribution, staged in the staging area for the workflow being run and
then installed in the workers when they start running.

This behavior is triggered by specifying the --setup_file command line option
when running the workflow for remote execution.
"""

from __future__ import absolute_import
from __future__ import unicode_literals

import setuptools

# Configure the required packages and scripts to install.
with open('./requirements.txt', encoding='utf-8') as requirements_file: # pylint: disable=replace-disallowed-function-calls
    REQUIRED_PACKAGES = [
        line for line in requirements_file
        if line.strip() and not line.strip().startswith('#')
    ]

setuptools.setup(
    name='oppia-beam-job',
    version='0.0.1',
    description='Oppia Apache Beam package',
    install_requires=REQUIRED_PACKAGES,
    packages=setuptools.find_packages()
)
