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

"""Tests for the oppia root page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.tests import test_utils


class OppiaRootPageTests(test_utils.GenericTestBase):

    def test_oppia_root_page(self):
        # type: () -> None
        """Tests access to the unified entry page."""
        for route in constants.ROUTES_REGISTERED_WITH_FRONTEND.values():
            response = self.get_html_response(
                '/%s' % route, expected_status_int=200)
            response.mustcontain('<oppia-root></oppia-root>')
