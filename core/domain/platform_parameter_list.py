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

"""Definition of platform parameters."""

from __future__ import annotations

import enum

from core.domain import platform_parameter_domain
from core.domain import platform_parameter_registry as registry

Registry = registry.Registry


# TODO(#14419): Change naming style of Enum class from SCREAMING_SNAKE_CASE
# to PascalCase and its values to UPPER_CASE. Because we want to be consistent
# throughout the codebase according to the coding style guide.
# https://github.com/oppia/oppia/wiki/Coding-style-guide
class PARAM_NAMES(enum.Enum): # pylint: disable=invalid-name
    """Enum for parameter names."""

    dummy_feature = 'dummy_feature' # pylint: disable=invalid-name
    dummy_parameter = 'dummy_parameter' # pylint: disable=invalid-name

    end_chapter_celebration = 'end_chapter_celebration' # pylint: disable=invalid-name
    ANDROID_BETA_LANDING_PAGE = 'android_beta_landing_page'


# Platform parameters should all be defined below.

Registry.create_feature_flag(
    PARAM_NAMES.dummy_feature,
    'This is a dummy feature flag.',
    platform_parameter_domain.FeatureStages.DEV,
)

Registry.create_platform_parameter(
    PARAM_NAMES.dummy_parameter,
    'This is a dummy platform parameter.',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_feature_flag(
    PARAM_NAMES.end_chapter_celebration,
    'This flag is for the end chapter celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    PARAM_NAMES.ANDROID_BETA_LANDING_PAGE,
    'This flag is for Android beta promo landing page.',
    platform_parameter_domain.FeatureStages.PROD)
