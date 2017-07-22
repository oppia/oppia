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

"""Services for the play later feature of the learner dashboard."""

from core.domain import subscription_services
from core.domain import user_domain
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])

def get_play_later_activities_from_model(play_later_activities_model):
    """Returns the play later activities domain object given the play later
    model loaded from the datastore.

    Args:
        play_later_activities_model: PlayLaterActivitiesModel. The
            activities completed model loaded from the datastore.

    Returns:
        PlayLaterActivities. The play later activities corresponding to the
        given model.
    """
    return user_domain.PlayLaterActivities(
        play_later_activities_model.id,
        play_later_activities_model.exploration_ids,
        play_later_activities_model.collection_ids)


def save_play_later_activities(play_later_activities):
    """Save an play later activities domain object as an
    PlayLaterActivitiesModel entity in the datastore.

    Args:
        play_later_activities: PlayLaterActivities. The play later
            activities domain object to be saved in the datastore.
    """
    play_later_activities_model = user_models.PlayLaterActivitiesModel(
        id=play_later_activities.id,
        exploration_ids=(
            play_later_activities.exploration_ids),
        collection_ids=play_later_activities.collection_ids)

    play_later_activities_model.put()


def mark_exploration_to_be_played_later(
        user_id, exploration_id, position_to_be_inserted=None):
    """Adds the exploration id to the play later list of the user at the given
    position. If the position is not specified, the exploration gets added at
    the end. If the exploration is already completed or currently being
    completed it is not added.

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be added to the play
            later list.
        position_to_be_inserted: int|None. If this is specified the exploration
            gets inserted at the given position. Otherwise it gets added at the
            end.
    """
    # Need to import learner_progress_services so that we are able to fetch the
    # ids of the completed explorations.
    from core.domain import learner_progress_services

    play_later_activities_model = user_models.PlayLaterActivitiesModel.get(
        user_id, strict=False)
    if not play_later_activities_model:
        play_later_activities_model = (
            user_models.PlayLaterActivitiesModel(id=user_id))

    subscribed_exploration_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))
    completed_exploration_ids = (
        learner_progress_services.get_all_completed_exp_ids(user_id))
    incomplete_exploration_ids = (
        learner_progress_services.get_all_incomplete_exp_ids(user_id))

    play_later_activities = get_play_later_activities_from_model(
        play_later_activities_model)

    if (exploration_id not in subscribed_exploration_ids and
            exploration_id not in completed_exploration_ids and
            exploration_id not in incomplete_exploration_ids):
        if not position_to_be_inserted:
            play_later_activities.add_exploration_id(exploration_id)
        else:
            play_later_activities.remove_exploration_id(exploration_id)
            print "Hello"
            play_later_activities.add_exploration_id(
                exploration_id, position_to_be_inserted)
        save_play_later_activities(play_later_activities)


def mark_collection_to_be_played_later(
        user_id, collection_id, position_to_be_inserted=None):
    """Adds the collection id to the play later list of the user at the given
    position. If the position is not specified, the collection gets added at
    the end. If the collection is already completed or currently being
    completed it is not added.

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be added to the play
            later list.
        position_to_be_inserted: int|None. If this is specified the collection
            gets inserted at the given position. Otherwise it gets added at
            the end.
    """
    # Need to import learner_progress_services so that we are able to fetch the
    # ids of the completed explorations.
    from core.domain import learner_progress_services

    play_later_activities_model = user_models.PlayLaterActivitiesModel.get(
        user_id, strict=False)
    if not play_later_activities_model:
        play_later_activities_model = (
            user_models.PlayLaterActivitiesModel(id=user_id))

    subscribed_collection_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))
    completed_collection_ids = (
        learner_progress_services.get_all_completed_collection_ids(user_id))
    incomplete_collection_ids = (
        learner_progress_services.get_all_incomplete_collection_ids(user_id))

    play_later_activities = get_play_later_activities_from_model(
        play_later_activities_model)

    if (collection_id not in subscribed_collection_ids and
            collection_id not in completed_collection_ids and
            collection_id not in incomplete_collection_ids):
        if not position_to_be_inserted:
            play_later_activities.add_collection_id(collection_id)
        else:
            play_later_activities.remove_collection_id(collection_id)
            play_later_activities.add_collection_id(
                collection_id, position_to_be_inserted)
        save_play_later_activities(play_later_activities)


def remove_exploration_from_play_later_list(user_id, exploration_id):
    """Removes the exploration from the play later list of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be removed.
    """
    play_later_activities_model = user_models.PlayLaterActivitiesModel.get(
        user_id, strict=False)

    if play_later_activities_model:
        play_later_activities = get_play_later_activities_from_model(
            play_later_activities_model)
        if exploration_id in play_later_activities.exploration_ids:
            play_later_activities.remove_exploration_id(exploration_id)
            save_play_later_activities(play_later_activities)


def remove_collection_from_play_later_list(user_id, collection_id):
    """Removes the collection from the play later list of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be removed.
    """
    play_later_activities_model = user_models.PlayLaterActivitiesModel.get(
        user_id, strict=False)

    if play_later_activities_model:
        play_later_activities = get_play_later_activities_from_model(
            play_later_activities_model)
        if collection_id in play_later_activities.collection_ids:
            play_later_activities.remove_collection_id(collection_id)
            save_play_later_activities(play_later_activities)


def get_all_play_later_exploration_ids(user_id):
    """Returns a list with the ids of all the explorations that are in the play
    later list of the user.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(str). A list of the ids of the explorations that are in the play
            later list of the user.
    """
    play_later_activities_model = user_models.PlayLaterActivitiesModel.get(
        user_id, strict=False)

    if play_later_activities_model:
        play_later_activities = get_play_later_activities_from_model(
            play_later_activities_model)

        return play_later_activities.exploration_ids
    else:
        return []


def get_all_play_later_collection_ids(user_id):
    """Returns a list with the ids of all the collections that are in the play
    later list of the user.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(str). A list of the ids of the collections that are in the play
            later list of the user.
    """
    play_later_activities_model = user_models.PlayLaterActivitiesModel.get(
        user_id, strict=False)

    if play_later_activities_model:
        play_later_activities = get_play_later_activities_from_model(
            play_later_activities_model)

        return play_later_activities.collection_ids
    else:
        return []
