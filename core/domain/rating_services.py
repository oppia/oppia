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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import event_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.platform import models
import feconf
import python_utils

(exp_models, user_models,) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.user])
transaction_services = models.Registry.import_transaction_services()

ALLOWED_RATINGS = [1, 2, 3, 4, 5]


def assign_rating_to_exploration(user_id, exploration_id, new_rating):
    """Records the rating awarded by the user to the exploration in both the
    user-specific data and exploration summary.

    This function validates the exploration id but not the user id.

    Args:
        user_id: str. The id of the user assigning the rating.
        exploration_id: str. The id of the exploration that is
            assigned a rating.
        new_rating: int. Value of assigned rating, should be between
            1 and 5 inclusive.
    """

    if not isinstance(new_rating, int):
        raise ValueError(
            'Expected the rating to be an integer, received %s' % new_rating)

    if new_rating not in ALLOWED_RATINGS:
        raise ValueError('Expected a rating 1-5, received %s.' % new_rating)

    try:
        exp_fetchers.get_exploration_by_id(exploration_id)
    except:
        raise Exception('Invalid exploration id %s' % exploration_id)

    def _update_user_rating():
        """Updates the user rating of the exploration. Returns the old rating
        before updation.
        """
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

    exploration_summary = exp_fetchers.get_exploration_summary_by_id(
        exploration_id)
    if not exploration_summary.ratings:
        exploration_summary.ratings = feconf.get_empty_ratings()
    exploration_summary.ratings[python_utils.UNICODE(new_rating)] += 1
    if old_rating:
        exploration_summary.ratings[python_utils.UNICODE(old_rating)] -= 1

    event_services.RateExplorationEventHandler.record(
        exploration_id, user_id, new_rating, old_rating)

    exploration_summary.scaled_average_rating = (
        exp_services.get_scaled_average_rating(
            exploration_summary.ratings))

    exp_services.save_exploration_summary(exploration_summary)


def get_user_specific_rating_for_exploration(user_id, exploration_id):
    """Fetches a rating for the specified exploration from the specified user
    if one exists.

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration.

    Returns:
        int or None. An integer between 1 and 5 inclusive, or None if the user
        has not previously rated the exploration.
    """
    exp_user_data_model = user_models.ExplorationUserDataModel.get(
        user_id, exploration_id)
    return exp_user_data_model.rating if exp_user_data_model else None


def get_when_exploration_rated(user_id, exploration_id):
    """Fetches the datetime the exploration was last rated by this user, or
    None if no rating has been awarded.

    Currently this function is only used for testing purposes.

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration.

    Returns:
        datetime.datetime or None. When the exploration was last
        rated by the user, or None if the user has not previously
        rated the exploration.
    """
    exp_user_data_model = user_models.ExplorationUserDataModel.get(
        user_id, exploration_id)
    return exp_user_data_model.rated_on if exp_user_data_model else None


def get_overall_ratings_for_exploration(exploration_id):
    """Fetches all ratings for an exploration.

    Args:
        exploration_id: str. The id of the exploration.

    Returns:
        dict. A dict whose keys are '1', '2', '3', '4', '5' and whose
        values are nonnegative integers representing the frequency counts
        of each rating.
    """
    exp_summary = exp_fetchers.get_exploration_summary_by_id(exploration_id)
    return exp_summary.ratings
