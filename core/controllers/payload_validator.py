# coding: utf-8

# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import schema_utils
import python_utils

def construct_args_schema(arg_key, arg_schema, handler_args):
    """Constructs the schema for missing or None valued argument.

    Args:
        arg_key: str. Name of the argument.
        arg_schema: dict. Schema of the argument.
        handler_args: dict. Key value pair of name and values of arguments
            coming from payloads or requests or url path elements.

    Returns:
        value: dict. Value of the argument, empty dict if initially it was
            None valued or missing in handler_args.
        schema: dict: Schema of the argument.
    """
    value = {}
    schema = {}
    if arg_key not in handler_args or handler_args[arg_key] == None:
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

def validate(handler_args, handler_args_schema, allowed_extra_args):
    """Calls schema utils for normalization of object against its schema
    and collects all the errors.

    Args:
        handler_args: *. Object for normalization.
        handler_args_schema: dict. Schema for objects.
        allowed_extra_args: bool. Allows extra args.

    Returns:
        errors: list(str). List of all errors.
    """
    # Collect all errors and present them at once.
    errors = []
    for arg_key, arg_schema in handler_args_schema.items():
        value, schema = construct_args_schema(arg_key, arg_schema, handler_args)
        try:
            normalized_value = schema_utils.normalize_against_schema(
                value, schema)
        except Exception as e:
            errors.append(
                'Schema validation for \'%s\' failed: %s' % (arg_key, e))

    extra_args = set(handler_args.keys()) - set(handler_args_schema.keys())

    if not allowed_extra_args and extra_args:
        errors.append('Found extra args: %s.' % (list(extra_args)))

    return errors

# Handlers which require schema validation, but currently they do
# not have schema. In order to add schema incrementally this list is
# maintained. Please remove the name of the handlers if they already
# contains schema.
SCHEMA_REQUIRING_HANDLERS = [
    'AdminPage',
    'ExplorationRightsHandler',
    'CronExplorationRecommendationsHandler',
    'CronMailAdminContributorDashboardBottlenecksHandler',
    'CronMailReviewersContributorDashboardSuggestionsHandler',
    'ProfilePage',
    'ProfileHandler',
    'PreferencePage',
    'PreferenceHandler',
    'ProfilePictureHandler',
    'ProfilePictureHandlerByUsernameHandler',
    'SignupPage',
    'SignupHandler',
    'DeleteAccountPage',
    'DeleteAccountHandler',
    'ExportAccountHandler',
    'PendingAccountDeletionPage',
    'UsernameCheckHandler',
    'SiteLanguageHandler',
    'UserInfoHandler',
    'UrlHandler',
    'QuestionCreationHandler',
    'QuestionSkillLinkHandler',
    'EditableQuestionDataHandler',
    'QuebstionsListHandler',
    'QuestionCountDataHandler',
    'AdminHandler',
    'AdminRoleHandler',
    'AdmintopicsCsvFileDownloader',
    'DataExtractionQueryHandler',
    'AddContributionRightsHandler',
    'RemoveContributionRightsHandler',
    'ContributorUsersListHandler',
    'ContributorRightsDataHandler',
    'SendDummyMailToAdminHandler',
    'MemoryCacheAdminHandler',
    'UpdateUsernameHandler',
    'NumberOfDeletionRequestshandler',
    'VerifyUserModelsDeletedHandler',
    'DeleteUserhandler',
    'TrainedClassifierHandler',
    'NextJobHandler',
    'ClassroomDataHandler',
    'ClassroomPromosStatusHandler',
    'DefaultClassroomRedirectPage',
    'CollectionEditorPage',
    'EditableCollectionDataHandler',
    'CollectioRightsHandler',
    'CollectionPublishHandler',
    'CollectionUnpublishHandler',
    'ExplorationMetadataSearchHandler',
    'CollectionPage',
    'CollectionDataHandler',
    'ConceptCardDataHandler',
    'ContributorDashboardPage',
    'ContributionOppertunitiesHandler',
    'TranslatableTextHandler',
    'UserContributionRightsDataHandler',
    'FeaturedTranslationLanguageHandler',
    'OldNotificationsDashboardRedirectPage',
    'OldContributorDashboardRedirectPage',
    'NotificationsDashboardpage',
    'NotificationsDashboardHandler',
    'OldCreatorDashboardRedirectPage',
    'CreatorDashboradPage',
    'CreatorDashboardHandler',
    'NotificationHandler',
    'NewExplorationHandler',
    'NewCollectionHandler',
    'UploadExplorationHandler',
    'JobStatusMailerHandler',
    'CronDashboardStatsHandler',
    'CronUserDeletionHandler',
    'CronFullyCompleteUserDeletionHandler',
    'CronExplorationRecommendationHandler',
    'CronActivitySearchRankHandler',
    'CronMapreduceCleanupHandler',
    'CronModelsCleanupHandler',
    'CronMailReviewerContributorDashboardSuggestionsHandler',
    'CronMailAdminContributorDashboardBottleneckHandler',
    'FractionLandingRedirectPage',
    'TopicLandingRedirectPage',
    'TopicLandingPage',
    'StewardsLandingPage',
    'ExplorationPage',
    'UserExplorationPermissionHandler',
    'ExplorationStatusHandler',
    'ExplorationModeratorRightsHandler',
    'UserExplorationEmailsHandler',
    'ExplorationFileDownloader',
    'StateYamlHandler',
    'ExplorationSnapshotsHandler',
    'ExplorationRevertHandler',
    'ExplorationStatisticsHandler',
    'StateinteractionStatsHandler',
    'FetchIssuesHandler',
    'FetchPlaythroughHandler',
    'ResolveIssueHandler',
    'ImageUploadHandler',
    'StartedTutorialEventHandler',
    'StateAnswerStatisticsHandler',
    'TopUnresolvedAnswersHandler',
    'LearnerAnswerInfoHandler',
    'EmailDashboardPage',
    'EmailDashboardDataHandler',
    'QueryStatusCheckHandler',
    'EmailDashboardResultPage',
    'EmailDashboardcancelEmailHandler',
    'EmailDashboardTestBulkEmailHandler',
    'ExplorationFeaturesHandler',
    'ThreadListHandler',
    'ThreadListHandlerForTopicHandler',
    'ThreadHandler',
    'RecentFeedbackMessagesHandler',
    'FeedbackStatsHandler',
    'FeedbackThreadViewEventHandler',
    'ExplorationImprovementsHandler',
    'ExplorationImprovementsHistoryHandler',
    'ExplorationImprovementsConfigHandler',
    'IncomingReplyEmailHandler',
    'OldLearnerDashboardRedirectPage',
    'LearnerDashboardPage',
    'LearnerDashboardHandler',
    'LearnerDashboardIdsHandler',
    'LearnerDashboardFeedbackThreadHandler',
    'LearnerPlaylistHandler',
    'OldLibraryRedirectPage',
    'LibraryPage',
    'LibraryIndexHandler',
    'LibraryGroupPage',
    'LibraryGroupIndexHandler',
    'SearchHandler',
    'LibraryRedirectPage',
    'ExplorationsSummariesHandler',
    'CollectionSummariesHandler',
    'ModeratorPage',
    'FeaturedActivitiesHandler',
    'EmailDraftHandler',
    'ForumRedirectPage',
    'AboutRedirectPage',
    'FoundationRedirectPage',
    'TeachRedirectPage',
    'ConsoleErrorPage',
    'PlatformFeaturesEvaluationHandler',
    'PlatformFeatureDummyHandler',
    'PracticeSessionsPageDataHandler',
    'ExplorationEmbedPage',
    'ExplorationPage',
    'ExplorationHandler',
    'ClassroomPage',
    'PretestHandler',
    'StorePlaythroughHandler',
    'StatsEventsHandler',
    'AnswerSubmittedEventHandler',
    'StateHitEventHandler',
    'StateCompleteEventHandler',
    'LeaveForRefresherExpEventHandler',
    'ReaderFeedbackHandler',
    'ExplorationStartEventHandler',
    'ExplorationActualStartEventHandler',
    'SolutionHitEventHandler',
    'ExplorationCompleteEventHandler',
    'ExplorationMaybeLeaveHandler',
    'LearnerIncompleteActivityHandler',
    'RatingHandler',
    'RecommendationsHandler',
    'FlagExplorationHandler',
    'QuestionPlayerHandler',
    'LearnerAnswerDetailsSubmissionHandler',
    'RecentCommitsHandler',
    'ValueGeneratorHandler',
    'AssetDevHandler',
    'PromoBarHandler',
    'ReviewTestsPage',
    'ReviewTestsPageDataHandler',
    'SkillEditorPage',
    'SkillRightsHandler',
    'EditableSkillDataHandler',
    'SkillDataHandler',
    'FetchSkillsHandler',
    'SkillDescriptionHandler',
    'SkillMasteryDataHandler',
    'StoryEditorPage',
    'EditableStoryDataHandler',
    'StoryPublishHandler',
    'ValidateExplorationsHandler',
    'StoryUrlFragmentHandler',
    'StoryPage',
    'StoryPageDataHandler',
    'StoryProgressHandler',
    'SubscribeHandler',
    'UnsubscribeHandler',
    'SubtopicViewerPage',
    'SubtopicPageDataHandler',
    'SuggestionHandler',
    'SuggestionToExplorationActionHandler',
    'ResubmitSuggestionHandler',
    'SuggestionToSkillActionHandler',
    'SuggestionsProviderHandler',
    'ReviewableSuggestionsHandler',
    'UserSubmittedSuggestionsHandler',
    'SuggestionListHandler',
    'UpdateTranslationSuggestionHandler',
    'UpdateQuestionSuggestionHandler',
    'UnsentFeedbackEmailHandler',
    'SuggestionEmailHandler',
    'InstantFeedbackMessageEmailHandler',
    'FeedbackThreadStatusChangeEmailHandler',
    'FlagExplorationEmailHandler',
    'DeferredTasksHandler',
    'TopicEditorStoryHandler',
    'TopicEditorPage',
    'EditableSubtopicPageDataHandler',
    'EditableTopicDataHandler',
    'TopicRightsHandler',
    'TopicPublishSendMailHandler',
    'TopicPublishHandler',
    'TopicUrlFragmentHandler',
    'TopicNameHandler',
    'TopicViewerPage',
    'TopicPageDataHandler',
    'TopicsAndSkillsDashboardPage',
    'TopicsAndSkillsDashboardPageDataHandler',
    'TopicAssignmentsHandler',
    'SkillsDashboardPageDataHandler',
    'NewTopicHandler',
    'NewSkillHandler',
    'MergeSkillHandler',
    'AudioUploadHandler',
    'StartedTranslationTutorialEventHandler',
    'AdminSuperAdminPrivilegesHandler',
    'AdminSuperAdminPrivilegesHandler',
    'AdminTopicsCsvFileDownloader',
    'ContributionRightsDataHandler',
    'NotificationsDashboardPage',
    'NotificationsHandler',
    'CreatorDashboardPage',
    'ContributionOpportunitiesHandler',
    'MachineTranslationStateTextsHandler',
    'FeaturedTranslationLanguagesHandler',
    'QuestionsListHandler',
    'PracticeSessionsPage',
    'ExplorationSummariesHandler',
    'PreferencesPage',
    'PreferencesHandler',
    'UserExplorationPermissionsHandler',
    'StateInteractionStatsHandler',
    'ThreadListHandlerForTopicsHandler',
    'CollectionRightsHandler',
    'EmailDashboardCancelEmailHandler',
    'NumberOfDeletionRequestsHandler',
    'DeleteUserHandler',
    'FakePage',
    'FakeHandler',
    'EditorAutosaveHandler'
]

# These handlers do not require any schema validation.
NON_SCHEMA_REQUIRING_HANDLERS = [
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

# NON_SCHEMA_HANDLERS is addressed everywhere in the code since
# SCHEMA_REQUIRING_HANDLERS is temporary and will be removed once every
# handlers in controller layer will become ready for schema validation.
NON_SCHEMA_HANDLERS = SCHEMA_REQUIRING_HANDLERS + NON_SCHEMA_REQUIRING_HANDLERS
