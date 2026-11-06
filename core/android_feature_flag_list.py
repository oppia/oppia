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

"""List of Android feature flags."""

from __future__ import annotations

import enum

from core.domain import android_feature_flag_domain

from typing import Dict


class AndroidFeatureFlagNames(enum.Enum):
    """Names of Android feature flags."""

    FAST_LANGUAGE_SWITCHING_IN_LESSON = (
        'android_enable_fast_language_switching_in_lesson'
    )


ANDROID_FEATURE_FLAG_DEFAULT_CONFIGS: Dict[
    str, android_feature_flag_domain.AndroidFeatureFlagConfig
] = {
    AndroidFeatureFlagNames.FAST_LANGUAGE_SWITCHING_IN_LESSON.value: android_feature_flag_domain.AndroidFeatureFlagConfig(
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
        '0.0',
        None,
        0,
    )
}
