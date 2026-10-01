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

from core.domain import web_feature_flag_domain

from typing import List


class WebFeatureNames(enum.Enum):
    """Enum for Web Feature names."""

    DUMMY_FEATURE_FLAG_FOR_E2E_TESTS = 'dummy_feature_flag_for_e2e_tests'
    END_CHAPTER_CELEBRATION = 'end_chapter_celebration'
    CHECKPOINT_CELEBRATION = 'checkpoint_celebration'
    CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS = (
        'contributor_dashboard_accomplishments'
    )
    ANDROID_BETA_LANDING_PAGE = 'android_beta_landing_page'
    BLOG_PAGES = 'blog_pages'
    DIAGNOSTIC_TEST = 'diagnostic_test'
    SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW = (
        'serial_chapter_launch_curriculum_admin_view'
    )
    SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW = 'serial_chapter_launch_learner_view'
    SHOW_REDESIGNED_LEARNER_DASHBOARD = 'show_redesigned_learner_dashboard'
    SHOW_TRANSLATION_SIZE = 'show_translation_size'
    CD_ADMIN_DASHBOARD_NEW_UI = 'cd_admin_dashboard_new_ui'
    IS_IMPROVEMENTS_TAB_ENABLED = 'is_improvements_tab_enabled'
    LEARNER_GROUPS_ARE_ENABLED = 'learner_groups_are_enabled'
    NEW_LESSON_PLAYER = 'new_lesson_player'
    ADD_VOICEOVER_WITH_ACCENT = 'add_voiceover_with_accent'
    CD_ALLOW_UNDOING_TRANSLATION_REVIEW = 'cd_allow_undoing_translation_review'
    ENABLE_VOICEOVER_CONTRIBUTION = 'enable_voiceover_contribution'
    AUTO_UPDATE_EXP_VOICE_ARTIST_LINK = 'auto_update_exp_voice_artist_link'
    EXPLORATION_EDITOR_CAN_MODIFY_TRANSLATIONS = (
        'exploration_editor_can_modify_translations'
    )
    EXPLORATION_EDITOR_CAN_TAG_MISCONCEPTIONS = (
        'exploration_editor_can_tag_misconceptions'
    )
    ENABLE_MULTIPLE_CLASSROOMS = 'enable_multiple_classrooms'
    REDESIGNED_TOPIC_VIEWER_PAGE = 'redesigned_topic_viewer_page'
    AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP = (
        'automatic_voiceover_regeneration_from_exp'
    )
    LABEL_ACCENT_TO_VOICE_ARTIST = 'label_accent_to_voice_artist'
    SHOW_VOICEOVER_TAB_FOR_NON_CURATED_EXPLORATIONS = (
        'show_voiceover_tab_for_non_curated_explorations'
    )
    HIGHLIGHT_SENTENCES_DURING_AUTOMATIC_VOICEOVER_PLAYBACK = (
        'highlight_sentences_during_automatic_voiceover_playback'
    )
    SHOW_RESTRUCTURED_STUDY_GUIDES = 'show_restructured_study_guides'
    ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS = (
        'enable_translation_opps_with_new_opp_models'
    )
    ENABLE_WORKED_EXAMPLES_RTE_COMPONENT = (
        'enable_worked_examples_rte_component'
    )
    SHOW_REGENERATED_VOICEOVERS_TO_LEARNERS = (
        'show_regenerated_voiceovers_to_learners'
    )
    ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS = (
        'enable_background_voiceover_synthesis'
    )
    ENABLE_READY_FOR_REVIEW_TEST = 'enable_ready_for_review_test'
    ENABLE_FINANCIAL_LITERACY_CAMPAIGN_BANNER = (
        'enable_financial_literacy_campaign_banner'
    )
    ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS = (
        'enable_automatic_translation_suggestions'
    )
    # A separate flag is used for testing the financial literacy campaign banner with early dates.
    # This allows testing the feature before the actual campaign dates that will
    # be used in production. Without a separate test flag, we would need to change
    # the campaign date values for testing and then update them again before
    # releasing to production. That process would require additional PRs,
    # cherry-picks, or hotfixes. Using a dedicated test-mode flag avoids that
    # overhead and keeps testing and production configurations separate.
    ENABLE_FINANCIAL_LITERACY_CAMPAIGN_BANNER_TEST_MODE = (
        'enable_financial_literacy_campaign_banner_test_mode'
    )
    ENABLE_CERTIFICATE_ASSESSMENT = 'enable_certificate_assessment'
    WEB_FEEDBACK_MODAL_ENABLED = 'web_feedback_modal_enabled'
    EXPLORATION_EDITOR_NEW_CREATOR_FEEDBACK_TAB = (
        'exploration_editor_new_creator_feedback_tab'
    )
    TECHNICAL_FEEDBACK_DASHBOARD_ENABLED = (
        'technical_feedback_dashboard_enabled'
    )
    STORY_EDITOR_ARCS = 'story_editor_arcs'
    ENABLE_DROPDOWN_PAGINATION = 'enable_dropdown_pagination'


# Names of feature objects defined in WebFeatureNames should be added
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
    WebFeatureNames.SHOW_TRANSLATION_SIZE,
    WebFeatureNames.ENABLE_READY_FOR_REVIEW_TEST,
    WebFeatureNames.ENABLE_CERTIFICATE_ASSESSMENT,
]

# Names of features in test stage, the corresponding feature flag instances must
# be in test stage otherwise it will cause a test error in the backend test.
TEST_FEATURES_LIST: List[WebFeatureNames] = [
    WebFeatureNames.CD_ADMIN_DASHBOARD_NEW_UI,
    WebFeatureNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW,
    WebFeatureNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW,
    WebFeatureNames.CD_ALLOW_UNDOING_TRANSLATION_REVIEW,
    WebFeatureNames.SHOW_VOICEOVER_TAB_FOR_NON_CURATED_EXPLORATIONS,
    WebFeatureNames.NEW_LESSON_PLAYER,
    WebFeatureNames.ENABLE_FINANCIAL_LITERACY_CAMPAIGN_BANNER_TEST_MODE,
    WebFeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS,
    WebFeatureNames.WEB_FEEDBACK_MODAL_ENABLED,
    WebFeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS,
    WebFeatureNames.STORY_EDITOR_ARCS,
    WebFeatureNames.REDESIGNED_TOPIC_VIEWER_PAGE,
    WebFeatureNames.EXPLORATION_EDITOR_NEW_CREATOR_FEEDBACK_TAB,
    WebFeatureNames.TECHNICAL_FEEDBACK_DASHBOARD_ENABLED,
]

# Names of features in prod stage, the corresponding feature flag instances must
# be in prod stage otherwise it will cause a test error in the backend test.
PROD_FEATURES_LIST: List[WebFeatureNames] = [
    WebFeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS,
    WebFeatureNames.IS_IMPROVEMENTS_TAB_ENABLED,
    WebFeatureNames.LEARNER_GROUPS_ARE_ENABLED,
    WebFeatureNames.EXPLORATION_EDITOR_CAN_MODIFY_TRANSLATIONS,
    WebFeatureNames.EXPLORATION_EDITOR_CAN_TAG_MISCONCEPTIONS,
    WebFeatureNames.SHOW_REDESIGNED_LEARNER_DASHBOARD,
    WebFeatureNames.SHOW_RESTRUCTURED_STUDY_GUIDES,
    WebFeatureNames.ENABLE_FINANCIAL_LITERACY_CAMPAIGN_BANNER,
    WebFeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP,
    WebFeatureNames.HIGHLIGHT_SENTENCES_DURING_AUTOMATIC_VOICEOVER_PLAYBACK,
    WebFeatureNames.SHOW_REGENERATED_VOICEOVERS_TO_LEARNERS,
    WebFeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS,
]

# Names of features that should not be used anymore, e.g. features that are
# completed and no longer gated because their functionality is permanently
# built into the codebase.
DEPRECATED_FEATURE_NAMES: List[WebFeatureNames] = [
    WebFeatureNames.ANDROID_BETA_LANDING_PAGE,
    WebFeatureNames.BLOG_PAGES,
    WebFeatureNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS,
    WebFeatureNames.DIAGNOSTIC_TEST,
    WebFeatureNames.END_CHAPTER_CELEBRATION,
    WebFeatureNames.CHECKPOINT_CELEBRATION,
    WebFeatureNames.ENABLE_VOICEOVER_CONTRIBUTION,
    WebFeatureNames.AUTO_UPDATE_EXP_VOICE_ARTIST_LINK,
    WebFeatureNames.LABEL_ACCENT_TO_VOICE_ARTIST,
    WebFeatureNames.ADD_VOICEOVER_WITH_ACCENT,
    WebFeatureNames.ENABLE_MULTIPLE_CLASSROOMS,
    WebFeatureNames.ENABLE_WORKED_EXAMPLES_RTE_COMPONENT,
]

WEB_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE = {
    WebFeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS.value: (
        (
            'This is a dummy feature flag for the e2e tests.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW.value: (
        (
            'This flag is for serial chapter launch feature and making changes '
            'only in the curriculum admin view.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW.value: (
        (
            'This flag is for serial chapter launch feature and making changes '
            'only in the learner view.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.SHOW_REDESIGNED_LEARNER_DASHBOARD.value: (
        (
            'This flag is to show redesigned learner dashboard.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.SHOW_TRANSLATION_SIZE.value: (
        (
            'This flag is to show translation size on translation cards in '
            'contributor dashboard.',
            web_feature_flag_domain.ServerMode.DEV,
        )
    ),
    WebFeatureNames.CD_ADMIN_DASHBOARD_NEW_UI.value: (
        (
            'This flag is to show new contributor admin dashboard.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.IS_IMPROVEMENTS_TAB_ENABLED.value: (
        (
            'Exposes the Improvements Tab for creators in the exploration '
            'editor.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.LEARNER_GROUPS_ARE_ENABLED.value: (
        (
            'Enable learner groups feature',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.NEW_LESSON_PLAYER.value: (
        (
            'This flag is to enable the exploration player redesign.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.CD_ALLOW_UNDOING_TRANSLATION_REVIEW.value: (
        (
            'This flag allows translation reviewers to undo translation '
            'suggestion review on the contributor dashboard.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.EXPLORATION_EDITOR_CAN_MODIFY_TRANSLATIONS.value: (
        (
            'This flag allows exploration editors to promptly update '
            'translations of content they are editing in the exploration '
            'editor page.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.EXPLORATION_EDITOR_CAN_TAG_MISCONCEPTIONS.value: (
        (
            'This flag allows exploration editors to view a list of '
            'misconceptions and tag answer groups with misconceptions '
            'for a curated exploration.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.REDESIGNED_TOPIC_VIEWER_PAGE.value: (
        (
            'This flag activates the redesigned topic viewer page'
            'and makes it accessible to learners.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP.value: (
        (
            'The flag enables the automatic regeneration of voiceovers '
            'directly from the exploration editor page.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.SHOW_VOICEOVER_TAB_FOR_NON_CURATED_EXPLORATIONS.value: (
        (
            'The flag enables the voiceover tab for non-curated explorations.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.SHOW_RESTRUCTURED_STUDY_GUIDES.value: (
        (
            'Allows the creators to access the updated study guide editor page '
            'and learners to access the updated study guide user interface '
            '(the actual content displayed by the study guides will be the '
            'same, just the user interface will be different).',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.ENABLE_TRANSLATION_OPPORTUNITIES_WITH_NEW_OPP_MODELS.value: (
        (
            'This flag enables the new translation opportunity structure to '
            'the contributor dashboard.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.SHOW_REGENERATED_VOICEOVERS_TO_LEARNERS.value: (
        (
            'This flag allows learners to see the regenerated voiceovers '
            'in the exploration player.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.HIGHLIGHT_SENTENCES_DURING_AUTOMATIC_VOICEOVER_PLAYBACK.value: (
        (
            'This flag enables the highlighting of sentences during the '
            'automatic voiceover playback in the exploration player and '
            'editor pages.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS.value: (
        (
            'The flag enables the asynchronous voiceover synthesis for the '
            'curated exploration contents.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.ENABLE_READY_FOR_REVIEW_TEST.value: (
        (
            'This flag enables ready_for_review_test, which controls the learner’s redirection to the Review Test upon lesson completion.',
            web_feature_flag_domain.ServerMode.DEV,
        )
    ),
    WebFeatureNames.ENABLE_FINANCIAL_LITERACY_CAMPAIGN_BANNER.value: (
        (
            'This flag enables the financial literacy campaign banner for the fundraising campaign.',
            web_feature_flag_domain.ServerMode.PROD,
        )
    ),
    WebFeatureNames.ENABLE_FINANCIAL_LITERACY_CAMPAIGN_BANNER_TEST_MODE.value: (
        (
            'This flag enables the financial literacy campaign banner for the fundraising campaign in test mode.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS.value: (
        (
            'Enables automatic AI-generated translation suggestions in the '
            'Contributor Dashboard to assist translators.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.ENABLE_CERTIFICATE_ASSESSMENT.value: (
        (
            'Enables the certificate assessment feature, allowing curriculum admins to create certificate offerings and learners to take certificate assessments.',
            web_feature_flag_domain.ServerMode.DEV,
        )
    ),
    WebFeatureNames.WEB_FEEDBACK_MODAL_ENABLED.value: (
        (
            'This flag enables the feedback entrypoints and their respective modals, allowing learners to provide feedback, report an issue and give suggestion on lessons and on the site. ',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.EXPLORATION_EDITOR_NEW_CREATOR_FEEDBACK_TAB.value: (
        (
            'This flag enables the new creator feedback tab experience in '
            'the exploration editor along with the updated feedback updates page UI.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.TECHNICAL_FEEDBACK_DASHBOARD_ENABLED.value: (
        (
            'This flag enables the Technical Feedback Dashboard, allowing '
            'LEAP and CORE tech leads/co-leads to review and manage '
            'technical feedback submitted by learners.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    WebFeatureNames.STORY_EDITOR_ARCS.value: (
        (
            'This flag enables arc-based chapter groupings in the story editor, '
            'allowing creators to organize chapters into named arcs.',
            web_feature_flag_domain.ServerMode.TEST,
        )
    ),
    FeatureNames.ENABLE_DROPDOWN_PAGINATION.value: (
        (
            'This flag enables dropdown-based page navigation on the '
            'Contributor Dashboard, replacing the simple Previous/Next '
            'pagination buttons with a page selector dropdown.',
            feature_flag_domain.ServerMode.DEV,
        )
    ),
}
