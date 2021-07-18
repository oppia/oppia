# coding: utf-8
#
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

"""Job registries."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import activity_jobs_one_off
from core.domain import auth_jobs_one_off
from core.domain import collection_jobs_one_off
from core.domain import email_jobs_one_off
from core.domain import exp_jobs_one_off
from core.domain import feedback_jobs_continuous
from core.domain import feedback_jobs_one_off
from core.domain import interaction_jobs_one_off
from core.domain import opportunity_jobs_one_off
from core.domain import prod_validation_jobs_one_off
from core.domain import question_jobs_one_off
from core.domain import recommendations_jobs_one_off
from core.domain import skill_jobs_one_off
from core.domain import stats_jobs_continuous
from core.domain import stats_jobs_one_off
from core.domain import story_jobs_one_off
from core.domain import suggestion_jobs_one_off
from core.domain import topic_jobs_one_off
from core.domain import user_jobs_continuous
from core.domain import user_jobs_one_off
import python_utils

# List of all manager classes for one-off batch jobs for which to show controls
# on the admin dashboard.
ONE_OFF_JOB_MANAGERS = [
    activity_jobs_one_off.ActivityContributorsSummaryOneOffJob,
    activity_jobs_one_off.AddContentUserIdsContentJob,
    activity_jobs_one_off.AddMissingCommitLogsOneOffJob,
    activity_jobs_one_off.AuditContributorsOneOffJob,
    activity_jobs_one_off.AuditSnapshotMetadataModelsJob,
    activity_jobs_one_off.IndexAllActivitiesJobManager,
    activity_jobs_one_off.ValidateSnapshotMetadataModelsJob,
    activity_jobs_one_off.SnapshotMetadataCommitMsgAuditOneOffJob,
    activity_jobs_one_off.SnapshotMetadataCommitMsgShrinkOneOffJob,
    auth_jobs_one_off.SyncFirebaseAccountsOneOffJob,
    collection_jobs_one_off.CollectionMigrationOneOffJob,
    collection_jobs_one_off.RemoveCollectionRightsTranslatorIdsOneOffJob,
    collection_jobs_one_off.RemoveCollectionModelNodesOneOffJob,
    email_jobs_one_off.EmailHashRegenerationOneOffJob,
    exp_jobs_one_off.RemoveDeprecatedExplorationModelFieldsOneOffJob,
    exp_jobs_one_off.RemoveDeprecatedExplorationRightsModelFieldsOneOffJob,
    exp_jobs_one_off.ExplorationContentValidationJobForCKEditor,
    exp_jobs_one_off.ExplorationFirstPublishedOneOffJob,
    exp_jobs_one_off.ExplorationMathSvgFilenameValidationOneOffJob,
    exp_jobs_one_off.ExplorationMigrationAuditJob,
    exp_jobs_one_off.ExplorationMigrationJobManager,
    exp_jobs_one_off.ExplorationRteMathContentValidationOneOffJob,
    exp_jobs_one_off.ExpSnapshotsMigrationAuditJob,
    exp_jobs_one_off.ExpSnapshotsMigrationJob,
    exp_jobs_one_off.ExplorationValidityJobManager,
    exp_jobs_one_off.HintsAuditOneOffJob,
    exp_jobs_one_off.RatioTermsAuditOneOffJob,
    exp_jobs_one_off.RegenerateStringPropertyIndexOneOffJob,
    exp_jobs_one_off.RTECustomizationArgsValidationOneOffJob,
    exp_jobs_one_off.ViewableExplorationsAuditJob,
    exp_jobs_one_off.XmlnsAttributeInExplorationMathSvgImagesAuditJob,
    exp_jobs_one_off.RegenerateMissingExpCommitLogModels,
    exp_jobs_one_off.ExpCommitLogModelRegenerationValidator,
    exp_jobs_one_off.ExpSnapshotsDeletionJob,
    feedback_jobs_one_off.FeedbackThreadCacheOneOffJob,
    feedback_jobs_one_off.CleanUpFeedbackAnalyticsModelModelOneOffJob,
    feedback_jobs_one_off.TextMessageLengthAuditOneOffJob,
    feedback_jobs_one_off.TrimTextMessageLengthOneOffJob,
    feedback_jobs_one_off.CleanUpGeneralFeedbackThreadModelOneOffJob,
    (
        interaction_jobs_one_off
        .DragAndDropSortInputInteractionOneOffJob),
    (
        interaction_jobs_one_off
        .InteractionCustomizationArgsValidationOneOffJob),
    interaction_jobs_one_off.ItemSelectionInteractionOneOffJob,
    interaction_jobs_one_off.MultipleChoiceInteractionOneOffJob,
    interaction_jobs_one_off.RuleInputToCustomizationArgsMappingOneOffJob,
    opportunity_jobs_one_off.ExplorationOpportunitySummaryModelRegenerationJob,
    (
        opportunity_jobs_one_off.
        RenameExplorationOpportunitySummaryModelPropertiesJob),
    opportunity_jobs_one_off.SkillOpportunityModelRegenerationJob,
    question_jobs_one_off.FixQuestionImagesStorageOneOffJob,
    question_jobs_one_off.QuestionMigrationOneOffJob,
    question_jobs_one_off.MissingQuestionMigrationOneOffJob,
    question_jobs_one_off.QuestionSnapshotsMigrationAuditJob,
    question_jobs_one_off.QuestionSnapshotsMigrationJob,
    recommendations_jobs_one_off.DeleteAllExplorationRecommendationsOneOffJob,
    recommendations_jobs_one_off.ExplorationRecommendationsOneOffJob,
    recommendations_jobs_one_off.CleanUpExplorationRecommendationsOneOffJob,
    skill_jobs_one_off.SkillMigrationOneOffJob,
    skill_jobs_one_off.SkillCommitCmdMigrationOneOffJob,
    skill_jobs_one_off.MissingSkillMigrationOneOffJob,
    stats_jobs_one_off.ExplorationMissingStatsAudit,
    stats_jobs_one_off.RecomputeStatisticsOneOffJob,
    stats_jobs_one_off.RecomputeStatisticsValidationCopyOneOffJob,
    stats_jobs_one_off.RegenerateMissingStateStatsOneOffJob,
    stats_jobs_one_off.RegenerateMissingV1StatsModelsOneOffJob,
    stats_jobs_one_off.RegenerateMissingV2StatsModelsOneOffJob,
    stats_jobs_one_off.StatisticsAuditV1,
    stats_jobs_one_off.StatisticsAuditV2,
    stats_jobs_one_off.StatisticsAudit,
    stats_jobs_one_off.StatisticsCustomizationArgsAudit,
    stats_jobs_one_off.WipeExplorationIssuesOneOffJob,
    story_jobs_one_off.DescriptionLengthAuditOneOffJob,
    story_jobs_one_off.RegenerateStorySummaryOneOffJob,
    story_jobs_one_off.StoryExplorationsAuditOneOffJob,
    story_jobs_one_off.StoryMigrationOneOffJob,
    story_jobs_one_off.DeleteStoryCommitLogsOneOffJob,
    suggestion_jobs_one_off.PopulateTranslationContributionStatsOneOffJob,
    suggestion_jobs_one_off.QuestionSuggestionMigrationJobManager,
    suggestion_jobs_one_off.PopulateFinalReviewerIdOneOffJob,
    suggestion_jobs_one_off.PopulateContributionStatsOneOffJob,
    suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob,
    suggestion_jobs_one_off.SuggestionSvgFilenameValidationOneOffJob,
    topic_jobs_one_off.InteractionsInStoriesAuditOneOffJob,
    topic_jobs_one_off.RegenerateTopicSummaryOneOffJob,
    topic_jobs_one_off.RemoveDeletedSkillsFromTopicOneOffJob,
    topic_jobs_one_off.TopicMigrationOneOffJob,
    user_jobs_one_off.CleanupExplorationIdsFromUserSubscriptionsModelOneOffJob,
    user_jobs_one_off.DashboardSubscriptionsOneOffJob,
    user_jobs_one_off.LongUserBiosOneOffJob,
    user_jobs_one_off.UserContributionsOneOffJob,
    user_jobs_one_off.UserFirstContributionMsecOneOffJob,
    user_jobs_one_off.UserLastExplorationActivityOneOffJob,
    user_jobs_one_off.UsernameLengthAuditOneOffJob,
    user_jobs_one_off.UsernameLengthDistributionOneOffJob,
    user_jobs_one_off.RemoveActivityIDsOneOffJob,
    user_jobs_one_off.RemoveFeedbackThreadIDsOneOffJob,
    user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob,
    user_jobs_one_off.CleanUpCollectionProgressModelOneOffJob,
    user_jobs_one_off.CleanUpUserContributionsModelOneOffJob,
    user_jobs_one_off.DiscardOldDraftsOneOffJob,
    user_jobs_one_off.ProfilePictureAuditOneOffJob,
    user_jobs_one_off.UniqueHashedNormalizedUsernameAuditJob,
    user_jobs_one_off.FixUserSettingsCreatedOnOneOffJob,
    user_jobs_one_off.UserSettingsCreatedOnAuditOneOffJob,
    user_jobs_one_off.UserRolesPopulationOneOffJob,
    user_jobs_one_off.DeleteNonExistentExpUserDataOneOffJob,
    user_jobs_one_off.DeleteNonExistentExpsFromUserModelsOneOffJob,
    user_jobs_one_off.DeleteNonExistentExpUserContributionsOneOffJob,
    user_jobs_one_off.PopulateStoriesAndTopicsOneOffJob # pylint: disable=line-too-long
]

# List of all manager classes for prod validation one-off batch jobs for which
# to show controls on the admin dashboard.
AUDIT_JOB_MANAGERS = [
    prod_validation_jobs_one_off.ActivityReferencesModelAuditOneOffJob,
    prod_validation_jobs_one_off.AppFeedbackReportModelAuditOneOffJob,
    prod_validation_jobs_one_off.AppFeedbackReportTicketModelAuditOneOffJob,
    prod_validation_jobs_one_off.AppFeedbackReportStatsModelAuditOneOffJob,
    prod_validation_jobs_one_off.BeamJobRunModelAuditOneOffJob,
    prod_validation_jobs_one_off.BeamJobRunResultModelAuditOneOffJob,
    prod_validation_jobs_one_off.BlogPostModelAuditOneOffJob,
    prod_validation_jobs_one_off.BlogPostSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.BlogPostRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.BulkEmailModelAuditOneOffJob,
    prod_validation_jobs_one_off.ClassifierTrainingJobModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionProgressModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionRightsModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .CollectionRightsSnapshotContentModelAuditOneOffJob
    ),
    (
        prod_validation_jobs_one_off
        .CollectionRightsSnapshotMetadataModelAuditOneOffJob
    ),
    prod_validation_jobs_one_off.CollectionSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.CompletedActivitiesModelAuditOneOffJob,
    prod_validation_jobs_one_off.ConfigPropertyModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .ConfigPropertySnapshotContentModelAuditOneOffJob
    ),
    (
        prod_validation_jobs_one_off
        .ConfigPropertySnapshotMetadataModelAuditOneOffJob
    ),
    prod_validation_jobs_one_off.ContinuousComputationModelAuditOneOffJob,
    prod_validation_jobs_one_off.DeletedUserModelAuditOneOffJob,
    prod_validation_jobs_one_off.DeletedUsernameModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExpSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExpUserLastPlaythroughModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationContextModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .ExplorationOpportunitySummaryModelAuditOneOffJob
    ),
    prod_validation_jobs_one_off.ExplorationRecommendationsModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationRightsModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .ExplorationRightsSnapshotContentModelAuditOneOffJob
    ),
    (
        prod_validation_jobs_one_off
        .ExplorationRightsSnapshotMetadataModelAuditOneOffJob
    ),
    prod_validation_jobs_one_off.ExplorationSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationUserDataModelAuditOneOffJob,
    prod_validation_jobs_one_off.FeedbackAnalyticsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserIdentifiersModelAuditOneOffJob,
    prod_validation_jobs_one_off.GeneralFeedbackMessageModelAuditOneOffJob,
    prod_validation_jobs_one_off.GeneralFeedbackThreadModelAuditOneOffJob,
    prod_validation_jobs_one_off.GeneralFeedbackThreadUserModelAuditOneOffJob,
    prod_validation_jobs_one_off.GeneralSuggestionModelAuditOneOffJob,
    prod_validation_jobs_one_off.GeneralVoiceoverApplicationModelAuditOneOffJob,
    prod_validation_jobs_one_off.CommunityContributionStatsModelAuditOneOffJob,
    prod_validation_jobs_one_off.IncompleteActivitiesModelAuditOneOffJob,
    prod_validation_jobs_one_off.JobModelAuditOneOffJob,
    prod_validation_jobs_one_off.LearnerPlaylistModelAuditOneOffJob,
    prod_validation_jobs_one_off.MachineTranslationModelAuditOneOffJob,
    prod_validation_jobs_one_off.PendingDeletionRequestModelAuditOneOffJob,
    prod_validation_jobs_one_off.PlatformParameterModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .PlatformParameterSnapshotMetadataModelAuditOneOffJob),
    (
        prod_validation_jobs_one_off
        .PlatformParameterSnapshotContentModelAuditOneOffJob),
    prod_validation_jobs_one_off.PlaythroughModelAuditOneOffJob,
    prod_validation_jobs_one_off.PseudonymizedUserModelAuditOneOffJob,
    prod_validation_jobs_one_off.QuestionCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.QuestionModelAuditOneOffJob,
    prod_validation_jobs_one_off.QuestionSkillLinkModelAuditOneOffJob,
    prod_validation_jobs_one_off.QuestionSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.QuestionSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.QuestionSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.RoleQueryAuditModelAuditOneOffJob,
    prod_validation_jobs_one_off.SentEmailModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillOpportunityModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryProgressModelAuditOneOffJob,
    prod_validation_jobs_one_off.StorySnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.StorySnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.StorySummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.SubtopicPageCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.SubtopicPageModelAuditOneOffJob,
    prod_validation_jobs_one_off.SubtopicPageSnapshotContentModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .SubtopicPageSnapshotMetadataModelAuditOneOffJob
    ),
    prod_validation_jobs_one_off.TaskEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicRightsSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicRightsSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSimilaritiesModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSummaryModelAuditOneOffJob,
    (
        prod_validation_jobs_one_off
        .StateTrainingJobsMappingModelAuditOneOffJob
    ),
    prod_validation_jobs_one_off.UnsentFeedbackEmailModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserAuthDetailsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserBulkEmailsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserContributionRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserContributionProficiencyModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserContributionsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserEmailPreferencesModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserIdByFirebaseAuthIdModelAuditOneOffJob,
    prod_validation_jobs_one_off.FirebaseSeedModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserNormalizedNameAuditOneOffJob,
    prod_validation_jobs_one_off.UserQueryModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserRecentChangesBatchModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserSettingsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserSkillMasteryModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserStatsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserSubscribersModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob,
    prod_validation_jobs_one_off.UsernameChangeAuditModelAuditOneOffJob
]

# List of all ContinuousComputation managers to show controls for on the
# admin dashboard.
# NOTE TO DEVELOPERS: When a new ContinuousComputation manager is defined,
# it should be registered here.
ALL_CONTINUOUS_COMPUTATION_MANAGERS = [
    feedback_jobs_continuous.FeedbackAnalyticsAggregator,
    stats_jobs_continuous.InteractionAnswerSummariesAggregator,
    user_jobs_continuous.DashboardRecentUpdatesAggregator,
    user_jobs_continuous.UserStatsAggregator,
]


class ContinuousComputationEventDispatcher(python_utils.OBJECT):
    """Dispatches events to the relevant ContinuousComputation classes."""

    @classmethod
    def dispatch_event(cls, event_type, *args, **kwargs):
        """Dispatches an incoming event to the ContinuousComputation
        classes which listen to events of that type.

        Args:
            event_type: str. The type of the event.
            *args: list(*). Positional arguments to pass to on_incoming_event().
            **kwargs: *. Keyword arguments to pass to on_incoming_event().
        """
        for klass in ALL_CONTINUOUS_COMPUTATION_MANAGERS:
            if event_type in klass.get_event_types_listened_to():
                klass.on_incoming_event(event_type, *args, **kwargs)
