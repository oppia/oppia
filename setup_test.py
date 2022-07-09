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

import pkg_resources
import setuptools

from core import feconf
from core.tests import test_utils


class SetupTests(test_utils.GenericTestBase):
    """Unit tests for setup.py."""

    def test_setuptools_is_invoked_correctly(self) -> None:
        params = {}
        def mock_setup(**kwargs):
            for key, value in kwargs.iteritems():
                params[key] = value
        
        swap_setup = self.swap(setuptools, 'setup', mock_setup)
        with swap_setup:
            import setup
        
        self.assertEqual(params['name'], 'oppia-beam-job')
        self.assertEqual(params['version'], feconf.OPPIA_VERSION)
        self.assertEqual(params['description'], 'Oppia Apache Beam package')