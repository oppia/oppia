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

"""Unit tests for setup.py."""

from __future__ import annotations

from core.tests import test_utils
import sys

import pkg_resources
import setuptools

from scripts import common # isort:skip pylint: disable=unused-import
# Since feconf imports typing_extensions, it should be
# imported after common is imported.
from core import feconf # isort:skip


class SetupTests(test_utils.GenericTestBase):
    """Unit tests for setup.py."""

    def test_setuptools_is_invoked_with_correct_parameters(self) -> None:
        with open('requirements.txt', encoding='utf-8') as requirements_txt: # pylint: disable=replace-disallowed-function-calls
            # The 'parse_requirements' returns a list of 'Requirement' objects.
            # We need to transform these to strings using the str() function.
            required_packages = [
                str(requirement)  # pylint: disable=replace-disallowed-function-calls
                for requirement in pkg_resources.parse_requirements(
                    requirements_txt)
            ]

        swap_setup = self.swap_with_checks(
            setuptools, 'setup', lambda **unused_kwargs: None,
            expected_args=(),
            expected_kwargs=[{
                'name': 'oppia-beam-job',
                'version': feconf.OPPIA_VERSION,
                'description': 'Oppia Apache Beam package',
                'install_requires': required_packages,
                'packages': setuptools.find_packages(),
                'include_package_data': True,
            }])

        dummy_path = sys.path
        dummy_path2 = []
        for path in dummy_path:
            if 'google-cloud-sdk' not in path:
                dummy_path2.append(path)

        swap_path = self.swap(sys, 'path', dummy_path2)
        
        with swap_setup, swap_path:
            import setup
            setup.main()
