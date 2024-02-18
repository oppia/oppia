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

from __future__ import annotations

import enum

from core.domain import feature_flag_domain

from typing import List


class FeatureNames(enum.Enum):
    """Enum for Feature names."""

    DUMMY_FEATURE_FLAG_FOR_E2E_TESTS = 'dummy_feature_flag_for_e2e_tests'
    END_CHAPTER_CELEBRATION = 'end_chapter_celebration'
    CHECKPOINT_CELEBRATION = 'checkpoint_celebration'
    CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS = (
        'contributor_dashboard_accomplishments')
    ANDROID_BETA_LANDING_PAGE = 'android_beta_landing_page'
    BLOG_PAGES = 'blog_pages'
    DIAGNOSTIC_TEST = 'diagnostic_test'
    SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW = (
        'serial_chapter_launch_curriculum_admin_view')
    SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW = (
        'serial_chapter_launch_learner_view')
    SHOW_REDESIGNED_LEARNER_DASHBOARD = (
        'show_redesigned_learner_dashboard')
    SHOW_TRANSLATION_SIZE = 'show_translation_size'
    SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN = (
        'show_feedback_updates_in_profile_pic_dropdown')
    CD_ADMIN_DASHBOARD_NEW_UI = 'cd_admin_dashboard_new_ui'
    IS_IMPROVEMENTS_TAB_ENABLED = 'is_improvements_tab_enabled'
    LEARNER_GROUPS_ARE_ENABLED = 'learner_groups_are_enabled'
    NEW_LESSON_PLAYER = 'new_lesson_player'


# Names of feature objects defined in FeatureNames should be added
# to one of the following lists:
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
    FeatureNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN,
    FeatureNames.SHOW_REDESIGNED_LEARNER_DASHBOARD,
    FeatureNames.SHOW_TRANSLATION_SIZE,
    FeatureNames.NEW_LESSON_PLAYER
]

# Names of features in test stage, the corresponding feature flag instances must
# be in test stage otherwise it will cause a test error in the backend test.
TEST_FEATURES_LIST: List[FeatureNames] = [
    FeatureNames.CD_ADMIN_DASHBOARD_NEW_UI,
    FeatureNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW,
    FeatureNames.DIAGNOSTIC_TEST,
    FeatureNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW
]

# Names of features in prod stage, the corresponding feature flag instances must
# be in prod stage otherwise it will cause a test error in the backend test.
PROD_FEATURES_LIST: List[FeatureNames] = [
    FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS,
    FeatureNames.END_CHAPTER_CELEBRATION,
    FeatureNames.CHECKPOINT_CELEBRATION,
    FeatureNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS,
    FeatureNames.IS_IMPROVEMENTS_TAB_ENABLED,
    FeatureNames.LEARNER_GROUPS_ARE_ENABLED
]

# Names of features that should not be used anymore, e.g. features that are
# completed and no longer gated because their functionality is permanently
# built into the codebase.
DEPRECATED_FEATURE_NAMES: List[FeatureNames] = [
    FeatureNames.ANDROID_BETA_LANDING_PAGE,
    FeatureNames.BLOG_PAGES,
]

FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE = {
    FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value: (
        (
            'This is a dummy feature flag for the e2e tests.',
            feature_flag_domain.ServerMode.PROD
        )
    ),
    FeatureNames.END_CHAPTER_CELEBRATION.value: (
        (
            'This flag is for the end chapter celebration feature.',
            feature_flag_domain.ServerMode.PROD
        )
    ),
    FeatureNames.CHECKPOINT_CELEBRATION.value: (
        (
            'This flag is for the checkpoint celebration feature.',
            feature_flag_domain.ServerMode.PROD
        )
    ),
    FeatureNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS.value: (
        (
            'This flag enables showing per-contributor accomplishments on the '
            'contributor dashboard.',
            feature_flag_domain.ServerMode.PROD
        )
    ),
    FeatureNames.DIAGNOSTIC_TEST.value: (
        (
            'This flag is for the diagnostic test functionality.',
            feature_flag_domain.ServerMode.TEST
        )
    ),
    FeatureNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW.value: (
        (
            'This flag is for serial chapter launch feature and making changes '
            'only in the curriculum admin view.',
            feature_flag_domain.ServerMode.TEST
        )
    ),
    FeatureNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW.value: (
        (
            'This flag is for serial chapter launch feature and making changes '
            'only in the learner view.',
            feature_flag_domain.ServerMode.TEST
        )
    ),
    FeatureNames.SHOW_REDESIGNED_LEARNER_DASHBOARD.value: (
        (
            'This flag is to show redesigned learner dashboard.',
            feature_flag_domain.ServerMode.DEV
        )
    ),
    FeatureNames.SHOW_TRANSLATION_SIZE.value: (
        (
            'This flag is to show translation size on translation cards in '
            'contributor dashboard.',
            feature_flag_domain.ServerMode.DEV
        )
    ),
    FeatureNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN.value: (
        (
            'This flag is to show feedback updates in the '
            'profile pic drop-down menu.',
            feature_flag_domain.ServerMode.DEV
        )
    ),
    FeatureNames.CD_ADMIN_DASHBOARD_NEW_UI.value: (
        (
            'This flag is to show new contributor admin dashboard.',
            feature_flag_domain.ServerMode.TEST
        )
    ),
    FeatureNames.IS_IMPROVEMENTS_TAB_ENABLED.value: (
        (
            'Exposes the Improvements Tab for creators in the exploration '
            'editor.',
            feature_flag_domain.ServerMode.PROD
        )
    ),
    FeatureNames.LEARNER_GROUPS_ARE_ENABLED.value: (
        (
            'Enable learner groups feature',
            feature_flag_domain.ServerMode.PROD
        )
    ),
    FeatureNames.NEW_LESSON_PLAYER.value: (
        (
            'This flag is to enable the exploration player redesign.',
            feature_flag_domain.ServerMode.DEV
        )
    )
}
