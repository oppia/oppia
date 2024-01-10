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

from core.domain import platform_parameter_list as params

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
    FeatureNames.SHOW_TRANSLATION_SIZE
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

FEATURE_FLAG_NAME_ENUM_TO_DESCRIPTION = {
    FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS: (
        'This is a dummy feature flag for the e2e tests.'
    ),
    FeatureNames.END_CHAPTER_CELEBRATION: (
        'This flag is for the end chapter celebration feature.'
    ),
    FeatureNames.CHECKPOINT_CELEBRATION: (
        'This flag is for the checkpoint celebration feature.'
    ),
    FeatureNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS: (
        'This flag enables showing per-contributor accomplishments on the '
        'contributor dashboard.'
    ),
    FeatureNames.DIAGNOSTIC_TEST: (
        'This flag is for the diagnostic test functionality.'
    ),
    FeatureNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW: (
        'This flag is for serial chapter launch feature and making changes '
        'only in the curriculum admin view.'
    ),
    FeatureNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW: (
        'This flag is for serial chapter launch feature and making changes '
        'only in the learner view.'
    ),
    FeatureNames.SHOW_REDESIGNED_LEARNER_DASHBOARD: (
        'This flag is to show redesigned learner dashboard.'
    ),
    FeatureNames.SHOW_TRANSLATION_SIZE: (
        'This flag is to show translation size on translation cards in '
        'contributor dashboard.'
    ),
    FeatureNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN: (
        'This flag is to show feedback updates in the '
        'profile pic drop-down menu.'
    ),
    FeatureNames.CD_ADMIN_DASHBOARD_NEW_UI: (
        'This flag is to show new contributor admin dashboard.'
    ),
    FeatureNames.IS_IMPROVEMENTS_TAB_ENABLED: (
        'Exposes the Improvements Tab for creators in the exploration editor.'
    ),
    FeatureNames.LEARNER_GROUPS_ARE_ENABLED: 'Enable learner groups feature'
}

ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS: List[params.ParamNames] = [
    params.ParamNames.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS,
    params.ParamNames.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED,
    params.ParamNames.DUMMY_PARAMETER,
    params.ParamNames.EMAIL_FOOTER,
    params.ParamNames.EMAIL_SENDER_NAME,
    params.ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE,
    params.ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW,
    (
        params.ParamNames.
        HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD
    ),
    (
        params.ParamNames.
        HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD
    ),
    params.ParamNames.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
    params.ParamNames.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST,
    params.ParamNames.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER,
    params.ParamNames.PROMO_BAR_ENABLED,
    params.ParamNames.PROMO_BAR_MESSAGE,
    params.ParamNames.SIGNUP_EMAIL_BODY_CONTENT,
    params.ParamNames.SIGNUP_EMAIL_SUBJECT_CONTENT,
    params.ParamNames.UNPUBLISH_EXPLORATION_EMAIL_HTML_BODY,
    params.ParamNames.RECORD_PLAYTHROUGH_PROBABILITY
]
