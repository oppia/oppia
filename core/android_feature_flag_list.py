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

    DOWNLOADS_SUPPORT = 'android_enable_downloads_support'
    EXTRA_TOPIC_TABS_UI = 'android_enable_extra_topic_tabs_ui'
    LEARNER_STUDY_ANALYTICS = 'android_enable_learner_study_analytics'
    FAST_LANGUAGE_SWITCHING_IN_LESSON = (
        'android_enable_fast_language_switching_in_lesson'
    )
    LOGGING_LEARNER_STUDY_IDS = 'android_enable_logging_learner_study_ids'
    EDIT_ACCOUNTS_OPTIONS_UI = 'android_enable_edit_accounts_options_ui'
    ENABLE_PERFORMANCE_METRICS_COLLECTION = (
        'android_enable_performance_metrics_collection'
    )
    SPOTLIGHT_UI = 'android_enable_spotlight_ui'
    INTERACTION_CONFIG_CHANGE_STATE_RETENTION = (
        'android_enable_interaction_config_change_state_retention'
    )
    APP_AND_OS_DEPRECATION = 'android_enable_app_and_os_deprecation'
    ENABLE_NPS_SURVEY = 'android_enable_nps_survey'
    ENABLE_ONBOARDING_FLOW_V2 = 'android_enable_onboarding_flow_v2'
    ENABLE_MULTIPLE_CLASSROOMS = 'enable_multiple_classrooms'
    LOAD_LESSON_PROTOS_FROM_ASSETS = (
        'android_enable_load_lesson_protos_from_assets'
    )
    LOAD_IMAGES_FROM_ASSETS = 'android_enable_load_images_from_assets'
    LESSON_PROGRESS_VISUALIZATION = (
        'android_enable_lesson_progress_visualization'
    )
    STUDY_GUIDES = 'android_enable_study_guides'
    WORKED_EXAMPLES = 'android_enable_worked_examples'


# Names of feature objects defined in FeatureNames should be added
# to one of the following lists:
#   - ALPHA_FEATURES_LIST
#   - BETA_FEATURES_LIST
#   - GA_FEATURES_LIST
# based on the their stages. Features not added in the lists above won't be
# available to be enabled via the admin page.
#
# The stage of features indicates the maturity of
# features being developed. Features are in one of the three stages: 'alpha',
# 'beta' or 'prod'. 'alpha' features are completed in development but
# still requires further testing or approvals, which can be enabled for QA
# testers. 'beta' and 'prod' features have been fully tested so that they can be enabled in the
# production environment.


# Names of features in alpha stage, the corresponding feature flag instances must
# be in alpha stage otherwise it will cause a test error in the backend test.
ALPHA_FEATURES_LIST: List[AndroidFeatureFlagNames] = [
    AndroidFeatureFlagNames.LEARNER_STUDY_ANALYTICS,
    AndroidFeatureFlagNames.SPOTLIGHT_UI,
    AndroidFeatureFlagNames.ENABLE_MULTIPLE_CLASSROOMS,
    AndroidFeatureFlagNames.ENABLE_ONBOARDING_FLOW_V2,
    AndroidFeatureFlagNames.LOAD_LESSON_PROTOS_FROM_ASSETS,
    AndroidFeatureFlagNames.LOAD_IMAGES_FROM_ASSETS,
    AndroidFeatureFlagNames.LESSON_PROGRESS_VISUALIZATION,
    AndroidFeatureFlagNames.STUDY_GUIDES,
    AndroidFeatureFlagNames.WORKED_EXAMPLES,
    AndroidFeatureFlagNames.APP_AND_OS_DEPRECATION,
]

# Names of features in beta stage, the corresponding feature flag instances must
# be in beta stage otherwise it will cause a test error in the backend test.
BETA_FEATURES_LIST: List[AndroidFeatureFlagNames] = [
    AndroidFeatureFlagNames.LOAD_LESSON_PROTOS_FROM_ASSETS,
    AndroidFeatureFlagNames.LOAD_IMAGES_FROM_ASSETS,
    AndroidFeatureFlagNames.APP_AND_OS_DEPRECATION,
    AndroidFeatureFlagNames.LESSON_PROGRESS_VISUALIZATION,
    AndroidFeatureFlagNames.STUDY_GUIDES,
    AndroidFeatureFlagNames.WORKED_EXAMPLES,
]

# Names of features in prod stage, the corresponding feature flag instances must
# be in prod stage otherwise it will cause a test error in the backend test.
GA_FEATURES_LIST: List[AndroidFeatureFlagNames] = [
    AndroidFeatureFlagNames.LOAD_LESSON_PROTOS_FROM_ASSETS,
    AndroidFeatureFlagNames.LOAD_IMAGES_FROM_ASSETS,
]


FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE: Dict[
    str, tuple[str, android_feature_flag_domain.AndroidFeatureFlagState]
] = {
    AndroidFeatureFlagNames.DOWNLOADS_SUPPORT.value: (
        'Enables manually downloading topics.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.EXTRA_TOPIC_TABS_UI.value: (
        'Enables the practice and info topic tabs.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.LEARNER_STUDY_ANALYTICS.value: (
        'Enables learner study analytics.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.FAST_LANGUAGE_SWITCHING_IN_LESSON.value: (
        'Enables fast language switching in lesson.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.LOGGING_LEARNER_STUDY_IDS.value: (
        'Enables logging learner study IDs with outgoing events.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.EDIT_ACCOUNTS_OPTIONS_UI.value: (
        'Enables the edit account options UI.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.ENABLE_PERFORMANCE_METRICS_COLLECTION.value: (
        'Enables performance metrics collection.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.SPOTLIGHT_UI.value: (
        'Enables the spotlight UI.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.INTERACTION_CONFIG_CHANGE_STATE_RETENTION.value: (
        'Enables retaining interaction state across configuration changes.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.APP_AND_OS_DEPRECATION.value: (
        'Enables app and OS deprecation.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.ENABLE_NPS_SURVEY.value: (
        'Enables the NPS survey.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.ENABLE_ONBOARDING_FLOW_V2.value: (
        'Enables the new onboarding flow.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.ENABLE_MULTIPLE_CLASSROOMS.value: (
        'Enables multiple classrooms.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.LOAD_LESSON_PROTOS_FROM_ASSETS.value: (
        'Loads lesson protos from assets.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.LOAD_IMAGES_FROM_ASSETS.value: (
        'Loads images from assets.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.LESSON_PROGRESS_VISUALIZATION.value: (
        'Enables lesson progress visualization.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.STUDY_GUIDES.value: (
        'Enables study guides.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
    AndroidFeatureFlagNames.WORKED_EXAMPLES.value: (
        'Enables worked examples.',
        android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
    ),
}
