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

"""Feature flags registry."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameters as params

# Names of feature objects defined in domain/platform_parameter_domain.py
# should be added to one of the following lists, features flags not added
# here won't be available.

# Features in dev stage.
DEV_FEATURES_LIST = [
    params.PARAM_NAMES.dummy_feature
]

# Features in test stage.
TEST_FEATURES_LIST = [
]

# Features in prod stage.
PROD_FEATURES_LIST = [
]

# Names of features that should not be used anyway, e.g. features that are
# completed and no longer gated.
DEPRECATED_FEATURE_NAMES = [
]
