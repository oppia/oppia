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

from core.domain import platform_parameter_list as params

from typing import List

ParamNames = params.ParamNames

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
    params.ParamNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN,
    params.ParamNames.SHOW_REDESIGNED_LEARNER_DASHBOARD,
    params.ParamNames.SHOW_TRANSLATION_SIZE,
    params.ParamNames.NEW_LESSON_PLAYER
]

# Names of features in test stage, the corresponding feature flag instances must
# be in test stage otherwise it will cause a test error in the backend test.
TEST_FEATURES_LIST: List[ParamNames] = [
    params.ParamNames.CD_ADMIN_DASHBOARD_NEW_UI,
    params.ParamNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW,
    params.ParamNames.DIAGNOSTIC_TEST,
    params.ParamNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW,
]

# Names of features in prod stage, the corresponding feature flag instances must
# be in prod stage otherwise it will cause a test error in the backend test.
PROD_FEATURES_LIST: List[ParamNames] = [
    params.ParamNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS,
    params.ParamNames.END_CHAPTER_CELEBRATION,
    params.ParamNames.CHECKPOINT_CELEBRATION,
    params.ParamNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS,
    params.ParamNames.IS_IMPROVEMENTS_TAB_ENABLED,
    params.ParamNames.LEARNER_GROUPS_ARE_ENABLED
]

# Names of features that should not be used anymore, e.g. features that are
# completed and no longer gated because their functionality is permanently
# built into the codebase.
DEPRECATED_FEATURE_NAMES: List[ParamNames] = [
    params.ParamNames.ANDROID_BETA_LANDING_PAGE,
    params.ParamNames.BLOG_PAGES,
]

ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS: List[ParamNames] = [
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
