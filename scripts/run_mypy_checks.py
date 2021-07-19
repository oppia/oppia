# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""MyPy test runner script."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules


import argparse
import os
import subprocess
import sys

import python_utils
from scripts import common
from scripts import install_third_party_libs


# List of directories whose files won't be type-annotated ever.
EXCLUDED_DIRECTORIES = [
    'proto_files/',
    'scripts/linters/test_files/',
    'third_party/',
]

# List of files who should be type-annotated but are not.
NOT_FULLY_COVERED_FILES = [
    'core/controllers/acl_decorators.py',
    'core/controllers/acl_decorators_test.py',
    'core/controllers/admin.py',
    'core/controllers/admin_test.py',
    'core/controllers/android_e2e_config.py',
    'core/controllers/android_e2e_config_test.py',
    'core/controllers/base.py',
    'core/controllers/base_test.py',
    'core/controllers/blog_admin.py',
    'core/controllers/blog_admin_test.py',
    'core/controllers/blog_dashboard.py',
    'core/controllers/blog_dashboard_test.py',
    'core/controllers/blog_homepage.py',
    'core/controllers/blog_homepage_test.py',
    'core/controllers/classifier.py',
    'core/controllers/classifier_test.py',
    'core/controllers/classroom.py',
    'core/controllers/classroom_test.py',
    'core/controllers/collection_editor.py',
    'core/controllers/collection_editor_test.py',
    'core/controllers/collection_viewer.py',
    'core/controllers/collection_viewer_test.py',
    'core/controllers/concept_card_viewer.py',
    'core/controllers/concept_card_viewer_test.py',
    'core/controllers/contributor_dashboard.py',
    'core/controllers/contributor_dashboard_test.py',
    'core/controllers/contributor_dashboard_admin.py',
    'core/controllers/contributor_dashboard_admin_test.py',
    'core/controllers/creator_dashboard.py',
    'core/controllers/creator_dashboard_test.py',
    'core/controllers/cron.py',
    'core/controllers/cron_test.py',
    'core/controllers/custom_landing_pages.py',
    'core/controllers/custom_landing_pages_test.py',
    'core/controllers/domain_objects_validator.py',
    'core/controllers/domain_objects_validator_test.py',
    'core/controllers/editor.py',
    'core/controllers/editor_test.py',
    'core/controllers/email_dashboard.py',
    'core/controllers/email_dashboard_test.py',
    'core/controllers/features.py',
    'core/controllers/features_test.py',
    'core/controllers/feedback.py',
    'core/controllers/feedback_test.py',
    'core/controllers/improvements.py',
    'core/controllers/improvements_test.py',
    'core/controllers/learner_dashboard.py',
    'core/controllers/learner_dashboard_test.py',
    'core/controllers/learner_playlist.py',
    'core/controllers/learner_playlist_test.py',
    'core/controllers/library.py',
    'core/controllers/library_test.py',
    'core/controllers/moderator.py',
    'core/controllers/moderator_test.py',
    'core/controllers/pages.py',
    'core/controllers/pages_test.py',
    'core/controllers/platform_feature.py',
    'core/controllers/platform_feature_test.py',
    'core/controllers/practice_sessions.py',
    'core/controllers/practice_sessions_test.py',
    'core/controllers/profile.py',
    'core/controllers/profile_test.py',
    'core/controllers/question_editor.py',
    'core/controllers/question_editor_test.py',
    'core/controllers/questions_list.py',
    'core/controllers/questions_list_test.py',
    'core/controllers/reader.py',
    'core/controllers/reader_test.py',
    'core/controllers/recent_commits.py',
    'core/controllers/recent_commits_test.py',
    'core/controllers/release_coordinator.py',
    'core/controllers/release_coordinator_test.py',
    'core/controllers/resources.py',
    'core/controllers/resources_test.py',
    'core/controllers/review_tests.py',
    'core/controllers/review_tests_test.py',
    'core/controllers/skill_editor.py',
    'core/controllers/skill_editor_test.py',
    'core/controllers/skill_mastery.py',
    'core/controllers/skill_mastery_test.py',
    'core/controllers/story_editor.py',
    'core/controllers/story_editor_test.py',
    'core/controllers/story_viewer.py',
    'core/controllers/story_viewer_test.py',
    'core/controllers/subscriptions.py',
    'core/controllers/subscriptions_test.py',
    'core/controllers/subtopic_viewer.py',
    'core/controllers/subtopic_viewer_test.py',
    'core/controllers/suggestion.py',
    'core/controllers/suggestion_test.py',
    'core/controllers/tasks.py',
    'core/controllers/tasks_test.py',
    'core/controllers/topic_editor.py',
    'core/controllers/topic_editor_test.py',
    'core/controllers/topic_viewer.py',
    'core/controllers/topic_viewer_test.py',
    'core/controllers/topics_and_skills_dashboard.py',
    'core/controllers/topics_and_skills_dashboard_test.py',
    'core/controllers/voice_artist.py',
    'core/controllers/voice_artist_test.py',
    'core/domain/action_registry.py',
    'core/domain/action_registry_test.py',
    'core/domain/activity_domain.py',
    'core/domain/activity_domain_test.py',
    'core/domain/activity_jobs_one_off.py',
    'core/domain/activity_jobs_one_off_test.py',
    'core/domain/activity_services.py',
    'core/domain/activity_services_test.py',
    'core/domain/activity_validators.py',
    'core/domain/activity_validators_test.py',
    'core/domain/app_feedback_report_validators.py',
    'core/domain/app_feedback_report_validators_test.py',
    'core/domain/audit_validators.py',
    'core/domain/audit_validators_test.py',
    'core/domain/auth_domain.py',
    'core/domain/auth_domain_test.py',
    'core/domain/auth_jobs_one_off.py',
    'core/domain/auth_jobs_one_off_test.py',
    'core/domain/auth_services.py',
    'core/domain/auth_services_test.py',
    'core/domain/auth_validators.py',
    'core/domain/auth_validators_test.py',
    'core/domain/base_model_validators.py',
    'core/domain/base_model_validators_test.py',
    'core/domain/beam_job_domain.py',
    'core/domain/beam_job_domain_test.py',
    'core/domain/beam_job_services.py',
    'core/domain/beam_job_services_test.py',
    'core/domain/beam_job_validators.py',
    'core/domain/beam_job_validators_test.py',
    'core/domain/blog_domain.py',
    'core/domain/blog_domain_test.py',
    'core/domain/blog_services.py',
    'core/domain/blog_services_test.py',
    'core/domain/blog_validators.py',
    'core/domain/blog_validators_test.py',
    'core/domain/caching_domain.py',
    'core/domain/caching_services.py',
    'core/domain/caching_services_test.py',
    'core/domain/calculation_registry.py',
    'core/domain/calculation_registry_test.py',
    'core/domain/change_domain.py',
    'core/domain/classifier_domain.py',
    'core/domain/classifier_domain_test.py',
    'core/domain/classifier_services.py',
    'core/domain/classifier_services_test.py',
    'core/domain/classifier_validators.py',
    'core/domain/classifier_validators_test.py',
    'core/domain/classroom_domain.py',
    'core/domain/classroom_services.py',
    'core/domain/classroom_services_test.py',
    'core/domain/collection_domain.py',
    'core/domain/collection_domain_test.py',
    'core/domain/collection_jobs_one_off.py',
    'core/domain/collection_jobs_one_off_test.py',
    'core/domain/collection_services.py',
    'core/domain/collection_services_test.py',
    'core/domain/collection_validators.py',
    'core/domain/collection_validators_test.py',
    'core/domain/config_domain.py',
    'core/domain/config_domain_test.py',
    'core/domain/config_services.py',
    'core/domain/config_services_test.py',
    'core/domain/config_validators.py',
    'core/domain/config_validators_test.py',
    'core/domain/cron_services.py',
    'core/domain/customization_args_util.py',
    'core/domain/customization_args_util_test.py',
    'core/domain/draft_upgrade_services.py',
    'core/domain/draft_upgrade_services_test.py',
    'core/domain/email_jobs_one_off.py',
    'core/domain/email_jobs_one_off_test.py',
    'core/domain/email_manager.py',
    'core/domain/email_manager_test.py',
    'core/domain/email_services.py',
    'core/domain/email_services_test.py',
    'core/domain/email_subscription_services.py',
    'core/domain/email_subscription_services_test.py',
    'core/domain/email_validators.py',
    'core/domain/email_validators_test.py',
    'core/domain/event_services.py',
    'core/domain/event_services_test.py',
    'core/domain/exp_domain.py',
    'core/domain/exp_domain_test.py',
    'core/domain/exp_fetchers.py',
    'core/domain/exp_fetchers_test.py',
    'core/domain/exp_jobs_one_off.py',
    'core/domain/exp_jobs_one_off_test.py',
    'core/domain/exp_services.py',
    'core/domain/exp_services_test.py',
    'core/domain/exploration_validators.py',
    'core/domain/exploration_validators_test.py',
    'core/domain/expression_parser.py',
    'core/domain/expression_parser_test.py',
    'core/domain/feedback_domain.py',
    'core/domain/feedback_domain_test.py',
    'core/domain/feedback_jobs_one_off.py',
    'core/domain/feedback_jobs_one_off_test.py',
    'core/domain/feedback_services.py',
    'core/domain/feedback_services_test.py',
    'core/domain/feedback_validators.py',
    'core/domain/feedback_validators_test.py',
    'core/domain/fs_domain.py',
    'core/domain/fs_domain_test.py',
    'core/domain/fs_services.py',
    'core/domain/fs_services_test.py',
    'core/domain/html_cleaner.py',
    'core/domain/html_cleaner_test.py',
    'core/domain/html_validation_service.py',
    'core/domain/html_validation_service_test.py',
    'core/domain/image_services.py',
    'core/domain/image_services_test.py',
    'core/domain/image_validation_services.py',
    'core/domain/image_validation_services_test.py',
    'core/domain/improvements_domain.py',
    'core/domain/improvements_domain_test.py',
    'core/domain/improvements_services.py',
    'core/domain/improvements_services_test.py',
    'core/domain/improvements_validators.py',
    'core/domain/improvements_validators_test.py',
    'core/domain/interaction_jobs_one_off.py',
    'core/domain/interaction_jobs_one_off_test.py',
    'core/domain/interaction_registry.py',
    'core/domain/interaction_registry_test.py',
    'core/domain/job_validators.py',
    'core/domain/job_validators_test.py',
    'core/domain/learner_goals_services.py',
    'core/domain/learner_goals_services_test.py',
    'core/controllers/learner_goals.py',
    'core/controllers/learner_goals_test.py',
    'core/domain/learner_playlist_services.py',
    'core/domain/learner_playlist_services_test.py',
    'core/domain/learner_progress_domain.py',
    'core/domain/learner_progress_domain_test.py',
    'core/domain/learner_progress_services.py',
    'core/domain/learner_progress_services_test.py',
    'core/domain/moderator_services.py',
    'core/domain/moderator_services_test.py',
    'core/domain/object_registry.py',
    'core/domain/object_registry_test.py',
    'core/domain/opportunity_domain.py',
    'core/domain/opportunity_domain_test.py',
    'core/domain/opportunity_jobs_one_off.py',
    'core/domain/opportunity_jobs_one_off_test.py',
    'core/domain/opportunity_services.py',
    'core/domain/opportunity_services_test.py',
    'core/domain/opportunity_validators.py',
    'core/domain/opportunity_validators_test.py',
    'core/domain/param_domain.py',
    'core/domain/param_domain_test.py',
    'core/domain/platform_feature_services.py',
    'core/domain/platform_feature_services_test.py',
    'core/domain/platform_parameter_domain.py',
    'core/domain/platform_parameter_domain_test.py',
    'core/domain/platform_parameter_list.py',
    'core/domain/platform_parameter_list_test.py',
    'core/domain/platform_parameter_registry.py',
    'core/domain/platform_parameter_registry_test.py',
    'core/domain/playthrough_issue_registry.py',
    'core/domain/playthrough_issue_registry_test.py',
    'core/domain/prod_validation_jobs_one_off.py',
    'core/domain/question_domain.py',
    'core/domain/question_domain_test.py',
    'core/domain/question_fetchers.py',
    'core/domain/question_fetchers_test.py',
    'core/domain/question_jobs_one_off.py',
    'core/domain/question_jobs_one_off_test.py',
    'core/domain/question_services.py',
    'core/domain/question_services_test.py',
    'core/domain/question_validators.py',
    'core/domain/question_validators_test.py',
    'core/domain/rating_services.py',
    'core/domain/rating_services_test.py',
    'core/domain/recommendations_jobs_one_off.py',
    'core/domain/recommendations_jobs_one_off_test.py',
    'core/domain/recommendations_services.py',
    'core/domain/recommendations_services_test.py',
    'core/domain/recommendations_validators.py',
    'core/domain/recommendations_validators_test.py',
    'core/domain/rights_domain.py',
    'core/domain/rights_domain_test.py',
    'core/domain/rights_manager.py',
    'core/domain/rights_manager_test.py',
    'core/domain/role_services.py',
    'core/domain/role_services_test.py',
    'core/domain/rte_component_registry.py',
    'core/domain/rte_component_registry_test.py',
    'core/domain/rules_registry.py',
    'core/domain/rules_registry_test.py',
    'core/domain/search_services.py',
    'core/domain/search_services_test.py',
    'core/domain/skill_domain.py',
    'core/domain/skill_domain_test.py',
    'core/domain/skill_fetchers.py',
    'core/domain/skill_fetchers_test.py',
    'core/domain/skill_jobs_one_off.py',
    'core/domain/skill_jobs_one_off_test.py',
    'core/domain/skill_services.py',
    'core/domain/skill_services_test.py',
    'core/domain/skill_validators.py',
    'core/domain/skill_validators_test.py',
    'core/domain/state_domain.py',
    'core/domain/state_domain_test.py',
    'core/domain/statistics_validators.py',
    'core/domain/statistics_validators_test.py',
    'core/domain/stats_domain.py',
    'core/domain/stats_domain_test.py',
    'core/domain/stats_jobs_continuous.py',
    'core/domain/stats_jobs_continuous_test.py',
    'core/domain/stats_jobs_one_off.py',
    'core/domain/stats_jobs_one_off_test.py',
    'core/domain/stats_services.py',
    'core/domain/stats_services_test.py',
    'core/domain/storage_model_audit_jobs_test.py',
    'core/domain/story_domain.py',
    'core/domain/story_domain_test.py',
    'core/domain/story_fetchers.py',
    'core/domain/story_fetchers_test.py',
    'core/domain/story_jobs_one_off.py',
    'core/domain/story_jobs_one_off_test.py',
    'core/domain/story_services.py',
    'core/domain/story_services_test.py',
    'core/domain/story_validators.py',
    'core/domain/story_validators_test.py',
    'core/domain/subscription_services.py',
    'core/domain/subscription_services_test.py',
    'core/domain/subtopic_page_domain.py',
    'core/domain/subtopic_page_domain_test.py',
    'core/domain/subtopic_page_services.py',
    'core/domain/subtopic_page_services_test.py',
    'core/domain/subtopic_validators.py',
    'core/domain/subtopic_validators_test.py',
    'core/domain/suggestion_jobs_one_off.py',
    'core/domain/suggestion_jobs_one_off_test.py',
    'core/domain/suggestion_registry.py',
    'core/domain/suggestion_registry_test.py',
    'core/domain/suggestion_services.py',
    'core/domain/suggestion_services_test.py',
    'core/domain/suggestion_validators.py',
    'core/domain/suggestion_validators_test.py',
    'core/domain/summary_services.py',
    'core/domain/summary_services_test.py',
    'core/domain/takeout_domain.py',
    'core/domain/takeout_service.py',
    'core/domain/takeout_service_test.py',
    'core/domain/taskqueue_services.py',
    'core/domain/taskqueue_services_test.py',
    'core/domain/topic_domain.py',
    'core/domain/topic_domain_test.py',
    'core/domain/topic_fetchers.py',
    'core/domain/topic_fetchers_test.py',
    'core/domain/topic_jobs_one_off.py',
    'core/domain/topic_jobs_one_off_test.py',
    'core/domain/topic_services.py',
    'core/domain/topic_services_test.py',
    'core/domain/topic_validators.py',
    'core/domain/topic_validators_test.py',
    'core/domain/translatable_object_registry.py',
    'core/domain/translatable_object_registry_test.py',
    'core/domain/translation_domain.py',
    'core/domain/translation_domain_test.py',
    'core/domain/translation_fetchers.py',
    'core/domain/translation_fetchers_test.py',
    'core/domain/translation_services.py',
    'core/domain/translation_services_test.py',
    'core/domain/translation_validators.py',
    'core/domain/translation_validators_test.py',
    'core/domain/user_domain.py',
    'core/domain/user_domain_test.py',
    'core/domain/user_jobs_one_off.py',
    'core/domain/user_jobs_one_off_test.py',
    'core/domain/user_query_domain.py',
    'core/domain/user_query_domain_test.py',
    'core/domain/user_query_jobs_one_off.py',
    'core/domain/user_query_jobs_one_off_test.py',
    'core/domain/user_query_services.py',
    'core/domain/user_query_services_test.py',
    'core/domain/user_services.py',
    'core/domain/user_services_test.py',
    'core/domain/user_validators.py',
    'core/domain/user_validators_test.py',
    'core/domain/value_generators_domain.py',
    'core/domain/value_generators_domain_test.py',
    'core/domain/visualization_registry.py',
    'core/domain/visualization_registry_test.py',
    'core/domain/voiceover_services.py',
    'core/domain/voiceover_services_test.py',
    'core/domain/wipeout_domain.py',
    'core/domain/wipeout_domain_test.py',
    'core/domain/wipeout_jobs_one_off.py',
    'core/domain/wipeout_jobs_one_off_test.py',
    'core/domain/wipeout_service.py',
    'core/domain/wipeout_service_test.py',
    'core/jobs.py',
    'core/jobs_registry.py',
    'core/jobs_test.py',
    'core/platform/app_identity/gae_app_identity_services.py',
    'core/platform/app_identity/gae_app_identity_services_test.py',
    'core/platform/auth/firebase_auth_services.py',
    'core/platform/auth/firebase_auth_services_test.py',
    'core/platform/bulk_email/dev_mode_bulk_email_services.py',
    'core/platform/bulk_email/dev_mode_bulk_email_services_test.py',
    'core/platform/bulk_email/mailchimp_bulk_email_services.py',
    'core/platform/bulk_email/mailchimp_bulk_email_services_test.py',
    'core/platform/cache/redis_cache_services.py',
    'core/platform/cache/redis_cache_services_test.py',
    'core/platform/cloud_translate/cloud_translate_emulator.py',
    'core/platform/cloud_translate/cloud_translate_emulator_test.py',
    'core/platform/cloud_translate/cloud_translate_services.py',
    'core/platform/cloud_translate/cloud_translate_services_test.py',
    'core/platform/cloud_translate/dev_mode_cloud_translate_services.py',
    'core/platform/cloud_translate/dev_mode_cloud_translate_services_test.py',
    'core/platform/datastore/gae_datastore_services.py',
    'core/platform/datastore/gae_datastore_services_test.py',
    'core/platform/email/dev_mode_email_services.py',
    'core/platform/email/dev_mode_email_services_test.py',
    'core/platform/email/mailgun_email_services.py',
    'core/platform/email/mailgun_email_services_test.py',
    'core/platform/models.py',
    'core/platform/models_test.py',
    'core/platform/search/elastic_search_services.py',
    'core/platform/search/elastic_search_services_test.py',
    'core/platform/search/gae_search_services.py',
    'core/platform/search/gae_search_services_test.py',
    'core/platform/taskqueue/cloud_taskqueue_services.py',
    'core/platform/taskqueue/cloud_taskqueue_services_test.py',
    'core/platform/taskqueue/cloud_tasks_emulator.py',
    'core/platform/taskqueue/cloud_tasks_emulator_test.py',
    'core/platform/taskqueue/dev_mode_taskqueue_services.py',
    'core/platform/taskqueue/dev_mode_taskqueue_services_test.py',
    'core/platform/transactions/gae_transaction_services.py',
    'core/platform_feature_list.py',
    'core/platform_feature_list_test.py',
    'core/storage/activity/gae_models.py',
    'core/storage/activity/gae_models_test.py',
    'core/storage/app_feedback_report/gae_models.py',
    'core/storage/app_feedback_report/gae_models_test.py',
    'core/storage/audit/gae_models.py',
    'core/storage/audit/gae_models_test.py',
    'core/storage/auth/gae_models.py',
    'core/storage/auth/gae_models_test.py',
    'core/storage/base_model/gae_models.py',
    'core/storage/base_model/gae_models_test.py',
    'core/storage/beam_job/gae_models.py',
    'core/storage/beam_job/gae_models_test.py',
    'core/storage/blog/gae_models.py',
    'core/storage/blog/gae_models_test.py',
    'core/storage/classifier/gae_models.py',
    'core/storage/classifier/gae_models_test.py',
    'core/storage/collection/gae_models.py',
    'core/storage/collection/gae_models_test.py',
    'core/storage/config/gae_models.py',
    'core/storage/config/gae_models_test.py',
    'core/storage/email/gae_models.py',
    'core/storage/email/gae_models_test.py',
    'core/storage/exploration/gae_models.py',
    'core/storage/exploration/gae_models_test.py',
    'core/storage/feedback/gae_models.py',
    'core/storage/feedback/gae_models_test.py',
    'core/storage/improvements/gae_models.py',
    'core/storage/improvements/gae_models_test.py',
    'core/storage/job/gae_models.py',
    'core/storage/job/gae_models_test.py',
    'core/storage/opportunity/gae_models.py',
    'core/storage/opportunity/gae_models_test.py',
    'core/storage/question/gae_models.py',
    'core/storage/question/gae_models_test.py',
    'core/storage/recommendations/gae_models.py',
    'core/storage/recommendations/gae_models_test.py',
    'core/storage/skill/gae_models.py',
    'core/storage/skill/gae_models_test.py',
    'core/storage/statistics/gae_models.py',
    'core/storage/statistics/gae_models_test.py',
    'core/storage/storage_models_test.py',
    'core/storage/story/gae_models.py',
    'core/storage/story/gae_models_test.py',
    'core/storage/subtopic/gae_models.py',
    'core/storage/subtopic/gae_models_test.py',
    'core/storage/suggestion/gae_models.py',
    'core/storage/suggestion/gae_models_test.py',
    'core/storage/topic/gae_models.py',
    'core/storage/topic/gae_models_test.py',
    'core/storage/translation/gae_models.py',
    'core/storage/translation/gae_models_test.py',
    'core/storage/user/gae_models.py',
    'core/storage/user/gae_models_test.py',
    'core/tests/build_sources/extensions/CodeRepl.py',
    'core/tests/build_sources/extensions/DragAndDropSortInput.py',
    'core/tests/build_sources/extensions/base.py',
    'core/tests/build_sources/extensions/base_test.py',
    'core/tests/build_sources/extensions/models_test.py',
    'core/tests/data/failing_tests.py',
    'core/tests/data/image_constants.py',
    'core/tests/data/unicode_and_str_handler.py',
    'core/tests/gae_suite.py',
    'core/tests/gae_suite_test.py',
    'core/tests/load_tests/feedback_thread_summaries_test.py',
    'core/tests/test_utils.py',
    'core/tests/test_utils_test.py',
    'extensions/actions/AnswerSubmit/AnswerSubmit.py',
    'extensions/actions/ExplorationQuit/ExplorationQuit.py',
    'extensions/actions/ExplorationStart/ExplorationStart.py',
    'extensions/actions/base.py',
    'extensions/actions/base_test.py',
    'extensions/answer_summarizers/models.py',
    'extensions/answer_summarizers/models_test.py',
    'extensions/domain.py',
    'extensions/domain_test.py',
    # A single file in two lines.
    'extensions/interactions/AlgebraicExpressionInput/'
    'AlgebraicExpressionInput.py',
    'extensions/interactions/CodeRepl/CodeRepl.py',
    'extensions/interactions/Continue/Continue.py',
    'extensions/interactions/DragAndDropSortInput/DragAndDropSortInput.py',
    'extensions/interactions/EndExploration/EndExploration.py',
    'extensions/interactions/FractionInput/FractionInput.py',
    'extensions/interactions/GraphInput/GraphInput.py',
    'extensions/interactions/ImageClickInput/ImageClickInput.py',
    'extensions/interactions/InteractiveMap/InteractiveMap.py',
    'extensions/interactions/ItemSelectionInput/ItemSelectionInput.py',
    'extensions/interactions/LogicProof/LogicProof.py',
    'extensions/interactions/MathEquationInput/MathEquationInput.py',
    'extensions/interactions/MultipleChoiceInput/MultipleChoiceInput.py',
    'extensions/interactions/MusicNotesInput/MusicNotesInput.py',
    'extensions/interactions/NumberWithUnits/NumberWithUnits.py',
    'extensions/interactions/NumericExpressionInput/NumericExpressionInput.py',
    'extensions/interactions/NumericInput/NumericInput.py',
    'extensions/interactions/PencilCodeEditor/PencilCodeEditor.py',
    'extensions/interactions/RatioExpressionInput/RatioExpressionInput.py',
    'extensions/interactions/SetInput/SetInput.py',
    'extensions/interactions/TextInput/TextInput.py',
    'extensions/interactions/base.py',
    'extensions/interactions/base_test.py',
    'extensions/issues/CyclicStateTransitions/CyclicStateTransitions.py',
    'extensions/issues/EarlyQuit/EarlyQuit.py',
    # A single file in two lines.
    'extensions/issues/MultipleIncorrectSubmissions/'
    'MultipleIncorrectSubmissions.py',
    'extensions/issues/base.py',
    'extensions/issues/base_test.py',
    'extensions/objects/models/objects.py',
    'extensions/objects/models/objects_test.py',
    'extensions/rich_text_components/components.py',
    'extensions/rich_text_components/components_test.py',
    'extensions/value_generators/models/generators.py',
    'extensions/value_generators/models/generators_test.py',
    'extensions/visualizations/models.py',
    'jobs/base_jobs.py',
    'jobs/base_jobs_test.py',
    'jobs/batch_jobs/validation_jobs.py',
    'jobs/batch_jobs/validation_jobs_test.py',
    'jobs/decorators/validation_decorators.py',
    'jobs/decorators/validation_decorators_test.py',
    'jobs/io/job_io.py',
    'jobs/io/job_io_test.py',
    'jobs/io/ndb_io.py',
    'jobs/io/ndb_io_test.py',
    'jobs/io/stub_io.py',
    'jobs/io/stub_io_test.py',
    'jobs/job_options.py',
    'jobs/job_options_test.py',
    'jobs/job_test_utils.py',
    'jobs/job_test_utils_test.py',
    'jobs/job_utils.py',
    'jobs/job_utils_test.py',
    'jobs/registry.py',
    'jobs/registry_test.py',
    'jobs/transforms/auth_validation.py',
    'jobs/transforms/auth_validation_test.py',
    'jobs/transforms/base_validation.py',
    'jobs/transforms/base_validation_registry.py',
    'jobs/transforms/base_validation_registry_test.py',
    'jobs/transforms/base_validation_test.py',
    'jobs/transforms/collection_validation.py',
    'jobs/transforms/collection_validation_test.py',
    'jobs/transforms/config_validation.py',
    'jobs/transforms/config_validation_test.py',
    'jobs/transforms/exp_validation.py',
    'jobs/transforms/exp_validation_test.py',
    'jobs/transforms/feedback_validation.py',
    'jobs/transforms/feedback_validation_test.py',
    'jobs/transforms/improvements_validation.py',
    'jobs/transforms/improvements_validation_test.py',
    'jobs/transforms/question_validation.py',
    'jobs/transforms/question_validation_test.py',
    'jobs/transforms/topic_validation.py',
    'jobs/transforms/topic_validation_test.py',
    'jobs/transforms/user_validation.py',
    'jobs/transforms/user_validation_test.py',
    'jobs/types/base_validation_errors.py',
    'jobs/types/base_validation_errors_test.py',
    'jobs/types/feedback_validation_errors.py',
    'jobs/types/feedback_validation_errors_test.py',
    'jobs/types/improvements_validation_errors.py',
    'obs/types/improvements_validation_errors_test.py',
    'jobs/types/job_run_result.py',
    'jobs/types/job_run_result_test.py',
    'jobs/types/model_property.py',
    'jobs/types/model_property_test.py',
    'jobs/types/topic_validation_errors.py',
    'jobs/types/topic_validation_errors_test.py',
    'jobs/types/user_validation_errors.py',
    'jobs/types/user_validation_errors_test.py',
    'python_utils.py',
    'python_utils_test.py',
    'scripts/build.py',
    'scripts/build_test.py',
    'scripts/check_e2e_tests_are_captured_in_ci.py',
    'scripts/check_e2e_tests_are_captured_in_ci_test.py',
    'scripts/check_frontend_test_coverage.py',
    'scripts/check_frontend_test_coverage_test.py',
    'scripts/check_if_pr_is_low_risk.py',
    'scripts/check_if_pr_is_low_risk_test.py',
    'scripts/clean.py',
    'scripts/clean_test.py',
    'scripts/common.py',
    'scripts/common_test.py',
    'scripts/concurrent_task_utils.py',
    'scripts/concurrent_task_utils_test.py',
    'scripts/create_expression_parser.py',
    'scripts/create_topological_sort_of_all_services.py',
    'scripts/create_topological_sort_of_all_services_test.py',
    'scripts/docstrings_checker.py',
    'scripts/docstrings_checker_test.py',
    'scripts/flake_checker.py',
    'scripts/flake_checker_test.py',
    'scripts/install_backend_python_libs.py',
    'scripts/install_backend_python_libs_test.py',
    'scripts/install_chrome_for_ci.py',
    'scripts/install_chrome_for_ci_test.py',
    'scripts/install_third_party.py',
    'scripts/install_third_party_libs.py',
    'scripts/install_third_party_libs_test.py',
    'scripts/install_third_party_test.py',
    'scripts/linters/codeowner_linter.py',
    'scripts/linters/codeowner_linter_test.py',
    'scripts/linters/css_linter.py',
    'scripts/linters/css_linter_test.py',
    'scripts/linters/general_purpose_linter.py',
    'scripts/linters/general_purpose_linter_test.py',
    'scripts/linters/html_linter.py',
    'scripts/linters/html_linter_test.py',
    'scripts/linters/js_ts_linter.py',
    'scripts/linters/js_ts_linter_test.py',
    'scripts/linters/linter_utils.py',
    'scripts/linters/linter_utils_test.py',
    'scripts/linters/other_files_linter.py',
    'scripts/linters/other_files_linter_test.py',
    'scripts/linters/pre_commit_linter.py',
    'scripts/linters/pre_commit_linter_test.py',
    'scripts/linters/pylint_extensions.py',
    'scripts/linters/pylint_extensions_test.py',
    'scripts/linters/python_linter.py',
    'scripts/linters/python_linter_test.py',
    'scripts/linters/warranted_angular_security_bypasses.py',
    'scripts/pre_commit_hook.py',
    'scripts/pre_commit_hook_test.py',
    'scripts/pre_push_hook.py',
    'scripts/pre_push_hook_test.py',
    'scripts/regenerate_requirements.py',
    'scripts/regenerate_requirements_test.py',
    'scripts/release_scripts/cut_release_or_hotfix_branch.py',
    'scripts/release_scripts/cut_release_or_hotfix_branch_test.py',
    'scripts/release_scripts/repo_specific_changes_fetcher.py',
    'scripts/release_scripts/repo_specific_changes_fetcher_test.py',
    'scripts/release_scripts/update_changelog_and_credits.py',
    'scripts/release_scripts/update_changelog_and_credits_test.py',
    'scripts/release_scripts/update_configs.py',
    'scripts/release_scripts/update_configs_test.py',
    'scripts/run_backend_tests.py',
    'scripts/run_custom_eslint_tests.py',
    'scripts/run_e2e_tests.py',
    'scripts/run_e2e_tests_test.py',
    'scripts/run_frontend_tests.py',
    'scripts/run_lighthouse_tests.py',
    'scripts/run_mypy_checks.py',
    'scripts/run_mypy_checks_test.py',
    'scripts/run_portserver.py',
    'scripts/run_presubmit_checks.py',
    'scripts/run_tests.py',
    'scripts/script_import_test.py',
    'scripts/scripts_test_utils.py',
    'scripts/scripts_test_utils_test.py',
    'scripts/servers.py',
    'scripts/servers_test.py',
    'scripts/setup.py',
    'scripts/setup_gae.py',
    'scripts/setup_gae_test.py',
    'scripts/setup_test.py',
    'scripts/start.py',
    'scripts/third_party_size_check.py',
    'scripts/typescript_checks.py',
    'scripts/typescript_checks_test.py',
]


CONFIG_FILE_PATH = os.path.join('.', 'mypy.ini')
MYPY_REQUIREMENTS_FILE_PATH = os.path.join('.', 'mypy_requirements.txt')
MYPY_TOOLS_DIR = os.path.join(os.getcwd(), 'third_party', 'python3_libs')
PYTHON3_CMD = 'python3'


_PARSER = argparse.ArgumentParser(
    description='Python type checking using mypy script.'
)

_PARSER.add_argument(
    '--skip-install',
    help='If passed, skips installing dependencies.'
    ' By default, they are installed.',
    action='store_true')

_PARSER.add_argument(
    '--install-globally',
    help='optional; if specified, installs mypy and its requirements globally.'
    ' By default, they are installed to %s' % MYPY_TOOLS_DIR,
    action='store_true')

_PARSER.add_argument(
    '--files',
    help='Files to type-check',
    action='store',
    nargs='+'
)


def install_third_party_libraries(skip_install):
    """Run the installation script.

    Args:
        skip_install: bool. Whether to skip running the installation script.
    """
    if not skip_install:
        install_third_party_libs.main()


def get_mypy_cmd(files, using_global_mypy):
    """Return the appropriate command to be run.

    Args:
        files: list(list(str)). List having first element as list of string.
        using_global_mypy: bool. Whether generated command should run using
            global mypy.

    Returns:
        list(str). List of command line arguments.
    """
    if using_global_mypy:
        mypy_cmd = 'mypy'
    else:
        mypy_cmd = os.path.join(
            os.getcwd(), 'third_party', 'python3_libs', 'bin', 'mypy')
    if files:
        cmd = [mypy_cmd, '--config-file', CONFIG_FILE_PATH] + files
    else:
        excluded_files_regex = (
            '|'.join(NOT_FULLY_COVERED_FILES + EXCLUDED_DIRECTORIES))
        cmd = [
            mypy_cmd, '--exclude', excluded_files_regex,
            '--config-file', CONFIG_FILE_PATH, '.'
        ]
    return cmd


def install_mypy_prerequisites(install_globally):
    """Install mypy and type stubs from mypy_requirements.txt.

    Args:
        install_globally: bool. Whether mypy and its requirements are to be
            installed globally.

    Returns:
        int. The return code from installing prerequisites.
    """
    # TODO(#13398): Change MyPy installation after Python3 migration. Now, we
    # install packages globally for CI. In CI, pip installation is not in a way
    # we expect.
    if install_globally:
        cmd = [
            PYTHON3_CMD, '-m', 'pip', 'install', '-r',
            MYPY_REQUIREMENTS_FILE_PATH
        ]
    else:
        cmd = [
            PYTHON3_CMD, '-m', 'pip', 'install', '-r',
            MYPY_REQUIREMENTS_FILE_PATH, '--target', MYPY_TOOLS_DIR,
            '--upgrade'
        ]
    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output = process.communicate()
    if 'can\'t combine user with prefix' in output[1]:
        uextention_text = ['--user', '--prefix=', '--system']
        process = subprocess.Popen(
            cmd + uextention_text, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)

    return process.returncode


def main(args=None):
    """Runs the MyPy type checks."""
    parsed_args = _PARSER.parse_args(args=args)

    for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
        # The directories should only be inserted starting at index 1. See
        # https://stackoverflow.com/a/10095099 and
        # https://stackoverflow.com/q/10095037 for more details.
        sys.path.insert(1, directory)

    install_third_party_libraries(parsed_args.skip_install)
    common.fix_third_party_imports()

    python_utils.PRINT('Installing Mypy and stubs for third party libraries.')
    return_code = install_mypy_prerequisites(parsed_args.install_globally)
    if return_code != 0:
        python_utils.PRINT(
            'Cannot install Mypy and stubs for third party libraries.')
        sys.exit(1)

    python_utils.PRINT(
        'Installed Mypy and stubs for third party libraries.')

    python_utils.PRINT('Starting Mypy type checks.')
    cmd = get_mypy_cmd(
        parsed_args.files, parsed_args.install_globally)

    _paths_to_insert = [
        MYPY_TOOLS_DIR,
        os.path.join(MYPY_TOOLS_DIR, 'bin'),
    ]
    env = os.environ.copy()
    for path in _paths_to_insert:
        env['PATH'] = '%s%s' % (path, os.pathsep) + env['PATH']
    env['PYTHONPATH'] = MYPY_TOOLS_DIR

    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    stdout, stderr = process.communicate()
    python_utils.PRINT(stdout)
    python_utils.PRINT(stderr)
    if process.returncode == 0:
        python_utils.PRINT('Mypy type checks successful.')
    else:
        python_utils.PRINT(
            'Mypy type checks unsuccessful. Please fix the errors. '
            'For more information, visit: '
            'https://github.com/oppia/oppia/wiki/Backend-Type-Annotations')
        sys.exit(1)
    return process.returncode


if __name__ == '__main__': # pragma: no cover
    main()
