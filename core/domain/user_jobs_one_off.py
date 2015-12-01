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
import math

from core import jobs
from core.domain import exp_services
from core.domain import rating_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import stats_jobs_continuous
from core.domain import user_services
from core.platform import models
(exp_models, collection_models, feedback_models, user_models,
    stats_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.collection,
        models.NAMES.feedback, models.NAMES.user,
        models.NAMES.statistics])
    )
import utils


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


class UserImpactCalculationOneOffJob(jobs.BaseMapReduceJobManager):
    """ Calculates each user's impact score, where impact score is defined as:
    Sum of (
    ln(playthroughs) * (ratings_scaler) * (average(ratings) - 2.5))
    *(multiplier),
    where multiplier = 10, and ratings_scaler is .1 * (number of ratings)
    if there are < 10 ratings for that exploration.

    The impact score is 0 for an exploration with 0 playthroughs or with an
    average rating of less than 2.5.

    Impact scores are calculated over explorations for which a user
    is listed as a contributor.
    """

    MULTIPLIER = 10
    MIN_AVERAGE_RATING = 2.5
    NUM_RATINGS_SCALER_CUTOFF = 10
    NUM_RATINGS_SCALER = .1

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @classmethod
    def _get_exp_impact_score(cls, exploration_id):
        # Get ratings and compute average rating score.
        rating_frequencies = rating_services.get_overall_ratings_for_exploration(
            exploration_id)
        total_num_ratings = 0
        total_rating = 0.0
        for rating, num_ratings in rating_frequencies.iteritems():
            total_rating += (int(rating) * num_ratings)
            total_num_ratings += num_ratings
        # Only divide by a non-zero number.
        if total_num_ratings == 0:
            return 0
        average_rating = total_rating / total_num_ratings

        # Get rating term to use in impact calculation.
        rating_term = average_rating - cls.MIN_AVERAGE_RATING
        # Only explorations with an average rating greater than the minimum
        # have an impact.
        if rating_term <= 0:
            return 0

        # Get num_ratings_scaler.
        if total_num_ratings < cls.NUM_RATINGS_SCALER_CUTOFF:
            num_ratings_scaler = cls.NUM_RATINGS_SCALER * total_num_ratings
        else:
            num_ratings_scaler = 1.0

        # Get number of completions/playthroughs.
        num_completions = stats_jobs_continuous.StatisticsAggregator.get_statistics(
            exploration_id,
            stats_jobs_continuous.VERSION_ALL)['complete_exploration_count']
        # Only take the log of a non-zero number.
        if num_completions <= 0:
            return 0
        num_completions_term = math.log(num_completions)

        exploration_impact_score = (
            rating_term *
            num_completions_term *
            num_ratings_scaler *
            cls.MULTIPLIER
        )

        return exploration_impact_score

    @staticmethod
    def map(item):
        exploration_impact_score = (
            UserImpactCalculationOneOffJob._get_exp_impact_score(item.id))

        if exploration_impact_score > 0:
            # Get exploration summary and contributor ids,
            # yield for each contributor.
            exploration_summary = exp_services.get_exploration_summary_by_id(
                item.id)
            contributor_ids = exploration_summary.contributor_ids
            for contributor_id in contributor_ids:
                yield (contributor_id, exploration_impact_score)

    @staticmethod
    def reduce(key, stringified_values):
        values = [ast.literal_eval(v) for v in stringified_values]
        user_impact_score = int(round(sum(values)))
        user_models.UserStatsModel(id=key, impact_score=user_impact_score).put()


class UserFirstContributionMsecOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job that updates first contribution time in milliseconds for
    current users. This job makes the assumption that once an exploration is
    published, it remains published. This job is not completely precise in that
    (1) we ignore explorations that have been published in the past but are now
    unpublished, and (2) commits that were made during an interim unpublished
    period are counted against the first publication date instead of the second
    publication date.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotMetadataModel]

    @staticmethod
    def map(item):
        exp_id = item.get_unversioned_instance_id()
        exp_first_published_msec = rights_manager.get_exploration_rights(
            exp_id).first_published_msec
        # First contribution time in msec is only set from contributions to
        # explorations that are currently published.
        if not rights_manager.is_exploration_private(exp_id):
            created_on_msec = utils.get_time_in_millisecs(item.created_on)
            yield (
                item.committer_id,
                max(exp_first_published_msec, created_on_msec)
            )

    @staticmethod
    def reduce(user_id, stringified_commit_times_msec):
        commit_times_msec = [
            ast.literal_eval(commit_time_string) for
            commit_time_string in stringified_commit_times_msec]
        first_contribution_msec = min(commit_times_msec)
        user_services.update_first_contribution_msec_if_not_set(
            user_id, first_contribution_msec)
