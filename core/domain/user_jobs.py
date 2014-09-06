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

"""Jobs for queries personalized to individual users."""

import ast

from core import jobs
from core.domain import feedback_services
from core.domain import subscription_services
from core.platform import models
(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user])
import feconf
import utils


# The maximum number of results to ever display in a user dashboard.
DEFAULT_QUERY_LIMIT = 1000


class RecentUpdatesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class DashboardRecentUpdatesAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes a list of recent updates
    of explorations and feedback threads to show on a user's dashboard.

    This job does not have a realtime component. There will be a delay in
    propagating new updates to the dashboard; the length of the delay will be
    approximately the time it takes a batch job to run.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        return []

    @classmethod
    def _get_realtime_datastore_class(cls):
        return RecentUpdatesRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return RecentUpdatesMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        pass

    # Public query method.
    @classmethod
    def get_recent_updates(cls, user_id):
        """Returns a list of recent updates to explorations and feedback
        threads. Each entry is a dict with keys 'type', 'activity_id',
        'activity_title', 'last_updated_ms', 'author_id' and 'subject'.

        The 'type' is either feconf.UPDATE_TYPE_EXPLORATION_COMMIT or
        feconf.UPDATE_TYPE_FEEDBACK_MESSAGE. The 'activity_id' is the id of the
        exploration being committed to or to which the feedback thread belongs,
        and the 'activity_title' is its title.
        """
        user_model = user_models.UserRecentChangesBatchModel.get(
            user_id, strict=False)
        return user_model.output if user_model else []


class RecentUpdatesMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Manager for a MapReduce job that computes a list of recent updates
    to explorations and feedback threads watched by a user.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return DashboardRecentUpdatesAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(item):
        user_id = item.id
        activity_ids_list = item.activity_ids
        feedback_thread_ids_list = item.feedback_thread_ids

        # TODO(sll): Rewrite this to deal with the multiple cases once we
        # have adventures.
        activities = exp_models.ExplorationModel.get_multi(
            activity_ids_list, include_deleted=True)
        for activity in activities:
            last_commit = (
                exp_models.ExplorationCommitLogEntryModel.get_commit(
                    activity.id, activity.version))
            yield (user_id, {
                'type': feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                'activity_id': activity.id,
                'activity_title': activity.title,
                'last_updated_ms': utils.get_time_in_millisecs(
                    activity.last_updated),
                'author_id': last_commit.user_id,
                'subject': last_commit.commit_message,
            })

            # If the user subscribes to this activity, he/she is automatically
            # subscribed to all feedback threads for this activity.
            threads = feedback_services.get_threadlist(activity.id)
            for thread in threads:
                if thread['thread_id'] not in feedback_thread_ids_list:
                    feedback_thread_ids_list.append(thread['thread_id'])

        for feedback_thread_id in feedback_thread_ids_list:
            last_message = (
                feedback_models.FeedbackMessageModel.get_most_recent_message(
                    feedback_thread_id))

            yield (user_id, {
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
                'activity_id': last_message.exploration_id,
                'activity_title': exp_models.ExplorationModel.get_by_id(
                    last_message.exploration_id).title,
                'last_updated_ms': utils.get_time_in_millisecs(
                    last_message.created_on),
                'author_id': last_message.author_id,
                'subject': last_message.get_thread_subject(),
            })

    @staticmethod
    def reduce(key, stringified_values):
        values = [ast.literal_eval(sv) for sv in stringified_values]
        sorted_values = sorted(
            values, key=lambda x: x['last_updated_ms'], reverse=True)

        user_models.UserRecentChangesBatchModel(
            id=key, output=sorted_values[: DEFAULT_QUERY_LIMIT]).put()


class DashboardSubscriptionsOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for subscribing users to explorations and feedback
    threads.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            exp_models.ExplorationRightsModel,
            feedback_models.FeedbackMessageModel,
        ]

    @staticmethod
    def map(item):
        if isinstance(item, feedback_models.FeedbackMessageModel):
            if item.author_id:
                yield (item.author_id, {
                    'type': 'feedback',
                    'id': item.thread_id
                })
        elif isinstance(item, exp_models.ExplorationRightsModel):
            if item.deleted:
                return

            if not item.community_owned:
                for owner_id in item.owner_ids:
                    yield (owner_id, {
                        'type': 'exploration',
                        'id': item.id
                    })
                for editor_id in item.editor_ids:
                    yield (editor_id, {
                        'type': 'exploration',
                        'id': item.id
                    })
            else:
                # Go through the history.
                current_version = item.version
                for version in range(1, current_version + 1):
                    model = exp_models.ExplorationRightsModel.get_version(
                        item.id, version)

                    if not model.community_owned:
                        for owner_id in model.owner_ids:
                            yield (owner_id, {
                                'type': 'exploration',
                                'id': item.id
                            })
                        for editor_id in model.editor_ids:
                            yield (editor_id, {
                                'type': 'exploration',
                                'id': item.id
                            })

    @staticmethod
    def reduce(key, stringified_values):
        values = [ast.literal_eval(v) for v in stringified_values]
        for item in values:
            if item['type'] == 'feedback':
                subscription_services.subscribe_to_thread(key, item['id'])
            elif item['type'] == 'exploration':
                subscription_services.subscribe_to_activity(key, item['id'])
