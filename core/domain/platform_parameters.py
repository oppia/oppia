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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import core.domain.platform_parameter_domain as param_domain
import core.domain.platform_parameter_registry as registry
import utils

Registry = registry.Registry
FEATURE_STAGES = param_domain.FEATURE_STAGES # pylint: disable=invalid-name
DATA_TYPES = param_domain.DATA_TYPES # pylint: disable=invalid-name

PARAM_NAMES = utils.create_enum( # pylint: disable=invalid-name
    'dummy_feature', 'dummy_parameter')

# Platform parameters should all be defined below.

Registry.create_feature_flag(
    PARAM_NAMES.dummy_feature,
    'This is a dummy feature flag.',
    FEATURE_STAGES.dev,
)

Registry.create_platform_parameter(
    PARAM_NAMES.dummy_parameter,
    'This is a dummy platform parameter.',
    DATA_TYPES.string
)
