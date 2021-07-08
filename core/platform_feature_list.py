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

"""Platform feature list."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameter_list as params


PARAM_NAMES = params.PARAM_NAMES # pylint: disable=invalid-name

# Names of feature objects defined in domain/platform_parameter_list.py
# should be added to one of the following lists:
#   - DEV_FEATURES_LIST
#   - TEST_FEATURES_LIST
#   - PROD_FEATURES_LIST
# based on the their stages. Features not added in the lists above won't be
# available to be enabled via the admin page.
#
# The stage of features indicates the maturity of
# features being developed. Features are in one of the three stages: 'dev',
# 'test' or 'prod'. In general, 'dev' features are in develop and can only be
# enabled in dev environment. 'test' features are completed in development but
# still requires further testing or approvals, which can be enabled for QA
# testers. 'prod' feature has been fully tested so that it can be enabled in the
# production environment.

# Names of features in dev stage, the corresponding feature flag instances must
# be in dev stage otherwise it will cause a test error in the backend test.
DEV_FEATURES_LIST = [
    params.PARAM_NAMES.dummy_feature
]

# Names of features in test stage, the corresponding feature flag instances must
# be in test stage otherwise it will cause a test error in the backend test.
TEST_FEATURES_LIST = [
]

# Names of features in prod stage, the corresponding feature flag instances must
# be in prod stage otherwise it will cause a test error in the backend test.
PROD_FEATURES_LIST = [
]

# Names of features that should not be used anymore, e.g. features that are
# completed and no longer gated because their functionality is permanently
# built into the codebase.
DEPRECATED_FEATURE_NAMES = [
]
