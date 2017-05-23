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

(user_models,) = models.Registry.import_models([models.NAMES.user])


def get_completed_activities_from_model(completed_activities_model):
    """Returns an activities completed domain object given a
    activities completed model loaded from the datastore.

    Args:
        completed_activities_model: CompletedActivitiesModel. The
            activities completed model loaded from the datastore.

    Returns:
        CompletedActivities. The domain object corresponding to the
        given model.
    """
    return user_domain.CompletedActivities(
        completed_activities_model.id,
        completed_activities_model.exploration_ids,
        completed_activities_model.collection_ids)


def get_incomplete_activities_from_model(incomplete_activities_model):
    """Returns an incomplete activities domain object given an incomplete
    activities model loaded from the datastore.

    Args:
        incomplete_activities_model: IncompleteActivitiesModel. The
            incomplete activities model loaded from the datastore.

    Returns:
        IncompleteActivities. An IncompleteActivities domain object
        corresponding to the given model.
    """
    return user_domain.IncompleteActivities(
        incomplete_activities_model.id,
        incomplete_activities_model.exploration_ids,
        incomplete_activities_model.collection_ids)


def get_last_playthrough_information(last_playthrough_model):
    """Returns an ExpUserLastPlaythrough domain object given an
    ExpUserLastPlaythroughModel loaded from the datastore.

    Args:
        last_playthrough_model: ExpUserLastPlaythroughModel. The last
            last playthrough information loaded from the datastore.

    Returns:
        ExpUserLastPlaythrough. The last playthrough information domain object
        corresponding to the given model.
    """
    return user_domain.ExpUserLastPlaythrough(
        last_playthrough_model.user_id,
        last_playthrough_model.exploration_id,
        last_playthrough_model.last_played_exp_version,
        last_playthrough_model.last_updated,
        last_playthrough_model.last_played_state_name)


def save_completed_activities(activities_completed):
    """Save an activities completed domain object as an
    CompletedActivitiesModel entity in the datastore.

    Args:
        activities_completed: CompletedActivities. The activities
            completed object to be saved in the datastore.
    """
    completed_activities_model = user_models.CompletedActivitiesModel(
        id=activities_completed.id,
        exploration_ids=(
            activities_completed.exploration_ids),
        collection_ids=activities_completed.collection_ids)

    completed_activities_model.put()


def save_incomplete_activities(incomplete_activities):
    """Save an incomplete activities domain object as an
    IncompleteActivitiesModel entity in the datastore.

    Args:
        incomplete_activities: IncompleteActivities. The incomplete
            activities domain object to be saved in the datastore.
    """
    incomplete_activities_model = user_models.IncompleteActivitiesModel(
        id=incomplete_activities.id,
        exploration_ids=(
            incomplete_activities.exploration_ids),
        collection_ids=(
            incomplete_activities.collection_ids))

    incomplete_activities_model.put()


def save_last_playthrough_information(last_playthrough_information):
    """Save an ExpUserLastPlaythrough domain object as an
    ExpUserLastPlaythroughModel entity in the datastore.

    Args:
        last_playthrough_information: ExpUserLastPlaythrough. The last
            playthrough information domain object to be saved in the datastore.
    """
    last_playthrough_information_model = (
        user_models.ExpUserLastPlaythroughModel(
            id=last_playthrough_information.id,
            user_id=last_playthrough_information.user_id,
            exploration_id=last_playthrough_information.exploration_id,
            last_played_exp_version=(
                last_playthrough_information.last_played_exp_version),
            last_played_state_name=(
                last_playthrough_information.last_played_state_name)))
    last_playthrough_information_model.put()


def mark_exploration_as_completed(user_id, exp_id):
    """Adds the exploration id to the completed list of the user unless the
    exploration has already been completed or has been created/edited by the
    user. It is also removed from the incomplete list (if present).

    Args:
        user_id: str. The id of the user who has completed the exploration.
        exp_id: str. The id of the completed exploration.
    """
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))
    if not completed_activities_model:
        completed_activities_model = (
            user_models.CompletedActivitiesModel(id=user_id))

    # We don't want anything that appears in the user's creator dashboard to
    # appear in the learner dashboard. Since the subscribed explorations
    # (edited/created) appear in the creator dashboard they will not appear in
    # the learner dashboard.
    subscribed_exploration_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    activities_completed = get_completed_activities_from_model(
        completed_activities_model)

    if (exp_id not in subscribed_exploration_ids and
            exp_id not in activities_completed.exploration_ids):
        # Remove the exploration from the in progress list (if present) as it is
        # now completed.
        remove_exp_from_incomplete_list(user_id, exp_id)
        activities_completed.add_exploration_id(exp_id)
        save_completed_activities(activities_completed)


def mark_collection_as_completed(user_id, collection_id):
    """Adds the collection id to the list of collections completed by the user
    unless the collection has already been completed or has been created/edited
    by the user. It is also removed from the incomplete list (if present).

    Args:
        user_id: str. The id of the user who completed the collection.
        collection_id: str. The id of the completed collection.
    """
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))
    if not completed_activities_model:
        completed_activities_model = (
            user_models.CompletedActivitiesModel(id=user_id))

    # We don't want anything that appears in the user's creator dashboard to
    # appear in the learner dashboard. Since the subscribed collections
    # (edited/created) appear in the creator dashboard they will not appear in
    # the learner dashboard.
    subscribed_collection_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    activities_completed = get_completed_activities_from_model(
        completed_activities_model)

    if (collection_id not in subscribed_collection_ids and
            collection_id not in activities_completed.collection_ids):
        # Remove the collection from the in progress list (if present) as it is
        # now completed.
        remove_collection_from_incomplete_list(user_id, collection_id)
        activities_completed.add_collection_id(collection_id)
        save_completed_activities(activities_completed)


def mark_exploration_as_incomplete(
        user_id, exploration_id, state_name, exploration_version):
    """Adds the exploration id to the incomplete list of the user unless the
    exploration has been already completed or has been created/edited by the
    user. If the exploration is already present in the incomplete list, just the
    details associated with it are updated.

    Args:
        user_id: str. The id of the user who partially completed the
            exploration.
        exploration_id: str. The id of the partially completed exploration.
        state_name: str. The name of the state at which the user left the
            exploration.
        exploration_version: str. The version of the exploration played by the
            learner.
    """
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(
            user_id, strict=False))
    if not incomplete_activities_model:
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel(id=user_id))

    exploration_ids = get_all_completed_exp_ids(user_id)

    subscribed_exploration_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    incomplete_activities = get_incomplete_activities_from_model(
        incomplete_activities_model)

    if (exploration_id not in exploration_ids and
            exploration_id not in subscribed_exploration_ids):

        if exploration_id not in incomplete_activities.exploration_ids:
            incomplete_activities.add_exploration_id(exploration_id)

        last_playthrough_information_model = (
            user_models.ExpUserLastPlaythroughModel.get(
                user_id, exploration_id))
        if not last_playthrough_information_model:
            last_playthrough_information_model = (
                user_models.ExpUserLastPlaythroughModel.create(
                    user_id, exploration_id))

        last_playthrough_information = get_last_playthrough_information(
            last_playthrough_information_model)
        last_playthrough_information.update_last_played_information(
            exploration_version, state_name)

        save_last_playthrough_information(last_playthrough_information)
        save_incomplete_activities(incomplete_activities)


def mark_collection_as_incomplete(user_id, collection_id):
    """Adds the collection id to the list of collections partially completed by
    the user unless the collection has already been completed or has been
    created/edited by the user or is already present in the incomplete list.

    Args:
        user_id: str. The id of the user who partially completed the collection.
        collection_id: str. The id of the partially completed collection.
    """
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(user_id, strict=False))
    if not incomplete_activities_model:
        incomplete_activities_model = (
            user_models.IncompleteActivitiesModel(id=user_id))

    collection_ids = get_all_completed_collection_ids(user_id)

    subscribed_collection_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    incomplete_activities = get_incomplete_activities_from_model(
        incomplete_activities_model)

    if (collection_id not in subscribed_collection_ids and
            collection_id not in incomplete_activities.collection_ids and
            collection_id not in collection_ids):
        incomplete_activities.add_collection_id(collection_id)
        save_incomplete_activities(incomplete_activities)


def remove_exp_from_incomplete_list(user_id, exploration_id):
    """Removes the exploration from the incomplete list of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be removed.
    """
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(user_id, strict=False))

    if incomplete_activities_model:
        incomplete_activities = get_incomplete_activities_from_model(
            incomplete_activities_model)
        if exploration_id in incomplete_activities.exploration_ids:
            incomplete_activities.remove_exploration_id(exploration_id)
            last_playthrough_information_model = (
                user_models.ExpUserLastPlaythroughModel.get(
                    user_id, exploration_id))
            last_playthrough_information_model.delete()

            save_incomplete_activities(incomplete_activities)


def remove_collection_from_incomplete_list(user_id, collection_id):
    """Removes the collection id from the list of incomplete collections
    (if present).

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be removed.
    """
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(user_id, strict=False))

    if incomplete_activities_model:
        incomplete_activities = get_incomplete_activities_from_model(
            incomplete_activities_model)
        if collection_id in incomplete_activities.collection_ids:
            incomplete_activities.remove_collection_id(collection_id)
            save_incomplete_activities(incomplete_activities)


def get_all_completed_exp_ids(user_id):
    """Returns a list with the ids of all the explorations completed by the
    user.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(str). A list of the ids of the explorations completed by the
            learner.
    """
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))

    if completed_activities_model:
        activities_completed = get_completed_activities_from_model(
            completed_activities_model)
        return activities_completed.exploration_ids
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
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))

    if completed_activities_model:
        activities_completed = get_completed_activities_from_model(
            completed_activities_model)
        return activities_completed.collection_ids
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
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(
            user_id, strict=False))

    if incomplete_activities_model:
        incomplete_activities = get_incomplete_activities_from_model(
            incomplete_activities_model)
        return incomplete_activities.exploration_ids
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
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(user_id, strict=False))

    if incomplete_activities_model:
        incomplete_activities = get_incomplete_activities_from_model(
            incomplete_activities_model)
        return incomplete_activities.collection_ids
    else:
        return []
