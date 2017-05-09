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

from core.platform import models
from core.domain import subscription_services

(user_models,) = models.Registry.import_models([
    models.NAMES.user
])

def add_exp_id_to_completed_list(user_id, exp_id):
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

    if (exp_id not in exploration_created_ids and
            exp_id not in activities_completed_model.completed_exp_ids):
        remove_exp_from_partially_completed_list(user_id, exp_id)
        activities_completed_model.completed_exp_ids.append(exp_id)
        activities_completed_model.put()

def add_collection_id_to_completed_list(user_id, collection_id):
    """Adds the collection id to the list of collections completed by the user.

    Callers of this function must ensure that the user id and collection id are
    valid.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))
    if not activities_completed_model:
        activities_completed_model = (
            user_models.ActivitiesCompletedByLearnerModel(id=user_id))

    collection_created_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    if (collection_id not in collection_created_ids and
            collection_id not in activities_completed_model.completed_collection_ids):  # pylint: disable=line-too-long
        activities_completed_model.completed_collection_ids.append(
            collection_id)
        activities_completed_model.put()

def add_exp_to_partially_completed_list(
        user_id, exploration_id, timestamp, state_name, version):
    """Adds the exploration id to the partially completed list of the user.

    Callers of this function must ensure that all the arguments provided are
    valid.
    """
    exp_partially_completed_model = (
        user_models.ExplorationsPartiallyCompletedModel.get(
            user_id, strict=False))
    if not exp_partially_completed_model:
        exp_partially_completed_model = (
            user_models.ExplorationsPartiallyCompletedModel(
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

def add_collection_id_to_incomplete_list(user_id, collection_id):
    """Adds the collection id to the list of collections partially completed by
    the user.

    Callers of this function must ensure that the user id and collection id are
    valid.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))
    if not activities_completed_model:
        activities_completed_model = (
            user_models.ActivitiesCompletedByLearnerModel(id=user_id))

    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))
    if not incomplete_collections_model:
        incomplete_collections_model = (
            user_models.IncompleteCollectionsModel(id=user_id))

    collection_created_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    if (collection_id not in collection_created_ids and
            collection_id not in incomplete_collections_model.incomplete_collection_ids and # pylint: disable=line-too-long
            collection_id not in activities_completed_model.completed_collection_ids): # pylint: disable=line-too-long
        incomplete_collections_model.incomplete_collection_ids.append()
        incomplete_collections_model.put()

def remove_exp_from_partially_completed_list(user_id, exploration_id):
    """Removes the exploration from the partially completed list of the user.

    Callers of this function must ensure that the user id and the
    exploration id are valid.
    """
    exp_partially_completed_model = (
        user_models.ExplorationsPartiallyCompletedModel.get(
            user_id, strict=False))

    for exp in exp_partially_completed_model.partially_completed_exps:
        if exploration_id == exp.keys()[0]:
            exp_partially_completed_model.partially_completed_exps.remove(exp)
            exp_partially_completed_model.put()

def remove_collection_from_incomplete_list(user_id, collection_id):
    """Removes the collection id from the list of partially completed
    collections.

    Callers of this function must ensure that the user id and
    collection id are valid.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))

    if collection_id in incomplete_collections_model.incomplete_collection_ids:
        incomplete_collections_model.incomplete_collection_ids.remove(
            collection_id)
        incomplete_collections_model.put()

def get_all_completed_exp_ids(user_id):
    """Returns a list with the ids of all the explorations completed by the
    user.

    Callers of this function should ensure that the user_id is valid.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))

    return (
        activities_completed_model.completed_exp_ids if
        activities_completed_model else [])

def get_all_completed_collection_ids(user_id):
    """Returns a list with the ids of all the collections completed by the
    user.

    Callers of this function should ensure that the user id is valid.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))

    return (
        activities_completed_model.completed_collection_ids if
        activities_completed_model else [])

def get_all_partially_completed_exp_ids(user_id):
    """Returns a list with the ids of all the explorations partially completed
    by the user.

    Callers of this function must ensure that the user id is valid.
    """
    exp_partially_completed_model = (
        user_models.ExplorationsPartiallyCompletedModel.get(
            user_id, strict=False))

    if exp_partially_completed_model:
        partially_completed_exp_ids = [
            exp.keys()[0] for exp in
            exp_partially_completed_model.partially_completed_exps]
    else:
        partially_completed_exp_ids = []

    return partially_completed_exp_ids

def get_all_incomplete_collection_ids(user_id):
    """Returns a list with the ids of all the collections partially completed
    by the user.

    Callers of this function must ensure that the user id is valid.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))

    return (
        incomplete_collections_model.incomplete_collection_ids if
        incomplete_collections_model else [])
