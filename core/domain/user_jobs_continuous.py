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
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import stats_services
from core.platform import models
import feconf
import utils

from google.appengine.ext import ndb

(exp_models, collection_models, feedback_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.collection,
        models.NAMES.feedback, models.NAMES.user]))
transaction_services = models.Registry.import_transaction_services()


# TODO(bhenning): Implement a working real-time layer for the recent dashboard
# updates aggregator job.
class RecentUpdatesRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    """Storage class for entities in the realtime layer. See
    jobs.BaseRealtimeDatastoreClassForContinuousComputations class
    for more details.
    """
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
        """Returns a list of event types that this class subscribes to."""
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
        """Gets a list of recent notifications to show on the user's
        dashboard.

        Args:
            user_id: str. The unique ID of the user.

        Returns:
            tuple(float, list(dict)). A 2-tuple with following entries:
            - float. The time, in milliseconds since the Epoch, when the job was
                queued.
            - list(dict). A list of recent updates to explorations and feedback
                threads; Each entry in the list is a dict with keys:
                - 'type': str. Either feconf.UPDATE_TYPE_EXPLORATION_COMMIT or
                    feconf.UPDATE_TYPE_FEEDBACK_MESSAGE.
                - 'activity_id': str. The ID of the exploration being committed
                    to or to which the feedback thread belongs.
                - 'activity_title': str. The title of the activity.
                - 'last_updated_ms': float. The time when the update was made,
                    in milliseconds since the Epoch.
                - 'author_id': str. The ID of the author who made the update.
                - 'subject': str. A brief description of the notification.
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
            activity_model_cls: ExplorationModel|CollectionModel. The
                storage layer object for an activity, such as
                exp_models.ExplorationModel.
            activity_ids_list: list(str). A list of activity IDs
                (such as exploration IDS) for which
                the latest commits will be retrieved.
            activity_type: str. The type of activity being referenced, such
                as 'exploration' or 'collection'.
            commit_type: str. This represents the activity update commit
                type, such as feconf.UPDATE_TYPE_EXPLORATION_COMMIT.
            delete_commit_message: str. This represents the commit message
                to use when an activity is found to be deleted, such as
                feconf.COMMIT_MESSAGE_EXPLORATION_DELETED.

        Returns:
            tuple(list(dict), list(ExplorationModel|CollectionModel)). A 2-tuple
            with following entries:
                - list(dict): A list, having information for every activity in
                    activity_ids_list. Each dict in this list has the following
                    keys:
                    - 'type': str. The value of the commit_type argument.
                    - 'activity_id': str. The ID of the activity for this
                        commit.
                    - 'activity_title': str. The title of the activity.
                    - 'author_id': str. The ID of the author who made the
                        commit.
                    - 'last_update_ms': float. The time when the commit was
                        created, in milliseconds since Epoch.
                    - 'subject': str. The commit message, or (if the activity
                        has been deleted) a message indicating that the activity
                        was deleted.
                - list(ExplorationModel|CollectionModel): A list containing
                    valid Exploration or Collection model instances which are
                    mappable to feedback threads.
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
        """Returns a list of datastore class references to map over."""
        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(item):
        """Implements the map function (generator).
        Computes most recent activity commits and feedbacks of a specific user.

        Args:
            item: UserSubscriptionsModel. An instance of UserSubscriptionsModel.

        Yields:
            This function may yield as many times as appropriate (including
            zero) 2-tuples in the format (str, dict), where
                - str: A key of the form 'user_id@job_queued_msec'.
                - dict: A dictionary with the following keys:
                    - 'type': str. Either feconf.UPDATE_TYPE_EXPLORATION_COMMIT
                        or feconf.UPDATE_TYPE_FEEDBACK_MESSAGE.
                    - 'activity_id': str. The ID of the exploration being
                        committed to or to which the feedback thread belongs.
                    - 'activity_title': str. The title of the activity.
                    - 'last_updated_ms': float. The time when the update was
                        made, in milliseconds since the Epoch.
                    - 'author_id': str. The ID of the author who made the
                        update.
                    - 'subject': str. A brief description of the recent updates.
        """
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
            threads = feedback_services.get_all_threads(
                'exploration', exp_model.id, False)
            for thread in threads:
                if thread.id not in feedback_thread_ids_list:
                    feedback_thread_ids_list.append(thread.id)

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

            yield (
                reducer_key, {
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
        """Implements the reduce function.

        This function updates an instance of UserRecentChangesBatchModel
        for a particular user, storing the most recent changes corresponding
        to things the user (for the given user_id) subscribes to.

        Args:
            key: str. Should be of the form 'user_id@job_queued_msec'.
            stringified_values: list(str). A list of all recent_activity_commits
                and feedback_threads that are tagged with the given key. Each
                entry is a stringified dict having the following keys:
                - 'type': str. Either feconf.UPDATE_TYPE_EXPLORATION_COMMIT or
                    feconf.UPDATE_TYPE_FEEDBACK_MESSAGE.
                - 'activity_id': str. The ID of the exploration being committed
                    to or to which the feedback thread belongs.
                - 'activity_title': str. The title of the activity.
                - 'last_updated_ms': float. The time when the changes were made,
                    in milliseconds since the Epoch.
                - 'author_id': str. The ID of the author who made the changes.
                - 'subject': str. The commit message or message indicating a
                    feedback update.
        """
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


class UserStatsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    """Storage class for entities in the realtime layer. See
    jobs.BaseRealtimeDatastoreClassForContinuousComputations class
    for more details.
    """
    total_plays = ndb.IntegerProperty(default=0)
    num_ratings = ndb.IntegerProperty(default=0)
    average_ratings = ndb.FloatProperty(indexed=True)


class UserStatsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes user stats for creator
    dashboard.

    This job does not have a working realtime component: the
    UserStatsRealtimeModel does nothing. There will be a delay in
    propagating new updates to the view; the length of the
    delay will be approximately the time it takes a batch job to run.
    """
    @classmethod
    def get_event_types_listened_to(cls):
        """Returns a list of event types that this class subscribes to."""
        return [
            feconf.EVENT_TYPE_START_EXPLORATION,
            feconf.EVENT_TYPE_RATE_EXPLORATION]

    @classmethod
    def _get_realtime_datastore_class(cls):
        return UserStatsRealtimeModel

    @classmethod
    def _get_batch_job_manager_class(cls):
        return UserStatsMRJobManager

    @classmethod
    def _handle_incoming_event(cls, active_realtime_layer, event_type, *args):
        """Records incoming events in the given realtime layer.

        Args:
            active_realtime_layer: int. The currently active realtime datastore
                layer.
            event_type: str. The event triggered by a student. For example, when
                a student starts an exploration, an event of type `start` is
                triggered and the total play count is incremented. If he/she
                rates an exploration, an event of type `rate` is triggered and
                average rating of the realtime model is refreshed.
            *args: list(*).
                If event_type is 'start', then this is a 1-element list with
                following entry:
                - str. The ID of the exploration currently being played.
                If event_type is 'rate_exploration', then this is a 3-element
                list with following entries:
                - str. The ID of the exploration currently being played.
                - float. The rating given by user to the exploration.
                - float. The old rating of the exploration, before it is
                    refreshed.
        """
        exp_id = args[0]

        def _refresh_average_ratings(user_id, rating, old_rating):
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, user_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, average_ratings=rating,
                    num_ratings=1, realtime_layer=active_realtime_layer).put()
            else:
                num_ratings = model.num_ratings
                average_ratings = model.average_ratings
                num_ratings += 1
                if average_ratings is not None:
                    sum_of_ratings = (
                        average_ratings * (num_ratings - 1) + rating)
                    if old_rating is not None:
                        sum_of_ratings -= old_rating
                        num_ratings -= 1
                    model.average_ratings = sum_of_ratings / (num_ratings * 1.0)
                else:
                    model.average_ratings = rating
                model.num_ratings = num_ratings
                model.put()

        def _increment_total_plays_count(user_id):
            realtime_class = cls._get_realtime_datastore_class()
            realtime_model_id = realtime_class.get_realtime_id(
                active_realtime_layer, user_id)

            model = realtime_class.get(realtime_model_id, strict=False)
            if model is None:
                realtime_class(
                    id=realtime_model_id, total_plays=1,
                    realtime_layer=active_realtime_layer).put()
            else:
                model.total_plays += 1
                model.put()

        exp_summary = exp_services.get_exploration_summary_by_id(exp_id)
        if exp_summary:
            for user_id in exp_summary.owner_ids:
                if event_type == feconf.EVENT_TYPE_START_EXPLORATION:
                    transaction_services.run_in_transaction(
                        _increment_total_plays_count, user_id)

                elif event_type == feconf.EVENT_TYPE_RATE_EXPLORATION:
                    rating = args[2]
                    old_rating = args[3]
                    transaction_services.run_in_transaction(
                        _refresh_average_ratings, user_id, rating, old_rating)

    # Public query method.
    @classmethod
    def get_dashboard_stats(cls, user_id):
        """Returns the dashboard stats associated with the given user_id.

        Args:
            user_id: str. The ID of the user.

        Returns:
            dict. This has the following keys:
                'total_plays': int. Number of times the user's explorations were
                    played.
                'num_ratings': int. Number of times the explorations have been
                    rated.
                'average_ratings': float. Average of average ratings across all
                    explorations.
        """
        total_plays = 0
        num_ratings = 0
        average_ratings = None

        sum_of_ratings = 0

        mr_model = user_models.UserStatsModel.get(user_id, strict=False)
        if mr_model is not None:
            total_plays += mr_model.total_plays
            num_ratings += mr_model.num_ratings
            if mr_model.average_ratings is not None:
                sum_of_ratings += (
                    mr_model.average_ratings * mr_model.num_ratings)

        realtime_model = cls._get_realtime_datastore_class().get(
            cls.get_active_realtime_layer_id(user_id), strict=False)

        if realtime_model is not None:
            total_plays += realtime_model.total_plays
            num_ratings += realtime_model.num_ratings
            if realtime_model.average_ratings is not None:
                sum_of_ratings += (
                    realtime_model.average_ratings * realtime_model.num_ratings)

        if num_ratings > 0:
            average_ratings = sum_of_ratings / float(num_ratings)

        return {
            'total_plays': total_plays,
            'num_ratings': num_ratings,
            'average_ratings': average_ratings
        }


class UserStatsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates stats models for every user.
    Includes: * average of average ratings of all explorations owned by the user
              * sum of total plays of all explorations owned by the user
              * impact score for all explorations contributed to by the user:
    Impact of user is defined as S^(2/3) where S is the sum
    over all explorations this user has contributed to of
    value (per_user) * reach * fractional contribution
    Value per user: average rating - 2
    Reach: sum over all cards of count of answers given ^ (2/3)
    Fractional contribution: percent of commits by this user
    The final number will be rounded to the nearest integer.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        return UserStatsAggregator

    @classmethod
    def entity_classes_to_map_over(cls):
        """Returns a list of datastore class references to map over."""
        return [exp_models.ExpSummaryModel]

    @staticmethod
    def map(item):
        """Implements the map function (generator).
        Computes exploration data for every contributor and owner of the
        exploration.

        Args:
            item: ExpSummaryModel. An instance of ExpSummaryModel.

        Yields:
            This function may yield as many times as appropriate 2-tuples in the
            format (str, dict), where
            - str. The unique ID of the user.
            - dict: A dict that includes entries for all the explorations that
                this user contributes to or owns. Each entry has the following
                keys:
                - 'exploration_impact_score': float. The impact score of all the
                    explorations contributed to by the user.
                - 'total_plays_for_owned_exp': int. Total plays of all
                    explorations owned by the user.
                - 'average_rating_for_owned_exp': float. Average of average
                    ratings of all explorations owned by the user.
                - 'num_ratings_for_owned_exp': int. Total number of ratings of
                    all explorations owned by the user.
        """
        if item.deleted:
            return

        exponent = 2.0 / 3

        # This is set to False only when the exploration impact score is not
        # valid to be calculated.
        calculate_exploration_impact_score = True

        # Get average rating and value per user.
        total_rating = 0
        for ratings_value in item.ratings:
            total_rating += item.ratings[ratings_value] * int(ratings_value)
        sum_of_ratings = sum(item.ratings.itervalues())

        average_rating = ((total_rating / sum_of_ratings) if sum_of_ratings
                          else None)

        if average_rating is not None:
            value_per_user = average_rating - 2
            if value_per_user <= 0:
                calculate_exploration_impact_score = False
        else:
            calculate_exploration_impact_score = False

        exploration_stats = stats_services.get_exploration_stats(
            item.id, item.version)
        # For each state, find the number of first entries to the state.
        # This is considered to be approximately equal to the number of
        # users who answered the state because very few users enter a state
        # and leave without answering anything at all.
        answer_count = exploration_stats.get_sum_of_first_hit_counts()
        num_starts = exploration_stats.num_starts

        # Turn answer count into reach.
        reach = answer_count**exponent

        exploration_summary = exp_services.get_exploration_summary_by_id(
            item.id)
        contributors = exploration_summary.contributors_summary
        total_commits = sum(contributors.itervalues())
        if total_commits == 0:
            calculate_exploration_impact_score = False

        mapped_owner_ids = []
        for contrib_id in contributors:
            exploration_data = {}

            # Set the value of exploration impact score only if it needs to be
            # calculated.
            if calculate_exploration_impact_score:
                # Find fractional contribution for each contributor.
                contribution = (
                    contributors[contrib_id] / float(total_commits))

                # Find score for this specific exploration.
                exploration_data.update({
                    'exploration_impact_score': (
                        value_per_user * reach * contribution)
                })

            # if the user is an owner for the exploration, then update dict with
            # 'average ratings' and 'total plays' as well.
            if contrib_id in exploration_summary.owner_ids:
                mapped_owner_ids.append(contrib_id)
                # Get num starts (total plays) for the exploration.
                exploration_data.update({
                    'total_plays_for_owned_exp': num_starts,
                })
                # Update data with average rating only if it is not None.
                if average_rating is not None:
                    exploration_data.update({
                        'average_rating_for_owned_exp': average_rating,
                        'num_ratings_for_owned_exp': sum_of_ratings
                    })
            yield (contrib_id, exploration_data)

        for owner_id in exploration_summary.owner_ids:
            if owner_id not in mapped_owner_ids:
                mapped_owner_ids.append(owner_id)
                # Get num starts (total plays) for the exploration.
                exploration_data = {
                    'total_plays_for_owned_exp': num_starts,
                }
                # Update data with average rating only if it is not None.
                if average_rating is not None:
                    exploration_data.update({
                        'average_rating_for_owned_exp': average_rating,
                        'num_ratings_for_owned_exp': sum_of_ratings
                    })
                yield (owner_id, exploration_data)

    @staticmethod
    def reduce(key, stringified_values):
        """Implements the reduce function.

        This function creates or updates the UserStatsModel instance for the
        given user. It updates the impact score, total plays of all
        explorations, number of ratings across all explorations and average
        rating.

        Args:
            key: str. The unique ID of the user.
            stringified_values: list(str). A list of information regarding all
                the explorations that this user contributes to or owns. Each
                entry is a stringified dict having the following keys:
                - 'exploration_impact_score': float. The impact score of all the
                    explorations contributed to by the user.
                - 'total_plays_for_owned_exp': int. Total plays of all
                    explorations owned by the user.
                - 'average_rating_for_owned_exp': float. Average of average
                    ratings of all explorations owned by the user.
                - 'num_ratings_for_owned_exp': int. Total number of ratings of
                    all explorations owned by the user.
        """
        values = [ast.literal_eval(v) for v in stringified_values]
        exponent = 2.0 / 3

        # Find the final score and round to a whole number.
        user_impact_score = int(round(sum(
            value['exploration_impact_score'] for value in values
            if value.get('exploration_impact_score')) ** exponent))

        # Sum up the total plays for all explorations.
        total_plays = sum(
            value['total_plays_for_owned_exp'] for value in values
            if value.get('total_plays_for_owned_exp'))

        # Sum of ratings across all explorations.
        sum_of_ratings = 0
        # Number of ratings across all explorations.
        num_ratings = 0

        for value in values:
            if value.get('num_ratings_for_owned_exp'):
                num_ratings += value['num_ratings_for_owned_exp']
                sum_of_ratings += (
                    value['average_rating_for_owned_exp'] * value['num_ratings_for_owned_exp'])  #pylint: disable=line-too-long

        mr_model = user_models.UserStatsModel.get_or_create(key)
        mr_model.impact_score = user_impact_score
        mr_model.total_plays = total_plays
        mr_model.num_ratings = num_ratings
        if sum_of_ratings != 0:
            average_ratings = (sum_of_ratings / float(num_ratings))
            mr_model.average_ratings = average_ratings
        mr_model.put()
