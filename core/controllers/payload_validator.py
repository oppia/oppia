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


def construct_args_schema(arg_key, arg_schema, handler_args):
    """This constructs the schema for missing or None valued argument.

    Args:
        arg_key: str. Name of the argument.
        arg_schema: dict. Schema of the argument.
        handler_args: dict. Key value pair of name and values of arguments
            coming from payloads or requests or url path elements.

    Returns:
        *. A 2-tuple, the first element of which is the value of the argument,
        it may be empty dict if initially it was None valued or missing in the
        handler args. The second element is the schema of the argument
        represented in dict.
    """
    value = {}
    schema = {}
    if arg_key not in handler_args or handler_args[arg_key] is None:
        schema['type'] = 'dict'
        properties = [{
            'name': arg_key,
            'schema': arg_schema
        }]
        schema['properties'] = properties
    else:
        value = handler_args[arg_key]
        schema = arg_schema

    return value, schema


def validate(handler_args, handler_args_schemas, allowed_extra_args):
    """Calls schema utils for normalization of object against its schema
    and collects all the errors.

    Args:
        handler_args: *. Object for normalization.
        handler_args_schemas: dict. Schema for args.
        allowed_extra_args: bool. Whether extra args are allowed in handler.

    Returns:
        errors: list(str). List of all errors.
    """
    # Collect all errors and present them at once.
    errors = []
    for arg_key, arg_schema in handler_args_schemas.items():
        value, schema = construct_args_schema(arg_key, arg_schema, handler_args)

        try:
            schema_utils.normalize_against_schema(value, schema)
        except Exception as e:
            errors.append(
                'Schema validation for \'%s\' failed: %s' % (arg_key, e))

    extra_args = set(handler_args.keys()) - set(handler_args_schemas.keys())

    if not allowed_extra_args and extra_args:
        errors.append('Found extra args: %s.' % (list(extra_args)))

    return errors


# Handlers which require schema validation, but currently they do
# not have schema. In order to add schema incrementally this list is
# maintained. Please remove the name of the handlers if they already
# contains schema.
HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS = [
    'AboutRedirectPage',
    'AddContributionRightsHandler',
    'AdminHandler',
    'AdminPage',
    'AdminRoleHandler',
    'AdminSuperAdminPrivilegesHandler',
    'AdminTopicsCsvFileDownloader',
    'AnswerSubmittedEventHandler',
    'AssetDevHandler',
    'AudioUploadHandler',
    'ClassroomDataHandler',
    'ClassroomPage',
    'ClassroomPromosStatusHandler',
    'CollectionRightsHandler',
    'CollectionDataHandler',
    'CollectionEditorHandler',
    'CollectionEditorPage',
    'CollectionPage',
    'CollectionPublishHandler',
    'CollectionRightsHandler',
    'CollectionSummariesHandler',
    'CollectionUnpublishHandler',
    'ConceptCardDataHandler',
    'ConsoleErrorPage',
    'ContributionOpportunitiesHandler',
    'ContributionRightsDataHandler',
    'ContributorDashboardPage',
    'ContributorRightsDataHandler',
    'ContributorUsersListHandler',
    'CreatorDashboardHandler',
    'CreatorDashboardPage',
    'CronActivitySearchRankHandler',
    'CronDashboardStatsHandler',
    'CronExplorationRecommendationsHandler',
    'CronFullyCompleteUserDeletionHandler',
    'CronMailAdminContributorDashboardBottleneckHandler',
    'CronMailAdminContributorDashboardBottlenecksHandler',
    'CronMailReviewerContributorDashboardSuggestionsHandler',
    'CronMailReviewersContributorDashboardSuggestionsHandler',
    'CronMapreduceCleanupHandler',
    'CronModelsCleanupHandler',
    'CronUserDeletionHandler',
    'DataExtractionQueryHandler',
    'DefaultClassroomRedirectPage',
    'DeferredTasksHandler',
    'DeleteAccountHandler',
    'DeleteAccountPage',
    'DeleteUserHandler',
    'EditableCollectionDataHandler',
    'EditableQuestionDataHandler',
    'EditableSkillDataHandler',
    'EditableStoryDataHandler',
    'EditableSubtopicPageDataHandler',
    'EditableTopicDataHandler',
    'EditorAutosaveHandler',
    'EditorHandler',
    'EmailDashboardCancelEmailHandler',
    'EmailDashboardDataHandler',
    'EmailDashboardPage',
    'EmailDashboardResultPage',
    'EmailDashboardTestBulkEmailHandler',
    'EmailDashboardcancelEmailHandler',
    'EmailDraftHandler',
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
    'ExplorationMetadataSearchHandler',
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
    'FeaturedActivitiesHandler',
    'FeaturedTranslationLanguagesHandler',
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
    'JobStatusMailerHandler',
    'JobsHandler',
    'LearnerAnswerDetailsSubmissionHandler',
    'LearnerAnswerInfoHandler',
    'LearnerDashboardFeedbackThreadHandler',
    'LearnerDashboardHandler',
    'LearnerDashboardIdsHandler',
    'LearnerDashboardPage',
    'LearnerIncompleteActivityHandler',
    'LearnerPlaylistHandler',
    'LeaveForRefresherExpEventHandler',
    'LibraryGroupIndexHandler',
    'LibraryGroupPage',
    'LibraryIndexHandler',
    'LibraryPage',
    'LibraryRedirectPage',
    'MachineTranslationStateTextsHandler',
    'MemoryCacheAdminHandler',
    'MemoryCacheHandler',
    'MergeSkillHandler',
    'ModeratorPage',
    'NewCollectionHandler',
    'NewExplorationHandler',
    'NewSkillHandler',
    'NewTopicHandler',
    'NextJobHandler',
    'NotificationHandler',
    'NotificationsDashboardHandler',
    'NotificationsDashboardPage',
    'NotificationsHandler',
    'NumberOfDeletionRequestsHandler',
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
    'RemoveContributionRightsHandler',
    'ResolveIssueHandler',
    'ResubmitSuggestionHandler',
    'ReviewTestsPage',
    'ReviewTestsPageDataHandler',
    'ReviewableSuggestionsHandler',
    'SearchHandler',
    'SendDummyMailToAdminHandler',
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
    'StateInteractionStatsHandler',
    'StateYamlHandler',
    'StateinteractionStatsHandler',
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
    'ThreadListHandlerForTopicHandler',
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
    'TrainedClassifierHandler',
    'TranslatableTextHandler',
    'UnsentFeedbackEmailHandler',
    'UnsubscribeHandler',
    'UpdateQuestionSuggestionHandler',
    'UpdateTranslationSuggestionHandler',
    'UpdateUsernameHandler',
    'UploadExplorationHandler',
    'UrlHandler',
    'UserContributionRightsDataHandler',
    'UserExplorationEmailsHandler',
    'UserExplorationPermissionsHandler',
    'UserInfoHandler',
    'UserSubmittedSuggestionsHandler',
    'UsernameCheckHandler',
    'ValidateExplorationsHandler',
    'ValueGeneratorHandler',
    'VerifyUserModelsDeletedHandler'
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
