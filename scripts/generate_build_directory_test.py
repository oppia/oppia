# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/generate_build_directory.py."""

from __future__ import annotations

from core import feconf

from core.tests import test_utils

from scripts import generate_build_directory


class Ret:
    """Return object with required attributes."""

    def __init__(self) -> None:
        self.returncode = 0


class GenerateBuildDirectoryTests(test_utils.GenericTestBase):
    """Test the methods for generate build directory."""

    def test_generate_build_dir_under_docker(self) -> None:
        with self.assertRaisesRegex(KeyError, 'js/third_party.min.js'):
            with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', True):
                generate_build_directory.main()
