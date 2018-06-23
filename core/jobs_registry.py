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
from core.domain import feedback_jobs_one_off
from core.domain import recommendations_jobs_one_off
from core.domain import stats_jobs_continuous
from core.domain import stats_jobs_one_off
from core.domain import user_jobs_continuous
from core.domain import user_jobs_one_off

# List of all manager classes for one-off batch jobs for which to show controls
# on the admin dashboard.
ONE_OFF_JOB_MANAGERS = [
    activity_jobs_one_off.IndexAllActivitiesJobManager,
    collection_jobs_one_off.CollectionMigrationJob,
    email_jobs_one_off.EmailHashRegenerationOneOffJob,
    exp_jobs_one_off.ExpSummariesContributorsOneOffJob,
    exp_jobs_one_off.ExpSummariesCreationOneOffJob,
    exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob,
    exp_jobs_one_off.ExplorationFirstPublishedOneOffJob,
    exp_jobs_one_off.ExplorationMigrationJobManager,
    exp_jobs_one_off.ExplorationValidityJobManager,
    exp_jobs_one_off.ExplorationStateIdMappingJob,
    exp_jobs_one_off.HintsAuditOneOffJob,
    exp_jobs_one_off.ItemSelectionInteractionOneOffJob,
    exp_jobs_one_off.ViewableExplorationsAuditJob,
    exp_jobs_one_off.ExplorationContentValidationJob,
    exp_jobs_one_off.ExplorationMigrationValidationJob,
    feedback_jobs_one_off.FeedbackThreadMessagesCountOneOffJob,
    feedback_jobs_one_off.FeedbackSubjectOneOffJob,
    feedback_jobs_one_off.SuggestionMigrationOneOffJob,
    recommendations_jobs_one_off.ExplorationRecommendationsOneOffJob,
    stats_jobs_one_off.ExplorationIssuesModelCreatorOneOffJob,
    stats_jobs_one_off.RecomputeStatisticsOneOffJob,
    stats_jobs_one_off.StatisticsAuditV1,
    stats_jobs_one_off.StatisticsAudit,
    user_jobs_one_off.DashboardSubscriptionsOneOffJob,
    user_jobs_one_off.LongUserBiosOneOffJob,
    user_jobs_one_off.UserContributionsOneOffJob,
    user_jobs_one_off.UserLanguageAuditOneOffJob,
    user_jobs_one_off.UserLanguageResetOneOffJob,
    user_jobs_one_off.UserDefaultDashboardOneOffJob,
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
