# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

from constants import constants
from core.domain import collection_services
from core.domain import exp_services
from core.domain import learner_playlist_services
from core.domain import learner_progress_domain
from core.domain import subscription_services
from core.domain import user_domain
from core.platform import models
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


def _get_completed_activities_from_model(completed_activities_model):
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


def _get_incomplete_activities_from_model(incomplete_activities_model):
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


def _get_last_playthrough_information(last_playthrough_model):
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


def _save_completed_activities(activities_completed):
    """Save an activities completed domain object as a
    CompletedActivitiesModel instance in the datastore.

    Args:
        activities_completed: CompletedActivities. The activities
            completed domain object to be saved in the datastore.
    """
    completed_activities_model = user_models.CompletedActivitiesModel(
        id=activities_completed.id,
        exploration_ids=(
            activities_completed.exploration_ids),
        collection_ids=activities_completed.collection_ids)

    completed_activities_model.put()


def _save_incomplete_activities(incomplete_activities):
    """Save an incomplete activities domain object as an
    IncompleteActivitiesModel instance in the datastore.

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


def _save_last_playthrough_information(last_playthrough_information):
    """Save an ExpUserLastPlaythrough domain object as an
    ExpUserLastPlaythroughModel instance in the datastore.

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
    user. It is also removed from the incomplete list and the learner playlist
    (if present).

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

    activities_completed = _get_completed_activities_from_model(
        completed_activities_model)

    if (exp_id not in subscribed_exploration_ids and
            exp_id not in activities_completed.exploration_ids):
        # Remove the exploration from the in progress and learner playlist
        # (if present) as it is now completed.
        remove_exp_from_incomplete_list(user_id, exp_id)
        learner_playlist_services.remove_exploration_from_learner_playlist(
            user_id, exp_id)
        activities_completed.add_exploration_id(exp_id)
        _save_completed_activities(activities_completed)


def mark_collection_as_completed(user_id, collection_id):
    """Adds the collection id to the list of collections completed by the user
    unless the collection has already been completed or has been created/edited
    by the user. It is also removed from the incomplete list and the play later
    list (if present).

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

    activities_completed = _get_completed_activities_from_model(
        completed_activities_model)

    if (collection_id not in subscribed_collection_ids and
            collection_id not in activities_completed.collection_ids):
        # Remove the collection from the in progress and learner playlist
        # (if present) as it is now completed.
        remove_collection_from_incomplete_list(user_id, collection_id)
        learner_playlist_services.remove_collection_from_learner_playlist(
            user_id, collection_id)
        activities_completed.add_collection_id(collection_id)
        _save_completed_activities(activities_completed)


def mark_exploration_as_incomplete(
        user_id, exploration_id, state_name, exploration_version):
    """Adds the exploration id to the incomplete list of the user unless the
    exploration has been already completed or has been created/edited by the
    user. If the exploration is already present in the incomplete list, just the
    details associated with it are updated. If the exploration is present in the
    learner playlist, it is removed.

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

    incomplete_activities = _get_incomplete_activities_from_model(
        incomplete_activities_model)

    if (exploration_id not in exploration_ids and
            exploration_id not in subscribed_exploration_ids):

        if exploration_id not in incomplete_activities.exploration_ids:
            # Remove the exploration from the learner playlist (if present) as
            # it is currently now being completed.
            learner_playlist_services.remove_exploration_from_learner_playlist(
                user_id, exploration_id)
            incomplete_activities.add_exploration_id(exploration_id)

        last_playthrough_information_model = (
            user_models.ExpUserLastPlaythroughModel.get(
                user_id, exploration_id))
        if not last_playthrough_information_model:
            last_playthrough_information_model = (
                user_models.ExpUserLastPlaythroughModel.create(
                    user_id, exploration_id))

        last_playthrough_information = _get_last_playthrough_information(
            last_playthrough_information_model)
        last_playthrough_information.update_last_played_information(
            exploration_version, state_name)

        _save_last_playthrough_information(last_playthrough_information)
        _save_incomplete_activities(incomplete_activities)


def mark_collection_as_incomplete(user_id, collection_id):
    """Adds the collection id to the list of collections partially completed by
    the user unless the collection has already been completed or has been
    created/edited by the user or is already present in the incomplete list.
    If the collection is present in the learner playlist, it is removed.

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

    incomplete_activities = _get_incomplete_activities_from_model(
        incomplete_activities_model)

    if (collection_id not in subscribed_collection_ids and
            collection_id not in incomplete_activities.collection_ids and
            collection_id not in collection_ids):
        # Remove the collection from the learner playlist (if present) as it
        # is currently now being completed.
        learner_playlist_services.remove_collection_from_learner_playlist(
            user_id, collection_id)
        incomplete_activities.add_collection_id(collection_id)
        _save_incomplete_activities(incomplete_activities)


def add_collection_to_learner_playlist(
        user_id, collection_id, position_to_be_inserted=None):
    """This function checks if the collection exists in the completed list or
    the incomplete list. If it does not exist we call the function in learner
    playlist services to add the collection to the play later list.

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be added to the
            learner playlist.
        position_to_be_inserted: int|None. If this is specified the collection
            gets inserted at the given position. Otherwise it gets added at the
            end.

    Returns:
        (bool, bool, bool). The first boolean indicates whether the collection
            already exists in either of the "completed collections" or
            "incomplete collections" lists, the second boolean indicates
            whether the playlist limit of the user has been
            exceeded, and the third boolean indicates whether the collection
            belongs to the created or edited collections of the user.
    """
    completed_collection_ids = get_all_completed_collection_ids(user_id)
    incomplete_collection_ids = get_all_incomplete_collection_ids(user_id)
    playlist_limit_exceeded = False
    belongs_to_subscribed_activities = False
    belongs_to_completed_or_incomplete_list = False

    if (collection_id not in completed_collection_ids and
            collection_id not in incomplete_collection_ids):

        (playlist_limit_exceeded, belongs_to_subscribed_activities) = (
            learner_playlist_services.mark_collection_to_be_played_later(
                user_id, collection_id,
                position_to_be_inserted=position_to_be_inserted))

        belongs_to_completed_or_incomplete_list = False
    else:
        belongs_to_completed_or_incomplete_list = True

    return (
        belongs_to_completed_or_incomplete_list,
        playlist_limit_exceeded,
        belongs_to_subscribed_activities)


def add_exp_to_learner_playlist(
        user_id, exploration_id, position_to_be_inserted=None):
    """This function checks if the exploration exists in the completed list or
    the incomplete list. If it does not exist we call the function in learner
    playlist services to add the exploration to the play later list.

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be added to the
            learner playlist.
        position_to_be_inserted: int|None. If this is specified the exploration
            gets inserted at the given position. Otherwise it gets added at the
            end.

    Returns:
        (bool, bool, bool). The first boolean indicates whether the exploration
            already exists in either of the "completed explorations" or
            "incomplete explorations" lists, the second boolean indicates
            whether the playlist limit of the user has been
            exceeded, and the third boolean indicates whether the exploration
            belongs to the created or edited explorations of the user.
    """
    completed_exploration_ids = get_all_completed_exp_ids(user_id)
    incomplete_exploration_ids = get_all_incomplete_exp_ids(user_id)
    playlist_limit_exceeded = False
    belongs_to_subscribed_activities = False
    belongs_to_completed_or_incomplete_list = False

    if (exploration_id not in completed_exploration_ids and
            exploration_id not in incomplete_exploration_ids):

        (playlist_limit_exceeded, belongs_to_subscribed_activities) = (
            learner_playlist_services.mark_exploration_to_be_played_later(
                user_id, exploration_id,
                position_to_be_inserted=position_to_be_inserted))

        belongs_to_completed_or_incomplete_list = False

    else:
        belongs_to_completed_or_incomplete_list = True

    return (
        belongs_to_completed_or_incomplete_list,
        playlist_limit_exceeded,
        belongs_to_subscribed_activities)


def _remove_activity_ids_from_playlist(
        user_id, exploration_ids, collection_ids):
    """Removes the explorations and collections from the playlist of the user.

    Args:
        user_id: str. The id of the user.
        exploration_ids: list(str). The ids of the explorations to be removed.
        collection_ids: list(str). The ids of the collections to be removed.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)

    if learner_playlist_model:
        learner_playlist = (
            learner_playlist_services.get_learner_playlist_from_model(
                learner_playlist_model))

        for exploration_id in exploration_ids:
            learner_playlist.remove_exploration_id(exploration_id)

        for collection_id in collection_ids:
            learner_playlist.remove_collection_id(collection_id)

        learner_playlist_services.save_learner_playlist(learner_playlist)


def remove_exp_from_completed_list(user_id, exploration_id):
    """Removes the exploration from the completed list of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be removed.
    """
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))

    if completed_activities_model:
        activities_completed = _get_completed_activities_from_model(
            completed_activities_model)
        if exploration_id in activities_completed.exploration_ids:
            activities_completed.remove_exploration_id(exploration_id)
            _save_completed_activities(activities_completed)


def remove_collection_from_completed_list(user_id, collection_id):
    """Removes the collection id from the list of completed collections
    (if present).

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be removed.
    """
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))

    if completed_activities_model:
        activities_completed = _get_completed_activities_from_model(
            completed_activities_model)
        if collection_id in activities_completed.collection_ids:
            activities_completed.remove_collection_id(collection_id)
            _save_completed_activities(activities_completed)


def _remove_activity_ids_from_completed_list(
        user_id, exploration_ids, collection_ids):
    """Removes the explorations and collections from the completed list of the
    learner.

    Args:
        user_id: str. The id of the user.
        exploration_ids: list(str). The ids of the explorations to be removed.
        collection_ids: list(str). The ids of the collections to be removed.
    """
    completed_activities_model = (
        user_models.CompletedActivitiesModel.get(
            user_id, strict=False))

    if completed_activities_model:
        activities_completed = _get_completed_activities_from_model(
            completed_activities_model)

        for exploration_id in exploration_ids:
            activities_completed.remove_exploration_id(exploration_id)

        for collection_id in collection_ids:
            activities_completed.remove_collection_id(collection_id)

        _save_completed_activities(activities_completed)


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
        incomplete_activities = _get_incomplete_activities_from_model(
            incomplete_activities_model)
        if exploration_id in incomplete_activities.exploration_ids:
            incomplete_activities.remove_exploration_id(exploration_id)
            last_playthrough_information_model = (
                user_models.ExpUserLastPlaythroughModel.get(
                    user_id, exploration_id))
            last_playthrough_information_model.delete()

            _save_incomplete_activities(incomplete_activities)


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
        incomplete_activities = _get_incomplete_activities_from_model(
            incomplete_activities_model)
        if collection_id in incomplete_activities.collection_ids:
            incomplete_activities.remove_collection_id(collection_id)
            _save_incomplete_activities(incomplete_activities)


def _remove_activity_ids_from_incomplete_list(user_id, exploration_ids=None,
                                              collection_ids=None):
    """Removes the collections and explorations from the incomplete list of the
    user.

    Args:
        user_id: str. The id of the user.
        exploration_ids: list(str). The ids of the explorations to be removed.
        collection_ids: list(str). The ids of the collections to be removed.
    """
    incomplete_activities_model = (
        user_models.IncompleteActivitiesModel.get(
            user_id, strict=False))

    if incomplete_activities_model:
        incomplete_activities = _get_incomplete_activities_from_model(
            incomplete_activities_model)

        for exploration_id in exploration_ids:
            incomplete_activities.remove_exploration_id(exploration_id)

        for collection_id in collection_ids:
            incomplete_activities.remove_collection_id(collection_id)

        _save_incomplete_activities(incomplete_activities)


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
        activities_completed = _get_completed_activities_from_model(
            completed_activities_model)

        return activities_completed.exploration_ids
    else:
        return []


def _get_filtered_completed_exp_summaries(
        exploration_summaries, exploration_ids):
    """Returns a list of summaries of the completed exploration ids and the
    ids of explorations that are no longer present.

    Args:
        exploration_summaries: list(ExplorationSummary). The list of exploration
            summary domain objects to be filtered.
        exploration_ids: list(str). The ids of the explorations corresponding to
            the exploration summary domain objects.

    Returns:
        tuple. A 2-tuple whose elements are as follows:
        - list(ExplorationSummary). Filtered list of ExplorationSummary domain
                objects of the completed explorations.
        - list(str). The ids of the explorations that are no longer present.
    """
    nonexistent_completed_exp_ids = []
    filtered_completed_exp_summaries = []
    for index, exploration_summary in enumerate(exploration_summaries):
        if exploration_summary is None:
            nonexistent_completed_exp_ids.append(exploration_ids[index])
        elif exploration_summary.status != constants.ACTIVITY_STATUS_PUBLIC:
            nonexistent_completed_exp_ids.append(exploration_ids[index])
        else:
            filtered_completed_exp_summaries.append(exploration_summary)

    return filtered_completed_exp_summaries, nonexistent_completed_exp_ids


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
        activities_completed = _get_completed_activities_from_model(
            completed_activities_model)

        return activities_completed.collection_ids
    else:
        return []


def _get_filtered_completed_collection_summaries(
        user_id, collection_summaries, collection_ids):
    """Returns a list of summaries of the completed collection ids, the ids
    of collections that are no longer present and the summaries of the
    collections being shifted to the incomplete section on account of new
    addition of explorations.

    Args:
        user_id: str. The id of the learner.
        collection_summaries: list(CollectionSummary). The list of collection
            summary domain objects to be filtered.
        collection_ids: list(str). The ids of the collection corresponding to
            the collection summary domain objects.

    Returns:
        tuple. A 3-tuple whose elements are as follows:
        - list(CollectionSummary). A filtered list with the summary domain
            objects of the completed collections.
        - list(str). The ids of the collections that are no longer present.
        - list(CollectionSummary). The summaries corresponding to those
            collections which have been moved to the in progress section on
            account of new explorations being added to them.
    """
    nonexistent_completed_collection_ids = []
    completed_to_incomplete_collections = []
    filtered_completed_collection_summaries = []

    completed_collections = collection_services.get_multiple_collections_by_id(
        collection_ids, strict=False)

    exploration_ids_completed_in_collections = (
        collection_services.get_explorations_completed_in_collections(
            user_id, collection_ids))

    for index, collection_summary in enumerate(collection_summaries):
        if collection_summary is None:
            nonexistent_completed_collection_ids.append(collection_ids[index])
        elif collection_summary.status != constants.ACTIVITY_STATUS_PUBLIC:
            nonexistent_completed_collection_ids.append(collection_ids[index])
        else:
            completed_exploration_ids = (
                exploration_ids_completed_in_collections[index])
            collection_model = completed_collections[collection_ids[index]]
            if collection_model.get_next_exploration_id(
                    completed_exploration_ids):
                collection_id = collection_summary.id
                remove_collection_from_completed_list(user_id, collection_id)
                mark_collection_as_incomplete(user_id, collection_id)
                completed_to_incomplete_collections.append(collection_summary)
            else:
                filtered_completed_collection_summaries.append(
                    collection_summary)

    return (
        filtered_completed_collection_summaries,
        nonexistent_completed_collection_ids,
        completed_to_incomplete_collections)


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
        incomplete_activities = _get_incomplete_activities_from_model(
            incomplete_activities_model)

        return incomplete_activities.exploration_ids
    else:
        return []


def _get_filtered_incomplete_exp_summaries(
        exploration_summaries, exploration_ids):
    """Returns a list of summaries of the incomplete exploration ids and the ids
    of explorations that are no longer present.

    Args:
        exploration_summaries: list(ExplorationSummary). The list of exploration
            summary domain objects to be filtered.
        exploration_ids: list(str). The ids of the explorations corresponding to
            the exploration summary domain objects.

    Returns:
        tuple. A 2-tuple whose elements are as follows:
        - list(ExplorationSummary). Filtered list of ExplorationSummary domain
            objects of the incomplete explorations.
        - list(str). The ids of the explorations that are no longer present.
    """
    nonexistent_incomplete_exp_ids = []
    filtered_incomplete_exp_summaries = []
    for index, exploration_summary in enumerate(exploration_summaries):
        if exploration_summary is None:
            nonexistent_incomplete_exp_ids.append(exploration_ids[index])
        elif exploration_summary.status != constants.ACTIVITY_STATUS_PUBLIC:
            nonexistent_incomplete_exp_ids.append(exploration_ids[index])
        else:
            filtered_incomplete_exp_summaries.append(exploration_summary)

    return filtered_incomplete_exp_summaries, nonexistent_incomplete_exp_ids


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
        incomplete_activities = _get_incomplete_activities_from_model(
            incomplete_activities_model)

        return incomplete_activities.collection_ids
    else:
        return []


def _get_filtered_incomplete_collection_summaries(
        collection_summaries, collection_ids):
    """Returns a list of summaries of the incomplete collection ids and the ids
    of collections that are no longer present.

    Args:
        collection_summaries: list(CollectionSummary). The list of collection
            summary domain objects to be filtered.
        collection_ids: list(str). The ids of the collection corresponding to
            the collection summary domain objects.

    Returns:
        tuple. A 2-tuple whose elements are as follows:
        - list(CollectionSummary). A filtered list with the summary domain
            objects of the incomplete collections.
        - list(str). The ids of the collections that are no longer present.
    """
    nonexistent_incomplete_collection_ids = []
    filtered_incomplete_collection_summaries = []
    for index, collection_summary in enumerate(collection_summaries):
        if collection_summary is None:
            nonexistent_incomplete_collection_ids.append(collection_ids[index])
        elif collection_summary.status != constants.ACTIVITY_STATUS_PUBLIC:
            nonexistent_incomplete_collection_ids.append(collection_ids[index])
        else:
            filtered_incomplete_collection_summaries.append(collection_summary)

    return (
        filtered_incomplete_collection_summaries,
        nonexistent_incomplete_collection_ids)


def _get_filtered_exp_playlist_summaries(
        exploration_summaries, exploration_ids):
    """Returns a list of summaries of the explorations in the learner playlist
    and the ids of explorations that are no longer present.

    Args:
        exploration_summaries: list(ExplorationSummary). The list of exploration
            summary domain objects to be filtered.
        exploration_ids: list(str). The ids of the explorations corresponding to
            the exploration summary domain objects.

    Returns:
        tuple. A 2-tuple whose elements are as follows:
        - list(ExplorationSummary). Filtered list of ExplorationSummary domain
            objects of the explorations in the learner playlist.
        - list(str). The ids of the explorations that are no longer present.
    """
    nonexistent_playlist_exp_ids = []
    filtered_exp_playlist_summaries = []
    for index, exploration_summary in enumerate(exploration_summaries):
        if exploration_summary is None:
            nonexistent_playlist_exp_ids.append(exploration_ids[index])
        elif exploration_summary.status != constants.ACTIVITY_STATUS_PUBLIC:
            nonexistent_playlist_exp_ids.append(exploration_ids[index])
        else:
            filtered_exp_playlist_summaries.append(exploration_summary)

    return filtered_exp_playlist_summaries, nonexistent_playlist_exp_ids


def _get_filtered_collection_playlist_summaries(
        collection_summaries, collection_ids):
    """Returns a list of summaries of the collections in the learner playlist
    and the ids of collections that are no longer present.

    Args:
        collection_summaries: list(CollectionSummary). The list of collection
            summary domain objects to be filtered.
        collection_ids: list(str). The ids of the collections corresponding to
            the collection summary domain objects.

    Returns:
        tuple. A 2-tuple whose elements are as follows:
        - list(CollectionSummary). Filtered list of CollectionSummary domain
            objects of the collections in the learner playlist.
        - list(str). The ids of the collections that are no longer present.
    """
    nonexistent_playlist_collection_ids = []
    filtered_collection_playlist_summaries = []
    for index, collection_summary in enumerate(collection_summaries):
        if collection_summary is None:
            nonexistent_playlist_collection_ids.append(collection_ids[index])
        elif collection_summary.status != constants.ACTIVITY_STATUS_PUBLIC:
            nonexistent_playlist_collection_ids.append(collection_ids[index])
        else:
            filtered_collection_playlist_summaries.append(collection_summary)

    return (
        filtered_collection_playlist_summaries,
        nonexistent_playlist_collection_ids)


def get_collection_summary_dicts(collection_summaries):
    """Returns a displayable summary dict of the the collection summaries
    given to it.

    Args:
        collection_summaries: list(CollectionSummary). A list of the
            summary domain objects.

    Returns:
        list(dict). The summary dict objects corresponding to the given summary
            domain objects.
    """
    summary_dicts = []
    for collection_summary in collection_summaries:
        summary_dicts.append({
            'id': collection_summary.id,
            'title': collection_summary.title,
            'category': collection_summary.category,
            'objective': collection_summary.objective,
            'language_code': collection_summary.language_code,
            'last_updated_msec': utils.get_time_in_millisecs(
                collection_summary.collection_model_last_updated),
            'created_on': utils.get_time_in_millisecs(
                collection_summary.collection_model_created_on),
            'status': collection_summary.status,
            'node_count': collection_summary.node_count,
            'community_owned': collection_summary.community_owned,
            'thumbnail_icon_url': (
                utils.get_thumbnail_icon_url_for_category(
                    collection_summary.category)),
            'thumbnail_bg_color': utils.get_hex_color_for_category(
                collection_summary.category),
        })

    return summary_dicts


def get_learner_dashboard_activities(user_id):
    """Returns the ids of each of the activities that are present in the various
    sections of the learner dashboard, namely the completed section, the
    incomplete section and the playlist section.

    Args:
        user_id: str. The id of the learner.

    Returns:
        ActivityIdsInLearnerDashboard. The domain object containing the ids of
            all activities in the learner dashboard.
    """
    learner_progress_models = (
        datastore_services.fetch_multiple_entities_by_ids_and_models(
            [
                ('CompletedActivitiesModel', [user_id]),
                ('IncompleteActivitiesModel', [user_id]),
                ('LearnerPlaylistModel', [user_id])
            ]))

    # If completed model is present.
    if learner_progress_models[0][0]:
        activities_completed = _get_completed_activities_from_model(
            learner_progress_models[0][0])
        completed_exploration_ids = activities_completed.exploration_ids
        completed_collection_ids = activities_completed.collection_ids
    else:
        completed_collection_ids = []
        completed_exploration_ids = []

    # If incomplete model is present.
    if learner_progress_models[1][0]:
        incomplete_activities = _get_incomplete_activities_from_model(
            learner_progress_models[1][0])
        incomplete_exploration_ids = incomplete_activities.exploration_ids
        incomplete_collection_ids = incomplete_activities.collection_ids
    else:
        incomplete_exploration_ids = []
        incomplete_collection_ids = []

    # If learner playlist model is present.
    if learner_progress_models[2][0]:
        learner_playlist = (
            learner_playlist_services.get_learner_playlist_from_model(
                learner_progress_models[2][0]))
        exploration_playlist_ids = learner_playlist.exploration_ids
        collection_playlist_ids = learner_playlist.collection_ids
    else:
        exploration_playlist_ids = []
        collection_playlist_ids = []

    activity_ids = learner_progress_domain.ActivityIdsInLearnerDashboard(
        completed_exploration_ids, completed_collection_ids,
        incomplete_exploration_ids, incomplete_collection_ids,
        exploration_playlist_ids, collection_playlist_ids)

    return activity_ids


def get_activity_progress(user_id):
    """Returns the progress of the learners - the explorations and collections
    completed by the user and those in progress.

    Args:
        user_id: str. The id of the learner.

    Returns:
        (LearnerProgress, dict, list(str)). The first return value is the
            learner progress domain object corresponding to the particular
            learner. The second return value is the numbers of the activities
            that are no longer present. It contains four keys:
            - incomplete_explorations: int. The number of incomplete
                explorations no longer present.
            - incomplete_collections: int. The number of incomplete collections
                no longer present.
            - completed_explorations: int. The number of completed explorations
                no longer present.
            - completed_collections: int. The number of completed collections no
                longer present.
            The third return value is the titles of the collections to which new
            explorations have been added.
    """
    activity_ids_in_learner_dashboard = (
        get_learner_dashboard_activities(user_id))
    completed_exploration_ids = (
        activity_ids_in_learner_dashboard.completed_exploration_ids)
    completed_collection_ids = (
        activity_ids_in_learner_dashboard.completed_collection_ids)
    incomplete_exploration_ids = (
        activity_ids_in_learner_dashboard.incomplete_exploration_ids)
    incomplete_collection_ids = (
        activity_ids_in_learner_dashboard.incomplete_collection_ids)
    exploration_playlist_ids = (
        activity_ids_in_learner_dashboard.exploration_playlist_ids)
    collection_playlist_ids = (
        activity_ids_in_learner_dashboard.collection_playlist_ids)

    activity_models = (
        datastore_services.fetch_multiple_entities_by_ids_and_models(
            [
                ('ExpSummaryModel', incomplete_exploration_ids),
                ('CollectionSummaryModel', incomplete_collection_ids),
                ('ExpSummaryModel', completed_exploration_ids),
                ('CollectionSummaryModel', completed_collection_ids),
                ('ExpSummaryModel', exploration_playlist_ids),
                ('CollectionSummaryModel', collection_playlist_ids)
            ]))

    incomplete_exploration_models = activity_models[0]
    incomplete_collection_models = activity_models[1]
    completed_exploration_models = activity_models[2]
    completed_collection_models = activity_models[3]
    exploration_playlist_models = activity_models[4]
    collection_playlist_models = activity_models[5]

    incomplete_exp_summaries = (
        [exp_services.get_exploration_summary_from_model(model)
         if model else None for model in incomplete_exploration_models])
    incomplete_collection_summaries = (
        [collection_services.get_collection_summary_from_model(model)
         if model else None for model in incomplete_collection_models])
    completed_exp_summaries = (
        [exp_services.get_exploration_summary_from_model(model)
         if model else None for model in completed_exploration_models])
    completed_collection_summaries = (
        [collection_services.get_collection_summary_from_model(model)
         if model else None for model in completed_collection_models])
    exploration_playlist_summaries = (
        [exp_services.get_exploration_summary_from_model(model)
         if model else None for model in exploration_playlist_models])
    collection_playlist_summaries = (
        [collection_services.get_collection_summary_from_model(model)
         if model else None for model in collection_playlist_models])

    filtered_incomplete_exp_summaries, nonexistent_incomplete_exp_ids = (
        _get_filtered_incomplete_exp_summaries(
            incomplete_exp_summaries, incomplete_exploration_ids))

    filtered_completed_exp_summaries, nonexistent_completed_exp_ids = (
        _get_filtered_completed_exp_summaries(
            completed_exp_summaries, completed_exploration_ids))

    (
        filtered_completed_collection_summaries,
        nonexistent_completed_collection_ids,
        completed_to_incomplete_collection_summaries) = (
            _get_filtered_completed_collection_summaries(
                user_id, completed_collection_summaries,
                completed_collection_ids))

    completed_to_incomplete_collection_titles = []
    for collection_summary in completed_to_incomplete_collection_summaries:
        incomplete_collection_summaries.append(collection_summary)
        completed_to_incomplete_collection_titles.append(
            collection_summary.title)
        incomplete_collection_ids.append(collection_summary.id)

    (
        filtered_incomplete_collection_summaries,
        nonexistent_incomplete_collection_ids) = (
            _get_filtered_incomplete_collection_summaries(
                incomplete_collection_summaries, incomplete_collection_ids))

    filtered_exp_playlist_summaries, nonexistent_playlist_exp_ids = (
        _get_filtered_exp_playlist_summaries(
            exploration_playlist_summaries, exploration_playlist_ids))

    (
        filtered_collection_playlist_summaries,
        nonexistent_playlist_collection_ids) = (
            _get_filtered_collection_playlist_summaries(
                collection_playlist_summaries, collection_playlist_ids))

    number_of_nonexistent_activities = {
        'incomplete_explorations': len(nonexistent_incomplete_exp_ids),
        'incomplete_collections': len(nonexistent_incomplete_collection_ids),
        'completed_explorations': len(nonexistent_completed_exp_ids),
        'completed_collections': len(nonexistent_completed_collection_ids),
        'exploration_playlist': len(nonexistent_playlist_exp_ids),
        'collection_playlist': len(nonexistent_playlist_collection_ids)
    }

    _remove_activity_ids_from_incomplete_list(
        user_id,
        exploration_ids=nonexistent_incomplete_exp_ids,
        collection_ids=nonexistent_incomplete_collection_ids)
    _remove_activity_ids_from_completed_list(
        user_id, nonexistent_completed_exp_ids,
        nonexistent_completed_collection_ids)
    _remove_activity_ids_from_playlist(
        user_id, nonexistent_playlist_exp_ids,
        nonexistent_playlist_collection_ids)

    learner_progress = learner_progress_domain.LearnerProgress(
        filtered_incomplete_exp_summaries,
        filtered_incomplete_collection_summaries,
        filtered_completed_exp_summaries,
        filtered_completed_collection_summaries,
        filtered_exp_playlist_summaries,
        filtered_collection_playlist_summaries)

    return (
        learner_progress, number_of_nonexistent_activities,
        completed_to_incomplete_collection_titles)
