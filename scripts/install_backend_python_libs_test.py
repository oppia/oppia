# coding: utf-8
#
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

"""Unit tests for scripts/install_backend_python_libs.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils

import python_utils
from scripts import install_backend_python_libs

class InstallBackendPythonLibsTests(test_utils.GenericTestBase):
    """Test the methods for installing backend python libs."""

    def setUp(self):
        super(InstallBackendPythonLibsTests, self).setUp()

    def test_adding_library_to_requirements_triggers_validation_error():
        def _mock_get_requirements_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1',
                u'flask': u'1.0.1'
            }
        def _mock_get_directory_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1',
            }

        swap_get_requirements_file_contents = self.swap(
            install_backend_python_libs, '_get_requirements_file_contents',
            _mock_get_requirements_file_contents)
        swap_get_requirements_file_contents = self.swap(
            install_backend_python_libs, '_get_third_party_directory_contents',
            _mock_get_directory_file_contents)
        with swap_get_requirements_file_contents, (
            swap_get_requirements_file_contents):
            self.assertEqual(
                {
                    u'flask', ('1.0.1', None)
                },
                install_backend_python_libs.get_mismatches())

    def test_downgrade_produces_correct_mismatches():
        def _mock_get_requirements_file_contents():
            return {
                u'html5lib': u'1.0.1',
                u'six': u'1.15.0',
                u'redis': u'3.5.3',
                u'webencodings': u'0.5.1',
            }
