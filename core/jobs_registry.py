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

from core.domain import activity_jobs_one_off
from core.domain import collection_jobs_one_off
from core.domain import email_jobs_one_off
from core.domain import exp_jobs_one_off
from core.domain import feedback_jobs_continuous
from core.domain import prod_validation_jobs_one_off
from core.domain import question_jobs_one_off
from core.domain import recommendations_jobs_one_off
from core.domain import skill_jobs_one_off
from core.domain import stats_jobs_continuous
from core.domain import stats_jobs_one_off
from core.domain import story_jobs_one_off
from core.domain import topic_jobs_one_off
from core.domain import user_jobs_continuous
from core.domain import user_jobs_one_off

# List of all manager classes for one-off batch jobs for which to show controls
# on the admin dashboard.
ONE_OFF_JOB_MANAGERS = [
    activity_jobs_one_off.IndexAllActivitiesJobManager,
    collection_jobs_one_off.CollectionMigrationOneOffJob,
    email_jobs_one_off.EmailHashRegenerationOneOffJob,
    exp_jobs_one_off.ExpSummariesContributorsOneOffJob,
    exp_jobs_one_off.ExpSummariesCreationOneOffJob,
    exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob,
    exp_jobs_one_off.ExplorationFirstPublishedOneOffJob,
    exp_jobs_one_off.ExplorationMigrationJobManager,
    exp_jobs_one_off.ExplorationValidityJobManager,
    exp_jobs_one_off.HintsAuditOneOffJob,
    exp_jobs_one_off.ItemSelectionInteractionOneOffJob,
    exp_jobs_one_off.ViewableExplorationsAuditJob,
    exp_jobs_one_off.ExplorationContentValidationJobForCKEditor,
    exp_jobs_one_off.InteractionCustomizationArgsValidationJob,
    exp_jobs_one_off.TranslatorToVoiceArtistOneOffJob,
    exp_jobs_one_off.DeleteStateIdMappingModelsOneOffJob,
    prod_validation_jobs_one_off.ActivityReferencesModelAuditOneOffJob,
    prod_validation_jobs_one_off.RoleQueryAuditModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionRightsSnapshotMetadataModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.CollectionRightsSnapshotContentModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.CollectionCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.CollectionSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.ConfigPropertyModelAuditOneOffJob,
    prod_validation_jobs_one_off.ConfigPropertySnapshotMetadataModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.ConfigPropertySnapshotContentModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.SentEmailModelAuditOneOffJob,
    prod_validation_jobs_one_off.BulkEmailModelAuditOneOffJob,
    prod_validation_jobs_one_off.GeneralFeedbackEmailReplyToIdModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.ExplorationModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationRightsSnapshotMetadataModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.ExplorationRightsSnapshotContentModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.ExplorationCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExpSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.ExplorationRecommendationsModelAuditOneOffJob,
    prod_validation_jobs_one_off.FileMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.FileMetadataSnapshotMetadataModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.FileMetadataSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.FileModelAuditOneOffJob,
    prod_validation_jobs_one_off.FileSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.FileSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSimilaritiesModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillRightsSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillRightsSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.SkillSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryModelAuditOneOffJob,
    prod_validation_jobs_one_off.StorySnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.StorySnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryRightsSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryRightsSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.StoryCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.StorySummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicRightsModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicRightsSnapshotMetadataModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicRightsSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.TopicSummaryModelAuditOneOffJob,
    prod_validation_jobs_one_off.SubtopicPageModelAuditOneOffJob,
    prod_validation_jobs_one_off.SubtopicPageSnapshotMetadataModelAuditOneOffJob, # pylint: disable=line-too-long
    prod_validation_jobs_one_off.SubtopicPageSnapshotContentModelAuditOneOffJob,
    prod_validation_jobs_one_off.SubtopicPageCommitLogEntryModelAuditOneOffJob,
    prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob,
    question_jobs_one_off.QuestionMigrationOneOffJob,
    recommendations_jobs_one_off.ExplorationRecommendationsOneOffJob,
    skill_jobs_one_off.SkillMigrationOneOffJob,
    stats_jobs_one_off.PlaythroughAudit,
    stats_jobs_one_off.RecomputeStatisticsOneOffJob,
    stats_jobs_one_off.RecomputeStatisticsValidationCopyOneOffJob,
    stats_jobs_one_off.RegenerateMissingStatsModelsOneOffJob,
    stats_jobs_one_off.StatisticsAuditV1,
    stats_jobs_one_off.StatisticsAuditV2,
    stats_jobs_one_off.StatisticsAudit,
    story_jobs_one_off.StoryMigrationOneOffJob,
    topic_jobs_one_off.TopicMigrationOneOffJob,
    user_jobs_one_off.CleanupActivityIdsFromUserSubscriptionsModelOneOffJob,
    user_jobs_one_off.DashboardSubscriptionsOneOffJob,
    user_jobs_one_off.LongUserBiosOneOffJob,
    user_jobs_one_off.UserContributionsOneOffJob,
    user_jobs_one_off.UserFirstContributionMsecOneOffJob,
    user_jobs_one_off.UserLastExplorationActivityOneOffJob,
    user_jobs_one_off.UserProfilePictureOneOffJob,
    user_jobs_one_off.UsernameLengthDistributionOneOffJob,
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


class ContinuousComputationEventDispatcher(object):
    """Dispatches events to the relevant ContinuousComputation classes."""

    @classmethod
    def dispatch_event(cls, event_type, *args, **kwargs):
        """Dispatches an incoming event to the ContinuousComputation
        classes which listen to events of that type.
        """
        for klass in ALL_CONTINUOUS_COMPUTATION_MANAGERS:
            if event_type in klass.get_event_types_listened_to():
                klass.on_incoming_event(event_type, *args, **kwargs)
