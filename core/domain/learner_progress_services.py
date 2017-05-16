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

from core.domain import subscription_services
from core.platform import models
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


def add_exp_id_to_completed_list(user_id, exp_id):
    """Adds the exploration id to the completed list of the user unless the
    exploration has already been completed or has been created by the user.
    It is also removed from the incomplete list (if present).

    Args:
        user_id: str. The id of the learner.
        exp_id: str. The id of the exploration.
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
            exp_id not in activities_completed_model.completed_exploration_ids):
        # Remove the exploration from the in progress list (if present) as it is
        # now completed.
        remove_exp_from_incomplete_list(user_id, exp_id)
        activities_completed_model.completed_exploration_ids.append(exp_id)
        activities_completed_model.put()

def add_collection_id_to_completed_list(user_id, collection_id):
    """Adds the collection id to the list of collections completed by the user
    unless the collection has already been completed or has been created by the
    user. It is also removed from the incomplete list (if present).

    Args:
        user_id: str. The id of the learner.
        collection_id: str. The id of the collection.
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
            collection_id not in
            activities_completed_model.completed_collection_ids):
        # Remove the collection from the in progress list (if present) as it is
        # now completed.
        remove_collection_from_incomplete_list(user_id, collection_id)
        activities_completed_model.completed_collection_ids.append(
            collection_id)
        activities_completed_model.put()

def add_exp_to_incomplete_list(
        user_id, timestamp, exploration_id, state_name, exploration_version):
    """Adds the exploration id to the incomplete list of the user unless the
    exploration has been already completed or has been created by the user. If
    the exploration is already present in the incomplete list, just the details
    associated with it are updated.

    Args:
        user_id: str. The id of the learner.
        timestamp: datetime.datetime. The time at which the user left the
            exploraion.
        exploration_id: str. The id of the exploration.
        state_name: str. The name of the state at which the user left the
            exploration.
        exploration_version: str. The version of the exploration played by the
            learner.
    """
    incomplete_explorations_model = (
        user_models.IncompleteExplorationsModel.get(
            user_id, strict=False))
    if not incomplete_explorations_model:
        incomplete_explorations_model = (
            user_models.IncompleteExplorationsModel(id=user_id))

    completed_exploration_ids = get_all_completed_exp_ids(user_id)

    exploration_created_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    if (exploration_id not in completed_exploration_ids and
            exploration_id not in exploration_created_ids):

        if exploration_id not in incomplete_explorations_model.incomplete_exploration_ids: # pylint: disable=line-too-long
            incomplete_explorations_model.incomplete_exploration_ids.append(
                exploration_id)

        incomplete_exploration_user_model = (
            incomplete_explorations_model.get_last_playthrough_information_model( # pylint: disable=line-too-long
                exploration_id))
        incomplete_exploration_user_model.update_last_played_information(
            utils.get_time_in_millisecs(timestamp),
            exploration_version,
            state_name)

        incomplete_explorations_model.put()

def add_collection_id_to_incomplete_list(user_id, collection_id):
    """Adds the collection id to the list of collections partially completed by
    the user unless the collection has already been completed or has been
    created by the user or is already present in the incomplete list.

    Args:
        user_id: str. The id of the learner.
        collection_id: str. The id of the collection.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))
    if not incomplete_collections_model:
        incomplete_collections_model = (
            user_models.IncompleteCollectionsModel(id=user_id))

    completed_collection_ids = get_all_completed_collection_ids(user_id)

    collection_created_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    if (collection_id not in collection_created_ids and
            collection_id not in incomplete_collections_model.incomplete_collection_ids and # pylint: disable=line-too-long
            collection_id not in completed_collection_ids):
        incomplete_collections_model.incomplete_collection_ids.append(
            collection_id)
        incomplete_collections_model.put()

def remove_exp_from_incomplete_list(user_id, exploration_id):
    """Removes the exploration from the incomplete list of the user
    (if present).

    Args:
        user_id: str. The id of the learner.
        exploration_id: str. The id of the exploration.
    """
    incomplete_explorations_model = (
        user_models.IncompleteExplorationsModel.get(user_id, strict=False))

    if incomplete_explorations_model:
        if exploration_id in incomplete_explorations_model.incomplete_exploration_ids: # pylint: disable=line-too-long
            incomplete_explorations_model.incomplete_exploration_ids.remove(
                exploration_id)
            incomplete_exploration_user_model = (
                incomplete_explorations_model.get_last_playthrough_information_model( # pylint: disable=line-too-long
                    exploration_id))
            incomplete_exploration_user_model.delete()
            incomplete_explorations_model.put()

def remove_collection_from_incomplete_list(user_id, collection_id):
    """Removes the collection id from the list of incomplete collections
    (if present).

    Args:
        user_id: str. The id of the learner.
        collection_id: str. The id of the collection.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))

    if incomplete_collections_model:
        if collection_id in incomplete_collections_model.incomplete_collection_ids: # pylint: disable=line-too-long
            incomplete_collections_model.incomplete_collection_ids.remove(
                collection_id)
            incomplete_collections_model.put()

def get_all_completed_exp_ids(user_id):
    """Returns a list with the ids of all the explorations completed by the
    user.

    Args:
        user_id: str. The id of the learner.

    Returns:
        list(str). A list of the ids of the explorations completed by the
            learner.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))

    return (
        activities_completed_model.completed_exploration_ids if
        activities_completed_model else [])

def get_all_completed_collection_ids(user_id):
    """Returns a list with the ids of all the collections completed by the
    user.

    Args:
        user_id: str. The id of the learner.

    Returns:
        list(str). A list of the ids of the collections completed by the
            learner.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))

    return (
        activities_completed_model.completed_collection_ids if
        activities_completed_model else [])

def get_all_incomplete_exp_ids(user_id):
    """Returns a list with the ids of all the explorations partially completed
    by the user.

    Args:
        user_id: str. The id of the learner.

    Returns:
        list(str). A list of the ids of the explorations partially completed by
            the learner.
    """
    incomplete_explorations_model = (
        user_models.IncompleteExplorationsModel.get(
            user_id, strict=False))

    return (
        incomplete_explorations_model.incomplete_exploration_ids if
        incomplete_explorations_model else [])


def get_all_incomplete_collection_ids(user_id):
    """Returns a list with the ids of all the collections partially completed
    by the user.

    Args:
        user_id: str. The id of the learner.

    Returns:
        list(str). A list of the ids of the collections partially completed by
            the learner.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))

    return (
        incomplete_collections_model.incomplete_collection_ids if
        incomplete_collections_model else [])
