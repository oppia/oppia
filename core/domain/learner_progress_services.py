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

"""Services for tracking the progress of the learner."""

import json

from core.platform import models
from core.domain import subscription_services

(user_models,) = models.Registry.import_models([
    models.NAMES.user
])

def add_exp_id_to_completed_list(user_id, exploration_id):
    """Adds the exploration id to the completed list of the user.

    Callers of this function must ensure that the user id and the
    exploration id are valid.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))
    if not activities_completed_model:
        activities_completed_model = (
            user_models.ActivitiesCompletedByLearnerModel(id=user_id))

    exploration_created_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    exp_partially_completed_model = (
        user_models.ExplorationsPartiallyCompletedByLearnerModel.get(
            user_id, strict=False))
    if not exp_partially_completed_model:
        exp_partially_completed_model = (
            user_models.ExplorationsPartiallyCompletedByLearnerModel(
                id=user_id))

    if (exploration_id not in exploration_created_ids and
        exploration_id not in activities_completed_model.completed_exp_ids):
        activities_completed_model.completed_exp_ids.append(exploration_id)
        activities_completed_model.put()


def add_exp_to_partially_completed_list(
    user_id, exploration_id, timestamp, state_name, version):
    """Adds the exploration id to the partially completed list of the user.

    Callers of this function must ensure that all the arguments provided are
    valid.
    """
    exp_partially_completed_model = (
        user_models.ExplorationsPartiallyCompletedByLearnerModel.get(
            user_id, strict=False))
    if not exp_partially_completed_model:
        exp_partially_completed_model = (
            user_models.ExplorationsPartiallyCompletedByLearnerModel(
                id=user_id))

    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))
    if not activities_completed_model:
        activities_completed_model = (
            user_models.ActivitiesCompletedByLearnerModel(id=user_id))

    exploration_created_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    partially_completed_exp_details = {
        'timestamp': str(timestamp),
        'state_name': state_name,
        'version': version
    }

    partially_completed_exp = {
        exploration_id: partially_completed_exp_details
    }

    exp_already_present = False
    if (exploration_id not in
        activities_completed_model.completed_exp_ids and
        exploration_id not in exploration_created_ids):

        for exp in exp_partially_completed_model.partially_completed_exps:
            if exploration_id == exp.keys()[0]:
                exp[exploration_id] = partially_completed_exp_details
                exp_already_present = True
        
        if not exp_already_present:
            exp_partially_completed_model.partially_completed_exps.append(
                partially_completed_exp)
        exp_partially_completed_model.put()
