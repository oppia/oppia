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

import builtins
import os
import sys

from core.tests import test_utils

import setuptools

from scripts import common # isort:skip pylint: disable=unused-import
# Since feconf imports typing_extensions, it should be
# imported after common is imported.
from core import feconf # isort:skip


class SetupTests(test_utils.GenericTestBase):
    """Unit tests for setup.py."""

    def test_setuptools_is_invoked_with_correct_parameters(self) -> None:
        packages = (
            'module1==2.1.2\n'
            'module2==3.2.3\n'
            'module3==4.3.4\n')
        with open('dummy_requirements.txt', 'w', encoding='utf-8') as f:
            f.write(packages)

        dummy_file_object = open('dummy_requirements.txt', encoding='utf-8')

        swap_open = self.swap_with_checks(
            builtins, 'open',
            lambda *unused_args, **unused_kwargs: dummy_file_object,
            expected_args=(('requirements.txt',),))

        required_packages = packages.split('\n')[:-1]

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

        dummy_path = [
            path for path in sys.path
            if common.GOOGLE_CLOUD_SDK_HOME not in path
        ]

        swap_path = self.swap(sys, 'path', dummy_path)

        with swap_setup, swap_path, swap_open:
            # Dirs defined in common.GOOGLE_CLOUD_SDK_HOME get added to
            # sys.path when we run backend tests. We use a swap as we
            # need to remove these dirs to import setup.
            import setup # pylint: disable=syntax-error
            setup.main()

        dummy_file_object.close()
        os.remove('dummy_requirements.txt')
