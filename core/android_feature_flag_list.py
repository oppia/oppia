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

from typing import Dict, List


class AndroidFeatureFlagNames(enum.Enum):
    """Enum of Android feature flags."""

    FAST_LANGUAGE_SWITCHING_IN_LESSON = (
        'android_enable_fast_language_switching_in_lesson'
    )


# Names of feature objects defined in FeatureNames should be added
# to one of the following lists:
#   - DEV_FEATURES_LIST
#   - ALPHA_FEATURES_LIST
#   - BETA_FEATURES_LIST
#   - GA_FEATURES_LIST
# based on the their stages. Features not added in the lists above won't be
# available to be enabled via the admin page.
#
# The stage of features indicates the maturity of
# features being developed. Features are in one of the three stages: 'dev',
# 'alpha', 'beta' or 'prod'. In general, 'dev' features are in develop and can only be
# enabled in dev environment. 'alpha' features are completed in development but
# still requires further testing or approvals, which can be enabled for QA
# testers. 'beta' and 'prod' features have been fully tested so that they can be enabled in the
# production environment.


# Names of features in dev stage, the corresponding feature flag instances must
# be in dev stage otherwise it will cause a test error in the backend test.
DEV_FEATURES_LIST: List[AndroidFeatureFlagNames] = []

# Names of features in alpha stage, the corresponding feature flag instances must
# be in alpha stage otherwise it will cause a test error in the backend test.
ALPHA_FEATURES_LIST: List[AndroidFeatureFlagNames] = []

# Names of features in beta stage, the corresponding feature flag instances must
# be in beta stage otherwise it will cause a test error in the backend test.
BETA_FEATURES_LIST: List[AndroidFeatureFlagNames] = []

# Names of features in prod stage, the corresponding feature flag instances must
# be in prod stage otherwise it will cause a test error in the backend test.
GA_FEATURES_LIST: List[AndroidFeatureFlagNames] = []


FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE: Dict[
    str, tuple[str, android_feature_flag_domain.AndroidFeatureFlagState]
] = {
    AndroidFeatureFlagNames.FAST_LANGUAGE_SWITCHING_IN_LESSON.value: (
        'Enables fast language switching in lesson.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    )
}
