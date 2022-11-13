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

"""Tuple of warranted angular safety bypasses in the codebase."""

from __future__ import annotations

from typing import Final

# Contains the tuples of all files that bypasses Angular's security mechanisms.
# Please keep the list in alphabetical order.
# NOTE TO DEVELOPERS: DO NOT ADD ANY NEW FILES TO THE TUPLES WITHOUT ASKING
#  @seanlip FIRST. You will have to explain the usage in the PR and the PR may
#  have a longer review time. This is because the reviewers will have to ensure
#  that the introduction of bypassSecurityTrust was the only option.

EXCLUDED_BYPASS_SECURITY_TRUST_FILES: Final = (
    # SVG is treated as unsafe by default by Angular. In order to show SVGs, we
    # have to manually sanitize the SVG and mark the value as safe. Marking a
    # value as a safe is done by bypassing the inbuilt Angular's security
    # mechanism. The svg-sanitizer file is going to be a permanent member in
    # this list due to the aforementioned reason.
    'core/templates/services/svg-sanitizer.service.spec.ts',
    'core/templates/services/svg-sanitizer.service.ts')
EXCLUDED_BYPASS_SECURITY_TRUST_DIRECTORIES: Final = ()
