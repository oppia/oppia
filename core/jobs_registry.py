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

from core.domain import exp_jobs_one_off
from core.domain import feedback_jobs_continuous
from core.domain import stats_jobs_continuous
from core.domain import stats_jobs_one_off
from core.domain import user_jobs_continuous
from core.domain import user_jobs_one_off
from core.domain import email_jobs_one_off

# List of all manager classes for one-off batch jobs for which to show controls
# on the admin dashboard.
ONE_OFF_JOB_MANAGERS = [
    user_jobs_one_off.DashboardSubscriptionsOneOffJob,
    exp_jobs_one_off.IndexAllExplorationsJobManager,
    exp_jobs_one_off.ExpSummariesCreationOneOffJob,
    exp_jobs_one_off.ExplorationValidityJobManager,
    stats_jobs_one_off.StatisticsAudit,
    user_jobs_one_off.UserContributionsOneOffJob,
    exp_jobs_one_off.ExplorationFirstPublishedOneOffJob,
    exp_jobs_one_off.ExpSummariesContributorsOneOffJob,
    user_jobs_one_off.UserFirstContributionMsecOneOffJob,
    exp_jobs_one_off.ExplorationMigrationJobManager,
    exp_jobs_one_off.ExplorationContributorsSummaryOneOffJob,
    email_jobs_one_off.EmailHashRegenerationOneOffJob,
    user_jobs_one_off.UserProfilePictureOneOffJob,
    exp_jobs_one_off.ItemSelectionInteractionOneOffJob]

# List of all ContinuousComputation managers to show controls for on the
# admin dashboard.
# NOTE TO DEVELOPERS: When a new ContinuousComputation manager is defined,
# it should be registered here.
ALL_CONTINUOUS_COMPUTATION_MANAGERS = [
    stats_jobs_continuous.StatisticsAggregator,
    user_jobs_continuous.DashboardRecentUpdatesAggregator,
    user_jobs_continuous.UserStatsAggregator,
    feedback_jobs_continuous.FeedbackAnalyticsAggregator]


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
