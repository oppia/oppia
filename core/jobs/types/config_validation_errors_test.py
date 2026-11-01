# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for config validation error classes."""

from __future__ import annotations

from core.jobs.types import base_validation_errors, config_validation_errors
from core.tests import test_utils


class ConfigValidationErrorsTests(test_utils.GenericTestBase):
    """Tests config validation error inheritance."""

    def test_invalid_feature_flag_id_error_is_base_validation_error(
        self,
    ) -> None:
        self.assertTrue(
            issubclass(
                config_validation_errors.InvalidFeatureFlagIdError,
                base_validation_errors.BaseValidationError,
            )
        )
