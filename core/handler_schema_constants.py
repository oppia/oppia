# coding: utf-8

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

# Handlers which require schema validation, but currently they do
# not have schema. In order to add schema incrementally this list is
# maintained. Please remove the name of the handlers if they already
# contains schema.

"""Contains a list of handler class names that do not contain schemas.
This is a temporary file which will be removed once all of the handlers
mentioned in the list have a schema. This file resides in this folder as
it will be used  by both scripts/ and core/, and hence would be easier to
import from this location.
"""

from __future__ import annotations

HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS = [
    'AssetDevHandler',
    'AudioUploadHandler',
    'BulkEmailWebhookEndpoint',
    'DeferredTasksHandler',
    'DeleteAccountPage',
    'EditableQuestionDataHandler',
    'EditableStoryDataHandler',
    'FeedbackThreadStatusChangeEmailHandler',
    'FlagExplorationEmailHandler',
    'IncomingReplyEmailHandler',
    'InstantFeedbackMessageEmailHandler',
    'LearnerAnswerDetailsSubmissionHandler',
    'LearnerGoalsHandler',
    'LeaveForRefresherExpEventHandler',
    'MemoryCacheAdminHandler',
    'MergeSkillHandler',
    'NewTopicHandler',
    'NotificationHandler',
    'NotificationsDashboardHandler',
    'NotificationsDashboardPage',
    'NotificationsHandler',
    'OldNotificationsDashboardRedirectPage',
    'PendingAccountDeletionPage',
    'PreferenceHandler',
    'PreferencesHandler',
    'ProfilePage',
    'QuestionCountDataHandler',
    'QuestionCreationHandler',
    'QuestionPlayerHandler',
    'QuestionSkillLinkHandler',
    'RecentCommitsHandler',
    'ResubmitSuggestionHandler',
    'SkillDataHandler',
    'SkillDescriptionHandler',
    'StartedTranslationTutorialEventHandler',
    'StateCompleteEventHandler',
    'StateHitEventHandler',
    'SubtopicPageDataHandler',
    'SuggestionEmailHandler',
    'SuggestionListHandler',
    'SuggestionToExplorationActionHandler',
    'SuggestionToSkillActionHandler',
    'SuggestionsProviderHandler',
    'TopicPageDataHandler',
    'TopicsAndSkillsDashboardPage',
    'UnsentFeedbackEmailHandler',
    'UpdateQuestionSuggestionHandler',
    'UpdateTranslationSuggestionHandler',
    'ValidateExplorationsHandler',
    'ValueGeneratorHandler',
    'VoiceArtistManagementHandler',
    'OppiaMLVMHandler',
    'CsrfTokenHandler',
    'Error404Handler',
    'FrontendErrorHandler',
    'WarmupPage',
    'HomePageRedirectPage',
    'SplashRedirectPage'
]

# These handlers do not require any schema validation.
HANDLER_CLASS_NAMES_WHICH_DO_NOT_REQUIRE_SCHEMAS = [
    'SessionBeginHandler',
    'SessionEndHandler',
    'SeedFirebaseHandler',
    # Oppia root page is the unified entry for page routes to the frontend.
    # So, it should exempted from schema validation.
    'OppiaRootPage',
    'OppiaLightweightRootPage'
]

# HANDLER_CLASS_NAMES_WITH_NO_SCHEMA is addressed everywhere in the
# code since, HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS is temporary and
# will be removed once every handlers in controller layer will become
# ready for schema validation.
HANDLER_CLASS_NAMES_WITH_NO_SCHEMA = (
    HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS +
    HANDLER_CLASS_NAMES_WHICH_DO_NOT_REQUIRE_SCHEMAS)
