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
import logging

from core import jobs
from core.domain import feedback_services
from core.domain import subscription_services
from core.platform import models
(exp_models, collection_models, feedback_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.collection,
        models.NAMES.feedback, models.NAMES.user]))
import feconf
import utils


# TODO(bhenning): Implement a working real-time layer for the recent dashboard
# updates aggregator job.
class RecentUpdatesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    pass


class DashboardRecentUpdatesAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes a list of recent updates
    of explorations and feedback threads to show on a user's dashboard.

    This job does not have a working realtime component: the
    RecentUpdatesRealtimeModel does nothing. There will be a delay in
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

    # Public query methods.
    @classmethod
    def get_recent_notifications(cls, user_id):
        """Gets a list of recent notifications to show on this user's
        dashboard.

        Returns a 2-tuple. The first element is a float representing the number
        of milliseconds since the Epoch when the job was queued. The second
        element is a list of recent updates to explorations and feedback
        threads; each entry is a dict with keys 'type', 'activity_id',
        'activity_title', 'last_updated_ms', 'author_id' and 'subject'. Here,
        'type' is either feconf.UPDATE_TYPE_EXPLORATION_COMMIT or
        feconf.UPDATE_TYPE_FEEDBACK_MESSAGE, 'activity_id' is the id of the
        exploration being committed to or to which the feedback thread belongs,
        and 'activity_title' is the corresponding title.
        """
        user_model = user_models.UserRecentChangesBatchModel.get(
            user_id, strict=False)
        return (
            user_model.job_queued_msec if user_model else None,
            user_model.output if user_model else [])


class RecentUpdatesMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Manager for a MapReduce job that computes a list of recent notifications
    for explorations, collections, and feedback threads watched by a user.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return DashboardRecentUpdatesAggregator

    @staticmethod
    def _get_most_recent_activity_commits(
            activity_model_cls, activity_ids_list,
            activity_type, commit_type, delete_commit_message):
        """Gets and returns a list of dicts representing the most recent
        commits made for each activity represented by each ID provided in the
        activity_ids_list parameter. These are the latest commits made by users
        to each activity (that is, it will skip over any automated commits such
        as those from the Oppia migration bot).

        Args:
            activity_model_cls: The storage layer object for an activity, such
                as exp_models.ExplorationModel.
            activity_ids_list: A list of activity IDs (such as exploration IDS)
                for which the latest commits will be retrieved.
            activity_type: The type (string) of activity being referenced, such
                as 'exploration' or 'collection'.
            commit_type: This (string) represents the activity update commit
                type, such as feconf.UPDATE_TYPE_EXPLORATION_COMMIT.
            delete_commit_message: This (string) represents the commit message
                to use when an activity is found to be deleted, such as
                feconf.COMMIT_MESSAGE_EXPLORATION_DELETED.

        Returns:
            A tuple with two entries:
                - A list (one entry per activity ID) of dictionaries with the
                  following keys:
                    - type: The value of the commit_type argument.
                    - activity_id: The ID of the activity for this commit.
                    - activity_title: The title of the activity.
                    - author_id: The author who made the commit.
                    - last_update_ms: When the commit was created.
                    - subject: The commit message, otherwise (if the activity
                      has been deleted) a message indicating that the activity
                      was deleted.
                - A list containing valid activity model instances which are
                  mappable to feedback threads
        """
        most_recent_commits = []
        activity_models = activity_model_cls.get_multi(
            activity_ids_list, include_deleted=True)

        tracked_models_for_feedback = []

        for ind, activity_model in enumerate(activity_models):
            if activity_model is None:
                logging.error(
                    'Could not find %s %s' % (
                        activity_type, activity_ids_list[ind]))
                continue

            # Find the last commit that is not due to an automatic migration.
            latest_manual_commit_version = activity_model.version
            metadata_obj = activity_model_cls.get_snapshots_metadata(
                activity_model.id,
                [latest_manual_commit_version],
                allow_deleted=True)[0]
            while metadata_obj['committer_id'] == feconf.MIGRATION_BOT_USER_ID:
                latest_manual_commit_version -= 1
                metadata_obj = (
                    activity_model_cls.get_snapshots_metadata(
                        activity_model.id,
                        [latest_manual_commit_version],
                        allow_deleted=True)[0])

            most_recent_commits.append({
                'type': commit_type,
                'activity_id': activity_model.id,
                'activity_title': activity_model.title,
                'author_id': metadata_obj['committer_id'],
                'last_updated_ms': metadata_obj['created_on_ms'],
                'subject': (
                    delete_commit_message
                    if activity_model.deleted
                    else metadata_obj['commit_message']
                ),
            })

            # If the user subscribes to this activity, he/she is automatically
            # subscribed to all feedback threads for this activity.
            if not activity_model.deleted:
                tracked_models_for_feedback.append(activity_model)

        return (most_recent_commits, tracked_models_for_feedback)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(item):
        user_id = item.id
        job_queued_msec = RecentUpdatesMRJobManager._get_job_queued_msec()
        reducer_key = '%s@%s' % (user_id, job_queued_msec)

        exploration_ids_list = item.activity_ids
        collection_ids_list = item.collection_ids
        feedback_thread_ids_list = item.feedback_thread_ids

        (most_recent_activity_commits, tracked_exp_models_for_feedback) = (
            RecentUpdatesMRJobManager._get_most_recent_activity_commits(
                exp_models.ExplorationModel, exploration_ids_list,
                'exploration', feconf.UPDATE_TYPE_EXPLORATION_COMMIT,
                feconf.COMMIT_MESSAGE_EXPLORATION_DELETED))

        for exp_model in tracked_exp_models_for_feedback:
            threads = feedback_services.get_threadlist(exp_model.id)
            for thread in threads:
                if thread['thread_id'] not in feedback_thread_ids_list:
                    feedback_thread_ids_list.append(thread['thread_id'])

        # TODO(bhenning): Implement a solution to having feedback threads for
        # collections.
        most_recent_activity_commits += (
            RecentUpdatesMRJobManager._get_most_recent_activity_commits(
                collection_models.CollectionModel, collection_ids_list,
                'collection', feconf.UPDATE_TYPE_COLLECTION_COMMIT,
                feconf.COMMIT_MESSAGE_COLLECTION_DELETED))[0]

        for recent_activity_commit_dict in most_recent_activity_commits:
            yield (reducer_key, recent_activity_commit_dict)

        for feedback_thread_id in feedback_thread_ids_list:
            last_message = (
                feedback_models.FeedbackMessageModel.get_most_recent_message(
                    feedback_thread_id))

            yield (reducer_key, {
                'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
                'activity_id': last_message.exploration_id,
                'activity_title': exp_models.ExplorationModel.get_by_id(
                    last_message.exploration_id).title,
                'author_id': last_message.author_id,
                'last_updated_ms': utils.get_time_in_millisecs(
                    last_message.created_on),
                'subject': last_message.get_thread_subject(),
            })

    @staticmethod
    def reduce(key, stringified_values):
        if '@' not in key:
            logging.error(
                'Invalid reducer key for RecentUpdatesMRJob: %s' % key)

        user_id = key[:key.find('@')]
        job_queued_msec = float(key[key.find('@') + 1:])

        values = [ast.literal_eval(sv) for sv in stringified_values]
        sorted_values = sorted(
            values, key=lambda x: x['last_updated_ms'], reverse=True)

        user_models.UserRecentChangesBatchModel(
            id=user_id, output=sorted_values[: feconf.DEFAULT_QUERY_LIMIT],
            job_queued_msec=job_queued_msec
        ).put()


class DashboardSubscriptionsOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for subscribing users to explorations, collections, and
    feedback threads.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            exp_models.ExplorationRightsModel,
            collection_models.CollectionRightsModel,
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
        elif isinstance(item, collection_models.CollectionRightsModel):
            # NOTE TO DEVELOPERS: Although the code handling subscribing to
            # collections is very similar to the code above for explorations,
            # it is not abstracted out due to the majority of the coding being
            # yield statements. These must happen inside the generator method
            # (which is this method) and, as a result, there is little common
            # code between the two code blocks which can be effectively
            # abstracted.
            if item.deleted:
                return

            if not item.community_owned:
                for owner_id in item.owner_ids:
                    yield (owner_id, {
                        'type': 'collection',
                        'id': item.id
                    })
                for editor_id in item.editor_ids:
                    yield (editor_id, {
                        'type': 'collection',
                        'id': item.id
                    })
            else:
                # Go through the history.
                current_version = item.version
                for version in range(1, current_version + 1):
                    model = (
                        collection_models.CollectionRightsModel.get_version(
                            item.id, version))

                    if not model.community_owned:
                        for owner_id in model.owner_ids:
                            yield (owner_id, {
                                'type': 'collection',
                                'id': item.id
                            })
                        for editor_id in model.editor_ids:
                            yield (editor_id, {
                                'type': 'collection',
                                'id': item.id
                            })

    @staticmethod
    def reduce(key, stringified_values):
        values = [ast.literal_eval(v) for v in stringified_values]
        for item in values:
            if item['type'] == 'feedback':
                subscription_services.subscribe_to_thread(key, item['id'])
            elif item['type'] == 'exploration':
                subscription_services.subscribe_to_exploration(key, item['id'])
            elif item['type'] == 'collection':
                subscription_services.subscribe_to_collection(key, item['id'])
