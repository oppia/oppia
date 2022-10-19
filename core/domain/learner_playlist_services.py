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

"""Services for the learner playlist feature of the learner dashboard."""

from __future__ import annotations

from core import feconf
from core.domain import subscription_services
from core.domain import user_domain
from core.platform import models

from typing import Final, List, Optional, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])

MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT: Final = (
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT
)


def get_learner_playlist_from_model(
    learner_playlist_model: user_models.LearnerPlaylistModel
) -> user_domain.LearnerPlaylist:
    """Returns the learner playlist domain object given the learner playlist
    model loaded from the datastore.

    Args:
        learner_playlist_model: LearnerPlaylistModel. The
            learner playlist model from the datastore.

    Returns:
        LearnerPlaylist. The learner playlist domain object corresponding to the
        given model.
    """
    return user_domain.LearnerPlaylist(
        learner_playlist_model.id,
        learner_playlist_model.exploration_ids,
        learner_playlist_model.collection_ids)


def save_learner_playlist(
    learner_playlist: user_domain.LearnerPlaylist
) -> None:
    """Save a learner playlist domain object as an LearnerPlaylistModel entity
    in the datastore.

    Args:
        learner_playlist: LearnerPlaylist. The learner playlist domain object to
            be saved in the datastore.
    """
    learner_playlist_dict = {
        'exploration_ids': learner_playlist.exploration_ids,
        'collection_ids': learner_playlist.collection_ids
    }

    learner_playlist_model = (user_models.LearnerPlaylistModel.get_by_id(
        learner_playlist.id))
    if learner_playlist_model is not None:
        learner_playlist_model.populate(**learner_playlist_dict)
        learner_playlist_model.update_timestamps()
        learner_playlist_model.put()
    else:
        learner_playlist_dict['id'] = learner_playlist.id
        user_models.LearnerPlaylistModel(**learner_playlist_dict).put()


def mark_exploration_to_be_played_later(
    user_id: str,
    exploration_id: str,
    position_to_be_inserted: Optional[int] = None
) -> Tuple[bool, bool]:
    """Adds the exploration id to the learner playlist of the user at the given
    position. If the position is not specified, the exploration gets added at
    the end. If the exploration is created or has been edited by the user it is
    not added as these appear on the creator dashboard of the creator. The
    maximum limit of the learner playlist is
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT. If the count exceeds
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT, the exploration is not added.

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be added to the
            learner playlist.
        position_to_be_inserted: int|None. If this is specified the exploration
            gets inserted at the given position. Otherwise it gets added at the
            end.

    Returns:
        (bool, bool). The first boolean indicates whether the playlist limit
        of the user has been exceeded, and the second boolean indicates
        whether the exploration is among one of the created or edited
        explorations of the user.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)
    if not learner_playlist_model:
        learner_playlist_model = (
            user_models.LearnerPlaylistModel(id=user_id))

    subscribed_exploration_ids = (
        subscription_services.get_exploration_ids_subscribed_to(user_id))

    learner_playlist = get_learner_playlist_from_model(
        learner_playlist_model)

    playlist_limit_exceeded = False
    exp_belongs_to_subscribed_explorations = False
    if exploration_id not in subscribed_exploration_ids:
        exploration_ids_count = len(learner_playlist.exploration_ids)
        if position_to_be_inserted is None:
            if exploration_id not in learner_playlist.exploration_ids:
                if exploration_ids_count < MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT:
                    learner_playlist.add_exploration_id_to_list(exploration_id)
                else:
                    playlist_limit_exceeded = True
        else:
            if exploration_id not in learner_playlist.exploration_ids:
                if exploration_ids_count < MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT:
                    learner_playlist.insert_exploration_id_at_given_position(
                        exploration_id, position_to_be_inserted)
                else:
                    playlist_limit_exceeded = True
            else:
                learner_playlist.remove_exploration_id(exploration_id)
                learner_playlist.insert_exploration_id_at_given_position(
                    exploration_id, position_to_be_inserted)
        save_learner_playlist(learner_playlist)
    else:
        exp_belongs_to_subscribed_explorations = True

    return playlist_limit_exceeded, exp_belongs_to_subscribed_explorations


def mark_collection_to_be_played_later(
    user_id: str,
    collection_id: str,
    position_to_be_inserted: Optional[int] = None
) -> Tuple[bool, bool]:
    """Adds the collection id to the learner playlist of the user at the given
    position. If the position is not specified, the collection gets added at
    the end. If the collection is created or has been edited by the user it is
    not added as these appear on the creator dashboard of the creator. The
    maximum limit of the learner playlist is
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT. If the count exceeds
    feconf.MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT, the collection is not added.

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be added to the
            learner playlist.
        position_to_be_inserted: int|None. If this is specified the collection
            gets inserted at the given position. Otherwise it gets added at
            the end.

    Returns:
        (bool, bool). The first boolean indicates whether the playlist limit of
        the user has been exceeded, and the second boolean indicates whether the
        collection is among one of the created or edited collections of the
        user.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)
    if not learner_playlist_model:
        learner_playlist_model = (
            user_models.LearnerPlaylistModel(id=user_id))

    subscribed_collection_ids = (
        subscription_services.get_collection_ids_subscribed_to(user_id))

    learner_playlist = get_learner_playlist_from_model(
        learner_playlist_model)

    playlist_limit_exceeded = False
    collection_belongs_to_subscribed_collections = False
    if collection_id not in subscribed_collection_ids:
        collection_ids_count = len(learner_playlist.collection_ids)
        if position_to_be_inserted is None:
            if collection_id not in learner_playlist.collection_ids:
                if collection_ids_count < MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT:
                    learner_playlist.add_collection_id_to_list(collection_id)
                else:
                    playlist_limit_exceeded = True
        else:
            if collection_id not in learner_playlist.collection_ids:
                if collection_ids_count < MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT:
                    learner_playlist.insert_collection_id_at_given_position(
                        collection_id, position_to_be_inserted)
                else:
                    playlist_limit_exceeded = True
            else:
                learner_playlist.remove_collection_id(collection_id)
                learner_playlist.insert_collection_id_at_given_position(
                    collection_id, position_to_be_inserted)
        save_learner_playlist(learner_playlist)
    else:
        collection_belongs_to_subscribed_collections = True

    return playlist_limit_exceeded, collection_belongs_to_subscribed_collections


def remove_exploration_from_learner_playlist(
    user_id: str, exploration_id: str
) -> None:
    """Removes the exploration from the learner playlist of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        exploration_id: str. The id of the exploration to be removed.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)

    if learner_playlist_model:
        learner_playlist = get_learner_playlist_from_model(
            learner_playlist_model)
        if exploration_id in learner_playlist.exploration_ids:
            learner_playlist.remove_exploration_id(exploration_id)
            save_learner_playlist(learner_playlist)


def remove_collection_from_learner_playlist(
    user_id: str, collection_id: str
) -> None:
    """Removes the collection from the learner playlist of the user
    (if present).

    Args:
        user_id: str. The id of the user.
        collection_id: str. The id of the collection to be removed.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)

    if learner_playlist_model:
        learner_playlist = get_learner_playlist_from_model(
            learner_playlist_model)
        if collection_id in learner_playlist.collection_ids:
            learner_playlist.remove_collection_id(collection_id)
            save_learner_playlist(learner_playlist)


def get_all_exp_ids_in_learner_playlist(user_id: str) -> List[str]:
    """Returns a list with the ids of all the explorations that are in the
    playlist of the user.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(str). A list of the ids of the explorations that are in the
        learner playlist of the user.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)

    if learner_playlist_model:
        learner_playlist = get_learner_playlist_from_model(
            learner_playlist_model)

        return learner_playlist.exploration_ids
    else:
        return []


def get_all_collection_ids_in_learner_playlist(user_id: str) -> List[str]:
    """Returns a list with the ids of all the collections that are in the
    playlist of the user.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(str). A list of the ids of the collections that are in the
        learner playlist of the user.
    """
    learner_playlist_model = user_models.LearnerPlaylistModel.get(
        user_id, strict=False)

    if learner_playlist_model:
        learner_playlist = get_learner_playlist_from_model(
            learner_playlist_model)

        return learner_playlist.collection_ids
    else:
        return []
