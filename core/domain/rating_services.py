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

__author__ = 'Jacob Davis'


from core.platform import models
(user_models,) = models.Registry.import_models([models.NAMES.user])
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
from core.domain import exp_services
transaction_services = models.Registry.import_transaction_services()


# This validates the exploration id but not the user id.
def assign_rating(user_id, exploration_id, new_rating):
    if new_rating not in [1, 2, 3, 4, 5]:
        raise ValueError('Rating of %s is not acceptable.' % rating)

    try:
        exploration = exp_services.get_exploration_by_id(exploration_id)
    except:
        raise Exception('Invalid exploration id %s' % exploration_id)

    def _update_user_rating():
        user_specific_entry = user_models.ExpUserDataModel.get(
            user_id, exploration_id)
        if user_specific_entry:
            old_rating = user_specific_entry.rating
        else:
            old_rating = None
            user_specific_entry = user_models.ExpUserDataModel.create(
                user_id, exploration_id)
        user_specific_entry.rating = new_rating
        user_specific_entry.put()
        return old_rating
    old_rating = transaction_services.run_in_transaction(_update_user_rating)

    exploration_summary = exp_services.get_exploration_summary_by_id(
        exploration_id)
    exploration_summary.ratings[str(new_rating)] = (
        exploration_summary.ratings[str(new_rating)] + 1)
    if old_rating:
        exploration_summary.ratings[str(old_rating)] = (
            exploration_summary.ratings[str(old_rating)] - 1)
    exp_services.save_exploration_summary(exploration_summary)

# This returns either an integer 1-5 or None if there is no such rating
def get_user_specific_rating(user_id, exploration_id):
    user_specific_entry = user_models.ExpUserDataModel.get(
        user_id, exploration_id)
    return user_specific_entry.rating if user_specific_entry else None

def get_overall_ratings(exploration_id):
    exp_summary = exp_services.get_exploration_summary_by_id(exploration_id)
    return exp_summary.ratings
