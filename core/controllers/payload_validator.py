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

"""Validates handler args against its schema by calling schema utils.
Also contains a list of handler class names which does not contain the schema.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import schema_utils

from typing import Any, Dict, List, Text, Tuple # isort:skip  pylint: disable= wrong-import-order, wrong-import-position, unused-import, import-only-modules


def validate(handler_args, handler_args_schemas, allowed_extra_args):
    # type: (Any, Any, bool) -> Tuple[Dict[Any, Any], List[Text]]

    """Calls schema utils for normalization of object against its schema
    and collects all the errors.

    Args:
        handler_args: *. Object for normalization.
        handler_args_schemas: dict. Schema for args.
        allowed_extra_args: bool. Whether extra args are allowed in handler.

    Returns:
        *. A two tuple, where the first element represents the normalized value
        in dict format and the second element represents the lists of errors
        after validation.
    """
    # Collect all errors and present them at once.
    errors = []
    normalized_value = {}
    for arg_key, arg_schema in handler_args_schemas.items():

        if arg_key not in handler_args or handler_args[arg_key] is None:
            if ('default_value' in arg_schema and
                    arg_schema['default_value'] is None):
                # Skip validation for optional cases.
                continue
            elif ('default_value' in arg_schema and
                  arg_schema['default_value'] is not None):
                handler_args[arg_key] = arg_schema['default_value']
            elif 'default_value' not in arg_schema:
                errors.append('Missing key in handler args: %s.' % arg_key)
                continue

        try:
            normalized_value[arg_key] = schema_utils.normalize_against_schema(
                handler_args[arg_key], arg_schema['schema'])
        except Exception as e:
            errors.append(
                'Schema validation for \'%s\' failed: %s' % (arg_key, e))

    extra_args = set(handler_args.keys()) - set(handler_args_schemas.keys())

    if not allowed_extra_args and extra_args:
        errors.append('Found extra args: %s.' % (list(extra_args)))

    return normalized_value, errors


# Handlers which require schema validation, but currently they do
# not have schema. In order to add schema incrementally this list is
# maintained. Please remove the name of the handlers if they already
# contains schema.
HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS = [
    'AboutRedirectPage',
    'AnswerSubmittedEventHandler',
    'AssetDevHandler',
    'AudioUploadHandler',
    'BulkEmailWebhookEndpoint',
    'CollectionSummariesHandler',
    'ConsoleErrorPage',
    'CreatorDashboardHandler',
    'CreatorDashboardPage',
    'DeferredTasksHandler',
    'DeleteAccountHandler',
    'DeleteAccountPage',
    'EditableQuestionDataHandler',
    'EditableSkillDataHandler',
    'EditableStoryDataHandler',
    'EditableSubtopicPageDataHandler',
    'EditableTopicDataHandler',
    'EditorAutosaveHandler',
    'EditorHandler',
    'EmailDashboardDataHandler',
    'EmailDashboardPage',
    'EmailDashboardResultPage',
    'EmailDashboardTestBulkEmailHandler',
    'EmailDashboardCancelEmailHandler',
    'ExplorationActualStartEventHandler',
    'ExplorationCompleteEventHandler',
    'ExplorationEmbedPage',
    'ExplorationFeaturesHandler',
    'ExplorationFileDownloader',
    'ExplorationHandler',
    'ExplorationImprovementsConfigHandler',
    'ExplorationImprovementsHandler',
    'ExplorationImprovementsHistoryHandler',
    'ExplorationMaybeLeaveHandler',
    'ExplorationModeratorRightsHandler',
    'ExplorationPage',
    'ExplorationRevertHandler',
    'ExplorationRightsHandler',
    'ExplorationSnapshotsHandler',
    'ExplorationStartEventHandler',
    'ExplorationStatisticsHandler',
    'ExplorationStatusHandler',
    'ExplorationSummariesHandler',
    'ExportAccountHandler',
    'FeedbackStatsHandler',
    'FeedbackThreadStatusChangeEmailHandler',
    'FeedbackThreadViewEventHandler',
    'FetchIssuesHandler',
    'FetchPlaythroughHandler',
    'FetchSkillsHandler',
    'FlagExplorationEmailHandler',
    'FlagExplorationHandler',
    'ForumRedirectPage',
    'FoundationRedirectPage',
    'FractionLandingRedirectPage',
    'ImageUploadHandler',
    'IncomingReplyEmailHandler',
    'InstantFeedbackMessageEmailHandler',
    'JobOutputHandler',
    'JobsHandler',
    'LearnerAnswerDetailsSubmissionHandler',
    'LearnerAnswerInfoHandler',
    'LearnerDashboardFeedbackThreadHandler',
    'LearnerDashboardHandler',
    'LearnerDashboardIdsHandler',
    'LearnerDashboardPage',
    'LearnerGoalsHandler',
    'LearnerIncompleteActivityHandler',
    'LearnerPlaylistHandler',
    'LeaveForRefresherExpEventHandler',
    'LibraryGroupIndexHandler',
    'LibraryGroupPage',
    'LibraryIndexHandler',
    'LibraryPage',
    'LibraryRedirectPage',
    'MemoryCacheAdminHandler',
    'MemoryCacheHandler',
    'MergeSkillHandler',
    'NewCollectionHandler',
    'NewExplorationHandler',
    'NewSkillHandler',
    'NewTopicHandler',
    'NotificationHandler',
    'NotificationsDashboardHandler',
    'NotificationsDashboardPage',
    'NotificationsHandler',
    'OldContributorDashboardRedirectPage',
    'OldCreatorDashboardRedirectPage',
    'OldLearnerDashboardRedirectPage',
    'OldLibraryRedirectPage',
    'OldNotificationsDashboardRedirectPage',
    'PendingAccountDeletionPage',
    'PlatformFeatureDummyHandler',
    'PlatformFeaturesEvaluationHandler',
    'PracticeSessionsPage',
    'PracticeSessionsPageDataHandler',
    'PreferenceHandler',
    'PreferencesHandler',
    'PreferencesPage',
    'PretestHandler',
    'ProfileHandler',
    'ProfilePage',
    'ProfilePictureHandler',
    'ProfilePictureHandlerByUsernameHandler',
    'PromoBarHandler',
    'QuebstionsListHandler',
    'QueryStatusCheckHandler',
    'QuestionCountDataHandler',
    'QuestionCreationHandler',
    'QuestionPlayerHandler',
    'QuestionSkillLinkHandler',
    'QuestionsListHandler',
    'RatingHandler',
    'ReaderFeedbackHandler',
    'RecentCommitsHandler',
    'RecentFeedbackMessagesHandler',
    'RecommendationsHandler',
    'ReleaseCoordinatorPage',
    'ResolveIssueHandler',
    'ResubmitSuggestionHandler',
    'ReviewTestsPage',
    'ReviewTestsPageDataHandler',
    'ReviewableSuggestionsHandler',
    'SearchHandler',
    'SignupHandler',
    'SignupPage',
    'SiteLanguageHandler',
    'SkillDataHandler',
    'SkillDescriptionHandler',
    'SkillEditorPage',
    'SkillMasteryDataHandler',
    'SkillRightsHandler',
    'SkillsDashboardPageDataHandler',
    'SolutionHitEventHandler',
    'StartedTranslationTutorialEventHandler',
    'StartedTutorialEventHandler',
    'StateAnswerStatisticsHandler',
    'StateCompleteEventHandler',
    'StateHitEventHandler',
    'StateYamlHandler',
    'StateInteractionStatsHandler',
    'StatsEventsHandler',
    'StewardsLandingPage',
    'StorePlaythroughHandler',
    'StoryEditorPage',
    'StoryPage',
    'StoryPageDataHandler',
    'StoryProgressHandler',
    'StoryPublishHandler',
    'StoryUrlFragmentHandler',
    'SubscribeHandler',
    'SubtopicPageDataHandler',
    'SubtopicViewerPage',
    'SuggestionEmailHandler',
    'SuggestionHandler',
    'SuggestionListHandler',
    'SuggestionToExplorationActionHandler',
    'SuggestionToSkillActionHandler',
    'SuggestionsProviderHandler',
    'TeachRedirectPage',
    'ThreadHandler',
    'ThreadListHandler',
    'ThreadListHandlerForTopicsHandler',
    'TopUnresolvedAnswersHandler',
    'TopicAssignmentsHandler',
    'TopicEditorPage',
    'TopicEditorStoryHandler',
    'TopicLandingPage',
    'TopicLandingRedirectPage',
    'TopicNameHandler',
    'TopicPageDataHandler',
    'TopicPublishHandler',
    'TopicPublishSendMailHandler',
    'TopicRightsHandler',
    'TopicUrlFragmentHandler',
    'TopicViewerPage',
    'TopicsAndSkillsDashboardPage',
    'TopicsAndSkillsDashboardPageDataHandler',
    'UnsentFeedbackEmailHandler',
    'UnsubscribeHandler',
    'UpdateQuestionSuggestionHandler',
    'UpdateTranslationSuggestionHandler',
    'UploadExplorationHandler',
    'UrlHandler',
    'UserExplorationEmailsHandler',
    'UserExplorationPermissionsHandler',
    'UserInfoHandler',
    'UserSubmittedSuggestionsHandler',
    'UsernameCheckHandler',
    'ValidateExplorationsHandler',
    'ValueGeneratorHandler',
    'VoiceArtistManagementHandler'
    ]

# These handlers do not require any schema validation.
HANDLER_CLASS_NAMES_WHICH_DO_NOT_REQUIRE_SCHEMAS = [
    'SessionBeginHandler',
    'SessionEndHandler',
    'OppiaMLVMHandler',
    'CsrfTokenHandler',
    'Error404Handler',
    'FrontendErrorHandler',
    'WarmupPage',
    'HomePageRedirectPage',
    'SplashRedirectPage',
    'SeedFirebaseHandler'
]

# HANDLER_CLASS_NAMES_WITH_NO_SCHEMA is addressed everywhere in the
# code since, HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS is temporary and
# will be removed once every handlers in controller layer will become
# ready for schema validation.
HANDLER_CLASS_NAMES_WITH_NO_SCHEMA = (
    HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS +
    HANDLER_CLASS_NAMES_WHICH_DO_NOT_REQUIRE_SCHEMAS)
