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


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    DUMMY_FEATURE = 'dummy_feature'
    DUMMY_PARAMETER = 'dummy_parameter'


# Platform parameters should all be defined below.

Registry.create_feature_flag(
    ParamNames.DUMMY_FEATURE,
    'This is a dummy feature flag.',
    platform_parameter_domain.FeatureStages.DEV,
)

Registry.create_platform_parameter(
    ParamNames.DUMMY_PARAMETER,
    'This is a dummy platform parameter.',
    platform_parameter_domain.DataTypes.STRING
)
