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
from core.domain import user_domain
from core.platform import models
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


def get_activities_completed_from_model(activities_completed_model):
    """Returns an activities completed domain object given a
    activities completed model loaded from the datastore.

    Args:
        activities_completed_model: ActivitiesCompletedByLearnerModel. The
            activities completed model loaded from the datastore.

    Returns:
        ActivitiesCompletedByLearner: ActivitiesCompletedByLearner. A domain
        object corresponding to the given model.
    """

    return user_domain.ActivitiesCompletedByLearner(
        activities_completed_model.id,
        activities_completed_model.completed_exploration_ids,
        activities_completed_model.completed_collection_ids)

def get_incomplete_explorations_from_model(incomplete_explorations_model):
    """Returns an incomplete explorations domain object given an incomplete
    explorations model loaded from the datastore.

    Args:
        incomplete_explorations_model: IncompleteExplorationsModel. The
            incomplete explorations model loaded from the datastore.

    Returns:
        IncompleteExplorations: IncompleteExplorations. A IncompleteExplorations
        domain object corresponding to the given model.
    """

    return user_domain.IncompleteExplorations(
        incomplete_explorations_model.id,
        incomplete_explorations_model.incomplete_exploration_ids)

def get_incomplete_collections_from_model(incomplete_collections_model):
    """Returns an incomplete collections domain object given an incomplete
    collections model loaded from the datastore.

    Args:
        incomplete_collections_model: IncompleteCollectionsModel. The
            incomplete collections model loaded from the datastore.

    Returns:
        IncompleteCollections: IncompleteCollections. A IncompleteCollections
        domain object corresponding to the given model.
    """

    return user_domain.IncompleteCollections(
        incomplete_collections_model.id,
        incomplete_collections_model.incomplete_collection_ids)

def save_activities_completed(activities_completed):
    """Save an activities completed domain object as an
    ActivitiesCompletedByLearnerModel entity in the datastore.

    Args:
        activities_completed: ActivitiesCompletedByLearner. The activities
            completed object to be saved in the datastore.
    """
    activities_completed_model = user_models.ActivitiesCompletedByLearnerModel(
        id=activities_completed.id,
        completed_exploration_ids=(
            activities_completed.completed_exploration_ids),
        completed_collection_ids=activities_completed.completed_collection_ids)

    activities_completed_model.put()

def save_incomplete_explorations(incomplete_explorations,
                                 last_playthrough_information=None):
    """Save an incomplete explorations domain object as an
    IncompleteExplorationsModel entity in the datastore.

    Args:
        incomplete_explorations: IncompleteExplorations. The incomplete
            explorations domain object to be saved in the datastore.
    """
    incomplete_explorations_model = user_models.IncompleteExplorationsModel(
        id=incomplete_explorations.id,
        incomplete_exploration_ids=(
            incomplete_explorations.incomplete_exploration_ids))

    if last_playthrough_information:
        last_playthrough_information_model = (
            user_models.ExpUserLastPlaythroughModel(
                id=last_playthrough_information.id,
                user_id=last_playthrough_information.user_id,
                exploration_id=last_playthrough_information.exploration_id,
                version_last_played=(
                    last_playthrough_information.version_last_played),
                time_last_played_msec=(
                    last_playthrough_information.time_last_played_msec),
                last_state_played=(
                    last_playthrough_information.last_state_played)))
        last_playthrough_information_model.put()

    incomplete_explorations_model.put()

def save_incomplete_collections(incomplete_collections):
    """Save an incomplete collections domain object as an
    IncompleteCollectionsModel entity in the datastore.

    Args:
        incomplete_collections: IncompleteCollections. The incomplete
            collections domain object to be saved in the datastore.
    """
    incomplete_collections_model = user_models.IncompleteCollectionsModel(
        id=incomplete_collections.id,
        incomplete_collection_ids=(
            incomplete_collections.incomplete_collection_ids))

    incomplete_collections_model.put()

def mark_exploration_as_completed(user_id, exp_id):
    """Adds the exploration id to the completed list of the user unless the
    exploration has already been completed or has been created by the user.
    It is also removed from the incomplete list (if present).

    Args:
        user_id: str. The id of the user who has completed the exploration.
        exp_id: str. The id of the completed exploration.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))
    if not activities_completed_model:
        activities_completed_model = (
            user_models.ActivitiesCompletedByLearnerModel(id=user_id))

    exploration_created_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    activities_completed = get_activities_completed_from_model(
        activities_completed_model)

    if (exp_id not in exploration_created_ids and
            exp_id not in activities_completed.completed_exploration_ids):
        # Remove the exploration from the in progress list (if present) as it is
        # now completed.
        remove_exp_from_incomplete_list(user_id, exp_id)
        activities_completed.add_exploration_id(exp_id)
        save_activities_completed(activities_completed)

def mark_collection_as_completed(user_id, collection_id):
    """Adds the collection id to the list of collections completed by the user
    unless the collection has already been completed or has been created by the
    user. It is also removed from the incomplete list (if present).

    Args:
        user_id: str. The id of the user who completed the collection.
        collection_id: str. The id of the completed collection.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))
    if not activities_completed_model:
        activities_completed_model = (
            user_models.ActivitiesCompletedByLearnerModel(id=user_id))

    collection_created_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    activities_completed = get_activities_completed_from_model(
        activities_completed_model)

    if (collection_id not in collection_created_ids and
            collection_id not in activities_completed.completed_collection_ids):
        # Remove the collection from the in progress list (if present) as it is
        # now completed.
        remove_collection_from_incomplete_list(user_id, collection_id)
        activities_completed.add_collection_id(collection_id)
        save_activities_completed(activities_completed)

def mark_exploration_as_incomplete(
        user_id, timestamp, exploration_id, state_name, exploration_version):
    """Adds the exploration id to the incomplete list of the user unless the
    exploration has been already completed or has been created by the user. If
    the exploration is already present in the incomplete list, just the details
    associated with it are updated.

    Args:
        user_id: str. The id of the user who partially completed the
            exploration.
        timestamp: datetime.datetime. The time at which the user left the
            exploraion.
        exploration_id: str. The id of the partially completed exploration.
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

    incomplete_explorations = get_incomplete_explorations_from_model(
        incomplete_explorations_model)

    if (exploration_id not in completed_exploration_ids and
            exploration_id not in exploration_created_ids):

        if exploration_id not in incomplete_explorations.incomplete_exploration_ids: # pylint: disable=line-too-long
            incomplete_explorations.add_exploration_id(exploration_id)

        last_playthrough_information = (
            incomplete_explorations.get_last_playthrough_information(
                exploration_id))

        last_playthrough_information.update_last_played_information(
            utils.get_time_in_millisecs(timestamp),
            exploration_version,
            state_name)

        save_incomplete_explorations(
            incomplete_explorations, last_playthrough_information)

def mark_collection_as_incomplete(user_id, collection_id):
    """Adds the collection id to the list of collections partially completed by
    the user unless the collection has already been completed or has been
    created by the user or is already present in the incomplete list.

    Args:
        user_id: str. The id of the user who partially completed the collection.
        collection_id: str. The id of the partially completed collection.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))
    if not incomplete_collections_model:
        incomplete_collections_model = (
            user_models.IncompleteCollectionsModel(id=user_id))

    completed_collection_ids = get_all_completed_collection_ids(user_id)

    collection_created_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    incomplete_collections = get_incomplete_collections_from_model(
        incomplete_collections_model)

    if (collection_id not in collection_created_ids and
            collection_id not in incomplete_collections.incomplete_collection_ids and # pylint: disable=line-too-long
            collection_id not in completed_collection_ids):
        incomplete_collections.add_collection_id(collection_id)
        save_incomplete_collections(incomplete_collections)

def remove_exp_from_incomplete_list(user_id, exploration_id):
    """Removes the exploration from the incomplete list of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be removed.
    """
    incomplete_explorations_model = (
        user_models.IncompleteExplorationsModel.get(user_id, strict=False))

    if incomplete_explorations_model:
        incomplete_explorations = get_incomplete_explorations_from_model(
            incomplete_explorations_model)
        if exploration_id in incomplete_explorations.incomplete_exploration_ids:
            incomplete_explorations.remove_exploration_id(exploration_id)
            incomplete_explorations.delete_last_playthrough_information(
                exploration_id)

            save_incomplete_explorations(incomplete_explorations)

def remove_collection_from_incomplete_list(user_id, collection_id):
    """Removes the collection id from the list of incomplete collections
    (if present).

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be removed.
    """
    incomplete_collections_model = (
        user_models.IncompleteCollectionsModel.get(user_id, strict=False))

    if incomplete_collections_model:
        incomplete_collections = get_incomplete_collections_from_model(
            incomplete_collections_model)
        if collection_id in incomplete_collections.incomplete_collection_ids:
            incomplete_collections.remove_collection_id(collection_id)
            save_incomplete_collections(incomplete_collections)

def get_all_completed_exp_ids(user_id):
    """Returns a list with the ids of all the explorations completed by the
    user.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(str). A list of the ids of the explorations completed by the
            learner.
    """
    activities_completed_model = (
        user_models.ActivitiesCompletedByLearnerModel.get(
            user_id, strict=False))

    if activities_completed_model:
        activities_completed = get_activities_completed_from_model(
            activities_completed_model)
        return activities_completed.completed_exploration_ids
    else:
        return []

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

    if activities_completed_model:
        activities_completed = get_activities_completed_from_model(
            activities_completed_model)
        return activities_completed.completed_collection_ids
    else:
        return []

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

    if incomplete_explorations_model:
        incomplete_explorations = get_incomplete_explorations_from_model(
            incomplete_explorations_model)
        return incomplete_explorations.incomplete_exploration_ids
    else:
        return []

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

    if incomplete_collections_model:
        incomplete_collections = get_incomplete_collections_from_model(
            incomplete_collections_model)
        return incomplete_collections.incomplete_collection_ids
    else:
        return []
