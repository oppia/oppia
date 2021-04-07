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

"""Functions that manage rights for various user actions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from constants import constants
from core.domain import activity_services
from core.domain import rights_domain
from core.domain import role_services
from core.domain import subscription_services
from core.domain import taskqueue_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

datastore_services = models.Registry.import_datastore_services()
(collection_models, exp_models) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration
])


def get_activity_rights_from_model(activity_rights_model, activity_type):
    """Constructs an ActivityRights object from the given activity rights model.

    Args:
        activity_rights_model: ActivityRightsModel. Activity rights from the
            datastore.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.

    Returns:
        ActivityRights. The rights object created from the model.
    """

    return rights_domain.ActivityRights(
        activity_rights_model.id,
        activity_rights_model.owner_ids,
        activity_rights_model.editor_ids,
        activity_rights_model.voice_artist_ids,
        activity_rights_model.viewer_ids,
        community_owned=activity_rights_model.community_owned,
        cloned_from=(
            activity_rights_model.cloned_from
            if activity_type == constants.ACTIVITY_TYPE_EXPLORATION else None),
        status=activity_rights_model.status,
        viewable_if_private=activity_rights_model.viewable_if_private,
        first_published_msec=activity_rights_model.first_published_msec
    )


def _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message,
        commit_cmds):
    """Saves an ExplorationRights or CollectionRights domain object to the
    datastore.

    Args:
        committer_id: str. ID of the committer.
        activity_rights: ActivityRights. The rights object for the given
            activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(dict). A list of commands describing what kind of
            commit was done.
    """
    activity_rights.validate()

    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        model_cls = exp_models.ExplorationRightsModel
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        model_cls = collection_models.CollectionRightsModel
    model = model_cls.get(activity_rights.id, strict=False)

    model.owner_ids = activity_rights.owner_ids
    model.editor_ids = activity_rights.editor_ids
    model.viewer_ids = activity_rights.viewer_ids
    model.voice_artist_ids = activity_rights.voice_artist_ids
    model.community_owned = activity_rights.community_owned
    model.status = activity_rights.status
    model.viewable_if_private = activity_rights.viewable_if_private
    model.first_published_msec = activity_rights.first_published_msec

    model.commit(committer_id, commit_message, commit_cmds)


def _update_exploration_summary(activity_rights):
    """Updates the exploration summary for the activity associated with the
    given rights object.

    The ID of rights object is the same as the ID of associated activity.

    Args:
        activity_rights: ActivityRights. The rights object for the given
            activity.
    """
    # TODO(msl): Get rid of inline imports by refactoring code.
    from core.domain import exp_services
    exp_services.regenerate_exploration_and_contributors_summaries(
        activity_rights.id)


def _update_collection_summary(activity_rights):
    """Updates the collection summary for the given activity associated with
    the given rights object.

    The ID of rights object is the same as the ID of associated activity.

    Args:
        activity_rights: ActivityRights. The rights object for the given
            activity.
    """
    from core.domain import collection_services
    collection_services.regenerate_collection_and_contributors_summaries(
        activity_rights.id)


def _update_activity_summary(activity_type, activity_rights):
    """Updates the activity summary for the given activity associated with
    the given rights object.

    The ID of rights object is the same as the ID of associated activity.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.
        activity_rights: ActivityRights. The rights object for the given
            activity.
    """
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        _update_exploration_summary(activity_rights)
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        _update_collection_summary(activity_rights)


def update_activity_first_published_msec(
        activity_type, activity_id, first_published_msec):
    """Updates the first_published_msec field for the given activity.

    The caller is responsible for ensuring that this value is not already
    set before updating it.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.
        activity_id: str. ID of the activity.
        first_published_msec: float. First publication time in milliseconds
            since the Epoch.
    """
    activity_rights = _get_activity_rights(activity_type, activity_id)
    commit_cmds = [{
        'cmd': rights_domain.CMD_UPDATE_FIRST_PUBLISHED_MSEC,
        'old_first_published_msec': activity_rights.first_published_msec,
        'new_first_published_msec': first_published_msec
    }]
    activity_rights.first_published_msec = first_published_msec
    _save_activity_rights(
        feconf.SYSTEM_COMMITTER_ID, activity_rights, activity_type,
        'set first published time in msec', commit_cmds)


def create_new_exploration_rights(exploration_id, committer_id):
    """Creates a new exploration rights object and saves it to the datastore.
    Subscribes the committer to the new exploration.

    Args:
        exploration_id: str. ID of the exploration.
        committer_id: str. ID of the committer.
    """
    exploration_rights = rights_domain.ActivityRights(
        exploration_id, [committer_id], [], [], [])
    commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]

    exp_models.ExplorationRightsModel(
        id=exploration_rights.id,
        owner_ids=exploration_rights.owner_ids,
        editor_ids=exploration_rights.editor_ids,
        voice_artist_ids=exploration_rights.voice_artist_ids,
        viewer_ids=exploration_rights.viewer_ids,
        community_owned=exploration_rights.community_owned,
        status=exploration_rights.status,
        viewable_if_private=exploration_rights.viewable_if_private,
        first_published_msec=exploration_rights.first_published_msec,
    ).commit(committer_id, 'Created new exploration', commit_cmds)

    subscription_services.subscribe_to_exploration(
        committer_id, exploration_id)


def get_exploration_rights(exploration_id, strict=True):
    """Retrieves the rights for this exploration from the datastore.

    Args:
        exploration_id: str. ID of the exploration.
        strict: bool. Whether to raise an error if there is no exploration
            matching the given ID.

    Returns:
        ActivityRights. The rights object for the given exploration.

    Raises:
        EntityNotFoundError. The exploration with ID exploration_id was not
            found in the datastore.
    """
    model = exp_models.ExplorationRightsModel.get(
        exploration_id, strict=strict)
    if model is None:
        return None
    return get_activity_rights_from_model(
        model, constants.ACTIVITY_TYPE_EXPLORATION)


def get_multiple_exploration_rights_by_ids(exp_ids):
    """Returns a list of ActivityRights objects for given exploration ids.

    Args:
        exp_ids: list(str). List of exploration ids.

    Returns:
        list(ActivityRights or None). List of rights object --> ActivityRights
        objects for existing exploration or None.
    """
    exp_rights_models = exp_models.ExplorationRightsModel.get_multi(
        exp_ids)
    exp_models_list = []

    for model in exp_rights_models:
        if model is None:
            exp_models_list.append(None)
        else:
            exp_models_list.append(
                get_activity_rights_from_model(
                    model, constants.ACTIVITY_TYPE_EXPLORATION))

    return exp_models_list


def _get_activity_rights_where_user_is_owner(activity_type, user_id):
    """Returns a list of activity rights where the user is the owner.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.
        user_id: str. The id of the user.

    Returns:
        list(ActivityRights). List of domain objects where the user has some
        role.
    """
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        rights_model_class = exp_models.ExplorationRightsModel
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        rights_model_class = collection_models.CollectionRightsModel

    activity_rights_models = rights_model_class.query(
        datastore_services.any_of(
            rights_model_class.owner_ids == user_id
        )
    ).fetch()
    return [
        get_activity_rights_from_model(activity_rights_model, activity_type)
        for activity_rights_model in activity_rights_models
    ]


def get_exploration_rights_where_user_is_owner(user_id):
    """Returns a list of exploration rights where the user is the owner.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(ActivityRights). List of domain objects where the user is
        the owner.
    """
    return _get_activity_rights_where_user_is_owner(
        constants.ACTIVITY_TYPE_EXPLORATION, user_id
    )


def get_collection_rights_where_user_is_owner(user_id):
    """Returns a list of collection rights where the user is the owner.

    Args:
        user_id: str. The id of the user.

    Returns:
        list(ActivityRights). List of domain objects where the user is
        the owner.
    """
    return _get_activity_rights_where_user_is_owner(
        constants.ACTIVITY_TYPE_COLLECTION, user_id
    )


def is_exploration_private(exploration_id):
    """Returns whether exploration is private.

    Args:
        exploration_id: str. ID of the exploration.

    Returns:
        bool. Whether the exploration is private or not.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == rights_domain.ACTIVITY_STATUS_PRIVATE


def is_exploration_public(exploration_id):
    """Returns whether exploration is public.

    Args:
        exploration_id: str. ID of the exploration.

    Returns:
        bool. Whether the exploration is public.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    return exploration_rights.status == rights_domain.ACTIVITY_STATUS_PUBLIC


def is_exploration_cloned(exploration_id):
    """Returns whether the exploration is a clone of another exploration.

    Args:
        exploration_id: str. ID of the exploration.

    Returns:
        bool. Whether the exploration is a clone of another exploration.
    """
    exploration_rights = get_exploration_rights(exploration_id)
    return bool(exploration_rights.cloned_from)


def create_new_collection_rights(collection_id, committer_id):
    """Creates a new collection rights object and saves it to the datastore.
    Subscribes the committer to the new collection.

    Args:
        collection_id: str. ID of the collection.
        committer_id: str. ID of the committer.
    """
    collection_rights = rights_domain.ActivityRights(
        collection_id, [committer_id], [], [], [])
    commit_cmds = [{'cmd': rights_domain.CMD_CREATE_NEW}]

    collection_models.CollectionRightsModel(
        id=collection_rights.id,
        owner_ids=collection_rights.owner_ids,
        editor_ids=collection_rights.editor_ids,
        voice_artist_ids=collection_rights.voice_artist_ids,
        viewer_ids=collection_rights.viewer_ids,
        community_owned=collection_rights.community_owned,
        status=collection_rights.status,
        viewable_if_private=collection_rights.viewable_if_private,
        first_published_msec=collection_rights.first_published_msec
    ).commit(committer_id, 'Created new collection', commit_cmds)

    subscription_services.subscribe_to_collection(committer_id, collection_id)


def get_collection_rights(collection_id, strict=True):
    """Retrieves the rights for this collection from the datastore.

    Args:
        collection_id: str. ID of the collection.
        strict: bool. Whether to raise an error if ID is not found.

    Returns:
        ActivityRights. The rights object for the collection.

    Raises:
        EntityNotFoundError. The collection with ID collection_id is not found
            in the datastore.
    """
    model = collection_models.CollectionRightsModel.get(
        collection_id, strict=strict)
    if model is None:
        return None
    return get_activity_rights_from_model(
        model, constants.ACTIVITY_TYPE_COLLECTION)


def get_collection_owner_names(collection_id):
    """Retrieves the owners for this collection from the datastore.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        list(str). Human-readable usernames (or truncated email addresses) of
        owners for this collection.
    """
    collection_rights = get_collection_rights(collection_id)
    return user_services.get_human_readable_user_ids(
        collection_rights.owner_ids)


def is_collection_private(collection_id):
    """Returns whether the collection is private.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        bool. Whether the collection is private.
    """
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == rights_domain.ACTIVITY_STATUS_PRIVATE


def is_collection_public(collection_id):
    """Returns whether the collection is public.

    Args:
        collection_id: str. ID of the collection.

    Returns:
        bool. Whether the collection is public.
    """
    collection_rights = get_collection_rights(collection_id)
    return collection_rights.status == rights_domain.ACTIVITY_STATUS_PUBLIC


def _get_activity_rights(activity_type, activity_id):
    """Retrieves the rights object for the given activity
    based on its type.

    Args:
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.
        activity_id: str. ID of the activity.

    Returns:
        ActivityRights. The rights object associated with the given activity.

    Raises:
        Exception. The activity_type provided is unknown.
    """
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        return get_exploration_rights(activity_id, strict=False)
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        return get_collection_rights(activity_id, strict=False)
    else:
        raise Exception(
            'Cannot get activity rights for unknown activity type: %s' % (
                activity_type))


def check_can_access_activity(user, activity_rights):
    """Checks whether the user can access given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: AcitivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the given activity can be accessed by the given user.
    """
    if activity_rights is None:
        return False
    elif activity_rights.is_published():
        return bool(
            role_services.ACTION_PLAY_ANY_PUBLIC_ACTIVITY in user.actions)
    elif activity_rights.is_private():
        return bool(
            (role_services.ACTION_PLAY_ANY_PRIVATE_ACTIVITY in user.actions) or
            activity_rights.is_viewer(user.user_id) or
            activity_rights.is_owner(user.user_id) or
            activity_rights.is_editor(user.user_id) or
            activity_rights.is_voice_artist(user.user_id) or
            activity_rights.viewable_if_private)


def check_can_edit_activity(user, activity_rights):
    """Checks whether the user can edit given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the given user can edit this activity.
    """
    if activity_rights is None:
        return False

    if role_services.ACTION_EDIT_OWNED_ACTIVITY not in user.actions:
        return False

    if (activity_rights.is_owner(user.user_id) or
            activity_rights.is_editor(user.user_id)):
        return True

    if (activity_rights.community_owned or
            (role_services.ACTION_EDIT_ANY_ACTIVITY in user.actions)):
        return True

    if (activity_rights.is_published() and
            role_services.ACTION_EDIT_ANY_PUBLIC_ACTIVITY in user.actions):
        return True

    return False


def check_can_voiceover_activity(user, activity_rights):
    """Checks whether the user can voiceover given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the given user can voiceover this activity.
    """
    if activity_rights is None:
        return False

    if role_services.ACTION_EDIT_OWNED_ACTIVITY not in user.actions:
        return False

    if (activity_rights.is_owner(user.user_id) or
            activity_rights.is_editor(user.user_id) or
            activity_rights.is_voice_artist(user.user_id)):
        return True

    if (activity_rights.community_owned or
            role_services.ACTION_EDIT_ANY_ACTIVITY in user.actions):
        return True

    if (activity_rights.is_published() and
            role_services.ACTION_EDIT_ANY_PUBLIC_ACTIVITY in user.actions):
        return True

    return False


def check_can_save_activity(user, activity_rights):
    """Checks whether the user can save given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the user can save given activity.
    """

    return (check_can_edit_activity(user, activity_rights) or (
        check_can_voiceover_activity(user, activity_rights)))


def check_can_delete_activity(user, activity_rights):
    """Checks whether the user can delete given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the user can delete given activity.
    """
    if activity_rights is None:
        return False

    if role_services.ACTION_DELETE_ANY_ACTIVITY in user.actions:
        return True
    elif (activity_rights.is_private() and
          (role_services.ACTION_DELETE_OWNED_PRIVATE_ACTIVITY in user.actions)
          and activity_rights.is_owner(user.user_id)):
        return True
    elif (activity_rights.is_published() and
          (role_services.ACTION_DELETE_ANY_PUBLIC_ACTIVITY in user.actions)):
        return True

    return False


def check_can_modify_activity_roles(user, activity_rights):
    """Checks whether the user can modify roles for given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the user can modify roles for given activity.
    """
    if activity_rights is None:
        return False

    if (activity_rights.community_owned or
            activity_rights.cloned_from):
        return False

    if (role_services.ACTION_MODIFY_ROLES_FOR_ANY_ACTIVITY in
            user.actions):
        return True
    if (role_services.ACTION_MODIFY_ROLES_FOR_OWNED_ACTIVITY in
            user.actions):
        if activity_rights.is_owner(user.user_id):
            return True
    return False


def check_can_release_ownership(user, activity_rights):
    """Checks whether the user can release ownership for given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the user can release ownership for given activity.
    """
    if activity_rights is None:
        return False

    if activity_rights.is_private():
        return False

    return check_can_modify_activity_roles(
        user, activity_rights)


def check_can_publish_activity(user, activity_rights):
    """Checks whether the user can publish given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the user can publish given activity.
    """
    if activity_rights is None:
        return False

    if activity_rights.cloned_from:
        return False

    if activity_rights.is_published():
        return False

    if role_services.ACTION_PUBLISH_ANY_ACTIVITY in user.actions:
        return True

    if role_services.ACTION_PUBLISH_OWNED_ACTIVITY in user.actions:
        if activity_rights.is_owner(user.user_id):
            return True

    return False


def check_can_unpublish_activity(user, activity_rights):
    """Checks whether the user can unpublish given activity.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        activity_rights: ActivityRights or None. Rights object for the given
            activity.

    Returns:
        bool. Whether the user can unpublish given activity.
    """
    if activity_rights is None:
        return False

    if activity_rights.community_owned:
        return False

    if activity_rights.is_published():
        if role_services.ACTION_UNPUBLISH_ANY_PUBLIC_ACTIVITY in user.actions:
            return True
    return False


def _assign_role(
        committer, assignee_id, new_role, activity_id, activity_type):
    """Assigns a new role to the user.

    Args:
        committer: UserActionsInfo. UserActionInfo object for the user
            who is performing the action.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role: One of
            ROLE_OWNER,
            ROLE_EDITOR,
            ROLE_VOICE_ARTIST,
            ROLE_VIEWER.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.

    Raises:
        Exception. The committer does not have rights to modify a role.
        Exception. The user already owns the activity.
        Exception. The user can already edit the activity.
        Exception. The user can already voiceover the activity.
        Exception. The activity is already publicly editable.
        Exception. The activity is already publicly translatable.
        Exception. The user can already view the activity.
        Exception. The activity is already publicly viewable.
        Exception. The role is invalid.
    """
    committer_id = committer.user_id
    activity_rights = _get_activity_rights(activity_type, activity_id)

    if not check_can_modify_activity_roles(committer, activity_rights):
        logging.error(
            'User %s tried to allow user %s to be a(n) %s of activity %s '
            'but was refused permission.' % (
                committer_id, assignee_id, new_role, activity_id))
        raise Exception(
            'UnauthorizedUserException: Could not assign new role.')

    assignee_username = user_services.get_username(assignee_id)
    old_role = rights_domain.ROLE_NONE

    if new_role == rights_domain.ROLE_OWNER:
        if activity_rights.is_owner(assignee_id):
            raise Exception('This user already owns this %s.' % activity_type)

        activity_rights.owner_ids.append(assignee_id)

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = rights_domain.ROLE_VIEWER
        if assignee_id in activity_rights.editor_ids:
            activity_rights.editor_ids.remove(assignee_id)
            old_role = rights_domain.ROLE_EDITOR
        if assignee_id in activity_rights.voice_artist_ids:
            activity_rights.voice_artist_ids.remove(assignee_id)
            old_role = rights_domain.ROLE_VOICE_ARTIST

    elif new_role == rights_domain.ROLE_EDITOR:
        if (activity_rights.is_editor(assignee_id) or
                activity_rights.is_owner(assignee_id)):
            raise Exception(
                'This user already can edit this %s.' % activity_type)

        activity_rights.editor_ids.append(assignee_id)

        if assignee_id in activity_rights.voice_artist_ids:
            activity_rights.voice_artist_ids.remove(assignee_id)
            old_role = rights_domain.ROLE_VOICE_ARTIST

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = rights_domain.ROLE_VIEWER

    elif new_role == rights_domain.ROLE_VOICE_ARTIST:
        if (activity_rights.is_editor(assignee_id) or
                activity_rights.is_voice_artist(assignee_id) or
                activity_rights.is_owner(assignee_id)):
            raise Exception(
                'This user already can voiceover this %s.' % activity_type)

        activity_rights.voice_artist_ids.append(assignee_id)

        if assignee_id in activity_rights.viewer_ids:
            activity_rights.viewer_ids.remove(assignee_id)
            old_role = rights_domain.ROLE_VIEWER

    elif new_role == rights_domain.ROLE_VIEWER:
        if (activity_rights.is_owner(assignee_id) or
                activity_rights.is_editor(assignee_id) or
                activity_rights.is_viewer(assignee_id)):
            raise Exception(
                'This user already can view this %s.' % activity_type)

        if activity_rights.status != rights_domain.ACTIVITY_STATUS_PRIVATE:
            raise Exception(
                'Public %ss can be viewed by anyone.' % activity_type)

        activity_rights.viewer_ids.append(assignee_id)

    else:
        raise Exception('Invalid role: %s' % new_role)

    commit_message = rights_domain.ASSIGN_ROLE_COMMIT_MESSAGE_TEMPLATE % (
        assignee_username, old_role, new_role)
    commit_cmds = [{
        'cmd': rights_domain.CMD_CHANGE_ROLE,
        'assignee_id': assignee_id,
        'old_role': old_role,
        'new_role': new_role
    }]

    _save_activity_rights(
        committer_id, activity_rights, activity_type,
        commit_message, commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _deassign_role(committer, removed_user_id, activity_id, activity_type):
    """Deassigns given user from their current role in the activity.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user
            who is performing the action.
        removed_user_id: str. ID of the user who is being deassigned from
            the activity.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.

    Raises:
        Exception. UnauthorizedUserException: Could not deassign role.
        Exception. This user does not have any role for the given activity.
    """
    committer_id = committer.user_id
    activity_rights = _get_activity_rights(activity_type, activity_id)

    if not check_can_modify_activity_roles(committer, activity_rights):
        logging.error(
            'User %s tried to remove user %s from an activity %s '
            'but was refused permission.' % (
                committer_id, removed_user_id, activity_id))
        raise Exception(
            'UnauthorizedUserException: Could not deassign role.')

    if activity_rights.is_owner(removed_user_id):
        old_role = rights_domain.ROLE_OWNER
        activity_rights.owner_ids.remove(removed_user_id)
    elif activity_rights.is_editor(removed_user_id):
        old_role = rights_domain.ROLE_EDITOR
        activity_rights.editor_ids.remove(removed_user_id)
    elif activity_rights.is_voice_artist(removed_user_id):
        old_role = rights_domain.ROLE_VOICE_ARTIST
        activity_rights.voice_artist_ids.remove(removed_user_id)
    elif activity_rights.is_viewer(removed_user_id):
        old_role = rights_domain.ROLE_VIEWER
        activity_rights.viewer_ids.remove(removed_user_id)
    else:
        raise Exception(
            'This user does not have any role in %s with ID %s'
            % (activity_type, activity_id))

    assignee_username = user_services.get_usernames(removed_user_id)[0]
    if assignee_username is None:
        assignee_username = 'ANONYMOUS'
    commit_message = 'Remove %s from role %s for %s' % (
        assignee_username, old_role, activity_type)
    commit_cmds = [{
        'cmd': rights_domain.CMD_REMOVE_ROLE,
        'removed_user_id': removed_user_id,
        'old_role': old_role,
    }]

    _save_activity_rights(
        committer_id,
        activity_rights,
        activity_type,
        commit_message,
        commit_cmds
    )
    _update_activity_summary(activity_type, activity_rights)


def _release_ownership_of_activity(committer, activity_id, activity_type):
    """Releases ownership of the given activity to the community.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the user who
            is performing the action.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.

    Raise:
        Exception. The committer does not have release rights.
    """
    committer_id = committer.user_id
    activity_rights = _get_activity_rights(activity_type, activity_id)

    if not check_can_release_ownership(committer, activity_rights):
        logging.error(
            'User %s tried to release ownership of %s %s but was '
            'refused permission.' % (committer_id, activity_type, activity_id))
        raise Exception(
            'The ownership of this %s cannot be released.' % activity_type)

    activity_rights.community_owned = True
    activity_rights.owner_ids = []
    activity_rights.editor_ids = []
    activity_rights.viewer_ids = []
    commit_cmds = [{
        'cmd': rights_domain.CMD_RELEASE_OWNERSHIP,
    }]

    _save_activity_rights(
        committer_id, activity_rights, activity_type,
        '%s ownership released to the community.' % activity_type, commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _change_activity_status(
        committer_id, activity_id, activity_type, new_status, commit_message):
    """Changes the status of the given activity.

    Args:
        committer_id: str. ID of the user who is performing the update action.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.
        new_status: str. The new status of the activity.
        commit_message: str. The human-written commit message for this change.
    """
    activity_rights = _get_activity_rights(activity_type, activity_id)
    old_status = activity_rights.status
    activity_rights.status = new_status
    if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
        cmd_type = rights_domain.CMD_CHANGE_EXPLORATION_STATUS
    elif activity_type == constants.ACTIVITY_TYPE_COLLECTION:
        cmd_type = rights_domain.CMD_CHANGE_COLLECTION_STATUS
    commit_cmds = [{
        'cmd': cmd_type,
        'old_status': old_status,
        'new_status': new_status
    }]

    if new_status != rights_domain.ACTIVITY_STATUS_PRIVATE:
        activity_rights.viewer_ids = []
        if activity_rights.first_published_msec is None:
            activity_rights.first_published_msec = (
                utils.get_current_time_in_millisecs())

    _save_activity_rights(
        committer_id, activity_rights, activity_type, commit_message,
        commit_cmds)
    _update_activity_summary(activity_type, activity_rights)


def _publish_activity(committer, activity_id, activity_type):
    """Publishes the given activity.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.

    Raises:
        Exception. The committer does not have rights to publish the
            activity.
    """
    committer_id = committer.user_id
    activity_rights = _get_activity_rights(activity_type, activity_id)

    if not check_can_publish_activity(committer, activity_rights):
        logging.error(
            'User %s tried to publish %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be published.' % activity_type)

    _change_activity_status(
        committer_id,
        activity_id,
        activity_type,
        rights_domain.ACTIVITY_STATUS_PUBLIC,
        '%s published.' % activity_type
    )


def _unpublish_activity(committer, activity_id, activity_type):
    """Unpublishes the given activity.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        activity_id: str. ID of the activity.
        activity_type: str. The type of activity. Possible values:
            constants.ACTIVITY_TYPE_EXPLORATION,
            constants.ACTIVITY_TYPE_COLLECTION.

    Raises:
        Exception. The committer does not have rights to unpublish the
            activity.
    """
    committer_id = committer.user_id
    activity_rights = _get_activity_rights(activity_type, activity_id)

    if not check_can_unpublish_activity(committer, activity_rights):
        logging.error(
            'User %s tried to unpublish %s %s but was refused '
            'permission.' % (committer_id, activity_type, activity_id))
        raise Exception('This %s cannot be unpublished.' % activity_type)

    _change_activity_status(
        committer_id,
        activity_id,
        activity_type,
        rights_domain.ACTIVITY_STATUS_PRIVATE,
        '%s unpublished.' % activity_type
    )

    activity_services.remove_featured_activity(activity_type, activity_id)


# Rights functions for activities.
def assign_role_for_exploration(
        committer, exploration_id, assignee_id, new_role):
    """Assigns a user to the given role and subscribes the assignee to future
    exploration updates.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
        committer: UserActionsInfo. The UserActionsInfo object for the
            committer.
        exploration_id: str. ID of the exploration.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role: One of
            ROLE_OWNER,
            ROLE_EDITOR,
            ROLE_VOICE_ARTIST.

    Raises:
        Exception. This could potentially throw an exception from
            _assign_role.
    """
    _assign_role(
        committer, assignee_id, new_role, exploration_id,
        constants.ACTIVITY_TYPE_EXPLORATION)
    if new_role in [
            rights_domain.ROLE_OWNER,
            rights_domain.ROLE_EDITOR,
            rights_domain.ROLE_VOICE_ARTIST
    ]:
        subscription_services.subscribe_to_exploration(
            assignee_id, exploration_id)


def deassign_role_for_exploration(committer, exploration_id, removed_user_id):
    """Deassigns a user from a given exploration.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
        committer: UserActionsInfo. The UserActionsInfo object for the
            committer.
        exploration_id: str. ID of the exploration.
        removed_user_id: str. ID of the user whom is being deassigned from
            the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _deassign_role.
    """
    _deassign_role(
        committer,
        removed_user_id,
        exploration_id,
        constants.ACTIVITY_TYPE_EXPLORATION
    )


def release_ownership_of_exploration(committer, exploration_id):
    """Releases ownership of the given exploration to the community.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _release_ownership_of_activity.
    """
    _release_ownership_of_activity(
        committer, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


def set_private_viewability_of_exploration(
        committer, exploration_id, viewable_if_private):
    """Sets the viewable_if_private attribute for the given exploration's rights
    object.

    If viewable_if_private is True, this allows a private exploration
    to be viewed by anyone with the link.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        exploration_id: str. ID of the exploration.
        viewable_if_private: bool. Whether the exploration should be made
            viewable (by anyone with the link).

    Raises:
        Exception. The committer does not have the permission to perform change
            action.
        Exception. If the viewable_if_private property is already as desired.
    """
    committer_id = committer.user_id
    exploration_rights = get_exploration_rights(exploration_id)

    # The user who can publish activity can change its private viewability.
    if not check_can_publish_activity(committer, exploration_rights):
        logging.error(
            'User %s tried to change private viewability of exploration %s '
            'but was refused permission.' % (committer_id, exploration_id))
        raise Exception(
            'The viewability status of this exploration cannot be changed.')

    old_viewable_if_private = exploration_rights.viewable_if_private
    if old_viewable_if_private == viewable_if_private:
        raise Exception(
            'Trying to change viewability status of this exploration to %s, '
            'but that is already the current value.' % viewable_if_private)

    exploration_rights.viewable_if_private = viewable_if_private
    commit_cmds = [{
        'cmd': rights_domain.CMD_CHANGE_PRIVATE_VIEWABILITY,
        'old_viewable_if_private': old_viewable_if_private,
        'new_viewable_if_private': viewable_if_private,
    }]
    commit_message = (
        'Made exploration viewable to anyone with the link.'
        if viewable_if_private else
        'Made exploration viewable only to invited playtesters.')

    _save_activity_rights(
        committer_id, exploration_rights, constants.ACTIVITY_TYPE_EXPLORATION,
        commit_message, commit_cmds)
    _update_exploration_summary(exploration_rights)


def publish_exploration(committer, exploration_id):
    """Publishes the given exploration.

    It is the responsibility of the caller to check that the exploration is
    valid prior to publication.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _publish_activity.
    """
    _publish_activity(
        committer, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)


def unpublish_exploration(committer, exploration_id):
    """Unpublishes the given exploration.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        exploration_id: str. ID of the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _unpublish_activity.
    """
    _unpublish_activity(
        committer, exploration_id, constants.ACTIVITY_TYPE_EXPLORATION)
    taskqueue_services.defer(
        taskqueue_services.FUNCTION_ID_DELETE_EXPS_FROM_ACTIVITIES,
        taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS, [exploration_id])


# Rights functions for collections.
def assign_role_for_collection(
        committer, collection_id, assignee_id, new_role):
    """Assign the given user to the given role and subscribes the assignee
    to future collection updates.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        collection_id: str. ID of the collection.
        assignee_id: str. ID of the user whose role is being changed.
        new_role: str. The name of the new role: One of
            ROLE_OWNER,
            ROLE_EDITOR.

    Raises:
        Exception. This could potentially throw an exception from
            _assign_role.
    """
    _assign_role(
        committer, assignee_id, new_role, collection_id,
        constants.ACTIVITY_TYPE_COLLECTION)
    if new_role in [rights_domain.ROLE_OWNER, rights_domain.ROLE_EDITOR]:
        subscription_services.subscribe_to_collection(
            assignee_id, collection_id)


def deassign_role_for_collection(committer, collection_id, removed_user_id):
    """Deassigns a user from a given collection.

    The caller should ensure that assignee_id corresponds to a valid user in
    the system.

    Args:
        committer: UserActionsInfo. The UserActionsInfo object for the
            committer.
        collection_id: str. ID of the collection.
        removed_user_id: str. ID of the user whom is being deassigned from
            the exploration.

    Raises:
        Exception. This could potentially throw an exception from
            _deassign_role.
    """
    _deassign_role(
        committer,
        removed_user_id,
        collection_id,
        constants.ACTIVITY_TYPE_COLLECTION
    )


def release_ownership_of_collection(committer, collection_id):
    """Releases ownership of the given collection to the community.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _release_ownership_of_activity.
    """
    _release_ownership_of_activity(
        committer, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def publish_collection(committer, collection_id):
    """Publishes the given collection.

    It is the responsibility of the caller to check that the collection is
    valid prior to publication.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _publish_activity.
    """
    _publish_activity(
        committer, collection_id, constants.ACTIVITY_TYPE_COLLECTION)


def unpublish_collection(committer, collection_id):
    """Unpublishes the given collection.

    Args:
        committer: UserActionsInfo. UserActionsInfo object for the committer.
        collection_id: str. ID of the collection.

    Raises:
        Exception. This could potentially throw an exception from
            _unpublish_activity.
    """
    _unpublish_activity(
        committer, collection_id, constants.ACTIVITY_TYPE_COLLECTION)
