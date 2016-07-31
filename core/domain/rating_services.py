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

"""System for assigning and displaying ratings of explorations."""

import datetime

from core.domain import event_services
from core.domain import exp_services
from core.platform import models
import feconf
(exp_models, user_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])
transaction_services = models.Registry.import_transaction_services()

ALLOWED_RATINGS = [1, 2, 3, 4, 5]


def assign_rating_to_exploration(user_id, exploration_id, new_rating):
    """Records the rating awarded by the user to the exploration in both the
    user-specific data and exploration summary.

    It validates the exploration id but not the user id.

     - 'new_rating' should be an integer between 1 and 5
    """

    if not isinstance(new_rating, int):
        raise ValueError(
            'Expected the rating to be an integer, received %s' % new_rating)

    if new_rating not in ALLOWED_RATINGS:
        raise ValueError('Expected a rating 1-5, received %s.' % new_rating)

    try:
        exp_services.get_exploration_by_id(exploration_id)
    except:
        raise Exception('Invalid exploration id %s' % exploration_id)

    def _update_user_rating():
        exp_user_data_model = user_models.ExplorationUserDataModel.get(
            user_id, exploration_id)
        if exp_user_data_model:
            old_rating = exp_user_data_model.rating
        else:
            old_rating = None
            exp_user_data_model = user_models.ExplorationUserDataModel.create(
                user_id, exploration_id)
        exp_user_data_model.rating = new_rating
        exp_user_data_model.rated_on = datetime.datetime.utcnow()
        exp_user_data_model.put()
        return old_rating
    old_rating = transaction_services.run_in_transaction(_update_user_rating)

    exploration_summary = exp_services.get_exploration_summary_by_id(
        exploration_id)
    if not exploration_summary.ratings:
        exploration_summary.ratings = feconf.get_empty_ratings()
    exploration_summary.ratings[str(new_rating)] += 1
    if old_rating:
        exploration_summary.ratings[str(old_rating)] -= 1

    event_services.RateExplorationEventHandler.record(
        exploration_id, user_id, new_rating, old_rating)

    exploration_summary.scaled_average_rating = (
        exp_services.get_scaled_average_rating(
            exploration_summary.ratings))

    exp_services.save_exploration_summary(exploration_summary)


def get_user_specific_rating_for_exploration(user_id, exploration_id):
    """
    Returns:
        An integer 1-5, or None if there is no rating of this exploration by
        this user.
    """
    exp_user_data_model = user_models.ExplorationUserDataModel.get(
        user_id, exploration_id)
    return exp_user_data_model.rating if exp_user_data_model else None


def get_when_exploration_rated(user_id, exploration_id):
    """Returns the date-time the exploration was lasted rated by this user, or
    None if no such rating has been awarded.

    Currently this function is only used for testing since the times ratings
    were awarded are not used for anything.
    """
    exp_user_data_model = user_models.ExplorationUserDataModel.get(
        user_id, exploration_id)
    return exp_user_data_model.rated_on if exp_user_data_model else None


def get_overall_ratings_for_exploration(exploration_id):
    exp_summary = exp_services.get_exploration_summary_by_id(exploration_id)
    return exp_summary.ratings
