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

    DUMMY_FEATURE_FLAG_FOR_E2E_TESTS = 'dummy_feature_flag_for_e2e_tests'
    DUMMY_PARAMETER = 'dummy_parameter'

    END_CHAPTER_CELEBRATION = 'end_chapter_celebration'
    CHECKPOINT_CELEBRATION = 'checkpoint_celebration'
    CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS = (
        'contributor_dashboard_accomplishments')
    ANDROID_BETA_LANDING_PAGE = 'android_beta_landing_page'
    BLOG_PAGES = 'blog_pages'
    DIAGNOSTIC_TEST = 'diagnostic_test'
    SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW = (
        'serial_chapter_launch_curriculum_admin_view')
    SHOW_REDESIGNED_LEARNER_DASHBOARD = (
        'show_redesigned_learner_dashboard')
    SHOW_TRANSLATION_SIZE = 'show_translation_size'
    SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN = (
        'show_feedback_updates_in_profile_pic_dropdown')
    IS_IMPROVEMENTS_TAB_ENABLED = 'is_improvements_tab_enabled'
    LEARNER_GROUPS_ARE_ENABLED = 'learner_groups_are_enabled'
    PROMO_BAR_ENABLED = 'promo_bar_enabled'
    PROMO_BAR_MESSAGE = 'promo_bar_message'
    ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS = (
        'always_ask_learners_for_answer_details')
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_creation_threshold')
    HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD = (
        'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold')
    HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS = (
        'high_bounce_rate_task_minimum_exploration_starts')


# Platform parameters should all be defined below.

Registry.create_feature_flag(
    ParamNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS,
    'This is a dummy feature flag for the e2e tests.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_platform_parameter(
    ParamNames.DUMMY_PARAMETER,
    'This is a dummy platform parameter.',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_feature_flag(
    ParamNames.END_CHAPTER_CELEBRATION,
    'This flag is for the end chapter celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.CHECKPOINT_CELEBRATION,
    'This flag is for the checkpoint celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS,
    'This flag enables showing per-contributor accomplishments on the' +
    ' contributor dashboard.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.ANDROID_BETA_LANDING_PAGE,
    'This flag is for Android beta promo landing page.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.BLOG_PAGES,
    'This flag is for blog home page, blog author profile page and blog post' +
    ' page.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.DIAGNOSTIC_TEST,
    'This flag is for the diagnostic test functionality.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW,
    'This flag is for serial chapter launch feature and making changes only' +
    'in the curriculum admin view.',
    platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.SHOW_REDESIGNED_LEARNER_DASHBOARD,
    'This flag is to show redesigned learner dashboard.',
    platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.SHOW_TRANSLATION_SIZE,
    'This flag is to show translation size on translation cards in' +
    'contributor dashboard.',
    platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN,
    'This flag is to show feedback updates in the' +
    'profile pic drop-down menu.',
     platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.IS_IMPROVEMENTS_TAB_ENABLED,
    'Exposes the Improvements Tab for creators in the exploration editor.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.LEARNER_GROUPS_ARE_ENABLED,
    'Enable learner groups feature',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_platform_parameter(
    ParamNames.PROMO_BAR_ENABLED,
    'Whether the promo bar should be enabled for all users',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.PROMO_BAR_MESSAGE,
    'The message to show to all users if the promo bar is enabled',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_platform_parameter(
    ParamNames.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS,
    'Always ask learners for answer details. For testing -- do not use',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD,
    'The bounce-rate a state must exceed to create a new improvements task.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.20
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD,
    'The bounce-rate a state must exceed to create a new improvements task.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.20
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
    'The minimum number of times an exploration is started before it can '
    'generate high bounce-rate improvements tasks.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=100
)
