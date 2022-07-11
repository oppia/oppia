# coding: utf-8
#
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

"""Unit tests for scripts/linters/warranted_angular_security_bypasses.py"""

from __future__ import annotations

from core.tests import test_utils
from . import warranted_angular_security_bypasses


class WarrantedAngularSecurityBypassesTests(test_utils.GenericTestBase):

    def test_svg_sanitizer_service_is_present_in_excluded_files(self) -> None:
        excluded_files = (
            warranted_angular_security_bypasses
            .EXCLUDED_BYPASS_SECURITY_TRUST_FILES)
        self.assertIn(
            'core/templates/services/svg-sanitizer.service.spec.ts',
            excluded_files)
        self.assertIn(
            'core/templates/services/svg-sanitizer.service.ts', excluded_files)
