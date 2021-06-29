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

from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

import ast

from core import jobs
from core.domain import exp_fetchers
from core.domain import stats_services
from core.platform import models
import feconf
import python_utils

(exp_models, collection_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.collection, models.NAMES.user]))

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()


class UserStatsRealtimeModel(
        jobs.BaseRealtimeDatastoreClassForContinuousComputations):
    """Storage class for entities in the realtime layer. See
    jobs.BaseRealtimeDatastoreClassForContinuousComputations class for more
    details.
    """

    total_plays = datastore_services.IntegerProperty(default=0)
    num_ratings = datastore_services.IntegerProperty(default=0)
    average_ratings = datastore_services.FloatProperty(indexed=True)


class UserStatsAggregator(jobs.BaseContinuousComputationManager):
    """A continuous-computation job that computes user stats for creator
    dashboard.

    This job does not have a working realtime component: the
    UserStatsRealtimeModel does nothing. There will be a delay in propagating
    new updates to the view; the length of the delay will be approximately the
    time it takes a batch job to run.
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
            *args: list(*). If event_type is 'start', then this is a 1-element
                list containing:
                    str. The id of the exploration currently being played.
                If event_type is 'rate_exploration', then this is a 3-element
                list containing:
                    str. The id of the exploration currently being played.
                    float. The rating given by user to the exploration.
                    float. The old rating of the exploration, before it is
                        refreshed.
        """
        exp_id = args[0]

        @transaction_services.run_in_transaction_wrapper
        def _refresh_average_ratings_transactional(user_id, rating, old_rating):
            """Refreshes the average ratings in the given realtime layer.

            Args:
                user_id: str. The id of the user.
                rating: int. The new rating of the exploration.
                old_rating: int. The old rating of the exploration before
                    refreshing.
            """
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
                    model.average_ratings = python_utils.divide(
                        sum_of_ratings, float(num_ratings))
                else:
                    model.average_ratings = rating
                model.num_ratings = num_ratings
                model.update_timestamps()
                model.put()

        @transaction_services.run_in_transaction_wrapper
        def _increment_total_plays_count_transactional(user_id):
            """Increments the total plays count of the exploration in the
            realtime layer.

            Args:
                user_id: str. The id of the user.
            """
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
                model.update_timestamps()
                model.put()

        exp_summary = exp_fetchers.get_exploration_summary_by_id(exp_id)
        if exp_summary:
            for user_id in exp_summary.owner_ids:
                if event_type == feconf.EVENT_TYPE_START_EXPLORATION:
                    _increment_total_plays_count_transactional(user_id)

                elif event_type == feconf.EVENT_TYPE_RATE_EXPLORATION:
                    rating = args[2]
                    old_rating = args[3]
                    _refresh_average_ratings_transactional(
                        user_id, rating, old_rating)

    # Public query method.
    @classmethod
    def get_dashboard_stats(cls, user_id):
        """Returns the dashboard stats associated with the given user_id.

        Args:
            user_id: str. The id of the user.

        Returns:
            dict. Has the keys:
                total_plays: int. Number of times the user's explorations were
                    played.
                num_ratings: int. Number of times the explorations have been
                    rated.
                average_ratings: float. Average of average ratings across all
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
            average_ratings = python_utils.divide(
                sum_of_ratings, float(num_ratings))

        return {
            'total_plays': total_plays,
            'num_ratings': num_ratings,
            'average_ratings': average_ratings
        }


class UserStatsMRJobManager(
        jobs.BaseMapReduceJobManagerForContinuousComputations):
    """Job that calculates stats models for every user.

    Includes:
        - Average of average ratings of all explorations owned by the user.
        - Sum of total plays of all explorations owned by the user.
        - Impact score for all explorations contributed to by the user.

    The impact of user is defined as `S ^ (2 / 3)` where S is the sum over all
    explorations this user has contributed to determined by the value (rounded
    to nearest integer):
        `per_user * reach * fractional_contribution`, where:
            per_user: average rating - 2.
            reach: sum(card.answers_given for card in all_cards) ^ (2 / 3).
            fractional_contribution: percent of commits by this user.
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
            tuple(owner_id, exploration_data). Where:
                owner_id: str. The unique id of the user.
                exploration_data: dict. Has the keys:
                    exploration_impact_score: float. The impact score of all the
                        explorations contributed to by the user.
                    total_plays_for_owned_exp: int. Total plays of all
                        explorations owned by the user.
                    average_rating_for_owned_exp: float. Average of average
                        ratings of all explorations owned by the user.
                    num_ratings_for_owned_exp: int. Total number of ratings of
                        all explorations owned by the user.
        """
        if item.deleted:
            return

        exponent = python_utils.divide(2.0, 3)

        # This is set to False only when the exploration impact score is not
        # valid to be calculated.
        calculate_exploration_impact_score = True

        # Get average rating and value per user.
        total_rating = 0
        for ratings_value in item.ratings:
            total_rating += item.ratings[ratings_value] * int(ratings_value)
        sum_of_ratings = sum(item.ratings.values())

        average_rating = (
            python_utils.divide(total_rating, sum_of_ratings)
            if sum_of_ratings else None)

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
        reach = answer_count ** exponent

        exploration_summary = exp_fetchers.get_exploration_summary_by_id(
            item.id)
        contributors = exploration_summary.contributors_summary
        total_commits = sum(contributors.values())
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
                    python_utils.divide(
                        contributors[contrib_id], float(total_commits)))

                # Find score for this specific exploration.
                exploration_data.update({
                    'exploration_impact_score': (
                        value_per_user * reach * contribution)
                })

            # If the user is an owner for the exploration, then update dict with
            # 'average ratings' and 'total plays' as well.
            if contrib_id in exploration_summary.owner_ids:
                mapped_owner_ids.append(contrib_id)
                # Get number of starts (total plays) for the exploration.
                exploration_data.update({
                    'total_plays_for_owned_exp': num_starts
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
                # Get number of starts (total plays) for the exploration.
                exploration_data = {
                    'total_plays_for_owned_exp': num_starts
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
            key: str. The unique id of the user.
            stringified_values: list(str). A list of information regarding all
                the explorations that this user contributes to or owns. Each
                entry is a stringified dict having the following keys:
                    exploration_impact_score: float. The impact score of all the
                        explorations contributed to by the user.
                    total_plays_for_owned_exp: int. Total plays of all
                        explorations owned by the user.
                    average_rating_for_owned_exp: float. Average of average
                        ratings of all explorations owned by the user.
                    num_ratings_for_owned_exp: int. Total number of ratings of
                        all explorations owned by the user.
        """
        values = [ast.literal_eval(v) for v in stringified_values]
        exponent = python_utils.divide(2.0, 3)

        # Find the final score and round to a whole number.
        user_impact_score = int(python_utils.ROUND(sum(
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
                    value['average_rating_for_owned_exp'] *
                    value['num_ratings_for_owned_exp'])

        mr_model = user_models.UserStatsModel.get_or_create(key)
        mr_model.impact_score = user_impact_score
        mr_model.total_plays = total_plays
        mr_model.num_ratings = num_ratings
        if sum_of_ratings != 0:
            average_ratings = python_utils.divide(
                sum_of_ratings, float(num_ratings))
            mr_model.average_ratings = average_ratings
        mr_model.update_timestamps()
        mr_model.put()
